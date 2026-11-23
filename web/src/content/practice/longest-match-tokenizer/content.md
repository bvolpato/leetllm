# Longest-match Tokenizer

Token vocabularies can contain overlapping choices, such as `"the"` and `"there"`. Implement `tokenize(text, vocab)` as a small <span data-glossary="tokenization">tokenizer</span> that makes the local choice explicit by selecting the longest matching <span data-glossary="token">token</span> at each character position.

The tokenizer makes a greedy local choice at each position. With vocabulary `{"ab", "abc", "cd"}`, the input `"abcd"` chooses `"abc"` and then fails at position `3`; it never revisits that choice to find the valid segmentation `["ab", "cd"]`.

## Requirements

- Return tokens in order.
- Ignore ASCII whitespace between tokens (space, tab, newline, carriage return, form feed, vertical tab). Python `str.isspace()` is also acceptable if it skips additional Unicode whitespace.
- Prefer longest match when multiple tokens match.
- Raise `ValueError` with the failing position when no token matches.
- Positions are zero-based Unicode code-point offsets in the original text, including skipped whitespace. Matching is exact and case-sensitive; don't normalize Unicode or casing. NUL (`\0`) is an ordinary character and can appear in a token.
- Raise `ValueError` if `vocab` contains an empty string.
- Avoid repeated full-string slicing in the hot loop.
- Skip whitespace before beginning each token search. Whitespace inside a matching vocabulary token remains literal: `tokenize("a b", {"a b", "a", "b"})` returns `["a b"]`.

## Example

At position `0`, both `the` and `there` match. Choosing `there` leaves `fore` as the next longest match.

```python
vocab = {"the", "there", "for", "fore"}
assert tokenize("therefore", vocab) == ["there", "fore"]
```

## Constraints

- Treat empty vocab entries as invalid input (raise), not as a match.
- Input text is small enough for a <span data-glossary="trie">trie</span> or length-sorted scan.
- Use standard-library Python only.
