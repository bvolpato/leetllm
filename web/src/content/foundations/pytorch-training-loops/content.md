---
{
  "id": "pytorch-training-loops",
  "title": "PyTorch Training Loops",
  "slug": "pytorch-training-loops",
  "section": "Deep Learning Foundations",
  "category": "Fine-Tuning & Training",
  "difficulty": "Easy",
  "order": 2,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "A falling loss can hide a broken sequence-classifier loop, so follow one batch through logits, gradients, validation, and a checkpoint that still matches after reload.",
  "prerequisites": [
    "calculus-gradients-backpropagation-optimization",
    "cross-validation-leakage-generalization"
  ],
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

Your training run logs steadily falling loss, yet the sequence classifier behaves erratically during validation. A <span data-glossary="pytorch">PyTorch</span> training loop can finish without a single exception while a silent state bug corrupts the model: gradients accumulate across mini-batches, Dropout stays active during evaluation, or a saved checkpoint still aliases live parameter tensors that later epochs overwrite.

Unlike frameworks that hide learning inside `.fit()`, PyTorch makes you write the loop explicitly so every <span data-glossary="tensor">tensor</span>, <span data-glossary="logits">logit</span>, <span data-glossary="gradient">gradient</span>, and <span data-glossary="optimizer">optimizer</span> buffer is inspectable.[^pytorch2019][^pytorch2026optimization] Building on [backpropagation](/learn/calculus-gradients-backpropagation-optimization) and [softmax and cross-entropy](/learn/probability-for-machine-learning), we will trace each state transition on CPU with fixed seeds, then watch overfitting unfold on a tiny character language model.

## Raw logits and `CrossEntropyLoss`

Start with a small binary sequence classifier taking two pooled features (`local_score`, `span_score`) into `nn.Linear(2, 2)`. The head emits unconstrained raw scores called **logits** (`shape (batch, classes)`, `torch.float32`). For hard class labels, `nn.CrossEntropyLoss` expects a 1D integer index tensor of shape `(batch,)` and dtype `torch.long` (floating soft targets require the full `(batch, classes)` probability shape).[^pytorchCrossEntropy2026]

For logits `[2.0, -1.0]` (true class `0`, $p_0 \approx 0.9526$, loss $0.0486$) and `[-0.5, 1.5]` (true class `1`, $p_1 \approx 0.8808$, loss $0.1269$), default `reduction="mean"` averages both losses to `0.0878`:

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

> **Failure case:** Never pass `torch.softmax(logits, dim=-1)` into `CrossEntropyLoss`. It applies log-softmax a second time via log-sum-exp, silently changing the objective and gradients.

## The five phases of one training step

Every standard eager step separates gradient clearing, forward scoring, differentiation, and parameter mutation:

| Phase | PyTorch statement | Purpose | Parameters change? |
|---|---|---|---|
| 1 | `optimizer.zero_grad(set_to_none=True)` | Clear gradients left by previous steps | No |
| 2 | `logits = model(xb)` | Run forward pass and record autograd graph | No |
| 3 | `loss = loss_fn(logits, yb)` | Compute scalar batch loss | No |
| 4 | `loss.backward()` | Populate `.grad` on reachable leaf parameters | No |
| 5 | `optimizer.step()` | Update parameter storage in place | Yes |

`loss.backward()` never moves weights.[^pytorch2026autograd] Using `set_to_none=True` (PyTorch's default) drops gradient references instead of zero-filling tensors, saving memory and ensuring parameters that received no gradient stay `None` (skipped by standard optimizers, whereas an explicit zero tensor still receives momentum or weight-decay updates).[^pytorchZeroGrad2026]

Trace exact arithmetic on two symmetric rows: `[1.0, 1.0]` (`label = 1`) and `[-1.0, -1.0]` (`label = 0`) with $W_0 = 0$ and zero bias. Both rows emit logits `[0, 0]`, giving probabilities `[0.5, 0.5]` and loss $-\ln(0.5) \approx 0.6931$. Mean cross-entropy writes $dW = \begin{bmatrix} 0.5 & 0.5 \\ -0.5 & -0.5 \end{bmatrix}$ into `model.weight.grad` while leaving $W = 0$. Only `optimizer.step()` with SGD ($\eta = 0.2$) moves weights to $W_1 = W_0 - 0.2\,dW = \begin{bmatrix} -0.1 & -0.1 \\ 0.1 & 0.1 \end{bmatrix}$.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Exact PyTorch optimizer update showing a two-sequence input matrix, zero initial weights, cross-entropy loss 0.6931, the gradient matrix written by backward, unchanged weights after backward, SGD weights after a 0.2 learning-rate step, and the resulting class logits." />
  <figcaption>In this zero-initialized batch, <code>backward()</code> fills <code>dW</code> while leaving <code>W</code> unchanged. With <span data-glossary="learning-rate">learning rate</span> <code>0.2</code>, <code>optimizer.step()</code> produces weights <code>[[-0.1, -0.1], [0.1, 0.1]]</code>, assigning <code>[+1, +1]</code> to class 1 and <code>[-1, -1]</code> to class 0.</figcaption>
</figure>

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

## Gradient accumulation and batching

PyTorch **adds** into `.grad` on every `backward()` call (`param.grad += new_grad`). Forgetting `zero_grad()` inside the batch loop lets stale derivatives pile up silently. Deliberate **gradient accumulation** uses that behavior to simulate an effective batch size $B_{\text{eff}} = K \times B_{\text{micro}}$ when GPU memory is tight.[^pytorchAmpExamples2026]

For $K$ equal-sized micro-batches with mean loss, `(loss / K).backward()` reproduces the combined mean gradient (assuming unchanged weights and identical per-example math; BatchNorm and Dropout draws still differ across micro-batches). For **unequal** micro-batches of sizes $n_k$, weight each mean loss by $n_k / \sum_j n_j$ instead of $1/K$, or the short trailing chunk gets overweighted:

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

With DistributedDataParallel (DDP), wrap both forward and backward for the first $K - 1$ micro-batches in `model.no_sync()` so gradient buckets synchronize once on the final micro-batch.[^pytorchDdpDocs2026] The same weighting rule applies to reporting <span data-glossary="epoch">epoch</span> loss over a `DataLoader(TensorDataset(features, labels), batch_size=4)`: when the final batch has fewer rows, accumulate `loss.item() * len(yb)` and divide by total rows processed rather than averaging batch means.

## Overfitting, validation, and your first language model

Before launching a long run, run an **overfit-one-batch** sanity check on a small clean batch with regularization disabled. Know your model's entropy floor first: a **bigram** character model has one lookup row per input character (`nn.Embedding(V, V)`), so if a character is followed by successors `a, a, b`, its theoretical optimum row assigns probabilities `a: 2/3, b: 1/3` and leaves a positive conditional cross-entropy floor rather than reaching zero!

Training a tiny next-character bigram model on four short sentences while holding out three validation sentences makes **overfitting** unmistakably visible:

<!-- leetllm: test, output=show, id=training-next-char -->
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

Starting from zero logits gives uniform initial loss $\ln V = \ln 21 \approx 3.045$ (a free sanity check for any language model!). By step 111, the table has learned genuine English character transitions (`q → u`, `t → h`, `. → space`):

<figure>
  <img src="illustrations/_generated/next_char_heatmap_dark.png" alt="A heat map of the next-character probabilities learned by the small model at its best checkpoint. Rows are the current character and columns the next character. A few cells stand out: after q, 81 percent of the probability goes to u. After t, 70 percent goes to h. After a period, 81 percent goes to a space. Characters that appear only in the validation text keep flat, nearly uniform rows, because training never gave the model anything to learn from them." />
  <figcaption>The learned bigram probability table at step 111. Rows for characters absent from training stay uniform, while frequent transitions like `q → u` (81%) and `t → h` (70%) sharpen cleanly.</figcaption>
</figure>

After step 111, training loss keeps falling toward its 1.015 entropy floor while validation loss climbs from `2.105` to `2.392` because the model grows overconfident that unseen character pairs never occur:

<figure>
  <img src="illustrations/_generated/train_val_curves_dark.png" alt="Training and validation loss for a small next-character model over 1,000 steps. Training loss falls steadily from 3.04 to 1.03. Validation loss falls with it at first, reaches its lowest value of 2.11 near step 111, and then rises to about 2.39 as the model keeps memorizing its training text. The best checkpoint is marked at the validation minimum." />
  <figcaption>Classic overfitting: training loss falls monotonically, while validation loss bottoms out at step 111 and rises afterward. Keep the best-validation checkpoint and grade final performance on an untouched test split.</figcaption>
</figure>

Rewriting the same bigram loop in PyTorch with **AdamW**[^kingma2015][^loshchilov2019] collapses the entire training step to five lines (`zero_grad`, forward, `F.cross_entropy`, `backward`, `step`), hitting `1.019` near the training floor by step 200:

<!-- leetllm: test, output=show, id=training-pytorch, deps=torch,numpy -->
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

## Modes, context managers, and checkpoint safety

Validation and deployment rely on two orthogonal controls that never replace one another:

- **`model.train()` vs `model.eval()`** controls mode-sensitive layers: <span data-glossary="dropout">Dropout</span> zeroes activations randomly in train mode and becomes identity in eval mode; BatchNorm uses batch statistics and updates running buffers in train mode, then uses running buffers in eval mode (LayerNorm runs identically in both).[^pytorchBatchNorm2d2026]
- **`torch.no_grad()` vs `torch.inference_mode()`** controls autograd graph recording. `no_grad()` suppresses backward graph construction while returning ordinary tensors; `inference_mode()` additionally disables view/version tracking for pure inference (tensors produced inside `inference_mode()` cannot be saved for backward by a downstream trainable head unless cloned outside the context).[^pytorchInferenceMode2026] Need input gradients during robustness checks? Keep `model.eval()` with autograd *enabled*!

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

When saving the best validation checkpoint in memory, always call `copy.deepcopy(model.state_dict())`: a plain `model.state_dict()` aliases live parameter storage, so subsequent optimizer updates silently overwrite your saved snapshot.[^pytorchSavingLoading2026]

For disk checkpoints, prefer `state_dict` bundles loaded with `weights_only=True` over whole-module pickling.[^pytorchSerialization2026] A resumption bundle saves `model_state_dict`, `optimizer_state_dict` (preserving SGD momentum or Adam moments so the next update matches cleanly), scheduler and AMP scaler states, RNG states (a seed restarts a sequence; RNG state resumes it),[^pytorchReproducibility2026] and run metadata (step, split ID, git hash). Write to a staging file in the same directory, flush + `os.fsync`, atomically replace the live path via `os.replace`, and on Linux `fsync` the parent directory so the rename reaches disk.[^pythonOs2026][^linuxFsync2026]

<figure>
  <img src="illustrations/_generated/atomic_checkpointing_dark.png" alt="Checkpoint state and save strategy comparison. Direct overwrite can damage the previous file; staging, file sync, and successful atomic replacement protect the live path during a process interruption. Linux directory sync addresses rename durability. RNG states and data-loader progress are distinct from starting seeds." />
  <figcaption>Stage to a temp file, sync bytes, then atomically replace the live path so an interruption never leaves a truncated checkpoint.</figcaption>
</figure>

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

## Numerical triage, clipping, AMP, and `torch.compile`

When loss turns `NaN` or `Inf`, inspect in order: (1) **inputs** (`torch.isfinite(xb).all()`), (2) **logits**, (3) **loss** (and target masks or reductions; note an infinite additive constant makes loss `+Inf` even while parameter gradients stay finite, so check both loss and gradients separately and skip the step!), (4) **gradients** (where `p.grad is not None`), and (5) **parameters** after `step()`.

To cap gradient spikes without distorting update direction, use global norm clipping `nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0, error_if_nonfinite=True)`, which rescales the concatenated gradient vector whenever $\|\mathbf{g}\|_2 > \text{max\_norm}$.[^pytorchClipGrad2026]

For GPU throughput, **Automatic Mixed Precision (AMP)** keeps parameters in `float32`, runs eligible matrix ops in `float16` or `BF16` inside `torch.amp.autocast('cuda')`, and keeps reductions like `CrossEntropyLoss` in `float32`.[^micikevicius2018][^pytorchAmpDocs2026] Because `float16` loses precision in subnormals below $2^{-14} \approx 6.1 \times 10^{-5}$ and underflows to zero below $2^{-24} \approx 5.96 \times 10^{-8}$,[^pytorchTypeInfo2026] `torch.amp.GradScaler` multiplies loss by a dynamic scale $S$ (initially `65,536`), runs `scaler.scale(loss).backward()`, calls **`scaler.unscale_(optimizer)` before clipping** (clipping before unscaling imposes an effective bound of `max_norm / S`!), skips `optimizer.step()` on any non-finite gradient (halving $S$), and doubles $S$ after 2,000 consecutive finite steps.[^pytorchGradScalerSource2026] BF16 shares float32's exponent range and usually runs without a scaler.

<figure>
  <img src="illustrations/_generated/amp_mixed_precision_dataflow_dark.png" alt="CUDA float16 autocast pattern with float32 stored parameters, operation-specific forward dtypes, scaled backward, unscaling before optional clipping, and finite versus non-finite update branches. Defaults keep the scale fixed on ordinary finite steps, double it after 2000 successful iterations, and halve it after a non-finite event." />
  <figcaption>Autocast selects operation dtypes; GradScaler lifts tiny FP16 gradients out of underflow, unscales before clipping, and skips stepping on any non-finite gradient.</figcaption>
</figure>

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

Once your eager loop passes every check, `torch.compile(model)` captures graph regions with TorchDynamo and fuses kernels through TorchInductor.[^ansel2024pytorch2][^pytorch2026compile] Compilation accelerates steady-state steps, never fixes a broken loop; verify eager correctness first, log scalar metrics with `loss.item()` outside tight CUDA loops so you do not leak graph references or stall GPU streams,[^pytorchCudaSemantics2026] and match every failure symptom to its root check:

| Symptom | Likely cause | First check |
|---|---|---|
| Target error in `CrossEntropyLoss` | Hard labels are float or `(batch, 1)` | Use 1D `torch.long` targets of shape `(batch,)` |
| Validation predictions wobble | Dropout/BatchNorm left in train mode | Call `model.eval()` before validation |
| Gradients grow each batch | Missing `zero_grad()` | Reset inside the batch loop |
| Memory climbs while logging losses | Storing live `loss` tensors instead of scalars | Log `loss.item()` on a chosen cadence |
| Worse after resuming checkpoint | Missing optimizer state or aliased `state_dict` | Save/reload `optimizer_state_dict`; `deepcopy` snapshots |
| Loss turns `NaN` or `Inf` | Bad inputs, overflow, or wrong AMP order | Run 5-step finiteness triage; unscale before clipping |

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
    "question": "For one bigram input character, a four-pair batch has successors x, x, x, y. What optimum row distribution and zero-loss conclusion follow?",
    "options": [
      "x: 1, y: 0; this row can attain zero loss.",
      "x: 3/4, y: 1/4; positive conditional loss remains.",
      "x: 1/2, y: 1/2; positive conditional loss remains.",
      "x: 3/4, y: 1/4; this row can attain zero loss."
    ],
    "answer": "x: 3/4, y: 1/4; positive conditional loss remains.",
    "explanation": "One row conditions on the current character only. The likelihood optimum matches empirical successor frequencies (3/4 and 1/4), so conflicting successors imply a positive entropy floor. A wiring check must respect that model capacity."
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

> **Next:** Continue to [Softmax, Cross-Entropy & Optimization](/learn/softmax-cross-entropy-optimization).
