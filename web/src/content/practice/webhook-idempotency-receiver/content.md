A provider may retry a delivery after a timeout, then send the same logical event under a new delivery ID. Distinguish the delivery retry from the repeated logical event so one event creates at most one run.

Implement `WebhookReceiver`, an in-memory <span data-glossary="webhook">webhook</span> receiver for provider events that may be retried. Correct <span data-glossary="idempotency">idempotency</span> distinguishes replaying the same delivery from receiving a different delivery for the same logical work.

## Requirements

- Constructor receives `allowed_repos`, a set of `"org/repo"` strings.
- `handle(provider, delivery_id, event)` returns a response dictionary.
- Check order per delivery: if `(provider, delivery_id)` was already handled, return the cached response immediately (even if the body changed). Otherwise validate fields, then repo policy, then logical run creation.
- A duplicate `(provider, delivery_id)` returns the original response (including `bad_request` and `blocked`).
- Events must contain non-empty `org`, `repo`, and `action` (empty strings count as missing).
- If `org`, `repo`, or `action` is missing or empty, return `{"status": "bad_request", "code": 400}` and cache that response under the delivery key (like any other response).
- If `"org/repo"` isn't allowed, return `{"status": "blocked", "code": 403}` and cache it under the delivery key.
- For allowed events, create exactly one run for each logical key.
- The logical identity is the structured tuple `(provider, "org/repo", action, number_text)`. Normalize `number_text` with `str(event.get("number") or "")`. Missing, null, numeric zero, and the empty string share the empty number; integer `7` and string `"7"` share the same number text. Colons inside fields must not merge different identities.
- Return `{"status": "created", "code": 202, "run_id": ...}` for new runs and `{"status": "duplicate", "code": 200, "run_id": ...}` for duplicate logical work.
- Return a fresh response dictionary on every call so callers can't alter cached responses. The allowlist is a constructor-time copy.

## Example

Track the two deduplication keys separately:

| Provider delivery | Logical event | Response | Side effect |
|---|---|---|---|
| `("github", "delivery-1")` | `("github", "cursor/app", "issue_comment", "7")` | `created` | Create `run-1`. |
| `("github", "delivery-1")` again | Same delivery, even with a changed body | Cached `created` | No new run. |
| `("github", "delivery-2")` | Same logical event | `duplicate` | Reuse `run-1`. |

The example below covers new work, logical duplication, and a cached validation failure:

```python title="webhook-receiver-examples.py"
receiver = WebhookReceiver({"cursor/app"})
event = {"org": "cursor", "repo": "app", "action": "issue_comment", "number": 7}

first = receiver.handle("github", "delivery-1", event)
second = receiver.handle("github", "delivery-2", event)

assert first["status"] == "created"
assert second["status"] == "duplicate"
assert first["run_id"] == second["run_id"]

assert receiver.handle("github", "d-bad", {"repo": "app", "action": "push"}) == {
    "status": "bad_request",
    "code": 400,
}
```

## Constraints

- Keep it in memory.
- Don't parse provider-specific payloads.
- Preserve deterministic run IDs: `run-1`, `run-2`, and so on.
- Scope delivery IDs by provider so different providers can't replay one another's cached response.
- Calls are sequential. Provider and delivery IDs are strings; present required fields are strings or null; org/repo strings are slash-free components. Numbers are integers, strings, or null. Don't strip field values.

A delivery retry and a repeated logical event take different branches. Reusing `delivery-1` returns its original `created` response. Using `delivery-2` with the same identity returns `duplicate`. Both responses preserve the single run, while reporting distinct outcomes.

Don't concatenate logical fields with `:`. Provider `a:cursor/app` plus action `push` and provider `a` plus action `cursor/app:push` would produce the same concatenated string for this repository. A tuple keeps them distinct.

This handler receives already normalized inputs. In an HTTP service, authenticate every request before consulting delivery caches. This in-memory check-then-create flow runs within one process and lasts for that process's lifetime. A production receiver needs transactional uniqueness and durable enqueueing, plus an authenticated request or signature to establish authenticity.
