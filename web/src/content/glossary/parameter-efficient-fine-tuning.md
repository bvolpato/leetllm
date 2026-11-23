---
title: Parameter-efficient fine-tuning
aliases: ["PEFT"]
importance: 90
---
**Parameter-efficient fine-tuning (PEFT)** adapts a pretrained model to a task or domain by training only a small set of parameters while freezing almost all of the base weights. The trainable set can be newly inserted modules (adapters, soft prompts), a sparse subset of existing weights (for example biases only), or a low-rank reparameterization of weight updates (most commonly [LoRA](glossary://lora)). The goal is quality close to full fine-tuning at a fraction of the trainable parameter count, [optimizer state](glossary://optimizer-state), and per-task storage.

PEFT is an *adaptation strategy* that decides *which parameters move*. You choose the model architecture and supervision separately ([supervised fine-tuning](glossary://supervised-fine-tuning), preference methods, continued domain text, and so on). Hugging Face's `peft` library is the usual engineering surface for attaching, training, saving, and loading those adapters on Transformers models.

## Intuition

Full fine-tuning of a model with $\Psi$ parameters updates every eligible weight. Under mixed-precision Adam-style training that often means roughly on the order of $12$–$16$ bytes of *model state per parameter* (weights, gradients, and two FP32 moments; sometimes plus FP32 master weights), before activations. For a 70B model that is hundreds of GB of training state and a second full-sized checkpoint per product specialization.

PEFT freezes $W_0$ and either (a) inserts thin trainable paths, (b) unfreezes a tiny subset of $W_0$, or (c) learns a compressed form of $\Delta W$ that can be merged back for inference. One shared base, many small task packs: storage scales with adapter size, not with $\Psi$, and multi-tenant serving can keep one base resident while swapping adapters (see [adapter cache](glossary://adapter-cache)).

PEFT still runs the base network forward and usually propagates gradients through frozen layers to reach trainable adapters or prompts. Freezing weights saves their gradient and optimizer storage, and can avoid computing their weight gradients. Activation memory still depends on sequence length, batch size, and depth. Good data and held-out eval remain necessary. A 2k-token batch can still OOM with tiny adapters.

## How it works

Surveys of PEFT methods (for example Han et al., arXiv:2403.14608) group techniques by *how* they inject learnable capacity:

### 1. Additive methods

Insert new modules or vectors; leave $W_0$ frozen.

**Bottleneck adapters** (Houlsby et al., 2019). Insert a down-project, nonlinearity, and up-project inside Transformer blocks (often after attention and/or FFN, with residual):

$$
\mathrm{Adapter}(x) = W_{\mathrm{up}}\,\sigma(W_{\mathrm{down}}\,x) + x
$$

with $W_{\mathrm{down}} \in \mathbb{R}^{r \times d}$, $W_{\mathrm{up}} \in \mathbb{R}^{d \times r}$, bottleneck rank $r \ll d$. On GLUE with BERT, Houlsby et al. report near full fine-tuning quality while adding only about $3.6\%$ parameters per task (within about $0.4\%$ absolute of full FT on their setup). Serial adapters add depth (and can add latency); later variants place adapters in parallel with sublayers to reduce that cost.

**Soft prompts / prefix tuning.** Keep the network frozen and learn continuous vectors that steer it. Prompt tuning (Lester et al.) optimizes embeddings prepended to the input. Prefix-tuning (Li and Liang, 2021) prepends trainable key/value prefixes at every layer for generation tasks and reports roughly thousandfold fewer task-specific parameters than full fine-tuning at comparable quality in their experiments. Soft prompts change sequence length or attention inputs rather than weight matrices.

**(IA)$^3$ and rescaling.** Learn vectors that rescale intermediate activations (keys, values, FFN channels) instead of inserting full bottlenecks.

### 2. Selective methods

Train a sparse subset of *existing* parameters. **BitFit** updates bias terms (and a task head) only; biases are a tiny fraction of $\Psi$ (often well under $0.1\%$). Useful as a strong cheap baseline when the domain shift is mild; weak when you need large representational change.

### 3. Reparameterized methods

Train factors that *stand in for* a dense update, then optionally fold them into $W_0$ so inference matches a dense model.

**LoRA** (Hu et al., 2021) is the default production choice. For $W_0 \in \mathbb{R}^{d \times k}$:

$$
W = W_0 + \Delta W, \qquad \Delta W = \frac{\alpha}{r} B A
$$

with $B \in \mathbb{R}^{d \times r}$, $A \in \mathbb{R}^{r \times k}$, rank $r \ll \min(d,k)$. Trainable count per matrix is $r(d+k)$ instead of $dk$. Hu et al. report up to about $10{,}000\times$ fewer trainable parameters and about $3\times$ lower GPU memory vs full fine-tuning on GPT-3 175B with Adam when only the low-rank factors train. Merged inference has no extra depth (unlike serial adapters). See [LoRA](glossary://lora) for rank, $\alpha$, target modules, and serving details.

**QLoRA** keeps the same LoRA math but loads the frozen base in a quantized form (commonly 4-bit), so larger models fit for training; adapters still train in higher precision. See [QLoRA](glossary://qlora) and [quantization](glossary://quantization).

Mergeability depends on the method and backend. A linear LoRA update can fold into a compatible base weight matrix; nonlinear bottleneck adapters and learned input prefixes generally remain separate computation. Merging into a quantized base may require dequantization or requantization and can change numerical results.

### 4. Hybrid methods

Stacks that mix adapters, prefixes, and LoRA (for example UniPELT, MAM Adapter) search or combine families when a single method underfits. Most production LLM stacks still standardize on LoRA/QLoRA for tooling and multi-adapter serving support.

## Worked numbers

Compare trainable *update* cost for one square projection $d = k = 4096$:

| Method | Trainable params (order of magnitude) | Notes |
|--------|----------------------------------------|--------|
| Full fine-tune of $W$ | $d^2 \approx 16.8$M | Full Adam state on all of them |
| Bottleneck adapter $r=64$ | $\approx 2dr = 524$k | Plus extra matmuls at every forward if not fused |
| LoRA $r=16$ | $r(d+k) = 131$k | Mergeable into $W_0$ |
| BitFit (bias only, if present) | $O(d)$ | Very small; limited capacity |

For a full model, PEFT trainable fraction is often well under $1\%$ when targeting attention and MLP projections with modest $r$. Always confirm with `print_trainable_parameters()` (or equivalent) before a long run: wrong `target_modules` is a common silent failure (zero or near-zero trainable params, or training the wrong layers).

Memory still has three buckets:

1. **Frozen base weights** (full precision or quantized).
2. **Trainable PEFT tensors + their optimizer state** (small if configuration is sane).
3. **Activations / KV during train or serve** (sequence- and batch-dominated; PEFT does not cancel this).

## Example

You own one 7B instruction base and need three specializations: support tone, internal SQL helper, and a red-team refusal pack.

1. Freeze the base. Attach LoRA ($r=16$, $\alpha=32$) to the projection modules your architecture uses (`q_proj`, `k_proj`, `v_proj`, `o_proj`, and usually `gate_proj` / `up_proj` / `down_proj`).
2. Run three separate [SFT](glossary://supervised-fine-tuning) jobs (same chat template as production). Checkpoint only adapter weights (tens of MB each), not three full 7B copies.
3. Eval each adapter on its task slice *and* on a shared regression suite (tool JSON validity, safety refusals, general QA). Rank and target modules are knobs; bad labels still win over clever PEFT.
4. Serve: merge the SQL adapter into a dedicated endpoint for latency-critical internal traffic; keep support and safety adapters unmerged and route by `adapter_id` against one shared base with GPU/CPU adapter slots.

```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
)
model = get_peft_model(base_model, config)
model.print_trainable_parameters()  # expect << 1% of base params
```

If the 7B base does not fit for training in bf16/fp16, switch to [QLoRA](glossary://qlora): quantized frozen base, same LoRA config family, re-measure quality and long-context behavior.

## Trade-offs

| Choice | Gain | Cost / risk |
|--------|------|-------------|
| LoRA / QLoRA | Standard tooling, mergeable, multi-adapter serving | Rank/module underfit or overfit; quant noise with QLoRA |
| Serial adapters | Strong classic baseline | Extra depth / latency unless fused |
| Soft prompts / prefixes | Tiny task packs; base fully shared | Context budget; training can be unstable; weaker for large behavior shifts |
| BitFit / selective | Minimal surface area | Not enough capacity for hard domain shifts |
| Full fine-tuning | Maximum update freedom | Full optimizer state, full checkpoint per task, higher catastrophic-forgetting risk |
| Higher rank / more modules | More PEFT capacity | Larger adapters, more overfit on small data, higher multi-LoRA VRAM |
| Merge at deploy | Dense path, simple graph | One frozen behavior; no cheap per-request swap |

**What fails in production** is rarely the taxonomy label. Usual failure modes: training and serving chat templates disagree; adapter saved against the wrong base revision; multi-LoRA thrash when concurrent `adapter_id`s exceed GPU slots; PEFT "succeeds" on demo prompts while regressing tool use or safety; activation OOM blamed on adapters when sequence length is the real driver; or treating PEFT as a substitute for data quality and eval gates.

## Why it matters here

Almost every applied LLM specialization path in this curriculum hits PEFT: SFT and preference methods often run *on* adapters; multi-tenant serving assumes small swappable packs; memory lessons split optimizer state from activations; quantization pairs with QLoRA when the base itself does not fit. Knowing PEFT as a family (additive vs selective vs reparameterized) helps you choose among methods while keeping LoRA as the current engineering default: freeze the expensive base, train a measured update, version `(base_id, adapter_id, data_rev)`, and measure specialization and regressions together.

## Related terms

- [LoRA](glossary://lora)
- [QLoRA](glossary://qlora)
- [Supervised fine-tuning](glossary://supervised-fine-tuning)
- [Adapter cache](glossary://adapter-cache)
- [Optimizer state](glossary://optimizer-state)
