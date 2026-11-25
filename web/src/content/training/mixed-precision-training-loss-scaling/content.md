---
{
  "id": "mixed-precision-training-loss-scaling",
  "title": "Mixed Precision Training",
  "slug": "mixed-precision-training-loss-scaling",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/mixed_precision_dark.png",
  "companies": [
    "Nvidia",
    "Google",
    "Meta",
    "Microsoft"
  ],
  "shortDescription": "A 16-bit store can erase a tiny update near one or overflow a large activation, which is why the optimizer step still keeps an FP32 path.",
  "keyConceptsTested": [
    "FP16 vs BF16 range and nearby precision",
    "FP32 update state and gradient resolution",
    "FP16 loss scaling and overflow backoff",
    "PyTorch AMP and GradScaler control flow",
    "Gradient accumulation per optimizer step",
    "Memory accounting beyond activation dtype",
    "Distributed communication dtype",
    "Comparable target-hardware precision profiles",
    "RL train-inference policy mismatch from low-precision rounding",
    "FP8 as a scaled advanced path"
  ],
  "section": "Training, Fine-Tuning & Alignment",
  "order": 5,
  "prerequisites": [
    "pytorch-training-loops",
    "cuda-gpu-computing-for-ml"
  ]
}
---

A weight sits at `1.0`. The optimizer subtracts `0.0001`, and in naive 16-bit storage the weight stays `1.0`: no exception, no warning, just silently stalled learning. On another batch, an activation near `100,000` crosses FP16's `65,504` ceiling, flips to `Inf`, and poisons the step.

<span data-glossary="mixed-precision">Mixed precision training</span> avoids both traps by separating compute from persistent state: fast 16-bit Tensor Core matrix multiplications paired with FP32 parameters, optimizer moments, and sensitive reductions.[^micikevicius2018] In <span data-glossary="pytorch">PyTorch</span> <span data-glossary="automatic-mixed-precision">Automatic Mixed Precision (AMP)</span>, parameters remain in FP32 while `autocast` dispatches eligible operations to <span data-glossary="bf16">BF16</span> or <span data-glossary="fp16">FP16</span>.[^pytorchAmpDocs2026]

## A floating-point number has two limits

A finite normal binary float packs a sign bit $s$, exponent $e$, and fraction $m$:

$$
x = (-1)^s \times 2^{e - \text{bias}} \times \left(1 + \frac{m}{2^{\text{fraction\_bits}}}\right)
$$

Think of the exponent as picking a ruler and the fraction as its tick marks. Every ruler carries the same number of ticks, so spacing doubles at every power of two. Two independent properties follow: **exponent bits** set dynamic range (underflow/overflow limits), while **fraction bits** set nearby resolution (machine epsilon $\epsilon$ at `1.0`). FP16 and BF16 split their 15 remaining bits in opposite ways:

| Format | Sign | Exp (bias) | Frac | Positive normal range | Epsilon ($\epsilon$ at 1.0) |
|---|---:|---:|---:|---|---|
| FP32 | 1 | 8 (127) | 23 | $1.18\times10^{-38} \dots 3.40\times10^{38}$ | $1.19\times10^{-7}$ |
| FP16 | 1 | 5 (15) | 10 | $6.10\times10^{-5} \dots 65{,}504$ (subnormal to $5.96\times10^{-8}$) | $9.77\times10^{-4}$ |
| BF16 | 1 | 8 (127) | 7 | $1.18\times10^{-38} \dots 3.39\times10^{38}$ | $7.81\times10^{-3}$ |

BF16 matches FP32's exponent range (some accelerators like Cloud TPU flush BF16 subnormals to zero[^googleBfloat162026]) at the cost of **8x coarser spacing near `1.0` than FP16** and **65,536x coarser than FP32**.

<figure>
  <img src="illustrations/_generated/mixed_precision_dark.png" alt="Logarithmic magnitude ranges for FP32, FP16, and BF16 showing 1.2e-8 and 100000 becoming zero and infinity in FP16 while staying finite in BF16." />
  <figcaption>Bit widths and magnitude ranges across FP32, FP16, and BF16. Both `1.2e-8` and `100,000` fall outside FP16's range while remaining finite in BF16.</figcaption>
</figure>

## Inspect both neighbors before judging an update

Adding `0.0001` to a weight at `1.0` vanishes in both FP16 and BF16 even though both represent `0.0001` standalone. This is **swamping**: the sum rounds back to the stored weight.

Because grid spacing doubles at `1.0`, the rounding cell is asymmetric: the gap **below** `1.0` is half the gap **above** `1.0`, so subtraction survives at half the magnitude required for addition:

| Format | Gap below 1.0 | Gap above 1.0 | Half-gap down | Half-gap up |
|---|---:|---:|---:|---:|
| FP16 | $2^{-11}$ | $2^{-10}$ | $2^{-12} \approx 2.44\times10^{-4}$ | $2^{-11} \approx 4.88\times10^{-4}$ |
| BF16 | $2^{-8}$ | $2^{-7}$ | $2^{-9} \approx 1.95\times10^{-3}$ | $2^{-8} \approx 3.91\times10^{-3}$ |

Inspect both neighbors with `torch.nextafter` and verify that `1e-4` disappears in both 16-bit formats while `0.0003` (FP16) and `0.0025` (BF16) cross their downward half-gaps:[^pytorchTypeInfo2026][^pytorchNextafter2026]

<!-- leetllm: test, deps=torch, output=show, id=precision-lab -->
```python title="floating-point-neighbors.py"
import torch

for label, dtype, dec in (("FP16", torch.float16, 0.0003), ("BF16", torch.bfloat16, 0.0025)):
    one = torch.tensor(1.0, dtype=dtype)
    below = torch.nextafter(one, torch.tensor(0.0, dtype=dtype))
    above = torch.nextafter(one, torch.tensor(float("inf"), dtype=dtype))
    print(f"{label}: down={1.0 - below.item():.6f}, up={above.item() - 1.0:.6f}, "
          f"minus_{dec}={(one - torch.tensor(dec, dtype=dtype)).item():.6f}, "
          f"minus_1e-4={(one - torch.tensor(1e-4, dtype=dtype)).item():.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP16: down=0.000488, up=0.000977, minus_0.0003=0.999512, minus_1e-4=1.000000
BF16: down=0.003906, up=0.007812, minus_0.0025=0.996094, minus_1e-4=1.000000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/floating_point_neighbors_dark.png" alt="Asymmetric nearest-even rounding cells around 1.0 in FP16 and BF16: subtracting 0.0001 rounds back to 1.0 in both, while 0.0003 (FP16) and 0.0025 (BF16) cross their lower midpoints." />
  <figcaption>The rounding cell around `1.0` is half as wide below `1.0` as above it. Subtracting `0.0001` lands inside the cell in both 16-bit formats and disappears.</figcaption>
</figure>

> **Key insight:** Keep parameters and Adam moments in FP32 while eligible forward/backward ops run in 16-bit. Tiny updates accumulate in FP32 until they cross into the next 16-bit compute tick. (Alternative paths like BF16 state with stochastic rounding let small updates survive probabilistically.[^ozkara2025StochasticRounding])

## Range decides whether gradients exist at all

Swamping erases updates added to a larger weight; **underflow** and **overflow** destroy standalone values outside the exponent range. Casting `[1.2e-8, 1.0e5]` to FP16 produces `[0.0, inf]` (`1.2e-8` sits below half FP16's smallest subnormal `5.96e-8` and `1e5 > 65,504`), whereas BF16 keeps both finite as `[1.20e-8, 9.98e4]` (with 7-bit rounding), which is why BF16 rarely requires loss scaling.[^kalamkar2019]

## FP16 uses loss scaling to rescue small gradients

Because differentiation is linear, **<span data-glossary="loss-scaling">loss scaling</span>** shifts tiny FP16 gradients upward before <span data-glossary="backpropagation">backpropagation</span> writes them:[^micikevicius2018]

$$
\mathcal{L}_{\text{scaled}} = S \cdot \mathcal{L}, \qquad \nabla_w \mathcal{L}_{\text{scaled}} = S \cdot \nabla_w \mathcal{L}, \qquad g_{\text{true}} = \frac{1}{S} \cdot g_{\text{scaled}}
$$

Multiplying by $S = 1024$ adds 10 binary exponent steps, moving $1.2 \times 10^{-8}$ into representable FP16 (`1.23e-5`) before dividing by $S$ in FP32 to recover $1.20 \times 10^{-8}$ within `0.08%` relative error.

> **Common mistake:** Clipping gradients before `scaler.unscale_(optimizer)`. With true norm `0.02` (`max_norm=1.0`) and `scale=1024`, clipping first sees `20.48` and shrinks the final gradient twentyfold. Also remember loss scaling runs *after* forward, so it can never rescue a forward activation that already overflowed `65,504` or rounded to zero.

### Dynamic loss scaling as a feedback controller

`torch.amp.GradScaler` automates $S$ with a feedback loop:[^micikevicius2018][^pytorchGradScalerV215][^pytorchAmpDocs2026]

1. Start high ($S_0 = 65536.0$) with clean-step counter $c = 0$.
2. Run forward under `autocast`, then backpropagate `scaler.scale(loss)`.
3. Call `scaler.unscale_(optimizer)` to divide gradients by $S$ in FP32 and scan for `Inf`/`NaN`.
4. **Non-finite gradient found:** skip `optimizer.step()` atomically (freezing weights and Adam moments), halve $S \leftarrow 0.5 S$, and reset $c \leftarrow 0$.
5. **All gradients finite:** clip norms if needed, apply `optimizer.step()`, and increment $c$; when $c$ hits `growth_interval` (default `2000`), double $S$ and reset $c \leftarrow 0$.

Watch `GradScaler` rescue `1.2e-8`, skip a spiked step atomically, halve the scale to 512, and double back to 1024 after two clean steps:

<!-- leetllm: test, deps=torch, output=show, id=precision-backoff -->
```python title="overflow-backoff.py"
# fold:start model, optimizer, and GradScaler setup
import torch

model = torch.nn.Linear(1, 2, bias=False)
with torch.no_grad():
    model.weight.fill_(1.0)
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
scaler = torch.amp.GradScaler("cpu", init_scale=1024, growth_interval=2)
# fold:end

for name, large_grad in (("quiet", 0.02), ("spike", 100.0), ("quiet_again", 0.02), ("quiet_twice", 0.02)):
    optimizer.zero_grad(set_to_none=True)
    before = model.weight.detach().clone()
    with torch.autocast("cpu", dtype=torch.float16):
        loss = (model(torch.ones(1, 1)).float() * torch.tensor([1.2e-8, large_grad])).sum()
    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    grad = model.weight.grad.clone()
    if torch.isfinite(grad).all():
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    scaler.step(optimizer)
    scaler.update()
    step = int(optimizer.state[model.weight]["step"])
    print(f"{name:<11}: grad={[round(v, 4) if abs(v) > 1e-4 else f'{v:.2e}' for v in grad.flatten().tolist()]}, "
          f"updated={not torch.equal(model.weight, before)}, adam_step={step}, next_scale={scaler.get_scale():.0f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
quiet      : grad=['1.20e-08', 0.02], updated=True, adam_step=1, next_scale=1024
spike      : grad=['1.20e-08', inf], updated=False, adam_step=1, next_scale=512
quiet_again: grad=['1.20e-08', 0.02], updated=True, adam_step=2, next_scale=512
quiet_twice: grad=['1.20e-08', 0.02], updated=True, adam_step=3, next_scale=1024
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/loss_scaling_feedback_loop_dark.png" alt="Four-batch GradScaler trace: scale 1024 rescues 1.2e-8, skips the spiked step atomically while halving to 512, then doubles back to 1024 after two clean steps." />
  <figcaption>Dynamic loss scaling skips the entire optimizer step on `spike`, holding weights and Adam moments fixed while halving `S`, then recovers after clean steps.</figcaption>
</figure>

<details>
<summary>Deep dive: multiple optimizers and non-finite forward losses</summary>

Two `GradScaler` subtleties matter in complex loops:

1. **Multiple optimizers skip independently:** Each `scaler.step(opt)` checks only its own `.grad` tensors, followed by one shared `scaler.update()`.[^pytorchAmpExamples2026] If two optimizers require joint atomicity, check finiteness across both explicitly.
2. **`GradScaler` checks `.grad`, not `loss`:** An infinite additive constant in `loss` can leave finite derivatives, so check `torch.isfinite(loss)` before backward.[^pytorchGradScalerSource2026]

</details>

## Compute low, update high

In a <span data-glossary="cuda">CUDA</span> AMP loop, keep weights in FP32, wrap only forward and loss in `torch.autocast`, keep `.backward()` outside `autocast`, and enable `GradScaler` for FP16 (check `torch.isfinite(loss)` under BF16 too):[^pytorchAmpDocs2026]

```python title="cuda-amp-training-shape.py"
dtype = torch.bfloat16  # or torch.float16 with GradScaler enabled
scaler = torch.amp.GradScaler("cuda", enabled=(dtype == torch.float16))
for batch, target in dataloader:
    optimizer.zero_grad(set_to_none=True)
    with torch.autocast(device_type="cuda", dtype=dtype):
        loss = criterion(model(batch.cuda()), target.cuda())
    if not torch.isfinite(loss).all().item():
        raise FloatingPointError("Non-finite forward loss")
    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    scaler.step(optimizer)
    scaler.update()
```

Autocast is op-specific: matmuls run in 16-bit while reductions like `cross_entropy` widen to FP32, backward mirrors forward dtypes, and `.grad` accumulates in FP32. Never call `model.half()` with AMP.

### GradScaler and gradient accumulation share one optimizer step

Across accumulated micro-batches, hold one constant loss scale: run `scaler.scale(micro_loss).backward()` per micro-batch, and run `unscale_`, clip, `step`, `update`, and LR scheduler steps **once per optimizer boundary** (saving `scaler.state_dict()` in checkpoints).[^pytorchAmpExamples2026]

When micro-batches hold unequal active token counts, divide each micro-batch's summed token loss by the **window's total active tokens** rather than averaging per-micro-batch means:

<!-- leetllm: test, deps=torch, output=show -->
```python title="unequal-token-accumulation.py"
import torch

targets = (torch.tensor([0.0]), torch.tensor([2.0, 2.0, 2.0]))
total_tokens = sum(y.numel() for y in targets)

def accumulated_gradient(mode: str) -> float:
    w = torch.tensor(1.0, requires_grad=True)
    for y in targets:
        losses = (w - y).square()
        (losses.mean() / len(targets) if mode == "mean_of_means" else losses.sum() / total_tokens).backward()
    return w.grad.item()

w = torch.tensor(1.0, requires_grad=True)
(w - torch.cat(targets)).square().mean().backward()
print(f"full_batch={w.grad.item():.1f}, mean_of_means={accumulated_gradient('mean_of_means'):.1f}, "
      f"token_weighted={accumulated_gradient('token_weighted'):.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full_batch=-1.0, mean_of_means=0.0, token_weighted=-1.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/accumulation_boundary_dark.png" alt="One target-zero token (+2 grad) and three target-two tokens (-6 grad): mean-of-means gives 0 while dividing by all four tokens recovers -1.0." />
  <figcaption>Averaging micro-batch means gives `0.0`, while normalizing by all four active tokens recovers the exact `-1.0` full-batch gradient.</figcaption>
</figure>

## Account for memory before claiming savings

Ordinary AMP does **not** halve total memory: weights (4 B), gradients (4 B), and AdamW moments (8 B) stay FP32 (**16 bytes/param**, matching the FP32 master-weight recipe's 16 B/param), while only eligible saved activations halve from 4 B to 2 B (and FP32 ops still save FP32 tensors, inspectable via `saved_tensors_hooks`[^pytorchSavedTensorHooks2026]).

| Component | Pure FP32 | FP32 weights + AMP | FP32 master-weight recipe |
|---|---:|---:|---:|
| Weights + Gradients | 8 B ($8N$) | 8 B ($8N$, FP32) | 4 B 16-bit + 4 B FP32 master |
| AdamW moments ($m, v$) | 8 B ($8N$) | 8 B ($8N$, FP32) | 8 B ($8N$, FP32) |
| **Static model state** | **16 B / param** | **16 B / param** | **16 B / param** (+4 B if FP32 grad) |
| Eligible saved activations | 4 B / value | 2 B / value | 2 B / value |

With 100M parameters (1.49 GiB static) and 800M saved activation values, halving activation bytes from 2.98 GiB to 1.49 GiB lowers total memory from `4.47 GiB` to `2.98 GiB`, a **33.3%** reduction (`(4.47 - 2.98) / 4.47`), not 50%. Profile peak allocated memory on real steps,[^korthikanti2022][^micikevicius2018] and shard persistent FP32 state with <span data-glossary="zero">ZeRO</span> or FSDP.[^rajbhandari2020][^zhao2023]

<figure>
  <img src="illustrations/_generated/mixed_precision_dtype_policy_dark.png" alt="100M params and 800M activations: FP32 uses 4.47 GiB vs AMP 2.98 GiB (33.3% drop); separately, 100M gradient payload drops from 0.37 GiB (FP32) to 0.19 GiB (BF16)." />
  <figcaption>Halving activation bytes cuts total memory by 33.3% while static FP32 state stays fixed. Gradient communication dtype is configured separately.</figcaption>
</figure>

## Distributed jobs add a communication dtype

Distributed reduction dtype (`reduce_dtype` in FSDP) is independent of `compute_dtype`.[^pytorchFsdpDocs2025] Shipping a 100M-parameter gradient payload drops from `0.37 GiB` in FP32 to `0.19 GiB` in BF16 (50% less bandwidth), yet watch accumulation precision inside the collective: if three workers contribute `[512, 3, -512]`, adding left-to-right in BF16 rounds `512 + 3 = 515` to `516`, yielding `4` instead of `3`. Keep the running sum in FP32 before storing the final reduced result, and always log `compute_dtype`, `update_storage_dtype`, and `reduce_dtype` separately.

## Choose precision from controlled runs

Hold model, data, seeds, batch shape, evaluation, and hardware fixed when comparing recipes, recording TF32 flags and synchronizing warmed-up GPU timers.[^pytorchNumericalAccuracy2026][^pytorchCudaSemantics2026] Watch pure FP16 parameter storage stall at its initial MSE (`0.00010000`) while FP32 parameters with BF16 autocast track FP32 cleanly:

<!-- leetllm: test, deps=torch, output=show, output_title="Precision recipe training comparison" -->
```python title="precision-training-comparison.py"
import torch

def run_steps(mode: str, steps: int = 40) -> float:
    torch.manual_seed(0)
    x, target = torch.eye(4), torch.full((4, 4), 0.99)
    dtype = torch.float16 if mode == "pure_fp16" else torch.float32
    w = torch.nn.Parameter(torch.full((4, 4), 1.0, dtype=dtype))
    opt = torch.optim.SGD([w], lr=0.05)
    for _ in range(steps):
        opt.zero_grad()
        if mode == "amp_bf16":
            with torch.autocast("cpu", dtype=torch.bfloat16):
                loss = ((x @ w) - target).float().square().mean()
        else:
            loss = ((x.to(dtype) @ w) - target.to(dtype)).square().mean()
        loss.backward()
        opt.step()
    return ((x @ w.float()) - target).square().mean().item()

for mode in ("fp32", "amp_bf16", "pure_fp16"):
    print(f"{mode:<10} final_mse={run_steps(mode):.8f}")
```

<!-- leetllm: output:start -->
```text title="Precision recipe training comparison" output compact
fp32       final_mse=0.00006056
amp_bf16   final_mse=0.00005917
pure_fp16  final_mse=0.00010000
```
<!-- leetllm: output:end -->

### RL can expose a BF16 train-inference mismatch

In RL fine-tuning, one inference stack generates <span data-glossary="rollout">rollouts</span> while a training stack recomputes log-probabilities. Because BF16 ticks are 8x wider than FP16, minor kernel rounding differences can push nearby <span data-glossary="logits">logits</span> across a BF16 tick, shifting token probabilities enough to flip a sampled token under the same random draw. Qi et al. found scaled FP16 reduced this train-inference divergence across their tested RL stacks.[^qi2025fp16mismatch]

<!-- leetllm: test, deps=torch, output=show -->
```python title="compare-policy-rounding.py"
import torch

def policy_gap(dtype: torch.dtype, first: float, second: float) -> float:
    p1 = torch.softmax(torch.tensor([first, 1.0]).to(dtype).float(), dim=0)[0]
    p2 = torch.softmax(torch.tensor([second, 1.0]).to(dtype).float(), dim=0)[0]
    return abs(p1.item() - p2.item())

for first, second in ((1.0038, 1.0040), (1.0004, 1.0006)):
    print(f"logits={first},{second}: FP16_gap={policy_gap(torch.float16, first, second):.7f}, "
          f"BF16_gap={policy_gap(torch.bfloat16, first, second):.7f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logits=1.0038,1.004: FP16_gap=0.0000000, BF16_gap=0.0019531
logits=1.0004,1.0006: FP16_gap=0.0002441, BF16_gap=0.0000000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/policy_rounding_boundaries_dark.png" alt="FP16 and BF16 quantization ticks near 1.0 showing an 8x larger softmax jump (0.0019531 vs 0.0002441) when crossing a BF16 boundary." />
  <figcaption>Crossing a BF16 boundary creates an 8x larger probability jump than FP16. Replay matched prefixes with fixed draws to measure train-vs-rollout divergence directly.</figcaption>
</figure>

## Evaluate FP8 after measuring the lower-precision path

On Hopper/Blackwell GPUs, **FP8** halves operand bytes again via two complementary OCP formats:[^ocp2023ofp8][^micikevicius2022] **E4M3** (max `448`, no `Inf`, favored for forward activations/weights) and **E5M2** (max `57,344`, keeps `Inf`, favored for backward gradients).

| FP8 recipe | Scaling mechanism | Trade-off |
|---|---|---|
| **Current scaling** | Live tensor `amax` in FP32 | Reduction overhead unless fused |
| **Delayed scaling** | Predicted from `amax` history | Sudden spikes saturate before update |
| **MXFP8 block scaling** | One E8M0 power-of-two scale per 32 values[^ocp2023mx] | Tighter outlier isolation; needs native block kernels |

Transformer Engine provides hybrid E4M3/E5M2 and MXFP8 recipes.[^nvidiaTransformerEngine2026][^teRecipes2026] Watch for **saturating conversion**: overflowing `448` in E4M3 can clamp silently to `448` instead of `NaN`, so log saturation rates beside throughput and held-out accuracy.[^ocp2023ofp8]

<figure>
  <img src="illustrations/_generated/fp8_scale_contract_dark.png" alt="E4M3 (max 448, no Inf) and E5M2 (max 57,344, with Inf) beside MXFP8 pairing 32 FP8 values with one E8M0 scale." />
  <figcaption>FP8 splits forward (E4M3) and backward (E5M2); MXFP8 attaches one E8M0 power-of-two scale per 32-element block.</figcaption>
</figure>

## When a precision change goes wrong

- **Loss flatlines with finite gradients:** Parameters are stored in 16-bit and swamping updates; check `optimizer.param_groups` dtypes.
- **FP16 trains slower or worse than FP32:** Unscaled small gradients underflow; enable `GradScaler` and log skipped steps.
- **Erratic FP16 steps:** Clipping happened before `scaler.unscale_(optimizer)`; always unscale, then clip, then step.
- **Effective batch collapses:** `step()`/`update()` ran inside gradient accumulation; move them to the optimizer boundary.
- **Scale keeps dropping:** Persistent backoff signals oversized values; forward overflows cannot be fixed by smaller loss scales.
- **Memory fell <50% or network stayed high:** Static FP32 state stays constant under AMP, and BF16 compute can still transmit FP32 gradients; verify `reduce_dtype` explicitly.

```mastery-quiz
[
  {
    "question": "Which precision choice best matches a workload that needs FP32-like exponent range but can tolerate coarser mantissa resolution?",
    "options": [
      "BF16 compute for range; FP32 sensitive updates/reductions for local accuracy. Range and nearby resolution are separate properties.",
      "BF16 compute and updates for range; FP32-like exponents also preserve small parameter changes at the same nearby resolution.",
      "Scaled FP16 forward compute for range; backward loss scaling expands the representable range of existing forward activations.",
      "BF16 compute and reductions for range; matching operand and reduction dtypes prevents the loss of small summands."
    ],
    "answer": "BF16 compute for range; FP32 sensitive updates/reductions for local accuracy. Range and nearby resolution are separate properties.",
    "explanation": "BF16 keeps a wide exponent range close to FP32 while sacrificing mantissa precision. Mixed precision intentionally separates dtypes across operations, so sensitive accumulations or updates can remain FP32 rather than forcing every tensor into one format."
  },
  {
    "question": "A backward kernel writes a gradient in FP16 before it reaches an FP32 accumulation buffer. With scaling off, the gradient is 2⁻²⁸ and the FP16 write gives zero. With a loss scale of 16,384, which sequence preserves the gradient and gives the clipper its original magnitude?",
    "options": [
      "Run backward on the original loss. Scale the gradient as it enters the FP32 buffer, then unscale before clipping.",
      "Scale the loss before backward. Unscale the accumulated gradient in FP32, then clip and take the optimizer step.",
      "Scale the loss before backward. Unscale the gradient in FP16, then widen it to FP32 and clip.",
      "Scale the loss before backward. Clip the accumulated gradient in FP32, then unscale and take the optimizer step."
    ],
    "answer": "Scale the loss before backward. Unscale the accumulated gradient in FP32, then clip and take the optimizer step.",
    "explanation": "Scaling the loss multiplies the derivative by 16,384, so the kernel writes 2⁻¹⁴ exactly in FP16. Dividing in FP32 recovers 2⁻²⁸ for clipping and the optimizer. Scaling at the buffer multiplies a stored zero. Dividing in FP16 rounds the recovered value back to zero. Clipping before division makes the clipper see a gradient 16,384 times too large."
  },
  {
    "question": "A precision check sends standalone values 5 × 10^-9 and 2 × 10^5 through FP16 and BF16 casts. Which range prediction is correct?",
    "options": [
      "FP16: small finite, large finite; BF16: small finite, large finite. Attribute both FP16 outcomes to safe autocast saturation.",
      "FP16: small zero, large overflow; BF16: small zero, large finite. Attribute BF16's small zero to its fewer fraction bits.",
      "FP16: small zero, large overflow; BF16: small finite, large finite. Preserve range separately from nearby resolution.",
      "FP16: small finite, large finite; BF16: small finite, large overflow. Attribute the BF16 overflow to its coarser local grid."
    ],
    "answer": "FP16: small zero, large overflow; BF16: small finite, large finite. Preserve range separately from nearby resolution.",
    "explanation": "Five times ten to the minus nine is below half the first FP16 subnormal spacing and two hundred thousand exceeds its largest finite value. BF16 keeps these ranges with coarser nearby resolution. Autocast does not make every operation saturate safely."
  },
  {
    "question": "A scaled backward pass produces a nonfinite gradient in one parameter group owned by a single ordinary optimizer. What should its GradScaler step do?",
    "options": [
      "Current optimizer: update finite parameters and clip the nonfinite parameter; scale controller: keep the current scale.",
      "Current optimizer: update unaffected parameter groups and skip its affected group; scale controller: unscale that group separately.",
      "Current optimizer: update finite parameters and omit the invalid gradient; scale controller: change learning rate for the next batch.",
      "Current optimizer: skip its complete step; scale controller: adjust the loss scale before the next batch, preserving optimizer-level atomicity."
    ],
    "answer": "Current optimizer: skip its complete step; scale controller: adjust the loss scale before the next batch, preserving optimizer-level atomicity.",
    "explanation": "GradScaler skips this optimizer's step as a unit. With multiple optimizers, skip decisions are independent and scaler.update runs once after all decisions; an algorithm requiring joint atomicity needs an explicit joint check."
  },
  {
    "question": "With gradient accumulation over several microbatches, when should a GradScaler update and optimizer step occur?",
    "options": [
      "Update point: after the accumulated microbatches; unscale/check/clip accumulated gradients, then optimizer step and scale update.",
      "Update point: after each microbatch; unscale/check/clip each microbatch separately, then optimizer step and scale update.",
      "Update point: at epoch end; retain gradients across logical optimizer updates, then optimizer step and scale update.",
      "Update point: before each backward; unscale the previous gradient first, then add another scaled gradient into the same update."
    ],
    "answer": "Update point: after the accumulated microbatches; unscale/check/clip accumulated gradients, then optimizer step and scale update.",
    "explanation": "Accumulation changes where one logical optimizer update occurs. Scaling, unscaling, finite checks, clipping, and scale updates need to align with that update point rather than treating each microbatch as a separate optimizer step."
  },
  {
    "question": "A controlled precision run lowers peak memory from 9 GiB to 6 GiB. Which calculation gives the percentage of the original peak that the run freed?",
    "options": [
      "100 × (9 − 6) / ((9 + 6) / 2)",
      "100 × (9 − 6) / 9",
      "100 × (9 − 6) / 6",
      "100 × 6 / 9"
    ],
    "answer": "100 × (9 − 6) / 9",
    "explanation": "The run freed 3 of its original 9 GiB, about 33.3%. Using the average peak of 7.5 GiB gives a symmetric percentage difference of 40%. Using the final peak of 6 GiB gives the 50% increase needed to return to 9 GiB. Dividing 6 by 9 gives the 66.7% still in use."
  },
  {
    "question": "Three workers use BF16 matrix operands. Their gradient contributions are 512, 3 and −512. The collective must add them from left to right. Each BF16 write rounds to nearest, ties to even. Which plan delivers the exact sum to the optimizer?",
    "options": [
      "Keep the running sum in FP32 for both additions, then store the result in BF16.",
      "Add 512 and 3 in BF16, widen that partial sum to FP32, then subtract 512.",
      "Add 512 and 3 in FP32, store that partial sum in BF16, then widen it for the subtraction.",
      "Keep the running sum in BF16 for both additions, then store the result in FP32."
    ],
    "answer": "Keep the running sum in FP32 for both additions, then store the result in BF16.",
    "explanation": "FP32 keeps the partial sum of 515. Subtracting 512 leaves 3, which BF16 stores exactly. The BF16 neighbors around 515 are 512 and 516. Adding in BF16 or saving the FP32 partial in BF16 rounds it to 516, so the subtraction gives 4. Widening the completed BF16 sum preserves that 4."
  },
  {
    "question": "An RL policy earns less reward after deployment. You replay one token prefix from the same checkpoint, varying only the precision used to compute its logits. Both paths pick A if the draw is below P(A) and B otherwise. Each record lists (P(A), draw). Which pair shows that precision changed the sampled token?",
    "options": [
      "Training (0.601, 0.605), serving (0.603, 0.605).",
      "Training (0.601, 0.599), serving (0.601, 0.605).",
      "Training (0.601, 0.599), serving (0.603, 0.605).",
      "Training (0.601, 0.602), serving (0.603, 0.602)."
    ],
    "answer": "Training (0.601, 0.602), serving (0.603, 0.602).",
    "explanation": "With the draw fixed at 0.602, training picks B and serving picks A because the probability crosses the draw. A shared draw of 0.605 gives B on both paths. When both probabilities are 0.601, the different draws alone change the token. When both the probability and the draw change, replaying 0.599 on both paths gives A twice and replaying 0.605 gives B twice."
  },
  {
    "question": "What makes a mixed-precision result comparable across runs?",
    "options": [
      "Vary precision; hold data, seeds, evaluation, hardware and other settings fixed; attribute the matched task-metric change to that controlled recipe.",
      "Vary precision and hardware; hold data, seeds and evaluation fixed; attribute the task-metric change to dtype without a hardware comparison.",
      "Vary precision and batch size; hold hardware and examples per epoch fixed; attribute the task-metric change to precision alone.",
      "Vary precision; hold hardware fixed but change the evaluation; attribute the task-metric change to arithmetic rather than question mix."
    ],
    "answer": "Vary precision; hold data, seeds, evaluation, hardware and other settings fixed; attribute the matched task-metric change to that controlled recipe.",
    "explanation": "Hold all other variables fixed to isolate precision. Separately tuned recipes answer a different comparison question; declare that tuning and its budget, and measure real throughput on target hardware."
  },
  {
    "question": "At an FP16 weight exactly 1.0, subtracting 0.0004 changes the stored value while adding 0.0004 rounds back to 1.0 under nearest-even. What explains the difference?",
    "options": [
      "Neighbor gaps: down 2^-10, up 2^-10. A symmetric half-gap explains why the two signs produce different stored values.",
      "Neighbor gaps: down 2^-10, up 2^-11. The smaller upward half-gap explains why subtraction changes while addition rounds back.",
      "Neighbor gaps: down 2^-11, up 2^-10. The 0.0004 change exceeds the downward half-gap but stays below the upward half-gap.",
      "Neighbor gaps: down 2^-11, up 2^-11. Equal subnormal spacing near one explains why the two signs produce different stored values."
    ],
    "answer": "Neighbor gaps: down 2^-11, up 2^-10. The 0.0004 change exceeds the downward half-gap but stays below the upward half-gap.",
    "explanation": "The downward gap at 1.0 is 2^-11, with half-gap 2^-12≈0.000244. The upward gap is 2^-10, with half-gap 2^-11≈0.000488. The same 0.0004 perturbation exceeds only the downward half-gap."
  }
]
```

> **Next:** Continue to [Distributed Training: FSDP & ZeRO](/learn/distributed-training-fsdp-deepspeed-zero).
