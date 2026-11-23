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
  "order": 4
}
---

<!-- leetllm: edition:reference:start -->

The [embedding lesson](/learn/word-embeddings-contextual-representations) followed token IDs into vectors. Now put the model's predictions to a test: when the real next token appears, how much probability did the model assign to it?

Suppose a held-out server log begins `The request returned`. A model that assigns high probability to `500` and almost none to `volcano` fits this local pattern, whereas a model that treats both as equally plausible does not. **<span data-glossary="perplexity">Perplexity</span>** turns that held-out behavior into a single score you can compare across checkpoints, provided the scoring protocol stays fixed.

Even then, that single score can mislead product decisions. One checkpoint can predict held-out prose with slightly lower perplexity yet hallucinate citations or ignore instruction constraints, while a post-trained checkpoint accepts a tiny perplexity increase to gain much higher downstream accuracy. Use perplexity to track next-token fit, then use targeted benchmarks to judge factual grounding and task execution.

> **Prediction-fit metric:** Perplexity measures next-<span data-glossary="token">token</span> fit for causal language models under a fixed evaluation protocol. Assess factuality, helpfulness, and safety through separate downstream benchmarks.

## From surprise to a metric

A causal language model assigns a probability to every possible next token. During evaluation, you don't sample a continuation. You feed the actual preceding text and score the probability assigned to the next token that occurred. This is the same teacher-forced prediction used in [next-token training](/learn/language-modeling-next-token-prediction), now measured on text withheld from training.

If the observed token has probability $p$, its **<span data-glossary="negative-log-likelihood">negative log-likelihood</span>** (NLL), or surprise, is:

$$
\text{surprise}(p) = -\ln(p)
$$

A certain correct prediction has probability 1 and surprise 0. A probability close to 0 produces a large penalty. Confident misses hurt language-model loss the most.

The probabilities below come from one next-token distribution; omitted tokens carry the remaining 0.149 probability. Treat each displayed string as one token. Which observed token would contribute the largest surprise?

<!-- leetllm: test, output=show -->

```python title="compare-token-surprise.py"
import math

probabilities = {
    "500": 0.60,
    "200": 0.25,
    "volcano": 0.001,
}

for token in ["500", "200", "volcano"]:
    surprise = -math.log(probabilities[token])
    print(f"{token:9s} probability={probabilities[token]:.3f} surprise={surprise:.3f} nats")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
500       probability=0.600 surprise=0.511 nats
200       probability=0.250 surprise=1.386 nats
volcano   probability=0.001 surprise=6.908 nats
```
<!-- leetllm: output:end -->

`volcano` contributes the largest loss because its assigned probability is closest to zero. The held-out token matters: if the log says `500`, only the first score counts. It doesn't matter that `200` also sounded reasonable.

```checkpoint
A model assigns probability 0.8 to the observed token on one step and 0.02 on another. Which step dominates its loss, and why?
---
The 0.02 step dominates because negative log-likelihood grows as assigned probability falls. A confident miss contributes far more surprise than an already likely observed token.
```

### Average surprise becomes perplexity

For $N$ scored held-out tokens, the average NLL is:

$$
L = -\frac{1}{N}\sum_{i=1}^{N}\ln p_\theta(x_i \mid x_{<i})
$$

Here $\theta$ identifies the model weights, and $x_{<i}$ is the preceding text available to the evaluator's context window. $N$ counts only targets that contribute loss, leaving padding and conditioning-only context tokens outside that count. Whether the first text token has a beginning-of-sequence token to condition on is a rule we'll make explicit below.

For one-hot next-token targets, that average NLL is also the causal cross-entropy loss: the model's average penalty on the observed next tokens.

Perplexity exponentiates that average:

$$
\text{PPL} = \exp(L)
$$

This is the standard definition used for autoregressive, or causal, language models. It isn't the standard metric for masked models such as BERT, because they predict masked positions rather than the next token in sequence.[^huggingface_ppl]

A masked model can instead be evaluated with **pseudo-perplexity**: mask each text token separately, score its original value using the other tokens, and exponentiate the average penalty. That conditioning includes right context, so the resulting number isn't a causal next-token PPL. Label it separately rather than ranking BERT against a causal model by those two raw scores.[^salazar2020MaskedScoring]

Start with three observed token probabilities. The 0.10 token should dominate the average NLL, but the final PPL should be computed only after that average:

<!-- leetllm: test, output=show -->

```python title="compute-perplexity-from-probabilities.py"
import math

observed_probabilities = [0.50, 0.10, 0.80]
token_nll = [-math.log(probability) for probability in observed_probabilities]
average_nll = sum(token_nll) / len(token_nll)
perplexity = math.exp(average_nll)

print(f"token NLL: {[round(value, 3) for value in token_nll]}")
print(f"average NLL: {average_nll:.3f} nats")
print(f"perplexity: {perplexity:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
token NLL: [0.693, 2.303, 0.223]
average NLL: 1.073 nats
perplexity: 2.92
```
<!-- leetllm: output:end -->

The output means the model behaved, on average, as though it faced about 2.92 equally likely choices at each prediction step. This **effective choice count** expresses the measured surprise through an equivalent uniform-choice problem. The actual vocabulary keeps its original size.

Precisely, PPL is the geometric mean of the reciprocals of the observed-token probabilities. Its targets come from the evaluation text, so it measures surprise on what actually occurred.

PPL can exceed vocabulary size. A two-token model that assigns only 0.01 probability to every observed target gets PPL 100. It can be confidently wrong. Cross-entropy averages penalties over the observed data. The entropy of the model's own distribution would instead weight outcomes by the probabilities the model assigns to them.

<figure>
  <img src="illustrations/_generated/perplexity_chart_dark.png" alt="Left: the curve of negative log p against probability p, with three observed targets marked: p 0.80 costs 0.223 nats, p 0.50 costs 0.693, and p 0.10 costs 2.303. Right: those losses laid end to end total 3.219 nats. Dividing by three targets gives a mean of 1.073 nats, and exponentiating gives perplexity 2.92." />
  <figcaption>The worked example keeps every aggregation step visible: transform each observed probability, average the three token losses, and exponentiate 1.073 to obtain PPL 2.92.</figcaption>
</figure>

A uniform guess among $k$ options has probability $1/k$ and perplexity $k$. That's why people read PPL as a branching factor:

<!-- leetllm: test, output=show -->

```python title="recover-effective-choice-count.py"
import math

for equally_likely_options in [1, 4, 20, 100]:
    probability = 1 / equally_likely_options
    loss = -math.log(probability)
    perplexity = math.exp(loss)
    print(f"{equally_likely_options:3d} options -> loss={loss:.3f}, PPL={perplexity:.1f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
  1 options -> loss=-0.000, PPL=1.0
  4 options -> loss=1.386, PPL=4.0
 20 options -> loss=2.996, PPL=20.0
100 options -> loss=4.605, PPL=100.0
```
<!-- leetllm: output:end -->

Training logs usually show the same average in **nats** (natural log). Information theory often uses **bits**. They're the same surprise in different units: divide nats by $\ln 2$ to get bits per token, and $\mathrm{PPL} = \exp(L) = 2^{L / \ln 2}$.

<!-- leetllm: test, output=show -->

```python title="convert-nats-to-bits.py"
import math

average_nll_nats = 1.073
bits_per_token = average_nll_nats / math.log(2)
from_nats = math.exp(average_nll_nats)
from_bits = 2 ** bits_per_token

print(f"{bits_per_token:.3f} bits/token")
print(f"exp(nats)={from_nats:.2f}")
print(f"2**(bits)={from_bits:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1.548 bits/token
exp(nats)=2.92
2**(bits)=2.92
```
<!-- leetllm: output:end -->

Because the map is exponential, a constant loss step multiplies PPL by a constant factor. Adding $\ln 2 \approx 0.693$ nats doubles the score:

<figure>
  <img src="illustrations/_generated/loss_to_ppl_curve_dark.png" alt="The exponential curve from average loss in nats to perplexity, for losses 0 to 4.7. A staircase climbs it through perplexity 5, 10, 20, 40, and 80. Every horizontal step is ln 2, about 0.693 nats, and every step doubles perplexity." />
  <figcaption>The x-axis uses a continuous loss scale: each additional ln(2), about 0.693 nats, doubles perplexity, so 5 becomes 10 and then 20.</figcaption>
</figure>

Those formulas assume you already have probabilities. A real evaluator starts from logits, and a naive conversion can fail before the average is ever computed.

### Compute from logits without numerical failure

Models produce unnormalized scores called <span data-glossary="logits">logits</span>. A naive implementation calls `exp(logit)` directly. Large logits can overflow even though the eventual <span data-glossary="softmax">softmax</span> probabilities are ordinary values. Stable log-softmax subtracts the largest logit before exponentiating.

Compare raw `exp(1000)` against the shifted log-softmax calculation below to see why subtracting the maximum logit prevents overflow without changing probabilities:

<!-- leetllm: test, output=show -->

```python title="stable-log-softmax-for-perplexity.py"
import math


def stable_log_softmax(logits: list[float]) -> list[float]:
    if not logits or not all(math.isfinite(value) for value in logits):
        raise ValueError("expected nonempty finite logits")
    maximum = max(logits)
    shifted = [value - maximum for value in logits]
    log_normalizer = math.log(sum(math.exp(value) for value in shifted))
    return [value - log_normalizer for value in shifted]


logits = [1000.0, 998.0, 997.0]
observed_token_id = 0

try:
    math.exp(logits[observed_token_id])
except OverflowError:
    print("naive exp(logit) overflowed")

log_probabilities = stable_log_softmax(logits)
nll = -log_probabilities[observed_token_id]
print(f"stable NLL={nll:.3f}, PPL={math.exp(nll):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
naive exp(logit) overflowed
stable NLL=0.170, PPL=1.185
```
<!-- leetllm: output:end -->

In a framework evaluator, <span data-glossary="cross-entropy">cross-entropy</span> normally applies this stable computation for you.[^pytorchCrossEntropy2026] Keeping the subtraction in shifted coordinates also avoids adding a tiny normalizer to a huge logit and losing it to rounding. This helper requires finite logits; reject `NaN` rather than publishing a score from a broken run.

Stable log-softmax doesn't guarantee that the final exponential fits in a floating-point number. A finite average NLL of 1,000 nats overflows `math.exp`; keep and compare the loss itself rather than clipping it to make a presentable PPL. An exactly zero probability for an observed target gives infinite NLL and PPL by definition. Distinguish that case from a `NaN` caused by a broken computation.

```checkpoint
Why should an evaluator accumulate negative log-likelihood instead of multiplying token probabilities together?
---
Products of many probabilities underflow toward zero. Sums of log-probabilities stay numerically usable, and exponentiating the average at the end yields the same perplexity.
```

To compare two finite PPL values, we need to know how each was measured.

## The comparison protocol

A perplexity score is never complete without its units and conditioning rules. At minimum, log:

| Protocol field | Why it changes the score |
|---|---|
| Dataset and split | A biomedical corpus isn't a Python code corpus; train data isn't held-out data. |
| Text preprocessing | Case folding, Unicode normalization, or whitespace cleanup can change the text being predicted. |
| Tokenizer revision | Tokens set the denominator and the events being predicted. |
| Context length and <span data-glossary="stride">stride</span> | More usable left context generally makes token prediction easier. |
| Special-token and masking policy | Scoring or skipping initial and padding tokens changes the aggregate. |
| Document delimiters and scored span | Resetting context between documents differs from concatenating them; scoring answers alone differs from scoring prompts too. |
| Model objective | A causal next-token model isn't directly comparable to a masked-language objective. |

Record the checkpoint revision as well. For ordinary base-model PPL, use evaluation mode with dropout disabled, no sampling, and unmodified logits. Temperature scaling or top-k filtering changes the distribution being scored. A generation-only API that doesn't expose likelihoods for arbitrary target text isn't enough to compute this metric.

Matching those fields makes a checkpoint comparison interpretable. Evaluate each important domain separately, since each corpus samples a particular distribution. Paloma (Perplexity Analysis for Language Model Assessment) was built because perplexity on a single held-out distribution can hide large gaps elsewhere: a model that looks healthy on one source can look much worse on another, even under a controlled protocol.[^almazrouei2024] Log each domain separately rather than letting one corpus stand in for unrelated domains.

<figure>
  <img src="illustrations/_generated/ppl_scores_dark.png" alt="Perplexity comparison across context lengths on wikitext-eval-v3 using tokenizer bpe-v7 and stride 512. At 2048 tokens of context, checkpoint 0400 scores PPL 3.18 and checkpoint 0800 scores PPL 2.31, cleanly isolating weight changes. A shorter 512-token context run sits on a different curve and cannot be compared directly." />
  <figcaption>Comparing checkpoint 0400 (PPL 3.18) and checkpoint 0800 (PPL 2.31) at identical 2048-token context and 512-token stride isolates the model weights, whereas changing context length to 512 shifts the evaluation curve itself.</figcaption>
</figure>

Encode that scoring protocol in code before you compare <span data-glossary="model-checkpoint">checkpoints</span>:

<!-- leetllm: test, output=show -->

```python title="enforce-a-perplexity-protocol.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class EvalProtocol:
    dataset: str
    tokenizer: str
    context_tokens: int
    stride_tokens: int
    text_policy: str = "raw-text-no-external-normalization"
    objective: str = "causal-next-token"
    special_token_policy: str = "skip-padding"
    first_token_policy: str = "skip-unconditioned-first-token"
    masking_policy: str = "score-each-target-once"
    document_policy: str = "reset-context-per-document"
    scored_span: str = "all-text-targets"


def comparable(left: EvalProtocol, right: EvalProtocol) -> bool:
    return left == right


baseline = EvalProtocol("wikitext-eval-v3", "bpe-v7", 2048, 512)
new_checkpoint = EvalProtocol("wikitext-eval-v3", "bpe-v7", 2048, 512)
short_context_run = EvalProtocol("wikitext-eval-v3", "bpe-v7", 512, 512)
different_masking_run = EvalProtocol(
    "wikitext-eval-v3",
    "bpe-v7",
    2048,
    512,
    masking_policy="score-all-window-targets",
)

print("baseline vs new checkpoint:", comparable(baseline, new_checkpoint))
print("baseline vs short context:", comparable(baseline, short_context_run))
print("baseline vs different masking:", comparable(baseline, different_masking_run))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline vs new checkpoint: True
baseline vs short context: False
baseline vs different masking: False
```
<!-- leetllm: output:end -->

Now compare two checkpoints across the same five target positions to observe how per-token probability gains translate into perplexity.

<!-- leetllm: test, output=show -->

```python title="compare-checkpoints-on-one-held-out-set.py"
import math


def perplexity(observed_probabilities: list[float]) -> float:
    if not observed_probabilities or any(
        not math.isfinite(p) or not 0 < p <= 1 for p in observed_probabilities
    ):
        raise ValueError("expected nonempty probabilities in (0, 1]")
    average_nll = math.fsum(-math.log(p) for p in observed_probabilities) / len(
        observed_probabilities
    )
    return math.exp(average_nll)


held_out_probabilities = {
    "checkpoint-0400": [0.31, 0.44, 0.18, 0.52, 0.24],
    "checkpoint-0800": [0.42, 0.59, 0.29, 0.61, 0.35],
}

for name, probabilities in held_out_probabilities.items():
    print(f"{name}: PPL={perplexity(probabilities):.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
checkpoint-0400: PPL=3.18
checkpoint-0800: PPL=2.31
```
<!-- leetllm: output:end -->

The result supports a specific statement: `checkpoint-0800` predicts tokens in this held-out set better under this protocol. Evaluate downstream task accuracy and additional corpora separately. This helper deliberately requires strictly positive probabilities, whereas real evaluators retain a zero-probability target's infinite loss when reporting.

### Aggregate loss once

Evaluation windows are rarely the same size. Averaging window PPLs gives a short window as much influence as a long one. There's a second problem even when counts match: exponentiation is nonlinear, so averaging exponentiated losses isn't the same as exponentiating their average. Sum NLL weighted by scored-token count, divide once, and exponentiate once.

<!-- leetllm: test, output=show -->

```python title="aggregate-loss-before-exponentiating.py"
import math

windows = [
    {"average_nll": 0.50, "scored_tokens": 2},
    {"average_nll": 2.00, "scored_tokens": 8},
]

wrong = sum(math.exp(window["average_nll"]) for window in windows) / len(windows)
total_nll = sum(
    window["average_nll"] * window["scored_tokens"] for window in windows
)
total_tokens = sum(window["scored_tokens"] for window in windows)
right = math.exp(total_nll / total_tokens)

print(f"average of window PPLs: {wrong:.2f}")
print(f"token-weighted corpus PPL: {right:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
average of window PPLs: 4.52
token-weighted corpus PPL: 5.47
```
<!-- leetllm: output:end -->

```checkpoint
Run A reports PPL 12 and run B reports PPL 10. What must be checked before declaring B better?
---
Check that dataset split, tokenizer, context length, stride, masking and special-token policy, and model objective match. If any of those changed, raw PPL no longer isolates model improvement.
```

A matched scoring protocol still assumes both models emit the same kind of token. When vocabularies differ, the denominator itself has changed.

## Different tokenizers need common units

Token-level perplexity depends on <span data-glossary="tokenization">tokenization</span>. The string `Rain falls now` may be four subword tokens for one model and fourteen character tokens for another. A probability event per large subword isn't the same unit as a probability event per character. Hugging Face's perplexity documentation explicitly warns that tokenization affects PPL comparisons.[^huggingface_ppl]

For the same raw UTF-8 evaluation text, **bits per byte** (BPB) gives both models one shared denominator. The Pile preferred BPB as a practical comparison unit when tokenizers differ.[^gao2020]

Paloma adopts that unit when vocabulary can't be held fixed, and still prefers one shared vocabulary whenever the experiment allows it. BPB scores the canonical token sequence each tokenizer chose; it doesn't marginalize over every valid segmentation of the same bytes.[^almazrouei2024]

$$
\text{BPB} =
\frac{-\sum_i \ln p_\theta(x_i \mid x_{<i})}
{B \ln 2}
$$

where $B$ is the byte count of the original scored text. A related metric, bits per character, is useful when a benchmark defines character units instead of bytes. UTF-8 bytes and characters coincide for this ASCII example, but not for text such as `é` (two UTF-8 bytes).

For this comparison, both models receive a beginning-of-sequence (BOS) token and score every text token, including the first. The BOS itself isn't scored or included in the byte count, and neither is an end-of-sequence token. These segmentations and token losses isolate the denominator effect; measure named tokenizers with their actual segmentation and model logits. If a protocol skips an initial token, its skipped byte span can differ across tokenizers, so record that rule and the resulting scored text.

<figure>
  <img src="illustrations/_generated/tokenizer_normalization_dark.png" alt="The fourteen bytes of Rain falls now, aligned with four subword pieces (Rain, space falls, space n, and ow) and fourteen character targets. Over the same bytes, the subword model has total loss 8.4 nats, token perplexity 8.17, and 0.866 bits per byte. The character model has 9.0 nats, token perplexity 1.90, and 0.927 bits per byte. Token perplexity favors the character model, and bits per byte favors the subword model." />
  <figcaption>Centered dots mark spaces. The subword pieces <code>Rain | ·falls | ·n | ow</code> span 4, 6, 2 and 2 bytes. The same fourteen bytes produce four <span data-glossary="subword-tokenization">subword</span> events or fourteen character events, so raw token PPL favors the smaller units while BPB compares total surprise over the shared byte count.</figcaption>
</figure>

Observe how raw token perplexity favors the character model because its loss is spread across more tokens, while bits per byte favors the subword model because its total NLL is lower over the exact same UTF-8 bytes:

<!-- leetllm: test, output=show -->

```python title="compare-tokenizers-with-bits-per-byte.py"
import math

text = "Rain falls now"
byte_count = len(text.encode("utf-8"))
evaluations = [
    {"name": "subword model", "tokens": 4, "total_nll": 8.4},
    {"name": "character model", "tokens": 14, "total_nll": 9.0},
]

for run in evaluations:
    ppl = math.exp(run["total_nll"] / run["tokens"])
    bpb = run["total_nll"] / (byte_count * math.log(2))
    print(f"{run['name']:15s} token PPL={ppl:.2f}, BPB={bpb:.3f}")

print("Lower BPB identifies less surprise on identical bytes.")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
subword model   token PPL=8.17, BPB=0.866
character model token PPL=1.90, BPB=0.927
Lower BPB identifies less surprise on identical bytes.
```
<!-- leetllm: output:end -->

On identical bytes, the character model looks dramatically better under raw token PPL: its slightly larger total loss is spread over more prediction events. BPB reverses that ranking here: the subword model assigned less surprise to the same bytes. Smaller token units alone don't guarantee a lower PPL for every pair of trained models.

Raw token PPL mixes event size with model fit. A larger vocabulary can emit fewer, coarser tokens, while a larger choice set can change per-token surprise. Those effects can pull in opposite directions, so don't infer a tokenizer or model win from vocabulary size alone. BPB fixes the raw-byte denominator, but it doesn't erase every segmentation effect. Keep logging the tokenizer and use a fixed vocabulary when you can.

Fixing vocabulary is a control for models trained with that vocabulary. Swapping an existing checkpoint's tokenizer to create a shared denominator can make its input IDs incompatible with its learned rows, as the [tokenization lesson](/learn/tokenization-bpe-wordpiece-sentencepiece) showed.

### Check what survives normalization

A common byte denominator doesn't restore information discarded before prediction. SentencePiece, for example, can apply a custom NFKC variant and whitespace cleanup before segmentation.[^sentencepieceNormalization2026] If one run erases case or repeated spaces, its loss may describe an easier, different target than a run that preserves them.

Try the following deliberately lossy normalizer. The first input contains a full-width capital A and two spaces. Notice why lossy preprocessing breaks cross-run byte normalization:

<!-- leetllm: test, output=show -->

```python title="audit-text-before-bits-per-byte.py"
import math
import unicodedata


def normalize_text(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


inputs = ["Ａ  a", "A a", "a a"]
for raw in inputs:
    normalized = normalize_text(raw)
    print(f"{raw!r} -> {normalized!r}")

raw = inputs[0]
normalized = normalize_text(raw)
total_nll = 1.2
raw_bytes = len(raw.encode("utf-8"))
normalized_bytes = len(normalized.encode("utf-8"))
print(f"raw bytes={raw_bytes}; normalized bytes={normalized_bytes}")
print(f"loss / raw bytes: {total_nll / (raw_bytes * math.log(2)):.3f}")
print(f"loss / normalized bytes: {total_nll / (normalized_bytes * math.log(2)):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
'Ａ  a' -> 'a a'
'A a' -> 'a a'
'a a' -> 'a a'
raw bytes=6; normalized bytes=3
loss / raw bytes: 0.289
loss / normalized bytes: 0.577
```
<!-- leetllm: output:end -->

The 0.289 value measures loss on normalized text divided by six original bytes. The scored text has already lost which A and spacing occurred. Lossless prediction would also need to distinguish those originals. For a normalized-text benchmark, define that target and denominator consistently for both runs. For a raw-text benchmark, audit what each tokenizer preserves, including unknown-token behavior. This helper combines Python's NFKC, case folding, and whitespace splitting, whereas SentencePiece uses its own configured normalizer.

Also report how much raw-text history fits into each token context limit. BPB aligns the output denominator, while 1,024 input tokens can cover different amounts of text under different tokenizers.

With the output unit fixed, we can turn to the input limit: how should an evaluator score a document longer than the model's context?

## Long documents need a scoring policy

A real evaluation file may contain thousands of tokens, while a model accepts only a fixed number of context tokens. Cutting text into disjoint blocks is fast, but tokens at each block cutoff lose usable left context. A strided sliding window reuses context and scores only newly exposed target tokens.

Disjoint blocks can also lose their first target when no BOS or preceding token exists. Track the set of scored positions alongside its count. A stride smaller than the window leaves overlap; a smaller stride usually gives targets more history but requires more forward passes.

Hugging Face's documentation reports this comparison for GPT-2 Large on WikiText-2: no-overlap `stride = 1024` gives PPL 19.44, while `stride = 512` gives 16.44 for the same model and corpus.[^huggingface_ppl] The small lab below verifies the window bookkeeping with exact per-position target losses. In the published example, extra context improved the aggregate score with fixed model weights. It can still hurt individual predictions, so measure the result of changing the scoring context.

The no-overlap number sits near the 19.93 WikiText-2 result reported for the 762M GPT-2 model. That paper used its own preprocessing and invertible de-tokenizers, which limits the comparison to a rough check of magnitude.[^radford2019] As checked on October 10, 2026, the guide's sample code also subtracts batch size from the valid-label count before checking which labels the causal shift removes. That undercounts overlapping windows whose first label is already ignored. Its published numbers illustrate the context trade-off; use the shifted-target count below for your own evaluator.[^huggingface_ppl]

<figure>
  <img src="illustrations/_generated/sliding_window_eval_dark.png" alt="Three five-token windows over tokens A through J. The first reads A to E and scores B, C, D, and E. The second reads D to H and scores F, G, and H. The third reads F to J and scores I and J. Nine losses appear exactly once each, and A is never scored. They sum to 4.26 nats, the mean is 0.473, and perplexity is 1.61." />
  <figcaption>The grid matches the worked loop exactly. Filled cells show the losses that BCDE, FGH, and IJ contribute. Shaded cells provide context without entering the denominator again.</figcaption>
</figure>

Notice which positions contribute loss in this trace: A provides initial context, and B through J are each scored exactly once.

Now simulate which positions a sliding-window loop scores:

<!-- leetllm: test, output=show -->

```python title="score-each-target-token-once.py"
tokens = list("ABCDEFGHIJ")
windows = [
    {"context": (0, 5), "score": (1, 5)},
    {"context": (3, 8), "score": (5, 8)},
    {"context": (5, 10), "score": (8, 10)},
]

scored_tokens: list[str] = []
for index, window in enumerate(windows, start=1):
    begin, end = window["context"]
    score_begin, score_end = window["score"]
    context = "".join(tokens[begin:end])
    scored = "".join(tokens[score_begin:score_end])
    scored_tokens.extend(tokens[score_begin:score_end])
    print(f"window {index}: context={context}, newly scored={scored}")

print("scored exactly once:", scored_tokens == tokens[1:])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
window 1: context=ABCDE, newly scored=BCDE
window 2: context=DEFGH, newly scored=FGH
window 3: context=FGHIJ, newly scored=IJ
scored exactly once: True
```
<!-- leetllm: output:end -->

This example has no BOS token, so A is input context rather than a scored target. A model that accepts a BOS prefix can predict the first text token from that prefix instead. In a framework implementation, context-only labels are commonly masked with `-100` so cross-entropy ignores them.[^huggingface_ppl]

This dependency-free evaluation loop uses precomputed token NLL values. A real model supplies the losses; aggregation logic stays the same.

<!-- leetllm: test, output=show -->

```python title="aggregate-a-strided-evaluation-run.py"
import math

new_target_losses = [
    [0.30, 0.72, 0.51, 0.43],
    [0.27, 0.61, 0.38],
    [0.56, 0.48],
]

total_nll = sum(sum(window) for window in new_target_losses)
scored_tokens = sum(len(window) for window in new_target_losses)
perplexity = math.exp(total_nll / scored_tokens)

print(f"scored tokens={scored_tokens}")
print(f"average NLL={total_nll / scored_tokens:.3f}")
print(f"PPL={perplexity:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
scored tokens=9
average NLL=0.473
PPL=1.61
```
<!-- leetllm: output:end -->

For every reported PPL, store `max_context_tokens`, `stride_tokens`, the first-token policy, and the masking policy beside the score. These settings determine the prediction events behind the measurement.

### Count targets after shifting labels

The preceding loop assumed somebody had already extracted the right losses. Here is the alignment offset where evaluators often go wrong. A logit vector at input position 0 predicts the label at position 1. We therefore pair `logits[:, :-1]` with `labels[:, 1:]`, then count the labels that remain unmasked.

Run this with PyTorch installed on CPU tensors without external weights. Assigning logit `3.0` to each alphabetical next token and `0.0` to all remaining tokens gives an exact analytical target (`math.log1p(9 * math.exp(-3))`), verifying label shifting, padding ignore masks, and token-weighted batch aggregation simultaneously.

<!-- leetllm: test, deps=torch, output=show -->

```python title="count-shifted-targets.py"
import math
import torch
import torch.nn.functional as F

token_ids = torch.arange(10)  # A=0 through J=9
windows = [(0, 5, 1), (3, 8, 5), (5, 10, 8)]
total_nll = 0.0
total_targets = 0
wrong_targets = 0

for begin, end, score_begin in windows:
    input_ids = token_ids[begin:end].unsqueeze(0)
    labels = input_ids.clone()
    labels[:, :score_begin - begin] = -100

    logits = torch.zeros(1, end - begin, 10, dtype=torch.float64)
    next_ids = (input_ids + 1) % 10
    logits.scatter_(2, next_ids.unsqueeze(-1), 3.0)

    shifted_logits = logits[:, :-1, :].reshape(-1, 10)
    shifted_labels = labels[:, 1:].reshape(-1)
    count = int((shifted_labels != -100).sum())
    loss_sum = F.cross_entropy(
        shifted_logits, shifted_labels, ignore_index=-100, reduction="sum"
    )
    # Wrong: position 0 was already masked, so subtracting one drops a target.
    wrong_count = int((labels != -100).sum()) - labels.shape[0]
    print(f"window {begin}:{end}: correct={count}, wrong={wrong_count}")
    total_nll += loss_sum.item()
    total_targets += count
    wrong_targets += wrong_count

assert total_targets == 9
expected_nll = math.log1p(9 * math.exp(-3))
assert math.isclose(total_nll, 9 * expected_nll, rel_tol=1e-12)
print(f"correct targets={total_targets}; wrong targets={wrong_targets}")
print(f"shifted PPL={math.exp(total_nll / total_targets):.3f}")

# Two padded rows contribute different numbers of targets and different losses.
batch_labels = torch.tensor([[-100, 1, 2], [-100, -100, 3]])
batch_logits = torch.zeros(2, 3, 10, dtype=torch.float64)
batch_logits[0, 0, 1] = batch_logits[0, 1, 2] = 3.0
shifted = batch_labels[:, 1:]
losses = F.cross_entropy(
    batch_logits[:, :-1].reshape(-1, 10), shifted.reshape(-1),
    ignore_index=-100, reduction="none",
).reshape(2, 2)
counts = (shifted != -100).sum(dim=1)
assert counts.tolist() == [2, 1]
correct_mean = losses.sum() / counts.sum()
wrong_mean = (losses.sum(dim=1) / counts).mean()
print(f"uneven batch targets={counts.tolist()}")
print(f"token-weighted NLL={correct_mean.item():.3f}; row-averaged NLL={wrong_mean.item():.3f}")

empty_labels = torch.full((2,), -100)
empty_loss = F.cross_entropy(torch.zeros(2, 10), empty_labels, reduction="mean")
assert torch.isnan(empty_loss)
print("all-ignored mean loss is NaN:", bool(torch.isnan(empty_loss)))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
window 0:5: correct=4, wrong=3
window 3:8: correct=3, wrong=2
window 5:10: correct=2, wrong=1
correct targets=9; wrong targets=6
shifted PPL=1.448
uneven batch targets=[2, 1]
token-weighted NLL=1.014; row-averaged NLL=1.336
all-ignored mean loss is NaN: True
```
<!-- leetllm: output:end -->

Counting after the shift works whether position 0 was masked or not. Subtracting the batch size from the number of valid *unshifted* labels doesn't: it removes a valid target even when the shifted-away label was already ignored. PyTorch's `ignore_index` removes ignored labels from both the loss and the mean denominator.[^pytorchCrossEntropy2026]

The padded batch contributes two easier targets from its first row and one harder target from its second. Averaging the two row means gives the single harder target half the weight, instead of one third. Accumulate the summed losses and valid-target counts across batches, or across workers in a distributed evaluation, before dividing. An all-ignored batch has no defined mean loss; skip its contribution after checking its target count. If the entire evaluation has no targets, reject the run.

With a real model, call `model.eval()` and use `torch.inference_mode()` around the forward pass, then use its logits here. Don't shift twice if you use a model wrapper's already-shifted loss. Padding needs both an attention mask for the model and ignored target labels for the loss. Reject an evaluation with zero valid targets rather than dividing by zero.

Try removing the masking line. The three windows will then score 4 + 4 + 4 targets, repeating E, G, and H. The assertion should fail. Restore masking, then change the preferred logit from 3 to 0: all ten vocabulary items become equally likely, so PPL should become 10 (update the analytic check too).

A carefully measured PPL still answers only one question: how surprised was the model by held-out tokens?

## Connect text fit to downstream task accuracy

A carefully measured PPL still answers only one question: how surprised was the model by held-out tokens? Post-training stages such as supervised fine-tuning (SFT) and preference alignment sharpen output probability mass onto helpful answer trajectories, which frequently raises raw perplexity slightly on broad pretraining prose (the classic alignment tax) while pushing downstream reasoning and instruction accuracy much higher. Meanwhile, a model that memorized boilerplate corpus distributions can report artificially low held-out perplexity while failing exact task verification. Notice that divergence in real numbers:[^holtzman2020]

| Decision | Useful measurement |
|---|---|
| Did a base checkpoint improve at held-out next-token prediction? | PPL under a fixed protocol, or BPB across tokenizers |
| Did post-training improve instruction following or factual QA? | Verifiable exact-match, unit-test, or task-specific benchmarks |
| Did an open-ended reply satisfy clarity and grounding rubrics? | <span data-glossary="calibration">Calibrated</span> judge or human review |
| Is a checkpoint safe to deploy for critical workflows? | Task regressions plus adversarial and domain evaluations |

<!-- leetllm: test, deps=numpy, output=show -->

```python title="separate-language-fit-from-task-accuracy.py"
import numpy as np

# Per-token target NLL mean on held-out prose vs verifiable task pass rate (%)
checkpoints = [
    {"name": "overfit-mem", "mean_nll": float(np.log(6.4)), "task_acc": 0.38},
    {"name": "base-ckpt", "mean_nll": float(np.log(8.9)), "task_acc": 0.52},
    {"name": "sft-aligned", "mean_nll": float(np.log(9.8)), "task_acc": 0.84},
]

for row in checkpoints:
    row["ppl"] = float(np.exp(row["mean_nll"]))
    print(f"{row['name']:12s} ppl={row['ppl']:.2f} task_acc={row['task_acc']:.0%}")

best_language_fit = min(checkpoints, key=lambda r: r["ppl"])
best_task_model = max(checkpoints, key=lambda r: r["task_acc"])
print("lowest perplexity:", best_language_fit["name"])
print("highest downstream accuracy:", best_task_model["name"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
overfit-mem  ppl=6.40 task_acc=38%
base-ckpt    ppl=8.90 task_acc=52%
sft-aligned  ppl=9.80 task_acc=84%
lowest perplexity: overfit-mem
highest downstream accuracy: sft-aligned
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/evaluation_stack_dark.png" alt="Scatter comparison of held-out validation perplexity against downstream task accuracy across three checkpoints: a memorized checkpoint scores low perplexity 6.4 with only 38 percent task accuracy, a base pretrained checkpoint scores perplexity 8.9 with 52 percent accuracy, and a post-trained instruction-tuned checkpoint reaches 84 percent accuracy despite slightly higher perplexity 9.8." />
  <figcaption>Perplexity picks <code>overfit-mem</code> or <code>base-ckpt</code> for raw next-token fit, whereas downstream verification selects <code>sft-aligned</code> (84% accuracy) despite its slight alignment tax in validation PPL.</figcaption>
</figure>

You can observe the same phenomenon mathematically when evaluating token-level cross-entropy alongside sequence calibration on held-out factual QA prompts. Assigning high probability to common syntactic preambles ("The answer is clearly...") drops sequence perplexity cleanly while leaving the crucial factual entity token uncalibrated or wrong.

<!-- leetllm: test, deps=numpy, output=show -->

```python title="measure-preamble-ppl-vs-answer-accuracy.py"
import numpy as np

rng = np.random.default_rng(7)
n_prompts = 200
# 10 preamble tokens (easy boilerplate) + 1 critical factual answer token per sequence
preamble_probs = rng.uniform(0.75, 0.96, size=(n_prompts, 10))
answer_probs_fluent = rng.uniform(0.15, 0.45, size=(n_prompts, 1))
answer_probs_aligned = rng.uniform(0.65, 0.92, size=(n_prompts, 1))
preamble_probs_aligned = rng.uniform(0.55, 0.85, size=(n_prompts, 10))

for label, p_pre, p_ans in [
    ("boilerplate-heavy", preamble_probs, answer_probs_fluent),
    ("answer-aligned", preamble_probs_aligned, answer_probs_aligned),
]:
    seq_probs = np.concatenate([p_pre, p_ans], axis=1)
    ppl = float(np.exp(-np.log(seq_probs).mean()))
    answer_acc = float((p_ans.squeeze(1) > 0.50).mean())
    print(f"{label:18s} seq_ppl={ppl:.2f} exact_answer_acc={answer_acc:.1%}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
boilerplate-heavy  seq_ppl=1.29 exact_answer_acc=0.0%
answer-aligned     seq_ppl=1.43 exact_answer_acc=100.0%
```
<!-- leetllm: output:end -->

Open-ended tone and partial credit may need a rubric. LLM judges can scale that review, but the 2023 MT-Bench study found <span data-glossary="position-bias">position bias</span> and verbosity bias in its tested judges. It also investigated possible preference for a judge's own responses, without finding conclusive proof of that effect. Those experiments don't determine the biases of every current judge; measure the model, prompt, and rubric you actually use.[^zheng2023]

Calibrate a judge against independently reviewed examples. [LLM Benchmarks & Limitations](/learn/llm-evaluation-benchmarks-limitations) builds those controls after you have source documents you can cite. Use PPL for text fit and downstream task evaluations for reasoning and factual accuracy.

Even a clean split between PPL and downstream benchmarks fails if the evaluation records leaked into the training corpus.

## Keep evaluation data clean

PPL needs held-out text. If training data includes your evaluation records, lower loss may reflect memorization rather than generalization. Task benchmarks suffer from the same failure: if fine-tuning rows include <span data-glossary="hidden-tests">hidden test</span> passages, reported generalization metrics lose meaning.

<!-- leetllm: test, output=show -->

```python title="fail-on-evaluation-data-leakage.py"
training_doc_ids = {"doc-101", "doc-102", "doc-103"}
validation_doc_ids = {"doc-201", "doc-202", "doc-103"}

overlap = training_doc_ids & validation_doc_ids
if overlap:
    print("FAIL leaked doc ids:", sorted(overlap))
else:
    print("PASS validation set is disjoint")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FAIL leaked doc ids: ['doc-103']
```
<!-- leetllm: output:end -->

Disjoint IDs catch exact document reuse. Copied text under new IDs and near-duplicates require n-gram overlap checks and source-lineage audits too. Removing a document from today's training manifest doesn't remove it from an already trained checkpoint. Replace the contaminated evaluation material or retrain without it. Keep checkpoint-selection data separate from the final test set, since repeatedly tuning against test results also weakens generalization evidence.

For public LLM benchmarks, test content can also enter later training corpora. LiveBench reduces <span data-glossary="benchmark-contamination">contamination</span> risk with frequently updated questions from recent sources and objective ground-truth scoring. Future training corpora can still absorb those questions, so release dates and <span data-glossary="feature-leakage">leakage</span> audits remain relevant.[^white2024]

<figure>
  <img src="illustrations/_generated/contamination_pressure_dark.png" alt="Left: document d103 appears in both the training split (d101, d102, d103) and the validation split (d103, d201, d202), contaminating held-out perplexity. Right: a clean evaluation protocol keeps fixed holdout documents d201 and d202 disjoint across runs while rotating fresh challenge subsets d301, d302, and d303." />
  <figcaption>Shared document <code>d103</code> reproduces the code failure. Removing a training-manifest row leaves the already-trained checkpoint unchanged, so teams keep stable holdout splits for regression tracking alongside rotating fresh challenge sets.</figcaption>
</figure>

## Build an evaluation report

Record the protocol, the scored-target count, and the leakage check together so any reader can inspect both the score and its sample size. The report checker below validates numerical sanity, matching window parameters, and leakage counts automatically before storing a benchmark summary.

<!-- leetllm: test, output=show -->

```python title="emit-a-release-evaluation-report.py"
from dataclasses import dataclass
import math


@dataclass(frozen=True)
class EvalReport:
    checkpoint: str
    perplexity: float
    dataset: str
    tokenizer: str
    text_policy: str
    context_tokens: int
    stride_tokens: int
    objective: str
    special_token_policy: str
    first_token_policy: str
    masking_policy: str
    document_policy: str
    scored_span: str
    scored_tokens: int
    leaked_docs: int
    task_checks_passed: int
    task_checks_required: int


def validate_eval_report(report: EvalReport) -> str:
    if not math.isfinite(report.perplexity) or report.perplexity < 1.0:
        return "REJECT: invalid perplexity"
    if report.scored_tokens <= 0:
        return "REJECT: no scored targets"
    if not 0 < report.stride_tokens <= report.context_tokens:
        return "REJECT: invalid sliding-window stride"
    if not 0 <= report.task_checks_passed <= report.task_checks_required:
        return "REJECT: invalid task-check counts"
    if report.leaked_docs > 0:
        return "REJECT: contaminated evaluation split"
    if report.task_checks_required <= 0 or report.task_checks_passed < report.task_checks_required:
        return "REJECT: task regression"
    return "PASS: valid evaluation report"


report = EvalReport(
    checkpoint="lm-ckpt-0800",
    perplexity=9.81,
    dataset="wikitext-eval-v3",
    tokenizer="bpe-v7",
    text_policy="raw-text-no-external-normalization",
    context_tokens=2048,
    stride_tokens=512,
    objective="causal-next-token",
    special_token_policy="skip-padding",
    first_token_policy="skip-unconditioned-first-token",
    masking_policy="score-each-target-once",
    document_policy="reset-context-per-document",
    scored_span="all-text-targets",
    scored_tokens=12000,
    leaked_docs=0,
    task_checks_passed=3,
    task_checks_required=3,
)

print(f"{report.checkpoint}: PPL={report.perplexity} @ {report.context_tokens}/{report.stride_tokens}")
print(
    "protocol:",
    report.objective,
    report.special_token_policy,
    report.first_token_policy,
    report.masking_policy,
)
print(validate_eval_report(report))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
lm-ckpt-0800: PPL=9.81 @ 2048/512
protocol: causal-next-token skip-padding skip-unconditioned-first-token score-each-target-once
PASS: valid evaluation report
```
<!-- leetllm: output:end -->

Note that numerical sanity checks treat infinite or `NaN` perplexity separately when logging intermediate diagnostics, refusing to rank broken runs while keeping finite loss summaries when `exp(mean_nll)` overflows IEEE 754 floats. Keep total NLL, per-document losses, domain breakdowns, and task benchmark scores alongside any headline perplexity figure, and compute uncertainty intervals by resampling independent documents rather than assuming adjacent tokens are independent.

## Perplexity rules worth keeping

- Perplexity is $\exp(\text{average NLL})$: an interpretable view of held-out next-token surprise.
- Raw PPL comparison requires the same dataset, tokenizer, objective, context, stride, and masking policy. One domain still doesn't stand in for another.
- Bits per byte puts models with different tokenizers onto one raw-text denominator. A shared vocabulary is even better when you can hold it fixed.
- Long-document evaluation must score new target tokens once while reusing context and aggregating loss before exponentiating.
- Low PPL never guarantees factual, useful, or safe outputs; downstream task benchmarks and calibrated review answer those questions.
- Data leakage invalidates evaluation claims across both perplexity and downstream benchmarks.

<!-- leetllm: mastery:start -->

## Mastery check

### Key concepts

- Held-out next-token likelihood
- Cross-entropy to perplexity
- Stable log-probability scoring
- Evaluation protocol rules
- Bits-per-byte normalization
- Strided <span data-glossary="context-window">context windows</span>
- Domain-specific held-out fit
- Intrinsic versus downstream task quality
- Leakage-resistant evaluation sets

### Evaluation rubric

- Foundational: Computes token surprise, average NLL, and PPL from observed probabilities.
- Intermediate: Explains effective choice count without treating it as a vocabulary-size claim.
- Intermediate: Rejects invalid raw PPL comparisons by checking protocol fields.
- Intermediate: Refuses to treat one domain's PPL as a score for every other domain.
- Advanced: Uses BPB when tokenizers differ and aggregates strided loss correctly.
- Advanced: Designs a report that separates language-fit metrics from downstream task and leakage gates.

### Follow-up questions

```checkpoint
Why can't two models be compared by raw PPL when their tokenizers differ?
---
PPL averages surprise per token, and each tokenizer defines different prediction events and token counts. Use a shared denominator such as raw UTF-8 bytes for a fairer comparison, and still report tokenizers because BPB doesn't remove every segmentation effect.
```

```checkpoint
Why does decreasing stride often lower PPL for the same fixed-context model?
---
A smaller stride reuses more left context for newly scored tokens. Predictions become better conditioned, so the protocol usually produces lower loss even though the model weights didn't change.
```

```checkpoint
A base model has lower held-out perplexity (8.9) than a post-trained instruction checkpoint (9.8), yet scores 30 percentage points lower on verifiable QA accuracy. Which checkpoint should deploy for QA?
---
Deploy the post-trained checkpoint for QA. Perplexity measures unconditional text fit rather than instruction adherence or factual verification; post-training often trades a small alignment tax in raw prose PPL for large downstream task gains.
```

### Common pitfalls

#### Comparing scores without a protocol

- Symptom: A team declares victory from PPL 10 versus PPL 12 but can't name the tokenizer, data split, or stride.

- Cause: The score was treated as a universal model rating instead of a metric with units and conditioning rules.

- Fix: Store the full evaluation protocol with every result and compare raw PPL only when settings match.

#### Averaging window perplexities

- Symptom: Long-document PPL changes when window boundaries move, even though scored token losses are unchanged.

- Cause: Per-window perplexities were averaged directly.

- Fix: Sum token NLL across all windows, divide by scored-token count once, then exponentiate.

#### Selecting chat behavior using language fit alone

- Symptom: A fluent checkpoint hallucinates or ignores instructions because it had the lowest pretraining PPL.

- Cause: Intrinsic next-token evaluation was confused with downstream task correctness.

- Fix: Pair base perplexity with verifiable downstream evaluations and calibrated review.

#### Treating one domain as the whole story

- Symptom: News-domain PPL improved, so the team skips measuring scientific or code holdouts.

- Cause: A single held-out mix was treated as a universal language-fit score.

- Fix: Keep the protocol fixed, then measure each domain you care about. Paloma exists because those gaps can be large.

#### Testing on leaked records

- Symptom: Evaluation looks unusually strong, then degrades sharply on genuinely fresh held-out passages.

- Cause: Training or fine-tuning corpora overlap with evaluation sets.

- Fix: Enforce disjoint document identifiers, run n-gram decontamination, and rotate fresh held-out sets.

<!-- leetllm: mastery:end -->

Conditioning and numerical reporting practice.

```checkpoint
A fixed checkpoint assigns a target probability 0.70 with an earlier antecedent in context and 0.35 after a context cutoff excludes it. What happens to that target loss, and what changed?

- It increases by ln(2); conditioning changed.
- It decreases by ln(2); conditioning changed.
- It increases by ln(2); weights changed.
- It decreases by ln(2); weights changed.
---
It increases by ln(2); conditioning changed.

The loss difference is −ln(0.35) + ln(0.70) = ln(2). The weights were fixed; the changed context explains this particular conditional prediction. It does not prove that additional context improves every target.
```

```checkpoint
One run has finite mean NLL 1000 nats, whose final exponential overflows. Another produces NaN during scoring. Which handling preserves the evidence?

- Retain the first finite NLL; reject the broken NaN run.
- Clip the first NLL to a finite PPL; reject the broken NaN run.
- Retain the first finite NLL; report NaN as a zero-probability target.
- Clip the first NLL to a finite PPL; report NaN as a zero-probability target.
---
Retain the first finite NLL; reject the broken NaN run.

Finite loss remains interpretable when exp overflows and should not be clipped into a favorable score. NaN signals a broken computation; an actual zero-probability target instead has infinite NLL with a defined mathematical meaning.
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
    "question": "Each run lists its checkpoint, held-out corpus, text policy, tokenizer, context length and stride (both in tokens). Oak recorded `v1, H, raw, K, 1200, 300`. Elm recorded `v2, H, raw, K, 1200, 150`. Ash recorded `v2, H, raw, K, 1200, 300`. All other scoring settings match. Which comparison isolates the effect of the checkpoint on perplexity?",
    "options": [
      "Oak with Elm",
      "Oak with Ash",
      "Elm with Ash",
      "Average Elm and Ash, then compare with Oak"
    ],
    "answer": "Oak with Ash",
    "explanation": "Oak and Ash use different checkpoints under the same scoring settings. Oak and Elm also differ in stride, which changes the window overlap and can change the history available to a target. Elm and Ash compare two strides at checkpoint v2. Averaging Elm and Ash mixes both strides on the v2 side, while Oak uses a stride of 300 throughout."
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
    "explanation": "Each logit predicts the next label, so skip the first label in each row. The first row contributes 3, 4 and 5. The second contributes 1 and 2, for five targets in total. Counting before the shift gives six because it includes 7. Subtracting two from six gives four, even though the first row already starts with an ignored label. Counting all eight positions after the shift includes three ignored labels."
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
    "explanation": "An independent source holdout replaces the contaminated evaluation material. Deleting or renaming a record leaves trained weights and copied content unchanged; changing units does not remove exposure. Retraining without exposure is another valid approach, but it changes the checkpoint."
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
    "explanation": "The masked score uses right context as well as left context. It is a separately labeled pseudo-perplexity, so its raw value cannot isolate a causal checkpoint improvement. Numerical ordering alone cannot repair the changed objective."
  }
]
```

> **Next:** Continue to [File Ingestion for AI](/learn/file-ingestion-pdfs-html-ocr-markdown). Score held-out next-token fit, and refuse a contaminated evaluation set. PDFs, HTML, scans, and Markdown still have to become clean, deduplicated text records, because any perplexity run or downstream benchmark is only as trustworthy as the corpus that fed it.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

A teammate posts in the channel: the new checkpoint has perplexity 1.90, the old one had 8.17. That looks like a fourfold improvement, and someone is already asking about the rollout. Then you learn that the new checkpoint uses a character tokenizer and the old one uses subwords. By the end of this chapter, you will see that on the same text, the model with the "better" score was actually more surprised. Nothing was miscalculated. The two numbers just weren't measuring the same thing.

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
| Document policy | Resetting context differs from joining documents |
| Special-token and first-token policy | They change which predictions count |
| Target mask | It sets both the numerator and the denominator |

Also record the checkpoint revision, and score raw model output: evaluation mode, dropout off, no sampling, and unmodified logits. Temperature or top-k changes the distribution you are scoring, so the settings from the decoding chapter have no place here.

Here is what a valid comparison looks like, and what a tempting invalid one looks like:

<figure>
  <img src="illustrations/_generated/ppl_scores_dark.png" alt="Perplexity comparison across context lengths on wikitext-eval-v3 using tokenizer bpe-v7 and stride 512. At 2048 tokens of context, checkpoint 0400 scores PPL 3.18 and checkpoint 0800 scores PPL 2.31, cleanly isolating weight changes. A shorter 512-token context run sits on a different curve and cannot be compared directly." />
  <figcaption>Going from 3.18 to 2.31 at matched 2048-token context isolates the weights, since nothing else changed. Dropping to 512 context tokens shifts the conditioning curve itself, so that score answers a different question.</figcaption>
</figure>

Even a perfectly controlled comparison speaks only for its corpus. Paloma was built because one held-out distribution can hide large gaps elsewhere: a model that looks healthy on one source can look much worse on another under the same protocol.[^almazrouei2024] So report important domains separately. A biomedical score is not a Python code score, and a large easy slice can dominate an average while another domain regresses.

Two more objective traps come up in practice. Chat models raise the question of which text you are scoring: a full transcript with system and user turns, or only the assistant's spans given that context. Those answer different questions, so use the [template from the last chapter](/learn/instruction-tuning-chat-templates) to define the exact stream, then report the spans. And masked models such as BERT predict masked positions using text on both sides. A pseudo-perplexity from masking each position separately is a useful number with its own label, and you shouldn't rank it against a causal model's score.[^salazar2020MaskedScoring]

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

Three different strings collapse into one, and the model never has to tell them apart. Dividing by the six original bytes gives a flattering 0.289, even though the scored text has lost which `A` and which spacing occurred. So decide whether your benchmark is on normalized text or raw text, use the same target and denominator for both runs, and audit what each tokenizer preserves. Also report how much text fits in each model's context limit, because 1,024 tokens can cover very different amounts of history under different tokenizers.

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

Two checks are worth automating. Refuse to compare two reports when any of those conditions differ, because that catches the opening scenario before anyone gets excited. And reject reports with zero targets or a `NaN` score, because a pipeline that fails quietly can otherwise publish a number that looks fine. A self-reported "no leaked records" is only as good as the audit behind it, so link the report to that audit and to the corpus revision.

## What perplexity will not tell you

Now the most important limit. Suppose you compare three checkpoints scored with the same tokenizer on the same held-out corpus: an overfit/memorized model (`PPL 6.4`), a base pretrained model (`PPL 8.9`), and a post-trained instruction-tuned model (`PPL 9.8`). Pretraining perplexity measures how well the weights predict general prose, not whether the checkpoint follows instructions or stays grounded on unseen reasoning tasks.

<figure>
  <img src="illustrations/_generated/evaluation_stack_dark.png" alt="Scatter comparison of held-out validation perplexity against downstream task accuracy across three checkpoints: a memorized checkpoint scores low perplexity 6.4 with only 38 percent task accuracy, a base pretrained checkpoint scores perplexity 8.9 with 52 percent accuracy, and a post-trained instruction-tuned checkpoint reaches 84 percent accuracy despite slightly higher perplexity 9.8." />
  <figcaption>Perplexity selects the memorized or base model for raw prose fit, whereas downstream benchmarks pick the instruction-tuned checkpoint (84% accuracy) despite its slight alignment tax in validation perplexity.</figcaption>
</figure>

Use perplexity for the question it answers. Did this checkpoint get better at predicting held-out text? That is a useful thing to know, especially during pretraining, and you can measure it without building a task suite, provided you can read the model's per-token probabilities. Did the post-trained model follow instructions accurately, ground claims in source documents, and abstain when evidence is missing? That requires dedicated downstream benchmarks.

That proviso about probabilities decides who can use this metric. You can read them on weights you run. Many hosted models don't return them: when we checked in November 2026, OpenAI's guide said to remove `top_logprobs` whenever reasoning is on, and Anthropic's Messages reference listed no token probabilities at all.[^openai2026LatestModel][^anthropic2026MessagesReference] Even where an API offers them, OpenAI's reference describes them as probabilities of the output tokens, the ones the model chose to write, and perplexity needs them for every token of your test text.[^openai2026ChatReference] So treat perplexity as a tool for models whose logits you can read. To compare two hosted models, you will need the task checks in the next chapter.

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
