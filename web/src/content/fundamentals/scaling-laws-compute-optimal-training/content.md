---
{
  "id": "scaling-laws-compute-optimal-training",
  "title": "Scaling Laws & Compute-Optimal Training",
  "slug": "scaling-laws-compute-optimal-training",
  "section": "Training, Fine-Tuning & Alignment",
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

You have a fixed training budget of $10^{24}$ floating-point operations (FLOPs), enough to keep a large GPU cluster busy for weeks. One engineer proposes training a massive 200-billion-parameter model on a modest dataset. Another proposes a compact 30-billion-parameter model trained on nearly seven times as many tokens. Both plans burn the exact same cluster bill, yet one can produce a markedly worse model or cost four times as much to serve in production.

How do you decide before spending millions of dollars? <span data-glossary="scaling-law">Scaling laws</span> answer that question by fitting empirical power laws to <span data-glossary="cross-entropy">cross-entropy</span> loss as a function of three quantities: parameter count ($N$), training token presentations ($D$), and training compute ($C$). Kaplan et al. found that parameter count should grow much faster than data as compute increases,[^kaplan2020] while Hoffmann et al.'s <span data-glossary="chinchilla-scaling">Chinchilla study</span> overturned that recipe and scaled both in nearly equal proportion.[^hoffmann2022] Later work reconciled why those two studies disagreed and added the missing half of the bill: lifetime serving compute.[^porian2024][^sardana2024]

Before comparing any two scaling curves, nail down the three variables:

- **Parameters ($N$):** The declared trainable weight count. Check whether a study includes <span data-glossary="embedding">embedding</span> and output-projection tables (tying input and output embeddings saves memory, not vocabulary-projection arithmetic).
- **Training tokens ($D$):** Total <span data-glossary="subword-tokenization">subword</span> token presentations seen during training. Keep this distinct from unique corpus size, because repeating tokens over multiple epochs follows a different decay curve than fresh text.
- **Compute ($C$):** Total useful training FLOPs, distinct from wall-clock time, accelerator peak throughput, or cloud dollars.

### Where the 6ND shortcut comes from

Every dense transformer scaling calculation starts with a remarkably tidy approximation: $C \approx 6ND$ FLOPs. That factor of 6 comes straight from counting the large matrix multiplications inside one forward pass and one backward pass.

Pass a token's activation row $X$ through a dense weight matrix $W \in \mathbb{R}^{d_{\text{in}} \times d_{\text{out}}}$ to compute $Y = XW$. Each inner-product element uses one multiply and one add, giving $2 d_{\text{in}} d_{\text{out}}$ FLOPs per token. Summing across all $N$ counted weights gives:

$$
C_{\text{forward}} \approx 2N \text{ FLOPs per token}
$$

Backpropagation through each dense matrix executes two equally sized matrix multiplications:

1. **Activation gradients:** $\nabla_X L = (\nabla_Y L)W^T$, costing $2N$ FLOPs per token.
2. **Weight gradients:** $\nabla_W L = X^T(\nabla_Y L)$, costing another $2N$ FLOPs per token.

Together, the backward pass costs $4N$ FLOPs per token. Add the forward pass ($2N$) and multiply by $D$ tokens to get the canonical dense training proxy:

$$
C_{\text{backward}} \approx 4N \text{ FLOPs per token}, \qquad C_{\text{train}} \approx 6ND \text{ FLOPs}
$$

Two common variations change the leading constant immediately. Turning on full <span data-glossary="activation-checkpointing">activation checkpointing</span> discards intermediate activations and recomputes one extra forward pass during backprop, raising training cost from $6ND$ to roughly $8ND$. During inference there is no backward pass at all, so dense per-token arithmetic drops to $2N$. (These linear-layer proxies leave out quadratic sequence attention, layer norms, and optimizer overhead, so long contexts or small models with huge vocabularies need the exact FLOP count.[^porian2024])

As a quick anchor: training a 1B dense model on 20B tokens takes roughly $6 \times 10^9 \times 2 \times 10^{10} = 1.2 \times 10^{20}$ FLOPs. Doubling both parameters and tokens quadruples compute to $4.8 \times 10^{20}$ FLOPs.

## Double parameters, double data, or both

Imagine four controlled runs sharing the same tokenizer, data mixture, and validation split. Starting from a 1B-parameter baseline trained on 10B tokens, we double parameters, double tokens, or double both:

| Experiment | Parameters ($N$) | Tokens ($D$) | Relative compute ($6ND$) | Cross-entropy loss (nats) |
|---|---|---|---|---|
| Baseline | 1B | 10B | 1x | 2.80 |
| Double model size | 2B | 10B | 2x | 2.60 |
| Double data | 1B | 20B | 2x | 2.55 |
| Double both | 2B | 20B | 4x | 2.35 |

Both middle runs burn identical compute ($2\times$), yet spending that doubling on more tokens beats doubling parameters by $0.05$ nats. Doubling both axes drops loss even further because capacity and data relieve separate bottlenecks. Notice also that comparing losses requires a fixed tokenizer: cross-entropy is measured in nats per token, so switching tokenizers changes characters per token and breaks direct comparisons.

When a power law takes the form $L(C) = E + K C^{-\alpha}$ with an irreducible entropy floor $E$, equal multiplicative steps in compute yield smoothly shrinking absolute loss drops.

<figure>
  <img src="illustrations/_generated/power_law_returns_dark.png" alt="Log-compute plot for the power law L(C)=2+C to the negative 0.05 shows losses 3.000, 2.944, 2.891, 2.841, and 2.794 across equal 3.16-fold compute steps. Four bars below use a shared 0.060 scale and show the successive loss drops shrinking from 0.056 to 0.047." />
  <figcaption>Equal multiplicative steps in compute move equal distances along the log axis while producing progressively smaller absolute reductions in cross-entropy loss.</figcaption>
</figure>

Take Kaplan's single-axis parameter exponent $\alpha_N \approx 0.076$: a $10\times$ jump in parameters cuts the power-law term by only $16.1\%$, and a $100\times$ jump cuts it by $29.5\%$.

<!-- leetllm: test, output=show, deps=numpy -->
```python title="power-law-diminishing-returns.py"
import numpy as np

alpha_n = 0.076
multipliers = np.array([2, 10, 100])
scaled_terms = np.power(multipliers, -alpha_n)
reductions = 1.0 - scaled_terms

for mult, term, red in zip(multipliers, scaled_terms, reductions):
    print(f"{mult:>3}x parameters -> {term:.3f}x loss term ({red:.1%} reduction)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
  2x parameters -> 0.949x loss term (5.1% reduction)
 10x parameters -> 0.839x loss term (16.1% reduction)
100x parameters -> 0.705x loss term (29.5% reduction)
```
<!-- leetllm: output:end -->

```checkpoint
Your team can either double parameters from 1B to 2B while keeping data at 10B tokens, or keep 1B parameters and double data to 20B tokens. Which option gives lower loss in the table?
---
Doubling data gives lower loss in this table (2.55 versus 2.60). Neither axis wins universally; parameters and tokens relieve different bottlenecks depending on which one currently constrains the run.
```

## Kaplan scaling laws (2020)

Kaplan et al.[^kaplan2020] mapped dense decoder-only transformer loss across orders of magnitude in parameters, tokens, and compute, holding the other variables abundant while sweeping each axis:

1. **Parameters ($N$, non-embedding weights):** With abundant data and compute, $L(N) \propto N^{-\alpha_N}$ with $\alpha_N \approx 0.076$.
2. **Fresh tokens ($D$):** With ample model capacity and before overfitting, $L(D) \propto D^{-\alpha_D}$ with $\alpha_D \approx 0.095$.
3. **Compute frontier ($C_{\min}$):** Along the batch-efficiency-adjusted optimal frontier, $L(C_{\min}) \propto C_{\min}^{-\alpha_C}$ with $\alpha_C \approx 0.050$.

When jointly optimizing $N$ and $D$ at fixed compute, Kaplan et al. found a sharply lopsided allocation:

$$
N_{\text{opt}} \propto C^{0.73}, \qquad D_{\text{opt}} \propto C^{0.27}
$$

Under that rule, a $100\times$ jump in compute calls for growing parameters nearly $29\times$ while expanding tokens only $3.5\times$. That conclusion shaped the first generation of frontier LLMs: OpenAI trained GPT-3[^brown2020] at 175B parameters on 300B tokens (1.7:1 tokens per parameter), and DeepMind trained Gopher at 280B parameters on 300B tokens (1.07:1).

<!-- leetllm: test, output=show, deps=numpy -->
```python title="allocation-exponents.py"
import numpy as np

frontiers = {
    "Kaplan": np.array([0.73, 0.27]),
    "Chinchilla": np.array([0.50, 0.50]),
}
for compute_multiplier in (10, 100):
    print(f"{compute_multiplier}x training compute")
    for name, exps in frontiers.items():
        n_mult, d_mult = np.power(compute_multiplier, exps)
        print(f"  {name:<10} N={n_mult:5.2f}x, D={d_mult:5.2f}x")
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
  <figcaption>Along the same 100× iso-FLOP contour, Kaplan grows parameters aggressively (28.84× vs. 3.47×), Chinchilla scales both evenly (10× each), and inference-aware overtraining shifts compute toward tokens (2.5× vs. 40×).</figcaption>
</figure>

```checkpoint
Why did Kaplan-era scaling produce parameter-heavy models?
---
Kaplan's compute-optimal frontier fit $N_{\rm opt}\propto C^{0.73}$ and $D_{\rm opt}\propto C^{0.27}$ allocated most new compute to parameter count rather than training tokens, leading to massive models trained on relatively small corpora.
```

## The Chinchilla reallocation (2022)

Two years later, Hoffmann et al.[^hoffmann2022] trained over 400 models from 70M to 16B parameters across 5B to 500B tokens and reached a very different verdict: GPT-3 and Gopher were severely undertrained. Parameters and tokens should grow together, roughly as the square root of compute.

Why did two rigorous studies disagree so sharply ($C^{0.73}$ vs. $C^{0.50}$)? Hoffmann et al. pointed to the learning-rate schedule: Kaplan et al. read intermediate checkpoints off a single long cosine-decay schedule, penalizing runs stopped early before the learning rate fully decayed. Later, Porian et al.[^porian2024] ran a controlled reproduction and uncovered three even larger factors: counting vocabulary output-head FLOPs, avoiding oversized warmup periods on small models, and scaling learning rate, batch size, and AdamW $\beta_2$ cleanly with model size.

> **Key insight:** A scaling study's optimal $D/N$ slope depends on every hyperparameter that interacts with scale. Always distinguish changes that shift loss uniformly from changes that tilt the optimal balance between weights and tokens.

### Deriving the compute-optimal split

Hoffmann et al. cross-checked their conclusion with three independent methods:

| Approach | Methodology | Parameter exponent ($a$) | Token exponent ($b$) |
|---|---|---|---|
| 1. Empirical envelope | Lower loss envelope across 400+ runs | $0.50$ | $0.50$ |
| 2. IsoFLOP profiles | Loss minimum along constant-compute slices | $0.49$ | $0.51$ |
| 3. Parametric loss fit | L-BFGS fit to $L(N, D) = E + A N^{-\alpha} + B D^{-\beta}$ | $0.46$ | $0.54$ |

Approach 3 gives us a clean closed-form optimization problem. With positive constants $(E, A, B, \alpha, \beta)$:

$$
L(N, D) = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}
$$

Substitute the budget constraint $D = C / (6N)$, differentiate with respect to $N$, and set the derivative to zero:

$$
\frac{dL}{dN} = -\alpha A N^{-\alpha - 1} + \beta B \left(\frac{6}{C}\right)^\beta N^{\beta - 1} = 0
$$

Multiply through by $N$ to see the geometry at the optimum:

$$
\alpha \frac{A}{N^\alpha} = \beta \frac{B}{D^\beta}
$$

At the minimum, the marginal loss gain from a 1% increase in parameters equals the marginal loss gain from a 1% increase in tokens ($\partial L / \partial \log N = \partial L / \partial \log D$). Solving this balance alongside $6ND = C$ yields exact closed-form scaling laws:

$$
N^*(C) = \left(\frac{\alpha A}{\beta B}\right)^{\frac{1}{\alpha + \beta}} \left(\frac{C}{6}\right)^{\frac{\beta}{\alpha + \beta}}, \qquad D^*(C) = \left(\frac{\beta B}{\alpha A}\right)^{\frac{1}{\alpha + \beta}} \left(\frac{C}{6}\right)^{\frac{\alpha}{\alpha + \beta}}
$$

Notice that the two compute exponents $a = \beta / (\alpha + \beta)$ and $b = \alpha / (\alpha + \beta)$ always sum to 1. Plugging in Hoffmann et al.'s fitted $\alpha \approx 0.34$ and $\beta \approx 0.28$ gives $a \approx 0.45$ and $b \approx 0.55$, right next to the $0.50 / 0.50$ equal-scaling summary:

$$
N \propto \sqrt{C}, \qquad D \propto \sqrt{C}
$$

In practice, teams remember this as the **20 tokens per parameter** rule of thumb ($D \approx 20N$). Keep one subtlety straight: equal exponents ($\alpha = \beta = \gamma$) make $D^*/N^*$ constant, but the value of that constant is $(B/A)^{1/\gamma}$, which depends on your tokenizer, architecture, and data mix rather than being a universal law of nature.[^hoffmann2022]

<!-- leetllm: test, output=show, deps=numpy -->
```python title="equal-growth-and-chinchilla-sizing.py"
import numpy as np

# 1. Equal exponents (gamma=0.5) fix the growth slope, not the D/N ratio.
gamma, product = 0.5, 1e6
for a, b in [(1.0, 1.0), (2.0, 8.0)]:
    ratio = (b / a) ** (1.0 / gamma)
    n = np.sqrt(product / ratio)
    print(f"A={a:.0f}, B={b:.0f} -> N={n:.0f}, D={ratio * n:.0f}, optimal D/N={ratio:.0f}:1")

# 2. Sizing a 1e24 FLOP dense run under the 20:1 rule of thumb.
flops, r = 1e24, 20.0
n_opt = np.sqrt(flops / (6.0 * r))
d_opt = r * n_opt
print(f"At 1e24 FLOPs (20:1): N={n_opt / 1e9:.1f}B params, D={d_opt / 1e12:.2f}T tokens")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A=1, B=1 -> N=1000, D=1000, optimal D/N=1:1
A=2, B=8 -> N=250, D=4000, optimal D/N=16:1
At 1e24 FLOPs (20:1): N=91.3B params, D=1.83T tokens
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/kaplan_chinchilla_frontier_dark.png" alt="Equal-unit log axes compare fitted allocation growth with compute: Kaplan parameter growth has slope 0.73, Kaplan token growth slope 0.27, and Chinchilla balanced growth slope 0.50. At 100-fold compute, their normalized multipliers are 28.84/3.47 and 10/10. A separate bar strip shows model-specific D/N ratios of 1.7:1 for GPT-3, 20:1 for Chinchilla, and 38.5:1 for Llama 3 405B." />
  <figcaption>Fitted growth exponents across compute (left) alongside historical $D/N$ snapshots for GPT-3, Chinchilla, and Llama 3 405B (right).</figcaption>
</figure>

### Chinchilla vs. Gopher: the frontier test

DeepMind tested its prediction directly by training 70B **Chinchilla** on 1.4T tokens at roughly the same compute budget as 280B **Gopher** trained on 300B tokens.[^hoffmann2022]

| Model | Nominal parameters | Tokens | Nominal $D/N$ | Reported shared budget | $6ND$ proxy |
|---|---|---|---|---|---|
| Gopher | 280B | 300B | 1.07:1 | $5.76\times10^{23}$ | $5.04\times10^{23}$ |
| Chinchilla | 70B | 1.4T | 20:1 | $5.76\times10^{23}$ | $5.88\times10^{23}$ |

Chinchilla beat Gopher across average MMLU, BIG-bench, and LAMBADA while requiring $4\times$ fewer parameters, cutting weight memory and dense per-token inference FLOPs by roughly $4\times$. That result unlocked the next realization: if shrinking parameters makes serving dramatically cheaper, why stop at the *training*-optimal ratio?

```checkpoint
For Chinchilla-style compute-optimal training, how many tokens does a 70B dense model need, and why was that also a serving win?
---
At roughly 20 tokens per parameter, 70B requires 1.4T tokens. Matching a 280B model's training budget with a 4x smaller checkpoint cuts weight footprint and dense inference FLOPs per token by roughly 4x.
```

## Beyond Chinchilla: inference-aware scaling

Chinchilla minimizes pre-training loss for a fixed *training* budget ($C_{\text{train}}$). Once a model serves trillions of tokens in production, serving compute dominates. Under the $6ND$ training and $2NQ$ inference proxies, cumulative inference FLOPs exceed training FLOPs as soon as served volume passes $Q > 3D$ (about $4.2\text{T}$ served tokens for a model trained on $1.4\text{T}$ tokens).

That is why modern labs deliberately **overtrain** smaller models far past 20:1. "Not training-optimal" never means "stopped learning"; it means paying extra training FLOPs upfront to buy a smaller, faster model for every future user request.

Sardana et al.[^sardana2024] formalized this by minimizing total lifetime compute:

$$
C_{\text{total}} = C_{\text{train}} + C_{\text{infer}} = 6ND + 2N \cdot Q = 2N(3D + Q)
$$

Suppose two models achieve the same target quality: a larger Chinchilla-style model $(N_1, D_1)$ and a smaller overtrained model $(N_2 < N_1, D_2 \gg 20 N_2)$. Model 2 pays an upfront training premium $\Delta C_{\text{train}} = 6(N_2 D_2 - N_1 D_1)$ and saves $\Delta C_{\text{infer/token}} = 2(N_1 - N_2)$ dense FLOPs on every served token. Equating their lifetime FLOPs gives the **break-even token volume**:

$$
Q_{\text{break-even}} = \frac{3(N_2 D_2 - N_1 D_1)}{N_1 - N_2} = \frac{\Delta C_{\text{train}}}{\Delta C_{\text{infer/token}}}
$$

If training FLOPs and inference FLOPs carry different dollar prices ($p_t$ and $p_i$), the financial crossing simply scales by $p_t / p_i$.

### Concrete break-even: 70B/1.4T vs. 30B/4.0T

Compare a 70B Chinchilla model trained on 1.4T tokens ($5.88 \times 10^{23}$ FLOPs) against an overtrained 30B model trained on 4.0T tokens ($7.20 \times 10^{23}$ FLOPs) that hits the same quality bar. The 30B model costs $1.32 \times 10^{23}$ more training FLOPs upfront, then saves $80\text{B}$ dense FLOPs on every served token.

<figure>
  <img src="illustrations/_generated/inference_break_even_dark.png" alt="Assuming equal model quality, total training-plus-serving FLOPs cross at 1.65 trillion served tokens. At the crossing each candidate costs 8.19×10²³ FLOPs: the 70B model is 5.88 training plus 2.31 serving, while the 30B model is 7.20 training plus 0.99 serving. Stacked bars share the same total scale." />
  <figcaption>At equal quality, the 70B and 30B candidates tie at 1.65T served tokens ($8.19 \times 10^{23}$ total FLOPs). Below 1.65T tokens the 70B model is cheaper; above it the overtrained 30B model wins.</figcaption>
</figure>

<!-- leetllm: test, output=show, deps=numpy -->
```python title="inference-break-even.py"
import numpy as np

names = ["70B / 1.4T", "30B / 4.0T"]
params = np.array([70e9, 30e9])
train_tokens = np.array([1.4e12, 4.0e12])

train_flops = 6.0 * params * train_tokens
infer_flops_per_token = 2.0 * params
break_even = (train_flops[1] - train_flops[0]) / (
    infer_flops_per_token[0] - infer_flops_per_token[1]
)
print(f"Training FLOPs: A={train_flops[0]:.2e}, B={train_flops[1]:.2e}")
print(f"Break-even served tokens: {break_even:.2e}")

demands = np.array([1e12, 3e12])
total_flops = train_flops + 2.0 * np.outer(demands, params)
for demand, idx in zip(demands, np.argmin(total_flops, axis=1)):
    print(f"At {demand / 1e12:.0f}T served tokens -> cheaper candidate: {names[idx]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Training FLOPs: A=5.88e+23, B=7.20e+23
Break-even served tokens: 1.65e+12
At 1T served tokens -> cheaper candidate: 70B / 1.4T
At 3T served tokens -> cheaper candidate: 30B / 4.0T
```
<!-- leetllm: output:end -->

You can see this economic shift across the Llama family:

- **LLaMA 1:**[^touvron2023] 7B on 1.0T tokens ($\approx 143:1$) and 65B on 1.4T ($\approx 21.5:1$).
- **Llama 2:**[^touvron2023a] 7B on 2.0T tokens ($\approx 286:1$) and 70B on 2.0T ($\approx 28.6:1$).
- **Llama 3 8B:** [15T+ tokens](https://huggingface.co/meta-llama/Meta-Llama-3-8B) ($\approx 1{,}875:1$, nearly $94\times$ the 20:1 rule).
- **Llama 3 405B:**[^dubey2024] 15.6T tokens in initial pre-training ($\approx 38.5:1$).

```checkpoint
What question does inference-aware scaling ask that Chinchilla doesn't?
---
Chinchilla minimizes pre-training loss under a fixed training-compute budget. Inference-aware scaling minimizes total lifetime compute (or dollars) across training plus all served tokens at a target quality.
```

## Finite public text and test-time compute

Aggressive overtraining runs straight into a new constraint: how much high-quality public human text exists? Villalobos et al.[^villalobos2024] projected that rising single-run token appetites could intersect the effective stock of public human text (roughly $4 \times 10^{14}$ quality- and repetition-adjusted tokens) around 2028 (2026 to 2032 range).

> **Common mistake:** Training does not "use up" internet text like oil from a shared well. Four models trained for one epoch on the same 15T-token corpus log 60T total token presentations while drawing on only 15T unique tokens. The real bottleneck is single-run data appetite meeting finite fresh text, not cumulative token counts across releases.

| Four-run reuse scenario | Token presentations across all runs | Unique text in their union |
|---|---|---|
| Each uses the same 15T-token corpus once | 60T | 15T |
| Each uses a disjoint 15T-token corpus once | 60T | 60T |

To push beyond fresh web text, labs rely on disciplined multi-epoch schedules, verifier-checked synthetic data, and multimodal corpora (code, video, audio). Every substitute changes learning efficiency, so fresh-text scaling slopes must be re-measured on the new mix.

At deployment time, <span data-glossary="test-time-compute">test-time compute</span> adds an orthogonal scaling axis: instead of freezing all FLOPs into pre-trained weights, spend extra inference compute per hard prompt via longer reasoning chains (as in DeepSeek-R1[^deepseekai2025]), parallel candidate sampling, or verifier-guided search. Snell et al.[^snell2024] showed that routing extra test-time compute to harder math problems allowed a smaller model to match a single-pass model roughly $14\times$ its size under matched compute budgets. Because sampling $k$ candidates multiplies generation FLOPs linearly ($2 N L_{\text{out}} k$), an 8B model generating 512 tokens across 1, 4, and 16 candidates burns $8.19 \times 10^{12}$, $3.28 \times 10^{13}$, and $1.31 \times 10^{14}$ generation FLOPs per request, trading upfront training scale for per-query latency and spend.

## Running a scaling study in practice

Turning scaling laws from a paper into a cluster plan takes three concrete steps: transfer hyperparameters safely across widths, fit a loss surface while watching for floor ambiguity, and verify at mid-scale before committing the full budget.

### Zero-shot hyperparameter transfer with µP

If you tune a learning rate on a 100M proxy model and copy it directly to a 10B model, standard parametrization diverges or stalls as width $n$ grows. **Maximal Update Parametrization ($\mu$P)**[^yang2022] coordinates initialization scales and per-layer learning rates so feature updates stay $\Theta(1)$ at any width.

You can see the entire mechanism in ten lines of NumPy on the paper's two-layer linear model $f(1) = V^\top U$ with squared loss $\tfrac{1}{2}(f - 1)^2$ and alternating $U_i = \pm 1$ so initial output is $0$:

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
    print(f"width={width:>3}: standard={standard:5.1f}, muP={mup:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
width= 16: standard= 17.0, muP=2.0
width= 64: standard= 65.0, muP=2.0
width=256: standard=257.0, muP=2.0
```
<!-- leetllm: output:end -->

Under standard parametrization, one SGD step blows up linearly with width ($n + 1$). Under $\mu$P, scaling output init by $1/n$, input LR by $n$, and output LR by $1/n$ locks the update at $2.0$ across every width. That width stability is what lets teams tune base hyperparameters on a 40M proxy and transfer them to multi-billion-parameter runs.

### Fitting the surface, optimizing under a data cap, and checking mid-scale

Next, sweep small proxy runs across $N$ and $D$, hold out a larger run to check recovery, and extrapolate to target scale. Here is a complete workflow on a nine-point grid generated from $L(N, D) = 1.10 + 2.80 N^{-0.070} + 7.80 D^{-0.098}$:

<figure>
  <img src="illustrations/_generated/scaling_study_fit_dark.png" alt="Log-log map of eight small-scale runs, a distinct held-out point at 1B parameters and 100B tokens, and a forecast marker at 70B parameters and 1.4T tokens. The fit region covers only 0.1B–1B parameters and 1B–20B tokens. The fitted law predicts 2.408 at holdout versus 2.408 observed, residual +0.0002, and forecasts 2.091 at the target." />
  <figcaption>Eight small proxy runs (dashed box) fit the surface, one held-out run at 1B/100B checks recovery, and the fitted curve forecasts 2.091 at 70B/1.4T before a mid-scale verification run.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=scaling-fit, deps=numpy -->
```python title="fit-optimize-and-verify.py"
import numpy as np

def scaling_loss(n, d, e, a, alpha, b, beta):
    return e + a / np.power(n, alpha) + b / np.power(d, beta)

E, A, B = 1.10, 2.80, 7.80
runs = np.array([
    [1e8, 1e9, 2.895], [1e8, 5e9, 2.745], [1e8, 2e10, 2.634],
    [5e8, 1e9, 2.813], [5e8, 5e9, 2.663], [5e8, 2e10, 2.552],
    [1e9, 5e9, 2.631], [1e9, 2e10, 2.520], [1e9, 1e11, 2.408],
])
train, held = runs[:-1], runs[-1]

grid = np.arange(40, 121, 2) / 1000.0
ag, bg = np.meshgrid(grid, grid, indexing="ij")
preds = scaling_loss(train[:, 0:1, None], train[:, 1:2, None], E, A, ag[None], B, bg[None])
bi, bj = np.unravel_index(np.argmin(np.sum((preds - train[:, 2][:, None, None]) ** 2, axis=0)), ag.shape)
alpha_fit, beta_fit = float(ag[bi, bj]), float(bg[bi, bj])

hold_pred = scaling_loss(held[0], held[1], E, A, alpha_fit, B, beta_fit)
target_70b = scaling_loss(70e9, 1.4e12, E, A, alpha_fit, B, beta_fit)
print(f"Fitted: alpha={alpha_fit:.3f}, beta={beta_fit:.3f}")
print(f"Hold-out 1B/100B: pred={hold_pred:.3f}, obs={held[2]:.3f}, err={hold_pred - held[2]:+.4f}")

# 1. Closed-form unconstrained optimum for C = 6 * 70B * 1.4T
C = 6 * 70e9 * 1.4e12
n_opt = float(np.exp((np.log(alpha_fit * A / (beta_fit * B)) + beta_fit * np.log(C / 6)) / (alpha_fit + beta_fit)))
d_opt = C / (6 * n_opt)
print(f"Unconstrained optimum: {n_opt/1e9:.2f}B params, {d_opt/1e12:.2f}T tokens "
      f"(loss={scaling_loss(n_opt, d_opt, E, A, alpha_fit, B, beta_fit):.3f} vs 70B/1.4T={target_70b:.3f})")

# 2. Enforce a 2T unique-token cap with no repetition: N >= C / (6 * D_max)
data_cap = 2e12
n_cap = max(n_opt, C / (6 * data_cap))
d_cap = C / (6 * n_cap)
print(f"Data-capped (<=2T):    {n_cap/1e9:.2f}B params, {d_cap/1e12:.2f}T tokens "
      f"(loss={scaling_loss(n_cap, d_cap, E, A, alpha_fit, B, beta_fit):.3f})")

# 3. Mid-scale verification check at 10B / 100B (tolerance 0.02 nats)
mid_pred = scaling_loss(10e9, 100e9, E, A, alpha_fit, B, beta_fit)
mid_obs = 2.350
status = "proceed" if abs(mid_obs - mid_pred) <= 0.02 else "pause_and_investigate"
print(f"Mid-scale 10B/100B: pred={mid_pred:.3f}, obs={mid_obs:.3f} -> {status}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Fitted: alpha=0.070, beta=0.098
Hold-out 1B/100B: pred=2.408, obs=2.408, err=+0.0002
Unconstrained optimum: 7.82B params, 12.53T tokens (loss=2.074 vs 70B/1.4T=2.091)
Data-capped (<=2T):    49.00B params, 2.00T tokens (loss=2.086)
Mid-scale 10B/100B: pred=2.310, obs=2.350 -> pause_and_investigate
```
<!-- leetllm: output:end -->

Three practical lessons jump right out of that output. First, the unconstrained optimum on *this* surface is `7.82B / 12.53T` (1602:1), not 20:1, proving why you optimize your own fitted surface rather than borrowing another paper's ratio. Second, when clean text is capped at $D_{\max} = 2\text{T}$ with no repeats, the constrained optimum snaps to $N_{\text{capped}} = \max(N_*, C / (6 D_{\max})) = 49\text{B}$. Third, before booking the full 70B run, a 10B/100B mid-scale checkpoint flags a $0.040$-nat miss against the $0.020$-nat tolerance, prompting an investigation of the data mix, optimizer, or numerical stability before spending the full budget.

### Why sparse measurements hide floor ambiguity

Fitting a 5-parameter surface on too few compute scales is notoriously ill-conditioned. Even two exact observations $L(1) = 3.0$ and $L(100) = 2.5$ can be matched with zero error by completely different exponents: $\alpha = 0.1$ infers a floor $E = 1.645$ and forecasts $1.985$ at $C = 10^6$, while $\alpha = 0.2$ infers $E = 2.169$ and forecasts $2.222$.

<figure>
  <img src="illustrations/_generated/floor_ambiguity_dark.png" alt="Two parametric power-law curves both pass exactly through the normalized observations L(1)=3 and L(100)=2.5. With alpha 0.1, the fitted floor is 1.645 and loss at 1,000,000 is 1.985; with alpha 0.2, the floor is 2.169 and the forecast is 2.222. The curves separate beyond the two shared anchors." />
  <figcaption>Two curves pass identically through $L(1)=3.0$ and $L(100)=2.5$, yet diverge by 0.237 nats at $C=10^6$ because sparse anchors leave the floor $E$ and exponent $\alpha$ entangled.</figcaption>
</figure>

```checkpoint
You fit a loss surface on 100M to 1B proxy runs and forecast 2.091 at 70B / 1.4T. What should you do before booking the full run?
---
Check held-out prediction error across wide N and D coverage, then run an intermediate mid-scale checkpoint (such as 10B) on the real tokenizer, data mix, and stack with a pre-set error tolerance. Pause and diagnose if actual loss drifts outside that tolerance.
```

## Where scaling laws break down

Scaling laws are empirical regularities, not laws of physics. Four boundaries matter most when turning a curve into a production decision:

- **Extreme overtraining bends early curves:** Sardana et al. trained 47 models up to 10,000 tokens per parameter and found that laws fitted strictly below 100:1 systematically overstated gains under severe overtraining.[^sardana2024]
- **Theoretical FLOPs are not hardware bills:** $6ND$ ignores attention, collectives, and Model FLOPs Utilization (MFU). Measure tokens per GPU-second and dollar cost directly on the target cluster.
- **Low cross-entropy is not deployed capability:** Held-out cross-entropy (and perplexity $\exp(L)$) tracks next-token fit, not instruction following, tool use, or safety. Budget separately for SFT, preference optimization (<span data-glossary="rlhf">RLHF</span>[^ouyang2022]), and task benchmarks.
- **Metric artifacts can mimic "emergent abilities":** Wei et al.[^wei2022b] highlighted tasks whose exact-match accuracy stayed near zero before jumping sharply with scale. Schaeffer et al.[^schaeffer2023] showed how discontinuous metrics turn smooth per-token gains into apparent cliffs: if a 5-token answer succeeds independently with probability $p$ per token, exact-match accuracy is $p^5$, which stays near zero on small eval sets until $p$ climbs high enough. Switching to smooth partial-credit metrics often reveals continuous progress.
- **Non-dense architectures need their own variables:** For <span data-glossary="mixture-of-experts">Mixture-of-Experts (MoE)</span> ([lesson](/learn/mixture-of-experts-architecture)), total weights drive VRAM while active experts plus shared layers drive per-token FLOPs. For [State Space Models (SSMs)](/learn/state-space-models-mamba-alternatives), fixed-size recurrent state changes the sequence-length scaling profile. Fit proxy curves on the actual architecture rather than reusing dense-transformer constants.

```checkpoint
Why can't you blindly apply dense-transformer scaling laws to MoE models?
---
MoE models decouple total parameters (which govern memory capacity and routing) from active parameters per token (which govern per-token arithmetic), so dense parameter-count fits misstate both compute and memory scaling.
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
    "explanation": "2 × 6×10⁹ × 256 × 3 = 9.216×10¹² FLOPs. Doubling to six equal-length candidates doubles that generation term (excluding prompt, attention, and verifier costs)."
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
    "explanation": "Storage counts 96B×2=192 decimal GB. Active arithmetic uses 8B+4B=12B, so 6×12B×50B=3.6×10²¹. Counting all stored experts overstates the active dense term; using only selected experts omits shared layers."
  },
  {
    "question": "In an independent-token model, four answer tokens are independently correct with probability p each. Compare p=0.7 and p=0.8. A small exact-match evaluation reports 0 then 2 complete successes. Which expected whole-answer probabilities and interpretation follow?",
    "options": [
      "0.2401/0.4096. Small-sample counts alone are insufficient to infer a phase transition.",
      "0.7/0.8. Exact-match expectations equal token accuracy.",
      "0.2401/0.4096. The first nonzero count identifies a discontinuity.",
      "0.9919/0.9984. A small sample can jump from zero matches to two as token accuracy improves smoothly."
    ],
    "answer": "0.2401/0.4096. Small-sample counts alone are insufficient to infer a phase transition.",
    "explanation": "An exact match requires four correct tokens. Independence gives 0.7⁴=0.2401 and 0.8⁴=0.4096. The exact-match curve rises smoothly with p, yet a small evaluation sample can jump from 0 hits to 2 hits without any underlying discontinuity."
  }
]
```

> **Next:** Continue to [Pre-training Data at Scale](/learn/pre-training-data-pipelines-scale).
