import { execFileSync } from "child_process"
import { describe, expect, it } from "vitest"
import { runPracticeCode } from "./practice-runner"
import { executePracticeCode, PracticeRunnerUnavailableError } from "./practice-runner-client"
import { getPracticeProblem } from "./practice"
import type { PracticeProblem } from "./practice"

function hasPython3() {
    try {
        execFileSync("python3", ["--version"], { stdio: "ignore" })
        return true
    } catch {
        return false
    }
}

function hasJavac() {
    try {
        execFileSync("javac", ["-version"], { stdio: "ignore" })
        return true
    } catch {
        return false
    }
}

const maybeIt = hasPython3() ? it : it.skip
const javaIt = hasJavac() ? it : it.skip

const starterCode = "def add(a, b):\n    pass"
const testCases: PracticeProblem["testCases"] = [
    {
        name: "sample add",
        visibility: "sample",
        setup: "from solution import add",
        checks: [{
            input: "add(2, 3)",
            expression: "add(2, 3)",
            operator: "==",
            expected: "5",
            feedback: "Check basic positive addition.",
        }],
        input: "a = 2, b = 3",
        expected: "5",
        feedback: "Check basic positive addition.",
    },
    {
        name: "hidden add",
        visibility: "hidden",
        setup: "from solution import add",
        checks: [{
            input: "add(-2, 1)",
            expression: "add(-2, 1)",
            operator: "==",
            expected: "-1",
        }],
    },
]

const problem: PracticeProblem = {
    id: "add-two",
    slug: "add-two",
    title: "Add Two",
    difficulty: "Easy",
    category: "Smoke",
    language: "python3",
    timeEstimateMinutes: 1,
    timeLimitMs: 5000,
    memoryLimitMb: 128,
    order: 1,
    tags: [],
    source: "test",
    summary: "test",
    starterCode,
    body: "test",
    clarifyingQuestions: [],
    followUps: [],
    followUpGuide: "",
    complexityAnalysis: "",
    solutionGuide: "",
    testCases,
    languages: {
        python3: {
            starterCode,
            testCases,
            solutionGuide: "",
        },
    },
}

const javaProblem: PracticeProblem = {
    ...problem,
    language: "java",
    starterCode: "class Solution {\n    static int add(int a, int b) {\n        return 0;\n    }\n}",
    testCases: [
        {
            name: "sample add",
            visibility: "sample",
            input: "a = 2, b = 3",
            expected: "5",
            checks: [{
                input: "Solution.add(2, 3)",
                expression: "Solution.add(2, 3)",
                operator: "==",
                expected: "5",
            }],
        },
        {
            name: "hidden add",
            visibility: "hidden",
            checks: [{
                input: "Solution.add(-2, 1)",
                expression: "Solution.add(-2, 1)",
                operator: "==",
                expected: "-1",
            }],
        },
    ],
    languages: {
        java: {
            starterCode: "class Solution {\n    static int add(int a, int b) {\n        return 0;\n    }\n}",
            testCases: [
                {
                    name: "sample add",
                    visibility: "sample",
                    input: "a = 2, b = 3",
                    expected: "5",
                    checks: [{
                        input: "Solution.add(2, 3)",
                        expression: "Solution.add(2, 3)",
                        operator: "==",
                        expected: "5",
                    }],
                },
                {
                    name: "hidden add",
                    visibility: "hidden",
                    checks: [{
                        input: "Solution.add(-2, 1)",
                        expression: "Solution.add(-2, 1)",
                        operator: "==",
                        expected: "-1",
                    }],
                },
            ],
            solutionGuide: "",
        },
    },
}

describe("practice runner", () => {
    maybeIt("runs sample tests separately from submit tests", async () => {
        const code = "def add(a, b):\n    return a + b"

        const runResult = await runPracticeCode({ problem, code, mode: "run" })
        expect(runResult.ok).toBe(true)
        expect(runResult.total).toBe(1)
        expect(runResult.results[0].visibility).toBe("sample")

        const submitResult = await runPracticeCode({ problem, code, mode: "submit" })
        expect(submitResult.ok).toBe(true)
        expect(submitResult.total).toBe(2)
        expect(submitResult.memoryKb).toBeGreaterThan(0)
        expect(submitResult.memoryKb).toBeLessThan(problem.memoryLimitMb * 1024)
    })

    maybeIt("reports structured check failures", async () => {
        const result = await runPracticeCode({
            problem,
            code: "def add(a, b):\n    return 0",
            mode: "submit",
        })

        expect(result.ok).toBe(false)
        expect(result.passed).toBe(0)
        expect(result.results[0].error).toContain("AssertionError")
        expect(result.results[0].errorLineNumber).toBe(1)
        expect(result.results[0].errorLine).toBe("add(2, 3)")
        expect(result.results[0].assertion).toEqual({
            actual: "0",
            expected: "5",
            operator: "==",
            input: "a = 2, b = 3",
        })
        expect(result.results[0].input).toBe("a = 2, b = 3")
        expect(result.results[0].expected).toBe("5")
        expect(result.results[0].feedback).toBe("Check basic positive addition.")
    })

    maybeIt("reports concrete case input instead of the check expression", async () => {
        const repositoryProblem = getPracticeProblem("repository-diff")
        expect(repositoryProblem).toBeTruthy()

        const result = await runPracticeCode({
            problem: repositoryProblem!,
            code: "def diff_repositories(old_files, new_files):\n    return []",
            mode: "run",
        })

        const firstCase = result.results[0]
        expect(result.ok).toBe(false)
        expect(firstCase.input).toBe("old={\"README.md\":\"a\",\"src/app.py\":\"1\"}, new={\"README.md\":\"a\",\"src/app.py\":\"2\",\"src/test.py\":\"3\"}")
        expect(firstCase.input).not.toBe("diff_repositories(old, new)")
        expect(firstCase.assertion?.input).toBe(firstCase.input)
        expect(firstCase.expected).toBe("[(\"MODIFIED\", \"src/app.py\"), (\"ADDED\", \"src/test.py\")]")
        expect(firstCase.errorLine).toBe("diff_repositories(old, new)")
    })

    maybeIt("runs custom tests without hidden cases", async () => {
        const result = await runPracticeCode({
            problem,
            code: "def add(a, b):\n    return a + b",
            mode: "run",
            customTests: [{
                name: "custom negative add",
                visibility: "custom",
                code: "from solution import add\nassert add(-4, -5) == -9",
                feedback: "Custom tests should run alone.",
            }],
        })

        expect(result.ok).toBe(true)
        expect(result.total).toBe(1)
        expect(result.results[0].visibility).toBe("custom")
        expect(result.results[0].name).toBe("custom negative add")
        expect(result.results[0].feedback).toBe("Custom tests should run alone.")
    })

    maybeIt("applies source sandbox checks to Python custom tests", async () => {
        const result = await runPracticeCode({
            problem,
            code: "def add(a, b):\n    return a + b",
            mode: "run",
            customTests: [{
                name: "custom escape attempt",
                visibility: "custom",
                code: "from solution import add\nassert ().__class__.__mro__",
            }],
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toContain("Attribute not allowed: __mro__")
    })

    maybeIt.each([
        ["import threading\nthreading._sys", "Attribute not allowed: _sys"],
        ["import dataclasses\ndataclasses.sys", "Attribute not allowed: sys"],
        ["from threading import _sys as runtime", "Import not allowed: threading._sys"],
        ["from dataclasses import sys as runtime", "Import not allowed: dataclasses.sys"],
    ])("rejects denied modules exposed by allowed imports: %s", async (prefix, error) => {
        const result = await runPracticeCode({
            problem,
            code: `${prefix}\ndef add(a, b):\n    return a + b`,
            mode: "run",
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toContain(error)
    })

    maybeIt("keeps regular-expression compilation available", async () => {
        const result = await runPracticeCode({
            problem,
            code: "import re\nfrom re import compile as compile_pattern\npattern = re.compile(r'\\d+')\ndef add(a, b):\n    assert pattern.fullmatch('12')\n    assert compile_pattern(r'-?\\d+').fullmatch('-2')\n    return a + b",
            mode: "submit",
        })

        expect(result.ok).toBe(true)
        expect(result.passed).toBe(2)
    })

    javaIt("runs Java tests and reports failing testcase lines", async () => {
        const passResult = await runPracticeCode({
            problem: javaProblem,
            code: "class Solution {\n    static int add(int a, int b) {\n        return a + b;\n    }\n}",
            mode: "submit",
            language: "java",
        })
        expect(passResult.ok).toBe(true)
        expect(passResult.passed).toBe(2)

        const failResult = await runPracticeCode({
            problem: javaProblem,
            code: "class Solution {\n    static int add(int a, int b) {\n        return 0;\n    }\n}",
            mode: "submit",
            language: "java",
        })
        expect(failResult.ok).toBe(false)
        expect(failResult.results[0].error).toContain("AssertionError")
        expect(failResult.results[0].errorLineNumber).toBe(2)
        expect(failResult.results[0].errorLine).toContain("eq(Solution.add(2, 3), 5);")
        expect(failResult.results[0].assertion).toEqual({
            actual: "0",
            expected: "5",
            operator: "==",
            input: "a = 2, b = 3",
        })
        expect(failResult.results[0].input).toBe("a = 2, b = 3")
    })

    javaIt("rejects NaN and mismatched infinities in Java numeric assertions", async () => {
        const cases = [
            { expression: "Double.NaN", expected: "0.0" },
            { expression: "Double.POSITIVE_INFINITY", expected: "0.0" },
            { expression: "Double.POSITIVE_INFINITY", expected: "Double.NEGATIVE_INFINITY" },
            { expression: "Double.POSITIVE_INFINITY", expected: "Double.POSITIVE_INFINITY" },
            { expression: "0.0000000005", expected: "0.0" },
        ].map((assertion, index) => ({
            name: `numeric comparison ${index}`,
            visibility: "sample" as const,
            checks: [{ input: assertion.expression, operator: "==" as const, ...assertion }],
        }))
        const result = await runPracticeCode({
            problem: {
                ...javaProblem,
                languages: {
                    java: { ...javaProblem.languages.java!, testCases: cases },
                },
            },
            code: "class Solution {}",
            mode: "submit",
            language: "java",
        })
        expect(result.results.map(testCase => testCase.passed)).toEqual([false, false, false, true, true])
        expect(result.passed).toBe(2)
    })

    javaIt("applies source sandbox checks to Java custom tests", async () => {
        const result = await runPracticeCode({
            problem: javaProblem,
            code: "class Solution {\n    static int add(int a, int b) {\n        return a + b;\n    }\n}",
            mode: "run",
            language: "java",
            customTests: [{
                name: "custom escape attempt",
                visibility: "custom",
                code: "Runtime.getRuntime().exec(\"touch /tmp/nope\");",
            }],
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toContain("Java source uses blocked API")
    })

    javaIt("blocks Java access to process state and unsafe runtime classes", async () => {
        const attempts = [
            "System.getenv(\"LEETLLM_PRACTICE_SECRET\");",
            "java.util.concurrent.CompletableFuture.completedFuture(1).join();",
            "java.util.Currency.getInstance(\"USD\");",
            "new java.math.BigDecimal(\"1\");",
            "new Object().getClass();",
            String.raw`\u0053ystem.getenv("LEETLLM_PRACTICE_SECRET");`,
        ]

        for (const attempt of attempts) {
            const result = await runPracticeCode({
                problem: javaProblem,
                code: `class Solution {
    static int add(int a, int b) {
        ${attempt}
        return a + b;
    }
}`,
                mode: "run",
                language: "java",
            })

            expect(result.ok).toBe(false)
            expect(result.results[0].error).toMatch(/Java source uses (?:unsupported|blocked)/)
        }
    })

    javaIt("blocks Java escape APIs in custom tests", async () => {
        for (const code of [
            "Object.class.getClassLoader();",
            "new java.util.Formatter(\"sandbox-escape.txt\").close();",
        ]) {
            const result = await runPracticeCode({
                problem: javaProblem,
                code: "class Solution { static int add(int a, int b) { return a + b; } }",
                mode: "run",
                language: "java",
                customTests: [{
                    name: "custom escape attempt",
                    visibility: "custom",
                    code,
                }],
            })

            expect(result.ok).toBe(false)
            expect(result.results[0].error).toMatch(/Java source uses (?:unsupported|blocked)/)
        }
    })

    javaIt("allows safe exception assertions in Java custom tests", async () => {
        for (const exceptionType of [
            "ArithmeticException",
            "IllegalArgumentException",
            "IndexOutOfBoundsException",
            "NullPointerException",
            "NumberFormatException",
            "UnsupportedOperationException",
        ]) {
            const result = await runPracticeCode({
                problem: javaProblem,
                code: "class Solution { static int add(int a, int b) { return a + b; } }",
                mode: "run",
                language: "java",
                customTests: [{
                    name: "custom exception assertion",
                    visibility: "custom",
                    code: `throwsException(${exceptionType}.class, () -> { throw new ${exceptionType}(); });`,
                }],
            })

            expect(result.ok, exceptionType).toBe(true)
        }
    })

    javaIt("allows arbitrary-precision Java integer arithmetic", async () => {
        const result = await runPracticeCode({
            problem: javaProblem,
            code: `import java.math.BigInteger;
class Solution {
    static int add(int a, int b) { return a + b; }
    static BigInteger sum(String a, String b) {
        return new BigInteger(a).add(new BigInteger(b));
    }
}`,
            mode: "run",
            language: "java",
            customTests: [{
                name: "integer arithmetic beyond long range",
                visibility: "custom",
                code: `eq(Solution.sum("9223372036854775807", "1").toString(), "9223372036854775808");
eq(Solution.sum("-100000000000000000000", "3"), new java.math.BigInteger("-99999999999999999997"));`,
            }],
        })
        expect(result.ok, result.results[0]?.error).toBe(true)
        expect(result.passed).toBe(1)
    })

    javaIt("allows Java collection, stream, and lambda helpers", async () => {
        const result = await runPracticeCode({
            problem: javaProblem,
            code: `import java.util.*;

class Solution {
    static int add(int a, int b) {
        String descriptorLikeText = "Ljava/io/File;";
        if (descriptorLikeText.isEmpty()) return 0;
        return Arrays.asList(a, b).stream().mapToInt(Integer::intValue).sum();
    }
}`,
            mode: "submit",
            language: "java",
        })

        expect(result.error ?? result.results[0]?.error).toBeUndefined()
        expect(result.ok).toBe(true)
        expect(result.passed).toBe(2)
    })

    javaIt("stops Java processes that exceed output limits", async () => {
        const result = await runPracticeCode({
            problem: javaProblem,
            code: `class Solution {
    static int add(int a, int b) {
        throw new RuntimeException("x".repeat(100_000));
    }
}`,
            mode: "run",
            language: "java",
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toBe("Output exceeded limit")
    })

    javaIt("applies one Java execution deadline across all test cases", async () => {
        const timeoutCases = [
            ...javaProblem.languages.java!.testCases,
            { ...javaProblem.languages.java!.testCases[0], name: "third add", visibility: "hidden" as const },
        ]
        const timeoutProblem: PracticeProblem = {
            ...javaProblem,
            timeLimitMs: 200,
            testCases: timeoutCases,
            languages: {
                java: {
                    ...javaProblem.languages.java!,
                    testCases: timeoutCases,
                },
            },
        }
        const result = await runPracticeCode({
            problem: timeoutProblem,
            code: `class Solution {
    static int add(int a, int b) {
        while (true) { }
    }
}`,
            mode: "submit",
            language: "java",
        })

        expect(result.ok).toBe(false)
        expect(result.results).toHaveLength(3)
        expect(result.results.every((testCase) => testCase.error === "Timed out after 1000ms")).toBe(true)
        expect(result.results.slice(1).every((testCase) => testCase.durationMs === 0)).toBe(true)
    })

    maybeIt("blocks file access from submitted code", async () => {
        const result = await runPracticeCode({
            problem,
            code: "def add(a, b):\n    open('/tmp/nope', 'w')\n    return a + b",
            mode: "run",
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toContain("Name not allowed: open")
    })

    maybeIt("blocks urllib.request imports from submitted code", async () => {
        const result = await runPracticeCode({
            problem,
            code: "from urllib import request\n\ndef add(a, b):\n    return a + b",
            mode: "run",
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toContain("Import not allowed: urllib.request")
    })

    maybeIt("allows common standard-library helpers used by practice prompts", async () => {
        const result = await runPracticeCode({
            problem,
            code: [
                "from collections import deque",
                "from concurrent.futures import ThreadPoolExecutor",
                "from urllib.parse import urlparse",
                "",
                "def add(a, b):",
                "    work = deque([a, b])",
                "    parsed = urlparse('https://example.com/a')",
                "    with ThreadPoolExecutor(max_workers=1) as executor:",
                "        future = executor.submit(lambda: work.popleft() + work.popleft())",
                "        return future.result() if parsed.netloc == 'example.com' else 0",
            ].join("\n"),
            mode: "run",
        })

        expect(result.ok).toBe(true)
        expect(result.passed).toBe(1)
    })

    maybeIt("provides common Python helpers without import boilerplate", async () => {
        const result = await runPracticeCode({
            problem,
            code: [
                "def add(a, b):",
                "    counts = Counter([a, b])",
                "    heap = []",
                "    heappush(heap, a)",
                "    heapq.heappush(heap, b)",
                "    return sum(value * count for value, count in counts.items()) if len(heap) == 2 else 0",
            ].join("\n"),
            mode: "submit",
        })

        expect(result.ok).toBe(true)
        expect(result.passed).toBe(2)
    })

    maybeIt("blocks importing builtins to recover dangerous functions", async () => {
        const result = await runPracticeCode({
            problem,
            code: "import builtins\n\ndef add(a, b):\n    builtins.open('/tmp/nope', 'w')\n    return a + b",
            mode: "run",
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toContain("Import not allowed: builtins")
    })

    maybeIt("blocks dunder-introspection escapes", async () => {
        const result = await runPracticeCode({
            problem,
            code: "def add(a, b):\n    return ().__class__.__mro__",
            mode: "run",
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toContain("Attribute not allowed: __mro__")
    })

    maybeIt("blocks globals and getattr escape helpers", async () => {
        const result = await runPracticeCode({
            problem,
            code: "def add(a, b):\n    return getattr(globals(), '__builtins__')",
            mode: "run",
        })

        expect(result.ok).toBe(false)
        expect(result.results[0].error).toContain("Name not allowed: getattr")
    })

    maybeIt("blocks format-string, attrgetter, frame, and dynamic type() sandbox escapes", async () => {
        const escapePayloads = [
            "def add(a, b):\n    return '{0.__class__.__base__.__subclasses__}'.format(object)",
            "import operator\ndef add(a, b):\n    return operator.attrgetter('__class__.__base__.__subclasses__')(object)",
            "from operator import attrgetter\ndef add(a, b):\n    return attrgetter('__class__')(object)",
            "import string\ndef add(a, b):\n    return string.Formatter().get_field('0.__class__', [object], {})",
            "def add(a, b):\n    try:\n        1 / 0\n    except ZeroDivisionError as e:\n        return e.__traceback__.tb_frame.f_builtins",
            "def add(a, b):\n    g = (x for x in [1])\n    return g.gi_frame.f_builtins",
            "def add(a, b):\n    return type('Evil', (object,), {})",
        ]

        for (const payload of escapePayloads) {
            const result = await runPracticeCode({
                problem,
                code: payload,
                mode: "run",
            })
            expect(result.ok).toBe(false)
        }
    })

    javaIt("blocks Java MethodHandles and reflection escape payloads", async () => {
        const escapePayloads = [
            "import java.lang.invoke.*;\nclass Solution { static int add(int a, int b) { MethodHandles.lookup(); return a + b; } }",
            "class Solution { static int add(int a, int b) { java.lang.invoke.MethodHandles.publicLookup(); return a + b; } }",
        ]
        for (const payload of escapePayloads) {
            const result = await runPracticeCode({
                problem: javaProblem,
                code: payload,
                mode: "run",
                language: "java",
            })
            expect(result.ok).toBe(false)
        }
    })

    it("refuses local execution when PRACTICE_RUNNER_REQUIRE_REMOTE is true and URL is unset", async () => {
        const prevUrl = process.env.PRACTICE_RUNNER_URL
        const prevRequire = process.env.PRACTICE_RUNNER_REQUIRE_REMOTE
        delete process.env.PRACTICE_RUNNER_URL
        process.env.PRACTICE_RUNNER_REQUIRE_REMOTE = "true"
        try {
            await expect(
                executePracticeCode({
                    problem,
                    code: "def add(a, b):\n    return a + b",
                    mode: "run",
                    language: "python3",
                }),
            ).rejects.toBeInstanceOf(PracticeRunnerUnavailableError)
        } finally {
            if (prevUrl === undefined) delete process.env.PRACTICE_RUNNER_URL
            else process.env.PRACTICE_RUNNER_URL = prevUrl
            if (prevRequire === undefined) delete process.env.PRACTICE_RUNNER_REQUIRE_REMOTE
            else process.env.PRACTICE_RUNNER_REQUIRE_REMOTE = prevRequire
        }
    })

    maybeIt("rejects idempotent-ledger implementations that ignore mismatched retry payloads", async () => {
        const ledgerProblem = getPracticeProblem("idempotent-ledger")!
        const buggyPython = [
            "class Ledger:",
            "    def __init__(self):",
            "        self.balances = {}",
            "        self.results = {}",
            "    def apply(self, request_id, account_id, amount):",
            "        if request_id in self.results:",
            "            return self.results[request_id]",
            "        nxt = self.balances.get(account_id, 0) + amount",
            "        if nxt < 0:",
            "            raise ValueError('insufficient funds')",
            "        self.balances[account_id] = nxt",
            "        self.results[request_id] = nxt",
            "        return nxt",
            "    def balance(self, account_id):",
            "        return self.balances.get(account_id, 0)",
        ].join("\n")

        const buggyResult = await runPracticeCode({
            problem: ledgerProblem,
            code: buggyPython,
            mode: "run",
        })
        expect(buggyResult.ok).toBe(false)

        const guideCode = ledgerProblem.solutionGuide.match(/```python\s*\n([\s\S]*?)```/)![1]
        const validResult = await runPracticeCode({
            problem: ledgerProblem,
            code: guideCode,
            mode: "submit",
        })
        expect(validResult.ok).toBe(true)
    })

    javaIt("rejects Java idempotent-ledger and token-bucket regressions while accepting heap scheduler", async () => {
        const ledgerProblem = getPracticeProblem("idempotent-ledger")!
        const buggyJavaLedger = [
            "import java.util.*;",
            "class Solution {",
            "    private final Map<String, Integer> balances = new HashMap<>();",
            "    private final Map<String, Integer> results = new HashMap<>();",
            "    int apply(String requestId, String accountId, int amount) {",
            "        if (results.containsKey(requestId)) return results.get(requestId);",
            "        int next = balances.getOrDefault(accountId, 0) + amount;",
            "        if (next < 0) throw new IllegalArgumentException();",
            "        balances.put(accountId, next);",
            "        results.put(requestId, next);",
            "        return next;",
            "    }",
            "    int balance(String accountId) { return balances.getOrDefault(accountId, 0); }",
            "}",
        ].join("\n")
        const ledgerFail = await runPracticeCode({
            problem: ledgerProblem,
            code: buggyJavaLedger,
            mode: "run",
            language: "java",
        })
        expect(ledgerFail.ok).toBe(false)

        const limiterProblem = getPracticeProblem("token-bucket-rate-limiter")!
        const buggyJavaLimiter = [
            "import java.util.*;",
            "import java.util.function.*;",
            "class Decision {",
            "    final boolean allowed; final double retryAfter; final String reason;",
            "    Decision(boolean a, double r, String s) { allowed = a; retryAfter = r; reason = s; }",
            "}",
            "class Solution {",
            "    private final double capacity, rate; private final DoubleSupplier now;",
            "    private final Map<Object, double[]> buckets = new HashMap<>();",
            "    Solution(double c, double r, DoubleSupplier n) { capacity = c; rate = r; now = n; }",
            "    Decision allow(Object key) { return allow(key, 1); }",
            "    Decision allow(Object key, double cost) {",
            "        double t = now.getAsDouble();",
            "        double[] b = buckets.computeIfAbsent(key, k -> new double[]{capacity, t});",
            "        b[0] = Math.max(0.0, Math.min(capacity, b[0] + (t - b[1]) * rate));",
            "        b[1] = Math.max(t, b[1]);",
            "        if (b[0] >= cost) { b[0] -= cost; return new Decision(true, 0, \"allowed\"); }",
            "        return new Decision(false, (cost - b[0]) / rate, \"rate_limited\");",
            "    }",
            "}",
        ].join("\n")
        const limiterFail = await runPracticeCode({
            problem: limiterProblem,
            code: buggyJavaLimiter,
            mode: "submit",
            language: "java",
        })
        expect(limiterFail.ok).toBe(false)

        const schedulerProblem = getPracticeProblem("multi-tenant-job-scheduler")!
        const javaSchedulerGuide = schedulerProblem.languages.java!.solutionGuide.match(/```java\s*\n([\s\S]*?)```/)![1]
        const schedulerPass = await runPracticeCode({
            problem: schedulerProblem,
            code: javaSchedulerGuide,
            mode: "submit",
            language: "java",
        })
        expect(schedulerPass.ok).toBe(true)
    })
})
