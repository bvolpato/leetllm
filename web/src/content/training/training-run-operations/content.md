---
{
  "id": "training-run-operations",
  "title": "Training Run Operations",
  "slug": "training-run-operations",
  "section": "Advanced Training & Adaptation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "order": 10,
  "coverImage": "illustrations/_generated/preempt_resume_contract_dark.png",
  "companies": ["OpenAI", "Anthropic", "Meta", "Google", "NVIDIA"],
  "shortDescription": "Yesterday's weights can reload while the data cursor and warmup start over. Resume the optimizer, batch, and scheduler with the checkpoint that actually reached storage.",
  "keyConceptsTested": [
    "continuation versus weights-only initialization",
    "durable distributed checkpoints and supported resharding",
    "preemption timing and accumulation boundaries",
    "data-parallel batch and supervised-token accounting",
    "scheduler continuity and limits of linear LR scaling",
    "AMP overflow and optimizer-update accounting",
    "adaptation objectives, parameterization, and memory bounds"
  ],
  "prerequisites": [
    "supervised-fine-tuning-pipeline",
    "mixed-precision-training-loss-scaling",
    "distributed-training-fsdp-deepspeed-zero",
    "lora-parameter-efficient-fine-tuning",
    "continued-pretraining-domain-adaptation"
  ],
  "relatedQuestions": [
    "knowledge-distillation-llms",
    "reward-modeling-from-preference-data",
    "pytorch-training-loops"
  ]
}
---

It's 3:15 AM. Your training cluster dies. You check the storage bucket: yesterday's weights are intact. You load them into your script, hit resume, and watch yesterday's training samples replay from the start while the learning rate restarts its warmup from zero. The model weights survived, but the training run died.

Name the dead job `policy-sft-v4`: four data-parallel replicas, two sequences per microbatch, eight microbatches per accumulation window, and a committed checkpoint at update 1840. A resume has to answer three questions. Which state survived? Which sample comes next? Did the replacement hardware change the optimization trajectory? Full-weight pretraining and parameter-efficient fine-tuning (<span data-glossary="lora">LoRA</span>) ask the same three.

<figure>
  <img src="illustrations/_generated/preempt_resume_contract_dark.png" alt="A warning arrives after microbatch 5 of 8 while the durable pointer is 1840. Batches 6, 7, and 8 produce update 1841. The GPU live state is copied at that boundary into a frozen host snapshot containing model, AdamW moments, scheduler, scaler, RNG, and data cursor. After staging completes, live training may advance while the host copy stays at 1841. Storage writes shards and validates the manifest before the outcomes branch: success atomically publishes pointer 1841; any write or validation failure leaves pointer 1840. A 120-second preemption budget allocates 20s to finish step 1841, 90s to stage and publish checkpoint shards, and 10s of safety margin." />
  <figcaption>Staging frees live training to advance; storage validation decides whether the durable pointer moves.</figcaption>
</figure>

## Weights are only one part of a continuation

[Training loops](/learn/pytorch-training-loops) introduced the optimizer and scheduler. A restart must restore their internal state alongside the model architecture. You need to distinguish three operations before calling a checkpoint loader:

| Operation | State you need | Meaning of the next update |
|---|---|---|
| **Continue training** | Model weights, optimizer moments, scheduler counters, progress counters, data cursor, RNG states, scaler state | Continue from a recorded training boundary |
| **Initialize a new run** | Compatible weights or adapters and their base model | Start fresh optimization from those parameters |
| **Export for inference** | Weights or adapters, tokenizer, configuration, and serving assets | No optimizer update is implied |

For AdamW, optimizer state includes the first and second gradient moments ($m$ and $v$) alongside parameter step counters [^loshchilov2019]. For mixed precision, you must include the gradient scaler when the recipe uses one. Save per-rank random number generator (RNG) states and the data loader resumable cursor. Preserve the model, tokenizer, chat template, dataset slice, and training arguments needed to interpret them. Evaluation history helps select a checkpoint, but it isn't a substitute for optimization state.

Adapter checkpoints also require the correct frozen base weights and adapter configuration. A merged inference export isn't a resumable adapter checkpoint. Tooling frameworks distinguish intermediate training checkpoints from final exports; torchtune documents separate resume requirements for full-weight and LoRA recipes [^torchtune2026checkpointer].

Continuation resumes optimization state. Bitwise replay also requires strict control over CUDA kernels, non-deterministic operations, cluster topology, random streams, and sample batching. A topology change can alter all-reduce reduction trees and data partitions. Document these changes and compare loss trajectories against an acceptable tolerance.

### What lost optimizer moments break

What happens when you restore weights but let AdamW start with zeroed moments?
AdamW normalizes gradient steps by running second moments:

$$
\theta_{t+1} = \theta_t - \eta_t \left( \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} + \lambda \theta_t \right)
$$

Here $v$ estimates a second moment, not the variance alone. If you reset both moments **and the optimizer's step counter**, the first bias-corrected moments are $\hat m_1=g$ and $\hat v_1=g^2$. The adaptive gradient term moves a scalar coordinate by $\eta g/(|g|+\epsilon)$, whose magnitude is at most $\eta$. A tiny gradient doesn't make that first update arbitrarily large. This bound excludes the separate weight-decay term.

Try three gradient magnitudes with the same learning rate:

<!-- leetllm: test, id=adam-first-update, output=show, output_title="A fresh first step is bounded" -->
```python title="adam_first_update.py"
lr, epsilon = 1e-3, 1e-8
for gradient in (1e-12, 1e-6, 1.0):
    update = lr * gradient / (abs(gradient) + epsilon)
    assert abs(update) <= lr
    print(f"g={gradient:.0e}; |first update|={abs(update):.3g}")
```

<!-- leetllm: output:start -->
```text title="A fresh first step is bounded" output compact
g=1e-12; |first update|=1e-07
g=1e-06; |first update|=0.00099
g=1e+00; |first update|=0.001
```
<!-- leetllm: output:end -->

Resetting moments still discards the history that determines future direction and magnitude. Keeping an old step counter with fresh moments also changes their bias correction. Either restart can change the trajectory; neither necessarily causes a loss jump or divergence.

This scalar Adam example minimizes $(w-y)^2/2$ over a repeating target sequence. It tracks first and second moments, bias-correction steps, a step-based learning rate, and a consumed data cursor. JSON round-tripping models a serialized restart:

<!-- leetllm: test, id=adam-resume, output=show, output_title="Continuation versus fresh moments" -->
```python title="adam_resume.py"
import json
import math

TARGETS = [1.0, -2.0, 3.0, 0.5]

def fresh(w=0.0):
    return dict(w=w, m=0.0, v=0.0, step=0, cursor=0)

def advance(state, updates):
    if updates < 0:
        raise ValueError("updates must be a nonnegative integer")
    state = dict(state)
    for _ in range(updates):
        g = state["w"] - TARGETS[state["cursor"] % len(TARGETS)]
        state["step"] += 1
        t = state["step"]
        state["m"] = 0.9 * state["m"] + 0.1 * g
        state["v"] = 0.999 * state["v"] + 0.001 * g * g
        m_hat = state["m"] / (1 - 0.9 ** t)
        v_hat = state["v"] / (1 - 0.999 ** t)
        lr = 0.05 / (1 + 0.1 * (t - 1))
        state["w"] -= lr * m_hat / (math.sqrt(v_hat) + 1e-8)
        state["cursor"] += 1
    return state

saved = advance(fresh(), 7)
restored = json.loads(json.dumps(saved))
resumed = advance(restored, 5)
baseline = advance(fresh(), 12)
assert resumed == baseline

# Isolate missing moments: keep the weights, step and data cursor.
lost_moments = dict(restored, m=0.0, v=0.0)
wrong = advance(lost_moments, 5)
assert abs(wrong["w"] - baseline["w"]) > 1e-4
assert advance(restored, 0) == restored
print(f"continuous={baseline['w']:.6f}; resumed={resumed['w']:.6f}")
print(f"reset moments={wrong['w']:.6f}; next cursor={resumed['cursor']}")
```

<!-- leetllm: output:start -->
```text title="Continuation versus fresh moments" output compact
continuous=0.125436; resumed=0.125436
reset moments=0.126672; next cursor=12
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/optimizer_state_continuation_dark.png" alt="In the article’s scalar Adam fixture, the saved update-7 state has weight 0.086726, first moment -0.341636, second moment 0.027877, and consumed-target cursor 7. Restoring all of it reaches weight 0.125436 at update 12. Resetting the moments while keeping the saved weight, step, and cursor reaches 0.126672 on the same five targets. The plotted weight trajectories use the same labeled 0.08–0.13 axis; this toy demonstrates a changed trajectory, not a guaranteed large loss jump." />
  <figcaption>The same next examples lead to different updates when Adam's moment history is reset.</figcaption>
</figure>

The step counter alone cannot reconstruct lost optimizer moments. In a real cluster restore drill, compare the next sample IDs, current learning rate, optimizer moments, and next gradient update against an uninterrupted reference run. A smooth loss curve is one signal; compare the full restored state and next update.

## Reliability and the two checkpoint completion points

Large clusters have more opportunities for interruption. Llama 3 405B used configurations with up to 16,384 H100 GPUs. Over one reported 54-day period, the team recorded 419 unexpected interruptions and 47 planned ones; these included several kinds of hardware and software faults [^dubey2024]. Those observations don't establish a universal GPU failure rate.

For a simplified model of $N$ independent devices with identical, constant failure rates, where **any** device failure stops the job, rates add:

$$
\text{MTBF}_{\mathrm{cluster}} = \frac{\text{MTBF}_{\mathrm{device}}}{N}.
$$

Shared power, network faults, repairs, and software failures violate that model's assumptions. Measure your own run's interruption frequency and lost work rather than substituting a supposed server MTBF into a GPU-count formula.

An asynchronous checkpoint separates three places where state can live:

1. **Live training memory:** Parameters, optimizer state, and other saved state can change as training proceeds.
2. **Stable host snapshot:** Staging makes a copy independent of subsequent live mutations. Pinned host buffers can improve transfer performance, but consume reserved RAM.
3. **Storage:** Background I/O persists the snapshot. Only successful storage completion and the required publication protocol establish a new recovery point.

PyTorch's standard `async_save` stages state before returning a background storage future. Its default staging can still block training. The optional `DefaultStager`, introduced in PyTorch 2.9, moves staging to a background CPU thread; the documented response separates `staging_completion` from `upload_completion` [^pytorchDcpAsync2026].

Wait for staging before modifying any live state whose copy is still pending. Parameters aren't the only concern: forward passes can change buffers, and the next batch can advance RNG or loader state. Capture progress metadata at the same boundary as the tensors. Wait for storage completion before publishing or deleting the previous recovery point. Bound concurrent saves, propagate future exceptions, and close the stager when finished [^pytorchDcpApi2026].

A Python dictionary isn't necessarily a stable snapshot. `model.state_dict()` contains references to live parameter and buffer storage. Holding that dictionary while the optimizer runs can silently change the supposedly saved weights. PyTorch's saving tutorial recommends serialization or `deepcopy` when preserving an in-memory best state [^pytorchSavingLoading2026]. Predict which value stays at 1 in this CPU example:

<!-- leetllm: test, deps=torch==2.13.0, output=show, output_title="A state dictionary can alias live weights" -->
```python title="checkpoint-aliasing.py"
from copy import deepcopy
import torch

model = torch.nn.Linear(1, 1, bias=False)
with torch.no_grad():
    model.weight.fill_(1.)
optimizer = torch.optim.SGD(model.parameters(), lr=.1)
live_dictionary = model.state_dict()
stable_copy = deepcopy(live_dictionary)
loss = model(torch.ones(1, 1)).square().sum()
loss.backward()
optimizer.step()
assert live_dictionary["weight"].data_ptr() == model.weight.data_ptr()
torch.testing.assert_close(live_dictionary["weight"], torch.tensor([[.8]]))
torch.testing.assert_close(stable_copy["weight"], torch.tensor([[1.]]))
print("live dictionary after update:", round(live_dictionary["weight"].item(), 1))
print("independent copy at save boundary:", stable_copy["weight"].item())
```

<!-- leetllm: output:start -->
```text title="A state dictionary can alias live weights" output compact
live dictionary after update: 0.8
independent copy at save boundary: 1.0
```
<!-- leetllm: output:end -->

This fixture checks ownership of tensor storage. Its independent copy is still only in memory, and copying a GPU state dictionary this way can double device allocations. Use the checkpoint framework's supported staging path for a large distributed job, then establish durable publication separately.

Asynchronous I/O can overlap computation, but still competes for host memory, CPU time, and storage bandwidth. Measure staging latency, storage latency, and training throughput together; there is no fixed “100 GB in three seconds” guarantee.

### Atomic manifest publishing and data cursor alignment

Use a new checkpoint identifier for each save. Keep the previous committed snapshot until the new shards, framework metadata, and application state have completed successfully. A manifest should identify one consistent boundary and the expected artifacts, with integrity information such as sizes and hashes. Validate the manifest against every expected artifact before marking the checkpoint complete.

Publication depends on the storage backend. On a suitable filesystem, an atomic rename can replace a pointer file after the checkpoint completes; crash durability also requires the relevant file and directory synchronization [Linux `fsync` documentation](https://man7.org/linux/man-pages/man2/fsync.2.html). An object store doesn't provide a transaction over an arbitrary collection of shard uploads. For Google Cloud Storage, individual object writes are atomic; a generation-match precondition can protect a `latest` pointer update from competing writers [^google2026storageConsistency] [^google2026storagePreconditions]. Publish that pointer only after its referenced checkpoint is complete, and validate the checkpoint when loading.

A clean weight restore still fails if the data position describes a different boundary. A recorded **consumed** batch count plus a deterministic sampler can suffice for a simple replayable dataset. A worker's prefetched producer position can be ahead of what training consumed. Stateful streaming, random transforms, and packing may need worker RNG, sampler, dataset, and buffered-example state as well.

TorchData's `StatefulDataLoader` supports `state_dict` and `load_state_dict`; its default strategy tracks yielded batches and fast-forwards, while stateful datasets and samplers can provide their own restore state. It aggregates state across workers, **not across distributed ranks** [^torchdata2026statefulLoader]. For the documented iterable-dataset worker-state restore, the new loader must have the same `num_workers` as the saved state [^torchdataStatefulTutorial2026]. A topology or worker-count change therefore needs an explicit data-partition policy, alongside tensor resharding.

## Treat preemption as a deadline and trigger saves explicitly

Suppose update 1840 is durably committed to storage, and a preemption warning signal (such as a cloud spot termination notice or a cluster scheduler `SIGTERM`) arrives after microbatch 5 of the next 8-microbatch accumulation window.

Your training policy saves only at completed optimizer boundaries. There are two valid operational outcomes:
1. All nodes remain healthy and there's enough time to complete the remaining 3 microbatches, perform the optimizer step, stage the checkpoint to host RAM, and update the manifest for step 1841.
2. Time runs out or a rank dies abruptly. The orchestrator terminates, discards partial in-flight state, and reboots from durable step 1840. With a fixed global batch of 64 examples per step and none was skipped, so the saved global consumed-example count is $1840\times64=117{,}760$. That count isn't itself a dataset row ID or byte offset.

Never pair weights from step 1840 with a data cursor that advanced past microbatch 5. That mistake silently drops those five microbatches without applying their gradients. Mid-window recovery needs the in-flight accumulated gradients, accumulation counter, matching scaler, model buffers, RNG, and data state. With AMP, those gradients may still be **scaled**; preserve their representation and keep the scale constant throughout accumulation [^pytorchAmpExamples2026]. Unless your framework explicitly supports and tests that recovery, use completed update boundaries.

Signal handlers should only set an internal shutdown flag, not initiate distributed network I/O. The main loop coordinates the save at a clean boundary. If a member of an ordinary fixed process group dies, collectives can't complete normally; a fault-tolerant launcher must recover or reconfigure the job. Periodic durable checkpoints remain necessary because not every failure gives a warning.

### Budget the entire remaining path

A 90-second checkpoint doesn't fit into a 90-second warning if you also need to finish active microbatches and publish manifests. The preemption budget equation is:

$$
T_{\mathrm{warning}} \ge T_{\mathrm{window}} + T_{\mathrm{save}} + T_{\mathrm{margin}}
$$

Here $T_{\mathrm{save}}$ includes time through durable publication, and $T_{\mathrm{margin}}$ absorbs network and disk jitter:

<!-- leetllm: test, id=preemption-budget, output=show, output_title="Warning-period budget" -->
```python title="preemption_budget.py"
import math

def can_finish(grace, window, save, margin):
    times = (grace, window, save, margin)
    if any(not math.isfinite(t) or t < 0 for t in times):
        raise ValueError("times must be finite nonnegative seconds")
    return window + save + margin <= grace

assert can_finish(120, 20, 90, 10)
assert not can_finish(119, 20, 90, 10)
assert not can_finish(90, 20, 90, 10)
print("120s warning: feasible at the estimate; 119s: insufficient")
for productive_seconds in (300, 1200):
    fraction = 90 / (productive_seconds + 90)
    print(f"{productive_seconds}s compute + 90s save: {fraction:.1%} save overhead")
```

<!-- leetllm: output:start -->
```text title="Warning-period budget" output compact
120s warning: feasible at the estimate; 119s: insufficient
300s compute + 90s save: 23.1% save overhead
1200s compute + 90s save: 7.0% save overhead
```
<!-- leetllm: output:end -->

A blocking save every five minutes of compute spends 23.1% of cluster wall-clock time writing files under these authored timings. Increasing the compute interval to twenty minutes drops that fraction to 7.0%, but increases work exposed to failure. With asynchronous saving, work performed while a snapshot uploads is also uncommitted until publication. Choose the interval using measured latency, interruption frequency, and acceptable replay cost. The warning calculation establishes feasibility at the estimates, not a deadline guarantee.

## Sharded saves need a compatible restore path

FSDP and ZeRO-3 distribute persistent parameters and optimizer state rather than keeping a complete copy on every GPU [^rajbhandari2020]. FSDP can temporarily all-gather a module's weights for computation. For checkpointing, ask two questions: did the save complete reliably, and can the restore loader interpret its layout?

A full state dictionary can gather tensors onto one rank, possibly into host memory. For 70 billion parameters, BF16 weights occupy 140 decimal GB; **each** FP32 Adam moment occupies 280 GB. Two moments plus those weights total 700 GB, before any separately saved master weights or other state. Consolidation needs enough capacity at its destination and substantial transfer time; it isn't automatically an instant GPU OOM if the framework offloads to a sufficiently large host.

PyTorch Distributed Checkpoint (DCP) can save local shards without first constructing the entire tensor on one rank [^pytorch2026dcp]. Its metadata describes parameter identities, global tensor properties, and shard coordinates. The storage path can stage tensors through CPU memory; “distributed save” doesn't imply a direct GPU-to-object-store transfer.

<figure>
  <img src="illustrations/_generated/sharded_save_reshard_dark.png" alt="The global element-index axis stays fixed from 0 through 16. Four source ranks own [0,4), [4,8), [8,12), and [12,16); eight target ranks own [0,2), [2,4), [4,6), [6,8), [8,10), [10,12), [12,14), and [14,16). Each source range maps to two adjacent target ranges with no gaps or overlap. This is a logical coordinate mapping; the reader may still deserialize larger source tensors into CPU memory, and physical I/O depends on the storage implementation." />
  <figcaption>The tensor coordinates stay fixed while ownership changes. Model and optimizer mappings both need a compatible destination layout.</figcaption>
</figure>

### Resharding across topologies without single-node bottlenecks

When you intentionally change the partitioned layout, the loader must map saved coordinates into the new layout. Not every model-parallel mesh permits every world size: check divisibility, parameter identities, and the framework's supported model and optimizer mappings.

Under DCP, resharding happens without central gathering:
1. Initialize compatible destination model and optimizer state dictionaries, with tensors allocated in the target distributed layout.
2. Each destination rank consults the shared `.metadata` index file.
3. Each rank calculates which source shard files intersect its assigned tensor slice.
4. Distributed readers load the relevant serialized data and copy the required logical slices into destination tensors.

DCP's PyTorch 2.14 filesystem reader loads the serialized tensor into CPU memory before narrowing it to the requested slice. It reads the full tensor value and allocates the loaded CPU representation before slicing [^pytorch2026dcpFilesystem].

DCP documents cross-version checkpoint compatibility as unspecified, including changes within a major release [^pytorchDcpApi2026]. Test the actual target stack. DeepSpeed Universal Checkpointing uses a ZeRO save, explicit conversion, and Universal load; supported topology changes still require matching model parameter identities and compatible shapes [^deepspeedUniversalCheckpointing2026].

This small coordinate exercise reconstructs eight destination slices from four source slices and rejects gaps and overlaps. It deliberately builds a complete Python list in one process for inspection. It is **not** a DCP implementation or a test of distributed I/O and memory:

<!-- leetllm: test, id=reshard-offsets, output=show, output_title="Logical ranges survive a new layout" -->
```python title="reshard_offsets.py"
def reshard(shards, size, destinations):
    if size <= 0:
        raise ValueError("positive tensor size required")
    if destinations <= 0 or size % destinations:
        raise ValueError("this toy requires equal nonempty destination shards")
    tensor = [None] * size
    for start, values in shards:
        if start < 0 or start + len(values) > size:
            raise ValueError("invalid range")
        for offset, value in enumerate(values, start):
            if tensor[offset] is not None:
                raise ValueError("overlapping ranges")
            if value is None:
                raise ValueError("None is reserved for a missing element")
            tensor[offset] = value
    if any(value is None for value in tensor):
        raise ValueError("missing range")
    width = size // destinations
    return [(i, tensor[i:i + width]) for i in range(0, size, width)]

saved = [(i, list(range(i, i + 4))) for i in range(0, 16, 4)]
loaded = reshard(saved, 16, 8)
assert [v for _, values in loaded for v in values] == list(range(16))
assert reshard(loaded, 16, 4) == saved
for broken in (saved[:-1], saved + [saved[0]]):
    try:
        reshard(broken, 16, 8)
    except ValueError as error:
        print(error)
    else:
        raise AssertionError("incomplete or overlapping state was accepted")
print(loaded)
```

<!-- leetllm: output:start -->
```text title="Logical ranges survive a new layout" output compact
missing range
overlapping ranges
[(0, [0, 1]), (2, [2, 3]), (4, [4, 5]), (6, [6, 7]), (8, [8, 9]), (10, [10, 11]), (12, [12, 13]), (14, [14, 15])]
```
<!-- leetllm: output:end -->

The slices can move to a new rank layout and still describe the same tensor. More GPUs do not, by themselves, put more sequences into one optimizer step.

## Keep the update size separate from the GPU count

Count independent data-parallel replicas, not devices. For complete accumulation windows with equal microbatch sizes:

$$
B_{\mathrm{global}} = B_{\mathrm{micro}} \times K \times D_{\mathrm{replica}}
$$

Here $B_{\mathrm{micro}}$ is the sequence count per replica's microbatch, $K$ is the number of accumulated microbatches per update, and $D_{\mathrm{replica}}$ counts independent **data-parallel replicas**. Workers collaborating on one replica don't contribute independent examples.

For a regular mesh whose distinct axes are tensor parallelism ($\mathrm{TP}$), pipeline parallelism ($\mathrm{PP}$), context parallelism ($\mathrm{CP}$), and data parallelism:

$$
D_{\mathrm{replica}} = \frac{N_{\mathrm{GPUs}}}{\mathrm{TP} \times \mathrm{PP} \times \mathrm{CP}}
$$

Context-parallel workers split one example's sequence rather than adding independent examples. This product formula isn't a universal description of overlapping expert-parallel or hybrid process groups. Eight GPUs with $\mathrm{TP}=2$, $\mathrm{PP}=1$, and $\mathrm{CP}=1$ form $D=4$ replicas. Halving accumulation while keeping $D=4$ cuts the nominal global batch in half.

<figure>
  <img src="illustrations/_generated/global_batch_stack_dark.png" alt="Eight GPUs form four data-parallel replicas when tensor parallelism is 2 and pipeline and context parallelism are each 1. Within every replica, two tensor-parallel ranks cooperate on the same microbatch; they do not add examples. Each of four independent replicas processes eight microbatches of two sequences, totaling 2 × 8 × 4 = 64 sequences per update. On a common 128-sequence scale, changing to eight replicas with four accumulation steps keeps 64, while eight replicas with eight steps reaches 128." />
  <figcaption>Count independent data-parallel replicas. Tensor-parallel ranks share each example.</figcaption>
</figure>

| Microbatch $B_{\mu}$ | Accumulation $K$ | Data-Parallel $D$ | Global Sequences per Update |
|---|---|---|---|
| 2 | 8 | 4 | 64 |
| 2 | 8 | 8 | 128 |
| 2 | 4 | 8 | 64 |

### Sequences versus supervised tokens and loss reduction

Sequence counts don't equal token throughput. In instruction tuning and conversational SFT, sequence packing, system prompt masking, and variable response lengths mean that two batches with identical sequence counts carry different numbers of loss-bearing tokens:

$$
\text{Tokens per update} = \sum_{i=1}^{B_{\mathrm{global}}} \text{Length}_{\mathrm{unmasked}}(i)
$$

If replica 0 processes 4,800 supervised tokens while replica 1 processes 9,600, averaging their per-device mean loss values equally computes $\frac{1}{2}(\bar{\mathcal{L}}_0 + \bar{\mathcal{L}}_1)$. That naive average assigns twice as much weight to tokens on replica 0 as tokens on replica 1, distorting the true gradient.

If the intended objective is a **mean over supervised tokens**, use:

$$
\mathcal{L}_{\mathrm{global}} = \frac{\sum_{r} \sum_{j} \mathcal{L}_{r, j}}{\sum_{r} N_{\mathrm{tokens}, r}}
$$

This is a choice of objective: a deliberately equal-weighted per-example objective is different and can be valid. For the token mean, count supervised targets after shifting and masking across the **whole accumulation window** and all replicas. Ordinary DDP averages gradients across replicas [^pytorchDdpDocs2026]. With $D$ replicas and a global token count $N$, backpropagating each replica's local loss sum multiplied by $D/N$ gives the desired gradient after that averaging. Check trainer normalization before adding any scale factor; don't also divide by $K$ when the global denominator already includes all $K$ microbatches.

Trace per-token scalar loss gradients across two data-parallel ranks: One replica has one token; another has three:

<!-- leetllm: test, id=token-weighted-gradients, output=show, output_title="Token mean versus replica mean" -->
```python title="token_weighted_gradients.py"
tokens = [[10.0], [-2.0, -2.0, -2.0]]
replicas = len(tokens)
count = sum(len(rank) for rank in tokens)
token_mean = sum(sum(rank) for rank in tokens) / count
replica_mean = sum(sum(rank) / len(rank) for rank in tokens) / replicas
local_scaled = [replicas * sum(rank) / count for rank in tokens]
ddp_average = sum(local_scaled) / replicas
assert token_mean == ddp_average == 1.0
assert replica_mean == 4.0
print(f"token mean gradient={token_mean:.1f}; replica mean={replica_mean:.1f}")
print(f"DDP averaged corrected gradients={ddp_average:.1f}")
```

<!-- leetllm: output:start -->
```text title="Token mean versus replica mean" output compact
token mean gradient=1.0; replica mean=4.0
DDP averaged corrected gradients=1.0
```
<!-- leetllm: output:end -->

This arithmetic checks the reduction, not a running process group. Inspect your distributed trainer's real gradient normalization with a small reference batch.

```checkpoint
A 4-replica job with microbatch 2 and accumulation 8 restarts on eight GPUs configured as tensor parallel 2 and data parallel 4. Should you halve accumulation to preserve the batch?
---
No. Data parallelism is still four, so the batch remains 2 × 8 × 4 = 64. Halving accumulation would reduce it to 32. Count independent replicas, not devices.
```

## Preserve the scheduler before tuning a new batch

When continuing a run at the same effective batch size, restore the scheduler phase directly. Don't restart warmup just because the process restarted.

Changing the global batch changes the optimization trajectory. Doubling **tokens per update** approximately halves the number of updates for a fixed token budget. Doubling sequences has that effect only if their average token contribution stays comparable.

A schedule with 100 warmup updates needs 6,400 examples at 64 examples/update and 12,800 at 128. Its milestones move to **later data volumes**, and a fixed data budget may end before the original step-based decay finishes. Decide whether to preserve update milestones or remap them to a data budget. Log whether the schedule uses updates, examples, or tokens.

### Detect AMP overflow before counting an optimizer update

In a standard FP16 GradScaler loop, nonfinite gradients can cause the optimizer step to be skipped. Keep separate counters for attempted accumulation windows, consumed data, and successful optimizer updates. A scheduler defined per successful update should stay fixed when no update occurred; a deliberately data-indexed scheduler follows its own policy.

<figure>
  <img src="illustrations/_generated/amp_update_clocks_dark.png" alt="An authored three-window FP16 GradScaler trace uses 64 examples per accumulation window and a scheduler indexed by successful optimizer updates. Window 1 is finite: the optimizer and scheduler advance to 1. Window 2 consumes the next 64 examples but has nonfinite gradients: the optimizer step is skipped, the successful-update and scheduler counters stay at 1, and the scaler backs off. Window 3 is finite: the optimizer and scheduler advance to 2. The counters distinguish attempted windows, consumed examples, and successful parameter updates." />
  <figcaption>Overflow advances data consumption while the successful-update scheduler waits.</figcaption>
</figure>

Perform overflow checks and scale updates at effective-batch boundaries, keeping the scale constant during accumulation [^pytorchAmpExamples2026]. A skipped step can still consume data and change scaler state. Preserve both in the checkpoint. Don't infer success from `scaler.step(...)` returning `None`: many optimizers return `None` even after a real update. Use the framework's supported overflow handling.

### Scaling rules are hypotheses to test

Goyal et al. popularized linear learning-rate scaling with gradual warmup for large-batch SGD, training ResNet-50 with batch 8,192 on 256 GPUs [^goyal2017]. The approximation compares one large step with several smaller steps while assuming their gradients change little. It can break early in training or at very large batches; it isn't an AdamW SFT guarantee.

Malladi et al. derive an Adam scaling rule from stochastic differential equation approximations under specified noise and moment assumptions [^malladi2022adaptiveScaling]. For a batch multiplier $\kappa$, their rule changes **more than the learning rate**:
$$
\begin{aligned}
\eta'&=\sqrt\kappa\,\eta,\\
\beta'_i&=1-\kappa(1-\beta_i),\\
\epsilon'&=\epsilon/\sqrt\kappa.
\end{aligned}
$$
The new $\beta_i$ must remain valid optimizer coefficients. This conditional result isn't a theorem that changing only AdamW's LR by $\sqrt\kappa$ preserves a fine-tuning run, nor that linear scaling always diverges. Compare controlled runs, including a fixed-LR baseline, and evaluate quality at a comparable data budget.

McCandlish et al. study a gradient-noise scale:

$$
\mathcal B_{\mathrm{simple}}=\frac{\operatorname{Tr}(\Sigma)}{\lVert G\rVert^2},
$$

where $G$ is the mean gradient and $\Sigma$ is the covariance of individual-example gradients [^mccandlish2018]. It predicts the scale of the largest useful batch in their studied settings, rather than an exact universal threshold. Larger batches can reduce update count with diminishing returns, while increasing examples needed to reach a target. That optimization tradeoff doesn't imply linear wall-clock speedup: kernel efficiency and communication matter too.

## Diagnose a symptom before choosing a recovery

A loss spike doesn't reveal its cause. Record the last known-good checkpoint, exact batch identity, token counts, learning rate, scaler state, and per-rank timings before changing the run.

| Symptom | Candidates to investigate | First check |
|---|---|---|
| Same weights, different first LR | Scheduler and optimizer parameter-group restore; warmup reset | Verify step counter and scheduler state dictionary |
| Old sample IDs reappear | Consumed cursor, sampler epoch seed, prefetch buffer state | Rewind cursor to exact completed update boundary |
| Straggler on one rank | Unequal input work, thermal or power limits, host stalls, PCIe issues | Compare phase timings and `nvidia-smi -q -d PERFORMANCE` clock event reasons |
| Spiking all-reduce latency | Rank arrival skew, network congestion, link errors | Compare compute completion times, NIC/switch error counters, and negotiated link rates |
| Loss NaN on a clean batch | Zero supervised tokens or nonfinite gradient under FP16 | Check loss scale factor, token count masks, and inputs |
| Sudden loss divergence | Data or schedule change, numerical instability, software bug, hardware corruption | Reproduce from saved state and inspect inputs before assigning a cause |

A slow rank can delay dependent collectives and extend the critical path. Communication may overlap backward computation, so this isn't a literal barrier where every GPU waits throughout the whole pass. Separate compute time, rank arrival skew, and collective completion time. Compare clock event reasons with a healthy device under matched work; there is no model-independent “bad clock” threshold [^nvsmi].

Link errors and reduced bandwidth can leave a job alive but slower. Counter trends, link state, and measured throughput help distinguish fabric faults from compute imbalance. A particular rate change doesn't imply a fixed tenfold slowdown, and one counter alone isn't sufficient reason to evict a node.

The Llama 3 report recorded six silent data corruption incidents in its interruption breakdown [^dubey2024]. An ECC alert is one signal; controlled canary computations can help identify other faults when inputs, precision, kernels, and tolerances are matched. Ordinary floating-point differences can arise from valid numerical variation. Canary coverage and tolerances determine which silent faults the check can catch, so run canaries before training and after relevant system changes.

### What a rollback policy must decide

Reject nonfinite training state as a new operational recovery point, and preserve diagnostic evidence. For an unexpected finite loss spike, use thresholds calibrated to the run's normal variability. A median plus three standard deviations over 50 steps is a possible authored heuristic, not an established universal training policy.

Reproduce the suspect batch from a known-good checkpoint, preferably on verified healthy hardware. Check masks, zero-token batches, learning rate, scaler behavior, and gradient norms. Use bounded retries so an automatic restart cannot loop indefinitely.

Choose how far to rewind from evidence about the first affected state. Quarantine data only when the diagnosis supports it, with a recorded decision. Skipping examples or changing the shuffle seed changes the data trajectory and creates a new continuation policy.

```checkpoint
After a NaN loss, a canary passes on every GPU, but the batch has zero supervised targets. Should the recovery harness automatically quarantine a GPU?
---
No. The empty target set can make a mean loss undefined. Check masking and batch construction, fix the data or loss handling, and replay from consistent state. A canary covers its tested workload; inspect device telemetry and run targeted checks before assigning a hardware fault.
```

## Choose the objective, trainable weights, and precision separately

Training recipes aren't a single dropdown choice. [SFT](/learn/supervised-fine-tuning-pipeline) and [continued pretraining](/learn/continued-pretraining-domain-adaptation) define what the model learns. LoRA defines which parameters update. QLoRA adds 4-bit base-model quantization to adapter tuning. Distillation learns from a teacher, using soft targets [^hinton2015] or generated sequences [^kim2016sequenceDistillation]; logits aren't required for every distillation method.

| Decision | Examples | What it changes |
|---|---|---|
| Learning signal | Labeled responses; domain text; teacher targets or responses | Optimization objective and data distribution |
| Trainable parameters | Full model weights; LoRA adapters | Parameter memory, optimizer footprint, and capacity |
| Frozen-base precision | BF16; FP8; 4-bit NormalFloat (NF4) | Base model memory, CUDA kernels, numerical behavior |

These are conceptually separate decisions, but their implementations aren't freely interchangeable. Check that the architecture, quantization backend, adapter implementation, and hardware support the combination you chose.

Domain-adaptive pretraining can improve specialized comprehension. Evaluate held-out text fit and product tasks to decide whether unfamiliar vocabulary warrants it [^gururangan2020]. Compare LoRA SFT and full fine-tuning on the target task and budget [^hu2021].

<figure>
  <img src="illustrations/_generated/adaptation_method_matrix_dark.png" alt="Three recipe decisions compose a QLoRA SFT setup: response SFT supplies the learning signal, LoRA adapters are trainable while the base is frozen, and NF4 stores the base weights at four bits. On one shared 0–48 GiB scale, ideal storage for 70 billion four-bit weights is 32.6 GiB. This exceeds a 24 GiB single-GPU budget by 8.6 GiB. A 48 GiB budget leaves 15.4 GiB after base weights for every omitted cost; that lower bound alone does not guarantee training fit." />
  <figcaption>Choose the learning objective, trainable parameters, and base precision separately. Then check the memory floor.</figcaption>
</figure>

### Reject impossible memory plans before launching

The original QLoRA paper demonstrated fine-tuning a 65B model on a single 48GB GPU [^dettmers2023]. That empirical result doesn't mean a 70B model fits within a 24 GiB usable device budget. Comparing 24 GiB and 48 GiB device memory budgets shows why 70B QLoRA requires at least a 48 GiB card before activations and KV state.

At an ideal four bits per parameter, a 70B model requires:

$$
\text{Memory}_{\mathrm{base}} = \frac{70 \times 10^9 \times 4\text{ bits}}{8\text{ bits/byte}} = 35 \times 10^9\text{ bytes} \approx 32.6\text{ GiB}
$$

Base weights alone exceed 24 GiB by 8.6 GiB before quantization metadata, higher-precision tensors, LoRA adapters, activations, gradients, optimizer moments, or temporary buffers.

<!-- leetllm: test, id=weight-memory, output=show, output_title="Base-weight memory lower bounds" -->
```python title="weight_memory.py"
def weight_gib(parameters, bits):
    if parameters <= 0:
        raise ValueError("positive integer parameter count required")
    if bits <= 0:
        raise ValueError("positive integer bit width required")
    return ((parameters * bits + 7) // 8) / (1024 ** 3)

large = weight_gib(70_000_000_000, 4)
small = weight_gib(8_000_000_000, 16)
assert large > 24
assert small < 24  # Only the base fits this lower-bound check.
assert weight_gib(1, 4) == 1 / (1024 ** 3)
print(f"70B at 4 bits: at least {large:.1f} GiB; exceeds 24 GiB")
print(f"8B at 16 bits: at least {small:.1f} GiB; training needs more")
```

<!-- leetllm: output:start -->
```text title="Base-weight memory lower bounds" output compact
70B at 4 bits: at least 32.6 GiB; exceeds 24 GiB
8B at 16 bits: at least 14.9 GiB; training needs more
```
<!-- leetllm: output:end -->

This all-resident four-bit plan cannot fit a 24 GiB budget. Change the plan: use a smaller model, a supported lower-bit representation, sharding, or offloading. Profile the complete training peak beyond base weights. On a 48 GiB GPU, the remaining 15.4 GiB must cover **all** omitted memory, including adapters and activations.

## Rehearse the restart before the long run

Don't wait for your first midnight preemption to discover that your checkpoint loader crashes. Run a restart drill on small test jobs:
- **Local state continuity:** Compare five uninterrupted steps against five steps resumed from an intermediate checkpoint. Verify that weights, Adam moments, learning rates, and data sample IDs match within floating-point tolerance.
- **Distributed topology restoration:** Save on four GPUs, then load on a supported target layout with eight GPUs (or another valid size). Verify model and optimizer resharding, data partitioning, and peak restore memory.
- **Preemption deadline drill:** Send `kill -TERM <training-pid>` to your test job. Exercise both a warning that fits the measured path and one that doesn't. Force an interruption during saving and verify that the loader selects the previous complete checkpoint.
- **Diagnostics and recovery policy:** Inject a controlled straggler or nonfinite test batch. Verify that monitoring identifies the symptom, unsafe state isn't published, retries are bounded, and any rollback or quarantine follows the configured policy.

Distinguish between your *latest resumable checkpoint* and your *best evaluation checkpoint*. Step 1840 might be your operational recovery point, while step 1600 holds your highest validation score. Store both with explicit metadata tags.

A weights file in the bucket is not the run. The moments, the data cursor, and the learning-rate phase have to travel with it, and only a save that has reached storage counts.

Snapshot copying, warmup, scaling and training-mode practice.

```checkpoint
A scalar weight starts at 2. A live state_dict and an independent deep copy are retained. One SGD step uses loss w² and learning rate 0.25. Which values are then stored in the live dictionary and independent copy?

- Live 1; independent copy 2.
- Live 2; independent copy 2.
- Live 1; independent copy 1.
- Live 1.5; independent copy 2.
---
Live 1; independent copy 2.

The gradient is 2w = 4, so w becomes 2 − 0.25 × 4 = 1. The state dictionary aliases that storage; the independent copy retains 2. A deep copy is still only in memory until a supported save publishes it.
```

```checkpoint
A run uses 60 warmup updates with 40 examples per update. A new plan uses 80 examples per update. How much data would unchanged 60-update warmup consume, and how many updates preserve the original warmup data budget?

- 4,800 examples; use 30 updates.
- 2,400 examples; use 60 updates.
- 4,800 examples; use 120 updates.
- 1,200 examples; use 30 updates.
---
4,800 examples; use 30 updates.

Original warmup consumes 60×40 = 2,400 examples. Unchanged 60 updates at 80 consume 4,800. Preserving the original data budget needs 2,400/80 = 30 updates. This is a deliberate schedule-policy change, not an automatic consequence of restarting.
```

```checkpoint
Apply the taught conditional Adam scaling proposal with kappa = 4 to eta = 0.001, beta1 = 0.9, beta2 = 0.999 and epsilon = 1e-8. Which proposed tuple (eta, beta1, beta2, epsilon) follows?

- (0.004, 0.9, 0.999, 1e-8)
- (0.002, 0.8, 0.998, 5e-9)
- (0.002, 0.6, 0.996, 5e-9)
- (0.002, 0.6, 0.996, 2e-8)
---
(0.002, 0.6, 0.996, 5e-9)

sqrt(4) = 2 scales eta to 0.002 and divides epsilon to 5e-9. Each beta becomes 1−4(1−beta), yielding 0.6 and 0.996. Changing only LR or scaling beta with sqrt(kappa) is a different proposal. The approximation remains conditional and does not guarantee an AdamW fine-tuning trajectory.
```

```checkpoint
A team has unlabeled domain text, wants a validated adapter-only training prototype and plans a frozen NF4 base. Which interpretation preserves those three requested decisions?

- Response-SFT learning signal; adapters train; NF4 stores the frozen base; validate backend compatibility.
- Domain-text learning signal; full model trains; NF4 stores the frozen base; validate backend compatibility.
- Domain-text learning signal; adapters train; BF16 stores the frozen base; validate backend compatibility.
- Domain-text learning signal; adapters train; NF4 stores the frozen base; validate backend compatibility.
---
Domain-text learning signal; adapters train; NF4 stores the frozen base; validate backend compatibility.

Unlabeled domain text supplies the domain-adaptive objective. Adapter-only specifies the trainable parameters, and NF4 specifies the frozen-base representation. SFT labels, full-weight updates or BF16 storage each change one requested axis; actual implementation compatibility still needs validation.
```

```mastery-quiz
[
  {
    "question": "Adam starts with both moments and its step counter at zero. The first gradient is −3e-8, epsilon is 2e-8, and the learning rate is 0.0036. With beta1 = 0.9 and beta2 = 0.99, how far does the adaptive step move this weight, excluding weight decay? Round to six decimal places.",
    "options": [
      "0.003600",
      "0.002160",
      "0.000216",
      "0.000470"
    ],
    "answer": "0.002160",
    "explanation": "On step one, bias correction gives g and g². The denominator is |g| + epsilon, so the distance is 0.0036 × 3 / (3 + 2) = 0.002160. Dropping epsilon gives 0.003600. Leaving the first moment at 0.1g gives 0.000216 if the second moment is corrected. Leaving both moments uncorrected also shrinks the square root to 0.1|g|, giving about 0.000470."
  },
  {
    "question": "A warning lasts 105 seconds. Remaining window work needs 24 seconds, save through publication 70 seconds and margin 12 seconds. What is the complete estimated path and its feasibility?",
    "options": [
      "94 seconds; it fits.",
      "106 seconds; it fits.",
      "118 seconds; it fails.",
      "106 seconds; it fails."
    ],
    "answer": "106 seconds; it fails.",
    "explanation": "The complete path is 24 + 70 + 12 = 106 seconds, longer than 105. Comparing only save plus margin drops remaining computation; adding margin twice also changes the stated contract."
  },
  {
    "question": "A regular mesh has 48 GPUs with distinct TP = 2, PP = 3 and CP = 2 axes. Each independent replica processes 2 sequences per microbatch and accumulates 5 microbatches. Which replica count and nominal global batch follow?",
    "options": [
      "48 replicas, 480 sequences.",
      "8 replicas, 80 sequences.",
      "4 replicas, 40 sequences.",
      "4 replicas, 8 sequences."
    ],
    "answer": "4 replicas, 40 sequences.",
    "explanation": "Each replica uses 2 × 3 × 2 = 12 GPUs, so 48 GPUs form 4 replicas. One round uses 4 × 2 = 8 sequences. All five rounds contribute to the update, giving 40 sequences. Counting context workers as independent replicas gives 8 replicas and 80 sequences. Counting every GPU separately gives 48 replicas and 480 sequences."
  },
  {
    "question": "The intended objective weights supervised tokens equally. Two DDP replicas have token-loss scalar gradients [6,6] and [-2,-2,-2,-2] across the complete window. What global gradient and local-loss-sum multiplier give that objective after ordinary DDP averaging?",
    "options": [
      "Gradient 2; multiplier 1/2.",
      "Gradient 2/3; multiplier 1/3.",
      "Gradient 1/3; multiplier 1/6.",
      "Gradient 2/3; multiplier 1/6."
    ],
    "answer": "Gradient 2/3; multiplier 1/3.",
    "explanation": "The token gradient sum is 12 − 8 = 4 over 6 targets, so the mean is 2/3. With D = 2 and N = 6, each local loss sum uses D/N = 1/3 before DDP averages. Averaging replica means yields 2; using 1/N before an additional DDP average halves the desired gradient."
  },
  {
    "question": "Four FP16 accumulation windows each consume 32 examples. Two windows have nonfinite gradients and skip the optimizer step. A scheduler is indexed by successful updates and starts at zero. Which consumed-example, successful-update and scheduler counters follow?",
    "options": [
      "Consumed 64; updates 2; scheduler 2.",
      "Consumed 128; updates 4; scheduler 4.",
      "Consumed 128; updates 2; scheduler 4.",
      "Consumed 128; updates 2; scheduler 2."
    ],
    "answer": "Consumed 128; updates 2; scheduler 2.",
    "explanation": "All four windows consume 4×32 = 128 examples. Only two successful updates advance this scheduler. Preserve consumed state and scaler behavior even on skipped windows; a None return from scaler.step alone does not diagnose whether a step ran."
  },
  {
    "question": "A frozen base has 12 billion weights at an ideal four bits each. What is its size in GiB to two decimal places, and what follows for all-resident training on 4 GiB and 24 GiB devices?",
    "options": [
      "6.00 GiB for the base. The 4 GiB plan fails. Training at 24 GiB needs a peak-memory check.",
      "5.59 GiB for the base. The 4 GiB plan fails. Training at 24 GiB needs a peak-memory check.",
      "5.59 GiB for the base. The 4 GiB plan fails. The full training step fits in 24 GiB.",
      "2.79 GiB for the base. Training at both 4 GiB and 24 GiB needs a peak-memory check."
    ],
    "answer": "5.59 GiB for the base. The 4 GiB plan fails. Training at 24 GiB needs a peak-memory check.",
    "explanation": "Two four-bit weights fit in a byte. Packing four per byte would give the 2.79 GiB estimate. The base uses 6 billion bytes, or 6.00 GB. Dividing by 2^30 bytes per GiB gives 5.59 GiB. The weights alone exceed 4 GiB. The 24 GiB device has 18.41 GiB left for metadata, adapters, activations and other allocations. Training fit depends on their peak."
  },
  {
    "question": "Checkpoint 40 is the previous published recovery point. Checkpoint 41 has a stable staged copy, but only three of four expected storage shards have completed. Which pointer action preserves the stated recovery contract?",
    "options": [
      "Publish 41 because staging completed; retain its missing-shard name in the manifest.",
      "Keep 40 published until the fourth upload future succeeds, then publish 41 on that signal.",
      "Keep 40 published; validate every expected 41 artifact before a conditional pointer update.",
      "Keep 40 published until the next optimizer update, then publish 41 even if upload is pending."
    ],
    "answer": "Keep 40 published; validate every expected 41 artifact before a conditional pointer update.",
    "explanation": "Keep 40 published while 41 is incomplete. A stable host copy can disappear with its worker, and another optimizer update says nothing about storage. Even if all four writes succeed, a stored shard can have the wrong contents. Check every expected artifact against the manifest for 41, including its recorded size or hash. Once validation passes, conditionally update the pointer from 40 to 41."
  },
  {
    "question": "At saved update 50, the complete consumed-example count is 100. A prefetch producer has advanced to 108. The checkpoint contains no supported in-flight batch state. Which count belongs with these boundary-only weights?",
    "options": [
      "108, to resume after the last example the producer fetched.",
      "92, to rewind the consumed count by the eight examples in the prefetch buffer.",
      "50, to start the sampler at the saved optimizer update number.",
      "100, to resume after the last example the checkpointed run consumed."
    ],
    "answer": "100, to resume after the last example the checkpointed run consumed.",
    "explanation": "The producer fetched 108 − 100 = 8 examples beyond the saved boundary. Starting at count 108 skips those eight. Subtracting eight from 100 gives 92 and replays eight examples already consumed. The value 50 counts updates. Restore the consumed count of 100 with the sampler state that identifies the next example."
  },
  {
    "question": "A 20-element tensor moves from four source ranks to five destination ranks. In both layouts, ranks take equal contiguous slices in order, starting with rank 0 at coordinate 0. Which destination rank and slice own coordinate 13?",
    "options": [
      "Rank 3 owns [12,16).",
      "Rank 2 owns [8,12).",
      "Rank 2 owns [10,15).",
      "Rank 3 owns [15,20)."
    ],
    "answer": "Rank 3 owns [12,16).",
    "explanation": "Each destination gets 20 / 5 = 4 elements. Dividing 13 by 4 gives quotient 3 and remainder 1, so rank 3 owns [12,16). Rank 2 owned coordinate 13 in the old [10,15) shard. Keeping that rank number in the new layout gives [8,12), which ends before 13. Using the new rank number with the old width gives [15,20), which starts after 13."
  },
  {
    "question": "A resumed run takes the mean loss over supervised targets in each sequence, then averages the two means. After shifting, the token losses are [2, 4, 6] and [1, 3, 5]. Their masks are [0, 1, 1] and [0, 0, 0], where 1 marks a supervised target. The batch loss is NaN before backward. A matrix-multiply canary passes on each GPU. Which check should come first on replay from the saved boundary?",
    "options": [
      "Compare the restored learning rate and the size of the last parameter update.",
      "Compare the restored loss scale and the gradient magnitudes after unscaling.",
      "Inspect the loss sum and target count used for each sequence mean.",
      "Inspect the matrix-multiply outputs for this batch against a reference device."
    ],
    "answer": "Inspect the loss sum and target count used for each sequence mean.",
    "explanation": "The first sequence gives (4 + 6) / 2 = 5. The second gives 0 / 0, so averaging the two means produces NaN even though the batch has two targets. Inspect the mask and empty-sequence handling. The listed token losses are finite, and this division fails before backward or a new parameter update. A learning-rate or scaler check misses that division. The passing canary covers its matrix multiply. The trace already explains the NaN without a device fault."
  }
]
```

> **Next:** Continue to [Reward Modeling from Preference Data](/learn/reward-modeling-from-preference-data). Ranked answers become a scalar training signal. That job still dies the same way if its checkpoint, batch, and scheduler do not resume together.
