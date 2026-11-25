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
    "numeric pre-tokenization rules and arithmetic alignment",
    "code indentation handling and camelCase identifier fragmentation",
    "glitch tokens and under-trained vocabulary entries",
    "Unicode normalization forms (NFC versus NFKC)"
  ],
  "section": "Core LLM Foundations",
  "order": 2
}
---

<!-- leetllm: edition:reference:start -->

Before a language model sees a single word of `rain falls softly`, its tokenizer slices the text into integer IDs. Each integer is a model-local row address in a learned embedding table $W_E \in \mathbb{R}^{V \times d}$. If ID `5` meant ` falls` during training and a swapped tokenizer assigns ID `5` to ` soft`, every tensor shape still passes while the model silently reads the wrong learned vectors.

Three algorithms power modern subword tokenization: **Byte-Pair Encoding (BPE)**, **WordPiece**, and **Unigram LM** (with **SentencePiece** packaging BPE and Unigram alongside normalization and reversible whitespace encoding).

<figure>
  <img src="illustrations/_generated/tokenization_pipeline_dark.png" alt="Four token pieces rain, ·falls, ·soft, and ly receive model-local row IDs 2, 5, 1, and 6. Each integer selects that row from an eight-row, three-column embedding table, gathering a 4 by 3 input tensor in token order." />
  <figcaption>Token IDs index rows of the embedding table $W_E$; swapping IDs without remapping rows points the model at the wrong learned vectors.</figcaption>
</figure>

## Why subwords win: words vs. characters vs. subwords

- **Whole words** explode vocabulary memory ($V = 10^6, d = 4096$, untied FP16 input + output tables cost $2 \times 10^6 \times 4096 \times 2 \approx 16.38\text{ GB}$ before layer 0) and collapse unseen words or code identifiers (`deserialize_payload`) into `<UNK>`.
- **Raw characters or bytes** eliminate `<UNK>` (only 256 byte values cover all UTF-8), but stretch `rain falls softly` from 4 subwords to 17 characters, inflating dense $O(L^2 d)$ attention grids from $4^2 = 16$ cells per head to $17^2 = 289$ cells ($18.1\times$ more pairs!).
- **Subwords** keep common words intact (`rain`, ` falls`), split rare words into reusable pieces (` soft` + `ly`), and lock vocabulary size $V$ in advance.

<figure>
  <img src="illustrations/_generated/token_granularity_tradeoff_dark.png" alt="Granularity comparison on rain falls softly shows 17 character positions (289 dense attention cells), 4 subword pieces (16 cells), and 3 whole words (9 cells, risking [UNK] on unseen words), alongside common-scale bars comparing quadratic cell counts." />
  <figcaption>Subwords balance vocabulary size against quadratic dense attention cost: 4 pieces (16 cells) vs. 17 characters (289 cells) on the same sentence.</figcaption>
</figure>

## Byte Pair Encoding (BPE): bottom-up frequency merges

Originally a 1994 compression trick by Philip Gage[^gage1994] and adapted to NMT by Sennrich et al.,[^sennrich2016] **BPE** builds a vocabulary greedily from the bottom up: start from base characters (or 256 raw UTF-8 bytes in GPT-2's **byte-level BPE**[^radford2019]), count adjacent pairs weighted by word frequency, merge the top pair into a new symbol, recount, and repeat until hitting target vocabulary size $V$. At inference time, BPE replays the frozen ordered merge table without recounting prompt frequencies.

<figure>
  <img src="illustrations/_generated/bpe_merge_steps_dark.png" alt="BPE trains on rain three times, rainy twice, and rail twice. Four successive stages preserve these frequencies. First-seen tie breaking merges r plus a with count seven, ra plus i with count seven, then rai plus n with count five. Weighted token positions fall from thirty to twenty-three, sixteen, and eleven; common-scale bars show that reduction." />
  <figcaption>Three BPE merges on `rain` ($\times 3$), `rainy` ($\times 2$), and `rail` ($\times 2$) shrink weighted positions from 30 down to 11.</figcaption>
</figure>

Production BPE adds a **regex pre-tokenizer** (GPT-2, `tiktoken`, Llama 3[^radford2019][^dubey2024][^metaLlama3Tokenizer2024]) so merges never glue letters across punctuation or whitespace boundaries. Because UTF-8 characters span 1 to 4 bytes, byte-level BPE guarantees zero `<UNK>` on arbitrary Unicode, though streaming decoders must buffer incomplete multi-byte characters before calling `.decode("utf-8")`![^bartolo2024undertrainedtokens]

<!-- leetllm: test, output=show -->
```python title="bpe-train-replay-and-utf8.py"
from collections import Counter

def merge_pair(pieces: tuple[str, ...], pair: tuple[str, str]) -> tuple[str, ...]:
    out, i = [], 0
    while i < len(pieces):
        if i + 1 < len(pieces) and pieces[i:i + 2] == pair:
            out.append(pair[0] + pair[1])
            i += 2
        else:
            out.append(pieces[i])
            i += 1
    return tuple(out)

state = {tuple("rain"): 3, tuple("rainy"): 2, tuple("rail"): 2}
merges = []
for step in range(3):
    counts = Counter()
    for pieces, freq in state.items():
        for pair in zip(pieces, pieces[1:]):
            counts[pair] += freq
    winner, top = counts.most_common(1)[0]
    state = {merge_pair(p, winner): f for p, f in state.items()}
    merges.append(winner)
    print(f"merge {step + 1}: {winner} -> {''.join(winner)} (count={top})")

def encode(word: str) -> list[str]:
    p = tuple(word)
    for m in merges:
        p = merge_pair(p, m)
    return list(p)

print("replay:", {w: encode(w) for w in ("rain", "rainy", "rail", "airy")})
raw_bytes = list("関数✨".encode("utf-8"))
print(f"UTF-8 bytes ({len(raw_bytes)}): round-trip={bytes(raw_bytes).decode('utf-8')!r}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
merge 1: ('r', 'a') -> ra (count=7)
merge 2: ('ra', 'i') -> rai (count=7)
merge 3: ('rai', 'n') -> rain (count=5)
replay: {'rain': ['rain'], 'rainy': ['rain', 'y'], 'rail': ['rai', 'l'], 'airy': ['a', 'i', 'r', 'y']}
UTF-8 bytes (9): round-trip='関数✨'
```
<!-- leetllm: output:end -->

```checkpoint
Why can't an inference BPE tokenizer learn new merges on the fly from the user's prompt?
---
The checkpoint's embedding rows and output head correspond to fixed learned merge IDs. Inventing new merges at inference creates pieces with no trained embedding row and alters the segmentation distribution the model expects.
```

## WordPiece, SentencePiece, and Unigram LM

**WordPiece** (introduced for Japanese/Korean ASR and used in BERT[^schuster2012][^devlin2019]) selects merges by likelihood intuition rather than raw frequency (often illustrated with the association proxy $\text{count}(ab) / (\text{count}(a)\,\text{count}(b))$[^hfWordPieceCourse2026]) and marks word continuations with `##`. At inference, BERT's WordPiece runs **greedy longest-match-first without backtracking**: if a longer prefix (`rainb`) hits a dead end (`##ow` missing), the whole word collapses to `[UNK]` even when `rain` + `##bow` is in the vocabulary![^bertTokenizerSource2026]

<figure>
  <img src="illustrations/_generated/code_tokenization_dark.png" alt="The fixed WordPiece vocabulary has rainb, rain, and continuation piece ##bow. Greedy search takes rainb from rainbow and fails on missing ##ow, so the whole word becomes [UNK]. A second aligned lane shows the valid rain plus ##bow segmentation, which the greedy algorithm never tries." />
  <figcaption>Greedy WordPiece commits to `rainb` and returns `[UNK]` for `rainbow` without backtracking to the valid `rain` + `##bow` split.</figcaption>
</figure>

**SentencePiece**[^kudo2018] trains directly on raw Unicode streams (vital for Japanese, Chinese, and Thai) by encoding spaces explicitly as `▁` (U+2581) so detokenization is straightforward (`"".join(tokens).removeprefix("▁").replace("▁", " ")`).[^sentencepieceModelSpec2026] SentencePiece supports both BPE (used in Llama 2[^touvron2023a]) and the **Unigram Language Model**,[^kudo2018a] which works **top-down**: start with an oversized seed vocabulary, fit piece probabilities via EM to maximize $\mathcal{L} = \sum_s \log \sum_{\mathbf{x} \in \mathcal{S}(s)} \prod_i P(x_i)$, prune the lowest-loss pieces, and decode at inference with **Viterbi dynamic programming** to find the globally highest-probability path (avoiding WordPiece's greedy trap and optionally enabling training-time **subword regularization** via posterior sampling $q_\alpha(\mathbf{x} \mid s) \propto \prod P(x_i)^\alpha$).

<figure>
  <img src="illustrations/_generated/sentencepiece_unigram_dark.png" alt="SentencePiece Unigram lattice on ▁rain scores three complete paths: [▁rain] at 0.30 (cost 1.204), [▁, rain] at 0.015 (cost 4.200), and [▁, ra, in] at 0.00009 (cost 9.316). Common-scale negative log cost bars select [▁rain]." />
  <figcaption>Unigram Viterbi scores complete paths by summed negative log-probabilities and selects `['▁rain']` (cost 1.204) over two- and three-piece splits.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="wordpiece-dead-end-and-unigram-viterbi.py"
import numpy as np

def wordpiece(word: str, vocab: set[str]) -> list[str]:
    out, i = [], 0
    while i < len(word):
        match = next(
            (((("##" if i else "") + word[i:e]), e)
             for e in range(len(word), i, -1)
             if (("##" if i else "") + word[i:e]) in vocab),
            None,
        )
        if match is None:
            return ["[UNK]"]
        piece, i = match
        out.append(piece)
    return out

print("WordPiece greedy trap on 'rainbow':", wordpiece("rainbow", {"rainb", "rain", "##bow"}))

probs = {"▁rain": 0.30, "▁": 0.15, "rain": 0.10, "ra": 0.02, "in": 0.03, "sun": 0.20, "cloud": 0.20}
logp = {k: float(np.log(v)) for k, v in probs.items()}
text = "▁rain"
best = [(0.0, -1, "")] + [(-np.inf, -1, "")] * len(text)
for s in range(len(text)):
    for e in range(s + 1, len(text) + 1):
        piece = text[s:e]
        if piece in logp and best[s][0] + logp[piece] > best[e][0]:
            best[e] = (best[s][0] + logp[piece], s, piece)
pieces, cur = [], len(text)
while cur > 0:
    _, cur, p = best[cur]
    pieces.append(p)
pieces.reverse()
print("Unigram Viterbi on '▁rain':", pieces, "score:", round(best[len(text)][0], 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
WordPiece greedy trap on 'rainbow': ['[UNK]']
Unigram Viterbi on '▁rain': ['▁rain'] score: -1.204
```
<!-- leetllm: output:end -->

## Vocabulary economics, Unicode normalization, and production failure modes

Choosing vocabulary size $V$ (32K in Llama 2,[^touvron2023a] 50,257 in GPT-2,[^radford2019] 128K in Llama 3,[^dubey2024] 256K in Gemma 2[^gemma2team2024]) trades static embedding RAM ($2 V d_{\text{model}} b$ for untied FP16 tables: 500 MiB at 32K vs. 2,000 MiB at 128K for $d = 4096$) against shorter sequences. Increasing English compression from Llama 2's 3.17 chars/token to Llama 3's 3.94 chars/token trims sequence length and KV cache by **19.5%** and dense $N^2$ attention cells by **35.3%**.[^dubey2024]

<figure>
  <img src="illustrations/_generated/vocab_comparison_dark.png" alt="Top: untied FP16 table memory at hidden dimension 4096 grows linearly across 8k (125 MiB), 32k (500 MiB), and 128k (2,000 MiB) vocabulary rows. Bottom: increasing English compression from 3.17 to 3.94 characters per token lowers token and KV positions to 80.5% and dense N-squared score cells to 64.7%." />
  <figcaption>Larger vocabularies raise embedding-table memory linearly (top) while shortening sequence length and quadratically cutting dense attention cells (bottom).[^dubey2024]</figcaption>
</figure>

Four subtle tokenizer effects show up repeatedly in production:

1. **Multilingual fertility tax:** Parallel FLORES-200 translations can take up to $15\times$ more tokens in low-resource scripts (like Shan on `cl100k_base`) than in English, eating context windows and inflating latency and token bills.[^petrov2023]
2. **Numeric splitting:** Llama 2 splits every digit individually,[^touvron2023a] while Llama 3 groups 1 to 3 digits via `\p{N}{1,3}`.[^metaLlama3Tokenizer2024] Always check how your tokenizer splits multi-digit numbers before diagnosing arithmetic errors.
3. **Unicode normalization (`NFC` vs. `NFKC`):** Composed `café` (`\u00E9`) and decomposed `cafe\u0301` look identical on screen yet produce different token IDs unless normalized with `NFC`. Compatibility normalization (`NFKC`, or SentencePiece's `nmt_nfkc`[^sentencepieceNormalization2026]) goes further and folds ligatures like `ﬁle` into `file`, which can silently alter code identifiers.[^unicodeNormalization2026]
4. **Glitch tokens and tokenizer swaps:** Under-trained vocabulary entries (like `SolidGoldMagikarp`) can trigger anomalous outputs.[^bartolo2024undertrainedtokens] And swapping a tokenizer without remapping both input embeddings $W_E$ and untied output head $W_{\text{head}}$ breaks every row lookup even when $V$ matches!

<figure>
  <img src="illustrations/_generated/normalization_pipeline_dark.png" alt="Composed café has four code points and five UTF-8 bytes. Decomposed cafe plus combining U+0301 has five points and six bytes. NFC and NFKC map both to the same four code points. The ﬁle ligature input has three code points and five bytes, remains unchanged under NFC, and becomes four letters under NFKC. Each cell is one code point." />
  <figcaption>`NFC` unifies composed and decomposed `café` while keeping ligatures distinct; `NFKC` additionally folds `ﬁle` into `file`.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="normalization-and-id-remap.py"
import unicodedata
import numpy as np

# 1. NFC vs NFKC normalization
print("NFC cafe equal:", unicodedata.normalize("NFC", "café") == unicodedata.normalize("NFC", "cafe\u0301"))
print("NFC vs NFKC on 'ﬁle':", unicodedata.normalize("NFC", "ﬁle"), "vs", unicodedata.normalize("NFKC", "ﬁle"))

# 2. Swapping token IDs without moving embedding rows breaks lookup
ids_a = {"prompt": 0, "cache": 1, "failed": 2}
ids_b = {"failed": 0, "prompt": 1, "cache": 2}
rows_a = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, -1.0]])
rows_b = np.zeros_like(rows_a)
for piece, new_id in ids_b.items():
    rows_b[new_id] = rows_a[ids_a[piece]]

msg = ["prompt", "cache"]
print("Original rows:", rows_a[[ids_a[p] for p in msg]].tolist())
print("Swapped IDs, unmoved table:", rows_a[[ids_b[p] for p in msg]].tolist())
print("Swapped IDs, remapped table:", rows_b[[ids_b[p] for p in msg]].tolist())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
NFC cafe equal: True
NFC vs NFKC on 'ﬁle': ﬁle vs file
Original rows: [[1.0, 0.0], [0.0, 1.0]]
Swapped IDs, unmoved table: [[0.0, 1.0], [-1.0, -1.0]]
Swapped IDs, remapped table: [[1.0, 0.0], [0.0, 1.0]]
```
<!-- leetllm: output:end -->

| Algorithm | Training | Inference | Whitespace | Fallback |
|---|---|---|---|---|
| **BPE** | Bottom-up frequency merges | Ordered merge replay | Regex pre-tokenizer | Byte-level BPE (0 `<UNK>`) |
| **WordPiece** | Likelihood-motivated merges | Greedy longest-match | Basic tokenizer + `##` | `[UNK]` on dead end |
| **SentencePiece BPE / Unigram** | Raw stream merges or top-down EM pruning | Merge replay or Viterbi | Explicit `▁` (U+2581) | Optional byte fallback or `<unk>` |

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
    "explanation": "Each prompt piece still selects its original input vector. At this first step the model therefore uses the same hidden vector and the same output weights. Row 7 wins again, and the new tokenizer decodes ID 7 as rain."
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
    "explanation": "Start from r, a, i, n. Rule 1 merges a + i, which gives r, ai, n. Rule 2 needs r next to a, so it does nothing. Rule 3 merges ai + n, which gives r, ain."
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
    "explanation": "The base alphabet covers all 256 byte values, so valid UTF-8 text needs no unknown token. With no merges, each byte is one token: 1 + 2 + 3 + 4 = 10."
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
    "explanation": "Both NFC and NFKC unify canonically equivalent café spellings, while only NFC leaves the compatibility ligature ﬁle distinct from file."
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
    "explanation": "Greedy longest-match selects sunr for both words. For sunrise, no ##ise continuation exists so it returns [UNK]; for sunray, ##ay completes the word."
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
    "explanation": "Viterbi multiplies piece probabilities: 0.02 for ▁rain, 0.03 for ▁ + rain, and 0.004 for ▁ra + in. So ▁ + rain wins."
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
    "explanation": "Whitespace cleanup collapses the double space into one, and without byte fallback ✨ maps to `<unk>`, losing its identity."
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
    "explanation": "32,768 new rows × 2,048 × 2 bytes = 128 MiB per table, or 256 MiB across untied input and output tables. Moving from 4 to 5 chars/token shrinks 25 tokens per 100 chars to 20, a 20% drop."
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
    "explanation": "First merge is l + o (count 5). After recounting, lo + w has count 3 while lo + t, n + o, and o + t drop to 2."
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
    "explanation": "Compatibility requires identical text-to-ID mappings (including special tokens). Vocabulary size, average length, and self round-trips can all pass while IDs point at the wrong rows."
  }
]
```

> **Next:** Continue to [Static to Contextual Embeddings](/learn/word-embeddings-contextual-representations).
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

For that reason, treat the tokenizer as part of the model. Ship the tokenizer revision, vocabulary, merge rules, normalizer, special-token map, and chat template together, and pin them to the checkpoint by hash. Then write a handful of test strings with known expected IDs: an ordinary sentence, accents, repeated spaces, indented code, a long number, and text that looks like a reserved marker. Each one guards a real difference. Here is the start of that check on OpenAI's published `cl100k_base` encoding:

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

For a Hugging Face checkpoint, load `AutoTokenizer.from_pretrained(name, revision=commit)` and compare `tokenizer.encode(text)` in the same way.

**If you call a hosted API,** the provider owns the tokenizer, and you may never see an ID. Use the provider's official token-counting endpoint (such as OpenAI's `POST /v1/responses/input_tokens` or Anthropic's `count_tokens` endpoint) rather than assuming a local `tiktoken` table matches every newer hosted model family.[^openai2026TokenCounting][^tiktoken014Model2026][^anthropic2026TokenCounting] Pin the exact model name, log the token counts each response reports, and recount your prompts before switching models.

## Vocabulary size has a price

How large should $V$ be? Real models span a wide range: GPT-2 uses 50,257 IDs, Llama 2 uses 32,000, OpenAI's `o200k_base` has about 200,000, Llama 3 uses 128K pieces (plus 256 reserved special IDs), Gemma 2 uses 256K, DeepSeek-V4-Pro lists 129,280, and Gemma 4 lists 262,144 rows.[^radford2019][^touvron2023a][^tiktoken014Model2026][^dubey2024][^metaLlama3Tokenizer2024][^gemma2team2024][^deepseek2026v4modelcard][^gemma431bConfig2026]

More rows cost memory, and they can shorten every sequence. An input embedding and a separate output table hold about $2Vd$ weights, so at $V=32{,}000$, $d=4{,}096$, and two bytes per weight, the tables alone use 500 MiB. Tying the two tables together halves that.

<figure>
  <img src="illustrations/_generated/vocab_comparison_dark.png" alt="Top: untied FP16 table memory at hidden dimension 4096 grows linearly across 8k (125 MiB), 32k (500 MiB), and 128k (2,000 MiB) vocabulary rows. Bottom: increasing English compression from 3.17 to 3.94 characters per token lowers token and KV positions to 80.5% and dense N-squared score cells to 64.7%." />
  <figcaption>Top: untied FP16 budget at width 4,096 split evenly between input and output tables. Below: the rates in Llama 3's report, on an English sample, translated into positions and dense score cells for fixed text.[^dubey2024]</figcaption>
</figure>

The payoff side comes from Llama 3's report, which measures 3.17 characters per token for the Llama 2 tokenizer against 3.94 for its own on a sample of English data.[^dubey2024] For similar text, that works out to about 19.5% fewer positions, which also shrinks the per-position cache that serving systems keep, and about 35.3% fewer dense attention score cells. A fixed token window holds about 1.24 times as many characters.

## What goes wrong in production

Four failures show up repeatedly once real traffic arrives, and each one looks like a model problem until you inspect the IDs.

**Some languages cost far more.** Petrov et al. call this a token premium: how many times more tokens the same content needs than it does in English. Across parallel FLORES-200 translations, they measured a 15.05-fold premium for Shan with `cl100k_base`, and up to roughly twice the processing time for some languages (Italian sits around 1.6x English).[^petrov2023] Part of Llama 3's answer was to add 28K tokens from selected non-English languages to a 100K tiktoken vocabulary.[^dubey2024] If you serve multiple languages, measure token counts on parallel translations per language.

**Numbers get cut in surprising places.** In byte-level BPE tokenizers such as GPT-2's, digits merge according to the learned merge list, so similar-looking numbers can split at different positions. Llama 2 chose to split numbers into single digits,[^touvron2023a] while Llama 3 groups one to three numeric characters with `\p{N}{1,3}`.[^metaLlama3Tokenizer2024] When a model struggles with numbers, inspect how those numbers tokenize.

**Code can surprise you, in both directions.** Four levels of four-space indentation put 16 leading spaces on a line. Real code-aware encoders like `cl100k_base` compress indentation and identifiers aggressively while fragmenting random hex hashes and UUIDs:

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

Indentation and identifiers are cheap here, while opaque random hex burns one token per 1.7 characters. If your prompts carry hashes, IDs, or base64, that is where your budget goes.

**Some tokens were barely trained.** Because a tokenizer and a model can be trained on different data, a piece can enter the vocabulary and then almost never appear during model training, producing *glitch tokens* such as `SolidGoldMagikarp` that trigger anomalous behavior.[^bartolo2024undertrainedtokens] Combine training frequency, weight norms, and prompt tests to confirm a candidate.

| Symptom | Likely tokenizer cause | First check |
|---|---|---|
| Gibberish right after a deploy | IDs select the wrong rows | Compare known text-to-ID test strings, and pin tokenizer and checkpoint by hash |
| Bill spikes for some languages | High token count on the same content | Measure token counts on parallel translations |
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
