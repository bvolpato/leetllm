---
{
  "id": "design-agent-sandbox-platform",
  "title": "Design a Multi-Tenant Agent Sandbox & Code Interpreter Platform",
  "slug": "design-agent-sandbox-platform",
  "category": "System Design",
  "difficulty": "Hard",
  "companies": [
    "E2B",
    "Modal",
    "OpenAI",
    "Anthropic",
    "AWS",
    "Google"
  ],
  "shortDescription": "Give agents a place to run generated code with limited permissions. Balance fast warm starts with tenant isolation, network controls, and clean resets.",
  "keyConceptsTested": [
    "Multi-tenant remote code execution architecture",
    "Linux KVM ioctls and vCPU scheduling",
    "Firecracker microVM device and host boundaries",
    "Snapshot restore readiness and warm-start timing boundaries",
    "Post-snapshot clocks, random state, and network identity",
    "Copy-on-write memory mapping and userfaultfd",
    "Guest OverlayFS and per-sandbox scratch ownership",
    "Virtio-vsock host-guest IPC and stream framing",
    "Network containment and cloud metadata restrictions",
    "Authenticated API brokering with scoped capabilities",
    "Resident-memory budgeting and CPU overcommit",
    "Execution retirement and generation-safe cleanup"
  ],
  "prerequisites": [
    "code-generation-agents-sandboxing",
    "local-agent-sandboxing-seatbelt-landlock",
    "design-multi-tenant-llm-serving-platform",
    "llm-deployment-gpu-serving-autoscaling"
  ],
  "relatedQuestions": [
    "code-generation-agents-sandboxing",
    "local-agent-sandboxing-seatbelt-landlock",
    "design-multi-tenant-llm-serving-platform",
    "advanced-mlops-devops-ai"
  ],
  "section": "System Design Capstones",
  "order": 4
}
---

An agent generates a Python script that installs a plotting library, writes a CSV, and leaves a background worker running. Two seconds later, another tenant opens a fresh session on the same physical machine. Which bytes can the host safely share between them, which state must vanish before reuse, and how do you start the second workspace in milliseconds instead of waiting for a full Linux boot?

In [Local Agent Sandboxing](/learn/local-agent-sandboxing-seatbelt-landlock), Landlock and Seatbelt restricted processes on a single workstation. A multi-tenant cloud sandbox has a harder job: contain untrusted code from competing customers, keep host memory and CPU from collapsing under bursts, and recover cleanly if the control plane crashes mid-run. Throughout this design, we will trace two sandbox instances, A and B, restored from one immutable template through private writes, network calls, and verified teardown.

## Give each session an owner and a readiness check

Untrusted code can allocate memory aggressively, fork processes, probe local interfaces, and hit every network route left open to it. The trusted host agent owns the virtual machine lifecycle, resource caps, network path, and artifact export.

Identify every sandbox instance with three fields: an authenticated tenant ID, a sandbox ID, and a monotonically increasing generation number. Reusing a sandbox ID while a previous process still holds memory or scratch storage creates a cleanup race. Generation numbers turn stale stop or retry messages into harmless no-ops.

To separate guest kernels cleanly, this design runs each session inside a Firecracker microVM. A virtual machine monitor (VMM) on the host configures the guest and emulates minimal devices, while Linux Kernel-based Virtual Machine (KVM) runs guest instructions with hardware virtualization. The VMM, KVM, host kernel, and management services form the trusted computing base.[^agache2020][^firecracker2026HostSetup] External API calls terminate inside a trusted broker that validates the sandbox's token scope before opening upstream TLS connections.

<figure>
  <img src="illustrations/_generated/tenant_guest_boundaries_dark.png" alt="Authentication and generation reservation precede placement on one trusted host. Its host agent and template manager restore two separate guest kernels through Firecracker VMMs and KVM with the host kernel. A and B share sealed template artifacts but own separate writable memory, scratch files, and generation-scoped command channels over vsock. Their Internet egress passes an externally enforced firewall. Approved scoped operations reach an authenticated broker and authorized upstream TLS. Metadata, host management, and other-tenant destinations take a separate deny-and-record branch." />
  <figcaption>Instances A and B share one sealed template while keeping separate writable memory, scratch layers, and generation-scoped vsock channels. Outbound traffic splits between an authenticated API broker and a strict deny path for metadata and internal hosts.</figcaption>
</figure>

Sharing the immutable template skips repetitive runtime startup while keeping every writable page, scratch file, command stream, and token private to one instance.

For interactive turns, set an initial warm-start target of **15 ms at p99**, measured from gateway acceptance to the guest supervisor starting the first user statement. That clock includes placement, queueing, snapshot restore, and readiness checks, tracked alongside rejection and timeout rates. Cold launches are measured separately per image profile because restore speed depends heavily on guest RAM, vCPU count, and device layout.[^firecrackerSnapshot2026]

> **Common mistake:** Measuring warm-start latency at the moment the Firecracker snapshot API returns `204 No Content`. The guest is loaded at that instant, but clocks, RNG state, and the supervisor control socket may still be unready for user code.

Size each workspace around concrete product limits:

- Per-session state across iterative turns, with explicit idle expiration and teardown rules.
- Capped stdin, stdout, stderr, file uploads, and exported artifacts.
- Package installation routed through approved artifact mirrors or explicit network rules.
- Resource tiers ranging from 1 to 4 vCPUs, 512 MiB to 8 GiB of configured guest RAM, and 5 GiB of writable scratch space (where MiB = $2^{20}$ bytes and GiB = $2^{30}$ bytes).
- Complete denial of guest access to host management ports, neighboring tenants, and cloud metadata endpoints.

## Put the guest kernel behind KVM

Standard containers isolate processes with Linux namespaces and cgroups while sharing one host kernel. A single host-kernel privilege escalation crosses that barrier for every container on the machine. A microVM gives each tenant its own guest kernel, so an attacker who compromises that guest kernel still faces the VMM and KVM hypervisor layer.[^agache2020]

KVM exposes VM management through file descriptors and `ioctl` calls on `/dev/kvm`. A host VMM runs four core steps:

1. Open `/dev/kvm` and call `KVM_CREATE_VM` to allocate a VM file descriptor.
2. Register host userspace memory regions as guest physical address (GPA) space.
3. Call `KVM_CREATE_VCPU` to create one descriptor per virtual CPU.
4. Loop on `KVM_RUN` to execute guest instructions, servicing any userspace device exits that KVM returns.[^linuxKvmApi2026]

Hardware virtualization handles most guest execution and memory translation directly. Simple exits stay inside KVM; device I/O exits return to userspace in the VMM. Always inspect the `ioctl` return code before reading `run_struct->exit_reason`: on `-1` with `EINTR`, the shared `exit_reason` field still holds the stale reason from the previous exit.[^linuxKvmApi2026]

```c title="kvm-vcpu-loop-sketch.c"
while (!stop_requested) {
    int rc = ioctl(vcpu_fd, KVM_RUN, 0);
    if (rc < 0) {
        if (errno == EINTR) {
            continue;  /* Recheck stop_requested at the next loop iteration. */
        }
        report_run_error(errno);
        break;
    }
    switch (run_struct->exit_reason) {
        case KVM_EXIT_MMIO:
            handle_mmio(run_struct);
            break;
        case KVM_EXIT_IO:
            handle_io_port(run_struct);
            break;
        case KVM_EXIT_HLT:
            handle_guest_halt(run_struct);
            break;
        default:
            stop_for_unhandled_exit(run_struct->exit_reason);
            stop_requested = true;
    }
}
```

<figure>
  <img src="illustrations/_generated/kvm_return_paths_dark.png" alt="A host VMM opens /dev/kvm, creates a VM descriptor, registers userspace memory, and creates a vCPU descriptor. KVM_RUN on that vCPU has distinct return paths. A negative return with EINTR checks shutdown before retrying; other errors stop. A zero return permits inspecting exit_reason. MMIO and IO go to userspace device handlers and then the loop. HLT follows guest lifecycle rules and can wait for an interrupt. Other unhandled exit reasons stop. Some hardware exits are handled inside KVM and never become a userspace return." />
  <figcaption>The VMM descriptor hierarchy and KVM_RUN dispatch paths. Check the return code before reading exit_reason: EINTR returns to the stop flag, while MMIO and IO invoke userspace device handlers and HLT waits on the guest lifecycle rule.</figcaption>
</figure>

A `KVM_EXIT_HLT` exit usually means the guest is idle waiting for an interrupt, not that the session has terminated.

### Keep the VMM's host privileges small

Firecracker minimizes its attack surface by emulating only VirtIO devices needed by microVMs (over MMIO, with optional PCI VirtIO transport rather than general PCI passthrough).[^firecrackerKernelPolicy2026] Writing the VMM in Rust eliminates entire classes of memory-safety bugs, though device emulation, unsafe blocks, KVM, and host glue still require regular patching.[^firecracker2026HostSetup]

Before launching Firecracker, the **Jailer** wraps the VMM process in a chroot filesystem view, drops to dedicated UID/GID credentials, attaches host cgroups, isolates it in a PID namespace, and joins a pre-created network namespace via `--netns`.[^firecrackerJailer2026] Pair Jailer with Firecracker's default seccomp filters, strict permissions on the API socket, and hard caps on serial and log output so a noisy guest cannot fill host disks.[^firecracker2026HostSetup]

| Isolation layer | State it separates | Shared dependency that remains |
|---|---|---|
| Container namespaces | Host processes and selected OS views | Host kernel and exposed device nodes |
| Guest microVM | Guest kernel and guest physical memory | VMM, KVM, host kernel, and CPU hardware |
| Jailed VMM process | Host filesystem, UID/GID, and PID space | Required host syscalls and API sockets |
| External firewall and broker | Permitted IP routes and upstream secrets | Packet enforcement path and token scope rules |

## Restore a clean template, then verify readiness

Cold-booting a kernel and Python runtime takes hundreds of milliseconds. To hit low double-digit milliseconds, boot a clean base image once (kernel, interpreter, and an idle guest supervisor), pause it before any tenant data touches memory, and capture a snapshot.

A Firecracker snapshot saves guest RAM and versioned microVM device state; the host manages consistent disk backing files separately.[^firecrackerSnapshot2026] Verify the template's cryptographic digest before loading, and keep its memory backing file immutable for the lifetime of every restored VM.

<figure>
  <img src="illustrations/_generated/restore_readiness_boundary_dark.png" alt="A clean template is built before tenant work: boot the pinned guest and runtime, observe the supervisor ready, pause and snapshot, then seal consistent memory, versioned state, and disk artifacts. A new generation loads those verified artifacts paused with private mappings. The snapshot API response marks state loaded. The supervisor then resumes only for readiness while user work remains withheld. Generation-bound control, clock, kernel RNG, application state, network, host limits, and ownership checks must pass before accepting user code. Missing or failed checks hold resources and block execution." />
  <figcaption>A snapshot loads paused with private memory mappings. User code stays blocked until clock sync, RNG refresh, application state, network setup, and the generation-bound control channel all pass verification.</figcaption>
</figure>

### Follow one copy-on-write page

With the `File` memory backend, Firecracker maps the snapshot memory file privately (`MAP_PRIVATE`). Host page faults pull clean pages from the page cache on demand, and the first write to any page triggers copy-on-write (CoW), allocating a private physical page for that VM while leaving the backing file untouched.[^firecrackerSnapshot2026]

Suppose a 4 KiB base page holds the value `20`. Both A and B initially read that shared page. When A writes `99`, only A receives a new private 4 KiB page containing `99`; B and the immutable base still read `20`.

<figure>
  <img src="illustrations/_generated/snapshot_page_ownership_dark.png" alt="Before and after mapping diagrams use three immutable base pages, each 4 KiB, with page indices 0, 1, and 2 and values 10, 20, and 30. Before the write, A/g1 and B/g1 each map all three shared base entries. After A writes 99 to page 1, only A's page 1 mapping points to a separate private page containing 99. A's pages 0 and 2 and all B mappings still point to the original base. Three shared base entries plus one private entry make four pages, or 16 KiB." />
  <figcaption>Copy-on-write page ownership across three 4 KiB base pages. Writing 99 on page 1 gives A/g1 one private page while B/g1 and the base keep 20, bringing total tracked pages to four (16 KiB).</figcaption>
</figure>

Two details trip up capacity planners:

1. **Reads still consume RAM.** Faulting in an uncached clean page adds host resident memory and disk I/O even without creating a dirty private copy.
2. **`MAP_NORESERVE` is not free memory.** Skipping swap reservation lets you map more virtual RAM than physical RAM, but actual writes (including Python reference-count updates and garbage collection sweeps) still demand physical pages. Schedule against real resident-memory pressure, not virtual mappings.

### Choose who handles missing pages

Firecracker also supports a `Uffd` backend that forwards missing-page faults over Linux `userfaultfd` to a host userspace handler.[^firecrackerUffd2026] That hook lets you fetch snapshot chunks lazily from local NVMe or remote object storage instead of keeping every template hot on every worker. The trade-off is tail latency: if the userspace handler stalls on a remote fetch or crashes, guest vCPUs freeze on every unmapped page fault until a deadline trips.

## Repair the state that must be fresh

Cloning a running VM duplicates state that software expects to be unique or current. Before dispatching user code, refresh four categories of cloned state.

### Wall clocks and application deadlines

A restored guest wakes up with the wall clock frozen at snapshot creation time. Synchronize it through the guest supervisor protocol or a supported host clock option.[^firecrackerSnapshot2026] Stale wall clocks break TLS certificate checks and short-lived token validation, while saved monotonic timers and deadlines need explicit reset rules. Compatible guests can also watch VMClock generation counters to trigger userspace clock refreshes automatically.[^firecrackerSnapshot2026]

### Kernel randomness and copied application state

Firecracker bumps the virtual machine generation ID (VMGenID) on restore so a supporting guest kernel reseeds its CSPRNG. Because that notification arrives asynchronously after vCPUs resume, a brief window exists where early reads could still see pre-reseed state.[^firecrackerCloneUniqueness2026]

Worse, reseeding the kernel RNG does not touch userspace PRNGs already seeded inside Python or OpenSSL, nor does it change `/proc/sys/kernel/random/boot_id`.[^firecrackerCloneUniqueness2026] Never bake secrets or one-use tokens into a base snapshot, and require the guest supervisor to reseed userspace RNGs and confirm readiness before running tenant code.

### Host networking and guest identity

Keep host TAP interfaces, network namespaces, and guest IP/MAC addresses distinct in your mental model. Jailer joins a pre-created network namespace, which allows every clone to keep the exact same TAP name (`tap0`) and private guest IP (`192.168.241.2`) inside its own namespace while host-side NAT and routing isolate their external flows.[^firecrackerJailer2026][^firecrackerNetworkClones2026] That private IP is never a unique global identity.

### Open connections and supervisor state

Firecracker resets active vsock connections during restore while preserving listening sockets inside the guest.[^firecrackerSnapshot2026] Build templates in a clean, quiescent state with zero live user jobs or external TCP sockets, then open a fresh generation-scoped control connection from the host agent on every restore.

<figure>
  <img src="illustrations/_generated/cloned_state_refresh_dark.png" alt="After restoring copied state, VMGenID notifies a supporting guest kernel, which reseeds its kernel random generator after an asynchronous handling window. Separate copied userspace PRNG state, cached tokens, and boot_id still require their application protocol. Restored wall time and monotonic deadlines have separate validation. Below, two integrator-prepared network namespaces each contain a TAP named tap0 and the repeated private guest address 192.168.241.2. Jailer joins the selected namespace. Distinct host routing and filtering paths remain necessary." />
  <figcaption>Post-restore state refresh spans four separate owners: kernel RNG via VMGenID, userspace PRNGs and clocks via the guest supervisor, isolated host network namespaces around repeated private guest IPs, and a fresh vsock control connection.</figcaption>
</figure>

## Give each guest a disposable writable filesystem

When an agent installs a package or writes `output.csv`, those bytes must stay isolated to that sandbox and vanish at teardown. Mount the guest root with **OverlayFS**: a read-only lower layer (such as a SquashFS image attached as a virtual block device) merged with a private per-instance writable scratch filesystem.[^linuxOverlayfs2026]

Inside the guest's private scratch volume, allocate an empty `upperdir` and an empty `workdir` on the same filesystem. OverlayFS uses `workdir` internally for atomic file operations and hides it from the merged view.[^linuxOverlayfs2026]

- **Read** an unmodified file: served directly from the shared lower image.
- **Modify** a lower file: OverlayFS copies it up into `upperdir` before applying the write.
- **Create** `output.csv`: stored strictly in `upperdir`.
- **Delete** a lower file: OverlayFS writes a **whiteout** marker in `upperdir` so the file disappears from the merged view while the read-only lower image stays untouched.

<figure>
  <img src="illustrations/_generated/scratch_copyup_and_reset_dark.png" alt="A host-owned scratch backing object supplies one private guest filesystem for A/g1. Upper and work are separate private directories on that same filesystem, and work stays outside the merged user view. Four aligned guest mount states track immutable lower config.txt. Reading uses the lower file with an empty upper. Modifying config.txt copies it into upper with A's bytes. Creating output.csv puts its data row 1,99 only in upper. Deleting config.txt leaves a whiteout in upper, while lower still retains the original bytes and the merged view shows only output.csv. After A/g1 retires, the host disposes of its scratch backing and allocates fresh A/g2 scratch." />
  <figcaption>OverlayFS lifecycle for config.txt and output.csv. Modifications copy up, deletions place whiteouts in upperdir, and lower stays immutable. Once generation 1 retires and all handles close, the host discards its scratch volume and attaches a clean one for generation 2.</figcaption>
</figure>

Notice the ownership split: the guest owns its internal mounts, while the host owns the underlying scratch backing file or block device. At teardown, stop new requests, retire the VM, close all descriptors, revoke capabilities, and delete the scratch backing volume on the host. Exported artifacts and logs live outside scratch under their own retention rules.

## Use vsock as a bounded command channel

Rather than allocating host TCP ports for control traffic, use **Virtio-vsock**. Firecracker bridges a host `AF_UNIX` socket to a guest `AF_VSOCK` socket without touching the guest network stack.[^firecrackerVsockDesign2026]

Suppose the guest supervisor listens on vsock port `5000`. The host opens the Firecracker Unix socket, sends `CONNECT 5000\n`, and waits for `OK <host_port>\n` before streaming JSON commands over the same connection.[^firecrackerVsockDesign2026]

<figure>
  <img src="illustrations/_generated/vsock_stream_framing_dark.png" alt="A host AF_UNIX endpoint sends CONNECT 5000\n to a guest listening on AF_VSOCK port 5000 through Firecracker. The acknowledgement OK 1073741824\n arrives across fragmented stream chunks. Calling recv(1) accumulates bytes until newline without over-reading subsequent application bytes, capped by a 2-second monotonic deadline and 64-byte maximum. The port must fall in [2^30, 2^31)." />
  <figcaption>Fragment-safe vsock handshake framing. Reading byte by byte until the newline with a 64-byte cap and 2-second monotonic deadline prevents over-reading application payload bytes that follow immediately on the stream.</figcaption>
</figure>

Stream sockets can split a single line across multiple `recv` calls or coalesce the handshake with the first payload byte. Reading one byte at a time up to a strict 64-byte cap and monotonic deadline keeps any following application bytes untouched on the socket buffer:[^pythonSocketHowto2026]

```python title="host-vsock-client.py"
import re
import socket
import time

def read_ack(sock, timeout=2.0):
    deadline = time.monotonic() + timeout
    line = bytearray()
    for _ in range(64):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("vsock acknowledgement deadline exceeded")
        sock.settimeout(remaining)
        chunk = sock.recv(1)
        if not chunk:
            raise ConnectionError("vsock closed before acknowledgement")
        line.extend(chunk)
        if chunk == b"\n":
            match = re.fullmatch(rb"OK ([0-9]+)\n", bytes(line))
            if match is None:
                raise ConnectionError("invalid vsock acknowledgement")
            port = int(match.group(1))
            if not 2**30 <= port < 2**31:
                raise ConnectionError("unexpected host-side vsock port")
            return port
    raise ConnectionError("vsock acknowledgement exceeds 64 bytes")

with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
    sock.settimeout(2.0)
    sock.connect("/srv/jailer/firecracker/vm-a/root/vsock.sock")
    sock.sendall(b"CONNECT 5000\n")
    assigned_port = read_ack(sock, timeout=2.0)
    sock.settimeout(2.0)
    sock.sendall(b'{"action":"execute","script":"print(42)"}\n')
```

Firecracker reserves host-side ephemeral vsock ports in $[2^{30}, 2^{31})$. Beyond the handshake, wrap the stream in length-prefixed frames with backpressure, cancellation, and strict output caps.

## Constrain outbound traffic and broker private API access

Keep the control channel separate from internet egress, and enforce every network rule outside the guest kernel.

### Put forbidden destinations behind an enforced deny path

Cloud instance metadata services expose host role credentials over link-local addresses: AWS serves IPv4 IMDS at `169.254.169.254` and optional IPv6 IMDS at `fd00:ec2::254`.[^awsImdsv2_2026] Blocking only one IPv4 address leaves IPv6, mapped addresses, local host services, and HTTP redirects open. Enforce outbound rules across every address family:

| Guest destination | Enforced host action |
|---|---|
| Host management, cloud metadata, other tenants, or unapproved private ranges | Drop outside the guest network perimeter |
| Approved package repository | Route through an authorized artifact proxy |
| Approved third-party or internal API | Send to the authenticated API broker |
| Unmatched or unresolved destination | Deny immediately with a concise error |

To stop DNS rebinding, resolve and validate every IP address (including IPv6 and IPv4-mapped IPv6) on each new connection, connect directly to the validated IP while preserving TLS hostname verification, and revalidate or reject redirects.[^owasp2026ssrf]

### Give the broker an explicit protocol

Never place long-lived API keys inside the guest environment, where generated code can read `os.environ` and exfiltrate them. Instead, issue a short-lived capability token tied to the instance's tenant, generation, target repository, and permitted action (for example, read-only GitHub fetch).

The guest calls an explicit broker endpoint with that capability. The broker verifies the caller and token scope, fetches the real secret from a vault inside the trusted perimeter, constructs the upstream request, and opens hostname-verified TLS to the upstream API. An ordinary opaque HTTPS tunnel cannot rewrite `Authorization` headers transparently without breaking end-to-end TLS.

<figure>
  <img src="illustrations/_generated/broker_capability_authority_dark.png" alt="Untrusted A/g1 holds a short-lived capability for one tenant, repository, and read operation. An explicit application request reaches the trusted broker, which authenticates caller and generation, checks tenant, resource, operation, and expiry, then constructs an approved request. A credential vault supplies the real secret only inside the broker perimeter. The broker inserts the credential and opens hostname-verified TLS to the approved API. Invalid capabilities are rejected without an upstream call. Direct metadata, host, other-tenant, and private routes are denied outside the guest." />
  <figcaption>Capability-scoped API brokering keeps real secrets inside the trusted perimeter. The broker checks caller generation, scope, and expiry before injecting credentials over verified upstream TLS.</figcaption>
</figure>

> **Key insight:** A brokered capability still grants execution power. Even without seeing the raw secret, untrusted code can abuse every operation the capability permits. Cap HTTP methods, URL paths, response bytes, rate limits, and token TTL, and revoke the capability the instant the generation retires.

## Size resident memory and runnable work separately

Consider a single sandbox host with **128 physical CPU cores and 256 GiB of RAM**. Reserve 32 GiB for the OS, host agent, shared template page cache, and VMM overhead:

$$
256\text{ GiB} - 32\text{ GiB} = 224\text{ GiB} = 229{,}376\text{ MiB}.
$$

Now compare two ways of sizing session density on that remaining 224 GiB:

- **Worst-case full RAM reservation (2 GiB per guest):** $229{,}376 / 2{,}048 = 112$ guests.
- **Private dirty-page estimate (50 MiB per guest):** $\lfloor 229{,}376 / 50 \rfloor = 4{,}587$ guests (or $2{,}293$ guests at 100 MiB of private pages).

That 41x gap hinges entirely on how much memory each workload dirties after restore. The 4,587 figure ignores per-VM overhead, page tables, and headroom, and collapses rapidly if a burst of sessions loads large DataFrames simultaneously. Track configured RAM, shared clean pages, and private dirty pages separately, and shed load based on live resident-memory pressure.

<figure>
  <img src="illustrations/_generated/memory_capacity_assumptions_dark.png" alt="A 256 GiB host reserves 32 GiB and leaves 224 GiB (229,376 MiB). A full 2 GiB per-session budget yields 112 sessions; 50 MiB private pages yields 4,587; 100 MiB private pages yields 2,293. Configured guest RAM, private modified pages, and shared resident pages are tracked separately." />
  <figcaption>Host density varies by 41x depending on whether you size for full configured RAM (112 sessions at 2 GiB) or typical private dirty pages (4,587 at 50 MiB, 2,293 at 100 MiB), before deducting per-VM overhead and safety headroom.</figcaption>
</figure>

Size CPU overcommit independently. Packing 30 one-vCPU sessions per physical core exposes $128 \times 30 = 3{,}840$ vCPUs. At a 3% average duty cycle, mean demand is only $3{,}840 \times 0.03 = 115.2$ core-equivalents, comfortably below 128 cores. Yet if an agent fan-out wakes all 3,840 sessions at once, 3,712 vCPUs sit in the run queue and p99 latency spikes. Averages hide correlated bursts.

<figure>
  <img src="illustrations/_generated/cpu_overcommit_and_group_quota_dark.png" alt="128 physical cores with 30 one-vCPU sessions per core expose 3,840 configured vCPUs. Mean demand at 3 percent duty is 115.2 core-equivalents, while synchronized runnable demand hits 3,840. Separately, a VMM cgroup with cpu.max 100000 100000 receives an aggregate 100,000 microseconds per 100,000-microsecond period, split across threads (60,000 + 40,000 microseconds)." />
  <figcaption>Mean CPU demand (115.2 cores) hides worst-case synchronized wakeups (3,840 runnable vCPUs). In cgroup v2, cpu.max = 100000 100000 caps the entire VMM group to one aggregate core-equivalent, shared across all threads.</figcaption>
</figure>

Enforce host resource caps with Linux cgroup v2. For fair-class scheduling, `cpu.max = 100000 100000` grants the **entire VMM cgroup** an aggregate 100,000 $\mu$s per 100,000 $\mu$s period (1.0 core-equivalent), not 100,000 $\mu$s per thread.[^linuxCgroupV22026] Set `memory.max` to cover guest RAM plus VMM overhead, cap host tasks with `pids.max`, and enforce separate process, disk, and output caps inside the guest.[^linuxCgroupV22026]

## Model page ownership and retirement locally

We can verify the state machine for copy-on-write page isolation, readiness checks, generation-scoped retirement, and capacity arithmetic in a compact Python simulation. Notice two critical rules enforced here: writing page 1 in A leaves B's view untouched, and requesting cancellation cannot discard A's memory or scratch until retirement is confirmed for A's exact generation.

<!-- leetllm: test, output=show -->
```python title="sandbox-ownership-model.py"
from dataclasses import dataclass, field

PAGE_BYTES = 4096
REQUIRED = frozenset({"clock", "kernel_rng", "app_state", "network", "control"})

@dataclass
class Clone:
    sandbox_id: str
    generation: int
    base: tuple[int, ...]
    state: str = "RESTORED"
    private: dict[int, int] = field(default_factory=dict)
    scratch: dict[str, bytes] = field(default_factory=dict)

    def activate(self, verified: set[str]):
        if self.state != "RESTORED" or not REQUIRED <= verified:
            raise RuntimeError("restore checks incomplete")
        self.state = "READY"

    def start(self):
        if self.state != "READY":
            raise RuntimeError("instance is not ready")
        self.state = "RUNNING"

    def read(self, page: int):
        if self.state != "RUNNING":
            raise RuntimeError("instance is not running")
        if not 0 <= page < len(self.base):
            raise RuntimeError("page is outside the modeled mapping")
        return self.private.get(page, self.base[page])

    def write(self, page: int, value: int):
        self.read(page)
        self.private[page] = value

    def request_cancel(self):
        if self.state != "RUNNING":
            raise RuntimeError("instance is not running")
        self.state = "CANCEL_REQUESTED"

    def confirm_retired(self, sandbox_id: str, generation: int):
        if (sandbox_id, generation) != (self.sandbox_id, self.generation):
            raise RuntimeError("retirement identity mismatch")
        if self.state != "CANCEL_REQUESTED":
            raise RuntimeError("retirement is out of order")
        self.state = "RETIRED"

    def dispose(self):
        if self.state != "RETIRED":
            raise RuntimeError("execution retirement required")
        self.private.clear()
        self.scratch.clear()
        self.state = "DISPOSED"

def rejected(call, expected):
    try:
        call()
    except RuntimeError as error:
        assert str(error) == expected
    else:
        raise AssertionError("invalid transition succeeded")

base = (10, 20, 30)
a, b = Clone("A", 1, base), Clone("B", 1, base)
rejected(lambda: a.activate({"clock"}), "restore checks incomplete")
for clone in (a, b):
    clone.activate(set(REQUIRED))
    clone.start()

rejected(lambda: a.write(-1, 99), "page is outside the modeled mapping")
a.write(1, 99)
a.scratch["output.csv"] = b"id,value\n1,99\n"
assert (a.read(1), b.read(1), base[1]) == (99, 20, 20)

page_accounting_bytes = (len(base) + len(a.private) + len(b.private)) * PAGE_BYTES
print("page 1: A =", a.read(1), "B =", b.read(1), "base =", base[1])
print("modeled page-accounting KiB:", page_accounting_bytes // 1024)

a.request_cancel()
rejected(a.dispose, "execution retirement required")
rejected(lambda: a.confirm_retired("A", 2), "retirement identity mismatch")
a.confirm_retired("A", 1)
a.dispose()
assert not a.private and not a.scratch and not b.scratch and b.read(1) == 20
print("A after confirmed retirement:", a.state)
print("B retains clean base and empty scratch:", not b.scratch)

usable_mib = (256 - 32) * 1024
print("full 2GiB budget quotient:", usable_mib // 2048)
print("50MiB private-page-only quotient:", usable_mib // 50)
print("mean core-equivalents at 3%:", f"{128 * 30 * 0.03:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
page 1: A = 99 B = 20 base = 20
modeled page-accounting KiB: 16
A after confirmed retirement: DISPOSED
B retains clean base and empty scratch: True
full 2GiB budget quotient: 112
50MiB private-page-only quotient: 4587
mean core-equivalents at 3%: 115.2
```
<!-- leetllm: output:end -->

A's write allocates one private page (bringing total tracked pages from three to four, or 16 KiB) while B and the immutable template keep `20`. During teardown, cancellation keeps A's memory and scratch reserved until retirement succeeds for exact identity `("A", 1)`, blocking both premature disposal and stale generation-2 notices.

<figure>
  <img src="illustrations/_generated/generation_safe_retirement_dark.png" alt="Lifecycle transitions take A/g1 through RESTORED, READY, RUNNING, CANCEL_REQUESTED, RETIRED, and DISPOSED. Missing readiness checks keep it RESTORED. Cancellation keeps private page 1 (99) and output.csv owned. A retirement notice for A/g2 fails identity. Confirmed retirement for A/g1 and closure of remaining references allow disposal. Lost replies hold ownership for reconciliation while B/g1 continues reading 20." />
  <figcaption>Generation-safe retirement for A/g1. Premature disposal and mismatched generation notices fail; lost controller replies hold ownership for reconciliation instead of freeing resources on a timeout.</figcaption>
</figure>

## Reconcile failures before returning capacity

A controller can time out on an RPC while the VMM is still running code on the worker host. Never reclaim capacity on a timeout alone. Mark the instance uncertain, reconcile durable ownership records against live host processes, cgroups, sockets, volumes, and network namespaces, and confirm termination before freeing the slot.

| Failure mode | Signal to inspect | Platform action |
|---|---|---|
| Runaway guest processes | Guest process count, vCPU time, stdout/stderr growth | Enforce guest limits and host cgroup CPU/output caps |
| Private-memory spike | Host cgroup memory events, RSS growth, OOM counters | Shed new sessions, terminate offending instance, protect host reserve |
| Lost controller heartbeat | Generation-scoped process and resource inventory | Reconcile ownership before adoption or termination |
| Stalled `userfaultfd` or storage | Fault wait duration, backend errors, session deadline | Stop placing new work and retire stalled instances before reclaim |
| Capability abuse | Broker caller, generation, path, and upstream status | Reject unauthorized calls and revoke the capability token |
| Incomplete teardown | Open VMM/FD handles, mounts, scratch volumes, netns | Quarantine resources until full disposal is verified |

For a non-root domain cgroup, Linux `cgroup.kill` terminates every process in the group atomically (it returns `EOPNOTSUPP` on threaded cgroups because it operates on whole processes).[^linuxCgroupV22026] Verify that the processes have exited and that every duplicated VM file descriptor, scratch handle, and network namespace is closed before handing the capacity to a new tenant. A bare PID is unsafe for cleanup because the OS can recycle PIDs between checks.

### Follow-up questions

#### How would a sandbox read a 50 GiB model without copying it into its scratch layer?

Attach an authorized read-only virtual block device backed by a managed host image, pinned to an explicit image revision and tenant permission rule. Count its disk I/O and shared page-cache working set in host capacity planning, because reading clean blocks still consumes host RAM.

#### Why can a garbage collector increase private memory after restore?

Mark-and-sweep collectors and reference counters write metadata bits across heap objects. Even when user code only reads an object, updating its reference count or GC mark header dirties the 4 KiB page and triggers a copy-on-write fault. Measure your runtime's dirty-page rate under realistic scripts before choosing overcommit ratios.

## Check your understanding

```mastery-quiz
[
  {
    "question": "A and B share four modeled 4 KiB base entries [7, 11, 13, 17]. A writes 81 at index 2, then B writes 52 at that same index. What are A, B and the base reads at index 2, and the total modeled page-accounting size?",
    "options": [
      "81 / 81 / 13; 20 KiB",
      "81 / 52 / 52; 16 KiB",
      "81 / 52 / 13; 24 KiB",
      "81 / 52 / 13; 40 KiB"
    ],
    "answer": "81 / 52 / 13; 24 KiB",
    "explanation": "Each writer owns a distinct private entry. Count the four-entry shared base once plus one entry for A and one for B: six times 4 KiB = 24 KiB. The immutable base retains 13. Counting both complete logical mappings double-counts unchanged entries; sharing the modified entry would leak writes."
  },
  {
    "question": "A VMM checks its stop flag at the top of the loop and calls KVM_RUN if the flag is clear. On EINTR it returns to that check. The first two calls each return 0 with an MMIO exit while the flag is clear. The third returns -1/EINTR with the flag set. The exit-reason field still holds MMIO from the second call. How many MMIO handler calls do these three returns cause, and does the loop issue a fourth KVM_RUN?",
    "options": [
      "3 handler calls; no fourth run",
      "2 handler calls; no fourth run",
      "3 handler calls; a fourth run",
      "2 handler calls; a fourth run"
    ],
    "answer": "2 handler calls; no fourth run",
    "explanation": "Each of the first two calls reports a new MMIO exit, so each invokes the handler once. Counting three would dispatch the second exit again after the interruption. The interrupted call returns to the stop check. The flag is set, so the loop ends. A fourth run would require retrying before checking the flag."
  },
  {
    "question": "A/generation 7 has current passing observations for clock, kernel_rng, network and control. Its only passing app_state record belongs to generation 6; the generation 7 app_state result is pending. What should the readiness check do?",
    "options": [
      "Accept user work; retain the old app_state result for this restore.",
      "Keep user work held; repeat only the already passing control check.",
      "Accept user work; replace the missing app_state observation with kernel_rng.",
      "Keep user work held; obtain the current generation's app_state result."
    ],
    "answer": "Keep user work held; obtain the current generation's app_state result.",
    "explanation": "The application state observation must apply to the current owner. Kernel RNG, old application state and current application state are separate checks. Repeating an already passing control check does not provide the missing current app_state result."
  },
  {
    "question": "The service tracks how long customers wait for their code to start once it takes responsibility for a job. Its p99 target for warm starts is 15 ms. On one clock, a request arrives at 31 ms, the gateway accepts it at 40 ms, the snapshot load returns at 49 ms, readiness checks pass at 54 ms, and the script starts at 57 ms. Which latency should the service record, and how does this sample compare with 15 ms?",
    "options": [
      "9 ms, within budget",
      "17 ms, over budget",
      "14 ms, within budget",
      "26 ms, over budget"
    ],
    "answer": "17 ms, over budget",
    "explanation": "The gateway accepts the request at 40 ms and the guest starts the script at 57 ms. The elapsed time is 17 ms, which exceeds the budget by 2 ms. Stopping at snapshot load gives 9 ms. Stopping when readiness checks pass gives 14 ms. Starting at arrival includes 9 ms before acceptance and gives 26 ms. This trace contributes one sample to the p99 calculation."
  },
  {
    "question": "A clean lower image contains config.txt and runtime.bin. In one guest overlay, A deletes config.txt and creates result.json. After A retires and all references close, the next generation gets fresh upper and work directories. Can A see config.txt just before retirement, and which of config.txt and result.json can the next generation see?",
    "options": [
      "A cannot see config.txt. The next generation sees only config.txt.",
      "A can see config.txt. The next generation sees only config.txt.",
      "A cannot see config.txt. The next generation sees only result.json.",
      "A can see config.txt. The next generation sees only result.json."
    ],
    "answer": "A cannot see config.txt. The next generation sees only config.txt.",
    "explanation": "Deleting config.txt puts a whiteout in A's upper layer. A lookup in the merged view encounters that whiteout, even though the lower image still contains config.txt. A creates result.json in the same upper layer. The next generation starts with an empty upper layer and sees the original config.txt. Seeing config.txt in A's view would mean skipping the whiteout. Seeing only result.json in the next view would require reusing A's upper layer."
  },
  {
    "question": "A vsock handshake expects one OK line with a decimal port in the range 2³⁰ ≤ port < 2³¹. On separate connections the peers send \"OK 1073741823\\n\" and \"OK 2147483647\\nNEXT\", each in one write. The host calls recv(1) directly on each socket until it reads the first newline. Both lines arrive within the deadline. Which handshakes pass, and which bytes from the second reply can the application still read from the socket?",
    "options": [
      "Both pass. No bytes remain unread.",
      "Only the second passes. No bytes remain unread.",
      "Only the second passes. NEXT remains unread.",
      "Both pass. NEXT remains unread."
    ],
    "answer": "Only the second passes. NEXT remains unread.",
    "explanation": "The first port is one below the minimum of 1,073,741,824. The second is one below the excluded upper bound of 2,147,483,648, so it is valid. Accepting both would skip the range check on the first port. Each recv(1) consumes one byte. The read that consumes the newline leaves all four bytes of NEXT on the second socket."
  },
  {
    "question": "A new connection to an allowed API name now resolves only to an unauthorized private address, although an earlier connection used a public address. Separately, the API broker receives an expired capability for that API. Which pair of current actions follows the described network rules?",
    "options": [
      "Reuse the earlier DNS approval; make no upstream call for the expired capability.",
      "Block the new private connection; make no upstream call for the expired capability.",
      "Block the new private connection; construct the upstream call using the expired capability.",
      "Reuse the earlier DNS approval; construct the upstream call using the expired capability."
    ],
    "answer": "Block the new private connection; make no upstream call for the expired capability.",
    "explanation": "Every new connection needs its own validated destination. An earlier public answer does not authorize a new private address. The broker also validates current capability scope and expiry before constructing the upstream request. Both paths therefore stop before the prohibited call."
  },
  {
    "question": "A 96-core host has 192 GiB of RAM. For the memory estimate, reserve 24 GiB and allow 96 MiB of private pages per job. For a separate CPU estimate, configure 20 one-vCPU sessions per core at 4% mean duty. How many private footprints fit, how many core-equivalents do the configured sessions need on average, and how many sessions wait if all wake and one runs per core?",
    "options": [
      "2,048 jobs, 768 cores, 1,824 waiting",
      "1,792 jobs, 768 cores, 1,920 waiting",
      "2,048 jobs, 76.8 cores, 1,920 waiting",
      "1,792 jobs, 76.8 cores, 1,824 waiting"
    ],
    "answer": "1,792 jobs, 76.8 cores, 1,824 waiting",
    "explanation": "After the reserve, 168 GiB × 1,024 gives 172,032 MiB. Dividing by 96 MiB gives 1,792 private footprints. The CPU estimate uses 96 × 20 = 1,920 sessions. At 4% duty they need 76.8 cores on average. If all wake, 96 run and 1,824 wait. A count of 2,048 jobs spends the reserve. A mean of 768 cores uses 40% duty. A queue of 1,920 counts the running sessions as waiting."
  },
  {
    "question": "One fair-class VMM cgroup has cpu.max = \"150000 100000\". So far in this period, two threads have used 45,000 and 35,000 microseconds of CPU time. A third thread becomes runnable. How much quota remains for the group, and what average CPU allowance does this configuration give the group?",
    "options": [
      "150,000 microseconds, 1.5 core-equivalents",
      "70,000 microseconds, 0.7 core-equivalents",
      "70,000 microseconds, 1.5 core-equivalents",
      "150,000 microseconds, 0.7 core-equivalents"
    ],
    "answer": "70,000 microseconds, 1.5 core-equivalents",
    "explanation": "The first two threads spent 80,000 microseconds from one group quota, leaving 70,000 for this period. A fresh 150,000 microseconds for the third thread would give it a separate quota. The configured allowance is 150,000 / 100,000 = 1.5 core-equivalents. Using the 70,000 microseconds left this period as the numerator gives 0.7. The configured quota still renews at 150,000 each period."
  },
  {
    "question": "A/generation 9 requests cancellation at 1 s. A generation-10 retirement notice arrives at 2 s. The controller verifies generation 9 execution retired at 5 s, but a duplicated VM descriptor and a scratch reader remain open until 9 s. All other capability-revocation and retention checks are complete. At which earliest point can the platform reclaim those owned resources for another tenant?",
    "options": [
      "At 9 s, after checking the generation-9 retirement and final reference closure.",
      "At 2 s, after receiving the generation-10 retirement and assigning another generation.",
      "At 5 s, after execution retirement while retaining the descriptor and scratch reader.",
      "At 1 s, after requesting cancellation and starting a new ownership record."
    ],
    "answer": "At 9 s, after checking the generation-9 retirement and final reference closure.",
    "explanation": "A stale generation notice cannot retire generation 9. Cancellation is a request; execution retirement at 5 s still leaves live references. KVM resources can survive through duplicated descriptors. At 9 s the verified retirement and reference closure allow safe disposal."
  }
]
```

> **Next:** Continue to [LLM-Powered Search Engine](/learn/design-llm-powered-search-engine). You can now trace a code session through resource ownership, readiness, and safe disposal. Search adds a different evidence requirement: a generated answer must preserve the current source, its exceptions, and the reader's access rights.
