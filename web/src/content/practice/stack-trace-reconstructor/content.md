# Stack Trace Reconstructor

When a function calls another one, their elapsed times overlap. Reconstruct each function's exclusive time from a <span data-glossary="stack-trace">profiler event stream</span> without counting the child's work twice.

Implement `exclusive_time(logs)`. Each log line has the form:

```text
<timestamp> <function_name> <start|end>
```

Timestamps are integer <span data-glossary="time-monotonic">monotonic ticks</span>. `end` timestamps are exclusive: if the active function starts at `2` and ends at `5`, it ran for `3` ticks.

## Requirements

- Return a dictionary mapping function name to exclusive runtime.
- Support nested function calls with a stack.
- Support repeated calls to the same function.
- Recursive calls are valid; aggregate the exclusive time of every frame with the same function name.
- Preserve deterministic behavior for valid, sorted input.
- Raise `ValueError` for mismatched `end` events (empty stack or top name differs). The message must include the substring `"mismatched"`.
- Raise `ValueError` if any call is still open after the last log line. The message must include the substring `"unclosed"`.
- Raise `ValueError` for any event token other than `start` or `end`.

## Example

```python
logs = [
    "0 root start",
    "2 parse start",
    "5 parse end",
    "6 fetch start",
    "9 fetch end",
    "10 root end",
]

assert exclusive_time(logs) == {"root": 4, "parse": 3, "fetch": 3}
```

`root` runs during `[0, 2)`, `[5, 6)`, and `[9, 10)`: `2 + 1 + 1 = 4` ticks. While `parse` or `fetch` is on top of the stack, that child owns the elapsed interval. The intervals add to the root call's `10` ticks without double counting.

## Constraints

- Assume input is already sorted by timestamp.
- Logs describe one execution thread. Each line has exactly three whitespace-separated fields and an integer timestamp. Unknown event words and invalid nesting still require the errors above. For equal timestamps, preserve the supplied event order.
- Function names don't contain spaces.
- Zero-duration calls (`start` and `end` at the same timestamp) contribute `0` and still appear in the map.
- An empty log list returns `{}`.
- Idle gaps with an empty stack between sequential top-level calls attribute no exclusive time.
- Equal timestamps are valid; an ending child releases execution to its parent without adding an extra tick.
- Use standard-library Python only.
