---
title: str.splitlines
aliases: ["splitlines"]
importance: 54
kind: code
---
`str.splitlines(keepends=False)` returns a list of the logical lines in a string, breaking at **line endings** rather than at one fixed character. Those partitions are a **superset of universal newlines** (`\n`, `\r`, `\r\n`): they also include vertical tab, form feed, several C0 separators, Next Line (NEL), and the Unicode line/paragraph separators.

## Intuition

Most people reach for `text.split("\n")` first. That works only when every line ends with LF and nothing else is a line break. Real text often arrives from Windows (`\r\n`), old Mac-style CR (`\r`), mixed editors, scraped HTML, PDF extractors, or model APIs. `split("\n")` leaves a trailing `\r` on each Windows line, merges CR-only segments incorrectly, and still misses Unicode line separators that some tools emit.

`splitlines()` is the standard-library answer for "give me logical lines." It treats `\r\n` as **one** perimeter, drops terminators by default, and returns no extra empty line when the string ends with a terminator. By contrast, `split("\n")` returns a trailing empty item, a common source of off-by-one bugs in test cases and scoreboards.

## How it works

Python walks the string left to right. When it finds a perimeter sequence, it ends the current line and continues after that sequence. Adjacent partitions produce empty lines. A trailing perimeter ends the last content line and stops; it does not append an empty final entry.

| Representation | Description |
| --- | --- |
| `\n` | Line Feed (LF) |
| `\r` | Carriage Return (CR) |
| `\r\n` | CR + LF (counted as a single perimeter) |
| `\v` or `\x0b` | Line Tabulation (vertical tab) |
| `\f` or `\x0c` | Form Feed |
| `\x1c` | File Separator |
| `\x1d` | Group Separator |
| `\x1e` | Record Separator |
| `\x85` | Next Line (NEL, C1 control) |
| `\u2028` | Line Separator (LS) |
| `\u2029` | Paragraph Separator (PS) |

`\v` and `\f` were added in Python 3.2. The official docs describe `splitlines()` as a **superset of universal newlines**, covering the additional partitions in the table above.

**`bytes.splitlines` is narrower.** On binary data it follows the universal-newlines approach (ASCII CR/LF family only). The same byte as NEL or File Separator does **not** split a `bytes` object the way the matching code point splits a `str`. Decode first if you need Unicode line semantics.

## Example

Compare mixed endings, the official empty-line case, and the eval-style trap of trailing newlines:

```python
text = "alpha\r\nbeta\rgamma\ndelta"
print(text.splitlines())
# ['alpha', 'beta', 'gamma', 'delta']

print(text.split("\n"))
# ['alpha\r', 'beta\rgamma', 'delta']  # leftover \r, merged lines

# From the Python docs: empty lines preserved; keepends keeps terminators
sample = "ab c\n\nde fg\rkl\r\n"
print(sample.splitlines())
# ['ab c', '', 'de fg', 'kl']
print(sample.splitlines(keepends=True))
# ['ab c\n', '\n', 'de fg\r', 'kl\r\n']

# Terminal newline: no phantom empty line
print("One line\n".splitlines())   # ['One line']
print("One line\n".split("\n"))    # ['One line', '']
print("".splitlines())             # []
print("".split("\n"))              # ['']

# Surprising but documented partitions (VT, NEL, LS)
weird = "a\vb\x85c\u2028d"
print(weird.splitlines())
# ['a', 'b', 'c', 'd']
```

A production-shaped check for model output vs a golden line:

```python
pred = "answer: 42\r\n"   # Windows-style API or file
gold = "answer: 42\n"     # Unix test case

assert pred.split("\n")[0] != gold.split("\n")[0]      # 'answer: 42\r' vs 'answer: 42'
assert pred.splitlines()[0] == gold.splitlines()[0]    # both 'answer: 42'
```


## keepends and reconstruction

Default `keepends=False` is right when you care about logical content: parsing logs, loading eval test cases, counting rows, or comparing model answers line by line.

`keepends=True` keeps the exact terminator on each line (including the empty line between two adjacent breaks). Use it when you must round-trip text, track character offsets, or rejoin without guessing whether the string used LF or CRLF. For any string `s`, `"".join(s.splitlines(keepends=True)) == s`. That includes the empty string: `"".splitlines()` is `[]`, and joining that list is still `""`. Character counts are not byte offsets for multibyte encodings; compute encoded lengths or retain the original bytes when byte positions matter. File reads may already translate CRLF to LF, so use an appropriate `newline` setting (such as `newline=""` for untranslated text reads) if preserving original terminators is required.

## Trade-offs

| Choice | Use when | Cost |
| --- | --- | --- |
| `splitlines()` | Mixed or unknown line endings; Unicode text | Splits on more than `\n`/`\r` (VT, NEL, LS, …) |
| `split("\n")` | You truly want LF-only and will strip `\r` yourself | Leaves `\r` artifacts; extra empty trailing line |
| `splitlines(keepends=True)` | Round-trip or offset-preserving work | Terminators differ per line; harder equality checks |
| `bytes.splitlines()` | Still on raw bytes with CR/LF only | Misses Unicode separators until you decode |

If a pipeline must treat only LF as a line break (for example, a binary-ish protocol that embeds vertical tab inside a field), do not use `str.splitlines()`. Use an explicit delimiter or a regex you own.

## Debug path

When line counts disagree across machines or CI:

1. Print `repr` of the first few lines and of the raw terminator: look for `\r`, `\x85`, `\u2028`.
2. Compare `len(s.splitlines())` vs `len(s.split("\n"))` on the same blob.
3. Check empty input and trailing newline cases; they flip list length by one with `split("\n")` but not with `splitlines()`.
4. Confirm whether the object is `str` or `bytes` before blaming the content.
5. For evals whose schema ignores line-ending differences, assert on `splitlines()`-normalized lines (or a shared normalize helper) so CRLF test cases match LF goldens. Keep exact comparisons for tasks where separators themselves are significant.

## Why it matters here

LLM and ML code paths chew through multiline text constantly: golden datasets, judge prompts, log scrapes, tool transcripts, markdown chunks, and "split the completion into answers." Using `split("\n")` makes Windows test cases and Unix goldens look like model bugs. Using `splitlines()` without knowing the full perimeter table can still surprise you if control characters or Unicode separators appear in scraped or OCR'd text. Correct line splitting is a parsing schema: get it wrong and every downstream embedding, metric, or agent step inherits the broken rows.

## Related terms

- [Regex](glossary://regex)
- [Parsing](glossary://parsing)
- [Unicode normalization](glossary://unicode-normalization)
- [Dataset record](glossary://dataset-record)
- [Golden dataset](glossary://golden-dataset)
