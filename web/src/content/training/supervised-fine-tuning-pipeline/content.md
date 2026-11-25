---
{
  "id": "supervised-fine-tuning-pipeline",
  "title": "Supervised Fine-Tuning Pipeline",
  "slug": "supervised-fine-tuning-pipeline",
  "section": "Training, Fine-Tuning & Alignment",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "order": 8,
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
    "pre-training-data-pipelines-scale",
    "synthetic-data-generation-pipelines-llms",
    "pytorch-training-loops",
    "cross-validation-leakage-generalization"
  ],
  "relatedQuestions": [
    "distributed-training-fsdp-deepspeed-zero",
    "lora-parameter-efficient-fine-tuning",
    "reward-modeling-from-preference-data"
  ],
  "aliases": [
    "instruction-tuning-chat-templates"
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

## Data path: chat templates, special tokens, and loss masking

Follow one conversation down the pipeline: a Jinja2 <span data-glossary="chat-template">chat template</span> converts structured `[{"role": ..., "content": ...}]` messages into a single <span data-glossary="tokenization">token</span> stream using model-specific control tokens, assistant-only loss masking marks non-assistant positions with `-100`, and collation pads or packs the batch.

Every model family uses its own role and turn delimiters: Llama 3 uses `<|begin_of_text|>`, `<|start_header_id|>`, `<|end_header_id|>`, and `<|eot_id|>`; ChatML/Qwen models use `<|im_start|>` and `<|im_end|>`; Mistral uses `[INST]` and `[/INST]`.[^metaLlama3Tokenizer2024][^qwen25ChatTemplate2026] Always render with the checkpoint's shipped `tokenizer.apply_chat_template(...)` and match the exact mode to your stage:[^huggingface2026chattemplates][^huggingface2026writingchattemplates]

| Stage | Flag | What the rendered stream ends with |
|---|---|---|
| **Training row** | `add_generation_prompt=False` | Complete assistant reply plus its end-of-turn stop token |
| **Inference prompt** | `add_generation_prompt=True` | Open assistant role header so the model generates the reply instead of continuing the user turn |
| **Assistant prefill** | `continue_final_message=True` | Partial assistant prefix without a closing turn delimiter |

> **Common mistake:** Rendering with `apply_chat_template(..., tokenize=False)` and then calling `tokenizer(rendered)` with default `add_special_tokens=True`. That doubles `<BOS>` at the start of every sequence, shifting positional alignment away from inference. Pass `add_special_tokens=False` when tokenizing an already-rendered string, and guard against delimiter injection (literal `<|eot_id|>` strings inside untrusted user text) by tokenizing raw user content with `split_special_tokens=True` or sanitizing reserved control markers.

### Shifted targets and assistant-only loss masking

Unlike pretraining, which averages next-token cross-entropy across every token in the sequence ($\mathcal{L}_{\text{pretrain}} = -\frac{1}{T}\sum_{t=1}^T \log P_\theta(x_t \mid x_{<t})$), SFT multiplies each position by a binary mask $m_t \in \{0, 1\}$ that activates only assistant replies and their stop tokens across all turns:[^ouyang2022][^zhou2023]

$$
\mathcal{L}_{\text{SFT}}(\theta) = -\frac{1}{\sum_{t=1}^T m_t}\sum_{t=1}^T m_t \log p_\theta(x_t \mid x_{<t})
$$

In <span data-glossary="pytorch">PyTorch</span>, setting prompt and role-header labels to `-100` (the default `ignore_index` in `F.cross_entropy`) excludes those positions from the loss scalar while keeping them fully visible in causal attention so the response still conditions on the prompt.[^pytorchCrossEntropy2026] Remember the causal shift: `logits[t - 1]` predicts `labels[t]`, so the logit at the `<assistant>` marker predicts the first response token. Most trainers shift internally, so never shift twice.

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

> **Key insight:** Why mask prompt tokens? Suppose a row has five easy prompt tokens (losses ~`0.03`) and two hard answer tokens (`2.20`, `1.80`). Averaging the full sequence gives a flattering `0.596`, hiding the fact that actual answer loss is `2.000`. Assistant-only masking focuses updates on the reply (though fractional prompt-loss weighting can regularize some short-completion tasks,[^huertaEnochian2024PromptLoss][^shi2024InstructionLoss] so always log response-only loss separately).

In TRL's `SFTTrainer`, prompt-completion datasets default to completion-only loss, while conversational `messages` datasets score the whole conversation unless `assistant_only_loss=True` is set (which requires generation-span markers in the template).[^huggingface2026sfttrainer] Also inspect collated batches **after truncation**: if an overlong prompt consumes `max_length` and slices off every answer token, every label becomes `-100` (returning NaN in raw PyTorch or silently dropping rows during TRL preparation).[^trl2026SftV117] Mask padding by position rather than token ID whenever EOS doubles as PAD.

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

> **Next:** Continue to [LoRA & Parameter-Efficient Tuning](/learn/lora-parameter-efficient-fine-tuning).

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

## Chat templates, special tokens, and assistant-only loss

Before a single gradient runs, a Jinja2 **chat template** serializes the structured message list into one token stream using model-specific control tokens: Llama 3 uses `<|begin_of_text|>`, `<|start_header_id|>`, `<|end_header_id|>`, and `<|eot_id|>`, while ChatML/Qwen uses `<|im_start|>` and `<|im_end|>`.[^metaLlama3Tokenizer2024][^qwen25ChatTemplate2026] Always render with the checkpoint's shipped `apply_chat_template(...)` and choose the right ending: `add_generation_prompt=False` for complete training conversations (ending on the assistant's stop token), `add_generation_prompt=True` at inference so the model starts an assistant turn, and `continue_final_message=True` when prefilling an assistant prefix.[^huggingface2026chattemplates] Watch two quiet formatting bugs: calling `tokenizer(rendered)` with default `add_special_tokens=True` after `tokenize=False` doubles `<BOS>`, and literal control strings like `<|eot_id|>` inside user text can forge turn boundaries unless untrusted text is sanitized or tokenized with `split_special_tokens=True`.

Next, build the **label mask** $m_t \in \{0, 1\}$. Whereas pretraining averages next-token loss across every position, assistant-only SFT sets non-assistant labels (system, user, role headers, and padding) to `-100`, the `ignore_index` in PyTorch's cross-entropy, while keeping those tokens fully visible in attention so replies still condition on the prompt. Remember the causal shift: logits at position $t - 1$ predict the token at position $t$, so the `<assistant>` marker predicts the first answer token and the last answer token predicts the stop token. Most trainers shift internally, so never shift twice.

<figure>
  <img src="illustrations/_generated/sft_pipeline_dark.png" alt="Eight token positions in a row. Positions 0 to 4 are context tokens with label minus 100. Positions 5 to 7 are deny, write, and end, with those same tokens as labels. Arrows run from the logits at positions 4, 5, and 6 to the labels one position to their right. Only those three predictions enter the loss." />
  <figcaption>Follow the arrows: each scored label is predicted by the logits one position to its left. The prompt's labels are ignored, but its tokens are still in the input row, available to everything after them.</figcaption>
</figure>

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

Why mask prompt tokens? Suppose five easy prompt tokens have losses near `0.03` and two answer tokens have `2.20` and `1.80`: full-sequence averaging reports a flattering `0.596` while actual answer loss sits at `2.000`. (Fractional prompt-loss weighting can regularize some short-completion tasks,[^huertaEnochian2024PromptLoss][^shi2024InstructionLoss] so if you test it, still track response-only loss separately.) In TRL's `SFTTrainer`, prompt-completion datasets default to completion-only loss, whereas `messages` datasets score every turn unless `assistant_only_loss=True` is set (requiring generation markers in the template).[^huggingface2026sfttrainer] Always inspect batches **after truncation**: if an overlong prompt consumes `max_length`, every label becomes `-100`, causing NaN in raw PyTorch or silent row drops in TRL.[^trl2026SftV117] Mask padding by position rather than token ID whenever EOS doubles as PAD, and keep the stop token supervised so the model learns when to end its turn.

## Pack short examples without letting them read each other

Padding short demonstrations to a long context wastes compute, so packing concatenates several examples into one row. That creates two leaks at segment boundaries: under ordinary global causal attention, Example B reads Example A simply because they share a block, and without masking Example B's first label, Example A's final logit is scored against Example B's start.

Modern Transformers models derive a **block-causal mask** automatically from reset `position_ids` under eager and SDPA attention only when you pass no `attention_mask` and run with `use_cache=False` (FlashAttention takes segment lengths directly).[^transformers2026MaskingV522][^transformers2026TrainerV522] Breaking any condition silently falls back to global causal attention, so test isolation directly by perturbing Example A and checking whether Example B's output moves:

<figure>
  <img src="illustrations/_generated/packed_attention_boundaries_dark.png" alt="Two six-by-six attention masks. On the left, block-causal attention has two separate triangles, so query 4 reads only positions 3 and 4, with values 10 and 20, and its output stays at 15.0 after 100 is added to the first example. On the right, global causal attention has one triangle, so query 4 reads positions 0 to 4, and its output moves from 7.2 to 67.2." />
  <figcaption>Filled cells are allowed reads. Compare row 4 in the two masks: the extra reads on the right are the leak, and they move the output by 60 when only the other example changed. Both panels restart the position IDs; the right panel shows what happens when automatic block-causal isolation falls back to global attention.</figcaption>
</figure>

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

In TRL, `bfd` (best-fit decreasing) truncates overflow with padding-free segment isolation, `bfd_split` splits long rows into chunks, and `wrapped` packs a continuous stream without example isolation.[^huggingfaceTrlPacking2026][^trl2026SftV117] FlashAttention avoids SDPA's quadratic mask memory blow-up on 32K packed blocks.[^trl2026Pr7620] Whenever anything looks off, turn packing off while debugging.

## Count tokens, not examples

One optimizer update actually sees `per_device_batch * gradient_accumulation_steps * world_size` items (`4 * 8 * 4 = 128` below), and because reply lengths vary, always log **active supervised tokens** too.

Watch micro-batch reduction carefully: if micro-batch 1 has one target token with loss `4.0` and micro-batch 2 has nine target tokens with loss `1.0` each, averaging the two batch means gives `2.5` (weighting the lone token 9x), whereas the true equal-token mean is `(4.0 + 9.0) / 10 = 1.3`:

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

In distributed training, DDP averages worker gradients automatically, so dividing locally by the global token count requires compensating once for `world_size` unless your trainer already handles global token reduction. Test learning rate, schedule, and epochs rather than trusting folklore: InstructGPT's SFT baseline used 16 epochs with zero warmup and cosine decay to 10%,[^ouyang2022] standard cosine warmup decays all the way to zero unless you pick a minimum-LR variant,[^transformers2026LrSchedules] and gradient clipping bounds raw gradients rather than AdamW's adaptive update norms.[^pytorchAdamW2026]

## Save what the next update needs

An inference export saves weights, config, and tokenizer. A **resumable checkpoint** must also save AdamW's running moments ($m_t, v_t$) and step counters, LR scheduler state, global step/epoch, sampler cursor, RNG states, and FP16 loss-scaler state if used:

$$
m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,\qquad v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2
$$

Watch what happens when gradient `+2` is saved and followed by gradient `-1`: restoring AdamW's bias-corrected moments keeps moving the weight *downward* (`0.873366`), while loading the exact same weight into a fresh optimizer flips direction to `1.000000`:

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

Save at completed optimizer steps and verify resume early with a short interrupt-and-continue drill comparing step $N+1$ parameters against an uninterrupted run (matching only the first resumed loss checks identical weights before the optimizer acts).

## Pick the checkpoint that behaves

Teacher-forced validation loss measures reference-token likelihood, not whether a freely generated reply refuses destructive SQL writes. Generate held-out completions and select by a declared rule: require format pass rate $\ge 98\%$, maximize task pass rate, and use validation loss only to break ties.

<figure>
  <img src="illustrations/_generated/checkpoint_selection_gate_dark.png" alt="Three checkpoints, steps 200, 400, and 600, are rows, plotted against three aligned scales. All three clear the 0.98 format gate with 0.99, 1.00, and 0.98. Task pass rates are 0.93, 0.91, and 0.97, so step 600 wins. Validation losses are 1.91, 1.77, and 1.79, and step 400 is lowest, but loss only breaks ties." />
  <figcaption>Read across the rows. Step 400 has the best loss and the worst task score, and a team choosing by loss would ship it. The rule picks step 600.</figcaption>
</figure>

Check slices for false refusals (such as rejecting harmless `SELECT` queries because a column is named `deleted_at`) and regressions on general prompts. After exporting weights or LoRA adapters, reload the artifact with its exact tokenizer and chat template and repeat generation checks.

## Run it small before you run it big

Validate your template, loss mask, split, and evaluation on one GPU first before scaling out with FSDP or DeepSpeed ZeRO (which shard optimizer state, gradients, and weights across GPUs while leaving activation memory separate).[^pytorchFsdpDocs2025][^rajbhandari2020] When a run disappoints, check these six failure modes before sweeping learning rates:

- **Split leakage:** Did turns from the same thread, schema, or tenant cross train and validation?
- **Template or mask bugs:** Check rendered tokens, double `<BOS>`, post-truncation `-100` labels, and stop-token supervision on a real batch.
- **Misreported batch size:** Log per-device batch, accumulation steps, world size, packing mode, and active supervised tokens.
- **Broken resume:** Confirm restored optimizer moments, LR schedule, and dataloader cursor match uninterrupted step $N+1$.
- **Packing leaks:** Run the perturbation test rather than assuming reset `position_ids` built a block-causal mask.
- **Loss-only selection:** Pick checkpoints by held-out generated behavior, then verify once on the frozen final test split.

```checkpoint
One micro-batch has a single target with loss 2.0, and the next has six targets with loss 1.0 each. What is the mean of the two batch means, and what is the token mean? Which one treats every token equally?
---
The batch means are 2.0 and 1.0, so their mean is $(2.0 + 1.0)/2 = 1.5$. The token mean is $(2.0 + 6 \times 1.0)/7 \approx 1.14$, and it treats every token equally. The mean of means gives the lone token six times the weight of each token in the larger batch.
```

## Where this leaves you

You can now take a conversation through its chat template, special control tokens, assistant-only label mask, and one-position shift, pack without cross-example leaks, count supervised tokens accurately, resume without altering optimizer trajectory, and pick checkpoints by generated behavior. Next, [LoRA & Parameter-Efficient Tuning](/learn/lora-parameter-efficient-fine-tuning) shows how to adapt large models cleanly without updating every weight.

<!-- leetllm: edition:reader:end -->
