---
{
  "id": "deep-dive-ray",
  "title": "Deep Dive - Ray",
  "slug": "deep-dive-ray",
  "section": "Project Deep Dives",
  "category": "MLOps & Deployment",
  "difficulty": "Hard",
  "order": 10,
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
    "distributed-training-fsdp-deepspeed-zero",
    "deep-dive-vllm",
    "rlvr-verifiable-rewards-training",
    "llm-deployment-gpu-serving-autoscaling"
  ],
  "relatedQuestions": [
    "deep-dive-pytorch",
    "deep-dive-vllm",
    "distributed-training-fsdp-deepspeed-zero"
  ]
}
---

A document-processing job finishes three remote tasks, and its stateful counter reports `3`. Kill and restart that counter process, and it immediately reports `0`, even though the three task outputs may still sit intact in cluster memory. Restarting a worker process and recovering its application state are two completely different operations, even when they live behind the same Python remote-call API.

The previous chapter examined <span data-glossary="deepspeed">DeepSpeed</span> inside a single distributed training job. <span data-glossary="ray">Ray</span> solves the orchestration layer around it: placing preprocessing workers, stateful actors, training groups, and LLM serving replicas across a cluster, and passing results between them through three core primitives: **tasks**, **actors**, and **object references**.[^ray2026core][^ray258Release2026]

## Three pieces of a running job

A **task** is a stateless remote function call: inputs go in, a result comes out. An **actor** is a long-lived remote class instance that holds mutable state in its process memory. An **`ObjectRef`** is a future-like handle pointing to a task or actor result.

| Primitive | In our document job | What survives across calls? |
| --- | --- | --- |
| Task | `features.remote("cache")` | Returned object while referenced; no worker-local state |
| Actor | `BatchLedger.remote()` | The actor's in-memory counter while that process lives |
| `ObjectRef` | Handle returned by `.remote()` | A dependency on the result, governed by owner lifetime |

By default, synchronous actor methods execute sequentially one at a time on their actor process, preserving submission order from a single caller (unless out-of-order execution or retries are enabled; concurrent callers have no global ordering). Async and threaded actors allow overlapping calls inside one actor.[^ray258ActorFaults2026]

Start with a tiny deterministic feature extractor so we can inspect Ray's execution mechanics clearly before distributing anything:

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

In real workloads, batch enough work into each remote task that compute time easily outweighs serialization and scheduling overhead.

## Keep the dependency remote

Decorating `features` with `@ray.remote(num_cpus=1)` lets us invoke `.remote(...)`, which returns an `ObjectRef` immediately without waiting for execution. Better yet, you can pass those `ObjectRef`s directly into a downstream task or actor so the driver never has to pull the intermediate bytes over the network:

```python title="remote-dependency-excerpt.py"
refs = [features.remote(text) for text in ["cache", "router", "trace"]]
ledger = BatchLedger.remote()
count = ray.get(ledger.record.remote(*refs), timeout=20)
assert count == 3
```

Because `*refs` passes each `ObjectRef` as a top-level argument, Ray resolves all three tuples automatically before `record` executes, and the driver fetches only the final integer `3`. By contrast, passing a container like `ledger.inspect_nested.remote(refs)` leaves the `ObjectRef` handles unresolved inside the list so the consumer can decide when to call `ray.get`.[^ray258Objects2026]

<figure>
<img src="illustrations/_generated/ray_core_execution_dark.png" alt="Three feature tasks produce cache(5,96), router(6,67), and trace(5,22). Passing their ObjectRefs as top-level record.remote(*refs) arguments resolves the three tuples before BatchLedger runs. The driver fetches only count 3. Passing a nested list to inspect_nested.remote(refs) instead leaves a list of ObjectRef handles for the actor." />
<figcaption>The driver wires task outputs straight to a downstream actor without pulling intermediate values locally. Actor state lives in the actor process, while task outputs follow object-reference lifetimes.</figcaption>
</figure>

> **Common mistake:** Calling `ray.get(features.remote(text))` inside a loop. That blocks on every task before submitting the next, completely serializing execution. Conversely, submitting a million tasks and calling `ray.get` on all of them at once spikes memory. Submit in batches and drain a bounded window with `ray.wait`.

Even unresolved `ObjectRef`s consume resources: they hold distributed reference-counting metadata and keep underlying objects (and lineage) alive until dropped.[^ray2026faultobjects]

## Run the local process-failure lab

Download [ray_core_lab.py](assets/ray_core_lab.py) and run it locally with `uv` (it spins up an isolated two-CPU local Ray runtime and shuts it down cleanly on exit):

```bash title="Run the local Ray process-failure lab"
uv run --python 3.12 ray_core_lab.py
```

The lab walks through four concrete behaviors on one machine:
1. Reserves two one-CPU bundles with `STRICT_PACK`, runs two tasks inside them, and releases the placement group.
2. Passes three top-level `ObjectRef`s to `BatchLedger` (`completed == 3`) and confirms that nested references inside a list stay unresolved handles.
3. Kills the actor process with restarts enabled, waits for its OS PID to change, and verifies that the fresh actor constructor starts back at `count == 0`.
4. Crashes a task worker once and observes Ray's automatic retry succeed.

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

Notice why the lab checks the actor's PID after `ray.kill`: termination is asynchronous, so reading immediately can race against the dying process and return the stale count `3`. Checking the PID confirms we are talking to the restarted instance.

## What schedules the work?

Every node runs a **raylet**, which tracks local resources, schedules tasks, and launches workers. Cluster-wide metadata (node membership, actor directory, placement groups) lives in the **Global Control Service (GCS)**, which coordinates metadata without executing user Python functions.[^ray258GcsFaultTolerance2026]

Stateless tasks can be placed near their input objects wherever free resources exist. Actors, once placed, stay pinned to their node because they own in-memory state; large arguments move to the actor rather than the actor migrating to its inputs.

Logical resource requests (`num_cpus=1`, `num_gpus=1`) are **scheduling reservations**, not hard OS cgroup limits or GPU memory quotas. Ray sets `OMP_NUM_THREADS` and visible GPU environment variables accordingly, while thread pools and memory isolation still need explicit configuration.[^ray258Resources2026]

> **Key insight:** An actor that requests `num_cpus=1` holds that logical CPU slot for its entire lifetime, even while idle or waiting on a child task. On a small cluster, launching parent actors that block on child tasks without leaving headroom deadlocks the scheduler.

## Reserve a group, then use its bundles

If a distributed training job needs four GPUs simultaneously, launching four independent actors risks grabbing two GPUs while waiting indefinitely for the other two. A **placement group** reserves resources atomically: either every requested bundle fits at creation time, or the group stays pending without partially locking up the cluster.[^ray258PlacementGroups2026]

Each **bundle** must fit on a single node (so `{"GPU": 4}` requires a 4-GPU node, whereas four `{"GPU": 1}` bundles can span nodes depending on strategy):

| Strategy | Placement rule |
| --- | --- |
| `PACK` | Prefer co-locating bundles; spill across nodes if needed |
| `STRICT_PACK` | Every bundle must land on one node |
| `SPREAD` | Prefer spreading across nodes; reuse nodes if needed |
| `STRICT_SPREAD` | Every bundle must land on a distinct node |

On two nodes with two free GPUs each, four `{"GPU": 1}` bundles satisfy `PACK` (2 + 2) but remain pending under `STRICT_PACK` (no single node has 4 GPUs) and `STRICT_SPREAD` (fewer than 4 nodes exist).

Creating a placement group only reserves the slots; tasks and actors must opt in via `PlacementGroupSchedulingStrategy` with the group and bundle index, and you should remove the group once the job finishes so those slots return to the cluster. Note also that atomic reservation applies at creation time; if a node fails later, surviving bundles remain alive while Ray recovers the lost ones, so your training job still handles partial group failures.[^ray258PlacementGroups2026]

```checkpoint
Two nodes each have two free GPUs. A model needs four GPUs on one node. Would four one-GPU bundles using PACK enforce that requirement?
---
No. PACK allows spilling across both nodes. Use STRICT_PACK to enforce single-node placement (which will wait until a 4-GPU node is available).
```

## Object bytes, owners, and memory

Small objects travel inline inside task messages; larger objects live in node-local shared-memory **object stores** (Plasma), with copies fetched across nodes on demand. Calling `ray.get` deserializes ordinary Python objects onto the worker heap, whereas eligible NumPy arrays can expose **zero-copy views** directly into local shared memory. Holding onto a zero-copy NumPy view keeps the underlying object-store allocation pinned even if you delete the `ObjectRef` variable.[^ray258Objects2026]

Every object has a single **owner**: the process that created its `ObjectRef` via `.remote()` or `ray.put()` (often the driver). This decentralized ownership model (from the NSDI 2021 Ray architecture) keeps reference counting and lineage off a central bottleneck.[^cheng2021ray]

| What failed? | How Ray recovers | When recovery stops |
| --- | --- | --- |
| One object copy | Fetches another surviving copy | No accessible copies remain |
| All copies of a task output | Replays the generating task from lineage | Dead owner, lost `ray.put` input, or retries exhausted |
| Actor process | Restarts actor if `max_restarts > 0` | Constructor resets mutable in-memory state |
| Object owner | Reports `OwnerDiedError` | Surviving copies cannot recover lost owner metadata |

Because `ray.put` objects have no generating task, losing all copies makes them unrecoverable even while the owner is alive.[^ray2026faultobjects] Under memory pressure, the object store spills to local disk (watch disk I/O and capacity separately from Python heap usage). For large streams, cap in-flight tasks with `ray.wait` or use **Ray Data** for built-in streaming backpressure.[^ray2026data]

## A retry can repeat an effect

Ordinary tasks retry up to `3` times on worker crashes (`max_retries`), while Python exceptions are not retried unless `retry_exceptions=True`.[^ray258TaskFaults2026] Actors separate process recreation (`max_restarts`, default `0`) from method replay (`max_task_retries`, default `0`).[^ray258ActorFaults2026]

Automatic replay is safe for pure computations, but a worker can crash *after* mutating an external database or incrementing an actor counter and *before* returning its reply. Retrying a non-idempotent update double-counts it. To survive restarts cleanly, a stateful counter like `BatchLedger` needs durable storage that atomically persists both the updated count and a batch-ID deduplication receipt, restoring both in its constructor. Marking an actor as `detached` changes its lifetime, not its durability.

## Libraries compose the same runtime

Ray's ecosystem layers specialized libraries on top of tasks, actors, and placement groups, each owning a clear slice of the stack:[^moritz2018ray]

| Library | What it orchestrates | What stays elsewhere |
| --- | --- | --- |
| Ray Data | Streaming dataset blocks, transforms, batch inference | Model math and transform correctness |
| Ray Train | Distributed worker launch, coordination, checkpoint hooks | PyTorch/DeepSpeed/NCCL compute internals |
| Ray Tune | Hyperparameter search trials and stopping schedules | Objective validity and eval splits |
| RLlib | RL rollout workers and learner orchestration | Environment semantics and reward design |
| Ray Serve | Deployment replicas, HTTP ingress, autoscaling, routing | Engine-level token batching and GPU kernels |

Ray Data streams blocks with backpressure (though global shuffles and slow sinks still build memory pressure).[^ray2026data] Ray Train launches distributed workers without replacing PyTorch autograd or DeepSpeed ZeRO.[^ray2026train] Reach for Ray when dynamic parallelism, heterogeneous resources, or multi-stage pipelines actually require distributed coordination.

## Serve routes requests; the engine schedules tokens

In **Ray Serve**, a **deployment** is a scalable service component and each **replica** is a Ray actor. For LLM serving, `OpenAiIngress` receives HTTP traffic and `LLMRouter` picks an `LLMServer` replica, while the underlying inference engine (such as vLLM or SGLang) owns continuous batching, KV-cache blocks, and GPU kernels.[^ray258ServeArchitecture2026]

<figure>
<img src="illustrations/_generated/ray_llm_control_plane_dark.png" alt="Ray Serve routes each request to an LLMServer actor inside a logical engine replica. Its engine client invokes the inference engine and GPU workers. Ray places workers and scales replicas; the engine schedules token batches, KV state and kernels. Dashed telemetry from the engine informs replica routing." />
<figcaption>Serve routes requests across engine replicas using load and cache telemetry, while each inference engine independently schedules token batches and manages KV memory.</figcaption>
</figure>

In the standard vLLM deployment, each `LLMServer` replica reserves 1 CPU and creates a placement group of `TP × PP` GPU worker bundles. Modern `LLMRouter` implementations can even use tokenization and KV-cache telemetry from engines to pick cache-warm replicas, keeping the boundary crisp: Serve chooses *which replica* handles a request, and the engine chooses *which tokens* run in the next GPU step.[^ray258Release2026] When inter-token latency spikes, inspect both sides: replica routing skew and ingress CPU on the Serve side, and batch queueing or KV pressure inside the engine.

## Control-plane recovery has its own state

By default, GCS keeps cluster metadata in memory, so losing the GCS process stops new scheduling. Production deployments (such as KubeRay with Ray Serve) enable external Redis backing (or embedded RocksDB on Linux) so GCS can restart without killing already-running tasks and actors.[^ray258GcsFaultTolerance2026]

During a GCS reload, existing actors keep running with their in-memory state intact while control operations (spawning new actors or placement groups) pause briefly. Remember the separation: durable GCS backing restores *cluster control metadata*, never an actor's lost in-memory application state.

<!-- leetllm: edition:reference:start -->

## Read the source with one question in mind

To inspect Ray's internals, start at `python/ray/remote_function.py` (tasks) and `python/ray/actor.py` (actors), then follow the Python-to-`CoreWorker` boundary into `src/ray/raylet/` and `src/ray/gcs/`.[^ray2026repo] Keep two questions separate as you read: *where does execution run?* and *which process owns the `ObjectRef` metadata?*

Ray began at UC Berkeley (2016–2017; OSDI 2018 paper), with Anyscale founded in 2019 to offer a managed platform.[^moritz2018ray][^ray2026anyscale] The open-source project is Apache-2.0 licensed and governed under Linux Foundation Projects with a Technical Steering Committee.[^ray2026projectgovernance][^ray2026license]

## Evaluation rubric

- Distinguish a returned value, an `ObjectRef` handle, and the owner process holding its metadata.
- Trace top-level vs. nested `ObjectRef` resolution and explain why live zero-copy views pin shared memory.
- Contrast logical CPU/GPU scheduling requests with placement-group bundles and strategies (`PACK`, `STRICT_PACK`, `SPREAD`, `STRICT_SPREAD`).
- Separate actor process restarts (`max_restarts`) from durable application state recovery and idempotent retries.
- Draw the boundary between Ray Serve replica routing and inference-engine token batching.

## Follow-up questions

```checkpoint
How would you change BatchLedger so a retried batch can't increment the count twice after a restart?
---
Assign each batch a stable ID, atomically persist the incremented count and batch receipt to durable storage, and restore both in the actor constructor so retries return the saved receipt.
```

```checkpoint
Why can a completed task result still become unavailable even when another node has its bytes?
---
The process that created the ObjectRef owns its metadata and reference counts. If the owner dies, Ray does not reconstruct ownership metadata from surviving object-store copies.
```

```checkpoint
What would a two-node extension of the lab need to verify that a single-node run cannot?
---
Confirm producers and consumers run on distinct nodes, observe inter-node object transfer, and kill a non-owner worker node to test lineage reconstruction and output equality.
```

<!-- leetllm: edition:reference:end -->

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
    "explanation": "Four logical CPUs minus two lifetime actor reservations leaves two logical CPUs, so at most two one-CPU tasks can run concurrently. Waiting inside an actor method does not release its reserved slot."
  },
  {
    "question": "Three independent tasks take 5, 3, and 2 time units. With two identical workers, the 5-unit and 3-unit tasks start at t=0, and the 2-unit task starts as soon as the 3-unit task finishes. Ignoring overhead, what are the serial and concurrent finish times?",
    "options": [
      "Serial 8; concurrent 5.",
      "Serial 10; concurrent 7.",
      "Serial 10; concurrent 8.",
      "Serial 10; concurrent 5."
    ],
    "answer": "Serial 10; concurrent 5.",
    "explanation": "Serial execution sums to 5 + 3 + 2 = 10. With two workers, worker 1 runs the 5-unit task (finishing at t=5) while worker 2 runs 3 + 2 (also finishing at t=5), so concurrent execution finishes at 5."
  },
  {
    "question": "Completed ObjectRef `a` holds integer 4, and `b` holds integer 9. A consumer is called as `inspect.remote(a, [b])`. Before `inspect` calls `ray.get`, what are its two arguments?",
    "options": [
      "Integer 4; a list containing ObjectRef b.",
      "ObjectRef a; a list containing integer 9.",
      "Integer 4; a list containing integer 9.",
      "ObjectRef a; a list containing ObjectRef b."
    ],
    "answer": "Integer 4; a list containing ObjectRef b.",
    "explanation": "Ray resolves top-level ObjectRef arguments (`a` becomes 4) before running the function, while references nested inside containers (`[b]`) remain ObjectRef handles until explicitly fetched."
  },
  {
    "question": "Two nodes each have 3 free GPUs. A new placement group requests four separate one-GPU bundles, with no competing jobs. Compare PACK with STRICT_SPREAD. Which initial state pair follows?",
    "options": [
      "PACK ready; STRICT_SPREAD ready.",
      "PACK pending; STRICT_SPREAD ready.",
      "PACK ready; STRICT_SPREAD pending.",
      "PACK pending; STRICT_SPREAD pending."
    ],
    "answer": "PACK ready; STRICT_SPREAD pending.",
    "explanation": "PACK can place the four one-GPU bundles across the two nodes (e.g., 3 and 1). STRICT_SPREAD requires four distinct nodes, so with only two nodes it remains atomically pending."
  },
  {
    "question": "Two task results have live owners. Result A loses every payload copy, and its input was created by `ray.put` and also lost every copy. Result B still has an accessible remote copy, though its generating task has no retries left. What happens on retrieval?",
    "options": [
      "A lacks replayable input; B fetches its retained remote copy.",
      "A replays its lost input; B exhausts reconstruction before fetch.",
      "A lacks replayable input; B exhausts reconstruction before fetch.",
      "A replays its lost input; B fetches its retained remote copy."
    ],
    "answer": "A lacks replayable input; B fetches its retained remote copy.",
    "explanation": "Result A cannot be reconstructed because its `ray.put` dependency has no generating task to replay. Result B needs no replay at all: it simply fetches its surviving remote copy."
  },
  {
    "question": "A worker keeps a zero-copy view of one 48 MiB local object-store array, then deletes only the ObjectRef variable. Its ordinary Python heap holds 30 MiB of unrelated structures. What memory remains retained in each pool?",
    "options": [
      "Object-store array 0 MiB; ordinary heap 30 MiB.",
      "Object-store array 48 MiB; ordinary heap 78 MiB.",
      "Object-store array 30 MiB; ordinary heap 48 MiB.",
      "Object-store array 48 MiB; ordinary heap 30 MiB."
    ],
    "answer": "Object-store array 48 MiB; ordinary heap 30 MiB.",
    "explanation": "The live zero-copy NumPy view still pins the 48 MiB allocation in shared object-store memory even after the ObjectRef variable is deleted, while the unrelated 30 MiB stays in the private Python heap."
  },
  {
    "question": "Task T has `max_retries=4` and `retry_exceptions=False`, failing only due to worker exits. A separate actor has `max_restarts=1` and `max_task_retries=0`, and crashes after mutating state but before replying. What is T's maximum total number of starts, and how many times will Ray automatically replay the actor method?",
    "options": [
      "4 task starts and 1 method replay.",
      "5 task starts and 1 method replay.",
      "5 task starts and 0 method replays.",
      "4 task starts and 0 method replays."
    ],
    "answer": "5 task starts and 0 method replays.",
    "explanation": "Task T gets 1 initial start plus up to 4 retries = 5 total starts. The actor restarts once, but with `max_task_retries=0` Ray performs 0 automatic method replays."
  },
  {
    "question": "Three isolated Serve replicas use the standard vLLM layout, each with tensor-parallel size 4, pipeline-parallel size 2, and one 1-CPU LLMServer actor. How many GPU-worker bundles and LLMServer actors are required in total, and who schedules the next token batch at a replica?",
    "options": [
      "12 GPU-worker bundles, 3 LLMServer actors, the Serve router.",
      "24 GPU-worker bundles, 3 LLMServer actors, the vLLM engine.",
      "24 GPU-worker bundles, 3 LLMServer actors, the Serve router.",
      "12 GPU-worker bundles, 3 LLMServer actors, the vLLM engine."
    ],
    "answer": "24 GPU-worker bundles, 3 LLMServer actors, the vLLM engine.",
    "explanation": "Each replica needs 4 × 2 = 8 GPU worker bundles and 1 LLMServer actor, totaling 24 GPU bundles and 3 LLMServer actors across three replicas. Serve routes requests to a replica, while vLLM schedules token batches inside it."
  },
  {
    "question": "A running actor holding count 7 survives while a durably backed GCS process restarts with its storage intact. What happens during the GCS reload?",
    "options": [
      "Actor retains 7 in its process; new actor/group operations remain available.",
      "Actor resets to 0 in its process; new actor/group operations pause.",
      "Actor resets to 0 in its process; new actor/group operations remain available.",
      "Actor retains 7 in its process; new actor/group operations pause."
    ],
    "answer": "Actor retains 7 in its process; new actor/group operations pause.",
    "explanation": "Existing worker processes keep running with their in-memory state (count 7) intact while GCS reloads control metadata, during which new actor and placement-group operations pause."
  },
  {
    "question": "A durable counter starts at 7. For each new batch ID, it atomically saves the new count and a receipt for that ID; retries return the saved receipt without incrementing again. B92 adds 3, then its reply is lost. After restart, the caller retries B92, sends B93 (+2), then retries B92 again. What are the three replies in order and the final count?",
    "options": [
      "Replies (10, 12, 12) with a final count of 12.",
      "Replies (10, 12, 10) with a final count of 12.",
      "Replies (13, 15, 18) with a final count of 18.",
      "Replies (13, 15, 13) with a final count of 15."
    ],
    "answer": "Replies (10, 12, 10) with a final count of 12.",
    "explanation": "B92 already committed 7 + 3 = 10, so its first retry returns receipt 10 without adding again. B93 commits 10 + 2 = 12. Retrying B92 again still returns its original receipt 10, leaving the final count at 12."
  }
]
```

> **Course complete:** You have reached the end of the core curriculum. Explore more topics or review any section on the [LeetLLM roadmap](/learn).
