#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Deterministic content and illustration quality audit across LeetLLM.

Inspects article/blog bundles across both website/reference and book/reader
views, practice challenges (content.md + metadata.json), glossary entries,
and TSX illustrations (plus rendered 2x PNG assets when present).
"""

from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import dataclass, field
import json
from pathlib import Path
import re
import struct
import sys
from typing import Any, Literal

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from content_audience import filter_content_for_audience, is_visible_to_audience
from content_bundle import EMBEDDED_ILLUSTRATION_RE, parse_attributes, parse_json_frontmatter

ROOT = SCRIPTS_DIR.parent
DEFAULT_CONTENT_ROOT = ROOT / "web" / "src" / "content"

EXCLUDED_ILLUSTRATION_DIRS = {"_generated", "_parts", "node_modules"}
EXCLUDED_TOP_SECTIONS = {"practice", "glossary"}

MAX_ILLUSTRATION_ASPECT_RATIO = 1.38
MAX_ILLUSTRATION_HEIGHT = 900
PNG_RENDER_SCALE = 2.0

MIN_DIALECT_WORDS_GUARD_HITS = 3
MAX_DIALECT_PER_1K_WORDS = 5.0
MAX_PREDICTION_PROMPTS = 2
MIN_NON_OPS_SOC2_HITS = 4
MAX_NON_OPS_SOC2_PER_1K_WORDS = 3.0

MAX_TYPE_IS_NOT_HITS = 2
MAX_MATH_ISFINITE_HITS = 3

# Normalize curly typography and non-breaking spaces before matching text rules.
_TRANSLATE_TABLE = str.maketrans(
    {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00a0": " ",
    }
)

# Fenced code block matcher supporting backticks and tildes.
_FENCED_BLOCK_RE = re.compile(
    r"(^|\n)(`{3,}|~{3,})([^\n]*)\n(.*?)\n\2[ \t]*(?=\n|$)",
    re.DOTALL,
)
_INLINE_CODE_RE = re.compile(r"`[^`\n]+`")
_HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
_FIGURE_BLOCK_RE = re.compile(r"<figure\b[^>]*>.*?</figure>", re.DOTALL | re.IGNORECASE)
_DISPLAY_MATH_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
_MARKDOWN_LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")

# Hard-banned exact strings and synthetic placeholder identifiers.
HARD_BANNED_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("needn't", re.compile(r"\bneedn't\b", re.IGNORECASE)),
    ("does not establish", re.compile(r"\bdoes\s+not\s+establish\b", re.IGNORECASE)),
    ("doesn't establish", re.compile(r"\bdoesn't\s+establish\b", re.IGNORECASE)),
    ("cannot establish", re.compile(r"\bcannot\s+establish\b", re.IGNORECASE)),
    ("the film's variant", re.compile(r"\bthe\s+film's\s+variant\b", re.IGNORECASE)),
    (
        "illustrative walkthrough, not a benchmark",
        re.compile(r"\billustrative\s+walkthrough,?\s+not\s+a\s+benchmark\b", re.IGNORECASE),
    ),
    ("synthetic fixture", re.compile(r"\bsynthetic\s+fixtures?\b", re.IGNORECASE)),
    ("FIXTURE ONLY", re.compile(r"\bfixture\s+only\b", re.IGNORECASE)),
    ("acct_10234", re.compile(r"\bacct_10234\b", re.IGNORECASE)),
    ("K10234", re.compile(r"\bk10234\b", re.IGNORECASE)),
    ("RUN-842", re.compile(r"\brun-842\b", re.IGNORECASE)),
    ("DeployBuddy", re.compile(r"\bdeploybuddy\b", re.IGNORECASE)),
    ("INC-48291", re.compile(r"\binc-48291\b", re.IGNORECASE)),
    ("0.005000 USD", re.compile(r"\b0\.005000\s+usd\b", re.IGNORECASE)),
)

# Additional disclaimer phrases banned inside visible TSX illustration strings.
TSX_DISCLAIMER_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("not a benchmark", re.compile(r"\bnot\s+a\s+benchmark\b", re.IGNORECASE)),
    ("fixture", re.compile(r"\bfixtures?\b", re.IGNORECASE)),
)

# Tracked bureaucratic dialect stems and canonical exemption keys.
DIALECT_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("fixture", re.compile(r"\bfixtures?\b", re.IGNORECASE)),
    ("contract", re.compile(r"\bcontracts?\b", re.IGNORECASE)),
    ("boundary", re.compile(r"\bboundar(?:y|ies)\b", re.IGNORECASE)),
    ("admit", re.compile(r"\b(?:admit(?:ted|s|ting)?|admissions?)\b", re.IGNORECASE)),
    ("receipt", re.compile(r"\breceipts?\b", re.IGNORECASE)),
    ("provenance", re.compile(r"\bprovenances?\b", re.IGNORECASE)),
    ("supplied", re.compile(r"\bsupplied\b", re.IGNORECASE)),
    ("authority", re.compile(r"\bauthorit(?:y|ies)\b", re.IGNORECASE)),
)

# Domain phrases exempted across all lessons because the term is genuinely technical.
EXEMPT_DIALECT_PHRASES: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("boundary", re.compile(r"\bdecision\s+boundar(?:y|ies)\b", re.IGNORECASE)),
    ("boundary", re.compile(r"\bword\s+boundar(?:y|ies)\b", re.IGNORECASE)),
    ("boundary", re.compile(r"\btoken\s+boundar(?:y|ies)\b", re.IGNORECASE)),
    ("fixture", re.compile(r"\bpytest\s+fixtures?\b", re.IGNORECASE)),
)

# Per-slug term allowlists where bureaucratic vocabulary is core domain terminology.
ARTICLE_DIALECT_ALLOWLIST: dict[str, frozenset[str]] = {
    "enterprise-rag-security-rbac-access-control": frozenset({"contract", "boundary", "authority"}),
    "prompt-injection-defense-strategies": frozenset({"contract", "boundary", "authority"}),
    "local-agent-sandboxing-seatbelt-landlock": frozenset({"contract", "boundary", "authority"}),
    "code-generation-agents-sandboxing": frozenset({"contract", "boundary", "authority"}),
    "mcp-tool-protocol-standards": frozenset({"contract", "boundary"}),
    "structured-output-constrained-generation": frozenset({"contract"}),
    "logistic-regression-classification-metrics-from-scratch": frozenset({"boundary"}),
    "statistical-learning-theory-generalization": frozenset({"boundary"}),
    "conformal-prediction-uncertainty-sets": frozenset({"boundary"}),
    "clustering-pca-representation-learning": frozenset({"boundary"}),
    "vector-database-internals-hnsw-ivf": frozenset({"boundary"}),
    "support-vector-machines-kernel-methods": frozenset({"boundary"}),
}

PRACTICE_DIALECT_ALLOWLIST: dict[str, frozenset[str]] = {
    "idempotent-ledger": frozenset({"contract", "receipt"}),
    "webhook-idempotency-receiver": frozenset({"contract", "boundary", "receipt"}),
    "circuit-breaker-state": frozenset({"admit", "boundary", "contract"}),
    "sse-event-parser": frozenset({"boundary", "contract"}),
    "secret-redactor": frozenset({"boundary"}),
    "document-permission-filter": frozenset({"boundary", "authority"}),
    "tool-call-schema-validator": frozenset({"contract"}),
}

GLOSSARY_DIALECT_ALLOWLIST: dict[str, frozenset[str]] = {
    "abac": frozenset({"authority", "boundary"}),
    "rbac": frozenset({"authority", "boundary"}),
    "rebac": frozenset({"authority", "boundary"}),
    "confused-deputy": frozenset({"authority", "boundary"}),
    "owasp-llm-top-10": frozenset({"authority", "boundary"}),
    "vllm-router": frozenset({"admit"}),
}

PREDICTION_PROMPT_RE = re.compile(
    r"\bBefore\s+(?:running|reading|checking|continuing)\b",
    re.IGNORECASE,
)

# NONO 1: Lawyer-vetted defensive disclaimers that interrupt teaching (warning only).
LAWYER_DISCLAIMER_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("does not prove", re.compile(r"\b(?:does\s+not|doesn't|cannot)\s+prove\b", re.IGNORECASE)),
    ("does not guarantee", re.compile(r"\b(?:does\s+not|doesn't|cannot)\s+guarantee\b", re.IGNORECASE)),
    ("not a guarantee of", re.compile(r"\bnot\s+a\s+guarantee\s+of\b", re.IGNORECASE)),
    ("not a promise of", re.compile(r"\bnot\s+a\s+promise\s+of\b", re.IGNORECASE)),
    ("does not measure", re.compile(r"\b(?:does\s+not|doesn't|cannot)\s+measure\b", re.IGNORECASE)),
    ("does not replace", re.compile(r"\b(?:does\s+not|doesn't)\s+replace\b", re.IGNORECASE)),
    (
        "illustrative walkthrough disclaimer",
        re.compile(r"\btreat\s+these\s+numbers\s+as\s+an\s+illustrative\b", re.IGNORECASE),
    ),
    (
        "simplified example caveat",
        re.compile(r"\bsimplified\s+example\s+does\s+not\s+capture\b", re.IGNORECASE),
    ),
    (
        "for illustration purposes only",
        re.compile(r"\bfor\s+illustration\s+purposes\s+only\b", re.IGNORECASE),
    ),
)

# NONO 2: Non-ops SOC2/compliance/SRE ticket boilerplate (warning only).
NON_OPS_SECTIONS = frozenset(
    {
        "Computing Foundations",
        "Math & Statistics",
        "Preparation & Prerequisites",
        "ML Algorithms & Evaluation",
        "Core LLM Foundations",
        "Transformer Deep Dives",
        "Advanced Training & Adaptation",
    }
)
CORPORATE_TICKET_ROLEPLAY_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("luna-48291", re.compile(r"\bluna-48291\b", re.IGNORECASE)),
    ("ticket #48291", re.compile(r"\bticket\s*#\s*\d+\b", re.IGNORECASE)),
    ("09:12 incident timestamp", re.compile(r"\b09:12\b")),
    ("escalation workflow", re.compile(r"\bescalation\s+(?:workflow|behavior)\b", re.IGNORECASE)),
)
NON_OPS_SOC2_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("policy", re.compile(r"\bpolic(?:y|ies)\b", re.IGNORECASE)),
    ("gate", re.compile(r"\bgates?\b", re.IGNORECASE)),
    ("audit", re.compile(r"\baudit(?:s|ed|ing)?\b", re.IGNORECASE)),
    ("ledger", re.compile(r"\bledgers?\b", re.IGNORECASE)),
    ("rollout", re.compile(r"\brollouts?\b", re.IGNORECASE)),
    ("rollback", re.compile(r"\brollbacks?\b", re.IGNORECASE)),
)
NON_OPS_SOC2_EXEMPT_PHRASES: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "policy",
        re.compile(
            r"\b(?:rl|optimal|target|behavior|reference|current|new|old|learned|stochastic|deterministic|greedy|epsilon-greedy)\s+polic(?:y|ies)\b"
            r"|\bpolic(?:y|ies)\s+(?:gradient|gradients|optimization|network|loss|update|updates|iteration|evaluation|model|head|ratio|learning|search)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "gate",
        re.compile(
            r"\b(?:forget|input|output|update|reset|memory|router|moe|attention|logic|sigmoid|silu|gelu|swiglu|glu)\s+gates?\b"
            r"|\bgates?\s+(?:vector|matrix|activation|projection|weights?|unit|units)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "rollout",
        re.compile(
            r"\b(?:rl|policy|trajectory|episode|environment|sampling|grpo|ppo)\s+rollouts?\b"
            r"|\brollouts?\s+(?:trajector(?:y|ies)|episodes?|samples?|buffer|step|steps)\b",
            re.IGNORECASE,
        ),
    ),
)
RL_OR_ALIGNMENT_POLICY_SLUG_TOKENS = (
    "reinforcement",
    "rlhf",
    "dpo",
    "grpo",
    "ppo",
    "alignment",
    "reward",
    "decision",
    "preference",
    "security",
    "rbac",
    "privacy",
    "sandbox",
    "safety",
    "responsible",
    "governance",
)

# NONO 5: Ephemeral library changelog stamps in timeless prose (warning only).
EPHEMERAL_CHANGELOG_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "rechecked date stamp",
        re.compile(
            r"\brechecked\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},\s+20\d{2}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "As of <lib> <version>",
        re.compile(
            r"\bAs\s+of\s+[A-Za-z][A-Za-z0-9_-]{1,24}\s+v?\d+\.\d+(?:\.\d+)?\b",
        ),
    ),
)

# Type-police patterns in Python cells.
ISINSTANCE_BOOL_RE = re.compile(
    r"\bisinstance\s*\([^,\n]+,\s*(?:bool\b|\([^)\n]*\bbool\b[^)\n]*\))"
)
TYPE_NOT_IN_NUMERIC_RE = re.compile(
    r"\btype\s*\([^)\n]+\)\s*not\s+in\s*\(\s*(?:int\s*,\s*float|float\s*,\s*int)\s*\)"
)
TYPE_IS_NOT_RE = re.compile(
    r"\btype\s*\([^)\n]+\)\s*(?:is\s+not|!=)\s*(?:int|float|str|bool|list|dict|tuple)\b"
)
MATH_ISFINITE_RE = re.compile(r"\bmath\.isfinite\s*\(")

VALIDATION_LESSON_ALLOWLIST = frozenset(
    {
        "structured-output-constrained-generation",
        "dataset-pipelines-data-quality",
        "mixed-precision-training-loss-scaling",
        "floating-point-precision-bf16-fp8",
        "tool-call-schema-validator",
        "canary-metric-judge",
    }
)

# Scope definitions for zero-ML Python cell checks.
ML_SECTIONS = frozenset(
    {
        "Math & Statistics",
        "Preparation & Prerequisites",
        "ML Algorithms & Evaluation",
        "Production ML Systems",
        "Portfolio Capstones",
        "Transformer Deep Dives",
        "Advanced Training & Adaptation",
        "Inference & Production Scale",
    }
)
ML_CATEGORIES = frozenset(
    {
        "Transformer Architecture",
        "Model Architecture",
        "Fine-Tuning & Training",
        "NLP Fundamentals",
        "RAG & Retrieval",
        "Multimodal Models",
        "Embeddings & Vector Search",
        "Inference Optimization",
        "Evaluation & Benchmarks",
    }
)
ZERO_ML_EXCLUDED_SLUGS = frozenset(
    {
        "calling-llm-apis-production",
        "first-ai-app-end-to-end",
        "prompt-engineering-fundamentals",
        "enterprise-rag-security-rbac-access-control",
        "file-ingestion-pdfs-html-ocr-markdown",
        "python-for-ai-engineering",
    }
)

ML_LIBRARY_TOKEN_RE = re.compile(
    r"\b(?:"
    r"numpy|np|torch|torchvision|torchaudio|sklearn|scikit-learn|scipy|"
    r"pandas|pd|transformers|datasets|tokenizers|tiktoken|faiss|chromadb|"
    r"qdrant_client|sentence_transformers|jax|flax|optax|triton|lightgbm|"
    r"xgboost|catboost|statsmodels|matplotlib|vllm|sglang|mlflow|ray|peft|"
    r"trl|accelerate|bitsandbytes|cupy|numba|pyarrow|onnxruntime|einops|"
    r"safetensors|gguf|dspy|optuna"
    r")\b"
)

# Required illustration visual primitives plus verified local kit drawing calls.
VISUAL_PRIMITIVE_TOKENS = (
    "LineChart",
    "BarChart",
    "ScatterPlot",
    "Heatmap",
    "Matrix",
    "TiledMatrix",
    "AxisPlot",
    "LayeredNetwork",
    "GraphDiagram",
    "StackedBar",
    "IntervalPlot",
    "Flow",
    "FlowArrow",
    "Arrow",
    "Connector",
    "VectorArrow",
    "createPlotArea",
    "<svg",
    "<path",
    "<line",
    "<circle",
    "<polygon",
    "MiniBarChart",
    "QuadrantChart",
    "VectorSegment",
    "SvgPoint",
    "<Figure",
    "<Plot",
    "createClassificationQueryFigure",
    "svgLayer(",
)
CREATE_ELEMENT_SVG_RE = re.compile(
    r"createElement\s*\(\s*['\"](?:svg|path|line|circle|polygon)['\"]"
)
KIT_DRAW_CALL_RE = re.compile(
    r"(?:\b|\.)(?:arrow|dashed|dot|path|curve|plot|connector)\s*\("
)
KIT_IMPORT_RE = re.compile(
    r"from\s+['\"](?:\./_kit|[^'\"]*(?:kit|figure-utils|plot-kit)[^'\"]*)['\"]"
)

EXPORT_CONST_NUM_RE = re.compile(
    r"export\s+const\s+(width|height)\s*(?::\s*number\s*)?=\s*(\d+)"
)

PROSE_WORDS_RE = re.compile(r"\b[A-Za-z0-9_']+\b")
DUPLICATE_OUTPUT_BLOCK_RE = re.compile(
    r"<!--\s*leetllm:\s*output:end\s*-->\s*<!--\s*leetllm:\s*output:start\s*-->",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class AuditDefect:
    """Single deterministic quality finding reported by the audit."""

    target: str
    scope: str
    category: str
    severity: Literal["blocking", "warning"]
    message: str
    views: tuple[str, ...] = ()
    metrics: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialize the defect to a JSON-compatible dictionary."""
        return {
            "target": self.target,
            "scope": self.scope,
            "category": self.category,
            "severity": self.severity,
            "message": self.message,
            "views": list(self.views),
            "metrics": self.metrics,
        }


def normalize_text(text: str) -> str:
    """Normalize curly quotes and non-breaking spaces without losing line structure."""
    return text.translate(_TRANSLATE_TABLE)


def extract_code_fences(markdown: str) -> list[tuple[str, str]]:
    """Return ``(language, body)`` tuples for every fenced code block in Markdown."""
    blocks: list[tuple[str, str]] = []
    for match in _FENCED_BLOCK_RE.finditer(markdown):
        info = match.group(3).strip().split()[0].lower() if match.group(3).strip() else ""
        blocks.append((info, match.group(4)))
    return blocks


def strip_markdown_to_prose(markdown: str) -> str:
    """Remove fenced blocks, inline code, HTML comments, figures, and display math."""
    text = _FENCED_BLOCK_RE.sub(lambda m: m.group(1), markdown)
    text = _HTML_COMMENT_RE.sub("", text)
    text = _FIGURE_BLOCK_RE.sub("", text)
    text = _DISPLAY_MATH_RE.sub("", text)
    text = _INLINE_CODE_RE.sub(" CODE_TOKEN ", text)
    return text


def count_words(text: str) -> int:
    """Count word-like tokens in prose text."""
    return len(PROSE_WORDS_RE.findall(text))


def find_hard_banned(text: str) -> list[str]:
    """Return all distinct hard-banned strings matched in normalized text."""
    normalized = normalize_text(text)
    hits: list[str] = []
    for label, pattern in HARD_BANNED_PATTERNS:
        if pattern.search(normalized):
            hits.append(label)
    return hits


def find_emdash_lines(markdown: str) -> list[int]:
    """Return 1-based line numbers where prose (outside code fences/inline code) has an em dash."""
    lines = markdown.splitlines(keepends=True)
    if not lines:
        return []

    # Mask fenced code blocks line-by-line to keep exact 1-based line numbers.
    in_fence = False
    fence_char = ""
    fence_len = 0
    bad_lines: list[int] = []
    in_html_comment = False

    for lineno, raw_line in enumerate(lines, start=1):
        stripped = raw_line.lstrip()
        if in_fence:
            if stripped.startswith(fence_char * fence_len) and stripped.strip(fence_char).strip() == "":
                in_fence = False
            continue

        fence_match = re.match(r"^(`{3,}|~{3,})(.*)$", stripped)
        if fence_match:
            in_fence = True
            fence_char = fence_match.group(1)[0]
            fence_len = len(fence_match.group(1))
            continue

        line = raw_line
        if in_html_comment:
            end_idx = line.find("-->")
            if end_idx == -1:
                continue
            line = line[end_idx + 3 :]
            in_html_comment = False
        line = _HTML_COMMENT_RE.sub("", line)
        if "<!--" in line:
            line = line.split("<!--", 1)[0]
            in_html_comment = True

        # Strip inline code spans on this line before checking for emdash.
        line = _INLINE_CODE_RE.sub("", line)
        if "\u2014" in line:
            bad_lines.append(lineno)

    return bad_lines


def compute_dialect_stats(
    prose: str,
    allowlisted_terms: frozenset[str] = frozenset(),
) -> dict[str, Any]:
    """Compute bureaucratic dialect term counts and per-1,000-word density."""
    normalized = normalize_text(prose)
    words = count_words(normalized)
    if words == 0:
        return {"words": 0, "effective_hits": 0, "density_per_1k": 0.0, "term_counts": {}}

    term_counts: dict[str, int] = {}
    exempt_counts: Counter[str] = Counter()
    for term_key, phrase_re in EXEMPT_DIALECT_PHRASES:
        exempt_counts[term_key] += len(phrase_re.findall(normalized))

    effective_hits = 0
    for term_key, pattern in DIALECT_PATTERNS:
        if term_key in allowlisted_terms:
            continue
        raw_count = len(pattern.findall(normalized))
        net_count = max(0, raw_count - exempt_counts[term_key])
        if net_count > 0:
            term_counts[term_key] = net_count
            effective_hits += net_count

    density = round((effective_hits / words) * 1000.0, 2)
    return {
        "words": words,
        "effective_hits": effective_hits,
        "density_per_1k": density,
        "term_counts": term_counts,
    }


def find_lawyer_disclaimers(prose: str) -> list[str]:
    """Return distinct lawyer-vetted disclaimer phrases matched in prose."""
    normalized = normalize_text(prose)
    hits: list[str] = []
    for label, pattern in LAWYER_DISCLAIMER_PATTERNS:
        if pattern.search(normalized):
            hits.append(label)
    return hits


def find_ephemeral_changelogs(prose: str) -> list[str]:
    """Return distinct ephemeral library changelog stamps matched in prose."""
    normalized = normalize_text(prose)
    hits: list[str] = []
    for label, pattern in EPHEMERAL_CHANGELOG_PATTERNS:
        if pattern.search(normalized):
            hits.append(label)
    return hits


def compute_non_ops_soc2_stats(
    prose: str,
    *,
    slug: str,
    section: str,
) -> dict[str, Any]:
    """Detect corporate ticket roleplay and SOC2 compliance jargon in non-ops lessons."""
    normalized = normalize_text(prose)
    words = count_words(normalized)
    roleplay_hits = [
        label
        for label, pattern in CORPORATE_TICKET_ROLEPLAY_PATTERNS
        if pattern.search(normalized)
    ]

    if section not in NON_OPS_SECTIONS or words == 0:
        return {
            "words": words,
            "roleplay_hits": roleplay_hits,
            "effective_hits": 0,
            "density_per_1k": 0.0,
            "term_counts": {},
        }

    slug_lower = slug.lower()
    exempt_policy_slug = any(token in slug_lower for token in RL_OR_ALIGNMENT_POLICY_SLUG_TOKENS)
    exempt_counts: Counter[str] = Counter()
    for term_key, phrase_re in NON_OPS_SOC2_EXEMPT_PHRASES:
        exempt_counts[term_key] += len(phrase_re.findall(normalized))

    term_counts: dict[str, int] = {}
    effective_hits = 0
    for term_key, pattern in NON_OPS_SOC2_PATTERNS:
        if term_key in ("policy", "rollout") and exempt_policy_slug:
            continue
        raw_count = len(pattern.findall(normalized))
        net_count = max(0, raw_count - exempt_counts[term_key])
        if net_count > 0:
            term_counts[term_key] = net_count
            effective_hits += net_count

    density = round((effective_hits / words) * 1000.0, 2)
    return {
        "words": words,
        "roleplay_hits": roleplay_hits,
        "effective_hits": effective_hits,
        "density_per_1k": density,
        "term_counts": term_counts,
    }


def _strip_python_comments(code: str) -> str:
    """Remove Python hash-comment tails line-by-line (lightweight heuristic)."""
    cleaned_lines: list[str] = []
    for line in code.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("#"):
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)


def detect_type_police(python_blocks: list[str]) -> dict[str, int]:
    """Count defensive type-police anti-patterns across Python code fences."""
    combined = _strip_python_comments("\n\n".join(python_blocks))
    return {
        "isinstance_bool": len(ISINSTANCE_BOOL_RE.findall(combined)),
        "type_not_in_numeric": len(TYPE_NOT_IN_NUMERIC_RE.findall(combined)),
        "type_is_not": len(TYPE_IS_NOT_RE.findall(combined)),
        "math_isfinite": len(MATH_ISFINITE_RE.findall(combined)),
    }


def is_ml_scope_article(metadata: dict[str, Any], slug: str) -> bool:
    """Return True when an article belongs to ML/DL/CV/NLP/RAG/capstone scope."""
    if slug in ZERO_ML_EXCLUDED_SLUGS:
        return False
    if "capstone" in slug.lower():
        return True
    section = str(metadata.get("section", ""))
    category = str(metadata.get("category", ""))
    return section in ML_SECTIONS or category in ML_CATEGORIES


def extract_visible_tsx_strings(source: str) -> list[str]:
    """Extract user-visible string literals and JSX text nodes from TSX source.

    Skips import lines, single-line and block comments, CSS/SVG path strings,
    and template literal interpolation expressions such as ``${fixture.id}``.
    """
    visible: list[str] = []
    n = len(source)
    i = 0

    def is_import_line_start(pos: int) -> bool:
        line_start = source.rfind("\n", 0, pos) + 1
        prefix = source[line_start:pos].strip()
        return prefix == "" and source.startswith("import", pos)

    while i < n:
        ch = source[i]

        # Skip comments.
        if ch == "/" and i + 1 < n and source[i + 1] == "/":
            nl = source.find("\n", i + 2)
            i = n if nl == -1 else nl + 1
            continue
        if ch == "/" and i + 1 < n and source[i + 1] == "*":
            end = source.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue

        # Skip import statements cleanly so module paths are not parsed as text.
        if ch == "i" and source.startswith("import ", i) and is_import_line_start(i):
            nl = source.find("\n", i)
            i = n if nl == -1 else nl + 1
            continue

        # Single or double quoted string literals.
        if ch in ("'", '"'):
            quote = ch
            j = i + 1
            buf: list[str] = []
            while j < n:
                c = source[j]
                if c == "\\" and j + 1 < n:
                    buf.append(source[j + 1])
                    j += 2
                    continue
                if c == quote or c == "\n":
                    break
                buf.append(c)
                j += 1
            if j < n and source[j] == quote:
                text = "".join(buf).strip()
                if text and not _looks_like_non_visible_token(text):
                    visible.append(text)
            i = j + 1
            continue

        # Template literals: keep static segments, skip ${...} expressions.
        if ch == "`":
            j = i + 1
            buf = []
            while j < n:
                c = source[j]
                if c == "\\" and j + 1 < n:
                    buf.append(source[j + 1])
                    j += 2
                    continue
                if c == "$" and j + 1 < n and source[j + 1] == "{":
                    chunk = "".join(buf).strip()
                    if chunk and not _looks_like_non_visible_token(chunk):
                        visible.append(chunk)
                    buf = []
                    # Advance past matching '}' of interpolation.
                    depth = 1
                    j += 2
                    while j < n and depth > 0:
                        if source[j] == "{":
                            depth += 1
                        elif source[j] == "}":
                            depth -= 1
                        elif source[j] in ("'", '"'):
                            q = source[j]
                            j += 1
                            while j < n and source[j] != q:
                                if source[j] == "\\":
                                    j += 1
                                j += 1
                        j += 1
                    continue
                if c == "`":
                    break
                buf.append(c)
                j += 1
            chunk = "".join(buf).strip()
            if chunk and not _looks_like_non_visible_token(chunk):
                visible.append(chunk)
            i = j + 1
            continue

        # JSX text content between '>' and '<' when not inside JS comparison or arrow.
        if ch == ">" and i > 0 and source[i - 1] != "=":
            next_lt = source.find("<", i + 1)
            next_brace = source.find("{", i + 1)
            next_nl = source.find("\n", i + 1)
            # Only treat simple single-line JSX children without unclosed braces as text.
            if next_lt != -1 and (next_brace == -1 or next_lt < next_brace):
                raw_inner = source[i + 1 : next_lt]
                if "\n" not in raw_inner or raw_inner.strip():
                    candidate = " ".join(raw_inner.split())
                    if (
                        candidate
                        and not candidate.startswith(("=>", ")", ";", ",", "}"))
                        and "=" not in candidate
                        and "{" not in candidate
                        and "}" not in candidate
                    ):
                        visible.append(candidate)
        i += 1

    return visible


def _looks_like_non_visible_token(text: str) -> bool:
    """Filter out obvious CSS colors, SVG path data, font tokens, and import paths."""
    if text.startswith(("#", "./", "../", "@", "M ", "m ")):
        return True
    if text in ("100%", "none", "auto", "center", "left", "right", "bold", "normal"):
        return True
    return False


def has_visual_primitive(source: str) -> bool:
    """Return True if a TSX illustration uses a chart, flow, arrow, or SVG primitive."""
    if any(token in source for token in VISUAL_PRIMITIVE_TOKENS):
        return True
    if CREATE_ELEMENT_SVG_RE.search(source):
        return True
    if KIT_IMPORT_RE.search(source) and KIT_DRAW_CALL_RE.search(source):
        return True
    return False


def read_png_dimensions(png_path: Path) -> tuple[int, int] | None:
    """Read pixel dimensions from a PNG file's IHDR header, returning None if unreadable."""
    try:
        with png_path.open("rb") as handle:
            header = handle.read(24)
    except OSError:
        return None
    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        return None
    width, height = struct.unpack(">II", header[16:24])
    return int(width), int(height)


def parse_declared_dimensions(source: str) -> tuple[int | None, int | None]:
    """Extract exported width and height integers from TSX source."""
    dims: dict[str, int] = {}
    for match in EXPORT_CONST_NUM_RE.finditer(source):
        dims[match.group(1)] = int(match.group(2))
    return dims.get("width"), dims.get("height")


def _glossary_allowlist(slug: str, title: str) -> frozenset[str]:
    """Allow bureaucratic terms when the glossary entry itself defines that concept."""
    allowed = set(GLOSSARY_DIALECT_ALLOWLIST.get(slug, frozenset()))
    haystack = f"{slug} {title}".lower()
    for term_key, pattern in DIALECT_PATTERNS:
        if term_key in haystack or pattern.search(haystack):
            allowed.add(term_key)
    return frozenset(allowed)


def _article_allowlist(slug: str, extra_terms: frozenset[str] = frozenset()) -> frozenset[str]:
    return ARTICLE_DIALECT_ALLOWLIST.get(slug, frozenset()) | extra_terms


def _metadata_text_blobs(metadata: dict[str, Any]) -> list[str]:
    """Extract author-written string values from frontmatter or practice metadata."""
    blobs: list[str] = []
    for key in ("title", "shortDescription", "description", "prompt"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            blobs.append(value)
    for key in ("keyConceptsTested", "hints"):
        value = metadata.get(key)
        if isinstance(value, list):
            blobs.extend(item for item in value if isinstance(item, str) and item.strip())
    return blobs


def _merge_view_defect(
    bucket: dict[tuple[str, str, str], dict[str, Any]],
    *,
    target: str,
    scope: str,
    category: str,
    severity: Literal["blocking", "warning"],
    message: str,
    view: str,
    metrics: dict[str, Any],
) -> None:
    """Accumulate per-view defects so shared defects list all affected views once."""
    key = (target, category, message)
    existing = bucket.get(key)
    if existing is None:
        bucket[key] = {
            "target": target,
            "scope": scope,
            "category": category,
            "severity": severity,
            "message": message,
            "views": [view],
            "metrics": metrics,
        }
    else:
        if view not in existing["views"]:
            existing["views"].append(view)


def audit_article_bundle(
    article_dir: Path,
    content_root: Path,
) -> tuple[list[AuditDefect], list[AuditDefect], dict[str, Any]]:
    """Audit one article/blog bundle across website/reference and book/reader plus TSX."""
    content_path = article_dir / "content.md"
    raw = content_path.read_text(encoding="utf-8")
    rel_target = article_dir.relative_to(content_root).as_posix()
    slug = article_dir.name

    metadata, _ = parse_json_frontmatter(content_path, raw)
    if metadata is None:
        return (
            [
                AuditDefect(
                    target=rel_target,
                    scope="article",
                    category="invalid_frontmatter",
                    severity="blocking",
                    message="Failed to parse JSON frontmatter in content.md",
                )
            ],
            [],
            {"target": rel_target, "scope": "article", "views": {}},
        )

    views_to_check: list[tuple[Literal["website", "book"], Literal["reference", "reader"]]] = []
    if is_visible_to_audience(metadata, "website"):
        views_to_check.append(("website", "reference"))
    if is_visible_to_audience(metadata, "book"):
        views_to_check.append(("book", "reader"))
    if not views_to_check:
        views_to_check.append(("website", "reference"))

    view_defects: dict[tuple[str, str, str], dict[str, Any]] = {}
    view_metrics: dict[str, Any] = {}
    allowlist = _article_allowlist(slug)
    meta_blobs = _metadata_text_blobs(metadata)
    meta_joined = "\n".join(meta_blobs)

    # Embedded TSX fences may vary by view or sit outside conditionals; collect by name.
    embedded_sources: dict[str, tuple[str, str]] = {}

    for audience, edition in views_to_check:
        view_name = f"{audience}/{edition}"
        filtered = filter_content_for_audience(
            raw,
            audience=audience,
            source=str(content_path),
            edition=edition,
        )
        _, body = parse_json_frontmatter(content_path, filtered)

        # Capture embedded TSX blocks before stripping them from prose/Python analysis.
        for match in EMBEDDED_ILLUSTRATION_RE.finditer(body):
            attrs = parse_attributes(match.group(1))
            name = attrs.get("name", "").strip().removesuffix(".tsx")
            if name and name not in embedded_sources:
                embedded_sources[name] = (match.group(2), f"{rel_target}/content.md[{name}]")

        body_without_tsx = EMBEDDED_ILLUSTRATION_RE.sub("", body)
        prose = strip_markdown_to_prose(body_without_tsx)
        code_blocks = extract_code_fences(body_without_tsx)
        python_blocks = [code for lang, code in code_blocks if lang in ("python", "py", "python3")]
        full_view_text = "\n".join([meta_joined, body_without_tsx])

        # (a) Hard-banned strings across metadata, prose, and code blocks.
        banned_hits = find_hard_banned(full_view_text)
        if banned_hits:
            _merge_view_defect(
                view_defects,
                target=rel_target,
                scope="article",
                category="hard_banned_string",
                severity="blocking",
                message=f"Hard-banned string(s): {', '.join(banned_hits)}",
                view=view_name,
                metrics={"matches": banned_hits},
            )

        dup_outputs = list(DUPLICATE_OUTPUT_BLOCK_RE.finditer(body_without_tsx))
        if dup_outputs:
            _merge_view_defect(
                view_defects,
                target=rel_target,
                scope="article",
                category="duplicate_output_block",
                severity="blocking",
                message=f"Duplicate consecutive leetllm output block(s): {len(dup_outputs)}",
                view=view_name,
                metrics={"duplicate_count": len(dup_outputs)},
            )

        # (a) Emdashes in authored prose outside fenced/inline code + frontmatter metadata.
        emdash_lines = find_emdash_lines(body_without_tsx)
        meta_emdash = "\u2014" in meta_joined
        if emdash_lines or meta_emdash:
            loc_parts = []
            if meta_emdash:
                loc_parts.append("frontmatter")
            if emdash_lines:
                sample = ", ".join(str(ln) for ln in emdash_lines[:5])
                suffix = f" (+{len(emdash_lines) - 5} more)" if len(emdash_lines) > 5 else ""
                loc_parts.append(f"lines {sample}{suffix}")
            _merge_view_defect(
                view_defects,
                target=rel_target,
                scope="article",
                category="emdash_in_prose",
                severity="blocking",
                message=f"Em dash found in prose ({'; '.join(loc_parts)})",
                view=view_name,
                metrics={"emdash_line_count": len(emdash_lines), "in_frontmatter": meta_emdash},
            )

        # (b) Bureaucratic dialect density.
        dialect_stats = compute_dialect_stats(f"{meta_joined}\n{prose}", allowlisted_terms=allowlist)
        if (
            dialect_stats["effective_hits"] >= MIN_DIALECT_WORDS_GUARD_HITS
            and dialect_stats["density_per_1k"] > MAX_DIALECT_PER_1K_WORDS
        ):
            terms_summary = ", ".join(
                f"{k}={v}" for k, v in sorted(dialect_stats["term_counts"].items())
            )
            _merge_view_defect(
                view_defects,
                target=rel_target,
                scope="article",
                category="bureaucratic_dialect",
                severity="blocking",
                message=(
                    f"Bureaucratic dialect density {dialect_stats['density_per_1k']}/1k words "
                    f"({dialect_stats['effective_hits']} hits in {dialect_stats['words']} words: {terms_summary})"
                ),
                view=view_name,
                metrics=dialect_stats,
            )

        # Repetition and NONO editorial warnings (never block; punchy paragraphs are welcome).
        pred_count = len(PREDICTION_PROMPT_RE.findall(normalize_text(prose)))
        if pred_count > MAX_PREDICTION_PROMPTS:
            _merge_view_defect(
                view_defects,
                target=rel_target,
                scope="article",
                category="prediction_prompt_spam",
                severity="warning",
                message=f"Review repeated prompting: {pred_count} 'Before running/reading/...' prompts; judge whether each develops understanding",
                view=view_name,
                metrics={"prediction_prompts": pred_count},
            )

        lawyer_hits = find_lawyer_disclaimers(prose)
        if lawyer_hits:
            _merge_view_defect(
                view_defects,
                target=rel_target,
                scope="article",
                category="lawyer_disclaimer_spam",
                severity="warning",
                message=f"Lawyer-vetted disclaimer phrasing in prose: {', '.join(lawyer_hits)}",
                view=view_name,
                metrics={"matches": lawyer_hits},
            )

        section_name = str(metadata.get("section", ""))
        non_ops_stats = compute_non_ops_soc2_stats(prose, slug=slug, section=section_name)
        if non_ops_stats["roleplay_hits"] or (
            non_ops_stats["effective_hits"] >= MIN_NON_OPS_SOC2_HITS
            and non_ops_stats["density_per_1k"] > MAX_NON_OPS_SOC2_PER_1K_WORDS
        ):
            parts: list[str] = []
            if non_ops_stats["roleplay_hits"]:
                parts.append(f"ticket roleplay={', '.join(non_ops_stats['roleplay_hits'])}")
            if non_ops_stats["effective_hits"] >= MIN_NON_OPS_SOC2_HITS and non_ops_stats["density_per_1k"] > MAX_NON_OPS_SOC2_PER_1K_WORDS:
                soc2_summary = ", ".join(
                    f"{k}={v}" for k, v in sorted(non_ops_stats["term_counts"].items())
                )
                parts.append(
                    f"SOC2 density {non_ops_stats['density_per_1k']}/1k words ({soc2_summary})"
                )
            _merge_view_defect(
                view_defects,
                target=rel_target,
                scope="article",
                category="non_ops_soc2_boilerplate",
                severity="warning",
                message=f"Non-ops SOC2/ticket boilerplate: {'; '.join(parts)}",
                view=view_name,
                metrics=non_ops_stats,
            )

        changelog_hits = find_ephemeral_changelogs(prose)
        if changelog_hits:
            _merge_view_defect(
                view_defects,
                target=rel_target,
                scope="article",
                category="ephemeral_changelog_prose",
                severity="warning",
                message=f"Ephemeral library changelog stamp in conceptual prose: {', '.join(changelog_hits)}",
                view=view_name,
                metrics={"matches": changelog_hits},
            )

        # (e) Type-police boilerplate and zero-ML Python cells.
        tp_counts = detect_type_police(python_blocks) if python_blocks else {}
        if python_blocks and slug not in VALIDATION_LESSON_ALLOWLIST:
            tp_reasons: list[str] = []
            if tp_counts["isinstance_bool"] > 0:
                tp_reasons.append(f"isinstance(..., bool)={tp_counts['isinstance_bool']}")
            if tp_counts["type_not_in_numeric"] > 0:
                tp_reasons.append(f"type(...) not in (int, float)={tp_counts['type_not_in_numeric']}")
            if tp_counts["type_is_not"] > MAX_TYPE_IS_NOT_HITS:
                tp_reasons.append(f"type(...) is not ...={tp_counts['type_is_not']}")
            if tp_counts["math_isfinite"] > MAX_MATH_ISFINITE_HITS:
                tp_reasons.append(f"math.isfinite={tp_counts['math_isfinite']}")
            if tp_reasons:
                _merge_view_defect(
                    view_defects,
                    target=rel_target,
                    scope="article",
                    category="type_police_boilerplate",
                    severity="blocking",
                    message=f"Defensive type-police boilerplate in Python fences: {', '.join(tp_reasons)}",
                    view=view_name,
                    metrics=tp_counts,
                )

        is_ml = is_ml_scope_article(metadata, slug)
        zero_ml = False
        if is_ml and python_blocks:
            joined_py = "\n".join(python_blocks)
            if not ML_LIBRARY_TOKEN_RE.search(joined_py):
                # Book/reader editions may condense small conceptual math examples while website/reference runs full ML code.
                website_metrics = view_metrics.get("website/reference")
                website_has_ml = (
                    website_metrics is not None
                    and website_metrics["python_fences"] > 0
                    and not website_metrics["zero_ml_python"]
                )
                if view_name != "book/reader" or not website_has_ml or len(python_blocks) > 6:
                    zero_ml = True
                    _merge_view_defect(
                        view_defects,
                        target=rel_target,
                        scope="article",
                        category="zero_ml_python_cells",
                        severity="warning",
                        message=(
                            f"Review computation in {len(python_blocks)} Python fence(s): "
                            "no recognized ML/scientific library token; scalar implementations and computed simulations may be appropriate"
                        ),
                        view=view_name,
                        metrics={"python_fences": len(python_blocks)},
                    )

        view_metrics[view_name] = {
            "prose_words": dialect_stats["words"],
            "dialect_density_per_1k": dialect_stats["density_per_1k"],
            "prediction_prompts": pred_count,
            "lawyer_disclaimers": lawyer_hits,
            "non_ops_soc2": non_ops_stats,
            "ephemeral_changelogs": changelog_hits,
            "python_fences": len(python_blocks),
            "type_police": tp_counts,
            "zero_ml_python": zero_ml,
        }

    article_defects = [AuditDefect(**entry) for entry in view_defects.values()]

    # Audit illustrations belonging to this article bundle (standalone + unique embedded).
    illus_defects = audit_bundle_illustrations(
        article_dir,
        content_root,
        embedded_sources=embedded_sources,
        allowlisted_terms=allowlist,
    )

    return article_defects, illus_defects, {
        "target": rel_target,
        "scope": "article",
        "views": view_metrics,
    }


def audit_bundle_illustrations(
    article_dir: Path,
    content_root: Path,
    *,
    embedded_sources: dict[str, tuple[str, str]] | None = None,
    allowlisted_terms: frozenset[str] = frozenset(),
) -> list[AuditDefect]:
    """Audit standalone and embedded TSX illustrations plus rendered _generated PNGs."""
    rel_article = article_dir.relative_to(content_root).as_posix()
    illus_dir = article_dir / "illustrations"
    sources: list[tuple[str, str, str, Path | None]] = []
    seen_names: set[str] = set()

    if illus_dir.is_dir():
        for tsx_path in sorted(illus_dir.rglob("*.tsx")):
            rel_parts = tsx_path.relative_to(illus_dir).parts
            if any(part in EXCLUDED_ILLUSTRATION_DIRS for part in rel_parts):
                continue
            name = tsx_path.stem
            seen_names.add(name)
            display = tsx_path.relative_to(content_root).as_posix()
            sources.append(
                (name, display, tsx_path.read_text(encoding="utf-8"), _find_light_png(illus_dir, tsx_path.stem))
            )

    if embedded_sources:
        for name, (src, display) in sorted(embedded_sources.items()):
            if name in seen_names:
                continue
            sources.append((name, display, src, _find_light_png(illus_dir, name)))

    defects: list[AuditDefect] = []
    for name, display, src, png_path in sources:
        # Check aspect ratio and height from declared TSX exports and rendered PNG.
        width, height = parse_declared_dimensions(src)
        ratio_issues: list[str] = []
        ratio_metrics: dict[str, Any] = {}

        if width is not None and height is not None:
            declared_ratio = round(height / width, 2) if width > 0 else 0.0
            ratio_metrics["declared_width"] = width
            ratio_metrics["declared_height"] = height
            ratio_metrics["declared_ratio"] = declared_ratio
            if (width > 0 and height / width > MAX_ILLUSTRATION_ASPECT_RATIO) or height > MAX_ILLUSTRATION_HEIGHT:
                ratio_issues.append(
                    f"declared {width}x{height} (ratio {declared_ratio:.2f})"
                )

        if png_path is not None:
            png_dims = read_png_dimensions(png_path)
            if png_dims is not None:
                pw, ph = png_dims
                png_ratio = round(ph / pw, 2) if pw > 0 else 0.0
                logical_h = ph / PNG_RENDER_SCALE
                ratio_metrics["png_width"] = pw
                ratio_metrics["png_height"] = ph
                ratio_metrics["png_ratio"] = png_ratio
                ratio_metrics["png_logical_height"] = logical_h
                if (pw > 0 and ph / pw > MAX_ILLUSTRATION_ASPECT_RATIO) or logical_h > MAX_ILLUSTRATION_HEIGHT:
                    ratio_issues.append(
                        f"rendered {pw}x{ph} PNG (ratio {png_ratio:.2f}, logical height {logical_h:.0f})"
                    )

        if ratio_issues:
            defects.append(
                AuditDefect(
                    target=display,
                    scope="illustration",
                    category="illustration_aspect_ratio",
                    severity="blocking",
                    message=(
                        f"Oversized/vertical illustration {rel_article}/{name}: "
                        + "; ".join(ratio_issues)
                    ),
                    metrics=ratio_metrics,
                )
            )

        # Check for card/table-only components lacking chart/matrix/network/flow/SVG primitives.
        if not has_visual_primitive(src):
            defects.append(
                AuditDefect(
                    target=display,
                    scope="illustration",
                    category="illustration_card_only",
                    severity="blocking",
                    message=(
                        f"Illustration {rel_article}/{name} lacks any chart, matrix, "
                        "network, graph, flow, arrow, or SVG primitive"
                    ),
                )
            )

        # Check visible TSX strings for hard-banned or fixture/disclaimer text.
        visible_strings = extract_visible_tsx_strings(src)
        visible_blob = "\n".join(visible_strings)
        banned_in_tsx = find_hard_banned(visible_blob)
        extra_tsx_hits: list[str] = []
        norm_visible = normalize_text(visible_blob)
        for label, pattern in TSX_DISCLAIMER_PATTERNS:
            if label in allowlisted_terms:
                continue
            if pattern.search(norm_visible):
                extra_tsx_hits.append(label)

        all_tsx_hits = banned_in_tsx + [h for h in extra_tsx_hits if h not in banned_in_tsx]
        if all_tsx_hits:
            defects.append(
                AuditDefect(
                    target=display,
                    scope="illustration",
                    category="illustration_visible_text_defect",
                    severity="blocking",
                    message=(
                        f"Disallowed disclaimer/fixture text in visible TSX strings of "
                        f"{rel_article}/{name}: {', '.join(all_tsx_hits)}"
                    ),
                    metrics={"matches": all_tsx_hits},
                )
            )

    return defects


def _find_light_png(illus_dir: Path, name: str) -> Path | None:
    """Return the rendered light PNG for an illustration name if present."""
    if not illus_dir.is_dir():
        return None
    candidate = illus_dir / "_generated" / f"{name}_light.png"
    if candidate.is_file():
        return candidate
    fallback = illus_dir / "_generated" / f"{name}_dark.png"
    return fallback if fallback.is_file() else None


def _collect_json_strings(value: Any) -> list[str]:
    """Recursively flatten string values inside practice metadata.json."""
    out: list[str] = []
    if isinstance(value, str):
        out.append(value)
    elif isinstance(value, list):
        for item in value:
            out.extend(_collect_json_strings(item))
    elif isinstance(value, dict):
        for item in value.values():
            out.extend(_collect_json_strings(item))
    return out


def audit_practice_bundle(
    practice_dir: Path,
    content_root: Path,
) -> tuple[list[AuditDefect], dict[str, Any]]:
    """Audit one practice/<slug> bundle (content.md and metadata.json)."""
    rel_target = practice_dir.relative_to(content_root).as_posix()
    slug = practice_dir.name
    content_path = practice_dir / "content.md"
    metadata_path = practice_dir / "metadata.json"

    content_text = content_path.read_text(encoding="utf-8") if content_path.is_file() else ""
    metadata: dict[str, Any] = {}
    defects: list[AuditDefect] = []

    if metadata_path.is_file():
        try:
            loaded = json.loads(metadata_path.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                metadata = loaded
        except json.JSONDecodeError as exc:
            defects.append(
                AuditDefect(
                    target=rel_target,
                    scope="practice",
                    category="invalid_metadata_json",
                    severity="blocking",
                    message=f"Invalid practice metadata.json: {exc}",
                )
            )

    meta_strings = _collect_json_strings(metadata)
    combined_all = "\n".join([content_text, *meta_strings])
    banned_hits = find_hard_banned(combined_all)
    if banned_hits:
        defects.append(
            AuditDefect(
                target=rel_target,
                scope="practice",
                category="hard_banned_string",
                severity="blocking",
                message=f"Hard-banned string(s) in practice bundle: {', '.join(banned_hits)}",
                metrics={"matches": banned_hits},
            )
        )

    prose_markdown = strip_markdown_to_prose(content_text)
    meta_prose_blobs = _metadata_text_blobs(metadata)
    emdash_lines = find_emdash_lines(content_text)
    meta_emdash = any("\u2014" in blob for blob in meta_prose_blobs)
    if emdash_lines or meta_emdash:
        defects.append(
            AuditDefect(
                target=rel_target,
                scope="practice",
                category="emdash_in_prose",
                severity="blocking",
                message=(
                    f"Em dash in practice prose "
                    f"(content lines: {emdash_lines[:5]}, metadata: {meta_emdash})"
                ),
                metrics={"emdash_line_count": len(emdash_lines), "in_metadata": meta_emdash},
            )
        )

    allowlist = PRACTICE_DIALECT_ALLOWLIST.get(slug, frozenset())
    dialect_stats = compute_dialect_stats(
        "\n".join([prose_markdown, *meta_prose_blobs]),
        allowlisted_terms=allowlist,
    )
    if (
        dialect_stats["effective_hits"] >= MIN_DIALECT_WORDS_GUARD_HITS
        and dialect_stats["density_per_1k"] > MAX_DIALECT_PER_1K_WORDS
    ):
        defects.append(
            AuditDefect(
                target=rel_target,
                scope="practice",
                category="bureaucratic_dialect",
                severity="blocking",
                message=(
                    f"Practice dialect density {dialect_stats['density_per_1k']}/1k "
                    f"({dialect_stats['effective_hits']} hits in {dialect_stats['words']} words)"
                ),
                metrics=dialect_stats,
            )
        )

    python_blocks = [
        code
        for lang, code in extract_code_fences(content_text)
        if lang in ("python", "py", "python3")
    ]
    if python_blocks and slug not in VALIDATION_LESSON_ALLOWLIST:
        tp_counts = detect_type_police(python_blocks)
        if tp_counts["isinstance_bool"] > 0 or tp_counts["type_not_in_numeric"] > 0:
            defects.append(
                AuditDefect(
                    target=rel_target,
                    scope="practice",
                    category="type_police_boilerplate",
                    severity="blocking",
                    message=f"Type-police boilerplate in practice Python fence: {tp_counts}",
                    metrics=tp_counts,
                )
            )

    return defects, {
        "target": rel_target,
        "scope": "practice",
        "prose_words": dialect_stats["words"],
        "dialect_density_per_1k": dialect_stats["density_per_1k"],
    }


def _parse_glossary_frontmatter(raw: str) -> tuple[dict[str, Any], str]:
    """Parse JSON or lightweight YAML frontmatter from a glossary Markdown file."""
    match = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n?(.*)$", raw, re.DOTALL)
    if not match:
        return {}, raw
    fm_text, body = match.group(1), match.group(2)
    stripped = fm_text.strip()
    if stripped.startswith("{"):
        try:
            loaded = json.loads(stripped)
            if isinstance(loaded, dict):
                return loaded, body
        except json.JSONDecodeError:
            pass
    meta: dict[str, Any] = {}
    for line in fm_text.splitlines():
        kv = re.match(r"^\s*([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$", line)
        if not kv:
            continue
        key, val = kv.group(1), kv.group(2).strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        if key == "title":
            meta["title"] = val
        elif key == "shortDescription":
            meta["shortDescription"] = val
    return meta, body


def audit_glossary_file(
    glossary_path: Path,
    content_root: Path,
) -> tuple[list[AuditDefect], dict[str, Any]]:
    """Audit one glossary/<slug>.md file."""
    rel_target = glossary_path.relative_to(content_root).as_posix()
    slug = glossary_path.stem
    raw = glossary_path.read_text(encoding="utf-8")
    metadata, body = _parse_glossary_frontmatter(raw)
    title = str(metadata.get("title", "")) if metadata else ""
    meta_blobs = _metadata_text_blobs(metadata) if metadata else []

    defects: list[AuditDefect] = []
    banned_hits = find_hard_banned(raw)
    if banned_hits:
        defects.append(
            AuditDefect(
                target=rel_target,
                scope="glossary",
                category="hard_banned_string",
                severity="blocking",
                message=f"Hard-banned string(s) in glossary entry: {', '.join(banned_hits)}",
                metrics={"matches": banned_hits},
            )
        )

    emdash_lines = find_emdash_lines(body)
    meta_emdash = any("\u2014" in blob for blob in meta_blobs)
    if emdash_lines or meta_emdash:
        defects.append(
            AuditDefect(
                target=rel_target,
                scope="glossary",
                category="emdash_in_prose",
                severity="blocking",
                message=f"Em dash in glossary prose (lines: {emdash_lines[:5]})",
                metrics={"emdash_line_count": len(emdash_lines), "in_frontmatter": meta_emdash},
            )
        )

    prose = strip_markdown_to_prose(body)
    allowlist = _glossary_allowlist(slug, title)
    dialect_stats = compute_dialect_stats(
        "\n".join([prose, *meta_blobs]),
        allowlisted_terms=allowlist,
    )
    if (
        dialect_stats["effective_hits"] >= MIN_DIALECT_WORDS_GUARD_HITS
        and dialect_stats["density_per_1k"] > MAX_DIALECT_PER_1K_WORDS
    ):
        defects.append(
            AuditDefect(
                target=rel_target,
                scope="glossary",
                category="bureaucratic_dialect",
                severity="blocking",
                message=(
                    f"Glossary dialect density {dialect_stats['density_per_1k']}/1k "
                    f"({dialect_stats['effective_hits']} hits in {dialect_stats['words']} words)"
                ),
                metrics=dialect_stats,
            )
        )

    return defects, {
        "target": rel_target,
        "scope": "glossary",
        "prose_words": dialect_stats["words"],
        "dialect_density_per_1k": dialect_stats["density_per_1k"],
    }


def _discover_article_dirs(content_root: Path, section: str | None = None) -> list[Path]:
    """Find article/blog bundle directories containing content.md (excluding practice/glossary)."""
    if section is not None:
        if section in EXCLUDED_TOP_SECTIONS:
            return []
        sec_dir = content_root / section
        if not sec_dir.is_dir():
            return []
        return sorted(
            p.parent
            for p in sec_dir.rglob("content.md")
            if p.parent.relative_to(content_root).parts[0] not in EXCLUDED_TOP_SECTIONS
        )

    dirs: list[Path] = []
    for content_path in sorted(content_root.rglob("content.md")):
        rel_parts = content_path.relative_to(content_root).parts
        if not rel_parts or rel_parts[0] in EXCLUDED_TOP_SECTIONS:
            continue
        dirs.append(content_path.parent)
    return dirs


def _discover_practice_dirs(content_root: Path) -> list[Path]:
    """Find practice/<slug> directories containing content.md or metadata.json."""
    practice_root = content_root / "practice"
    if not practice_root.is_dir():
        return []
    return sorted(
        d
        for d in practice_root.iterdir()
        if d.is_dir() and ((d / "content.md").is_file() or (d / "metadata.json").is_file())
    )


def _discover_glossary_files(content_root: Path) -> list[Path]:
    """Find glossary/<slug>.md files."""
    glossary_root = content_root / "glossary"
    if not glossary_root.is_dir():
        return []
    return sorted(glossary_root.glob("*.md"))


def _resolve_target_path(content_root: Path, raw_path: str) -> Path | None:
    """Resolve CLI --path argument cleanly against content_root."""
    norm = raw_path.strip().strip("/")
    prefix = "web/src/content/"
    if norm.startswith(prefix):
        norm = norm[len(prefix) :]
    candidate = content_root / norm
    if candidate.exists():
        return candidate
    if not norm.endswith(".md"):
        md_candidate = content_root / f"{norm}.md"
        if md_candidate.is_file():
            return md_candidate
    return None


def run_audit(
    *,
    content_root: Path | None = None,
    target_path: str | None = None,
    section: str | None = None,
    include_practice: bool = False,
    include_glossary: bool = False,
) -> dict[str, Any]:
    """Execute deterministic audit across selected scopes and return structured report."""
    content_root = content_root or DEFAULT_CONTENT_ROOT
    article_dirs: list[Path] = []
    practice_dirs: list[Path] = []
    glossary_files: list[Path] = []
    defects: list[AuditDefect] = []
    scanned_metrics: list[dict[str, Any]] = []

    if target_path is not None:
        resolved = _resolve_target_path(content_root, target_path)
        if resolved is None:
            defects.append(
                AuditDefect(
                    target=target_path,
                    scope="cli",
                    category="target_not_found",
                    severity="blocking",
                    message=f"Target path not found under {content_root}: {target_path}",
                )
            )
        else:
            rel_parts = resolved.relative_to(content_root).parts
            if rel_parts and rel_parts[0] == "practice" and resolved.is_dir():
                practice_dirs.append(resolved)
            elif rel_parts and rel_parts[0] == "glossary" and resolved.is_file():
                glossary_files.append(resolved)
            elif resolved.is_dir() and (resolved / "content.md").is_file():
                article_dirs.append(resolved)
            elif resolved.is_file() and resolved.name == "content.md":
                if len(rel_parts) >= 2 and rel_parts[0] == "practice":
                    practice_dirs.append(resolved.parent)
                else:
                    article_dirs.append(resolved.parent)
            else:
                defects.append(
                    AuditDefect(
                        target=target_path,
                        scope="cli",
                        category="target_not_found",
                        severity="blocking",
                        message=f"Unsupported audit target: {resolved}",
                    )
                )
    elif include_practice or include_glossary:
        if include_practice:
            practice_dirs = _discover_practice_dirs(content_root)
        if include_glossary:
            glossary_files = _discover_glossary_files(content_root)
    elif section is not None:
        if section == "practice":
            practice_dirs = _discover_practice_dirs(content_root)
        elif section == "glossary":
            glossary_files = _discover_glossary_files(content_root)
        else:
            article_dirs = _discover_article_dirs(content_root, section=section)
    else:
        article_dirs = _discover_article_dirs(content_root)
        practice_dirs = _discover_practice_dirs(content_root)
        glossary_files = _discover_glossary_files(content_root)

    illustration_targets_seen = 0
    for adir in article_dirs:
        art_defects, ill_defects, metrics = audit_article_bundle(adir, content_root)
        defects.extend(art_defects)
        defects.extend(ill_defects)
        scanned_metrics.append(metrics)
        illus_dir = adir / "illustrations"
        if illus_dir.is_dir():
            illustration_targets_seen += sum(
                1
                for p in illus_dir.rglob("*.tsx")
                if not any(part in EXCLUDED_ILLUSTRATION_DIRS for part in p.relative_to(illus_dir).parts)
            )

    for pdir in practice_dirs:
        p_defects, p_metrics = audit_practice_bundle(pdir, content_root)
        defects.extend(p_defects)
        scanned_metrics.append(p_metrics)

    for gfile in glossary_files:
        g_defects, g_metrics = audit_glossary_file(gfile, content_root)
        defects.extend(g_defects)
        scanned_metrics.append(g_metrics)

    by_category = Counter(d.category for d in defects)
    by_scope = Counter(d.scope for d in defects)
    blocking_count = sum(1 for d in defects if d.severity == "blocking")
    warning_count = sum(1 for d in defects if d.severity == "warning")

    return {
        "summary": {
            "articles_scanned": len(article_dirs),
            "practice_scanned": len(practice_dirs),
            "glossary_scanned": len(glossary_files),
            "standalone_illustrations_scanned": illustration_targets_seen,
            "total_defects": len(defects),
            "blocking_defects": blocking_count,
            "warning_defects": warning_count,
            "by_category": dict(sorted(by_category.items())),
            "by_scope": dict(sorted(by_scope.items())),
        },
        "defects": [d.to_dict() for d in defects],
        "targets": scanned_metrics,
    }


def _print_summary(report: dict[str, Any]) -> None:
    """Print human-readable defect summary and details to stdout."""
    summary = report["summary"]
    print(
        "Audit scanned: "
        f"{summary['articles_scanned']} articles, "
        f"{summary['practice_scanned']} practice, "
        f"{summary['glossary_scanned']} glossary, "
        f"{summary['standalone_illustrations_scanned']} standalone TSX"
    )
    print(
        f"Defects: {summary['total_defects']} total "
        f"({summary['blocking_defects']} blocking, {summary['warning_defects']} warning)"
    )
    print("These checks do not assess teaching quality. Review the explanation, computed examples, visuals, and learner tasks together.")
    if summary["by_category"]:
        print("By category:")
        for cat, count in summary["by_category"].items():
            print(f"  {cat}: {count}")
    for defect in report["defects"]:
        views_suffix = f" [{', '.join(defect['views'])}]" if defect["views"] else ""
        print(
            f"- [{defect['severity']}:{defect['category']}] "
            f"{defect['target']}{views_suffix}: {defect['message']}"
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Deterministic content and illustration quality audit across LeetLLM."
    )
    parser.add_argument(
        "--path",
        default=None,
        help="Audit a single article/practice/glossary path (e.g., foundations/python-for-ai-engineering)",
    )
    parser.add_argument(
        "--section",
        default=None,
        help="Audit a single section (e.g., foundations, agents, practice, glossary)",
    )
    parser.add_argument(
        "--practice",
        action="store_true",
        help="Audit practice/*/content.md + metadata.json bundles",
    )
    parser.add_argument(
        "--glossary",
        action="store_true",
        help="Audit glossary/*.md files",
    )
    parser.add_argument(
        "--json",
        dest="json_out",
        default=None,
        help="Write full JSON report to this path",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 when any blocking defect exists",
    )
    args = parser.parse_args(argv)

    report = run_audit(
        target_path=args.path,
        section=args.section,
        include_practice=args.practice,
        include_glossary=args.glossary,
    )

    if args.json_out:
        out_path = Path(args.json_out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    try:
        _print_summary(report)
    except BrokenPipeError:
        pass

    if args.strict and report["summary"]["blocking_defects"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
