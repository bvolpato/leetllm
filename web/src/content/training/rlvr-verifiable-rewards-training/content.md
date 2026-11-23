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

Try a capacity check: a cluster has 14 workers with 12 available slots each, one slot per job, and no other resource constraint. How many concurrent jobs fit? The arithmetic gives 168. A checker can pass 168 and fail 148 under that contract. It can't predict real cluster throughput or tell whether the explanation is sound unless those properties are checked too.

The previous chapter used <span data-glossary="constitutional-ai">written constitutional principles</span> to shape and evaluate model responses. Human or automated judges can still disagree, and a constitution doesn't execute in a sandbox.

<span data-glossary="rlvr">Reinforcement Learning with Verifiable Rewards (RLVR)</span> uses executable checks as a policy-training signal.[^lambert2024rlvr] A check can establish a declared property of an answer, proof, program, or schema. Deciding whether that property captures the task is the first engineering decision.

In the reward-model/RL form of RLHF, a learned scorer evaluates generated responses. Preferences can cover factual correctness as well as tone and helpfulness. Optimizing an imperfect scorer can amplify shortcuts, but it doesn't inevitably produce sycophancy or jargon. The previous lessons examined that gap between a proxy reward and the behavior we wanted.

An executable checker replaces that scorer, not the need to question the proxy. Passing tests establishes their assertions under their execution conditions; it isn't an exact oracle for all program behavior. Tülu 3 introduced the RLVR label for its post-training phase, building on earlier execution-feedback work. DeepSeek-R1 used rule-based rewards at scale within a multi-stage pipeline.[^lambert2024rlvr][^deepseekai2025]

Keep our 14×12 prompt nearby. A candidate that boxes 168 earns reward; a candidate that boxes 148 gets zero. Whether the written chain of thought was logically sound is a distinct question, and that gap resurfaces whenever the <span data-glossary="reward-verifier">verifier</span> inspects only the final boxed token. The CPU exercises below test verifier contracts and normalized policy updates. They clarify mechanics without demanding a multi-GPU training cluster.

A weak contract might reward seeing `\boxed{168}` anywhere, even beside a contradictory final answer. That gives optimization a shortcut. Whether a particular run exploits it requires measurement; the loophole itself is already enough reason to fix the checker.

<figure>
  <img src="illustrations/_generated/rlvr_pipeline_dark.png" alt="The task is 14 workers × 12 slots = 168. Two authored policy completions end with literal boxed output 168, so the final-answer verifier returns reward 1 for each. A separate trace review calls the calculation sound and the shortcut invalid." />
  <figcaption>The final-answer verifier reads literal output text. A separate trace review judges the derivation. GRPO is one choice for using the reward signal.</figcaption>
</figure>

## The alignment space

RLVR can follow or accompany <span data-glossary="supervised-fine-tuning">SFT</span> and preference optimization. The central question is which supervision your target domain supports, then which learning loop uses it well.

**Supervised Fine-Tuning (SFT)** fits demonstration targets through cross-entropy loss. For our capacity prompt, a target might supply a worked 14×12 solution. This fixed-target objective doesn't itself sample and verify new answers, though learned behavior can generalize beyond the demonstrations.

**Reinforcement Learning from Human Feedback (RLHF)**[^ouyang2022] trains a parameterized <span data-glossary="reward-model">reward model</span> on preference rankings. That fits subjective dimensions like tone, conciseness, or helpfulness, but its reliability depends heavily on labeler agreement and reward-model out-of-distribution stability.

<span data-glossary="dpo">Direct Preference Optimization (DPO)</span>[^rafailov2023] fits chosen/rejected pairs without a separately trained reward model. A verifier can supply their ordering, provided sampling finds distinguishable outcomes. Ordinary offline DPO updates from a fixed dataset; online variants can refresh comparisons. The difference from verifier-reward RL is the objective and update loop, not an exclusive right to use executable supervision.

Useful checkable properties include math answers, tests, <span data-glossary="json-schema">JSON schemas</span>, and constraints such as "return exactly three bullet points." These checks remove per-response preference labels for the checked property. People still specify tasks, audit references, and assess properties the checks omit. A <span data-glossary="sandbox">sandbox</span> is especially important when the candidate contains executable code.

| Method | Reward signal | Scalability | Task scope |
|--------|--------------|------------|------------|
| **SFT** | Demonstration targets | Depends on data quality and training cost | Tasks with useful demonstrations |
| **RLHF** | Learned reward from preference labels | Requires scorer validation and rollout compute | Behaviors described by the labeling rubric |
| **DPO** | Chosen/rejected comparisons | Offline form avoids reward-driven rollout loops | Human- or checker-ordered responses |
| **RLVR** | Executable checks | Limited by task supply, generation, verification, and updates | Properties captured by the checking contract |

Ground your pipeline in what the verifier establishes. Tests check selected behaviors. Separate checks can measure resource use, formatting, or other requirements. Verify maintainability with dedicated checks. Training stages can combine signals. SFT can teach more than formatting, RLVR rewards only verified properties, and DPO can target any behavior represented in its preference labels.

Audit task generators and reference targets independently. A wrong gold answer can reject a valid solution and reward the wrong one. In our binary-reward GRPO setup, a sampled all-pass or all-fail group has no comparative reward signal. Diagnose task difficulty, sample correlation, parsing, and checker behavior before changing the prompt.

<figure>
  <img src="illustrations/_generated/alignment_method_router_dark.png" alt="Four connected training paths distinguish their supervision and update: SFT maps a prompt and target to token cross-entropy; reward-model RL learns from chosen/rejected pairs and then uses policy RL; DPO fits the pairwise objective directly; RLVR checks a candidate and gives the resulting reward to policy RL, with PPO or GRPO as optimizer choices." />
  <figcaption>Demonstrations provide targets, pairs provide preference order, and executable checks provide reward. DPO uses the pair directly; reward-model RL adds a scorer.</figcaption>
</figure>

## Defining verifiable rewards

In its minimal outcome-only configuration, a verifiable reward function $r(x, y)$ takes problem $x$ and generated candidate $y$, returning a binary indicator:

$$
r(x, y) = \begin{cases} 1 & \text{if } y \text{ passes verification} \\ 0 & \text{if } y \text{ fails verification} \end{cases}
$$

This is one outcome-only design. Tülu 3 used success reward $\alpha=10$, failure reward 0, and a separate $-10$ missing-EOS penalty in its PPO setup.[^lambert2024rlvr] Other designs use partial test credit, negative rewards, or auxiliary format signals. Specify the composition: positive total reward does not imply semantic correctness when an auxiliary term can pay on its own.

A tiny arithmetic prompt highlights the blind spot of outcome-only grading: "Is 97 a prime number? Format your answer as $\boxed{Yes}$ or $\boxed{No}$."

```checkpoint
Why is a binary verifier attractive for RLVR?
---
It makes the declared pass condition repeatable, provided the checker and reference are correct. If code, tests, or a proof checker can mark outputs right or wrong, training doesn't need a human preference model for every sample.
```

- Candidate 1: "It ends in 7, so $\boxed{Yes}$." Our final-field checker awards **1.0**, despite the invalid rule.
- Candidate 2: "97 is divisible by 3, so $\boxed{No}$." It awards **0.0** for the incorrect verdict.
- Candidate 3: "None of the primes up to $\sqrt{97}$ divide it: 2, 3, 5, 7. $\boxed{Yes}$." It awards **1.0**. We can inspect this argument; the final-field checker doesn't inspect its arithmetic.

Candidates 1 and 3 collect identical credit. An outcome verifier doesn't tell the optimizer whether intermediate steps were valid. A diverse problem set can make brittle shortcuts less useful, but validity of an individual explanation remains a separate property.

Our check validates only the boxed field, treating an unsupported guess and a structured divisibility proof identically:

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
    "valid_check": r"Check divisors at most sqrt(97): 2, 3, 5, 7 fail. \boxed{Yes}",
    "wrong_answer": r"97 is divisible by 3. \boxed{No}",
}

for name, response in rollouts.items():
    print(f"{name}: reward={verdict_reward(response, 'Yes')}")
```

<!-- leetllm: output:start -->
```text title="Outcome reward blind spot" output compact
lucky_reason: reward=1.0
valid_check: reward=1.0
wrong_answer: reward=0.0
```
<!-- leetllm: output:end -->

Many RLVR pipelines employ an all-or-nothing outcome signal because deterministic checkers compute it rapidly. Others introduce auxiliary rule-based terms to reward structure without sacrificing determinism. Sparse credit assignment is the price you pay: if a candidate makes a trivial calculation slip at line 40 of a proof, an outcome checker returns zero despite excellent preceding reasoning.

> **Checkable isn't complete:** Passing a finite test suite establishes its assertions under the tested conditions. Even thorough tests don't prove correctness on every untested input. A formal proof establishes a formal statement under audited assumptions, which may still differ from the user's intended task.

<figure>
  <img src="illustrations/_generated/verifier_contract_dark.png" alt="A sample ID, response, reference, and candidate-owned limits first pass a measurement-trust gate. A healthy worker and valid reference allow candidate checking: a verified pass receives reward 1; a wrong, malformed, ambiguous, or over-budget candidate receives 0. An unrelated host crash, prover outage, or broken reference is quarantined as unscored, retains its sample ID for bounded retry, and stays out of the rollout group." />
  <figcaption>A healthy, valid measurement grades candidate behavior under its own limits. Preserve sample IDs and quarantine host, prover, or reference faults for bounded retry.</figcaption>
</figure>

DeepSeek-R1-Zero used accuracy and format rewards to encourage `<think>...</think>` structure.[^deepseekR1Original2025] Check generated traces for valid format and task accuracy. Its format term also illustrates that an RLVR design can award auxiliary credit without a correct answer.

Track extraction, checking, and execution statuses separately. Healthy infrastructure can establish that a candidate exceeded its declared time/memory budget: that is a failed candidate. An unrelated host crash, unavailable prover service, or invalid reference leaves no trustworthy measurement. Quarantine those faults with sample IDs and bounded retries; don't insert them as reward-zero peers. A surge in zeros could mean harder tasks, a parser regression, or changed policy behavior. Under guarded normalization, an all-zero group has no comparative advantage signal.

### Outcome vs. process supervision

**Outcome supervision** evaluates the completed artifact: the final boxed integer, the compiled binary, or the terminal test pass rate. RLVR executes this check with deterministic code. Related efforts train learned outcome verifiers to score final answers.[^cobbe2021] Credit assignment remains sparse.

Process supervision evaluates intermediate steps. Lightman et al. studied learned process reward models trained on human step labels, evaluating selection among a fixed generator's MATH solutions.[^lightman2023] More step labels can support more localized feedback; they don't guarantee dense, correct policy gradients. In formal systems, tactics construct proof terms or new goals. Completing a tactic successfully isn't the same as finishing a valid proof of the intended theorem.

The practical distinction is feedback granularity: outcome supervision returns one score for a completed response, while valid process labels or checks can locate a faulty step.

### Concrete verifier implementations

#### Mathematics and symbolic algebra

Evaluating mathematical expressions requires normalizing representations across equivalent representations. The verifier below enforces a strict single-marker contract and verifies numeric values using `fractions.Fraction`, allowing $1/2$ and $0.5$ to match while rejecting missing or duplicated boxes.

Symbolic comparison also needs domains, assumptions, and time limits. Simplification to zero can establish equivalence under those assumptions; failure to simplify isn't automatically proof of inequality. Hugging Face's Math-Verify separates extraction, SymPy representation, and comparison, with configurable tolerance and extraction priorities.[^huggingface2026mathVerify] Its flexible extraction policy differs from our deliberately narrow single-box contract. Neither policy suits every task. If intermediate working legitimately contains several boxes, define a dedicated final-answer field instead of rejecting useful work accidentally.

<!-- leetllm: test, output=show -->
```python title="mathematics.py"
from fractions import Fraction
import re

def extract_boxed_exprs(text: str) -> list[str]:
    if len(text) > 4096 or text.count(r"\boxed") != 1:
        return []
    marker = "\\boxed{"
    expressions: list[str] = []
    offset = 0
    while (start := text.find(marker, offset)) != -1:
        depth = 0
        expr_chars: list[str] = []
        for ch in text[start + len(marker):]:
            if ch == "{":
                depth += 1
                expr_chars.append(ch)
            elif ch == "}":
                if depth == 0:
                    expressions.append("".join(expr_chars).strip())
                    offset = start + len(marker) + len(expr_chars) + 1
                    break
                depth -= 1
                expr_chars.append(ch)
            else:
                expr_chars.append(ch)
        else:
            return []
    return expressions

def math_verifier(problem: str, answer: str, ground_truth: str) -> float:
    expected_fields = extract_boxed_exprs(ground_truth)
    numeric = r"[+-]?[0-9]+(?:/[0-9]+|\.[0-9]+)?"
    def parse_field(field: str) -> Fraction:
        if len(field) > 64 or re.fullmatch(numeric, field) is None:
            raise ValueError("Unsupported numeric field")
        return Fraction(field)
    try:
        if len(expected_fields) != 1:
            raise ValueError("Reference needs one field")
        expected = parse_field(expected_fields[0])
    except (ValueError, ZeroDivisionError) as error:
        raise ValueError("Invalid reference; quarantine the task") from error
    predicted_fields = extract_boxed_exprs(answer)
    if len(predicted_fields) != 1:
        return 0.0
    try:
        predicted = parse_field(predicted_fields[0])
    except (ValueError, ZeroDivisionError):
        return 0.0
    return 1.0 if predicted == expected else 0.0

equivalent_score = math_verifier("Compute half of one.", r"The answer is \boxed{0.5}.", r"\boxed{1/2}")
wrong_score = math_verifier("Compute 14 times 12.", r"\boxed{148}", r"\boxed{168}")
ambiguous_score = math_verifier("Compute 14 times 12.", r"Maybe \boxed{168} or \boxed{148}.", r"\boxed{168}")
print(equivalent_score)
print(wrong_score)
print(ambiguous_score)
print(f"equivalent_passes={equivalent_score == 1.0}")
print(f"wrong_answer_rejected={wrong_score == 0.0}")
print(f"ambiguous_answer_rejected={ambiguous_score == 0.0}")
assert math_verifier("half", r"\boxed{1/0}", r"\boxed{1/2}") == 0.0
try:
    math_verifier("half", r"\boxed{1/2}", r"\boxed{1/0}")
except ValueError as error:
    assert "quarantine" in str(error)
else:
    raise AssertionError("A broken reference must not become candidate reward zero")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1.0
0.0
0.0
equivalent_passes=True
wrong_answer_rejected=True
ambiguous_answer_rejected=True
```
<!-- leetllm: output:end -->

#### Code generation and microVM sandboxing

Testing model-generated software demands strict execution containment. Running untrusted Python code directly on host machines invites system tampering, fork bombs, and network exfiltration of hidden evaluation cases. Interpreter isolation leaves filesystem and kernel access available.

MicroVMs such as Firecracker and application kernels such as gVisor supply stronger execution boundaries.[^firecracker2026HostSetup][^gvisorSecurity2026] Their production security depends on configuration and maintained hosts. Configure least privilege, filesystem mounts, network access, resource budgets, and output limits for your chosen backend. A Docker network flag isn't a universal Firecracker setting, and choosing a sandbox doesn't automatically make every mount read-only or hide every test.

Enforce elapsed-time limits as well as CPU budgets. A sleeping process uses little CPU, so a CPU limit alone doesn't bound elapsed time. Production cancellation must terminate the candidate's complete sandbox or process tree, and bound captured output. The exercise below runs only the fixed, trusted strings shown here in local subprocesses. Python `-I` isolates interpreter environment/import settings; this fixture isn't an execution sandbox for arbitrary model code.

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

def code_verifier(problem: str, code: str, test_cases: list[TestCase]) -> float:
    if not test_cases:
        raise ValueError("A verifier needs test cases")
    for case in test_cases:
        # Candidate process receives inputs, never gold answers or grading authority.
        runner = code + "\nimport json\n" + f"print(json.dumps(solve(*{case.inputs!r})))\n"
        try:
            completed = subprocess.run(
                [sys.executable, "-I", "-c", runner],
                capture_output=True, text=True, timeout=1.0, check=False,
            )
        except subprocess.TimeoutExpired:
            return 0.0
        if completed.returncode != 0:
            return 0.0
        try:
            value = json.loads(completed.stdout)
        except json.JSONDecodeError:
            return 0.0
        # bool is a subclass of int in Python; require an actual integer.
        if type(value) is not int or value != case.expected:
            return 0.0
    return 1.0

cases = [TestCase((14, 12), 168), TestCase((8, 12), 96)]
good = "def solve(a, b):\n    return a * b\n"
bad = "def solve(a, b):\n    return a + b\n"
self_report = 'print(\'{"passed": true}\')\nraise SystemExit(0)\n'
print(f"good_score={code_verifier('multiply', good, cases)}")
print(f"bad_score={code_verifier('multiply', bad, cases)}")
print(f"self_report_score={code_verifier('multiply', self_report, cases)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
good_score=1.0
bad_score=0.0
self_report_score=0.0
```
<!-- leetllm: output:end -->

Keep tests used for optimization as training or regression evidence. Use separately held-out tasks/cases to estimate generalization. Hiding test text from the candidate is useful, but repeated scalar reward feedback can still cause adaptive overfitting. Also split related prompts and references, audit pretraining contamination where feasible, and limit final-test reuse. This authored shortcut fails every held-out case below; expand adversarial coverage to search for additional shortcuts.

<!-- leetllm: test, output=show, output_title="Held-out test check" -->
```python title="held-out-code-tests.py"
from collections.abc import Callable

def shortcut_multiplier(a: int, b: int) -> int:
    known = {(14, 12): 168, (8, 12): 96}
    return known.get((a, b), 0)

def pass_rate(fn: Callable[[int, int], int], cases: list[tuple[int, int, int]]) -> float:
    passed = sum(fn(a, b) == expected for a, b, expected in cases)
    if not cases:
        raise ValueError("An empty suite supplies no correctness evidence")
    return passed / len(cases)

visible = [(14, 12, 168), (8, 12, 96)]
held_out = [(7, 9, 63), (11, 13, 143)]

print(f"visible_pass_rate={pass_rate(shortcut_multiplier, visible):.0%}")
print(f"held_out_pass_rate={pass_rate(shortcut_multiplier, held_out):.0%}")
print(f"ship={pass_rate(shortcut_multiplier, held_out) == 1.0}")
```

<!-- leetllm: output:start -->
```text title="Held-out test check" output compact
visible_pass_rate=100%
held_out_pass_rate=0%
ship=False
```
<!-- leetllm: output:end -->

#### Instruction constraints

Verifiable rewards extend beyond math and code. Tülu 3 used IFEval-derived instruction constraints.[^lambert2024rlvr] The grading contract must say what counts as a bullet. Here is a deliberately weak check that counts only lines starting with `- `:

<!-- leetllm: test, output=show, output_title="Constraint reward" -->
```python title="instruction-constraints.py"
def weak_constraint_reward(response: str) -> float:
    bullets = [line for line in response.splitlines() if line.startswith("- ")]
    return 1.0 if len(bullets) == 3 else 0.0

def constraint_reward(response: str) -> float:
    lines = response.splitlines()
    return float(len(lines) == 3 and all(line.startswith("- ") and line[2:].strip() for line in lines))

valid = "- name the GPU\n- name the slot count\n- name the job total"
too_short = "- name the GPU\n- name the slot count"
extra_prose = valid + "\nThis extra sentence violates the declared three-line contract."
print(constraint_reward(valid))
print(constraint_reward(too_short))
print(f"three_bullets_pass={constraint_reward(valid) == 1.0}")
print(f"two_bullets_rejected={constraint_reward(too_short) == 0.0}")
print(f"extra_prose: weak={weak_constraint_reward(extra_prose):.0f}; strict={constraint_reward(extra_prose):.0f}")
assert constraint_reward("- \n- \n- ") == 0.0
```

<!-- leetllm: output:start -->
```text title="Constraint reward" output compact
1.0
0.0
three_bullets_pass=True
two_bullets_rejected=True
extra_prose: weak=1; strict=0
```
<!-- leetllm: output:end -->

#### Formal logic and SQL solvers

Interactive theorem provers such as Lean 4, Isabelle, and Coq supply formal checking. Freeze the intended theorem and trusted imports outside candidate control. Audit the completed artifact and assumptions, rather than trusting compilation or a candidate's self-reported success.

Lean 4's `#print axioms` reports transitive dependencies. `sorry` uses `sorryAx`, which can inhabit arbitrary types; a finished proof mustn't rely on it.[^leanAxioms2026] Standard mathematical axioms can be legitimate under your contract. Native evaluation also adds compiler-dependent axioms, so "no literal sorry in the response" and "the file compiled" are insufficient audits.

For SQL, define duplicate, NULL, type, and ordering semantics before comparing results. If order is irrelevant, compare row multisets without dropping duplicates. If order matters, require a specified ordering with deterministic tie handling. SQLite leaves row order undefined without `ORDER BY`, and equal sort keys don't fix tie order.[^sqlite2026Select] Test across database snapshots and edge cases to estimate query equivalence.

This fixture consumes authored audit records; it doesn't run a prover or inspect real proof terms:

<!-- leetllm: test, output=show -->
```python title="formal-logic.py"
from dataclasses import dataclass

@dataclass(frozen=True)
class ProverResult:
    accepted: bool
    stderr: str
    theorem_matches: bool = True
    axioms: frozenset[str] = frozenset()

def proof_reward(result: ProverResult) -> float:
    allowed = {"Classical.choice", "propext", "Quot.sound"}
    return float(result.accepted and result.theorem_matches and result.axioms <= allowed)

accepted = proof_reward(ProverResult(accepted=True, stderr=""))
rejected = proof_reward(ProverResult(accepted=False, stderr="unknown identifier"))
print(accepted)
print(rejected)
print(f"accepted_maps_to_one={accepted == 1.0}")
print(f"rejected_maps_to_zero={rejected == 0.0}")
stub = ProverResult(True, "", axioms=frozenset({"sorryAx"}))
changed = ProverResult(True, "", theorem_matches=False)
print(f"compiled_sorry_score={proof_reward(stub):.0f}")
print(f"changed_theorem_score={proof_reward(changed):.0f}")
assert proof_reward(ProverResult(True, "", axioms=frozenset({"Classical.choice"}))) == 1.0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1.0
0.0
accepted_maps_to_one=True
rejected_maps_to_zero=True
compiled_sorry_score=0
changed_theorem_score=0
```
<!-- leetllm: output:end -->

### What can't be verified?

An executable check needs a specification. Some properties of an open-ended task are checkable while its overall quality still needs judgment:

- Creative prose: "Draft three catchy newsletter hooks for our product release" has no objective truth.
- Complex business tradeoffs: "Assess whether migrating to Kubernetes reduces total cost of ownership" admits multiple sound arguments.
- Safety and conversational boundaries: authorization decisions and exact synthetic-secret disclosures can be tested programmatically. Broader toxicity, context-dependent privacy, and refusals without a fixed allow-or-deny rule need policy judgments and complementary evaluation to cover the wider boundary.

```checkpoint
Why must an RLVR verifier fail closed?
---
If parsing errors, timeouts, or malformed outputs accidentally receive reward, training will amplify those loopholes. A malformed answer or a candidate exceeding its declared resource budget gets zero. A verifier outage or invalid reference supplies no trustworthy outcome: pause or quarantine the affected batch, use bounded retries, and record the infrastructure status. Never award a best-effort pass or silently resample until failures disappear.
```

## Group relative policy optimization (GRPO)

DeepSeek-R1 popularized <span data-glossary="grpo">Group Relative Policy Optimization (GRPO)</span>, an algorithm developed in DeepSeekMath that eliminates the learned value model by calculating advantages across a group of rollouts generated for the identical prompt.[^shao2024] DeepSeek-R1 relied on GRPO throughout its reasoning stages.[^deepseekai2025] GRPO is an optimization algorithm, not a synonym for RLVR. Tülu 3 conducted its RLVR experiments using standard <span data-glossary="ppo">PPO</span>.[^lambert2024rlvr]

### What the PPO critic estimates

In standard PPO[^schulman2017], a **critic** (value model $V_\phi(s_t)$) estimates expected future cumulative return from token state $s_t$.

Under terminal reward settings common to LLM post-training, the Monte Carlo advantage with discount 1 is:

$$
A_t = R - V_\phi(s_t)
$$

$R$ is the terminal reward in this simplified setting, with no intermediate charges. If rewards include tokenwise reference penalties or discounts, use the corresponding remaining return instead. Implementations often use Generalized Advantage Estimation (GAE).

A learned critic adds parameters, optimizer state, activations, and execution work. Its share of peak memory depends on model size, sharding, offload, reference residency, and rollout buffers. Removing it doesn't universally halve VRAM. A critic predicts expected return, not the outcome of every sampled continuation: one later arithmetic error isn't proof that an early expectation was wrong.

### The GRPO critic-free mechanism

GRPO removes the separate critic network. Instead of estimating a global value function, it computes <span data-glossary="advantage">advantages</span> by comparing rollouts generated for the exact same prompt in the current batch.

For our 14×12 prompt, correctly extracted 168 earns 1 and 148 earns 0. The group mean supplies a local baseline without a value network. Reward variation supplies the comparative signal; measure optimizer effects on correctness across new prompts.

For prompt $q$, sample a group of $G$ responses $\{o_1, \dots, o_G\}$. The advantage $A_i$ for rollout $i$ is its normalized z-score within the group:

$$
A_i = \frac{r_i - \text{mean}(\{r_1, \dots, r_G\})}{\text{std}(\{r_1, \dots, r_G\})}
$$

Positive advantages encourage the sampled actions under the unclipped reward term; negative advantages encourage the opposite direction. Clipping, regularizers, and shared parameters can alter the actual update. Group members share a prompt, though reward-standard-deviation scaling can change how prompts are weighted against one another.

When all rollouts achieve the same score (such as rewards `[1, 1, 1, 1]` or `[0, 0, 0, 0]`), the group standard deviation evaluates to zero. Division by zero yields undefined advantages; training engines must mask uniform groups or guard the denominator.

```checkpoint
What does a positive GRPO advantage mean?
---
It scored above that prompt group's mean. The reward surrogate encourages its sampled tokens where their positive branch isn't clipped. Each token's final probability also depends on shared parameters, clipping, and the complete optimizer step.
```

The table below works through $G = 8$ candidate rollouts for our GPU cluster prompt, where boxed 168 receives 1.0 and wrong answers receive 0.0:

| Sample | Answer | Reward $r_i$ | Group mean | Group std | Advantage $A_i$ |
|--------|--------|--------------|------------|-----------|-----------------|
| 1 | 168 | 1.0 | 0.5 | 0.5 | +1.0 |
| 2 | 148 | 0.0 | 0.5 | 0.5 | -1.0 |
| 3 | 156 | 0.0 | 0.5 | 0.5 | -1.0 |
| 4 | 168 | 1.0 | 0.5 | 0.5 | +1.0 |
| 5 | 170 | 0.0 | 0.5 | 0.5 | -1.0 |
| 6 | 168 | 1.0 | 0.5 | 0.5 | +1.0 |
| 7 | 144 | 0.0 | 0.5 | 0.5 | -1.0 |
| 8 | 168 | 1.0 | 0.5 | 0.5 | +1.0 |

Four candidates output 168 ($r=1.0$), and four miss ($r=0.0$). The group mean is $4/8 = 0.5$, and the **population** standard deviation (dividing by $G$, not $G-1$) is 0.5. Sample 1's advantage evaluates to $(1.0 - 0.5) / 0.5 = +1.0$, encouraging its generated <span data-glossary="token">tokens</span> under the active reward surrogate. Sample 2's advantage is $(0.0 - 0.5) / 0.5 = -1.0$, supplying the opposite incentive. These are loss contributions, not guarantees about the final probabilities.

Correct completions share identical positive advantage, and incorrect completions share identical negative advantage. GRPO doesn't understand *why* sample 1 succeeded; it recognizes only that sample 1 outperformed the group baseline on this prompt.

<figure>
  <img src="illustrations/_generated/grpo_group_advantages_dark.png" alt="For one 14-by-12 prompt, the eight answers 168, 148, 156, 168, 170, 168, 144, 168 produce rewards 1, 0, 0, 1, 0, 1, 0, 1. Their mean is 0.5 and population standard deviation is 0.5, so the normalized advantages are +1, −1, −1, +1, −1, +1, −1, +1. An all-pass or all-fail group has zero spread and guarded zero advantages; other loss terms may still contribute." />
  <figcaption>The mean and population standard deviation are both 0.5, so passed and failed samples receive +1 and −1. A uniform group uses guarded zero advantages; other objective terms may still update the policy.</figcaption>
</figure>

The GRPO objective applies a PPO-clipped surrogate **per generated token**, averages over tokens within each response, and averages across the group:[^shao2024]

$$
\mathcal L = -\frac{1}{G}\sum_{i=1}^{G}\frac{1}{T_i}\sum_{t=1}^{T_i}
\left[\min\left(\rho_{i,t}A_i,\operatorname{clip}(\rho_{i,t},1-\epsilon,1+\epsilon)A_i\right)-\beta k_{i,t}\right]
$$

$T_i$ counts generated tokens included in the loss, excluding padding and any additional masked positions. The ratio $\rho_{i,t}=\exp(\log\pi_\theta(o_{i,t}\mid q,o_{i,<t})-\log\pi_{old}(o_{i,t}\mid q,o_{i,<t}))$ compares the training policy with the frozen rollout policy. $\epsilon$ sets clipping thresholds; 0.2 is a common choice, not a hard bound on all probability changes.

DeepSeekMath's sample reference term is $k_{i,t}=\exp(\ell_{i,t})-\ell_{i,t}-1$, where $\ell_{i,t}=\log\pi_{ref}-\log\pi_\theta$ at that token/prefix.[^shao2024] Each value is non-negative, but one sample isn't the full distribution's KL. Its expectation equals forward KL under current-policy sampling and shared full support. Rollouts from an older policy need attention to sampling weights and gradient conventions. Modern trainers expose correction choices; $\beta=0$ disables this reference term.

Even an unbiased estimate of the **value** does not guarantee the exact KL **gradient** when sampled tokens are held fixed during backpropagation. At one fixed prefix, let the current token distribution be $p=(0.8,0.2)$ and reference $q=(0.5,0.5)$. Enumerating tokens with weights $p$ gives the exact KL value. Detaching those weights reproduces the expected gradient from directly differentiating fixed-token sample terms, which differs from differentiating the full categorical KL.

This CPU check isolates that distinction without sampling noise:

<!-- leetllm: test, deps=torch==2.13.0, output=show, output_title="KL value and gradient boundary" -->
```python title="kl_value_vs_gradient.py"
import torch

logits = torch.tensor([0.8, 0.2], dtype=torch.float64).log().requires_grad_()
log_p = logits.log_softmax(dim=0)
p = log_p.exp()
log_q = torch.tensor([0.5, 0.5], dtype=torch.float64).log()
log_ratio = log_q - log_p
k = log_ratio.exp() - log_ratio - 1
exact_kl = (p * (log_p - log_q)).sum()
fixed_token_estimate = (p.detach() * k).sum()
enumerated_identity = (p * k).sum()
true_gradient, = torch.autograd.grad(exact_kl, logits, retain_graph=True)
fixed_gradient, = torch.autograd.grad(fixed_token_estimate, logits, retain_graph=True)
identity_gradient, = torch.autograd.grad(enumerated_identity, logits)
assert torch.allclose(exact_kl, fixed_token_estimate)
assert torch.allclose(true_gradient, identity_gradient)
assert not torch.allclose(true_gradient, fixed_gradient)
print(f"both KL values={exact_kl.item():.6f}")
print("full KL gradient:", [round(v, 6) for v in true_gradient.tolist()])
print("fixed-token gradient:", [round(v, 6) for v in fixed_gradient.tolist()])
```

<!-- leetllm: output:start -->
```text title="KL value and gradient boundary" output compact
both KL values=0.192745
full KL gradient: [0.221807, -0.221807]
fixed-token gradient: [0.3, -0.3]
```
<!-- leetllm: output:end -->

The full expectation changes both token probabilities and per-token terms. A sampled estimator needs the corresponding treatment of that distribution change to recover the full gradient. A training implementation may deliberately use a fixed-token regularizer instead. Record its sampling and differentiation conventions; equal logged KL values don't establish equal policy updates.

For outcome rewards, each included token inherits $A_i$. The displayed objective is DeepSeekMath's token-level form. R1's report uses response-level notation; a raw product of token ratios and tokenwise clipping define different surrogates. DAPO instead divides the accumulated token loss by the total active-token count and separates upper/lower clip thresholds.[^yu2025dapo] Sequence-based variants also exist; identify the formula your implementation actually runs.

For a uniform reward group, guarded normalization sets $A_i=0$. That removes this group's reward-surrogate gradient; enabled KL, entropy, or other terms can still contribute, and other prompts can update shared parameters. DeepSeekMath used $G=64$; more draws can increase the chance of seeing mixed outcomes, not guarantee it.[^shao2024] DAPO dynamically filters uniform groups and samples more to fill an informative batch.[^yu2025dapo] This changes task weighting and costs extra generation. Bound the sampling budget and report discarded groups instead of looping indefinitely on a policy that never succeeds.

> **Variance insight:** Three failures and one success produce nonzero reward <span data-glossary="variance">variance</span>. This supplies nonzero advantages. Clipped branches, gradient cancellation, and other terms can still make the final parameter gradient zero.

Our diagnostic script detects which prompt groups supply comparative gradient signals:

<!-- leetllm: test, output=show, output_title="Reward spread diagnostic" -->
```python title="reward-spread-diagnostic.py"
def population_std(values: list[float]) -> float:
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    return variance ** 0.5

groups = {
    "mixed": [0.0, 0.0, 0.0, 1.0],
    "all_fail": [0.0, 0.0, 0.0, 0.0],
    "all_pass": [1.0, 1.0, 1.0, 1.0],
}

for name, rewards in groups.items():
    std = population_std(rewards)
    informative = std > 0.0
    print(f"{name}: std={std:.3f}, informative={informative}")

# Under independent binary outcomes, mixed-group probability is 1-p**G-(1-p)**G.
p, size = 0.01, 64
mixed_probability = 1 - p ** size - (1 - p) ** size
print(f"p={p:.0%}, G={size}: mixed-group chance={mixed_probability:.1%}")
assert 0.47 < mixed_probability < 0.48
assert 1 - 0.0 ** size - (1 - 0.0) ** size == 0
```

<!-- leetllm: output:start -->
```text title="Reward spread diagnostic" output compact
mixed: std=0.433, informative=True
all_fail: std=0.000, informative=False
all_pass: std=0.000, informative=False
p=1%, G=64: mixed-group chance=47.4%
```
<!-- leetllm: output:end -->

This PyTorch exercise enumerates eight authored categorical outcomes. It doesn't generate text, run a transformer, or perform a complete RLVR training loop. At the initial uniform distribution ($1/8$), its sample reference term and gradient are zero. One small reward update increases rewarded mass in this fixture; four independent scalar probes check clipping branches.

<!-- leetllm: test, deps=torch, output=show -->
```python title="categorical-policy-update.py"
import torch

def group_advantages(rewards):
    if rewards.numel() < 2 or not torch.isfinite(rewards).all():
        raise ValueError("Need at least two finite rewards")
    std = rewards.std(correction=0)
    return torch.zeros_like(rewards) if std == 0 else (rewards - rewards.mean()) / std

def clipped_surrogate(ratio, advantage, epsilon=0.2):
    return torch.minimum(ratio * advantage, ratio.clamp(1-epsilon, 1+epsilon) * advantage)

rewards = torch.tensor([1., 0., 0., 1., 0., 1., 0., 1.], dtype=torch.float64)
advantages = group_advantages(rewards)
logits = torch.zeros(8, dtype=torch.float64, requires_grad=True)
old_log_probs = logits.detach().log_softmax(dim=0)
reference_log_probs = old_log_probs.clone()
log_probs = logits.log_softmax(dim=0)
ratios = (log_probs - old_log_probs).exp()
log_ref_ratio = reference_log_probs - log_probs
kl_samples = log_ref_ratio.exp() - log_ref_ratio - 1
loss = -clipped_surrogate(ratios, advantages).mean() + 0.01 * kl_samples.mean()
loss.backward()
assert torch.allclose(logits.grad, -advantages / 8)
with torch.no_grad():
    logits -= 0.1 * logits.grad
    probabilities = logits.softmax(dim=0)
assert torch.isclose(probabilities.sum(), torch.tensor(1., dtype=torch.float64))
assert (probabilities.log() <= 0).all()
assert probabilities[rewards == 1].sum() > 0.5
assert torch.equal(group_advantages(torch.ones(8)), torch.zeros(8))
# Positive advantages plateau above 1.2; negative ones plateau below 0.8.
for value, advantage, gradient in [(1.3, 1., 0.), (0.7, -1., 0.), (0.7, 1., 1.), (1.3, -1., -1.)]:
    ratio = torch.tensor(value, requires_grad=True)
    clipped_surrogate(ratio, advantage).backward()
    assert ratio.grad.item() == gradient
print("advantages:", advantages.tolist())
print(f"initial_loss={loss.item():.6f}")
print(f"rewarded_probability_before=0.500000; after={probabilities[rewards == 1].sum().item():.6f}")
print("normalization, all-equal rewards, and four clipping branches: PASS")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
advantages: [1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0]
initial_loss=0.000000
rewarded_probability_before=0.500000; after=0.506250
normalization, all-equal rewards, and four clipping branches: PASS
```
<!-- leetllm: output:end -->

| Dimension | PPO policy optimization | GRPO |
|-----------|------------------------|------|
| **Baseline value** | Predicted by parameterized critic model | Mean reward across group rollouts |
| **Additional value-model state** | Parameters, optimizer state, and activations for its critic | No learned critic; rollout and other state remain |
| **Primary risk** | Critic value estimation drift | Uniform groups lack comparative gradient |
| **Reward flexibility** | Continuous or binary signals | Continuous or binary signals, ideal for verifiers |

### A trainer name doesn't specify the objective

As checked October 10, 2026, TRL's GRPO guide defaults to `loss_type="dapo"`, `scale_rewards="group"`, token-level importance sampling, and `beta=0.0`.[^huggingface2026grpotrainer] That default has no loaded reference model or reference-KL term. The guide also supports sequence-based ratios and other normalizers. Our worked population-standard-deviation calculation uses an explicit teaching convention; library defaults vary. Record version, reduction, scaling, masking, clipping, sampling distribution, and KL settings with your result. Switching one can change the experiment even when the class name stays `GRPOTrainer`. A full run must also define how it mixes a cold start, verifier rewards, and later preference scores. DeepSeek-R1's report gives one public training recipe with multiple stages.

## DeepSeek-R1 training pipeline

DeepSeek-R1's original January 2025 report describes four SFT/RL stages.[^deepseekR1Original2025] This is a historical case study, not a mandatory contemporary recipe. Distinguish it from R1-Zero, which started RL directly from DeepSeek-V3-Base without a preliminary reasoning SFT stage.

The original report's R1-Zero training curve rose from 15.6% to 71.0% on AIME 2024. Its figure estimates single-answer accuracy by averaging 16 sampled responses per question; Table 2 reports 86.7% for **consensus over 64 samples**.[^deepseekR1Original2025] The expanded report updates the training-curve endpoint to 77.9%.[^deepseekai2025] These are version-specific reported results. Averaging correctness labels to estimate pass@1 isn't the same operation as voting to choose one answer.

The original January 2025 report lays out the sequence for DeepSeek-R1: Stage 1 uses readable cold-start SFT; Stage 2 applies GRPO with accuracy, format, and language-consistency rewards. Its filtered traces feed Stage 3 SFT initialized from DeepSeek-V3-Base with reasoning and general instruction data. Stage 4 combines reasoning rewards with preference reward models for general behavior.

### Stage 1: add a cold start when the task benefits

DeepSeek-R1-Zero demonstrated that large base models can discover reasoning behaviors through pure RLVR without initial supervised fine-tuning.[^deepseekai2025]

R1-Zero had readability and language-mixing problems. For R1, the team used several thousand curated traces to fine-tune DeepSeek-V3-Base before RL.[^deepseekR1Original2025] A <span data-glossary="cold-start">cold start</span> can increase valid outputs or useful exploration. Measure format, target language, and task success on held-out prompts. Diagnose whether low reward comes from syntax, inadequate capability, task difficulty, or a broken reference before choosing the intervention.

### Stage 2: reasoning RL (GRPO)

The original report names coding, mathematics, **science**, and logical reasoning with well-defined solutions. It adds a language-consistency **reward**, the proportion of target-language **words** in the chain of thought, summed with accuracy reward.[^deepseekR1Original2025] The paper reports a slight capability loss in its ablation in exchange for readability. This targets language mixing without guaranteeing its elimination.

Under our outcome-gated design, a wrong final answer earns zero. A composite reward that pays independently for format or language can behave differently; inspect its components.

### Stage 3: rejection sampling and SFT

Once the RL policy produces high-accuracy reasoning traces, those rollouts become training data for subsequent supervised runs. DeepSeek-R1 sampled hundreds of thousands of candidate solutions, filtering them through programmatic verifiers and DeepSeek-V3 judges.[^deepseekai2025]

The original report collected about 600k reasoning samples and 200k non-reasoning samples. Some reasoning samples were accepted using DeepSeek-V3 judgments rather than programmatic proof. It fine-tuned **DeepSeek-V3-Base** for two epochs on the combined 800k; it wasn't simply an SFT continuation from the preceding RL checkpoint.[^deepseekR1Original2025]

### Stage 4: final RL

The final stage targets helpfulness and harmlessness alongside reasoning across varied prompts.[^deepseekR1Original2025] Reasoning-only specialization can leave gaps in chat behavior; it doesn't inevitably cause overthinking or loss of tone.

This stage blends two distinct reward streams:
1. **Rule-based rewards** to preserve competitive math, coding, and logical reasoning accuracy.
2. **Preference reward models** for general behavior. The original report evaluates helpfulness on the final summary and harmlessness on the whole response, including reasoning. Those rewards target desired behavior; they don't certify safety.

## Observed reasoning patterns

Outcome-based RL doesn't use step-level annotations. During DeepSeek-R1-Zero training, responses lengthened significantly while displaying verification, backtracking, and reflection patterns.[^deepseekai2025] Treat these as emergent output patterns reinforced by terminal rewards.

### Self-verification patterns

Trained models frequently pause to audit intermediate calculations:

> "Wait, let me double-check that calculation. $14 \times 12$ is $168$, not $148$. I made a mistake."

The expanded report observes reflective words becoming more frequent during RL, including later spikes in “wait.”[^deepseekai2025] R1-Zero skipped preliminary reasoning SFT; its pretraining corpus may still have included such demonstrations or words. The GPU sentence above is an authored illustration. Word frequency is observational; use causal interventions to study whether a token contributes to correction, and evaluate written explanations separately from internal mechanisms.

### Backtracking patterns

Models frequently abandon unpromising reasoning directions:

> "Counting slots as $14 + 12$ seems wrong. Let me multiply instead."

While this mimics tree search, the model remains an autoregressive generator updating token probabilities via group advantage. The verifier credits the final answer; it can't verify whether the pivot was necessary.

### Extended thought and the reasoning tax

Response length expanded dramatically during R1-Zero training as accuracy improved.[^deepseekai2025] This dynamic links RLVR directly to <span data-glossary="test-time-compute">test-time compute</span>.

Longer responses consume generation work and can increase latency and cost, depending on serving and accounting. Measure lengths and utility by prompt class. Compare shortened-budget or thinking-mode settings on your tasks rather than assuming every extra token helps.

> **Research caution:** Shao et al. reported MATH-500 accuracy gains of 21.4 percentage points with random rewards on Qwen2.5-Math-7B, versus 29.1 with ground-truth rewards.[^shao2025spurious] The same study generally found weak or harmful spurious-reward gains on tested Llama 3 and OLMo 2 variants. Its clipping ablations matter too. This is model/setup-specific evidence, not an independent replication or proof that reward truth is irrelevant. Compare reward baselines where useful and measure <span data-glossary="pass-at-k">pass@1 and pass@k</span> at stated budgets and sampling settings.

## Reward hacking and failure modes

Optimization pressure moves onto the checker. RLVR does not remove exploitation. It changes the target from a learned preference model to the verifier's rules.

Adversarially probe verifiers before starting large RL runs. A policy can learn to exploit parser loopholes or execution quirks that receive reward. Test known edge cases and mutate inputs to find additional flaws before training.

### Format gaming

Format rewards can overshadow correctness if weighted improperly. Awarding generous credit for wrapping answers in `\boxed{...}` teaches models to emit beautifully formatted incorrect answers. Parsers that accept arbitrary lines risk rewarding outputs containing multiple conflicting guesses.

For a product contract that gives correctness priority, auxiliary credit mustn't make an incorrect answer outrank a correct one. Gating is one design; weighted independent shaping is another with tradeoffs. Predict what goes wrong in this deliberately broken reward:

<!-- leetllm: test, output=show, output_title="Format reward trap" -->
```python title="format-reward-trap.py"
import re

def boxed_value(response: str) -> int | None:
    if response.count(r"\boxed") != 1:
        return None
    matches = re.findall(r"\\boxed\{([0-9]{1,20})\}", response)
    return int(matches[0]) if len(matches) == 1 else None

def broken_reward(response: str, expected: int) -> float:
    value = boxed_value(response)
    return 0.7 if value is not None else (0.3 if str(expected) in response else 0.0)

def gated_reward(response: str, expected: int) -> float:
    value = boxed_value(response)
    return 1.0 if value == expected else 0.0

wrong_boxed = r"The answer is \boxed{148}."
right_plain = "The answer is 168."

print(f"broken_prefers_wrong={broken_reward(wrong_boxed, 168) > broken_reward(right_plain, 168)}")
print(f"gated_wrong_boxed={gated_reward(wrong_boxed, 168)}")
```

<!-- leetllm: output:start -->
```text title="Format reward trap" output compact
broken_prefers_wrong=True
gated_wrong_boxed=0.0
```
<!-- leetllm: output:end -->

### Shortcut exploitation

Biased prompt distributions create trivial shortcuts (such as multiple-choice answers clustering on option C). In coding tasks, candidate code that exploits unisolated environments or returns dummy objects can trick naive test harnesses into reporting passing status.

### Mitigation strategies

Defend RLVR training pipelines with these engineering practices:

- Parsing and execution contracts: specify the final-answer field, accepted syntax, resource budgets, and isolation. Under our single-box contract, ambiguity earns zero; malformed gold data remains a separate fault.
- Difficulty and sampling: inspect pass/fail variation, duplicates, and failed measurements. DAPO-style filtering can help, but changes sampling weights and needs a generation budget.[^yu2025dapo]
- Independent evaluation: reserve tasks/cases from optimization and final-test reuse. A second solver can expose disagreement, though correlated bugs can survive both.
- Length shaping: evaluate truncation and utility by length. DAPO's soft overlong penalty grows in a buffer near the maximum; it can also discourage valid long solutions. It removes KL in its reported setup.[^yu2025dapo]

<figure>
  <img
    src="illustrations/_generated/verifier_pressure_map_dark.png"
    alt="The same literal response text contains boxed output 168 followed by boxed output 148, and both parser rules receive the whole response. A first-match rule selects 168 and returns reward 1 while missing 148; a single-box gate counts two markers, rejects ambiguity, and returns 0. A clean single boxed output 168 passes bounded Fraction equality."
  />
  <figcaption>
    The same full response reaches both parsers. First-match ignores the later contradictory box; the single-box contract rejects the ambiguity before comparing values.
  </figcaption>
</figure>

## When RLVR breaks

Set evaluation criteria before training. Investigate reward gains paired with held-out or product regressions, using repeated measurements and uncertainty. Treat score changes within measurement noise as inconclusive; repair a confirmed required-gate failure before promotion.

### Forcing a checker onto a subjective task

A three-bullet checker can verify format for a creative answer without judging its quality. A mixed task can combine executable and preference signals. State which requirements remain outside the checker rather than claiming a weak rule establishes taste, nuance, or policy compliance.

### Treating cold-start SFT as always required or never useful

R1-Zero is an empirical example of RL without preliminary reasoning SFT.[^deepseekai2025] R1 used a cold start for readability and performance. Near-zero reward warrants a diagnosis: validate the checker first, inspect generated syntax, then compare warmer starts, easier tasks, and sampling settings. Measure whether SFT improves exploration for the target model and task.

### Celebrating format accuracy

High tag compliance with low answer accuracy shows the two properties differ. Track reward components separately. If your contract requires correctness to outrank formatting, choose a reward composition that enforces that priority rather than inferring competence from tag compliance.

### Ignoring general capability drift

Specialization can change instruction following or chat utility; it doesn't inevitably increase false refusal. Broad drift also isn't diagnosed by a reasoning score alone. Compare held-out product evaluations against a comparable baseline. KL regularization, data mixtures, or another training stage are interventions to test, not guarantees of preservation; some reasoning recipes deliberately omit KL.

The following scores and thresholds are authored. This arithmetic gate illustrates a product rule. Measure statistical significance, model quality, and any causal effect of RLVR in a separate evaluation:

<!-- leetllm: test, output=show, output_title="Capability gate output" -->
```python title="capability-regression-gate.py"
baseline = {"checked_reasoning": 0.61, "instruction_following": 0.92, "false_refusal": 0.04}
candidate = {"checked_reasoning": 0.74, "instruction_following": 0.81, "false_refusal": 0.13}

violations = []
if candidate["checked_reasoning"] <= baseline["checked_reasoning"]:
    violations.append("no reasoning gain")
if candidate["instruction_following"] < baseline["instruction_following"] - 0.03:
    violations.append("instruction following regressed")
if candidate["false_refusal"] > baseline["false_refusal"] + 0.02:
    violations.append("false refusals increased")

print(f"reasoning_gain_pp={100 * (candidate['checked_reasoning'] - baseline['checked_reasoning']):+.0f}")
print(f"ship={not violations}")
print(violations)
```

<!-- leetllm: output:start -->
```text title="Capability gate output" output compact
reasoning_gain_pp=+13
ship=False
['instruction following regressed', 'false refusals increased']
```
<!-- leetllm: output:end -->

### Treating RLVR and distillation as rivals

RLVR uses executable reward feedback for policy updates. R1's original distillation stage used its approximately 800k curated samples for smaller Qwen/Llama students, including non-reasoning data.[^deepseekR1Original2025] This was response-level supervised training, not an online student reward loop. More general distillation also transfers teacher distributions or other signals.

## A tiny verifier lab

Every failure above depends on the checker's return value. You can see that contract in one Python script and a few arithmetic problems. No cluster is required.

Treat verifier modifications with the same rigor as model changes: freeze held-out prompt sets, replay adversarial edge cases, and ensure fail-closed behavior before resuming RL runs.

> **Checkpoint:** Here we require one boxed numeric field. Which errors belong to the candidate, and which mean the reference or checking process must be repaired?

Exercise: construct a verifier that accepts raw model text and returns 1.0 for correct answers and 0.0 otherwise, evaluated on these pairs:

| Prompt | Ground truth |
|--------|--------------|
| "A GPU batch runner has 14 workers with 12 slots each. How many concurrent jobs fit?" | 168 |
| "A scheduler runs 8 jobs per wave. How many waves are needed for 96 jobs?" | 12 |
| "A request budget is 47.50 GPU-seconds with a 6% overhead. What's the total?" | 50.35 |

Step 1: Write `extract_answer(text: str) -> str | None` requiring exactly one `\boxed{...}` marker. Reject missing or duplicated markers.

Step 2: Write `verify(prompt, response, ground_truth, abs_tol="0")` returning 1.0 or 0.0. Keep reference and tolerance as bounded decimal strings (or integer references). Job counts use tolerance zero; any nonzero tolerance must come from the task specification.

Step 3: Test your verifier against these three completions:
1. "There are 14 workers and 12 slots each. 14 × 12 = 168. The answer is $\boxed{168}$." (Expected: 1.0)
2. "The total is $\boxed{148}$." (Expected: 0.0)
3. "It might be $\boxed{168}$ or $\boxed{148}$." (Expected: 0.0)

<!-- leetllm: test, output=show -->
```python title="a-tiny-verifier-lab.py"
import re
from decimal import Decimal
from fractions import Fraction

def extract_answer(text: str) -> str | None:
    if len(text) > 4096 or text.count(r"\boxed") != 1:
        return None
    boxed = re.findall(r"\\boxed\{(-?[0-9]{1,20}(?:\.[0-9]{1,20})?)\}", text)
    return boxed[0] if len(boxed) == 1 else None

def parse_reference(value: int | str) -> Fraction:
    if type(value) is not int and not isinstance(value, str):
        raise ValueError("Use an integer or bounded decimal string")
    text = str(value)
    if re.fullmatch(r"-?[0-9]{1,20}(?:\.[0-9]{1,20})?", text) is None:
        raise ValueError("Reference is outside the declared numeric contract")
    return Fraction(Decimal(text))

def verify(prompt: str, response: str, ground_truth: int | str, abs_tol: str = "0") -> float:
    # Invalid references raise before evaluating candidate syntax.
    expected, tolerance = parse_reference(ground_truth), parse_reference(abs_tol)
    if tolerance < 0:
        raise ValueError("Tolerance must be nonnegative")
    answer = extract_answer(response)
    if answer is None:
        return 0.0
    # Fraction subtraction avoids Decimal context rounding and binary float error.
    difference = abs(Fraction(Decimal(answer)) - expected)
    return float(difference <= tolerance)

prompt = "A GPU batch runner has 14 workers with 12 slots each. How many concurrent jobs fit?"
correct_score = verify(prompt, r"There are 14 workers and 12 slots each. 14 * 12 = 168. The answer is \boxed{168}.", 168)
wrong_score = verify(prompt, r"The total is \boxed{148}.", 168)
ambiguous_score = verify(prompt, r"It might be \boxed{168} or \boxed{148}.", 168)

print(correct_score)
print(wrong_score)
print(ambiguous_score)
print(f"correct_passes={correct_score == 1.0}")
print(f"wrong_rejected={wrong_score == 0.0}")
print(f"ambiguous_rejected={ambiguous_score == 0.0}")
assert verify("overhead", r"\boxed{50.35}", "50.35") == 1.0
assert verify("overhead", r"\boxed{50.36}", "50.35", "0.01") == 1.0
assert verify("overhead", r"\boxed{50.361}", "50.35", "0.01") == 0.0
assert verify("exact", r"\boxed{12345678901234567890.12345678901234567891}",
              "12345678901234567890.12345678901234567890") == 0.0
try:
    verify("reference fault", "malformed candidate", "NaN")
except ValueError:
    pass
else:
    raise AssertionError("Invalid references need a separate fault, not reward zero")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1.0
0.0
0.0
correct_passes=True
wrong_rejected=True
ambiguous_rejected=True
```
<!-- leetllm: output:end -->

## RLVR and distillation

RLVR uses reward feedback; distillation supplies teacher-derived supervision. R1 combined these interventions. Its 800k-sample distillation mix included roughly 600k reasoning samples and 200k general samples in the original report.[^deepseekR1Original2025] It wasn't 800k programmatically proven reasoning traces.

| Dimension | **RLVR** | **Distillation** |
|-----------|----------|------------------|
| **Supervision origin** | Executable rewards for sampled candidates | Teacher outputs, distributions, or other transferred signals |
| **Optimization goal** | Increasing the specified verifier-based reward | Matching teacher signals; response SFT uses token cross-entropy |
| **Compute footprint** | Generation, verification, and policy updates | Teacher/data generation plus student training; cost varies |
| **Core dependency** | Reliable checks for the intended property | Useful teacher signals and suitable student training data |
| **Primary application** | Improving properties covered by verification | Transferring useful teacher behavior to a student |
| **Vulnerability** | Verifier gaming and zero-variance collapse | Inheriting teacher blind spots and distribution limits |

In the original report's Table 6, the distilled Qwen2.5-32B scored 72.6% AIME 2024 pass@1 versus 47.0% for its directly RL-trained 32B comparison.[^deepseekR1Original2025] This is evidence for that teacher/data/training setup, not a budget-matched theorem that distillation always wins. A weak teacher can limit transferred examples; RL exploration can also fail when the policy cannot reach passing outcomes. Compare both interventions with held-out tasks and complete compute accounting.

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
    "explanation": "K earns 0 because the worker measured a violation of the candidate’s time limit. The deadline in M belongs to the verifier service, so M has no measured score. Reversing those entries assigns both timeouts to the wrong owner. P stays unscored because the grader needs a valid reference before judging the missing field. Keep M and P out of the reward group and retain their records for investigation."
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
    "explanation": "The exact differences are 0.01 and 0.011. A passes the inclusive tolerance; B exceeds it. C violates the single-marker contract regardless of its numeric values. Decimal-string/Fraction comparison preserves the boundary without binary rounding."
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
    "explanation": "JSON true is a Boolean. Treating it as 1 skips the host’s type check. The integer 27 matches in both type and value. The table stores 30 under (5, 6). Looking up (6, 5) misses that entry even though the products are equal. Predicting a lookup pass assumes the policy can reverse the pair or multiply the inputs. It can do neither."
  },
  {
    "question": "A proof checker accepts a proof of the requested theorem. The contract permits only Classical.choice, propext and Quot.sound. The audit lists propext and Task.assumption. An unordered SQL check expects one column with rows [4, NULL, 7, NULL]. Query X returns [NULL, 7, 4, 4]. Query Y returns [NULL, 7, NULL, 4]. Does the proof pass the dependency audit, and which queries match?",
    "options": [
      "Proof fails. Both queries match.",
      "Proof passes. Only Y matches.",
      "Proof fails. Only Y matches.",
      "Proof passes. Both queries match."
    ],
    "answer": "Proof fails. Only Y matches.",
    "explanation": "The proof uses Task.assumption, which the contract does not permit. Trusting acceptance alone would miss that dependency. The expected result has two NULL rows, one 4 and one 7. Y has those counts in a different order, which the contract allows. X returns two copies of 4 and only one NULL. Comparing just distinct values or total row counts would accept both queries."
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
    "explanation": "The rewards sum to 28, so their mean is 7. Subtracting 7 gives [2, −4, 4, −2]. Their squares sum to 40. The population variance is 40/4 = 10. Divide each difference by √10 to get the advantages. Keeping the differences skips scaling. Using √(40/3) applies the sample standard deviation. Dividing by 10 uses the variance itself."
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
    "explanation": "Both ratios clip to 1.2. For A, the smaller of 1.4 × 2 and 1.2 × 2 is 2.4. For B, the smaller of 1.5 × (−2) and 1.2 × (−2) is −3.0. Using both raw products gives 2.8 for A. Using both clipped products gives −2.4 for B. The denominator is the probability under the rollout policy that sampled the token. The KL reference policy serves a separate drift penalty."
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
    "explanation": "The response means are 4 and 1, whose mean is 2.5. Global token averaging sums 3×4+5×1=17 over 8 tokens, giving 17/8=2.125. Different reductions weight long responses differently even with unchanged tokens and per-token terms."
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
    "explanation": "Subtract all-pass 0.2³=0.008 and all-fail 0.8³=0.512 from 1 to obtain 0.480. Filtering cannot guarantee an informative group inside a finite budget. Retain discarded work and exhaustion evidence; unbounded resampling changes cost and task weighting."
  },
  {
    "question": "For a target of 24, a model gives seven answers [24, 23, 25, 24, 23, 24, 25]. Separately, a checker filters a teacher’s solutions, and a student trains by predicting the next token in those saved solutions. What are the mean correctness, the modal answer, and the student’s training method?",
    "options": [
      "3/7, no consensus, distillation by SFT",
      "7/7, consensus 24, distillation by SFT",
      "3/7, consensus 24, RLVR",
      "3/7, consensus 24, distillation by SFT"
    ],
    "answer": "3/7, consensus 24, distillation by SFT",
    "explanation": "Three of seven answers equal 24. Seeing at least one correct answer gives a hit for the group, but only those three draws contribute to mean correctness. Both 23 and 25 get two votes. With three votes, 24 wins the plurality even though it lacks a majority. The checker selected teacher examples. The student fits their tokens by supervised fine-tuning. RLVR would use rewards on the student’s sampled responses to update its policy."
  },
  {
    "question": "A predeclared product gate allows at most 3 percentage points of instruction decline and 2 points of refusal rise. Baseline is checked reasoning 60%, instructions 94%, unnecessary refusal 4%. Candidate A is 72%, 92%, 5%; B is 75%, 90%, 4%. Treat these supplied point estimates as the declared worksheet. Which eligibility and A reasoning gain follow?",
    "options": [
      "A holds; B passes; A gain 12 percentage points.",
      "A passes; B passes; A gain 20 percentage points.",
      "A passes; B holds; A gain 12 percentage points.",
      "A holds; B holds; A gain 12 percentage points."
    ],
    "answer": "A passes; B holds; A gain 12 percentage points.",
    "explanation": "A improves reasoning 12 percentage points while instruction decline 2 points and refusal rise 1 point meet both limits. B loses 4 instruction points and holds despite the larger reasoning gain. Deployment readiness requires comprehensive regression test suites and statistical significance testing beyond a single summary score."
  }
]
```

> **Next:** Continue to [Knowledge Distillation for LLMs](/learn/knowledge-distillation-llms). RLVR can raise a teacher's checked pass rate when a verifier exists. Distillation asks how to copy useful teacher behavior into a smaller model you can actually serve, without running that RL loop on the student.
