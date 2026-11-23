---
title: SentencePiece
importance: 84
---
SentencePiece is an unsupervised tokenizer and detokenizer framework (Kudo and Richardson, EMNLP 2018) that trains [subword](glossary://subword-tokenization) models directly from raw text and packs normalization, vocabulary, segmentation, and id mapping into one self-contained model file. It implements [BPE](glossary://bpe) and a [Unigram language model](glossary://unigram-language-model) under the same API, without language-specific pre-tokenizers such as Moses, MeCab, or KyTea.

It is a **processing package** that bundles normalization, vocabulary, segmentation, and id mapping; BPE is one of its supported algorithms. T5, ALBERT, XLNet, Llama 1/2-style stacks, Mistral, and Gemma-family models use SentencePiece or compatible artifacts. Swapping the vocabulary can change segmentation and token ids, making them incompatible with the learned embedding rows.

## How it works

Four components, from the original paper:

| Component | Role |
|---|---|
| **Normalizer** | Maps Unicode into a chosen form (default NFKC-family rules compiled into the model) |
| **Trainer** | Learns pieces from raw sentences for a fixed `vocab_size` and `model_type` |
| **Encoder** | Normalizes input, segments it, maps pieces to integer ids |
| **Decoder** | Inverse of encode: ids or pieces back to the **normalized** text |

Training takes one-sentence-per-line raw text and writes a binary Protocol Buffer (`.model`) plus a human-readable `.vocab`. The `.model` carries vocabulary, piece scores, special-token ids, and the precompiled normalizer. Pin the runtime options and any wrapper's added-token or chat-template configuration too; those can affect the full tokenizer pipeline outside the base artifact.

Default training knobs that matter in production:

| Flag | Typical role |
|---|---|
| `model_type` | `unigram` (default), `bpe`, `word`, or `char` |
| `vocab_size` | Final vocabulary size, including specials (library default `8000`; LLMs commonly use 32k–256k+) |
| `character_coverage` | Fraction of corpus characters kept in the alphabet (default `0.9995`; use `1.0` for small alphabets) |
| `byte_fallback` | Spell missing characters as UTF-8 byte pieces instead of `<unk>` |
| `add_dummy_prefix` | Prepend meta-space so sentence-initial words match mid-sentence forms (default `true`) |
| `normalization_rule_name` | e.g. `nmt_nfkc` (default), `nfkc`, `identity` |

## Intuition

Classical NMT pipelines assumed whitespace-segmented words, then ran subword tools on those words. That fails for Chinese, Japanese, and Korean, and it breaks **lossless** detokenization: spaces between tokens are discarded, so `World.` and `World .` can collapse to the same pieces.

SentencePiece treats the input as a raw Unicode character stream. Whitespace is a first-class symbol, escaped as the meta mark `▁` (U+2581, lower one eighth block). Pieces can include that mark, so detokenization is language-independent:

```python
"".join(pieces).replace("▁", " ")
```

This join shows the whitespace idea, not a complete decoder: dummy prefixes, byte pieces, and special tokens need additional handling. Use the library's decoder. Shipping the model and matching runtime configuration supports stable train/serve parity.

## Formula

**Lossless tokenization** (Kudo and Richardson, 2018):

$$
\operatorname{Decode}(\operatorname{Encode}(\operatorname{Normalize}(t))) = \operatorname{Normalize}(t)
$$

Here Normalize means the human-readable normalized surface; the API's `sp.normalize` method returns an escaped representation. The identity also requires all normalized characters to be representable: `<unk>` replacement can lose text unless byte fallback or adequate coverage handles it. Default whitespace normalization trims edge spaces and collapses repeated spaces, so this path round-trips normalized text rather than original raw bytes.

For Unigram segmentation, a candidate split $x_1,\ldots,x_n$ scores as a product of piece probabilities:

$$
P(x_1,\ldots,x_n) = \prod_{i=1}^{n} p(x_i)
$$

Serve time usually takes the highest-probability segmentation (Viterbi). Training can sample alternate segmentations (**subword regularization**) so the LM sees multiple valid splits of the same string.

## Example

From the paper's command-line demo (Figure 1; a small model with `vocab_size=1000`). A production 32k+ model will split and number pieces differently, but the space-as-piece design is the same:

```text
Input:   Hello world.
Pieces:  ▁He  ll  o  ▁world  .
Ids:     151  88  21  887  6
Decode:  Hello world.
```

Spaces become `▁` *inside* pieces (`▁He`, `▁world`), not a separate discarded delimiter. With default normalization, `"  Hello   world.  "` decodes as `"Hello world."`. Preserving whitespace needs explicit normalization flags; the meta-space representation by itself does not preserve spaces removed before segmentation.

Operational sketch with the official Python API:

```python
import sentencepiece as spm

# Train from raw lines (no Moses / MeCab pre-tokenization).
spm.SentencePieceTrainer.train(
    input="corpus.txt",
    model_prefix="spm",
    vocab_size=32000,
    model_type="unigram",
    character_coverage=0.9995,
    byte_fallback=True,
)

sp = spm.SentencePieceProcessor(model_file="spm.model")
text = "Hello world."
pieces = sp.encode(text, out_type=str)
ids = sp.encode(text, out_type=int)
assert sp.decode(ids) == text  # when Normalize(text) == text under this model

# Unigram subword regularization (training-time sampling):
# sp.encode("New York", out_type=str, enable_sampling=True, alpha=0.1, nbest_size=-1)
```

If production loads a different `.model` (or a Hugging Face conversion that diverged on specials / normalizer), the same string maps to different ids. The embedding table then loads the wrong rows even when the human-readable text looks identical.


## Algorithm choice inside the same framework

| `model_type` | How pieces are learned | Encode-time behavior |
|---|---|---|
| `unigram` (default) | Large candidate set, EM + likelihood pruning | Best path or sampled paths |
| `bpe` | Grow merges by pair frequency | Deterministic merge playback |
| `char` | Characters as units | Small individual pieces, usually longer sequences than subwords |
| `word` | Space-split words | Only for whitespace languages; no true open vocab for CJK |

SentencePiece is **not** GPT-2 byte-level BPE. GPT-2-style tokenizers start from all 256 UTF-8 bytes and learn merges over bytes. Classic SentencePiece learns over Unicode characters (plus optional [byte fallback](glossary://byte-fallback) for the rest). Same coverage goal as byte-level BPE when `byte_fallback=true`; different when bytes enter the sequence.

## What fails in production

- **Wrong artifact.** Eval or serve uses a re-exported `tokenizer.json` or a sibling model's `.model`. Fix: pin hash of the exact file shipped with the [checkpoint](glossary://model-checkpoint).
- **Normalization drift.** Client NFC + model NFKC, or `identity` train vs `nmt_nfkc` serve. Token counts and ids diverge before the first layer.
- **`character_coverage` too low without byte fallback.** Rare CJK, emoji, or log glyphs become `<unk>` or disappear into `unk_surface`.
- **Dummy prefix and whitespace flags.** Changing `add_dummy_prefix` or `remove_extra_whitespaces` after training rewrites every sentence-initial piece.
- **Special id layout.** `<unk>`, `<s>`, `</s>`, `<pad>`, and chat control tokens must match the embedding rows the trainer and model used.
- **Counting with the wrong encoder.** Browser word count, another family tokenizer, or a "rough 4 chars/token" rule misestimates [context window](glossary://context-window) and billed tokens on CJK, code, and byte-fallback heavy strings.

Debug path: encode the exact production string to pieces and ids, decode back, and compare against a golden fixture stored with the model revision. Many "quality regressions" after a serving upgrade are tokenizer skew, not weight bugs.

## Trade-offs

- **Self-contained `.model`:** Strong reproducibility; harder to hand-edit merges than a plain merges.txt.
- **Raw-text training:** Multilingual and CJK-friendly; large corpora need `input_sentence_size`, threading, and careful sampling.
- **Unigram sampling:** Robustness during training; serve must freeze deterministic decode unless you intentionally sample.
- **Coverage vs size:** Higher `character_coverage` and larger `vocab_size` shorten sequences for rich scripts but grow the embedding matrix.
- **Byte fallback:** Full Unicode representability; rare glyphs can expand into 2–4 byte tokens each and burn context budget.

## Why it matters here

SentencePiece sits at the boundary between raw text and every downstream LLM cost: embedding rows, attention length, KV cache, streaming decode, and token-priced APIs. Curriculum lessons on multilingual models, open vocabulary, and checkpoint compatibility all assume this kind of artifact: one file that freezes normalizer + segmentation + ids. Treat it as part of the model, not a disposable preprocessing script.

## Related terms

- [BPE](glossary://bpe)
- [Unigram language model](glossary://unigram-language-model)
- [Subword tokenization](glossary://subword-tokenization)
- [Tokenizer artifact](glossary://tokenizer-artifact)
- [Byte fallback](glossary://byte-fallback)
