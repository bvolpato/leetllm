---
{
  "id": "jax-for-ml-research",
  "title": "JAX for PyTorch Researchers",
  "slug": "jax-for-ml-research",
  "section": "Advanced Training & Adaptation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "order": 4,
  "coverImage": "illustrations/_generated/explicit_state_step_dark.png",
  "companies": [
    "Google DeepMind",
    "Anthropic",
    "NVIDIA",
    "Meta"
  ],
  "shortDescription": "A short final batch pauses to recompile, and dropout repeats the same mask. Read a JAX training step as an explicit state transition so you can diagnose shapes, PRNG keys, and JIT boundaries without rewriting the codebase.",
  "keyConceptsTested": [
    "pure numerical functions",
    "explicit parameter and optimizer state",
    "typed PRNG keys and key splitting",
    "immutable JAX array updates",
    "grad, value_and_grad, jit, and vmap",
    "parameter and gradient pytrees",
    "shape specialization and recompilation",
    "sequential PRNG non-equivalence",
    "tracer-safe control flow",
    "asynchronous dispatch and correct timing",
    "PyTorch-to-JAX training-step translation",
    "framework preservation versus rewrite decisions"
  ],
  "prerequisites": [
    "build-gpt-from-scratch-lab",
    "pytorch-training-loops",
    "numpy-and-tensor-shapes"
  ],
  "relatedQuestions": [
    "continued-pretraining-domain-adaptation",
    "mixed-precision-training-loss-scaling",
    "distributed-training-fsdp-deepspeed-zero"
  ]
}
---

You add one regularizer to a paper's <span data-glossary="jax">JAX</span> repository. The loss formula is right, yet the final short batch of every epoch triggers a multi-second pause, and dropout keeps applying the exact same mask across steps. Neither bug lives in the math: both come from how JAX traces shapes and owns random keys.

If you already build training loops in <span data-glossary="pytorch">PyTorch</span>, you know tensors and <span data-glossary="gradient">gradients</span>. Here we strip a JAX step down to a four-row linear regression small enough to verify by hand, so every parameter leaf, velocity update, PRNG split, and compilation boundary is completely transparent.

## Read the program before choosing a rewrite

JAX is an array-computing and program-transformation library. `jax.numpy` mirrors NumPy's API, while transformations like `grad`, `vmap`, and `jit` derive new functions from pure numerical functions.[^jax2026quickstart] Even when a repository uses Flax, Equinox, or Optax on top, core JAX still governs tracing, differentiation, vectorization, compilation, and execution.

Before touching anything, trace one training call from input batch to returned state. Map four things: mutable state carried between steps, tensor shapes and static options, PRNG key splits, and which functions are transformed.

Throughout this lesson we use a four-row linear model $\hat{y} = w_0 x_0 + w_1 x_1 + b$ starting from zero parameters:

| Features $x$ | Target $y$ | Prediction at zero | Squared error |
|---|---|---|---|
| `[1, 0]` | `2` | `0` | `4` |
| `[0, 1]` | `-1` | `0` | `1` |
| `[1, 1]` | `1` | `0` | `1` |
| `[2, 1]` | `3` | `0` | `9` |

The initial mean squared error is `(4 + 1 + 1 + 9) / 4 = 3.75`, and the exact solution is `weight = [2, -1]`, `bias = 0`. Having an exact oracle lets us verify every transformation eagerly before compilation enters the picture.

| PyTorch habit | JAX mental model | Question to ask while reading |
|---|---|---|
| `nn.Module` owns parameters | Parameters arrive as a pytree | Where is the updated parameter tree returned? |
| `loss.backward()` fills `.grad` | `grad` returns a gradient pytree | Which argument position is differentiated? |
| `optimizer.step()` mutates state | Update returns new <span data-glossary="optimizer-state">optimizer state</span> | Who threads the updated state into the next step? |
| Hidden global RNG stream | Explicit key argument | Is every subkey split and consumed at most once? |
| In-place `x[i] = v` | `.at[i].set(v)` returns a new array | Did the caller capture the returned array? |
| Batch loop | `vmap` maps a single-example function | Which argument axes are mapped vs shared? |
| Eager execution by default | `jit` compiles per input signature | What shapes or static flags vary across calls? |

## One step is a state transition

In PyTorch, a training step mutates objects in place: `optimizer.zero_grad()`, `loss.backward()`, `optimizer.step()`. In JAX, every changing value (parameters, <span data-glossary="optimizer">optimizer</span> state, continuation PRNG key, batch-norm statistics) enters as an argument and exits as a return value.[^jax2026stateful]

Read the diagram below as an explicit dataflow map: nothing mutates behind the caller's back, and every arrow tracks who owns the next value.

<figure>
  <img src="illustrations/_generated/explicit_state_step_dark.png" alt="A momentum and input-dropout training step receives zero weights, bias, and velocity plus a seed-7 Threefry key. Splitting retains K1 and issues dropout key D0 for the 4x2 mask [[1,0],[1,1],[1,1],[0,0]], rescaled by 1/0.75. Before the update, loss is 3.75 with gradients weight=[-2.0, 0.0] and bias=-2.5. With momentum 0.9 and learning rate 0.05, the step returns updated velocity [-2.0, 0.0] and -2.5, updated parameters [0.1, 0.0] and 0.125, and continuation key K1 while leaving inputs untouched." />
  <figcaption>A momentum + dropout step consumes current parameters, velocity, and key K₀, and returns updated parameters, velocity, continuation key K₁, and pre-update loss (3.75), leaving all input arrays untouched.</figcaption>
</figure>

A clean functional step signature looks like this:

```python title="state_transition_signature.py"
def train_step(params, optimizer_state, batch, key):
    key, step_key = split(key)
    loss, grads = differentiate(params, batch, step_key)
    updates, optimizer_state = update(grads, optimizer_state, params)
    params = apply_updates(params, updates)
    return params, optimizer_state, key, {"loss": loss}
```

### Pure means observable through arguments and returns

A pure function depends solely on its arguments and communicates solely through its return values.[^jax2026sharpbits] Inside `jit`, JAX traces your Python code once per input signature and caches the compiled array program, skipping Python side effects on subsequent calls.

> **Common mistake:** Reading a module-level Python variable like `weight_decay = 0.01` inside a jitted loss. The first trace bakes `0.01` into the compiled executable; mutating `weight_decay = 0.1` later in Python is silently ignored until a new shape triggers retracing. Pass changing hyperparameters as array arguments, and use `jax.debug.print` (or return metrics) instead of Python `print` inside jitted code.

## Immutable arrays remove aliasing surprises

Ordinary `jax.Array` objects are immutable: `original[1] = 99` raises `TypeError`.[^jax2026sharpbits] Instead, update elements with `.at[...].set(...)`, which returns a new array value while keeping `original` intact. Under `jit`, XLA compiles `.at` updates in place whenever safe (and `donate_argnums` lets you explicitly recycle input buffers you no longer need), so immutability gives you clean value semantics without forcing full copies.[^jax2026At][^jax2026JitApi]

Watch both immutability and a critical indexing surprise in JAX on CPU:[^jax2026Release]

<!-- leetllm: test, deps=jax==0.11.2, output=show, output_title="Immutable update" -->
```python title="immutable_update.py"
import jax.numpy as jnp

original = jnp.array([10, 20, 30])
updated = original.at[1].set(99)

print("original:", original.tolist())
print("updated :", updated.tolist())

try:
    original[1] = 99
except TypeError as err:
    print("item assignment error:", type(err).__name__)

# Default indexing does NOT raise IndexError on out-of-bounds indices
print("out-of-bounds .at[9].set(99):", original.at[9].set(99).tolist())
print("out-of-bounds .at[9].get()  :", int(original.at[9].get()))
```

<!-- leetllm: output:start -->
```text title="Immutable update" output compact
original: [10, 20, 30]
updated : [10, 99, 30]
item assignment error: TypeError
out-of-bounds .at[9].set(99): [10, 20, 30]
out-of-bounds .at[9].get()  : 30
```
<!-- leetllm: output:end -->

> **Common mistake:** Assuming `.at[...]` mutates in place or checks array bounds. Discarding the return value of `params["bias"].at[...].add(0.1)` leaves `params["bias"]` unchanged, and by default out-of-bounds writes are silently dropped while out-of-bounds reads clip to the edge index (`30` above).[^jax2026At] Always capture the returned array and validate indices explicitly when bounds matter.

*(JAX also offers controlled mutable `Ref` values for specialized memory management; ordinary pure array updates remain the default for research code.[^jax2026ArrayRefs])*

## Randomness is explicit data

Instead of a hidden global RNG mutated by every `torch.randn` call, JAX uses explicit typed PRNG keys (defaulting to the counter-based `threefry2x32` algorithm).[^jax2026RandomApi] Sampling from a key never mutates it: calling `random.normal(key_a, ...)` twice produces identical numbers, so you split a parent key into one continuation key plus one-use child keys for each stochastic operation.[^jax2026random]

<!-- leetllm: test, deps=jax==0.11.2, output=show, output_title="PRNG key discipline" -->
```python title="prng_key_discipline.py"
import jax.numpy as jnp
from jax import random

root = random.key(7, impl="threefry2x32")
next_key, key_a, key_b = random.split(root, 3)

sample_a = random.normal(key_a, (4,))
sample_a_reused = random.normal(key_a, (4,))
sample_b = random.normal(key_b, (4,))

print("reusing key_a repeats exact draw:", bool(jnp.array_equal(sample_a, sample_a_reused)))
print("distinct subkeys differ:         ", bool(not jnp.array_equal(sample_a, sample_b)))
print("continuation key dtype:          ", next_key.dtype)
```

<!-- leetllm: output:start -->
```text title="PRNG key discipline" output compact
reusing key_a repeats exact draw: True
distinct subkeys differ:          True
continuation key dtype:           key<fry>
```
<!-- leetllm: output:end -->

Typed keys encode their PRNG implementation in their dtype (`key<fry>` wraps two `uint32` words; convert checkpoints with `random.key_data` / `random.wrap_key_data`).[^jax2026RandomApi]

<figure>
  <img src="illustrations/_generated/prng_split_once_dark.png" alt="Seed-7 Threefry PRNG splitting derives independent keys. Calling split(root, 3) produces next, A, and B: reusing A replays identical normal draws, whereas B generates an independent normal stream. In a separate split(root, 2) check with one-bit Bernoulli p=0.5, distinct child keys both return False, matching the 0.5 independent agreement rate." />
  <figcaption>Splitting a seed-7 Threefry key yields independent child streams: reusing subkey A replays identical draws, while distinct child keys can still happen to match on low-entropy 1-bit Bernoulli draws.</figcaption>
</figure>

Two subtleties frequently surprise PyTorch users:

1. **No sequential equivalence:** Splitting a key into 3 subkeys and drawing 1 normal each does *not* match drawing a vector of 3 normals from the parent key. JAX omits sequential equivalence intentionally so parallel and vectorized samplers can run without synchronization.[^jax2026random]
2. **Matching small masks do not prove key reuse:** Two independent 1-bit Bernoulli(`p=0.5`) draws agree 50% of the time ($0.5^2 + 0.5^2 = 0.5$). Always verify key lineage (`random.key_data`) rather than assuming equal binary outputs mean a reused key.

<!-- leetllm: test, deps=jax==0.11.2, output=show, output_title="PRNG subtleties" -->
```python title="prng_subtleties.py"
import jax.numpy as jnp
from jax import random

key = random.key(7, impl="threefry2x32")
subkeys = random.split(key, 3)
one_by_one = jnp.stack([random.normal(k) for k in subkeys])
all_at_once = random.normal(key, (3,))

print("split 3 scalars:", [round(float(v), 4) for v in one_by_one])
print("single 3-vector:", [round(float(v), 4) for v in all_at_once])

key_a, key_b = random.split(key)
mask_a = random.bernoulli(key_a, p=0.5, shape=(1,))
mask_b = random.bernoulli(key_b, p=0.5, shape=(1,))
keys_differ = not bool(jnp.array_equal(random.key_data(key_a), random.key_data(key_b)))
print("distinct keys:", keys_differ, "| 1-bit masks:", mask_a.tolist(), mask_b.tolist())
```

<!-- leetllm: output:start -->
```text title="PRNG subtleties" output compact
split 3 scalars: [1.114, 0.4541, -0.8204]
single 3-vector: [0.4512, 1.9535, -0.5162]
distinct keys: True | 1-bit masks: [False] [False]
```
<!-- leetllm: output:end -->

### Split at helper call sites

When one training step performs both dropout and data augmentation, split the step key at the caller and hand each helper its own one-use subkey. If both helpers split the same parent key independently, they derive identical child streams. Across distributed workers or steps, `random.fold_in(base_key, step_or_replica_id)` derives deterministic unique keys without threading long manual split chains. *(JAX's experimental `Ref`-backed stateful RNG cannot pass through `scan`, `while_loop`, or `remat`, so explicit keys remain the standard choice.[^jax2026StatefulRng])*

```checkpoint
A dropout helper receives one key and applies two independent dropout masks by calling `random.bernoulli(key, ...)` twice. Both masks always match. How do you fix it?
---
Split the incoming key inside the helper into two one-use subkeys (one per mask) and return or keep a separate continuation key if the caller needs future randomness.
```

## Transform one small function at a time

JAX transformations compose best when you start from a tiny, eager scalar function for a *single* example, verify its numbers, and then layer `grad`, `vmap`, and `jit` one at a time:

- `jax.grad(f)` differentiates scalar-valued `f` (and `jax.value_and_grad(f)` returns both loss and gradient in one pass).[^jax2026autodiff]
- `jax.vmap(f, in_axes=...)` vectorizes `f` over a batch axis (`in_axes=(None, 0, 0)` broadcasts shared parameters across batched inputs and targets).[^jax2026vmap]
- `jax.jit(f)` stages and compiles pure array work with XLA.[^jax2026jit]

<figure>
  <img src="illustrations/_generated/gradient_composition_dark.png" alt="At zero parameters, the four regression rows have gradients [-4,0,-4], [0,2,2], [-2,-2,-2] and [-12,-6,-6] for the two weight entries and bias. Every signed bar shares the same minus-12-to-plus-2 scale. Mapping grad over examples retains weight shape [4,2] and bias shape [4]. Averaging gives weight gradient [-4.5,-1.5] and scalar bias gradient -2.5, with shapes [2] and (). One plain SGD update at learning rate 0.05 returns weights [0.225,0.075] and bias 0.125." />
  <figcaption>Mapping grad over examples yields per-example gradients of shape [4, 2] and [4]; averaging them gives the exact batch-mean gradient [-4.5, -1.5] and -2.5.</figcaption>
</figure>

### Transformation order changes the derived program

Compare two compositions:

```python title="transformation_order.py"
per_example_grad = jax.vmap(jax.grad(loss_one), in_axes=(None, 0, 0))  # [batch, ...] per leaf
batch_mean_grad  = jax.grad(batch_mean_loss)                           # [...] per leaf
```

Use `vmap(grad(loss_one))` when you genuinely need per-example gradients (such as per-example clipping or influence scoring). For ordinary training, differentiate the scalar mean loss directly so you never materialize a batch-sized copy of every parameter gradient.

Verify both on our four regression rows (where hand arithmetic at zero parameters gives weight gradient `[-4.5, -1.5]` and bias gradient `-2.5`):

<!-- leetllm: test, deps=jax==0.11.2, output=show, id=jax-gradient -->
```python title="gradient_composition.py"
import jax
import jax.numpy as jnp

x = jnp.array([[1., 0.], [0., 1.], [1., 1.], [2., 1.]], dtype=jnp.float32)
y = jnp.array([2., -1., 1., 3.], dtype=jnp.float32)
zero_params = {"weight": jnp.zeros(2, dtype=jnp.float32), "bias": jnp.array(0., dtype=jnp.float32)}

def predict_one(params, features):
    return jnp.dot(features, params["weight"]) + params["bias"]

def loss_one(params, features, target):
    return (predict_one(params, features) - target) ** 2

def batch_loss(params, features, targets):
    return jax.vmap(loss_one, in_axes=(None, 0, 0))(params, features, targets).mean()

per_grad = jax.vmap(jax.grad(loss_one), in_axes=(None, 0, 0))(zero_params, x, y)
mean_grad = jax.grad(batch_loss)(zero_params, x, y)
averaged = jax.tree.map(lambda leaf: leaf.mean(axis=0), per_grad)

print("per-example weight grad shape:", per_grad["weight"].shape)
print("averaged per-example grad:    ", averaged["weight"].tolist(), float(averaged["bias"]))
print("grad(batch_loss):             ", mean_grad["weight"].tolist(), float(mean_grad["bias"]))

try:
    jax.grad(lambda p: jax.vmap(loss_one, in_axes=(None, 0, 0))(p, x, y))(zero_params)
except TypeError as err:
    print("vector loss rejected by grad: ", type(err).__name__)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
per-example weight grad shape: (4, 2)
averaged per-example grad:     [-4.5, -1.5] -2.5
grad(batch_loss):              [-4.5, -1.5] -2.5
vector loss rejected by grad:  TypeError
```
<!-- leetllm: output:end -->

Notice that `jax.grad` requires a true scalar output of shape `()` (even a length-1 array `[loss]` raises `TypeError`).

## Pytrees carry structured state

Real models store nested dictionaries of weights, tuples of optimizer moments, and auxiliary buffers. JAX treats any nested container of arrays as a **<span data-glossary="pytree">pytree</span>**: transformations flatten the container, operate on leaves, and rebuild the exact same structure.[^jax2026pytrees]

Applying an SGD update across an entire model takes one line:

```python title="pytree_sgd_update.py"
new_params = jax.tree.map(lambda p, g: p - learning_rate * g, params, grads)
```

Matching tree structure catches renamed keys (like `"weight"` vs `"kernel"`), yet does *not* block silent NumPy broadcasting if a gradient leaf accidentally collapses to a scalar! Check both `jax.tree.structure` and exact leaf shapes whenever validating updates or checkpoints:

<!-- leetllm: test, deps=jax==0.11.2, output=show, continue=jax-gradient, id=jax-tree -->
```python title="check_gradient_schema.py"
def validate_gradient(params, grads):
    if jax.tree.structure(params) != jax.tree.structure(grads):
        raise ValueError("gradient tree structure mismatch")
    if any(p.shape != g.shape for p, g in zip(jax.tree.leaves(params), jax.tree.leaves(grads))):
        raise ValueError("gradient leaf shape mismatch")

validate_gradient(zero_params, mean_grad)
for label, bad in [
    ("renamed key", {"kernel": mean_grad["weight"], "bias": mean_grad["bias"]}),
    ("scalar leaf", {"weight": jnp.array(-4.5), "bias": mean_grad["bias"]}),
]:
    try:
        validate_gradient(zero_params, bad)
    except ValueError as err:
        print(f"{label:12s} -> {err}")

broadcast_bug = zero_params["weight"] - 0.05 * jnp.array(-4.5)
print("unchecked scalar broadcast:", [round(float(v), 3) for v in broadcast_bug])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
renamed key  -> gradient tree structure mismatch
scalar leaf  -> gradient leaf shape mismatch
unchecked scalar broadcast: [0.225, 0.225]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pytree_schema_dark.png" alt="Parameter and gradient pytrees must match on both tree structure (weight and bias keys) and leaf shapes ([2] and scalar). With valid gradients [-4.5, -1.5] and -2.5 at lr=0.05, SGD yields weight [0.225, 0.075] and bias 0.125. Renaming weight to kernel fails structure checks; passing scalar -4.5 fails leaf-shape checks and would broadcast to [0.225, 0.225]." />
  <figcaption>Structure checks catch renamed keys (kernel vs weight), while explicit leaf-shape checks stop a scalar gradient from silently broadcasting across every weight entry.</figcaption>
</figure>

### Separate dynamic leaves from static metadata

Array values inside same-shaped leaves can change every step without triggering recompilation. Architecture settings (layer counts, activation names, dropout flags) belong in static metadata or static arguments. Changing static metadata or pytree structure triggers a new trace, so keep configuration outside hot step inputs.

```checkpoint
You need per-example gradient norms for clipping, but the current step differentiates the batch mean loss. Should you wrap the entire `train_step` in `vmap`?
---
No. Derive `jax.vmap(jax.grad(loss_one), in_axes=(None, 0, 0))` for the gradient computation alone, clip and average those gradients, and apply one optimizer update. Wrapping the full stateful step would unnecessarily duplicate optimizer state across the batch.
```

## Translate a tiny training step

Compare the familiar PyTorch step:

```python title="pytorch_step.py"
model.train()
optimizer.zero_grad(set_to_none=True)
loss = ((model(x) - y) ** 2).mean()
loss.backward()
optimizer.step()
```

with its pure, jitted JAX equivalent on our four-row dataset. Notice that `train_step` returns the loss evaluated *before* applying that step's update, so we compute a fresh `final_loss` after 80 steps:

<!-- leetllm: test, deps=jax==0.11.2, output=show, output_title="Tiny JAX training step", continue=jax-tree, id=jax-training -->
```python title="tiny_jax_training_step.py"
@jax.jit
def train_step(params, features, targets, learning_rate):
    loss, grads = jax.value_and_grad(batch_loss)(params, features, targets)
    new_params = jax.tree.map(lambda p, g: p - learning_rate * g, params, grads)
    return new_params, loss

params = zero_params
first_params, first_loss = train_step(params, x, y, jnp.array(0.05))
print("step 1 loss:", float(first_loss), "| weight:", [round(float(v), 3) for v in first_params["weight"]], "| bias:", round(float(first_params["bias"]), 3))

for _ in range(80):
    params, _ = train_step(params, x, y, jnp.array(0.05))

final_loss = batch_loss(params, x, y).block_until_ready()
print("after 80 steps -> loss:", round(float(final_loss), 6),
      "| weight:", [round(float(v), 3) for v in params["weight"]],
      "| bias:", round(float(params["bias"]), 3))
print("original zero_params intact:", zero_params["weight"].tolist())
```

<!-- leetllm: output:start -->
```text title="Tiny JAX training step" output compact
step 1 loss: 3.75 | weight: [0.225, 0.075] | bias: 0.125
after 80 steps -> loss: 0.007605 | weight: [1.927, -0.839] | bias: -0.041
original zero_params intact: [0.0, 0.0]
```
<!-- leetllm: output:end -->

Now add two pieces of real training state: **momentum** (`v_new = 0.9 * v + grad`) and **input dropout** (keep probability `0.75`, rescaled by `1 / 0.75`). Every stateful piece joins the input/output tuple. Replaying identical inputs reproduces identical outputs, while threading `(p1, v1, key1)` advances both velocity and the continuation key:

<!-- leetllm: test, deps=jax==0.11.2, output=show, continue=jax-training, id=jax-state -->
```python title="momentum_and_key_state.py"
from jax import random

@jax.jit
def momentum_step(params, velocity, key, features, targets):
    next_key, dropout_key = random.split(key)
    mask = random.bernoulli(dropout_key, p=0.75, shape=features.shape)
    dropped = features * mask / 0.75
    loss, grads = jax.value_and_grad(batch_loss)(params, dropped, targets)
    new_velocity = jax.tree.map(lambda v, g: 0.9 * v + g, velocity, grads)
    new_params = jax.tree.map(lambda p, v: p - 0.05 * v, params, new_velocity)
    return new_params, new_velocity, next_key, {"loss": loss, "mask": mask}

velocity = jax.tree.map(jnp.zeros_like, zero_params)
key = random.key(7, impl="threefry2x32")

p1, v1, key1, m1 = momentum_step(zero_params, velocity, key, x, y)
p1_replay, v1_replay, _, _ = momentum_step(zero_params, velocity, key, x, y)
p2, v2, key2, m2 = momentum_step(p1, v1, key1, x, y)
jax.block_until_ready((p2, v2, key2, m2))

replay_exact = bool(jnp.array_equal(p1["weight"], p1_replay["weight"]) and jnp.array_equal(v1["weight"], v1_replay["weight"]))
key_advanced = not bool(jnp.array_equal(random.key_data(key1), random.key_data(key2)))
print("exact replay matches:    ", replay_exact)
print("continuation key changed:", key_advanced)
print("step 1 weight & velocity:", [round(float(v), 3) for v in p1["weight"]], [round(float(v), 3) for v in v1["weight"]])
print("step 1 dropout mask:     ", m1["mask"].astype(jnp.int32).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
exact replay matches:     True
continuation key changed: True
step 1 weight & velocity: [0.1, 0.0] [-2.0, 0.0]
step 1 dropout mask:      [[1, 0], [1, 1], [1, 1], [0, 0]]
```
<!-- leetllm: output:end -->

## JIT compiles a signature-specific executable

<span data-glossary="just-in-time-compilation">Just-in-time (JIT) compilation</span> transforms a Python function in three stages whenever it sees a new input signature:[^jax2026jit][^jax2026JitApi]

1. **Tracing:** Runs Python once with abstract **tracers** carrying shape and dtype, recording pure array operations into a **Jaxpr**.
2. **Lowering:** Translates the Jaxpr to StableHLO.
3. **Compilation:** XLA compiles a specialized executable for CPU, GPU, or TPU.

JAX keys its compilation cache on function identity, pytree structure, array shapes, dtypes, scalar weak typing, static arguments, and sharding. That is why a short final batch (`[16, 512]` after `[32, 512]`) triggers a brand-new compile!

<figure>
  <img src="illustrations/_generated/jit_input_contract_dark.png" alt="A jitted function reading Python global scale captures scale=1 on the first call with float32 shape [4] and returns 4. Changing global scale=3 while reusing shape [4] hits Trace A and still returns 4. Calling shape [2] misses cache, traces with global scale=3 as Trace B, and returns 6. Passing scale=3 as an explicit array argument returns 12 on shape [4]." />
  <figcaption>The first trace on shape [4] captures global scale=1 and keeps returning 4 even after scale changes to 3. A new shape [2] retraces and captures 3. Passing scale as an explicit array argument fixes the bug immediately.</figcaption>
</figure>

### Pad batches without distorting loss or gradients

To avoid recompiling on a short remainder batch, pad it to the standard compiled shape and pass a boolean `valid` mask. Simply taking `.mean()` over the padded batch dilutes both the loss (`3.75 -> 2.5`) and gradients by the padding ratio; divide the masked sum by `jnp.maximum(valid.sum(), 1)` instead:

<!-- leetllm: test, deps=jax==0.11.2, output=show, continue=jax-state, id=jax-padding -->
```python title="pad-without-changing-the-objective.py"
padded_x = jnp.pad(x, ((0, 2), (0, 0)))
padded_y = jnp.pad(y, (0, 2))
valid = jnp.array([True, True, True, True, False, False])

def masked_loss(params, features, targets, mask):
    per_row = jax.vmap(loss_one, in_axes=(None, 0, 0))(params, features, targets)
    return jnp.where(mask, per_row, 0.0).sum() / jnp.maximum(mask.sum(), 1)

masked_vg = jax.jit(jax.value_and_grad(masked_loss))
val, grad = masked_vg(zero_params, padded_x, padded_y, valid)
empty_val, empty_grad = masked_vg(zero_params, padded_x, padded_y, jnp.zeros_like(valid))

print("naive padded mean: ", float(batch_loss(zero_params, padded_x, padded_y)))
print("masked valid mean: ", float(val), "| matches unpadded grad:", bool(jnp.allclose(grad["weight"], mean_grad["weight"])))
print("all-padding batch: ", float(empty_val), "| grad:", empty_grad["weight"].tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
naive padded mean:  2.5
masked valid mean:  3.75 | matches unpadded grad: True
all-padding batch:  0.0 | grad: [0.0, 0.0]
```
<!-- leetllm: output:end -->

> **Key insight:** An all-padding batch returns zero loss and zero gradient safely, but **still skip the optimizer step**! Momentum (`0.9 * velocity`) and weight decay will continue moving parameters even when the gradient is all zeros.

### Watch captured globals and scalar weak typing

Two subtle cache behaviors can surprise researchers: mutating a captured Python global only takes effect when a *different* shape triggers retracing, and mixing Python floats (weakly typed) with explicit `jnp.float32` arrays compiles two separate variants for the same numerical value:

<!-- leetllm: test, deps=jax==0.11.2, output=show -->
```python title="trace_and_global_capture.py"
import jax
import jax.numpy as jnp

scale = 1.0
traces = []

@jax.jit
def captured(values):
    traces.append(values.shape)  # diagnostic trace counter
    return values.sum() * scale

first = float(captured(jnp.ones(4, dtype=jnp.float32)))
scale = 3.0
same_shape = float(captured(jnp.ones(4, dtype=jnp.float32)))
new_shape = float(captured(jnp.ones(2, dtype=jnp.float32)))
explicit = jax.jit(lambda v, s: v.sum() * s)(jnp.ones(4), jnp.array(3.0))

print(f"captured global outputs: {first}, {same_shape} (stale!), {new_shape} (retraced)")
print(f"traced shapes: {traces} | explicit argument output: {float(explicit)}")

weak_traces = []
@jax.jit
def shift(v):
    weak_traces.append((str(v.dtype), v.weak_type))
    return v + 1.0

_ = [shift(1.0), shift(jnp.array(1.0, dtype=jnp.float32)), shift(jnp.array(2.0, dtype=jnp.float32))]
print("scalar weak-typing traces:", weak_traces)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
captured global outputs: 4.0, 4.0 (stale!), 6.0 (retraced)
traced shapes: [(4,), (2,)] | explicit argument output: 12.0
scalar weak-typing traces: [('float32', True), ('float32', False)]
```
<!-- leetllm: output:end -->

### Tracers aren't ordinary Python values

During tracing, arrays are abstract tracers rather than concrete Python numbers, so `if value > 0:` raises `TracerBoolConversionError`.[^jax2026jit] Replace data-dependent Python control flow with JAX primitives:

| Intent | JAX primitive |
|---|---|
| Elementwise selection | `jnp.where(condition, a, b)` |
| Scalar branch between two functions | `jax.lax.cond(condition, true_fn, false_fn, operand)` |
| Data-dependent loop count | `jax.lax.while_loop(cond_fn, body_fn, init_val)` |
| Fixed-length sequential loop with carry | `jax.lax.scan(step_fn, init_carry, xs, length=...)` |
| Small fixed configuration choice | `static_argnames=...` (bounded recompiles) |

Two classic pitfalls live right here:

1. **NaN gradients in inactive `jnp.where` branches:** Both arguments of `jnp.where` are evaluated and differentiated, so `jnp.where(x > 0, jnp.log(x), 0.0)` gives a clean `0.0` forward value at `x = 0` but a `NaN` gradient! Make the input safe *before* `jnp.log` (`arg = jnp.where(x > 0, x, 1.0)`).[^jax2026Faq]
2. **Reverse-mode differentiation through loops:** `lax.while_loop` cannot be differentiated with ordinary reverse-mode `jax.grad`, whereas fixed-length `lax.scan` supports reverse-mode gradients cleanly (at the cost of a fixed iteration count).[^jax2026Cond][^jax2026WhileLoop]

<!-- leetllm: test, deps=jax==0.11.2, output=show -->
```python title="tracer_safe_control_flow.py"
import jax
import jax.numpy as jnp

# 1. Safe inactive arithmetic for reverse-mode autodiff
unsafe_log = lambda v: jnp.where(v > 0, jnp.log(v), 0.0)
safe_log = lambda v: jnp.where(v > 0, jnp.log(jnp.where(v > 0, v, 1.0)), 0.0)
x0 = jnp.array(0.0, dtype=jnp.float32)
print("unsafe_log(0) -> val:", float(unsafe_log(x0)), "| grad:", float(jax.grad(unsafe_log)(x0)))
print("safe_log(0)   -> val:", float(safe_log(x0)), "| grad:", float(jax.jit(jax.grad(safe_log))(x0)))

# 2. TracerBoolConversionError vs lax.cond
try:
    jax.jit(lambda v: v if v > 0 else -v)(jnp.array(-2.0))
except jax.errors.TracerBoolConversionError as err:
    print("Python if on tracer:", type(err).__name__)

fixed_abs = jax.jit(lambda v: jax.lax.cond(v > 0, lambda z: z, lambda z: -z, v))
print("lax.cond abs(-2), abs(3):", float(fixed_abs(jnp.array(-2.0))), float(fixed_abs(jnp.array(3.0))))

# 3. while_loop vs fixed-length scan under jax.grad
dynamic_loop = lambda v: jax.lax.while_loop(lambda z: z < 8.0, lambda z: 2.0 * z, v)
three_doublings = lambda v: jax.lax.scan(lambda z, _: (2.0 * z, None), v, xs=None, length=3)[0]

print("while_loop(1.0):", float(dynamic_loop(jnp.array(1.0))), "| while_loop(3.0):", float(dynamic_loop(jnp.array(3.0))))
try:
    jax.grad(dynamic_loop)(jnp.array(1.0))
except ValueError as err:
    print("grad(while_loop):", type(err).__name__)
print("scan(3.0):", float(three_doublings(jnp.array(3.0))), "| grad(scan)(1.0):", float(jax.grad(three_doublings)(jnp.array(1.0))))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unsafe_log(0) -> val: 0.0 | grad: nan
safe_log(0)   -> val: 0.0 | grad: 0.0
Python if on tracer: TracerBoolConversionError
lax.cond abs(-2), abs(3): 2.0 3.0
while_loop(1.0): 8.0 | while_loop(3.0): 12.0
grad(while_loop): ValueError
scan(3.0): 24.0 | grad(scan)(1.0): 8.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/scan_control_flow_dark.png" alt="Both programs double their scalar state. The dynamic while loop continues while the state is below 8; the scan performs exactly three steps. For the original input 1 both traces are 1,2,4,8. An additional execution at input 3 gives the while trace 3,6,12, which stops after two doublings, while the scan trace is 3,6,12,24. Reverse factors through the fixed scan are 2,2,2, giving derivative 8. Ordinary JAX reverse-mode differentiation through the dynamic while loop is unsupported." />
  <figcaption>Starting at 3 exposes the behavioral difference: while_loop stops at 12 after two doublings (no reverse-mode grad), whereas a 3-step scan continues to 24 with derivative 2 x 2 x 2 = 8.</figcaption>
</figure>

## Measure completed accelerator work

JAX dispatches array computations **asynchronously**: Python returns a future handle immediately while the device is still running. Timing `result = compiled_fn(x)` without synchronization measures only Python enqueue latency, making JAX look deceptively fast.[^jax2026benchmarking]

Call `.block_until_ready()` on an array (or `jax.block_until_ready(pytree)` on a structured return) before stopping the clock. Also place inputs on device beforehand, report cold compile+run separately from warm runs, and match dtypes (JAX defaults to float32 whereas NumPy defaults to float64):[^jax2026benchmarking]

<!-- leetllm: test, deps=jax==0.11.2 -->
```python title="honest_jax_timing.py"
import jax
import numpy as np
from time import perf_counter

cpu = jax.devices("cpu")[0]
x_host = np.arange(512 * 64, dtype=np.float32).reshape(512, 64) / 1024
x_device = jax.device_put(x_host, cpu).block_until_ready()
compiled_fn = jax.jit(lambda v: v.T @ (v - v.mean(axis=0)))

t0 = perf_counter()
cold = compiled_fn(x_device).block_until_ready()
cold_ms = (perf_counter() - t0) * 1000

for _ in range(5):
    compiled_fn(x_device).block_until_ready()

t0 = perf_counter()
for _ in range(20):
    warm = compiled_fn(x_device).block_until_ready()
warm_ms = (perf_counter() - t0) * 1000 / 20

print(f"backend={cpu.platform} | out_shape={warm.shape} | cold={cold_ms:.2f} ms | warm={warm_ms:.3f} ms/call")
```

```checkpoint
A benchmark claims JAX is 40x faster than PyTorch. The JAX timer measures one post-compile call without `.block_until_ready()`; the PyTorch timer includes the first call and GPU synchronization. What is wrong with the comparison?
---
The JAX timer measured only Python dispatch overhead while PyTorch measured cold startup plus completed execution. Fair timing requires matched dtypes, inputs on device, separate cold vs warm measurements, and synchronization (`block_until_ready` / `torch.cuda.synchronize`) on both sides.
```

### Treat device placement as explicit state

`vmap` maps array axes, not hardware devices. Multi-device JAX uses three main interfaces:

- **Sharded arrays + `jit`:** Combine a device `Mesh` with `NamedSharding` and a `PartitionSpec` to place array dimensions across accelerators; XLA inserts collective communications automatically when operations cross sharded axes.[^jax2026Sharding]
- **`jax.shard_map`:** Expresses explicit per-shard code with manual collectives and composes cleanly with `jit` (local shard shapes differ from global shapes).[^jax2026ShardMap]
- **`jax.pmap`:** Legacy replica-oriented mapping over a leading device axis; modern JAX recommends `shard_map` for new code.[^jax2026Pmap]

When replicas need independent randomness (such as per-device dropout), derive keys with `fold_in` using a globally unique replica ID (not just local device index, which repeats across hosts).

## Failure cases that look like model bugs

| Symptom | Likely cause | Fix |
|---|---|---|
| Repeated random samples | Same subkey reused across calls | Split at each consumer and use every subkey once |
| Original array unchanged | `.at[...]` return value discarded | Capture the returned array or updated pytree |
| `print()` fires only once | Side effect executed during tracing only | Return metrics or use `jax.debug.print` |
| Hyperparameter edit has no effect | Python global captured in cached trace | Pass as an explicit array or bounded static argument |
| `TracerBoolConversionError` | Python `if`/`while` on a traced array | Use `jnp.where`, `lax.cond`, `lax.scan`, or `static_argnames` |
| Recurring multi-second pauses | Varying shape, dtype, weak typing, or callable identity | Pad/bucket shapes and standardize scalar dtypes |
| Implausibly fast benchmark | Asynchronous call not synchronized | Call `.block_until_ready()` or `jax.block_until_ready(tree)` |
| Tree-map structure error | Parameter and gradient pytrees disagree | Compare `jax.tree.structure` and leaf shapes |
| Checkpoint loads but outputs drift | Transposed layout or dtype mismatch | Verify named leaf paths, shapes, dtypes, and one forward pass |

### Debug outside in

Remove `jit` first and run the smallest failing function eagerly to get clean Python <span data-glossary="stack-trace">stack traces</span> and verify raw numbers. Inspect `jax.make_jaxpr(fn)(inputs)` and compare `jax.tree.structure` before digging into compiler dumps. Then re-apply transformations one layer at a time: base function -> `grad` -> `vmap` -> `jit`.

## Preserve JAX when its structure carries evidence

A research repository's tests, checkpoints, data ordering, precision settings, and sharding rules define the paper's exact experiment. Rewriting the whole repo into PyTorch changes a dozen variables simultaneously.

| Situation | Best default move | Before porting broadly |
|---|---|---|
| Tweaking a loss term | Edit the pure JAX loss directly | Verify eager + jitted loss and gradient parity |
| Adding per-example metrics | `vmap` a small pure metric function | Check output shapes and memory |
| Loading reference checkpoints | Keep original pytree paths intact | Verify named leaves and forward outputs |
| Production requires PyTorch | Keep JAX repo as numerical oracle | Port only the smallest isolated module with tolerance tests |
| Personal framework preference | Do not rewrite yet | Document a concrete blocker first |

## A focused modification workflow

When adding a new term to an existing JAX codebase, follow an incremental evidence ladder:

1. Save one reference input batch and baseline outputs/gradients.
2. Add the new term to the pure scalar loss and verify a known zero case and known nonzero case eagerly.
3. Compare analytical gradients against finite differences on a tiny float input.
4. Check gradient pytree structure and finiteness.
5. Run the jitted step twice with fixed shapes, then vary only the PRNG key to confirm stochastic progression.
6. Benchmark cold compile and synchronized warm execution separately.

Apply that ladder right now by adding an L2 weight penalty `0.1 * sum(weight ** 2)` (leaving `bias` unregularized) to our regression model. At zero weights the penalty and gradient are `0.0`; at `[2, -1]` the penalty is `0.5` and its gradient is `[0.4, -0.2]`:

<!-- leetllm: test, deps=jax==0.11.2, output=show, continue=jax-padding -->
```python title="verify_weight_regularizer.py"
def weight_penalty(params):
    return 0.1 * jnp.square(params["weight"]).sum()

exact_params = {"weight": jnp.array([2.0, -1.0]), "bias": jnp.array(0.0)}
penalty_vg = jax.jit(jax.value_and_grad(weight_penalty))

for label, candidate in [("zero ", zero_params), ("exact", exact_params)]:
    val, grad = penalty_vg(candidate)
    print(f"{label} | penalty={float(val):.2f} | w_grad={[round(float(v), 2) for v in grad['weight']]} | b_grad={float(grad['bias']):.1f}")

def regularized_loss(params, features, targets):
    return batch_loss(params, features, targets) + weight_penalty(params)

reg_vg = jax.jit(jax.value_and_grad(regularized_loss))
reg_params = zero_params
for _ in range(80):
    _, grads = reg_vg(reg_params, x, y)
    reg_params = jax.tree.map(lambda p, g: p - 0.05 * g, reg_params, grads)

print("regularized objective: 3.75 ->", round(float(regularized_loss(reg_params, x, y)), 6))
print("shrunk weights:       ", [round(float(v), 3) for v in reg_params["weight"]])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
zero  | penalty=0.00 | w_grad=[0.0, 0.0] | b_grad=0.0
exact | penalty=0.50 | w_grad=[0.4, -0.2] | b_grad=0.0
regularized objective: 3.75 -> 0.399595
shrunk weights:        [1.635, -0.614]
```
<!-- leetllm: output:end -->

Every JAX training step reduces to the same clear pattern: explicit state in, explicit state out, one-use keys, stable compiled shapes, and synchronized timing.

```mastery-quiz
[
  {
    "question": "A scalar model predicts w×x and uses squared error. At w=1, the two rows are (x=2, target=4) and (x=1, target=0). For per-example clipping, what are the gradient norms in row order? What is the signed gradient of the mean loss with respect to w before clipping?",
    "options": [
      "Row norms [3, 3]. Mean loss gradient −3.",
      "Row norms [8, 2]. Mean loss gradient −3.",
      "Row norms [8, 2]. Mean loss gradient 3.",
      "Row norms [3, 3]. Mean loss gradient 3."
    ],
    "answer": "Row norms [8, 2]. Mean loss gradient −3.",
    "explanation": "Differentiate each row's loss first: 2(2 - 4)(2) = -8 and 2(1 - 0)(1) = 2, with norms [8, 2]. Averaging the signed gradients gives (-8 + 2) / 2 = -3."
  },
  {
    "question": "An ordinary array a=[2,5,8] evaluates a.at[1].set(11) but discards its return. It then reads a.at[9].get() using the default indexing mode. What values are observed for a[1] and that out-of-range get?",
    "options": [
      "11 and 8.",
      "5 and 2.",
      "11 and 2.",
      "5 and 8."
    ],
    "answer": "5 and 8.",
    "explanation": "Discarding the returned array leaves a[1] unchanged at 5. Under default indexing, out-of-bounds index 9 clips to the last valid index (2), returning a[2] = 8."
  },
  {
    "question": "Two dropout calls each keep one bit with probability 0.8. Both return True, and the log omits their keys. How often would the bits agree under independent draws? Which follow-up finding would confirm that these two calls reused a key?",
    "options": [
      "68%. Both calls took child 0 from the same split.",
      "64%. Both calls took child 0 from the same split.",
      "68%. Both calls returned True again on exact replay.",
      "64%. Both calls returned True again on exact replay."
    ],
    "answer": "68%. Both calls took child 0 from the same split.",
    "explanation": "Independent agreement probability is 0.8² + 0.2² = 64% + 4% = 68%. Tracing both calls to the exact same child key confirms key reuse."
  },
  {
    "question": "A fresh stable jitted function sums float32 ones and multiplies by a Python global. A Python global of 3 is captured on its first length 6 call. The global becomes 7, then the same length 6 call and a new length 4 call run. No relevant variant was cached before these calls. What are the three outputs?",
    "options": [
      "18, 42, 28.",
      "18, 18, 12.",
      "18, 18, 28.",
      "18, 42, 12."
    ],
    "answer": "18, 18, 28.",
    "explanation": "The first length-6 trace captures 3 (6 x 3 = 18). Reusing shape 6 hits the cached executable and still returns 18. The unseen length 4 retraces with 7 and returns 28."
  },
  {
    "question": "Three valid independent rows have squared losses [1,9,4]. Two finite zero-loss padding rows stabilize the compiled shape. What are the naive five-row mean and the valid-count mean? Round to three decimals.",
    "options": [
      "Naive 4.667; valid 2.800.",
      "Naive 2.800; valid 7.000.",
      "Naive 2.800; valid 4.667.",
      "Naive 7.000; valid 4.667."
    ],
    "answer": "Naive 2.800; valid 4.667.",
    "explanation": "The loss sum is 14. Dividing by all 5 rows gives 2.800; dividing by the 3 valid rows gives 14 / 3 ≈ 4.667."
  },
  {
    "question": "A zero weight leaf has shape [3]. Its correct gradient is [−0.4,0.1,0.3], but a refactor passes scalar −0.4 under the same tree path. With learning rate 0.2, what does unchecked broadcasting produce, and which validation should reject it?",
    "options": [
      "[0.08,0.08,0.08]; reject exact-shape mismatch.",
      "[0.08,−0.02,−0.06]; reject named-path mismatch.",
      "[0.08,0.08,0.08]; reject named-path mismatch.",
      "[0.08,−0.02,−0.06]; reject exact-shape mismatch."
    ],
    "answer": "[0.08,0.08,0.08]; reject exact-shape mismatch.",
    "explanation": "Scalar -0.4 broadcasts across all 3 entries (0 - 0.2 x -0.4 = 0.08). Keys still match, so exact leaf-shape validation is required to catch the bug."
  },
  {
    "question": "For readings below 2.5, a loss returns the natural log of twice the distance to 2.5. At and above 2.5, it returns zero. The JAX code computes `d = 2.5 - x` and returns `where(x < 2.5, log(arg), 0.0)`. Which definition of `arg` preserves the active loss and gives a finite reverse-mode gradient at the cutoff?",
    "options": [
      "`maximum(d, 0.0)`",
      "`maximum(2*d, 0.0)`",
      "`where(x < 2.5, d, 1.0)`",
      "`where(x < 2.5, 2*d, 1.0)`"
    ],
    "answer": "`where(x < 2.5, 2*d, 1.0)`",
    "explanation": "Replacing the inactive log input with 1.0 prevents log(0) from producing a NaN gradient during reverse-mode differentiation while preserving 2*d for active inputs."
  },
  {
    "question": "A data-dependent loop doubles while its value is below 20. Starting at 5, compare it with a replacement scan that always doubles exactly three times. What are their outputs, and what is the fixed scan derivative with respect to its input?",
    "options": [
      "Loop 20; scan 20; scan derivative 4.",
      "Loop 20; scan 40; scan derivative 8.",
      "Loop 40; scan 40; scan derivative 8.",
      "Loop 40; scan 20; scan derivative 4."
    ],
    "answer": "Loop 20; scan 40; scan derivative 8.",
    "explanation": "The while loop stops at 5 -> 10 -> 20. Three fixed doublings reach 40 with derivative 2 x 2 x 2 = 8."
  },
  {
    "question": "An all-padding diagnostic returns zero gradients. A momentum optimizer still runs with scalar parameter 2, old velocity 0.4, coefficient 0.8 and learning rate 0.1. It uses new_velocity=coefficient×old_velocity+gradient, then parameter −learning_rate×new_velocity. What returned velocity and parameter follow?",
    "options": [
      "Velocity 0.320; parameter 1.968.",
      "Velocity 0.000; parameter 2.000.",
      "Velocity 0.320; parameter 2.000.",
      "Velocity 0.400; parameter 1.960."
    ],
    "answer": "Velocity 0.320; parameter 1.968.",
    "explanation": "Zero gradient still leaves velocity 0.8 x 0.4 = 0.320 and updates the parameter to 2 - 0.1 x 0.320 = 1.968, which is why empty batches must skip the optimizer step."
  },
  {
    "question": "A controlled cold call takes 48 ms through compilation and result completion. After warm-up, Python returns at 1 ms but every result leaf is ready at 13 ms from call start. Inputs are already on device. Which cold and warmed synchronized per-call latencies should be reported?",
    "options": [
      "Cold 13 ms; warm 1 ms.",
      "Cold 48 ms; warm 13 ms.",
      "Cold 48 ms; warm 1 ms.",
      "Cold 48 ms; warm 12 ms."
    ],
    "answer": "Cold 48 ms; warm 13 ms.",
    "explanation": "Cold latency is 48 ms including compilation, and synchronized warm latency runs from Python call start until the last result leaf finishes at 13 ms."
  }
]
```

> **Next:** Continue to [Continued Pretraining for Domain Shift](/learn/continued-pretraining-domain-adaptation). A compiled research step still needs its checkpoints and tests. Keep that discipline while adapting a base model on domain text: pin the data and starting checkpoint, then measure domain gain against general-capability regression.
