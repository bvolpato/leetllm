---
{
  "id": "code-generation-agents-sandboxing",
  "title": "Code Generation & Sandboxing",
  "slug": "code-generation-agents-sandboxing",
  "category": "LLM Agents & Tool Use",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/code_sandbox_dark.png",
  "companies": ["OpenAI", "AWS", "Google", "Anthropic", "GitHub", "Replit"],
  "shortDescription": "Help coding agents turn runtime errors into tested repairs while keeping untrusted code separated from host secrets and grading verdicts.",
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

A code agent writes a JUnit XML parser, runs it against a sample test report, and hits `KeyError: 'status'`. The candidate assumed each `<testcase>` carries a `status` attribute, whereas in the XML below, failures and errors appear as child elements. That traceback gives the next attempt a concrete hypothesis to repair. Run the revised parser against the report and check its expected output.

The risk sits inside that simple word: **executes**. Candidate code and its dependencies can be buggy or malicious. Running with the host user's privileges lets code inspect environment variables, probe internal networks, query a cloud metadata endpoint such as `169.254.169.254`, or exhaust system resources. Passing unit tests shows neither authorization nor system safety.

Running untrusted candidates safely requires pairing two mechanisms together:

1. **An evidence-driven repair loop:** Extracts bounded execution feedback (exit codes, exact assertion failures, and truncated tracebacks) so the model refines its patch iteratively.
2. **An isolated sandbox runtime:** Restricts OS capabilities and resources, contains descendant processes, and keeps grading decisions outside candidate control. Match the isolation technology to the workload and threat model; stacking multiple runtimes is rarely necessary.

The [plan-and-execute pattern](/learn/agentic-architectures-react-plan-execute) can organize the outer loop, while [prompt-injection defenses](/learn/prompt-injection-defense-strategies) reduce hostile instructions without making arbitrary execution safe. This chapter separates repair evidence, execution containment, and independent grading. Passing checks verifies behavior on tested inputs rather than proving complete program correctness.

## Make the next attempt depend on evidence

Define the parser specification first: return `classname::name` for failed or errored cases in first-seen order, deduplicating by `(classname, name)`. Status tags must be direct children in the root namespace, a `<skipped>` child takes precedence over `<failure>` or `<error>`, and missing or blank identifiers are invalid. These rules keep our parser deterministic across the suite below, even though real JUnit emitters vary in structure.

The regression suite below demonstrates this repair loop directly, comparing the initial broken assumption against the repaired direct-child scanner on the same XML report. Never execute arbitrary model-generated code in the host Python interpreter; always place it inside an isolated runtime the candidate does not control.

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

def broken(xml):
    return [case.attrib["name"] for case in ET.fromstring(xml).iter("testcase")
            if case.attrib["status"] == "failed"]

def failed_tests(xml):
    root = ET.fromstring(xml)
    namespace = root.tag[:root.tag.index("}") + 1] if root.tag.startswith("{") else ""
    result = []
    seen = set()
    for case in root.iter(f"{namespace}testcase"):
        children = {child.tag for child in case}
        if f"{namespace}skipped" in children:
            continue
        if not children.intersection({f"{namespace}failure", f"{namespace}error"}):
            continue
        identity = (case.get("classname"), case.get("name"))
        if any(value is None or not value.strip() for value in identity):
            raise ValueError("A failing case needs classname and name")
        if identity not in seen:
            seen.add(identity)
            result.append(f"{identity[0]}::{identity[1]}")
    return result

try:
    broken(REPORT)
except KeyError as error:
    assert error.args == ("status",)
    print("First candidate: KeyError('status')")
else:
    raise AssertionError("The broken candidate unexpectedly passed")

assert failed_tests(REPORT) == [
    "router::declined", "router::offline", "router::both"
]
assert failed_tests("<testsuite/>") == []
NAMESPACED = '''<testsuite xmlns="urn:example:junit" xmlns:other="urn:other">
  <testcase classname="api" name="bad"><failure/></testcase>
  <testcase classname="api" name="foreign"><other:failure/></testcase>
  <testcase classname="api" name="skip"><skipped/><error/></testcase>
</testsuite>'''
assert failed_tests(NAMESPACED) == ["api::bad"]
for invalid in ('<testcase name="x"><failure/></testcase>',
                '<testcase classname="api" name=" "><error/></testcase>'):
    try:
        failed_tests(invalid)
    except ValueError:
        pass
    else:
        raise AssertionError("Missing or blank identifier was accepted")
try:
    failed_tests("<testsuite>")
except ET.ParseError:
    pass
else:
    raise AssertionError("Malformed XML was accepted")
print("Repair: status, duplicates, namespaces, identifiers and malformed XML checked")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
First candidate: KeyError('status')
Repair: status, duplicates, namespaces, identifiers and malformed XML checked
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/junit_parser_trace_dark.png" alt="JUnit parser trace diagram showing the initial status-attribute lookup raising KeyError, followed by a direct-child tag scan across seven testcases: router::declined in slot 1, router::offline in slot 2, router::both merged once into slot 3, skipped ignored, duplicate declined deduplicated, nested failure outside direct children omitted, and api::skip precedence omitting error." />
  <figcaption>Direct failure or error children feed the ordered unique output list (<code>router::declined</code>, <code>router::offline</code>, <code>router::both</code>). Skipped probes, repeated pairs, and nested non-direct tags are omitted.</figcaption>
</figure>

The original lookup also invites an ElementTree pitfall: `if case.find("failure"):` treats a childless element as false in current Python, and truth-value testing has been deprecated since Python 3.12. Use `is not None` for existence, or compare direct child tags as above. Namespace expansion turns `failure` into `{uri}failure`; matching the namespace prevents a foreign extension element from becoming a failure verdict. The assertions now check both repeated test cases and a case containing two status elements.[^elementTree2026]

Give the agent feedback it can act on without turning its context into a log dump:

- The entry point or shell command invoked.
- The numeric process exit status code.
- The exact failing assertion or exception name (`KeyError: 'status'`).
- Byte-bounded stdout and stderr, plus selected beginning/end lines when useful. One line can contain megabytes, and the root cause may precede the tail.

Treat feedback as untrusted data: a traceback can contain attacker-controlled strings, secrets, or forged instructions. Limit bytes while collecting output, escape terminal control sequences before display, and cap retries. Repeated identical failures justify diagnosis or triage, not broader privileges. For untrusted XML, bound input/decompressed size, parsing time, and memory, and check the actual Expat version. Current Python documents protections that depend on Expat's version. A byte cap alone doesn't eliminate parser vulnerabilities.[^pythonXmlSecurity2026]

Bounded feedback tells the next attempt what failed. Judging whether the patch passes is a separate decision owned by an independent component outside the candidate runtime.

## Separate candidate execution from grading decisions

The model that reads the traceback shouldn't also own the grade. Separate these responsibilities, even when trusted components share a service:

1. **The Trusted Supervisor:** Manages the repair loop, provisions sandboxes, enforces execution timeouts, strips secrets, and applies patches.
2. **The Untrusted Worker:** Contains the untrusted candidate code, third-party libraries, build scripts, and untrusted execution tools.
3. **The Trusted Validator:** Owns grading rules and reports observed behavior. For pure input/output tasks, it can compare worker results to expected outputs outside the worker. Repository tests may need to execute alongside candidate code; that makes runner integrity and independent result checks important.

A read-only test mount doesn't by itself establish trustworthy or confidential grading:

- **Read-only files remain readable:** Untrusted candidate code can open `tests/test_oracle.py`, inspect private test assertions, discover edge cases, and hardcode answers without solving the actual problem.
- **In-process test tampering:** When the test runner shares an interpreter with candidate code, the candidate can monkey-patch `unittest.TestCase.assertTrue = lambda *a, **k: None`, overwrite `sys.modules`, or hijack exception handlers. The test suite exits with status code 0, falsely claiming complete validation.

To detect a time-of-check to time-of-use (TOCTOU) mismatch, bind the result to the actual tested artifact. Record the base commit, candidate file bytes or resulting tree, dependencies/image digest, grading version, and job ID. A patch-diff hash alone omits its base and other executable files. Hash the frozen artifact before execution, protect it from mutation, and compare it again when accepting the result or applying the patch.

A test report must come from an authenticated trusted validator. A protected database record may suffice; a transferable report can use a verified signature with the signing key outside the worker. `SHA-256` alone neither authenticates a verdict nor prevents edits, and nothing "immediately" invalidates a changed artifact unless an enforcement step checks it. Even a valid test report proves only that the recorded checks passed for that artifact and environment.

Verify how mutating any manifest field invalidates the artifact fingerprint held by the trusted supervisor:

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
trusted_report = {"artifact": fingerprint(tested), "verdict": "pass"}
assert fingerprint(tested) == trusted_report["artifact"]
for field, replacement in (("base", "base-v2"),
                           ("files", {"parser.py": "return []"}),
                           ("grading", "tests-v2")):
    changed = deepcopy(tested)
    changed[field] = replacement
    assert fingerprint(changed) != trusted_report["artifact"]
print("Same manifest matches; changed base, file or grading version doesn't")
print("Hash comparison detects change; report authenticity is a separate requirement")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Same manifest matches; changed base, file or grading version doesn't
Hash comparison detects change; report authenticity is a separate requirement
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/code_sandbox_dark.png" alt="Artifact manifest binding diagram linking Manifest M (base, code, tests) via canonical SHA-256 digest H(M) to a trusted verdict ledger, followed by candidate acceptance checks: unchanged M matches H(M) and passes verification, while changing to base-v2, editing parser.py, or changing to tests-v2 mismatches and is rejected. Deployment still requires explicit approval." />
  <figcaption><code>H(M)</code> binds a passing verdict to the exact base commit, file bytes, environment, and grading version. Any later mutation invalidates the digest match, while promotion itself still requires explicit approval.</figcaption>
</figure>

```checkpoint
A test file is mounted read-only (:ro) inside the candidate's container. Why can't that alone protect the grading verdict?
---
Read-only mounts prevent disk writes, but candidate code can still inspect private test cases. If the candidate and test runner share an interpreter, candidate code can monkey-patch assertion functions in memory to force a passing exit code.
```

## Four execution isolation models compared

Once grading logic stays outside the worker, an isolation layer must stand between candidate code and the host machine. Trace what mediates each request and which components still sit beneath it. Linux namespaces restrict what processes can see, while control groups (cgroups) account for and limit resources. A virtual machine monitor (VMM) runs an isolated guest machine using facilities such as Linux KVM, and the WebAssembly System Interface (WASI) exposes explicitly linked host APIs to Wasm modules.

These alternatives do not form a simple ascending security ranking. Startup benchmarks also depend on the chosen endpoint: image pull, runtime creation, guest boot, module compilation, and first user execution measure distinct steps.

| Runtime and isolation layer | Compatibility and remaining exposure |
| :--- | :--- |
| **Container:** Docker/runc uses namespaces, cgroups, configured seccomp filters, and capabilities. | General Linux processes share the host kernel. Permitted mounts, devices, and daemon access can bypass intended limits. |
| **gVisor:** The Sentry application kernel intercepts syscalls with restricted host interactions. | Many Linux workloads run cleanly, though syscall compatibility and I/O overhead vary with workload and configuration. Gofer mediates filesystem access, with options such as DirectFS changing that path. |
| **Firecracker:** A microVM runs a guest kernel and minimal VMM over Linux KVM. | Requires KVM support, guest/image management, and external resource/network policy. The VMM, host kernel, devices, and hardware remain in the trusted computing base. |
| **Wasm:** The runtime checks linear-memory bounds and typed control flow. Host interfaces must be explicitly linked. | Code must compile to Wasm or run inside a Wasm interpreter. WASI and host imports grant capabilities, while fuel metering is an optional runtime control. |

A reachable kernel vulnerability can break standard container isolation, though not every kernel bug is reachable or yields an escape. Access to an unrestricted **rootful** Docker daemon typically grants host-root privileges because the caller can launch privileged containers or mount host paths, whereas a rootless daemon alters the user privilege scope. Keep daemon and control-plane sockets outside the worker either way.[^dockerSecurity2026]

<figure>
  <img src="illustrations/_generated/runtime_isolation_paths_dark.png" alt="Comparison table across four sandbox runtimes: Docker/runc using cgroups and seccomp over a shared host kernel; gVisor using Sentry user-space kernel with Gofer filesystem proxy; Firecracker using KVM microVM with a dedicated guest kernel; and WebAssembly enforcing checked linear memory and fuel metering with zero OS exposure unless host imports are linked, paired with the import-free Wasmtime guest summary (1,000 fuel, 64 KiB memory, 4 KiB WAT max, 0 imports)." />
  <figcaption>Four mediation paths differ in where host calls terminate. The Wasm embedding below links zero imports and bounds guest work to 1,000 fuel steps and 64 KiB linear memory.</figcaption>
</figure>

gVisor's Sentry implements much of the Linux application interface in Go and limits its own host interactions. It still relies on the host OS and other trusted components. Gofer isn't an "off-host" filesystem service by definition. Current gVisor uses `systrap` by default, supports a KVM platform, and documents `ptrace` as no longer supported. None of these options provides a universal 10–30% I/O overhead.[^gvisorSecurity2026][^gvisorPlatforms2026]

Firecracker uses Linux KVM and a deliberately small device model.[^agache2020] Its published specification targets at most 125 ms **from InstanceStart to guest `/sbin/init`**, under a tuned minimal setup on specified metal instances.[^firecrackerSpec2026] Provisioning dependencies, applying network policy, and starting a test runner add separate work; measure readiness for the complete agent workload.

Managed sandbox APIs move provisioning and lifecycle work into a service. Inspect the exact product's defaults and limits. As checked October 16, 2026, Modal permits outbound public-IP connections by default and offers `block_network=True`, IP-range allowlists, and a domain allowlist in Beta. Its domain allowlist filters TLS names, without inspecting request bodies. Domains sharing an endpoint can permit domain fronting, where an allowed TLS name carries a request for another domain. "Sandbox" doesn't automatically mean offline.[^modal2026sandbox]

## Multi-layer containment and resource controls

Combine controls targeting distinct failure modes so no single gap compromises the host. Defense layers reinforce one another depending on configuration, rather than independently stopping every class of attack.

<figure>
  <img src="illustrations/_generated/defense_in_depth_stack_dark.png" alt="Defense-in-depth container worker diagram placing a 30-second external supervisor watchdog above an unprivileged UID 10001 worker with capabilities dropped, cgroups v2 quotas (0.5 CPU, 512 MiB memory, 64 PIDs), isolated network namespace (--network=none), read-only root filesystem, and a 64 MiB noexec, nosuid temporary /tmp mount." />
  <figcaption>Layered worker containment pairs cgroup memory, PID, and CPU quotas with network isolation, a read-only root filesystem, a bounded <code>noexec</code> scratch mount, and an external 30-second supervisor watchdog.</figcaption>
</figure>

This Docker invocation illustrates a hardened Linux worker launch. Production use also pairs it with a reviewed worker image pinned by immutable digest containing `/app/main.py` and an audited seccomp profile at the specified path, backed by an external supervisor wall-clock timer.[^dockerRun2026]

```bash title="bounded-worker-launch.sh"
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

These parameters enforce concrete limits:

- `--read-only` makes the container root filesystem read-only. Writable mounts, `/tmp`, and memory still exist; the flag doesn't prevent malicious code from running.
- `--tmpfs ...size=64m` bounds this scratch mount to 64 MiB. Its usage also counts toward the container memory limit. `noexec` blocks direct execution from the mount, but `python /tmp/script.py` can still read and interpret a script. It isn't a code-execution prohibition.[^dockerTmpfs2026]
- `--net=none` creates an isolated network namespace with loopback only. It blocks ordinary outbound IP connections without removing the namespace or every communication channel.[^dockerNetworkNone2026]
- `--user 10001:10001` selects a non-root UID/GID. This reduces privileges; it doesn't eliminate exploitable kernel or application bugs.
- `--cap-drop=ALL` removes configured Linux capabilities. `no-new-privileges` prevents `execve` from granting new privileges through mechanisms such as setuid files; it doesn't stop every privilege-escalation vulnerability.
- `--pids-limit 64` limits tasks, including threads. When `fork`/`clone` would exceed the enforced limit, it fails with `EAGAIN`; already running tasks remain alive.[^linuxCgroupV22026]
- Equal `--memory` and `--memory-swap` limits disable container swap where enforcement is supported. Memory pressure can trigger reclaim, allocation failure, or an OOM kill; the response depends on cgroup and kernel behavior.[^dockerResources2026][^linuxCgroupV22026]

Also bound `/dev/shm`, file descriptors, exported artifacts, and collected logs as appropriate. A read-only root doesn't cap host-side container logs. Enforce aggregate concurrency and host headroom so many individually bounded jobs don't exhaust the machine.

### Offline execution can still leak secrets

Disabling networking (`--net=none`) stops an attacker from sending HTTP requests to a command-and-control server, but it doesn't prevent secret leaks. If you inject database passwords or API tokens into worker environment variables, untrusted code can read `os.environ` and print those credentials into stdout, stderr, or generated files.

Because the supervisor collects standard output to capture debug evidence, printed secrets flow right back into logs, model context windows, and human review consoles. Regex-based output scrubbers won't catch base64-encoded, hex-encoded, or rot13-obfuscated secrets. The only dependable rule is: **never pass credentials to a worker that doesn't strictly need them**.

When candidate code requires external dependencies, use a two-phase build pipeline:

1. **Dependency preparation:** Fetch approved, pinned artifacts with hashes from a trusted lockfile through limited egress. Treat package build/install scripts as untrusted execution too; don't give the builder production secrets or broad internal access. A matching hash establishes artifact identity, not that a package is benign.
2. **Offline execution:** Install from the approved cache/image and run the candidate without outbound networking. Mount only needed artifacts. Native builds may require executable scratch space, so adapt `noexec` to the task rather than quietly removing other controls when a build fails.

If a task needs egress, enforce a default-deny policy outside worker control and allow specific destinations/protocols. Account for IPv4/IPv6, DNS, redirects, resolved addresses, cloud metadata variants, and exposed proxies or Unix sockets. A denylist of three private IPv4 ranges and one metadata address isn't complete. Internal access can be legitimate when explicitly scoped; blanket private-IP denial isn't appropriate for every task.

### CPU bandwidth, deadlines, and complete teardown

A CPU quota doesn't function as a timeout. With the default 100-millisecond quota period, `--cpus 0.5` permits roughly 50 milliseconds of aggregate CPU time per period.[^dockerResources2026] An infinite loop (`while True: pass`) can run indefinitely, throttled to the configured CPU bandwidth.

Combine CPU accounting with a separate wall-clock deadline:

1. **CPU accounting:** A cgroup quota limits CPU bandwidth. `RLIMIT_CPU` can signal a process at a cumulative CPU-time limit, but isn't automatically an aggregate budget for all descendants. Neither is a wall-clock deadline.
2. **Wall-Clock Supervisor Watchdog:** An out-of-band supervisor timer that issues a hard `SIGKILL` when elapsed wall time exceeds the job budget (such as 30 seconds).

Killing one process can leave descendants running. Orphans are adopted by a suitable subreaper or namespace init, not necessarily host PID 1. A child can create a new session/process group with `setsid` and escape `killpg`; use cgroup or namespace teardown to contain the full job. Subreaper status supports adoption and waiting, while the supervisor remains responsible for termination.[^linuxSubreaper2026][^linuxSetsid2026]

When the init process of a PID namespace terminates, Linux sends `SIGKILL` to processes in that namespace. Have the trusted runtime enforce teardown from outside the worker; a runtime-owned init may still be alive after the candidate process exits.[^linuxPidNamespaces2026] On supporting cgroup v2 hosts, a supervisor can use `cgroup.kill` to kill an entire job cgroup tree, provided the worker can't migrate out or control that hierarchy. This operation targets the job tree and has different semantics from `kill -9 -1`; verify cleanup by checking that the cgroup is empty.[^linuxCgroupV22026]

A supervisor can crash before cleanup. Track a finite job lease and maximum lifetime in a control plane the worker can't modify, and use an independent reaper. Preserve the worker ID, lease generation, and deadline in durable state; a vanished TTL key alone may no longer tell the reaper which worker to destroy. Reaping still depends on scheduling, backend access, and runtime health. Retry and alert on unconfirmed termination, and quarantine the slot instead of claiming that lease expiry immediately reclaimed memory. Warm reuse needs a verified reset or fresh instance, not merely a stopped container.

A delayed cleanup retry also needs the original worker's identity. Suppose generation 7 has been destroyed and verified clean, and slot `A` now hosts generation 8. Resolving the old cleanup request through the slot's current mapping would destroy the new job, whereas resolving by immutable worker ID leaves it undisturbed:

<!-- leetllm: test, id=cleanup-identity, output=show -->
```python title="cleanup-identity.py"
old_cleanup = {"slot": "A", "generation": 7, "worker_id": "worker-7"}
current = {"slot": "A", "generation": 8, "worker_id": "worker-8"}
live_workers = {"worker-8"}  # Old worker's teardown already completed.

wrong_target = current["worker_id"]
correct_target = old_cleanup["worker_id"]
print("Slot lookup would hit replacement:", wrong_target in live_workers)
live_workers.discard(correct_target)  # Retry addresses the immutable old ID.
print("Original-ID retry preserves replacement:", "worker-8" in live_workers)
assert old_cleanup["generation"] != current["generation"]
assert live_workers == {"worker-8"}
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Slot lookup would hit replacement: True
Original-ID retry preserves replacement: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/job_cleanup_dark.png" alt="Slot reuse and delayed cleanup lifecycle diagram showing worker-7 completing confirmed termination and baseline scrub before worker-8 reuses slot A, paired with a comparison showing that delayed generation-7 cleanup resolving slot A kills replacement worker-8 early whereas lookup by immutable worker-7 leaves worker-8 intact." />
  <figcaption>Generation 8 reuses slot A only after confirmed termination and baseline scrubbing (or quarantine on unknown exit status). Delayed cleanup must target the immutable worker ID rather than the mutable slot name.</figcaption>
</figure>

A real reaper must address an immutable, non-reused runtime ID and qualify slot-state updates by generation. If destruction only accepts a reusable slot name, the backend must enforce the expected generation atomically with the destroy call; a separate pre-check followed by a name-based destroy still leaves a race window.

## Bound guest execution with WebAssembly

WebAssembly fits tasks with a narrow programmatic interface. Core Wasm provides checked linear-memory bounds and typed control flow, exposing host I/O only through explicitly linked imports. A module may declare multiple memories, though the embedding below allows at most one. WASI and custom host imports can expose files, clocks, network access, and other capabilities, and the Wasm engine and host embedding remain trusted software requiring regular updates.[^wasmtimeSecurity2026]

With Wasmtime **fuel metering enabled**, generated code consumes a configured budget as guest operations execute. Exhaustion traps with `OUT_OF_FUEL`. For a deterministic execution path and fixed runtime settings, fuel provides repeatable guest interruption. Fuel isn't milliseconds, isn't necessarily one unit per source statement, and doesn't bound module parsing/compilation, host-import execution, or all engine allocations. Epoch-based interruption is another Wasmtime option with different overhead and timing behavior.[^wasmtimeInterrupt2026]

This import-free embedding uses `wasmtime==49.0.0`, released September 21, 2026, and accepts a guest function `run(i32) -> i32`.[^wasmtimePyPi2026][^wasmtime_py_docs2026] Its 65,536-byte limit covers guest linear memory, not total host memory. The 4,096-byte WebAssembly text (WAT) input cap reduces compilation input size. Production execution also needs host process memory, CPU, and deadline controls. Fuel is set before instantiation because a module's start function can execute then.

<!-- leetllm: test, id=wasm-host, deps=wasmtime==49.0.0, output=show -->
```python title="wasm-host.py"
import wasmtime as wasm

config = wasm.Config()
config.consume_fuel = True
engine = wasm.Engine(config)

def run_guest(wat, argument, *, fuel=1_000, memory_bytes=65_536):
    for name, value, maximum in (
        ("fuel", fuel, 100_000),
        ("memory_bytes", memory_bytes, 65_536),
    ):
        if not isinstance(value, int) or not 1 <= value <= maximum:
            raise ValueError(f"Invalid {name}")
    if not isinstance(argument, int) or not -(2**31) <= argument < 2**31:
        raise ValueError("Argument must be a signed i32")
    if not isinstance(wat, str) or len(wat.encode("utf-8")) > 4_096:
        raise ValueError("Expected at most 4096 UTF-8 bytes of WAT")

    module = wasm.Module(engine, wat)
    if module.imports:
        raise ValueError("Host imports are not allowed")
    with wasm.Store(engine) as store:
        store.set_limits(memory_size=memory_bytes, memories=1,
                         instances=1, tables=0)
        store.set_fuel(fuel)  # Fuel set before instantiation; start functions consume fuel too.
        instance = wasm.Instance(store, module, [])
        run = instance.exports(store).get("run")
        if not isinstance(run, wasm.Func):
            raise ValueError("Missing exported function run")
        signature = run.type(store)
        if ([str(t) for t in signature.params] != ["i32"]
                or [str(t) for t in signature.results] != ["i32"]):
            raise ValueError("Expected run(i32) -> i32")
        return run(store, argument)

ADD_ONE = '''(module
  (func (export "run") (param i32) (result i32)
    local.get 0 i32.const 1 i32.add))'''
assert run_guest(ADD_ONE, 41) == 42
assert run_guest(ADD_ONE, -1) == 0
assert run_guest(ADD_ONE, 2**31 - 1) == -(2**31)
print("run(41) = 42; negative input and signed i32 wrap checked")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
run(41) = 42; negative input and signed i32 wrap checked
```
<!-- leetllm: output:end -->

The test checks signed 32-bit wrapping. Whether wrapping is correct depends on the task specification.

### Test failure modes alongside successful paths

Failure probes verify each isolation guarantee directly. This suite exercises infinite loops, guest memory exhaustion, host imports, and invalid function signatures; pair it with parser fuzzing and host-level resource stress tests to probe engine and supervisor limits.

<!-- leetllm: test, id=wasm-boundaries, continue=wasm-host, deps=wasmtime==49.0.0, output=show -->
```python title="wasm-boundaries.py"
def expect_exception(error_type, operation):
    try:
        operation()
    except error_type as error:
        return error
    raise AssertionError(f"Expected {error_type.__name__}")

def guest(instructions, memory=""):
    return f'''(module {memory}
      (func (export "run") (param i32) (result i32) {instructions}))'''

loop = guest("(loop br 0) i32.const 0")
error = expect_exception(wasm.Trap, lambda: run_guest(loop, 0))
assert error.trap_code == wasm.TrapCode.OUT_OF_FUEL

# Failure to grow memory returns -1; it doesn't trap.
grow = guest("i32.const 1 memory.grow", "(memory 1)")
assert run_guest(grow, 0) == -1
oversized = guest("local.get 0", "(memory 2)")
expect_exception(wasm.WasmtimeError, lambda: run_guest(oversized, 0))

outside = guest("i32.const 65536 i32.load", "(memory 1)")
error = expect_exception(wasm.Trap, lambda: run_guest(outside, 0))
assert error.trap_code == wasm.TrapCode.MEMORY_OUT_OF_BOUNDS

imported = '''(module (import "host" "read_secret" (func))
  (func (export "run") (param i32) (result i32) local.get 0))'''
expect_exception(ValueError, lambda: run_guest(imported, 0))
wrong_type = '(module (func (export "run") (result i32) i32.const 0))'
expect_exception(ValueError, lambda: run_guest(wrong_type, 0))

start_loop = '''(module
  (func $start (loop br 0)) (start $start)
  (func (export "run") (param i32) (result i32) local.get 0))'''
error = expect_exception(wasm.Trap, lambda: run_guest(start_loop, 0))
assert error.trap_code == wasm.TrapCode.OUT_OF_FUEL

for bad in (0, -1, "100", 100_001):
    expect_exception(ValueError, lambda: run_guest(ADD_ONE, 0, fuel=bad))
for bad in (0, -1, "100", 65_537):
    expect_exception(ValueError, lambda: run_guest(ADD_ONE, 0, memory_bytes=bad))
for bad in ("bad", 2**31, -(2**31) - 1):
    expect_exception(ValueError, lambda: run_guest(ADD_ONE, bad))
expect_exception(ValueError, lambda: run_guest(" " * 4_097, 0))
expect_exception(ValueError, lambda: run_guest("(module)", 0))
print("Fuel, memory, start, import and interface boundaries checked; bad inputs rejected")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Fuel, memory, start, import and interface boundaries checked; bad inputs rejected
```
<!-- leetllm: output:end -->

No host imports or WASI are linked, so these guests have no provided filesystem, socket, or environment interface. If a task needs file I/O, expose a scoped capability with bounded results and validated resource resolution. A virtual-path label alone doesn't prevent traversal or access through symlinks in its host implementation.

Repeatable fuel interruption also doesn't make **all Wasm execution deterministic**. Floating-point NaN representations, relaxed SIMD, memory-growth failure, and nondeterministic imports need separate treatment when reproducibility is required.[^wasmtimeDeterminism2026]

## Measuring correctness and containment separately

Evaluate coding agents on functional correctness and runtime containment as separate axes. Benchmark success leaves execution security unmeasured.[^chen2021][^jimenez2024]

HumanEval reports an unbiased estimator of success within $k$ samples, averaged over tasks. Under the independent, identically distributed sampling assumptions behind that estimator, collect $n$ candidates with $c$ test-passing solutions. For a fixed observed pool, the probability of at least one passing result in $k$ indices selected **without replacement** is:

$$
\widehat{\operatorname{pass@}k} = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}, \qquad 1 \leq k \leq n.
$$

Consider an example with $n = 5$ generated candidates where $c = 2$ pass unit tests. Evaluating pass@2 checks the probability that at least one of two chosen samples succeeds. Total ways to select two candidates equals $\binom{5}{2} = 10$. The number of selections containing zero passing candidates equals $\binom{5-2}{2} = \binom{3}{2} = 3$. Therefore:

$$
\widehat{\operatorname{pass@}2} = 1 - \frac{3}{10} = 0.70 \quad (70\%).
$$

Selecting pool indices with replacement gives $1 - (3/5)^2 = 0.64$ for this fixed pool. That arithmetic is correct for a different experiment. Plugging the estimated success rate $c/n$ into $1-(1-c/n)^k$ is generally biased as an estimator of fresh-sample success; the combinatorial expression avoids that bias under its assumptions. Independently generated candidates can still contain identical code. Without replacement refers to **sample indices**. Add a separate deduplication check when patch uniqueness matters.[^chen2021]

<!-- leetllm: test, id=pass-at-k, output=show -->
```python title="pass-at-k.py"
from itertools import combinations
from math import comb, isclose

def pass_at_k(n, c, k):
    if any(not isinstance(x, int) for x in (n, c, k)):
        raise ValueError("Counts must be integers")
    if not (n >= 1 and 0 <= c <= n and 1 <= k <= n):
        raise ValueError("Expected n >= 1, 0 <= c <= n and 1 <= k <= n")
    misses = comb(n - c, k) if n - c >= k else 0
    return 1 - misses / comb(n, k)

pairs = list(combinations([True, True, False, False, False], 2))
assert sum(any(pair) for pair in pairs) == 7
assert isclose(pass_at_k(5, 2, 2), 0.7)
assert pass_at_k(5, 0, 2) == 0
assert pass_at_k(5, 5, 2) == 1
assert pass_at_k(5, 2, 5) == 1
assert isclose(pass_at_k(5, 2, 1), 0.4)
print("pass@2 = 7/10 = 70%; zero/all successes and k=1/n checked")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pass@2 = 7/10 = 70%; zero/all successes and k=1/n checked
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pass_at_k_pairs_dark.png" alt="Upper-triangular matrix of ten unordered index pairs from five candidates where candidates 1 and 2 pass and candidates 3, 4, and 5 fail: seven green-outlined pairs contain at least one passing candidate and three red-outlined pairs contain only failures, yielding pass@2 = 7/10 = 70%." />
  <figcaption>Each cell shows one unordered pair of candidate indices without replacement. Seven of ten equally likely pairs contain at least one passing candidate, giving <code>pass@2 = 7/10 = 70%</code>.</figcaption>
</figure>

Within a repair trajectory, attempt $t+1$ depends on feedback from attempt $t$, so successive patches are not IID samples for the estimator above. You can instead sample independent **whole trajectories** under a fixed configuration and grade each final artifact. SWE-bench provides repository issue-resolution tasks and a patch-evaluation harness; it does not impose a multi-turn agent architecture or a universal token, attempt, or dollar budget.[^jimenez2024][^swebenchEvaluation2026] Pin task versions, environments, tools, budgets, and grading policies, and separate test failures from infrastructure failures and incomplete runs.

Separately, run bounded containment probes in a disposable staging environment with the intended runtime configuration. Use synthetic secrets and supervisor-enforced limits; don't launch uncontrolled resource attacks on a shared host:

- **Canary Probe:** Write an artificial credential file on the host; verify the sandbox worker can't read it.
- **Egress Probe:** Attempt a bounded connection to a test destination that policy denies, and inspect the enforcement result. Where relevant, test metadata/private/IPv6 destinations without retrieving actual credentials. Connection failure alone can reflect an unavailable server rather than a working deny rule.
- **Storage Probe:** Write slightly beyond the configured small scratch quota, then verify the write error and remaining host headroom. `ENOSPC` does not automatically terminate the worker; the deadline still owns teardown. Check host log and artifact limits too.
- **Orphan Probe:** Under an independent hard lifetime limit, launch a bounded background workload and terminate the job supervisor. Measure cleanup delay after lease expiry, verify descendant termination, and check that an unconfirmed slot remains quarantined.
- **Cross-Job Leak Probe:** Check prior files, mounts, environment, processes, sessions, and inherited descriptors against the next job's baseline to assess runtime cleanup.

## Bounded patches from verifiable execution

The parser improved because a concise traceback exposed a testable mistake. Effective coding agents pair bounded failure feedback with runtime isolation, independent grading, and verdict digests bound to exact artifacts so each mechanism answers one clear question: what failed, what code could touch, who judged the result, and which bytes were verified.

A verified digest and green test run provide evidence for review without granting automatic deployment permission. Before promoting a patch, review both functional correctness and confirmed teardown cleanup.

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
    "explanation": "The supervisor sets the worker's environment explicitly with MODE and omits TRACE_TAG. Changing the working directory alters relative path resolution while leaving absolute paths such as /work/input.txt unchanged, and neither run tests network access."
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
    "explanation": "Checking the file's identity as part of opening it allows the report and refuses the archive. The setup check becomes stale when the alias changes. A guest memory check establishes that the host can read the alias string. A byte count cannot distinguish the two files because they have the same size."
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
    "explanation": "The delayed action belongs to immutable worker 12. It must not resolve the reusable slot to worker 13 or overwrite generation 13 state. A reusable-name backend also needs generation enforcement inside the destructive action to avoid a check-then-act race."
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
    "explanation": "There are choose(6,2)=15 pairs and choose(4,2)=6 all-failing pairs. Success is 1−6/15=9/15=60%. The 55.6% calculation uses replacement and describes a different selection experiment."
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
    "explanation": "Each validator report covers the base and image that the validator tested together. The R7 report has the wrong image. The I2 report has the wrong base. Repeating R7 on I1 would test the old image again. A trusted run on R7 and I2 with the same files, dependencies and grader would test the submitted combination."
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
