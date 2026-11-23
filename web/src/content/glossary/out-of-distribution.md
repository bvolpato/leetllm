---
title: Out-of-distribution
aliases: ["OOD", "out of distribution"]
importance: 88
---
**Out-of-distribution (OOD)** describes an input that does not come from the same data distribution the model was trained (or evaluated) on. Under the usual i.i.d. assumption, train and test samples are drawn from a shared joint $P(X, Y)$. An OOD example is drawn from a different distribution $Q$, so the model's fit and its reported metrics no longer apply in the same way.

People use "OOD" in three related senses. **OOD data** is a property of the sample relative to a reference $P$ (training, fine-tuning, or a fixed eval set). **OOD detection** is the operational task of scoring each input as in-distribution (ID) or OOD so the system can abstain, escalate, or route. **OOD generalization** (often domain generalization) is the harder goal of still predicting well under $Q$ without a full retrain. This entry focuses on the data property and detection; generalization is the long-run product response once you know traffic left $P$.

[Data drift](glossary://data-drift) describes population $P(X)$ moving over time relative to a baseline. [Concept drift](glossary://concept-drift) describes a change in $P(Y \mid X)$, while an [anomaly](glossary://anomaly) is unusual relative to any chosen baseline, including ops metrics. Drift is usually a *stream* story; OOD is often a *support* story involving novel classes, domains, languages, or formats that never had mass under training $P$.

## Intuition

A classifier or LLM is optimized on examples from $P$. Inside the bulk of $P$, error rates and confidences have some meaning. Outside that bulk the model still produces an output (a class, a completion, a tool call) because the architecture always maps every input to something. That is the danger: **silent failure with fluent or high-confidence answers**.

Two rough geometries:

| Kind | Rough picture | Typical case |
| --- | --- | --- |
| **Near-OOD / covariate-style** | Same label space; $P(X)$ vs $Q(X)$ differ (style, sensor, length, domain) | Photos vs sketches; support tickets in a new product line |
| **Far-OOD / semantic** | Labels or tasks outside what the head was trained for | CIFAR classes vs random noise; intent model sees a new language; reward model scores free-form jailbreaks |

Training and eval can look excellent while production is full of near-OOD and occasional far-OOD. If you only measure average ID accuracy, you never see the miss.

## Formula

Write the reference (in-distribution) law as $P$ and the test law as $Q$. A clean but strong formalization of "OOD support" is that $Q$ places mass where $P$ does not:

$$
\mathrm{supp}(Q) \not\subseteq \mathrm{supp}(P)
$$

or, more weakly for continuous densities, regions where $q(x) \gg p(x)$ relative to training density. Classical **covariate shift** is milder: $P(X) \neq Q(X)$ while $P(Y \mid X) = Q(Y \mid X)$. **Label shift** keeps $P(X \mid Y)$ fixed and moves $P(Y)$. **Concept shift** moves $P(Y \mid X)$. Real products often mix several of these; "OOD" in papers often means *semantic* novelty (new classes or domains), while "drift monitors" track milder population change over time.

**Detection** turns each $x$ into a score $s(x)$ and a threshold $\tau$. Hendrycks and Gimpel (ICLR 2017) introduced the widely used **maximum softmax probability (MSP)** baseline for classifiers. With logits $f(x) \in \mathbb{R}^{K}$ and temperature $T=1$:

$$
s_{\mathrm{MSP}}(x) = \max_{y} \, p(y \mid x) = \max_{y} \frac{e^{f_y(x)}}{\sum_{j=1}^{K} e^{f_j(x)}}.
$$

Flag OOD (or likely error) when $s_{\mathrm{MSP}}(x)$ is low. Correct ID examples tend to have higher max softmax than errors and many OOD examples, but softmax can still be *overconfident* far from the data (high max-prob on nonsense).

Liu et al. (NeurIPS 2020) define a free-energy score from the same logits without the max-normalization bias of MSP:

$$
E(x; f) = -T \log \sum_{i=1}^{K} e^{f_i(x)/T},
$$

and treat **negative energy** $-E(x; f)$ as the ID-likeness score (higher = more ID). At $T=1$, $\log s_{\mathrm{MSP}}(x) = E(x; f) + f^{\max}(x) = E(x; f-f^{\max})$; at general $T$, divide this sum by $T$. Thus MSP includes a max-logit shift that changes its OOD ranking relative to negative energy. On the paper's CIFAR-10 WideResNet setup, switching from MSP to energy cut average FPR at 95% TPR from about $51\%$ to $33\%$ across its tested OOD image sets (no retrain).

Standard detection metrics (same paper lineage): **AUROC** of the ID-vs-OOD ranking, **AUPR**, and **FPR95** (fraction of OOD accepted as ID when the threshold keeps $95\%$ of ID accepted).

```python
import math

def msp_and_energy(logits, T=1.0):
    # logits: nonempty list/array of finite class scores
    if T <= 0:
        raise ValueError("temperature must be positive")
    m = max(logits)
    # stable logsumexp
    lse = m / T + math.log(sum(math.exp((z - m) / T) for z in logits))
    energy = -T * lse
    probs = [math.exp((z - m) / T) for z in logits]
    z = sum(probs)
    probs = [p / z for p in probs]
    return max(probs), energy  # high MSP / low energy => more ID-like
```

An autoregressive LLM has a vocabulary-sized next-token head, but it is not a fixed task-class head for classifying an entire request as ID or OOD. Practitioners reuse the idea with sequence logprobs, entropy, embedding distance to the fine-tune set, retrieval hit quality, or a dedicated OOD / safety classifier. Define the reference population and validate a score; these proxies need not measure geometric distance.

## Example

In a hypothetical example, a 12-class **ticket intent** classifier is trained and evaled on English chat tickets (mean 180 tokens). Offline accuracy on the held-out English chat split is $0.93$. Softmax confidences on that split sit high (median max-prob $0.91$).

Production week:

| Slice | Share of traffic | Median max-prob | Accuracy / human agree |
| --- | ---: | ---: | ---: |
| English chat (ID-like) | 72% | 0.90 | 0.91 |
| Long portal pastes (new workflow) | 18% | 0.86 | 0.61 |
| Spanish tickets (never in train) | 7% | 0.79 | 0.34 |
| Raw PDF OCR dumps | 3% | 0.88 | 0.22 |

MSP alone is a weak gate: OCR junk still gets max-prob $0.88$ and routes to the wrong queue. Adding energy on the classifier logits, plus a cheap language tag and prompt-length bin, separates the Spanish and OCR slices enough to **abstain or escalate** instead of auto-routing. An [evaluation slice](glossary://evaluation-slice) for `es_locale` and `long_portal_paste` would have failed the launch if those rows existed before ship; building them after the incident is the usual recovery path.

**LLM product variant.** A developer assistant is fine-tuned on Q&A over v1 deployment runbooks. Users paste a v3 approval policy and ask which checks block production. The prompt still looks like familiar engineering Q&A, but the controlling concept moved ([concept drift](glossary://concept-drift) in the corpus). Retrieval returns stale chunks; the model confidently repeats v1 requirements. Input OOD monitors on embedding distance to the fine-tune set may barely fire, while corpus versioning and slice evals catch the failure. OOD includes token novelty and shifts in the joint distribution of prompts and evidence used to validate the system.

## Diagram


You never observe true membership in $\mathrm{supp}(P)$ at request time. The score (MSP, energy, embedding distance, retrieval strength, judge) is a stand-in; the threshold trades coverage for selective risk.

## How it works in production

1. **Name the reference $P$.** Training set, fine-tune mix, golden eval, or a healthy production baseline. OOD is always relative to that choice.
2. **Build OOD and near-OOD slices.** Held-out domains, languages, lengths, tool schemas, adversarial prompts, empty retrieval, and "should abstain" rows. Score them separately from ID accuracy.
3. **Pick scores.** Classifiers: MSP, energy, Mahalanobis in feature space, ODIN-style temperature (use with care). LLMs: logprob / entropy aggregates, embedding distance to ID prompts, retrieval strength, dedicated [safety classifiers](glossary://safety-classifier) or OOD heads.
4. **Calibrate the gate.** Thresholds from ID holdout for target FPR/coverage; re-tune after retrain. Softmax is not [probability calibration](glossary://probability-calibration); don't treat max-prob as a real error rate without checking. Published FPR95 gaps and energy/MSP cutoffs are **setup-specific**: they don't transfer across architecture, train set, or OOD family without re-tuning on a held-out ID set.
5. **Couple to action.** [Abstention](glossary://abstention), human review, safer model, or tool deny-list. Detection without a path is dashboard noise.
6. **Separate monitors.** Population [data drift](glossary://data-drift) on live features catches slow mix shifts; pointwise OOD scores catch single hostile or novel requests. Both matter.

## Why it matters here

AI systems ship into open traffic. Users invent formats, languages, and goals that were never in the fine-tune mix. Classifiers and reward models still emit high scores on OOD inputs; LLMs still produce fluent text. Without OOD-aware evals and gates, offline ID metrics overstate safety. For LeetLLM-style work (classifiers, RAG, agents, RLHF), treat OOD as a first-class test axis: define ID support, score distance from it, and decide what the product does when support fails.

## Related terms

- [Data drift](glossary://data-drift)
- [Concept drift](glossary://concept-drift)
- [Probability calibration](glossary://probability-calibration)
- [Abstention](glossary://abstention)
- [Evaluation slice](glossary://evaluation-slice)
