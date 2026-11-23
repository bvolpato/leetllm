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
  "shortDescription": "A fine-tuned assistant can sound fluent while breaking its instructions. Supervised fine-tuning raises the probability of the desired reply only when the loss mask, data split, and checkpoint gate measure that behavior.",
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

Conversation `conv_102` asks a SQL analytics assistant to remove test rows from an `orders` table before totaling monthly revenue. The system instruction restricts the assistant to read-only `SELECT` queries and requires refusing destructive writes. The base model replies, "Run `DELETE FROM orders WHERE status = 'test';` first, then run your revenue sum." It sounds fluent and helpful, yet it violates the read-only rule. Teaching the model to refuse writes requires tuning on accepted demonstrations and verifying whether training actually changed model behavior.

<!-- leetllm: audience:website:start -->A chat template turns conversation `conv_102` into tokens once quality gates accept the row. <span data-glossary="supervised-fine-tuning">Supervised fine-tuning (SFT)</span> uses accepted demonstrations to raise the likelihood of the desired reply through <span data-glossary="gradient">gradient</span> updates.[^huggingface2026sfttrainer][^torchtune2026firstfinetune] InstructGPT used this supervised stage before reward-model training and reinforcement learning.[^ouyang2022] Compare validation loss with held-out refusal and query accuracy when selecting a checkpoint.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->A chat template turns conversation `conv_102` into tokens. The online companion's [Synthetic Data Pipelines](/learn/synthetic-data-generation-pipelines-llms) lesson shows how a filter accepts or rejects the row before it becomes a target. <span data-glossary="supervised-fine-tuning">Supervised fine-tuning (SFT)</span> uses accepted demonstrations to raise the likelihood of the desired reply through <span data-glossary="gradient">gradient</span> updates.[^huggingface2026sfttrainer][^torchtune2026firstfinetune] InstructGPT used this supervised stage before reward-model training and reinforcement learning.[^ouyang2022] Compare validation loss with held-out refusal and query accuracy when selecting a checkpoint.<!-- leetllm: audience:book:end -->

Training loss can fall smoothly while task behavior stays broken. Prompt-dominated averages, another turn from `conv_102` leaking into validation, unintended cross-example attention, or selection by training loss can each hide the failure. Inspect the split, labels, and evaluation before starting an optimizer sweep; none of those symptoms by itself proves which step failed.

Count supervised answer tokens before launching any job. A packed row can fill every token slot in the context window while providing zero learning signal if aggressive truncation cuts off the completion and masks every remaining token to `-100`. Reject that row outright instead of pretending its context tokens represent training data.

<figure>
  <img src="illustrations/_generated/sft_pipeline_dark.png" alt="Eight token positions from conversation conv_102 in a row. Positions 0 to 4 are context tokens with label minus 100. Positions 5 to 7 are deny, write, and end, with those same tokens as labels. Arrows run from the logits at positions 4, 5, and 6 to the labels one position to their right. Only those three predictions enter the loss, and ignored prompt tokens stay in causal context." />
  <figcaption>Each target aligns with its label and the preceding logit that predicts it: deny uses logits[4], write uses logits[5], and end uses logits[6]. Prompt labels are -100; prompt representations can still affect response loss. These are symbolic positions rather than subword tokens.</figcaption>
</figure>

## Turn behavior into a run specification

The failure can hide in more than one place: the learning objective, the data split, the label mask, the token budget, the checkpoint format, or the release gate. The short CPU checks below isolate each invariant directly.

Define the behavioral target first: write requests (`DROP`, `DELETE`, `UPDATE`) must trigger a clear refusal paired with a read-only `SELECT ... WHERE` alternative. Compare in-context prompting, retrieval, and SFT before choosing an intervention. If domain SQL vocabulary itself is missing, investigate continued <span data-glossary="pretraining">pretraining</span> too.

Next, trace what each update actually sees. Which examples and <span data-glossary="token">tokens</span> contribute to the loss function? What example and supervised-token budget reaches a single optimizer step? What held-out metric dictates checkpoint selection? Finally, can the validated recipe run on a single <span data-glossary="gpu">GPU</span>, or do **Fully Sharded Data Parallel (FSDP)** or **Zero Redundancy <span data-glossary="optimizer">Optimizer</span> (ZeRO)** become necessary?

Following this order keeps the trainer where it belongs: as an execution engine applying an update. The split, mask, batch budget, resume bundle, and export gate define what that update means.

## Separate objective from parameterization

Suppose `conv_102` outputs fluent SQL prose yet keeps suggesting `DELETE` statements. Is the missing ingredient raw schema vocabulary, demonstrations of when to refuse writes, or a ranking across several acceptable queries? Answering that question separates the learning objective from the parameterization that absorbs the gradient updates.

An objective determines the mathematical signal guiding the model. A parameterization specifies which weights in the model architecture are allowed to change. They aren't interchangeable.

| Failure you observe | Objective to investigate | Why |
|---|---|---|
| Base model has weak exposure to domain vocabulary in unlabeled corpora | continued pretraining | next-token training on domain text adapts the language distribution before behavior training[^gururangan2020] |
| Model understands SQL syntax yet won't follow the read-only refusal rule | SFT | prompt-completion demonstrations directly teach that response behavior[^huggingface2026sfttrainer] |
| Several acceptable answers need ranking by preference | preference training; compare against the current model or an SFT baseline | comparisons express relative preference rather than a single target answer[^rafailov2023] |

Once the objective is SFT, make a second decision: which part of the model can carry the new behavior?

| SFT parameterization | What moves during the same supervised objective | When to test it |
|---|---|---|
| Full fine-tuning | all trainable model weights | when memory permits and adapters may be too restrictive |
| <span data-glossary="lora">LoRA</span> | small low-rank adapter matrices; base weights stay frozen | when iteration speed, memory, or many task variants matter[^hu2021] |
| QLoRA | LoRA adapters while the frozen base is stored in 4-bit form | when the base model doesn't fit comfortably at higher precision[^dettmers2023] |

LoRA and <span data-glossary="qlora">QLoRA</span> aren't alternatives to SFT. They're parameterizations usable *for an SFT run*. Continued pretraining can also use adapters. Both stages can use causal next-token cross-entropy; their training distributions and supervised targets differ. Calling every adapter run SFT would hide that distinction.

## Full weights or adapters

### Full fine-tuning

For our response-only objective, full fine-tuning updates all eligible model parameters. Test it when weights, gradients, <span data-glossary="optimizer-state">optimizer state</span>, activations, and temporary buffers fit, or when an adapter baseline appears capacity-limited. More trainable parameters permit a broader update, but don't establish better held-out behavior. Full fine-tuning doesn't require response-only labels by definition; that is a separate objective choice.

### LoRA

LoRA freezes selected base weights and trains low-rank adapter <span data-glossary="matrix">matrices</span>. Target modules and rank determine the trainable count. The original paper's GPT-3 175B comparison reported up to 10,000 times fewer trainable parameters and three times lower GPU memory requirements, not universal 99% and 70% savings.[^hu2021] Activations and frozen weights still consume memory. Measure the actual run; adapters are useful candidates when many variants share one base or full updates are too costly.

### QLoRA

QLoRA reduces frozen-base storage while retaining adapter updates. Its paper uses 4-bit NormalFloat (NF4), quantized scaling constants, and paged optimizers. The base weights are dequantized to a computation dtype such as <span data-glossary="bf16">BF16</span> for forward and backward operations; adapter gradients don't mean the stored 4-bit base receives weight updates.[^dettmers2023] Check your implementation's storage, compute, and adapter dtypes separately. Compare held-out behavior under measured memory and time budgets.

## Reject broken demonstrations before training

For this pipeline, store a prompt, a desired completion, and a group key for <span data-glossary="feature-leakage">leakage</span>-resistant splitting on every SFT row. A missing completion isn't harmless metadata: it's a training example with no answer to teach.

The validator below checks three candidate rows: `conv_102` has both a completion and a group key, `conv_550` has an empty completion, and the third row omits `thread_id`. Only `conv_102` survives filtering to reach tokenization.

<!-- leetllm: test, output=show, output_title="Row schema check output" -->

```python title="validate_sft_rows.py"
rows = [
    {"thread_id": "conv_102", "prompt": "Drop test orders", "completion": "Refuse writes; use SELECT with a WHERE filter instead."},
    {"thread_id": "conv_550", "prompt": "Truncate temp table", "completion": ""},
    {"prompt": "Sum monthly revenue", "completion": "SELECT SUM(amount) FROM orders;"},
]

required = {"thread_id", "prompt", "completion"}
accepted, rejected = [], []
for index, row in enumerate(rows):
    missing = sorted(required - row.keys())
    if missing:
        rejected.append((index, f"missing {missing}"))
    elif any(not isinstance(row[key], str) or not row[key].strip() for key in required):
        rejected.append((index, "required fields must be nonempty strings"))
    else:
        accepted.append(row)

print("accepted_threads=", [row["thread_id"] for row in accepted])
print("rejected=", rejected)
```

<!-- leetllm: output:start -->
```text title="Row schema check output" output compact
accepted_threads= ['conv_102']
rejected= [(1, 'required fields must be nonempty strings'), (2, "missing ['thread_id']")]
```
<!-- leetllm: output:end -->

This validation rule filters out broken inputs before tokenization: `conv_102` passes, `conv_550` is rejected rather than turning into a prompt-only row, and the third row is dropped before it can break a grouped split. Next, keep accepted rows from the same deployment unit together.

## Split by the unit that could leak

Before formatting rows, reserve evaluation examples that training can't imitate through near duplicates. For a SQL assistant, several turns from one multi-turn conversation or multiple queries over the same database schema share column names and table relationships. Randomly splitting individual messages can put one turn of the same session in training and another in evaluation.

Group by the unit your evaluation claim requires to be unseen: conversation thread, schema, tenant, or time window. Low token overlap doesn't make two turns from `conv_102` independent. If several group identifiers connect conversations, keep their connected groups together. For a chronological holdout, train on earlier periods and check windows that straddle the cutoff. The check below demonstrates conversation-level separation only.

Choose the grouping from the deployment claim. Thread grouping tests new conversations, not unseen tenants or database schemas shared across those conversations. Deduplicate across groups, and reserve separate validation and final-test groups. Use validation for sweeps and checkpoint selection; inspect the final test only after freezing that choice. Repeatedly tuning on the test turns it into another validation set.

Holding out `conv_551` keeps `conv_102` and `conv_771` together in training while leaving the split intersection empty:

<!-- leetllm: test, output=show, output_title="Grouped split output" -->

```python title="grouped_sft_split.py"
rows = [
    {"case_id": "conv_102", "turn": 1, "answer": "Refuse writes; use SELECT with a WHERE filter instead."},
    {"case_id": "conv_102", "turn": 2, "answer": "Keep queries read-only by filtering status != 'test'."},
    {"case_id": "conv_551", "turn": 1, "answer": "Deny UPDATE and suggest a projection query."},
    {"case_id": "conv_771", "turn": 1, "answer": "Aggregate revenue with SELECT SUM(total)."},
]

eval_cases = {"conv_551"}
train = [row for row in rows if row["case_id"] not in eval_cases]
evaluation = [row for row in rows if row["case_id"] in eval_cases]

train_cases = {row["case_id"] for row in train}
held_out_cases = {row["case_id"] for row in evaluation}
assert train_cases.isdisjoint(held_out_cases)

print("train_cases=", sorted(train_cases))
print("eval_cases=", sorted(held_out_cases))
print("case_overlap=", train_cases & held_out_cases)
```

<!-- leetllm: output:start -->
```text title="Grouped split output" output compact
train_cases= ['conv_102', 'conv_771']
eval_cases= ['conv_551']
case_overlap= set()
```
<!-- leetllm: output:end -->

```checkpoint
Two turns from conversation `conv_102` have different wording. Can one train and the other evaluate if their token overlap is low?
---
No. They share the conversation being held out, so both turns stay in the same split. Group by schema or tenant when the evaluation needs to estimate performance on unseen schemas or tenants.
```

## Data path: template, tokenize, label, pack

Follow one row all the way through the data path. Structured conversation dictionaries must pass through a Jinja2 <span data-glossary="chat-template">chat template</span>, undergo <span data-glossary="tokenization">tokenization</span>, receive target label masks, and either get packed into fixed-length blocks or padded into batches.

Use the checkpoint's actual chat formatting. ChatML-style markers such as `<|im_start|>` aren't universal; templates can mix special IDs with ordinary text, spaces, or newlines. Subword splitting doesn't by itself prove a broken role delimiter. Inspect the rendered template, its token IDs, and assistant masks together rather than registering invented markers and assuming the pretrained model understands them.[^huggingface2026writingchattemplates]

For complete training conversations, use `add_generation_prompt=False`. To start a new assistant reply, `add_generation_prompt=True` adds a header when the template supports it; continuing a partial assistant message is a different operation. Align the template's turn terminator with serving stop settings. Missing terminators can weaken stopping supervision, but don't prove inevitable endless generation. If you format text first and tokenize later, avoid adding duplicate special tokens.[^huggingface2026chattemplates]

Version this entire data path together. Delimiter, whitespace, or template changes can alter token IDs or labels. Record the change and rerun batch checks; previous runs remain evidence about their recorded formatting.

Only the target answer and turn terminator in `conv_102` should receive cross-entropy loss, while the system instruction, user request, and delimiter tokens stay visible in attention so the reply can condition on them. Setting ignored positions to `-100` uses the default `ignore_index` in <span data-glossary="pytorch">PyTorch</span> <span data-glossary="cross-entropy">cross-entropy</span> loss:

<!-- leetllm: test, output=show, output_title="Loss mask output" -->

```python title="sft_loss_mask.py"
IGNORE_INDEX = -100

tokens = [
    ("prefix", "<system>"),
    ("prefix", "Read-only SQL mode."),
    ("prefix", "<user>"),
    ("prefix", "Drop test orders before totaling."),
    ("prefix", "<assistant>"),
    ("target", "Refuse writes; use SELECT with a WHERE filter instead."),
    ("target", "<end_of_turn>"),
]

labels = [
    token if span == "target" else IGNORE_INDEX
    for span, token in tokens
]

supervised = [
    token
    for (_, token), label in zip(tokens, labels)
    if label != IGNORE_INDEX
]
print("supervised_tokens=", supervised)
print("masked_positions=", sum(label == IGNORE_INDEX for label in labels))
```

<!-- leetllm: output:start -->
```text title="Loss mask output" output compact
supervised_tokens= ['Refuse writes; use SELECT with a WHERE filter instead.', '<end_of_turn>']
masked_positions= 5
```
<!-- leetllm: output:end -->

These seven entries are readable spans rather than real subword token IDs. A real sentence expands into multiple integer IDs. The five prefix spans provide context without generating loss; the answer and terminator spans identify what to label after tokenization.

Causal language models shift targets by one position: logits at position $t-1$ predict the label at position $t$. The hidden state at the assistant marker `<assistant>` predicts the first answer token. Setting a label to `-100` removes that token's direct cross-entropy loss, but it doesn't remove gradients flowing through attention layers into earlier prompt representations. Response loss still updates the weights that process the prompt. Mask padding tokens by position, not by blindly masking every EOS ID when EOS doubles as padding.[^pytorchCrossEntropy2026]

Don't confuse the label mask with the attention mask. The label mask decides which positions contribute to the loss scalar. The attention mask decides which earlier positions a token can read during the forward pass. Prompt tokens must remain visible as context even when their labels are `-100`; packed sequences also need segment isolation so adjacent examples can't attend across one another.

The CPU check below uses real integer labels and PyTorch gradients. With all logits set to zero over a four-token vocabulary, each supervised target has cross-entropy loss $\log 4 \approx 1.3863$. Only logit rows 1 and 2 predict the labeled answer and stop positions. Most training frameworks handle this target shift internally; don't shift labels twice.

<!-- leetllm: test, deps=torch, output=show, output_title="Shifted target check" -->

```python title="shifted_sft_targets.py"
import math
import torch
import torch.nn.functional as F

# Positions: prompt, assistant marker, answer, stop.
labels = torch.tensor([-100, -100, 2, 3])
logits = torch.zeros(4, 4, dtype=torch.float64, requires_grad=True)
targets = labels[1:]
assert (targets != -100).any(), "Reject an all-ignored target batch"
loss = F.cross_entropy(logits[:-1], targets, ignore_index=-100)
loss.backward()
active_rows = torch.nonzero(logits.grad.abs().sum(dim=1)).flatten().tolist()
assert active_rows == [1, 2]
assert math.isclose(loss.item(), math.log(4))
assert (torch.full_like(targets, -100) != -100).sum().item() == 0
print("logit_rows_with_direct_loss=", active_rows)
print(f"mean_target_loss={loss.item():.6f}")
```

<!-- leetllm: output:start -->
```text title="Shifted target check" output compact
logit_rows_with_direct_loss= [1, 2]
mean_target_loss=1.386294
```
<!-- leetllm: output:end -->

This verifies shifted loss and direct logit gradients. Test those mechanisms on collated tensors before launching long GPU jobs.

Why mask prompt targets here? We want a response-only objective and a metric that measures the response. With 800 scored prompt positions and 30 response positions, prompt targets occupy about 96% of a full-sequence mean's terms. That isn't 96% of the gradient: individual losses and their parameter derivatives can differ greatly. Nor does full-sequence training inevitably cause echoing or degraded style.

Huerta-Enochian and Ko studied prompt-loss weights using LLaMA 1/2 7B and Alpaca-derived datasets. Fractional weights improved some short-completion benchmarks in that setting; the study attributed the effect to regularization.[^huertaEnochian2024PromptLoss] Response-only masking is this run's deliberate choice. Compare objectives on the same held-out tasks before changing it.

Low-loss prompt tokens lower the full-sequence average below without changing answer quality:

<!-- leetllm: test, output=show, output_title="Response-only loss output" -->

```python title="response_only_loss.py"
prefix_losses = [0.03, 0.04, 0.02, 0.05, 0.03]
answer_losses = [2.20, 1.80]

full_sequence_loss = sum(prefix_losses + answer_losses) / len(prefix_losses + answer_losses)
response_only_loss = sum(answer_losses) / len(answer_losses)

print(f"full_sequence_loss={full_sequence_loss:.3f}")
print(f"response_only_loss={response_only_loss:.3f}")
assert response_only_loss > full_sequence_loss
```

<!-- leetllm: output:start -->
```text title="Response-only loss output" output compact
full_sequence_loss=0.596
response_only_loss=2.000
```
<!-- leetllm: output:end -->

Both numbers measure token-level cross-entropy over different target sets. With five low-loss prefix positions, the combined average drops to $0.596$ while answer loss remains $2.000$. For our response-only objective, the loss is mean negative log-likelihood over the labeled target set $T$:

$$
\mathcal{L}_{\text{SFT}}(\theta) = -\frac{1}{|T|}\sum_{t \in T} \log p_\theta(y_t \mid y_{<t})
$$

$\theta$ represents the trainable parameters, $y_t$ the target token, and $y_{<t}$ its available prefix. Here $T$ has two positions. Default unweighted, mean-reduced PyTorch cross-entropy with `ignore_index=-100` averages only active targets. Changing the mask changes the objective; compare separately reported response loss rather than treating lower full-sequence loss as evidence of better answers.

You rarely write this mask by hand, but check which format you loaded. As of TRL 1.17, `SFTTrainer` uses completion-only loss by default for prompt-completion datasets. A plain `messages` dataset scores the full sequence unless you set `assistant_only_loss=True`, which needs generation markers in the chat template. TRL can patch those in for known model families.[^huggingface2026sfttrainer] Always inspect a tokenized batch before launching training: confirm that only answer and stop tokens carry non-`-100` labels.

Inspect masks after truncation and causal shifting. Keeping only the start can remove the completion. A mean-reduced PyTorch cross-entropy batch with no active shifted targets returns NaN; an individual empty row in a mixed batch instead adds context and cost without response supervision. Count dropped or empty rows so dataset loss isn't hidden.

As of TRL 1.17, [TRL's preparation path](https://github.com/huggingface/trl/blob/v1.17.1/trl/trainer/sft_trainer.py) filters fully masked rows after nonpacked truncation. Its packing path needs a separate audit.[^trl2026SftV117] Custom collators or skipped preparation can change this behavior. Check active labels in the actual collated tensors rather than assuming every empty row reaches the loss.

When sequence packing is active, this truncation step is skipped and overflow is handled by the packing strategy instead; `bfd` discards overflow tokens.[^huggingfaceTrlPacking2026] When five prompt tokens consume the length budget, the completion vanishes and the row must be rejected:

<!-- leetllm: test, output=show, output_title="Truncation guard output" -->

```python title="reject_truncated_completion.py"
IGNORE_INDEX = -100

prompt_tokens = ["<system>", "sql", "<user>", "drop_orders", "<assistant>"]
answer_tokens = ["deny_write", "<end_of_turn>"]
max_length = 5

kept_tokens = (prompt_tokens + answer_tokens)[:max_length]
labels = [
    token if position >= len(prompt_tokens) else IGNORE_INDEX
    for position, token in enumerate(kept_tokens)
]
has_answer_label = any(label != IGNORE_INDEX for label in labels)

# A label at position zero has no preceding logit in this isolated sequence.
first_only_labels = [7, IGNORE_INDEX]
has_shifted_target = any(label != IGNORE_INDEX for label in first_only_labels[1:])
assert any(label != IGNORE_INDEX for label in first_only_labels)
assert not has_shifted_target

print("kept_tokens=", kept_tokens)
print("has_answer_label=", has_answer_label)
print("decision=", "keep" if has_answer_label else "reject_or_increase_max_length")
print("first_position_label_has_shifted_target=", has_shifted_target)
```

<!-- leetllm: output:start -->
```text title="Truncation guard output" output compact
kept_tokens= ['<system>', 'sql', '<user>', 'drop_orders', '<assistant>']
has_answer_label= False
decision= reject_or_increase_max_length
first_position_label_has_shifted_target= False
```
<!-- leetllm: output:end -->

## Pack short examples while isolating segments

Short demonstrations can leave many unused token slots when padded to a large fixed length. The fraction of padded slots isn't a measured compute-waste percentage: dynamic batch padding, length grouping, and attention kernels change the work performed. Packing is another efficiency option. For this run's independent-example objective, isolate attention and loss labels between packed examples.

For independent demonstrations, a reply for `Ex B` (`conv_551`) shouldn't condition on `Ex A` (`conv_102`) merely because the loader put them in one block. Position IDs block attention only if something turns them into a mask. As of Transformers 5.22, models that use its shared causal-mask helper, such as Llama, do that under eager and SDPA attention when you restart the IDs at each example, pass no attention mask, and run with `use_cache=False`. An all-ones mask or a live cache silently removes the isolation, so set `use_cache=False` in a hand-written loop. `Trainer` and gradient checkpointing already turn the cache off during training.[^transformers2026MaskingV522][^transformers2026TrainerV522] Otherwise, enforce a causal block-diagonal pattern using an explicit mask or a kernel's segment metadata. The predicate below describes the intended edges; it doesn't execute an attention kernel:

<!-- leetllm: test, output=show, output_title="Packed isolation output" -->

```python title="packed_isolation_check.py"
segments = [
    ["Ex A prompt", "Ex A response", "<eos>"],
    ["Ex B prompt", "Ex B response", "<eos>"],
]

flat = [(sequence_id, token) for sequence_id, row in enumerate(segments) for token in row]
position_ids = [position for row in segments for position, _ in enumerate(row)]

def may_attend(query_index, key_index):
    query_sequence, _ = flat[query_index]
    key_sequence, _ = flat[key_index]
    return key_index <= query_index and query_sequence == key_sequence

ex_b_response = 4
assert position_ids == [0, 1, 2, 0, 1, 2]
assert not may_attend(ex_b_response, 1)
print("position_ids=", position_ids)
print("Ex_B_response_sees_Ex_A_response=", may_attend(ex_b_response, 1))
```

<!-- leetllm: output:start -->
```text title="Packed isolation output" output compact
position_ids= [0, 1, 2, 0, 1, 2]
Ex_B_response_sees_Ex_A_response= False
```
<!-- leetllm: output:end -->

Reset position IDs isolate examples only when the attention path turns them into a segment mask, as described above. The kernel must enforce that separation during computation. Resetting positions with no segment mask in the kernel causes cross-example contamination:

<!-- leetllm: audience:website:start --><figure>
  <img src="illustrations/_generated/packed_attention_boundaries_dark.png" alt="Two six-by-six attention masks for packed examples Ex A and Ex B, whose position IDs each reset to 0, 1, and 2. The block-causal mask lets Ex B's response at query 4 read only its own values 10 and 20, whose uniform mean is 15.0. Adding 100 to Ex A's values leaves the isolated output at 15.0; ordinary global causal attention leaks those earlier values and shifts its output from 7.2 to 67.2." />
  <figcaption>Gold dividers separate Ex A and Ex B. The Ex B query at index 4 reads keys 3 and 4, whose values average to 15.0.</figcaption>
</figure><!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start --><figure>
  <img src="illustrations/_generated/packed_attention_boundaries_dark.png" alt="Two six-by-six attention masks for packed examples Ex A and Ex B, whose position IDs each reset to 0, 1, and 2. The block-causal mask lets Ex B's response at query 4 read only its own values 10 and 20, whose uniform mean is 15.0. Adding 100 to Ex A's values leaves the isolated output at 15.0; ordinary global causal attention leaks those earlier values and shifts its output from 7.2 to 67.2." />
  <figcaption>Gold dividers separate Ex A and Ex B. The Ex B query at index 4 reads keys 3 and 4, whose values average to 15.0.</figcaption>
</figure><!-- leetllm: audience:book:end -->


| Index | Token | position_id | Intended attend-to | Broken path (no segment mask) |
|---|---|---:|---|---|
| 0 | Ex A prompt | 0 | Ex A only | Ex A only |
| 1 | Ex A response | 1 | Ex A only | Ex A only |
| 2 | Ex A eos | 2 | Ex A only | Ex A only |
| 3 | Ex B prompt | 0 | Ex B only | Ex A + Ex B (cross-example leak) |
| 4 | Ex B response | 1 | Ex B only | Ex A + Ex B (Ex B answer conditions on Ex A) |
| 5 | Ex B eos | 2 | Ex B only | Ex A + Ex B |

Test the effect inside an actual attention operation, too. With zero queries and keys in PyTorch's scaled dot-product attention, weights are uniform over permitted positions. Ex B's response sits at index 4. Changing only Ex A's three values leaves Ex B unchanged under a block mask and shifts it under global causal attention. PyTorch SDPA Boolean masks use `True` for permitted edges.[^pytorchSdpaDocs2026]

<!-- leetllm: test, deps=torch, output=show, output_title="Packed attention perturbation" -->

```python title="test_packed_attention_isolation.py"
import torch
import torch.nn.functional as F

segment_ids = torch.tensor([0, 0, 0, 1, 1, 1])
causal = torch.ones(6, 6, dtype=torch.bool).tril()
isolated = causal & (segment_ids[:, None] == segment_ids[None, :])
queries = keys = torch.zeros(1, 1, 6, 1, dtype=torch.float64)
values = torch.tensor([1., 2., 3., 10., 20., 30.], dtype=torch.float64).view(1, 1, 6, 1)
changed = values.clone()
changed[:, :, :3] += 100

def ex_b_output(mask, value):
    return F.scaled_dot_product_attention(
        queries, keys, value, attn_mask=mask, dropout_p=0.0,
    )[0, 0, 4, 0].item()

before = ex_b_output(isolated, values)
after = ex_b_output(isolated, changed)
leaking = ex_b_output(causal, values)
leaking_after = ex_b_output(causal, changed)
assert before == after == 15.0
assert abs(leaking - 7.2) < 1e-12
assert abs(leaking_after - 67.2) < 1e-12
print(f"Isolated Ex B: {before:.1f} -> {after:.1f}")
print(f"Global causal Ex B: {leaking:.1f} -> {leaking_after:.1f}")
```

<!-- leetllm: output:start -->
```text title="Packed attention perturbation" output compact
Isolated Ex B: 15.0 -> 15.0
Global causal Ex B: 7.2 -> 67.2
```
<!-- leetllm: output:end -->

Ex B averages its own values 10 and 20 to obtain 15.0. Global attention averages all five earlier-or-current values to obtain 7.2; adding 100 to three of them increases the result by 60.0. Apply the same perturbation test to the collated model path with dropout disabled, alongside checking segment-start labels.

Packing can also fail when an example gets truncated before being packed. If `Ex A` survives truncation with every response token stripped away, packing still incorporates the prefix to fill the block, but that segment contributes zero learning signal. Inspect segment counts and verify nonzero answer labels before starting a training run.

TRL's `bfd` packs examples after truncating overlong ones; `bfd_split` splits overlong sequences into chunks; `wrapped` concatenates a stream and cuts token sequences.[^huggingfaceTrlPacking2026] Preserving stored tokens through splitting doesn't preserve every completion's original prompt context or every trainable target. Choose the strategy from the learning objective, then inspect the resulting segments.

As of TRL 1.17, the trainer enables padding-free mode for both `bfd` and `bfd_split`. `wrapped` does not enable padding-free mode by default; its continuous stream merges neighboring segments unless you switch collators, allowing examples to read each other and scoring cross-example joins.[^trl2026SftV117] Releases before 1.16 also warned when the attention implementation wasn't a FlashAttention variant. That warning is gone, so don't wait for one.[^trl2026Pr7620] An ordinary global causal kernel can read across examples. Disable packing while debugging if necessary; verify isolation directly rather than trusting a missing warning or a completed forward pass.

Attention isolation alone also isn't enough. A globally shifted loss must not ask the last token of one independent segment to predict the first token of the next. As of TRL 1.17, the padding-free collator masks labels wherever segment position IDs reset to zero.[^trl2026SftV117] Audit that loss isolation as well as attention isolation.

Packing changes loader-item counts and can remove or split targets. A fixed `max_steps` can therefore imply a different number of data passes, without proving overfitting. Log processed input tokens, active shifted targets, and retained original examples. Throughput and learning exposure use different denominators.

```checkpoint
A packed batch resets position IDs for Ex B, but Ex B's response can still attend to Ex A. Is the packing path correct?
---
No. Reset positions isolate examples only when the attention path turns them into a segment mask, and here it evidently doesn't. The attention implementation must honor segment isolation, and shifted labels must retain the intended answer targets without creating a target across adjacent examples.
```

## Evaluate hyperparameters through controlled experiments

A learning-rate sweep asks how much change this objective and parameterization can tolerate. Check task improvement and regressions on general capabilities together. Neither a frozen base nor a small learning rate guarantees preserved behavior.

The fragment below uses `1e-4` as an adapter candidate. That isn't a universal safe range or a fixed multiplier over full fine-tuning. Compare nearby rates under the same data exposure and evaluation rules. Dataset quality, optimizer, adapter scaling, model size, and loss normalization across microbatches all affect the result.

| Knob | Baseline to test | What decides whether it survives |
|---|---|---|
| <span data-glossary="learning-rate">Learning rate</span> | a short sweep for the actual update surface | held-out task gains and regressions at matched exposure |
| Schedule | explicit warmup duration, decay shape, and final LR | observed early updates and behavior at the chosen checkpoint |
| Passes over data | a bounded pilot with measured retained targets | validation trends and task behavior, not a fixed epoch ceiling |
| Regularization & clipping | record decay groups and clipping threshold | compare changes in gradients, parameter updates, and held-out behavior |
| Precision | BF16 where supported; otherwise choose an explicit path | finite numerics and task parity under the actual hardware |

Warmup reduces early step sizes; it doesn't make AdamW's bias correction unnecessary or guarantee stability. A useful historical counterexample is InstructGPT's standalone SFT baseline: 16 epochs, no warmup, and cosine decay to 10% of its initial LR, with learning rates and epochs selected by searches.[^ouyang2022] That recipe isn't a recommendation to copy 16 epochs. It disproves a mandatory 3%-10% warmup or 1-3 epoch rule.

A cosine schedule's floor is configurable; standard Transformers cosine warmup decays to zero, while a minimum-LR variant can use a nonzero floor.[^transformers2026LrSchedules] Resolve the actual scheduler instead of assuming 10%. AdamW applies decoupled decay separately from moment estimation. Decay doesn't bound distance from the pretrained weights, and clipping raw gradients doesn't directly bound AdamW's parameter update.[^pytorchAdamW2026] Inspect both gradients and update norms.

## Effective batch size is also a token budget

The batch size configured on a single device isn't the batch size the optimizer sees during an update step. For synchronous training across complete accumulation windows, the number of items per update follows:

```text
loader_items_per_update = per_device_batch * gradient_accumulation_steps * world_size
```

Without packing, a loader item is one demonstration. With packing, each item is a composite block containing multiple short demonstrations, so the formula counts packed blocks rather than raw examples. Track both raw examples and actual supervised tokens per update. The CPU check below models an unpacked dataset across a four-GPU setup:

<!-- leetllm: test, output=show, output_title="Effective batch output" -->

```python title="sft_effective_batch.py"
per_device_batch = 4
grad_accum = 8
world_size = 4
examples_per_update = per_device_batch * grad_accum * world_size

supervised_tokens_per_microbatch_on_one_rank = [180, 212, 164, 220, 198, 204, 175, 207]
supervised_tokens_per_update = sum(supervised_tokens_per_microbatch_on_one_rank) * world_size

print(f"examples_per_update={examples_per_update}")
print(f"supervised_tokens_per_update={supervised_tokens_per_update}")
```

<!-- leetllm: output:start -->
```text title="Effective batch output" output compact
examples_per_update=128
supervised_tokens_per_update=6240
```
<!-- leetllm: output:end -->

Always calculate the combined impact of batch changes rather than reasoning about single knobs. Notice how doubling world size or accumulation doubles the update volume:

<!-- leetllm: test, output=show, output_title="Run comparison output" -->

```python title="compare_update_sizes.py"
def examples_per_update(per_device_batch, accumulation, world_size):
    return per_device_batch * accumulation * world_size

run_a = examples_per_update(4, 8, 4)
run_b = examples_per_update(2, 16, 8)

print("run_a_examples_per_update=", run_a)
print("run_b_examples_per_update=", run_b)
print("ratio_b_over_a=", run_b / run_a)
assert run_b == 2 * run_a
```

<!-- leetllm: output:start -->
```text title="Run comparison output" output compact
run_a_examples_per_update= 128
run_b_examples_per_update= 256
ratio_b_over_a= 2.0
```
<!-- leetllm: output:end -->

When sharing batch configurations, specify accumulation steps, world size, sequence packing mode, and supervised token counts.

Loss weighting across accumulation steps matters as well. Suppose one microbatch has one target loss of 4.0 and another has nine target losses of 1.0 each. Averaging batch means gives 2.5; the token mean is $(4.0+9.0)/10=1.3$. Equal example weights and equal token weights are different objectives. For the token mean, normalize loss sums by active shifted targets across the complete update window.

<!-- leetllm: test, output=show, output_title="Token-weighted accumulation" -->

```python title="token_weighted_accumulation.py"
microbatches = [[4.0], [1.0] * 9]
mean_of_means = sum(sum(batch) / len(batch) for batch in microbatches) / len(microbatches)
token_mean = sum(map(sum, microbatches)) / sum(map(len, microbatches))
assert mean_of_means == 2.5 and token_mean == 1.3
print(f"mean_of_means={mean_of_means:.1f}; token_mean={token_mean:.1f}")
```

<!-- leetllm: output:start -->
```text title="Token-weighted accumulation" output compact
mean_of_means=2.5; token_mean=1.3
```
<!-- leetllm: output:end -->

In ordinary distributed data parallel training, rank gradients are averaged. If each rank divides its local loss sum by a globally summed token count, that averaging introduces another factor of `world_size`. Compensate for it, or use a trainer that performs the normalization correctly. Don't add the factor twice when the trainer already handles it. Unequal target counts, partial accumulation windows, and actual loss gradients still need checks beyond this scalar calculation.

## What a resumable run must save

A `model.safetensors` file doesn't encode the optimizer history or next data batch. It may be part of an inference artifact, but serving also needs compatible architecture and tokenization. An adapter export additionally needs its base model and adapter configuration.

To reconstruct the continuation, retain the state your recipe actually uses:

- model weights or LoRA adapter weights
- optimizer state (AdamW first moment $m_t$, second moment $v_t$, and step counters)
- scheduler state (step counter, warmup phase, decay multiplier)
- global step and completed epoch indices
- sampler progress and random generator states, not only original seeds
- tokenizer revision and chat-template hash
- resolved training configuration and dataset manifests
- best validation metric achieved so far
- loss-scaler state if using FP16 dynamic scaling, plus any other stateful training machinery

Optimizer history determines direction and scaling. Scheduler progress determines the next LR, which does not automatically match the peak if reset incorrectly. Sampler and generator states determine upcoming data and randomness. Preserve the exact tokenizer/template artifacts and the adapter's base revision. Metadata labels or filenames alone don't guarantee identical contents or complete worker state.

For ordinary AdamW without AMSGrad, the update uses newly computed, bias-corrected moments:

$$
m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,\qquad v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2
$$

$$
\widehat m_t=\frac{m_t}{1-\beta_1^t},\qquad \widehat v_t=\frac{v_t}{1-\beta_2^t}
$$

$$
\theta_t=(1-\eta_t\lambda)\theta_{t-1}-\eta_t\frac{\widehat m_t}{\sqrt{\widehat v_t}+\epsilon}
$$

Here $g_t$ is the current gradient and squaring is elementwise. A fresh optimizer with nonzero $g_1$ first computes $\widehat m_1=g_1$ and $\widehat v_1=g_1^2$. Its update doesn't divide the current gradient by epsilon alone. Dropping state changes the trajectory, but doesn't imply a mandatory spike.[^pytorchAdamW2026]

Applying gradient `2.0` followed by `-1.0` exposes how history controls direction: a fresh AdamW step follows the negative gradient upward, while retained positive momentum still moves the weight downward:

<!-- leetllm: test, deps=torch, output=show, output_title="Actual AdamW continuation" -->

```python title="resume_actual_adamw.py"
import copy
import math
import torch

weight = torch.nn.Parameter(torch.tensor(1.0, dtype=torch.float64))
optimizer = torch.optim.AdamW([weight], lr=0.1, weight_decay=0.0)

def update(parameter, opt, gradient):
    opt.zero_grad(set_to_none=True)
    parameter.grad = torch.tensor(gradient, dtype=torch.float64)
    opt.step()

update(weight, optimizer, 2.0)
saved_weight = weight.detach().clone()
saved_optimizer = copy.deepcopy(optimizer.state_dict())
update(weight, optimizer, -1.0)

resumed = torch.nn.Parameter(saved_weight.clone())
resumed_optimizer = torch.optim.AdamW([resumed], lr=0.1, weight_decay=0.0)
resumed_optimizer.load_state_dict(saved_optimizer)
update(resumed, resumed_optimizer, -1.0)

fresh = torch.nn.Parameter(saved_weight.clone())
fresh_optimizer = torch.optim.AdamW([fresh], lr=0.1, weight_decay=0.0)
update(fresh, fresh_optimizer, -1.0)
assert torch.equal(resumed, weight)
assert resumed.item() < saved_weight.item() < fresh.item()
assert math.isclose(fresh.item() - saved_weight.item(), 0.1, abs_tol=1e-8)
print(f"uninterrupted={weight.item():.6f}; resumed={resumed.item():.6f}")
print(f"fresh_optimizer={fresh.item():.6f}; all_finite={bool(torch.isfinite(fresh))}")
```

<!-- leetllm: output:start -->
```text title="Actual AdamW continuation" output compact
uninterrupted=0.873366; resumed=0.873366
fresh_optimizer=1.000000; all_finite=True
```
<!-- leetllm: output:end -->

This controlled CPU run restores optimizer history while applying the same next gradient; it does not replay a stochastic LLM job. Prefer saving at completed optimizer steps. Mid-accumulation continuation also needs partial gradients and microbatch progress. Compare the next batch, LR, loss, and update against an uninterrupted reference. Bitwise parity depends on deterministic operations and a compatible environment.[^pytorchSavingLoading2026][^deepspeedUniversalCheckpointing2026]

<figure>
  <img src="illustrations/_generated/resume_checkpoint_stack_dark.png" alt="In a controlled PyTorch AdamW check, gradient +2 moves weight 1.000000 to 0.900000 and stores first and second moments 0.200000 and 0.004000 at step 1. With the same next gradient -1 and learning rate 0.1, restoring those moments yields 0.873366; loading the weight into a fresh optimizer yields 1.000000. The CPU check isolates optimizer history; full continuation also needs scheduler, sampler, RNG, and artifact identity." />
  <figcaption>Restoring AdamW moments continues the saved parameter along the uninterrupted CPU path. The comparison holds the next gradient and recipe fixed; full training also needs scheduler, sampler, RNG and artifact identity.</figcaption>
</figure>

<!-- leetllm: audience:website:start -->The simpler SGD-with-momentum check below isolates the same dependency: restoring velocity gives a next weight of 0.52; resetting it gives 0.70. The difference is 0.18, about 34.6% of 0.52. These are scalar update values rather than an AdamW variance calculation or a full-run loss curve.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->The simpler SGD-with-momentum check below isolates the same dependency: restoring velocity gives a next weight of 0.52; resetting it gives 0.70. The difference is 0.18, about 34.6% of 0.52. These are scalar update values rather than an AdamW variance calculation or a full-run loss curve.<!-- leetllm: audience:book:end -->

A manifest lists required continuation artifacts. This schema check verifies key presence only without opening files or validating hashes:

<!-- leetllm: test, output=show, output_title="Checkpoint manifest output" -->

```python title="resume_bundle_manifest_check.py"
required = {
    "model_state",
    "optimizer_state",
    "scheduler_state",
    "global_step",
    "rng_state",
    "sampler_state",
    "tokenizer_version",
    "chat_template_version",
    "data_manifest",
    "training_config",
    "eval_manifest",
    "best_metric",
}

resume_bundle = {
    "model_state": "weights/step_600.safetensors",
    "optimizer_state": "optimizer/step_600.pt",
    "scheduler_state": "scheduler/step_600.pt",
    "global_step": 600,
    "rng_state": "rng/step_600.pt",
    "sampler_state": {"epoch": 1, "batches_consumed": 120},
    "tokenizer_version": "sql-sft-tokenizer-v3",
    "chat_template_version": "llama3-sql-chat-v2",
    "data_manifest": "data/sft_manifest_2026-05-20.json",
    "training_config": "config/resolved_training.json",
    "eval_manifest": "eval/sql_read_only_behavior_v4.json",
    "best_metric": {"name": "task_pass_rate", "value": 0.97},
}

missing = sorted(required - resume_bundle.keys())
print("schema_complete=", not missing)
print("best_metric=", resume_bundle["best_metric"])
```

<!-- leetllm: output:start -->
```text title="Checkpoint manifest output" output compact
schema_complete= True
best_metric= {'name': 'task_pass_rate', 'value': 0.97}
```
<!-- leetllm: output:end -->

```checkpoint
A resumed run reloads model weights and global step but not optimizer, scheduler, sampler, or tokenizer-template versions. Can its next metrics be compared as uninterrupted continuation?
---
No. The next update may use different momentum, learning rate, data position, randomness, or token formatting. Treat it as a new run unless the complete resume manifest is restored and validated.
```

The scalar SGD-with-momentum example below makes the dependency on velocity explicit. Its fixed next gradient isolates optimizer state; no training data or model loss is evaluated:

<!-- leetllm: test, output=show, output_title="Resume next-update check" -->

```python title="resume_next_update.py"
import json

def step(state, gradient):
    velocity = 0.9 * state["velocity"] + gradient
    return {"weight": state["weight"] - 0.1 * velocity,
            "velocity": velocity, "step": state["step"] + 1}

saved = step({"weight": 1.0, "velocity": 0.0, "step": 0}, 2.0)
reference = step(saved, 1.0)
restored = json.loads(json.dumps(saved))
resumed = step(restored, 1.0)
weights_only = step({**restored, "velocity": 0.0}, 1.0)
assert resumed == reference and weights_only != reference
print(f"uninterrupted={reference['weight']:.2f}; resumed={resumed['weight']:.2f}")
print(f"reset_momentum={weights_only['weight']:.2f}")
```

<!-- leetllm: output:start -->
```text title="Resume next-update check" output compact
uninterrupted=0.52; resumed=0.52
reset_momentum=0.70
```
<!-- leetllm: output:end -->

## Choosing the best checkpoint

Choose checkpoints against the deployment objective on validation data. Teacher-forced loss measures likelihood of reference tokens given reference prefixes; it doesn't directly measure whether a freely generated reply refuses unsafe SQL writes while answering read-only queries. Generate outputs for task evaluation too, and keep a final test separate from repeated selection.

Unreliable selection criteria:

- lowest training loss alone (doesn't measure unseen-case performance)
- latest training step (risks overfitting or late degradation)
- file size or raw token count

Rigorous selection criteria:

- strict syntax and format pass rate (JSON schema compliance, valid SQL function-call formatting)
- task pass rate on held-out cases via deterministic query-parser checks or calibrated judges
- human evaluation on blinded, randomized completion pairs
- validation loss with a declared role in selection, rather than an assumed universal priority

In the validation table below, require format validity of at least 98%, then maximize task pass rate and break ties with validation loss, followed by the earlier step. In a real evaluation, report denominators, uncertainty, important failure slices, and regressions on general behavior.


<!-- leetllm: test, output=show, output_title="Checkpoint selection output" -->

```python title="select_sft_checkpoint.py"
checkpoints = [
    {"step": 200, "val_loss": 1.91, "task_pass_rate": 0.93, "format_pass_rate": 0.99},
    {"step": 400, "val_loss": 1.77, "task_pass_rate": 0.91, "format_pass_rate": 1.00},
    {"step": 600, "val_loss": 1.79, "task_pass_rate": 0.97, "format_pass_rate": 0.98},
]

def select_checkpoint(rows):
    eligible = [row for row in rows if row["format_pass_rate"] >= 0.98]
    return max(eligible, key=lambda row: (row["task_pass_rate"], -row["val_loss"], -row["step"]), default=None)

best = select_checkpoint(checkpoints)
assert best is not None
assert select_checkpoint([]) is None
assert select_checkpoint([{**checkpoints[0], "format_pass_rate": 0.97}]) is None
assert select_checkpoint([{**checkpoints[0], "step": 600}, checkpoints[0]])["step"] == 200
assert select_checkpoint([{**checkpoints[0], "val_loss": 2.0}, {**checkpoints[0], "step": 400}])["step"] == 400

print("best_step=", best["step"])
print("best_task_pass_rate=", best["task_pass_rate"])
print("lowest_loss_step=", min(checkpoints, key=lambda row: row["val_loss"])["step"])
```

<!-- leetllm: output:start -->
```text title="Checkpoint selection output" output compact
best_step= 600
best_task_pass_rate= 0.97
lowest_loss_step= 400
```
<!-- leetllm: output:end -->

Step 400 shows the lowest validation loss ($1.77$), but step 600 achieves the highest task pass rate ($0.97$) while clearing the format threshold ($0.98$). The selection gate picks step 600. If no checkpoint meets the format threshold, the gate yields `None`, signaling that the recipe needs fixing before anything ships.

<!-- leetllm: audience:website:start --><figure>
  <img src="illustrations/_generated/checkpoint_selection_gate_dark.png" alt="Three checkpoints, steps 200, 400, and 600, are rows plotted against three aligned scales. All clear the inclusive 0.98 format gate with 0.99, 1.00, and 0.98. Task pass rates are 0.93, 0.91, and 0.97, so step 600 wins. Validation losses are 1.91, 1.77, and 1.79. Step 400 is lowest, but validation loss only breaks a task-rate tie." />
  <figcaption>All three checkpoints clear the inclusive 0.98 format gate. Task pass rate selects step 600; validation loss breaks only a task-rate tie.</figcaption>
</figure><!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start --><figure>
  <img src="illustrations/_generated/checkpoint_selection_gate_dark.png" alt="Three checkpoints, steps 200, 400, and 600, are rows plotted against three aligned scales. All clear the inclusive 0.98 format gate with 0.99, 1.00, and 0.98. Task pass rates are 0.93, 0.91, and 0.97, so step 600 wins. Validation losses are 1.91, 1.77, and 1.79. Step 400 is lowest, but validation loss only breaks a task-rate tie." />
  <figcaption>All three checkpoints clear the inclusive 0.98 format gate. Task pass rate selects step 600; validation loss breaks only a task-rate tie.</figcaption>
</figure><!-- leetllm: audience:book:end -->

## Single GPU first, then scale out

Don't start debugging conversation `conv_102` across an eight-GPU cluster. If prompt templating or label masking contains subtle bugs, scaling out distributes those defects across collective communication calls rather than resolving them. Prove your pipeline on a single device first:

1. single GPU execution
2. small, representative evaluation split
3. frequent checkpointing
4. verified chat templating and response-only label masking
5. clear task compliance metric

Validate the smallest feasible run before adding scale. Some required models can't fit one device at all; debug data schemas on tiny samples, then use the minimum necessary sharding. Test distributed loss normalization and checkpoint restore independently of the single-device run.

### Signs that one GPU is still fine

A single device is feasible when weights, gradients, optimizer state, activations, and temporary buffers fit at the chosen precision and the run meets its time budget. A model that fits for inference may still fail this training-memory test.

### Signs that you need FSDP or ZeRO

Consider FSDP or ZeRO when persistent model weights, gradients, and AdamW optimizer states exceed available GPU memory. Measure activation memory independently: sharding model parameters doesn't automatically eliminate activation overhead. Longer contexts often require activation checkpointing, reduced micro-batch sizes, or context parallelism. Adding more GPUs introduces network communication latency and won't speed up an improperly configured small job.

FSDP and ZeRO offer different state-sharding strategies; the chosen stage determines what is sharded.[^pytorchFsdpDocs2025][^rajbhandari2020] Specify precision explicitly. As of TRL 1.17, TRL defaults to BF16 when FP16 isn't set; verify hardware support and numerical behavior on the target stack.[^huggingface2026sfttrainer]

## Minimal operational skeleton

The row still follows the same path, whichever library applies the update:

```text title="sft_pipeline_shape.txt"
dataset -> template -> tokenizer -> collator/mask -> trainer
       -> periodic eval -> checkpoint save -> best-checkpoint export
```

TRL, torchtune, and the Alignment Handbook implement variations of this workflow.[^huggingface2026sfttrainer][^alignmentHandbook2025][^torchtune2026overview]

The configuration fragment below is an unexecuted integration blueprint for conversational prompt-completion rows. Its pilot disables packing until segment isolation is verified. API fields were checked against TRL 1.17.1 on November 4, 2026; pin a tested package version and model revision for a real run.

```python title="trl_sft_config_fragment.py"
from trl import SFTConfig, SFTTrainer

args = SFTConfig(
    output_dir="runs/sql-tool-sft-lora",
    learning_rate=1e-4,              # adapter baseline; tune for the target task
    max_length=1024,
    bf16=True,                     # only on supported hardware; verify numerics
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    max_steps=200,                  # authored pilot budget, not a recommended duration
    lr_scheduler_type="linear",    # explicit schedule; reaches zero at the budget endpoint
    warmup_steps=0,                 # authored candidate to compare, not a stability promise
    seed=42,
    data_seed=42,
    packing=False,                 # enable only after attention and loss-isolation checks
    eval_packing=False,              # keep validation examples separate
    completion_only_loss=True,       # train on the completion field, not the prompt
    loss_type="nll",                 # explicit standard loss for this adapter fragment
    eval_strategy="steps",
    eval_steps=100,
    save_steps=100,
)

trainer = SFTTrainer(
    model=model_with_lora_adapters,
    args=args,
    train_dataset=train_rows,        # prompt/completion are role/content message lists
    eval_dataset=held_out_rows,
    processing_class=tokenizer,
)
```

This fragment omits model loading, adapter initialization, and dataset construction. Convert the earlier authoring rows to message lists so the trainer can apply the checkpoint's template; raw string fields don't automatically become a chat conversation. We explicitly choose `loss_type="nll"`, which is also the current default. TRL now documents `"chunked_nll"` as a deprecated alias of `"nll"`, rather than a separate objective.[^huggingface2026sfttrainer] The implementation can compute NLL through a chunked projection path; pin and inspect that implementation separately from the target objective.[^trl2026SftImplementation] The evaluation loop computes teacher-forced loss rather than task or format pass rates, so generate and grade validation replies separately before applying the selection rule.

## Common pitfalls

A regression does not name the stage that failed. Check the split, the mask, and the checkpoint before you spend a sweep on the learning rate.

### Confusing the objective with the trainable parameters

Saying "we tried LoRA instead of SFT" mixes two distinct decisions. LoRA and full fine-tuning describe which weights are updated; SFT defines the supervised next-token cross-entropy objective. Define the behavioral target and objective first. Compare adapter tuning against full-weight tuning only when parameter capacity or memory budget is the variable under test.

### Evaluating examples that share a case with training

High validation scores followed by failures on new documents can reflect leakage, distribution shift, or a mismatched metric. Check whether related cases crossed splits and whether the grouping actually tests the deployment claim. A thread-disjoint split doesn't test unseen schemas shared across those threads.

### Reporting micro-batch as if it were the real batch

When two experiments claim "batch size 4" but demonstrate drastically different stability, check accumulation steps and GPU count before modifying the optimizer. Always publish per-device batch size, gradient accumulation steps, world size, packing mode, and total supervised tokens per update step.

### Saving weights without resume state

Changed loss or batches after resume prompts a state comparison; it doesn't uniquely diagnose an omitted checkpoint field. Check optimizer counters, LR, upcoming data, RNG states, precision/scaler state, and artifact identities against the uninterrupted reference.

### Using a packing path that leaks across examples

Incoherent answers don't uniquely diagnose packing leakage. Test attention reachability and shifted-label isolation directly. For independent demonstrations, use a verified segment-aware path; for intentional continuous-text training, cross-document context may be part of the chosen objective. A reset position ID or EOS token isn't itself an enforced barrier.

### Selecting the best checkpoint by train loss

Training loss measures reference-token likelihood on seen examples, not memorization by itself. Use validation behavior and declared constraints for selection, then assess the frozen choice on the final test. Checks need a task-appropriate grader; fluent output and low loss don't establish task correctness.

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
assert len(terms) == 3
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

Why score only the response? Suppose a row has 800 scored prompt positions and 30 response positions. Prompt targets are then about 96% of the terms in a full-sequence average, and they are often easy. On a smaller scale, say five prompt positions have losses of 0.03, 0.04, 0.02, 0.05, and 0.03, and two answer tokens have 2.20 and 1.80. The combined average is 0.596, while the answer's own loss sits at 2.000. You would celebrate that number while the answer was no better. This does not make response-only loss a law of nature. One study found that fractional prompt-loss weights improved some short-completion benchmarks on LLaMA models, with regularization as the likely cause.[^huertaEnochian2024PromptLoss] Scoring the response is a deliberate choice for this run, so if you change it, compare on the same held-out tasks and report response loss separately. In practice you rarely write this mask by hand, but check which format you loaded. As of TRL 1.17, `SFTTrainer` scores only the completion for prompt-completion data. For a plain `messages` dataset it scores the whole conversation unless you set `assistant_only_loss=True`, and that option needs generation markers in the chat template, which TRL can patch in for known model families.[^huggingface2026sfttrainer] Inspect a tokenized batch anyway and confirm that only answer and stop tokens carry real labels.

Inspect it *after* truncation, because truncation is where rows quietly die. Keep only the start of an overlong conversation, and the answer may be gone. Now every label is `-100`. With PyTorch's default mean cross-entropy, a batch made only of such rows gives NaN, which at least is loud. A trainer can hide even that: without packing, TRL 1.17 drops fully masked rows during preparation, so the only sign is a smaller dataset.[^trl2026SftV117] One such row inside a mixed batch is silent: it costs compute and teaches nothing. Count dropped and empty rows, so a shrinking dataset cannot hide. Two smaller traps live nearby. Mask padding by position rather than by token ID, because a model may use the same ID for padding and end-of-text, and masking every occurrence would erase your stop signal. And keep the stop token in your scored targets when the recipe uses it to teach turn completion.

## Pack short examples without letting them read each other

Padding short examples to a long fixed length wastes slots. Packing fits several short demonstrations into one sequence instead. It also raises a question that padding never did: can the second demonstration read the first?

With an ordinary causal mask, yes. Every later position can read every earlier one, so a reply for one query now conditions on an unrelated session simply because the loader happened to place them in one block. An end token marks text, and it stops nothing. What stops the leak is a block-causal mask, under which each position reads only earlier positions in its own example.

You rarely build that mask yourself. As of Transformers 5.22, models that use its shared causal-mask helper, such as Llama, build it under eager attention and PyTorch's scaled dot-product attention (SDPA). They read it from the position IDs, the counters that tell the model where each token sits, as long as you restart the IDs at each example, pass no attention mask, and run with `use_cache=False`.[^transformers2026MaskingV522] FlashAttention, a faster attention kernel, takes segment lengths instead. Breaking one of those conditions disables this automatic mask derivation. If the resulting mask is ordinary global-causal attention, the examples can read each other with no error; an explicit block-causal mask can still keep them isolated. Watch the cache if you write your own loop, because a Llama config turns it on by default. Transformers' `Trainer` turns it off unless you ask for it.[^transformers2026TrainerV522] Gradient checkpointing, a memory saver that keeps fewer activations on the forward pass and recomputes the rest during backward, also turns it off during training. So test the isolation instead of trusting it.

<figure>
  <img src="illustrations/_generated/packed_attention_boundaries_dark.png" alt="Two six-by-six attention masks. On the left, block-causal attention has two separate triangles, so query 4 reads only positions 3 and 4, with values 10 and 20, and its output stays at 15.0 after 100 is added to the first example. On the right, global causal attention has one triangle, so query 4 reads positions 0 to 4, and its output moves from 7.2 to 67.2." />
  <figcaption>Filled cells are allowed reads. Compare row 4 in the two masks: the extra reads on the right are the leak, and they move the output by 60 when only the other example changed. Both panels restart the position IDs. The right panel shows the ordinary global-causal fallback when automatic isolation is disabled, for example by an all-ones attention mask or a live cache. An explicit block-causal mask can still isolate the examples.</figcaption>
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
assert attend(values, True) == attend(changed, True) == 15.0
```

<!-- leetllm: output:start -->
```text title="Reader packed attention isolation" output compact
isolated=True: 15.0 -> 15.0
isolated=False: 7.2 -> 67.2
```
<!-- leetllm: output:end -->

That tests one attention rule in a few lines. To test your actual trainer, plant recognizable markers in two examples with dropout off, change one, and check the other's allowed attention and loss.

Attention is one of two leaks at the join. The loss has its own. A globally shifted loss must not ask the last token of one example to predict the first token of the next, so labels need masking at each segment start. As of TRL 1.17, the padding-free collator masks those labels, restarts the position IDs, returns no attention mask, and passes segment lengths for FlashAttention, and the trainer turns the cache off.[^trl2026SftV117] TRL releases before 1.16 warned if you were not using FlashAttention. That warning is gone, because Transformers had made it wrong, so do not wait for one. FlashAttention is now a speed and memory choice, and a large one. The pull request that removed the warning reports 326 ms and 32.3 GiB against 1,001 ms and 48.1 GiB for SDPA on 16,000 packed tokens, and SDPA ran out of memory at 32,000, because the packed mask grows with the square of the length.[^trl2026Pr7620] TRL's memory guide still says packing needs FlashAttention, so expect the docs and the code to disagree.[^huggingfaceTrlPacking2026] The proof that your examples are isolated is the perturbation test above, run on your own trainer.

Packing strategies also differ in what they do with long rows: `bfd` (best-fit decreasing, a bin-packing rule) truncates overflow, `bfd_split` splits it into chunks, and `wrapped` treats everything as one token stream and cuts it into blocks, which can split a sequence in the middle and mix unrelated examples.[^huggingfaceTrlPacking2026] `wrapped` does not enable padding-free mode by default. Its continuous stream discards independent-example isolation; with the default padded collator, examples can read each other and joins are scored.[^trl2026SftV117] Use it only when you do not need the isolation this section is about. Keeping every stored token is different from keeping every answer's original context, so choose by what you want to learn, and inspect the resulting segments. Packing also changes how many items the loader sees, so a fixed `max_steps` may now mean a different number of passes through your data. If anything looks off, turn packing off while you debug.

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
assert round(token_mean, 1) == 1.3
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
assert continued < saved_weight < fresh
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

Use validation data for this, and report denominators, uncertainty, and the slices that matter. Watch for unsupported citations, false refusals, regressions on unrelated tasks, and answers that turn down harmless `SELECT` queries just because a column is named `deleted_at`, because more optimizer steps can strengthen an unwanted habit just as well as a wanted one. If no checkpoint clears the format gate, the correct output is nothing, and that tells you the recipe needs work.

After export, reload the artifact with its tokenizer and template and repeat your generation checks. An adapter export also needs its exact base revision. A successful trainer run tells you the training code finished. To know the serving path loaded the same pieces, compare their hashes and read some answers. Keep the original model and a rollback route ready while you evaluate the candidate.

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
