---
{
  "id": "lora-parameter-efficient-fine-tuning",
  "title": "LoRA & Parameter-Efficient Tuning",
  "slug": "lora-parameter-efficient-fine-tuning",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/lora_adapters_dark.png",
  "companies": [
    "Google",
    "Meta",
    "Microsoft",
    "Hugging Face"
  ],
  "shortDescription": "Full fine-tuning stores gradients and Adam state for every weight. LoRA trains a low-rank update, and held-out task checks still decide whether that update is enough.",
  "keyConceptsTested": [
    "Low-rank decomposition ΔW = BA",
    "Adapter injection points in transformers",
    "Optimizer-state savings vs activation-memory bottlenecks",
    "Rank selection tradeoffs",
    "QLoRA and quantization interactions",
    "Soft prompts and prefix tuning as alternative PEFT methods",
    "Adapter merging vs multi-adapter serving"
  ],
  "prerequisites": [
    "supervised-fine-tuning-pipeline",
    "mixed-precision-training-loss-scaling",
    "distributed-training-fsdp-deepspeed-zero",
    "linear-algebra-machine-learning-deeper"
  ],
  "relatedQuestions": [
    "training-run-operations",
    "reward-modeling-from-preference-data",
    "knowledge-distillation-llms"
  ],
  "section": "Advanced Training & Adaptation",
  "order": 9
}
---
<!-- leetllm: edition:reference:start -->

Suppose a read-only SQL analytics assistant already answers routine questions, but a new warehouse schema renames key tables and adds join rules. You have 5,000 labeled question-to-SQL pairs and one 48 GB training GPU. Full fine-tuning asks that machine to hold <span data-glossary="gradient">gradients</span> and Adam state for every base weight. A thin adapter looks affordable, but it still has to learn the new schema conventions without damaging ordinary queries. Which constraint fails first: memory, adaptation capacity, or regression quality?

Call this experiment `sql-lora-v1`. It changes how the assistant writes queries against the new schema, not where the current schema lives: frequently changing table definitions still need a versioned source or retrieval. LoRA (Low-Rank Adaptation) freezes the pretrained weights and learns a small additive update inside selected linear layers. Full fine-tuning moves every eligible weight. Both still execute the base network.

The original GPT-3 175B experiments reported roughly 10,000 times fewer trainable parameters and three times lower <span data-glossary="gpu">GPU</span> memory requirements than full fine-tuning with Adam.[^hu2021] Those figures describe the paper's setup. The calculations below estimate storage, and the executable examples check small layers; evaluate a complete training run separately.

## Why LoRA exists

Full fine-tuning a 70-billion parameter model is expensive for a specific reason: training stores more than model weights. It also keeps gradients and <span data-glossary="optimizer">optimizer</span> state for every trainable parameter. Before reading the table, fix the accounting recipe. It assumes low-precision parameters and gradients with two FP32 Adam moment tensors, but **no separate FP32 master parameter copy**.

Consider the memory breakdown for a 70B model using Adam with <span data-glossary="fp16">FP16</span> (half-precision) weights:

| Component | Memory | Formula |
|-----------|--------|---------|
| Model weights (FP16) | 140 GB | $70\text{B} \times 2$ bytes |
| Gradients (FP16) | 140 GB | $70\text{B} \times 2$ bytes |
| Adam optimizer $m$ (FP32, single-precision) | 280 GB | $70\text{B} \times 4$ bytes |
| Adam optimizer $v$ (FP32, single-precision) | 280 GB | $70\text{B} \times 4$ bytes |
| **Total under this 12-byte recipe** | **840 GB** | Before activations and temporary buffers |

The 840 GB total covers model state only. All GB and MB here are decimal ($10^9$ and $10^6$ bytes). A real run also stores activations and temporary buffers. If the optimizer keeps a separate FP32 master copy, add another 280 GB, giving the 1.12 TB, 16-byte recipe from the [distributed training](/learn/distributed-training-fsdp-deepspeed-zero) lesson. Actual dtypes depend on the optimizer and training stack; this isn't a claim about every Adam implementation.

<!-- leetllm: test, output=show, output_title="Fine-tuning recipe output" -->
```python title="full-finetuning-memory-recipe.py"
params_billion = 70
gb_per_byte_per_billion = 1

recipe = {
    "fp16_parameters": 2,
    "fp16_gradients": 2,
    "fp32_adam_moments": 8,
}
without_master = params_billion * sum(recipe.values()) * gb_per_byte_per_billion
with_master = without_master + params_billion * 4

print("bytes_per_parameter_without_master=", sum(recipe.values()))
print("full_finetuning_states_without_master_GB=", without_master)
print("full_finetuning_states_with_master_GB=", with_master)
print("frozen_fp16_base_floor_for_lora_GB=", params_billion * recipe["fp16_parameters"])
```

<!-- leetllm: output:start -->
```text title="Fine-tuning recipe output" output compact
bytes_per_parameter_without_master= 12
full_finetuning_states_without_master_GB= 840
full_finetuning_states_with_master_GB= 1120
frozen_fp16_base_floor_for_lora_GB= 140
```
<!-- leetllm: output:end -->

840 GB of model state already blows past the capacity of a single 80 GB GPU. Does adapting to a specific task really require moving all 70 billion parameters independently?

Pretrained transformers are massively over-parameterized. During pretraining, they construct rich internal representations of syntax, reasoning, and world knowledge. When we adapt `sql-lora-v1` on 5,000 question-to-SQL pairs, we aren't asking the network to relearn the structure of language from scratch. We're steering existing representations toward the new schema conventions.

Aghajanyan et al. found that their studied pretrained models could approach full fine-tuning performance by optimizing a much smaller, randomly projected parameter subspace.[^aghajanyan2020] This **intrinsic dimension** counts free optimization coordinates; layer-update matrix rank is a separate property. One scalar $\theta$ controlling $\Delta W=\theta I$ already gives a full-rank update whenever $\theta\ne0$.

Inspired by those results, Hu et al. proposed a separate **intrinsic rank hypothesis** and tested low-rank updates.[^hu2021] LoRA constrains selected updates to $\Delta W=BA$, whose rank is at most $r$. Test whether this low-rank constraint fits the target task's updates.

### What LoRA saves, and what it doesn't

LoRA removes gradients and <span data-glossary="optimizer-state">optimizer state</span> for the frozen base model. The base weights still occupy memory, and the adapter keeps its own small trainable state.

Run the SQL example at 2,048 tokens per training example and the apparent bargain changes. **Activation memory isn't eliminated.** Activations are intermediate tensors retained for backpropagation. Many grow with sequence length, batch size, and depth; materialized attention scores additionally grow quadratically with sequence length. Backpropagation still needs paths through frozen operations to calculate adapter gradients. Long-context activations can outweigh adapter state or even base weights. Profile the peak before shrinking rank: compare activation recomputation (gradient checkpointing), smaller micro-batches, and an attention implementation that avoids the full score matrix.

> **Memory boundary:** LoRA removes base-weight gradient and optimizer-state storage, not the need to execute the full base network. A batch of 2,048-<span data-glossary="token">token</span> schema-heavy prompts can still be dominated by activations. Measure peak memory under the intended context length and micro-batch size.

The running example uses 70B for planning, while QLoRA's published comparison uses 65B. Keep that boundary visible: under this 12-byte recipe, 65B full fine-tuning requires 780 GB, while the <span data-glossary="qlora">QLoRA</span> paper fine-tuned a 65B model on a single 48 GB GPU.[^dettmers2023] That paper demonstrates one end-to-end configuration; profile memory at the target sequence length and batch size.

<figure>
  <img src="illustrations/_generated/lora_memory_budget_dark.png" alt="A shared 0–800 GB scale compares 780 GB of full-fine-tuning states, a 130 GB frozen FP16 base, and a 33.5 GB ideal NF4 base plus nested scales for a 65B model. A separate 0–48 GB scale shows 32.5 GB of NF4 values and 1.0 GB of scales, leaving 14.5 GB for omitted allocations. The base-only inventory excludes adapters, gradients, optimizer state, activations, and temporary buffers; it is not evidence that training fits. The QLoRA paper reports one 65B run on a 48 GB GPU." />
  <figcaption>The full-FT bar counts parameters, gradients, and moments. The other bars count only their frozen bases. An ideal all-NF4 payload plus scales leaves about 14.5 GB below the example's 48 GB capacity, to cover every omitted live allocation. QLoRA's published 65B run demonstrates one configuration; these bars alone don't show that training fits.</figcaption>
</figure>

The bars explain why `sql-lora-v1` is worth testing. They don't tell us how much behavior the overlay can express. For one layer, full fine-tuning rewrites $W_0$. LoRA keeps $W_0$ frozen and learns $\Delta W = BA$, scaled by $\alpha / r$, so the layer uses $W_0 + \frac{\alpha}{r}BA$. On a 4096 by 4096 projection, how many numbers is that, and why does the product stay low rank?

## The math: from a 4096×4096 layer

### A layer small enough to count

Suppose one <span data-glossary="transformer">Transformer</span> projection has a $4096 \times 4096$ weight matrix. Before naming LoRA's factors, count the budget: an update of rank $r=16$ contains only thousands of values, while the base layer holds millions.

Full fine-tuning would train $4096 \times 4096 = 16,777,216$ parameters. A rank-16 LoRA update instead uses:

- Matrix $A$ has shape $16 \times 4096$ and has $65,536$ parameters.
- Matrix $B$ has shape $4096 \times 16$ and has $65,536$ parameters.
- Total LoRA parameters: $131,072$

That is **0.78%** of the full matrix size, a **99.2% reduction**. The capacity is smaller by design; the base layer still supplies the general representation.

Now follow one input <span data-glossary="vector">vector</span> $x$. The frozen layer produces $W_0x$, while the adapter compresses $x$ into rank space, expands it back out, and adds that correction:

$$
h = W_0 x + \frac{\alpha}{r} B A x = W_0 x + \frac{\alpha}{r} B(Ax)
$$

One path is the base response. A second path is the trainable overlay, scaled by $\alpha/r$, where $\alpha$ controls its explicit strength. Because both paths share the same input, merging them later can recover one dense matrix.

The parentheses in $B(Ax)$ reflect computational associativity. An ordinary unmerged LoRA forward can evaluate two thin products without materializing the full $d_{\text{out}} \times d_{\text{in}}$ update. Forming that matrix would take $\approx 2 \times 4096^2 \times 16$ operations. Instead, $Ax$ and $B(Ax)$ each take about 131K FLOPs per token, totaling about 262K versus 33.5M for this base projection. That's about 0.78% **additional arithmetic for this projection**, excluding scaling and addition. It doesn't predict 0.78% extra latency: kernel launches, memory traffic, batching, and backward also matter.

### Why the product is low rank

The worked layer used equal input and output widths. In general, a full update $\Delta W$ has the same dimensions as the base weights, $d_{\text{out}} \times d_{\text{in}}$. LoRA factorizes that update into two smaller matrices:

$$
\Delta W = B \cdot A
$$

Read the shapes from right to left when checking the product:
- $A \in \mathbb{R}^{r \times d_{\text{in}}}$: the first matrix (maps from input to rank $r$)
- $B \in \mathbb{R}^{d_{\text{out}} \times r}$: the second matrix (maps from rank to output)
- $r$ is the factor width, conventionally called the **rank**. The product's actual rank is at most $r$; it starts at zero under the usual zero-B initialization.[^hu2021]

```checkpoint
Why does LoRA save parameters?
---
It learns two skinny matrices instead of one full-size update matrix. When $r$ is much smaller than $d_{\text{in}}$ and $d_{\text{out}}$, $A$ and $B$ contain far fewer trainable values than $\Delta W$.
```

In the figure, trace the dimensions: $B$ times $A$ recreates a matrix shaped like $W_0$, but only $A$ and $B$ carry gradients. The visual also keeps the forward order straight: $x$ enters $A$, then $B$, even though the written product is $BA$.

<figure>
  <img src="illustrations/_generated/lora_adapters_dark.png" alt="LoRA factorization for a 4096 by 4096 projection: input x routes through frozen base weight W0 (16.7M parameters) in parallel with trainable low-rank factors A (16 by 4096, random init) and B (4096 by 16, zero init). The adapter output is scaled by alpha/r and added to W0*x. With B=0 initially, delta-W starts at zero, preserving base behavior on step 0." />
  <figcaption>Input vector $x$ routes through both branches in parallel: the frozen base path $W_0 x$ and the low-rank adapter path $(A \to B)$. Down-projection $A$ projects $x$ into rank bottleneck $r=16$, and up-projection $B$ expands it back to 4096 dimensions. Because $B=0$ at initialization, the adapter output starts at zero, preserving the exact pretrained behavior on step 0.</figcaption>
</figure>

#### Count the saved parameters

The same arithmetic scales to any square projection. Use the table to put capacity and storage side by side before checking the count in code.

$$
\text{LoRA params} = r \cdot d_{\text{in}} + d_{\text{out}} \cdot r = 2r \cdot d
$$

Where $r$ is LoRA rank, and $d_{\text{in}}, d_{\text{out}}$ are matrix dimensions (equal to $d$ for square projection layers).

| Approach | Parameters | Ratio | Memory (FP16) |
|----------|-----------|-------|---------------|
| Full fine-tuning | $4096^2 = $ **16.7M** | 100% | 33.5 MB |
| LoRA ($r=8$) | $2 \times 8 \times 4096 = $ **65.5K** | **0.39%** | 131 KB |
| LoRA ($r=16$) | $2 \times 16 \times 4096 = $ **131K** | 0.78% | 262 KB |
| LoRA ($r=64$) | $2 \times 64 \times 4096 = $ **524K** | 3.1% | 1 MB |

For $r=16$, the adapter trains 131K values instead of 16.7M. The task gets a rank-16 update, and that layer no longer stores a full gradient plus Adam pair for its frozen base weights.

<!-- leetllm: test, output=show, output_title="Parameter savings output" -->
```python title="parameter-savings-concrete-calculation.py"
def lora_parameter_count(d_in: int, d_out: int, rank: int) -> int:
    return rank * d_in + d_out * rank


d_in = d_out = 4096
rank = 16
full_params = d_in * d_out
lora_params = lora_parameter_count(d_in, d_out, rank)
ratio = lora_params / full_params

print(f"full_params={full_params:,}")
print(f"lora_params={lora_params:,}")
print(f"LoRA r={rank} trains {lora_params:,} params, {ratio:.2%} of full fine-tuning.")
```

<!-- leetllm: output:start -->
```text title="Parameter savings output" output compact
full_params=16,777,216
lora_params=131,072
LoRA r=16 trains 131,072 params, 0.78% of full fine-tuning.
```
<!-- leetllm: output:end -->

#### Start from the checkpoint

The first training step shouldn't erase the behavior we paid to pretrain. If both $A$ and $B$ start non-zero, the adapter injects random noise before it has seen a single label.

The original paper uses Gaussian A and zero B.[^hu2021] For linear layers, PEFT's default instead uses Kaiming-uniform A and still zeros B.[^huggingface2026peftlora] Both make the initial adapter contribution zero. The linear layer below uses that ordinary initialization. Other supported schemes can reparameterize the base or use data to choose factors.

Follow its forward and backward paths:

1. **Step-zero identity:** $B=0$ makes the additive correction zero. With the same base, inputs, and evaluation settings, the layer begins as $W_0x$. Later loss depends on the data, optimizer, and updates.
2. **Usable gradient flow on step 1:** Let loss be $\mathcal{L}$ and incoming gradient with respect to output $h$ be $g = \nabla_h \mathcal{L} \in \mathbb{R}^{d_{\text{out}}}$. By the chain rule:
   $$
   \nabla_B \mathcal{L} = \frac{\alpha}{r} g (Ax)^T \in \mathbb{R}^{d_{\text{out}} \times r}, \qquad \nabla_A \mathcal{L} = \frac{\alpha}{r} B^T g x^T \in \mathbb{R}^{r \times d_{\text{in}}}
   $$
   At $B=0$, A's loss gradient is zero. B can receive a nonzero gradient when the scale, incoming gradient, and $Ax$ are nonzero. Nonzero A and x alone aren't sufficient: x can lie in A's null space, and batch contributions can cancel. Once B moves, A can receive gradients on later steps; inspect them rather than assuming every batch updates both factors.

If both factors are zero, both loss gradients are zero and ordinary gradient updates can't leave that point. Reversing the asymmetry, zero A with nonzero B, can also begin as a no-op with A learning first. Two unconstrained random factors generally perturb the starting model; that isn't a theorem that every nonzero initialization is unstable.

The next CPU experiment checks the null-space case. The base contribution is fixed at zero, the scale is one, and the loss is $(h-1)^2/2$:

<!-- leetllm: test, deps=torch, output=show, output_title="Initial gradient counterexamples" -->
```python title="lora_initial_gradients.py"
import torch

def factors(a, b):
    return (torch.tensor([a], dtype=torch.float64, requires_grad=True),
            torch.tensor([[b]], dtype=torch.float64, requires_grad=True))

for name, a, b, values, expected in [
    ("usual", [1., -1.], 0., [1., 0.], (False, True)),
    ("null_space", [1., -1.], 0., [1., 1.], (False, False)),
    ("both_zero", [0., 0.], 0., [1., 0.], (False, False)),
    ("reversed", [0., 0.], 1., [1., 0.], (True, False)),
]:
    A, B = factors(a, b)
    x = torch.tensor(values, dtype=torch.float64)
    h = (B @ (A @ x)).squeeze()
    assert h.item() == 0
    ((h - 1).square() / 2).backward()
    moved = (bool(A.grad.abs().sum() > 0), bool(B.grad.abs().sum() > 0))
    assert moved == expected
    print(f"{name}: A_grad_nonzero={moved[0]}, B_grad_nonzero={moved[1]}")

A, B = factors([1., -1.], 0.)
optimizer = torch.optim.SGD([A, B], lr=0.1)
x = torch.tensor([1., 0.], dtype=torch.float64)
for step in range(2):
    optimizer.zero_grad(set_to_none=True)
    h = (B @ (A @ x)).squeeze()
    ((h - 1).square() / 2).backward()
    assert bool(A.grad.abs().sum() > 0) == (step == 1)
    optimizer.step()
print("usual_second_step_A_grad_nonzero=True")
```

<!-- leetllm: output:start -->
```text title="Initial gradient counterexamples" output compact
usual: A_grad_nonzero=False, B_grad_nonzero=True
null_space: A_grad_nonzero=False, B_grad_nonzero=False
both_zero: A_grad_nonzero=False, B_grad_nonzero=False
reversed: A_grad_nonzero=True, B_grad_nonzero=False
usual_second_step_A_grad_nonzero=True
```
<!-- leetllm: output:end -->

#### Separate capacity from strength

Rank and scale answer two distinct questions. Rank says how many independent directions the adapter can express; $\alpha/r$ says how strongly the resulting correction enters the layer:

$$
\text{scaling} = \frac{\alpha}{r}
$$

- $r$ (rank): sets the inner bottleneck dimension, dictating adapter parameter count and expressive capacity.
- $\alpha$ (alpha): sets the fixed numerical scale of the learned correction.

The original paper uses $\alpha/r$ to reduce hyperparameter retuning when changing rank.[^hu2021] It isn't a universal rank-stability rule. B starts at zero, so the initial correction is zero at every rank; its later size depends on factor initialization, gradients, and optimization as well as the explicit multiplier.

```checkpoint
If rank increases but $\alpha$ stays fixed, what happens to $\alpha/r$?
---
It gets smaller. That changes the forward multiplier and gradients. Learned update magnitudes also depend on the number of components and their optimization, so compare ranks with measured updates.
```

For ordinary LoRA scaling, $\alpha=r$ and $\alpha=2r$ produce multipliers of 1 and 2. Holding $\alpha/r$ constant makes a rank comparison easier to interpret; measure learned update magnitudes across ranks. Sweep rank, scale, <span data-glossary="learning-rate">learning rate</span>, and target-module coverage as coupled choices.

**rsLoRA** (rank-stabilized LoRA) uses $\alpha/\sqrt{r}$. Kalajdzievski derives this scaling under assumptions about initialization and input/gradient statistics, and finds higher-rank learning improvements in the evaluated setups.[^kalajdzievski2023] The theorem describes those assumptions and results; compare gradient norms and task quality on the target run to choose rank. PEFT exposes it with `use_rslora=True`.[^huggingface2026peftlora]

<!-- leetllm: test, output=show, output_title="LoRA scaling output" -->
```python title="lora-scaling-factor.py"
import math

configs = [
    {"rank": 8, "alpha": 16},
    {"rank": 32, "alpha": 16},
    {"rank": 32, "alpha": 64},
]

for config in configs:
    rank = config["rank"]
    alpha = config["alpha"]
    ordinary = alpha / rank
    rslora = alpha / math.sqrt(rank)
    print(
        f"r={rank:>2} alpha={alpha:>2} "
        f"ordinary={ordinary:.3f} rslora={rslora:.3f}"
    )
```

<!-- leetllm: output:start -->
```text title="LoRA scaling output" output compact
r= 8 alpha=16 ordinary=2.000 rslora=5.657
r=32 alpha=16 ordinary=0.500 rslora=2.828
r=32 alpha=64 ordinary=2.000 rslora=11.314
```
<!-- leetllm: output:end -->

## Where to inject LoRA

The rank tells us how much each adapter can express. We still need to choose where that capacity enters the block. Start with the narrow question: should `sql-lora-v1` change only attention routing, or also the per-token transformation that follows it?

Query ($W_Q$) and Value ($W_V$) projections were a central LoRA configuration.[^hu2021] PEFT defaults vary by architecture; inspect the resolved `target_modules` list to see which modules receive adapters.[^huggingface2026peftlora] In its LLaMA-7B Alpaca comparison, QLoRA required adapters across all linear Transformer-block layers to match full fine-tuning.[^dettmers2023]

### Common injection strategies

Target coverage trades adapter cost for capacity. Before choosing a larger rank, compare these three ways to spend the same kind of adapter budget:

| Strategy | Target modules | When to use |
|----------|---------------|-------------|
| **Original LoRA** | $W_Q, W_V$ only | Cheapest baseline matching the original paper's attention setup. |
| **All attention** | $W_Q, W_K, W_V, W_O$ | Attention-only comparison with more trainable capacity. |
| **All-linear** | Attention projections + MLP gate/up/down projections | QLoRA-style starting point to compare when quality matters. |

Module names vary by architecture. Current Hugging Face PEFT exposes `target_modules="all-linear"` as a QLoRA-style shortcut, but on a `PreTrainedModel` that selection **excludes the output projection** (`lm_head`). Inspect the matched module names instead of trusting the shortcut, especially after adding special tokens.[^huggingface2026peftlora]

### Why adapt MLP layers?

Attention layers ($W_Q, W_K, W_V, W_O$) control how tokens route information across the context. MLP (Multi-Layer Perceptron) layers, also called FFNs (<span data-glossary="feed-forward-network">Feed-Forward Networks</span>), transform each token after that routing. The LLaMA and Qwen2-style SwiGLU blocks shown here use `gate_proj`, `up_proj`, and `down_proj`; names and layouts vary across architectures.

Q/V targeting was a principal original LoRA baseline, and that paper also compared other attention targets.[^hu2021] QLoRA's LLaMA-7B/Alpaca ablation found all-linear coverage important for matching its full-fine-tuning baseline.[^dettmers2023] For `sql-lora-v1`, compare low-rank adapters across all linear layers with higher-rank attention-only adapters. Measure whether MLP adapters help the procedural task. Record cost and held-out quality for each candidate.

The toy block below puts a number on that choice. With rank 16, how much more adapter state does all-linear targeting add than Q/V targeting?

<!-- leetllm: test, output=show, output_title="Target-module budget output" -->
```python title="target-module-budget.py"
dimensions = {
    "q_proj": (4096, 4096),
    "k_proj": (4096, 4096),
    "v_proj": (4096, 4096),
    "o_proj": (4096, 4096),
    "gate_proj": (4096, 11008),
    "up_proj": (4096, 11008),
    "down_proj": (11008, 4096),
}
rank = 16

def adapter_params(names):
    return sum(rank * (dimensions[name][0] + dimensions[name][1]) for name in names)

qv = adapter_params(["q_proj", "v_proj"])
all_linear = adapter_params(list(dimensions))
print("qv_adapter_params=", qv)
print("all_linear_adapter_params=", all_linear)
print("all_linear_vs_qv_ratio=", round(all_linear / qv, 2))
```

<!-- leetllm: output:start -->
```text title="Target-module budget output" output compact
qv_adapter_params= 262144
all_linear_adapter_params= 1249280
all_linear_vs_qv_ratio= 4.77
```
<!-- leetllm: output:end -->

### Methods that train learned state outside weight matrices

Prompt tuning and prefix tuning are two other parameter-efficient fine-tuning families. They learn **prompt-like state** while leaving the base weight matrices unchanged.

Prompt tuning trains a small set of continuous virtual tokens prepended to the input.[^lester2021] These are learned embedding vectors, not human-readable words. For `sql-lora-v1`, the control signal enters through each ticket's <span data-glossary="context-window">context window</span>. The projection weights stay fixed, which limits how directly the method can change internal transformations.

Prefix tuning trains continuous key/value prefixes for Transformer layers.[^li2021prefix] The base weights remain frozen, and each layer receives learned prefix state that attention can attend to. The control signal therefore reaches multiple layers directly.

Compare methods by where their learned state enters the model. Evaluate their adaptation strength on your task:

| Method | What trains | Example comparisons |
|--------|-------------|----------|
| **Prompt tuning / soft prompts** | Learned input <span data-glossary="embedding">embeddings</span> | Task steering with a small learned input, including the original T5 experiments |
| **Prefix tuning** | Learned per-layer prefix states | Generation, including the original table-to-text and summarization experiments |
| **LoRA / QLoRA** | Low-rank weight adapters | Internal projection updates for task or instruction adaptation |

Reserve the name "LoRA" for methods that modify internal projections through low-rank adapters. Soft prompt tuning and prefix tuning keep those projections frozen and learn continuous prompt-like state. This distinction matters when inspecting a checkpoint or estimating what a new policy can change.

## Implementing LoRA with Hugging Face PEFT

The `peft` (Parameter-Efficient Fine-Tuning) library wraps the factors, so you don't need to write $BAx$ by hand. The setup has two important effects: `all-linear` attaches more adapters than Q/V targeting, and `r=16`, `alpha=32` makes the ordinary scale $2$.

### Verify the adapter on CPU first

This tiny, randomly initialized Qwen2 architecture downloads no checkpoint. It tests the actual PEFT wrapper with pinned PyTorch 2.13.0, Transformers 5.16.1, and PEFT 0.20.0. One synthetic four-token sequence checks no-op initialization, frozen base weights, two-step gradient flow, adapter save/reload, and merge equivalence. These pinned versions define the fixture; check current releases before adopting them. The fixture measures neither policy accuracy nor 7B-model memory.

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="Real PEFT wrapper, tiny CPU model" -->
```python title="tiny-peft-check.py"
import tempfile
import torch
from peft import LoraConfig, PeftModel, get_peft_model
from transformers import Qwen2Config, Qwen2ForCausalLM

torch.manual_seed(7)
config = Qwen2Config(
    vocab_size=32, hidden_size=16, intermediate_size=32,
    num_hidden_layers=1, num_attention_heads=2, num_key_value_heads=1,
    max_position_embeddings=32, attention_dropout=0.0,
    tie_word_embeddings=False,
)
base = Qwen2ForCausalLM(config).eval()
ids = torch.tensor([[1, 2, 3, 4]])
expected = base(ids).logits.detach().clone()
base_state = {name: value.detach().clone() for name, value in base.state_dict().items()}
base_snapshot = [(p, p.detach().clone()) for p in base.parameters()]
model = get_peft_model(base, LoraConfig(
    r=2, lora_alpha=4, target_modules="all-linear",
    lora_dropout=0.0, bias="none", task_type="CAUSAL_LM",
)).eval()
torch.testing.assert_close(model(ids).logits, expected)
targets = [name.rsplit(".", 1)[-1] for name, module in model.named_modules()
           if hasattr(module, "lora_A")]
assert set(targets) == {"q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"}
assert model.get_nb_trainable_parameters() == (512, 3920)

model.train()
optimizer = torch.optim.SGD([p for p in model.parameters() if p.requires_grad], lr=0.1)
model(ids, labels=ids).loss.backward()
a_grad = sum(p.grad.abs().sum().item() for n, p in model.named_parameters() if "lora_A" in n)
b_grad = sum(p.grad.abs().sum().item() for n, p in model.named_parameters() if "lora_B" in n)
assert a_grad == 0 and b_grad > 0
assert all(p.grad is None for p in model.parameters() if not p.requires_grad)
optimizer.step()
optimizer.zero_grad(set_to_none=True)
model(ids, labels=ids).loss.backward()
assert sum(p.grad.abs().sum().item() for n, p in model.named_parameters() if "lora_A" in n) > 0
optimizer.step()
assert all(torch.equal(p, saved) for p, saved in base_snapshot)

model.eval()
adapted = model(ids).logits.detach()
assert not torch.equal(adapted, expected)
with tempfile.TemporaryDirectory() as directory:
    model.save_pretrained(directory)
    fresh_base = Qwen2ForCausalLM(config)
    fresh_base.load_state_dict(base_state)
    reloaded = PeftModel.from_pretrained(fresh_base, directory).eval()
    torch.testing.assert_close(reloaded(ids).logits, adapted)
merged = model.merge_and_unload(safe_merge=True).eval()
torch.testing.assert_close(merged(ids).logits, adapted, atol=1e-6, rtol=1e-5)
assert not any("lora_" in name for name, _ in merged.named_parameters())
print("adapted modules:", targets)
print("trainable parameters: 512; total with adapters: 3920")
print("no-op, frozen base, two-step gradients, save/reload, merge: passed")
```

<!-- leetllm: output:start -->
```text title="Real PEFT wrapper, tiny CPU model" output compact
adapted modules: ['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj']
trainable parameters: 512; total with adapters: 3920
no-op, frozen base, two-step gradients, save/reload, merge: passed
```
<!-- leetllm: output:end -->

The key/value projections here are narrower than the query projection because the configuration uses grouped-query attention. Compare each module's actual input and output dimensions with the model's hidden width. With rank 2, Q and O each add 64 parameters, K and V each add 48, and the three MLP projections each add 96: 512 total.

The module map below follows the exact Qwen2 example. Each row connects its input and output widths to its rank-2 adapter cost; the columns show which modules each target set reaches.

<figure>
<img src="illustrations/_generated/lora_target_module_map_dark.png" alt="A module map for the one-layer Qwen2 CPU example with hidden width 16, intermediate width 32, two query heads, one key/value head, and rank 2. It lists the input and output widths and adapter parameter count for q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, and down_proj. The Q/V, all-attention, and all-linear columns mark the modules selected by each target set and total 112, 224, and 512 adapter parameters. The lm_head output projection is shown separately because PEFT all-linear excludes it for a PreTrainedModel." />
<figcaption>Wider target sets attach adapters to more modules. In this rank-2 Qwen2 example, Q/V selects two modules and 112 parameters; all seven transformer linear projections require 512, with the output head excluded.</figcaption>
</figure>

### Set up the larger training job

This is a real training-setup fragment, not a local <span data-glossary="smoke-test">smoke test</span>. To run it, install `torch`, `transformers`, `peft`, and `accelerate` on a machine that can load the target model. Let your trainer or distributed launcher handle placement. Accelerate documents `device_map="auto"` for Big Model **Inference**, not as a distributed-training strategy.[^huggingface2026acceleratebigmodel]

```python title="implementing-lora-with-hugging-face-peft.py"
import torch
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B",
    dtype=torch.bfloat16,
)

# Configure LoRA
lora_config = LoraConfig(
    r=16,                          # rank
    lora_alpha=32,                 # scaling factor alpha/r = 32/16 = 2.0
    target_modules="all-linear",   # QLoRA-style targeting
    lora_dropout=0.05,             # regularization
    bias="none",                   # don't train biases
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# Inspect this output rather than assuming how many modules matched.
```

When you run `print_trainable_parameters()`, you get trainable parameters, total parameters, and the percentage for this exact checkpoint and module selection. Save that receipt with the run. A shortcut is useful only if it matched the intended projections, and `all-linear` won't attach an adapter to `lm_head`.

### Inspect stored adapter precision

Loading the base in BF16 doesn't force its adapter factors to stay BF16. PEFT normally promotes low-precision LoRA factors to FP32; `autocast_adapter_dtype=False` disables that promotion.[^huggingface2026peftTroubleshooting] The name describes adapter storage handling, not PyTorch's operation-level autocast. This pinned CPU check inspects the parameters directly:

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="PEFT stored parameter dtypes" -->
```python title="peft_adapter_dtypes.py"
import torch
from torch import nn
from peft import LoraConfig, get_peft_model

for promote in [True, False]:
    base = nn.Sequential(nn.Linear(6, 4, bias=False).to(torch.bfloat16))
    wrapped = get_peft_model(base, LoraConfig(r=2, target_modules=["0"]),
                             autocast_adapter_dtype=promote)
    layer = wrapped.base_model.model[0]
    actual = layer.lora_A["default"].weight.dtype
    assert actual == (torch.float32 if promote else torch.bfloat16)
    assert layer.lora_B["default"].weight.dtype == actual
    assert layer.base_layer.weight.dtype == torch.bfloat16
    print(f"promote={promote}: base={layer.base_layer.weight.dtype}, adapter={actual}")
```

<!-- leetllm: output:start -->
```text title="PEFT stored parameter dtypes" output compact
promote=True: base=torch.bfloat16, adapter=torch.float32
promote=False: base=torch.bfloat16, adapter=torch.bfloat16
```
<!-- leetllm: output:end -->

### Merge when the serving setup is single-tenant

For a single-adapter deployment, you can merge the overlay into the base weights. That removes the extra adapter path and produces one ordinary checkpoint for inference engines that support the base architecture. Keep the separate artifact until evaluation and rollback checks pass.

```python title="merging-the-adapter-path.py"
# After training completes
merged_model = model.merge_and_unload()
# merged_model is now a standard transformers model with no PEFT adapters
merged_model.save_pretrained("./my-adapted-model")
```

For ordinary LoRA, `merge_and_unload()` folds $\frac{\alpha}{r}BA$ into each adapted weight and returns the underlying dense model.[^huggingface2026peftlora] Assign and use that return value. The call merges updates into the wrapped base weights while unloading adapters. Save the adapter first and reload a clean base for rollback. Compare merged and unmerged outputs in evaluation mode, with dropout disabled; finite-precision rounding can prevent bitwise equality.

<!-- leetllm: test, output=show, output_title="Adapter merge output" -->
```python title="merge-identity.py"
base = [[1.0, 2.0], [3.0, 4.0]]
A = [[1.0, -1.0]]
B = [[0.5], [1.0]]
scale = 2.0
x = [2.0, 1.0]

def matvec(matrix, vector):
    return [sum(a * b for a, b in zip(row, vector)) for row in matrix]

adapter_matrix = [
    [scale * B[row][0] * A[0][col] for col in range(2)]
    for row in range(2)
]
merged = [
    [base[row][col] + adapter_matrix[row][col] for col in range(2)]
    for row in range(2)
]
unmerged_output = [
    value + delta
    for value, delta in zip(matvec(base, x), matvec(adapter_matrix, x))
]
print("merged_weights=", merged)
print("outputs_match=", matvec(merged, x) == unmerged_output)
```

<!-- leetllm: output:start -->
```text title="Adapter merge output" output compact
merged_weights= [[2.0, 1.0], [5.0, 2.0]]
outputs_match= True
```
<!-- leetllm: output:end -->

### See the two paths without a framework

The standard-library layer below isolates the forward algebra. It leaves $W_0$ unchanged, creates a thin $r \times d_{\text{in}}$ matrix $A$, starts $B$ at zero, and adds $\frac{\alpha}{r}B(Ax)$. It has no autograd or optimizer. The forward path uses two thin matrix-vector products; only the explicit merge calculation materializes the dense update.

<!-- leetllm: test, output=show, output_title="LoRA layer output" -->
```python title="stdlib-lora-layer.py"
def matvec(matrix: list[list[float]], vector: list[float]) -> list[float]:
    if not matrix or any(len(row) != len(vector) for row in matrix):
        raise ValueError("matrix/vector dimensions don't match")
    return [sum(a * b for a, b in zip(row, vector)) for row in matrix]


def close(left: list[float], right: list[float], tol: float = 1e-9) -> bool:
    return len(left) == len(right) and all(abs(a - b) <= tol for a, b in zip(left, right))


class LoRALinear:
    def __init__(self, weight: list[list[float]], rank: int, alpha: float):
        if not weight or not weight[0] or any(len(row) != len(weight[0]) for row in weight):
            raise ValueError("weight must be nonempty and rectangular")
        if rank <= 0:
            raise ValueError("rank must be positive")
        d_out = len(weight)
        d_in = len(weight[0])
        self.weight = [row[:] for row in weight]
        self.A = [
            [0.02 * ((i * d_in + j) % 7 - 3) for j in range(d_in)]
            for i in range(rank)
        ]
        self.B = [[0.0 for _ in range(rank)] for _ in range(d_out)]
        self.scaling = alpha / rank

    def delta_w(self) -> list[list[float]]:
        d_out = len(self.B)
        d_in = len(self.A[0])
        rank = len(self.A)
        return [
            [
                self.scaling * sum(self.B[i][k] * self.A[k][j] for k in range(rank))
                for j in range(d_in)
            ]
            for i in range(d_out)
        ]

    def forward(self, x: list[float]) -> list[float]:
        base = matvec(self.weight, x)
        adapter = [self.scaling * v for v in matvec(self.B, matvec(self.A, x))]
        return [u + v for u, v in zip(base, adapter)]


weight = [
    [1.0, 0.0, -0.5, 0.25],
    [0.0, 1.0, 0.5, -0.25],
    [0.5, -0.5, 1.0, 0.0],
]
layer = LoRALinear(weight, rank=2, alpha=4)
x = [1.0, -0.5, 0.25, 2.0]
base_out = matvec(weight, x)
starts_as_noop = close(layer.forward(x), base_out)

layer.B[0][0] = 1.0
layer.B[2][1] = -0.5
moved = layer.forward(x)
adapter_changed_output = not close(moved, base_out)

merged = [
    [w + d for w, d in zip(w_row, d_row)]
    for w_row, d_row in zip(weight, layer.delta_w())
]
merge_matches = close(matvec(merged, x), moved)
assert starts_as_noop and adapter_changed_output and merge_matches
assert close(matvec(layer.delta_w(), x), [v - b for v, b in zip(moved, base_out)])

print(f"starts_as_noop={starts_as_noop}")
print(f"adapter_changed_output={adapter_changed_output}")
print(f"merge_matches={merge_matches}")
print(f"base_out={[round(v, 4) for v in base_out]}")
print(f"adapted_out={[round(v, 4) for v in moved]}")
```

<!-- leetllm: output:start -->
```text title="LoRA layer output" output compact
starts_as_noop=True
adapter_changed_output=True
merge_matches=True
base_out=[1.375, -0.875, 1.0]
adapted_out=[1.285, -0.875, 1.105]
```
<!-- leetllm: output:end -->

## Choose rank from evidence

`sql-lora-v1` now has a working adapter path. The next question is whether rank 8 is enough or rank 64 is worth its cost. Rank $r$ controls adapter capacity, but module coverage, data quality, and learning rate can matter just as much. Hold target modules fixed and adapter parameters scale linearly with $r$:

| Rank ($r$) | Relative adapter parameters | What to compare |
|------------|-----------------------------|-----------------|
| 4 | 0.25x of rank 16 | Cheap capacity floor |
| 8 | 0.50x of rank 16 | Low-cost candidate |
| 16 | 1.00x | Reference candidate |
| 64 | 4.00x of rank 16 | Higher-capacity candidate only if evaluation warrants it |
| 256 | 16.00x of rank 16 | Expensive diagnostic, not an assumed improvement |

Use a held-out task set for the new schema and a regression set for capabilities you need to retain. A rank that lowers training loss while degrading general behavior isn't a better adapter. Look for the failure shape before buying capacity: underfit task examples suggest a capacity or coverage problem, while regression suggests data, scale, or target-selection trouble.

<!-- leetllm: test, output=show, output_title="Rank budget output" -->
```python title="rank-budget-scaling.py"
reference_rank = 16
reference_adapter_parameters = 1_249_280  # toy all-linear block from the earlier example

for rank in [4, 8, 16, 64, 256]:
    params = reference_adapter_parameters * rank // reference_rank
    multiplier = rank / reference_rank
    print(f"r={rank:>3} params={params:>8,} relative_to_r16={multiplier:.2f}x")
```

<!-- leetllm: output:start -->
```text title="Rank budget output" output compact
r=  4 params= 312,320 relative_to_r16=0.25x
r=  8 params= 624,640 relative_to_r16=0.50x
r= 16 params=1,249,280 relative_to_r16=1.00x
r= 64 params=4,997,120 relative_to_r16=4.00x
r=256 params=19,988,480 relative_to_r16=16.00x
```
<!-- leetllm: output:end -->

```checkpoint
Your platform team wants `sql-lora-v1` to cover three new warehouse schemas. You have 5,000 labeled question-to-SQL pairs, each averaging 512 tokens. Would you start with $r=8$ or $r=64$?
---
Compare a low-cost candidate such as $r=8$ or $r=16$ before paying four times rank-16 adapter state for $r=64$. Choose from held-out task accuracy, regression behavior, and memory/latency measurements rather than assuming a larger adapter fixes a data or prompt-format problem.
```

The LoRA and QLoRA papers report strong low-rank results on their studied tasks, but that doesn't make one rank universal.[^hu2021][^dettmers2023] Establish target coverage, define the two evaluation sets, then sweep rank only when the evidence says capacity is the bottleneck.

## Decide after the first controlled comparison

LoRA reduces trainable state. For `sql-lora-v1`, run the same held-out cases against each candidate, then compare task quality, regressions, memory use, and serving needs. Decide whether the new data calls for a broad change beyond the base model's learned domain.

If many task variants, fast iteration, or cheap deployment matter, LoRA is a strong first comparison even with a large dataset. If the target documents sit far from the <span data-glossary="pretraining">pretraining</span> mix and the hardware can update everything, full fine-tuning may justify its extra cost. `sql-lora-v1` looks narrower: the model already speaks the domain, and the rotation procedure changes one escalation behavior.

- **LoRA keeps the original checkpoint recoverable, but an active adapter can still regress behavior.** Fewer trainable parameters constrain the update and make <span data-glossary="rollback">rollback</span> or adapter disablement a config change. They don't guarantee that enabled-adapter responses preserve general capabilities, so evaluate policy quality and regressions together.
- **Full fine-tuning has higher capacity.** With a large corpus, enough memory, and a target domain far from pretraining, every eligible weight can move. Pay that cost only when held-out results show that the narrower update can't express the required behavior.

## Diagnose from the failure shape

An adapter run usually tells you which axis is wrong before it tells you which hyperparameter to change. Read the symptom against the path we just built: target modules affect where behavior can move, rank affects capacity, scale affects update strength, and merge affects serving. The following cases turn that map into concrete checks.

### When validation loss stays flat

If training loss barely moves, adapting only $W_Q$ and $W_V$ may be too narrow for the behavior change. Compare `all-linear` targeting, then inspect the matched module list. QLoRA reported its full-fine-tuning match when applying adapters to all linear layers in each Transformer block.[^dettmers2023] Choose targets for the task and evaluate held-out behavior.

### Adapter cost rises with rank but held-out quality doesn't

Rank may not be the limiting axis, or ordinary $\alpha/r$ scaling may make the comparison hard to read. Hold target coverage and scaling explicit, check data formatting, and try rsLoRA for a high-rank run with `use_rslora=True` instead of assuming more rank is enough.[^kalajdzievski2023][^huggingface2026peftlora]

### Changing rank causes overfitting or underfitting

Changing $r$ without changing $\alpha$ also changes the explicit scale. For an isolated ordinary-LoRA rank comparison, hold $\alpha/r$ constant. For an optimization search, log rank and alpha separately so a quality change has an interpretable cause. Don't present one alpha rule as universal.

### Inference latency is higher than expected

If one adapter owns the deployment, a runtime adapter path may be unnecessary overhead. Evaluate a merged artifact after training: $W_{\text{merged}} = W_0 + \frac{\alpha}{r}BA$ is a standard linear layer with no separate adapter path. Keep adapters separate intentionally when serving several tasks from one resident base.

### A multi-GPU job uses `device_map="auto"` as its sharding plan

That mixes inference dispatch with distributed training. `device_map="auto"` belongs to Accelerate's Big Model Inference path. Let the trainer or launcher select supported training placement, and use <span data-glossary="fsdp">FSDP</span>, <span data-glossary="deepspeed">DeepSpeed</span>, or a deliberate QLoRA setup when the model doesn't fit on one training device.[^huggingface2026acceleratebigmodel]

### LoRA on a sharded base

<!-- leetllm: audience:website:start -->Adapters don't change the FSDP / <span data-glossary="zero">ZeRO</span> requirements from [distributed training](/learn/distributed-training-fsdp-deepspeed-zero). Build the optimizer from `requires_grad=True` tensors only, wrap at block granularity, and remember that FSDP gathers each unit's frozen weights onto the GPU before the unit runs. Peak memory includes that materialization plus activations, so a 2,048-token `sql-lora-v1` batch can OOM even when the adapter file is tiny. Resume, preemption, and deciding whether to continue or export belong to the next chapter.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->Adapters don't change the FSDP / <span data-glossary="zero">ZeRO</span> requirements from [distributed training](/learn/distributed-training-fsdp-deepspeed-zero). Build the optimizer from `requires_grad=True` tensors only, wrap at block granularity, and remember that FSDP gathers each unit's frozen weights onto the GPU before the unit runs. Peak memory includes that materialization plus activations, so a 2,048-token `sql-lora-v1` batch can OOM even when the adapter file is tiny. The online companion's [Training Run Operations](/learn/training-run-operations) chapter covers resuming after preemption and deciding whether to continue or export.<!-- leetllm: audience:book:end -->

### PEFT notes say "LoRA" but the method trains prompt vectors

Soft prompt tuning learns input embeddings, prefix tuning learns per-layer prefix state, and LoRA learns low-rank updates inside weight matrices. Name the method by what trains. If the learned parameters don't form $A$ and $B$ inside a projection layer, it isn't LoRA.

### New special tokens never appear in generated output

Adding tokenizer IDs doesn't resize model tensors. Call `resize_token_embeddings(len(tokenizer))` before wrapping the model, then inspect input and output shapes. Resizing creates new rows; it doesn't train useful representations for them. `all-linear` excludes `lm_head`. For untied embeddings, train and save both the affected input embeddings and output head, or configure supported row-selective training. For tied weights, verify that the tying survives wrapping and saving. PEFT's `trainable_token_indices` support and weight-tying options are version-sensitive; inspect their behavior rather than assuming attention adapters learn new lexical rows.[^huggingface2026peftlora]

### Shape checks fail only at runtime

$A$ and $B$ may be transposed or initialized inconsistently. For $W_0 \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}$, use $A \in \mathbb{R}^{r \times d_{\text{in}}}$ and $B \in \mathbb{R}^{d_{\text{out}} \times r}$ so $BA$ matches $W_0$. Assert those dimensions while wrapping modules, and zero-initialize one factor so the adapter starts as a no-op.

## Production sweep starting points

When `sql-lora-v1` is ready for a run, don't start by sweeping every knob. Pick one reproducible baseline, change one or two axes, and log enough context to explain a win or regression. The candidates below are starting points, not production defaults:

| Hyperparameter | Initial candidates | Note |
|---|---|---|
| **Learning Rate** | `1e-4`, `2e-4` | Standard LoRA <span data-glossary="supervised-fine-tuning">SFT</span> sweep range (~10x full fine-tuning LR). |
| **Effective token batch** | Measure and hold stable | Compare token throughput and quality, not example count alone. |
| **Rank ($r$)** | 8, 16 | Add a higher-rank candidate only when evaluation shows capacity pressure. |
| **Alpha ($\alpha$)** | Choose an explicit $\alpha/r$ comparison | Record scaling with rank; don't hide it inside a default. |
| **Dropout** | 0.0, 0.05 | Decide from validation behavior and dataset size. |
| **Target Modules** | Q/V baseline versus `all-linear` | QLoRA-style coverage costs more adapter state but may improve quality. |
| **Gradient Checkpointing** | Off/on comparison if memory is tight | It reduces activation storage by adding recomputation cost. |

During training, log task evaluation and regression evaluation beside validation loss. Fewer trainable parameters don't make <span data-glossary="overfitting">overfitting</span> impossible. If training loss falls while held-out task quality falls, inspect data cleanup and dropout before rank. If neither loss nor policy quality moves, inspect formatting and target modules before buying more capacity.

## QLoRA: going further

Standard LoRA often keeps its frozen base in <span data-glossary="bf16">BF16</span> or FP16. That would leave a 65B base at roughly 130 GB before activations, which doesn't fit the 48 GB machine in our scenario. **QLoRA (Quantized LoRA)**[^dettmers2023] quantizes the *frozen base's supported weights* to **4-bit** and dequantizes as needed for computation. Other base tensors can remain in higher precision. Trainable factors also use higher precision, often FP32 in current PEFT. Gradients pass through the base computation to update adapters; the frozen weights have no parameter gradients or optimizer state.

Use consistent model sizes when comparing numbers. For a **65B** model, the raw storage floor and the paper's measured feasibility statement are different kinds of evidence:

| Method | Number you can defend | What it means |
|--------|-----------------------|---------------|
| Full FT under the 12-byte recipe above | 780 GB model states | $65\text{B} \times 12$ bytes, before activations |
| LoRA with a BF16/FP16 frozen base | 130 GB base-weight floor | $65\text{B} \times 2$ bytes, plus adapters and runtime memory |
| **QLoRA (NF4 base)** | Fine-tuned 65B on one 48 GB GPU in the paper | Memory depends on the complete training setup[^dettmers2023] |

The raw 4-bit payload is only one storage term. <span data-glossary="quantization">Quantization</span> metadata, adapters, adapter optimizer state, activations, and temporary buffers still contribute to the QLoRA training footprint. Calculate the floor below, then compare it with peak allocation from the actual run:

<!-- leetllm: test, output=show, output_title="QLoRA storage floor output" -->
```python title="qlora-storage-floor.py"
parameters_billion = 65
bf16_base_gb = parameters_billion * 2
nf4_raw_payload_gb = parameters_billion * 4 / 8
double_quant_overhead_bits_per_param = 8 / 64 + 32 / (64 * 256)
nf4_plus_constants_gb = parameters_billion * (4 + double_quant_overhead_bits_per_param) / 8

print(f"bf16_frozen_base_floor_GB={bf16_base_gb:.1f}")
print(f"nf4_raw_payload_GB={nf4_raw_payload_gb:.1f}")
print(f"nf4_plus_quant_constants_GB={nf4_plus_constants_gb:.1f}")
print("paper_device_capacity_GB=48")
```

<!-- leetllm: output:start -->
```text title="QLoRA storage floor output" output compact
bf16_frozen_base_floor_GB=130.0
nf4_raw_payload_GB=32.5
nf4_plus_quant_constants_GB=33.5
paper_device_capacity_GB=48
```
<!-- leetllm: output:end -->

The output is a payload estimate, not a fit guarantee. Activations still scale with sequence length and micro-batch size, so a long-context QLoRA run can OOM even when the quantized base fits.

QLoRA combined three memory techniques. In the paper's evaluated tasks, that combination preserved 16-bit fine-tuning performance while making 4-bit adapter training practical:

1. **NormalFloat4 (NF4):** A 4-bit index selects one of sixteen nonuniform values, chosen using a normal-distribution model and normalized to $[-1,1]$. A block's absolute maximum rescales its weights into that range. The actual codebook has seven negative values, zero, and eight positive values. It isn't a sign/exponent/fraction encoding or a guarantee of minimum MSE for arbitrary weights. Constructing levels directly from the normal inverse CDF's $Q(0)$ and $Q(1)$ would give infinite endpoints; use the finite codebook instead.[^dettmers2023][^bitsandbytes2026nf4Implementation]
2. **Double quantization:** One FP32 scale per 64 weights costs $32/64=0.5$ bits per weight. Quantizing those scales to eight-bit values, with an FP32 scale per 256 of them, gives $8/64+32/(64\cdot256)\approx0.127$ bits per weight. The paper calls its scale format eight-bit floats; current bitsandbytes stores indices into an eight-bit codebook and also keeps a centering offset. This large-tensor estimate saves about 3.03 decimal GB at 65B, excluding small extra metadata and incomplete blocks.[^dettmers2023][^bitsandbytes2026nf4Implementation]
3. **Paged optimizers:** CUDA managed memory lets optimizer-state pages migrate between GPU and host under memory pressure. This differs from ordinary pinned host buffers. Paging can make room during activation peaks, but doesn't eliminate all OOM causes and transfers can slow the iteration. It doesn't require the backward computation and optimizer step to run simultaneously. The paper's reported equal speed at batch size 16 belongs to its 65B/48 GB comparison.[^dettmers2023][^bitsandbytes2026pagedOptimizers]

Trace one normalized block with a rounded copy of the published NF4 codebook. Can positive and negative values use exactly symmetric levels? Does zero survive? This cell checks lookup arithmetic, not packing, double quantization, a CUDA kernel, or task accuracy:

<!-- leetllm: test, output=show, output_title="NF4 lookup output" -->
```python title="nf4_lookup.py"
codebook = [-1., -.696193, -.525073, -.394917, -.284441, -.184773, -.091050,
            0., .079580, .160930, .246112, .337915, .440710, .562617, .722957, 1.]
weights = [-.2, 0., .2, 2.]
scale = max(abs(value) for value in weights)
indices = [min(range(16), key=lambda i: abs(value / scale - codebook[i]))
           for value in weights]
restored = [scale * codebook[i] for i in indices]
assert len(codebook) == 16 and indices[1] == 7 and restored[1] == 0
assert sum(value < 0 for value in codebook) == 7
assert sum(value > 0 for value in codebook) == 8
print("four_bit_indices=", indices)
print("dequantized_weights=", [round(value, 5) for value in restored])
```

<!-- leetllm: output:start -->
```text title="NF4 lookup output" output compact
four_bit_indices= [6, 7, 8, 15]
dequantized_weights= [-0.1821, 0.0, 0.15916, 2.0]
```
<!-- leetllm: output:end -->

Keep four precision choices separate: packed base storage, dequantized base computation, adapter parameter storage, and optimizer state. The paper uses BF16 computation; the fragment below requests that compute dtype but doesn't force every tensor to BF16. PEFT's k-bit preparation can upcast unquantized tensors, and adapter promotion can leave factors in FP32.[^huggingface2026peftTroubleshooting][^peft2026kbitPreparation]

Dequantization's temporary storage depends on the implementation. As of bitsandbytes 0.50.2, the backward path calls `dequantize_4bit` to materialize a weight matrix before computing input gradients. Don't assume the entire training path dequantizes only into SRAM/registers or has no additional device-memory allocation.[^bitsandbytes2026fourBitAutograd] Frozen base weights have no parameter gradients; gradients through their operations can still be needed upstream.

QLoRA is a strong candidate when a frozen BF16 or FP16 base doesn't fit on the available training hardware. It trades memory for quantization complexity. Compare task quality and regressions against an affordable higher-precision baseline so a memory win doesn't hide a behavior loss.

The following GPU setup fragment follows PEFT's QLoRA path: quantize at load time, prepare for k-bit training, then add adapters.[^huggingface2026peftquantization] It requires a compatible `bitsandbytes` installation and BF16-capable hardware. It hasn't been run as a full GPU training job here. Pin the base revision and library versions, supply the trainer/data configuration, and measure peak memory before claiming the run fits.

```python title="qlora-peft-setup.py"
import torch
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
)
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B",
    quantization_config=quantization_config,
    dtype=torch.bfloat16,
)
model = prepare_model_for_kbit_training(model)
model = get_peft_model(
    model,
    LoraConfig(r=16, lora_alpha=32, target_modules="all-linear", task_type="CAUSAL_LM"),
)
```

One export option is to reload the exact source base revision in BF16 or FP16, attach the saved adapter, merge, then optionally re-quantize. This isn't numerically identical to the training path: the adapter trained against a quantized approximation of the base. Re-evaluate the merged and re-quantized artifacts separately. Quantized merge support depends on the backend; don't assume every format supports the same operation.

## Keep the base shared when serving many adapters

A merged artifact makes one adapter easy to run. Separate merged artifacts duplicate base weights, while dynamic adapters can share one resident base. Keep `sql-lora-v1` unmerged when several tasks should share that base; a few popular adapters can still justify separate merged deployments.

<figure>
  <img src="illustrations/_generated/lora_serving_modes_dark.png" alt="Merged LoRA checkpoints remove the adapter branch; dynamic serving shares a base across requests using different adapters. An assumed 14 GB base and fifty 128 MB adapter artifacts total 20.4 GB, versus 700 GB for fifty merged artifacts. Device residency, KV caches, and runtime buffers are separate budgets. Punica uses SGMV; S-LoRA jointly pages adapter and KV tensors." />
  <figcaption>Merging removes the low-rank inference branch, while dynamic routing retains it to share the base. The 700 GB and 20.4 GB figures count assumed artifact bytes, not GPU memory or measured serving capacity. Punica and S-LoRA illustrate distinct batching and memory techniques.</figcaption>
</figure>

When deploying fine-tuned models to production, choose between two serving modes:

- **Merged artifact:** Fold $\frac{\alpha}{r}BA$ into the base and serve it through an engine that supports that architecture and dtype. There are no adapter-factor tensors or low-rank kernels in the exported model. Ordinary inference still has kernel dispatch, KV caches, and other runtime costs; merging doesn't promise zero overall latency overhead from every deployment change.
- **Shared base with dynamic adapters:** Route requests to their adapters while keeping the common base resident. Adapters can be loaded as needed; how many fit or run concurrently depends on their ranks, targets, dtype, request shapes, and the engine. Fifty merged 14 GB artifacts would occupy 700 GB on disk, but don't have to be resident on GPUs simultaneously. Fifty **assumed** 128 MB adapters plus one 14 GB base occupy 20.4 GB as artifacts; host/GPU residency is a separate calculation.

Modern multi-tenant serving frameworks make dynamic adapter routing practical through two key innovations:

1. **Heterogeneous batching (Punica):** The paper's custom primitive is **Segmented Gather Matrix-Vector multiplication (SGMV)**.[^chen2023punica] Requests with different adapters can share base computation instead of requiring separate whole-model passes. With tokens stored as rows and our weight orientation, the base projection is $XW_0^T$ and adapter i adds $\frac{\alpha_i}{r_i}(X_iA_i^T)B_i^T$. Adapter selection is per request; the low-rank operations use the corresponding factors.
2. **Unified Paging (S-LoRA):** A common GPU pool stores both KV-cache tensors and adapter weights in non-contiguous pages. Prefetching upcoming adapters reduces loading waits; the pool reduces fragmentation from changing sequence lengths and adapter ranks.[^sheng2023] This engine-managed paging differs from the CUDA managed-memory optimizer mechanism above. Neither paper establishes the toy artifact calculation as a GPU serving benchmark.

Fifty merged 14 GB checkpoints cost 700 GB, while one 14 GB base plus 50 small adapters costs far less.

<!-- leetllm: test, output=show, output_title="Adapter serving storage output" -->
```python title="multi-adapter-storage.py"
base_checkpoint_gb = 14
adapter_mb = 128
tenant_count = 50

merged_full_models_gb = base_checkpoint_gb * tenant_count
shared_base_plus_adapters_gb = base_checkpoint_gb + adapter_mb * tenant_count / 1000

print(f"merged_full_models_GB={merged_full_models_gb:.1f}")
print(f"shared_base_plus_adapters_GB={shared_base_plus_adapters_gb:.2f}")
print(f"storage_reduction_x={merged_full_models_gb / shared_base_plus_adapters_gb:.1f}")
```

<!-- leetllm: output:start -->
```text title="Adapter serving storage output" output compact
merged_full_models_GB=700.0
shared_base_plus_adapters_GB=20.40
storage_reduction_x=34.3
```
<!-- leetllm: output:end -->

## Advanced: separate magnitude from direction

A LoRA variant called **DoRA (Weight-Decomposed Low-Rank Adaptation)**[^liu2024] asks whether separating weight magnitude from direction can improve adaptation.

For a nonzero weight vector, magnitude is $m=\|w\|_2$ and unit direction is $v=w/\|w\|_2$. Liu et al.'s VL-BART query/value case study compared changes in these quantities across layers and checkpoints:

- Full fine-tuning showed correlation -0.62 between the study's magnitude-change and directional-change statistics.
- LoRA showed 0.83, and DoRA showed -0.31.

Those are measured patterns in that case study, not universal correlations or proof that an additive update cannot rotate a vector without changing its norm. Full fine-tuning also applies additive weight updates; DoRA makes the magnitude parameter explicit.

DoRA resolves this by explicitly factorizing each weight into a learnable magnitude vector and a directional matrix updated via low-rank adaptation. For a PyTorch linear weight $W_0 \in \mathbb{R}^{d_{\text{out}}\times d_{\text{in}}}$, the row-wise formulation is:

$$
V = W_0 + \frac{\alpha}{r}BA, \qquad W_{\text{DoRA}} = m \odot \frac{V}{\|V\|_{\text{row}}}
$$

where:
- $V \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}$ is the directional matrix carrying the standard LoRA update.
- $\|\cdot\|_{\text{row}}$ takes the row-wise $L_2$ norm (`dim=1` in PyTorch). The paper uses the transposed, column-vector convention; don't transfer its axis label unchanged to this layout.
- $m \in \mathbb{R}^{d_{\text{out}}}$ is initialized to $\|W_0\|_{\text{row}}$ and broadcast as $(d_{\text{out}},1)$. The displayed divisions assume nonzero row norms.
- $\odot$ denotes element-wise broadcast multiplication across rows.

This design preserves the initialization invariant: on step zero, $B = 0 \implies V = W_0$. Because $m^{(0)} = \|W_0\|_{\text{row}}$, the initial weight is:
$$
W^{(0)} = \|W_0\|_{\text{row}} \odot \frac{W_0}{\|W_0\|_{\text{row}}} = W_0
$$
The model begins with zero perturbation to the pretrained base weights.

The forward equation doesn't specify the whole training algorithm. The paper's Section 4.3 and PEFT 0.20.0 detach the denominator's norm from the gradient graph: its value is recomputed from the updated direction, but backward treats that value as constant. Differentiating the displayed normalization without this stop-gradient gives a different training rule.[^liu2024][^huggingface2026peftdora]

Make that distinction measurable. With one row $v=(3,4)$, magnitude $m=5$, and input $x=(1,0)$, both forward paths output 3. Differentiating $5v_1/\|v\|$ normally gives $(0.64,-0.48)$. Treating the denominator as constant gives $(1,0)$. The following PEFT check sets $A=I$ and $B=0$, so B's gradient exposes that difference directly:

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="DoRA backward check" -->
```python title="dora-backward-check.py"
import torch
from torch import nn
from peft import LoraConfig, get_peft_model

base = nn.Sequential(nn.Linear(2, 1, bias=False))
with torch.no_grad():
    base[0].weight.copy_(torch.tensor([[3., 4.]]))
model = get_peft_model(base, LoraConfig(
    r=2, lora_alpha=2, target_modules=["0"], use_dora=True,
))
layer = model.base_model.model[0]
with torch.no_grad():
    layer.lora_A["default"].weight.copy_(torch.eye(2))
    layer.lora_B["default"].weight.zero_()
output = model(torch.tensor([[1., 0.]]))
output.sum().backward()
peft_gradient = layer.lora_B["default"].weight.grad.flatten()

direction = torch.tensor([3., 4.], requires_grad=True)
normalized_output = 5 * direction[0] / direction.norm()
full_gradient, = torch.autograd.grad(normalized_output, direction)
torch.testing.assert_close(output.flatten(), normalized_output.detach().view(1))
torch.testing.assert_close(peft_gradient, torch.tensor([1., 0.]))
torch.testing.assert_close(full_gradient, torch.tensor([.64, -.48]))
print("same forward output:", round(output.item(), 2))
print("full-normalization gradient:", [round(v, 2) for v in full_gradient.tolist()])
print("PEFT detached-norm gradient:", [round(v, 2) for v in peft_gradient.tolist()])
```

<!-- leetllm: output:start -->
```text title="DoRA backward check" output compact
same forward output: 3.0
full-normalization gradient: [0.64, -0.48]
PEFT detached-norm gradient: [1.0, 0.0]
```
<!-- leetllm: output:end -->

Matching forward values can coexist with different training behavior between a handwritten DoRA implementation and PEFT. The detached denominator can change the directional matrix's norm during an update; the next forward recomputes that norm. The explicit magnitude still controls the normalized row's length.

During training, $BA$ changes the directional matrix while $m$ separately controls row magnitudes. When training concludes, a supported DoRA adapter can be merged into one dense matrix, removing the adapter and normalization branches from inference:
$$
W_{\text{merged}} = m \odot \frac{W_0 + \frac{\alpha}{r}BA}{\|W_0 + \frac{\alpha}{r}BA\|_{\text{row}}}
$$

PEFT exposes DoRA with `use_dora=True`.[^huggingface2026peftdora] For a square layer ($d_{\text{in}} = d_{\text{out}} = d$), adding $d$ magnitude scalars adds only $d / (2rd) = 1/(2r)$ extra parameters over standard LoRA (just 3.12% extra trainable parameters at $r=16$). Before merging, training requires additional normalization steps, so evaluate both quality gains and training throughput.

<!-- leetllm: test, output=show, output_title="DoRA parameter output" -->
```python title="dora-extra-parameters.py"
import math

d_in = 6
d_out = 4
rank = 2
lora_params = rank * (d_in + d_out)
dora_magnitude_params = d_out

# A rectangular weight makes a row/column mix-up visible.
weight = [
    [1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [0.0, 2.0, 0.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 3.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 4.0, 1.0, 1.0],
]
row_norms = [math.sqrt(sum(value ** 2 for value in row)) for row in weight]
assert d_in != d_out
assert len(row_norms) == d_out
assert dora_magnitude_params == len(row_norms)
assert len(weight) == d_out
assert all(len(row) == d_in for row in weight)

square_d_in = square_d_out = 4096
square_rank = 16
square_lora_params = square_rank * (square_d_in + square_d_out)
square_dora_magnitude_params = square_d_out

print("lora_adapter_params=", lora_params)
print("dora_extra_magnitude_params=", dora_magnitude_params)
print(f"dora_extra_vs_lora={dora_magnitude_params / lora_params:.2%}")
print("example_weight_shape=", (d_out, d_in))
print("example_magnitude_broadcast_shape=", (len(row_norms), 1))
print("example_row_norms=", [round(value, 3) for value in row_norms])
print("square_lora_adapter_params=", square_lora_params)
print("square_dora_extra_magnitude_params=", square_dora_magnitude_params)
print(f"square_dora_extra_vs_lora={square_dora_magnitude_params / square_lora_params:.2%}")
```

<!-- leetllm: output:start -->
```text title="DoRA parameter output" output compact
lora_adapter_params= 20
dora_extra_magnitude_params= 4
dora_extra_vs_lora=20.00%
example_weight_shape= (4, 6)
example_magnitude_broadcast_shape= (4, 1)
example_row_norms= [1.0, 2.0, 3.0, 4.243]
square_lora_adapter_params= 131072
square_dora_extra_magnitude_params= 4096
square_dora_extra_vs_lora=3.12%
```
<!-- leetllm: output:end -->

The rectangular count makes the dimension visible: rank 2 on a four-by-six PyTorch weight has 20 LoRA parameters and four magnitude scalars. Its final row norm is $\sqrt{18}$, not 4, because the whole row contributes. The square example alone would hide a transposed-axis bug.

Check that axis against the same PEFT version used above. A six-input, four-output linear layer should expose four magnitude parameters:

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="PEFT DoRA axis check" -->
```python title="peft-dora-axis.py"
import torch
from torch import nn
from peft import LoraConfig, get_peft_model

base = nn.Sequential(nn.Linear(6, 4, bias=False))
model = get_peft_model(base, LoraConfig(
    r=2, lora_alpha=2, target_modules=["0"], use_dora=True,
))
layer = model.base_model.model[0]
magnitude = layer.lora_magnitude_vector["default"].weight
assert magnitude.shape == (4,)
torch.testing.assert_close(magnitude, layer.base_layer.weight.norm(dim=1))
print("stored magnitude shape:", tuple(magnitude.shape))
```

<!-- leetllm: output:start -->
```text title="PEFT DoRA axis check" output compact
stored magnitude shape: (4,)
```
<!-- leetllm: output:end -->

## Practice: change one constraint

1. In the CPU example, replace `all-linear` with Q/V targeting. Expect 64 + 48 = 112 trainable parameters, so update the assertion to match. The base weight count stays unchanged.
2. Set both LoRA factors to zero before the backward pass. Confirm neither learns. Restore random A and zero B, then verify A receives a gradient on the second optimization step.
3. Re-run merge equivalence after nonzero adapter updates. Save and reload a separate adapter against a fresh copy of the exact base; compare logits with dropout disabled.
4. For a real model, budget frozen weights, trainable state, and activation memory separately. No result above shows that a 7B or 65B GPU run fits or improves task quality.

## What to check before moving on

| Check | Evidence you should produce |
|-------|-----------------------------|
| Factor shapes | A and B match each selected projection, including narrower GQA key/value layers. |
| Learning path | Initial no-op, nonzero first B gradient, later A gradient, and unchanged base weights. |
| Export | Saved adapter and merged model checked against the exact base revision in evaluation mode. |
| Memory | Decimal storage arithmetic separated from measured device peak allocation and reserved memory. |
| Quality | Held-out task and regression results, with rank, scale, data, and target coverage recorded. |

Those checks are what `sql-lora-v1` can show: which weights moved, whether the base stayed frozen, and whether the new schema conventions survived held-out review. The run that uses them still has to stay honest under preemption and batch scaling.

**Additional worked practice**

```checkpoint
An update family is ΔW = θI₄. Only scalar θ is optimized, and the current θ is 0.2. Which optimization-coordinate count and matrix rank describe this update?
---
One free coordinate; rank 4. One scalar controls all four nonzero diagonal entries, so there is one optimization coordinate. The four independent columns give rank 4. Intrinsic optimization dimension and matrix-update rank need not coincide.
```

```checkpoint
Use the taught large-tensor nested-scale estimate with one 8-bit code per 64 weights and one FP32 parent scale per 256 codes. For one billion weights, which approximate metadata cost follows, excluding offsets, incomplete blocks and other small records?
---
0.127 bits per weight; 15.869 decimal MB. The estimate is 8/64 + 32/(64×256) = 0.126953125 bits per weight. Multiply by 1e9, divide by 8 and then 1e6 to get 15.869140625 MB. Omitting the parent scales gives 0.125; retaining FP32 scales gives 0.5. These are scale-metadata costs, separate from the four-bit weight payload.
```

```checkpoint
A quantized adapter job still runs out of memory during an activation-heavy backward pass. The proposed repair is a paged optimizer using CUDA managed memory. Which assessment describes the mechanism and the next check?
---
Move optimizer-state pages between GPU and host; inspect the full peak and migration cost under the same workload. Paged optimizers manage optimizer-state residency using CUDA managed memory. They can relieve a peak but do not eliminate activations or other allocations, and migrations can cost time. This differs from pinned host buffers and engine-managed adapter/KV paging.
```

```checkpoint
DoRA adapts a PyTorch Linear weight with 3 output rows and 5 input columns at rank 2. Under row-wise magnitudes, how many total trainable LoRA-factor-plus-magnitude values are added?
---
19 values: 10 in A, 6 in B and 3 magnitudes. A has 2×5 = 10 values and B has 3×2 = 6. DoRA adds one magnitude for each output row, so 16+3 = 19. Five magnitudes uses the input axis; a square example would hide that axis error.
```

```checkpoint
An adapter was trained against a four-bit approximation of base revision R. For export, the team reloads revision R in BF16, merges and then quantizes the merged model again. Which artifact evaluation contract follows?
---
Compare merged BF16 and re-quantized exports separately; retain the source base and adapter for rollback. The training base was a quantized approximation. BF16 reload changes numerical values, and re-quantizing the merged result adds another approximation. Evaluate each deployed artifact and preserve the original components for rollback; merging does not package optimizer history.
```

```checkpoint
Assume a 9 GB base artifact, twelve 80 MB adapter artifacts and decimal units. Compare twelve merged 9 GB artifacts with the shared-base artifact set. Which storage calculation and scope are correct?
---
Merged 108 GB; shared 9.96 GB; calculate device residency from the separate runtime inventory. Merged artifacts total 12×9 = 108 GB. Sharing totals 9+12×80/1000 = 9.96 GB. These are artifact bytes; GPU residency additionally depends on runtime state, KV caches, tensor dtypes and engine support. Treating MB as a tenth of a GB gives the wrong shared total.
```

```mastery-quiz
[
  {
    "question": "A bias-free layer has 12 outputs and 20 inputs. It receives ordinary LoRA with rank 3. How many trainable factor parameters are added, and what fraction of the 240 base weights is that?",
    "options": [
      "60 parameters; 25%.",
      "96 parameters; 40%.",
      "240 parameters; 100%.",
      "720 parameters; 300%."
    ],
    "answer": "96 parameters; 40%.",
    "explanation": "A has 3×20 = 60 values and B has 12×3 = 36, totaling 96. Dividing 96 by 240 gives 40%. Counting only A drops the expansion factor; counting the dense update or multiplying it by rank counts a different object."
  },
  {
    "question": "A scalar LoRA adapter adds sB(Ax) to the base output. A = 2, B = 0, x = 3, and s = 0.5. The incoming loss gradient is g = −4. What are the loss gradients of A and B before any optimizer update?",
    "options": [
      "A gradient −12; B gradient 0.",
      "A gradient 0; B gradient −24.",
      "A gradient 0; B gradient −12.",
      "A gradient −24; B gradient 0."
    ],
    "answer": "A gradient 0; B gradient −12.",
    "explanation": "B receives Ax = 2 × 3 = 6 as input. Its loss gradient is s × g × 6 = 0.5 × (−4) × 6 = −12. The path back to A passes through B, so A's gradient is s × g × B × x = 0. Getting −24 for B leaves out the scale. Putting −12 on A swaps the two gradients. Putting −24 on A makes both mistakes."
  },
  {
    "question": "An ordinary LoRA experiment changes rank from 6 to 24 while alpha stays 24. What happens to its explicit multiplier, and which new alpha would preserve the old multiplier at rank 24?",
    "options": [
      "Multiplier 4→1; use alpha 96.",
      "Multiplier 4→4; use alpha 24.",
      "Multiplier 1→4; use alpha 6.",
      "Multiplier 4→2; use alpha 48."
    ],
    "answer": "Multiplier 4→1; use alpha 96.",
    "explanation": "Ordinary scale is alpha/r: 24/6 = 4 and 24/24 = 1. Preserving scale 4 at rank 24 needs alpha 96. A square-root change describes a different scaling convention; matching explicit scale does not guarantee matching learned update norm."
  },
  {
    "question": "An attention block has output-by-input shapes Q = 12×12, K = 4×12, V = 4×12 and O = 12×12. At LoRA rank 3, how many trainable factor parameters does adapting Q and V add? How many does adapting all four projections add?",
    "options": [
      "Q/V 144; all attention 288.",
      "Q/V 144; all attention 216.",
      "Q/V 120; all attention 168.",
      "Q/V 120; all attention 240."
    ],
    "answer": "Q/V 120; all attention 240.",
    "explanation": "Each adapter has three parameters per input and three per output. Q and O each add 3 × (12 + 12) = 72. K and V each add 3 × (12 + 4) = 48. Q and V together add 120. Adding K and O brings the total to 240. The counts 144 and 288 treat K and V as 12×12. The counts 120 and 168 use the given widths but leave O out of the second total. The counts 144 and 216 make both mistakes."
  },
  {
    "question": "A model uses untied input embeddings and output weights. New tokenizer IDs are added, but only attention projections are wrapped with trainable LoRA factors. The new IDs have no useful learned input or output rows. Which repair follows the lexical training contract?",
    "options": [
      "Resize before wrapping; train the input rows and keep output rows frozen, then verify both after reload.",
      "Resize before wrapping; train the affected input and output rows, then verify both after reload.",
      "Keep existing tensor shapes; train higher-rank attention factors, then verify tokenizer IDs after reload.",
      "Resize after adapter training; infer new rows from the factor rank, then verify their shapes after reload."
    ],
    "answer": "Resize before wrapping; train the affected input and output rows, then verify both after reload.",
    "explanation": "Tokenizer IDs do not resize or train model tensors. With untied weights, the input representation and output readout are different parameters. Configure supported full-module or row-selective training and save/reload both; attention-rank changes do not directly train these frozen rows."
  },
  {
    "question": "At its peak, a LoRA training run uses 18 GB for gathered frozen weights, 12 GB for activations, 4 GB for temporary buffers and 0.4 GB for adapter state. You halve the adapter state and keep the other allocations fixed. What is the revised peak, and how far above or below a 32 GB GPU’s capacity is it?",
    "options": [
      "34.4 GB, or 2.4 GB above capacity.",
      "25.2 GB, or 6.8 GB below capacity.",
      "34.2 GB, or 2.2 GB above capacity.",
      "30.2 GB, or 1.8 GB below capacity."
    ],
    "answer": "34.2 GB, or 2.2 GB above capacity.",
    "explanation": "The adapter state falls to 0.2 GB. The revised peak is 18 + 12 + 4 + 0.2 = 34.2 GB, which exceeds 32 GB by 2.2 GB. The 34.4 GB total keeps the original adapter state. The 25.2 GB total also halves the gathered weights. The 30.2 GB total leaves out the temporary buffers."
  },
  {
    "question": "For a nonzero NF4 block scale of 4, one weight is 0.6. Its nearest candidate normalized levels are code 8: 0.079580, code 9: 0.160930 and code 10: 0.246112; other levels are farther away. Which chosen code and reconstructed weight follow nearest-level lookup?",
    "options": [
      "Code 9; 0.643720.",
      "Code 8; 0.318320.",
      "Code 10; 0.984448.",
      "Code 9; 0.160930."
    ],
    "answer": "Code 9; 0.643720.",
    "explanation": "Normalize 0.6/4 = 0.15, nearest to 0.160930. Code 9 reconstructs 4×0.160930 = 0.643720. The other levels are farther from the normalized input, and returning the codebook level without multiplying by the block scale leaves the reconstruction in the wrong units."
  },
  {
    "question": "A DoRA layer has a directional row V = [5, 12], a magnitude parameter m = 13 and an input x = [1, 0]. It computes y = m(V·x)/‖V‖ using the Euclidean norm. What is y? How does its gradient with respect to V compare when you differentiate the norm and when you hold it fixed during backward?",
    "options": [
      "Output 5, full gradient [144/169, −60/169], detached gradient [1, 0].",
      "Output 13, full gradient [144/169, −60/169], detached gradient [144/169, −60/169].",
      "Output 13, full gradient [1, 0], detached gradient [144/169, −60/169].",
      "Output 5, full gradient [1, 0], detached gradient [1, 0]."
    ],
    "answer": "Output 5, full gradient [144/169, −60/169], detached gradient [1, 0].",
    "explanation": "The row length is 13 and V·x is 5, so y = 13 × 5 / 13 = 5. Holding the norm fixed gives the direct gradient mx/13 = [1, 0]. Differentiating the norm subtracts the part of this gradient along V, giving [1, 0] − (5/169)[5, 12] = [144/169, −60/169]. Using [1, 0] twice skips this subtraction in the full derivative. Both answers with output 13 report the row length. The one with two fractional vectors also subtracts the projection when the norm is fixed. The one with [1, 0] as the full gradient swaps the two backward rules."
  },
  {
    "question": "A supplied layer has W₀ = I₂, A = [1,2], B = [0.5,−1]ᵀ, rank 1 and alpha 3. With input x = [1,2]ᵀ, what output does the correctly merged ordinary LoRA layer produce?",
    "options": [
      "[3.5,−3]ᵀ",
      "[7.5,−15]ᵀ",
      "[16,−28]ᵀ",
      "[8.5,−13]ᵀ"
    ],
    "answer": "[8.5,−13]ᵀ",
    "explanation": "Ax = 5 and scale = 3. The correction is 3×[0.5,−1]×5 = [7.5,−15]. Add the base [1,2] to obtain [8.5,−13]. The other outputs omit the explicit scale, omit the base or add the adapter twice. A floating-point implementation still needs an evaluation-mode tolerance comparison."
  },
  {
    "question": "You evaluate two candidate adapters on 50 task cases and 50 regression cases. Release requires at least 90% correct on each set. P gets 48 task cases and 43 regression cases correct. Q gets 45 correct on each set. Which adapters qualify for release?",
    "options": [
      "P only.",
      "Both P and Q.",
      "Q only.",
      "Neither P nor Q."
    ],
    "answer": "Q only.",
    "explanation": "Each evaluation requires 45 correct out of 50. Q scores exactly 90% on each and qualifies. P scores 96% on the task set and 86% on regression. Choosing P alone for its higher task score overlooks the regression result. Releasing both would accept P’s pooled 91%, which hides that failure. Holding both would reject Q for meeting the minimum exactly."
  }
]
```

> **Next:** Continue to [Training Run Operations](/learn/training-run-operations). `sql-lora-v1` showed which weights can move cheaply. Training ops is next because that adapter job still has to survive preemption, keep global batch and learning-rate scaling honest, and justify LoRA versus full SFT, QLoRA, continued pretraining, or distillation before preference training starts.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Your SQL analytics assistant already answers routine questions. Now a new warehouse schema renames key tables and adds join rules. You have 5,000 labeled question-to-SQL pairs and one training GPU with 48 GB of memory. Your model has 65 billion parameters, and full fine-tuning it would need 780 GB just to hold its training state, before a single activation is computed.

You could rent a cluster. But stop and ask what the job actually is. The model already knows English, tables, joins, and aggregates. You want it to change one schema-specific behavior. Do you really need to move 65 billion numbers independently to do that?

Low-Rank Adaptation, or LoRA, bets that you don't.[^hu2021] It freezes the pretrained weights and learns a small additive update inside selected linear layers. The original experiments on a 175-billion-parameter GPT-3 reported roughly 10,000 times fewer trainable parameters and three times lower GPU memory than full fine-tuning with Adam. The arithmetic below will show you how to work out yours. The SFT objective from two chapters ago stays the same. LoRA changes which numbers are allowed to learn.

## Count what training keeps

Start with why full fine-tuning is so expensive. Training stores far more than the model. For every trainable parameter it also keeps a gradient and, with Adam, two moments. QLoRA's authors put regular 16-bit fine-tuning of this model above 780 GB.[^dettmers2023] Here is how you get that number: 16-bit weights and gradients with FP32 moments, or 12 bytes per parameter. That is a lean budget, but it is not the setup the mixed precision chapter recommends:

| What | Bytes each | Total |
| --- | ---: | ---: |
| Weights | 2 | 130 GB |
| Gradients | 2 | 130 GB |
| Adam first moment | 4 | 260 GB |
| Adam second moment | 4 | 260 GB |
| **Model state** | **12** | **780 GB** |

Add a separate FP32 master copy, and that becomes 16 bytes each and 1,040 GB. All of these use decimal gigabytes. Now freeze the base. A frozen parameter still takes part in every computation, but it needs no gradient and no optimizer state. Everything below the first row disappears, leaving 130 GB plus a small adapter.

That is a huge saving, but it still does not fit on your 48 GB device. Getting there needs a second step, which changes how the frozen weights are stored. Keep your eye on the scale in the figure: all three bars share one axis, and the GPU is that thin line at the left.

<figure>
  <img src="illustrations/_generated/lora_memory_budget_dark.png" alt="Three bars on one gigabyte axis from 0 to 800, with a 48 GB device line near the left edge. Full fine-tuning state is 780 GB, split into weights, gradients, and two Adam moments. A frozen 16-bit base is 130 GB. An ideal NF4 base with scales is 33.5 GB, inside the line. A zoomed strip shows 32.5 GB of payload, 1 GB of scales, and 14.5 GB left on the 48 GB device." />
  <figcaption>Compare each bar with the device line. The lower bars count only the frozen base, so the 14.5 GB left over in the zoomed strip must still hold adapters, activations, and everything else a live job needs.</figcaption>
</figure>

There is a trap in that bar chart: it leaves out activations, and they do not go away. Backward still has to propagate through the frozen operations to reach adapters in earlier layers, so the base network runs in full and its intermediates get saved. Many of them grow with sequence length, batch size, and depth. Run your examples at 2,048 tokens each, and activations can outweigh the adapter state, or even the base weights. So a tiny adapter file tells you nothing about peak training memory. Measure the peak at your real sequence length and batch size, and when you hit a limit, try gradient checkpointing, also called activation recomputation, which keeps fewer activations on the forward pass and recomputes the rest during backward. As of TRL 1.17 it is already on by default.[^huggingfaceTrlPacking2026] Try a smaller micro-batch too, before you start shrinking rank.

## Factor the change to one layer

Why would a small update be enough? Research on pretrained models found they can approach full fine-tuning by optimizing a surprisingly small subspace of parameters.[^aghajanyan2020] Hu and colleagues took that as inspiration for a related bet, the intrinsic rank hypothesis: the update a task needs can be well approximated by a low-rank matrix.[^hu2021] That is a hypothesis you test on your task. It holds up better when the task sits close to what the model already does.

Take one 4096-by-4096 projection. Updating it directly means training 16,777,216 values. LoRA instead writes the update as the product of two thin matrices, $A$ with shape $r\times d_{\mathrm{in}}$ and $B$ with shape $d_{\mathrm{out}}\times r$, where $r$ is called the rank:

$$
h=W_0x+sB(Ax),\qquad s=\frac{\alpha}{r}.
$$

$BA$ has the same shape as $W_0$, and its rank is at most $r$. Picture it as a narrow pipe beside the main road: the input gets squeezed down to $r$ numbers, expanded back out, and added to the base result. The width of that pipe limits how many independent directions the correction can express. At rank 16, $A$ and $B$ each hold 65,536 values, for 131,072 in total, which is 0.78% of the layer.

<figure>
  <img src="illustrations/_generated/lora_adapters_dark.png" alt="An input of width 4096 splits into two paths. The top path passes through frozen W0, with 16,777,216 values. The bottom path narrows through A to a width of 16, widens through B back to 4096, and is scaled by alpha over r. The paths join at a plus sign. Widths are drawn to scale, and A and B hold 131,072 trainable values, 0.78 percent of W0." />
  <figcaption>Heights are drawn to scale, so the pipe at rank 16 is barely a line. Read the bottom path left to right as A then B, even though the written product is BA. Only those two shapes train.</figcaption>
</figure>

The parentheses in $B(Ax)$ matter too. The forward pass evaluates two thin products and never builds the dense correction. For this layer that is about 262 thousand operations per token against 33.5 million for the base, so again 0.78% extra arithmetic. Kernel launches, memory traffic, batching, and backward add time this count does not see, so measure latency separately.

Here is the budget as code, so you can run it on your own layers.

<!-- leetllm: test, id=reader-lora-budget, output=show, output_title="Reader LoRA budget" -->
```python title="reader-lora-budget.py"
def adapter_parameters(d_in, d_out, rank):
    return rank * (d_in + d_out)

layer = 4096 * 4096
for rank in (8, 16, 64):
    count = adapter_parameters(4096, 4096, rank)
    print(f"rank {rank}: {count:,} parameters, "
          f"{count / layer:.2%} of the layer")

parameters = 65e9
full_state = parameters * (2 + 2 + 4 + 4) / 1e9
frozen_base = parameters * 2 / 1e9
nf4_payload = parameters * 4 / 8 / 1e9
nf4_scales = parameters * (8 / 64 + 32 / (64 * 256)) / 8 / 1e9
print(f"full state {full_state:.0f} GB; "
      f"frozen base {frozen_base:.0f} GB")
print(f"NF4 payload {nf4_payload:.1f} GB; scales {nf4_scales:.2f} GB")
assert adapter_parameters(4096, 4096, 16) == 131072
```

<!-- leetllm: output:start -->
```text title="Reader LoRA budget" output compact
rank 8: 65,536 parameters, 0.39% of the layer
rank 16: 131,072 parameters, 0.78% of the layer
rank 64: 524,288 parameters, 3.12% of the layer
full state 780 GB; frozen base 130 GB
NF4 payload 32.5 GB; scales 1.03 GB
```
<!-- leetllm: output:end -->

## Begin with the model you paid for

A random adapter would corrupt the model on step zero, before it has seen a single label. So ordinary LoRA starts $A$ with nonzero values and $B$ at exactly zero. The correction is zero, and the wrapped layer initially reproduces its base output. The original paper used a Gaussian for $A$, and PEFT uses Kaiming-uniform for linear layers, but both zero $B$.[^hu2021][^huggingface2026peftlora]

It may look as if a zero would stop learning altogether. Let $g$ be the loss derivative with respect to $h$. For one input,

$$
\nabla_B\mathcal L=s\,g(Ax)^T,\qquad
\nabla_A\mathcal L=s\,B^Tg x^T.
$$

With $B$ at zero, $A$'s loss gradient is zero, but $B$'s can be nonzero when the scale, incoming gradient, and measured $Ax$ are nonzero. Once $B$ moves, $A$ can receive loss gradients on later steps. A nonzero $B$ alone doesn't guarantee that: inspect $B^Tg$, the input, and batch cancellation. Set both factors to zero and both loss gradients vanish, so ordinary gradient learning cannot leave that point. The asymmetry gives a harmless start with a possible path out of it.

Watch it happen in a tiny layer. The base is the identity, the input is $(1,0)$, the target is $(0,1)$, and the loss is half the squared output error. We use the standard library, set $s=1$ to keep the numbers small, and compute every gradient from the equations above, so nothing is hidden in a framework.

<!-- leetllm: test, id=reader-lora-learning-and-merge, output=show, output_title="Reader LoRA learning and merge" -->
```python title="reader-lora-learning-and-merge.py"
base = [[1.0, 0.0], [0.0, 1.0]]
A, B = [1.0, -1.0], [0.0, 0.0]
x, target = [1.0, 0.0], [0.0, 1.0]

def forward():
    compressed = sum(a * value for a, value in zip(A, x))
    frozen = [sum(w * value for w, value in zip(row, x))
              for row in base]
    return [f + b * compressed for f, b in zip(frozen, B)]

assert forward() == [1.0, 0.0]
for step in range(2):
    compressed = sum(a * value for a, value in zip(A, x))
    error = [out - wanted for out, wanted in zip(forward(), target)]
    grad_B = [g * compressed for g in error]
    back_to_rank = sum(b * g for b, g in zip(B, error))
    grad_A = [back_to_rank * value for value in x]
    shown = [round(g, 3) for g in grad_A]
    print(f"step {step + 1} A gradient:", shown)
    A = [a - 0.1 * g for a, g in zip(A, grad_A)]
    B = [b - 0.1 * g for b, g in zip(B, grad_B)]

merged = [[w + b * a for w, a in zip(row, A)]
          for row, b in zip(base, B)]
merged_output = [sum(w * value for w, value in zip(row, x))
                 for row in merged]
pairs = zip(merged_output, forward())
assert all(abs(a - b) < 1e-12 for a, b in pairs)
assert base == [[1.0, 0.0], [0.0, 1.0]]
print("base unchanged; merged output matches")
```

<!-- leetllm: output:start -->
```text title="Reader LoRA learning and merge" output compact
step 1 A gradient: [0.0, 0.0]
step 2 A gradient: [-0.18, -0.0]
base unchanged; merged output matches
```
<!-- leetllm: output:end -->

The first update teaches $B$, and the second reaches $A$. The base never moved. The final check also shows that folding the adapter into the base gives the same output after real learning, which is a stronger test than checking a merge while the adapter still outputs zero. On a real wrapper, also check which parameters require gradients and whether the saved artifact includes every trained module.

## Rank, scale, and placement are three separate choices

Rank sets capacity: how many independent directions the update can express. Scale sets strength. With the usual $\alpha/r$, holding $\alpha$ fixed while raising rank *lowers* the multiplier, so a naive rank sweep changes capacity and strength together. The paper used this scaling to reduce retuning when changing rank, which is useful, but it can confuse a comparison. To isolate capacity, hold $\alpha/r$ constant, and always log both numbers. Rank-stabilized LoRA uses $\alpha/\sqrt r$ instead, derived under assumptions about initialization and input statistics, and in PEFT you turn it on with `use_rslora=True`.[^kalajdzievski2023] If a higher-rank run behaves strangely, measure gradient and update sizes.

Placement decides where the model can change at all, and I would look at it before rank.

| Targets | What it can change | When to try it |
| --- | --- | --- |
| Query and value projections | Attention routing | The cheap baseline from the original paper |
| All attention projections | Attention routing, with more capacity | An attention-only comparison |
| All linear layers | Routing and each token's internal transformation | The QLoRA-style starting point when quality matters |

QLoRA found that matching full fine-tuning on its LLaMA 7B and Alpaca comparison required adapters across all linear layers.[^dettmers2023] A procedural change like ours is a good reason to test MLP coverage.

Count from real shapes. Each adapted layer costs $r(d_{\mathrm{in}}+d_{\mathrm{out}})$ parameters, and in grouped-query attention, several query heads share one key and value head, which makes those projections narrower, so equal rank does not mean equal cost. Module names vary by architecture, so print the list the library actually matched. The `all-linear` shortcut, for example, excludes the output head on a `PreTrainedModel`.[^huggingface2026peftlora] And adding special tokens needs its own care. Adapters on attention will not train new rows in the frozen embedding table or output head, so resize before wrapping, then train and save those rows deliberately.

One naming warning, since it causes real confusion when someone inspects a checkpoint. Prompt tuning trains a few continuous virtual tokens at the input.[^lester2021] Prefix tuning trains key and value prefixes for each layer.[^li2021prefix] Both leave the weight matrices alone. Name a method by what trains. If the learned numbers are not $A$ and $B$ inside a projection, it is not LoRA.

## Shrink the frozen base

Now back to the 130 GB that still will not fit. QLoRA stores the frozen base's supported weights in four bits and keeps the trainable adapters in higher precision.[^dettmers2023] Four bits per weight is a quarter of the 16-bit payload, or 32.5 GB. The paper combines three techniques to make this practical.

**NF4.** A four-bit index picks one of sixteen fixed, nonuniform values, chosen using a normal-distribution model and normalized to $[-1, 1]$. A block's absolute maximum rescales its weights into that range. The codebook has seven negative values, zero, and eight positive values, and it is a lookup table with no sign, exponent, or fraction fields in it.[^bitsandbytes2026nf4Implementation]

**Double quantization.** Those per-block scales add up. One FP32 scale per 64 weights costs half a bit per weight. Quantizing the scales themselves to eight bits, with one FP32 scale per 256 of them, brings that to $8/64+32/(64\cdot256)\approx0.127$ bits per weight. At 65 billion weights, that is the 1 GB of scales in the figure and the code above, and it saves about 3 GB.

**Paged optimizers.** CUDA managed memory lets optimizer-state pages migrate to the host under memory pressure. That can make room during an activation peak. It will not cure every out-of-memory error, and page migration can slow a step.[^bitsandbytes2026pagedOptimizers]

Together, these fine-tuned a 65-billion-parameter model on one 48 GB GPU in the paper, and preserved 16-bit performance on the tasks it evaluated. The 33.5 GB is a floor. Unquantized tensors, adapter state, activations, temporary dequantization, and runtime buffers all come on top. As of bitsandbytes 0.50.2, the backward path, for one, materializes a dequantized weight matrix to compute input gradients, so don't assume dequantization costs no device memory.[^bitsandbytes2026fourBitAutograd]

Keep four choices explicit in your run record: packed base storage, base compute dtype, adapter storage, and optimizer state. They can all differ, and as of PEFT 0.21, PEFT promotes BF16 adapter factors to FP32 by default even when the base computes in BF16.[^huggingface2026peftTroubleshooting] TRL 1.17.1's `SFTTrainer` casts trainable LoRA factors back to BF16 in its quantized-model path, excluding the DoRA magnitude vector. Inspect the actual tensors after trainer construction.[^trl2026SftV117] Compare a quantized candidate against an affordable higher-precision baseline, so a memory win cannot hide a behavior loss. If you later reload the base in BF16 to merge and export, re-evaluate that artifact too, because the adapter was trained against a quantized approximation of those weights.

## Buy capacity only when the failure asks for it

Start small and reproducible, with rank 8 or 16, and read the failure before you buy anything. Adapter parameters scale linearly with rank, so rank 64 costs four times what rank 16 does, and rank 256 costs sixteen times as much.

- **Neither loss nor task quality moves.** Check formatting and gradient flow first. Then look at target modules. Rank is rarely the answer here.
- **Loss falls but task examples stay wrong.** Now capacity or coverage is a fair suspect. Try wider coverage before wider rank.
- **Training improves and held-out behavior gets worse.** Look at overfitting and data coverage, because no adapter width can repair missing examples of the rule. Fewer parameters do not make overfitting impossible.
- **General behavior regresses.** Suspect data, scale, or target selection. A small update can still change any response that flows through an adapted projection.

Judge on two sets: new schema cases and a regression set for what the base should keep doing. For the SQL assistant, include a held-out rephrasing of a known question, a query on an unchanged table, a join on a renamed table, and a request for a write statement that must still be refused. Those cases separate learning the new schema from merely repeating its vocabulary. Put task results, response length, false refusals, memory peak, and throughput beside the loss, because a falling loss alone cannot tell you any of them.

When does full fine-tuning win? When you have a large dataset, hardware that can afford it, and a target domain far from the pretraining mix, and when held-out results show the narrower update cannot express what you need. Also, frequently changing schema text belongs in a versioned source or retrieval, because a fine-tune should teach a behavior, not memorize this quarter's rulebook.

## Save and serve what you evaluated

A standalone adapter file means nothing without its partners: the exact base revision, target modules, rank, scale, tokenizer, and any extra trained tensors. Save all of that with it. Reload against a fresh copy of the base and compare outputs with dropout disabled. Resuming training still needs the bundle from the SFT chapter.

If one adapter owns the deployment, merge it:

$$
W_{\mathrm{merged}}=W_0+\frac{\alpha}{r}BA.
$$

You get one ordinary dense layer and no adapter branch. Rounding means merged and unmerged outputs may differ slightly, so compare them within a tolerance and repeat the task evaluation. Keep the separate adapter and a clean base for rollback, since merging writes into the base weights.

Keeping adapters separate preserves the option of one shared resident base. Say you have fifty specialized tasks and a 14 GB base.

<figure>
  <img src="illustrations/_generated/lora_serving_modes_dark.png" alt="Squares drawn to scale. Fifty merged checkpoints are fifty 14 GB squares, 700 GB in all, each serving through one dense W merged. A shared base is one 14 GB square with fifty tiny 128 MB adapter squares beside it, 20.4 GB in all, serving W0 x plus a scaled low-rank term for the adapter a request selects." />
  <figcaption>Every square is drawn to the same scale of area. These are artifact bytes, under an assumed 128 MB adapter size. Merged checkpoints need not all sit on a GPU at once, and how many adapters do depends on the engine.</figcaption>
</figure>

Keeping adapters separate preserves that sharing, and specialized runtimes make it practical. Punica's Segmented Gather Matrix-Vector multiplication lets requests with different adapters share base computation instead of running separate whole-model passes.[^chen2023punica] S-LoRA keeps adapter weights and KV-cache tensors in one paged GPU pool and prefetches upcoming adapters, which reduces fragmentation and loading waits.[^sheng2023] If one or two adapters take most of the traffic, I would merge those and keep the setup simple. If traffic spreads across many, share a base, provided your engine can batch across adapters.

## What bites in production

A few failures come up again and again.

**`device_map="auto"` as a sharding plan.** That setting belongs to Accelerate's Big Model Inference path.[^huggingface2026acceleratebigmodel] For training, let the trainer or launcher place the model, and use FSDP, DeepSpeed's ZeRO, or a deliberate QLoRA setup when it does not fit.

**Out-of-memory with a tiny adapter on a sharded base.** FSDP wraps groups of layers into units. Before a unit runs, it gathers that unit's frozen weights onto the GPU, so a sharded base still needs room for the largest unit, and activations come on top.[^pytorchFsdpDocs2025] Build the optimizer from trainable tensors only, and budget the peak.

**Higher rank, higher cost, same quality.** Rank may not be the limit, or ordinary $\alpha/r$ scaling may be hiding the effect. Hold coverage and scaling fixed, and check the data before you widen further.

**Shape errors at runtime.** Assert $A$ as $r\times d_{\mathrm{in}}$ and $B$ as $d_{\mathrm{out}}\times r$ when you wrap each module. Narrower grouped-query projections are a common source of surprises.

**Calling an active adapter "safe" because the base is frozen.** The base stays recoverable, and rollback is a config change. But a live adapter can still regress anything flowing through it, so evaluate with it on.

```checkpoint
A 4096-by-1024 projection gets a LoRA adapter at rank 32. How many adapter parameters is that, and what share of the layer's values?
---
The adapter costs $r(d_{\mathrm{in}}+d_{\mathrm{out}}) = 32 \times (4096 + 1024) = 163{,}840$ parameters. The layer holds $4096 \times 1024 = 4{,}194{,}304$ values, so the share is about 3.9%. A narrower layer pays a larger share: the same rank on a 4096-by-4096 layer is about 1.56%.
```

## Where this leaves you

You can now budget a fine-tune by component, factor an update down to a size that fits, explain why $B$ starts at zero, and choose placement and rank from the shape of a failure. You also know when to merge and when to share a base.

A small adapter makes one job cheap to train, but a real run still has to survive preemption, keep batch size and learning rate consistent as it scales, and justify LoRA over full fine-tuning, QLoRA, or distillation. The next chapter, [Training Run Operations](/learn/training-run-operations), covers how to run, resume, and judge that job; after it, [reward modeling](/learn/reward-modeling-from-preference-data) turns comparisons between answers into a score you can train against.

<!-- leetllm: edition:reader:end -->
