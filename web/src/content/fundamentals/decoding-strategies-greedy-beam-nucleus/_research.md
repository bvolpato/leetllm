---
query: "We are creating a research-backed page for the following: \"Decoding Strategies: Greedy to Nucleus\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: fundamentals\nCurrent page scope: Compare decoding strategies for text generation: greedy, beam search, top-k, nucleus (top-p), temperature, repetition controls, and newer variants like min-p.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "837e2458ef9d17c5b23b0833848c0a55"
status: "completed"
---

Manual verification: September 22, 2026. Keep the published sampler experiments separate from current runtime behavior. Illustrative token distributions are worked examples. Neither model likelihood nor syntactic validity establishes factual accuracy.

# Decoding Strategies: Greedy to Nucleus

## 1. Introduction: The Core Tension of Text Generation

**Goal:** Establish the foundation of what decoding is and why it requires strategic tradeoffs.

- **Prerequisite:** Students must understand that an LLM outputs raw scores (logits) for its entire vocabulary, which are converted into a probability distribution via a softmax function.
- **The Tradeoffs:** Compare task correctness, diversity, repetition, reproducibility, and serving cost. Probability concentration isn't a measure of safety or truth.
- **Visualizing the Output:** Show the vocabulary probability distribution at a single time step.

## 2. Deterministic Methods: Greedy & Beam Search

**Goal:** Teach how models pick the "best" token mathematically, and why picking the best token doesn't always yield the best text.

- **Greedy Decoding:**

- *Mechanism:* `argmax_w P(w | prefix)`, with an explicit tie rule and eligible vocabulary.
- *Failure Mode:* A locally favorable token can miss the highest-probability sequence. [Holtzman's GPT-2 experiments](https://arxiv.org/html/1904.09751) found degeneration under likelihood maximization; they don't establish a universal KV-cache explanation. [DeepSeek-R1](https://arxiv.org/html/2501.12948) reports greedy repetition/checkpoint variability and estimates pass@1 from repeated samples at T=0.6, top-p=0.95, not best-of-many selection.
- **Beam Search:**

- *Mechanism:* Maintains B parallel candidate sequences (beams) at each step. Scores sequences by cumulative log-probability.
- *Use Cases:* Evaluate for a specified source meaning, such as translation; verify code/extraction against their actual schemas rather than assuming the probability mode is valid.
- *Tradeoffs:* Up to B active prefixes add compute/state, with batching/prefix sharing affecting cost. Width limits retained prefixes, not depth. [Meister](https://aclanthology.org/2020.emnlp-main.170.pdf) connects a regularized objective and uniform information density with translation quality; it doesn't prove universal best widths 3–6 or failure above 10.
- *Completion/Scoring:* Include EOS in completed likelihood, retain stop reasons, and distinguish truncated-prefix rules. [GNMT](https://arxiv.org/html/1609.08144) uses a specific length/coverage formula with experiment settings alpha=beta=0.2; normalized-prefix scores can rise on extension, so stopping bounds must match the objective.

## 3. Stochastic Sampling and Temperature

**Goal:** Explain categorical randomness and score scaling without promising a cure for repetition.

- **Random Sampling:** Instead of picking the top token, sample from the entire probability distribution.
- **Temperature (T):** The primary mechanism for scaling the distribution before applying softmax.

- *Equation:* `q_i = exp((z_i-z_max)/T) / sum_j exp((z_j-z_max)/T)` for positive T and a nonempty eligible set. Reject all-masked inputs.
- *Effects:*

- T→0+: Uniform over tied maxima; equals deterministic greedy only with a unique maximum.
- T=1: Preserves the supplied logit scale, without establishing calibration.
- T→infinity: Uniform over a fixed finite eligible set; hard masks remain. Entropy rises for fixed logits, not necessarily answer quality/diversity across evolving prefixes.
- Apply temperature to individual token probabilities before grouping a displayed tail. A tail bucket isn't one vocabulary token.

## 4. Truncation Strategies: Top-K and Top-p (Nucleus)

**Goal:** Calculate retained sets and probability renormalization; weak probability alone doesn't establish that a token is wrong.

- **Top-K Sampling:**

- *Mechanism:* Sort probabilities, keep only the top K tokens, and redistribute mass to sum to 1.
- *Flaw:* A fixed count can retain weak alternatives or exclude useful ones. It doesn't force a draw from the tail. State eligible-token and tie handling: [Transformers' processor](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py) retains all ties at the kth score, potentially more than k.
- **Top-p (Nucleus) Sampling:**

- *Mechanism:* Selects the smallest set of tokens whose cumulative probability ≥p.
- *Advantage:* Dynamically adapts to the distribution's shape. If the distribution is sharp, the nucleus might be 2 tokens. If flat, it might be 100 tokens.

## 5. Modern Adaptations: Min-p Sampling

**Goal:** Introduce recent innovations that address the shortcomings of nucleus sampling at high temperatures.

- **The Problem:** Higher temperatures can expand a nucleus to include more individually weak candidates. Whether those candidates damage quality requires task evaluation; probability alone doesn't identify nonsensical tokens.
- **Min-p Mechanism:** Rather than a cumulative threshold, `min-p` sets a dynamic minimum probability *relative to the most likely token*. If the top token has a probability Pmax​, any token below Pmax​×Pmin_value​ is truncated.
- **Current Adoption & Volatility:**

- **Availability:** Check the installed interface and processor order, not an adoption claim. Current [Transformers source](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/utils.py) enables temperature before top-k/top-p/min-p for sampling.
- **The Debate:** [Nguyen's ICLR 2025 paper](https://arxiv.org/html/2407.01082v8) and [Schaeffer's June 2025 reanalysis](https://arxiv.org/html/2506.13681) disagree about the original evidence. The latter controls tuning volume in GSM8K experiments and identifies human/judge/adoption-evidence limitations. Scope both conclusions to their experiments.
- **Temperature Dependence:** Applied after temperature, min-p is equivalent to `z_i >= z_max + T*log(rho)` for rho>0. Its set can grow with T; before-temperature filtering differs. A uniform distribution retains every eligible token under min-p, so it isn't always smaller than a nucleus.

## 6. Penalizing Repetition

**Goal:** Cover the post-processing adjustments that deter a model from getting stuck in loops.

- **Repetition Penalty:** [CTRL](https://arxiv.org/html/1909.05858) uses its original temperature-multiplier rule. [Transformers' sign-aware processor](https://huggingface.co/docs/transformers/main/en/internal/generation_utils#transformers.RepetitionPenaltyLogitsProcessor) divides seen positive logits and multiplies negative ones, once per distinct ID. Histories can include prompt tokens. Centering before this transform changes it; decreasing several seen logits need not decrease every seen token's normalized probability.
- **Presence vs. Frequency Penalties:**

- *Presence:* A flat logit deduction after first use; it doesn't identify topics or semantic repetition.
- *Frequency:* A deduction scaled by *how many times* the token has appeared (deters repeating the exact same words).

## 7. Expected Mastery & Common Misconceptions

Include a section on implementation gotchas and practical takeaways.

- **Order Matters:** Positive temperature preserves ranks, so an exact-k fixed-tie set is unchanged; cumulative/relative thresholds depend on scale. Top-p after top-k reads renormalized remaining mass. Current [Transformers source](https://github.com/huggingface/transformers/blob/main/src/transformers/generation/utils.py) applies temperature before truncation; don't repeat the original min-p appendix's engine contrast as current behavior without checking a version.
- **Combining Methods:** In practice, parameters are stacked. A standard pipeline might apply penalties → temperature → Top-K → Top-p.
- **Combined Filters:** Both can restrict a pool; top-p doesn't universally override top-k, and no cutoff is a semantic safety net. Disable unwanted defaults and record the whole configuration.
- **Stopping:** [StopStringCriteria](https://huggingface.co/docs/transformers/main/en/internal/generation_utils#transformers.StopStringCriteria) precomputes overlaps and uses tensor matching, including strings spanning tokens. Record returned stop text and streaming behavior.
- **Reproducibility:** [vLLM](https://docs.vllm.ai/en/latest/usage/reproducibility/) documents deterministic offline scheduling or batch invariance; [beta batch invariance](https://docs.vllm.ai/en/latest/features/batch_invariance/) also supports online serving within stated hardware/model/version scope and can cost performance. Greedy/seeds alone don't establish bitwise tensor equality; isolated requests aren't universally necessary or sufficient.

### Source References for the Page

- [Hierarchical Neural Story Generation](https://aclanthology.org/P18-1082/) (Top-k sampling study)
- [Speculative decoding](https://arxiv.org/html/2211.17192) (Exact target-distribution preservation under the acceptance/correction algorithm, not identical seeded traces)
- Primary studies and current implementation links are attached to the corresponding claims above.
