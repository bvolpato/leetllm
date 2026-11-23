# Model Fallback Router

If a preferred model is unhealthy or lacks a required capability, another candidate may still handle the request. Use a clear <span data-glossary="routing-policy">routing policy</span> to choose the lowest-cost model that meets the request's capability, quota, and latency needs.

## Requirements

- Define `choose_model(request, candidates)`.
- `request` has `capabilities`, `tokens`, and an optional <span data-glossary="latency-budget">`max_latency_ms`</span>.
- Each candidate has `id`, `healthy`, `capabilities`, `remaining_tokens`, `latency_ms`, and `cost`.
- A candidate is eligible only if:
  - it's healthy,
  - it has every required capability,
  - it has enough remaining tokens,
  - it satisfies `max_latency_ms` when present.
- Choose the eligible candidate with lowest `cost`.
- Ties use lower `latency_ms`, then `id` alphabetically.
- Return the chosen model ID, or `None`.

## Example

The unhealthy primary is ineligible. Of the two healthy models, the lower-cost candidate wins even though another candidate is faster.

```python
request = {"capabilities": ["tool_use"], "tokens": 100}
models = [
    {"id": "primary", "healthy": False, "capabilities": ["tool_use"], "remaining_tokens": 500, "latency_ms": 10, "cost": 0},
    {"id": "fast", "healthy": True, "capabilities": ["tool_use"], "remaining_tokens": 500, "latency_ms": 20, "cost": 3},
    {"id": "cheap", "healthy": True, "capabilities": ["tool_use"], "remaining_tokens": 200, "latency_ms": 80, "cost": 1},
]
assert choose_model(request, models) == "cheap"
```

## Constraints

- Don't mutate candidates.
- Use deterministic tie-breaking.
- Missing `max_latency_ms` means no latency ceiling.
- Inputs contain all required fields. Capability names and model IDs are case-sensitive strings; IDs are unique. Token counts, latency, and cost are finite nonnegative numbers (token counts are integers).
- `max_latency_ms` may also be `None`, meaning no ceiling. A ceiling of `0` is an active limit, and equality at the token and latency thresholds is eligible.
- `tokens` is the total token count required for the request, and `cost` is the per-request cost metric used to rank candidates.
