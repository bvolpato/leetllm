---
{
  "id": "probability-for-machine-learning",
  "title": "Probability for Machine Learning",
  "slug": "probability-for-machine-learning",
  "section": "Math & Statistics",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Easy",
  "order": 5,
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
    "likelihood",
    "calibration",
    "log probabilities"
  ]
}
---
<!-- leetllm: edition:reference:start -->

An abuse detector sends an API signup to manual review whenever its risk threshold fires. On labeled validation traffic, the detector catches 95 percent of abusive signups, a recall figure that sounds reassuring on its own. Yet once alerts hit an operations desk, reviewers immediately ask the inverse question: when a signup is flagged, how often is it actually abusive? Whenever abuse is rare, even a small false-alarm rate applied across thousands of normal accounts fills the queue with clean signups, turning a strong recall metric into an unmanageable triage bottleneck unless you account for base rates.[^murphy2012][^bishop2006]

## Start with the population

Suppose a labeled reference population contains 10,000 signups from one API surface, with 100 abusive accounts and 9,900 clean accounts. Picking one signup uniformly at random gives every row an equal chance of selection. Counting abusive rows against the full population gives the starting base rate, $P(\text{abusive}) = 100 / 10000 = 0.01$, meaning 1 percent of incoming signups are abusive before the detector examines anything.

| Signup type | Count | Probability |
|---|---|---:|
| Abusive | 100 | 0.01 |
| Clean | 9,900 | 0.99 |
| Total | 10,000 | 1.00 |

$$
P(\text{abusive}) = \frac{100}{10000} = 0.01
$$

That starting probability is the **prior**: the abuse rate before observing evidence from the detector. The **posterior** is the updated probability after observing that the signup was flagged. Formally, the **sample space** $\Omega$ is the set of all 10,000 possible rows, and an **event** is any subset of $\Omega$, such as the 100 abusive rows ($A$) or the set of flagged rows ($B$), with $P(\Omega) = 1$.[^goodfellow2016] When generalizing counts from a reference slice to future traffic, you assume future traffic preserves similar behavior; estimating a realistic prior therefore requires a representative labeled sample of all incoming signups rather than only cases already filtered into a review queue.

Encode each sampled signup as a binary indicator where `Y = 1` represents abuse and `Y = 0` represents clean traffic. That 0/1 mapping defines a <span data-glossary="random-variable">random variable</span> whose numerical outcome depends on which signup was drawn. Its <span data-glossary="expected-value">expectation</span> weights each outcome by its probability, $E[Y] = 1 \times 0.01 + 0 \times 0.99 = 0.01$, recovering the population base rate as an average. A binary 0/1 variable like `Y` is a **Bernoulli** random variable whose expectation equals its success probability `p`.

Expectation tells you the long-run average, while **<span data-glossary="variance">variance</span>** captures how widely individual draws scatter around that average via `Var[Y] = E[(Y - E[Y])^2]`. Here the 100 ones sit `0.99` above `0.01`, while the 9,900 zeros sit `0.01` below it, producing $\text{Var}[Y] = 0.01(1 - 0.01)^2 + 0.99(0 - 0.01)^2 = 0.0099 = p(1 - p)$. Remember that Bernoulli variance describes spread across individual outcomes in a known population, not statistical sampling noise across repeated evaluations; later statistics lessons separate estimation error from population shifts. Representing the 10,000 labels in NumPy verifies both exact population moments immediately:

$$
E[Y] = 1 \times 0.01 + 0 \times 0.99 = 0.01,
\qquad
\text{Var}[Y] = p(1 - p) = 0.0099
$$

<!-- leetllm: test, output=show, output_title="Indicator summary" -->
```python title="indicator-mean-is-probability.py"
import numpy as np

abuse_indicator = np.concatenate([np.ones(100), np.zeros(9_900)])

prior = float(np.mean(abuse_indicator))
variance = float(np.var(abuse_indicator))

print(f"signups: {len(abuse_indicator):,}")
print(f"prior = E[Y]: {prior:.4f}")
print(f"Var[Y]: {variance:.4f}")

assert prior == 0.01
assert np.isclose(variance, prior * (1.0 - prior), atol=1e-12)
```

<!-- leetllm: output:start -->
```text title="Indicator summary" output compact
signups: 10,000
prior = E[Y]: 0.0100
Var[Y]: 0.0099
```
<!-- leetllm: output:end -->

## Evidence changes the question

Next let the detector evaluate each signup. Suppose the detector catches abusive signups at rate `0.95` and falsely flags clean signups at rate `0.05`. These two metrics are class-conditional rates evaluated inside separate populations: **true-positive rate** (recall) counts within the abusive pile, asking what fraction of abusive accounts get flagged, whereas **false-positive rate** counts within the clean pile, asking what fraction of clean accounts get flagged anyway.

| If the signup is... | Detector behavior | Probability |
|---|---|---:|
| Abusive | flags it | 0.95 |
| Clean | falsely flags it | 0.05 |

Once a signup lands in the review queue, however, an engineer needs the reverse conditional: given that this signup was flagged, how likely is it abusive? Writing both probabilities side by side makes the swapped denominator explicit. Reading the vertical bar as "given," the expression on its right fixes the subset you count inside: $P(\text{flagged} \mid \text{abusive})$ conditions on the 100 abusive accounts, whereas $P(\text{abusive} \mid \text{flagged})$ conditions on all accounts inside the flagged queue.

| Notation | Plain English |
|---|---|
| $P(\text{flagged} \mid \text{abusive})$ | If a signup is abusive, how often does the detector flag it? |
| $P(\text{abusive} \mid \text{flagged})$ | If a signup is flagged, how often is it abusive? |

```checkpoint
The detector catches 95 percent of abusive signups. Does that mean a flagged signup is 95 percent likely to be abusive?
---
No. "Catches 95 percent of abusive signups" is $P(\text{flagged} \mid \text{abusive})$. The operational risk question after a flag is $P(\text{abusive} \mid \text{flagged})$, which conditions on the flagged queue rather than the abusive population.
```

## Count the flagged pile

Before applying Bayes' theorem symbolically, construct the flagged queue directly from natural counts. Among the 100 abusive signups, a 95 percent detection rate produces $100 \times 0.95 = 95$ true flags. Among the 9,900 clean signups, a 5 percent false-alarm rate produces $9900 \times 0.05 = 495$ false flags. Combining both sources puts `95 + 495 = 590` signups into the review queue. Even though 5 percent sounds small compared with 95 percent, it acts on a clean pile 99 times larger than the abusive pile, creating more false alarms than true catches.

| Source of flagged signup | Count |
|---|---:|
| abusive and flagged | 95 |
| clean and flagged | 495 |
| all flagged signups | 590 |

Dividing the 95 abusive flags by all 590 flagged signups gives the exact posterior:

$$
P(\text{abusive} \mid \text{flagged}) = \frac{95}{590} \approx 0.161
$$

A flagged signup is roughly 16.1 percent likely to be abusive, far below the 95 percent recall number. Recall describes the detector inside abusive accounts; posterior probability measures queue purity after the detector filters all traffic. Computing those counts alongside a 100,000-signup Monte Carlo simulation in NumPy shows individual random draws converging onto the exact natural-frequency ratio:[^pythonRandom2026]

<!-- leetllm: test, output=show, output_title="Flagged-pile counts and simulation" -->
```python title="count-and-simulate-flagged-queue.py"
import numpy as np

total_signups = 10_000
abuse_signups = 100
clean_signups = total_signups - abuse_signups
tpr, fpr = 0.95, 0.05

true_flags = round(abuse_signups * tpr)
false_flags = round(clean_signups * fpr)
flagged_signups = true_flags + false_flags
exact_posterior = true_flags / flagged_signups

rng = np.random.default_rng(12)
n_sim = 100_000
abusive = rng.random(n_sim) < 0.01
flag_probs = np.where(abusive, tpr, fpr)
flagged = rng.random(n_sim) < flag_probs
sim_posterior = float(np.sum(abusive & flagged) / np.sum(flagged))

print(f"exact queue: true={true_flags}, false={false_flags}, total={flagged_signups}, posterior={exact_posterior:.3f}")
print(f"sim queue:   abusive={int(np.sum(abusive))}, true={int(np.sum(abusive & flagged))}, total={int(np.sum(flagged))}, posterior={sim_posterior:.3f}")
assert abs(sim_posterior - exact_posterior) < 0.02
```

<!-- leetllm: output:start -->
```text title="Flagged-pile counts and simulation" output compact
exact queue: true=95, false=495, total=590, posterior=0.161
sim queue:   abusive=995, true=940, total=5855, posterior=0.161
```
<!-- leetllm: output:end -->

```checkpoint
Why does a 5 percent false-positive rate create 495 false alarms while a 95 percent true-positive rate creates only 95 true flags?
---
The two rates multiply different populations. Five percent applies to 9,900 clean signups (495 false alarms), while 95 percent applies to only 100 abusive signups (95 true flags). Base rates govern which pile dominates the review queue.
```

Keep in mind that simulation assumes independent draws with stationary rates. Coordinated bot attacks correlate adjacent signups, and sampling rows without replacement from a finite batch creates dependence between picks. A fixed RNG seed ensures reproducible experiments, while production traffic still requires live monitoring.

## Conditioning means narrowing the world

<span data-glossary="conditional-probability">Conditional probability</span> is simply filtering followed by counting: before dividing, discard every row inconsistent with the evidence. To evaluate $P(\text{abusive} \mid \text{flagged})$, drop all 9,410 unflagged signups so the denominator shrinks from 10,000 down to the 590 flagged rows, leaving 95 abusive hits inside those 590 cases. Asking "among which cases am I counting?" prevents most probability mistakes before algebra begins.

| Probability | World you count inside | Numerator |
|---|---|---:|
| $P(\text{abusive})$ | all 10,000 signups | 100 abusive signups |
| $P(\text{abusive} \mid \text{flagged})$ | 590 flagged signups | 95 abusive flagged signups |

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Bayes count breakdown showing 10,000 signups splitting at a 1 percent base rate into 100 abusive and 9,900 clean accounts, producing 95 true flags and 495 false alarms for a 16.1 percent posterior in the 590-item queue." />
  <figcaption>Conditioning swaps the denominator. The middle bars measure rates within each class separately, while the bottom bar pools all 590 flagged signups so 95 true catches make up 16.1 percent of the queue.</figcaption>
</figure>

## Joint and marginal probability

Viewing the same counts from two orthogonal angles defines joint and marginal probability. A **joint probability** measures the fraction of the entire population where two events occur simultaneously: 95 signups are both abusive and flagged, giving $P(\text{abusive and flagged}) = 95 / 10000 = 0.0095$. A **marginal probability** sums over all ways a single event occurs without splitting by the other variable: summing both sources of flags yields $P(\text{flagged}) = (95 + 495) / 10000 = 0.059$. Whenever $P(B) > 0$, dividing the joint probability by the conditioning marginal probability recovers the conditional probability, and rearranging gives the **multiplication rule**:

$$
P(A \mid B) = \frac{P(A \text{ and } B)}{P(B)},
\qquad
P(A \text{ and } B) = P(A \mid B)\,P(B) = P(B \mid A)\,P(A)
$$

Checking the arithmetic against our natural counts gives $P(\text{abusive} \mid \text{flagged}) = 0.0095 / 0.059 \approx 0.161$, matching our earlier queue calculation identically.

## Bayes rule after the counts

<span data-glossary="bayes-theorem">Bayes' theorem</span> writes that exact queue accounting in one algebraic identity. For events $A$ (abusive signup) and $B$ (flagged by detector) with $P(A) > 0$ and $P(B) > 0$:

$$
P(A \mid B) = \frac{P(B \mid A)P(A)}{P(B)},
\qquad
P(B) = P(B \mid A)P(A) + P(B \mid \text{not }A)P(\text{not }A)
$$

| Symbol | Meaning | Value |
|---|---|---:|
| $A$ | signup is abusive | |
| $B$ | detector flagged the signup | |
| $P(A)$ | abuse base rate (prior) | 0.01 |
| $P(B \mid A)$ | true-positive rate | 0.95 |
| $P(B \mid \text{not }A)$ | false-positive rate | 0.05 |

When $B$ is the observed evidence, the conditional probability $P(B \mid A)$ serves as the **likelihood** of that evidence under hypothesis $A$. Notice that the marginal denominator $P(B)$ sums both true-flag and false-flag branches weighted by their priors: $P(B) = 0.95 \times 0.01 + 0.05 \times 0.99 = 0.059$. Dividing numerator $0.95 \times 0.01 = 0.0095$ by $0.059$ returns `0.161`, confirming that Bayes rule is simply the compact normalized form of the two-pile count table.

## Likelihood compares explanations for observed labels

Probability fixes a rate parameter and computes how often different outcomes occur; **likelihood** holds observed outcomes fixed and compares candidate parameter values by how well each explains the data.[^murphy2012][^bishop2006] Suppose reviewers label three flagged signups `[abuse, clean, abuse]`. Under independent Bernoulli trials with flagged-queue abuse rate `p`, the probability of that exact ordered sequence is $L(p) = p(1 - p)p = p^2(1 - p)$. Evaluating three candidate values gives `0.032` at `p = 0.20`, `0.125` at `p = 0.50`, and `0.128` at `p = 0.80`, though the continuous maximum occurs at the observed sample fraction $p = 2/3$ (`0.1481`). Crucially, `L(p)` is not a probability distribution over `p` and does not sum or integrate to 1.

| Candidate rate $p$ | Likelihood $L(p)$ |
|---:|---:|
| 0.20 | 0.032 |
| 0.50 | 0.125 |
| 0.80 | 0.128 |

If reviewers record only the summary count ("two abusive signups in three draws") regardless of order, three sequences satisfy that count, multiplying the probability to the Binomial form $3p^2(1 - p)$.[^nist2012binomial] That combinatorial factor `3` leaves the maximizing value $p = 2/3$ unchanged because maximizing $L(p)$ depends only on terms involving `p`, a property that extends naturally to maximizing log-likelihood in model training.

## Independence means no update

Consider a broken detector that flags 20 percent of abusive signups and 20 percent of clean signups indiscriminately. Out of 10,000 rows, it flags `20` abusive signups and `1,980` clean signups for a total of `2,000` flags, leaving the flagged queue at $20 / 2000 = 0.01$, unchanged from the 1 percent prior. Formally, events $A$ and $B$ are **independent** whenever $P(A \mid B) = P(A)$, or equivalently $P(A \text{ and } B) = P(A)P(B)$. Notice the contrast with **mutually exclusive** events, which cannot happen together ($P(A \text{ and } B) = 0$): abusive and clean labels are mutually exclusive and therefore maximally dependent, whereas an uninformative detector flag is independent of abuse despite occurring frequently alongside both classes.

<!-- leetllm: test, output=show, output_title="Independent evidence" -->
```python title="independence-means-no-update.py"
import numpy as np

def posterior_if_flagged(prior, tpr, fpr):
    prior_arr = np.asarray(prior, dtype=np.float64)
    true_flags = tpr * prior_arr
    false_flags = fpr * (1.0 - prior_arr)
    return true_flags / (true_flags + false_flags)


prior = 0.01
posterior = float(posterior_if_flagged(prior, 0.20, 0.20))

print(f"prior:     {prior:.3f}")
print(f"posterior: {posterior:.3f}")
print(f"update:    {posterior - prior:+.3f}")
assert np.isclose(posterior, prior, atol=1e-12)
```

<!-- leetllm: output:start -->
```text title="Independent evidence" output compact
prior:     0.010
posterior: 0.010
update:    +0.000
```
<!-- leetllm: output:end -->

```checkpoint
A detector flags 20 percent of abusive signups and 20 percent of clean signups. Why does seeing a flag leave the posterior equal to the prior?
---
Equal conditional flag rates carry zero discriminating signal between classes. Conditioning keeps the exact 1:99 ratio between abusive and clean rows, leaving the probability at 0.01.
```

### Naive independence vs. duplicated signals

Now return to the useful detector (`TPR = 0.95`, `FPR = 0.05`) and imagine a logging bug copies its alert bit into a second column `flag_copy`. Treating two identical columns as independent evidence inflates confidence catastrophically. By the chain rule inside the abusive class, $P(B_1, B_2 \mid A) = P(B_2 \mid B_1, A) P(B_1 \mid A)$, which simplifies to $P(B_2 \mid A) P(B_1 \mid A)$ **only** if the two signals are **conditionally independent** given $A$ (and symmetrically given $\text{not }A$).[^goodfellow2016] Copied flags have conditional correlation `1.0`, leaving posterior abuse risk at `16.1%`, whereas assuming conditional independence squares both likelihoods and claims `78.5%` confidence from one repeated bit. Always measure empirical joint rates within each class before multiplying detector outputs together.

<!-- leetllm: test, output=show -->
```python title="duplicated-versus-independent-flags.py"
import numpy as np

prior = 0.01
scenarios = [
    ("copied flag", 0.95, 0.05),
    ("conditionally independent flags", 0.95**2, 0.05**2),
]

for description, abuse_joint_rate, clean_joint_rate in scenarios:
    masses = np.array([prior * abuse_joint_rate, (1.0 - prior) * clean_joint_rate])
    risk = float(masses[0] / np.sum(masses))
    print(f"{description}: {risk:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
copied flag: 16.1%
conditionally independent flags: 78.5%
```
<!-- leetllm: output:end -->

## Same detector, different world

Hold the detector completely fixed (`TPR = 0.95`, `FPR = 0.05`) and vary only the incoming population base rate. In a 1 percent abuse stream, clean traffic outnumbers abuse 99 to 1, giving `16.1%` posterior risk in the flagged queue. Raise the abuse base rate to 10 percent (such as traffic from an unverified signup endpoint), and true flags jump ahead of false alarms, pushing posterior risk to `67.9%`. At a 50 percent base rate, clean and abusive pools start balanced, lifting posterior risk to `95.0%`.

| Abuse base rate | Posterior after flag | Queue balance |
|---|---|---|
| 1 percent | 16.1 percent | clean false alarms dominate the flagged pile |
| 10 percent | 67.9 percent | true abuse flags outweigh false alarms 2 to 1 |
| 50 percent | 95.0 percent | both classes start equal, matching 95 percent recall |

<figure>
  <img src="illustrations/_generated/posterior_vs_base_rate_dark.png" alt="Line curve and bar chart showing Bayesian posterior P(abuse given flag) rising from 16.1 percent at 1 percent prior to 67.9 percent at 10 percent and 95.0 percent at 50 percent while detector recall remains fixed at 95 percent and false-positive rate stays 5 percent." />
  <figcaption>Keeping the detector unchanged while traffic base rates rise shifts queue precision dramatically. Confusing fixed 95 percent recall with posterior risk breaks down whenever base rates are small or shift across endpoints.</figcaption>
</figure>

```checkpoint
A detector's true-positive and false-positive rates stay fixed while the abuse base rate rises from 1 percent to 10 percent. Why does queue precision jump?
---
Higher abuse frequency expands the true-flag count tenfold while shrinking the clean denominator slightly. False alarms drop from 84 percent of the queue to 32 percent even though the model weights did not change.
```

Implementing the prior sweep cleanly with NumPy validates input ranges explicitly (`ValueError` for probabilities outside `[0, 1]` or zero-mass conditioning events where no flag can fire) without cluttering numerical routines:

<!-- leetllm: test, output=show, output_title="Posterior sweep" -->
```python title="probability_demo.py"
import numpy as np

def flagged_posterior(prior, true_positive, false_positive):
    vals = np.asarray([prior, true_positive, false_positive], dtype=np.float64)
    if np.any(~np.isfinite(vals)) or np.any((vals < 0.0) | (vals > 1.0)):
        raise ValueError("probabilities must be finite values in [0, 1]")

    p, tpr, fpr = float(vals[0]), float(vals[1]), float(vals[2])
    true_flags = tpr * p
    false_flags = fpr * (1.0 - p)
    all_flags = true_flags + false_flags
    if all_flags == 0.0:
        raise ValueError("evidence probability must be greater than 0")
    return true_flags / all_flags


for prior in np.array([0.01, 0.10, 0.50]):
    print(f"prior={prior:.2f}  posterior={flagged_posterior(prior, 0.95, 0.05):.3f}")

for bad_args in [(1.4, 0.95, 0.05), (0.01, 0.0, 0.0)]:
    try:
        flagged_posterior(*bad_args)
    except ValueError as err:
        print("rejected:", err)
```

<!-- leetllm: output:start -->
```text title="Posterior sweep" output compact
prior=0.01  posterior=0.161
prior=0.10  posterior=0.679
prior=0.50  posterior=0.950
rejected: probabilities must be finite values in [0, 1]
rejected: evidence probability must be greater than 0
```
<!-- leetllm: output:end -->

Notice why rejecting `all_flags == 0` matters: if a detector never flags any account, conditioning on an impossible flag event is undefined; silently returning the prior would invent a conditional guarantee that cannot happen.

## A threshold changes two probabilities at once

Continuous risk scores let an engineering team tune its operating point by raising or lowering the decision threshold. On a fixed set of scored accounts, raising the threshold only removes items from the queue, so neither recall nor false-positive rate can rise, though precision can move in either direction depending on the score distribution near the cutoff. Comparing broad review (`TPR = 0.95`, `FPR = 0.05`) against strict review (`TPR = 0.80`, `FPR = 0.01`) at a 1 percent base rate makes this **<span data-glossary="precision-recall">precision-recall tradeoff</span>** concrete: out of 10,000 signups, broad review flags 590 cases (`16.1%` abusive, missing 5 abusive signups), while strict review shrinks the queue to 179 cases (`44.7%` abusive) at the cost of missing 20 abusive signups.

| Threshold setting | $P(\text{flagged} \mid \text{abuse})$ | $P(\text{flagged} \mid \text{clean})$ |
|---|---:|---:|
| broad review | 0.95 | 0.05 |
| stricter review | 0.80 | 0.01 |

<!-- leetllm: test, output=show, output_title="Threshold tradeoff" -->
```python title="threshold-tradeoff.py"
import numpy as np

def review_metrics(prior, recalls, fprs):
    recalls = np.asarray(recalls, dtype=np.float64)
    fprs = np.asarray(fprs, dtype=np.float64)
    true_flags = recalls * prior
    false_flags = fprs * (1.0 - prior)
    review_rate = true_flags + false_flags
    if np.any(review_rate == 0.0):
        raise ValueError("review rate must be greater than 0")
    return review_rate, true_flags / review_rate


names = ["broad review", "stricter review"]
recalls = [0.95, 0.80]
fprs = [0.05, 0.01]
rates, precisions = review_metrics(0.01, recalls, fprs)
for name, rate, prec, rec in zip(names, rates, precisions, recalls):
    print(f"{name:16} review={rate:6.2%} abuse_in_queue={prec:6.2%} recall={rec:6.2%}")

try:
    review_metrics(0.01, [0.0], [0.0])
except ValueError as error:
    print("empty queue:", error)
```

<!-- leetllm: output:start -->
```text title="Threshold tradeoff" output compact
broad review     review= 5.90% abuse_in_queue=16.10% recall=95.00%
stricter review  review= 1.79% abuse_in_queue=44.69% recall=80.00%
empty queue: review rate must be greater than 0
```
<!-- leetllm: output:end -->

Probability maps out every feasible threshold; reviewer bandwidth and the asymmetric cost of false alarms versus missed abuse determine which operating point a team selects.

## A score isn't automatically a probability

Models often emit continuous scores between 0 and 1, yet a score of `0.80` does not automatically equal an 80 percent probability of abuse. A model is <span data-glossary="calibration">calibrated</span> for a specific event and traffic slice when cases assigned predicted risk $q$ actually experience the event about fraction $q$ of the time across a representative dataset. Empirical studies show that modern deep classifiers regularly achieve high accuracy while outputting overconfident, poorly calibrated probabilities.[^guo2017] Checking calibration requires grouping predictions into probability buckets and comparing mean predicted confidence against observed outcome rates on held-out traffic representative of deployment rather than only reviewed queues.[^sklearnCalibration2026]

<!-- leetllm: test, output=show, output_title="Calibration bucket" -->
```python title="check-one-score-bucket.py"
import numpy as np

predicted_risk = np.array([0.80, 0.82, 0.78, 0.81, 0.79, 0.80])
observed_abuse = np.array([1, 0, 1, 0, 1, 0])

advertised_risk = float(np.mean(predicted_risk))
observed_rate = float(np.mean(observed_abuse))
gap = advertised_risk - observed_rate

print(f"average predicted risk: {advertised_risk:.0%}")
print(f"observed abuse rate:    {observed_rate:.0%}")
print(f"empirical gap:         {100 * gap:.0f} percentage points")
```

<!-- leetllm: output:start -->
```text title="Calibration bucket" output compact
average predicted risk: 80%
observed abuse rate:    50%
empirical gap:         30 percentage points
```
<!-- leetllm: output:end -->

Six rows illustrate how the gap is computed, even though reliable calibration assessment demands far larger held-out samples across every probability bin. Keep calibration distinct from ranking discrimination too: predicting constant `0.01` for every signup is perfectly calibrated on 1 percent abuse traffic while providing zero ability to rank risky signups above clean ones.

## Other quantities need other distributions

Binary abuse indicators follow a Bernoulli distribution, whereas ML pipelines track counts, multi-class actions, and continuous measurements that follow different <span data-glossary="probability-distribution">probability distributions</span>. Choosing a distribution encodes structural assumptions about what values an observation can take, so matching variable domains to distribution families acts as an immediate sanity check.[^murphy2012][^bishop2006]

| Distribution | Quantity it describes | Possible values | Typical ML example |
|---|---|---|---|
| Bernoulli | one yes/no outcome | `0` or `1` | one signup is abusive |
| Categorical | one choice among several labels | one of `K` classes | allow, review, or block |
| Binomial | successes in `n` independent Bernoulli trials | `0` through `n` | abusive signups in a fixed batch |
| Poisson | independent arrivals in a fixed interval | `0, 1, 2, ...` | alerts per minute |
| Normal (Gaussian) | continuous measurement around a mean | any real value | continuous regression residual |

For a Binomial count over `n` independent signups with probability `p`, mean is $np$ and variance is $np(1 - p)$. At $n = 100$ and $p = 0.01$, expected count equals `1` with variance `0.99`, meaning individual batches still scatter across `0`, `1`, `2`, or more abusive rows.[^nist2012binomial] A Poisson variable sets both mean and variance equal to the interval rate $\lambda$, though bursty coordinated traffic violates its independent-arrival assumption and increases dispersion.[^nist2012poisson] Notice also why Normal models fit unbounded continuous residuals rather than bounded probabilities in `[0, 1]`.

> **Modeling bridge:** Next-token prediction in language models is Categorical probability estimation over the entire vocabulary, and training optimizes the probability assigned to each observed token.

## A token model multiplies probabilities

When evaluating a language model on a single observed token, <span data-glossary="cross-entropy">cross-entropy</span> loss equals negative <span data-glossary="logprob">log probability</span>, $-\ln(p_{\text{target}})$, measured in natural log units called **nats**.[^goodfellow2016] Because probabilities lie in `(0, 1]`, assigned probabilities near `1` yield tiny loss (`-ln(0.90) = 0.105` nats), whereas confident misses incur heavy penalties (`-ln(0.01) = 4.605` nats).

<!-- leetllm: test, output=show, output_title="Token surprise" -->
```python title="negative-log-probability.py"
import numpy as np

probs = np.array([0.90, 0.50, 0.01])
losses = -np.log(probs)
for p, loss in zip(probs, losses):
    print(f"target probability={p:>4.2f}  loss={loss:>5.3f} nats")
```

<!-- leetllm: output:start -->
```text title="Token surprise" output compact
target probability=0.90  loss=0.105 nats
target probability=0.50  loss=0.693 nats
target probability=0.01  loss=4.605 nats
```
<!-- leetllm: output:end -->

For multi-token sequences, the probability chain rule factorizes joint sequence probability into a product of next-token conditionals conditioned on all preceding tokens:

$$
P(t_1, t_2, \ldots, t_n) = P(t_1) \prod_{i=2}^{n} P(t_i \mid t_1, \ldots, t_{i-1})
$$

Crucially, multiplying conditional probabilities along a long sequence quickly underflows standard `float64` precision (whose smallest representable positive value sits near $10^{-324}$). Converting probabilities into log space replaces vanishing products with well-behaved addition, $\ln(ab) = \ln a + \ln b$. Across a four-token sequence (`The` `0.40`, `model` `0.75`, `writes` `0.80`, `code` `0.90`), multiplying yields `0.216` while summing natural logs gives `-1.532477` nats (`1.532` nats NLL total, `0.383` nats per token). Across `200` tokens each assigned `p = 0.01`, the mathematical product $10^{-400}$ rounds to exact `0.0` in `float64`, while its summed log probability stays cleanly finite at `-921.0` nats.[^python2026floatingpoint]

<figure>
  <img src="illustrations/_generated/sequence_logprob_underflow_dark.png" alt="Chain rule prefix product across four tokens shrinks from 0.40 to 0.216 with total NLL 1.532 nats, while base-10 log mass for 200 tokens at p = 0.01 drops linearly past the binary64 underflow floor at -324." />
  <figcaption>Prefix probabilities decay multiplicatively toward zero, underflowing float64 completely by step 163 when step probabilities are 0.01. Summing natural logarithms avoids numerical collapse completely.</figcaption>
</figure>

<!-- leetllm: test, output=show, output_title="Log-space sequence probability" -->
```python title="keep-sequence-probabilities-in-log-space.py"
import numpy as np

token_probs = np.full(200, 0.01, dtype=np.float64)
raw_product = float(np.prod(token_probs))
log_probability = float(np.sum(np.log(token_probs)))

print(f"raw product in float64: {raw_product}")
print(f"summed log probability: {log_probability:.1f} nats")
assert raw_product == 0.0
assert np.isclose(log_probability, 200 * np.log(0.01))
```

<!-- leetllm: output:start -->
```text title="Log-space sequence probability" output compact
raw product in float64: 0.0
summed log probability: -921.0 nats
```
<!-- leetllm: output:end -->

In neural networks, computing `log(softmax(logits))` in two separate steps can suffer the exact same intermediate underflow if an exponentiated probability rounds to `0.0` before the logarithm runs. Fused log-sum-exp operations such as PyTorch's [`F.log_softmax`](https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.log_softmax.html) subtract the maximum logit and cancel the normalizing exponential analytically, preserving finite <span data-glossary="perplexity">log probabilities</span> even under extreme logit gaps:

<!-- leetllm: test, output=show, deps=torch,numpy, output_title="Fused log_softmax stability" -->
```python title="fused-log-softmax-prevents-underflow.py"
import torch
import torch.nn.functional as F

extreme_logits = torch.tensor([100.0, 0.0, -900.0], dtype=torch.float32)
naive_log_probs = torch.log(torch.softmax(extreme_logits, dim=0))
fused_log_probs = F.log_softmax(extreme_logits, dim=0)

print("naive log(softmax):", naive_log_probs.tolist())
print("fused log_softmax:  ", fused_log_probs.tolist())
assert torch.isinf(naive_log_probs[2])
assert torch.isfinite(fused_log_probs).all()
```

<!-- leetllm: output:start -->
```text title="Fused log_softmax stability" output compact
naive log(softmax): [0.0, -99.98309326171875, -inf]
fused log_softmax:   [0.0, -100.0, -1000.0]
```
<!-- leetllm: output:end -->

Always pass raw logits directly into `F.log_softmax` or `nn.CrossEntropyLoss` rather than applying softmax manually first. Note that an impossible token with mathematical probability zero has no finite log probability (`math.log(0)` raises `ValueError` and `np.log(0)` returns `-inf`), which differs fundamentally from nonzero probabilities lost to floating-point underflow.

## Common mistakes

Most production probability errors occur before any formula runs, when a metric silently swaps events, conditions on a filtered subset, or multiplies correlated signals:

| Symptom | Mistake | Fix |
|---|---|---|
| "A flag means 95% abusive." | Confused recall $P(B \mid A)$ with posterior $P(A \mid B)$ | Write the conditioning event explicitly before dividing |
| Queue risk far below detector recall | Ignored rare base rate $P(A)$ | Start from 10,000-row natural counts |
| Denominator includes unflagged traffic | Forgot to condition on the observed evidence | Restrict denominator to the filtered queue |
| Stale threshold fails on new slice | Ignored changing population base rates | Re-estimate prior and rates per traffic surface |
| Duplicated alert rules double confidence | Multiplied non-independent conditional likelihoods | Measure joint class rates empirically |
| Raw `0.80` score treated as 80% risk | Assumed uncalibrated scores match frequencies | Bucket scores on representative held-out labels |
| Sequence likelihood becomes `0.0` | Multiplied tiny probabilities in linear space | Sum log probabilities with fused `log_softmax` |

Whenever a dashboard number contradicts intuition, ask one question first: **among which cases am I counting?** Defining that reference denominator makes both Bayes' theorem and log-likelihood diagnostics transparent.

## Practice with measured answers

Work through these five exercises from the 10,000-signup scenario (`100` abusive, `9,900` clean) and check your results against the summary table below:

1. For signups **not** flagged by the original detector (`TPR = 0.95`, `FPR = 0.05`), compute the abusive count, clean count, and negative predictive risk $P(\text{abusive} \mid \text{unflagged})$.
2. Suppose an improved detector maintains `95%` recall while cutting false-positive rate from `5%` to `1%`. Compute its flagged queue size and posterior, and explain why lowering `FPR` independently differs from raising a score threshold.
3. Reviewers can inspect at most `200` signups per batch. Compare broad review, strict review, and the improved detector on queue capacity and missed abuse counts.
4. Why does sampling solely from reviewed alerts fail to measure next month's population abuse base rate?
5. Contrast `-ln(0.80)`, `-ln(0.10)`, and `math.log(0)` against the floating-point underflow `0.01 ** 200 == 0.0`.

| Exercise | Verified answer |
|---|---|
| Unflagged risk | `5` abusive and `9,405` clean signups remain unflagged, giving risk $5 / 9410 \approx 0.053\%$. |
| Improved model | `95` true flags + `99` false flags = `194` total flags and $95 / 194 \approx 49.0\%$ precision without dropping recall to 80%. |
| Queue capacity (200 cap) | Broad (`590` flags, `5` misses) exceeds capacity; strict (`179`, `20` misses) and improved (`194`, `5` misses) both fit. |
| Prior sampling | Conditioning on flags introduces selection bias; sample randomly across all incoming signups including unflagged rows. |
| Logs vs. zero | `-ln(0.80) = 0.223`, `-ln(0.10) = 2.303`; `math.log(0)` fails mathematically, whereas `0.01**200` underflows despite finite log `-921.0`. |

```mastery-quiz
[
  {
    "question": "A 5,000-signup batch contains 4% abuse. A detector flags 90% of abuse and 2.5% of clean signups. What is P(abuse | flagged)?",
    "options": [
      "60%, from 180 true flags among 300 total flags.",
      "90%, from the detector’s within-abuse flag rate.",
      "3.6%, from 180 true flags among all 5,000 signups.",
      "62.5%, from 200 abuse cases among 320 total flags."
    ],
    "answer": "60%, from 180 true flags among 300 total flags.",
    "explanation": "There are 200 abusive and 4,800 clean signups. Flags are 180 and 120, so conditioning gives 180/300 = 0.60; recall 0.90 uses another denominator."
  },
  {
    "question": "A detector flags 30% of both classes in a population with 3% abuse. What abuse fraction is expected among flags?",
    "options": [
      "30%, equal to the overall selection rate.",
      "3%, equal to the unchanged population prior.",
      "50%, because both classes share a selection rate.",
      "0.9%, equal to the joint abuse-and-flag share."
    ],
    "answer": "3%, equal to the unchanged population prior.",
    "explanation": "Equal class-conditional rates preserve the mix: 0.03 × 0.30 / (0.03 × 0.30 + 0.97 × 0.30) = 0.03."
  },
  {
    "question": "A detector scores 10,000 signups, of which 2% are abusive. Broad review has 90% recall and a 4% false-positive rate among clean signups. Strict review has 75% recall and a 1% false-positive rate. How many fewer abusive signups does strict review flag, and what percentage of each queue is abusive?",
    "options": [
      "Strict flags 50 fewer abusive signups. Abuse accounts for 31.5% of broad flags and 60.5% of strict flags.",
      "Strict flags 30 fewer abusive signups. Abuse accounts for 68.5% of broad flags and 39.5% of strict flags.",
      "Strict flags 30 fewer abusive signups. Abuse accounts for 31.5% of broad flags and 60.5% of strict flags.",
      "Strict flags 50 fewer abusive signups. Abuse accounts for 68.5% of broad flags and 39.5% of strict flags."
    ],
    "answer": "Strict flags 30 fewer abusive signups. Abuse accounts for 31.5% of broad flags and 60.5% of strict flags.",
    "explanation": "The batch contains 200 abusive and 9,800 clean signups. Broad review flags 180 abusive and 392 clean (31.5% abusive), whereas strict review flags 150 abusive and 98 clean (60.5% abusive), catching 30 fewer abusive cases."
  },
  {
    "question": "Five hundred token probabilities are each 0.1. Their binary64 product becomes 0.0, while the sum of logs is finite. What should the evaluator record?",
    "options": [
      "An impossible sequence, because a computed product of zero proves zero probability.",
      "A calibrated zero, because score calibration repairs floating-point range errors.",
      "Undefined loss terms, because all selected tokens must have zero probability.",
      "The finite log probability, because the raw product numerically underflowed."
    ],
    "answer": "The finite log probability, because the raw product numerically underflowed.",
    "explanation": "The exact product is 10^-500, positive mathematically but below binary64 range. Summing logs stays finite at 500 ln(0.1) ≈ -1151.293 nats."
  },
  {
    "question": "Twenty cases have mean predicted abuse risk 70%; eight are actually abusive. Which bucket result is correct?",
    "options": [
      "Predicted 70% versus observed 40%, a 30-point empirical gap.",
      "Predicted 70% versus observed 80%, a 10-point empirical gap.",
      "Predicted 40% versus observed 70%, a 30-point empirical gap.",
      "Predicted 70% versus observed 70%, because mean scores define outcomes."
    ],
    "answer": "Predicted 70% versus observed 40%, a 30-point empirical gap.",
    "explanation": "Eight out of twenty gives 0.40 observed abuse versus 0.70 predicted risk, leaving a 30-percentage-point calibration gap on this small bucket."
  },
  {
    "question": "An ordered sequence has three abuse labels and one clean label. Among the candidates below, which maximizes its likelihood p³(1 − p)?",
    "options": [
      "p = 0.50.",
      "p = 0.75.",
      "p = 0.25.",
      "p = 0.90."
    ],
    "answer": "p = 0.75.",
    "explanation": "At p = 0.25, 0.50, 0.75, and 0.90, p³(1 − p) evaluates to 0.0117, 0.0625, 0.1055, and 0.0729, peaking at the observed sample fraction 3/4 = 0.75."
  },
  {
    "question": "A signup has a 20% chance of being abusive. Its label is 1 for abuse and 0 otherwise. Which model, mean, and variance describe this label?",
    "options": [
      "Normal with mean 0.20 and variance 0.16.",
      "Poisson with mean 0.20 and variance 0.20.",
      "Bernoulli with mean 0.20 and variance 0.16.",
      "Bernoulli with mean 0.20 and variance 0.80."
    ],
    "answer": "Bernoulli with mean 0.20 and variance 0.16.",
    "explanation": "A single binary 0/1 trial follows Bernoulli(p = 0.20), with mean p = 0.20 and variance p(1 − p) = 0.20 × 0.80 = 0.16."
  },
  {
    "question": "Reviewers label only flagged signups and find 25% abuse. Does that directly estimate the all-signup abuse prior?",
    "options": [
      "Yes, because correct labels remove any selection effect.",
      "Yes, once enough flags are labeled to reduce sampling noise.",
      "No, because the prior must equal the detector’s recall.",
      "No, because flag selection changes the measured population."
    ],
    "answer": "No, because flag selection changes the measured population.",
    "explanation": "Labeling only flagged signups estimates P(abuse | flagged) rather than the overall population base rate P(abuse)."
  },
  {
    "question": "A posterior function receives prior −0.1 in one call, and zero true/false-positive rates at a valid prior in another. Which input validation behavior is correct?",
    "options": [
      "Reject both: one probability is outside [0, 1]; the other flag event has zero probability mass.",
      "Reject only the negative prior; return the prior when flag mass is zero.",
      "Clip the negative prior to zero; reject the zero flag-mass call.",
      "Accept both calls; allow negative probabilities and divide by zero."
    ],
    "answer": "Reject both: one probability is outside [0, 1]; the other flag event has zero probability mass.",
    "explanation": "Valid probabilities must lie in [0, 1], and conditioning on a zero-probability event leaves Bayes' denominator equal to zero. Both calls are undefined and should raise ValueError."
  },
  {
    "question": "Two percent of signups are abusive. A detector flags 80% of abusive signups and 2% of clean signups. A second service copies its flag. If both fields are true, what is the probability that the signup is abusive?",
    "options": [
      "97.0%, by multiplying the class rates for any two fields.",
      "44.9%, because the copied field selects the same queue.",
      "80.0%, because two matching flags validate the recall.",
      "2.0%, because dependent flags cannot carry class evidence."
    ],
    "answer": "44.9%, because the copied field selects the same queue.",
    "explanation": "Out of 10,000 signups, 200 abusive × 0.80 = 160 true flags and 9,800 clean × 0.02 = 196 false flags enter the queue. A duplicated column picks the exact same 356 signups, so posterior risk stays 160 / 356 ≈ 44.9%."
  }
]
```

> **Next:** Continue to [Bayesian Inference from Evidence](/learn/bayesian-inference-priors-posteriors). You can now count the flagged pile and explain why its 16.1 percent abuse rate differs from detector recall. Bayesian inference turns that same prior, likelihood, and evidence into a reusable update rule for uncertain model and product decisions.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Ask a language model to continue `function returns the`. You might picture it choosing a word. What it actually produces is one number for every token it knows, tens of thousands of them, and nothing else.

Consider four next-token probabilities from that distribution:

| Next token | Score |
|---|---:|
| `result` | 2.0 |
| `value` | 1.2 |
| `None` | 0.1 |
| `banana` | -2.0 |

Those raw scores are called **logits**. A higher logit means the model favors that token more, but a logit is not a probability. It can be negative, the list does not sum to anything in particular, and a score of 2.0 has no meaning until you compare it with the others. Before anyone can pick a token, or score how well the model did, these scores need to become probabilities.

## From scores to probabilities

A **probability distribution** over tokens is a list of numbers with two properties: none is negative, and together they sum to 1. To turn logits into that, we need something that makes every score positive, keeps their order, and then rescales the result.

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

Subtracting the largest logit first looks odd, and it is there for a practical reason. It leaves the answer unchanged, because a common factor cancels in the fraction, and it keeps the exponentials from overflowing when logits are large. You will see the same trick in the code in Part 1.

Notice what the exponential does to gaps. Adding a constant to every logit changes nothing, so only differences matter, and a difference of $\Delta$ becomes a ratio of $e^\Delta$. A lead of 5 is a ratio of about 148, and a lead of 10 is about 22,000. If the top logit exceeds every alternative by a large enough gap, its probability approaches one.

## What a probability means when you sample

A probability of 0.618 does not mean the model "believes" anything in the way you might. It means that if you draw tokens from this distribution over and over, `result` comes up about 62 percent of the time. The model hands you the distribution, and something else has to choose.

The simplest strategy is to always take the top token, which is called **greedy** decoding. The other common choice is to **sample**, drawing at random according to the probabilities. Sampling is the main reason the same prompt can produce different answers, and that fact has consequences throughout this book, for testing and for caching alike.

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

Fixing the seed makes this script print the same thing every time, which is useful for a test. Drop the seed and the counts wander. Keep that wobble in mind, because we are about to make it precise. Decoding strategies get a full chapter in Part 1.

## Why everything happens in logs

A sentence is a chain of next-token choices. The probability of a whole sequence is the product of the probability of each token given the ones before it:

$$
P(t_1, \dots, t_n) = P(t_1) \times P(t_2 \mid t_1) \times \dots \times P(t_n \mid t_1, \dots, t_{n-1})
$$

The vertical bar reads "given." $P(t_2 \mid t_1)$ is the probability of the second token, given the first. This is exactly what a language model estimates, one position at a time.

Now try computing that on a real machine. Suppose each of 400 tokens has probability 0.1:

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

The product hits exact zero, because $10^{-400}$ is smaller than a 64-bit float can represent. Taking logs fixes this, since $\log(ab) = \log a + \log b$ turns a product that vanishes into a sum that stays comfortably in range. That is the first reason you see logs everywhere in machine learning. The next section shows a second one: the shape of the log is what makes a confident mistake so expensive. Log probabilities are never positive, because a probability is at most 1, and this book uses natural logs, whose unit is the **nat**.

## The loss that trains a language model

Chapter 1 scored a prediction with squared error, which suits a number like latency. Here the model outputs a distribution, and reality then produces one specific token. So how do you score a distribution against one outcome?

Find the probability the model gave to whatever actually happened, and take its negative log:

$$
\text{loss} = -\log p_{\text{target}}
$$

This is called **negative log-likelihood**, and when it is averaged over many tokens it is the **cross-entropy** loss, the objective behind most modern neural networks,[^goodfellow2016mlp] language models included. You can read the quantity as surprise. If the model gave the true next token a probability of 0.9, it is barely surprised and pays about 0.1. If it gave that token 0.01, it pays 4.6.

<figure>
  <img src="illustrations/_generated/surprise_curve_dark.png" alt="The curve of loss equals negative log p, plotted against the probability a model gave the token that actually came next. At probability 0.9 the loss is 0.105 nats, at 0.5 it is 0.693, at 0.1 it is 2.303, and at 0.01 it is 4.605. The curve rises sharply as the probability approaches zero, so being confidently wrong is punished far more than being unsure." />
  <figcaption>Loss is low when the model gave the true token high probability, and it climbs without limit as that probability approaches zero. Spreading probability across several options costs something, and betting everything on the wrong one costs far more.</figcaption>
</figure>

That curve's shape is the point. A confident miss is very expensive: at 0.001 it costs 6.9 nats, while a hit at 0.99 costs 0.01, so one such miss costs as much as about 690 such hits. A model cannot hide frequent confident mistakes behind its confident hits. Compare three models on the same four tokens of text, where the overconfident one is badly wrong one time in four:

<!-- leetllm: test, output=show, id=reader-probability-cross-entropy -->
```python title="score-three-models.py"
import math

# The probability each model gave to the token that actually came next.
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

On these four observed tokens, the moderate model has the lowest mean loss. The overconfident model assigns such a low probability to the fourth token that this one outcome outweighs its three high-probability predictions. To check calibration, group predictions for the same event by probability and measure how often the event occurs. Among predictions of 0.7, for example, the event should occur about 70 percent of the time. Four observed outcomes are too small a sample to measure empirical calibration frequency.

That verdict depends on how often the disaster comes. If the overconfident model misses a fraction $r$ of the time, its mean loss is about $0.01(1 - r) + 6.9r$. Make that one time in a hundred, and it scores 0.079 nats and wins easily. Holding the moderate model's mean loss at 0.619, it beats that baseline whenever $r$ is below about 0.088, roughly one token in 11. Confidence is fine when it is earned. Cross-entropy rewards a model for knowing how much it knows.

One detail you will meet immediately in practice. PyTorch expects raw logits rather than probabilities, because it combines the softmax and the log in one step, which is numerically safer. Its `CrossEntropyLoss` works this way, so applying softmax yourself first is a common bug.[^pytorchCrossEntropy2026] The loss still computes, the model still seems to train, and the numbers are quietly wrong. Keras assumes probabilities by default, so check which one your library wants.[^kerasProbabilisticLosses2026]

```checkpoint
A model's output gives the correct next token a probability of 0.5. Later, after training, it gives that token 0.9. How much did this token's loss change?
---
It fell from $-\ln 0.5 \approx 0.693$ nats to $-\ln 0.9 \approx 0.105$ nats, a drop of about 0.588 nats. The loss looks only at the probability of the true token, so training works by pushing that probability up.
```

## How much to trust a measured rate

You now have one more use for probability, and it will save you from a common and expensive mistake. Sooner or later, you will test a system on a set of examples and report a pass rate. Say a new model passes 42 of 50 cases, and the old one passed 40. Is the new one better?

Each test case is like a coin flip weighted by the system's true pass rate $p$. Run the test on $n$ cases, and the measured rate is itself a random quantity. Two numbers summarize a random quantity. Its **mean** is its long-run average. Its **variance** is the average squared distance from the mean, and the square root of the variance is the **standard deviation**, which gives the typical size of a miss. For a count of passes, the mean is $np$ and the standard deviation is $\sqrt{np(1-p)}$.[^nist2012binomial] Divide by $n$ to get the measured rate, whose mean is $p$ and whose standard deviation is known as the **standard error**:

$$
\text{standard error} = \sqrt{\frac{p(1 - p)}{n}}
$$

For a test of reasonable size, the measured rate follows a roughly bell-shaped curve, so about 95 percent of measurements land within two standard errors of the true rate. You do not know the true rate, so in practice you plug in the one you measured. Both shortcuts get shaky on very small tests. Plug in $p = 0.8$ and $n = 50$, and two standard errors comes to about 0.11, or 11 percentage points. So a true 80 percent system can easily score anywhere from 69 to 91 percent on a 50-case test.

<figure>
  <img src="illustrations/_generated/estimate_spread_dark.png" alt="Simulated evaluations of a system whose true pass rate is 0.80. For each test set size of 10, 50, 200, and 1,000 cases, sixty runs appear as dots. At 10 cases the measured rate ranges widely, roughly from 0.4 to 1.0. At 1,000 cases the dots cluster tightly around 0.80. A shaded band shows two standard errors on each side, which narrows as the test set grows: 0.25, 0.11, 0.057, and 0.025. At 10 cases the formula overshoots 1.0, so that band stops at 1.0." />
  <figcaption>Each dot is one simulated evaluation of the same system. The true pass rate never changes, yet small test sets report very different numbers. Because the error shrinks with $\sqrt{n}$, cutting it in half takes four times as many cases.</figcaption>
</figure>

I would make one habit out of this: never report a pass rate without its sample size. And take the square root seriously. Going from 50 to 200 cases only halves your uncertainty, so a difference of one or two percentage points can take thousands of cases to detect. Part 1 gives you a better interval for small samples, and you will use it again when you evaluate models, defenses, and servers.

## The noise in a gap between two rates

Our question is about the gap between two rates, and each of those scores has its own noise, so the gap carries both. The two misses are unrelated. Sometimes they cancel and sometimes they stack, and on average it is their variances that add.[^pennStatePairedBinary2026] For two separate samples of $n$ cases each, that gives:

$$
\text{standard error of the gap} = \sqrt{\frac{p_1(1 - p_1)}{n} + \frac{p_2(1 - p_2)}{n}}
$$

When the two rates are close, that is about 1.4 times the noise of one rate. Try our two models, at 84 and 80 percent on 50 cases each. The standard error of the gap is about 0.077, so two standard errors comes to about 15 percentage points. A gap of two passes, four percentage points, is too small for this test to tell apart from noise. The new model may be better or worse, and this test cannot say which.

Holding a gap up against the noise of one rate is the mistake to watch for, because it calls too many winners. Had the new model passed 46 of 50, its 12 point lead would clear the 11 points we computed for one rate, and it would still fall short of the 14 points that this gap needs.

You can usually do better by running both models on the same cases. A case that both pass or both fail says nothing about the gap, and all of the information is in the cases where they disagree.[^pennStatePairedBinary2026] If the models disagree on a share $D$ of the cases, the standard error of the gap is about $\sqrt{D/n}$, and models that find the same cases hard keep $D$ small.

Now we can answer the question this chapter opened with. Two models differ by two percentage points on a 50-case test, which is a single case. How many cases would you need before you trusted that difference? You want two standard errors of the gap to come in under 0.02. Near 80 percent, that means:

$$
2\sqrt{\frac{2 \times 0.8 \times 0.2}{n}} < 0.02
$$

That works out to about 3,200 cases per model. In general, the cases per model come to about $8p(1-p)/\text{gap}^2$, so half the gap takes four times the cases, and a one point gap takes 12,800. Treat 3,200 as a minimum, because it only makes a measured two point gap stand out. If the true gap is exactly two points, a test that size shows a gap above two standard errors only about half the time, and you need about 6,300 cases per model to see it four times out of five. Running both models on the same cases usually cuts the count. If they disagree on one case in ten, $2\sqrt{0.1/n} < 0.02$ takes about 1,000 cases.

```checkpoint
Your evaluation shows 88 percent on 100 cases. A teammate wants to ship because the old model scored 85 percent on the same size of test. What do you tell them?
---
The gap carries the noise of both scores. For two separate samples, its standard error is $\sqrt{0.88 \times 0.12 / 100 + 0.85 \times 0.15 / 100} \approx 0.048$, so two standard errors is about 9.7 percentage points, and a 3 point gap is well within noise. This test cannot say which model is better. A 3 point gap needs about 1,000 cases per model just to stand out, and a real one clears that bar only about half the time. To see it four times out of five, plan on about 2,000 cases per model, or usually fewer if you run both models on the same cases.
```

## What you can do now

You can turn logits into probabilities and explain why the exponential is there. You can compute a cross-entropy loss, and you can read a pass rate with appropriate suspicion. You can also tell whether a gap between two pass rates is bigger than its noise, and estimate how many cases would settle it.

You also now have what training needs: a single number that says how bad a model's guess was. A low-probability true token gives a high loss. What is missing is the method for reducing it. Chapter 1 nudged every knob one at a time, and a real model has billions of knobs. So we need a way to learn which direction to turn all of them at once, for about the price of running the model a single time. That method is called backpropagation, and it is the subject of the next chapter.

<!-- leetllm: edition:reader:end -->
