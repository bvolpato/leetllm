---
{
  "id": "rlvr-verifiable-rewards-training",
  "title": "RLVR & Verifiable Rewards",
  "slug": "rlvr-verifiable-rewards-training",
  "section": "Advanced Training & Adaptation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "companies": [
    "OpenAI",
    "Google DeepMind",
    "Anthropic",
    "DeepSeek"
  ],
  "shortDescription": "A checker can mark 168 correct and 148 wrong. RLVR trains on that executable result, then tests what the checker still misses.",
  "keyConceptsTested": [
    "RLVR vs. RLHF vs. DPO, and when each applies",
    "Verifiable reward functions (math, code, formal logic)",
    "Group Relative Policy Optimization (GRPO)",
    "Observed reasoning patterns under reward pressure",
    "Cold-start strategies and multi-stage training",
    "Reward hacking and failure modes",
    "RLVR vs. distillation, and why training pipelines may use both"
  ],
  "order": 14,
  "coverImage": "illustrations/_generated/rlvr_pipeline_dark.png",
  "prerequisites": [
    "constitutional-ai-automated-red-teaming",
    "rlhf-dpo-aligning-language-models",
    "reward-modeling-from-preference-data",
    "supervised-fine-tuning-pipeline"
  ],
  "relatedQuestions": [
    "knowledge-distillation-llms",
    "model-merging-weight-interpolation",
    "programmatic-prompt-optimization-dspy",
    "reasoning-models-test-time-compute"
  ]
}
---

A compute cluster has 14 workers with 12 available slots each, one slot per job, and no other resource limits. How many concurrent jobs fit? The product is 168. A deterministic checker marks `168` right and `148` wrong in microseconds, with zero human raters and no learned reward model to drift out of distribution.

That single shift powers <span data-glossary="rlvr">Reinforcement Learning with Verifiable Rewards (RLVR)</span>: replace a learned preference scorer with an executable check whenever correctness can be tested by code, math equivalence, a schema validator, or a proof assistant.[^lambert2024rlvr] Tülu 3 popularized the RLVR name for this post-training stage, and DeepSeek-R1 scaled rule-based rewards inside a multi-stage reasoning pipeline.[^lambert2024rlvr][^deepseekai2025]

Yet replacing a learned scorer with a script does not eliminate reward hacking; it moves optimization pressure straight onto the checker's rules. Suppose our 14×12 prompt rewards any output ending in `\boxed{168}`. A valid derivation earns `1.0`, and so does a faulty shortcut that happens to land on `168`. Worse, a sloppy parser that rewards `\boxed{168}` anywhere in the text lets a model spray multiple guesses until one hits.

<figure>
  <img src="illustrations/_generated/rlvr_pipeline_dark.png" alt="The task is 14 workers × 12 slots = 168. Two policy completions end with literal boxed output 168, so the final-answer verifier returns reward 1 for each. A separate trace review calls the calculation sound and the shortcut invalid." />
  <figcaption>The final-answer verifier grades only the extracted output token; trace soundness is a separate property. GRPO is one optimizer for turning those rewards into policy updates.</figcaption>
</figure>

## The alignment space

RLVR complements <span data-glossary="supervised-fine-tuning">SFT</span>, RLHF, and DPO rather than replacing them. Choose the supervision loop that matches what your task can actually verify:

| Method | Reward signal | Scalability | Best-fit task scope |
|---|---|---|---|
| **SFT** | Demonstration tokens (cross-entropy) | Limited by curated demonstration quality | Tasks with high-quality reference trajectories |
| **RLHF** | Learned scalar reward from preference pairs[^ouyang2022] | Needs scorer calibration and rollout compute | Open-ended quality (tone, clarity, helpfulness) |
| **DPO** | Chosen vs. rejected preference pairs[^rafailov2023] | Offline form skips online rollout loops | Human- or verifier-ranked response pairs |
| **RLVR** | Executable programmatic checks | Scales with verifiable prompts and rollout compute | Properties captured by exact code, math, or formal rules |

Notice how cleanly these methods compose. SFT builds foundational formatting and capability, RLVR sharpens verifiable reasoning (math, code, exact constraints, SQL, formal proofs), and RLHF or DPO shapes subjective qualities that no unit test can grade.

<figure>
  <img src="illustrations/_generated/alignment_method_router_dark.png" alt="Four connected training paths distinguish their supervision and update: SFT maps a prompt and target to token cross-entropy; reward-model RL learns from chosen/rejected pairs and then uses policy RL; DPO fits the pairwise objective directly; RLVR checks a candidate and gives the resulting reward to policy RL, with PPO or GRPO as optimizer choices." />
  <figcaption>Demonstrations supply token targets, preference pairs supply relative rankings, and executable checks supply scalar rewards for PPO or GRPO.</figcaption>
</figure>

## Defining verifiable rewards

In its minimal outcome-only form, a verifiable reward function $r(x, y)$ scores a candidate completion $y$ for prompt $x$ as a binary indicator:

$$
r(x, y) = \begin{cases} 1 & \text{if } y \text{ passes verification} \\ 0 & \text{if } y \text{ fails verification} \end{cases}
$$

Variants adjust scale and auxiliary penalties. Tülu 3 awarded $+10$ for passing, $0$ for failing, and $-10$ for a missing end-of-sequence token in its PPO setup,[^lambert2024rlvr] while DeepSeek-R1-Zero summed accuracy and `<think>...</think>` format rewards.[^deepseekR1Original2025] Whenever you add auxiliary terms, verify that format points alone can never outweigh a correct answer.

```checkpoint
Why is a binary verifier attractive for RLVR?
---
It makes the pass condition repeatable and fast without training a separate learned reward model for every sample, provided the checker and reference answers are bug-free.
```

Outcome grading carries one fundamental blind spot: **it scores only the final answer, not the reasoning that produced it**. Consider "Is 97 a prime number? Format your answer as `\boxed{Yes}` or `\boxed{No}`":

<!-- leetllm: test, output=show, output_title="Outcome reward blind spot" -->
```python title="outcome-reward-blind-spot.py"
import re


def verdict_reward(response: str, expected: str) -> float:
    if response.count(r"\boxed") != 1:
        return 0.0
    matches = re.findall(r"\\boxed\{(Yes|No)\}", response)
    return 1.0 if matches == [expected] else 0.0


rollouts = {
    "lucky_reason": r"It ends in 7, so it must be prime. \boxed{Yes}",
    "valid_check": r"Check prime divisors up to sqrt(97): 2, 3, 5, 7 all fail. \boxed{Yes}",
    "wrong_answer": r"97 is divisible by 3. \boxed{No}",
}

for name, response in rollouts.items():
    print(f"{name:13s}: reward={verdict_reward(response, 'Yes')}")
```

<!-- leetllm: output:start -->
```text title="Outcome reward blind spot" output compact
lucky_reason : reward=1.0
valid_check  : reward=1.0
wrong_answer : reward=0.0
```
<!-- leetllm: output:end -->

Both `lucky_reason` and `valid_check` earn `1.0`. Sparse outcome credit also means a 40-step proof with one arithmetic slip on line 39 receives `0.0`.

> **Key insight:** Separate **candidate failures** from **infrastructure or reference faults**. A candidate that outputs a wrong value or blows its own time/memory limit earns reward `0`. An offline verifier service, crashed host, or corrupted ground-truth label yields no valid measurement: quarantine those rows with their sample IDs for bounded retry instead of injecting spurious zeros into the rollout group.

<figure>
  <img src="illustrations/_generated/verifier_contract_dark.png" alt="A sample ID, response, reference, and candidate-owned limits first pass a measurement-trust check. A healthy worker and valid reference allow candidate checking: a verified pass receives reward 1; a wrong, malformed, ambiguous, or over-budget candidate receives 0. An unrelated host crash, prover outage, or broken reference is quarantined as unscored, retains its sample ID for bounded retry, and stays out of the rollout group." />
  <figcaption>Healthy workers grade candidate outputs under candidate limits. Quarantine host crashes, prover outages, or malformed references instead of scoring them as zero.</figcaption>
</figure>

### Outcome vs. process supervision

**Outcome supervision** assigns one scalar score to the completed output (final boxed value, test suite pass, or proof check), whether via deterministic code in RLVR or a learned outcome verifier.[^cobbe2021] **Process supervision** grades intermediate steps: Lightman et al. trained learned Process Reward Models (PRMs) on human step annotations and improved best-of-$N$ MATH selection on a fixed generator.[^lightman2023] Outcome checks are cheap and scale effortlessly; process checks localize mid-trace errors when step labels or tactic checkers are available.

### Concrete verifier implementations

#### Mathematics and symbolic algebra

Mathematical equivalence requires normalizing different writings of the same value (`0.5` vs. `1/2`) while rejecting ambiguous multi-box outputs. Using `fractions.Fraction` handles exact rationals without binary float rounding; at full algebraic scale, libraries like Hugging Face's Math-Verify pair LaTeX extraction with SymPy equivalence checks under strict timeouts.[^huggingface2026mathVerify] Notice how the verifier below raises on a broken ground-truth reference (quarantine) while returning `0.0` on a malformed candidate:

<!-- leetllm: test, output=show -->
```python title="mathematics.py"
from fractions import Fraction
import re


def extract_single_boxed(text: str) -> str | None:
    if len(text) > 4096 or text.count(r"\boxed") != 1:
        return None
    start = text.find(r"\boxed{")
    if start == -1:
        return None
    depth, chars = 0, []
    for ch in text[start + len(r"\boxed{"):]:
        if ch == "{":
            depth += 1
        elif ch == "}":
            if depth == 0:
                return "".join(chars).strip()
            depth -= 1
        chars.append(ch)
    return None


def parse_number(field: str) -> Fraction:
    if len(field) > 64 or not re.fullmatch(r"[+-]?[0-9]+(?:/[0-9]+|\.[0-9]+)?", field):
        raise ValueError(f"Unsupported numeric field: {field!r}")
    return Fraction(field)


def math_verifier(answer: str, ground_truth: str) -> float:
    ref_field = extract_single_boxed(ground_truth)
    if ref_field is None:
        raise ValueError("Invalid reference; quarantine task")
    try:
        expected = parse_number(ref_field)
    except (ValueError, ZeroDivisionError) as err:
        raise ValueError("Invalid reference; quarantine task") from err

    pred_field = extract_single_boxed(answer)
    if pred_field is None:
        return 0.0
    try:
        return 1.0 if parse_number(pred_field) == expected else 0.0
    except (ValueError, ZeroDivisionError):
        return 0.0


print("equivalent (0.5 vs 1/2):", math_verifier(r"The answer is \boxed{0.5}.", r"\boxed{1/2}"))
print("wrong (148 vs 168):     ", math_verifier(r"\boxed{148}", r"\boxed{168}"))
print("ambiguous (two boxes):  ", math_verifier(r"Maybe \boxed{168} or \boxed{148}.", r"\boxed{168}"))
print("candidate div-by-zero:  ", math_verifier(r"\boxed{1/0}", r"\boxed{1/2}"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
equivalent (0.5 vs 1/2): 1.0
wrong (148 vs 168):      0.0
ambiguous (two boxes):   0.0
candidate div-by-zero:   0.0
```
<!-- leetllm: output:end -->

#### Code generation and sandboxed execution

Executing model-generated code directly on a training host invites filesystem tampering, fork bombs, and test exfiltration. Production code verifiers isolate every candidate inside microVMs such as Firecracker or user-space kernels such as gVisor with read-only mounts, disabled egress networking, strict wall-clock timeouts (because a sleeping process burns zero CPU), and bounded stdout capture.[^firecracker2026HostSetup][^gvisorSecurity2026]

Keep expected test outputs strictly outside the candidate process, and watch out for subtle Python type traps (`bool` subclasses `int`, so `True == 1`!). Here we run candidate functions in an isolated child process that receives only inputs, never gold answers:

<!-- leetllm: test, output=show -->
```python title="code-generation.py"
import json
import subprocess
import sys
from dataclasses import dataclass


@dataclass
class TestCase:
    inputs: tuple[int, ...]
    expected: int


def code_verifier(code: str, test_cases: list[TestCase]) -> float:
    for case in test_cases:
        runner = code + f"\nimport json\nprint(json.dumps(solve(*{case.inputs!r})))\n"
        try:
            proc = subprocess.run(
                [sys.executable, "-I", "-c", runner],
                capture_output=True, text=True, timeout=1.0, check=False,
            )
        except subprocess.TimeoutExpired:
            return 0.0
        if proc.returncode != 0:
            return 0.0
        try:
            value = json.loads(proc.stdout)
        except json.JSONDecodeError:
            return 0.0
        # Reject JSON booleans masquerading as integers (True == 1 in Python).
        if type(value) is not int or value != case.expected:
            return 0.0
    return 1.0


cases = [TestCase((14, 12), 168), TestCase((8, 12), 96)]
good = "def solve(a, b):\n    return a * b\n"
bad = "def solve(a, b):\n    return a + b\n"
self_report = 'print(\'{"passed": true}\')\nraise SystemExit(0)\n'

print(f"good={code_verifier(good, cases)} | bad={code_verifier(bad, cases)} | self_report={code_verifier(self_report, cases)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
good=1.0 | bad=0.0 | self_report=0.0
```
<!-- leetllm: output:end -->

Always hold out fresh test cases from the optimization loop: a policy that memorizes training inputs (`{(14, 12): 168, (8, 12): 96}`) hits 100% on visible cases and drops straight to 0% on `(7, 9)` and `(11, 13)`.

#### Instruction constraints

Verifiable rewards extend cleanly to formatting and structural constraints (such as the IFEval checks used in Tülu 3).[^lambert2024rlvr] Tighten parsers against trailing loopholes: a weak bullet counter that checks only `line.startswith("- ")` gives `1.0` even when the model appends extra prose below three bullets, whereas checking total lines and non-empty bullet bodies blocks the loophole:

<!-- leetllm: test, output=show, output_title="Constraint reward" -->
```python title="instruction-constraints.py"
def weak_three_bullets(response: str) -> float:
    return float(sum(line.startswith("- ") for line in response.splitlines()) == 3)


def strict_three_bullets(response: str) -> float:
    lines = response.splitlines()
    return float(len(lines) == 3 and all(line.startswith("- ") and line[2:].strip() for line in lines))


valid = "- name the GPU\n- name the slot count\n- name the job total"
extra_prose = valid + "\nHere is an extra trailing sentence."

print(f"valid:       weak={weak_three_bullets(valid):.0f} strict={strict_three_bullets(valid):.0f}")
print(f"extra_prose: weak={weak_three_bullets(extra_prose):.0f} strict={strict_three_bullets(extra_prose):.0f}")
```

<!-- leetllm: output:start -->
```text title="Constraint reward" output compact
valid:       weak=1 strict=1
extra_prose: weak=1 strict=0
```
<!-- leetllm: output:end -->

#### Formal logic and SQL solvers

Theorem provers such as Lean 4, Isabelle, and Coq provide exact proof checking, provided you lock the target theorem and check transitive axiom dependencies rather than trusting compilation alone. In Lean 4, `#print axioms` catches `sorryAx` (which proves anything) and unauthorized compiler axioms.[^leanAxioms2026]

For SQL tasks, define duplicate, `NULL`, type, and row-order semantics up front. Without `ORDER BY`, SQLite leaves row ordering unspecified;[^sqlite2026Select] comparing sorted **multisets** (`Counter`) preserves duplicate and `NULL` counts without punishing valid reorderings. Run both checks live below using Python's in-memory `sqlite3`:

<!-- leetllm: test, output=show, output_title="SQL multiset and Lean axiom verifier" -->
```python title="sql_and_proof_verifier.py"
from collections import Counter
from dataclasses import dataclass
import sqlite3


def sql_multiset_verifier(query: str, expected_rows: list[tuple]) -> float:
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE jobs (slots INT)")
    conn.executemany("INSERT INTO jobs VALUES (?)", [(4,), (None,), (7,), (None,)])
    try:
        rows = conn.execute(query).fetchall()
    except sqlite3.Error:
        return 0.0
    finally:
        conn.close()
    return float(Counter(rows) == Counter(expected_rows))


@dataclass(frozen=True)
class ProverCheck:
    accepted: bool
    theorem_matches: bool
    axioms: frozenset[str]


def proof_reward(res: ProverCheck) -> float:
    allowed = {"Classical.choice", "propext", "Quot.sound"}
    return float(res.accepted and res.theorem_matches and res.axioms <= allowed)


expected = [(4,), (None,), (7,), (None,)]
print("SQL matching multiset (reordered):", sql_multiset_verifier("SELECT slots FROM jobs ORDER BY slots DESC", expected))
print("SQL wrong duplicate/NULL counts:  ", sql_multiset_verifier("SELECT DISTINCT slots FROM jobs", expected))
print("Proof valid axioms:               ", proof_reward(ProverCheck(True, True, frozenset({"Classical.choice"}))))
print("Proof compiled with sorryAx:      ", proof_reward(ProverCheck(True, True, frozenset({"sorryAx"}))))
```

<!-- leetllm: output:start -->
```text title="SQL multiset and Lean axiom verifier" output compact
SQL matching multiset (reordered): 1.0
SQL wrong duplicate/NULL counts:   0.0
Proof valid axioms:                1.0
Proof compiled with sorryAx:       0.0
```
<!-- leetllm: output:end -->

### What can't be verified?

Executable checks require an exact specification. Open-ended tasks still need human or preference supervision:

- **Creative writing:** "Draft three sharp launch hooks" has no single ground truth.
- **Architectural tradeoffs:** "Should we migrate this workload to Kubernetes?" admits multiple defensible answers.
- **Nuanced safety and tone:** Exact authorization decisions and synthetic-secret leaks are programmatically testable, whereas subtle tone, context-dependent privacy, and helpfulness require preference models or human review.

```checkpoint
Why must an RLVR verifier fail closed?
---
If parsing errors, timeouts, or malformed outputs accidentally earn reward, RL amplifies those loopholes rapidly. Malformed or over-budget candidate outputs earn 0; broken references or verifier outages stay unscored and quarantined rather than entering training as zeros.
```

## Group relative policy optimization (GRPO)

DeepSeekMath introduced <span data-glossary="grpo">Group Relative Policy Optimization (GRPO)</span>, and DeepSeek-R1 scaled it across reasoning post-training.[^shao2024][^deepseekai2025] Note the distinction: RLVR describes **where the reward comes from** (an executable verifier), whereas GRPO and PPO describe **how you update the policy**. Tülu 3 ran RLVR with PPO; DeepSeek-R1 ran RLVR with GRPO.[^lambert2024rlvr][^deepseekai2025]

### What the PPO critic estimates

Standard PPO trains a separate **critic** (value network $V_\phi(s_t)$) to predict expected return from token state $s_t$, forming advantages $A_t = R - V_\phi(s_t)$ (or Generalized Advantage Estimation) under terminal reward $R$.[^schulman2017] Maintaining that critic adds parameters, optimizer states, and activations alongside the policy.

### The GRPO critic-free mechanism

GRPO removes the learned critic completely. For each prompt $q$, sample a group of $G$ completions $\{o_1, \dots, o_G\}$, score each with the verifier, and normalize each reward against its own group's mean and **population** standard deviation:

$$
A_i = \frac{r_i - \text{mean}(\{r_1, \dots, r_G\})}{\text{std}(\{r_1, \dots, r_G\})}
$$

Watch $G = 8$ rollouts on our $14 \times 12 = 168$ cluster prompt, where four rollouts hit `168` ($r = 1.0$) and four miss ($r = 0.0$):

| Sample | Answer | Reward $r_i$ | Group mean | Pop. std | Advantage $A_i$ |
|---|---|---:|---:|---:|---:|
| 1, 4, 6, 8 | `168` | 1.0 | 0.5 | 0.5 | `+1.0` |
| 2, 3, 5, 7 | `148, 156, 170, 144` | 0.0 | 0.5 | 0.5 | `-1.0` |

Correct rollouts earn $A_i = +1.0$ (encouraged by the clipped surrogate); wrong rollouts earn $A_i = -1.0$ (discouraged). When every rollout in a group scores identically (`[1, 1, 1, 1]` or `[0, 0, 0, 0]`), the standard deviation is zero, so training guards the denominator and sets $A_i = 0$ (producing zero comparative reward gradient for that group).

```checkpoint
What does a positive GRPO advantage mean?
---
The rollout scored above its prompt group's mean reward. Inside the unclipped branch of the surrogate objective, gradient ascent increases the log-probabilities of its generated tokens relative to below-mean rollouts.
```

<figure>
  <img src="illustrations/_generated/grpo_group_advantages_dark.png" alt="For one 14-by-12 prompt, the eight answers 168, 148, 156, 168, 170, 168, 144, 168 produce rewards 1, 0, 0, 1, 0, 1, 0, 1. Their mean is 0.5 and population standard deviation is 0.5, so the normalized advantages are +1, −1, −1, +1, −1, +1, −1, +1. An all-pass or all-fail group has zero spread and guarded zero advantages; other loss terms may still contribute." />
  <figcaption>With mean 0.5 and population standard deviation 0.5, passing and failing rollouts receive advantages +1 and −1. Uniform groups receive guarded zero advantages.</figcaption>
</figure>

GRPO applies a PPO-clipped surrogate per generated token, averages over included tokens $T_i$, and averages across the group:[^shao2024]

$$
\mathcal L = -\frac{1}{G}\sum_{i=1}^{G}\frac{1}{T_i}\sum_{t=1}^{T_i}
\left[\min\left(\rho_{i,t}A_i,\operatorname{clip}(\rho_{i,t},1-\epsilon,1+\epsilon)A_i\right)-\beta k_{i,t}\right]
$$

Here $\rho_{i,t} = \exp\bigl(\log\pi_\theta(o_{i,t}\mid q, o_{i,<t}) - \log\pi_{\text{old}}(o_{i,t}\mid q, o_{i,<t})\bigr)$ compares the updated policy against the frozen rollout policy that generated the batch, and $k_{i,t} = \exp(\ell_{i,t}) - \ell_{i,t} - 1$ with $\ell_{i,t} = \log\pi_{\text{ref}} - \log\pi_\theta$ is the non-negative sample KL estimator.[^shao2024]

Watch an entire 10-step GRPO loop in PyTorch over an 8-outcome categorical policy (4 passing outcomes with reward `1.0`, 4 failing outcomes with reward `0.0`). Even starting from a uniform policy (`50%` pass probability), clipped group-relative advantages steadily shift probability mass onto the passing outcomes while the KL penalty keeps drift smooth:

<!-- leetllm: test, deps=torch, output=show -->
```python title="categorical-policy-update.py"
import torch


def group_advantages(rewards: torch.Tensor) -> torch.Tensor:
    std = rewards.std(correction=0)
    return torch.zeros_like(rewards) if std == 0 else (rewards - rewards.mean()) / std


def clipped_surrogate(ratio: torch.Tensor, adv: torch.Tensor, eps: float = 0.2) -> torch.Tensor:
    return torch.minimum(ratio * adv, ratio.clamp(1.0 - eps, 1.0 + eps) * adv)


rewards = torch.tensor([1., 0., 0., 1., 0., 1., 0., 1.], dtype=torch.float64)
advantages = group_advantages(rewards)
logits = torch.zeros(8, dtype=torch.float64, requires_grad=True)
ref_log_probs = logits.detach().log_softmax(dim=0)

print("advantages:", advantages.tolist())
for step in range(1, 11):
    old_log_probs = logits.detach().log_softmax(dim=0)
    log_probs = logits.log_softmax(dim=0)
    ratios = (log_probs - old_log_probs).exp()
    log_ref = ref_log_probs - log_probs
    kl = (log_ref.exp() - log_ref - 1.0).mean()
    loss = -clipped_surrogate(ratios, advantages).mean() + 0.05 * kl

    logits.grad = None
    loss.backward()
    with torch.no_grad():
        logits -= 0.4 * logits.grad
        pass_prob = logits.softmax(dim=0)[rewards == 1].sum().item()
    if step in (1, 5, 10):
        print(f"step={step:2d} | pass_prob={pass_prob:.4f} | kl={kl.item():.5f}")

# Verify clipping saturation: positive advantage plateaus above 1.2, negative below 0.8.
clip_grads = []
for r_val, adv_val in [(1.3, 1.0), (0.7, -1.0), (0.7, 1.0), (1.3, -1.0)]:
    r = torch.tensor(r_val, requires_grad=True)
    clipped_surrogate(r, torch.tensor(adv_val)).backward()
    clip_grads.append(r.grad.item())
print("clipping gradients (expected [0, 0, 1, -1]):", clip_grads)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
advantages: [1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0]
step= 1 | pass_prob=0.5250 | kl=0.00000
step= 5 | pass_prob=0.6218 | kl=0.02050
step=10 | pass_prob=0.7284 | kl=0.11546
clipping gradients (expected [0, 0, 1, -1]): [0.0, 0.0, 1.0, -1.0]
```
<!-- leetllm: output:end -->

> **Common mistake:** Treating uniform groups (`[0, 0, 0, 0]` or `[1, 1, 1, 1]`) as harmless noise. With a 1% pass rate and $G = 64$ rollouts, the chance of seeing a mixed group is $1 - 0.01^{64} - 0.99^{64} \approx 47.4\%$; when $p = 0\%$, every group has zero spread! DAPO addresses this by dynamically filtering uniform groups and keeping sampling within a capped budget, while also dividing token loss by total active tokens and decoupling upper/lower clip thresholds.[^yu2025dapo]

<details>
<summary>Deep dive: Why an unbiased KL value estimate still has a different gradient from exact KL</summary>

At a fixed prefix with current probabilities $p = (0.8, 0.2)$ and reference $q = (0.5, 0.5)$, the sample estimator $k = \exp(\log q - \log p) - (\log q - \log p) - 1$ matches the exact forward KL **value** in expectation ($\mathbb{E}_p[k] = D_{\mathrm{KL}}(p \| q)$). However, differentiating $k$ directly with sampled tokens held fixed detaches the sampling weights $p$, yielding a different gradient from differentiating full categorical KL:

<!-- leetllm: test, deps=torch, output=show, output_title="KL value and gradient boundary" -->
```python title="kl_value_vs_gradient.py"
import torch

logits = torch.tensor([0.8, 0.2], dtype=torch.float64).log().requires_grad_()
log_p = logits.log_softmax(dim=0)
p = log_p.exp()
log_q = torch.tensor([0.5, 0.5], dtype=torch.float64).log()
log_ratio = log_q - log_p
k = log_ratio.exp() - log_ratio - 1

exact_kl = (p * (log_p - log_q)).sum()
fixed_token_kl = (p.detach() * k).sum()

true_grad, = torch.autograd.grad(exact_kl, logits, retain_graph=True)
fixed_grad, = torch.autograd.grad(fixed_token_kl, logits)

print(f"KL value (both): {exact_kl.item():.6f}")
print("full KL gradient:    ", [round(v, 6) for v in true_grad.tolist()])
print("fixed-token gradient:", [round(v, 6) for v in fixed_grad.tolist()])
```

<!-- leetllm: output:start -->
```text title="KL value and gradient boundary" output compact
KL value (both): 0.192745
full KL gradient:     [0.221807, -0.221807]
fixed-token gradient: [0.3, -0.3]
```
<!-- leetllm: output:end -->

Record your trainer's KL differentiation convention whenever comparing experiments; identical logged KL numbers do not guarantee identical policy gradients.

</details>

| Dimension | PPO | GRPO |
|---|---|---|
| **Baseline value** | Learned critic network $V_\phi(s_t)$ | Group mean reward over $G$ rollouts |
| **Extra model state** | Critic parameters, optimizer states, activations | No critic network; rollout buffer still required |
| **Primary failure mode** | Critic value drift | Zero-variance groups yield zero advantage |
| **Best fit** | Dense or sparse rewards with small batch sizes | Verifiable tasks where $G$ rollouts are cheap to check |

### A trainer name doesn't specify the objective

Modern libraries such as TRL's `GRPOTrainer` expose configurable loss reductions (`dapo`, `grpo`, `dr_grpo`), reward scaling (`group` vs. batch), token- vs. sequence-level ratios, and optional reference KL (`beta=0.0` omits the reference model entirely).[^huggingface2026grpotrainer] Always log the exact reduction, clipping thresholds, scaling rule, and KL weight alongside results so two runs sharing a trainer class name stay comparable.

## DeepSeek-R1 training pipeline

DeepSeek-R1 provides a concrete blueprint for combining RLVR with supervised stages.[^deepseekR1Original2025][^deepseekai2025] First, **DeepSeek-R1-Zero** applied pure GRPO with rule-based accuracy and format rewards directly to DeepSeek-V3-Base without preliminary reasoning SFT, climbing from 15.6% to 71.0% on AIME 2024 pass@1 (86.7% with 64-sample majority voting; updated to 77.9% in the expanded report).[^deepseekR1Original2025][^deepseekai2025]

R1-Zero showed that base models can emerge strong reasoning under pure RLVR, yet its traces suffered from poor readability and language mixing. To fix those issues while preserving broad chat utility, **DeepSeek-R1** ran four stages:

1. **Stage 1 (Cold-start SFT):** Fine-tune DeepSeek-V3-Base on several thousand curated, readable reasoning traces so RL starts from structured outputs in the target language.[^deepseekR1Original2025]
2. **Stage 2 (Reasoning RL with GRPO):** Train on verifiable math, coding, science, and logic tasks using accuracy reward plus a language-consistency reward (the fraction of target-language words in the chain of thought).[^deepseekR1Original2025]
3. **Stage 3 (Rejection sampling and SFT):** Sample hundreds of thousands of candidates, filter roughly 600k reasoning traces (using verifiers and DeepSeek-V3 judges) plus 200k general non-reasoning samples, and fine-tune **DeepSeek-V3-Base** from scratch on the combined 800k dataset for two epochs.[^deepseekR1Original2025][^deepseekai2025]
4. **Stage 4 (Final RL):** Combine rule-based reasoning rewards with preference reward models (grading helpfulness on the final summary and harmlessness across the full trace) to balance reasoning and general assistant behavior.[^deepseekR1Original2025]

## Observed reasoning patterns

Without a single step-level annotation, models trained under terminal verifiable rewards lengthen their chains of thought and exhibit three recurring behaviors:[^deepseekai2025]

- **Self-verification:** Pausing mid-derivation to re-check arithmetic (*"Wait, let me double-check: $14 \times 12 = 168$, not $148$."*). Spikes in reflective words like "wait" appear during RL training, though evaluating whether a specific token causally drives correction requires targeted interventions.
- **Backtracking:** Abandoning a dead-end plan (*"Adding $14 + 12$ counts slots incorrectly; multiply instead."*) while remaining a standard autoregressive policy shaped by terminal group advantages.
- **Extended thought and the reasoning tax:** Longer traces improve hard-problem accuracy by spending extra <span data-glossary="test-time-compute">test-time compute</span>, while raising serving latency and token cost. Measure accuracy-per-token across easy and hard prompt slices rather than assuming longer chains always help.

> **Research caution:** Shao et al. found that on Qwen2.5-Math-7B, even random rewards raised MATH-500 accuracy by 21.4 points (vs. 29.1 for ground-truth rewards), whereas Llama 3 and OLMo 2 variants saw weak or negative gains under spurious rewards.[^shao2025spurious] That finding highlights how pretraining priors and clipping dynamics interact with RLVR, making controlled baselines and <span data-glossary="pass-at-k">pass@1 / pass@k</span> tracking essential.

## Reward hacking and failure modes

RLVR shifts optimization pressure from a learned reward model onto your verification code. Adversarially test every parser and sandbox before burning GPU hours.

### Format gaming

Giving generous independent credit for formatting tags teaches policies to emit spotless wrong answers. Watch a broken reward function that pays `0.7` for any boxed integer outrank a plain-text right answer (`0.3`), whereas a correctness-first rule scores the wrong boxed answer `0.0`:

<!-- leetllm: test, output=show, output_title="Format reward trap" -->
```python title="format-reward-trap.py"
import re


def boxed_int(response: str) -> int | None:
    if response.count(r"\boxed") != 1:
        return None
    matches = re.findall(r"\\boxed\{([0-9]{1,20})\}", response)
    return int(matches[0]) if len(matches) == 1 else None


def broken_reward(response: str, expected: int) -> float:
    val = boxed_int(response)
    return 0.7 if val is not None else (0.3 if str(expected) in response else 0.0)


def strict_reward(response: str, expected: int) -> float:
    return 1.0 if boxed_int(response) == expected else 0.0


wrong_boxed = r"The answer is \boxed{148}."
right_plain = "The answer is 168."
print(f"broken_prefers_wrong={broken_reward(wrong_boxed, 168) > broken_reward(right_plain, 168)}")
print(f"strict_wrong_boxed={strict_reward(wrong_boxed, 168)}")
```

<!-- leetllm: output:start -->
```text title="Format reward trap" output compact
broken_prefers_wrong=True
strict_wrong_boxed=0.0
```
<!-- leetllm: output:end -->

### Shortcut exploitation and mitigation strategies

Biased answer distributions (multiple-choice keys skewed toward C), unisolated test harnesses, and multi-box answer spraying all invite shortcuts. Harden your verifier pipeline along four axes:

- **Strict extraction:** Require one canonical answer field so emitting `\boxed{168}` and `\boxed{148}` together scores `0.0`.
- **Group variance monitoring:** Track all-pass and all-fail group shares; cap dynamic resampling budgets so unsolvable tasks cannot stall batches.[^yu2025dapo]
- **Held-out generalization tests:** Keep final evaluation tasks separate from optimization prompts and test suites.
- **Length shaping:** Monitor truncation rates and evaluate soft overlong penalties (such as DAPO's buffer penalty near the token cap) so long traces do not collapse or truncate right before the final answer.[^yu2025dapo]

<figure>
  <img src="illustrations/_generated/verifier_pressure_map_dark.png" alt="The same literal response text contains boxed output 168 followed by boxed output 148, and both parser rules receive the whole response. A first-match rule selects 168 and returns reward 1 while missing 148; a single-box rule counts two markers, rejects ambiguity, and returns 0. A clean single boxed output 168 passes bounded Fraction equality." />
  <figcaption>First-match extraction misses a contradictory second box and awards 1; single-box validation rejects the ambiguity before comparing values.</figcaption>
</figure>

## When RLVR breaks

Five engineering mistakes derail RLVR runs more often than optimizer hyperparameters:

1. **Forcing a checker onto a subjective task:** Checking three bullet points verifies layout, not taste or factual completeness. Pair executable checks with preference signals on mixed tasks.
2. **Treating cold-start SFT as dogma:** R1-Zero proved pure RL works on strong base models; R1 proved cold-start SFT fixes readability and language mixing.[^deepseekai2025] When initial reward sits near zero, diagnose whether the bottleneck is syntax, task difficulty, or a broken parser before deciding on SFT.
3. **Celebrating format adherence:** High tag accuracy paired with low answer accuracy means the policy learned the wrapper without solving the problem. Log accuracy and format rewards separately.
4. **Ignoring general capability drift:** Heavy reasoning RL can erode instruction following or raise unnecessary refusals. Compare every checkpoint against its baseline across reasoning, instruction following, and refusal slices before promotion (for instance, holding a candidate that gains +13 points on reasoning while dropping 11 points on instruction following).
5. **Treating RLVR and distillation as rivals:** They work best in sequence.

## A tiny verifier lab

Put the exact-decimal single-box verifier together in one clean script. Notice two subtle details: converting decimal strings to `Fraction(Decimal(...))` avoids binary floating-point rounding bugs (`0.1 + 0.2 != 0.3`), and validating the ground-truth reference *before* inspecting the candidate guarantees broken dataset rows raise an error for quarantine instead of masquerading as candidate score `0.0`:

| Prompt | Ground truth |
|---|---|
| "A GPU batch runner has 14 workers with 12 slots each. How many concurrent jobs fit?" | `168` |
| "A scheduler runs 8 jobs per wave. How many waves are needed for 96 jobs?" | `12` |
| "A request budget is 47.50 GPU-seconds with a 6% overhead. What's the total?" | `50.35` |

<!-- leetllm: test, output=show -->
```python title="a-tiny-verifier-lab.py"
import re
from decimal import Decimal
from fractions import Fraction

NUM_PATTERN = re.compile(r"-?[0-9]{1,20}(?:\.[0-9]{1,20})?")


def extract_answer(text: str) -> str | None:
    if len(text) > 4096 or text.count(r"\boxed") != 1:
        return None
    matches = re.findall(r"\\boxed\{(-?[0-9]{1,20}(?:\.[0-9]{1,20})?)\}", text)
    return matches[0] if len(matches) == 1 else None


def parse_exact(value: int | str) -> Fraction:
    text = str(value)
    if NUM_PATTERN.fullmatch(text) is None:
        raise ValueError(f"Invalid reference value: {value!r}")
    return Fraction(Decimal(text))


def verify(response: str, ground_truth: int | str, abs_tol: str = "0") -> float:
    expected, tol = parse_exact(ground_truth), parse_exact(abs_tol)
    if tol < 0:
        raise ValueError("Tolerance must be nonnegative")
    answer = extract_answer(response)
    if answer is None:
        return 0.0
    return float(abs(Fraction(Decimal(answer)) - expected) <= tol)


tests = [
    ("correct", r"14 * 12 = 168. The answer is \boxed{168}.", 168, "0"),
    ("wrong", r"The total is \boxed{148}.", 168, "0"),
    ("ambiguous", r"It might be \boxed{168} or \boxed{148}.", 168, "0"),
    ("within_tol", r"\boxed{50.36}", "50.35", "0.01"),
    ("outside_tol", r"\boxed{50.361}", "50.35", "0.01"),
]
for label, reply, truth, tol in tests:
    print(f"{label:11s}: reward={verify(reply, truth, tol)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
correct    : reward=1.0
wrong      : reward=0.0
ambiguous  : reward=0.0
within_tol : reward=1.0
outside_tol: reward=0.0
```
<!-- leetllm: output:end -->

## RLVR and distillation

RLVR discovers high-reward reasoning trajectories through online exploration; **distillation** transfers teacher behavior into a smaller, cheaper student via supervised fine-tuning (or logit matching) without running online RL on the student.

| Dimension | **RLVR** | **Distillation** |
|---|---|---|
| **Supervision origin** | Executable rewards on the policy's own rollouts | Filtered teacher trajectories or probability distributions |
| **Optimization objective** | Policy gradient (GRPO / PPO) maximizing verifier score | Cross-entropy / KL matching teacher signals |
| **Core dependency** | Reliable verifiers and nonzero rollout variance | Capable teacher and curated training mixture |
| **Primary risk** | Verifier loopholes and zero-variance collapse | Inheriting teacher blind spots |

DeepSeek-R1 combined both: after RLVR produced a strong large teacher, the team distilled roughly 800k curated samples (about 600k reasoning and 200k general examples) into smaller Qwen and Llama models.[^deepseekR1Original2025] On AIME 2024, the distilled Qwen2.5-32B reached 72.6% pass@1 versus 47.0% for direct RL on the same 32B base model.[^deepseekR1Original2025] That gap shows why frontier RLVR teachers and distilled smaller students form a natural two-step stack rather than competing methods.

```mastery-quiz
[
  {
    "question": "Run K exceeds its own time limit on a healthy worker. In run M, the candidate finishes on time, but the verifier service is offline until the request expires. Both runs have valid references. In run P, the reference is invalid and the candidate omits the required final field. What should the grader record for K, M, and P, in order?",
    "options": [
      "(0, 0, unscored)",
      "(unscored, 0, unscored)",
      "(0, unscored, 0)",
      "(0, unscored, unscored)"
    ],
    "answer": "(0, unscored, unscored)",
    "explanation": "K earns 0 because the healthy worker measured a violation of the candidate's time limit. In M, the verifier service timed out, leaving no valid measurement. P stays unscored because the reference itself is invalid and must be quarantined before grading the candidate."
  },
  {
    "question": "Use the exact-decimal verifier lab with valid reference 12.50 and inclusive tolerance 0.01. Candidate A has one boxed 12.49; B has one boxed 12.489; C has two boxed 12.50 fields. All inputs meet size bounds. Which reward tuple (A, B, C) follows?",
    "options": [
      "(1, 0, 0)",
      "(1, 1, 0)",
      "(0, 0, 1)",
      "(1, 0, 1)"
    ],
    "answer": "(1, 0, 0)",
    "explanation": "The exact differences are 0.01 and 0.011. A meets the inclusive tolerance; B exceeds it. C fails the single-box rule regardless of its numeric values."
  },
  {
    "question": "A host grader keeps the expected values outside the child process and requires exact integer output. A returns JSON true for expected 1. B returns 27 for expected 27. A separate multiplication policy looks up ordered pairs in a table containing (5, 6) → 30 and (4, 8) → 32, with no fallback. Which host outputs pass, and does the lookup pass on (6, 5)?",
    "options": [
      "Only B passes. The lookup passes.",
      "Both A and B pass. The lookup fails.",
      "Only B passes. The lookup fails.",
      "Both A and B pass. The lookup passes."
    ],
    "answer": "Only B passes. The lookup fails.",
    "explanation": "JSON true decodes to Python bool, which fails an exact int type check. Integer 27 matches both type and value. The lookup table stores (5, 6) but not (6, 5), so the held-out pair fails."
  },
  {
    "question": "A proof checker accepts a proof of the requested theorem. The rule permits only Classical.choice, propext and Quot.sound. The dependency output lists propext and Task.assumption. An unordered SQL check expects one column with rows [4, NULL, 7, NULL]. Query X returns [NULL, 7, 4, 4]. Query Y returns [NULL, 7, NULL, 4]. Does the proof pass the dependency check, and which queries match?",
    "options": [
      "Proof fails. Both queries match.",
      "Proof passes. Only Y matches.",
      "Proof fails. Only Y matches.",
      "Proof passes. Both queries match."
    ],
    "answer": "Proof fails. Only Y matches.",
    "explanation": "The proof depends on Task.assumption, which is outside the allowed axiom set. For the unordered SQL check, multiset comparison requires two NULLs, one 4, and one 7, which only Y satisfies."
  },
  {
    "question": "Four responses to the same prompt earn rewards [9, 3, 11, 5]. What are the group mean, the population standard deviation, and the GRPO advantages in response order? Round the advantages to three decimal places.",
    "options": [
      "(7, √10, [2.000, −4.000, 4.000, −2.000])",
      "(7, √(40/3), [0.548, −1.095, 1.095, −0.548])",
      "(7, √10, [0.632, −1.265, 1.265, −0.632])",
      "(7, 10, [0.200, −0.400, 0.400, −0.200])"
    ],
    "answer": "(7, √10, [0.632, −1.265, 1.265, −0.632])",
    "explanation": "The rewards sum to 28, so the mean is 7 and deviations are [2, −4, 4, −2]. Sum of squares is 40, giving population variance 40/4 = 10 and standard deviation √10. Dividing each deviation by √10 yields [0.632, −1.265, 1.265, −0.632]."
  },
  {
    "question": "In a stored rollout batch, token A has probability ratio 1.4 and advantage +2. Token B has probability ratio 1.5 and advantage −2. With a clipping margin of 0.2, what are the two minimum surrogate terms (A, B), and which policy supplies the ratio denominator?",
    "options": [
      "(2.8, −3.0), rollout policy",
      "(2.4, −3.0), KL reference policy",
      "(2.4, −2.4), rollout policy",
      "(2.4, −3.0), rollout policy"
    ],
    "answer": "(2.4, −3.0), rollout policy",
    "explanation": "Both ratios clip to 1.2. For A, min(1.4×2, 1.2×2) = 2.4. For B, min(1.5×(−2), 1.2×(−2)) = −3.0. The ratio denominator is the frozen rollout policy that generated the batch, whereas the reference policy belongs to the separate KL term."
  },
  {
    "question": "A two-response batch has 3 and 5 included generated tokens. Every token in the first has loss 4, and every token in the second has loss 1. Compare equal response-mean weighting with global active-token weighting. Which pair of aggregate losses follows?",
    "options": [
      "(2.500, 2.125)",
      "(2.125, 2.500)",
      "(2.500, 2.500)",
      "(4.000, 2.125)"
    ],
    "answer": "(2.500, 2.125)",
    "explanation": "Response means are 4 and 1, averaging to 2.500. Global active-token averaging sums (3×4 + 5×1) / 8 = 17/8 = 2.125."
  },
  {
    "question": "Assume independent binary pass probability 0.2 and groups of 3. A dynamic filter retains mixed groups but the run has a declared maximum generation budget. Which mixed-group probability and exhaustion policy follow?",
    "options": [
      "0.512; generate until the mixed-group buffer contains the planned batch.",
      "0.480; stop at the declared budget and report unfilled mixed groups.",
      "0.992; stop at the declared budget and report unfilled mixed groups.",
      "0.480; generate until the mixed-group buffer contains the planned batch."
    ],
    "answer": "0.480; stop at the declared budget and report unfilled mixed groups.",
    "explanation": "Subtract all-pass (0.2³ = 0.008) and all-fail (0.8³ = 0.512) from 1 to get 0.480. Always stop at the declared generation budget and report unfilled groups rather than looping indefinitely."
  },
  {
    "question": "For a target of 24, a model gives seven answers [24, 23, 25, 24, 23, 24, 25]. Separately, a checker filters a teacher's solutions, and a student trains by predicting the next token in those saved solutions. What are the mean correctness, the modal answer, and the student's training method?",
    "options": [
      "3/7, no consensus, distillation by SFT",
      "7/7, consensus 24, distillation by SFT",
      "3/7, consensus 24, RLVR",
      "3/7, consensus 24, distillation by SFT"
    ],
    "answer": "3/7, consensus 24, distillation by SFT",
    "explanation": "Three of seven draws equal 24, and 24 holds the plurality (3 votes vs. 2 each for 23 and 25). Training a student via next-token prediction on filtered teacher traces is distillation by SFT."
  },
  {
    "question": "A predeclared release rule allows at most 3 percentage points of instruction decline and 2 points of refusal rise. Baseline is checked reasoning 60%, instructions 94%, unnecessary refusal 4%. Candidate A is 72%, 92%, 5%; B is 75%, 90%, 4%. Which eligibility and A reasoning gain follow?",
    "options": [
      "A holds; B passes; A gain 12 percentage points.",
      "A passes; B passes; A gain 20 percentage points.",
      "A passes; B holds; A gain 12 percentage points.",
      "A holds; B holds; A gain 12 percentage points."
    ],
    "answer": "A passes; B holds; A gain 12 percentage points.",
    "explanation": "Candidate A gains 12 reasoning points while staying within both limits (−2 instruction points, +1 refusal point). Candidate B drops 4 instruction points and fails the instruction limit despite the larger reasoning gain."
  }
]
```

> **Next:** Continue to [Knowledge Distillation for LLMs](/learn/knowledge-distillation-llms). RLVR can raise a teacher's checked pass rate when a verifier exists. Distillation asks how to copy useful teacher behavior into a smaller model you can actually serve, without running that RL loop on the student.
