---
{
  "id": "probability-for-machine-learning",
  "title": "Probability for Machine Learning",
  "slug": "probability-for-machine-learning",
  "section": "Math & Tensor Foundations",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Easy",
  "order": 4,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "A detector that catches 95 percent of abusive signups can still fill the review queue with clean accounts, and the flagged-pile counts show why.",
  "keyConceptsTested": [
    "events and sample spaces",
    "priors and posteriors",
    "conditional probability",
    "independence",
    "conditional independence and duplicated evidence",
    "Bayes rule",
    "base rates",
    "random variables, expectation, and variance",
    "common probability distributions",
    "Bernoulli, Categorical, Gaussian, and Softmax",
    "likelihood",
    "calibration",
    "log probabilities"
  ],
  "aliases": [
    "distributions-sampling-simulation"
  ]
}
---
<!-- leetllm: edition:reference:start -->

An abuse detector catches 95 percent of abusive signups, a recall figure that sounds decisive on its own. Yet once alerts hit a review queue, reviewers ask the reverse question: when a signup is flagged, how often is it actually abusive? When abuse is rare, even a 5 percent false-alarm rate across thousands of clean accounts fills the queue with normal signups unless you account for base rates.[^murphy2012][^bishop2006]

## Population base rates, expectation, and variance

Take 10,000 labeled signups: 100 abusive accounts and 9,900 clean accounts. Drawing one signup uniformly at random gives the **prior** (base rate) before seeing any detector signal:

$$
P(\text{abusive}) = \frac{100}{10000} = 0.01
$$

Formally, the 10,000 rows form the **sample space** $\Omega$ with $P(\Omega) = 1$, and any subset (such as abusive rows $A$ or flagged rows $B$) is an **event**.[^goodfellow2016] Encode each signup as a binary indicator (`Y = 1` for abusive, `Y = 0` for clean). That 0/1 mapping is a **Bernoulli** <span data-glossary="random-variable">random variable</span> with success rate $p = 0.01$. Its <span data-glossary="expected-value">expectation</span> recovers the base rate, and its <span data-glossary="variance">variance</span> measures scatter around that mean:

$$
E[Y] = p = 0.01, \qquad \text{Var}[Y] = E[(Y - E[Y])^2] = p(1 - p) = 0.0099
$$

<!-- leetllm: test, output=show, output_title="Indicator summary" -->
```python title="indicator-mean-is-probability.py"
import numpy as np

abuse_indicator = np.concatenate([np.ones(100), np.zeros(9_900)])
prior = float(np.mean(abuse_indicator))
variance = float(np.var(abuse_indicator))

print(f"prior = E[Y]: {prior:.4f}   Var[Y]: {variance:.4f}")
assert prior == 0.01 and np.isclose(variance, prior * (1.0 - prior))
```

<!-- leetllm: output:start -->
```text title="Indicator summary" output compact
prior = E[Y]: 0.0100   Var[Y]: 0.0099
```
<!-- leetllm: output:end -->

## Conditioning and Bayes rule from natural counts

Now run the detector on all 10,000 signups. It flags 95 percent of abusive accounts (**true-positive rate**, or recall: $P(\text{flagged} \mid \text{abusive}) = 0.95$) and falsely flags 5 percent of clean accounts (**false-positive rate**: $P(\text{flagged} \mid \text{clean}) = 0.05$).

Read the vertical bar `|` as "given": whatever sits on its right fixes the subset you count inside. Count both piles directly before writing any formula:

| Source of flagged signup | Calculation | Count |
|---|---|---:|
| abusive and flagged | `100 × 0.95` | 95 |
| clean and flagged | `9,900 × 0.05` | 495 |
| **all flagged signups** | `95 + 495` | **590** |

Because the clean pile is 99 times larger than the abusive pile, 5 percent of clean accounts outnumbers 95 percent of abusive accounts by more than five to one. <span data-glossary="conditional-probability">Conditional probability</span> filters to the 590 flagged rows first, giving the **posterior**:

$$
P(\text{abusive} \mid \text{flagged}) = \frac{95}{590} \approx 0.161
$$

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Bayes count breakdown showing 10,000 signups splitting at a 1 percent base rate into 100 abusive and 9,900 clean accounts, producing 95 true flags and 495 false alarms for a 16.1 percent posterior in the 590-item queue." />
  <figcaption>Conditioning swaps the denominator. The middle bars measure rates within each class separately, while the bottom bar pools all 590 flagged signups so 95 true catches make up 16.1 percent of the queue.</figcaption>
</figure>

Writing those same counts as fractions of all 10,000 signups connects **joint** probability $P(A \text{ and } B) = 95 / 10000 = 0.0095$, **marginal** probability $P(B) = 590 / 10000 = 0.059$, and <span data-glossary="bayes-theorem">Bayes' theorem</span>:

$$
P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)},
\qquad
P(B) = P(B \mid A)\,P(A) + P(B \mid \text{not }A)\,P(\text{not }A)
$$

Here $P(B \mid A)$ is the **likelihood** of observing flag $B$ under hypothesis $A$. A 100,000-signup NumPy simulation reproduces that exact `0.161` ratio:[^pythonRandom2026]

<!-- leetllm: test, output=show, output_title="Flagged-pile counts and simulation" -->
```python title="count-and-simulate-flagged-queue.py"
import numpy as np

rng = np.random.default_rng(12)
n_sim, prior, tpr, fpr = 100_000, 0.01, 0.95, 0.05

exact_posterior = (prior * tpr) / (prior * tpr + (1.0 - prior) * fpr)
abusive = rng.random(n_sim) < prior
flagged = rng.random(n_sim) < np.where(abusive, tpr, fpr)
sim_posterior = float(np.sum(abusive & flagged) / np.sum(flagged))

print(f"exact posterior={exact_posterior:.3f}   simulated posterior={sim_posterior:.3f}")
assert abs(sim_posterior - exact_posterior) < 0.02
```

<!-- leetllm: output:start -->
```text title="Flagged-pile counts and simulation" output compact
exact posterior=0.161   simulated posterior=0.161
```
<!-- leetllm: output:end -->

```checkpoint
Why does a 5 percent false-positive rate create 495 false alarms while a 95 percent true-positive rate creates only 95 true flags?
---
The two rates multiply different populations: 5 percent of 9,900 clean signups is 495, while 95 percent of 100 abusive signups is 95. Base rates govern which pile dominates the queue.
```

## Likelihood, independence, and duplicated signals

Probability fixes a parameter $p$ and predicts outcome frequencies; **likelihood** holds observed outcomes fixed and compares candidate values of $p$.[^murphy2012][^bishop2006] If three reviewed signups come back `[abuse, clean, abuse]`, independent Bernoulli trials give likelihood $L(p) = p^2(1 - p)$: `0.032` at $p = 0.20$, `0.125` at $p = 0.50$, and `0.128` at $p = 0.80$, peaking at the observed fraction $p = 2/3$ (`0.1481`). Unlike a probability distribution, $L(p)$ does not integrate to 1 over $p$. Recording only the unordered count ("2 of 3 abusive") adds a combinatorial factor of 3 (the Binomial form $3p^2(1 - p)$), leaving the maximizing $p = 2/3$ unchanged.[^nist2012binomial]

Two events $A$ and $B$ are **independent** when observing $B$ does not change $A$'s probability: $P(A \mid B) = P(A)$, or equivalently $P(A \text{ and } B) = P(A)P(B)$. A broken detector that flags 20 percent of abusive signups and 20 percent of clean signups leaves queue abuse stuck at the 1 percent prior. By contrast, **mutually exclusive** events (like abusive vs. clean) cannot occur together ($P(A \text{ and } B) = 0$) and are maximally dependent.

A subtler bug hits multi-signal pipelines: suppose a logging quirk copies our detector's alert bit into a second column `flag_copy`. Multiplying likelihoods ($P(B_1, B_2 \mid A) = P(B_1 \mid A)P(B_2 \mid A)$) is valid **only** when the signals are **conditionally independent** given the class.[^goodfellow2016] Treating a copied bit as independent squares both rates and fabricates `78.5%` confidence out of a `16.1%` queue:

<!-- leetllm: test, output=show -->
```python title="duplicated-versus-independent-flags.py"
import numpy as np

prior = 0.01
for label, abuse_rate, clean_rate in [
    ("uninformative (20%/20%)", 0.20, 0.20),
    ("copied flag (same bit)", 0.95, 0.05),
    ("truly independent pair", 0.95**2, 0.05**2),
]:
    num = prior * abuse_rate
    post = num / (num + (1.0 - prior) * clean_rate)
    print(f"{label:24}: {post:5.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
uninformative (20%/20%) :  1.0%
copied flag (same bit)  : 16.1%
truly independent pair  : 78.5%
```
<!-- leetllm: output:end -->

## Base-rate shifts, thresholds, and calibration

Hold the detector fixed (`TPR = 0.95`, `FPR = 0.05`) and move it to a riskier traffic surface. Raising the abuse base rate from 1 percent to 10 percent pushes queue precision from `16.1%` to `67.9%`; at 50 percent, precision reaches `95.0%`.

<figure>
  <img src="illustrations/_generated/posterior_vs_base_rate_dark.png" alt="Line curve and bar chart showing Bayesian posterior P(abuse given flag) rising from 16.1 percent at 1 percent prior to 67.9 percent at 10 percent and 95.0 percent at 50 percent while detector recall remains fixed at 95 percent and false-positive rate stays 5 percent." />
  <figcaption>Keeping the detector unchanged while base rates rise shifts queue precision dramatically. Confusing fixed 95 percent recall with posterior risk breaks down whenever base rates are small or shift across endpoints.</figcaption>
</figure>

On a single surface, raising a continuous score threshold trades recall for queue purity (**<span data-glossary="precision-recall">precision-recall tradeoff</span>**): tightening from broad review (`TPR = 0.95`, `FPR = 0.05`) to strict review (`TPR = 0.80`, `FPR = 0.01`) at a 1 percent base rate shrinks the flagged queue from 590 accounts (`16.1%` abusive, 5 misses) to 179 accounts (`44.7%` abusive, 20 misses).

Never assume a raw score of `0.80` means 80 percent actual risk. A model is <span data-glossary="calibration">calibrated</span> when predictions near $q$ experience the event roughly fraction $q$ of the time on representative held-out traffic. Modern neural networks often achieve strong accuracy while emitting overconfident probabilities,[^guo2017] so check calibration by bucketing held-out predictions against observed event rates.[^sklearnCalibration2026]

<!-- leetllm: test, output=show, output_title="Prior sweep and threshold tradeoff" -->
```python title="prior-sweep-and-thresholds.py"
import numpy as np

def flagged_posterior(prior: float, tpr: float, fpr: float) -> float:
    vals = np.array([prior, tpr, fpr], dtype=np.float64)
    if np.any(~np.isfinite(vals)) or np.any((vals < 0.0) | (vals > 1.0)):
        raise ValueError("probabilities must be finite values in [0, 1]")
    denom = prior * tpr + (1.0 - prior) * fpr
    if denom == 0.0:
        raise ValueError("evidence probability must be greater than 0")
    return float((prior * tpr) / denom)

for p in (0.01, 0.10, 0.50):
    print(f"prior={p:.2f} -> posterior={flagged_posterior(p, 0.95, 0.05):.3f}")

for mode, tpr, fpr in [("broad ", 0.95, 0.05), ("strict", 0.80, 0.01)]:
    rate = 0.01 * tpr + 0.99 * fpr
    print(f"{mode}: review_rate={rate:.2%}  queue_abuse={flagged_posterior(0.01, tpr, fpr):.2%}  recall={tpr:.0%}")

try:
    flagged_posterior(0.01, 0.0, 0.0)
except ValueError as err:
    print("rejected:", err)
```

<!-- leetllm: output:start -->
```text title="Prior sweep and threshold tradeoff" output compact
prior=0.01 -> posterior=0.161
prior=0.10 -> posterior=0.679
prior=0.50 -> posterior=0.950
broad : review_rate=5.90%  queue_abuse=16.10%  recall=95%
strict: review_rate=1.79%  queue_abuse=44.69%  recall=80%
rejected: evidence probability must be greater than 0
```
<!-- leetllm: output:end -->

## Core ML distributions: Bernoulli, Categorical, Gaussian, and Softmax

Every <span data-glossary="probability-distribution">probability distribution</span> encodes two choices: its **support** (which values can occur) and how probability spreads across them. Discrete variables use a **probability mass function (PMF)** whose bars sum to `1`. Continuous variables use a **probability density function (PDF)** where area over an interval equals probability (any exact real point has probability zero) and a **cumulative distribution function (CDF)** $F(t) = P(X \le t)$ giving accumulated probability up to $t$.[^murphy2012][^bishop2006]

Four core families cover most ML modeling and LLM inference:

| Family | Type & support | Parameters | Key ML / LLM role |
|---|---|---|---|
| **Bernoulli** | Discrete `{0, 1}` | $p \in [0, 1]$ | Binary labels, pass/fail evals (mean $p$, variance $p(1-p)$) |
| **Categorical** | Discrete `{1, ..., K}` | $\mathbf{p}$ summing to `1` | Multi-class routing and next-token choice over a vocabulary |
| **Gaussian (Normal)** | Continuous $(-\infty, +\infty)$ | mean $\mu$, std $\sigma$ | Regression residuals, weight initialization, continuous sensor noise |
| **Binomial / Poisson** | Discrete counts `0, 1, ...` | $(n, p)$ or rate $\lambda$ | Successes in $n$ trials (`np`, `np(1-p)`) or event arrivals per window[^nist2012binomial][^nist2012poisson] |

Matching support prevents subtle bugs. A **Gaussian** bell curve extends over all real numbers, so fitting it to skewed, strictly positive quantities like response latency can sample impossible negative durations (positive-support families like lognormal or exponential fit durations better).

In language models, the **Categorical** distribution connects directly to neural outputs through **<span data-glossary="softmax">softmax</span>**. A model emits unconstrained real scores called **<span data-glossary="logits">logits</span>** $z_1, \dots, z_K$ (one per vocabulary <span data-glossary="token">token</span>). Dividing by a positive **temperature** $T > 0$ and applying softmax turns logits into a valid Categorical probability vector:[^goodfellow2016]

$$
p_i = \frac{\exp(z_i / T)}{\sum_{j=1}^{K} \exp(z_j / T)}
$$

Low temperature ($T < 1$) stretches logit gaps and concentrates mass on the top token (approaching greedy argmax as $T \to 0$); high temperature ($T > 1$) flattens the distribution toward uniform. Subtracting `max(logits)` before exponentiating leaves every probability identical while preventing floating-point overflow:

<!-- leetllm: test, deps=numpy, output=show, output_title="Softmax links logits to a Categorical distribution" -->
```python title="softmax-categorical-temperature.py"
import numpy as np

def softmax(logits: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    scaled = logits / temperature
    shifted = scaled - np.max(scaled)
    exps = np.exp(shifted)
    return exps / np.sum(exps)

tokens = ["blue", "clear", "cloudy", "green"]
logits = np.array([2.2, 1.5, 0.2, -1.5], dtype=np.float64)

for temp in (0.3, 1.0, 2.0):
    probs = softmax(logits, temperature=temp)
    summary = "  ".join(f"{tok}={p:.3f}" for tok, p in zip(tokens, probs))
    print(f"T={temp:<3} -> {summary}")
```

<!-- leetllm: output:start -->
```text title="Softmax links logits to a Categorical distribution" output compact
T=0.3 -> blue=0.911  clear=0.088  cloudy=0.001  green=0.000
T=1.0 -> blue=0.604  clear=0.300  cloudy=0.082  green=0.015
T=2.0 -> blue=0.448  clear=0.316  cloudy=0.165  green=0.071
```
<!-- leetllm: output:end -->

## Token sequences, cross-entropy, and log space

When scoring a Categorical prediction on one observed token, <span data-glossary="cross-entropy">cross-entropy</span> loss equals negative <span data-glossary="logprob">log probability</span>, $-\ln(p_{\text{target}})$, measured in **nats**.[^goodfellow2016] Giving the true token `0.90` costs `0.105` nats; giving it `0.01` costs `4.605` nats.

For a sequence of tokens, the probability chain rule multiplies conditional probabilities step by step:

$$
P(t_1, t_2, \ldots, t_n) = P(t_1) \prod_{i=2}^{n} P(t_i \mid t_1, \ldots, t_{i-1})
$$

Multiplying tiny probabilities across long sequences underflows `float64` (whose smallest positive subnormal sits near $10^{-324}$). Across 200 tokens each at $p = 0.01$, the mathematical product $10^{-400}$ collapses to exact `0.0`, while summing natural logs stays finite at `-921.0` nats.[^python2026floatingpoint]

<figure>
  <img src="illustrations/_generated/sequence_logprob_underflow_dark.png" alt="Chain rule prefix product across four tokens shrinks from 0.40 to 0.216 with total NLL 1.532 nats, while base-10 log mass for 200 tokens at p = 0.01 drops linearly past the binary64 underflow floor at -324." />
  <figcaption>Prefix probabilities decay multiplicatively toward zero, underflowing `float64` by step 163 when step probabilities are `0.01`. Summing natural logarithms avoids numerical collapse.</figcaption>
</figure>

The same underflow hits naive `torch.log(torch.softmax(logits))` when extreme logit gaps round a probability to `0.0` before the log runs. Always pass raw logits straight to fused log-sum-exp routines like `F.log_softmax` or `nn.CrossEntropyLoss`:

<!-- leetllm: test, output=show, deps=torch,numpy, output_title="Log space and fused log_softmax" -->
```python title="log-space-and-log-softmax.py"
import numpy as np
import torch
import torch.nn.functional as F

token_probs = np.full(200, 0.01, dtype=np.float64)
print("raw product:", float(np.prod(token_probs)), "  summed logprob:", round(float(np.sum(np.log(token_probs))), 1), "nats")

extreme_logits = torch.tensor([100.0, 0.0, -900.0], dtype=torch.float32)
naive = torch.log(torch.softmax(extreme_logits, dim=0))
fused = F.log_softmax(extreme_logits, dim=0)
print("naive log(softmax):", [round(x, 2) for x in naive.tolist()])
print("fused log_softmax: ", [round(x, 2) for x in fused.tolist()])
assert torch.isinf(naive[2]) and torch.isfinite(fused).all()
```

<!-- leetllm: output:start -->
```text title="Log space and fused log_softmax" output compact
raw product: 0.0   summed logprob: -921.0 nats
naive log(softmax): [0.0, -99.98, -inf]
fused log_softmax:  [0.0, -100.0, -1000.0]
```
<!-- leetllm: output:end -->

## Common mistakes

| Symptom | Mistake | Fix |
|---|---|---|
| "A flag means 95% abusive." | Confused recall $P(B \mid A)$ with posterior $P(A \mid B)$ | Write the conditioning set explicitly before dividing |
| Queue risk far below detector recall | Ignored rare base rate $P(A)$ | Build a 10,000-row count table first |
| Duplicated alert rules double confidence | Multiplied correlated conditional likelihoods | Measure joint class rates empirically |
| Raw `0.80` score treated as 80% risk | Assumed uncalibrated scores match frequencies | Bucket scores on representative held-out labels |
| Gaussian simulator outputs `-2.4s` latency | Matched unbounded support to positive durations | Use a positive-support family (lognormal/exponential) |
| Sequence likelihood becomes `0.0` | Multiplied tiny probabilities in linear space | Sum log probabilities with fused `log_softmax` |

Whenever a probability surprises you, ask one question first: **among which cases am I counting?** Defining that reference denominator makes both Bayes' theorem and log-likelihood diagnostics transparent.

```mastery-quiz
[
  {
    "question": "A 5,000-signup batch contains 4% abuse. A detector flags 90% of abuse and 2.5% of clean signups. What is P(abuse | flagged)?",
    "options": [
      "60%, from 180 true flags among 300 total flags.",
      "90%, from the detector's within-abuse flag rate.",
      "3.6%, from 180 true flags among all 5,000 signups.",
      "62.5%, from 200 abuse cases among 320 total flags."
    ],
    "answer": "60%, from 180 true flags among 300 total flags.",
    "explanation": "There are 200 abusive and 4,800 clean signups. Flags are 180 and 120, so conditioning on the 300 flagged rows gives 180/300 = 0.60."
  },
  {
    "question": "A detector flags 30% of both classes in a population with 3% abuse. What abuse fraction is expected among flagged signups?",
    "options": [
      "30%, equal to the overall selection rate.",
      "3%, equal to the unchanged population prior.",
      "50%, because both classes share a selection rate.",
      "0.9%, equal to the joint abuse-and-flag share."
    ],
    "answer": "3%, equal to the unchanged population prior.",
    "explanation": "Equal class-conditional rates mean the flag is independent of abuse, preserving the 3% base rate: (0.03 × 0.30) / (0.03 × 0.30 + 0.97 × 0.30) = 0.03."
  },
  {
    "question": "Two percent of signups are abusive. A detector flags 80% of abusive signups and 2% of clean signups, and a second service copies that exact flag. If both fields are true, what is P(abuse | both flags)?",
    "options": [
      "97.0%, by squaring both class rates as independent signals.",
      "44.9%, because the copied field selects the exact same queue.",
      "80.0%, because two matching flags confirm the recall.",
      "2.0%, because dependent flags carry zero class evidence."
    ],
    "answer": "44.9%, because the copied field selects the exact same queue.",
    "explanation": "Out of 10,000 signups, 160 abusive and 196 clean rows are flagged. A duplicated bit selects the exact same 356 signups, keeping posterior risk at 160 / 356 ≈ 44.9%."
  },
  {
    "question": "An ordered sample shows three abusive labels and one clean label. Which parameter value maximizes its Bernoulli likelihood p³(1 − p)?",
    "options": [
      "p = 0.50.",
      "p = 0.75.",
      "p = 0.25.",
      "p = 0.90."
    ],
    "answer": "p = 0.75.",
    "explanation": "Evaluating p³(1 − p) at 0.25, 0.50, 0.75, and 0.90 gives 0.0117, 0.0625, 0.1055, and 0.0729, peaking at the observed fraction 3/4 = 0.75."
  },
  {
    "question": "Which pairing of distribution family and role is accurate for ML and LLM systems?",
    "options": [
      "Gaussian models next-token logits after softmax because its values always sum to 1.",
      "Bernoulli models one binary 0/1 trial (mean p, variance p(1−p)); Categorical models one choice among K classes, linked to unconstrained logits via softmax.",
      "Categorical models unbounded continuous latencies, while Gaussian models discrete counts 0, 1, 2, ...",
      "Lowering softmax temperature T spreads probability mass uniformly across all K classes."
    ],
    "answer": "Bernoulli models one binary 0/1 trial (mean p, variance p(1−p)); Categorical models one choice among K classes, linked to unconstrained logits via softmax.",
    "explanation": "Bernoulli governs single binary outcomes, Categorical governs discrete 1-of-K outcomes (produced from logits by softmax, where lower T sharpens mass), and Gaussian is a continuous bell curve on (−∞, +∞)."
  },
  {
    "question": "Five hundred token probabilities are each 0.1. Their float64 product rounds to 0.0, while the sum of natural logs stays finite. What should the evaluator record?",
    "options": [
      "An impossible sequence, because a product of 0.0 means zero probability.",
      "A calibrated zero, because calibration fixes floating-point range errors.",
      "Undefined loss terms, because every token must have probability zero.",
      "The finite log probability, because the linear product numerically underflowed."
    ],
    "answer": "The finite log probability, because the linear product numerically underflowed.",
    "explanation": "The exact probability 10⁻⁵⁰⁰ is strictly positive yet below float64 range. Summing natural logs stays cleanly finite at 500 ln(0.1) ≈ −1151.3 nats."
  }
]
```

> **Next:** Continue to [Statistics, Bayesian Estimation & pass@k](/learn/hypothesis-tests-confidence-intervals-passk).

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Ask a language model to continue `function returns the`. You might picture it choosing a word. What it actually produces is one number for every token it knows, tens of thousands of them, and nothing else.

Consider four candidate next tokens and their raw scores:

| Next token | Score |
|---|---:|
| `result` | 2.0 |
| `value` | 1.2 |
| `None` | 0.1 |
| `banana` | -2.0 |

Those raw scores are called **logits**. A higher logit means the model favors that token more, yet a logit is not a probability. It can be negative, the list does not sum to anything in particular, and a score of 2.0 means nothing until you compare it with the others. Before anyone can pick a token, or score how well the model did, these scores need to become probabilities.

## From scores to probabilities

A **probability distribution** over tokens is a list of numbers with two properties: none is negative, and together they sum to 1. To turn logits into that, we need a function that makes every score positive, keeps their order, and rescales the result.

The exponential function handles the first two, since $e^x$ is positive for any $x$ and bigger inputs give bigger outputs. Dividing by the total handles the third. That recipe is **softmax**:

$$
p_i = \frac{e^{z_i}}{\sum_j e^{z_j}}
$$

where $z_i$ is the logit for token $i$. Say it out loud once: exponentiate each score, then divide by the sum.

<!-- leetllm: test, output=show, id=reader-probability-softmax -->
```python title="softmax-from-scratch.py"
import math

def softmax(logits):
    largest = max(logits)
    exponentials = [math.exp(z - largest) for z in logits]
    total = sum(exponentials)
    return [value / total for value in exponentials]

tokens = ["result", "value", "None", "banana"]
logits = [2.0, 1.2, 0.1, -2.0]

probabilities = softmax(logits)
for token, p in zip(tokens, probabilities):
    print(f"{token:>7}  {p:.3f}")
print(f"    sum  {sum(probabilities):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
 result  0.618
  value  0.278
   None  0.092
 banana  0.011
    sum  1.000
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/logits_to_probs_dark.png" alt="Left: raw logits for four candidate next tokens: result 2.0, value 1.2, None 0.1, and banana minus 2.0, drawn as bars around zero. Right: softmax turns them into probabilities of 0.618, 0.278, 0.092, and 0.011, all positive and summing to one. The order is unchanged, and a gap of 0.8 between logits becomes a ratio of 2.2 between probabilities." />
  <figcaption>Softmax keeps the ranking and changes the scale. Differences between logits become ratios between probabilities: the 0.8 gap between `result` and `value` becomes a ratio of $e^{0.8} \approx 2.2$.</figcaption>
</figure>

Subtracting the largest logit first leaves the answer unchanged, because a common factor cancels in the fraction, and keeps the exponentials from overflowing when logits are large. Notice also what the exponential does to gaps: adding a constant to every logit changes nothing, while a difference of $\Delta$ becomes a ratio of $e^\Delta$. A lead of 5 is a ratio of about 148, and a lead of 10 is about 22,000.

## What a probability means when you sample

A probability of 0.618 does not mean the model "believes" anything in the human sense. It means that if you draw tokens from this distribution over and over, `result` comes up about 62 percent of the time. The model hands you the distribution, and something else has to choose.

Always taking the top token is **greedy** decoding. Drawing at random according to the probabilities is **sampling**, which is why the same prompt can yield different answers across runs:

<!-- leetllm: test, output=show, id=reader-probability-sample -->
```python title="draw-next-tokens.py"
import random

tokens = ["result", "value", "None", "banana"]
probabilities = [0.618, 0.278, 0.092, 0.011]

generator = random.Random(7)
draws = generator.choices(tokens, weights=probabilities, k=1000)
for token in tokens:
    print(f"{token:>7}  {draws.count(token):4d} of 1000")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
 result   640 of 1000
  value   246 of 1000
   None   105 of 1000
 banana     9 of 1000
```
<!-- leetllm: output:end -->

Fixing the seed makes this script repeatable for tests; drop the seed and the counts wobble. Decoding strategies get a full chapter in Part 1.

## Four distributions you will meet everywhere

Every random quantity lives on a set of allowed values (its **support**), and discrete and continuous quantities obey different rules.[^murphy2012] A **discrete** distribution lists exact probabilities for each countable outcome (**probability mass function**, or PMF), and those masses sum to `1`. A **continuous** distribution spreads probability over an interval via a **probability density function** (PDF): any exact real point has probability zero, while the area under the curve between $a$ and $b$ gives $P(a \le X \le b)$, and the **cumulative distribution function** (CDF) $F(t) = P(X \le t)$ tracks total probability up to $t$.

Four families cover almost every variable you will model or evaluate in ML and LLMs:

| Family | Type & support | Parameters | Where it shows up |
|---|---|---|---|
| **Bernoulli** | Discrete `{0, 1}` | success rate $p$ | One pass/fail eval case or binary label (mean $p$, variance $p(1 - p)$) |
| **Binomial** | Discrete `{0, ..., n}` | trials $n$, rate $p$ | Total passes across $n$ independent eval cases (mean $np$, std $\sqrt{np(1 - p)}$)[^nist2012binomial] |
| **Categorical** | Discrete `{1, ..., K}` | probabilities $\mathbf{p}$ | One draw from $K$ classes or vocabulary tokens, built from logits via **softmax** |
| **Gaussian (Normal)** | Continuous $(-\infty, +\infty)$ | mean $\mu$, std $\sigma$ | Measurement noise, regression residuals, weight initializations, and large-sample rate approximations |

Two modeling habits follow directly from this table. First, **respect support**: because a Gaussian bell curve extends to $-\infty$, fitting it to a skewed, strictly positive quantity like response latency can sample impossible negative seconds. Use positive-support families (such as lognormal or exponential) for durations instead.

Second, **temperature** controls the shape of the Categorical distribution produced by softmax. Before exponentiating, decoders divide every logit by $T > 0$ ($\tilde{z}_i = z_i / T$): lowering $T$ magnifies logit gaps and concentrates probability onto the top token (approaching greedy decoding as $T \to 0$), while raising $T$ compresses gaps and flattens the Categorical distribution toward uniform:

<!-- leetllm: test, output=show, id=reader-probability-temperature -->
```python title="temperature-shapes-categorical.py"
import math

def softmax_temp(logits, temperature):
    scaled = [z / temperature for z in logits]
    largest = max(scaled)
    exps = [math.exp(v - largest) for v in scaled]
    total = sum(exps)
    return [v / total for v in exps]

tokens = ["result", "value", "None", "banana"]
logits = [2.0, 1.2, 0.1, -2.0]

for temp in (0.3, 1.0, 2.0):
    probs = softmax_temp(logits, temp)
    line = "  ".join(f"{tok}={p:.3f}" for tok, p in zip(tokens, probs))
    print(f"T={temp:<3} -> {line}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
T=0.3 -> result=0.933  value=0.065  None=0.002  banana=0.000
T=1.0 -> result=0.618  value=0.278  None=0.092  banana=0.011
T=2.0 -> result=0.456  value=0.306  None=0.176  banana=0.062
```
<!-- leetllm: output:end -->

Notice how temperature preserves the token ranking (`result > value > None > banana`) while moving `result` from `93.3%` at `T = 0.3` down to `45.6%` at `T = 2.0`. Next we see why scoring and multiplying those probabilities always happens in log space.

## Why everything happens in logs

A sentence is a chain of next-token choices. The probability of a whole sequence is the product of the probability of each token given the ones before it:

$$
P(t_1, \dots, t_n) = P(t_1) \times P(t_2 \mid t_1) \times \dots \times P(t_n \mid t_1, \dots, t_{n-1})
$$

The vertical bar reads "given." $P(t_2 \mid t_1)$ is the probability of the second token, given the first. Now try multiplying 400 token probabilities of `0.1` on a real machine:

<!-- leetllm: test, output=show, id=reader-probability-underflow -->
```python title="products-underflow-logs-do-not.py"
import math

product = 1.0
log_sum = 0.0
for _ in range(400):
    product *= 0.1
    log_sum += math.log(0.1)

print("product of 400 probabilities:", product)
print("sum of 400 logs:", round(log_sum, 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
product of 400 probabilities: 0.0
sum of 400 logs: -921.03
```
<!-- leetllm: output:end -->

The product hits exact zero, because $10^{-400}$ is smaller than a 64-bit float can represent. Taking logs fixes this, since $\log(ab) = \log a + \log b$ turns a vanishing product into a well-behaved sum. Log probabilities are never positive (since $p \le 1$), and natural logs use the unit **nat**.

## The loss that trains a language model

Chapter 1 scored a numeric prediction with squared error. Here the model outputs a Categorical distribution, and reality produces one specific token. Find the probability the model gave to the token that actually happened, and take its negative log:

$$
\text{loss} = -\log p_{\text{target}}
$$

This is **negative log-likelihood**, and averaged over many tokens it is **cross-entropy** loss, the objective behind modern neural classifiers and language models.[^goodfellow2016mlp] Read it as surprise: giving the true token `0.9` costs `0.105` nats; giving it `0.01` costs `4.605` nats.

<figure>
  <img src="illustrations/_generated/surprise_curve_dark.png" alt="The curve of loss equals negative log p, plotted against the probability a model gave the token that actually came next. At probability 0.9 the loss is 0.105 nats, at 0.5 it is 0.693, at 0.1 it is 2.303, and at 0.01 it is 4.605. The curve rises sharply as the probability approaches zero, so being confidently wrong is punished far more than being unsure." />
  <figcaption>Loss is low when the model gave the true token high probability, and climbs without limit as that probability approaches zero. Betting everything on the wrong token costs far more than staying unsure.</figcaption>
</figure>

A confident miss at `0.001` costs `6.9` nats, whereas a hit at `0.99` costs `0.01`, so one such miss erases about 690 hits. Compare three models on four tokens where the overconfident model misses once:

<!-- leetllm: test, output=show, id=reader-probability-cross-entropy -->
```python title="score-three-models.py"
import math

models = {
    "moderate": [0.60, 0.50, 0.70, 0.40],
    "always unsure": [0.25, 0.25, 0.25, 0.25],
    "overconfident": [0.99, 0.99, 0.99, 0.001],
}

for name, probabilities in models.items():
    mean_loss = sum(-math.log(p) for p in probabilities) / len(probabilities)
    print(f"{name:>16}  mean loss = {mean_loss:.3f} nats")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
        moderate  mean loss = 0.619 nats
   always unsure  mean loss = 1.386 nats
   overconfident  mean loss = 1.734 nats
```
<!-- leetllm: output:end -->

On these four tokens, the moderate model wins because one disaster outweighs three near-certain hits. If the overconfident model misses at rate $r$, its mean loss is about $0.01(1 - r) + 6.9r$, which beats the moderate baseline `0.619` whenever $r$ drops below roughly `0.088` (about one token in 11). Cross-entropy rewards **calibrated** confidence: predicting `0.7` should match outcomes that happen around 70 percent of the time across a large held-out set.

One practical detail: PyTorch's `CrossEntropyLoss` expects raw logits rather than probabilities, combining softmax and log in one numerically safe step.[^pytorchCrossEntropy2026] Applying softmax yourself first is a silent bug that degrades training. Keras expects probabilities by default, so always check what your library assumes.[^kerasProbabilisticLosses2026]

```checkpoint
A model gives the correct next token probability 0.5. After training, it gives that token 0.9. How much did this token's loss drop?
---
It fell from $-\ln 0.5 \approx 0.693$ nats to $-\ln 0.9 \approx 0.105$ nats, a drop of about 0.588 nats. Training works by pushing up the probability assigned to the true token.
```

## How much to trust a measured rate

Now use Bernoulli probability to avoid an expensive evaluation mistake. Suppose a new model passes 42 of 50 cases (`84%`), and the old one passed 40 (`80%`). Is the new one actually better?

Each test case is a Bernoulli flip with true pass rate $p$. Across $n$ independent cases, the pass count has mean $np$ and standard deviation $\sqrt{np(1 - p)}$.[^nist2012binomial] Dividing by $n$ gives the measured rate's **standard error**:

$$
\text{standard error} = \sqrt{\frac{p(1 - p)}{n}}
$$

For moderate $n$, the measured rate follows a roughly Gaussian bell curve, so about 95 percent of runs land within two standard errors of $p$. Plugging in $p = 0.8$ and $n = 50$ gives two standard errors of `0.11` (11 percentage points): a true 80 percent model routinely scores anywhere from `69%` to `91%` on 50 cases.

<figure>
  <img src="illustrations/_generated/estimate_spread_dark.png" alt="Simulated evaluations of a system whose true pass rate is 0.80. For each test set size of 10, 50, 200, and 1,000 cases, sixty runs appear as dots. At 10 cases the measured rate ranges widely, roughly from 0.4 to 1.0. At 1,000 cases the dots cluster tightly around 0.80. A shaded band shows two standard errors on each side, which narrows as the test set grows: 0.25, 0.11, 0.057, and 0.025. At 10 cases the formula overshoots 1.0, so that band stops at 1.0." />
  <figcaption>Each dot is one simulated evaluation of the same system. Because uncertainty shrinks with $\sqrt{n}$, cutting error in half takes four times as many test cases.</figcaption>
</figure>

Never report a pass rate without its sample size. Going from 50 to 200 cases only halves uncertainty, so detecting a one- or two-point gain takes thousands of cases.

## The noise in a gap between two rates

Comparing two models adds the noise of both measurements. For two separate samples of $n$ cases each, the variances add:[^pennStatePairedBinary2026]

$$
\text{standard error of the gap} = \sqrt{\frac{p_1(1 - p_1)}{n} + \frac{p_2(1 - p_2)}{n}}
$$

At `84%` vs `80%` on 50 cases each, the standard error of the gap is `0.077`, so two standard errors is `15` percentage points. A 4-point lead sits well inside noise; this test cannot tell which model is better.

You can sharpen the comparison by running both models on the **same** cases. Cases both pass or both fail cancel out; only the share $D$ where they disagree contributes noise, giving standard error $\sqrt{D/n}$.[^pennStatePairedBinary2026]

Near 80 percent, spotting a 2-percentage-point gap between separate samples requires $2\sqrt{2 \times 0.8 \times 0.2 / n} < 0.02$, or roughly **3,200 cases per model** (and about 6,300 to detect a real 2-point gain 80 percent of the time). Running both models on the same cases with a 10 percent disagreement rate cuts that threshold to roughly 1,000 shared cases.

```checkpoint
Your evaluation shows 88 percent on 100 cases, while the old model scored 85 percent on a separate 100-case test. Should you ship based on this result?
---
No. The gap's standard error is $\sqrt{0.88 \times 0.12 / 100 + 0.85 \times 0.15 / 100} \approx 0.048$, so two standard errors is about 9.7 percentage points. A 3-point gap is well inside noise; plan on roughly 1,000 to 2,000 cases per model, or evaluate both models on the same cases to cut variance.
```

## What you can do now

You can map raw logits to a Categorical distribution via softmax, distinguish Bernoulli, Categorical, and Gaussian variables by their support, compute cross-entropy loss in log space without underflow, and tell when an evaluation gap is real versus sampling noise.

You now have the loss signal that trains a language model. Next we learn **backpropagation**: how to compute the downhill slope for every parameter in one backward pass.

<!-- leetllm: edition:reader:end -->
