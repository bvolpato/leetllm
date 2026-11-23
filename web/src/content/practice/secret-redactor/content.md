Redact bearer tokens, `sk-` keys, and email-shaped values from logs before they are stored. This <span data-glossary="secrets-management">secrets-management</span> exercise defines exact patterns for those three cases.

## Requirements

- Define `redact_secrets(text)`.
- Apply substitutions to the evolving text in this order: bearer token, `sk-` key, then email-shaped text. Matches are case-sensitive and may occur inside a larger string; no word boundaries are required.
- A bearer match starts with literal `Bearer`, one or more whitespace characters, then at least one non-whitespace character other than `,` or `;`. For this exercise whitespace is the Unicode White_Space set plus control characters U+001C through U+001F, matching Python `str.isspace()`. Replace the entire match with `Bearer <redacted>`, including normalizing its separator to one space. Commas and semicolons after the token remain; other punctuation belongs to the token body.
- A key match is literal `sk-` followed by at least eight ASCII letters, digits, `_`, or `-`. Replace the entire matching run with `sk-<redacted>`.
- Replace email-shaped matches of `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` with `<email>`. The pattern accepts email-shaped strings without validating mailbox or domain syntax. Surrounding angle brackets in the source (for example `Contact <me@example.com>`) are left in place, so the result may look like `Contact <<email>>`.
- Return the redacted string.
- Preserve other text unchanged.

## Example

The bearer pass consumes the email-shaped token as a whole. A separate email outside that token remains for the later email pass.

```python
assert redact_secrets("Authorization: Bearer abc123") == "Authorization: Bearer <redacted>"
assert redact_secrets("Bearer a@example.com; user=b@example.com") == "Bearer <redacted>; user=<email>"
assert redact_secrets("Bearer\txyz, next=true") == "Bearer <redacted>, next=true"
```

Order also affects overlapping key and email shapes. `sk-abcdefgh@example.com` becomes `sk-<redacted>@example.com`: the key pass changes the local part before the email pass sees it. Running the email pass first would instead produce `<email>`.

## Constraints

- Use the selected language's standard library only.
- Don't over-redact short strings like `sk-test`.
- Redaction should be deterministic.
- Other credential formats and secrets already written elsewhere remain sensitive. Production logging should avoid collecting secret fields before relying on pattern-based redaction.

## Reasoning about boundaries

`sk-1234567` stays unchanged, while `sk-12345678` is redacted. `bearer xyz` stays unchanged because the prefix is case-sensitive. `Bearer ,` also stays unchanged because there is no token body. In `Bearer xyz)`, the closing parenthesis is consumed with the token; this exercise recognizes comma and semicolon terminators, so other punctuation remains attached.

To extend this to streaming logs, consider a chunk ending in `sk-1234`: the next chunk may complete an eight-character key. A fixed-size overlap buffer reproduces whole-string redaction only when the patterns have a documented maximum match length. Define those limits or use a stateful scanner.
