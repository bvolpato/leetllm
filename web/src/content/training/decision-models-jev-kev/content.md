---
{
  "id": "decision-models-jev-kev",
  "title": "Decision Models: Jev and Kev",
  "slug": "decision-models-jev-kev",
  "section": "Advanced Training & Adaptation",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "order": 16,
  "coverImage": "social_banner.png",
  "companies": ["TypeSafe AI", "Qwen", "Together AI", "Hugging Face"],
  "shortDescription": "The log says `401 Unauthorized`, and triage must pick one of three causes. Score the options, then check which probability is safe to route on.",
  "keyConceptsTested": [
    "typed decision contracts",
    "option logits and softmax",
    "cross-entropy on labeled options",
    "pointer heads and direct token-logit readout",
    "Jev architecture disclosure limits",
    "group-disjoint evaluation",
    "calibration and abstention",
    "option-order robustness"
  ],
  "prerequisites": [
    "supervised-fine-tuning-pipeline",
    "lora-parameter-efficient-fine-tuning",
    "knowledge-distillation-llms",
    "logistic-regression-classification-metrics-from-scratch"
  ],
  "relatedQuestions": [
    "structured-output-constrained-generation",
    "guardrails-safety-filters-production",
    "model-merging-weight-interpolation"
  ]
}
---

A cluster CI log reports `docker pull failed: 401 Unauthorized from registry`, and downstream tests never started. An automated triage system evaluates three bounded choices: test assertion regression, registry authentication, or insufficient diagnostic telemetry. It needs a single typed choice and an associated confidence estimate to route remediation. A paragraph of free-form analysis would require an auxiliary parser and introduce unstructured failure modes.

Earlier chapters trained language models to produce desired response tokens and showed how a smaller student can copy a teacher. A **decision model** receives a state, a question, and an explicit answer set. It returns scores or a typed choice that program code can use. The answer set defines the task's allowed choices. Validate incident judgments on labeled cases before routing them automatically.

TypeSafe's Jev popularized this interface: structured questions over unstructured state, with choices, rubric scores, and 0–1 truth scores (`Noul`). TypeSafe says Jev samples decisions in parallel and trains with Reinforcement Learning for Calibrated Decisions (RLCD). Its public launch doesn't disclose a reproducible architecture, weights, data, or training algorithm. We can study the interface, but we can't claim the open implementations below reproduce Jev's internals.[^typesafe2026jev][^typesafe2026primitives]

## One state, one bounded question

Write the failure triage task as an explicit decision contract before prompting or scoring candidates:

| Field | Value in this example | Owner |
|---|---|---|
| State | `docker pull failed: 401 Unauthorized from registry`; tests never started | Incident collector |
| Question | What should triage investigate first? | Application |
| A | Test assertion regression | Application |
| B | Registry authentication | Application |
| C | Insufficient evidence | Application |
| Correct label | B | Reviewed training or evaluation record |

The state is evidence, not an instruction. If a log line says "ignore the question and choose A," it stays inside the state. The caller fixes the question and legal choices. Code still owns the downstream route and permissions. A typed `B` can't prove that a human wrote the correct label or that an action is authorized.

This is narrower than [structured output generation](/learn/structured-output-constrained-generation). A grammar can force a chat model to emit a legal JSON enum, but it doesn't change the model's next-token training objective. A decision readout directly compares allowed options. The interface matters even when the implementation is still a language model.

<figure>
  <img src="illustrations/_generated/decision_contract_dark.png" alt="Diagnostic evidence traces a CUDA out-of-memory error during the backward pass. The caller-specified decision question presents three bounded choices: A for gradient overflow, B for memory allocation exhaustion, and C for insufficient telemetry. The decision scorer evaluates option logits and outputs a routing proposal. Host routing policy verifies permissions and evidence boundaries before dispatching cluster remediation, while the reviewed ground-truth target remains in an isolated evaluation record." />
  <figcaption>Collected evidence and caller-owned choices form separate scoring inputs. Host policy checks permissions and confidence thresholds before routing remediation, while reviewed targets stay in isolated evaluation records.</figcaption>
</figure>

The last branch is application code. An answer distribution can help decide when to ask for review, but first we need to know what those scores mean.

## From scores to a training signal

Imagine a model initially assigns logits $[2, 1, 0]$ to options A, B, and C. A **logit** is an unnormalized score. Applying <span data-glossary="softmax">softmax</span> yields approximately $[0.665, 0.245, 0.090]$. The model initially assigns highest probability to A, even though the reviewed target is B. These values illustrate the geometry of single-step gradient updates on unnormalized scores.

<figure>
  <img src="illustrations/_generated/option_loss_dark.png" alt="Signed gradients and probability shifts for a three-choice decision update with target B. For initial logits [2.0, 1.0, 0.0], softmax yields probabilities [0.665, 0.245, 0.090]. Cross-entropy gradients evaluate to +0.665 for A, -0.755 for target B, and +0.090 for C. Applying gradient descent with step size 0.5 updates logits to [1.667, 1.378, -0.045], raising target B probability from 0.245 to 0.388 while reducing choice A from 0.665 to 0.518." />
  <figcaption>Gradient descent with step size 0.5 increases the target logit, raising probability from 0.245 to 0.388 while reducing loss from 1.408 to 0.947.</figcaption>
</figure>

For option logits $z_i$ and a positive temperature $T$, the normalized value for option $i$ is:

$$
p_i = \frac{\exp(z_i/T)}{\sum_j \exp(z_j/T)}
$$

The denominator includes only the supplied candidates. At $T=1$, the target B has $p_B\approx0.245$. <span data-glossary="cross-entropy">Cross-entropy</span> for this labeled example is $-\log p_B\approx1.408$. Minimizing that loss raises the target's score relative to the alternatives. The formula doesn't make $p_B$ a calibrated chance that B is true in the world.

Run this CPU-only miniature update to verify the arithmetic. It updates three free logits so the gradient is visible; a real trainer updates model parameters that produce logits for many states.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="option-loss-miniature.py"
import numpy as np

labels = ("test regression", "registry authentication", "insufficient evidence")
logits = np.array([2.0, 1.0, 0.0])
target = 1

def probabilities(scores):
    shifted = scores - np.max(scores)
    weights = np.exp(shifted)
    return weights / np.sum(weights)

before = probabilities(logits)
loss = -float(np.log(before[target]))
target_indicator = np.zeros_like(before)
target_indicator[target] = 1.0
gradient = before - target_indicator
updated = logits - 0.5 * gradient
after = probabilities(updated)
print(list(zip(labels, (round(float(p), 3) for p in before))))
print("target loss:", round(loss, 3))
print("target after one gradient step:", round(float(after[target]), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[('test regression', 0.665), ('registry authentication', 0.245), ('insufficient evidence', 0.09)]
target loss: 1.408
target after one gradient step: 0.388
```
<!-- leetllm: output:end -->

The gradient for B is negative because its probability is below the target of 1. Subtracting that gradient increases B's logit. A and C move down. This update teaches the *loss geometry*, not whether the model learned to read a registry error on unseen logs.

```checkpoint
If the answer set removes C, does the numerical value of $p_B$ have to stay the same?
---
No. Softmax renormalizes over the supplied candidates, so changing the option list can change every reported probability without changing the underlying logit for B. A calibrated operational confidence needs its own held-out evidence.
```

The loss geometry is the same for any model that emits those three logits. What differs is where the logits come from, and whether anyone has published that mechanism.

## Three inspectable routes, one undisclosed model

The same decision contract can sit on different model mechanisms. This comparison was checked October 10, 2026. It describes public implementations and the TypeSafe claim; it doesn't assert architectural equivalence.

| System | What gets scored | What is trained for this task | What a score means |
|---|---|---|---|
| Jev | TypeSafe says typed decisions are sampled in parallel | TypeSafe names RLCD, but doesn't publish the recipe | Provider-reported calibrated decision probabilities; check them on your workload |
| Kev | A learned pointer head compares each option-marker representation with a decision-marker representation | 0.8B/4B/9B: frozen Qwen3.5 plus LoRA and head; 27B v2: full-weight Qwen3.8 fine-tuning | Softmax over the request's options; released checkpoints also fit a temperature |
| SemIf | Fixed answer-letter token logits from a frozen Qwen language model | Nothing in its baseline | Conditional preferences among the offered letters, not calibrated probabilities |
| Tev1-style SFT | A language model emits an answer letter, then client code maps it to a typed result | LoRA supervised fine-tuning on letter completions | A generated label; token log probabilities need separate calibration |

Kev's open code makes the learned-readout route concrete. It serializes state, question, and options with markers. A Qwen backbone computes hidden vectors. The pointer head compares each option's closing-marker vector with a final decision-marker vector, then normalizes the option scores. The smaller current releases train LoRA adapters and heads over frozen Qwen3.5 bases. Kev-27B v2, released September 30, 2026, instead trains every backbone weight of post-trained Qwen3.8-27B, then averages the result with its earlier adapter-trained version. The base's post-training data isn't disclosed, so these sizes aren't a controlled scaling experiment. The maintainers say no Jev outputs train Kev.[^palmer2026kev][^palmer2026kev27v2]

The head's arithmetic is inspectable too. For decision-marker state $h_d$, option-marker state $h_i$, and pointer width $d_p$, its learned projections produce

$$
z_i=\frac{(W_k h_i+b_k)^T(W_q h_d+b_q)}{\sqrt{d_p}}
$$

Kev's default pointer width is 256. Training uses raw logits; evaluation divides them by the checkpoint's fitted temperature before softmax.[^palmer2026kev] This resembles the QK score from the attention lesson, but here softmax gives probabilities for offered answers rather than weights for mixing value vectors.

Use two-dimensional identity projections to see the readout in isolation. These marker states illustrate the vector geometry:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="pointer-readout-miniature.py"
import numpy as np

decision = np.array([1.0, 0.0])
options = np.array([[0.0, 1.0], [2.0, 0.0], [0.5, 0.5]])
logits = np.dot(options, decision) / np.sqrt(2.0)

def normalize(scores, temperature):
    scaled = scores / temperature
    shifted = scaled - np.max(scaled)
    weights = np.exp(shifted)
    return weights / np.sum(weights)

raw = normalize(logits, 1.0)
calibrated = normalize(logits, 2.0)
print("pointer logits:", [round(float(x), 3) for x in logits])
print("T=1 probabilities:", [round(float(p), 3) for p in raw])
print("T=2 probabilities:", [round(float(p), 3) for p in calibrated])
assert int(np.argmax(raw)) == int(np.argmax(calibrated)) == 1
assert calibrated[1] < raw[1]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pointer logits: [0.0, 1.414, 0.354]
T=1 probabilities: [0.153, 0.629, 0.218]
T=2 probabilities: [0.237, 0.48, 0.283]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/readout_routes_dark.png" alt="Two-dimensional vector projection for decision routing with decision state vector d=[1, 0] and candidate option vectors A=[0, 1], B=[2, 0], and C=[0.5, 0.5]. Projected dot products evaluate to 0 for A, 2 for B, and 0.5 for C, yielding scaled logits [0.0, 1.414, 0.354] with scaling factor 1/sqrt(2). Softmax probabilities at temperature T=1.0 assign [0.153, 0.629, 0.218], while temperature T=2.0 softens the distribution to [0.237, 0.480, 0.283], preserving choice B as the predicted winner." />
  <figcaption>Dot-product projections against candidate embeddings generate option logits. Temperature scaling adjusts distribution sharpness while preserving top-choice rankings.</figcaption>
</figure>

Positive temperature preserves the winning option, while changing its probability. Permuting these fixed option vectors would only permute the readout. In the complete model, causal processing can make marker vectors depend on the order of earlier options. Evaluate option-order robustness by perturbing the serialized request and aligning results by semantic option ID.

SemIf tests a simpler route. It leaves Qwen weights frozen, presents the state and answer choices in a prompt, and reads the logits for fixed answer letters at the next position. It does not need to decode an answer token to obtain those logits. The method's authors explicitly say this is a Jev-like interface, not a reproduction of Jev's model or training. The softmax is conditional on the allowed letters.[^lee2026semif]

Together's Tev1 is a useful third training recipe. Its public Qwen3.5 recipe fine-tunes a language model to complete a single answer letter and maps that letter to JSON in client code. One short completion emits fewer tokens than a paragraph, but still uses the ordinary language-model head. The repository records 37,840 unique training examples and proposes one epoch as a starting recipe. It explicitly says the historical job's exact settings and uploaded-file identity aren't verified. Use the versioned data and recipe to start a new run; don't describe them as the hosted checkpoint's proven training history. Tev1 isn't evidence for Jev's undisclosed RLCD method.[^together2026tev1][^together2026tev1run]

The distinction matters because first-token letters can disagree with what an instruction-tuned model would write after a full answer. Wang and colleagues measured large mismatches on their tested models and tasks. If you use a frozen model's letter logits as a decision readout, test that *readout* on your tasks rather than assuming its preferences match generated text.[^wang2024firsttoken]

Multiple questions introduce another boundary. Kev's hybrid Qwen backbones include recurrent Gated DeltaNet layers, which cannot isolate packed questions merely by applying an attention mask. Current code runs each question as its own row continuing from the shared state cache. Test question isolation by adding an unrelated question or changing its option text and checking that the original question's scores stay consistent within numerical tolerance. Shared-state reuse saves repeated prefill; it doesn't imply that every question fits in one accelerator pass.[^palmer2026kev]

## Train on the decision you actually need

In a production failure triage dataset, a useful training row stores the state, the exact question, the three option descriptions, the reviewed target B, an incident group ID, and the version of the routing policy. The descriptions matter: training only on letters can teach position shortcuts. The group ID keeps related log lines from the same incident on one side of a train/test split.

Build the dataset by collecting real decisions or authoring checked examples, then cover ordinary cases, no-match cases, ambiguous evidence, and adversarial text inside the state. Labeling instructions should say when C is correct. A model forced to choose A or B when neither fits will turn uncertainty into a confident-looking error. The application can also offer an explicit `none` or `needs_review` choice if that matches its contract.

For a learned-head route, freeze or fine-tune a base, attach the decision readout, and optimize the labeled-option loss. For a completion route, serialize the task and train on the answer-letter completion while masking the input tokens from loss. <span data-glossary="lora">LoRA</span> changes *which weights move*, not the definition of a correct decision. Reuse the [SFT pipeline](/learn/supervised-fine-tuning-pipeline) for split, token-mask, and checkpoint discipline and the [LoRA lesson](/learn/lora-parameter-efficient-fine-tuning) for adapter memory accounting.[^palmer2026kev][^together2026tev1]

Here is the release experiment to design before training. Each row is a different failure signal, so one overall accuracy number can't replace it.

| Check | Split or perturbation | Failure it can reveal |
|---|---|---|
| Group-held-out accuracy | Unseen incident IDs and source systems | Repeated logs leaking across splits |
| Option permutation | Shuffle A/B/C descriptions while preserving their identities | Letter-position shortcuts |
| Unknown and no-match cases | No decisive log line or no suitable option | Forced guesses |
| Calibration | Reliability bins and Brier score on held-out predictions | Confidence higher than observed correctness |
| Selective risk | Route only above a chosen threshold; send the rest to review | Bad automation at the operating point |
| Full workflow | Timing, queue outcome, corrections, and rollback | A model score that doesn't improve the actual triage process |

<span data-glossary="temperature">Temperature scaling</span> fits a single positive scale on held-out logits. It can improve calibration without changing the argmax, but a fitted temperature isn't proof that confidence transfers to a new log source. Guo and colleagues established its value on several neural-network settings; measure your own reliability curve and keep calibration data separate from final test data.[^guo2017]

### Measure the field your gate actually reads

Kev's Choice `confidence` follows TypeSafe's adapter formula. For $K>1$ choices and winning probability $p_{\max}$,

$$
c=\frac{p_{\max}-1/K}{1-1/K}
$$

A uniform distribution becomes zero; a certain choice becomes one. With one legal choice, the adapter returns one. This concentration transform does not estimate empirical accuracy.[^typesafe2026confidence] For three options, $p_{\max}=0.80$ gives $c=0.70$. A threshold on `confidence` cannot silently replace the same threshold on winning probability. For a fixed $K$, convert a confidence threshold $\tau_c$ to $\tau_p=1/K+(1-1/K)\tau_c$ if you want the same selection.

Compute **coverage** as the fraction routed automatically and **selective risk** as the error fraction among those routed. The script below compares decision gating under raw probability versus normalized confidence across eight evaluation cases:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="decision-risk-coverage.py"
import numpy as np

# (winning probability, whether the winning semantic option was correct)
probs = np.array([0.96, 0.92, 0.90, 0.86, 0.78, 0.74, 0.65, 0.55])
correct = np.array([True, True, False, True, True, False, True, False])
K = 3

def confidence(p):
    return (p - 1.0 / K) / (1.0 - 1.0 / K)

def report(values, threshold):
    mask = values >= threshold
    count = int(np.sum(mask))
    coverage = float(count / len(values))
    risk = float(np.sum(~correct[mask]) / count) if count > 0 else None
    return count, coverage, risk

for name, values in [("p_max", probs), ("confidence", confidence(probs))]:
    accepted, cov, rsk = report(values, 0.80)
    print(f"{name}: routed={accepted}/8 coverage={cov:.3f} risk={rsk:.3f}")

equivalent_p_threshold = 1.0 / K + (1.0 - 1.0 / K) * 0.80
assert report(confidence(probs), 0.80) == report(probs, equivalent_p_threshold)
print("p threshold equivalent to confidence=0.80:", round(equivalent_p_threshold, 3))
assert report(probs, 1.0)[2] is None  # no routed cases means risk is unmeasured
```

<!-- leetllm: output:start -->
```text title="Output" output compact
p_max: routed=4/8 coverage=0.500 risk=0.250
confidence: routed=3/8 coverage=0.375 risk=0.333
p threshold equivalent to confidence=0.80: 0.867
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/confidence_gate_dark.png" alt="Selective risk and coverage tradeoff across eight decision model evaluation cases on a probability axis from 0.50 to 1.00. A direct probability threshold of 0.80 selects four cases (three correct, one error) yielding 50.0% coverage and 25.0% selective risk. A normalized choice-confidence threshold of 0.80 (equivalent to p >= 0.867 for three choices) selects three cases (two correct, one error) yielding 37.5% coverage and 33.3% selective risk because the high-confidence error at 0.90 survives while the correct case at 0.86 is dropped." />
  <figcaption>Stricter gating cutoffs can paradoxically increase selective risk when uncalibrated high-confidence errors survive filtering.</figcaption>
</figure>

The higher effective cutoff routes fewer incidents, but both gates keep the confidently wrong case at `0.90`. Here the observed risk rises from 25% to about 33%: one error remains in a smaller routed set. Zero routed cases gives no risk measurement; a handful of error-free cases leaves wide uncertainty for a production error budget. Choose the threshold on development data, freeze it, and estimate coverage and error with uncertainty on a separate group-held-out test. Changing the answer count changes the confidence mapping, so evaluate each deployed contract.

For a consequential route, code must still authenticate callers, validate the returned choice, and define the review path. If a decision model says `registry authentication` with 0.9 conditional mass, the number is a prompt to inspect evidence, not authority to rotate credentials or close an incident.

## What the decision model buys you

A direct decision interface avoids drafting and parsing a paragraph when the application already knows its legal outcomes. It doesn't eliminate reading the input: long state prefill, model weights, and the number of questions still cost time and memory. Batch shape, caching, and hardware determine whether one implementation beats a short generated label in your environment.

A decision task is scored over a fixed set of options. A learned pointer stays separate from a frozen letter logit, and a number that only rescales a probability is not confidence. A typed `B` is still not permission to rotate a credential. Jev's private recipe, Kev's trained head, SemIf's frozen-logit baseline, and Tev1's answer-letter SFT reach that interface by different routes.

```mastery-quiz
[
  {
    "question": "A three-option model assigns probabilities [0.2,0.5,0.3], and the reviewed target is C. Which cross-entropy logit gradient and descent effect follows?",
    "options": [
      "B has gradient −0.5, so descent raises the current winner.",
      "C has gradient 0.3, so descent lowers C relative to the others.",
      "C has gradient −0.7, so descent raises C relative to the others.",
      "All gradients equal 0.3, so descent preserves the distribution."
    ],
    "answer": "C has gradient −0.7, so descent raises C relative to the others.",
    "explanation": "The target gradient is its probability minus one:0.3-1=-0.7. Other gradients stay positive, so subtraction raises the target’s relative score."
  },
  {
    "question": "Kev’s code selects each answer with a pointer head. Suppose Jev returns the same letters as Kev on a test set. A reviewer concludes that both use pointer heads, even if they train them differently. Given these observations, which systems could have selected their answers solely from next-token letter logits?",
    "options": [
      "Kev alone.",
      "Jev alone.",
      "Both systems.",
      "Neither system."
    ],
    "answer": "Jev alone.",
    "explanation": "Kev’s code identifies the pointer head that selected its answers. That rules out a letter-logit explanation for Kev alone or for both systems. Jev could rank the same letters first with a different readout. Ruling out letter logits for Jev as well assumes the shared head the reviewer wants to prove."
  },
  {
    "question": "A debugger replays two toy traces. The Kev pointer trace has width 1, a projected query of 2 and projected keys of 3 for A and 5 for B. The SemIf trace has next-token logits of 7 for A and 9 for B. The debugger swaps only the two saved option keys. What raw score does each readout give A before any token is decoded?",
    "options": [
      "Kev gives 6 and SemIf gives 7.",
      "Kev gives 10 and SemIf gives 9.",
      "Kev gives 6 and SemIf gives 9.",
      "Kev gives 10 and SemIf gives 7."
    ],
    "answer": "Kev gives 10 and SemIf gives 7.",
    "explanation": "After the swap, A has key 5. Kev multiplies it by the query 2 and divides by the square root of 1, giving 10. A score of 6 uses A’s old key. SemIf still reads 7 from the vocabulary entry for A. A score of 9 reads the entry for B as if the key swap had also swapped the letters."
  },
  {
    "question": "Fixed exponentiated option masses are A:2, B:5 and C:3. If C is removed without changing the remaining logits, what happens to B’s probability?",
    "options": [
      "It stays 0.5 because B’s own logit did not move.",
      "It rises from 0.5 to 5/7 by renormalization.",
      "It falls from 0.5 to 5/13 after adding the removed mass.",
      "It becomes 1 because removing C proves B correct."
    ],
    "answer": "It rises from 0.5 to 5/7 by renormalization.",
    "explanation": "B initially has 5/(2+5+3)=0.5. Removing C changes the denominator to 7, giving 5/7. This is conditional preference, not proof of correctness."
  },
  {
    "question": "Which test most directly exposes a model that memorizes the letter B instead of registry-authentication evidence?",
    "options": [
      "Permute option positions, preserve descriptions, and count the replay as correct if it returns B.",
      "Repeat the original option order, preserve descriptions, and compare training loss.",
      "Permute option positions, preserve descriptions, and track the correct option identity.",
      "Keep the original option order, preserve descriptions, and validate returned JSON."
    ],
    "answer": "Permute option positions, preserve descriptions, and track the correct option identity.",
    "explanation": "Replay the same log with registry authentication moved from B to C. A model stuck on B now selects a different cause. Scoring by cause marks B wrong and C correct. Scoring against the original letter reverses both verdicts. With the original order, low training loss can reward either strategy, and either letter can pass JSON validation."
  },
  {
    "question": "Five choices produce a winning probability of 0.68. The concentration formula rescales from uniform probability to certainty. An inclusive gate accepts concentration at least 0.60. What happens?",
    "options": [
      "Review: concentration 0.20 is below the inclusive cutoff.",
      "Accept: concentration 0.68 exceeds the inclusive cutoff.",
      "Review: concentration 0.48 is below the inclusive cutoff.",
      "Accept: concentration 0.60 reaches the inclusive cutoff."
    ],
    "answer": "Accept: concentration 0.60 reaches the inclusive cutoff.",
    "explanation": "For five choices the uniform baseline is 0.20. Subtract it from 0.68 and divide by 0.80:0.48/0.80=0.60, equal to this inclusive gate. The transform measures concentration, not empirical accuracy."
  }
]
```

> **Next:** Continue to [Model Merging and Weight Interpolation](/learn/model-merging-weight-interpolation). A decision adapter gives you a specialized behavior to preserve; the next lesson asks what changes when you combine weights from separately trained behaviors and how to test the result.
