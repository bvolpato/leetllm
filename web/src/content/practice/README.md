# Practice Problem Authoring

Practice problems live in `web/src/content/practice/{slug}` with `content.md` and `metadata.json`.

## Create A Problem

Use the scaffold command from `web/`:

```bash
pnpm practice:new repo-window-diff --title "Repo Window Diff" --category "Repository Systems" --difficulty Medium
```

It creates:

```text
src/content/practice/repo-window-diff/content.md
src/content/practice/repo-window-diff/metadata.json
```

Generated metadata includes three sample tests, five hidden tests, Python starter code, Python solution guide, Java starter code, Java tests, and Java solution guide. Edit those fields in one file, then run `pnpm practice:validate`.

## Test Case Shape

Use direct `input` + `expected` pairs by default. They are the shortest format
to author, read, and troubleshoot. The runner evaluates `input` and compares
the returned value with `expected` using `==`.

```json
{
  "name": "public reports removals",
  "visibility": "sample",
  "description": "A path present only in the old snapshot should be emitted as a removal.",
  "setup": [
    "from solution import diff_repositories"
  ],
  "input": "diff_repositories({\"a.txt\": \"1\", \"b.txt\": \"2\"}, {\"b.txt\": \"2\"})",
  "expected": "[(\"REMOVED\", \"a.txt\")]",
  "feedback": "A path missing from the new snapshot is removed, not modified."
}
```

Direct pairs support optional fields:

- `setup`: imports, object construction, fixtures, or common state
- `expression`: evaluated expression when learner-facing `input` is a longer operation sequence
- `expectedExpression`: executable expected value when learner-facing `expected` uses display-only formatting
- `operator`: `==` by default; Python also supports `!=`, `<`, `<=`, `>`, `>=`, `is`, `is not`, `in`, and `not in`
- `before`: statement(s) run immediately before comparison
- `description` and `feedback`: concise case context and failure guidance

For stateful problems, keep setup separate and make `input` the final operation:

```json
{
  "name": "public refreshes recency on get",
  "visibility": "sample",
  "setup": [
    "from solution import LruCache",
    "cache = LruCache(2)",
    "cache.put(\"a\", 1)",
    "cache.put(\"b\", 2)"
  ],
  "input": "cache.get(\"a\")",
  "expected": "1"
}
```

Use `checks` only when one setup needs multiple comparisons. Each check supports:

- `input`: user-facing fallback input for this specific check; prefer top-level `input` for one-case tests
- `expression`: Python/Java expression evaluated by the runner
- `operator`: one of `==`, `!=`, `<`, `<=`, `>`, `>=`, `is`, `is not`, `in`, `not in` for Python; use `==` for Java
- `expected`: Python/Java expression for expected value
- `before`: optional setup statement(s) that run immediately before this check
- `feedback`: optional diagnostic hint shown when this specific check fails

Use executable `code` only for cases that cannot be represented as pairs, such
as exception handling, forbidden operations, or multi-branch control-flow tests.
Every language bundle must keep at least five structured cases, including at
least three direct `input` + `expected` pairs. Keep executable cases to four or
fewer. A scenario with several ordinary comparisons belongs in `checks`, not an
opaque code block.

## Java Tests

New problems should keep Java beside Python in the same `metadata.json` under `languages.java`:

```json
{
  "languages": {
    "java": {
      "starterCode": [
        "class Solution {",
        "    static int add(int a, int b) {",
        "        return 0;",
        "    }",
        "}"
      ],
      "testCases": [
        {
          "name": "public adds positives",
          "visibility": "sample",
          "description": "Two positive inputs should sum directly.",
          "input": "Solution.add(2, 3)",
          "expected": "5",
          "feedback": "Return the computed sum instead of a constant."
        }
      ],
      "solutionGuide": [
        "```java",
        "class Solution {",
        "    static int add(int a, int b) {",
        "        return a + b;",
        "    }",
        "}",
        "```"
      ]
    }
  }
}
```

The Java runner exposes `eq(actual, expected)`, `check(condition)`,
`throwsException(type, runnable)`, `list(...)`, `set(...)`, and `map(...)` for
legacy `code` tests. Prefer direct pairs for new Java cases. The loader converts
them into structured equality checks, preserving clean input, expected, and
returned blocks without an explicit `checks` array.

## Custom Tests

The practice UI lets learners run a custom executable test against the current
solution. The default custom test is generated from the first sample check, so
learners can edit the input and expected value locally before submitting against
full coverage.

API callers may also send `description`, `input`, `expected`, and `feedback` with custom tests. The UI will show those fields in the same result panel.

## Failure Output

Failures include:

- problem slug and language
- testcase name and visibility
- case description, input, and expected output when present
- expected and returned values for structured checks
- failing input/expression, or legacy testcase line when a `code` test fails
- stdout, stderr, traceback, and feedback

Structured checks produce the clearest output. For legacy executable tests,
Python `assert actual == expected` and Java `eq(actual, expected)` are still the
best-supported assertion forms.

## Validation

Run:

```bash
cd web && pnpm practice:validate
cd web && pnpm test --run
```

`practice:validate` executes all sample and hidden tests against each published solution guide for every supported language.
Every language bundle needs at least three sample cases and five hidden cases.
It also enforces five structured cases, three direct pairs, and no more than four
executable cases per language bundle.
