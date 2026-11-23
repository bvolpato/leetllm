---
{
  "id": "tokenization-bpe-wordpiece-sentencepiece",
  "title": "BPE, WordPiece, and SentencePiece",
  "slug": "tokenization-bpe-wordpiece-sentencepiece",
  "category": "NLP Fundamentals",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/tokenization_pipeline_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Hugging Face",
    "Anthropic",
    "Mistral AI"
  ],
  "shortDescription": "See why a word like unexpectedly should split into reusable pieces, and why a new tokenizer can still point an old checkpoint at the wrong vector.",
  "keyConceptsTested": [
    "subword tokenization and checkpoint vocabulary compatibility",
    "granularity trade-offs between characters, subwords, and words",
    "quadratic attention complexity versus sequence length",
    "BPE frequency pair counting and deterministic merge replay",
    "byte-level BPE, UTF-8 byte fallbacks, and regex pre-tokenization",
    "WordPiece likelihood intuition, association-score proxy, and greedy inference",
    "SentencePiece normalization, raw streams, and detokenization coverage",
    "Unigram LM loss-minimizing pruning, Viterbi decoding, and subword regularization",
    "vocabulary memory budgets versus sequence compression tradeoffs",
    "multilingual fertility tax and token inflation",
    "numeric pre-tokenization policies and arithmetic alignment",
    "code indentation handling and camelCase identifier fragmentation",
    "glitch tokens and under-trained vocabulary entries",
    "Unicode normalization policies (NFC versus NFKC)"
  ],
  "section": "Core LLM Foundations",
  "order": 2
}
---

<!-- leetllm: edition:reference:start -->

Before a language model can process the sentence `rain falls softly`, a tokenizer slices that text into discrete pieces and assigns each piece an integer ID. An ID is a model-local vocabulary index: it selects a row of a learned embedding table $W_E \in \mathbb{R}^{V \times d}$. It isn't a physical memory address or a meaning shared by all models.

Suppose ID `5` represented ` falls` during training, but a replacement tokenizer assigns it to ` soft`. The replacement now selects the vector learned for the wrong piece. Other changes may affect only certain strings, or preserve every encoding; a different file doesn't automatically scramble every ID. The compatibility requirement is that text segmentation, ID meanings, special tokens, and decoding agree with the checkpoint.

Three algorithms do that segmentation: Byte-Pair Encoding (BPE), WordPiece, and Unigram. SentencePiece is a toolkit that implements both BPE and Unigram, along with normalization and decoding. These miniature examples use small model-local IDs rather than a production model's vocabulary. The first choice is coarser than any merge table. Should the model see whole words, characters, or pieces of words?

<figure>
  <img src="illustrations/_generated/tokenization_pipeline_dark.png" alt="Four token pieces rain, ·falls, ·soft, and ly receive model-local row IDs 2, 5, 1, and 6. Each integer selects that row from an eight-row, three-column embedding table, gathering a 4 by 3 input tensor in token order." />
  <figcaption>Four subword pieces select four rows from an eight-row embedding table. Integer IDs act as model-local row indices, and the gathered vectors keep the original token order.</figcaption>
</figure>

## The granularity trade-off: characters, subwords, and words

Whole words, raw characters, and subword pieces do not fail in the same way. You could feed raw characters, whole words, or subword chunks. Each choice changes sequence length, vocabulary requirements, and coverage.

### Why not whole words? The OOV trade-off

At first glance, splitting text on spaces into whole words (`rain`, `falls`, `softly`) feels intuitive. Natural language, however, has an open, constantly expanding vocabulary:

1. **Out-of-Vocabulary (OOV) failures:** Any rare word, technical jargon, typo, new compound word, or code identifier (like `tokenCount` or `deserialize_payload`) that didn't appear in a fixed word dictionary can't be represented directly. Without a fallback, the tokenizer replaces it with an unknown token (`<UNK>`) and loses that word's identity.
2. **Vocabulary memory:** A broad word vocabulary can grow to millions of entries. For a vocabulary of $V = 1{,}000{,}000$, hidden dimension $d = 4096$, input embeddings $W_E \in \mathbb{R}^{V \times d}$, and an untied output matrix $W_{\text{head}} \in \mathbb{R}^{V \times d}$ in 16-bit precision, the two tables would consume:

$$
\text{Memory}_{\text{vocab}} = 2 \times 1,000,000 \times 4096 \times 2\text{ bytes} \approx 16.38\text{ GB}
$$

That is over 16 GB of weight memory before loading a transformer layer, a substantial fixed cost even though the practical limit depends on the hardware and deployment.

### Why not raw bytes or characters? The quadratic attention cost

Going to the opposite extreme can solve the OOV problem. A byte-level tokenizer needs only 256 base byte values to represent any UTF-8 string, while a character-level tokenizer needs a defined character inventory or fallback. Either approach keeps the base vocabulary small.

The catch is sequence length ($L$). Dense self-attention over a full sequence, as in training or prompt prefill, has a quadratic sequence-length term:

$$
\text{Attention Compute} = O(L^2 \cdot d)
$$

With a key-value (KV) cache, attending from one newly generated position to $L$ cached positions instead takes $O(L \cdot d)$ attention work. KV storage grows linearly with cached length, with constants set by the number and size of KV heads and the layer count. In the running example below, character tokenization produces 17 positions while subword segmentation produces 4. Their dense attention score matrices contain $17^2 = 289$ and $4^2 = 16$ cells per head. This 18.1-fold ratio isn't an end-to-end speedup; causal masking and implementations that avoid materializing the full matrix also affect actual work and memory.

### The subword balance

Subword tokenization usually provides a practical balance:
- High-frequency strings such as `rain` and `falls` can remain single, compact tokens.
- Rare, technical, or inflected words can decompose into reusable fragments (`soft` + `ly`).
- Vocabulary size stays fixed after training. At fixed hidden size, vocabulary-weight memory grows linearly with $V$.

<figure>
  <img src="illustrations/_generated/token_granularity_tradeoff_dark.png" alt="Granularity comparison on rain falls softly shows 17 character positions (289 dense attention cells), 4 subword pieces (16 cells), and 3 whole words (9 cells, risking [UNK] on unseen words), alongside common-scale bars comparing quadratic cell counts." />
  <figcaption>The same 17-character sentence uses 4 subword pieces or 3 words. Its dense attention grids contain 289, 16, or 9 cells per head. Coverage still depends on the base alphabet and fallback policy.</figcaption>
</figure>

Measure this sequence-length trade-off on the same sentence:

```text title="sentence.txt"
rain falls softly
```

<!-- leetllm: test, deps=numpy, output=show -->
```python title="01-count-token-units.py"
import numpy as np

message = "rain falls softly"

characters = list(message)
words = message.split()
subwords = ["rain", " falls", " soft", "ly"]

lengths = np.array([len(characters), len(subwords), len(words)], dtype=np.int64)
cells_per_head = lengths ** 2

print("characters:", int(lengths[0]))
print("words:", int(lengths[2]))
print("candidate subwords:", int(lengths[1]), [piece.replace(" ", "·") for piece in subwords])
print("dense N^2 cells (char, subword, word):", cells_per_head.tolist())
assert "".join(subwords) == message
assert cells_per_head.tolist() == [289, 16, 9]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
characters: 17
words: 3
candidate subwords: 4 ['rain', '·falls', '·soft', 'ly']
dense N^2 cells (char, subword, word): [289, 16, 9]
```
<!-- leetllm: output:end -->

The hand-written segmentation reconstructs this sentence in four positions. A word dictionary missing `softly` would lose its identity without a fallback. Neither small example guarantees coverage on arbitrary unseen text: that requires checking the actual base alphabet and unknown-token policy.

## Byte pair encoding: bottom-up frequency merges

Philip Gage originally developed Byte Pair Encoding (BPE) in 1994 as a data compression algorithm that repeatedly replaces the most frequent adjacent pair of bytes with an unused byte symbol.[^gage1994] Sennrich, Haddow, and Birch adapted the algorithm to neural machine translation in 2016, laying the foundation for modern subword modeling.[^sennrich2016]

### How BPE training works

BPE training is a greedy, bottom-up algorithm:
1. **Initialize the alphabet:** Start with all unique base characters (or bytes) in the training corpus. Every word is represented as a sequence of individual characters.
2. **Count adjacent pairs:** Count the occurrences of all adjacent symbol pairs across the corpus, weighted by word frequencies.
3. **Merge the winner:** Find the pair with the highest frequency and merge it into a single new vocabulary token.
4. **Append to merge rules:** Record the merge rule in an ordered merge table.
5. **Iterate:** Repeat until reaching the requested vocabulary size or a stopping condition, such as no remaining eligible pairs.

<figure>
  <img src="illustrations/_generated/bpe_merge_steps_dark.png" alt="BPE trains on rain three times, rainy twice, and rail twice. Four successive stages preserve these frequencies. First-seen tie breaking merges r plus a with count seven, ra plus i with count seven, then rai plus n with count five. Weighted token positions fall from thirty to twenty-three, sixteen, and eleven; common-scale bars show that reduction." />
  <figcaption>On rain ×3, rainy ×2, and rail ×2, the first-seen winner r + a has count 7 and ties a + i. The next selected counts are 7 and 5; recounting after each merge reduces weighted token positions from 30 to 23, 16, and 11.</figcaption>
</figure>

Tracing this step by step on a small vocabulary:

| Term | Count |
|---|---:|
| `rain` | 3 |
| `rainy` | 2 |
| `rail` | 2 |

At initialization, the words are `r a i n`, `r a i n y`, and `r a i l`. Their weighted character count is $4\times3 + 5\times2 + 4\times2 = 30$.

The adjacent pairs `r + a` and `a + i` each occur seven times after weighting by word frequency. Our classroom trainer breaks ties by first-seen order, so it merges `r + a` into `ra`. A production trainer must also specify a deterministic tie policy.

Recount the current pieces. The pair `ra + i` occurs seven times, so it becomes `rai`. Recount again: `rai + n` occurs in `rain` three times and `rainy` twice, giving a count of five. That merge creates `rain`. The weighted token count falls from 30 to 23, then 16, then 11.

This three-merge classroom trainer omits end-of-word markers, special-token assignment, vocabulary export, and a general stopping condition. Sennrich's original word-based formulation includes an end-of-word symbol.[^sennrich2016]

<!-- leetllm: test, output=show -->
```python title="02-train-mini-bpe.py"
from collections import Counter

frequencies = {
    "rain": 3,
    "rainy": 2,
    "rail": 2,
}
state = {tuple(word): count for word, count in frequencies.items()}

def count_pairs(words: dict[tuple[str, ...], int]) -> Counter[tuple[str, str]]:
    pairs: Counter[tuple[str, str]] = Counter()
    for pieces, count in words.items():
        for pair in zip(pieces, pieces[1:]):
            pairs[pair] += count
    return pairs

def merge_pair(
    pieces: tuple[str, ...], pair: tuple[str, str]
) -> tuple[str, ...]:
    merged: list[str] = []
    i = 0
    while i < len(pieces):
        if i + 1 < len(pieces) and pieces[i : i + 2] == pair:
            merged.append("".join(pair))
            i += 2
        else:
            merged.append(pieces[i])
            i += 1
    return tuple(merged)

merges: list[tuple[str, str]] = []
for step in range(3):
    pair, count = count_pairs(state).most_common(1)[0]
    state = {merge_pair(pieces, pair): freq for pieces, freq in state.items()}
    merges.append(pair)
    print(step + 1, pair, "->", "".join(pair), "count", count)

print("learned merges:", merges)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1 ('r', 'a') -> ra count 7
2 ('ra', 'i') -> rai count 7
3 ('rai', 'n') -> rain count 5
learned merges: [('r', 'a'), ('ra', 'i'), ('rai', 'n')]
```
<!-- leetllm: output:end -->

### Replaying merges at inference time

Ordinary deterministic BPE encoding uses fixed learned merge ranks, without fitting new rules to each prompt. This lab replays its three rules in order; production implementations can use more efficient rank-based operations. Learning a new vocabulary piece during serving wouldn't create a trained embedding for it.

For our classroom encoder, that means applying the three saved rules in order:

<!-- leetllm: test, output=show -->
```python title="03-replay-bpe-merges.py"
def apply_rule(pieces: list[str], pair: tuple[str, str]) -> list[str]:
    result: list[str] = []
    i = 0
    while i < len(pieces):
        if i + 1 < len(pieces) and tuple(pieces[i : i + 2]) == pair:
            result.append("".join(pair))
            i += 2
        else:
            result.append(pieces[i])
            i += 1
    return result

rules = [("r", "a"), ("ra", "i"), ("rai", "n")]

def encode(term: str) -> list[str]:
    pieces = list(term)
    for rule in rules:
        pieces = apply_rule(pieces, rule)
    return pieces

for term in ["rain", "rainy", "rail", "airy"]:
    print(term, "->", encode(term))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rain -> ['rain']
rainy -> ['rain', 'y']
rail -> ['rai', 'l']
airy -> ['a', 'i', 'r', 'y']
```
<!-- leetllm: output:end -->

The fixed rules encode `rain` as one piece, `rainy` as `rain` plus `y`, and `rail` as `rai` plus `l`. The unseen word `airy` uses four characters from this corpus's base alphabet. The encoder doesn't invent a whole-word merge for it.

Token counts aren't generally additive across arbitrary text chunks: a chunk split can prevent a learned merge. For exact counts and prompt-cache comparisons, encode the actual serialized input. A streaming tokenizer needs a way to retain or revise an unfinished UTF-8 or subword span; concatenating independent chunk encodings doesn't generally reproduce whole-string encoding.

```checkpoint
Why can't an inference tokenizer count pair frequencies in the user's prompt to find better merges?
---
Ordinary BPE encoding follows its fixed learned merge ranks. Fitting rules to each prompt would break that trained input mapping and could create pieces with no trained ID or embedding. Even a different segmentation using existing pieces can change the model's input distribution.
```

### Byte-level BPE and UTF-8 fallbacks

Character BPE with a corpus-derived alphabet can encounter unseen characters. Without an additional fallback, an obscure glyph, emoji, or script may map to `<UNK>`.

GPT-2 uses **byte-level BPE**, whose base alphabet covers all 256 byte values.[^radford2019] Each Unicode scalar value encodes as one to four UTF-8 bytes, so valid Unicode text is representable without an unknown-character token. An API can still reject reserved special-token text or invalid inputs according to its policy.

Llama 2 uses SentencePiece BPE and decomposes unknown UTF-8 characters into bytes.[^touvron2023a] Llama 3 instead uses a tiktoken-based tokenizer, so the two generations don't share the same tokenizer implementation or pre-tokenization rules.[^dubey2024][^metaLlama3Tokenizer2024]

Testing this byte round-trip property on a Japanese string with an emoji:

<!-- leetllm: test, output=show -->
```python title="04-utf8-byte-round-trip.py"
message = "関数✨"
byte_ids = list(message.encode("utf-8"))
reconstructed = bytes(byte_ids).decode("utf-8")

print("byte count:", len(byte_ids))
print("first byte ids:", byte_ids[:8])
print("round trip:", reconstructed)
assert reconstructed == message
assert all(0 <= value <= 255 for value in byte_ids)

# A byte token can contain only part of a Unicode character.
decoded_separately = "".join(
    bytes([value]).decode("utf-8", errors="replace") for value in byte_ids
)
print("per-byte decode exact:", decoded_separately == message)
assert decoded_separately != message
```

<!-- leetllm: output:start -->
```text title="Output" output compact
byte count: 9
first byte ids: [233, 150, 162, 230, 149, 176, 226, 156]
round trip: 関数✨
per-byte decode exact: False
```
<!-- leetllm: output:end -->

Joining the bytes before UTF-8 decoding preserves this string. Decoding each byte separately with replacement errors loses it: token cuts do not always align with Unicode character divisions.[^bartolo2024undertrainedtokens] Byte fallback guarantees representation rather than compression. A rarely learned script can use several byte tokens per character, increasing sequence length.

### Why regex pre-tokenization is critical

Without pre-tokenization rules, BPE can learn pieces spanning letters, punctuation, or newlines when the training counts favor them. It doesn't necessarily merge every `failed.`, `failed!`, or `failed\n` string. GPT-2's authors report vocabulary waste from such variants and constrain merges by character categories, with an exception for spaces.[^radford2019]

To control which text spans can participate in merges, many production BPE tokenizers apply a **regular expression pre-tokenizer** first. GPT-2 and tiktoken-style encodings use patterns that separate categories such as:
- Contractions (`'s`, `'t`, `'re`, `'ve`, `'m`, `'ll`, `'d`)
- Letter sequences
- Numeric digits
- Punctuation marks
- Whitespace runs

Merges stay within the spans produced by that encoding's regex. Don't generalize the listed categories into a universal punctuation rule: Llama 3's letter branch, for example, allows a preceding character outside its letter/number/newline categories. The exact pattern determines which splits occur.[^metaLlama3Tokenizer2024] Inside a span, frequency still picks the winner. Must that winner be a likely unit, or can two frequent pieces win only because each one is common?

## WordPiece: likelihood-driven subword selection

BPE's winner inside those spans is still the most frequent eligible pair. A pair of common pieces can win that count without being a likely unit. WordPiece's published motivation asks about language-model likelihood instead.[^kudo2018a]

Schuster and Nakajima developed WordPiece in 2012 for Japanese and Korean speech recognition, and it later became the tokenizer behind BERT.[^schuster2012][^devlin2019]

### Likelihood intuition and a teaching proxy

That likelihood target scores statistical prediction; linguistic analysis determines whether two fragments form a meaningful morpheme.

Be careful about implementation claims: Google didn't publish BERT's WordPiece trainer. Hugging Face labels its detailed training reconstruction a best guess from the literature. Its classroom reconstruction ranks eligible pairs using this association-score proxy:[^hfWordPieceCourse2026]

For piece-frequency counts and adjacent-pair counts in the current segmentation:

$$
\operatorname{score}(a, b) = \frac{\operatorname{count}(ab)}{\operatorname{count}(a)\operatorname{count}(b)}
$$

This ratio favors pairs whose components occur together relative to their individual frequencies. It isn't literally pointwise mutual information, which is a logarithm of normalized joint and marginal probabilities. Nor is it a documented exact likelihood-gain formula for every WordPiece trainer. Compare two **within-word** merge candidates:

| Candidate pair | Pair count | Individual counts | Proxy score | Interpretation |
|---|---:|---:|---:|---|
| `rain` + `##bow` | 42 | 50 and 44 | `0.0191` | Higher association score |
| `t` + `##h` | 90 | 900 and 300 | `0.0003` | Higher count, lower association score |

The proxy selects `rain` + `##bow` despite its lower pair count. A phrase such as `the model` isn't an eligible within-word merge in BERT's pipeline, so comparing those two whole words would cross whitespace instead of staying inside a word.

### Greedy longest-match inference and `##` continuations

BERT's full tokenizer cleans text, separates Chinese characters, splits punctuation and whitespace, and optionally lowercases and strips accents before WordPiece. WordPiece then segments each resulting unit, using `##` to mark continuations in BERT's vocabulary.[^bertTokenizerSource2026] This prefix is a vocabulary convention; it isn't part of the original word.

At inference time, WordPiece matches greedily from left to right using **longest-match-first**:

The next two functions isolate that search. They don't implement BERT's basic tokenizer or its maximum-word-length limit.

<!-- leetllm: test, output=show -->
```python title="05-wordpiece-longest-match.py"
def wordpiece_tokenize(word: str, vocabulary: set[str]) -> list[str]:
    result: list[str] = []
    start = 0
    while start < len(word):
        chosen = None
        for end in range(len(word), start, -1):
            candidate = word[start:end]
            if start > 0:
                candidate = "##" + candidate
            if candidate in vocabulary:
                chosen = candidate
                start = end
                break
        if chosen is None:
            return ["[UNK]"]
        result.append(chosen)
    return result

vocabulary = {"rain", "##bow", "play", "##ing"}
for term in ["rain", "rainbow", "playing"]:
    print(term, "->", wordpiece_tokenize(term, vocabulary))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rain -> ['rain']
rainbow -> ['rain', '##bow']
playing -> ['play', '##ing']
```
<!-- leetllm: output:end -->

### The greedy dead-end failure

Because BERT-style WordPiece matches greedily without backtracking, it has a notable failure mode: if the longest valid prefix leads to a dead end where no continuation token can finish the word, the tokenizer rejects the entire word and emits `[UNK]`. It won't backtrack to try a shorter initial match, even if a valid full decomposition exists.[^bertTokenizerSource2026]

<!-- leetllm: test, output=show -->
```python title="06-wordpiece-unknown-token.py"
def encode_word(word: str, vocabulary: set[str]) -> list[str]:
    pieces: list[str] = []
    cursor = 0
    while cursor < len(word):
        match = None
        for end in range(len(word), cursor, -1):
            candidate = word[cursor:end]
            if cursor:
                candidate = "##" + candidate
            if candidate in vocabulary:
                match = candidate
                cursor = end
                break
        if match is None:
            return ["[UNK]"]
        pieces.append(match)
    return pieces

vocabulary = {"rain", "##bow", "play"}
known = encode_word("rainbow", vocabulary)
missing = encode_word("raincoat", vocabulary)

print("known term:", known)
print("missing continuation:", missing)
assert known == ["rain", "##bow"]
assert missing == ["[UNK]"]

# A complete alternative path exists, but greedy matching won't find it.
greedy_trap = {"rainb", "rain", "##bow"}
print("greedy dead end:", encode_word("rainbow", greedy_trap))
assert "rain" + "bow" == "rainbow"
assert encode_word("rainbow", greedy_trap) == ["[UNK]"]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
known term: ['rain', '##bow']
missing continuation: ['[UNK]']
greedy dead end: ['[UNK]']
```
<!-- leetllm: output:end -->

In `greedy_trap`, `rain` + `##bow` could segment `rainbow` completely. But WordPiece greedily consumes `rainb`, finds no continuation for `ow`, and collapses the whole word to `[UNK]`. The trap still starts from a word that whitespace already isolated. Text without those gaps needs a different cut.

<figure>
  <img src="illustrations/_generated/code_tokenization_dark.png" alt="The fixed WordPiece vocabulary has rainb, rain, and continuation piece ##bow. Greedy search takes rainb from rainbow and fails on missing ##ow, so the whole word becomes [UNK]. A second aligned lane shows the valid rain plus ##bow segmentation, which the greedy algorithm never tries." />
  <figcaption>For this fixed vocabulary, greedy WordPiece chooses rainb and gets stuck. It returns [UNK] for the entire word, even though rain plus ##bow could spell rainbow. That shorter path is not explored.</figcaption>
</figure>

## SentencePiece and the Unigram language model

Many BPE and WordPiece pipelines apply whitespace splitting or a language-specific segmenter before learning subwords. Splitting strictly on whitespace is a poor fit for languages that don't delimit every word with spaces, such as Japanese, Chinese, and Thai. SentencePiece instead trains from raw sentences and packages normalization with the model.

Kudo and Richardson's **SentencePiece** toolkit learns from raw sentences without requiring an external word segmenter.[^kudo2018] Its default trainer still prevents pieces from crossing whitespace, script, and number categories.[^sentencepieceModelSpec2026]

### Raw stream processing and reversible whitespace detokenization

SentencePiece treats input text as a continuous raw stream of Unicode characters. It introduces two major innovations:
1. **Explicit whitespace character:** Spaces in the normalized stream become `▁` (U+2581 Lower One Eighth Block). The default dummy-prefix option also adds an initial marker, so `rain falls` becomes `▁rain▁falls` even without a raw leading space.
2. **Reversible whitespace encoding:** After normalization, spaces remain explicit in the token stream, so decoding the normalized text is straightforward:

```python title="decode-normalized-text.py"
decoded = "".join(tokens).removeprefix("▁").replace("▁", " ")
```

Explicit markers preserve spaces in the normalized stream. This string-join expression illustrates ordinary pieces with the default leading-space convention. Use the actual decoder for model-specific special tokens, byte pieces, and whitespace options. Recovery of normalized text requires that no content was collapsed into an unknown ID. A model without byte fallback can lose unseen characters, and normalization can remove distinctions before segmentation.[^sentencepieceModelSpec2026]

### The Unigram LM: top-down loss-minimizing pruning

SentencePiece can train BPE models and also implements the **Unigram Language Model** described by Kudo (2018a).[^kudo2018a]

Unlike BPE and WordPiece (which build vocabulary bottom-up by iteratively merging characters), Unigram operates **top-down**:
1. **Initialize an oversized seed vocabulary:** Start with required individual characters plus frequent substrings extracted from the corpus, producing more candidates than the target vocabulary needs.
2. **Estimate piece probabilities:** Use Expectation-Maximization (EM) to fit the candidate-token probabilities $P(x)$ toward higher corpus log-likelihood. The result depends on initialization and candidate constraints:

$$
\mathcal{L} = \sum_{s \in \text{corpus}} \log \left( \sum_{\mathbf{x} \in \mathcal{S}(s)} \prod_{x_i \in \mathbf{x}} P(x_i) \right)
$$

where $\mathcal{S}(s)$ is the set of all valid segmentations of sentence $s$.
3. **Estimate pruning loss:** Rank candidate pieces by the estimated likelihood reduction from removal. This pruning approximation avoids solving the intractable joint vocabulary/probability optimization exactly.
4. **Remove a fraction of low-loss pieces:** The paper illustrates keeping 80%. Retain required single-character pieces, which protect coverage of the selected character alphabet, not every future Unicode character.
5. **Iterate:** Recompute probabilities and repeat until reaching the target vocabulary size $V$.

### Viterbi decoding on candidate lattices

At inference time, an input string can be segmented across dozens of candidate split points. Unigram evaluates complete paths by joint probability:

$$
\arg\max_{\mathbf{x} \in \mathcal{S}(s)} \prod_{i=1}^{M} P(x_i)
= \arg\max_{\mathbf{x} \in \mathcal{S}(s)} \sum_{i=1}^{M} \log P(x_i)
$$

The Viterbi algorithm uses dynamic programming to find the optimal global segmentation without enumerating all combinatorial paths.

<figure>
  <img src="illustrations/_generated/sentencepiece_unigram_dark.png" alt="SentencePiece Unigram lattice on ▁rain scores three complete paths: [▁rain] at 0.30 (cost 1.204), [▁, rain] at 0.015 (cost 4.200), and [▁, ra, in] at 0.00009 (cost 9.316). Common-scale negative log cost bars select [▁rain]." />
  <figcaption>The three legal paths for ▁rain have probabilities 0.30, 0.015, and 0.00009. The bars show negative log costs on a 0 to 10 scale, so Viterbi selects the shortest bar and largest complete-path probability. The vocabulary assigns another 0.40 probability mass to pieces that cannot segment this input; optional training-time sampling can expose other legal paths.</figcaption>
</figure>

### Subword regularization: training with segmentation noise

Unigram also supports **subword regularization**.[^kudo2018a] During model training, instead of always taking the deterministic 1-best Viterbi path, SentencePiece can sample segmentations from the posterior distribution:

$$
q_\alpha(\mathbf{x} \mid s) \propto \prod_{i=1}^{M} P(x_i)^\alpha,
\qquad \mathbf{x} \in \mathcal{S}(s)
$$

where $\alpha$ controls the sampling distribution. A model might see `['▁rain']` in one epoch and `['▁', 'rain']` in the next. This acts as data augmentation over valid segmentations and can make training less sensitive to which valid segmentation appears.

The sampling distribution $q_\alpha$ is normalized over legal paths for this fixed input. Smaller positive $\alpha$ flattens it; larger values concentrate it toward the best path. The original paper studies neural machine translation training. Sampling is an option for model training, not something every pretrained SentencePiece-based LLM used. For reproducible serving, use the checkpoint's intended encoding mode.

Here is a miniature Viterbi decoder with piece probabilities chosen to keep the arithmetic transparent, with a leading space marker prepended to `rain`. This isolates path selection rather than modeling SentencePiece normalization or EM training. The vocabulary probabilities sum to one, including 0.40 on `sun` and `cloud`, which cannot segment this input.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="07-unigram-viterbi.py"
import numpy as np

probabilities = {
    "▁rain": 0.30,
    "▁": 0.15,
    "rain": 0.10,
    "ra": 0.02,
    "in": 0.03,
    "sun": 0.20,
    "cloud": 0.20,
}
pieces_list = list(probabilities.keys())
prob_array = np.array([probabilities[p] for p in pieces_list], dtype=np.float64)
assert np.isclose(prob_array.sum(), 1.0)
logp = dict(zip(pieces_list, np.log(prob_array).tolist()))

def viterbi_segment(text: str, scores: dict[str, float]) -> list[str]:
    n = len(text)
    if "" in scores:
        raise ValueError("empty pieces are not supported")
    if not text:
        return []
    if not scores:
        raise ValueError("no legal segmentation")
    best = [(0.0, -1, "")] + [(-np.inf, -1, "")] * n
    max_len = max(map(len, scores))
    for start in range(n):
        if best[start][0] == -np.inf:
            continue
        for end in range(start + 1, min(n, start + max_len) + 1):
            piece = text[start:end]
            if piece not in scores:
                continue
            score = best[start][0] + scores[piece]
            if score > best[end][0]:
                best[end] = (score, start, piece)
    if best[n][0] == -np.inf:
        raise ValueError("no legal segmentation")
    pieces: list[str] = []
    cursor = n
    while cursor > 0:
        _, prev, piece = best[cursor]
        pieces.append(piece)
        cursor = prev
    pieces.reverse()
    return pieces

raw_message = "rain"
marked = "▁" + raw_message
pieces = viterbi_segment(marked, logp)
decoded = "".join(pieces).removeprefix("▁").replace("▁", " ")

print("raw:", raw_message)
print("normalized marker input:", marked)
print("pieces:", pieces)
print("decoded:", decoded)
assert marked == "▁rain"
assert pieces == ["▁rain"]
assert decoded == raw_message
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw: rain
normalized marker input: ▁rain
pieces: ['▁rain']
decoded: rain
```
<!-- leetllm: output:end -->

`▁rain` stays whole because its log-probability ($-1.204$) beats `▁` plus `rain` ($-1.897 + -2.303 = -4.200$). The three-piece route `▁` + `ra` + `in` scores $0.15 \times 0.02 \times 0.03 = 0.00009$, or $-9.316$ in natural log space. This is global path scoring, not a rule that always chooses the longest piece. Each vocabulary piece also costs an embedding row, and an output row when those weights are untied.

## Vocabulary economics: parameter memory vs context efficiency

When designing a tokenizer, how big should $V$ be? Historical checkpoints illustrate different choices: GPT-2 uses 50,257 IDs; Llama 2 uses 32,000.[^radford2019][^touvron2023a] Llama 3's report describes 128K pieces, and its original implementation adds 256 reserved special-token IDs. Gemma 2's report describes 256K entries.[^dubey2024][^metaLlama3Tokenizer2024][^gemma2team2024] Inspect the actual vocabulary and weight shapes, including special IDs and padding, for an exact memory budget.

Every additional vocabulary token represents a trade-off between weight memory and sequence length.

### Calculating the parameter memory bill

For hidden dimension $d_{\text{model}}$, the input embedding table $W_E \in \mathbb{R}^{V \times d_{\text{model}}}$ stores $V \times d_{\text{model}}$ parameters. If the final output projection matrix ($W_{\text{head}}$) is untied (not sharing weights with $W_E$), it stores another $V \times d_{\text{model}}$ parameters:

$$
\text{Memory}_{\text{vocab}} = 2 \times V \times d_{\text{model}} \times \text{bytes per parameter}
$$

<figure>
  <img src="illustrations/_generated/vocab_comparison_dark.png" alt="Top: untied FP16 table memory at hidden dimension 4096 grows linearly across 8k (125 MiB), 32k (500 MiB), and 128k (2,000 MiB) vocabulary rows. Bottom: increasing English compression from 3.17 to 3.94 characters per token lowers token and KV positions to 80.5% and dense N-squared score cells to 64.7%." />
  <figcaption>Untied FP16 tables at hidden size 4,096 cost 125, 500, and 2,000 MiB across 8k, 32k, and 128k rows. Below: Llama 3 compression rates on an English sample relative to Llama 2 imply 19.5% fewer token/KV positions and 35.3% fewer dense score cells for fixed text, rather than isolating an end-to-end speedup.[^dubey2024]</figcaption>
</figure>

Computing the exact memory footprint across vocabulary sizes:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="08-vocabulary-memory-budget.py"
import numpy as np

vocab_sizes = np.array([8_000, 32_000, 128_000], dtype=np.int64)
hidden_size = 4096
bytes_per_weight = 2

input_mib = vocab_sizes * hidden_size * bytes_per_weight / (1024**2)
untied_mib = 2 * input_mib

for v, inp, total in zip(vocab_sizes, input_mib, untied_mib):
    print(f"{int(v):>6,} tokens: input={inp:>7.1f} MiB input+untied-output={total:>7.1f} MiB")

pos_ratio = 3.17 / 3.94
print(f"positions ratio: {pos_ratio:.3f}, dense N^2 ratio: {pos_ratio ** 2:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
 8,000 tokens: input=   62.5 MiB input+untied-output=  125.0 MiB
32,000 tokens: input=  250.0 MiB input+untied-output=  500.0 MiB
128,000 tokens: input= 1000.0 MiB input+untied-output= 2000.0 MiB
positions ratio: 0.805, dense N^2 ratio: 0.647
```
<!-- leetllm: output:end -->

### The sequence compression payoff

At 128,000 rows, the untied FP16 budget above is 2,000 MiB (1.953 GiB). A larger, appropriately trained vocabulary can shorten sequences; measure compressed lengths on your corpus to see whether that trade improves compression:
1. **Sequence and attention savings:** Llama 3's report measures 3.17 versus 3.94 characters per token **on a sample of English data**.[^dubey2024] Treating those reported rates as representative of fixed text gives $1 - 3.17 / 3.94 \approx 19.5\%$ fewer positions and $1 - (3.17 / 3.94)^2 \approx 35.3\%$ fewer conceptual dense attention score cells. That comparison covers two whole tokenizers, including different pre-tokenization, so it doesn't isolate the effect of adding rows. The report also says its 28K added non-English tokens had no impact on English tokenization. These ratios estimate potential reductions for similar text. Measure token counts and end-to-end speed on target requests to quantify the savings.
2. **KV cache savings:** Holding model architecture and text fixed, 19.5% fewer token positions means 19.5% fewer key and value positions stored for that request.
3. **Context capacity:** At the reported compression rates, a fixed token window holds about $3.94 / 3.17 \approx 1.243$ times as many characters from the same content distribution. Word counts vary by language and corpus, so character compression shouldn't be converted into a universal words-per-window claim.

## Modern tokenizer failure modes in production

Check the serialized token IDs before concluding what code the model saw. Fragmentation can also arise from the checkpoint's tokenizer, so inspect these four cases before attributing unexpected behavior to the weights.

### 1. Multilingual token inflation ("The fertility tax")

Fertility measures how many tokens a tokenizer requires per word or another chosen text unit. The value depends on both the tokenizer and the evaluation corpus, so comparisons should use parallel content and a consistent unit.

Tokenizers can use far more tokens for some languages than for English. Across parallel FLORES-200 translations, Petrov et al. measured a 15.05-fold token premium for Shan with the `cl100k_base` tokenizer used by ChatGPT and GPT-4 at the time.[^petrov2023] This compares translations with the same underlying content, not identical text. Shan is the widest gap the paper reports for this tokenizer; Italian needs about 1.6 times as many tokens as English.

This creates three measurable risks:
- **Token cost:** Token-metered input charges scale with token count, although the monetary ratio depends on the provider's pricing policy.
- **Context capacity:** A higher token ratio leaves proportionally less room for comparable content in a fixed token window.
- **Latency:** Longer token sequences increase prefill work, and fragmented outputs can require more autoregressive decoding steps. Petrov et al. observed up to roughly twice the processing time for some languages; measure latency on the target model and runtime.[^petrov2023]

Meta's Llama 3 combines the 100K-token tiktoken vocabulary with 28K additional tokens from selected non-English languages. The report describes improved compression and downstream performance for those languages.[^dubey2024]

### 2. Arithmetic and numeric pre-tokenization

Tokenization is one factor that can make multi-digit arithmetic harder. It determines whether digit positions are exposed consistently or hidden inside variable-length pieces, but training data, model capacity, and learned algorithms matter too.

In byte-level BPE tokenizers such as GPT-2's, numeric substrings can be merged into pieces according to learned merge ranks. Similar-looking numbers can therefore split at different positions.

Llama 2 chose a different policy and split numbers into individual digits.[^touvron2023a] Llama 3 doesn't preserve every digit separately. Its official tokenizer uses the regex span `\p{N}{1,3}`, which groups one to three numeric characters before BPE.[^metaLlama3Tokenizer2024]

Single-digit spans expose each column explicitly, while 1-to-3-digit spans limit how much numeric text enters one pre-tokenization chunk. Neither policy guarantees arithmetic correctness. Audit the exact regex and resulting token splits instead of assuming all modern tokenizers use the same rule.

### 3. Code indentation and whitespace handling

In languages such as Python, indentation changes program structure. Four levels of four-space indentation use 16 leading spaces on the deepest line. An encoding with only single-space pieces would spend 16 tokens on that run; other lines can have different indentation depths.

Code-aware tokenizers can learn pieces for multi-space runs. Representing 16 leading spaces as four 4-space pieces reduces indentation from 16 tokens to 4, a 75% reduction for that run. Actual savings depend on the tokenizer vocabulary and the code sample, and a real encoder can do better still: `cl100k_base` encodes 16 leading spaces as one token (checked November 2026).

Exact casing can change which learned pieces match. Our mini-BPE below produces these tokenizations:
- `tokenCount` $\to$ `['token', 'C', 'o', 'un', 't']` (5 tokens!)
- `encodePrompt` $\to$ `['encode', 'P', 'rompt']` (3 tokens here)

Its corpus includes some code, but the limited merge budget doesn't learn whole `Count` or `Prompt` pieces. These counts aren't predictions for Llama, GPT, or another checkpoint's tokenizer. On `cl100k_base`, for example, `tokenCount` is two tokens.

### 4. Glitch tokens and under-trained vocabulary entries

Researchers have documented **glitch tokens**, vocabulary entries such as `SolidGoldMagikarp` that can trigger anomalous model behavior.[^bartolo2024undertrainedtokens]

The conclusion the measurements support is narrower than a single causal story. Tokenizer construction and neural model training use different objectives and may use different corpora. A token can enter the vocabulary yet be nearly or entirely absent during model training, leaving it under-trained. Weight-based signatures depend on the architecture: tied and untied input and output embeddings don't receive identical updates. Corpus counts, vector norms, and prompt behavior can help identify candidates, but they don't prove that a particular token received exactly zero gradients or that attention logits saturated.[^bartolo2024undertrainedtokens]

Testing these multilingual and camelCase behaviors on a trained mini-BPE:

<!-- leetllm: test, output=show -->
```python title="09-audit-token-lengths.py"
from collections import Counter
import re

PRETOK = re.compile(r"[^\W\d_]+|\d+|\s+|[^\s]")

def utf8_pieces(text: str) -> tuple[str, ...]:
    return tuple(bytes([b]).decode("latin-1") for b in text.encode("utf-8"))

def pretok(text: str) -> list[str]:
    return PRETOK.findall(text)

def count_pairs(words: dict[tuple[str, ...], int]) -> Counter[tuple[str, str]]:
    pairs: Counter[tuple[str, str]] = Counter()
    for pieces, count in words.items():
        for pair in zip(pieces, pieces[1:]):
            pairs[pair] += count
    return pairs

def merge_pair(pieces: tuple[str, ...], pair: tuple[str, str]) -> tuple[str, ...]:
    merged: list[str] = []
    i = 0
    while i < len(pieces):
        if i + 1 < len(pieces) and pieces[i : i + 2] == pair:
            merged.append(pieces[i] + pieces[i + 1])
            i += 2
        else:
            merged.append(pieces[i])
            i += 1
    return tuple(merged)

def encode(text: str, merges: list[tuple[str, str]]) -> list[str]:
    output: list[str] = []
    for span in pretok(text):
        pieces = list(utf8_pieces(span))
        for pair in merges:
            pieces = list(merge_pair(tuple(pieces), pair))
        output.extend(pieces)
    return output

def visible(pieces: list[str]) -> list[str]:
    shown: list[str] = []
    for piece in pieces:
        raw = piece.encode("latin-1")
        try:
            shown.append(raw.decode("ascii").replace(" ", "·"))
        except UnicodeDecodeError:
            shown.append("<byte>")
    return shown

corpus = {
    "const tokenCount = encodePrompt(prompt).length;": 3,
    "How do I tokenize this prompt?": 5,
    "prompt cache failed unexpectedly": 4,
    "token budget pending": 3,
    "encode the prompt cache": 3,
    "failed unexpectedly": 2,
}
state: dict[tuple[str, ...], int] = Counter()
for text, count in corpus.items():
    for span in pretok(text):
        state[utf8_pieces(span)] += count

merges: list[tuple[str, str]] = []
for _ in range(25):
    pair, _count = count_pairs(state).most_common(1)[0]
    state = {merge_pair(pieces, pair): freq for pieces, freq in state.items()}
    merges.append(pair)

samples = {
    "english": "How do I tokenize this prompt?",
    "portuguese": "Como tokenizo este prompt?",
    "japanese": "このプロンプトをトークン化するには？",
    "typescript": "const tokenCount = encodePrompt(prompt).length;",
}

english_tokens = len(encode(samples["english"], merges))
for name, text in samples.items():
    pieces = encode(text, merges)
    print(f"{name:>10}: {len(pieces):>2} tokens {len(pieces) / english_tokens:>4.2f}x english")
    assert "".join(pieces).encode("latin-1").decode("utf-8") == text

typescript = encode(samples["typescript"], merges)
print("typescript pieces:", visible(typescript))
assert [len(encode(text, merges)) for text in samples.values()] == [20, 17, 54, 25]
assert visible(typescript) == [
    "co", "n", "s", "t", "·", "token", "C", "o", "un", "t",
    "·", "=", "·", "encode", "P", "rompt", "(", "prompt", ")",
    ".", "l", "en", "g", "th", ";",
]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
   english: 20 tokens 1.00x english
portuguese: 17 tokens 0.85x english
  japanese: 54 tokens 2.70x english
typescript: 25 tokens 1.25x english
typescript pieces: ['co', 'n', 's', 't', '·', 'token', 'C', 'o', 'un', 't', '·', '=', '·', 'encode', 'P', 'rompt', '(', 'prompt', ')', '.', 'l', 'en', 'g', 'th', ';']
```
<!-- leetllm: output:end -->

The regex is a classroom approximation using Unicode word characters, decimal digits, whitespace, and remaining characters. Unlike an ASCII-only letter branch, it keeps this Japanese sentence's letter sequences together. It isn't GPT-2's or Llama 3's exact pattern. Comparing token counts across these four prompts shows:
- Portuguese reuses `token` in `tokenizo`, keeping token count low (0.85x).
- Japanese has no learned merges in this ASCII-centric corpus and uses 54 raw byte tokens (2.70x the English prompt).
- `tokenCount` uses `['token', 'C', 'o', 'un', 't']`; this limited vocabulary has no piece spanning the uppercase suffix.

These ratios cover token counts for four test strings. They give no multilingual or per-word fertility estimate. The English string is also in the tokenizer's training corpus. Evaluate the real checkpoint on separate, representative parallel content before making deployment or cost claims; message formatting and special-token overhead can add tokens beyond raw text.

## Unicode normalization policies: NFC vs NFKC

Two text strings can look identical on screen while holding completely different Unicode code points.

For example, `café` can be written as:
- **Composed form:** `c` + `a` + `f` + `é` (`\u00E9`, single code point).
- **Decomposed form:** `c` + `a` + `f` + `e` + `◌́` (`\u0065\u0301`, letter `e` plus combining acute accent).

If the configured tokenizer doesn't unify those forms, visually similar requests can produce different IDs and miss an exact-prefix cache match. If its normalizer already unifies them, they can encode identically. Cache results also depend on the full request prefix and the serving system's policy.

<figure>
  <img src="illustrations/_generated/normalization_pipeline_dark.png" alt="Composed café has four code points and five UTF-8 bytes. Decomposed cafe plus combining U+0301 has five points and six bytes. NFC and NFKC map both to the same four code points. The ﬁle ligature input has three code points and five bytes, remains unchanged under NFC, and becomes four letters under NFKC. Each cell is one code point." />
  <figcaption>NFC unifies the two café forms while preserving the fi ligature. NFKC also folds ﬁle into file. Code points, UTF-8 bytes, and tokenizer pieces are separate units; the SentencePiece space marker is not a raw U+0020 space byte.</figcaption>
</figure>

Unicode defines four normalization forms: NFD, NFC, NFKD, and NFKC. Here we compare the two composition forms:[^unicodeNormalization2026]
- **NFC (Normalization Form C):** Canonical decomposition followed by canonical composition where allowed. Some combining sequences have no precomposed equivalent. NFC preserves compatibility distinctions such as `ﬁ` versus `fi`.
- **NFKC (Normalization Form Compatibility Composition):** Compatibility decomposition followed by canonical composition where allowed. The ligature `ﬁ` (U+FB01) becomes `f` + `i`, full-width Latin letters and digits become ASCII, and superscript digits become standard digits.

SentencePiece's current default is `nmt_nfkc`, a variant with additional whitespace handling; its implementation doesn't perform every part of standard Unicode NFKC. The model can specify another rule, including `identity`. Default whitespace options remove leading, trailing, and repeated spaces.[^sentencepieceNormalization2026][^sentencepieceModelSpec2026] That matters for code and exact identifiers: don't substitute Python NFKC or assume every SentencePiece checkpoint uses the default.

Testing standard NFC and NFKC in Python makes their differences concrete:

<!-- leetllm: test, output=show -->
```python title="10-normalize-before-tokenizing.py"
import unicodedata

composed = "café"
decomposed = "cafe\u0301"
ligature = "ﬁle"

print("raw cafe equal:", composed == decomposed)
print("NFC cafe equal:", unicodedata.normalize("NFC", composed) == unicodedata.normalize("NFC", decomposed))
print("NFC ligature:", unicodedata.normalize("NFC", ligature))
print("NFKC ligature:", unicodedata.normalize("NFKC", ligature))

assert composed != decomposed
assert unicodedata.normalize("NFC", composed) == unicodedata.normalize("NFC", decomposed)
assert unicodedata.normalize("NFC", ligature) != "file"
assert unicodedata.normalize("NFKC", ligature) == "file"
```

<!-- leetllm: output:start -->
```text title="Output" output compact
raw cafe equal: False
NFC cafe equal: True
NFC ligature: ﬁle
NFKC ligature: file
```
<!-- leetllm: output:end -->

Use the normalizer bundled with the checkpoint consistently. Adding external normalization can change training-time distinctions, and applying it before every request isn't automatically beneficial. Neither NFC nor NFKC is a general visual-lookalike detector or a complete text-safety policy.

## A tokenizer stays with its checkpoint

Training, inference, whitespace, and fallback do not travel as one package. A swap can keep the algorithm name and still point IDs at the wrong rows:

| Algorithm | Training Approach | Inference Mechanism | Whitespace Handling | Coverage / Fallback |
|---|---|---|---|---|
| **BPE** | Bottom-up frequency merging | Ordered merge list replay | Regex pre-tokenization (e.g. GPT-2/4) | Byte-level BPE (BBPE) achieves 100% UTF-8 coverage with zero `<UNK>` |
| **WordPiece** | Likelihood-motivated vocabulary growth; exact trainer matters | BERT-style greedy longest match using a fixed vocabulary | BERT basic tokenizer handles spaces, punctuation, and configured normalization | `[UNK]` for failed segmentation or a configured length limit |
| **SentencePiece BPE** | Bottom-up frequency merging | Replays packaged `.model` | Replaces whitespace with `▁` (U+2581) | Configured character coverage with optional byte fallback or `<unk>` |
| **SentencePiece Unigram** | Probability fitting by EM and approximate vocabulary pruning | Best-path Viterbi, or optional segmentation sampling | Explicit `▁` with configured whitespace normalization | Selected character alphabet; optional byte fallback or `<unk>` |

### Why a tokenizer swap can miss the learned rows

A checkpoint stores learned vectors and projections; the tokenizer bundle defines the mapping between pieces and IDs:
- Input embedding lookup selects row $i$ from $W_E \in \mathbb{R}^{V \times d_{\text{model}}}$.
- The final LM head computes dot products against row $i$ of $W_{\text{head}} \in \mathbb{R}^{V \times d_{\text{model}}}$.

Equal vocabulary size doesn't preserve token meanings. An incompatible replacement can severely degrade a model, but not every file change produces gibberish, and full retraining isn't the only possible adaptation. A pure bijective ID renaming can preserve behavior if all vocabulary-indexed weights, special IDs, and associated state are remapped consistently. New segmentation or new pieces generally require model adaptation and evaluation.

Try the simplest case: keep the pieces, reorder their IDs, and observe what happens if the table stays put.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="11-remap-token-rows.py"
import numpy as np

ids_a = {"prompt": 0, "cache": 1, "failed": 2}
ids_b = {"failed": 0, "prompt": 1, "cache": 2}
rows_a = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, -1.0]], dtype=np.float64)
message = ["prompt", "cache"]

expected = rows_a[[ids_a[p] for p in message]]
wrong = rows_a[[ids_b[p] for p in message]]
rows_b = np.zeros_like(rows_a)
for piece, new_id in ids_b.items():
    rows_b[new_id] = rows_a[ids_a[piece]]
remapped = rows_b[[ids_b[p] for p in message]]

# Tied input/output table evaluated at one fixed hidden vector.
hidden = np.array([0.8, 0.2], dtype=np.float64)
logits_a = {piece: float(rows_a[idx] @ hidden) for piece, idx in ids_a.items()}
logits_b = {piece: float(rows_b[idx] @ hidden) for piece, idx in ids_b.items()}

print("original vectors:", expected.tolist())
print("new IDs, old table:", wrong.tolist())
print("new IDs, remapped table:", remapped.tolist())
print("piece logits preserved:", logits_a == logits_b)
assert not np.array_equal(wrong, expected)
assert np.array_equal(remapped, expected)
assert logits_a == logits_b
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original vectors: [[1.0, 0.0], [0.0, 1.0]]
new IDs, old table: [[0.0, 1.0], [-1.0, -1.0]]
new IDs, remapped table: [[1.0, 0.0], [0.0, 1.0]]
piece logits preserved: True
```
<!-- leetllm: output:end -->

The equality applies to piece-associated logits under this fixed hidden vector. No transformer is run here. For an untied model, both input and output tables need the same ID remapping; output biases and other indexed state, if present, also matter. This exercise doesn't license replacing an existing checkpoint's tokenizer with one that splits text differently.

### Production review checklist

| Observed symptom | Possible tokenization cause | Compatible verification or response |
|---|---|---|
| Model outputs complete gibberish after deploying a new tokenizer | Token IDs select incompatible rows in $W_E$ | Test known text-to-ID/decoding prompts; pin the verified tokenizer and checkpoint together by artifact hashes |
| API token costs are unexpectedly higher for some languages | High token-count ratio on parallel content | Audit fertility across target languages and representative corpora |
| Model repeatedly fails simple multi-digit arithmetic | Numeric token splits may obscure digit positions | Inspect the exact pre-tokenizer regex and tokenization of multi-digit test numbers |
| Code context window exhausts much faster than expected | Whitespace or identifier fragmentation | Measure the checkpoint's actual encoding; select relevant code context or choose a compatible model trained for the workload |
| Prompt cache hit rate differs across request paths | Unicode normalization mismatch or bypass | Compare the full serialized prefix and IDs; use the checkpoint's configured preprocessing and the serving system's cache key rules |
| Model behaves anomalously on specific vocabulary entries | Possible under-trained tokens such as `SolidGoldMagikarp` | Combine corpus-frequency, weight-based, and prompt-behavior audits |

Bundle the chat template and special-token policy with the tokenizer too. Correct piece IDs don't help if one path inserts different role delimiters, beginning/end markers, padding, or truncation. Keep ordinary user text distinct from trusted control-token insertion.

Replay a merge, catch a greedy dead end, and reject a swap that matches only on vocabulary size.

<!-- leetllm: mastery:start -->

## Verify tokenizer compatibility

```checkpoint
Why should a deployed checkpoint use its verified compatible tokenizer bundle?
---
The weights associate integer IDs with specific pieces. Changes to those meanings, segmentation, preprocessing, or special-token insertion can break that learned mapping. Equivalent exports can be compatible, and deliberate ID remapping is possible, but a casual tokenizer swap isn't a model adaptation.
```

```checkpoint
What does byte fallback solve, and what does it leave unsolved?
---
Byte fallback makes every valid UTF-8 character representable without an unknown character token (`<UNK>`). Uncommon scripts can still fragment into multiple byte tokens per character, so sequence length and cost vary across languages.
```

```checkpoint
What makes a glitch-token hypothesis stronger than one anomalous prompt response?
---
Evidence should combine low or absent model-training frequency, unusual weight-based indicators, and repeatable prompt behavior. One response does not prove that a token received zero gradient updates or identify a specific attention mechanism.
```

<!-- leetllm: mastery:end -->

```mastery-quiz
[
  {
    "question": "A migration changes rain from ID 5 to 7 and falls from ID 7 to 5. The team swaps the corresponding input embedding rows and leaves the untied output head in its original order. Both systems start from the same prompt. The old system gives falls the unique highest score for the first generated token. With greedy decoding, which output row wins in the new system on that step, and which piece does it emit?",
    "options": [
      "Row 7 wins and emits rain.",
      "Row 7 wins and emits falls.",
      "Row 5 wins and emits falls.",
      "Row 5 wins and emits rain."
    ],
    "answer": "Row 7 wins and emits rain.",
    "explanation": "Each prompt piece still selects its original input vector. At this first step the model therefore uses the same hidden vector and the same output weights. Row 7 wins again, and the new tokenizer decodes ID 7 as rain. Reading row 7 as falls uses the old dictionary. Choosing row 5 moves the winning score with the input embedding, even though the output weights are separate. Reading row 5 as rain also uses the old dictionary."
  },
  {
    "question": "A BPE tokenizer has three merge rules, applied in this order: (a, i), then (r, a), then (ai, n). How does it encode rain?",
    "options": [
      "r + ain",
      "ra + i + n",
      "r + ai + n",
      "rain"
    ],
    "answer": "r + ain",
    "explanation": "Start from r, a, i, n. Rule 1 merges a + i, which gives r, ai, n. Rule 2 needs r next to a, but a is now inside ai, so it does nothing. Rule 3 merges ai + n, which gives r, ain. The answer ra + i + n applies (r, a) first and ignores the learned order. The answer r + ai + n stops too early. The answer rain needs a whole-word merge that is not in the list. Encoders replay the fixed list and do not invent merges for a prompt, because a new piece would have no ID or trained embedding."
  },
  {
    "question": "A byte-level BPE tokenizer has learned no merges that apply to the string aé✨🙂. These four characters use 1, 2, 3, and 4 UTF-8 bytes. How many tokens does it produce, and are any of them unknown tokens?",
    "options": [
      "4 tokens, none of them unknown.",
      "4 tokens, with the emoji as one unknown token.",
      "7 tokens, with the emoji as one unknown token.",
      "10 tokens, none of them unknown."
    ],
    "answer": "10 tokens, none of them unknown.",
    "explanation": "The base alphabet has all 256 byte values, so valid UTF-8 text is representable with no unknown token. With no merges, each byte is one token: 1 + 2 + 3 + 4 = 10. Byte-level coverage therefore guarantees representation, not compression, and text in scripts rare in training can cost several tokens per character. The 4-token answer assumes one token per character. The answers with an unknown token describe a tokenizer with no byte alphabet, which is the problem byte-level BPE solves."
  },
  {
    "question": "A team is designing the normalizer for a new tokenizer. Composed café (é as U+00E9) and decomposed café (e plus U+0301) must become the same text, so exact-prefix caching treats them alike. The word ﬁle, written with the ﬁ ligature (U+FB01), must stay different from file, because the two can be different identifiers. Which normalization form meets both needs?",
    "options": [
      "NFC",
      "Either NFC or NFKC",
      "Neither NFC nor NFKC",
      "NFKC"
    ],
    "answer": "NFC",
    "explanation": "Both forms unify canonically equivalent text, so both merge the two café spellings. They differ on compatibility characters. NFC leaves the ﬁ ligature alone, while NFKC folds it into f + i, so ﬁle becomes file. Only NFC does both jobs, which rules out NFKC and the two combined answers. For an existing checkpoint, use its bundled normalizer and do not add a new one, because a new one can change the text distinctions that the model saw in training."
  },
  {
    "question": "The only pieces a BERT-style WordPiece tokenizer can match are sun, sunr, ##rise, and ##ay. It encodes sunrise and sunray as separate words. What does it return for each word?",
    "options": [
      "sun + ##rise for sunrise and [UNK] for sunray.",
      "sun + ##rise for sunrise and sunr + ##ay for sunray.",
      "[UNK] for sunrise and sunr + ##ay for sunray.",
      "[UNK] for sunrise and [UNK] for sunray."
    ],
    "answer": "[UNK] for sunrise and sunr + ##ay for sunray.",
    "explanation": "Both words start with sunr, the longest matching piece. In sunrise that leaves ise. No continuation starts there, so the whole word becomes [UNK]. Returning sun + ##rise would require choosing the shorter prefix or going back to it. In sunray, sunr leaves ay, which matches ##ay and completes the word. Returning [UNK] for sunray misses that continuation. Starting both words with sun would explain the split for sunrise and the failure on sunray, where ##ray is missing."
  },
  {
    "question": "In a SentencePiece Unigram model, ▁ marks a space. The vocabulary includes ▁rain (0.02), ▁ (0.15), rain (0.20), ▁ra (0.40), and in (0.01). The only complete paths for ▁rain are ▁rain, ▁ + rain, and ▁ra + in. Which path does deterministic encoding choose, and why?",
    "options": [
      "▁ra + in, because the sum of its probabilities is the highest.",
      "▁ra + in, because it starts with the most probable piece.",
      "▁ + rain, because the product of its probabilities is the highest.",
      "▁rain, because the longest available piece wins."
    ],
    "answer": "▁ + rain, because the product of its probabilities is the highest.",
    "explanation": "Viterbi scores whole paths by multiplying piece probabilities, which is the same as adding log-probabilities. The scores are 0.02 for ▁rain, 0.03 for ▁ + rain, and 0.004 for ▁ra + in. So ▁ + rain wins, although it has neither the longest piece nor the most probable first piece. Adding probabilities would favor ▁ra + in (0.41), but a path's probability is a product. Choosing the best first piece ignores that in is rare. Longest match is the WordPiece rule, not the Unigram rule."
  },
  {
    "question": "A SentencePiece model encodes `blue  sky✨` with two spaces between blue and sky. It uses default whitespace cleanup and the space marker ▁. Its vocabulary covers both words and the marker, but no piece covers ✨ and byte fallback is off. What can a decoder recover from the token IDs alone?",
    "options": [
      "The double space becomes one space, and ✨ is kept.",
      "The double space becomes one space, and ✨ is lost.",
      "The double space is kept, and ✨ is kept.",
      "The double space is kept, and ✨ is lost."
    ],
    "answer": "The double space becomes one space, and ✨ is lost.",
    "explanation": "Cleanup turns the two spaces between blue and sky into one before the tokenizer inserts ▁. Keeping both spaces would require two surviving spaces to mark. The encoder assigns ✨ the shared unknown ID. Keeping ✨ would require an ID or byte sequence that identifies that character. Decoding recovers one space between the words, but the unknown ID carries no record of which character it replaced."
  },
  {
    "question": "A tokenizer proposal raises the vocabulary from 16,384 to 49,152 for a model with hidden size 2,048, FP16 weights, and an untied output head. On the same corpus, the overall rate rises from 4 to 5 characters per token. How much additional memory do the vocabulary weights need, and by what percentage does the token count fall?",
    "options": [
      "128 MiB more, and 20% fewer positions.",
      "128 MiB more, and 25% fewer positions.",
      "256 MiB more, and 25% fewer positions.",
      "256 MiB more, and 20% fewer positions."
    ],
    "answer": "256 MiB more, and 20% fewer positions.",
    "explanation": "Each table gains 32,768 rows of 2,048 weights at 2 bytes per weight. That adds 134,217,728 bytes, or 128 MiB, to one table. The separate input and output tables together gain 256 MiB. For every 100 corpus characters, the token count falls from 25 to 20 on average. The drop is 5 out of 25 tokens, or 20%. The 25% figure measures the increase from 4 to 5 characters per token."
  },
  {
    "question": "BPE training starts from single characters on these words and frequencies: low x3, lot x2, not x1, note x1. After the first merge is applied, which pair is merged next, and what is its count?",
    "options": [
      "o + t, with count 4",
      "n + ot, with count 2",
      "l + o, with count 5",
      "lo + w, with count 3"
    ],
    "answer": "lo + w, with count 3",
    "explanation": "Pairs are weighted by word frequency. The first counts are l + o 5, o + t 4, o + w 3, n + o 2, and t + e 1, so l + o merges first. Then recount, because low and lot now start with lo. The counts become lo + w 3, lo + t 2, n + o 2, o + t 2, and t + e 1, so lo + w merges next. The answer o + t with count 4 is a stale count, because the two occurrences in lot no longer exist. The pair l + o no longer exists after its merge. The answer n + ot comes from counting each word once and ignoring its frequency."
  },
  {
    "question": "A team plans to replace a checkpoint's tokenizer A with tokenizer B. Which check directly tests whether each piece of text still selects the embedding row the model learned for it?",
    "options": [
      "Compare the token IDs that A and B produce for fixed test strings, including special tokens.",
      "Compare the average token counts that A and B produce on test prompts, including long ones.",
      "Compare the vocabulary size of B with the number of rows in the embedding table.",
      "Compare the text that B decodes from its own token IDs with the original test strings."
    ],
    "answer": "Compare the token IDs that A and B produce for fixed test strings, including special tokens.",
    "explanation": "The weights learned a meaning for each ID, so compatibility depends on the same text reaching the same IDs. Comparing IDs from A and B tests that directly. A matching row count shows only that the IDs fit in the table. A round trip tests B against itself, so B can decode perfectly while ID 5 selects the wrong learned vector. A similar average length can hide different segmentation and different ID meanings. Special tokens matter because one wrong control ID can change every request."
  }
]
```

> **Next:** Continue to [Static to Contextual Embeddings](/learn/word-embeddings-contextual-representations). Token IDs select rows in the embedding matrix. Next you'll examine how that table converts integers into geometric vectors, and why a static word vector can't distinguish every meaning of `charge` across contexts.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

Your bill is priced in tokens. Your context window, the most text a model can read at once, is measured in tokens. The model itself sees nothing else. Yet most engineers only meet the tokenizer on the day it hurts them: a sentence in Shan that takes about fifteen times as many tokens as its English translation,[^petrov2023] or a dependency bump after which a healthy model starts speaking nonsense while every tensor shape still checks out.

Both surprises come from the same place, the small program that cuts text into pieces before the model ever runs. Write `rain falls softly` on a page. You see three words. A language model receives integers, and each integer does exactly one thing: it picks a row out of a big table of learned numbers.

Follow one possible cut. Our tokenizer splits the sentence into `rain`, ` falls`, ` soft`, and `ly`, and each space travels with the piece after it. Model-local IDs `2, 5, 1, 6` select four rows from an embedding table.

<figure>
  <img src="illustrations/_generated/tokenization_pipeline_dark.png" alt="Four token pieces rain, ·falls, ·soft, and ly receive model-local row IDs 2, 5, 1, and 6. Each integer selects that row from an eight-row, three-column embedding table, gathering a 4 by 3 input tensor in token order." />
  <figcaption>An ID is a row index. Matching tones track the selected rows, and gathering them in sentence order yields a 4-by-3 matrix. A centered dot marks a space.</figcaption>
</figure>

Match each ID to its table row. ID 6 is not "more" than ID 2, and ID 1 is not close in meaning to ID 2. They are addresses. Everything the model knows about `ly` lives in the row that ID 6 points to, and training is what filled that row in. Keep this picture in mind, because it explains the worst tokenizer bug you will ever see: point the addresses somewhere else, and the model reads the wrong rows with total confidence.

## Choose the units first

Before any algorithm runs, you have to decide what size of piece the model should read. You could cut text into whole words, single characters, or something in between. Each choice breaks in its own way, and those failures explain why nearly every production language model settled on the middle.

Whole words feel natural until you meet a word you have never seen. Language keeps producing them: names, typos, compounds, and identifiers such as `deserialize_payload`. A word that is missing from the dictionary has no row, so without a fallback it collapses into an unknown token and its identity is gone. Trying to out-run the problem with a bigger dictionary gets expensive quickly. A million-word vocabulary at width 4,096 needs two tables of 16-bit weights if the input and output tables are separate, and that comes to about 16.38 GB before you have loaded a single Transformer layer.

Bytes fix coverage completely, because a byte tokenizer needs only 256 base values to represent any UTF-8 string. Characters nearly do, but a character vocabulary has to list every code point it might meet, more than 130,000 when the GPT-2 authors counted.[^radford2019] The price of both is length. Our sentence takes 17 character positions but only 4 subword positions, and ordinary attention compares every position with every other.

<figure>
  <img src="illustrations/_generated/token_granularity_tradeoff_dark.png" alt="Granularity comparison on rain falls softly shows 17 character positions (289 dense attention cells), 4 subword pieces (16 cells), and 3 whole words (9 cells, risking [UNK] on unseen words), alongside common-scale bars comparing quadratic cell counts." />
  <figcaption>Sequence length enters the dense attention grid twice, so a tokenizer's choice of unit shows up quadratically in the bar chart below.</figcaption>
</figure>

Those 289 and 16 cells differ by a factor of 18, but don't expect an 18-fold speedup. Masking and the way hardware runs the work both change the real cost, and the next chapter and the serving chapters show how. The squares show you which way the pressure points. A shorter sequence also takes less room in the context window, which is often the limit you hit first.

Subwords take the useful half of each extreme. Common strings stay whole and cheap. Rare ones break into reusable fragments, so `softly` can borrow a `soft` the model has seen thousands of times. The vocabulary size stays fixed after training, so the memory bill is known in advance.

A few terms are worth separating now, because people use them loosely. The **vocabulary** is the set of available pieces and their IDs. The **segmentation algorithm** chooses which pieces to use for a given input. A complete **tokenizer** also includes normalization, the rules about where segmentation may operate, special tokens, and decoding. That is why two tokenizers with vocabularies of the same size can produce very different sequences.

Training and use are separate too. Tokenizer training builds a vocabulary and its rules from a corpus. Tokenizer inference applies those frozen rules to new text. Model training comes later, and learns how the resulting IDs behave in context. These can use different data, and a later section shows how that gap can cause trouble.

## BPE learns a list of merges

Byte Pair Encoding began life in 1994 as Philip Gage's data compression trick: repeatedly replace the most frequent adjacent pair of bytes with a new symbol.[^gage1994] In 2016, Sennrich, Haddow, and Birch applied the same idea to neural machine translation, and it became the standard way to handle words a model has never seen.[^sennrich2016]

The algorithm fits in a sentence. Count every adjacent pair, merge the most frequent one into a new piece, and do it again. Take a corpus of three words:

| Word | Occurrences | Initial pieces |
|---|---:|---|
| rain | 3 | r a i n |
| rainy | 2 | r a i n y |
| rail | 2 | r a i l |

Count pairs and include the word frequencies. `r a` appears seven times, and so does `a i`. A tie needs a rule, or two runs could disagree, so we take the pair we encountered first. Merge `r a` into `ra` and count again. `ra i` now wins, and after that `rai n` wins with five.

<figure>
  <img src="illustrations/_generated/bpe_merge_steps_dark.png" alt="BPE trains on rain three times, rainy twice, and rail twice. Four successive stages preserve these frequencies. First-seen tie breaking merges r plus a with count seven, ra plus i with count seven, then rai plus n with count five. Weighted token positions fall from thirty to twenty-three, sixteen, and eleven; common-scale bars show that reduction." />
  <figcaption>Each merge shrinks the corpus. Counting again after every merge matters, because a merge changes which pairs are adjacent. `rail` stops at `rai l` because `rai n` is the merge that got learned.</figcaption>
</figure>

Three merges took the corpus from 30 positions to 11. Here is the whole trainer. It works inside words and stops after exactly three merges, which is all the example needs. A production format also defines word limits, special IDs, and when to stop.

<!-- leetllm: test, output=show, id=reader-tokenizer-bpe -->
```python title="learn-three-bpe-merges.py"
from collections import Counter

corpus = [(list(word), count) for word, count in
          [("rain", 3), ("rainy", 2), ("rail", 2)]]

for _ in range(3):
    counts = Counter()
    for pieces, frequency in corpus:
        for pair in zip(pieces, pieces[1:]):
            counts[pair] += frequency
    winner = max(counts, key=counts.get)
    updated = []
    for pieces, frequency in corpus:
        result = []
        index = 0
        while index < len(pieces):
            if tuple(pieces[index:index + 2]) == winner:
                result.append("".join(winner))
                index += 2
            else:
                result.append(pieces[index])
                index += 1
        updated.append((result, frequency))
    corpus = updated
    positions = sum(len(pieces) * count for pieces, count in corpus)
    print(" + ".join(winner), counts[winner], positions)

print([" ".join(pieces) for pieces, _ in corpus])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
r + a 7 23
ra + i 7 16
rai + n 5 11
['rain', 'rain y', 'rai l']
```
<!-- leetllm: output:end -->

What gets saved is the ordered list of merges. At inference, the tokenizer replays that list on the new text and never counts anything again. It has to work this way. Fitting new merges to a user's prompt could invent pieces with no row in the embedding table, and even a different cut using existing pieces would change the input the model was trained on.

Many real tokenizers add one more step before any merging. Left alone, BPE can learn pieces that glue letters to punctuation, so it can spend vocabulary on `failed.`, `failed!`, and `failed\n` separately. The GPT-2 authors reported this kind of waste, and they limited merges by character category, with an exception for spaces.[^radford2019] GPT-2 and encodings like it run a regular expression first to separate letters, digits, punctuation, and whitespace, and merges stay inside those spans. The details vary. Llama 3's pattern, for instance, has a letter branch that can pull in a preceding character from outside its letter, number, and newline categories, so read the actual regex instead of assuming one universal rule.[^metaLlama3Tokenizer2024]

### Why start from bytes

Byte-level BPE starts its alphabet from all 256 byte values, which is how GPT-2 represents arbitrary Unicode through UTF-8.[^radford2019] Now no character is ever unrepresentable, but a token split can fall in the middle of a character. Watch what that does to decoding:

<!-- leetllm: test, output=show, id=reader-tokenizer-utf8 -->
```python title="round-trip-utf8-bytes.py"
message = "関数名"
byte_ids = list(message.encode("utf-8"))
reconstructed = bytes(byte_ids).decode("utf-8")

print("byte count:", len(byte_ids))
print("round trip:", reconstructed)

decoded_separately = "".join(
    bytes([value]).decode("utf-8", errors="replace")
    for value in byte_ids
)
print("per-byte decode exact:", decoded_separately == message)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
byte count: 9
round trip: 関数名
per-byte decode exact: False
```
<!-- leetllm: output:end -->

If you stream tokens to a user and decode each one as it arrives, this is the bug that sprinkles replacement characters through your Japanese output. Buffer the bytes and decode the joined stream. Byte coverage guarantees that you can represent any text. It says nothing about how compactly, and a script the merges rarely saw can cost several tokens per character.

## WordPiece commits and cannot go back

BERT popularized a different approach. Its tokenizer first applies cleaning and punctuation rules, then segments each unit using a fixed vocabulary.[^devlin2019][^bertTokenizerSource2026] A `##` prefix marks a piece that continues a word already in progress. It is only a naming convention, and no literal hash marks appear in the recovered text.

The interesting part is how BERT-style WordPiece searches. At each position it takes the longest piece available and never reconsiders. If that choice leads nowhere, the entire word becomes `[UNK]`. Give it a vocabulary containing `rainb`, `rain`, and `##bow`, then ask it to encode `rainbow`:

<figure>
  <img src="illustrations/_generated/code_tokenization_dark.png" alt="The fixed WordPiece vocabulary has rainb, rain, and continuation piece ##bow. Greedy search takes rainb from rainbow and fails on missing ##ow, so the whole word becomes [UNK]. A second aligned lane shows the valid rain plus ##bow segmentation, which the greedy algorithm never tries." />
  <figcaption>Greedy search takes the longest match and cannot go back, so a word with a perfectly good spelling in the vocabulary still becomes unknown.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-tokenizer-wordpiece -->
```python title="follow-a-wordpiece-dead-end.py"
def wordpiece(word, vocabulary):
    pieces = []
    start = 0
    while start < len(word):
        found = None
        for end in range(len(word), start, -1):
            candidate = word[start:end]
            if start:
                candidate = "##" + candidate
            if candidate in vocabulary:
                found = (candidate, end)
                break
        if found is None:
            return ["[UNK]"]
        piece, start = found
        pieces.append(piece)
    return pieces

vocabulary = {"rainb", "rain", "##bow"}
print(wordpiece("rainbow", vocabulary))
print("rain" + "bow" == "rainbow")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
['[UNK]']
True
```
<!-- leetllm: output:end -->

The practical lesson is that you cannot tell segmentation just by reading a vocabulary file, because the search rule matters just as much.

How WordPiece picks its vocabulary is a murkier story. Published descriptions motivate it with language-model likelihood, but BERT's original trainer was never published, so the trainers you find in tutorials are reconstructions.[^kudo2018a][^hfWordPieceCourse2026] For an existing checkpoint this hardly matters. The vocabulary file and the tokenizer implementation are what you must preserve.

## SentencePiece and Unigram score whole paths

These two names get mixed up constantly. SentencePiece is a toolkit that learns from raw sentences, and it supports both BPE and the Unigram language-model approach.[^kudo2018][^kudo2018a] So "BPE" and "SentencePiece" can describe the same tokenizer at different levels, one naming the method and the other the software.

SentencePiece usually marks a space with a visible `▁`, so a normalized sentence might read `▁rain▁falls`. That keeps word spacing explicit inside the piece model without a separate word-splitting tool, and it is why you can often recover the original spacing when decoding. The exact whitespace behavior lives in the saved model's configuration.

Unigram takes a different view of the problem from WordPiece. Instead of committing piece by piece, it gives each candidate piece a probability and scores complete paths. A word can have several legal segmentations:

<figure>
  <img src="illustrations/_generated/sentencepiece_unigram_dark.png" alt="SentencePiece Unigram lattice on ▁rain scores three complete paths: [▁rain] at 0.30 (cost 1.204), [▁, rain] at 0.015 (cost 4.200), and [▁, ra, in] at 0.00009 (cost 9.316). Common-scale negative log cost bars select [▁rain]." />
  <figcaption>Every route from start to end spells the same text. Each path's probability is the product of its pieces. Adding negative log probabilities gives the same ranking, with the shortest cost bar winning.</figcaption>
</figure>

The whole piece wins at 0.30, far ahead of 0.015 and 0.00009. Dynamic programming, the Viterbi algorithm here, finds the best complete path without listing them all. Since it scores complete paths, a locally attractive first piece can't trap it the way `rainb` trapped WordPiece.

During training, Unigram adjusts its candidate pieces and removes the ones the objective can best do without. Inference normally takes the single best path. There is also a useful training option called subword regularization, which samples alternative segmentations so the model sees several spellings of the same text.[^kudo2018a] If you are reproducing a training run, or measuring token counts, record whether it was on.

## Normalization decides what you can get back

Many tokenizers rewrite text before they segment it, and that step can be quietly lossy. Unicode allows visually identical text to have different underlying code points. A composed `é` and an `e` followed by a combining accent look the same on screen. NFC normalization maps both to one form. NFKC goes further and applies compatibility mappings, turning the ligature `ﬁ` into the letters `fi`.[^unicodeNormalization2026]

<figure>
  <img src="illustrations/_generated/normalization_pipeline_dark.png" alt="Composed café has four code points and five UTF-8 bytes. Decomposed cafe plus combining U+0301 has five points and six bytes. NFC and NFKC map both to the same four code points. The ﬁle ligature input has three code points and five bytes, remains unchanged under NFC, and becomes four letters under NFKC. Each cell is one code point." />
  <figcaption>NFC unifies the two spellings of café. NFKC also rewrites the ligature, and after that step nothing in the output records which spelling came in.</figcaption>
</figure>

<!-- leetllm: test, output=show, id=reader-tokenizer-normalization -->
```python title="inspect-normalized-text.py"
import unicodedata

for text in ["caf\u00e9", "cafe\u0301", "\ufb01le"]:
    nfc = unicodedata.normalize("NFC", text)
    nfkc = unicodedata.normalize("NFKC", text)
    print(len(text), len(text.encode("utf-8")), repr(nfc), repr(nfkc))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
4 5 'café' 'café'
5 6 'café' 'café'
3 5 'ﬁle' 'file'
```
<!-- leetllm: output:end -->

The four fields are the original code-point count, the original UTF-8 byte count, the NFC text, and the NFKC text. Unifying the two cafés helps matching. It is the wrong behavior for code, identifiers, and exact quotations, and once two inputs have merged, the tokens cannot tell you which one you started with. So keep the raw source whenever exact reconstruction matters.

The rules also differ between tools. SentencePiece's saved normalization can differ from Python's NFKC, and its common `nmt_nfkc` rule has its own whitespace behavior.[^sentencepieceNormalization2026][^sentencepieceModelSpec2026] Count with the checkpoint's actual encoder, not with a character count or a similar library.

## Keep the tokenizer with the checkpoint

Here is that dependency bump from the start of the chapter. The embedding matrix has shape $V\times d$, where $V$ is the number of vocabulary rows and $d$ is the width of each vector. Replace the tokenizer with one that has the same $V$, and every shape check still passes. But the IDs now point at different rows, so the model reads the wrong vectors. Here it is in miniature:

<!-- leetllm: test, deps=numpy, output=show, id=reader-tokenizer-remap -->
```python title="swap-ids-without-moving-the-table.py"
import numpy as np

ids_a = {"prompt": 0, "cache": 1, "failed": 2}
ids_b = {"failed": 0, "prompt": 1, "cache": 2}
rows_a = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, -1.0]], dtype=np.float64)
message = ["prompt", "cache"]

expected = rows_a[[ids_a[piece] for piece in message]]
wrong = rows_a[[ids_b[piece] for piece in message]]
rows_b = np.zeros_like(rows_a)
for piece, new_id in ids_b.items():
    rows_b[new_id] = rows_a[ids_a[piece]]
remapped = rows_b[[ids_b[piece] for piece in message]]

print("original vectors:", expected.tolist())
print("new IDs, old table:", wrong.tolist())
print("new IDs, remapped table:", remapped.tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original vectors: [[1.0, 0.0], [0.0, 1.0]]
new IDs, old table: [[0.0, 1.0], [-1.0, -1.0]]
new IDs, remapped table: [[1.0, 0.0], [0.0, 1.0]]
```
<!-- leetllm: output:end -->

The middle line is the outage. Nothing crashed and no shape changed, and the model is now reading `cache` where you wrote `prompt`. Not every change to a tokenizer file is this destructive, and a pure renaming of IDs can be made safe by moving the rows to match. The model's output layer also ties scores to IDs, so a remap has to move input rows, output rows, special IDs, and any other indexed state together. New pieces or a new segmentation are a different matter: those require adapting and evaluating the model.

```checkpoint
You upgrade a tokenizer package. The vocabulary size is unchanged and all tensor shapes match. Why can the model still produce garbage?
---
IDs are row numbers. If the new tokenizer assigns different IDs to the same pieces, or segments text differently, the model reads vectors learned for something else. Shape checks only confirm the table's size. Compare encoded IDs and decoded text on known strings to catch this.
```

For that reason, I would treat the tokenizer as part of the model. Ship the tokenizer revision, vocabulary, merge rules, normalizer, special-token map, and chat template together, and pin them to the checkpoint by hash. Then write a handful of test strings with known expected IDs: an ordinary sentence, accents, repeated spaces, indented code, a long number, and text that looks like a reserved marker. Each one guards a real difference. Here is the start of that check, on a real vocabulary, OpenAI's published `cl100k_base` encoding.

```text title="Install first"
pip install tiktoken==0.14.0
```

The first run downloads the encoding file. This version is the one behind the printed output, so use it if you want yours to match.

<!-- leetllm: test, deps=tiktoken==0.14.0, output=show, id=reader-tokenizer-golden -->
```python title="pin-known-token-ids.py"
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")
golden = {
    "rain falls softly": [30193, 17503, 57150],
    "caf\u00e9": [936, 59958],
    "cafe\u0301": [936, 1897, 54939],
    "    return x": [262, 471, 865],
    "1234567": [4513, 10961, 22],
    "<|endoftext|>": [27, 91, 8862, 728, 428, 91, 29],
}
for text, expected in golden.items():
    assert enc.encode(text, disallowed_special=()) == expected, text
print("tokenizer matches", len(golden), "known strings")
print("reserved:", enc.encode("<|endoftext|>", allowed_special="all"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tokenizer matches 6 known strings
reserved: [100257]
```
<!-- leetllm: output:end -->

This real encoder cuts our sentence into three pieces, not the four we made up earlier, and it gives the two spellings of café different IDs, because it does no normalization of its own. Look at the last string. With `disallowed_special=()`, those characters are ordinary text and cost seven IDs. Ask for the reserved meaning on purpose, and the same spelling becomes one ID. A plain `enc.encode("<|endoftext|>")` raises an error, which is the safe default, and the [chat template chapter](/learn/instruction-tuning-chat-templates) shows what can happen without one.

For a Hugging Face checkpoint, load `AutoTokenizer.from_pretrained(name, revision=commit)` and compare `tokenizer.encode(text)` in the same way. This takes an afternoon and prevents the kind of bug that can take far longer to diagnose.

**If you call a hosted API,** the provider owns the tokenizer, and you may never see an ID. You can't pin it by hash, but you can still count. When we checked in November 2026, OpenAI's endpoint `POST /v1/responses/input_tokens` returned the exact count for a request, including the formatting tokens for roles, and its guide warned that local tokenizers such as `tiktoken` have limits.[^openai2026TokenCounting] `tiktoken` 0.14.0 mapped GPT-5 models to `o200k_base` and had no entry for GPT-6.[^tiktoken014Model2026] Anthropic's `count_tokens` endpoint returned what its guide calls an estimate, and the same guide said that Claude 4.7 and later use a newer tokenizer that produces about 30 percent more tokens for the same text.[^anthropic2026TokenCounting] That is this chapter's dependency bump on someone else's server. So pin the exact model name, log the token counts each response reports, and recount your prompts before you change models.

## Vocabulary size has a price

How large should $V$ be? Real models have landed in very different places. GPT-2 uses 50,257 IDs, Llama 2 uses 32,000, and OpenAI's `o200k_base` encoding has about 200,000 (checked November 2026).[^radford2019][^touvron2023a][^tiktoken014Model2026] Llama 3's report describes 128K pieces, with 256 reserved special-token IDs in its original implementation, and Gemma 2's report describes 256K entries.[^dubey2024][^metaLlama3Tokenizer2024][^gemma2team2024] Newer open models spread just as widely: the published configurations of DeepSeek-V4-Pro and Gemma 4 list 129,280 and 262,144 rows (checked November 2026).[^deepseek2026v4modelcard][^gemma431bConfig2026]

More rows cost memory, and they can shorten every sequence. The memory side is simple arithmetic. An input embedding and a separate output table hold about $2Vd$ weights, so at $V=32{,}000$, $d=4{,}096$, and two bytes per weight, the tables alone use 500 MiB. Tying the two tables together halves that.

<figure>
  <img src="illustrations/_generated/vocab_comparison_dark.png" alt="Top: untied FP16 table memory at hidden dimension 4096 grows linearly across 8k (125 MiB), 32k (500 MiB), and 128k (2,000 MiB) vocabulary rows. Bottom: increasing English compression from 3.17 to 3.94 characters per token lowers token and KV positions to 80.5% and dense N-squared score cells to 64.7%." />
  <figcaption>Top: untied FP16 budget at width 4,096 split evenly between input and output tables. Below: the rates in Llama 3's report, on an English sample, translated into positions and dense score cells for fixed text.[^dubey2024]</figcaption>
</figure>

The payoff side comes from Llama 3's report, which measures 3.17 characters per token for the Llama 2 tokenizer against 3.94 for its own on a sample of English data.[^dubey2024] For similar text, that works out to about 19.5% fewer positions, which also shrinks the per-position cache that serving systems keep, and about 35.3% fewer dense attention score cells. That compares two whole tokenizers, not just more rows, and the report says its 28K added non-English tokens had no impact on English tokenization. A fixed token window holds about 1.24 times as many characters. Those are estimates from one English sample.

## What goes wrong in production

Four failures show up repeatedly once real traffic arrives, and each one looks like a model problem until you inspect the IDs.

**Some languages cost far more.** Petrov et al. call this a token premium: how many times more tokens the same content needs than it does in English. Across parallel FLORES-200 translations, they measured a 15.05-fold premium for Shan with the `cl100k_base` tokenizer used by ChatGPT and GPT-4 at the time, and up to roughly twice the processing time for some languages.[^petrov2023] Shan is the widest gap the paper reports for that tokenizer; Italian needs about 1.6 times as many tokens as English. A higher token count eats the context window and, on most APIs, raises the bill. Part of Llama 3's answer was to add 28K tokens from selected non-English languages to a 100K tiktoken vocabulary, and its report describes better compression and downstream performance for those languages.[^dubey2024] If you serve more than one language, audit counts on parallel content per language. An English-only average hides this completely.

**Numbers get cut in surprising places.** In byte-level BPE tokenizers such as GPT-2's, digits merge according to the learned merge list, so similar-looking numbers can split at different positions. Llama 2 chose to split numbers into single digits.[^touvron2023a] Llama 3 instead groups one to three numeric characters with the regex span `\p{N}{1,3}`.[^metaLlama3Tokenizer2024] Neither policy makes arithmetic correct by itself, because training data and model capacity matter too. When a model struggles with numbers, look at how those numbers tokenize.

**Code can surprise you, in both directions.** Four levels of four-space indentation put 16 leading spaces on a line. A tokenizer with only single-space pieces would spend 16 tokens on them, and one that learned four-space pieces would spend 4. Real encoders can do better than either. Here are a few strings from a typical codebase, through `cl100k_base`:

<!-- leetllm: test, deps=tiktoken==0.14.0, output=show, id=reader-tokenizer-code -->
```python title="count-code-on-a-real-encoder.py"
import hashlib
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")
digest = hashlib.sha256(b"rain falls softly").hexdigest()
strings = {
    "16 spaces": " " * 16,
    "tokenCount": "tokenCount",
    "deserialize_payload": "deserialize_payload",
    "SHA-256 digest": digest,
    "UUID": "123e4567-e89b-12d3-a456-426614174000",
}
for name, text in strings.items():
    count = len(enc.encode(text))
    print(f"{len(text):>3} chars {count:>3} tokens  {name}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
 16 chars   1 tokens  16 spaces
 10 chars   2 tokens  tokenCount
 19 chars   2 tokens  deserialize_payload
 64 chars  38 tokens  SHA-256 digest
 36 chars  18 tokens  UUID
```
<!-- leetllm: output:end -->

Indentation and identifiers are cheap here. The expensive part is opaque text, because an encoder has few merges for random hex: this digest costs one token for every 1.7 characters or so, and the count moves a little with each string. If your prompts carry hashes, IDs, or base64, that is where your budget goes. The vocabulary decides all of this, so run your own code through your own encoder before you budget for it.

**Some tokens were barely trained.** A tokenizer and a model can be trained on different data, so a piece can enter the vocabulary and then almost never appear during model training. Researchers have documented *glitch tokens* such as `SolidGoldMagikarp` that can trigger anomalous behavior.[^bartolo2024undertrainedtokens] One strange response proves nothing. Check how often the piece appeared in training and whether its vector looks unusual, then try it in a few prompts.

When something looks wrong, this table is where I would start:

| Symptom | Likely tokenizer cause | First check |
|---|---|---|
| Gibberish right after a deploy | IDs select the wrong rows | Compare known text-to-ID test strings, and pin tokenizer and checkpoint by hash |
| Bill spikes for some languages | High token count on the same content | Audit token counts on parallel translations |
| Simple multi-digit arithmetic fails | Number splits hide digit positions | Read the pre-tokenizer regex and tokenize some sums |
| Context fills quickly on code | Opaque strings, or a vocabulary with few code pieces | Measure the real encoder on real files |
| Token counts jump after a hosted model upgrade | The new model has a new tokenizer | Recount with the provider's counting endpoint |
| Strange output on a specific string | A possibly under-trained token | Combine corpus counts, weights, and prompt tests |

```checkpoint
Try a new corpus: `boat` five times, `boats` once, and `coat` twice. How many positions does it start with, which pair does BPE merge first, and how many positions are left after three merges? Break ties by taking the pair seen first. Then two quick ones. WordPiece knows `boa`, `boat`, and `##ts`, and has to encode `boats`. Unigram gives `▁boat` probability 0.04, `▁bo` 0.20, and `at` 0.30. What does each one choose?
---
The corpus starts at $5\times4+1\times5+2\times4=33$ positions. `o a` and `a t` tie at 8, and `o a` comes first, which leaves 25. `oa t` at 8 leaves 17, and `b oat` at 6 leaves 11, ending at `boat`, `boat s`, and `c oat`. WordPiece takes the longest match, `boat`, finds no `##s`, and returns `[UNK]`, even though `boa` plus `##ts` spells the word. Unigram compares whole paths, and $0.20\times0.30=0.06$ beats $0.04$, so it cuts the word in two.
```

The tokenizer has now turned a sentence into stable row numbers. Those rows are where learning begins. The [Transformer](/learn/transformer-architecture-end-to-end) takes the vectors you just selected, lets them exchange information across the sentence, and turns the result into a score for every piece in the vocabulary.

<!-- leetllm: edition:reader:end -->
