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
  "section": "Training, Fine-Tuning & Alignment",
  "order": 12
}
---
<!-- leetllm: edition:reference:start -->

Suppose your read-only SQL analytics assistant already answers routine questions, and a warehouse migration renames key tables and adds new join rules. You have 5,000 labeled question-to-SQL pairs and a single 48 GB training GPU. Full fine-tuning asks that GPU to store <span data-glossary="gradient">gradients</span> and Adam optimizer state for every single weight in the base model, blowing past your memory budget before the first batch finishes. Do you really need to update all 70 billion numbers independently just to teach a model new schema conventions?

Call this adaptation run `sql-lora-v1`. LoRA (Low-Rank Adaptation) bets that task-specific weight changes live in a much smaller subspace than the full weight matrices: it freezes the pretrained weights and learns a compact low-rank correction inside selected linear layers. The original GPT-3 175B experiments cut trainable parameters by roughly 10,000x and reduced <span data-glossary="gpu">GPU</span> memory by roughly 3x compared to full fine-tuning with Adam.[^hu2021] (Frequently changing schema definitions still belong in retrieval or context; fine-tuning teaches the model how to write queries cleanly against the warehouse conventions.)

## Why LoRA exists

Full fine-tuning a 70-billion-parameter model is expensive because training stores far more than model weights: every trainable parameter also carries a gradient and <span data-glossary="optimizer">optimizer</span> state. Under a lean mixed-precision setup with <span data-glossary="fp16">FP16</span> weights and gradients plus two FP32 Adam moment tensors (12 bytes per parameter, decimal GB):

| Component | Memory | Formula |
|-----------|--------|---------|
| Model weights (FP16) | 140 GB | $70\text{B} \times 2$ bytes |
| Gradients (FP16) | 140 GB | $70\text{B} \times 2$ bytes |
| Adam first moment $m$ (FP32) | 280 GB | $70\text{B} \times 4$ bytes |
| Adam second moment $v$ (FP32) | 280 GB | $70\text{B} \times 4$ bytes |
| **Total (12 bytes/param)** | **840 GB** | Before activations and temporary buffers |

Adding an FP32 master parameter copy raises that to 16 bytes per parameter, or 1.12 TB (as budgeted in [distributed training](/learn/distributed-training-fsdp-deepspeed-zero)). Either way, 840 GB of model state dwarfs a single 80 GB GPU before a single activation is allocated.

Pretrained transformers are heavily over-parameterized for any single downstream shift. During pretraining, they build rich internal representations of syntax, SQL patterns, and world knowledge. Adapting `sql-lora-v1` on 5,000 question-to-SQL pairs steers those existing representations rather than rebuilding language from scratch.

Aghajanyan et al. showed that pretrained language models can approach full fine-tuning quality while optimizing inside a surprisingly small random parameter subspace (their **intrinsic dimension**).[^aghajanyan2020] Inspired by that finding, Hu et al. proposed the **intrinsic rank hypothesis**: the weight change $\Delta W$ required for downstream adaptation has low matrix rank, so constraining updates to $\Delta W = BA$ with rank at most $r$ captures the adaptation at a fraction of the memory cost.[^hu2021] (Intrinsic optimization dimension and matrix rank are distinct concepts: a single scalar $\theta$ scaling $\Delta W = \theta I$ has one free coordinate yet full matrix rank whenever $\theta \ne 0$.)

### What LoRA saves, and what it doesn't

Freezing the base model eliminates gradients and <span data-glossary="optimizer-state">optimizer state</span> for every frozen weight. The frozen weights themselves still sit in memory, and the small adapter carries its own gradients and optimizer state.

> **Common mistake:** Treating a tiny adapter file as a guarantee of tiny GPU memory. **Activation memory does not disappear.** Backpropagation still flows through every frozen layer to reach adapters in earlier blocks, so intermediate activations still scale with sequence length, batch size, and depth. On a batch of 2,048-<span data-glossary="token">token</span> schema-heavy prompts, activations can dominate peak memory. When you hit OOM, turn on gradient checkpointing (activation recomputation), shrink the micro-batch, or use memory-efficient attention before shrinking rank.

To put the memory gap on one scale, compare a 65B model under the same 12-byte accounting: full fine-tuning needs 780 GB of model state, a frozen 16-bit base needs 130 GB, and <span data-glossary="qlora">QLoRA</span> compresses that frozen base to 4-bit NF4 (~33.5 GB with nested scales), enabling fine-tuning on a single 48 GB GPU.[^dettmers2023]

<figure>
  <img src="illustrations/_generated/lora_memory_budget_dark.png" alt="A shared 0–800 GB scale compares 780 GB of full-fine-tuning states, a 130 GB frozen FP16 base, and a 33.5 GB ideal NF4 base plus nested scales for a 65B model. A separate 0–48 GB scale shows 32.5 GB of NF4 values and 1.0 GB of scales, leaving 14.5 GB for adapters, activations, and runtime buffers." />
  <figcaption>Model-state memory for a 65B model on one shared scale. The lower two bars show the frozen base floor; in the 48 GB zoomed strip, the remaining 14.5 GB must still cover adapters, activations, and temporary buffers.</figcaption>
</figure>

Now zoom inside a single $4096 \times 4096$ linear projection to see how LoRA replaces a 16.7-million-parameter update with two thin matrices.

## The math: from a 4096×4096 layer

### A layer small enough to count

Full fine-tuning updates all $4096 \times 4096 = 16{,}777{,}216$ entries of a weight matrix $W_0$. A rank-$r$ LoRA adapter ($r=16$) freezes $W_0$ and learns two skinny factors instead:

- Down-projection $A \in \mathbb{R}^{16 \times 4096}$: $65{,}536$ parameters
- Up-projection $B \in \mathbb{R}^{4096 \times 16}$: $65{,}536$ parameters
- **Total adapter parameters:** $131{,}072$, just **0.78%** of the full matrix (a **99.2% reduction**)

For an input <span data-glossary="vector">vector</span> $x$, the frozen base computes $W_0 x$ in parallel while the adapter squeezes $x$ into an $r$-dimensional bottleneck, expands it back out, and adds a scaled correction:

$$
h = W_0 x + \frac{\alpha}{r} B A x = W_0 x + \frac{\alpha}{r} B(Ax)
$$

The parentheses in $B(Ax)$ are crucial for efficiency. Evaluating two thin matrix-vector products ($Ax$, then $B(Ax)$) takes roughly 262K FLOPs per token compared to 33.5M for the base projection (about 0.78% extra arithmetic), without ever materializing the dense $4096 \times 4096$ update matrix during the forward pass.

### Why the product is low rank

For any linear layer with weight $W_0 \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}$, LoRA constrains the update to $\Delta W = B \cdot A$:

- $A \in \mathbb{R}^{r \times d_{\text{in}}}$ projects inputs into the rank-$r$ subspace.
- $B \in \mathbb{R}^{d_{\text{out}} \times r}$ maps back to the output dimension.
- The resulting matrix $BA$ has rank at most $r$, starting at rank 0 when $B=0$.[^hu2021]

```checkpoint
Why does LoRA save parameters?
---
It learns two skinny matrices instead of one full-size update matrix. When $r$ is much smaller than $d_{\text{in}}$ and $d_{\text{out}}$, $A$ and $B$ contain far fewer trainable values than $\Delta W$.
```

<figure>
  <img src="illustrations/_generated/lora_adapters_dark.png" alt="LoRA factorization for a 4096 by 4096 projection: input x routes through frozen base weight W0 (16.7M parameters) in parallel with trainable low-rank factors A (16 by 4096, random init) and B (4096 by 16, zero init). The adapter output is scaled by alpha/r and added to W0*x. With B=0 initially, delta-W starts at zero, preserving base behavior on step 0." />
  <figcaption>Input vector $x$ flows through both branches in parallel: the frozen base path $W_0 x$ and the low-rank adapter path $A \to B$. Because $B=0$ at initialization, the adapter starts as an exact no-op on step 0.</figcaption>
</figure>

#### Count the saved parameters

For a linear layer with input width $d_{\text{in}}$ and output width $d_{\text{out}}$, an adapter adds $r(d_{\text{in}} + d_{\text{out}})$ parameters (or $2rd$ for a square $d \times d$ projection):

| Approach | Parameters ($4096 \times 4096$) | Ratio | Weight memory (FP16) |
|----------|-----------|-------|---------------|
| Full fine-tuning | $4096^2 = $ **16.7M** | 100% | 33.5 MB |
| LoRA ($r=8$) | $2 \times 8 \times 4096 = $ **65.5K** | **0.39%** | 131 KB |
| LoRA ($r=16$) | $2 \times 16 \times 4096 = $ **131K** | 0.78% | 262 KB |
| LoRA ($r=64$) | $2 \times 64 \times 4096 = $ **524K** | 3.12% | 1.05 MB |

#### Start from the checkpoint

The first step of fine-tuning should preserve the pretrained model you paid for. Initializing both $A$ and $B$ randomly injects noise into every layer before the model sees a single label.

LoRA solves this asymmetrically: $A$ is initialized randomly (Gaussian in the original paper, Kaiming-uniform by default in PEFT) and $B$ is initialized to exact zeros.[^hu2021][^huggingface2026peftlora]

1. **Step-zero identity:** Because $B=0$, the additive term $\frac{\alpha}{r}B(Ax)$ is identically zero, so the wrapped model starts with the exact pretrained outputs $W_0 x$.
2. **Breaking symmetry on step 1:** Let $g = \nabla_h \mathcal{L} \in \mathbb{R}^{d_{\text{out}}}$ be the incoming gradient. By the chain rule:
   $$
   \nabla_B \mathcal{L} = \frac{\alpha}{r} g (Ax)^T, \qquad \nabla_A \mathcal{L} = \frac{\alpha}{r} B^T g x^T
   $$
   On step 1, $B=0$ makes $\nabla_A \mathcal{L} = 0$, while $\nabla_B \mathcal{L}$ is nonzero as long as $g$ and $Ax$ are nonzero. After step 1 updates $B$, $B$ is no longer zero, so $A$ receives nonzero gradients from step 2 onward. If both $A$ and $B$ started at zero, both gradients would remain stuck at zero forever.

Watch all four initialization cases (including when $x$ happens to fall in the null space of $A$) in PyTorch:

<!-- leetllm: test, deps=torch, output=show, output_title="Initial gradient behavior" -->
```python title="lora_initial_gradients.py"
import torch

def make_factors(a, b):
    return (
        torch.tensor([a], dtype=torch.float64, requires_grad=True),
        torch.tensor([[b]], dtype=torch.float64, requires_grad=True),
    )

for name, a, b, values in [
    ("usual (A!=0, B=0)", [1.0, -1.0], 0.0, [1.0, 0.0]),
    ("null_space (Ax=0)", [1.0, -1.0], 0.0, [1.0, 1.0]),
    ("both_zero (stuck)", [0.0, 0.0], 0.0, [1.0, 0.0]),
    ("reversed (A=0, B!=0)", [0.0, 0.0], 1.0, [1.0, 0.0]),
]:
    A, B = make_factors(a, b)
    x = torch.tensor(values, dtype=torch.float64)
    h = (B @ (A @ x)).squeeze()
    ((h - 1).square() / 2).backward()
    print(f"{name:22s} -> |grad A|={A.grad.abs().sum().item():.1f}, |grad B|={B.grad.abs().sum().item():.1f}")

A, B = make_factors([1.0, -1.0], 0.0)
opt = torch.optim.SGD([A, B], lr=0.1)
x = torch.tensor([1.0, 0.0], dtype=torch.float64)
for step in (1, 2):
    opt.zero_grad(set_to_none=True)
    ((B @ (A @ x) - 1).square() / 2).backward()
    print(f"step {step} usual          -> |grad A|={A.grad.abs().sum().item():.3f}, |grad B|={B.grad.abs().sum().item():.3f}")
    opt.step()
```

<!-- leetllm: output:start -->
```text title="Initial gradient behavior" output compact
usual (A!=0, B=0)      -> |grad A|=0.0, |grad B|=1.0
null_space (Ax=0)      -> |grad A|=0.0, |grad B|=0.0
both_zero (stuck)      -> |grad A|=0.0, |grad B|=0.0
reversed (A=0, B!=0)   -> |grad A|=1.0, |grad B|=0.0
step 1 usual          -> |grad A|=0.000, |grad B|=1.000
step 2 usual          -> |grad A|=0.090, |grad B|=0.900
```
<!-- leetllm: output:end -->

#### Separate capacity from strength

Rank and scale answer two distinct questions. Rank $r$ sets how many independent directions the adapter can express; $\alpha/r$ sets how strongly the adapter output enters the layer:

$$
\text{scaling} = \frac{\alpha}{r}
$$

The original paper introduced $\alpha/r$ to reduce learning-rate retuning when sweeping rank.[^hu2021] Notice a common pitfall: if you double $r$ while holding $\alpha$ fixed, you cut $\alpha/r$ in half, changing capacity and step strength at the same time. When running a clean rank ablation, hold $\alpha/r$ constant (for instance $\alpha = r$ or $\alpha = 2r$) and log both numbers explicitly.

```checkpoint
If rank increases while $\alpha$ stays fixed, what happens to $\alpha/r$?
---
It gets smaller, which scales down both the adapter's forward contribution and its gradients. Hold $\alpha/r$ constant when isolating the effect of rank.
```

At high ranks ($r \ge 64$), dividing by $r$ can over-damp updates. **rsLoRA** (rank-stabilized LoRA) replaces $\alpha/r$ with $\alpha/\sqrt{r}$, derived so update magnitudes stay well-scaled as rank grows, and is enabled in PEFT via `use_rslora=True`.[^kalajdzievski2023][^huggingface2026peftlora]

## Where to inject LoRA

Rank sets how wide each adapter is; target selection decides *where* in the Transformer block adaptation can happen. Should `sql-lora-v1` adapt only attention routing, or also the per-token MLP transformations?

The original LoRA paper focused on Query ($W_Q$) and Value ($W_V$) projections as a lean baseline.[^hu2021] Later QLoRA ablations found that matching full fine-tuning required placing adapters on **all linear layers** in every Transformer block, including the MLP projections.[^dettmers2023]

### Common injection strategies

| Strategy | Target modules | Typical parameter cost (7B-style block, $r=16$) | When to use |
|----------|---------------|-------------------------------------------------|-------------|
| **Original LoRA** | $W_Q, W_V$ | 262K / block | Cheapest baseline matching the original paper |
| **All attention** | $W_Q, W_K, W_V, W_O$ | 524K / block | Attention-only routing adaptation |
| **All-linear** | Attention + MLP (`gate_proj`, `up_proj`, `down_proj`) | 1.25M / block (~4.8x Q/V) | Strongest default when quality matters |

> **Key insight:** Attention projections control *which tokens talk to each other*; MLP layers (`gate_proj`, `up_proj`, `down_proj` in SwiGLU blocks) transform each token's internal features. On procedural tasks like SQL generation, spending your adapter budget across all linear layers at $r=8$ or $r=16$ often beats spending the same budget on a high-rank Q/V-only adapter.

Note that PEFT's `target_modules="all-linear"` shortcut excludes `lm_head` on a `PreTrainedModel`. Always print the matched module names rather than assuming what a shortcut selected, especially if you added special tokens.[^huggingface2026peftlora]

### Methods that train learned state outside weight matrices

Two closely related PEFT families leave every weight matrix frozen and learn continuous **prompt-like state** instead:

| Method | What trains | Where the signal enters |
|--------|-------------|-------------------------|
| **Prompt tuning / soft prompts**[^lester2021] | Learned virtual token <span data-glossary="embedding">embeddings</span> | Prepended to the input sequence inside the <span data-glossary="context-window">context window</span> |
| **Prefix tuning**[^li2021prefix] | Learned continuous key/value prefixes | Prepended to attention keys and values at every Transformer layer |
| **LoRA / QLoRA** | Low-rank weight factors $A, B$ | Added directly to internal linear projections |

Keep the names distinct: if the learned parameters aren't low-rank factors $A$ and $B$ inside linear projections, the method is prompt or prefix tuning, not LoRA.

## Implementing LoRA with Hugging Face PEFT

The `peft` library wraps any target linear layer with $A$ and $B$ automatically, handles freezing the base weights, and merges adapters back into dense weights when you are ready to export.

### Verify the adapter lifecycle on CPU

Before launching a multi-hour GPU job, run a tiny, randomly initialized Qwen2 block on CPU to verify the complete adapter lifecycle end-to-end: step-zero identity, frozen base weights, step-1 vs step-2 gradient flow, save/reload equivalence, and lossless merging into a standard dense model.

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="Real PEFT wrapper lifecycle on CPU" -->
```python title="tiny-peft-check.py"
import tempfile
import torch
from peft import LoraConfig, PeftModel, get_peft_model
from transformers import Qwen2Config, Qwen2ForCausalLM

torch.manual_seed(7)
config = Qwen2Config(
    vocab_size=32, hidden_size=16, intermediate_size=32,
    num_hidden_layers=1, num_attention_heads=2, num_key_value_heads=1,
    max_position_embeddings=32, attention_dropout=0.0, tie_word_embeddings=False,
)
base = Qwen2ForCausalLM(config).eval()
ids = torch.tensor([[1, 2, 3, 4]])
base_logits = base(ids).logits.detach().clone()
base_state = {k: v.detach().clone() for k, v in base.state_dict().items()}

model = get_peft_model(base, LoraConfig(
    r=2, lora_alpha=4, target_modules="all-linear",
    lora_dropout=0.0, bias="none", task_type="CAUSAL_LM",
)).eval()

targets = [n.rsplit(".", 1)[-1] for n, m in model.named_modules() if hasattr(m, "lora_A")]
trainable, total = model.get_nb_trainable_parameters()
print("adapted modules:", targets)
print(f"trainable: {trainable:,} / {total:,} ({trainable / total:.1%})")
print(f"step-0 max logit diff: {(model(ids).logits - base_logits).abs().max().item():.1e}")

model.train()
opt = torch.optim.SGD([p for p in model.parameters() if p.requires_grad], lr=0.1)
for step in (1, 2):
    opt.zero_grad(set_to_none=True)
    model(ids, labels=ids).loss.backward()
    a_g = sum(p.grad.abs().sum().item() for n, p in model.named_parameters() if "lora_A" in n)
    b_g = sum(p.grad.abs().sum().item() for n, p in model.named_parameters() if "lora_B" in n)
    print(f"step {step} grads -> |grad A|={a_g:.4f}, |grad B|={b_g:.4f}")
    opt.step()

model.eval()
adapted_logits = model(ids).logits.detach()
with tempfile.TemporaryDirectory() as tmpdir:
    model.save_pretrained(tmpdir)
    fresh = Qwen2ForCausalLM(config)
    fresh.load_state_dict(base_state)
    reloaded = PeftModel.from_pretrained(fresh, tmpdir).eval()
    reload_diff = (reloaded(ids).logits - adapted_logits).abs().max().item()

merged = model.merge_and_unload(safe_merge=True).eval()
merge_diff = (merged(ids).logits - adapted_logits).abs().max().item()
print(f"reload max diff: {reload_diff:.1e} | merge max diff: {merge_diff:.1e}")
```

<!-- leetllm: output:start -->
```text title="Real PEFT wrapper lifecycle on CPU" output compact
adapted modules: ['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj']
trainable: 512 / 3,920 (13.1%)
step-0 max logit diff: 0.0e+00
step 1 grads -> |grad A|=0.0000, |grad B|=2.4652
step 2 grads -> |grad A|=0.2497, |grad B|=2.3136
reload max diff: 0.0e+00 | merge max diff: 3.0e-08
```
<!-- leetllm: output:end -->

Notice that `k_proj` and `v_proj` are narrower than `q_proj` because this model uses grouped-query attention (2 query heads sharing 1 key/value head). At rank 2, `q_proj` and `o_proj` each add 64 parameters, `k_proj` and `v_proj` each add 48, and the three MLP projections each add 96: 512 trainable parameters in total.

<figure>
<img src="illustrations/_generated/lora_target_module_map_dark.png" alt="A module map for the one-layer Qwen2 CPU example with hidden width 16, intermediate width 32, two query heads, one key/value head, and rank 2. It lists the input and output widths and adapter parameter count for q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, and down_proj. The Q/V, all-attention, and all-linear columns mark the modules selected by each target set and total 112, 224, and 512 adapter parameters. The lm_head output projection is shown separately because PEFT all-linear excludes it for a PreTrainedModel." />
<figcaption>Wider target sets attach adapters to more projections. In this rank-2 Qwen2 block, Q/V adds 112 parameters, all-attention adds 224, and all-linear adds 512 while leaving `lm_head` untouched.</figcaption>
</figure>

### Set up a full training job

For real fine-tuning, let your trainer or distributed launcher (`accelerate launch`, FSDP, or DeepSpeed) handle device placement rather than passing `device_map="auto"`, which is designed for Big Model Inference rather than multi-GPU training.[^huggingface2026acceleratebigmodel]

```python title="implementing-lora-with-hugging-face-peft.py"
import torch
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B", dtype=torch.bfloat16)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,               # scaling = alpha / r = 2.0
    target_modules="all-linear",
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
```

### Inspect stored adapter precision

Loading the base model in BF16 does not mean your adapters are stored in BF16: by default, PEFT promotes low-precision LoRA weights to FP32 so small updates retain precision (`autocast_adapter_dtype=False` keeps them in BF16).[^huggingface2026peftTroubleshooting]

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="PEFT stored parameter dtypes" -->
```python title="peft_adapter_dtypes.py"
import torch
from torch import nn
from peft import LoraConfig, get_peft_model

for promote in (True, False):
    base = nn.Sequential(nn.Linear(6, 4, bias=False).to(torch.bfloat16))
    wrapped = get_peft_model(
        base, LoraConfig(r=2, target_modules=["0"]), autocast_adapter_dtype=promote
    )
    layer = wrapped.base_model.model[0]
    print(
        f"promote={str(promote):5s} -> base={layer.base_layer.weight.dtype}, "
        f"adapter={layer.lora_A['default'].weight.dtype}"
    )
```

<!-- leetllm: output:start -->
```text title="PEFT stored parameter dtypes" output compact
promote=True  -> base=torch.bfloat16, adapter=torch.float32
promote=False -> base=torch.bfloat16, adapter=torch.bfloat16
```
<!-- leetllm: output:end -->

### Build a minimal PyTorch LoRA layer and merge it

Under the hood, a LoRA linear layer is just 25 lines of PyTorch. Freezing `base.weight` keeps it out of the optimizer, `B` starts at zeros so step 0 is an exact no-op, training updates only `A` and `B`, and `merge()` folds $\frac{\alpha}{r}BA$ straight into the dense matrix with zero extra inference branches.[^huggingface2026peftlora]

<!-- leetllm: test, deps=torch, output=show, output_title="From-scratch PyTorch LoRA training and merge" -->
```python title="pytorch-lora-layer.py"
import torch
import torch.nn as nn

torch.manual_seed(0)

class LoRALinear(nn.Module):
    def __init__(self, base: nn.Linear, rank: int, alpha: float):
        super().__init__()
        self.base = base
        self.base.weight.requires_grad_(False)
        d_out, d_in = base.weight.shape
        self.A = nn.Parameter(torch.randn(rank, d_in) * 0.1)
        self.B = nn.Parameter(torch.zeros(d_out, rank))
        self.scaling = alpha / rank

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.base(x) + self.scaling * ((x @ self.A.T) @ self.B.T)

    @torch.no_grad()
    def merged_weight(self) -> torch.Tensor:
        return self.base.weight + self.scaling * (self.B @ self.A)

base = nn.Linear(4, 3, bias=False)
x = torch.randn(8, 4)
target = torch.randn(8, 3)

layer = LoRALinear(base, rank=2, alpha=4.0)
print(f"step-0 diff from base: {(layer(x) - base(x)).abs().max().item():.1e}")

opt = torch.optim.Adam([layer.A, layer.B], lr=0.05)
for step in range(1, 41):
    opt.zero_grad()
    loss = (layer(x) - target).pow(2).mean()
    loss.backward()
    opt.step()
    if step in (1, 20, 40):
        print(f"step {step:2d} MSE={loss.item():.4f}")

W_merged = layer.merged_weight()
merge_diff = (x @ W_merged.T - layer(x)).abs().max().item()
print(f"merged vs unmerged max diff: {merge_diff:.1e}")
```

<!-- leetllm: output:start -->
```text title="From-scratch PyTorch LoRA training and merge" output compact
step-0 diff from base: 0.0e+00
step  1 MSE=1.7893
step 20 MSE=1.1618
step 40 MSE=1.0832
merged vs unmerged max diff: 1.8e-07
```
<!-- leetllm: output:end -->

In PEFT, calling `merged = model.merge_and_unload()` performs this exact weight folding and returns a standard `transformers` model with no adapter overhead. Always save the standalone adapter before merging so you can revert or re-merge against a clean base checkpoint:

```python title="merging-the-adapter-path.py"
model.save_pretrained("./sql-lora-v1-adapter")
merged_model = model.merge_and_unload()
merged_model.save_pretrained("./sql-lora-v1-merged")
```

## Choose rank from evidence

With the adapter path working, should `sql-lora-v1` use rank 8, 16, or 64? With target modules fixed, adapter parameter count scales linearly with rank:

| Rank ($r$) | Relative adapter parameters | Role in a sweep |
|------------|-----------------------------|-----------------|
| 4 | 0.25x of rank 16 | Minimal capacity floor |
| 8 | 0.50x of rank 16 | Fast low-cost baseline |
| 16 | 1.00x | Strong default reference |
| 64 | 4.00x of rank 16 | Worth trying only if held-out accuracy is underfitting |
| 256 | 16.00x of rank 16 | High-capacity diagnostic, rarely needed for style or format shifts |

Always evaluate on two held-out sets: a **task set** measuring the new schema rules, and a **regression set** checking general SQL queries that must keep working. Look at the failure shape before buying more rank: underfitting on the task set points to capacity or target coverage, while regressions point to data mix, learning rate, or scaling.

```checkpoint
Your team wants `sql-lora-v1` to cover three new warehouse schemas with 5,000 labeled question-to-SQL pairs. Would you start with $r=8$ or $r=64$?
---
Start with $r=8$ or $r=16$ across all linear layers before paying 4x the adapter state for $r=64$. Let held-out task accuracy and regression checks tell you whether capacity is actually the bottleneck.
```

## Decide after the first controlled comparison

Compare LoRA and full fine-tuning on the same held-out evaluation sets:

- **When LoRA shines:** Many task variants, tight GPU memory, fast iteration, or an adaptation close to what the base model already knows (like `sql-lora-v1` adopting renamed tables and join conventions). Keeping the base weights frozen also makes reverting to the original model as simple as disabling the adapter, though an active adapter can still regress general behavior while enabled, so always evaluate with it turned on.
- **When full fine-tuning wins:** A large corpus far from the <span data-glossary="pretraining">pretraining</span> distribution (such as a new programming language or heavy domain shift) where hardware allows updating every weight and held-out evaluations show low-rank updates are underfitting.

## Diagnose from the failure shape

Each failure pattern points to a specific axis in the adapter setup:

- **Validation loss barely moves:** Adapting only $W_Q$ and $W_V$ may be too narrow. Switch to `all-linear` targeting and inspect the matched module list.[^dettmers2023]
- **Rank grows, cost rises, but quality stalls:** Rank may not be the bottleneck, or fixed $\alpha$ is shrinking $\alpha/r$. Hold $\alpha/r$ constant, check data formatting, and test `use_rslora=True` for high-rank runs.[^kalajdzievski2023][^huggingface2026peftlora]
- **Unexpected inference latency:** A single-task deployment still running unmerged adapters pays extra kernel launches. Merge with `merge_and_unload()` so inference runs one dense layer.
- **Multi-GPU training stalls or fails with `device_map="auto"`:** That setting belongs to Accelerate's Big Model Inference path, not distributed training. Use <span data-glossary="fsdp">FSDP</span>, <span data-glossary="deepspeed">DeepSpeed</span>, or QLoRA instead.[^huggingface2026acceleratebigmodel]
- **OOM with a tiny adapter on a sharded base:** <!-- leetllm: audience:website:start -->Adapters don't eliminate FSDP / <span data-glossary="zero">ZeRO</span> peak memory from [distributed training](/learn/distributed-training-fsdp-deepspeed-zero). Build the optimizer from `requires_grad=True` tensors only, wrap at block granularity, and budget for both gathered frozen layer weights and full activations.<!-- leetllm: audience:website:end --><!-- leetllm: audience:book:start -->Adapters don't eliminate FSDP / <span data-glossary="zero">ZeRO</span> peak memory from [distributed training](/learn/distributed-training-fsdp-deepspeed-zero). Build the optimizer from `requires_grad=True` tensors only, wrap at block granularity, and budget for both gathered frozen layer weights and full activations. The online companion's [Training Run Operations](/learn/training-run-operations) chapter covers resuming after preemption and exporting checkpoints.<!-- leetllm: audience:book:end -->
- **New special tokens never appear in outputs:** Adding tokenizer IDs does not resize model tensors. Call `resize_token_embeddings(len(tokenizer))` before wrapping, and explicitly unfreeze or select the affected input embedding and `lm_head` rows (`all-linear` excludes `lm_head`).[^huggingface2026peftlora]
- **Shape mismatches at runtime:** Verify $A \in \mathbb{R}^{r \times d_{\text{in}}}$ and $B \in \mathbb{R}^{d_{\text{out}} \times r}$, especially on grouped-query attention models where $k_{\text{proj}}$ and $v_{\text{proj}}$ are narrower than $q_{\text{proj}}$.

## Production sweep starting points

Start with one reproducible baseline, sweep one or two knobs at a time, and log task accuracy alongside regression checks:

| Hyperparameter | Starting candidates | Why |
|---|---|---|
| **Learning rate** | `1e-4`, `2e-4` | Standard LoRA <span data-glossary="supervised-fine-tuning">SFT</span> range (~10x full fine-tuning LR) |
| **Effective token batch** | Hold fixed across runs | Keeps step-to-step comparisons fair |
| **Rank ($r$)** | 8, 16 | Scale up only when held-out task quality underfits |
| **Alpha ($\alpha$)** | $\alpha = r$ or $\alpha = 2r$ | Keeps scaling $\alpha/r$ explicit during rank sweeps |
| **Dropout** | 0.0, 0.05 | Regularizes small datasets without slowing large ones |
| **Target modules** | `all-linear` vs Q/V | Usually the highest-leverage capacity knob |
| **Gradient checkpointing** | On when activation-bound | Cuts activation VRAM at a ~25-30% compute cost |

Fewer trainable parameters do not prevent <span data-glossary="overfitting">overfitting</span>. If training loss drops while held-out SQL accuracy worsens, inspect dataset diversity, epochs, and dropout before touching rank.

## QLoRA: going further

Standard LoRA keeps the frozen base in <span data-glossary="bf16">BF16</span> or FP16, leaving a 65B base at 130 GB before activations, still too large for our 48 GB GPU. **QLoRA (Quantized LoRA)**[^dettmers2023] stores the frozen base weights in **4-bit** precision and dequantizes them on the fly into BF16 for forward and backward matmuls, while keeping trainable LoRA factors in higher precision.

For a 65B model:

| Method | Frozen/model state | What fits |
|--------|--------------------|-----------|
| Full fine-tuning (12-byte recipe) | 780 GB | Multi-node cluster |
| LoRA (BF16 frozen base) | 130 GB + adapters & activations | Multi-GPU node |
| **QLoRA (4-bit NF4 base)** | **33.5 GB** base + scales (plus adapters & activations) | **Single 48 GB GPU** in the QLoRA paper[^dettmers2023] |

QLoRA makes 4-bit fine-tuning match 16-bit quality through three interlocking ideas:

1. **NormalFloat4 (NF4):** Pretrained neural network weights follow roughly zero-centered normal distributions. Instead of uniformly spaced 4-bit bins, NF4 maps each 4-bit index to one of 16 fixed, nonuniform codebook values chosen from the quantiles of a standard normal distribution normalized to $[-1, 1]$ (7 negative values, exact `0.0`, and 8 positive values). Each block of 64 weights is scaled by its absolute maximum into $[-1, 1]$.[^dettmers2023][^bitsandbytes2026nf4Implementation]
2. **Double quantization:** Storing one FP32 scale per 64 weights adds $32/64 = 0.5$ bits per weight (~4.1 GB on a 65B model). Quantizing those scales themselves into 8-bit values (with one FP32 second-level scale per 256 blocks) drops the overhead to $8/64 + 32/(64 \cdot 256) \approx 0.127$ bits per weight (~1.0 GB on 65B, saving ~3 GB).[^dettmers2023][^bitsandbytes2026nf4Implementation]
3. **Paged optimizers:** Using CUDA unified memory, optimizer-state pages automatically evict to CPU RAM during activation spikes and page back in for the optimizer step, preventing OOM crashes during long sequences at a modest latency tradeoff.[^dettmers2023][^bitsandbytes2026pagedOptimizers]

Watch NF4 quantize and reconstruct a tiny weight block using its asymmetric normal-quantile codebook:

<!-- leetllm: test, output=show, output_title="NF4 lookup output" -->
```python title="nf4_lookup.py"
codebook = [
    -1.0, -0.696193, -0.525073, -0.394917, -0.284441, -0.184773, -0.091050,
    0.0, 0.079580, 0.160930, 0.246112, 0.337915, 0.440710, 0.562617, 0.722957, 1.0,
]
weights = [-0.2, 0.0, 0.2, 2.0]
scale = max(abs(w) for w in weights)
indices = [min(range(16), key=lambda i: abs(w / scale - codebook[i])) for w in weights]
restored = [round(scale * codebook[i], 5) for i in indices]

print("4-bit indices:", indices)
print("reconstructed:", restored)
```

<!-- leetllm: output:start -->
```text title="NF4 lookup output" output compact
4-bit indices: [6, 7, 8, 15]
reconstructed: [-0.1821, 0.0, 0.15916, 2.0]
```
<!-- leetllm: output:end -->

Notice two subtleties in the output: `0.0` maps exactly to index `7` (preserving sparsity), while `-0.2` and `+0.2` reconstruct to slightly asymmetric values because the 16 bins split as 7 negative, zero, and 8 positive.

In practice, keep four precision settings distinct: packed 4-bit base storage, BF16 compute dtype, adapter parameter storage (often promoted to FP32 by PEFT's k-bit preparation), and optimizer state.[^huggingface2026peftTroubleshooting][^peft2026kbitPreparation] Also remember that bitsandbytes' backward pass dequantizes the 4-bit weight matrix to compute input gradients, so leave headroom for those temporary tensors plus activations.[^bitsandbytes2026fourBitAutograd]

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

For export, you can reload the exact base revision in BF16, attach the trained adapter, merge, and optionally re-quantize for serving.[^huggingface2026peftquantization] Because the adapter trained against a 4-bit approximation of the base weights, always re-evaluate the merged BF16 and re-quantized artifacts on your held-out suite.

## Keep the base shared when serving many adapters

Merging removes adapter branches for a single-task deployment, but duplicating a 14 GB base model across 50 tenants consumes 700 GB of storage. Keeping one shared 14 GB base alongside fifty 128 MB adapters takes just **20.4 GB**, a **34.3x** reduction in artifact size.

<figure>
  <img src="illustrations/_generated/lora_serving_modes_dark.png" alt="Merged LoRA checkpoints remove the adapter branch; dynamic serving shares a base across requests using different adapters. A 14 GB base and fifty 128 MB adapter artifacts total 20.4 GB, versus 700 GB for fifty merged artifacts. Punica uses SGMV; S-LoRA jointly pages adapter and KV tensors." />
  <figcaption>Merging eliminates the low-rank inference branch for single-task serving, while dynamic adapter routing shares one base across many tasks (20.4 GB vs 700 GB in artifact storage for 50 adapters).</figcaption>
</figure>

Two systems innovations make multi-adapter serving fast in production:

1. **Heterogeneous batching (Punica):** Custom **Segmented Gather Matrix-Vector multiplication (SGMV)** kernels let requests targeting different adapters share one batched base-model forward pass ($X W_0^T$) and apply each request's low-rank correction $\frac{\alpha_i}{r_i}(X_i A_i^T) B_i^T$ in parallel.[^chen2023punica]
2. **Unified Paging (S-LoRA):** Stores both KV-cache blocks and adapter weights inside one unified paged GPU memory pool, prefetching upcoming adapters and eliminating fragmentation across varying ranks and sequence lengths.[^sheng2023]

Rule of thumb: merge your one or two highest-traffic adapters for the simplest low-latency serving path, and use dynamic multi-adapter serving when traffic spreads across dozens of specialized tasks.

## Advanced: separate magnitude from direction

**DoRA (Weight-Decomposed Low-Rank Adaptation)**[^liu2024] asks why full fine-tuning and standard LoRA behave differently when modifying weights. Decomposing any weight row into its Euclidean length (magnitude $m = \|w\|_2$) and unit direction ($v = w / \|w\|_2$), Liu et al. observed in a VL-BART case study that full fine-tuning often adjusted magnitude and direction in opposite directions (correlation $-0.62$), whereas LoRA coupled them positively ($+0.83$). DoRA decouples them explicitly, giving a row-wise PyTorch weight update:

$$
V = W_0 + \frac{\alpha}{r}BA, \qquad W_{\text{DoRA}} = m \odot \frac{V}{\|V\|_{\text{row}}}
$$

Here $m \in \mathbb{R}^{d_{\text{out}}}$ is initialized to $\|W_0\|_{\text{row}}$ (one learnable scalar per output row) and $\|\cdot\|_{\text{row}}$ is the row-wise $L_2$ norm (`dim=1` in PyTorch). On step 0, $B=0 \implies V = W_0$, so $W^{(0)} = \|W_0\|_{\text{row}} \odot (W_0 / \|W_0\|_{\text{row}}) = W_0$: exact step-zero identity is preserved.

Adding $d_{\text{out}}$ magnitude scalars costs only $1/(2r)$ extra parameters over standard LoRA on a square layer (3.12% at $r=16$), and PEFT enables it with `use_dora=True`.[^huggingface2026peftdora] Like standard LoRA, a trained DoRA adapter merges cleanly into a single dense matrix $W_{\text{merged}} = m \odot V / \|V\|_{\text{row}}$ for inference.

<details>
<summary>Deep dive: DoRA's detached norm gradient in PEFT</summary>

Both the DoRA paper (Section 4.3) and PEFT detach the denominator norm $\|V\|_{\text{row}}$ from the backward graph: the forward pass recomputes the norm after every update, while backward treats $\|V\|_{\text{row}}$ as a constant to cut memory and stabilize gradients.[^liu2024][^huggingface2026peftdora] Differentiating through the norm produces a different gradient vector, even though both produce the exact same forward output.

Watch the difference on a single row $v=(3, 4)$, $m=5$, and input $x=(1, 0)$: both paths output `3.0`, yet full differentiation yields `[0.64, -0.48]` while PEFT's detached-norm backward yields `[1.0, 0.0]`:

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="DoRA backward check" -->
```python title="dora-backward-check.py"
import torch
from torch import nn
from peft import LoraConfig, get_peft_model

base = nn.Sequential(nn.Linear(2, 1, bias=False))
with torch.no_grad():
    base[0].weight.copy_(torch.tensor([[3.0, 4.0]]))
model = get_peft_model(
    base, LoraConfig(r=2, lora_alpha=2, target_modules=["0"], use_dora=True)
)
layer = model.base_model.model[0]
with torch.no_grad():
    layer.lora_A["default"].weight.copy_(torch.eye(2))
    layer.lora_B["default"].weight.zero_()

output = model(torch.tensor([[1.0, 0.0]]))
output.sum().backward()
peft_grad = layer.lora_B["default"].weight.grad.flatten()

direction = torch.tensor([3.0, 4.0], requires_grad=True)
full_grad, = torch.autograd.grad(5 * direction[0] / direction.norm(), direction)

print("forward output:            ", round(output.item(), 2))
print("full-normalization grad:   ", [round(v, 2) for v in full_grad.tolist()])
print("PEFT detached-norm grad:   ", [round(v, 2) for v in peft_grad.tolist()])
print("magnitude vector shape:    ", tuple(layer.lora_magnitude_vector["default"].weight.shape))
```

<!-- leetllm: output:start -->
```text title="DoRA backward check" output compact
forward output:             3.0
full-normalization grad:    [0.64, -0.48]
PEFT detached-norm grad:    [1.0, 0.0]
magnitude vector shape:     (1,)
```
<!-- leetllm: output:end -->

</details>

## What to check before moving on

| Check | What to verify |
|-------|----------------|
| **Factor shapes** | $A$ and $B$ match each adapted projection, including narrower GQA key/value layers |
| **Learning path** | Step-zero identity, nonzero step-1 $B$ gradient, step-2 $A$ gradient, and unchanged base weights |
| **Export** | Saved adapter and merged checkpoint match within float tolerance in eval mode |
| **Peak memory** | Measure actual GPU peak memory at target sequence length and micro-batch size |
| **Evaluation** | Held-out SQL task accuracy and general regression checks both pass |

<details>
<summary>Additional worked practice</summary>

```checkpoint
An update family is ΔW = θI₄. Only scalar θ is optimized, and the current θ is 0.2. Which optimization-coordinate count and matrix rank describe this update?
---
One free coordinate; rank 4. One scalar controls all four nonzero diagonal entries, so there is one optimization coordinate. The four independent columns give rank 4. Intrinsic optimization dimension and matrix-update rank need not coincide.
```

```checkpoint
Use the large-tensor nested-scale estimate with one 8-bit code per 64 weights and one FP32 parent scale per 256 codes. For one billion weights, what is the approximate scale metadata cost?
---
0.127 bits per weight, or 15.87 decimal MB. The formula is 8/64 + 32/(64×256) = 0.126953125 bits per weight. Multiplying by 1e9, dividing by 8, and dividing by 1e6 gives 15.87 MB (separate from the 4-bit weight payload).
```

```checkpoint
A quantized adapter job runs out of memory during an activation-heavy backward pass. What does a paged optimizer do, and what should you check next?
---
It moves optimizer-state pages between GPU and host via CUDA unified memory during peaks, then pages them back for the step. It relieves optimizer pressure but does not shrink activations, so also check gradient checkpointing and micro-batch size.
```

```checkpoint
DoRA adapts a PyTorch Linear weight with 3 output rows and 5 input columns at rank 2. Under row-wise magnitudes, how many total trainable parameters (A, B, and magnitudes) are added?
---
19 values: 10 in A (2×5), 6 in B (3×2), and 3 row magnitudes (one per output row).
```

```checkpoint
An adapter was trained against a 4-bit approximation of base revision R. For export, you reload revision R in BF16, merge, and re-quantize. What should you evaluate?
---
Evaluate both the merged BF16 checkpoint and the re-quantized export separately, and keep the standalone adapter and clean base so you can revert if quantization shifts behavior.
```

```checkpoint
Assume a 9 GB base model and twelve 80 MB adapters (decimal units). Compare storage for twelve merged checkpoints versus one shared base with twelve adapters.
---
Merged checkpoints take 12 × 9 = 108 GB. A shared base plus twelve adapters takes 9 + 12 × 80 / 1000 = 9.96 GB.
```

</details>

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
    "question": "A model uses untied input embeddings and output weights. New tokenizer IDs are added, but only attention projections are wrapped with trainable LoRA factors. The new IDs have no useful learned input or output rows. What fixes both layers?",
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

> **Next:** Continue to [Privacy-Preserving Machine Learning](/learn/privacy-preserving-ml-differential-privacy).

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

There is a trap in that bar chart: it leaves out activations, and they do not go away. Backward still has to propagate through the frozen operations to reach adapters in earlier layers, so the base network runs in full and its intermediates get saved. Many of them grow with sequence length, batch size, and depth. Run your examples at 2,048 tokens each, and activations can outweigh the adapter state, or even the base weights. Measure peak memory at your real sequence length and batch size, and when you hit a limit, turn on gradient checkpointing (activation recomputation), which keeps fewer activations on the forward pass and recomputes them during backward, and is enabled by default in trainers like TRL.[^huggingfaceTrlPacking2026] Try a smaller micro-batch too, before you start shrinking rank.

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

With $B$ at zero, $A$'s gradient is zero on step 1, while $B$ updates immediately whenever $g$ and $Ax$ are nonzero. Once $B$ moves off zero, $A$ receives gradients from step 2 onward. If both factors start at zero, both gradients vanish and training is stuck. The asymmetry gives a harmless start with a clean path out of it.

Watch it happen in a tiny NumPy layer. The base is the identity, the input is $(1,0)$, the target is $(0,1)$, and we compute every gradient directly from the equations above:

<!-- leetllm: test, id=reader-lora-learning-and-merge, deps=numpy, output=show, output_title="Reader LoRA learning and merge" -->
```python title="reader-lora-learning-and-merge.py"
import numpy as np

W0 = np.eye(2)
A = np.array([[1.0, -1.0]])
B = np.zeros((2, 1))
x = np.array([1.0, 0.0])
target = np.array([0.0, 1.0])

def forward():
    return W0 @ x + (B @ (A @ x))

print("step 0 output (matches base):", forward().tolist())
for step in (1, 2):
    ax = A @ x
    err = forward() - target
    grad_B = np.outer(err, ax)
    grad_A = np.outer(B.T @ err, x)
    print(f"step {step}: grad_A={grad_A.round(3).tolist()[0]}, grad_B={grad_B.round(3).flatten().tolist()}")
    A = A - 0.1 * grad_A
    B = B - 0.1 * grad_B

W_merged = W0 + B @ A
print("merged matches unmerged:", np.allclose(W_merged @ x, forward()))
```

<!-- leetllm: output:start -->
```text title="Reader LoRA learning and merge" output compact
step 0 output (matches base): [1.0, 0.0]
step 1: grad_A=[0.0, 0.0], grad_B=[1.0, -1.0]
step 2: grad_A=[-0.18, -0.0], grad_B=[0.9, -0.9]
merged matches unmerged: True
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

Together, these fine-tuned a 65-billion-parameter model on one 48 GB GPU in the paper while preserving 16-bit quality. The 33.5 GB figure is the base floor: unquantized tensors, adapter state, activations, and temporary dequantization buffers all sit on top. In bitsandbytes, the backward pass materializes a dequantized weight matrix to compute input gradients, so leave device-memory headroom for those buffers.[^bitsandbytes2026fourBitAutograd]

Keep four precision choices clear in your training config: packed 4-bit base storage, base compute dtype, adapter parameter storage, and optimizer state. PEFT promotes BF16 adapter factors to FP32 by default even when the base computes in BF16, whereas higher-level trainers like TRL's `SFTTrainer` can cast trainable LoRA factors back to BF16 in quantized runs (leaving DoRA's magnitude vector in FP32).[^huggingface2026peftTroubleshooting][^trl2026SftV117] Inspect the actual parameter dtypes after constructing your trainer. Compare a quantized candidate against an affordable higher-precision baseline so a memory win does not hide a quality loss, and re-evaluate if you later reload the BF16 base to merge and export.

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
