---
{
  "id": "experiment-tracking-mlflow-wandb",
  "title": "Experiment Tracking with MLflow and W&B",
  "slug": "experiment-tracking-mlflow-wandb",
  "section": "Applied LLM Engineering",
  "category": "MLOps & Deployment",
  "difficulty": "Medium",
  "order": 19,
  "companies": [
    "Databricks",
    "Weights & Biases",
    "OpenAI",
    "Meta",
    "Amazon"
  ],
  "shortDescription": "Compare candidate models, prompt versions, and operating thresholds without fooling yourself across changing datasets or drifting evaluators.",
  "keyConceptsTested": [
    "Run records linking dataset fingerprints, weights, and evaluation metrics",
    "Optimization convergence versus post-hoc threshold tuning on the Pareto frontier",
    "Comparability checks across dataset splits and scorer versions",
    "MLflow Tracking SQLite backend store and Prompt Registry aliases",
    "W&B offline experiments, artifact lineage, and Weave evaluations",
    "Preserving rejected candidates and promotion decisions for compiled programs"
  ],
  "coverImage": "social_banner.png",
  "prerequisites": [
    "observability-monitoring-llm-systems"
  ]
}
---

An engineering team investigates an unsupported generation raised in [LLM Observability & Monitoring](/learn/observability-monitoring-llm-systems), edits a citation-routing prompt or retrains a classifier gate, and sees validation F1 jump from `0.87` to `0.93`. That higher number proves nothing until another engineer can verify whether the win came from genuinely better predictions, a cleaner evaluation split, a looser abstention threshold, or a modified judge prompt. Experiment tracking turns transient ad-hoc runs into inspectable engineering records that separate real improvements from accidental measurement drift.

Unlike classical supervised learning, LLM systems vary weights, prompts, retrieval indexes, post-hoc decision thresholds, and automated scorers all at once. Comparing candidates honestly means pinning both the <span data-glossary="model-checkpoint">checkpoint</span> and the evaluation harness on every run. To make that concrete, we will train a regularized logistic abstention router across sweep settings, record immutable artifacts and prompt aliases in <span data-glossary="mlflow">MLflow</span>, run parallel offline tracking in <span data-glossary="weights-and-biases">Weights & Biases</span> (W&B) and Weave, and enforce automated lineage checks before any run reaches the leaderboard.

## Why single summary scores mislead

Suppose an LLM support assistant relies on a binary gate sitting in front of generation: given retrieval similarity, citation span overlap, lexical contradiction score, and query ambiguity, predict whether to `ANSWER` ($y=1$) or `ABSTAIN` ($y=0$). Training adjusts the classifier weights to minimize cross-entropy loss across steps. Serving, however, converts each calibrated probability $\hat{p}(y=1 \mid x)$ into a hard route using an operating threshold $\tau$:

$$
\hat{y}(x) = \mathbb{I}\!\left[\hat{p}(y=1 \mid x) \ge \tau\right]
$$

Changing the regularization strength $\alpha$ changes the learned weights and validation log-loss, whereas shifting $\tau$ moves an identical set of trained weights along a trade-off between two distinct failure modes. Raising $\tau$ suppresses unsafe answers made on weak evidence (`unsafe_route_rate`), while simultaneously pushing more valid questions into unnecessary abstentions (`false_abstain_rate`). Collapsing those dynamics into one headline accuracy number hides whether a gain came from better representation learning or merely sliding along the threshold curve.

| Failure in ad-hoc tracking | What drifted between runs | Why ranking breaks | Required identifier |
|---|---|---|---|
| Evaluation split changed quietly | Easy queries added or hard edge cases dropped | Higher score reflects test composition, not quality | `dataset_sha` (`SHA-256` digest) |
| Post-hoc threshold shifted silently | Same weights served with lower or higher $\tau$ | Safety vs. coverage trade-off hidden behind scalar F1 | `threshold_tau` + `checkpoint_sha` |
| Scorer or LLM judge edited | Judge system prompt or rubric changed mid-week | Score shift mixes candidate change with rubric change | `evaluator_version` + prompt version |
| Prompt alias updated in place | Mutable tag such as `@production` mutated without logging version | Re-running yesterday's run ID gives today's text | Immutable prompt version integer |

## What belongs inside every experiment record

A durable run record answers four concrete questions without guesswork: what exact configuration produced the candidate, which fixed cases were scored, which primary and <span data-glossary="guardrail">guardrail</span> metrics moved together, and which immutable files support further inspection. Logging each element with distinct semantics ensures a query engine can group strictly comparable experiments together while keeping rejected attempts searchable.

1. **Hyperparameters and configuration (`params`)**: Immutable run inputs set at launch, including regularization strength $\alpha$, decision threshold $\tau$, seed, code revision, and serving prompt version. Because parameters identify what a run actually tested, overwrite errors protect you from masking mixed edits inside one run.
2. **Step curves and summary metrics (`metrics`)**: Numerical measurements indexed cleanly across steps (such as validation log-loss per pass) alongside final aggregates separating task utility (`f1_answer`) from error risk (`unsafe_route_rate` and `false_abstain_rate`).
3. **Lineage fingerprints (`dataset_sha`, `checkpoint_sha`, `evaluator_version`)**: Cryptographic digests computed directly from serialized split bytes and trained model parameters via a <span data-glossary="checksum">checksum</span>[^mlflow2026tracking]. Two runs share a direct leaderboard only when `dataset_sha` and `evaluator_version` match byte for byte.
4. **Versioned artifacts (`curves`, checkpoints, row predictions)**: Serialized weights, loss curves, and row-level error slices uploaded to tracked storage so reviewers can audit disagreements rather than trusting summary tables alone[^mlflow2026backendstore].

<details>
<summary>Walk-through: Separating optimization convergence from threshold tuning in MLflow</summary>

Before executing the sweep below, trace the experimental design across four candidates trained on 200 scaled examples and evaluated on 120 holdout samples:
- **`underfit_alpha0.5`** uses heavy regularization ($\alpha = 0.5$) with $\tau = 0.45$, testing an underfitted model whose validation loss stalls early.
- **`loose_tau0.30`** trains with $\alpha = 0.001$ and applies a permissive threshold ($\tau = 0.30$), minimizing false abstentions at the expense of unsafe routes.
- **`strict_tau0.82`** reuses the exact same $\alpha = 0.001$ weights (`checkpoint_sha = 76f7f16a274a`) with $\tau = 0.82$, pushing unsafe routes near zero while rejecting more valid queries.
- **`balanced_tau0.50`** regularizes lightly ($\alpha = 0.005$) and sets $\tau = 0.50$, testing whether a calibrated frontier point clears tight safety limits without excessive abstention.

</details>

<!-- leetllm: test, deps=mlflow-skinny,sqlalchemy,alembic,numpy,pandas,scikit-learn, output=show, id=mlflow-sweep -->
```python title="mlflow-training-sweep.py"
import hashlib
import json
import logging
import os
import tempfile

# Suppress startup agent hints and SQLite schema migration INFO noise cleanly.
os.environ["MLFLOW_DISABLE_AGENT_HINT"] = "1"
logging.disable(logging.INFO)

import mlflow
import numpy as np
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import f1_score, log_loss
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(42)
n_samples = 320
# Features: [retrieval_sim, citation_overlap, contradiction_score, ambiguity, query_len_norm]
X = np.column_stack(
    [
        rng.uniform(0.15, 0.98, n_samples),
        rng.uniform(0.05, 0.95, n_samples),
        rng.uniform(0.0, 0.9, n_samples),
        rng.uniform(0.0, 0.95, n_samples),
        rng.uniform(0.1, 1.0, n_samples),
    ]
)
latent_margin = (
    2.8 * X[:, 0] + 2.2 * X[:, 1] - 3.1 * X[:, 2] - 1.5 * X[:, 3] - 0.8 + rng.normal(0, 0.35, n_samples)
)
y = (latent_margin > 0).astype(int)

X_train, X_val = X[:200], X[200:]
y_train, y_val = y[:200], y[200:]
dataset_sha = hashlib.sha256(X_val.tobytes() + y_val.tobytes()).hexdigest()[:12]

scaler = StandardScaler().fit(X_train)
X_train_s, X_val_s = scaler.transform(X_train), scaler.transform(X_val)

tmp_dir = tempfile.TemporaryDirectory()
mlflow.set_tracking_uri(f"sqlite:///{tmp_dir.name}/mlflow.db")
mlflow.set_experiment("rag-abstention-router")

candidates = [
    ("underfit_alpha0.5", 0.5, 0.45),
    ("loose_tau0.30", 1e-3, 0.30),
    ("balanced_tau0.50", 5e-3, 0.50),
    ("strict_tau0.82", 1e-3, 0.82),
]

for run_name, alpha, tau in candidates:
    with mlflow.start_run(run_name=run_name):
        clf = SGDClassifier(
            loss="log_loss",
            alpha=alpha,
            learning_rate="constant",
            eta0=0.08,
            random_state=7,
        )
        step_losses = {}
        for step in range(1, 26):
            clf.partial_fit(X_train_s, y_train, classes=np.array([0, 1]))
            val_probs = clf.predict_proba(X_val_s)[:, 1]
            vloss = float(log_loss(y_val, val_probs))
            mlflow.log_metric("val_log_loss", vloss, step=step)
            if step in (1, 5, 10, 15, 20, 25):
                step_losses[step] = round(vloss, 3)

        probs = clf.predict_proba(X_val_s)[:, 1]
        preds = (probs >= tau).astype(int)
        unsafe_rate = float(np.mean((preds == 1) & (y_val == 0)))
        false_abstain = float(np.mean((preds == 0) & (y_val == 1)))
        f1 = float(f1_score(y_val, preds))
        ckpt_bytes = np.concatenate([clf.coef_.ravel(), clf.intercept_]).tobytes()
        checkpoint_sha = hashlib.sha256(ckpt_bytes).hexdigest()[:12]

        mlflow.log_params(
            {
                "alpha": alpha,
                "threshold_tau": tau,
                "dataset_sha": dataset_sha,
                "evaluator_version": "route-eval-v2",
                "checkpoint_sha": checkpoint_sha,
            }
        )
        mlflow.log_metrics(
            {
                "unsafe_route_rate": round(unsafe_rate, 4),
                "false_abstain_rate": round(false_abstain, 4),
                "f1_answer": round(f1, 4),
                "final_val_loss": round(step_losses[25], 4),
            }
        )
        mlflow.set_tags({"seed": "7", "split": "val_holdout", "code_commit": "4a9e2b"})
        curve_path = os.path.join(tmp_dir.name, f"{run_name}_curve.json")
        with open(curve_path, "w", encoding="utf-8") as handle:
            json.dump({"step_losses": step_losses, "checkpoint_sha": checkpoint_sha}, handle)
        mlflow.log_artifact(curve_path, artifact_path="curves")

runs_df = mlflow.search_runs(experiment_names=["rag-abstention-router"])
summary_cols = [
    "tags.mlflow.runName",
    "params.checkpoint_sha",
    "metrics.final_val_loss",
    "metrics.unsafe_route_rate",
    "metrics.false_abstain_rate",
    "metrics.f1_answer",
]
print(f"Pinned holdout split digest: {dataset_sha} (n={len(y_val)})")
print(runs_df[summary_cols].sort_values("metrics.unsafe_route_rate").to_string(index=False))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Pinned holdout split digest: b54d7ceab650 (n=120)
tags.mlflow.runName params.checkpoint_sha  metrics.final_val_loss  metrics.unsafe_route_rate  metrics.false_abstain_rate  metrics.f1_answer
     strict_tau0.82          76f7f16a274a                   0.187                     0.0083                      0.1083             0.8333
   balanced_tau0.50          62df2fcb552b                   0.204                     0.0167                      0.0583             0.9011
      loose_tau0.30          76f7f16a274a                   0.187                     0.0833                      0.0250             0.8738
  underfit_alpha0.5          95109234af32                   0.513                     0.1750                      0.0333             0.7788
```
<!-- leetllm: output:end -->

Notice two distinct lessons inside that table. First, `loose_tau0.30` and `strict_tau0.82` report the exact same `checkpoint_sha` (`76f7f16a274a`) and `final_val_loss` (`0.187`), confirming mathematically that only the operating threshold moved between those runs[^sklearnThresholdTuning2026]. Second, `balanced_tau0.50` achieves the highest F1 score (`0.9011`) with an unsafe routing rate of `1.67%` and a `5.83%` false-abstention rate, cleanly outperforming `underfit_alpha0.5` across both error dimensions. Plotting both optimization steps and endpoint coordinates makes it clear whether weights failed to converge or simply need threshold calibration.

<figure>
  <img src="illustrations/_generated/experiment_tracking_dark.png" alt="Two stacked panels summarize four tracked MLflow runs evaluated on frozen split b54d7ceab650 (n = 120). Top: validation log-loss across training steps 1 to 25 converges from 0.270 to 0.187 for alpha 0.001 and from 0.274 to 0.204 for alpha 0.005, whereas heavy regularization alpha 0.5 stalls at 0.513. Bottom: a Pareto plot of unsafe route rate versus false abstain rate shows alpha 0.5 at (17.5%, 3.3%) dominated behind three frontier operating thresholds: loose tau 0.30 at (8.3%, 2.5%), balanced tau 0.50 at (1.7%, 5.8%), and strict tau 0.82 at (0.8%, 10.8%)." />
  <figcaption>Top: step-level validation log-loss reveals optimization underfitting in <code>alpha=0.5</code> while both regularized fits converge cleanly. Bottom: threshold choice moves candidates along the safety-versus-abstention Pareto frontier on fixed split <code>b54d7ceab650</code>.</figcaption>
</figure>

```checkpoint
Run A and Run B log the same model weights (`checkpoint_sha`), identical training loss, and identical `dataset_sha`, yet Run B halves unsafe routing while lifting false abstentions. Which tracked setting explains the change?
---
Only the post-hoc decision threshold (`threshold_tau`) changed between runs. Because the checkpoint digest is unchanged, weight training did not shift; raising `tau` simply trades fewer unsafe answers for stricter abstention along the frontier.
```

## Prompt versioning: Model Registry versus Prompt Registry

Weights alone no longer define a candidate once natural-language instructions shape generation or judge grading. MLflow therefore separates **Model Registry** artifacts from its **Prompt Registry** (`mlflow.genai`)[^mlflow2026prompts][^mlflow2026registryworkflow]. Every call to `mlflow.genai.register_prompt` creates a strictly immutable integer version (`1`, `2`, `3`), capturing template text and optional commit notes, while human operators attach mutable deployment **aliases** such as `staging` or `production` to point serving pipelines at a reviewed integer[^mlflowGenaiApi2026].

Resolving `prompts:/rag-citation-gate/2` always loads the exact wording tested during <span data-glossary="offline-evaluation">offline evaluation</span>. By contrast, pointing production services at `@latest` or unpinned `@production` breaks reproducibility if another engineer registers a revised instruction five minutes before an incident review. Even more subtly, whenever an automated LLM judge scores candidates, the judge's own prompt URI must travel inside `evaluator_version` (`route-eval-v2@prompt-2`) so prompt edits never mask themselves as model improvements.

<!-- leetllm: test, deps=mlflow-skinny,sqlalchemy,alembic, output=show, continue=mlflow-sweep, id=mlflow-prompts -->
```python title="mlflow-prompt-registry.py"
v1 = mlflow.genai.register_prompt(
    name="rag-citation-gate",
    template="Cite doc span or abstain: {{query}}",
    commit_message="Initial baseline prompt",
)
v2 = mlflow.genai.register_prompt(
    name="rag-citation-gate",
    template="Verify grounding span score >= 0.70 or emit ABSTAIN: {{query}}",
    commit_message="Tightened unsupported claim rule",
)

mlflow.genai.set_prompt_alias("rag-citation-gate", "staging", v1.version)
mlflow.genai.set_prompt_alias("rag-citation-gate", "production", v2.version)

prod_resolved = mlflow.genai.load_prompt("prompts:/rag-citation-gate@production")
pinned_v1 = mlflow.genai.load_prompt(f"prompts:/rag-citation-gate/{v1.version}")

print(f"@production resolves to version={prod_resolved.version}: {prod_resolved.template}")
print(f"Pinned version={pinned_v1.version} stays immutable: {pinned_v1.template}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
@production resolves to version=2: Verify grounding span score >= 0.70 or emit ABSTAIN: {{query}}
Pinned version=1 stays immutable: Cite doc span or abstain: {{query}}
```
<!-- leetllm: output:end -->

## Keeping leaderboards honest across runs

Dashboards routinely plot runs side by side simply because they sit in the same experiment folder. Yet whenever an engineer expands a regression set, fixes a mislabeled edge case, or upgrades the scoring script from `route-eval-v2` to `route-eval-v3`, raw metrics stop measuring the same quantity. Directly sorting a single leaderboard across mismatched dataset digests or evaluator versions rewards whichever configuration benefited from easier test cases or looser grading[^mlflow2026evaluation].

To prevent silent comparability failures, verify lineage preconditions automatically before applying any promotion rule. Notice in the next step how combining our real tracked runs from SQLite with two artificially altered candidates (`run_split_drift` and `run_scorer_drift`) separates true improvements from blocked comparisons cleanly.

<!-- leetllm: test, deps=mlflow-skinny,sqlalchemy,alembic,numpy,pandas,scikit-learn, output=show, continue=mlflow-prompts, id=comparability-gate -->
```python title="comparability-lineage-gate.py"
records = []
for _, row in runs_df.iterrows():
    records.append(
        {
            "run_name": row["tags.mlflow.runName"],
            "dataset_sha": row["params.dataset_sha"],
            "evaluator_version": row["params.evaluator_version"],
            "unsafe_route_rate": float(row["metrics.unsafe_route_rate"]),
            "false_abstain_rate": float(row["metrics.false_abstain_rate"]),
            "f1_answer": float(row["metrics.f1_answer"]),
        }
    )

# Inject two seemingly superior candidates with broken comparability conditions.
records.append(
    {
        "run_name": "run_split_drift",
        "dataset_sha": "f90e112c89aa",
        "evaluator_version": "route-eval-v2",
        "unsafe_route_rate": 0.008,
        "false_abstain_rate": 0.030,
        "f1_answer": 0.928,
    }
)
records.append(
    {
        "run_name": "run_scorer_drift",
        "dataset_sha": dataset_sha,
        "evaluator_version": "route-eval-v3",
        "unsafe_route_rate": 0.010,
        "false_abstain_rate": 0.040,
        "f1_answer": 0.915,
    }
)

baseline_split = dataset_sha
baseline_eval = "route-eval-v2"
max_unsafe_rate = 0.02

comparable = []
for rec in records:
    if rec["dataset_sha"] != baseline_split:
        print(f"BLOCKED {rec['run_name']:18s}: dataset_sha drifted ({rec['dataset_sha']} != {baseline_split})")
    elif rec["evaluator_version"] != baseline_eval:
        print(f"BLOCKED {rec['run_name']:18s}: scorer drifted ({rec['evaluator_version']} != {baseline_eval})")
    elif rec["unsafe_route_rate"] > max_unsafe_rate:
        print(f"REJECTED {rec['run_name']:17s}: unsafe_route_rate={rec['unsafe_route_rate']:.4f} > {max_unsafe_rate:.2f}")
    else:
        comparable.append(rec)

winner = max(comparable, key=lambda r: (r["f1_answer"], -r["unsafe_route_rate"]))
print(
    f"PROMOTED {winner['run_name']:17s}: F1={winner['f1_answer']:.4f}, "
    f"unsafe={winner['unsafe_route_rate']:.4f}, false_abstain={winner['false_abstain_rate']:.4f}"
)
tmp_dir.cleanup()
```

<!-- leetllm: output:start -->
```text title="Output" output compact
REJECTED loose_tau0.30    : unsafe_route_rate=0.0833 > 0.02
REJECTED underfit_alpha0.5: unsafe_route_rate=0.1750 > 0.02
BLOCKED run_split_drift   : dataset_sha drifted (f90e112c89aa != b54d7ceab650)
BLOCKED run_scorer_drift  : scorer drifted (route-eval-v3 != route-eval-v2)
PROMOTED balanced_tau0.50 : F1=0.9011, unsafe=0.0167, false_abstain=0.0583
```
<!-- leetllm: output:end -->

> **Key insight:** Both `run_split_drift` (`F1 = 0.928`) and `run_scorer_drift` (`F1 = 0.915`) beat `balanced_tau0.50` (`0.9011`) on raw score. Sorting a leaderboard without checking `dataset_sha` and `evaluator_version` first ships a worse model solely because its test split or rubric shifted.

<figure>
  <img src="illustrations/_generated/run_comparison_lineage_dark.png" alt="A left-to-right lineage diagram traces how code commit and seed, frozen evaluation split b54d7ceab650, checkpoint SHA 62df2fcb552b, and evaluator route-eval-v2 at prompt version 2 combine into a comparable balanced candidate run (F1 0.901, unsafe rate 1.7%). Two other runs are flagged as non-comparable on the leaderboard: one altered the evaluation split digest (F1 0.928) and the other changed the evaluator version to eval-v3 (F1 0.915)." />
  <figcaption>Comparability verification allows direct ranking only when code/seed lineage, frozen evaluation split <code>b54d7ceab650</code>, and pinned scorer <code>route-eval-v2</code> align across candidates.</figcaption>
</figure>

### Evaluation hygiene: preventing leakage and metric saturation

Even with matching SHA digests, repeated iteration turns a static holdout split into training signal through human feedback. Every time you inspect failures on `b54d7ceab650`, hypothesize a new feature threshold $\tau$, and promote the fix that clears those exact cases, that split stops behaving as an unbiased test of unseen production traffic. Keep a clean split separation inside your tracker tags (`dev`, `val_holdout`, `final_release`): iterate rapidly on development <span data-glossary="evaluation-slice">evaluation slices</span>, pick hyperparameters on `val_holdout`, and touch `final_release` once before candidate <span data-glossary="rollback">rollback</span> sign-off to detect <span data-glossary="overfitting">overfitting</span>.

Equally important is recognizing when a frozen suite saturates. Once multiple candidates score `100%` on a small regression pack, that metric ceases to separate candidate quality, much like checking basic arithmetic before hiring a systems engineer. Keep saturated cases as regression alarms rather than deleting them, expand the evaluation suite explicitly with newly tagged edge cases, bump the suite version alongside its new `dataset_sha`, and re-score baseline candidates under the expanded rubric before making relative claims.

```checkpoint
Three consecutive model candidates all score 1.00 on your core 40-case regression suite. Should you retire those 40 cases and swap in 40 new ones under the same dataset name?
---
No. Retain the passing regression cases so future edits never silently reintroduce old bugs, and add new discriminating cases under a bumped dataset version and fresh SHA-256 fingerprint so baseline comparisons remain transparent.
```

## Parallel workflow in Weights & Biases and Weave

Organizations running distributed fine-tuning alongside prompt pipelines often track parametric runs in **W&B Experiments** (`wandb.init`, `run.log`, `wandb.Artifact`)[^wandb2026experiments][^wandb2026artifacts][^wandbInitApi2026] while tracing per-example agent or RAG calls in **W&B Weave** (`@weave.op()`, `weave.Evaluation`)[^wandb2026weave][^weavePythonApi2026]. Offline mode (`WANDB_MODE=offline`) allows reproducible local logging and cryptographic artifact verification even inside air-gapped CI jobs before syncing artifacts upward to a hosted project with searchable tags[^wandb2026tags].

Because Weave automatically captures function arguments and return values when initialized against a hosted project (`weave.init(...)`), treat that capture step as an external data boundary under your <span data-glossary="secrets-management">secrets management</span> policy: scrub customer PII, bearer keys, and sensitive document spans inside a pre-logging wrapper or <span data-glossary="opentelemetry">OpenTelemetry</span> span processor before invoking hosted tracing. Executing `weave.Evaluation` without `weave.init` below runs all scoring locally in memory while illustrating exact `Evaluation` and scorer schemas[^weaveScorers2026].

<!-- leetllm: test, deps=wandb,weave,numpy,scikit-learn, output=show, id=wandb-weave-lab -->
```python title="wandb-weave-eval.py"
import asyncio
import hashlib
import json
import os
import tempfile

# Isolate local config/credentials so offline evaluation never reads user .netrc or uploads traces.
wb_tmp = tempfile.TemporaryDirectory()
os.environ["HOME"] = wb_tmp.name
os.environ["WANDB_MODE"] = "offline"
os.environ["WANDB_SILENT"] = "true"
os.environ["WEAVE_DISABLED"] = "true"

import numpy as np
import wandb
import weave
from sklearn.linear_model import LogisticRegression

rng = np.random.default_rng(11)
X_wb = rng.normal(size=(180, 4))
y_wb = (X_wb[:, 0] + 0.9 * X_wb[:, 1] - 0.7 * X_wb[:, 2] > 0).astype(int)

for c_val in (0.5, 2.0):
    run = wandb.init(
        project="rag-citation-gate",
        name=f"logreg-C{c_val}",
        config={"C": c_val, "split_sha": "b54d7ceab650", "evaluator_version": "route-eval-v2"},
        dir=wb_tmp.name,
        reinit="finish_previous",
    )
    clf = LogisticRegression(C=c_val, random_state=11).fit(X_wb[:120], y_wb[:120])
    val_acc = float(clf.score(X_wb[120:], y_wb[120:]))
    run.log({"val_acc": round(val_acc, 4)})

    model_path = os.path.join(wb_tmp.name, f"weights_C{c_val}.json")
    payload = {"coef": clf.coef_.tolist(), "intercept": clf.intercept_.tolist()}
    with open(model_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    ckpt_digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:12]

    artifact = wandb.Artifact("router-weights", type="model", metadata={"sha256_prefix": ckpt_digest})
    artifact.add_file(model_path)
    run.log_artifact(artifact)
    run.finish()
    print(f"Logged offline W&B run C={c_val:<3} | val_acc={val_acc:.4f} | artifact_sha={ckpt_digest}")

eval_rows = [
    {"query": "Where does TLS terminate in staging?", "expected": "CITE_DOCS"},
    {"query": "Prescribe an antibiotic dosage for ear pain.", "expected": "ABSTAIN"},
    {"query": "What is the default connection pool limit?", "expected": "CITE_DOCS"},
]

@weave.op()
def route_policy(query: str) -> str:
    blocked_terms = ("prescribe", "dosage", "diagnose")
    return "ABSTAIN" if any(t in query.lower() for t in blocked_terms) else "CITE_DOCS"

@weave.op()
def exact_route_match(expected: str, output: str) -> dict:
    return {"exact_match": output == expected}

evaluation = weave.Evaluation(dataset=eval_rows, scorers=[exact_route_match])
weave_summary = asyncio.run(evaluation.evaluate(route_policy))
match_rate = weave_summary["exact_route_match"]["exact_match"]["true_fraction"]
print(f"Weave offline evaluation exact_match={match_rate:.2f} across {len(eval_rows)} cases")
wb_tmp.cleanup()
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Logged offline W&B run C=0.5 | val_acc=0.9833 | artifact_sha=3e1f5f9d88c5
Logged offline W&B run C=2.0 | val_acc=0.9667 | artifact_sha=bac5ec1447e0
Weave offline evaluation exact_match=1.00 across 3 cases
```
<!-- leetllm: output:end -->

## Retaining rejected runs and compiled prompt programs

Teams often delete underperforming runs such as `underfit_alpha0.5` or unsafe settings such as `loose_tau0.30` to tidy their dashboard. Keeping rejected experiments inside the tracking store is actually one of your highest-leverage investments: six months later, another engineer wondering why regularization wasn't raised to `0.5` or why `tau=0.30` was rejected sees empirical convergence curves and `unsafe_route_rate = 0.0833` in thirty seconds instead of burning compute rediscovering the same dead end. Never hide dominated candidates; tag them (`status=rejected_safety`, `status=underfit_dominated`) so search filters surface promoted candidates without erasing history.

The exact same accounting applies when an automated prompt compiler or <span data-glossary="optimizer">optimizer</span> such as <span data-glossary="dspy">DSPy</span> replaces hand-edited templates. Because a compiler searches instructions and few-shot demonstrations directly against an evaluation metric, it behaves like weight optimization over discrete text: if you optimize directly on a validation split, that split is now training data for prompt selection. Record the optimizer hyperparameters (`optimizer_name`, seed, search budget), the dataset SHA for both optimization and held-out splits, the exact <span data-glossary="eval-harness">evaluation harness</span> and judge version, every rejected intermediate program, and the compiled program JSON hash as an immutable artifact alongside the winning candidate.

## Test your understanding

```mastery-quiz
[
  {
    "question": "Candidate B beats Candidate A on validation F1 (0.915 vs. 0.901), while `checkpoint_sha` matches and `evaluator_version` changed from `route-eval-v2` to `route-eval-v3`. What can a reviewer conclude right away?",
    "options": [
      "Candidate B lowers production error risk because higher F1 outweighs minor evaluator schema revisions.",
      "Direct leaderboard ranking stays invalid until both candidates run under identical dataset and evaluator versions.",
      "Training shards suffered silent feature corruption while exporting the shared checkpoint between runs.",
      "Increasing the post-hoc decision cutoff between v2 and v3 raises F1 and safety simultaneously."
    ],
    "answer": "Direct leaderboard ranking stays invalid until both candidates run under identical dataset and evaluator versions.",
    "explanation": "Changing `evaluator_version` alters how outputs are scored, so score differences mix candidate behavior with scoring rules. Both candidates must be evaluated under identical dataset and scorer versions before ranking."
  },
  {
    "question": "In an MLflow sweep on the same holdout split `b54d7ceab650`, `loose_tau0.30` and `strict_tau0.82` have identical `checkpoint_sha` (`76f7f16a274a`) and identical `final_val_loss` (`0.187`), yet `unsafe_route_rate` drops from `8.33%` to `0.83%`. What changed?",
    "options": [
      "Stronger L2 regularization shrank parameter norms during fine-tuning without shifting the split digest.",
      "Additional optimizer steps reduced logit entropy while leaving the holdout cross-entropy unchanged.",
      "The post-hoc threshold `tau` increased, shifting the operating point along the existing Pareto frontier.",
      "The SQLite tracking store truncated floating-point prediction probabilities during artifact serialization."
    ],
    "answer": "The post-hoc threshold `tau` increased, shifting the operating point along the existing Pareto frontier.",
    "explanation": "Identical `checkpoint_sha` and validation log-loss confirm that model weights are unchanged; moving `threshold_tau` from `0.30` to `0.82` trades fewer unsafe routes (`8.33%` down to `0.83%`) against higher false abstentions (`2.50%` up to `10.83%`)."
  },
  {
    "question": "Why should MLflow Prompt Registry aliases like `@production` point to numbered versions (`prompts:/rag-citation-gate/2`) while offline evaluation records pin the integer version directly?",
    "options": [
      "Named aliases add join overhead inside SQLite tracking queries during multi-thousand-row batch replays.",
      "Mutable aliases rotate across deployments, whereas integer versions stay pinned for historical run replay.",
      "Registry garbage collection prunes prior prompt text payloads once an environment alias shifts forward.",
      "Template variable interpolation requires explicit `@production` routing tags during online inference."
    ],
    "answer": "Mutable aliases rotate across deployments, whereas integer versions stay pinned for historical run replay.",
    "explanation": "Reassigning `@production` updates what live traffic fetches without editing application code, whereas pinned integer versions guarantee any future replay inspects the exact wording scored during offline evaluation."
  },
  {
    "question": "An automated judge uses prompt version 1 during Run 010 and switches to an updated judge prompt version 2 during Run 011, while both runs log `evaluator_version=\"llm-judge\"`. Why does that hide comparability errors?",
    "options": [
      "Altering judge wording shifts grading behavior without modifying the logged `evaluator_version` tag.",
      "Prompt Registry upgrades re-initialize base classifier weights whenever a scoring template bumps version.",
      "Floating-point F1 metrics clip to zero inside MLflow charts once prompt instructions change mid-experiment.",
      "Metric step loggers reject floating-point updates while `evaluator_version` stays constant across runs."
    ],
    "answer": "Altering judge wording shifts grading behavior without modifying the logged `evaluator_version` tag.",
    "explanation": "Because judge instructions define the scoring rubric, changing prompt wording without bumping `evaluator_version` (for example `llm-judge@prompt-2`) causes comparability checks to falsely treat differing rubrics as equivalent."
  },
  {
    "question": "Why does logging validation loss per step alongside final threshold metrics improve debugging over logging only end-of-run F1?",
    "options": [
      "Per-step validation curves isolate covariate drift in live user prompts prior to canary release.",
      "Per-step loss separates underfit training (`alpha=0.5` at `0.513`) from calibrated weights needing tuning.",
      "Serving routers recompute validation cross-entropy alongside probability calibration at inference time.",
      "End-of-run F1 aggregates true positives while omitting false-positive routing rates from the summary."
    ],
    "answer": "Per-step loss separates underfit training (`alpha=0.5` at `0.513`) from calibrated weights needing tuning.",
    "explanation": "Plotting `val_log_loss` per training step immediately reveals underfitting (`alpha=0.5` plateauing high at `0.513`) versus converged probability models whose error trade-off only depends on threshold `tau`."
  },
  {
    "question": "In the W&B Weave workflow, Run A executed with `WANDB_MODE=offline` and uploaded no network events, while Run B evaluated locally without calling `weave.init(...)`. Which statement accurately describes what is persisted in a hosted W&B project?",
    "options": [
      "Finishing Run A and Run B triggers background uploads so both local runs reach the hosted W&B dashboard.",
      "Neither publishes remote cloud traces right away; Run A writes local sync files and Run B stays in memory.",
      "Running `weave.Evaluation.evaluate` writes scored prediction tables straight into MLflow's local SQLite file.",
      "Setting offline mode omits SHA-256 artifact digests from local run metadata until network upload completes."
    ],
    "answer": "Neither publishes remote cloud traces right away; Run A writes local sync files and Run B stays in memory.",
    "explanation": "`WANDB_MODE=offline` writes local run files and artifact metadata without network transmission until `wandb sync`, and calling `weave.Evaluation.evaluate` without `weave.init(...)` computes scores locally without publishing hosted traces."
  },
  {
    "question": "What operational risk arises when an engineering team repeatedly adjusts hyperparameters and prompts based on inspection of errors inside a frozen holdout split (`b54d7ceab650`)?",
    "options": [
      "Reading split rows updates file access metadata, invalidating the frozen SHA-256 dataset digest across runs.",
      "Iterative inspection turns the holdout split into indirect tuning data, inflating apparent generalization.",
      "Tracking stores lock further `search_runs` queries once the same holdout SHA appears across multiple sweeps.",
      "Repeatedly raising `tau` drives false abstentions to zero while overfitting rare routing examples."
    ],
    "answer": "Iterative inspection turns the holdout split into indirect tuning data, inflating apparent generalization.",
    "explanation": "Reusing a holdout split to guide manual feature or threshold edits leaks holdout structure into modeling choices. Preserve an untouched final release split (`final_release`) outside iterative debugging."
  },
  {
    "question": "All four candidate models reach `exact_match = 1.00` on your existing 50-case regression suite. What should your tracking workflow do next?",
    "options": [
      "Ship the fastest-compiling model right away once every baseline regression check reaches `1.00` accuracy.",
      "Overwrite the 50 regression prompts in place with harder queries while retaining the original dataset digest.",
      "Keep the 50 regression checks, add harder slices under a bumped dataset SHA, and re-score baselines.",
      "Bypass threshold calibration gates across sweeps while all four candidate checkpoints report identical accuracy."
    ],
    "answer": "Keep the 50 regression checks, add harder slices under a bumped dataset SHA, and re-score baselines.",
    "explanation": "A saturated metric cannot distinguish candidates, though the existing cases still prevent regressions. Expanding coverage explicitly under a new dataset version and SHA keeps historical comparisons clean."
  },
  {
    "question": "Why should rejected candidates such as `underfit_alpha0.5` (`F1=0.7788`) and `loose_tau0.30` (`unsafe_route_rate=8.33%`) remain searchable in MLflow or W&B rather than being deleted?",
    "options": [
      "Purging failed runs breaks foreign-key indexes linking prompt registry aliases inside the SQLite backend.",
      "Retained failure records document why poor settings failed so teams avoid repeating stale parameter sweeps.",
      "MLflow's run comparison UI requires at least four finished sweeps per experiment before rendering metrics.",
      "Keeping dominated configurations lowers validation loss estimates along the computed Pareto frontier curve."
    ],
    "answer": "Retained failure records document why poor settings failed so teams avoid repeating stale parameter sweeps.",
    "explanation": "Keeping rejected runs tagged with why they failed turns dead ends into durable institutional knowledge so teams do not burn time revisiting dominated parameters or unsafe operating points."
  },
  {
    "question": "When tracking a compiled prompt program produced by an optimizer like DSPy, what additional tracking invariant matters beyond static handwritten prompts?",
    "options": [
      "Compiled prompt programs inherit upstream dataset hashes, removing the need for split-level SHA logs.",
      "Record optimizer parameters, separate tuning and holdout SHAs, scorer tag, candidates, and saved state.",
      "Persist the generated instruction string alone without logging optimizer seeds or few-shot examples.",
      "Bind the logged `evaluator_version` string to the scalar training loss emitted at final optimization."
    ],
    "answer": "Record optimizer parameters, separate tuning and holdout SHAs, scorer tag, candidates, and saved state.",
    "explanation": "Prompt optimizers fit instructions and demonstrations directly against an optimization split; separating optimization data from held-out evaluation and logging the compiled artifact alongside search settings prevents hidden leakage."
  }
]
```

> **Next:** Continue to [Prompt Optimization with DSPy](/learn/programmatic-prompt-optimization-dspy). A search over instructions and demonstrations will tempt you to trust the score on the cases that shaped the program. Keep development feedback separate from the final held-out evaluation, and keep the compiled program beside its scores.
