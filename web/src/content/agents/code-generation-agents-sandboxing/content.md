---
{
  "id": "code-generation-agents-sandboxing",
  "title": "Code Generation & Sandboxing",
  "slug": "code-generation-agents-sandboxing",
  "category": "LLM Agents & Tool Use",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/code_sandbox_dark.png",
  "companies": ["OpenAI", "AWS", "Google", "Anthropic", "GitHub", "Replit"],
  "shortDescription": "Build coding agents that turn runtime tracebacks into tested repairs while keeping untrusted code isolated from host secrets and grading verdicts.",
  "prerequisites": [
    "guardrails-safety-filters-production",
    "agentic-architectures-react-plan-execute",
    "structured-output-constrained-generation",
    "prompt-injection-defense-strategies"
  ],
  "keyConceptsTested": [
    "Generate-Execute-Debug Loops",
    "Sandboxing (Docker, gVisor, Firecracker, WASM)",
    "Runtime Resource Limits",
    "Trusted Validation",
    "Defense in Depth",
    "Code-Agent Evaluation"
  ],
  "relatedQuestions": [
    "computer-use-gui-browser-agents",
    "human-in-the-loop-agent-architecture",
    "ai-coding-workflow-with-agents",
    "agent-failure-states-retry-fallback",
    "observability-monitoring-llm-systems"
  ],
  "section": "Advanced Agents & Retrieval",
  "order": 8
}
---

A coding agent writes a JUnit XML parser, runs it against a test report, and immediately hits `KeyError: 'status'`. The model assumed every `<testcase>` carries a `status` attribute, whereas JUnit encodes failures and errors as child elements. That single traceback line turns a blind guess into a targeted repair: inspect child tags instead of attributes, re-run the suite, and verify the fix.

The catch sits inside the verb **runs**. Execution is what makes a coding agent dramatically stronger than pure text completion, and it is also what turns a wrong or prompt-injected patch into arbitrary code execution on your machine. If candidate code executes with your shell's privileges, it can read environment credentials, probe internal services, query a cloud metadata endpoint such as `169.254.169.254`, or exhaust host memory while still exiting with green unit tests.

Safe code-generation agents therefore combine two distinct mechanisms:

1. **An evidence-driven repair loop** that feeds concise execution feedback (exit code, failing assertion, and trimmed traceback) back to the model so each attempt narrows in on a real defect.
2. **An isolated sandbox runtime** that contains OS privileges, CPU, memory, and descendant processes while keeping test grading outside the candidate's reach.

The [ReAct and plan-and-execute architectures](/learn/agentic-architectures-react-plan-execute) organize the outer loop, and [prompt-injection defenses](/learn/prompt-injection-defense-strategies) reduce hostile instructions in prompts and tool outputs. This chapter focuses on the execution layer itself: how to turn raw failures into crisp repair signals, isolate untrusted runs, grade outputs without letting candidate code tamper with the grader, and measure correctness separately from containment.

## Turn execution failures into repair evidence

Start with a concrete parsing task. Given a JUnit XML report, return `classname::name` for every failed or errored test case in first-seen order, deduplicated by `(classname, name)`. Match status tags only as direct children in the document's root namespace, let `<skipped>` override `<failure>` or `<error>`, and reject missing or blank identifiers.

The script below compares the agent's initial broken assumption against the repaired direct-child scanner across normal, duplicated, nested, namespaced, and malformed inputs.

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

for bad in ('<testcase name="x"><failure/></testcase>',
            '<testcase classname="api" name=" "><error/></testcase>'):
    try:
        failed_tests(bad)
        raise AssertionError("Expected ValueError")
    except ValueError:
        pass

try:
    failed_tests("<testsuite>")
    raise AssertionError("Expected ParseError")
except ET.ParseError:
    print("Malformed XML rejected with ParseError")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Attempt 1 failed: KeyError('status')
Attempt 2 (standard): ['router::declined', 'router::offline', 'router::both']
Attempt 2 (namespaced): ['api::bad']
Malformed XML rejected with ParseError
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/junit_parser_trace_dark.png" alt="JUnit parser trace diagram showing the initial status-attribute lookup raising KeyError, followed by a direct-child tag scan across seven testcases: router::declined in slot 1, router::offline in slot 2, router::both merged once into slot 3, skipped ignored, duplicate declined deduplicated, nested failure outside direct children omitted, and api::skip precedence omitting error." />
  <figcaption>Direct <code>&lt;failure&gt;</code> or <code>&lt;error&gt;</code> children produce the ordered unique output list (<code>router::declined</code>, <code>router::offline</code>, <code>router::both</code>). Skipped tests, duplicate pairs, and nested non-direct tags are omitted.</figcaption>
</figure>

Notice two subtle XML details the second implementation gets right. First, writing `if case.find("failure"):` is a classic ElementTree trap: an empty `<failure/>` element has zero children, so Python evaluates it as falsy (a behavior deprecated since Python 3.12). Checking `is not None` or inspecting the direct-child tag set avoids dropping empty status elements.[^elementTree2026] Second, ElementTree expands XML namespaces into `{uri}tag`, so prefixing tags with the root namespace stops an unrelated `<other:failure/>` extension from counting as a test failure.

To keep the repair loop effective without drowning the model's context window in megabytes of logs, extract four compact pieces of evidence from every run:

- The exact command or entry point executed.
- The numeric process exit code.
- The failing assertion or exception type and message (`KeyError: 'status'`).
- Size-limited stdout and stderr, keeping the head and tail when logs are long so an early root-cause error is not lost behind trailing noise.

> **Common mistake:** Treating test output as trusted text. Tracebacks can contain attacker-controlled strings from input data, accidental secrets, or injected instructions targeting the model. Cap output bytes while reading from the worker, strip terminal control sequences before display, and stop after a fixed retry budget when the same failure repeats.

<details>
<summary>Deep dive: Hardening XML parsing against untrusted inputs</summary>

When parsing untrusted XML, cap input size, decompressed size, parsing time, and memory usage at the process level, and verify your Python runtime's linked Expat version. Modern Expat releases mitigate classic entity-expansion attacks ("billion laughs"), while older builds remain vulnerable even under a modest byte cap.[^pythonXmlSecurity2026]

</details>

Concise feedback tells the model what broke. Deciding whether a patch actually passes is a separate responsibility that must live outside the candidate's execution environment.

## Separate candidate execution from grading

If the untrusted process owns its own grade, a broken or adversarial patch can forge a passing score. Split every code-agent runner into three roles, even if the trusted pieces run inside the same control service:

1. **Trusted Supervisor:** Orchestrates the repair loop, launches and kills sandboxes, strips secrets before execution, enforces wall-clock deadlines, and stores patches.
2. **Untrusted Worker:** Executes candidate code, build scripts, and third-party dependencies inside an isolated runtime with no host credentials.
3. **Trusted Validator:** Holds the grading checks and records the verdict. For pure input/output tasks, the validator compares worker outputs against expected results in a separate trusted process. When repository unit tests must import candidate code directly, isolate the test runner carefully and verify its integrity externally.

> **Key insight:** Mounting `tests/` read-only (`:ro`) inside the worker container does not protect your grader. Candidate code can still read private test files to hardcode expected answers, and when candidate code shares a Python interpreter with the test runner, it can monkey-patch `unittest.TestCase.assertTrue = lambda *a, **k: None` or overwrite `sys.modules` so the suite exits with code `0`.

A second subtle hazard is **time-of-check to time-of-use (TOCTOU) drift**: the agent modifies a file or swaps a base commit *after* tests pass, then submits the unverified tree alongside the old green verdict. Close that gap by hashing the complete execution manifest before the run (base commit, exact candidate file bytes, container image digest, and grading suite version) and checking that digest again before accepting the patch.

A SHA-256 digest detects accidental or silent edits; verdict authenticity comes from storing that digest inside a trusted supervisor database (or signing it with a key kept strictly outside the worker). Run the script below to watch how changing any single manifest field produces a completely different fingerprint:

<!-- leetllm: test, id=artifact-binding, output=show -->
```python title="artifact-binding.py"
from copy import deepcopy
from hashlib import sha256
import json

def fingerprint(manifest):
    encoded = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()
    return sha256(encoded).hexdigest()

tested = {
    "base": "base-v1",
    "files": {"parser.py": "return failure_names(report)"},
    "environment": "image-v1",
    "grading": "tests-v1",
}
verdict = {"artifact": fingerprint(tested), "status": "pass"}
print("Verified digest:", verdict["artifact"][:12])

for field, replacement in (
    ("base", "base-v2"),
    ("files", {"parser.py": "return []"}),
    ("grading", "tests-v2"),
):
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
  <figcaption><code>H(M)</code> binds a passing verdict to the exact base commit, file bytes, environment image, and grading version. Any later edit breaks the digest match.</figcaption>
</figure>

```checkpoint
A test file is mounted read-only (:ro) inside the candidate's container. Why does that fail to protect the grading verdict?
---
Read-only mounts block disk writes, but candidate code can still read private test cases to hardcode outputs. If candidate code and the test runner share one interpreter, the candidate can also monkey-patch assertion functions in memory to force exit code 0.
```

## Four execution isolation models

With grading separated from the worker, the next design choice is the OS sandbox boundary between candidate code and your host. Four isolation technologies dominate production coding agents. Rather than ranking them on a single "weak to strong" ladder, trace where system calls terminate and what remains in the trusted computing base.

| Isolation layer | How it mediates execution | Compatibility and remaining attack surface |
| :--- | :--- | :--- |
| **Linux containers (Docker / runc)** | Uses Linux namespaces (visibility), cgroups (resource accounting), seccomp filters, and dropped capabilities. | Runs standard Linux binaries at near-native speed, but shares the host kernel. Reachable kernel bugs, permissive mounts, or exposed daemon sockets can break containment. |
| **User-space kernel (gVisor)** | The Sentry application kernel intercepts syscalls in user space and issues a small set of host syscalls. Gofer mediates filesystem access (with DirectFS as an alternative path). | High Linux compatibility with much smaller host-kernel exposure. Syscall-heavy or I/O-heavy workloads incur extra overhead that varies by workload and platform. |
| **MicroVM (Firecracker)** | Runs a dedicated guest Linux kernel inside a minimal virtual machine monitor (VMM) over Linux KVM. | Hardware virtualization isolates the guest kernel from the host kernel. Requires KVM support, guest rootfs management, and external network rules. The VMM, host kernel, and CPU hardware stay in the trusted base. |
| **WebAssembly (Wasmtime)** | Enforces checked linear memory and typed control flow in software. Host I/O exists only through explicitly linked imports or WASI. | Fast cold starts and fine-grained fuel metering, with zero ambient OS access by default. Code must compile to Wasm or run inside a Wasm interpreter; the Wasm engine itself stays in the trusted base. |

<figure>
  <img src="illustrations/_generated/runtime_isolation_paths_dark.png" alt="Comparison table across four sandbox runtimes: Docker/runc using cgroups and seccomp over a shared host kernel; gVisor using Sentry user-space kernel with Gofer filesystem proxy; Firecracker using KVM microVM with a dedicated guest kernel; and WebAssembly enforcing checked linear memory and fuel metering with zero OS exposure unless host imports are linked, paired with the import-free Wasmtime guest summary (1,000 fuel, 64 KiB memory, 4 KiB WAT max, 0 imports)." />
  <figcaption>The four runtimes differ in where untrusted calls terminate: shared host kernel, user-space Sentry kernel, KVM guest kernel, or an import-free Wasm linear memory space.</figcaption>
</figure>

A few architectural details matter when picking between them:

- **Never mount the Docker socket inside a worker.** Access to an unrestricted rootful Docker daemon effectively grants host root, because the caller can start a privileged container or bind-mount `/`. Even with a rootless daemon, keep control-plane sockets strictly outside the worker.[^dockerSecurity2026]
- **Check gVisor's platform configuration.** Sentry uses `systrap` by default and also supports a KVM platform (`ptrace` is no longer supported). Measure I/O and syscall overhead on your own build workload rather than quoting generic percentages.[^gvisorSecurity2026][^gvisorPlatforms2026]
- **Measure end-to-end Firecracker readiness, not just kernel boot.** Firecracker's specification targets at most 125 ms from `InstanceStart` to guest `/sbin/init` on tuned bare-metal instances.[^agache2020][^firecrackerSpec2026] Installing packages, configuring network rules, and starting pytest add their own latency on top of guest boot.
- **Inspect managed sandbox defaults.** Hosted sandboxes offload VM lifecycle work, but "sandbox" rarely means offline by default. Modal, for instance, allows outbound public-IP traffic unless you enable `block_network=True`, IP allowlists, or domain allowlists, and TLS-name domain filters can still be bypassed via domain fronting when unrelated domains share an edge endpoint.[^modal2026sandbox]

## Layering container containment and resource limits

Even inside a hardened container or microVM, one control covers only one failure class. Effective sandboxes pair filesystem, privilege, network, and resource limits so a runaway or hostile candidate hits a hard wall quickly.

<figure>
  <img src="illustrations/_generated/defense_in_depth_stack_dark.png" alt="Defense-in-depth container worker diagram placing a 30-second external supervisor watchdog above an unprivileged UID 10001 worker with capabilities dropped, cgroups v2 quotas (0.5 CPU, 512 MiB memory, 64 PIDs), isolated network namespace (--network=none), read-only root filesystem, and a 64 MiB noexec, nosuid temporary /tmp mount." />
  <figcaption>Layered worker containment pairs cgroup CPU, memory, and PID limits with network isolation, a read-only root filesystem, a size-limited <code>noexec</code> scratch mount, and an external 30-second supervisor timer.</figcaption>
</figure>

Here is a concrete Linux container launch command that combines these layers. In production, pin the image by immutable digest, supply a reviewed seccomp profile, and wrap the run in an external supervisor deadline:[^dockerRun2026]

```bash title="hardened-worker-launch.sh"
docker run --rm \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m,mode=1777 \
  --net=none \
  --user 10001:10001 \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --security-opt seccomp=/etc/docker/seccomp-strict.json \
  --pids-limit 64 \
  --memory 512m \
  --memory-swap 512m \
  --cpus 0.5 \
  --workdir /app \
  --entrypoint python \
  candidate-worker:reviewed-example /app/main.py
```

Trace what each flag actually enforces (and where its limit sits):

- **`--read-only` and `--tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m`:** Prevents modifying system binaries and caps scratch disk usage at 64 MiB (which also counts against the container's memory quota). Marking `/tmp` `noexec` stops direct binary execution from `/tmp`, though an interpreter can still run `python /tmp/script.py` by reading the file.[^dockerTmpfs2026]
- **`--net=none`:** Gives the container an isolated network namespace with loopback only, cutting off outbound IP connections.[^dockerNetworkNone2026]
- **`--user 10001:10001`, `--cap-drop=ALL`, and `no-new-privileges`:** Runs as an unprivileged UID with zero Linux capabilities and blocks `execve` from gaining privileges via setuid binaries.
- **`--pids-limit 64`:** Caps total tasks (processes plus threads). A fork bomb hits `EAGAIN` instead of starving the host process table.[^linuxCgroupV22026]
- **`--memory 512m --memory-swap 512m`:** Sets equal RAM and RAM+swap caps to disable swap. Crossing the limit triggers kernel memory reclaim, allocation failure, or an OOM kill.[^dockerResources2026][^linuxCgroupV22026]

Remember host-side quotas too: cap `/dev/shm`, open file descriptors, container log size (a read-only root filesystem leaves host Docker logs uncapped), and aggregate concurrency so twenty individually capped workers cannot saturate one host.

### Offline workers can still leak secrets

Cutting off networking (`--net=none`) stops a worker from phoning home, yet secrets still escape if you pass them into the worker's environment. Untrusted code only needs to run `print(os.environ)` to dump database passwords or API tokens straight into stdout, where the supervisor dutifully collects them into logs and feeds them right back into the model's context window.

Regex log scrubbers fail as soon as candidate code encodes a token with base64, hex, or reversed bytes. The reliable rule is structural: **never inject credentials into a worker that executes untrusted code.**

When candidate code needs third-party packages, split the pipeline into two phases:

1. **Dependency preparation:** Download pinned packages verified against lockfile hashes using restricted egress. Treat package install scripts (`setup.py`, post-install hooks) as untrusted code as well, with zero production credentials attached.
2. **Offline execution:** Run the candidate against the pre-populated cache or baked image with `--net=none`. (If a native C/Rust build needs executable scratch space, relax `noexec` only on that build directory rather than weakening unrelated isolation flags.)

When a task genuinely requires outbound HTTP access, enforce default-deny egress rules *outside* the worker and allow only specific destinations and protocols, covering IPv4, IPv6, DNS resolution, HTTP redirects, cloud metadata endpoints, and Unix sockets.

### CPU quotas, wall-clock deadlines, and clean teardown

> **Common mistake:** Treating `--cpus 0.5` as an execution timeout. With Linux's default 100 ms cgroup period, `--cpus 0.5` gives the container 50 ms of aggregate CPU time every 100 ms.[^dockerResources2026] An infinite loop (`while True: pass`) runs forever at half speed unless an external wall-clock watchdog kills it.

Combine CPU bandwidth throttling with a separate wall-clock deadline enforced by the supervisor (for example, a hard `SIGKILL` after 30 seconds). Note that `RLIMIT_CPU` applies per process rather than across all descendants and measures CPU time rather than elapsed wall time, so a sleeping worker can sit idle indefinitely.

Teardown has two classic traps:

1. **Escaping `killpg` with `setsid`.** Killing a single PID leaves child processes alive, and a child that calls `setsid()` moves into a new session and process group, dodging `killpg`. Rely on PID-namespace teardown (killing the namespace's init sends `SIGKILL` to every process in that namespace) or Linux cgroup v2 `cgroup.kill`, which atomically terminates every task in the job cgroup hierarchy, then verify the cgroup is empty.[^linuxSubreaper2026][^linuxSetsid2026][^linuxPidNamespaces2026][^linuxCgroupV22026]
2. **Delayed cleanup killing the wrong worker.** Suppose a supervisor crashes before reaping `worker-7` in slot `A`. A background reaper recovers, destroys `worker-7`, scrubs slot `A`, and schedules `worker-8` there. If a stale cleanup retry for generation 7 arrives later and resolves mutable slot `A` instead of immutable `worker-7`, it kills the healthy replacement job!

Watch that race play out in a few lines of Python:

<!-- leetllm: test, id=cleanup-identity, output=show -->
```python title="cleanup-identity.py"
old_cleanup = {"slot": "A", "generation": 7, "worker_id": "worker-7"}
current_slot = {"slot": "A", "generation": 8, "worker_id": "worker-8"}
live_workers = {"worker-8"}  # worker-7 was already destroyed and slot A reused.

slot_target = current_slot["worker_id"]
immutable_target = old_cleanup["worker_id"]

print(f"Resolving mutable slot A targets: {slot_target} (alive: {slot_target in live_workers})")
live_workers.discard(immutable_target)
print(f"Retrying immutable ID {immutable_target} keeps worker-8 alive: {'worker-8' in live_workers}")
assert live_workers == {"worker-8"}
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Resolving mutable slot A targets: worker-8 (alive: True)
Retrying immutable ID worker-7 keeps worker-8 alive: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/job_cleanup_dark.png" alt="Slot reuse and delayed cleanup lifecycle diagram showing worker-7 completing confirmed termination and baseline scrub before worker-8 reuses slot A, paired with a comparison showing that delayed generation-7 cleanup resolving slot A kills replacement worker-8 early whereas lookup by immutable worker-7 leaves worker-8 intact." />
  <figcaption>Slot A accepts generation 8 only after confirmed termination and scrubbing (or quarantine on unknown exit status). Delayed cleanup retries must address the immutable worker ID rather than the mutable slot name.</figcaption>
</figure>

Store worker ID, lease generation, and deadline in durable control-plane state so an independent reaper still knows what to destroy after a supervisor crash. If a backend only destroys by slot name, enforce the expected generation atomically inside the destroy call, and quarantine any slot whose cleanup cannot be confirmed rather than reusing it.

## Deterministic fuel-metered sandboxing with WebAssembly

When an agent only needs to run pure computation (data transforms, parsers, math expressions, or small plugins), booting a full Linux container is overkill. WebAssembly (Wasm) gives you checked linear memory, typed control flow, and zero ambient OS access unless you explicitly link host imports or WASI.[^wasmtimeSecurity2026]

With Wasmtime's **fuel metering** enabled, every guest instruction deducts from a fixed integer budget; hitting zero traps immediately with `OUT_OF_FUEL`. Fuel is deterministic across identical execution paths, though fuel units are not wall-clock milliseconds and do not meter module compilation or host-function execution (Wasmtime also supports epoch-based interruption for wall-clock preemption).[^wasmtimeInterrupt2026]

Here is a complete, import-free Wasmtime host embedding that runs a guest function `run(i32) -> i32` inside a 64 KiB linear memory cap and a 1,000-unit fuel budget.[^wasmtimePyPi2026][^wasmtime_py_docs2026] Notice that fuel is set *before* instantiation: a malicious Wasm module can define a `(start $fn)` hook that loops during instantiation before `run` is ever called.

<!-- leetllm: test, id=wasm-host, deps=wasmtime==49.0.0, output=show -->
```python title="wasm-host.py"
import wasmtime as wasm

config = wasm.Config()
config.consume_fuel = True
engine = wasm.Engine(config)

def run_guest(wat, argument, *, fuel=1_000, memory_bytes=65_536):
    if not (1 <= fuel <= 100_000) or not (1 <= memory_bytes <= 65_536):
        raise ValueError("Resource budget out of allowed range")
    if not (-(2**31) <= argument < 2**31):
        raise ValueError("Argument must fit in a signed i32")
    if len(wat.encode("utf-8")) > 4_096:
        raise ValueError("WAT source exceeds 4096-byte compilation cap")

    module = wasm.Module(engine, wat)
    if module.imports:
        raise ValueError("Host imports are forbidden")

    with wasm.Store(engine) as store:
        store.set_limits(memory_size=memory_bytes, memories=1, instances=1, tables=0)
        store.set_fuel(fuel)  # Set before instantiation so start hooks consume fuel too.
        instance = wasm.Instance(store, module, [])
        run = instance.exports(store).get("run")
        if run is None or not callable(run):
            raise ValueError("Module must export function 'run'")
        sig = run.type(store)
        if [str(t) for t in sig.params] != ["i32"] or [str(t) for t in sig.results] != ["i32"]:
            raise ValueError("Expected signature run(i32) -> i32")
        return run(store, argument)

ADD_ONE = """(module
  (func (export "run") (param i32) (result i32)
    local.get 0 i32.const 1 i32.add))"""

for value in (41, -1, 2**31 - 1):
    print(f"run({value}) = {run_guest(ADD_ONE, value)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
run(41) = 42
run(-1) = 0
run(2147483647) = -2147483648
```
<!-- leetllm: output:end -->

Notice the third line: `2147483647 + 1` wraps to `-2147483648` under WebAssembly's two's-complement `i32.add` semantics.

### Probe every sandbox wall directly

Never assume a sandbox control works until you test it with a failing probe. Continuing in the same Wasmtime environment, let us fire six hostile guests at `run_guest`: an infinite loop in `run`, an infinite loop in a `(start)` hook, a `memory.grow` request past 64 KiB, an oversized two-page memory declaration, an out-of-bounds `i32.load`, and an unauthorized host import.

<!-- leetllm: test, id=wasm-boundaries, continue=wasm-host, deps=wasmtime==49.0.0, output=show -->
```python title="wasm-boundaries.py"
def expect_error(error_type, fn):
    try:
        fn()
    except error_type as err:
        return err
    raise AssertionError(f"Expected {error_type.__name__}")

def guest(body, memory=""):
    return f'(module {memory} (func (export "run") (param i32) (result i32) {body}))'

# 1. Infinite loop in run() and in a (start) hook both exhaust fuel.
loop_trap = expect_error(wasm.Trap, lambda: run_guest(guest("(loop br 0) i32.const 0"), 0))
start_loop = '''(module
  (func $init (loop br 0)) (start $init)
  (func (export "run") (param i32) (result i32) local.get 0))'''
start_trap = expect_error(wasm.Trap, lambda: run_guest(start_loop, 0))
assert loop_trap.trap_code == start_trap.trap_code == wasm.TrapCode.OUT_OF_FUEL

# 2. Failed memory.grow returns -1 instead of trapping; oversized declaration fails instantiation.
assert run_guest(guest("i32.const 1 memory.grow", "(memory 1)"), 0) == -1
expect_error(wasm.WasmtimeError, lambda: run_guest(guest("local.get 0", "(memory 2)"), 0))

# 3. Reading past the 64 KiB linear memory page traps with MEMORY_OUT_OF_BOUNDS.
oob_trap = expect_error(wasm.Trap, lambda: run_guest(guest("i32.const 65536 i32.load", "(memory 1)"), 0))
assert oob_trap.trap_code == wasm.TrapCode.MEMORY_OUT_OF_BOUNDS

# 4. Unauthorized host imports and wrong signatures are rejected before execution.
imported = '(module (import "host" "read_secret" (func)) (func (export "run") (param i32) (result i32) local.get 0))'
wrong_sig = '(module (func (export "run") (result i32) i32.const 0))'
expect_error(ValueError, lambda: run_guest(imported, 0))
expect_error(ValueError, lambda: run_guest(wrong_sig, 0))
expect_error(ValueError, lambda: run_guest(" " * 4_097, 0))

print("Loop trap:    ", loop_trap.trap_code)
print("Start trap:   ", start_trap.trap_code)
print("OOB load trap:", oob_trap.trap_code)
print("memory.grow past cap returned -1; oversized memory, imports, and bad signatures rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Loop trap:     TrapCode.OUT_OF_FUEL
Start trap:    TrapCode.OUT_OF_FUEL
OOB load trap: TrapCode.MEMORY_OUT_OF_BOUNDS
memory.grow past cap returned -1; oversized memory, imports, and bad signatures rejected
```
<!-- leetllm: output:end -->

Because zero imports are linked, a guest cannot touch the filesystem, sockets, or environment variables. If your workload needs scoped file reads, expose a narrow host function that validates the real resolved path on every call (guarding against symlinks and path traversal), and still wrap the host process itself with OS memory and wall-clock limits.

<details>
<summary>Deep dive: Wasm determinism limits</summary>

Repeatable fuel interruption guarantees a consistent step count for a fixed deterministic guest, but WebAssembly execution still has nondeterministic corners when reproducibility matters: floating-point NaN bit patterns, relaxed SIMD instructions, memory-growth allocation failures under host pressure, and any nondeterministic host imports (such as clocks or random number generators).[^wasmtimeDeterminism2026]

</details>

## Evaluate correctness and containment as separate axes

A coding agent that solves 80% of issues while leaking host credentials is broken in a way no accuracy score will catch. Track functional correctness and sandbox containment independently.[^chen2021][^jimenez2024]

### Unbiased pass@k estimation

To measure code-generation accuracy with low variance, the HumanEval benchmark introduced an unbiased estimator for **pass@k**: the probability that at least one of $k$ generated solutions passes unit tests.[^chen2021] Draw $n \ge k$ independent samples for a task and observe $c$ passing solutions. If you choose $k$ distinct sample indices uniformly **without replacement**, the probability that every chosen index fails is $\binom{n-c}{k} / \binom{n}{k}$, so:

$$
\widehat{\operatorname{pass@}k} = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}, \qquad 1 \leq k \leq n.
$$

Work through a tiny pool by hand: suppose $n = 5$ candidates yield $c = 2$ passing solutions, and we want $\widehat{\operatorname{pass@}2}$. There are $\binom{5}{2} = 10$ unordered pairs of candidates, and $\binom{5-2}{2} = \binom{3}{2} = 3$ pairs contain only failures. Seven of the ten pairs contain at least one passing solution:

$$
\widehat{\operatorname{pass@}2} = 1 - \frac{3}{10} = 0.70 \quad (70\%).
$$

Contrast this with the naive plug-in formula $1 - (1 - c/n)^k = 1 - (3/5)^2 = 0.64$, which samples *with* replacement and systematically underestimates fresh-sample success. Note also that "without replacement" refers to sample *indices*; two independent draws can still produce identical code unless you deduplicate separately.[^chen2021]

Let us verify the exact combinatorics against brute-force enumeration of all index pairs:

<!-- leetllm: test, id=pass-at-k, output=show -->
```python title="pass-at-k.py"
from itertools import combinations
from math import comb, isclose

def pass_at_k(n, c, k):
    if not (n >= 1 and 0 <= c <= n and 1 <= k <= n):
        raise ValueError("Require n >= 1, 0 <= c <= n, and 1 <= k <= n")
    misses = comb(n - c, k) if n - c >= k else 0
    return 1 - misses / comb(n, k)

pool = [True, True, False, False, False]  # n=5, c=2
pairs = list(combinations(pool, 2))
hits = sum(any(pair) for pair in pairs)
assert hits == 7 and isclose(pass_at_k(5, 2, 2), hits / len(pairs))

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
  <figcaption>Each cell represents one unordered pair of candidate indices without replacement. Seven of ten equally likely pairs contain at least one pass, giving <code>pass@2 = 7/10 = 70%</code>.</figcaption>
</figure>

> **Key insight:** Inside a multi-turn repair loop, attempt $t+1$ conditions on the traceback from attempt $t$, so consecutive patches are *not* independent draws for $\widehat{\operatorname{pass@}k}$. To use the unbiased estimator on an agent, sample $n$ independent **whole trajectories** under a fixed configuration and grade each trajectory's final patch.

On repository-level benchmarks such as SWE-bench, the harness evaluates final patches against real repository test suites rather than prescribing one agent loop or cost cap.[^jimenez2024][^swebenchEvaluation2026] Pin task commits, container images, tools, and attempt budgets, and report infrastructure timeouts separately from failing patches.

### Containment probes for staging

Test your sandbox in a disposable staging environment with dummy credentials and supervisor-enforced limits before running untrusted code in production:

- **Canary file probe:** Place a dummy credential on the host outside mounted paths and verify the worker cannot read it (and that no canary string appears in captured stdout or stderr).
- **Egress probe:** Attempt a connection to a blocked test endpoint, private address, IPv6 target, and cloud metadata IP; verify an active denial rather than an unreachable host.
- **Storage probe:** Write past the `/tmp` scratch cap and confirm `ENOSPC` triggers cleanly while host disk and log quotas stay intact (remembering that `ENOSPC` alone does not kill the worker; the wall-clock timer still handles teardown).
- **Orphan probe:** Spawn a background child under `setsid`, kill the job supervisor, and confirm the independent reaper kills every descendant and quarantines any unconfirmed slot.
- **Cross-job hygiene probe:** Inspect files, environment variables, mounts, running processes, and inherited file descriptors at the start of the next job against a clean baseline.

## Summary

The JUnit parser improved because a single clear traceback pointed straight to the wrong assumption. Reliable coding agents pair that feedback loop with four clear engineering separations: what failed (concise, untrusted execution evidence), what code can touch (OS or Wasm isolation with CPU, memory, PID, and wall-clock limits), who judges success (an independent validator outside the worker), and which exact bytes were tested (a manifest digest verified before accepting the patch).

```mastery-quiz
[
  {
    "question": "A supervisor has TRACE_TAG=parent in its environment. It launches Python in /tmp/job-a with env={'MODE': 'check'}, and the worker reads /work/input.txt. On a second run, only the working directory changes to /tmp/job-b. Does the worker inherit TRACE_TAG, and can it still read the same absolute path?",
    "options": [
      "TRACE_TAG is present. The file is readable.",
      "TRACE_TAG is absent. The file is readable.",
      "TRACE_TAG is present. The file is inaccessible.",
      "TRACE_TAG is absent. The file is inaccessible."
    ],
    "answer": "TRACE_TAG is absent. The file is readable.",
    "explanation": "The supervisor sets the worker's environment explicitly with MODE and omits TRACE_TAG. Changing the working directory alters relative path resolution while leaving absolute paths such as /work/input.txt unchanged."
  },
  {
    "question": "A read-only Python test file expects a nonempty list. The candidate replaces an assertion method in the shared interpreter and returns []; the runner exits 0. Which plan fixes this grading vulnerability?",
    "options": [
      "Keep candidate and assertions together; compare the runner exit code in a second process.",
      "Keep expected output outside candidate control; compare the returned list in a trusted validator.",
      "Keep expected output on a read-only mount; compare it using the candidate interpreter.",
      "Keep candidate and assertions together; bind their reported pass to a fresh output hash."
    ],
    "answer": "Keep expected output outside candidate control; compare the returned list in a trusted validator.",
    "explanation": "The candidate changed the in-memory grader while leaving the test file unchanged. An external pure input-output comparison sees [] differ from the protected expected list. Exit codes or hashes do not restore trust in a compromised assertion function."
  },
  {
    "question": "A job with two busy threads has a cgroup CPU quota of 36 ms per 80 ms period. It still has work to do when it spends the first period's quota. A supervisor has set a wall deadline of 4 seconds. What is the job's aggregate CPU limit, and which event ends this run if the threads keep looping?",
    "options": [
      "0.90 logical CPUs. The wall deadline ends the run.",
      "0.45 logical CPUs. Spending the first period's quota ends the run.",
      "0.90 logical CPUs. Spending the first period's quota ends the run.",
      "0.45 logical CPUs. The wall deadline ends the run."
    ],
    "answer": "0.45 logical CPUs. The wall deadline ends the run.",
    "explanation": "The threads share 36 ms per period, so their combined limit is 36/80 = 0.45 logical CPUs. A limit of 0.90 would give each thread its own quota. Spending the quota throttles the job until the next period. The supervisor's wall timer starts teardown if the job is still running at four seconds."
  },
  {
    "question": "A network probe records an enforced denial. A trusted validator expects [api::retry] for a parser test case and receives [api::retry]. The supervisor also finds the worker's canary secret in the stderr log it collected. How should it score the parser test case and the secret-containment check?",
    "options": [
      "The parser test case passes and the secret check fails.",
      "The parser test case fails and the secret check passes.",
      "The parser test case passes and the secret check passes.",
      "The parser test case fails and the secret check fails."
    ],
    "answer": "The parser test case passes and the secret check fails.",
    "explanation": "The returned list matches the validator's expected output, so the parser passes this case. Because the supervisor observed the canary secret in collected stderr, the containment check fails even though outbound networking was blocked."
  },
  {
    "question": "A WebAssembly memory has two 65,536-byte pages, both filled with zeros. Its maximum is two pages. One guest probe requests one more page with memory.grow. An independent probe uses i32.load to read four bytes starting at address 131,068. What does each probe observe?",
    "options": [
      "Growth traps. The load returns 0.",
      "Growth returns -1. The load traps.",
      "Growth returns -1. The load returns 0.",
      "Growth traps. The load traps."
    ],
    "answer": "Growth returns -1. The load returns 0.",
    "explanation": "The third page exceeds the maximum, so memory.grow returns -1 to the guest. The two pages contain 131,072 bytes, with addresses 0 through 131,071. The load reads 131,068 through 131,071 inclusive. All four bytes fit and contain zero, so the load returns 0."
  },
  {
    "question": "A WebAssembly worker has permission to read one report. Its host file reader accepts a catalog alias and resolves it each time it opens a file. The alias initially points to the report, then points to an archive of the same size. Which check enforces the grant across both calls?",
    "options": [
      "At setup, check that the alias points to the granted report.",
      "At each call, check that the alias string fits inside guest memory.",
      "At each open, check that the file being opened is the granted report.",
      "At each return, check that the byte count matches the granted report's size."
    ],
    "answer": "At each open, check that the file being opened is the granted report.",
    "explanation": "Checking the file's identity as part of opening it allows the report and refuses the archive. The setup check becomes stale when the alias changes. A guest memory check only verifies that the host can read the alias string. A byte count cannot distinguish the two files because they have the same size."
  },
  {
    "question": "Runtime worker-12 was terminated and its slot reset before worker-13 entered slot A. A delayed cleanup record names generation 12/worker-12; the slot map names generation 13/worker-13. Which action preserves the replacement?",
    "options": [
      "Destroy current slot occupant worker-13; update slot status without a generation condition.",
      "Destroy recorded worker-12; update slot status only under the recorded generation condition.",
      "Destroy recorded worker-12; mark current slot A free without a generation condition.",
      "Destroy current slot occupant worker-13; update slot status only under generation 13."
    ],
    "answer": "Destroy recorded worker-12; update slot status only under the recorded generation condition.",
    "explanation": "The delayed action belongs to immutable worker-12. It must not resolve the reusable slot to worker-13 or overwrite generation 13 state. A reusable-name backend also needs generation enforcement inside the destructive action to avoid a check-then-act race."
  },
  {
    "question": "A fixed pool has 6 candidate indices, of which 2 pass. Select 2 indices uniformly without replacement. What is the probability of at least one pass?",
    "options": [
      "33.3%",
      "55.6%",
      "60.0%",
      "66.7%"
    ],
    "answer": "60.0%",
    "explanation": "There are choose(6,2)=15 pairs and choose(4,2)=6 all-failing pairs. Success is 1 - 6/15 = 9/15 = 60%. The 55.6% calculation uses replacement and describes a different selection experiment."
  },
  {
    "question": "Two protected validator reports record passes for the same files, dependencies and grader. One covers base R7 on image I1. The other covers base R6 on image I2. The submission uses R7 on I2. Which decision follows?",
    "options": [
      "Accept using the R7 report as evidence for both images.",
      "Accept using the I2 report as evidence for both bases.",
      "Hold acceptance and use a new R7 run on I1 to grade this submission.",
      "Hold acceptance and use a new R7 run on I2 to grade this submission."
    ],
    "answer": "Hold acceptance and use a new R7 run on I2 to grade this submission.",
    "explanation": "Each validator report covers the base and image that the validator tested together. The R7 report has the wrong image. The I2 report has the wrong base. Repeating R7 on I1 would test the old image again. A trusted run on R7 and I2 with the same files, dependencies and grader tests the submitted combination."
  },
  {
    "question": "A JUnit report lists five cases in order. All tags use the root namespace, and every case has class cart. Write has direct failure and error children. Wait has direct skipped and error children. Note has only details containing a failure. Flush has a direct failure. Write appears again with a direct failure. A direct failure or error qualifies a case unless a direct skipped child is present. Which output lists each qualifying class/name pair once, in first-seen order?",
    "options": [
      "[cart::Write, cart::Flush, cart::Write]",
      "[cart::Flush, cart::Write]",
      "[cart::Write, cart::Wait, cart::Note, cart::Flush]",
      "[cart::Write, cart::Flush]"
    ],
    "answer": "[cart::Write, cart::Flush]",
    "explanation": "Write qualifies on its first occurrence even with two status children. Including Wait and Note would count errors in skipped cases and failures nested under details. Flush qualifies next. Appending Write again would report the same pair twice. Putting Flush first would lose the position earned by the first Write."
  }
]
```

> **Next:** Continue to [Local Agent Sandboxing: Seatbelt, Landlock & Workspace Boundaries](/learn/local-agent-sandboxing-seatbelt-landlock). The boundaries in this chapter still assume a supervisor you control. The next chapter asks what changes when the worker is a coding agent on a laptop, where the user account, workspace, and secrets sit much closer.
