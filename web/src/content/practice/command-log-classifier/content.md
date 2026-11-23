After an agent finishes, its logs may mix successful commands, failures, and warnings. Build a compact summary that helps a reader spot the first failed command while keeping useful output in order.

Implement `classify_command_log(events)` for <span data-glossary="shell">shell commands</span> from an agent run.

## Requirements

- Each event is a dictionary with `cmd`, `exit_code`, and optional `stdout` / `stderr` (missing streams are empty).
- Return a dictionary with `status`, `total`, `failed`, `first_failure_cmd`, and `redacted_logs`.
- `status` is `"passed"` when no command failed, otherwise `"failed"`.
- A command fails when `exit_code != 0`.
- Exit code determines command status; `stderr` warnings remain visible in `redacted_logs` even when the command succeeds.
- `first_failure_cmd` is the first failing command, or `None`.
- `redacted_logs` is a list of strings built from `stdout` then `stderr` for each event in order.
- Split each stream with newline rules equivalent to <span data-glossary="splitlines">`str.splitlines()`</span>; emit one entry per resulting line (including blank internal lines).
- Each entry uses the format `"{stream}: {line}"` (for example `"stdout: one"`, `"stderr: err [REDACTED]"`). Empty or missing streams contribute no entries.
- Redact secret tokens matching the <span data-glossary="regex">regex</span> `sk-[A-Za-z0-9_-]+` by replacing each match with `[REDACTED]` (token-level replace, not whole-line wipe).

Assume well-formed input: `cmd` is a string, `exit_code` is an integer, and present output streams are strings. Empty input is passed with zero counts, no first failure, and no logs. Negative exit codes count as failures too.

The redaction rule applies to stdout/stderr entries; `first_failure_cmd` is copied unchanged. The narrow regex covers matching tokens only, so production log handling still needs a policy for other credentials and sensitive output. Matching is case-sensitive and can occur anywhere in a line; `sk-` alone doesn't match because the suffix needs at least one allowed character.

The supplied event order and stdout-before-stderr order define the result. Separate captured streams don't reveal their original chronological interleaving.

## Example

```python
events = [
    {"cmd": "pytest", "exit_code": 1, "stdout": "", "stderr": "failed"},
    {"cmd": "print", "exit_code": 0, "stdout": "sk-live", "stderr": "err sk-test_2"},
]
summary = classify_command_log(events)
assert summary["status"] == "failed"
assert summary["total"] == 2
assert summary["failed"] == 1
assert summary["first_failure_cmd"] == "pytest"
assert summary["redacted_logs"] == [
    "stderr: failed",
    "stdout: [REDACTED]",
    "stderr: err [REDACTED]",
]
```

Line separators are removed, internal blank lines remain, and a terminal separator doesn't create an extra trailing entry. For example, stdout `"one\r\n\r\ntwo\n"` produces `"stdout: one"`, `"stdout: "`, `"stdout: two"`. A stream containing just `"\n"` produces one blank entry; an empty stream produces none.

## Constraints

- Preserve log line order.
- Leave inputs untouched.
