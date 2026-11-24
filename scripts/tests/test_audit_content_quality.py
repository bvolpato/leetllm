from __future__ import annotations

import contextlib
import importlib.util
import io
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest
from unittest.mock import patch
import zlib

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

SCRIPT_PATH = SCRIPTS_DIR / "audit-content-quality.py"
SPEC = importlib.util.spec_from_file_location("audit_content_quality", SCRIPT_PATH)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _make_minimal_png(width: int, height: int) -> bytes:
    """Build a valid PNG header + empty IDAT/IEND suitable for dimension parsing tests."""

    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IEND", b"")


def _write_article(
    content_root: Path,
    rel_path: str,
    body: str,
    *,
    visibility: dict[str, bool] | None = None,
    section: str = "Agents & Tooling",
    category: str = "Agent Architecture",
    short_description: str = "Clear technical overview for engineers.",
) -> Path:
    article_dir = content_root / rel_path
    article_dir.mkdir(parents=True, exist_ok=True)
    metadata = {
        "title": "Sample Lesson",
        "section": section,
        "category": category,
        "shortDescription": short_description,
        "visibility": visibility or {"website": True, "book": True},
    }
    (article_dir / "content.md").write_text(
        f"---\n{json.dumps(metadata, indent=2)}\n---\n\n{body}\n",
        encoding="utf-8",
    )
    return article_dir


def _rich_prose_paragraph(seed: int) -> str:
    return (
        f"Paragraph {seed} introduces how gradients flow backward through chained linear layers, "
        "which keeps parameter updates aligned with the training objective. "
        "We compare step sizes against validation loss on a held-out split to confirm convergence, e.g. under 0.05 error. "
        "That three-sentence structure maintains rhythm and prevents abrupt fragmentation."
    )


class AuditContentQualityTests(unittest.TestCase):
    """Unit tests covering all rules, allowlists, dual views, TSX checks, and CLI flags."""

    def test_dual_edition_visibility_detects_exclusive_and_shared_defects(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            body = "\n\n".join(
                [
                    "Shared opening prose without any banned phrasing.",
                    "<!-- leetllm: audience:book:start -->\nThis book path uses RUN-842.\n<!-- leetllm: audience:book:end -->",
                    "<!-- leetllm: edition:reference:start -->\nReference path mentions DeployBuddy.\n<!-- leetllm: edition:reference:end -->",
                    "<!-- leetllm: audience:website:start -->\nShared website section.\n<!-- leetllm: audience:website:end -->",
                ]
            )
            _write_article(root, "agents/dual-view", body, visibility={"website": True, "book": True})
            report = MODULE.run_audit(content_root=root, target_path="agents/dual-view")

            by_msg = {d["message"]: d for d in report["defects"]}
            book_defect = next(v for m, v in by_msg.items() if "RUN-842" in m)
            ref_defect = next(v for m, v in by_msg.items() if "DeployBuddy" in m)
            self.assertEqual(book_defect["views"], ["book/reader"])
            self.assertEqual(ref_defect["views"], ["website/reference"])

            # Book-only defect is ignored when visibility disables book output.
            _write_article(root, "agents/web-only", body, visibility={"website": True, "book": False})
            web_report = MODULE.run_audit(content_root=root, target_path="agents/web-only")
            messages = " ".join(d["message"] for d in web_report["defects"])
            self.assertNotIn("RUN-842", messages)
            self.assertIn("DeployBuddy", messages)

    def test_hard_banned_curly_apostrophe_and_emdash_scope(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            # Curly apostrophe U+2019 in "the film's variant" and emdash in prose.
            body_bad = (
                "Notice the film\u2019s variant fails silently.\n\n"
                "Prose with an unpermitted emdash \u2014 right here.\n\n"
                "Inline code `\u2014` is allowed.\n\n"
                "```python\n"
                "sep = '\u2014'  # code fences allow emdash\n"
                "```\n"
            )
            _write_article(root, "foundations/banned-test", body_bad)
            report = MODULE.run_audit(content_root=root, target_path="foundations/banned-test")
            cats = [d["category"] for d in report["defects"]]
            self.assertIn("hard_banned_string", cats)
            self.assertIn("emdash_in_prose", cats)
            banned = next(d for d in report["defects"] if d["category"] == "hard_banned_string")
            self.assertIn("the film's variant", banned["metrics"]["matches"])
            emdash = next(d for d in report["defects"] if d["category"] == "emdash_in_prose")
            self.assertEqual(emdash["metrics"]["emdash_line_count"], 1)

            # Verify clean code-only emdash + no banned strings passes completely.
            body_clean = (
                "Clear prose explains token indexing without disallowed phrasing.\n\n"
                "Inline symbol `\u2014` stays inside code.\n\n"
                "```python\nline = '\u2014'\n```\n"
            )
            _write_article(root, "foundations/clean-test", body_clean)
            clean_report = MODULE.run_audit(content_root=root, target_path="foundations/clean-test")
            self.assertEqual(clean_report["summary"]["blocking_defects"], 0)

    def test_bureaucratic_dialect_density_and_allowlists(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            infected_prose = (
                "The fixture admits each boundary contract receipt from supplied provenance authority. " * 4
                + "Meanwhile normal words explain how requests move through a queue cleanly."
            )
            _write_article(root, "agents/dialect-infected", infected_prose)
            bad_report = MODULE.run_audit(content_root=root, target_path="agents/dialect-infected")
            self.assertIn("bureaucratic_dialect", [d["category"] for d in bad_report["defects"]])

            # Global phrase exemptions: decision boundary + pytest fixture should not count.
            exempt_phrases = (
                "We inspect the decision boundary across classes using a pytest fixture in unit tests. " * 6
            )
            _write_article(root, "ml/decision-boundary-lesson", exempt_phrases)
            phrase_report = MODULE.run_audit(content_root=root, target_path="ml/decision-boundary-lesson")
            self.assertNotIn("bureaucratic_dialect", [d["category"] for d in phrase_report["defects"]])

            # Explicit slug allowlist: enterprise-rag-security-rbac-access-control allows contract/boundary/authority.
            security_prose = (
                "The authority enforces an access boundary and tenant contract across vector shards. " * 8
            )
            _write_article(root, "retrieval/enterprise-rag-security-rbac-access-control", security_prose)
            sec_report = MODULE.run_audit(
                content_root=root,
                target_path="retrieval/enterprise-rag-security-rbac-access-control",
            )
            self.assertNotIn("bureaucratic_dialect", [d["category"] for d in sec_report["defects"]])

    def test_punchy_short_paragraphs_are_not_penalized_and_nono_warnings_surface(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            short_paras = [
                f"Step {i} computes a single dot product quickly. Outputs stay compact."
                for i in range(12)
            ]
            body = "\n\n".join(short_paras)
            _write_article(root, "agents/punchy-prose", body)
            report = MODULE.run_audit(content_root=root, target_path="agents/punchy-prose")
            cats = {d["category"] for d in report["defects"]}
            self.assertNotIn("staccato_choppiness", cats)
            self.assertEqual(report["summary"]["total_defects"], 0)

            # Repeated prediction prompts warn without blocking.
            prompt_body = (
                "Before running the loop, inspect initial weights.\n\n"
                "Before reading the trace, predict the loss.\n\n"
                "Before checking the plot, guess the gradient.\n"
            )
            _write_article(root, "agents/prompt-spam", prompt_body)
            prompt_report = MODULE.run_audit(content_root=root, target_path="agents/prompt-spam")
            self.assertIn("prediction_prompt_spam", {d["category"] for d in prompt_report["defects"]})
            self.assertEqual(prompt_report["summary"]["blocking_defects"], 0)
            with patch.object(MODULE, "DEFAULT_CONTENT_ROOT", root), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(MODULE.main(["--path", "agents/prompt-spam", "--strict"]), 0)

            # Lawyer disclaimers, non-ops SOC2 boilerplate, and ephemeral changelogs emit warnings (non-blocking).
            nono_body = (
                "This tiny example does not prove convergence and is not a guarantee of accuracy.\n\n"
                "At 09:12 ticket #48291 triggered an escalation workflow with a strict policy gate, "
                "audit ledger, and staged rollout rollback review. "
                "The policy gate and audit ledger blocked the rollout again.\n\n"
                "As of TRL 1.17.1 (rechecked Nov 4, 2026), the trainer defaults changed.\n"
            )
            _write_article(
                root,
                "foundations/linear-regression-nono",
                nono_body,
                section="ML Algorithms & Evaluation",
            )
            nono_report = MODULE.run_audit(content_root=root, target_path="foundations/linear-regression-nono")
            nono_cats = {d["category"] for d in nono_report["defects"]}
            self.assertIn("lawyer_disclaimer_spam", nono_cats)
            self.assertIn("non_ops_soc2_boilerplate", nono_cats)
            self.assertIn("ephemeral_changelog_prose", nono_cats)
            self.assertEqual(nono_report["summary"]["blocking_defects"], 0)

            # Domain-native ML terms (RL policy gradients, LSTM forget/input/output gates) do not trigger SOC2 warning.
            ml_native_body = (
                "An LSTM cell uses an input gate, a forget gate, and an output gate to regulate memory flow. "
                "In policy gradient methods, the learned policy updates along the policy loss using RL rollouts.\n"
            ) * 3
            _write_article(
                root,
                "fundamentals/lstm-and-rl",
                ml_native_body,
                section="Transformer Deep Dives",
            )
            ml_report = MODULE.run_audit(content_root=root, target_path="fundamentals/lstm-and-rl")
            self.assertNotIn("non_ops_soc2_boilerplate", {d["category"] for d in ml_report["defects"]})

    def test_from_scratch_computation_does_not_require_a_library_import(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            body = (
                "Each contribution is an input multiplied by its weight. Adding the bias gives the neuron's score.\n\n"
                "```python\n"
                "inputs = [2.0, 3.0]\n"
                "weights = [0.5, -0.25]\n"
                "score = sum(x * w for x, w in zip(inputs, weights)) + 0.1\n"
                "print(score)\n"
                "```\n"
            )
            _write_article(root, "foundations/scalar-neuron", body, section="ML Algorithms & Evaluation")
            report = MODULE.run_audit(content_root=root, target_path="foundations/scalar-neuron")
            self.assertEqual(report["summary"]["blocking_defects"], 0)
            self.assertTrue(any(d["category"] == "zero_ml_python_cells" for d in report["defects"]))
            with patch.object(MODULE, "DEFAULT_CONTENT_ROOT", root), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(MODULE.main(["--path", "foundations/scalar-neuron", "--strict"]), 0)

    def test_type_police_and_zero_ml_cells_with_exemptions(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bad_ml_body = (
                "```python\n"
                "import math\n"
                "def check(x):\n"
                "    if isinstance(x, bool) or type(x) not in (int, float):\n"
                "        raise TypeError('bad')\n"
                "    if not (math.isfinite(x) and math.isfinite(x + 1) and math.isfinite(x + 2) and math.isfinite(x + 3)):\n"
                "        raise ValueError('nan')\n"
                "    return x\n"
                "```\n"
            )
            _write_article(
                root,
                "training/zero-ml-and-police",
                bad_ml_body,
                section="ML Algorithms & Evaluation",
            )
            report = MODULE.run_audit(content_root=root, target_path="training/zero-ml-and-police")
            cats = {d["category"] for d in report["defects"]}
            self.assertIn("type_police_boilerplate", cats)
            self.assertIn("zero_ml_python_cells", cats)

            # Validation lesson allowlisted for type checks, plus real numpy usage passes.
            good_validation_body = (
                "```python\n"
                "import numpy as np\n"
                "def clean(x):\n"
                "    if isinstance(x, bool):\n"
                "        raise TypeError('bool')\n"
                "    return np.asarray([x], dtype=np.float32)\n"
                "```\n"
            )
            _write_article(
                root,
                "retrieval/structured-output-constrained-generation",
                good_validation_body,
                section="ML Algorithms & Evaluation",
            )
            val_report = MODULE.run_audit(
                content_root=root,
                target_path="retrieval/structured-output-constrained-generation",
            )
            self.assertEqual(val_report["summary"]["blocking_defects"], 0)

            # Dual edition: website/reference uses torch while book/reader shows 1 conceptual formula.
            dual_ml_body = (
                "<!-- leetllm: edition:reference:start -->\n"
                "```python\nimport torch\nx = torch.randn(4, 4)\n```\n"
                "<!-- leetllm: edition:reference:end -->\n\n"
                "<!-- leetllm: edition:reader:start -->\n"
                "```python\nstep = 3.0 - 0.1 * 2.0\n```\n"
                "<!-- leetllm: edition:reader:end -->\n"
            )
            _write_article(
                root,
                "training/dual-ml-lesson",
                dual_ml_body,
                visibility={"website": True, "book": True},
                section="ML Algorithms & Evaluation",
            )
            dual_report = MODULE.run_audit(content_root=root, target_path="training/dual-ml-lesson")
            self.assertEqual(dual_report["summary"]["blocking_defects"], 0)

            # Inference & Production Scale / Inference Optimization lessons must also use ML/array libraries.
            _write_article(
                root,
                "fundamentals/pure-python-serving",
                "```python\nstate = [10 * x for x in range(4)]\n```\n",
                section="Inference & Production Scale",
                category="Inference Optimization",
            )
            inf_bad = MODULE.run_audit(content_root=root, target_path="fundamentals/pure-python-serving")
            self.assertIn("zero_ml_python_cells", {d["category"] for d in inf_bad["defects"]})

            _write_article(
                root,
                "training/dspy-lesson",
                "```python\nimport dspy\nsig = dspy.Signature('question -> answer')\n```\n",
                section="Advanced Training & Adaptation",
                category="Prompt Optimization",
            )
            dspy_ok = MODULE.run_audit(content_root=root, target_path="training/dspy-lesson")
            self.assertEqual(dspy_ok["summary"]["blocking_defects"], 0)

    def test_illustration_checks_declared_png_primitives_and_visible_tsx(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            article_dir = _write_article(
                root,
                "agents/visual-defects",
                "```tsx render=illustration name=\"embedded_card\"\n"
                "export const width = 600\n"
                "export const height = 400\n"
                "export const alt = 'Embedded card without primitives or bad text'\n"
                "export function create() { return <Board><Box label=\"plain card\" /></Board> }\n"
                "```\n",
            )
            illus_dir = article_dir / "illustrations"
            gen_dir = illus_dir / "_generated"
            gen_dir.mkdir(parents=True, exist_ok=True)

            # 1) Card-only + visible fixture text + oversized rendered 2x PNG.
            (illus_dir / "card_only_bad.tsx").write_text(
                "import { fixture } from './_parts'\n"
                "// fixture comment ignored\n"
                "export const width = 600\n"
                "export const height = 400\n"
                "export function create() {\n"
                "  const dynamicOnly = `value ${fixture.id}`\n"
                "  return <Board><TextLabel text=\"Exact fixture table\" /></Board>\n"
                "}\n",
                encoding="utf-8",
            )
            (gen_dir / "card_only_bad_light.png").write_bytes(_make_minimal_png(1200, 1900))

            # 2) Valid SVG primitive + clean visible text + clean template interpolation.
            (illus_dir / "valid_chart.tsx").write_text(
                "import { LineChart } from 'vizmatic'\n"
                "export const width = 680\n"
                "export const height = 480\n"
                "export const alt = 'Latency line chart across batch sizes'\n"
                "export function create() {\n"
                "  const fixture = { label: 'batch 8' }\n"
                "  return <LineChart title={`Batch ${fixture.label}`} />\n"
                "}\n",
                encoding="utf-8",
            )
            (gen_dir / "valid_chart_light.png").write_bytes(_make_minimal_png(1360, 960))

            # 3) Local _kit timeline using destructured dot/arrow calls counts as valid primitive.
            (illus_dir / "kit_timeline.tsx").write_text(
                "import { kit } from './_kit'\n"
                "export const width = 640\n"
                "export const height = 460\n"
                "export function create() {\n"
                "  const { dot, arrow, text, scene } = kit('dark', width, height)\n"
                "  dot(10, 20, 4, '#fff')\n"
                "  arrow(10, 20, 50, 20, '#fff')\n"
                "  text('Latency trend', 0, 0, 200)\n"
                "  return scene()\n"
                "}\n",
                encoding="utf-8",
            )

            report = MODULE.run_audit(content_root=root, target_path="agents/visual-defects")
            by_target: dict[str, set[str]] = {}
            for d in report["defects"]:
                by_target.setdefault(d["target"], set()).add(d["category"])

            self.assertEqual(
                by_target["agents/visual-defects/illustrations/card_only_bad.tsx"],
                {
                    "illustration_aspect_ratio",
                    "illustration_card_only",
                    "illustration_visible_text_defect",
                },
            )
            self.assertEqual(
                by_target["agents/visual-defects/content.md[embedded_card]"],
                {"illustration_card_only"},
            )
            self.assertNotIn("agents/visual-defects/illustrations/valid_chart.tsx", by_target)
            self.assertNotIn("agents/visual-defects/illustrations/kit_timeline.tsx", by_target)

    def test_practice_glossary_and_cli_modes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_article(root, "foundations/clean-lesson", "Clean prose without issues.")

            p_bad = root / "practice" / "bad-drill"
            p_bad.mkdir(parents=True)
            (p_bad / "content.md").write_text("This drill has prose \u2014 emdash.\n", encoding="utf-8")
            (p_bad / "metadata.json").write_text(
                json.dumps(
                    {
                        "title": "Bad Drill",
                        "shortDescription": "Uses acct_10234 account.",
                        "starterCode": "def f(): pass",
                    }
                ),
                encoding="utf-8",
            )

            # Allowed practice dialect domain slug should pass dialect checks.
            p_ok = root / "practice" / "idempotent-ledger"
            p_ok.mkdir(parents=True)
            (p_ok / "content.md").write_text(
                "Record a ledger receipt under an explicit contract for each write. " * 6,
                encoding="utf-8",
            )
            (p_ok / "metadata.json").write_text(json.dumps({"title": "Idempotent Ledger"}), encoding="utf-8")

            g_dir = root / "glossary"
            g_dir.mkdir(parents=True)
            (g_dir / "qlora.md").write_text(
                "---\ntitle: QLoRA\nimportance: 80\n---\n\nQuantization doesn't establish rank equivalence.\n",
                encoding="utf-8",
            )
            (g_dir / "api-contract.md").write_text(
                "---\ntitle: API Contract\nimportance: 70\n---\n\n" + "An explicit contract specifies payloads. " * 8,
                encoding="utf-8",
            )

            # --practice mode + --strict exits 1 because bad-drill has defects.
            out_json = Path(tmp) / "report.json"
            buf = io.StringIO()
            with (
                patch.object(MODULE, "DEFAULT_CONTENT_ROOT", root),
                patch.object(sys, "argv", ["audit-content-quality.py", "--practice", "--strict", "--json", str(out_json)]),
                contextlib.redirect_stdout(buf),
            ):
                rc = MODULE.main(["--practice", "--strict", "--json", str(out_json)])
            self.assertEqual(rc, 1)
            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual(payload["summary"]["practice_scanned"], 2)
            self.assertEqual(payload["summary"]["articles_scanned"], 0)
            self.assertEqual(payload["summary"]["glossary_scanned"], 0)
            practice_targets = {d["target"] for d in payload["defects"]}
            self.assertEqual(practice_targets, {"practice/bad-drill"})

            # --glossary mode detects qlora.md banned string while exempting api-contract.md title term.
            with patch.object(MODULE, "DEFAULT_CONTENT_ROOT", root), contextlib.redirect_stdout(io.StringIO()):
                rc_gloss = MODULE.main(["--glossary", "--strict"])
                self.assertEqual(rc_gloss, 1)

            glossary_report = MODULE.run_audit(content_root=root, include_glossary=True)
            self.assertEqual([d["target"] for d in glossary_report["defects"]], ["glossary/qlora.md"])

            # --section foundations + --strict returns 0 for clean section.
            with patch.object(MODULE, "DEFAULT_CONTENT_ROOT", root), contextlib.redirect_stdout(io.StringIO()):
                rc_clean = MODULE.main(["--section", "foundations", "--strict"])
                self.assertEqual(rc_clean, 0)

    def test_duplicate_output_blocks_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            body = (
                _rich_prose_paragraph(1)
                + "\n\n```python title=\"demo.py\"\nprint(42)\n```\n\n"
                + "<!-- leetllm: output:start -->\n```text title=\"Output\" output compact\n42\n```\n<!-- leetllm: output:end -->\n\n"
                + "<!-- leetllm: output:start -->\n```text title=\"Output\" output compact\n42\n```\n<!-- leetllm: output:end -->\n"
            )
            _write_article(root, "agents/dup-out", body)
            report = MODULE.run_audit(content_root=root, target_path="agents/dup-out")
            cats = [d["category"] for d in report["defects"]]
            self.assertIn("duplicate_output_block", cats)


if __name__ == "__main__":
    unittest.main()
