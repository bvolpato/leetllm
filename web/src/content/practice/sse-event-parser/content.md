# SSE Event Parser

When an API streams updates, a chunk can end halfway through a line, and one event can carry several data lines. Parse <span data-glossary="server-sent-events">server-sent event (SSE)</span> chunks into complete payloads without mistaking chunk boundaries for event boundaries.

## Requirements

- Define `parse_sse_events(chunks)`.
- `chunks` is a list of already-decoded strings from a streaming response, possibly including empty chunks.
- Events are separated by a blank line.
- Lines may end with LF or CRLF; strip a trailing `\r` from each completed line before field handling.
- Lines beginning with `data:` add payload text. After the colon, if the next character is a single space, remove that one space and keep any further spaces (WHATWG SSE rule).
- Multiple `data:` lines in one event join with `\n`.
- An event with `data:` but no payload emits `""`. A block with no `data:` lines emits nothing.
- Lines beginning with `:` are comments and should be ignored.
- Ignore other fields such as `event:` and `id:`.
- Return a list of completed event data strings.
- Ignore an incomplete final event without a trailing blank line.

## Example

```python
chunks = ["data: hello\n", "data: world\n\n"]
assert parse_sse_events(chunks) == ["hello\nworld"]
```

## Constraints

- Chunk boundaries may split lines anywhere.
- CRLF may split between chunks; it must still count as one line ending.
- Use an explicit <span data-glossary="state-machine">state machine</span> or careful line buffering.
- Don't require network or async code.
- This parser handles the SSE subset listed above. Bare CR endings, a leading byte order mark, and colonless `data` fields follow the broader [WHATWG standard](https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation). Production clients also need incremental UTF-8 decoding, event IDs, reconnect handling, and bounded buffering.
