Streamed responses arrive piece by piece, and updates for different messages can interleave. Assemble each message independently, then return its complete text when its final event arrives.

## Requirements

- Define `TokenAssembler` with instance state for partial parts and finalized IDs.
- `apply(event)` processes one event dict.
- Each event has `id`, optional `delta`, and optional `final` (`final` is a boolean; treat missing as false).
- Append `delta` text to that message ID when the key is present (including empty-string deltas).
- If `final` is true, mark the message complete and return its full text.
- If not final, return `None`.
- `get(message_id)` returns current assembled text or `None`.
- Ignore deltas for IDs already finalized.
- If `final` is true on an already-finalized id, ignore any new delta and still return the completed text (<span data-glossary="idempotency">idempotent</span> finalize).
- Non-final `apply` after finalize returns `None`, leaving text unchanged.
- Well-formed events are assumed: required `id` present; `delta` is a string when present.
- IDs are strings, and events arrive in the correct order within each message. Every event creates that message's state, even without a delta; its current text is initially `""`. Finalizing an unseen ID returns `""`.

This is text assembly after transport parsing and text decoding. A delta can contain any number of characters and split a word, independent of tokenizer token boundaries. Repeated non-final events append again. Only finalization is idempotent; detecting duplicate deliveries would need an event sequence number or offset.

## Example

```python
a = TokenAssembler()
assert a.apply({"id": "m", "delta": "hel"}) is None
assert a.apply({"id": "m", "delta": "lo", "final": True}) == "hello"
assert a.apply({"id": "m", "delta": "ignored", "final": True}) == "hello"
assert a.apply({"id": "empty", "final": True}) == ""
assert a.get("empty") == ""
assert a.get("unseen") is None
```

## Constraints

- Support interleaved message IDs.
- Don't drop empty-string deltas.
- Finalizing twice should be idempotent.
- Joining buffered parts on every `get()` rereads the assembled message. Cache completed text to avoid repeated joins after finalization; reads during streaming can still make total work quadratic.
