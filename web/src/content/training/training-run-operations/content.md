---
{
  "id": "training-run-operations",
  "title": "Training Run Operations",
  "slug": "training-run-operations",
  "section": "Training, Fine-Tuning & Alignment",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "order": 7,
  "coverImage": "illustrations/_generated/preempt_resume_contract_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Meta",
    "Google",
    "NVIDIA"
  ],
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
    "mixed-precision-training-loss-scaling",
    "distributed-training-fsdp-deepspeed-zero"
  ],
  "relatedQuestions": [
    "knowledge-distillation-llms",
    "reward-modeling-from-preference-data",
    "pytorch-training-loops"
  ]
}
---

It's 3:15 AM. A spot preemption terminates your training cluster mid-epoch. You check the storage bucket: yesterday's weights are intact. You load them into your training script, hit resume, and watch yesterday's batches replay from step zero while the learning rate restarts its warmup. The model weights survived, yet the training run broke.

Consider a concrete job, `policy-sft-v4`: four data-parallel replicas, two sequences per microbatch, eight microbatches per accumulation window, and a durable checkpoint committed at update 1840. Resuming it cleanly requires answering three questions: which training state actually reached storage, which data sample comes next, and whether the replacement hardware preserves the optimization trajectory. Full-weight pretraining and parameter-efficient fine-tuning (<span data-glossary="lora">LoRA</span>) face the exact same three questions.

<figure>
  <img src="illustrations/_generated/preempt_resume_contract_dark.png" alt="A warning arrives after microbatch 5 of 8 while the durable pointer is 1840. Batches 6, 7, and 8 produce update 1841. The GPU live state is copied at that boundary into a frozen host snapshot containing model, AdamW moments, scheduler, scaler, RNG, and data cursor. After staging completes, live training may advance while the host copy stays at 1841. Storage writes shards and validates the manifest before the outcomes branch: success atomically publishes pointer 1841; any write or validation failure leaves pointer 1840. A 120-second preemption budget allocates 20s to finish step 1841, 90s to stage and publish checkpoint shards, and 10s of safety margin." />
  <figcaption>Staging frees live training to advance; storage validation decides whether the durable pointer moves.</figcaption>
</figure>

## Weights are only one part of a continuation

[Training loops](/learn/pytorch-training-loops) introduced the optimizer and learning-rate scheduler. Resuming an interrupted job means restoring their internal state alongside the parameters. Before calling any checkpoint loader, separate three distinct operations:

| Operation | State you need | Meaning of the next update |
|---|---|---|
| **Continue training** | Model weights, optimizer moments, scheduler counters, progress counters, data cursor, RNG states, scaler state | Continue from a recorded training boundary |
| **Initialize a new run** | Compatible weights or adapters and their base model | Start fresh optimization from those parameters |
| **Export for inference** | Weights or adapters, tokenizer, configuration, and serving assets | No optimizer update is implied |

For AdamW, optimizer state includes the first and second gradient moments ($m$ and $v$) along with per-parameter step counters [^loshchilov2019]. Mixed-precision runs with FP16 also require the gradient scaler state. Save per-rank random number generator (RNG) states and the dataloader's resumable cursor, plus the model config, tokenizer, chat template, and training arguments needed to interpret them.

Adapter checkpoints also depend on matching frozen base weights and adapter metadata. A merged inference export cannot resume an adapter run; training frameworks like torchtune separate intermediate resumable checkpoints from final inference exports for this reason [^torchtune2026checkpointer].

> **Key insight:** Continuation restores optimization state, not bitwise determinism. Bitwise replay additionally requires identical CUDA kernels, deterministic operators, cluster topology, random streams, and batch ordering. Changing topology alters all-reduce reduction trees and data partitions, so compare resumed loss trajectories against an uninterrupted baseline within a measured tolerance.

### What lost optimizer moments break

What happens when you reload model weights but let AdamW start with zeroed moments? AdamW scales each parameter update by its running second moment:

$$
\theta_{t+1} = \theta_t - \eta_t \left( \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} + \lambda \theta_t \right)
$$

Here $v$ estimates the uncentered second moment, not variance. If you reset both moments **and** the optimizer's step counter to zero, bias correction on step 1 yields $\hat{m}_1 = g$ and $\hat{v}_1 = g^2$. Excluding weight decay, the adaptive step moves each coordinate by $\eta g / (|g| + \epsilon)$, which is bounded in magnitude by $\eta$. A tiny gradient does not make that first step explode:

<!-- leetllm: test, id=adam-first-update, output=show, output_title="A fresh first step is bounded" -->
```python title="adam_first_update.py"
lr, epsilon = 1e-3, 1e-8
for gradient in (1e-12, 1e-6, 1.0):
    update = lr * gradient / (abs(gradient) + epsilon)
    print(f"g={gradient:.0e}; |first update|={abs(update):.3g}")
```

<!-- leetllm: output:start -->
```text title="A fresh first step is bounded" output compact
g=1e-12; |first update|=1e-07
g=1e-06; |first update|=0.00099
g=1e+00; |first update|=0.001
```
<!-- leetllm: output:end -->

Even though step 1 stays bounded, resetting moments discards the gradient history that steers subsequent direction and step size, and keeping the old step counter alongside zeroed moments skews bias correction. Watch what happens on a scalar Adam loop minimizing $(w - y)^2 / 2$ over a repeating target stream when we serialize a full checkpoint at update 7 versus dropping its moments:

<!-- leetllm: test, id=adam-resume, output=show, output_title="Continuation versus fresh moments" -->
```python title="adam_resume.py"
import json
import math

TARGETS = [1.0, -2.0, 3.0, 0.5]

def fresh(w=0.0):
    return dict(w=w, m=0.0, v=0.0, step=0, cursor=0)

def advance(state, updates):
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

# Keep weights, step, and cursor, but drop Adam moments.
lost_moments = dict(restored, m=0.0, v=0.0)
wrong = advance(lost_moments, 5)

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
  <img src="illustrations/_generated/optimizer_state_continuation_dark.png" alt="In the scalar Adam example, the saved update-7 state has weight 0.086726, first moment -0.341636, second moment 0.027877, and consumed-target cursor 7. Restoring all of it reaches weight 0.125436 at update 12. Resetting the moments while keeping the saved weight, step, and cursor reaches 0.126672 on the same five targets." />
  <figcaption>The same five next targets produce a different trajectory when Adam's moment history is reset.</figcaption>
</figure>

The step counter alone cannot reconstruct lost moments. In a cluster restore test, verify the next sample IDs, active learning rate, optimizer moments, and updated parameters against an uninterrupted run rather than eyeballing the loss curve alone.

## Reliability and the two checkpoint completion points

Large GPU clusters experience frequent interruptions. During Llama 3 405B training on configurations up to 16,384 H100 GPUs, the team recorded 419 unexpected interruptions and 47 planned ones over a 54-day window across hardware and software faults [^dubey2024].

Under an independent-device model of $N$ identical GPUs with constant failure rate, where any single failure halts the job, failure rates add:

$$
\text{MTBF}_{\mathrm{cluster}} = \frac{\text{MTBF}_{\mathrm{device}}}{N}
$$

Real clusters also suffer correlated power, network, and software failures, so track your own cluster's observed interruption rate and lost work rather than extrapolating from a single server's spec sheet.

To keep frequent saves from stalling GPUs, asynchronous checkpointing separates three locations where state lives:

1. **Live training memory:** GPU parameters, optimizer buffers, and dataloader state actively mutated by each step.
2. **Stable host snapshot:** Staging copies live tensors into isolated host RAM. Pinned memory speeds transfers but consumes reserved host RAM.
3. **Durable storage:** Background I/O writes the host snapshot to disk or object storage. Only completed writes plus manifest validation establish a new recovery point.

PyTorch Distributed Checkpoint's `async_save` stages state and returns a background storage future, while its optional `DefaultStager` moves staging itself to a background CPU thread and exposes separate `staging_completion` and `upload_completion` signals [^pytorchDcpAsync2026].

> **Common mistake:** Treating `staging_completion` as a durable save. Wait for staging before mutating live tensors, forward buffers, RNG, or dataloader state, and wait for full storage completion before publishing the new checkpoint pointer or pruning the previous one. Bound concurrent saves, propagate background exceptions, and close the stager on shutdown [^pytorchDcpApi2026].

Beware of shallow references when snapshotting in Python. `model.state_dict()` holds views into live parameter storage, so stepping the optimizer mutates the dictionary you thought you saved [^pytorchSavingLoading2026]:

<!-- leetllm: test, deps=torch, output=show, output_title="A state dictionary can alias live weights" -->
```python title="checkpoint-aliasing.py"
from copy import deepcopy
import torch

model = torch.nn.Linear(1, 1, bias=False)
with torch.no_grad():
    model.weight.fill_(1.0)

optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
live_dictionary = model.state_dict()
stable_copy = deepcopy(live_dictionary)

loss = model(torch.ones(1, 1)).square().sum()
loss.backward()
optimizer.step()

print("same storage pointer:", live_dictionary["weight"].data_ptr() == model.weight.data_ptr())
print("live dictionary after update:", round(live_dictionary["weight"].item(), 1))
print("independent copy at save boundary:", stable_copy["weight"].item())
```

<!-- leetllm: output:start -->
```text title="A state dictionary can alias live weights" output compact
same storage pointer: True
live dictionary after update: 0.8
independent copy at save boundary: 1.0
```
<!-- leetllm: output:end -->

Calling `deepcopy` on a large GPU state dictionary can double device memory usage, so rely on your checkpoint framework's host-staging path for distributed jobs. Asynchronous I/O overlaps computation, yet still shares host RAM, CPU cycles, and storage bandwidth; measure staging latency, upload latency, and step throughput together.

### Atomic manifest publishing and data cursor alignment

Write every checkpoint under a fresh versioned identifier and leave the previous committed snapshot intact until every shard, framework metadata file, and application state object finishes writing. A manifest should list the exact step boundary and expected artifacts with sizes or hashes so the loader can validate completeness before restoring.

How you publish the new recovery pointer depends on the storage backend:
- **POSIX filesystems:** Atomically rename a pointer file after flushing both the target files and parent directory with `fsync` ([Linux `fsync` documentation](https://man7.org/linux/man-pages/man2/fsync.2.html)).
- **Object stores:** Individual object writes are atomic, not multi-shard uploads. On Google Cloud Storage, update a `latest` pointer with a generation-match precondition only after every referenced shard passes validation [^google2026storageConsistency] [^google2026storagePreconditions].

A valid weight restore still corrupts continuation if the data cursor points to a different boundary. For a deterministic replayable dataset, recording the **consumed** batch count plus sampler seed is enough; never record the prefetch producer's furthest read, which runs ahead of the optimizer. Stateful streams, random augmentations, and sequence packing also need worker RNG and buffer state.

TorchData's `StatefulDataLoader` exposes `state_dict` and `load_state_dict`, aggregating state across local workers **but not across distributed ranks** [^torchdata2026statefulLoader]. Its iterable-dataset worker restore expects the same `num_workers` on reload [^torchdataStatefulTutorial2026], so changing world size or worker count requires an explicit data-repartitioning plan alongside tensor resharding.

## Treat preemption as a deadline and trigger saves explicitly

Suppose update 1840 is durably committed to storage, and a preemption warning (`SIGTERM` or a cloud spot notice) arrives right after microbatch 5 of the next 8-microbatch accumulation window.

When your policy saves only at completed optimizer boundaries, exactly two outcomes are valid:

1. **Finish the boundary:** All ranks stay healthy and enough time remains to run microbatches 6, 7, and 8, apply update 1841, stage to host RAM, upload every shard, and publish pointer 1841.
2. **Discard and rewind:** Time runs out or a rank dies. The orchestrator discards the five partial microbatches and restarts from durable step 1840. With a fixed 64 examples per step and no skipped updates, the consumed-example count is $1840 \times 64 = 117{,}760$.

> **Common mistake:** Pairing weights from step 1840 with a data cursor that advanced past microbatch 5. Those five microbatches vanish from training without ever contributing a gradient. Mid-window recovery requires saving accumulated gradients (still scaled under FP16 AMP), accumulation step count, scaler, buffers, RNG, and data state [^pytorchAmpExamples2026]; unless your stack explicitly tests mid-window restore, stick to completed update boundaries.

Keep signal handlers minimal: set a shutdown flag inside the handler, never launch distributed collectives there. Let the main training loop coordinate the boundary save across ranks. Because hardware faults often arrive with no warning at all, periodic durable checkpoints remain mandatory.

### Budget the entire remaining path

A 90-second checkpoint does not fit into a 90-second preemption warning if you also need to finish active microbatches and publish the manifest. Budget the full end-to-end path:

$$
T_{\mathrm{warning}} \ge T_{\mathrm{window}} + T_{\mathrm{save}} + T_{\mathrm{margin}}
$$

Here $T_{\mathrm{save}}$ spans staging through durable manifest publication, and $T_{\mathrm{margin}}$ absorbs storage and network jitter:

<!-- leetllm: test, id=preemption-budget, output=show, output_title="Warning-period budget" -->
```python title="preemption_budget.py"
def can_finish(grace, window, save, margin):
    return window + save + margin <= grace

for grace in (120, 119, 90):
    status = "fits" if can_finish(grace, window=20, save=90, margin=10) else "insufficient"
    print(f"{grace}s warning: {status}")

for productive_seconds in (300, 1200):
    fraction = 90 / (productive_seconds + 90)
    print(f"{productive_seconds}s compute + 90s save: {fraction:.1%} save overhead")
```

<!-- leetllm: output:start -->
```text title="Warning-period budget" output compact
120s warning: fits
119s warning: insufficient
90s warning: insufficient
300s compute + 90s save: 23.1% save overhead
1200s compute + 90s save: 7.0% save overhead
```
<!-- leetllm: output:end -->

A blocking 90-second save every 5 minutes spends 23.1% of wall-clock time checkpointing; stretching the interval to 20 minutes cuts overhead to 7.0% while exposing more work to unexpected loss. Under asynchronous saves, steps completed while an upload is still in flight remain uncommitted until publication. Tune the interval from measured save latency, cluster interruption frequency, and acceptable replay cost.

## Sharded saves need a compatible restore path

FSDP and ZeRO-3 distribute parameters and optimizer state across ranks rather than keeping a full copy on every GPU [^rajbhandari2020]. When checkpointing sharded models, verify both that the save finishes cleanly and that the target loader can read its layout.

Gathering a full state dictionary onto rank 0 hits single-host capacity fast. For a 70B model, BF16 weights take 140 GB and each FP32 Adam moment takes 280 GB, totaling 700 GB before any separate FP32 master weights. Offloading that gather to a large CPU host can avoid GPU OOM, yet still incurs heavy single-node transfer and memory pressure.

PyTorch Distributed Checkpoint (DCP) writes per-rank shards in parallel without assembling full tensors on one node [^pytorch2026dcp]. Its `.metadata` index records parameter names, global shapes, and shard coordinates. Even distributed saves typically stage tensors through host CPU RAM on the way to storage.

<figure>
  <img src="illustrations/_generated/sharded_save_reshard_dark.png" alt="The global element-index axis stays fixed from 0 through 16. Four source ranks own [0,4), [4,8), [8,12), and [12,16); eight target ranks own [0,2), [2,4), [4,6), [6,8), [8,10), [10,12), [12,14), and [14,16). Each source range maps to two adjacent target ranges with no gaps or overlap." />
  <figcaption>The global tensor coordinates stay fixed while rank ownership changes. Model and optimizer mappings both need a compatible destination layout.</figcaption>
</figure>

### Resharding across topologies without single-node bottlenecks

When restarting on a different GPU count, the loader maps saved global coordinates into the new sharding layout. Verify mesh divisibility, parameter identities, and optimizer state compatibility before assuming any world size works.

Under DCP, resharding proceeds without a central gather:
1. Allocate destination model and optimizer state dictionaries in the new distributed layout.
2. Read the shared `.metadata` index on each destination rank.
3. Intersect each rank's required coordinate slice with the saved source shard ranges.
4. Load the intersecting serialized slices into destination tensors.

Keep two implementation details in mind: DCP's filesystem reader allocates and deserializes each source tensor into CPU RAM before narrowing it to the requested slice [^pytorch2026dcpFilesystem], and cross-version DCP compatibility is unspecified, so test upgrades on your target stack [^pytorchDcpApi2026]. DeepSpeed handles topology changes via Universal Checkpointing: save ZeRO shards, convert them to universal format, and load onto the new mesh [^deepspeedUniversalCheckpointing2026].

The coordinate mapping below slices four saved shards across eight destination ranks while rejecting missing or overlapping ranges:

<!-- leetllm: test, id=reshard-offsets, output=show, output_title="Logical ranges survive a new layout" -->
```python title="reshard_offsets.py"
def reshard(shards, size, destinations):
    tensor = [None] * size
    for start, values in shards:
        for offset, value in enumerate(values, start):
            if tensor[offset] is not None:
                raise ValueError("overlapping ranges")
            tensor[offset] = value
    if any(value is None for value in tensor):
        raise ValueError("missing range")
    width = size // destinations
    return [(i, tensor[i:i + width]) for i in range(0, size, width)]

saved = [(i, list(range(i, i + 4))) for i in range(0, 16, 4)]
loaded = reshard(saved, 16, 8)

for broken in (saved[:-1], saved + [saved[0]]):
    try:
        reshard(broken, 16, 8)
    except ValueError as error:
        print(error)

print(loaded)
```

<!-- leetllm: output:start -->
```text title="Logical ranges survive a new layout" output compact
missing range
overlapping ranges
[(0, [0, 1]), (2, [2, 3]), (4, [4, 5]), (6, [6, 7]), (8, [8, 9]), (10, [10, 11]), (12, [12, 13]), (14, [14, 15])]
```
<!-- leetllm: output:end -->

Resharding moves tensor slices to a new rank layout cleanly. Changing the GPU count, however, does not automatically change how many sequences enter each optimizer step.

## Keep the update size separate from the GPU count

Global batch size depends on independent data-parallel replicas, not raw GPU count. For uniform microbatches across a full accumulation window:

$$
B_{\mathrm{global}} = B_{\mathrm{micro}} \times K \times D_{\mathrm{replica}}
$$

Here $B_{\mathrm{micro}}$ is sequences per replica microbatch, $K$ is accumulated microbatches per update, and $D_{\mathrm{replica}}$ is the number of independent **data-parallel replicas**. On a regular Cartesian mesh with tensor ($\mathrm{TP}$), pipeline ($\mathrm{PP}$), and context ($\mathrm{CP}$) parallelism:

$$
D_{\mathrm{replica}} = \frac{N_{\mathrm{GPUs}}}{\mathrm{TP} \times \mathrm{PP} \times \mathrm{CP}}
$$

Workers sharing a tensor-, pipeline-, or context-parallel group cooperate on the same sequences rather than adding new ones. Eight GPUs with $\mathrm{TP}=2$, $\mathrm{PP}=1$, and $\mathrm{CP}=1$ still form $D=4$ replicas; halving $K$ on that mesh would cut the global batch in half.

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

Sequence count rarely equals supervised token count. Packing, prompt masking, and variable response lengths mean two batches with the same sequence count carry very different numbers of loss-bearing tokens:

$$
\text{Tokens per update} = \sum_{i=1}^{B_{\mathrm{global}}} \text{Length}_{\mathrm{unmasked}}(i)
$$

If replica 0 holds 4,800 supervised tokens and replica 1 holds 9,600, averaging their local means computes $\frac{1}{2}(\bar{\mathcal{L}}_0 + \bar{\mathcal{L}}_1)$, giving each token on replica 0 twice the weight of each token on replica 1.

When the intended objective is a **mean over all supervised tokens**:

$$
\mathcal{L}_{\mathrm{global}} = \frac{\sum_{r} \sum_{j} \mathcal{L}_{r, j}}{\sum_{r} N_{\mathrm{tokens}, r}}
$$

Count supervised targets after shifting and masking across the full accumulation window and all replicas. Because standard DDP averages gradients across $D$ replicas [^pytorchDdpDocs2026], scaling each replica's local loss sum by $D / N$ (where $N$ is the global supervised token count) yields the exact global token-mean gradient after DDP averaging. Do not also divide by $K$ once $N$ spans all $K$ microbatches.

Watch how the two reductions diverge when rank 0 holds one token (gradient `10.0`) and rank 1 holds three tokens (gradient `-2.0` each):

<!-- leetllm: test, id=token-weighted-gradients, output=show, output_title="Token mean versus replica mean" -->
```python title="token_weighted_gradients.py"
tokens = [[10.0], [-2.0, -2.0, -2.0]]
replicas = len(tokens)
count = sum(len(rank) for rank in tokens)

token_mean = sum(sum(rank) for rank in tokens) / count
replica_mean = sum(sum(rank) / len(rank) for rank in tokens) / replicas
local_scaled = [replicas * sum(rank) / count for rank in tokens]
ddp_average = sum(local_scaled) / replicas

print(f"token mean gradient={token_mean:.1f}; replica mean={replica_mean:.1f}")
print(f"DDP averaged corrected gradients={ddp_average:.1f}")
```

<!-- leetllm: output:start -->
```text title="Token mean versus replica mean" output compact
token mean gradient=1.0; replica mean=4.0
DDP averaged corrected gradients=1.0
```
<!-- leetllm: output:end -->

Verify your distributed trainer's actual gradient reduction on a small asymmetric batch before scaling up.

```checkpoint
A 4-replica job with microbatch 2 and accumulation 8 restarts on eight GPUs configured as tensor parallel 2 and data parallel 4. Should you halve accumulation to preserve the batch?
---
No. Data parallelism is still four, so the batch remains 2 × 8 × 4 = 64. Halving accumulation would reduce it to 32. Count independent replicas, not devices.
```

## Preserve the scheduler before tuning a new batch

When resuming at the same effective batch size, restore the scheduler state directly rather than restarting warmup.

If you deliberately double tokens per update, a fixed token budget runs half as many optimizer updates. A 100-update warmup consumes 6,400 examples at batch 64 versus 12,800 examples at batch 128, shifting every milestone to later data volumes and potentially ending the run before cosine decay completes. Explicitly decide whether to preserve update counts or remap milestones to your token budget, and log the unit your schedule tracks.

### Detect AMP overflow before counting an optimizer update

Under FP16 `GradScaler`, nonfinite gradients cause `scaler.step(optimizer)` to skip the parameter update. Maintain separate counters for attempted accumulation windows, consumed examples/tokens, and successful optimizer updates. A scheduler indexed by successful updates stays put on skipped windows, whereas a data-indexed scheduler advances with consumed data.

<figure>
  <img src="illustrations/_generated/amp_update_clocks_dark.png" alt="A three-window FP16 GradScaler trace uses 64 examples per accumulation window and a scheduler indexed by successful optimizer updates. Window 1 is finite: the optimizer and scheduler advance to 1. Window 2 consumes the next 64 examples but has nonfinite gradients: the optimizer step is skipped, the successful-update and scheduler counters stay at 1, and the scaler backs off. Window 3 is finite: the optimizer and scheduler advance to 2." />
  <figcaption>Overflow advances data consumption while the successful-update scheduler waits.</figcaption>
</figure>

Keep the loss scale constant across an accumulation window, check for overflow once at the window boundary, and save both the consumed data cursor and scaler state in checkpoints [^pytorchAmpExamples2026]. Never infer whether an update ran from `scaler.step(...)` returning `None`, since most PyTorch optimizers return `None` after a normal step.

### Scaling rules are hypotheses to test

Goyal et al. popularized linear learning-rate scaling with gradual warmup for large-batch SGD on ResNet-50 (batch 8,192 across 256 GPUs) [^goyal2017]. That approximation assumes gradients change slowly across steps and can break early in training or at very large batch sizes.

For Adam, Malladi et al. derive a stochastic differential equation scaling rule for a batch multiplier $\kappa$ that adjusts more than just the learning rate [^malladi2022adaptiveScaling]:

$$
\begin{aligned}
\eta' &= \sqrt{\kappa}\,\eta, \\
\beta'_i &= 1 - \kappa(1 - \beta_i), \\
\epsilon' &= \epsilon / \sqrt{\kappa}.
\end{aligned}
$$

Each $\beta'_i$ must stay in a valid $(0, 1)$ range. Treat both linear and square-root scaling as candidate hypotheses to test against a fixed-LR control at matched token budgets.

McCandlish et al. characterize diminishing batch returns through the gradient-noise scale [^mccandlish2018]:

$$
\mathcal{B}_{\mathrm{simple}} = \frac{\operatorname{Tr}(\Sigma)}{\lVert G \rVert^2}
$$

where $G$ is the mean gradient and $\Sigma$ is the per-example gradient covariance. Pushing batch size far past $\mathcal{B}_{\mathrm{simple}}$ cuts update steps with diminishing wall-clock gains while increasing total tokens needed to reach the same loss.

## Diagnose a symptom before choosing a recovery

A loss spike alone never identifies its cause. Capture the last committed checkpoint, exact batch IDs, supervised token counts, learning rate, scaler state, and per-rank step timings before changing anything.

| Symptom | Candidates to investigate | First check |
|---|---|---|
| Same weights, different first LR | Scheduler and optimizer parameter-group restore; warmup reset | Verify step counter and scheduler state dictionary |
| Old sample IDs reappear | Consumed cursor, sampler epoch seed, prefetch buffer state | Rewind cursor to exact completed update boundary |
| Straggler on one rank | Unequal input work, thermal or power limits, host stalls, PCIe issues | Compare phase timings and `nvidia-smi -q -d PERFORMANCE` clock event reasons |
| Spiking all-reduce latency | Rank arrival skew, network congestion, link errors | Compare compute completion times, NIC/switch error counters, and negotiated link rates |
| Loss NaN on a clean batch | Zero supervised tokens or nonfinite gradient under FP16 | Check loss scale factor, token count masks, and inputs |
| Sudden loss divergence | Data or schedule change, numerical instability, software bug, hardware corruption | Reproduce from saved state and inspect inputs before assigning a cause |

A slow rank delays dependent collectives along the critical path. Because communication often overlaps backward compute, separate compute duration, rank arrival skew, and collective time in profiler traces, and compare `nvidia-smi` clock throttle reasons against a healthy peer running matched work [^nvsmi].

Link errors and degraded bandwidth slow jobs without crashing them; track counter trends alongside negotiated link speed before evicting a node. For rare silent data corruption (Llama 3 logged six such incidents in its 54-day breakdown [^dubey2024]), combine ECC telemetry with matched-precision matrix-multiply canary checks before training and after infrastructure changes.

### What a rollback policy must decide

Never publish a nonfinite training state as a recovery point; keep the diagnostic artifacts instead. For finite loss spikes, calibrate alert thresholds to your run's observed step-to-step variance rather than relying on an arbitrary rule of thumb.

When recovering:
1. Replay the suspect batch from the last known-good checkpoint on verified healthy hardware.
2. Inspect target masks, empty-token sequences, learning rate, loss scale, and gradient norms.
3. Cap automatic retries so a deterministic data or code bug cannot spin in an infinite restart loop.
4. Rewind to the last verified clean checkpoint based on evidence, and record any data quarantine or shuffle-seed change because it alters the continuation trajectory.

```checkpoint
After a NaN loss, a canary passes on every GPU, but the batch has zero supervised targets. Should the recovery harness automatically quarantine a GPU?
---
No. The empty target set can make a mean loss undefined. Check masking and batch construction, fix the data or loss handling, and replay from consistent state. Inspect device telemetry and run targeted checks before blaming hardware.
```

## Choose the objective, trainable weights, and precision separately

Training recipes compose three independent axes rather than a single preset. [SFT](/learn/supervised-fine-tuning-pipeline) and [continued pretraining](/learn/continued-pretraining-domain-adaptation) choose the learning signal. Full fine-tuning vs. LoRA chooses which weights update. BF16, FP8, or 4-bit NormalFloat (NF4, as in QLoRA) chooses frozen-base storage precision. Distillation learns from a teacher via soft logits [^hinton2015] or generated sequences [^kim2016sequenceDistillation].

| Decision | Examples | What it changes |
|---|---|---|
| Learning signal | Labeled responses; domain text; teacher targets or responses | Optimization objective and data distribution |
| Trainable parameters | Full model weights; LoRA adapters | Parameter memory, optimizer footprint, and capacity |
| Frozen-base precision | BF16; FP8; 4-bit NormalFloat (NF4) | Base model memory, CUDA kernels, numerical behavior |

Verify that your model architecture, quantization backend, adapter library, and GPU generation actually support the combination you pick. Domain-adaptive pretraining pays off when unfamiliar corpus vocabulary hurts held-out text fit and downstream tasks [^gururangan2020]; compare LoRA against full fine-tuning on the target task and budget [^hu2021].

<figure>
  <img src="illustrations/_generated/adaptation_method_matrix_dark.png" alt="Three recipe decisions compose a QLoRA SFT setup: response SFT supplies the learning signal, LoRA adapters are trainable while the base is frozen, and NF4 stores the base weights at four bits. On one shared 0–48 GiB scale, ideal storage for 70 billion four-bit weights is 32.6 GiB. This exceeds a 24 GiB single-GPU budget by 8.6 GiB. A 48 GiB budget leaves 15.4 GiB after base weights for adapters, activations, and overhead." />
  <figcaption>Choose the learning objective, trainable parameters, and base precision separately. Then check the memory floor.</figcaption>
</figure>

### Reject impossible memory plans before launching

QLoRA demonstrated fine-tuning a 65B model on a single 48 GB GPU [^dettmers2023]. Before launching a 70B run, check the base-weight memory floor first. At an ideal 4 bits per parameter, 70B weights require:

$$
\text{Memory}_{\mathrm{base}} = \frac{70 \times 10^9 \times 4\text{ bits}}{8\text{ bits/byte}} = 35 \times 10^9\text{ bytes} \approx 32.6\text{ GiB}
$$

Those base weights alone overshoot a 24 GiB card by 8.6 GiB before quantization scales, higher-precision norms, LoRA adapters, activations, gradients, or optimizer moments enter memory:

<!-- leetllm: test, id=weight-memory, output=show, output_title="Base-weight memory lower bounds" -->
```python title="weight_memory.py"
def weight_gib(parameters, bits):
    return ((parameters * bits + 7) // 8) / (1024 ** 3)

for label, params, bits in (
    ("70B at 4 bits", 70_000_000_000, 4),
    ("8B at 16 bits", 8_000_000_000, 16),
    ("8B at 4 bits", 8_000_000_000, 4),
):
    gib = weight_gib(params, bits)
    verdict = "exceeds 24 GiB" if gib > 24 else f"leaves {24 - gib:.1f} GiB on 24 GiB card"
    print(f"{label}: {gib:.1f} GiB base weights ({verdict})")
```

<!-- leetllm: output:start -->
```text title="Base-weight memory lower bounds" output compact
70B at 4 bits: 32.6 GiB base weights (exceeds 24 GiB)
8B at 16 bits: 14.9 GiB base weights (leaves 9.1 GiB on 24 GiB card)
8B at 4 bits: 3.7 GiB base weights (leaves 20.3 GiB on 24 GiB card)
```
<!-- leetllm: output:end -->

When base weights already exceed VRAM, change the plan before allocating cluster time: pick a smaller model, add sharding, or offload. On a 48 GiB GPU, 70B 4-bit leaves 15.4 GiB for quantization metadata, adapters, activations, and allocator overhead, so profile the full step peak before committing to a long job.

## Rehearse the restart before the long run

Do not wait for your first midnight preemption to find a broken checkpoint loader. Rehearse four short drills on a small test run first:

- **Local state continuity:** Compare five uninterrupted steps against five steps resumed from an intermediate checkpoint. Verify that weights, Adam moments, learning rate, and next sample IDs match within floating-point tolerance.
- **Distributed topology restoration:** Save on four GPUs, then load onto eight GPUs (or your planned recovery mesh). Verify model and optimizer resharding, data partitioning, and peak restore host RAM.
- **Preemption deadline drill:** Send `kill -TERM <training-pid>` to test both a warning that fits your budget and one that cuts off mid-save. Confirm the loader falls back cleanly to the last validated checkpoint.
- **Diagnostics and recovery policy:** Inject a slow rank or a zero-target batch. Confirm monitoring surfaces the cause, corrupt state is never published, and retries stay bounded.

Tag your *latest resumable checkpoint* separately from your *best evaluation checkpoint*. Step 1840 may be your operational resume point while step 1600 holds the best held-out score; track both with explicit metadata.

A weights file in object storage is not a resumable run. Optimizer moments, the consumed data cursor, and the scheduler phase must travel with it, and only a validated save that reached durable storage counts.

### Check your understanding

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

sqrt(4) = 2 scales eta to 0.002 and divides epsilon to 5e-9. Each beta becomes 1−4(1−beta), yielding 0.6 and 0.996. Changing only LR or scaling beta with sqrt(kappa) is a different proposal. Always validate the new schedule against a fixed-LR control.
```

```checkpoint
A team has unlabeled domain text, wants a validated adapter-only training prototype and plans a frozen NF4 base. Which interpretation preserves those three requested decisions?

- Response-SFT learning signal; adapters train; NF4 stores the frozen base; validate backend compatibility.
- Domain-text learning signal; full model trains; NF4 stores the frozen base; validate backend compatibility.
- Domain-text learning signal; adapters train; BF16 stores the frozen base; validate backend compatibility.
- Domain-text learning signal; adapters train; NF4 stores the frozen base; validate backend compatibility.
---
Domain-text learning signal; adapters train; NF4 stores the frozen base; validate backend compatibility.

Unlabeled domain text supplies the domain-adaptive objective. Adapter-only specifies the trainable parameters, and NF4 specifies the frozen-base representation. SFT labels, full-weight updates, or BF16 storage each change one requested axis; verify implementation compatibility on your target stack.
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
    "explanation": "The complete path is 24 + 70 + 12 = 106 seconds, longer than 105. Comparing only save plus margin drops remaining computation; adding margin twice also distorts the budget."
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
    "question": "Checkpoint 40 is the previous published recovery point. Checkpoint 41 has a stable staged copy, but only three of four expected storage shards have completed. Which pointer action preserves atomic recovery?",
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

> **Next:** Continue to [JAX for PyTorch Researchers](/learn/jax-for-ml-research).
