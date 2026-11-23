---
{
  "title": "Model Merging and Weight Interpolation",
  "id": "model-merging-weight-interpolation",
  "slug": "model-merging-weight-interpolation",
  "section": "Advanced Training & Adaptation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/model_merging_dark.png",
  "companies": [
    "Meta",
    "Google DeepMind",
    "Hugging Face",
    "Arcee",
    "Stability AI"
  ],
  "shortDescription": "Averaging three same-base assistants can post a high overall score and still fail the math gate, so lineage and per-task checks come before promotion.",
  "keyConceptsTested": [
    "Model Soup (uniform weight averaging)",
    "Task Arithmetic (task vectors and linear combination)",
    "TIES-Merging (trim, elect sign, merge)",
    "DARE (drop and rescale for sparse merging)",
    "SLERP and geometric interpolation",
    "mergekit, tokenizer handling, and practical merging workflows"
  ],
  "order": 17,
  "prerequisites": [
    "knowledge-distillation-llms",
    "lora-parameter-efficient-fine-tuning",
    "supervised-fine-tuning-pipeline",
    "linear-algebra-machine-learning-deeper"
  ],
  "relatedQuestions": [
    "knowledge-distillation-llms",
    "programmatic-prompt-optimization-dspy",
    "model-quantization-gptq-awq-gguf",
    "mixture-of-experts-architecture"
  ]
}
---

Distillation trains a student from teacher signal. <span data-glossary="model-merging">Model merging</span> starts later: you already have useful fine-tuned <span data-glossary="model-checkpoint">checkpoints</span> and want one checkpoint without another compute-heavy <span data-glossary="gradient">gradient</span> training run.

Picture your platform team serving three same-base 8B assistants: Code, Math, and Chat. Keeping all three full backbones resident requires about three times the weight storage of one backbone at the same precision. Total GPU memory and latency also depend on KV caches, concurrency, routing, and whether you swap models or share a backbone with adapters. In our synthetic release report, the first merge candidate writes successfully and reports a macro-average score of 87.2. Then the slice metrics arrive: code clears at 92.4, chat clears at 87.0, but math drops to 82.1 against an 85.0 gate. Keeping one unified model would simplify serving, but this candidate stays blocked. These scores illustrate our release decision rule: a high aggregate never excuses a declared critical gate failure.

Before picking a merge recipe, verify that parameter coordinates share identical semantic meaning. If <span data-glossary="token">token</span> ID 417 maps to `return` in one tokenizer but `<fim_prefix>` in another, averaging row 417 in the embedding matrix blends unrelated output symbols into gibberish. Direct <span data-glossary="tensor">tensor</span> interpolation demands compatible shapes and shared coordinates. Both <span data-glossary="embedding">embedding</span> matrices ($W_{\text{emb}}$) and language-model heads ($W_{\text{head}}$) depend on an explicit tokenizer policy. Mergekit can build a `union` tokenizer and assign fallback embeddings for missing tokens, but that's an output-space patch that needs empirical evaluation.[^mergekit2023] Same-base checkpoints serve as our conservative starting point because their coordinates share lineage. Matching shapes alone doesn't make a merge sound.

Keep Code, Math, and Chat as our running trio. We'll compare several recipes, from plain weight averaging to sparse, conflict-aware task-<span data-glossary="vector">vector</span> combinations. First ask whether a straight path through weight space is even usable.

## When averaging weights is worth testing

If someone told you to average the internal numbers of two trained neural networks, skepticism is healthy. The nearby checkpoints still have to share a low-loss basin. Weight averaging works in specific fine-tuning settings, but two good endpoints don't certify the points between them.

Fine-tuning nudges a checkpoint from a shared base through high-dimensional weight space. To test whether two checkpoints $\theta_A$ and $\theta_B$ can be linearly blended, we evaluate the 1D interpolation path:

$$
\theta(\alpha) = (1-\alpha)\theta_A + \alpha\theta_B, \quad \alpha \in [0, 1]
$$

Linear mode connectivity asks whether this straight path crosses a high-loss barrier. Barrier conventions differ: Frankle et al. subtract the mean endpoint error, while Entezari et al. subtract the endpoint chord at each coefficient. We use the latter convention:[^frankle2020][^entezari2022]

$$
\Delta \mathcal{L}(\theta_A, \theta_B) = \sup_{\alpha \in [0, 1]} \left[\mathcal{L}(\theta(\alpha)) - \left((1-\alpha)\mathcal{L}(\theta_A) + \alpha\mathcal{L}(\theta_B)\right)\right]
$$

The expression is zero at both endpoints, so its supremum is nonnegative. A zero chord barrier means the path never rises above the endpoint chord; a small positive barrier may be acceptable under a declared tolerance. Neither condition proves a convex loss basin, or even convexity on this one-dimensional path. Model Soups reports useful averages of models fine-tuned from a shared pretrained initialization and studies their loss geometry.[^wortsman2022] That finding supports testing nearby same-lineage candidates. It doesn't certify our Code and Math pair.

Evaluate candidate points along $\theta(\alpha)$ rather than assuming the midpoint is usable. Code and Math can each pass alone and still interfere catastrophically along the path. Models with unrelated <span data-glossary="pretraining">pretraining</span> lineages are even poorer candidates because no common base preserved their parameter coordinates.

If both endpoints pass, does $\alpha=0.50$ pass too? Our synthetic path has a failing midpoint despite passing endpoints. In a real run, each loss and score must come from evaluating the interpolated checkpoint on the same held-out examples. Here the arrays represent a synthetic screening sweep across five evaluation points, and `task_scores` represents one required task slice. Passing five sampled points does not guarantee that every point between them passes.

<!-- leetllm: test, output=show -->
```python title="screen-synthetic-interpolation-path.py"
alphas = [0.00, 0.25, 0.50, 0.75, 1.00]
losses = [0.18, 0.20, 0.61, 0.23, 0.19]
task_scores = [0.88, 0.86, 0.70, 0.85, 0.89]

max_accepted_loss = 0.30
min_accepted_score = 0.84

accepted = [
    alpha
    for alpha, loss, score in zip(alphas, losses, task_scores)
    if loss <= max_accepted_loss and score >= min_accepted_score
]

print("accepted_alphas:", accepted)
print("midpoint_passes:", 0.50 in accepted)
barriers = [loss - ((1 - alpha) * losses[0] + alpha * losses[-1])
            for alpha, loss in zip(alphas, losses)]
print("sampled chord barrier:", round(max(barriers), 3))

# This authored curve stays below its endpoint chord of 1 on [0, 1].
# Nevertheless, it violates the convexity inequality at 0.4, 0.5, 0.6.
def curve(alpha):
    return 1 - alpha * (1 - alpha) * (1 + 8 * (alpha - 0.5)**2)

print("below endpoint chord but not convex:",
      curve(0.5) > (curve(0.4) + curve(0.6)) / 2)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
accepted_alphas: [0.0, 0.25, 0.75, 1.0]
midpoint_passes: False
sampled chord barrier: 0.425
below endpoint chord but not convex: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/loss_basin_interpolation_dark.png" alt="Five sampled coefficients compare two synthetic loss paths. Both have endpoint losses 0.18 and 0.19. The ridge path reaches 0.61 at alpha 0.50, above the 0.30 gate, with a sampled endpoint-chord barrier of 0.425. The low path reaches 0.09 at the midpoint. Lines between samples are guides, not additional evaluations." />
  <figcaption>The ridge path fails at the midpoint even though both endpoints pass. Dots are the five authored evaluations; the connecting lines only guide the eye.</figcaption>
</figure>

> **Same-base lineage:** A shared base makes Code and Math worth testing together. Per-task evaluation measures whether each behavior survives.

### The permutation invariance problem

Why can two networks that solve the exact same task disagree at nearly every coordinate? Neural networks exhibit **permutation invariance**: for any hidden layer with activation $h = \sigma(W_1 x + b_1)$ followed by $W_2 h$, we can insert an arbitrary permutation matrix $\Pi$ and its transpose $\Pi^T$:

$$
\tilde{W}_1 = \Pi W_1, \quad \tilde{b}_1 = \Pi b_1, \quad \tilde{W}_2 = W_2 \Pi^T
$$

For an elementwise activation, $\sigma(\Pi z)=\Pi\sigma(z)$. The biases and nonlinearity therefore belong in the identity:[^entezari2022]

$$
W_2\Pi^T\sigma(\Pi W_1x+\Pi b_1)=W_2\sigma(W_1x+b_1)
$$

A width-$d$ hidden layer admits $d!$ permutation assignments, though identical units can make some assignments produce identical parameters. Independently trained networks may store corresponding features in different slots, or learn different features altogether. Averaging unmatched coordinates can destroy useful behavior.

Git Re-Basin[^ainsworth2022] resolves this by finding a permutation $\pi$ that aligns hidden units across layers before averaging:

$$
\theta_{\text{merged}} = \frac{1}{2}(\theta_A + \pi(\theta_B))
$$

Weight matching seeks a collection of layer permutations that reduces parameter distance:

$$
\min_{\pi} \|\operatorname{vec}(\theta_A)-\operatorname{vec}(\pi(\theta_B))\|_2^2
$$

The global multilayer weight-matching problem is generally hard: the Git Re-Basin paper identifies its formulation as NP-hard for more than two layers. Its weight-matching algorithm repeatedly fixes the other layer permutations and solves one Linear Sum Assignment Problem (LSAP), accounting for the layer's incoming and outgoing weights. A Hungarian solver can optimize that coordinate step; it doesn't certify a globally optimal alignment. The paper's activation-matching method instead solves separate assignments from cross-model activation similarities.[^ainsworth2022]

Use a tiny three-feature example to see the failure. Two checkpoints learn features A, B, and C but store them in different slot orders. Here $\theta_B$ stores B, C, A. Git Re-Basin searches for a permutation $\pi$ that restores A, B, C before averaging.

Git Re-Basin uses permutation matching and reports merged independently trained MLP, CNN, and ResNet models in its studied settings, including zero-barrier linear mode connectivity for sufficiently wide ResNets on CIFAR-10.[^ainsworth2022] Alignment fixes coordinate permutation mismatch between vision models. It isn't an established repair pipeline for arbitrary large language models with attention heads, RMSNorm, and rotary embeddings, so same-base lineage plus downstream evaluation remain our LLM default.

You can isolate the alignment problem without training anything. This two-unit ReLU network computes $2\max(x,0)-\max(-x,0)$. Swapping both incoming and outgoing weights preserves that function. Averaging the unaligned weights instead makes both incoming weights zero, destroying the function:

<!-- leetllm: test, output=show -->
```python title="permutation-preserves-function-not-average.py"
import numpy as np

x = np.array([-2.0, -1.0, 1.0, 2.0])
incoming = np.array([1.0, -1.0])
outgoing = np.array([2.0, -1.0])
permutation = np.array([1, 0])

def network(w_in, w_out):
    return np.maximum(x[:, None] * w_in, 0) @ w_out

b_in, b_out = incoming[permutation], outgoing[permutation]
naive = network((incoming + b_in) / 2, (outgoing + b_out) / 2)
inverse = np.argsort(permutation)
aligned = network((incoming + b_in[inverse]) / 2,
                  (outgoing + b_out[inverse]) / 2)
print("same_function:", np.allclose(network(incoming, outgoing), network(b_in, b_out)))
print("original:", network(incoming, outgoing).tolist())
print("naive_average:", naive.tolist())
print("aligned_average:", aligned.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same_function: True
original: [-2.0, -1.0, 2.0, 4.0]
naive_average: [0.0, 0.0, 0.0, 0.0]
aligned_average: [-2.0, -1.0, 2.0, 4.0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/git_rebasin_alignment_dark.png" alt="A constructed two-unit ReLU network has incoming weights [1, −1] and outgoing weights [2, −1]. The second network stores the same two units in reverse order. Applying the supplied permutation π=(1,0) restores outputs [−2, −1, 2, 4]; naive averaging gives zero for every input. The figure traces this known-swap alignment before averaging." />
  <figcaption>The supplied swap restores the original outputs before averaging combines matching units.</figcaption>
</figure>

The permutation here is known by construction. For independently trained networks, Git Re-Basin must search for a useful alignment; this example demonstrates only what happens after that alignment is known.

```checkpoint
Why does Git Re-Basin apply $\pi$ before averaging?
---
Two models can represent the same function with neurons in different orders. The permutation aligns corresponding neurons first, so averaging combines matching features instead of unrelated ones.
```

## From simple averages to conflict-aware methods

The first screen asks whether coordinates line up. The next asks what to do when they do: average endpoints, add deltas, filter conflicts, or change interpolation geometry. Choose against source lineage, observed delta conflict, and the evaluations the output must pass.

| Method | Mechanism | Pros | Cons | Best For |
|---|---|---|---|---|
| **Model Soups / Linear** | Uniform or weighted averaging | Simple baseline | Interference between conflicting parameters | Nearby checkpoints with representative evaluation |
| **Task Arithmetic** | Weighted task vectors | Separate coefficients per delta | Coefficients don't guarantee separate capabilities survive | Same-base task-vector experiments |
| **TIES-Merging (Trim, Elect Sign, Merge)** | Trim and aggregate-sign filtering | Explicitly handles conflicting delta signs | Density and scale need tuning | Conflicting same-base task vectors |
| **DARE (sparsify first)** | Random dropping and rescaling of task vectors | Sparse preprocessing evaluated by its paper | Preprocessing step to pair with a merge rule | Testing DARE plus a downstream merge |
| **SLERP (Spherical Linear Interpolation)** | Spherical interpolation in direction space | Has a norm-preserving geometric interpretation | Evaluate task quality on held-out examples | Pairwise interpolation experiment |

### Model soups (uniform averaging)

Start with the plain control: average the endpoint weights and see what behavior you lose. This is Model Soups[^wortsman2022], applied to multiple fine-tuned models:

$$
\theta_{\text{merged}} = \frac{1}{N} \sum_{i=1}^{N} \theta_i
$$

Consider the arithmetic on a single scalar weight: if checkpoint A has a weight `2.0` and checkpoint B has `4.0`, equal averaging yields `3.0`. The dictionaries below represent tensor slices, keeping the arithmetic clear and concrete. A single coordinate still cannot tell you whether Code, Math, or Chat behavior survived.

Model Soups evaluates models fine-tuned from a shared initialization over hyperparameter configurations and reports improved accuracy and robustness in its studied settings without the inference cost of an ensemble.[^wortsman2022] That evidence motivates a baseline for nearby candidates, not a blanket rule for specialists.

Uniform soups average *all* candidate checkpoints with equal weight. Greedy soups start from the best individual model and add a candidate when the resulting average doesn't decrease the chosen validation metric, including ties in the original algorithm. Our helper below uses a stricter improvement rule. Selection can improve the chosen metric without improving every distribution or task slice. The paper also studies learned soup coefficients optimized with gradients; the gradient-free claim applies to uniform and greedy averaging, not every soup variant.[^wortsman2022]

The next example constructs and evaluates each trial soup. Its tiny linear predictors estimate $y=2x+2$; negative mean squared error is the selection metric, so larger is better. This deterministic synthetic example isolates the selection mechanics. Keep separate test data untouched when selecting real models to measure generalization.

<figure>
  <img src="illustrations/_generated/model_soup_selection_dark.png" alt="For the target y = 2x + 2 at x values −1, 0, and 1, the low-bias and high-bias predictors average to the target outputs 0, 2, and 4 with MSE 0. Adding the bad predictor moves the three-model soup to −2, 2, and 6, with MSE 8/3. This linear walkthrough shows the selection calculation." />
  <figcaption>The selected pair matches the toy target at all three inputs. Adding the third candidate changes the endpoints and raises mean squared error to 8/3.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="uniform-vs-greedy-soups.py"
import math


def uniform_merge(
    models: list[dict[str, list[float]]],
    weights: list[float] | None = None,
) -> dict[str, list[float]]:
    if not models or not models[0]:
        raise ValueError("Need nonempty models and parameters")
    for model in models:
        if model.keys() != models[0].keys():
            raise ValueError("Parameter keys must match")
        for key, values in model.items():
            if not values or len(values) != len(models[0][key]):
                raise ValueError("Parameter shapes must match and be nonempty")
    if weights is None:
        weights = [1.0 / len(models)] * len(models)
    if (len(weights) != len(models)
            or any(w < 0 for w in weights)
            or not math.isclose(sum(weights), 1.0, abs_tol=1e-9)):
        raise ValueError("Need one nonnegative weight per model, summing to 1")

    merged: dict[str, list[float]] = {}
    for key in models[0]:
        merged[key] = [
            sum(w * m[key][i] for w, m in zip(weights, models))
            for i in range(len(models[0][key]))
        ]
    return merged


def score(model):
    pairs = [(-1.0, 0.0), (0.0, 2.0), (1.0, 4.0)]
    return -sum((model["w"][0] * x + model["bias"][0] - y) ** 2
                for x, y in pairs) / len(pairs)


def greedy_soup(candidates):
    ordered = sorted(candidates, key=lambda name: score(candidates[name]), reverse=True)
    if not ordered:
        raise ValueError("Need at least one candidate")
    kept = [ordered[0]]
    soup = uniform_merge([candidates[kept[0]]])
    best = score(soup)
    for name in ordered[1:]:
        trial = uniform_merge([candidates[n] for n in kept + [name]])
        trial_score = score(trial)
        if trial_score > best:  # This teaching variant rejects exact ties.
            kept.append(name)
            soup, best = trial, trial_score
    return kept, soup


code_model = {"w": [2.0, 4.0], "bias": [1.0]}
math_model = {"w": [4.0, 2.0], "bias": [3.0]}
merged = uniform_merge([code_model, math_model])
candidates = {"low_bias": {"w": [2.0], "bias": [1.0]},
              "high_bias": {"w": [2.0], "bias": [3.0]},
              "bad": {"w": [8.0], "bias": [2.0]}}
kept, soup = greedy_soup(candidates)

print("weights_ok:", merged["w"] == [3.0, 3.0])
print("bias_ok:", merged["bias"] == [2.0])
print("merged w:", merged["w"])
print("merged bias:", merged["bias"])
print("greedy kept:", kept)
print("uniform MSE:", round(-score(uniform_merge(list(candidates.values()))), 4))
print("greedy MSE:", round(-score(soup), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
weights_ok: True
bias_ok: True
merged w: [3.0, 3.0]
merged bias: [2.0]
greedy kept: ['low_bias', 'high_bias']
uniform MSE: 2.6667
greedy MSE: 0.0
```
<!-- leetllm: output:end -->

Averaging is cheap to implement and has no hyperparameters beyond optional weights. On our Code, Math, and Chat trio, a poor aggregate result tells you little about which task caused the loss. Conflicting parameters can cancel when specialists move in opposite directions. To keep those directions visible, the next recipe subtracts the shared base first.

### Task arithmetic

The average baseline hides why specialists moved. <span data-glossary="task-arithmetic">Task arithmetic</span>[^ilharco2022] keeps that reference point: a **task vector** is the difference between fine-tuned weights and the shared base model:

$$
\tau_i = \theta_i - \theta_0 \quad \text{(task vector for model } i \text{)}
$$

$$
\theta_{\text{merged}} = \theta_0 + \sum_{i=1}^{N} \lambda_i \cdot \tau_i
$$

Here $\theta_0$ is the base model, $\theta_i$ are fine-tuned models, $\tau_i$ are per-task deltas, and $\lambda_i$ are merge coefficients.

#### Capability addition and capability subtraction

Task vectors let us construct addition and subtraction candidates. Their behavioral meaning must be tested:

1. **Addition candidate:** Adding scaled task vectors can combine improvements from complementary specialists:
   $$
   \theta_{\text{multi}} = \theta_0 + \lambda_{\text{code}} \tau_{\text{code}} + \lambda_{\text{math}} \tau_{\text{math}}
   $$
2. **Negation candidate:** Fine-tune an auxiliary model on a behavior, compute its delta, then subtract a scaled version:
   $$
   \theta_{\text{edited}} = \theta_0 - \lambda \tau_{\text{behavior}}
   $$

In the original task-arithmetic experiment, negating a GPT-2 Large toxic-language delta reduced the measured toxic-generation fraction from 4.8% to 0.8%, while WikiText-103 perplexity changed from 16.4 to 16.9. Those historical measurements used 1,000 generations and a toxicity classifier.[^ilharco2022] The delta contains all effects of that fine-tuning run; it doesn't isolate a unique harmful-behavior subspace. Lower toxicity on those prompts doesn't certify safety, selective forgetting, or removal of copyrighted training data.

#### A concrete scalar walkthrough

To see the arithmetic clearly before scaling to full model tensors, track a single coordinate. Start with a base weight at `2.0`. Code pushes it to `2.5`, producing a task vector of `+0.5`; Math pushes it to `1.5`, producing a task vector of `-0.5`. If Code receives $\lambda_{\text{code}} = 0.6$ and Math receives $\lambda_{\text{math}} = 0.4$, the merged coordinate lands at:

$$
\text{merged weight} = 2.0 + 0.6(0.5) + 0.4(-0.5) = 2.0 + 0.3 - 0.2 = 2.1
$$

The result, `2.1`, is a positive change in a weight, not a quality improvement. Equal averaging gives `2.0`, but weighting the endpoints by `0.6` and `0.4` also gives `2.1`. Subtracting the base doesn't itself prevent cancellation. The difference in this example comes entirely from unequal coefficients:

$$
\theta_0+\sum_i\lambda_i(\theta_i-\theta_0)
=\left(1-\sum_i\lambda_i\right)\theta_0+\sum_i\lambda_i\theta_i
$$

When the coefficients sum to one, task arithmetic equals the corresponding weighted endpoint average. Otherwise, the base has a nonzero coefficient, and the result can lie outside the endpoints.

<figure>
  <img src="illustrations/_generated/model_merging_dark.png" alt="On one scalar weight coordinate, the base is 2.0, Code is 2.5, and Math is 1.5. The equal endpoint average and the corresponding 50/50 task-vector merge both land at 2.0. With 60/40 coefficients, both methods land at 2.1. This coordinate example says nothing about model quality." />
  <figcaption>Changing coefficients changes the answer. Changing from endpoints to deltas with the same sum-to-one coefficients does not.</figcaption>
</figure>

```checkpoint
Why did absolute averaging cancel the two specialist deltas in the scalar example?
---
The code-generation fine-tune moved this coordinate up by +0.5 and the math-reasoning fine-tune moved it down by -0.5. Averaging final weights lands this coordinate back at the base value, cancelling both deltas here. Task evaluation determines the broader behavioral effect.
```

A second coefficient pair exposes a tuning detail. Suppose Code nudges the coordinate to `2.4` (task vector `+0.4`) and Math nudges it to `1.8` (task vector `-0.2`). Setting $\lambda_{\text{code}} = 0.7$ and $\lambda_{\text{math}} = 0.5$ gives `2.0 + 0.28 - 0.10 = 2.18`. The coefficients need not form a convex average; they scale deltas. Capability retention still comes from evaluation.

`task_arithmetic_merge` subtracts the base to get task vectors, scales them, and adds them back:

<!-- leetllm: test, output=show -->
```python title="a-concrete-scalar-walkthrough.py"
import math


def task_arithmetic_merge(
    base_model: dict[str, list[float]],
    fine_tuned_models: list[dict[str, list[float]]],
    scaling_coefficients: list[float],
) -> dict[str, list[float]]:
    if not base_model or not fine_tuned_models or len(fine_tuned_models) != len(scaling_coefficients):
        raise ValueError("Need a base and one coefficient per source")
    for model in [base_model, *fine_tuned_models]:
        if model.keys() != base_model.keys():
            raise ValueError("Parameter keys must match")
        for key, values in model.items():
            if not values or len(values) != len(base_model[key]):
                raise ValueError("Parameter shapes must match and be nonempty")
    merged = {key: value[:] for key, value in base_model.items()}
    for model, coeff in zip(fine_tuned_models, scaling_coefficients):
        for key in merged:
            merged[key] = [
                merged_value + coeff * (tuned - base)
                for merged_value, tuned, base in zip(
                    merged[key], model[key], base_model[key]
                )
            ]
    return merged


shared_base = {"w": [2.0]}
code_ft = {"w": [2.5]}
math_ft = {"w": [1.5]}
merged = task_arithmetic_merge(
    base_model=shared_base,
    fine_tuned_models=[code_ft, math_ft],
    scaling_coefficients=[0.6, 0.4],
)

print("base:", shared_base["w"][0])
print("matches_expected:", all(abs(v - expected) < 1e-6 for v, expected in zip(merged["w"], [2.1])))
print("merged:", round(merged["w"][0], 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
base: 2.0
matches_expected: True
merged: 2.1
```
<!-- leetllm: output:end -->

### Merging LoRA adapters: average which objects?

An adapter stores factors, not the effective weight update. For the same base weight, a standard LoRA adapter contributes $\Delta W_i=s_iB_iA_i$, including its configured scale $s_i$.[^hu2021] If you want $\lambda_1\Delta W_1+\lambda_2\Delta W_2$, separately averaging the $A$ and $B$ factors generally gives the wrong matrix: multiplying those averages introduces cross terms.

<figure>
  <img src="illustrations/_generated/lora_factor_merge_dark.png" alt="At unit scales s₁ = s₂ = 1, two rank-one adapters have A1 = [1,0], B1 = [1,0]ᵀ and A2 = [0,1], B2 = [0,1]ᵀ. Averaging their effective deltas with equal weights gives the diagonal matrix with 0.5 on each diagonal. Averaging A and B separately then multiplying gives four 0.25 entries because of cross terms. Concatenating the original factors represents the exact sum at rank two." />
  <figcaption>The equal-weight delta average has rank two. Concatenating the original factors can represent that sum exactly; averaging factor matrices mixes in cross terms.</figcaption>
</figure>

In this two-coordinate example, each adapter modifies a distinct diagonal entry. Their equal-weight combination affects both entries and has rank two, so a rank-one adapter cannot represent it exactly.

<!-- leetllm: test, output=show -->
```python title="lora-factor-average-is-not-delta-average.py"
import numpy as np

a1, a2 = np.array([[1., 0.]]), np.array([[0., 1.]])
b1, b2 = a1.T, a2.T
desired = 0.5 * (b1 @ a1) + 0.5 * (b2 @ a2)
factor_average = ((b1 + b2) / 2) @ ((a1 + a2) / 2)

# Concatenation absorbs coefficients into B and keeps each original product.
b_concat = np.concatenate([0.5 * b1, 0.5 * b2], axis=1)
a_concat = np.concatenate([a1, a2], axis=0)
print("desired delta:", desired.tolist())
print("factor-average delta:", factor_average.tolist())
print("concatenation is exact:", np.allclose(b_concat @ a_concat, desired))
print("required rank:", np.linalg.matrix_rank(desired))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
desired delta: [[0.5, 0.0], [0.0, 0.5]]
factor-average delta: [[0.25, 0.25], [0.25, 0.25]]
concatenation is exact: True
required rank: 2
```
<!-- leetllm: output:end -->

Concatenation can represent the summed update at rank at most $r_1+r_2$. Compressing it to a lower rank with SVD introduces approximation error. PEFT exposes multiple adapter-combination methods, so specify the actual method instead of calling every factor operation “averaging.”[^peft2026merging] Check the base revision, target modules, scaling, and tokenizer compatibility. This matrix calculation executes no PEFT API and establishes no task-quality guarantee.

Scaling task vectors still doesn't resolve a coordinate where Code and Math ask for opposite directions. That conflict motivates TIES.

### TIES-Merging (trim, elect sign, merge)

TIES studies two sources of interference: aggregating small updates and combining opposite update signs. At one coordinate, $+0.50$ and $-0.50$ cancel under addition. Evaluate both specialists on held-out tasks to measure whether the merge preserves their capabilities.

TIES-Merging[^yadav2023] trims smaller-magnitude deltas, elects an aggregate sign, and averages the surviving updates aligned with that sign. Small-magnitude updates can still carry useful behavior, and sign filtering leaves cross-parameter interactions. Measure the merged model on held-out tasks.

The paper's PEFT analysis found that keeping the top 20% of updates by magnitude approximately preserved the average performance in its studied settings.[^yadav2023] Measure quality across densities on the target models and tasks before selecting one.

Track the three specialist rows in the figure across parameter coordinates. At parameter `p2`, the two negative entries total `-0.90`, while the positive entry is `+1.10`. Positive signed mass wins, and only the aligned `+1.10` survives the disjoint merge. The resulting task vector is then added back to the base, scaled by a global coefficient $\lambda$.

<figure>
  <img src="illustrations/_generated/ties_conflict_resolution_dark.png" alt="For three task vectors, density 0.5 keeps the two largest entries in each row. At p2 the surviving values −0.50, +1.10, and −0.40 sum to +0.20, so sign election keeps only +1.10. At p4 the values +0.80, −0.60, and +0.70 sum to +0.90, so the aligned mean is +0.75. The other two parameter coordinates trim to zero." />
  <figcaption>At p2, signed mass selects the positive direction and only +1.10 contributes. At p4, the aligned mean of +0.80 and +0.70 is +0.75. These are coordinate-wise steps; held-out task checks still decide the merge.</figcaption>
</figure>

#### Step 1: Trim

Trim keeps the largest-magnitude fraction of each task vector. With four values and `density=0.5`, the two largest absolute updates survive. For this helper, keep exactly `floor(n * density)` entries, breaking equal-magnitude ties by earlier index. Density zero keeps nothing; density one keeps everything. Small tensors make rounding policies visible, so record your implementation's convention.

<!-- leetllm: test, output=show -->
```python title="step-1-trim.py"
import math


def trim(task_vector: list[float], density: float = 0.2) -> list[float]:
    if not (0.0 <= density <= 1.0):
        raise ValueError("density must be in [0, 1]")
    if not task_vector:
        raise ValueError("Need a nonempty task vector")
    k = math.floor(len(task_vector) * density)
    keep = set(
        sorted(range(len(task_vector)), key=lambda i: abs(task_vector[i]), reverse=True)[:k]
    )
    return [value if i in keep else 0.0 for i, value in enumerate(task_vector)]


task_vector = [0.1, -0.5, 0.02, 0.8]
trimmed = trim(task_vector, density=0.5)

print("matches_expected:", trimmed == [0.0, -0.5, 0.0, 0.8])
print("trimmed:", trimmed)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
matches_expected: True
trimmed: [0.0, -0.5, 0.0, 0.8]
```
<!-- leetllm: output:end -->

#### Step 2: Elect sign

When multiple task vectors update one parameter, TIES-Merging resolves conflicting directions with $\gamma_m^p = \mathrm{sgn}(\sum_t \hat{\tau}_t^p)$.[^yadav2023] Sum the trimmed signed deltas and take the resulting sign. This isn't a majority vote: one large update can outweigh two smaller opposing updates. Our explicit tie policy is zero signed sum means no update. Implementations can use another tie policy, so don't assume bit-for-bit agreement with a library.

<!-- leetllm: test, output=show -->
```python title="step-2-elect-sign.py"
import math


def sign(value: float) -> float:
    if value > 0:
        return 1.0
    if value < 0:
        return -1.0
    return 0.0


def elect_sign(trimmed_vectors: list[list[float]]) -> list[float]:
    if not trimmed_vectors or not trimmed_vectors[0]:
        raise ValueError("Need nonempty task vectors")
    width = len(trimmed_vectors[0])
    if any(len(v) != width for v in trimmed_vectors):
        raise ValueError("Task vectors must be rectangular")
    aggregate = [sum(vector[i] for vector in trimmed_vectors) for i in range(width)]
    return [sign(total) for total in aggregate]


trimmed_vectors = [
    [0.0, -0.5, 0.0, 0.8],
    [0.0, 1.1, 0.0, -0.6],
    [0.0, -0.4, 0.0, 0.7],
]
elected = elect_sign(trimmed_vectors)
print("two_negative_votes_at_p2:", sum(v[1] < 0 for v in trimmed_vectors) == 2)
print("positive_mass_wins_at_p2:", elected[1] == 1.0)
print("matches_expected:", elected == [0.0, 1.0, 0.0, 1.0])
print("elected signs:", elected)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
two_negative_votes_at_p2: True
positive_mass_wins_at_p2: True
matches_expected: True
elected signs: [0.0, 1.0, 0.0, 1.0]
```
<!-- leetllm: output:end -->

#### Step 3: Disjoint merge

Now average only non-zero updates that agree with the elected sign. Trimmed zeros stay out of the mean, so a discarded proposal can't dilute the surviving direction:

<!-- leetllm: test, output=show -->
```python title="step-3-disjoint-merge.py"
import math


def sign(value: float) -> float:
    if value > 0:
        return 1.0
    if value < 0:
        return -1.0
    return 0.0


def disjoint_merge(
    trimmed_vectors: list[list[float]],
    elected_signs: list[float],
) -> list[float]:
    if not trimmed_vectors or not elected_signs:
        raise ValueError("Need vectors and elected signs")
    width = len(trimmed_vectors[0])
    if (len(elected_signs) != width or any(s not in (-1, 0, 1) for s in elected_signs)
            or any(len(v) != width for v in trimmed_vectors)):
        raise ValueError("Need matching rectangular vectors and signs in {-1, 0, 1}")
    merged = [0.0] * width
    counts = [0.0] * width
    for vector in trimmed_vectors:
        for i, value in enumerate(vector):
            agrees = (
                value != 0.0
                and elected_signs[i] != 0.0
                and sign(value) == elected_signs[i]
            )
            if agrees:
                merged[i] += value
                counts[i] += 1.0
    return [
        total / count if count > 0 else 0.0
        for total, count in zip(merged, counts)
    ]


trimmed_vectors = [
    [0.0, -0.5, 0.0, 0.8],
    [0.0, 1.1, 0.0, -0.6],
    [0.0, -0.4, 0.0, 0.7],
]
elected_signs = [0.0, 1.0, 0.0, 1.0]
merged = disjoint_merge(trimmed_vectors, elected_signs)

print("matches_expected:", merged == [0.0, 1.1, 0.0, 0.75])
print("merged task vector:", merged)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
matches_expected: True
merged task vector: [0.0, 1.1, 0.0, 0.75]
```
<!-- leetllm: output:end -->

TIES-Merging outperforms compared baselines in the paper's evaluated vision and T5 task-vector settings, and its analysis identifies sign interference.[^yadav2023] For our LLM trio, use it as a candidate when delta signs conflict. Keep plain task arithmetic in the comparison so any gain has a visible baseline.

### DARE (drop and rescale)

TIES chooses a direction among surviving updates. DARE asks a different question first: how many update entries need to survive at all? It randomly drops entries from each task vector and rescales the survivors before a downstream merge.[^yu2023] Rescaling preserves an entry's expected delta under the random mask; evaluate retained capabilities on held-out tasks.

#### Redundancy and parameter collision avoidance

DARE finds that many coordinates can be dropped from its evaluated SFT deltas while retaining useful performance. This shows empirical redundancy in the evaluated deltas. Low rank and tolerance to random coordinate dropping remain separate properties; test both on the target deltas.[^yu2023]

Consider a coordinate that is initially nonzero in two task vectors. If their masks independently drop entries with probability $p = 0.90$, the probability that both updates survive is:

$$
P(\text{collision at } j) = (1 - p)^2 = 0.10 \times 0.10 = 0.01 \quad (1\%)
$$

The denominator matters. Neither update survives with probability $p^2=81\%$, exactly one survives with probability $2p(1-p)=18\%$, and at least one survives with probability $19\%$. **Among active coordinates**, exactly one survives in $18/19\approx94.7\%$, and both survive in $1/19\approx5.3\%$. Two surviving updates do not necessarily disagree in sign. Dropping reduces overlap; it doesn't certify the absence of interference. Once the sparse delta is added to a dense base, the output model still has dense weights.

#### Expectation and variance scaling

To prevent the masked task vector from shrinking toward zero, DARE divides surviving parameters by their survival probability $1 - p$:

$$
\tau_i^{\text{DARE}} = \frac{\tau_i \odot m}{1 - p}
$$

where each keep-mask entry $m_j \sim \operatorname{Bernoulli}(1 - p)$. This rescaling guarantees that each coordinate remains mathematically unbiased in expectation:

$$
\mathbb{E}[\tau_j^{\text{DARE}}] = (1 - p) \cdot \left(\frac{\tau_j}{1 - p}\right) + p \cdot 0 = \tau_j
$$

However, unbiased expectation carries a variance penalty:

$$
\operatorname{Var}(\tau_j^{\text{DARE}}) = \mathbb{E}\left[(\tau_j^{\text{DARE}})^2\right] - (\mathbb{E}[\tau_j^{\text{DARE}}])^2 = (1-p)\left(\frac{\tau_j}{1-p}\right)^2 - \tau_j^2 = \frac{p}{1-p}\tau_j^2
$$

At $p = 0.90$, coordinate variance is $9\tau_j^2$; at $p = 0.99$, it is $99\tau_j^2$. The paper reports useful performance after dropping 99% of WizardMath-70B's delta entries, but also reports substantial AlpacaEval degradation for WizardLM-70B at 90% dropping.[^yu2023] Parameter count alone therefore doesn't determine a safe drop rate. DARE is a **sparsification preprocessor**, not a standalone merger: combine its sparse deltas with a downstream rule such as task arithmetic or TIES.

DARE's tested continued-pretraining deltas were larger and less tolerant of dropping than its SFT deltas.[^yu2023] Tune the density for each training regime. One candidate pipeline is **DARE-TIES**: randomly sparsify each delta, then resolve directional conflicts among survivors. Mergekit exposes `dare_ties`; random sparsification replaces magnitude trimming in that implementation, so it does not apply a second top-magnitude filter.[^mergekit2023]

```checkpoint
Why does DARE divide by $1-p$ after dropping weights?
---
Only a fraction $1-p$ of task-vector entries survive. Dividing by $1-p$ keeps each randomly masked delta entry unbiased in expectation; retained task quality still requires evaluation.
```

`dare_sparsify` applies a keep-mask and the $1/(1-p)$ rescale. DARE chooses its mask randomly; this example fixes the mask so you can check the arithmetic. With $p=0.5$, the last two entries survive and double: `0.1` becomes `0.2` and `0.6` becomes `1.2`.

<!-- leetllm: test, output=show -->
```python title="dare-drop-and-rescale-yu2023.py"
import math
from itertools import product


def dare_sparsify(
    task_vector: list[float],
    drop_rate: float,
    keep_mask: list[int],
) -> list[float]:
    keep_prob = 1.0 - drop_rate
    if not 0.0 < keep_prob <= 1.0:
        raise ValueError("drop_rate must be in [0, 1)")
    if len(keep_mask) != len(task_vector):
        raise ValueError("keep_mask must match task_vector")
    if not task_vector:
        raise ValueError("Need a nonempty task vector")
    if any(kept not in (0, 1) for kept in keep_mask):
        raise ValueError("keep_mask entries must be integer 0 or 1")
    return [
        value / keep_prob if kept else 0.0
        for value, kept in zip(task_vector, keep_mask)
    ]


task_vector = [0.2, -0.4, 0.1, 0.6]
sparsified = dare_sparsify(task_vector, drop_rate=0.5, keep_mask=[0, 0, 1, 1])
invalid_drop_rate_rejected = False
try:
    dare_sparsify(task_vector, drop_rate=1.0, keep_mask=[1, 1, 1, 1])
except ValueError as exc:
    invalid_drop_rate_rejected = "drop_rate" in str(exc)

print("shape_ok:", len(sparsified) == len(task_vector))
print("finite_ok:", all(value == value and abs(value) != float("inf") for value in sparsified))
print("matches_expected:", sparsified == [0.0, 0.0, 0.2, 1.2])
print("invalid_drop_rate_rejected:", invalid_drop_rate_rejected)
print("original nonzero:", sum(value != 0.0 for value in task_vector))
print("sparsified nonzero:", sum(value != 0.0 for value in sparsified))
print("sparsified:", sparsified)

# At p=0.5, all 16 masks are equally likely. Enumerate, do not sample.
outcomes = [dare_sparsify(task_vector, 0.5, list(mask))
            for mask in product((0, 1), repeat=4)]
mean = [sum(row[i] for row in outcomes) / len(outcomes) for i in range(4)]
mean_squared_norm = sum(sum(x*x for x in row) for row in outcomes) / len(outcomes)
print("mean_equals_original:", all(math.isclose(a, b) for a, b in zip(mean, task_vector)))
print("original_squared_norm:", round(sum(x*x for x in task_vector), 2))
print("mean_squared_norm:", round(mean_squared_norm, 2))

drop = 0.9
both, exactly_one = (1 - drop)**2, 2 * drop * (1 - drop)
print("exactly one among active (%):", round(100 * exactly_one / (1 - drop**2), 1))
print("both among active (%):", round(100 * both / (1 - drop**2), 1))

# Even one nonlinear unit does not necessarily preserve its expected output.
relu_outputs = [max(0, -0.75 + delta)
                for delta in (0.0, 2.0)]  # delta=1, p=0.5
print("original ReLU / expected masked ReLU:", 0.25, sum(relu_outputs) / 2)

# Emulate the pinned library's realized-L1 rescale on a two-entry tensor.
library_outcomes = []
for mask in product((0, 1), repeat=2):
    masked = [value * kept for value, kept in zip([1., 3.], mask)]
    norm = sum(abs(value) for value in masked)
    library_outcomes.append([value * 4 / norm for value in masked] if norm else masked)
print("realized-L1 mean delta:",
      [sum(row[i] for row in library_outcomes) / 4 for i in range(2)])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
shape_ok: True
finite_ok: True
matches_expected: True
invalid_drop_rate_rejected: True
original nonzero: 4
sparsified nonzero: 2
sparsified: [0.0, 0.0, 0.2, 1.2]
mean_equals_original: True
original_squared_norm: 0.57
mean_squared_norm: 1.14
exactly one among active (%): 94.7
both among active (%): 5.3
original ReLU / expected masked ReLU: 0.25 0.625
realized-L1 mean delta: [1.25, 1.75]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/dare_mask_expectation_dark.png" alt="A fixed DARE example starts with task delta [0.2, −0.4, 0.1, 0.6], uses drop probability 0.5 and mask [0,0,1,1], then rescales kept entries by two to get [0,0,0.2,1.2]. Across all sixteen equally likely masks, each coordinate expectation returns to its original delta." />
  <figcaption>The displayed mask is one of 16 equally likely outcomes. In expectation, each scaled coordinate returns to its input value; the realized update still varies from mask to mask.</figcaption>
</figure>

On the SFT models and tasks it evaluates, DARE finds substantial redundancy in task-vector entries and improves several downstream merge methods after drop-and-rescale preprocessing.[^yu2023] For a new checkpoint family, density remains a tuned parameter. Compare unsparsified and DARE-preprocessed candidates on every required task slice before deciding whether sparsity helped.

The first enumeration verifies the paper's unbiased delta, not an unbiased full-network output: even the single ReLU counterexample has expected output 0.625 instead of 0.25. The paper's expectation argument applies to a fixed linear transformation; composing nonlinear layers doesn't inherit that equality.[^yu2023]

At mergekit commit `9eeb539892c6753b032ea164e818b44a8c7a401b`, checked September 22, 2026, enabled rescaling restores the realized L1 norm of the masked tensor when both norms exceed its small-value cutoff. It doesn't apply the paper's fixed $1/(1-p)$. An all-zero mask stays zero. Our final enumeration emulates that rule: the mean delta is `[1.25, 1.75]`, not the original `[1, 3]`. It executes an authored calculation, not mergekit itself. The library's `dare_ties` defaults are `rescale: true` and `normalize: false`; record both.[^mergekit2026sparsify][^mergekit2026registry]

### SLERP (spherical linear interpolation)

SLERP follows an angular arc between normalized vector directions, while linear interpolation follows a straight chord. Finding a low-loss path around an incompatible-model ridge requires a separate search and evaluation.

#### When a linear midpoint contracts the norm

If two fine-tuned checkpoints share a base, that base can dominate their absolute-weight dot product. Model Soups analyzes angles between **fine-tuning deltas**; use those measurements to study delta relationships rather than infer orthogonality from absolute checkpoint weights.[^wortsman2022]

When you compute the linear midpoint $\theta_{\text{mid}} = \frac{1}{2}\theta_A + \frac{1}{2}\theta_B$ between two orthogonal vectors of equal norm $R$:

$$
\|\theta_{\text{mid}}\|^2 = \frac{\|\theta_A\|^2 + \|\theta_B\|^2 + 2(\theta_A \cdot \theta_B)}{4} \approx \frac{R^2 + R^2 + 0}{4} = \frac{R^2}{2} \implies \|\theta_{\text{mid}}\| \approx \frac{R}{\sqrt{2}} \approx 0.707 R
$$

The 29.3% contraction applies to this equal-norm, orthogonal pair. More generally, equal-norm endpoints at angle $\Omega$ have midpoint norm $R\sqrt{(1+\cos\Omega)/2}$. Nearby directions contract much less. Neither calculation establishes a particular change in transformer activations, attention, or task scores.

#### Geodesic interpolation on hyperspheres

SLERP[^shoemake1985] avoids norm contraction by interpolating along the great-circle arc (the geodesic on the hypersphere) with constant angular velocity:

$$
\Omega = \arccos\left(\frac{\theta_A \cdot \theta_B}{\|\theta_A\| \|\theta_B\|}\right)
$$

$$
\operatorname{SLERP}(\theta_A, \theta_B, t) = \frac{\sin((1-t)\Omega)}{\sin \Omega}\theta_A + \frac{\sin(t\Omega)}{\sin \Omega}\theta_B
$$

For nonzero endpoints and $0<\Omega<\pi$, $t$ sweeps from 0 to 1. When both endpoint norms equal $R$, the ideal arc has constant radius $R$. Unequal norms don't share one radius, and parallel, antipodal, or zero-vector cases require a separate convention.

SLERP was introduced for computer graphics to interpolate rotations represented as quaternions.[^shoemake1985] That source establishes its geometry, not downstream quality for neural-network weight merges. Use a SLERP checkpoint as another candidate and measure loss and required tasks just as you would for a linear merge.

The helper below follows mergekit's angular-coefficient convention: compute the angle from normalized vectors, then apply coefficients to the original vectors.[^mergekit2026slerp] Nearly parallel or opposite directions use a linear fallback at `abs(dot) > 0.9995`. Exactly opposite unit vectors have no unique shortest arc; this fallback returns zero at their midpoint. Our explicit zero-vector linear fallback is a teaching choice and differs from the pinned library's small-norm handling. Mergekit applies its method to individual weight tensors; it doesn't construct a single geodesic for the entire flattened model.

For equal-norm vectors `[1, 0]` and `[0, 1]`, a linear midpoint is `[0.5, 0.5]` with norm approximately `0.707`; SLERP lands at `[0.707, 0.707]` with norm `1.0`, preserving vector length along the unit circle.

<figure>
  <img src="illustrations/_generated/slerp_geometry_dark.png" alt="On equal-scale axes, the vectors (1,0) and (0,1) lie on the unit circle. Their chord midpoint is (0.5,0.5), with norm 0.7071; the SLERP midpoint is approximately (0.7071,0.7071), with norm 1. The constructed vectors show how the two paths differ." />
  <figcaption>Equal-norm endpoints make the difference visible: the straight chord contracts, while the unit-circle arc keeps radius 1.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="slerp-spherical-linear-interpolation.py"
import math


def slerp(v0: list[float], v1: list[float], t: float) -> list[float]:
    def magnitude(vector: list[float]) -> float:
        return math.hypot(*vector)

    if not v0 or len(v0) != len(v1):
        raise ValueError("Vectors must have equal nonzero length")
    if not (0.0 <= t <= 1.0):
        raise ValueError("Need t in [0, 1]")

    mag0 = magnitude(v0)
    mag1 = magnitude(v1)
    if mag0 == 0.0 or mag1 == 0.0:
        return [(1 - t) * a + t * b for a, b in zip(v0, v1)]

    d0 = [value / mag0 for value in v0]
    d1 = [value / mag1 for value in v1]
    dot = max(-1.0, min(1.0, sum(a * b for a, b in zip(d0, d1))))
    omega = math.acos(dot)
    sin_omega = math.sin(omega)
    if abs(dot) > 0.9995:
        return [(1 - t) * a + t * b for a, b in zip(v0, v1)]

    w0 = math.sin((1 - t) * omega) / sin_omega
    w1 = math.sin(t * omega) / sin_omega
    return [w0 * a + w1 * b for a, b in zip(v0, v1)]


v0 = [1.0, 0.0]
v1 = [0.0, 1.0]
mid = slerp(v0, v1, t=0.5)
antipodal_mid = slerp(v0, [-value for value in v0], t=0.5)
expected = 2**-0.5

print("unit_norm:", abs(math.sqrt(sum(x * x for x in mid)) - 1.0) < 1e-6)
print("matches_45_degree:", all(abs(a - b) < 1e-6 for a, b in zip(mid, [expected, expected])))
print("antipodal_fallback_finite:", all(abs(value) < 1e-6 for value in antipodal_mid))
print("antipodal_midpoint:", antipodal_mid)
print("unequal_norm_midpoint:", [round(v, 4) for v in slerp(v0, [0.0, 2.0], 0.5)])
print("midpoint:", [round(value, 4) for value in mid])
print("norm:", round(math.sqrt(sum(x * x for x in mid)), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unit_norm: True
matches_45_degree: True
antipodal_fallback_finite: True
antipodal_midpoint: [0.0, 0.0]
unequal_norm_midpoint: [0.7071, 1.4142]
midpoint: [0.7071, 0.7071]
norm: 1.0
```
<!-- leetllm: output:end -->

In the equal-norm orthogonal-vector example above, the SLERP midpoint remains on the unit circle while a linear midpoint would have smaller norm. Geometry explains the candidate's path. Task and safety evaluations decide whether it ships. For a pair of checkpoints, score linear and spherical candidates against the same release gates.

The winner is still a recipe, not a file. How do you apply it without averaging every tensor by hand?

## Running a merge with mergekit

Turn a measured path into one checkpoint. `mergekit`[^mergekit2023] is an open-source toolkit for merging language-model checkpoints. Its documented CLI supports YAML-defined merges with CPU or limited-VRAM execution, and `mergekit-multi` can run multi-stage recipes where later merges consume earlier outputs.[^mergekit2023]

Carry the trio into a YAML recipe. The names below are placeholders, not downloadable models. Replace them with authorized checkpoints from a verified shared base and pin model revisions plus the mergekit package version or source commit in the run manifest. Record licenses, tokenizer files, template, random seed, dtype, and evaluation IDs alongside the output. No model download or full-model merge is needed to run this lesson's CPU examples.

```yaml title="merge_config.yml"
models:
  - model: your-org/base-8b-code
    parameters:
      weight: 0.35
      density: 0.5       # retained fraction for this task vector
  - model: your-org/base-8b-math
    parameters:
      weight: 0.35
      density: 0.5
  - model: your-org/base-8b-chat
    parameters:
      weight: 0.30
      density: 0.5

merge_method: dare_ties
base_model: your-org/base-8b
tokenizer:
  source: base           # switch to union if you must preserve extra tokens
chat_template: auto      # selects the most common input template; audit the result
parameters:
  normalize: true        # explicit weighted mean among sign-aligned survivors
  rescale: true          # pinned implementation uses realized-L1 rescaling
  lambda: 1.0            # scale the combined delta before adding it to the base
dtype: float32           # cast input tensors for merging; budget RAM/VRAM
out_dtype: bfloat16      # cast the output afterward; evaluate this saved artifact
```

For `dare_ties`, `density = 1 - p` is the keep probability. The pinned implementation applies source weights **before sign election**, chooses positive on a zero signed sum, and, with `normalize: true`, divides by the weights of the aligned contributors. These conventions differ from our unweighted TIES helper's zero-sum policy. The global `lambda` then scales the combined delta.[^mergekit2026taskarithmetic][^mergekit2026registry]

`dtype` casts inputs for merging; `out_dtype` casts the output afterward. Some methods use wider intermediates, so peak memory also depends on method-specific temporaries. Pairwise `slerp` requires exactly two total input models, including its designated base. The separately named Multi-SLERP method has a different multi-input construction.[^mergekit2026guide] `chat_template: auto` picks the most common input template; inspect and pin it, and align prompt formats before merging.

Input and output precision also change the arithmetic. Bfloat16 has seven stored fraction bits: the next representable value above `1.0` is `1.0078125`.[^googleBfloat162026] Consider a specialist weight of `1.002` and its halfway merge with base `1.0`. Casting the specialist to bfloat16 first erases this delta. Computing the merge in float32 preserves `1.001` internally, but saving that result in bfloat16 erases the change too.

<!-- leetllm: test, deps=torch, output=show, output_title="Merge precision check" -->
```python title="merge-before-or-after-rounding.py"
import torch

base = torch.tensor([1.0], dtype=torch.float32)
specialist = torch.tensor([1.002], dtype=torch.float32)
wide_merge = base + 0.5 * (specialist - base)
rounded_inputs_merge = base + 0.5 * (
    specialist.to(torch.bfloat16).float() - base.to(torch.bfloat16).float()
)
saved_merge = wide_merge.to(torch.bfloat16).float()
step_above_one = torch.finfo(torch.bfloat16).eps

assert float(wide_merge) > 1.0
assert torch.equal(rounded_inputs_merge, base) and torch.equal(saved_merge, base)
print(f"bf16 step above 1={step_above_one:.7f}")
print(f"float32 halfway merge={float(wide_merge):.6f}")
print(f"round inputs before merging={float(rounded_inputs_merge):.6f}")
print(f"round merged output to bf16={float(saved_merge):.6f}")
```

<!-- leetllm: output:start -->
```text title="Merge precision check" output compact
bf16 step above 1=0.0078125
float32 halfway merge=1.001000
round inputs before merging=1.000000
round merged output to bf16=1.000000
```
<!-- leetllm: output:end -->

This example tracks one coordinate through a precision change. Representable spacing depends on magnitude, and task sensitivity depends on the model. A float32 cast can't reconstruct information already lost in a low-precision source. Measure candidate quality on the saved and reloaded output dtype, and retain adapter deltas separately when that is the artifact your serving path actually applies.

### The tokenizer alignment invariant

Tokenizer choice changes the output contract. In language models, parameter tensors have no intrinsic concept of letters or words: matrix row $k$ in the embedding layer $W_{\text{emb}}$ and language model head $W_{\text{head}}$ maps strictly to vocabulary index $k$.

If checkpoints disagree on vocabulary indices, direct row averaging blends unrelated symbols. The pinned mergekit tokenizer pipeline maps token strings to each source's IDs and aligns vocabulary-axis tensors to the output vocabulary. This includes input embeddings, output heads, and supported output biases; selecting the base vocabulary doesn't merely assume every source already has the base's row IDs.[^mergekit2026vocabulary]

- `tokenizer.source: base` selects the base vocabulary. Added specialist tokens outside it are omitted, which can break prompts or behaviors that depend on them.
- `tokenizer.source: union` retains the base tokenization pipeline and adds missing token strings. It doesn't reconcile arbitrary differences in normalization, segmentation, or added-token attributes.

For a missing embedding, the documented fallback uses the base's row when available, otherwise the sole available donor, otherwise the average of available donors. The implementation can use zeros when no donor supplies a valid row. These are copied or combined values, not necessarily randomly initialized “untrained embeddings.” They still need evaluation in the merged model.[^mergekit2026guide][^mergekit2026embeddings]

<figure>
  <img src="illustrations/_generated/tokenizer_row_alignment_dark.png" alt="Two tokenizer vocabularies can assign different strings to integer ID 417: one maps it to return and another to a newly added code token named fim_prefix. A union output vocabulary aligns embedding and language-model-head rows by token string. The rows for missing tokens require the configured fallback and evaluation; the diagram specifies no output-ID order." />
  <figcaption>Integer IDs belong to a tokenizer. Match strings before aligning vocabulary-axis embedding and output-head rows; inspect any fallback rows in the resulting model.</figcaption>
</figure>

Check actual tokenizer artifacts and all affected vocabulary-axis tensors before choosing a policy. The pinned loader can warn and assume the base tokenizer when an input tokenizer fails to load. Inspect those warnings; an assumed tokenizer isn't evidence of compatibility. Non-vocabulary dimensions must still be compatible.

A written checkpoint is still a candidate. Run the YAML through `mergekit-yaml`, score every required slice, and promote only after all gates pass.

> **⚠️ Common mistake:** Assuming all specialist checkpoints use the same tokenizer because they began from the same base. If the Code checkpoint added fill-in-the-middle tokens such as `<fim_prefix>`, choosing `base` drops those added output entries while choosing `union` introduces filled embeddings for models that lack them. Verify tokenizer vocabularies, choose the output policy explicitly, and test code-completion prompts that require those tokens.

This set-based sketch checks token-string coverage only. It can't check token IDs, segmentation, added-token attributes, embedding rows, or output-head alignment. Inspect and test the actual tokenizer artifacts before merging:

<!-- leetllm: test, output=show -->
```python title="choose-output-vocabulary-policy.py"
def output_vocab(base_vocab, source_vocabs, policy):
    if policy == "base":
        return set(base_vocab)
    if policy == "union":
        return set(base_vocab).union(*source_vocabs)
    raise ValueError("policy must be 'base' or 'union'")

base_vocab = {"<bos>", "def", "return"}
code_vocab = base_vocab | {"<fim_prefix>"}
required_tokens = {"def", "<fim_prefix>"}

base_output = output_vocab(base_vocab, [base_vocab, code_vocab], "base")
union_output = output_vocab(base_vocab, [base_vocab, code_vocab], "union")

print("base_missing_required:", sorted(required_tokens - base_output))
print("union_missing_required:", sorted(required_tokens - union_output))
print("union_requires_added_embedding_eval:", "<fim_prefix>" not in base_vocab)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
base_missing_required: ['<fim_prefix>']
union_missing_required: []
union_requires_added_embedding_eval: True
```
<!-- leetllm: output:end -->

After validating the real inputs, the command below would write a new model directory. It isn't part of the local teaching checks. Omit `--cuda` for CPU execution; CPU merging still needs enough RAM and disk for the chosen checkpoints:

```bash title="terminal"
mergekit-yaml merge_config.yml ./output_model --cuda --random-seed 42
```

For hardware-specific and memory-saving flags, check `mergekit-yaml --help` because supported options vary by version.[^mergekit2023]

### Per-task binding release gates

A successful write to disk proves that the recipe executed and matrix operations completed. It says nothing about whether Code, Math, or Chat capabilities survived.

A pervasive trap in model evaluation is relying on **macro-average metrics**. In our synthetic evaluation:
$$
\text{Macro Average} = \frac{92.4 + 82.1 + 87.0}{3} = 87.17\% \approx 87.2\%
$$
On an overall dashboard, an 87.2% macro-average looks like an unqualified victory. But when you inspect the individual slice gates:
- Code scores 92.4% against a 90.0% threshold (PASS).
- Chat scores 87.0% against an 84.0% threshold (PASS).
- Math scores 82.1% against an 85.0% threshold (FAIL by 2.9 pp).

In this release policy, each declared critical gate is binding. We also set a maximum regression of **1 percentage point** relative to the relevant source specialist. Set production margins using task stakes, baseline uncertainty, and product requirements. Passing an absolute threshold does not imply passing a regression check.

<figure>
  <img src="illustrations/_generated/merge_validation_loop_dark.png" alt="Evaluation gives Code 92.4, Math 82.1, and Chat 87.0, with absolute floors 90, 85, and 84 and source-regression floors 92, 87, and 86.5. Math misses both checks, so the 87.2 macro average does not pass the binding per-task release policy." />
  <figcaption>The macro average weights each task equally, not each evaluated example. It can't override the binding Math gate.</figcaption>
</figure>

Does an 87.2 aggregate outweigh Math's 82.1? No. An aggregate ranks candidates, but a release decision fails on any critical threshold miss:

<!-- leetllm: test, output=show -->
```python title="evaluate-per-task-release-gates.py"
import math


def failed_release_gates(scores, thresholds, source_scores=None, max_regression_pp=None):
    if not thresholds:
        raise ValueError("No release gates configured")
    if any(not (0 <= v <= 100) for v in thresholds.values()):
        raise ValueError("Thresholds must be percentages between 0 and 100")
    if (source_scores is None) != (max_regression_pp is None):
        raise ValueError("Supply both source scores and a regression margin")
    if max_regression_pp is not None and max_regression_pp < 0:
        raise ValueError("Regression margin must be nonnegative")

    def fails(task, minimum):
        candidate = scores.get(task)
        if candidate is None or not (minimum <= candidate <= 100):
            return True
        if source_scores is None:
            return False  # Absolute thresholds only when no baseline policy is supplied.
        source = source_scores.get(task)
        return (source is None or not (0 <= source <= 100)
                or source - candidate > max_regression_pp)

    return {
        task: (scores.get(task), minimum)
        for task, minimum in thresholds.items()
        if fails(task, minimum)
    }

scores = {"code": 92.4, "math": 82.1, "chat": 87.0}
thresholds = {"code": 90.0, "math": 85.0, "chat": 84.0}
source_scores = {"code": 93.0, "math": 88.0, "chat": 87.5}
failures = failed_release_gates(scores, thresholds, source_scores, max_regression_pp=1.0)

print("aggregate_score:", round(sum(scores.values()) / len(scores), 1))
print("failed_tasks:", sorted(failures))
print("promote:", not failures)
print("missing_blocks:", bool(failed_release_gates({}, thresholds)))
print("nan_blocks:", bool(failed_release_gates({"math": float("nan")}, {"math": 85.0})))
print("absolute_pass_can_still_regress:", bool(failed_release_gates(
    {"code": 91.5}, {"code": 90.0}, {"code": 93.0}, max_regression_pp=1.0)))
print("missing_baseline_blocks:", bool(failed_release_gates(
    {"code": 92.4}, {"code": 90.0}, {}, max_regression_pp=1.0)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
aggregate_score: 87.2
failed_tasks: ['math']
promote: False
missing_blocks: True
nan_blocks: True
absolute_pass_can_still_regress: True
missing_baseline_blocks: True
```
<!-- leetllm: output:end -->

## Finding good coefficients automatically

The blocked Math slice gives coefficient search a concrete objective. Searching merge coefficients and layer selections by hand can be expensive. **Evolutionary model merging**[^sakana2024] searches merge recipes against a supplied fitness evaluation. The search space can include per-layer source choices, interpolation weights, and whether to merge in parameter space, data-flow space, or both.

Sakana AI's 2024 work uses CMA-ES, which adapts a sampling distribution over recipes. Its parameter-space search optimizes per-layer DARE-TIES settings; its data-flow search selects and scales paths through source layers. The original EvoLLM-JP experiment uses translated GSM8K examples for search and disjoint MGSM examples for final evaluation.[^sakana2024][^akiba2024merging] These are historical experiments; the search consumes compute and inherits its objective's coverage and blind spots.

Before reaching for evolution, use a small grid as a transparent baseline. Four coefficient choices for each of three task vectors already require $4^3=64$ candidates. Select on validation slices covering code generation, math, and instruction following, then run the selected candidate on untouched release data. Repeatedly tuning against the final release set turns it into another validation set. Compare source baselines and report slice denominators and uncertainty, not only point scores.

Coefficient search still assumes you are blending parameters. What if the recipe copies whole layer ranges instead?

## Passthrough and frankenmerging

Mergekit supports weight averaging and model splicing. Its `passthrough` method copies selected tensors or layer ranges from source models into the output checkpoint.[^mergekit2023] Tensor dimensions must compose, and held-out evaluation measures behavior across the splice.

Suppose a recipe copies layers `0-19` from Code and layers `20-31` from Math. Compatible dimensions make that artifact constructible; they don't show that Math's later layers can interpret the hidden states produced by Code's earlier layers.

Use passthrough as an experiment with explicit source lineage, layer boundaries, and the same per-task gates used for any other candidate. A successful build proves shape compatibility only.

## Merging pitfalls and hard limits

Direct weight merging requires aligned parameter meaning, shape, and output-space assumptions. A 7-billion-parameter checkpoint and a 70-billion-parameter checkpoint have incompatible tensor shapes; vocabulary mappings also need to align before token IDs can be treated as equivalent. Evaluate each generated artifact for retained quality.

Use these stop signs before spending time tuning coefficients. Some block construction; others block release even when construction and average quality look good.

Avoid direct interpolation when:

1.  **Incompatible tensor roles or layouts**: Corresponding tensors need matching shapes and architectural meaning, including layer layout and attention configuration. A model-family name or equal parameter count isn't a sufficient check. Direct coordinate-wise interpolation can't pair an 8B model's tensors with unrelated 70B tensors.
2.  **Different tokenizers**: Direct interpolation assumes aligned embeddings and next-token heads. Mergekit can help with tokenizer union in compatible cases, but it doesn't make arbitrary vocabulary mismatches disappear.[^mergekit2023]
3.  **Mismatched prompt formats or <span data-glossary="chat-template">chat templates</span>**: These usually won't block the raw tensor merge, but they can make the merged checkpoint look broken at inference time because the prompt serialization no longer matches the behaviors learned during tuning.
4.  **<span data-glossary="quantization">Quantized</span>-only checkpoints**: Prefer original floating-point weights for these recipes, then quantize and evaluate the final artifact. Dequantization recovers an approximation, not the original unrounded weights. A specialized tool may support other workflows, but directly adding packed integer representations doesn't implement the real-valued delta equations above. Treat the merged checkpoint as a new model and re-run quantization <span data-glossary="calibration">calibration</span> and evals.
5.  **Distant fine-tuning trajectories**: Models fine-tuned on divergent data or with large update magnitudes may be poor interpolation candidates. Git Re-Basin demonstrates permutation alignment in studied MLP, CNN, and ResNet settings; it isn't an established repair step for arbitrary LLM merges.[^ainsworth2022]
6.  **Critical precision tasks**: Don't ship a merge when a required slice misses its threshold, even if an aggregate metric rises. A specialist baseline remains part of the comparison.

### Diagnosing a broken merge

Diagnose in order. First verify the artifact contract: keys, shapes, tokenizer, output head, and chat template. Then compare behavior with source baselines on each task slice. Only after those checks should you tune coefficients or choose another merge rule.

When a merge goes wrong, the model usually tells you quickly:

| Symptom | Possible Causes | Next Check |
|---|---|---|
| Output is incoherent or random tokens | Tokenizer/output mapping, prompt template, or architecture mismatch | Verify output vocabulary policy, chat template, and layer shapes |
| Model loops repetitive text | Prompt serialization, decoding/runtime issues, or harmful parameter interference | Compare source and merged models with the same audited template and decoder; then test a small coefficient grid |
| Merged model is worse than every source | Source interference or incompatible lineage | Check source lineage and tokenizer policy; prefer compatible sources and retune or reject the merge |

The original Model Soups gains in shared-initialization ImageNet experiments justify trying an average. They don't predict that this Code, Math, and Chat merge will pass.[^wortsman2022] Promotion still requires a clean artifact, retained behavior, and every binding gate.

A passing endpoint is not yet a safe midpoint, and an average score can hide a failed slice. Retrieval still has to supply the evidence those weights don't store.

```mastery-quiz
[
  {
    "question": "Two checkpoints have equal tensor shapes and output vocabulary. One was initialized independently and its hidden units were reordered. Which next step is justified?",
    "options": [
      "Directly average because equal shapes establish matching learned roles.",
      "Inspect lineage and functional alignment before treating matching tensor indices as comparable.",
      "Copy one tokenizer because vocabulary choice recovers hidden-unit order.",
      "Raise the interpolation coefficient because larger weights undo permutations."
    ],
    "answer": "Inspect lineage and functional alignment before treating matching tensor indices as comparable.",
    "explanation": "Shape and vocabulary agreement do not establish internal coordinate alignment. Lineage and functional tests address the hidden-unit mismatch; token rows and scale do not recover its permutation."
  },
  {
    "question": "Both endpoint checkpoints pass evaluation, but the midpoint of their linear interpolation fails badly. What does that result establish?",
    "options": [
      "The endpoints are incompatible despite matching lineage and shapes, so tokenizer repair should precede any path evaluation.",
      "Evaluate intermediate points because quality can vary along the path even when both endpoints pass.",
      "The lower-scoring endpoint should be removed from the merge set, because endpoint quality determines every interior point.",
      "The interpolation should be renormalized toward the midpoint, because coefficients summing to one guarantee path quality."
    ],
    "answer": "Evaluate intermediate points because quality can vary along the path even when both endpoints pass.",
    "explanation": "Weight-space geometry can pass through a poor region even when both endpoints work. Measure quality at intermediate points because endpoint scores do not determine the path."
  },
  {
    "question": "A base coordinate is 4.0. Two specialists have values 4.8 and 3.4. Their delta coefficients are 0.5 and 0.25. What merged coordinate follows?",
    "options": [
      "4.25",
      "3.25",
      "4.55",
      "4.10"
    ],
    "answer": "4.25",
    "explanation": "The specialists moved the coordinate by +0.8 and -0.6. Adding their scaled changes to the base gives 4.0 + 0.5 × 0.8 - 0.25 × 0.6 = 4.25. Weighting the endpoints directly gives 3.25 and omits the remaining 0.25 × 4.0 of the base. Reversing the second change gives 4.55. Averaging the endpoints equally gives 4.10."
  },
  {
    "question": "At one coordinate after TIES trimming, three surviving updates are +1.6, -0.5 and -0.6. Which direction and disjoint mean follow under the article rule?",
    "options": [
      "Negative direction and -0.55 mean, because two signs are negative.",
      "Positive direction and +0.1667 mean, because all entries stay in the divisor.",
      "Positive direction and +1.6 mean, because the signed sum is +0.5.",
      "Negative direction and -1.1 mean, because opposite signs must be removed first."
    ],
    "answer": "Positive direction and +1.6 mean, because the signed sum is +0.5.",
    "explanation": "The signed sum 1.6-0.5-0.6 is +0.5. Only +1.6 aligns, so the disjoint mean is +1.6. Counting signs or averaging misaligned values changes the rule."
  },
  {
    "question": "A DARE entry originally equals -0.3 and is dropped with probability 0.75. Which surviving value preserves its signed expectation?",
    "options": [
      "-0.3, because random masks preserve scale without rescaling.",
      "-0.075, because the original should be multiplied by survival probability.",
      "+1.2, because magnitude is preserved while signs are discarded.",
      "-1.2, because it survives with probability 0.25."
    ],
    "answer": "-1.2, because it survives with probability 0.25.",
    "explanation": "A survivor is -0.3/0.25=-1.2. Its expectation is 0.25(-1.2)+0.75(0)=-0.3. The random realization and its variance still differ from the original."
  },
  {
    "question": "A SLERP merge has a smooth constant-radius path but lower coding accuracy than linear interpolation. What should be concluded?",
    "options": [
      "Prefer SLERP because constant norm is the binding merge gate, then defer coding regression to task-specific fine-tuning.",
      "SLERP sets a geometric path on the sphere. Keep the method that passes task evaluation.",
      "Treat the lower score as evidence of tokenizer incompatibility, without checking whether linear and spherical paths differ in task interference.",
      "Extrapolate beyond the endpoint angle and select by geometric smoothness before rerunning coding evaluation."
    ],
    "answer": "SLERP sets a geometric path on the sphere. Keep the method that passes task evaluation.",
    "explanation": "SLERP changes interpolation geometry. Geometry can be useful, but quality remains an empirical property requiring task and safety evaluation."
  },
  {
    "question": "The Base tokenizer assigns 'yield' ID 621. The Code tokenizer assigns 'yield' ID 84 and uses ID 621 for a fill-in-the-middle marker that Base lacks. The tokenizers are otherwise compatible. The serving template needs the marker as one special token. Which Code rows should you pair with Base row 621, and how should you handle the marker?",
    "options": [
      "Use Code input row 621 and head row 621. Split the marker into ordinary tokens and test the serving template.",
      "Use Code input row 84 and head row 84. Keep the marker as a special token and test the serving template.",
      "Use Code input row 84 and head row 621. Keep the marker as a special token and test the serving template.",
      "Use Code input row 84 and head row 84. Split the marker into ordinary tokens and test the serving template."
    ],
    "answer": "Use Code input row 84 and head row 84. Keep the marker as a special token and test the serving template.",
    "explanation": "For 'yield', Base row 621 matches Code row 84 in both the input embeddings and the output head. Pairing by ID mixes 'yield' with the marker. Fixing just the input row still mixes those meanings in the head. Keep both strings in the output vocabulary and use Code's rows for the marker. Test a prompt with the saved tokenizer and template. Splitting the marker changes the input the template requires."
  },
  {
    "question": "A merge raises the average task score from 88.0% to 91.0%. On the same math cases, the merge scores 88.6% and the specialist scores 89.8%. Release requires at least 89.0% on math and allows a loss of up to 1.5 percentage points against the specialist. All other checks pass. Which release decision follows?",
    "options": [
      "Promote. The 3.0-point gain in the task average offsets the 0.4-point shortfall on math.",
      "Hold. Math is 2.4 points below the new task average, beyond the 1.5-point allowance.",
      "Promote. Applying the 1.5-point allowance to the math floor lowers the minimum to 87.5%.",
      "Hold. Math clears the specialist minimum of 88.3% but misses the 89.0% floor."
    ],
    "answer": "Hold. Math clears the specialist minimum of 88.3% but misses the 89.0% floor.",
    "explanation": "Math needs at least 89.0% and scored 88.6%, so the floor blocks release. The specialist check also applies. Its minimum is 89.8% - 1.5 points = 88.3%, which the merge clears. Subtracting the allowance from the absolute floor relaxes the wrong limit. The task average can neither offset the missed floor nor serve as the baseline for the specialist check."
  },
  {
    "question": "Two initially nonzero deltas are independently dropped with probability 0.8 each. Among draws in which at least one delta survives, what percentage keep both? Round to one decimal place.",
    "options": [
      "4.0%",
      "20.0%",
      "11.1%",
      "64.0%"
    ],
    "answer": "11.1%",
    "explanation": "Each delta survives in 20% of draws. Both survive in 0.2 × 0.2 = 4% of all draws. Both drop in 0.8 × 0.8 = 64%, leaving 36% of draws with at least one survivor. Among those active draws, the share that keep both is 4/36, or about 11.1%."
  },
  {
    "question": "Each of three rank-one adapters changes just one entry of the same weight matrix. The entries occupy three different positions on the main diagonal, and each adapter has a nonzero scale. Which construction can represent their sum exactly?",
    "options": [
      "Concatenate their weighted factors, allowing rank up to three.",
      "Average the three A factors and three B factors separately at rank one.",
      "Keep the adapter with the largest scale and discard the other directions.",
      "Truncate the sum to rank one, retaining exactness because each source was rank one."
    ],
    "answer": "Concatenate their weighted factors, allowing rank up to three.",
    "explanation": "The three changed columns each point along a different coordinate axis, so the sum has rank three. Put the scaled B columns side by side and stack their matching A rows. Multiplying these factors adds the three original updates. Averaging the factors separately mixes rows and columns from different adapters. Keeping one adapter drops two changed entries. Rank-one truncation loses two independent directions."
  }
]
```

> **Next:** Continue to [Vector DB Internals: HNSW & IVF](/learn/vector-database-internals-hnsw-ivf). Training, adaptation, distillation, and merging sit under per-task gates. The next phase is the systems around those models, starting with retrieval indexes: <span data-glossary="hnsw">HNSW</span>, IVF, and <span data-glossary="product-quantization">Product Quantization</span> decide which evidence reaches a merged assistant under latency and memory limits.
