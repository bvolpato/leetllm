---
{
  "id": "hallucination-detection-mitigation",
  "title": "Hallucination Detection & Mitigation",
  "slug": "hallucination-detection-mitigation",
  "section": "Applied LLM Engineering",
  "category": "Alignment & Safety",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/hallucination_pipeline_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft"
  ],
  "shortDescription": "Separate factual claims from retrieved evidence using atomic claim verification, semantic consistency, calibrated NLI scoring, and conformal risk-coverage gates.",
  "order": 17,
  "keyConceptsTested": [
    "Context faithfulness versus external factual accuracy",
    "Atomic claim decomposition and partial pruning",
    "Token predictive entropy, perplexity, and semantic entropy",
    "SelfCheckGPT consistency and confident misconception failure modes",
    "Calibrated NLI verification, Brier score, and Expected Calibration Error",
    "Split-conformal selective abstention along risk-coverage curves",
    "Decoding, retrieval, and verify-then-edit mitigation layers"
  ]
}
---

When an engineering documentation assistant answers a question about PyTorch compiler behavior, it can quote a real documentation header and still deliver a subtle bug into user code. Consider a developer asking a <span data-glossary="rag">RAG</span> assistant whether `torch.compile` supports custom `torch.autograd.Function` backward passes with multiple tensor outputs, and whether `fullgraph=True` silently falls back to eager execution when an unsupported Python hook runs. Two retrieved `PyTorch 2.6` passages confirm that custom `autograd.Function` backward passes work inside `torch.compile`, while `fullgraph=True` raises an error on graph breaks instead of falling back to eager mode (`fullgraph=False` is the flag that falls back per graph break).

Now examine a fluent four-sentence reply generated from those passages: the assistant notes that custom backward passes compile cleanly (supported), promises that multi-tensor custom outputs fuse automatically into one CUDA graph (fabricated), claims `fullgraph=True` silently falls back to eager mode (contradicted), and remarks that `torch.compile` shipped in PyTorch 2.0 (accurate in general weights, yet missing from the retrieved context). Evaluating that reply at the whole-answer level or rewarding its clean syntax and valid document link hides both the fabricated optimization promise and the inverted compiler semantics. Research on why language models hallucinate shows that standard pretraining and post-training objectives reward confident guessing whenever uncertainty goes unpenalized [^kalai2025]. Production reliability demands checking every atomic statement individually before deciding whether to serve, prune, re-retrieve, or abstain.

<figure>
  <img src="illustrations/_generated/hallucination_pipeline_dark.png" alt="Verification pipeline splitting a generated draft into atomic claims, scoring each claim against retrieved documents with an NLI verifier, and routing to serve verified claims or retry and abstain." />
  <figcaption>Claim-level verification decomposes a generated draft into atomic statements, checks each unit against retrieved context chunks via a calibrated NLI verifier, and routes the result to serve verified clauses, re-retrieve, or abstain.</figcaption>
</figure>

## Context grounding vs. world accuracy

Every evaluation pipeline must separate two orthogonal questions that coarse benchmarks often collapse into one number [^huang2023]. Context grounding asks whether a generated claim follows logically from the documents retrieved in the prompt (`P(entailed | claim, docs)`). External accuracy asks whether the claim holds true in the real world at serving time regardless of what the retriever happened to return.

Treating those two axes independently produces a clear taxonomy for routing decisions:

| Failure regime | Context support | World truth | Example from `torch.compile` QA | Operational action |
| :--- | :--- | :--- | :--- | :--- |
| **Supported & true** | Present | True | Custom `autograd.Function` backward compiles | Keep and serve with citation |
| **Extrinsic fabrication** | Absent | False | Multi-tensor outputs auto-fuse into one CUDA graph | Prune clause or re-retrieve |
| **Intrinsic contradiction** | Contradicted | False | `fullgraph=True` silently falls back to eager mode | Block draft and abstain or rewrite |
| **Uncited true fact** | Absent | True | `torch.compile` shipped in PyTorch 2.0 | Retrieve supporting doc before citing |
| **Stale retrieved index** | Present in chunk | False now | Deprecated flag kept in an outdated index snapshot | Refresh index before trusting chunk |

Two practical consequences follow directly from this grid. First, surface lexical overlap metrics miss contradictions because negations (`does not fall back` versus `silently falls back`) share almost identical unigrams and bigrams. Second, uncited true statements (`C4`) remain risky in grounded enterprise assistants because citation checks fail silently whenever users click the attached snippet to verify an unmentioned version history or policy threshold.

<figure>
  <img src="illustrations/_generated/hallucination_taxonomy_map_dark.png" alt="Quadrant chart mapping context support against world accuracy. C1 (Supported) serves directly, C4 (Uncited) needs a retrieved citation, C2 (Fabricated) and C3 (Contradicted) are pruned or blocked, and Stale doc triggers index refresh." />
  <figcaption>Separating retrieved evidence support from external factual accuracy yields distinct routing rules: prune or re-retrieve unsupported clauses, block contradictions, and refresh stale indexes.</figcaption>
</figure>

Modern atomic verification frameworks such as FActScore [^min2023] and RAGAS Faithfulness [^ragas2026Faithfulness] address mixed-quality paragraphs by splitting long answers into minimal propositions before grading. Once a reply is decomposed into $m$ atomic claims $\{c_1, \dots, c_m\}$, we measure two key quantities across a serving policy:

$$
\text{Unsupported Risk} = \frac{\text{Served Unsupported Claims}}{\text{Total Served Claims}}, \qquad
\text{Safe Recall} = \frac{\text{Served Supported Claims}}{\text{Total Ground-Truth Supported Claims}}
$$

Notice why partial pruning outperforms naive all-or-nothing serving when a draft mixes true statements with a non-essential fabricated embellishment. Dropping an unsupported clause (`C2`) eliminates the unsupported risk while preserving supported answers (`C1`), whereas keeping the draft unedited exposes users to false guarantees. However, when a draft contains a direct contradiction (`C3`), partial pruning can leave broken causal transitions or misleading reassurance, making full rewrite or <span data-glossary="abstention">abstention</span> safer.

<!-- leetllm: test, deps=numpy, output=show, id=claim-decomposition-lab -->
```python title="claim-level-verification-routing.py"
import numpy as np

# Each response has atomic claims: (supported, contradicted, verifier_score)
RESPONSES = [
    {
        "query": "autograd.Function + fullgraph=True",
        "claims": [
            ("C1 custom backward compiles", 1, 0, 0.94),
            ("C2 multi-tensor auto CUDA graph", 0, 0, 0.24),
            ("C3 fullgraph=True silent fallback", 0, 1, 0.08),
            ("C4 torch.compile shipped in 2.0", 0, 0, 0.35),
        ],
    },
    {
        "query": "amp autocast dtype scope",
        "claims": [
            ("A1 autocast casts matmul to fp16/bf16", 1, 0, 0.96),
            ("A2 layer norm stays fp32 for stability", 1, 0, 0.91),
            ("A3 autocast disables gradient scaling", 0, 1, 0.11),
        ],
    },
    {
        "query": "DDP gradient bucketing",
        "claims": [
            ("B1 DDP overlaps allreduce with backward", 1, 0, 0.95),
            ("B2 bucket_cap_mb defaults to 25 MB", 1, 0, 0.89),
            ("B3 zero_grad(set_to_none=True) frees grads", 1, 0, 0.92),
        ],
    },
]


def evaluate_policy(policy: str, accept_cutoff: float = 0.70) -> dict[str, float]:
    served_claims = 0
    served_unsupported = 0
    served_supported = 0
    total_supported = sum(
        sup for row in RESPONSES for (_, sup, _, _) in row["claims"]
    )
    queries_answered = 0

    for row in RESPONSES:
        claims = row["claims"]
        has_contradiction = any(score < 0.20 for (_, _, _, score) in claims)

        if policy == "serve_all":
            kept = claims
        elif policy == "prune_and_block_contradiction":
            kept = [] if has_contradiction else [
                c for c in claims if c[3] >= accept_cutoff
            ]
        elif policy == "prune_unsupported":
            kept = [c for c in claims if c[3] >= accept_cutoff]
        else:
            raise ValueError(f"unknown policy: {policy}")

        if kept:
            queries_answered += 1
        for (_, sup, _, _) in kept:
            served_claims += 1
            served_supported += sup
            served_unsupported += (1 - sup)

    risk = served_unsupported / max(served_claims, 1)
    safe_recall = served_supported / max(total_supported, 1)
    coverage = queries_answered / len(RESPONSES)
    return {
        "risk": risk,
        "safe_recall": safe_recall,
        "coverage": coverage,
        "served_claims": served_claims,
    }


for name in ["serve_all", "prune_unsupported", "prune_and_block_contradiction"]:
    metrics = evaluate_policy(name)
    print(
        f"{name:30s} | risk={metrics['risk']:.3f} | "
        f"safe_recall={metrics['safe_recall']:.3f} | "
        f"coverage={metrics['coverage']:.3f} | kept={metrics['served_claims']}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
serve_all                      | risk=0.400 | safe_recall=1.000 | coverage=1.000 | kept=10
prune_unsupported              | risk=0.000 | safe_recall=1.000 | coverage=1.000 | kept=6
prune_and_block_contradiction  | risk=0.000 | safe_recall=0.500 | coverage=0.333 | kept=3
```
<!-- leetllm: output:end -->

## Uncertainty and multi-sample consistency

When retrieved documents are absent or noisy, practitioners often inspect the generator's own probabilities or sample distribution for internal signals of doubt. At decoding step $t$, given prefix $(x, y_{<t})$ and vocabulary $\mathcal{V}$, the token-level <span data-glossary="entropy">predictive entropy</span> measures how flat or peaked the next-token distribution is, while sequence <span data-glossary="perplexity">perplexity</span> aggregates surprise over the generated tokens:

$$
H(Y_t \mid y_{<t}, x) = -\sum_{v \in \mathcal{V}} p_t(v) \log p_t(v), \qquad
\operatorname{PPL}(y \mid x) = \exp\!\left(-\frac{1}{T}\sum_{t=1}^{T} \log p_t(y_t \mid y_{<t}, x)\right)
$$

Token entropy works well when a model hesitates over a single rare identifier or numeric hyperparameter such as a version string or port number. Yet raw token probabilities suffer from two systematic blind spots that break naive log-probability thresholds in practice.

First, surface lexical uncertainty rises whenever multiple synonymous phrasings compete for probability mass, even if every continuation conveys the exact same true meaning. Saying *"raises a graph break error"*, *"throws an exception on graph breaks"*, or *"aborts compilation when a break occurs"* spreads next-token mass across distinct words while carrying zero uncertainty about semantics. Second, minimum token probability depends heavily on arbitrary tokenization boundaries and punctuation styling.

**Semantic Entropy** [^farquhar2024] resolves lexical dilution by sampling $K$ candidate completions at temperature $T > 0$, clustering completions that entail each other mutually into semantic equivalence classes $c \in \mathcal{C}$, summing cluster probabilities $P(c \mid x) = \sum_{y \in c} p(y \mid x)$, and computing entropy over clusters rather than surface strings:

$$
H_{\text{sem}}(x) = -\sum_{c \in \mathcal{C}} P(c \mid x) \log P(c \mid x)
$$

Because computing full bidirectional entailment across $O(K^2)$ sample pairs adds serving latency, linear probes trained on hidden states before decoding can predict semantic entropy in a single forward pass [^kossen2024]. In black-box APIs where neither logits nor hidden states are exposed, **SelfCheckGPT** [^manakul2023] approximates consistency by comparing each sentence in a greedy primary reply against $K$ stochastic samples using NLI contradiction scores, QA equivalence, or n-gram overlap: genuine random fabrications vary across samples, whereas recalled facts repeat consistently.

Neither uncertainty nor consensus, however, can diagnose **confident misconceptions**. When pretraining corpora repeat an API myth or outdated syntax frequently, greedy decoding and stochastic samples converge on the same false answer with low token entropy, low semantic entropy, and 100% sample agreement. Self-consistency tells you whether a claim is *unstable across draws*, never whether it agrees with ground truth or retrieved documentation.

<!-- leetllm: test, deps=numpy,scipy, output=show, id=entropy-consistency-lab -->
```python title="token-vs-semantic-entropy.py"
import numpy as np
from scipy.special import softmax
from scipy.stats import entropy


def token_metrics(logits: np.ndarray, chosen_idx: np.ndarray) -> tuple[float, float, float]:
    """Return mean token entropy, min chosen prob, and sequence perplexity."""
    probs = softmax(logits, axis=1)
    step_entropies = np.array([entropy(p) for p in probs])
    chosen_probs = probs[np.arange(len(chosen_idx)), chosen_idx]
    perplexity = float(np.exp(-np.mean(np.log(np.clip(chosen_probs, 1e-12, 1.0)))))
    return float(np.mean(step_entropies)), float(np.min(chosen_probs)), perplexity


def semantic_cluster_entropy(sample_logprobs: np.ndarray, cluster_ids: list[int]) -> float:
    """Compute entropy after summing probability mass inside each meaning cluster."""
    weights = softmax(sample_logprobs)
    cluster_masses: dict[int, float] = {}
    for w, cid in zip(weights, cluster_ids):
        cluster_masses[cid] = cluster_masses.get(cid, 0.0) + float(w)
    dist = np.array(list(cluster_masses.values()))
    return float(entropy(dist))


# Case A: Grounded statement with sharp token focus
logits_grounded = np.array([[4.5, 0.3, -0.5, -1.0], [4.2, 0.4, -0.2, -0.8], [4.8, 0.1, -0.6, -1.2]])
tok_ent_a, min_p_a, ppl_a = token_metrics(logits_grounded, np.array([0, 0, 0]))
sem_ent_a = semantic_cluster_entropy(np.array([-0.2, -0.3, -0.25, -0.4, -0.35]), [0, 0, 0, 0, 0])

# Case B: Valid answer split across 3 synonymous phrasings (high token entropy, zero semantic entropy)
logits_paraphrase = np.array([[1.4, 1.3, 1.2, -1.5], [1.6, 1.5, 1.3, -1.2], [2.1, 1.8, 1.4, -1.0]])
tok_ent_b, min_p_b, ppl_b = token_metrics(logits_paraphrase, np.array([0, 1, 0]))
sem_ent_b = semantic_cluster_entropy(np.array([-1.1, -1.2, -1.3, -1.4, -1.5]), [0, 0, 0, 0, 0])

# Case C: Confident falsehood ("fullgraph=True falls back to eager"): low entropy everywhere
logits_myth = np.array([[4.4, 0.2, -0.4, -1.1], [4.6, 0.1, -0.5, -1.0], [4.3, 0.3, -0.3, -0.9]])
tok_ent_c, min_p_c, ppl_c = token_metrics(logits_myth, np.array([0, 0, 0]))
sem_ent_c = semantic_cluster_entropy(np.array([-0.1, -0.15, -0.2, -0.12, -0.18]), [0, 0, 0, 0, 0])

# Case D: Spontaneous fabrication drifting across 4 contradictory meanings across 5 samples
logits_fabric = np.array([[1.1, 1.0, 0.9, 0.8], [0.9, 0.8, 0.7, 0.6], [1.2, 1.0, 0.8, 0.5]])
tok_ent_d, min_p_d, ppl_d = token_metrics(logits_fabric, np.array([0, 1, 2]))
sem_ent_d = semantic_cluster_entropy(np.array([-1.2, -1.3, -1.5, -1.6, -1.8]), [0, 1, 2, 3, 1])

rows = [
    ("Grounded crisp", tok_ent_a, min_p_a, ppl_a, sem_ent_a),
    ("Paraphrase valid", tok_ent_b, min_p_b, ppl_b, sem_ent_b),
    ("Confident myth", tok_ent_c, min_p_c, ppl_c, sem_ent_c),
    ("Drifting fabric.", tok_ent_d, min_p_d, ppl_d, sem_ent_d),
]
for label, h_tok, p_min, ppl, h_sem in rows:
    print(f"{label:17s} | H_tok={h_tok:.3f} | min_p={p_min:.3f} | PPL={ppl:.2f} | H_sem={h_sem:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Grounded crisp    | H_tok=0.148 | min_p=0.960 | PPL=1.03 | H_sem=0.000
Paraphrase valid  | H_tok=1.160 | min_p=0.334 | PPL=2.67 | H_sem=0.000
Confident myth    | H_tok=0.149 | min_p=0.967 | PPL=1.03 | H_sem=0.000
Drifting fabric.  | H_tok=1.372 | min_p=0.225 | PPL=3.89 | H_sem=1.338
```
<!-- leetllm: output:end -->

Look closely at the contrast between **Paraphrase valid** and **Confident myth** in the output above. Semantic entropy neatly drops to `0.000` on valid paraphrases where token perplexity rose to `2.67`, preventing unnecessary abstentions when wording varies safely. Yet **Confident myth** mimics **Grounded crisp** across every internal uncertainty signal, demonstrating why external NLI verification against retrieved chunks remains indispensable whenever world or API facts are at stake.

## Calibrated NLI verification and conformal risk-coverage gates

Raw verifier scores, including cosine similarity from dense embeddings, cross-encoder NLI entailment logits, and judge rubrics, seldom behave as true probabilities out of the box [^guo2017]. Neural networks often exhibit overconfidence in the tails, meaning a raw score of `0.85` might reflect only `62%` empirical claim support on production queries. Feeding uncalibrated scores directly into product cutoffs causes threshold drift whenever prompt lengths or retrieval scores shift.

Platt or logistic calibration maps raw verification features $z \in \mathbb{R}^d$ to well-calibrated probabilities $\hat{p} = \sigma(w^\top z + b)$ on a held-out calibration split [^sklearnCalibration2026]. We measure calibration quality using two complementary metrics: the <span data-glossary="brier-score">Brier score</span>, which captures proper squared-error sharpness and reliability jointly, and <span data-glossary="expected-calibration-error">Expected Calibration Error (ECE)</span> across quantile probability bins $B_1, \dots, B_M$:

$$
\text{Brier} = \frac{1}{n}\sum_{i=1}^{n} (\hat{p}_i - y_i)^2, \qquad
\text{ECE} = \sum_{m=1}^{M} \frac{|B_m|}{n} \left| \operatorname{acc}(B_m) - \operatorname{conf}(B_m) \right|
$$

Once $\hat{p}_i$ is calibrated, choosing an operational acceptance cutoff $\tau \in [0, 1]$ defines a **Risk-Coverage Curve**. Accepting a claim only when $\hat{p}_i \ge \tau$ yields empirical coverage $C(\tau) = \frac{1}{n}\sum_i \mathbb{I}[\hat{p}_i \ge \tau]$ and selective unsupported risk among served claims:

$$
\hat{R}(\tau) = \frac{\sum_{i=1}^{n} \mathbb{I}[\hat{p}_i \ge \tau \land y_i = 0]}{\max\bigl(1, \sum_{i=1}^{n} \mathbb{I}[\hat{p}_i \ge \tau]\bigr)}
$$

To convert an empirical curve into a finite-sample reliability target before deployment, <span data-glossary="conformal-prediction">split-conformal risk control</span> [^angelopoulos2021conformal] [^angelopoulos2022ConformalRiskControl] solves for the smallest threshold $\hat{\tau}$ on an independent calibration split of $n_{\text{cal}}$ claims such that even under worst-case finite-sample fluctuations, expected test error remains controlled near target risk $\alpha$ (for instance $\alpha = 0.05$). Under an upper finite-sample adjustment $R_{\text{upper}}(\tau) = \frac{n_{\text{cal}} \hat{R}_{\text{cal}}(\tau) + 1}{n_{\text{cal}} + 1} \le \alpha$, the selected threshold $\hat{\tau}$ accounts explicitly for calibration set size rather than overfitting to noisy single-point empirical rates, echoing recent theoretical work on abstention guarantees [^chen2025limitingconfidence].

<figure>
  <img src="illustrations/_generated/detection_signal_router_dark.png" alt="Line chart of unsupported claim risk versus answer coverage across abstention thresholds. A calibrated NLI verifier holds risk at five percent at seventy percent coverage, outperforming token probability and consistency alone." />
  <figcaption>Comparing risk-coverage curves across verification signals: combining NLI entailment, consistency, and token probability in a calibrated verifier cuts unsupported-claim risk steeply at fixed answer coverage.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy,scipy,scikit-learn, output=show, id=nli-calibration-conformal-lab -->
```python title="calibrated-nli-conformal-gate.py"
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score


def simulate_verification_pairs(n: int, seed: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Generate correlated claim-evidence verification signals and binary ground-truth support."""
    rng = np.random.default_rng(seed)
    nli_logit = rng.normal(loc=0.5, scale=1.9, size=n)
    lexical_overlap = np.clip(0.35 + 0.14 * nli_logit + rng.normal(0.0, 0.16, n), 0.0, 1.0)
    selfcheck_agree = np.clip(0.55 + 0.12 * nli_logit + rng.normal(0.0, 0.18, n), 0.0, 1.0)
    min_tok_prob = np.clip(0.45 + 0.08 * nli_logit + rng.normal(0.0, 0.15, n), 0.02, 0.99)

    true_logit = -0.3 + 1.45 * nli_logit + 1.1 * (lexical_overlap - 0.4) + 1.0 * (selfcheck_agree - 0.5)
    p_supported = 1.0 / (1.0 + np.exp(-true_logit))
    y = rng.binomial(1, p_supported)
    features = np.column_stack([nli_logit, lexical_overlap, selfcheck_agree, min_tok_prob])
    raw_heuristic = 1.0 / (1.0 + np.exp(-(3.2 * nli_logit + 0.7)))  # Overconfident uncalibrated baseline
    return features, y, raw_heuristic


def expected_calibration_error(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 8) -> float:
    edges = np.quantile(y_prob, np.linspace(0.0, 1.0, n_bins + 1))
    ece = 0.0
    for i in range(n_bins):
        lo, hi = edges[i], edges[i + 1]
        mask = (y_prob >= lo) & (y_prob <= hi if i == n_bins - 1 else y_prob < hi)
        if np.any(mask):
            ece += np.mean(mask) * abs(float(np.mean(y_true[mask])) - float(np.mean(y_prob[mask])))
    return float(ece)


X_train, y_train, _ = simulate_verification_pairs(400, seed=42)
X_cal, y_cal, raw_cal = simulate_verification_pairs(400, seed=43)
X_test, y_test, raw_test = simulate_verification_pairs(400, seed=44)

calibrator = LogisticRegression(C=1.0)
calibrator.fit(X_train, y_train)
p_cal = calibrator.predict_proba(X_cal)[:, 1]
p_test = calibrator.predict_proba(X_test)[:, 1]

print(
    f"Raw NLI heuristic  | Brier={brier_score_loss(y_test, raw_test):.4f} | "
    f"ECE={expected_calibration_error(y_test, raw_test):.4f} | "
    f"AUC={roc_auc_score(y_test, raw_test):.4f}"
)
print(
    f"Calibrated verifier| Brier={brier_score_loss(y_test, p_test):.4f} | "
    f"ECE={expected_calibration_error(y_test, p_test):.4f} | "
    f"AUC={roc_auc_score(y_test, p_test):.4f} | "
    f"AP={average_precision_score(y_test, p_test):.4f}"
)

# Split-conformal risk control: scan downward from strictest cutoff until upper bound exceeds alpha
alpha = 0.05
thresholds = np.linspace(0.96, 0.50, 47)
selected_tau = 0.96
for tau in thresholds:
    accepted = p_cal >= tau
    n_acc = int(np.sum(accepted))
    if n_acc < 20:
        continue
    errors = int(np.sum((y_cal == 0) & accepted))
    upper_risk = (errors + 1.0) / (n_acc + 1.0)
    if upper_risk <= alpha:
        selected_tau = float(tau)
    else:
        break

print(f"\nSelected split-conformal cutoff (alpha={alpha:.2f}): tau={selected_tau:.2f}")
for label, cutoff in [("Permissive 0.60", 0.60), ("Conformal gate", selected_tau), ("Strict 0.96", 0.96)]:
    acc = p_test >= cutoff
    cov = float(np.mean(acc))
    risk = float(np.mean(y_test[acc] == 0)) if np.any(acc) else 0.0
    print(f"{label:16s} | cutoff={cutoff:.2f} | test_coverage={cov:.3f} | test_risk={risk:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Raw NLI heuristic  | Brier=0.1220 | ECE=0.1155 | AUC=0.9400
Calibrated verifier| Brier=0.0965 | ECE=0.0359 | AUC=0.9402 | AP=0.9497

Selected split-conformal cutoff (alpha=0.05): tau=0.93
Permissive 0.60  | cutoff=0.60 | test_coverage=0.540 | test_risk=0.139
Conformal gate   | cutoff=0.93 | test_coverage=0.297 | test_risk=0.017
Strict 0.96      | cutoff=0.96 | test_coverage=0.230 | test_risk=0.011
```
<!-- leetllm: output:end -->

Look at both halves of the diagnostic output. Replacing an overconfident NLI logit heuristic with multi-feature logistic calibration lowers both Brier score and Expected Calibration Error substantially on unseen queries while lifting ranking discrimination (`AUC` and <span data-glossary="average-precision">Average Precision</span>). Then, selecting $\hat{\tau}$ conservatively on `X_cal` keeps unseen test error right inside the target budget without ad hoc manual threshold guessing.

## Mitigation layers across generation and serving

No single intervention removes every hallucination failure mode cleanly, because hallucinations originate across retrieval gaps, decoding variance, and post-generation presentation. Effective production pipelines compose complementary defenses along the execution timeline:

1. **Decoding-time faithfulness amplification**: Methods such as **DoLa (Decoding by Contrasting Layers)** [^chuang2024DoLa] and **Contrastive Decoding** [^li2024contrastive] subtract surface-layer priors from deeper factual layers or subtract unconditioned prior logits from context-conditioned logits:
   $$
   \log p_{\text{CAD}}(y_t \mid x, D) \propto (1 + \alpha)\log p(y_t \mid x, D) - \alpha \log p(y_t \mid x)
   $$
   Weighting context-dependent probability shifts suppresses fluent clichés memorized from pretraining whenever retrieved context points in a different direction.
2. **Verify-then-edit and independent verification**: **Chain-of-Verification (CoVe)** [^dhuliawala2023] drafts an initial answer, formulates targeted verification questions for each claim, answers those verification questions independently without leaking the draft's phrasing, and revises only contradicted spans. Isolating verification prevents self-anchoring bias.
3. **Corrective retrieval and reflection tokens**: When verifier scores indicate missing context rather than fabrication (`C4`), <span data-glossary="corrective-rag">Corrective RAG</span> triggers a second query rewrite and broader search instead of guessing or immediately refusing, while **Self-RAG** [^selfRagInference2026] trains inline critique tokens to signal retrieval need and claim support mid-generation.
4. **Claim pruning vs. calibrated abstention**: When core claims hold (`C1`) and a non-essential modifier lacks support (`C2`), pruning the unsupported clause preserves high utility without compromising accuracy. When a contradiction hits core logic (`C3`) or calibrated uncertainty exceeds risk tolerance $\alpha$, the <span data-glossary="eval-gate">serving gate</span> triggers fresh retrieval or abstains cleanly.

<figure>
  <img src="illustrations/_generated/benchmark_coverage_stack_dark.png" alt="Bar chart showing unsupported claim rates dropping across layered mitigation stages from 28 percent on unverified RAG drafts down to 4 percent with corrective retrieval and a conformal verification gate." />
  <figcaption>Unsupported-claim rates fall cumulatively when prompt grounding, multi-sample consistency filtering, atomic claim pruning, and corrective retrieval plus a calibrated gate work in sequence.</figcaption>
</figure>

Note an important evaluation caveat highlighted by benchmarks such as TruthfulQA [^lin2021]: evaluating hallucination defenses requires measuring both **error suppression** and **excessive refusal**. A gate that blocks 90% of answers trivially pushes unsupported error toward zero while rendering the assistant unusable. Always track selective risk jointly with supported recall and net serving utility (`+1` per served supported claim minus penalty $\lambda$ per served unsupported claim).

<!-- leetllm: test, deps=numpy,scikit-learn, output=show, id=mitigation-pipeline-lab -->
```python title="layered-mitigation-benchmark.py"
import numpy as np


def simulate_pipeline_stages(n_queries: int = 200, seed: int = 42) -> None:
    """Compare unsupported-claim risk, supported recall, and net utility across defense stacks."""
    rng = np.random.default_rng(seed)
    claims_per_query = 4
    total_claims = n_queries * claims_per_query

    # True support: ~72% supported in retrieved docs, ~28% unsupported/fabricated in base drafts
    base_supported = rng.binomial(1, 0.72, size=(n_queries, claims_per_query))
    entail_signal = np.where(
        base_supported == 1,
        rng.normal(0.78, 0.16, size=(n_queries, claims_per_query)),
        rng.normal(0.32, 0.20, size=(n_queries, claims_per_query)),
    )
    consistency = np.where(
        base_supported == 1,
        rng.normal(0.84, 0.12, size=(n_queries, claims_per_query)),
        rng.normal(0.42, 0.24, size=(n_queries, claims_per_query)),
    )

    # Layer 1: Base unverified draft serves all claims
    # Layer 2: Grounded prompt recovers half of fixable omissions cleanly (-7pp risk)
    prompt_supported = np.where(
        (base_supported == 0) & (rng.random((n_queries, claims_per_query)) < 0.25),
        1,
        base_supported,
    )
    prompt_signal = entail_signal + 0.08 * (prompt_supported - base_supported)

    # Layer 3: SelfCheck consistency filter blocks queries with low sample agreement
    sc_keep_query = np.min(consistency, axis=1) >= 0.45

    # Layer 4: Atomic claim pruning removes individual claims with weak entailment
    pruned_keep = (prompt_supported == 1) & (prompt_signal >= 0.56) | (
        (prompt_supported == 0) & (prompt_signal >= 0.56)
    )

    # Layer 5: Corrective re-retrieval lifts uncertain queries before calibrated gate
    reretrieved_supported = np.where(
        (prompt_supported == 0) & (prompt_signal >= 0.36) & (rng.random((n_queries, claims_per_query)) < 0.60),
        1,
        prompt_supported,
    )
    reretrieved_signal = np.where(
        reretrieved_supported > prompt_supported,
        rng.normal(0.76, 0.12, size=(n_queries, claims_per_query)),
        prompt_signal,
    )
    gate_keep = reretrieved_signal >= 0.64

    configs = [
        ("Base draft", base_supported, np.ones_like(base_supported, dtype=bool)),
        ("Grounded prompt", prompt_supported, np.ones_like(base_supported, dtype=bool)),
        ("SelfCheck filter", prompt_supported, np.repeat(sc_keep_query[:, None], claims_per_query, axis=1)),
        ("Claim pruning", prompt_supported, pruned_keep),
        ("Retry + conformal", reretrieved_supported, gate_keep),
    ]

    false_claim_penalty = 5.0
    for name, truth, served_mask in configs:
        n_served = int(np.sum(served_mask))
        sup_served = int(np.sum((truth == 1) & served_mask))
        unsup_served = int(np.sum((truth == 0) & served_mask))
        risk = unsup_served / max(n_served, 1)
        recall = sup_served / max(int(np.sum(truth == 1)), 1)
        utility = (sup_served - false_claim_penalty * unsup_served) / total_claims
        print(
            f"{name:18s} | unsup_risk={risk:.3f} | recall={recall:.3f} | "
            f"net_utility={utility:+.3f} | served={n_served}/{total_claims}"
        )


simulate_pipeline_stages()
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Base draft         | unsup_risk=0.279 | recall=1.000 | net_utility=-0.672 | served=800/800
Grounded prompt    | unsup_risk=0.207 | recall=1.000 | net_utility=-0.245 | served=800/800
SelfCheck filter   | unsup_risk=0.120 | recall=0.533 | net_utility=+0.135 | served=384/800
Claim pruning      | unsup_risk=0.017 | recall=0.833 | net_utility=+0.604 | served=537/800
Retry + conformal  | unsup_risk=0.000 | recall=0.742 | net_utility=+0.627 | served=502/800
```
<!-- leetllm: output:end -->

Notice the utility swing in that progression. Simply tightening a query-level SelfCheck filter trims risk only partially while sacrificing full-query recall whenever one weak sentence contaminates three solid ones. Decomposing at claim granularity and pairing corrective retrieval with a calibrated verification threshold pushes net serving utility up sharply while driving unsupported-claim leak rates down toward single digits.

## Common pitfalls and production telemetry

Even well-calibrated verifiers degrade in production when surrounding infrastructure introduces silent mismatches:

- **Judging the answer instead of its claims**: Whole-answer pass/fail rubrics hide bad secondary clauses inside accurate summaries and prevent safe partial pruning.
- **Treating agreement as factual verification**: Self-consistency catches unstable hallucinations across draws, yet misses shared parametric misconceptions and stale training cutoffs completely.
- **Unadjusted verifier thresholds under distribution shift**: A cutoff tuned on short clean documentation queries breaks when long noisy customer logs enter retrieval; track Brier score and verifier score histograms continuously against labeled audit slices.
- **Verifying against mutable live indexes without version IDs**: If an index updates between generation and inspection, later debugging cannot reconstruct why a claim passed or failed. Log document IDs, chunk hashes, verifier probability, pruned claim count, and routing outcome alongside standard OpenTelemetry GenAI semantic spans [^otelgenai2026].

## Check your understanding

```mastery-quiz
[
  {
    "id": "hd-m1-claim-vs-world",
    "question": "A RAG assistant accurately states from pretraining weights that torch.compile launched in PyTorch 2.0, while none of the retrieved context chunks mention PyTorch 2.0. Under a grounded documentation verification gate, how should this claim be classified and handled?",
    "options": [
      "Grounded and supported; emit with a passage link because the claim is true.",
      "Unsupported in context; fetch backing evidence or drop the uncited clause.",
      "Contradicted by passage; suppress the whole response and alert an analyst.",
      "Verified by weights; attach a citation if multi-sample agreement exceeds 80%."
    ],
    "answer": "Unsupported in context; fetch backing evidence or drop the uncited clause.",
    "explanation": "External world truth and retrieved context grounding are orthogonal axes. Attaching a citation to a claim not present in the cited passages misleads readers who inspect the source, so grounded assistants either retrieve a supporting chunk or omit the unsupported clause."
  },
  {
    "id": "hd-m2-semantic-entropy",
    "question": "Why can raw token predictive entropy falsely flag a completely accurate RAG answer as uncertain, and how does semantic entropy fix this?",
    "options": [
      "Token entropy grows with character length, whereas semantic entropy normalizes length.",
      "Token entropy penalizes synonymous phrasing; semantic entropy clusters matching meaning.",
      "Token entropy omits rare formatting tags, whereas semantic entropy double-weights syntax.",
      "Token entropy reads decoding logits, whereas semantic entropy counts KV-cache evictions."
    ],
    "answer": "Token entropy penalizes synonymous phrasing; semantic entropy clusters matching meaning.",
    "explanation": "Multiple valid wordings split next-token probability mass and inflate token entropy even when epistemic uncertainty is zero. Grouping equivalent meanings into clusters via bidirectional entailment captures uncertainty over meaning rather than lexical choice."
  },
  {
    "id": "hd-m3-consensus-blindspot",
    "question": "A model generates five independent samples at temperature 0.7 claiming that fullgraph=True silently falls back to eager mode, giving zero semantic entropy and 100% SelfCheck agreement. Retrieved documentation states fullgraph=True raises an error. What does this failure demonstrate?",
    "options": [
      "Sampling agreement flags high variance across draws, missing shared misconceptions.",
      "Greedy temperature-zero decoding fixes shared misconceptions across repeated passes.",
      "Drawing fifty independent samples shifts confident model priors toward recent APIs.",
      "Sequence perplexity near 1.0 signals alignment with the latest retrieved documentation."
    ],
    "answer": "Sampling agreement flags high variance across draws, missing shared misconceptions.",
    "explanation": "When training data contains a common misconception or outdated API behavior, stochastic sampling converges confidently onto the same wrong claim. Only external grounding against current evidence catches confident errors."
  },
  {
    "id": "hd-m4-brier-ece",
    "question": "An uncalibrated NLI verifier assigns probability 0.90 to a batch of 100 claims, but only 65 of those claims turn out to be supported. What does this gap signal?",
    "options": [
      "The verifier carries weak ranking discrimination across clean and broken claim pairs.",
      "The verifier is overconfident, inflating ECE and Brier error under raw score cutoffs.",
      "Expected Calibration Error settles near zero because mean scores exceed neutral 0.50.",
      "Monotonic Platt calibration shuffles relative score rankings across test examples."
    ],
    "answer": "The verifier is overconfident, inflating ECE and Brier error under raw score cutoffs.",
    "explanation": "A 25 percentage-point gap between mean predicted confidence (0.90) and empirical accuracy (0.65) contributes directly to Expected Calibration Error and Brier score. Monotonic Platt or logistic calibration aligns raw scores with empirical frequencies before thresholding."
  },
  {
    "id": "hd-m5-conformal-threshold",
    "question": "In split-conformal risk control over n_cal = 99 calibration claims, you evaluate candidate threshold tau and observe 2 unsupported claims among 59 accepted claims. Using the finite-sample upper bound (errors + 1) / (n_accepted + 1), does tau satisfy a strict target risk alpha = 0.04?",
    "options": [
      "Yes, because raw error ratio 2 / 59 is around 0.034, below alpha = 0.04.",
      "No, because (2 + 1) / (59 + 1) = 3 / 60 = 0.050, which exceeds alpha = 0.04.",
      "Yes, because calibration sample size n_cal cancels cleanly in the numerator.",
      "Cannot determine without fitting a second neural network on the test set."
    ],
    "answer": "No, because (2 + 1) / (59 + 1) = 3 / 60 = 0.050, which exceeds alpha = 0.04.",
    "explanation": "Split-conformal risk control adds a +1 smoothing count in both numerator and denominator to guard against finite-sample variance on the calibration set. Here (2+1)/(59+1) = 0.050 > 0.040, so the gate must select a stricter threshold."
  },
  {
    "id": "hd-m6-prune-vs-abstain",
    "question": "A draft response makes two accurate statements backed by retrieved PyTorch docs and adds a third unsupported remark about automatic CUDA graph fusion. Another draft directly inverts fullgraph=True semantics against the retrieved text. Which serving policy is preferable?",
    "options": [
      "Serve both drafts unchanged because most tokens align with retrieved passages.",
      "Abstain across both replies to reduce unsupported generation risk on every turn.",
      "Prune the extra clause in draft one while blocking or rewriting draft two.",
      "Retry draft one at higher temperature while serving draft two with disclaimers."
    ],
    "answer": "Prune the extra clause in draft one while blocking or rewriting draft two.",
    "explanation": "Atomic pruning removes non-essential unsupported clauses cleanly while keeping high useful coverage. Contradictions indicate broken logic or inverted semantics, so rewriting or abstaining avoids serving misleading partial text."
  },
  {
    "id": "hd-m7-cove-cad",
    "question": "In Context-Aware Decoding (CAD) with prior weight alpha = 1.0, context probabilities for three candidate tokens are [0.60, 0.30, 0.10] and no-context prior probabilities are [0.20, 0.60, 0.20]. Following p_cad proportional to p_ctx^(1+alpha) / p_prior^alpha, what is the normalized CAD distribution?",
    "options": [
      "[0.900, 0.075, 0.025]",
      "[0.600, 0.300, 0.100]",
      "[0.400, 0.400, 0.200]",
      "[0.750, 0.200, 0.050]"
    ],
    "answer": "[0.900, 0.075, 0.025]",
    "explanation": "With alpha = 1, unnormalized weights equal p_ctx^2 / p_prior: [0.36/0.20, 0.09/0.60, 0.01/0.20] = [1.80, 0.15, 0.05]. Summing to 2.00 gives normalized probabilities [0.900, 0.075, 0.025], sharply amplifying context-supported tokens."
  }
]
```

> **Next:** Continue to [LLM Observability & Monitoring](/learn/observability-monitoring-llm-systems). Record claim-level verifier probabilities, pruned clause counts, document chunk identifiers, and abstention decisions inside your GenAI telemetry spans so silent retrieval or calibration drift surfaces quickly in production dashboards.
