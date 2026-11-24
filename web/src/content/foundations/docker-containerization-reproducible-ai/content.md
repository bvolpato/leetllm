---
{
  "id": "docker-containerization-reproducible-ai",
  "title": "Docker for Reproducible AI",
  "slug": "docker-containerization-reproducible-ai",
  "section": "Computing Foundations",
  "category": "MLOps & Deployment",
  "difficulty": "Easy",
  "order": 2,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta",
    "xAI"
  ],
  "shortDescription": "Package a Python evaluation runner so any machine can reproduce the 0.667 score without relying on laptop Python setup.",
  "keyConceptsTested": [
    "multi-stage Dockerfile (builder vs runtime) for a slim Python image",
    ".dockerignore patterns for AI projects",
    "read-only bind mounts and named volumes",
    "docker compose for a stable local command",
    "runtime secret files and BuildKit secret mounts",
    "non-root users and layer cache optimization",
    "portable, version-constrained build across laptops and CI",
    "GPU container failures as a later platform-specific extension"
  ],
  "prerequisites": [
    "git-shell-linux-reproducible-ai"
  ],
  "relatedQuestions": [
    "python-for-ai-engineering",
    "sql-databases-data-modeling-ai"
  ]
}
---

A teammate clones `prompt-eval`, sees `scripts/score_eval.py` and `eval/eval_cases.jsonl` sitting right where Git put them, and still cannot reprint `0.667`. Their laptop runs a different Python version, different Debian libraries, or different filesystem permissions. Git shipped the source files, not the runtime beneath them.

<span data-glossary="docker">Docker</span> closes that gap. `docker build` packages Python, its dependencies, and your application files into a layered <span data-glossary="container-image">container image</span>. `docker run` launches an isolated <span data-glossary="container">container</span> from that image, executes the scorer, and with `--rm` deletes the stopped container and its writable layer while keeping the image ready for reuse.

Unlike a full virtual machine, a Linux container image ships user-space files (Python, Debian libraries, your code) and shares the host's Linux **kernel** (or Docker Desktop's Linux VM kernel on macOS and Windows WSL).[^docker2026bindmounts] Build on the `prompt-eval/` repo from [Git, Shell, and Linux for Reproducible AI](/learn/git-shell-linux-reproducible-ai), with Docker Engine or Docker Desktop running so `docker version` shows both client and server.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Four read-only container image layers (python:3.12-slim base, /opt/venv packages, scripts/score_eval.py, and eval/eval_cases.jsonl, with no Linux kernel inside the image) launch via docker run --rm into a non-root appuser container sharing the host or Desktop VM Linux kernel to print accuracy 0.667." />
  <figcaption>Read upward through the image layers, then across to the running container. The shared Linux kernel comes from the Docker Engine host or Desktop VM, and <code>--rm</code> removes the exited container while preserving the image.</figcaption>
</figure>

## Where each input lives

Not every file belongs inside `COPY`. A **Dockerfile** decides which stable inputs become immutable image layers; everything else arrives at runtime:

| Channel | Question | Repo choice |
|---|---|---|
| Base image | Which Python, OS, and CPU architecture run the code? | `python:3.12-slim-trixie` (pin by `sha256` digest and `--platform` for releases) |
| Dependencies | Which packages are installed? | Pinned, hashed `requirements.txt` (or lockfile export) copied before app code |
| Build context | Which files may the builder see? | `.dockerignore` excluding secrets, caches, weights, and virtualenvs |
| Runtime user | Which identity runs the process? | Non-root `appuser`; add writable volumes only when needed |
| Data | Where does eval data live? | Small starter set baked in; changing host datasets via **bind mount**; container caches via **named volume** |
| Secrets | How do API keys arrive? | Runtime secret file or secret manager, never `ARG`, `ENV`, or `COPY .env` |

Separating stable inputs from changing code unlocks Docker's **build cache**.[^docker2026build] Because each Dockerfile step hashes its inputs, copying `requirements.txt` and installing packages *before* copying `scripts/score_eval.py` lets every code edit reuse the cached dependency layer in milliseconds.

<figure>
  <img src="illustrations/_generated/cache_invalidation_dark.png" alt="Comparison of Dockerfile build cache reuse when editing either score_eval.py or requirements.txt. Copying and installing requirements before application code keeps the first two steps cached during code edits, whereas editing requirements.txt invalidates the installation step and all later steps." />
  <figcaption>Editing the scorer reuses the cached dependency layer. Editing <code>requirements.txt</code> invalidates the install step and every layer below it.</figcaption>
</figure>

## Start with `.dockerignore`

Before running a single `COPY`, Docker sends the **build context** (files in `.`) to the builder. Without `.dockerignore`, a local `.env`, model checkpoints, `.git/`, or `.venv/` become eligible to enter the builder or get swept up by a broad `COPY . /app`.[^docker2026build]

Create `.dockerignore` at the root of `prompt-eval/`:

```gitignore title=".dockerignore"
# .dockerignore - keep the build context tiny and secret-free
.env*
*.pem
secrets/
.git/
.github/
.venv/
.docker-lab/
__pycache__/
*.py[cod]
*.egg-info/
node_modules/
models/
*.gguf
*.safetensors
*.bin
chroma/
faiss_index/
*.db
runs/
eval_cache/
wandb/
mlruns/
.DS_Store
.idea/
.vscode/
*.swp
```

> **Common mistake:** `.gitignore` and `.dockerignore` protect completely different paths. Excluding `.env` from Git does not stop Docker from including it in the build context.

## Reuse the scorer you already tested

Keep the exact `scripts/score_eval.py` and `eval/eval_cases.jsonl` committed in the previous lesson so host and container outputs compare one-to-one. Verify your baseline outside Docker first:

```bash title="terminal"
test -f scripts/score_eval.py
test -f eval/eval_cases.jsonl
touch requirements.txt
python3 scripts/score_eval.py
```

```text title="Output" output compact
Eval cases: 3
Exact-match accuracy: 0.667 (2/3)
Eval status: pass (>= 2/3 threshold)
```

## Give the scorer its own Python environment

Start with a portable CPU image using a **two-stage Dockerfile**. Each `FROM` begins a clean stage: `builder` installs packages into `/opt/venv`, and `runtime` starts fresh from `python:3.12-slim-trixie` and copies only `/opt/venv`, the scorer, and the starter eval set. Once your project adds compiled dependencies, compilers stay in `builder` instead of bloating `runtime`.

```dockerfile title="Dockerfile"
# syntax=docker/dockerfile:1
# Tag is fine for learning. To fix base-image bytes, pin both stages by digest:
# FROM python:3.12-slim-trixie@sha256:<verified-digest> AS builder
FROM python:3.12-slim-trixie AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt /tmp/requirements.txt
# Empty requirements are fine here. Once packages appear, export every
# transitive dependency with hashes or use a lock-aware frozen install.
RUN python -m pip install --no-cache-dir --require-hashes -r /tmp/requirements.txt

FROM python:3.12-slim-trixie AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

RUN useradd --create-home --no-log-init --user-group --uid 10001 --shell /usr/sbin/nologin appuser

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=appuser:appuser scripts/score_eval.py scripts/score_eval.py
COPY --chown=appuser:appuser eval/ eval/

USER appuser

ENTRYPOINT ["python", "scripts/score_eval.py"]
```

Notice three deliberate choices in `runtime`:

- Because `runtime` starts from `python:3.12-slim-trixie` rather than `FROM builder`, it declares its own `ENV` settings and inherits only the files explicitly listed in `COPY --from=builder`. (If later packages need shared OS libraries, install them in `runtime` too.)
- `COPY --chown=appuser:appuser` gives the non-root process explicit ownership rather than defaulting to `root`.
- `ENTRYPOINT` sets the default command so `docker run` launches the scorer directly.

<details>
<summary>Deep dive: Pinning base digests, platforms, and hashed dependencies</summary>

`python:3.12-slim-trixie` selects Python 3.12 on Debian 13 (`trixie`),[^pythonimage2026][^debian2025trixie] yet tags are mutable and multi-platform: an Apple Silicon laptop pulls `linux/arm64` while an x86 CI runner pulls `linux/amd64`.[^docker2026build] For a fixed release, inspect the manifest and pin both `FROM` lines to a verified `sha256:...` digest alongside `--platform`:[^docker2026platforms]

```bash title="terminal-platform"
docker buildx imagetools inspect python:3.12-slim-trixie
docker build --platform linux/amd64 -t prompt-eval:local .
```

Similarly, once packages enter `requirements.txt`, pin every direct and transitive dependency with artifact hashes so `--require-hashes` verifies every downloaded wheel or sdist (add `--only-binary=:all:` if you want to reject source builds).[^pip2026secureinstalls] If you manage packages with `uv`, export `uv.lock` to hashed requirements or run `uv sync --locked` inside the Dockerfile so the lockfile actually drives the install step.

</details>

```checkpoint
Why does the Dockerfile copy `requirements.txt` before the scorer source?
---
Dependency installation stays in an earlier cacheable layer. Editing scorer code can then reuse the dependency layer instead of reinstalling every package.
```

## Build, run, and inspect the artifact

Run Docker's static Dockerfile checks first, then build the image (`--check` turns Dockerfile warnings into nonzero errors):[^docker2026buildchecks]

```bash title="terminal-3"
docker build --check .
docker build -t prompt-eval:local .
```

Run the image with `--read-only`. Because `PYTHONDONTWRITEBYTECODE=1` stops Python from writing `.pyc` files and the scorer only reads its dataset, it runs cleanly on an immutable root filesystem:

```bash title="terminal-4"
docker run --rm --read-only prompt-eval:local
```

```text title="Output" output compact
Eval cases: 3
Exact-match accuracy: 0.667 (2/3)
Eval status: pass (>= 2/3 threshold)
```

Inspect both the image metadata and the running process UID (expect `uid=10001(appuser)`):

```bash title="terminal-inspect-image"
docker image inspect prompt-eval:local \
  --format 'platform={{.Os}}/{{.Architecture}} user={{json .Config.User}} entrypoint={{json .Config.Entrypoint}}'
docker run --rm --read-only --entrypoint id prompt-eval:local
```

Remember that `USER appuser` limits the process inside the container, whereas anyone with access to a rootful Docker daemon still controls the host; never mount the Docker socket or unneeded host paths.[^dockerSecurity2026]

The scorer displays `0.667` rounded to three decimals, while checking the pass threshold with exact integer cross-multiplication (`matches * 3 >= total * 2`) so float rounding never flips a boundary case:

<!-- leetllm: test, output=show -->
```python title="check_score_threshold.py"
import numpy as np

preds = np.array([1, 1, 0])
targets = np.array([1, 1, 1])
matches = int(np.sum(preds == targets))
total = len(targets)
score = matches / total

print(f"score={score:.3f} ({matches}/{total})")
print("threshold_met:", matches * 3 >= total * 2)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
score=0.667 (2/3)
threshold_met: True
```
<!-- leetllm: output:end -->

## A bind mount obscures the copied eval

The baked `eval/` directory is a build-time snapshot. To score a new host dataset without rebuilding the image, attach it with a read-only **bind mount**:

```bash title="terminal-5"
docker run --rm \
  --read-only \
  --mount type=bind,source="$PWD/eval",target=/app/eval,readonly \
  prompt-eval:local
```

> **Key insight:** A bind mount at `/app/eval` completely *replaces* the image's `/app/eval` for that run rather than merging files. Prefer `--mount` over `-v`: `--mount` fails immediately if the host directory is missing, whereas `-v` silently creates an empty host directory that hides your baked data.[^docker2026bindmounts]

On Linux Engine without user-namespace remapping, numeric UID/GID permissions still apply to mounted paths: `appuser` (UID `10001`) needs execute permission on parent directories and read permission on the eval file. For container-managed writable caches, use a **named volume** and initialize its ownership for `appuser` rather than falling back to `root`.[^docker2026volumes]

## Watch an empty bind mount hide the image dataset

Verify mount shadowing safely by mounting an empty scratch directory over `/app/eval`:

```bash title="terminal-empty-mount"
mkdir -p .docker-lab/empty-eval
docker run --rm --read-only \
  --mount type=bind,source="$PWD/.docker-lab/empty-eval",target=/app/eval,readonly \
  prompt-eval:local
```

Because the host directory exists, Docker mounts it, hiding the baked `eval_cases.jsonl`. The scorer checks its `assets/` fallback, finds neither file, and exits nonzero:

```text title="Expected failure" output compact
ERROR: assets/eval_cases.jsonl missing; restore or mount the eval dataset
```

Rerun without the mount and `0.667 (2/3)` returns immediately without rebuilding.

<figure>
  <img src="illustrations/_generated/container_boundaries_dark.png" alt="Container runtime filesystem layout showing four storage channels: read-only baked image layers for code and /opt/venv, a read-only bind mount at /app/eval that shadows baked data with host batches, a writable named volume for cached model weights, and an ephemeral runtime secret file at /run/secrets/eval_api_key excluded from image layers." />
  <figcaption>Separate runtime state by lifetime: immutable code in image layers, swappable eval sets in a read-only bind mount, persistent caches in a named volume, and credentials in runtime secret files.</figcaption>
</figure>

| Change | Outcome | Why |
|---|---|---|
| Rename `eval/eval_cases.jsonl` on the host | scorer fails with missing file | read-only mount shadows the image's `/app/eval` |
| Rename the host `eval/` directory | `--mount` fails before startup | explicit `--mount` refuses to create missing host paths |
| Remove `requirements.txt` from context | `docker build` fails at `COPY` | builder can copy only files present in the build context |
| Add `env_file: .env` before creating `.env` | Compose fails at startup | `env_file` entries are required unless marked optional |
| Run on Linux without Compose plugin | `docker compose` unknown | Engine and `docker-compose-plugin` install separately |

## Check in one Compose file

Once your stack grows beyond one container (say adding a <span data-glossary="vector">vector</span> store or <span data-glossary="rag">RAG</span> API), checking in `compose.yaml` gives every teammate the same build and mount configuration. Start with the scorer alone (omit the obsolete top-level `version:` key):

```yaml title="compose.yaml"
services:
  scorer:
    build:
      context: .
      dockerfile: Dockerfile
    image: prompt-eval:local
    read_only: true
    volumes:
      - type: bind
        source: ./eval
        target: /app/eval
        read_only: true
        bind:
          create_host_path: false
```

`create_host_path: false` matches `--mount`'s refusal to auto-create a missing host directory, while `read_only: true` locks down both the root filesystem and the mounted dataset.[^docker2026composeservices] Validate the YAML and run with `--build` so source edits rebuild the image instead of reusing a stale tag:

```bash title="terminal-6"
if docker compose version >/dev/null 2>&1; then
  docker compose config --quiet
  docker compose run --build --rm scorer
else
  echo "Docker Compose plugin missing. Install docker-compose-plugin before using compose."
fi
```

## Keep credentials out of image layers

<span data-glossary="least-privilege">Least privilege</span> starts with passing zero secrets to a scorer that does not call an API. When a future build needs a private package index, never pass the <span data-glossary="token">token</span> with `ARG` or `ENV`: `ENV` persists into runtime config, and `ARG` values still show up in `docker history` and build metadata.

```dockerfile title="Dockerfile-2"
# BAD: ARG values appear in image history and build attestations
ARG PRIVATE_INDEX_TOKEN
RUN python -m pip install --index-url "https://token:${PRIVATE_INDEX_TOKEN}@packages.example.invalid/simple" private-package
```

Instead, use a BuildKit **secret mount**, which exposes the credential file only during that single `RUN` step and never commits it to the layer (still keep commands from echoing or copying it elsewhere):[^docker2026buildsecrets]

```dockerfile title="Dockerfile (builder-stage fragment)"
RUN --mount=type=secret,id=pip_config,target=/etc/pip.conf,required=true \
    python -m pip install --require-hashes -r /tmp/requirements.txt
```

```bash title="terminal-7"
docker build \
  --secret id=pip_config,src="$HOME/.config/pip/pip.conf" \
  -t prompt-eval:private .
```

For runtime API keys, avoid ordinary <span data-glossary="environment-variable">environment variables</span> (which leak easily into `docker inspect` and crash logs). Mount a Compose secret file at `/run/secrets/eval_api_key` locally (or use your cloud platform's secret manager in production) and keep `secrets/` and `.env*` in both `.gitignore` and `.dockerignore`:[^docker2026composesecrets]

```yaml title="compose-secret-fragment.yaml"
services:
  scorer:
    secrets:
      - eval_api_key

secrets:
  eval_api_key:
    file: ./secrets/eval_api_key.txt
```

```checkpoint
Why shouldn't an API key enter through `COPY`, `ARG`, `ENV`, or an ordinary runtime environment variable?
---
`COPY` and `ENV` can persist the key in image content or config. `ARG` is not passed into the running container environment, yet its value can still be inspected via image history and build attestations. Runtime environment values can show up in container configuration and diagnostics. A runtime secret file or platform secret manager limits exposure to the process that needs it, while a BuildKit secret mount handles credentials needed only during the build.
```

## When the GPU enters the story

Keep the CPU image for everyday local development across Linux, macOS, and Windows. When a later <span data-glossary="pytorch">PyTorch</span> workload needs NVIDIA <span data-glossary="cuda">CUDA</span> inside Linux Docker Engine, the host keeps the kernel driver, the NVIDIA Container Toolkit exposes driver libraries and devices to the container, and the image supplies the framework and CUDA runtime libraries.[^nvidiaContainerToolkit2026]

| Dimension | CPU evaluator now | GPU workload later |
|---|---|---|
| Base image | `python:3.12-slim-trixie` | official PyTorch CUDA or NVIDIA CUDA runtime image matched to your torch wheel |
| Runtime check | scorer prints `0.667` | `python -c "import torch; assert torch.cuda.is_available()"` |
| Run command | `docker run prompt-eval:local` | `docker run --gpus all ...` (add `--shm-size` if DataLoader workers need it) |
| Host requirement | Docker Engine or Desktop | NVIDIA GPU + host driver + NVIDIA Container Toolkit (or WSL2 GPU on Windows[^docker2026desktopgpu]) |

On a systemd Linux host, configure the runtime and run NVIDIA's minimal `ubuntu` <span data-glossary="smoke-test">smoke test</span> to check device visibility independently of any PyTorch image:[^nvidiaSampleWorkload2026]

```bash title="terminal-8"
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
sudo docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
```

Diagnose GPU failures top-down in three layers:

| Observation | Component to check next |
|---|---|
| `nvidia-smi` fails on host | host NVIDIA driver |
| Host `nvidia-smi` works, container smoke test fails | NVIDIA Container Toolkit and Docker runtime config |
| Container `nvidia-smi` works, `torch.cuda.is_available()` is false | PyTorch wheel CUDA version, driver minimum version, or `CUDA_VISIBLE_DEVICES` |

Note that Docker Desktop on Apple Silicon runs Linux CPU containers, not NVIDIA CUDA; use the native Metal/MPS path on Mac and test CUDA containers on Linux NVIDIA hosts.

## Combine the checks in a CI script

Bundle the static check, build, image-ID capture, and both baked and mounted dataset runs into `scripts/check_container.sh` so local verification and CI run the exact same command:

```bash title="terminal-9"
#!/usr/bin/env bash
set -euo pipefail

docker build --check .
docker build -t prompt-eval:check .
image_id=$(docker image inspect --format '{{.Id}}' prompt-eval:check)
expected_report=$(cat <<'EOF'
Eval cases: 3
Exact-match accuracy: 0.667 (2/3)
Eval status: pass (>= 2/3 threshold)
EOF
)
baked_report=$(docker run --rm --read-only "$image_id")
mounted_report=$(docker run --rm \
  --read-only \
  --mount type=bind,source="$PWD/eval",target=/app/eval,readonly \
  "$image_id")
if [[ "$baked_report" != "$expected_report" ]]; then
  printf '%s\n' "ERROR: baked eval report changed" "$baked_report" >&2
  exit 1
fi
if [[ "$mounted_report" != "$expected_report" ]]; then
  printf '%s\n' "ERROR: mounted eval report changed" "$mounted_report" >&2
  exit 1
fi
printf '%s\n' "$baked_report" "Verified local image: $image_id"
if docker compose version >/dev/null 2>&1; then
  docker compose config --quiet
else
  echo "Docker Compose plugin missing. Install docker-compose-plugin before enabling the Compose check."
fi
```

Running both the baked and mounted paths ensures a valid host file never masks a broken image copy. Pinning both runs to the captured `$image_id` prevents a concurrent re-tag of `prompt-eval:check` from changing which image gets tested. Before deploying to production, push the tested image and promote its registry-reported `repository@sha256:...` digest rather than reconstructing a reference from a local image ID.[^dockerImageIdentity2026]

Notice the difference between the scorer's pass rule (`>= 2/3`, so `3/3` also exits `0`) and the script's exact string check (`expected_report`): if you deliberately improve a prediction in `eval/eval_cases.jsonl`, update `expected_report` alongside it.

## Failures you'll see first

| Symptom | Likely cause | Fix that belongs in the repo |
|---|---|---|
| `ModuleNotFoundError` in container | package missing from `requirements.txt` | add pinned hash to `requirements.txt`, rebuild |
| `.env` enters build context | `.dockerignore` omitted `.env*` | add `.env*`, rotate exposed key, rebuild and inspect history |
| `Permission denied` on mounted dir | `appuser` lacks UID/GID access | fix host file mode or initialize named volume ownership |
| Every code edit reinstalls packages | `COPY . /app` precedes `pip install` | copy `requirements.txt` and install before copying app code |
| `could not select device driver with capabilities: [[gpu]]` | runtime lacks NVIDIA GPU support | check Container Toolkit config; keep CPU scorer working |
| Cloud Run starts without config | relied on local `.env` file | declare non-secret env vars and bind Secret Manager for keys |

## What survives a fresh clone

Commit `Dockerfile`, `.dockerignore`, `requirements.txt`, `compose.yaml`, and `scripts/check_container.sh` alongside `scripts/score_eval.py` and `eval/eval_cases.jsonl`, then run `bash scripts/check_container.sh` inside a fresh temporary clone. When promoting a release image, pin base digests and target platform, lock dependencies, and promote the single tested registry digest rather than rebuilding on every machine.

```mastery-quiz
[
  {
    "question": "A verified release index contains amd64 member A and arm64 member B. Both an Arm laptop and x86 CI explicitly build and test with --platform linux/arm64. The required deployment target is amd64, and these are the only recorded runs. Which tested member and deployment-evidence gap follow?",
    "options": [
      "Both recorded runs tested A; the required deployment member is already covered.",
      "Both recorded runs tested B; the required deployment member A remains untested.",
      "The Arm run tested B and x86 run tested A; the required deployment member is covered.",
      "The Arm run tested A and x86 run tested B; the required deployment member remains untested."
    ],
    "answer": "Both recorded runs tested B; the required deployment member A remains untested.",
    "explanation": "The explicit arm64 target selects member B on both builders, including an x86 builder using suitable emulation or another arm64 build mechanism. Their native host types do not override that target. The recorded executions therefore leave deployment platform A untested."
  },
  {
    "question": "A builder adds a helper at `/tools/check` and sets `ENV CHECK_MODE=strict`. Its base image has neither. Runtime A starts `FROM builder`. Runtime B starts from the original base and copies only `/job/run.sh` from the builder. The script calls `/tools/check`. Which images contain the helper, and which define `CHECK_MODE`?",
    "options": [
      "A has only the helper. B has neither item.",
      "A has both items. B has only the helper.",
      "A has only the helper. B has only the helper.",
      "A has both items. B has neither item."
    ],
    "answer": "A has both items. B has neither item.",
    "explanation": "A inherits the builder's files and image settings, so it has both `/tools/check` and `CHECK_MODE`. B keeps the environment of its original base. Its copy of `run.sh` contains the path `/tools/check`, but the helper itself lives in a separate file outside the copy."
  },
  {
    "question": "A local secret is excluded by .gitignore but not .dockerignore. The Dockerfile copies only the scorer and requirements, and no instruction reads the secret. Classify eligibility for the Docker build context and whether those selected COPY instructions bake the secret. This asks about the eligible file set, not which unused bytes BuildKit actually transfers.",
    "options": [
      "Eligible context includes secret: yes; selected COPY bakes secret: no.",
      "Eligible context includes secret: no; selected COPY bakes secret: no.",
      "Eligible context includes secret: yes; selected COPY bakes secret: yes.",
      "Eligible context includes secret: no; selected COPY bakes secret: yes."
    ],
    "answer": "Eligible context includes secret: yes; selected COPY bakes secret: no.",
    "explanation": "Git exclusions do not provide Docker context exclusions. The secret remains eligible to the builder, but the selected COPY instructions omit it. BuildKit can avoid transferring unused files, so eligibility does not mean this unread secret’s bytes were transmitted. An explicit .dockerignore rule narrows the permitted context itself."
  },
  {
    "question": "An unchanged install command consumes requirements.txt with --require-hashes. A developer edits only an unused lockfile. In a separate clean install with --no-cache-dir and --require-hashes, pip downloads a wheel directly from the package index. Its version matches the pin, but its hash is absent from the approved list. Which paired interpretation is correct?",
    "options": [
      "The unused lock changes the resolved dependencies; the matching version permits the offered wheel hash.",
      "The unused lock leaves the pip install spec unchanged; the matching version permits the offered wheel hash.",
      "The unused lock leaves the pip install spec unchanged; the absent approved hash rejects the offered wheel.",
      "The unused lock changes the resolved dependencies; the absent approved hash rejects the offered wheel."
    ],
    "answer": "The unused lock leaves the pip install spec unchanged; the absent approved hash rejects the offered wheel.",
    "explanation": "The command reads requirements.txt rather than the unused lockfile. Version equality does not make a downloaded artifact’s bytes an approved hash. A reviewed export or a frozen lock-aware install must connect a lock to the actual dependency operation."
  },
  {
    "question": "Two read paths use one image ID and the exact two-thirds threshold. The first batch has 6 matches among 8 rows; the second has 5 among 8. Which threshold results follow from the integer check?",
    "options": [
      "First fails; second passes.",
      "First passes; second fails.",
      "First passes; second passes.",
      "First fails; second fails."
    ],
    "answer": "First passes; second fails.",
    "explanation": "Compare matches×3 with total×2. The two sides are 18/16 and 15/16. A threshold differs from an exact reference report; the scorer’s threshold does not require exactly three rows or equality to rounded 0.667."
  },
  {
    "question": "A fresh absolute host directory does not exist. First, a -v bind run creates it as an empty directory and exits with --rm. Nothing changes the host directory afterward. A second run uses the default explicit --mount form at that same source. Where do the two missing-file failures occur?",
    "options": [
      "First before scorer launch; second before scorer launch.",
      "First inside the scorer; second before scorer launch.",
      "First before scorer launch; second inside the scorer.",
      "First inside the scorer; second inside the scorer."
    ],
    "answer": "First inside the scorer; second inside the scorer.",
    "explanation": "The -v bind form creates the absent source as an empty host directory. It hides the baked eval file, so the first run fails. Removing that container does not delete the host directory. The later explicit --mount therefore sees an existing empty source, launches, and reaches the same scorer-level missing-file failure."
  },
  {
    "question": "A Compose service named `checker` has `build: .`, `read_only: true`, and `volumes: [\"./batches:/input\"]`. It runs `/app/check.py`, which the Dockerfile copies into the image. You edit the script after the last build. Host permissions let the service user read the batch and create files in `./batches`. After `docker compose config --quiet` succeeds, which run will test the edit, and does the mount permit the script to create `/input/checked`?",
    "options": [
      "Rebuild and run the service. The mount permits the write.",
      "Run the existing image. The mount blocks the write.",
      "Run the existing image. The mount permits the write.",
      "Rebuild and run the service. The mount blocks the write."
    ],
    "answer": "Rebuild and run the service. The mount permits the write.",
    "explanation": "The existing image still holds the old script. Compose validated the configuration. Run `docker compose run --build --rm checker` to copy the edit into the image and exercise it on the batch. The service setting protects the root filesystem. The bind at `/input` defaults to read-write because its entry omits `:ro`. The host permissions allow the script to create the file there."
  },
  {
    "question": "A build uses a temporary secret mount, but its command copies the secret into /app/debug.txt before the step finishes. A later layer deletes debug.txt. Which credential and output conclusions follow?",
    "options": [
      "The earlier copy is absent from image layers because the source arrived through a temporary secret mount.",
      "The earlier copy is erased from image layers because the last visible filesystem no longer contains debug.txt.",
      "The earlier copy remains in an image layer because the command created an output file before committing that layer.",
      "The earlier copy becomes runtime ENV metadata because a deleted build-secret output is stored as configuration."
    ],
    "answer": "The earlier copy remains in an image layer because the command created an output file before committing that layer.",
    "explanation": "The mount keeps its own temporary file out of the committed layer, but it cannot prevent the consuming command from writing secret bytes elsewhere. A later visible deletion does not erase the earlier layer. Avoid real-key experiments and keep credentials out of logs and output artifacts."
  },
  {
    "question": "On a rootful Linux Engine without user-namespace remapping, a worker runs as UID 4200. A read-write bind mounts the host directory `./reports` at `/out`. The directory has mode 0755 and owner UID 1700. Creating `/out/summary` fails with `Permission denied`. On the same host, `nvidia-smi` lists a GPU, but Docker rejects a plain Ubuntu container's `--gpus all` request before startup. Where should you grant the worker write access, and what should you check first for the GPU failure?",
    "options": [
      "Grant access to `/out` in the image. Check how the NVIDIA container runtime exposes devices.",
      "Grant access to `./reports` on the host. Check how the NVIDIA container runtime exposes devices.",
      "Grant access to `./reports` on the host. Check the PyTorch build in the worker image.",
      "Grant access to `/out` in the image. Check the PyTorch build in the worker image."
    ],
    "answer": "Grant access to `./reports` on the host. Check how the NVIDIA container runtime exposes devices.",
    "explanation": "The bind hides the image's `/out` directory. Mode 0755 grants write access to the owner, UID 1700. UID 4200 can enter that host directory but needs write access there to create the report. The host sees the GPU, but Docker cannot start the Ubuntu probe with the requested device. Check the NVIDIA Container Toolkit and Docker runtime configuration. The worker's PyTorch package plays no part in that probe."
  },
  {
    "question": "A CI script captures local image ID L and passes L to both run commands. The baked and mounted runs each print the expected report. The mutable tag later points elsewhere, and no verified repository digest has been recorded. What has actually been tested, and what is still needed for deployment?",
    "options": [
      "Both runs exercised the later tag target; deploy that tag because its reassignment preserves the captured test identity.",
      "Both runs exercised L; construct repository@L from the local ID because local success confirms that registry location.",
      "Both runs exercised L; rebuild on the destination because a repeated recipe preserves that exact tested image artifact.",
      "Both runs exercised L; obtain its verified registry repository digest and intended platform before promoting the artifact."
    ],
    "answer": "Both runs exercised L; obtain its verified registry repository digest and intended platform before promoting the artifact.",
    "explanation": "Using the captured ID protects local test identity from later tag reassignment. It does not confirm a repository location or registry digest. Verify push/pull identity and platform; do not invent a registry reference from a local ID or replace exact artifact promotion with an unverified rebuild."
  }
]
```

> **Next:** Continue to [Python for AI Engineering](/learn/python-for-ai-engineering). With the runtime packaged, you can focus on the program itself: parsing rows, validating fields, and using integer counts to decide whether a check passes.
