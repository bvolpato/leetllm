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
  "section": "Advanced Training & Adaptation",
  "order": 7,
  "prerequisites": [
    "supervised-fine-tuning-pipeline",
    "pytorch-training-loops",
    "cuda-gpu-computing-for-ml"
  ]
}
---
<!-- leetllm: edition:reference:start -->

A weight sits at `1.0`. The optimizer computes a step of `0.0001` and subtracts it. In naive 16-bit storage, the weight remains `1.0`: no exception fires, no warning prints, yet learning silently stalls. On another batch, an activation or attention logit near `100,000` crosses FP16's ceiling of `65,504`, flips to `Inf`, and poisons the step. Nothing about the task changed, only the number system.

The previous chapter built a <span data-glossary="supervised-fine-tuning">supervised fine-tuning (SFT)</span> loop over response <span data-glossary="token">tokens</span>. We want that loop to run faster on GPU Tensor Cores and shrink activation memory without corrupting weight updates. Calling `model.half()` casts parameter storage alongside compute, exposing you to both vanishing updates and gradient underflow.

<span data-glossary="mixed-precision">Mixed precision training</span> instead assigns different dtypes to compute and persistent state: fast 16-bit matrix multiplications paired with FP32 parameters, optimizer moments, and numerically sensitive reductions.[^micikevicius2018] In <span data-glossary="pytorch">PyTorch</span> <span data-glossary="automatic-mixed-precision">Automatic Mixed Precision (AMP)</span>, parameters and optimizer buffers remain in FP32 while `autocast` dispatches eligible forward operations to <span data-glossary="bf16">BF16</span> or <span data-glossary="fp16">FP16</span>.[^pytorchAmpDocs2026] Rather than treating BF16 as universally good and FP16 as bad, let's examine how each format spends its 16 bits and what breaks when values cross its limits.

## A floating-point number has two limits

A finite, normal binary floating-point number packs a sign bit $s$, an exponent field $e$, and a fraction field $m$:

$$
x = (-1)^s \times 2^{e - \text{bias}} \times \left(1 + \frac{m}{2^{\text{fraction\_bits}}}\right)
$$

Subnormal values drop the implicit leading `1` to fade gradually toward zero, while zero, infinity, and NaN use reserved exponent codes. Two independent properties follow from this bit split:
- **Exponent bits set dynamic range:** how tiny or massive a standalone magnitude can be before underflowing to zero or overflowing to infinity.
- **Fraction bits set resolution:** how closely spaced neighboring representable numbers are, setting machine epsilon ($\epsilon$), the gap from `1.0` to the next larger value.

In 16 bits, 1 bit goes to sign, leaving 15 bits to divide between range and resolution. FP16 and BF16 make opposite bets:

| Format | Total bits | Sign | Exponent bits (bias) | Fraction bits | Positive normal range | Machine epsilon ($\epsilon$ at 1.0) |
|---|---:|---:|---:|---:|---|---|
| FP32 | 32 | 1 | 8 (bias 127) | 23 | $\approx 1.18 \times 10^{-38} \dots 3.40 \times 10^{38}$ | $\approx 1.19 \times 10^{-7}$ |
| FP16 | 16 | 1 | 5 (bias 15) | 10 | $\approx 6.10 \times 10^{-5} \dots 65504$ | $\approx 9.77 \times 10^{-4}$ |
| BF16 | 16 | 1 | 8 (bias 127) | 7 | $\approx 1.18 \times 10^{-38} \dots 3.39 \times 10^{38}$ | $\approx 7.81 \times 10^{-3}$ |

- **FP16 (IEEE 754 half-precision)** buys 10 fraction bits and tops out at `65,504`. Its smallest positive normal is $2^{-14} \approx 6.10 \times 10^{-5}$ and its smallest subnormal is $2^{-24} \approx 5.96 \times 10^{-8}$.
- **BF16 (Brain floating point)** keeps FP32's 8 exponent bits, matching its dynamic range while keeping only 7 fraction bits (~2.1 decimal digits). Its spacing near `1.0` is **8x coarser than FP16** and **65,536x coarser than FP32**. (Note that some accelerators, such as Cloud TPU, flush BF16 subnormals to zero.[^googleBfloat162026])

Inspect those exact bounds directly with `torch.finfo`:[^pytorchTypeInfo2026]

<!-- leetllm: test, deps=torch, output=show, id=precision-lab -->
```python title="format-limits.py"
import torch

formats = (
    ("FP32", torch.float32),
    ("FP16", torch.float16),
    ("BF16", torch.bfloat16),
)

print("format  epsilon_at_1  smallest_normal  largest_finite")
for label, dtype in formats:
    info = torch.finfo(dtype)
    print(f"{label:<6}  {info.eps:>12.1e}  {info.tiny:>15.1e}  {info.max:>14.1e}")

print(f"bf16_min_normal_matches_fp32={torch.finfo(torch.bfloat16).tiny == torch.finfo(torch.float32).tiny}")
print(f"bf16_resolution_coarser_than_fp16={torch.finfo(torch.bfloat16).eps > torch.finfo(torch.float16).eps}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
format  epsilon_at_1  smallest_normal  largest_finite
FP32         1.2e-07          1.2e-38         3.4e+38
FP16         9.8e-04          6.1e-05         6.6e+04
BF16         7.8e-03          1.2e-38         3.4e+38
bf16_min_normal_matches_fp32=True
bf16_resolution_coarser_than_fp16=True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/mixed_precision_dark.png" alt="Three positive-range rows share a logarithmic magnitude axis. FP32 has 1 sign, 8 exponent and 23 fraction bits; FP16 has 1, 5 and 10; BF16 has 1, 8 and 7. Shared markers locate 1.2e-8 and 100000: FP16 turns them into zero and infinity, while BF16 keeps finite approximations near 1.20e-8 and 99840." />
  <figcaption>Bit widths and logarithmic magnitude ranges across FP32, FP16, and BF16. Both `1.2e-8` and `100,000` fall outside FP16's range while remaining finite in BF16.</figcaption>
</figure>

```checkpoint
If BF16 has FP32-like range, why don't we store model updates only in BF16?
---
Range and resolution are different. BF16 can represent very small standalone magnitudes, but its fraction has only 7 bits, so a tiny change to a weight near 1.0 still rounds away. FP32 update state preserves those accumulated changes.
```

## Inspect both neighbors before judging an update

Take a weight at `1.0` and subtract an optimizer update of `0.0001` ($10^{-4}$). BF16 represents `0.0001` effortlessly on its own, yet adding it to `1.0` erases it completely. This is **swamping**: a small increment vanishes when added to a larger stored value because the sum rounds back to the original grid point.

Because floating-point spacing doubles at every power of two, the grid around `1.0` is asymmetric: the gap **below** `1.0` is half the gap **above** `1.0`, so subtracting survives at half the magnitude required for adding:

| Format | Gap below 1.0 | Gap above 1.0 | Half-gap for subtraction | Half-gap for addition |
|---|---:|---:|---:|---:|
| FP16 | $2^{-11}$ | $2^{-10}$ | $2^{-12} \approx 2.44 \times 10^{-4}$ | $2^{-11} \approx 4.88 \times 10^{-4}$ |
| BF16 | $2^{-8}$ | $2^{-7}$ | $2^{-9} \approx 1.95 \times 10^{-3}$ | $2^{-8} \approx 3.91 \times 10^{-3}$ |

Using `torch.nextafter` lets us inspect the exact adjacent grid points directly.[^pytorchNextafter2026] Below, a decrement of `0.0003` in FP16 and `0.0025` in BF16 both move the weight even though each is smaller than `eps / 2`:

<!-- leetllm: test, deps=torch, output=show, output_title="Neighbor output" -->
```python title="floating-point-neighbors.py"
import torch

for label, dtype, decrement in (("FP16", torch.float16, 0.0003),
                                ("BF16", torch.bfloat16, 0.0025)):
    one = torch.tensor(1.0, dtype=dtype)
    below = torch.nextafter(one, torch.tensor(0.0, dtype=dtype))
    above = torch.nextafter(one, torch.tensor(float("inf"), dtype=dtype))
    after = one - torch.tensor(decrement, dtype=dtype)
    print(f"{label}: gap_below={1.0 - below.item():.8f}, "
          f"gap_above={above.item() - 1.0:.8f}, decremented={after.item():.8f}")

subnormal = torch.tensor(4e-8).to(torch.float16)
print(f"below_min_subnormal_rounds_up_to={subnormal.item():.2e}")
```

<!-- leetllm: output:start -->
```text title="Neighbor output" output compact
FP16: gap_below=0.00048828, gap_above=0.00097656, decremented=0.99951172
BF16: gap_below=0.00390625, gap_above=0.00781250, decremented=0.99609375
below_min_subnormal_rounds_up_to=5.96e-08
```
<!-- leetllm: output:end -->

By contrast, subtracting `1e-4` falls short of both 16-bit downward half-gaps and disappears in both FP16 and BF16:

<!-- leetllm: test, output=show, continue=precision-lab, id=precision-updates -->
```python title="tiny-parameter-update.py"
weight = torch.tensor([1.0], dtype=torch.float32)
update = torch.tensor([1.0e-4], dtype=torch.float32)

for label, dtype in formats:
    before = weight.to(dtype)
    after = before - update.to(dtype)
    print(f"{label}: stored_after_step={after.item():.8f}, update_survived={after.item() != before.item()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP32: stored_after_step=0.99989998, update_survived=True
FP16: stored_after_step=1.00000000, update_survived=False
BF16: stored_after_step=1.00000000, update_survived=False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/floating_point_neighbors_dark.png" alt="Two number lines compare FP16 and BF16 neighbors around 1.0. Shaded nearest-even rounding cells are asymmetric: subtracting 0.0001 rounds back to 1.0 in both formats, while 0.0003 in FP16 and 0.0025 in BF16 cross their lower midpoints." />
  <figcaption>The rounding cell around `1.0` is half as wide on the downward side as on the upward side. Subtracting `0.0001` lands inside the cell in both 16-bit formats and rounds back to `1.0`.</figcaption>
</figure>

> **Key insight:** Keep parameters and optimizer moments in FP32 while eligible forward/backward operations run in 16-bit. Small updates accumulate safely in FP32 until they grow large enough to cross into the next 16-bit compute tick.

The 2018 mixed-precision recipe maintained an FP32 master copy alongside FP16 compute weights.[^micikevicius2018] Under PyTorch AMP, keeping model parameters in FP32 eliminates the separate master tensor because `autocast` casts inputs on demand while AdamW steps the FP32 weights directly.[^pytorchAmpDocs2026] Alternative research paths, such as BF16 state with stochastic rounding and temporary FP32 update arithmetic, let small updates survive probabilistically rather than deterministically.[^ozkara2025StochasticRounding]

## Range decides whether gradients exist at all

Swamping happens when an update is tiny relative to a stored weight; **underflow** and **overflow** happen when a standalone value falls outside the format's exponent span altogether. Cast a tiny gradient (`1.2e-8`) and a large activation (`1.0e5`) to FP16 and BF16:

<!-- leetllm: test, output=show, continue=precision-updates, id=precision-range -->
```python title="gradient-range.py"
values = torch.tensor([1.2e-8, 1.0e5], dtype=torch.float32)

for label, dtype in (("FP16", torch.float16), ("BF16", torch.bfloat16)):
    cast = values.to(dtype)
    print(f"{label}: small={cast[0].item():.2e}, large={cast[1].item():.2e}, all_finite={bool(torch.isfinite(cast).all())}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP16: small=0.00e+00, large=inf, all_finite=False
BF16: small=1.20e-08, large=9.98e+04, all_finite=True
```
<!-- leetllm: output:end -->

FP16 breaks at both ends: `1.2e-8` sits below half FP16's smallest subnormal and rounds to literal zero, while `100,000` exceeds `65,504` and becomes `inf`. BF16 keeps both finite (with 7-bit rounding error on `99,840`), which is why BF16 rarely needs loss scaling.[^kalamkar2019]

## FP16 uses loss scaling to rescue small gradients

Because differentiation is linear, **<span data-glossary="loss-scaling">loss scaling</span>** shifts tiny FP16 gradients up into representable range before <span data-glossary="backpropagation">backpropagation</span> writes them:[^micikevicius2018]

$$
\mathcal{L}_{\text{scaled}} = S \cdot \mathcal{L}, \qquad \nabla_w \mathcal{L}_{\text{scaled}} = S \cdot \nabla_w \mathcal{L}, \qquad g_{\text{true}} = \frac{1}{S} \cdot g_{\text{scaled}}
$$

Multiplying by $S = 1024$ adds $\log_2(1024) = 10$ binary exponent steps, moving $1.2 \times 10^{-8}$ up to $1.23 \times 10^{-5}$ (an FP16 subnormal) before backward stores it, then dividing by $S$ in FP32 recovers $1.20 \times 10^{-8}$ with under `0.1%` error:

<!-- leetllm: test, output=show, continue=precision-range, id=precision-scale -->
```python title="loss-scaling-rescue.py"
true_grad = torch.tensor([1.2e-8], dtype=torch.float32)
scale = 1024.0

plain_fp16 = true_grad.to(torch.float16)
scaled_fp16 = (true_grad * scale).to(torch.float16)
recovered_fp32 = scaled_fp16.to(torch.float32) / scale

print(f"plain_underflowed={plain_fp16.item() == 0.0}")
print(f"scaled_visible={scaled_fp16.item() > 0.0}, scaled_is_normal={scaled_fp16.item() >= torch.finfo(torch.float16).tiny}")
print(f"recovered_grad={recovered_fp32.item():.2e}, rel_error={abs(recovered_fp32.item() - true_grad.item()) / true_grad.item():.3%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
plain_underflowed=True
scaled_visible=True, scaled_is_normal=False
recovered_grad=1.20e-08, rel_error=0.077%
```
<!-- leetllm: output:end -->

> **Common mistake:** Clipping gradients before calling `scaler.unscale_(optimizer)`. If a true gradient norm is `0.02` (`max_norm = 1.0`) and `scale = 1024`, clipping first sees `20.48 > 1.0`, divides by `20.48`, and shrinks the final unscaled gradient twentyfold to `0.000977`. Also remember that loss scaling enters **after** forward, so it can never rescue an activation that already overflowed past `65,504` in forward.

### Dynamic loss scaling as a feedback controller

A fixed scale trades underflow for overflow (at $S = 65536$, a gradient of `1.0` overflows FP16). PyTorch's `torch.amp.GradScaler` automates scale selection with a feedback loop:[^micikevicius2018][^pytorchGradScalerV215][^pytorchAmpDocs2026]

1. Start high ($S_0 = 65536.0$) with clean-step counter $c = 0$.
2. Run forward under `autocast`, then backpropagate `scaler.scale(loss)`.
3. Call `scaler.unscale_(optimizer)` to divide gradients by $S$ in FP32 and scan for `Inf`/`NaN`.
4. **If any gradient is non-finite:** skip `optimizer.step()` completely (leaving weights and Adam moments untouched), halve the scale ($S \leftarrow 0.5 S$), and reset $c \leftarrow 0$.
5. **If all gradients are finite:** clip norms if configured, apply `optimizer.step()`, and increment $c$. When $c$ reaches `growth_interval` (default `2000`), double $S$ and reset $c \leftarrow 0$.

Watch that full feedback loop in PyTorch across four steps (`growth_interval=2`), verifying that a spiked batch leaves both weights and Adam moments frozen while halving the scale:

<!-- leetllm: test, output=show, continue=precision-scale, id=precision-backoff -->
```python title="overflow-backoff.py"
model = torch.nn.Linear(1, 2, bias=False)
with torch.no_grad():
    model.weight.fill_(1.0)
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
scaler = torch.amp.GradScaler("cpu", init_scale=1024, growth_interval=2)

for name, large_grad in (("quiet", 0.02), ("spike", 100.0),
                         ("quiet_again", 0.02), ("quiet_twice", 0.02)):
    optimizer.zero_grad(set_to_none=True)
    before = model.weight.detach().clone()
    with torch.autocast("cpu", dtype=torch.float16):
        prediction = model(torch.ones(1, 1))
        loss = (prediction.float() * torch.tensor([1.2e-8, large_grad])).sum()

    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    grad = model.weight.grad.clone()
    if torch.isfinite(grad).all():
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    scaler.step(optimizer)
    scaler.update()

    state = optimizer.state[model.weight]
    print(f"{name:<11}: grad={[round(v, 4) if abs(v) > 1e-4 else f'{v:.2e}' for v in grad.flatten().tolist()]}, "
          f"updated={not torch.equal(model.weight, before)}, adam_step={int(state['step'])}, next_scale={scaler.get_scale():.0f}")
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
  <img src="illustrations/_generated/loss_scaling_feedback_loop_dark.png" alt="Scaling by 1024 moves a tiny gradient into FP16 subnormals, keeps a quiet gradient finite, and pushes a spike past 65504 into infinity. The four-batch trace shows the spike skipping the optimizer step and halving scale to 512, then two clean steps restoring scale 1024." />
  <figcaption>The dynamic loss-scale controller skips the entire optimizer step on `spike`, holding weights and Adam moments fixed while halving `S` to 512, then doubles back to 1024 after two clean steps.</figcaption>
</figure>

<details>
<summary>Deep dive: multiple optimizers and non-finite forward losses</summary>

Two `GradScaler` behaviors catch people off guard:
1. **Multiple optimizers skip independently:** Each `scaler.step(opt)` inspects only its own `.grad` tensors, followed by one shared `scaler.update()`.[^pytorchAmpExamples2026] If two optimizers must skip jointly, check finiteness across both explicitly.
2. **`GradScaler` checks `.grad`, not `loss`:** An infinite additive constant in `loss` leaves finite derivatives, so `GradScaler` will happily step unless you check `torch.isfinite(loss)` before backward.[^pytorchGradScalerSource2026]

<!-- leetllm: test, deps=torch, output=show, output_title="Edge cases: multi-optimizer skip and non-finite loss" -->
```python title="scaler-edge-cases.py"
import torch

# 1. Two optimizers make independent skip decisions under one scaler.
good, bad = torch.nn.Parameter(torch.tensor(1.0)), torch.nn.Parameter(torch.tensor(1.0))
opts = [torch.optim.SGD([p], lr=0.1) for p in (good, bad)]
scaler = torch.amp.GradScaler("cpu", init_scale=128)
scaler.scale(good).backward()
scaler.scale(bad).backward()
bad.grad.fill_(float("inf"))
for opt in opts:
    scaler.step(opt)
scaler.update()
print(f"multi_opt: good_stepped={good.item() < 1.0}, bad_stepped={bad.item() != 1.0}, next_scale={scaler.get_scale():.0f}")

# 2. Infinite loss with finite derivative still steps unless loss is checked.
w = torch.nn.Parameter(torch.tensor(1.0))
opt2 = torch.optim.SGD([w], lr=0.1)
scaler2 = torch.amp.GradScaler("cpu", init_scale=128)
loss = w.square() + torch.tensor(float("inf"))
scaler2.scale(loss).backward()
scaler2.unscale_(opt2)
scaler2.step(opt2)
scaler2.update()
print(f"nonfinite_loss: finite_loss={bool(torch.isfinite(loss))}, finite_grad={bool(torch.isfinite(w.grad))}, stepped={w.item() < 1.0}")
```

<!-- leetllm: output:start -->
```text title="Edge cases: multi-optimizer skip and non-finite loss" output compact
multi_opt: good_stepped=True, bad_stepped=False, next_scale=64
nonfinite_loss: finite_loss=False, finite_grad=True, stepped=True
```
<!-- leetllm: output:end -->

</details>

```checkpoint
One ordinary optimizer receives non-finite gradients after an FP16 backward pass. Should it apply the finite gradients and drop only the non-finite tensors?
---
No. Skip the whole optimizer step, halve the loss scale, and continue on the next batch. Applying a partial update corrupts the optimization step. Always unscale gradients before clipping.
```

## Compute low, update high

In a <span data-glossary="cuda">CUDA</span> AMP training loop, keep parameters in FP32, wrap only the forward pass and loss in `torch.autocast`, and enable `GradScaler` for FP16 (when disabled under BF16, keep explicit finiteness checks because bad data or high learning rates can still produce NaNs):[^pytorchAmpDocs2026]

```python title="cuda-amp-training-shape.py"
dtype = torch.bfloat16  # or torch.float16 with GradScaler enabled
if dtype == torch.bfloat16 and not torch.cuda.is_bf16_supported():
    raise RuntimeError("This CUDA device does not support BF16")
scaler = torch.amp.GradScaler("cuda", enabled=(dtype == torch.float16))

for batch, target in dataloader:
    optimizer.zero_grad(set_to_none=True)
    with torch.autocast(device_type="cuda", dtype=dtype):
        logits = model(batch.cuda())
        loss = criterion(logits, target.cuda())

    if not torch.isfinite(loss).all().item():
        raise FloatingPointError("Non-finite forward loss; skipping step")
    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    scaler.step(optimizer)
    scaler.update()
```

Autocast is operation-specific: eligible matmuls run in 16-bit while reductions like `cross_entropy` widen to FP32, backward mirrors each forward op's dtype, and accumulated `.grad` buffers stay FP32 on FP32 parameters. Never call `model.half()` alongside AMP, and keep `.backward()` outside `autocast`.

### GradScaler and gradient accumulation share one optimizer step

When accumulating gradients over multiple micro-batches, `GradScaler` operates on the **optimizer step**, not each micro-batch:

| Call | Once per micro-batch | Once per optimizer step |
|---|---|---|
| `scaler.scale(micro_loss).backward()` | Yes | No |
| `scaler.unscale_(optimizer)` | No | Yes, after the window closes and before clip |
| Clip gradients | No | Yes |
| `scaler.step(optimizer)` | No | Yes |
| `scaler.update()` | No | Yes |

Hold one constant loss scale across the entire accumulation window, track skipped steps in telemetry, advance LR schedulers only on non-skipped updates, and save `scaler.state_dict()` inside checkpoints for exact resumes.[^pytorchAmpExamples2026]

When micro-batches contain unequal numbers of active response tokens, divide each micro-batch's summed token loss by the **full window's total active tokens** rather than averaging per-micro-batch means. Watch a 1-token micro-batch cancel a 3-token micro-batch under mean-of-means:

<!-- leetllm: test, deps=torch, output=show -->
```python title="unequal-token-accumulation.py"
import torch

targets = (torch.tensor([0.0]), torch.tensor([2.0, 2.0, 2.0]))
total_tokens = sum(y.numel() for y in targets)

def accumulated_gradient(mode):
    w = torch.tensor(1.0, requires_grad=True)
    for y in targets:
        losses = (w - y).square()
        loss = losses.mean() / len(targets) if mode == "mean_of_means" else losses.sum() / total_tokens
        loss.backward()
    return w.grad.item()

w = torch.tensor(1.0, requires_grad=True)
(w - torch.cat(targets)).square().mean().backward()
print(f"full_batch_grad={w.grad.item():.1f}")
print(f"mean_of_means_grad={accumulated_gradient('mean_of_means'):.1f}, "
      f"token_weighted_grad={accumulated_gradient('token_weighted'):.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full_batch_grad=-1.0
mean_of_means_grad=0.0, token_weighted_grad=-1.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/accumulation_boundary_dark.png" alt="One target-zero token contributes gradient +2 while three target-two tokens contribute -6. Averaging micro-batch means gives 0; dividing combined sum by all four tokens gives -1. AMP holds one scale through the shared window." />
  <figcaption>Averaging micro-batch means gives `0.0`, while normalizing by all four active tokens recovers the exact `-1.0` full-batch gradient.</figcaption>
</figure>

## Account for memory before claiming savings

"Mixed precision cuts memory in half" is one of the most persistent myths in deep learning. Ordinary AMP keeps parameters, gradients, and AdamW moments in FP32 (**16 bytes/param**), shrinking only eligible saved activations:

| Component | Pure FP32 | FP32 weights + AMP | FP32 master-weight recipe |
|---|---:|---:|---:|
| Compute weights | 4 B ($4N$) | 4 B ($4N$, FP32) | 2 B ($2N$, 16-bit) |
| Gradients | 4 B ($4N$) | 4 B ($4N$, FP32) | 2 B ($2N$, 16-bit) |
| FP32 master weights | None | None | 4 B ($4N$, FP32) |
| AdamW moments ($m, v$) | 8 B ($8N$) | 8 B ($8N$, FP32) | 8 B ($8N$, FP32) |
| **Static model state** | **16 B / param** | **16 B / param** | **16 B / param** (+4 B if FP32 grad buffer) |
| Eligible saved activations | 4 B / value | 2 B / value | 2 B / value |

Not every tensor saved by autograd is 16-bit either; operations run in FP32 save FP32 intermediates, which you can inspect with `saved_tensors_hooks`:[^pytorchSavedTensorHooks2026]

<!-- leetllm: test, deps=torch, output=show, output_title="Saved tensor output" -->
```python title="saved-tensor-dtypes.py"
import torch

layer = torch.nn.Linear(4, 4)
saved_dtypes = set()
def record(t):
    saved_dtypes.add(str(t.dtype))
    return t.detach()

with torch.autograd.graph.saved_tensors_hooks(record, lambda t: t):
    with torch.autocast("cpu", dtype=torch.bfloat16):
        out = layer(torch.ones(2, 4))
        loss = out.float().square().mean()
    loss.backward()
print(f"saved_dtypes={sorted(saved_dtypes)}")
```

<!-- leetllm: output:start -->
```text title="Saved tensor output" output compact
saved_dtypes=['torch.bfloat16', 'torch.float32']
```
<!-- leetllm: output:end -->

With 100M parameters and 800M saved activation values, halving activation bytes drops total memory by **33.3%**, not 50%:

<!-- leetllm: test, output=show, id=precision-memory -->
```python title="memory-budget.py"
def gib(values: int, bytes_per_value: int) -> float:
    return values * bytes_per_value / (1024 ** 3)

params, acts = 100_000_000, 800_000_000
static_gib = gib(params, 16)
fp32_total = static_gib + gib(acts, 4)
amp_total = static_gib + gib(acts, 2)

print(f"fp32_total_gib={fp32_total:.2f}, amp_total_gib={amp_total:.2f}")
print(f"activation_saving_gib={fp32_total - amp_total:.2f}, total_reduction={(1 - amp_total / fp32_total):.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fp32_total_gib=4.47, amp_total_gib=2.98
activation_saving_gib=1.49, total_reduction=33.3%
```
<!-- leetllm: output:end -->

```checkpoint
In the inventory example, activation values use two bytes instead of four, yet total memory falls by only one third. Is mixed precision broken?
---
No. Parameters, gradients, and Adam moments remain in FP32, so only the activation share halved. Profile each component to see whether activation checkpointing, smaller micro-batches, or ZeRO/FSDP sharding targets your true bottleneck.
```

<figure>
  <img src="illustrations/_generated/mixed_precision_dtype_policy_dark.png" alt="100M parameters and 800M saved activation values compare FP32 (4.47 GiB) and AMP (2.98 GiB): static model state stays fixed while activations halve, cutting total memory by 33.3 percent. A separate bar compares one 100M-element gradient communication payload in FP32 (0.37 GiB) vs BF16 (0.19 GiB)." />
  <figcaption>Halving activation bytes cuts total memory by 33.3% while FP32 weights, gradients, and Adam moments stay constant. Gradient communication dtype is controlled independently.</figcaption>
</figure>

Activation memory scales with batch size, sequence length, width, and layers (plus quadratic attention scores unless tiled via FlashAttention), so profile peak allocated and reserved memory on real steps.[^korthikanti2022][^micikevicius2018] To shrink persistent FP32 state itself, shard parameters, gradients, and optimizer moments across GPUs with <span data-glossary="zero">ZeRO</span> or FSDP.[^rajbhandari2020][^zhao2023]

## Distributed jobs add a communication dtype

Distributed reduction precision is configured separately from compute precision (for example, `param_dtype` vs. `reduce_dtype` in PyTorch FSDP).[^pytorchFsdpDocs2025] A job can run BF16 matrix multiplies while still shipping 4-byte FP32 gradients across the network:

<!-- leetllm: test, output=show, continue=precision-memory, id=precision-communication -->
```python title="communication-budget.py"
grad_values = 100_000_000
fp32_gib, bf16_gib = gib(grad_values, 4), gib(grad_values, 2)
print(f"gradient_payload_fp32_gib={fp32_gib:.2f}, bf16_gib={bf16_gib:.2f}, reduction={(1 - bf16_gib / fp32_gib):.0%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gradient_payload_fp32_gib=0.37, bf16_gib=0.19, reduction=50%
```
<!-- leetllm: output:end -->

Always log `compute_dtype`, `update_storage_dtype`, and `reduce_dtype` separately instead of a single `mixed_precision=true` flag.

## Choose precision from controlled runs

Hold model, data, seeds, batch shape, evaluation, and hardware fixed while comparing precision recipes. Record accelerator model, interconnect, software versions, all three dtypes, and math-mode flags: PyTorch defaults TF32 off for matrix multiplications and on for convolutions, and some reduced-precision GEMMs accumulate partial sums at lower precision.[^pytorchNumericalAccuracy2026] Time warmed-up, synchronized GPU steps rather than async kernel launches.[^pytorchCudaSemantics2026]

Watch how pure 16-bit parameter storage stalls on a real PyTorch optimization step with small learning rate while FP32 parameters with BF16 autocast track the FP32 baseline:

<!-- leetllm: test, deps=torch, output=show, output_title="Precision recipe training comparison" -->
```python title="precision-training-comparison.py"
import torch

def run_steps(mode: str, steps: int = 40) -> float:
    torch.manual_seed(0)
    w_init = torch.full((4, 4), 1.0)
    x = torch.eye(4)
    target = torch.full((4, 4), 0.99)
    dtype = torch.float16 if mode == "pure_fp16" else torch.float32
    w = torch.nn.Parameter(w_init.to(dtype))
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

`pure_fp16` never moves from its initial `0.00010000` MSE because every `6.25e-5` step is swamped near `1.0`, while `amp_bf16` matches `fp32` cleanly.

### RL can expose a BF16 train-inference mismatch

BF16 is a strong default for supervised training, yet reinforcement-learning fine-tuning adds a subtle twist: one inference stack generates <span data-glossary="rollout">rollout</span> trajectories while a separate training stack recomputes their log-probabilities. Slightly different kernel rounding before casting can push nearby FP32 <span data-glossary="logits">logits</span> across a coarse BF16 rounding tick, creating policy mismatch between rollout and learner. Qi et al. found that switching to scaled FP16 consistently reduced this train-inference divergence and improved RL optimization across their tested stacks.[^qi2025fp16mismatch]

Compare how FP16 and BF16 round two pairs of nearby logits near `1.0`:

<!-- leetllm: test, deps=torch, output=show -->
```python title="compare-policy-rounding.py"
import torch

def policy_gap(dtype: torch.dtype, first: float, second: float) -> float:
    p1 = torch.softmax(torch.tensor([first, 1.0]).to(dtype).float(), dim=0)[0]
    p2 = torch.softmax(torch.tensor([second, 1.0]).to(dtype).float(), dim=0)[0]
    return abs(p1.item() - p2.item())

for first, second in ((1.0038, 1.0040), (1.0004, 1.0006)):
    fp16_gap = policy_gap(torch.float16, first, second)
    bf16_gap = policy_gap(torch.bfloat16, first, second)
    print(f"logits={first},{second}: FP16_gap={fp16_gap:.7f}, BF16_gap={bf16_gap:.7f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logits=1.0038,1.004: FP16_gap=0.0000000, BF16_gap=0.0019531
logits=1.0004,1.0006: FP16_gap=0.0002441, BF16_gap=0.0000000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/policy_rounding_boundaries_dark.png" alt="FP16 and BF16 quantization ticks near 1.0: for (1.0038, 1.0040) BF16 separates them with softmax gap 0.0019531 while FP16 merges them; for (1.0004, 1.0006) FP16 separates them with gap 0.0002441 while BF16 merges them." />
  <figcaption>Because BF16's ticks are 8x wider than FP16's, crossing a BF16 boundary creates an 8x larger probability jump. Measure train-versus-rollout log-probability divergence directly on matched prompts before choosing between BF16 and scaled FP16 for RL.</figcaption>
</figure>

## Evaluate FP8 after measuring the lower-precision path

Once BF16 or scaled FP16 is benchmarked cleanly, 8-bit **FP8** halves operand bytes again on supported hardware (Hopper/Blackwell). The OCP FP8 standard defines two complementary formats:[^ocp2023ofp8][^micikevicius2022]
- **E4M3** (4 exponent, 3 fraction bits): max finite `448`, no infinity encoding; favored for forward activations and weights.
- **E5M2** (5 exponent, 2 fraction bits): max finite `57,344`, keeps infinity; favored for wider-range backward gradients.

| FP8 recipe | Scaling mechanism | Primary trade-off |
|---|---|---|
| **Current scaling** | FP32 scale computed from live tensor `amax` | Reduction overhead unless fused into prior ops |
| **Delayed scaling** | FP32 scale predicted from `amax` history | Sudden magnitude spikes can saturate before history updates |
| **MXFP8 block scaling** | One E8M0 power-of-two scale per 32 elements[^ocp2023mx] | Tighter outlier isolation; requires native block-scaled kernels (e.g., Blackwell) |

Transformer Engine exposes hybrid E4M3-forward / E5M2-backward and MXFP8 recipes.[^nvidiaTransformerEngine2026][^teRecipes2026] Watch out for **saturating conversion**: overflowing `448` in E4M3 can clamp silently to `448` (finite yet wrong) instead of emitting `NaN`, so track saturation rates alongside skipped steps, throughput, and held-out accuracy.[^ocp2023ofp8]

<figure>
  <img src="illustrations/_generated/fp8_scale_contract_dark.png" alt="E4M3 (1/4/3 bits, max 448, no Inf) and E5M2 (1/5/2 bits, max 57,344, with Inf) alongside MXFP8 rows pairing 32 FP8 values with one E8M0 power-of-two scale." />
  <figcaption>FP8 splits forward (E4M3) and backward (E5M2) across two encodings; MXFP8 attaches one E8M0 power-of-two scale to every 32-element block.</figcaption>
</figure>

## Common pitfalls

- **Storing weights in BF16 without FP32 optimizer state:** Loss plateaus while every gradient looks finite because tiny updates swamp. Inspect `optimizer.param_groups` dtypes.
- **Unscaled FP16 gradients:** Small gradients underflow silently to zero, lagging the FP32 baseline. Enable `GradScaler` and track skipped-step counts.
- **Clipping before `scaler.unscale_(optimizer)`:** Clips against scaled magnitudes, crushing step sizes silently. Always unscale first, then clip, then step.
- **Calling `step()` / `update()` inside gradient accumulation:** Collapses effective batch size and mixes scaled/unscaled gradients. Run `unscale_`, clip, `step`, and `update` once per optimizer boundary.
- **Assuming "half memory" automatically:** Ordinary AMP leaves FP32 weights, gradients, and Adam moments untouched; profile component-level memory before resizing batches.
- **Overlooking `reduce_dtype`:** BF16 compute can still transmit FP32 gradients across GPUs; log and verify `reduce_dtype` explicitly.

## Check your understanding

### Follow-up questions

```checkpoint
Why doesn't scaling rescue a tiny input that was rounded to zero during the forward pass?
---
Loss scaling amplifies the backward signal, not earlier forward tensors. Once a forward cast rounds a value to zero, multiplying the loss cannot reconstruct it. Keep sensitive forward operations in higher precision.
```

```checkpoint
Change the first accumulation micro-batch from one valid token to three copies of that token. Should averaging the two means now match the concatenated batch?
---
Yes. Both micro-batches now hold three valid tokens, so they carry equal weight in the full-token mean. With targets 0,0,0 and 2,2,2 at weight 1, their gradients cancel cleanly to zero.
```

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

> **Next:** Continue to [Distributed Training: FSDP & ZeRO](/learn/distributed-training-fsdp-deepspeed-zero). Ordinary AMP leaves FP32 parameters and <span data-glossary="optimizer-state">optimizer state</span> intact on every GPU; the next lesson shows how FSDP and ZeRO shard that persistent state across ranks.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

A weight is stored as exactly 1.0. Backpropagation does its job, the optimizer computes an update of 0.0001, and the code subtracts it. The weight is still exactly 1.0. Nothing raised an exception and nothing logged a warning. A piece of learning just vanished, and it will vanish again on the next step.

Someone on your team turned on 16-bit floats to fit bigger batches on the same GPUs, which is a sensible thing to want. Now one kind of update never lands. On another batch, an attention logit near 100,000 crosses the format's ceiling of 65,504, becomes infinity, and poisons the loss. The task and the code did not change. The number system did.

The payoff is real, and you should not walk away from it. A 16-bit tensor takes half the bytes of the same tensor in FP32, and supported GPU paths accelerate 16-bit matrix multiplications. What it costs depends on which numbers you make smaller. Mixed precision is the practice of giving different operations and different stored state different formats, so you keep the speed and avoid the losses. By the end of this chapter you will know which number needs what, and how to catch the failures that do not announce themselves.

## Every format has two limits

A floating-point number is scientific notation in binary: a sign, an exponent that says how big, and a fraction that says exactly where.

Think of the exponent as choosing a ruler and the fraction as the tick marks printed on it. Every ruler has the same number of ticks. A ruler that reaches from 1 to 2 has fine spacing, and one that reaches from 1,024 to 2,048 has the same ticks spread across a thousand times the distance. So the exponent decides your **range**, how large or small a value can be at all. The fraction decides your **resolution**, how close together two values can be at that scale. The picture breaks down in one detail that will matter shortly: the rulers change length at each power of two, so the spacing jumps at exactly 1.0.

A 16-bit format spends one bit on sign, leaving 15 to divide between the two limits. FP16 and BF16 make opposite bets.

| Format | Sign / exponent / fraction | Largest finite value | Gap above 1.0 |
| --- | --- | --- | --- |
| FP32 | 1 / 8 / 23 | $3.40\times10^{38}$ | $1.19\times10^{-7}$ |
| FP16 | 1 / 5 / 10 | 65,504 | $9.77\times10^{-4}$ |
| BF16 | 1 / 8 / 7 | $3.39\times10^{38}$ | $7.81\times10^{-3}$ |

Treating "16-bit" as one thing is the first mistake. FP16 buys finer spacing and runs out of range quickly. BF16 keeps FP32's exponent, so it covers nearly the same range, and pays with spacing eight times coarser than FP16 and more than 65,000 times coarser than FP32. People often read this as "BF16 good, FP16 bad." The rest of this chapter shows why that is too simple.

<figure>
  <img src="illustrations/_generated/mixed_precision_dark.png" alt="FP32, FP16, and BF16 share a logarithmic magnitude axis. A small input becomes zero in FP16, and an input of one hundred thousand overflows FP16. BF16 retains finite approximations for both." />
  <figcaption>Check where each format's band ends on the shared axis. Both test values fall outside FP16's band and inside BF16's, which is what the exponent buys.</figcaption>
</figure>

One detail at the small end: below the smallest normal value, a format has subnormal encodings that fade toward zero with less precision. FP16's smallest normal is about $6.10\times10^{-5}$, and its smallest subnormal is about $5.96\times10^{-8}$. Some hardware flushes subnormals to zero, and Cloud TPU does this for BF16.[^googleBfloat162026] If tiny values matter to your run, test the kernel you will actually use.

## Look at a weight's neighbors

Back to the update that disappeared. A format can only store certain numbers, so any result gets rounded to its nearest stored neighbor. At 1.0, FP16's next value up is 1.0009765625 and its next value down is 0.99951171875. BF16's are 1.0078125 and 0.99609375. Notice that the gap below is half the gap above, because 1.0 is exactly where the ruler changes length.

To survive rounding, a change must be more than halfway to the next neighbor in its direction. Subtracting from 1.0, that means more than about $2.44\times10^{-4}$ in FP16 and $1.95\times10^{-3}$ in BF16. Our 0.0001 falls short in both, so both round straight back to 1.0. BF16 can store 0.0001 as a standalone number with no trouble at all. What it cannot do is add it to a weight near 1.0. This is called swamping, and it is the core reason you do not want to keep your weights in a low-precision format.

This runs without a GPU, rounding positive FP32 values to BF16 by working on their bits directly:

<!-- leetllm: test, id=reader-precision-stored-update, output=show, output_title="Reader stored update" -->
```python title="reader-precision-stored-update.py"
import struct

def fp32(value):
    return struct.unpack("f", struct.pack("f", value))[0]

def fp16(value):
    return struct.unpack("e", struct.pack("e", value))[0]

def bf16_positive(value):
    bits = struct.unpack("I", struct.pack("f", value))[0]
    rounded = (bits + 0x7FFF + ((bits >> 16) & 1)) & 0xFFFF0000
    return struct.unpack("f", struct.pack("I", rounded))[0]

for name, store in (("FP16", fp16), ("BF16", bf16_positive), ("FP32", fp32)):
    print(f"{name}: {store(1.0 - 0.0001):.8f}")
```

<!-- leetllm: output:start -->
```text title="Reader stored update" output compact
FP16: 1.00000000
BF16: 1.00000000
FP32: 0.99989998
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/floating_point_neighbors_dark.png" alt="FP16 and BF16 number lines show the unequal gaps on either side of one. A decrement of one ten-thousandth stays within the rounding cell around one in both formats, while FP32 stores about 0.99989998." />
  <figcaption>Find the proposed value on each line, then ask which tick is nearest. Both 16-bit formats round it back to 1.0, because 0.9999 sits inside the rounding cell around 1.0.</figcaption>
</figure>

Machine epsilon, the gap above 1.0, is easy to misuse as a universal threshold. Spacing scales with magnitude, so a small weight can absorb a much smaller change, and even FP32 eventually loses small enough changes near a nonzero value. Higher precision gets you a bigger budget, not exact arithmetic.

The standard fix follows directly: **compute low, update high.** Keep the parameters and optimizer moments in FP32, and let eligible operations run in reduced precision. The optimizer writes small updates into a format that holds them, and they accumulate until they are large enough to move the rounded copy the next forward pass uses. The original 2018 recipe kept an FP32 master copy beside an FP16 compute copy;[^micikevicius2018] with an FP32 model, PyTorch's automatic mixed precision (AMP) needs no separate master copy because the parameters themselves stay FP32.[^pytorchAmpDocs2026] This is why `model.half()` is a trap: it changes parameter storage along with compute. (Stochastic rounding with BF16 state is an alternative research path when custom optimizer support is available.[^ozkara2025StochasticRounding])

## Scale the gradient before it disappears

Resolution hurts when an update is small relative to a weight. Range hurts when a value cannot exist at all. Take a gradient of $1.2\times10^{-8}$. That is less than half FP16's smallest subnormal, so casting it to FP16 gives exactly zero, and no later multiplication can bring it back. BF16 keeps it, with some rounding.

FP16's trick is to move gradients up into range before they are computed. Multiply the loss by a scale $S$ before backpropagation, and the chain rule multiplies every gradient by the same factor:

$$
\widetilde{\mathcal L}=S\mathcal L,\qquad
\widetilde g=Sg.
$$

With $S=1024$, our tiny gradient becomes about $1.23\times10^{-5}$, which FP16 can store as a subnormal. When backward finishes, divide by $S$ in FP32, and you recover $1.20\times10^{-8}$ with very little error. Order matters: multiplying afterward does nothing because 1,024 times zero is still zero. And scaling only helps the backward pass; if a forward activation already overflowed to infinity, no loss scale can repair that.

A fixed scale trades one failure for another: at $S=65536$, an ordinary gradient of 1.0 overflows. PyTorch's `GradScaler` turns the scale into a feedback loop:[^pytorchGradScalerV215]

1. Start with a large scale (65,536 by default) and a clean-step counter at zero.
2. Backpropagate the scaled loss, then unscale the gradients.
3. If any gradient is infinite or NaN, skip the optimizer step entirely, halve the scale, and reset the counter.
4. Otherwise, step the optimizer and add one to the counter. After 2,000 clean steps in a row, double the scale and reset the counter.

"Skip entirely" means weights and Adam's moments stay untouched. You do not apply the finite gradients and drop the bad ones, because a partial update corrupts the optimization step. Here is the controller in plain arithmetic, with growth set to two clean steps so you can watch it recover:

<!-- leetllm: test, id=reader-precision-scale-controller, output=show, output_title="Reader loss scale controller" -->
```python title="reader-precision-scale-controller.py"
from math import isfinite
import struct

def half(value):
    try:
        return struct.unpack("e", struct.pack("e", value))[0]
    except OverflowError:
        return float("inf")

scale, clean_steps, optimizer_steps = 1024.0, 0, 0
print("tiny direct:", half(1.2e-8))
print(f"tiny scaled/unscaled: {half(1.2e-8 * scale) / scale:.2e}")

for name, gradient in (("quiet", 0.02), ("spike", 100.0), ("quiet", 0.02), ("quiet", 0.02)):
    finite = isfinite(half(gradient * scale))
    if finite:
        optimizer_steps += 1
        clean_steps += 1
        if clean_steps == 2:
            scale *= 2
            clean_steps = 0
    else:
        scale /= 2
        clean_steps = 0
    print(f"{name}: update={finite}, steps={optimizer_steps}, next_scale={scale:.0f}")
```

<!-- leetllm: output:start -->
```text title="Reader loss scale controller" output compact
tiny direct: 0.0
tiny scaled/unscaled: 1.20e-08
quiet: update=True, steps=1, next_scale=1024
spike: update=False, steps=1, next_scale=512
quiet: update=True, steps=2, next_scale=512
quiet: update=True, steps=3, next_scale=1024
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/loss_scaling_feedback_loop_dark.png" alt="Top: a logarithmic axis with FP16's representable band. Scaling by 1024 moves a tiny gradient from outside the band to a subnormal inside it, moves a quiet gradient to about 20.5, and pushes a spike of 100 past 65504 into infinity. Bottom: a four-step trace where the spike skips step 2 and halves the scale to 512 before two clean steps restore 1024." />
  <figcaption>The top panel shows why scaling rescues tiny gradients and where spikes overflow. The bottom panel shows the controller's response: at the spike the scale halves and the step count freezes.</figcaption>
</figure>

Two details bite people. With several optimizers, each makes its own skip decision before one shared scale update; if your algorithm needs joint atomicity, enforce it yourself.[^pytorchAmpExamples2026] Also, the scaler inspects gradients and never the loss, so check `torch.isfinite(loss)` before backward.

Dynamic scaling is an FP16 tool. BF16 runs usually disable `GradScaler`, though `GradScaler(enabled=False)` also turns off skip detection, so keep your own finiteness guard against bad data or oversized learning rates.

## One optimizer step, one unscale

The scaler tracks one logical unit, the optimizer step, and most bugs come from confusing it with something else.

Clipping is the classic mistake. Suppose a true gradient norm is 0.02, well inside `max_norm = 1.0`. Clipping while gradients are still scaled by 1,024 shows the clipper 20.48, which divides by 20.48 and crushes the unscaled gradient twentyfold to 0.000977 without logging a single error:

<!-- leetllm: test, id=reader-precision-clip-order, output=show, output_title="Reader clip order" -->
```python title="reader-precision-clip-order.py"
def clip(gradient, max_norm=1.0):
    return gradient * min(1.0, max_norm / abs(gradient))

true_gradient, scale = 0.02, 1024.0
print(f"unscale then clip: {clip(true_gradient * scale / scale):.6f}")
print(f"clip then unscale: {clip(true_gradient * scale) / scale:.6f}")
```

<!-- leetllm: output:start -->
```text title="Reader clip order" output compact
unscale then clip: 0.020000
clip then unscale: 0.000977
```
<!-- leetllm: output:end -->

Gradient accumulation is the other classic bug. Split calls by how often they belong:

| Call | Every micro-batch | Once per optimizer step |
| --- | --- | --- |
| `scaler.scale(loss).backward()` | Yes | |
| `scaler.unscale_(optimizer)` | | Yes, after the window closes |
| Clip gradients | | Yes |
| `scaler.step(optimizer)` | | Yes |
| `scaler.update()` | | Yes |

Hold one scale across the whole accumulation window, monitor skipped steps in telemetry, weight micro-batch losses by the full window's active token count when response lengths vary, and save `scaler.state_dict()` in your checkpoints.

## What autocast actually does

Autocast is operation-specific. On CUDA, eligible matrix multiplications run in 16-bit while reductions like `cross_entropy` stay in FP32.[^pytorchAmpDocs2026] Backward mirrors each forward operation's dtype, and an FP32 parameter's `.grad` stays FP32. Keep `backward` outside the `autocast` region.

Even "FP32" has subtle modes: NVIDIA's TF32 reads only 10 fraction bits of FP32 inputs (PyTorch keeps it off by default for matmuls and on for convolutions), and some 16-bit matmuls accumulate intermediate sums in reduced precision.[^pytorchNumericalAccuracy2026] Record those flags alongside your dtypes.

## Mixed precision does not halve your memory

"Mixed precision cuts memory in half" is one of the field's most persistent slogans, so do the count. For $N$ parameters under ordinary AMP, FP32 weights (4 B), FP32 gradients (4 B), and two FP32 Adam moments (8 B) total **16 bytes per parameter**, identical to pure FP32. The master-copy recipe also totals 16 bytes (`2 + 2 + 4 + 8`).

Activations are what shrink. With 100M parameters and 800M saved activation values, cutting activations from 4 bytes to 2 cuts total memory by a third:

<!-- leetllm: test, id=reader-precision-memory, output=show, output_title="Reader memory budget" -->
```python title="reader-precision-memory.py"
parameters, activations = 100_000_000, 800_000_000
state = 16 * parameters / 1e9

totals = {}
for name, bytes_per_value in (("FP32", 4), ("16-bit", 2)):
    saved = bytes_per_value * activations / 1e9
    totals[name] = state + saved
    print(f"{name}: state {state:.1f} GB + activations {saved:.1f} GB = {totals[name]:.1f} GB")

print(f"reduction: {1 - totals['16-bit'] / totals['FP32']:.0%}")
```

<!-- leetllm: output:start -->
```text title="Reader memory budget" output compact
FP32: state 1.6 GB + activations 3.2 GB = 4.8 GB
16-bit: state 1.6 GB + activations 1.6 GB = 3.2 GB
reduction: 33%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/mixed_precision_dtype_policy_dark.png" alt="A shared GB scale compares equal model-state inventories and eight hundred million activation values. Activations shrink by half, and the combined total falls by one third. Gradient communication payload is shown separately." />
  <figcaption>Only the activation segment shrinks, so the combined total drops by a third. The gradient bars show a separate cost: the bytes one tensor sends between GPUs.</figcaption>
</figure>

Activation memory scales with batch, sequence length, width, and layers (plus quadratic attention unless tiled), so measure peak allocated and reserved device memory across warm steps.[^korthikanti2022][^micikevicius2018]

Communication has its own dtype too. A 100M-element gradient tensor takes 400 MB in FP32 versus 200 MB in BF16 before protocol overhead. PyTorch FSDP exposes `param_dtype` and `reduce_dtype` independently, so log compute, update-storage, and reduction dtypes separately.[^pytorchFsdpDocs2025]

## Choose with a controlled comparison

Start from a working higher-precision baseline. Hold model, data, objective, token budget, hardware, and evaluation fixed, and change only the precision recipe. Reject any candidate that misses your quality checks or produces non-finite steps before ranking throughput, and time warmed-up, synchronized GPU steps rather than async launches.[^pytorchCudaSemantics2026]

For ordinary fine-tuning on supported hardware, start with **BF16 compute + FP32 update state** to sidestep FP16 loss-scaling headaches. Reinforcement-learning fine-tuning (covered in the [alignment chapter](/learn/rlhf-dpo-aligning-language-models)) is a notable exception: when one serving path generates rollouts and a training path recomputes their probabilities, BF16's coarse spacing can round nearby logits onto opposite ticks. Qi et al. found that scaled FP16 consistently reduced that train-inference mismatch and improved RL optimization.[^qi2025fp16mismatch] Test it directly by comparing log-probabilities on matched prompts.

For 8-bit **FP8**, E4M3 tops out at `448` (no infinity) and E5M2 reaches `57,344`.[^ocp2023ofp8] NVIDIA's hybrid recipe uses E4M3 forward and E5M2 for gradients,[^nvidiaTransformerEngine2026] with saturating conversion clamping E4M3 overflows quietly at `448` rather than raising NaN.[^ocp2023ofp8] Benchmark BF16 or scaled FP16 cleanly before adding FP8 complexity.

## When a precision change goes wrong

- **Loss flatlines while every gradient is finite.** Parameters may be stored in 16-bit, swamping updates. Check parameter dtypes.
- **FP16 trains but lags FP32.** Small unscaled gradients may be underflowing to zero. Enable `GradScaler`.
- **Training turns erratic under FP16.** Look for gradient clipping before `unscale_`.
- **Effective batch collapses.** `step` and `update` are running inside the accumulation loop.
- **Scale keeps dropping.** Persistent backoff signals oversized values; a forward overflow cannot be cured by smaller loss scales.
- **"Half memory" falls short.** Only activations shrank; pull a component-level memory profile.
- **Network traffic stayed high.** Check whether `reduce_dtype` is still FP32.

```checkpoint
What is the smallest amount you can subtract from 2.0 in FP16 and see the stored value change?
---
Just below 2.0 you are on the ruler from 1 to 2, where neighbors sit $2^{-10} \approx 9.77\times10^{-4}$ apart. A change must exceed half that gap, so you need slightly more than $2^{-11} \approx 4.88\times10^{-4}$. Subtracting exactly $2^{-11}$ lands on a tie and rounds back to 2.0 under nearest-even.
```

## Where this leaves you

You can now inspect any tensor in a training run and ask whether it needs range, resolution, or both. You know why updates belong in FP32, why scaling enters before backward and leaves before clipping, and why memory must be budgeted by component rather than by slogan.

At large scale, even careful precision choices leave hundreds of gigabytes of persistent FP32 state. Next, [Distributed Training: FSDP & ZeRO](/learn/distributed-training-fsdp-deepspeed-zero) shows how multi-GPU sharding partitions those weights, gradients, and optimizer states across ranks; afterward, [LoRA](/learn/lora-parameter-efficient-fine-tuning) freezes the base weights and trains compact low-rank adapters instead.

<!-- leetllm: edition:reader:end -->
