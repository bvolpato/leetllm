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

Suppose a naive FP16 candidate keeps update state in FP16. A weight near `1.0` misses its `1e-4` update because the format can't represent a change that small near one. A different batch fails in forward execution when an activation or attention logit near `1e5` crosses FP16's ceiling of `65504` and turns into `Inf`. These are distinct numerical failures: one loses a subtle update to an existing weight, while the other cannot represent the magnitude of the signal at all. Nothing about the model's task changed, only the number system.

The previous chapter built a <span data-glossary="supervised-fine-tuning">supervised fine-tuning (SFT)</span> loop with a response-<span data-glossary="token">token</span> loss and held-out evaluation. We want that loop to run faster and fit larger batches into VRAM without corrupting the updates that make the network learn. Supported GPU Tensor Core paths can accelerate 16-bit matrix multiplications (GEMMs), and a 16-bit tensor uses half the bytes of an equally shaped FP32 tensor, though hardware, kernels, shapes, casts, and the FP32 baseline all shape end-to-end throughput. Calling `.half()` directly changes parameter storage as well as compute, losing both small gradients and small weight updates.

<span data-glossary="mixed-precision">Mixed precision training</span> instead assigns different dtypes to different operations and state. A conventional recipe uses compact GEMM operands while retaining FP32 update state and sensitive accumulations, though FP32 updates still cannot repair an already-overflowed low-precision forward operation.[^micikevicius2018] In a standard <span data-glossary="pytorch">PyTorch</span> <span data-glossary="automatic-mixed-precision">Automatic Mixed Precision (AMP)</span> loop, you keep model parameters and their optimizer in FP32 and let `autocast` choose an operation-specific dtype inside the forward pass.[^pytorchAmpDocs2026] Rather than declaring <span data-glossary="bf16">BF16</span> good or <span data-glossary="fp16">FP16</span> bad in the abstract, examine what each format loses, how its bits are allocated, and how verified runs perform under identical validation and hardware conditions.

## A floating-point number has two limits

A finite, normal binary floating-point value has a sign bit $s$, an exponent field $e$, and a fraction field $m$:

$$
x = (-1)^s \times 2^{e - \text{bias}} \times \left(1 + \frac{m}{2^{\text{fraction\_bits}}}\right)
$$

This equation uses the implicit leading 1 of a normal number, while subnormals use a leading 0 with the minimum normal exponent and zero, infinity, and NaN receive separate encodings. Its **exponent** controls **dynamic range**: how tiny or enormous a magnitude it can represent before hitting underflow or overflow. Its **fraction** controls **numerical resolution**: how close two neighboring numbers can be, which sets machine epsilon ($\epsilon$), the gap from `1.0` to the next larger representable value.

In a 16-bit budget, you spend 1 bit on the sign, leaving exactly 15 bits to split between the exponent and the fraction. FP16 and BF16 make opposite design bets with those 15 bits, trading off representable exponent span against fine spacing near `1.0`. The table below summarizes those bit allocations alongside FP32:

| Format | Total bits | Sign | Exponent bits (bias) | Fraction bits | Positive normal range | Machine epsilon ($\epsilon$ at 1.0) |
|---|---:|---:|---:|---:|---|---|
| FP32 | 32 | 1 | 8 (bias 127) | 23 | $\approx 1.18 \times 10^{-38} \dots 3.40 \times 10^{38}$ | $\approx 1.19 \times 10^{-7}$ |
| FP16 | 16 | 1 | 5 (bias 15) | 10 | $\approx 6.10 \times 10^{-5} \dots 65504$ | $\approx 9.77 \times 10^{-4}$ |
| BF16 | 16 | 1 | 8 (bias 127) | 7 | $\approx 1.18 \times 10^{-38} \dots 3.39 \times 10^{38}$ | $\approx 7.81 \times 10^{-3}$ |

The easy mistake is treating "16-bit" as one uniform format:

1. **FP16 (IEEE 754 half-precision)** dedicates 10 bits to the fraction and 5 to the exponent. Its largest finite value is $65504$, smallest positive normal is $2^{-14} \approx 6.10 \times 10^{-5}$, and smallest positive subnormal is $2^{-24} \approx 5.96 \times 10^{-8}$. Round-to-nearest can round a value below that subnormal minimum *up* to it. A value below half the minimum rounds to zero; the exact midpoint also rounds to zero under ties-to-even.
2. **BF16 (Brain floating point)** keeps FP32's 8 exponent bits and bias, with only 7 fraction bits. The minimum normal matches FP32, while its maximum finite value is slightly smaller and its encoded subnormal minimum is $2^{-133}$ instead of FP32's $2^{-149}$. Hardware conversion does not have to truncate: Cloud TPU uses nearest-even rounding and flushes BF16 subnormals to zero.[^googleBfloat162026] Wide range makes FP16-style loss scaling uncommon in BF16, though underflow remains possible.
3. **BF16 trades away resolution for range.** With only 7 fraction bits, BF16 has about 2.1 decimal digits of precision. Its machine epsilon near `1.0` is $2^{-7} \approx 7.81 \times 10^{-3}$, which is eight times coarser than FP16 ($2^{-10} \approx 9.77 \times 10^{-4}$) and over 65,000 times coarser than FP32.

PyTorch exposes these format limits directly through `torch.finfo`, letting you inspect both exponent span and local resolution on CPU without an accelerator. Running `finfo` against FP32, FP16, and BF16 confirms that BF16 inherits FP32's smallest positive normal while offering eight times coarser epsilon near `1.0` than FP16. Notice both thresholds printed below:

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

`epsilon_at_1` is the gap from `1.0` to the next larger representable value. Spacing isn't constant across all numbers: it scales with the current power of two. `smallest_normal` marks where numbers lose their implicit leading 1 and enter the subnormal range. FP16 is finer than BF16 near `1.0`, but drastically narrower in range.[^pytorchTypeInfo2026]

<figure>
  <img src="illustrations/_generated/mixed_precision_dark.png" alt="Three positive-range rows share a logarithmic magnitude axis. FP32 has 1 sign, 8 exponent and 23 fraction bits; FP16 has 1, 5 and 10; BF16 has 1, 8 and 7. Bit ribbons use the same width per bit. Solid intervals show normal ranges and dashed intervals extend to encoded subnormal minima. Shared markers locate the 1.2e-8 and 100000 inputs. The CPU cast table records FP16 zero and infinity, versus finite BF16 results near 1.20e-8 and 99840. Encoded subnormals can be flushed by a device path." />
  <figcaption>Bit ribbons use one shared width per bit, and magnitude ranges share one logarithmic axis. The table casts the two CPU inputs from the example; a device’s subnormal policy can change what survives.</figcaption>
</figure>

```checkpoint
If BF16 has FP32-like range, why don't we store model updates only in BF16?
---
Range and resolution are different. BF16 can represent very small standalone magnitudes, but its fraction has only 7 bits, so a tiny change to a weight near 1.0 can still round away. FP32 update state preserves those accumulated changes.
```

## Inspect both neighbors before judging an update

Take one weight sitting at `1.0`. One optimizer step wants to subtract `0.0001` ($10^{-4}$). BF16 easily represents that magnitude on its own, yet applying it to a much larger stored weight can erase the change.

This is **swamping**: rounding loses a small addition to a larger value. For an exactly representable weight, compare the proposed update with half the gap to its neighbor *in the update's direction*. Equality needs the rounding tie rule. There isn't one exact threshold equal to $\epsilon |w| / 2$ for every weight and both directions.

At the power-of-two threshold `1.0`, the gap below is half the gap above, which means addition and subtraction round on asymmetric intervals. As a result, a downward update survives at half the threshold needed for an equal upward step:

| Format | Gap below 1.0 | Gap above 1.0 | Half-gap for subtraction | Half-gap for addition |
|---|---:|---:|---:|---:|
| FP16 | $2^{-11}$ | $2^{-10}$ | $2^{-12} \approx 2.44 \times 10^{-4}$ | $2^{-11} \approx 4.88 \times 10^{-4}$ |
| BF16 | $2^{-8}$ | $2^{-7}$ | $2^{-9} \approx 1.95 \times 10^{-3}$ | $2^{-8} \approx 3.91 \times 10^{-3}$ |

Ask a sharper question than "is the update below epsilon?": which neighbor could it reach? `nextafter` lets us inspect the exact adjacent grid points in both directions.[^pytorchNextafter2026] Below, a subtraction of `0.0003` in FP16 and `0.0025` in BF16 still moves the weight even though both magnitudes sit below `eps / 2`:

<!-- leetllm: test, deps=torch, output=show, output_title="Neighbor output" -->
```python title="floating-point-neighbors.py"
import torch

for label, dtype, decrement in (("FP16", torch.float16, 0.0003),
                                ("BF16", torch.bfloat16, 0.0025)):
    one = torch.tensor(1.0, dtype=dtype)
    below = torch.nextafter(one, torch.tensor(0.0, dtype=dtype))
    above = torch.nextafter(one, torch.tensor(float("inf"), dtype=dtype))
    after = one - torch.tensor(decrement, dtype=dtype)
    assert decrement < torch.finfo(dtype).eps / 2 and after != one
    print(f"{label}: gap_below={1.0 - below.item():.8f}, "
          f"gap_above={above.item() - 1.0:.8f}, decremented={after.item():.8f}")

subnormal = torch.tensor(4e-8).to(torch.float16)
assert subnormal > 0
print(f"below_min_subnormal_can_round_up={subnormal.item():.2e}")
```

<!-- leetllm: output:start -->
```text title="Neighbor output" output compact
FP16: gap_below=0.00048828, gap_above=0.00097656, decremented=0.99951172
BF16: gap_below=0.00390625, gap_above=0.00781250, decremented=0.99609375
below_min_subnormal_can_round_up=5.96e-08
```
<!-- leetllm: output:end -->

Both decrements survive even though each is below half the *upward* gap. Our smaller `1e-4` decrement, by contrast, rounds away completely in either 16-bit format despite fitting easily as a standalone value. Replaying that single step across FP32, FP16, and BF16 makes the rounding loss concrete:

<!-- leetllm: test, output=show, continue=precision-lab, id=precision-updates -->
```python title="tiny-parameter-update.py"
weight = torch.tensor([1.0], dtype=torch.float32)
update = torch.tensor([1.0e-4], dtype=torch.float32)

for label, dtype in formats:
    before = weight.to(dtype)
    after = before - update.to(dtype)
    changed = bool(after.item() != before.item())
    print(f"{label}: stored_after_step={after.item():.8f}, update_survived={changed}")

```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP32: stored_after_step=0.99989998, update_survived=True
FP16: stored_after_step=1.00000000, update_survived=False
BF16: stored_after_step=1.00000000, update_survived=False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/floating_point_neighbors_dark.png" alt="Two number lines share a delta-from-one scale. FP16 has neighbors 0.99951172 and 1.00097656; BF16 has neighbors 0.99609375 and 1.00781250. Shaded nearest-even rounding cells around one are asymmetric. A 0.0001 decrement returns to one in both formats, while decrements of 0.0003 in FP16 and 0.0025 in BF16 reach their lower neighbors. The FP32 update stores approximately 0.99989998." />
  <figcaption>Both number lines use the same difference-from-one scale. The shaded rounding cells have unequal gaps on either side of one, so subtraction reaches a different midpoint from addition.</figcaption>
</figure>

Both 16-bit parameter values lose this `1e-4` update. Repeated deterministic updates below the directional rounding threshold leave a coordinate unchanged despite nonzero gradients, though not every 16-bit run freezes at initialization. For our ordinary AMP baseline, keep a high-precision update path:

> **Baseline storage rule:** Keep parameters and optimizer moments in FP32 while eligible operations use reduced precision. This protects small parameter updates, while leaving overflow checks essential for low-precision forward ops.

The original 2018 recipe maintained an FP32 master copy and an FP16 compute copy, while noting that master weights weren't universally necessary.[^micikevicius2018] PyTorch's automatic mixed precision (AMP) lets FP32 parameters remain the optimizer's update destination, selecting eligible compute dtypes and caching lower-precision conversions without automatically converting low-precision weights back to FP32.[^pytorchAmpDocs2026] Other storage schemes use different safeguards: Ozkara et al.'s 2025 study trained LLMs with BF16 state and stochastic rounding alongside temporary FP32 update arithmetic, letting small updates survive probabilistically rather than rounding away deterministically.[^ozkara2025StochasticRounding]

## Range decides whether gradients exist at all

Resolution causes failure when an update is too small relative to an existing weight, whereas range causes failure when a value is too small or too large to exist on its own. Backpropagation can produce tiny magnitudes depending on the model, normalization, residual paths, and loss, so inspect actual gradient histograms rather than assuming a fixed range. Compare a very small gradient ($1.2 \times 10^{-8}$) and a large activation-like magnitude ($1.0 \times 10^5$) across FP16 and BF16:

<!-- leetllm: test, output=show, continue=precision-updates, id=precision-range -->
```python title="gradient-range.py"
values = torch.tensor([1.2e-8, 1.0e5], dtype=torch.float32)

for label, dtype in (("FP16", torch.float16), ("BF16", torch.bfloat16)):
    cast = values.to(dtype)
    print(
        f"{label}: small={cast[0].item():.2e}, "
        f"large={cast[1].item():.2e}, "
        f"all_finite={bool(torch.isfinite(cast).all())}"
    )

fp16 = values.to(torch.float16)
bf16 = values.to(torch.bfloat16)
assert fp16[0] == 0 and torch.isinf(fp16[1])
assert bf16[0] > 0 and torch.isfinite(bf16).all()
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FP16: small=0.00e+00, large=inf, all_finite=False
BF16: small=1.20e-08, large=9.98e+04, all_finite=True
```
<!-- leetllm: output:end -->

FP16 fails at both ends:
1. **Underflow:** $1.2 \times 10^{-8}$ is below *half* FP16's minimum positive subnormal, so nearest rounding produces zero. Subnormal handling also depends on the operation and hardware; this CPU cast isn't a GPU-kernel test. A later multiplication can't reconstruct a value already lost.
2. **Overflow:** Casting $100000$ to FP16 produces infinity. Non-finite activations can contaminate later losses or gradients. That doesn't inevitably destroy every parameter: GradScaler can skip an affected optimizer's update. Skipping prevents that update, not the original forward overflow.

BF16 keeps these two cast results finite and the small value nonzero, with rounding error, so test activations, gradients, and accumulated updates across the target model and workload.[^kalamkar2019] While loss scaling rescues an underflowing backward gradient in FP16, it cannot repair a forward activation that already overflowed past $65504$. Keep in mind that BF16's wide exponent span still leaves only 7 fraction bits near `1.0`, so parameter updates still depend on the FP32 storage rule above.

## FP16 uses loss scaling to rescue small gradients

For FP16, **<span data-glossary="loss-scaling">loss scaling</span>** shifts gradient magnitudes out of the underflow zone and into the representable dynamic range during <span data-glossary="backpropagation">backpropagation</span> by relying on the linearity of the derivative.[^micikevicius2018] Multiplying the scalar loss $\mathcal{L}$ by a positive scale factor $S$ scales every parameter gradient by $S$:

$$
\mathcal{L}_{\text{scaled}} = S \cdot \mathcal{L}, \qquad \nabla_w \mathcal{L}_{\text{scaled}} = \nabla_w (S \cdot \mathcal{L}) = S \cdot \nabla_w \mathcal{L}
$$

Multiplying by $S = 1024$ shifts magnitudes by $\log_2(1024) = 10$ binary exponent steps, or roughly $3.01$ decades. Our tiny $1.2 \times 10^{-8}$ gradient becomes $1.23 \times 10^{-5}$, which is representable as an FP16 **subnormal** below its minimum normal; a hardware path that flushes subnormals would need a larger scale or another dtype. Because the multiplication enters before FP16 backward storage and exits only after widening gradients into FP32 buffers, the optimizer still receives the true unscaled direction by dividing by $S$ in FP32:

$$
g_{\text{true}} = \frac{1}{S} \cdot g_{\text{scaled}}
$$

In exact arithmetic scaling and unscaling cancel, while finite arithmetic introduces a small rounding error measured below. Gradient clipping must always occur **after** unscaling. Suppose a parameter's true gradient norm is $0.02$, well within a healthy `max_norm = 1.0` threshold: if you clip before unscaling, the clipper sees $0.02 \times 1024 = 20.48 > 1.0$ and divides all gradients by $20.48$, shrinking the subsequent unscaled update to $0.02 / 20.48 \approx 0.000977$, a twentyfold cut.

For a true gradient of $1.2 \times 10^{-8}$ and a teaching scale $S = 1024$, trace the lifecycle:

| Stage | Operation | Value | Representation state |
|---|---|---:|---|
| Forward & backward | Plain FP16 cast | $1.2 \times 10^{-8}$ | Underflows to literal zero ($0.0$) |
| Scaled backward | Multiply loss by $S = 1024$ | $1.23 \times 10^{-5}$ | Finite low-magnitude value |
| Unscale step | Divide by $S = 1024$ in FP32 | $1.20 \times 10^{-8}$ | Recovered with under $0.1\%$ relative error |

The scale must enter **before** the backward pass because multiplying zero by $1024$ after FP16 has already rounded a gradient away remains zero. The check below isolates that scale, quantize, and unscale cycle before we exercise dynamic backpropagation:

<!-- leetllm: test, output=show, continue=precision-range, id=precision-scale -->
```python title="loss-scaling-rescue.py"
true_grad = torch.tensor([1.2e-8], dtype=torch.float32)
scale = 1024.0

plain_fp16 = true_grad.to(torch.float16)
scaled_fp16 = (true_grad * scale).to(torch.float16)
recovered_fp32 = scaled_fp16.to(torch.float32) / scale

print(f"plain_underflowed={plain_fp16.item() == 0.0}")
print(f"scaled_visible={scaled_fp16.item() > 0.0}")
print(f"scaled_is_normal={scaled_fp16.item() >= torch.finfo(torch.float16).tiny}")
print(f"recovered_grad={recovered_fp32.item():.2e}")
print(f"recovery_relative_error={abs(recovered_fp32.item() - true_grad.item()) / true_grad.item():.3%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
plain_underflowed=True
scaled_visible=True
scaled_is_normal=False
recovered_grad=1.20e-08
recovery_relative_error=0.077%
```
<!-- leetllm: output:end -->

### Dynamic loss scaling as a feedback controller

A fixed scale can trade underflow for overflow. With $S = 65536$, a gradient of $1.0$ scales beyond FP16's maximum and rounds to infinity. A smaller scale reduces that risk but may lose smaller gradients. Which magnitudes survive is a property of the actual backward path.

The 2018 paper discussed dynamic scale selection as future work.[^micikevicius2018] PyTorch implements an adaptive controller. As of PyTorch 2.15, for one ordinary optimizer, its default policy works as follows:[^pytorchGradScalerV215]

1. **Start with an aggressive scale factor $S = S_0$** (PyTorch defaults to $2^{16} = 65536.0$) and initialize a consecutive successful steps counter $c = 0$.
2. **Compute forward pass** under autocast, generating scalar loss $\mathcal{L}$.
3. **Backpropagate on scaled loss** $\mathcal{L}_{\text{scaled}} = S \cdot \mathcal{L}$. Intermediate gradients follow operation dtypes; FP32 parameters accumulate FP32 `.grad` buffers.
4. **Unscale gradients** in FP32: $g \leftarrow \frac{1}{S} g_{\text{scaled}}$.
5. **Check the optimizer's gradients for non-finite values.** PyTorch combines checking and unscaling by device and dtype. Its ordinary optimizer-step path reads flags with `.item()`, which can synchronize; AMP-aware optimizer paths can consume device flags directly.
6. **Branch on finiteness:**
   - **If ANY gradient contains an Inf or NaN:**
     - **Skip the optimizer step completely.** Don't update weights, AdamW first moments ($m$), or second moments ($v$).
     - **Back off the scale:** $S \leftarrow S \times \text{backoff\_factor}$ (default $0.5$, halving the scale).
     - **Reset the success counter:** $c \leftarrow 0$.
   - **If ALL gradients are finite:**
     - Clip gradient norms if configured (now safely operating on true unscaled magnitudes).
     - Execute `optimizer.step()`, updating the FP32 parameters in our AMP baseline.
     - Increment the success counter: $c \leftarrow c + 1$.
     - **Check growth window:** If $c == \text{growth\_interval}$ (default 2,000 clean steps), increase the scale: $S \leftarrow S \times \text{growth\_factor}$ (default $2.0$), and reset $c \leftarrow 0$.

GradScaler skips this single optimizer's step as a unit rather than applying only its finite tensors. Multiple optimizers are different: each makes an independent skip decision, followed by one shared scaler update.[^pytorchAmpExamples2026] If your algorithm needs joint atomicity across optimizers, enforce that check explicitly.

Try that distinction directly by running two independent SGD optimizers under CPU `GradScaler`. We inject infinity into one optimizer's gradient to observe skip behavior rather than simulating a GPU overflow kernel, confirming that only the affected optimizer skips its step while the scaler still backs off for the shared update:

<!-- leetllm: test, deps=torch, output=show, output_title="Independent optimizer output" -->
```python title="two-optimizer-skip.py"
import torch

good = torch.nn.Parameter(torch.tensor(1.0))
bad = torch.nn.Parameter(torch.tensor(1.0))
optimizers = [torch.optim.SGD([p], lr=0.1) for p in (good, bad)]
scaler = torch.amp.GradScaler("cpu", init_scale=128)
scaler.scale(good).backward()
scaler.scale(bad).backward()
bad.grad.fill_(float("inf"))  # authored fault injection
for optimizer in optimizers:
    scaler.step(optimizer)
scaler.update()  # once after both step decisions
assert good.item() < 1.0 and bad.item() == 1.0
print(f"good_stepped={good.item() < 1.0}; bad_stepped={bad.item() != 1.0}; "
      f"next_scale={scaler.get_scale():.0f}")
```

<!-- leetllm: output:start -->
```text title="Independent optimizer output" output compact
good_stepped=True; bad_stepped=False; next_scale=64
```
<!-- leetllm: output:end -->

Here is a live CPU demonstration of that feedback loop tracking scale, finiteness checks, and Adam moments across four synthetic steps:

<!-- leetllm: test, output=show, continue=precision-scale, id=precision-backoff -->
```python title="overflow-backoff.py"
model = torch.nn.Linear(1, 2, bias=False)  # parameters stay FP32
with torch.no_grad():
    model.weight.fill_(1.0)
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
scaler = torch.amp.GradScaler("cpu", init_scale=1024, growth_interval=2)

for name, large_grad in (("quiet", 0.02), ("spike", 100.0),
                         ("quiet_again", 0.02), ("quiet_twice", 0.02)):
    optimizer.zero_grad(set_to_none=True)
    before = model.weight.detach().clone()
    state_before = {k: v.clone() for k, v in optimizer.state[model.weight].items()}
    with torch.autocast("cpu", dtype=torch.float16):
        prediction = model(torch.ones(1, 1))
        loss = (prediction.float() * torch.tensor([1.2e-8, large_grad])).sum()

    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    gradient = model.weight.grad.clone()
    finite = bool(torch.isfinite(gradient).all())
    if finite:
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    scaler.step(optimizer)  # skips the entire Adam update if non-finite
    scaler.update()

    changed = not torch.equal(model.weight, before)
    state = optimizer.state[model.weight]
    if not finite:
        assert not changed
        assert all(torch.equal(state[k], value) for k, value in state_before.items())
    else:
        assert changed and gradient[0].item() > 0
    print(f"{name}: grad={gradient.flatten().tolist()}, changed={changed}, "
          f"adam_step={int(state['step'])}, next_scale={scaler.get_scale():.0f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
quiet: grad=[1.1990778148174286e-08, 0.0200042724609375], changed=True, adam_step=1, next_scale=1024
spike: grad=[1.1990778148174286e-08, inf], changed=False, adam_step=1, next_scale=512
quiet_again: grad=[1.1990778148174286e-08, 0.0200042724609375], changed=True, adam_step=2, next_scale=512
quiet_twice: grad=[1.1990778148174286e-08, 0.0200042724609375], changed=True, adam_step=3, next_scale=1024
```
<!-- leetllm: output:end -->

The first quiet step succeeds and updates weights. The spiky step detects `inf` after unscaling, completely skips the optimizer update, leaves Adam moments untouched, and halves the scale from 1024 to 512. Two subsequent quiet steps succeed, triggering the growth threshold (`growth_interval=2`) and restoring the scale to 1024.

<figure>
  <img src="illustrations/_generated/loss_scaling_feedback_loop_dark.png" alt="A shared log-magnitude axis shows three CPU gradient cases scaled by 1024. The tiny gradient becomes a preserved FP16 subnormal, the quiet gradient stays finite, and the spike exceeds 65504. A connected four-batch trace starts at scale 1024 and Adam step zero. Quiet applies step one; the spike leaves weights and Adam moments unchanged and lowers the scale to 512; two subsequent clean steps advance Adam to step three and restore scale 1024. This configuration grows after two clean steps, versus the default 2000." />
  <figcaption>The four CPU events carry each new scale into the next batch. The spike skips the whole optimizer update and holds weights and Adam moments fixed; the rescued tiny gradient remains an encoded subnormal.</figcaption>
</figure>

In current PyTorch, `torch.amp.GradScaler` encapsulates this state machine with a default starting scale of `65536.0`, doubling after `2000` consecutive clean steps and multiplying by `0.5` on any non-finite step; call `scaler.unscale_(optimizer)` before inspecting or clipping gradients so thresholds evaluate true magnitudes.[^pytorchAmpDocs2026] Remember that loss scaling cannot repair a forward overflow: casting a forward value past FP16's range produces infinity before scaling ever enters, so scaling backoff only helps scaled backward overflows while BF16 or scaling the forward formulation prevents forward saturation.[^pytorchAmpDocs2026] Also inspect the scalar loss separately from its gradients, because GradScaler's ordinary step decision checks optimizer `.grad` tensors rather than whether the unscaled loss itself is finite;[^pytorchGradScalerSource2026] adding an infinite term to a constant loss leaves finite derivatives even though the forward objective broke, causing the scaler below to take a step:

<!-- leetllm: test, deps=torch, output=show, output_title="Finite gradients aren't a finite loss" -->
```python title="nonfinite-loss-finite-gradient.py"
import torch

weight = torch.nn.Parameter(torch.tensor(1.0))
optimizer = torch.optim.SGD([weight], lr=0.1)
scaler = torch.amp.GradScaler("cpu", init_scale=128)
loss = weight.square() + torch.tensor(float("inf"))  # authored forward fault
scaler.scale(loss).backward()
scaler.unscale_(optimizer)
finite_loss = bool(torch.isfinite(loss))
finite_gradient = bool(torch.isfinite(weight.grad).all())
scaler.step(optimizer)
scaler.update()
assert not finite_loss and finite_gradient and weight.item() < 1.0
print(f"finite_loss={finite_loss}; finite_gradient={finite_gradient}")
print(f"scaler_stepped={weight.item() < 1.0}; next_scale={scaler.get_scale():.0f}")
```

<!-- leetllm: output:start -->
```text title="Finite gradients aren't a finite loss" output compact
finite_loss=False; finite_gradient=True
scaler_stepped=True; next_scale=128
```
<!-- leetllm: output:end -->

Because the unscaled gradient equals 2.0, `GradScaler` has no non-finite `.grad` signal to reject the step, whereas the full training loop shown below explicitly rejects non-finite forward losses before backward. Guarding both quantities catches corrupted forward passes before backward compute runs or optimizer buffers move. Still, finite losses and finite gradients together only establish numerical validity rather than good data or task learning.

```checkpoint
One ordinary optimizer receives non-finite gradients after an FP16 backward pass. Should it apply the finite gradients and drop only the non-finite tensors?
---
No. Skip the whole optimizer step, reduce the loss scale, and retry on a later batch. Applying a partial update corrupts the optimization step. Clipping must also happen only after gradients are unscaled to their true magnitudes.
```

## Compute low, update high

Loss scaling protects small backward gradients, yet it cannot prevent deterministic rounding of tiny parameter updates; for that, this baseline relies on FP32 optimizer state and parameters. With FP32 parameters, ordinary AMP needs no separate master-weight <span data-glossary="tensor">tensor</span> because `autocast` picks eligible low-precision compute dtypes while the optimizer steps the original FP32 parameters.[^pytorchAmpDocs2026] By contrast, the 2018 mixed-precision recipe kept FP32 master weights alongside a 16-bit parameter copy each step, saving persistent state memory only at the expense of keeping two weight versions.[^micikevicius2018] Understanding which tensor copy stores the update tells you both why tiny steps survive and how many bytes live in VRAM.

Here is the <span data-glossary="cuda">CUDA</span> loop structure for a fine-tuning run (non-executable here since it requires a GPU, model, and dataloader). Initialize the optimizer from FP32 GPU parameters; note that `GradScaler(..., enabled=False)` bypasses both scaling and skip detection without altering compute dtypes, so a disabled scaler branch still needs explicit finiteness guards. Always confirm device BF16 support before disabling the scaler, and keep the autocast context around forward computation and loss evaluation only:

```python title="cuda-amp-training-shape.py"
dtype = torch.bfloat16  # compare against torch.float16 in a controlled run
if dtype == torch.bfloat16 and not torch.cuda.is_bf16_supported():
    raise RuntimeError("This CUDA device doesn't support the chosen BF16 path")
scaler = torch.amp.GradScaler("cuda", enabled=(dtype == torch.float16))

for batch, target in dataloader:
    optimizer.zero_grad(set_to_none=True)
    with torch.autocast(device_type="cuda", dtype=dtype):
        logits = model(batch.cuda())
        loss = criterion(logits, target.cuda())

    if not torch.isfinite(loss).all().item():
        raise FloatingPointError("Non-finite forward loss; optimizer not stepped")
    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    finite = all(torch.isfinite(p.grad).all().item()
                 for p in model.parameters() if p.grad is not None)
    if not finite and not scaler.is_enabled():
        raise FloatingPointError("Non-finite BF16 gradients; optimizer not stepped")
    if finite:
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0, error_if_nonfinite=True)
    scaler.step(optimizer)
    scaler.update()
```

Skipping `GradScaler` is common under BF16 because BF16's wide exponent range avoids typical FP16 underflow, though bad data, unstable losses, oversized <span data-glossary="learning-rate">learning rates</span>, or sensitive kernels can still generate NaNs or Infs (in production, aggregate those finiteness checks without per-parameter `.item()` GPU synchronizations). Remember also that autocast is operation-specific rather than a blanket cast: on CUDA, eligible matrix multiplications run in 16-bit while reductions such as `cross_entropy` widen to FP32, backward mirrors each forward operation's dtype, and accumulated `.grad` buffers remain FP32 on FP32 parameters. Keep backward outside the autocast context and never call `model.half()` when configuring AMP.[^pytorchAmpDocs2026]

### GradScaler and gradient accumulation share one optimizer step

The loop above runs one micro-batch per optimizer step, whereas real SFT runs accumulate gradients across several micro-batches before stepping once. Notice where the synchronization point lies: `GradScaler` tracks the optimizer step rather than each micro-batch, so every micro-batch contributes a scaled backward pass to `.grad` while unscaling, clipping, stepping, and scale adjustment wait until the accumulation window completes:

| Call | Once per micro-batch | Once per optimizer step |
|---|---|---|
| `scaler.scale(micro_loss).backward()` | Yes | No |
| `scaler.unscale_(optimizer)` | No | Yes, after the window finishes and before clip |
| clip gradients | No | Yes |
| `scaler.step(optimizer)` | No | Yes |
| `scaler.update()` | No | Yes |

Stepping or updating inside the accumulation loop collapses the effective batch size and adapts the scale on incomplete gradients, while calling `unscale_` early makes subsequent micro-batches accumulate scaled gradients into unscaled buffers. Always track skipped steps in telemetry so a silent skip storm never masquerades as healthy convergence, hold one constant loss scale across the entire window, and serialize `scaler.state_dict()` with model and optimizer state for exact resumes.[^pytorchAmpExamples2026] These practices ensure that recovery runs preserve identical numerical state after interruptions.

Dividing each micro-batch's mean loss by `accum_steps` works only when every micro-batch has equal weight, whereas variable-length SFT masking changes active response counts per micro-batch. When tokens should count equally, sum each micro-batch's active-token losses and divide by the full window's active-token count before scaling and `backward`. This CPU autograd counterexample contrasts one valid token in the first micro-batch with three in the second, showing how mean-of-means lets the lone token cancel all three others to yield zero instead of the true `-1.0` full-batch gradient:

<!-- leetllm: test, deps=torch, output=show -->
```python title="unequal-token-accumulation.py"
import torch

targets = (torch.tensor([0.0]), torch.tensor([2.0, 2.0, 2.0]))
total_tokens = sum(y.numel() for y in targets)

def accumulated_gradient(mode):
    weight = torch.tensor(1.0, requires_grad=True)
    for y in targets:
        losses = (weight - y).square()
        loss = losses.mean() / len(targets) if mode == "mean_of_means" else losses.sum() / total_tokens
        loss.backward()
    return weight.grad.item()

weight = torch.tensor(1.0, requires_grad=True)
full_loss = (weight - torch.cat(targets)).square().mean()
full_loss.backward()
wrong = accumulated_gradient("mean_of_means")
correct = accumulated_gradient("token_weighted")
print(f"full_batch_grad={weight.grad.item():.1f}")
print(f"mean_of_means_grad={wrong:.1f}, token_weighted_grad={correct:.1f}")
assert correct == weight.grad.item() and wrong != correct
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full_batch_grad=-1.0
mean_of_means_grad=0.0, token_weighted_grad=-1.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/accumulation_boundary_dark.png" alt="At weight one, one target-zero token contributes gradient plus two, while three target-two tokens each contribute minus two. Their batch sums are plus two and minus six. Averaging the two batch means gives zero; dividing the combined sum by all four valid tokens gives minus one. Both final gradients use the same signed axis. In AMP, one scale is held through the window and one optimizer step follows accumulation." />
  <figcaption>The one-token and three-token groups sum to +2 and −6. Dividing their combined sum by all four tokens gives −1; equally weighting the two batch means gives zero. AMP keeps one scale through the shared optimizer window.</figcaption>
</figure>

To handle a short final accumulation window cleanly, normalize by the actual token count in that tail window rather than the nominal step budget, skip any window whose active token count is zero, and advance the LR scheduler only on non-skipped updates. Keeping those edge cases consistent with full steps prevents abrupt step-size jumps near epoch endings or scaler backoff bursts.

## Account for memory before claiming savings

One of the most persistent myths in deep learning is the slogan *"Mixed precision cuts model memory in half,"* when in reality end-to-end savings depend on which stored tensors actually shrink. Ordinary AMP with an FP32 model can leave persistent parameter and optimizer bytes unchanged while reducing only saved activations, whereas other recipes modify weights, gradients, optimizer state, or sharding directly. Because those persistent buffers can rival or exceed activation savings, switching dtypes alone never guarantees doubling the feasible batch size.

Start with three explicit inventories: unsharded AdamW, FP32 moment storage, one full-size gradient buffer, and no AMSGrad buffer. Scalar counters, workspaces, conversion caches, and allocator overhead are excluded. The activation row assumes the same set of values is stored at the chosen dtype; it isn't a description of every tensor autocast saves.

| Component | Pure FP32 baseline | FP32 weights + AMP | Mixed-precision FP32 master-weight recipe |
|---|---:|---:|---:|
| Model weights (forward & backward) | 4 bytes ($4N$) | 4 bytes ($4N$, FP32 storage) | 2 bytes ($2N$, FP16/BF16) |
| Gradients (`.grad` buffer) | 4 bytes ($4N$) | 4 bytes ($4N$, FP32 `.grad`) | 2 bytes ($2N$, FP16/BF16) |
| FP32 Master weights | None | None (parameters are FP32) | 4 bytes ($4N$, FP32) |
| AdamW 1st moment ($m$) | 4 bytes ($4N$) | 4 bytes ($4N$, FP32) | 4 bytes ($4N$, FP32) |
| AdamW 2nd moment ($v$) | 4 bytes ($4N$) | 4 bytes ($4N$, FP32) | 4 bytes ($4N$, FP32) |
| Optional FP32 gradient staging buffer | None | None | 0 or 4 bytes (0 or $4N$) |
| **Total Static Model State** | **16 bytes / param** ($16N$) | **16 bytes / param** ($16N$) | **16 to 20 bytes / param** ($16N$ to $20N$) |
| Activation values chosen for this inventory | 4 bytes per value | 2 bytes per value (assumed) | 2 bytes per value (assumed) |

Notice the static tally:
1. **Pure FP32:** 4B weight + 4B gradient + two 4B moment buffers = **16 bytes per parameter**. AdamW's second raw moment isn't the gradient variance.
2. **FP32 model with AMP:** The same parameter, gradient, and moment storage totals **16 bytes per parameter**. Converted weight tensors may be cached for an autocast region or retained for backward, adding storage beyond this tally.
3. **Master-copy inventory:** Low-precision weights (2B) and gradients (2B), an FP32 master (4B), and FP32 moments (8B) total **16 bytes per parameter**. An additional full-size FP32 gradient staging buffer makes this particular inventory **20 bytes**. Actual framework copies and sharding determine the per-rank cost.

Autograd saves tensors needed for backward, not every intermediate. Some hidden-state storage grows like $bshl$ (batch, sequence length, hidden width, layers); materialized attention scores also have a quadratic sequence-length term. Fused attention and recomputation change that inventory.[^korthikanti2022] No fixed activation percentage follows from the model family.

Inspect a small case before assuming all saved values are 16-bit. This CPU hook records dtypes, not peak GPU memory.[^pytorchSavedTensorHooks2026] The explicit `.float()` before squaring creates an FP32 saved tensor alongside the BF16 linear-path input. The pack hook returns a detached tensor to avoid retaining a reference cycle with its input.

<!-- leetllm: test, deps=torch, output=show, output_title="Saved tensor output" -->
```python title="saved-tensor-dtypes.py"
import torch

layer = torch.nn.Linear(4, 4)
saved_dtypes = set()
def record(tensor):
    saved_dtypes.add(str(tensor.dtype))
    return tensor.detach()

with torch.autograd.graph.saved_tensors_hooks(record, lambda tensor: tensor):
    with torch.autocast("cpu", dtype=torch.bfloat16):
        output = layer(torch.ones(2, 4))
        loss = output.float().square().mean()
    loss.backward()
assert saved_dtypes == {"torch.bfloat16", "torch.float32"}
print(f"saved_dtypes={sorted(saved_dtypes)}")
```

<!-- leetllm: output:start -->
```text title="Saved tensor output" output compact
saved_dtypes=['torch.bfloat16', 'torch.float32']
```
<!-- leetllm: output:end -->

Halving the bytes of an unchanged set of activation values halves *that component* while leaving persistent parameters, gradients, and Adam moments untouched. The worked example below pairs 100 million parameters with 800 million saved activation values rather than a profiled model, pinning every component under shared dimensions so you can verify why overall memory falls by only one third:

<!-- leetllm: test, output=show, id=precision-memory -->
```python title="memory-budget.py"
def gib(values: int, bytes_per_value: int) -> float:
    return values * bytes_per_value / (1024 ** 3)


parameter_values = 100_000_000
activation_values = 800_000_000

fp32_budget = {
    "parameters": gib(parameter_values, 4),
    "gradients": gib(parameter_values, 4),
    "adam_moments": gib(parameter_values * 2, 4),
    "activations": gib(activation_values, 4),
}
amp_budget = {
    **{name: value for name, value in fp32_budget.items() if name != "activations"},
    "activations": gib(activation_values, 2),
}

print(f"fp32_total_gib={sum(fp32_budget.values()):.2f}")
print(f"amp_total_gib={sum(amp_budget.values()):.2f}")
print(f"activation_saving_gib={fp32_budget['activations'] - amp_budget['activations']:.2f}")
print(f"total_reduction={(1 - sum(amp_budget.values()) / sum(fp32_budget.values())):.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fp32_total_gib=4.47
amp_total_gib=2.98
activation_saving_gib=1.49
total_reduction=33.3%
```
<!-- leetllm: output:end -->

```checkpoint
In the inventory example, activation values use two bytes instead of four, yet the total falls by only one third. Is mixed precision broken?
---
No. Parameters, gradients, and Adam moments may still use FP32 storage, so only one part of the inventory halved. Profile each component before deciding whether activation casting, sharding, checkpointing, or a smaller batch targets the real bottleneck.
```

<figure>
  <img src="illustrations/_generated/mixed_precision_dtype_policy_dark.png" alt="An authored inventory uses 100 million parameters and 800 million chosen activation values. The FP32 and AMP bars share one GiB scale. Parameters, gradients and Adam moments stay at 0.37, 0.37 and 0.75 GiB. Activations shrink from 2.98 to 1.49 GiB, so the total drops from 4.47 to 2.98 GiB, a 33.3 percent reduction. A separate shared-scale payload comparison shows one 100-million-value gradient tensor at 0.37 GiB for FP32 and 0.19 GiB for BF16; these are logical tensor bytes." />
  <figcaption>Both inventories use the same 100M parameter and gradient values, two FP32 Adam moment buffers, and 800M activation values. The chosen activation storage halves while FP32 state stays fixed. The separate payload bars hold the gradient count fixed; caches, workspaces and allocator costs need profiling.</figcaption>
</figure>

The 2018 paper's roughly halved-memory discussion used FP16 weights, activations, and gradients plus an FP32 master, with activation-dominated memory, so on real Transformer workloads you should measure peak allocated and reserved memory directly because layer shapes and storage choices govern actual savings.[^micikevicius2018] Ordinary AMP, as in the budget above, keeps parameters, gradients, and Adam's two moment buffers in FP32, already totaling 16 bytes per parameter, while a 16-byte master-copy recipe stores 2-byte weights and gradients alongside FP32 master weights and moments; equal byte totals reflect different copies. Note also that simplified component inventories omit temporary workspaces, cached autocast weight conversions, allocator overhead, and optimizer-specific buffers, so profile steady-state GPU steps before using a budget for capacity planning.

For large models where model state exceeds single-GPU capacity, sharding frameworks like <span data-glossary="zero">ZeRO</span> and Fully Sharded Data Parallel (FSDP) partition parameters, gradients, and optimizer moments across GPUs depending on the chosen strategy or stage.[^rajbhandari2020][^zhao2023] That addresses persistent state that mixed-precision compute alone leaves unchanged, though it still leaves open which dtype workers use when exchanging gradients over the network.

## Distributed jobs add a communication dtype

When workers exchange gradients, communication has its own precision control: PyTorch's `FullyShardedDataParallel` (FSDP1) `MixedPrecision` configuration exposes `param_dtype` for forward and backward computation separately from `reduce_dtype` for gradient reduction, and other distributed APIs expose similar knobs.[^pytorchFsdpDocs2025] The next calculation isolates the payload size of **one gradient tensor to reduce** before network collectives, worker count, sharding, and topology determine total wire traffic:

<!-- leetllm: test, output=show, continue=precision-memory, id=precision-communication -->
```python title="communication-budget.py"
gradient_values = 100_000_000
fp32_reduce_gib = gib(gradient_values, 4)
bf16_reduce_gib = gib(gradient_values, 2)

print(f"gradient_payload_fp32_gib={fp32_reduce_gib:.2f}")
print(f"gradient_payload_bf16_gib={bf16_reduce_gib:.2f}")
print(f"payload_reduction={(1 - bf16_reduce_gib / fp32_reduce_gib):.0%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gradient_payload_fp32_gib=0.37
gradient_payload_bf16_gib=0.19
payload_reduction=50%
```
<!-- leetllm: output:end -->

A job can use BF16 for <span data-glossary="matrix">matrix</span> computations and still communicate FP32 gradient payloads. Logging only a single `mixed_precision=true` flag hides whether network traffic actually halved or remained in four-byte floats. A trustworthy run record therefore separates `compute_dtype`, `update_storage_dtype`, and `reduce_dtype` explicitly.

## Choose precision from controlled runs

Once the arithmetic is clear, the question becomes attribution: did the dtype change the result, or did the run change around it? Freeze the fine-tuned model artifact, data, seeds, eval suite, and hardware, then record the full experimental configuration before timing anything.

| Dimension | Record before comparing runs |
|---|---|
| Hardware | Accelerator model and count, interconnect or topology, and driver/CUDA versions |
| Software | PyTorch, kernel or <span data-glossary="transformer">Transformer</span> Engine versions, compiler settings, and launch path |
| Workload | Model shape, micro-batch and sequence lengths, accumulation window, warmup, and steady-state sample |
| Precision | Compute, update-storage, and reduction dtypes, plus FP8 format and scaling recipe when used |
| Baseline | Exact FP32, BF16, or FP16 implementation, optimizer settings, and equivalent tuning |
| Correctness | Non-finite and skipped steps, tolerances, loss curves, held-out `format_pass_rate`, and `task_pass_rate` slices |

FP32 tensor storage alone doesn't define the baseline's arithmetic. PyTorch can use TF32 for CUDA GEMMs or convolutions; as of PyTorch 2.15 it is off by default for matrix multiplications and on for convolutions. Some FP16/BF16 GEMMs allow intermediate reductions at reduced precision. Record those controls too: reduced-precision partial sums can overflow even when the final mathematical result fits.[^pytorchNumericalAccuracy2026] That record supports reproducing a speed or memory result, and for the precision comparison below we set `format_pass_rate >= 0.98` and `task_pass_rate >= 0.93` as validation gates. Always measure step time over warmed-up, synchronized GPU iterations because asynchronous kernel launch time alone isn't step latency.[^pytorchCudaSemantics2026]

### RL can expose a BF16 train-inference mismatch

BF16's wide exponent range makes it a strong default candidate for many training jobs, including this SFT run, though range isn't the only concern. Reinforcement-learning fine-tuning updates a training policy using trajectories generated by a separate inference path, where different kernels or batch shapes can produce slightly different FP32 <span data-glossary="logits">logits</span> before casting. BF16's coarse spacing can round those nearby values to opposite sides of a representable rounding threshold, causing <span data-glossary="rollout">rollout</span> probabilities to diverge from training probabilities.

Qi et al. report this failure mode in LLM reinforcement-learning fine-tuning and find that using FP16 consistently reduced the train-inference mismatch and improved optimization across their tested tasks, algorithms, and frameworks.[^qi2025fp16mismatch] This motivates evaluating scaled FP16 against BF16 for RL setups rather than treating BF16 as universally superior. Keep in mind that FP16 still requires loss scaling for small gradients, finite forward values, and the same controlled quality checks as any precision setup.

To see the underlying mechanics concretely, the example below isolates two rounding thresholds on a single two-logit pair rather than reproducing a full RL run. At the first input pair, FP16 collapses nearby logits while BF16 separates them; at the second, the roles reverse, showing that one favorable example doesn't prove a format always avoids mismatch.

<!-- leetllm: test, deps=torch, output=show -->
```python title="compare-policy-rounding.py"
import torch

def policy_gap(dtype: torch.dtype, first: float, second: float) -> float:
    training_logits = torch.tensor([first, 1.0], dtype=torch.float32)
    rollout_logits = torch.tensor([second, 1.0], dtype=torch.float32)
    training_cast = training_logits.to(dtype).to(torch.float32)
    rollout_cast = rollout_logits.to(dtype).to(torch.float32)
    training_probability = torch.softmax(training_cast, dim=0)[0]
    rollout_probability = torch.softmax(rollout_cast, dim=0)[0]
    gap = abs(training_probability.item() - rollout_probability.item())
    return gap


for first, second in ((1.0038, 1.0040), (1.0004, 1.0006)):
    gaps = [policy_gap(dtype, first, second) for dtype in (torch.float16, torch.bfloat16)]
    print(f"logits={first},{second}: FP16_gap={gaps[0]:.7f}, BF16_gap={gaps[1]:.7f}")

assert policy_gap(torch.float16, 1.0038, 1.0040) == 0
assert policy_gap(torch.bfloat16, 1.0038, 1.0040) > 0
assert policy_gap(torch.float16, 1.0004, 1.0006) > 0
assert policy_gap(torch.bfloat16, 1.0004, 1.0006) == 0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logits=1.0038,1.004: FP16_gap=0.0000000, BF16_gap=0.0019531
logits=1.0004,1.0006: FP16_gap=0.0002441, BF16_gap=0.0000000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/policy_rounding_boundaries_dark.png" alt="Two rounding cases compare FP16 and BF16 quantization ticks near 1.0 for the first logit while keeping the second logit at 1.0. For inputs 1.0038 and 1.0040, FP16 rounds both to 1.00390625 while BF16 places them at 1.0000 and 1.0078125, giving softmax gaps of 0 and 0.0019531. For inputs 1.0004 and 1.0006, FP16 separates them at 1.0000 and 1.00097656 while BF16 merges both at 1.0000, giving gaps of 0.0002441 and 0." />
  <figcaption>The first input pair crosses a BF16 rounding threshold while FP16 merges both logits; the second pair crosses an FP16 threshold while BF16 merges them. These are exact CPU softmax differences for two isolated logits rather than full RL trajectories.</figcaption>
</figure>

An RL precision verification should therefore include a direct train-versus-rollout check: record logits or log probabilities for matched prompts, measure divergence under the actual training and serving stacks, and check reward and held-out quality across seeds. Promote scaled FP16 over BF16 only when it closes that measured mismatch without introducing overflow or quality regressions.

### Apply both quality gates before comparing speed

The example below filters a synthetic table of precision outcomes to enforce the comparison rules rather than presenting real benchmarks. Assume model, data, seeds, software, batch shape, and evaluation are held fixed while one candidate changes hardware, another misses format validity, and another records a non-finite metric.

<!-- leetllm: test, output=show -->
```python title="precision-run-decision.py"
from dataclasses import dataclass
from math import isfinite

@dataclass(frozen=True)
class PrecisionRun:
    run_id: str
    task_pass_rate: float
    format_pass_rate: float
    nonfinite_steps: int
    examples_per_second: float
    hardware: str = "same-gpu"


runs = (
    PrecisionRun("fp32", 0.93, 0.99, 0, 800),
    PrecisionRun("fp16_unscaled", 0.88, 0.99, 3, 1240),
    PrecisionRun("fp16_scaled", 0.93, 0.99, 0, 1190),
    PrecisionRun("bf16", 0.93, 0.99, 0, 1310),
    PrecisionRun("other_hardware", 0.93, 0.99, 0, 1770, "different-gpu"),
    PrecisionRun("bad_format", 0.96, 0.97, 0, 1400),
    PrecisionRun("invalid_metric", float("nan"), 0.99, 0, 1500),
    PrecisionRun("invalid_throughput", 0.93, 0.99, 0, float("inf")),
)


def eligible(run):
    rates = (run.task_pass_rate, run.format_pass_rate)
    return (run.hardware == "same-gpu"
            and all(isfinite(rate) and 0 <= rate <= 1 for rate in rates)
            and run.task_pass_rate >= 0.93 and run.format_pass_rate >= 0.98
            and run.nonfinite_steps == 0
            and isfinite(run.examples_per_second) and run.examples_per_second > 0)

accepted = [run.run_id for run in runs if eligible(run)]
rejected = [run.run_id for run in runs if not eligible(run)]
assert accepted == ["fp32", "fp16_scaled", "bf16"]
print(f"quality_and_comparability_pass={accepted}")
print(f"rejected={rejected}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
quality_and_comparability_pass=['fp32', 'fp16_scaled', 'bf16']
rejected=['fp16_unscaled', 'other_hardware', 'bad_format', 'invalid_metric', 'invalid_throughput']
```
<!-- leetllm: output:end -->

Both scaled FP16 and BF16 pass this toy filter, leaving two eligible candidates to benchmark properly. On real workloads, compare repeated throughput and peak-memory measurements among eligible candidates, then verify loss curves and held-out slices across seeds; a few early FP16 scaler backoffs can be harmless as long as steady-state convergence matches.

## Evaluate FP8 after measuring the lower-precision path

With lower-precision candidates verified, the next option is an 8-bit path. FP8 cuts operand storage again, but it isn't a smaller FP16 switch: its encoding, scale granularity, conversion rules, and kernel path all shape numerical behavior. The OCP FP8 specification defines two complementary encodings: E4M3 uses 4 exponent bits and 3 fraction bits, reaches a maximum finite magnitude of 448 without infinity encodings, while E5M2 uses 5 exponent bits and 2 fraction bits, reaches 57,344, and keeps infinity encodings.[^ocp2023ofp8]

E4M3 buys nearby resolution while E5M2 buys range, which is why the FP8 formats paper uses them on different tensors rather than forcing one format everywhere.[^micikevicius2022] Transformer Engine's tensor-scaled hybrid recipe maps forward activations and weights to E4M3 and backward gradients to E5M2 (verified here against version 2.20.2 on October 10, 2026; pin the exact version in an experiment).[^nvidiaTransformerEngine2026] Its current-scaling recipe computes an absolute maximum (`amax`) from the live tensor unless fused into prior operations, whereas delayed scaling estimates the scale from `amax` history at the risk of lagging sudden magnitude spikes.[^nvidiaTransformerEngine2026]

MXFP8 changes the scale granularity by storing FP8 elements alongside one E8M0 power-of-two scale per block of 32 values.[^ocp2023mx] Transformer Engine's MXFP8 recipe uses E4M3 by default, supports a hybrid E4M3-forward and E5M2-backward setup, and targets native Blackwell hardware paths.[^teRecipes2026][^nvidiaTransformerEngine2026]

| Recipe | Scale scheme | Failure or cost to measure |
|---|---|---|
| FP8 current scaling | One FP32 scale from the tensor's current `amax`; scale, then cast | Current-maximum reduction overhead and outlier-driven range changes |
| FP8 delayed scaling | One FP32 scale predicted from `amax` history, then history update | Stale history can saturate a new spike |
| MXFP8 block scaling | One E8M0 power-of-two scale per 32 consecutive values; E4M3 is the usual element format | Block dimensions, layout, transpose, and native-kernel support |

Storage format and accumulation precision remain separate questions. The FP8 paper assumes wider outputs, and OCP MX specifies Float32 outputs for general <span data-glossary="dot-product">dot products</span> while leaving internal accumulation order implementation-defined, so stored dtype alone never settles kernel numerics.[^micikevicius2022][^ocp2023mx] OCP FP8 also distinguishes saturating from non-saturating conversion: out-of-range magnitudes can clamp to 448 (finite yet wrong) or turn into NaN in E4M3, and clamp to 57,344 or overflow to infinity in E5M2, so telemetry should track saturation alongside non-finite steps and held-out accuracy.[^ocp2023ofp8]

<figure>
  <img src="illustrations/_generated/fp8_scale_contract_dark.png" alt="Two eight-bit words show E4M3 sign/exponent/fraction counts one/four/three and E5M2 counts one/five/two. Their finite maxima are 448 and 57344; infinity is absent from E4M3 and present in E5M2. Two MXFP8 schema rows each contain exactly 32 FP8 value cells and one associated E8M0 power-of-two scale. Scale metadata is distinct from the element encoding; the implementation specifies internal arithmetic." />
  <figcaption>Each FP8 element has eight bits. MXFP8 adds one E8M0 power-of-two scale per 32-value block. The two displayed blocks illustrate storage metadata; the implementation defines internal precision and operation order.</figcaption>
</figure>

Hardware and software determine whether FP8 yields real speedups or falls back to slow conversions. Before treating an FP8 measurement as comparable, verify accelerator model, topology, CUDA, PyTorch, and Transformer Engine versions, aligned tensor dimensions, and native Tensor Core execution in a profiler, after already benchmarking BF16 or scaled FP16 under the controlled evidence standard above. Keep model, optimizer, data, seeds, batch shapes, and evaluation fixed while comparing step time, throughput, peak memory, scaling overhead, saturation and skipped-step counts, loss curves, and held-out `format_pass_rate` and `task_pass_rate` gates.

## Common pitfalls

A precision failure usually points to a single quantity that crossed its numerical range or resolution limit. Start from the symptom, identify which tensor or update lost precision, and fix the narrowest offending operation before loosening tolerances.

#### BF16 is mistaken for an FP32 optimizer replacement

A BF16-only parameter update can stop improving loss even while every gradient is finite. Wide exponent range doesn't provide fine spacing near the current weight, so keep FP32 update state under ordinary AMP and log the storage configuration. Confirm parameter dtypes directly on `optimizer.param_groups` whenever early validation plateaus unexpectedly.

#### FP16 silently loses gradients

Training can look stable while `task_pass_rate` lags the FP32 baseline when small unscaled FP16 gradients underflow to zero. Use `GradScaler`, track non-finite or skipped steps, and compare the declared held-out metric against the same baseline. Inspect `.grad` histograms across layers if scaling alone leaves tiny weights frozen.

#### Gradient clipping sees scaled values

If clipping behaves erratically or training diverges under FP16 AMP, inspect whether the run clips before `scaler.unscale_(optimizer)`. Unscale first, then apply <span data-glossary="gradient-clipping">gradient clipping</span>, and let the scaler perform or skip the optimizer step. Verify the clipped norm magnitude in logs against true unscaled gradient norms.

#### GradScaler steps every micro-batch

If effective batch size collapses or later micro-batches write into already-unscaled gradients, `unscale_` / `step` / `update` ran inside the accumulation window. Scale and backward every micro-batch, then unscale, clip, step, and update once per optimizer step. Saving `scaler.state_dict()` alongside optimizer buffers ensures resumed runs preserve the same scaling trajectory.

#### Memory claims omit optimizer state

"Half-memory" planning fails when only activation dtype changed while FP32 parameters and Adam moments remain large. Log a component-level memory profile or accounting budget instead of a dtype slogan. Separate static parameter-plus-optimizer bytes from sequence-dependent activations before resizing batches.

#### Distributed bandwidth remains high

BF16 compute can be enabled while cross-worker traffic remains a bottleneck because reduction payloads stayed FP32. Inspect and record `reduce_dtype` separately, then measure held-out quality and communication changes before promotion. A swamped update, an underflowed gradient, and an activation that already overflowed represent distinct failure mechanisms, and the FP32 state that survives these checks is precisely what distributed training next has to shard across GPUs.

## Check your understanding

### Evaluation rubric

- **Foundational:** Distinguish a tiny standalone value from a tiny update to a weight near 1.0, using FP16 and BF16 range and spacing.
- **Intermediate:** Trace scale, backward, unscale, finite check, clipping, step or skip, and scale update. Explain why an overflowed Adam step must leave weights and moments unchanged.
- **Intermediate:** Normalize unequal-token micro-batches by the full effective batch and keep one loss scale through the accumulation window.
- **Advanced:** Separate activation, parameter, optimizer, and communication bytes, then compare measured precision candidates without changing hardware or quality criteria.

### Follow-up questions

```checkpoint
Why doesn't scaling rescue a tiny input that was rounded to zero during the forward pass?
---
Loss scaling amplifies the backward signal, not the earlier input. Once the forward cast has lost the input, scaling the loss can't reconstruct it. Keep the sensitive forward operation in a suitable dtype or change its formulation.
```

```checkpoint
Change the first accumulation micro-batch from one valid token to three copies of that token. Should averaging the two means now match the concatenated batch?
---
Yes. Both micro-batches now contain three valid tokens, so they have equal weight in the full-token mean. With targets 0,0,0 and 2,2,2 at weight 1, the positive and negative gradient contributions cancel. That equality doesn't hold for the original one-versus-three split.
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
    "question": "A precision audit sends standalone values 5 × 10^-9 and 2 × 10^5 through FP16 and BF16 casts. Which range prediction is correct?",
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
    "explanation": "With the draw fixed at 0.602, training picks B and serving picks A because the probability crosses the draw. A shared draw of 0.605 gives B on both paths. When both probabilities are 0.601, the different draws alone change the token. When both the probability and the draw change, replaying 0.599 on both paths gives A twice and replaying 0.605 gives B twice. To test whether such token changes explain the reward drop, compare held-out rewards across seeds."
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
    "explanation": "Hold all other variables fixed to isolate precision. Separately tuned recipes answer a different comparison question; declare that tuning and its budget, and measure real throughput on target hardware rather than these synthetic numbers."
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

> **Next:** Continue to [Distributed Training: FSDP & ZeRO](/learn/distributed-training-fsdp-deepspeed-zero). These arithmetic checks tell you what to test; choosing a precision recipe still needs measurements on your workload and hardware. Ordinary AMP can leave FP32 parameter and <span data-glossary="optimizer-state">optimizer state</span> behind. The next lesson examines how FSDP and ZeRO shard state, and why per-rank memory depends on the copies and communication buffers that actually exist.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

A weight is stored as exactly 1.0. Backpropagation does its job, the optimizer computes an update of 0.0001, and the code subtracts it. The weight is still exactly 1.0. Nothing raised an exception and nothing logged a warning. A piece of learning just vanished, and it will vanish again on the next step.

Someone on your team turned on 16-bit floats to fit bigger batches on the same GPUs, which is a sensible thing to want. Now one kind of update never lands. On another batch, an attention logit near 100,000 crosses the format's ceiling of 65,504, becomes infinity, and poisons the loss. The task and the code did not change. The number system did.

The payoff is real, and you should not walk away from it. A 16-bit tensor takes half the bytes of the same tensor in FP32, and supported GPU paths can accelerate 16-bit matrix multiplications. What it costs depends on which numbers you make smaller. Mixed precision is the practice of giving different operations and different stored state different formats, so you keep the speed and avoid the losses. By the end of this chapter you will know which number needs what, and how to catch the failures that do not announce themselves.

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

One detail at the small end: below the smallest normal value, a format has subnormal encodings that fade toward zero with less precision. FP16's smallest normal is about $6.10\times10^{-5}$, and its smallest subnormal is about $5.96\times10^{-8}$. Some hardware flushes subnormals to zero, and Cloud TPU does this for BF16.[^googleBfloat162026] A CPU cast tells you what the encoding allows. If tiny values matter to your run, test the kernel you will actually use.

## Look at a weight's neighbors

Back to the update that disappeared. A format can only store certain numbers, so any result gets rounded to its nearest stored neighbor. At 1.0, FP16's next value up is 1.0009765625 and its next value down is 0.99951171875. BF16's are 1.0078125 and 0.99609375. Notice that the gap below is half the gap above, because 1.0 is exactly where the ruler changes length.

To survive rounding, a change must be more than halfway to the next neighbor in its direction. Subtracting from 1.0, that means more than about $2.44\times10^{-4}$ in FP16 and $1.95\times10^{-3}$ in BF16. Our 0.0001 falls short in both, so both round straight back to 1.0. BF16 can store 0.0001 as a standalone number with no trouble at all. What it cannot do is add it to a weight near 1.0. This is called swamping, and it is the core reason you do not want to keep your weights in a low-precision format.

This runs without a GPU. The small BF16 helper rounds positive FP32 values to nearest-even by working on their bits directly, which is enough for this exercise.

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

formats = [("FP16", fp16), ("BF16", bf16_positive), ("FP32", fp32)]
for name, store in formats:
    print(f"{name}: {store(1.0 - 0.0001):.8f}")
assert fp16(0.9999) == bf16_positive(0.9999) == 1.0
assert fp32(0.9999) < 1.0
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

Machine epsilon, the gap above 1.0, is easy to misuse as a universal threshold. Spacing scales with magnitude, so a small weight can absorb a much smaller change, and even FP32 eventually loses small enough changes near a nonzero value. Higher precision gets you a bigger budget. It does not get you exact arithmetic.

The standard fix follows directly: compute low, update high. Keep the parameters and optimizer moments in FP32, and let eligible operations run in reduced precision. The optimizer writes small updates into a format that can hold them, and they accumulate until they are large enough to change the rounded copy the next forward pass uses. The original 2018 recipe kept an FP32 master copy beside an FP16 compute copy, and noted that master weights are not always necessary.[^micikevicius2018] With an FP32 model, PyTorch's automatic mixed precision (AMP) does this with no separate master copy, because the parameters themselves stay FP32.[^pytorchAmpDocs2026] This is why `model.half()` is a trap: it changes parameter storage along with compute, and that is the failure this section just walked through. Other designs exist. A 2025 study trained with BF16 state using stochastic rounding, so a small change survives with some probability, and it used temporary FP32 arithmetic for the update.[^ozkara2025StochasticRounding] Measure it yourself before you adopt it, and note that PyTorch's standard tools will not do it for you.

## Scale the gradient before it disappears

Resolution hurts when an update is small relative to a weight. Range hurts when a value cannot exist at all. Take a gradient of $1.2\times10^{-8}$. That is less than half FP16's smallest subnormal, so casting it to FP16 gives exactly zero, and no later multiplication can bring it back. BF16 keeps it, with some rounding.

FP16's trick is to move gradients up into range before they are computed. Multiply the loss by a scale $S$ before backpropagation, and the chain rule multiplies every gradient by the same factor:

$$
\widetilde{\mathcal L}=S\mathcal L,\qquad
\widetilde g=Sg.
$$

With $S=1024$, our tiny gradient becomes about $1.23\times10^{-5}$, which FP16 can store as a subnormal. When backward finishes, divide by $S$ in FP32, and you recover $1.20\times10^{-8}$ with very little error. Order matters here. Multiplying afterward does nothing, because 1,024 times zero is still zero. And scaling only helps the backward pass. If a forward activation already overflowed to infinity, no loss scale can repair that.

A fixed scale trades one failure for another. At $S=65536$, an ordinary gradient of 1.0 overflows. So PyTorch makes the scale a feedback loop. As of PyTorch 2.15, for one ordinary optimizer, it works like this:[^pytorchGradScalerV215]

1. Start with a large scale (65,536 by default) and a counter of clean steps at zero.
2. Backpropagate the scaled loss, then unscale the gradients.
3. If any gradient is infinite or NaN, skip the optimizer step entirely, halve the scale, and reset the counter.
4. Otherwise, step the optimizer and add one to the counter. After 2,000 clean steps in a row, double the scale and reset the counter.

"Skip entirely" means weights and Adam's moments stay untouched. You do not apply the finite gradients and drop the bad ones, because a partial update changes what the optimizer is doing. Here is the controller as plain arithmetic, with growth set to two clean steps so you can see it happen.

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
gradients = [("quiet", 0.02), ("spike", 100.0),
             ("quiet", 0.02), ("quiet", 0.02)]
for name, gradient in gradients:
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
    print(f"{name}: update={finite}, steps={optimizer_steps}, "
          f"next_scale={scale:.0f}")
assert optimizer_steps == 3 and scale == 1024
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
  <img src="illustrations/_generated/loss_scaling_feedback_loop_dark.png" alt="Top: a logarithmic axis with FP16's representable band. Scaling by 1024 moves a tiny gradient from outside the band to a subnormal inside it, moves a quiet gradient to about 20.5, and pushes a spike of 100 past 65504, where it becomes infinity. Bottom: a four-step trace. The scale stays 1024 after a quiet step, halves to 512 at the spike with the optimizer step skipped, and returns to 1024 after two clean steps. The optimizer step count reads 1, 1, 2, 3." />
  <figcaption>The top panel shows why the scale helps and where it hurts. The bottom panel shows the controller's response: at the spike the scale drops and the step count does not move.</figcaption>
</figure>

Two details bite people. With several optimizers, each makes its own skip decision, and one shared scale update follows. If your algorithm needs them to step or skip together, you must build that yourself.[^pytorchAmpExamples2026] Also, the scaler looks at gradients and never at the loss. An infinite additive term can make the loss invalid while leaving the gradient finite, and the scaler will step anyway. Check the loss yourself, before backward.

Dynamic scaling is an FP16 tool. BF16's range makes this particular underflow rare, so BF16 runs usually skip the scaler. Keep your own check for non-finite values if you do. `GradScaler(enabled=False)` also turns off skip detection, and bad data or an overly large learning rate can still produce NaNs in any format.

## One optimizer step, one unscale

The scaler has one logical unit, the optimizer step, and most bugs come from confusing it with something else.

Clipping is the classic. Suppose a true gradient norm is 0.02, well inside a `max_norm` of 1.0. If you clip while gradients are still scaled by 1,024, the clipper sees 20.48, panics, and divides by 20.48. After unscaling, your gradient is about 0.000977, cut by a factor of twenty for no reason at all. Every value stayed finite and nothing logged an error.

<!-- leetllm: test, id=reader-precision-clip-order, output=show, output_title="Reader clip order" -->
```python title="reader-precision-clip-order.py"
def clip(gradient, max_norm=1.0):
    return gradient * min(1.0, max_norm / abs(gradient))

true_gradient, scale = 0.02, 1024.0
unscale_then_clip = clip(true_gradient * scale / scale)
clip_then_unscale = clip(true_gradient * scale) / scale
print(f"unscale then clip: {unscale_then_clip:.6f}")
print(f"clip then unscale: {clip_then_unscale:.6f}")
assert clip_then_unscale < unscale_then_clip / 20
```

<!-- leetllm: output:start -->
```text title="Reader clip order" output compact
unscale then clip: 0.020000
clip then unscale: 0.000977
```
<!-- leetllm: output:end -->

Gradient accumulation is the other. When several micro-batches feed one update, the calls split by how often they should run:

| Call | Every micro-batch | Once per optimizer step |
| --- | --- | --- |
| `scaler.scale(loss).backward()` | Yes | |
| `scaler.unscale_(optimizer)` | | Yes, after the window closes |
| Clip gradients | | Yes |
| `scaler.step(optimizer)` | | Yes |
| `scaler.update()` | | Yes |

Keep one scale across the whole window, since gradients scaled by different factors cannot be untangled by one final division. A non-finite contribution from any micro-batch invalidates the whole step. Watch for a run of skipped steps in your telemetry. A job can "complete" having applied almost no updates, and it will look fine right up to the evaluation.

The token weighting from the last chapter still applies. Dividing each mean loss by the number of accumulation steps is only right if the micro-batches deserve equal weight. For a response-token objective, sum each micro-batch's token losses and divide by the whole window's token count, then let the scaler multiply that. And save `scaler.state_dict()` with your resume bundle. It is exactly the sort of state whose absence makes a resumed run quietly different.

## What autocast actually does

Autocast is operation-specific. It does not turn every tensor into 16-bit. On CUDA, eligible matrix multiplications use your chosen low precision while operations such as `cross_entropy` run in FP32.[^pytorchAmpDocs2026] Backward follows the dtypes of the matching forward operations, and an FP32 parameter's accumulated `.grad` is still FP32. So a real AMP run holds a mixture of dtypes, plus some cached conversions. When an adapter library or custom optimizer brings its own storage scheme, go and look at what it did. Keep `backward` outside the autocast region.

Even "FP32" is not one thing. PyTorch can use TF32 (TensorFloat-32), an NVIDIA hardware mode that reads only the first 10 fraction bits of FP32 inputs. As of PyTorch 2.15 it is off by default for matrix multiplications and on for convolutions. Separately, some 16-bit matrix multiplications use reduced-precision intermediate sums, which can overflow even when the final result would fit.[^pytorchNumericalAccuracy2026] Record those settings along with your dtypes, or you will not know what you are comparing.

## Mixed precision does not halve your memory

"Mixed precision cuts memory in half" is one of the most persistent slogans in the field, so let's do the count. Take $N$ parameters under the common recipe. FP32 weights take 4 bytes, FP32 gradients take 4, and Adam's two FP32 moments take 8. That is 16 bytes per parameter, the same as pure FP32. The master-copy recipe also reaches 16, from 2-byte weights, 2-byte gradients, a 4-byte master, and 8 bytes of moments. Equal totals, different copies. Add a full-size FP32 gradient staging buffer and that recipe becomes 20.

Activations are what actually shrink. Autograd keeps the intermediates it needs for backward, and those can shrink by half if they are stored in the smaller format. So here is an example budget, with 100 million parameters and 800 million saved activation values, all of which we choose to cast.

<!-- leetllm: test, id=reader-precision-memory, output=show, output_title="Reader memory budget" -->
```python title="reader-precision-memory.py"
parameters, activations = 100_000_000, 800_000_000
state = 16 * parameters / 1e9

totals = {}
for name, bytes_per_value in [("FP32", 4), ("16-bit", 2)]:
    saved = bytes_per_value * activations / 1e9
    totals[name] = state + saved
    print(f"{name}: state {state:.1f} GB + "
          f"activations {saved:.1f} GB = {totals[name]:.1f} GB")
reduction = 1 - totals["16-bit"] / totals["FP32"]
print(f"reduction: {reduction:.0%}")
assert round(reduction, 2) == 0.33
```

<!-- leetllm: output:start -->
```text title="Reader memory budget" output compact
FP32: state 1.6 GB + activations 3.2 GB = 4.8 GB
16-bit: state 1.6 GB + activations 1.6 GB = 3.2 GB
reduction: 33%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/mixed_precision_dtype_policy_dark.png" alt="A shared GB scale compares equal model-state inventories and a chosen set of eight hundred million activation values. Activations shrink by half, and the combined modeled total falls by one third. Gradient communication payload is shown separately." />
  <figcaption>Compare bar lengths on the shared scale. Only the activation segment shrinks, so the total falls by a third. The gradient bars show a separate cost, the bytes one tensor sends between GPUs.</figcaption>
</figure>

Your own number will be different, and you should measure it. Activation memory has terms that grow with batch, sequence length, width, and layers, and materialized attention adds a quadratic term in sequence length, so no fixed percentage follows from the model family.[^korthikanti2022] Measure peak allocated and reserved device memory across complete warm steps, including the optimizer and checkpoint phases. The 2018 paper's roughly halved memory assumed FP16 weights, activations, and gradients, with activations dominating the total.[^micikevicius2018]

Communication has a dtype too. A tensor of 100 million FP32 gradient values is 400 MB to reduce, and in BF16 it is 200 MB, before protocol overhead. Actual traffic depends on the collective algorithm, worker count, and topology. Compute can be BF16 while gradients still travel as FP32. PyTorch's FSDP `MixedPrecision` config exposes these separately as `param_dtype` and `reduce_dtype`, so `mixed_precision=true` is not a sufficient line in a run record.[^pytorchFsdpDocs2025] Log the compute dtype, the update storage dtype, and the reduction dtype. The supervised fine-tuning chapter introduced sharding, and the distributed-training tutorial at leetllm.com covers it in depth.

## Choose with a controlled comparison

Now you can run the experiment properly. Start from a working higher-precision baseline. Hold the model, data, objective, scored-token budget, and evaluation fixed, change only the precision, and write down what you actually ran: hardware and driver versions, PyTorch and kernel versions, all three dtypes, and the batch shape.

Reject before you rank. A candidate that fails your format or task gates, that changed hardware along the way, or that has invalid metrics does not get compared on speed, however good its throughput looks. Among the survivors, time warmed-up steps with proper device synchronization, because CUDA launches are asynchronous and a naive timer measures almost nothing.[^pytorchCudaSemantics2026] Compare complete iterations, including the data loader and optimizer. A matrix-multiply benchmark leaves out everything that might eat your gain, including skipped steps.

My default for an ordinary fine-tune is BF16 compute with FP32 update state on hardware that supports it, because you skip a whole class of scaling problems. Reinforcement-learning fine-tuning, which the [alignment chapter](/learn/rlhf-dpo-aligning-language-models) covers, is a case where that default can be wrong. There, one copy of the model writes sample answers and a separate training path recomputes their probabilities. The two need to agree, and BF16's coarse spacing can round nearby logits to different sides of a tick. Qi and colleagues report that FP16 reduced this train-inference mismatch and improved optimization in the tasks, algorithms, and frameworks they tested.[^qi2025fp16mismatch] Test it for your own stack by comparing logits on matched prompts, and remember that scaled FP16 still has all of its own requirements.

What about 8-bit? The two standard FP8 encodings are E4M3, which tops out at 448 and has no infinity, and E5M2, which reaches 57,344.[^ocp2023ofp8] NVIDIA's hybrid recipe uses the first going forward and the second for gradients, with scaling factors that become part of your training setup.[^nvidiaTransformerEngine2026] Under saturating conversion an E4M3 overflow lands on 448, which is finite and wrong, so the failure is quieter still. Under non-saturating conversion it becomes NaN.[^ocp2023ofp8] Leave FP8 out of a proposal until you have measured BF16 or scaled FP16 under the same comparison.

## When a precision change goes wrong

A precision failure usually points at a value that crossed a limit. Start from the symptom:

- **Loss flatlines while every gradient is finite.** Parameters may be stored in a 16-bit format, so updates are being swamped. Check the actual parameter dtype.
- **FP16 trains but lags the FP32 baseline.** Small unscaled gradients may be underflowing to zero. Use the scaler, then compare on the same held-out metric.
- **Training turns erratic under FP16.** Look for clipping before `unscale_`.
- **The effective batch collapses.** `step` and `update` are probably running inside the accumulation window.
- **The scale keeps falling.** Persistent backoff means the values themselves are too large, and a forward overflow will not be cured by a smaller scale. Find the operation that overflows.
- **"Half memory" planning falls short.** Only activation dtypes changed. Pull a per-component memory profile.
- **Bandwidth did not improve.** Your reduction dtype may still be FP32.

```checkpoint
What is the smallest amount you can subtract from 2.0 in FP16 and see the stored value change?
---
Just below 2.0 you are on the ruler that runs from 1 to 2, where neighbors sit $2^{-10} \approx 9.77\times10^{-4}$ apart. A change must be more than halfway to the next neighbor, so you need a little more than $2^{-11} \approx 4.88\times10^{-4}$. Subtract exactly $2^{-11}$ and you land on a tie, which rounds back to 2.0.
```

## Where this leaves you

You can now look at any tensor in a training run and ask the right question: does this number need range, does it need resolution, and where does a conversion throw something away? You know why updates go to FP32, why the scale must enter before backward and leave before clipping, and why you should budget memory by component rather than by slogan.

So far, though, every weight in the model has been trainable, and at large scale that memory bill quickly outgrows a single GPU. A 65-billion-parameter model carries hundreds of gigabytes of full training state no matter how carefully you choose its formats. Next, [Distributed Training: FSDP & ZeRO](/learn/distributed-training-fsdp-deepspeed-zero) shows how multi-GPU sharding partitions those surviving FP32 weights, gradients, and optimizer states across ranks; afterward, [LoRA](/learn/lora-parameter-efficient-fine-tuning) takes a complementary route by freezing the base weights and learning small low-rank updates, where all of these dtype choices apply again across the base, adapters, and optimizer state.

<!-- leetllm: edition:reader:end -->
