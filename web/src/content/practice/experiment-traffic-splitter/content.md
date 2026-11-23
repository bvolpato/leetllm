# Experiment Traffic Splitter

If a user returns to the same experiment, the assigned variant should stay the same for the same experiment key, ordered variants, and weights. Use <span data-glossary="traffic-split">weighted experiment variants</span> with <span data-glossary="stable-assignment">stable deterministic bucketing</span>.

## Requirements

- Define `assign_variant(user_id, experiment_key, variants)`.
- `variants` is a list of `(name, weight)` tuples.
- Names, user IDs, and experiment keys are strings, and weights are integers.
- Ignore variants with non-positive weight (`weight <= 0`); only `weight > 0` contributes to ranges.
- Use this exact stable bucket:
  - `key = f"{experiment_key}:{user_id}"`
  - `bucket = sum((index + 1) * ord(char) for index, char in enumerate(key)) % total`
  - where `total` is the sum of positive weights
- Iterate Unicode code points, not UTF-16 code units. In Java, advance with `codePointAt` and `Character.charCount` so emoji receive the same bucket as Python.
- Map `bucket` onto cumulative weight ranges in input order: walk variants left to right, accumulate weight, and return the first name where `bucket < cursor`.
- Return the selected variant name.
- Return `None` if total positive weight is `0`.
- Changing `experiment_key` can change assignment.
- Calling the function repeatedly with the same inputs must return the same variant.
- Stability applies to identical keys, ordered variants, and weights. Reordering variants or changing weights can reassign users.

## Example

```python
assert assign_variant("u1", "exp", [("control", 50), ("treatment", 50)]) in {"control", "treatment"}
# With the required bucket formula:
assert assign_variant("alice", "ranking", [("a", 1), ("b", 3), ("c", 6)]) == "c"
assert assign_variant("same-user", "exp-a", [("a", 2), ("b", 2), ("c", 2)]) == "b"
assert assign_variant("anyone", "exp", [("disabled", -1), ("enabled", 1)]) == "enabled"
```

## Constraints

- Don't use Python's built-in `hash`, because it's process-randomized.
- Don't use randomness.
- Preserve variant order for bucket ranges.

Production assignment services typically replace weighted character sums and raw colon concatenation with length-prefixed keys and uniform hashes such as MurmurHash3 or SHA-256; use the exact polynomial formula above here so bucket indices match the test vectors.
