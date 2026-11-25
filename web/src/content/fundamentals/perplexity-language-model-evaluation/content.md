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

<!-- leetllm: edition:reference:start -->

A teammate announces that a new checkpoint dropped validation perplexity from **8.17** down to **1.90**, a massive win. Then you check the config: the old run used a subword tokenizer and the new one switched to characters. On the exact same text, the "1.90 PPL" model was actually *more* surprised!

**<span data-glossary="perplexity">Perplexity</span>** is the cleanest way to score how well a causal language model predicts held-out text, provided every evaluation control stays fixed. It is also one of the easiest metrics in ML to misread, both when scoring rules shift and when people mistake smooth prose fit for downstream reasoning or factual accuracy.

## From token surprise to perplexity

During evaluation, you do not sample continuations. You teacher-force real held-out text through the model and read the probability $p_\theta(x_i \mid x_{<i})$ assigned to each actual next <span data-glossary="token">token</span>. Its **<span data-glossary="negative-log-likelihood">negative log-likelihood</span>** (NLL), or surprise, is $-\ln p$. A certain hit ($p = 1$) costs $0$ nats; a confident miss ($p = 0.001$) costs $6.908$ nats.

Averaging NLL across $N$ scored tokens gives the causal <span data-glossary="cross-entropy">cross-entropy</span> loss $L$, and exponentiating gives perplexity:

$$
L = -\frac{1}{N}\sum_{i=1}^{N}\ln p_\theta(x_i \mid x_{<i}), \qquad \text{PPL} = \exp(L) = 2^{L / \ln 2}
$$

Perplexity acts like an **effective branching factor**: guessing uniformly among $K$ equally likely tokens yields $p = 1/K$ and $\text{PPL} = K$. Because the mapping is exponential, every $+\ln 2 \approx 0.693$ nats doubles perplexity, and a confidently wrong model can easily exceed its own vocabulary size (assigning $p = 0.01$ to every token in a 2-token vocabulary gives $\text{PPL} = 100$). Note that this formula applies to causal next-token models; masked models like BERT require separately labeled **pseudo-perplexity** that conditions on both left and right context.[^huggingface_ppl][^salazar2020MaskedScoring]

<figure>
  <img src="illustrations/_generated/perplexity_chart_dark.png" alt="Left: the curve of negative log p against probability p, with three observed targets marked: p 0.80 costs 0.223 nats, p 0.50 costs 0.693, and p 0.10 costs 2.303. Right: those losses laid end to end total 3.219 nats. Dividing by three targets gives a mean of 1.073 nats, and exponentiating gives perplexity 2.92." />
  <figcaption>Transform each observed probability with $-\ln p$, average the losses (1.073 nats), and exponentiate once to get PPL 2.92.</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/loss_to_ppl_curve_dark.png" alt="The exponential curve from average loss in nats to perplexity, for losses 0 to 4.7. A staircase climbs it through perplexity 5, 10, 20, 40, and 80. Every horizontal step is ln 2, about 0.693 nats, and every step doubles perplexity." />
  <figcaption>Each constant step of $\ln 2 \approx 0.693$ nats doubles perplexity, so compare training runs in nats or bits rather than raw PPL differences.</figcaption>
</figure>

### Computing stably from logits and aggregating once

Models output raw <span data-glossary="logits">logits</span>, not probabilities. Calling `exp(1000)` directly overflows IEEE 754 floats, so evaluators subtract `max(logits)` before computing log-softmax (built into PyTorch's cross-entropy[^pytorchCrossEntropy2026]). Two other numerical rules save subtle bugs:

1. **Keep `inf` distinct from `NaN`:** An exact zero probability for an observed token gives infinite NLL; a `NaN` means the computation itself broke. And if finite mean NLL is huge (say 1,000 nats), report the loss rather than clipping it to avoid `exp` overflow.
2. **Never average window or worker perplexities:** Exponentiation is nonlinear and windows have uneven target counts. Sum total NLL and total valid target counts across all windows and workers, divide once, and exponentiate once.

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

Raw perplexity isolates model weights **only** when the dataset split, preprocessing, tokenizer revision, context length, <span data-glossary="stride">stride</span>, document boundaries, and special-token masking stay identical (with `model.eval()`, dropout disabled, and raw unmodified logits). Evaluate important domains separately too: the **Paloma** benchmark showed that low perplexity on one corpus often hides large regressions on code, scientific prose, or other domains.[^almazrouei2024]

<figure>
  <img src="illustrations/_generated/ppl_scores_dark.png" alt="Perplexity comparison across context lengths on wikitext-eval-v3 using tokenizer bpe-v7 and stride 512. At 2048 tokens of context, checkpoint 0400 scores PPL 3.18 and checkpoint 0800 scores PPL 2.31, cleanly isolating weight changes. A shorter 512-token context run sits on a different curve and cannot be compared directly." />
  <figcaption>Comparing checkpoint 0400 (3.18) and 0800 (2.31) at matched 2048-token context and stride 512 isolates model weights; shrinking context to 512 shifts the evaluation curve.</figcaption>
</figure>

When two models use **different tokenizers**, raw token PPL breaks because each tokenizer splits the same string into different prediction events.[^huggingface_ppl] Solve this by dividing total NLL over the exact same raw UTF-8 byte count $B$, giving **bits per byte (BPB)** (used by The Pile and Paloma):[^gao2020][^almazrouei2024]

$$
\text{BPB} = \frac{-\sum_i \ln p_\theta(x_i \mid x_{<i})}{B \ln 2}
$$

Also inspect text normalization before computing BPB: lossy preprocessing (like SentencePiece's optional NFKC + whitespace folding[^sentencepieceNormalization2026]) collapses distinct UTF-8 strings (`'Ａ  a'`, `'A a'`, `'a a'`) into fewer bytes and an easier prediction target!

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

Documents longer than the model's context window must be scored in windows. Disjoint blocks starve tokens near each cut of left context; overlapping **strided windows** reuse left context while masking already-scored prefix tokens with `-100` so every target token enters the loss exactly once.[^huggingface_ppl] On WikiText-2 with GPT-2 Large, simply halving stride from 1,024 to 512 drops PPL from **19.44** to **16.44** with zero weight changes! (Compare GPT-2's original 19.93 benchmark with its own detokenizer.[^radford2019])

<figure>
  <img src="illustrations/_generated/sliding_window_eval_dark.png" alt="Three five-token windows over tokens A through J. The first reads A to E and scores B, C, D, and E. The second reads D to H and scores F, G, and H. The third reads F to J and scores I and J. Nine losses appear exactly once each, and A is never scored. They sum to 4.26 nats, the mean is 0.473, and perplexity is 1.61." />
  <figcaption>Three overlapping 5-token windows read context (shaded) and score B through J (filled) exactly once each.</figcaption>
</figure>

> **Common mistake:** In causal LM evaluation, logit $t$ predicts token $t+1$, so you pair `logits[:, :-1]` with `labels[:, 1:]` and count valid (`!= -100`) targets **after** shifting! Subtracting `batch_size` from unshifted valid labels silently undercounts every overlapping window whose position 0 was already masked to `-100`.

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

Even a spotless perplexity pipeline measures only next-token prose fit. Post-training (SFT and RLHF) concentrates probability mass onto helpful answer trajectories, often causing a small **alignment tax** (slightly higher prose PPL) while driving verifiable task accuracy dramatically upward.[^holtzman2020] Conversely, memorizing easy boilerplate preambles (`"The answer is clearly..."`) drives sequence perplexity way down even while failing the crucial factual answer token!

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

When evaluating open-ended responses with LLM judges, calibrate against human labels and watch for <span data-glossary="position-bias">position</span> and verbosity bias.[^zheng2023] Finally, protect both perplexity and downstream benchmarks from **<span data-glossary="benchmark-contamination">contamination</span>**: check n-gram text overlap (not just document IDs!), rotate fresh challenge sets like LiveBench,[^white2024] and remember that deleting a leaked document from a training manifest never erases it from an already-trained checkpoint.

<figure>
  <img src="illustrations/_generated/contamination_pressure_dark.png" alt="Left: document d103 appears in both the training split (d101, d102, d103) and the validation split (d103, d201, d202), contaminating held-out perplexity. Right: a clean evaluation protocol keeps fixed holdout documents d201 and d202 disjoint across runs while rotating fresh challenge subsets d301, d302, and d303." />
  <figcaption>Pair stable decontaminated holdouts for regression tracking with rotating fresh challenge sets to catch memorization.</figcaption>
</figure>

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
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

A teammate posts in the channel: the new checkpoint has perplexity 1.90, the old one had 8.17. That looks like a fourfold improvement, and someone is already asking when to ship it. Then you learn that the new checkpoint uses a character tokenizer and the old one uses subwords. By the end of this chapter, you will see that on the same text, the model with the "better" score was actually more surprised. Nothing was miscalculated. The two numbers just weren't measuring the same thing.

**Perplexity** is the standard way to ask how well a language model predicts text it has not seen, and it is a good metric. It is also one of the easiest in machine learning to misread, because the formula takes a minute to learn and the conditions behind it take much longer. So we will do both. We'll build the score by hand from three probabilities, then go through what has to be true before two scores can be compared.

Read `Rain falls now`. Suppose a tokenizer keeps each word whole, which gives three prediction targets, and the model assigned the tokens that really appeared probabilities 0.50, 0.10, and 0.80. Decoding picked a token from a distribution. Evaluation does something different: it feeds in the real text and asks how much probability the model gave to what really came next.

## Turn probability into surprise

We want a penalty for each target that is zero when the model was certain and right, and that grows as the model's probability shrinks. The negative log does exactly this:

$$
\ell_t=-\ln P_\theta(x_t\mid x_{<t}).
$$

This is the **negative log-likelihood**, or NLL, and it is the same quantity as the cross-entropy loss you see in training logs. With natural logs, the unit is nats. Logs also turn the product of sequence probabilities into a sum, which you can accumulate without underflow. For $N$ scored targets, the average and the perplexity are:

$$
\overline{\ell}=\frac{1}{N}\sum_{t=1}^{N}\ell_t,
\qquad
\operatorname{PPL}=\exp(\overline{\ell}).
$$

Here is what that does to our three targets:

<figure>
  <img src="illustrations/_generated/perplexity_chart_dark.png" alt="Left: the curve of negative log p against probability p, with three observed targets marked: p 0.80 costs 0.223 nats, p 0.50 costs 0.693, and p 0.10 costs 2.303. Right: those losses laid end to end total 3.219 nats. Dividing by three targets gives a mean of 1.073 nats, and exponentiating gives perplexity 2.92." />
  <figcaption>The curve is steep near zero, so a confident miss costs far more than an easy hit can win back. The 0.10 target contributes most of the total.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-perplexity-definition -->
```python title="score-observed-targets.py"
import math

observed_probabilities = [0.50, 0.10, 0.80]
losses = [-math.log(probability)
          for probability in observed_probabilities]
average_nll = sum(losses) / len(losses)
print("token NLL:", [round(value, 3) for value in losses])
print("average NLL:", round(average_nll, 3))
print("perplexity:", round(math.exp(average_nll), 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
token NLL: [0.693, 2.303, 0.223]
average NLL: 1.073
perplexity: 2.92
```
<!-- leetllm: output:end -->

So what does 2.92 mean? If a model gave probability $1/K$ to each of $K$ equally likely choices at every step, its perplexity would be exactly $K$. So you can read our result like this: on average, the model was as uncertain as if it faced about 2.92 equally likely options at each step. The real vocabulary is much larger, and the real distributions are nothing like uniform. It is a useful way to picture the number, not a count of anything.

The effective-choices story has one surprise, which is that perplexity can exceed the vocabulary size. A two-token model that gives only 0.01 to every token that actually appears scores 100. It would have done better by guessing uniformly. Under uniform guessing the model would score 2, and this model has managed to be confidently wrong. Formally, PPL is the inverse of the geometric mean of the probabilities given to observed tokens, which is why averaging the probabilities first gives a different and wrong answer.

You will see the same surprise in two units. Training logs usually show nats, from natural logs, and information theory often uses bits. To convert, divide nats by $\ln 2$. Perplexity is the same number either way, since $\exp(L)=2^{L/\ln2}$.

The exponential is also why people misjudge changes in perplexity. Each fixed step of loss *multiplies* the score:

<figure>
  <img src="illustrations/_generated/loss_to_ppl_curve_dark.png" alt="The exponential curve from average loss in nats to perplexity, for losses 0 to 4.7. A staircase climbs it through perplexity 5, 10, 20, 40, and 80. Every horizontal step is ln 2, about 0.693 nats, and every step doubles perplexity." />
  <figcaption>Every horizontal step is $\ln 2\approx0.693$ nats, and every step doubles perplexity. A one-point drop near 80 and a one-point drop near 5 are very different amounts of loss, so compare runs in loss.</figcaption>
</figure>

## Scoring logits without overflowing

Models return logits, not probabilities, so a real evaluator computes log-softmax. The naive path can blow up. Take logits `[1000, 998, 997]`. Calling `exp(1000)` overflows even though the eventual probabilities are perfectly ordinary. Subtract the largest logit first and you get `[0, -2, -3]`, with exactly the same softmax distribution:

<!-- leetllm: test, output=show, id=reader-perplexity-stability -->
```python title="score-large-logits-stably.py"
import math

logits = [1000.0, 998.0, 997.0]
target = 0
shifted = [value - max(logits) for value in logits]
log_normalizer = math.log(sum(math.exp(value) for value in shifted))
nll = log_normalizer - shifted[target]
print("NLL:", round(nll, 3))
print("PPL:", round(math.exp(nll), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
NLL: 0.17
PPL: 1.185
```
<!-- leetllm: output:end -->

Framework cross-entropy normally does this for you.[^pytorchCrossEntropy2026] You still have to tell apart two failures that can look alike on a dashboard. A target given exactly zero probability has infinite loss, which is a legitimate and terrible result. `NaN` means the measurement itself broke, so reject that run and do not publish a score from it. A large finite loss can also overflow the final exponential, as `math.exp(1000)` does. In that case keep and compare the loss rather than clipping it to a presentable number.

## A score needs its conditions

A lower perplexity means better next-token fit only when the runs predicted the same things from the same information. The weights are one input to the number among many. Record these with every result:

| Condition | Why it changes the score |
|---|---|
| Corpus and split | Topics differ in difficulty, and training data is not held out |
| Tokenizer and normalization | They define the targets, and can erase distinctions |
| Objective | Causal next-token prediction differs from masked-token scoring |
| Context length and stride (how far each window moves) | They set how much history each target gets |
| Document boundaries | Resetting context differs from joining documents |
| Special and first tokens | They change which predictions count |
| Target mask | It sets both the numerator and the denominator |

Also record the checkpoint revision, and score raw model output: evaluation mode, dropout off, no sampling, and unmodified logits. Temperature or top-k changes the distribution you are scoring, so the settings from the decoding chapter have no place here.

Here is what a valid comparison looks like, and what a tempting invalid one looks like:

<figure>
  <img src="illustrations/_generated/ppl_scores_dark.png" alt="Perplexity comparison across context lengths on wikitext-eval-v3 using tokenizer bpe-v7 and stride 512. At 2048 tokens of context, checkpoint 0400 scores PPL 3.18 and checkpoint 0800 scores PPL 2.31, cleanly isolating weight changes. A shorter 512-token context run sits on a different curve and cannot be compared directly." />
  <figcaption>Going from 3.18 to 2.31 at matched 2048-token context isolates the weights, since nothing else changed. Dropping to 512 context tokens shifts the conditioning curve itself, so that score answers a different question.</figcaption>
</figure>

Even a perfectly controlled comparison speaks only for its corpus. Paloma was built because one held-out distribution can hide large gaps elsewhere: a model that looks healthy on one source can look much worse on another under the same protocol.[^almazrouei2024] So report important domains separately. A biomedical score is not a Python code score, and a large easy slice can dominate an average while another domain regresses.

Two more objective traps come up in practice. Chat models raise the question of which text you are scoring: a full transcript with system and user turns, or only the assistant's spans given that context. Those answer different questions, so use the [template from the last chapter](/learn/supervised-fine-tuning-pipeline) to define the exact stream, then report the spans. And masked models such as BERT predict masked positions using text on both sides. A pseudo-perplexity from masking each position separately is a useful number with its own label, and you shouldn't rank it against a causal model's score.[^salazar2020MaskedScoring]

## Aggregate the loss exactly once

Say one evaluation window has mean NLL 0.50 over two targets, and another has 2.00 over eight. The second holds four times as many observations. The right corpus score weights them by target count: $(2\times0.50+8\times2.00)/10=1.70$ nats, for a PPL of 5.47. The tempting shortcut is to average the two window PPLs, which gives 4.52. That is wrong twice over: it gives the short window too much say, and exponentials do not average.

<!-- leetllm: test, output=show, id=reader-perplexity-aggregation -->
```python title="combine-unequal-windows.py"
import math

windows = [(0.50, 2), (2.00, 8)]
total_nll = sum(mean_loss * targets for mean_loss, targets in windows)
total_targets = sum(targets for _, targets in windows)
correct = math.exp(total_nll / total_targets)
window_ppls = [math.exp(mean_loss) for mean_loss, _ in windows]
wrong = sum(window_ppls) / len(window_ppls)
print("target-weighted PPL:", round(correct, 2))
print("mean window PPL:", round(wrong, 2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
target-weighted PPL: 5.47
mean window PPL: 4.52
```
<!-- leetllm: output:end -->

The same trap hides inside one padded batch. Suppose the first row has two easy targets and the second has one hard target. Average the two row means, and the single hard target gets half the weight when it deserves a third. This bug is easiest to hit in distributed evaluation, and one design rule prevents it. Have every worker and batch report total NLL and target count, never a rounded PPL. Add them up, divide once, and exponentiate once. Keep per-document losses too, because you need them for domain breakdowns and for uncertainty. For a small difference between two checkpoints, compare paired document losses and resample whole documents, or larger groups if documents share a source. Adjacent tokens are not independent samples, so treating them that way will make you far too confident.

## Tokenizers change the unit

Now back to the opening message. The string `Rain falls now` is fourteen bytes. Suppose a subword model sees four targets and has total loss 8.4 nats, and a character model sees fourteen targets and has total loss 9.0. Both get a beginning token, and both score every text token.

Token PPL divides by the number of targets, and those differ. The character model spreads slightly *more* total surprise over many more, easier targets, so its per-token number looks wonderful. To compare fairly, divide total surprise by something both models share, the raw bytes:[^gao2020][^almazrouei2024]

$$
\operatorname{BPB}=\frac{\text{total NLL in nats}}{\text{raw UTF-8 bytes}\times\ln2}.
$$

<!-- leetllm: test, output=show, id=reader-perplexity-bpb -->
```python title="compare-tokenizers-on-one-denominator.py"
import math

byte_count = len("Rain falls now".encode("utf-8"))
runs = {"subword": (8.4, 4), "character": (9.0, 14)}
for name, (total_nll, targets) in runs.items():
    ppl = math.exp(total_nll / targets)
    bpb = total_nll / (byte_count * math.log(2))
    print(f"{name}: token PPL {ppl:.2f}, bits per byte {bpb:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
subword: token PPL 8.17, bits per byte 0.866
character: token PPL 1.90, bits per byte 0.927
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/tokenizer_normalization_dark.png" alt="The fourteen bytes of Rain falls now, aligned with four subword pieces (Rain, space falls, space n, and ow) and fourteen character targets. Over the same bytes, the subword model has total loss 8.4 nats, token perplexity 8.17, and 0.866 bits per byte. The character model has 9.0 nats, token perplexity 1.90, and 0.927 bits per byte. Token perplexity favors the character model, and bits per byte favors the subword model." />
  <figcaption>Same bytes, cut into different numbers of targets. Token PPL favors the character model, and bits per byte reverses the ranking. Dots mark spaces.</figcaption>
</figure>

The ranking flips. On the same text, the subword model was less surprised overall. Hugging Face's documentation warns about exactly this tokenizer dependence.[^huggingface_ppl] So my rule is simple: do not compare raw token PPL across different tokenizers. Use bits per byte. Paloma still prefers one shared vocabulary whenever the experiment allows it, since that is the stronger control.[^almazrouei2024] Don't force it by swapping a trained checkpoint's tokenizer, though, because the [tokenization chapter](/learn/tokenization-bpe-wordpiece-sentencepiece) showed that this breaks the model.

A shared denominator also needs a shared target. If one pipeline lowercases text or collapses repeated spaces before predicting, it has an easier job, since it no longer has to predict what it erased. SentencePiece, for one, can apply a custom NFKC variant and whitespace cleanup before it cuts anything.[^sentencepieceNormalization2026] Here is a deliberately lossy normalizer:

<!-- leetllm: test, output=show, id=reader-perplexity-normalization -->
```python title="see-what-normalization-erases.py"
import math
import unicodedata

def normalize(text):
    folded = unicodedata.normalize("NFKC", text).casefold()
    return " ".join(folded.split())

for raw in ["\uff21  a", "A a", "a a"]:
    print(ascii(raw), "becomes", ascii(normalize(raw)))

raw = "\uff21  a"
total_nll = 1.2  # A loss we made up, on the normalized text.
raw_bytes = len(raw.encode("utf-8"))
kept_bytes = len(normalize(raw).encode("utf-8"))
bits = total_nll / math.log(2)
print("per raw byte:", round(bits / raw_bytes, 3))
print("per kept byte:", round(bits / kept_bytes, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
'\uff21  a' becomes 'a a'
'A a' becomes 'a a'
'a a' becomes 'a a'
per raw byte: 0.289
per kept byte: 0.577
```
<!-- leetllm: output:end -->

Three different strings collapse into one, and the model never has to tell them apart. Dividing by the six original bytes gives a flattering 0.289, even though the scored text has lost which `A` and which spacing occurred. So decide whether your benchmark is on normalized text or raw text, use the same target and denominator for both runs, and inspect what each tokenizer preserves. Also report how much text fits in each model's context limit, because 1,024 tokens can cover very different amounts of history under different tokenizers.

## Reuse context, score each target once

A real test file is far longer than a model's context, so you evaluate in windows. Disjoint windows are fast, but each token at a window's edge loses its history. Overlapping windows restore it, and the trap is that overlapping can quietly score the same target twice.

The fix is to separate what a window *reads* from what it *scores*. For tokens A through J and a five-token window:

<figure>
  <img src="illustrations/_generated/sliding_window_eval_dark.png" alt="Three five-token windows over tokens A through J. The first reads A to E and scores B, C, D, and E. The second reads D to H and scores F, G, and H. The third reads F to J and scores I and J. Nine losses appear exactly once each, and A is never scored. They sum to 4.26 nats, the mean is 0.473, and perplexity is 1.61." />
  <figcaption>Filled cells are scored, with their loss shown, and shaded cells are context only. Each target from B through J counts exactly once. With no beginning token, A has nothing to condition on, so it stays unscored.</figcaption>
</figure>

Then there is the off-by-one that the causal shift invites. A logit at position 0 predicts the label at position 1, so a direct loss pairs `logits[:-1]` with `labels[1:]`, and you count valid labels *after* that shift. Subtracting the batch size from an unshifted count removes a real target whenever the first label was already ignored. Many model wrappers do the shift internally, so don't shift twice.

<!-- leetllm: test, output=show, id=reader-perplexity-targets -->
```python title="count-shifted-targets.py"
windows = [
    ("ABCDE", [False, True, True, True, True]),
    ("DEFGH", [False, False, True, True, True]),
    ("FGHIJ", [False, False, False, True, True]),
]
scored = []
for text, target_mask in windows:
    pairs = zip(text[1:], target_mask[1:])
    shifted_targets = [token for token, active in pairs if active]
    scored.extend(shifted_targets)
    print(text, "scores", "".join(shifted_targets))
assert scored == list("BCDEFGHIJ")
print("scored exactly once:", len(scored) == len(set(scored)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ABCDE scores BCDE
DEFGH scores FGH
FGHIJ scores IJ
scored exactly once: True
```
<!-- leetllm: output:end -->

A bookkeeping test on strings says nothing about your loss code, so run that same check through your real evaluator. Reject any evaluation with zero valid targets rather than dividing by zero.

How much does this matter? Hugging Face reports GPT-2 Large on WikiText-2 at PPL 19.44 with no overlap (`stride = 1024`), and 16.44 with half overlap (`stride = 512`).[^huggingface_ppl] Same weights, same corpus, and a change of three points from context alone. A team could easily announce that as a model improvement. So store `max_context_tokens`, `stride_tokens`, and the first-token rule beside every score.

```checkpoint
Eight workers each compute PPL over their shard, and you report the mean. Shards have different sizes. What is wrong, and what should each worker send instead?
---
Averaging PPLs gives small shards too much weight, and exponentials do not average. Each worker should send total NLL and target count. Sum both, divide once, then exponentiate once.
```

## Keep the test set clean

Perplexity measures generalization only if the model has not seen the text. If training included your evaluation records, a low loss may simply be memory. An ID comparison catches the obvious case, and it misses copied text under new IDs and near duplicates, so check normalized text n-grams and source lineage as well.

<figure>
  <img src="illustrations/_generated/contamination_pressure_dark.png" alt="Left: document d103 appears in both the training split (d101, d102, d103) and the validation split (d103, d201, d202), contaminating held-out perplexity. Right: a clean evaluation protocol keeps fixed holdout documents d201 and d202 disjoint across runs while rotating fresh challenge subsets d301, d302, and d303." />
  <figcaption>On the left, shared document <code>d103</code> contaminates the holdout. On the right, stable holdout splits track regressions over time while a rotating fresh challenge set prevents overfitting to one frozen benchmark.</figcaption>
</figure>

The left side hides a mistake that is easy to make under deadline: deleting document 103 from the training manifest and declaring the problem solved. The checkpoint already trained on it. Editing a list does not change the weights, so you have to replace the evaluation material or retrain without it.

Selection is a slower version of the same leak. If you keep picking checkpoints by their test score, the test set stops being a test. Keep development cases for iteration, and evaluate your frozen choice on a separate holdout. Public benchmarks have the same exposure, because their questions can end up in later training data. LiveBench reduces that risk with frequently updated questions from recent sources, though future training corpora can still absorb them.[^white2024]

## Report what someone else needs to check it

A perplexity number on its own invites all of the mistakes in this chapter, so ship it with every condition from the earlier table, plus the total NLL, the target count, and the result of your leakage check. Keep domain breakdowns and per-document losses alongside them.

Two checks are worth automating. Refuse to compare two reports when any of those conditions differ, because that catches the opening scenario before anyone gets excited. And reject reports with zero targets or a `NaN` score, because a pipeline that fails quietly can otherwise publish a number that looks fine. Link every clean-split claim to the decontamination check and corpus revision that produced it.

## What perplexity will not tell you

Now the most important limit. Suppose you compare three checkpoints scored with the same tokenizer on the same held-out corpus: an overfit/memorized model (`PPL 6.4`), a base pretrained model (`PPL 8.9`), and a post-trained instruction-tuned model (`PPL 9.8`). Pretraining perplexity measures how well the weights predict general prose, not whether the checkpoint follows instructions or stays grounded on unseen reasoning tasks.

<figure>
  <img src="illustrations/_generated/evaluation_stack_dark.png" alt="Scatter comparison of held-out validation perplexity against downstream task accuracy across three checkpoints: a memorized checkpoint scores low perplexity 6.4 with only 38 percent task accuracy, a base pretrained checkpoint scores perplexity 8.9 with 52 percent accuracy, and a post-trained instruction-tuned checkpoint reaches 84 percent accuracy despite slightly higher perplexity 9.8." />
  <figcaption>Perplexity selects the memorized or base model for raw prose fit, whereas downstream benchmarks pick the instruction-tuned checkpoint (84% accuracy) despite its slight alignment tax in validation perplexity.</figcaption>
</figure>

Use perplexity for the question it answers. Did this checkpoint get better at predicting held-out text? That is a useful thing to know, especially during pretraining, and you can measure it without building a task suite, provided you can read the model's per-token probabilities. Did the post-trained model follow instructions accurately, ground claims in source documents, and abstain when evidence is missing? That requires dedicated downstream benchmarks.

That proviso about probabilities decides who can use this metric. You can read them on weights you run yourself, whereas many hosted APIs either withhold prompt token logprobs altogether or omit them when reasoning modes are active.[^openai2026LatestModel][^anthropic2026MessagesReference][^openai2026ChatReference] Treat perplexity as a tool for models whose full next-token logits you can inspect; to compare hosted models, rely on the task evaluations in the next chapter.

```checkpoint
Four targets get probabilities 0.25, 0.50, 0.125, and 0.50. What are the total NLL, the average, and the perplexity? If the text is 12 bytes long, what is its bits-per-byte score? Now two shards: one has mean NLL 1.00 over 100 targets, the other 2.00 over 300. What is the corpus PPL, and what would the tempting shortcut give?
---
The losses are 1.386, 0.693, 2.079, and 0.693, for a total of 4.852 nats. The average is 1.213, so the perplexity is $e^{1.213}\approx3.36$, the same as $(4\times2\times8\times2)^{1/4}$. Bits per byte are $4.852/(12\times\ln2)\approx0.583$. For the shards, add first: $(100\times1.00+300\times2.00)/400=1.75$ nats, which gives a PPL of 5.75. Averaging the two shard PPLs gives $(2.72+7.39)/2\approx5.05$, which is wrong.
```

## When the number looks wrong

| Symptom | Likely cause | First check |
|---|---|---|
| A big drop right after a tokenizer change | The unit changed, and the model may not have improved | Compute bits per byte on the same raw text |
| Same weights, better score | More context, a smaller stride, or a different split | Compare the recorded conditions |
| A multi-worker score differs from a single-machine run | Averaged means or PPLs | Sum total NLL and target counts instead |
| Infinity or `NaN` in the report | A zero-probability target, or a broken path | Treat them differently: keep the first, and fix the second |
| A score that looks too good | Evaluation text leaked into training | Check overlap by content n-grams and source lineage, not only by ID |
| Low PPL, bad answers | Text fit and task success are different questions | Add task checks and leave the metric alone |
| No way to compute PPL on a hosted model | The API returns no probabilities for your text | Compare it with task checks |

You can now take a reported perplexity and ask the questions that decide whether it means anything: which tokenizer, which corpus, how much context, and how was it added up. Perplexity gives you a precise measure of text fit. It cannot tell you whether a model grounded its claims or followed constraints. The [next chapter](/learn/llm-evaluation-benchmarks-limitations) turns downstream requirements like factuality, grounding, and safety into verifiable benchmarks, and then tests the scorers themselves.

<!-- leetllm: edition:reader:end -->
