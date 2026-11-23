An editor may need to insert one note and replace two distant spans in the same file. Apply those edits against the original text so an earlier replacement can't shift the later offsets.

Implement `apply_edits(text, edits)` for non-overlapping changes.

## Requirements

- Each edit is `(start, end, replacement)` using half-open indexes from the selected language's string type. Python uses code-point indexes; Java `String` uses UTF-16 code-unit indexes.
- <span data-glossary="validation-gate">Validate all edits</span> before changing the text.
- Raise `ValueError` for negative indexes, `end < start`, indexes past the text length, and overlapping edits.
- For overlapping edits, the `ValueError` message must include the substring `"overlap"` (case-sensitive).
- Adjacent edits are allowed because half-open ranges touching at an endpoint remain non-overlapping.
- Multiple empty inserts at the same index are allowed. Preserve their input order so earlier inserts appear left-to-right in the result.
- Edits may arrive unsorted.
- All offsets refer to the original input text, so each edit keeps its coordinates when edits are applied together.
- An empty insert strictly inside a nonempty edit's range is a conflict and must raise an overlap error. Inserts at either endpoint are allowed. At a replacement's start, insert text appears before its replacement; at its end, it appears after.
- Apply all edits atomically and return the new text.

## Example

Replace the half-open interval `[6, 11)`, which covers `world`. The same original-coordinate rule supports edits at both ends, ordered inserts and Unicode:

```python
assert apply_edits("hello world", [(6, 11, "Cursor")]) == "hello Cursor"
assert apply_edits("abcdef", [(0, 1, "A"), (5, 6, "F")]) == "AbcdeF"
assert apply_edits("x", [(0, 0, "A"), (0, 0, "B")]) == "ABx"
assert apply_edits("a🙂c", [(1, 2, "b")]) == "abc"  # Python counts the emoji once
```

## Keep original coordinates stable

For `"abcdef"`, edits `[(1, 3, "LONG"), (4, 6, "!")]` replace `bc` and `ef`. The result is `"aLONGd!"`. If you apply the first edit and then interpret `[4, 6)` against the changed string, you'll replace the wrong characters. A piece builder reads unchanged slices from the original text and appends replacements once.

Boundary inserts have an explicit ordering rule. Applying `[(1, 2, "R"), (1, 1, "L"), (2, 2, "E")]` to `"abc"` returns `"aLREc"`. Inserting at index 2 inside replacement `[1, 3)` is rejected instead. Although an empty mathematical interval contains no characters, this API treats an interior insertion as an ambiguous edit conflict.

Python's `[1, 2)` covers the whole emoji in `"a🙂c"`; Java needs `[1, 3)` for that emoji because it occupies two UTF-16 units. These offsets count code points or UTF-16 units, while a user-visible grapheme such as a letter plus a combining accent can span multiple units. Use the language-specific offsets in this exercise.

## Constraints

- Use the selected language's native string indexes: Python code points or Java `String` UTF-16 code units.
- Don't mutate the input.
- Don't silently skip invalid edits.
