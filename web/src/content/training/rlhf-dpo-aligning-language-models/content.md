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
  "shortDescription": "An internal judge score can rise while blinded comparisons stay flat. Turn preference labels into a PPO update or a DPO loss, then test the score on held-out behavior.",
  "keyConceptsTested": [
    "RLHF pipeline from SFT to reward modeling to PPO",
    "Bradley-Terry preference probability as a reward-gap sigmoid",
    "PPO four-role loop and KL-shaped reward",
    "DPO implicit reward and pairwise loss",
    "Likelihood displacement versus a rising DPO margin",
    "Online RLHF versus offline preference optimization",
    "Reward hacking and held-out human preference gates",
    "Alignment variants (IPO, KTO, ORPO, SimPO, GRPO)"
  ],
  "section": "Advanced Training & Adaptation",
  "order": 12,
  "coverImage": "social_banner.png",
  "prerequisites": [
    "supervised-fine-tuning-pipeline",
    "reward-modeling-from-preference-data",
    "instruction-tuning-chat-templates"
  ],
  "relatedQuestions": [
    "reward-modeling-from-preference-data",
    "rlvr-verifiable-rewards-training",
    "constitutional-ai-automated-red-teaming"
  ]
}
---
<!-- leetllm: edition:reference:start -->

Suppose a release candidate raises its internal judge score by $0.31$, yet wins only 184 of 400 blinded comparisons against the old assistant. Its answers are also 48 tokens longer on average, often starting with "Verified answer:". Would you promote it? That gap shows a rising proxy reward without a confirmed preference gain in blinded comparisons. Keep that disagreement in view as we turn preference labels into policy updates.

The last chapter turned one numerical-stability comparison into a scalar. For the prompt "How do you prevent exponential overflow when implementing `softmax(z)` in Python?", shifting logits by subtracting `max(z)` before `exp(z)` scored $1.80$, while casting to `float64` after `exp(z)` scored $0.70$. The <span data-glossary="bradley-terry-model">Bradley-Terry preference model</span> maps that $1.10$ margin to roughly a $75\%$ chance that the labeler prefers the valid fix. This chapter asks what to do with that signal: train a policy against a learned judge with RL, or skip the separate scorer and optimize the policy directly from the pairs?

An instruction-tuned assistant can still answer that prompt with fluent, confident, and buggy code. InstructGPT puts the gap plainly: a model trained to predict plausible text can still be unhelpful, untruthful, or unsafe even when the prose looks polished.[^ouyang2022]

That is the alignment problem. <span data-glossary="pretraining">Pretraining</span> optimizes next-<span data-glossary="token">token</span> prediction. Preference methods such as <span data-glossary="rlhf">RLHF</span> (Reinforcement Learning from Human Feedback) and <span data-glossary="dpo">DPO</span> (Direct Preference Optimization) push the model toward answers a labeling policy prefers. They do not, by themselves, prove truthfulness or safety outside that policy's coverage. Whether learned or held out, a judge remains a proxy.

## What preference pairs add to SFT

After instruction tuning, the model follows prompt structure well enough, yet it can still emit subtle numerical bugs, over-refuse safe questions, or pad a correct answer until it becomes unreadable. Next-token prediction does not enforce reliability under downstream preferences, because predicting plausible text is different from satisfying the behavior being judged.

Keep the same coding prompt the reward-modeling chapter used: "How do you prevent exponential overflow when implementing `softmax(z)` in Python?" Two <span data-glossary="supervised-fine-tuning">SFT</span> completions are both fluent and confident:

- Response A: "Subtract `max(z)` from every logit before calling `exp(z)` so the largest exponent is zero."
- Response B: "Cast the output array to `float64` after calling `exp(z)` so large values fit safely."

Response A prevents intermediate overflow, whereas Response B overflows inside `exp(z)` before any type cast runs. SFT on verified demonstrations can teach numerical stability too, so preference training is not the only way to fix a bug. What a pair adds is an explicit contrast under the same prompt, telling the optimizer to favor A *over B*. Collecting pairwise comparisons is often easier than authoring a fresh canonical response, though the signal still teaches only the distinctions those labels contain.[^ouyang2022]

<figure>
  <img src="illustrations/_generated/alignment_gap_dark.png" alt="The softmax overflow prompt branches into two short replies: subtract max(z) before exp(z), or cast logits to float64 after exp(z). A scalar reward scorer assigns 1.80 and 0.70, a 1.10 gap that maps through Bradley-Terry to about 75 percent for subtracting max(z) first." />
  <figcaption>A 1.10 reward margin yields an implied Bradley-Terry preference near 75% for subtracting max(z) before exp(z); validate implied probabilities against held-out votes.</figcaption>
</figure>

## RLHF: a judge, then an actor

RLHF is the large-scale preference pipeline InstructGPT popularized, building on earlier human-feedback fine-tuning for summarization: start from an SFT model, train a <span data-glossary="reward-model">reward model</span> from comparisons, then optimize the policy with reinforcement learning.[^stiennon2020][^ouyang2022]

The pipeline is a handoff. SFT gives instruction-following. The reward model turns comparisons into a scalar. PPO updates the policy while a KL term charges drift away from the SFT reference.

### Three-phase pipeline

Treat each phase as answering one question: can the model imitate useful answers, can a scorer reproduce the preference rule, and can the policy improve under that scorer without leaving tested behavior? The first two use stored examples. The third generates and scores policy outputs.

Phase 3 is where the extra machinery shows up. InstructGPT's RL stage is a bandit: a prompt comes in, the policy writes a response, the reward model returns a scalar, and a per-token KL penalty against the SFT model is added to limit overoptimization.[^ouyang2022] That fresh response is the key difference from fitting only the stored demonstrations.

### Bradley-Terry, one number later

Here is how the judge turns a pair into a training signal. Because A's score is higher, its preference probability sits above $0.5$, whereas reversing the scores makes the observed preference for A much less likely. The Bradley-Terry model says the probability that a human prefers $y_w$ over $y_l$ is a sigmoid of the reward gap:[^ouyang2022][^rafailov2023]

$$
P(y_w \succ y_l \mid x) = \sigma\left(r(x, y_w) - r(x, y_l)\right)
$$

Plug in last chapter's scores: $r(A)=1.8$, $r(B)=0.7$. The gap is $1.1$, so $P(A \succ B)=\sigma(1.1)\approx 0.750$. If the human picked A, the negative log-likelihood of that observation is about $0.287$. Flip the scores and the loss becomes about $1.387$. These are the scorer's preference probabilities, not independently calibrated guarantees about people. The loss pushes the reward model toward the observed label.

```checkpoint
Why does a larger reward gap make the preference probability closer to 1?
---
The sigmoid receives a larger positive input, so it moves toward 1. In Bradley-Terry terms, a larger score difference means the model is more confident the higher-scored response wins.
```

<!-- leetllm: test, output=show, output_title="Bradley-Terry output" -->
```python title="bradley_terry_softmax_pair.py"
import math


def sigmoid(value: float) -> float:
    return 1 / (1 + math.exp(-value))


reward_a = 1.8
reward_b = 0.7
preference_probability = sigmoid(reward_a - reward_b)
negative_log_likelihood = -math.log(preference_probability)

print(f"P(A preferred over B) = {preference_probability:.1%}")
print(f"NLL = {negative_log_likelihood:.3f}")
```

<!-- leetllm: output:start -->
```text title="Bradley-Terry output" output compact
P(A preferred over B) = 75.0%
NLL = 0.287
```
<!-- leetllm: output:end -->

The training loss is the same expectation you saw for the reward model:

$$
\mathcal{L}_{\text{RM}}
= -\mathbb{E}_{(x, y_w, y_l)}
\left[\log \sigma\left(r(x, y_w) - r(x, y_l)\right)\right]
$$

where $y_w$ is the winning response and $y_l$ is the losing response for the same prompt $x$.

### PPO and the cost of leaving the reference

Once you have a reward model, ask what prevents the policy from chasing its score by drifting into gibberish. Treat the language model as a policy $\pi_\theta$: a conditional probability distribution over responses given a prompt. <span data-glossary="ppo">Proximal Policy Optimization (PPO)</span> clips the objective's incentive for large probability ratios on sampled actions; policy changes elsewhere still depend on the data and update process.[^schulman2017] We start by formalizing what we want to optimize: expected reward minus a penalty for leaving the reference model, scaled by coefficient $\beta > 0$:

$$
\max_\theta \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta(\cdot \mid x)} \left[ r(x, y) \right] - \beta \mathbb{E}_{x \sim \mathcal{D}} \left[ \mathbb{D}_{\text{KL}}\left(\pi_\theta(\cdot \mid x) \parallel \pi_{\text{ref}}(\cdot \mid x)\right) \right]
$$

The <span data-glossary="kl-divergence">Kullback-Leibler divergence</span> is an expectation over complete responses: $\mathbb{D}_{\text{KL}}(\pi_\theta \parallel \pi_{\text{ref}}) = \mathbb{E}_{y \sim \pi_\theta} [\log \pi_\theta(y \mid x) - \log \pi_{\text{ref}}(y \mid x)]$. It's non-negative, with zero for identical distributions, even though an individual sampled log-ratio can be negative. A plain sample mean estimates this KL when rollouts come directly from the same $\pi_\theta$ whose log-probabilities you score. Greedy search, temperature changes, nucleus filtering, and top-$k$ truncation change the sampling distribution; scores from an older policy do too. Correct for that mismatch or label the metric accordingly.

Before inspecting the PPO approximation, look at what the unconstrained mathematical optimum of this objective actually is. For any fixed prompt $x$, write the objective directly:

$$
\mathcal{J}(\pi) = \sum_y \pi(y \mid x) r(x, y) - \beta \sum_y \pi(y \mid x) \log \frac{\pi(y \mid x)}{\pi_{\text{ref}}(y \mid x)}
$$

Pull out $-\beta$:

$$
\mathcal{J}(\pi) = -\beta \sum_y \pi(y \mid x) \left[ \log \frac{\pi(y \mid x)}{\pi_{\text{ref}}(y \mid x)} - \frac{1}{\beta} r(x, y) \right] = -\beta \sum_y \pi(y \mid x) \log \left( \frac{\pi(y \mid x)}{\pi_{\text{ref}}(y \mid x) \exp(r(x, y)/\beta)} \right)
$$

Define the prompt partition function (normalizer) $Z(x) = \sum_y \pi_{\text{ref}}(y \mid x) \exp(r(x, y)/\beta)$, which is independent of the response $y$. Multiplying and dividing inside the logarithm by $Z(x)$ yields:

$$
\mathcal{J}(\pi) = -\beta \sum_y \pi(y \mid x) \log \left( \frac{\pi(y \mid x)}{\frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x) \exp(r(x, y)/\beta)} \cdot \frac{1}{Z(x)} \right)
$$

Splitting the log product separates the terms:

$$
\mathcal{J}(\pi) = -\beta \mathbb{D}_{\text{KL}}\left( \pi(\cdot \mid x) \parallel \pi^*(\cdot \mid x) \right) + \beta \log Z(x)
$$

where the optimal distribution is defined analytically as:

$$
\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x) \exp\left( \frac{r(x, y)}{\beta} \right)
$$

Assume $\beta>0$, a finite normalizer $Z(x)$, and restrict policies to responses supported by the reference. Then KL is non-negative, with equality at $\pi=\pi^*$, so this is the unique optimal **distribution** for the fixed reward. A parameterized language model might not represent or reach it. This result is an exponentially reweighted reference policy, not a convergence guarantee for an optimizer.

Computing the normalizer over language sequences is generally intractable. PPO instead makes approximate policy updates from sampled responses; finite data, clipping, and critic error can keep the learned policy away from this optimum.[^rafailov2023]

### Token-level reward shaping and the four model roles

The PPO-style RLHF recipe here coordinates **four logical model roles**:

1. **Actor / policy** ($\pi_\theta$): the generative language model being trained.
2. **Reference** ($\pi_{\text{ref}}$): frozen SFT model providing baseline log-probabilities for the KL penalty.
3. **Reward model** ($r_\phi$): frozen scorer that evaluates sequence quality.
4. **Critic / value** ($V_\psi$): predicts expected future return from each prefix to help estimate advantages.

These roles don't require four independent, simultaneously resident GPU backbones. The critic can be smaller or share policy parameters; frozen roles can use separate devices or offloading. InstructGPT, for example, used a 6B reward model even for its 175B policy and initialized its value function from that reward model.[^ouyang2022][^schulman2017]

In this sequence-score recipe, the reward model scores the completed response $y=(y_1,\dots,y_T)$. A terminal reward **can train earlier tokens**: their returns include that future outcome. Assigning it to each immediate reward would instead count it repeatedly. KL shaping adds a different signal, charging each generated token for its sampled policy/reference log-ratio. When collecting a rollout, evaluate that charge under the rollout policy $\pi_{\mathrm{old}}$:

$$
R_t = \begin{cases}
-\beta \left( \log \pi_{\mathrm{old}}(y_t \mid x, y_{<t}) - \log \pi_{\text{ref}}(y_t \mid x, y_{<t}) \right), & 1 \le t < T \\
r_\phi(x, y) - \beta \left( \log \pi_{\mathrm{old}}(y_T \mid x, y_{<T}) - \log \pi_{\text{ref}}(y_T \mid x, y_{<T}) \right), & t = T
\end{cases}
$$

For an undiscounted episode, adding these rewards uses the autoregressive log-probability factorization:

$$
\sum_{t=1}^T R_t = r_\phi(x, y) - \beta \sum_{t=1}^T \log \frac{\pi_{\mathrm{old}}(y_t \mid x, y_{<t})}{\pi_{\text{ref}}(y_t \mid x, y_{<t})} = r_\phi(x, y) - \beta \log \frac{\pi_{\mathrm{old}}(y \mid x)}{\pi_{\text{ref}}(y \mid x)}
$$

Its expectation under $\pi_{\mathrm{old}}$ is the reward-minus-KL objective for that rollout policy. It isn't a fresh evaluation of the actor after every PPO update. Store rollout rewards, old log-probabilities, and detached advantage targets for the batch.

Generalized Advantage Estimation (GAE) uses residuals $\delta_t=R_t+\gamma V(s_{t+1})-V(s_t)$ and, for an episode ending at $T$, $\hat A_t=\sum_{l=0}^{T-t}(\gamma\lambda)^l\delta_{t+l}$. Here $\gamma$ discounts future rewards, while $\lambda$ trades off reliance on the critic against longer sampled returns. Use $V(s_{T+1})=0$ for a true terminal state; a deliberately truncated continuing episode needs an appropriate bootstrap.[^schulman2015gae]

Try terminal-only rewards with no KL and a zero baseline. Does the first token have zero advantage?

<!-- leetllm: test, output=show, output_title="Terminal credit output" -->
```python title="terminal_reward_reaches_earlier_tokens.py"
def gae(rewards: list[float], values: list[float], lam: float) -> list[float]:
    if len(values) != len(rewards) + 1:
        raise ValueError("need one baseline per step plus the terminal bootstrap")
    advantages = [0.0] * len(rewards)
    running = 0.0
    for t in reversed(range(len(rewards))):
        delta = rewards[t] + values[t + 1] - values[t]  # gamma = 1
        running = delta + lam * running
        advantages[t] = running
    return advantages


rewards = [0.0, 0.0, 1.0]
values = [0.0, 0.0, 0.0, 0.0]
for lam in [1.0, 0.5]:
    advantages = gae(rewards, values, lam)
    print(f"lambda={lam:.1f}: advantages={advantages}")
    assert all(value > 0 for value in advantages)
```

<!-- leetllm: output:start -->
```text title="Terminal credit output" output compact
lambda=1.0: advantages=[1.0, 1.0, 1.0]
lambda=0.5: advantages=[0.25, 0.5, 1.0]
```
<!-- leetllm: output:end -->

With $\gamma=\lambda=1$, the terminal score reaches every earlier decision through its return. With this inaccurate zero critic and a smaller $\lambda$, the signal fades backward. The scalar reward propagates through the sequence; it does not identify which token caused the outcome.

<figure>
  <img src="illustrations/_generated/terminal_credit_assignment_dark.png" alt="Three token transitions have rewards 0, 0, and 1. The critic predicts zero at all four states, including terminal V3, so the TD residuals are 0, 0, and 1. Backward GAE accumulation gives advantages [1, 1, 1] at lambda 1 and [0.25, 0.5, 1] at lambda 0.5; arrows point from the terminal decision toward earlier tokens." />
  <figcaption>Backward GAE carries the terminal reward to earlier tokens. A smaller $\lambda$ discounts more distant credit when this zero critic supplies the baseline.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/ppo_four_model_loop_dark.png" alt="One sampled response produces reward 1.35 and a sampled reference charge of 0.32, giving return 1.03. The critic value 0.80 is subtracted to produce advantage 0.23. With policy ratio 1.20, the clipped surrogate is 0.276. Reward and reference are frozen roles; critic and actor are trainable roles. This example does not imply four simultaneously resident model copies." />
  <figcaption>One token decision connects the reward, reference charge, critic baseline, advantage, and actor ratio. Real token trajectories use prefix values and GAE.</figcaption>
</figure>

The snippet below isolates shaped reward for two sampled responses. Before reading its output, predict the ordering: the preamble has raw reward $1.35$ but log-ratio $1.6$, versus $0.1$ for the near-reference sample. With $\beta=0.2$, KL erases that apparent win.

<!-- leetllm: test, output=show, output_title="KL-shaped reward output" -->
```python title="kl_regularized_reward.py"
samples = [
    {"name": "near_reference", "reward": 1.20, "policy_logp": -2.1, "ref_logp": -2.2},
    {"name": "preamble_hack", "reward": 1.35, "policy_logp": -1.2, "ref_logp": -2.8},
]
beta = 0.20

for sample in samples:
    sampled_log_ratio = sample["policy_logp"] - sample["ref_logp"]
    shaped_reward = sample["reward"] - beta * sampled_log_ratio
    print(f"{sample['name']}: raw={sample['reward']:.2f} shaped={shaped_reward:.2f}")
```

<!-- leetllm: output:start -->
```text title="KL-shaped reward output" output compact
near_reference: raw=1.20 shaped=1.18
preamble_hack: raw=1.35 shaped=1.03
```
<!-- leetllm: output:end -->

The higher raw score isn't automatically the larger shaped return. These two rows illustrate arithmetic, not an estimate of the full KL. On a complete two-response distribution, one log-ratio can be negative while its policy-weighted average stays positive:

<!-- leetllm: test, output=show -->
```python title="sampled_ratio_vs_kl.py"
import math

policy = [0.8, 0.2]
reference = [0.5, 0.5]
ratios = [math.log(p / q) for p, q in zip(policy, reference, strict=True)]
kl = sum(p * ratio for p, ratio in zip(policy, ratios, strict=True))
print("sample log-ratios:", [round(value, 3) for value in ratios])
print(f"expected KL={kl:.3f}")
assert ratios[1] < 0 < kl
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sample log-ratios: [0.47, -0.916]
expected KL=0.193
```
<!-- leetllm: output:end -->

### What PPO actually clips

The reference anchors the overall training run. A second policy snapshot, $\pi_{\mathrm{old}}$, generated the current rollout batch. PPO compares the changing actor to **that snapshot**, not to the SFT reference. At token $t$, let $s_t$ be the prompt plus generated prefix and $a_t$ the sampled next token:

$$
\rho_t(\theta)=\frac{\pi_\theta(a_t \mid s_t)}{\pi_{\mathrm{old}}(a_t \mid s_t)},\qquad
L_t=\min\left(\rho_t \hat{A}_t,\operatorname{clip}(\rho_t,1-\epsilon,1+\epsilon)\hat{A}_t\right).
$$

We maximize the batch average of $L_t$. A positive advantage $\hat{A}_t$ says the outcome beat the critic's expectation; a negative one says it fell short.

Clipping behaves asymmetrically depending on the sign of the advantage:

- When $\hat{A}_t>0$ and $\epsilon=0.2$, this sample's surrogate stops improving once the ratio exceeds $1.2$. It still penalizes a ratio that moves downward in the wrong direction.
- When $\hat{A}_t<0$, reducing the ratio improves the surrogate only down to $0.8$. Below that, its value is constant. Increasing the ratio remains harmful and isn't clipped away.

Check both signs across varying ratios:

<!-- leetllm: test, output=show -->
```python title="ppo_clipped_surrogate.py"
def surrogate(ratio: float, advantage: float, epsilon: float = 0.2) -> float:
    clipped = min(max(ratio, 1 - epsilon), 1 + epsilon)
    return min(ratio * advantage, clipped * advantage)

for advantage in [1.0, -1.0]:
    values = [surrogate(ratio, advantage) for ratio in [0.5, 1.0, 1.5]]
    print(f"A={advantage:+.0f}: {values}")
assert surrogate(1.5, 1.0) == 1.2
assert surrogate(0.5, -1.0) == -0.8
assert surrogate(1.5, -1.0) == -1.5
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A=+1: [0.5, 1.0, 1.2]
A=-1: [-0.8, -1.0, -1.5]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/ppo_clipped_surrogate_dark.png" alt="Two PPO clipped-surrogate curves share a labeled probability-ratio axis from 0.5 to 1.5 and a signed objective axis. With epsilon 0.2, positive advantage flattens above 1.2 and negative advantage flattens below 0.8. The clipped objective removes added surrogate gain while the policy ratio can still cross either threshold." />
  <figcaption>Solid curves show the clipped objective; dashed curves show the raw surrogate. The flat segment depends on the advantage sign, and neither threshold forces the ratio to stop.</figcaption>
</figure>

Clipping removes an incentive in this surrogate. It does not forcibly clamp every actual token probability or impose a hard KL cap. PPO can take several gradient passes over one batch, retaining its old-policy probabilities and advantage targets, before collecting fresh rollouts.

### The systems cost of online RL

Estimate the allocations before choosing a layout. Suppose all four roles have independent 70B backbones, both trainable roles use BF16 weights and gradients, and Adam stores two FP32 moments plus an FP32 master copy. That's an **assumed 16 bytes per trainable parameter** and 2 per frozen parameter. The master copy and gradient precision are implementation choices; adapters or a smaller critic change this budget.

<!-- leetllm: test, output=show, output_title="Alignment state budget" -->
```python title="four_role_state_budget.py"
parameters = 70_000_000_000
trainable_bytes = 2 + 2 + 4 + 4 + 4  # weights, gradients, moments, master
frozen_bytes = 2
actor_gb = parameters * trainable_bytes / 1e9
critic_gb = actor_gb
frozen_gb = parameters * frozen_bytes / 1e9
ppo_gb = actor_gb + critic_gb + 2 * frozen_gb
without_critic_gb = actor_gb + 2 * frozen_gb

print(f"each trainable backbone={actor_gb:.0f} GB")
print(f"each frozen backbone={frozen_gb:.0f} GB")
print(f"four-role state total={ppo_gb:.0f} GB")
print(f"remove critic: {without_critic_gb:.0f} GB, saved={critic_gb / ppo_gb:.1%}")
```

<!-- leetllm: output:start -->
```text title="Alignment state budget" output compact
each trainable backbone=1120 GB
each frozen backbone=140 GB
four-role state total=2520 GB
remove critic: 1400 GB, saved=44.4%
```
<!-- leetllm: output:end -->

These are decimal GB of aggregate parameter-related state, excluding activations, generation KV caches, temporary buffers, replication, and communication. They aren't measured peak GPU allocations or a universal PPO requirement. Sharding and offloading distribute or relocate state; they don't make the underlying bytes vanish. Whether the run needs multiple nodes depends on the recipe and available hardware.

Rollouts add work that offline DPO avoids. Prompt prefill and token-by-token decoding have different compute and memory demands; decoding can be bandwidth-bound at small batches, while larger rollout batches improve throughput until another limit takes over. A training run usually values throughput more than an interactive assistant's response latency.

Both colocated and separate generation/training layouts are valid. OpenRLHF documents a colocated hybrid engine that alternates generation and training, and an asynchronous mode that can overlap them. Overlap brings weight synchronization, possible stale-policy samples, and extra resource costs. Compare measured utilization and policy lag rather than assuming decoupling always wins.[^openrlhf2026framework]

| Cost or failure | Evidence to inspect | Options to test |
|:---|:---|:---|
| Parameter state | Per-role sizes, optimizer/gradient dtypes, shared weights | Sharding, offload, adapters, a smaller critic |
| Rollout time | Prefill/decode times, batch utilization, policy lag | Batch scheduling, KV-cache budget, colocated or asynchronous engines |
| Unstable updates | Value loss, advantages, ratio distribution, reference drift | Learning rate, clipping, GAE, reward scaling; verify each change |
| Scorer exploitation | Controlled rewrites and independent judgments | Better labels/scorer coverage, shorter optimization, evaluated KL budgets |

## DPO: turn reward fitting into policy fitting

PPO-style RLHF is a multi-role online loop. If a fixed pair already tells you which response wins, why generate another response for every update? DPO targets those pairs with a classification-style loss. It removes engineering overhead, but it doesn't give you online exploration or guarantee the same checkpoint PPO would have found.

### Why an offline loss can stand in for RL

Under a KL-regularized reward-maximization objective and a Bradley-Terry preference model, the optimal policy and the reward function are two mathematical views of the same object. DPO parameterizes an implicit reward with policy-to-reference log-probability ratios, so the pairwise loss never needs a standalone reward model or a PPO loop.[^rafailov2023]

Recall the closed-form analytical optimum derived earlier for a fixed prompt $x$ and frozen reference policy $\pi_{\text{ref}}$:

$$
\pi^*(y \mid x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y \mid x) \exp\left( \frac{r(x, y)}{\beta} \right)
$$

Taking the natural logarithm of both sides isolates the reward:

$$
\log \pi^*(y \mid x) = \log \pi_{\text{ref}}(y \mid x) + \frac{r(x, y)}{\beta} - \log Z(x)
$$

Rearranging expresses the fixed reward $r(x,y)$ in terms of its optimal policy, the reference, and the partition function. The algebra also works for a proxy reward; evaluate that reward against ground-truth labels:

$$
r(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)
$$

Now, substitute this expression into the Bradley-Terry preference model. The probability that a human prefers $y_w$ over $y_l$ depends strictly on the difference between their rewards:

$$
P(y_w \succ y_l \mid x) = \sigma\left( r(x, y_w) - r(x, y_l) \right)
$$

Watch what happens when you subtract the two implicit reward terms:

$$
r(x, y_w) - r(x, y_l) = \left[ \beta \log \frac{\pi^*(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} + \beta \log Z(x) \right] - \left[ \beta \log \frac{\pi^*(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} + \beta \log Z(x) \right]
$$

The partition function $Z(x) = \sum_y \pi_{\text{ref}}(y \mid x) \exp(r(x, y)/\beta)$ depends solely on the prompt $x$, not the response. It cancels out completely:

$$
r(x, y_w) - r(x, y_l) = \beta \log \frac{\pi^*(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi^*(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}
$$

This cancellation is the mathematical foundation of DPO.[^rafailov2023] By substituting the parameterized policy $\pi_\theta$ for the optimal policy $\pi^*$, we define the implicit reward:

$$
\hat{r}_\theta(x, y) = \beta \log \frac{\pi_\theta(y \mid x)}{\pi_{\text{ref}}(y \mid x)}
$$

We can now train the language model directly on preference pairs by minimizing the negative log-likelihood of the observed **preference labels**. This isn't the SFT loss $-\log\pi_\theta(y_w|x)$: the sigmoid models which answer wins, rather than the probability of generating the chosen text.

$$
\mathcal{L}_{\text{DPO}}(\theta) = -\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}} \left[ \log \sigma\left( \beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} \right) \right]
$$

What exactly is equivalent to RLHF here? The change of variables connects a reward function to its exact KL-regularized optimal distribution. Recovering the same optimum from preference learning additionally needs a suitable preference model, enough comparisons to identify relevant reward differences, a policy class that can represent the solution, and successful optimization. Under the Bradley-Terry population assumptions, the objectives can share an optimum.[^rafailov2023][^azar2023] A finite DPO run and a clipped PPO run need not produce the same policy. Neither the algebra nor a low training loss determines behavior on answers absent from the comparisons.

```checkpoint
Why does the reference policy appear in DPO?
---
Its likelihood ratio defines each completion's implicit reward relative to that baseline. The chosen-minus-rejected difference determines the preference logit. This construction comes from the KL-regularized optimum; the empirical pair loss doesn't enforce a hard global drift bound.
```

### Gradient dynamics and implicit sample weighting

Taking the gradient of $\mathcal{L}_{\text{DPO}}$ with respect to the policy parameters $\theta$ reveals how DPO steers the model:

$$
\nabla_\theta \mathcal{L}_{\text{DPO}}(\theta) = -\beta \mathbb{E}_{(x, y_w, y_l)} \left[ \underbrace{\sigma\left(\hat{r}_\theta(x, y_l) - \hat{r}_\theta(x, y_w)\right)}_{\text{Dynamic Sample Weight}} \cdot \underbrace{\left( \nabla_\theta \log \pi_\theta(y_w \mid x) - \nabla_\theta \log \pi_\theta(y_l \mid x) \right)}_{\text{Push-Pull Direction}} \right]
$$

This gradient contains two intuitive mechanisms:

1. **Contrast direction**: Gradient descent follows $\nabla_\theta\log\pi_\theta(y_w|x)-\nabla_\theta\log\pi_\theta(y_l|x)$. The two terms favor the chosen and oppose the rejected completion, but shared parameters can make both absolute probabilities fall. Each token's probability change depends on its shared parameter gradients and the optimizer update.
2. **Pair weight**: $\sigma(\hat r_l-\hat r_w)$ lies above $0.5$ when the implicit reward ordering is wrong and approaches 1 for a large negative chosen margin. It approaches zero for a large positive margin. This scales the pair's gradient; it isn't the optimizer's learning rate or a guarantee against overfitting.

The role of $\beta$ deserves care. For a fixed reward, a larger $\beta$ makes the analytical optimum stay closer to the reference. In the empirical DPO loss, it also scales the logit and the gradient. At initialization, $\partial L/\partial m=-\beta/2$ for unscaled margin $m$. A larger $\beta$ therefore produces a larger initial margin gradient, even though it represents stronger KL regularization in the reward-to-policy derivation. Learning rate, number of updates, and saturation affect the actual drift.

For a complete two-answer policy with a uniform reference, suppose the true probability of preferring A is $q=0.75$. Matching that probability requires $\beta m=\log(q/(1-q))=\log3$, so $\pi^*(A)=\sigma(\log3/\beta)$. These are population optima, not measurements from training:

| $\beta$ | Initial $\partial L/\partial m$ | Optimal margin $m$ | Optimal $\pi(A)$ |
|:---|:---|:---|:---|
| 0.1 | $-0.05$ | 10.986 | 99.998% |
| 0.5 | $-0.25$ | 2.197 | 90.0% |
| 1.0 | $-0.50$ | 1.099 | 75.0% |

Larger $\beta$ moves the ideal policy closer to the 50% reference here. It doesn't turn empirical DPO into an explicit hard KL constraint.[^rafailov2023][^azar2023]

### Work the loss on the softmax pair

Apply the loss to the softmax overflow prompt. Here $y_w$ is chosen (subtract `max(z)` before `exp(z)`) and $y_l$ is rejected (cast to `float64` after `exp(z)`). Read each term as change relative to the frozen reference: raise the chosen response relative to that baseline, lower the rejected response, and the margin grows.

Suppose the current sequence log-probabilities are:

- Chosen A: policy $-8.2$, reference $-8.5$
- Rejected B: policy $-9.5$, reference $-9.1$
- $\beta = 0.1$

Then:

1. Chosen relative advantage: $-8.2 - (-8.5) = +0.3$
2. Rejected relative advantage: $-9.5 - (-9.1) = -0.4$
3. Margin: $0.3 - (-0.4) = +0.7$
4. Scaled <span data-glossary="logits">logit</span>: $0.1 \times 0.7 = 0.07$
5. $\sigma(0.07) \approx 0.517$
6. Loss: $-\log(0.517) \approx 0.659$

The loss rewards growing that $0.7$ margin. Its weight depends on the pair's reference-relative ordering, not on a single global distance between models. Shared model parameters couple the chosen and rejected probabilities, so their absolute changes need separate monitoring.

<!-- leetllm: test, output=show, output_title="DPO margin output" -->
```python title="dpo_margin_from_logprobs.py"
from math import exp, log

chosen_policy, chosen_reference = -8.2, -8.5
rejected_policy, rejected_reference = -9.5, -9.1
beta = 0.1
margin = (chosen_policy - chosen_reference) - (rejected_policy - rejected_reference)
logit = beta * margin
loss = -log(1 / (1 + exp(-logit)))

print(f"relative_margin={margin:.1f}")
print(f"scaled_logit={logit:.2f}")
print(f"dpo_loss={loss:.3f}")
```

<!-- leetllm: output:start -->
```text title="DPO margin output" output compact
relative_margin=0.7
scaled_logit=0.07
dpo_loss=0.659
```
<!-- leetllm: output:end -->

Those $-8.2$ figures are already summed **response** log-probabilities. For response tokens $y_1,\ldots,y_T$, compute $\log\pi(y|x)=\sum_t\log\pi(y_t|x,y_{<t})$. Teacher forcing supplies each observed prefix; it doesn't sample new text. The log-<span data-glossary="softmax">softmax</span> must include the whole vocabulary even though we gather only the observed token.

The minimal batch below makes the causal shift and masks explicit. Token IDs `0, 2` form the prompt, the next two IDs form the response, and `4` is end-of-sequence. A final `0` is padding; another `0` is real response content on the rejected branch, so masking by token ID alone fails. Logit row `t-1` predicts input token `t`.

<!-- leetllm: test, output=show, output_title="DPO token logprob output" -->
```python title="dpo_loss_from_token_logits.py"
import math

CHOSEN_IDS = [0, 2, 1, 2, 4, 0]
REJECTED_IDS = [0, 2, 3, 0, 4, 0]
ATTENTION_MASK = [1, 1, 1, 1, 1, 0]
PROMPT_LENGTH = 2
BETA = 0.1

chosen_policy = [
    [0.0] * 5,  # predicts a prompt token: excluded from the loss
    [0.0, 2.4, 0.1, -0.8, -1.0],
    [0.0, 0.2, 2.1, -0.6, -1.0],
    [0.0, 0.0, 0.0, 0.0, 2.0],  # predicts EOS: included
    [0.0] * 5,  # predicts padding: excluded
    [0.0] * 5,
]
chosen_ref = [
    [0.0] * 5,
    [0.0, 0.8, 0.2, 0.0, -1.0],
    [0.0, 0.1, 0.9, 0.0, -1.0],
    [0.0, 0.0, 0.0, 0.0, 2.0],
    [0.0] * 5,
    [0.0] * 5,
]
rejected_policy = [
    [0.0] * 5,
    [0.2, -0.4, -0.2, 1.1, -1.0],
    [1.0, -0.3, -0.4, 0.2, -1.0],
    [0.0, 0.0, 0.0, 0.0, 2.0],
    [0.0] * 5,
    [0.0] * 5,
]
rejected_ref = [
    [0.0] * 5,
    [0.1, 0.0, 0.0, 0.6, -1.0],
    [0.7, 0.0, 0.0, 0.2, -1.0],
    [0.0, 0.0, 0.0, 0.0, 2.0],
    [0.0] * 5,
    [0.0] * 5,
]


def log_softmax(logits: list[float]) -> list[float]:
    peak = max(logits)
    log_normalizer = peak + math.log(sum(math.exp(value - peak) for value in logits))
    return [value - log_normalizer for value in logits]


def sequence_logprob(steps: list[list[float]], token_ids: list[int]) -> float:
    if len(steps) != len(token_ids) or len(token_ids) != len(ATTENTION_MASK):
        raise ValueError("logits, tokens, and mask must have matching lengths")
    return sum(log_softmax(steps[t - 1])[token_ids[t]]
               for t in range(PROMPT_LENGTH, len(token_ids)) if ATTENTION_MASK[t])


def dpo_loss(
    chosen_pi: list[list[float]],
    rejected_pi: list[list[float]],
) -> float:
    margin = (
        sequence_logprob(chosen_pi, CHOSEN_IDS)
        - sequence_logprob(chosen_ref, CHOSEN_IDS)
        - (
            sequence_logprob(rejected_pi, REJECTED_IDS)
            - sequence_logprob(rejected_ref, REJECTED_IDS)
        )
    )
    logit = BETA * margin
    return max(0.0, -logit) + math.log1p(math.exp(-abs(logit)))


loss = dpo_loss(chosen_policy, rejected_policy)
boosted_chosen = [row[:] for row in chosen_policy]
boosted_chosen[1][1] += 1.0
boosted_chosen[2][2] += 1.0
boosted_loss = dpo_loss(boosted_chosen, rejected_policy)
masked_changes = [row[:] for row in chosen_policy]
masked_changes[0][2] = 1000.0
masked_changes[4][0] = 1000.0

print(f"chosen_logp={sequence_logprob(chosen_policy, CHOSEN_IDS):.3f}")
print(f"rejected_logp={sequence_logprob(rejected_policy, REJECTED_IDS):.3f}")
print(f"dpo_loss={loss:.3f}")
print(f"after_boost_loss={boosted_loss:.3f}")
assert math.isfinite(loss) and boosted_loss < loss
assert sequence_logprob(masked_changes, CHOSEN_IDS) == sequence_logprob(chosen_policy, CHOSEN_IDS)
assert math.isfinite(log_softmax([1000.0, -1000.0])[1])
print("prompt and padding predictions excluded:", True)
```

<!-- leetllm: output:start -->
```text title="DPO token logprob output" output compact
chosen_logp=-0.993
rejected_logp=-1.882
dpo_loss=0.662
after_boost_loss=0.646
prompt and padding predictions excluded: True
```
<!-- leetllm: output:end -->

At initialization, identical policy and reference probabilities give a DPO logit of zero and loss $\log 2\approx0.693$. Token logits themselves need not be zero. Dropout, mismatched tokenization, or different masks can break the identity before the first update. Keep the reference frozen, compute its scores without gradients, and use the same tokenizer, chat template, completion spans, and EOS convention on both branches.

Whole-response sums can create length effects when chosen and rejected answers differ systematically. Dividing by token count changes the objective; it is not a harmless numerical optimization. To see why, compare two completions whose counted lengths include the end token:

| Completion | Counted tokens | Policy log-probability | Reference log-probability | Summed log-ratio | Average log-ratio |
|:---|:---|:---|:---|:---|:---|
| Chosen A | 4 | $-3.60$ | $-4.00$ | $+0.40$ | $+0.10$ |
| Rejected B | 2 | $-1.70$ | $-2.00$ | $+0.30$ | $+0.15$ |

Standard DPO sees margin $0.40-0.30=+0.10$. Averaging each completion first gives $0.10-0.15=-0.05$, reversing the implicit preference ordering. Averaging the final loss across dataset rows is a separate operation and doesn't change each row's sequence score. Track completion lengths and verify truncation hasn't removed the behavior that explains the label.[^rafailov2023][^huggingface2026dpoSource]

### A larger DPO margin can coexist with lower chosen probability

Look closely at the DPO gradient direction: it optimizes the *difference* between chosen and rejected log-probability changes, not their absolute values. That leads directly to a deceptive failure mode. Did the policy make the chosen answer more likely, or did it merely crush the rejected answer?

Coupled parameters and the model's embedding geometry can make rejected-answer suppression reduce chosen-answer probability too. If rejected log-probability drops by $1.7$ and chosen by $0.9$, the margin grows by $0.8$ despite both completions losing probability. Whether chosen probability falls below the SFT reference depends on where it started.

Pal et al. proposed DPO-Positive (DPOP), adding a penalty when chosen likelihood falls below the reference.[^pal2024smaug] Razin et al. analyzed **likelihood displacement** and showed that it can move mass to either acceptable alternatives or worse responses, including unsafe compliance in their experiments.[^dpoLikelihoodDisplacement2024] The pair's margin alone doesn't reveal which happened; repetitive text or hallucinations aren't automatic consequences of the arithmetic.

Keep the softmax pair's frozen reference at $-8.5$ (chosen) and $-9.1$ (rejected). In a before/after snapshot, chosen log-probability falls from $-8.2$ to $-9.1$ while rejected falls from $-9.5$ to $-11.2$. The relative margin grows from $0.7$ to $1.5$ even though both labeled completions lose probability. Mass moves to other responses, whose quality the pair does not reveal. Plotting $\log(\pi/\pi_{\text{ref}})$ exposes the change: chosen starts at $+0.3$ and finishes at $-0.6$.

<figure>
  <img src="illustrations/_generated/likelihood_displacement_dark.png" alt="Four policy states share one log-probability-ratio axis. The chosen response moves from 0 to 0.30, −0.15, and −0.60; the rejected response moves from 0 to −0.40, −1.20, and −2.10. Their pairwise margin grows from 0 to 0.70, 1.05, and 1.50 even as the chosen response falls below its reference likelihood." />
  <figcaption>The chosen log-ratio falls below the reference while the pair margin grows across four example policy states.</figcaption>
</figure>

<!-- leetllm: test, output=show, output_title="Displacement margin output" -->
```python title="dpo_likelihood_displacement.py"
ref_w, ref_l = -8.5, -9.1
steps = [
    ("before", -8.2, -9.5),
    ("after", -9.1, -11.2),
]

for name, pi_w, pi_l in steps:
    margin = (pi_w - ref_w) - (pi_l - ref_l)
    print(f"{name}: chosen={pi_w:.1f} rejected={pi_l:.1f} margin={margin:.1f}")
```

<!-- leetllm: output:start -->
```text title="Displacement margin output" output compact
before: chosen=-8.2 rejected=-9.5 margin=0.7
after: chosen=-9.1 rejected=-11.2 margin=1.5
```
<!-- leetllm: output:end -->

Monitor at least four series:

| Signal | What it catches |
|--------|-----------------|
| $\log \pi_\theta(y_w \mid x)$ | Whether preferred answers stay likely |
| $\log \pi_\theta(y_l \mid x)$ | Whether rejected answers are suppressed |
| Relative margin $m$ and logit $\beta m$ | Whether pairwise ranking is improving |
| On-policy KL estimate plus labeled-pair log-ratios | Distribution drift versus movement on these particular rows |

If margins improve while chosen log-prob collapses, inspect data, $\beta$, length effects, and held-out generations before extending the run. A decrease in one exact answer's probability can reflect probability mass shifting to other good answers. Compare length-matched slices. Evaluate a length-aware objective such as SimPO on held-out generations to see whether it addresses the length effects.[^meng2024]

Vanilla DPO needs policy and reference scores, not a separate reward or value model and not fresh rollouts during optimization. A frozen reference's scores can be precomputed for fixed token sequences, so two logical roles don't require two resident GPU models. TRL 1.17.1, rechecked November 4, 2026, exposes `precompute_ref_log_probs` and rejects combining it with `sync_ref_model=True`. Its IPO loss also uses **per-completion average** reference-relative scores, whereas standard sigmoid DPO sums token log-probabilities. Check the exact loss and token masks before comparing margins or reusing caches.[^trlDpoTrainer2026][^trl2026DpoTrainerV117]

A reference cache belongs to an exact scoring recipe: reference weights, tokenizer and template, token IDs, completion masks, truncation, and sum/mean convention. Recompute affected scores when any of those change. Validate a cache against the full scoring recipe, not only the dataset row's text.

To connect that arithmetic to the library, prepare two map-style Hugging Face datasets, `train_pairs` and `eval_pairs`, with `prompt`, `chosen`, and `rejected` fields. For conversational rows, use role/content messages and the SFT tokenizer's chat template. Set `sft_checkpoint` to a **full model** checkpoint directory, rather than an adapter-only artifact. This source-checked TRL 1.13.0 fragment is a starting configuration; it hasn't been run as transformer training here:

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
        max_steps=10,
    ),
    train_dataset=train_pairs,
    eval_dataset=eval_pairs,
)
trainer.train()
pair_metrics = trainer.evaluate()
trainer.save_model("artifacts/softmax-dpo")
tokenizer.save_pretrained("artifacts/softmax-dpo")
```

Ten updates are a wiring exercise, not a quality target. Choose precision and batch settings for the model and device. Count rows before and after preparation, and inspect collated pairs before training. As of TRL 1.17, the default `keep_start` truncation cuts each sequence at `max_length`, which can erase the chosen/rejected distinction, and the trainer drops any row whose prompt alone fills `max_length` before collation, without an error. On a path that skips that step, such as a custom collator, require at least one scored next-token target per branch after the causal shift, and check that the label-defining difference survives. A nonempty input tensor can still contain zero scored completion targets. The trainer's reference cache is constructed before updates. Evaluate fresh generations separately; `trainer.evaluate()` reports losses and metrics on stored pairs, not a human win rate.[^trl2026DpoTrainerV117][^trl2026DpoConfigV117]

For this full-model setup with precomputation, include every planned pair-evaluation dataset at initialization. Without a separate `ref_model`, the trainer doesn't retain the frozen reference after updates. Passing a new uncached dataset later can raise ``Cannot compute reference log-probs for a dataset passed to `evaluate()` after training has started`` because its reference log-probabilities were not cached.[^huggingface2026dpoSource]

## Comparing RLHF and DPO

The useful contrast is what each method has to keep alive, not a winner-take-all ranking.[^ouyang2022][^rafailov2023] Read the table as a deployment question: which signal must stay live, and which behavior can your stored data never show you?

<figure>
  <img src="illustrations/_generated/rlhf_vs_dpo_dark.png" alt="PPO draws a fresh response from the current actor, scores it with reward, reference, and critic roles, then updates the actor for a later rollout. Vanilla DPO keeps one stored chosen/rejected pair, scores the same responses under the updated policy and a frozen reference cache, computes pairwise loss, and updates the policy to rescore that stored pair. The DPO path does not sample new responses." />
  <figcaption>Follow the return paths: PPO updates the next rollout, while vanilla DPO rescales the same stored pair. Cached reference scores stay fixed.</figcaption>
</figure>

| Feature | RLHF (PPO) | DPO |
|---------|-----------|-----|
| **Reward model** | Train a separate reward model | No separate RM; reward is implicit |
| **Training loop** | On-policy RL with rollouts | Offline pairwise loss on fixed comparisons |
| **Logical roles** | Policy + ref + reward + critic | Policy + reference |
| **Main cost drivers** | Sampling, scoring, and policy/value updates | Forward/backward on stored pairs |
| **Stability** | Sensitive to reward scale, KL, and PPO settings | Fewer loops, still sensitive to data and `beta` |
| **Online exploration** | Yes | Not in vanilla DPO |
| **Data dependence** | Can collect fresh comparisons during training | Limited by current pair coverage unless you refresh |
| **Monitoring** | Reward drift, KL, value loss, rollout quality | Preference loss, chosen log-prob, margin, length |

DPO is a strong candidate baseline for offline pairwise preferences. PPO isn't obsolete. If you need online exploration, fresh model-generated negatives, or a reward that moves as the policy moves, an RL-style loop can reach cases a frozen DPO dataset can't.

## The data both methods inherit

RLHF and DPO consume the same kind of row, then spend it differently. RLHF fits a reward model on the comparisons, then rolls out. DPO trains the policy on the pairs themselves.[^ouyang2022][^rafailov2023] The row is shared; the feedback path is not.

For the strict chosen/rejected loss here, use the same rendered prompt, record which generator produced each completion, and handle ties or disagreement deliberately. Standard DPO treats the selected ordering as a binary observation; repeated opposite votes can represent uncertainty rather than mislabeled data. Group prompts when measuring generalization to unseen prompts. A known-prompt/new-response evaluation asks a different question and still must keep evaluated responses and labels out of training. Samples from another generator aren't automatically invalid, but can miss current-policy failures.

You don't need a huge dump of easy instructions. You need coverage of the distinctions you care about: refusals, tool calls, reasoning steps, style, and numerical stability bugs. Ask what happens when the current policy invents a failure absent from the stored pairs: DPO has no training row for it until you refresh the data, while PPO can expose it only after a fresh rollout reaches its judge. If annotators keep disagreeing, more labels can quantify uncertainty. They won't turn a vague rubric into a training signal.

Here is a precise coverage failure. Restrict the coding assistant to three possible responses on the softmax overflow prompt: A subtracts `max(z)` before `exp(z)`, B casts to `float64` after `exp(z)`, and an unseen C clamps logits to `[-100, 100]` without shifting (which still overflows `float32` and `float16`). Suppose the dataset compares only A against B. Two policies can assign the same A-to-B odds while allocating very different mass to C:

<!-- leetllm: test, output=show, output_title="Unseen response coverage" -->
```python title="dpo_unseen_response_mass.py"
from math import log, log1p, exp

reference = {"A": 1 / 3, "B": 1 / 3, "C": 1 / 3}
policies = [
    {"A": 0.40, "B": 0.10, "C": 0.50},
    {"A": 0.08, "B": 0.02, "C": 0.90},
]
losses = []
for policy in policies:
    assert abs(sum(policy.values()) - 1) < 1e-12
    margin = log(policy["A"] / reference["A"]) - log(policy["B"] / reference["B"])
    logit = 0.1 * margin
    loss = max(0.0, -logit) + log1p(exp(-abs(logit)))
    losses.append(loss)
    print(f"A/B odds={policy['A'] / policy['B']:.1f} DPO loss={loss:.3f} unseen C mass={policy['C']:.0%}")
assert abs(losses[0] - losses[1]) < 1e-12
```

<!-- leetllm: output:start -->
```text title="Unseen response coverage" output compact
A/B odds=4.0 DPO loss=0.626 unseen C mass=50%
A/B odds=4.0 DPO loss=0.626 unseen C mass=90%
```
<!-- leetllm: output:end -->

Both margins are $\log4$, so the observed pair loss is identical even when the unseen clamping bug receives 90% probability. This comparison isolates what the observed objective leaves unidentified. Fresh rollout evaluation can discover C, and new A-versus-C labels can constrain its ranking. An online reward model also needs coverage of that clamping mistake before its score is useful.[^rafailov2023][^azar2023]

<figure>
  <img src="illustrations/_generated/unseen_response_mass_dark.png" alt="A probability simplex contains a uniform reference and two policies. Policy 1 assigns probabilities 0.40, 0.10, and 0.50 to A, B, and unseen C; policy 2 assigns 0.08, 0.02, and 0.90. Both keep A-to-B odds at 4 to 1, so the DPO pair loss remains 0.62623 at beta 0.1 while C mass rises from 50 to 90 percent." />
  <figcaption>Both policies keep the observed A/B odds at 4:1. The pair loss follows that comparison while C’s probability rises from 50% to 90%.</figcaption>
</figure>

## When the proxy lies

That release rehearsal raises a reward-hacking suspicion, not a diagnosis from three numbers. Reward hacking means the policy exploits the scorer instead of improving the intended behavior. Inspect the longer answers and score controlled rewrites: does adding "Verified answer:" raise the reward without fixing the numerical bug? That comparison can expose what the scorer rewards. The reward model is a proxy, so optimizing its score still needs independent checks.

If the scorer overweights length or markdown, policy optimization can amplify those traits without improving answer quality. Rising proxy reward without matching independent preference gains is a warning; controlled comparisons help distinguish a shortcut from useful extra detail.

| Hack | Symptom | Detection |
|:-----|:--------|:----------|
| Length gaming | Answers get steadily longer | Track mean response length |
| Sycophancy | Model agrees with a wrong user | Test with false user claims |
| Format exploitation | Everything wrapped in lists | Compare formatted vs plain scores |
| Confidence mimicry | Sounds sure on hard items | <span data-glossary="calibration">Calibration</span> checks on known-hard questions |

### Verbosity

Annotators sometimes treat length as quality. As a result, a padded `softmax(z)` explanation can beat a concise correct answer, teaching the policy to pad whenever that correlation sits in the data.

- Symptom: mean length climbs while helpfulness plateaus.
- Fix: length-matched preference evals, and explicit concise-versus-padded labels. Length penalties can also punish necessary detail, so validate them.

### The `0.693` trap

If the policy starts equal to its reference, every DPO relative margin is zero and the loss starts at $-\log(0.5)\approx0.693$. That's expected. Let $m$ be the unscaled reference-relative margin and $z=\beta m$. For one pair,

$$
\frac{\partial L}{\partial z}=\sigma(z)-1,\qquad\frac{\partial L}{\partial m}=\beta(\sigma(z)-1).
$$

At zero logit the first derivative is $-0.5$, but at $\beta=0.1$ the second is $-0.05$. The model-parameter gradient is that second factor times $\nabla_\theta\log\pi_\theta(y_w|x)-\nabla_\theta\log\pi_\theta(y_l|x)$. Its size depends on the model too. The loss isn't flat at initialization, but `-0.5` isn't the gradient of every parameter.[^rafailov2023]

Initial loss alone says little about pair strength. Ambiguous pairs still hurt. Conflicting labels on the same prompt can cancel in aggregate or teach arbitrary style. Diagnose with agreement, slices, and held-out behavior.

<!-- leetllm: test, output=show, output_title="DPO zero-margin output" -->
```python title="dpo_zero_margin_is_not_zero_gradient.py"
from math import exp, log1p

def sigmoid(value: float) -> float:
    return 1 / (1 + exp(-value))

def loss_at_margin(margin: float, beta: float) -> float:
    logit = beta * margin
    return max(0.0, -logit) + log1p(exp(-abs(logit)))

beta = 0.1
for margin in [0.0, 20.0]:
    logit = beta * margin
    d_logit = sigmoid(logit) - 1
    d_margin = beta * d_logit
    h = 1e-5
    finite_difference = (loss_at_margin(margin + h, beta) - loss_at_margin(margin - h, beta)) / (2 * h)
    assert abs(finite_difference - d_margin) < 1e-9
    print(f"logit={logit:.1f} loss={loss_at_margin(margin, beta):.3f} dL/dz={d_logit:.3f} dL/dm={d_margin:.3f}")

# A two-response softmax policy with logits [theta, 0] and uniform reference.
# Its reference-relative log-odds margin is exactly theta.
theta = 0.0
for _ in range(20):
    theta -= beta * (sigmoid(beta * theta) - 1)  # learning rate 1
print(f"scalar P(chosen)={sigmoid(theta):.3f} loss={loss_at_margin(theta, beta):.3f}")
assert sigmoid(theta) > 0.5 and loss_at_margin(theta, beta) < loss_at_margin(0.0, beta)
```

<!-- leetllm: output:start -->
```text title="DPO zero-margin output" output compact
logit=0.0 loss=0.693 dL/dz=-0.500 dL/dm=-0.050
logit=2.0 loss=0.127 dL/dz=-0.119 dL/dm=-0.012
scalar P(chosen)=0.726 loss=0.646
```
<!-- leetllm: output:end -->

- Symptom: loss stays near $0.693$ after real updates, and held-out preference doesn't move.
- Fix: confirm the policy is updating, then inspect contradictory labels, unresolved ties, prompt <span data-glossary="feature-leakage">leakage</span>, and missing coverage before blaming `beta`.

```checkpoint
A fresh DPO run starts at loss `0.693`, with derivative `-0.5` with respect to its logit. Does that prove the pair is ambiguous or uninformative?
---
No. Matching policy and reference probabilities give zero relative margin, so `0.693` is expected. The derivative with respect to the unscaled margin is `-beta/2`; parameter gradients also depend on the network. If training stays there, first verify updates and gradients, then inspect labels and held-out behavior.
```

### A release gate that actually uses humans

The scalar example took real gradient steps, yet it did not train a full language model. Full-model validation must also exercise tokenization, reference freezing, optimizer state, precision, memory, and held-out generation; GPU throughput and PPO rollout stability require measurements on the target run rather than scalar CPU checks.

Release asks another question: did behavior improve within the tested drift budget? Tie proxy improvement to behavior you care about:

1. Hold out human evaluation, blind response order, and specify the rubric and decision rule before looking at results.
2. Track auxiliaries: length, refusal rate, formatting drift, calibration.
3. Watch KL and stop when you leave the tested drift budget.
4. Refresh the scorer when current outputs leave its training distribution.

Return to the 184 wins in 400 comparisons from the introduction. Assume independent held-out prompts, one judgment per prompt, no ties, and one planned evaluation. A 95% Wilson interval for the candidate's win probability accounts for sampling uncertainty.[^nistBinomialIntervals2026] Repeated checkpoints, shared users, or ties require a matching analysis rather than pretending every judgment is an independent Bernoulli trial.

For this release gate, require the interval's lower bound to exceed 50% and mean length growth to stay below 20 tokens. That 20-token threshold is a chosen product limit rather than a universal alignment constant, and even before running the calculation it is clear that higher proxy reward will not clear promotion:

<!-- leetllm: test, output=show, output_title="Alignment release gate output" -->
```python title="alignment_release_gate.py"
from math import sqrt

def wilson_interval(wins: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total <= 0 or not 0 <= wins <= total:
        raise ValueError("need positive total and 0 <= wins <= total")
    p = wins / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    radius = z * sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator
    return center - radius, center + radius

wins, total = 184, 400
lower, upper = wilson_interval(wins, total)
proxy_reward_delta = 0.31
mean_length_delta_tokens = 48
ready = lower > 0.50 and mean_length_delta_tokens < 20

print(f"proxy_improved={proxy_reward_delta > 0}")
print(f"candidate_win_rate={wins / total:.1%}")
print(f"95% Wilson interval=[{lower:.1%}, {upper:.1%}]")
print(f"evidence_of_improvement={lower > 0.50}")
print(f"release_ready={ready}")
```

<!-- leetllm: output:start -->
```text title="Alignment release gate output" output compact
proxy_improved=True
candidate_win_rate=46.0%
95% Wilson interval=[41.2%, 50.9%]
evidence_of_improvement=False
release_ready=False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/alignment_failure_guardrails_dark.png" alt="A release example records 184 wins in 400 blinded comparisons, a 46.0 percent rate with a 95 percent Wilson interval from 41.2 to 50.9 percent that crosses the 50 percent baseline. Proxy reward rises by 0.31, while mean response length grows 48 tokens against a 20-token limit. The lower-confidence win gate and length gate both fail, so promotion is held; the interval shows neither improvement nor degradation." />
  <figcaption>The Wilson interval crosses 50%, and the mean-length limit also fails. Hold promotion while the evidence shows neither a gain nor a clear drop.</figcaption>
</figure>

Other failure signatures worth the same stop rule:

- DPO loss stays near $0.693$ after confirmed updates: audit labels, ties, leakage, and coverage rather than treating init loss as a diagnosis.
- DPO improves tone while still recommending post-exp casting: inspect whether labels cover numerical overflow distinctions, then check the deployed prompt/template and fresh generations. Add missing bug-fix contrasts when the data audit isolates them.
- PPO generations get repetitive while reward rises: freeze promotion, inspect reward scale and KL, then refresh evaluation together.

## Online DPO and iterative alignment

Vanilla DPO is **offline**: it trains on a fixed set of chosen and rejected responses.[^rafailov2023] Ask what happens when the policy improves past those rows: old comparisons describe a model you no longer have, so they may no longer contain hard negatives.

Later work studies the online setting: sample fresh responses from the current policy, label them with humans or a preference model, then apply an IPO-style or related pairwise update on the new comparisons.[^calandriello2024]

The loop is:

1. Sample two or more candidates from the current policy.
2. Ask humans or a preference model which is better.
3. Store a new `(prompt, chosen, rejected)` triple.
4. Run a DPO-style update with whatever reference-policy rule the method uses.
5. Repeat so the data follows the model.

There isn't one canonical "online DPO" algorithm, and sampling/reference rules differ. Calandriello et al. study current-policy online IPO and IPO-MD, which samples from a mixture with the reference, alongside online DPO variants.[^calandriello2024] Refreshing samples can reduce mismatch and expose harder negatives without a critic. A stale or biased judge can still mislabel the new rows.

## Compare related methods by training signal and system cost

These methods consume different feedback signals. Start with the signal you can reliably collect: a chosen/rejected pair, an unpaired binary label, or an automated task verifier.

| Method | Objective & Mechanism | Key Systems Trade-Off |
|:---|:---|:---|
| **IPO** (Identity Preference Optimization) | Derived from identity-transformed preferences. Squared loss targets reference-relative margin $1/(2\tau)$ for regularization parameter $\tau>0$.[^azar2023] | Penalizes overshooting that finite target; no universal stability or safety guarantee. |
| **KTO** (Kahneman-Tversky Optimization) | Uses individual desirable/undesirable labels, with opposite sigmoid directions around a reference point.[^ethayarajh2024] | No paired alternatives required; feedback semantics, selection bias, and class weighting still need review. |
| **ORPO** (Odds Ratio Preference Optimization) | Combines SFT cross-entropy with an odds-ratio preference penalty into a single training stage, dropping the reference model entirely.[^hong2024] | Saves reference model memory, but couples instruction-following and preference updates. |
| **SimPO** (Simple Preference Optimization) | Uses scaled average token log-probability as reward, with a target preference margin and no reference.[^meng2024] | Changes length dependence; evaluate concision and correctness on target prompts. |
| **GRPO** (Group Relative Policy Optimization) | Online group-relative RL without a learned critic. Outcome supervision centers/scales each completion's reward within its prompt group.[^shao2024][^deepseekai2025] | Removes critic state and updates; actual memory savings depend on role sizes and the execution layout. |

Three short calculations show how these supervision signals alter the update.

### IPO targets a finite margin

Let $m=\log(\pi_\theta(y_w|x)/\pi_{\mathrm{ref}}(y_w|x))-\log(\pi_\theta(y_l|x)/\pi_{\mathrm{ref}}(y_l|x))$. Vanilla DPO's loss $-\log\sigma(\beta m)$ keeps decreasing as $m$ grows. On separable comparisons it can favor ever larger margins. That can concentrate the policy on a narrow set of answers; it does **not** imply that forward KL must diverge.

IPO instead derives an identity-preference objective whose sampled squared loss is:[^azar2023]

$$
\mathcal L_{\mathrm{IPO}}=\mathbb E_{\mathcal D}
\left[\left(m-\frac{1}{2\tau}\right)^2\right],\qquad \tau>0.
$$

The target is $1/(2\tau)$, not $\tau/2$. At $\tau=0.1$, it is 5. The derivative $2(m-5)$ favors increasing a smaller margin and decreasing an overshoot. It doesn't clip margins, bound all model parameters, or guarantee stable neural-network optimization. TRL's `beta` represents $\tau$ for its IPO loss, with the averaging convention described above.[^huggingface2026dpoSource]

Compare both losses on a complete two-response policy. With logits $[\theta,0]$ and a uniform reference, $m=\theta$. Forward KL is at most $\log 2$, even as the margin tends to infinity.

<!-- leetllm: test, output=show, output_title="Finite margin output" -->
```python title="dpo_ipo_margin_and_kl.py"
from math import exp, log, log1p

beta = tau = 0.1
target = 1 / (2 * tau)
print(f"IPO target={target:.1f}")
for margin in [0.0, 5.0, 10.0]:
    p = 1 / (1 + exp(-margin))
    kl = p * log(2 * p) + (1 - p) * log(2 * (1 - p))
    dpo = log1p(exp(-beta * margin))
    ipo = (margin - target) ** 2
    print(f"m={margin:.0f}: DPO={dpo:.3f} IPO={ipo:.1f} KL={kl:.3f}")
    assert -1e-12 <= kl <= log(2) + 1e-12
assert (10 - target) ** 2 > (5 - target) ** 2
```

<!-- leetllm: output:start -->
```text title="Finite margin output" output compact
IPO target=5.0
m=0: DPO=0.693 IPO=25.0 KL=0.000
m=5: DPO=0.474 IPO=0.0 KL=0.653
m=10: DPO=0.313 IPO=25.0 KL=0.693
```
<!-- leetllm: output:end -->

```checkpoint
The margin can grow without bound, but this policy's KL cannot exceed log(2). Can the rejected answer still effectively disappear?
---
Yes. Its probability tends to zero as the chosen probability tends to one. Mode concentration doesn't require infinite forward KL. IPO discourages margins past its target; held-out behavior still determines whether that target is useful.
```

### KTO: prospect theory on unpaired telemetry

An application may collect one answer and a thumbs-up/down label, without another answer to the same prompt. KTO consumes desirable/undesirable labels directly. These labels must have defined semantics: a click can reflect user satisfaction, formatting, or bias rather than factual correctness.

KTO uses a prospect-theory-inspired value function as a modeling choice for human feedback. Define $r_\theta(x,y)=\log(\pi_\theta(y|x)/\pi_{\mathrm{ref}}(y|x))$ and a detached reference point $z_0$. Its loss contribution has **opposite directions** for the two labels:[^ethayarajh2024]

$$
\ell_{\mathrm{KTO}}=
\begin{cases}
\lambda_D[1-\sigma(\beta(r_\theta-z_0))], & \text{desirable}, \\
\lambda_U[1-\sigma(\beta(z_0-r_\theta))], & \text{undesirable}.
\end{cases}
$$

The paper defines $z_0$ using policy/reference KL and implements a biased, non-negative batch estimate from mismatched prompt/response rows. It doesn't backpropagate through that estimate. Both class weights default to 1 in the paper; class balance can justify raising either weight. A larger undesirable weight isn't part of the required definition.

Hold the reference point fixed. If increasing an undesirable answer's log-ratio lowers your implemented loss, you've lost the negative-label branch.

<!-- leetllm: test, output=show, output_title="KTO label directions" -->
```python title="kto_desirable_vs_undesirable.py"
from math import exp


def kto_loss(log_ratio: float, desirable: bool) -> float:
    beta, reference_point = 0.5, 0.2
    direction = 1 if desirable else -1
    logit = direction * beta * (log_ratio - reference_point)
    return 1 - 1 / (1 + exp(-logit))  # both class weights = 1


for label, desirable in [("desirable", True), ("undesirable", False)]:
    before = kto_loss(1.0, desirable)
    after = kto_loss(2.0, desirable)
    print(f"{label}: loss {before:.3f} -> {after:.3f}")
    assert (after < before) == desirable
```

<!-- leetllm: output:start -->
```text title="KTO label directions" output compact
desirable: loss 0.401 -> 0.289
undesirable: loss 0.599 -> 0.711
```
<!-- leetllm: output:end -->

This snippet isolates the scalar loss. Audit telemetry selection and label quality, then evaluate model behavior before interpreting a falling KTO loss as an improvement.

### GRPO: group-relative advantage without a critic

The PPO recipe above learns a critic for GAE. The clipped surrogate itself can use other advantage estimators; it doesn't mathematically require a separate 70B value backbone. GRPO, introduced in DeepSeekMath and used in DeepSeek-R1, replaces the learned critic with group statistics.[^shao2024][^deepseekai2025] For outcome supervision on prompt $x$:

1. The policy samples a group of $G$ candidate completions: $\{y_1, y_2, \dots, y_G\} \sim \pi_{\text{old}}(\cdot \mid x)$.
2. A verifier or reward model produces scalar scores $\{r_1,\dots,r_G\}$. Run tests to check selected behaviors after compilation.
3. The original outcome formulation centers and scales scores within the prompt group:

$$
\hat{A}_i = \frac{r_i - \operatorname{mean}\left(\{r_1, \dots, r_G\}\right)}{\operatorname{std}\left(\{r_1, \dots, r_G\}\right) + \epsilon}
$$

4. Assign that outcome advantage to the generated tokens of completion $i$, then use token ratios $\rho_{i,t}=\pi_\theta(y_{i,t}|s_{i,t})/\pi_{\mathrm{old}}(y_{i,t}|s_{i,t})$. A sampled-batch loss for the original token-averaged formulation is:

$$
\mathcal L_{\mathrm{GRPO}}=
-\frac{1}{G}\sum_{i=1}^G\frac{1}{T_i}\sum_{t=1}^{T_i}
\left[\min\left(\rho_{i,t}\hat A_i,
\operatorname{clip}(\rho_{i,t},1-\epsilon,1+\epsilon)\hat A_i\right)
-\beta k_{i,t}\right].
$$

Here $T_i$ counts generated tokens. DeepSeekMath uses the non-negative sample term $k_{i,t}=\exp(\ell_{i,t})-\ell_{i,t}-1$, with $\ell_{i,t}=\log(\pi_{\mathrm{ref}}/\pi_\theta)$ at that observed token. Its expectation estimates conditional forward KL when the token is sampled from the scored current policy; old-policy samples during repeated updates need the corresponding correction. KL is added to the loss, not mixed into these group reward advantages.[^shao2024]

Replacing token ratios with the product across the entire response changes clipping. Even two ratios of 1.1 multiply to 1.21 and trigger a sequence clip when neither token is clipped.

<!-- leetllm: test, output=show, output_title="Token versus sequence clipping" -->
```python title="grpo_token_ratio_is_not_sequence_ratio.py"
from math import prod

ratios = [1.1, 1.1]
epsilon, advantage = 0.2, 1.0


def clipped_surrogate(ratio: float) -> float:
    clipped = min(max(ratio, 1 - epsilon), 1 + epsilon)
    return min(ratio * advantage, clipped * advantage)


token_average = sum(clipped_surrogate(ratio) for ratio in ratios) / len(ratios)
sequence_value = clipped_surrogate(prod(ratios))
print(f"token-average surrogate={token_average:.3f}")
print(f"whole-response surrogate={sequence_value:.3f}")
assert abs(token_average - 1.1) < 1e-12
assert abs(sequence_value - 1.2) < 1e-12
```

<!-- leetllm: output:start -->
```text title="Token versus sequence clipping" output compact
token-average surrogate=1.100
whole-response surrogate=1.200
```
<!-- leetllm: output:end -->

This calculation concerns DeepSeekMath's token-ratio formulation. The R1 report presents response-level notation, and current trainers also offer other importance ratios and normalizers; identify the equation and implementation you're using.[^deepseekai2025][^huggingface2026grpoSource]

GRPO removes critic state, computation, and value-fitting error. It still needs rollouts, a useful scoring signal, and stable policy updates. The earlier equal-backbone state example saves 44.4% by removing its critic; that isn't a measured peak-VRAM reduction for another recipe.

There is one edge case worth predicting before inspecting the code: if every response in a group earns the exact same reward, the standard deviation is zero, and every relative advantage collapses to zero.

<!-- leetllm: test, output=show, output_title="Group-relative advantage output" -->
```python title="grpo_group_relative_advantage.py"
from statistics import mean, pstdev

def group_advantages(rewards: list[float]) -> tuple[float, float, list[float]]:
    center = mean(rewards)
    scale = pstdev(rewards)
    if scale == 0:
        return center, scale, [0.0 for _ in rewards]
    return center, scale, [(reward - center) / scale for reward in rewards]


reward_groups = {
    "mixed": [1.0, 0.0, 0.5, 1.0],
    "all_equal": [1.0, 1.0, 1.0, 1.0],
}

for name, rewards in reward_groups.items():
    center, scale, advantages = group_advantages(rewards)
    print(
        f"{name}: mean={center:.3f} std={scale:.3f} "
        f"advantages={[round(value, 3) for value in advantages]}"
    )
```

<!-- leetllm: output:start -->
```text title="Group-relative advantage output" output compact
mixed: mean=0.625 std=0.415 advantages=[0.905, -1.508, -0.302, 0.905]
all_equal: mean=1.000 std=0.000 advantages=[0.0, 0.0, 0.0, 0.0]
```
<!-- leetllm: output:end -->

The helper uses population standard deviation for transparent arithmetic; trainer conventions and reward-scaling options can differ. If every sampled answer gets the same reward, the centered reward advantages are zero. That removes this group's **reward-driven** update, not necessarily every gradient: an enabled KL penalty or another auxiliary loss can still contribute.

<figure>
  <img src="illustrations/_generated/grpo_group_advantages_dark.png" alt="Four completion rewards [1, 0, 0.5, 1] have population mean 0.625 and standard deviation about 0.4146. Subtracting the mean and dividing by the standard deviation yields advantages about [0.90, −1.51, −0.30, 0.90]. A flat group [1, 1, 1, 1] has zero standard deviation and the implementation assigns all four advantages zero. A KL term remains separate." />
  <figcaption>The mixed group centers and scales each completion score. With identical scores, this helper returns zero reward advantages; KL remains a separate loss term.</figcaption>
</figure>

TRL 1.13.0 logs `frac_reward_zero_std` from its near-zero standard-deviation check. Under group scaling, a high value can mean all samples pass, all fail, or the scorer can't distinguish them. Under batch scaling, that diagnostic follows the batch scale instead. Inspect the configuration and tasks. This release also offers different token-loss normalizers, and defaults to `beta=0.0`, so it doesn't load a reference model for KL by default. These choices differ from the original formulation above.[^huggingface2026grpotrainer][^huggingface2026grpoSource]

## What comes after pairwise human labels

Human comparisons don't scale to every new failure. Constitutional AI uses written principles for model critique and revision, supervised learning on revised answers, and AI preference labels for harmlessness. Its RL stage fits a preference model using those AI labels alongside human helpfulness labels, then uses that scorer as reward. This is one form of <span data-glossary="rlaif">RLAIF</span> (Reinforcement Learning from AI Feedback). RLAIF more broadly doesn't require constitutional critique and revision.[^bai2022] Writing the rules down still doesn't show whether they hold once someone tries to break them.

The dependence doesn't go away. A constitution is only as good as the judge that applies it. Held-out humans still decide whether numerical accuracy and safety rules survived contact with real users.

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
    "question": "A evaluator provides valid 95% win-probability intervals for two predeclared candidates under one planned evaluation design. Candidate A has [0.54,0.63] and mean length growth 23 tokens; B has [0.49,0.58] and growth 12. The release gates require lower bound>0.50 and growth<20. Which gate outcomes and eligibility follow?",
    "options": [
      "A: win PASS, length PASS; B: win FAIL, length PASS. Eligible: A.",
      "A: win PASS, length FAIL; B: win PASS, length PASS. Eligible: B.",
      "A: win PASS, length FAIL; B: win FAIL, length PASS. Eligible: neither.",
      "A: win PASS, length PASS; B: win PASS, length PASS. Eligible: both."
    ],
    "answer": "A: win PASS, length FAIL; B: win FAIL, length PASS. Eligible: neither.",
    "explanation": "A clears the win lower-bound gate because .54>.50, but 23 is not below 20. B meets the length gate with 12, but its lower bound .49 does not exceed .50. Each candidate fails a different required gate; one passing property cannot compensate for another failed requirement. Both intervals follow the predeclared comparison design."
  }
]
```

> **Next:** Continue to [Constitutional AI & Red Teaming](/learn/constitutional-ai-automated-red-teaming). RLHF and DPO steer a policy with preference comparisons, human or otherwise. The next chapter writes those rules as a constitution, uses AI critique and ranking to scale the labels, then red-teams the result to see which safeguards actually hold.

<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

A release candidate raises its internal reward-model score by 0.31, and the team is pleased. Then you run 400 blinded comparisons against the old assistant, and reviewers prefer the new one only 184 times. Its answers are 48 tokens longer on average, and many now begin with the words "Verified answer:". Would you ship it?

The training signal improved while the held-out comparison failed to confirm any real behavioral gain. That gap is the subject of this chapter, and it is why it matters so much how you turn preferences into model changes. After instruction tuning, a model can follow the shape of a request and still introduce subtle numerical bugs, refuse reasonable requests, or pad a correct answer until it is useless. Next-token prediction does not guarantee helpful or safe choices on its own. InstructGPT named the problem plainly: a model trained to predict plausible text can still be unhelpful, untruthful, or unsafe, in fluent prose.[^ouyang2022]

Preference methods push a model toward answers a labeling policy prefers. There are two main ways to do it. The older one trains a reward model and then a policy against it, in a live reinforcement learning loop. The newer one skips the reward model and trains on stored pairs directly. They are more closely related than they look, and they fail in different ways. By the end of this chapter you should be able to pick one, monitor it, and decide whether to ship that candidate.

## Two ways to spend a comparison

Keep the example from the last chapter, and give it a concrete coding prompt: a developer asks how to prevent exponential overflow when implementing `softmax(z)` in Python. Answer A subtracts `max(z)` from every logit before calling `exp(z)`. Answer B casts the array to `float64` after calling `exp(z)`. Our reward model scored them 1.8 and 0.7, which implies about a 75% chance that a reviewer prefers A. What now?

**Reinforcement learning from human feedback**, or RLHF, starts from an SFT model, fits a reward model to comparisons, and then improves the policy by generating fresh responses and scoring them, usually with Proximal Policy Optimization (PPO).[^ouyang2022] It builds on earlier human-feedback work on summarization.[^stiennon2020]

**Direct Preference Optimization**, or DPO, trains directly on stored chosen and rejected pairs, using the policy's probabilities relative to a frozen reference.[^rafailov2023]

Both inherit everything from the labeling chapter: the same prompt on both sides, deliberate handling of ties and unacceptable answers, and a split that matches your claim. The difference is what happens to the labels afterward.

<figure>
  <img src="illustrations/_generated/rlhf_vs_dpo_dark.png" alt="Two aligned lanes. In the PPO lane, the actor samples a fresh response, a frozen reward model, a frozen reference, and a trainable critic score it, a clipped advantage updates the actor, and the loop returns with a new rollout. In the DPO lane, a stored chosen and rejected pair is scored by the trainable policy and a frozen reference, a pair loss updates the policy, and the loop returns to the same stored pairs." />
  <figcaption>Look at the return arrows. PPO's next update sees responses the updated policy just wrote. Basic DPO's next update sees the same stored pairs, so it never meets a failure they do not contain.</figcaption>
</figure>

## Reward the answer, charge for drift

From here on you need a little reinforcement learning, so here it is. Instead of copying a target, a **policy** chooses actions and gets scored on what happens. A language model is a policy $\pi_\theta(y\mid x)$, and each next token is an action. One generated response is an **episode**, and sampling one is called a **rollout**. A **reward** scores what happened. The **return** is the reward collected from one step to the end of the episode. A **value** predicts that return, and the **advantage** says how much better the real outcome was than the prediction. Training raises the probability of actions with positive advantage and lowers the others.

If you simply maximized a reward model's score, you would be asking the model to hunt for its flaws. So the standard objective also charges for moving away from a frozen reference, usually the SFT checkpoint. To charge for that, we need a number for how far one probability distribution sits from another, and KL divergence is that number. Sample answers from your policy, and for each one ask how much more likely your policy made it than the reference did, in log terms. The average is the KL divergence. The objective subtracts it, weighted by $\beta$:

$$
\mathcal J=\mathbb E_{x\sim\mathcal D,\,y\sim\pi_\theta(\cdot\mid x)}[r(x,y)]
-\beta\mathbb E_x[D_{\mathrm{KL}}(\pi_\theta(\cdot\mid x)\parallel\pi_{\mathrm{ref}}(\cdot\mid x))].
$$

In symbols, that average is the policy-weighted mean of $\log\pi_\theta-\log\pi_{\mathrm{ref}}$. A single sampled log-ratio can be negative, but the whole average never is. A plain sample mean estimates it only when rollouts really came from that same policy. Sampling with a temperature, top-$k$, or an older snapshot changes the distribution, so correct for that or label the metric accordingly.

Now a worked example. One response has raw reward 1.35 and sampled reference log-ratio 1.6. Another has reward 1.20 and log-ratio 0.10. With $\beta=0.2$, their shaped returns are $1.35-0.2\cdot1.6=1.03$ and $1.20-0.2\cdot0.10=1.18$. The answer the scorer liked more has lost, because it strayed further to get there.

## PPO: four roles and a clip

The PPO recipe coordinates four logical roles. The **actor** generates the response and is the model you are training. The frozen **reward model** scores it. The frozen **reference** supplies baseline token probabilities for the KL charge. The trainable **critic** predicts the return from each prefix, so you can tell whether an outcome beat expectations.

Those are roles, and they need not be four machines' worth of weights. If they were four separate 70-billion-parameter backbones, with 16 bytes per trainable parameter and 2 per frozen one, the state alone would total 2,520 GB, before activations, generation caches, and temporary buffers. In practice the critic can be smaller or share weights, frozen roles can be offloaded, and InstructGPT used a 6-billion-parameter reward model even for its 175-billion-parameter policy.[^ouyang2022] Rollouts add a separate cost that offline methods avoid: generating text token by token. Both colocated engines and asynchronous ones work, and asynchronous overlap brings its own problems of weight synchronization and stale samples, so compare measured utilization and policy lag.[^openrlhf2026framework]

### How does a final score reach early tokens?

The reward model scores a finished response, so its number arrives once, at the end, while the policy made many token decisions along the way. Do not add the score to every token, which would count it repeatedly. Let it flow backward instead.

At token step $t$, the state $s_t$ is the prompt plus the prefix, and the action is the next token. The immediate reward $r_t$ is the KL charge, plus the reward model's score on the final token. Compare what happened with what the critic expected:

$$
\delta_t=r_t+\gamma V(s_{t+1})-V(s_t).
$$

The factor $\gamma$ discounts rewards that arrive later. InstructGPT applied no discount, which means $\gamma=1$, as in our code.[^ouyang2022] Generalized Advantage Estimation accumulates those residuals backward:[^schulman2015gae]

$$
\widehat A_t=\delta_t+\gamma\lambda\widehat A_{t+1}.
$$

Here $\lambda$ sets how far credit travels. High values lean on sampled returns, and low values lean on the critic. For a true terminal state, the next value and next advantage are both zero. If you cut an episode off on purpose, the response has not really ended, so you use the critic's estimate of the remaining return instead of zero. That estimate is called a bootstrap.

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
assert advantages(rewards, values, lam=0.5) == [0.25, 0.5, 1.0]
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

A scalar reward spreads backward through the sequence, but it cannot identify which token earned it. That is a real limit of terminal scoring. The sampled advantage then feeds the update.

### What the clip actually does

PPO compares the changing actor with the snapshot that generated the batch, which is separate from the long-term reference. With ratio $\rho_t=\pi_\theta(a_t\mid s_t)/\pi_{\mathrm{old}}(a_t\mid s_t)$, it maximizes

$$
L_t=\min(\rho_t\widehat A_t,
\operatorname{clip}(\rho_t,1-\epsilon,1+\epsilon)\widehat A_t).
$$

A positive advantage favors raising the sampled token's probability, and a negative one favors lowering it. The clip removes extra incentive once the ratio has moved far enough in the favorable direction.[^schulman2017]

<!-- leetllm: test, id=reader-alignment-ppo-clipping, output=show, output_title="Reader PPO clipping" -->
```python title="reader-alignment-ppo-clipping.py"
def surrogate(ratio, advantage, epsilon=0.2):
    clipped = min(max(ratio, 1 - epsilon), 1 + epsilon)
    return min(ratio * advantage, clipped * advantage)

for advantage in [1.0, -1.0]:
    values = [round(surrogate(ratio, advantage), 2)
              for ratio in [0.5, 1.0, 1.5]]
    print(f"advantage={advantage:+.0f}:", values)
assert surrogate(1.5, 1.0) == 1.2
assert surrogate(0.5, -1.0) == -0.8
```

<!-- leetllm: output:start -->
```text title="Reader PPO clipping" output compact
advantage=+1: [0.5, 1.0, 1.2]
advantage=-1: [-0.8, -1.0, -1.5]
```
<!-- leetllm: output:end -->

Read the rows carefully, because the asymmetry is the point. With a positive advantage, a ratio of 1.5 earns no more than 1.2 would. With a negative advantage, pushing the ratio down past 0.8 stops paying, while raising it to 1.5 keeps hurting. The harmful direction stays penalized. People often describe this as limiting how far the policy can move, and that is not quite right. It removes an incentive in this objective. It does not clamp any actual probability or enforce a hard KL limit.

Here is one complete decision, using the response from earlier and treating the whole response as a single step so the arithmetic fits on one line. A real run does this for every token. With $\epsilon=0.2$, a ratio of 1.20 sits exactly at the clip, so the surrogate is $0.23\times1.20$.

<figure>
  <img src="illustrations/_generated/ppo_four_model_loop_dark.png" alt="A waterfall on one numeric axis. Reward 1.35 falls by a reference charge of 0.32 to a return of 1.03. Subtracting a critic value of 0.80 leaves an advantage of 0.23. A policy ratio of 1.20 gives a clipped surrogate of 0.276. Reward and reference are frozen roles. Critic and actor are trainable." />
  <figcaption>Walk left to right. Each frozen or trainable role changes one number on the shared axis, and only the last value drives the actor's update.</figcaption>
</figure>

Several passes over one batch keep its old log-probabilities and detached advantages. Then collect fresh rollouts. Throughout, watch value error, ratios, reference drift, and independently judged output quality, because each of those can go wrong while the reward keeps climbing.

## DPO: the same objective with the reward model removed

Now a piece of mathematics that is worth following, since it explains why such a different-looking method is related. For a fixed reward and prompt, the reward-minus-KL objective has an exact best distribution:

$$
\pi^*(y\mid x)=\frac{\pi_{\mathrm{ref}}(y\mid x)e^{r(x,y)/\beta}}{Z(x)}.
$$

In words, take the reference and tilt it toward high reward. This assumes positive $\beta$, a finite normalizer, and answers the reference can produce. It describes an optimal distribution, and a finite neural network may never represent or reach it.

The normalizer $Z(x)$ is hopeless to compute, because it sums over all possible text. But rearrange the equation and write the reward in terms of the policy:

$$
r(x,y)=\beta\log\frac{\pi^*(y\mid x)}{\pi_{\mathrm{ref}}(y\mid x)}+\beta\log Z(x).
$$

Now look at what a comparison needs: only the *difference* of two rewards for the same prompt. $Z(x)$ depends on the prompt alone, so it cancels.[^rafailov2023] That is the whole trick. Swap in the trainable policy for $\pi^*$, and the Bradley-Terry loss from the last chapter becomes a loss on the language model itself:

$$
m=\log\frac{\pi_\theta(y_w\mid x)}{\pi_{\mathrm{ref}}(y_w\mid x)}
-\log\frac{\pi_\theta(y_l\mid x)}{\pi_{\mathrm{ref}}(y_l\mid x)},\qquad
\mathcal L_{\mathrm{DPO}}=-\log\sigma(\beta m).
$$

There is no separate reward model and no rollout. The policy's own likelihood ratio serves as the implicit reward. With unlimited data, a model that can represent anything, and a reference that gives every answer some probability, fitting these preferences and optimizing reward minus KL lead to the same policy.[^rafailov2023][^azar2023] That does not mean a finite DPO run lands where a clipped PPO run would. Pair coverage, the preference model, capacity, and optimization all stand in between.

Note also that this is not the SFT loss. The sigmoid predicts which answer wins, while the policy still predicts tokens.

### Work it by hand

Suppose the chosen answer has policy and reference log-probabilities of −8.2 and −8.5, and the rejected answer has −9.5 and −9.1. The changes relative to the reference are +0.3 and −0.4, so the margin is +0.7. At $\beta=0.1$ the logit is 0.07, and the loss is about 0.659.

Those inputs must be whole-response log-probabilities: sum the observed next-token log-probabilities across the response, including the end token, with the causal shift from SFT and masks that exclude prompt and padding. Averaging per token instead changes the objective. Take a four-token chosen response with a summed log-ratio of 0.40 and a two-token rejected response with 0.30. Standard DPO prefers the chosen one, while per-token averages of 0.10 and 0.15 reverse that preference. So state which convention you use before comparing anyone's margins.

### The 0.693 that worries everyone

A fresh run starts with policy equal to reference. Every margin is zero and the loss is $\log 2\approx0.693$, which is expected. It does not mean your pairs are ambiguous or your gradients are flat. The derivative with respect to the unscaled margin is $-\beta/2$, and that is nonzero. If the loss is still near 0.693 after real updates, first confirm that the policy is updating, then inspect contradictory labels, unresolved ties, prompt leakage, and missing coverage.

### What $\beta$ actually does

This one trips people up, because it pulls two ways. For a fixed reward, larger $\beta$ keeps the ideal policy closer to the reference, and it also scales the logit and the initial gradient. Here is a two-answer policy with a uniform reference, where reviewers truly prefer A 75% of the time. These are ideal targets, not training measurements.

| $\beta$ | Initial $\partial L/\partial m$ | Ideal margin | Ideal $\pi(A)$ |
| --- | ---: | ---: | ---: |
| 0.1 | −0.05 | 10.986 | 99.998% |
| 0.5 | −0.25 | 2.197 | 90.0% |
| 1.0 | −0.50 | 1.099 | 75.0% |

A small $\beta$ allows a very sharp preference, and larger values stay closer to the 50% reference. Empirical DPO has no hard KL constraint, so learning rate, updates, and saturation also shape the real drift.

### Margins can grow while your answer gets less likely

DPO optimizes a *difference*, and that has a sting. The margin can grow because the rejected answer fell faster than the chosen one, with both falling.

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

The loss improved, and the chosen response became *less* likely than it was under the reference. That probability went somewhere. Razin and colleagues call this likelihood displacement, and they showed it can move mass to acceptable alternatives or to worse responses, including unsafe compliance in their experiments.[^dpoLikelihoodDisplacement2024] The margin alone will not tell you which happened. DPO-Positive adds a penalty when chosen likelihood falls below the reference, though that does not guarantee the alternatives improved.[^pal2024smaug]

So track more than the loss: chosen and rejected log-probabilities, the margin and logit, an on-policy KL estimate, and generated text. If margins improve while chosen log-probability collapses, look at your data, $\beta$, and length effects before extending the run.

## Look for the answer nobody compared

Here is DPO's central blind spot, which you can see with just three answers. A subtracts `max(z)` before `exp(z)`. B casts to `float64` after `exp(z)`. C clamps logits to `[-100, 100]` without shifting, which still overflows `float32` and `float16`. Your dataset compares only A and B.

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

The loss cannot tell these two policies apart, even though the second gives the unseen logit-clamping bug 90% of its probability. A new A-versus-C comparison would teach the missing distinction, and an online scorer can notice C when a rollout reaches it, but only if the scorer's own coverage is good enough to recognize why clamping fails. Either way, you need independent evaluation of generated text, and stored-pair accuracy is a different measurement from a human win rate on fresh answers.

That gives you the practical choice between the two methods.

| | PPO-style RLHF | Basic DPO |
| --- | --- | --- |
| Separate reward model | Yes | No, the reward is implicit |
| Training loop | Rollouts and policy updates | Offline loss on fixed pairs |
| Logical roles | Policy, reference, reward, critic | Policy, reference |
| Main cost | Sampling, scoring, value updates | Forward and backward on stored pairs |
| Sensitive to | Reward scale, KL, PPO settings | Data coverage, $\beta$, length |
| Exploration | Yes | None without new data |

I would start with DPO when you have good offline pairs, because it has fewer moving parts and fewer ways to fail silently. Reach for an online loop when you need fresh model-generated negatives, or a signal that moves as the policy moves. Refreshing DPO's dataset with newly labeled samples is a middle ground, and later work studies it directly, though sampling and reference rules vary.[^calandriello2024] A stale or biased judge can still mislabel those new rows, so a refresh only helps if your labeling can recognize the current failures.

One practical note on cost. A frozen reference's scores can be precomputed for fixed token sequences, saving a resident model. That cache belongs to an exact recipe: reference revision, tokenizer, template, token IDs, masks, truncation, and the sum or mean convention. Change any of those and it is invalid.

Truncation can also cost you data without a word. As of TRL 1.17, the default `keep_start` truncation cuts each sequence at `max_length`, which defaults to 1024. If chosen and rejected differ only after that point, the difference is gone. If a prompt alone fills `max_length`, the trainer drops the row without an error. So count your rows before and after preparation, and inspect collated pairs before you train.[^trl2026DpoTrainerV117][^trl2026DpoConfigV117]

## The family around these two

These methods differ mainly in what signal they consume. Start from what you can reliably collect.

| Method | Signal and mechanism | What to watch |
| --- | --- | --- |
| IPO | Pairs. Squared loss targets a finite margin of $1/(2\tau)$[^azar2023] | Penalizes overshoot, with no general stability or safety promise |
| KTO | Single thumbs-up or thumbs-down labels, with opposite directions around a reference point[^ethayarajh2024] | What the label really means, selection bias, class weights |
| ORPO | SFT and an odds-ratio penalty in one stage, with no reference[^hong2024] | Couples instruction following with preference updates |
| SimPO | Scaled average token log-probability with a target margin, and no reference[^meng2024] | Changes length dependence, so check concision and correctness |
| GRPO | Online. Normalizes reward within a group of sampled answers, with no learned critic[^shao2024][^deepseekai2025] | Still needs rollouts and a useful scoring signal |

GRPO deserves a sentence more, because it shows what you can drop. Sample several answers for a prompt, score them with a verifier or reward model, and use each answer's reward relative to its group as the advantage. That removes the critic's state and value-fitting errors. In the four-backbone budget above, removing the critic saves 44.4% of the state bytes. There is one edge case to expect: if every answer in a group gets the same reward, the centered advantages are all zero, and that group gives no reward-driven update. A high rate of such groups can mean everything passes, everything fails, or your scorer cannot tell answers apart.

## When the proxy lies

Back to the candidate at the start of the chapter. That is a reward-hacking suspicion, and three numbers do not yet prove it. Inspect the longer answers and score controlled rewrites: does prepending "Verified answer:" raise the reward without fixing the overflow bug? That comparison exposes what the scorer pays for.

| Hack | Symptom | How to detect it |
| --- | --- | --- |
| Length gaming | Answers get steadily longer | Track mean response length |
| Sycophancy | The model agrees with a wrong user | Test with false user claims |
| Format exploitation | Everything arrives as a list | Compare formatted and plain scores |
| Confidence mimicry | Sounds sure on hard items | Calibration checks on known-hard questions |

Now make the decision, with humans in the loop and a rule you wrote down before looking. Hold out human evaluation, blind the response order, and fix the rubric. Here the rule says the win rate's lower confidence bound must exceed 50%, and mean length growth must stay below 20 tokens. That length limit is a product choice we made up for this example. Assume independent prompts, one judgment each, no ties, and one planned evaluation.

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
print("win gate passes:", low > 0.5)
print("length gate passes:", length_growth < length_limit)
```

<!-- leetllm: output:start -->
```text title="Reader release gate" output compact
win rate 95% interval: 41.2% to 50.9%
win gate passes: False
length gate passes: False
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/alignment_failure_guardrails_dark.png" alt="Three rows. Proxy reward rises by 0.31 but is not a gate. The 184 of 400 win rate has a 95 percent Wilson interval from 41.2 to 50.9 percent, crossing the 50 percent line, so the gate needs its lower bound above 50 and fails. Length grew by 48 tokens against a limit of 20, and fails." />
  <figcaption>The interval crosses 50% in the win row, so the candidate has shown neither an improvement nor a clear loss. Length fails outright. A rising proxy cannot override either gate.</figcaption>
</figure>

The Wilson interval runs from about 41.2% to 50.9%.[^nistBinomialIntervals2026] It crosses 50%, so this result shows neither a clear improvement nor a clear decline, and length growth of 48 fails outright. You do not ship. Repeated checkpoints, shared users, and ties all need an analysis that matches them, so pretending each judgment is an independent coin flip would overstate your certainty. Use validation evaluations to pick a checkpoint and keep a separate planned comparison for the one you selected. And track useful detail and refusal quality next to length, so a concision rule does not punish answers that needed the words.

The same stop rule covers other failure signatures. If DPO improves tone while the model still recommends post-exp casting, check whether your labels even cover numerical stability distinctions, and then check the deployed prompt and template. If PPO generations turn repetitive while reward rises, freeze promotion, inspect reward scale and KL, and refresh your evaluation.

```checkpoint
At $\beta=0.5$, the chosen answer's log-ratio against the reference is +0.2, and the rejected answer's is −0.6. What are the margin, the logit, and the DPO loss?
---
The margin is $0.2-(-0.6)=0.8$. The logit is $\beta m=0.5\times0.8=0.4$. The loss is $-\log\sigma(0.4)\approx0.513$, which is below the 0.693 of a fresh run, so this pair has started to move.
```

## Where this leaves you

You can now trace a terminal score back through its tokens, read PPO's clip correctly, derive DPO's loss and say why the normalizer vanishes, spot a margin that grows while the answer gets less likely, and decide on a release from a written rule. Whichever method you pick, the model only learns the distinctions your feedback contains.

Human comparisons do not scale to every new failure, though, and someone has to write down what "better" means. [Constitutional AI and red teaming](/learn/constitutional-ai-automated-red-teaming) writes those rules as principles, uses AI critique and ranking to produce more of the labels, and then attacks the result to see which safeguards actually hold.

<!-- leetllm: edition:reader:end -->
