---
{
  "id": "perplexity-language-model-evaluation",
  "title": "Perplexity & Model Evaluation",
  "slug": "perplexity-language-model-evaluation",
  "category": "Evaluation & Benchmarks",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/perplexity_chart_dark.png",
  "companies": [
    "Google",
    "OpenAI",
    "Meta",
    "DeepMind",
    "Anthropic"
  ],
  "shortDescription": "A lower perplexity means the model was less surprised by held-out tokens, but only under a fixed scoring protocol.",
  "keyConceptsTested": [
    "Held-out next-token likelihood",
    "Cross-entropy to perplexity",
    "Stable log-probability scoring",
    "Evaluation protocol controls",
    "Bits-per-byte normalization",
    "Strided context windows",
    "Domain-specific held-out fit",
    "Intrinsic versus downstream task quality",
    "Leakage-resistant evaluation sets"
  ],
  "section": "Core LLM Foundations",
  "order": 6
}
---

A teammate announces that a new checkpoint dropped validation perplexity from **8.17** down to **1.90**, a fourfold win. Then you check the config: the old run used a subword tokenizer and the new one switched to characters. On the exact same text, the "1.90 PPL" model was actually *more* surprised. Nothing was miscalculated; the two numbers simply measured different prediction units.

**<span data-glossary="perplexity">Perplexity</span>** is the cleanest intrinsic metric for how well a causal language model predicts unseen text, provided every evaluation control stays fixed. It is also one of the easiest metrics in ML to misread, both when scoring rules drift and when smooth prose fit is mistaken for downstream reasoning or factuality.

## From token surprise to perplexity

During evaluation, you do not sample continuations. You teacher-force real held-out text through the model and read the probability $p_\theta(x_i \mid x_{<i})$ assigned to each actual next <span data-glossary="token">token</span>. Its **<span data-glossary="negative-log-likelihood">negative log-likelihood</span>** (NLL), or surprise, is $-\ln p$. A certain hit ($p = 1$) costs $0$ nats; a confident miss ($p = 0.001$) costs $6.908$ nats.

Averaging NLL across $N$ scored tokens gives the causal <span data-glossary="cross-entropy">cross-entropy</span> loss $L$, and exponentiating gives perplexity:

$$
L = -\frac{1}{N}\sum_{i=1}^{N}\ln p_\theta(x_i \mid x_{<i}), \qquad \text{PPL} = \exp(L) = 2^{L / \ln 2}
$$

Perplexity acts like an **effective branching factor**: guessing uniformly among $K$ equally likely tokens gives $p = 1/K$ and $\text{PPL} = K$ (formally, PPL is the inverse geometric mean of observed token probabilities). Because the mapping is exponential, every $+\ln 2 \approx 0.693$ nats doubles perplexity, and a confidently wrong model can easily exceed its own vocabulary size (assigning $p = 0.01$ to every token in a 2-token vocabulary gives $\text{PPL} = 100$). Note that this formula governs causal next-token models; masked models like BERT condition on both left and right context and report separately labeled **pseudo-perplexity** that cannot be ranked directly against causal PPL.[^huggingface_ppl][^salazar2020MaskedScoring]

<figure>
  <img src="illustrations/_generated/perplexity_chart_dark.png" alt="Left: the curve of negative log p against probability p, with three observed targets marked: p 0.80 costs 0.223 nats, p 0.50 costs 0.693, and p 0.10 costs 2.303. Right: those losses laid end to end total 3.219 nats. Dividing by three targets gives a mean of 1.073 nats, and exponentiating gives perplexity 2.92." />
  <figcaption>Transform each observed probability with $-\ln p$, average the losses (1.073 nats), and exponentiate once to get PPL 2.92.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/loss_to_ppl_curve_dark.png" alt="The exponential curve from average loss in nats to perplexity, for losses 0 to 4.7. A staircase climbs it through perplexity 5, 10, 20, 40, and 80. Every horizontal step is ln 2, about 0.693 nats, and every step doubles perplexity." />
  <figcaption>Each constant step of $\ln 2 \approx 0.693$ nats doubles perplexity, so compare training runs in nats or bits rather than raw PPL differences.</figcaption>
</figure>

### Computing stably from logits and aggregating once

Models output raw <span data-glossary="logits">logits</span>, not probabilities. Calling `exp(1000)` overflows IEEE 754 floats, so subtract `max(logits)` before computing log-softmax (built into PyTorch's cross-entropy[^pytorchCrossEntropy2026]). Two aggregation rules prevent silent evaluation bugs:

1. **Keep `inf` distinct from `NaN`:** An exact zero probability for an observed target yields infinite NLL (legitimate and terrible); `NaN` means the pipeline broke and must be rejected. If finite mean NLL is huge (say 1,000 nats), report loss rather than clipping it to prevent `exp` overflow.
2. **Never average window or worker perplexities:** Exponentiation is nonlinear and shards have uneven target counts. Have every worker report total NLL and valid target count, sum both globally, divide once, and exponentiate once.

<!-- leetllm: test, output=show -->
```python title="stable-perplexity-and-aggregation.py"
import math

# 1. Stable log-softmax on large logits [1000, 998, 997]
logits = [1000.0, 998.0, 997.0]
shifted = [v - max(logits) for v in logits]
log_z = math.log(sum(math.exp(v) for v in shifted))
nll = log_z - shifted[0]
print(f"Stable log-softmax -> NLL={nll:.3f} nats, PPL={math.exp(nll):.3f}")

# 2. Token-weighted corpus PPL vs wrong window-PPL average
windows = [(0.50, 2), (2.00, 8)]  # (mean_nll, scored_tokens)
wrong_avg = sum(math.exp(m) for m, _ in windows) / len(windows)
total_nll = sum(m * n for m, n in windows)
total_toks = sum(n for _, n in windows)
print(f"Wrong mean of window PPLs: {wrong_avg:.2f}")
print(f"Token-weighted corpus PPL: {math.exp(total_nll / total_toks):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Stable log-softmax -> NLL=0.170 nats, PPL=1.185
Wrong mean of window PPLs: 4.52
Token-weighted corpus PPL: 5.47
```
<!-- leetllm: output:end -->

```checkpoint
Why must an evaluator sum negative log-likelihoods and target counts before dividing and exponentiating?
---
Products of token probabilities underflow toward zero, and averaging per-window perplexities both misweights uneven windows and breaks the nonlinearity of $\exp(\cdot)$.
```

## Comparing checkpoints and tokenizers fairly

Raw perplexity isolates model weights **only** when every protocol control matches: corpus and split, preprocessing, tokenizer revision, objective, context length, <span data-glossary="stride">stride</span>, document boundaries, and target masking (always in `model.eval()` with dropout disabled and unmodified logits, no temperature or top-$k$). Report important domains separately too: the **Paloma** benchmark showed that low perplexity on one corpus frequently masks large regressions on code or scientific prose.[^almazrouei2024]

<figure>
  <img src="illustrations/_generated/ppl_scores_dark.png" alt="Perplexity comparison across context lengths on wikitext-eval-v3 using tokenizer bpe-v7 and stride 512. At 2048 tokens of context, checkpoint 0400 scores PPL 3.18 and checkpoint 0800 scores PPL 2.31, cleanly isolating weight changes. A shorter 512-token context run sits on a different curve and cannot be compared directly." />
  <figcaption>Comparing checkpoint 0400 (3.18) and 0800 (2.31) at matched 2048-token context and stride 512 isolates model weights; shrinking context to 512 shifts the evaluation curve.</figcaption>
</figure>

When two checkpoints use **different tokenizers**, raw token PPL fails because each tokenizer slices the same text into different numbers of prediction events.[^huggingface_ppl] Divide total NLL by the shared raw UTF-8 byte count $B$ instead to compute **bits per byte (BPB)** (used by The Pile and Paloma):[^gao2020][^almazrouei2024]

$$
\text{BPB} = \frac{-\sum_i \ln p_\theta(x_i \mid x_{<i})}{B \ln 2}
$$

Audit text normalization alongside BPB: lossy preprocessing (like SentencePiece's optional NFKC plus whitespace folding[^sentencepieceNormalization2026]) collapses distinct UTF-8 strings (`'Ａ  a'`, `'A a'`, `'a a'`) into fewer bytes and an artificially easier target.

<figure>
  <img src="illustrations/_generated/tokenizer_normalization_dark.png" alt="The fourteen bytes of Rain falls now, aligned with four subword pieces (Rain, space falls, space n, and ow) and fourteen character targets. Over the same bytes, the subword model has total loss 8.4 nats, token perplexity 8.17, and 0.866 bits per byte. The character model has 9.0 nats, token perplexity 1.90, and 0.927 bits per byte. Token perplexity favors the character model, and bits per byte favors the subword model." />
  <figcaption>Over the same 14 UTF-8 bytes, raw token PPL favors the character model (1.90 vs. 8.17), while bits per byte flips the winner back to the less-surprised subword model (0.866 vs. 0.927).</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="bits-per-byte-and-normalization.py"
import math
import unicodedata

text = "Rain falls now"
raw_bytes = len(text.encode("utf-8"))
for name, n_toks, total_nll in [("subword", 4, 8.4), ("character", 14, 9.0)]:
    print(f"{name:10s} token PPL={math.exp(total_nll / n_toks):.2f}, BPB={total_nll / (raw_bytes * math.log(2)):.3f}")

# Lossy NFKC + casefold collapses 6 raw bytes into 3 normalized bytes:
sample = "Ａ  a"
norm = " ".join(unicodedata.normalize("NFKC", sample).casefold().split())
print(f"Normalization: {sample!r} ({len(sample.encode())}B) -> {norm!r} ({len(norm.encode())}B)")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
subword    token PPL=8.17, BPB=0.866
character  token PPL=1.90, BPB=0.927
Normalization: 'Ａ  a' (6B) -> 'a a' (3B)
```
<!-- leetllm: output:end -->

## Strided sliding windows and shifted target counts

Documents longer than the model's context window must be scored in windows. Disjoint blocks starve tokens near each cut of left context; overlapping **strided windows** reuse left context while masking already-scored prefix tokens with `-100` so every target enters the loss exactly once.[^huggingface_ppl] On WikiText-2 with GPT-2 Large, halving stride from 1,024 to 512 drops PPL from **19.44** to **16.44** with zero weight changes (compare GPT-2's original 19.93 with its own detokenizer[^radford2019]).

<figure>
  <img src="illustrations/_generated/sliding_window_eval_dark.png" alt="Three five-token windows over tokens A through J. The first reads A to E and scores B, C, D, and E. The second reads D to H and scores F, G, and H. The third reads F to J and scores I and J. Nine losses appear exactly once each, and A is never scored. They sum to 4.26 nats, the mean is 0.473, and perplexity is 1.61." />
  <figcaption>Three overlapping 5-token windows read context (shaded) and score B through J (filled) exactly once each. Without a BOS token, position A acts only as context.</figcaption>
</figure>

> **Common mistake:** In causal LM evaluation, logit $t$ predicts token $t + 1$, so pair `logits[:, :-1]` with `labels[:, 1:]` and count valid (`!= -100`) targets **after** shifting. Subtracting `batch_size` from unshifted valid labels silently undercounts every overlapping window whose position 0 was already masked to `-100`.

<!-- leetllm: test, deps=torch, output=show -->
```python title="count-shifted-targets.py"
import math
import torch
import torch.nn.functional as F

token_ids = torch.arange(10)  # A=0 .. J=9
windows = [(0, 5, 1), (3, 8, 5), (5, 10, 8)]
total_nll, total_targets, wrong_targets = 0.0, 0, 0

for begin, end, score_begin in windows:
    input_ids = token_ids[begin:end].unsqueeze(0)
    labels = input_ids.clone()
    labels[:, :score_begin - begin] = -100

    logits = torch.zeros(1, end - begin, 10, dtype=torch.float64)
    logits.scatter_(2, ((input_ids + 1) % 10).unsqueeze(-1), 3.0)

    shifted_labels = labels[:, 1:].reshape(-1)
    count = int((shifted_labels != -100).sum())
    wrong_count = int((labels != -100).sum()) - labels.shape[0]
    total_nll += F.cross_entropy(logits[:, :-1].reshape(-1, 10), shifted_labels, ignore_index=-100, reduction="sum").item()
    total_targets += count
    wrong_targets += wrong_count

print(f"Correct targets={total_targets} (wrong unshifted formula={wrong_targets})")
print(f"Exact shifted PPL={math.exp(total_nll / total_targets):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Correct targets=9 (wrong unshifted formula=6)
Exact shifted PPL=1.448
```
<!-- leetllm: output:end -->

## Perplexity vs. downstream accuracy and contamination

Even a spotless perplexity harness measures only unconditional next-token prose fit. Post-training (SFT and RLHF) concentrates probability mass onto helpful instruction-following trajectories, frequently causing a small **alignment tax** (slightly higher prose PPL) while driving verifiable task accuracy dramatically upward.[^holtzman2020] Conversely, memorizing easy boilerplate preambles (`"The answer is clearly..."`) lowers sequence perplexity even while missing the critical factual answer token:

<figure>
  <img src="illustrations/_generated/evaluation_stack_dark.png" alt="Scatter comparison of held-out validation perplexity against downstream task accuracy across three checkpoints: a memorized checkpoint scores low perplexity 6.4 with only 38 percent task accuracy, a base pretrained checkpoint scores perplexity 8.9 with 52 percent accuracy, and a post-trained instruction-tuned checkpoint reaches 84 percent accuracy despite slightly higher perplexity 9.8." />
  <figcaption>Lowest validation PPL picks the memorized model (6.4 PPL, 38% accuracy), whereas downstream task benchmarks pick the post-trained model (9.8 PPL, 84% accuracy).</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="preamble-ppl-vs-answer-accuracy.py"
import numpy as np

rng = np.random.default_rng(7)
n = 200
p_easy_pre = rng.uniform(0.75, 0.96, size=(n, 10))
p_bad_ans = rng.uniform(0.15, 0.45, size=(n, 1))
p_good_pre = rng.uniform(0.55, 0.85, size=(n, 10))
p_good_ans = rng.uniform(0.65, 0.92, size=(n, 1))

for label, pre, ans in [("boilerplate-heavy", p_easy_pre, p_bad_ans), ("answer-aligned", p_good_pre, p_good_ans)]:
    seq = np.concatenate([pre, ans], axis=1)
    print(f"{label:18s} seq_ppl={np.exp(-np.log(seq).mean()):.2f}, answer_acc={(ans.squeeze(1) > 0.5).mean():.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
boilerplate-heavy  seq_ppl=1.29, answer_acc=0.0%
answer-aligned     seq_ppl=1.43, answer_acc=100.0%
```
<!-- leetllm: output:end -->

Remember also that perplexity requires full next-token logits: many hosted APIs withhold prompt-token logprobs or omit them during reasoning modes,[^openai2026LatestModel][^anthropic2026MessagesReference][^openai2026ChatReference] making downstream task benchmarks the primary yardstick for closed models (calibrating LLM judges against human labels to control <span data-glossary="position-bias">position</span> and verbosity bias[^zheng2023]).

Finally, guard both perplexity and task suites against **<span data-glossary="benchmark-contamination">contamination</span>**: check content n-gram overlap (not just document IDs), pair stable decontaminated holdouts with rotating fresh challenge sets such as LiveBench,[^white2024] and remember that deleting a leaked document from a training manifest never erases it from an already-trained checkpoint.

<figure>
  <img src="illustrations/_generated/contamination_pressure_dark.png" alt="Left: document d103 appears in both the training split (d101, d102, d103) and the validation split (d103, d201, d202), contaminating held-out perplexity. Right: a clean evaluation protocol keeps fixed holdout documents d201 and d202 disjoint across runs while rotating fresh challenge subsets d301, d302, and d303." />
  <figcaption>Pair stable decontaminated holdouts for regression tracking with rotating fresh challenge sets to catch memorization.</figcaption>
</figure>

| Symptom | Likely cause | First check |
|---|---|---|
| Big PPL drop after tokenizer swap | Changed target units | Compare bits per byte on identical raw UTF-8 text |
| Same weights, lower PPL | Longer context, smaller stride, or different split | Verify recorded protocol conditions match |
| Distributed score differs from single GPU | Averaged shard PPLs or means | Sum total NLL and shifted target counts globally |
| `Inf` or `NaN` in report | Zero-probability target vs broken math | Keep `Inf` distinct; reject `NaN` or zero-target runs |
| Suspiciously low PPL | Evaluation text leaked into training | Run content n-gram decontamination on independent holdouts |
| Low PPL, weak task answers | Prose fit vs instruction/factual execution | Grade with verifiable downstream benchmarks |

```checkpoint
A base model has lower held-out perplexity (8.9) than a post-trained instruction checkpoint (9.8), yet scores 30 points lower on verifiable QA accuracy. Which should you deploy for QA?
---
Deploy the post-trained checkpoint. Perplexity tracks unconditional prose likelihood, whereas post-training trades a small alignment tax in raw PPL for large gains in task execution and factual grounding.
```

```mastery-quiz
[
  {
    "question": "Two scored causal targets receive probabilities 0.25 and 0.20. What are their mean NLL and perplexity, using natural logs?",
    "options": [
      "1.498 nats; 4.472",
      "2.996 nats; 20.000",
      "0.225 nats; 1.252",
      "1.498 nats; 1.498"
    ],
    "answer": "1.498 nats; 4.472",
    "explanation": "The reciprocal product is 4 × 5 = 20. Mean NLL is ln(20)/2 = 1.498; exponentiating gives sqrt(20) = 4.472. Exponentiating the total gives 20; averaging probabilities or omitting exponentiation changes the calculation."
  },
  {
    "question": "For logits [1200,1199,1197] and observed ID 1, which shifted logits and target NLL preserve the original distribution?",
    "options": [
      "[0,−1,−3]; about 1.349",
      "[0,0,0]; about 1.099",
      "[0,−1,−3]; about 0.349",
      "[0,−1,−3]; about −1.349"
    ],
    "answer": "[0,−1,−3]; about 1.349",
    "explanation": "Subtract 1200 from every logit. The observed shifted value is −1, so NLL is 1 + ln(1 + exp(−1) + exp(−3)) = 1.349. Clipping the logits would flatten them; omitting the observed −1 or changing the loss sign gives the other numerical errors."
  },
  {
    "question": "One worker has mean NLL 0.4 over 3 targets; another has mean NLL 1.6 over 9 targets. What corpus perplexity follows from equal weight per target?",
    "options": [
      "2.718",
      "3.669",
      "3.222",
      "1.300"
    ],
    "answer": "3.669",
    "explanation": "The total loss is 3 × 0.4 + 9 × 1.6 = 15.6 over 12 targets, so exp(1.3) = 3.669. The mean of worker means gives exp(1) = 2.718; averaging their perplexities gives about 3.222, while reporting 1.3 omits exponentiation."
  },
  {
    "question": "Each run lists its checkpoint, held-out corpus, preprocessing, tokenizer, context length and stride (both in tokens). Oak recorded `v1, H, raw, K, 1200, 300`. Elm recorded `v2, H, raw, K, 1200, 150`. Ash recorded `v2, H, raw, K, 1200, 300`. All other scoring settings match. Which comparison isolates the effect of the checkpoint on perplexity?",
    "options": [
      "Oak with Elm",
      "Oak with Ash",
      "Elm with Ash",
      "Average Elm and Ash, then compare with Oak"
    ],
    "answer": "Oak with Ash",
    "explanation": "Oak and Ash use different checkpoints under the same scoring settings. Oak and Elm also differ in stride, which changes the window overlap and can change the history available to a target. Elm and Ash compare two strides at checkpoint v2."
  },
  {
    "question": "The same 20 scored bytes give model Reed total NLL 6 nats over 3 tokens and model Moss 8 nats over 10 tokens. Which BPB pair and raw-token comparison are valid?",
    "options": [
      "Reed 0.433, Moss 0.577; raw token PPL is not a controlled comparison.",
      "Reed 0.433, Moss 0.577; raw token PPL isolates model quality.",
      "Reed 2.000, Moss 0.800; raw token PPL is not a controlled comparison.",
      "Reed 2.000, Moss 0.800; raw token PPL isolates model quality."
    ],
    "answer": "Reed 0.433, Moss 0.577; raw token PPL is not a controlled comparison.",
    "explanation": "Divide each total by 20 ln(2), giving 0.433 and 0.577 BPB. The 2.0/0.8 values are nats per token. Different token units make raw token PPL unsuitable for isolating fit even though both runs cover identical bytes."
  },
  {
    "question": "A no-BOS document has positions 0 through 11. Three windows read [0,6), [3,9), [6,12) and score [1,6), [6,9), [9,12), respectively. How many distinct targets contribute, and how many times is position 7 scored?",
    "options": [
      "11 targets; once",
      "12 targets; once",
      "11 targets; twice",
      "9 targets; twice"
    ],
    "answer": "11 targets; once",
    "explanation": "The scored spans contain 5 + 3 + 3 = 11 distinct positions, 1 through 11. Position 7 is read again in the final window but its loss belongs only to the middle window. Initial position 0 acts as context because no BOS token precedes it."
  },
  {
    "question": "Model A (memorized/overfit) scores held-out PPL 6.4 and 38% accuracy on an unseen factual QA suite. Model B (post-trained) scores held-out PPL 9.8 and 84% accuracy on the same QA suite. Which statement accurately describes this comparison?",
    "options": [
      "Model A wins the QA benchmark because lower perplexity yields stronger reasoning.",
      "Model B wins for QA because post-training raises task accuracy with higher prose PPL.",
      "Models share identical tokenizers whenever downstream QA accuracy stays balanced.",
      "Model B shows higher perplexity because held-out QA prompts leaked into pretraining."
    ],
    "answer": "Model B wins for QA because post-training raises task accuracy with higher prose PPL.",
    "explanation": "Perplexity tracks unconditional next-token cross-entropy on the evaluation text, whereas downstream benchmarks measure task accuracy directly. Post-training sharpening frequently produces an alignment tax in raw prose PPL while dramatically raising benchmark performance."
  },
  {
    "question": "The label rows before the causal shift are [−100, 3, −100, 4, 5] and [7, −100, 1, −100, 2]. The loss ignores −100. After the shift, how many targets contribute to the loss across both rows?",
    "options": [
      "4",
      "5",
      "6",
      "8"
    ],
    "answer": "5",
    "explanation": "Each logit predicts the next label, so skip the first label in each row. The first row contributes 3, 4 and 5. The second contributes 1 and 2, for five targets in total."
  },
  {
    "question": "A frozen checkpoint trained on a passage later copied into evaluation under a new ID. Which repair produces clean generalization evidence from the existing checkpoint?",
    "options": [
      "Evaluate on an independent holdout verified with overlap decontamination.",
      "Delete the old training-manifest row and reevaluate the copied passage.",
      "Assign a fresh sample ID to the copied passage and recompute target loss.",
      "Convert the copied passage score into bits per byte and check the ranking."
    ],
    "answer": "Evaluate on an independent holdout verified with overlap decontamination.",
    "explanation": "An independent source holdout replaces the contaminated evaluation material. Deleting or renaming a record leaves trained weights and copied content unchanged; changing units does not remove exposure."
  },
  {
    "question": "A causal model scores each target from left context and reports 5. A masked model scores each hidden target from both sides and reports pseudo-perplexity 3. Do these share one conditioning objective, and does their raw ranking isolate a model improvement?",
    "options": [
      "Same objective; yes.",
      "Same objective; no.",
      "Different objectives; yes.",
      "Different objectives; no."
    ],
    "answer": "Different objectives; no.",
    "explanation": "The masked score uses right context as well as left context. It is a separately labeled pseudo-perplexity, so its raw value cannot isolate a causal checkpoint improvement."
  }
]
```

> **Next:** Continue to [LLM Benchmarks & Limitations](/learn/llm-evaluation-benchmarks-limitations).
