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
    "distributed-training-fsdp-deepspeed-zero",
    "reward-modeling-from-preference-data",
    "knowledge-distillation-llms"
  ],
  "section": "Training, Fine-Tuning & Alignment",
  "order": 9
}
---

Your read-only SQL analytics assistant handles routine queries, yet a warehouse migration renames tables and changes join rules. You have 5,000 labeled question-to-SQL pairs and a single 48 GB GPU. Full fine-tuning requires storing <span data-glossary="gradient">gradients</span> and Adam state for every base weight, blowing past 48 GB before the first step finishes. Do you need to update all 70 billion weights independently to teach new SQL conventions?

**LoRA (Low-Rank Adaptation)** bets that downstream weight updates live in a low-dimensional subspace: freeze the pretrained weights and train compact low-rank factors inside selected linear layers. On GPT-3 175B, LoRA cut trainable parameters by ~10,000x and <span data-glossary="gpu">GPU</span> memory by ~3x versus full Adam fine-tuning.[^hu2021] (Rapidly changing table definitions still belong in retrieval; fine-tuning teaches query patterns.)

## Why LoRA exists

Under a lean 12-byte/param mixed-precision recipe (<span data-glossary="fp16">FP16</span> weights and gradients + two FP32 Adam moments), full fine-tuning a 70B model requires **840 GB** before activations (140 GB weights + 140 GB gradients + 560 GB Adam moments), or **1.12 TB** with an FP32 master copy (16 bytes/param, see [distributed training](/learn/distributed-training-fsdp-deepspeed-zero)).

Aghajanyan et al. showed pretrained LLMs can adapt inside a low **intrinsic dimension**,[^aghajanyan2020] inspiring Hu et al.'s **intrinsic rank hypothesis**: constrain weight updates to $\Delta W = BA$ of rank at most $r$.[^hu2021] (Intrinsic dimension and matrix rank differ: $\Delta W = \theta I$ has one free scalar yet full matrix rank whenever $\theta \ne 0$.)

### What LoRA saves, and what it doesn't

Freezing the base eliminates gradients and <span data-glossary="optimizer-state">optimizer state</span> for frozen weights while leaving the frozen weights themselves in VRAM.

> **Common mistake:** Assuming a tiny adapter means tiny VRAM. **Activation memory stays.** Backpropagation still flows through every frozen layer to reach early adapters, so activations scale with sequence length, batch size, and depth. On a 65B model under 12-byte accounting, full fine-tuning needs 780 GB, a frozen FP16 base needs 130 GB, and <span data-glossary="qlora">QLoRA</span> compresses the base to 4-bit NF4 (~33.5 GB with nested scales), leaving 14.5 GB on a 48 GB GPU for adapters, activations, and buffers.[^dettmers2023] When hitting OOM, enable gradient checkpointing or shrink micro-batches before slashing rank.

<figure>
  <img src="illustrations/_generated/lora_memory_budget_dark.png" alt="65B model-state memory: 780 GB full fine-tuning, 130 GB frozen FP16 base, and 33.5 GB NF4 base plus scales leaving 14.5 GB on a 48 GB GPU." />
  <figcaption>65B model-state memory on a shared scale. Under QLoRA on a 48 GB GPU, the remaining 14.5 GB must still hold adapters, activations, and buffers.</figcaption>
</figure>

## The math: from a 4096×4096 layer

### A layer small enough to count

Full fine-tuning updates all $4096^2 = 16.78\text{M}$ entries of $W_0$. Rank-$r$ LoRA ($r=16$) freezes $W_0$ and learns two skinny factors: down-projection $A \in \mathbb{R}^{16 \times 4096}$ and up-projection $B \in \mathbb{R}^{4096 \times 16}$, totaling $131{,}072$ parameters (**0.78%** of the layer, a **99.2%** reduction):

$$
h = W_0 x + \frac{\alpha}{r} B(Ax)
$$

Parenthesizing $B(Ax)$ executes two thin matvecs (~262K FLOPs/token vs 33.6M for $W_0 x$, ~0.78% overhead) without ever materializing dense $BA$.

### Why the product is low rank

For $W_0 \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}$, $A \in \mathbb{R}^{r \times d_{\text{in}}}$ projects into an $r$-dimensional bottleneck and $B \in \mathbb{R}^{d_{\text{out}} \times r}$ expands back, giving $\operatorname{rank}(BA) \le r$ and adding $r(d_{\text{in}} + d_{\text{out}})$ parameters ($2rd$ when square; at $4096\times4096$, $r=8/16/64$ adds 65.5K / 131K / 524K parameters, or 0.39% / 0.78% / 3.12%).[^hu2021]

<figure>
  <img src="illustrations/_generated/lora_adapters_dark.png" alt="Parallel LoRA forward path: input x passes through frozen W0 alongside trainable A (random init) and B (zero init), scaled by alpha/r and summed." />
  <figcaption>Input $x$ flows through frozen $W_0 x$ and low-rank $A \to B$ in parallel. With $B=0$ at init, the adapter starts as an exact no-op on step 0.</figcaption>
</figure>

#### Initialization and gradient symmetry

LoRA initializes $A$ randomly (Gaussian in the paper; Kaiming-uniform in PEFT) and $B = 0$:[^hu2021][^huggingface2026peftlora]

1. **Step-zero identity:** $B=0 \implies \frac{\alpha}{r}B(Ax)=0$, preserving pretrained outputs exactly.
2. **Step-1 and step-2 gradients:** For incoming gradient $g = \nabla_h \mathcal{L}$,
   $$
   \nabla_B \mathcal{L} = \frac{\alpha}{r} g (Ax)^T, \qquad \nabla_A \mathcal{L} = \frac{\alpha}{r} B^T g x^T
   $$
   On step 1, $B=0$ gives $\nabla_A \mathcal{L}=0$ while $\nabla_B \mathcal{L} \ne 0$ (unless $Ax=0$). Once $B$ updates, $A$ receives gradients from step 2 onward. Initializing both to zero leaves both stuck at zero forever.

<!-- leetllm: test, deps=torch, output=show, output_title="Initial gradient behavior" -->
```python title="lora_initial_gradients.py"
import torch

def make_factors(a, b):
    return (torch.tensor([a], dtype=torch.float64, requires_grad=True),
            torch.tensor([[b]], dtype=torch.float64, requires_grad=True))

# fold:start four initialization cases & 2-step SGD check
for name, a, b, values in [
    ("usual (A!=0, B=0)", [1.0, -1.0], 0.0, [1.0, 0.0]),
    ("null_space (Ax=0)", [1.0, -1.0], 0.0, [1.0, 1.0]),
    ("both_zero (stuck)", [0.0, 0.0], 0.0, [1.0, 0.0]),
    ("reversed (A=0, B!=0)", [0.0, 0.0], 1.0, [1.0, 0.0]),
]:
    A, B = make_factors(a, b)
    x = torch.tensor(values, dtype=torch.float64)
    (((B @ (A @ x)).squeeze() - 1).square() / 2).backward()
    print(f"{name:22s} -> |grad A|={A.grad.abs().sum().item():.1f}, |grad B|={B.grad.abs().sum().item():.1f}")

A, B = make_factors([1.0, -1.0], 0.0)
opt, x = torch.optim.SGD([A, B], lr=0.1), torch.tensor([1.0, 0.0], dtype=torch.float64)
for step in (1, 2):
    opt.zero_grad(set_to_none=True)
    ((B @ (A @ x) - 1).square() / 2).backward()
    print(f"step {step} usual          -> |grad A|={A.grad.abs().sum().item():.3f}, |grad B|={B.grad.abs().sum().item():.3f}")
    opt.step()
# fold:end
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

Rank $r$ sets subspace capacity; $\alpha/r$ sets update strength.[^hu2021] Increasing $r$ while holding $\alpha$ fixed shrinks $\alpha/r$ and damps updates, so keep $\alpha/r$ constant (e.g., $\alpha = r$ or $2r$) during rank sweeps. At high ranks ($r \ge 64$), **rsLoRA** replaces $\alpha/r$ with $\alpha/\sqrt{r}$ (`use_rslora=True` in PEFT) so updates stay well-scaled.[^kalajdzievski2023][^huggingface2026peftlora]

## Where to inject LoRA

The original paper adapted $W_Q$ and $W_V$,[^hu2021] whereas QLoRA ablations found matching full fine-tuning required adapting **all linear layers** in every Transformer block, including MLP projections (`gate_proj`, `up_proj`, `down_proj` in SwiGLU blocks).[^dettmers2023]

| Strategy | Target modules | Cost per 7B block ($r=16$) | Role |
|---|---|---|---|
| **Original LoRA** | $W_Q, W_V$ | 262K | Lean baseline |
| **All attention** | $W_Q, W_K, W_V, W_O$ | 524K | Routing-only adaptation |
| **All-linear** | Attention + MLP | 1.25M (~4.8x Q/V) | Strongest default |

> **Key insight:** Attention routes information across tokens; MLPs transform each token's features. All-linear at $r=8$ or $16$ typically beats high-rank Q/V-only. Note that PEFT's `target_modules="all-linear"` excludes `lm_head` on a `PreTrainedModel`, so print matched modules explicitly.[^huggingface2026peftlora]

Keep PEFT families distinct: **prompt tuning / soft prompts**[^lester2021] train virtual input <span data-glossary="embedding">embeddings</span>, and **prefix tuning**[^li2021prefix] prepends learned key/value prefixes at each layer, whereas LoRA injects low-rank factors $A, B$ into linear projections.

## Implementing LoRA with Hugging Face PEFT

### Verify the adapter lifecycle on CPU

Verify step-0 identity, step-1 vs step-2 gradients, reload equivalence, and lossless merging on a tiny Qwen2 block before launching GPU training:

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="Real PEFT wrapper lifecycle on CPU" -->
```python title="tiny-peft-check.py"
# fold:start imports & tiny 1-layer Qwen2 setup
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
# fold:end

model = get_peft_model(base, LoraConfig(
    r=2, lora_alpha=4, target_modules="all-linear",
    lora_dropout=0.0, bias="none", task_type="CAUSAL_LM",
)).eval()

# fold:start step-0 check, 2-step train, reload, and merge checks
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
# fold:end
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

With grouped-query attention (2 query heads, 1 KV head), `k_proj` and `v_proj` are narrower than `q_proj` (48 adapter params each vs 64 for `q_proj`/`o_proj` and 96 per MLP projection, totaling 512).

<figure>
  <img src="illustrations/_generated/lora_target_module_map_dark.png" alt="One-layer rank-2 Qwen2 module map: Q/V adds 112 params, all-attention adds 224, all-linear adds 512 while excluding lm_head." />
  <figcaption>Wider target sets adapt more projections: 112 (Q/V), 224 (all-attention), and 512 (all-linear) while leaving `lm_head` untouched.</figcaption>
</figure>

For multi-GPU training, let `accelerate`, FSDP, or DeepSpeed manage sharding instead of `device_map="auto"` (an inference placement helper).[^huggingface2026acceleratebigmodel] Also inspect adapter dtypes after wrapping: PEFT promotes BF16 LoRA weights to FP32 by default (`autocast_adapter_dtype=True`) so tiny updates survive, whereas `False` keeps them in BF16.[^huggingface2026peftTroubleshooting][^trl2026SftV117]

### Build a minimal PyTorch LoRA layer and merge it

Under the hood, LoRA is 15 lines of PyTorch: freeze `base.weight`, initialize `B = 0`, train only `A` and `B`, and fold $\frac{\alpha}{r}BA$ into $W_0$ via `merged_weight()` (in PEFT, `merge_and_unload()`, always saving the standalone adapter first):[^huggingface2026peftlora]

<!-- leetllm: test, deps=torch, output=show, output_title="From-scratch PyTorch LoRA training and merge" -->
```python title="pytorch-lora-layer.py"
import torch
import torch.nn as nn

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

# fold:start 40-step training & merge verification
torch.manual_seed(0)
base, x, target = nn.Linear(4, 3, bias=False), torch.randn(8, 4), torch.randn(8, 3)
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
print(f"merged vs unmerged max diff: {(x @ layer.merged_weight().T - layer(x)).abs().max().item():.1e}")
# fold:end
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

## Choose rank and diagnose from the failure shape

Start sweeps at $r \in \{8, 16\}$ with $\alpha = r$ or $2r$, `all-linear`, learning rate `1e-4` to `2e-4` (~10x full fine-tuning LR), fixed effective token batch, dropout `0.0` or `0.05`, and gradient checkpointing when activation-bound. Gate every candidate on **both** a held-out task set and a general regression set (never let a high pooled average hide a regression miss).

- **Validation loss stalls:** Verify formatting/gradients, widen Q/V to `all-linear`,[^dettmers2023] or check that fixed $\alpha$ did not shrink $\alpha/r$ (use `use_rslora=True` at high rank).[^kalajdzievski2023]
- **Held-out worsens while train improves:** Low rank does not prevent <span data-glossary="overfitting">overfitting</span>; tune epochs, data diversity, and dropout.
- **OOM with a small adapter on sharded <span data-glossary="fsdp">FSDP</span> / <span data-glossary="zero">ZeRO</span>:** Gathered frozen block weights, activations, and temp buffers dominate peak VRAM; halving adapter state barely moves peak memory.
- **New special tokens never appear:** Call `resize_token_embeddings(len(tokenizer))` *before* wrapping, train the affected input embedding **and** untied `lm_head` output rows, and verify both after reload.[^huggingface2026peftlora]
- **Unexpected latency:** Merge single-task adapters with `merge_and_unload()`.

Choose LoRA for multi-tenant serving, tight VRAM, and rapid iteration; choose full fine-tuning when large out-of-distribution corpora make low-rank updates underfit on held-out evaluations.

## QLoRA: going further

**QLoRA**[^dettmers2023] compresses the frozen base to 4-bit storage and dequantizes on the fly into <span data-glossary="bf16">BF16</span> for matmuls, shrinking a 65B base from 130 GB to ~33.5 GB so it fits on one 48 GB GPU via three techniques:

1. **NormalFloat4 (NF4):** Maps 64-weight blocks (scaled by block absmax into $[-1, 1]$) to 16 nonuniform standard-normal quantile levels (7 negative, exact `0.0`, 8 positive).[^dettmers2023][^bitsandbytes2026nf4Implementation]
2. **Double quantization:** Quantizes the per-block FP32 scales to 8-bit (one FP32 second-level scale per 256 blocks), cutting scale overhead from $0.5$ to $0.127$ bits/weight (~3 GB saved on 65B).[^dettmers2023][^bitsandbytes2026nf4Implementation]
3. **Paged optimizers:** Evicts optimizer state to CPU RAM via CUDA unified memory during activation spikes.[^dettmers2023][^bitsandbytes2026pagedOptimizers]

<!-- leetllm: test, output=show, output_title="NF4 lookup output" -->
```python title="nf4_lookup.py"
codebook = [
    -1.0, -0.696193, -0.525073, -0.394917, -0.284441, -0.184773, -0.091050,
    0.0, 0.079580, 0.160930, 0.246112, 0.337915, 0.440710, 0.562617, 0.722957, 1.0,
]
weights = [-0.2, 0.0, 0.2, 2.0]
scale = max(abs(w) for w in weights)
indices = [min(range(16), key=lambda i: abs(w / scale - codebook[i])) for w in weights]
print("4-bit indices:", indices, "| reconstructed:", [round(scale * codebook[i], 5) for i in indices])
```

<!-- leetllm: output:start -->
```text title="NF4 lookup output" output compact
4-bit indices: [6, 7, 8, 15] | reconstructed: [-0.1821, 0.0, 0.15916, 2.0]
```
<!-- leetllm: output:end -->

In PEFT/Transformers, pass `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=torch.bfloat16)` and call `prepare_model_for_kbit_training(model)` before `get_peft_model`.[^peft2026kbitPreparation][^bitsandbytes2026fourBitAutograd] For export, reload the BF16 base, merge the adapter, optionally re-quantize, and re-run held-out evaluations.[^huggingface2026peftquantization]

## Keep the base shared when serving many adapters

Duplicating a 14 GB base across 50 merged tenants takes 700 GB; one shared 14 GB base plus fifty 128 MB adapters takes **20.4 GB** (**34.3x** smaller).

<figure>
  <img src="illustrations/_generated/lora_serving_modes_dark.png" alt="Merged single-task checkpoints (700 GB for 50 tasks) vs shared base with dynamic adapters (20.4 GB) using Punica SGMV and S-LoRA unified paging." />
  <figcaption>Merging removes adapter branches for single-task serving; dynamic routing shares one base across many tasks (20.4 GB vs 700 GB for 50 adapters).</figcaption>
</figure>

Two serving designs keep multi-adapter latency low: **Punica** uses **Segmented Gather Matrix-Vector (SGMV)** kernels to batch heterogeneous requests through one shared base GEMM ($X W_0^T$) before applying each request's adapter correction in parallel,[^chen2023punica] and **S-LoRA** introduces **Unified Paging** to store KV-cache blocks and adapters in one paged GPU pool without fragmentation.[^sheng2023] Merge your top one or two hot adapters; route dynamically once traffic spans dozens of variants.

<details>
<summary>Deep dive: DoRA (Weight-Decomposed Low-Rank Adaptation) and detached norm gradients</summary>

**DoRA**[^liu2024] decouples each weight row's magnitude $m \in \mathbb{R}^{d_{\text{out}}}$ (initialized to $\|W_0\|_{\text{row}}$) from its unit direction:

$$
V = W_0 + \frac{\alpha}{r}BA, \qquad W_{\text{DoRA}} = m \odot \frac{V}{\|V\|_{\text{row}}}
$$

Step-zero identity holds ($B=0 \implies W^{(0)} = W_0$), on square projections magnitude adds $1/(2r)$ parameters over LoRA ($d_{\text{out}} / [r(d_{\text{in}} + d_{\text{out}})]$ in general), and PEFT enables it via `use_dora=True`.[^huggingface2026peftdora] To save memory, both DoRA and PEFT detach $\|V\|_{\text{row}}$ during backward: for $V=(3, 4), m=5, x=(1, 0)$, full differentiation subtracts the projection along $V$ to give `[0.64, -0.48]`, while PEFT's detached-norm backward gives `[1.0, 0.0]`:

<!-- leetllm: test, deps=torch==2.13.0,transformers==5.16.1,peft==0.20.0, output=show, output_title="DoRA backward check" -->
```python title="dora-backward-check.py"
# fold:start imports & single-row DoRA layer setup
import torch
from torch import nn
from peft import LoraConfig, get_peft_model

base = nn.Sequential(nn.Linear(2, 1, bias=False))
with torch.no_grad():
    base[0].weight.copy_(torch.tensor([[3.0, 4.0]]))
model = get_peft_model(base, LoraConfig(r=2, lora_alpha=2, target_modules=["0"], use_dora=True))
layer = model.base_model.model[0]
with torch.no_grad():
    layer.lora_A["default"].weight.copy_(torch.eye(2))
    layer.lora_B["default"].weight.zero_()
# fold:end

output = model(torch.tensor([[1.0, 0.0]]))
output.sum().backward()
peft_grad = layer.lora_B["default"].weight.grad.flatten()

direction = torch.tensor([3.0, 4.0], requires_grad=True)
full_grad, = torch.autograd.grad(5 * direction[0] / direction.norm(), direction)
print(f"out={output.item():.1f} | full_grad={[round(v, 2) for v in full_grad.tolist()]} | detached_grad={[round(v, 2) for v in peft_grad.tolist()]}")
```

<!-- leetllm: output:start -->
```text title="DoRA backward check" output compact
out=3.0 | full_grad=[0.64, -0.48] | detached_grad=[1.0, 0.0]
```
<!-- leetllm: output:end -->

</details>

## What to check before moving on

Verify five invariants before shipping: $A/B$ shapes match every target including narrower GQA K/V layers; step-0 identity, step-1 $B$ gradient, step-2 $A$ gradient, and frozen base weights all hold; reloaded and merged eval-mode logits match within float tolerance; peak VRAM is measured at target sequence length; and both held-out task and regression gates pass.

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
    "explanation": "Ordinary scale is alpha/r: 24/6 = 4 and 24/24 = 1. Preserving scale 4 at rank 24 needs alpha 96. A square-root change describes a different scaling convention, and matching explicit scale alone need not preserve learned update norm."
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

> **Next:** Continue to [Reinforcement Learning Basics](/learn/introduction-to-reinforcement-learning-fundamentals).
