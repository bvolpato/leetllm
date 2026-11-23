When a conversation is longer than the model's <span data-glossary="context-window">context window</span>, some messages have to wait outside the request. Choose what fits within the supplied <span data-glossary="token-budget">token budget</span> while keeping the returned conversation in order.

## Requirements

- Define `pack_messages(messages, max_tokens)`.
- Each message is a dict with `id`, `role`, and `tokens`.
- Return the selected message IDs in original order.
- Keep the first system message if it fits.
- Ignore every later system message, even when the first system message exceeds the <span data-glossary="token-budget">token budget</span>.
- Fill the remaining budget by scanning every non-system message from newest to oldest, continuing past messages that do not fit.
- Skip any message that doesn't fit and keep scanning older ones.
- Never exceed `max_tokens`.

## Example

```python
messages = [
    {"id": "sys", "role": "system", "tokens": 2},
    {"id": "old", "role": "user", "tokens": 3},
    {"id": "new", "role": "assistant", "tokens": 4},
]
assert pack_messages(messages, 6) == ["sys", "new"]

messages = [
    {"id": "older", "role": "user", "tokens": 2},
    {"id": "oversized", "role": "assistant", "tokens": 8},
    {"id": "newest", "role": "user", "tokens": 2},
]
assert pack_messages(messages, 4) == ["older", "newest"]
```

## Constraints

- Preserve conversation order in the returned IDs.
- Prefer recency for non-system messages.
- Don't mutate the input messages.
- `max_tokens` and each `tokens` count are nonnegative integers. Zero-token messages fit even when the remaining budget is zero. IDs are unique strings; roles are `system`, `user`, `assistant`, or `tool`.
- Token counts are supplied costs, including any overhead the caller wants counted. You don't need a tokenizer. This exercise selects individual messages, so an assistant reply or tool result may survive without its earlier context; preserving dependent groups is a follow-up.
