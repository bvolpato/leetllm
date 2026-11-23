---
title: Tokenizer artifact
importance: 86
---
A **tokenizer artifact** is the versioned bundle of files and rules that turns text into the integer token IDs a language model was trained to consume and generated IDs back into text. A complete artifact pins normalization, pre-tokenization, the subword model (merges, scores, or trie), special-token strings and IDs, post-processing (BOS/EOS/pad placement), the decoder, and often the [chat template](glossary://chat-template). Together these pieces define the checkpoint's deterministic encoding and decoding schema. Normalization can erase distinctions, special tokens can be handled asymmetrically, and multiple ID sequences can decode to the same text, so encoding and decoding are not always inverses. Changing any piece can map the same characters to different embedding rows.

ID $k$ refers to row $k$ of a particular model's embedding table under its tokenizer artifact. Version the tokenizer with the [model checkpoint](glossary://model-checkpoint) as part of one schema.

## Intuition

The model never sees words. At every position it loads a vector:

$$
\mathbf{e}_t = E[x_t] \in \mathbb{R}^{d}
$$

where $x_t \in \{0,\ldots,|\mathcal{V}|-1\}$ is a token ID and $E \in \mathbb{R}^{|\mathcal{V}| \times d}$ is the learned embedding matrix (and the output head usually shares the same vocabulary axis). The artifact is the only map from human text to those indices. Two artifacts can share vocabulary *size* and still disagree on which string owns which row. Same visible prompt, different sequence of rows, different attention patterns, different next-token distribution.

The tokenizer-to-embedding-row mapping is exact. A "similar" artifact that assigns different IDs selects different learned rows and is therefore incompatible with the checkpoint.

## What's in the bundle

In Hugging Face Transformers-style packages (`save_pretrained` / Hub model dirs), you typically see:

| File | Role |
|---|---|
| `tokenizer.json` | Full fast tokenizer: normalizer, pre-tokenizer, model (BPE/Unigram/WordPiece), vocab, merges or scores, decoder, added tokens |
| `tokenizer_config.json` | Class name, special-token config, chat template (or pointer), max length, padding side, and other load metadata |
| `special_tokens_map.json` | Named special tokens (`bos`, `eos`, `pad`, `unk`, extras) as strings |
| `vocab.json` / `merges.txt` or `tokenizer.model` | Legacy or backend-specific vocab and merge / SentencePiece model |
| Chat template | Jinja (or config field) that serializes multi-turn messages before encoding |

Other packaging forms still carry the same schema:

- **SentencePiece**: a `.model` (and often `.vocab`) with normalization, segmentation algorithm, and scores.
- **tiktoken / OpenAI-style**: rank tables and special-token maps shipped with the model family.
- **GGUF**: tokenizer vocab, scores, and token types embedded in the single-file (or sharded) container so `llama.cpp` and friends can encode without a separate HF folder.

Architecture and trained parameters can be separated conceptually (normalizer vs learned merges), but for a *deployed* model they must ship as one revisioned unit with the weights.

## How it works

Encoding is a fixed pipeline. For chat, first serialize messages with the checkpoint's chat template, then tokenize that text. Serving must replay the same stages the checkpoint was trained with:

1. **Normalize** Unicode and surface form (case, accents, whitespace cleanup, NFC/NFKC policy).
2. **Pre-tokenize** into preliminary chunks (spaces, punctuation, regex splits).
3. **Model** applies BPE merges in rank order, Unigram segmentation, or WordPiece longest-match to produce pieces.
4. **Map** each piece to an integer ID via the vocabulary (plus added / special tokens).
5. **Post-process** inserts configured special tokens; batching may add padding. Chat templates usually already include their control tokens, so avoid adding them again when separately tokenizing templated text ([Transformers guidance](https://huggingface.co/docs/transformers/main/en/chat_templating)).
6. **Decode** reverses IDs to text with the artifact's decoder (byte fallback, metaspace `▁`, space rules).

Formally, for text $s$:

$$
\operatorname{encode}_A(s) = (x_1,\ldots,x_T), \quad x_t \in \{0,\ldots,|\mathcal{V}_A|-1\}
$$

For compatible artifacts, $\operatorname{encode}_A$ and $\operatorname{encode}_B$ produce identical IDs for the strings you care about. Detokenization should round-trip under the same artifact:

$$
\operatorname{decode}_A(\operatorname{encode}_A(s)) \approx s
$$

(exact equality depends on normalization and special-token stripping). Train, eval, and serve must share $A$.

## Example

Different artifacts assign different IDs to the same glyphs (public GPT-2 / Hugging Face docs examples):

| Artifact | Probe | Pieces | IDs |
|---|---|---|---|
| GPT-2 | `Hello` | `Hello` | `15496` |
| GPT-2 | `Hello world` | `Hello`, `Ġworld` | `15496`, `995` |
| SmolLM3-3B (HF docs) | `Hello world` | `Hello`, `Ġworld` | `9906`, `1917` |

`Ġ` marks a leading space in many BPE vocabularies. **The same glyphs can land on different rows.** If you load model weights trained under artifact A and encode with artifact B:

- `Hello` is $15496$ under GPT-2 and $9906$ under SmolLM3; ` world` is $995$ vs $1917$.
- The model still indexes $E[15496]$ or $E[9906]$ as if nothing is wrong.
- There is no runtime error when IDs stay inside $|\mathcal{V}|$. You get fluent-looking nonsense, broken tool JSON, or a silent eval cliff.

A second concrete failure: you add domain tokens (`<MODEL_ID>`, `<TOOL_CALL>`) with `tokenizer.add_tokens`, call `model.resize_token_embeddings(len(tokenizer))`, train, then ship **only** the weight file. Serving loads the base vocab. New IDs are missing or remapped; special strings fall back to multi-piece splits; chat or tool markers no longer match training. Or the reverse: serving sees a larger `len(tokenizer)` than `config.vocab_size` and embedding load fails with a size mismatch.

```python
# Pin artifact + weights from the same revision.
from transformers import AutoTokenizer, AutoModelForCausalLM

rev = "abc123"  # Hub commit, not a floating branch name
tok = AutoTokenizer.from_pretrained("org/model", revision=rev)
model = AutoModelForCausalLM.from_pretrained("org/model", revision=rev)

# Smoke-check The schema before blaming the model.
probe = "Hello world"
ids = tok.encode(probe, add_special_tokens=False)
assert tok.decode(ids) == probe  # round-trip under this artifact
assert model.get_input_embeddings().weight.shape[0] >= max(ids) + 1
```

Before comparing two deploys, hash the tokenizer files (or Hub revision) and freeze expected IDs for a small test case set: plain English, leading-space variants, code identifiers, CJK or emoji (byte-fallback paths), and one tool-call or chat turn.

## Debug path

When quality drops after a "harmless" serving or conversion change:

1. **Identity.** Confirm tokenizer files and weights share one revision (content hash, Hub commit, GGUF source tag).
2. **Vocab size.** Compare `len(tokenizer)`, `config.vocab_size`, and embedding rows. Padding the matrix to a multiple of 8 or 16 is common; IDs above the true vocab still break decoding.
3. **Probe strings.** Encode fixed test cases; print pieces and IDs. Diff against a golden log from training or the vendor API path.
4. **Template and specials.** Check BOS/EOS/pad IDs, chat template string, and stop sequences. Template drift often looks like "the model got worse" with identical weights.
5. **Conversion.** After GGUF / ONNX / engine export, re-encode the same test cases with the runtime tokenizer. Old GGUF builds and unrecognized pre-tokenizers have produced HF-vs-engine ID skew without a loud failure.
6. **Unicode path.** Confirm client and server use the same [Unicode normalization](glossary://unicode-normalization) before encode. NFC vs NFKC changes bytes and IDs for visually identical text.

```text
raw text
  -> normalize (artifact policy)
  -> pre-tokenize
  -> subword model + vocab IDs
  -> configured special tokens (chat template applied before encode)
  -> embedding lookup + generation
  -> decode with the same artifact
```

If any stage diverges between train and serve, the model is no longer reading the same language.

## Why it matters here

Tokenizer artifacts explain why preprocessing is part of model identity. They sit between product strings and every token-priced, length-limited, or cache-keyed path:

- **Checkpoint compatibility.** Fine-tunes, adapters, and eval harnesses must load the tokenizer that produced training IDs.
- **Serving reliability.** Silent ID skew produces repetition, broken tool-call formatting, shifted refusals, and multilingual collapse without CUDA errors.
- **Budgets.** Use this artifact for token counts used by context, [KV cache](glossary://kv-cache), and billing. Word counts provide only rough estimates.
- **Packaging.** A weight file without its tokenizer is an incomplete package. Pin files, special-token IDs, BOS/EOS/pad behavior, byte fallback, Unicode policy, chat template, and serving config together.

## Related terms

- [Tokenization](glossary://tokenization)
- [BPE](glossary://bpe)
- [Byte fallback](glossary://byte-fallback)
- [Model checkpoint](glossary://model-checkpoint)
- [Chat template](glossary://chat-template)
