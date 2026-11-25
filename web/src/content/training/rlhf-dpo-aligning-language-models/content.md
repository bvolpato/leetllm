---
{
  "id": "rlhf-dpo-aligning-language-models",
  "title": "RLHF & DPO Alignment",
  "slug": "rlhf-dpo-aligning-language-models",
  "category": "Alignment & Safety",
  "difficulty": "Hard",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google DeepMind",
    "Meta"
  ],
  "shortDescription": "An internal reward score can climb while blinded human comparisons stay flat. Turn preference pairs into a PPO update or a DPO loss, and verify the real behavior change.",
  "keyConceptsTested": [
    "RLHF pipeline from SFT to reward modeling to PPO",
    "Bradley-Terry preference probability as a reward-gap sigmoid",
    "PPO four-role loop and KL-shaped reward",
    "DPO implicit reward and pairwise loss",
    "Likelihood displacement versus a rising DPO margin",
    "Online RLHF versus offline preference optimization",
    "Reward hacking and held-out human preference evaluation",
    "Alignment variants (IPO, KTO, ORPO, SimPO, GRPO)"
  ],
  "section": "Training, Fine-Tuning & Alignment",
  "order": 12,
  "coverImage": "social_banner.png",
  "prerequisites": [
    "supervised-fine-tuning-pipeline",
    "reward-modeling-from-preference-data"
  ],
  "relatedQuestions": [
    "reward-modeling-from-preference-data",
    "rlvr-verifiable-rewards-training"
  ],
  "aliases": [
    "constitutional-ai-automated-red-teaming"
  ]
}
---

Your candidate raises internal reward-model score by `+0.31`, yet wins only 184 of 400 blinded human comparisons while growing 48 tokens longer and prepending `"Verified answer:"`. Would you ship it?

That divergence between proxy score and human preference defines alignment engineering. On our Python `softmax(z)` overflow question, subtracting `max(z)` before `exp(z)` scored `1.80` while casting to `float64` after `exp(z)` scored `0.70` (a `1.10` <span data-glossary="bradley-terry-model">Bradley-Terry</span> margin, ~75% win probability). Should you optimize the policy online against that <span data-glossary="reward-model">reward model</span> with <span data-glossary="rlhf">RLHF</span>, or directly on preference pairs with <span data-glossary="dpo">DPO</span>?

## What preference pairs add to SFT

<span data-glossary="supervised-fine-tuning">SFT</span> imitates demonstrations yet still leaves subtle bugs, verbosity, and miscalibrated refusals.[^ouyang2022] Pairwise preferences give the optimizer an explicit contrast on the exact same prompt (pushing "subtract `max(z)` before `exp(z)`" above "cast after `exp(z)`"), and comparing two outputs is faster to label than writing gold answers from scratch.

<figure>
  <img src="illustrations/_generated/alignment_gap_dark.png" alt="Softmax overflow prompt branching into subtract-max(z) (1.80) vs cast-after-exp (0.70), mapping via Bradley-Terry to ~75% preference." />
  <figcaption>A 1.10 reward margin maps through Bradley-Terry to ~75% preference for subtracting `max(z)` before `exp(z)`.</figcaption>
</figure>

## RLHF: a judge, then an actor

Classic RLHF runs three stages: **SFT**, **reward modeling** under Bradley-Terry loss $\mathcal{L}_{\text{RM}} = -\mathbb{E}[\log\sigma(r(x, y_w) - r(x, y_l))]$, and **online <span data-glossary="ppo">PPO</span>** optimizing expected reward minus a <span data-glossary="kl-divergence">KL divergence</span> penalty from the frozen SFT reference $\pi_{\text{ref}}$:[^stiennon2020][^ouyang2022][^schulman2017]

$$
\max_\theta \; \mathbb{E}_{x,\, y \sim \pi_\theta(\cdot \mid x)} \left[ r(x, y) \right] - \beta \, \mathbb{E}_{x} \left[ \mathbb{D}_{\text{KL}}\!\left(\pi_\theta(\cdot \mid x) \parallel \pi_{\text{ref}}(\cdot \mid x)\right) \right]
$$

For fixed $r$ and $x$, factoring $-\beta$ reveals an exact closed-form optimum (intractable to sample directly because $Z(x)$ sums over all strings, which PPO approximates via rollouts and DPO cancels algebraically[^rafailov2023]):

$$
\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x) \exp\!\left( \frac{r(x, y)}{\beta} \right), \qquad Z(x) = \sum_y \pi_{\text{ref}}(y \mid x) \exp\!\left(\frac{r(x, y)}{\beta}\right)
$$

### Token-level reward shaping and the four model roles

PPO coordinates **four logical roles**: trainable **actor** ($\pi_\theta$) and **critic** ($V_\psi$), plus frozen **reference** ($\pi_{\text{ref}}$) and **reward model** ($r_\phi$). With four separate 70B backbones (16 B/param trainable, 2 B/param frozen), state alone takes **2,520 GB** (`1,120` each for actor/critic, `140` each for ref/reward); dropping the critic cuts 44.4% to `1,400 GB` (in practice roles can share weights or use smaller critics, and frameworks like OpenRLHF support colocated or async rollout engines[^openrlhf2026framework]).

We charge the per-token KL drift $-\beta(\log\pi_{\text{old}} - \log\pi_{\text{ref}})$ at every token and add $r_\phi(x, y)$ at final token $T$. **Generalized Advantage Estimation (GAE)** propagates terminal reward backward via $\delta_t = R_t + \gamma V(s_{t+1}) - V(s_t)$ and $\hat{A}_t = \delta_t + \gamma\lambda \hat{A}_{t+1}$ ($V(s_{T+1}) = 0$ at true termination):[^schulman2015gae]

<!-- leetllm: test, output=show, output_title="GAE credit and KL-shaped reward" -->
```python title="terminal_credit_and_kl_shaping.py"
def gae(rewards: list[float], values: list[float], lam: float, gamma: float = 1.0) -> list[float]:
    adv, running = [0.0] * len(rewards), 0.0
    for t in reversed(range(len(rewards))):
        running = (rewards[t] + gamma * values[t + 1] - values[t]) + gamma * lam * running
        adv[t] = running
    return adv

# fold:start GAE decay & KL-shaping check
for lam in (1.0, 0.5):
    print(f"GAE lambda={lam:.1f} -> {gae([0.0, 0.0, 1.0], [0.0, 0.0, 0.0, 0.0], lam)}")
for name, rew, pi_lp, ref_lp in [("near_reference", 1.20, -2.1, -2.2), ("preamble_hack", 1.35, -1.2, -2.8)]:
    print(f"{name:15s}: raw={rew:.2f}, log_ratio={pi_lp - ref_lp:+.1f}, shaped={rew - 0.20 * (pi_lp - ref_lp):.2f}")
# fold:end
```

<!-- leetllm: output:start -->
```text title="GAE credit and KL-shaped reward" output compact
GAE lambda=1.0 -> [1.0, 1.0, 1.0]
GAE lambda=0.5 -> [0.25, 0.5, 1.0]
near_reference : raw=1.20, log_ratio=+0.1, shaped=1.18
preamble_hack  : raw=1.35, log_ratio=+1.6, shaped=1.03
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/terminal_credit_assignment_dark.png" alt="Backward GAE propagation of terminal reward 1 across three tokens: [1, 1, 1] at lambda=1 and [0.25, 0.5, 1] at lambda=0.5." />
  <figcaption>Backward GAE carries terminal reward to earlier tokens; smaller $\lambda$ decays credit further from the end.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/ppo_four_model_loop_dark.png" alt="Four PPO roles: reward 1.35 minus KL 0.32 gives 1.03, minus critic 0.80 gives advantage 0.23, times ratio 1.20 gives surrogate 0.276." />
  <figcaption>One PPO step across all four logical roles: return `1.03`, critic `0.80`, advantage `0.23`, clipped surrogate `0.276`.</figcaption>
</figure>

### What PPO actually clips

Across rollout-batch epochs, PPO forms ratio $\rho_t(\theta) = \pi_\theta(a_t \mid s_t) / \pi_{\text{old}}(a_t \mid s_t)$ (denominator is the **rollout snapshot** $\pi_{\text{old}}$, not $\pi_{\text{ref}}$) and maximizes:

$$
L_t = \min\!\left(\rho_t \hat{A}_t,\; \operatorname{clip}(\rho_t, 1 - \epsilon, 1 + \epsilon)\hat{A}_t\right)
$$

Clipping removes gradient incentive past $1+\epsilon$ when $\hat{A}_t > 0$ or below $1-\epsilon$ when $\hat{A}_t < 0$, while leaving harmful moves fully penalized (it is not a hard clamp on probabilities or KL).

<!-- leetllm: test, output=show, output_title="PPO clipped surrogate" -->
```python title="ppo_clipped_surrogate.py"
def surrogate(ratio: float, advantage: float, epsilon: float = 0.2) -> float:
    return min(ratio * advantage, min(max(ratio, 1 - epsilon), 1 + epsilon) * advantage)

for advantage in (1.0, -1.0):
    print(f"A={advantage:+.0f} at [0.5, 1.0, 1.5] -> {[round(surrogate(r, advantage), 2) for r in (0.5, 1.0, 1.5)]}")
```

<!-- leetllm: output:start -->
```text title="PPO clipped surrogate" output compact
A=+1 at [0.5, 1.0, 1.5] -> [0.5, 1.0, 1.2]
A=-1 at [0.5, 1.0, 1.5] -> [-0.8, -1.0, -1.5]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/ppo_clipped_surrogate_dark.png" alt="PPO clipped surrogate curves at epsilon=0.2 flattening above 1.2 for positive advantage and below 0.8 for negative advantage." />
  <figcaption>Solid curves show the clipped PPO objective; clipping flattens overshoot incentives while keeping harmful moves penalized.</figcaption>
</figure>

## DPO: turn reward fitting into policy fitting

### Why an offline loss can stand in for RL

Solving the closed-form optimal policy for $r(x, y)$ gives $r(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)$. Substituting into Bradley-Terry cancels $Z(x)$ identically, defining implicit reward $\hat{r}_\theta(x, y) = \beta \log \frac{\pi_\theta(y \mid x)}{\pi_{\text{ref}}(y \mid x)}$ and the DPO objective:[^rafailov2023]

$$
\mathcal{L}_{\text{DPO}}(\theta) = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma\!\left( \beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} \right) \right]
$$

Differentiating produces a hard-pair-weighted push-pull update:

$$
\nabla_\theta \mathcal{L}_{\text{DPO}} = -\beta \, \mathbb{E} \left[ \sigma(\hat{r}_l - \hat{r}_w) \left( \nabla_\theta \log \pi_\theta(y_w \mid x) - \nabla_\theta \log \pi_\theta(y_l \mid x) \right) \right]
$$

Notice the **dual role of $\beta$**: for fixed preference odds $p/(1-p)$ over a uniform reference, the ideal optimal policy has odds $(p/(1-p))^{1/\beta}$ (so larger $\beta$ stays closer to $\pi_{\text{ref}}$), while at initialization ($m=0$) the loss slope for one observed vote is $\partial L / \partial m = -\beta / 2$ (larger $\beta$ scales initial gradient magnitude up).

### Computing DPO from token logits

On our `softmax(z)` pair, suppose summed response log-probabilities are chosen `(-8.2 policy, -8.5 ref)` and rejected `(-9.5 policy, -9.1 ref)` with $\beta = 0.1$: the chosen log-ratio is `+0.3`, the rejected log-ratio is `-0.4`, the margin is `+0.7`, the scaled logit is `0.07`, and the DPO loss is $-\ln\sigma(0.07) \approx 0.659$.

Sum response log-probabilities across **response tokens plus EOS only**, shifting logits by one and masking prompt and padding positions by index (never by token ID, since `0` can be valid content):

<!-- leetllm: test, deps=torch, output=show, output_title="DPO token logprob loss in PyTorch" -->
```python title="dpo_loss_from_token_logits.py"
# fold:start imports & logit tensors
import torch
import torch.nn.functional as F

chosen_ids = torch.tensor([0, 2, 1, 2, 4, 0])
rejected_ids = torch.tensor([0, 2, 3, 0, 4, 0])
attn_mask = torch.tensor([1, 1, 1, 1, 1, 0], dtype=torch.bool)
prompt_len, beta = 2, 0.1

chosen_pi = torch.tensor([
    [0.0]*5, [0.0, 2.4, 0.1, -0.8, -1.0], [0.0, 0.2, 2.1, -0.6, -1.0],
    [0.0, 0.0, 0.0, 0.0, 2.0], [0.0]*5, [0.0]*5,
], requires_grad=True)
chosen_ref = torch.tensor([
    [0.0]*5, [0.0, 0.8, 0.2, 0.0, -1.0], [0.0, 0.1, 0.9, 0.0, -1.0],
    [0.0, 0.0, 0.0, 0.0, 2.0], [0.0]*5, [0.0]*5,
])
rejected_pi = torch.tensor([
    [0.0]*5, [0.2, -0.4, -0.2, 1.1, -1.0], [1.0, -0.3, -0.4, 0.2, -1.0],
    [0.0, 0.0, 0.0, 0.0, 2.0], [0.0]*5, [0.0]*5,
], requires_grad=True)
rejected_ref = torch.tensor([
    [0.0]*5, [0.1, 0.0, 0.0, 0.6, -1.0], [0.7, 0.0, 0.0, 0.2, -1.0],
    [0.0, 0.0, 0.0, 0.0, 2.0], [0.0]*5, [0.0]*5,
])
# fold:end

def response_logprob(logits: torch.Tensor, ids: torch.Tensor) -> torch.Tensor:
    token_logp = F.log_softmax(logits[:-1], dim=-1).gather(-1, ids[1:].unsqueeze(-1)).squeeze(-1)
    resp_mask = attn_mask[1:].clone()
    resp_mask[: prompt_len - 1] = False
    return (token_logp * resp_mask).sum()

c_logp, r_logp = response_logprob(chosen_pi, chosen_ids), response_logprob(rejected_pi, rejected_ids)
margin = (c_logp - response_logprob(chosen_ref, chosen_ids)) - (r_logp - response_logprob(rejected_ref, rejected_ids))
loss = -F.logsigmoid(beta * margin)
loss.backward()

# fold:start print metrics & gradient check
print(f"chosen={c_logp.item():.3f}, rejected={r_logp.item():.3f}, margin={margin.item():.3f}, loss={loss.item():.3f}")
print("zero grad on prompt/pad:", chosen_pi.grad[0].abs().sum().item() == 0.0 and chosen_pi.grad[4].abs().sum().item() == 0.0)
# fold:end
```

<!-- leetllm: output:start -->
```text title="DPO token logprob loss in PyTorch" output compact
chosen=-0.993, rejected=-1.882, margin=0.640, loss=0.662
zero grad on prompt/pad: True
```
<!-- leetllm: output:end -->

> **Common mistake:** Treating per-token mean log-prob as equivalent to summed sequence log-prob. A 4-token chosen response with summed log-ratio `+0.40` (mean `+0.10`) beats a 2-token rejected response at `+0.30` (mean `+0.15`) under DPO (`+0.10`), whereas per-token averaging flips the sign to `-0.05`.[^rafailov2023][^huggingface2026dpoSource]

### Likelihood displacement and TRL setup

Because DPO maximizes the *difference* between chosen and rejected log-ratios, the margin can climb (`0 -> +1.50`) while **both** responses drop below reference likelihood (rejected simply falls faster), a phenomenon Razin et al. called **likelihood displacement** (DPOP adds a penalty when chosen drops below reference).[^dpoLikelihoodDisplacement2024][^pal2024smaug] Monitor $\log\pi_\theta(y_w)$, $\log\pi_\theta(y_l)$, margin, and held-out generations together.

<figure>
  <img src="illustrations/_generated/likelihood_displacement_dark.png" alt="Pairwise margin climbs from 0 to 1.50 while chosen log-ratio drops from +0.30 to -0.60 below reference because rejected drops faster to -2.10." />
  <figcaption>The pairwise margin climbs from 0 to 1.50 even as the chosen response falls below its SFT reference likelihood.</figcaption>
</figure>

In TRL's `DPOTrainer`, `precompute_ref_log_probs=True` caches reference sums and valid target counts per `(prompt, completion)` so only one model stays in GPU memory,[^trlDpoTrainer2026][^trl2026DpoTrainerV117] meaning uncached completions cannot be scored against the freed reference later (pass all eval splits upfront and set `max_length` so differences aren't truncated).[^huggingface2026dpoSource][^trl2026DpoConfigV117]

```python title="trl_dpo_setup_fragment.py"
from trl import DPOConfig, DPOTrainer

trainer = DPOTrainer(
    model=sft_checkpoint, processing_class=tokenizer,
    args=DPOConfig(output_dir="runs/softmax-dpo", beta=0.1, precompute_ref_log_probs=True,
                   max_length=2048, learning_rate=5e-6, max_steps=200),
    train_dataset=train_pairs, eval_dataset=eval_pairs,
)
trainer.train()
```

## Comparing RLHF and DPO

RLHF and DPO trade **online exploration** against **simplicity**:[^ouyang2022][^rafailov2023] PPO samples fresh completions every step (4 logical roles, rollout cost, reward hacking risk), whereas vanilla DPO optimizes a fixed offline pair set (2 roles, lower cost, vulnerable to stale pairs and unseen-response mass).

<figure>
  <img src="illustrations/_generated/rlhf_vs_dpo_dark.png" alt="PPO scores fresh rollouts online across 4 roles; vanilla DPO repeatedly updates on fixed cached pairs." />
  <figcaption>PPO scores fresh completions from the live policy every step; vanilla DPO optimizes against a fixed pair dataset.</figcaption>
</figure>

| Dimension | RLHF (PPO) | Vanilla DPO |
|---|---|---|
| **Reward model** | Separate trained scorer $r_\phi$ | Implicit in $\beta \log(\pi_\theta/\pi_{\text{ref}})$ |
| **Loop** | On-policy RL with live rollouts | Offline pairwise classification |
| **Logical roles** | Actor, reference, reward, critic | Policy, reference (can precompute) |
| **Online exploration** | Yes: sees new failures it invents | No, unless pairs refresh iteratively |
| **Primary risks** | Reward hacking, critic noise, rollout cost | Stale pairs, unseen mass, displacement |

### DPO's blind spot: the answer nobody compared

With three candidate answers (A correct, B buggy, unseen C buggy), any two policies keeping identical 4:1 A-to-B odds incur the **exact same DPO loss** even if unseen C absorbs 90% of probability mass:

<!-- leetllm: test, output=show, output_title="Unseen response coverage" -->
```python title="dpo_unseen_response_mass.py"
from math import exp, log, log1p

ref = {"A": 1 / 3, "B": 1 / 3, "C": 1 / 3}
for name, pi in [("Policy 1", {"A": 0.40, "B": 0.10, "C": 0.50}), ("Policy 2", {"A": 0.08, "B": 0.02, "C": 0.90})]:
    margin = log(pi["A"] / ref["A"]) - log(pi["B"] / ref["B"])
    print(f"{name}: A/B odds={pi['A'] / pi['B']:.1f}, DPO loss={log1p(exp(-0.1 * margin)):.4f}, unseen C={pi['C']:.0%}")
```

<!-- leetllm: output:start -->
```text title="Unseen response coverage" output compact
Policy 1: A/B odds=4.0, DPO loss=0.6262, unseen C=50%
Policy 2: A/B odds=4.0, DPO loss=0.6262, unseen C=90%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/unseen_response_mass_dark.png" alt="Simplex showing constant-odds line where DPO loss stays 0.62623 while unseen bug C climbs from 50% to 90% mass." />
  <figcaption>Along the constant A/B odds line, DPO loss stays frozen at `0.62623` while unseen bug C climbs from 50% to 90% mass.</figcaption>
</figure>

**Iterative / Online DPO** closes this gap without a critic by periodically sampling fresh pairs from the current policy, labeling them, and updating again.[^calandriello2024]

## When the proxy lies

Returning to our opening candidate (`+0.31` reward, `+48` tokens, `"Verified answer:"` prefix, `184/400` human wins): check reward hacking (length gaming, sycophancy, format exploitation) with controlled rewrites, and remember DPO's `0.693` ($\ln 2$) step-0 loss is normal (if it stays stuck, check optimizer updates, contradictory labels, or truncation).

Never ship on internal reward alone. Gate promotion on blinded held-out human comparisons using a 95% Wilson CI (lower bound > 50%) plus a length-growth cap (`+20` tokens):[^nistBinomialIntervals2026] `184/400` gives `46.0%` with 95% Wilson CI `[41.2%, 50.9%]`, failing both checks.

<figure>
  <img src="illustrations/_generated/alignment_failure_guardrails_dark.png" alt="184/400 human wins gives 46.0% (95% Wilson CI [41.2%, 50.9%]) and +48 tokens against a +20 cap, blocking promotion despite +0.31 reward." />
  <figcaption>The 95% Wilson interval crosses 50% and length jumps 48 tokens, overriding the `+0.31` proxy reward gain.</figcaption>
</figure>

## Compare related methods by training signal and system cost

| Method | Mechanism | Tradeoff |
|---|---|---|
| **IPO**[^azar2023] | Squared loss $\mathbb{E}[(m - \frac{1}{2\tau})^2]$ targeting finite margin $1/(2\tau)$ (derivative $2(m - \frac{1}{2\tau})$) | Curbs runaway margins on deterministic pairs |
| **KTO**[^ethayarajh2024] | Unpaired desirable/undesirable labels around $z_0$ (raising log-ratio lowers desirable loss, raises undesirable loss) | No pairs needed; sensitive to selection bias |
| **ORPO**[^hong2024] | SFT + odds-ratio penalty in one stage, no reference model | Saves reference VRAM; couples SFT and preference |
| **SimPO**[^meng2024] | Length-normalized average token log-prob + target margin, no reference | Cuts length bias; check completeness |
| **GRPO**[^shao2024][^deepseekai2025] | Online RL without a critic: standardizes rewards across $G$ rollouts per prompt | Cuts critic VRAM; flat groups give zero advantage |

### GRPO: group-relative advantage without a critic

**GRPO** samples $G$ completions per prompt, scores each, and standardizes within the group ($\hat{A}_i = (r_i - \mu) / (\sigma + \epsilon)$), applying $\hat{A}_i$ to every token inside a clipped surrogate plus a non-negative KL penalty $k_{i,t} = \exp(\ell_{i,t}) - \ell_{i,t} - 1$ ($\ell_{i,t} = \log(\pi_{\text{ref}} / \pi_\theta)$):[^shao2024][^deepseekai2025]

$$
\mathcal{L}_{\text{GRPO}} = -\frac{1}{G}\sum_{i=1}^G \frac{1}{T_i}\sum_{t=1}^{T_i} \left[\min\!\left(\rho_{i,t}\hat{A}_i,\; \operatorname{clip}(\rho_{i,t}, 1-\epsilon, 1+\epsilon)\hat{A}_i\right) - \beta k_{i,t}\right]
$$

When every rollout in a group earns the same reward, $\sigma = 0$ and all reward advantages collapse to `0.0` while any separate KL penalty stays active (TRL tracks `frac_reward_zero_std` and defaults `beta=0.0` unless enabled).[^huggingface2026grpotrainer][^huggingface2026grpoSource]

<!-- leetllm: test, output=show, output_title="GRPO group advantages and IPO/KTO signals" -->
```python title="grpo_ipo_kto_signals.py"
# fold:start imports & helpers
from math import exp
from statistics import mean, pstdev

def group_advantages(rewards: list[float]) -> list[float]:
    mu, sigma = mean(rewards), pstdev(rewards)
    return [0.0] * len(rewards) if sigma == 0 else [round((r - mu) / sigma, 3) for r in rewards]

def kto_loss(log_ratio: float, desirable: bool, beta: float = 0.5, z0: float = 0.2) -> float:
    return 1 - 1 / (1 + exp(-(1 if desirable else -1) * beta * (log_ratio - z0)))
# fold:end

print("GRPO mixed:", group_advantages([1.0, 0.0, 0.5, 1.0]), "| flat:", group_advantages([1.0] * 4))
print("IPO (tau=0.1, target=5) at m=[0,5,10]:", [round((m - 5.0) ** 2, 1) for m in (0.0, 5.0, 10.0)])
print(f"KTO desirable 1->2: {kto_loss(1.0, True):.3f}->{kto_loss(2.0, True):.3f} | undesirable 1->2: {kto_loss(1.0, False):.3f}->{kto_loss(2.0, False):.3f}")
```

<!-- leetllm: output:start -->
```text title="GRPO group advantages and IPO/KTO signals" output compact
GRPO mixed: [0.905, -1.508, -0.302, 0.905] | flat: [0.0, 0.0, 0.0, 0.0]
IPO (tau=0.1, target=5) at m=[0,5,10]: [25.0, 0.0, 25.0]
KTO desirable 1->2: 0.401->0.289 | undesirable 1->2: 0.599->0.711
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/grpo_group_advantages_dark.png" alt="GRPO advantages for [1, 0, 0.5, 1] are [0.90, -1.51, -0.30, 0.90]; flat [1, 1, 1, 1] yields all zeros." />
  <figcaption>GRPO centers and scales rewards within each prompt group; identical rewards give zero reward-driven advantages while separate KL penalties remain active.</figcaption>
</figure>

## Constitutional AI, RLAIF, and automated red teaming

**Constitutional AI (CAI)** scales safety alignment from a written constitution in two phases:[^bai2022][^anthropic2026constitution]

1. **SL-CAI (critique-revision SFT):** Elicit red-team draft $y_0$, critique and revise against a principle into $y^*$, and run SFT on $(x, y^*)$ only.
2. **RLAIF:** Sample pairs from $\pi_{\text{SL}}$, extract soft AI-judge preferences $q \in (0, 1)$ averaged across swapped A/B orders to cancel position bias, fit a soft cross-entropy reward model ($\frac{d\mathcal{L}}{dd} = \sigma(d) - q$), and run RL alongside human helpfulness labels.[^bai2022][^lee2023]

**Automated red teaming** probes both single-turn and multi-turn escalations (such as Crescendo[^perez2022][^russinovich2024crescendo]) across held-out attack families. Always pair **Attack Success Rate (ASR)** with **False Refusal Rate (FRR)** on benign lookalikes, report unjudged coverage bounds rather than treating unresolved attempts as passes, and keep **alignment separate from access control**: enforce auth, tenant permissions, and tool validation in deterministic code backed by classifiers such as Llama Guard 4 or Constitutional Classifiers++.[^greshake2023][^metallamaguard4][^anthropic2026classifiers]

```mastery-quiz
[
  {
    "question": "Use the four separate logical backbones taught for PPO-style RLHF, each with 3 billion parameters. Trainable state uses 16 bytes per parameter and frozen state 2. Which aggregate budget and frozen-role pairing follow, before activation or rollout storage?",
    "options": [
      "108 decimal GB; reward and critic are frozen.",
      "60 decimal GB; reference and actor are frozen.",
      "108 decimal GB; reference and reward are frozen.",
      "60 decimal GB; reference and reward are frozen."
    ],
    "answer": "108 decimal GB; reference and reward are frozen.",
    "explanation": "Actor and critic each require 3,000,000,000×16=48 GB; reference and reward each 3,000,000,000×2=6 GB. Total 48+48+6+6=108 GB. The actor and critic are trainable logical roles; this assumed aggregate state excludes activations and caches."
  },
  {
    "question": "For three generated tokens, the old policy’s log probabilities minus the reference log probabilities are [0.2, −0.1, 0.4]. Use beta 0.5 for the drift charge and add the sequence reward of 2 only at the last token. With gamma 1, lambda 0.5, four zero critic values and a true terminal step, what are the three GAE advantages?",
    "options": [
      "[0.375,0.950,1.800]",
      "[0.250,0.900,1.600]",
      "[0.500,1.000,2.000]",
      "[1.900,2.050,1.800]"
    ],
    "answer": "[0.375,0.950,1.800]",
    "explanation": "Multiply each log ratio by −0.5 and add 2 at the last token. With zero critic values, the residuals equal the immediate rewards [−0.10, 0.05, 1.80]. Work backward from 1.80. The middle advantage is 0.05 + 0.5 × 1.80 = 0.95, and the first is −0.10 + 0.5 × 0.95 = 0.375. The sequence ending in 1.60 skips the beta factor. The one ending in 2.00 skips the drift charges. The sequence starting at 1.90 treats the full score of 2 plus each token’s own drift term as its advantage."
  },
  {
    "question": "In a stored PPO batch, two sampled tokens have probability ratios of 0.6 and 1.4. Both advantages are −2, and epsilon is 0.2. What are the two clipped surrogate values, in that order, and which policy supplies the denominator of each ratio?",
    "options": [
      "−1.2 and −2.4, with the rollout policy in the denominator.",
      "−1.6 and −2.8, with the frozen SFT reference in the denominator.",
      "−1.2 and −2.4, with the frozen SFT reference in the denominator.",
      "−1.6 and −2.8, with the rollout policy in the denominator."
    ],
    "answer": "−1.6 and −2.8, with the rollout policy in the denominator.",
    "explanation": "At 0.6 the raw product is −1.2 and the clipped product is 0.8 × (−2) = −1.6. At 1.4 the raw product is −2.8 and the clipped product is 1.2 × (−2) = −2.4. PPO keeps the smaller product at each token. Taking the smaller ratio before multiplying by a negative advantage gives −1.2 and −2.4. The denominator is the probability saved when the rollout policy sampled the token. Using the frozen SFT reference would measure drift from the starting model."
  },
  {
    "question": "Chosen policy/reference summed response log scores are −4.2/−5.0; rejected scores are −6.3/−5.9. With beta 0.4, which unscaled margin, scaled logit and observed-label DPO loss follow?",
    "options": [
      "0.4,0.16,about 0.616",
      "1.2,0.48,about 0.482",
      "−1.2,−0.48,about 0.962",
      "1.2,1.20,about 0.263"
    ],
    "answer": "1.2,0.48,about 0.482",
    "explanation": "Chosen change is +.8 and rejected change −.4, so margin=.8−(−.4)=1.2. Multiplying beta gives .48; −log sigmoid(.48)=.4816748744. Reference subtraction, beta scaling and the final negative log are distinct operations."
  },
  {
    "question": "A DPO input has token IDs [2, 0, 1, 3, 0, 4, 0]. The first three tokens form the prompt, the attention mask is [1, 1, 1, 1, 1, 1, 0], and ID 4 ends the response. Which target positions count, starting from index 0? For a separate pair, the chosen log ratios sum to 1.20 over 4 targets and the rejected log ratios sum to 0.90 over 2. Both counts include the end token. The summed margin is +0.30. What chosen-minus-rejected margin do the per-token means give?",
    "options": [
      "Positions [3, 5], averaged margin −0.15.",
      "Positions [3, 5], averaged margin −0.06.",
      "Positions [3, 4, 5], averaged margin −0.06.",
      "Positions [3, 4, 5], averaged margin −0.15."
    ],
    "answer": "Positions [3, 4, 5], averaged margin −0.15.",
    "explanation": "Predictor rows 2, 3 and 4 score response targets 3, 4 and 5, including the end token. Keeping only positions 3 and 5 drops the valid zero at position 4 along with the padding at position 6. In the separate pair, the summed margin is 1.20 − 0.90 = 0.30. Averaging each response first reverses the ordering because 1.20/4 − 0.90/2 = 0.30 − 0.45 = −0.15. The value −0.06 comes from dividing by 5 and 3, which counts the end token twice in each length."
  },
  {
    "question": "A and B are the only answers to a prompt. The DPO reference gives them equal probability, and reviewers choose A 80% of the time. For beta 0.5 and then beta 1, what probability does the ideally fitted policy give A? For the same beta values, find the initial loss derivative for one recorded A-over-B vote. Differentiate with respect to the unscaled A-minus-B margin at zero.",
    "options": [
      "0.800 and 0.941; −0.25 and −0.50",
      "0.941 and 0.800; −0.15 and −0.30",
      "0.941 and 0.800; −0.25 and −0.50",
      "0.800 and 0.941; −0.15 and −0.30"
    ],
    "answer": "0.941 and 0.800; −0.25 and −0.50",
    "explanation": "The preference odds are 4 to 1. With equal reference probabilities, the fitted policy odds are 4^(1/beta), giving probabilities of 16/17 and 4/5. Reversing them would put the sharper policy at the larger beta. For one vote for A, the initial slope is beta × (0.5 − 1), giving −0.25 and −0.50. The slopes −0.15 and −0.30 come from averaging over both vote directions, which gives beta × (0.5 − 0.8)."
  },
  {
    "question": "After a DPO update, the evaluator has only the updated actor and a cache of reference sums and valid target counts. A new pair has a familiar prompt and two uncached completions. An older pair still has the same tokens and masks. Its cached log probabilities sum to −15 over 4 chosen targets and −12 over 6 rejected targets. Can the evaluator recover the original reference scores for the new pair? What are the chosen and rejected means for the older pair?",
    "options": [
      "Yes. Chosen −3.75, rejected −2.00.",
      "No. Chosen −15.00, rejected −12.00.",
      "Yes. Chosen −15.00, rejected −12.00.",
      "No. Chosen −3.75, rejected −2.00."
    ],
    "answer": "No. Chosen −3.75, rejected −2.00.",
    "explanation": "A cache entry scores a particular completion given its prompt. The familiar prompt supplies no reference score for either new completion, and the updated actor supplies only its current scores. For the older pair, divide each sum by its own valid target count. The chosen mean is −15/4 = −3.75 and the rejected mean is −12/6 = −2.00. Reporting −15 and −12 as means skips that division."
  },
  {
    "question": "Policy U gives answers A, B and C probabilities of 0.45, 0.15 and 0.40. Policy V gives them 0.15, 0.05 and 0.80. The DPO reference is uniform and beta is 1. A reviewer chose A over B in the only labeled comparison. To three decimal places, what DPO loss does each policy incur on that vote? Could an evaluator recover C’s share from that pair loss alone?",
    "options": [
      "U 0.693, V 0.693. The pair loss leaves C’s share undetermined.",
      "U 0.288, V 0.288. The pair loss leaves C’s share undetermined.",
      "U 0.693, V 0.693. The pair loss determines C’s share.",
      "U 0.288, V 0.288. The pair loss determines C’s share."
    ],
    "answer": "U 0.288, V 0.288. The pair loss leaves C’s share undetermined.",
    "explanation": "U gives A-to-B odds of 0.45/0.15 = 3, and V gives odds of 0.15/0.05 = 3. The reference assigns A and B equal probability. At beta 1, both policies give the observed vote a probability of 3/4 and a loss of −ln(3/4), about 0.288. A loss of 0.693 uses the reference’s even odds as the prediction for the vote. The A-to-B odds fix the split between those two answers, but their combined share can change. That is how C rises from 0.40 to 0.80 at the same pair loss."
  },
  {
    "question": "An IPO pair has margin 4 at tau 0.2. A KTO check increases an undesirable answer’s log ratio at a fixed reference point, with positive beta and unit weight. In a GRPO group, every answer earns 2 and a separate KL penalty is enabled. Which result gives the IPO loss derivative with respect to the margin, the change in KTO loss, and the GRPO update terms?",
    "options": [
      "IPO +3, KTO rises, GRPO reward advantages 0 with a possible KL contribution.",
      "IPO −3, KTO rises, GRPO reward advantages +2 with a possible KL contribution.",
      "IPO +3, KTO falls, GRPO reward advantages +2 with a possible KL contribution.",
      "IPO −3, KTO falls, GRPO reward advantages 0 with a possible KL contribution."
    ],
    "answer": "IPO +3, KTO rises, GRPO reward advantages 0 with a possible KL contribution.",
    "explanation": "The IPO target is 1/(2 × 0.2) = 2.5. The squared loss has derivative 2 × (4 − 2.5) = +3. The negative sign in −3 belongs to the descent direction. For an undesirable KTO label, raising the log ratio reduces the sigmoid value because its input uses the reference point minus the log ratio. Subtracting that smaller value from 1 raises the loss. A falling loss would fit a desirable label. Each GRPO reward equals the group mean of 2, so each centered advantage is zero. Using +2 skips centering. The separate KL penalty can still contribute."
  },
  {
    "question": "An evaluator provides 95% win-probability intervals for two predeclared candidates under one planned evaluation design. Candidate A has [0.54,0.63] and mean length growth 23 tokens; B has [0.49,0.58] and growth 12. Promotion requires lower bound > 0.50 and length growth < 20. Which candidates qualify?",
    "options": [
      "A: win PASS, length PASS; B: win FAIL, length PASS. Eligible: A.",
      "A: win PASS, length FAIL; B: win PASS, length PASS. Eligible: B.",
      "A: win PASS, length FAIL; B: win FAIL, length PASS. Eligible: neither.",
      "A: win PASS, length PASS; B: win PASS, length PASS. Eligible: both."
    ],
    "answer": "A: win PASS, length FAIL; B: win FAIL, length PASS. Eligible: neither.",
    "explanation": "A clears the win lower bound because .54 > .50, but 23 is not below 20. B meets the length cap with 12, but its lower bound .49 does not exceed .50. Each candidate fails one required check, so neither qualifies."
  }
]
```

> **Next:** Continue to [RLVR & Verifiable Rewards](/learn/rlvr-verifiable-rewards-training).
