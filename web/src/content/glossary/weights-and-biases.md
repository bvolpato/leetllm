---
title: Weights & Biases
aliases: ["W&B", "wandb", "Weights and Biases"]
importance: 68
kind: code
---
**Weights & Biases** (W&B, Python package `wandb`) is a commercial experiment-tracking and model-development platform. Official docs organize work around **Runs**, **Projects**, **Config**, **logged metrics**, **Artifacts**, **Sweeps**, **Tables**, **Reports**, and a **Registry** for promoted artifact versions. A run is one execution of training, evaluation, or data processing code; the platform is shared external memory so config, curves, system telemetry, sample outputs, and file lineage outlive one notebook or GPU job.

W&B is an experiment-tracking product for recording how model parameters were produced and judged. The name distinguishes it from the mathematical weights and bias terms.

## Intuition

Training and fine-tuning produce more than a final weight file. Teammates need answers to:

| Logged piece | Question it answers |
|---|---|
| `config` | What knobs and versions were fixed for this run? |
| Metrics (with step) | How good, and when in training? |
| System metrics | Did GPU/CPU/memory starve the job? |
| Artifacts (use + log) | Which data went in; which checkpoint came out? |
| Tables / media | What did fixed prompts or eval rows look like? |
| Tags / notes | Why did we promote or reject this run? |

A shared log turns "the good checkpoint from last Tuesday" into traceable run history. W&B keeps comparisons inspectable, with live dashboards while a multi-hour LLM job is running.

## How it works

1. **Project and entity.** A **project** is a named bucket of related runs (for example `support-sft`). An **entity** is a user or team that owns the project. Set both on `wandb.init(...)`. If you omit the project name, W&B tries to infer it from the Git root or program file; its fallback is `"uncategorized"`. [W&B init reference](https://docs.wandb.ai/models/ref/python/functions/init)
2. **Run.** `wandb.init(...)` (prefer the context manager form) creates a run with a unique **run ID** and a human-readable **run name**. On context exit, the client finishes uploading logged data; if an exception escapes the block, the run is marked failed. Local sync state lives under `./wandb/`.
3. **Config.** Put hyperparameters and version pins into `run.config` (or `config=` on init). Treat config as the immutable recipe for that run: base model revision, dataset id and checksum, LoRA rank, learning rate, seed, eval suite id, decoding params that affect scored outputs.
4. **Metrics.** Inside the loop, `run.log({"loss": loss, "eval/f1": f1})` records scalars (and richer media). Each call advances W&B's internal step unless you pass an explicit step. Charts appear in the project workspace in near real time.
5. **Artifacts.** Versioned, content-addressed blobs that are **inputs** and **outputs** of runs. Declare inputs with `run.use_artifact("name:alias")` so lineage is explicit; emit outputs with `wandb.Artifact(...)`, `add_file` / `add_dir`, then `run.log_artifact(...)`. Types such as `dataset` and `model` control how objects appear in the UI. Downstream jobs download with `artifact.download()`.
6. **Registry.** Log an artifact to a run, then `run.link_artifact(...)` into a **collection** inside a **registry** (for example Models / Datasets or a custom registry). Linking stores a pointer to the artifact. The registry supports organization-wide promotion, permissions, lineage views, and CI automations. Keep the external [eval gate](glossary://eval-gate) as a separate decision step.
7. **Sweeps.** A **sweep** config declares search `method` (`grid`, `random`, or Bayesian), the metric to optimize, and hyperparameter distributions. `wandb sweep` (or the SDK) creates a sweep id; **agents** pull configs and each trial is a normal run under the same project. Scale by running more agents.
8. **Query and compare.** Filter the project UI or use the Public API (`wandb.Api()`) for programmatic access. Prefer comparing runs only when base model, data version, eval slice, seed policy, and metric definitions match.

For LLM work, also log prompt template ids, chat template / tokenizer revisions, judge model version, and a small fixed set of qualitative generations. Use evaluation results and those samples to judge product behavior alongside loss curves.

## Example

Fine-tune a support bot with LoRA and leave a trail another engineer can re-open a week later:

```python
import wandb

with wandb.init(
    entity="ml-platform",
    project="support-sft",
    name="lora-r16-lr2e5",
    job_type="train",
    config={
        "base_model": "Qwen/Qwen2.5-7B-Instruct",
        "base_revision": "a1b2c3d",
        "dataset": "support-sft-v7",
        "dataset_sha": "sha256:9f3c…",
        "lora_r": 16,
        "lora_alpha": 32,
        "lr": 2e-5,
        "epochs": 3,
        "seed": 42,
        "git_commit": "c0ffee1",
        "prompt_template": "support_v3",
        "max_new_tokens_eval": 256,
        "temperature_eval": 0.0,
    },
    tags=["task:support-sft", "candidate"],
) as run:
    # Illustrative IDs above; use real immutable revisions in an actual run.
    data = run.use_artifact("support-sft-v7:v0")  # pin an existing version
    data_dir = data.download()

    # ... train on data_dir ...

    for step, val_loss in [(200, 1.12), (400, 0.91), (600, 0.84)]:
        run.log({"train/val_loss": val_loss}, step=step)

    run.log({
        "eval/task_f1": 0.81,
        "eval/citation_rate": 0.94,
        "eval/safety_fail": 0.0,
        "eval/p95_latency_ms": 420,
    })

    # Fixed prompts for qualitative review (Table is searchable in the UI)
    run.log({
        "eval/samples": wandb.Table(
            columns=["prompt_id", "output", "judge_score"],
            data=[["p01", "…", 0.9], ["p02", "…", 0.7]],
        )
    })

    ckpt = wandb.Artifact("support-sft-adapter", type="model")
    ckpt.add_dir("outputs/adapter")
    logged = run.log_artifact(ckpt)
    # Optional: promote a reviewed version into the org registry
    # run.link_artifact(logged, target_path="wandb-registry-Models/support-sft")
```

A week later, filter project `support-sft` where `config.dataset = support-sft-v7` and `config.base_revision` matches, sort by `eval/task_f1`, and open artifacts plus sample tables to see which customer slices moved. CI promotes reviewed candidates by downloading the artifact, running the pinned [offline evaluation](glossary://offline-evaluation) suite, and linking or aliasing a production pointer after the gate passes.

Minimal sweep shape (search one factor at a time when possible):

```yaml
# sweep.yaml
program: train.py
method: bayes
metric:
  name: eval/task_f1
  goal: maximize
parameters:
  lr:
    distribution: log_uniform_values
    min: 1e-5
    max: 5e-4
  lora_r:
    values: [8, 16, 32]
```

```bash
wandb sweep --project support-sft sweep.yaml   # prints sweep id
wandb agent <entity/project/sweep_id>
```

## What to log

Log the boring parts that decide reproducibility:

- **Identity:** git commit, container or [dependency lockfile](glossary://dependency-lockfile) hash, hardware notes (W&B also records many system metrics automatically)
- **Data:** dataset artifact name + resolved immutable version and checksum, train/val split policy (aliases such as `latest` can move)
- **Model:** base checkpoint id and revision, adapter config, tokenizer revision, chat template id
- **Train knobs:** seed, [learning rate](glossary://learning-rate), batch size, epochs, precision, distributed strategy
- **Eval contract:** suite version, slice definitions, judge model/version, decoding params that affect scored outputs
- **Artifacts:** best [model checkpoint](glossary://model-checkpoint), sample predictions, slice tables, notes on promote/reject

If two runs disagree, diff those fields before debating architecture. Many "model improvements" are eval drift, data leakage, or a changed prompt template logged nowhere.

## What fails in production

- **Incomparable leaderboards.** Runs sorted by a single metric while base model, data version, or eval suite differ. The chart answers the wrong question.
- **Reproducible data lineage.** Record `use_artifact` and the dataset checksum with each run so teams can rebuild the training set alongside its loss curves.
- **Partial logging that looks successful.** Crash before `log_artifact`, offline mode never synced, or secret/env missing so the run never attached to the right project.
- **Registry link without a gate.** A collection link records promotion metadata. Automated gates and an [audit trail](glossary://audit-trail) provide quality, cost, and safety evidence.
- **Log volume and cost.** Logging huge tensors every step, thousands of files per run, or full generations for every train sample blows storage and slows run pages. Prefer step-sampled scalars, Artifacts for large files, and small fixed qualitative panels.
- **Auth and tenancy mistakes.** Wrong entity/project, personal API keys in shared CI, or PII in Tables/notes that outlive the incident.

## Trade-offs

**Strengths:** real-time multi-user dashboards; first-class Artifacts with input/output lineage; Sweeps that fan out as normal runs; Tables and media for qualitative LLM review; system metrics during long jobs; Registry for org-wide promotion and automations; deep framework integrations (PyTorch, Hugging Face, Lightning, and others).

**Limits:** SaaS by default (self-hosted / dedicated options exist for enterprise, but you still operate auth, retention, and egress policy); commercial pricing and data residency constraints; empty or partial logging still produces a "finished" run; metric name and unit drift across teams unless you enforce a schema. Feature stores and incident tooling serve separate roles from experiment tracking. W&B also offers [Weave](https://docs.wandb.ai/weave) for LLM tracing and evaluation, a separate part of its platform. Compared with open-source trackers such as [MLflow](glossary://mlflow), deployment and collaboration trade-offs depend on which hosted or self-managed option you choose.

## Why it matters here

AI/ML work is multi-run by nature: base models, data versions, prompts, adapters, and eval suites change independently. W&B connects those experiments to comparable metrics and to versioned artifact lineage that release systems can pin, reload, and roll back. For curriculum and production alike, that turns training folklore into inspectable [provenance](glossary://provenance).

## Related terms

- [MLflow](glossary://mlflow)
- [Model checkpoint](glossary://model-checkpoint)
- [Offline evaluation](glossary://offline-evaluation)
- [Eval gate](glossary://eval-gate)
- [Provenance](glossary://provenance)
