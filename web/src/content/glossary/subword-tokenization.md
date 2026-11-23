---
title: Subword tokenization
aliases: ["subword segmentation"]
importance: 86
---
**Subword tokenization** splits text into units that sit between whole words and raw characters (or bytes): a fixed vocabulary of reusable pieces large enough to keep common strings compact, and small enough that rare or new words can still be composed from pieces the model has seen. Most current text LLMs use it before embeddings, attention, and next-token prediction; character-level and byte-level models are alternatives.

A pure word vocabulary fails on open text: names, code identifiers, morphologically rich languages, and typos never fit a closed dictionary. A pure character or pure byte sequence is always open-vocabulary, but sequences get long and common multi-character patterns must be rediscovered by the network. Subwords are the engineering compromise that made open-vocabulary neural MT practical (Sennrich, Haddow, and Birch, ACL 2016) and that still defines how GPT-style, BERT-style, and SentencePiece-based models see text.

## Intuition

A tokenizer learns frequent text co-occurrences as reusable pieces. Frequent patterns earn short codes (often one token for a whole word, including a leading space in GPT-family schemes); rare combinations stay long as smaller pieces. The model learns embeddings for those pieces, so `unhappiness` can reuse fragments such as `un` and `happiness` without a dedicated row for every possible word form.

The model receives integer token IDs from a [tokenizer artifact](glossary://tokenizer-artifact); one human word can map to one or several IDs. Changing the artifact changes the token sequence, context cost, and embedding rows for the same text.

## How it works

A typical pipeline has these stages, although normalization and pre-tokenization depend on the tokenizer:

1. **Normalize** text (Unicode form, lowercasing policies, control characters). NFC vs NFKC can change token IDs before any merge runs; see [Unicode normalization](glossary://unicode-normalization).
2. **Pre-tokenize** into coarse spans (spaces, punctuation, regex rules such as GPT-2's). Merges usually do not cross those boundaries.
3. **Segment** each span into subword pieces with a learned algorithm (BPE, WordPiece, or Unigram).
4. **Map** pieces to integer IDs, including special tokens (BOS, EOS, pad, chat markers).
5. **Detokenize** IDs back to text on the way out (space markers such as `Ġ` or `▁`, continuation markers such as `##`).

Training builds the vocabulary from a corpus; serving must replay the **same** normalization, pre-tokenizer, vocab, and rules. The three dominant families differ mainly in how the vocabulary is grown or pruned and how encode-time choices are made:

| Family | Build idea | Encode-time behavior | Classic lineage |
|---|---|---|---|
| [BPE](glossary://bpe) | Start small; repeatedly merge the most frequent adjacent pair (Gage 1994 compression; Sennrich et al. 2016 for NMT) | Apply merges in fixed rank order | GPT-2/3/4-family (byte-level), many chat models |
| [WordPiece](glossary://wordpiece) | Grow pieces scored for likelihood gain (Schuster and Nakajima 2012; BERT) | Often greedy longest-match; `##` continuations | BERT and related encoder models |
| [Unigram LM](glossary://unigram-language-model) | Start large; prune pieces that hurt corpus likelihood least (Kudo 2018) | Viterbi (or sample) over piece probabilities | SentencePiece Unigram; many multilingual setups |

[SentencePiece](glossary://sentencepiece) packages and trains BPE or Unigram on raw text, often representing whitespace as a normal character marked `▁`.

**Coverage of arbitrary Unicode** is a separate design axis:

| Scheme | Base units | Unknown character path |
|---|---|---|
| Character BPE / classic WordPiece | Learned char alphabet | Can emit `[UNK]` and lose the string |
| Byte-level BPE | All $256$ UTF-8 bytes from the start | Always representable |
| Char/subword + [byte fallback](glossary://byte-fallback) | Learned pieces first | Spell missing code points as UTF-8 byte tokens |

## Formula

After training, a string $s$ becomes a sequence of pieces $x_1,\ldots,x_n$ with $n = |T(s)|$ under tokenizer $T$. Downstream cost scales with $n$:

$$
\text{prompt tokens} = |T(\text{serialized full prompt})|
$$

Separately counting fields is an estimate: chat wrappers and special tokens add overhead, and concatenation can change merge boundaries. For Unigram (Kudo 2018), a segmentation is scored as a product of piece probabilities:

$$
P(x_1,\ldots,x_n) = \prod_{i=1}^{n} p(x_i)
$$

BPE and WordPiece are not usually presented as a joint probability over segmentations at serve time; they produce one deterministic segmentation given ranks or longest-match rules. Unigram makes alternate segmentations explicit, which is why subword regularization (sampling segmentations at train time) is natural there.

Vocabulary size for a byte-level BPE-style artifact is roughly:

$$
|\mathcal{V}| \approx 256 + M + S
$$

where $M$ is the number of learned merges and $S$ counts special tokens. GPT-2 is the textbook instance: $256 + 50{,}000 + 1 = 50{,}257$.

## Example

Same English string, different design choices (illustrative splits; real IDs depend on the exact artifact):

| Input | Possible pieces | What this teaches |
|---|---|---|
| `unhappiness` | `un` + `happiness`, or finer fragments | Morphology-like reuse without a full word list |
| `HTTPRequestParser` | `HTTP` + `Request` + `Parser` vs many char-ish pieces | CamelCase and code often fracture by pre-tokenizer rules |
| `adapter-v9XZ-alpha` | many short pieces | "Short" human text can be long for the model |
| leading space + word | one token `Ġword` vs separate space + word | Whitespace is part of the token identity in GPT-family BPE |
| rare CJK / emoji | multi-byte pieces or byte fallback | Token cost depends on vocabulary coverage and byte fallback |

Concrete budget sketch. Suppose a support ticket is $800$ characters of mixed English and stack traces. Under a general web BPE:

- Clean English prose of that length might land near $180$ to $220$ tokens.
- The same length of UUIDs, JSON keys, and stack frames can exceed $400$ tokens.

That roughly doubles [context window](glossary://context-window) use, KV-cache footprint, and billed tokens for text that looks similar in a text editor. Always count with the production encoder:

```python
# Sketch: pin the same artifact the checkpoint was trained with.
# Hugging Face-style tokenizer interface; other libraries expose different APIs.
pieces = tokenizer.encode("adapter-v9XZ-alpha")
print(len(pieces), pieces)
print(tokenizer.convert_ids_to_tokens(pieces))
# Round-trip: watch leading spaces, Ġ / ▁ markers, and NFC/NFKC.
print(repr(tokenizer.decode(pieces)))
```

Toy BPE merge playback (same idea as the Hugging Face BPE lesson). After merges `(u,g)->ug`, `(u,n)->un`, `(h,ug)->hug`:

| Input | After merges |
|---|---|
| `hug` | `hug` |
| `bug` | `b` `ug` |
| `thug` under char BPE missing `t` | often `[UNK]` + `hug` |
| `thug` under byte-level BPE | always representable; may stay multiple pieces |

## Worked numbers

Sequence length is the production unit of cost, not word count. For a fixed model, attention and KV memory scale with token positions $T$, not with characters $C$.

Rough English rule of thumb (order of magnitude only; measure on your traffic):

$$
T \approx \frac{C}{4}
$$

for clean prose under many English-heavy BPEs. Domain text often sits far from that ratio:

| Content shape | Typical behavior under a general English-heavy vocab |
|---|---|
| News / docs English | Strong compression; long merges fire often |
| Source code, minified JS | More fragments; punctuation and identifiers split |
| Model IDs, hashes, base64 | Near character or byte length |
| CJK with weak coverage | High $T/C$; byte fallback can make one glyph 2 to 4 tokens |

If prefill latency or billable tokens jump after a content mix change, print $T$ and the piece list before retuning the model. Many apparent context shortfalls come from tokenizer expansion; compare actual token counts with prior traffic before adjusting the product window.

## Trade-offs

- **Vocab size vs sequence length.** Larger $|\mathcal{V}|$ shortens typical $T$ and shrinks attention/KV work per request, but grows the embedding matrix and can overfit rare merges from training data.
- **Domain skew.** A general web vocab fragments medical codes, model IDs, and repo-specific identifiers. A domain-trained vocab reverses that and can bloat everyday English.
- **Pre-tokenizer rules matter as much as the algorithm.** Leading-space tokens, digit splitting, and regex boundaries change counts even when the merge file is fixed.
- **Determinism vs flexibility.** BPE rank playback and WordPiece longest-match are stable training/serving contracts. Unigram can sample alternate segmentations for regularization in training; serving usually freezes the best path.
- **Information loss vs coverage.** Classic WordPiece paths can emit `[UNK]`. Byte-level BPE and byte fallback almost never do, but they can still model rare scripts poorly if those byte sequences were rare in pretraining.
- **Artifact coupling.** Fine-tunes, evals, RAG chunkers, and API gateways must share the same tokenizer files as the weights. Swapping "a similar BPE" silently remaps every ID.

## Debug path

When quality, cost, or truncation looks wrong:

1. Encode the **exact** production string (including trailing spaces and JSON).
2. Print piece strings and IDs, then decode and compare to the input (watch NFC/NFKC and space markers).
3. Compare token counts across train, eval, and serve artifacts; a hash or file version on the artifact should match the checkpoint.
4. For "the model cannot spell this URL / code / name," inspect split boundaries first. Many reasoning failures are boundary failures.
5. For budget surprises on CJK, emoji, or logs, check whether pieces are learned subwords or single-byte fallback tokens.

```text
raw text
  -> normalize
  -> pre-tokenize
  -> subword segment (BPE / WordPiece / Unigram)
  -> integer IDs
  -> model
  -> detokenize
```

If any step diverges between training and serving, the model is no longer reading the same language.

## Why it matters here

Subword tokenization is the shared front door for every LLM lesson on context length, pricing, batching, multilingual behavior, code understanding, and eval parity. It sits above [token](glossary://token) and [tokenization](glossary://tokenization) as the design choice that made fixed-vocab neural models open-vocabulary, and below the specific algorithms ([BPE](glossary://bpe), [WordPiece](glossary://wordpiece), [Unigram LM](glossary://unigram-language-model)) and packaging ([SentencePiece](glossary://sentencepiece), [tokenizer artifact](glossary://tokenizer-artifact)).

In production you debug systems in token units: prompt packing, KV-cache size, continuous batching, and API bills all settle after the subword step. Browser word counts are not the billing unit. Pin the artifact with the checkpoint, count tokens with the same encoder the model uses, and treat unexpected splits on URLs, code, and non-English text as first-class incidents, not model mysticism.

## Related terms

- [Tokenization](glossary://tokenization)
- [BPE](glossary://bpe)
- [WordPiece](glossary://wordpiece)
- [Unigram language model](glossary://unigram-language-model)
- [Tokenizer artifact](glossary://tokenizer-artifact)
