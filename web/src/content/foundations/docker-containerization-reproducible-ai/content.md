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

A teammate clones `prompt-eval`, finds the three <span data-glossary="eval-row">evaluation cases</span> in `eval/eval_cases.jsonl` alongside `scripts/score_eval.py`, and still cannot reprint `0.667`. Their Python version, OS packages, or filesystem permissions differ from yours. Git carried the files. It didn't pin how they run.

The evaluation script compares each predicted label against its reference label. Two matches out of three give `2/3`, displayed as `0.667`. Nothing about that calculation should depend on a teammate's Python setup.

<span data-glossary="docker">Docker</span> packages Python, its dependencies, and application files in a <span data-glossary="container-image">container image</span>, the stored artifact produced by `docker build`. Its filesystem is assembled from reusable layers. A <span data-glossary="container">container</span> is an isolated instance of that image, created by `docker run`. Ours runs one scorer process; other applications may start child processes too.

When the scorer exits, `--rm` removes the stopped container and its writable layer. The image remains available for another run.

The **kernel** is the operating system component that manages processes, memory, and devices. A Linux image packages application code and user-space tools, including Python and Debian libraries, but no kernel. Containers share the Linux kernel of the machine running Docker Engine. With Docker Desktop's Linux containers, that machine is a Linux virtual machine (VM), so a Mac container uses the VM's Linux kernel.[^docker2026bindmounts]

Build on the `prompt-eval/` repository layout from [Git, Shell, and Linux for Reproducible AI](/learn/git-shell-linux-reproducible-ai). Run the commands in a Bash-compatible terminal with Docker Engine running, or Docker Desktop set to Linux containers. On Windows, use a WSL terminal. `docker version` should show both a client and a server; a client alone can't build or run an image.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Four read-only container image layers (python:3.12-slim base, /opt/venv packages, scripts/score_eval.py, and eval/eval_cases.jsonl, with no Linux kernel inside the image) launch via docker run --rm into a non-root appuser container sharing the host or Desktop VM Linux kernel to print accuracy 0.667." />
  <figcaption>Read upward through the image layers, then across to the running container. The shared Linux kernel comes from the Docker Engine host or Desktop VM, and <code>--rm</code> removes the exited container while preserving the image.</figcaption>
</figure>

## Where each input lives

The scorer needs Python and its own files every time. The eval data may change between runs, and future API keys shouldn't travel with the image at all. A **Dockerfile** is the build recipe; it chooses which inputs become part of the image. The rest arrive when a container starts:

| Channel | Question | Repo choice |
|---|---|---|
| Base image | Which Python, OS, and CPU architecture run the code? | A version-constrained <span data-glossary="container-image">base image</span> such as `python:3.12-slim-trixie`; add a digest and an explicit target platform when a release needs a fixed artifact |
| Dependencies | Which packages are installed? | A checked-in lock or fully pinned, hashed requirements file copied before application code |
| Build context | Which files may the builder read? | `.dockerignore` that excludes secrets, caches, model weights, and virtualenvs |
| Runtime user | Which identity runs the process? | A non-root user; add a named volume or temporary filesystem only when it must write |
| Data | Where does eval data live? | Small starter sets can be copied into the image; changing host datasets use a bind mount, and container-managed caches use named volumes |
| Secrets | How does an API key arrive? | A runtime secret file or platform secret manager, never `ARG`, `ENV`, or `COPY .env` |

Don't solve every placement with `COPY`. A **bind mount** exposes a specific host path inside a container. A **named volume** is storage Docker manages, which suits caches or state that should outlive one container without depending on a teammate's directory layout.

Build-time and run-time inputs also have different lifetimes. Stable inputs become image layers. Run-specific data and configuration join only when a container starts, and Docker can reuse an earlier layer when its inputs didn't change.[^docker2026build]

Suppose you fix a line in the scorer but leave its packages alone. Docker should reuse the installed packages and rebuild only the application-dependent steps. That reuse is the **build cache**:

<figure>
  <img src="illustrations/_generated/cache_invalidation_dark.png" alt="Comparison of Dockerfile build cache reuse when editing either score_eval.py or requirements.txt. Copying and installing requirements before application code keeps the first two steps cached during code edits, whereas editing requirements.txt invalidates the installation step and all later steps." />
  <figcaption>Both traces start from the same base image. For the scorer edit, Docker can reuse the cached dependency installation. For the requirements edit shown here, the builder has no cached result for the new inputs, so it installs the packages again and rebuilds the dependent steps.</figcaption>
</figure>

Copy `requirements.txt` before the scorer so a code edit can reuse the package installation. An edit to the requirements changes the installation key. If you later restore an earlier file and its other inputs, Docker can reuse the matching cached result. The Dockerfile below separates installation and execution into stages while preserving that dependency order.

## Start with `.dockerignore`

The build context is the first filter before any `COPY` step runs. If `prompt-eval/` holds a model cache, a local vector index, and `.env`, `docker build .` passes all of those paths to the builder unless you exclude them explicitly.

Create `.dockerignore` at the root of `prompt-eval/`, next to `.gitignore`:

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

Docker removes matching paths before it sends the build context to the builder. Without that filter, `.env`, cached model files, local indexes, notebooks, and virtualenvs can reach a local or remote builder even when the Dockerfile never meant to copy them. A later broad `COPY . /app` can also bake them into a layer.[^docker2026build]

Build context and image contents aren't the same thing. Context is everything the builder is allowed to read; `COPY` and `ADD` decide which of those files become layers. If a path matches `.dockerignore`, it never enters the context. Now choose which of the remaining files the scorer actually needs.

## Reuse the scorer you already tested

The previous chapter committed `scripts/score_eval.py` and `eval/eval_cases.jsonl`. Package those same files so container output matches your host run directly. A second scorer would add another possible cause of a changed result.

The evaluation script falls back to `assets/eval_cases.jsonl` when `eval/` is missing. Copying `eval/` into the image is enough for the primary path, so you don't need `assets/` in the image. `requirements.txt` can stay empty until the scorer gains third-party packages.

Check that you're in the project root, create the empty dependency file if needed, and run the scorer once outside Docker:

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

That output is the baseline the image must reproduce. Both the evaluation script and starter cases stay unchanged. The image has to pin which Python actually runs them, so a teammate's laptop stops being part of the result.

## Give the scorer its own Python environment

Start with a CPU image. The three-row scorer doesn't need a <span data-glossary="gpu">GPU</span>, so verify the container workflow on a standard CPU machine before adding NVIDIA runtime setup.

Each `FROM` starts a **build stage**, a separate filesystem based on the named image. The first stage installs packages into a **virtual environment**, a directory containing a Python environment isolated from other packages. The second copies that environment and runs the scorer. This two-stage pattern becomes useful when installation needs compilers or other tools that the running application doesn't need. Our empty dependency file doesn't need those tools yet, so two stages aren't inherently smaller here.

Create this `Dockerfile`:

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

Read the runtime stage from top to bottom. `WORKDIR /app` sets the directory for later relative paths. `COPY --from=builder` transfers the installed environment, while the next two `COPY` instructions bring in the evaluation script and starter dataset. `USER appuser` selects the identity for the running process. `ENTRYPOINT` supplies its default command, so `docker run` doesn't need to repeat the Python filename.

Both stages use the same base image and `/opt/venv` path to keep the copied environment compatible. If later packages need shared OS libraries, those libraries must also exist in the runtime stage. Copying a virtual environment alone doesn't copy every system dependency.

Here the runtime stage starts from `python:3.12-slim-trixie`, so it declares its own `PATH`, bytecode, and buffering settings. It doesn't inherit the builder's `ENV` settings. A stage based on `FROM builder` would inherit them. Likewise, installing a compiler in this builder doesn't install it in this runtime. `COPY --from=builder` transfers only the selected files.

`COPY` defaults to root ownership. Root-owned files with world-readable permissions can still be read by `appuser`, but `COPY --chown=appuser:appuser` makes ownership explicit and avoids permission failures when files have restrictive modes or the application later needs to write its own files.

| Dockerfile section | Purpose |
|---|---|
| `builder` stage | installs packages once into a reusable virtualenv |
| `runtime` stage | runs only the existing evaluation script, starter dataset, and installed environment |

The official Python image manifest maps `python:3.12-slim-trixie` to the Python 3.12 line on Debian 13 (`trixie`).[^pythonimage2026][^debian2025trixie] That constrains the Python minor line and Debian release, but it doesn't pin exact bytes. Image tags are mutable, so a later rebuild can pick up a new Python patch or rebuilt OS packages.[^docker2026build]

Dependency pins need the same care. `package==1.2.3` fixes a version, but an installer may still choose among wheels (prebuilt packages) and source archives. A hash identifies an allowed downloaded artifact. For a release, export all dependencies, including dependencies of dependencies, with hashes and keep `--require-hashes`. Alternatively, use a package-manager <span data-glossary="dependency-lockfile">lockfile</span> with its frozen install command. An empty `requirements.txt` passes because there are no packages to verify. When this install command downloads a wheel or source archive, pip checks its hash against the approved list. An already installed package can satisfy a requirement without a download or hash check. Account for preinstalled packages when you verify a release environment.[^pip2026secureinstalls]

A lockfile affects this image only if its install step consumes it. Merely copying a future `uv.lock` into the context won't change this pip command. Keep one reviewed dependency source for the image, or explicitly export the lock to the hashed requirements this Dockerfile reads. Hashing a source archive also doesn't lock the tools that compile it. For a wheel-only release, `--only-binary=:all:` rejects source builds, but it will fail when no compatible wheel exists for the target platform.[^pip2026secureinstalls]

`python:3.12-slim-trixie` is a multi-platform tag. Docker normally selects the variant that matches the host. An Apple Silicon laptop can build `linux/arm64` while an x86 CI worker builds `linux/amd64`. Those are compatible recipes, not identical image bytes. Check which CPU architecture your target server uses, inspect the available image manifests, and pass `--platform` when building for another host:

```bash title="terminal-platform"
docker buildx imagetools inspect python:3.12-slim-trixie
docker build --platform linux/amd64 -t prompt-eval:local .
```

For a fixed release, copy a verified `sha256:...` digest from the inspection into both `FROM` lines. A **digest** identifies content, unlike a tag that can be reassigned. A multi-platform index digest fixes a set of platform variants; a platform manifest digest fixes one variant. Keep `--platform` in the build command to select the intended architecture. Emulating `linux/amd64` on an Arm laptop can be much slower than a native build, especially when packages compile code.[^docker2026platforms]

Once that target is explicit, cache behavior becomes easier to reason about. A change to `requirements.txt` gives Docker a different dependency cache key. It checks for a matching result prior to executing the installation. Editing only `scripts/score_eval.py` leaves the dependency cache key intact because the Dockerfile installs requirements first.

```checkpoint
Why does the Dockerfile copy `requirements.txt` before the scorer source?
---
Dependency installation stays in an earlier cacheable layer. Editing scorer code can then reuse the dependency layer instead of reinstalling every package.
```

## Build, run, and inspect the artifact

From the project root, check the Dockerfile and then build the artifact. The first command reports Dockerfile findings without producing an image; the second creates the tagged image. The final `.` selects the current directory as the build context, and `-t` gives the image its local name.

```bash title="terminal-3"
docker build --check .
docker build -t prompt-eval:local .
```

`docker build --check` exits nonzero when a check reports a finding. A regular build can report those findings as warnings, so running the check separately makes the policy explicit.[^docker2026buildchecks]

Run the image without any host mount first. Because the evaluator only reads its input file and the Dockerfile disables `.pyc` writes via `PYTHONDONTWRITEBYTECODE=1`, passing `--read-only` works without errors and preserves the same output:

```bash title="terminal-4"
docker run --rm --read-only prompt-eval:local
```

Expected output:

```text title="Output" output compact
Eval cases: 3
Exact-match accuracy: 0.667 (2/3)
Eval status: pass (>= 2/3 threshold)
```

Inspect the artifact as well as its stdout:

```bash title="terminal-inspect-image"
docker image inspect prompt-eval:local \
  --format 'platform={{.Os}}/{{.Architecture}} user={{json .Config.User}} entrypoint={{json .Config.Entrypoint}}'
```

The platform should match the build target, the configured user should be `appuser`, and the entrypoint should name the scorer. A successful `--read-only` run shows that this execution can finish without writing to its root filesystem. Different inputs or a later workload may require writable storage. `PYTHONDONTWRITEBYTECODE=1` keeps Python from trying to write `.pyc` files when that filesystem is read-only.

Inspect the process identity separately from the host user who launches Docker. Overriding the entrypoint lets us run one diagnostic command without changing the image:

```bash title="terminal-inspect-user"
docker run --rm --read-only --entrypoint id prompt-eval:local
```

Expect `uid=10001(appuser)`. The group number is chosen when `useradd` creates the group, so don't assume it also equals 10001. On a normal Linux Engine without user-namespace remapping, numeric ownership controls access to bind-mounted files. Rootless engines and Docker Desktop can map identities differently. The mounted-path check belongs to that host setup.

`USER appuser` constrains the Python process inside the container, not anyone who controls the Docker daemon itself. Access to a rootful daemon still grants host-level privileges, and a writable bind mount can modify whichever host files UID permissions allow. Keep the Docker socket and unrelated host paths unmounted; container user isolation, daemon access, and mount permissions operate as independent layers.[^dockerSecurity2026]

Printed accuracy rounds to three decimals, whereas the pass check uses exact integer cross-multiplication (`matches * 3 >= total * 2`) rather than float equality against `0.667`:

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

A passing run confirms that the image reads its copied starter dataset cleanly. Editing the host's `eval/` won't change those copied files: they're a snapshot from build time. A bind mount lets us supply new data without rebuilding the scorer.

Run the image against host data:

```bash title="terminal-5"
docker run --rm \
  --read-only \
  --mount type=bind,source="$PWD/eval",target=/app/eval,readonly \
  prompt-eval:local
```

A bind mount at `/app/eval` obscures the image's copied files for that run. Docker doesn't merge the two directories. `--mount` is the better default here because it fails when the host source path is missing. `-v` can silently create a missing source as an empty directory. If the score changes, compare the mounted evaluation file with the committed starter set before changing the image.[^docker2026bindmounts]

The source path must exist where the Docker daemon runs. Docker Desktop handles sharing your local project into its Linux virtual machine. With a remote daemon or another VM setup, a path that exists in your terminal may still be unavailable to Docker; check file sharing before changing the scorer.

The mount is read-only from inside the container, but file permissions still apply. `appuser` must have execute permission on parent directories and read permission on the evaluation file. For writable data, a named volume removes the dependency on a particular host path, not the need for correct ownership. Initialize its directory for the application's user, or document the numeric user and group IDs (UID/GID) required on a bind-mounted path. Switching to root hides that setup problem.[^docker2026volumes]

## Watch an empty bind mount hide the image dataset

You can test mount shadowing safely without modifying any committed files by mounting an empty scratch directory over `/app/eval`. Because the mount completely shadows the image directory rather than merging with it, Python will no longer see the copied dataset:

```bash title="terminal-empty-mount"
mkdir -p .docker-lab/empty-eval
docker run --rm --read-only \
  --mount type=bind,source="$PWD/.docker-lab/empty-eval",target=/app/eval,readonly \
  prompt-eval:local
```

The scorer should fail with a missing-file error and a nonzero exit status. Because the source directory exists, Docker can create the mount. Python then looks for `eval_cases.jsonl` inside the empty mount and cannot see the baked copy underneath it. The image doesn't contain the scorer's `assets/` fallback either. Rerun without the mount and `0.667 (2/3)` should return without rebuilding anything.

The error names the fallback path because the script checks `assets/` after failing to find `eval/eval_cases.jsonl`:

```text title="Expected failure" output compact
ERROR: assets/eval_cases.jsonl missing; restore or mount the eval dataset
```

<figure>
  <img src="illustrations/_generated/container_boundaries_dark.png" alt="Container runtime filesystem layout showing four storage channels: read-only baked image layers for code and /opt/venv, a read-only bind mount at /app/eval that shadows baked data with host batches, a writable named volume for cached model weights, and an ephemeral runtime secret file at /run/secrets/eval_api_key excluded from image layers." />
  <figcaption>Each category of runtime state belongs on its own storage channel: immutable application layers in the image, swappable evaluation sets on a read-only bind mount, persistent caches in a named volume, and API tokens in ephemeral runtime secrets.</figcaption>
</figure>

Compare that failure with other small changes:

| Change | Outcome | Why |
|---|---|---|
| Rename `eval/eval_cases.jsonl` on the host | mounted run fails with a missing file | the read-only mount replaces the image's `/app/eval` directory |
| Rename the host `eval/` directory | `--mount` rejects the missing source path | explicit bind mounts don't create missing host directories by default |
| Remove `requirements.txt` from the build context | build fails at the `COPY requirements.txt` step | Docker can copy only files that exist in the context |
| Add `env_file: .env` to Compose before creating `.env` | Compose reports the missing env file | `env_file` entries are required unless marked optional |
| Run on a machine without Docker Compose | `docker compose version` is unknown | Docker Engine and the Compose CLI plugin are separate on some Linux installs |

The distinction saves a rebuild: a missing host path is a mount problem, while a missing file inside an existing mount is an input-data problem.

## Check in one Compose file

For one service, `docker run` is enough. As soon as the project adds a <span data-glossary="vector">vector</span> database, API, worker, or model cache, one checked-in Compose file gives each engineer the same starting command and mount policy. Add only the scorer that exists today.

Start with a runnable `compose.yaml` for the scorer:

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

`create_host_path: false` preserves the missing-directory failure we chose with `docker run --mount`. Compose otherwise creates a missing bind source directory by default. `read_only: true` on the service protects its root filesystem; the second `read_only` protects the separate data mount.[^docker2026composeservices]

Validate the file prior to executing it:

```bash title="terminal-6"
if docker compose version >/dev/null 2>&1; then
  docker compose config --quiet
  docker compose run --build --rm scorer
else
  echo "Docker Compose plugin missing. Install docker-compose-plugin before using compose."
fi
```

Docker Desktop includes Compose. Some Linux Engine installs need the `docker-compose-plugin` package first; follow Docker's [plugin installation instructions](https://docs.docker.com/compose/install/linux/). If `docker compose version` is unknown, the Dockerfile still works through `docker run`, but the Compose workflow isn't installed yet.

Omit the obsolete top-level [`version:` field](https://docs.docker.com/reference/compose-file/version-and-name/). Docker's [Compose file reference](https://docs.docker.com/compose/intro/compose-application-model/#the-compose-file) names `compose.yaml` as the preferred filename and retains `docker-compose.yml` for compatibility. Use the current `docker compose` command.

`docker compose config --quiet` validates and resolves configuration without starting a container; it doesn't prove the scorer works or that its mount is readable. `docker compose run --build --rm scorer` first builds the service image, then creates a one-off container. `--build` matters after a source edit because an existing tag may still point at an older image. `--rm` removes the container after the scorer exits, while the image remains available.

As the <span data-glossary="rag">RAG</span> stack gains real services, add their images, commands, and mounts to this same file. Until then, keep the scorer as the only service so another engineer can run the file as written.

## Keep credentials out of image layers

The scorer doesn't need an API key yet, so don't give it one. <span data-glossary="least-privilege">Least privilege</span> starts by attaching no secret to a process that doesn't use it. When a future build needs private-package access, separate that short build lifetime from the runtime secret a process reads later.

When a build must authenticate to a private package index, don't pass the credential with `ARG` or `ENV`. `ARG` isn't copied into the running container the way `ENV` is, but it still isn't safe. The [Dockerfile reference](https://docs.docker.com/reference/dockerfile/#arg) warns that build-arg values appear in `docker history` and detailed image build metadata.

This bad pattern puts the <span data-glossary="token">token</span> in a build argument. Don't run it with a real credential:

```dockerfile title="Dockerfile-2"
# BAD: ARG values can appear in image history and build attestations
ARG PRIVATE_INDEX_TOKEN
RUN python -m pip install --index-url "https://token:${PRIVATE_INDEX_TOKEN}@packages.example.invalid/simple" private-package
```

BuildKit, Docker's build engine, has a separate secret-mount channel. The mounted file is available only for that `RUN` instruction and isn't committed to its layer. Commands can still leak it by copying its contents elsewhere or printing them, so the channel doesn't replace careful handling.[^docker2026buildsecrets]

If `requirements.txt` later needs a private index, replace its install instruction in the builder stage with this fragment. When this `RUN` executes, `required=true` makes it fail if the selected secret is missing. A cache hit can skip the instruction and its secret check. To test delivery, force the builder stage to execute with `--no-cache-filter builder`. Use this mount on the install instruction:

```dockerfile title="Dockerfile (builder-stage fragment)"
RUN --mount=type=secret,id=pip_config,target=/etc/pip.conf,required=true \
    python -m pip install --require-hashes -r /tmp/requirements.txt
```

Supply that temporary file from the build command:

```bash title="terminal-7"
docker build \
  --secret id=pip_config,src="$HOME/.config/pip/pip.conf" \
  -t prompt-eval:private .
```

Runtime secrets use a separate channel. Docker's Compose guidance warns against putting passwords or API keys in <span data-glossary="environment-variable">environment variables</span>, because container configuration and diagnostic tooling can expose them. When the scorer later calls an API, mount a Compose secret as `/run/secrets/eval_api_key` or use the deployment platform's secret manager, then have the process read that file. Keep `env_file` for non-sensitive settings such as log level or feature mode.[^docker2026composesecrets]

Once the scorer reads that file, extend the existing Compose model with this fragment:

```yaml title="compose-secret-fragment.yaml"
services:
  scorer:
    secrets:
      - eval_api_key

secrets:
  eval_api_key:
    file: ./secrets/eval_api_key.txt
```

Don't add this fragment before the process consumes the file. Local Compose mounts a host file; it doesn't encrypt that file or remove host-access risks. Keep it out of Git, restrict its host permissions, and verify that `appuser` can read the mounted secret without granting unrelated users access.

Keep `secrets/` and `.env*` in both `.gitignore` and `.dockerignore`. Those exclusions protect two different routes out of your machine. Explicit build-secret and runtime-secret mounts deliver the selected file without copying it into ordinary image layers.

```checkpoint
Why shouldn't an API key enter through `COPY`, `ARG`, `ENV`, or an ordinary runtime environment variable?
---
`COPY` and `ENV` can persist the key in image content or config. `ARG` is not passed into the running container environment, yet its value can still be inspected via image history and build attestations. Runtime environment values can show up in container configuration and diagnostics. A runtime secret file or platform secret manager limits exposure to the process that needs it, while a BuildKit secret mount handles credentials needed only during the build.
```

## When the GPU enters the story

The CPU-first image is the right base here. It works through Docker Engine or Docker Desktop on common Linux, macOS, and Windows development machines. For the Linux Docker Engine path below, a <span data-glossary="cuda">CUDA</span> workload needs a compatible NVIDIA GPU, an installed host driver, and NVIDIA Container Toolkit configuration that exposes selected devices to the container. The image supplies the framework and its application CUDA runtime libraries. The configured container runtime exposes host driver libraries and utilities according to the requested capabilities. The kernel driver stays on the host.[^nvidiaContainerToolkit2026]

Windows also has a supported GPU path: Docker Desktop with its WSL2 backend and a compatible NVIDIA Windows driver can expose the GPU to Linux containers. Use Docker's Windows-specific setup and validation instructions for that path; the `systemctl` and Linux driver commands below configure a Linux Engine host.[^docker2026desktopgpu]

When the same scorer later becomes a GPU workload, don't start by swapping Python packages. Check each layer in sequence to see where visibility breaks: the host driver, the container runtime, or the PyTorch build inside the image.

After installing the toolkit on a systemd-managed Docker Engine host, configure its runtime and restart the daemon:

```bash title="terminal"
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

Rootless Docker uses a user-scoped daemon configuration and restart command, so follow NVIDIA's rootless instructions instead of copying the system-wide commands.

When a later <span data-glossary="pytorch">PyTorch</span> or inference chapter needs GPU acceleration, keep the same habits and change only the platform-specific pieces:

| Dimension | CPU evaluator now | GPU workload later |
|---|---|---|
| Base image | `python:3.12-slim-trixie` | official PyTorch CUDA image or NVIDIA CUDA runtime image matched to the torch wheel |
| Runtime check | scorer returns `0.667` | `python -c "import torch; assert torch.cuda.is_available()"` |
| Run command | `docker run prompt-eval:local` | `docker run --gpus all ...`; add shared memory only when the workload needs it |
| Portability claim | same Python runtime on normal machines | compatible NVIDIA platform, driver, and container runtime |

Don't promise that one CUDA image gives Apple Silicon and NVIDIA parity. Docker Desktop on Apple Silicon can run this Linux CPU image, but it doesn't turn the Mac GPU into an NVIDIA CUDA device. Use the later Metal/MPS path for native Mac PyTorch, and test production CUDA images on compatible Linux NVIDIA hosts.

Notice what this <span data-glossary="smoke-test">smoke test</span> actually checks: GPU device visibility inside Docker, not compatibility with a specific PyTorch wheel. NVIDIA uses a plain `ubuntu` image so the toolkit can expose `nvidia-smi` without coupling the check to a CUDA application image.[^nvidiaSampleWorkload2026]

```bash title="terminal-8"
sudo docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi
```

Read GPU failures in layers:

| Observation | Component to inspect next |
|---|---|
| `nvidia-smi` fails on host | install or repair host NVIDIA driver first |
| host command works, container smoke test fails | inspect Container Toolkit installation, Docker runtime configuration, and requested devices |
| smoke test works, but `torch.cuda.is_available()` is false | inspect application image, installed PyTorch build, visible-device settings, and driver/runtime compatibility |

The smoke test checks device visibility; it does not verify wheel or CUDA compatibility for a specific PyTorch image. Read the table from top to bottom: fix the host first, then the container runtime, then the application image. For a real workload, select an official framework or CUDA image whose architecture and CUDA runtime match the locked Python packages. Verify its documented minimum driver requirement, then pin that application image for the release as you pinned the CPU base.

## Combine the checks in a CI script

Once the container runs cleanly by hand, combine the static check, build, and both dataset paths into a single Bash check script for local verification or continuous integration (CI). Running both paths ensures a working host mount does not mask a broken baked dataset. Save this as `scripts/check_container.sh` and run it from the project root with `bash scripts/check_container.sh`:

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
  echo "Docker Compose plugin missing. Install docker-compose-plugin before enabling the compose gate."
fi
```

`set -euo pipefail` stops this script when a mandatory command fails. A missing Compose plugin is deliberately reported and skipped; an installed plugin with invalid configuration fails the script. On an older Docker release without `docker build --check`, upgrade or temporarily omit only that static check. Neither static check substitutes for running the image.

The evaluation script exits zero whenever accuracy reaches at least two-thirds (`3/3` passes as well as `2/3`). The exact string comparison checks whether output matches the current starter cases; intentionally editing `eval/eval_cases.jsonl` means updating the expected output block alongside it. A threshold check and an exact regression check answer different questions.

Try updating the third host case so all three match, then rerun the script after rebuilding. Even though `3/3` passes the two-thirds rule, the exact string check reports `ERROR: baked eval report changed`. Restore the original case prior to moving on. This failure distinguishes changed input from a broken container runtime.

Keep `prompt-eval:check` on the image you built until the following inspection returns its ID. Both test commands use that captured ID, so a later tag change cannot redirect either run. If other jobs share the tag, the build’s `--iidfile` option can record its output ID directly. A local identity doesn't prove the image exists in a deployment registry. Before deployment, record and promote the registry's verified `repository@sha256:...` reference for the tested image. Don't construct that reference by attaching a local ID to a registry URL. Docker distinguishes image IDs from repository digests, and its push or pull output reports the registry digest.[^dockerImageIdentity2026]

## Failures you'll see first

| Symptom | Possible cause | Fix that belongs in the repo |
|---|---|---|
| `ModuleNotFoundError` inside the container | dependency missing from `requirements.txt` | add it to `requirements.txt`, rebuild, and keep dependency install before `COPY scripts/` |
| `.env` appears in the image context | `.dockerignore` forgot `.env*` | add `.env*`, rotate any exposed credential, rebuild, and inspect image history before pushing |
| `Permission denied` on a mounted directory | `appuser` lacks the required access | check file modes and UID/GID; initialize writable volume ownership rather than assuming Docker grants access |
| each code edit reinstalls dependencies | `COPY . /app` happens before dependency install | copy `requirements.txt` first, install dependencies, then copy application code |
| `could not select device driver with capabilities: [[gpu]]` | Docker's configured runtime can't provide the requested GPU | check the platform's GPU setup and keep the CPU scorer path working |
| Cloud Run starts but can't read config | local file or environment setup was assumed to exist in production | declare non-secret configuration and use Secret Manager for credentials |

Document the diagnosis, command, and prevention in the repo so the next clone can reproduce the fix without rediscovering it.

## What survives a fresh clone

Commit `Dockerfile`, `.dockerignore`, `requirements.txt`, `compose.yaml`, and `scripts/check_container.sh` alongside `scripts/score_eval.py` and `eval/eval_cases.jsonl`. Repeat the previous lesson's temporary-clone check after committing these files, then run `bash scripts/check_container.sh` inside that clone. The builder should see only committed project inputs. Another engineer should be able to run both baked and mounted dataset paths and reproduce the empty-mount error without borrowing your virtual environment or API keys.

Before publishing a release image, pin the base digest and deployment platform, lock any dependencies, and record the image identity with the successful run output. These controls constrain the inputs; they don't guarantee bit-for-bit identical rebuilds or identical GPU numerical results. For deployment, promoting one tested image by digest is a stronger guarantee than rebuilding the same recipe on every machine.

Separate the files that belong in the image from the files that arrive on a mount, and expect a known failure when the eval directory is missing. The scorer is still a command that prints `0.667`. Follow that command through one row: how it parses a field, compares a label, and decides the gate.

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
    "explanation": "Git exclusions do not provide Docker context exclusions. The secret remains eligible to the builder, but the selected COPY instructions omit it. BuildKit can avoid transferring unused files, so eligibility does not prove that this unread secret’s bytes were transmitted. An explicit .dockerignore rule narrows the permitted context itself."
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
    "question": "Two read paths use one image ID and the exact two-thirds threshold. The first batch has 6 matches among 8 rows; the second has 5 among 8. Which threshold results follow from the integer gate?",
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
    "question": "A Compose service named `audit` has `build: .`, `read_only: true`, and `volumes: [\"./batches:/input\"]`. It runs `/app/audit.py`, which the Dockerfile copies into the image. You edit the script after the last build. Host permissions let the service user read the batch and create files in `./batches`. After `docker compose config --quiet` succeeds, which run will test the edit, and does the mount permit the script to create `/input/checked`?",
    "options": [
      "Rebuild and run the service. The mount permits the write.",
      "Run the existing image. The mount blocks the write.",
      "Run the existing image. The mount permits the write.",
      "Rebuild and run the service. The mount blocks the write."
    ],
    "answer": "Rebuild and run the service. The mount permits the write.",
    "explanation": "The existing image still holds the old script. Compose validated the configuration. Run `docker compose run --build --rm audit` to copy the edit into the image and exercise it on the batch. The service setting protects the root filesystem. The bind at `/input` defaults to read-write because its entry omits `:ro`. The host permissions allow the script to create the file there."
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
    "question": "A gate captures local image ID L and passes L to both run commands. The baked and mounted runs each print the expected report. The mutable tag later points elsewhere, and no verified repository digest has been recorded. What has actually been tested, and what is still needed for deployment?",
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
