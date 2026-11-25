---
{
  "id": "code-generation-agents-sandboxing",
  "title": "Code Generation & Sandboxing",
  "slug": "code-generation-agents-sandboxing",
  "category": "LLM Agents & Tool Use",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/code_sandbox_dark.png",
  "companies": [
    "OpenAI",
    "AWS",
    "Google",
    "Anthropic",
    "GitHub",
    "Replit"
  ],
  "shortDescription": "Build coding agents that turn runtime tracebacks into tested repairs while isolating untrusted code across local OS sandboxes, containers, microVMs, and WebAssembly.",
  "prerequisites": [
    "prompt-injection-defense-strategies",
    "agentic-architectures-react-plan-execute",
    "structured-output-constrained-generation"
  ],
  "keyConceptsTested": [
    "Generate-Execute-Debug Loops",
    "Trusted Validation & Manifest Binding",
    "Local OS Sandboxing (Landlock, Seatbelt, Seccomp-BPF)",
    "Workspace Masking (.git/hooks) & Unix-Socket Secret Brokering",
    "Server Isolation (Docker, gVisor, Firecracker, Wasmtime)",
    "Runtime Resource Limits, Teardown & pass@k Evaluation"
  ],
  "relatedQuestions": [
    "computer-use-gui-browser-agents",
    "agent-failure-states-retry-fallback",
    "ai-coding-workflow-with-agents",
    "observability-monitoring-llm-systems"
  ],
  "section": "Advanced Agents & Retrieval",
  "order": 7,
  "aliases": [
    "local-agent-sandboxing-seatbelt-landlock"
  ]
}
---

A coding agent writes a JUnit XML parser, runs it against a test report, and hits `KeyError: 'status'`. The model assumed `<testcase>` carries a `status` attribute, whereas JUnit encodes failures as child elements. That single traceback turns guesswork into a surgical repair: inspect direct child tags, re-run the suite, and verify the fix.

The risk sits inside **runs**. Execution makes a coding agent far stronger than text completion, yet it also turns a broken or prompt-injected patch into arbitrary code execution. With ambient shell privileges, candidate code can read `~/.ssh` or cloud keys, probe `169.254.169.254`, plant a `.git/hooks/post-checkout` trigger, or forge green test exits. Safe coding agents pair an **evidence-driven repair loop** (isolated from grading) with **layered OS and runtime sandboxing** across local developer machines (Landlock, Seatbelt, Seccomp-BPF, workspace masking, Unix-socket secret brokering) and cloud hosts (containers, gVisor, Firecracker, WebAssembly). Outer loops live in [ReAct and plan-and-execute architectures](/learn/agentic-architectures-react-plan-execute), and prompt defenses live in [prompt-injection defense strategies](/learn/prompt-injection-defense-strategies).

## Turn execution failures into repair evidence

Consider a concrete parsing specification: given a JUnit XML report, return `classname::name` for each failed or errored `<testcase>` in first-seen order, deduplicated by `(classname, name)`. Match status tags only as direct children in the root namespace, let `<skipped>` override `<failure>` or `<error>`, and reject missing or blank identifiers.

<!-- leetllm: test, id=junit-regression, output=show -->
```python title="junit-regression.py"
from xml.etree import ElementTree as ET

REPORT = """<testsuites><testsuite>
  <testcase classname="router" name="ok"/>
  <testcase classname="router" name="declined"><failure/></testcase>
  <testcase classname="router" name="offline"><error/></testcase>
  <testcase classname="router" name="later"><skipped/></testcase>
  <testcase classname="router" name="both"><failure/><error/></testcase>
  <testcase classname="router" name="declined"><failure/></testcase>
  <testcase classname="router" name="nested"><details><failure/></details></testcase>
</testsuite></testsuites>"""

NAMESPACED = """<testsuite xmlns="urn:example:junit" xmlns:other="urn:other">
  <testcase classname="api" name="bad"><failure/></testcase>
  <testcase classname="api" name="foreign"><other:failure/></testcase>
  <testcase classname="api" name="skip"><skipped/><error/></testcase>
</testsuite>"""

def broken(xml):
    return [case.attrib["name"] for case in ET.fromstring(xml).iter("testcase")
            if case.attrib["status"] == "failed"]

def failed_tests(xml):
    root = ET.fromstring(xml)
    ns = root.tag[:root.tag.index("}") + 1] if root.tag.startswith("{") else ""
    result, seen = [], set()
    for case in root.iter(f"{ns}testcase"):
        children = {child.tag for child in case}
        if f"{ns}skipped" in children:
            continue
        if not children.intersection({f"{ns}failure", f"{ns}error"}):
            continue
        identity = (case.get("classname"), case.get("name"))
        if any(value is None or not value.strip() for value in identity):
            raise ValueError("Failing testcase requires non-empty classname and name")
        if identity not in seen:
            seen.add(identity)
            result.append(f"{identity[0]}::{identity[1]}")
    return result

try:
    broken(REPORT)
except KeyError as error:
    print("Attempt 1 failed:", repr(error))

print("Attempt 2 (standard):", failed_tests(REPORT))
print("Attempt 2 (namespaced):", failed_tests(NAMESPACED))
assert failed_tests("<testsuite/>") == []
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Attempt 1 failed: KeyError('status')
Attempt 2 (standard): ['router::declined', 'router::offline', 'router::both']
Attempt 2 (namespaced): ['api::bad']
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/junit_parser_trace_dark.png" alt="JUnit parser trace diagram showing the initial status-attribute lookup raising KeyError, followed by a direct-child tag scan across seven testcases: router::declined in slot 1, router::offline in slot 2, router::both merged once into slot 3, skipped ignored, duplicate declined deduplicated, nested failure outside direct children omitted, and api::skip precedence omitting error." />
  <figcaption>Direct <code>&lt;failure&gt;</code> or <code>&lt;error&gt;</code> children produce the ordered unique list (<code>router::declined</code>, <code>router::offline</code>, <code>router::both</code>); skipped cases, duplicates, and nested non-direct tags are excluded.</figcaption>
</figure>

Two ElementTree subtleties make `failed_tests` reliable: an empty `<failure/>` element is falsy under `if case.find("failure"):` (so inspecting direct-child tag sets avoids dropping empty tags),[^elementTree2026] and expanding the root XML namespace `{uri}tag` stops foreign extensions such as `<other:failure/>` from counting as failures.[^pythonXmlSecurity2026] Feed only four bounded fields back to the model (command, exit code, failing assertion, and byte-capped head/tail output) and strip terminal escape codes, treating all worker logs as untrusted text.

## Separate candidate execution from grading

If untrusted code shares the grader's process or filesystem view, a hostile patch can forge a passing score. Split every runner into a **Trusted Supervisor** (orchestrates retries, strips secrets, enforces deadlines), an **Untrusted Worker** (runs candidate code in a credential-free sandbox), and a **Trusted Validator** (grades outputs outside the candidate's reach).

> **Key insight:** Mounting `tests/` read-only (`:ro`) inside a worker container does not protect grading. Candidate code can still read private tests to hardcode answers, and inside a shared Python interpreter it can monkey-patch `unittest.TestCase.assertTrue` or `sys.modules` so the suite exits `0`.

Also close **time-of-check to time-of-use (TOCTOU) drift**, where an agent edits files or swaps base commits after tests pass. Hash the canonical manifest (base commit, candidate bytes, image digest, grading version) with SHA-256 and store it in the supervisor before accepting any patch.

<!-- leetllm: test, id=artifact-binding, output=show -->
```python title="artifact-binding.py"
from copy import deepcopy
from hashlib import sha256
import json

def fingerprint(manifest):
    return sha256(json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

tested = {
    "base": "base-v1",
    "files": {"parser.py": "return failure_names(report)"},
    "environment": "image-v1",
    "grading": "tests-v1",
}
verdict = {"artifact": fingerprint(tested), "status": "pass"}
print("Verified digest:", verdict["artifact"][:12])

for field, replacement in (("base", "base-v2"), ("files", {"parser.py": "return []"}), ("grading", "tests-v2")):
    mutated = deepcopy(tested)
    mutated[field] = replacement
    digest = fingerprint(mutated)
    assert digest != verdict["artifact"]
    print(f"Mutated {field:7s} -> {digest[:12]} (matches={digest == verdict['artifact']})")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Verified digest: 7cb446e25d97
Mutated base    -> 101ce2d57a26 (matches=False)
Mutated files   -> 8a730472adf0 (matches=False)
Mutated grading -> 516ea90efecc (matches=False)
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/code_sandbox_dark.png" alt="Artifact manifest binding diagram linking Manifest M (base, code, tests) via canonical SHA-256 digest H(M) to a trusted verdict store, followed by candidate acceptance checks: unchanged M matches H(M) and passes verification, while changing to base-v2, editing parser.py, or changing to tests-v2 mismatches and is rejected. Deployment still requires explicit approval." />
  <figcaption><code>H(M)</code> binds a passing verdict to the exact base commit, candidate bytes, runtime image, and grading suite so any post-test edit fails verification.</figcaption>
</figure>

## Local-OS sandboxing tier: Landlock, Seatbelt, Seccomp-BPF, and workspace escapes

Developer CLI agents (such as Claude Code, Codex CLI, and Gemini CLI) must edit a local repository and run native compilers without requiring a rootful Docker daemon. Instead of running with your full user account, they split trust between a host supervisor and an OS-confined worker across four mechanisms:

### Linux Landlock and Seccomp-BPF with Bubblewrap

Unlike legacy LSMs (SELinux, AppArmor) that require root setup, **Linux Landlock** (introduced in Linux 5.13) lets an unprivileged process restrict itself and its future children via three system calls: `landlock_create_ruleset`, `landlock_add_rule`, and `landlock_restrict_self` (paired with `prctl(PR_SET_NO_NEW_PRIVS, 1, ...)` so setuid binaries cannot escalate).[^linuxLandlock2026] Landlock uses a versioned kernel ABI spanning filesystem access (ABI v1-v3), TCP bind/connect controls (ABI v4, Linux 6.7), and abstract Unix socket/signal scoping (ABI v6, Linux 6.12). Because Landlock checks rights at file-open time, close sensitive descriptors before invoking untrusted code.

Pair filesystem rules with **Seccomp-BPF**, which attaches a kernel BPF filter to block dangerous syscalls (`ptrace`, `bpf`, `chroot`, `keyctl`, `socket(AF_PACKET, ...)`, `socket(AF_NETLINK, ...)`) before dispatch, and **Bubblewrap (`bwrap`)** for unprivileged mount, PID, IPC, and network namespaces:[^linuxSeccompBpf2026][^bubblewrap2026]

```bash title="bubblewrap-local-sandbox.sh"
bwrap \
  --ro-bind /usr /usr --ro-bind /lib /lib --ro-bind /bin /bin \
  --tmpfs /tmp --proc /proc --dev /dev \
  --bind /path/to/repo/src /app/src \
  --ro-bind /path/to/repo/.git /app/.git \
  --unshare-all --new-session --die-with-parent \
  python3 -m unittest discover /app/src
```

Pass a compiled BPF filter descriptor via `--seccomp` alongside `--die-with-parent` (which sends `SIGKILL` to the worker if the supervisor dies).

### macOS Seatbelt (`sandbox-exec` / SBPL)

On macOS, **Seatbelt** profiles written in Sandbox Profile Language (SBPL, invoked via `sandbox-exec` or `sandbox_init_with_parameters`) start from `(deny default)` and pass workspace paths as runtime parameters:[^appleSeatbelt2026]

```scheme title="agent-sandbox.sb"
(version 1)
(deny default)
(allow process-exec (subpath "/usr/bin") (subpath "/usr/local/bin"))
(allow file-read* (subpath "/usr") (subpath "/System") (subpath "/Library/Developer"))
(deny file-read* file-write*
    (subpath (param "HOME_SSH"))
    (subpath (param "HOME_AWS"))
    (subpath (param "HOME_KEYCHAIN")))
(allow file-read* file-write* (subpath (param "PROJECT_DIR")))
(deny network*)
```

### The `.git/hooks` workspace escape

Even when `~/.ssh`, `~/.aws`, and network sockets are blocked, granting write access to the whole repository root opens a delayed host escape.[^gitHookSecurity2026] An untrusted worker can write an executable script to `.git/hooks/post-checkout` (or point `core.hooksPath` / `core.fsmonitor` in `.git/config`, or drop a task in `.vscode/tasks.json`). None of those untracked files appear in a standard `git diff`, yet the very next time you run `git checkout` on the host outside the sandbox, Git executes that planted hook with your full developer privileges.

> **Common mistake:** Adding a read-only Landlock rule on `/repo/.git` inside the same layer that grants write access to `/repo`. Grants inside one Landlock layer form a **union, not a subtraction**, so the parent write grant still wins. Instead, grant writes only to explicit source subtrees (`src/`, `tests/`), stack a separate restrictive layer, or bind-mount `.git` read-only with `bwrap --ro-bind`.

### Secret-zero containment via Unix-socket brokering

Blocking network egress stops a worker from phoning home, yet passing `GITHUB_TOKEN` or API keys in worker environment variables still leaks them: untrusted code only needs `print(base64.b64encode(os.environ["GITHUB_TOKEN"].encode()))` to bypass regex log scrubbers and dump credentials straight into captured stdout.

The structural defense is **secret-zero containment**: place zero raw credentials inside the worker's environment or filesystem. Instead, mount a host-owned **Unix domain socket** into the sandbox. The worker sends unauthenticated structured requests over that socket, and the host-side broker validates the HTTP method (`GET` only) and allowlisted repository path, attaches the `Authorization: Bearer ...` header strictly on the outbound host leg, and filters the upstream JSON response to an explicit field allowlist before returning bytes across the socket.

<!-- leetllm: test, id=local-path-policy, output=show -->
```python title="workspace-escape-and-broker-guard.py"
import tempfile
from pathlib import Path

class WorkspaceGuard:
    """Enforces workspace root containment and blocks repository/IDE host triggers."""
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.denied = {
            self.root / ".git" / "hooks",
            self.root / ".git" / "config",
            self.root / ".vscode",
            self.root / ".env",
        }

    def can_write(self, target: Path) -> bool:
        resolved = target.resolve()
        try:
            resolved.relative_to(self.root)
        except ValueError:
            return False
        return not any(resolved == d or d in resolved.parents for d in self.denied)

def broker_request(method: str, path: str, upstream_json: dict) -> tuple[int, dict]:
    """Host-side Unix-socket broker: scopes route/method and strips unapproved fields."""
    if method != "GET" or not path.startswith("/repos/org/app/pulls/"):
        return 403, {"error": "route_or_method_forbidden"}
    allowed_fields = ("number", "state", "title")
    return 200, {k: upstream_json[k] for k in allowed_fields if k in upstream_json}

with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    (root / "src").mkdir()
    (root / ".git" / "hooks").mkdir(parents=True)
    guard = WorkspaceGuard(root)
    checks = [
        ("src/app.py", root / "src" / "app.py", True),
        ("../.ssh/authorized_keys", root / ".." / ".ssh" / "authorized_keys", False),
        (".git/hooks/post-checkout", root / ".git" / "hooks" / "post-checkout", False),
        (".git/config", root / ".git" / "config", False),
        (".vscode/tasks.json", root / ".vscode" / "tasks.json", False),
    ]
    for label, path, expected in checks:
        ok = guard.can_write(path)
        assert ok is expected
        print(f"write {label:25s} -> {'ALLOW' if ok else 'DENY'}")

raw_upstream = {"number": 42, "state": "open", "title": "Fix parser", "debug_token": "ghp_secret"}
print("Broker GET allowed:", broker_request("GET", "/repos/org/app/pulls/42", raw_upstream))
print("Broker POST blocked:", broker_request("POST", "/repos/org/app/pulls/42", raw_upstream))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
write src/app.py                -> ALLOW
write ../.ssh/authorized_keys   -> DENY
write .git/hooks/post-checkout  -> DENY
write .git/config               -> DENY
write .vscode/tasks.json        -> DENY
Broker GET allowed: (200, {'number': 42, 'state': 'open', 'title': 'Fix parser'})
Broker POST blocked: (403, {'error': 'route_or_method_forbidden'})
```
<!-- leetllm: output:end -->

## Server-side execution isolation models

When running multi-tenant or unattended agent jobs on cloud hosts, local process policies give way to container, user-space kernel, microVM, or WebAssembly boundaries. Compare them by where untrusted system calls terminate and what stays in the trusted computing base:

| Isolation layer | How it mediates execution | Trade-offs and remaining attack surface |
| :--- | :--- | :--- |
| **Linux containers (Docker / runc)** | Linux namespaces, cgroups v2 quotas, seccomp filters, and dropped capabilities. | Near-native Linux speed, but shares the host kernel. Kernel bugs, permissive mounts, or exposed Docker sockets break isolation.[^dockerSecurity2026] |
| **User-space kernel (gVisor)** | Sentry intercepts syscalls in user space (`systrap` or KVM platform) and emits a tiny host syscall subset; Gofer/DirectFS mediates files.[^gvisorSecurity2026][^gvisorPlatforms2026] | Strong host-kernel reduction with broad Linux compatibility; syscall-heavy or I/O-heavy builds add measurable overhead. |
| **MicroVM (Firecracker)** | Runs a dedicated guest Linux kernel inside a minimal VMM over KVM, targeting <=125 ms to guest `/sbin/init`.[^agache2020][^firecrackerSpec2026] | Hardware virtualization isolates the guest kernel from the host; adds rootfs management and end-to-end startup latency for packages and pytest. |
| **WebAssembly (Wasmtime)** | Checked linear memory, typed control flow, fuel metering, and zero OS access without explicit imports or WASI.[^wasmtimeSecurity2026] | Microsecond cold starts and deterministic instruction caps; limited to code compiled to Wasm or running inside a Wasm interpreter. |

<figure>
  <img src="illustrations/_generated/runtime_isolation_paths_dark.png" alt="Comparison table across four sandbox runtimes: Docker/runc using cgroups and seccomp over a shared host kernel; gVisor using Sentry user-space kernel with Gofer filesystem proxy; Firecracker using KVM microVM with a dedicated guest kernel; and WebAssembly enforcing checked linear memory and fuel metering with zero OS exposure unless host imports are linked, paired with the import-free Wasmtime guest summary (1,000 fuel, 64 KiB memory, 4 KiB WAT max, 0 imports)." />
  <figcaption>The four server runtimes differ in where untrusted calls terminate: shared host kernel, user-space Sentry kernel, KVM guest kernel, or import-free Wasm linear memory.</figcaption>
</figure>

Two deployment traps catch teams quickly. First, **never mount the Docker socket inside a worker**, because an unrestricted Docker daemon lets any caller launch a privileged container or bind-mount `/`.[^dockerSecurity2026] Second, **inspect hosted sandbox defaults**: managed platforms such as Modal allow outbound public-IP traffic unless you configure `block_network=True` or explicit allowlists, and domain-name filters can still be bypassed via domain fronting on shared edges.[^modal2026sandbox]

## Hardened containers, resource limits, and clean teardown

Even inside a container or microVM, combine filesystem, privilege, network, and cgroup limits so no single runaway script exhausts the host:[^dockerRun2026]

<figure>
  <img src="illustrations/_generated/defense_in_depth_stack_dark.png" alt="Defense-in-depth container worker diagram placing a 30-second external supervisor watchdog above an unprivileged UID 10001 worker with capabilities dropped, cgroups v2 quotas (0.5 CPU, 512 MiB memory, 64 PIDs), isolated network namespace (--network=none), read-only root filesystem, and a 64 MiB noexec, nosuid temporary /tmp mount." />
  <figcaption>Layered worker containment pairs cgroup CPU, memory, and PID limits with network isolation, a read-only root filesystem, a bounded <code>noexec</code> scratch mount, and an external 30-second supervisor watchdog.</figcaption>
</figure>

```bash title="hardened-worker-launch.sh"
docker run --rm \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m,mode=1777 \
  --net=none \
  --user 10001:10001 \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --security-opt seccomp=/etc/docker/seccomp-strict.json \
  --pids-limit 64 --memory 512m --memory-swap 512m --cpus 0.5 \
  --workdir /app --entrypoint python \
  candidate-worker:reviewed-example /app/main.py
```

Each flag shuts down a distinct failure mode: `--read-only` plus a 64 MiB `noexec,nosuid` `/tmp` stops rootfs tampering and bounds scratch disk (remembering that `python /tmp/script.py` still runs scripts read as text);[^dockerTmpfs2026] `--net=none` strips outbound networking;[^dockerNetworkNone2026] `--pids-limit 64` stops fork bombs with `EAGAIN`; and equal `--memory` / `--memory-swap` caps disable swap before OOM kill.[^linuxCgroupV22026][^dockerResources2026] For third-party packages, run a two-phase pipeline: install lockfile-pinned wheels in a credential-free prep phase, then execute candidate code offline with `--net=none`.

> **Common mistake:** Treating `--cpus 0.5` as an execution timeout. Under Linux's 100 ms cgroup period, `--cpus 0.5` grants 50 ms of aggregate CPU time every 100 ms, so `while True: pass` runs forever at half speed unless an external supervisor enforces a wall-clock `SIGKILL` deadline.[^dockerResources2026]

Teardown has two subtle concurrency traps:

1. **Processes escaping `killpg` via `setsid`.** A child calling `setsid()` joins a fresh session and survives `killpg`. Rely on PID-namespace init teardown or Linux cgroup v2 `cgroup.kill` to terminate every descendant atomically, then verify the cgroup is empty.[^linuxSubreaper2026][^linuxSetsid2026][^linuxPidNamespaces2026][^linuxCgroupV22026]
2. **Stale cleanup killing a replacement worker.** If a supervisor crashes before reaping `worker-7` in slot `A`, a reaper cleans slot `A` and schedules `worker-8` there. A delayed retry for generation 7 that resolves mutable slot `A` instead of immutable `worker-7` kills the healthy replacement.

<!-- leetllm: test, id=cleanup-identity, output=show -->
```python title="cleanup-identity.py"
old_cleanup = {"slot": "A", "generation": 7, "worker_id": "worker-7"}
current_slot = {"slot": "A", "generation": 8, "worker_id": "worker-8"}
live_workers = {"worker-8"}

print(f"Mutable slot lookup targets: {current_slot['worker_id']} (wrong generation!)")
live_workers.discard(old_cleanup["worker_id"])
print(f"Immutable ID discard ({old_cleanup['worker_id']}) keeps worker-8 alive: {'worker-8' in live_workers}")
assert live_workers == {"worker-8"}
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Mutable slot lookup targets: worker-8 (wrong generation!)
Immutable ID discard (worker-7) keeps worker-8 alive: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/job_cleanup_dark.png" alt="Slot reuse and delayed cleanup lifecycle diagram showing worker-7 completing confirmed termination and baseline scrub before worker-8 reuses slot A, paired with a comparison showing that delayed generation-7 cleanup resolving slot A kills replacement worker-8 early whereas lookup by immutable worker-7 leaves worker-8 intact." />
  <figcaption>Reuse slot A only after confirmed termination and scrub (or quarantine unknown state), and address delayed teardown by immutable worker ID plus generation check.</figcaption>
</figure>

## Deterministic fuel-metered sandboxing with WebAssembly

For pure computation (parsers, data transforms, math expressions), booting a Linux container is unnecessary overhead. Wasmtime runs WebAssembly modules inside checked linear memory with zero ambient OS access unless you link host imports, and **fuel metering** deducts an integer budget per instruction so infinite loops trap deterministically with `OUT_OF_FUEL`.[^wasmtimeSecurity2026][^wasmtimeInterrupt2026][^wasmtimePyPi2026][^wasmtime_py_docs2026]

Always set fuel *before* instantiation (so a hostile `(start $init)` hook cannot spin forever during module load), cap compilation bytes, and verify every boundary with failing probes:[^wasmtimeDeterminism2026]

<!-- leetllm: test, id=wasm-sandbox, deps=wasmtime==49.0.0, output=show -->
```python title="wasm-host-and-probes.py"
import wasmtime as wasm

config = wasm.Config()
config.consume_fuel = True
engine = wasm.Engine(config)

def run_guest(wat, argument, *, fuel=1_000, memory_bytes=65_536):
    if len(wat.encode("utf-8")) > 4_096:
        raise ValueError("WAT source exceeds 4096-byte cap")
    module = wasm.Module(engine, wat)
    if module.imports:
        raise ValueError("Host imports are forbidden")
    with wasm.Store(engine) as store:
        store.set_limits(memory_size=memory_bytes, memories=1, instances=1, tables=0)
        store.set_fuel(fuel)  # Set before instantiation to meter (start) hooks too.
        instance = wasm.Instance(store, module, [])
        run = instance.exports(store).get("run")
        sig = run.type(store) if callable(run) else None
        if sig is None or [str(t) for t in sig.params] != ["i32"] or [str(t) for t in sig.results] != ["i32"]:
            raise ValueError("Expected export run(i32) -> i32")
        return run(store, argument)

def expect_error(err_cls, fn):
    try:
        fn()
    except err_cls as err:
        return err
    raise AssertionError(f"Expected {err_cls.__name__}")

def guest(body, mem=""):
    return f'(module {mem} (func (export "run") (param i32) (result i32) {body}))'

print("run(41) =", run_guest(guest("local.get 0 i32.const 1 i32.add"), 41))
loop_trap = expect_error(wasm.Trap, lambda: run_guest(guest("(loop br 0) i32.const 0"), 0))
start_trap = expect_error(wasm.Trap, lambda: run_guest('(module (func $i (loop br 0)) (start $i) (func (export "run") (param i32) (result i32) local.get 0))', 0))
oob_trap = expect_error(wasm.Trap, lambda: run_guest(guest("i32.const 65536 i32.load", "(memory 1)"), 0))
assert loop_trap.trap_code == start_trap.trap_code == wasm.TrapCode.OUT_OF_FUEL
assert oob_trap.trap_code == wasm.TrapCode.MEMORY_OUT_OF_BOUNDS
assert run_guest(guest("i32.const 1 memory.grow", "(memory 1)"), 0) == -1
expect_error(wasm.WasmtimeError, lambda: run_guest(guest("local.get 0", "(memory 2)"), 0))
expect_error(ValueError, lambda: run_guest('(module (import "host" "secret" (func)) (func (export "run") (param i32) (result i32) local.get 0))', 0))
print(f"Probes verified: loop={loop_trap.trap_code}, start={start_trap.trap_code}, oob={oob_trap.trap_code}, grow=-1")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
run(41) = 42
Probes verified: loop=TrapCode.OUT_OF_FUEL, start=TrapCode.OUT_OF_FUEL, oob=TrapCode.MEMORY_OUT_OF_BOUNDS, grow=-1
```
<!-- leetllm: output:end -->

Notice that `memory.grow` past the 64 KiB cap returns `-1` instead of trapping, whereas declaring `(memory 2)` fails instantiation immediately and reading address `65536` traps with `MEMORY_OUT_OF_BOUNDS`. If a guest needs scoped file access via a host import, resolve and verify the real target path on every `open` call (not once at setup) so symlink swaps cannot redirect reads.

## Evaluate correctness and containment separately

An agent that resolves 80% of issues while leaking canary secrets is unsafe in a way accuracy metrics hide. Track functional accuracy and containment independently.[^chen2021][^jimenez2024]

For code-generation accuracy, HumanEval's unbiased **pass@k** estimator draws $n \ge k$ independent samples, counts $c$ passing samples, and computes the exact probability that a uniform subset of $k$ indices **without replacement** contains at least one pass:[^chen2021]

$$
\widehat{\operatorname{pass@}k} = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}, \qquad 1 \leq k \leq n.
$$

With $n = 5$ candidates and $c = 2$ passes, there are $\binom{5}{2} = 10$ unordered pairs and $\binom{3}{2} = 3$ all-failing pairs, giving $\widehat{\operatorname{pass@}2} = 1 - 3/10 = 0.70$ (whereas the biased plug-in formula $1 - (3/5)^2 = 0.64$ underestimates success). Inside a multi-turn repair loop, attempt $t+1$ conditions on attempt $t$'s traceback, so apply $\widehat{\operatorname{pass@}k}$ across $n$ independent **whole trajectories**, and on repository benchmarks such as SWE-bench report infrastructure timeouts separately from failing patches.[^jimenez2024][^swebenchEvaluation2026]

<!-- leetllm: test, id=pass-at-k, output=show -->
```python title="pass-at-k.py"
from itertools import combinations
from math import comb, isclose

def pass_at_k(n, c, k):
    misses = comb(n - c, k) if n - c >= k else 0
    return 1 - misses / comb(n, k)

pool = [True, True, False, False, False]  # n=5, c=2
hits = sum(any(pair) for pair in combinations(pool, 2))
assert hits == 7 and isclose(pass_at_k(5, 2, 2), hits / 10)
for k in range(1, 6):
    print(f"pass@{k} (n=5, c=2) = {pass_at_k(5, 2, k):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pass@1 (n=5, c=2) = 0.400
pass@2 (n=5, c=2) = 0.700
pass@3 (n=5, c=2) = 0.900
pass@4 (n=5, c=2) = 1.000
pass@5 (n=5, c=2) = 1.000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pass_at_k_pairs_dark.png" alt="Upper-triangular matrix of ten unordered index pairs from five candidates where candidates 1 and 2 pass and candidates 3, 4, and 5 fail: seven green-outlined pairs contain at least one passing candidate and three red-outlined pairs contain only failures, yielding pass@2 = 7/10 = 70%." />
  <figcaption>Seven of ten unordered pairs without replacement contain at least one passing candidate, giving <code>pass@2 = 7/10 = 70%</code>.</figcaption>
</figure>

Before deploying any sandbox, run staging containment probes with dummy credentials: a **canary file probe** (verify host secrets never reach stdout/stderr), a **workspace-escape probe** (block writes to `.git/hooks/post-checkout` and `.git/config`), an **egress probe** (confirm active denial to blocked public, private, IPv6, and metadata IPs), a **storage probe** (confirm `ENOSPC` on `/tmp`), and an **orphan probe** (spawn a `setsid` child, kill the supervisor, and verify the cgroup empties).

## Summary

Reliable coding agents pair concise execution evidence with explicit trust boundaries: isolate grading behind a SHA-256 manifest digest, confine local runs with Landlock, Seatbelt, Seccomp-BPF, read-only `.git` masking, and Unix-socket secret brokering, bound server workers with cgroups and wall-clock watchdogs or WebAssembly fuel, and score accuracy separately from containment.

```mastery-quiz
[
  {
    "question": "A read-only Python test file expects a nonempty list. Candidate code shares the interpreter, monkey-patches the assertion helper, and exits 0 while returning []. What closes this flaw?",
    "options": [
      "Check the exit code from a parent script while keeping candidate and tests in one interpreter.",
      "Keep grading expectations outside candidate reach and compare outputs in a separate trusted validator.",
      "Hash the read-only test file inside the candidate interpreter.",
      "Mount the test directory read-only with noexec while sharing the Python process."
    ],
    "answer": "Keep grading expectations outside candidate reach and compare outputs in a separate trusted validator.",
    "explanation": "Read-only mounts stop disk edits, not in-memory monkey-patching or reading private tests. A separate trusted validator prevents assertion tampering."
  },
  {
    "question": "A local Linux agent grants Landlock read-write access to /repo and adds a read-only rule on /repo/.git in the same layer. Why can an untrusted patch still escape to the host?",
    "options": [
      "Grants in one Landlock layer form a union, not a subtraction, so the worker can plant .git/hooks/post-checkout to execute on the developer's next host git checkout.",
      "Landlock restricts TCP sockets only and ignores local paths.",
      "Git disables Landlock when .git/config exists.",
      "Read-only Landlock rules still permit executable scripts inside /tmp."
    ],
    "answer": "Grants in one Landlock layer form a union, not a subtraction, so the worker can plant .git/hooks/post-checkout to execute on the developer's next host git checkout.",
    "explanation": "A child read-only rule does not subtract parent write rights in the same Landlock layer. A planted hook survives worker exit and runs under host privileges during a later host Git command."
  },
  {
    "question": "Why does secret-zero containment proxy API calls through a host Unix domain socket instead of placing GITHUB_TOKEN in an offline worker's environment?",
    "options": [
      "Offline workers cannot read environment variables under --net=none.",
      "Untrusted code can base64-encode env vars into stdout logs; a host broker keeps credentials outside the sandbox, scopes routes, and allowlists reply fields.",
      "Unix sockets encrypt upstream traffic without TLS.",
      "Environment variables are slower than Unix domain sockets."
    ],
    "answer": "Untrusted code can base64-encode env vars into stdout logs; a host broker keeps credentials outside the sandbox, scopes routes, and allowlists reply fields.",
    "explanation": "Blocking networking does not stop stdout credential exfiltration. A host broker attaches tokens only on outbound calls and filters responses."
  },
  {
    "question": "A container has a cgroup CPU quota of 36 ms per 80 ms period across two busy threads and a 4-second external wall deadline. What is its aggregate CPU cap, and what kills an infinite loop?",
    "options": [
      "0.90 CPUs; hitting the 80 ms quota terminates the container.",
      "0.45 CPUs; hitting the 80 ms quota terminates the container.",
      "0.45 CPUs; the 4-second external wall deadline kills it.",
      "0.90 CPUs; the 4-second external wall deadline kills it."
    ],
    "answer": "0.45 CPUs; the 4-second external wall deadline kills it.",
    "explanation": "Both threads share 36/80 = 0.45 logical CPUs. CPU quotas only throttle; an external wall-clock watchdog terminates infinite loops."
  },
  {
    "question": "A pool of n = 6 independent trajectories contains c = 2 passes. Using the unbiased without-replacement estimator, what is pass@2?",
    "options": [
      "33.3%",
      "55.6%",
      "60.0%",
      "66.7%"
    ],
    "answer": "60.0%",
    "explanation": "comb(6,2) = 15 unordered pairs and comb(4,2) = 6 all-failing pairs give 1 - 6/15 = 60.0% (55.6% uses the biased with-replacement formula)."
  }
]
```

> **Next:** Continue to [AI Coding Workflow with Agents](/learn/ai-coding-workflow-with-agents).
