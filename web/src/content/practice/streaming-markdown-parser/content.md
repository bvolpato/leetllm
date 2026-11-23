# Streaming Markdown Parser

As a Markdown preview updates, a chunk can end in the middle of the backticks that mark code. Build a small <span data-glossary="parsing">parser</span> that keeps the stream in order and identifies plain text, inline code, and fenced code.

Implement `parse_markdown_chunks(chunks)`.

## Requirements

- Input is a list of string chunks.
- Return a list of `(kind, value)` tokens.
- Token kinds are `"text"`, `"inline_code"`, and `"fenced_code"`.
- Single backticks toggle inline code unless the parser is inside a fenced code block.
- At each position, consume three consecutive backticks before considering a single backtick. A triple closes fenced code if already inside it; otherwise it opens fenced code, including from inline code. Flush the current nonempty token before changing modes. Longer runs are consumed left to right in groups of three, then as individual backticks.
- Opening fence language label is part of fenced content (no separate metadata field).
- Delimiters may be split across chunks.
- Preserve text order and flush the final token at end of stream (unclosed inline becomes `inline_code`; unclosed fence becomes `fenced_code`).
- Exclude empty-valued tokens.

## Example

```python
fence = chr(96) * 3
chunks = ["Use `he", "apq` and " + fence + "py", "thon\nprint(1)\n" + fence + " now"]
assert parse_markdown_chunks(chunks) == [
    ("text", "Use "),
    ("inline_code", "heapq"),
    ("text", " and "),
    ("fenced_code", "python\nprint(1)\n"),
    ("text", " now"),
]
```

## Constraints

- Handle only backtick inline code and fenced code blocks.
- Don't render HTML.
- Don't use a Markdown library.
- This deliberately isn't a complete CommonMark parser: it doesn't validate fence placement, escape sequences, or untrusted HTML.
- The base API receives the entire chunk list and returns tokens after the stream ends. Joining chunks before scanning is allowed; retaining bounded state across `feed()` calls is a follow-up.
