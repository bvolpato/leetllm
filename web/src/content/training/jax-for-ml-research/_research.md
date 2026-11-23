---
query: "JAX for PyTorch researchers: pure functions, explicit state and PRNG keys, immutable arrays, grad, jit, vmap, pytrees, compilation behavior, asynchronous timing, and framework translation"
model: "manual primary-source review"
status: "completed"
verified_at: "2026-09-22"
---

## Editorial target

Teach a PyTorch-fluent researcher enough JAX to read, debug, and safely modify a research repository. Framework replacement isn't the objective. Center the lesson on the execution rules that JAX transformations require: pure functions, explicit state, stable array shapes, and observable compilation stages.

The reader should finish able to:

- translate a tiny PyTorch update into a pure JAX state transition;
- recognize model parameters and optimizer state as pytrees;
- split and thread pseudo-random number generator (PRNG) keys without reuse;
- compose `jax.grad`, `jax.vmap`, and `jax.jit` around a small function;
- diagnose tracing, recompilation, immutable-update, and asynchronous-timing failures;
- decide when preserving a JAX codebase is cheaper and safer than porting it.

## Stable foundation claims

### JAX as a transformation system

- JAX describes itself as a Python library for accelerator-oriented array computation and program transformation. Its project page shows `jax.grad`, `jax.vmap`, and `jax.jit` as composable transformations over numerical functions: https://github.com/jax-ml/jax
- The official quickstart frames JAX as array-oriented numerical computation with automatic differentiation, just-in-time compilation, and automatic vectorization. It also states that ordinary JAX arrays are immutable: https://docs.jax.dev/en/latest/notebooks/thinking_in_jax.html
- The sharp-bits guide says transformed functions should be functionally pure: inputs arrive through arguments and results leave through return values. It demonstrates that globals and Python side effects may be captured during tracing rather than repeated on every call: https://docs.jax.dev/en/latest/notebooks/Common_Gotchas_in_JAX.html

### Explicit model and optimizer state

- The stateful-computations guide names model parameters, optimizer state, and stateful-layer statistics as ML state. It rewrites a mutating counter into a function that accepts state and returns updated state, then applies the same pattern to training: https://docs.jax.dev/en/latest/stateful-computations.html
- A useful teaching signature is `step(params, optimizer_state, batch, key) -> (new_params, new_optimizer_state, new_key, metrics)`. This is an instructional synthesis of JAX's explicit-state guidance, not a required library API.
- Modern JAX also has mutable `Ref` values for controlled data plumbing and memory management. Ordinary `jax.Array` values remain immutable. Keep `Ref` as an advanced caveat rather than the beginner path: https://docs.jax.dev/en/latest/array_refs.html
- `Ref` is not limited to kernel plumbing. The current guide demonstrates training and gradient accumulation. Internal refs can preserve a pure caller-visible interface; externally passed refs produce controlled impure functions. This doesn't make arbitrary Python mutation inside a transformed function safe.

### Randomness

- Official random-number guidance explains the execution-order constraints of hidden sequential RNG state. JAX's explicit-key functions don't mutate their keys; repeating the same operation and arguments with one key repeats the sample. This isn't evidence that PyTorch clusters share one RNG register across all hardware threads: https://docs.jax.dev/en/latest/random-numbers.html
- The current API uses typed keys from `jax.random.key()`. The stable pattern splits a retained key from one-use subkeys with `jax.random.split()`: https://docs.jax.dev/en/latest/jax.random.html
- JAX now exposes an experimental stateful RNG convenience wrapper. Its documentation still recommends explicit `jax.random.key()` semantics for performance-critical applications and lists transformation limitations: https://docs.jax.dev/en/latest/_autosummary/jax.experimental.random.stateful_rng.html
- Avoid claims that explicit keys are the only possible JAX RNG interface. Say they are the stable, transparent path taught here.
- Default `threefry2x32` is one implementation, not the only algorithm. Typed keys retain implementation identity; legacy numeric keys don't. Other implementations can use other key layouts. Experimental RBG batching can generate a batch from the first mapped key, unlike a true per-key map: https://docs.jax.dev/en/latest/jax.random.html
- Splitting derives separate pseudorandom streams, not guaranteed unequal outputs. The one-bit Bernoulli check uses distinct seed-7 Threefry child keys that both produce `[False]`. Under the independent Bernoulli model with p=0.5, two one-bit outputs agree with probability 0.5.

### Immutable array updates

- JAX arrays don't support NumPy-style item assignment. The sharp-bits guide directs users to `x.at[index].set(value)` and related `.at` methods: https://docs.jax.dev/en/latest/notebooks/Common_Gotchas_in_JAX.html
- The quickstart also presents immutability as a core difference from NumPy: https://docs.jax.dev/en/latest/notebooks/thinking_in_jax.html
- Don't promise that `.at` always copies storage. Teach value semantics: the expression returns the updated array value, while compiler buffer reuse is an optimization detail.
- The `.at` API states indexed updates are applied in place inside `jit`: https://docs.jax.dev/en/latest/_autosummary/jax.numpy.ndarray.at.html. This doesn't authorize changing an old logical array value. Donation permits recycling input buffers and invalidates reuse of the donated input; it isn't an allocation-free guarantee: https://docs.jax.dev/en/latest/_autosummary/jax.jit.html.
- Default bounds behavior differs from Python indexing: out-of-bounds updates are dropped and gets clip their indices. The actual regression bias is scalar, so the update sketches use `.at[...]`; `.at[0]` would fail before demonstrating a discarded return.

### Automatic differentiation and batching

- `jax.grad(f)` returns a function that evaluates the gradient of scalar-valued `f`. `jax.value_and_grad` is useful for a training step because it returns loss and gradients from one transformed call: https://docs.jax.dev/en/latest/automatic-differentiation.html
- `jax.vmap` transforms a function into a batched version and uses `in_axes` and `out_axes` to identify mapped axes. Official docs show that `vmap` and `jit` compose: https://docs.jax.dev/en/latest/automatic-vectorization.html
- JAX supports forward- and reverse-mode differentiation. The ordinary `grad` path uses reverse mode: https://docs.jax.dev/en/latest/jacobian-vector-products.html
- A framework comparison should avoid universal speed claims. Transformations expose programs to compilation and vectorization, but workload, shapes, device, transfer cost, and compiler behavior decide measured performance.

### Pytrees

- Pytrees are nested container structures such as dicts, lists, and tuples whose leaves may be arrays. JAX transformations can accept and return pytrees, which makes nested parameter dictionaries a natural model representation: https://docs.jax.dev/en/latest/pytrees.html
- `jax.tree.map` applies a function leafwise. Multiple trees must have compatible structure: https://docs.jax.dev/en/latest/pytrees.html
- Custom classes are treated as leaves unless registered as pytree nodes or otherwise exposed through a supported mechanism: https://docs.jax.dev/en/latest/101/pytrees.html#custom-pytree-nodes
- Pytree structure participates in the transformed function's input signature. Changing container shape or leaf shapes can change tracing or compilation behavior.

## Compilation and debugging notes

### Tracing and static arguments

- `jax.jit` traces a Python function into primitive operations, compiles a specialized program, and caches the result: https://docs.jax.dev/en/latest/jit-compilation.html
- Static arguments become compile-time constants and participate in specialization. A new value requires its corresponding variant, which may already be cached. Keep static values bounded: https://docs.jax.dev/en/latest/jit-compilation.html
- Input shape and dtype commonly participate in specialization. Ahead-of-time documentation describes specialization using shape and element type: https://docs.jax.dev/en/latest/aot.html
- Defining a fresh lambda or jitted function inside a hot Python loop can defeat cache reuse because function identity changes. Define transformed callables once outside the loop: https://docs.jax.dev/en/latest/jit-compilation.html
- Don't present four attributes as an exhaustive XLA cache key. Pytree structure, scalar weak typing, sharding, and compilation settings matter alongside shapes, dtypes, callable identity, and static values. The CPU example demonstrates two traces for a weak Python float versus an explicitly typed scalar array.

### Data-dependent Python control flow

- Python `if`, `while`, `bool`, `int`, or indexing operations that require a concrete value can fail when given an abstract tracer. JAX documents `TracerBoolConversionError` and suggests array operations, JAX control-flow primitives, or a truly static argument depending on intent: https://docs.jax.dev/en/latest/errors.html
- Avoid teaching `static_argnames` as a blanket fix. Static values participate in specialization and are inappropriate when a branch should remain data-dependent.
- A finite `where` result does not ensure a finite gradient. The worked example reproduces NaN differentiation of an inactive `log(0)` and fixes it by making the log argument valid: https://docs.jax.dev/en/latest/faq.html.
- Both `lax.cond` branches are traced; vectorizing predicates can turn the conditional into selection. `while_loop`'s ordinary reverse-mode limitation remains distinct from compilability: https://docs.jax.dev/en/latest/_autosummary/jax.lax.cond.html and https://docs.jax.dev/en/latest/_autosummary/jax.lax.while_loop.html.

### Shape churn

- Ordinary compiled functions are commonly specialized by shape and dtype. A short final batch, changing sequence length, or changing a static configuration can create extra compiled variants: https://docs.jax.dev/en/latest/aot.html
- Practical controls include fixed batch shapes, length buckets, padding with masks, and keeping static option sets small. Label these as engineering patterns derived from shape specialization.

## Timing and benchmarking

- JAX dispatches work asynchronously. Timing only the Python call can measure enqueue latency instead of completed device work. Wait with `.block_until_ready()` or materialize a host value: https://docs.jax.dev/en/latest/async_dispatch.html
- Official benchmarking guidance separates the first call (compilation plus execution) from later cached execution, places inputs on the target device, matches dtypes, and blocks on results: https://docs.jax.dev/en/latest/benchmarking.html
- Don't copy hardware-specific timing numbers into the lesson. They become stale and don't transfer across devices or problem sizes.

## Current multi-device interfaces

- `vmap` maps array axes; it isn't a hardware-device assignment. It can compose with sharded-array programs.
- `pmap` remains a replica-oriented interface, but current documentation recommends `shard_map` for new code. Its default implementation has used `jit` and `shard_map` since JAX 0.8.0: https://docs.jax.dev/en/latest/_autosummary/jax.pmap.html and https://docs.jax.dev/en/latest/migrate_pmap.html.
- Meshes and `NamedSharding`/`PartitionSpec` describe placement. Current sharding supports explicit rules and automatic compiler choices; don't claim every spec inserts all kinds of collectives: https://docs.jax.dev/en/latest/201/sharding.html.
- `shard_map` exposes manual per-shard computation. Preserve local/global shape semantics and collective communication semantics when migrating: https://docs.jax.dev/en/latest/_autosummary/jax.shard_map.html.
- For independent replica randomness, key derivation should include globally unique replica identity and step ownership. Local device indices can repeat across processes. Deliberately shared randomness can be a valid design and should be stated.

## PyTorch translation interfaces

Use conceptual mappings, not claims that APIs are identical:

| PyTorch habit | JAX reading lens |
|---|---|
| `nn.Module` owns parameters | parameters often enter pure functions as pytree leaves |
| `.backward()` populates `.grad` | `grad` or `value_and_grad` returns a gradient pytree |
| `optimizer.step()` mutates owned state | update function returns new parameters and optimizer state |
| global or generator RNG state | explicit key is passed, split, and returned |
| in-place tensor update | `.at[...]` describes a new array value |
| `torch.compile` around module/step | `jax.jit` transforms a pure function and caches specialized executables |
| Python loop over examples | `vmap` may transform one-example function over a batch axis |

Keep the comparison respectful. PyTorch can express functional programs and compilation; JAX can be used through state-managing libraries. The lesson teaches default reading habits, not absolute framework limits.

## When preserving JAX is rational

- Reproducing a paper whose reference implementation, tests, sharding, and checkpoints already use JAX.
- Modifying a local loss, sampler, or update rule whose surrounding code depends on pytrees and transformations.
- Working in a codebase built around TPU or multi-device JAX infrastructure.
- Studying higher-order derivatives, per-example gradients, vectorized simulation, or transformation composition already expressed cleanly in JAX.
- Comparing a research idea across frameworks while preserving numerical tests and evaluation datasets.

A rewrite may be justified when required operators or deployment targets are unsupported, organization-wide production tooling is PyTorch-only, or maintenance ownership clearly favors one stack. Require explicit invariant tests, checkpoint conversion checks, dtype checks, and performance measurements before calling a port equivalent.

## Suggested visuals and practice

- Valuable custom figure: exact state-transition diagram showing parameters, optimizer state, key, batch, and returned values across the pure function call.
- Mermaid diagram: one pure loss function transformed by `grad`, `vmap`, and `jit`.
- Comparison table: PyTorch mutation-oriented training syntax against JAX value-returning syntax.
- Practice failure: reuse one PRNG key and observe repeated samples.
- Practice failure: time a jitted operation without blocking, then compare first call and warm calls with synchronization.
- Practice failure: send varying batch shapes and inspect compilation logs in a controlled experiment.

## Reference-registry keys

These keys are registered in `references.json`; this table lists the main teaching guides. The article also uses direct API references for `.at`, `jit`, PRNG, refs, control flow, and sharding.

| Registered key | Title | URL |
|---|---|---|
| `jax2026quickstart` | Quickstart: How to think in JAX | https://docs.jax.dev/en/latest/notebooks/thinking_in_jax.html |
| `jax2026sharpbits` | JAX: The Sharp Bits | https://docs.jax.dev/en/latest/notebooks/Common_Gotchas_in_JAX.html |
| `jax2026stateful` | Stateful computations | https://docs.jax.dev/en/latest/stateful-computations.html |
| `jax2026random` | Pseudorandom numbers | https://docs.jax.dev/en/latest/random-numbers.html |
| `jax2026pytrees` | Pytrees | https://docs.jax.dev/en/latest/pytrees.html |
| `jax2026autodiff` | Automatic differentiation | https://docs.jax.dev/en/latest/automatic-differentiation.html |
| `jax2026vmap` | Automatic vectorization | https://docs.jax.dev/en/latest/automatic-vectorization.html |
| `jax2026jit` | Just-in-time compilation | https://docs.jax.dev/en/latest/jit-compilation.html |
| `jax2026benchmarking` | Benchmarking JAX code | https://docs.jax.dev/en/latest/benchmarking.html |

## Freshness watchlist

- PyPI lists JAX 0.11.2 released September 17, 2026. The updated examples use Python 3.12 and JAX/jaxlib 0.11.2 on one CPU device: https://pypi.org/project/jax/0.11.2/. CPU numerical tests verify logic rather than accelerator throughput or multi-device scaling.
- Experimental stateful RNG and mutable `Ref` APIs can change. Recheck their official pages before expanding them beyond a caveat.
- Accelerator installation commands, supported platforms, and CUDA extras change. Keep installation out of core lesson or verify against https://docs.jax.dev/en/latest/installation.html on publication date.
- Shape polymorphism and export capabilities continue to evolve. Keep claims scoped to ordinary `jax.jit` specialization unless lesson explicitly covers export.
- Framework performance comparisons need a dated device, software stack, shapes, dtypes, transfer policy, compilation policy, and synchronization method. Omit unqualified speed rankings.
