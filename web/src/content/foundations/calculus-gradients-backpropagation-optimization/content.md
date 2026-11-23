---
{
  "id": "calculus-gradients-backpropagation-optimization",
  "title": "Gradients and Backprop",
  "slug": "calculus-gradients-backpropagation-optimization",
  "section": "Math & Statistics",
  "category": "Fine-Tuning & Training",
  "difficulty": "Easy",
  "order": 1,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Train a one-weight latency predictor by reading a slope, taking a downhill step, tracing chain-rule paths, and checking the same gradient in PyTorch.",
  "keyConceptsTested": [
    "loss as a training signal",
    "finite-difference slope checks",
    "derivatives and partial derivatives",
    "gradient descent updates",
    "chain rule and backpropagation",
    "gradient accumulation across shared paths",
    "gradient checking",
    "vector-Jacobian products and backward seeds",
    "feature scale and optimization conditioning",
    "PyTorch automatic differentiation and gradient reset"
  ],
  "prerequisites": [
    "numpy-and-tensor-shapes"
  ]
}
---
<!-- leetllm: edition:reference:start -->

A request takes 5 seconds, but a model predicts 6. The model's rule is simple: multiply the number of 100-token blocks by an adjustable number. For this 200-token request, that number is currently 3. Should we increase it or decrease it to make a better prediction?

The [NumPy lesson](/learn/numpy-and-tensor-shapes) taught how to organize and calculate with model inputs. Training adds another step: use a prediction's error to decide how the model's stored numbers should change. Start with one number so you can trace the whole update by hand.

## A model with one adjustable number

A **parameter** is a stored number a model adjusts as it learns from data. Start with a single parameter, `w`: predicted response seconds per 100 input <span data-glossary="token">tokens</span>. Tokens are the text chunks processed by a language model. This latency predictor is intentionally stripped down so you can trace every moving piece without getting lost in tensor bookkeeping.

For one completed request:

| Quantity | Meaning | Value |
|---|---|---:|
| `x` | prompt length in hundreds of tokens | `2.0` |
| `y` | observed response seconds | `5.0` |
| `w` | current seconds-per-100-token-block parameter | `3.0` |
| `prediction = w * x` | model estimate | `6.0` |
| `loss = (prediction - y)²` | penalty for being wrong | `1.0` |

The **loss** measures prediction error with one number. Squaring makes both a one-second overestimate and a one-second underestimate cost `1`; an error of two seconds costs `4`. Zero means a perfect prediction for this row. This squared-error loss has squared-seconds units. Lowering it improves our latency predictions; measuring service response time still requires the serving system.

Run the cell and examine its two printed values. From the table, the rule predicts `3 * 2 = 6`, so the error is one second.

<!-- leetllm: test, output=show -->
```python title="one-parameter-loss.py"
def squared_loss(weight: float, token_blocks: float, actual_seconds: float) -> float:
    prediction = weight * token_blocks
    return (prediction - actual_seconds) ** 2

w = 3.0
x = 2.0
y = 5.0
prediction = w * x
loss = squared_loss(w, x, y)

print("prediction_seconds", prediction)
print("loss", loss)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prediction_seconds 6.0
loss 1.0
```
<!-- leetllm: output:end -->

That code scores a model, but it doesn't yet learn. The loss tells us how wrong its prediction is; the next question is directional: should `w` go up or down?

## Read a slope by nudging one weight

Change only `w` by a tiny amount and recompute the loss. Because the current prediction is already too high, an upward nudge makes the miss worse:

| Weight | Prediction | Loss | What changed? |
|---:|---:|---:|---|
| `3.000` | `6.000` | `1.000000` | starting point |
| `3.001` | `6.002` | `1.004004` | weight moved upward |

Loss increased by `0.004004` when the weight increased by `0.001`. Divide the change in loss by the change in weight:

$$
\text{slope estimate} = \frac{1.004004 - 1.000000}{0.001} = 4.004
$$

A positive slope means increasing `w` makes loss worse near this point. To lower the loss, move `w` down. The sign gives a direction; the size estimates the change in loss *per unit change in weight*. Check that ratio with the same nudge in Python:

<!-- leetllm: test, output=show -->
```python title="finite-difference-nudge.py"
def loss(weight: float) -> float:
    return (weight * 2.0 - 5.0) ** 2

w = 3.0
eps = 0.001
slope_estimate = (loss(w + eps) - loss(w)) / eps

print("loss_before", loss(w))
print("loss_after_nudge", loss(w + eps))
print("slope_estimate", round(slope_estimate, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss_before 1.0
loss_after_nudge 1.0040039999999995
slope_estimate 4.004
```
<!-- leetllm: output:end -->

This is a **finite difference**, a practical approximation to a derivative. A **forward evaluation** means running the prediction and loss calculation at chosen parameters. A one-sided check needs a new evaluation for each parameter you nudge; a centered check needs two. That becomes expensive for large models, but it's useful for checking a small formula.

## The derivative gives the exact local slope

The nudge estimated `4.004`. What would remain if we made the nudge smaller and smaller? A **derivative** is the slope that the difference ratio approaches, when that limit exists.[^openstaxDerivative2016] At our current `w = 3`, a nudge of size `h` gives prediction `6 + 2h`, error `1 + 2h`, and loss `(1 + 2h)²`. Expand the square and divide the loss change by `h`:

$$
\frac{(1 + 2h)^2 - 1}{h} = \frac{4h + 4h^2}{h} = 4 + 4h \qquad (h \ne 0)
$$

For `h = 0.001`, this is `4.004`, exactly the estimate above. As `h` approaches zero, `4h` vanishes and the slope approaches `4`. We never divide by zero; we ask what the ratio approaches for nonzero nudges.

Now write a rule that works at other weights too. Let `L` name the loss:

$$
L(w) = (2w - 5)^2
$$

For any error `e`, the same expansion gives `((e + h)² - e²) / h = 2e + h`, which approaches `2e`. That's why the derivative of a square is twice its input. Our error is `e = 2w - 5`, which changes twice as fast as `w`. Multiply those two sensitivities:

$$
\frac{dL}{dw} = 2(2w - 5) \times 2
$$

Read `dL/dw` as "the derivative of loss with respect to weight." Differentiating the square gives the first factor. The final `2` comes from the prediction `2w`: changing `w` by a small amount changes the prediction by twice that amount. This multiplication is the **chain rule**: combine sensitivities along a sequence of dependent calculations.[^openstaxChainRule2016]

At `w = 3`:

$$
\frac{dL}{dw} = 2(6 - 5) \times 2 = 4
$$

The finite-difference estimate was `4.004`; the derivative is exactly `4` at this point. Check it by comparing losses on both sides of `w`. The two weights are `2 * eps` apart, so divide by that distance:

<!-- leetllm: test, output=show -->
```python title="analytical-versus-numerical-slope.py"
def loss(weight: float) -> float:
    return (weight * 2.0 - 5.0) ** 2

def analytical_gradient(weight: float) -> float:
    prediction = weight * 2.0
    return 2 * (prediction - 5.0) * 2.0

w = 3.0
eps = 1e-5
centered = (loss(w + eps) - loss(w - eps)) / (2 * eps)
exact = analytical_gradient(w)

print("analytical_gradient", exact)
print("finite_difference", round(centered, 6))
print("agree", abs(centered - exact) < 1e-6)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
analytical_gradient 4.0
finite_difference 4.0
agree True
```
<!-- leetllm: output:end -->

A **centered finite difference** uses the losses at `w + eps` and `w - eps`. For this quadratic, the extra nudge terms cancel exactly in real arithmetic; the remaining discrepancy comes from floating-point rounding. For general smooth functions, it usually reduces approximation error compared with the same-sized one-sided nudge.

## Gradient descent takes a downhill step

With one parameter, the derivative is the one-entry <span data-glossary="gradient">gradient</span>. Its sign tells whether increasing `w` raises or lowers loss locally. **Gradient descent** moves opposite that slope. A <span data-glossary="learning-rate">learning rate</span> is the number we choose to scale the update.

Here the slope is positive. Adding the slope would move right, toward higher loss, so the update must subtract it.

$$
w_{\text{new}} = w - \text{learning rate} \times \frac{dL}{dw}
$$

With `w = 3`, derivative `4`, and learning rate `0.1`:

$$
w_{\text{new}} = 3 - 0.1 \times 4 = 2.6
$$

Now the prediction is `2.6 * 2 = 5.2`, and loss is `(5.2 - 5)² = 0.04`. One update reduced the loss from `1.0` to `0.04`. Repeat the calculation, recomputing the slope at the new weight each time. Each printed row shows the state *before* its update:

<!-- leetllm: test, output=show -->
```python title="repeat-gradient-descent.py"
w = 3.0
x = 2.0
y = 5.0
learning_rate = 0.1

print("step weight prediction loss gradient")
for step in range(5):
    prediction = w * x
    loss = (prediction - y) ** 2
    gradient = 2 * (prediction - y) * x
    print(step, round(w, 4), round(prediction, 4), round(loss, 6), round(gradient, 4))
    w = w - learning_rate * gradient
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step weight prediction loss gradient
0 3.0 6.0 1.0 4.0
1 2.6 5.2 0.04 0.8
2 2.52 5.04 0.0016 0.16
3 2.504 5.008 6.4e-05 0.032
4 2.5008 5.0016 3e-06 0.0064
```
<!-- leetllm: output:end -->

Read down the rows rather than only the final weight. Each update lowers the loss, and the gradient shrinks as `w` approaches `2.5`. At that weight, the prediction is exactly `5`, loss is zero, and the slope is zero. This is a minimum because squared loss can't be negative. In other functions, a zero derivative alone doesn't prove you've found a minimum.

```checkpoint
At `w = 3`, the derivative is positive `4`. Why does the update subtract it?
---
A positive derivative says that increasing `w` raises loss locally. Subtracting it moves `w` downward, from `3.0` to `2.6`, and lowers this row's loss from `1.0` to `0.04`.
```

The slope is local. It doesn't tell you how far to walk.

## A correct gradient can still take a bad step

Calculus gives the downhill direction, not a safe learning rate.

Keep the starting point and gradient fixed, then change only the learning rate. With a rate ten times larger, the step follows the same downhill direction, but travels much farther:

From the same starting point, a learning rate of `1.0` produces:

$$
w_{\text{new}} = 3 - 1.0 \times 4 = -1
$$

The new prediction is `-2` seconds and loss becomes `(-2 - 5)² = 49`. The derivative was right; the step jumped straight past the good region.

<!-- leetllm: test, output=show -->
```python title="learning-rate-overshoot.py"
def one_step(learning_rate: float) -> tuple[float, float]:
    w, x, y = 3.0, 2.0, 5.0
    prediction = w * x
    gradient = 2 * (prediction - y) * x
    updated_w = w - learning_rate * gradient
    updated_loss = (updated_w * x - y) ** 2
    return updated_w, updated_loss

for lr in (0.1, 0.125, 1.0):
    updated_w, updated_loss = one_step(lr)
    print("lr", lr, "new_w", updated_w, "new_loss", round(updated_loss, 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
lr 0.1 new_w 2.6 new_loss 0.04
lr 0.125 new_w 2.5 new_loss 0.0
lr 1.0 new_w -1.0 new_loss 49.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/optimizer_control_loop_dark.png" alt="Three updates on L(w) = (2w - 5)^2 from w = 3, loss 1, and gradient 4. Learning rate 0.1 gives w = 2.6 and loss 0.04. Rate 0.125 gives w = 2.5 and loss 0. Rate 1 gives w = -1 and loss 49. The dashed tangent has slope 4 at the starting point." />
  <figcaption>Each arrow starts at w = 3 and uses the same gradient, 4. Rate 0.1 takes a small downhill step; 0.125 reaches this quadratic's exact minimum; 1 overshoots and increases the loss to 49. Other models need learning rates chosen for their own loss geometry.</figcaption>
</figure>

Why `0.125`? The minimum is `0.5` weight units below the start, so the required step satisfies `learning_rate * 4 = 0.5`. Try `0.25` in the cell: it moves to `w = 2`, where loss is back to `1`. The derivative gives the local downhill direction; this finite step overshoots the minimum and fails to lower the starting loss.

For this quadratic, we can say exactly which fixed rates converge. Since the derivative is `8(w - 2.5)`, subtracting a step gives

$$
w_{\text{new}} - 2.5 = (1 - 8\eta)(w - 2.5).
$$

Here $\eta$ names the learning rate. Distance from the minimum shrinks when $|1-8\eta|<1$, which means `0 < eta < 0.25`. At `0.1`, distance shrinks by a factor of `0.2` and loss by `0.2² = 0.04` each update. At `0.25`, the weight oscillates between `3` and `2`; a larger positive rate makes that distance grow. These statements use this exact quadratic, fixed inputs, and exact arithmetic. They aren't a convergence guarantee for a neural network.

Even changing units changes the safe rate. Counting raw tokens instead of 100-token blocks replaces `x = 2, w = 3` with `x = 200, w = 0.03`, preserving the prediction `6`. The derivative becomes `400`. Each update multiplies the signed displacement from the minimum by `1 - 80000*eta` and the distance by `abs(1 - 80000*eta)`. The stable interval is now `0 < eta < 0.000025`, ten thousand times smaller. Reusing the old learning rate after a feature-scale change can destabilize the same prediction rule.

In a real training loop, treat a non-finite loss such as `NaN` or infinity as a diagnosis signal. It can come from an unstable step or invalid input. Adaptive <span data-glossary="optimizer">optimizers</span> and schedules change how a gradient is used across many steps. They still need a backward calculation you can trust.

One weight was enough to see a downhill step. A latency model still needs to separate prompt work from queue delay.

## Two weights, two slopes

The same request has one second of recorded queue delay. Add a second parameter to scale that delay, and reset the two weights to `[2, 2]`. The prediction is `2 * 2 + 2 * 1 = 6`, still one second too high. In notation, let `x_p` count prompt blocks, `x_q` record queue seconds, and put a hat on `y` to distinguish the prediction from the observed time:

$$
\hat{y} = w_p x_p + w_q x_q
$$

Here `w_p` has units of seconds per prompt block, while `w_q` is a unitless multiplier on queue seconds. The feature values are `2` and `1`, so in these chosen units the same loss signal produces a prompt slope twice as large. A larger numerical gradient doesn't by itself mean a more important feature: changing the feature's units changes its gradient.

| Value | Number |
|---|---:|
| prompt blocks `x_p` | `2` |
| queue delay `x_q` | `1` |
| current weights `[w_p, w_q]` | `[2, 2]` |
| prediction | `2*2 + 2*1 = 6` |
| actual seconds | `5` |
| error | `1` |
| squared loss | `1` |

A **partial derivative** measures sensitivity to one parameter while holding the others fixed. The symbol `∂` replaces `d` to show that the loss has several adjustable inputs:

$$
\frac{\partial L}{\partial w_p} = 2(\hat{y} - y)x_p = 2 \times 1 \times 2 = 4
$$

$$
\frac{\partial L}{\partial w_q} = 2(\hat{y} - y)x_q = 2 \times 1 \times 1 = 2
$$

Collect those slopes in parameter order and you have the **gradient**: `[4, 2]`. This ordered list is a <span data-glossary="vector">vector</span>; no extra machinery is needed yet. Apply the same update rule separately to each weight:

<!-- leetllm: test, output=show -->
```python title="two-parameter-gradient.py"
x_prompt = 2.0
x_queue = 1.0
w_prompt = 2.0
w_queue = 2.0
actual_seconds = 5.0

prediction = w_prompt * x_prompt + w_queue * x_queue
error = prediction - actual_seconds
grad_prompt = 2 * error * x_prompt
grad_queue = 2 * error * x_queue
updated_prompt = w_prompt - 0.1 * grad_prompt
updated_queue = w_queue - 0.1 * grad_queue
new_loss = (updated_prompt * x_prompt + updated_queue * x_queue - actual_seconds) ** 2

print("prediction", prediction)
print("gradient", [grad_prompt, grad_queue])
print("updated_weights", [updated_prompt, updated_queue])
print("new_loss", new_loss)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prediction 6.0
gradient [4.0, 2.0]
updated_weights [1.6, 1.8]
new_loss 0.0
```
<!-- leetllm: output:end -->

For this row and learning rate, the update lands exactly on the target. But `[2, 1]` and `[1.5, 2]` would both predict `5` too. One row can't tell us how much prompt length and queue delay should each contribute across future requests. We'll need more rows after we've checked how these two slopes were calculated.

You just calculated two slopes separately. Backpropagation traces both from the loss, one step at a time.

## Backpropagation is chain-rule bookkeeping

The two-parameter gradient came from a chain of small operations:

1. Predict: `prediction = w_p * x_p + w_q * x_q`
2. Subtract target: `error = prediction - y`
3. Square error: `loss = error ** 2`

During the forward pass, these operations produce `prediction = 6`, `error = 1`, and `loss = 1`. Now predict the first signal sent backward: differentiating `error²` should give `2 * error = 2`. Start at the scalar loss and move backward:

| Local step | Derivative | Value |
|---|---|---:|
| `loss = error²` | `d loss / d error = 2 * error` | `2` |
| `error = prediction - y` | `d error / d prediction` | `1` |
| `prediction = w_p*x_p + w_q*x_q` | `d prediction / d w_p = x_p` | `2` |
| same prediction | `d prediction / d w_q = x_q` | `1` |

Multiply local factors along each path. Prompt length gets `2 * 1 * 2 = 4`; queue delay gets `2 * 1 * 1 = 2`. The route tells you which feature scales each parameter's correction. At the loss itself, start with `dL/dL = 1`: a unit change in loss changes loss by one unit.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Dual-pass autograd execution: The forward pass computes activations from left to right: features x_p = 2.0 and x_q = 1.0 with weights w_p = 2.0 and w_q = 2.0 produce prediction 6.0, residual error 1.0, and loss 1.0. The backward pass propagates adjoints in reverse from right to left: loss seed 1.0 scales through error adjoint 2.0 and prediction adjoint 2.0 to yield weight gradients dL/dw_p = 4.0 and dL/dw_q = 2.0." />
  <figcaption>The forward pass keeps the values needed by the backward rules. Starting at dL/dL = 1, the backward pass multiplies local derivatives along each route: 1 × 2 × 1 × 2 = 4 for the prompt weight and 1 × 2 × 1 × 1 = 2 for the queue weight.</figcaption>
</figure>

<span data-glossary="backpropagation">Backpropagation</span> is that reverse walk through the computation. Operations retain the forward values their backward rules need, then multiply the arriving signal by a local derivative. Rumelhart, Hinton, and Williams used back-propagated error derivatives to learn internal representations in multilayer networks in their 1986 Nature paper.[^rumelhart1986] The explicit calculation below keeps each factor visible:

<!-- leetllm: test, output=show -->
```python title="trace-chain-rule-factors.py"
x_prompt = 2.0
x_queue = 1.0
w_prompt = 2.0
w_queue = 2.0
actual = 5.0

prediction = w_prompt * x_prompt + w_queue * x_queue
error = prediction - actual
loss = error ** 2

d_loss_d_error = 2 * error
d_error_d_prediction = 1.0
d_prediction_d_prompt_weight = x_prompt
d_prediction_d_queue_weight = x_queue

d_loss_d_prompt_weight = d_loss_d_error * d_error_d_prediction * d_prediction_d_prompt_weight
d_loss_d_queue_weight = d_loss_d_error * d_error_d_prediction * d_prediction_d_queue_weight

print("forward", prediction, error, loss)
print("prompt_path", d_loss_d_error, "*", d_prediction_d_prompt_weight, "=", d_loss_d_prompt_weight)
print("queue_path", d_loss_d_error, "*", d_prediction_d_queue_weight, "=", d_loss_d_queue_weight)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
forward 6.0 1.0 1.0
prompt_path 2.0 * 2.0 = 4.0
queue_path 2.0 * 1.0 = 2.0
```
<!-- leetllm: output:end -->

The same bookkeeping works when another operation sits between a weight and the loss. So far, each predicted term changes proportionally with its weight. A **nonlinear** operation behaves differently across parts of its input range.

For example, wrap the prompt term in **ReLU** (rectified linear unit), `max(0, h)`. It passes a positive input and returns zero for a negative input. Name the value before ReLU `h` and the value after it `z`:

$$
h = w_p x_p,\quad z = \mathrm{ReLU}(h),\quad \hat{y} = z + w_q x_q,\quad L = (\hat{y} - y)^2
$$

ReLU's local derivative is `1` when `h > 0`: a small increase passes through unchanged. It's `0` when `h < 0`: a small increase still leaves the output at zero. At `h = 0`, the left and right slopes disagree, so there's no ordinary derivative. This code uses a backward value of `0` at the corner, matching PyTorch's convention.[^pytorch2026autograd]

Keep the same latency row, with `w_p = 2` so `h = 4` stays positive. The ReLU is a pass-through, and the prompt weight still receives `4`.

Now flip the prompt weight to `-0.5`. Then `h` goes negative, ReLU outputs `0` seconds from the prompt path, and that weight gets no update:

<!-- leetllm: test, output=show -->
```python title="relu-chain-backprop.py"
x_prompt = 2.0
x_queue = 1.0
w_queue = 2.0
actual = 5.0

def relu(pre_activation: float) -> float:
    return max(0.0, pre_activation)

w_prompt = 2.0
h = w_prompt * x_prompt
z = relu(h)
prediction = z + w_queue * x_queue
error = prediction - actual
loss = error ** 2
d_loss_d_prediction = 2 * error
d_z_d_h = 1.0 if h > 0 else 0.0
d_loss_d_w_prompt = d_loss_d_prediction * d_z_d_h * x_prompt

print("forward", h, z, prediction, loss)
print("dL_dw_prompt", d_loss_d_w_prompt)

w_prompt_off = -0.5
h_off = w_prompt_off * x_prompt
z_off = relu(h_off)
prediction_off = z_off + w_queue * x_queue
d_z_d_h_off = 1.0 if h_off > 0 else 0.0
d_loss_d_w_prompt_off = (2 * (prediction_off - actual)) * d_z_d_h_off * x_prompt
print("relu_off", h_off, z_off, prediction_off, d_loss_d_w_prompt_off)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
forward 4.0 4.0 6.0 1.0
dL_dw_prompt 4.0
relu_off -1.0 0.0 2.0 -0.0
```
<!-- leetllm: output:end -->

The printed `-0.0` compares equal to zero; its sign comes from multiplying a negative loss signal by zero. Later deep-learning lessons stack many such local factors. The rule stays the same: store needed forward values and multiply local derivatives on the way back.

The corner needs a different check. Set `w_prompt = 0` in this same row. Then `L(w) = (ReLU(2w) - 3)²`: on the negative side, loss stays `9`; on the positive side, it is `(2w - 3)²`. The left derivative is `0`, while the right derivative is `-12`. A centered difference mixes the two sides and approaches `-6`, although PyTorch's backward rule returns `0` at the corner:

<!-- leetllm: test, deps=torch, output=show -->
```python title="relu-corner-gradient-check.py"
import torch

def loss(weight: float) -> float:
    return (max(0.0, 2 * weight) - 3) ** 2

eps = 1e-6
left = (loss(0.0) - loss(-eps)) / eps
right = (loss(eps) - loss(0.0)) / eps
centered = (loss(eps) - loss(-eps)) / (2 * eps)
w = torch.tensor(0.0, dtype=torch.float64, requires_grad=True)
torch_loss = (torch.relu(2 * w) - 3) ** 2
torch_loss.backward()

print("one_sided", round(left, 4), round(right, 4))
print("centered", round(centered, 4))
print("autograd", float(w.grad))
assert float(w.grad) == 0.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
one_sided 0.0 -12.0
centered -6.0
autograd 0.0
```
<!-- leetllm: output:end -->

This disagreement doesn't identify a backward bug: no ordinary derivative exists at this point. Nor does the zero returned by autograd prove a minimum. A small positive weight lowers loss. Check smooth points on each side to test the local rules, and treat the corner's backward value as the operation's convention.[^pytorch2026autograd][^pytorch2026gradcheckapi]

```checkpoint
In `ŷ = ReLU(w_p x_p) + w_q x_q` with squared loss, what happens to `∂L/∂w_p` when `h = w_p x_p` is negative?
---
It becomes zero for that example because ReLU's local derivative is zero. The upstream loss signal is multiplied by that zero before it reaches `w_p`.
```

## When paths meet, add their signals

The example above sends the loss signal to two different parameters. A computation graph can also use the same parameter more than once. Changing a shared parameter changes both paths, so their contributions to the loss must add.

For this example only, tie the two numerical coefficients to one stored value `w`. Treat the inputs as normalized numbers: `x_p` is prompt length divided by 100 tokens, `x_q` is queue time divided by one second, and the output is measured in seconds. Both inputs are then unitless, so a shared seconds-valued coefficient is consistent:

$$
\hat{y} = w x_p + w x_q
$$

With `w = 2`, `x_p = 2`, `x_q = 1`, and `y = 5`, prediction is `6` and error is `1`. The prompt path contributes `2 * 1 * 2 = 4`; the queue path contributes `2 * 1 * 1 = 2`. Both paths reach `w`, so its gradient is `4 + 2 = 6`.

You can also combine the forward terms first: `w * 2 + w * 1 = w * 3`. Its local derivative is `3`, so the complete derivative is `2 * error * 3 = 6`. The two routes agree. Verify the separate contributions in code:

<!-- leetllm: test, output=show -->
```python title="sum-shared-parameter-paths.py"
w = 2.0
x_prompt = 2.0
x_queue = 1.0
actual = 5.0

prediction = w * x_prompt + w * x_queue
error = prediction - actual
prompt_path = 2 * error * x_prompt
queue_path = 2 * error * x_queue
gradient = prompt_path + queue_path

print("prediction", prediction)
print("path_contributions", [prompt_path, queue_path])
print("shared_weight_gradient", gradient)
assert gradient == 6.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
prediction 6.0
path_contributions [4.0, 2.0]
shared_weight_gradient 6.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/chain_rule_graph_dark.png" alt="Multi-variable chain rule graph accumulation: Loss L = 1.0 propagates backward through residual error e = 1.0 (sensitivity 2.0) to prediction ŷ = 6.0 (adjoint 2.0). From the prediction, two separate branches evaluate: prompt path contributes (2.0) * (2.0) = 4.0, while queue path contributes (2.0) * (1.0) = 2.0. Both branches converge at the shared parameter w = 2.0, where their sensitivities accumulate: dL/dw = 4.0 + 2.0 = 6.0." />
  <figcaption>When a single parameter feeds multiple calculation paths, the total derivative is the sum of path contributions. Both branches receive the upstream adjoint 2.0 from ŷ. The prompt path contributes 2.0 × 2.0 = 4.0, the queue path contributes 2.0 × 1.0 = 2.0, and the accumulator at w adds them to yield 6.0.</figcaption>
</figure>

Real models repeat this pattern across rows and token positions, and their computation graphs can have many branches. We'll keep the arithmetic visible with four requests next, adding the row contributions and dividing by four because we chose mean squared error.

## Four completed requests

Return to two independent weights and use four completed requests. Each row has prompt length and queue delay, and the target is observed response seconds. These are constructed data: targets follow the rule `2 * prompt_blocks + queue_seconds` exactly.

| Request | Prompt blocks | Queue seconds | Observed seconds |
|---|---:|---:|---:|
| 0 | 1 | 0.5 | 2.5 |
| 1 | 2 | 1 | 5 |
| 2 | 3 | 0.5 | 6.5 |
| 3 | 4 | 2 | 10 |

Use the **mean squared error**: compute each row's squared error, add them, then divide by four. Its gradient follows the same pattern. Compute `2 * error * feature` for each row, add the contributions for each weight, and divide by four.

At initial weights `[0, 0]`, all predictions are zero. The prompt-weight contributions are `[-5, -20, -39, -80]`, whose mean is `-36`. The queue-weight contributions are `[-2.5, -10, -6.5, -40]`, whose mean is `-14.75`. With learning rate `0.03`, the first updated weights must be `[1.08, 0.4425]`.

In <span data-glossary="numpy-array">NumPy</span>, store the four rows as `X` with shape `(4, 2)`. From the earlier array lesson, `X @ weights` multiplies each row's two features by the corresponding weights and adds them, giving four predictions. The gradient below uses explicit feature columns, so you can match it to the arithmetic above:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="train-latency-predictor.py"
import numpy as np

X = np.array([
    [1.0, 0.5],
    [2.0, 1.0],
    [3.0, 0.5],
    [4.0, 2.0],
])
y = np.array([2.5, 5.0, 6.5, 10.0])
weights = np.array([0.0, 0.0])
learning_rate = 0.03

print("step loss weights")
for step in range(101):
    predictions = X @ weights
    errors = predictions - y
    loss = float(np.mean(errors ** 2))
    gradient = np.array([
        np.mean(2 * errors * X[:, 0]),
        np.mean(2 * errors * X[:, 1]),
    ])
    if not np.isfinite(loss) or not np.all(np.isfinite(gradient)):
        raise FloatingPointError("non-finite loss or gradient")
    if step in (0, 1, 10, 100):
        print(step, round(loss, 6), np.round(weights, 4).tolist())
    weights = weights - learning_rate * gradient

print("learned_weights", np.round(weights, 4).tolist())
print("final_predictions", np.round(X @ weights, 3).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step loss weights
0 43.375 [0.0, 0.0]
1 9.852759 [1.08, 0.4425]
10 0.003643 [2.0574, 0.8557]
100 0.000709 [2.0259, 0.9364]
learned_weights [2.0257, 0.937]
final_predictions [2.494, 4.988, 6.546, 9.977]
```
<!-- leetllm: output:end -->

The known weights are `[2, 1]`, and 101 updates stop near that solution. The loss falls quickly at first, then more slowly. A fixed iteration count sets the stopping point; inspect the loss and gradient to judge whether optimization has settled. Evaluate unseen requests to assess how well the rule predicts beyond these four training rows.

Why does the last part take longer? Prompt length and queue delay often increase together in this table, so changes to the two weights can partly cancel. Compare two offsets from the exact solution. Both change the weights by the same absolute amounts, but one produces much smaller errors:

| Offset from `[2, 1]` | Prediction errors on rows 0–3 | Mean squared loss |
|---|---|---:|
| `[+0.1, -0.25]` | `[-0.025, -0.050, +0.175, -0.100]` | `0.0109375` |
| `[+0.1, +0.25]` | `[+0.225, +0.450, +0.425, +0.900]` | `0.3109375` |

The loss is flatter along some directions than others. This is the optimization issue called **conditioning**: a step size that avoids overshooting a steep direction can make slow progress along a flatter one. In this quadratic, the late weight error lies mostly along a flatter direction. Feature scaling changes this geometry, but it doesn't remove every correlation between columns. Later linear algebra will quantify it; here the two error lists show the mechanism without another optimizer.[^boyd2004convex]

You'll often see the two column means written compactly as `(2 / len(X)) * (X.T @ errors)`. Here `X.T` has shape `(2, 4)`: each row now holds one feature's values across the four requests. Multiplying by the four errors adds feature-weighted errors, then `2 / len(X)` supplies the square's factor and the mean. Both versions compute the same two slopes; the next linear-algebra lessons develop that notation further.

A finite-value guard doesn't make training stable by itself. It stops the loop before a `NaN` or infinity update silently corrupts the weights. If it fires, inspect the learning rate and input scale first.

This tiny model keeps every prediction, loss, derivative, and update visible in code you can explain. A production latency service requires the additional data, serving, and reliability work described below.

A missing factor can hide in a manual backward formula. Before trusting one on a larger batch, check each parameter with a small nudge.

## Gradient checking catches backward bugs

For each parameter, nudge only that value by `eps`, compute the two losses, and compare the numerical slope to the formula from your backward pass. Keep the data and random choices fixed between those evaluations; otherwise their difference includes changes beyond the parameter nudge. Use weights `[1.3, 1.1]`, away from the minimum so the check tests nonzero slopes. The two gradients should agree component by component, not just in overall direction.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="gradient-check-two-parameters.py"
import numpy as np

X = np.array([[1.0, 0.5], [2.0, 1.0], [3.0, 0.5], [4.0, 2.0]])
y = np.array([2.5, 5.0, 6.5, 10.0])
weights = np.array([1.3, 1.1])

def mean_squared_loss(current: np.ndarray) -> float:
    errors = X @ current - y
    return float(np.mean(errors ** 2))

errors = X @ weights - y
manual_gradient = (2 / len(X)) * (X.T @ errors)

eps = 1e-5
numerical_gradient = np.zeros_like(weights)
for i in range(len(weights)):
    direction = np.zeros_like(weights)
    direction[i] = eps
    numerical_gradient[i] = (
        mean_squared_loss(weights + direction) - mean_squared_loss(weights - direction)
    ) / (2 * eps)

print("manual", np.round(manual_gradient, 6).tolist())
print("numerical", np.round(numerical_gradient, 6).tolist())
print("check_passed", np.allclose(manual_gradient, numerical_gradient, atol=1e-6))
assert np.allclose(manual_gradient, numerical_gradient, atol=1e-6)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
manual [-9.9, -3.925]
numerical [-9.9, -3.925]
check_passed True
```
<!-- leetllm: output:end -->

Try removing the factor `2` from `manual_gradient` and rerun the cell. The assertion should fail: numerical differences evaluate the squared loss and expose the missing factor in the proposed derivative. Restore the factor before continuing. Passing at one point supports the formula for that case. Check more inputs to exercise other values and edge cases.

That comparison is only trustworthy in enough precision. Single-precision floats can make a correct backward rule look wrong.

## Catastrophic cancellation in single precision

Use double precision (`float64`) for these small gradient checks. The check subtracts nearly equal loss values, and those values have already been rounded by floating-point arithmetic. After the matching leading digits cancel, the tiny difference can contain a large relative error. This is **catastrophic cancellation**.

Making `eps` smaller reduces approximation error only until rounding starts to dominate. Keep the one-weight latency loss and use the same `eps = 1e-6` in two dtypes. Both analytical derivatives are `4`, though the numerical checks do not achieve the same accuracy:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="gradcheck-precision.py"
import numpy as np

for dtype in (np.float64, np.float32):
    w = np.array([3.0], dtype=dtype)
    eps = np.array([1e-6], dtype=dtype)
    loss_plus = (2 * (w + eps) - 5) ** 2
    loss_minus = (2 * (w - eps) - 5) ** 2
    numerical = float(((loss_plus - loss_minus) / (2 * eps))[0])
    print(dtype.__name__, "numerical", round(numerical, 6))
    print("close to 4?", abs(numerical - 4) < 1e-5)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
float64 numerical 4.0
close to 4? True
float32 numerical 3.814697
close to 4? False
```
<!-- leetllm: output:end -->

The formula hasn't changed, only its numerical evaluation. Framework gradient checkers face the same limit: PyTorch's `gradcheck` defaults are intended for double-precision inputs.[^pytorch2026gradcheckapi] Also avoid testing exactly at ReLU's corner, where no ordinary derivative exists.

## Let PyTorch repeat the backward pass

The manual check agrees. Now let a framework repeat the same calculation. Reverse-mode automatic differentiation propagates chain-rule products backward from outputs to inputs. It's especially useful when one scalar loss depends on many parameters, which is the training shape we have here: one reverse pass computes all its parameter derivatives.[^baydin2018] Autograd uses the operations' local derivative rules, rather than nudging each parameter or manipulating an entire symbolic formula. Its results still use floating-point arithmetic, so automatic differentiation doesn't eliminate rounding error.

<span data-glossary="pytorch">PyTorch</span> arrays are called <span data-glossary="tensor">tensors</span>. Its **autograd** system records differentiable operations on tensors that request gradients, then computes the reverse pass when you call `backward()`.[^pytorch2026autograd] Setting `requires_grad=True` on the weights asks for their derivatives. This cell repeats the four-row latency table and checks PyTorch against the manual NumPy derivative.

The weights are a **leaf tensor**: we created them directly, rather than calculating them from another tracked tensor. PyTorch stores their derivatives in `.grad`. Calling backward again adds to that buffer rather than replacing it, so the second `.grad` value doubles. The `detach().clone()` calls below save independent snapshots of the gradient without tracking the copies themselves.

<!-- leetllm: test, deps=torch,numpy, output=show -->
```python title="pytorch-confirms-the-gradient.py"
import numpy as np
import torch

X_np = np.array([[1.0, 0.5], [2.0, 1.0], [3.0, 0.5], [4.0, 2.0]], dtype=np.float32)
y_np = np.array([2.5, 5.0, 6.5, 10.0], dtype=np.float32)
w_np = np.array([1.3, 1.1], dtype=np.float32)

manual = (2 / len(X_np)) * (X_np.T @ (X_np @ w_np - y_np))

X = torch.tensor(X_np)
y = torch.tensor(y_np)
w = torch.tensor(w_np, requires_grad=True)
loss = torch.mean((X @ w - y) ** 2)
loss.backward()
first_backward = w.grad.detach().clone()

same_loss_again = torch.mean((X @ w - y) ** 2)
same_loss_again.backward()
after_second_backward = w.grad.detach().clone()

w.grad = None
fresh_loss = torch.mean((X @ w - y) ** 2)
fresh_loss.backward()
after_reset_backward = w.grad.detach().clone()

def rounded(values: torch.Tensor | np.ndarray) -> list[float]:
    return [round(float(value), 3) for value in values]

print("loss", round(float(loss.item()), 6))
print("manual", rounded(manual))
print("first_backward", rounded(first_backward))
print("agree", np.allclose(manual, first_backward.numpy(), atol=1e-6))
print("after_second_backward", rounded(after_second_backward))
print("after_reset_backward", rounded(after_reset_backward))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
loss 3.268751
manual [-9.9, -3.925]
first_backward [-9.9, -3.925]
agree True
after_second_backward [-19.8, -7.85]
after_reset_backward [-9.9, -3.925]
```
<!-- leetllm: output:end -->

The second backward pass doubles the stored numbers because it adds the same gradient again. A training loop normally calls `optimizer.zero_grad()` before the next batch, or sets buffers to `None`, unless accumulating across several batches is intentional.[^pytorch2026optimization]

Adding contributions within one backward pass follows the chain rule. Keeping contributions across separate backward calls is a framework accumulation policy. Both use addition, but clearing `.grad` controls only the second behavior. Also notice that `backward()` hasn't updated `w`: an optimizer or explicit subtraction must apply the gradient afterward.

### What if the output isn't one number?

Our loss gave backward one starting signal, `dL/dL = 1`. The four predictions by themselves don't specify a scalar objective. To differentiate several outputs, tell backward how much sensitivity arrives at each one. That list is called the **backward seed**.

Use requests 0 and 2 from the table: both have queue delay `0.5`, but prompt blocks are `1` and `3`. Suppose we want the derivative of their prediction gap, `prediction[1] - prediction[0]`. Its seed is `[-1, +1]`. The queue-weight contributions cancel, and the prompt-weight contributions add to `-1*1 + 1*3 = 2`:

<!-- leetllm: test, deps=torch, output=show -->
```python title="seed-a-vector-backward-pass.py"
import torch

X = torch.tensor([[1.0, 0.5], [3.0, 0.5]], dtype=torch.float64)
weights = torch.tensor([1.3, 1.1], dtype=torch.float64, requires_grad=True)
predictions = X @ weights
seed = torch.tensor([-1.0, 1.0], dtype=torch.float64)
predictions.backward(seed)

print("predictions", [round(float(p), 3) for p in predictions.detach()])
print("prediction_gap", round(float((predictions[1] - predictions[0]).detach()), 3))
print("seeded_gradient", weights.grad.tolist())
print("manual", (X.T @ seed).tolist())
assert torch.allclose(weights.grad, X.T @ seed)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
predictions [1.85, 4.45]
prediction_gap 2.6
seeded_gradient [2.0, 0.0]
manual [2.0, 0.0]
```
<!-- leetllm: output:end -->

The **Jacobian** is the table of each output's partial derivatives with respect to each input parameter. Here its two rows are `[1, 0.5]` and `[3, 0.5]`, so its shape is `(2 outputs, 2 weights)`. Backward combines those rows using the seed, yielding one derivative per weight. This is a **vector-Jacobian product**, written as $v^T J$ with row vectors, or $J^T v$ with column vectors. Autograd computes that product without needing to materialize a full Jacobian.[^baydin2018][^pytorchBackward2026]

Changing the seed changes the quantity differentiated. `[1, 1]` would differentiate the sum of predictions and produce `[4, 1]`, not the gap's `[2, 0]`. For our four-row mean squared loss, the arriving prediction seed is `2 * errors / 4`, which explains the same `X.T @ seed` formula used earlier. Calling `backward()` on a tensor with several elements requires this explicit seed or a prior reduction to a scalar.

## In-place writes can break the backward pass

PyTorch tracks operations on tensors to construct the computation graph for backpropagation. In-place writes can invalidate saved values or mutate aliased tensors.[^pytorch2026autograd]

To compute some derivatives, autograd saves forward-pass values. Overwriting a saved value before `.backward()` can make that derivative impossible to compute correctly, so PyTorch checks for changes and raises when the backward pass needs an invalidated value. Not every in-place operation is forbidden; the dependency on the overwritten value determines the problem.

Views are a second trap, similar to the shared buffers in NumPy. Expanding a size-1 axis with `.expand()` uses an <span data-glossary="array-stride">array stride</span> of `0`, so several output indices refer to the same memory location. Updating all those entries at once with `add_()` would write repeatedly to that location. PyTorch rejects this overlapping write; use `.clone()` first when you need independent entries.[^pytorchExpand2026]

The two cells below isolate storage behavior rather than fit latency. The first uses **sigmoid**, a smooth function that squashes a number into the range `(0, 1)`. If its output is `b`, its derivative is `b * (1 - b)`, so backward needs the original `b`. Changing that output breaks the dependency. The second cell writes through a view whose entries share storage. Read each error as a diagnosis of a different problem.

<!-- leetllm: test, deps=torch, output=show -->
```python title="pytorch-autograd-traps.py"
import torch

# Trap 1: Mutating a variable needed for backward in-place
a = torch.tensor([2.0], requires_grad=True)
b = torch.sigmoid(a)
c = b * 3
b.add_(1.0)  # Mutates b in-place
try:
    c.backward()
except RuntimeError as error:
    print("Trap 1 error:", str(error).split("\n")[0])
else:
    raise AssertionError("Expected backward to reject the overwritten sigmoid output")

# Trap 2: Mutating an expanded view sharing storage in-place
x = torch.tensor([1.0], requires_grad=True)
y = x * 2
z = y.expand(3)  # Expanded view (stride 0)
try:
    z.add_(1.0)  # Try to mutate expanded view in-place
except RuntimeError as error:
    print("Trap 2 error:", str(error).split("\n")[0])
else:
    raise AssertionError("Expected the overlapping in-place write to fail")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Trap 1 error: one of the variables needed for gradient computation has been modified by an inplace operation: [torch.FloatTensor [1]], which is output 0 of Sigmoid, is at version 1; expected version 0 instead. Hint: enable anomaly detection to find the operation that failed to compute its gradient, with torch.autograd.set_detect_anomaly(True, check_nan=False).
Trap 2 error: unsupported operation: more than one element of the written-to tensor refers to a single memory location. Please clone() the tensor before performing the operation.
```
<!-- leetllm: output:end -->

## Test the loop on another request

Try one more latency row before opening the solution sketches: `x_prompt = 3`, `x_queue = 1`, actual seconds `y = 7`, and weights `[w_prompt, w_queue] = [2, 2]`.

1. Compute prediction, error, and squared loss.
2. Compute both partial derivatives by multiplying `2 * error` by the relevant feature.
3. Apply one gradient-descent update with learning rate `0.05`. What is the new prediction and loss?
4. If a centered finite-difference check for the prompt parameter returns `5.99999` while your manual derivative says `6`, is that evidence of a bug?
5. If loss becomes `NaN` after a very large update, what two things should you inspect first?

### Solution sketches

1. Prediction is `2*3 + 2*1 = 8`, error is `8 - 7 = 1`, and loss is `1`.
2. The prompt partial is `2*1*3 = 6`; the queue partial is `2*1*1 = 2`. The gradient is `[6, 2]`.
3. New weights are `[2 - 0.05*6, 2 - 0.05*2] = [1.7, 1.9]`. Prediction is `1.7*3 + 1.9 = 7.0`, so loss is `0`.
4. Not by itself. The absolute difference is about `0.00001`, or roughly `0.00017%` of the derivative. Compare it with your chosen absolute and relative tolerances; matching signs alone would not be enough. The NumPy check above accepts this difference with its default relative tolerance.
5. Inspect the learning rate and the scale or validity of input values. A huge step or non-finite data can make the forward loss invalid before a later optimizer can help.

## Keep evidence from each update

When a training step misbehaves, leave a trail you can inspect:

| Step | Question you can answer |
|---|---|
| Forward pass | What prediction did current parameters make? |
| Loss | How wrong was that prediction? |
| Derivative | How would loss respond to a small change in one parameter? |
| Gradient | What is the correction signal for every parameter? |
| Backpropagation | How do local derivatives carry that signal backward? |
| Gradient check | How do I test a handwritten backward formula? |

For this small deterministic model, verify four things: the forward loss is finite, the gradient has the expected sign and shape, a centered finite difference agrees within tolerance at smooth points, and one small step lowers loss on the checked example. Numerical checks belong on small debugging cases; they aren't a requirement to perturb every parameter during ordinary training.

If those checks pass but training diverges, inspect the learning rate and input scale before rewriting backpropagation. Practice the sequence on the latency table: compute one finite-difference check, then confirm that the step lowers loss.

Momentum, Adam, and learning-rate schedules control how to *use* gradients over many steps. Those tools wait until vectors, <span data-glossary="matrix">matrices</span>, and deeper linear algebra are in place. Next you need names for the lists of corrections you computed.

```mastery-quiz
[
  {
    "question": "A model predicts ŷ = wx and uses squared error as its loss. With x = 3, w = 2 and target 8, what is the loss gradient with respect to w? What weight and loss follow after one gradient-descent step at rate 0.05?",
    "options": [
      "−6; 2.3; 1.21.",
      "−12; 1.4; 14.44.",
      "−12; 2.6; 0.04.",
      "−2; 2.1; 2.89."
    ],
    "answer": "−12; 2.6; 0.04.",
    "explanation": "The model predicts 6, so the error is 6 − 8 = −2. The gradient is twice the error times the input, or 2 × (−2) × 3 = −12. Subtracting 0.05 × (−12) from 2 gives a weight of 2.6. The new prediction is 7.8, so the loss is (7.8 − 8)² = 0.04. A gradient of −6 drops the factor of two from the square. Adding 0.05 × (−12) to the starting weight gives 1.4. A gradient of −2 uses the prediction error alone."
  },
  {
    "question": "For the loss L(w) = (wx − y)², hold x = 4 and the target y fixed. Starting away from the optimum w*, run gradient descent at a fixed learning rate of 0.08. In exact arithmetic, what factor multiplies the signed displacement w − w* on each update, and how does the distance to w* change?",
    "options": [
      "−1.56; distance grows.",
      "−0.28; distance shrinks.",
      "0.36; distance shrinks.",
      "1.56; distance grows."
    ],
    "answer": "−1.56; distance grows.",
    "explanation": "At the optimum the model predicts y, so the prediction error at w is x(w − w*). Multiplying that error by 2x gives the gradient 2x²(w − w*). Each update therefore multiplies the displacement by 1 − 0.08 × 2 × 4² = −1.56. The weight crosses the optimum and ends up 1.56 times as far away. Positive 1.56 gives only the distance factor. Dropping the square’s factor of two gives −0.28. Using x only once gives 0.36."
  },
  {
    "question": "The Jacobian J has one row per prediction and one column per parameter. Its first row is [2, 1] and its second is [5, 1]. A backward pass receives the seed v = [−2, +1] in prediction order. Which combination of predictions does it differentiate, and what is the parameter gradient?",
    "options": [
      "Second minus first; [3,0].",
      "Twice first minus second; [−1,1].",
      "Second minus twice first; [−3,−9].",
      "Second minus twice first; [1,−1]."
    ],
    "answer": "Second minus twice first; [1,−1].",
    "explanation": "The seed selects the second prediction minus twice the first. For each parameter, take the second row’s slope minus twice the first row’s slope. This gives Jᵀv = [5 − 2 × 2, 1 − 2 × 1] = [1, −1]. The vector [−3, −9] comes from Jv, which treats the seed as a parameter direction and gives a slope for each prediction. Using −1 for the first seed entry gives [3, 0]. Reversing both seed signs gives [−1, 1]."
  },
  {
    "question": "Three graph routes reach one stored parameter with loss-gradient contributions +7, −4 and +1. No mean reduction appears in the loss. Which gradient belongs in that parameter’s buffer?",
    "options": [
      "−28.",
      "4.",
      "7.",
      "4/3."
    ],
    "answer": "4.",
    "explanation": "All routes describe sensitivity to the same stored number, so they sum to 7−4+1 = 4. Multiplication combines local factors along one route, selecting the largest loses routes, and dividing by three invents a mean absent from the objective."
  },
  {
    "question": "A model predicts ŷ = Xw. The rows of X are [1, 2], [2, 0] and [0, 3], with targets 3, 4 and 6 in that order. At w = [0, 0], what is the gradient of the mean squared error with respect to the two weights?",
    "options": [
      "[−22, −48].",
      "[−11/3, −8].",
      "[−11, −24].",
      "[−22/3, −16]."
    ],
    "answer": "[−22/3, −16].",
    "explanation": "At zero weights the errors are −3, −4 and −6. Multiply each error by its row of X and add the three vectors to get [−11, −24]. The derivative of the square adds a factor of two, giving [−22, −48]. That is the gradient of the sum. Divide by the three rows to get the gradient of the mean, [−22/3, −16]. Omitting the factor of two gives [−11/3, −8]. Dividing the sum gradient by the number of weights gives [−11, −24]."
  },
  {
    "question": "For L(w) = (ReLU(4w) − 3)² at w = 0, which left derivative, right derivative and PyTorch backward value are correct?",
    "options": [
      "0; −24; −12.",
      "−24; 0; −24.",
      "0; −24; 0.",
      "0; −12; 0."
    ],
    "answer": "0; −24; 0.",
    "explanation": "On the negative side loss stays 9, giving left derivative 0. On the positive side the derivative is 2(4w−3)×4, approaching −24. PyTorch’s ReLU convention returns zero at the corner. A centered difference approaches −12, which is neither an ordinary derivative nor the chosen backward value."
  },
  {
    "question": "A leaf gradient starts empty. Two freshly recomputed identical losses each contribute [−3,5], then the buffer is set to None and one fresh identical backward runs. What are the buffer values after the second and third passes?",
    "options": [
      "[−6,10]; [−3,5].",
      "[−3,5]; [0,0].",
      "[−1.5,2.5]; [−3,5].",
      "[3,−5]; [−6,10]."
    ],
    "answer": "[−6,10]; [−3,5].",
    "explanation": "The first two passes add into the same buffer, producing [−6,10]. Setting it to None clears that history; the next pass stores [−3,5]. These calls do not average, negate, or independently apply an optimizer update."
  },
  {
    "question": "Case A computes b = sigmoid(a), c = 5b, overwrites b with add_(1), then differentiates c. Case B clones six expanded copies of 3x, adds 1 to the clone and differentiates their sum. a and x are scalar leaves requiring gradients. Which result pair follows?",
    "options": [
      "A succeeds; B has x gradient 3.",
      "A raises a saved-value error; B has x gradient 18.",
      "A succeeds; B has x gradient 18.",
      "A raises a saved-value error; B has x gradient 3."
    ],
    "answer": "A raises a saved-value error; B has x gradient 18.",
    "explanation": "A invalidates sigmoid’s saved output needed by its local derivative; multiplying that output by five does not preserve it after an overwrite. B writes independent cloned storage and retains its derivative path; the sum contains six copies of 3x, so its x gradient is 18. Clone changes storage ownership without severing the source’s mathematical reuse."
  },
  {
    "question": "A hidden-unit model is h = w1×x+b1, z = ReLU(h), prediction = w2×z+b2, with squared loss. Use x=2, target5, w1=1, b1=0.5, w2=1.5 and b2=0.25. Which gradient in order [w1,b1,w2,b2] follows?",
    "options": [
      "[−6,−3,−5,−2].",
      "[−3,−3,−5,−2].",
      "[−6,−3,−2,−5].",
      "[6,3,5,2]."
    ],
    "answer": "[−6,−3,−5,−2].",
    "explanation": "h = z = 2.5, prediction 4, and error −1. Prediction sensitivity −2 gives output-weight gradient −5 and output-bias gradient −2. Multiplying by w2 = 1.5 and the active ReLU derivative gives hidden sensitivity −3, then x = 2 gives first-weight gradient −6. The distractors lose x, exchange a forward activation with a bias factor, or reverse the loss-gradient sign."
  },
  {
    "question": "A linear model has rows [1,1] and [2,2] with targets 3 and 6. Compare weights [1,2] with [2,1]. Which training losses and identification conclusion follow?",
    "options": [
      "Both zero; the table identifies [1,2] uniquely.",
      "One zero and one positive; the table distinguishes them.",
      "Both zero; this table does not distinguish those weights.",
      "Both positive; an extra nonlinear layer is required."
    ],
    "answer": "Both zero; this table does not distinguish those weights.",
    "explanation": "Both rows depend only on the sum of the two weights, which is 3 in both candidates. Their predictions are [3,6], so both losses are zero. Multiple rows with dependent feature columns still leave that direction unidentified. Extra data with distinct feature relationships or an explicit selection rule is needed; lower training loss alone cannot choose these candidates."
  }
]
```

> **Next:** Continue to [Vectors, Matrices & Tensors](/learn/vectors-matrices-tensors). The two-weight correction `[4, 2]` is already a vector, even if we haven't used that word as a type yet. The next lesson names that structure, then shows how batches and extra axes grow out of the same latency example.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Start with the smallest model that can learn anything: one knob. A request has a 200-token prompt, which we write as 2 because we count in hundreds of tokens, and it took 5 seconds. Our model multiplies by an adjustable number $w$, currently 3, so it predicts $3 \times 2 = 6$ seconds. The loss is the squared error, $(6 - 5)^2 = 1$.

Should $w$ go up or down? Chapter 1 answered that by trying it. Add 0.001 to $w$, and the loss rises from 1.000000 to 1.004004. Divide the change in loss by the change in $w$ and you get a slope of about 4. Positive means that raising $w$ makes things worse, so we should lower it.

## The slope, exactly

You can get that slope without any trial. Write the loss as a function of the knob:

$$
L(w) = (2w - 5)^2
$$

Calculus calls the slope at a point the **derivative**, and writes it $dL/dw$. It is what the nudging ratio approaches as the nudge shrinks toward zero.[^openstaxDerivative2016] You only need a few facts about derivatives here, because this chapter's network uses simple operations: the derivative of $x^2$ is $2x$, the derivative of $ax$ is $a$, and constants contribute nothing.

Our loss, though, is one function inside another. Think of a chain of two gears. Turning $w$ moves the prediction twice as fast, because the prediction is $2w$. And the loss moves at twice the error, because of the square. If one gear doubles a motion and the next doubles it again, the total is the product of the two rates. That is the **chain rule**, and it is the one piece of calculus this chapter really needs:[^openstaxChainRule2016]

$$
\frac{dL}{dw} = \underbrace{2(2w - 5)}_{\text{loss per unit of prediction}} \times \underbrace{2}_{\text{prediction per unit of } w}
$$

At $w = 3$, that gives $2 \times 1 \times 2 = 4$. The nudge said about 4.004, because a nudge of 0.001 is not quite zero, and this says exactly 4. With the slope in hand, take the downhill step from Chapter 1:

$$
w_{\text{new}} = w - \text{learning rate} \times \frac{dL}{dw}
$$

<!-- leetllm: test, output=show, id=reader-backprop-descent -->
```python title="one-knob-gradient-descent.py"
w, x, y = 3.0, 2.0, 5.0
learning_rate = 0.1

print("step  weight  prediction      loss  gradient")
for step in range(5):
    prediction = w * x
    loss = (prediction - y) ** 2
    gradient = 2 * (prediction - y) * x
    row = f"{step:4d}  {w:6.4f}  {prediction:10.4f}  {loss:8.6f}"
    print(f"{row}  {gradient:8.4f}")
    w -= learning_rate * gradient
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step  weight  prediction      loss  gradient
   0  3.0000      6.0000  1.000000    4.0000
   1  2.6000      5.2000  0.040000    0.8000
   2  2.5200      5.0400  0.001600    0.1600
   3  2.5040      5.0080  0.000064    0.0320
   4  2.5008      5.0016  0.000003    0.0064
```
<!-- leetllm: output:end -->

Each row's gradient is smaller than the last, because the slope flattens as you approach the bottom. So the steps shrink on their own. The weight is closing in on 2.5, where the prediction is exactly 5 and the loss is zero.

## The learning rate can wreck a correct gradient

The gradient gives you a direction, and it only tells you the truth about the ground right under your feet. The learning rate decides how far to walk on that information.

<figure>
  <img src="illustrations/_generated/learning_rate_paths_dark.png" alt="Three panels show gradient descent on the same loss curve, L of w equals 2 w minus 5, squared, starting from w equals 3. With learning rate 0.05 the steps creep steadily toward the minimum at w equals 2.5. With 0.2 they zigzag across the minimum and still converge. With 0.26 each step overshoots further than the last, and the loss grows." />
  <figcaption>Same loss, same start, and the same correct gradient. Only the step size changes. In exact arithmetic, rates strictly between 0 and 0.25 converge from this start, while rates above 0.25 diverge.</figcaption>
</figure>

For this curve, each update multiplies the signed displacement $w - 2.5$ by $1 - 8 \times \text{rate}$. The magnitude of that factor tells you how the distance changes. From this start, the run converges for rates strictly between 0 and 0.25. At 0.25 the weight alternates between 3 and 2. At the pictured rate of 0.26, the weight crosses the minimum each time, the distance grows by a factor of 1.08, and the loss grows by a factor of 1.1664 from the first step. With finite precision, a sufficiently large squared loss can overflow. PyTorch can report `inf` and later `NaN` (not a number). In the Python example, squaring a sufficiently large float with `** 2` raises `OverflowError`.

The limit also depends on your units. Measure the input in raw tokens instead of hundreds, and the safe rate shrinks by a factor of ten thousand, even though the model's predictions are the same. So a learning rate that worked before can blow up after a change that looks cosmetic. There is no universally good value. Picking one is an experiment, and Chapter 5 describes the optimizer that makes the choice less delicate.

```checkpoint
Training was stable, and then a teammate changed one input feature from seconds to milliseconds. Now the loss goes to `nan` within a few steps. What is the likely cause?
---
The input values became a thousand times larger, so the gradients and the curvature of the loss grew with them. A learning rate that was safe before now oversteps the minimum and diverges. Rescale the feature, or lower the rate.
```

## Straight lines are not enough

We have only trained straight lines so far, and it is time to face their limit. Here is a shape every infrastructure engineer knows: latency against server utilization. It sits nearly flat, then climbs, then climbs faster as the server saturates.

No line fits that, and stacking more linear layers will not help. If $Y = XW_1$ and $Z = YW_2$, then $Z = X(W_1 W_2)$, which is one linear layer in disguise. Any tower of matrix multiplications collapses to a single matrix. To model anything interesting, we have to bend something.

A very common bend is about as simple as a function gets. It is called the **rectified linear unit**, or **ReLU**, and it passes positive numbers through and turns negative numbers into zero:[^nair2010]

$$
\mathrm{ReLU}(h) = \max(0, h)
$$

One ReLU gives you one bend, at a place the weights can move. Several units can combine their bends into more complex piecewise-linear shapes.

<figure>
  <img src="illustrations/_generated/relu_bends_dark.png" alt="Latency against server utilization follows a hockey stick: flat near 50 milliseconds, then rising after 0.6 and more steeply after 0.8. Left: the best straight line misses both the flat region and the steep end. Right: two ReLU units, each flat and then rising from its own bend, add up with a base value to fit the curve exactly." />
  <figcaption>A straight line cannot follow a hockey stick, no matter how you fit it. Two ReLU units, plus a base value, can. Each unit contributes one bend, and training decides where the bends go and how steep they are.</figcaption>
</figure>

And that is a **neural network**: linear layers with a simple nonlinearity between them. Each layer between the input and the output is called a **hidden layer**. Here is the two-layer form you will meet again, in the Transformer's feed-forward block in Part 1:

$$
\mathrm{FFN}(x) = \mathrm{ReLU}(xW_1 + b_1)W_2 + b_2
$$

## Backpropagation: the slope of every knob at once

Now for the problem from Chapter 1. Nudging takes one full pass per knob, on every step. A model with a billion knobs would need a billion passes to take one step. Training would never finish.

Go back to the chain rule, and notice something about how it runs. Every knob's slope is a product of local rates along the path from that knob to the loss. Knobs that sit near each other share nearly all of that path. So compute the shared part once, starting at the loss and walking backward, and reuse it at each branch.

That reverse walk is **backpropagation**.[^rumelhart1986] It computes the gradient of one loss with respect to all parameters in one backward pass, with an operation count comparable to the forward evaluation for the usual elementary operations.[^baydin2018] Both passes still grow with the network. The saving is that we avoid another complete forward evaluation for each parameter. Large neural networks are practical because of that one fact.

Let's do it by hand on the smallest network with all the parts. It has one hidden unit and four knobs:

$$
h = w_1 x + b_1, \qquad z = \mathrm{ReLU}(h), \qquad \hat{y} = w_2 z + b_2, \qquad L = (\hat{y} - y)^2
$$

Take $x = 2$ and target $y = 5$, with $w_1 = 1.5$, $b_1 = -1$, $w_2 = 2$, and $b_2 = 0.5$. Going forward gives $h = 2$, $z = 2$, $\hat{y} = 4.5$, and $L = 0.25$. Then, going backward, you multiply one local rate at each step, as the next figure shows.

<figure>
  <img src="illustrations/_generated/backprop_graph_dark.png" alt="A tiny network as a left-to-right chain. Forward pass: input x equals 2 goes through w1 times x plus b1 to give h equals 2, through ReLU to give z equals 2, through w2 times z plus b2 to give y hat equals 4.5, and against target 5 to give loss 0.25. Backward pass, right to left: the loss signal is 1, the derivative with respect to y hat is minus 1, with respect to z is minus 2, with respect to h is minus 2. Parameter gradients branch off: w2 gets minus 2, b2 gets minus 1, w1 gets minus 4, and b1 gets minus 2." />
  <figcaption>The forward pass computes values, and the backward pass reuses them. Starting from the loss, each step multiplies by one local rate, and each knob reads its gradient from the signal passing its stage. All four gradients come from a single backward pass.</figcaption>
</figure>

Trace it once with a finger, because this is the whole algorithm. At the loss, the signal is $2(\hat{y} - y) = -1$. To reach $z$, multiply by $w_2 = 2$, giving $-2$. ReLU is passing its input through here, so its local rate is 1, and the signal stays $-2$. To reach $w_1$, multiply by $x = 2$, giving $-4$. The gradients are all negative, which fits: the prediction of 4.5 is too low, so raising any of these knobs helps. The code does the same walk, then checks itself against the slow method:

<!-- leetllm: test, output=show, id=reader-backprop-by-hand -->
```python title="backpropagate-by-hand.py"
def forward(w1, b1, w2, b2, x=2.0, y=5.0):
    h = w1 * x + b1
    z = max(0.0, h)
    prediction = w2 * z + b2
    return h, z, prediction, (prediction - y) ** 2

knobs = {"w1": 1.5, "b1": -1.0, "w2": 2.0, "b2": 0.5}
x, y = 2.0, 5.0

# One forward pass stores the values that the backward pass needs.
h, z, prediction, loss = forward(**knobs)

# One backward pass walks from the loss toward the input.
signal = 2 * (prediction - y)            # dL/d(prediction)
grads = {"b2": signal, "w2": signal * z}
signal *= knobs["w2"]                    # dL/dz
signal *= 1.0 if h > 0 else 0.0          # dL/dh, through ReLU
grads["b1"] = signal
grads["w1"] = signal * x

# The slow way: one more forward pass per knob.
eps = 1e-6
for name in knobs:
    nudged = dict(knobs)
    nudged[name] += eps
    slope = (forward(**nudged)[3] - loss) / eps
    print(f"{name}: backprop={grads[name]:6.2f}   nudging={slope:6.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
w1: backprop= -4.00   nudging= -4.00
b1: backprop= -2.00   nudging= -2.00
w2: backprop= -2.00   nudging= -2.00
b2: backprop= -1.00   nudging= -1.00
```
<!-- leetllm: output:end -->

They agree. Comparing the two like this is called a **gradient check**, and it is the right way to test any backward code you write by hand. The cost difference is what matters, though. Nudging needed one extra forward pass per knob, and backprop computed everything in one backward pass. With a billion knobs, that ratio is the difference between possible and impossible.

Frameworks such as PyTorch usually perform this walk for you. They record each operation as it runs and apply the chain rule when you call `loss.backward()`. Chapter 5 uses that. But now you know what the call does, which is the difference between debugging a training run and staring at one.

```checkpoint
Why does backpropagation need to keep values from the forward pass, and what does that imply for memory during training compared with inference?
---
Local rates depend on forward values. For example, the rate for $w_2$ is $z$, and ReLU's rate depends on the sign of $h$. So training has to hold those intermediate values until the backward pass uses them, which is one reason training needs far more memory than inference for the same model. Chapter 6 puts numbers on this.
```

## How gradients go wrong

Because the gradient is a long product of local rates, it inherits the problems of long products. Three of them are worth knowing by name.

**Gradients can die.** Take ReLU's local rate. When $h$ is negative, the output is stuck at zero, and a small change in $h$ does nothing. So its rate is 0, and everything upstream of it receives a gradient of exactly zero. If $h$ stays negative for every example in your data, that unit stops learning, which is why people call it a dead ReLU.

<!-- leetllm: test, output=show, id=reader-backprop-dead-relu -->
```python title="a-relu-that-stopped-learning.py"
x, y = 2.0, 5.0
w1, b1, w2, b2 = 1.5, -4.0, 2.0, 0.5  # b1 is now large and negative

h = w1 * x + b1
z = max(0.0, h)
prediction = w2 * z + b2
signal = 2 * (prediction - y)

loss = (prediction - y) ** 2
print("h:", h, " z:", z, " prediction:", prediction, " loss:", loss)
print("gradient for w1:", signal * w2 * (1.0 if h > 0 else 0.0) * x)
print("gradient for b2:", signal)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
h: -1.0  z: 0.0  prediction: 0.5  loss: 20.25
gradient for w1: -0.0
gradient for b2: -9.0
```
<!-- leetllm: output:end -->

The loss here is large, 20.25, and $w_1$ still receives a gradient of zero. (Python prints `-0.0`, which equals zero.) Nothing is telling it to change.

**Gradients can vanish or explode.** In a deep network the signal is multiplied at every layer. Multiply many numbers below 1 and the signal shrinks toward zero, so the early layers barely learn. Multiply many numbers above 1 and it blows up. Two ideas you will see in the Transformer exist largely to fight this: **residual connections** (no relation to Chapter 1's residuals), which add a layer's output to its input so that a direct route for the signal survives, and **normalization**, which keeps values at a sensible scale.

**Gradients can be lost to rounding.** A gradient is a real number stored in a limited format. If it is small enough, a low-precision format rounds it to exactly zero, and the update vanishes with no error message. That happens in practice, and the mixed-precision chapter in Part 3 shows the fix. Chapter 6 introduces the number formats involved.

## What you can do now

You can read a learning curve and suspect the learning rate when it diverges. You can explain why a network needs nonlinearities, and you can carry out a backward pass by hand and check it. You also know why the hardware bill looks the way it does: one forward pass, one backward pass, and memory to carry values between them, repeated for every step of training.

We have been working on one example at a time. A single fitted row gives no assurance of how the model will predict across later requests. In the next chapter, we wrap this calculation in a real loop over real data, teach a tiny model to predict the next character of text, and watch how it fails.

<!-- leetllm: edition:reader:end -->
