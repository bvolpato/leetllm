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
  "shortDescription": "A short final batch recompiles, and dropout repeats one mask. Read the JAX step as explicit state to distinguish shape and key bugs from loss behavior.",
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

You change a loss term in a paper's <span data-glossary="jax">JAX</span> repository. The numbers look right, but a short final batch triggers another compilation and dropout repeats the same mask. Those failures can come from shapes and random-key ownership rather than the model's mathematics.

You already know tensors, <span data-glossary="gradient">gradients</span>, and training loops from <span data-glossary="pytorch">PyTorch</span>. We'll keep a four-row linear-regression example small enough to check by hand while making parameters, updates, and randomness explicit. The same checks help you modify a larger research implementation without replacing its framework.

## Read the program before choosing a rewrite

JAX is an array-computing and program-transformation library. `jax.numpy` supplies a NumPy-shaped interface, while transformations such as `grad`, `vmap`, and `jit` derive new functions from functions you wrote.[^jax2026quickstart] The central unit isn't a model object. It is a numerical function with explicit input and output arrays.

Start by tracing one call, not by translating a whole framework. Find the batch entering the loss, the values returned by one step, and the point where a transformed function transitions from Python into JAX tracing. Once you can name those edges, later choices about `vmap`, `jit`, or sharding have somewhere concrete to attach.

PyTorch researchers often meet JAX through a larger stack such as Flax, Equinox, Optax, or a lab-specific framework. Those libraries may package state differently, but core JAX still determines how arrays are traced, differentiated, vectorized, compiled, and dispatched. Read through library wrappers until you find the pure numerical core.

While tracing that call, identify changing state, shape/static arguments, random-key ownership, and transformed functions. For our example, the model predicts `weight[0] * x[0] + weight[1] * x[1] + bias`. Its four rows are:

| Features | Target | Prediction with zero parameters | Squared error |
|---|---|---|---|
| `[1, 0]` | 2 | 0 | 4 |
| `[0, 1]` | -1 | 0 | 1 |
| `[1, 1]` | 1 | 0 | 1 |
| `[2, 1]` | 3 | 0 | 9 |

The initial mean squared error is `(4 + 1 + 1 + 9) / 4 = 3.75`. We know an exact solution too: weights `[2, -1]` and bias `0`. Those numbers give us an independent check before compilation enters the story.

That inventory often reveals a narrow edit. Put a new regularizer in the loss, change sampling where a one-use key enters, or derive a per-example statistic with `vmap`; leave the surrounding research harness alone until evidence says it's the problem.

Neither framework has only one programming style. The table is a reading lens, not a law.

| PyTorch habit | JAX reading lens | Question to ask |
|---|---|---|
| `nn.Module` owns parameters | parameters often arrive as a pytree | where is the new parameter tree returned? |
| `loss.backward()` fills `.grad` | `grad` returns a gradient tree | which argument is differentiated? |
| `optimizer.step()` updates state | update function returns state | who stores next <span data-glossary="optimizer-state">optimizer state</span>? |
| RNG state sits behind an API | a key enters a pure helper | is every subkey used once? |
| tensor indexing may mutate | `.at[...]` returns updated value | did caller keep returned array? |
| loop handles a batch | `vmap` transforms one-example code | which axis is mapped? |
| compiled module or function | `jit` specializes a pure function | what shapes and static values vary? |

## One step is a state transition

In the GPT lab, mutation was the whole loop: `model.train()`, `optimizer.zero_grad()`, `loss.backward()`, `optimizer.step()`. Parameters changed on the module, gradient buffers appeared on tensors, and separate generators advanced while sampling training and validation windows. That model had no dropout. The call site can observe the result, but its return type doesn't tell you which pieces changed.

With Adam and dropout, the caller must retain updated parameters, updated <span data-glossary="optimizer">optimizer</span> state, a continuation key, and metrics. Stateful layers may add statistics such as a running mean. JAX transformations work cleanly when those changing values become ordinary inputs and outputs.[^jax2026stateful]

Read the figure as that caller's ledger. Every arrow marks ownership: the step consumes current state and hands back the next state.

<figure>
  <img src="illustrations/_generated/explicit_state_step_dark.png" alt="A momentum and input-dropout training step receives zero weights, bias, and velocity plus a seed-7 Threefry key. Splitting retains K1 and issues dropout key D0 for the 4x2 mask [[1,0],[1,1],[1,1],[0,0]], rescaled by 1/0.75. Before the update, loss is 3.75 with gradients weight=[-2.0, 0.0] and bias=-2.5. With momentum 0.9 and learning rate 0.05, the step returns updated velocity [-2.0, 0.0] and -2.5, updated parameters [0.1, 0.0] and 0.125, and continuation key K1 while leaving inputs untouched." />
  <figcaption>This replays the momentum and input-dropout step whose optimizer state is a velocity tree. Masked features are rescaled by 1/0.75 before differentiation. The caller keeps returned parameter and velocity leaves plus continuation key K₁. Read-only batch values and old arrays retain their values; loss 3.75 is evaluated before the update.</figcaption>
</figure>

A useful signature looks like this:

```python title="state_transition_signature.py"
def train_step(params, optimizer_state, batch, key):
    key, step_key = split(key)
    loss, grads = differentiate(params, batch, step_key)
    updates, optimizer_state = update(grads, optimizer_state, params)
    params = apply_updates(params, updates)
    metrics = {"loss": loss}
    return params, optimizer_state, key, metrics
```

That snippet illustrates the pure functional interface in structural pseudocode. Nothing inside needs to reach into a global model, global key, or hidden optimizer object. Adapt the state and update calls to your optimizer library.

### Pure means observable through arguments and returns

A pure function produces outputs from inputs without reading or writing changing hidden external state. For the ordinary array-based functions taught here, JAX's guides recommend this discipline: tracing can capture Python state and skip Python side effects on later cached calls.[^jax2026sharpbits] Controlled `Ref` effects are a separate supported interface, not permission to mutate arbitrary Python globals inside `jit`.[^jax2026ArrayRefs]

Suppose a jitted loss reads `weight_decay` from a module-level variable. The first trace captures 0.01; a later Python global edit to 0.1 leaves the cached executable using its captured value until a shape or signature change triggers retracing. Pass hyperparameters as arguments, then decide whether each one is an array value or a small static configuration.

Printing inside a jitted function exposes the same tracing rule. Python `print` runs while JAX traces, so it displays a tracer once instead of a device value on subsequent executions. Return metrics, use `jax.debug.print` when you need a transformed-code debug print, or inspect values outside the compiled function.

## Immutable arrays remove aliasing surprises

For ordinary arrays and tensors, NumPy and PyTorch support item assignment such as `x[i] = value`. JAX's ordinary `jax.Array` values are immutable; that assignment raises `TypeError`.[^jax2026sharpbits] Immutability lets us reason about old and new values separately.

To update an element, JAX provides the `.at[...]` indexing operator: `updated = x.at[i].set(value)`. This expression returns a fresh array value representing the updated state; the original `x` remains completely untouched.

Logical immutability does not mean an update must copy a whole buffer. The `.at` documentation guarantees compiled indexed updates are applied in place; JAX still preserves the observable value semantics.[^jax2026At] Buffer donation is another mechanism: `donate_argnums` permits recycling an input buffer, but you must stop using that donated input. Other operations can still allocate.[^jax2026JitApi] Mutable `Ref` values also support controlled state and memory management, including training use cases. We use ordinary arrays in this lesson.[^jax2026ArrayRefs]

The examples were checked with JAX/jaxlib 0.11.2 on one CPU device using Python 3.12. The package was released September 17, 2026.[^jax2026Release] To reproduce the numerical checks locally, save each independent cell as a file, or combine linked cells in order, and run:

```bash title="Run a CPU example"
uv run --python 3.12 --with jax==0.11.2 example.py
```

The installed CPU package selects a matching jaxlib. Accelerator setup is outside this lesson.

After `updated = original.at[1].set(99)`, should `original` show 20 or 99? Compare both bindings in this example.

<!-- leetllm: test, deps=jax==0.11.2, output=show, output_title="Immutable update" -->

```python title="immutable_update.py"
import jax.numpy as jnp

original = jnp.array([10, 20, 30])
updated = original.at[1].set(99)

print("original", original.tolist())
print("updated ", updated.tolist())
print("separate values", bool(jnp.array_equal(original, jnp.array([10, 20, 30]))))

assert original.tolist() == [10, 20, 30]
assert updated.tolist() == [10, 99, 30]
try:
    original[1] = 99
except TypeError:
    print("item assignment rejected")
else:
    raise AssertionError("Immutable array accepted item assignment")

# Immutability doesn't provide Python-style bounds checking.
out_of_bounds = original.at[9].set(99)
assert jnp.array_equal(out_of_bounds, original)
print("out-of-bounds set:", out_of_bounds.tolist())
print("out-of-bounds get:", int(original.at[9].get()))
```

<!-- leetllm: output:start -->
```text title="Immutable update" output compact
original [10, 20, 30]
updated  [10, 99, 30]
separate values True
item assignment rejected
out-of-bounds set: [10, 20, 30]
out-of-bounds get: 30
```
<!-- leetllm: output:end -->

The default indexing mode assumes valid indices: an out-of-bounds update is dropped, while `.at[index].get()` clips its index. Neither necessarily raises `IndexError`. Validate indices whenever strict bounds matter to your computation; do not confuse immutable values with bounds-checked indexing.[^jax2026At]

An easy porting mistake drops the return value:

```python title="dropped_update.py"
params["bias"].at[...].add(0.1)  # computed, then discarded
```

The corrected version keeps the new leaf and then keeps the new tree:

```python title="kept_update.py"
new_bias = params["bias"].at[...].add(0.1)
params = {**params, "bias": new_bias}
```

Here `...` selects the whole bias leaf, including the scalar bias we'll use in regression; indexing that scalar with `[0]` would fail. For updates across every parameter leaf, `jax.tree.map` is clearer than rebuilding dictionaries by hand. Later update examples use it after introducing pytrees.

Arrays aren't the only values that used to hide behind mutation. Randomness does too.

## Randomness is explicit data

Without an explicit generator, `torch.randn(...)` uses PyTorch's default generator state. The relevant issue here is ownership: with hidden sequential state, swapping the order of two random helpers can change which draw each receives.

JAX's explicit-key API makes the random input part of each helper's signature. Its default PRNG implementation is `threefry2x32`, a counter-based generator; other implementations are available.[^jax2026RandomApi] Each key identifies a pseudorandom stream. Helpers can generate in parallel without sequencing every draw through one shared mutable generator; the program's other device communication and synchronization still matter.

For the same random operation, arguments, and environment, reusing a key repeats the result. Sampling doesn't advance or mutate the key. Split it into one-use child keys and retain one child for future operations. These are independent streams in the pseudorandom sense. Their sampled values can still coincide.[^jax2026random]

Split for independent operations, keep one output as future state, and consume the others as one-use subkeys. A loop, batch, device, or model layer can receive its own derived key without synchronizing a hidden global generator.

This runnable example makes that ownership rule visible: key reuse repeats a sample, while separate subkeys produce independent samples. We select Threefry explicitly so a changed default implementation does not shift the generated outputs.

<!-- leetllm: test, deps=jax==0.11.2, output=show, output_title="PRNG key discipline" -->

```python title="prng_key_discipline.py"
import jax.numpy as jnp
from jax import random

root = random.key(7, impl="threefry2x32")
next_key, key_a, key_b = random.split(root, 3)

sample_a = random.normal(key_a, (4,))
sample_a_reused = random.normal(key_a, (4,))
sample_b = random.normal(key_b, (4,))

print("reuse repeats", bool(jnp.array_equal(sample_a, sample_a_reused)))
print("split differs", bool(not jnp.array_equal(sample_a, sample_b)))
print("next key retained", next_key.dtype)

assert jnp.array_equal(sample_a, sample_a_reused)
assert not jnp.array_equal(sample_a, sample_b)
```

<!-- leetllm: output:start -->
```text title="PRNG key discipline" output compact
reuse repeats True
split differs True
next key retained key<fry>
```
<!-- leetllm: output:end -->

Typed keys carry their PRNG implementation in the dtype. This scalar `key<fry>` wraps two `uint32` words; other implementations can use different layouts. Legacy `random.PRNGKey()` values don't carry the implementation. For checkpoint conversion, use `random.key_data` and `random.wrap_key_data`, and retain the implementation identity.[^jax2026RandomApi]

<figure>
  <img src="illustrations/_generated/prng_split_once_dark.png" alt="Seed-7 Threefry PRNG splitting derives independent keys. Calling split(root, 3) produces next, A, and B: reusing A replays identical normal draws, whereas B generates an independent normal stream. In a separate split(root, 2) check with one-bit Bernoulli p=0.5, distinct child keys both return False, matching the 0.5 independent agreement rate." />
  <figcaption>Calling split(root, 3) on a seed-7 Threefry key retains one child for continuation and draws normal samples from subkeys A and B. Reusing subkey A reproduces the exact same normal draw, whereas subkey B advances independently. In a parallel two-way split with one-bit Bernoulli draws at p=0.5, both independent children happen to return False, consistent with a 0.5 independent agreement probability.</figcaption>
</figure>

JAX does not promise sequential equivalence: drawing three scalars from split keys need not give the same sequence as `random.normal(key, (3,))` from the parent. This design leaves room for vectorization and parallel execution. To reproduce a sampler, preserve its key derivation, draw shapes, implementation, and software version, not only its seed.[^jax2026random]

<!-- leetllm: test, deps=jax==0.11.2, output=show, output_title="No sequential equivalence" -->

```python title="prng_no_sequential_equivalence.py"
import jax.numpy as jnp
from jax import random

key = random.key(7, impl="threefry2x32")
subkeys = random.split(key, 3)
one_by_one = jnp.stack([random.normal(subkey) for subkey in subkeys])
all_at_once = random.normal(key, (3,))

print("one_by_one ", [round(float(value), 4) for value in one_by_one])
print("all_at_once", [round(float(value), 4) for value in all_at_once])
print("same sequence", bool(jnp.allclose(one_by_one, all_at_once)))

assert not jnp.allclose(one_by_one, all_at_once)
```

<!-- leetllm: output:start -->
```text title="No sequential equivalence" output compact
one_by_one  [1.114, 0.4541, -0.8204]
all_at_once [0.4512, 1.9535, -0.5162]
same sequence False
```
<!-- leetllm: output:end -->

The comparison starts both programs from the same parent seed on purpose. Don't copy that reuse into a training step.

Now test the opposite mistake: treating equal outputs as proof of key reuse. For two independent one-bit Bernoulli draws with probability 0.5, the chance of agreement is $0.5^2 + 0.5^2 = 0.5$. Here distinct Threefry subkeys happen to produce the same mask:

<!-- leetllm: test, deps=jax==0.11.2, output=show -->
```python title="different_keys_can_match.py"
import jax.numpy as jnp
from jax import random

key_a, key_b = random.split(random.key(7, impl="threefry2x32"))
mask_a = random.bernoulli(key_a, p=0.5, shape=(1,))
mask_b = random.bernoulli(key_b, p=0.5, shape=(1,))
different_keys = not bool(jnp.array_equal(
    random.key_data(key_a), random.key_data(key_b)))
assert different_keys and jnp.array_equal(mask_a, mask_b)
print("different keys:", different_keys)
print("masks:", mask_a.tolist(), mask_b.tolist())
print("equal masks:", bool(jnp.array_equal(mask_a, mask_b)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
different keys: True
masks: [False] [False]
equal masks: True
```
<!-- leetllm: output:end -->

Check key ownership and derivation, rather than requiring every pair of small masks to differ. Some alternative PRNG implementations also have different batching behavior: experimental `rbg` can generate a vmapped batch from its first input key. Changing implementations requires checking that behavior too.[^jax2026RandomApi]

### Split at helper call sites

Suppose one training step needs dropout and data augmentation. Split the step key into two subkeys, then pass each to one operation. Don't let both helpers split the same parent independently, since they'll derive matching child sequences.

Across devices, derive keys from stable identifiers such as process, device, step, or example indices when reproducibility requires that mapping. `fold_in` can combine an integer identifier with a key without managing a long manual split chain. Write the ownership rule beside the code so later vectorization doesn't duplicate random streams accidentally.

JAX also has an experimental stateful RNG backed by `Ref` objects. Its current documentation recommends explicit keys for performance-critical work. The wrapper can't be returned through transformations, carried through `scan` or `while_loop`, or used with `remat`. This lab uses explicit keys and doesn't exercise that wrapper.[^jax2026StatefulRng]

```checkpoint
A dropout helper receives one key and applies two independent dropout masks. It calls `random.bernoulli(key, ...)` for both masks. Tests are reproducible, but both masks always match. Which key rule did it violate, and where should you repair it?
---
The helper reused one key for two independent random events. Split its input key once inside the helper, consume one subkey per mask, and return or retain a separate continuation key if the caller needs future randomness. Changing the seed would only produce a different pair of matching masks.
```

Once keys and arrays are ordinary data, transformations can wrap the function without guessing hidden state. The next question is which artifact each wrapper should produce.

## Transform one small function at a time

JAX's transformations become easier when the base function is straightforward. Start with a scalar loss over one parameter tree and one example, and check its output eagerly. Then decide what evidence you need: a derivative, one result per example, or a reusable compiled call. Add `grad`, `vmap`, or `jit` for that computation, one transformation at a time.

The figure follows the per-example gradient function across our four regression rows. `grad` derives the gradient callable, `vmap` adds an example axis while sharing parameters, and `jit` can compile that batched callable.

<figure>
  <img src="illustrations/_generated/gradient_composition_dark.png" alt="At zero parameters, the four regression rows have gradients [-4,0,-4], [0,2,2], [-2,-2,-2] and [-12,-6,-6] for the two weight entries and bias. Every signed bar shares the same minus-12-to-plus-2 scale. Mapping grad over examples retains weight shape [4,2] and bias shape [4]. Averaging gives weight gradient [-4.5,-1.5] and scalar bias gradient -2.5, with shapes [2] and (). One plain SGD update at learning rate 0.05 returns weights [0.225,0.075] and bias 0.125." />
  <figcaption>Each signed bar uses the same −12 to +2 scale. Mapping the one-example gradient retains the four-example axis: weight gradients have shape [4, 2] and bias gradients [4]. For these independent losses, averaging agrees with differentiating the scalar batch mean. One plain SGD update returns weights [0.225, 0.075] and bias 0.125. The wrappers derive callable functions; jit can compile the batched gradient function.</figcaption>
</figure>

`jax.grad(f)` returns a new function that evaluates the gradient of scalar-valued `f`. `jax.value_and_grad(f)` returns both scalar value and gradient, which avoids expressing the forward loss twice in a training step.[^jax2026autodiff]

`jax.vmap(f)` adds mapped array axes to a function. `in_axes` tells JAX which arguments carry the batch dimension and which stay shared. For a per-example loss, `in_axes=(None, 0, 0)` means one shared parameter tree plus batched inputs and targets.[^jax2026vmap]

`jax.jit(f)` stages compatible array work for compilation and caches a specialized executable. It doesn't make arbitrary Python dynamic. Lists that grow, file reads, network calls, and Python branches on traced values need to stay outside or be expressed through JAX-supported operations.[^jax2026jit]

### Transformation order changes the derived program

One composition preserves a gradient for each example; the other differentiates one aggregate loss. These expressions are sketches of the two derived functions, with complete definitions in the runnable cell below:

```python title="transformation_order.py"
batched_grad = jax.vmap(jax.grad(loss_one), in_axes=(None, 0, 0))
compiled_batched_grad = jax.jit(batched_grad)

grad_of_batch_mean = jax.grad(batch_mean_loss)
compiled_grad_of_mean = jax.jit(grad_of_batch_mean)
```

The first returns one gradient tree per example. The second returns the gradient of a scalar batch mean. Averaging the first set of gradients can match the second for a simple mean of independent examples, but memory layout and intermediate materialization may differ. Match the transformation to the artifact you need.

Per-example gradients help with clipping, influence analysis, and <span data-glossary="variance">variance</span> inspection. Ordinary training usually needs the gradient of an aggregated scalar loss. Don't materialize a batch of full parameter-sized gradients merely because `vmap` makes the expression short.

For the four-row regression example, the first weight's per-example gradients at zero are `[-4, 0, -2, -12]`. Their mean is `-4.5`. The second weight's mean gradient is `-1.5`, and the bias gradient is `-2.5`. One SGD step with learning rate 0.05 should therefore produce weights `[0.225, 0.075]` and bias `0.125`.

Derive those quantities with JAX and check that averaging per-example gradients matches differentiating the mean. These linked cells share state; run them in order. They use CPU-sized float32 arrays and require JAX, with no accelerator installation assumed.

<!-- leetllm: test, deps=jax==0.11.2, output=show, id=jax-gradient -->
```python title="gradient_composition.py"
import jax
import jax.numpy as jnp

x = jnp.array([[1., 0.], [0., 1.], [1., 1.], [2., 1.]], dtype=jnp.float32)
y = jnp.array([2., -1., 1., 3.], dtype=jnp.float32)
zero_params = {"weight": jnp.zeros(2, dtype=jnp.float32),
               "bias": jnp.array(0., dtype=jnp.float32)}

def predict_one(params, features):
    return jnp.dot(features, params["weight"]) + params["bias"]

def loss_one(params, features, target):
    return (predict_one(params, features) - target) ** 2

def batch_loss(params, features, targets):
    return jax.vmap(loss_one, in_axes=(None, 0, 0))(params, features, targets).mean()

per_grad = jax.vmap(jax.grad(loss_one), in_axes=(None, 0, 0))(zero_params, x, y)
mean_grad = jax.grad(batch_loss)(zero_params, x, y)
averaged = jax.tree.map(lambda leaf: leaf.mean(axis=0), per_grad)
assert all(bool(jnp.allclose(a, b)) for a, b in
           zip(jax.tree.leaves(averaged), jax.tree.leaves(mean_grad)))
assert jnp.allclose(mean_grad["weight"], jnp.array([-4.5, -1.5]))
assert jnp.isclose(mean_grad["bias"], -2.5)
print("per-example weight gradient shape:", per_grad["weight"].shape)
print("mean gradient:", mean_grad["weight"].tolist(), float(mean_grad["bias"]))
try:
    jax.grad(lambda p: jax.vmap(loss_one, in_axes=(None, 0, 0))(p, x, y))(zero_params)
except TypeError:
    print("grad rejects a vector-valued loss")
else:
    raise AssertionError("Expected a scalar-output error")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
per-example weight gradient shape: (4, 2)
mean gradient: [-4.5, -1.5] -2.5
grad rejects a vector-valued loss
```
<!-- leetllm: output:end -->

The extra axis belongs to examples: the weight-gradient leaf is `[4, 2]`, whereas the mean-gradient leaf is `[2]`. A length-one array isn't a scalar either; `grad` expects an output with shape `()` for this ordinary real-valued use.

Gradients need a place to live. That place is the same nested structure as the parameters.

## Pytrees carry structured state

Real model state isn't one <span data-glossary="matrix">matrix</span>. It can be a nested dictionary of layer weights, tuples of optimizer moments, and auxiliary statistics. JAX calls a nested container of leaves a **<span data-glossary="pytree">pytree</span>**. Built-in containers such as dictionaries, tuples, and lists can form tree nodes, while arrays usually form leaves.[^jax2026pytrees]

Transformations flatten the structure on entry, operate on leaves, and rebuild matching output structure. If `params` is a pytree, `jax.grad(loss_fn)(params, batch)` returns gradients with the same tree structure. That structural agreement is a powerful debugging invariant.

Renaming one key from `w` to `kernel` can leave the leaf count unchanged while changing the state schema. A correct update must match paths and shapes, not merely the number of arrays.

Use `jax.tree.map` to apply the same update over matching leaves:

```python title="pytree_sgd_update.py"
new_params = jax.tree.map(
    lambda parameter, gradient: parameter - learning_rate * gradient,
    params,
    grads,
)
```

Two trees passed to `tree.map` need compatible structure. But matching structure doesn't validate leaf shapes: ordinary array arithmetic may silently broadcast an incorrect gradient. For parameter updates, check both the tree definition and exact leaf shapes before applying a leafwise update.

For example, a parameter tree keyed by `{"layer": {"w": ..., "b": ...}}` can't safely update from a gradient tree keyed by `{"layer": {"kernel": ..., "b": ...}}`. The leaf shapes may match, but the renamed key changes which state the update refers to.

Exercise both failure modes. A renamed key is a tree error. A scalar gradient under the correct key can broadcast without an error, so the explicit shape check below rejects it before an update.

<!-- leetllm: test, deps=jax==0.11.2, output=show, continue=jax-gradient, id=jax-tree -->
```python title="check_gradient_schema.py"
def validate_gradient(params, grads):
    if jax.tree.structure(params) != jax.tree.structure(grads):
        raise ValueError("gradient tree mismatch")
    if any(p.shape != g.shape for p, g in
           zip(jax.tree.leaves(params), jax.tree.leaves(grads))):
        raise ValueError("gradient shape mismatch")

validate_gradient(zero_params, mean_grad)
for bad in ({"kernel": mean_grad["weight"], "bias": mean_grad["bias"]},
            {"weight": jnp.array(-4.5), "bias": mean_grad["bias"]}):
    try:
        validate_gradient(zero_params, bad)
    except ValueError as error:
        print(error)
    else:
        raise AssertionError("Invalid gradient accepted")
print("scalar broadcasting would have produced:",
      [round(float(v), 3) for v in zero_params["weight"] - 0.05 * jnp.array(-4.5)])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
gradient tree mismatch
gradient shape mismatch
scalar broadcasting would have produced: [0.225, 0.225]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pytree_schema_dark.png" alt="Parameter and gradient pytrees must match on both tree structure (weight and bias keys) and leaf shapes ([2] and scalar). With valid gradients [-4.5, -1.5] and -2.5 at lr=0.05, SGD yields weight [0.225, 0.075] and bias 0.125. Renaming weight to kernel fails structure checks; passing scalar -4.5 fails leaf-shape checks and would broadcast to [0.225, 0.225]." />
  <figcaption>The checked SGD update requires matching named paths and exact leaf shapes. Renaming weight to kernel changes the tree definition. Keeping the weight path while passing a scalar gradient changes its shape: unchecked arithmetic broadcasts −4.5 to both entries and yields [0.225, 0.225]. The shape guard rejects that update before applying it.</figcaption>
</figure>

Custom model classes require care. Unless a class is registered or supported by its library as a pytree node, JAX may treat the entire object as one leaf. Before editing serialization or transformation inputs, inspect `jax.tree.structure(params)` and `jax.tree.map(lambda x: x.shape, params)`.

### Separate dynamic leaves from static metadata

Array leaves can change value without changing the tree definition. Layer names, activation choices, and architecture sizes are often static metadata. Frameworks may place them in dataclass fields, auxiliary pytree data, closures, or static arguments.

Changing tree structure or static metadata can trigger a new trace or compilation. Changing only values inside same-shaped array leaves usually reuses the existing compiled variant. Keep architecture decisions outside hot per-step data.

Checkpoint conversion must preserve tree paths, leaf shapes, dtypes, and semantic layout. A matching leaf count isn't enough. A transposed projection matrix has the same element count and still changes model behavior.

```checkpoint
You need per-example gradient norms for clipping, but the current step computes the gradient of mean batch loss. Should you wrap the entire compiled training step in `vmap`, or derive a narrower function?
---
Derive `grad(loss_one)` from the scalar one-example loss, then `vmap` that gradient over example axes while sharing the parameter pytree with `in_axes=None`. Wrapping the whole stateful step would batch optimizer state and updates too, materialize more data than needed, and obscure whether aggregation happens before or after differentiation.
```

A training step is those four pieces: a pure loss, a gradient pytree, an explicit update, and optional `vmap`. The GPT lab's `loss.backward(); optimizer.step()` is the same state transition. The smallest version you can run doesn't need a <span data-glossary="transformer">Transformer</span>.

## Translate a tiny training step

The familiar PyTorch loop makes mutation explicit through method calls. This abbreviated comparison assumes an existing model, optimizer, and tensors; it isn't a standalone program.

```python title="pytorch_step.py"
model.train()
optimizer.zero_grad(set_to_none=True)

predictions = model(x)
loss = ((predictions - y) ** 2).mean()
loss.backward()
optimizer.step()

reported_loss = loss.detach()
```

The JAX translation starts by exposing model parameters as arrays. Prediction and loss are plain functions. The step asks `value_and_grad` for a gradient pytree, maps an update across leaves, and returns the new parameter tree.

Continue with the same four-row model. The code checks the first update against our hand calculation, trains for 80 steps, and evaluates the returned parameters. The loss returned by `train_step` is measured *before* that step's update, so compute a fresh final loss rather than relabeling the last returned loss.

<!-- leetllm: test, deps=jax==0.11.2, output=show, output_title="Tiny JAX training step", continue=jax-tree, id=jax-training -->

```python title="tiny_jax_training_step.py"
params = zero_params

@jax.jit
def train_step(params, features, targets, learning_rate):
    loss, grads = jax.value_and_grad(batch_loss)(params, features, targets)
    new_params = jax.tree.map(
        lambda parameter, gradient: parameter - learning_rate * gradient,
        params,
        grads,
    )
    return new_params, loss

initial_loss = batch_loss(params, x, y)
first_params, first_loss = train_step(params, x, y, jnp.array(0.05))
assert jnp.allclose(first_params["weight"], jnp.array([0.225, 0.075]))
assert jnp.isclose(first_params["bias"], 0.125)
assert jnp.isclose(first_loss, 3.75)

for _ in range(80):
    params, loss = train_step(params, x, y, jnp.array(0.05))

final_loss = batch_loss(params, x, y).block_until_ready()
per_example_loss = jax.vmap(
    lambda features, target: (predict_one(params, features) - target) ** 2
)(x, y)

print("initial_loss", round(float(initial_loss), 4))
print("final_loss  ", round(float(final_loss), 6))
print("weight     ", [round(float(value), 3) for value in params["weight"]])
print("bias       ", round(float(params["bias"]), 3))
print("examples   ", [round(float(value), 6) for value in per_example_loss])

assert final_loss < initial_loss * 0.01
assert jnp.array_equal(zero_params["weight"], jnp.zeros(2))
```

<!-- leetllm: output:start -->
```text title="Tiny JAX training step" output compact
initial_loss 3.75
final_loss   0.007605
weight      [1.927, -0.839]
bias        -0.041
examples    [0.012935, 0.014567, 0.002254, 0.000663]
```
<!-- leetllm: output:end -->

The update has no optimizer state because plain <span data-glossary="stochastic-gradient-descent">stochastic gradient descent (SGD)</span> only needs a <span data-glossary="learning-rate">learning rate</span> here. Adam would add first moments, second moments, and a step counter to the inputs and outputs. An optimizer library packages that state, but the state transition remains.

Notice what the example makes easy to test: one scalar loss, one parameter tree, one returned update, and one reported value. The same pure signature survives when an optimizer adds state or a model adds dropout; only the tuple of explicit inputs and outputs grows.

Randomized training adds a key. Split it in `train_step`, give the one-use subkey to dropout or augmentation, and return the retained key beside parameters. Don't close over a module-level key.

Add two real pieces of state to the same regression model: momentum and input dropout. Momentum retains a moving update direction, `new_velocity = 0.9 * velocity + gradient`. Input dropout retains each feature with probability 0.75 and divides retained values by 0.75 so their expectation is unchanged. The example traces ownership of parameters, momentum, and the random key; measure dropout's training effect on a task where it matters.

Replay identical inputs to check deterministic behavior. Then thread the returned state into a second step. A different continuation key is the invariant; two small dropout masks could coincide by chance.

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
p1, v1, key1, metrics1 = momentum_step(zero_params, velocity, key, x, y)
replay = momentum_step(zero_params, velocity, key, x, y)
assert all(bool(jnp.array_equal(a, b)) for a, b in
           zip(jax.tree.leaves((p1, v1, metrics1)),
               jax.tree.leaves((replay[0], replay[1], replay[3]))))
p2, v2, key2, metrics2 = momentum_step(p1, v1, key1, x, y)
jax.block_until_ready((p2, v2, key2, metrics2))
assert not jnp.array_equal(random.key_data(key1), random.key_data(key2))
assert all(bool(jnp.all(v == 0)) for v in jax.tree.leaves(velocity))
assert jnp.array_equal(zero_params["weight"], jnp.zeros(2))
print("same-input replay matches:", True)
print("continuation key advances:", True)
print("returned velocity is nonzero:",
      any(bool(jnp.any(v != 0)) for v in jax.tree.leaves(v1)))
print("first mask:", metrics1["mask"].astype(jnp.int32).tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same-input replay matches: True
continuation key advances: True
returned velocity is nonzero: True
first mask: [[1, 0], [1, 1], [1, 1], [0, 0]]
```
<!-- leetllm: output:end -->

The replay deliberately reuses an input key to test reproducibility. A real training loop keeps `key1`, then `key2`, rather than repeatedly submitting the original `key`. Resuming this step requires parameters, velocity, and the continuation key, together with the data-loader position.

The step works. Now ask whether the next call has the same shape, dtype, static settings, and device placement. Compilation enforces strict signature matching, because the first slow call isn't the same as the hundredth.

## JIT compiles a signature-specific executable

<span data-glossary="just-in-time-compilation">Just-in-time (JIT) compilation</span> has an up-front cost. For a newly encountered argument signature, the path generally has three stages:

1. **Tracing:** JAX runs the Python function with tracers whose abstract values describe properties such as shape and dtype. Compatible numerical operations are recorded in a **Jaxpr** (JAX expression).
2. **Lowering:** The staged computation is lowered to a compiler representation such as StableHLO.
3. **Compilation:** XLA produces an executable for the selected backend, which can be CPU or an accelerator.

JAX keys its compilation cache on these properties. Common causes of new variants include changes in callable identity, pytree structure, shapes, dtypes, scalar weak typing, or static values. Sharding and compilation settings also matter. A compatible cached call avoids retracing the function's Python body while retaining dispatch overhead.[^jax2026jit][^jax2026JitApi]

Ordinary `jit` needs different variants for `[32, 512]` and `[16, 512]` batches, or float32 and bfloat16 inputs. A needed variant might already be cached; check compilation logs to confirm whether a new executable was compiled. If an epoch's final batch pauses, inspect those logs alongside loading, transfers, and synchronization.

<figure>
  <img src="illustrations/_generated/jit_input_contract_dark.png" alt="A jitted function reading Python global scale captures scale=1 on the first call with float32 shape [4] and returns 4. Changing global scale=3 while reusing shape [4] hits Trace A and still returns 4. Calling shape [2] misses cache, traces with global scale=3 as Trace B, and returns 6. Passing scale=3 as an explicit array argument returns 12 on shape [4]." />
  <figcaption>Calling one jitted function three times illustrates captured Python globals and shape specialization. The first trace captures scale 1; reusing shape [4] hits that cached executable even after setting global scale to 3. A new shape [2] triggers a second trace that captures 3. Passing scale as an explicit scalar array makes its value part of the computation and returns 12. Full cache keys also track dtype, tree structure, weak typing, static settings, and device placement.</figcaption>
</figure>

The short remainder isn't necessarily a data bug. It presents an unseen tensor shape, so JAX may trace and compile again. If that remainder is expected, pad to a fixed shape and carry a mask, bucket sequence lengths into a small set, or handle the short batch on a deliberate side path.

Padding also changes the scalar average unless the reduction ignores padded rows. Add two zero rows to our four-example batch: their losses are zero at zero parameters, but averaging over all six rows changes `3.75` to `2.5`. Divide the masked sum by the valid count instead. The same correction must preserve the gradient, not only the displayed loss.

<!-- leetllm: test, deps=jax==0.11.2, output=show, continue=jax-state, id=jax-padding -->
```python title="pad-without-changing-the-objective.py"
padded_x = jnp.pad(x, ((0, 2), (0, 0)))
padded_y = jnp.pad(y, (0, 2))
valid = jnp.array([True, True, True, True, False, False])

def masked_loss(params, features, targets, valid):
    losses = jax.vmap(loss_one, in_axes=(None, 0, 0))(params, features, targets)
    numerator = jnp.where(valid, losses, 0.0).sum()
    return numerator / jnp.maximum(valid.sum(), 1)

masked_value_and_grad = jax.jit(jax.value_and_grad(masked_loss))
value, gradient = masked_value_and_grad(zero_params, padded_x, padded_y, valid)
assert jnp.isclose(value, batch_loss(zero_params, x, y))
assert all(bool(jnp.allclose(a, b)) for a, b in
           zip(jax.tree.leaves(gradient), jax.tree.leaves(mean_grad)))
empty_value, empty_gradient = masked_value_and_grad(
    zero_params, padded_x, padded_y, jnp.zeros_like(valid))
assert float(empty_value) == 0.0
assert all(bool(jnp.all(g == 0)) for g in jax.tree.leaves(empty_gradient))
print("unmasked padded mean:", float(batch_loss(zero_params, padded_x, padded_y)))
print("masked valid mean:", float(value))
print("original gradients preserved:", True)
print("all-padding loss and gradients are zero:", True)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unmasked padded mean: 2.5
masked valid mean: 3.75
original gradients preserved: True
all-padding loss and gradients are zero: True
```
<!-- leetllm: output:end -->

This check uses finite padded features and targets with independent per-row losses. Masking the final reduction does not repair invalid intermediate arithmetic; see the inactive-log example below. The all-padding result gives a finite diagnostic value rather than an optimizer step rule. Skip an empty batch deliberately: zero gradients can still leave momentum or weight decay changing parameters. Padding a model with batch-dependent statistics also requires checking those statistics separately.

Keep static option values bounded and construct the jitted callable once outside hot loops. Log compilation separately from execution so an intentional variant is visible rather than mistaken for kernel slowness.

Expose a captured-global bug alongside a shape change. The list below intentionally records Python tracing events for diagnosis; it isn't a device-side metric counter. A new shape retraces and captures the *new* global, so the bug can look intermittent.

<!-- leetllm: test, deps=jax==0.11.2, output=show -->
```python title="trace_and_global_capture.py"
import jax
import jax.numpy as jnp

scale = 1.0
traces = []

@jax.jit
def captured(values):
    traces.append(values.shape)  # diagnostic Python trace, not runtime work
    return values.sum() * scale

first = float(captured(jnp.ones(4, dtype=jnp.float32)))
scale = 3.0
same_shape = float(captured(jnp.ones(4, dtype=jnp.float32)))
new_shape = float(captured(jnp.ones(2, dtype=jnp.float32)))
assert (first, same_shape, new_shape) == (4.0, 4.0, 6.0)
assert traces == [(4,), (2,)]

explicit = jax.jit(lambda values, scale: values.sum() * scale)
fixed = float(explicit(jnp.ones(4), jnp.array(3.0)))
assert fixed == 12.0
print("captured global:", first, same_shape, new_shape)
print("traced shapes:", traces)
print("explicit scalar argument:", fixed)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
captured global: 4.0 4.0 6.0
traced shapes: [(4,), (2,)]
explicit scalar argument: 12.0
```
<!-- leetllm: output:end -->

Even equal scalar values and dtypes can differ in weak typing. Counting the compilation traces shows how argument shapes affect the cache: a Python float is weakly typed, whereas an explicitly float32 array isn't. Changing the latter's value should reuse its trace.

<!-- leetllm: test, deps=jax==0.11.2, output=show -->
```python title="scalar_weak_typing.py"
import jax
import jax.numpy as jnp

traces = []
@jax.jit
def shifted(value):
    traces.append((str(value.dtype), value.weak_type))
    return value + 1.0

results = [float(shifted(1.0)),
           float(shifted(jnp.array(1.0, dtype=jnp.float32))),
           float(shifted(jnp.array(2.0, dtype=jnp.float32)))]
assert results == [2.0, 2.0, 3.0]
assert traces == [("float32", True), ("float32", False)]
print("results:", results)
print("traced scalar types:", traces)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
results: [2.0, 2.0, 3.0]
traced scalar types: [('float32', True), ('float32', False)]
```
<!-- leetllm: output:end -->

Both tracing lists are intentional diagnostic side effects demonstrating trace counts rather than runtime metric counters. Standardize scalar representation cleanly when switching Python and array scalars creates unwanted compiled variants.

### Tracers aren't ordinary Python values

During tracing, an array argument may become a tracer that records abstract properties such as shape and dtype. Python can't always turn that tracer into a concrete `bool`, `int`, or array index. A branch such as `if loss < threshold:` can raise `TracerBoolConversionError` inside `jit`.[^jax2026jit]

Before choosing a fix, decide whether the branch belongs to data or configuration. A per-example mask is data and must stay in the array program; an activation choice from a small fixed set can be static and may justify bounded recompiles.

Choose a fix by semantics:

| Intent | Better expression |
|---|---|
| select values elementwise | `jnp.where(condition, a, b)` |
| execute one of two functions | `jax.lax.cond(condition, true_fn, false_fn, operand)` |
| loop for data-dependent count | `jax.lax.while_loop` |
| scan a fixed sequence with state | `jax.lax.scan` |
| branch on small configuration | static argument, accepting bounded recompiles |

Both branches of `lax.cond` are traced. A scalar condition selects one branch at execution, subject to compiler transformations; `vmap` over predicates can turn it into elementwise selection.[^jax2026Cond] `jnp.where` isn't a lazy Python `if`: don't rely on it to make invalid arithmetic or NaN gradients in an unselected expression harmless.

For example, hiding `log(0)` behind an outer `where` gives a finite forward result but a NaN gradient. Make the logarithm's argument valid before differentiating.[^jax2026Faq] This changes neither the positive-input logarithm nor the chosen zero value; it makes the inactive calculation safe.

<!-- leetllm: test, deps=jax==0.11.2, output=show -->
```python title="safe_inactive_arithmetic.py"
import jax
import jax.numpy as jnp

def unsafe_log(value):
    return jnp.where(value > 0, jnp.log(value), 0.0)

def safe_log(value):
    argument = jnp.where(value > 0, value, 1.0)
    return jnp.where(value > 0, jnp.log(argument), 0.0)

value = jnp.array(0.0, dtype=jnp.float32)
unsafe_gradient = jax.grad(unsafe_log)(value)
safe_gradient = jax.jit(jax.grad(safe_log))(value)
assert float(unsafe_log(value)) == 0.0
assert bool(jnp.isnan(unsafe_gradient))
assert float(safe_gradient) == 0.0
assert jnp.isclose(safe_log(jnp.array(2.0)), jnp.log(2.0))
print("unsafe forward:", float(unsafe_log(value)))
print("unsafe gradient is NaN:", bool(jnp.isnan(unsafe_gradient)))
print("safe gradient:", float(safe_gradient))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unsafe forward: 0.0
unsafe gradient is NaN: True
safe gradient: 0.0
```
<!-- leetllm: output:end -->

Loop carries must retain fixed shapes and dtypes. Also, `lax.while_loop` doesn't support ordinary reverse-mode differentiation. A fixed-length `lax.scan` is often the appropriate training-loop form when you need reverse-mode gradients through iterations.[^jax2026WhileLoop]

Run both sides of a repaired scalar branch, then expose the reverse-mode limitation instead of assuming that every jittable program is differentiable.

<!-- leetllm: test, deps=jax==0.11.2, output=show -->
```python title="tracer_safe_control_flow.py"
import jax
import jax.numpy as jnp

def bad_abs(value):
    return value if value > 0 else -value

try:
    jax.jit(bad_abs)(jnp.array(-2.0))
except jax.errors.TracerBoolConversionError:
    print("Python branch rejected a traced condition")
else:
    raise AssertionError("Expected a tracing failure")

fixed_abs = jax.jit(lambda value: jax.lax.cond(
    value > 0, lambda z: z, lambda z: -z, value))
assert float(fixed_abs(jnp.array(-2.0))) == 2.0
assert float(fixed_abs(jnp.array(3.0))) == 3.0

def dynamic_loop(value):
    return jax.lax.while_loop(lambda z: z < 8., lambda z: 2. * z, value)

assert float(dynamic_loop(jnp.array(1.))) == 8.0
try:
    jax.grad(dynamic_loop)(jnp.array(1.))
except ValueError:
    print("while_loop executes, but reverse-mode gradient is unsupported")
else:
    raise AssertionError("Expected the reverse-mode limitation")

def three_doublings(value):
    return jax.lax.scan(lambda z, _: (2. * z, None), value, xs=None, length=3)[0]

assert float(jax.grad(three_doublings)(jnp.array(1.))) == 8.0
print("fixed-length scan gradient:", float(jax.grad(three_doublings)(jnp.array(1.))))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Python branch rejected a traced condition
while_loop executes, but reverse-mode gradient is unsupported
fixed-length scan gradient: 8.0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/scan_control_flow_dark.png" alt="Both programs double their scalar state. The dynamic while loop continues while the state is below 8; the scan performs exactly three steps. For the original input 1 both traces are 1,2,4,8. An additional execution at input 3 gives the while trace 3,6,12, which stops after two doublings, while the scan trace is 3,6,12,24. Equal columns represent iteration indices, not equal numeric increments. Reverse factors through the fixed scan are 2,2,2, giving derivative 8. Ordinary JAX reverse-mode differentiation through the dynamic while loop is unsupported." />
  <figcaption>Columns share step indices, so each point marks one scalar state after k doublings. Starting from 1 reaches 8 in both programs. Starting from 3 exposes the control-flow difference: while_loop stops at 12 after two doublings, while scan runs all three fixed steps and reaches 24. Fixed-step scan multiplies three x2 chain factors to yield derivative 8, whereas reverse-mode differentiation through dynamic while_loop is unsupported.</figcaption>
</figure>

The fixed three-step loop solves a different rule from "double until at least eight." The comparison contrasts their differentiation support rather than asserting they produce equal values on every input.

Marking every awkward value static isn't a repair. It moves values into compilation and can create one executable per value. Reserve static arguments for true configuration such as activation choice or a small fixed mode set.

Python side effects also happen during tracing. Appending metrics to a global list, incrementing a Python counter, or reading a changing file from a jitted function doesn't describe repeatable device computation. Return metrics and perform I/O in the outer loop.

Compilation and dispatch also need separate measurements.

## Measure completed accelerator work

JAX dispatches array work asynchronously. Python can regain control before an accelerator finishes. Before trusting a timer, ask what it has observed: the Python enqueue call, or completed device work?

A timer around only `result = compiled_fn(x)` may measure enqueue overhead rather than execution.[^jax2026benchmarking]

Use `.block_until_ready()` on a result when timing device execution. Place inputs on the target device before steady-state measurement, match dtypes, and separate transfer time when transfers are part of the real workload. JAX defaults to 32-bit dtypes, so a "JAX vs NumPy" comparison that leaves NumPy in float64 isn't a framework result.[^jax2026benchmarking]

An array has a `.block_until_ready()` method; a tuple or dictionary doesn't. For the momentum step's structured return, `jax.block_until_ready(result)` waits on its array leaves, as the state example does above.

This runnable CPU microbenchmark uses a fixed `[512, 64]` float32 input and waits for every timed result. It checks shape and finiteness, not a machine-dependent speed threshold. Its printed timings will vary, so no timing snapshot is embedded here.

<!-- leetllm: test, deps=jax==0.11.2 -->
```python title="honest_jax_timing.py"
import jax
import jax.numpy as jnp
import numpy as np
from time import perf_counter

cpu = jax.devices("cpu")[0]
x_host = np.arange(512 * 64, dtype=np.float32).reshape(512, 64) / 1024
x_device = jax.device_put(x_host, cpu).block_until_ready()
compiled_fn = jax.jit(lambda values: values.T @ (values - values.mean(axis=0)))

start = perf_counter()
cold = compiled_fn(x_device).block_until_ready()
cold_seconds = perf_counter() - start

for _ in range(5):
    compiled_fn(x_device).block_until_ready()

start = perf_counter()
for _ in range(20):
    warm = compiled_fn(x_device).block_until_ready()
warm_seconds_per_call = (perf_counter() - start) / 20

assert warm.shape == (64, 64)
assert jnp.isfinite(warm).all()
assert jnp.allclose(cold, warm)
print("backend:", cpu.platform, "input:", x_device.shape, str(x_device.dtype))
print("cold milliseconds:", round(cold_seconds * 1000, 3))
print("warm milliseconds per synchronized call:", round(warm_seconds_per_call * 1000, 3))
```

Cold time includes tracing, compilation, dispatch, and execution for this fresh callable; a persistent compilation cache can change that breakdown. Warm time includes Python dispatch and a wait per call, so it measures synchronized per-call latency. Enqueuing many independent calls and waiting once instead measures amortized throughput rather than per-call latency.

For accelerator measurements, select and report the actual device, JAX/jaxlib versions, dtype, shapes, compilation-cache setup, host-device transfers, and synchronization point. This lab verifies CPU numerical behavior and timing structure. Benchmark GPU/TPU and multi-host performance on the target system. End-to-end measurements must also account for data loading, transfers, evaluation, and checkpoint work when those are in scope.

PyTorch accelerator work can also be asynchronous. Keep the general habit: synchronize according to framework and backend before comparing completed work. Framework names do not make a benchmark fair; matched workloads and synchronized scopes do.

```checkpoint
A benchmark reports JAX is 40 times faster than PyTorch. JAX timer covers one call after compilation but never reads result; PyTorch timer includes first accelerator call and synchronization. What must change before speed claim is meaningful?
---
Measure matched workloads. Put inputs on target devices, synchronize both frameworks, report JAX cold compile-plus-execution separately from warm execution, warm PyTorch path too, and include transfers only when both measurements include them. Without those controls, comparison mixes dispatch latency, compilation, execution, and transfer costs.
```

### Treat device placement as explicit state

The single-device path now has explicit inputs and outputs. `vmap` maps array axes; by itself it doesn't assign lanes to hardware devices. It can also compose with computations whose arrays are already sharded, so "vmap always runs on one device" is too strong.

When reading multi-device code, separate its interfaces:

- **`jax.pmap`:** A replica-oriented interface commonly maps a leading device axis, such as `(8, 32, 512)` over eight devices. Current documentation recommends `shard_map` for new code. Since JAX 0.8.0, its implementation uses `jit` and `shard_map`.[^jax2026Pmap]
- **Sharded arrays and `jit`:** A device mesh names hardware axes. `NamedSharding` combines that mesh with a `PartitionSpec` describing array placement. Current JAX supports explicit sharding rules as well as compiler-selected automatic sharding. Communication follows the operation and layout: an elementwise activation can stay local, while a dot product with its contracting axis partitioned must combine partial sums.[^jax2026Sharding]
- **`jax.shard_map`:** This interface expresses per-shard computation with manual parallelism and explicit collectives where needed. It can compose with `jit`. Its local block shapes differ from the arrays' global shapes, which matters when porting replica-oriented code.[^jax2026ShardMap]

Explicit sharding adds another layer to debug. An array can have the expected global shape while its physical shards sit on an unexpected mesh or trigger silent communication transfers between operations.

When replicas need independent randomness, derive different keys using split or `fold_in` with stable, globally unique replica identifiers and step ownership. The same key, operation, and draw shape repeat the same mask; matching masks alone don't prove reused keys. Deliberately shared randomness can be valid, so document the intended relationship. A local device index alone can repeat across processes.

If a research repository already uses `pmap` or explicit sharding, preserve its version-specific wrappers until you've verified local shard shapes, device placement, numerical parity, and synchronized timing. A fast replicated call with the wrong local batch or duplicated randomness isn't a successful port. No multi-device collective, sharding strategy, or checkpoint migration is executed by this lesson's CPU tests.

## Failure cases that look like model bugs

JAX transformation bugs can resemble model failures: reusing a key for an unchanged random operation repeats its draw, changing input signatures triggers compilation pauses, and captured globals retain old coefficients. Start by classifying the symptom, then check the stage that produces it.

Use symptom, cause, and repair together:

| Symptom | Likely cause | Repair |
|---|---|---|
| repeated random samples | same subkey reused | split at each consumer and use once |
| original array unchanged | `.at` result discarded | bind returned array or returned tree |
| print runs once | Python side effect happened during trace | return metric or use deliberate JAX debug tool |
| config edit has no effect | global captured in cached trace | pass value as array or bounded static argument |
| `TracerBoolConversionError` | Python branch needs concrete array value | use JAX control flow or true static config |
| recurring multi-second pauses | shape, dtype, static value, or function identity changed | stabilize input shapes and inspect compile logs |
| implausibly fast timing | asynchronous result wasn't awaited | call `.block_until_ready()` |
| tree-map structure error | parameter and gradient pytrees differ | compare tree structures and leaf paths |
| checkpoint loads but outputs drift | leaf layout or dtype conversion is wrong | verify named paths, shapes, dtypes, and reference inputs |

### Debug outside in

Remove `jit` temporarily and run the smallest failing function eagerly. Eager execution won't reproduce every compilation issue, but it gives clearer Python <span data-glossary="stack-trace">stack traces</span> and confirms base numerical behavior.

Then inspect `jax.make_jaxpr(function)(example_inputs)` or a lowered representation when you need to see what JAX traced. Compare tree structures and leaf shapes before reading compiler output; those checks often isolate the mismatch without requiring you to interpret generated machine code.

Reintroduce transformations one at a time: base function, then `grad`, then `vmap`, then `jit`. The first transformation that fails identifies the assumption to repair. If the failure appears only after adding devices, repeat the same process with sharding layouts and collective operations visible.

## Preserve JAX when its structure carries evidence

A paper repository contains more than equations. Its tests, checkpoint layout, data order, precision settings, sharding rules, and evaluation scripts define the reported experiment. Rewriting all of that changes many variables at once.

Keep the JAX path when the evidence already lives there. Reference checkpoints and evaluation may depend on its pytrees, or one local loss, update, sampler, or transformation may be the only thing that needs adjustment. `vmap`, higher-order differentiation, and vectorized simulation can express core research logic.

Proven TPU (Tensor Processing Unit) or multi-device infrastructure can make a rewrite especially costly. Paper reproduction may require the original execution path, and maintainers may already review and test JAX changes directly.

PyTorch may remain better for your production stack, team tooling, or supported operators. That does not make a research rewrite free. Keep the research implementation as oracle, add cross-framework numerical checks, and port only the smallest module whose inputs and outputs are clear.

Use this decision table before replacing a working codebase:

| Situation | Default move | Evidence before broader port |
|---|---|---|
| change one loss term | edit pure JAX loss | old and new loss values plus gradients |
| add per-example metric | `vmap` small metric function | shape and memory checks |
| load original checkpoint | preserve pytree structure | named leaf and output parity |
| unsupported deployment target | isolate export or port step | end-to-end numerical tolerance |
| organization owns PyTorch only | maintain reference plus port | checkpoints, evals, dtypes, timing |
| framework preference alone | don't rewrite yet | concrete maintenance or capability gap |

A clean port requires more than close loss curves. Compare preprocessing, parameter layouts, random seeds and streams, numerical precision, optimizer details, batch ordering, masks, evaluation aggregation, and generated artifacts. A mismatch in any one can dominate framework differences.

## A focused modification workflow

Start by running one existing repository test and one tiny forward pass. Save inputs and outputs as a reference test case if repository tooling allows it. Record tree paths, leaf shapes, dtypes, device placement, and random-key splits around the intended edit.

Change the smallest pure function and run it eagerly on the reference inputs. Compare scalar outputs and gradients, then apply the same transformations the repository uses. Benchmark the compiled path only after those checks pass.

If you're adding a regularizer, treat this sequence as an evidence ladder:

1. add the term to the scalar loss;
2. verify the term is zero on a known input pair;
3. compare finite differences on a tiny float input, choosing a step and tolerance appropriate to its dtype;
4. check the gradient pytree structure and look for non-finite values;
5. run the jitted step twice with the same shapes;
6. change only the key while holding data and configuration fixed, then check the resulting stochastic computation and its downstream updates;
7. run a held-out training or <span data-glossary="evaluation-slice">evaluation slice</span>;
8. measure cold compile and warm execution separately.

That sequence preserves causal evidence. If the final metric changes, you can point to one numerical edit rather than a framework rewrite plus a new data loader plus a new optimizer plus a new checkpoint converter.

For practice, add `0.1 * sum(weight ** 2)` to the regression loss without regularizing bias. At zero weights, both the extra loss and its gradient should be zero. At weights `[2, -1]`, the extra loss should be `0.5` and its gradient `[0.4, -0.2]`. Check those values eagerly and under `jit`, then rerun the training loop. This tests the intended numerical edit independently of its effect on convergence.

Here is a checked solution using the regression definitions from the linked training cells. It isolates the penalty first, then trains the changed objective from zero. Regularization changes the objective; it need not improve the unregularized fit.

<!-- leetllm: test, deps=jax==0.11.2, output=show, continue=jax-padding -->
```python title="verify_weight_regularizer.py"
def weight_penalty(params):
    return 0.1 * jnp.square(params["weight"]).sum()

exact_params = {"weight": jnp.array([2.0, -1.0]), "bias": jnp.array(0.0)}
penalty_and_grad = jax.jit(jax.value_and_grad(weight_penalty))
for candidate, expected_loss, expected_gradient in (
    (zero_params, 0.0, jnp.zeros(2)),
    (exact_params, 0.5, jnp.array([0.4, -0.2])),
):
    eager_loss, eager_grad = jax.value_and_grad(weight_penalty)(candidate)
    compiled_loss, compiled_grad = penalty_and_grad(candidate)
    assert jnp.isclose(eager_loss, expected_loss)
    assert jnp.isclose(compiled_loss, expected_loss)
    assert jnp.allclose(eager_grad["weight"], expected_gradient)
    assert jnp.allclose(compiled_grad["weight"], expected_gradient)
    assert float(eager_grad["bias"]) == float(compiled_grad["bias"]) == 0.0
    print("penalty:", round(float(compiled_loss), 3),
          "weight gradient:", [round(float(v), 3) for v in compiled_grad["weight"]],
          "bias gradient:", float(compiled_grad["bias"]))

def regularized_loss(params, features, targets):
    return batch_loss(params, features, targets) + weight_penalty(params)

regularized_grad = jax.jit(jax.value_and_grad(regularized_loss))
regularized_params = zero_params
for _ in range(80):
    _, grads = regularized_grad(regularized_params, x, y)
    regularized_params = jax.tree.map(
        lambda parameter, gradient: parameter - 0.05 * gradient,
        regularized_params, grads)
objective = regularized_loss(regularized_params, x, y)
assert float(objective) < float(regularized_loss(zero_params, x, y))
assert jnp.array_equal(zero_params["weight"], jnp.zeros(2))
print("regularized objective after 80 steps:", round(float(objective), 6))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
penalty: 0.0 weight gradient: [0.0, 0.0] bias gradient: 0.0
penalty: 0.5 weight gradient: [0.4, -0.2] bias gradient: 0.0
regularized objective after 80 steps: 0.399595
```
<!-- leetllm: output:end -->

A JAX step has to return its state. Watch for a reused key or a captured global, and time the device work rather than the Python call that dispatched it. One verified run still corresponds to a single shape and key schedule.

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
    "explanation": "Differentiate each row's loss first. The gradients are 2×(2−4)×2 = −8 and 2×(1−0)×1 = 2. Their magnitudes are 8 and 2. Averaging the signed gradients gives −3. Reporting 3 as the gradient loses its direction. Reporting [3, 3] assigns the magnitude of that batch gradient to both rows. Clipping needs each row's own magnitude."
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
    "explanation": "Only the returned array has 11 in the middle. Discarding it leaves a[1] equal to 5. For this default get, index 9 clips to the last valid index, 2, so the read returns a[2], which is 8. A read of 2 would come from wrapping 9 modulo 3 to index 0."
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
    "explanation": "Two keeps account for 0.8² = 64% of independent trials. Two drops add 0.2² = 4%, so the bits agree 68% of the time. Tracing both calls to the same child identifies the reused key. Replaying each call with its original key reproduces its bit even if the two calls used different children."
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
    "explanation": "The first variant captures 3 and returns 18. Reusing that compiled variant retains 18 after the Python edit. The new shape traces with 7 and returns 28. Passing the coefficient as an explicit numerical argument fixes the stale global capture."
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
    "explanation": "The sum is 14. Dividing by all five rows gives 2.8; dividing by three valid rows gives 14/3. The masked reduction must preserve gradients as well as this scalar value."
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
    "explanation": "The scalar broadcasts to all three weights, giving 0.08 in each. Keys still match; scalar shape () differs from parameter shape [3]. The correct vector update would produce [0.08,−0.02,−0.06]."
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
    "explanation": "At x=2, the distance is 0.5. Using 2*d gives the intended log(1) = 0. Using d alone gives log(0.5) and changes the active loss. At the cutoff, either maximum expression feeds zero to the logarithm. The outer selection returns zero, but JAX's reverse pass produces NaN. Feeding 1 to the inactive logarithm keeps its local derivative finite, and JAX returns a gradient of zero there."
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
    "explanation": "The while trace is 5→10→20 and stops. Three fixed doublings continue to 40 and multiply derivatives 2×2×2=8. A fixed scan supports reverse mode while changing the original stopping rule."
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
    "explanation": "Zero new gradient still leaves 0.8×0.4=0.32 momentum and subtracts 0.032 from the parameter. A zero diagnostic does not decide whether an empty batch should take an optimizer step."
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
    "explanation": "The cold call takes 48 ms including compilation. Reporting 13 ms for the cold call uses the warm call’s completion time. Start the warm timer when Python issues the call. Stopping when Python returns a handle measures only the first 1 ms. Starting there measures only the remaining wait of 13 − 1 = 12 ms. The full interval from call start until the last result leaf is ready is 13 ms."
  }
]
```

> **Next:** Continue to [Continued Pretraining for Domain Shift](/learn/continued-pretraining-domain-adaptation). A compiled research step still needs its checkpoints and tests. Keep that discipline while adapting a base model on domain text: pin the data and starting checkpoint, then measure domain gain against general-capability regression.
