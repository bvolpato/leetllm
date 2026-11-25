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
<!-- leetllm: edition:reference:start -->

Your new fine-tuned candidate raises its internal reward-model score by `+0.31`, yet it wins only 184 of 400 blinded human comparisons against the previous model. Its replies are also 48 tokens longer on average, and dozens now open with `"Verified answer:"`. Would you ship it?

That mismatch between a climbing reward score and stagnant human preference is the heart of alignment engineering. In the previous lesson, our <span data-glossary="reward-model">reward model</span> scored two answers to *"How do you prevent exponential overflow when implementing `softmax(z)` in Python?"*: subtracting `max(z)` before `exp(z)` earned `1.80`, while casting to `float64` *after* `exp(z)` earned `0.70`. Through the <span data-glossary="bradley-terry-model">Bradley-Terry preference model</span>, that `1.10` margin corresponds to a 75% chance that a reviewer prefers the real fix.

Now comes the training question: should you optimize your language model online against that learned reward model with reinforcement learning (<span data-glossary="rlhf">RLHF</span>), or eliminate the separate reward model and optimize the model directly on preference pairs (<span data-glossary="dpo">DPO</span>)?

## What preference pairs add to SFT

After <span data-glossary="supervised-fine-tuning">supervised fine-tuning (SFT)</span>, a model follows instructions fluently yet can still emit subtle numerical bugs, ramble, or over-refuse benign questions. As InstructGPT highlighted, <span data-glossary="pretraining">pretraining</span> and next-<span data-glossary="token">token</span> imitation reward plausible text, not necessarily the most helpful, accurate, or safe choice.[^ouyang2022]

Consider two fluent completions to our `softmax(z)` question:
- **Response A:** "Subtract `max(z)` from every logit before calling `exp(z)` so the largest exponent is zero."
- **Response B:** "Cast the output array to `float64` after calling `exp(z)` so large values fit safely."

Response A actually prevents overflow; Response B overflows inside `exp(z)` before the cast ever runs. Pairwise preference training gives the optimizer an explicit contrast under the exact same prompt, pushing A *up* relative to B, and collecting human preferences between two outputs is often far easier than writing gold-standard responses from scratch.[^ouyang2022]

<figure>
  <img src="illustrations/_generated/alignment_gap_dark.png" alt="The softmax overflow prompt branches into two short replies: subtract max(z) before exp(z), or cast logits to float64 after exp(z). A scalar reward scorer assigns 1.80 and 0.70, a 1.10 gap that maps through Bradley-Terry to about 75 percent for subtracting max(z) first." />
  <figcaption>A 1.10 reward margin maps through Bradley-Terry to a ~75% preference probability for subtracting `max(z)` before `exp(z)`.</figcaption>
</figure>

## RLHF: a judge, then an actor

The classic RLHF pipeline popularized by summarization and InstructGPT runs in three stages:[^stiennon2020][^ouyang2022]
1. **SFT:** Imitate high-quality demonstrations to establish instruction-following.
2. **Reward modeling:** Fit a scalar scorer $r_\phi(x, y)$ to human pairwise preferences via the Bradley-Terry loss:
   $$
   P(y_w \succ y_l \mid x) = \sigma\!\left(r(x, y_w) - r(x, y_l)\right), \qquad \mathcal{L}_{\text{RM}} = -\mathbb{E}_{(x, y_w, y_l)} \left[\log \sigma\!\left(r(x, y_w) - r(x, y_l)\right)\right]
   $$
   For our `softmax(z)` pair, $r(A) - r(B) = 1.8 - 0.7 = 1.1$, giving $P(A \succ B) = \sigma(1.1) \approx 75.0\%$ and negative log-likelihood $-\ln(0.750) \approx 0.287$ (flipping the scores jumps the loss to `1.387`).
3. **Online RL (<span data-glossary="ppo">PPO</span>):** Sample fresh responses from the current policy $\pi_\theta$, score them with the frozen reward model, and update $\pi_\theta$ while penalizing <span data-glossary="kl-divergence">KL divergence</span> from the frozen SFT reference $\pi_{\text{ref}}$ so the model cannot chase reward-model quirks into gibberish.[^ouyang2022][^schulman2017]

```checkpoint
Why does a larger reward gap make the Bradley-Terry preference probability closer to 1?
---
The sigmoid receives a larger positive input, pushing $\sigma(r_w - r_l)$ toward 1. A wider score gap expresses stronger confidence that the higher-scored answer wins.
```

### PPO and the cost of leaving the reference

The RLHF objective balances expected reward against a KL penalty weighted by $\beta > 0$:

$$
\max_\theta \; \mathbb{E}_{x \sim \mathcal{D},\, y \sim \pi_\theta(\cdot \mid x)} \left[ r(x, y) \right] - \beta \, \mathbb{E}_{x \sim \mathcal{D}} \left[ \mathbb{D}_{\text{KL}}\!\left(\pi_\theta(\cdot \mid x) \parallel \pi_{\text{ref}}(\cdot \mid x)\right) \right]
$$

Here $\mathbb{D}_{\text{KL}}(\pi_\theta \parallel \pi_{\text{ref}}) = \mathbb{E}_{y \sim \pi_\theta}[\log \pi_\theta(y \mid x) - \log \pi_{\text{ref}}(y \mid x)]$. Any individual sampled log-ratio can be negative, while the expectation over $\pi_\theta$ is always non-negative (zero iff $\pi_\theta = \pi_{\text{ref}}$).

Remarkably, for any fixed reward $r(x, y)$ and prompt $x$, this objective has an exact closed-form optimal distribution:

$$
\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x) \exp\!\left( \frac{r(x, y)}{\beta} \right), \qquad Z(x) = \sum_y \pi_{\text{ref}}(y \mid x) \exp\!\left(\frac{r(x, y)}{\beta}\right)
$$

<details>
<summary>Deep dive: Deriving the closed-form optimal policy $\pi^*$</summary>

For a fixed prompt $x$, factor $-\beta$ out of the objective:

$$
\mathcal{J}(\pi) = -\beta \sum_y \pi(y \mid x) \log \frac{\pi(y \mid x)}{\pi_{\text{ref}}(y \mid x)\exp(r(x,y)/\beta)}
$$

Multiply and divide inside the logarithm by the normalizer $Z(x) = \sum_y \pi_{\text{ref}}(y \mid x)\exp(r(x,y)/\beta)$:

$$
\mathcal{J}(\pi) = -\beta \, \mathbb{D}_{\text{KL}}\!\left(\pi(\cdot \mid x) \parallel \pi^*(\cdot \mid x)\right) + \beta \log Z(x)
$$

Because $Z(x)$ does not depend on $\pi$ and KL divergence is minimized uniquely at zero when $\pi = \pi^*$, the exponentially tilted reference distribution $\pi^*$ is the exact optimum. Computing $Z(x)$ sums over all possible text sequences, which is intractable, so PPO optimizes the objective approximately via rollouts while DPO cancels $Z(x)$ algebraically.[^rafailov2023]

</details>

### Token-level reward shaping and the four model roles

Standard PPO-based RLHF coordinates **four logical roles**:
1. **Actor / policy ($\pi_\theta$):** Trainable language model generating responses.
2. **Reference ($\pi_{\text{ref}}$):** Frozen SFT checkpoint anchoring the KL penalty.
3. **Reward model ($r_\phi$):** Frozen scorer evaluating completed responses.
4. **Critic / value ($V_\psi$):** Trainable prefix value estimator used to compute advantages.

These are logical roles, not four mandatory full-size GPU copies: the critic can be smaller or share weights, frozen models can be offloaded, and InstructGPT paired a 175B actor with a 6B reward model.[^ouyang2022][^schulman2017]

Because $r_\phi(x, y)$ arrives only at the final token $T$, we place the per-token KL charge on every generated token and add $r_\phi(x, y)$ once at step $T$:

$$
R_t = \begin{cases}
-\beta \left( \log \pi_{\mathrm{old}}(y_t \mid x, y_{<t}) - \log \pi_{\text{ref}}(y_t \mid x, y_{<t}) \right), & 1 \le t < T \\
r_\phi(x, y) - \beta \left( \log \pi_{\mathrm{old}}(y_T \mid x, y_{<T}) - \log \pi_{\text{ref}}(y_T \mid x, y_{<T}) \right), & t = T
\end{cases}
$$

Summing $R_t$ from $1$ to $T$ recovers $r_\phi(x, y) - \beta \log \frac{\pi_{\mathrm{old}}(y \mid x)}{\pi_{\text{ref}}(y \mid x)}$ cleanly via the autoregressive chain rule. **Generalized Advantage Estimation (GAE)** then propagates that terminal reward backward to every earlier token using TD residuals $\delta_t = R_t + \gamma V(s_{t+1}) - V(s_t)$ and $\hat{A}_t = \delta_t + \gamma\lambda \hat{A}_{t+1}$ (with $V(s_{T+1}) = 0$ at true episode termination).[^schulman2015gae]

Watch how a terminal reward of `1.0` at token 3 reaches tokens 1 and 2 under $\lambda = 1.0$ vs $\lambda = 0.5$, and how a KL penalty of $\beta = 0.2$ flips a noisy preamble hack (`raw=1.35`, `log_ratio=1.6`) below a cleaner near-reference answer (`raw=1.20`, `log_ratio=0.1`):

<!-- leetllm: test, output=show, output_title="GAE credit and KL-shaped reward" -->
```python title="terminal_credit_and_kl_shaping.py"
def gae(rewards: list[float], values: list[float], lam: float, gamma: float = 1.0) -> list[float]:
    advantages = [0.0] * len(rewards)
    running = 0.0
    for t in reversed(range(len(rewards))):
        delta = rewards[t] + gamma * values[t + 1] - values[t]
        running = delta + gamma * lam * running
        advantages[t] = running
    return advantages

rewards = [0.0, 0.0, 1.0]
values = [0.0, 0.0, 0.0, 0.0]
for lam in (1.0, 0.5):
    print(f"GAE lambda={lam:.1f} -> advantages={gae(rewards, values, lam)}")

beta = 0.20
samples = [
    ("near_reference", 1.20, -2.1, -2.2),
    ("preamble_hack",  1.35, -1.2, -2.8),
]
for name, reward, pi_logp, ref_logp in samples:
    shaped = reward - beta * (pi_logp - ref_logp)
    print(f"{name:15s}: raw={reward:.2f}, log_ratio={pi_logp - ref_logp:+.1f}, shaped={shaped:.2f}")
```

<!-- leetllm: output:start -->
```text title="GAE credit and KL-shaped reward" output compact
GAE lambda=1.0 -> advantages=[1.0, 1.0, 1.0]
GAE lambda=0.5 -> advantages=[0.25, 0.5, 1.0]
near_reference : raw=1.20, log_ratio=+0.1, shaped=1.18
preamble_hack  : raw=1.35, log_ratio=+1.6, shaped=1.03
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/terminal_credit_assignment_dark.png" alt="Three token transitions have rewards 0, 0, and 1. The critic predicts zero at all four states, including terminal V3, so the TD residuals are 0, 0, and 1. Backward GAE accumulation gives advantages [1, 1, 1] at lambda 1 and [0.25, 0.5, 1] at lambda 0.5; arrows point from the terminal decision toward earlier tokens." />
  <figcaption>Backward GAE carries the terminal reward to earlier tokens; smaller $\lambda$ decays credit further back from the end.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/ppo_four_model_loop_dark.png" alt="One sampled response produces reward 1.35 and a sampled reference charge of 0.32, giving return 1.03. The critic value 0.80 is subtracted to produce advantage 0.23. With policy ratio 1.20, the clipped surrogate is 0.276. Reward and reference are frozen roles; critic and actor are trainable roles." />
  <figcaption>Tracing one step through all four logical roles: raw reward minus KL penalty gives return `1.03`, minus critic baseline `0.80` gives advantage `0.23`, times ratio `1.20` gives surrogate `0.276`.</figcaption>
</figure>

### What PPO actually clips

During multi-epoch updates over a collected rollout batch, PPO compares the updated actor $\pi_\theta$ against the rollout snapshot $\pi_{\mathrm{old}}$ (not the SFT reference) using probability ratio $\rho_t(\theta) = \pi_\theta(a_t \mid s_t) / \pi_{\mathrm{old}}(a_t \mid s_t)$:

$$
L_t = \min\!\left(\rho_t \hat{A}_t,\; \operatorname{clip}(\rho_t, 1 - \epsilon, 1 + \epsilon)\hat{A}_t\right)
$$

Clipping is intentionally asymmetric:
- When $\hat{A}_t > 0$ ($\epsilon = 0.2$), pushing $\rho_t$ above `1.2` gives no extra reward, while moving in the wrong direction ($\rho_t < 1$) stays fully penalized.
- When $\hat{A}_t < 0$, pushing $\rho_t$ below `0.8` gives no extra reward, while moving upward ($\rho_t > 1$) stays fully penalized.

<!-- leetllm: test, output=show, output_title="PPO clipped surrogate" -->
```python title="ppo_clipped_surrogate.py"
def surrogate(ratio: float, advantage: float, epsilon: float = 0.2) -> float:
    clipped = min(max(ratio, 1 - epsilon), 1 + epsilon)
    return min(ratio * advantage, clipped * advantage)

for advantage in (1.0, -1.0):
    values = [round(surrogate(r, advantage), 2) for r in (0.5, 1.0, 1.5)]
    print(f"A={advantage:+.0f} at ratios [0.5, 1.0, 1.5] -> {values}")
```

<!-- leetllm: output:start -->
```text title="PPO clipped surrogate" output compact
A=+1 at ratios [0.5, 1.0, 1.5] -> [0.5, 1.0, 1.2]
A=-1 at ratios [0.5, 1.0, 1.5] -> [-0.8, -1.0, -1.5]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/ppo_clipped_surrogate_dark.png" alt="Two PPO clipped-surrogate curves share a labeled probability-ratio axis from 0.5 to 1.5 and a signed objective axis. With epsilon 0.2, positive advantage flattens above 1.2 and negative advantage flattens below 0.8." />
  <figcaption>Solid curves show the clipped PPO objective; dashed lines show the unclipped surrogate. Clipping flattens the incentive to overshoot while keeping harmful moves penalized.</figcaption>
</figure>

> **Key insight:** PPO clipping removes the *gradient incentive* past $1 \pm \epsilon$ on a given batch; it is not a hard clamp on token probabilities or KL divergence.

### The systems cost of online RL

If all four PPO roles used independent 70B backbones (16 bytes per trainable parameter for BF16 weights/gradients + FP32 Adam moments/master copy; 2 bytes per frozen BF16 parameter), model state alone reaches **2,520 GB** (`1,120 GB` each for actor and critic, `140 GB` each for reference and reward) before activations or KV caches. Removing the critic alone drops that total by **44.4%** to `1,400 GB`.

On top of memory, online RL must run autoregressive decoding (rollouts) every iteration. Frameworks like OpenRLHF support both colocated hybrid engines (alternating generation and training on the same GPUs) and asynchronous engines (overlapping generation and training at the cost of weight synchronization and mild policy lag).[^openrlhf2026framework]

## DPO: turn reward fitting into policy fitting

If you already have labeled `(prompt, chosen, rejected)` pairs, why train a separate reward model and run an online RL loop at all? **Direct Preference Optimization (DPO)** eliminates both by reparameterizing the reward directly in terms of the policy.[^rafailov2023]

### Why an offline loss can stand in for RL

Take the logarithm of the closed-form optimal policy $\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x)\exp(r(x,y)/\beta)$ and solve for $r(x, y)$:

$$
r(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)
$$

Now plug that into the Bradley-Terry preference probability $P(y_w \succ y_l \mid x) = \sigma(r(x, y_w) - r(x, y_l))$. Because $Z(x)$ depends only on the prompt $x$, **it cancels completely**:

$$
r(x, y_w) - r(x, y_l) = \beta \log \frac{\pi^*(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi^*(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}
$$

Replacing $\pi^*$ with our trainable policy $\pi_\theta$ defines the **implicit reward** $\hat{r}_\theta(x, y) = \beta \log \frac{\pi_\theta(y \mid x)}{\pi_{\text{ref}}(y \mid x)}$ and yields the DPO loss directly on preference pairs:[^rafailov2023]

$$
\mathcal{L}_{\text{DPO}}(\theta) = -\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}} \left[ \log \sigma\!\left( \beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} \right) \right]
$$

Under ideal infinite-data Bradley-Terry assumptions, RLHF and DPO share the same optimal policy.[^rafailov2023][^azar2023] In practice, finite data coverage, optimization, and online exploration still cause them to diverge.

```checkpoint
Why does the reference policy appear in DPO?
---
Its log-probability ratio defines each completion's implicit reward relative to the SFT baseline, anchoring the chosen-minus-rejected margin without needing a separate reward model.
```

### Gradient dynamics and the dual role of $\beta$

Differentiating $\mathcal{L}_{\text{DPO}}$ reveals an elegant push-pull update:

$$
\nabla_\theta \mathcal{L}_{\text{DPO}}(\theta) = -\beta \, \mathbb{E}_{(x, y_w, y_l)} \left[ \underbrace{\sigma\!\left(\hat{r}_\theta(x, y_l) - \hat{r}_\theta(x, y_w)\right)}_{\text{Hard-pair weight}} \cdot \underbrace{\left( \nabla_\theta \log \pi_\theta(y_w \mid x) - \nabla_\theta \log \pi_\theta(y_l \mid x) \right)}_{\text{Push chosen up, pull rejected down}} \right]
$$

Pairs the model currently ranks *wrongly* ($\hat{r}_l > \hat{r}_w$) get weight above `0.5` (approaching `1.0`), while already well-separated pairs get downweighted toward zero.

Notice how $\beta$ acts in two ways: for a fixed preference distribution (say reviewers pick A 75% of the time over a uniform reference), a **larger** $\beta$ keeps the optimal policy $\pi^*(A) = \sigma(\log 3 / \beta)$ closer to the reference (`99.998%` at $\beta=0.1$, `90.0%` at $\beta=0.5$, `75.0%` at $\beta=1.0$), yet it also scales the initial margin gradient $\partial L / \partial m = -\beta / 2$ at initialization.

### Computing DPO from token logits

On our `softmax(z)` pair, suppose summed response log-probabilities are chosen `(-8.2 policy, -8.5 ref)` and rejected `(-9.5 policy, -9.1 ref)` with $\beta = 0.1$. The chosen log-ratio is `+0.3`, the rejected log-ratio is `-0.4`, the margin is `0.3 - (-0.4) = +0.7`, the scaled logit is `0.07`, and the DPO loss is $-\ln \sigma(0.07) \approx 0.659$.

In real sequence batches, compute $\log \pi(y \mid x) = \sum_t \log \pi(y_t \mid x, y_{<t})$ across **response tokens plus EOS only**, shifting logits by one position and masking prompt and padding positions by index (never by token ID alone, since `0` can be both padding and valid content):

<!-- leetllm: test, deps=torch, output=show, output_title="DPO token logprob loss in PyTorch" -->
```python title="dpo_loss_from_token_logits.py"
import torch
import torch.nn.functional as F

# Prompt = [0, 2]; chosen response = [1, 2, 4(EOS), 0(PAD)]; rejected = [3, 0, 4(EOS), 0(PAD)]
chosen_ids = torch.tensor([0, 2, 1, 2, 4, 0])
rejected_ids = torch.tensor([0, 2, 3, 0, 4, 0])
attn_mask = torch.tensor([1, 1, 1, 1, 1, 0], dtype=torch.bool)
prompt_len, beta = 2, 0.1

def response_logprob(logits: torch.Tensor, ids: torch.Tensor) -> torch.Tensor:
    logp = F.log_softmax(logits[:-1], dim=-1)
    token_logp = logp.gather(-1, ids[1:].unsqueeze(-1)).squeeze(-1)
    resp_mask = attn_mask[1:].clone()
    resp_mask[: prompt_len - 1] = False
    return (token_logp * resp_mask).sum()

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

c_logp = response_logprob(chosen_pi, chosen_ids)
r_logp = response_logprob(rejected_pi, rejected_ids)
margin = (c_logp - response_logprob(chosen_ref, chosen_ids)) - (r_logp - response_logprob(rejected_ref, rejected_ids))
loss = -F.logsigmoid(beta * margin)
loss.backward()

print(f"chosen_logp={c_logp.item():.3f}, rejected_logp={r_logp.item():.3f}")
print(f"margin={margin.item():.3f}, dpo_loss={loss.item():.3f}")
print("prompt & pad logit rows get zero grad:", chosen_pi.grad[0].abs().sum().item() == 0.0 and chosen_pi.grad[4].abs().sum().item() == 0.0)
```

<!-- leetllm: output:start -->
```text title="DPO token logprob loss in PyTorch" output compact
chosen_logp=-0.993, rejected_logp=-1.882
margin=0.640, dpo_loss=0.662
prompt & pad logit rows get zero grad: True
```
<!-- leetllm: output:end -->

> **Common mistake:** Treating per-token *average* log-probability as interchangeable with summed sequence log-probability. Suppose a 4-token chosen answer has summed log-ratio `+0.40` (average `+0.10`) and a 2-token rejected answer has summed log-ratio `+0.30` (average `+0.15`). Standard DPO sees a positive margin (`+0.10`), while per-token averaging flips the sign to `-0.05` and reverses the preference![^rafailov2023][^huggingface2026dpoSource]

### Likelihood displacement: when margins rise while chosen probability falls

Because DPO optimizes the *difference* between chosen and rejected log-ratios, the margin can climb smoothly even while **both** responses lose probability mass, simply because the rejected response drops faster than the chosen one.

For our softmax pair (`ref_w=-8.5`, `ref_l=-9.1`), moving from `(-8.2, -9.5)` to `(-9.1, -11.2)` raises the DPO margin from `+0.7` to `+1.5` even though the chosen response falls *below* its SFT reference likelihood (`+0.3 -> -0.6`). Razin et al. analyzed this **likelihood displacement** and showed that the displaced probability mass can flow into acceptable paraphrases or into undesirable responses; Pal et al. introduced **DPOP** to penalize chosen likelihood falling below the reference.[^dpoLikelihoodDisplacement2024][^pal2024smaug]

<figure>
  <img src="illustrations/_generated/likelihood_displacement_dark.png" alt="Four policy states share one log-probability-ratio axis. The chosen response moves from 0 to 0.30, −0.15, and −0.60; the rejected response moves from 0 to −0.40, −1.20, and −2.10. Their pairwise margin grows from 0 to 0.70, 1.05, and 1.50 even as the chosen response falls below its reference likelihood." />
  <figcaption>The pairwise margin climbs from 0 to 1.50 even as the chosen response drops below its SFT reference likelihood.</figcaption>
</figure>

Always monitor four signals together during DPO: $\log \pi_\theta(y_w \mid x)$, $\log \pi_\theta(y_l \mid x)$, margin $m$, and on-policy KL / held-out generations. If chosen log-probability collapses while margins grow, inspect $\beta$, length bias (or test length-normalized SimPO),[^meng2024] and data quality.

### Configuring DPO in TRL

Because the reference model is frozen, trainers like TRL's `DPOTrainer` let you precompute reference log-probabilities (`precompute_ref_log_probs=True`) so only one model sits in GPU memory during training.[^trlDpoTrainer2026][^trl2026DpoTrainerV117] Pass every evaluation split at initialization when precomputing (otherwise evaluating an uncached split later fails because the reference weights were freed),[^huggingface2026dpoSource] and verify that `max_length` truncation does not slice off the portion where chosen and rejected actually differ.[^trl2026DpoConfigV117]

```python title="trl_dpo_setup_fragment.py"
from transformers import AutoTokenizer
from trl import DPOConfig, DPOTrainer

tokenizer = AutoTokenizer.from_pretrained(sft_checkpoint)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

trainer = DPOTrainer(
    model=sft_checkpoint,
    processing_class=tokenizer,
    args=DPOConfig(
        output_dir="runs/softmax-dpo",
        beta=0.1,
        precompute_ref_log_probs=True,
        max_length=2048,
        per_device_train_batch_size=1,
        learning_rate=5e-6,
        max_steps=200,
    ),
    train_dataset=train_pairs,
    eval_dataset=eval_pairs,
)
trainer.train()
trainer.save_model("artifacts/softmax-dpo")
tokenizer.save_pretrained("artifacts/softmax-dpo")
```

## Comparing RLHF and DPO

The real tradeoff between RLHF and DPO is **online exploration versus engineering simplicity**:[^ouyang2022][^rafailov2023]

<figure>
  <img src="illustrations/_generated/rlhf_vs_dpo_dark.png" alt="PPO draws a fresh response from the current actor, scores it with reward, reference, and critic roles, then updates the actor for a later rollout. Vanilla DPO keeps one stored chosen/rejected pair, scores the same responses under the updated policy and a frozen reference cache, computes pairwise loss, and updates the policy to rescore that stored pair." />
  <figcaption>PPO evaluates fresh completions from the current policy every step; vanilla DPO repeatedly optimizes against the same fixed pair dataset.</figcaption>
</figure>

| Dimension | RLHF (PPO) | Vanilla DPO |
|---|---|---|
| **Reward model** | Separate trained scorer $r_\phi$ | None (implicit in $\beta \log(\pi_\theta/\pi_{\text{ref}})$) |
| **Loop** | On-policy RL with live rollouts | Offline pairwise classification loss |
| **Logical roles** | Actor, reference, reward, critic | Policy, reference (can precompute) |
| **Online exploration** | Yes: sees new failures it invents | No, unless you iteratively refresh pairs |
| **Primary risks** | Reward hacking, critic noise, rollout cost | Stale pairs, unseen-response mass, displacement |

### DPO's blind spot: the answer nobody compared

Suppose a coding model has three possible answers to our `softmax(z)` prompt: **A** (correct `max(z)` shift), **B** (buggy post-`exp` cast), and an unseen **C** (buggy `clip(-100, 100)` without shifting). If your preference dataset only ever compares A against B, two wildly different policies with identical 4:1 A-to-B odds get the **exact same DPO loss**, even when C absorbs 90% of all probability mass:

<!-- leetllm: test, output=show, output_title="Unseen response coverage" -->
```python title="dpo_unseen_response_mass.py"
from math import exp, log, log1p

reference = {"A": 1 / 3, "B": 1 / 3, "C": 1 / 3}
for name, policy in [
    ("Policy 1", {"A": 0.40, "B": 0.10, "C": 0.50}),
    ("Policy 2", {"A": 0.08, "B": 0.02, "C": 0.90}),
]:
    margin = log(policy["A"] / reference["A"]) - log(policy["B"] / reference["B"])
    loss = log1p(exp(-0.1 * margin))
    print(f"{name}: A/B odds={policy['A'] / policy['B']:.1f}, DPO loss={loss:.4f}, unseen C mass={policy['C']:.0%}")
```

<!-- leetllm: output:start -->
```text title="Unseen response coverage" output compact
Policy 1: A/B odds=4.0, DPO loss=0.6262, unseen C mass=50%
Policy 2: A/B odds=4.0, DPO loss=0.6262, unseen C mass=90%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/unseen_response_mass_dark.png" alt="A probability simplex contains a uniform reference and two policies. Policy 1 assigns probabilities 0.40, 0.10, and 0.50 to A, B, and unseen C; policy 2 assigns 0.08, 0.02, and 0.90. Both keep A-to-B odds at 4 to 1, so the DPO pair loss remains 0.62623 at beta 0.1 while C mass rises from 50 to 90 percent." />
  <figcaption>Along the dashed constant-odds line, DPO loss stays frozen at `0.62623` while unseen bug C climbs from 50% to 90% of probability mass.</figcaption>
</figure>

**Iterative / Online DPO** closes that gap without a critic: sample fresh candidate pairs from the current policy, label them with humans or a strong verifier/judge, append the new pairs, and update again.[^calandriello2024]

## When the proxy lies

Returning to our opening candidate (`+0.31` reward, `+48` tokens, `"Verified answer:"` prefix, `184/400` human wins): this is classic **reward hacking** territory. Test the hypothesis with controlled rewrites: does prepending `"Verified answer:"` boost the reward model score without fixing the overflow bug?

| Failure mode | Symptom | How to catch it |
|---|---|---|
| **Length gaming** | Responses grow longer while quality plateaus | Track mean length; run length-matched evals |
| **Sycophancy** | Model agrees with false user premises | Probe with deliberate user mistakes |
| **Format exploitation** | Everything turns into bullet lists or canned preambles | Score plain vs formatted rewrites |
| **The `0.693` plateau** | DPO starts at $\ln 2 \approx 0.693$ (normal at step 0, where $\partial L / \partial m = -\beta / 2$ is nonzero!), then never drops | Verify weights actually update, then check contradictory labels or prompt leakage |

### Evaluating against held-out human comparisons

Never ship on internal reward score alone. Evaluate on blinded, randomized held-out human comparisons with predeclared criteria, and account for sampling uncertainty with a 95% Wilson confidence interval.[^nistBinomialIntervals2026] For `184/400` wins (`46.0%`), the 95% Wilson interval is `[41.2%, 50.9%]`, crossing 50%, while mean length jumped `+48` tokens past a 20-token budget:

<!-- leetllm: test, output=show, output_title="Held-out human evaluation check" -->
```python title="alignment_human_eval_check.py"
from math import sqrt

def wilson_interval(wins: int, total: int, z: float = 1.96) -> tuple[float, float]:
    p = wins / total
    denom = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denom
    radius = z * sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denom
    return center - radius, center + radius

wins, total = 184, 400
lower, upper = wilson_interval(wins, total)
length_delta = 48

print(f"win rate:            {wins / total:.1%} (95% Wilson CI: [{lower:.1%}, {upper:.1%}])")
print(f"beats 50% lower CI:  {lower > 0.50}")
print(f"within +20 tok cap:  {length_delta < 20}")
```

<!-- leetllm: output:start -->
```text title="Held-out human evaluation check" output compact
win rate:            46.0% (95% Wilson CI: [41.2%, 50.9%])
beats 50% lower CI:  False
within +20 tok cap:  False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/alignment_failure_guardrails_dark.png" alt="A release example records 184 wins in 400 blinded comparisons, a 46.0 percent rate with a 95 percent Wilson interval from 41.2 to 50.9 percent that crosses the 50 percent baseline. Proxy reward rises by 0.31, while mean response length grows 48 tokens against a 20-token limit." />
  <figcaption>The 95% Wilson interval crosses 50% and response length jumps 48 tokens, overriding the `+0.31` proxy reward gain.</figcaption>
</figure>

## Compare related methods by training signal and system cost

Choose the method that matches the supervision signal you actually have:

| Method | Signal & mechanism | Key tradeoff |
|---|---|---|
| **IPO**[^azar2023] | Pairs; squared loss $\mathbb{E}[(m - \frac{1}{2\tau})^2]$ targets a finite margin $1/(2\tau)$ | Discourages runaway margins on deterministic pairs |
| **KTO**[^ethayarajh2024] | Unpaired thumbs-up / thumbs-down labels with opposite sigmoid directions around $z_0$ | No pairs required; sensitive to click/selection bias |
| **ORPO**[^hong2024] | Combines SFT cross-entropy + odds-ratio penalty in one stage, no reference model | Cuts reference memory; couples SFT and preference updates |
| **SimPO**[^meng2024] | Length-normalized average token log-prob with target margin, no reference model | Reduces length bias; check concision vs completeness |
| **GRPO**[^shao2024][^deepseekai2025] | Online RL without a critic: normalizes rewards across $G$ sampled completions per prompt | Drops critic memory & value error; flat reward groups give zero advantage |

### GRPO: group-relative advantage without a critic

Introduced in DeepSeekMath and scaled in DeepSeek-R1, **Group Relative Policy Optimization (GRPO)** removes PPO's learned critic by sampling a group of $G$ completions $\{y_1, \dots, y_G\}$ for each prompt $x$, scoring each with a verifier or reward model, and standardizing scores within the group:[^shao2024][^deepseekai2025]

$$
\hat{A}_i = \frac{r_i - \operatorname{mean}(r_1, \dots, r_G)}{\operatorname{std}(r_1, \dots, r_G) + \epsilon}
$$

Each token in completion $i$ receives advantage $\hat{A}_i$ inside a clipped token-ratio surrogate with a non-negative KL term $k_{i,t} = \exp(\ell_{i,t}) - \ell_{i,t} - 1$ ($\ell_{i,t} = \log(\pi_{\text{ref}} / \pi_\theta)$) added directly to the loss:[^shao2024]

$$
\mathcal{L}_{\text{GRPO}} = -\frac{1}{G}\sum_{i=1}^G \frac{1}{T_i}\sum_{t=1}^{T_i} \left[\min\!\left(\rho_{i,t}\hat{A}_i,\; \operatorname{clip}(\rho_{i,t}, 1-\epsilon, 1+\epsilon)\hat{A}_i\right) - \beta k_{i,t}\right]
$$

Watch GRPO's signature edge case: when every completion in a group receives the exact same reward (all pass or all fail), the group standard deviation is zero and every reward-driven advantage collapses to `0.0` (which trainers like TRL track via `frac_reward_zero_std`, noting that TRL's `GRPOTrainer` also defaults to `beta=0.0` unless you enable KL regularization):[^huggingface2026grpotrainer][^huggingface2026grpoSource]

<!-- leetllm: test, output=show, output_title="GRPO group advantages and IPO/KTO signals" -->
```python title="grpo_ipo_kto_signals.py"
from math import exp
from statistics import mean, pstdev

def group_advantages(rewards: list[float]) -> list[float]:
    mu, sigma = mean(rewards), pstdev(rewards)
    return [0.0] * len(rewards) if sigma == 0 else [round((r - mu) / sigma, 3) for r in rewards]

print("GRPO mixed group:    ", group_advantages([1.0, 0.0, 0.5, 1.0]))
print("GRPO flat group:     ", group_advantages([1.0, 1.0, 1.0, 1.0]))

# IPO penalizes overshooting target margin 1 / (2 * tau) = 5.0 at tau = 0.1
tau = 0.1
target = 1 / (2 * tau)
print("IPO loss at m=[0,5,10]:", [round((m - target) ** 2, 1) for m in (0.0, 5.0, 10.0)])

# KTO moves in opposite directions for desirable vs undesirable unpaired labels
def kto_loss(log_ratio: float, desirable: bool, beta: float = 0.5, z0: float = 0.2) -> float:
    sign = 1 if desirable else -1
    return 1 - 1 / (1 + exp(-sign * beta * (log_ratio - z0)))

print(f"KTO desirable   (log_ratio 1->2): {kto_loss(1.0, True):.3f} -> {kto_loss(2.0, True):.3f}")
print(f"KTO undesirable (log_ratio 1->2): {kto_loss(1.0, False):.3f} -> {kto_loss(2.0, False):.3f}")
```

<!-- leetllm: output:start -->
```text title="GRPO group advantages and IPO/KTO signals" output compact
GRPO mixed group:     [0.905, -1.508, -0.302, 0.905]
GRPO flat group:      [0.0, 0.0, 0.0, 0.0]
IPO loss at m=[0,5,10]: [25.0, 0.0, 25.0]
KTO desirable   (log_ratio 1->2): 0.401 -> 0.289
KTO undesirable (log_ratio 1->2): 0.599 -> 0.711
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/grpo_group_advantages_dark.png" alt="Four completion rewards [1, 0, 0.5, 1] have population mean 0.625 and standard deviation about 0.4146. Subtracting the mean and dividing by the standard deviation yields advantages about [0.90, −1.51, −0.30, 0.90]. A flat group [1, 1, 1, 1] has zero standard deviation and assigns all four advantages zero." />
  <figcaption>GRPO centers and scales rewards within each prompt group. Identical rewards produce zero reward-driven advantages while any separate KL penalty stays active.</figcaption>
</figure>

## Constitutional AI, RLAIF, and automated red teaming

Collecting human comparisons for every safety and edge-case failure does not scale. **Constitutional AI (CAI)** encodes explicit behavioral principles in a written constitution and replaces human harmlessness labeling with a two-phase self-improvement loop:[^bai2022][^anthropic2026constitution]

1. **Phase 1: Supervised critique-revision (SL-CAI).** Prompt the base or SFT model with red-team queries to elicit an initial draft $y_0$, ask the model to critique $y_0$ against a specific principle and revise it into $y^*$, then run SFT on the clean revisions $(x, y^*)$ without training on the harmful draft:
   $$
   \mathcal{L}_{\mathrm{SFT}}(\theta) = -\mathbb{E}_{(x, y^*) \sim \mathcal{D}_{\mathrm{SL}}} \sum_{t=1}^{T} \log \pi_\theta(y_t^* \mid x, y_{<t}^*)
   $$
2. **Phase 2: RL from AI Feedback (RLAIF).** Sample response pairs from $\pi_{\mathrm{SL}}$, ask an AI judge to compare them under the constitution, and extract soft preference probabilities $q \in (0, 1)$ from the judge's A/B choice log-probabilities. Swap A/B order on every pair and average by response identity to detect and cancel **position bias**. Train a harmlessness reward model with soft cross-entropy gradient $\frac{d\mathcal{L}}{dd} = \sigma(d) - q$ (which faithfully fits whatever $q$ the judge outputs, so judge miscalibration flows straight into the reward model), then run RL combining AI harmlessness scores with human helpfulness labels.[^bai2022][^lee2023]

### Automated red teaming and honest denominators

Principles only matter if they survive adversarial pressure. **Automated red teaming** probes the model with single-turn attacks and multi-turn escalations (such as Crescendo, which builds benign context before asking for restricted output on turn 3 or 4).[^perez2022][^russinovich2024crescendo] Keep attack-family lineage grouped across train and eval splits so evaluation tests unseen attack tactics rather than memorized phrasings.

Always pair **Attack Success Rate (ASR)** with **False Refusal Rate (FRR)** on benign lookalikes (the alignment tax) so a model that refuses everything cannot claim 0% ASR:

$$
\mathrm{ASR} = \frac{\text{Confirmed Violations}}{\text{Adjudicated Attack Attempts}}, \qquad
\mathrm{FRR} = \frac{\text{Incorrectly Refused Benign Queries}}{\text{Adjudicated Benign Queries}}
$$

Report judge coverage and unresolved-label bounds rather than counting unjudged attempts as passes (if 1 of 5 attacks fails, 2 pass, and 2 are unresolved, adjudicated ASR is $1/3$ while true sample ASR lies in $[20\%, 60\%]$). Finally, keep **alignment and access control strictly separate**: constitutional training shapes model habits, never hard authorization. Authentication, tenant permissions, tool-argument validation, and egress checks must live in deterministic application code outside the model weights, backed by input/output classifiers such as Llama Guard 4 or Constitutional Classifiers++.[^greshake2023][^metallamaguard4][^anthropic2026classifiers]

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

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

A release candidate raises its internal reward-model score by 0.31, and the team is pleased. Then you run 400 blinded comparisons against the old assistant, and reviewers prefer the new one only 184 times. Its answers are 48 tokens longer on average, and many now begin with `"Verified answer:"`. Would you ship it?

That mismatch between a climbing reward score and stagnant human preference is the heart of alignment engineering. After instruction tuning, a model can follow the shape of a request and still emit subtle numerical bugs, over-refuse benign questions, or pad a correct answer with filler. InstructGPT stated the problem plainly: next-token prediction rewards plausible text, not necessarily the most helpful, truthful, or safe choice.[^ouyang2022]

Preference methods push a model toward answers that human or programmatic evaluators prefer. Two main families solve that problem: online reinforcement learning against a separate reward model (RLHF), and offline optimization directly on stored pairs (DPO). They share the same underlying objective yet fail in very different ways.

## Two ways to spend a comparison

Take a concrete coding prompt: a developer asks how to prevent exponential overflow when implementing `softmax(z)` in Python. Answer A subtracts `max(z)` from every logit before calling `exp(z)`. Answer B casts the array to `float64` *after* calling `exp(z)`. Our reward model scored them `1.8` and `0.7`, implying about a 75% chance that a reviewer prefers A.

**Reinforcement learning from human feedback (RLHF)** starts from an SFT checkpoint, fits a reward model to comparisons, and updates the policy by generating fresh rollouts and scoring them with Proximal Policy Optimization (PPO).[^ouyang2022][^stiennon2020] **Direct Preference Optimization (DPO)** skips the separate reward model and trains directly on stored chosen/rejected pairs using log-probability ratios against a frozen reference.[^rafailov2023]

<figure>
  <img src="illustrations/_generated/rlhf_vs_dpo_dark.png" alt="Two aligned lanes. In the PPO lane, the actor samples a fresh response, a frozen reward model, a frozen reference, and a trainable critic score it, a clipped advantage updates the actor, and the loop returns with a new rollout. In the DPO lane, a stored chosen and rejected pair is scored by the trainable policy and a frozen reference, a pair loss updates the policy, and the loop returns to the same stored pairs." />
  <figcaption>Look at the return arrows. PPO's next update sees responses the updated policy just wrote. Basic DPO's next update sees the same stored pairs, so it never meets a failure they do not contain.</figcaption>
</figure>

## Reward the answer, charge for drift

In RL terms, the language model is a **policy** $\pi_\theta(y\mid x)$, each token is an action, one complete response is an **episode** (a **rollout**), the **return** sums rewards from step $t$ to the end, the **value** predicts that return, and the **advantage** measures how much better the actual outcome was than predicted.

Maximizing raw reward alone invites the policy to exploit every flaw in the reward model. The RLHF objective therefore subtracts a **KL divergence** penalty weighted by $\beta > 0$ from a frozen SFT reference $\pi_{\mathrm{ref}}$:

$$
\mathcal J=\mathbb E_{x\sim\mathcal D,\,y\sim\pi_\theta(\cdot\mid x)}[r(x,y)]
-\beta\mathbb E_x[D_{\mathrm{KL}}(\pi_\theta(\cdot\mid x)\parallel\pi_{\mathrm{ref}}(\cdot\mid x))].
$$

For example, suppose one reply earns raw reward `1.35` with reference log-ratio `1.6`, while another earns `1.20` with log-ratio `0.10`. At $\beta = 0.2$, their shaped returns are $1.35 - 0.2(1.6) = 1.03$ and $1.20 - 0.2(0.10) = 1.18$: the cleaner near-reference answer wins.

## PPO: four roles and a clip

Standard PPO coordinates four logical roles: the trainable **actor** generating responses, the frozen **reward model** scoring them, the frozen **reference** supplying baseline probabilities for the KL charge, and the trainable **critic** predicting prefix returns. These need not be four equal-sized GPU copies (InstructGPT paired a 175B actor with a 6B reward model), though independent 70B backbones would require 2,520 GB of model state alone before KV caches, and online rollouts add decoding latency.[^ouyang2022][^openrlhf2026framework]

### How does a final score reach early tokens?

The reward model scores a completed response only at the final token $T$. Each token receives its per-token KL charge, plus the sequence reward once at step $T$. **Generalized Advantage Estimation (GAE)** propagates that terminal signal backward from TD residuals $\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$ via $\widehat A_t = \delta_t + \gamma\lambda\widehat A_{t+1}$ (with $\gamma=1$ in InstructGPT and zero terminal bootstrap when an episode finishes naturally):[^ouyang2022][^schulman2015gae]

<!-- leetllm: test, id=reader-alignment-gae, output=show, output_title="Reader terminal credit" -->
```python title="reader-alignment-gae.py"
def advantages(rewards, values, gamma=1.0, lam=1.0):
    result, running = [0.0] * len(rewards), 0.0
    for t in reversed(range(len(rewards))):
        delta = rewards[t] + gamma * values[t + 1] - values[t]
        running = delta + gamma * lam * running
        result[t] = running
    return result

rewards, values = [0.0, 0.0, 1.0], [0.0, 0.0, 0.0, 0.0]
print("lambda=1.0:", advantages(rewards, values, lam=1.0))
print("lambda=0.5:", advantages(rewards, values, lam=0.5))
```

<!-- leetllm: output:start -->
```text title="Reader terminal credit" output compact
lambda=1.0: [1.0, 1.0, 1.0]
lambda=0.5: [0.25, 0.5, 1.0]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/terminal_credit_assignment_dark.png" alt="Three token decisions in a row, with rewards 0, 0, and 1, and a critic that predicts zero everywhere, so residuals are 0, 0, and 1. Bars show the advantage at each token. With lambda 1 they are 1, 1, 1. With lambda 0.5 they are 0.25, 0.5, 1. Arrows run backward from the final token." />
  <figcaption>Credit flows right to left. Compare the two bar rows: a smaller lambda fades the signal on the way back. Neither row can say which token actually earned the reward.</figcaption>
</figure>

### What the clip actually does

Across multiple updates on one rollout batch, PPO compares the updated actor against the rollout snapshot $\pi_{\mathrm{old}}$ using $\rho_t = \pi_\theta(a_t\mid s_t)/\pi_{\mathrm{old}}(a_t\mid s_t)$:

$$
L_t=\min(\rho_t\widehat A_t,\; \operatorname{clip}(\rho_t,1-\epsilon,1+\epsilon)\widehat A_t).
$$

<!-- leetllm: test, id=reader-alignment-ppo-clipping, output=show, output_title="Reader PPO clipping" -->
```python title="reader-alignment-ppo-clipping.py"
def surrogate(ratio, advantage, epsilon=0.2):
    clipped = min(max(ratio, 1 - epsilon), 1 + epsilon)
    return min(ratio * advantage, clipped * advantage)

for advantage in [1.0, -1.0]:
    values = [round(surrogate(ratio, advantage), 2)
              for ratio in [0.5, 1.0, 1.5]]
    print(f"advantage={advantage:+.0f}:", values)
```

<!-- leetllm: output:start -->
```text title="Reader PPO clipping" output compact
advantage=+1: [0.5, 1.0, 1.2]
advantage=-1: [-0.8, -1.0, -1.5]
```
<!-- leetllm: output:end -->

Notice the asymmetry: when $\widehat A_t > 0$, pushing $\rho_t$ past `1.2` earns no extra reward, while moving downward stays penalized; when $\widehat A_t < 0$, pushing below `0.8` stops paying while moving upward keeps hurting.[^schulman2017] Clipping removes the gradient incentive past $1 \pm \epsilon$ rather than imposing a hard clamp on KL divergence.

<figure>
  <img src="illustrations/_generated/ppo_four_model_loop_dark.png" alt="A waterfall on one numeric axis. Reward 1.35 falls by a reference charge of 0.32 to a return of 1.03. Subtracting a critic value of 0.80 leaves an advantage of 0.23. A policy ratio of 1.20 gives a clipped surrogate of 0.276. Reward and reference are frozen roles. Critic and actor are trainable." />
  <figcaption>Walk left to right. Each frozen or trainable role changes one number on the shared axis, and only the last value drives the actor's update.</figcaption>
</figure>

## DPO: the same objective with the reward model removed

For a fixed reward and prompt, the reward-minus-KL objective has an exact closed-form optimal distribution:

$$
\pi^*(y\mid x)=\frac{\pi_{\mathrm{ref}}(y\mid x)e^{r(x,y)/\beta}}{Z(x)}, \qquad
r(x,y)=\beta\log\frac{\pi^*(y\mid x)}{\pi_{\mathrm{ref}}(y\mid x)}+\beta\log Z(x).
$$

The normalizer $Z(x)$ is intractable to sum over all text, yet pairwise comparisons take only the *difference* of two rewards for the same prompt, so $Z(x)$ cancels cleanly.[^rafailov2023] Substituting the trainable policy $\pi_\theta$ turns Bradley-Terry directly into the **DPO loss**:

$$
m=\log\frac{\pi_\theta(y_w\mid x)}{\pi_{\mathrm{ref}}(y_w\mid x)}
-\log\frac{\pi_\theta(y_l\mid x)}{\pi_{\mathrm{ref}}(y_l\mid x)},\qquad
\mathcal L_{\mathrm{DPO}}=-\log\sigma(\beta m).
$$

No separate reward model and no live rollouts are needed. Sum response next-token log-probabilities across the full completion plus EOS (excluding prompt and padding by index); averaging per token instead changes the objective and can flip preference signs between responses of different lengths.

Two subtle behaviors trip up DPO runs:

- **The `0.693` start and dual role of $\beta$:** At step 0, $\pi_\theta = \pi_{\mathrm{ref}}$ so $m = 0$ and loss starts at $\ln 2 \approx 0.693$ with nonzero slope $-\beta/2$. Larger $\beta$ pulls the ideal policy closer to the reference (`99.998%` at $\beta=0.1$, `90.0%` at $\beta=0.5$, `75.0%` at $\beta=1.0$ when reviewers pick A 75% of the time over a uniform reference) while scaling the initial gradient.
- **Likelihood displacement:** Because DPO maximizes a *difference*, margins can climb even while *both* chosen and rejected likelihoods fall below the reference, simply because the rejected reply falls faster:[^dpoLikelihoodDisplacement2024][^pal2024smaug]

<!-- leetllm: test, id=reader-alignment-dpo-displacement, output=show, output_title="Reader DPO displacement" -->
```python title="reader-alignment-dpo-displacement.py"
from math import exp, log1p

reference = (-8.5, -9.1)
rows = [("before", -8.2, -9.5), ("after", -9.1, -11.2)]
for name, chosen, rejected in rows:
    ratio = chosen - reference[0]
    margin = ratio - (rejected - reference[1])
    logit = 0.1 * margin
    loss = max(-logit, 0) + log1p(exp(-abs(logit)))
    print(f"{name}: chosen ratio={ratio:+.1f}, "
          f"margin={margin:.1f}, loss={loss:.3f}")
```

<!-- leetllm: output:start -->
```text title="Reader DPO displacement" output compact
before: chosen ratio=+0.3, margin=0.7, loss=0.659
after: chosen ratio=-0.6, margin=1.5, loss=0.621
```
<!-- leetllm: output:end -->

Track chosen and rejected log-probabilities, margin, KL drift, and generated text together (and verify `max_length` truncation does not slice off the suffix where chosen and rejected actually differ).[^trl2026DpoTrainerV117][^trl2026DpoConfigV117]

## Look for the answer nobody compared

Suppose a coding model has three candidate answers: A (subtract `max(z)`), B (cast after `exp(z)`), and an unseen bug C (clamp logits to `[-100, 100]` without shifting). If offline pairs compare only A against B, two policies with identical 4:1 A-to-B odds incur the exact same DPO loss even as unseen bug C grows from 50% to 90% of probability mass:

<!-- leetllm: test, id=reader-alignment-unseen-mass, output=show, output_title="Reader unseen response mass" -->
```python title="reader-alignment-unseen-mass.py"
from math import log, exp

def pair_loss(policy, beta=0.1):
    # The reference is equal on A and B, so it cancels.
    margin = log(policy["A"] / policy["B"])
    return -log(1 / (1 + exp(-beta * margin)))

for policy in [{"A": 0.40, "B": 0.10, "C": 0.50},
               {"A": 0.08, "B": 0.02, "C": 0.90}]:
    odds = policy["A"] / policy["B"]
    print(f"A:B odds={odds:.0f}; loss={pair_loss(policy):.5f}; "
          f"C={policy['C']:.0%}")
```

<!-- leetllm: output:start -->
```text title="Reader unseen response mass" output compact
A:B odds=4; loss=0.62623; C=50%
A:B odds=4; loss=0.62623; C=90%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/unseen_response_mass_dark.png" alt="A triangle holds every three-answer policy, with corners A, B, and C. Policy one at 0.40, 0.10, 0.50 and policy two at 0.08, 0.02, 0.90 both lie on one dashed line from corner C, where A to B odds stay four to one, so their observed pair loss is the same 0.62623. Stacked bars show the same two policies as probabilities, with C growing from 50 to 90 percent." />
  <figcaption>Every point on the dashed line has the same A-to-B odds, so the loss cannot tell them apart. Slide toward corner C, and the unseen violation gains probability while no training row notices.</figcaption>
</figure>

| | PPO-style RLHF | Basic DPO |
| --- | --- | --- |
| Separate reward model | Yes | No, the reward is implicit |
| Training loop | Rollouts and policy updates | Offline loss on fixed pairs |
| Logical roles | Policy, reference, reward, critic | Policy, reference (can precompute) |
| Exploration | Yes | None unless you iteratively refresh pairs[^calandriello2024] |

Start with DPO when you have clean offline pairs; move to iterative DPO or online RL when you need fresh negatives from the evolving policy.

## The family around these two

| Method | Signal and mechanism | What to watch |
| --- | --- | --- |
| **IPO**[^azar2023] | Squared loss targeting finite margin $1/(2\tau)$ | Discourages runaway margins on deterministic pairs |
| **KTO**[^ethayarajh2024] | Unpaired thumbs-up / thumbs-down labels | Selection bias and class balance |
| **ORPO**[^hong2024] | SFT + odds-ratio penalty in one stage, no reference | Couples instruction tuning and preference updates |
| **SimPO**[^meng2024] | Length-normalized average token log-prob + target margin | Check concision versus completeness |
| **GRPO**[^shao2024][^deepseekai2025] | Online RL normalizing rewards across $G$ sampled answers per prompt (no critic) | Drops 44.4% of four-backbone state; flat groups give zero advantage |

## When the proxy lies

Returning to our opening candidate (`+0.31` reward, `+48` tokens, `"Verified answer:"` prefix, `184/400` human wins): test reward hacking directly by comparing plain versus prefixed rewrites. Common exploits include length gaming, sycophancy toward wrong premises, formatting spam, and overconfident tone on hard prompts.

Decide releases on blinded held-out human comparisons with predeclared criteria, checking sampling uncertainty via a 95% Wilson interval:[^nistBinomialIntervals2026]

<!-- leetllm: test, id=reader-alignment-release-gate, output=show, output_title="Reader release gate" -->
```python title="reader-alignment-release-gate.py"
from math import sqrt

def wilson(wins, total, z=1.96):
    p = wins / total
    scale = 1 + z**2 / total
    center = (p + z**2 / (2 * total)) / scale
    spread = p * (1 - p) / total + z**2 / (4 * total**2)
    half = z * sqrt(spread) / scale
    return center - half, center + half

low, high = wilson(184, 400)
length_growth, length_limit = 48, 20
print(f"win rate 95% interval: {low:.1%} to {high:.1%}")
print("beats 50% lower bound:", low > 0.5)
print("within length limit:", length_growth < length_limit)
```

<!-- leetllm: output:start -->
```text title="Reader release gate" output compact
win rate 95% interval: 41.2% to 50.9%
beats 50% lower bound: False
within length limit: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/alignment_failure_guardrails_dark.png" alt="Three rows. Proxy reward rises by 0.31. The 184 of 400 win rate has a 95 percent Wilson interval from 41.2 to 50.9 percent, crossing the 50 percent line, so it fails the lower-bound bar. Length grew by 48 tokens against a limit of 20, and fails." />
  <figcaption>The 95% interval crosses 50%, so the candidate shows neither a clear gain nor a clear loss, while response length exceeds the 20-token cap. A higher proxy reward cannot override human evaluation.</figcaption>
</figure>

The interval `[41.2%, 50.9%]` crosses 50% and length growth exceeds the 20-token cap, so you hold the release.

```checkpoint
At $\beta=0.5$, the chosen answer's log-ratio against the reference is +0.2, and the rejected answer's is −0.6. What are the margin, the logit, and the DPO loss?
---
The margin is $0.2-(-0.6)=0.8$. The logit is $\beta m=0.5\times0.8=0.4$. The loss is $-\log\sigma(0.4)\approx0.513$, which is below the 0.693 of a fresh run, so this pair has started to move.
```

## Constitutional AI, RLAIF, and red teaming

Human comparisons are expensive and hard to extend to every adversarial corner. **Constitutional AI (CAI)** writes down explicit principles and trains against them in two phases:[^bai2022][^anthropic2026constitution]

1. **Critique-revision SFT (SL-CAI):** Elicit an initial draft $y_0$ on red-team prompts, have the model critique $y_0$ against a chosen principle and rewrite it into $y^*$, then fine-tune only on the clean revisions $(x, y^*)$.
2. **RL from AI Feedback (RLAIF):** Sample candidate pairs from the revised policy, ask an AI judge which reply better follows the principle (swapping A/B order and averaging by response identity to expose position bias), fit a reward model to the judge's soft preference probabilities $q$ ($\frac{d\mathcal{L}}{dd} = \sigma(d) - q$), and optimize the policy combining AI harmlessness feedback with human helpfulness feedback.[^bai2022][^lee2023]

Verify those safeguards with **automated red teaming** across single-turn and multi-turn attacks (such as gradual Crescendo escalations), keeping attack families grouped across splits so tests check new tactics rather than memorized prompts.[^perez2022][^russinovich2024crescendo] Always track **Attack Success Rate (ASR)** next to **False Refusal Rate (FRR)** on benign lookalikes, report coverage and unresolved-label bounds instead of counting missing verdicts as passes, and keep hard access enforcement outside the weights: authentication, record permissions, and tool validation belong in application code, with classifiers such as Llama Guard 4 or Constitutional Classifiers++ adding defense in depth.[^greshake2023][^metallamaguard4][^anthropic2026classifiers]

## Where this leaves you

You can now trace a terminal score back through its tokens, read PPO's clip correctly, derive DPO's loss and say why the normalizer vanishes, spot a margin that grows while the answer gets less likely, pair AI self-critique with honest red-team metrics, and decide on a release from a written rule. Next, [RLVR & Verifiable Rewards](/learn/rlvr-verifiable-rewards-training) replaces learned preference proxies with deterministic verifiers for math, code, and structured constraints.

<!-- leetllm: edition:reader:end -->
