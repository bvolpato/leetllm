# Log Error Parser

When you're scanning an application log after a failure, repeated messages should rise to the top while continuation text stays attached to its context. Implement `top_errors(log_text, limit=3)` to surface the most frequent error messages.

## Requirements

- Input is one string containing newline-separated log lines.
- Count only lines that contain `" ERROR "`.
- The error key is the entire suffix after the first `" ERROR "` marker, including any later occurrences.
- Strip leading and trailing whitespace from the extracted message.
- Exclude empty messages, including whitespace-only messages after stripping.
- Ignore indented continuation lines for counting.
- Return a list of `(message, count)` pairs.
- Sort by count descending, then message ascending.
- Return at most `limit` rows.
- If `limit <= 0`, return an empty list.

## Example

The repeated timeout must rank first. The one-count message follows it.

```python
log_text = '''
2026-01-01 INFO start
2026-01-01 ERROR timeout
2026-01-01 ERROR bad gateway
2026-01-01 ERROR timeout
'''

assert top_errors(log_text, limit=2) == [("timeout", 2), ("bad gateway", 1)]
```

## Constraints

- Use standard-library Python only.
- Prefer <span data-glossary="splitlines">`splitlines`</span>, <span data-glossary="counter">`Counter`</span>, or an explicit <span data-glossary="state-machine">state machine</span>.
- `limit` is an integer. Messages are case-sensitive; preserve internal whitespace. Only trim the ends.
- A line is indented when its first character is whitespace. Ignore it even if it contains the marker. Accept LF and CRLF line endings.

The marker uses literal ASCII spaces and uppercase `ERROR`: `"t\tERROR\tfailed"` does not count. This exercise matches a delimiter anywhere on an unindented line. Timestamp validation and structured severity parsing fall outside its scope.
