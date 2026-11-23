---
{
  "id": "deep-dive-ray",
  "title": "Deep Dive - Ray",
  "slug": "deep-dive-ray",
  "section": "Project Deep Dives",
  "category": "MLOps & Deployment",
  "difficulty": "Hard",
  "order": 9,
  "coverImage": "illustrations/_generated/ray_core_execution_dark.png",
  "companies": [
    "Anyscale",
    "OpenAI",
    "Uber",
    "Amazon",
    "Microsoft"
  ],
  "shortDescription": "Restart the counter and it reports 0, even if the task results remain. Ray keeps process restart separate from recovered application state.",
  "keyConceptsTested": [
    "Ray tasks, actors, and object references",
    "Raylet scheduling versus GCS metadata",
    "Object-store memory, ownership, and lineage",
    "Placement groups and logical resources",
    "Ray Data, Train, Tune, RLlib, and Serve",
    "Ray Serve versus inference-engine responsibilities",
    "Task retry versus actor state recovery"
  ],
  "prerequisites": [
    "deep-dive-deepspeed",
    "deep-dive-vllm",
    "deep-dive-skyrl",
    "llm-deployment-gpu-serving-autoscaling"
  ],
  "relatedQuestions": [
    "deep-dive-mlflow",
    "deep-dive-pytorch",
    "deep-dive-vllm",
    "distributed-training-fsdp-deepspeed-zero"
  ]
}
---

A document-processing job finishes three tasks, and its counter reports `3`. Restart the counter's process and it reports `0`. The task results may still exist. Restarting a worker and recovering its application state are different operations, even when both sit behind the same remote-call API.

The last chapter treated <span data-glossary="deepspeed">DeepSpeed</span> as an engine inside a distributed training job. <span data-glossary="ray">Ray</span> handles a wider execution problem: where to run preprocessing functions, stateful workers, and serving replicas, and how to connect their results. Its three central abstractions are **tasks**, **actors**, and **object references**.[^ray2026core]

Use a tiny document job to understand those abstractions before considering GPUs. The local lab is pinned to Ray **2.58.0** and Python **3.12**. Architecture details below use that release's documentation and source, checked September 23, 2026; newer releases can change internal classes and defaults.[^ray258Release2026]

## Three pieces of a running job

A task is a remote function invocation. Each call has inputs, a return value, and its own execution. An actor is a remote class instance whose methods can read and update state kept in its process. An `ObjectRef` is a future-like handle to a result, not the result's bytes and not an instruction to place work on a particular machine.

| Primitive | In the document job | What survives another call? |
| --- | --- | --- |
| Task | `features.remote("cache")` | Its returned object while reachable; no promised worker-local state |
| Actor | `BatchLedger.remote()` | The actor's counter while that process survives |
| Object reference | The handle returned by a task or actor method | A dependency on that result, subject to ownership and lifetime rules |

Ordinary synchronous actor methods execute one at a time on their actor. From one submitter, submission order is the usual default, subject to out-of-order settings and retries; calls from different submitters have no guaranteed global execution order. Async or threaded actors have different concurrency behavior. Choose an actor when you need an identifiable state owner; account for the cost of a long-lived process.[^ray258ActorFaults2026]

The job's “vectors” are deterministic string features: length and character-code sum modulo 101. They aren't learned <span data-glossary="embedding">embeddings</span>. Computing them locally first keeps a distributed failure from hiding an arithmetic mistake.

<!-- leetllm: test, output=show -->
```python title="document-features.py"
def features(text: str) -> tuple[int, int]:
    return len(text), sum(map(ord, text)) % 101

vectors = [features(text) for text in ["cache", "router", "trace"]]
assert vectors == [(5, 96), (6, 67), (5, 22)]
print(vectors)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[(5, 96), (6, 67), (5, 22)]
```
<!-- leetllm: output:end -->

The calculation is too small to benefit from remote execution, but its readable output makes Ray's behavior easier to check. Real applications should batch work so serialization and scheduling overhead don't dominate useful computation.

## Keep the dependency remote

Decorating `features` with `@ray.remote(num_cpus=1)` gives it a `.remote(...)` entry point. Submission returns an `ObjectRef` before the result is ready. A downstream task or actor can accept that reference without the driver first fetching its value.

This excerpt from the downloadable lab submits all three tasks and sends their references as separate, top-level arguments to the ledger:

```python title="remote-dependency-excerpt.py"
refs = [features.remote(text) for text in ["cache", "router", "trace"]]
ledger = BatchLedger.remote()
count = ray.get(ledger.record.remote(*refs), timeout=20)
assert count == 3
```

Ray resolves each top-level reference before `record` runs, so the actor receives three tuples. The driver resolves only the small count. By contrast, `ledger.inspect_nested.remote(refs)` passes a list containing references: nesting them inside a container doesn't automatically replace them with values. A consumer can decide when to resolve those nested references.[^ray258Objects2026]

<figure>
<img src="illustrations/_generated/ray_core_execution_dark.png" alt="Three feature tasks produce cache(5,96), router(6,67), and trace(5,22). Passing their ObjectRefs as top-level record.remote(*refs) arguments resolves the three tuples before BatchLedger runs. The driver fetches only count 3. Passing a nested list to inspect_nested.remote(refs) instead leaves a list of ObjectRef handles for the actor." />
<figcaption>The driver connects results to a consumer without collecting the feature values itself. The counter belongs to the actor process; the task results and their ownership metadata have separate lifetimes.</figcaption>
</figure>

Moving a `ray.get` inside the submission loop changes more than memory use. `ray.get(features.remote(text))` waits before submitting the next task, serializing the pipeline. Submitting a list of references first preserves concurrency, but gathering every result at once can create a large memory peak. These are separate mistakes: **serial submission** and **unbounded collection**.

References aren't free. They consume metadata and keep objects alive through distributed reference counting. The owner also retains lineage for reconstructable work. Passing handles avoids unnecessary driver materialization. It doesn't make retained data or bookkeeping disappear.[^ray2026faultobjects]

That bookkeeping stays abstract until a process dies. What does one local runtime actually show?

## Run the local process-failure lab

A local runtime can show the failure without a GPU. Download [ray_core_lab.py](assets/ray_core_lab.py). With `uv` installed, run it from the download directory:

```bash title="Run the local Ray process-failure lab"
uv run --python 3.12 ray_core_lab.py
```

The file pins `ray==2.58.0` in its script metadata. It starts a **new local runtime**, not an existing cluster, with two logical CPUs, no GPUs, no dashboard, and an 80 MiB object-store budget. Those settings aren't an 80 MiB total-memory limit: Ray's control processes and Python workers use additional memory. Run it on a development machine with spare capacity, not on a shared production node.

The lab performs four checks:

1. Reserve two one-CPU bundles with `STRICT_PACK`, execute two tasks in those reserved bundles, then remove the group.
2. Pass three top-level references into the ledger and verify `completed == 3`; also verify that references nested in a list remain references.
3. Kill the ledger process with restart enabled, wait until its process ID changes, and verify the fresh constructor's count is `0`.
4. Deliberately exit a task worker once, then verify that its configured retry succeeds.

The last check uses a temporary local marker to make the crash happen once. That's a **single-node fault-injection fixture**, not a shared checkpoint or a distributed <span data-glossary="idempotency">idempotency</span> design. The lab doesn't kill the raylet or GCS, and it doesn't test lost-object reconstruction across machines.

A successful run emits this result, alongside Ray startup or deliberate-worker-failure diagnostics:

```json title="Successful single-node lab result"
{
  "actor_restarted": true,
  "count_after_restart": 0,
  "logical_cpus": 2,
  "nested_refs_preserved": true,
  "nodes": 1,
  "placement_group_tasks": 2,
  "ray": "2.58.0",
  "recorded": 3,
  "worker_retry": "worker crash retried"
}
```

The script shuts down its runtime in `finally` and uses a temporary directory for runtime files. Individual waits have timeouts. It doesn't run `ray stop`, which could disrupt unrelated local Ray sessions. An abrupt process kill or machine failure can bypass Python cleanup; inspect remaining processes before removing runtime files.

Notice the restart test's waiting condition. `ray.kill` initiates termination; an immediate read can race with that operation and still return the old process's state. A count alone isn't enough evidence of a restart. The test waits for a new PID before checking the constructor value.

## What schedules the work?

Each Ray node runs a **raylet**, which manages local worker execution and resources and participates in scheduling. The **Global Control Service (GCS)** maintains cluster-level metadata and operations, including actors, nodes, and placement groups. GCS isn't the process that executes your Python functions.[^ray258GcsFaultTolerance2026]

Ordinary task scheduling can consider data locality and available resources. Actor creation involves cluster-level coordination and placement, but calling a method on an existing actor doesn't move that actor to a new node. The process already owns its state. If an actor needs a large remote argument, the argument must reach the actor rather than the actor following every input.

`num_cpus=1` is a logical scheduling request. It doesn't pin a worker to one CPU core or prevent it from launching many native threads. Ray sets `OMP_NUM_THREADS` from that request unless you override it, but libraries with their own thread pools may need separate settings. GPU requests guide assignment through visible-device settings; they aren't GPU-memory reservations or a security boundary. Declare resources accurately and separately configure worker concurrency, native thread counts, memory budgets, and OS/container isolation.[^ray258Resources2026]

An actor explicitly requesting one CPU holds that scheduling resource during its lifetime. On a two-CPU local runtime, that leaves one CPU slot for tasks. A waiting actor method doesn't automatically free the actor's reserved resource. This matters when composing worker pools: code can wait forever for children whose resource requests can't fit.

## Reserve a group, then use its bundles

Suppose a training trial needs four one-GPU workers. Launching four unrelated actors can leave two occupying GPUs while the other two wait. A placement group requests the resources together. Its initial creation is atomic: either all requested bundles can be reserved or the group remains pending without a partial initial reservation.[^ray258PlacementGroups2026]

Each **bundle** must fit on one node. Four `{"GPU": 1}` bundles can span nodes; one `{"GPU": 4}` bundle can't be split across four one-GPU nodes. The strategy controls the relationship among bundles:

| Strategy | Placement requirement |
| --- | --- |
| `PACK` | Prefer packing bundles together; allow multiple nodes if necessary |
| `STRICT_PACK` | All bundles must fit on one node |
| `SPREAD` | Prefer spreading bundles across nodes; reuse nodes if necessary |
| `STRICT_SPREAD` | Each bundle must be on a different node |

For example, with two nodes containing two free GPUs each, four one-GPU bundles can satisfy `PACK` but not `STRICT_PACK`. Having four GPUs in aggregate doesn't satisfy a same-node requirement. Neither policy alone promises NVLink connectivity or a particular physical GPU ordering.

A reservation isn't automatic enrollment. Tasks and actors must use `PlacementGroupSchedulingStrategy` to consume its resources. The lab passes both the group and a bundle index explicitly. It also removes the group before creating unrelated work, so reserved CPUs aren't left unavailable to ordinary tasks.

Initial atomic placement applies when the group is created. If a node later dies, some bundles may remain alive while Ray tries to recover the lost ones. The application still needs a policy for partial worker-group failure.[^ray258PlacementGroups2026]

```checkpoint
Two nodes each have two free GPUs. A model needs four GPUs on one node. Would four one-GPU bundles using PACK enforce that requirement?
---
No. PACK can spread the bundles across both nodes. STRICT_PACK expresses the same-node requirement and remains pending on this cluster. You need a node with enough available resources, a different model topology, or a different requirement.
```

## Object bytes, owners, and memory

Large remote values usually live in node-local shared-memory object stores; small values can travel inline. An object may have copies on several nodes. Its `ObjectRef` doesn't identify a single permanent storage location.

`ray.get` makes a value available to the caller. Ordinary Python structures can require deserialization into the worker heap. Eligible NumPy arrays can instead use zero-copy views backed by local shared object-store memory. Such reads still retain memory and can require inter-node transfer first. “Every get copies the payload into the driver heap” and “references cost zero bytes” are both wrong simplifications.[^ray258Objects2026]

The **owner** is the process that originally creates the reference, usually by submitting `.remote()` or calling `ray.put`. For a task submitted by the driver, the driver usually owns the reference while a different worker computes its value. This distinction is central to the NSDI 2021 Ownership design, which decentralizes object metadata and reference counting.[^cheng2021ray]

Three questions explain most recovery cases:

| What disappeared? | What Ray can try | What can prevent recovery? |
| --- | --- | --- |
| One stored copy | Fetch another copy | No remaining accessible copy |
| All copies of a task result | Re-execute its generating task and dependencies | Dead owner, unavailable lineage/dependencies, exhausted retries |
| Actor process | Restart when configured | Constructor doesn't restore prior mutable state |
| Object owner | Surface owner failure | Ray doesn't recover that object's metadata from its surviving bytes |

Objects created with `ray.put` have no generating task to replay. That matters when **all copies of their data** are lost, even if the owner is alive. Owner loss is a separate limitation applying to task outputs too. Actor-method outputs aren't reconstructed by default; enabling method retries doesn't turn arbitrary actor mutations into deterministic computations.[^ray2026faultobjects]

Ray's object store can spill data to disk under pressure. Worker heap usage is separate, and disk spilling adds I/O and disk-capacity requirements. Watch both. A zero-copy array held by a Python variable can keep an object alive even after another reference is deleted. Unlimited pending tasks can also consume memory before results exist.

For a large stream, cap in-flight work and use `ray.wait` to consume a bounded number of ready results. Refilling a fixed-size window bounds pending work; merely calling `ray.wait` after submitting a million tasks doesn't. For block-oriented processing, Ray Data provides a higher-level streaming executor rather than requiring you to manage every task reference.[^ray2026data]

## A retry can repeat an effect

The lab's `fail_worker_once` is configured with `max_retries=1`. Its first process exits; Ray retries that task and the second execution returns. This tests worker-failure retry, not lineage reconstruction of an already completed result. Ordinary tasks default to three system-failure retries. Retrying Python exceptions also requires `retry_exceptions`, which defaults to `False`; setting only `max_retries` doesn't enable it.[^ray258TaskFaults2026]

For ordinary tasks, repeatability and side effects need separate checks. A deterministic calculation can regenerate the same bytes. A deterministic function that appends a billing event can still append it twice. External effects need idempotency or a transactional protocol, and their return values must remain consistent enough for downstream computation.

Actors add two controls: `max_restarts` governs process recreation, while `max_task_retries` governs method retry. Both default to zero. A process may fail after mutation but before the caller receives its result, so retrying a non-idempotent `increment` can double-count.[^ray258ActorFaults2026]

A ledger that can survive restart would associate a stable batch ID with its recorded result and commit both the count change and deduplication record atomically to durable storage. Its constructor would restore state from that storage. A detached actor changes ownership and lifetime, not durability. It isn't a replacement for checkpointing.

## Libraries compose the same runtime

The 2018 Ray paper introduced a unified task-and-actor interface for dynamic AI workloads.[^moritz2018ray] The modern libraries build higher-level workflows on that runtime, but their responsibilities differ:

| Library | Work it organizes | Work still owned elsewhere |
| --- | --- | --- |
| Ray Data | Dataset blocks, transformations, batch inference and training ingest | Model semantics and correctness of transformations |
| Ray Train | Distributed training workers and coordination | Framework-specific forward/backward computation and collectives |
| Ray Tune | Trials, resource allocation, search and stopping decisions | Validity of the objective and evaluation split |
| RLlib | Reinforcement-learning sampling and learning components | Whether the reward and environment match the intended task |
| Ray Serve | Deployment replicas, request routing and scaling | Model-engine token scheduling and kernels |

Ray Data streams data through execution stages and applies backpressure to avoid unbounded upstream production. That doesn't mean every operator is purely streaming or every workload stays within a tiny memory footprint. A global shuffle, slow sink, or oversized batch can still dominate the job.[^ray2026data]

Ray Train coordinates training workers and integrates with frameworks, reporting and checkpoints. It doesn't replace PyTorch's gradient computation, DeepSpeed's optimizer partitioning, or the communication backend's collectives. Persisting a checkpoint and deciding which state it must contain remain part of the training application.[^ray2026train]

A library name isn't a reason to distribute a small script. Ray earns its operational cost when dynamic parallel work, heterogeneous resources, or composition across distributed stages solves a real bottleneck. Measure task granularity and end-to-end throughput before adding more workers. Serving makes that split sharper. Who chooses the replica, and who chooses the next token?

## Serve routes requests; the engine schedules tokens

A Serve **deployment** defines a component, and each **replica** is a Ray actor running an instance of it. A deployment handle routes calls to replicas. For LLM serving, an ingress accepts HTTP requests and routing chooses an engine replica. That choice is not the token schedule. The engine batches and executes the token work.

<figure>
<img src="illustrations/_generated/ray_llm_control_plane_dark.png" alt="Ray Serve routes each request to an LLMServer actor inside a logical engine replica. Its engine client invokes the inference engine and GPU workers. Ray places workers and scales replicas; the engine schedules token batches, KV state and kernels. Dashed telemetry from the engine informs replica routing." />
<figcaption>Replica routing and token scheduling are distinct decisions. Sending a request to another replica may change cache reuse and queueing, but it doesn't replace the engine's internal batch scheduler.</figcaption>
</figure>

The 2.58.0 architecture docs describe `OpenAiIngress`, `LLMServer`, and an `LLMEngine` abstraction. For the standard vLLM layout, the server replica requests a CPU and creates a placement group for GPU workers; tensor-parallel size times pipeline-parallel size determines that layout's worker count. Calculate worker placement separately for expert-parallel and disaggregated deployments.[^ray258ServeArchitecture2026]

The integration boundary can move. Ray 2.58.0's release notes describe tokenization and KV-aware routing in `LLMRouter`, with engine-cache events informing replica choice. Therefore, “Ray never sees tokens or cache information” is too strong. The useful distinction is **routing among engine instances** versus **scheduling and allocating state inside an engine**.[^ray258Release2026]

vLLM remains responsible for its continuous batching, KV-cache allocator and kernels. SGLang is another documented integration, with its own support and execution details. Don't assume every engine implements every Serve LLM feature identically. Validate the chosen model, engine, parallelism and package versions as a combination.

If inter-token latency rises, inspect both sides of the boundary: engine queueing and cache pressure, plus routing concentration, ingress CPU saturation and network behavior. Measure token-generation latency and ingress throughput separately from HTTP health and GPU utilization.

## Control-plane recovery has its own state

GCS recovery isn't actor checkpoint recovery. In the default in-memory configuration, losing GCS loses control metadata. Ray 2.58.0 documents a supported external-Redis fault-tolerance setup for KubeRay with Ray Serve, and a Linux-only **alpha** embedded-RocksDB backend on persistent storage. Neither is enabled by declaring task retries.[^ray258GcsFaultTolerance2026]

During a recoverable GCS outage, existing tasks, actors and objects can remain available while actor creation, placement-group operations and other control functions pause. Worker reconnection deadlines and the survival of backing storage still matter. Losing the entire head node or actor node is different from restarting only the GCS process.

Don't infer uninterrupted requests from a recovered control plane. Test the actual failure boundary: kill one actor, lose an object-store node, interrupt GCS, or lose its storage. Record what continued, what was retried, what became unavailable, and whether any external effect repeated. The local lab covers only worker and actor processes on one node. Where do the untested metadata and recovery paths live in the source?

## Read the source with one question in mind

The `ray-2.58.0` tag is where those untested paths can be checked. Start at `python/ray/remote_function.py` for task submission and `python/ray/actor.py` for actor handles. Follow the Python-to-CoreWorker boundary before opening `src/ray/raylet/` and `src/ray/gcs/`. Keep two traces separate: “where does this execution run?” and “who owns this result's metadata?”[^ray2026repo]

For Serve, follow the public builder into its deployment, engine client and routing implementation. Compare code at the pinned tag with the version's architecture pages; a conceptual diagram can lag a refactor. Explain one request's path before trying to summarize the entire repository.

Ray originated at UC Berkeley; the 2018 paper records the initial research team. Anyscale's history dates Ray's development to 2016-2017 and its company founding to 2019.[^moritz2018ray][^ray2026anyscale] Ray's governance describes contributors, committers, a technical steering committee and lead maintainers under LF Projects. Anyscale's commercial platform and the open-source project's technical governance aren't the same thing.[^ray2026projectgovernance]

Ray source is distributed under Apache-2.0. Check the license for each model weight, dataset, or other artifact your job processes.[^ray2026license] Runtime ownership of an `ObjectRef` describes its fault-tolerance role; artifact copyright follows the relevant artifact license.

## Evaluation rubric

A restarted counter can report 0 while its task results still exist. Choosing a Serve replica is not the same as scheduling tokens inside the engine.

- Explain the difference between a returned value, an object reference, and the process owning its metadata.
- Trace top-level and nested references through the local lab without claiming that handles use no memory.
- Distinguish logical resource declarations, bundle reservations and hard placement constraints.
- Use process identity and state together to verify actor restart, then explain why a restart isn't restoration.
- Separate the tested local failure cases from untested node loss, GCS recovery and GPU serving behavior.

## Follow-up questions

```checkpoint
How would you change BatchLedger so a retried batch can't increment the count twice after a restart?
---
Give each batch a stable ID. Atomically persist the count change and the ID-to-result record, then restore that durable state in the constructor. A retry returns the stored result. Keeping the ID only in actor memory loses deduplication on restart.
```

```checkpoint
Why can a completed task result still become unavailable even when another node has its bytes?
---
The process owning the original ObjectRef also owns required metadata. Ray doesn't recover objects after owner failure merely from surviving copies. Keeping a reference in another process doesn't transfer ownership.
```

```checkpoint
What would a two-node extension of the lab need to establish that its local run cannot?
---
Verify that producers and consumers actually ran on different nodes, observe object transfer, and inject a bounded node failure while preserving the owner. Record task replay and output equality. A single-node worker crash doesn't test network transfer, node loss, or object reconstruction.
```

```mastery-quiz
[
  {
    "question": "A four-logical-CPU node runs two actors, each explicitly reserving one CPU for its lifetime. No other work is running. Each new ordinary task requests one CPU. What is the largest number of those tasks that can run together under this resource budget?",
    "options": [
      "Four tasks; actor reservations release their units during waits.",
      "Two tasks; the actors retain two logical CPU units.",
      "Three tasks; waiting actors share one reservation.",
      "One task; the driver consumes the fourth declared unit."
    ],
    "answer": "Two tasks; the actors retain two logical CPU units.",
    "explanation": "Four minus two explicit actor reservations leaves two logical CPUs, so two one-CPU tasks fit. Waiting does not release an explicit lifetime reservation. This is admission arithmetic, not physical CPU pinning."
  },
  {
    "question": "Three independent tasks need 5, 3 and 2 supplied time units. With two identical workers, tasks5 and 3 start at zero, and the last task starts immediately when the 3-unit task finishes. Ignore overhead. Which serial/concurrent finish pair follows?",
    "options": [
      "Serial8; concurrent5.",
      "Serial10; concurrent7.",
      "Serial10; concurrent8.",
      "Serial10; concurrent5."
    ],
    "answer": "Serial10; concurrent5.",
    "explanation": "Serial work sums to 10. The second worker completes3+2 at 5 while the first completes5 at 5, so the supplied concurrent schedule also finishes at 5. Immediate submit-and-get would keep the next task from existing in time to overlap."
  },
  {
    "question": "A completed task reference a names integer4, and reference b names integer9. A consumer is invoked as inspect.remote(a, [b]). Before inspect chooses to perform any explicit get, which pair describes its two arguments?",
    "options": [
      "Integer4; a list containing ObjectRef b.",
      "ObjectRef a; a list containing integer9.",
      "Integer4; a list containing integer9.",
      "ObjectRef a; a list containing ObjectRef b."
    ],
    "answer": "Integer4; a list containing ObjectRef b.",
    "explanation": "Ray automatically resolves the separate top-level reference a. The nested list retains b as an ObjectRef even though its task has completed. The consumer can explicitly resolve that nested handle later."
  },
  {
    "question": "Two nodes each have3 free GPUs. A new group asks for four separate one-GPU bundles, and no competing work arrives. Compare PACK with STRICT_SPREAD. Which initial readiness pair follows?",
    "options": [
      "PACK ready; STRICT_SPREAD ready.",
      "PACK pending; STRICT_SPREAD ready.",
      "PACK ready; STRICT_SPREAD pending.",
      "PACK pending; STRICT_SPREAD pending."
    ],
    "answer": "PACK ready; STRICT_SPREAD pending.",
    "explanation": "PACK may place the four bundles across the two nodes because aggregate capacity is enough and each bundle fits. STRICT_SPREAD requires four different nodes, so it remains pending. Initial reservation does not partially allocate that failed group."
  },
  {
    "question": "Two task results have live owners. ResultA loses every payload copy, and its required input was created by ray.put and has also lost every copy. ResultB still has an accessible remote copy, but its generating task has no retries left. Which recovery pair follows?",
    "options": [
      "A lacks replayable input; B fetches its retained remote copy.",
      "A replays its lost input; B exhausts reconstruction before fetch.",
      "A lacks replayable input; B exhausts reconstruction before fetch.",
      "A replays its lost input; B fetches its retained remote copy."
    ],
    "answer": "A lacks replayable input; B fetches its retained remote copy.",
    "explanation": "A needs its transitive dependency, but the lost ray.put input has no generating task to replay. B does not need replay while an accessible copy and its live owner remain. A retry budget limits reconstruction, not ordinary retrieval of an existing value."
  },
  {
    "question": "A worker keeps a zero-copy view of one 48 MiB local object-store array, then deletes only the ObjectRef variable. Its ordinary Python heap also retains 30 MiB of unrelated structures. No other view or reference is removed. Which retained-payload accounting follows?",
    "options": [
      "Object-store array 0 MiB; ordinary heap 30 MiB.",
      "Object-store array 48 MiB; ordinary heap 78 MiB.",
      "Object-store array 30 MiB; ordinary heap 48 MiB.",
      "Object-store array 48 MiB; ordinary heap 30 MiB."
    ],
    "answer": "Object-store array 48 MiB; ordinary heap 30 MiB.",
    "explanation": "The live zero-copy view still points into the 48 MiB shared allocation, so deleting one ObjectRef does not free it. The unrelated30 MiB heap remains a separate category. Runtime overhead is outside these stated payload quantities, and shared pages must not be duplicated into the private-heap total."
  },
  {
    "question": "Task T has max_retries=4 and retry_exceptions=False. Its only failures are worker exits. A separate actor has max_restarts=1 and max_task_retries=0. It crashes after applying an update but before replying. What is the maximum total number of starts for T, and how many times can Ray automatically replay the actor method?",
    "options": [
      "4 task starts and 1 method replay.",
      "5 task starts and 1 method replay.",
      "5 task starts and 0 method replays.",
      "4 task starts and 0 method replays."
    ],
    "answer": "5 task starts and 0 method replays.",
    "explanation": "T can start once and then retry up to four times if workers keep exiting. A maximum of four starts leaves out the original. The actor can restart once, but its method retry budget is zero. A lost reply can leave the caller unaware that the update already happened."
  },
  {
    "question": "Three isolated replicas use the standard vLLM layout in Ray 2.58.0. Each has a tensor-parallel size of 4, a pipeline-parallel size of 2, and one LLMServer actor that reserves one CPU. How many GPU-worker bundles and LLMServer actors do the replicas need in total, and who decides which requests join the next token batch at a replica?",
    "options": [
      "12 GPU-worker bundles, 3 LLMServer actors, the Serve router.",
      "24 GPU-worker bundles, 3 LLMServer actors, the vLLM engine.",
      "24 GPU-worker bundles, 3 LLMServer actors, the Serve router.",
      "12 GPU-worker bundles, 3 LLMServer actors, the vLLM engine."
    ],
    "answer": "24 GPU-worker bundles, 3 LLMServer actors, the vLLM engine.",
    "explanation": "Each replica needs 4 GPU workers in each of 2 pipeline stages. Across 3 replicas, that gives 24 worker bundles and 3 LLMServer actors. A total of 12 counts only one stage per replica. Serve uses information such as cache availability to choose a replica. Once a request reaches that replica, its vLLM engine chooses the next token batch."
  },
  {
    "question": "A running actor with count 7 and an existing task survive while only a durably backed GCS process restarts. Its backing storage remains accessible. Which recovery interpretation follows during the reload?",
    "options": [
      "Actor retains 7 in its process; new actor/group operations remain available.",
      "Actor resets 0 in its process; new actor/group operations remain unavailable.",
      "Actor resets 0 in its process; new actor/group operations remain available.",
      "Actor retains 7 in its process; new actor/group operations remain unavailable."
    ],
    "answer": "Actor retains 7 in its process; new actor/group operations remain unavailable.",
    "explanation": "Surviving actor process state is separate from reloading GCS control metadata. The documented recovery pauses actor and placement-group control operations while existing work can remain alive. This does not promise uninterrupted requests, and GCS storage is not the actor’s application checkpoint."
  },
  {
    "question": "A ledger starts at 7. For a new batch, it returns the updated count and saves that reply under the batch ID in the same transaction as the increment. A retry must leave the count unchanged and return the original reply. B92 commits an increment of 3, but its reply is lost. After the ledger restarts and restores its count and receipts, the caller retries B92, sends B93 to add 2, then retries B92 again. What are the three replies in order and the final count?",
    "options": [
      "Replies (10, 12, 12) with a final count of 12.",
      "Replies (10, 12, 10) with a final count of 12.",
      "Replies (13, 15, 18) with a final count of 18.",
      "Replies (13, 15, 13) with a final count of 15."
    ],
    "answer": "Replies (10, 12, 10) with a final count of 12.",
    "explanation": "B92 records 7 + 3 = 10, so its first retry returns 10. B93 records 10 + 2 = 12. B92 still has a receipt for 10, and reading it leaves the count at 12. Returning 12 on the last call substitutes the latest count for B92's reply. Ending at 18 applies B92 on both retries. Ending at 15 loses B92's receipt on restart and applies it one extra time."
  }
]
```

> **Next:** Continue to [Deep Dive - MLflow](/learn/deep-dive-mlflow). Ray tracks execution and resource placement. MLflow records the experiment inputs, parameters, metrics and artifacts needed to compare the results of those executions.
