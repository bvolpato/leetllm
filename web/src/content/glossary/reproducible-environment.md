---
title: Reproducible environment
importance: 62
---
A **reproducible environment** is a pinned, reconstructible stack of everything that can change a computation's outcome: source identity, dependency graph, OS and system libraries, hardware notes, data and index snapshots, runtime config, and seeds where they matter. Given that pin set, another person (or your future self) can rebuild the stack and get the *same results within an agreed tolerance*.

This is broader than a single [dependency lockfile](glossary://dependency-lockfile): OS, native libraries, data snapshots, hardware notes, and runtime knobs all count. The Reproducible Builds project defines a *bit-identical* software build as one where the same source, build environment, and build instructions yield bit-by-bit identical artifacts. Machine learning usually aims one level looser: same code path, same data, same configs, metrics that match within documented nondeterminism (GPU kernels, floating-point reduction order, multi-worker shuffles). ACM artifact badging similarly accepts results "in agreement to within a tolerance deemed acceptable for experiments of the given type," not always exact floating-point equality.

## Intuition

"Works on my machine" fails because *environment* is a stack, not one file. Each layer can silently move while the notebook cell looks unchanged:

| Layer | What drifts if unpinned | Typical pin |
| --- | --- | --- |
| Source | Uncommitted edits, wrong branch | Git commit SHA + archived patch / untracked inputs if dirty |
| Language packages | Transitive upgrades, CUDA wheel choice | Lockfile with integrity hashes |
| System / GPU userland | libc, OpenBLAS, CUDA toolkit | [Container image](glossary://container-image) digest |
| Host / drivers | NVIDIA driver, kernel, CPU vs GPU | Hardware and driver notes in the run record |
| Data | New labels, re-parsed docs, live index | Snapshot id + [checksums](glossary://checksum) |
| Runtime knobs | Env vars, precision, seeds, batch size | Config file hash + recorded env |
| External services | Model API versions, tool stubs | Version pins or test cases / stubs |
| Model artifacts | Different weights, adapters, tokenizer | Immutable revisions and consumed-file digests |

A lockfile freezes language packages. An image digest freezes more of the OS and native stack. Dataset digests freeze the evidence. Seeds reduce RNG drift. None of them alone is the full environment.

## How it works

1. **Freeze source.** Record the exact revision (`git rev-parse HEAD`) and whether the tree was clean. If it was dirty, archive the actual patch and relevant untracked files; a dirty flag alone cannot reconstruct them.
2. **Freeze language deps.** Install from a committed lockfile (`uv.lock`, `poetry.lock`, `pnpm-lock.yaml`, hashed `requirements.txt`) with a frozen/CI install mode so resolvers cannot pick newer transitive versions.
3. **Freeze the system surface.** Prefer a content-addressed [container image](glossary://container-image) (pull by `sha256:…`, not by floating `:latest`). Note CUDA userland inside the image and driver version on the host when GPU work is involved.
4. **Freeze data and indexes.** Version train/eval sets and retrieval corpora with ids plus cryptographic digests of the files actually consumed. A name like `train-v12` without a checksum is a label, not an identity.
5. **Freeze runtime policy.** Persist seeds, dtype / mixed-precision mode, temperature and decoding params, feature flags, and non-secret [environment variables](glossary://environment-variable) that change behavior. Stub or pin live tools (search, clocks, production DBs) for offline eval.
6. **Write a run manifest.** Attach the pins to the training run, eval report, or incident ticket so the stack is *discoverable*, not tribal knowledge. Tools such as [MLflow](glossary://mlflow) help log params and code version; the environment idea is what you choose to log.

Pineau's Machine Learning Reproducibility Checklist (used at NeurIPS) asks authors for dependency specification, training and evaluation code, dataset details and splits, hyperparameter ranges, number of runs, and a description of the computing infrastructure. A reproducible environment is the operational answer to those checklist items: a machine-checkable pin set rather than a paragraph of prose.

## Example

A team freezes a document-QA eval that last week scored citation accuracy $0.91$. Six months later someone claims a "model upgrade" improved it to $0.94$. The run manifest for the baseline looks like:

```yaml
# eval-run-manifest.yaml (illustrative)
claim: support-doc-qa citation_accuracy
git:
  commit: a1b2c3d4e5f6789012345678901234567890abcd
  dirty: false
python:
  version: "3.12.4"
  lockfile: uv.lock
  lock_sha256: "9f3c…b21a"
image:
  ref: "registry.example.com/eval@sha256:94a00394bc5a8ef503fb59db0a7d0ae9e1110866e8aee8ba40cd864cea69ea1a"
  cuda_userland: "12.4"
hardware:
  gpu: "NVIDIA A100-SXM4-40GB"
  driver: "550.54.15"
data:
  golden_set: "support-qa@v14"
  golden_sha256: "c0ffee…cafe"
  index: "policies@2026-03-01"
  index_sha256: "deadbeef…"
runtime:
  prompt_template: "reply-v7"
  temperature: 0.0
  max_new_tokens: 512
  seed: 0
  torch: "2.5.1"
  deterministic_flag: true
command: >
  python -m eval.harness
  --suite support-qa@v14
  --config configs/reply-v7.yaml
```

Rebuild path:

```bash
git checkout a1b2c3d4e5f6789012345678901234567890abcd
docker pull registry.example.com/eval@sha256:94a00394bc5a8ef503fb59db0a7d0ae9e1110866e8aee8ba40cd864cea69ea1a
# verify data digests match the manifest, then:
docker run --rm --gpus all \
  -v "$PWD/data:/data:ro" \
  registry.example.com/eval@sha256:94a00394bc5a8ef503fb59db0a7d0ae9e1110866e8aee8ba40cd864cea69ea1a \
  python -m eval.harness --suite support-qa@v14 --config configs/reply-v7.yaml
```

The illustrative image must contain the recorded source and dependencies, and the data mount must contain the verified snapshots. If the rebuilt run lands near $0.91$ but the "upgrade" changed the index or dependencies too, the comparison cannot isolate the model's effect. Match those inputs or run controlled comparisons before attributing the gain.

Minimal seed hygiene for a PyTorch training or offline-eval process on one platform (from the official reproducibility notes). Cross-GPU runs can still differ at the bit level. Set `CUBLAS_WORKSPACE_CONFIG` before any CUDA work:

```python
import os

# Required for some deterministic cuBLAS paths (PyTorch docs); set before CUDA runs.
os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")

import random
import numpy as np
import torch

def seed_everything(seed: int = 0) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)  # seeds CPU and CUDA RNGs
    # Prefer deterministic kernels where available; slower, fails loudly if missing.
    torch.use_deterministic_algorithms(True)
    torch.backends.cudnn.benchmark = False
```

PyTorch documents that results can differ across releases, commits, and platforms; CPU and GPU runs can also diverge under identical seeds. Treat seeds as one layer of the environment and record the rest of the stack.

## Limits

Distinguish three related goals:

| Goal | Meaning | Realistic for GPU ML? |
| --- | --- | --- |
| **Bit-identical build** | Same bytes for a binary or image (Reproducible Builds definition) | Achievable for many pure software packages; hard for every GPU wheel and every host driver path |
| **Run-to-run determinism** | Same machine, same stack, same seed $\Rightarrow$ same tensors | Often approachable with deterministic algorithms; can cost throughput |
| **Practical reproducibility** | Same pins $\Rightarrow$ metrics within agreed $\varepsilon$ | The usual production target for training, eval gates, and incident replay |

Sources of residual nondeterminism even after pins:

- Atomic CUDA reductions and some attention / pooling backward paths
- cuDNN algorithm choice if benchmarking is left on
- Multi-process `DataLoader` workers without a seeded `worker_init_fn` and generator
- Live model APIs, wall clocks, and mutable production indexes
- Floating-point non-associativity when reduction order or SDPA backend changes

Document known nondeterminism and the tolerance $\varepsilon$ (for example "citation accuracy within $\pm 0.01$ on this suite") rather than claiming bitwise identity you did not measure.

## Debug path

When two runs disagree and "nothing changed":

1. Diff **git SHAs** and dirty status, not branch names.
2. Diff **lockfile** hashes and the install mode (frozen vs re-resolve).
3. Diff **image digests** (and platform-specific digests if multi-arch).
4. Diff **data and index digests**, parser versions, and test case suite ids.
5. Diff **runtime**: seeds, temperature, precision, feature flags, stubbed tools.
6. Only then dig into model weights or "random GPU behavior."

Unpinned data and floating tags are concrete explanations to check before attributing disagreement to hardware randomness.

## Trade-offs

| Choice | Gain | Cost |
| --- | --- | --- |
| Lockfile only | Fast, light | Misses OS, CUDA, data drift |
| Container digest + lockfile | Strong app/runtime pin | Larger artifacts; host driver still external |
| Full bit-determinism flags | Easier micro-debug | Slower kernels; some ops error out |
| Practical $\varepsilon$-match | Shippable CI and eval gates | Need written tolerances and multi-seed variance |
| Bake weights into the image | Portable air-gap deploys | Huge rebuilds on every checkpoint bump |

## Why it matters here

Training comparisons, offline eval gates, agent trajectory scoring, and production incident replay all assume you can reconstruct *what ran*. Without a reproducible environment, a higher score can mean a better model, a newer package, a quieter index, or a different temperature. Pin the stack, store the manifest with the result, and treat environment drift as a first-class regression class next to model and prompt changes.

## Related terms

- [Dependency lockfile](glossary://dependency-lockfile)
- [Checksum](glossary://checksum)
- [Container image](glossary://container-image)
- [test case](glossary://fixture)
- [lineage](glossary://provenance)
