---
query: "We are creating a research-backed page for the following: \"Git, Shell, Linux for AI\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Build a reproducible AI repo with safe Git defaults, a clean-clone eval gate, shell diagnostics, and Linux process habits.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "663129a5d7ab934b82cc4f24bd12ab6e"
status: "completed"
---

Here is a proposed structure and essential content for the "Git, Shell, Linux for AI" curriculum article. It is designed to take learners from brittle, local-only notebook habits to robust, reproducible workflows suited for headless GPU servers.

### 1. Narrative Order and Prerequisites

- **Target Audience:** ML researchers and AI engineers who understand basic Python and PyTorch/TensorFlow but struggle with deployment, environment reproduction, or headless server management.
- **Prerequisites:** Basic familiarity with terminal navigation (`cd`, `ls`) and Git (`commit`, `push`).
- **Teaching Order:**

1. **Version & State:** Start by securing the code and environment (Git + Dependency locking).
2. **The Gate:** Introduce the "clean-clone" mechanism to prove the setup actually works.
3. **Execution & Durability:** Teach how to launch long-running processes on remote Linux servers safely.
4. **Diagnostics:** Conclude with shell tools to monitor the running training/eval process and debug when it hangs or crashes.

### 2. Safe Git Defaults for AI

AI repositories easily become bloated with accidental data commits or broken by missing environment variables. This section establishes defensive tracking.

- **Core Concepts:** Separating source code from large binaries (weights, datasets) and establishing strict environment locks.
- **Implementation Details:**

- **The `.gitignore` Firewall:** Default to excluding all data and weights (`*.pt`, `*.safetensors`, `*.csv`, `*.h5`, `data/`, `checkpoints/`).
- **Git LFS (Large File Storage):** For necessary binary tracking (e.g., small baseline models or vector databases), use Git LFS. It replaces large files with text pointers while storing the blob on a remote server.
- **Limits & Tradeoffs:** GitHub’s LFS free tier caps at 1GB of storage and 1GB of monthly bandwidth, with a maximum file size of 2GB per file [GitHub LFS Limits](https://docs.github.com/repositories/working-with-files/managing-large-files/about-git-large-file-storage). For datasets exceeding this, recommend purpose-built data versioning (DVC) or Hugging Face Hub instead of Git LFS.
- **Common Mistakes:** Accidentally committing a 3GB `.safetensors` file before setting up LFS, forcing a painful `git filter-repo` history rewrite.

### 3. The Clean-Clone Eval Gate

"It works on my machine" is a fatal error in ML. This section teaches how to validate reproducibility through a CI/CD-style gate.

- **Core Mechanisms:** A script that automatically clones the repo into a temporary directory `/tmp/eval_workspace`, installs dependencies strictly from a lockfile, downloads remote weights, and runs a deterministic evaluation.
- **Environment Locking:** Teach the use of modern, ultra-fast deterministic resolvers like `uv`. Running `uv lock` ensures cross-platform consistency by enforcing exact transitive dependency versions without relying on brittle `requirements.txt` files [uv Locking Documentation](https://docs.astral.sh/uv/concepts/projects/sync/).
- **Determinism:** Enforce the seeding of the randomness triad (`torch.manual_seed()`, `random.seed()`, `np.random.seed()`) and mandate that the clean-clone eval script asserts against a known-good metric hash.
- **Expected Outcome:** The learner builds a `bash verify_eval.sh` script that fails if an uncommitted local file was secretly required for the model to run.

### 4. Linux Process Habits for ML

Training runs often take days. If an SSH connection drops and kills the run, time and compute money are wasted.

- **Session Durability:**

- Teach `tmux` or `screen` for multiplexing and detaching sessions.
- Teach `nohup python train.py &` combined with `tail -f nohup.out` for simple backgrounding.
- **Resource Limits & The OOM Killer:**

- Explain the Linux Out-Of-Memory (OOM) killer. When an ML dataloader leaks memory, Linux will forcefully terminate the process to save the kernel.
- **Diagnostic Command:** Teach `dmesg -T | grep -i oom` to prove a process was killed by the OS rather than a Python exception.
- **Shared Memory:** Highlight the notorious `/dev/shm` exhaustion issue. Docker defaults to 64MB of shared memory, which immediately crashes PyTorch DataLoaders using multiple workers.
- **Cgroups (Control Groups):** For advanced environments, introduce cgroups v2 (`memory.max` limits) as the mechanism Linux uses to restrict container/process RAM [Linux Kernel Cgroup v2 Docs](https://docs.kernel.org/admin-guide/cgroup-v2.html).

### 5. Shell Diagnostics: Finding the Bottleneck

When an AI process is running, researchers need to know if they are CPU-bound, I/O-bound, or GPU-bound.

- **GPU Diagnostics (`nvidia-smi`):**

- Command: `watch -n 1 nvidia-smi` or `nvidia-smi -l 1` for continuous polling.
- Command: `nvidia-smi dmon` for streaming hardware metrics (power, temp, SM clocks) [NVIDIA System Management Interface](https://developer.nvidia.com/system-management-interface).
- **Crucial Misconception:** PyTorch uses a caching memory allocator. `nvidia-smi` may report 100% VRAM usage even when the GPU compute utilization (Volatile GPU-Util) is at 0%. Memory allocation does not equal active processing.
- **CPU & I/O Diagnostics:**

- Use `htop` to visualize CPU core saturation. If one core is at 100% and the rest are idle, the dataloader is bottlenecking the GPU.
- Use `iostat` to check if disk read speeds are choking the pipeline (e.g., reading thousands of tiny JPEGs instead of using a serialized format like WebDataset).

### 6. Suggested Labs and Worked Examples

- **Lab 1: The OOM Autopsy.** Provide a Python script that purposefully allocates lists in a `while True` loop. Have the learner run it until it gets "Killed", then use `dmesg` to find the exact timestamp and system justification for the kill.
- **Lab 2: The tmux Training Run.** The learner must SSH into a machine, start a `tmux` session, initiate a dummy training script that prints epochs every 5 seconds, detach, disconnect their internet entirely, reconnect, and successfully reattach to the running session.
- **Lab 3: Profiling the Dataloader.** Provide an intentionally slow PyTorch dataset (e.g., with `time.sleep()`). Have the learner use `htop` and `nvidia-smi` side-by-side to observe CPU usage pegging while GPU utilization idles at 0%, demonstrating a CPU-bound pipeline.
