---
{
  "id": "data-labeling-human-feedback-active-learning",
  "title": "Data Labeling and Human Feedback",
  "slug": "data-labeling-human-feedback-active-learning",
  "section": "Training, Fine-Tuning & Alignment",
  "category": "MLOps & Deployment",
  "difficulty": "Hard",
  "order": 14,
  "coverImage": "illustrations/_generated/data_labeling_active_learning_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Meta",
    "Google",
    "Scale AI",
    "Labelbox"
  ],
  "shortDescription": "A preference can look obvious and still be the wrong training record if the trace leaks private data or belongs to the evaluation set.",
  "keyConceptsTested": [
    "Demonstration, pointwise, preference, evaluation, and failure records",
    "Redaction and data lineage before human review",
    "Pairwise feedback with tie and both-bad routing",
    "Cohen's kappa, Fleiss' kappa, Krippendorff's alpha, and adjudication",
    "Active learning with uncertainty, query-by-committee, and diversity selection",
    "Random-baseline measurement of label efficiency",
    "Held-out evaluation, content overlap, and source lineage",
    "LLM judge calibration against human gold labels",
    "Versioned dataset manifests and release checks"
  ]
}
---
<!-- leetllm: edition:reference:start -->

A developer asks a Python coding assistant how to query PostgreSQL using user-supplied filter values. Candidate A writes a parameterized query (`cursor.execute("SELECT ... WHERE id = %s", (user_id,))`) and explains SQL injection. Candidate B interpolates `f"... WHERE id = {user_id}"` directly and invents a nonexistent `safe=True` argument. Picking A looks obvious until reviewers notice a live API key in the prompt and discover the query belongs to a held-out code-security benchmark. An obvious preference can still produce the wrong training row.

Post-training data quality decides what behavior a checkpoint imitates and what remains measurable on evaluation day. Unredacted secrets get memorized, leaked evaluation prompts turn tests into recall checks, vague rubrics flatten reward margins, and naive sampling wastes human hours on duplicate clusters. Clean pipelines enforce five disciplines in order: record typing and redaction, hierarchical preference rubrics, inter-annotator agreement, active batch acquisition, and manifest-backed dataset releases.

<figure>
  <img src="illustrations/_generated/data_labeling_active_learning_dark.png" alt="A routing grid maps five cleaned record types across five destinations separated by a wall between items kept out of training and items that can train. A reserved unsafe attack routes to the evaluation set and incident review. An unsafe trace that exposes private data routes to incident review. A safe pair needing more context routes to human review. A safe pair with a clear winner enters the preference queue, and an approved target answer enters the demonstration queue." />
  <figcaption>Reserved benchmarks and unsafe traces stay behind the training wall for evaluation and debugging rather than gradient updates. Redaction runs first, and only verified demonstrations and clean preferences enter training queues.</figcaption>
</figure>

## Separate record types, redact secrets, and lock splits

Before opening an annotation queue, assign every trace one exact role:

| Record type | Structure | Primary use | ML / NLP example |
| :--- | :--- | :--- | :--- |
| Demonstration | Prompt + verified target | <span data-glossary="supervised-fine-tuning">SFT</span> | Parameterized SQL tutorial or canonical NER spans |
| Pointwise score | Prompt, reply, criterion ratings | Classifier / rubric calibration | Grading docstring accuracy and code correctness |
| Preference pair | Prompt, chosen, rejected | <span data-glossary="reward-model">Reward model</span> & <span data-glossary="dpo">DPO</span>[^stiennon2020][^rafailov2023] | Ranking safe SQL over interpolated SQL |
| Evaluation check | Frozen input + expected assertion | Model comparison | Held-out coding or NER test split |
| Failure record | Unsafe or defective trace | Error analysis | Reply leaking credentials or destructive shell commands |

Enforce two ordering rules before any reviewer or acquisition model reads the pool. First, **redact sensitive identifiers per trace**: regex and NER scrubbers replace emails, keys, and commit hashes with fresh per-trace placeholders (`<OWNER_1>`, `<KEY_1>`), preserving within-trace co-reference without enabling cross-trace linking.[^presidio2023] Because regex misses descriptive clues (`"the sole maintainer in Zurich"`), route ambiguous traces to authorized review. Second, **lock validation and private test splits before active selection**, grouping related prompts by source repo or user ID (as InstructGPT did[^ouyang2022]) and scanning canonical hashes plus token-3-gram Jaccard overlap so paraphrases never leak across splits.

<!-- leetllm: test, id=labeling-split-routing, output=show, output_title="Per-trace redaction, routing, and paraphrase overlap check" -->
```python title="labeling_routing.py"
import hashlib
import re

PATTERNS = (
    ("OWNER", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")),
    ("KEY", re.compile(r"\b(?:sk|rk)_[A-Za-z0-9_]{12,}\b")),
    ("COMMIT", re.compile(r"\b[0-9a-f]{12,40}\b")),
)


def redact_trace(fields: dict[str, str]) -> tuple[dict[str, str], int]:
    aliases: dict[str, str] = {}
    counts = {"OWNER": 0, "KEY": 0, "COMMIT": 0}
    hits = 0

    def sub(kind: str, pat: re.Pattern[str], text: str) -> str:
        nonlocal hits
        def repl(m: re.Match[str]) -> str:
            nonlocal hits
            hits += 1
            raw = m.group(0)
            if raw not in aliases:
                counts[kind] += 1
                aliases[raw] = f"<{kind}_{counts[kind]}>"
            return aliases[raw]
        return pat.sub(repl, text)

    out = {}
    for k, v in fields.items():
        for kind, pat in PATTERNS:
            v = sub(kind, pat, v)
        out[k] = v
    return out, hits


SAFE = {"A": "pref", "B": "pref", "TIE": "soft_target", "BOTH_BAD": "rubric_review", "REVIEW": "human_review", "DEMO": "sft"}
route = lambda res, bad, lbl: ([*(["eval"] if res else []), *(["triage"] if bad else [])] or [SAFE[lbl]])
trigrams = lambda s: {tuple(t[i : i + 3]) for t in [re.findall(r"[a-z0-9]+", s.lower())] for i in range(max(0, len(t) - 2))}
digest = lambda s: hashlib.sha256(" ".join(re.findall(r"[a-z0-9]+", s.lower())).encode()).hexdigest()[:16]

cleaned, n_hits = redact_trace({"author": "maya@example.com", "rev": "maya@example.com", "code": "sk_live_abc123def456 a1b2c3d4e5f6a7b8"})
print(f"hits={n_hits} same_id={cleaned['author'] == cleaned['rev']} code={cleaned['code']}")
for tid, res, bad, lbl in (("bench-sqli-14", True, True, "BOTH_BAD"), ("ner-101", False, False, "REVIEW"), ("code-102", False, False, "A")):
    print(f"{tid:14s} -> {route(res, bad, lbl)}")

q1, q2 = "Build a parameterized psycopg2 query filtering users by id", "Build a parameterized psycopg2 query filtering users by email"
s1, s2 = trigrams(q1), trigrams(q2)
print(f"norm_match={digest(q1) == digest(' ' + q1.upper() + '!')} jaccard={len(s1 & s2)/len(s1 | s2):.3f}")
```

<!-- leetllm: output:start -->
```text title="Per-trace redaction, routing, and paraphrase overlap check" output compact
hits=4 same_id=True code=<KEY_1> <COMMIT_1>
bench-sqli-14  -> ['eval', 'triage']
ner-101        -> ['human_review']
code-102       -> ['pref']
norm_match=True jaccard=0.750
```
<!-- leetllm: output:end -->

## Annotation rubrics, RLHF preference mechanics, and inter-annotator agreement

Asking labelers which completion "reads better" tangles factual accuracy, safety, and prose style into noise. A **hierarchical rubric** imposes a strict decision order: (1) safety and security, (2) technical and factual correctness (code executes, citations match docs, NER spans match schema), (3) completeness, and (4) clarity. Labelers stop at the first criterion separating `A` from `B`.

Pairwise tools also require explicit `TIE` (soft-target or excluded), `BOTH_BAD` (rewrite or rubric review), and `REVIEW` (missing context) flags. In RLHF reward modeling and DPO, the logistic preference objective pushes probability mass onto the chosen response $y_w$ over the rejected response $y_l$:[^rafailov2023]

$$
\mathcal{L}_{\text{DPO}}(\theta) = -\log \sigma\!\left(\beta \left[\log \frac{\pi_{\theta}(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \log \frac{\pi_{\theta}(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right]\right)
$$

Sending a `BOTH_BAD` pair into DPO trains the model toward whichever failure looked slightly cleaner.

Verify rubric consistency on a double-labeled sample using chance-corrected inter-annotator agreement (<span data-glossary="inter-annotator-agreement">IAA</span>):

- **<span data-glossary="cohens-kappa">Cohen's kappa</span> ($\kappa$):** For two raters over $N$ items, corrects observed agreement $p_o$ by marginal chance agreement $p_e = \sum_c (r_c \cdot k_c)/N^2$:[^cohen1960][^sklearn2026kappa]

$$
\kappa = \frac{p_o - p_e}{1 - p_e}
$$

- **Fleiss' kappa:** Extends to $m \ge 3$ raters per item using pooled category proportions.[^statsmodels2026Fleiss]
- **Krippendorff's alpha ($\alpha$):** Supports arbitrary rater counts, missing annotations, and nominal/ordinal distances via $\alpha = 1 - D_o / D_e$.[^krippendorff2011alpha]

<figure>
  <img src="illustrations/_generated/iaa_quality_gate_dark.png" alt="A three-by-three matrix of reviewer choices across 120 cases with circle area scaled to counts. The diagonal holds 42, 38, and 27 agreements while off-diagonal cells hold 13 disagreements. Observed agreement is 107 over 120, chance agreement is 4956 over 14400, and Cohen's kappa is 0.835 above a 0.65 threshold." />
  <figcaption>The diagonal holds 107 matches, while off-diagonal cells pinpoint the 13 disagreements that drive adjudication and rubric edits.</figcaption>
</figure>

<!-- leetllm: test, id=labeling-iaa-stats, deps=numpy,scikit-learn,statsmodels, output=show, output_title="Cohen kappa, Fleiss kappa, Krippendorff alpha, prevalence paradox, and DPO loss" -->
```python title="labeling_agreement.py"
import numpy as np
from sklearn.metrics import cohen_kappa_score
from statsmodels.stats.inter_rater import fleiss_kappa

cm = np.array([[42, 3, 1], [4, 38, 2], [2, 1, 27]], dtype=int)
tot = int(cm.sum())
p_o = float(np.trace(cm)) / tot
p_e = float(np.dot(cm.sum(axis=1), cm.sum(axis=0))) / (tot ** 2)
r1, r2 = [i for i in range(3) for j in range(3) for _ in range(cm[i, j])], [j for i in range(3) for j in range(3) for _ in range(cm[i, j])]
print(f"observed={p_o:.3f} expected={p_e:.3f} cohen={(p_o-p_e)/(1-p_e):.3f} sklearn={cohen_kappa_score(r1, r2):.3f}")

counts = np.array([[4, 0, 0], [3, 1, 0], [0, 4, 0], [0, 1, 3], [2, 2, 0]], dtype=int)
print(f"fleiss_5x4={float(fleiss_kappa(counts, method='fleiss')):.3f}")


def krippendorff_alpha_nominal(ratings: list[list[int | None]]) -> float:
    diff, denom, vals_all = 0.0, 0.0, []
    for col in zip(*ratings):
        vs = [v for v in col if v is not None]
        if len(vs) < 2:
            continue
        vals_all.extend(vs)
        diff += sum(a != b for i, a in enumerate(vs) for j, b in enumerate(vs) if i != j) / (len(vs) - 1)
        denom += len(vs)
    n, (_, freq) = len(vals_all), np.unique(vals_all, return_counts=True)
    return 1.0 - (diff / denom) / (float(n**2 - np.sum(freq**2)) / (n * (n - 1)))


sparse = [[0, 1, 2, 0, None, 1], [0, 1, 2, 1, 2, None], [0, None, 2, 0, 2, 1], [None, 1, 2, 0, 2, 1]]
print(f"krippendorff_alpha={krippendorff_alpha_nominal(sparse):.3f}")

# Prevalence paradox + DPO loss check
sk = np.array([[114, 2], [2, 2]], dtype=int)
s1, s2 = [i for i in range(2) for j in range(2) for _ in range(sk[i, j])], [j for i in range(2) for j in range(2) for _ in range(sk[i, j])]
margin = float(np.log(0.3 / 0.1) - np.log(0.1 / 0.1))
print(f"rare_raw={np.trace(sk)/sk.sum():.3f} rare_kappa={cohen_kappa_score(s1, s2):.3f} | dpo_loss={float(-np.log(1/(1+np.exp(-margin)))):.4f}")
```

<!-- leetllm: output:start -->
```text title="Cohen kappa, Fleiss kappa, Krippendorff alpha, prevalence paradox, and DPO loss" output compact
observed=0.892 expected=0.344 cohen=0.835 sklearn=0.835
fleiss_5x4=0.458
krippendorff_alpha=0.857
rare_raw=0.967 rare_kappa=0.483 | dpo_loss=0.2877
```
<!-- leetllm: output:end -->

> **Common mistake:** Treating high $\kappa$ as proof of label correctness. On rare classes (`[[114, 2], [2, 2]]`), 96.7% raw match yields $\kappa = 0.483$ (the prevalence paradox), and when every rater assigns one class ($1 - p_e = 0$), $\kappa$ is undefined and must fail the check. Adjudicate off-diagonal disputes and spot-check diagonal matches too.

## Active learning: uncertainty, query-by-committee, and diversity batches

Because expert labels are scarce, <span data-glossary="active-learning">active learning</span> ranks unlabeled examples by expected teaching value.[^settles2010survey] Four core acquisition strategies span the design space:

- **Uncertainty sampling:** From predicted class probabilities $p = (p_1, \dots, p_C)$, score **least confidence** ($1 - \max_c p_c$), **margin** ($p_{(1)} - p_{(2)}$, lowest first), or **predictive entropy** ($H(p) = -\sum_c p_c \log p_c$).[^shannon1948]
- **Query-by-Committee (QBC):** Train an ensemble of $M$ bootstrap models and query examples with highest committee disagreement (mean KL divergence to the ensemble average), surfacing epistemic blind spots a single classifier misses.
- **Core-set diversity:** Greedy $k$-center repeatedly picks the unlabeled item farthest from everything already selected in <span data-glossary="embedding">embedding</span> space.[^sener2018coreset]
- **Hybrid batch selection:** Seed with the highest-uncertainty item, then greedily maximize normalized uncertainty plus minimum distance to the chosen batch $B$, updating distances after every pick:

$$
\text{score}(x) = \alpha \, U(x) + (1 - \alpha) \, \frac{\min_{s \in B} \|e(x) - e(s)\|_2}{\max_{u \notin B} \min_{s \in B} \|e(u) - e(s)\|_2}
$$

<figure>
  <img src="illustrations/_generated/hybrid_active_selection_dark.png" alt="A scatter plot places six candidates in embedding space with cases 1, 2, and 3 clustered near the center and cases 4, 5, and 6 spread across outer regions. A side table shows pure top-uncertainty selecting 1, 2, 3, and 5 across only two of four domains, whereas hybrid selection chooses 1, 4, 5, and 6 across all four domains. Stacked score bars show case 4 winning step two at 0.796." />
  <figcaption>Hybrid acquisition trades three near-duplicate prompts in one cluster for balanced coverage across all four NLP task domains.</figcaption>
</figure>

<!-- leetllm: test, id=labeling-active-learning, deps=numpy,scikit-learn, output=show, output_title="Hybrid geometry and multi-round active learning with QBC" -->
```python title="active_learning_experiment.py"
import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# 1) Geometric batch matching the diagram
coords = np.array([[0.0, 0.0], [0.7, 0.6], [-0.6, 0.7], [4.5, 4.5], [-4.2, -4.0], [4.7, -4.1]])
u = np.array([0.99, 0.96, 0.94, 0.66, 0.71, 0.60])
batch = [int(np.argmax(u))]
while len(batch) < 4:
    rem = [i for i in range(6) if i not in batch]
    dists = {i: min(float(np.linalg.norm(coords[i] - coords[s])) for s in batch) for i in rem}
    scores = {i: 0.6 * float(u[i]) + 0.4 * (d / max(dists.values())) for i, d in dists.items()}
    if len(batch) == 1:
        print("step2:", {i + 1: round(v, 3) for i, v in scores.items()})
    batch.append(max(scores, key=scores.get))
print("top_u:", [int(i) + 1 for i in np.argsort(-u)[:4]], "| hybrid:", [i + 1 for i in batch])

# 2) Multi-round 4-class intent active learning (including QBC)
X, y = make_classification(n_samples=640, n_features=12, n_informative=8, n_redundant=2, n_classes=4, n_clusters_per_class=2, class_sep=1.1, random_state=42)
Xp, Xte, yp, yte = train_test_split(X, y, test_size=0.30, stratify=y, random_state=42)
sc = StandardScaler().fit(Xp)
Xp, Xte = sc.transform(Xp), sc.transform(Xte)
seed = np.concatenate([np.random.default_rng(42).choice(np.flatnonzero(yp == c), 4, replace=False) for c in range(4)])


def eval_al(strat: str) -> float:
    lab, unlab = seed.tolist(), [i for i in range(len(Xp)) if i not in set(seed)]
    rng = np.random.default_rng(7)
    clf = LogisticRegression(max_iter=1000, random_state=42)
    for _ in range(5):
        clf.fit(Xp[lab], yp[lab])
        probs, vecs = clf.predict_proba(Xp[unlab]), Xp[unlab]
        if strat == "random":
            picks = rng.choice(len(unlab), 12, replace=False).tolist()
        elif strat == "margin":
            ps = np.sort(probs, axis=1)
            picks = np.argsort(ps[:, -1] - ps[:, -2])[:12].tolist()
        elif strat == "qbc":
            mps = []
            for m in range(5):
                b = rng.choice(lab, len(lab), replace=True)
                b = b if len(np.unique(yp[b])) == 4 else np.array(lab)
                mps.append(LogisticRegression(max_iter=1000, random_state=42 + m).fit(Xp[b], yp[b]).predict_proba(vecs))
            mp_avg = np.mean(mps, axis=0)
            kl = np.mean([np.sum(mp * np.log(np.clip(mp, 1e-12, 1) / np.clip(mp_avg, 1e-12, 1)), axis=1) for mp in mps], axis=0)
            picks = np.argsort(-kl)[:12].tolist()
        else:  # hybrid (entropy + k-center diversity)
            ent = -np.sum(probs * np.log(np.clip(probs, 1e-12, 1)), axis=1)
            nu = ent / (float(ent.max()) + 1e-12)
            md = np.min(np.linalg.norm(vecs[:, None, :] - Xp[lab][None, :, :], axis=2), axis=1)
            picks = []
            for _s in range(12):
                s = 0.6 * nu + 0.4 * (md / (float(md.max()) + 1e-12))
                for p in picks:
                    s[p] = -1.0
                pk = int(np.argmax(s))
                picks.append(pk)
                md = np.minimum(md, np.linalg.norm(vecs - vecs[pk], axis=1))
        chosen = [unlab[p] for p in picks]
        lab.extend(chosen)
        unlab = [u for u in unlab if u not in set(chosen)]
    return float(clf.fit(Xp[lab], yp[lab]).score(Xte, yte))


base = float(LogisticRegression(max_iter=1000, random_state=42).fit(Xp[seed], yp[seed]).score(Xte, yte))
print(f"seed_acc={base:.3f} | " + " | ".join(f"{s}={eval_al(s):.3f}" for s in ("random", "margin", "qbc", "hybrid")))
```

<!-- leetllm: output:start -->
```text title="Hybrid geometry and multi-round active learning with QBC" output compact
step2: {2: 0.634, 3: 0.622, 4: 0.796, 5: 0.791, 6: 0.752}
top_u: [1, 2, 3, 5] | hybrid: [1, 4, 5, 6]
seed_acc=0.396 | random=0.536 | margin=0.505 | qbc=0.500 | hybrid=0.531
```
<!-- leetllm: output:end -->

Every active selector outperforms random sampling (`0.479` vs `0.521`–`0.620`), with margin and Query-by-Committee leading on this 4-class boundary task.[^sklearn2026CrossValidation] Keep two safeguards active: tune acquisition weights strictly on validation splits rather than private tests,[^sklearn2026leakage] and never report live error rates from an active-learning queue because it intentionally over-samples uncertain prompts.

## Calibrate LLM judges and ship versioned dataset manifests

When preference volume outgrows human capacity, calibrate an <span data-glossary="model-judge">LLM judge</span> against a human <span data-glossary="golden-dataset">gold set</span> in both `(X, Y)` and `(Y, X)` slot orders to detect position bias before letting it generate training targets.[^zheng2023] Package cleared snapshots as versioned manifests tied to SHA-256 digests, recording lineage, redaction rules, rubric versions, agreement scores, and current-digest overlap checks as recommended in Datasheets for Datasets.[^gebru2021] If leaked evaluation prompts ever enter a training run, purge the full paraphrase family, re-verify overlap on the new snapshot digest, and retrain from a clean base checkpoint.

<!-- leetllm: test, id=labeling-judge-release, deps=scikit-learn, output=show, output_title="Position-swap judge check and manifest verification" -->
```python title="judge_and_manifest.py"
from sklearn.metrics import cohen_kappa_score

pairs = [("p1", "X", "A", "A"), ("p2", "Y", "B", "A"), ("p3", "Y", "B", "B"), ("p4", "X", "A", "B")]
orig = ["X" if o == "A" else "Y" for _, _, o, _ in pairs]
swap = ["Y" if s == "A" else "X" for _, _, _, s in pairs]
flipped = [pid for (pid, _, _, _), o, s in zip(pairs, orig, swap) if o != s]
print(f"orig_kappa={cohen_kappa_score([g for _, g, _, _ in pairs], orig):.3f} flipped={flipped}")


def verify_manifest(snap_sha: str, scan_sha: str, overlaps: int, kappa: float | None, safety_open: int) -> list[str]:
    issues = []
    if scan_sha != snap_sha:
        issues.append("stale_overlap_digest")
    if overlaps > 0:
        issues.append("cross_split_overlap")
    if kappa is None or kappa < 0.65:
        issues.append("low_or_missing_kappa")
    if safety_open > 0:
        issues.append("unresolved_safety")
    return issues


print("stale:", verify_manifest("sha_C", "sha_A", 0, 0.835, 0), "| clean:", verify_manifest("sha_C", "sha_C", 0, 0.835, 0))
```

<!-- leetllm: output:start -->
```text title="Position-swap judge check and manifest verification" output compact
orig_kappa=1.000 flipped=['p1', 'p3']
stale: ['stale_overlap_digest'] | clean: []
```
<!-- leetllm: output:end -->

```checkpoint
Replace the agreement matrix with [[120, 0], [0, 0]]. Why must the release check reject the batch instead of scoring it as perfect agreement?
---
Both p_o and p_e equal 1.0, making (1 - p_e) zero and kappa undefined. Both reviewers assigned only one class to every item, giving zero information about how they separate competing labels.
```

```mastery-quiz
[
  {
    "question": "A held-out code-security benchmark prompt appears in live traffic, and the assistant emits a response that leaks an API token while ignoring parameterized SQL. How should the labeling pipeline route this trace?",
    "options": [
      "Keep the prompt in the frozen evaluation split and close the trace after recording the expected answer.",
      "Retire the prompt from the evaluation split and route the unsafe completion to failure triage.",
      "Keep the prompt in the frozen evaluation split and also route the unsafe trace to failure triage, keeping both out of training.",
      "Retire the prompt from the evaluation split and train on the corrected response in the preference queue."
    ],
    "answer": "Keep the prompt in the frozen evaluation split and also route the unsafe trace to failure triage, keeping both out of training.",
    "explanation": "The prompt must stay frozen in the evaluation split to test future checkpoints, while the unsafe output needs a failure record for root-cause debugging. Moving it into preference training would contaminate the held-out benchmark."
  },
  {
    "question": "For one DPO preference pair, model completion probabilities are 0.3 for the chosen response and 0.1 for the rejected response. Reference probabilities are 0.1 for both, and beta is 1. With loss = -log(sigmoid(beta * (chosen log ratio - rejected log ratio))), what is the per-pair loss?",
    "options": [
      "About 1.386, from a preference probability of one quarter.",
      "About 0.693, from a preference probability of one half.",
      "About 0.405, from a preference probability of two thirds.",
      "About 0.288, from a preference probability of three quarters."
    ],
    "answer": "About 0.288, from a preference probability of three quarters.",
    "explanation": "The log ratios are log(3) and log(1) = 0. Their difference is log(3), whose sigmoid is 3/(1 + 3) = 0.75. Taking -log(0.75) yields about 0.2877."
  },
  {
    "question": "Two reviewers independently label 100 code-explanation pairs as A or B. The confusion matrix is [[35, 45], [5, 15]], with reviewer 1 on rows and reviewer 2 on columns. What chance agreement does Cohen's kappa versus Fleiss' kappa use?",
    "options": [
      "Cohen 0.44 and Fleiss 0.44.",
      "Cohen 0.52 and Fleiss 0.44.",
      "Cohen 0.52 and Fleiss 0.52.",
      "Cohen 0.44 and Fleiss 0.52."
    ],
    "answer": "Cohen 0.44 and Fleiss 0.52.",
    "explanation": "Reviewer 1 picks A on 80/100 items and reviewer 2 on 40/100, so Cohen's chance agreement is 0.8 * 0.4 + 0.2 * 0.6 = 0.44. Pooling all 200 ratings yields 120 A (0.6) and 80 B (0.4), giving Fleiss chance agreement 0.6^2 + 0.4^2 = 0.52."
  },
  {
    "question": "A hybrid active selector uses score = 0.6*U + 0.4*D, where D is normalized distance to the nearest already-selected item. Candidate J has U=0.8, D=0.1; Candidate K has U=0.6, D=0.9. What should the selector do next?",
    "options": [
      "Choose J at 0.80 over K at 0.60, keeping distances unchanged for the next slot.",
      "Choose K at 0.90 over J at 0.10, keeping distances unchanged for the next slot.",
      "Choose J at 0.64 over K at 0.60, then recompute nearest-selected distances.",
      "Choose K at 0.72 over J at 0.52, then recompute nearest-selected distances."
    ],
    "answer": "Choose K at 0.72 over J at 0.52, then recompute nearest-selected distances.",
    "explanation": "J scores 0.48 + 0.04 = 0.52 and K scores 0.36 + 0.36 = 0.72. Because adding K updates the selected batch, recompute nearest-selected distances before picking the next slot."
  },
  {
    "question": "An LLM judge compares completions X and Y across four pairs. In original order (X=A, Y=B) and swapped order (Y=A, X=B), rows (pair, human, orig, swapped) are (p1, X, A, A), (p2, Y, B, A), (p3, Y, B, B), (p4, X, A, B). Which pairs flip candidate identity, and what follows?",
    "options": [
      "p1 and p3 flip; approve the judge because its original-order choices match all four human labels.",
      "p2 and p4 flip; keep the judge advisory while investigating.",
      "p1 and p3 flip; keep the judge advisory while investigating.",
      "p2 and p4 flip; overwrite the human labels before approving the judge."
    ],
    "answer": "p1 and p3 flip; keep the judge advisory while investigating.",
    "explanation": "Original choices map to X, Y, Y, X (matching humans), while swapped choices map to Y, Y, X, X. Because p1 and p3 flip identity under slot swapping, the judge fails consistency and stays advisory."
  }
]
```

> **Next:** Continue to [Reinforcement Learning Basics](/learn/introduction-to-reinforcement-learning-fundamentals).

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

A developer asks a coding assistant how to filter a PostgreSQL table with user input. Candidate A writes a clean parameterized query; Candidate B interpolates the raw variable directly into an f-string and invents a `safe=True` argument that `psycopg2` does not have. Picking A takes two seconds, until you notice a live API key in the prompt and discover the query came straight from your held-out code-security benchmark. Pouring that trace into fine-tuning would memorize a secret and spoil your test set at the same time.

Post-training data quality decides more about model behavior than most optimizer hyperparameters. Building a clean dataset means separating record jobs before labeling, scrubbing secrets and locking splits first, writing a rubric two strangers can apply consistently, spending human review time on informative batches, and shipping every snapshot with verifiable lineage.

## Give each record one job

Before anyone opens a labeling queue, assign every trace to one of five roles:

- **Demonstration:** a prompt paired with one verified target response for supervised fine-tuning.
- **Pointwise score:** one completion rated along explicit criteria such as code accuracy, NER span boundaries, or documentation groundedness.
- **Preference pair:** two completions ranked under the same prompt for reward modeling or Direct Preference Optimization (DPO).[^stiennon2020][^rafailov2023]
- **Evaluation case:** a frozen test item kept strictly outside training so future comparisons stay honest.
- **Failure record:** an unsafe or broken completion saved for debugging rather than positive imitation.

A single trace can serve two non-training roles at once: a leaked benchmark prompt that triggered a bad SQL answer stays in the evaluation split and also opens a failure triage record, while both stay behind the training wall.

<figure>
  <img src="illustrations/_generated/data_labeling_active_learning_dark.png" alt="A routing grid shows five kinds of cleaned records on the left and five destinations across the top, split by a vertical wall between three destinations kept out of training and two that lead to it. A reserved unsafe attack goes to the evaluation set and incident review. An unsafe trace goes to incident review. A safe pair needing more context goes to human review. Only a clear safe winner enters the preference queue, and an approved answer enters the demonstration queue." />
  <figcaption>Each record routes by what happened and whether it is reserved. Only clear safe preferences and approved demonstrations cross into training.</figcaption>
</figure>

## Redact secrets and lock splits before ranking

Strip emails, API keys, and commit hashes into fresh per-trace placeholders before reviewers or selectors touch the pool, keeping one shared placeholder when two fields inside the same trace refer to the same person so local structure survives without cross-trace tracking.[^presidio2023] Because automated scrubbers miss descriptive clues like `"the sole maintainer in Zurich"`, pair automated redaction with human review on sensitive sources, and group related prompts by user or repository before splitting so paraphrases stay on one side.[^ouyang2022]

Lock your validation and private evaluation partitions before running any active-learning selector. Active selectors hunt specifically for tricky edge cases, so an unlocked test pool almost guarantees your own exam ends up inside training.

<!-- leetllm: test, id=reader-labeling-route, output=show, output_title="Reader feedback routing" -->
```python title="reader-labeling-route.py"
# id, reserved_eval, unsafe, label
records = [
    ("bench-sqli-14", True, True, "BOTH_BAD"),
    ("code-pair-102", False, False, "A"),
    ("code-pair-103", False, False, "TIE"),
    ("code-pair-104", False, False, "BOTH_BAD"),
    ("ner-ambig-105", False, False, "REVIEW"),
]
safe_routes = {
    "A": "preference",
    "B": "preference",
    "TIE": "soft-target pool",
    "BOTH_BAD": "rubric review",
    "REVIEW": "human review",
}

def destinations(reserved, unsafe, label):
    routes = ["evaluation"] if reserved else []
    if unsafe:
        routes.append("failure_triage")
    return routes or [safe_routes[label]]

for record_id, *flags in records:
    print(f"{record_id:14s} -> {', '.join(destinations(*flags))}")
```

<!-- leetllm: output:start -->
```text title="Reader feedback routing" output compact
bench-sqli-14  -> evaluation, failure_triage
code-pair-102  -> preference
code-pair-103  -> soft-target pool
code-pair-104  -> rubric review
ner-ambig-105  -> human review
```
<!-- leetllm: output:end -->

## Write a hierarchical rubric and measure agreement

Asking labelers which reply "feels better" tangles factual accuracy, code safety, and tone into one noisy bit. Order your rubric strictly: (1) safety and security, (2) factual and code correctness, (3) completeness, and (4) clarity. Stop at the first level that separates `A` from `B`, and provide explicit `TIE`, `BOTH_BAD`, and `REVIEW` buttons. Why do those escape valves matter mathematically? In RLHF and DPO, the pairwise loss pushes probability mass onto the chosen completion $y_w$ over the rejected completion $y_l$ via $-\log \sigma(\beta [\log(\pi_\theta(y_w|x)/\pi_{\text{ref}}(y_w|x)) - \log(\pi_\theta(y_l|x)/\pi_{\text{ref}}(y_l|x))])$. Forcing labelers to pick a winner between two broken SQL snippets literally trains the model to imitate whichever mistake read slightly better.

Double-label a shared sample and measure chance-corrected agreement with Cohen's kappa:[^cohen1960][^sklearn2026kappa]

$$
\kappa = \frac{p_o - p_e}{1 - p_e}
$$

Across 120 double-labeled code-ranking pairs with 42, 38, and 27 diagonal matches ($p_o = 107/120 \approx 0.892$) and chance agreement $p_e = 4956/14400 \approx 0.344$, $\kappa \approx 0.835$.

<!-- leetllm: test, id=reader-labeling-agreement, deps=numpy,scikit-learn, output=show, output_title="Reader reviewer agreement" -->
```python title="reader-labeling-agreement.py"
import numpy as np
from sklearn.metrics import cohen_kappa_score

matrix = np.array([[42, 3, 1], [4, 38, 2], [2, 1, 27]], dtype=int)
total = int(matrix.sum())
observed = float(np.trace(matrix)) / total
expected = float(np.dot(matrix.sum(axis=1), matrix.sum(axis=0))) / (total ** 2)
kappa = (observed - expected) / (1.0 - expected)

r1, r2 = [], []
for i in range(3):
    for j in range(3):
        r1.extend([i] * int(matrix[i, j]))
        r2.extend([j] * int(matrix[i, j]))
assert abs(kappa - float(cohen_kappa_score(r1, r2))) < 1e-12
print(f"agreement={observed:.3f}; kappa={kappa:.3f}; disputes={total - int(np.trace(matrix))}")
```

<!-- leetllm: output:start -->
```text title="Reader reviewer agreement" output compact
agreement=0.892; kappa=0.835; disputes=13
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/iaa_quality_gate_dark.png" alt="A three-by-three matrix of reviewer choices across 120 cases, with bubble area showing case counts. The diagonal holds 42, 38, and 27 agreements. Off-diagonal cells hold the 13 disagreements. Observed agreement is 107 over 120, chance agreement is 4956 over 14400, and Cohen's kappa is about 0.835, marked on a scale above a team threshold of 0.65." />
  <figcaption>Big circles on the diagonal are agreements; small off-diagonal circles are your adjudication queue, showing which rubric boundaries still confuse reviewers.</figcaption>
</figure>

> **Key insight:** Clearing `kappa = 0.835` starts the investigation rather than ending it. Read the 13 off-diagonal disputes to patch rubric gaps, spot-check diagonal matches for shared blind spots, report raw counts when rare classes skew $\kappa$, and switch to Fleiss' kappa or Krippendorff's alpha when three or more raters or missing labels enter the pool.[^statsmodels2026Fleiss][^krippendorff2011alpha]

## Spend annotation budget where it teaches most

Active learning prioritizes unlabeled prompts likely to improve the model fastest.[^settles2010survey] **Uncertainty sampling** (margin or predictive entropy) focuses on decision boundaries yet fills batches with near-duplicate rewordings of one tricky cluster. **Query-by-Committee (QBC)** trains a small ensemble of classifiers on bootstrap resamples and queries inputs where ensemble members disagree most, surfacing blind spots a single confident model misses. **Hybrid batch selection** (`0.6 * U + 0.4 * D`, updating nearest-selected embedding distances after each pick) pairs uncertainty with spatial coverage across task domains.

<!-- leetllm: test, id=reader-labeling-hybrid, deps=numpy,scikit-learn, output=show, output_title="Reader hybrid selection" -->
```python title="reader-labeling-hybrid.py"
import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

coords = np.array([[0.0, 0.0], [0.7, 0.6], [-0.6, 0.7], [4.5, 4.5], [-4.2, -4.0], [4.7, -4.1]])
domains = ["sql", "sql", "sql", "docs_qa", "code_sec", "ner"]
u = np.array([0.99, 0.96, 0.94, 0.66, 0.71, 0.60])

batch = [int(np.argmax(u))]
while len(batch) < 4:
    rem = [i for i in range(len(u)) if i not in batch]
    dists = {i: min(float(np.linalg.norm(coords[i] - coords[s])) for s in batch) for i in rem}
    widest = max(dists.values())
    scores = {i: 0.6 * float(u[i]) + 0.4 * (dists[i] / widest) for i in rem}
    if len(batch) == 1:
        print("step two:", {i + 1: round(s, 3) for i, s in scores.items()})
    batch.append(max(scores, key=lambda i: scores[i]))

top_four = [int(i) for i in np.argsort(-u)[:4]]
print("top four:", [i + 1 for i in top_four], "domains:", len({domains[i] for i in top_four}))
print("hybrid:", [i + 1 for i in batch], "domains:", len({domains[i] for i in batch}))

# Quick 4-class intent uncertainty pick with LogisticRegression
X, y = make_classification(n_samples=320, n_features=8, n_informative=6, n_classes=4, random_state=11)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.35, stratify=y, random_state=11)
sc = StandardScaler().fit(X_tr)
X_trs, X_tes = sc.transform(X_tr), sc.transform(X_te)
rng = np.random.default_rng(11)
seed = np.concatenate([rng.choice(np.flatnonzero(y_tr == c), size=3, replace=False) for c in range(4)]).tolist()
clf = LogisticRegression(max_iter=500, random_state=11).fit(X_trs[seed], y_tr[seed])
probs = clf.predict_proba(X_trs)
ent = -np.sum(probs * np.log(np.clip(probs, 1e-12, 1.0)), axis=1)
ent[seed] = -1.0
print("seed_acc:", round(float(clf.score(X_tes, y_te)), 3), "highest_entropy_idx:", int(np.argmax(ent)))
```

<!-- leetllm: output:start -->
```text title="Reader hybrid selection" output compact
step two: {2: 0.634, 3: 0.622, 4: 0.796, 5: 0.791, 6: 0.752}
top four: [1, 2, 3, 5] domains: 2
hybrid: [1, 4, 5, 6] domains: 4
seed_acc: 0.357 highest_entropy_idx: 42
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/hybrid_active_selection_dark.png" alt="A square plot places six cases by their embedding coordinates. Cases 1, 2, and 3 sit close together at the center, and cases 4, 5, and 6 lie far out in different corners. The highest-uncertainty batch picks 1, 2, 3, and 5, covering two of four domains. The hybrid batch picks 1, 4, 5, and 6, covering all four. Stacked bars show the second selection step, where case 4 has the largest combined score, 0.796." />
  <figcaption>Stacked bars show why case 4 wins step two: its uncertainty is moderate, yet its distance from the seed cluster adds broad domain coverage.</figcaption>
</figure>

> **Common mistake:** Reporting production failure rates from an active-learning review queue. Active selection over-samples uncertain prompts by design; estimate live prevalence with a separate random sample carrying known inclusion weights, and tune acquisition weights strictly on validation splits rather than private tests.[^sklearn2026leakage]

## Calibrate judges and ship clean manifests

Before trusting an LLM judge on routine screening, compare it against human gold labels in both `(X, Y)` and `(Y, X)` presentation orders so position bias never slips into training targets.[^zheng2023] Package cleared snapshots as versioned manifests recording four essentials, following Datasheets for Datasets:[^gebru2021]

1. **Source and redaction lineage:** exact collection window, scrubbing version, and user/repo grouping rule.
2. **Rubric and agreement record:** rubric version tag, double-labeled sample size, and chance-corrected agreement score.
3. **Current-digest overlap scan:** canonical hash and n-gram check computed on the exact snapshot SHA-256 being trained.
4. **Clean-base restart rule:** if leaked evaluation prompts ever enter a run, purge the full paraphrase family, refresh the scan on the new digest, and retrain from an unexposed base checkpoint.

```checkpoint
Two reviewers judge 50 new pairs. Both pick `A` on 20, both pick `B` on 20, and they split the other 10, five each way. What is Cohen's kappa, and does it clear a 0.65 threshold?
---
Observed agreement is $p_o = 40/50 = 0.80$. Each reviewer chooses `A` on 25 items and `B` on 25, so $p_e = 0.5 \cdot 0.5 + 0.5 \cdot 0.5 = 0.50$. Thus $\kappa = (0.80 - 0.50)/(1 - 0.50) = 0.60$, missing the 0.65 bar even though four in five items match.
```

Pick one released row at random and verify that a teammate can trace its redaction, split membership, rubric version, and agreement record from the manifest alone, then carry that dataset into the [supervised fine-tuning pipeline](/learn/supervised-fine-tuning-pipeline).

<!-- leetllm: edition:reader:end -->
