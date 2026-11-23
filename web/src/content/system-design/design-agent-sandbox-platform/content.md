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

An agent runs a script that installs a package, creates a chart, and leaves a background process running. The next tenant needs a fresh workspace. Which parts can the service share, and which parts must disappear before that workspace is reused?

In [Local Agent Sandboxing](/learn/local-agent-sandboxing-seatbelt-landlock), Landlock and Seatbelt restricted processes on one workstation. A multi-tenant service also has to contain an untrusted guest, manage shared host resources, and recover after its controller crashes. We'll follow two sandbox instances, A and B, from one clean template through separate writes and eventual cleanup.

## Give each session an owner and a readiness gate

Treat generated code as untrusted. It can consume memory, spawn processes, inspect its environment, and make every network request its permissions allow. The platform's trusted host agent controls the virtual machine, resource limits, network paths, and artifact export.

Use an authenticated tenant, sandbox ID, and generation number to identify each instance. A retry can refer to an existing instance only after the controller reconciles its status. Reusing an ID while an old process still owns its resources creates a cleanup race.

This design uses lightweight virtual machines called Firecracker microVMs, each with its own guest kernel. A virtual machine monitor (VMM) is the host process that configures the guest and emulates its devices. Linux Kernel-based Virtual Machine (KVM) supplies hardware-assisted execution. The VMM, KVM, host kernel, and management services remain part of the trusted platform.[^agache2020][^firecracker2026HostSetup]

External API connections use Transport Layer Security (TLS). The trusted broker constructs those connections after checking the sandbox's token scope.

<figure>
  <img src="illustrations/_generated/tenant_guest_boundaries_dark.png" alt="Authentication and generation reservation precede placement on one trusted host. Its host agent and template manager restore two separate guest kernels through Firecracker VMMs and KVM with the host kernel. A and B share sealed template artifacts but own separate writable memory, scratch files, and generation-scoped command channels over vsock. Their Internet egress passes an externally enforced policy firewall. Approved scoped operations reach an authenticated broker and authorized upstream TLS. Metadata, host management, and other-tenant destinations take a separate deny-and-record branch." />
  <figcaption>Trace the shared sealed template into two guest kernels with separately owned writes and command channels. Authentication and generation reservation precede placement. Internet egress follows an enforced broker-or-deny split, while commands use vsock. The host agent, template manager, Firecracker VMMs, KVM, host kernel, and authenticated broker remain trusted dependencies. The broker opens authorized upstream TLS.</figcaption>
</figure>

Sharing the immutable template reduces repeated initialization. Each instance still owns its writable memory, scratch storage, command channel, and capabilities.

For the interactive route, set an initial **design target** of at most 15 ms at the 99th percentile (p99), measured from gateway acceptance to the guest supervisor beginning the first user instruction. Include placement, queueing after acceptance, restore work, and required readiness checks. Record rejection rate and timeout rate alongside that percentile. Measure cold launch separately for each image profile.

That target needs a workload test with pinned host and guest kernels, Firecracker version, image, snapshot residency, concurrent starts, and user-code entry instrumentation. Firecracker's snapshot documentation makes restore performance dependent on memory, vCPU, and device configuration.[^firecrackerSnapshot2026] A successful snapshot API response and the first executed user statement are different timing endpoints.

The service should support:

- Separate session state for iterative agent turns, with an explicit expiration and disposal policy.
- Bounded stdin, stdout, stderr, uploaded files, and exported artifacts.
- Package installation from approved artifacts or network routes.
- Resource profiles such as 1–4 virtual CPUs (vCPUs), 512 MiB–8 GiB of configured guest RAM, and a 5 GiB scratch limit.
- Denial of guest access to host management interfaces, other tenants, and infrastructure metadata.

Those resource profiles are example product limits. MiB and GiB mean $2^{20}$ and $2^{30}$ bytes. The host also needs memory for VMM overhead, shared pages, page tables, buffers, and the operating system.

## Put the guest kernel behind KVM

Ordinary containers isolate processes through namespaces and resource controls while sharing a host kernel. A successful host-kernel privilege escalation can compromise that shared barrier. A microVM gives each tenant a guest kernel, so controlling that guest kernel still leaves the VMM and KVM hypervisor layer to cross.[^agache2020]

KVM exposes file descriptors and `ioctl` operations through `/dev/kvm`. A host VMM typically:

1. Opens `/dev/kvm` and uses `KVM_CREATE_VM` to obtain a VM descriptor.
2. Registers host userspace memory regions as guest physical memory.
3. Uses `KVM_CREATE_VCPU` to obtain vCPU descriptors.
4. Runs each vCPU through `KVM_RUN` and handles exits that require userspace device emulation.[^linuxKvmApi2026]

Hardware virtualization handles guest execution and address translation. Some exits are handled inside KVM. Others return to the VMM with a userspace exit reason.

The following C fragment shows only that control flow. VM initialization, memory mappings, device handlers, and shutdown coordination are omitted. Check the return value before consulting `exit_reason`, because an interrupted or failed call has a different outcome.[^linuxKvmApi2026]

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
  <img src="illustrations/_generated/kvm_return_paths_dark.png" alt="A host VMM opens /dev/kvm, creates a VM descriptor, registers userspace memory, and creates a vCPU descriptor. KVM_RUN on that vCPU has distinct return paths. A negative return with EINTR checks shutdown before retrying; other errors stop. A zero return permits inspecting exit_reason. MMIO and IO go to userspace device handlers and then the loop. HLT follows guest lifecycle policy and can wait for an interrupt. Other unhandled exit reasons stop. Some hardware exits are handled inside KVM and never become a userspace return." />
  <figcaption>Follow the descriptor tree, then the return-code branch. GPA means guest physical address. A successful KVM_RUN return permits inspecting exit_reason. EINTR rechecks shutdown policy, MMIO and IO need userspace handlers, and HLT follows lifecycle policy. Some hardware exits stay inside KVM. This drawing illustrates the preserved C sketch without executing a guest.</figcaption>
</figure>

A halt needs the VMM's guest-lifecycle policy. It can mean waiting for an interrupt rather than the end of a session.

### Keep the VMM's host privileges small

Firecracker has a deliberately limited device surface for lightweight virtual machines. Its Rust implementation helps prevent memory-safety errors, while device emulation, unsafe code, KVM, and host integration still need security review and updates.[^firecracker2026HostSetup]

Device support changes by version. The Firecracker source checked for this chapter supports VirtIO virtual devices over memory-mapped I/O (MMIO) and optional Peripheral Component Interconnect (PCI) VirtIO transport. That transport support doesn't imply arbitrary PCI-device emulation or device passthrough.[^firecrackerKernelPolicy2026] Use the matching host, guest, and device configuration rather than a fixed count of emulated devices.

The **Jailer** prepares a restricted host environment for the Firecracker process. It can create a restricted filesystem view, drop to configured user and group IDs, configure resource-control groups (cgroups), and create a process-ID (PID) namespace. Its `--netns` option joins a network namespace that the integrator has already created.[^firecrackerJailer2026]

Keep Firecracker's default seccomp system-call filters, protect its API socket, and bound serial and process output. The upstream host guide specifically calls out unbounded guest-driven output as a host resource risk.[^firecracker2026HostSetup]

| Isolation layer | State it separates | Remaining shared dependency |
|---|---|---|
| Container namespaces | Host processes and selected resource views | Host kernel and permitted device interfaces |
| Guest VM | Guest kernel and guest address space | VMM, KVM, host kernel, and hardware |
| Jailed VMM process | Host filesystem, credentials, and process access | Required host interfaces and their implementations |
| Network policy | Permitted destinations and services | Enforcement path, address handling, and broker token scope |

These controls protect different interfaces. Keep their configuration and failure tests separate.

## Restore a clean template, then verify readiness

A useful base snapshot contains the initialized guest kernel, language runtime, and a supervisor waiting for work. Create it before tenant data, customer credentials, or user jobs enter the guest.

A Firecracker snapshot includes guest memory and versioned microVM state. Disk backing files are managed separately by the integrator and must remain consistent with the saved state.[^firecrackerSnapshot2026] Authenticate the template's origin and integrity before loading it, and keep its backing memory file immutable for the restored VM's lifetime.

<figure>
  <img src="illustrations/_generated/restore_readiness_boundary_dark.png" alt="A clean template is built before tenant work: boot the pinned guest and runtime, observe the supervisor ready, pause and snapshot, then seal consistent memory, versioned state, and disk artifacts. A new generation loads those verified artifacts paused with private mappings. The snapshot API response marks state loaded. The supervisor then resumes only for readiness while user work remains withheld. Generation-bound control, clock, kernel RNG, application state, network, host limits, and ownership checks form an admission gate. Missing or failed checks hold resources and keep admission closed. Successful required checks accept the first user instruction. The 15 ms p99 is a declared design target from gateway acceptance through placement, queueing, restore, and readiness, not measured stage timings." />
  <figcaption>The snapshot API response confirms loaded state. The supervisor then runs readiness checks while user work remains withheld. Missing or failed checks keep resources held and access closed. The declared 15 ms p99 design target includes placement, accepted queueing, restore, and required checks from gateway acceptance to the first user instruction. Stage durations require measurement.</figcaption>
</figure>

The guest can be running while the service still withholds user work. Readiness belongs to the chosen template and restore protocol.

### Follow one copy-on-write page

With the `File` memory backend, Firecracker maps the snapshot memory file privately. Host page faults bring required file contents into RAM on demand. Writes create private copies rather than modifying the backing template.[^firecrackerSnapshot2026]

Suppose one 4 KiB page contains the value 20. A and B initially read that clean page. When A writes 99, A gets a private page containing 99. B and the immutable base still contain 20. The physical page-size choice in this example is explicit.

<figure>
  <img src="illustrations/_generated/snapshot_page_ownership_dark.png" alt="Before and after mapping diagrams use three immutable base pages, each modeled as 4 KiB, with page indices 0, 1, and 2 and values 10, 20, and 30. Before the write, A/generation 1 and B/generation 1 each map all three shared base entries. After A writes 99 to page 1, only A’s page 1 mapping points to a separate private page containing 99. A’s pages 0 and 2 and all B mappings still point to the original base. B and backing page 1 retain 20. Three shared base entries plus one private entry make four modeled pages, or 16 KiB. This counts model entries and does not assert physical residency." />
  <figcaption>Follow A’s middle mapping. Its write creates one private page containing 99 while B and the backing retain 20. The model counts three shared base entries plus one private entry, giving four 4 KiB pages and 16 KiB of modeled accounting. Physical residency and VMM overhead require separate measurements. Reading can fault in clean bytes without creating a private modified copy. Here g1 identifies generation 1.</figcaption>
</figure>

Reading a previously absent page can incur I/O and increase resident memory without creating a private modified copy. Writes, including runtime bookkeeping or collector metadata updates, can increase private memory. Mapping a snapshot avoids copying every unmodified byte up front, while page faults and working-set growth still affect latency and capacity.

`MAP_NORESERVE` changes reservation behavior on systems that use it. It doesn't create physical RAM or make overcommit safe. Plan workload scheduling against actual resident-memory pressure and the guest's allowed growth.

### Choose who handles missing pages

Firecracker also offers the `Uffd` backend, which delegates missing-page handling through Linux `userfaultfd` to a userspace process. The integrator supplies that handler and its permissions, storage, validation, failure behavior, and latency budget.[^firecrackerUffd2026]

A custom handler could read snapshot chunks from a local cache or a remote store. Remote NVMe or object-storage fetching is an integration design. Firecracker's interface doesn't supply a complete distributed cache. A stalled handler can stall guest progress, so test cold pages and failure recovery as well as hot-cache restores.

## Repair the state that must be fresh

Cloning a template also clones information that applications may assume is unique or current. Inspect the following state before launching tenant code.

### Wall clocks and application deadlines

The documented snapshot path can resume the guest wall clock from snapshot time. Synchronize it through the guest protocol, or use a supported restore-time clock option under its documented host and clock-source conditions.[^firecrackerSnapshot2026]

An old wall clock can affect certificate validity and token expiry. Monotonic durations, saved timers, and application deadlines need their own restore semantics. Test them on the actual guest rather than assuming every timer expires or every TLS operation fails.

Supported VMClock implementations can expose a changed generation counter to userspace after restore. That is a signal for compatible applications to refresh their state. It requires matching guest support and application integration.[^firecrackerSnapshot2026]

### Kernel randomness and copied application state

Firecracker updates the virtual machine generation identifier (VMGenID) when restoring a snapshot. A supporting guest kernel uses the notification to reseed its random generator. There is a window between resuming vCPUs and handling that notification.[^firecrackerCloneUniqueness2026]

The kernel's random generator and a copied userspace pseudorandom generator are separate state. Reinitializing the kernel doesn't replace previously generated tokens, cached random values, application identifiers, or every userspace seed. The snapshot can also retain the same `/proc/sys/kernel/random/boot_id`.[^firecrackerCloneUniqueness2026]

Use a restore protocol validated for the actual guest driver and kernel configuration. Keep customer keys and one-use credentials out of the template. Execute user work only after the required kernel and application-state checks succeed. A generic “32 fresh bytes sent” counter cannot guarantee that those checks passed.

### Host networking and guest identity

The host TAP device name, its network namespace, and the guest's IP/MAC configuration are different objects. Jailer joins a pre-created namespace. A clone strategy can reuse the same TAP name and private guest address inside distinct namespaces, with host routing or NAT separating their external paths.[^firecrackerJailer2026][^firecrackerNetworkClones2026]

For example, `192.168.241.2` is a private address. Repeating it in isolated namespaces doesn't make it unique globally. The host must still provision the intended routes and filtering. The upstream clone-network example is a starting point that needs its own security and performance validation.[^firecrackerNetworkClones2026]

### Open connections and supervisor state

Snapshot restore can lose network connections. Firecracker resets existing vsock connections while preserving guest listen sockets for new connections.[^firecrackerSnapshot2026] Reconnect the host control channel for the new sandbox generation.

Guest file descriptors refer to guest resources and device protocols. They aren't ordinary host file descriptors copied into the guest. Keep the template quiescent, reconcile external state explicitly, and avoid carrying live user processes or external sessions into a shared template.

<figure>
  <img src="illustrations/_generated/cloned_state_refresh_dark.png" alt="After restoring copied state, VMGenID notifies a supporting guest kernel, which reseeds its kernel random generator after an asynchronous handling window. Separate copied userspace PRNG state, cached tokens, and boot_id still require their application protocol. Restored wall time and monotonic deadlines have separate validation. Below, two integrator-prepared network namespaces each contain a TAP named tap0 and the repeated private guest address 192.168.241.2. Jailer joins the selected namespace. Distinct host routing and filtering paths remain necessary. A repeated private IP is not a unique global identity. Access remains closed until the required state checks pass." />
  <figcaption>Kernel randomness, copied application state, clocks, and network identity have separate owners. VMGenID handling reseeds a supporting kernel RNG after an asynchronous window. Copied userspace state and identifiers need their application protocol. The integrator prepares namespaces and TAPs, then Jailer joins them. Repeated private address 192.168.241.2 still needs distinct host routes and filtering. Validate clocks and reconnect generation-bound control before accepting work.</figcaption>
</figure>

## Give each guest a disposable writable filesystem

A package installation or generated `output.csv` should change only that sandbox's writable layer. In this design, the guest mounts an OverlayFS root: a merged view of a read-only base and per-instance scratch.

The lower layer can come from a read-only SquashFS image attached through a virtual block device. In this design, the guest creates an upper directory and allocates a fresh, empty work directory for each instance. OverlayFS requires `workdir` to be on the same filesystem as `upperdir`. The work directory supports OverlayFS operations and is kept outside the merged user view.[^linuxOverlayfs2026]



Read a base configuration file and the merged view can use the lower file. Modify it and OverlayFS copies it into the upper layer. Create `output.csv` and it exists in the upper layer. Delete a lower file and a **whiteout** records its removal from the merged view while leaving the lower file intact.[^linuxOverlayfs2026]

The host owns the scratch backing file or volume. The guest owns its mounted OverlayFS view. After the instance retires, the host can dispose of the instance's backing resources. A host process cannot directly unmount an unrelated guest's `/` as though it were a host mount.

<figure>
  <img src="illustrations/_generated/scratch_copyup_and_reset_dark.png" alt="A host-owned scratch backing object supplies one private guest filesystem for A/generation 1. Upper and work are separate private directories on that same filesystem, and work stays outside the merged user view. Four aligned guest mount states track immutable lower config.txt bytes marked base. Reading uses the lower file with an empty upper. Modifying config.txt copies it into upper with A’s bytes. Creating output.csv puts its data row 1,99 only in upper. Deleting config.txt leaves a whiteout in upper, while lower still retains the original bytes and the merged view shows only output.csv. After authoritative A/generation 1 execution retirement and reference closure, the host disposes of its scratch backing. Fresh A/generation 2 has empty upper and work directories and sees the clean lower config.txt in its merged view. The guest owns its mounts. Disposal and retention require their own runtime verification." />
  <figcaption>Track config.txt through the lower, upper, and merged views. CSV rows list id, then value. Modification copies it into upper, creation adds output.csv there, and deletion leaves a whiteout while lower retains its bytes. Upper and work are separate private directories on one guest filesystem. Work stays outside the merged view. After authoritative retirement and reference closure, the host disposes of its scratch backing and allocates fresh generation 2 scratch. The guest owns the mounts.</figcaption>
</figure>

For reuse, stop admission, retire execution, close references, revoke capabilities, and dispose of the old scratch backing. Construct the next instance from the clean template and a fresh upper/work pair. Cleanup latency depends on the storage path and outstanding work. Filesystem disposal also needs separate retention rules for exported artifacts, logs, and backups.

## Use vsock as a bounded command channel

Virtio-vsock provides host-guest communication through a virtual socket device. Firecracker mediates host `AF_UNIX` sockets and guest `AF_VSOCK` sockets.[^firecrackerVsockDesign2026] This control path uses Unix/vsock endpoints rather than host TCP ports.

That removes TCP port allocation from this particular channel. It still consumes descriptors, buffers, and VMM work. TCP capacity depends on its configured ephemeral range and connection tuples. Compare both paths with measurements instead of assigning either one a fixed transit time.

A guest supervisor can listen on vsock port 5000. For a host-initiated connection, the host connects to the configured Unix socket, sends `CONNECT 5000\n`, and waits for an `OK PORT\n` acknowledgement. Only then does the same stream carry application messages.[^firecrackerVsockDesign2026]

<figure>
  <img src="illustrations/_generated/vsock_stream_framing_dark.png" alt="A host AF_UNIX endpoint sends the literal line CONNECT 5000 backslash-n to a guest listening on AF_VSOCK port 5000 through Firecracker. The acknowledgement OK 1073741824 backslash-n is shown as three stream fragments: OK space 1073, then 741, then 824 and newline. The existing reader requests one byte per recv and accumulates until newline, leaving following application bytes untouched. One whole two-second monotonic deadline and a 64-byte limit bound the acknowledgement. The full regular expression is OK space one or more decimal digits followed by newline, and the parsed host-side port must be at least 2 to the power 30 and less than 2 to the power 31. EOF, an invalid line or range, timeout, and excess length fail the handshake before application work." />
  <figcaption>Accumulate the literal OK 1073741824\n through newline before using application bytes. These groups illustrate stream fragmentation. The preserved reader calls recv(1), with one two-second monotonic deadline and a 64-byte maximum for the entire acknowledgement. Validate the full line and reserved range [2³⁰, 2³¹). EOF, invalid input, timeout, or excess length fail the handshake. Subsequent payload remains untouched.</figcaption>
</figure>

Stream reads can return part of a message or close before a delimiter arrives. The following host-side integration fragment reads one bounded acknowledgement without consuming application payload bytes. It requires a running, correctly configured guest and is left unmarked as an executable lesson cell.[^pythonSocketHowto2026]

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
    sock.settimeout(2.0)  # Example connect timeout.
    sock.connect("/srv/jailer/firecracker/vm-a/root/vsock.sock")
    sock.sendall(b"CONNECT 5000\n")
    assigned_port = read_ack(sock, timeout=2.0)
    sock.settimeout(2.0)  # A separate timeout for the next operation.
    sock.sendall(b'{"action":"execute","script":"print(42)"}\n')
```

The port check above follows the pinned Firecracker implementation's reserved host-side range. The complete service also needs generation-bound authorization, message framing, backpressure, cancellation, and output limits. Check the matching host and guest prerequisites for the deployed release.

## Constrain outbound traffic and broker private API access

The command channel and Internet access serve different purposes. Give the guest only the network routes it needs, and enforce that policy outside the untrusted guest.

### Put forbidden destinations behind an enforced deny path

Cloud instance metadata can expose instance information and role credentials. AWS documents IPv4 IMDS at `169.254.169.254` and an optional IPv6 endpoint, `fd00:ec2::254`, on supported Nitro instances and subnets.[^awsImdsv2_2026] The credentials belong to the EC2 instance's assigned role. Whether that instance is a bare-metal worker or a VM is a deployment choice.

Cover every relevant address family and path. Denying one address in one forwarding chain leaves other routes, local services, redirects, or proxy paths to inspect. The policy for this design is:

| Guest request | Enforced handling |
|---|---|
| Host management, metadata, another tenant, or unapproved private destination | Deny before it leaves the sandbox's permitted network perimeter |
| Approved package artifact | Fetch through the authorized artifact service |
| Approved private API operation | Send to the authenticated API broker |
| Arbitrary destination or unresolved policy | Deny and return a bounded error |

Validate all resolved addresses, including IPv6 and mapped forms. Connect to the validated destination, preserve TLS hostname verification, and reject or revalidate redirects. Resolve and validate again for a new connection. Domain allowlisting and an earlier DNS lookup alone don't prevent rebinding.[^owasp2026ssrf]

### Give the broker an explicit protocol

Suppose A may read one repository through a GitHub integration. The orchestrator issues a short-lived capability bound to A's instance generation, tenant, repository, and permitted read operation. The guest presents that capability to an authenticated broker endpoint.

The broker validates the caller and operation, constructs the permitted upstream request, retrieves the real credential, and opens TLS to the approved API origin. The real credential stays inside the trusted broker. An ordinary encrypted HTTPS tunnel doesn't expose its Authorization header for a transparent proxy to rewrite.

<figure>
  <img src="illustrations/_generated/broker_capability_authority_dark.png" alt="Untrusted A/generation 1 holds a short-lived capability for one tenant, repository, and read operation. An explicit application request reaches the trusted broker, which authenticates caller and generation, checks tenant, resource, operation, and expiry, then constructs an approved request. A credential vault supplies the real secret only inside the broker perimeter. The broker inserts the credential and opens hostname-verified TLS to the approved API. Invalid capabilities are rejected without an upstream call. Direct metadata, host, other-tenant, and private routes are denied outside the guest, including relevant IPv4 and optional IPv6 metadata endpoints. The guest capability expires and is revoked at retirement; it still grants bounded token scope." />
  <figcaption>Follow one repository read from A/generation 1 through caller and scope validation to a broker-constructed request. The real credential stays in the vault and broker, which opens verified TLS. Invalid scope causes no upstream call. Direct forbidden routes are denied across relevant address families. The guest capability grants bounded permissions until expiry or revocation. Opaque HTTPS headers cannot be transparently rewritten.</figcaption>
</figure>

A phantom reference or broker capability still grants execution power. Guest code can try to abuse every operation it permits. Limit methods, resource paths, redirects, response size, lifetime, and rate. Revoke the capability when its instance retires. A host or broker compromise crosses the trusted isolation layer described earlier.

## Size resident memory and runnable work separately

Size a single sandbox host with **128 physical CPU cores and 256 GiB RAM**:

Reserve 32 GiB for host services, shared resident template data, and an initial allowance for other overhead. This leaves:

$$
256\text{ GiB}-32\text{ GiB}
=224\text{ GiB}
=229{,}376\text{ MiB}.
$$

If every guest reserves a full 2 GiB within that remaining budget, the quotient is $229{,}376/2{,}048=112$. If each guest instead contributes an assumed 50 MiB of private resident pages, the private-page-only quotient is $\lfloor229{,}376/50\rfloor=4{,}587$.

The roughly 41-fold difference exposes the assumption that matters: how much each guest actually makes private. The second quotient excludes per-instance overhead and additional safety headroom. It cannot guarantee safe hosting for 4,587 active 2 GiB guests. If those guests write their allowed memory, the physical demand changes dramatically.

<figure>
  <img src="illustrations/_generated/memory_capacity_assumptions_dark.png" alt="A declared 256 GiB host worksheet reserves 32 GiB and leaves 224 GiB, or 229376 MiB. A full 2 GiB per-session budget gives quotient 112. Assuming only 50 MiB private pages per session gives private-page-only quotient 4587. The two counts appear on one exact zero-to-5000 scale. This second quotient omits per-instance overhead, additional safety headroom, and private growth. An explicit arithmetic sensitivity at 100 MiB private pages gives quotient 2293. Configured guest RAM, private modified pages, and shared resident pages are separate accounting categories, and none of these quotients guarantees an active-session limit." />
  <figcaption>Use the same count scale for each quotient. The declared host leaves (256 − 32) × 1024 = 229,376 MiB. A full 2,048 MiB budget gives 112, assumed 50 MiB private pages give 4,587, and the 100 MiB sensitivity gives 2,293. Private-page-only quotients exclude per-instance overhead, additional headroom, and growth. The reserve includes shared residency and initial overhead. Configured RAM, private pages, and shared resident pages remain separate quantities.</figcaption>
</figure>

Shared page-cache accounting, VMM memory, page tables, buffers, scratch growth, simultaneous faults, and a cold template can further reduce density. Measure those terms under concurrent starts and representative code, then schedule against bounded memory pressure. Test correlated peaks and recovery capacity.

CPU overcommit needs a separate worksheet. At 128 cores and 30 configured one-vCPU sessions per core, the host would expose 3,840 vCPUs. An assumed 3% average duty cycle corresponds to 115.2 core-equivalents of mean demand. Synchronized work can still make all 3,840 vCPUs runnable and create queueing. Mean demand doesn't determine p99 startup or completion latency.

<figure>
  <img src="illustrations/_generated/cpu_overcommit_and_group_quota_dark.png" alt="The declared worksheet has 128 physical cores and 30 one-vCPU sessions per core, giving 3840 configured vCPUs. On one zero-to-3840 core-equivalent demand scale, physical capacity is 128, assumed mean demand at 3 percent duty is 115.2, and synchronized runnable demand is 3840. The mean does not determine queueing or p99. Separately, one VMM fair-class cgroup with cpu.max 100000 100000 receives an aggregate 100000 microseconds per 100000-microsecond period. In one period, thread 1 consumes 60000 microseconds and thread 2 consumes 40000 microseconds from that shared budget, separated at the exact 60000 point. Guest process limits and host pids.max are separate controls." />
  <figcaption>Compare all upper bars on one core-equivalent scale: 128 physical cores, 128 × 30 × 0.03 = 115.2 mean demand, and 3,840 synchronized runnable vCPUs. Queueing and p99 require workload evidence. Separately, cpu.max = 100000 100000 grants one fair-class VMM cgroup an aggregate 100,000 µs per 100,000 µs period. A 60,000 + 40,000 µs thread split exhausts that shared cgroup quota. Guest process limits and host pids.max enforce separate isolation layers.</figcaption>
</figure>

Place the VMM process and its tasks in the intended host cgroup. For fair-class CPU scheduling, `cpu.max = 100000 100000` allows that group an aggregate 100,000 microseconds of CPU time per 100,000-microsecond period. It doesn't assign that allowance independently to every vCPU thread.[^linuxCgroupV22026]

Set `memory.max` with the guest footprint and VMM overhead in mind, monitor memory events, and define out-of-memory (OOM) handling. Host `pids.max` limits host tasks. Guest process limits constrain the untrusted processes inside that guest. Keep both controls, plus output, disk, and network limits, in the resource profile.[^linuxCgroupV22026]

## Model page ownership and retirement locally

Before implementing the host agent, check the lifecycle with a small deterministic model. It represents three clean 4 KiB pages and separate private writes. Its readiness flags are provided controller observations, and its retirement call represents a trusted confirmation that execution has stopped.

The program performs dictionary and integer operations in one Python process. It checks the model's transitions, while real readiness probes and resource retirement require a VMM integration test.

Predict two results: after A writes 99 into page 1, what does B read? After A requests cancellation, can cleanup already discard A's scratch?

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
        if type(page) is not int or not 0 <= page < len(self.base):
            raise RuntimeError("page is outside the modeled mapping")
        return self.private.get(page, self.base[page])

    def write(self, page: int, value: int):
        self.read(page)  # Require a running instance and an existing page.
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
assert a.state == "RESTORED"
for clone in (a, b):
    clone.activate(set(REQUIRED))
    clone.start()
assert a.base is b.base
rejected(lambda: a.write(-1, 99), "page is outside the modeled mapping")
a.write(1, 99)
a.scratch["output.csv"] = b"id,value\n1,99\n"
assert (a.read(1), b.read(1), base[1]) == (99, 20, 20)
page_accounting_bytes = (len(base) + len(a.private) + len(b.private)) * PAGE_BYTES
print("page 1: A =", a.read(1), "B =", b.read(1), "base =", base[1])
print("modeled page-accounting KiB:", page_accounting_bytes // 1024)

a.request_cancel()
rejected(a.dispose, "execution retirement required")
assert a.private and a.scratch
rejected(lambda: a.confirm_retired("A", 2), "retirement identity mismatch")
a.confirm_retired("A", 1)
a.dispose()
assert not a.private and not a.scratch and not b.scratch
assert b.read(1) == 20
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

A's write changes its private mapping. B keeps the clean value. The 16 KiB page-accounting total counts one shared three-page base plus A's one private page. This arithmetic assigns a page to each base entry and private entry; operating-system and VMM overhead remain outside the model.

The second result is a cleanup invariant: requesting cancellation leaves A's resources owned until the controller confirms retirement for A's exact generation. The model catches an out-of-order disposal and a stale generation. It does not confirm that an actual device, process, mount, or remote request has stopped.

<figure>
  <img src="illustrations/_generated/generation_safe_retirement_dark.png" alt="The local dictionary model takes A/generation 1 through RESTORED, READY, RUNNING, CANCEL_REQUESTED, RETIRED, and DISPOSED. Missing readiness observations keep it RESTORED and reject execution. Cancellation keeps its private page 1 value 99 and output.csv owned. A retirement notice for A/generation 2 fails identity. Authoritative retirement for A/generation 1 is a trusted model assertion. In the integration lifecycle, remaining references must also close before disposal and resource reuse. A lost reply or heartbeat keeps ownership uncertain for reconciliation, with no timeout-to-free edge. B/generation 1 continues reading base value 20 with empty scratch. This model does not probe real VMM retirement." />
  <figcaption>Cancellation keeps A’s private 99 page and output.csv owned. The wrong generation cannot retire them. In this model, confirm_retired for A/generation 1 provides a trusted retirement assertion. A real integration must verify execution retirement and remaining reference closure before disposal and reuse. Lost replies require reconciliation while ownership stays held. B still reads 20 with empty scratch. The drawing executes no VMM retirement probe.</figcaption>
</figure>

## Reconcile failures before returning capacity

A controller can lose its reply while a VMM keeps running. Keep that instance uncertain, recover its authoritative state, and stop or adopt it under the same generation. A new controller should reconcile durable ownership with host processes, cgroups, sockets, volumes, and network objects.

| Failure | Evidence to inspect | Response owned by the platform |
|---|---|---|
| Runaway guest processes | Guest process limits, vCPU usage, output growth | Enforce guest limits and host CPU/output budgets |
| Private-memory growth | Host cgroup memory events, resident pages, guest OOM state | Reject new work, stop the affected instance under policy, and preserve host reserve |
| Lost controller heartbeat | Generation-bound process and resource inventory | Reconcile ownership before adoption or termination |
| Stalled page handler or storage | Fault progress, backend errors, instance deadline | Halt new sessions and retire the affected instance before reclaiming |
| Credential abuse | Broker caller, capability, operation, resource, and upstream result | Deny unauthorized operations and revoke the affected capability |
| Cleanup incomplete | Live process/FD references, mounts, network state, scratch ownership | Quarantine the instance resources until disposal is verified |

For an owned non-root process cgroup in a valid domain configuration, Linux `cgroup.kill` can terminate the cgroup tree. In a threaded cgroup, writing `cgroup.kill` fails with `EOPNOTSUPP` because the operation targets whole processes. Verify process exit and the remaining resource references before returning capacity.[^linuxCgroupV22026] A PID number or a timed heartbeat alone doesn't identify every resource safely, especially after PID reuse.

Before allowing a new tenant, check that the old generation has stopped, scratch and writable memory are no longer reachable, capabilities are revoked, and exported artifacts follow their retention policy. Then test that the new instance sees only the clean base. Fault-inject controller crashes, delayed cleanup, repeated events, and cold-page failures in the actual runtime.

The complete deployment evaluation also needs patched host/guest configurations, guest-escape testing appropriate to the threat model, cross-tenant network probes, resource-pressure tests, and measurements of the full readiness endpoint. The local model confirms the stated arithmetic and transitions.

### Follow-up questions

#### How would a sandbox read a 50 GiB model without copying it into its scratch layer?

Use an authorized read-only virtual block device backed by a managed image. Bind the image revision and access policy to the instance. Account for its I/O and resident page-cache working set, even when the underlying file is shared. A filesystem-sharing feature requires explicit support in the chosen VMM and guest configuration.

#### Why can a garbage collector increase private memory after restore?

Writes to marks, reference counts, or other heap metadata can break copy-on-write sharing. Reads can bring clean pages into RAM without making private modified copies. Measure the runtime's actual write pattern and resulting resident memory.

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
    "question": "A/generation 7 has current passing observations for clock, kernel_rng, network and control. Its only passing app_state record belongs to generation 6; the generation 7 app_state result is pending. What should the readiness gate do?",
    "options": [
      "Accept user work; retain the old app_state result for this restore.",
      "Keep user work held; repeat only the already passing control check.",
      "Accept user work; replace the missing app_state observation with kernel_rng.",
      "Keep user work held; obtain the current generation’s app_state result."
    ],
    "answer": "Keep user work held; obtain the current generation’s app_state result.",
    "explanation": "The application state observation must apply to the current owner. Kernel RNG, old application state and current application state are separate evidence. Repeating an already passing control check does not supply the missing current app_state result."
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
    "question": "A clean lower image contains policy.txt and runtime.bin. In one guest overlay, A deletes policy.txt and creates result.json. After A retires and all references close, the next generation gets fresh upper and work directories. Can A see policy.txt just before retirement, and which of policy.txt and result.json can the next generation see?",
    "options": [
      "A cannot see policy.txt. The next generation sees only policy.txt.",
      "A can see policy.txt. The next generation sees only policy.txt.",
      "A cannot see policy.txt. The next generation sees only result.json.",
      "A can see policy.txt. The next generation sees only result.json."
    ],
    "answer": "A cannot see policy.txt. The next generation sees only policy.txt.",
    "explanation": "Deleting policy.txt puts a whiteout in A’s upper layer. A lookup in the merged view encounters that whiteout, even though the lower image still contains the policy. A creates result.json in the same upper. The next generation starts with an empty upper and sees the original policy. Seeing the policy in A’s view would mean skipping the whiteout. Seeing only the result in the next view would require reusing A’s upper, including its whiteout and private file."
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
    "explanation": "The first port is one below the minimum of 1,073,741,824. The second is one below the excluded upper bound of 2,147,483,648, so it is valid. Accepting both would skip the range check on the first port. Each recv(1) consumes one byte. The read that consumes the newline leaves all four bytes of NEXT on the second socket. An empty socket would mean the reader had also consumed those four bytes."
  },
  {
    "question": "A new connection to an allowed API name now resolves only to an unauthorized private address, although an earlier connection used a public address. Separately, the API broker receives an expired capability for that API. Which pair of current actions follows the described network policy?",
    "options": [
      "Reuse the earlier DNS approval; make no upstream call for the expired capability.",
      "Block the new private connection; make no upstream call for the expired capability.",
      "Block the new private connection; construct the upstream call using the expired capability.",
      "Reuse the earlier DNS approval; construct the upstream call using the expired capability."
    ],
    "answer": "Block the new private connection; make no upstream call for the expired capability.",
    "explanation": "Every new connection needs its own validated destination. An earlier public answer does not authorize a new private address. The broker also validates current capability scope and expiry before constructing the upstream request. Both paths therefore stop before the prohibited effect."
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
    "explanation": "A stale generation notice cannot retire generation 9. Cancellation is a request; execution retirement at 5 s still leaves live references. KVM resources can survive through duplicated descriptors. At 9 s the specified retirement and closure conditions permit disposal under the remaining revocation and retention policy."
  }
]
```

> **Next:** Continue to [LLM-Powered Search Engine](/learn/design-llm-powered-search-engine). You can now trace a code session through resource ownership, readiness, and safe disposal. Search adds a different evidence criterion: a generated answer must preserve the current source, its exceptions, and the reader's access rights.
