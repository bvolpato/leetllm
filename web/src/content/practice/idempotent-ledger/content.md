# Idempotent Ledger

A payment request can succeed even if its response gets lost, leaving the client unsure whether to retry. Make a repeated request return its original recorded result without applying the deposit or withdrawal twice, and reject accidental reuse of an idempotency key with a different payload.

Implement an account ledger that applies deposits and withdrawals once per request ID. <span data-glossary="idempotency">Idempotency</span> means a retry with the same `(account_id, amount)` returns the first successful result without repeating its mutation, even when the account balance changes afterward.

## Requirements

- Define `Ledger`.
- `apply(request_id, account_id, amount)` applies `amount` to the account and returns the resulting balance.
- Positive amounts are deposits. Negative amounts are withdrawals.
- Amounts are integer units. A zero amount is a successful request and must also be recorded.
- Request IDs are unique across the ledger.
- A duplicate `request_id` with the same `(account_id, amount)` returns the originally recorded balance even if the account's current balance has changed; the retry never applies its mutation twice.
- If a duplicate `request_id` arrives with a different `account_id` or `amount`, raise `ValueError` (`IllegalArgumentException` in Java) without mutating any account balance.
- Only successful applications are recorded for idempotency. Failed overdrafts are not recorded, so a later retry with the same ID may succeed after the balance changes.
- Withdrawals that would make the balance negative raise `ValueError` (`IllegalArgumentException` in Java).
- `balance(account_id)` returns the current account balance, defaulting to zero.

## Example

```python
ledger = Ledger()
assert ledger.apply("d1", "acct", 100) == 100
assert ledger.apply("d1", "acct", 100) == 100
assert ledger.apply("w1", "acct", -30) == 70
assert ledger.apply("d1", "acct", 100) == 100  # original recorded result after later withdrawal
try:
    ledger.apply("d1", "other-acct", 100)
except ValueError:
    pass
assert ledger.balance("acct") == 70
assert ledger.balance("other-acct") == 0
```

## Constraints

- Use standard-library Python only.
- Keep all state in memory.
- Calls are sequential, and idempotency lasts for this ledger instance's lifetime. Restart recovery and concurrency are follow-ups.
- For the Java version, assume amounts and resulting balances fit signed 32-bit integers.
