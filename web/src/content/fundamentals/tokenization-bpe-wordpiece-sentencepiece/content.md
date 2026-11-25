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
  "order": 1
}
---

Your API bill is priced in tokens, your context window is measured in tokens, and the model itself sees nothing else. Yet most engineers first meet the tokenizer on the day it hurts them: a non-English prompt that consumes fifteen times as many tokens as its English translation,[^petrov2023] or a dependency bump after which a healthy model speaks nonsense while every tensor shape still checks out.

Before a language model sees a single word of `rain falls softly`, its tokenizer slices the text into integer IDs. Each integer is a model-local row address in a learned embedding table $W_E \in \mathbb{R}^{V \times d}$. If ID `5` meant ` falls` during training and a swapped tokenizer assigns ID `5` to ` soft`, every shape assertion passes while the model silently reads the wrong learned vectors. Three subword algorithms power modern tokenizers: **Byte-Pair Encoding (BPE)**, **WordPiece**, and **Unigram LM** (with **SentencePiece** packaging BPE and Unigram alongside normalization and reversible whitespace encoding).

<figure>
  <img src="illustrations/_generated/tokenization_pipeline_dark.png" alt="Four token pieces rain, ·falls, ·soft, and ly receive model-local row IDs 2, 5, 1, and 6. Each integer selects that row from an eight-row, three-column embedding table, gathering a 4 by 3 input tensor in token order." />
  <figcaption>Token IDs index rows of the embedding table $W_E$; swapping IDs without remapping rows points the model at the wrong learned vectors. A centered dot marks a leading space.</figcaption>
</figure>

## Why subwords win: words vs. characters vs. subwords

Every tokenizer first picks its granularity, and both extremes break in opposite ways:

- **Whole words** explode vocabulary memory ($V = 10^6, d = 4096$, untied FP16 input and output tables cost $2 \times 10^6 \times 4096 \times 2 \approx 16.38\text{ GB}$ before layer 0) and collapse unseen words, typos, or code identifiers (`deserialize_payload`) into `<UNK>`.
- **Raw characters or bytes** eliminate `<UNK>` (only 256 byte values cover all UTF-8), yet stretch `rain falls softly` from 4 subwords to 17 characters, inflating dense $O(L^2 d)$ attention grids from $4^2 = 16$ cells per head to $17^2 = 289$ cells ($18.1\times$ more pairs).
- **Subwords** keep common strings whole (`rain`, ` falls`), decompose rare words into reusable pieces (` soft` + `ly`), and lock vocabulary size $V$ before model training begins.

<figure>
  <img src="illustrations/_generated/token_granularity_tradeoff_dark.png" alt="Granularity comparison on rain falls softly shows 17 character positions (289 dense attention cells), 4 subword pieces (16 cells), and 3 whole words (9 cells, risking [UNK] on unseen words), alongside common-scale bars comparing quadratic cell counts." />
  <figcaption>Subwords balance vocabulary size against quadratic dense attention cost: 4 pieces (16 cells) vs. 17 characters (289 cells) on the same sentence.</figcaption>
</figure>

Keep three components distinct: the **vocabulary** (pieces and integer IDs), the **segmentation algorithm** (how text maps to pieces), and the complete **tokenizer** (normalization, pre-tokenization boundaries, special tokens, and decoding). Tokenizer training happens once before model training; inference replays frozen rules.

## Byte Pair Encoding (BPE): bottom-up frequency merges

Originally a 1994 compression trick by Philip Gage[^gage1994] and adapted to neural translation by Sennrich et al.,[^sennrich2016] **BPE** grows a vocabulary greedily from the bottom up: start from base characters (or 256 raw UTF-8 bytes in GPT-2's **byte-level BPE**[^radford2019]), count adjacent pairs weighted by word frequency, merge the top pair into a new symbol, recount, and repeat until reaching $V$. At inference time, BPE replays the frozen ordered merge table without recounting prompt frequencies.

<figure>
  <img src="illustrations/_generated/bpe_merge_steps_dark.png" alt="BPE trains on rain three times, rainy twice, and rail twice. Four successive stages preserve these frequencies. First-seen tie breaking merges r plus a with count seven, ra plus i with count seven, then rai plus n with count five. Weighted token positions fall from thirty to twenty-three, sixteen, and eleven; common-scale bars show that reduction." />
  <figcaption>Three BPE merges on `rain` ($\times 3$), `rainy` ($\times 2$), and `rail` ($\times 2$) shrink weighted positions from 30 down to 11. `rail` stops at `rai l` because `rai n` was the learned merge.</figcaption>
</figure>

Production BPE runs a **regex pre-tokenizer** first (GPT-2, `tiktoken`, Llama 3[^radford2019][^dubey2024][^metaLlama3Tokenizer2024]) so merges do not waste vocabulary gluing letters to punctuation (`failed.`, `failed!`, `failed\n`). Because UTF-8 characters span 1 to 4 bytes, byte-level BPE guarantees zero `<UNK>` on arbitrary Unicode, though streaming decoders must buffer incomplete multi-byte characters before calling `.decode("utf-8")` so CJK or emoji output never turns into replacement characters.[^bartolo2024undertrainedtokens]

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

**WordPiece** (introduced for Japanese/Korean ASR and popularized by BERT[^schuster2012][^devlin2019]) selects merges by likelihood intuition rather than raw frequency (often illustrated with the association proxy $\text{count}(ab) / (\text{count}(a)\,\text{count}(b))$[^hfWordPieceCourse2026]) and marks word continuations with `##`. At inference, BERT-style WordPiece runs **greedy longest-match-first without backtracking**: if a longer prefix (`rainb`) hits a dead end (`##ow` missing), the whole word collapses to `[UNK]` even when `rain` + `##bow` is in the vocabulary.[^bertTokenizerSource2026]

<figure>
  <img src="illustrations/_generated/code_tokenization_dark.png" alt="The fixed WordPiece vocabulary has rainb, rain, and continuation piece ##bow. Greedy search takes rainb from rainbow and fails on missing ##ow, so the whole word becomes [UNK]. A second aligned lane shows the valid rain plus ##bow segmentation, which the greedy algorithm never tries." />
  <figcaption>Greedy WordPiece commits to `rainb` and returns `[UNK]` for `rainbow` without backtracking to the valid `rain` + `##bow` split.</figcaption>
</figure>

**SentencePiece**[^kudo2018] is a toolkit that trains directly on raw Unicode streams (essential for scripts without spaces like Japanese, Chinese, and Thai) by encoding spaces explicitly as `▁` (U+2581) so detokenization is straightforward (`"".join(tokens).removeprefix("▁").replace("▁", " ")`).[^sentencepieceModelSpec2026] SentencePiece supports both BPE (used in Llama 2[^touvron2023a]) and the **Unigram Language Model**,[^kudo2018a] which works **top-down**: start from an oversized seed vocabulary, fit piece probabilities via EM to maximize $\mathcal{L} = \sum_s \log \sum_{\mathbf{x} \in \mathcal{S}(s)} \prod_i P(x_i)$, prune the lowest-loss pieces, and decode at inference with **Viterbi dynamic programming** to select the globally highest-probability complete path (avoiding WordPiece's greedy dead end and optionally enabling training-time **subword regularization** by sampling alternative segmentations $q_\alpha(\mathbf{x} \mid s) \propto \prod P(x_i)^\alpha$).

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

| Algorithm | Training | Inference | Whitespace | Fallback |
|---|---|---|---|---|
| **BPE** | Bottom-up frequency merges | Ordered merge replay | Regex pre-tokenizer | Byte-level BPE (0 `<UNK>`) |
| **WordPiece** | Likelihood-motivated merges | Greedy longest-match | Basic tokenizer + `##` | `[UNK]` on dead end |
| **SentencePiece BPE / Unigram** | Raw stream merges or top-down EM pruning | Merge replay or Viterbi | Explicit `▁` (U+2581) | Optional byte fallback or `<unk>` |

## Vocabulary economics, Unicode normalization, and production hazards

Choosing vocabulary size $V$ (32K in Llama 2,[^touvron2023a] 50,257 in GPT-2,[^radford2019] 128K in Llama 3,[^dubey2024] 200K in `o200k_base`,[^tiktoken014Model2026] 256K in Gemma 2[^gemma2team2024]) trades static embedding memory ($2 V d_{\text{model}} b$ for untied FP16 tables: 500 MiB at 32K vs. 2,000 MiB at 128K for $d = 4096$) against shorter sequences. Increasing English compression from Llama 2's 3.17 chars/token to Llama 3's 3.94 chars/token trims sequence length and KV cache by **19.5%** and dense $N^2$ attention cells by **35.3%**.[^dubey2024]

<figure>
  <img src="illustrations/_generated/vocab_comparison_dark.png" alt="Top: untied FP16 table memory at hidden dimension 4096 grows linearly across 8k (125 MiB), 32k (500 MiB), and 128k (2,000 MiB) vocabulary rows. Bottom: increasing English compression from 3.17 to 3.94 characters per token lowers token and KV positions to 80.5% and dense N-squared score cells to 64.7%." />
  <figcaption>Larger vocabularies raise embedding-table memory linearly (top) while shortening sequence length and quadratically cutting dense attention cells (bottom).[^dubey2024]</figcaption>
</figure>

Five production failure modes repeatedly masquerade as model bugs until you inspect the token IDs:

1. **Unicode normalization (`NFC` vs. `NFKC`):** Composed `café` (`\u00E9`) and decomposed `cafe\u0301` look identical on screen yet emit different token IDs unless normalized with `NFC`. Compatibility normalization (`NFKC`, or SentencePiece's `nmt_nfkc`[^sentencepieceNormalization2026]) additionally folds ligatures like `ﬁle` into `file`, silently rewriting code identifiers and losing exact round-trip reconstruction.[^unicodeNormalization2026]
2. **Checkpoint/tokenizer drift:** Swapping a tokenizer without remapping both input embeddings $W_E$ and an untied output head $W_{\text{head}}$ breaks every row lookup even when $V$ matches. Pin tokenizer files, merge rules, normalizers, and special-token maps by hash alongside the checkpoint, and guard deploys with golden text-to-ID test strings.
3. **Multilingual fertility tax:** Across parallel FLORES-200 translations, low-resource scripts like Shan cost up to $15\times$ as many tokens as English on `cl100k_base`, filling context windows and multiplying latency and cost.[^petrov2023]
4. **Numeric and code splitting:** Llama 2 splits digits individually[^touvron2023a] while Llama 3 groups 1 to 3 digits via `\p{N}{1,3}`.[^metaLlama3Tokenizer2024] Code-aware encoders compress indentation (`16 spaces -> 1 token`) and familiar identifiers while fragmenting opaque SHA-256 digests and UUIDs heavily.
5. **Glitch tokens:** Pieces present in the tokenizer corpus yet absent during model training (like `SolidGoldMagikarp`) have under-trained embeddings and trigger erratic outputs.[^bartolo2024undertrainedtokens]

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

Pinning known strings on a real encoder (`cl100k_base`) guards normalization, indentation, numbers, and special-token handling at once. When calling hosted APIs whose tokenizer you do not control, use the provider's official token-counting endpoint (such as OpenAI's `POST /v1/responses/input_tokens` or Anthropic's `count_tokens`) rather than assuming a local `tiktoken` table matches every newer model family.[^openai2026TokenCounting][^anthropic2026TokenCounting]

<!-- leetllm: test, deps=tiktoken==0.14.0, output=show, id=tokenizer-golden -->
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

| Symptom | Likely tokenizer cause | First check |
|---|---|---|
| Gibberish right after deploy | IDs select the wrong embedding/output rows | Compare golden text-to-ID tests; pin checkpoint and tokenizer by hash |
| Bill spikes for non-English traffic | High token fertility on target script | Measure token counts across parallel translations |
| Multi-digit arithmetic degrades | Digit splitting shifts place alignment | Inspect the pre-tokenizer regex on sample numbers |
| Context fills fast on logs/code | Hashes, UUIDs, or base64 fragment heavily | Measure real prompts with the model's exact encoder |
| Replacement glyphs in streamed UTF-8 | Decoding split multi-byte tokens one by one | Buffer bytes and decode incrementally |

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

> **Next:** Continue to [Sentence Embeddings & Contrastive Loss](/learn/sentence-embeddings-contrastive-learning).
