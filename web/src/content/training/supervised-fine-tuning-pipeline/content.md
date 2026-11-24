---
{
  "id": "supervised-fine-tuning-pipeline",
  "title": "Supervised Fine-Tuning Pipeline",
  "slug": "supervised-fine-tuning-pipeline",
  "section": "Advanced Training & Adaptation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "order": 6,
  "coverImage": "illustrations/_generated/sft_pipeline_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Meta",
    "Google",
    "Mistral"
  ],
  "shortDescription": "A fine-tuned assistant can sound fluent while breaking its instructions. Supervised fine-tuning raises the probability of the desired reply only when the loss mask, data split, and checkpoint evaluation measure that behavior.",
  "keyConceptsTested": [
    "end-to-end SFT workflow",
    "objective choice vs full fine-tuning, LoRA, and QLoRA parameterization",
    "grouped held-out splits and response-token loss",
    "effective batch size and gradient accumulation",
    "warmup, clipping, and weight decay",
    "checkpoint anatomy and resume semantics",
    "validation cadence and best-checkpoint selection",
    "single-GPU to multi-GPU SFT scaling",
    "when to use full-parameter updates"
  ],
  "prerequisites": [
    "instruction-tuning-chat-templates",
    "continued-pretraining-domain-adaptation",
    "synthetic-data-generation-pipelines-llms",
    "pytorch-training-loops",
    "dataset-pipelines-data-quality"
  ],
  "relatedQuestions": [
    "distributed-training-fsdp-deepspeed-zero",
    "lora-parameter-efficient-fine-tuning",
    "reward-modeling-from-preference-data"
  ]
}
---
<!-- leetllm: edition:reference:start -->

Your fine-tuning loss curve dropped smoothly all weekend. Then you test the model on conversation `conv_102`: a user asks your read-only SQL analytics assistant to remove test rows from an `orders` table before totaling monthly revenue. Despite a system prompt restricting it to `SELECT` queries, the model cheerfully replies: `"Run DELETE FROM orders WHERE status = 'test'; first, then run your revenue sum."`

Loss fell, yet the behavior you paid to train never changed. Almost everyone's first instinct is to sweep the learning rate, and that is almost always the wrong first move. The real bug is usually hiding upstream: another turn from `conv_102` leaked into validation, easy prompt tokens dragged down the loss average, packed examples attended across boundaries, or you picked a checkpoint by teacher-forced loss instead of real generated behavior.

<!-- leetllm: audience:website:start --><span data-glossary="supervised-fine-tuning">Supervised fine-tuning (SFT)</span> trains a pretrained model on curated demonstrations to raise the likelihood of desired replies through <span data-glossary="gradient">gradient</span> updates (the first post-training stage in InstructGPT before reward modeling and RL).[^huggingface2026sfttrainer][^torchtune2026firstfinetune][^ouyang2022] Let's trace one conversation from raw rows through splitting, masking, packing, batching, checkpointing, and evaluation so you can catch silent pipeline bugs on a single CPU before renting a cluster.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->The online companion's [Synthetic Data Pipelines](/learn/synthetic-data-generation-pipelines-llms) lesson covers how demonstrations are filtered before training. <span data-glossary="supervised-fine-tuning">Supervised fine-tuning (SFT)</span> trains a pretrained model on those accepted demonstrations to raise the likelihood of desired replies through <span data-glossary="gradient">gradient</span> updates (the first post-training stage in InstructGPT before reward modeling and RL).[^huggingface2026sfttrainer][^torchtune2026firstfinetune][^ouyang2022] Let's trace one conversation from raw rows through splitting, masking, packing, batching, checkpointing, and evaluation.<!-- leetllm: audience:book:end -->

<figure>
  <img src="illustrations/_generated/sft_pipeline_dark.png" alt="Eight token positions from conversation conv_102 in a row. Positions 0 to 4 are context tokens with label minus 100. Positions 5 to 7 are deny, write, and end, with those same tokens as labels. Arrows run from the logits at positions 4, 5, and 6 to the labels one position to their right. Only those three predictions enter the loss, and ignored prompt tokens stay in causal context." />
  <figcaption>Each target aligns with the logit one position to its left: `deny` is predicted by `logits[4]`, `write` by `logits[5]`, and `end` by `logits[6]`. Prompt positions carry `-100` so they stay in attention context without adding direct cross-entropy loss.</figcaption>
</figure>

## Separate objective from parameterization

A classic source of confusion sounds like *"we tried LoRA instead of SFT."* That mixes two independent choices: the **learning objective** (what signal trains the model) and the **parameterization** (which weights are allowed to move).

| Observed failure | Objective | Why |
|---|---|---|
| Weak grasp of domain vocabulary or schemas | Continued <span data-glossary="pretraining">pretraining</span> | Next-token training on raw domain corpora adapts the distribution first[^gururangan2020] |
| Knows SQL syntax but fails to refuse write queries | **SFT** | Curated prompt-completion demonstrations directly teach the target behavior[^huggingface2026sfttrainer] |
| Several fluent answers exist and need ranking | Preference training (DPO / RLHF) | Comparisons express relative quality without a single canonical answer[^rafailov2023] |

Once you choose SFT, pick the parameterization that carries the updates:

| Parameterization | What trains | When to use |
|---|---|---|
| **Full fine-tuning** | Every model weight | Memory permits and low-rank updates underfit |
| **<span data-glossary="lora">LoRA</span>**[^hu2021] | Low-rank $A, B$ adapters on frozen base weights | Fast iteration, lower <span data-glossary="optimizer-state">optimizer state</span>, or multi-adapter serving |
| **<span data-glossary="qlora">QLoRA</span>**[^dettmers2023] | Higher-precision LoRA adapters on a 4-bit NF4 frozen base (dequantized to <span data-glossary="bf16">BF16</span> for matmuls) | Base weights don't fit on your GPU in 16-bit |

## Clean demonstrations and split by the unit that could leak

Before touching a tokenizer, drop broken rows (like empty completions or missing group keys) and split by the entity that could leak across training and evaluation. In a SQL assistant, two turns from the same conversation `conv_102` (or two queries against the same schema) share table names and phrasing; random message-level splitting puts one turn in train and another in validation, inflating metrics through recall.

Group by whatever unit your evaluation claims to generalize across: conversation thread, database schema, tenant, or time window. Hold out validation for sweeps and keep a separate final test untouched until selection is frozen.

<!-- leetllm: test, output=show, output_title="Grouped split output" -->

```python title="grouped_sft_split.py"
rows = [
    {"case_id": "conv_102", "turn": 1, "answer": "Refuse writes; use SELECT with a WHERE filter instead."},
    {"case_id": "conv_102", "turn": 2, "answer": "Keep queries read-only by filtering status != 'test'."},
    {"case_id": "conv_551", "turn": 1, "answer": "Deny UPDATE and suggest a projection query."},
    {"case_id": "conv_771", "turn": 1, "answer": "Aggregate revenue with SELECT SUM(total)."},
]

eval_cases = {"conv_551"}
train_cases = {r["case_id"] for r in rows if r["case_id"] not in eval_cases}
held_out_cases = {r["case_id"] for r in rows if r["case_id"] in eval_cases}

print("train_cases=", sorted(train_cases))
print("eval_cases=", sorted(held_out_cases))
print("overlap=", train_cases & held_out_cases)
```

<!-- leetllm: output:start -->
```text title="Grouped split output" output compact
train_cases= ['conv_102', 'conv_771']
eval_cases= ['conv_551']
overlap= set()
```
<!-- leetllm: output:end -->

```checkpoint
Two turns from conversation `conv_102` have different wording. Can one train and the other evaluate if their token overlap is low?
---
No. They belong to the same conversation thread, so both turns stay in the same split. Group by schema or tenant whenever your evaluation tests generalization to unseen schemas or tenants.
```

## Data path: template, tokenize, label, pack

Follow one conversation down the pipeline: a Jinja2 <span data-glossary="chat-template">chat template</span> renders the messages into a single <span data-glossary="tokenization">token</span> stream, response-only masking marks prompt positions with `-100`, and collation pads or packs the batch.

Always use the checkpoint's shipped chat template (`add_generation_prompt=False` for complete training rows, and `add_special_tokens=False` if tokenizing an already-rendered string so BOS/EOS aren't doubled).[^huggingface2026chattemplates][^huggingface2026writingchattemplates]

### Shifted targets and response-only loss

In <span data-glossary="pytorch">PyTorch</span>, setting prompt labels to `-100` (the default `ignore_index` in `F.cross_entropy`) excludes those positions from the loss scalar while keeping them fully visible in attention so the response still conditions on the prompt.[^pytorchCrossEntropy2026] Remember the causal shift: `logits[t - 1]` predicts `labels[t]`, so the logit at the `<assistant>` marker predicts the first response token. Most trainers shift internally, so never shift twice.

<!-- leetllm: test, deps=torch, output=show, output_title="Shifted target check" -->

```python title="shifted_sft_targets.py"
import math
import torch
import torch.nn.functional as F

# Positions: [prompt, assistant_marker, answer, stop]
labels = torch.tensor([-100, -100, 2, 3])
logits = torch.zeros(4, 4, dtype=torch.float64, requires_grad=True)

loss = F.cross_entropy(logits[:-1], labels[1:], ignore_index=-100)
loss.backward()
active_rows = torch.nonzero(logits.grad.abs().sum(dim=1)).flatten().tolist()

print("logit rows with direct gradient:", active_rows)
print(f"mean target loss: {loss.item():.6f} (ln 4 = {math.log(4):.6f})")
```

<!-- leetllm: output:start -->
```text title="Shifted target check" output compact
logit rows with direct gradient: [1, 2]
mean target loss: 1.386294 (ln 4 = 1.386294)
```
<!-- leetllm: output:end -->

> **Key insight:** Why mask prompt tokens? Suppose a row has five easy prompt tokens (losses ~`0.03`) and two hard answer tokens (`2.20`, `1.80`). Averaging the full sequence gives a flattering `0.596`, masking the fact that actual answer loss is `2.000`. Response-only SFT focuses optimization squarely on the supervised target set $T$. (Fractional prompt-loss weighting can act as a regularizer on some short-completion tasks,[^huertaEnochian2024PromptLoss] so if you experiment with it, still track response-only loss separately.)

$$
\mathcal{L}_{\text{SFT}}(\theta) = -\frac{1}{|T|}\sum_{t \in T} \log p_\theta(y_t \mid y_{<t})
$$

In TRL's `SFTTrainer`, prompt-completion datasets default to completion-only loss, while conversational `messages` datasets score the whole conversation unless `assistant_only_loss=True` is set (which requires generation-span markers in the template).[^huggingface2026sfttrainer] Also check your collated batches **after truncation**: if an overlong prompt consumes `max_length` and slices off every answer token, every label becomes `-100` (returning NaN in raw PyTorch or silently dropping rows during TRL preparation).[^trl2026SftV117] Mask padding by position rather than token ID whenever EOS doubles as PAD.

## Pack short examples while isolating segments

Packing concatenates multiple short demonstrations into one context window to reduce padding overhead. That introduces two silent leaks at segment joins:
1. **Attention leak:** Without a block-causal mask, Example B attends to Example A's tokens simply because they share a row.
2. **Label leak:** Without masking the first label of Example B, Example A's final logit is scored against Example B's first token.

Resetting `position_ids` to `0, 1, 2, ...` at each segment isolates attention **only** when the attention stack turns those resets into a segment mask (for example, Transformers' shared causal-mask helper derives block-causal masks for eager and SDPA attention when `position_ids` reset, no `attention_mask` is passed, and `use_cache=False`; passing an all-ones mask or leaving KV caching on silently falls back to global causal attention).[^transformers2026MaskingV522][^transformers2026TrainerV522]

<!-- leetllm: audience:website:start --><figure>
  <img src="illustrations/_generated/packed_attention_boundaries_dark.png" alt="Two six-by-six attention masks for packed examples Ex A and Ex B, whose position IDs each reset to 0, 1, and 2. The block-causal mask lets Ex B's response at query 4 read only its own values 10 and 20, whose uniform mean is 15.0. Adding 100 to Ex A's values leaves the isolated output at 15.0; ordinary global causal attention leaks those earlier values and shifts its output from 7.2 to 67.2." />
  <figcaption>Gold dividers separate Ex A and Ex B. Under block-causal isolation, Ex B's query at index 4 reads only keys 3 and 4 (mean `15.0`), unaffected when Ex A changes.</figcaption>
</figure><!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start --><figure>
  <img src="illustrations/_generated/packed_attention_boundaries_dark.png" alt="Two six-by-six attention masks for packed examples Ex A and Ex B, whose position IDs each reset to 0, 1, and 2. The block-causal mask lets Ex B's response at query 4 read only its own values 10 and 20, whose uniform mean is 15.0. Adding 100 to Ex A's values leaves the isolated output at 15.0; ordinary global causal attention leaks those earlier values and shifts its output from 7.2 to 67.2." />
  <figcaption>Gold dividers separate Ex A and Ex B. Under block-causal isolation, Ex B's query at index 4 reads only keys 3 and 4 (mean `15.0`), unaffected when Ex A changes.</figcaption>
</figure><!-- leetllm: audience:book:end -->

Run a perturbation test on actual PyTorch `scaled_dot_product_attention` to see the leak directly (adding `100` to Example A leaves isolated Example B at `15.0`, while global causal attention jumps from `7.2` to `67.2`):[^pytorchSdpaDocs2026]

<!-- leetllm: test, deps=torch, output=show, output_title="Packed attention perturbation" -->

```python title="test_packed_attention_isolation.py"
import torch
import torch.nn.functional as F

segment_ids = torch.tensor([0, 0, 0, 1, 1, 1])
causal = torch.ones(6, 6, dtype=torch.bool).tril()
isolated = causal & (segment_ids[:, None] == segment_ids[None, :])

q = k = torch.zeros(1, 1, 6, 1, dtype=torch.float64)
values = torch.tensor([1.0, 2.0, 3.0, 10.0, 20.0, 30.0], dtype=torch.float64).view(1, 1, 6, 1)
changed = values.clone()
changed[:, :, :3] += 100.0

def ex_b_out(mask, v):
    return F.scaled_dot_product_attention(q, k, v, attn_mask=mask, dropout_p=0.0)[0, 0, 4, 0].item()

print(f"Isolated block-causal Ex B: {ex_b_out(isolated, values):.1f} -> {ex_b_out(isolated, changed):.1f}")
print(f"Leaking global-causal Ex B: {ex_b_out(causal, values):.1f} -> {ex_b_out(causal, changed):.1f}")
```

<!-- leetllm: output:start -->
```text title="Packed attention perturbation" output compact
Isolated block-causal Ex B: 15.0 -> 15.0
Leaking global-causal Ex B: 7.2 -> 67.2
```
<!-- leetllm: output:end -->

In TRL, `bfd` (best-fit decreasing) truncates overlong rows and enables padding-free segment isolation, `bfd_split` splits overlong rows into chunks, and `wrapped` concatenates a continuous stream without independent-example isolation.[^huggingfaceTrlPacking2026][^trl2026SftV117] FlashAttention is a major speed and memory win for long packed windows (avoiding the quadratic 2D mask that causes SDPA to OOM at 32K tokens),[^trl2026Pr7620] and running the perturbation test on your own trainer confirms isolation directly.

```checkpoint
A packed batch resets position IDs for Ex B, but Ex B's response can still attend to Ex A. Is the packing path correct?
---
No. Resetting position IDs only isolates examples when the attention kernel builds a segment mask from them. You must enforce both block-causal attention and label masking at segment starts.
```

## Effective batch size is also a token budget

Never report just `per_device_batch_size`. One optimizer step actually sees:

```text
items_per_update = per_device_batch * gradient_accumulation_steps * world_size
```

With `4 × 8 × 4 = 128` items per update (and say 1,560 supervised tokens per worker, totaling `6,240` supervised tokens per step), track both item count and **active supervised tokens**.

Also watch how micro-batch losses are reduced across gradient accumulation steps! If micro-batch 1 has one target token with loss `4.0` and micro-batch 2 has nine target tokens with loss `1.0` each, averaging the two micro-batch means gives `2.5` (giving that lone token 9x the weight!), whereas the true token-weighted mean is `(4.0 + 9.0) / 10 = 1.3`:

<!-- leetllm: test, output=show, output_title="Token-weighted accumulation" -->

```python title="token_weighted_accumulation.py"
microbatches = [[4.0], [1.0] * 9]
mean_of_means = sum(sum(b) / len(b) for b in microbatches) / len(microbatches)
token_mean = sum(map(sum, microbatches)) / sum(map(len, microbatches))

print(f"mean_of_means={mean_of_means:.1f} vs true token_mean={token_mean:.1f}")
```

<!-- leetllm: output:start -->
```text title="Token-weighted accumulation" output compact
mean_of_means=2.5 vs true token_mean=1.3
```
<!-- leetllm: output:end -->

In DDP, worker gradients are averaged automatically, so if each rank divides by the global active token count, compensate once for `world_size` (unless your trainer already handles global token normalization).

For schedules and optimizers, test rather than following folklore: InstructGPT's SFT baseline used 16 epochs with zero warmup and cosine decay to 10%,[^ouyang2022] standard Transformers cosine warmup decays all the way to `0.0` unless you choose a minimum-LR scheduler,[^transformers2026LrSchedules] and gradient clipping caps raw gradients rather than AdamW's adaptive update size.[^pytorchAdamW2026]

## What a resumable run must save

Saving only `model.safetensors` produces an inference export, not a resumable training checkpoint. Exact continuation requires saving every stateful component: model/adapter weights, AdamW moments ($m_t, v_t$) and step counters, LR scheduler state, global step/epoch, progressed sampler and RNG states, tokenizer/template hashes, and loss-scaler state (if using FP16).

Why do AdamW moments matter so much? Because AdamW computes bias-corrected updates from its running first and second moments:

$$
m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t, \qquad v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2, \qquad \theta_t = (1 - \eta_t\lambda)\theta_{t-1} - \eta_t \frac{\widehat{m}_t}{\sqrt{\widehat{v}_t} + \epsilon}
$$

Watch what happens in PyTorch when a step with gradient `+2.0` is followed by gradient `-1.0`: restoring AdamW's moments keeps moving the weight *downward* (`0.900 -> 0.873`), while loading the exact same weight into a fresh optimizer flips direction and moves *upward* (`0.900 -> 1.000`):[^pytorchAdamW2026][^pytorchSavingLoading2026][^deepspeedUniversalCheckpointing2026]

<!-- leetllm: test, deps=torch, output=show, output_title="Actual AdamW continuation" -->

```python title="resume_actual_adamw.py"
import copy
import torch

w = torch.nn.Parameter(torch.tensor(1.0, dtype=torch.float64))
opt = torch.optim.AdamW([w], lr=0.1, weight_decay=0.0)

def apply_grad(param, optimizer, g):
    optimizer.zero_grad(set_to_none=True)
    param.grad = torch.tensor(g, dtype=torch.float64)
    optimizer.step()

apply_grad(w, opt, 2.0)
saved_w = w.detach().clone()
saved_opt = copy.deepcopy(opt.state_dict())
apply_grad(w, opt, -1.0)

resumed_w = torch.nn.Parameter(saved_w.clone())
resumed_opt = torch.optim.AdamW([resumed_w], lr=0.1, weight_decay=0.0)
resumed_opt.load_state_dict(saved_opt)
apply_grad(resumed_w, resumed_opt, -1.0)

fresh_w = torch.nn.Parameter(saved_w.clone())
fresh_opt = torch.optim.AdamW([fresh_w], lr=0.1, weight_decay=0.0)
apply_grad(fresh_w, fresh_opt, -1.0)

print(f"after step 1 (saved): {saved_w.item():.6f}")
print(f"uninterrupted step 2: {w.item():.6f}")
print(f"resumed with moments: {resumed_w.item():.6f}")
print(f"fresh optimizer:      {fresh_w.item():.6f}")
```

<!-- leetllm: output:start -->
```text title="Actual AdamW continuation" output compact
after step 1 (saved): 0.900000
uninterrupted step 2: 0.873366
resumed with moments: 0.873366
fresh optimizer:      1.000000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/resume_checkpoint_stack_dark.png" alt="In a controlled PyTorch AdamW check, gradient +2 moves weight 1.000000 to 0.900000 and stores first and second moments 0.200000 and 0.004000 at step 1. With the same next gradient -1 and learning rate 0.1, restoring those moments yields 0.873366; loading the weight into a fresh optimizer yields 1.000000." />
  <figcaption>Same saved weight (`0.900`), same next gradient (`-1`), opposite directions: restoring AdamW moments matches the uninterrupted path (`0.873366`), while resetting the optimizer steps backward to `1.000000`.</figcaption>
</figure>

```checkpoint
A resumed run reloads model weights and global step, but drops optimizer, scheduler, and sampler state. Can its metrics be compared as an uninterrupted continuation?
---
No. Losing optimizer moments, LR schedule progress, and sampler position changes both the update direction and the upcoming batches.
```

## Choosing the best checkpoint

Teacher-forced validation loss measures how well the model predicts reference tokens given reference prefixes; it does not directly measure whether a freely generated reply refuses `DELETE` statements while answering `SELECT` queries. Select checkpoints on held-out generated behavior: require valid format ($\ge 98\%$), maximize task pass rate, and use validation loss only to break ties.

<!-- leetllm: test, output=show, output_title="Checkpoint selection output" -->

```python title="select_sft_checkpoint.py"
checkpoints = [
    {"step": 200, "val_loss": 1.91, "task_pass_rate": 0.93, "format_pass_rate": 0.99},
    {"step": 400, "val_loss": 1.77, "task_pass_rate": 0.91, "format_pass_rate": 1.00},
    {"step": 600, "val_loss": 1.79, "task_pass_rate": 0.97, "format_pass_rate": 0.98},
]

eligible = [c for c in checkpoints if c["format_pass_rate"] >= 0.98]
best = max(eligible, key=lambda c: (c["task_pass_rate"], -c["val_loss"], -c["step"]), default=None)
lowest_loss = min(checkpoints, key=lambda c: c["val_loss"])

print(f"best by behavior: step {best['step']} (task={best['task_pass_rate']}, val_loss={best['val_loss']})")
print(f"lowest val_loss:  step {lowest_loss['step']} (task={lowest_loss['task_pass_rate']}, val_loss={lowest_loss['val_loss']})")
```

<!-- leetllm: output:start -->
```text title="Checkpoint selection output" output compact
best by behavior: step 600 (task=0.97, val_loss=1.79)
lowest val_loss:  step 400 (task=0.91, val_loss=1.77)
```
<!-- leetllm: output:end -->

<!-- leetllm: audience:website:start --><figure>
  <img src="illustrations/_generated/checkpoint_selection_gate_dark.png" alt="Three checkpoints, steps 200, 400, and 600, are rows plotted against three aligned scales. All clear the inclusive 0.98 format threshold with 0.99, 1.00, and 0.98. Task pass rates are 0.93, 0.91, and 0.97, so step 600 wins. Validation losses are 1.91, 1.77, and 1.79." />
  <figcaption>Step 400 has the lowest validation loss (`1.77`) but the worst task pass rate (`0.91`). Selecting by held-out task behavior picks step 600 (`0.97`).</figcaption>
</figure><!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start --><figure>
  <img src="illustrations/_generated/checkpoint_selection_gate_dark.png" alt="Three checkpoints, steps 200, 400, and 600, are rows plotted against three aligned scales. All clear the inclusive 0.98 format threshold with 0.99, 1.00, and 0.98. Task pass rates are 0.93, 0.91, and 0.97, so step 600 wins. Validation losses are 1.91, 1.77, and 1.79." />
  <figcaption>Step 400 has the lowest validation loss (`1.77`) but the worst task pass rate (`0.91`). Selecting by held-out task behavior picks step 600 (`0.97`).</figcaption>
</figure><!-- leetllm: audience:book:end -->

## Single GPU first, then scale out

Never debug chat templates or loss masks across eight GPUs. Validate the pipeline end to end on a single device with a tiny split first. Reach for **FSDP** or **DeepSpeed ZeRO** once persistent weights, gradients, and optimizer state exceed single-GPU memory, remembering that sharding parameters does not shrink activation memory on long contexts.[^pytorchFsdpDocs2025][^rajbhandari2020]

Whether you use TRL, torchtune, or the Alignment Handbook,[^huggingface2026sfttrainer][^alignmentHandbook2025][^torchtune2026overview] the pipeline shape is the same:

```text title="sft_pipeline_shape.txt"
dataset -> template -> tokenizer -> collator/mask -> trainer
       -> periodic eval -> checkpoint save -> best-checkpoint export
```

Here is a clean TRL `SFTTrainer` starting configuration for conversational prompt-completion rows (note that TRL computes standard NLL via `loss_type="nll"`, with `"chunked_nll"` deprecated as an alias):[^huggingface2026sfttrainer][^trl2026SftImplementation]

```python title="trl_sft_config_fragment.py"
from trl import SFTConfig, SFTTrainer

args = SFTConfig(
    output_dir="runs/sql-tool-sft-lora",
    learning_rate=1e-4,
    max_length=1024,
    bf16=True,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    max_steps=200,
    lr_scheduler_type="linear",
    warmup_steps=0,
    seed=42,
    data_seed=42,
    packing=False,               # enable after running the isolation perturbation check
    eval_packing=False,
    completion_only_loss=True,
    loss_type="nll",
    eval_strategy="steps",
    eval_steps=100,
    save_steps=100,
)

trainer = SFTTrainer(
    model=model_with_lora_adapters,
    args=args,
    train_dataset=train_rows,
    eval_dataset=held_out_rows,
    processing_class=tokenizer,
)
```

## Common pitfalls checklist

When an SFT run underperforms, check these six failure modes before sweeping learning rates:
1. **Mixing up objective and parameterization:** Decide whether you need continued pretraining, SFT, or preference optimization before choosing between full fine-tuning and LoRA.
2. **Split leakage across related cases:** Group splits by thread, schema, or tenant rather than random rows.
3. **Reporting micro-batch as effective batch:** Always log per-device batch, accumulation steps, world size, packing mode, and supervised tokens per step.
4. **Resuming without optimizer/scheduler/sampler state:** Verify continuation on step $N+1$ against an uninterrupted run.
5. **Unverified packing isolation:** Run the perturbation check to confirm Example B never reads Example A and segment-start labels are masked.
6. **Picking checkpoints by loss alone:** Generate held-out completions and grade real task behavior.

```mastery-quiz
[
  {
    "question": "For each disputed charge, a reviewer writes one reply for a billing assistant to imitate. A layer uses W + BA, where W is its original 256-by-256 weight matrix. The optimizer updates only B (256 by 4) and A (4 by 256). Which objective and parameterization does this run use?",
    "options": [
      "Preference training with full-parameter updates.",
      "Preference training with LoRA adapters.",
      "Supervised fine-tuning with LoRA adapters.",
      "Supervised fine-tuning with full-parameter updates."
    ],
    "answer": "Supervised fine-tuning with LoRA adapters.",
    "explanation": "Each approved reply gives the model target tokens to predict. That is supervised fine-tuning. Preference training would need evidence about which reply the reviewer prefers. The product BA has rank at most four, so changing A and B gives the layer a LoRA update. Full-parameter tuning would also let the optimizer change W."
  },
  {
    "question": "The deployment claim is performance on unseen technical manuals. Threads A and B both cite manual M1; thread C cites M2. A proposed split trains on A/C and validates on B. What split property and claim follow?",
    "options": [
      "Thread-disjoint; sufficient evidence for unseen-manual behavior.",
      "Thread-disjoint; M1 still crosses the train-validation split.",
      "Manual-disjoint; B has a different thread identifier.",
      "Manual-disjoint; low wording overlap removes the shared source."
    ],
    "answer": "Thread-disjoint; M1 still crosses the train-validation split.",
    "explanation": "The threads differ, but M1 appears on both sides. Keep connected manual groups together when claiming unseen-manual performance. A thread key supports only the corresponding thread-level holdout."
  },
  {
    "question": "An isolated sequence has six ignored context labels followed by two answer-token labels and one stop label at positions 6,7,8. The trainer shifts once internally. Which predictor rows and active-term count enter response loss?",
    "options": [
      "Rows 6,7,8; three terms.",
      "Rows 5,6; two terms.",
      "Rows 0 through7; eight terms.",
      "Rows 5,6,7; three terms."
    ],
    "answer": "Rows 5,6,7; three terms.",
    "explanation": "The label at t is predicted by logits at t−1. Thus labels6/7/8 use predictor rows5/6/7. The stop remains supervised and the six context labels remain ignored without removing context."
  },
  {
    "question": "Token ID2 is both the actual stop at position5 and right padding at positions6/7. Answer text is at position4. Under response-only training, which active target positions and padding labels are correct?",
    "options": [
      "Active4/5; positions6/7 ignored.",
      "Active4; positions5/6/7 ignored.",
      "Active4/5/6/7; none ignored.",
      "Active5/6/7; position4 ignored."
    ],
    "answer": "Active4/5; positions6/7 ignored.",
    "explanation": "Mask padding by position. Preserve the true answer and stop at4/5; ignore padded6/7 even though those IDs equal the genuine stop. Masking every occurrence of ID2 would erase stop supervision."
  },
  {
    "question": "Two packed examples have values A=[3,6,9], B=[8,24,0]. Query4 belongs to B and uses uniform weights over allowed earlier/current positions. Add50 to each A value. Which isolated and global-causal before→after outputs follow?",
    "options": [
      "Isolated10→40; global16→16.",
      "Isolated16→16; global10→40.",
      "Isolated16→46; global10→10.",
      "Isolated10→10; global16→46."
    ],
    "answer": "Isolated16→16; global10→40.",
    "explanation": "An isolated query reads8 and24, averaging16 before and after. Global causal reads3,6,9,8,24: sum50/5=10. Changing three A values adds150/5=30, so it becomes40. Reset positions alone do not establish the enforced mask."
  },
  {
    "question": "Microbatch A has target losses [3,1]; B has four losses of0.5. In order mean of microbatch means, complete-window token mean, what follows?",
    "options": [
      "1.25;1.00.",
      "1.00;1.25.",
      "2.50;1.00.",
      "0.50;1.25."
    ],
    "answer": "1.25;1.00.",
    "explanation": "A sums4 over2 targets, mean2. B sums2 over4, mean0.5. Mean-of-means=(2+0.5)/2=1.25. The equal-token objective sums6 over6 targets, giving1.00."
  },
  {
    "question": "Three DDP workers have local loss-sum gradients3,6,9 and a global active-target count6. Each divides by6, then DDP averages worker gradients. What gradient results, what was intended, and which compensation is needed if the trainer has applied none?",
    "options": [
      "Result3; intended1; divide by3.",
      "Result1; intended1; no compensation.",
      "Result1; intended3; multiply by3 once.",
      "Result3; intended3; multiply by3 again."
    ],
    "answer": "Result1; intended3; multiply by3 once.",
    "explanation": "Local normalized gradients are0.5,1,1.5 and their DDP average is1. The global token objective is(3+6+9)/6=3. Compensate the averaging factor once; adding it again when the trainer already compensates changes the objective."
  },
  {
    "question": "A momentum-SGD rule uses velocity_new=0.5×velocity_old+gradient and weight_new=weight_old−0.2×velocity_new. From weight 1 and velocity 0, gradient 3 is applied and saved. With next gradient −1, what next weights follow with saved velocity versus reset velocity?",
    "options": [
      "Saved0.6; reset0.3.",
      "Saved0.3; reset0.6.",
      "Saved0.5; reset0.4.",
      "Saved0.4; reset0.5."
    ],
    "answer": "Saved0.3; reset0.6.",
    "explanation": "The first step gives velocity3 and weight0.4. Retained history gives next velocity0.5 and weight0.3. A fresh velocity gives−1 and weight0.6. Same saved weight and gradient can move in opposite directions because history differs."
  },
  {
    "question": "Require format>=0.98, then maximize task rate, then minimize validation loss, then prefer the earlier step. Validation scores (format,task,loss) are step100=(.99,.92,1.2),300=(.97,.98,.9),500=(.98,.94,1.4),700=(.99,.94,1.3). Which step wins?",
    "options": [
      "Step100.",
      "Step300.",
      "Step500.",
      "Step700."
    ],
    "answer": "Step700.",
    "explanation": "Step300 misses format. Among eligible rows,500 and700 tie on task rate 0.94;700 has lower validation loss1.3 versus1.4. Step100 has lower task rate. Earlier-step ordering applies only after both preceding metrics tie."
  },
  {
    "question": "A maintenance assistant replies with a team name followed by a reason. Urgent repairs go to Emergency Maintenance. A checkpoint predicts the approved replies well when given the preceding reference words, yet a resident gets a reply naming Routine Maintenance for an urgent repair. Which check on held-out urgent requests estimates how often residents get the right referral?",
    "options": [
      "With just the request, generate a reply and check which team it recommends.",
      "With just the request, generate a reply and check whether both fields are present.",
      "With the approved opening word given first, finish the reply and check which team it recommends.",
      "With the approved prefix at each step, score the probability of each word in the reference team name."
    ],
    "answer": "With just the request, generate a reply and check which team it recommends.",
    "explanation": "Start with the resident's request and let the model choose the first word and every word after it. Count replies that direct the resident to Emergency Maintenance and divide by the number of requests. Providing “Emergency” makes part of the decision for the model. Scoring reference words measures how well the model predicts the approved text. A reply can contain both fields and still send the resident to Routine Maintenance."
  }
]
```

> **Next:** Continue to [Mixed Precision Training](/learn/mixed-precision-training-loss-scaling). The run masks response tokens, keeps a grouped split honest, and resumes from more than the weights. Arithmetic precision changes those same updates, and dynamic loss scaling adds state a resumable run has to keep.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

You start the fine-tuning job on Friday. By Monday the loss curve has fallen smoothly all weekend, and it looks beautiful. Then you try the model on a real question. A user asks a read-only SQL analytics assistant to clear test rows from an `orders` table before totaling monthly revenue, and the assistant replies that you can run `DELETE FROM orders WHERE status = 'test';` first.

Loss fell and the behavior you paid for did not change. The tempting move is a learning-rate sweep, and that is usually the wrong one. The miss could be in the split, where another turn of the same conversation leaked into validation. It could be in the mask, where easy prompt tokens dragged the average down. It could be in the packing, where one example read its neighbor's text, or in the choice of checkpoint. None of those is a learning-rate problem, and every one of them survives a sweep.

The way out is to follow a single example from its stored conversation all the way to the optimizer. Every step on that route decides what the model learns, and every step can be checked on a laptop before you rent a GPU. That is what this chapter does.

## What supervised fine-tuning is

Supervised fine-tuning, or SFT, continues training a model on target text you chose. It uses the same task the model was built on, next-token prediction, with one change: you decide which tokens count. For an assistant, that usually means the assistant's reply and its end marker are scored, while the system prompt and the user's words are not. Those words still shape the reply through attention, so the model reads everything and is graded only on what it wrote.

Let $x$ be the prompt and $y=(y_1,\ldots,y_T)$ the approved response. The loss is the average surprise at each response token:

$$
\mathcal L_{\mathrm{SFT}}=-\frac{1}{T}\sum_{t=1}^T\log\pi_\theta(y_t\mid x,y_{<t}).
$$

Look at what sits behind the bar: the earlier tokens of the *approved* response. This is called teacher forcing. During this calculation the model never generates a reply of its own. At each position it sees the correct text so far and is asked for the next token, like a student who gets the right answer to each step before attempting the next one. That matters when you come to choose a checkpoint, because a low score here tells you how well the model predicts your text one token at a time. It does not tell you what the model says when it is on its own.

## Decide what the run should change

Write down the behavior first, before any trainer configuration. Ours: write requests (`DROP`, `DELETE`, `UPDATE`) get refused with a read-only `SELECT` alternative, read-only SQL questions get direct answers, and ordinary analytics explanations stay as good as they were. A held-out request must be able to show whether that happened.

Two decisions get tangled here, and you can spot the tangle in a sentence like "we tried LoRA instead of SFT." The **objective** says what signal guides the model. The **parameterization** says which weights may move to follow it.

| If the failure is | Try this objective | Because |
|---|---|---|
| Weak grasp of the domain's vocabulary | Continued pretraining on domain text | Next-token training adapts the language distribution before behavior training[^gururangan2020] |
| The model knows SQL syntax but does not refuse write operations | SFT | Demonstrations teach that response behavior directly[^huggingface2026sfttrainer] |
| Several answers are acceptable and need ranking | Preference training | Comparisons express relative quality without one target answer[^rafailov2023] |

Once you have picked SFT, choose what can carry the change. Full fine-tuning updates every eligible weight. LoRA freezes the base and trains small adapter matrices, and QLoRA also stores that frozen base in 4-bit form.[^hu2021][^dettmers2023] We cover both shortly. These choices change capacity and resource use. They cannot repair a wrong demonstration or a leaked split, so settle those first.

Record the starting model and tokenizer revisions, the chat template, the dataset version, the split, the maximum length, the trainable modules, and the evaluation rule together. If one experiment changes the template and widens the adapter at the same time, you will never know which change did what.

### Throw out broken rows, then split by what could leak

Every row needs a prompt, a desired answer, and a group key. A row with an empty answer is a training example with nothing to teach, and a row with no group key cannot be split safely. Reject both early.

The group key exists because of a mistake almost everyone makes once. Several messages from one multi-turn session share schemas and phrasing. Splitting individual messages at random can put one turn of conversation `conv_102` in training and another in validation, however different their wording looks. That leakage can inflate validation scores by rewarding recall of the shared conversation. Keep all rows from one session together. More broadly, group by the unit your claim says is unseen: a conversation thread, a database schema, a tenant, or a time period. Thread grouping tests new conversations. It says nothing about a new tenant or a database schema those threads all share. Keep separate validation and final-test groups, and look at the final test only after you have frozen your choice.

## Follow one token into the loss

The chat template turns the message list into a single stream, adding role markers and an end-of-turn marker. Use the checkpoint's own template, because its markers are the structure the deployed model must recognize, and they differ from model to model. For complete training conversations, render with `add_generation_prompt=False`. If you format text first and tokenize later, make sure special tokens are not added twice.[^huggingface2026chattemplates]

Then build the labels. Positions you do not want scored get `-100`, the value PyTorch's cross-entropy ignores by default. The scored positions hold the reply and its end marker.

Now the off-by-one that launches a thousand bug reports. A causal model's output at position $t-1$ predicts the token at position $t$. So the state at the assistant marker predicts the first answer token, and the state at the last answer token predicts the end marker. Shift twice and you score the wrong prediction. Shift never and you ask the model to predict a token it can already see. Most trainers shift for you, so the bug is usually a second shift in your own code. Find out who owns it.

<figure>
  <img src="illustrations/_generated/sft_pipeline_dark.png" alt="Eight token positions in a row. Positions 0 to 4 are context tokens with label minus 100. Positions 5 to 7 are deny, write, and end, with those same tokens as labels. Arrows run from the logits at positions 4, 5, and 6 to the labels one position to their right. Only those three predictions enter the loss." />
  <figcaption>Follow the arrows: each scored label is predicted by the logits one position to its left. The prompt's labels are ignored, but its tokens are still in the input row, available to everything after them.</figcaption>
</figure>

This little calculation starts with the probabilities the model assigned to the correct next tokens. A real model gets them from a log-softmax over the whole vocabulary.

<!-- leetllm: test, id=reader-sft-shifted-targets, output=show, output_title="Reader shifted supervision" -->
```python title="reader-sft-shifted-targets.py"
from math import log

labels = [-100, -100, -100, -100, -100, 7, 8, 9]
observed_probability = {4: 0.8, 5: 0.7, 6: 0.9}
terms, positions = [], []
for target_position in range(1, len(labels)):
    if labels[target_position] != -100:
        prediction_position = target_position - 1
        positions.append(prediction_position)
        terms.append(-log(observed_probability[prediction_position]))
print("prediction positions:", positions)
print(f"response mean loss={sum(terms) / len(terms):.3f}")
```

<!-- leetllm: output:start -->
```text title="Reader shifted supervision" output compact
prediction positions: [4, 5, 6]
response mean loss=0.228
```
<!-- leetllm: output:end -->

Eight positions went in, and three terms came out. Report both numbers when you talk about throughput, because a long prompt can fill most of the input while supplying very few scored targets.

Keep two masks straight, since people mix them up constantly. The **label mask** decides which positions contribute to the loss. The **attention mask** decides which earlier positions a token may read. A prompt token has label `-100` and stays fully visible to attention. Setting a label to `-100` also leaves gradients flowing through that prompt: the response loss still updates the weights that process the prompt.

Why score only the response? Suppose a row has 800 scored prompt positions and 30 response positions. Prompt targets are then about 96% of the terms in a full-sequence average, and they are often easy. On a smaller scale, say five prompt positions have losses of 0.03, 0.04, 0.02, 0.05, and 0.03, and two answer tokens have 2.20 and 1.80. The combined average is 0.596, while the answer's own loss sits at 2.000. You would celebrate that number while the answer was no better. This does not make response-only loss a law of nature. One study found that fractional prompt-loss weights improved some short-completion benchmarks on LLaMA models, with regularization as the likely cause.[^huertaEnochian2024PromptLoss] Scoring the response is a deliberate choice for this run, so if you change it, compare on the same held-out tasks and report response loss separately. In practice you rarely write this mask by hand, but check which format you loaded: TRL's `SFTTrainer` scores only the completion for prompt-completion data, while a plain `messages` dataset scores the whole conversation unless you set `assistant_only_loss=True` (which needs generation markers in the chat template).[^huggingface2026sfttrainer] Inspect a tokenized batch anyway and confirm that only answer and stop tokens carry real labels.

Inspect it *after* truncation, because truncation is where rows quietly die. Keep only the start of an overlong conversation, and the answer may be gone. Now every label is `-100`. With PyTorch's default mean cross-entropy, a batch made only of such rows gives NaN, which at least is loud. Trainers like TRL filter out fully masked rows during nonpacked preparation, so the only sign is a smaller dataset.[^trl2026SftV117] One such row inside a mixed batch is silent: it costs compute and teaches nothing. Count dropped and empty rows, so a shrinking dataset cannot hide. Two smaller traps live nearby. Mask padding by position rather than by token ID, because a model may use the same ID for padding and end-of-text, and masking every occurrence would erase your stop signal. And keep the stop token in your scored targets when the recipe uses it to teach turn completion.

## Pack short examples without letting them read each other

Padding short examples to a long fixed length wastes slots. Packing fits several short demonstrations into one sequence instead. It also raises a question that padding never did: can the second demonstration read the first?

With an ordinary causal mask, yes. Every later position can read every earlier one, so a reply for one query now conditions on an unrelated session simply because the loader happened to place them in one block. An end token marks text, and it stops nothing. What stops the leak is a block-causal mask, under which each position reads only earlier positions in its own example.

You rarely build that mask yourself. Modern Transformers models that use its shared causal-mask helper (such as Llama) build it automatically under eager attention and PyTorch's scaled dot-product attention (SDPA) from reset `position_ids`, provided you pass no `attention_mask` and run with `use_cache=False`.[^transformers2026MaskingV522] FlashAttention takes segment lengths instead. Breaking one of those conditions disables this automatic mask derivation and silently falls back to global-causal attention. Watch the cache if you write your own loop, because a Llama config turns it on by default (`Trainer` and gradient checkpointing turn it off during training).[^transformers2026TrainerV522] Test the isolation instead of trusting it.

<figure>
  <img src="illustrations/_generated/packed_attention_boundaries_dark.png" alt="Two six-by-six attention masks. On the left, block-causal attention has two separate triangles, so query 4 reads only positions 3 and 4, with values 10 and 20, and its output stays at 15.0 after 100 is added to the first example. On the right, global causal attention has one triangle, so query 4 reads positions 0 to 4, and its output moves from 7.2 to 67.2." />
  <figcaption>Filled cells are allowed reads. Compare row 4 in the two masks: the extra reads on the right are the leak, and they move the output by 60 when only the other example changed. Both panels restart the position IDs; the right panel shows what happens when automatic block-causal isolation falls back to global attention.</figcaption>
</figure>

The test for a leak is simple, and I recommend it over any amount of staring at tensors. Change one example and see whether the other one's output moves. This toy assumes equal attention scores, so the output is the mean of allowed values. Query position four belongs to the second example and should read only 10 and 20; adding 100 to every value in the first example should leave the isolated output unchanged while shifting the unmasked output by 60:

<!-- leetllm: test, id=reader-sft-packing-boundary, output=show, output_title="Reader packed attention isolation" -->
```python title="reader-sft-packing-boundary.py"
values = [1.0, 2.0, 3.0, 10.0, 20.0, 30.0]
example = [0, 0, 0, 1, 1, 1]
query = 4

def attend(data, isolated):
    allowed = [j for j in range(query + 1)
               if not isolated or example[j] == example[query]]
    return sum(data[j] for j in allowed) / len(allowed)

changed = [value + 100 if group == 0 else value
           for value, group in zip(values, example)]
for isolated in [True, False]:
    before = attend(values, isolated)
    after = attend(changed, isolated)
    print(f"isolated={isolated}: {before:.1f} -> {after:.1f}")
```

<!-- leetllm: output:start -->
```text title="Reader packed attention isolation" output compact
isolated=True: 15.0 -> 15.0
isolated=False: 7.2 -> 67.2
```
<!-- leetllm: output:end -->

That tests one attention rule in a few lines. To test your actual trainer, plant recognizable markers in two examples with dropout off, change one, and check the other's allowed attention and loss.

Attention is one of two leaks at the join. The loss has its own. A globally shifted loss must not ask the last token of one example to predict the first token of the next, so labels need masking at each segment start. TRL's padding-free collator masks those labels, restarts `position_ids`, omits `attention_mask`, and passes segment lengths for FlashAttention while disabling the cache.[^trl2026SftV117] FlashAttention remains a major speed and memory win on long packed sequences (avoiding SDPA's quadratic mask memory blow-up at 32K tokens),[^trl2026Pr7620][^huggingfaceTrlPacking2026] and running the perturbation test above on your trainer proves your examples stay isolated.

Packing strategies also differ in what they do with long rows: `bfd` (best-fit decreasing, a bin-packing rule) truncates overflow, `bfd_split` splits it into chunks, and `wrapped` treats everything as one token stream and cuts it into blocks, which can split a sequence in the middle and mix unrelated examples.[^huggingfaceTrlPacking2026][^trl2026SftV117] Keeping every stored token is different from keeping every answer's original context, so choose by what you want to learn, and inspect the resulting segments. Packing also changes how many items the loader sees, so a fixed `max_steps` may now mean a different number of passes through your data. If anything looks off, turn packing off while you debug.

## Count tokens, not examples

"Batch size 4" tells me very little. The number of items behind one optimizer update is the per-device batch, times gradient-accumulation steps, times the number of workers. With 4, 8, and 4, that is 128 items per update. With packing, an item is a block of several demonstrations, so track raw examples too. And since answers vary in length, track scored tokens, because that is how many decisions the model is actually graded on.

How you average matters as well. Call the slice one device processes in one forward and backward pass a micro-batch. Suppose one micro-batch has a single target with loss 4.0, and the next has nine targets with loss 1.0 each. Average the two batch means and you get 2.5. Average over tokens and you get 1.3. Those are different objectives: the first gives that lone token nine times the weight of each token in the larger batch. If you intend tokens to count equally, add up loss sums and divide by the total number of active targets over the whole update window. The listing also counts scored tokens, assuming each worker's share of the update holds 1,560 of them.

<!-- leetllm: test, id=reader-sft-token-budget, output=show, output_title="Reader token budget" -->
```python title="reader-sft-token-budget.py"
per_device, accumulation, workers = 4, 8, 4
tokens_per_worker = 1560
print("items per update:", per_device * accumulation * workers)
print("scored tokens per update:", tokens_per_worker * workers)

micro_batches = [[4.0], [1.0] * 9]
batch_means = [sum(b) / len(b) for b in micro_batches]
mean_of_means = sum(batch_means) / len(batch_means)
tokens = sum(map(len, micro_batches))
token_mean = sum(map(sum, micro_batches)) / tokens
print(f"mean of batch means={mean_of_means:.1f}; "
      f"token mean={token_mean:.1f}")
```

<!-- leetllm: output:start -->
```text title="Reader token budget" output compact
items per update: 128
scored tokens per update: 6240
mean of batch means=2.5; token mean=1.3
```
<!-- leetllm: output:end -->

The same care carries across machines. Ordinary distributed training averages gradients between workers. If each worker also divides its loss by a globally summed token count, that averaging introduces an extra factor of the worker count, and you must compensate for it, unless your trainer already does. Prove what the loss means on one device first, then check how the distributed trainer reduces counts and gradients. Adding hardware should leave your objective alone.

Treat warmup, learning rate, schedule, clipping, and total updates as a recipe you test. Published recipes vary more than folklore suggests. InstructGPT's SFT baseline used 16 epochs, no warmup, and a cosine decay to 10% of the initial rate, with rates and epochs chosen by search.[^ouyang2022] I would not copy that, but it does dispose of the idea that a fixed warmup percentage or a three-epoch ceiling is a rule. Also check what your settings actually do. Standard cosine warmup decays to zero, and only a minimum-rate variant keeps a floor,[^transformers2026LrSchedules] and clipping raw gradients does not directly limit AdamW's parameter update.[^pytorchAdamW2026] Plot both gradient norms and update norms.

## Save what the next update needs

Your job dies at step 40,000. You reload the weights and carry on, and the run is now a different run. A serving export holds what inference needs: tensors, config, tokenizer. A resume checkpoint must hold everything that determines the *next update*, and most of that is not weights.

Adam is the clearest case. It keeps a running first moment of the gradients and a running second moment, the average of their squares:

$$
m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,\quad
v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2.
$$

Before it uses them, it corrects for their cold start: $\widehat m_t=m_t/(1-\beta_1^t)$ and $\widehat v_t=v_t/(1-\beta_2^t)$. Those buffers influence the next step even when the current weight and gradient are identical. Here is a small proof. Take one step with gradient $+2$, save, then take a step with gradient $-1$ two ways: once with the saved moments and once with a fresh optimizer.

<!-- leetllm: test, id=reader-sft-adam-continuation, output=show, output_title="Reader optimizer continuation" -->
```python title="reader-sft-adam-continuation.py"
from math import sqrt

def adam(weight, gradient, state):
    step, first, second = state
    step += 1
    first = 0.9 * first + 0.1 * gradient
    second = 0.999 * second + 0.001 * gradient**2
    corrected_first = first / (1 - 0.9**step)
    corrected_second = second / (1 - 0.999**step)
    move = 0.1 * corrected_first
    updated = weight - move / (sqrt(corrected_second) + 1e-8)
    return updated, (step, first, second)

saved_weight, saved_state = adam(1.0, 2.0, (0, 0.0, 0.0))
continued, _ = adam(saved_weight, -1.0, saved_state)
fresh, _ = adam(saved_weight, -1.0, (0, 0.0, 0.0))
print(f"saved={saved_weight:.6f}")
print(f"with moments={continued:.6f}; fresh optimizer={fresh:.6f}")
```

<!-- leetllm: output:start -->
```text title="Reader optimizer continuation" output compact
saved=0.900000
with moments=0.873366; fresh optimizer=1.000000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/resume_checkpoint_stack_dark.png" alt="A weight number line from 0.85 to 1.05. Both runs start at the saved weight 0.900 and receive the same gradient, minus 1. With restored moments, m 0.2 and v 0.004 at step 1, the weight moves down to 0.873366. With a fresh optimizer, moments zero at step 0, the weight moves up to 1.000000." />
  <figcaption>Same weight, same gradient, opposite directions. The only difference between the two lanes is the optimizer state that was or was not restored.</figcaption>
</figure>

The direction flipped. With its saved history the optimizer keeps moving down despite the new negative gradient, and without that history it moves up. You may have heard that a fresh Adam divides by a near-zero epsilon and blows up. It does not. After the bias correction, the first step is just about the learning rate times the gradient's sign, which is why the fresh run moved by about 0.1. Dropping state changes the path, and the danger is that the change is quiet.

Here is the bundle a resumable run needs, trimmed to the machinery your recipe actually uses:

- Model weights or adapter weights
- Optimizer state, including moments and step counters
- Scheduler state, so the learning rate does not jump back to its peak
- The global step and epoch, sampler position, and random generator states (the states themselves, because the original seeds will replay old data)
- Tokenizer revision and chat-template hash, dataset manifest, and resolved configuration
- Loss-scaler state if you use dynamic scaling, which the next chapter explains

Save at a completed optimizer step when you can, since a mid-accumulation save also needs the partial gradients and the micro-batch position. Then test the whole thing early with a restore drill: run a short job, interrupt it, resume it, and compare the next batch, learning rate, loss, gradients, and updated parameters against a run that was never interrupted. Comparing only the first loss after the restore proves very little, because both models start with identical weights and the optimizer has not acted yet. Expect small numeric differences from device kernels and reduction order, and set your tolerances accordingly.

## Pick the checkpoint that behaves

Choosing a checkpoint is a product decision expressed in measurements. Teacher-forced loss tells you how likely your reference tokens are given your reference prefixes. It does not tell you whether a freely generated reply refuses destructive SQL writes, so generate outputs and grade them. Here is a small selection rule: every candidate must pass a format check at 98% or better, then the highest task pass rate wins, and validation loss only breaks ties.

<figure>
  <img src="illustrations/_generated/checkpoint_selection_gate_dark.png" alt="Three checkpoints, steps 200, 400, and 600, are rows, plotted against three aligned scales. All three clear the 0.98 format gate with 0.99, 1.00, and 0.98. Task pass rates are 0.93, 0.91, and 0.97, so step 600 wins. Validation losses are 1.91, 1.77, and 1.79, and step 400 is lowest, but loss only breaks ties." />
  <figcaption>Read across the rows. Step 400 has the best loss and the worst task score, and a team choosing by loss would ship it. The rule picks step 600.</figcaption>
</figure>

Use validation data for this, and report denominators, uncertainty, and the slices that matter. Watch for unsupported citations, false refusals, regressions on unrelated tasks, and answers that turn down harmless `SELECT` queries just because a column is named `deleted_at`, because more optimizer steps can strengthen an unwanted habit just as well as a wanted one. If no checkpoint clears the format bar, stop and fix the recipe rather than shipping the best of a bad batch.

After export, reload the artifact with its tokenizer and template and repeat your generation checks. An adapter export also needs its exact base revision. Keep the previous checkpoint ready to restore while you evaluate the candidate.

## Run it small before you run it big

Do not debug on eight GPUs. A template bug scaled out is the same bug spread across collective communication calls, now with extra suspects. Prove the pipeline on one device, with a small representative evaluation split, frequent checkpoints, a verified mask, and a clear behavior metric. If a required model cannot fit one device, debug your data with small test data and use the least sharding that works. Sharding splits a model's training state across several GPUs, so each device stores only a slice and none has to hold all of it. The price is communication: a device has to gather the weights it is missing before it can run a layer on them, and it frees them afterward.

Reach for Fully Sharded Data Parallel (FSDP) or the Zero Redundancy Optimizer (ZeRO) when persistent weights, gradients, and optimizer state exceed GPU memory. Both shard that state, and you choose how much. ZeRO, for example, has three stages: stage 1 splits the optimizer state, stage 2 adds the gradients, and stage 3 adds the weights.[^pytorchFsdpDocs2025][^rajbhandari2020] Measure activation memory separately, because sharding parameters does not make it go away, and a model that fits for inference can still fail to fit for training. More GPUs also add communication time, so they will not speed up a small job that is simply misconfigured.

When a run disappoints, here is the checklist I would run before touching the learning rate:

- **Does validation share cases with training?** High scores followed by failures on new documents can mean leakage, distribution shift, or the wrong metric. Check whether related cases crossed splits.
- **Is the reported loss over the right targets?** Check the labels on a real collated batch, after truncation and shifting.
- **Did someone report a micro-batch as the batch?** Two runs "at batch size 4" can differ wildly. Publish accumulation, workers, packing mode, and scored tokens per update.
- **Did a resumed run continue, or start over?** Compare optimizer counters, learning rate, and upcoming data with an uninterrupted reference.
- **Can examples read each other?** Run the perturbation test. Garbled answers alone do not prove a packing leak, so test it directly.
- **Was the checkpoint chosen by training loss?** Choose by validation behavior against your declared rule, then check the frozen choice on the final test.

```checkpoint
One micro-batch has a single target with loss 2.0, and the next has six targets with loss 1.0 each. What is the mean of the two batch means, and what is the token mean? Which one treats every token equally?
---
The batch means are 2.0 and 1.0, so their mean is $(2.0 + 1.0)/2 = 1.5$. The token mean is $(2.0 + 6 \times 1.0)/7 \approx 1.14$, and it treats every token equally. The mean of means gives the lone token six times the weight of each token in the larger batch.
```

## Where this leaves you

You can now take an approved demonstration through a template, a label mask, and a one-position shift, and say exactly which token predictions move the weights. You can pack without leaking, count what an update really contains, resume without changing the run, and pick a checkpoint by what it does.

One assumption is still hiding in all of this. We have talked as if every gradient, once computed, actually changes a weight. On real hardware, that update passes through a floating-point format with limited range and limited precision, and a perfectly correct nonzero update can round away to nothing. [Mixed precision](/learn/mixed-precision-training-loss-scaling) follows that update through the arithmetic.

<!-- leetllm: edition:reader:end -->
