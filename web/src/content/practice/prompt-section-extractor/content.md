Prompts sometimes arrive as a small marked-up document, with each section wrapped in its own delimiter lines. <span data-glossary="parsing">Parse</span> those sections while keeping incomplete input and stray text visible as errors.

## Requirements

- Define `extract_sections(text)`.
- While outside a section, a complete line `<<<name>>>` starts a section. Do not trim the line before recognizing a marker.
- A name is any nonempty text between the delimiters, preserved verbatim (including spaces). Names are case-sensitive; exact `END` is reserved as the closing marker. `<<<>>>` is not a valid opener.
- A section ends with a line exactly `<<<END>>>`.
- Return `{"sections": dict, "errors": list}`.
- Store section content without the delimiter lines.
- Join interior content lines with `"\n"`. The line that holds `<<<END>>>` is not part of the body (so a one-line body has no trailing newline). Blank lines before `END` are preserved as empty lines in the joined body.
- Duplicate section names should produce `duplicate:name`.
  On duplicates, keep the first completed section body and append
  `duplicate:<name>` while keeping the first stored value unchanged.
- Text outside sections that's not blank should produce `outside_text` (emit at most once for the whole parse).
- Unterminated sections should produce `unterminated:name` and must not store a partial body in `sections`.
- Inside a section, every line except the exact closing marker is content, including opener-looking lines. There is no nesting or escape syntax.
- An unmatched closing marker outside a section is nonblank outside text. A closing marker with extra spaces is ordinary content while a section is active.
- Emit errors in discovery order: a duplicate is discovered at its closing marker; an unterminated section is reported only at end of input. An unfinished duplicate adds `unterminated:name`, not another duplicate error.

## Example

A newline-separated prompt yields one completed section without its delimiter markers:

```python
text = "<<<system>>>\nBe brief.\n<<<END>>>\n"
assert extract_sections(text)["sections"] == {"system": "Be brief."}
```

Completed bodies survive later errors, and only completed duplicates count as duplicates:

```python
text = (
    "outside\n<<<a>>>\none\n<<<END>>>\n"
    "<<<a>>>\ntwo\n<<<END>>>\n"
    "<<<a>>>\npartial"
)
assert extract_sections(text) == {
    "sections": {"a": "one"},
    "errors": ["outside_text", "duplicate:a", "unterminated:a"],
}
```

The line `<<<nested>>>` within `a` would be part of its body, not a second section. Conversely, a literal body line equal to `<<<END>>>` cannot be represented in this format without adding an escaping rule in a follow-up.

## Constraints

- Use <span data-glossary="state-machine">explicit state tracking</span>.
- Input is a string with LF or CRLF line endings; returned bodies normalize separators to `"\n"`. Do not trim content-line spaces.
- Preserve internal newlines inside sections.
- Keep errors deterministic.
