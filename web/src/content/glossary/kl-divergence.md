---
title: KL divergence
aliases: ["KL", "Kullback-Leibler divergence", "relative entropy"]
importance: 84
---
Kullback–Leibler (KL) divergence, also called **relative entropy**, measures how much one probability distribution differs from a reference. For a "true" or sampling distribution $P$ and an approximating distribution $Q$,

$$
D_{\mathrm{KL}}(P \Vert Q) = \sum_x P(x) \log \frac{P(x)}{Q(x)}
$$

(for discrete distributions over the same alphabet, with the zero-probability conventions below). Their supports need not be identical. It is the expected extra surprisal of coding samples from $P$ with a code built for $Q$. It is **directional**: $D_{\mathrm{KL}}(P \Vert Q) \neq D_{\mathrm{KL}}(Q \Vert P)$ in general. It is **not a metric**: it is asymmetric and does not satisfy the triangle inequality. It is always $\ge 0$, and equals $0$ if and only if $P=Q$ almost everywhere (Gibbs' inequality).

In ML and LLM work you meet the same quantity under different names: relative entropy in information theory, a KL penalty that anchors a policy to a reference model in [RLHF](glossary://rlhf) / [PPO](glossary://ppo) / [DPO](glossary://dpo), soft-label matching in distillation, and a closed-form regularizer in VAEs.

## Intuition

Shannon entropy $H(P)$ is the ideal average code length if you know $P$. [Cross-entropy](glossary://cross-entropy) $H(P,Q)$ is the average length if you *think* the world is $Q$ while samples still come from $P$. The gap is KL:

$$
D_{\mathrm{KL}}(P \Vert Q) = H(P, Q) - H(P).
$$

So KL is the **extra cost of the wrong codebook**, not a generic "distance" you can swap ends of.

Two operational stories matter for engineers:

1. **$P$ is data or the policy you sample from; $Q$ is a model or reference.** Then $D_{\mathrm{KL}}(P \Vert Q)$ asks: when outcomes come from $P$, how badly does $Q$ mis-score them? That is the usual coding / maximum-likelihood story.
2. **You optimize an approximate $Q$ toward a fixed $P$.** Direction of the KL in the loss changes the geometry of the fit (mass-covering vs mode-seeking; see below).

Because expectation is under the left argument, regions where $P(x)$ is large dominate the sum. Regions where $P(x)=0$ contribute nothing, even if $Q$ puts mass there. Regions where $Q(x)=0$ but $P(x)>0$ send the term to $+\infty$: the reference has no support for something the true distribution still assigns probability.

## Formula

**Discrete (finite support).** Over the same alphabet $\mathcal{X}$:

$$
D_{\mathrm{KL}}(P \Vert Q)
= \sum_{x \in \mathcal{X}} P(x) \log \frac{P(x)}{Q(x)}
= \mathbb{E}_{x \sim P}\big[\log P(x) - \log Q(x)\big].
$$

Use natural log for nats (standard in autodiff frameworks) or $\log_2$ for bits. The choice only multiplies the scale: $D_{\log_2} = D_{\ln} / \ln 2$.

**Continuous densities.** With densities $p$ and $q$ w.r.t. the same measure:

$$
D_{\mathrm{KL}}(P \Vert Q) = \int p(x) \log \frac{p(x)}{q(x)}\, dx.
$$

**Absolute continuity.** $D_{\mathrm{KL}}(P \Vert Q)$ is finite only if $P$ is absolutely continuous w.r.t. $Q$ (wherever $P>0$, also $Q>0$). Otherwise it is conventionally $+\infty$. Absolute continuity is necessary, but for continuous or infinite alphabets the integral can still diverge. Handle zero terms explicitly in code; clipping or smoothing changes the distributions and therefore the quantity being measured.

**Convention when $P(x)=0$.** The summand $0 \cdot \log(0/Q(x))$ is taken as $0$ (because $\lim_{t \to 0^+} t \log t = 0$).

**Autoregressive sequences.** For full responses $y$ given prompt $x$,

$$
\log \pi(y \mid x) = \sum_t \log \pi(y_t \mid x, y_{<t}),
$$

so a sequence-level KL expands into a sum of token-level log-ratio terms under the sampling policy. Training stacks usually report **mean per-token KL** as a monitor even when the objective uses a sequence or reward-shaped form.

**Diagonal Gaussian vs standard normal (VAE).** For $q(z)=\mathcal{N}(\mu, \mathrm{diag}(\sigma^2))$ and $p(z)=\mathcal{N}(0,I)$,

$$
D_{\mathrm{KL}}(q \Vert p)
= \frac{1}{2}\sum_j \big(\mu_j^2 + \sigma_j^2 - 1 - \log \sigma_j^2\big)
= -\frac{1}{2}\sum_j \big(1 + \log \sigma_j^2 - \mu_j^2 - \sigma_j^2\big).
$$

That closed form is why VAE training never needs Monte Carlo for the prior-matching term under these choices (Kingma and Welling, 2014).

## Worked numbers

Let $P=[0.7, 0.2, 0.1]$ and $Q=[0.5, 0.3, 0.2]$, natural log:

$$
\begin{align*}
D_{\mathrm{KL}}(P \Vert Q)
&= 0.7\log\frac{0.7}{0.5} + 0.2\log\frac{0.2}{0.3} + 0.1\log\frac{0.1}{0.2} \\
&\approx 0.2355 + (-0.0811) + (-0.0693) \\
&\approx 0.0851~\mathrm{nats}
\approx 0.123~\mathrm{bits}.
\end{align*}
$$

Swap the order:

$$
D_{\mathrm{KL}}(Q \Vert P) \approx 0.0920~\mathrm{nats}.
$$

Same pair of vectors, different number, different meaning. Cross-check via entropy: $H(P)\approx 0.802$, $H(P,Q)\approx 0.887$, and $H(P,Q)-H(P)\approx 0.085$.

```python
import math

def kl_div(p: list[float], q: list[float]) -> float:
    # assumes same length, p,q > 0, both sum to 1
    return sum(pi * math.log(pi / qi) for pi, qi in zip(p, q))

P = [0.7, 0.2, 0.1]
Q = [0.5, 0.3, 0.2]
print(round(kl_div(P, Q), 4))  # 0.0851
print(round(kl_div(Q, P), 4))  # 0.0920
```

In PyTorch, `F.kl_div(input, target, reduction=...)` expects `input` as **log-probabilities of $Q$** and `target` as **probabilities of $P$** when computing $D_{\mathrm{KL}}(P \Vert Q)$. Use `reduction="batchmean"` for a batch-averaged KL that matches the math; default `"mean"` divides by every element and under-reports. The argument order is easy to invert; unit-test against a hand calculation on a 3-class toy.

## Example

**RLHF policy anchor.** InstructGPT-style training (Ouyang et al., 2022) raises a reward-model score while keeping the learned policy $\pi_\theta$ near a frozen reference $\pi_{\mathrm{ref}}$ (usually the SFT model). The objective is

$$
\max_\theta\; \mathbb{E}_{x\sim\mathcal{D},\, y\sim\pi_\theta}\big[r_{\mathrm{RM}}(x,y)\big]
- \beta\, \mathbb{E}_{x\sim\mathcal{D}}\Big[D_{\mathrm{KL}}\big(\pi_\theta(\cdot\mid x)\,\Vert\,\pi_{\mathrm{ref}}(\cdot\mid x)\big)\Big].
$$

In the bandit environment this is implemented as a **per-token KL penalty** on the sampled completion: subtract $\beta\sum_t\big(\log\pi_\theta(y_t\mid x,y_{<t})-\log\pi_{\mathrm{ref}}(y_t\mid x,y_{<t})\big)$ from $r_{\mathrm{RM}}(x,y)$. That log-ratio is an unbiased sample of the sequence KL when $y\sim\pi_\theta$; the full distribution KL averages this quantity over completions. The coefficient $\beta$ (sometimes $\eta$) is the leash:

| $\beta$ too small | $\beta$ too large |
| --- | --- |
| Reward hacks, length gaming, style collapse toward RM quirks | Policy barely moves; win rate stalls near SFT |
| Mean KL climbs; outputs look alien | Mean KL stays near $0$ |

[DPO](glossary://dpo) never runs PPO, but it optimizes the **same KL-constrained preference objective** after a change of variables: $\beta$ is still the strength of the implicit KL regularizer toward $\pi_{\mathrm{ref}}$.

**Distillation soft targets.** With teacher logits $z^T$, student logits $z^S$, and temperature $T>1$,

$$
p^T_i = \mathrm{softmax}(z^T_i / T),\qquad
p^S_i = \mathrm{softmax}(z^S_i / T),
$$

a common soft loss is $T^2 D_{\mathrm{KL}}(p^T \Vert p^S)$ (Hinton et al., 2015). Raising $T$ flattens both distributions so dark knowledge in the relative ranking of wrong classes is visible; the $T^2$ factor keeps gradient scale roughly stable as $T$ grows.

Tiny numeric sketch ($T=2$, three classes). Teacher logits $[2.0, 1.0, 0.1]$, student $[1.5, 1.2, 0.5]$ give soft labels $\approx[0.502, 0.304, 0.194]$ and $\approx[0.405, 0.349, 0.246]$, so $D_{\mathrm{KL}}(p^T \Vert p^S)\approx 0.0195$ nats and $T^2 D_{\mathrm{KL}}\approx 0.078$.

## Direction matters

When fitting an approximate $Q_\theta$ to a fixed target $P$:

| Objective | Common name | Geometry (limited family) |
| --- | --- | --- |
| $\min_\theta D_{\mathrm{KL}}(P \Vert Q_\theta)$ | Forward / inclusive KL | **Mass-covering**: $Q$ must put mass wherever $P$ does; tends to overspread |
| $\min_\theta D_{\mathrm{KL}}(Q_\theta \Vert P)$ | Reverse / exclusive KL | **Mode-seeking**: $Q$ is punished for mass where $P$ is small; can latch onto one mode |

Variational inference classically minimizes reverse KL $D_{\mathrm{KL}}(q \Vert p)$. Autoregressive LM next-token training minimizes cross-entropy to data, which (for fixed data $P$) is equivalent to forward KL plus a constant $H(P)$. Distillation usually matches teacher $\to$ student as $D_{\mathrm{KL}}(p^T \Vert p^S)$ (forward in the teacher-as-$P$ convention). RLHF regularizes with $D_{\mathrm{KL}}(\pi_\theta \Vert \pi_{\mathrm{ref}})$ so the *policy you sample* cannot put mass where the reference is extremely unlikely.

If a paper or trainer says "add a KL term" without writing the arguments, check which distribution is inside the expectation and which sits in the denominator. That single detail decides the loss surface.

## What fails in production

- **Wrong argument order in the API.** Frameworks disagree on whether the first tensor is $P$ or $\log Q$. A swapped call can train, look finite, and still optimize the wrong geometry.
- **Support / padding / masking.** Including pad tokens, prompt tokens you meant to mask, or vocab slots forced to zero breaks the shared-support assumption and poisons mean KL monitors.
- **Treating KL as a health score alone.** In RLHF, reward up + KL exploding often means reward hacking or length exploitation, not "better alignment." Track KL together with win rate, length, entropy, and slice evals.
- **β / temperature left at defaults forever.** Reference drift after continued SFT, chat-template changes, or tokenizer fixes invalidates the old $\beta$ and old reference logprobs.
- **Comparing nats to bits or batch-sum to token-mean.** Always state units and reduction when logging "KL = 0.02."

## Why it matters here

Post-training, distillation, calibration diagnostics, and distribution-shift checks compare full probability laws alongside point predictions. KL is the standard one-way stick: it ties [cross-entropy](glossary://cross-entropy) training to maximum likelihood, gives the leash in preference optimization, and is the soft-label loss when a teacher teaches a student. Interpret a KL value only after identifying **which distribution is on the left**.

## Related terms

- [Cross-entropy](glossary://cross-entropy)
- [Logprob](glossary://logprob)
- [Softmax](glossary://softmax)
- [DPO](glossary://dpo)
- [RLHF](glossary://rlhf)
