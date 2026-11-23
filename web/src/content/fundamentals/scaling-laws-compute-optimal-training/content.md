---
{
  "id": "scaling-laws-compute-optimal-training",
  "title": "Scaling Laws & Compute-Optimal Training",
  "slug": "scaling-laws-compute-optimal-training",
  "section": "Advanced Training & Adaptation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "prerequisites": [
    "decoding-strategies-greedy-beam-nucleus"
  ],
  "coverImage": "illustrations/_generated/scaling_curves_dark.png",
  "companies": [
    "Google DeepMind",
    "OpenAI",
    "Meta",
    "Anthropic",
    "Microsoft"
  ],
  "shortDescription": "Kaplan, Chinchilla, and later inference-aware fits split a training budget between parameters and tokens, including when a smaller model wins on lifetime cost.",
  "order": 1,
  "keyConceptsTested": [
    "Kaplan scaling laws (parameters vs. data vs. compute)",
    "Chinchilla-optimal training (Hoffmann et al.)",
    "Compute-optimal model sizing",
    "6ND training-compute heuristic",
    "Inference-cost-aware scaling",
    "Over-training and under-training regimes",
    "The data wall and finite public-text availability",
    "Test-time compute as a new scaling axis",
    "Scaling law extrapolation for new architectures"
  ]
}
---

Suppose a training run has a fixed budget of $10^{24}$ floating-point operations (FLOPs). One proposal invests that budget in a very large model trained over a relatively small dataset, while an alternative trains a compact model over many more tokens. Choosing between them depends directly on the deployment objective. A parameter-heavy model can burn compute inefficiently when token budgets are small, whereas a smaller model may keep improving with extra data yet plateau above the lowest cross-entropy loss attainable at that same compute budget. Even when a compact overtrained model misses the training-compute optimum, it can still dominate on lifetime serving cost because "not training-optimal" never means "no longer learning."

<span data-glossary="scaling-law">Scaling laws</span> formalize these trade-offs by fitting empirical power laws to <span data-glossary="cross-entropy">cross-entropy</span> loss as a function of compute, parameter count, and dataset size. Their predictions remain reliable only inside the data distribution, architecture family, training recipe, and scale range over which they were checked. Kaplan et al.'s 2020 study favored scaling model capacity rapidly with compute,[^kaplan2020] whereas Hoffmann et al.'s 2022 <span data-glossary="chinchilla-scaling">Chinchilla study</span> found that parameters and tokens should scale in near-equal proportions.[^hoffmann2022] Subsequent analyses resolved why those two fits diverged and extended the optimization target to include downstream inference demand.[^porian2024][^sardana2024] Later long-horizon runs such as Llama 3 demonstrate sustained gains from massive token volumes across multiple model sizes, even though any single open-weights release reflects product and serving constraints rather than a universal ratio.[^dubey2024] Every scaling fit relies on three core quantities defined carefully before comparing runs:

- **Parameters ($N$)**: A declared weight count. Verify whether a paper includes <span data-glossary="embedding">embedding</span> and output-projection weights. Tying those weights changes storage, but the vocabulary projection still costs arithmetic. Assess useful capacity through task quality at a stated compute budget, alongside parameter count.
- **Training tokens ($D$)**: The number of <span data-glossary="subword-tokenization">subword</span> token presentations processed during training, usually grouped into batches for updates. Distinguish this from unique corpus size. Repeated presentations can help, yet a fit calibrated on fresh tokens does not automatically generalize to multi-epoch training.
- **Compute ($C$)**: A stated training-FLOP budget or estimate. Distinguish useful model arithmetic, recomputation, accelerator peak capacity, elapsed time, and dollars.

### The first-principles derivation of 6ND

Dense transformer training follows a compact arithmetic shortcut: $C \approx 6ND$ FLOPs. The factor of 6 arises directly from counting the large matrix multiplications inside the forward pass and backpropagation. For a batch of hidden activations $X$ passing through a dense weight matrix $W \in \mathbb{R}^{d_{\text{in}} \times d_{\text{out}}}$, the forward projection computes $Y = XW$. Counting one multiply and one add per inner product element gives $2 d_{\text{in}} d_{\text{out}}$ FLOPs per token per parameter pair, omitting the final scalar bias or reduction details, so summing across all counted weights yields:

$$
C_{\text{forward}} \approx 2N \text{ FLOPs per token}
$$

Backpropagation through each trainable dense matrix reverses that path. It splits into two equally expensive matrix multiplications per token. Both contractions are counted before optimizer updates adjust any weights:

1. **Activation gradients**: $\nabla_X L=(\nabla_Y L)W^T$, approximately another $2N$ FLOPs per token across the counted matrices.
2. **Weight gradients**: $\nabla_W L=X^T(\nabla_Y L)$, approximately another $2N$ FLOPs per token, including accumulation over the batch.

Summing the activation gradients ($2N$) and weight gradients ($2N$) yields $4N$ FLOPs per token for the backward pass alone. Adding the forward pass ($2N$) gives $6N$ FLOPs per token in total. Multiplying that per-token cost across $D$ token presentations yields the canonical training compute proxy:

$$
C_{\text{backward}} \approx 4N \text{ FLOPs per token}, \qquad C_{\text{train}} \approx 6ND \text{ FLOPs}
$$

When <span data-glossary="activation-checkpointing">activation checkpointing</span> discards intermediate activations during the forward pass, backpropagation must recompute one full forward pass on the fly. That recomputation raises the training compute factor from $6ND$ to approximately $8ND$, while selective checkpointing lands in between. During autoregressive inference there is no backward pass at all, so the dense-projection proxy drops to $2N$ FLOPs per generated or prefill token.

All of these linear-layer proxies omit attention query-key and value-weighted contractions, nonlinearities, layer normalizations, and optimizer overhead. At long sequence lengths, quadratic attention work becomes substantial, and at small parameter counts omitting the vocabulary output head distorts FLOP comparisons across tokenizers.[^porian2024] Moreover, raw FLOP counts never uniquely dictate decode wall-clock latency, which is frequently bottlenecked by high-bandwidth memory traffic rather than arithmetic throughput. To see the baseline scaling arithmetic concretely, training a 1-billion-parameter dense model on 20 billion tokens requires roughly $6 \times (1 \times 10^9) \times (20 \times 10^9) = 1.2 \times 10^{20}$ FLOPs, and doubling both model size and data volume quadruples total compute to $4.8 \times 10^{20}$ FLOPs.

## Double parameters, double data, or both

Consider four benchmark measurements collected under a consistent tokenizer, data mixture, and validation split. Starting from a 1-billion-parameter baseline trained on 10 billion tokens, we scale along each axis independently and together. The three follow-up runs double parameter count, double dataset size, or double both simultaneously:

| Experiment | Parameters ($N$) | Tokens ($D$) | Relative compute ($6ND$) | Cross-entropy loss (nats) |
|---|---|---|---|---|
| Baseline | 1B | 10B | 1x | 2.80 |
| Double model size | 2B | 10B | 2x | 2.60 |
| Double data | 1B | 20B | 2x | 2.55 |
| Double both | 2B | 20B | 4x | 2.35 |

Under the $6ND$ proxy, both middle configurations consume identical total compute, yet allocating that doubling to additional training tokens lowers validation loss by $0.05$ nats relative to doubling model weights. Across a single point comparison without repeat seeds or variance estimates, that gap indicates a local preference rather than a universal scaling exponent. Doubling both axes together reduces loss still further at four times the baseline compute, illustrating how both capacity and data relieve separate bottlenecks.

Evaluating those differences rigorously requires holding tokenizer vocabulary, text distribution, context window, and loss units strictly fixed. Because <span data-glossary="cross-entropy">cross-entropy</span> measured with natural logarithms is reported in nats per token, changing tokenizers alters average characters per token and breaks direct comparisons across models. When a curve follows $L = K C^{-\alpha}$ with zero floor, plotting $\log L$ against $\log C$ traces a straight line, whereas introducing an irreducible floor $L = E + K C^{-\alpha}$ linearizes $\log(L - E)$ instead. Because misspecifying $E$ bends both fitted slopes and long-range forecasts, small proxy runs serve to propose an initial curve that larger intermediate checkpoints must verify before committing a full budget.

<figure>
  <img src="illustrations/_generated/power_law_returns_dark.png" alt="Log-compute plot for the power law L(C)=2+C to the negative 0.05 shows losses 3.000, 2.944, 2.891, 2.841, and 2.794 across equal 3.16-fold compute steps. Four bars below use a shared 0.060 scale and show the successive loss drops shrinking from 0.056 to 0.047." />
  <figcaption>Each 3.16× step moves an equal distance along the logarithmic compute axis. The drop bars share a 0.060 reference scale, so their shortening shows the diminishing absolute gain.</figcaption>
</figure>

To quantify how power-law exponents translate into diminishing returns, examine Kaplan's single-axis parameter scaling exponent $\alpha_N \approx 0.076$. Each tenfold increase in parameters scales the power-law loss term by $10^{-0.076} \approx 0.839$, and a hundredfold increase scales it by $0.705$. Computing these factors vectorized in NumPy shows how rapidly raw fractional reductions flatten as scale climbs:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="power-law-diminishing-returns.py"
import numpy as np

alpha_n = 0.076
multipliers = np.array([2, 10, 100])
scaled_terms = np.power(multipliers, -alpha_n)
reductions = 1.0 - scaled_terms

for mult, term, red in zip(multipliers, scaled_terms, reductions):
    print(f"{mult:>3}x parameters -> {term:.3f}x fitted-regime loss ({red:.1%} reduction)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
  2x parameters -> 0.949x fitted-regime loss (5.1% reduction)
 10x parameters -> 0.839x fitted-regime loss (16.1% reduction)
100x parameters -> 0.705x fitted-regime loss (29.5% reduction)
```
<!-- leetllm: output:end -->

```checkpoint
Your team can either double parameters from 1B to 2B while keeping data at 10B tokens, or keep 1B parameters and double data to 20B tokens. Which option gives lower loss in the table?
---
Doubling data gives lower loss in this comparison table: 2.55 instead of 2.60. Data does not win universally; parameters and tokens relieve distinct bottlenecks, and empirical scaling studies measure which constraint binds for a given budget.
```

## Kaplan scaling laws (2020)

Kaplan et al. [^kaplan2020] systematically measured loss for dense decoder-only transformers across several orders of magnitude in parameters, tokens, and compute. To isolate each scaling relationship clearly, their experiments held the other potential bottlenecks abundant. Across every studied regime, validation cross-entropy decreased smoothly along empirical power laws along individual axes as well as along the compute-efficient envelope.

### The three power laws

#### 1. Scaling with parameters (model size $N$)

When training data is abundant and compute is unrestricted, model capacity acts as the primary bottleneck. Under those conditions, Kaplan et al. found that loss decreases as a power law in parameter count, fitted with $\alpha_N \approx 0.076$ using non-embedding parameter weights. Excluding embedding tables ensured that vocabulary size did not mask hidden-layer capacity scaling, though this single-axis formula fits total cross-entropy without an irreducible entropy floor $E$ and cannot be transferred to $L - E$ residuals or extrapolated toward zero loss:[^kaplan2020]

$$
L(N) \propto N^{-\alpha_N}
$$

#### 2. Scaling with data (dataset size $D$ in tokens)

When model capacity is large enough to avoid underfitting and training stops before overfitting sets in, available dataset size governs loss. Across fresh web-text runs, Kaplan et al. fitted the token scaling exponent $\alpha_D \approx 0.095$ over processed token positions rather than distinct vocabulary types. Because single-pass token positions avoid repetition decay, carrying this fresh-data curve over to multi-epoch corpora requires separate empirical checks:

$$
L(D) \propto D^{-\alpha_D}
$$

#### 3. Scaling with compute-optimal training compute ($C_{\min}$)

When compute $C_{\min}$ is allocated efficiently across both model size and step count, minimum attainable loss traces a single frontier. Kaplan et al. estimated the frontier exponent $\alpha_C \approx 0.050$ using their batch-efficiency-adjusted compute variable $C_{\min}$. Because $C_{\min}$ normalizes out inefficiently large batch sizes, it does not equate directly to raw accelerator FLOPs, and spending extra compute on just one axis misses this frontier entirely:

$$
L(C_{\min}) \propto C_{\min}^{-\alpha_C}
$$

### Kaplan's compute allocation: why parameters grew faster than data

When holding compute fixed and jointly optimizing model size $N$ and token count $D$, Kaplan et al. arrived at a striking conclusion. Their fits favored expanding model weights far faster than training tokens as budgets scaled up:

$$
N_{\text{opt}} \propto C^{0.73}, \qquad D_{\text{opt}} \propto C^{0.27}
$$

Under that fit, growing the training compute budget by $10\times$ calls for growing parameter count by $10^{0.73} \approx 5.37\times$ while increasing tokens by only $10^{0.27} \approx 1.86\times$. Across a $100\times$ compute surge, parameters expand nearly thirtyfold ($28.84\times$) while training tokens rise only $3.47\times$. That conclusion guided early large-scale models: OpenAI trained GPT-3 [^brown2020] at 175 billion parameters on 300 billion tokens (roughly 1.7:1 tokens per parameter), and DeepMind trained Gopher at 280 billion parameters on 300 billion tokens (1.07:1). Compare Kaplan's parameter-heavy multipliers with Chinchilla's balanced scaling multipliers directly using NumPy:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="allocation-exponents.py"
import numpy as np

frontiers = {
    "Kaplan": np.array([0.73, 0.27]),
    "Chinchilla": np.array([0.50, 0.50]),
}
compute_multipliers = np.array([10, 100])

for compute_multiplier in compute_multipliers:
    print(f"{compute_multiplier}x training compute")
    for name, exps in frontiers.items():
        parameters, tokens = np.power(compute_multiplier, exps)
        print(f"  {name:<10} N={parameters:5.2f}x, D={tokens:5.2f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
10x training compute
  Kaplan     N= 5.37x, D= 1.86x
  Chinchilla N= 3.16x, D= 3.16x
100x training compute
  Kaplan     N=28.84x, D= 3.47x
  Chinchilla N=10.00x, D=10.00x
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/scaling_curves_dark.png" alt="Normalized allocation geometry at a 100-fold training-compute increase. Equal log-unit axes show Kaplan fitted-growth normalization at 28.84× parameters and 3.47× tokens, Chinchilla fitted-growth normalization at 10× each, and an overtrained alternative at 2.5× parameters and 40× tokens. The shared iso-FLOP contour is N multiplier × D multiplier = 100." />
  <figcaption>The Kaplan and Chinchilla lines are fitted-growth normalizations at the same 100× compute increase; $N$ and $D$ are growth multipliers. Historical model $D/N$ ratios describe a separate quantity. The green 2.5×/40× point marks an overtrained point along the same iso-FLOP contour; locating an inference-optimal point requires a quality fit, demand forecast, and cost model.</figcaption>
</figure>

```checkpoint
Why did Kaplan-era scaling produce parameter-heavy models?
---
Kaplan's fitted compute-optimal frontier said that, for a fixed training compute budget, loss improved most by growing parameters much faster than tokens. That did not come from comparing the single-variable exponents $\alpha_N$ and $\alpha_D$ directly. It came from Kaplan's compute-efficient fits of loss versus model size and training steps, reported as $N_{\rm opt}\propto C^{0.73}$ and $D_{\rm opt}\propto C^{0.27}$.
```

Notice how moving from a parameter-heavy 175B/300B schedule toward a data-rich 70B/1.4T configuration alters resource allocation under the $6ND$ proxy. For less than double the total training FLOPs, redistributing compute away from static weights and into training tokens shrinks serving parameter count by $2.5\times$. Comparing the exact FLOP totals in NumPy sets up the Chinchilla reallocation:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="the-compute-optimal-frontier.py"
import numpy as np

configs = {
    "GPT-3-style": (175e9, 300e9),
    "70B / 1.4T-token": (70e9, 1.4e12),
}
sizes = np.array([cfg[0] for cfg in configs.values()])
tokens = np.array([cfg[1] for cfg in configs.values()])
flops = 6.0 * sizes * tokens

for name, f in zip(configs, flops):
    print(f"{name} training FLOPs: {f:.2e}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
GPT-3-style training FLOPs: 3.15e+23
70B / 1.4T-token training FLOPs: 5.88e+23
```
<!-- leetllm: output:end -->

The $6ND$ proxy gives both runs an arithmetic price tag. On its own, however, FLOP accounting cannot tell us which parameter-and-token pair minimizes cross-entropy loss along that contour. Answering that optimization question was the central contribution of Hoffmann et al.'s follow-up study.

## The Chinchilla reallocation (2022)

In 2022, Hoffmann et al. [^hoffmann2022] re-examined the compute-optimal frontier over longer training horizons. Their analysis concluded that earlier frontier models such as GPT-3 and Gopher were severely undertrained relative to their weight counts. Instead of growing parameter size much faster than dataset volume, their empirical fits scaled parameters and training tokens almost evenly with compute.

### Why the allocation studies disagreed

Why did two careful empirical studies arrive at $N \propto C^{0.73}$ versus $N \propto C^{0.50}$? Hoffmann et al. highlighted a learning-rate schedule mismatch: Kaplan et al. evaluated early checkpoints along a single long cosine-decay schedule, so runs stopped at modest token counts had not yet decayed their learning rate to near zero, artificially penalizing smaller models trained longer. When Chinchilla matched cosine-decay horizons individually to each target token count across larger proxy models, smaller models dropped steeply in loss and shifted the optimal allocation toward balanced growth.[^hoffmann2022]

Porian et al.'s later controlled reproduction dissected three additional methodological choices: counting vocabulary output-head FLOPs, shortening oversized warmup phases for small runs, and scaling learning rate, batch size, and AdamW $\beta_2$ across model sizes.[^porian2024] In their experiments, properly tuned runs with constant learning rates recovered nearly balanced exponents. By contrast, matching cosine schedules lowered overall loss without shifting the optimal exponent nearly as much as hyperparameter tuning and head-FLOP accounting did. When designing a scaling study, distinguish choices that uniformly shift loss across all runs from choices that tilt the optimal $D/N$ split along constant-compute profiles.

### Chinchilla's three methodologies and the equal-scaling derivation

Hoffmann et al. trained over 400 models spanning 70 million to 16 billion parameters across 5 billion to 500 billion tokens. Testing three distinct fitting strategies independently yielded near-equal compute exponents around $0.50$:

| Approach | Methodology | Parameter exponent ($a$) | Token exponent ($b$) |
|---|---|---|---|
| 1. Empirical envelope | Minimum loss envelope across 400+ runs | $0.50$ | $0.50$ |
| 2. IsoFLOP profiles | Slicing runs at constant compute budgets and finding the loss minimum | $0.49$ | $0.51$ |
| 3. Parametric loss fit | Fitting $L(N, D) = E + A N^{-\alpha} + B D^{-\beta}$ via L-BFGS | $0.46$ | $0.54$ |

Approach 3 models cross-entropy directly as an irreducible loss floor plus additive finite-capacity and finite-data penalty terms. Every constant ($E, A, B, \alpha, \beta$) is constrained strictly positive:

$$
L(N, D) = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}
$$

Here $E$ represents the fitted loss floor within the parametric model rather than an independent estimate of natural-text entropy. The term $A/N^\alpha$ captures the finite-parameter penalty, and $B/D^\beta$ captures the finite-token penalty. To find the compute-optimal allocation for a fixed budget $C$, substitute $D = C/(6N)$ into the surface, differentiate with respect to $N$, and set the derivative to zero:

$$
L(N) = E + A N^{-\alpha} + B \left(\frac{6}{C}\right)^\beta N^\beta, \qquad \frac{dL}{dN} = -\alpha A N^{-\alpha - 1} + \beta B \left(\frac{6}{C}\right)^\beta N^{\beta - 1} = 0
$$

Multiplying through by $N$ reveals an intuitive optimality balance at the minimum. The marginal loss reduction from a proportional increase in parameters equals the marginal reduction from an equal proportional increase in training tokens ($\partial L / \partial \log N = \partial L / \partial \log D$). Notice that this balances equal percentage steps in each resource rather than equal gains per individual parameter and token:

$$
\alpha \frac{A}{N^\alpha} = \beta \frac{B}{D^\beta}
$$

Solving that balance condition alongside the compute constraint $6ND = C$ gives explicit closed-form power laws for both optimal model size $N^*(C)$ and optimal dataset size $D^*(C)$. Because $a = \beta / (\alpha + \beta)$ and $b = \alpha / (\alpha + \beta)$, the two compute exponents always sum to one:

$$
N^*(C) = \left(\frac{\alpha A}{\beta B}\right)^{\frac{1}{\alpha + \beta}} \left(\frac{C}{6}\right)^{\frac{\beta}{\alpha + \beta}}, \qquad D^*(C) = \left(\frac{\beta B}{\alpha A}\right)^{\frac{1}{\alpha + \beta}} \left(\frac{C}{6}\right)^{\frac{\alpha}{\alpha + \beta}}
$$

Substituting Hoffmann et al.'s empirical Approach 3 exponents $\alpha \approx 0.34$ and $\beta \approx 0.28$ yields $a \approx 0.45$ and $b \approx 0.55$, closely matching the paper's reported $0.46 / 0.54$ parametric fit as well as Approaches 1 and 2 ($0.50 / 0.50$ and $0.49 / 0.51$). Under the simplified equal-scaling summary ($a \approx b \approx 0.5$), both parameters and dataset size scale with the square root of compute:

$$
N \propto \sqrt{C}, \qquad D \propto \sqrt{C}
$$

In practice, teams often condense Approach 1's envelope into a convenient rule of thumb: $D \approx 20N$. That linear approximation matches roughly 20.2B tokens at 1B parameters, 205.1B at 10B, and the nominal 70B/1.4T Chinchilla configuration. Technically, however, the parametric fit predicts a slowly rising ratio $D^*/N^* \propto C^{(\alpha - \beta)/(\alpha + \beta)}$. Even equal exponents $\alpha = \beta = \gamma$ only enforce a constant ratio $(B/A)^{1/\gamma}$ determined by data and architecture coefficients rather than a universal constant of 20.[^hoffmann2022] Setting $\gamma = 0.5$ and holding dimensionless work $ND = 10^6$ fixed demonstrates how varying $A$ and $B$ shifts the exact $D/N$ optimum even when growth exponents match:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="equal-growth-does-not-fix-the-ratio.py"
import numpy as np

gamma = 0.5
product = 1e6
coeffs = np.array([[1.0, 1.0], [2.0, 8.0]])
ratios = np.power(coeffs[:, 1] / coeffs[:, 0], 1.0 / gamma)
n_vals = np.sqrt(product / ratios)
d_vals = ratios * n_vals

for (a, b), ratio, n, d in zip(coeffs, ratios, n_vals, d_vals):
    print(f"A={a:.0f}, B={b:.0f}: N={n:.0f}, D={d:.0f}, D/N={ratio:.0f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A=1, B=1: N=1000, D=1000, D/N=1
A=2, B=8: N=250, D=4000, D/N=16
```
<!-- leetllm: output:end -->

Both coefficient pairs scale model size and data identically as compute increases. Yet their optimal $D/N$ proportions differ sixteenfold (`1:1` versus `16:1`). Under unequal exponents such as $\alpha = 0.34$ and $\beta = 0.28$, the optimal ratio itself drifts upward by roughly $1.56\times$ across a $100\times$ compute jump.

<figure>
  <img src="illustrations/_generated/kaplan_chinchilla_frontier_dark.png" alt="Equal-unit log axes compare fitted allocation growth with compute: Kaplan parameter growth has slope 0.73, Kaplan token growth slope 0.27, and Chinchilla balanced growth slope 0.50. At 100-fold compute, their normalized multipliers are 28.84/3.47 and 10/10. A separate bar strip shows model-specific D/N ratios of 1.7:1 for GPT-3, 20:1 for Chinchilla, and 38.5:1 for Llama 3 405B." />
  <figcaption>The lines show fitted growth multipliers ending at a 100× compute increase. The bars show historical $D/N$ snapshots, which describe the training data per parameter in each configuration. A snapshot ratio and a fitted frontier slope answer different questions.</figcaption>
</figure>

```checkpoint
For Chinchilla-style compute-optimal training, how many tokens does a 70B dense model need?
---
Use approximately 20 tokens per parameter: $70B \times 20 = 1.4T$ tokens. Hoffmann et al. fitted this rule of thumb for a particular dense-transformer setup; measure a new data, architecture, and optimizer mix before using the ratio as a budget.
```

Given any target dense training FLOP budget $C$ and an empirically verified token-to-parameter ratio $r = D/N$, solving $6 r N^2 = C$ directly determines the model scale. Evaluating a $10^{24}$-FLOP run under the 20:1 Chinchilla approximation in NumPy yields a nominal 91.3B model trained on 1.83T tokens. Always treat this estimate as an initial baseline subject to re-measurement on your target tokenizer and data mixture:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="compute-budget-to-chinchilla-size.py"
import numpy as np

def chinchilla_style_size(training_flops, tokens_per_parameter=20.0):
    parameters = np.sqrt(training_flops / (6.0 * tokens_per_parameter))
    tokens = tokens_per_parameter * parameters
    return parameters, tokens

parameters, tokens = chinchilla_style_size(1e24)
print(f"Parameters at 1e24 FLOPs: {parameters / 1e9:.1f}B")
print(f"Tokens at 20:1: {tokens / 1e12:.2f}T")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Parameters at 1e24 FLOPs: 91.3B
Tokens at 20:1: 1.83T
```
<!-- leetllm: output:end -->

### Chinchilla vs. Gopher: a frontier-scale test

DeepMind tested its allocation directly by training the 70B-parameter **Chinchilla** model on 1.4T tokens at roughly Gopher's training FLOP budget.[^hoffmann2022] Their estimated optimal parameter window spanned 40B to 70B weights at that compute level. Selecting 70B traded slightly higher parameter capacity for faster hardware training convergence and memory-bandwidth efficiency.

| Model | Nominal parameters | Tokens | Nominal $D/N$ | Paper's shared budget | Rounded $6ND$ proxy |
|---|---|---|---|---|---|
| Gopher | 280B | 300B | 1.07:1 | $5.76\times10^{23}$ | $5.04\times10^{23}$ |
| Chinchilla | 70B | 1.4T | 20:1 | $5.76\times10^{23}$ | $5.88\times10^{23}$ |

Notice that the $5.76\times10^{23}$ figure comes from the paper's frontier projection table, whereas Appendix F reports a detailed $6.3\times10^{23}$ FLOP total and the simplified $6ND$ proxy rounds slightly on either side. Across benchmarks, Chinchilla outperformed Gopher on average MMLU, BIG-bench, and LAMBADA, though it still trailed Gopher on four individual MMLU tasks. Because the two runs also differed in optimizer, tokenizer, and corpus composition, this frontier comparison reflects cumulative setup improvements alongside allocation balance.[^hoffmann2022] Crucially, cutting parameters fourfold at fixed numerical precision lowers weight memory footprint and dense per-token inference FLOPs roughly fourfold as well, although KV caches and latency targets still require end-to-end serving benchmarks.

```checkpoint
Why was Chinchilla also a serving-cost breakthrough?
---
Chinchilla matched Gopher's reported training compute with a much smaller model trained on more tokens. It scored better on the reported evaluations, and its lower parameter count implies lower dense FLOPs per inference token under the same proxy. Latency, utilization, and serving cost depend on the deployment stack and require their own measurements.
```

Applying the 20:1 scaling rule to a mid-sized 10B dense model shows how modest compute-optimal training looks compared with modern production horizons. Such a model takes 200B training tokens and $1.20 \times 10^{22}$ FLOPs under the dense proxy. Modern deployment teams routinely train far beyond this token threshold to drive down inference weights:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="chinchilla-style-budget.py"
import numpy as np

parameters = np.array([10e9])
tokens = 20.0 * parameters
flops = 6.0 * parameters * tokens

print(f"Chinchilla-style tokens for 10B parameters: {tokens[0]:.2e}")
print(f"Dense training FLOPs: {flops[0]:.2e}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Chinchilla-style tokens for 10B parameters: 2.00e+11
Dense training FLOPs: 1.20e+22
```
<!-- leetllm: output:end -->

## Beyond Chinchilla: inference-aware scaling

Chinchilla scaling solves a tightly scoped optimization problem: minimizing pre-training cross-entropy loss under a fixed *training* compute budget ($C_{\text{train}}$). While omitting inference does not mean Chinchilla assumed zero deployment, once a model serves trillions of tokens in production, cumulative inference work can dwarf upfront training cost. Under the $6ND$ training and $2NQ$ inference proxies, cumulative serving arithmetic exceeds training arithmetic whenever lifetime served tokens satisfy $Q > 3D$, which means crossing roughly $4.2\text{T}$ served tokens for a model trained on $1.4\text{T}$ tokens. In this regime, teams intentionally apply **overtraining**, pushing token count well past a model size's training-optimal ratio (here using 20:1 as a simple baseline rather than a universal law) to gain the capability of a larger model inside a far cheaper serving footprint.

### The lifetime economic break-even equation

Sardana et al. [^sardana2024] formalized inference-aware scaling by minimizing total lifetime compute rather than pre-training compute alone. Their accounting adds forward-and-backward training work to forward-only inference work across all served tokens. Summing those two phases gives the lifetime FLOP proxy:

$$
C_{\text{total}} = C_{\text{train}} + C_{\text{infer}} = 6ND + 2N \cdot Q = 2N(3D + Q)
$$

In this simplified dense-projection model, $Q$ counts total processed inference tokens across prompts and completions (ignoring prefix-cache reuse), and $2N$ counts large dense matrix projections while leaving aside context-dependent attention work and serving overhead. Suppose two candidate models reach identical pre-training cross-entropy on a shared evaluation split, keeping in mind that equal cross-entropy does not by itself guarantee equal downstream task quality:
- **Model 1 (Chinchilla-optimal)**: Larger model ($N_1$) trained on fewer tokens ($D_1 \approx 20N_1$).
- **Model 2 (Overtrained compact model)**: Smaller model ($N_2 < N_1$) overtrained on a massive token corpus ($D_2 \gg 20N_2$).

When Model 1 sits on the training-optimal curve for that target loss, Model 2 requires extra upfront training FLOPs equal to $\Delta C_{\text{train}} = 6(N_2 D_2 - N_1 D_1)$. In return, Model 2 saves $\Delta C_{\text{infer/token}} = 2(N_1 - N_2)$ dense FLOPs on every single token served during deployment. Setting total lifetime FLOPs equal defines the **break-even processed-token volume** ($Q_{\text{break-even}}$, measured in tokens rather than user requests) at which cumulative inference savings recover that upfront training premium:

$$
6N_2 D_2 + 2N_2 Q = 6N_1 D_1 + 2N_1 Q \quad \Longrightarrow \quad Q_{\text{break-even}} = \frac{3(N_2 D_2 - N_1 D_1)}{N_1 - N_2} = \frac{\Delta C_{\text{train}}}{\Delta C_{\text{infer/token}}}
$$

Whenever positive break-even demand $Q_{\text{break-even}}$ is exceeded, the smaller overtrained model becomes cheaper on lifetime dense FLOPs under the assumption of equal task quality and demand. If $\Delta C_{\text{train}} \le 0$ the smaller model wins immediately, whereas equal parameter counts $N_1 = N_2$ yield zero per-token savings. Real financial break-even volumes shift whenever training and inference FLOPs carry different dollar prices ($p_t$ and $p_i$), moving the threshold to $Q = (p_t / p_i) \cdot \Delta C_{\text{train}} / \Delta C_{\text{infer/token}}$. Sardana et al. additionally model hardware utilization differences between prompt prefill and autoregressive decode, along with memory bandwidth, caching, precision, and latency targets.[^sardana2024]

```checkpoint
What question does inference-aware scaling ask that Chinchilla doesn't?
---
Chinchilla asks how to minimize pre-training loss under a fixed training-compute budget. Inference-aware scaling asks which model minimizes total lifetime cost at a target quality, including both training FLOPs and all future served-token FLOPs.
```

### Concrete break-even example

Compare two candidate configurations under the **working assumption** that both meet the same downstream task-quality requirement (an assumption that actual benchmark and product evaluations must verify independently):
- **Model A (Chinchilla-style)**: 70B parameters trained on 1.4T tokens. Training cost $\approx 6 \times 70\text{B} \times 1.4\text{T} \approx 5.88 \times 10^{23}$ FLOPs. Inference cost per token $\approx 2 \times 70\text{B} = 140$B FLOPs.
- **Model B (Inference-aware overtrained)**: 30B parameters trained on 4.0T tokens. Training cost $\approx 6 \times 30\text{B} \times 4.0\text{T} \approx 7.20 \times 10^{23}$ FLOPs. Inference cost per token $\approx 2 \times 30\text{B} = 60$B FLOPs.

Model B pays $1.32 \times 10^{23}$ extra FLOPs during pre-training before serving a single user query. Once deployed, however, it saves $140\text{B} - 60\text{B} = 80\text{B}$ dense FLOPs for every token generated or read. Dividing the training premium by that per-token saving reveals exactly where lifetime FLOPs cross over.

<figure>
  <img src="illustrations/_generated/inference_break_even_dark.png" alt="Assuming equal model quality, total training-plus-serving FLOPs cross at 1.65 trillion served tokens. At the crossing each candidate costs 8.19×10²³ FLOPs: the 70B model is 5.88 training plus 2.31 serving, while the 30B model is 7.20 training plus 0.99 serving. Stacked bars share the same total scale." />
  <figcaption>Under the equal-quality assumption, both candidates total 8.19 × 10²³ FLOPs at 1.65T served tokens. The 70B candidate spends less upfront and more on every served token; the 30B candidate spends more upfront and less per served token.</figcaption>
</figure>

Solve the crossing point in NumPy by equating the two linear lifetime-cost curves. Model A begins lower at zero served tokens, while Model B climbs with less than half the slope. Their lines intersect precisely at $1.65 \times 10^{12}$ served tokens:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="concrete-break-even-example.py"
import numpy as np

params = np.array([70e9, 30e9])
train_tokens = np.array([1.4e12, 4.0e12])
train_flops = 6.0 * params * train_tokens
infer_flops_per_token = 2.0 * params

# Solve train_a + infer_a * Q == train_b + infer_b * Q
break_even_tokens = (train_flops[1] - train_flops[0]) / (
    infer_flops_per_token[0] - infer_flops_per_token[1]
)

print(f"Model A training FLOPs: {train_flops[0]:.2e}")
print(f"Model B training FLOPs: {train_flops[1]:.2e}")
print(f"Break-even served tokens: {break_even_tokens:.2e}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Model A training FLOPs: 5.88e+23
Model B training FLOPs: 7.20e+23
Break-even served tokens: 1.65e+12
```
<!-- leetllm: output:end -->

Evaluating cumulative FLOPs at $1\text{T}$ versus $3\text{T}$ served tokens makes the threshold decision concrete. Below $1.65\text{T}$ tokens, the larger Chinchilla model remains cheaper overall because training dominates. Above $1.65\text{T}$ served tokens, lifetime serving volume flips the optimal winner to the compact 30B model:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="lifetime-cost-above-and-below-break-even.py"
import numpy as np

names = ["70B / 1.4T", "30B / 4.0T"]
params = np.array([70e9, 30e9])
train_tokens = np.array([1.4e12, 4.0e12])
demands = np.array([1e12, 3e12])

# Shape: (len(demands), len(names))
total_flops = 6.0 * params * train_tokens + 2.0 * np.outer(demands, params)
cheapest_idx = np.argmin(total_flops, axis=1)

for demand, idx in zip(demands, cheapest_idx):
    print(f"{demand / 1e12:.0f}T served tokens -> cheaper candidate: {names[idx]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1T served tokens -> cheaper candidate: 70B / 1.4T
3T served tokens -> cheaper candidate: 30B / 4.0T
```
<!-- leetllm: output:end -->

### Historical configurations: the Llama trajectory

Published open-weights models illustrate how aggressively production teams pushed token budgets past the nominal 20:1 training-only baseline to shrink inference weights. Notice that the ratios listed below use rounded nominal parameter counts. Each generation pushed further toward overtrained deployment models:

- **LLaMA 1 (2023)** [^touvron2023]: nominal 7B on 1.0T tokens (about 143:1) and 65B on 1.4T (about 21.5:1).
- **Llama 2 (2023)** [^touvron2023a]: 7B on 2.0T tokens (about 286:1) and 70B on 2.0T (about 28.6:1).
- **Original Llama 3 8B (April 2024)**: its [model card](https://huggingface.co/meta-llama/Meta-Llama-3-8B) reports **15T+** training tokens. That's at least about 1,875 tokens per nominal parameter, or about 94 times the 160B-token budget from assuming $D=20N$.
- **Llama 3 405B (2024)** [^dubey2024]: the paper reports **15.6T** tokens for its initial pre-training stage, about 38.5:1. Avoid transferring that precise 15.6T count directly to the earlier 8B release.

Longer training improves a compact model whose per-token deployment arithmetic stays low. Whether that extra pre-training budget pays off depends directly on realized downstream quality, cumulative query volume, and hardware serving prices. Because tokenizer vocabularies, corpus mixtures, and architectural details also evolved across these model generations, this timeline reflects shifting engineering priorities rather than a controlled single-variable experiment.

## Finite public text as a planning constraint

Sustained overtraining relies on an ample corpus of fresh tokens, yet high-quality human-generated public text on the internet grows slowly relative to training budgets. Villalobos et al.'s **June 2024 forecast** [^villalobos2024] estimated that rising training-data demands could intersect effective public human-text stocks between 2026 and 2032, with a median projection around 2028. Their roughly $4 \times 10^{14}$-token figure represents an **effective stock at that crossing**, already adjusted for quality filtering and productive multi-epoch reuse, so measuring an active project's actual constraints still requires inspecting its own licensed and filtered corpus.

Crucially, training does not physically consume public text like a shared pool being drained once per model. Any corpus already downloaded remains intact after gradient updates finish. Four separate training runs can therefore either reuse a single corpus or draw disjoint datasets with very different unique-token footprints:

| Four-run reuse scenario | Token presentations across all runs | Unique text in their union |
|---|---|---|
| Each uses the same 15T-token corpus once | 60T | 15T |
| Each uses a disjoint 15T-token corpus once | 60T | 60T |

Only disjoint training collections multiply unique text requirements, and even then comparing raw token presentations directly against an effective-stock figure mixes incompatible definitions. Access rights, filtering attrition, domain coverage, and diminishing returns across repeated epochs matter far more than summing published token counts across model releases. Compare Llama 3 405B's initial pre-training token count against the 20:1 baseline and the $4 \times 10^{14}$ effective-stock estimate numerically while keeping that denominator distinction explicit:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="projected-public-text-context.py"
import numpy as np

effective_stock = 4e14  # Villalobos et al.: ~400T effective stock at utilization
budgets = np.array([15.6e12, 20.0 * 405e9])
share_of_stock = budgets / effective_stock

print(f"Llama 3 405B reported tokens: {budgets[0] / 1e12:.1f}T")
print(f"Chinchilla-style 405B tokens: {budgets[1] / 1e12:.1f}T")
print(f"Reported token budget / projected effective stock: {share_of_stock[0]:.1%}")
print("Numerical comparison only; not a fraction of unique usable text exhausted.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Llama 3 405B reported tokens: 15.6T
Chinchilla-style 405B tokens: 8.1T
Reported token budget / projected effective stock: 3.9%
Numerical comparison only; not a fraction of unique usable text exhausted.
```
<!-- leetllm: output:end -->

```checkpoint
Does 3.9% mean Llama 3 left only 96.1% of the world's useful text available?
---
No. Training can reuse text, and a processed-token budget is not a unique-corpus count. The denominator is a future effective-stock projection adjusted for quality and useful repetition, so the bottleneck concerns rising per-run data appetites meeting finite fresh stock rather than labs consuming shared text.
```

To stretch beyond fresh web crawls, teams explore multiple mitigation axes: disciplined multi-epoch repetition, verifier-checked model-generated training data, and additional domains or modalities such as code, video, and audio. Every substitute alters learning efficiency and must be validated empirically before extrapolating a fresh-text scaling slope forward. For instance, a [September 2025 Epoch AI assessment](https://epoch.ai/publications/what-will-ai-look-like-in-2030) judged a pre-training data bottleneck potentially surmountable through model-generated data, while emphasizing that this conclusion still rests on corpus-availability and quality assumptions.

## A new scaling axis: test-time compute

Pre-training freezes model parameters, but deployment opens an orthogonal lever: <span data-glossary="test-time-compute">test-time compute</span>. Rather than allocating every FLOP before release, a serving system can invest variable inference compute per query via longer reasoning traces, sampling multiple candidate completions, or tree search guided by a verifier. Those mechanisms differ substantially in cost and assumptions: showing that DeepSeek-R1 improves with longer chain-of-thought reasoning traces [^deepseekai2025] does not prove it executes external-verifier tree search on every request.

Snell et al. [^snell2024] studied math reasoning with PaLM 2-S* equipped with task-specific revision and verifier models, showing that routing extra test-time compute selectively to harder questions allowed a much smaller model to match a single-pass model roughly 14 times its parameter count under certain compute-matched conditions. Conversely, on universally hard prompts or under very high query volume, upgrading the pre-trained base model can still outperform heavy test-time sampling, and both routing and verification add extra inference overhead. Suppose a model generates 512 output tokens per candidate with no early stopping; computing dense generation FLOPs across 1, 4, and 16 candidates illustrates how quickly sampling multiplies per-request serving cost even before counting prompt prefill, KV attention, or verifier scoring:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="sampled-candidates-raise-generation-cost.py"
import numpy as np

parameters = 8e9
output_tokens_per_candidate = 512
candidates = np.array([1, 4, 16])
flops = 2.0 * parameters * output_tokens_per_candidate * candidates

for count, cost in zip(candidates, flops):
    print(f"{count:>2} candidate(s): {cost:.2e} generation FLOPs per request")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
 1 candidate(s): 8.19e+12 generation FLOPs per request
 4 candidate(s): 3.28e+13 generation FLOPs per request
16 candidate(s): 1.31e+14 generation FLOPs per request
```
<!-- leetllm: output:end -->

```checkpoint
How does test-time compute add a scaling axis beyond fixed model size?
---
Parameters and pre-training tokens are fixed once the model is trained. Test-time compute is chosen per query: the same deployed model can spend more generation or multiple sampled attempts on harder inputs. That creates an additional serving-cost trade-off, while the attainable quality gain still depends on the trained model and task.
```

## From theory to practice: running a scaling study

A power-law fit is valuable in engineering practice only when measurements on affordable small runs accurately forecast behavior at target scale. First, a team sweeps parameter count and token budget across small proxy models to fit a declared loss surface and predict target-scale loss. Next, the plan places a mid-scale <span data-glossary="validation-gate">validation gate</span> between proxy runs and the full launch so the run halts for diagnosis if real loss misses its predeclared tolerance.

### Zero-shot hyperparameter transfer with maximal update parametrization (µP)

Scaling a network safely requires keeping learning dynamics consistent across width; otherwise, an optimal learning rate tuned at a 100M proxy diverges or stalls when scaled to 10B parameters. **Maximal Update Parametrization ($\mu$P)** [^yang2022] coordinates initialization variances, layer multipliers, and per-layer learning rates so feature updates stay $\Theta(1)$ as width grows (keeping in mind that exact rules depend on layer role and optimizer, so an SGD linear demonstration differs from an AdamW recipe for full transformers). Inspect the core mechanism on the paper's two-layer linear model $f(x) = V^\top U x$ at scalar $x = 1$ with squared loss $\tfrac{1}{2}(f - 1)^2$, initializing alternating input weights $U_i = \pm 1$ and uniform output weights $V_i$ so initial output vanishes ($f = 0$), and evaluating one full SGD step using pre-update weights via NumPy vector operations:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="width-and-a-single-sgd-update.py"
import numpy as np

def one_step(u, v, input_lr, output_lr):
    prediction = float(u @ v)
    error = prediction - 1.0
    new_u = u - input_lr * error * v
    new_v = v - output_lr * error * u
    return float(new_u @ new_v)

for width in (16, 64, 256):
    u = np.where(np.arange(width) % 2 == 0, 1.0, -1.0)
    standard = one_step(u, np.full(width, 1.0 / np.sqrt(width)), 1.0, 1.0)
    mup = one_step(u, np.full(width, 1.0 / width), float(width), 1.0 / width)
    print(f"width={width}: standard prediction={standard:.1f}, muP prediction={mup:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
width=16: standard prediction=17.0, muP prediction=2.0
width=64: standard prediction=65.0, muP prediction=2.0
width=256: standard prediction=257.0, muP prediction=2.0
```
<!-- leetllm: output:end -->

Under standard parametrization, the single-step prediction blows up linearly with width as $n + 1$, whereas $\mu$P holds the update invariant at $2.0$ regardless of width by scaling output initialization as $1/n$, scaling the input-layer learning rate up by $n$, and scaling the output-layer learning rate down by $n$. Notice that $\mu$P still predicts $2.0$ rather than the target $1.0$ here because width stability ensures transferability across sizes without selecting the optimal base learning rate by itself. While Yang et al. transferred optimal hyperparameters zero-shot from a 40M proxy to a 6.7B GPT-3 model, scaling further to 70B+ or changing depth and architectural blocks still warrants checking finite-width drift, regularization sensitivity (dropout and weight decay), and an empirical mid-scale sanity run.

### Fitting the parametric loss surface

In a production scaling study, teams train a grid of proxy models across small parameter counts (such as $100\text{M}$ to $1\text{B}$) and modest token budgets. They then measure validation cross-entropy and fit the five constants of Chinchilla Approach 3: $L(N, D) = E + A N^{-\alpha} + B D^{-\beta}$. To walk through the numerical pipeline transparently, examine a parametric benchmark surface defined by:

$$
L(N, D) = 1.10 + \frac{2.80}{N^{0.070}} + \frac{7.80}{D^{0.098}}
$$

| Parameters ($N$) | Tokens ($D$) | Cross-entropy loss (nats) |
|---|---|---|
| 100M | 1B | 2.895 |
| 100M | 5B | 2.745 |
| 100M | 20B | 2.634 |
| 500M | 1B | 2.813 |
| 500M | 5B | 2.663 |
| 500M | 20B | 2.552 |
| 1B | 5B | 2.631 |
| 1B | 20B | 2.520 |
| 1B | 100B | 2.408 |

<figure>
  <img src="illustrations/_generated/scaling_study_fit_dark.png" alt="Log-log map of eight small-scale runs, a distinct held-out point at 1B parameters and 100B tokens, and a forecast marker at 70B parameters and 1.4T tokens. The fit region covers only 0.1B–1B parameters and 1B–20B tokens. The fitted law predicts 2.408 at holdout versus 2.408 observed, residual +0.0002, and forecasts 2.091 at the target." />
  <figcaption>The dashed box encloses the eight proxy inputs; the held-out input at 1B / 100B and the 70B / 1.4T forecast sit outside it. Because every point comes from the parametric surface above, the holdout checks numerical recovery rather than real-world generalization, so an actual study still requires a measured mid-scale <span data-glossary="validation-gate">validation check</span>.</figcaption>
</figure>

To isolate exponent recovery, hold $E$, $A$, and $B$ fixed at their known constants and hold out the $(1\text{B}, 100\text{B})$ point while fitting the eight small-scale runs. Vectorizing the $41 \times 41$ candidate grid of $(\alpha, \beta)$ pairs with `np.meshgrid` identifies the minimum sum of squared errors in a single broadcasted pass (noting that continuous optimizer fits such as SciPy's `curve_fit` over all five noisy parameters require careful initialization and uncertainty bounds in real studies). Once $(\alpha, \beta)$ are recovered, check the held-out point at $(1\text{B}, 100\text{B})$ and extrapolate to $70\text{B}$ parameters and $1.4\text{T}$ tokens:

<!-- leetllm: test, output=show, id=scaling-fit, deps=numpy -->
```python title="fit-exponents-and-forecast.py"
import numpy as np

def scaling_loss(n, d, e, a, alpha, b, beta):
    return e + a / np.power(n, alpha) + b / np.power(d, beta)

E, A, B = 1.10, 2.80, 7.80
experiments = np.array([
    [1e8, 1e9, 2.895],
    [1e8, 5e9, 2.745],
    [1e8, 2e10, 2.634],
    [5e8, 1e9, 2.813],
    [5e8, 5e9, 2.663],
    [5e8, 2e10, 2.552],
    [1e9, 5e9, 2.631],
    [1e9, 2e10, 2.520],
    [1e9, 1e11, 2.408],
])
train, held = experiments[:-1], experiments[-1]

grid = np.arange(40, 121, 2) / 1000.0
alpha_grid, beta_grid = np.meshgrid(grid, grid, indexing="ij")
preds = scaling_loss(
    train[:, 0:1, None],
    train[:, 1:2, None],
    E,
    A,
    alpha_grid[None, :, :],
    B,
    beta_grid[None, :, :],
)
sse = np.sum((preds - train[:, 2][:, None, None]) ** 2, axis=0)
best_i, best_j = np.unravel_index(np.argmin(sse), sse.shape)
alpha_fit, beta_fit = float(alpha_grid[best_i, best_j]), float(beta_grid[best_i, best_j])

hold_pred = scaling_loss(held[0], held[1], E, A, alpha_fit, B, beta_fit)
target = scaling_loss(70e9, 1.4e12, E, A, alpha_fit, B, beta_fit)

print(f"Recovered alpha={alpha_fit:.3f}, beta={beta_fit:.3f}")
print(
    f"Hold-out 1B / 100B: pred={hold_pred:.3f}, "
    f"observed={held[2]:.3f}, residual={hold_pred - held[2]:+.4f}"
)
print(f"Forecast 70B / 1.4T tokens: {target:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Recovered alpha=0.070, beta=0.098
Hold-out 1B / 100B: pred=2.408, observed=2.408, residual=+0.0002
Forecast 70B / 1.4T tokens: 2.091
```
<!-- leetllm: output:end -->

### Two measurements can hide very different forecasts

What goes wrong when the irreducible loss floor $E$ is unknown and the dataset is sparse? Imagine fitting two normalized compute anchor observations, $L(1) = 3.0$ and $L(100) = 2.5$, to the single-term power law $L(C) = E + K C^{-\alpha}$. Testing two plausible fixed exponents $\alpha \in \{0.1, 0.2\}$ shows that solving the two-point linear system for $(K, E)$ leaves extrapolated predictions dangerously underconstrained:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="two-anchors-do-not-identify-a-loss-floor.py"
import numpy as np

alphas = np.array([0.1, 0.2])
ks = (3.0 - 2.5) / (1.0 - np.power(100.0, -alphas))
floors = 3.0 - ks
forecasts = floors + ks * np.power(1e6, -alphas)

for alpha, floor, forecast in zip(alphas, floors, forecasts):
    print(f"alpha={alpha:.1f}: floor={floor:.3f}, loss at 1e6={forecast:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
alpha=0.1: floor=1.645, loss at 1e6=1.985
alpha=0.2: floor=2.169, loss at 1e6=2.222
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/floor_ambiguity_dark.png" alt="Two parametric power-law curves both pass exactly through the normalized observations L(1)=3 and L(100)=2.5. With alpha 0.1, the fitted floor is 1.645 and loss at 1,000,000 is 1.985; with alpha 0.2, the floor is 2.169 and the forecast is 2.222. The curves separate beyond the two shared anchors." />
  <figcaption>Both curves pass identically through the same normalized observations. Changing $\alpha$ shifts both the inferred floor and the one-million-compute forecast, whereas estimating empirical variance requires repeated runs across wider compute coverage.</figcaption>
</figure>

Both curves match the two anchor points with zero error. Yet their limiting floors separate by $0.524$ nats, and their $10^6$-compute extrapolations diverge by $0.237$ nats. A zero residual on sparse data never identifies all five surface constants; credible fits require wide variation in both $N$ and $D$, held-out verification points, initialization sensitivity checks, and run-to-run uncertainty bands.

### Turn a fitted surface into a budget allocation

Once $(\alpha, \beta)$ are fitted, closed-form calculus turns any target FLOP budget $C$ into the surface's minimum-loss $(N_*, D_*)$ split. Evaluating those formulas across candidate budgets isolates where parameter-and-token work minimizes cross-entropy. Below, NumPy checks that the unconstrained optimum satisfies the budget constraint and outperforms twofold shifts in either direction:

$$
N_* = \left[\frac{\alpha A}{\beta B}\left(\frac{C}{6}\right)^\beta\right]^{1/(\alpha+\beta)}, \qquad D_* = \frac{C}{6N_*}
$$

<!-- leetllm: test, output=show, continue=scaling-fit, id=scaling-optimum, deps=numpy -->
```python title="optimize-the-fitted-surface.py"
import numpy as np

C = 6 * 70e9 * 1.4e12
log_n = (
    np.log(alpha_fit * A / (beta_fit * B))
    + beta_fit * np.log(C / 6)
) / (alpha_fit + beta_fit)
n_opt = float(np.exp(log_n))
d_opt = C / (6 * n_opt)

def fixed_budget_loss(n):
    return scaling_loss(n, C / (6 * n), E, A, alpha_fit, B, beta_fit)

assert np.isclose(6 * n_opt * d_opt, C, rtol=1e-12)
assert fixed_budget_loss(n_opt) < fixed_budget_loss(n_opt / 2)
assert fixed_budget_loss(n_opt) < fixed_budget_loss(n_opt * 2)
print(f"Fitted optimum: {n_opt / 1e9:.2f}B parameters, {d_opt / 1e12:.2f}T tokens")
print(f"Token/parameter ratio: {d_opt / n_opt:.0f}:1")
print(f"Loss: optimum={fixed_budget_loss(n_opt):.3f}, 70B/1.4T={target:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Fitted optimum: 7.82B parameters, 12.53T tokens
Token/parameter ratio: 1602:1
Loss: optimum=2.074, 70B/1.4T=2.091
```
<!-- leetllm: output:end -->

Notice that the steep `1602:1` ratio reflects **this specific benchmark surface** rather than Chinchilla's empirical data, and substituting an unrelated 20:1 heuristic optimizes the wrong loss landscape altogether. At the same time, an unconstrained math optimum of $7.82\text{B} / 12.53\text{T}$ does not guarantee that $12.53\text{T}$ distinct high-quality tokens exist for the task. If unique clean text is capped at $D_{\max} = 2\text{T}$ tokens with no repeat epochs allowed, spending the entire FLOP budget $C$ pushes model size upward to $N \ge C / (6 D_{\max})$, placing the constrained optimum cleanly at the edge of the feasible range:

$$
N_{\text{capped}}=\max\!\left(N_*,\frac{C}{6D_{\max}}\right),\qquad
D_{\text{capped}}=\frac{C}{6N_{\text{capped}}}
$$

<!-- leetllm: test, output=show, continue=scaling-optimum, id=scaling-capped, deps=numpy -->
```python title="allocate-with-a-no-repeat-data-cap.py"
import numpy as np

data_cap = 2e12
minimum_n = C / (6 * data_cap)
n_capped = max(n_opt, minimum_n)
d_capped = C / (6 * n_capped)

assert d_opt > data_cap
assert d_capped <= data_cap
assert np.isclose(6 * n_capped * d_capped, C, rtol=1e-12)
assert fixed_budget_loss(n_capped) >= fixed_budget_loss(n_opt)
assert fixed_budget_loss(n_capped) < fixed_budget_loss(2 * n_capped)
print(f"No-repeat candidate: {n_capped / 1e9:.2f}B parameters, {d_capped / 1e12:.2f}T tokens")
print(f"Loss: capped={fixed_budget_loss(n_capped):.3f}, unconstrained={fixed_budget_loss(n_opt):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
No-repeat candidate: 49.00B parameters, 2.00T tokens
Loss: capped=2.086, unconstrained=2.074
```
<!-- leetllm: output:end -->

Under this data constraint, the candidate shifts to $49\text{B}$ parameters trained on $2\text{T}$ tokens. That point defines the constrained minimum on this fitted surface under zero repetition and no memory limit. Hardware memory caps can prevent spending full compute $C$ altogether, and allowing multi-epoch repetition requires fitting a repetition-aware decay curve instead of treating reused tokens identically to fresh text.

### Mid-scale validation gates

Before committing millions of dollars to a frontier training cluster, teams execute an intermediate checkpoint run, such as $7\text{B}$ or $10\text{B}$ parameters, judged against predeclared loss and throughput tolerances. If validation cross-entropy misses its $\pm 0.02$-nat gate (chosen from baseline run noise and decision risk), pause to inspect the fit, corpus mix, optimizer behavior, and numerical stability. Never blame mathematical loss drift on slow communication collectives that leave completed optimization schedules intact; when throughput misses its separate target, profile kernels and cluster utilization independently:

<!-- leetllm: test, output=show, continue=scaling-capped, deps=numpy -->
```python title="stop-on-a-mid-scale-miss.py"
import numpy as np

tolerance = 0.02
mid_pred = scaling_loss(10e9, 100e9, E, A, alpha_fit, B, beta_fit)
measured_mid_loss = 2.350
residual = measured_mid_loss - mid_pred
decision = (
    "proceed_to_further_checks"
    if np.abs(residual) <= tolerance
    else "hold_and_investigate"
)
assert decision == "hold_and_investigate"
print(f"Mid-scale predicted={mid_pred:.3f}, observed={measured_mid_loss:.3f}")
print(f"Absolute error={np.abs(residual):.3f}, tolerance={tolerance:.3f}")
print(decision)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Mid-scale predicted=2.310, observed=2.350
Absolute error=0.040, tolerance=0.020
hold_and_investigate
```
<!-- leetllm: output:end -->

```checkpoint
You fit a loss surface on 100M to 1B proxy runs and forecast 2.091 at 70B / 1.4T. What should you do before booking that run?
---
Keep the held-out error, then run a mid-scale check on the real tokenizer, mix, and stack. Predeclare a tolerance and stop if the check misses it. This empirical fit has no forecast band and does not measure the 70B loss directly.
```

## Failure modes, breakdowns, and scope limits

Scaling laws summarize empirical regularities observed inside specific experimental setups rather than rigid physical invariants. Every power-law extrapolation rests on stable training mixtures, fixed tokenization, and consistent optimization dynamics. Knowing where those fits break prevents costly cluster misallocations.

### The 20:1 ratio depends on the training setup

Any empirical token-to-parameter ratio is tied tightly to the corpus distribution, tokenizer, architecture, optimizer schedule, and parameter counting convention used when fitting it. Adding dense code or generated mathematics alters loss curvature and repetition tolerance, requiring fresh measurement on the target mix. Even across fixed setups, extreme extrapolation breaks early fits: Sardana et al. trained 47 models from 150M to 6B parameters up to 10,000 tokens per parameter and found that laws fitted strictly below 100:1 systematically overstated loss gains under severe overtraining.[^sardana2024]

### Theoretical FLOPs are not actual hardware cluster bills

The $C \approx 6ND$ estimate captures dominant dense matrix multiplications while dropping quadratic sequence attention, norms, optimizer states, and collectives. Model FLOPs utilization (MFU) compares productive model FLOPs/s against nominal hardware peak, fluctuating with numerical precision, batch geometry, context length, and kernel stack. Because memory ceilings, pipeline stalls, and inter-node communication shape true wall-clock cost, measure tokens per GPU-second and cluster dollars directly on the target hardware instead of projecting from an assumed constant utilization rate.

### Low cross-entropy loss is not deployed capability

Held-out cross-entropy measures next-token probability fit over a specific validation text slice (with perplexity equal to $\exp(L)$ when $L$ is measured in nats). Neither metric directly quantifies factual reliability, instruction compliance, tool use, or code correctness. Complete budgets therefore reserve room for task-specific benchmark suites alongside post-training stages such as supervised fine-tuning and preference optimization (<span data-glossary="rlhf">RLHF</span> [^ouyang2022]), because hitting a loss forecast alone never certifies an interactive assistant.

### Emergent abilities as metric artifacts

Wei et al. [^wei2022b] drew widespread attention to "emergent abilities," documenting benchmarks where task accuracy stayed near zero across small scales before jumping sharply past a parameter threshold. Subsequent analysis by Schaeffer et al. [^schaeffer2023] showed that discontinuous metric transforms and small evaluation sets can create sharp threshold jumps out of smooth underlying progress: in a simple independent-token model where each of five answer tokens succeeds smoothly with probability $p$, exact-match probability is $p^5$, a smooth curve that still reads zero on small sample sizes until $p$ climbs high enough to produce hits. Switching from brittle exact-match scoring to smooth partial-credit metrics revealed continuous scaling in the paper's benchmark audits, while other complex tasks can still exhibit genuine nonlinear transitions; always inspect metric discretization and sample size before declaring a phase transition.

```checkpoint
Why can a scaling study predict great loss but still produce a bad coding assistant?
---
Scaling laws predict pre-training loss, not factual accuracy, instruction following, domain reliability, or safety behavior. A coding assistant still needs data-quality checks, post-training, evaluation, and alignment work after the pre-training budget is chosen.
```

### Architecture sensitivity: Mixture-of-Experts and state space models

Non-dense architectures alter how parameters map to weight memory and per-token arithmetic. Teams must define architecture-specific sizing variables instead of assuming a dense fit carries over. Measuring proxy curves on the target topology keeps resource forecasts honest:

- **<span data-glossary="mixture-of-experts">Mixture-of-Experts (MoE)</span>** ([lesson](/learn/mixture-of-experts-architecture)): total weights drive weight storage, while selected experts plus shared layers drive much of the per-token arithmetic. Bandwidth also depends on which weights a batch touches, caching, and placement. Active-parameter $6ND$ can be a rough proxy, but routing, attention, shared components, and communication still matter. Total parameters alone don't determine compute or task quality.
- **[State Space Models (SSMs)](/learn/state-space-models-mamba-alternatives)**: fixed-size recurrent state changes sequence-memory and compute behavior. Dense attention has quadratic pairwise work during full-sequence processing; cached autoregressive attention reads a growing context per step. These aren't the same comparison as a recurrent update at fixed state size.

Always convert a cluster compute budget into a concrete candidate allocation before launching a run. State explicitly whether that split optimizes pre-training loss, lifetime inference FLOPs, or a data-constrained frontier. Finally, validate architectural changes against measured proxy throughput and loss curves before scaling up.

```checkpoint
Why can't you blindly apply dense-transformer scaling laws to MoE models?
---
Dense scaling laws treat parameter count as the main size variable. MoE models split total parameters from active parameters per token. Total parameters affect memory and routing; active parameters affect compute. That means you need a separate empirical scaling fit.
```

```mastery-quiz
[
  {
    "question": "A dense-projection training proxy counts forward, input-gradient and weight-gradient contractions. A 2B-parameter model processes 30B token presentations. Selective checkpointing is replaced by recomputing one complete counted forward pass. Ignoring other work, what ordinary and recomputed totals follow?",
    "options": [
      "Ordinary 1.2×10²⁰; recomputed 2.4×10²⁰ FLOPs.",
      "Ordinary 3.6×10²⁰; recomputed 7.2×10²⁰ FLOPs.",
      "Ordinary 3.6×10²⁰; recomputed 4.8×10²⁰ FLOPs.",
      "Ordinary 4.8×10²⁰; recomputed 6.0×10²⁰ FLOPs."
    ],
    "answer": "Ordinary 3.6×10²⁰; recomputed 4.8×10²⁰ FLOPs.",
    "explanation": "The three contractions contribute 6ND=3.6×10²⁰. One full forward recomputation adds 2ND, giving 8ND=4.8×10²⁰. Doubling the backward pass or treating the forward pass as the whole training cost counts the wrong work."
  },
  {
    "question": "A two-term scaling law is L=1+3/√N+6/√D with fixed ND=400. Which allocation minimizes this positive half-power surface?",
    "options": [
      "N=10, D=40.",
      "N=20, D=20.",
      "N=40, D=10.",
      "N=5, D=80."
    ],
    "answer": "N=10, D=40.",
    "explanation": "The equal-exponent balance gives D/N=(B/A)²=(6/3)²=4. Combining that with ND=400 gives N=10, D=40. Equal growth does not require equal counts; reversing the coefficient ratio or using it without the exponent changes the proposed shape."
  },
  {
    "question": "A positive two-penalty fit has parameter exponent α=0.6 and token exponent β=0.3. Under the same 6ND constraint and fixed coefficients, compute increases eightfold. What optimal parameter and token multipliers follow?",
    "options": [
      "Parameters 4×; tokens 2×.",
      "Parameters 2×; tokens 2×.",
      "Parameters 8×; tokens 1×.",
      "Parameters 2×; tokens 4×."
    ],
    "answer": "Parameters 2×; tokens 4×.",
    "explanation": "The parameter exponent on compute is β/(α+β)=1/3; the token exponent is α/(α+β)=2/3. Therefore 8^(1/3)=2 and 8^(2/3)=4. Their product is 8; equating the two allocation exponents or attaching α directly to N reverses the result."
  },
  {
    "question": "Two fitted loss curves, F(C)=2+4/√C and G(C)=8/3+16/(3C), both match the measurements L(4)=4 and L(16)=3. What does each curve predict at C=64, and what does the gap between their forecasts measure?",
    "options": [
      "F=2.75, G=2.50. The gap measures the effect of choosing a different curve.",
      "F=2.50, G=2.75. The gap measures the effect of choosing a different curve.",
      "F=2.50, G=2.75. The gap measures the variation in loss across repeated runs at C=64.",
      "F=2.75, G=2.50. The gap measures the variation in loss across repeated runs at C=64."
    ],
    "answer": "F=2.50, G=2.75. The gap measures the effect of choosing a different curve.",
    "explanation": "F uses the square root of 64, so F(64)=2+4/8=2.50. G uses 64 itself, so G(64)=8/3+16/192=2.75. Reversing the pair assigns the higher forecast to the wrong curve. Both curves fit the two measurements exactly, yet their forecasts differ by 0.25. Measuring run-to-run variation at 64 would require repeated runs there."
  },
  {
    "question": "Assume two candidates meet the same deployed quality requirement. A is 40B parameters trained on 800B tokens; B is 20B on 2T. Use 6ND training and 2N per processed inference token. Training costs twice as many dollars per useful FLOP as serving. At what processed demand do proxy FLOPs and modeled dollars break even?",
    "options": [
      "FLOPs 2.4T; dollars 1.2T tokens.",
      "FLOPs 1.2T; dollars 1.2T tokens.",
      "FLOPs 1.2T; dollars 2.4T tokens.",
      "FLOPs 0.6T; dollars 1.2T tokens."
    ],
    "answer": "FLOPs 1.2T; dollars 2.4T tokens.",
    "explanation": "A costs 1.92×10²³ training FLOPs; B costs 2.40×10²³. The premium 4.8×10²² divided by 40B saved FLOPs/token is 1.2T processed tokens. Doubling the relative training price doubles the dollar crossing to 2.4T. These are token volumes, not request counts."
  },
  {
    "question": "A full training run uses ND=900 units of work, where N is model size and D is token count. Along this curve, fitted loss is lowest at N=10, D=90 and rises as N moves away from 10 in either direction. You have 30 token units and cannot repeat tokens. Which full-budget allocation gives the lowest fitted loss? If model size is then capped at N=20, what is the most work the run can do under both caps?",
    "options": [
      "N=30, D=30. With both caps, the maximum is 600 units.",
      "N=45, D=20. With both caps, the maximum is 600 units.",
      "N=30, D=30. With both caps, the maximum is 900 units.",
      "N=45, D=20. With both caps, the maximum is 900 units."
    ],
    "answer": "N=30, D=30. With both caps, the maximum is 600 units.",
    "explanation": "With at most 30 token units, spending 900 requires N≥900/30=30. Loss rises as N increases beyond 10, so the smallest feasible N gives the lowest loss. Moving from 30-by-30 to 45-by-20 spends the same 900 units but raises the fitted loss. With both caps, the largest run uses 20×30=600 units. Spending 900 at N=20 would take 45 token units."
  },
  {
    "question": "A 6B model generates three complete 256-token candidates per query without early stopping. Count only dense generation arithmetic. A second configuration doubles candidate count at the same length. Which first-configuration FLOPs and second-configuration cost multiplier follow?",
    "options": [
      "4.608×10¹² FLOPs; 2× generation arithmetic.",
      "9.216×10¹² FLOPs; 1× generation arithmetic.",
      "1.8432×10¹³ FLOPs; 2× generation arithmetic.",
      "9.216×10¹² FLOPs; 2× generation arithmetic."
    ],
    "answer": "9.216×10¹² FLOPs; 2× generation arithmetic.",
    "explanation": "Two×6×10⁹×256×3=9.216×10¹². Six equal-length candidates double that generation term. This calculation excludes prompt, attention and verifier costs and does not prove that extra candidates improve quality."
  },
  {
    "question": "Use f=ΣUᵢVᵢ at input 1 and loss ½(f−1)². U alternates +1/−1 at even widths. With base η=0.25, standard Vᵢ=1/√n and both rates η. The coordinated alternative uses Vᵢ=1/n, input rate ηn, output rate η/n. Both gradients use old weights. What new predictions at n=32 and n=128 follow?",
    "options": [
      "Standard 0.5/0.5; coordinated 8.25/32.25.",
      "Standard 8.25/32.25; coordinated 0.5/0.5.",
      "Standard 8.25/32.25; coordinated 1.0/1.0.",
      "Standard 8.0/32.0; coordinated 0.25/0.25."
    ],
    "answer": "Standard 8.25/32.25; coordinated 0.5/0.5.",
    "explanation": "The standard result is η(n+1), giving 8.25 and 32.25. The coordinated two old-weight gradient contributions each add η, so the result is 2η=0.5 at either width. Dropping a layer contribution or confusing width stability with exactly reaching target 1 changes the result."
  },
  {
    "question": "A sparse Mixture-of-Experts (MoE) accounting model stores 96B total parameters at 2 bytes each. Per token, it executes 8B selected expert parameters plus 4B shared parameters. For 50B presentations, what total weight payload and active dense-projection 6ND proxy follow, excluding routing, attention and communication?",
    "options": [
      "24 GB weights; 3.6×10²¹ training FLOPs.",
      "192 GB weights; 2.88×10²² training FLOPs.",
      "192 GB weights; 3.6×10²¹ training FLOPs.",
      "16 GB weights; 2.4×10²¹ training FLOPs."
    ],
    "answer": "192 GB weights; 3.6×10²¹ training FLOPs.",
    "explanation": "Storage counts 96B×2=192 decimal GB. Active arithmetic uses 8B+4B=12B, so 6×12B×50B=3.6×10²¹. Counting all stored experts overstates the active dense term; using only selected experts omits shared layers. This is not an architecture-specific quality fit."
  },
  {
    "question": "In an independent-token model, four answer tokens are independently correct with probability p each. Compare p=0.7 and p=0.8. A small exact-match evaluation reports 0 then 2 complete successes. Which expected whole-answer probabilities and interpretation follow?",
    "options": [
      "0.2401/0.4096. Finite counts do not prove a new mechanism.",
      "0.7/0.8. Exact-match expectations equal token accuracy.",
      "0.2401/0.4096. The first nonzero count identifies a discontinuity.",
      "0.9919/0.9984. A small sample can jump from zero matches to two as token accuracy improves smoothly."
    ],
    "answer": "0.2401/0.4096. Finite counts do not prove a new mechanism.",
    "explanation": "An exact match requires four correct tokens. Independence gives 0.7⁴=0.2401 and 0.8⁴=0.4096. The single-token probabilities are 0.7 and 0.8. Subtracting the chance of four wrong tokens from one gives 0.9919 and 0.9984, the probabilities of at least one correct token. The exact-match probability rises smoothly with p. A small sample can still go from zero matches to two, so the first nonzero count alone cannot demonstrate a discontinuity."
  }
]
```

> **Next:** Continue to [Pre-training Data at Scale](/learn/pre-training-data-pipelines-scale). Your fitted law and declared assumptions produce a candidate token budget. The next chapter asks how to extract, filter, deduplicate, mix, and pack useful data to meet it.
