Validate model-proposed <span data-glossary="tool-calling">tool calls</span> against a small runtime schema. The model proposes arguments; the application must check names, required fields, and types before any tool executes. This exercise uses a flat custom schema: `required` and optional field maps use Python-like type names such as `str`. JSON Schema uses a different structure and type vocabulary.

## Requirements

- Define `validate_call(call, schemas)`.
- `schemas` maps tool name to a schema dict.
- Each schema has `required` and optional `optional` field maps.
- Treat a missing `args` field as an empty argument dictionary.
- Field type names can be `str`, `int`, `float`, `bool`, `list`, or `dict`.
- Return a list of error strings.
- Return `[]` when the call is valid.
- Reject unknown tools.
- Reject missing required fields.
- Reject extra fields not in required or optional maps.
- Reject wrong field types.

### Error string formats

Use these exact codes (tests match the strings):

| Case | Format | Notes |
|------|--------|--------|
| Unknown tool | `unknown_tool:{name}` | Only error returned (early return). |
| Missing required | `missing:{field}` | Required fields in schema map iteration order. |
| Extra field | `extra:{field}` | Lexicographically sorted. |
| Type mismatch | `type:{field}:{expected_type}` | Fields in required-then-optional schema order. |

Collect **all** applicable errors in category order: unknown (early return) → missing → extra → type.

A call can fail in multiple ways at once. For schema `{"required": {"query": "str", "limit": "int"}}` and arguments `{"limit": True, "debug": 1}`, the exact result is `["missing:query", "extra:debug", "type:limit:int"]`. Missing fields come first, extras are sorted, and type errors follow schema order.

### Type acceptance

- `int` values are accepted for `float` fields.
- `bool` is never accepted for `int` or `float` (even though `bool` subclasses `int` in Python).

## Example

These calls show valid arguments, a missing required value, and the unknown-tool early return:

```python
schemas = {"search": {"required": {"query": "str"}}}
assert validate_call({"name": "search", "args": {"query": "vector db"}}, schemas) == []

schemas = {"fetch": {"required": {"url": "str", "timeout": "float"}}}
assert validate_call({"name": "fetch", "args": {"url": "https://x"}}, schemas) == ["missing:timeout"]
assert validate_call({"name": "delete_all", "args": {}}, {}) == ["unknown_tool:delete_all"]
```

## Constraints

- Keep error order deterministic.
- `bool` isn't accepted for `int` or `float`.
- Don't execute the tool.
- Inputs are dictionaries: every call provides a string `name`, and when `args` is present it maps string field names to values.
- Schemas map `"required"` and optional `"optional"` sections to disjoint string field names and supported type names (`str`, `int`, `float`, `bool`, `list`, `dict`). Map insertion order defines schema order, and names are case-sensitive.
- Check containers only at the top level: any list satisfies `list`, and any dictionary satisfies `dict`, regardless of their contents. Do not coerce values: `"3"` and `3.0` fail an `int` field.

An absent optional field produces no error. A present optional field with `None` is a type error, because none of the supported types accepts `None`. Required fields with `None` are also present: report `type`, not `missing`.
