---
{
  "id": "pytorch-training-loops",
  "title": "PyTorch Training Loops",
  "slug": "pytorch-training-loops",
  "section": "ML Algorithms & Evaluation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Medium",
  "order": 14,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "A falling loss can hide a broken sequence-classifier loop, so follow one batch through logits, gradients, validation, and a checkpoint that still matches after reload.",
  "prerequisites": ["training-backpropagation-gradient-descent", "softmax-cross-entropy-optimization", "cross-validation-leakage-generalization"],
  "keyConceptsTested": [
    "TensorDataset and DataLoader",
    "raw logits and CrossEntropyLoss",
    "loss.backward() and optimizer.step()",
    "optimizer.zero_grad(set_to_none=True)",
    "model.train() and model.eval()",
    "torch.no_grad() and inference_mode()",
    "micro-batch gradient accumulation",
    "global norm gradient clipping",
    "automatic mixed precision and GradScaler",
    "atomic state_dict checkpointing"
  ]
}
---
<!-- leetllm: edition:reference:start -->

Your training run reports steadily dropping loss, yet its sequence classifier behaves erratically during evaluation. The loop can finish without an exception while a state bug slips by: gradients carry over between mini-batches, Dropout stays active during validation, or a checkpoint still points to live tensors that later epochs change. We will build a small token-sequence classifier and follow each state change so you can catch those bugs before shipping.

We start after a tokenizer and pooling step have converted each short sequence into two normalized features: a local syntax score (`local_score`) and a continuation cue score (`span_score`). A binary target labels whether the sequence needs long-range context (`1`) or stays local (`0`). Random initial weights have not learned to separate those classes yet, though their accuracy does not have to equal 50%. A **training loop** passes examples forward, measures loss, differentiates it with respect to parameters, and applies an optimizer update. Plain SGD moves opposite the gradient; momentum and Adam transform that update.

The [causal reasoning](/learn/causal-inference-confounding-counterfactuals) lesson uses an <span data-glossary="ab-testing">A/B test</span> to ask whether a deployed update helps users. That test doesn't write the weights. The loop has to learn them first.

<span data-glossary="pytorch">PyTorch</span> doesn't hide this learning cycle behind a monolithic `.fit()` call: you write the loop yourself. That imperative design makes every tensor, gradient, and memory buffer inspectable at runtime. Later, when you scale up to fine-tune a large language model or run distributed training across multiple nodes, the fundamental handoffs remain identical: batches, <span data-glossary="logits">logits</span>, loss, <span data-glossary="gradient">gradients</span>, <span data-glossary="optimizer">optimizer</span> updates, validation passes, and durable checkpoints.[^pytorch2019][^pytorch2026optimization]

The gradient descent and cross-entropy concepts build on [backpropagation](/learn/training-backpropagation-gradient-descent) and [softmax classification](/learn/softmax-cross-entropy-optimization). Here we turn them into executable PyTorch code. Every snippet runs self-contained on CPU with fixed seeds so you can verify each state transition directly.

## Turn a sequence into tensors

We bypass raw tokenization for now. An upstream pooling step has already reduced each short token sequence to two normalized floating-point numbers:

| Feature | Meaning | Example range |
|---|---|---:|
| `local_score` | Weight of short-window phrase or local syntax cues | `-2.0` to `2.0` |
| `span_score` | Weight of long-range coreference or continuation cues | `-2.0` to `2.0` |
| `label` | `0 = local_span`, `1 = long_span` | `0` or `1` |

Every training instance consists of a two-element feature <span data-glossary="vector">vector</span> and an integer class target. A mini-batch stacks those rows into a two-dimensional <span data-glossary="tensor">tensor</span>. Six token sequences produce a feature tensor of shape `(6, 2)` and a label tensor of shape `(6,)`.

<!-- leetllm: test, deps=torch, output=show, output_title="Tensor shapes" -->

```python title="01-sequence-tensors.py"
import torch

features = torch.tensor(
    [
        [-2.0, -1.2],
        [-1.3, -0.8],
        [-0.8, -1.4],
        [0.9, 1.1],
        [1.4, 0.8],
        [1.8, 1.6],
    ],
    dtype=torch.float32,
)
labels = torch.tensor([0, 0, 0, 1, 1, 1], dtype=torch.long)

print("features:", tuple(features.shape), features.dtype)
print("labels:", tuple(labels.shape), labels.dtype)
print("first sequence:", features[0].tolist(), "label:", labels[0].item())
```

<!-- leetllm: output:start -->
```text title="Tensor shapes" output compact
features: (6, 2) torch.float32
labels: (6,) torch.int64
first sequence: [-2.0, -1.2000000476837158] label: 0
```
<!-- leetllm: output:end -->

For this hard-label classifier, floating-point features (`torch.float32`) match the linear layer's weights, while `torch.long` targets provide integer class indices. Floating targets of shape `(batch,)` do not satisfy that expected shape and dtype. Cross-entropy also accepts floating **soft targets** of shape `(batch, classes)`, holding a probability distribution in each row. PyTorch doesn't validate those distributions for you.[^pytorchCrossEntropy2026]

The shapes match the loss. Those two numbers for one sequence are still not a probability that it belongs to `long_span`.

## Logits are scores, not probabilities

A linear classification head ending in `nn.Linear(2, 2)` produces two unconstrained scores for each sequence:

| Output column | Predicted class |
|---:|---|
| `0` | local_span |
| `1` | long_span |

These unnormalized outputs are **logits**. They can be positive, negative, or zero and do not have to sum to one. For our hard-label classifier, `nn.CrossEntropyLoss` combines log-<span data-glossary="softmax">softmax</span> over raw logits with negative log-likelihood at integer target indices.[^pytorchCrossEntropy2026]

Consider raw sequence logits `[2.0, -1.0]` for an example whose ground-truth class is `0`. To see how cross-entropy scores this output, convert the logits to probabilities:

$$
p_0 = \frac{e^{2.0}}{e^{2.0} + e^{-1.0}} = \frac{7.389}{7.389 + 0.368} \approx 0.9526,\qquad -\log(p_0) \approx 0.0486.
$$

The second sequence outputs logits `[-0.5, 1.5]` with ground-truth class `1`. The correct class wins, but with less margin: $p_1 \approx 0.8808$, yielding loss $-\log(p_1) \approx 0.1269$. The average loss over both sequences is $(0.0486 + 0.1269) / 2 \approx 0.0878$. PyTorch's default `reduction="mean"` computes exactly this batch average.

<!-- leetllm: test, deps=torch, output=show, output_title="Raw logits and loss" -->

```python title="02-raw-logits.py"
import torch
from torch import nn

logits = torch.tensor([[2.0, -1.0], [-0.5, 1.5]], dtype=torch.float32)
labels = torch.tensor([0, 1], dtype=torch.long)
loss = nn.CrossEntropyLoss()(logits, labels)

class_names = ["local_span", "long_span"]
predictions = logits.argmax(dim=1).tolist()
print("predicted classes:", [class_names[index] for index in predictions])
print("cross entropy:", round(loss.item(), 4))
```

<!-- leetllm: output:start -->
```text title="Raw logits and loss" output compact
predicted classes: ['local_span', 'long_span']
cross entropy: 0.0878
```
<!-- leetllm: output:end -->

> **Failure case:** Don't pass `torch.softmax(logits, dim=-1)` as the input to `CrossEntropyLoss`. It treats those probabilities as logits, giving gradients for a different objective. Separately, `torch.log(torch.softmax(logits, dim=-1))` can turn an underflowed probability into `-inf`. Direct log-softmax/cross-entropy avoids that intermediate rounding through log-sum-exp: $\log \sum_j e^{z_j}=c+\log\sum_j e^{z_j-c}$, with $c=\max_j z_j$.

```checkpoint
Why should `CrossEntropyLoss` receive raw logits rather than probabilities from a separate softmax?
---
It combines log-softmax and negative log-likelihood in a numerically stable operation using the log-sum-exp trick. Applying softmax first makes the loss treat probabilities as unnormalized scores and apply another normalization, altering the objective and its gradients.
```

`CrossEntropyLoss` summarizes batch predictions into a single scalar value. That scalar says how wrong the batch is. It still hasn't moved a weight.

## The five execution phases in a training step

This eager SGD loop uses five phases. Clearing gradients must precede the backward pass whose derivatives you want to retain, though it does not have to precede the forward pass itself. Only the fifth phase modifies parameter values:

| Phase | PyTorch statement | Purpose | Parameter values change? |
|---|---|---|---|
| 1 | `optimizer.zero_grad(set_to_none=True)` | Clear stored gradients left by earlier iterations. | No |
| 2 | `logits = model(xb)` | Run the forward pass and build the autograd computation graph. | No |
| 3 | `loss = loss_fn(logits, yb)` | Score predictions against ground-truth labels. | No |
| 4 | `loss.backward()` | Traverse the graph backward to populate `.grad` attributes. | No |
| 5 | `optimizer.step()` | Update parameter values using the stored gradients. | Yes |

In this loop, `loss.backward()` doesn't modify weight values. It traverses the graph through the chain rule and accumulates derivatives in reachable leaf tensors with `requires_grad=True`. An unused parameter does not automatically receive a gradient.[^goodfellow2016][^pytorch2026autograd] A training forward pass can change buffers such as BatchNorm's running statistics, even though the table's parameter values remain unchanged.

The parameter values themselves remain completely unchanged until `optimizer.step()` runs. The optimizer reads the accumulated gradients, applies its update rule (such as SGD or Adam), and updates the parameter storage in place.

Why use `set_to_none=True`, the current default? It removes the parameter's reference to its gradient tensor and avoids explicitly zero-filling that tensor. This generally reduces memory use and can modestly improve performance. Other references or an allocator's cache can retain the storage, leaving operating-system GPU-memory reports unchanged.[^pytorchZeroGrad2026]

It also changes optimization semantics. A parameter receiving no gradient remains `.grad = None`, and standard PyTorch optimizers skip it. An existing zero gradient still participates in an update: accumulated momentum or configured weight decay can move the parameter. Neither effect is inevitable when those terms are absent. For custom gradient inspection, check `p.grad is not None` before accessing its values.

Trace this step with exact arithmetic. Consider two symmetric sequences: `[1.0, 1.0]` has label `1` (`long_span`), and `[-1.0, -1.0]` has label `0` (`local_span`). Let $W$ be a 2x2 weight matrix where row 0 scores class 0 and row 1 scores class 1. Initializing $W = 0$ with zero bias yields logits `[0.0, 0.0]` for both sequences. The predicted class probabilities are `[0.5, 0.5]`, producing a cross-entropy loss of $-\log(0.5) \approx 0.6931$ for each row.

For cross-entropy loss with mean reduction, each row's gradient contribution to weight $W_{c,j}$ is $(p_c - y_c) \cdot x_j / N$, where $N=2$ is the batch size. Both sequences produce positive gradient values for class 0 weights and negative gradient values for class 1 weights, yielding an aggregate gradient matrix $dW = \begin{bmatrix} 0.5 & 0.5 \\ -0.5 & -0.5 \end{bmatrix}$. The bias gradients cancel to zero. `loss.backward()` leaves $W$ at zero while writing $dW$ into $W\text{.grad}$. Finally, SGD with learning rate $\eta = 0.2$ updates the weights:

$$
W_1 = W_0 - \eta \cdot dW = \begin{bmatrix} 0 & 0 \\ 0 & 0 \end{bmatrix} - 0.2 \cdot \begin{bmatrix} 0.5 & 0.5 \\ -0.5 & -0.5 \end{bmatrix} = \begin{bmatrix} -0.1 & -0.1 \\ 0.1 & 0.1 \end{bmatrix}.
$$

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Exact PyTorch optimizer update showing a two-sequence input matrix, zero initial weights, cross-entropy loss 0.6931, the gradient matrix written by backward, unchanged weights after backward, SGD weights after a 0.2 learning-rate step, and the resulting class logits." />
  <figcaption>In this zero-initialized batch, <code>backward()</code> fills <code>dW</code> while leaving <code>W</code> unchanged. With <span data-glossary="learning-rate">learning rate</span> <code>0.2</code>, <code>optimizer.step()</code> produces weights <code>[[-0.1, -0.1], [0.1, 0.1]]</code>, assigning <code>[+1, +1]</code> to class 1 and <code>[-1, -1]</code> to class 0.</figcaption>
</figure>

The arithmetic says `backward()` fills the gradient and `step()` moves the weights. The same two sequences verify that split in PyTorch.

<!-- leetllm: test, deps=torch, output=show, output_title="One optimizer update" -->

```python title="03-one-update.py"
import torch
from torch import nn

features = torch.tensor([[1.0, 1.0], [-1.0, -1.0]], dtype=torch.float32)
labels = torch.tensor([1, 0], dtype=torch.long)
model = nn.Linear(2, 2)
with torch.no_grad():
    model.weight.zero_()
    model.bias.zero_()

optimizer = torch.optim.SGD(model.parameters(), lr=0.2)
loss_fn = nn.CrossEntropyLoss()

before = model.weight.detach().clone()
optimizer.zero_grad(set_to_none=True)
loss = loss_fn(model(features), labels)
loss.backward()
gradient = model.weight.grad.detach().clone()
after_backward = model.weight.detach().clone()
optimizer.step()
after_step = model.weight.detach().clone()

print("loss:", round(loss.item(), 4))
print("gradient filled:", bool(gradient.abs().sum() > 0))
print("changed by backward:", not torch.equal(before, after_backward))
print("changed by step:", not torch.equal(before, after_step))
torch.testing.assert_close(gradient, torch.tensor([[0.5, 0.5], [-0.5, -0.5]]))
torch.testing.assert_close(after_step, torch.tensor([[-0.1, -0.1], [0.1, 0.1]]))
```

<!-- leetllm: output:start -->
```text title="One optimizer update" output compact
loss: 0.6931
gradient filled: True
changed by backward: False
changed by step: True
```
<!-- leetllm: output:end -->

The output confirms that phase separation: `loss.backward()` populated `.grad` without touching parameter values, and `optimizer.step()` moved the parameters. What happens if leftover gradients from an earlier iteration remain in `.grad` when the next `backward()` executes?

## Clearing gradients and micro-batch accumulation

PyTorch adds newly computed gradients into existing `.grad` buffers rather than overwriting them (`param.grad += new_grad`). That accumulation default is intentional: it enables **gradient accumulation**, letting multiple micro-batches build up an effective batch update when memory is constrained. In standard training where each mini-batch should trigger an independent step, failing to clear gradients causes stale derivatives to pollute future updates.

To observe this accumulation directly, differentiate $y = w^2$ twice at $w = 1.0$. The derivative is $\frac{dy}{dw} = 2w = 2.0$. Calling `backward()` a second time without clearing gradients adds another $2.0$, producing an accumulated gradient of $4.0$. Resetting `weight.grad = None` restores the clean single-step value:

<!-- leetllm: test, deps=torch, output=show, output_title="Accumulating gradients" -->

```python title="04-zero-grad.py"
import torch

weight = torch.tensor(1.0, requires_grad=True)

(weight**2).backward()
first_grad = weight.grad.item()

(weight**2).backward()
accumulated_grad = weight.grad.item()

weight.grad = None
(weight**2).backward()
cleared_grad = weight.grad.item()

print("first backward:", first_grad)
print("without clearing:", accumulated_grad)
print("after clearing:", cleared_grad)
```

<!-- leetllm: output:start -->
```text title="Accumulating gradients" output compact
first backward: 2.0
without clearing: 4.0
after clearing: 2.0
```
<!-- leetllm: output:end -->

Without clearing, the stored derivative doubles. Clearing before an independent batch's backward pass removes stale loss gradients. An optimizer with momentum still carries information from earlier updates in its own state.[^pytorchZeroGrad2026]

### Gradient accumulation across micro-batches

When a model or batch size exceeds available GPU memory, gradient accumulation lets you simulate a larger effective batch size $B_{\text{eff}} = K \times B_{\text{micro}}$ using $K$ smaller micro-batches of size $B_{\text{micro}}$.

The loss function usually averages errors over the current micro-batch: $L_k = \frac{1}{B} \sum_{i=1}^B \ell(x_{k,i}, y_{k,i})$. The true mean loss over the combined batch of $K \cdot B$ examples is:

$$
L_{\text{eff}} = \frac{1}{K \cdot B} \sum_{k=1}^K \sum_{i=1}^B \ell(x_{k,i}, y_{k,i}) = \frac{1}{K} \sum_{k=1}^K \left( \frac{1}{B} \sum_{i=1}^B \ell(x_{k,i}, y_{k,i}) \right) = \frac{1}{K} \sum_{k=1}^K L_k.
$$

For **equal-sized** micro-batches with a per-example mean loss, `(loss / K).backward()` recovers the combined mean gradient. Without division, that gradient is $K$ times larger. For plain SGD without other terms, this scales the immediate update like a $K$-times learning rate; clipping, momentum history, and Adam do not necessarily keep that equivalence.[^pytorchAmpExamples2026]

An incomplete accumulation window needs its actual denominator. With micro-batch sizes $n_k$, weight each mean by $n_k / \sum_j n_j$. Dividing two losses equally when their batches contain two rows and one row gives that trailing sequence too much influence. Comparing equal chunks against row weighting on a three-row batch shows the exact match:

<!-- leetllm: test, deps=torch, output=show, output_title="Unequal micro-batches" -->
```python title="04b-unequal-accumulation.py"
import copy
import torch
from torch import nn

features = torch.tensor([[1., 1.], [-1., -1.], [2., 1.]], dtype=torch.float64)
labels = torch.tensor([1, 0, 1])
base = nn.Linear(2, 2, dtype=torch.float64)
with torch.no_grad():
    base.weight.zero_()
    base.bias.zero_()
loss_fn = nn.CrossEntropyLoss()

full = copy.deepcopy(base)
loss_fn(full(features), labels).backward()

def accumulate(row_weighted):
    model = copy.deepcopy(base)
    chunks = [(features[:2], labels[:2]), (features[2:], labels[2:])]
    for xb, yb in chunks:
        weight = len(yb) / len(labels) if row_weighted else 1 / len(chunks)
        (weight * loss_fn(model(xb), yb)).backward()
    return model.weight.grad

equal_chunks = accumulate(False)
by_rows = accumulate(True)
print("full-batch class-0 gradient:", [round(x, 3) for x in full.weight.grad[0].tolist()])
print("equal-chunk class-0 gradient:", [round(x, 3) for x in equal_chunks[0].tolist()])
print("row weighting matches:", torch.allclose(by_rows, full.weight.grad))
torch.testing.assert_close(by_rows, full.weight.grad)
```

<!-- leetllm: output:start -->
```text title="Unequal micro-batches" output compact
full-batch class-0 gradient: [0.667, 0.5]
equal-chunk class-0 gradient: [0.75, 0.5]
row weighting matches: True
```
<!-- leetllm: output:end -->

That equivalence assumes unchanged weights across the window and matching per-example computations. BatchNorm statistics depend on each micro-batch, and Dropout draws can differ, so accumulation isn't generally identical to one physical large-batch forward pass. With weighted or ignored-label losses, use the loss's effective denominator rather than raw row counts. Step once per window and clear afterward. With AMP, keep one scale throughout the window, then unscale, clip, step, and update the scale once.

DDP normally synchronizes gradient buckets during backward. For accumulation, wrap **both forward and backward** for the first $K-1$ micro-batches in `model.no_sync()`; the final backward outside that context synchronizes the accumulated gradients. This suppresses gradient synchronization, not necessarily every distributed communication. Match the accumulation schedule across ranks.[^pytorchDdpDocs2026]

```checkpoint
What happens if `optimizer.zero_grad()` runs only once per epoch instead of once per mini-batch in standard training?
---
Each backward pass adds newly computed derivatives into existing `.grad` buffers. Later updates combine current gradients with stale gradients from earlier batches, destabilizing optimization. Reset inside the batch loop unless accumulation is deliberate.
```

One update on a small tensor batch verifies autograd mechanics, though it doesn't constitute a complete loop. We need abstractions to manage datasets and partition rows into mini-batches.

## Batching and row-weighted epoch loss

A **dataset** exposes samples and labels; it can read or generate them lazily. A **data loader** coordinates batching, optional worker processes, and sampling. For independent examples, shuffling changes the order across <span data-glossary="epoch">epochs</span> and reduces systematic ordering effects. Gradient diversity and oscillation also depend on the data, batches, model, and optimizer. Preserve meaningful sequence order when the task requires it.

Using our six sequences with `batch_size=4`, the data loader yields two batches: the first contains four rows, and the second contains the remaining two rows.

<!-- leetllm: test, deps=torch, output=show, output_title="Mini-batches" -->

```python title="05-dataloader.py"
import torch
from torch.utils.data import DataLoader, TensorDataset

features = torch.tensor(
    [
        [-2.0, -1.2],
        [-1.3, -0.8],
        [-0.8, -1.4],
        [0.9, 1.1],
        [1.4, 0.8],
        [1.8, 1.6],
    ],
    dtype=torch.float32,
)
labels = torch.tensor([0, 0, 0, 1, 1, 1], dtype=torch.long)
loader = DataLoader(TensorDataset(features, labels), batch_size=4, shuffle=False)

for batch_index, (xb, yb) in enumerate(loader, start=1):
    print(f"batch {batch_index}: shape={tuple(xb.shape)} labels={yb.tolist()}")
```

<!-- leetllm: output:start -->
```text title="Mini-batches" output compact
batch 1: shape=(4, 2) labels=[0, 0, 0, 1]
batch 2: shape=(2, 2) labels=[1, 1]
```
<!-- leetllm: output:end -->

The final batch contains only two rows. When calculating average loss across an epoch, don't simply average the reported batch loss numbers. Because batch sizes differ, taking an unweighted mean of batch averages assigns excessive influence to the smaller batch.

For this unweighted loss without ignored labels, multiply each batch mean by its row count and divide the sum by rows actually processed. Batches of size 4 and 2 with losses 0.20 and 0.50 yield $(4 \times 0.20 + 2 \times 0.50) / 6 = 0.30$, versus the incorrect equal-batch mean 0.35. Class weights and ignored labels can change the denominator.[^pytorchCrossEntropy2026] During training, this summarizes losses at changing weights, not a fresh evaluation of the final checkpoint.

With data loading in place, we can construct a minimal training loop. Before evaluating generalization on held-out data, we test whether the model can memorize a small, clean batch.

## Overfitting one batch as an isolation test

Before scaling up, run an **overfit-one-batch test** on a clean small batch the model has enough capacity to fit. Temporarily disable regularization that would obstruct memorization. If loss remains high, inspect labels, shapes, loss input dtypes, learning rate, and update ordering. Conflicting labels for identical inputs or insufficient capacity can prevent near-zero loss even with a correct loop.

We'll define a multi-layer classifier: `nn.Linear(2, 8)` expands the two inputs to eight hidden activations, `nn.ReLU()` introduces non-linearity by zeroing negative values, and `nn.Linear(8, 2)` produces class logits.

<!-- leetllm: test, deps=torch, output=show, output_title="Overfit one batch" -->

```python title="06-overfit-one-batch.py"
import torch
from torch import nn

torch.manual_seed(7)
features = torch.tensor(
    [
        [-2.0, -1.2], [-1.3, -0.8], [-0.8, -1.4], [-1.6, -0.4],
        [0.9, 1.1], [1.4, 0.8], [1.8, 1.6], [0.7, 1.7],
    ],
    dtype=torch.float32,
)
labels = torch.tensor([0, 0, 0, 0, 1, 1, 1, 1], dtype=torch.long)
model = nn.Sequential(nn.Linear(2, 8), nn.ReLU(), nn.Linear(8, 2))
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.15)

with torch.no_grad():
    initial_loss = loss_fn(model(features), labels).item()

for _ in range(120):
    optimizer.zero_grad(set_to_none=True)
    loss = loss_fn(model(features), labels)
    loss.backward()
    optimizer.step()

with torch.no_grad():
    final_logits = model(features)
    final_loss = loss_fn(final_logits, labels).item()
    accuracy = (final_logits.argmax(dim=1) == labels).float().mean().item()

print("initial loss:", round(initial_loss, 4))
print("final loss:", round(final_loss, 4))
print("memorized batch:", accuracy == 1.0)
```

<!-- leetllm: output:start -->
```text title="Overfit one batch" output compact
initial loss: 0.6521
final loss: 0.0056
memorized batch: True
```
<!-- leetllm: output:end -->

The loss drops from 0.6521 to 0.0056 and classification accuracy reaches 100%. This passes the basic wiring check. Now we can separate training from held-out validation.

## Isolating validation from training updates

Memorizing one batch verifies your training wiring; estimating generalization requires held-out validation data. Split the workflow into two phases:

- **Training phase:** Mini-batches flow forward, autograd constructs the computation graph, `loss.backward()` calculates derivatives, and `optimizer.step()` updates parameters.
- **Validation phase:** Held-out examples evaluate the current weights without updating parameters or recording gradient history.

Validation relies on two independent controls:

| Control | Responsibility |
|---|---|
| `model.eval()` | Configures layers like <span data-glossary="dropout">Dropout</span> and batch normalization (BatchNorm) for evaluation. |
| `torch.no_grad()` | Halts autograd graph construction, saving compute and memory. |

The script below trains on eight sequences and tracks validation loss across four held-out sequences over 60 epochs.

<!-- leetllm: test, deps=torch, output=show, output_title="Training and validation" -->

```python title="07-train-and-validate.py"
import copy
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

torch.manual_seed(7)
train_x = torch.tensor(
    [
        [-2.0, -1.2], [-1.3, -0.8], [-0.8, -1.4], [-1.6, -0.4],
        [0.9, 1.1], [1.4, 0.8], [1.8, 1.6], [0.7, 1.7],
    ],
    dtype=torch.float32,
)
train_y = torch.tensor([0, 0, 0, 0, 1, 1, 1, 1], dtype=torch.long)
val_x = torch.tensor([[-1.1, -0.6], [-0.5, -1.7], [1.0, 0.6], [1.7, 0.4]])
val_y = torch.tensor([0, 0, 1, 1], dtype=torch.long)

loader = DataLoader(TensorDataset(train_x, train_y), batch_size=4, shuffle=True)
model = nn.Sequential(nn.Linear(2, 8), nn.ReLU(), nn.Linear(8, 2))
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.15)
best_loss = float("inf")
best_state = None
best_epoch = None

for epoch in range(1, 61):
    model.train()
    train_total = 0.0
    train_count = 0
    for xb, yb in loader:
        optimizer.zero_grad(set_to_none=True)
        loss = loss_fn(model(xb), yb)
        if not torch.isfinite(loss):
            raise RuntimeError(f"non-finite training loss at epoch {epoch}")
        loss.backward()
        optimizer.step()
        train_total += loss.item() * len(yb)
        train_count += len(yb)

    model.eval()
    with torch.no_grad():
        val_logits = model(val_x)
        val_loss = loss_fn(val_logits, val_y).item()
    if not torch.isfinite(torch.tensor(val_loss)):
        raise RuntimeError(f"non-finite validation loss at epoch {epoch}")

    if val_loss < best_loss:
        best_loss = val_loss
        best_epoch = epoch
        best_state = copy.deepcopy(model.state_dict())

assert best_state is not None
model.load_state_dict(best_state)
model.eval()
with torch.no_grad():
    selected_accuracy = (model(val_x).argmax(dim=1) == val_y).float().mean().item()

print("best validation loss:", round(best_loss, 4))
print("selected epoch:", best_epoch)
print("selected validation accuracy:", round(selected_accuracy, 3))
print("saved tensors:", len(best_state))
```

<!-- leetllm: output:start -->
```text title="Training and validation" output compact
best validation loss: 0.0118
selected epoch: 60
selected validation accuracy: 1.0
saved tensors: 4
```
<!-- leetllm: output:end -->

### The checkpoint snapshot aliasing trap

Notice `copy.deepcopy(model.state_dict())` when validation improves. A plain `best_state = model.state_dict()` is a shallow snapshot whose tensors share live parameter and persistent-buffer storage. Subsequent in-place updates change those values. Deep-copy the state or serialize it immediately to preserve the selected checkpoint.[^pytorchSavingLoading2026]

We can demonstrate this reference leak directly:

<!-- leetllm: test, deps=torch, output=show, output_title="Snapshot independence" -->

```python title="07b-checkpoint-snapshot.py"
import copy
import torch
from torch import nn

model = nn.Linear(2, 2)
with torch.no_grad():
    model.weight.zero_()

aliased = model.state_dict()
snapshot = copy.deepcopy(model.state_dict())
with torch.no_grad():
    model.weight.add_(1.0)

print("plain state followed the update:", torch.equal(aliased["weight"], model.weight))
print("copied state stayed at zero:", torch.count_nonzero(snapshot["weight"]).item() == 0)
```

<!-- leetllm: output:start -->
```text title="Snapshot independence" output compact
plain state followed the update: True
copied state stayed at zero: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/train_eval_checkpoint_loop_dark.png" alt="Measured training and validation cross-entropy for all 60 epochs of the CPU classification run on a logarithmic loss axis. Validation falls from 0.535825 to 0.011815, selecting epoch 60. Training loss averages batches during updates; validation measures frozen end-of-epoch weights." />
  <figcaption>In this seeded run, validation loss falls from <code>0.535825</code> at epoch 1 to <code>0.011815</code> at epoch 60, which becomes the selected checkpoint with held-out accuracy <code>1.0</code>. Validation uses <code>eval()</code> and <code>no_grad()</code>; it never calls <code>backward()</code> or <code>step()</code>.</figcaption>
</figure>

These four validation sequences select the checkpoint, so their reported 100% accuracy isn't an independent test of that selection. Use an untouched test set for the final estimate and a representative deployment evaluation. The loop calls `model.eval()` even without mode-sensitive layers; adding Dropout makes its purpose visible.

## Operational modes and context managers

In a network composed strictly of linear transformations and ReLU activations, `model.train()` and `model.eval()` yield identical outputs because neither layer maintains mode-dependent state. In production architectures, however, several layers change their behavior across modes:
- **Dropout:** For $0 \leq p < 1$, training zeroes activations randomly and scales survivors by $1/(1-p)$. Evaluation is identity. At $p=1$, training zeroes everything.
- **BatchNorm:** With default `track_running_stats=True`, training uses batch statistics and updates running buffers; evaluation uses the running statistics. With `track_running_stats=False`, it uses batch statistics in both modes. A cumulative average is also possible with `momentum=None`.[^pytorchBatchNorm2d2026]
- **LayerNorm:** It normalizes each input over the trailing dimensions specified by `normalized_shape`, often hidden features. The layer itself has the same computation in both modes.

The snippet below introduces Dropout to our classifier, runs the same input sequence twice in training mode, and then runs it twice in evaluation mode.

<!-- leetllm: test, deps=torch, output=show, output_title="Train mode versus eval mode" -->

```python title="08-train-eval-modes.py"
import torch
from torch import nn

torch.manual_seed(0)
model = nn.Sequential(nn.Linear(2, 6), nn.ReLU(), nn.Dropout(p=0.5), nn.Linear(6, 2))
sequence = torch.tensor([[1.2, 0.9]])

model.train()
train_a = model(sequence)
train_b = model(sequence)

model.eval()
with torch.no_grad():
    eval_a = model(sequence)
    eval_b = model(sequence)

print("training outputs equal:", torch.equal(train_a, train_b))
print("evaluation outputs equal:", torch.equal(eval_a, eval_b))
```

<!-- leetllm: output:start -->
```text title="Train mode versus eval mode" output compact
training outputs equal: False
evaluation outputs equal: True
```
<!-- leetllm: output:end -->

This seeded pair differs in training mode. Two Dropout calls can sample the same mask and produce identical outputs. `model.eval()` controls layer behavior, while `torch.no_grad()` controls graph recording.

```checkpoint
What separate jobs do `model.eval()` and `torch.no_grad()` do in ordinary loss-only validation?
---
Evaluation mode selects each layer's evaluation behavior; no-grad suppresses reverse-mode graph recording. Neither replaces the other. Inference mode can replace no-grad when its tensor restrictions are acceptable. Gradient-based attribution or robustness evaluation needs a different evaluation loop.
```

Saving weights to disk produces the deployable artifact. Checkpoints also protect ongoing training against sudden hardware faults and preemption.

## Resilient checkpointing and atomic state snapshots

Save a reloadable artifact with its architecture, feature schema, and label mapping. Prefer a `state_dict` over `torch.save(model, path)` for this workflow. Whole-module pickling records references to Python classes and import paths; it doesn't package their class definitions, and refactoring those paths can break loading.[^pytorchSavingLoading2026]

The model's **state dictionary** normally contains named parameter and persistent-buffer tensors; custom modules can also attach extra state. It doesn't automatically capture architecture code, ordinary Python attributes, or accumulated gradients.

### The complete resumption bundle

For resumption, identify the state your particular loop needs. At an update step or epoch end, a typical bundle includes:

1. `model_state_dict`: Trainable parameters and persistent buffers (such as BatchNorm running stats).
2. `optimizer_state_dict`: Adam moments and counters, or SGD momentum if configured. Omitting them changes subsequent updates; degraded convergence or oscillation isn't inevitable.[^pytorchSavingLoading2026]
3. `lr_scheduler_state_dict`: Current learning rate step counter and cycle phase.
4. `scaler_state_dict`: The dynamic loss scale factor and consecutive finite step count when using Automatic Mixed Precision.
5. `rng_state`: Current states of every RNG used, including PyTorch CPU/CUDA, Python, NumPy, and explicit DataLoader generators. A seed restarts a sequence; it doesn't restore the current position.[^pytorchReproducibility2026]
6. Metadata: The epoch index, global step count, validation metrics, git commit hash, and dataset split identifier.

Mid-epoch resumption can also require sampler position, worker/stream state, and buffered data. Mid-window gradient accumulation needs accumulated gradients or a replay of the unfinished window; `state_dict()` doesn't include parameter `.grad`. Even with these states, bit-for-bit continuation depends on compatible software, hardware, and deterministic operations. Saving at a clean optimizer update makes recovery easier to reason about.

### Preventing corruption with atomic file writes

If a process is interrupted while overwriting its only checkpoint, that file may be truncated or incomplete. Reloading can raise an EOF, ZIP/archive, or other serialization error. The exact message depends on the format and damaged bytes. Keeping older checkpoints limits how much progress one failed save can lose.

To make checkpointing resilient against preemption, write atomically:

1. Serialize to a staging file in the destination directory.
2. Flush Python buffers and `os.fsync` the staging file. Check for failures.
3. Successfully replace the destination with `os.replace`. POSIX requires an atomic rename, so readers see the old file or the completed replacement. If there was no previous checkpoint, interruption before replacement can leave no final file.
4. On Linux, sync the parent directory too so the renamed directory entry reaches storage.[^pythonOs2026][^linuxFsync2026]

On Linux, syncing the parent directory ensures the rename itself reaches storage, and using unique staging names avoids collisions when concurrent writers exist.

<figure>
  <img src="illustrations/_generated/atomic_checkpointing_dark.png" alt="Checkpoint state and save strategy comparison. Direct overwrite can damage the previous file; staging, file sync, and successful atomic replacement protect the live path during a process interruption. Linux directory sync addresses rename durability. RNG states and data-loader progress are distinct from starting seeds." />
  <figcaption>Store the state needed by the loop, stage the save, then replace the live path. Atomic rename prevents readers seeing a half-written replacement; directory sync and storage guarantees determine durability.</figcaption>
</figure>

Keep `weights_only=True` explicit in `torch.load` so unpickling stays restricted to tensors and standard container types rather than executing arbitrary Python code.[^pytorchSerialization2026] If a full resumption bundle includes custom objects such as NumPy RNG states, serialize them in a plain format or allowlist them explicitly.

The next example reloads both weights and SGD momentum, compares the **next update** against a weights-only copy that omits momentum, and simulates a crash mid-staging to confirm the live checkpoint stays intact:

<!-- leetllm: test, deps=torch, output=show, output_title="Reloaded checkpoint" -->

```python title="09-save-and-reload.py"
import os
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

import torch
from torch import nn

torch.manual_seed(11)
features = torch.tensor([[-1.5, -1.0], [-0.9, -1.2], [1.1, 0.8], [1.6, 1.4]])
labels = torch.tensor([0, 0, 1, 1], dtype=torch.long)
model = nn.Linear(2, 2)
optimizer = torch.optim.SGD(model.parameters(), lr=0.2, momentum=0.9)
loss_fn = nn.CrossEntropyLoss()

for _ in range(80):
    optimizer.zero_grad(set_to_none=True)
    loss = loss_fn(model(features), labels)
    loss.backward()
    optimizer.step()

model.eval()
with torch.no_grad():
    original_logits = model(features)
    original = original_logits.argmax(dim=1)

with TemporaryDirectory() as directory:
    final_path = Path(directory) / "model-ckpt.pt"
    tmp_path = Path(directory) / "model-ckpt.pt.tmp"

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "model_config": {"in_features": 2, "out_features": 2},
        "feature_names": ["local_score", "span_score"],
        "label_names": ["local_span", "long_span"],
        "training_steps": 80,
    }

    with open(tmp_path, "wb") as f:
        torch.save(checkpoint, f)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_path, final_path)
    if sys.platform.startswith("linux"):
        directory_fd = os.open(final_path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)

    previous_bytes = final_path.read_bytes()
    try:
        with open(tmp_path, "wb") as f:
            f.write(b"incomplete replacement")
            raise RuntimeError("simulated interruption before replace")
    except RuntimeError as error:
        assert str(error) == "simulated interruption before replace"
    staging_failure_preserved_live = final_path.read_bytes() == previous_bytes
    assert staging_failure_preserved_live

    loaded = torch.load(final_path, map_location="cpu", weights_only=True)
    restored = nn.Linear(**loaded["model_config"])
    restored.load_state_dict(loaded["model_state_dict"])
    restored_optimizer = torch.optim.SGD(restored.parameters(), lr=0.2, momentum=0.9)
    restored_optimizer.load_state_dict(loaded["optimizer_state_dict"])
    weights_only = nn.Linear(**loaded["model_config"])
    weights_only.load_state_dict(loaded["model_state_dict"])
    fresh_optimizer = torch.optim.SGD(weights_only.parameters(), lr=0.2, momentum=0.9)
    restored.eval()
    with torch.no_grad():
        reloaded_logits = restored(features)
        reloaded = reloaded_logits.argmax(dim=1)

torch.testing.assert_close(original_logits, reloaded_logits)
for candidate, candidate_optimizer in (
    (model, optimizer), (restored, restored_optimizer), (weights_only, fresh_optimizer)
):
    candidate.train()
    candidate_optimizer.zero_grad(set_to_none=True)
    loss_fn(candidate(features), labels).backward()
    candidate_optimizer.step()
for parameter, restored_parameter in zip(model.parameters(), restored.parameters()):
    torch.testing.assert_close(parameter, restored_parameter)

print("classes:", original.tolist())
print("reload agrees:", torch.equal(original, reloaded))
print("labels:", loaded["label_names"])
print("has optimizer state:", "optimizer_state_dict" in loaded)
print("next update agrees:", all(torch.equal(a, b) for a, b in zip(model.parameters(), restored.parameters())))
print("weights-only next update agrees:", all(torch.equal(a, b) for a, b in zip(model.parameters(), weights_only.parameters())))
print("staging failure preserved live file:", staging_failure_preserved_live)
```

<!-- leetllm: output:start -->
```text title="Reloaded checkpoint" output compact
classes: [0, 0, 1, 1]
reload agrees: True
labels: ['local_span', 'long_span']
has optimizer state: True
next update agrees: True
weights-only next update agrees: False
staging failure preserved live file: True
```
<!-- leetllm: output:end -->

The reloaded logits match, and the fully restored copy takes the exact same next momentum update on a fixed batch. The weights-only copy starts at identical weights yet diverges on the very next step because its momentum history is gone, while the interrupted staging write leaves the live checkpoint untouched.

## Diagnosing failures and clipping gradients

When a training script runs without throwing exceptions, subtle bugs can still compromise learning. Use this triage matrix to isolate root causes:

| Symptom | Likely cause | Diagnostic check |
|---|---|---|
| Target shape error in `CrossEntropyLoss` | Hard-label targets have float dtype or shape `(batch, 1)`. | Use 1D integer tensors with shape `(batch,)` and dtype `torch.long`. |
| Loss drops on one batch, but held-out accuracy fails | Overfitting, data distribution shift, or label noise. | Verify preprocessing consistency across data splits. |
| Inconsistent predictions during validation | Model left in training mode with active Dropout or BatchNorm. | Call `model.eval()` before running validation loops. |
| Gradients grow larger on each batch | Gradients aren't reset before backward passes. | Call `optimizer.zero_grad(set_to_none=True)` inside the batch loop. |
| GPU memory grows while collecting losses | History holds device tensors and graph references; unfinished or retained graphs can also hold saved activations. | Store `loss.item()` scalars for scalar reports; inspect whether backward is delayed or uses `retain_graph=True`. |
| Loss becomes `NaN` or `Inf` | Exploding gradients, extreme inputs, or numerical overflow. | Check inputs, logits, and parameter gradients for non-finite values. |

Ordinary backward releases its saved tensors; appending a loss afterward doesn't necessarily retain all its forward activations. It still keeps the loss tensor and graph references alive. Detaching removes graph history but leaves a tensor on its current device. For scalar reporting, `.item()` produces a Python number; on CUDA, that read can wait for GPU work, so choose a reporting cadence separately from the update loop.[^pytorch2026autograd][^pytorchCudaSemantics2026]

### Five-step numerical triage when loss becomes NaN

When loss becomes non-finite, don't immediately reduce the learning rate blindly. Follow this ordered diagnostic sequence to find the earliest invalid value:
1. **Inputs:** Check raw batch inputs (`torch.isfinite(xb).all()`). Unsanitized nulls or extreme feature values corrupt the forward pass immediately.
2. **Logits:** Check model output scores (`torch.isfinite(logits).all()`). If inputs are finite but logits are `NaN`, examine numerical stability in custom layers or activations.
3. **Loss:** Check `torch.isfinite(loss)`, then target values, weights, masks, and reductions. All-ignored targets can give an undefined mean; finite extreme logits can overflow a loss difference. Out-of-range hard targets ordinarily raise an indexing error instead of explaining every `Inf`.
4. **Gradients:** After backward (and AMP unscaling), check `torch.isfinite(p.grad).all()` only where `p.grad is not None`. Loss and gradient finiteness are separate checks; inspect both.
5. **Parameters:** After `optimizer.step()`, check updated weights (`torch.isfinite(p).all()`).

### Clipping gradients with global norm clipping

When dealing with deep recurrent networks or transformer architectures, gradient vectors can intermittently surge in magnitude. **Gradient clipping** caps the gradient norm before the optimizer applies parameter updates.

PyTorch's `nn.utils.clip_grad_norm_` calculates the total $\ell_2$ norm across all model parameters concatenated into a single vector:

$$
g_{\text{norm}} = \sqrt{\sum_{p \in \Theta} \|\nabla_p L\|_2^2}.
$$

If $g_{\text{norm}}$ exceeds `max_norm`, the function scales all gradients down proportionally:

$$
\nabla_p L \leftarrow \nabla_p L \cdot \frac{\text{max\_norm}}{\max(g_{\text{norm}}, \text{max\_norm})}.
$$

For a finite nonzero gradient and positive bound, global norm clipping rescales all components together, preserving their direction up to rounding. The expression above is the ideal rule; PyTorch's implementation uses a small denominator epsilon. Value clipping clamps individual entries and can change direction.[^pytorchClipGrad2026] Clipping bounds the gradient, not every optimizer's parameter displacement: momentum, Adam, and weight decay can transform the update.

<!-- leetllm: test, deps=torch, output=show, output_title="Gradient clipping check" -->

```python title="10-gradient-clipping.py"
import torch
from torch import nn

parameter = nn.Parameter(torch.tensor([3.0, 4.0]))
parameter.grad = torch.tensor([6.0, 8.0])

before = torch.linalg.vector_norm(parameter.grad).item()
reported_norm = nn.utils.clip_grad_norm_([parameter], max_norm=5.0, error_if_nonfinite=True).item()
after = torch.linalg.vector_norm(parameter.grad).item()

print("norm before:", round(before, 1))
print("reported norm:", round(reported_norm, 1))
print("norm after:", round(after, 1))
print("finite:", torch.isfinite(parameter.grad).all().item())
```

<!-- leetllm: output:start -->
```text title="Gradient clipping check" output compact
norm before: 10.0
reported norm: 10.0
norm after: 5.0
finite: True
```
<!-- leetllm: output:end -->

`error_if_nonfinite=True` raises when the computed total norm is non-finite, including overflow while combining otherwise finite values. Check the optimizer update separately to confirm that it remains finite.

## Inference mode versus no-grad contexts

During deployment or batch inference, the model generates predictions without ever calculating gradients. Autograd tracking is entirely unnecessary.

PyTorch offers two context managers for non-gradient execution:
- `torch.no_grad()` suppresses reverse-mode graph recording while retaining ordinary tensor tracking. Its outputs can later be used as constants in a recorded computation.
- `torch.inference_mode()` removes additional view/version tracking for inference tensors and disables forward-mode AD too. Those tensors are restricted when a later recorded computation needs to save them for backward. Use it for isolated inference; use no-grad when outputs feed training. Benchmark any speed gain rather than assuming one.[^pytorchInferenceMode2026]

Neither context switches the model to evaluation mode. For example, extracting frozen features with inference mode and multiplying them by trainable weights can raise `Inference tensors cannot be saved for backward`. Extract with no-grad, or clone the inference tensor **outside** that context to create an ordinary tensor.

<!-- leetllm: test, deps=torch, output=show, output_title="Inference check" -->

```python title="11-inference-mode.py"
import torch
from torch import nn

model = nn.Linear(2, 2)
with torch.no_grad():
    model.weight.copy_(torch.tensor([[-0.1, -0.1], [0.1, 0.1]]))
    model.bias.zero_()
model.eval()
sequence = torch.tensor([[1.5, 1.2]])

with torch.inference_mode():
    logits = model(sequence)
    prediction = logits.argmax(dim=1).item()

print("gradient tracking:", logits.requires_grad)
print("logits:", [round(value, 2) for value in logits[0].tolist()])
print("predicted class:", prediction)

head = nn.Linear(2, 2)
try:
    head(logits).sum().backward()
except RuntimeError as error:
    if "Inference tensors cannot be saved for backward" not in str(error):
        raise
    print("inference features rejected by trainable head:", True)
else:
    raise AssertionError("expected the head to reject inference tensors")

ordinary_features = logits.clone()  # Outside inference_mode.
head(ordinary_features).sum().backward()
assert head.weight.grad is not None and torch.isfinite(head.weight.grad).all()
print("cloned features permit head backward:", True)
```

<!-- leetllm: output:start -->
```text title="Inference check" output compact
gradient tracking: False
logits: [-0.27, 0.27]
predicted class: 1
inference features rejected by trainable head: True
cloned features permit head backward: True
```
<!-- leetllm: output:end -->

The prediction path needs no gradients, but the separate trainable head does. The clone restores an ordinary tensor without recreating a gradient path through the frozen classifier. Using `no_grad()` for extraction would also produce ordinary features without this repair. Next, we swap numerical precision during training.

## Automatic mixed precision and dynamic loss scaling

Our eager examples use float32 parameters and arithmetic. Compatible GPUs can run suitable lower-precision matrix operations faster. A float16/BF16 activation tensor has half the float32 payload, but total training memory also includes parameters, gradients, optimizer state, and other tensors; AMP doesn't halve all of it.

**Automatic Mixed Precision** (AMP) applies device-specific operation casting rules. CUDA autocast runs matrix multiplications in float16 or BF16 while keeping sensitive reductions like cross-entropy in float32. Keep stored model parameters in float32 so autocast casts inputs for eligible operations while updates stay full precision.[^micikevicius2018][^pytorchAmpDocs2026]

### The float16 underflow hazard and GradScaler

Float16 has 5 exponent bits and 10 stored fraction bits. Its smallest positive normal value is $2^{-14} \approx 6.1 \times 10^{-5}$ (with subnormals reaching $2^{-24} \approx 5.96 \times 10^{-8}$), so tiny backward gradients can flush to zero before updating float32 weights.[^pytorchTypeInfo2026]

`torch.amp.GradScaler` counters underflow through dynamic loss scaling:
1. **Forward pass:** Run inside `torch.amp.autocast('cuda')`, keeping `CrossEntropyLoss` in `float32`.
2. **Loss scaling:** Multiply the loss by a dynamic factor $S$ (initially `65,536`) so $\nabla_W(SL) = S\nabla_W L$ lifts tiny gradients into float16 range.
3. **Backward pass:** Calling `scaler.scale(loss).backward()` computes scaled gradients ($S \cdot \nabla W$).
4. **Unscaling before clipping:** Call `scaler.unscale_(optimizer)` once after accumulation and before clipping. Clipping before unscaling with $S=65,536$ and `max_norm=1` imposes an effective bound of $1/65,536$ instead of `1`.
5. **Conditional optimizer step:** `scaler.step(optimizer)` applies the update only if all unscaled gradients are finite, skipping the step on overflow.
6. **Dynamic scale update:** A non-finite step halves $S$ and resets the growth counter; 2,000 consecutive finite steps double $S$.[^pytorchGradScalerSource2026]

<figure>
  <img src="illustrations/_generated/amp_mixed_precision_dataflow_dark.png" alt="CUDA float16 autocast pattern with float32 stored parameters, operation-specific forward dtypes, scaled backward, unscaling before optional clipping, and finite versus non-finite update branches. Defaults keep the scale fixed on ordinary finite steps, double it after 2000 successful iterations, and halve it after a non-finite event." />
  <figcaption>Autocast chooses operation dtypes; GradScaler manages scaled backward and conditional stepping. Scaling mitigates float16 underflow, while the non-finite check determines whether this optimizer step proceeds.</figcaption>
</figure>

BF16 has the same exponent width as float32, making float16-style range problems much less likely. It still has finite range and less significand precision; it doesn't eliminate underflow, overflow, or rounding. BF16 autocast commonly runs without loss scaling. That differs from manually casting every model parameter to BF16.

<!-- leetllm: test, deps=torch, output=show, output_title="AMP-compatible step" -->

```python title="12-amp-ordering-pattern.py"
import torch
from torch import nn

torch.manual_seed(7)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
use_amp = device.type == "cuda"
model = nn.Linear(2, 2).to(device)
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
loss_fn = nn.CrossEntropyLoss()
xb = torch.tensor([[1.2, 0.8], [-1.0, -0.7]], device=device)
yb = torch.tensor([1, 0], dtype=torch.long, device=device)
scaler = torch.amp.GradScaler("cuda", enabled=use_amp)
before = [parameter.detach().clone() for parameter in model.parameters()]

optimizer.zero_grad(set_to_none=True)
with torch.amp.autocast("cuda", dtype=torch.float16, enabled=use_amp):
    logits = model(xb)
    loss = loss_fn(logits, yb)

scaler.scale(loss).backward()
scaler.unscale_(optimizer)
grad_norm = torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
scaler.step(optimizer)
scaler.update()

changed = any(not torch.equal(old, new) for old, new in zip(before, model.parameters()))
print("AMP enabled:", use_amp)
print("finite loss:", bool(torch.isfinite(loss)))
print("finite unscaled gradient norm:", bool(torch.isfinite(grad_norm)))
print("parameters changed:", changed)
```

<!-- leetllm: output:start -->
```text title="AMP-compatible step" output compact
AMP enabled: False
finite loss: True
finite unscaled gradient norm: True
parameters changed: True
```
<!-- leetllm: output:end -->

On CPU, `enabled=False` acts as a transparent pass-through: `autocast` is a no-op, `scaler.scale(loss)` returns the raw loss, `unscale_` does nothing, and `scaler.step(optimizer)` executes `optimizer.step()` directly.

## Graph compilation after eager verification

`torch.compile` captures compilable regions through TorchDynamo and sends them to a selected backend. The default backend, TorchInductor, generates optimized kernels and can fuse operations; other backends behave differently.[^ansel2024pytorch2][^pytorch2026compile]

Compilation can improve steady-state performance, but startup cost, graph breaks, shapes, and workload can outweigh the gain. It doesn't repair a faulty loop or a leaked validation split. Check eager correctness first.

The next smoke check uses `backend="eager"` and `fullgraph=True`: capture this forward pass as one graph, then execute it with ordinary PyTorch operations. It tests capture and one output comparison, not Inductor performance or an entire training loop. Inductor can also compile CPU code.

<!-- leetllm: test, deps=torch,numpy, output=show, output_title="Compile after eager" -->

```python title="13-compile-after-eager.py"
import torch
from torch import nn

torch.manual_seed(0)
eager = nn.Linear(2, 2)
compiled = torch.compile(eager, backend="eager", fullgraph=True)
sequence = torch.tensor([[1.2, 0.8]])

eager_logits = eager(sequence)
compiled_logits = compiled(sequence)
print("compiled module:", type(compiled).__name__)
print("logits match eager:", torch.allclose(eager_logits, compiled_logits))
```

<!-- leetllm: output:start -->
```text title="Compile after eager" output compact
compiled module: OptimizedModule
logits match eager: True
```
<!-- leetllm: output:end -->

With the default `fullgraph=False`, graph breaks normally resume Python execution and can cost performance; with `fullgraph=True`, a break raises an error. For discrepancies, compare seeds and stochastic draws, layer modes, dtypes, tolerances, and backend behavior, then isolate capture versus code generation. Fused arithmetic can differ by rounding. Benchmark steady-state iterations separately from compilation.[^pytorch2026compiletroubleshooting]

When combining compiled training with AMP, also check whether the backward pass runs inside or outside autocast (controlled by `torch._functorch.config.backward_pass_autocast`).[^pytorchAmpDocs2026]

## Records and lineage for the training run

A saved weight file doesn't show whether validation was isolated, or which rows produced the loss curve. Keep these records with the run:

| Artifact component | Purpose |
|---|---|
| Model architecture and optimizer config | Documents exact model hyperparameters and optimizer settings. |
| Epoch loss trajectories (train vs validation) | Distinguishes steady optimization from overfitting or divergence. |
| Selected checkpoint and metric criteria | Identifies the exact epoch weights promoted to serving. |
| Feature schema and label mappings | Ensures inference preprocessing matches the training tensor format. |
| Dataset split identifier and git commit | Documents data lineage and code version; split construction and checks must still prevent leakage. |

## Practice: break and repair the loop

Break one step in the runnable examples, then verify how each change alters the printed state:

1. In `03-one-update.py`, comment out `optimizer.step()` and check whether `changed by step` stays `True`.
2. In `04-zero-grad.py`, invoke `backward()` three times before clearing gradients and compute the resulting gradient magnitude.
3. In `07b-checkpoint-snapshot.py`, replace `copy.deepcopy(...)` with `model.state_dict()` and trace which printed check changes when live weights change.
4. In `08-train-eval-modes.py`, leave the model in training mode during the second pair of forward passes and test whether repeated passes match.
5. In `12-amp-ordering-pattern.py`, explain why calling `scaler.unscale_(optimizer)` before `clip_grad_norm_` is required.
6. In `13-compile-after-eager.py`, modify an eager weight after calling `torch.compile` and check whether compiled output changes.

### Expected observations

1. Without `optimizer.step()`, autograd populates `.grad`, but parameter values remain unchanged (`changed by step: False`).
2. The gradient accumulates to `6.0`: each backward pass adds another derivative of `2.0` into `.grad`.
3. `copied state stayed at zero` evaluates to `False`. Both dictionaries reference live parameter storage, so both follow the weight update.
4. The seeded training-mode pair differs here. Dropout can sample identical masks on repeated passes; inspect `model.training` to verify the active mode.
5. Clipping scaled gradients applies the wrong unscaled bound, approximately `max_norm / S`. When a large $S$ makes clipping activate, that can make the gradient much too small; it does not have to make it exactly zero.
6. `torch.compile` wraps the original module rather than copying weights, so in-place edits to eager parameters reflect immediately in compiled outputs.

```mastery-quiz
[
  {
    "question": "A three-class head produces logits shaped [5,3]. Targets are five hard class indices. Which loss input/target pair matches CrossEntropyLoss?",
    "options": [
      "Raw logits; floating targets [5].",
      "Log-probabilities; long targets [5,1].",
      "Raw logits; long targets [5].",
      "Softmax values; long targets [5]."
    ],
    "answer": "Raw logits; long targets [5].",
    "explanation": "For hard-index cross entropy, use raw logits and one long target per row. Floating soft targets instead need the full [5,3] distribution shape. A second softmax changes the objective."
  },
  {
    "question": "Two symmetric training rows are [2,1]→class1 and [−2,−1]→class0. W and bias start at zero. Mean CE gives dW=[[1,0.5],[−1,−0.5]]. With plain SGD learning rate 0.1, which backward/step states follow?",
    "options": [
      "Backward W=0; step W=[[-0.1,−0.05],[0.1,0.05]].",
      "Backward W=dW; step W=[[-0.1,−0.05],[0.1,0.05]].",
      "Backward W=0; step W=[[−1,−0.5],[1,0.5]].",
      "Backward W=0; step W=[[0.1,0.05],[−0.1,−0.05]]."
    ],
    "answer": "Backward W=0; step W=[[-0.1,−0.05],[0.1,0.05]].",
    "explanation": "Backward accumulates dW while leaving W unchanged. SGD applies W−0.1×dW. Bias gradients cancel for this symmetric batch."
  },
  {
    "question": "Two microbatches contain three rows and one row, with mean scalar gradients +2 and −2. Weights remain fixed and per-example computations match. Which weights and combined gradient recover the row mean?",
    "options": [
      "Weights 1/2,1/2; gradient 0.",
      "Weights 3/4,1/4; gradient 1.",
      "Weights 3/4,1/4; gradient 2.",
      "Weights 3,1; gradient 4."
    ],
    "answer": "Weights 3/4,1/4; gradient 1.",
    "explanation": "The full mean is (3×2+1×−2)/4=1. Equal chunk weighting gives zero and overweights the short microbatch. Effective loss denominators can differ from row counts for weighted or ignored targets."
  },
  {
    "question": "A robustness evaluation needs input gradients while retaining Dropout identity and BatchNorm running-statistic behavior. Which mode/graph pair matches that requirement?",
    "options": [
      "train mode; autograd enabled.",
      "eval mode; no-grad context.",
      "train mode; inference-mode context.",
      "eval mode; autograd enabled."
    ],
    "answer": "eval mode; autograd enabled.",
    "explanation": "Eval controls layer behavior and is orthogonal to graph recording. This evaluation intentionally needs derivatives, unlike ordinary loss-only validation, so it keeps autograd enabled."
  },
  {
    "question": "After an optimizer update, scalar weight is 3 and SGD momentum is 0.8. Next gradient is −0.2, coefficient 0.5 and learning rate 0.1. Which fully restored/fresh-momentum next weights follow?",
    "options": [
      "Restored 2.92; fresh 3.02.",
      "Restored 2.98; fresh 2.98.",
      "Restored 2.98; fresh 3.02.",
      "Restored 3.02; fresh 2.98."
    ],
    "answer": "Restored 2.98; fresh 3.02.",
    "explanation": "Restored momentum is 0.5×0.8−0.2=0.2, giving 3−0.1×0.2=2.98. A new buffer starts with −0.2 and gives 3.02. Matching initial weights or logits does not guarantee identical next updates."
  },
  {
    "question": "A single local writer fully writes, flushes and file-syncs a new checkpoint, then successfully replaces the live path. It raises before syncing the parent directory. Which visibility and tested-durability conclusion follows?",
    "options": [
      "Old live bytes remain; power-loss durability is untested.",
      "New live bytes are visible; power-loss durability is verified.",
      "No live bytes remain; power-loss durability is verified.",
      "New live bytes are visible; power-loss durability is untested."
    ],
    "answer": "New live bytes are visible; power-loss durability is untested.",
    "explanation": "Successful replacement has already changed the live path atomically to the new complete file. The later exception does not undo it. Parent-directory sync was not reached, and this controlled process exception is not a power-loss test; storage guarantees still matter."
  },
  {
    "question": "A PyTorch loop computes loss = w.square() + offset at w = −4. The offset is a constant tensor containing +Inf. Starting with w.grad cleared, you run loss.backward() once to diagnose the batch. What loss and gradient do you find, and what should you do next?",
    "options": [
      "Loss +Inf, gradient +Inf. Skip the update and inspect the offset.",
      "Loss +Inf, gradient −8. Apply the optimizer update.",
      "Loss +Inf, gradient −8. Skip the update and inspect the offset.",
      "Loss +Inf, gradient +8. Apply the optimizer update."
    ],
    "answer": "Loss +Inf, gradient −8. Skip the update and inspect the offset.",
    "explanation": "The square gives 16, and adding +Inf makes the loss infinite. During backward, addition passes a gradient of 1 to the square, which gives 2 × (−4) = −8. A gradient of +Inf copies the forward loss into the gradient. A gradient of +8 drops the sign of w. Stepping on the finite gradient would let the invalid loss pass unchecked. Skip this update and trace the source of the offset."
  },
  {
    "question": "A true gradient has norm 4 and is loss-scaled by 32. An author clips the scaled norm to 2, then unscales. What wrong-order and correct-order final norms follow?",
    "options": [
      "Wrong 0.0625; correct 2.",
      "Wrong 2; correct 0.0625.",
      "Wrong 64; correct 2.",
      "Wrong 0; correct 4."
    ],
    "answer": "Wrong 0.0625; correct 2.",
    "explanation": "The scaled norm is 128. Clipping it to 2 then dividing by 32 gives 0.0625. Unscale first to recover norm 4, then clip to the intended bound 2. Keep the scale fixed across accumulation."
  },
  {
    "question": "For one bigram input character, a three-pair batch has successors a,a,b. What optimum row distribution and zero-loss conclusion follow?",
    "options": [
      "a:1,b:0; this row can attain zero loss.",
      "a:2/3,b:1/3; positive conditional loss remains.",
      "a:1/2,b:1/2; positive conditional loss remains.",
      "a:2/3,b:1/3; this row can attain zero loss."
    ],
    "answer": "a:2/3,b:1/3; positive conditional loss remains.",
    "explanation": "One row conditions on the current character only. The likelihood optimum matches empirical successor frequencies, so conflicting successors imply a positive entropy floor. A wiring check must respect that model capacity."
  },
  {
    "question": "Validation loss is lowest at update 20, but training loss continues falling to update 100. Validation chose the checkpoint; a third test set remains untouched. Which checkpoint/evaluation pair follows?",
    "options": [
      "Copy update 100; use untouched test for final estimate.",
      "Copy update 20; use untouched test for final estimate.",
      "Copy update 100; use selected validation score for final estimate.",
      "Copy update 20; use selected validation score for final estimate."
    ],
    "answer": "Copy update 20; use untouched test for final estimate.",
    "explanation": "Update 20 has the lowest validation loss. Choosing update 100 for its lower training loss would keep weights that did worse on validation. The validation scores already influenced which weights you kept, so reporting the selected score can make performance look better than it is. Evaluate the saved copy from update 20 on the untouched test set."
  }
]
```

> **Next:** Continue to [Dataset Pipelines and Data Quality](/learn/dataset-pipelines-data-quality). You can now train, validate, and reload a classifier from prepared tensors. Next you'll turn messy raw records into versioned train, validation, and test artifacts that those tensors can honestly come from.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Let's build a language model. It will be a tiny and very bad one, but it will be real: it reads text, learns from it, and writes more. The neural language models later in this book use these same forward, loss, backward and optimizer handoffs at larger scale.

The task is to predict the next character. Our training data is four short sentences:

```text title="Our training data"
the queue held the request. the request left the queue.
the reply reached the user. the user read the reply.
```

Slide along the text, and every position gives you one example: the current character is the input, and the one after it is the target. So `the` yields `t` then `h`, and `h` then `e`. Notice that the targets are simply the inputs shifted left by one position. Nearly every language model you will use is trained this way, one position predicting the next, and an off-by-one error in that shift is an easy bug to write.

## The smallest possible language model

The model is one table. It has one row per character in the vocabulary, and each row holds the logits for what comes next. Look up the current character's row, run softmax, and you have the model's guess. If that sounds familiar, it should. It is an embedding table from Chapter 2, with vectors that are read directly as logits, and softmax from Chapter 3. This is about as simple as a language model gets, and it is often called a **bigram** model, because it looks at pairs.

Every entry starts at zero, so the first guess is uniform: all characters equally likely. Training has to do the rest.

For the gradient, you can run the backward pass from Chapter 4 on softmax followed by $-\log$, with two more derivative facts: $e^x$ differentiates to itself, and $\log x$ differentiates to $1/x$. Write the loss as $-z_{\text{true}} + \log \sum_j e^{z_j}$. Differentiate with respect to $z_k$, and the first term gives $-1$ at the true character and 0 elsewhere, while the second gives $p_k$. The result is short enough to memorize: for the row you looked up, the gradient is $p - \text{target}$, the predicted probabilities minus a list that has a 1 at the true character and 0 elsewhere.

Read that as an instruction. A gradient descent step subtracts it, so it raises the true character's logit by $(1 - p_{\text{true}})$ times the learning rate, and it lowers every other character's logit in proportion to how much probability it had wrongly claimed. A confident correct guess barely changes anything. A confident wrong one gets corrected hard.

We also hold out three different sentences for validation, which the model never trains on. Here is the entire program:

<!-- leetllm: test, output=show, id=reader-training-next-char -->
```python title="train-a-next-character-model.py"
import math
import random

train_text = ("the queue held the request. the request left the queue. "
              "the reply reached the user. the user read the reply. ")
val_text = ("the driver held the lock. the worker left the pool. "
            "the user read the docs. ")

chars = sorted(set(train_text + val_text))
index = {ch: i for i, ch in enumerate(chars)}
V = len(chars)

def pairs(text):
    return [(index[a], index[b]) for a, b in zip(text, text[1:])]

def softmax(z):
    top = max(z)
    exponentials = [math.exp(value - top) for value in z]
    total = sum(exponentials)
    return [value / total for value in exponentials]

train_pairs, val_pairs = pairs(train_text), pairs(val_text)
logits = [[0.0] * V for _ in range(V)]

def mean_loss(data):
    return sum(-math.log(softmax(logits[a])[b]) for a, b in data) / len(data)

best_val, best_step, best_logits = float("inf"), 0, None
print("step  train    val")
for step in range(1001):
    val = mean_loss(val_pairs)
    if val < best_val:
        best_val, best_step = val, step
        best_logits = [row[:] for row in logits]  # a checkpoint
    if step in (0, 10, 50, 100, 200, 500, 1000):
        print(f"{step:4d}  {mean_loss(train_pairs):5.3f}  {val:5.3f}")

    gradient = [[0.0] * V for _ in range(V)]
    for a, b in train_pairs:
        p = softmax(logits[a])
        for k in range(V):
            gradient[a][k] += p[k]
        gradient[a][b] -= 1.0
    for a in range(V):
        for k in range(V):
            logits[a][k] -= 2.0 * gradient[a][k] / len(train_pairs)

print(f"best validation loss {best_val:.3f} at step {best_step}")

generator = random.Random(4)
current, text = index["t"], "t"
for _ in range(60):
    weights = softmax(best_logits[current])
    current = generator.choices(range(V), weights=weights)[0]
    text += chars[current]
print("sample:", text)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step  train    val
   0  3.045  3.045
  10  2.382  2.576
  50  1.515  2.144
 100  1.279  2.106
 200  1.135  2.130
 500  1.054  2.262
1000  1.033  2.392
best validation loss 2.105 at step 111
sample: theac. ure se leusthe thesd thed usqusrkueaikche eplsihy. que
```
<!-- leetllm: output:end -->

The sample at the end is gibberish, but notice what kind of gibberish. It has spaces in sensible places and fragments of real words, and it was produced by a program that has seen a hundred characters of text and knows nothing about English. Here is the table it learned.

<figure>
  <img src="illustrations/_generated/next_char_heatmap_dark.png" alt="A heat map of the next-character probabilities learned by the small model at its best checkpoint. Rows are the current character and columns the next character. A few cells stand out: after q, 81 percent of the probability goes to u. After t, 70 percent goes to h. After a period, 81 percent goes to a space. Characters that appear only in the validation text keep flat, nearly uniform rows, because training never gave the model anything to learn from them." />
  <figcaption>The whole model, at its best checkpoint. Nobody told it that q is followed by u, or that a period is followed by a space. Blue intensity shows the probabilities learned through corrections. Rows for characters absent from the training text were never updated, so they stay uniform.</figcaption>
</figure>

## A falling training loss can be lying to you

Now go back to the printed numbers, because they contain the most important lesson in this chapter. The training loss drops from start to finish. If that were all you logged, you would call this a great run. Validation loss, in the next figure, tells a different story.

<figure>
  <img src="illustrations/_generated/train_val_curves_dark.png" alt="Training and validation loss for a small next-character model over 1,000 steps. Training loss falls steadily from 3.04 to 1.03. Validation loss falls with it at first, reaches its lowest value of 2.11 near step 111, and then rises to about 2.39 as the model keeps memorizing its training text. The best checkpoint is marked at the validation minimum." />
  <figcaption>This is the classic shape of overfitting, from the run above. Up to step 111, training helps on text the model has not seen. After that, training loss keeps falling while loss on this held-out validation text rises.</figcaption>
</figure>

Early on, learned successor patterns such as `t` going to `h` also reduce loss on this validation text. Later updates fit the four training sentences more tightly while their validation loss rises. It becomes more and more certain that some pairs of characters simply never occur. In validation, some of those pairs do occur (24 of the 75 validation pairs never appeared in training), and Chapter 3 told you what a confident wrong answer costs.

That effect is called **overfitting**, and the defenses are all things you will meet again:

- **Keep a checkpoint at the best validation score.** A **checkpoint** is a saved copy of the model at one moment in training. Our code copies the table whenever validation improves. Stopping there, instead of at the end, is called **early stopping**.
- **Get more data,** which is usually the strongest fix when it is available.
- **Limit the model's freedom,** for instance with **weight decay**, which pulls parameters gently toward zero at every step.

Keep your validation set clean, too. If you pick your model or settings by peeking at a set, its score stops being an honest estimate, because you have fitted to it by hand. For that reason, a third set, the **test set**, is kept aside for a single final grade.

```checkpoint
Training loss has fallen for hours, and validation loss started rising an hour ago. What do you do with the checkpoint from right now, and which one do you keep?
---
Do not ship the latest one. It is overfitting, since it keeps improving only on the training data. Keep the checkpoint from around the validation minimum. Then consider more data or tighter limits on the model, such as weight decay, before you train again.
```

## Batches: why training does not use all the data at once

Our loop computed the gradient over all 108 training pairs before each update. A real model trains on billions of tokens, and it cannot wait for a full pass before each step.

So it uses a **mini-batch**: a random handful of examples, often a few dozen sequences, that gives a noisy estimate of the true gradient. Far more updates per hour turn out to be worth much more than one precise update. This is **stochastic gradient descent**. One full pass through the data is an **epoch**.

The batch size is the first number you will fight over with your hardware. A bigger batch gives a less noisy gradient, and the intermediate results it keeps in memory grow in proportion, which brings you straight to the next chapter. The noise explains something you will see in every training log as well: per-batch loss jumps around, so you judge progress from a smoothed curve and from validation runs, never from a single number.

## The same loop in PyTorch

Everything so far has been plain Python, so that you can see every step. In real work you use a framework, which computes gradients for you and runs on a GPU. **PyTorch** is the common choice, and now that you know what happens underneath, you can read a PyTorch training loop quite quickly.

```text title="Install first"
pip install torch numpy
```

<!-- leetllm: test, output=show, id=reader-training-pytorch, deps=torch,numpy -->
```python title="the-same-model-in-pytorch.py"
import torch
import torch.nn.functional as F

train_text = ("the queue held the request. the request left the queue. "
              "the reply reached the user. the user read the reply. ")
chars = sorted(set(train_text))
index = {ch: i for i, ch in enumerate(chars)}
ids = torch.tensor([index[ch] for ch in train_text])
inputs, targets = ids[:-1], ids[1:]  # targets are inputs shifted by one

model = torch.nn.Embedding(len(chars), len(chars))
torch.nn.init.zeros_(model.weight)
optimizer = torch.optim.AdamW(model.parameters(), lr=0.1, weight_decay=0.0)

for step in range(201):
    optimizer.zero_grad()                     # 1. clear old gradients
    logits = model(inputs)                    # 2. forward pass
    loss = F.cross_entropy(logits, targets)   # 3. score it
    loss.backward()                           # 4. backward pass
    optimizer.step()                          # 5. update the knobs
    if step in (0, 50, 200):
        print(f"step {step:3d}  loss {loss.item():.3f}")

print("parameters:", sum(p.numel() for p in model.parameters()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
step   0  loss 2.773
step  50  loss 1.038
step 200  loss 1.019
parameters: 256
```
<!-- leetllm: output:end -->

The first loss is 2.773 here and was 3.045 earlier, because this script builds its vocabulary from the training text alone, 16 characters instead of 21. A uniform guess always costs $\ln V$, so for a model that starts out uniform, that first number is a free check: if it is far from $\ln V$, look for a bug before you train.

Those five commented lines are the body of nearly every training loop you will ever read, and each one maps onto something you did by hand.[^pytorch2026optimization] `F.cross_entropy` takes raw logits, as Chapter 3 warned. And `loss.backward()` is Chapter 4's backward walk, done automatically.

The one new piece is the optimizer. **Adam** keeps a running average of each parameter's gradient and of its size, and it scales each parameter's step accordingly, so that a single learning rate behaves sensibly across parameters of very different scales.[^kingma2015] That helps with one cause of a long valley, knobs of very different sizes. It does not remove the other cause, knobs that trade off against each other, which is most of what you saw in Chapter 1. Measure a valley by how many times more sharply the loss curves across it than along it. Rescaling each knob shrinks Chapter 1's valley from about 70 to about 20. Subtracting the mean from the input removes the trade-off and brings it down to 2. Expect Adam to help in a valley, not to make it disappear. **AdamW** fixes how Adam handles weight decay,[^loshchilov2019] and it is the default optimizer in Hugging Face's Trainer.[^hfTrainer2026] Our script turns weight decay off. It trains the same kind of bigram table with its separately defined 16-character vocabulary, using AdamW rather than the plain-Python run’s gradient-descent updates.

## How training runs actually fail

Most training bugs do not crash. They give you a loss curve that looks fine and a model that is quietly worse. Here are the ones to check first:

| Symptom | Usual cause | First check |
|---|---|---|
| Loss goes to `nan` | Bad input, numerical overflow, or an unstable update | Find the earliest non-finite input, logit, loss, gradient, or parameter before changing the rate |
| Loss never moves | A bug in the data or loss | Try to overfit one small batch |
| Great validation score, poor in production | Validation data leaked into training, or looks nothing like production | Search for shared documents. Compare the distributions |
| Loss falls, predictions are nonsense | Inputs and targets are misaligned | Decode one batch and read it |
| Worse after resuming from a checkpoint | Optimizer state was not saved | Save it alongside the weights |
| Gradients keep growing | `zero_grad` is missing | Print the gradient norm for two steps |

That second row is the first debugging trick I would teach anyone. Before you start a long run, train on a single small batch and watch the loss fall as far as the model allows. A model with enough capacity to give each example in the batch its own answer should be able to memorize a handful of examples, so if a real model cannot get close to zero, you probably have a bug, and you found it in a minute instead of a day.

Know your model's floor first. Our bigram model can never reach zero, because it has one row for `e`, and the text follows `e` with 11 different characters. No single row can bet on all of them. The best a row can do is hold the frequencies of what follows it, which lets you count the floor directly. On the first 16 pairs of our text its best possible loss is 0.47, on the first 32 it is 0.67, and on the full text it is 1.015. That is why the runs above stop at 1.033 and 1.019, just above that floor, and a loss that settles there is the model doing all it can. Our bigram reaches zero only on a batch where every character has one successor, such as the first four pairs of `the q`.

Now for the `zero_grad` bug. PyTorch adds new gradients to the existing ones, which is what makes some advanced techniques possible, and if you forget to clear them, each step uses the sum of every earlier gradient:

<!-- leetllm: test, output=show, id=reader-training-zero-grad, deps=torch,numpy -->
```python title="what-zero-grad-prevents.py"
import torch

w = torch.tensor(3.0, requires_grad=True)
x, y = 2.0, 5.0

for attempt in range(3):
    loss = (w * x - y) ** 2
    loss.backward()
    print(f"after backward {attempt + 1}: w.grad = {w.grad.item()}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
after backward 1: w.grad = 4.0
after backward 2: w.grad = 8.0
after backward 3: w.grad = 12.0
```
<!-- leetllm: output:end -->

That is the same loss and the same weight as Chapter 4, where the true gradient was 4. Nothing crashes, and you get a gradient that grows with each call.

Saving your work is the last piece. A long training run will eventually be interrupted, so a checkpoint has to capture everything needed to continue: the model weights, the optimizer state (Adam's running averages are part of the training state), the step count,[^pytorchSavingLoading2026] the learning-rate schedule if you use one, and the random-number state. Weights alone are enough for inference, but they do not let you resume cleanly. Write checkpoints to a temporary file and rename it into place, so that a crash during saving cannot destroy your only copy.

```checkpoint
You call `loss.backward()` twice before `optimizer.step()`, with no `zero_grad` in between. What gradient does the optimizer use?
---
The sum of both gradients, because PyTorch accumulates them in `.grad`. Sometimes that is deliberate. For equal-sized micro-batches with unchanged weights and matching per-example computations, **gradient accumulation** divides each mean loss by the number of batches before calling `backward()`. Unequal batches need weights proportional to their effective denominators. Call `optimizer.step()` once after the window; BatchNorm and stochastic layers can still make the physical large-batch computation differ. Done by accident, it silently makes your step too large.
```

## What you can do now

You have trained a language model from scratch, in plain Python and then in PyTorch. You can spot overfitting in a pair of curves, keep the checkpoint that matters, and run the first checks when training goes wrong.

Our model has one obvious flaw, and it is the reason the rest of this book exists. It looks at one character and forgets everything else. It can learn that `q` leads to `u`, but never that a question deserves an answer. Fixing that takes a vastly bigger table and the attention machinery of Part 1, and then the arithmetic that took a second on a laptop needs thousands of processors running flat out. So before we move on to language, we need to understand the machine.

<!-- leetllm: edition:reader:end -->
