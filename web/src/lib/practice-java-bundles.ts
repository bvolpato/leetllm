import type { PracticeProblemLanguageBundle, PracticeTestCase } from "./practice"
import { normalizePracticeGuideText } from "./practice-guide-format"

const javaAssertionPattern = /\b(?:check|eq)\s*\(/

function splitTopLevel(value: string, delimiter: string): string[] {
    const parts: string[] = []
    let start = 0
    let depth = 0
    let quote: string | null = null
    let escaped = false

    for (let index = 0; index < value.length; index += 1) {
        const char = value[index]
        if (quote) {
            if (escaped) escaped = false
            else if (char === "\\") escaped = true
            else if (char === quote) quote = null
            continue
        }
        if (char === '"' || char === "'") {
            quote = char
            continue
        }
        if ("([{".includes(char)) depth += 1
        else if (")]}".includes(char)) depth -= 1
        else if (char === delimiter && depth === 0) {
            parts.push(value.slice(start, index).trim())
            start = index + 1
        }
    }
    parts.push(value.slice(start).trim())
    return parts
}

function topLevelStatements(code: string): string[] | null {
    const source = code.trim()
    if (!source.endsWith(";")) return null
    const statements = splitTopLevel(source, ";")
    if (statements.at(-1) !== "") return null
    statements.pop()
    return statements.length > 0 && statements.every(Boolean) ? statements : null
}

function parseJavaCheck(statement: string): { expression: string; expected: string } | null {
    let expression: string
    let expected: string
    if (statement.startsWith("check(") && statement.endsWith(")")) {
        expression = statement.slice(6, -1).trim()
        expected = "true"
    } else if (statement.startsWith("eq(") && statement.endsWith(")")) {
        const argumentsList = splitTopLevel(statement.slice(3, -1), ",")
        if (argumentsList.length !== 2) return null
        ;[expression, expected] = argumentsList
    } else {
        return null
    }
    return expression && expected ? { expression, expected } : null
}

function renderJavaStatements(statements: string[]): string | undefined {
    return statements.length > 0 ? `${statements.join(";\n")};` : undefined
}

function structuredJavaCase(name: string, visibility: PracticeTestCase["visibility"], code: string): PracticeTestCase | null {
    const statements = topLevelStatements(code)
    if (!statements) return null

    const setupStatements: string[] = []
    const pendingStatements: string[] = []
    const displayHistory: string[] = []
    const checks: NonNullable<PracticeTestCase["checks"]> = []

    for (const statement of statements) {
        const parsed = parseJavaCheck(statement)
        if (!parsed) {
            if (javaAssertionPattern.test(statement)) return null
            pendingStatements.push(statement)
            continue
        }

        if (checks.length === 0) setupStatements.push(...pendingStatements)
        const beforeStatements = checks.length === 0 ? [] : [...pendingStatements]
        const input = [...displayHistory, ...pendingStatements, parsed.expression].join(";\n")
        checks.push({
            input,
            expression: parsed.expression,
            operator: "==",
            expected: parsed.expected,
            before: renderJavaStatements(beforeStatements),
        })
        displayHistory.push(...pendingStatements, parsed.expression)
        pendingStatements.length = 0
    }

    if (checks.length === 0 || pendingStatements.length > 0) return null

    const direct = checks.length === 1 ? checks[0] : null

    return {
        name,
        visibility,
        setup: renderJavaStatements(setupStatements),
        input: direct?.input,
        expected: direct?.expected,
        checks,
    }
}

function test(name: string, visibility: PracticeTestCase["visibility"], code: string): PracticeTestCase {
    return structuredJavaCase(name, visibility, code) ?? { name, visibility, code: code.trim() }
}

function pair(
    name: string,
    visibility: PracticeTestCase["visibility"],
    input: string,
    expected: string,
    setup?: string,
): PracticeTestCase {
    return {
        name,
        visibility,
        input,
        expected,
        setup: setup?.trim(),
        checks: [{ input, expression: input, operator: "==", expected }],
    }
}

function guide(note: string, code: string): string {
    return normalizePracticeGuideText(`${note}

\`\`\`java
${code}
\`\`\``)
}

function bundle(starterCode: string, testCases: PracticeTestCase[], solutionCode: string, note: string): PracticeProblemLanguageBundle {
    return {
        starterCode: starterCode.trimEnd(),
        testCases,
        solutionGuide: guide(note, solutionCode),
    }
}

export const JAVA_PRACTICE_BUNDLES: Record<string, PracticeProblemLanguageBundle> = {
    "batch-inference-scheduler": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    Solution(int maxBatchSize, double maxWaitMs, DoubleSupplier nowMs) {
    }

    List<Object> add(Object requestId) {
        return null;
    }

    List<Object> flushDue() {
        return null;
    }

    List<Object> flushAll() {
        return null;
    }
}`, [
        test("public emits when full", "sample", String.raw`
double[] clock = {0.0};
Solution scheduler = new Solution(2, 50, () -> clock[0]);
check(scheduler.add("a") == null);
eq(scheduler.add("b"), list("a", "b"));
check(scheduler.flushAll() == null);`),
        test("public flushes due oldest request", "sample", String.raw`
double[] clock = {10.0};
Solution scheduler = new Solution(3, 20, () -> clock[0]);
check(scheduler.add("a") == null);
clock[0] = 29.0;
check(scheduler.flushDue() == null);
clock[0] = 30.0;
eq(scheduler.flushDue(), list("a"));`),
        test("private preserves fifo across partial flush", "hidden", String.raw`
double[] clock = {0.0};
Solution scheduler = new Solution(3, 100, () -> clock[0]);
scheduler.add("a");
clock[0] = 10.0;
scheduler.add("b");
eq(scheduler.flushAll(), list("a", "b"));`),
        test("private starts new batch after full emit", "hidden", String.raw`
Solution scheduler = new Solution(2, 100, () -> 0.0);
check(scheduler.add("a") == null);
eq(scheduler.add("b"), list("a", "b"));
check(scheduler.add("c") == null);
eq(scheduler.flushAll(), list("c"));`),
        test("private empty due flush returns null", "hidden", String.raw`
Solution scheduler = new Solution(4, 1, () -> 100.0);
check(scheduler.flushDue() == null);
check(scheduler.flushAll() == null);`),
        pair("public flushes a partial batch on demand", "sample", "scheduler.flushAll()", "list(\"a\", \"b\")", String.raw`
Solution scheduler = new Solution(3, 50, () -> 0.0);
scheduler.add("a");
scheduler.add("b");`),
        pair("private capacity one emits immediately", "hidden", "scheduler.add(\"solo\")", "list(\"solo\")", String.raw`
Solution scheduler = new Solution(1, 100, () -> 0.0);`),
        pair("private wait timer resets after flush", "hidden", "scheduler.flushDue()", "null", String.raw`
double[] clock = {0.0};
Solution scheduler = new Solution(3, 10, () -> clock[0]);
scheduler.add("first");
clock[0] = 10.0;
scheduler.flushDue();
clock[0] = 20.0;
scheduler.add("second");
clock[0] = 29.9;`),
        test("private flush due emits full pending batch", "hidden", String.raw`
double[] clock = {0.0};
Solution scheduler = new Solution(4, 10, () -> clock[0]);
scheduler.add("a");
clock[0] = 5.0;
scheduler.add("b");
clock[0] = 9.0;
scheduler.add("c");
clock[0] = 10.0;
eq(scheduler.flushDue(), list("a", "b", "c"));
check(scheduler.flushAll() == null);`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    private class Pending {
        final double arrivalMs;
        final Object requestId;

        Pending(double arrivalMs, Object requestId) {
            this.arrivalMs = arrivalMs;
            this.requestId = requestId;
        }
    }

    private final int maxBatchSize;
    private final double maxWaitMs;
    private final DoubleSupplier nowMs;
    private final Deque<Pending> pending = new ArrayDeque<>();

    Solution(int maxBatchSize, double maxWaitMs, DoubleSupplier nowMs) {
        this.maxBatchSize = maxBatchSize;
        this.maxWaitMs = maxWaitMs;
        this.nowMs = nowMs;
    }

    private List<Object> emit() {
        if (pending.isEmpty()) return null;
        List<Object> batch = new ArrayList<>();
        while (!pending.isEmpty()) {
            batch.add(pending.removeFirst().requestId);
        }
        return batch;
    }

    List<Object> add(Object requestId) {
        pending.addLast(new Pending(nowMs.getAsDouble(), requestId));
        if (pending.size() >= maxBatchSize) return emit();
        return null;
    }

    List<Object> flushDue() {
        if (pending.isEmpty()) return null;
        if (nowMs.getAsDouble() - pending.peekFirst().arrivalMs >= maxWaitMs) return emit();
        return null;
    }

    List<Object> flushAll() {
        return emit();
    }
}`, "Solution pending arrivals in FIFO order. Emit the full pending batch when size or oldest-wait threshold fires."),

    "bounded-worker-queue": bundle(String.raw`
import java.util.*;

class Solution {
    Solution(int maxPending) {
    }

    boolean enqueue(Object item) {
        return false;
    }

    Object start(String workerId) {
        return null;
    }

    Object complete(String workerId) {
        return null;
    }

    Object fail(String workerId, boolean retry) {
        return null;
    }

    Map<String, Object> snapshot() {
        return new LinkedHashMap<>();
    }
}`, [
        test("enqueues within pending capacity and assigns FIFO", "sample", String.raw`
Solution queue = new Solution(2);
check(queue.enqueue("a"));
check(queue.enqueue("b"));
check(!queue.enqueue("c"));
eq(queue.start("w1"), "a");
check(queue.enqueue("c"));
check(queue.start("w1") == null);
eq(queue.complete("w1"), "a");
eq(queue.start("w1"), "b");
eq(queue.start("w2"), "c");`),
        test("busy workers cannot claim more work", "sample", String.raw`
Solution queue = new Solution(2);
check(queue.enqueue("a"));
check(queue.enqueue("b"));
eq(queue.start("worker"), "a");
check(queue.start("worker") == null);
eq(queue.snapshot().get("pending"), list("b"));
eq(queue.complete("worker"), "a");
check(queue.complete("worker") == null);
eq(queue.start("worker"), "b");`),
        test("retries failed work at back and snapshots state", "hidden", String.raw`
Solution queue = new Solution(3);
for (String item : list("a", "b", "c")) check(queue.enqueue(item));
eq(queue.start("w1"), "a");
eq(queue.start("w2"), "b");
eq(queue.fail("w1", true), "a");
eq(queue.snapshot(), map("pending", list("c", "a"), "in_progress", map("w2", "b")));
check(queue.complete("missing") == null);
eq(queue.fail("w2", false), "b");
eq(queue.start("w3"), "c");
eq(queue.start("w4"), "a");`),
        test("final failure drops work and clears owner", "hidden", String.raw`
Solution queue = new Solution(1);
check(queue.enqueue("a"));
eq(queue.start("w"), "a");
eq(queue.fail("w", false), "a");
eq(queue.snapshot(), map("pending", list(), "in_progress", map()));
check(queue.fail("w", false) == null);
check(queue.start("w") == null);`),
        test("zero capacity rejects pending work", "hidden", String.raw`
Solution queue = new Solution(0);
check(!queue.enqueue("a"));
check(queue.start("w") == null);
eq(queue.snapshot(), map("pending", list(), "in_progress", map()));`),
        pair("empty queue snapshot", "sample", "queue.snapshot()", "map(\"pending\", list(), \"in_progress\", map())", String.raw`
Solution queue = new Solution(2);`),
        pair("missing worker failure is a no-op", "hidden", "queue.fail(\"missing\", true)", "null", String.raw`
Solution queue = new Solution(2);
queue.enqueue("a");`),
        pair("snapshot does not expose internal lists", "hidden", "queue.snapshot()", "map(\"pending\", list(\"a\"), \"in_progress\", map())", String.raw`
Solution queue = new Solution(2);
queue.enqueue("a");
((List<Object>) queue.snapshot().get("pending")).add("fake");`),
        test("private fail retry bypasses capacity", "hidden", String.raw`
Solution queue = new Solution(1);
check(queue.enqueue("a"));
eq(queue.start("w1"), "a");
check(queue.enqueue("b"));
eq(queue.fail("w1", true), "a");
eq(queue.snapshot().get("pending"), list("b", "a"));
check(!queue.enqueue("c"));`),
    ], String.raw`
import java.util.*;

class Solution {
    private final int maxPending;
    private final Deque<Object> pending = new ArrayDeque<>();
    private final Map<String, Object> inProgress = new LinkedHashMap<>();

    Solution(int maxPending) {
        this.maxPending = maxPending;
    }

    boolean enqueue(Object item) {
        if (pending.size() >= maxPending) return false;
        pending.addLast(item);
        return true;
    }

    Object start(String workerId) {
        if (inProgress.containsKey(workerId) || pending.isEmpty()) return null;
        Object item = pending.removeFirst();
        inProgress.put(workerId, item);
        return item;
    }

    Object complete(String workerId) {
        return inProgress.remove(workerId);
    }

    Object fail(String workerId, boolean retry) {
        Object item = inProgress.remove(workerId);
        if (item != null && retry) pending.addLast(item);
        return item;
    }

    Map<String, Object> snapshot() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pending", new ArrayList<>(pending));
        result.put("in_progress", new LinkedHashMap<>(inProgress));
        return result;
    }
}`, "Use an ArrayDeque for pending work and a map for active worker ownership. Capacity applies only to pending items."),

    "canary-metric-judge": bundle(String.raw`
import java.util.*;

class Solution {
    Map<String, Object> judgeCanary(Map<String, Object> baseline, Map<String, Object> candidate, Map<String, Object> thresholds) {
        return new LinkedHashMap<>();
    }
}`, [
        test("public promotes healthy canary", "sample", String.raw`
Map<String, Object> baseline = map("p95_latency_ms", 100, "quality", 0.8);
Map<String, Object> candidate = map("requests", 1000, "error_rate", 0.01, "p95_latency_ms", 110, "quality", 0.82);
Map<String, Object> thresholds = map("min_requests", 100, "max_error_rate", 0.05, "max_latency_ratio", 1.5, "min_quality_delta", 0);
eq(new Solution().judgeCanary(baseline, candidate, thresholds), map("decision", "promote", "reasons", list()));`),
        test("public holds for low traffic", "sample", String.raw`
Map<String, Object> result = new Solution().judgeCanary(
    map("p95_latency_ms", 100, "quality", 1),
    map("requests", 9, "error_rate", 1, "p95_latency_ms", 999, "quality", 0),
    map("min_requests", 10, "max_error_rate", 0.1, "max_latency_ratio", 2, "min_quality_delta", -1)
);
eq(result, map("decision", "hold", "reasons", list("not_enough_traffic")));`),
        test("private rolls back for error and latency in order", "hidden", String.raw`
Map<String, Object> baseline = map("p95_latency_ms", 100, "quality", 0.9);
Map<String, Object> candidate = map("requests", 100, "error_rate", 0.2, "p95_latency_ms", 250, "quality", 0.91);
Map<String, Object> thresholds = map("min_requests", 10, "max_error_rate", 0.05, "max_latency_ratio", 2, "min_quality_delta", -0.1);
eq(new Solution().judgeCanary(baseline, candidate, thresholds), map("decision", "rollback", "reasons", list("error_rate", "latency")));`),
        test("private rolls back for quality regression", "hidden", String.raw`
Map<String, Object> result = new Solution().judgeCanary(
    map("p95_latency_ms", 100, "quality", 0.9),
    map("requests", 100, "error_rate", 0.0, "p95_latency_ms", 100, "quality", 0.85),
    map("min_requests", 10, "max_error_rate", 0.05, "max_latency_ratio", 1.5, "min_quality_delta", -0.02)
);
eq(result, map("decision", "rollback", "reasons", list("quality")));`),
        test("private explicit null metrics fail closed", "hidden", String.raw`
Map<String, Object> thresholds = map("min_requests", 1, "max_error_rate", 1, "max_latency_ratio", 2, "min_quality_delta", 0);
eq(new Solution().judgeCanary(
    map("p95_latency_ms", 100, "quality", 0),
    map("requests", 2, "error_rate", null, "p95_latency_ms", null, "quality", null),
    thresholds
), map("decision", "rollback", "reasons", list("error_rate", "latency", "quality")));
eq(new Solution().judgeCanary(
    map("p95_latency_ms", null, "quality", null),
    map("requests", 2, "error_rate", 0, "p95_latency_ms", 100, "quality", 0),
    thresholds
), map("decision", "rollback", "reasons", list("latency", "quality")));`),
        test("private missing metrics fail closed", "hidden", String.raw`
Map<String, Object> thresholds = map("min_requests", 1, "max_error_rate", 0.1, "max_latency_ratio", 2, "min_quality_delta", 0);
eq(new Solution().judgeCanary(map(), map("requests", 2), thresholds), map("decision", "rollback", "reasons", list("error_rate", "latency", "quality")));`),
        pair("public promotes at exact thresholds", "sample", "new Solution().judgeCanary(baseline, candidate, thresholds)", "map(\"decision\", \"promote\", \"reasons\", list())", String.raw`
Map<String, Object> baseline = map("p95_latency_ms", 100, "quality", 0.8);
Map<String, Object> candidate = map("requests", 100, "error_rate", 0.05, "p95_latency_ms", 150, "quality", 0.8);
Map<String, Object> thresholds = map("min_requests", 100, "max_error_rate", 0.05, "max_latency_ratio", 1.5, "min_quality_delta", 0);`),
        pair("private zero baseline latency fails closed", "hidden", "new Solution().judgeCanary(baseline, candidate, thresholds)", "map(\"decision\", \"rollback\", \"reasons\", list(\"latency\"))", String.raw`
Map<String, Object> baseline = map("p95_latency_ms", 0, "quality", 0.9);
Map<String, Object> candidate = map("requests", 10, "error_rate", 0, "p95_latency_ms", 0, "quality", 0.9);
Map<String, Object> thresholds = map("min_requests", 10, "max_error_rate", 0.1, "max_latency_ratio", 2, "min_quality_delta", 0);`),
        pair("private missing traffic count holds evaluation", "hidden", "new Solution().judgeCanary(baseline, candidate, thresholds)", "map(\"decision\", \"hold\", \"reasons\", list(\"not_enough_traffic\"))", String.raw`
Map<String, Object> baseline = map("p95_latency_ms", 100, "quality", 1);
Map<String, Object> candidate = map("error_rate", 0, "p95_latency_ms", 100, "quality", 1);
Map<String, Object> thresholds = map("min_requests", 1, "max_error_rate", 0.1, "max_latency_ratio", 2, "min_quality_delta", 0);`),
    ], String.raw`
import java.util.*;

class Solution {
    private double number(Map<String, Object> values, String key, double fallback) {
        Object value = values.get(key);
        return value instanceof Number ? ((Number) value).doubleValue() : fallback;
    }

    Map<String, Object> judgeCanary(Map<String, Object> baseline, Map<String, Object> candidate, Map<String, Object> thresholds) {
        if (number(candidate, "requests", 0) < number(thresholds, "min_requests", 0)) {
            return result("hold", List.of("not_enough_traffic"));
        }

        List<String> reasons = new ArrayList<>();
        if (!(candidate.get("error_rate") instanceof Number) || number(candidate, "error_rate", 1) > number(thresholds, "max_error_rate", 0)) {
            reasons.add("error_rate");
        }

        double baseLatency = number(baseline, "p95_latency_ms", 0);
        if (baseLatency <= 0 || !(candidate.get("p95_latency_ms") instanceof Number)
            || number(candidate, "p95_latency_ms", 0) / baseLatency > number(thresholds, "max_latency_ratio", 0)) {
            reasons.add("latency");
        }

        if (!(baseline.get("quality") instanceof Number) || !(candidate.get("quality") instanceof Number)
            || number(candidate, "quality", 0) - number(baseline, "quality", 0) < number(thresholds, "min_quality_delta", 0)) {
            reasons.add("quality");
        }

        return reasons.isEmpty() ? result("promote", reasons) : result("rollback", reasons);
    }

    private Map<String, Object> result(String decision, List<String> reasons) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("decision", decision);
        result.put("reasons", new ArrayList<>(reasons));
        return result;
    }
}`, "Gate low traffic before rollback checks. Then collect reasons in fixed order so failures are explainable."),

    "circuit-breaker-state": bundle(String.raw`
import java.util.function.*;

class Solution {
    Solution(int failureThreshold, double cooldownSeconds, DoubleSupplier now) {
    }

    boolean allow() {
        return false;
    }

    void recordSuccess() {
    }

    void recordFailure() {
    }

    String state() {
        return "";
    }
}`, [
        test("opens after threshold and half-open success closes", "sample", String.raw`
double[] clock = {0.0};
Solution breaker = new Solution(2, 10, () -> clock[0]);
check(breaker.allow());
breaker.recordFailure();
eq(breaker.state(), "closed");
breaker.recordFailure();
eq(breaker.state(), "open");
check(!breaker.allow());
clock[0] = 10.0;
check(breaker.allow());
eq(breaker.state(), "half_open");
breaker.recordSuccess();
eq(breaker.state(), "closed");
check(breaker.allow());`),
        test("stays closed below failure threshold", "sample", String.raw`
Solution breaker = new Solution(2, 10, () -> 0.0);
breaker.recordFailure();
eq(breaker.state(), "closed");
check(breaker.allow());
breaker.recordSuccess();
eq(breaker.state(), "closed");`),
        test("resets consecutive failures and reopens on half-open failure", "hidden", String.raw`
double[] clock = {5.0};
Solution breaker = new Solution(3, 4, () -> clock[0]);
breaker.recordFailure();
breaker.recordSuccess();
breaker.recordFailure();
breaker.recordFailure();
eq(breaker.state(), "closed");
breaker.recordFailure();
eq(breaker.state(), "open");
clock[0] = 8.9;
check(!breaker.allow());
clock[0] = 9.0;
check(breaker.allow());
breaker.recordFailure();
eq(breaker.state(), "open");`),
        test("opens exactly at threshold", "hidden", String.raw`
double[] clock = {3.0};
Solution breaker = new Solution(3, 5, () -> clock[0]);
breaker.recordFailure();
breaker.recordFailure();
eq(breaker.state(), "closed");
breaker.recordFailure();
eq(breaker.state(), "open");
check(!breaker.allow());`),
        test("cooldown boundary moves to half open", "hidden", String.raw`
double[] clock = {0.0};
Solution breaker = new Solution(1, 5, () -> clock[0]);
breaker.recordFailure();
clock[0] = 4.999;
check(!breaker.allow());
clock[0] = 5.0;
check(breaker.allow());
eq(breaker.state(), "half_open");`),
        pair("new breaker starts closed", "sample", "breaker.state()", "\"closed\"", String.raw`
Solution breaker = new Solution(2, 10, () -> 0.0);`),
        pair("open state changes only when probe is allowed", "hidden", "breaker.state()", "\"open\"", String.raw`
double[] clock = {0.0};
Solution breaker = new Solution(1, 5, () -> clock[0]);
breaker.recordFailure();
clock[0] = 5.0;`),
        pair("zero cooldown permits immediate probe", "hidden", "breaker.allow()", "true", String.raw`
Solution breaker = new Solution(1, 0, () -> 3.0);
breaker.recordFailure();`),
    ], String.raw`
import java.util.function.*;

class Solution {
    private final int failureThreshold;
    private final double cooldownSeconds;
    private final DoubleSupplier now;
    private String state = "closed";
    private int failures = 0;
    private double openedAt = 0;

    Solution(int failureThreshold, double cooldownSeconds, DoubleSupplier now) {
        this.failureThreshold = failureThreshold;
        this.cooldownSeconds = cooldownSeconds;
        this.now = now;
    }

    boolean allow() {
        if (state.equals("open")) {
            if (now.getAsDouble() - openedAt >= cooldownSeconds) {
                state = "half_open";
                return true;
            }
            return false;
        }
        return true;
    }

    void recordSuccess() {
        state = "closed";
        failures = 0;
    }

    void recordFailure() {
        if (state.equals("half_open")) {
            state = "open";
            openedAt = now.getAsDouble();
            failures = failureThreshold;
            return;
        }
        failures++;
        if (failures >= failureThreshold) {
            state = "open";
            openedAt = now.getAsDouble();
        }
    }

    String state() {
        return state;
    }
}`, "Track explicit state plus open time. `allow` owns the open to half-open transition at the cooldown boundary."),

    "context-window-packer": bundle(String.raw`
import java.util.*;

class Solution {
    List<String> packMessages(List<Map<String, Object>> messages, int maxTokens) {
        return List.of();
    }
}`, [
        test("keeps system then newest messages within budget", "sample", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "sys", "role", "system", "tokens", 2),
    map("id", "old", "role", "user", "tokens", 3),
    map("id", "new", "role", "assistant", "tokens", 4)
);
eq(new Solution().packMessages(messages, 6), list("sys", "new"));
eq(messages.get(1).get("id"), "old");`),
        test("packs newest messages without a system message", "sample", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "old", "role", "user", "tokens", 2),
    map("id", "middle", "role", "assistant", "tokens", 3),
    map("id", "new", "role", "user", "tokens", 2)
);
eq(new Solution().packMessages(messages, 4), list("old", "new"));`),
        test("skips oversized messages and preserves original order", "hidden", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "sys", "role", "system", "tokens", 5),
    map("id", "u1", "role", "user", "tokens", 2),
    map("id", "a1", "role", "assistant", "tokens", 10),
    map("id", "u2", "role", "user", "tokens", 2),
    map("id", "a2", "role", "assistant", "tokens", 1)
);
eq(new Solution().packMessages(messages, 6), list("sys", "a2"));
eq(new Solution().packMessages(messages, 4), list("u2", "a2"));
eq(new Solution().packMessages(messages, 1), list("a2"));`),
        test("keeps only the first system message", "hidden", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "sys", "role", "system", "tokens", 2),
    map("id", "later-sys", "role", "system", "tokens", 1),
    map("id", "user", "role", "user", "tokens", 1)
);
eq(new Solution().packMessages(messages, 3), list("sys", "user"));`),
        test("returns empty when every message is too large", "hidden", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "sys", "role", "system", "tokens", 10),
    map("id", "user", "role", "user", "tokens", 5)
);
eq(new Solution().packMessages(messages, 4), list());`),
        pair("hidden zero budget selects nothing", "hidden", "new Solution().packMessages(messages, 0)", "list()", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "sys", "role", "system", "tokens", 1),
    map("id", "user", "role", "user", "tokens", 1)
);`),
        pair("exact budget keeps every message", "sample", "new Solution().packMessages(messages, 6)", "list(\"sys\", \"user\", \"assistant\")", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "sys", "role", "system", "tokens", 1),
    map("id", "user", "role", "user", "tokens", 2),
    map("id", "assistant", "role", "assistant", "tokens", 3)
);`),
        pair("empty conversation returns no ids", "hidden", "new Solution().packMessages(list(), 10)", "list()"),
        pair("later system messages never replace first", "hidden", "new Solution().packMessages(messages, 3)", "list(\"user\")", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "primary", "role", "system", "tokens", 10),
    map("id", "secondary", "role", "system", "tokens", 1),
    map("id", "user", "role", "user", "tokens", 2)
);`),
        test("token arithmetic cannot overflow or truncate", "hidden", String.raw`
eq(new Solution().packMessages(list(
    map("id", "sys", "role", "system", "tokens", 2_000_000_000),
    map("id", "new", "role", "user", "tokens", 1_000_000_000)
), Integer.MAX_VALUE), list("sys"));
eq(new Solution().packMessages(list(
    map("id", "huge", "role", "user", "tokens", 4_294_967_296L),
    map("id", "new", "role", "user", "tokens", 1)
), 1), list("new"));`),
        test("zero costs fit zero budget without input mutation", "hidden", String.raw`
List<Map<String, Object>> messages = list(
    map("id", "before", "role", "tool", "tokens", 0),
    map("id", "sys", "role", "system", "tokens", 0),
    map("id", "later-sys", "role", "system", "tokens", 0),
    map("id", "costly", "role", "user", "tokens", 1),
    map("id", "after", "role", "assistant", "tokens", 0)
);
List<Map<String, Object>> snapshot = new ArrayList<>();
for (Map<String, Object> message : messages) snapshot.add(new LinkedHashMap<>(message));
eq(new Solution().packMessages(messages, 0), list("before", "sys", "after"));
eq(messages, snapshot);`),
    ], String.raw`
import java.util.*;

class Solution {
    List<String> packMessages(List<Map<String, Object>> messages, int maxTokens) {
        List<Integer> selected = new ArrayList<>();
        long used = 0;

        for (int i = 0; i < messages.size(); i++) {
            Map<String, Object> message = messages.get(i);
            if ("system".equals(message.get("role"))) {
                long tokens = ((Number) message.get("tokens")).longValue();
                if (tokens <= maxTokens) {
                    selected.add(i);
                    used += tokens;
                }
                break;
            }
        }

        for (int i = messages.size() - 1; i >= 0; i--) {
            Map<String, Object> message = messages.get(i);
            if ("system".equals(message.get("role"))) continue;
            long tokens = ((Number) message.get("tokens")).longValue();
            if (tokens <= (long) maxTokens - used) {
                selected.add(i);
                used += tokens;
            }
        }

        Collections.sort(selected);
        List<String> ids = new ArrayList<>();
        for (int index : selected) ids.add((String) messages.get(index).get("id"));
        return ids;
    }
}`, "Call Solution.packMessages(messages, maxTokens). Only the first system message is eligible: keep it if it fits, and ignore every later system message even if the first is too large. Scan all non-system messages newest first, skipping oversized messages, then sort selected indices to restore conversation order. Zero-token messages fit a zero remaining budget. Input maps and order stay unchanged. Java maxTokens is a nonnegative int; supplied token costs are nonnegative integral Numbers representable as long. Compare each cost with the remaining budget to avoid overflowing an addition or narrowing a large cost to int. This selects individual messages, so dependent turns/tool results require the grouped follow-up. Time is O(n + k log k) for n messages and k selections; extra space is O(k)."),

    "dependency-scheduler-retries": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    List<String> schedule(List<Map<String, Object>> tasks, Consumer<String> run) {
        return schedule(tasks, run, 2);
    }

    List<String> schedule(List<Map<String, Object>> tasks, Consumer<String> run, int maxAttempts) {
        return List.of();
    }
}`, [
        test("runs dependencies before dependents", "sample", String.raw`
List<Map<String, Object>> tasks = list(
    map("id", "index", "deps", list("embed")),
    map("id", "extract", "deps", list()),
    map("id", "embed", "deps", list("extract"))
);
List<String> seen = new ArrayList<>();
eq(new Solution().schedule(tasks, seen::add), list("extract", "embed", "index"));
eq(seen, list("extract", "embed", "index"));`),
        test("runs ready tasks in lexicographic order", "sample", String.raw`
List<String> seen = new ArrayList<>();
List<Map<String, Object>> tasks = list(map("id", "b"), map("id", "a"), map("id", "c", "deps", list("a")));
eq(new Solution().schedule(tasks, seen::add), list("a", "b", "c"));
eq(seen, list("a", "b", "c"));`),
        test("retries transient failures and rejects cycles", "hidden", String.raw`
Map<String, Integer> attempts = new LinkedHashMap<>();
Consumer<String> run = taskId -> {
    attempts.put(taskId, attempts.getOrDefault(taskId, 0) + 1);
    if (taskId.equals("b") && attempts.get(taskId) == 1) throw new RuntimeException("transient");
};
List<Map<String, Object>> tasks = list(
    map("id", "a", "deps", list()),
    map("id", "b", "deps", list("a")),
    map("id", "c", "deps", list("a"))
);
eq(new Solution().schedule(tasks, run, 2), list("a", "b", "c"));
eq(attempts, map("a", 1, "b", 2, "c", 1));
throwsException(IllegalArgumentException.class, () -> new Solution().schedule(list(map("id", "x", "deps", list("y")), map("id", "y", "deps", list("x"))), ignored -> {}));`),
        test("rejects duplicate task ids and unknown deps", "hidden", String.raw`
throwsException(IllegalArgumentException.class, () -> new Solution().schedule(list(map("id", "a"), map("id", "a")), ignored -> {}));
throwsException(IllegalArgumentException.class, () -> new Solution().schedule(list(map("id", "a", "deps", list("missing"))), ignored -> {}));`),
        test("raises after retry attempts are exhausted", "hidden", String.raw`
List<String> attempts = new ArrayList<>();
try {
    new Solution().schedule(list(map("id", "a"), map("id", "b", "deps", list("a"))), taskId -> {
        attempts.add(taskId);
        throw new RuntimeException("boom");
    }, 2);
} catch (RuntimeException expected) {
    eq(attempts, list("a", "a"));
    return;
}
throw new AssertionError("failed task should abort schedule");`),
        pair("empty task list completes immediately", "sample", "new Solution().schedule(list(), taskId -> {})", "list()"),
        pair("waits for every dependency", "hidden", "new Solution().schedule(tasks, taskId -> {})", "list(\"a\", \"b\", \"c\")", String.raw`
List<Map<String, Object>> tasks = list(
    map("id", "c", "deps", list("a", "b")),
    map("id", "b"),
    map("id", "a")
);`),
        pair("deduplicates repeated dependencies", "hidden", "new Solution().schedule(tasks, taskId -> {})", "list(\"parent\", \"child\")", String.raw`
List<Map<String, Object>> tasks = list(
    map("id", "child", "deps", list("parent", "parent")),
    map("id", "parent")
);`),
        pair("one attempt succeeds without retry", "hidden", "new Solution().schedule(tasks, taskId -> {}, 1)", "list(\"only\")", String.raw`
List<Map<String, Object>> tasks = list(map("id", "only"));`),
        test("rejects a nonpositive attempt limit", "hidden", String.raw`
throwsException(IllegalArgumentException.class, () -> new Solution().schedule(list(), taskId -> {}, 0));`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    List<String> schedule(List<Map<String, Object>> tasks, Consumer<String> run) {
        return schedule(tasks, run, 2);
    }

    @SuppressWarnings("unchecked")
    List<String> schedule(List<Map<String, Object>> tasks, Consumer<String> run, int maxAttempts) {
        if (maxAttempts < 1) throw new IllegalArgumentException("maxAttempts must be positive");

        Set<String> ids = new HashSet<>();
        for (Map<String, Object> task : tasks) {
            if (!ids.add((String) task.get("id"))) throw new IllegalArgumentException("duplicate task id");
        }

        Map<String, Integer> indegree = new HashMap<>();
        Map<String, List<String>> dependents = new HashMap<>();
        for (String id : ids) {
            indegree.put(id, 0);
            dependents.put(id, new ArrayList<>());
        }

        for (Map<String, Object> task : tasks) {
            String taskId = (String) task.get("id");
            List<String> deps = (List<String>) task.getOrDefault("deps", List.of());
            for (String dep : new LinkedHashSet<>(deps)) {
                if (!ids.contains(dep)) throw new IllegalArgumentException("unknown dependency");
                indegree.put(taskId, indegree.get(taskId) + 1);
                dependents.get(dep).add(taskId);
            }
        }

        PriorityQueue<String> ready = new PriorityQueue<>();
        for (Map.Entry<String, Integer> entry : indegree.entrySet()) {
            if (entry.getValue() == 0) ready.add(entry.getKey());
        }

        List<String> completed = new ArrayList<>();
        while (!ready.isEmpty()) {
            String taskId = ready.remove();
            RuntimeException last = null;
            for (int attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    run.accept(taskId);
                    last = null;
                    break;
                } catch (RuntimeException error) {
                    last = error;
                }
            }
            if (last != null) throw new RuntimeException("task failed: " + taskId, last);

            completed.add(taskId);
            for (String child : dependents.get(taskId)) {
                indegree.put(child, indegree.get(child) - 1);
                if (indegree.get(child) == 0) ready.add(child);
            }
        }

        if (completed.size() != tasks.size()) throw new IllegalArgumentException("cycle detected");
        return completed;
    }
}`, "Build indegrees, use a priority queue for deterministic ready order, and retry each task before advancing dependents."),

    "document-permission-filter": bundle(String.raw`
import java.util.*;

class Solution {
    List<String> filterChunks(List<Map<String, Object>> chunks, Map<String, Object> user, int k) {
        return List.of();
    }
}`, [
        test("allows public and matching-tenant chunks", "sample", String.raw`
Map<String, Object> user = map("id", "u1", "tenant", "t1", "groups", list());
List<Map<String, Object>> chunks = list(
    map("id", "pub", "score", 0.5, "visibility", "public"),
    map("id", "tenant", "score", 0.9, "visibility", "tenant", "tenant", "t1"),
    map("id", "other", "score", 1.0, "visibility", "tenant", "tenant", "t2")
);
eq(new Solution().filterChunks(chunks, user, 3), list("tenant", "pub"));`),
        test("allows a matching tenant group", "sample", String.raw`
Map<String, Object> user = map("id", "u1", "tenant", "t1", "groups", list("research", "ops"));
List<Map<String, Object>> chunks = list(
    map("id", "g1", "score", 0.8, "visibility", "group", "tenant", "t1", "groups", list("research")),
    map("id", "g2", "score", 0.9, "visibility", "group", "tenant", "t1", "groups", list("sales"))
);
eq(new Solution().filterChunks(chunks, user, 5), list("g1"));`),
        test("allows a private chunk only for its owner", "hidden", String.raw`
Map<String, Object> user = map("id", "u1", "tenant", "t1", "groups", list());
List<Map<String, Object>> chunks = list(
    map("id", "mine", "score", 2, "visibility", "private", "owner", "u1"),
    map("id", "yours", "score", 3, "visibility", "private", "owner", "u2")
);
eq(new Solution().filterChunks(chunks, user, 2), list("mine"));`),
        test("ranks score ties by id and applies k", "hidden", String.raw`
Map<String, Object> user = map("id", "u", "tenant", "t", "groups", list());
List<Map<String, Object>> chunks = list(
    map("id", "b", "score", 1, "visibility", "public"),
    map("id", "a", "score", 1, "visibility", "public"),
    map("id", "c", "score", 2, "visibility", "public")
);
eq(new Solution().filterChunks(chunks, user, 2), list("c", "a"));`),
        test("denies malformed or unknown visibility", "hidden", String.raw`
Map<String, Object> user = map("id", "u", "tenant", "t", "groups", list("g"));
List<Map<String, Object>> chunks = list(
    map("id", "missing", "score", 9),
    map("id", "unknown", "score", 8, "visibility", "shared"),
    map("id", "group-empty", "score", 7, "visibility", "group", "tenant", "t"),
    map("id", "group-null", "score", 6, "visibility", "group", "tenant", "t", "groups", null),
    map("id", "bad-type", "score", 5, "visibility", 42),
    map("id", "ok", "score", 1, "visibility", "public")
);
eq(new Solution().filterChunks(chunks, user, 10), list("ok"));`),
        pair("public zero limit returns no chunks", "sample", "new Solution().filterChunks(chunks, user, 0)", "list()", String.raw`
List<Map<String, Object>> chunks = list(map("id", "public", "score", 1, "visibility", "public"));
Map<String, Object> user = map("id", "u", "tenant", "t", "groups", list());`),
        pair("hidden negative limit returns no chunks", "hidden", "new Solution().filterChunks(chunks, user, -1)", "list()", String.raw`
List<Map<String, Object>> chunks = list(map("id", "public", "score", 1, "visibility", "public"));
Map<String, Object> user = map("id", "u", "tenant", "t", "groups", list());`),
        pair("hidden missing tenant identity denies protected chunks", "hidden", "new Solution().filterChunks(chunks, user, 5)", "list()", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "tenant-orphan", "score", 3, "visibility", "tenant"),
    map("id", "group-orphan", "score", 2, "visibility", "group", "groups", list("ops"))
);
Map<String, Object> user = map("id", "u", "groups", list("ops"));`),
        pair("hidden missing owner identity denies private chunks", "hidden", "new Solution().filterChunks(chunks, user, 5)", "list()", String.raw`
List<Map<String, Object>> chunks = list(map("id", "ownerless", "score", 3, "visibility", "private"));
Map<String, Object> user = map("tenant", "t", "groups", list());`),
        pair("hidden empty chunks returns empty list", "hidden", "new Solution().filterChunks(List.of(), Map.of(), 5)", "list()"),
        pair("hidden tenant chunk missing tenant is denied", "hidden", "new Solution().filterChunks(chunks, user, 5)", "list(\"ok\")", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "orphan", "score", 9, "visibility", "tenant"),
    map("id", "ok", "score", 1, "visibility", "public")
);
Map<String, Object> user = map("id", "u", "tenant", "t", "groups", list());`),
        pair("private group access also requires tenant match", "hidden", "new Solution().filterChunks(chunks, user, 5)", "list()", String.raw`
List<Map<String, Object>> chunks = list(map("id", "cross-tenant", "score", 5, "visibility", "group", "tenant", "other", "groups", list("ops")));
Map<String, Object> user = map("id", "u", "tenant", "mine", "groups", list("ops"));`),
        pair("private filtering leaves input order unchanged", "hidden", "chunks", "original", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "low", "score", 1, "visibility", "public"),
    map("id", "high", "score", 2, "visibility", "public")
);
List<Map<String, Object>> original = new ArrayList<>(chunks);
new Solution().filterChunks(chunks, map("id", "u"), 2);`),
    ], String.raw`
import java.util.*;

class Solution {
    List<String> filterChunks(List<Map<String, Object>> chunks, Map<String, Object> user, int k) {
        if (k <= 0) return List.of();
        List<Map<String, Object>> visible = new ArrayList<>();
        Set<Object> userGroups = groupSet(user.get("groups"));

        for (Map<String, Object> chunk : chunks) {
            Object visibility = chunk.get("visibility");
            boolean allowed = false;
            if ("public".equals(visibility)) {
                allowed = true;
            } else if ("tenant".equals(visibility)) {
                allowed = tenantMatches(chunk, user);
            } else if ("group".equals(visibility) && tenantMatches(chunk, user)) {
                for (Object group : groupSet(chunk.get("groups"))) {
                    if (userGroups.contains(group)) allowed = true;
                }
            } else if ("private".equals(visibility)) {
                Object owner = chunk.get("owner");
                Object userId = user.get("id");
                allowed = owner != null && userId != null && Objects.equals(owner, userId);
            }
            if (allowed) visible.add(chunk);
        }

        visible.sort((left, right) -> {
            int byScore = Double.compare(number(right, "score"), number(left, "score"));
            if (byScore != 0) return byScore;
            return ((String) left.get("id")).compareTo((String) right.get("id"));
        });

        List<String> ids = new ArrayList<>();
        for (int i = 0; i < Math.min(k, visible.size()); i++) ids.add((String) visible.get(i).get("id"));
        return ids;
    }

    private boolean tenantMatches(Map<String, Object> chunk, Map<String, Object> user) {
        Object chunkTenant = chunk.get("tenant");
        Object userTenant = user.get("tenant");
        return chunkTenant != null && userTenant != null && Objects.equals(chunkTenant, userTenant);
    }

    private Set<Object> groupSet(Object value) {
        Set<Object> groups = new HashSet<>();
        if (value instanceof Iterable<?>) {
            for (Object group : (Iterable<?>) value) groups.add(group);
        }
        return groups;
    }

    private double number(Map<String, Object> chunk, String key) {
        return ((Number) chunk.getOrDefault(key, 0)).doubleValue();
    }
}`, "Fail closed for unknown visibility. Rank only after permission filtering by score descending then id."),

    "eval-failure-aggregator": bundle(String.raw`
import java.util.*;

class Solution {
    Map<String, Object> summarizeRuns(List<Map<String, Object>> runs) {
        return new LinkedHashMap<>();
    }
}`, [
        test("summarizes pass rate and failures", "sample", String.raw`
List<Map<String, Object>> runs = list(
    map("case_id", "a", "passed", true),
    map("case_id", "b", "passed", false, "error", "timeout"),
    map("case_id", "c", "passed", false, "error", "timeout")
);
Map<String, Object> summary = new Solution().summarizeRuns(runs);
eq(summary.get("total"), 3);
eq(summary.get("passed"), 1);
eq((double) summary.get("pass_rate"), 1.0 / 3.0);
eq(summary.get("failing_cases"), list("b", "c"));
eq(summary.get("top_errors"), list(list("timeout", 2)));`),
        test("summarizes all passing runs", "sample", String.raw`
Map<String, Object> summary = new Solution().summarizeRuns(list(
    map("case_id", "a", "passed", true),
    map("case_id", "b", "passed", true)
));
eq(summary, map("total", 2, "passed", 2, "pass_rate", 1.0, "failing_cases", list(), "top_errors", list()));`),
        test("handles duplicates empty errors and no runs", "hidden", String.raw`
eq(new Solution().summarizeRuns(list()), map("total", 0, "passed", 0, "pass_rate", 0.0, "failing_cases", list(), "top_errors", list()));
List<Map<String, Object>> runs = list(
    map("case_id", "b", "passed", false, "error", "z"),
    map("case_id", "a", "passed", false, "error", ""),
    map("case_id", "b", "passed", false, "error", "a"),
    map("case_id", "c", "passed", true, "error", "ignored"),
    map("case_id", "d", "passed", false, "error", "a")
);
Map<String, Object> summary = new Solution().summarizeRuns(runs);
eq(summary.get("failing_cases"), list("a", "b", "d"));
eq(summary.get("top_errors"), list(list("a", 2), list("z", 1)));`),
        test("sorts top errors by count then message", "hidden", String.raw`
List<Map<String, Object>> runs = list(
    map("case_id", "c1", "passed", false, "error", "timeout"),
    map("case_id", "c2", "passed", false, "error", "assertion"),
    map("case_id", "c3", "passed", false, "error", "timeout"),
    map("case_id", "c4", "passed", false, "error", "assertion")
);
eq(new Solution().summarizeRuns(runs).get("top_errors"), list(list("assertion", 2), list("timeout", 2)));`),
        test("tracks failing cases even without error strings", "hidden", String.raw`
Map<String, Object> summary = new Solution().summarizeRuns(list(
    map("case_id", "case-1", "passed", false),
    map("case_id", "case-1", "passed", false, "error", ""),
    map("case_id", "case-2", "passed", true)
));
eq(summary.get("passed"), 1);
eq(summary.get("failing_cases"), list("case-1"));
eq(summary.get("top_errors"), list());`),
        pair("empty run list has zero pass rate", "sample", "new Solution().summarizeRuns(list())", "map(\"total\", 0, \"passed\", 0, \"pass_rate\", 0.0, \"failing_cases\", list(), \"top_errors\", list())"),
        pair("repeated failures keep one failing case", "hidden", "new Solution().summarizeRuns(runs)", "map(\"total\", 2, \"passed\", 0, \"pass_rate\", 0.0, \"failing_cases\", list(\"same\"), \"top_errors\", list(list(\"timeout\", 2)))", String.raw`
List<Map<String, Object>> runs = list(
    map("case_id", "same", "passed", false, "error", "timeout"),
    map("case_id", "same", "passed", false, "error", "timeout")
);`),
        pair("errors on passing runs are ignored", "hidden", "new Solution().summarizeRuns(runs)", "map(\"total\", 1, \"passed\", 1, \"pass_rate\", 1.0, \"failing_cases\", list(), \"top_errors\", list())", String.raw`
List<Map<String, Object>> runs = list(map("case_id", "ok", "passed", true, "error", "stale warning"));`),
        pair("summarize does not mutate input runs", "hidden", "runs", "before", String.raw`
List<Map<String, Object>> runs = list(map("case_id", "a", "passed", false, "error", "timeout"));
List<Map<String, Object>> before = new ArrayList<>();
for (Map<String, Object> run : runs) before.add(new LinkedHashMap<>(run));
new Solution().summarizeRuns(runs);`),
    ], String.raw`
import java.util.*;

class Solution {
    Map<String, Object> summarizeRuns(List<Map<String, Object>> runs) {
        int passed = 0;
        Set<String> failingCases = new TreeSet<>();
        Map<String, Integer> errors = new HashMap<>();

        for (Map<String, Object> run : runs) {
            if (Boolean.TRUE.equals(run.get("passed"))) {
                passed++;
                continue;
            }
            failingCases.add((String) run.get("case_id"));
            String error = (String) run.getOrDefault("error", "");
            if (!error.isEmpty()) errors.put(error, errors.getOrDefault(error, 0) + 1);
        }

        List<List<Object>> topErrors = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : errors.entrySet()) {
            topErrors.add(List.of(entry.getKey(), entry.getValue()));
        }
        topErrors.sort((left, right) -> {
            int byCount = Integer.compare((Integer) right.get(1), (Integer) left.get(1));
            if (byCount != 0) return byCount;
            return ((String) left.get(0)).compareTo((String) right.get(0));
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", runs.size());
        result.put("passed", passed);
        result.put("pass_rate", runs.isEmpty() ? 0.0 : (double) passed / runs.size());
        result.put("failing_cases", new ArrayList<>(failingCases));
        result.put("top_errors", topErrors);
        return result;
    }
}`, "Count every run for pass rate, but report failing case ids uniquely and sorted."),

    "experiment-traffic-splitter": bundle(String.raw`
import java.util.*;

record Variant(String name, int weight) {}

class Solution {
    String assignVariant(String userId, String experimentKey, List<Variant> variants) {
        return null;
    }
}`, [
        test("public assigns deterministically", "sample", String.raw`
List<Variant> variants = list(new Variant("control", 50), new Variant("treatment", 50));
String first = new Solution().assignVariant("u1", "checkout", variants);
eq(first, new Solution().assignVariant("u1", "checkout", variants));
check(Set.of("control", "treatment").contains(first));`),
        test("public ignores zero weights", "sample", String.raw`
eq(new Solution().assignVariant("u1", "exp", list(new Variant("off", 0), new Variant("on", 10))), "on");`),
        test("private returns null for empty positive weight", "hidden", String.raw`
check(new Solution().assignVariant("u", "exp", list()) == null);
check(new Solution().assignVariant("u", "exp", list(new Variant("a", 0), new Variant("b", 0))) == null);`),
        test("private respects weighted ranges", "hidden", String.raw`
List<Variant> variants = list(new Variant("a", 1), new Variant("b", 3), new Variant("c", 6));
eq(new Solution().assignVariant("alice", "ranking", variants), "c");
eq(new Solution().assignVariant("bob", "ranking", variants), "c");`),
        test("private experiment key affects bucket", "hidden", String.raw`
List<Variant> variants = list(new Variant("a", 2), new Variant("b", 2), new Variant("c", 2));
eq(new Solution().assignVariant("same-user", "exp-a", variants), "b");
eq(new Solution().assignVariant("same-user", "exp-b", variants), "a");`),
        test("private light arm and multi-user diversity", "hidden", String.raw`
List<Variant> variants = list(new Variant("a", 1), new Variant("b", 3), new Variant("c", 6));
eq(new Solution().assignVariant("y", "e", variants), "a");
eq(new Solution().assignVariant("v", "e", variants), "b");
eq(new Solution().assignVariant("alice", "ranking", variants), "c");`),
        pair("public single positive variant always wins", "sample", "new Solution().assignVariant(\"any-user\", \"exp\", list(new Variant(\"only\", 7)))", "\"only\""),
        pair("private negative weights are not eligible", "hidden", "new Solution().assignVariant(\"u\", \"exp\", list(new Variant(\"bad\", -5), new Variant(\"good\", 1)))", "\"good\""),
        pair("private variant order defines bucket ranges", "hidden", "list(new Solution().assignVariant(\"u\", \"e\", list(new Variant(\"left\", 1), new Variant(\"right\", 1))), new Solution().assignVariant(\"u\", \"e\", list(new Variant(\"right\", 1), new Variant(\"left\", 1))))", "list(\"left\", \"right\")"),
        test("private hashes Unicode code points", "hidden", String.raw`
String userId = "user" + new String(Character.toChars(0x1F600));
eq(new Solution().assignVariant(userId, "exp", list(
    new Variant("a", 1), new Variant("b", 1), new Variant("c", 1),
    new Variant("d", 1), new Variant("e", 1), new Variant("f", 1)
)), "f");`),
        test("private preserves the mathematical hash beyond long range", "hidden", String.raw`
String userId = new String(Character.toChars(0x10FFFF)).repeat(4_100_000);
eq(new Solution().assignVariant(userId, "e", list(
    new Variant("a", 1), new Variant("b", 1), new Variant("c", 1)
)), "c");`),
    ], String.raw`
import java.util.*;

record Variant(String name, int weight) {}

class Solution {
    String assignVariant(String userId, String experimentKey, List<Variant> variants) {
        List<Variant> positive = new ArrayList<>();
        long total = 0;
        for (Variant variant : variants) {
            if (variant.weight() > 0) {
                positive.add(variant);
                total += variant.weight();
            }
        }
        if (total == 0) return null;

        String key = experimentKey + ":" + userId;
        long hash = 0;
        int index = 0;
        for (int offset = 0; offset < key.length(); index++) {
            int codePoint = key.codePointAt(offset);
            long contribution = ((long) index + 1) * codePoint % total;
            // Preserve the sum modulo total without overflowing its addition.
            hash = hash >= total - contribution
                ? hash - (total - contribution)
                : hash + contribution;
            offset += Character.charCount(codePoint);
        }
        long bucket = hash;
        long cursor = 0;
        for (Variant variant : positive) {
            cursor += variant.weight();
            if (bucket < cursor) return variant.name();
        }
        return positive.get(positive.size() - 1).name();
    }
}`, "Reduce each weighted Unicode code-point term modulo the positive weight total to preserve the exact mathematical hash without overflow, then map the bucket into ordered weighted ranges."),

    "idempotent-ledger": bundle(String.raw`
import java.util.*;

class Solution {
    Solution() {
    }

    int apply(String requestId, String accountId, int amount) {
        return 0;
    }

    int balance(String accountId) {
        return 0;
    }
}`, [
        test("deduplicates successful requests", "sample", String.raw`
Solution ledger = new Solution();
eq(ledger.apply("deposit-1", "acct", 100), 100);
eq(ledger.apply("deposit-1", "acct", 100), 100);
eq(ledger.apply("withdraw-1", "acct", -30), 70);
eq(ledger.balance("acct"), 70);`),
        test("keeps independent account balances", "sample", String.raw`
Solution ledger = new Solution();
eq(ledger.apply("a-deposit", "acct-a", 10), 10);
eq(ledger.apply("b-deposit", "acct-b", 7), 7);
eq(ledger.apply("a-noop", "acct-a", 0), 10);
eq(ledger.balance("acct-a"), 10);
eq(ledger.balance("acct-b"), 7);
eq(ledger.balance("missing"), 0);`),
        test("rejects overdrafts without mutating balance", "hidden", String.raw`
Solution ledger = new Solution();
throwsException(IllegalArgumentException.class, () -> ledger.apply("withdraw-empty", "acct", -1));
eq(ledger.balance("acct"), 0);
eq(ledger.apply("deposit-1", "acct", 5), 5);
eq(ledger.apply("withdraw-2", "acct", -5), 0);
eq(ledger.apply("withdraw-2", "acct", -5), 0);`),
        test("rejects duplicate request id with mismatched payload", "sample", String.raw`
Solution ledger = new Solution();
eq(ledger.apply("req", "acct-a", 5), 5);
throwsException(IllegalArgumentException.class, () -> ledger.apply("req", "acct-b", 5));
throwsException(IllegalArgumentException.class, () -> ledger.apply("req", "acct-a", 100));
throwsException(IllegalArgumentException.class, () -> ledger.apply("req", "acct-b", 100));
eq(ledger.apply("req", "acct-a", 5), 5);
eq(ledger.balance("acct-a"), 5);
eq(ledger.balance("acct-b"), 0);`),
        test("failed requests are not recorded as idempotent successes", "hidden", String.raw`
Solution ledger = new Solution();
throwsException(IllegalArgumentException.class, () -> ledger.apply("withdraw", "acct", -1));
eq(ledger.apply("seed", "acct", 5), 5);
eq(ledger.apply("withdraw", "acct", -1), 4);`),
        pair("new account starts with zero balance", "sample", "ledger.balance(\"new\")", "0", String.raw`
Solution ledger = new Solution();`),
        pair("duplicate returns original result after later changes", "hidden", "list(ledger.apply(\"first\", \"acct\", 10), ledger.balance(\"acct\"))", "list(10, 15)", String.raw`
Solution ledger = new Solution();
ledger.apply("first", "acct", 10);
ledger.apply("later", "acct", 5);`),
        test("zero amount is an idempotent success and rejects changed amount", "hidden", String.raw`
Solution ledger = new Solution();
eq(ledger.apply("noop", "acct", 0), 0);
eq(ledger.apply("noop", "acct", 0), 0);
throwsException(IllegalArgumentException.class, () -> ledger.apply("noop", "acct", 50));
eq(ledger.balance("acct"), 0);`),
        test("failed payload mismatch after later deposit leaves balances intact", "hidden", String.raw`
Solution ledger = new Solution();
eq(ledger.apply("d1", "acct", 25), 25);
eq(ledger.apply("d2", "acct", 15), 40);
throwsException(IllegalArgumentException.class, () -> ledger.apply("d1", "acct", -5));
eq(ledger.balance("acct"), 40);
eq(ledger.apply("d1", "acct", 25), 25);`),
    ], String.raw`
import java.util.*;

class Solution {
    private record RequestRecord(String accountId, int amount, int balance) {}

    private final Map<String, Integer> balances = new HashMap<>();
    private final Map<String, RequestRecord> recordsByRequest = new HashMap<>();

    int apply(String requestId, String accountId, int amount) {
        RequestRecord existing = recordsByRequest.get(requestId);
        if (existing != null) {
            if (!Objects.equals(existing.accountId(), accountId) || existing.amount() != amount) {
                throw new IllegalArgumentException("idempotency key payload mismatch");
            }
            return existing.balance();
        }
        int next = balances.getOrDefault(accountId, 0) + amount;
        if (next < 0) throw new IllegalArgumentException("insufficient funds");
        balances.put(accountId, next);
        recordsByRequest.put(requestId, new RequestRecord(accountId, amount, next));
        return next;
    }

    int balance(String accountId) {
        return balances.getOrDefault(accountId, 0);
    }
}`, "Store (accountId, amount, resultingBalance) per successful request ID, rejecting payload mismatches before touching balances."),

    "in-memory-filesystem": bundle(String.raw`
import java.util.*;

class Solution {
    Solution() {
    }

    void mkdir(String path) {
    }

    void writeFile(String path, String content) {
    }

    String readFile(String path) {
        return "";
    }

    List<String> ls(String path) {
        return List.of();
    }
}`, [
        test("creates directories and reads files", "sample", String.raw`
Solution fs = new Solution();
fs.mkdir("/docs/guides");
fs.writeFile("/docs/guides/readme.md", "hello");
eq(fs.ls("/"), list("docs"));
eq(fs.ls("/docs"), list("guides"));
eq(fs.ls("/docs/guides/readme.md"), list("readme.md"));
eq(fs.readFile("/docs/guides/readme.md"), "hello");`),
        test("lists root directories and file paths", "sample", String.raw`
Solution fs = new Solution();
fs.mkdir("/docs");
fs.writeFile("/docs/readme.txt", "hi");
eq(fs.ls("/"), list("docs"));
eq(fs.ls("/docs/readme.txt"), list("readme.txt"));`),
        test("normalizes slashes and rejects missing parents", "hidden", String.raw`
Solution fs = new Solution();
fs.mkdir("//a/b//");
fs.writeFile("/a/b/file.txt", "v1");
fs.writeFile("/a/b/file.txt", "v2");
eq(fs.readFile("/a//b/file.txt"), "v2");
eq(fs.ls("/a/b/"), list("file.txt"));
throwsException(NoSuchElementException.class, () -> fs.writeFile("/missing/file.txt", "x"));
throwsException(NoSuchElementException.class, () -> fs.readFile("/missing"));
throwsException(NoSuchElementException.class, () -> fs.ls("/missing"));`),
        test("overwrites files and rejects reading directories", "hidden", String.raw`
Solution fs = new Solution();
fs.mkdir("/docs");
fs.writeFile("/docs/a.txt", "one");
fs.writeFile("/docs/a.txt", "two");
eq(fs.readFile("/docs/a.txt"), "two");
throwsException(IllegalStateException.class, () -> fs.readFile("/docs"));
throwsException(IllegalStateException.class, () -> fs.writeFile("/docs", "not a directory"));
throwsException(IllegalStateException.class, () -> fs.writeFile("/", "not a file"));`),
        test("rejects traversal through file nodes", "hidden", String.raw`
Solution fs = new Solution();
fs.writeFile("/file", "content");
throwsException(IllegalStateException.class, () -> fs.mkdir("//file//"));
throwsException(IllegalStateException.class, () -> fs.mkdir("/file/child"));
throwsException(IllegalStateException.class, () -> fs.writeFile("/file/child", "x"));
throwsException(IllegalStateException.class, () -> fs.writeFile("/file/child/grandchild", "x"));
throwsException(IllegalStateException.class, () -> fs.readFile("/file/child"));
throwsException(IllegalStateException.class, () -> fs.ls("/file/child"));
eq(fs.readFile("/file"), "content");
eq(fs.ls("/"), list("file"));
fs.writeFile("/empty", "");
eq(fs.readFile("/empty/"), "");
eq(fs.ls("/empty/"), list("empty"));`),
        pair("empty filesystem lists an empty root", "sample", "fs.ls(\"/\")", "list()", String.raw`
Solution fs = new Solution();`),
        pair("directory listings use Unicode code point order", "hidden", "fs.ls(\"/\")", "list(\"alpha\", \"middle\", \"zeta\", \"\\uE000\", \"\\uD800\\uDC00\")", String.raw`
Solution fs = new Solution();
fs.mkdir("/zeta");
fs.mkdir("/alpha");
fs.writeFile("/middle", "x");
fs.writeFile("/\uD800\uDC00", "supplementary");
fs.writeFile("/\uE000", "bmp");`),
        pair("mkdir is idempotent for existing directories", "hidden", "fs.ls(\"/docs\")", "list(\"guides\")", String.raw`
Solution fs = new Solution();
fs.mkdir("/docs/guides");
fs.mkdir("//docs/guides//");`),
    ], String.raw`
import java.util.*;

class Node {
    final Map<String, Node> children = new HashMap<>();
    String content = null;

    boolean isFile() {
        return content != null;
    }
}

class Solution {
    private final Node root = new Node();

    private List<String> parts(String path) {
        List<String> result = new ArrayList<>();
        for (String part : path.split("/+")) {
            if (!part.isEmpty()) result.add(part);
        }
        return result;
    }

    private Node walk(List<String> parts) {
        Node node = root;
        for (String part : parts) {
            if (node.isFile()) throw new IllegalStateException("file blocks traversal");
            if (!node.children.containsKey(part)) throw new NoSuchElementException("missing path");
            node = node.children.get(part);
        }
        return node;
    }

    void mkdir(String path) {
        Node node = root;
        for (String part : parts(path)) {
            if (node.isFile()) throw new IllegalStateException("file blocks traversal");
            node = node.children.computeIfAbsent(part, ignored -> new Node());
        }
        if (node.isFile()) throw new IllegalStateException("path is file");
    }

    void writeFile(String path, String content) {
        List<String> parts = parts(path);
        if (parts.isEmpty()) throw new IllegalStateException("path is directory");
        Node parent = walk(parts.subList(0, parts.size() - 1));
        if (parent.isFile()) throw new IllegalStateException("parent is file");
        String name = parts.get(parts.size() - 1);
        Node node = parent.children.get(name);
        if (node == null) {
            node = new Node();
            parent.children.put(name, node);
        } else if (!node.isFile()) {
            throw new IllegalStateException("path is directory");
        }
        node.content = content;
    }

    String readFile(String path) {
        Node node = walk(parts(path));
        if (!node.isFile()) throw new IllegalStateException("not a file");
        return node.content;
    }

    List<String> ls(String path) {
        List<String> parts = parts(path);
        Node node = walk(parts);
        if (node.isFile()) return List.of(parts.get(parts.size() - 1));
        List<String> names = new ArrayList<>(node.children.keySet());
        names.sort(this::compareNames);
        return names;
    }

    private int compareNames(String left, String right) {
        int i = 0, j = 0;
        while (i < left.length() && j < right.length()) {
            int a = left.codePointAt(i), b = right.codePointAt(j);
            if (a != b) return Integer.compare(a, b);
            i += Character.charCount(a);
            j += Character.charCount(b);
        }
        return Integer.compare(left.length() - i, right.length() - j);
    }
}`, "Use Solution with mkdir, writeFile, readFile, and ls for the Java API. Missing paths raise NoSuchElementException; reading or writing directories, mkdir on a file, and traversal through a file raise IllegalStateException. Represent directories and files as tree nodes. Normalize paths by dropping empty slash segments, including trailing slashes. Use null to mark directories so an empty string remains valid file content. Check the final node after mkdir traversal as well as intermediate nodes; mkdir on an existing file must fail without changing it. Directory names sort by Unicode code points, matching Python rather than Java's default UTF-16 ordering. Operations traverse and hash O(L) path characters on average; a directory ls adds O(k log k) name comparisons, with character work for long names. The tree stores O(n + B) space for nodes and characters, plus O(L) path-parsing space."),

    "lfu-ttl-cache": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    Solution(int capacity, DoubleSupplier now) {
    }

    void put(String key, Object value) {
        put(key, value, null);
    }

    void put(String key, Object value, Double ttl) {
    }

    Object get(String key) {
        return null;
    }
}`, [
        test("evicts least frequently used entry", "sample", String.raw`
Solution cache = new Solution(2, () -> 0.0);
cache.put("a", 1);
cache.put("b", 2);
eq(cache.get("a"), 1);
cache.put("c", 3);
check(cache.get("b") == null);
eq(cache.get("a"), 1);
eq(cache.get("c"), 3);`),
        test("tie breaks by recency inside frequency", "sample", String.raw`
Solution cache = new Solution(2, () -> 0.0);
cache.put("a", 1);
cache.put("b", 2);
cache.put("c", 3);
check(cache.get("a") == null);
eq(cache.get("b"), 2);
eq(cache.get("c"), 3);`),
        test("frequency beats global recency", "hidden", String.raw`
Solution cache = new Solution(2, () -> 0.0);
cache.put("a", 1);
cache.put("b", 2);
eq(cache.get("a"), 1);
eq(cache.get("a"), 1);
eq(cache.get("b"), 2);
cache.put("c", 3);
eq(cache.get("a"), 1);
check(cache.get("b") == null);
eq(cache.get("c"), 3);`),
        test("update increments frequency and replaces ttl", "hidden", String.raw`
double[] clock = {0.0};
Solution cache = new Solution(2, () -> clock[0]);
cache.put("a", 1, 5.0);
cache.put("b", 2);
cache.put("a", 10, 20.0);
cache.put("c", 3);
check(cache.get("b") == null);
clock[0] = 6.0;
eq(cache.get("a"), 10);
eq(cache.get("c"), 3);`),
        test("expired entries are removed before eviction", "hidden", String.raw`
double[] clock = {0.0};
Solution cache = new Solution(2, () -> clock[0]);
cache.put("old", 1, 5.0);
eq(cache.get("old"), 1);
eq(cache.get("old"), 1);
cache.put("hot", 2);
eq(cache.get("hot"), 2);
clock[0] = 5.0;
cache.put("new", 3);
eq(cache.get("hot"), 2);
eq(cache.get("new"), 3);
check(cache.get("old") == null);`),
        pair("zero capacity stores no entries", "hidden", "cache.get(\"a\")", "null", String.raw`
Solution cache = new Solution(0, () -> 0.0);
cache.put("a", 1);`),
        pair("returns null for missing keys", "sample", "cache.get(\"missing\")", "null", String.raw`
Solution cache = new Solution(2, () -> 0.0);`),
        pair("ttl zero expires immediately", "hidden", "cache.get(\"ephemeral\")", "null", String.raw`
Solution cache = new Solution(1, () -> 4.0);
cache.put("ephemeral", 7, 0.0);`),
        test("nonpositive ttl preserves unrelated live entries", "hidden", String.raw`
Solution cache = new Solution(1, () -> 0.0);
cache.put("live", 7);
cache.put("dead", 8, 0.0);
eq(cache.get("live"), 7);
eq(cache.get("dead"), null);
cache.put("live", 9, -1.0);
eq(cache.get("live"), null);
cache.put("new", 10);
eq(cache.get("new"), 10);`),
        test("one timestamp preserves live update frequency", "hidden", String.raw`
double[] clock = {0.0};
boolean[] advance = {false};
Solution cache = new Solution(2, () -> { double value = clock[0]; if (advance[0]) clock[0] += 10.0; return value; });
cache.put("a", 1, 5.0);
cache.put("b", 2);
eq(cache.get("b"), 2);
advance[0] = true;
cache.put("a", 3, 20.0);
advance[0] = false;
cache.put("c", 4);
eq(cache.get("b"), null);
eq(cache.get("a"), 3);
eq(cache.get("c"), 4);`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    private class Entry {
        Object value;
        Double expiresAt;
        int freq;

        Entry(Object value, Double expiresAt) {
            this.value = value;
            this.expiresAt = expiresAt;
            this.freq = 1;
        }
    }

    private final int capacity;
    private final DoubleSupplier now;
    private final Map<String, Entry> items = new HashMap<>();
    private final Map<Integer, LinkedHashSet<String>> freqs = new HashMap<>();
    private int minFreq = 0;

    Solution(int capacity, DoubleSupplier now) {
        this.capacity = Math.max(0, capacity);
        this.now = now;
    }

    void put(String key, Object value) {
        put(key, value, null);
    }

    void put(String key, Object value, Double ttl) {
        if (capacity <= 0) return;
        double timestamp = now.getAsDouble();
        if (ttl != null && ttl <= 0.0) {
            remove(key);
            refreshMinFreq();
            return;
        }
        Double expiresAt = ttl == null ? null : timestamp + ttl;
        Entry entry = items.get(key);
        if (entry != null) {
            if (expired(entry, timestamp)) {
                remove(key);
            } else {
                entry.value = value;
                entry.expiresAt = expiresAt;
                touch(key, entry);
                return;
            }
        }

        cleanupExpired(timestamp);
        if (items.size() >= capacity) evictOne();

        Entry inserted = new Entry(value, expiresAt);
        items.put(key, inserted);
        freqs.computeIfAbsent(1, ignored -> new LinkedHashSet<>()).add(key);
        minFreq = 1;
    }

    Object get(String key) {
        double timestamp = now.getAsDouble();
        Entry entry = items.get(key);
        if (entry == null) return null;
        if (expired(entry, timestamp)) {
            remove(key);
            refreshMinFreq();
            return null;
        }
        touch(key, entry);
        return entry.value;
    }

    private void touch(String key, Entry entry) {
        int oldFreq = entry.freq;
        LinkedHashSet<String> bucket = freqs.get(oldFreq);
        if (bucket != null) {
            bucket.remove(key);
            if (bucket.isEmpty()) {
                freqs.remove(oldFreq);
                if (minFreq == oldFreq) minFreq = oldFreq + 1;
            }
        }
        entry.freq = oldFreq + 1;
        freqs.computeIfAbsent(entry.freq, ignored -> new LinkedHashSet<>()).add(key);
    }

    private void cleanupExpired(double timestamp) {
        for (String key : new ArrayList<>(items.keySet())) {
            if (expired(items.get(key), timestamp)) remove(key);
        }
        refreshMinFreq();
    }

    private boolean expired(Entry entry, double timestamp) {
        return entry.expiresAt != null && timestamp >= entry.expiresAt;
    }

    private void remove(String key) {
        Entry entry = items.remove(key);
        if (entry == null) return;
        LinkedHashSet<String> bucket = freqs.get(entry.freq);
        if (bucket == null) return;
        bucket.remove(key);
        if (bucket.isEmpty()) freqs.remove(entry.freq);
    }

    private void evictOne() {
        LinkedHashSet<String> bucket = freqs.get(minFreq);
        if (bucket == null || bucket.isEmpty()) {
            refreshMinFreq();
            bucket = freqs.get(minFreq);
        }
        if (bucket == null || bucket.isEmpty()) return;
        Iterator<String> iterator = bucket.iterator();
        String victim = iterator.next();
        iterator.remove();
        items.remove(victim);
        if (bucket.isEmpty()) freqs.remove(minFreq);
    }

    private void refreshMinFreq() {
        minFreq = freqs.keySet().stream().min(Integer::compareTo).orElse(0);
    }
}`, "The Java API is Solution(capacity, DoubleSupplier now), put(key, value[, ttl]), and get(key); a miss returns null. TTL and the injected clock use the same units. Capture one timestamp per operation. A nonpositive TTL removes only that key without admitting an entry or evicting another key. Live updates count as accesses; expired reinsertions start at frequency one. LinkedHashSet buckets keep the oldest key first within each frequency. Live hits and live updates take average O(1) map/set work. A new insertion scans up to n entries for expiry and copies their keys, taking O(n) time and temporary space. Expired reads and nonpositive-TTL removals may scan b frequency buckets to refresh the minimum. Stored entries and buckets use O(n) space."),

    "log-error-parser": bundle(String.raw`
import java.util.*;

class Solution {
    List<List<Object>> topErrors(String logText) {
        return topErrors(logText, 3);
    }

    List<List<Object>> topErrors(String logText, int limit) {
        return List.of();
    }
}`, [
        test("counts errors and sorts ties", "sample", String.raw`
String logText = """
2026-01-01 INFO start
2026-01-01 ERROR timeout
2026-01-01 ERROR bad gateway
2026-01-01 ERROR timeout
2026-01-01 ERROR auth failed
2026-01-01 INFO done
""";
eq(new Solution().topErrors(logText, 2), list(list("timeout", 2), list("auth failed", 1)));`),
        test("returns empty when no error lines exist", "sample", String.raw`
eq(new Solution().topErrors("INFO boot\nWARN retry\nERRORish not a marker"), list());`),
        test("ignores continuations and blank lines", "hidden", String.raw`
String logText = """
2026-01-01 ERROR failed request
    stack line one
    stack line two
    nested ERROR should ignore

2026-01-01 ERROR failed request
2026-01-01 ERROR zeta
2026-01-01 ERROR alpha
""";
eq(new Solution().topErrors(logText, 10), list(list("failed request", 2), list("alpha", 1), list("zeta", 1)));`),
        test("requires space delimited error marker", "hidden", String.raw`
String logs = "ERROR disk full\n2026ERROR disk full\n2026 ERROR disk full";
eq(new Solution().topErrors(logs), list(list("disk full", 1)));`),
        test("keeps message text after the first marker", "hidden", String.raw`
String logs = "t ERROR first ERROR nested\nt ERROR first ERROR nested";
eq(new Solution().topErrors(logs, 1), list(list("first ERROR nested", 2)));`),
        pair("counts one error with the default limit", "sample", "new Solution().topErrors(\"2026-01-01 ERROR disk full\")", "list(list(\"disk full\", 1))"),
        pair("default limit truncates after three distinct errors", "hidden", "new Solution().topErrors(\"t ERROR d\\nt ERROR c\\nt ERROR b\\nt ERROR a\\nt ERROR d\")", "list(list(\"d\", 2), list(\"a\", 1), list(\"b\", 1))"),
        pair("ignores empty error messages", "hidden", "new Solution().topErrors(\"t ERROR   \\nt ERROR useful\")", "list(list(\"useful\", 1))"),
        pair("zero limit returns no rows", "hidden", "new Solution().topErrors(\"t ERROR a\\nt ERROR b\", 0)", "list()"),
        pair("negative limit returns no rows", "hidden", "new Solution().topErrors(\"t ERROR a\", -1)", "list()"),
        test("preserves internal spaces across CRLF and tab continuations", "hidden", String.raw`
String logs = "t ERROR  alpha  beta  \r\n\tt ERROR ignored\r\nt\tERROR\tignored\r\nt ERROR alpha beta\r\nt ERROR alpha  beta";
eq(new Solution().topErrors(logs, 5), list(list("alpha  beta", 2), list("alpha beta", 1)));`),
        test("nonbreaking indentation and message edges are whitespace", "hidden", String.raw`
String logs = "\u00a0t ERROR ignored\nt ERROR \u00a0fact\u00a0\nt ERROR fact\nt ERROR \u2007\u202f\t";
eq(new Solution().topErrors(logs), list(list("fact", 2)));`),
        test("equal counts sort messages by Unicode code points", "hidden", String.raw`
String bmp = "\uE000";
String supplementary = "\uD800\uDC00";
String logs = "t ERROR " + supplementary + "\nt ERROR " + bmp;
eq(new Solution().topErrors(logs), list(list(bmp, 1), list(supplementary, 1)));
eq(new Solution().topErrors(logs, 1), list(list(bmp, 1)));`),
        test("recognizes every Python splitlines boundary", "hidden", String.raw`
String[] boundaries = {"\r\n", "\n", "\r", "\u000b", "\f", "\u001c", "\u001d", "\u001e", "\u0085", "\u2028", "\u2029"};
for (String boundary : boundaries) {
    eq(new Solution().topErrors("t ERROR first" + boundary + "t ERROR second"), list(list("first", 1), list("second", 1)));
}`),
    ], String.raw`
import java.util.*;

class Solution {
    List<List<Object>> topErrors(String logText) {
        return topErrors(logText, 3);
    }

    List<List<Object>> topErrors(String logText, int limit) {
        if (limit <= 0) return List.of();
        Map<String, Integer> counts = new HashMap<>();
        for (String line : logText.split("\\r\\n|[\\n\\r\\x0B\\f\\x1C-\\x1E\\x85\\u2028\\u2029]")) {
            if (!line.isEmpty() && isPythonWhitespace(line.codePointAt(0))) continue;
            int marker = line.indexOf(" ERROR ");
            if (marker < 0) continue;
            String message = trimWhitespace(line.substring(marker + " ERROR ".length()));
            if (!message.isEmpty()) counts.put(message, counts.getOrDefault(message, 0) + 1);
        }

        List<List<Object>> result = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : counts.entrySet()) result.add(List.of(entry.getKey(), entry.getValue()));
        result.sort((left, right) -> {
            int byCount = Integer.compare((Integer) right.get(1), (Integer) left.get(1));
            if (byCount != 0) return byCount;
            return compareMessages((String) left.get(0), (String) right.get(0));
        });
        return result.subList(0, Math.min(limit, result.size()));
    }

    private int compareMessages(String left, String right) {
        int i = 0, j = 0;
        while (i < left.length() && j < right.length()) {
            int a = left.codePointAt(i), b = right.codePointAt(j);
            if (a != b) return Integer.compare(a, b);
            i += Character.charCount(a);
            j += Character.charCount(b);
        }
        return Integer.compare(left.length() - i, right.length() - j);
    }

    private boolean isPythonWhitespace(int codePoint) {
        return Character.isWhitespace(codePoint) || Character.isSpaceChar(codePoint) || codePoint == 0x85;
    }

    private String trimWhitespace(String text) {
        int start = 0;
        int end = text.length();
        while (start < end && isPythonWhitespace(text.codePointAt(start))) {
            start += Character.charCount(text.codePointAt(start));
        }
        while (start < end && isPythonWhitespace(text.codePointBefore(end))) {
            end -= Character.charCount(text.codePointBefore(end));
        }
        return text.substring(start, end);
    }
}`, "Use Python-compatible line boundaries and whitespace checks to reject indented lines and trim only message ends, preserving internal spaces. Count suffixes after the first literal ` ERROR `, then sort by count descending and message ascending by Unicode code points. Java's default String.compareTo compares UTF-16 code units, so use an explicit code-point comparator to match Python when BMP and supplementary characters appear in tied messages."),

    "longest-match-tokenizer": bundle(String.raw`
import java.util.*;

class Solution {
    List<String> tokenize(String text, Set<String> vocab) {
        return List.of();
    }
}`, [
        test("uses longest match over shorter prefixes", "sample", String.raw`
eq(new Solution().tokenize("therefore", set("the", "there", "for", "fore")), list("there", "fore"));`),
        test("returns no tokens for whitespace only input", "sample", String.raw`
eq(new Solution().tokenize("  \n\t ", set("a")), list());`),
        test("skips whitespace and handles repeated prefixes", "hidden", String.raw`
eq(new Solution().tokenize("aaab aa ba", set("a", "aa", "aaa", "b", "ba")), list("aaa", "b", "aa", "ba"));`),
        test("reports unknown token position", "hidden", String.raw`
IllegalArgumentException error = null;
try {
    new Solution().tokenize("abc", set("ab"));
} catch (IllegalArgumentException caught) {
    error = caught;
}
check(error != null && error.getMessage().contains("position 2"));`),
        test("rejects empty vocabulary tokens", "hidden", String.raw`
throwsException(IllegalArgumentException.class, () -> new Solution().tokenize("abc", set("", "abc")));`),
        pair("tokenizes one exact vocabulary item", "sample", "new Solution().tokenize(\"cat\", set(\"cat\"))", "list(\"cat\")"),
        pair("restarts longest matching after each token", "hidden", "new Solution().tokenize(\"aaaa\", set(\"a\", \"aa\", \"aaa\"))", "list(\"aaa\", \"a\")"),
        pair("ignores surrounding whitespace", "hidden", "new Solution().tokenize(\" \\talpha\\n \" , set(\"alpha\"))", "list(\"alpha\")"),
        test("literal NUL is an ordinary vocabulary character", "hidden", String.raw`
eq(new Solution().tokenize("a\0b", set("a", "\0", "b")), list("a", "\0", "b"));
eq(new Solution().tokenize("a\0b", set("a", "a\0", "b")), list("a\0", "b"));`),
        test("whitespace within a token participates in longest matching", "hidden", String.raw`
eq(new Solution().tokenize("a b", set("a b", "a", "b")), list("a b"));`),
        test("unknown offsets count Unicode code points including skipped whitespace", "hidden", String.raw`
for (String text : list("😀x", " \t😀x")) {
    IllegalArgumentException error = null;
    try {
        new Solution().tokenize(text, set("😀"));
    } catch (IllegalArgumentException caught) {
        error = caught;
    }
    int expected = text.startsWith(" ") ? 3 : 1;
    check(error != null && error.getMessage().contains("position " + expected));
}`),
        test("greedy matching does not backtrack after a later failure", "hidden", String.raw`
IllegalArgumentException error = null;
try {
    new Solution().tokenize("abcd", set("ab", "abc", "cd"));
} catch (IllegalArgumentException caught) {
    error = caught;
}
check(error != null && error.getMessage().contains("position 3"));`),
    ], String.raw`
import java.util.*;

class Solution {
    private static class TrieNode {
        final Map<Integer, TrieNode> children = new HashMap<>();
        String terminal = null;
    }

    List<String> tokenize(String text, Set<String> vocab) {
        TrieNode trie = buildTrie(vocab);
        List<String> tokens = new ArrayList<>();
        int i = 0;
        while (i < text.length()) {
            int codePoint = text.codePointAt(i);
            if (Character.isWhitespace(codePoint)) {
                i += Character.charCount(codePoint);
                continue;
            }

            TrieNode node = trie;
            String best = null;
            int bestEnd = i;
            int j = i;
            while (j < text.length()) {
                int nextCodePoint = text.codePointAt(j);
                TrieNode next = node.children.get(nextCodePoint);
                if (next == null) break;
                node = next;
                j += Character.charCount(nextCodePoint);
                if (node.terminal != null) {
                    best = node.terminal;
                    bestEnd = j;
                }
            }

            if (best == null) throw new IllegalArgumentException("unknown token at position " + text.codePointCount(0, i));
            tokens.add(best);
            i = bestEnd;
        }
        return tokens;
    }

    private TrieNode buildTrie(Set<String> vocab) {
        TrieNode root = new TrieNode();
        for (String token : vocab) {
            if (token.isEmpty()) throw new IllegalArgumentException("empty token");
            TrieNode node = root;
            for (int i = 0; i < token.length();) {
                int codePoint = token.codePointAt(i);
                node = node.children.computeIfAbsent(codePoint, ignored -> new TrieNode());
                i += Character.charCount(codePoint);
            }
            node.terminal = token;
        }
        return root;
    }
}`, "Store terminals separately from Unicode code-point edges, choose the longest token greedily without backtracking, and report unknown offsets in original-text code points."),

    "lru-ttl-cache": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    Solution(int capacity, DoubleSupplier now) {
    }

    void put(String key, Object value) {
        put(key, value, null);
    }

    void put(String key, Object value, Double ttl) {
    }

    Object get(String key) {
        return null;
    }
}`, [
        test("evicts least recently used entry", "sample", String.raw`
Solution cache = new Solution(2, () -> 0.0);
cache.put("a", 1);
cache.put("b", 2);
eq(cache.get("a"), 1);
cache.put("c", 3);
check(cache.get("b") == null);
eq(cache.get("a"), 1);
eq(cache.get("c"), 3);`),
        test("updates existing keys and recency", "sample", String.raw`
Solution cache = new Solution(2, () -> 0.0);
cache.put("a", 1);
cache.put("b", 2);
cache.put("a", 10);
cache.put("c", 3);
eq(cache.get("a"), 10);
check(cache.get("b") == null);
eq(cache.get("c"), 3);`),
        test("removes expired entries before LRU eviction", "hidden", String.raw`
double[] clock = {0.0};
Solution cache = new Solution(2, () -> clock[0]);
cache.put("expired_mru", 1, 5.0);
cache.put("live_lru", 2);
eq(cache.get("expired_mru"), 1);
clock[0] = 5.0;
cache.put("new", 3);
eq(cache.get("live_lru"), 2);
eq(cache.get("new"), 3);
check(cache.get("expired_mru") == null);`),
        test("ttl zero expires immediately", "hidden", String.raw`
Solution cache = new Solution(2, () -> 10.0);
cache.put("a", 1, 0.0);
check(cache.get("a") == null);
cache.put("b", 2);
eq(cache.get("b"), 2);`),
        test("zero capacity stores no entries", "hidden", String.raw`
Solution cache = new Solution(0, () -> 0.0);
cache.put("a", 1);
check(cache.get("a") == null);`),
        test("negative capacity stores no entries", "hidden", String.raw`
Solution cache = new Solution(-1, () -> 0.0);
cache.put("a", 1);
cache.put("b", 2, 5.0);
check(cache.get("a") == null);
check(cache.get("b") == null);`),
        pair("returns null for missing keys", "sample", "cache.get(\"missing\")", "null", String.raw`
Solution cache = new Solution(2, () -> 0.0);`),
        pair("updating a key replaces its ttl", "hidden", "cache.get(\"a\")", "2", String.raw`
double[] clock = {0.0};
Solution cache = new Solution(2, () -> clock[0]);
cache.put("a", 1, 2.0);
clock[0] = 1.0;
cache.put("a", 2, 5.0);
clock[0] = 2.0;`),
        pair("capacity one evicts the previous key", "hidden", "list(cache.get(\"a\"), cache.get(\"b\"))", "list(null, 2)", String.raw`
Solution cache = new Solution(1, () -> 0.0);
cache.put("a", 1);
cache.put("b", 2);`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    private class Entry {
        final Object value;
        final Double expiresAt;

        Entry(Object value, Double expiresAt) {
            this.value = value;
            this.expiresAt = expiresAt;
        }
    }

    private final int capacity;
    private final DoubleSupplier now;
    private final LinkedHashMap<String, Entry> items = new LinkedHashMap<>(16, 0.75f, true);

    Solution(int capacity, DoubleSupplier now) {
        this.capacity = Math.max(0, capacity);
        this.now = now;
    }

    void put(String key, Object value) {
        put(key, value, null);
    }

    void put(String key, Object value, Double ttl) {
        Double expiresAt = ttl == null ? null : now.getAsDouble() + ttl;
        items.put(key, new Entry(value, expiresAt));
        if (items.size() <= capacity) return;
        cleanupExpired();
        while (items.size() > capacity) {
            Iterator<String> iterator = items.keySet().iterator();
            iterator.next();
            iterator.remove();
        }
    }

    Object get(String key) {
        Entry entry = items.get(key);
        if (entry == null) return null;
        if (expired(entry)) {
            items.remove(key);
            return null;
        }
        return entry.value;
    }

    private boolean expired(Entry entry) {
        return entry.expiresAt != null && now.getAsDouble() >= entry.expiresAt;
    }

    private void cleanupExpired() {
        Iterator<Map.Entry<String, Entry>> iterator = items.entrySet().iterator();
        while (iterator.hasNext()) {
            if (expired(iterator.next().getValue())) iterator.remove();
        }
    }
}`, "LinkedHashMap with access order handles LRU. Expired entries are removed before capacity eviction."),

    "model-fallback-router": bundle(String.raw`
import java.util.*;

class Solution {
    String chooseModel(Map<String, Object> request, List<Map<String, Object>> candidates) {
        return null;
    }
}`, [
        test("public chooses cheapest eligible model", "sample", String.raw`
Map<String, Object> request = map("capabilities", list("tool_use"), "tokens", 100);
List<Map<String, Object>> models = list(
    map("id", "fast", "healthy", true, "capabilities", list("tool_use"), "remaining_tokens", 500, "latency_ms", 20, "cost", 3),
    map("id", "cheap", "healthy", true, "capabilities", list("tool_use", "vision"), "remaining_tokens", 200, "latency_ms", 80, "cost", 1)
);
eq(new Solution().chooseModel(request, models), "cheap");`),
        test("public filters unhealthy and under quota", "sample", String.raw`
Map<String, Object> request = map("capabilities", list(), "tokens", 50);
List<Map<String, Object>> models = list(
    map("id", "down", "healthy", false, "capabilities", list(), "remaining_tokens", 1000, "latency_ms", 1, "cost", 0),
    map("id", "empty", "healthy", true, "capabilities", list(), "remaining_tokens", 10, "latency_ms", 1, "cost", 0),
    map("id", "ok", "healthy", true, "capabilities", list(), "remaining_tokens", 50, "latency_ms", 10, "cost", 2)
);
eq(new Solution().chooseModel(request, models), "ok");`),
        test("private requires all capabilities", "hidden", String.raw`
Map<String, Object> request = map("capabilities", list("vision", "json"), "tokens", 1);
List<Map<String, Object>> models = list(
    map("id", "partial", "healthy", true, "capabilities", list("vision"), "remaining_tokens", 10, "latency_ms", 1, "cost", 1),
    map("id", "full", "healthy", true, "capabilities", list("vision", "json"), "remaining_tokens", 10, "latency_ms", 2, "cost", 2)
);
eq(new Solution().chooseModel(request, models), "full");`),
        test("private applies latency ceiling", "hidden", String.raw`
Map<String, Object> request = map("capabilities", list(), "tokens", 1, "max_latency_ms", 50);
List<Map<String, Object>> models = list(
    map("id", "slow-cheap", "healthy", true, "capabilities", list(), "remaining_tokens", 10, "latency_ms", 100, "cost", 0),
    map("id", "fast-ok", "healthy", true, "capabilities", list(), "remaining_tokens", 10, "latency_ms", 50, "cost", 2)
);
        eq(new Solution().chooseModel(request, models), "fast-ok");`),
        test("private missing latency ceiling allows slower cheaper model", "hidden", String.raw`
Map<String, Object> request = map("capabilities", list(), "tokens", 1);
List<Map<String, Object>> models = list(
    map("id", "slow-cheap", "healthy", true, "capabilities", list(), "remaining_tokens", 10, "latency_ms", 100, "cost", 0),
    map("id", "fast-ok", "healthy", true, "capabilities", list(), "remaining_tokens", 10, "latency_ms", 50, "cost", 2)
);
eq(new Solution().chooseModel(request, models), "slow-cheap");`),
        test("private tie breaks by latency then id", "hidden", String.raw`
Map<String, Object> request = map("capabilities", list(), "tokens", 1);
List<Map<String, Object>> models = list(
    map("id", "b", "healthy", true, "capabilities", list(), "remaining_tokens", 10, "latency_ms", 5, "cost", 1),
    map("id", "a", "healthy", true, "capabilities", list(), "remaining_tokens", 10, "latency_ms", 5, "cost", 1),
    map("id", "c", "healthy", true, "capabilities", list(), "remaining_tokens", 10, "latency_ms", 2, "cost", 1)
);
eq(new Solution().chooseModel(request, models), "c");
check(new Solution().chooseModel(map("capabilities", list("missing"), "tokens", 1), models) == null);`),
        pair("public returns null with no candidates", "sample", "new Solution().chooseModel(map(\"capabilities\", list(), \"tokens\", 0), list())", "null"),
        pair("private breaks exact ties by id", "hidden", "new Solution().chooseModel(request, models)", "\"alpha\"", String.raw`
Map<String, Object> request = map("capabilities", list(), "tokens", 1);
List<Map<String, Object>> models = list(
    map("id", "zeta", "healthy", true, "capabilities", list(), "remaining_tokens", 1, "latency_ms", 5, "cost", 1),
    map("id", "alpha", "healthy", true, "capabilities", list(), "remaining_tokens", 1, "latency_ms", 5, "cost", 1)
);`),
        pair("private leaves candidate records unchanged", "hidden", "models", "list(map(\"id\", \"m\", \"healthy\", true, \"capabilities\", list(), \"remaining_tokens\", 2, \"latency_ms\", 5, \"cost\", 1))", String.raw`
Map<String, Object> request = map("capabilities", list(), "tokens", 1);
List<Map<String, Object>> models = list(map("id", "m", "healthy", true, "capabilities", list(), "remaining_tokens", 2, "latency_ms", 5, "cost", 1));
new Solution().chooseModel(request, models);`),
        pair("private zero latency ceiling is inclusive", "hidden", "new Solution().chooseModel(request, models)", "\"zero\"", String.raw`
Map<String, Object> request = map("capabilities", list(), "tokens", 0, "max_latency_ms", 0);
List<Map<String, Object>> models = list(
    map("id", "slow", "healthy", true, "capabilities", list(), "remaining_tokens", 0, "latency_ms", 1, "cost", 0),
    map("id", "zero", "healthy", true, "capabilities", list(), "remaining_tokens", 0, "latency_ms", 0, "cost", 1)
);`),
    ], String.raw`
import java.util.*;

class Solution {
    @SuppressWarnings("unchecked")
    String chooseModel(Map<String, Object> request, List<Map<String, Object>> candidates) {
        Set<String> required = new HashSet<>((List<String>) request.getOrDefault("capabilities", List.of()));
        int tokens = ((Number) request.getOrDefault("tokens", 0)).intValue();
        Number maxLatency = (Number) request.get("max_latency_ms");
        List<Map<String, Object>> eligible = new ArrayList<>();

        for (Map<String, Object> model : candidates) {
            if (!Boolean.TRUE.equals(model.get("healthy"))) continue;
            if (!new HashSet<>((List<String>) model.getOrDefault("capabilities", List.of())).containsAll(required)) continue;
            if (((Number) model.getOrDefault("remaining_tokens", 0)).intValue() < tokens) continue;
            if (maxLatency != null && ((Number) model.getOrDefault("latency_ms", 0)).doubleValue() > maxLatency.doubleValue()) continue;
            eligible.add(model);
        }
        if (eligible.isEmpty()) return null;

        Map<String, Object> best = Collections.min(eligible, (left, right) -> {
            int byCost = Double.compare(number(left, "cost"), number(right, "cost"));
            if (byCost != 0) return byCost;
            int byLatency = Double.compare(number(left, "latency_ms"), number(right, "latency_ms"));
            if (byLatency != 0) return byLatency;
            return ((String) left.get("id")).compareTo((String) right.get("id"));
        });
        return (String) best.get("id");
    }

    private double number(Map<String, Object> values, String key) {
        return ((Number) values.getOrDefault(key, 0)).doubleValue();
    }
}`, "Filter for health, capabilities, quota, and latency first, then select the minimum eligible candidate by cost, latency, and id."),

    "priority-deadline-scheduler": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    Solution(DoubleSupplier now) {
    }

    void add(Object taskId, int priority, double runAt) {
        add(taskId, priority, runAt, null);
    }

    void add(Object taskId, int priority, double runAt, Double ttl) {
    }

    Object pop() {
        return null;
    }
}`, [
        test("returns due tasks by priority then insertion order", "sample", String.raw`
double[] clock = {0.0};
Solution scheduler = new Solution(() -> clock[0]);
scheduler.add("low", 1, 0);
scheduler.add("high", 5, 0);
scheduler.add("high2", 5, 0);
eq(scheduler.pop(), "high");
eq(scheduler.pop(), "high2");
eq(scheduler.pop(), "low");
check(scheduler.pop() == null);`),
        test("returns null for empty or future-only queues", "sample", String.raw`
double[] clock = {0.0};
Solution scheduler = new Solution(() -> clock[0]);
check(scheduler.pop() == null);
scheduler.add("later", 10, 5);
check(scheduler.pop() == null);
clock[0] = 5.0;
eq(scheduler.pop(), "later");`),
        test("waits for run_at and skips expired tasks", "hidden", String.raw`
double[] clock = {10.0};
Solution scheduler = new Solution(() -> clock[0]);
scheduler.add("expired", 100, 8, 2.0);
scheduler.add("ready", 1, 9, 10.0);
scheduler.add("future", 50, 12, 10.0);
eq(scheduler.pop(), "ready");
check(scheduler.pop() == null);
clock[0] = 12.0;
eq(scheduler.pop(), "future");
check(scheduler.pop() == null);`),
        test("expires tasks at deadline boundary", "hidden", String.raw`
double[] clock = {0.0};
Solution scheduler = new Solution(() -> clock[0]);
scheduler.add("short", 10, 5, 2.0);
clock[0] = 7.0;
check(scheduler.pop() == null);`),
        test("drops expired tasks but keeps live candidates", "hidden", String.raw`
double[] clock = {10.0};
Solution scheduler = new Solution(() -> clock[0]);
scheduler.add("expired", 100, 0, 5.0);
scheduler.add("live", 1, 0);
eq(scheduler.pop(), "live");
check(scheduler.pop() == null);`),
        pair("runs a task exactly at runAt", "sample", "scheduler.pop()", "\"due\"", String.raw`
Solution scheduler = new Solution(() -> 5.0);
scheduler.add("due", 1, 5.0);`),
        pair("task without ttl remains live", "hidden", "scheduler.pop()", "\"durable\"", String.raw`
Solution scheduler = new Solution(() -> 100.0);
scheduler.add("durable", 1, 0.0);`),
        pair("zero ttl expires at runAt", "hidden", "scheduler.pop()", "null", String.raw`
Solution scheduler = new Solution(() -> 5.0);
scheduler.add("instant", 10, 5.0, 0.0);`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    private class Task {
        final Object id;
        final int priority;
        final double runAt;
        final Double ttl;
        final int sequence;

        Task(Object id, int priority, double runAt, Double ttl, int sequence) {
            this.id = id;
            this.priority = priority;
            this.runAt = runAt;
            this.ttl = ttl;
            this.sequence = sequence;
        }
    }

    private final DoubleSupplier now;
    private final List<Task> tasks = new ArrayList<>();
    private int sequence = 0;

    Solution(DoubleSupplier now) {
        this.now = now;
    }

    void add(Object taskId, int priority, double runAt) {
        add(taskId, priority, runAt, null);
    }

    void add(Object taskId, int priority, double runAt, Double ttl) {
        tasks.add(new Task(taskId, priority, runAt, ttl, sequence++));
    }

    Object pop() {
        double t = now.getAsDouble();
        tasks.removeIf(task -> task.ttl != null && t >= task.runAt + task.ttl);
        Task best = null;
        for (Task task : tasks) {
            if (task.runAt > t) continue;
            if (best == null || task.priority > best.priority || (task.priority == best.priority && task.sequence < best.sequence)) {
                best = task;
            }
        }
        if (best == null) return null;
        tasks.remove(best);
        return best.id;
    }
}`, "A list scan keeps semantics clear: remove expired work, choose due item by priority, then insertion order."),

    "prompt-section-extractor": bundle(String.raw`
import java.util.*;

class Solution {
    Map<String, Object> extractSections(String text) {
        return new LinkedHashMap<>();
    }
}`, [
        test("public extracts one section", "sample", String.raw`
eq(new Solution().extractSections("<<<system>>>\nBe brief.\n<<<END>>>\n"), map("sections", map("system", "Be brief."), "errors", list()));`),
        test("public preserves internal newlines", "sample", String.raw`
Map<String, Object> result = new Solution().extractSections("<<<context>>>\nline1\nline2\n<<<END>>>");
eq(result.get("sections"), map("context", "line1\nline2"));`),
        test("private detects outside text", "hidden", String.raw`
Map<String, Object> result = new Solution().extractSections("hello\n<<<a>>>\nx\n<<<END>>>\n");
eq(result.get("sections"), map("a", "x"));
eq(result.get("errors"), list("outside_text"));`),
        test("private reports duplicate section", "hidden", String.raw`
String text = "<<<a>>>\n1\n<<<END>>>\n<<<a>>>\n2\n<<<END>>>";
Map<String, Object> result = new Solution().extractSections(text);
eq(result.get("sections"), map("a", "1"));
eq(result.get("errors"), list("duplicate:a"));`),
        test("private reports unterminated section", "hidden", String.raw`
Map<String, Object> result = new Solution().extractSections("<<<task>>>\nDo it");
eq(result.get("sections"), map());
eq(result.get("errors"), list("unterminated:task"));`),
        pair("public blank input has no sections or errors", "sample", "new Solution().extractSections(\" \\n\\t\")", "map(\"sections\", map(), \"errors\", list())"),
        test("Unicode whitespace outside is blank while body whitespace is preserved", "hidden", String.raw`
String blank = "\u00a0\u2007\u202f\u0085\u001f\n";
eq(new Solution().extractSections(blank), map("sections", map(), "errors", list()));
eq(new Solution().extractSections(blank + "<<<a>>>\n\u00a0\n<<<END>>>"),
    map("sections", map("a", "\u00a0"), "errors", list()));`),
        pair("private keeps an empty section", "hidden", "new Solution().extractSections(\"<<<empty>>>\\n<<<END>>>\")", "map(\"sections\", map(\"empty\", \"\"), \"errors\", list())"),
        pair("private preserves marker-like content inside a section", "hidden", "new Solution().extractSections(\"<<<a>>>\\n<<<nested>>>\\n<<<END>>>\")", "map(\"sections\", map(\"a\", \"<<<nested>>>\"), \"errors\", list())"),
        test("preserves a blank content line immediately before END", "hidden", String.raw`
eq(new Solution().extractSections("<<<context>>>\nfirst line\n\n<<<END>>>"),
    map("sections", map("context", "first line\n"), "errors", list()));`),
        test("reports outside text once without changing discovery order", "hidden", String.raw`
String text = "<<<a>>>\nfirst\n<<<END>>>\n<<<a>>>\nduplicate\n<<<END>>>\n"
    + "outside\nmore outside\n<<<a>>>\nunfinished";
eq(new Solution().extractSections(text), map("sections", map("a", "first"),
    "errors", list("duplicate:a", "outside_text", "unterminated:a")));`),
    ], String.raw`
import java.util.*;

class Solution {
    Map<String, Object> extractSections(String text) {
        Map<String, String> sections = new LinkedHashMap<>();
        List<String> errors = new ArrayList<>();
        boolean outsideSeen = false;
        String current = null;
        List<String> buffer = new ArrayList<>();

        for (String line : text.split("\\R", -1)) {
            String start = startName(line);
            if (current == null) {
                if (start != null) {
                    current = start;
                    buffer.clear();
                } else if (!isBlank(line) && !outsideSeen) {
                    errors.add("outside_text");
                    outsideSeen = true;
                }
                continue;
            }

            if (line.equals("<<<END>>>")) {
                if (sections.containsKey(current)) errors.add("duplicate:" + current);
                else sections.put(current, String.join("\n", buffer));
                current = null;
                buffer.clear();
            } else {
                buffer.add(line);
            }
        }

        if (current != null) errors.add("unterminated:" + current);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sections", sections);
        result.put("errors", errors);
        return result;
    }

    private boolean isBlank(String line) {
        return line.codePoints().allMatch(codePoint -> Character.isWhitespace(codePoint)
            || Character.isSpaceChar(codePoint) || codePoint == 0x85);
    }

    private String startName(String line) {
        if (line.startsWith("<<<") && line.endsWith(">>>") && !line.equals("<<<END>>>")) {
            String name = line.substring(3, line.length() - 3);
            return name.isEmpty() ? null : name;
        }
        return null;
    }
}`, "Use explicit parser state for section bodies and a separate flag to report outside text once without repeatedly scanning prior errors."),

    "rag-chunk-selector": bundle(String.raw`
import java.util.*;

class Solution {
    List<String> selectChunks(List<Map<String, Object>> chunks, int k) {
        return selectChunks(chunks, k, 2);
    }

    List<String> selectChunks(List<Map<String, Object>> chunks, int k, int maxPerDoc) {
        return List.of();
    }
}`, [
        test("deduplicates normalized text and limits by k", "sample", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "a", "doc_id", "d1", "text", "Hello world", "score", 0.9),
    map("id", "b", "doc_id", "d2", "text", "hello   world", "score", 0.8),
    map("id", "c", "doc_id", "d2", "text", "new fact", "score", 0.7)
);
eq(new Solution().selectChunks(chunks, 2), list("a", "c"));`),
        test("enforces per document limit", "sample", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "a1", "doc_id", "a", "score", 0.9, "text", "alpha"),
    map("id", "a2", "doc_id", "a", "score", 0.8, "text", "beta"),
    map("id", "b1", "doc_id", "b", "score", 0.7, "text", "gamma")
);
eq(new Solution().selectChunks(chunks, 3, 1), list("a1", "b1"));`),
        test("uses score tie id and max per doc", "hidden", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "z", "doc_id", "d1", "text", "z", "score", 0.7),
    map("id", "a", "doc_id", "d1", "text", "a", "score", 0.9),
    map("id", "b", "doc_id", "d1", "text", "b", "score", 0.9),
    map("id", "c", "doc_id", "d1", "text", "c", "score", 0.8),
    map("id", "d", "doc_id", "d2", "text", "a", "score", 0.95),
    map("id", "e", "doc_id", "d3", "text", "e", "score", 0.6)
);
eq(new Solution().selectChunks(chunks, 5, 2), list("d", "b", "c", "e"));
eq(chunks.get(0).get("id"), "z");`),
        test("signed zero scores tie by id", "hidden", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "a", "doc_id", "d1", "text", "alpha", "score", -0.0),
    map("id", "b", "doc_id", "d2", "text", "beta", "score", 0.0)
);
eq(new Solution().selectChunks(chunks, 2), list("a", "b"));`),
        test("deduplicates text case and whitespace", "hidden", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "first", "doc_id", "a", "score", 0.9, "text", "Hello   World"),
    map("id", "dupe", "doc_id", "b", "score", 0.8, "text", "hello world"),
    map("id", "other", "doc_id", "b", "score", 0.7, "text", "different")
);
eq(new Solution().selectChunks(chunks, 3), list("first", "other"));`),
        test("deduplicates leading nonbreaking and Unicode whitespace", "hidden", String.raw`
String nbsp = new String(Character.toChars(0x00A0));
String separator = new String(Character.toChars(0x001C));
List<Map<String, Object>> chunks = list(
    map("id", "first", "doc_id", "a", "score", 0.9, "text", nbsp + "Hello" + separator + "WORLD" + nbsp),
    map("id", "dupe", "doc_id", "b", "score", 0.8, "text", "hello world"),
    map("id", "empty", "doc_id", "b", "score", 0.7, "text", nbsp),
    map("id", "empty-dupe", "doc_id", "c", "score", 0.6, "text", ""),
    map("id", "fact", "doc_id", "c", "score", 0.5, "text", "different")
);
eq(new Solution().selectChunks(chunks, 5), list("first", "empty", "fact"));`),
        test("returns fewer than k when filters remove candidates", "hidden", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "a1", "doc_id", "a", "score", 0.9, "text", "one"),
    map("id", "a2", "doc_id", "a", "score", 0.8, "text", "two"),
    map("id", "a3", "doc_id", "a", "score", 0.7, "text", "three")
);
eq(new Solution().selectChunks(chunks, 5, 2), list("a1", "a2"));`),
        pair("empty chunk list returns no ids", "sample", "new Solution().selectChunks(list(), 3)", "list()"),
        pair("zero k selects nothing", "hidden", "new Solution().selectChunks(chunks, 0)", "list()", String.raw`
List<Map<String, Object>> chunks = list(map("id", "a", "doc_id", "d", "text", "fact", "score", 1.0));`),
        pair("whitespace-only text is selected once", "hidden", "new Solution().selectChunks(chunks, 3)", "list(\"a\", \"c\")", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "a", "doc_id", "d1", "text", "   ", "score", 0.9),
    map("id", "b", "doc_id", "d2", "text", "\n\t", "score", 0.8),
    map("id", "c", "doc_id", "d2", "text", "fact", "score", 0.7)
);`),
        pair("hidden pure equal-score tie by id", "hidden", "new Solution().selectChunks(chunks, 2)", "list(\"a\", \"b\")", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "b", "doc_id", "d2", "text", "beta", "score", 0.9),
    map("id", "a", "doc_id", "d1", "text", "alpha", "score", 0.9),
    map("id", "c", "doc_id", "d3", "text", "gamma", "score", 0.5)
);`),
        pair("hidden empty string text selected once", "hidden", "new Solution().selectChunks(chunks, 3)", "list(\"a\", \"c\")", String.raw`
List<Map<String, Object>> chunks = list(
    map("id", "a", "doc_id", "d1", "text", "", "score", 0.9),
    map("id", "b", "doc_id", "d2", "text", "", "score", 0.8),
    map("id", "c", "doc_id", "d2", "text", "fact", "score", 0.7)
);`),
    ], String.raw`
import java.util.*;

class Solution {
    List<String> selectChunks(List<Map<String, Object>> chunks, int k) {
        return selectChunks(chunks, k, 2);
    }

    List<String> selectChunks(List<Map<String, Object>> chunks, int k, int maxPerDoc) {
        if (k <= 0 || maxPerDoc <= 0) return new ArrayList<>();
        List<Map<String, Object>> ranked = new ArrayList<>(chunks);
        ranked.sort((left, right) -> {
            double leftScore = number(left, "score"), rightScore = number(right, "score");
            int byScore = leftScore == rightScore ? 0 : Double.compare(rightScore, leftScore);
            if (byScore != 0) return byScore;
            return ((String) left.get("id")).compareTo((String) right.get("id"));
        });

        Set<String> seenText = new HashSet<>();
        Map<String, Integer> docCounts = new HashMap<>();
        List<String> selected = new ArrayList<>();
        for (Map<String, Object> chunk : ranked) {
            String text = normalize((String) chunk.get("text"));
            String docId = (String) chunk.get("doc_id");
            if (seenText.contains(text) || docCounts.getOrDefault(docId, 0) >= maxPerDoc) continue;
            selected.add((String) chunk.get("id"));
            seenText.add(text);
            docCounts.put(docId, docCounts.getOrDefault(docId, 0) + 1);
            if (selected.size() == k) break;
        }
        return selected;
    }

    private double number(Map<String, Object> chunk, String key) {
        return ((Number) chunk.get(key)).doubleValue();
    }

    private String normalize(String text) {
        return text.toLowerCase(Locale.ROOT).replaceAll("(?U)[\\s\\x1C-\\x1F]+", " ").strip();
    }
}`, "Sort by score then id. Track normalized text and per-document counts while selecting."),

    "retry-backoff-planner": bundle(String.raw`
import java.util.*;

class Solution {
    Solution(int maxAttempts, double baseDelay, double maxDelay, Set<String> retryableErrors) {
    }

    Double nextDelay(int attempt, String errorCode) {
        return null;
    }
}`, [
        test("public capped exponential delays", "sample", String.raw`
Solution policy = new Solution(5, 0.5, 5, set("timeout", "rate_limit"));
eq(policy.nextDelay(1, "timeout").doubleValue(), 0.5);
eq(policy.nextDelay(2, "timeout").doubleValue(), 1.0);
eq(policy.nextDelay(4, "rate_limit").doubleValue(), 4.0);`),
        test("public stops after max attempts", "sample", String.raw`
Solution policy = new Solution(3, 1, 10, set("timeout"));
eq(policy.nextDelay(2, "timeout").doubleValue(), 2.0);
check(policy.nextDelay(3, "timeout") == null);
check(policy.nextDelay(4, "timeout") == null);`),
        test("private rejects non retryable errors", "hidden", String.raw`
Solution policy = new Solution(5, 1, 8, set("timeout"));
check(policy.nextDelay(1, "bad_request") == null);
check(policy.nextDelay(2, "auth") == null);`),
        test("private handles extreme attempts and zero delay", "hidden", String.raw`
Solution zero = new Solution(20000, 0, 5, set("timeout"));
double delay = zero.nextDelay(10000, "timeout");
check(!Double.isNaN(delay));
eq(delay, 0.0);
Solution policy = new Solution(20000, 1, 5, set("timeout"));
eq(policy.nextDelay(Integer.MIN_VALUE, "timeout").doubleValue(), 1.0);
eq(policy.nextDelay(10000, "timeout").doubleValue(), 5.0);
Solution tiny = new Solution(2000, Double.MIN_VALUE, 1, set("timeout"));
eq(tiny.nextDelay(1075, "timeout").doubleValue(), 1.0);`),
        test("private caps long backoff", "hidden", String.raw`
Solution policy = new Solution(10, 3, 20, set("overloaded"));
eq(policy.nextDelay(1, "overloaded").doubleValue(), 3.0);
eq(policy.nextDelay(4, "overloaded").doubleValue(), 20.0);
eq(policy.nextDelay(9, "overloaded").doubleValue(), 20.0);`),
        test("private handles first attempt boundary", "hidden", String.raw`
Solution policy = new Solution(1, 2, 5, set("timeout"));
check(policy.nextDelay(1, "timeout") == null);
eq(policy.nextDelay(0, "timeout").doubleValue(), 2.0);`),
        pair("public first retry uses base delay", "sample", "policy.nextDelay(1, \"timeout\").doubleValue()", "0.25", String.raw`
Solution policy = new Solution(3, 0.25, 10, set("timeout"));`),
        pair("private caps the first retry", "hidden", "policy.nextDelay(1, \"timeout\").doubleValue()", "3.0", String.raw`
Solution policy = new Solution(3, 10, 3, set("timeout"));`),
        pair("private error codes are case sensitive", "hidden", "policy.nextDelay(1, \"Timeout\")", "null", String.raw`
Solution policy = new Solution(3, 1, 5, set("timeout"));`),
    ], String.raw`
import java.util.*;

class Solution {
    private final int maxAttempts;
    private final double baseDelay;
    private final double maxDelay;
    private final Set<String> retryableErrors;

    Solution(int maxAttempts, double baseDelay, double maxDelay, Set<String> retryableErrors) {
        this.maxAttempts = maxAttempts;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
        this.retryableErrors = new HashSet<>(retryableErrors);
    }

    Double nextDelay(int attempt, String errorCode) {
        if (!retryableErrors.contains(errorCode)) return null;
        if (attempt >= maxAttempts) return null;
        int exponent = attempt <= 1 ? 0 : attempt - 1;
        if (baseDelay == 0 || maxDelay == 0) return 0.0;
        return Math.min(maxDelay, Math.scalb(baseDelay, exponent));
    }
}`, "Check retryability and attempt budget before returning capped exponential delay."),

    "same-host-crawler": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    List<String> crawl(String startUrl, Function<String, List<String>> getLinks) {
        return List.of();
    }
}`, [
        test("filters off-host links and keeps BFS order", "sample", String.raw`
Map<String, List<String>> graph = new HashMap<>();
graph.put("https://docs.example.com/", list("/a", "https://docs.example.com/b", "https://other.example.com/x"));
graph.put("https://docs.example.com/a", list("/c"));
graph.put("https://docs.example.com/b", list("/c"));
graph.put("https://docs.example.com/c", list());
eq(new Solution().crawl("https://docs.example.com/", url -> graph.getOrDefault(url, list())), list(
    "https://docs.example.com/",
    "https://docs.example.com/a",
    "https://docs.example.com/b",
    "https://docs.example.com/c"
));`),
        test("resolves relative links against current pages", "sample", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://docs.test/a/index.html", list("../b", "./c"));
pages.put("https://docs.test/b", list());
pages.put("https://docs.test/a/c", list());
eq(new Solution().crawl("https://docs.test/a/index.html", url -> pages.getOrDefault(url, list())), list(
    "https://docs.test/a/index.html",
    "https://docs.test/b",
    "https://docs.test/a/c"
));`),
        test("handles cycles and malformed links", "hidden", String.raw`
Map<String, List<String>> graph = new HashMap<>();
graph.put("https://a.test/root", list("child", "not a url", "mailto:nope@example.com"));
graph.put("https://a.test/child", list("/root", "https://a.test/leaf#frag", "https://b.test/off"));
graph.put("https://a.test/leaf#frag", list());
eq(new Solution().crawl("https://a.test/root", url -> graph.getOrDefault(url, list())), list(
    "https://a.test/root",
    "https://a.test/child",
    "https://a.test/leaf#frag"
));`),
        test("treats query strings as distinct same host urls", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://app.test/start", list("/item?id=1", "/item?id=1", "/item?id=2"));
pages.put("https://app.test/item?id=1", list());
pages.put("https://app.test/item?id=2", list());
List<String> calls = new ArrayList<>();
List<String> result = new Solution().crawl("https://app.test/start", url -> {
    calls.add(url);
    return pages.getOrDefault(url, list());
});
eq(result, list(
    "https://app.test/start",
    "https://app.test/item?id=1",
    "https://app.test/item?id=2"
));
eq(calls, list(
    "https://app.test/start",
    "https://app.test/item?id=1",
    "https://app.test/item?id=2"
));`),
        test("resolves query fragment and protocol-relative links", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://a.test/root", list("?q=1", "#frag", "", "//a.test/next", "//b.test/off"));
pages.put("https://a.test/root?q=1", list());
pages.put("https://a.test/root#frag", list());
pages.put("https://a.test/next", list());
eq(new Solution().crawl("https://a.test/root", url -> pages.getOrDefault(url, list())), list(
    "https://a.test/root",
    "https://a.test/root?q=1",
    "https://a.test/root#frag",
    "https://a.test/next"
));`),
        test("allows http and https on the same host", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("http://app.test/", list("https://app.test/secure", "mailto:team@app.test"));
pages.put("https://app.test/secure", list());
eq(new Solution().crawl("http://app.test/", url -> pages.getOrDefault(url, list())), list("http://app.test/", "https://app.test/secure"));`),
        test("rejects Unicode whitespace", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
String nbsp = new String(Character.toChars(0x00A0));
pages.put("https://a.test/root", list("/safe", "/bad" + nbsp + "path"));
pages.put("https://a.test/safe", list());
eq(new Solution().crawl("https://a.test/root", url -> pages.getOrDefault(url, list())), list(
    "https://a.test/root",
    "https://a.test/safe"
));`),
        test("normalizes mixed-case HTTP schemes", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://a.test/root", list("HTTPS://a.test/secure"));
pages.put("https://a.test/secure", list());
eq(new Solution().crawl("https://a.test/root", url -> pages.getOrDefault(url, list())), list(
    "https://a.test/root",
    "https://a.test/secure"
));`),
        test("same-scheme relative references inherit the current authority", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://a.test/dir/root?q=old", list("https:child", "HTTPS:/rooted", "https:?q=new", "https:#frag"));
eq(new Solution().crawl("https://a.test/dir/root?q=old", url -> pages.getOrDefault(url, list())), list(
    "https://a.test/dir/root?q=old",
    "https://a.test/dir/child",
    "https://a.test/rooted",
    "https://a.test/dir/root?q=new",
    "https://a.test/dir/root?q=old#frag"
));`),
        test("preserves rooted path identity and fetches each URL once", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://a.test/root", list("/a/", "/a", "/a//b", "/a/b", "/a/"));
List<String> calls = new ArrayList<>();
List<String> result = new Solution().crawl("https://a.test/root", url -> {
    calls.add(url);
    return pages.getOrDefault(url, list());
});
eq(result, list("https://a.test/root", "https://a.test/a/", "https://a.test/a", "https://a.test/a//b", "https://a.test/a/b"));
eq(calls, result);`),
        test("keeps directory slashes when resolving relative dot segments", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://a.test/root", list("/a/", "/x//y/../z/"));
pages.put("https://a.test/a/", list("child/", "../b/", ".", "..", "./c//d/"));
eq(new Solution().crawl("https://a.test/root", url -> pages.getOrDefault(url, list())), list(
    "https://a.test/root",
    "https://a.test/a/",
    "https://a.test/x//z/",
    "https://a.test/a/child/",
    "https://a.test/b/",
    "https://a.test/",
    "https://a.test/a/c/d/"
));`),
        test("preserves exact userinfo bracketed host and port", "hidden", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://u:p@[::1]:8443/a/", list("child/", "//u:p@[::1]:8443/a//b", "http://u:p@[::1]:8443/plain/", "https://[broken/", "https://[::1]:8443/off", "https://u:p@[::1]:9443/off"));
eq(new Solution().crawl("https://u:p@[::1]:8443/a/", url -> pages.getOrDefault(url, list())), list(
    "https://u:p@[::1]:8443/a/",
    "https://u:p@[::1]:8443/a/child/",
    "https://u:p@[::1]:8443/a//b",
    "http://u:p@[::1]:8443/plain/"
));`),
        pair("returns only the start page when no links exist", "sample", "new Solution().crawl(\"https://solo.test/root\", url -> list())", "list(\"https://solo.test/root\")"),
        pair("treats a different port as a different host", "hidden", "new Solution().crawl(\"https://app.test:8443/root\", url -> pages.getOrDefault(url, list()))", "list(\"https://app.test:8443/root\", \"https://app.test:8443/next\")", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://app.test:8443/root", list("/next", "https://app.test:9443/off"));
pages.put("https://app.test:8443/next", list());`),
        pair("rejects lookalike host suffixes", "hidden", "new Solution().crawl(\"https://app.test/\", url -> pages.getOrDefault(url, list()))", "list(\"https://app.test/\", \"https://app.test/safe\")", String.raw`
Map<String, List<String>> pages = new HashMap<>();
pages.put("https://app.test/", list("/safe", "https://app.test.evil/steal"));
pages.put("https://app.test/safe", list());`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    List<String> crawl(String startUrl, Function<String, List<String>> getLinks) {
        String host = host(startUrl);
        Deque<String> queue = new ArrayDeque<>();
        Set<String> visited = new HashSet<>();
        List<String> order = new ArrayList<>();
        queue.add(startUrl);
        visited.add(startUrl);

        while (!queue.isEmpty()) {
            String url = queue.removeFirst();
            order.add(url);
            for (String raw : getLinks.apply(url)) {
                String candidate = resolve(url, raw);
                if (candidate.codePoints().anyMatch(this::isPythonWhitespace)) continue;
                String scheme = scheme(candidate);
                if (!scheme.equals("http") && !scheme.equals("https")) continue;
                if (!host(candidate).equals(host) || visited.contains(candidate)) continue;
                visited.add(candidate);
                queue.addLast(candidate);
            }
        }
        return order;
    }

    private String resolve(String base, String raw) {
        if (hasScheme(raw)) {
            int colon = raw.indexOf(':');
            String referenceScheme = scheme(raw);
            String reference = raw.substring(colon + 1);
            if (!referenceScheme.equals(scheme(base)) || reference.startsWith("//")) {
                return referenceScheme + raw.substring(colon);
            }
            // Like Python urljoin, same-scheme references without an authority
            // inherit the base authority and resolve their path/query/fragment.
            raw = reference;
        }
        if (raw.startsWith("//")) return scheme(base) + ":" + raw;
        if (raw.isEmpty()) return base;
        if (raw.startsWith("#")) {
            int fragment = base.indexOf('#');
            return (fragment < 0 ? base : base.substring(0, fragment)) + raw;
        }
        if (raw.startsWith("?")) {
            int suffix = firstSuffix(base);
            return (suffix < 0 ? base : base.substring(0, suffix)) + raw;
        }
        String prefix = origin(base);
        if (raw.startsWith("/")) return prefix + normalize(raw, false);
        String path = path(base);
        int slash = path.lastIndexOf('/');
        String dir = slash >= 0 ? path.substring(0, slash + 1) : "/";
        return prefix + normalize(dir + raw, true);
    }

    private boolean hasScheme(String value) {
        int colon = value.indexOf(':');
        if (colon <= 0) return false;
        for (int i = 0; i < colon; i++) {
            char ch = value.charAt(i);
            if (!Character.isLetterOrDigit(ch) && ch != '+' && ch != '-' && ch != '.') return false;
        }
        return true;
    }

    private String scheme(String url) {
        int colon = url.indexOf(':');
        return colon < 0 ? "" : url.substring(0, colon).toLowerCase(Locale.ROOT);
    }

    private boolean isPythonWhitespace(int codePoint) {
        return Character.isWhitespace(codePoint) || Character.isSpaceChar(codePoint) || codePoint == 0x85;
    }

    private String origin(String url) {
        int schemeEnd = url.indexOf("://");
        int start = schemeEnd < 0 ? 0 : schemeEnd + 3;
        int end = url.length();
        for (int i = start; i < url.length(); i++) {
            char ch = url.charAt(i);
            if (ch == '/' || ch == '?' || ch == '#') {
                end = i;
                break;
            }
        }
        return url.substring(0, end);
    }

    private String host(String url) {
        String origin = origin(url);
        int schemeEnd = origin.indexOf("://");
        return schemeEnd < 0 ? origin : origin.substring(schemeEnd + 3);
    }

    private String path(String url) {
        String origin = origin(url);
        if (origin.length() == url.length()) return "/";
        String suffix = url.substring(origin.length());
        int suffixIndex = firstSuffix(suffix);
        return suffixIndex < 0 ? suffix : suffix.substring(0, suffixIndex);
    }

    private String normalize(String path, boolean relative) {
        String suffix = "";
        int suffixIndex = firstSuffix(path);
        if (suffixIndex >= 0) {
            suffix = path.substring(suffixIndex);
            path = path.substring(0, suffixIndex);
        }
        String[] segments = path.split("/", -1);
        Deque<String> parts = new ArrayDeque<>();
        for (int i = 0; i < segments.length; i++) {
            String part = segments[i];
            // Python urljoin filters redundant interior slashes only for
            // relative paths. Rooted paths retain their empty segments.
            if (relative && part.isEmpty() && i > 0 && i < segments.length - 1) continue;
            if (part.equals(".")) continue;
            if (part.equals("..")) {
                if (!parts.isEmpty()) parts.removeLast();
            } else {
                parts.addLast(part);
            }
        }
        String last = segments[segments.length - 1];
        if (last.equals(".") || last.equals("..")) parts.addLast("");
        String resolved = String.join("/", parts);
        if (!resolved.startsWith("/")) resolved = "/" + resolved;
        return resolved + suffix;
    }

    private int firstSuffix(String path) {
        int query = path.indexOf('?');
        int fragment = path.indexOf('#');
        if (query < 0) return fragment;
        if (fragment < 0) return query;
        return Math.min(query, fragment);
    }
}`, "Use BFS and claim a URL as visited before enqueueing. Resolve basic relative links without network APIs."),

    "secret-redactor": bundle(String.raw`
class Solution {
    String redactSecrets(String text) {
        return text;
    }
}`, [
        test("public redacts bearer token", "sample", String.raw`
eq(new Solution().redactSecrets("Authorization: Bearer abc123"), "Authorization: Bearer <redacted>");`),
        test("public redacts email and sk key", "sample", String.raw`
eq(new Solution().redactSecrets("user=a@example.com key=sk-abcdefghi"), "user=<email> key=sk-<redacted>");`),
        test("private does not redact short sk strings", "hidden", String.raw`
eq(new Solution().redactSecrets("value sk-test remains"), "value sk-test remains");`),
        test("private redacts multiple occurrences", "hidden", String.raw`
String text = "a@b.co Bearer token-123 sk-12345678 z@y.org";
eq(new Solution().redactSecrets(text), "<email> Bearer <redacted> sk-<redacted> <email>");`),
        test("private preserves punctuation around emails", "hidden", String.raw`
eq(new Solution().redactSecrets("Contact <me@example.com>, ok"), "Contact <<email>>, ok");`),
        pair("public preserves text without secrets", "sample", "new Solution().redactSecrets(\"request completed in 42 ms\")", "\"request completed in 42 ms\""),
        pair("private enforces the eight character key boundary", "hidden", "list(new Solution().redactSecrets(\"sk-1234567\"), new Solution().redactSecrets(\"sk-12345678\"))", "list(\"sk-1234567\", \"sk-<redacted>\")"),
        pair("private preserves bearer token punctuation", "hidden", "new Solution().redactSecrets(\"Authorization: Bearer abc123, next=true\")", "\"Authorization: Bearer <redacted>, next=true\""),
        pair("private treats Unicode whitespace as a bearer boundary", "hidden", "new Solution().redactSecrets(\"Bearer abc\\u00a0next\")", "\"Bearer <redacted>\\u00a0next\""),
        test("private includes Python control whitespace in bearer separators and boundaries", "hidden", String.raw`
Solution solution = new Solution();
for (char whitespace = 0x1c; whitespace <= 0x1f; whitespace++) {
    eq(solution.redactSecrets("Bearer abc" + whitespace + "next"), "Bearer <redacted>" + whitespace + "next");
    eq(solution.redactSecrets("Bearer" + whitespace + "abc; next"), "Bearer <redacted>; next");
    eq(solution.redactSecrets("Bearer" + whitespace + ", next"), "Bearer" + whitespace + ", next");
}`),
    ], String.raw`
class Solution {
    String redactSecrets(String text) {
        text = text.replaceAll("(?U)Bearer[\\s\\x1c-\\x1f]+[^\\s\\x1c-\\x1f,;]+", "Bearer <redacted>");
        text = text.replaceAll("sk-[A-Za-z0-9_-]{8,}", "sk-<redacted>");
        text = text.replaceAll("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", "<email>");
        return text;
    }
}`, "Apply bearer, sk-key, then email substitutions to the evolving text. Bearer whitespace includes Unicode White_Space and U+001C through U+001F, both as separators and as token-body terminators; comma and semicolon also terminate the token body."),

    "sliding-window-error-counter": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    Solution(double windowSeconds, DoubleSupplier now) {
    }

    void record(String message) {
    }

    int count() {
        return 0;
    }

    List<List<Object>> top(int k) {
        return List.of();
    }
}`, [
        test("counts recent errors and top messages", "sample", String.raw`
double[] clock = {0.0};
Solution counter = new Solution(10, () -> clock[0]);
counter.record("timeout");
counter.record("rate_limit");
counter.record("timeout");
eq(counter.count(), 3);
eq(counter.top(2), list(list("timeout", 2), list("rate_limit", 1)));
clock[0] = 10.0;
eq(counter.count(), 0);
eq(counter.top(2), list());`),
        test("expires events exactly at the window boundary", "sample", String.raw`
double[] clock = {0.0};
Solution counter = new Solution(10, () -> clock[0]);
counter.record("timeout");
clock[0] = 10.0;
eq(counter.count(), 0);
eq(counter.top(3), list());`),
        test("purges on every read and sorts ties", "hidden", String.raw`
double[] clock = {5.0};
Solution counter = new Solution(4, () -> clock[0]);
counter.record("zeta");
counter.record("alpha");
clock[0] = 8.9;
counter.record("beta");
eq(counter.top(5), list(list("alpha", 1), list("beta", 1), list("zeta", 1)));
clock[0] = 9.0;
eq(counter.count(), 1);
eq(counter.top(5), list(list("beta", 1)));`),
        test("top handles empty and oversized k", "hidden", String.raw`
double[] clock = {0.0};
Solution counter = new Solution(5, () -> clock[0]);
eq(counter.top(10), list());
counter.record("b");
counter.record("a");
eq(counter.top(10), list(list("a", 1), list("b", 1)));`),
        test("record purges stale events before adding new ones", "hidden", String.raw`
double[] clock = {0.0};
Solution counter = new Solution(10, () -> clock[0]);
counter.record("a");
clock[0] = 1.0;
counter.record("b");
clock[0] = 11.0;
counter.record("c");
eq(counter.count(), 1);
eq(counter.top(3), list(list("c", 1)));`),
        pair("reports one recorded message", "sample", "list(counter.count(), counter.top(1))", "list(1, list(list(\"timeout\", 1)))", String.raw`
Solution counter = new Solution(10, () -> 0.0);
counter.record("timeout");`),
        pair("top zero returns no messages", "hidden", "counter.top(0)", "list()", String.raw`
Solution counter = new Solution(10, () -> 0.0);
counter.record("timeout");`),
        pair("top negative returns no messages", "hidden", "counter.top(-1)", "list()", String.raw`
Solution counter = new Solution(10, () -> 0.0);
counter.record("timeout");`),
        pair("keeps events just inside the window", "hidden", "list(counter.count(), counter.top(2))", "list(2, list(list(\"newer\", 1), list(\"oldest\", 1)))", String.raw`
double[] clock = {0.0};
Solution counter = new Solution(10, () -> clock[0]);
counter.record("oldest");
clock[0] = 3.0;
counter.record("newer");
clock[0] = 9.999;`),
        test("record shares one timestamp with purge", "hidden", String.raw`
double[] clock = {0.0};
boolean[] advance = {true};
Solution counter = new Solution(2, () -> { double value = clock[0]; if (advance[0]) clock[0] += 1; return value; });
counter.record("");
advance[0] = false;
clock[0] = 2.0;
eq(counter.count(), 0);
eq(counter.top(1), list());`),
        test("top alone expires repeated occurrences and sorts Unicode ties", "hidden", String.raw`
double[] clock = {0.0};
Solution counter = new Solution(10, () -> clock[0]);
counter.record("same");
clock[0] = 3.0;
counter.record("same");
counter.record("");
clock[0] = 10.0;
eq(counter.top(3), list(list("", 1), list("same", 1)));
eq(counter.count(), 2);
clock[0] = 13.0;
eq(counter.top(3), list());
counter.record("\uD800\uDC00");
counter.record("\uE000");
eq(counter.top(2), list(list("\uE000", 1), list("\uD800\uDC00", 1)));`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    private class Event {
        final double time;
        final String message;

        Event(double time, String message) {
            this.time = time;
            this.message = message;
        }
    }

    private final double windowSeconds;
    private final DoubleSupplier now;
    private final Deque<Event> events = new ArrayDeque<>();
    private final Map<String, Integer> counts = new HashMap<>();

    Solution(double windowSeconds, DoubleSupplier now) {
        this.windowSeconds = windowSeconds;
        this.now = now;
    }

    void record(String message) {
        double timestamp = now.getAsDouble();
        purge(timestamp);
        events.addLast(new Event(timestamp, message));
        counts.put(message, counts.getOrDefault(message, 0) + 1);
    }

    int count() {
        purge(now.getAsDouble());
        int total = 0;
        for (int value : counts.values()) total += value;
        return total;
    }

    List<List<Object>> top(int k) {
        purge(now.getAsDouble());
        if (k <= 0) return List.of();
        List<List<Object>> ranked = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : counts.entrySet()) ranked.add(List.of(entry.getKey(), entry.getValue()));
        ranked.sort((left, right) -> {
            int byCount = Integer.compare((Integer) right.get(1), (Integer) left.get(1));
            if (byCount != 0) return byCount;
            return compareMessages((String) left.get(0), (String) right.get(0));
        });
        return ranked.subList(0, Math.min(k, ranked.size()));
    }

    private int compareMessages(String left, String right) {
        int i = 0, j = 0;
        while (i < left.length() && j < right.length()) {
            int a = left.codePointAt(i), b = right.codePointAt(j);
            if (a != b) return Integer.compare(a, b);
            i += Character.charCount(a);
            j += Character.charCount(b);
        }
        return Integer.compare(left.length() - i, right.length() - j);
    }

    private void purge(double current) {
        while (!events.isEmpty() && current - events.peekFirst().time >= windowSeconds) {
            Event event = events.removeFirst();
            int next = counts.get(event.message) - 1;
            if (next == 0) counts.remove(event.message);
            else counts.put(event.message, next);
        }
    }
}`, "Use Solution(windowSeconds, DoubleSupplier now), record(message), count(), and top(k); ranked rows are two-element Java lists. Capture one timestamp per operation and reuse it when purging and appending. Finite timestamps must be nondecreasing and the window finite and positive. An event expires at age >= windowSeconds. Empty messages are valid; ties use Unicode code-point order to match the Python specification. Purge before every read, including top with k<=0. A call removing e events pays O(e); each event is appended and removed once. count also sums u live message counts in O(u), while positive top sorts in O(u log u) comparisons, plus character work for message comparisons. Space is O(w+u) records for w retained events, excluding message characters, and top adds O(u) temporary space. A window bounds history duration, not event rate or total memory; concurrency needs a separate locking design."),

    "sse-event-parser": bundle(String.raw`
import java.util.*;

class Solution {
    List<String> parseSseEvents(List<String> chunks) {
        return List.of();
    }
}`, [
        test("parses multiline data split across chunks", "sample", String.raw`
eq(new Solution().parseSseEvents(list("data: hello\n", "data: world\n\n")), list("hello\nworld"));`),
        test("handles crlf line endings", "sample", String.raw`
eq(new Solution().parseSseEvents(list("data: one\r\n\r\n")), list("one"));`),
        test("ignores comments fields and incomplete final event", "hidden", String.raw`
List<String> chunks = list(
    ": keepalive\nida",
    "ta: ignored\ndata: first\n\n",
    "event: message\ndata: se",
    "cond\n\n",
    "data: incomplete"
);
eq(new Solution().parseSseEvents(chunks), list("first", "second"));`),
        test("parses multiple events from one chunk", "hidden", String.raw`
eq(new Solution().parseSseEvents(list("data: a\n\ndata: b\n\n")), list("a", "b"));`),
        test("preserves explicit empty data lines", "hidden", String.raw`
eq(new Solution().parseSseEvents(list("data: top\ndata:\ndata: bottom\n\n")), list("top\n\nbottom"));`),
        pair("empty stream returns no events", "sample", "new Solution().parseSseEvents(list())", "list()"),
        pair("recognizes a blank delimiter split across chunks", "hidden", "new Solution().parseSseEvents(list(\"data: ready\\n\", \"\\n\"))", "list(\"ready\")"),
        pair("removes at most one optional data space", "hidden", "new Solution().parseSseEvents(list(\"data:  indented\\n\\n\"))", "list(\" indented\")"),
        test("handles a long line split across chunks", "hidden", String.raw`
List<String> chunks = new ArrayList<>();
StringBuilder expected = new StringBuilder();
chunks.add("data: ");
for (int i = 0; i < 100000; i++) {
    chunks.add("x");
    expected.append('x');
}
chunks.add("\n\n");
eq(new Solution().parseSseEvents(chunks), list(expected.toString()));`),
    ], String.raw`
import java.util.*;

class Solution {
    List<String> parseSseEvents(List<String> chunks) {
        List<String> events = new ArrayList<>();
        StringBuilder buffer = new StringBuilder();
        List<String> dataLines = new ArrayList<>();
        int lineStart = 0;
        int scanStart = 0;

        for (String chunk : chunks) {
            buffer.append(chunk);
            int newline;
            while ((newline = buffer.indexOf("\n", scanStart)) >= 0) {
                String line = buffer.substring(lineStart, newline);
                lineStart = newline + 1;
                scanStart = lineStart;
                if (line.endsWith("\r")) line = line.substring(0, line.length() - 1);
                if (line.isEmpty()) {
                    if (!dataLines.isEmpty()) {
                        events.add(String.join("\n", dataLines));
                        dataLines.clear();
                    }
                } else if (!line.startsWith(":") && line.startsWith("data:")) {
                    String value = line.substring(5);
                    if (value.startsWith(" ")) value = value.substring(1);
                    dataLines.add(value);
                }
            }
            scanStart = buffer.length();
            if (lineStart > 0) {
                buffer.delete(0, lineStart);
                scanStart -= lineStart;
                lineStart = 0;
            }
        }
        return events;
    }
}`, "Maintain a partial line buffer and current event data lines. Emit only on blank lines."),

    "stack-trace-reconstructor": bundle(String.raw`
import java.util.*;
import java.math.BigInteger;

class Solution {
    Map<String, BigInteger> exclusiveTime(List<String> logs) {
        return new LinkedHashMap<>();
    }
}`, [
        test("computes exclusive time for nested calls", "sample", String.raw`
List<String> logs = list(
    "0 root start",
    "2 parse start",
    "5 parse end",
    "6 fetch start",
    "9 fetch end",
    "10 root end"
);
eq(new Solution().exclusiveTime(logs), map("root", java.math.BigInteger.valueOf(4), "parse", java.math.BigInteger.valueOf(3), "fetch", java.math.BigInteger.valueOf(3)));`),
        test("handles sequential non nested calls", "sample", String.raw`
eq(new Solution().exclusiveTime(list("0 load start", "3 load end", "3 save start", "5 save end")), map("load", java.math.BigInteger.valueOf(3), "save", java.math.BigInteger.valueOf(2)));`),
        test("aggregates repeated calls", "hidden", String.raw`
List<String> logs = list(
    "0 main start",
    "1 helper start",
    "3 helper end",
    "4 helper start",
    "7 helper end",
    "8 main end"
);
eq(new Solution().exclusiveTime(logs), map("main", java.math.BigInteger.valueOf(3), "helper", java.math.BigInteger.valueOf(5)));`),
        test("rejects mismatched stack endings", "hidden", String.raw`
IllegalArgumentException error = null;
try {
    new Solution().exclusiveTime(list("0 a start", "1 b end"));
} catch (IllegalArgumentException caught) {
    error = caught;
}
check(error != null && error.getMessage().contains("mismatched"));
error = null;
try {
    new Solution().exclusiveTime(list("0 a end"));
} catch (IllegalArgumentException caught) {
    error = caught;
}
check(error != null && error.getMessage().contains("mismatched"));`),
        test("rejects unknown events", "hidden", String.raw`
throwsException(IllegalArgumentException.class, () -> new Solution().exclusiveTime(list("0 main start", "1 main pause", "2 main end")));`),
        pair("empty trace has no runtime totals", "sample", "new Solution().exclusiveTime(list())", "map()"),
        pair("keeps zero duration calls in the result", "hidden", "new Solution().exclusiveTime(list(\"4 noop start\", \"4 noop end\"))", "map(\"noop\", java.math.BigInteger.ZERO)"),
        pair("parent resumes after a zero duration child", "hidden", "new Solution().exclusiveTime(list(\"0 root start\", \"2 child start\", \"2 child end\", \"5 root end\"))", "map(\"root\", java.math.BigInteger.valueOf(5), \"child\", java.math.BigInteger.ZERO)"),
        test("rejects an unclosed call", "hidden", String.raw`
IllegalArgumentException error = null;
try {
    new Solution().exclusiveTime(list("0 main start"));
} catch (IllegalArgumentException caught) {
    error = caught;
}
check(error != null && error.getMessage().contains("unclosed"));`),
        test("large timestamps totals and Unicode whitespace remain exact", "hidden", String.raw`
eq(new Solution().exclusiveTime(list("100000000000000000000 work start", "100000000000000000003 work end")), map("work", java.math.BigInteger.valueOf(3)));
eq(new Solution().exclusiveTime(list("-2147483648 work start", "2147483647 work end")), map("work", new java.math.BigInteger("4294967295")));
eq(new Solution().exclusiveTime(list(" \t0\u00a0work\u001cstart ", "\u20073\twork\u202fend\u00a0")), map("work", java.math.BigInteger.valueOf(3)));`),
        test("recursive frames aggregate without idle gaps", "hidden", String.raw`
eq(new Solution().exclusiveTime(list("0 work start", "2 work start", "5 work end", "7 work end", "20 work start", "21 work end")), map("work", java.math.BigInteger.valueOf(8)));`),
    ], String.raw`
import java.util.*;
import java.math.BigInteger;

class Solution {
    Map<String, BigInteger> exclusiveTime(List<String> logs) {
        Map<String, BigInteger> totals = new LinkedHashMap<>();
        Deque<String> stack = new ArrayDeque<>();
        BigInteger lastTs = null;

        for (String line : logs) {
            String[] parts = line.split("(?U)[\\s\\u001C-\\u001F]+");
            int offset = parts[0].isEmpty() ? 1 : 0;
            BigInteger ts = new BigInteger(parts[offset]);
            String name = parts[offset + 1];
            String event = parts[offset + 2];

            if (lastTs != null && !stack.isEmpty()) {
                String active = stack.peekLast();
                totals.put(active, totals.getOrDefault(active, BigInteger.ZERO).add(ts.subtract(lastTs)));
            }

            if (event.equals("start")) {
                stack.addLast(name);
                totals.putIfAbsent(name, BigInteger.ZERO);
            } else if (event.equals("end")) {
                if (stack.isEmpty() || !stack.peekLast().equals(name)) {
                    throw new IllegalArgumentException("mismatched end event for " + name);
                }
                stack.removeLast();
            } else {
                throw new IllegalArgumentException("unknown event " + event);
            }
            lastTs = ts;
        }

        if (!stack.isEmpty()) throw new IllegalArgumentException("unclosed function call");
        return totals;
    }
}`, "Call Solution.exclusiveTime(logs), returning Map<String, BigInteger>. Integer timestamps and aggregated durations use BigInteger so large offsets and totals stay exact. Java invalid-event/nesting errors use IllegalArgumentException; mismatched and unclosed messages retain those required substrings. Split whitespace-separated fields, accepting leading/trailing and Unicode whitespace. Attribute timestamp - lastTs only to the active top frame before processing the event; an empty stack earns nothing during idle gaps. Recursive frames stay separate on the stack but add to the same name total. Ends are exclusive, so equal timestamps and zero-duration calls add no extra tick. Preserve supplied order; input is already sorted and describes one thread. There are O(n) stack/event operations and O(d+f) records for nesting depth d and distinct names f. Parsing/hashing adds character work, and BigInteger parsing/arithmetic/storage grow with timestamp and total bit length. A streaming follow-up retains stack and last timestamp between batches and validates unclosed calls only at explicit finish."),

    "streaming-token-assembler": bundle(String.raw`
import java.util.*;

class Solution {
    Object apply(Map<String, Object> event) {
        return null;
    }

    String get(String messageId) {
        return null;
    }
}`, [
        test("public assembles one message", "sample", String.raw`
Solution assembler = new Solution();
check(assembler.apply(map("id", "m", "delta", "hel")) == null);
eq(assembler.get("m"), "hel");
eq(assembler.apply(map("id", "m", "delta", "lo", "final", true)), "hello");`),
        test("public supports interleaved ids", "sample", String.raw`
Solution assembler = new Solution();
assembler.apply(map("id", "a", "delta", "A"));
assembler.apply(map("id", "b", "delta", "B"));
eq(assembler.apply(map("id", "a", "delta", "1", "final", true)), "A1");
eq(assembler.apply(map("id", "b", "delta", "2", "final", true)), "B2");`),
        test("private handles final without delta", "hidden", String.raw`
Solution assembler = new Solution();
assembler.apply(map("id", "x", "delta", "done"));
eq(assembler.apply(map("id", "x", "final", true)), "done");`),
        test("private ignores updates after final", "hidden", String.raw`
Solution assembler = new Solution();
eq(assembler.apply(map("id", "m", "delta", "ok", "final", true)), "ok");
check(assembler.apply(map("id", "m", "delta", "bad")) == null);
eq(assembler.get("m"), "ok");
eq(assembler.apply(map("id", "m", "final", true)), "ok");`),
        test("private preserves empty deltas", "hidden", String.raw`
Solution assembler = new Solution();
assembler.apply(map("id", "m", "delta", ""));
assembler.apply(map("id", "m", "delta", "x"));
eq(assembler.apply(map("id", "m", "delta", "", "final", true)), "x");
check(assembler.get("missing") == null);`),
        pair("public unknown message returns null", "sample", "new Solution().get(\"missing\")", "null"),
        pair("private final first event includes its delta", "hidden", "assembler.apply(map(\"id\", \"m\", \"delta\", \"done\", \"final\", true))", "\"done\"", String.raw`
Solution assembler = new Solution();`),
        pair("private repeated finalization is idempotent", "hidden", "assembler.apply(map(\"id\", \"m\", \"delta\", \"ignored\", \"final\", true))", "\"done\"", String.raw`
Solution assembler = new Solution();
assembler.apply(map("id", "m", "delta", "done", "final", true));`),
    ], String.raw`
import java.util.*;

class Solution {
    private final Map<String, StringBuilder> parts = new HashMap<>();
    private final Map<String, String> finalized = new HashMap<>();

    Object apply(Map<String, Object> event) {
        String id = (String) event.get("id");
        if (finalized.containsKey(id)) {
            return Boolean.TRUE.equals(event.get("final")) ? finalized.get(id) : null;
        }
        parts.putIfAbsent(id, new StringBuilder());
        if (event.containsKey("delta")) {
            parts.get(id).append((String) event.get("delta"));
        }
        if (Boolean.TRUE.equals(event.get("final"))) {
            String completed = parts.remove(id).toString();
            finalized.put(id, completed);
            return completed;
        }
        return null;
    }

    String get(String messageId) {
        if (finalized.containsKey(messageId)) return finalized.get(messageId);
        StringBuilder builder = parts.get(messageId);
        return builder == null ? null : builder.toString();
    }
}`, "Buffer text by message id. Cache the completed String once, ignore later deltas, and reuse it for finalized reads."),

    "token-bucket-rate-limiter": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Decision {
    final boolean allowed;
    final double retryAfter;
    final String reason;

    Decision(boolean allowed, double retryAfter, String reason) {
        this.allowed = allowed;
        this.retryAfter = retryAfter;
        this.reason = reason;
    }
}

class Solution {
    Solution(double capacity, double refillRatePerSecond, DoubleSupplier now) {
    }

    Decision allow(Object key) {
        return allow(key, 1);
    }

    Decision allow(Object key, double cost) {
        return new Decision(false, 0, "");
    }
}`, [
        test("blocks when empty and returns retry after", "sample", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(2, 1, () -> clock[0]);
check(limiter.allow(list("org1", "messages")).allowed);
check(limiter.allow(list("org1", "messages")).allowed);
Decision blocked = limiter.allow(list("org1", "messages"));
check(!blocked.allowed);
eq(blocked.retryAfter, 1);
clock[0] = 1.0;
check(limiter.allow(list("org1", "messages")).allowed);`),
        test("refills fractional tokens over time", "sample", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(5, 2, () -> clock[0]);
check(limiter.allow("user", 4).allowed);
clock[0] = 1.0;
Decision decision = limiter.allow("user", 3);
check(decision.allowed);
eq(decision.retryAfter, 0);`),
        test("tracks keys independently and supports cost", "hidden", String.raw`
double[] clock = {10.0};
Solution limiter = new Solution(5, 2, () -> clock[0]);
check(limiter.allow("a", 5).allowed);
check(limiter.allow("b", 5).allowed);
Decision blocked = limiter.allow("a", 2);
check(!blocked.allowed);
eq(blocked.retryAfter, 1);
clock[0] = 11.0;
check(limiter.allow("a", 2).allowed);`),
        test("does not refill when clock moves backward", "hidden", String.raw`
double[] clock = {10.0};
Solution limiter = new Solution(2, 1, () -> clock[0]);
check(limiter.allow("key", 2).allowed);
clock[0] = 5.0;
Decision decision = limiter.allow("key", 1);
check(!decision.allowed);
eq(decision.retryAfter, 1);
clock[0] = 10.0;
Decision recovered = limiter.allow("key", 1);
check(!recovered.allowed);
eq(recovered.retryAfter, 1);`),
        test("blocked calls become allowed after retry delay", "hidden", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(1, 0.5, () -> clock[0]);
check(limiter.allow("key").allowed);
Decision blocked = limiter.allow("key");
check(!blocked.allowed);
eq(blocked.retryAfter, 2);
clock[0] = 2.0;
check(limiter.allow("key").allowed);`),
        pair("allows a request costing the full bucket", "sample", "list(decision.allowed, decision.retryAfter, decision.reason)", "list(true, 0.0, \"allowed\")", String.raw`
Solution limiter = new Solution(3, 1, () -> 0.0);
Decision decision = limiter.allow("org", 3);`),
        pair("public blocked reason is rate_limited", "sample", "list(blocked.allowed, blocked.reason, blocked.retryAfter)", "list(false, \"rate_limited\", 1.0)", String.raw`
Solution limiter = new Solution(1, 1, () -> 0.0);
limiter.allow("org");
Decision blocked = limiter.allow("org");`),
        pair("caps refill at bucket capacity", "hidden", "list(full.allowed, blocked.allowed, blocked.retryAfter)", "list(true, false, 1.0)", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(2, 1, () -> clock[0]);
limiter.allow("org", 2);
clock[0] = 100.0;
Decision full = limiter.allow("org", 2);
Decision blocked = limiter.allow("org");`),
        pair("blocked requests do not consume tokens", "hidden", "list(first.retryAfter, second.retryAfter, third.retryAfter)", "list(1.0, 1.0, 0.5)", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(2, 1, () -> clock[0]);
limiter.allow("org", 2);
Decision first = limiter.allow("org");
Decision second = limiter.allow("org");
clock[0] = 0.5;
Decision third = limiter.allow("org");`),
        test("preserves partial balance and refill watermark across clock regression", "hidden", String.raw`
double[] clock = {10.0};
Solution limiter = new Solution(3.0, 1.0, () -> clock[0]);
check(limiter.allow("key", 2.0).allowed);
clock[0] = 4.0;
Decision regressed = limiter.allow("key", 2.0);
check(!regressed.allowed);
eq(regressed.retryAfter, 1.0);
clock[0] = 8.0;
Decision stillBeforeWatermark = limiter.allow("key", 2.0);
check(!stillBeforeWatermark.allowed);
eq(stillBeforeWatermark.retryAfter, 1.0);
clock[0] = 10.5;
Decision partialRecovery = limiter.allow("key", 2.0);
check(!partialRecovery.allowed);
eq(partialRecovery.retryAfter, 0.5);
clock[0] = 11.0;
check(limiter.allow("key", 2.0).allowed);`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Decision {
    final boolean allowed;
    final double retryAfter;
    final String reason;

    Decision(boolean allowed, double retryAfter, String reason) {
        this.allowed = allowed;
        this.retryAfter = retryAfter;
        this.reason = reason;
    }
}

class Solution {
    private class Bucket {
        double tokens;
        double lastSeen;

        Bucket(double tokens, double lastSeen) {
            this.tokens = tokens;
            this.lastSeen = lastSeen;
        }
    }

    private final double capacity;
    private final double refillRatePerSecond;
    private final DoubleSupplier now;
    private final Map<Object, Bucket> buckets = new HashMap<>();

    Solution(double capacity, double refillRatePerSecond, DoubleSupplier now) {
        this.capacity = capacity;
        this.refillRatePerSecond = refillRatePerSecond;
        this.now = now;
    }

    Decision allow(Object key) {
        return allow(key, 1);
    }

    Decision allow(Object key, double cost) {
        double current = now.getAsDouble();
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> new Bucket(capacity, current));
        double effectiveCurrent = Math.max(current, bucket.lastSeen);
        double elapsed = effectiveCurrent - bucket.lastSeen;
        bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillRatePerSecond);
        bucket.lastSeen = effectiveCurrent;

        if (bucket.tokens >= cost) {
            bucket.tokens -= cost;
            return new Decision(true, 0, "allowed");
        }

        double retryAfter = (cost - bucket.tokens) / refillRatePerSecond;
        return new Decision(false, retryAfter, "rate_limited");
    }
}`, "Track token count and monotonic refill watermark per key, clamping effectiveCurrent = Math.max(current, bucket.lastSeen) before refilling."),

    "token-budget-ledger": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    Solution(int limit, double windowSeconds, DoubleSupplier now) {
    }

    boolean spend(Object key, int tokens) {
        return false;
    }

    int remaining(Object key) {
        return 0;
    }
}`, [
        test("public accepts spend within limit", "sample", String.raw`
double[] clock = {0.0};
Solution budget = new Solution(10, 60, () -> clock[0]);
check(budget.spend("org", 7));
eq(budget.remaining("org"), 3);
check(!budget.spend("org", 4));
eq(budget.remaining("org"), 3);`),
        test("public expires old spend", "sample", String.raw`
double[] clock = {0.0};
Solution budget = new Solution(5, 10, () -> clock[0]);
check(budget.spend("a", 5));
clock[0] = 10.0;
eq(budget.remaining("a"), 5);
check(budget.spend("a", 5));`),
        test("private uses one timestamp for each spend", "hidden", String.raw`
int[] calls = {0};
Solution budget = new Solution(10, 10, () -> calls[0]++ == 0 ? 0.0 : 100.0);
eq(list(budget.spend("org", 7), budget.spend("org", 4), budget.remaining("org")), list(true, true, 6));`),
        test("private tracks keys independently", "hidden", String.raw`
double[] clock = {3.0};
Solution budget = new Solution(4, 20, () -> clock[0]);
check(budget.spend("a", 4));
check(budget.spend("b", 4));
eq(budget.remaining("a"), 0);
eq(budget.remaining("b"), 0);`),
        test("private rejects negative and oversized spend", "hidden", String.raw`
Solution budget = new Solution(3, 10, () -> 0.0);
check(!budget.spend("a", -1));
check(!budget.spend("a", 4));
eq(budget.remaining("a"), 3);`),
        test("private rejects sums beyond the int limit without overflow", "hidden", String.raw`
double[] clock = {0.0};
Solution budget = new Solution(Integer.MAX_VALUE, 10, () -> clock[0]);
eq(list(budget.spend("org", 2_000_000_000), budget.spend("org", 1_000_000_000), budget.remaining("org")),
    list(true, false, 147_483_647));
check(budget.spend("org", 147_483_647));
eq(budget.remaining("org"), 0);
check(!budget.spend("org", 1));
clock[0] = 10.0;
eq(budget.remaining("org"), Integer.MAX_VALUE);
check(budget.spend("org", Integer.MAX_VALUE));
eq(budget.remaining("org"), 0);`),
        test("private purges multiple old events", "hidden", String.raw`
double[] clock = {0.0};
Solution budget = new Solution(10, 5, () -> clock[0]);
check(budget.spend("a", 3));
clock[0] = 1.0;
check(budget.spend("a", 4));
clock[0] = 5.0;
eq(budget.remaining("a"), 6);
clock[0] = 6.0;
eq(budget.remaining("a"), 10);`),
        pair("public accepts zero token spend", "sample", "list(budget.spend(\"org\", 0), budget.remaining(\"org\"))", "list(true, 5)", String.raw`
Solution budget = new Solution(5, 10, () -> 0.0);`),
        pair("private rejected spend does not affect budget", "hidden", "list(rejected, accepted, budget.remaining(\"org\"))", "list(false, true, 0)", String.raw`
Solution budget = new Solution(5, 10, () -> 0.0);
boolean rejected = budget.spend("org", 6);
boolean accepted = budget.spend("org", 5);`),
        pair("private retains spend just before expiry", "hidden", "budget.remaining(\"org\")", "0", String.raw`
double[] clock = {0.0};
Solution budget = new Solution(5, 10, () -> clock[0]);
budget.spend("org", 5);
clock[0] = 9.999;`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    private class Spend {
        final double time;
        final int tokens;

        Spend(double time, int tokens) {
            this.time = time;
            this.tokens = tokens;
        }
    }

    private final int limit;
    private final double windowSeconds;
    private final DoubleSupplier now;
    private final Map<Object, Deque<Spend>> events = new HashMap<>();
    private final Map<Object, Integer> totals = new HashMap<>();

    Solution(int limit, double windowSeconds, DoubleSupplier now) {
        this.limit = limit;
        this.windowSeconds = windowSeconds;
        this.now = now;
    }

    boolean spend(Object key, int tokens) {
        double current = now.getAsDouble();
        purge(key, current);
        if (tokens < 0 || tokens > limit) return false;
        int used = totals.getOrDefault(key, 0);
        if (tokens > limit - used) return false;
        if (tokens == 0) return true;
        events.computeIfAbsent(key, ignored -> new ArrayDeque<>()).addLast(new Spend(current, tokens));
        totals.put(key, used + tokens);
        return true;
    }

    int remaining(Object key) {
        purge(key, now.getAsDouble());
        return limit - totals.getOrDefault(key, 0);
    }

    private void purge(Object key, double current) {
        Deque<Spend> queue = events.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        while (!queue.isEmpty() && current - queue.peekFirst().time >= windowSeconds) {
            Spend spend = queue.removeFirst();
            totals.put(key, totals.getOrDefault(key, 0) - spend.tokens);
        }
    }
}`, "Purge expired spend entries on both writes and reads, with a running total per key. Sample the clock once per operation so expiry and new events use the same timestamp. Reject a spend greater than limit minus the current total before adding it; this keeps the nonnegative int total at or below the limit even when the limit is Integer.MAX_VALUE. Accepted zero-token spends create no event."),

    "tool-call-schema-validator": bundle(String.raw`
import java.util.*;

class Solution {
    List<String> validateCall(Map<String, Object> call, Map<String, Object> schemas) {
        return List.of();
    }
}`, [
        test("public accepts valid required and optional args", "sample", String.raw`
Map<String, Object> schemas = map("search", map("required", map("query", "str"), "optional", map("limit", "int")));
Map<String, Object> call = map("name", "search", "args", map("query", "vector db", "limit", 3));
eq(new Solution().validateCall(call, schemas), list());`),
        test("public reports missing required field", "sample", String.raw`
Map<String, Object> schemas = map("fetch", map("required", map("url", "str", "timeout", "float")));
eq(new Solution().validateCall(map("name", "fetch", "args", map("url", "https://x")), schemas), list("missing:timeout"));`),
        test("private rejects unknown tool", "hidden", String.raw`
eq(new Solution().validateCall(map("name", "delete_all", "args", map()), map()), list("unknown_tool:delete_all"));`),
        test("private detects type errors and bool int pitfall", "hidden", String.raw`
Map<String, Object> schemas = map("rank", map("required", map("k", "int", "scores", "list", "debug", "bool")));
Map<String, Object> call = map("name", "rank", "args", map("k", true, "scores", map(), "debug", "yes"));
eq(new Solution().validateCall(call, schemas), list("type:k:int", "type:scores:list", "type:debug:bool"));`),
        test("private sorts extra fields deterministically", "hidden", String.raw`
Map<String, Object> schemas = map("send", map("required", map("to", "str"), "optional", map("body", "str")));
Map<String, Object> call = map("name", "send", "args", map("to", "a", "z", 1, "a", 2));
eq(new Solution().validateCall(call, schemas), list("extra:a", "extra:z"));`),
        pair("public accepts omitted optional arguments", "sample", "new Solution().validateCall(map(\"name\", \"search\", \"args\", map(\"query\", \"vector db\")), schemas)", "list()", String.raw`
Map<String, Object> schemas = map("search", map("required", map("query", "str"), "optional", map("limit", "int")));`),
        pair("private accepts integers for float fields", "hidden", "new Solution().validateCall(map(\"name\", \"scale\", \"args\", map(\"factor\", 3)), schemas)", "list()", String.raw`
Map<String, Object> schemas = map("scale", map("required", map("factor", "float")));`),
        test("private rejects bool for float fields", "hidden", String.raw`
Map<String, Object> schemas = map("scale", map("required", map("factor", "float")));
eq(new Solution().validateCall(map("name", "scale", "args", map("factor", true)), schemas), list("type:factor:float"));`),
        test("private collects missing extra and type in category order", "hidden", String.raw`
Map<String, Object> schemas = map("run", map("required", map("cmd", "str", "timeout", "float"), "optional", map("debug", "bool")));
Map<String, Object> call = map("name", "run", "args", map("timeout", true, "extra_z", 1, "extra_a", 2));
eq(new Solution().validateCall(call, schemas), list("missing:cmd", "extra:extra_a", "extra:extra_z", "type:timeout:float"));`),
        pair("private treats missing args as empty", "hidden", "new Solution().validateCall(map(\"name\", \"search\"), schemas)", "list(\"missing:query\")", String.raw`
Map<String, Object> schemas = map("search", map("required", map("query", "str")));`),
        test("private preserves required then optional order despite argument order", "hidden", String.raw`
Map<String, Object> schemas = map("run", map("required", map("z", "str", "a", "int"), "optional", map("flag", "bool", "weight", "float")));
Map<String, Object> call = map("name", "run", "args", map("weight", true, "flag", 1, "a", 3.0, "z", null));
eq(new Solution().validateCall(call, schemas), list("type:z:str", "type:a:int", "type:flag:bool", "type:weight:float"));`),
        test("private distinguishes absent optional from present null and validates containers shallowly", "hidden", String.raw`
Map<String, Object> schemas = map("batch", map("required", map("items", "list", "options", "dict"), "optional", map("label", "str")));
eq(new Solution().validateCall(map("name", "batch", "args", map("items", list(null, map("nested", true)), "options", map("anything", list(1)))), schemas), list());
eq(new Solution().validateCall(map("name", "batch", "args", map("items", list(), "options", map(), "label", null)), schemas), list("type:label:str"));`),
    ], String.raw`
import java.util.*;

class Solution {
    @SuppressWarnings("unchecked")
    List<String> validateCall(Map<String, Object> call, Map<String, Object> schemas) {
        String name = (String) call.get("name");
        if (!schemas.containsKey(name)) return List.of("unknown_tool:" + name);

        Map<String, Object> args = (Map<String, Object>) call.getOrDefault("args", Map.of());
        Map<String, Object> schema = (Map<String, Object>) schemas.get(name);
        Map<String, String> required = (Map<String, String>) schema.getOrDefault("required", Map.of());
        Map<String, String> optional = (Map<String, String>) schema.getOrDefault("optional", Map.of());
        Set<String> allowed = new HashSet<>();
        allowed.addAll(required.keySet());
        allowed.addAll(optional.keySet());

        List<String> errors = new ArrayList<>();
        for (String field : required.keySet()) {
            if (!args.containsKey(field)) errors.add("missing:" + field);
        }
        List<String> extras = new ArrayList<>(args.keySet());
        extras.removeIf(allowed::contains);
        Collections.sort(extras);
        for (String field : extras) errors.add("extra:" + field);

        Map<String, String> allFields = new LinkedHashMap<>();
        allFields.putAll(required);
        allFields.putAll(optional);
        for (Map.Entry<String, String> entry : allFields.entrySet()) {
            String field = entry.getKey();
            if (!args.containsKey(field)) continue;
            if (!matchesType(args.get(field), entry.getValue())) errors.add("type:" + field + ":" + entry.getValue());
        }
        return errors;
    }

    private boolean matchesType(Object value, String expected) {
        return switch (expected) {
            case "str" -> value instanceof String;
            case "int" -> value instanceof Integer || value instanceof Long;
            case "float" -> value instanceof Number;
            case "bool" -> value instanceof Boolean;
            case "list" -> value instanceof List;
            case "dict" -> value instanceof Map;
            default -> false;
        };
    }
}`, "Validate tool name first, then missing fields, extras, and field types in schema order."),

    "workflow-state-machine": bundle(String.raw`
import java.util.*;

class Solution {
    void addJob(String jobId) {
        addJob(jobId, List.of(), 1);
    }

    void addJob(String jobId, List<String> deps, int maxAttempts) {
    }

    List<String> ready() {
        return List.of();
    }

    String transition(String jobId, String state) {
        return transition(jobId, state, null);
    }

    String transition(String jobId, String state, String reason) {
        return "";
    }

    Map<String, Object> status(String jobId) {
        return new LinkedHashMap<>();
    }
}`, [
        test("unlocks dependencies in insertion order", "sample", String.raw`
Solution runner = new Solution();
runner.addJob("extract");
runner.addJob("train", list("extract"), 2);
runner.addJob("report", list("train"), 1);
eq(runner.ready(), list("extract"));
eq(runner.transition("extract", "running"), "running");
eq(runner.transition("extract", "succeeded"), "succeeded");
eq(runner.ready(), list("train"));
eq(runner.status("extract").get("attempts"), 1);`),
        test("records status history with reasons", "sample", String.raw`
Solution runner = new Solution();
runner.addJob("job");
eq(runner.transition("job", "running", "picked"), "running");
eq(runner.transition("job", "succeeded", "done"), "succeeded");
Map<String, Object> status = runner.status("job");
eq(status.get("state"), "succeeded");
eq(status.get("attempts"), 1);
eq(status.get("history"), list(map("state", "running", "reason", "picked", "attempt", 1), map("state", "succeeded", "reason", "done", "attempt", 1)));`),
        test("retries until attempts are exhausted", "hidden", String.raw`
Solution runner = new Solution();
runner.addJob("job", list(), 2);
runner.transition("job", "running");
eq(runner.transition("job", "failed", "timeout"), "retrying");
eq(runner.ready(), list());
eq(runner.transition("job", "pending"), "pending");
eq(runner.ready(), list("job"));
runner.transition("job", "running");
eq(runner.transition("job", "failed", "timeout again"), "failed");
Map<String, Object> status = runner.status("job");
eq(status.get("attempts"), 2);
List<Map<String, Object>> history = (List<Map<String, Object>>) status.get("history");
eq(history.get(history.size() - 1).get("state"), "failed");`),
        test("rejects invalid transitions", "hidden", String.raw`
Solution runner = new Solution();
runner.addJob("job");
IllegalArgumentException error = null;
try {
    runner.transition("job", "succeeded");
} catch (IllegalArgumentException caught) {
    error = caught;
}
check(error != null && error.getMessage().contains("invalid transition"));`),
        test("rejects duplicate jobs invalid attempts and unknown deps", "hidden", String.raw`
Solution runner = new Solution();
runner.addJob("a");
throwsException(IllegalArgumentException.class, () -> runner.addJob("a"));
throwsException(IllegalArgumentException.class, () -> runner.addJob("bad", list(), 0));
throwsException(IllegalArgumentException.class, () -> runner.addJob("missing", list("nope"), 1));
throwsException(IllegalArgumentException.class, () -> runner.transition("unknown", "running"));
throwsException(IllegalArgumentException.class, () -> runner.status("unknown"));`),
        test("canceled jobs cannot be started later", "hidden", String.raw`
Solution runner = new Solution();
runner.addJob("job");
eq(runner.transition("job", "canceled", "user"), "canceled");
eq(runner.status("job").get("state"), "canceled");
throwsException(IllegalArgumentException.class, () -> runner.transition("job", "running"));`),
        pair("public completes a standalone job", "sample", "list(started, finished, runner.status(\"job\").get(\"attempts\"))", "list(\"running\", \"succeeded\", 1)", String.raw`
Solution runner = new Solution();
runner.addJob("job");
String started = runner.transition("job", "running");
String finished = runner.transition("job", "succeeded");`),
        pair("blocked dependency remains unready while parent runs", "hidden", "runner.ready()", "list()", String.raw`
Solution runner = new Solution();
runner.addJob("first");
runner.addJob("second", list("first"), 1);
runner.transition("first", "running");`),
        test("blocked dependency cannot start", "hidden", String.raw`
Solution runner = new Solution();
runner.addJob("first");
runner.addJob("second", list("first"), 1);
IllegalArgumentException error = null;
try {
    runner.transition("second", "running");
} catch (IllegalArgumentException caught) {
    error = caught;
}
check(error != null && error.getMessage().contains("dependencies"));`),
        pair("failed job can be canceled", "hidden", "list(failed, canceled, runner.status(\"job\").get(\"attempts\"))", "list(\"failed\", \"canceled\", 1)", String.raw`
Solution runner = new Solution();
runner.addJob("job");
runner.transition("job", "running");
String failed = runner.transition("job", "failed");
String canceled = runner.transition("job", "canceled");`),
        pair("empty workflow has no ready jobs", "hidden", "new Solution().ready()", "list()"),
        pair("standalone pending job is ready", "hidden", "runner.ready()", "list(\"job\")", String.raw`
Solution runner = new Solution();
runner.addJob("job");`),
        pair("ready jobs keep insertion order", "hidden", "runner.ready()", "list(\"b\", \"a\")", String.raw`
Solution runner = new Solution();
runner.addJob("b");
runner.addJob("a");
runner.addJob("c", list("a"), 1);`),
        test("returned status history cannot mutate the runner", "hidden", String.raw`
Solution runner = new Solution();
runner.addJob("job");
runner.transition("job", "running");
Map<String, Object> snapshot = runner.status("job");
List<Map<String, Object>> history = (List<Map<String, Object>>) snapshot.get("history");
history.get(0).put("state", "tampered");
history.get(0).put("reason", "tampered");
history.clear();
snapshot.put("attempts", 99);
eq(runner.status("job"), map("state", "running", "attempts", 1,
    "history", list(map("state", "running", "reason", null, "attempt", 1))));`),
    ], String.raw`
import java.util.*;

class Job {
    final String id;
    final List<String> deps;
    final int maxAttempts;
    String state = "pending";
    int attempts = 0;
    final List<Map<String, Object>> history = new ArrayList<>();

    Job(String id, List<String> deps, int maxAttempts) {
        this.id = id;
        this.deps = new ArrayList<>(deps);
        this.maxAttempts = maxAttempts;
    }
}

class Solution {
    private final Map<String, Job> jobs = new LinkedHashMap<>();

    void addJob(String jobId) {
        addJob(jobId, List.of(), 1);
    }

    void addJob(String jobId, List<String> deps, int maxAttempts) {
        if (jobs.containsKey(jobId)) throw new IllegalArgumentException("duplicate job " + jobId);
        if (maxAttempts < 1) throw new IllegalArgumentException("maxAttempts must be positive");
        for (String dep : deps) {
            if (!jobs.containsKey(dep)) throw new IllegalArgumentException("unknown dependency " + dep);
        }
        jobs.put(jobId, new Job(jobId, deps, maxAttempts));
    }

    List<String> ready() {
        List<String> result = new ArrayList<>();
        for (Job job : jobs.values()) {
            if (!job.state.equals("pending")) continue;
            boolean depsDone = true;
            for (String dep : job.deps) {
                if (!jobs.get(dep).state.equals("succeeded")) depsDone = false;
            }
            if (depsDone) result.add(job.id);
        }
        return result;
    }

    String transition(String jobId, String state) {
        return transition(jobId, state, null);
    }

    String transition(String jobId, String state, String reason) {
        Job job = job(jobId);
        String current = job.state;
        if (state.equals("running") && current.equals("pending")) {
            if (!ready().contains(jobId)) throw new IllegalArgumentException("dependencies are not satisfied");
            job.attempts++;
            return setState(job, "running", reason);
        }
        if (state.equals("succeeded") && current.equals("running")) return setState(job, "succeeded", reason);
        if (state.equals("failed") && current.equals("running")) {
            return setState(job, job.attempts < job.maxAttempts ? "retrying" : "failed", reason);
        }
        if (state.equals("pending") && current.equals("retrying")) return setState(job, "pending", reason);
        if (state.equals("canceled") && Set.of("pending", "running", "retrying", "failed").contains(current)) {
            return setState(job, "canceled", reason);
        }
        throw new IllegalArgumentException("invalid transition " + current + " -> " + state);
    }

    Map<String, Object> status(String jobId) {
        Job job = job(jobId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("state", job.state);
        result.put("attempts", job.attempts);
        List<Map<String, Object>> history = new ArrayList<>();
        for (Map<String, Object> event : job.history) history.add(new LinkedHashMap<>(event));
        result.put("history", history);
        return result;
    }

    private Job job(String jobId) {
        Job job = jobs.get(jobId);
        if (job == null) throw new IllegalArgumentException("unknown job " + jobId);
        return job;
    }

    private String setState(Job job, String state, String reason) {
        job.state = state;
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("state", state);
        event.put("reason", reason);
        event.put("attempt", job.attempts);
        job.history.add(event);
        return state;
    }
}`, "Keep transition validation centralized, increment attempts only when work starts, and copy each history record when returning an independent status snapshot."),

    "transactional-kv-store": bundle(String.raw`
import java.util.*;

class Solution {
    void begin() {
    }

    Object get(String key) {
        return null;
    }

    void set(String key, Object value) {
    }

    void delete(String key) {
    }

    void commit() {
    }

    void rollback() {
    }
}`, [
        test("public commit writes through to base store", "sample", String.raw`
Solution store = new Solution();
store.set("model", "fast");
store.begin();
store.set("model", "strong");
eq(store.get("model"), "strong");
store.commit();
eq(store.get("model"), "strong");`),
        test("public rollback restores lower layer", "sample", String.raw`
Solution store = new Solution();
store.set("route", "cheap");
store.begin();
store.set("route", "premium");
store.delete("route");
check(store.get("route") == null);
store.rollback();
eq(store.get("route"), "cheap");`),
        test("hidden nested commit merges into parent only", "hidden", String.raw`
Solution store = new Solution();
store.set("a", 1);
store.begin();
store.set("a", 2);
store.begin();
store.set("b", 3);
store.commit();
eq(store.get("a"), 2);
eq(store.get("b"), 3);
store.rollback();
eq(store.get("a"), 1);
check(store.get("b") == null);`),
        test("hidden committed delete removes base value", "hidden", String.raw`
Solution store = new Solution();
store.set("secret", "token");
store.begin();
store.delete("secret");
check(store.get("secret") == null);
store.commit();
check(store.get("secret") == null);`),
        test("hidden transaction control requires active transaction", "hidden", String.raw`
Solution store = new Solution();
throwsException(IllegalStateException.class, () -> store.commit());
throwsException(IllegalStateException.class, () -> store.rollback());`),
        pair("public supports base store deletion", "sample", "store.get(\"key\")", "null", String.raw`
Solution store = new Solution();
store.set("key", "value");
store.delete("key");`),
        pair("hidden nested rollback preserves outer writes", "hidden", "store.get(\"value\")", "\"outer\"", String.raw`
Solution store = new Solution();
store.set("value", "base");
store.begin();
store.set("value", "outer");
store.begin();
store.set("value", "inner");
store.rollback();`),
        pair("hidden delete of a missing key stays harmless", "hidden", "store.get(\"missing\")", "null", String.raw`
Solution store = new Solution();
store.begin();
store.delete("missing");
store.commit();`),
    ], String.raw`
import java.util.*;

class Solution {
    private static final Object TOMBSTONE = new Object();
    private final Map<String, Object> base = new LinkedHashMap<>();
    private final Deque<Map<String, Object>> layers = new ArrayDeque<>();

    void begin() {
        layers.addLast(new LinkedHashMap<>());
    }

    Object get(String key) {
        Iterator<Map<String, Object>> iterator = layers.descendingIterator();
        while (iterator.hasNext()) {
            Map<String, Object> layer = iterator.next();
            if (layer.containsKey(key)) {
                Object value = layer.get(key);
                return value == TOMBSTONE ? null : value;
            }
        }
        return base.get(key);
    }

    void set(String key, Object value) {
        if (layers.isEmpty()) base.put(key, value);
        else layers.peekLast().put(key, value);
    }

    void delete(String key) {
        if (layers.isEmpty()) base.remove(key);
        else layers.peekLast().put(key, TOMBSTONE);
    }

    void commit() {
        if (layers.isEmpty()) throw new IllegalStateException("no active transaction");
        Map<String, Object> layer = layers.removeLast();
        if (!layers.isEmpty()) {
            layers.peekLast().putAll(layer);
            return;
        }
        for (Map.Entry<String, Object> entry : layer.entrySet()) {
            if (entry.getValue() == TOMBSTONE) base.remove(entry.getKey());
            else base.put(entry.getKey(), entry.getValue());
        }
    }

    void rollback() {
        if (layers.isEmpty()) throw new IllegalStateException("no active transaction");
        layers.removeLast();
    }
}`, "Use stacked write maps plus a tombstone sentinel so deletes hide lower-layer values."),

    "repository-diff": bundle(String.raw`
import java.util.*;

class Solution {
    List<List<String>> diff(Map<String, String> oldFiles, Map<String, String> newFiles) {
        return new ArrayList<>();
    }
}`, [
        test("public reports added and modified files", "sample", String.raw`
Solution solution = new Solution();
Map<String, String> oldFiles = new LinkedHashMap<>();
oldFiles.put("README.md", "a");
oldFiles.put("src/app.py", "1");
Map<String, String> newFiles = new LinkedHashMap<>();
newFiles.put("README.md", "a");
newFiles.put("src/app.py", "2");
newFiles.put("src/test.py", "3");
eq(solution.diff(oldFiles, newFiles), list(list("MODIFIED", "src/app.py"), list("ADDED", "src/test.py")));`),
        test("public reports removals", "sample", String.raw`
Solution solution = new Solution();
Map<String, String> oldFiles = new LinkedHashMap<>();
oldFiles.put("a.txt", "1");
oldFiles.put("b.txt", "2");
Map<String, String> newFiles = new LinkedHashMap<>();
newFiles.put("b.txt", "2");
eq(solution.diff(oldFiles, newFiles), list(list("REMOVED", "a.txt")));`),
        test("hidden unchanged snapshots are empty", "hidden", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("a.txt", "1");
files.put("src/app.py", "2");
eq(solution.diff(files, new LinkedHashMap<>(files)), list());`),
        test("hidden deterministic ordering by path", "hidden", String.raw`
Solution solution = new Solution();
Map<String, String> oldFiles = new LinkedHashMap<>();
oldFiles.put("z.txt", "1");
oldFiles.put("b.txt", "old");
oldFiles.put("gone.txt", "x");
Map<String, String> newFiles = new LinkedHashMap<>();
newFiles.put("a.txt", "new");
newFiles.put("b.txt", "new");
newFiles.put("z.txt", "1");
eq(solution.diff(oldFiles, newFiles), list(list("ADDED", "a.txt"), list("MODIFIED", "b.txt"), list("REMOVED", "gone.txt")));`),
        test("hidden rejects invalid paths", "hidden", String.raw`
Solution solution = new Solution();
for (String path : List.of("../secret", "src//app.py", "", "a/./b")) {
    Map<String, String> bad = new LinkedHashMap<>();
    bad.put(path, "x");
    throwsException(IllegalArgumentException.class, () -> solution.diff(bad, new LinkedHashMap<>()));
    throwsException(IllegalArgumentException.class, () -> solution.diff(new LinkedHashMap<>(), bad));
}`),
        pair("public empty snapshots have no changes", "sample", "new Solution().diff(new LinkedHashMap<>(), new LinkedHashMap<>())", "list()"),
        pair("hidden rename is remove plus add", "hidden", "new Solution().diff(oldFiles, newFiles)", "list(list(\"ADDED\", \"new.py\"), list(\"REMOVED\", \"old.py\"))", String.raw`
Map<String, String> oldFiles = new LinkedHashMap<>();
oldFiles.put("old.py", "same");
Map<String, String> newFiles = new LinkedHashMap<>();
newFiles.put("new.py", "same");`),
        pair("hidden leaves both snapshots unchanged", "hidden", "list(oldFiles, newFiles)", "list(map(\"a.txt\", \"old\"), map(\"a.txt\", \"new\", \"b.txt\", \"added\"))", String.raw`
Map<String, String> oldFiles = new LinkedHashMap<>();
oldFiles.put("a.txt", "old");
Map<String, String> newFiles = new LinkedHashMap<>();
newFiles.put("a.txt", "new");
newFiles.put("b.txt", "added");
new Solution().diff(oldFiles, newFiles);`),
    ], String.raw`
import java.util.*;

class Solution {
    List<List<String>> diff(Map<String, String> oldFiles, Map<String, String> newFiles) {
        Map<String, String> oldClean = clean(oldFiles);
        Map<String, String> newClean = clean(newFiles);
        TreeSet<String> paths = new TreeSet<>();
        paths.addAll(oldClean.keySet());
        paths.addAll(newClean.keySet());
        List<List<String>> result = new ArrayList<>();
        for (String path : paths) {
            if (!oldClean.containsKey(path)) result.add(Arrays.asList("ADDED", path));
            else if (!newClean.containsKey(path)) result.add(Arrays.asList("REMOVED", path));
            else if (!Objects.equals(oldClean.get(path), newClean.get(path))) result.add(Arrays.asList("MODIFIED", path));
        }
        return result;
    }

    private Map<String, String> clean(Map<String, String> files) {
        Map<String, String> result = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : files.entrySet()) {
            validate(entry.getKey());
            result.put(entry.getKey(), entry.getValue());
        }
        return result;
    }

    private void validate(String path) {
        if (path == null || path.isEmpty()) throw new IllegalArgumentException("invalid path");
        for (String part : path.split("/", -1)) {
            if (part.isEmpty() || part.equals(".") || part.equals("..")) throw new IllegalArgumentException("invalid path");
        }
    }
}`, "Compare cleaned path maps with a sorted path union. Treat renames as remove plus add."),

    "file-patch-applier": bundle(String.raw`
import java.util.*;

class Edit {
    final int start;
    final int end;
    final String replacement;

    Edit(int start, int end, String replacement) {
        this.start = start;
        this.end = end;
        this.replacement = replacement;
    }
}

class Solution {
    String applyEdits(String text, List<Edit> edits) {
        return text;
    }
}`, [
        test("public replaces one range", "sample", String.raw`
Solution solution = new Solution();
eq(solution.applyEdits("hello world", list(new Edit(6, 11, "Cursor"))), "hello Cursor");`),
        test("public accepts unsorted adjacent edits", "sample", String.raw`
Solution solution = new Solution();
eq(solution.applyEdits("abcdef", list(new Edit(5, 6, "F"), new Edit(0, 1, "A"), new Edit(2, 2, "X"))), "AbXcdeF");`),
        test("hidden delete and insert", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.applyEdits("012345", list(new Edit(1, 4, ""), new Edit(6, 6, "!"))), "045!");`),
        test("hidden rejects overlaps before mutation", "hidden", String.raw`
Solution solution = new Solution();
throwsException(IllegalArgumentException.class, () -> solution.applyEdits("abcdef", list(new Edit(1, 4, "X"), new Edit(3, 5, "Y"))));`),
        test("hidden rejects invalid ranges", "hidden", String.raw`
Solution solution = new Solution();
throwsException(IllegalArgumentException.class, () -> solution.applyEdits("abc", list(new Edit(-1, 1, "x"))));
throwsException(IllegalArgumentException.class, () -> solution.applyEdits("abc", list(new Edit(2, 1, "x"))));
throwsException(IllegalArgumentException.class, () -> solution.applyEdits("abc", list(new Edit(0, 99, "x"))));`),
        pair("public replaces the entire string", "sample", "new Solution().applyEdits(\"old\", list(new Edit(0, 3, \"new\")))", "\"new\""),
        pair("hidden offsets use Java UTF-16 indexes", "hidden", "new Solution().applyEdits(\"a🙂c\", list(new Edit(1, 3, \"b\")))", "\"abc\""),
        pair("hidden empty edit list returns original", "hidden", "new Solution().applyEdits(\"unchanged\", list())", "\"unchanged\""),
        pair("hidden preserves same-position insert order", "hidden", "new Solution().applyEdits(\"x\", list(new Edit(0, 0, \"A\"), new Edit(0, 0, \"B\")))", "\"ABx\""),
    ], String.raw`
import java.util.*;

class Edit {
    final int start;
    final int end;
    final String replacement;

    Edit(int start, int end, String replacement) {
        this.start = start;
        this.end = end;
        this.replacement = replacement;
    }
}

class Solution {
    String applyEdits(String text, List<Edit> edits) {
        List<Edit> ordered = new ArrayList<>(edits);
        ordered.sort(Comparator.comparingInt((Edit edit) -> edit.start).thenComparingInt(edit -> edit.end));
        int previousEnd = 0;
        for (Edit edit : ordered) {
            if (edit.start < 0 || edit.end < edit.start || edit.end > text.length()) throw new IllegalArgumentException("invalid range");
            if (edit.start < previousEnd) throw new IllegalArgumentException("overlapping edits");
            previousEnd = edit.end;
        }
        StringBuilder result = new StringBuilder(text);
        for (int i = ordered.size() - 1; i >= 0; i--) {
            Edit edit = ordered.get(i);
            result.replace(edit.start, edit.end, edit.replacement);
        }
        return result.toString();
    }
}`, "Validate every range first, then apply replacements from right to left. Java String offsets count UTF-16 code units, so the emoji spans indexes 1 through 3."),

    "worker-lease-registry": bundle(String.raw`
import java.util.*;

class Solution {
    Solution(double ttlSeconds) {
    }

    Map<String, Object> acquire(String runId, String workerId, double now) {
        return null;
    }

    boolean heartbeat(String leaseId, int fencingToken, double now) {
        return false;
    }

    boolean validate(String runId, String leaseId, int fencingToken, double now) {
        return false;
    }

    boolean release(String leaseId, int fencingToken) {
        return false;
    }
}`, [
        test("public active lease blocks another worker", "sample", String.raw`
Solution registry = new Solution(10);
Map<String, Object> lease = registry.acquire("run-1", "worker-a", 0);
eq(lease.get("lease_id"), "run-1:worker-a:1");
eq(lease.get("fencing_token"), 1);
check(registry.acquire("run-1", "worker-b", 5) == null);`),
        test("public expired lease can be stolen", "sample", String.raw`
Solution registry = new Solution(10);
Map<String, Object> oldLease = registry.acquire("run-1", "worker-a", 0);
Map<String, Object> newLease = registry.acquire("run-1", "worker-b", 10);
eq(newLease.get("worker_id"), "worker-b");
eq(newLease.get("fencing_token"), 2);
check(!registry.validate("run-1", (String) oldLease.get("lease_id"), (Integer) oldLease.get("fencing_token"), 10));`),
        test("hidden heartbeat extends current lease", "hidden", String.raw`
Solution registry = new Solution(10);
Map<String, Object> lease = registry.acquire("run", "worker", 0);
check(registry.heartbeat((String) lease.get("lease_id"), (Integer) lease.get("fencing_token"), 9));
check(registry.acquire("run", "other", 18) == null);
eq(registry.acquire("run", "other", 19).get("worker_id"), "other");`),
        test("hidden stale worker heartbeat fails after steal", "hidden", String.raw`
Solution registry = new Solution(5);
Map<String, Object> oldLease = registry.acquire("run", "a", 0);
Map<String, Object> newLease = registry.acquire("run", "b", 5);
check(!registry.heartbeat((String) oldLease.get("lease_id"), (Integer) oldLease.get("fencing_token"), 6));
check(registry.heartbeat((String) newLease.get("lease_id"), (Integer) newLease.get("fencing_token"), 6));`),
        test("hidden release requires current token", "hidden", String.raw`
Solution registry = new Solution(10);
Map<String, Object> lease = registry.acquire("run", "worker", 0);
check(!registry.release((String) lease.get("lease_id"), ((Integer) lease.get("fencing_token")) + 1));
check(registry.release((String) lease.get("lease_id"), (Integer) lease.get("fencing_token")));
eq(registry.acquire("run", "other", 1).get("worker_id"), "other");`),
        pair("public release allows immediate reacquisition", "sample", "list(released, second.get(\"worker_id\"), second.get(\"fencing_token\"))", "list(true, \"worker-b\", 2)", String.raw`
Solution registry = new Solution(10);
Map<String, Object> first = registry.acquire("run", "worker-a", 0);
boolean released = registry.release((String) first.get("lease_id"), (Integer) first.get("fencing_token"));
Map<String, Object> second = registry.acquire("run", "worker-b", 0);`),
        pair("hidden release permits expired current lease", "hidden", "list(released, registry.acquire(\"run\", \"worker-b\", 3).get(\"worker_id\"))", "list(true, \"worker-b\")", String.raw`
Solution registry = new Solution(3);
Map<String, Object> lease = registry.acquire("run", "worker-a", 0);
boolean released = registry.release((String) lease.get("lease_id"), (Integer) lease.get("fencing_token"));`),
        pair("hidden unknown lease operations fail safely", "hidden", "list(registry.heartbeat(\"missing\", 1, 0), registry.validate(\"run\", \"missing\", 1, 0), registry.release(\"missing\", 1))", "list(false, false, false)", String.raw`
Solution registry = new Solution(10);`),
        pair("hidden validate respects expiry boundary", "hidden", "list(registry.validate(\"run\", (String) lease.get(\"lease_id\"), (Integer) lease.get(\"fencing_token\"), 4.999), registry.validate(\"run\", (String) lease.get(\"lease_id\"), (Integer) lease.get(\"fencing_token\"), 5.0))", "list(true, false)", String.raw`
Solution registry = new Solution(3);
Map<String, Object> lease = registry.acquire("run", "worker", 2);`),
        pair("hidden different runs acquire independent leases", "hidden", "list(first.get(\"worker_id\"), second.get(\"worker_id\"), ((Integer) first.get(\"fencing_token\")) < ((Integer) second.get(\"fencing_token\")))", "list(\"worker-a\", \"worker-b\", true)", String.raw`
Solution registry = new Solution(10);
Map<String, Object> first = registry.acquire("run-a", "worker-a", 0);
Map<String, Object> second = registry.acquire("run-b", "worker-b", 0);`),
    ], String.raw`
import java.util.*;

class Solution {
    private static class Lease {
        final String runId;
        final String workerId;
        final String leaseId;
        final int fencingToken;
        double expiresAt;

        Lease(String runId, String workerId, String leaseId, int fencingToken, double expiresAt) {
            this.runId = runId;
            this.workerId = workerId;
            this.leaseId = leaseId;
            this.fencingToken = fencingToken;
            this.expiresAt = expiresAt;
        }

        Map<String, Object> asMap() {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("run_id", runId);
            result.put("worker_id", workerId);
            result.put("lease_id", leaseId);
            result.put("fencing_token", fencingToken);
            result.put("expires_at", expiresAt);
            return result;
        }
    }

    private final double ttlSeconds;
    private final Map<String, Lease> byRun = new HashMap<>();
    private final Map<String, Lease> byLease = new HashMap<>();
    private int nextToken = 1;

    Solution(double ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }

    Map<String, Object> acquire(String runId, String workerId, double now) {
        Lease current = byRun.get(runId);
        if (current != null && current.expiresAt > now) return null;
        if (current != null) byLease.remove(current.leaseId);
        int token = nextToken++;
        Lease lease = new Lease(runId, workerId, runId + ":" + workerId + ":" + token, token, now + ttlSeconds);
        byRun.put(runId, lease);
        byLease.put(lease.leaseId, lease);
        return lease.asMap();
    }

    boolean heartbeat(String leaseId, int fencingToken, double now) {
        Lease lease = byLease.get(leaseId);
        if (lease == null || !validate(lease.runId, leaseId, fencingToken, now)) return false;
        lease.expiresAt = now + ttlSeconds;
        return true;
    }

    boolean validate(String runId, String leaseId, int fencingToken, double now) {
        Lease lease = byRun.get(runId);
        return lease != null && lease.leaseId.equals(leaseId) && lease.fencingToken == fencingToken && lease.expiresAt > now;
    }

    boolean release(String leaseId, int fencingToken) {
        Lease lease = byLease.get(leaseId);
        if (lease == null || lease.fencingToken != fencingToken) return false;
        if (byRun.get(lease.runId) != lease) return false;
        byRun.remove(lease.runId);
        byLease.remove(leaseId);
        return true;
    }
}`, "Use a monotonic fencing token so stale workers can't write after lease steal."),

    "webhook-idempotency-receiver": bundle(String.raw`
import java.util.*;

class Solution {
    Solution(Set<String> allowedRepos) {
    }

    Map<String, Object> handle(String provider, String deliveryId, Map<String, Object> event) {
        return new LinkedHashMap<>();
    }
}`, [
        test("public creates one run for allowed event", "sample", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> event = map("org", "cursor", "repo", "app", "action", "issue_comment", "number", 7);
eq(receiver.handle("github", "delivery-1", event), map("status", "created", "code", 202, "run_id", "run-1"));`),
        test("public duplicate logical work returns existing run", "sample", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> event = map("org", "cursor", "repo", "app", "action", "issue_comment", "number", 7);
Map<String, Object> first = receiver.handle("github", "delivery-1", event);
Map<String, Object> second = receiver.handle("github", "delivery-2", event);
eq(first.get("run_id"), second.get("run_id"));
eq(second.get("status"), "duplicate");
eq(second.get("code"), 200);`),
        test("hidden duplicate delivery returns original response", "hidden", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> first = receiver.handle("github", "delivery", map("org", "cursor", "repo", "app", "action", "push"));
Map<String, Object> second = receiver.handle("github", "delivery", map("org", "cursor", "repo", "app", "action", "different"));
eq(second, first);`),
        test("hidden blocks disallowed repo", "hidden", String.raw`
Solution receiver = new Solution(set("cursor/app"));
eq(receiver.handle("github", "delivery", map("org", "other", "repo", "app", "action", "push")), map("status", "blocked", "code", 403));`),
        test("hidden creates separate runs for separate logical keys", "hidden", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> a = receiver.handle("github", "a", map("org", "cursor", "repo", "app", "action", "push"));
Map<String, Object> b = receiver.handle("github", "b", map("org", "cursor", "repo", "app", "action", "issue", "number", 2));
eq(a.get("run_id"), "run-1");
eq(b.get("run_id"), "run-2");`),
        pair("public defaults a missing number in the logical key", "sample", "receiver.handle(\"github\", \"delivery-1\", map(\"org\", \"cursor\", \"repo\", \"app\", \"action\", \"push\"))", "map(\"status\", \"created\", \"code\", 202, \"run_id\", \"run-1\")", String.raw`
Solution receiver = new Solution(set("cursor/app"));`),
        pair("hidden delivery ids are scoped by provider", "hidden", "list(github, gitlab)", "list(map(\"status\", \"created\", \"code\", 202, \"run_id\", \"run-1\"), map(\"status\", \"created\", \"code\", 202, \"run_id\", \"run-2\"))", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> event = map("org", "cursor", "repo", "app", "action", "push");
Map<String, Object> github = receiver.handle("github", "same", event);
Map<String, Object> gitlab = receiver.handle("gitlab", "same", event);`),
        pair("hidden validates missing required fields", "hidden", "receiver.handle(\"github\", \"delivery\", map(\"org\", \"cursor\", \"repo\", \"app\"))", "map(\"status\", \"bad_request\", \"code\", 400)", String.raw`
Solution receiver = new Solution(set("cursor/app"));`),
        test("hidden validates all required field variants", "hidden", String.raw`
Solution receiver = new Solution(set("cursor/app"));
int index = 0;
for (Map<String, Object> event : list(
        map("repo", "app", "action", "push"),
        map("org", "cursor", "action", "push"),
        map("org", "cursor", "repo", "app"),
        map("org", "", "repo", "app", "action", "push"))) {
    eq(receiver.handle("github", "delivery-" + index++, event), map("status", "bad_request", "code", 400));
}`),
        pair("hidden different numbers allocate distinct runs", "hidden", "list(a.get(\"run_id\"), b.get(\"run_id\"), c.get(\"run_id\"))", "list(\"run-1\", \"run-2\", \"run-3\")", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> a = receiver.handle("github", "d1", map("org", "cursor", "repo", "app", "action", "issue_comment", "number", 7));
Map<String, Object> b = receiver.handle("github", "d2", map("org", "cursor", "repo", "app", "action", "issue_comment", "number", 8));
Map<String, Object> c = receiver.handle("github", "d3", map("org", "cursor", "repo", "app", "action", "issue_comment"));`),
        test("hidden logical keys retain field boundaries", "hidden", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> first = receiver.handle("a:cursor/app", "d1", map("org", "cursor", "repo", "app", "action", "push"));
Map<String, Object> second = receiver.handle("a", "d2", map("org", "cursor", "repo", "app", "action", "cursor/app:push"));
eq(first, map("status", "created", "code", 202, "run_id", "run-1"));
eq(second, map("status", "created", "code", 202, "run_id", "run-2"));
eq(receiver.handle("a", "d3", map("org", "cursor", "repo", "app", "action", "cursor/app:push")), map("status", "duplicate", "code", 200, "run_id", "run-2"));`),
        test("hidden bad request is cached under delivery key", "hidden", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> first = receiver.handle("github", "bad-delivery", map("repo", "app", "action", "push"));
Map<String, Object> second = receiver.handle("github", "bad-delivery", map("org", "cursor", "repo", "app", "action", "push"));
eq(first, map("status", "bad_request", "code", 400));
eq(second, first);`),
        pair("hidden null and zero numbers share the empty key", "hidden", "list(first.get(\"status\"), second.get(\"status\"), third.get(\"status\"), first.get(\"run_id\"), second.get(\"run_id\"), third.get(\"run_id\"))", "list(\"created\", \"duplicate\", \"duplicate\", \"run-1\", \"run-1\", \"run-1\")", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> first = receiver.handle("github", "missing", map("org", "cursor", "repo", "app", "action", "push"));
Map<String, Object> second = receiver.handle("github", "null", map("org", "cursor", "repo", "app", "action", "push", "number", null));
Map<String, Object> third = receiver.handle("github", "zero", map("org", "cursor", "repo", "app", "action", "push", "number", 0));`),
        pair("hidden delivery key keeps provider and id boundaries", "hidden", "list(first.get(\"run_id\"), second.get(\"run_id\"))", "list(\"run-1\", \"run-2\")", String.raw`
Solution receiver = new Solution(set("cursor/app"));
Map<String, Object> event = map("org", "cursor", "repo", "app", "action", "push");
Map<String, Object> first = receiver.handle("a:b", "c", event);
Map<String, Object> second = receiver.handle("a", "b:c", event);`),
        pair("public empty-string fields are bad_request", "sample", "receiver.handle(\"github\", \"empty\", map(\"org\", \"\", \"repo\", \"app\", \"action\", \"push\"))", "map(\"status\", \"bad_request\", \"code\", 400)", String.raw`
Solution receiver = new Solution(set("cursor/app"));`),
    ], String.raw`
import java.util.*;

class Solution {
    private final Set<String> allowedRepos;
    private final Map<List<String>, Map<String, Object>> responsesByDelivery = new HashMap<>();
    private final Map<List<String>, String> runByLogicalKey = new HashMap<>();
    private int nextRun = 1;

    Solution(Set<String> allowedRepos) {
        this.allowedRepos = new HashSet<>(allowedRepos);
    }

    Map<String, Object> handle(String provider, String deliveryId, Map<String, Object> event) {
        List<String> deliveryKey = Arrays.asList(provider, deliveryId);
        if (responsesByDelivery.containsKey(deliveryKey)) return new LinkedHashMap<>(responsesByDelivery.get(deliveryKey));
        if (!has(event, "org") || !has(event, "repo") || !has(event, "action")) {
            return remember(deliveryKey, response("bad_request", 400, null));
        }
        String repoKey = event.get("org") + "/" + event.get("repo");
        if (!allowedRepos.contains(repoKey)) return remember(deliveryKey, response("blocked", 403, null));
        Object numberValue = event.get("number");
        String number = numberValue == null
                || (numberValue instanceof Boolean && !((Boolean) numberValue))
                || (numberValue instanceof Number && ((Number) numberValue).doubleValue() == 0.0)
                || (numberValue instanceof CharSequence && ((CharSequence) numberValue).length() == 0)
            ? ""
            : String.valueOf(numberValue);
        List<String> logicalKey = Arrays.asList(provider, repoKey, String.valueOf(event.get("action")), number);
        if (runByLogicalKey.containsKey(logicalKey)) {
            return remember(deliveryKey, response("duplicate", 200, runByLogicalKey.get(logicalKey)));
        }
        String runId = "run-" + nextRun++;
        runByLogicalKey.put(logicalKey, runId);
        return remember(deliveryKey, response("created", 202, runId));
    }

    private boolean has(Map<String, Object> event, String key) {
        Object value = event.get(key);
        return value != null && !String.valueOf(value).isEmpty();
    }

    private Map<String, Object> response(String status, int code, String runId) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", status);
        result.put("code", code);
        if (runId != null) result.put("run_id", runId);
        return result;
    }

    private Map<String, Object> remember(List<String> deliveryKey, Map<String, Object> response) {
        responsesByDelivery.put(deliveryKey, new LinkedHashMap<>(response));
        return new LinkedHashMap<>(response);
    }
}`, "Separate provider delivery dedupe from logical work dedupe."),

    "streaming-markdown-parser": bundle(String.raw`
import java.util.*;

class Solution {
    List<List<String>> parse(List<String> chunks) {
        return new ArrayList<>();
    }
}`, [
        test("public parses inline code across chunks", "sample", String.raw`
Solution solution = new Solution();
String bt = "" + (char) 96;
eq(solution.parse(list("Use " + bt + "he", "apq" + bt + " now")), list(list("text", "Use "), list("inline_code", "heapq"), list("text", " now")));`),
        test("public parses fenced code across chunks", "sample", String.raw`
Solution solution = new Solution();
String fence = "" + (char) 96 + (char) 96 + (char) 96;
eq(solution.parse(list("before " + fence + "py", "thon\nprint(1)\n" + (char) 96, "" + (char) 96 + (char) 96 + " after")), list(list("text", "before "), list("fenced_code", "python\nprint(1)\n"), list("text", " after")));`),
        test("hidden backticks inside fence stay literal", "hidden", String.raw`
Solution solution = new Solution();
String bt = "" + (char) 96;
String fence = bt + bt + bt;
eq(solution.parse(list(fence, "x = " + bt + "literal" + bt + "\n", fence + ", done")), list(list("fenced_code", "x = " + bt + "literal" + bt + "\n"), list("text", ", done")));
eq(solution.parse(list(bt.repeat(4) + "x" + bt.repeat(4))), list(list("fenced_code", bt + "x")));
eq(solution.parse(list(fence, fence)), list());`),
        test("hidden unclosed inline code flushes at finish", "hidden", String.raw`
Solution solution = new Solution();
String bt = "" + (char) 96;
eq(solution.parse(list("start " + bt + "unfinished")), list(list("text", "start "), list("inline_code", "unfinished")));
eq(solution.parse(list(bt, "", bt, bt + "python\nbody" + bt, bt)), list(list("fenced_code", "python\nbody" + bt + bt)));
eq(solution.parse(list(bt + "inline" + bt + bt, bt + "fenced" + bt.repeat(3) + "tail")), list(list("inline_code", "inline"), list("fenced_code", "fenced"), list("text", "tail")));`),
        test("hidden empty chunks are ignored without losing order", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.parse(list("", "a", "", "b")), list(list("text", "ab")));`),
        pair("public joins plain text chunks", "sample", "new Solution().parse(list(\"hello \", \"world\"))", "list(list(\"text\", \"hello world\"))"),
        pair("hidden empty stream emits no tokens", "hidden", "new Solution().parse(list())", "list()"),
        pair("hidden adjacent inline code tokens stay separate", "hidden", "new Solution().parse(list(\"`a``b`\"))", "list(list(\"inline_code\", \"a\"), list(\"inline_code\", \"b\"))"),
    ], String.raw`
import java.util.*;

class Solution {
    List<List<String>> parse(List<String> chunks) {
        StringBuilder text = new StringBuilder();
        for (String chunk : chunks) text.append(chunk);
        List<List<String>> tokens = new ArrayList<>();
        String mode = "text";
        StringBuilder buffer = new StringBuilder();
        int i = 0;
        while (i < text.length()) {
            if (i + 3 <= text.length() && text.substring(i, i + 3).equals(fence())) {
                emit(tokens, mode, buffer);
                mode = mode.equals("fenced_code") ? "text" : "fenced_code";
                i += 3;
                continue;
            }
            if (text.charAt(i) == 96 && !mode.equals("fenced_code")) {
                emit(tokens, mode, buffer);
                mode = mode.equals("inline_code") ? "text" : "inline_code";
                i++;
                continue;
            }
            buffer.append(text.charAt(i));
            i++;
        }
        emit(tokens, mode, buffer);
        return tokens;
    }

    private void emit(List<List<String>> tokens, String mode, StringBuilder buffer) {
        if (buffer.length() == 0) return;
        tokens.add(Arrays.asList(mode, buffer.toString()));
        buffer.setLength(0);
    }

    private String fence() {
        return "" + (char) 96 + (char) 96 + (char) 96;
    }
}`, "Call Solution.parse(chunks); Java tokens are two-element lists containing kind and value. This base API joins all chunks and scans after the stream ends, so it preserves split delimiters but does not emit incrementally. Triples take priority in every mode, including opening a fence from inline code. Inside a fence, one or two backticks remain literal; longer runs consume triples first. Flush only nonempty buffers on a mode change and at the end. Language labels remain content. This is the specified code-delimiter grammar, not full CommonMark. Time is O(n + c) for n UTF-16 code units and c chunks; joined input, active buffer and output use O(n) space. An incremental follow-up must retain the mode, buffer and up to two pending backticks between feeds."),

    "codebase-symbol-index": bundle(String.raw`
import java.util.*;

class Solution {
    void updateFile(String path, String content) {
    }

    void removeFile(String path) {
    }

    List<Map<String, Object>> search(String prefix) {
        return search(prefix, 10);
    }

    List<Map<String, Object>> search(String prefix, int limit) {
        return new ArrayList<>();
    }
}`, [
        test("public indexes Python symbols", "sample", String.raw`
Solution index = new Solution();
index.updateFile("src/cache.py", "class Cache:\n    pass\ndef clear_cache():\n    pass");
eq(index.search("Ca"), list(map("name", "Cache", "path", "src/cache.py", "line", 1)));
eq(index.search("clear"), list(map("name", "clear_cache", "path", "src/cache.py", "line", 3)));`),
        test("public indexes JavaScript symbols", "sample", String.raw`
Solution index = new Solution();
index.updateFile("app.js", "function routeRequest() {}\nconst router = {}\nlet retries = 3");
List<Map<String, Object>> rows = index.search("r");
eq(rows.get(0).get("name"), "retries");
eq(rows.get(1).get("name"), "router");
eq(rows.get(2).get("name"), "routeRequest");`),
        test("hidden update removes stale symbols", "hidden", String.raw`
Solution index = new Solution();
index.updateFile("a.py", "def old_name():\n    pass");
index.updateFile("a.py", "def new_name():\n    pass");
eq(index.search("old"), list());
eq(index.search("new"), list(map("name", "new_name", "path", "a.py", "line", 1)));`),
        test("hidden remove file clears symbols", "hidden", String.raw`
Solution index = new Solution();
index.updateFile("a.py", "class Agent:\n    pass");
index.removeFile("a.py");
eq(index.search("Agent"), list());`),
        test("hidden nonpositive limits return empty snapshots", "hidden", String.raw`
Solution index = new Solution();
index.updateFile("a.py", "def alpha():\n    pass");
eq(index.search("al", -1), list());
eq(index.search("al", 0), list());
eq(index.search("", 10), list());
List<Map<String, Object>> previous = index.search("al");
previous.get(0).put("name", "changed");
eq(index.search("al"), list(map("name", "alpha", "path", "a.py", "line", 1)));`),
        test("hidden exact match ranks first", "hidden", String.raw`
Solution index = new Solution();
index.updateFile("a.py", "def cache():\n    pass\ndef cache_store():\n    pass");
eq(index.search("cache").get(0).get("name"), "cache");`),
        pair("public search is case insensitive", "sample", "index.search(\"cache\")", "list(map(\"name\", \"Cache\", \"path\", \"cache.py\", \"line\", 1))", String.raw`
Solution index = new Solution();
index.updateFile("cache.py", "class Cache:\n    pass");`),
        pair("hidden equal symbols sort by path", "hidden", "index.search(\"cache\")", "list(map(\"name\", \"cache\", \"path\", \"a.py\", \"line\", 1), map(\"name\", \"cache\", \"path\", \"z.py\", \"line\", 1))", String.raw`
Solution index = new Solution();
index.updateFile("z.py", "def cache():\n    pass");
index.updateFile("a.py", "def cache():\n    pass");`),
        pair("hidden limit caps results", "hidden", "index.search(\"al\", 2).size()", "2", String.raw`
Solution index = new Solution();
index.updateFile("a.py", "def alpha():\n    pass\ndef alpine():\n    pass\ndef also():\n    pass");`),
    ], String.raw`
import java.util.*;
import java.util.regex.*;

class Solution {
    private static final Pattern SYMBOL = Pattern.compile("^\\s*(?:def|class|function|const|let|var)\\s+([A-Za-z_][A-Za-z0-9_]*)");
    private final Map<String, List<String>> keysByFile = new HashMap<>();
    private final Map<String, Map<String, Object>> symbols = new HashMap<>();
    private final Map<String, Set<String>> byPrefix = new HashMap<>();

    void updateFile(String path, String content) {
        removeFile(path);
        List<String> keys = new ArrayList<>();
        String[] lines = content.split("\\n", -1);
        for (int i = 0; i < lines.length; i++) {
            Matcher matcher = SYMBOL.matcher(lines[i]);
            if (!matcher.find()) continue;
            String name = matcher.group(1);
            String key = path + ":" + (i + 1) + ":" + name;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", name);
            row.put("path", path);
            row.put("line", i + 1);
            symbols.put(key, row);
            keys.add(key);
            String lower = name.toLowerCase(Locale.ROOT);
            for (int j = 1; j <= lower.length(); j++) {
                byPrefix.computeIfAbsent(lower.substring(0, j), ignored -> new LinkedHashSet<>()).add(key);
            }
        }
        keysByFile.put(path, keys);
    }

    void removeFile(String path) {
        List<String> keys = keysByFile.remove(path);
        if (keys == null) return;
        for (String key : keys) {
            Map<String, Object> row = symbols.remove(key);
            String lower = String.valueOf(row.get("name")).toLowerCase(Locale.ROOT);
            for (int i = 1; i <= lower.length(); i++) {
                String prefix = lower.substring(0, i);
                Set<String> bucket = byPrefix.get(prefix);
                if (bucket == null) continue;
                bucket.remove(key);
                if (bucket.isEmpty()) byPrefix.remove(prefix);
            }
        }
    }

    List<Map<String, Object>> search(String prefix) {
        return search(prefix, 10);
    }

    List<Map<String, Object>> search(String prefix, int limit) {
        String wanted = prefix.toLowerCase(Locale.ROOT);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (String key : byPrefix.getOrDefault(wanted, Set.of())) rows.add(new LinkedHashMap<>(symbols.get(key)));
        rows.sort(Comparator
            .comparing((Map<String, Object> row) -> !String.valueOf(row.get("name")).toLowerCase(Locale.ROOT).equals(wanted))
            .thenComparing(row -> String.valueOf(row.get("name")).toLowerCase(Locale.ROOT))
            .thenComparing(row -> String.valueOf(row.get("path")))
            .thenComparingInt(row -> (Integer) row.get("line")));
        return rows.subList(0, Math.min(Math.max(0, limit), rows.size()));
    }
}`, "Keep file-to-symbol and prefix-to-symbol indexes so updates remove stale names."),

    "repository-hash-tree": bundle(String.raw`
import java.util.*;

class Solution {
    void setFile(String path, String content) {
    }

    boolean deletePath(String path) {
        return false;
    }

    String rootHash() {
        return "";
    }
}`, [
        test("public insertion order does not affect root hash", "sample", String.raw`
Solution left = new Solution();
left.setFile("src/app.py", "print('hi')");
left.setFile("README.md", "hello");
Solution right = new Solution();
right.setFile("README.md", "hello");
right.setFile("src/app.py", "print('hi')");
eq(left.rootHash(), right.rootHash());`),
        test("public content change updates root hash", "sample", String.raw`
Solution tree = new Solution();
String empty = tree.rootHash();
tree.setFile("a.txt", "one");
String first = tree.rootHash();
tree.setFile("a.txt", "two");
String second = tree.rootHash();
check(!empty.equals(first));
check(!first.equals(second));`),
        test("hidden delete restores matching snapshot hash", "hidden", String.raw`
Solution base = new Solution();
base.setFile("src/app.py", "print('hi')");
String expected = base.rootHash();
Solution tree = new Solution();
tree.setFile("src/app.py", "print('hi')");
tree.setFile("tmp/cache.bin", "cache");
check(tree.deletePath("tmp"));
eq(tree.rootHash(), expected);
check(!tree.deletePath("missing"));`),
        test("hidden empty directory remains after leaf delete", "hidden", String.raw`
Solution base = new Solution();
base.setFile("src/app.py", "print('hi')");
String expected = base.rootHash();
Solution tree = new Solution();
tree.setFile("src/app.py", "print('hi')");
tree.setFile("tmp/cache.bin", "cache");
check(tree.deletePath("tmp/cache.bin"));
check(!tree.rootHash().equals(expected));
check(tree.deletePath("tmp"));
eq(tree.rootHash(), expected);`),
        test("hidden rejects invalid paths", "hidden", String.raw`
Solution tree = new Solution();
throwsException(IllegalArgumentException.class, () -> tree.setFile("", "x"));
throwsException(IllegalArgumentException.class, () -> tree.setFile("../secret", "x"));
throwsException(IllegalArgumentException.class, () -> tree.setFile("src/../secret", "x"));
throwsException(IllegalArgumentException.class, () -> tree.deletePath(""));
throwsException(IllegalArgumentException.class, () -> tree.deletePath("../secret"));
throwsException(IllegalArgumentException.class, () -> tree.deletePath("src/../secret"));`),
        test("hidden rejects file directory conflicts", "hidden", String.raw`
Solution tree = new Solution();
tree.setFile("src", "file");
throwsException(IllegalArgumentException.class, () -> tree.setFile("src/app.py", "nested"));
throwsException(IllegalArgumentException.class, () -> tree.deletePath("src/app.py"));
Solution nested = new Solution();
nested.setFile("src/app.py", "nested");
throwsException(IllegalArgumentException.class, () -> nested.setFile("src", "file"));`),
        pair("public empty trees share one root hash", "sample", "left.rootHash()", "right.rootHash()", String.raw`
Solution left = new Solution();
Solution right = new Solution();`),
        pair("hidden replacing same content is stable", "hidden", "tree.rootHash()", "first", String.raw`
Solution tree = new Solution();
tree.setFile("a/b/c.txt", "same");
String first = tree.rootHash();
tree.setFile("a/b/c.txt", "same");`),
        pair("hidden deleting a file restores empty root", "hidden", "tree.rootHash()", "emptyHash", String.raw`
Solution tree = new Solution();
String emptyHash = tree.rootHash();
tree.setFile("a.txt", "data");
tree.deletePath("a.txt");`),
        test("normalizes single backslashes and dot segments before hashing and deletion", "hidden", String.raw`
Solution canonical = new Solution();
canonical.setFile("src/app.py", "same");
Solution alternate = new Solution();
alternate.setFile("\\src\\.\\app.py\\", "same");
eq(alternate.rootHash(), canonical.rootHash());
check(alternate.deletePath("/src//./app.py/"));
check(alternate.deletePath("src\\"));
eq(alternate.rootHash(), new Solution().rootHash());`),
    ], String.raw`
import java.util.*;

class Solution {
    private static class Node {
        final String kind;
        final String name;
        final Map<String, Node> children = new TreeMap<>();
        String hash;

        Node(String kind, String name) {
            this.kind = kind;
            this.name = name;
            this.hash = kind.equals("dir") ? stableHash(List.of("dir")) : stableHash(Arrays.asList(kind, name));
        }
    }

    private final Node root = new Node("dir", "");

    void setFile(String path, String content) {
        List<String> parts = normalize(path);
        Node node = root;
        List<Node> ancestors = new ArrayList<>();
        ancestors.add(root);
        for (int i = 0; i < parts.size() - 1; i++) {
            String part = parts.get(i);
            Node child = node.children.get(part);
            if (child == null) {
                child = new Node("dir", part);
                node.children.put(part, child);
            }
            if (!child.kind.equals("dir")) throw new IllegalArgumentException("file directory conflict");
            node = child;
            ancestors.add(node);
        }
        String fileName = parts.get(parts.size() - 1);
        Node existing = node.children.get(fileName);
        if (existing != null && existing.kind.equals("dir")) throw new IllegalArgumentException("file directory conflict");
        Node file = new Node("file", fileName);
        file.hash = stableHash(Arrays.asList("file", String.join("/", parts), stableHash(Arrays.asList(content))));
        node.children.put(fileName, file);
        recompute(ancestors);
    }

    boolean deletePath(String path) {
        List<String> parts = normalize(path);
        Node node = root;
        List<Node> ancestors = new ArrayList<>();
        ancestors.add(root);
        for (int i = 0; i < parts.size() - 1; i++) {
            Node child = node.children.get(parts.get(i));
            if (child == null) return false;
            if (!child.kind.equals("dir")) throw new IllegalArgumentException("file directory conflict");
            node = child;
            ancestors.add(node);
        }
        if (node.children.remove(parts.get(parts.size() - 1)) == null) return false;
        recompute(ancestors);
        return true;
    }

    String rootHash() {
        return root.hash;
    }

    private void recompute(List<Node> ancestors) {
        for (int i = ancestors.size() - 1; i >= 0; i--) {
            Node node = ancestors.get(i);
            List<String> entries = new ArrayList<>();
            for (Map.Entry<String, Node> entry : node.children.entrySet()) {
                Node child = entry.getValue();
                entries.add(entry.getKey() + ":" + child.kind + ":" + child.hash);
            }
            List<String> parts = new ArrayList<>();
            parts.add("dir");
            parts.addAll(entries);
            node.hash = stableHash(parts);
        }
    }

    private static List<String> normalize(String path) {
        String normalized = path.replace('\\', '/');
        String[] raw = normalized.split("/");
        List<String> parts = new ArrayList<>();
        for (String part : raw) {
            if (part.isEmpty() || part.equals(".")) continue;
            if (part.equals("..")) throw new IllegalArgumentException("invalid path");
            parts.add(part);
        }
        if (parts.isEmpty()) throw new IllegalArgumentException("invalid path");
        return parts;
    }

    private static String stableHash(List<String> parts) {
        long hash = 1125899906842597L;
        for (String part : parts) {
            for (int i = 0; i < part.length(); i++) hash = 31 * hash + part.charAt(i);
            hash = 31 * hash;
        }
        return Long.toHexString(hash);
    }
}`, "Sort directory children and recompute ancestors so rootHash stays deterministic."),

    "duplicate-file-groups": bundle(String.raw`
import java.util.*;

class Solution {
    List<List<String>> find(Map<String, String> files) {
        return new ArrayList<>();
    }
}`, [
        test("public groups identical content", "sample", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("a.py", "x");
files.put("b.py", "x");
files.put("c.py", "y");
eq(solution.find(files), list(list("a.py", "b.py")));`),
        test("public sorts groups and paths", "sample", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("z.txt", "1");
files.put("b.txt", "2");
files.put("a.txt", "2");
files.put("y.txt", "1");
eq(solution.find(files), list(list("a.txt", "b.txt"), list("y.txt", "z.txt")));`),
        test("hidden empty input", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.find(new LinkedHashMap<>()), list());`),
        test("hidden three-way duplicate", "hidden", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("src/a", "same");
files.put("src/b", "same");
files.put("src/c", "same");
files.put("src/d", "other");
eq(solution.find(files), list(list("src/a", "src/b", "src/c")));`),
        test("hidden rejects invalid paths", "hidden", String.raw`
Solution solution = new Solution();
for (String path : list("", ".", "..", "../secret", "src//app.py", "src/./app.py", "src/")) {
    Map<String, String> bad = new LinkedHashMap<>();
    bad.put(path, "x");
    throwsException(IllegalArgumentException.class, () -> solution.find(bad));
}`),
        test("hidden rejects mixed valid and invalid paths", "hidden", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("ok.py", "x");
files.put("src//bad.py", "x");
throwsException(IllegalArgumentException.class, () -> solution.find(files));`),
        pair("public groups empty file contents", "sample", "new Solution().find(files)", "list(list(\"empty-a\", \"empty-b\"))", String.raw`
Map<String, String> files = new LinkedHashMap<>();
files.put("empty-a", "");
files.put("empty-b", "");`),
        pair("hidden ignores unique files", "hidden", "new Solution().find(files)", "list()", String.raw`
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "1");
files.put("b", "2");`),
        pair("hidden content comparison is case sensitive", "hidden", "new Solution().find(files)", "list()", String.raw`
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "X");
files.put("b", "x");`),
    ], String.raw`
import java.util.*;

class Solution {
    List<List<String>> find(Map<String, String> files) {
        Map<String, List<String>> byContent = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : files.entrySet()) {
            validate(entry.getKey());
            byContent.computeIfAbsent(entry.getValue(), ignored -> new ArrayList<>()).add(entry.getKey());
        }
        List<List<String>> groups = new ArrayList<>();
        for (List<String> paths : byContent.values()) {
            if (paths.size() > 1) {
                Collections.sort(paths);
                groups.add(new ArrayList<>(paths));
            }
        }
        groups.sort(Comparator.comparing(group -> group.get(0)));
        return groups;
    }

    private void validate(String path) {
        if (path == null || path.isEmpty()) throw new IllegalArgumentException("invalid path");
        for (String part : path.split("/", -1)) {
            if (part.isEmpty() || part.equals(".") || part.equals("..")) throw new IllegalArgumentException("invalid path");
        }
    }
}`, "Group by content, keep only duplicate path groups, and sort deterministically."),

    "repo-ignore-filter": bundle(String.raw`
import java.util.*;

class Solution {
    List<String> filter(List<String> paths, List<String> rules) {
        return new ArrayList<>();
    }
}`, [
        test("public filters directory prefixes", "sample", String.raw`
Solution solution = new Solution();
eq(solution.filter(list("src/app.py", "node_modules/lib.js", "dist/app.js"), list("node_modules/", "dist/")), list("src/app.py"));`),
        test("public reinclude later rule", "sample", String.raw`
Solution solution = new Solution();
eq(solution.filter(list("dist/app.js", "dist/manifest.json"), list("dist/", "!dist/manifest.json")), list("dist/manifest.json"));`),
        test("hidden exact file rule", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.filter(list("a.log", "src/a.log"), list("a.log")), list("src/a.log"));`),
        test("hidden later ignore wins", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.filter(list("logs/keep.txt", "logs/drop.txt"), list("logs/", "!logs/keep.txt", "logs/keep.txt")), list());`),
        test("hidden invalid path rejected", "hidden", String.raw`
Solution solution = new Solution();
throwsException(IllegalArgumentException.class, () -> solution.filter(list("../x"), list()));`),
        pair("public no rules preserves path order", "sample", "new Solution().filter(list(\"z.txt\", \"src/a.py\", \"README.md\"), list())", "list(\"z.txt\", \"src/a.py\", \"README.md\")"),
        pair("hidden comments and blank rules are ignored", "hidden", "new Solution().filter(list(\"a\", \"b\"), list(\"\", \"# comment\", \"b\"))", "list(\"a\")"),
        test("hidden directory reinclude and bare dir path", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.filter(list("logs/keep.txt", "logs/drop.txt", "dist"), list("logs/", "!logs/", "dist/")), list("logs/keep.txt", "logs/drop.txt", "dist"));
eq(solution.filter(list("src/a.py"), list("  # comment  ", "  dist/  ")), list("src/a.py"));`),
        test("hidden strips Unicode whitespace", "hidden", String.raw`
String nbsp = new String(Character.toChars(0x00A0));
eq(new Solution().filter(list("src/a.py", "dist/app.js"), list(nbsp + "dist/" + nbsp)), list("src/a.py"));`),
        test("hidden invalid rule rejected", "hidden", String.raw`
throwsException(IllegalArgumentException.class, () -> new Solution().filter(list("a"), list("../secret")));`),
    ], String.raw`
import java.util.*;

class Solution {
    private static class Rule {
        final boolean negated;
        final String pattern;
        final boolean prefix;

        Rule(boolean negated, String pattern, boolean prefix) {
            this.negated = negated;
            this.pattern = pattern;
            this.prefix = prefix;
        }
    }

    List<String> filter(List<String> paths, List<String> rules) {
        List<Rule> parsed = new ArrayList<>();
        for (String rule : rules) {
            Rule parsedRule = parse(rule);
            if (parsedRule != null) parsed.add(parsedRule);
        }
        List<String> kept = new ArrayList<>();
        for (String path : paths) {
            validate(path);
            boolean ignored = false;
            for (Rule rule : parsed) {
                boolean matched = rule.prefix ? path.startsWith(rule.pattern + "/") : path.equals(rule.pattern);
                if (matched) ignored = !rule.negated;
            }
            if (!ignored) kept.add(path);
        }
        return kept;
    }

    private Rule parse(String raw) {
        String rule = stripPythonWhitespace(raw);
        if (rule.isEmpty() || rule.startsWith("#")) return null;
        boolean negated = rule.startsWith("!");
        String pattern = negated ? rule.substring(1) : rule;
        boolean prefix = pattern.endsWith("/");
        String clean = prefix ? pattern.substring(0, pattern.length() - 1) : pattern;
        validate(clean);
        return new Rule(negated, clean, prefix);
    }

    private String stripPythonWhitespace(String value) {
        int start = 0;
        while (start < value.length()) {
            int codePoint = value.codePointAt(start);
            if (!isPythonWhitespace(codePoint)) break;
            start += Character.charCount(codePoint);
        }
        int end = value.length();
        while (end > start) {
            int codePoint = value.codePointBefore(end);
            if (!isPythonWhitespace(codePoint)) break;
            end -= Character.charCount(codePoint);
        }
        return value.substring(start, end);
    }

    private boolean isPythonWhitespace(int codePoint) {
        return Character.isWhitespace(codePoint) || Character.isSpaceChar(codePoint) || codePoint == 0x85;
    }

    private void validate(String path) {
        if (path == null || path.isEmpty()) throw new IllegalArgumentException("invalid path");
        for (String part : path.split("/", -1)) {
            if (part.isEmpty() || part.equals(".") || part.equals("..")) throw new IllegalArgumentException("invalid path");
        }
    }
}`, "Parse ordered rules and let the last matching rule decide ignored state."),

    "patch-conflict-detector": bundle(String.raw`
import java.util.*;

class Patch {
    final String path;
    final int start;
    final int end;
    final String expected;
    final String replacement;

    Patch(String path, int start, int end, String expected, String replacement) {
        this.path = path;
        this.start = start;
        this.end = end;
        this.expected = expected;
        this.replacement = replacement;
    }
}

class Solution {
    Map<String, String> apply(Map<String, String> files, List<Patch> patches) {
        return files;
    }
}`, [
        test("public applies one optimistic patch", "sample", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("app.py", "print('old')\n");
Map<String, String> out = solution.apply(files, list(new Patch("app.py", 6, 11, "'old'", "'new'")));
eq(out.get("app.py"), "print('new')\n");
eq(files.get("app.py"), "print('old')\n");`),
        test("public applies multiple files", "sample", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "hello");
files.put("b", "world");
eq(solution.apply(files, list(new Patch("a", 0, 5, "hello", "hi"), new Patch("b", 0, 5, "world", "earth"))).get("b"), "earth");`),
        test("hidden rejects stale expected text", "hidden", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "hello");
throwsException(IllegalArgumentException.class, () -> solution.apply(files, list(new Patch("a", 0, 5, "HELLO", "hi"))));
eq(files.get("a"), "hello");`),
        test("hidden rejects overlaps", "hidden", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "abcdef");
throwsException(IllegalArgumentException.class, () -> solution.apply(files, list(new Patch("a", 1, 4, "bcd", "X"), new Patch("a", 3, 5, "de", "Y"))));`),
        pair("hidden insert and delete", "hidden", "solution.apply(files, patches).get(\"a\")", "\"045!\"", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "012345");
List<Patch> patches = list(new Patch("a", 1, 4, "123", ""), new Patch("a", 6, 6, "", "!"));`),
        pair("public empty patch set preserves files", "sample", "new Solution().apply(files, list())", "map(\"a.txt\", \"unchanged\")", String.raw`
Map<String, String> files = new LinkedHashMap<>();
files.put("a.txt", "unchanged");`),
        pair("hidden adjacent patches are allowed", "hidden", "new Solution().apply(files, patches).get(\"a\")", "\"aBCDEf\"", String.raw`
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "abcdef");
List<Patch> patches = list(new Patch("a", 1, 3, "bc", "BC"), new Patch("a", 3, 5, "de", "DE"));`),
        pair("hidden same-offset inserts preserve order", "hidden", "new Solution().apply(files, patches).get(\"a\")", "\"aXYb\"", String.raw`
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "ab");
List<Patch> patches = list(new Patch("a", 1, 1, "", "X"), new Patch("a", 1, 1, "", "Y"));`),
        test("hidden missing file rejected", "hidden", String.raw`
Solution solution = new Solution();
throwsException(IllegalArgumentException.class, () -> solution.apply(new LinkedHashMap<>(), list(new Patch("missing", 0, 0, "", "x"))));`),
        test("hidden boundary inserts work regardless of replacement input order", "hidden", String.raw`
Solution solution = new Solution();
Map<String, String> files = new LinkedHashMap<>();
files.put("a", "abc");
Patch replacement = new Patch("a", 1, 2, "b", "R");
Patch left = new Patch("a", 1, 1, "", "L");
Patch secondLeft = new Patch("a", 1, 1, "", "M");
Patch right = new Patch("a", 2, 2, "", "E");
eq(solution.apply(files, list(replacement, left, secondLeft, right)).get("a"), "aLMREc");
eq(solution.apply(files, list(left, secondLeft, replacement, right)).get("a"), "aLMREc");
eq(files.get("a"), "abc");
throwsException(IllegalArgumentException.class, () -> solution.apply(files, list(new Patch("a", 0, 2, "ab", "R"), left)));`),
    ], String.raw`
import java.util.*;

class Patch {
    final String path;
    final int start;
    final int end;
    final String expected;
    final String replacement;

    Patch(String path, int start, int end, String expected, String replacement) {
        this.path = path;
        this.start = start;
        this.end = end;
        this.expected = expected;
        this.replacement = replacement;
    }
}

class Solution {
    Map<String, String> apply(Map<String, String> files, List<Patch> patches) {
        Map<String, List<Patch>> byFile = new LinkedHashMap<>();
        for (Patch patch : patches) {
            String text = files.get(patch.path);
            if (text == null) throw new IllegalArgumentException("missing file");
            if (patch.start < 0 || patch.end < patch.start || patch.end > text.length()) throw new IllegalArgumentException("invalid range");
            if (!text.substring(patch.start, patch.end).equals(patch.expected)) throw new IllegalArgumentException("stale patch");
            byFile.computeIfAbsent(patch.path, ignored -> new ArrayList<>()).add(patch);
        }
        for (List<Patch> edits : byFile.values()) {
            edits.sort(Comparator.comparingInt((Patch p) -> p.start).thenComparingInt(p -> p.end));
            for (int i = 1; i < edits.size(); i++) {
                if (edits.get(i - 1).end > edits.get(i).start) throw new IllegalArgumentException("overlap");
            }
        }
        Map<String, String> output = new LinkedHashMap<>(files);
        for (Map.Entry<String, List<Patch>> entry : byFile.entrySet()) {
            List<Patch> edits = entry.getValue();
            String text = output.get(entry.getKey());
            for (int i = edits.size() - 1; i >= 0; i--) {
                Patch patch = edits.get(i);
                text = text.substring(0, patch.start) + patch.replacement + text.substring(patch.end);
            }
            output.put(entry.getKey(), text);
        }
        return output;
    }
}`, "Validate every patch against the original files, then sort each file's patches stably by start and end. This allows inserts at replacement boundaries, rejects interior inserts, and preserves input order for same-offset inserts when applying from right to left."),

    "notification-rate-limiter": bundle(String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    Solution(int limit, double windowSeconds, DoubleSupplier now) {
    }

    List<Object> allow(String channel, String dedupeKey) {
        return new ArrayList<>();
    }
}`, [
        test("public allows until channel limit", "sample", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(2, 10.0, () -> clock[0]);
eq(limiter.allow("slack", "a"), list(true, 0.0));
eq(limiter.allow("slack", "b"), list(true, 0.0));
eq(limiter.allow("slack", "c"), list(false, 10.0));`),
        test("public dedupes repeated key", "sample", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(2, 10.0, () -> clock[0]);
eq(limiter.allow("slack", "a"), list(true, 0.0));
eq(limiter.allow("slack", "a").get(0), false);
eq(limiter.allow("slack", "b"), list(true, 0.0));`),
        test("hidden expires old records", "hidden", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(1, 5.0, () -> clock[0]);
eq(limiter.allow("slack", "a"), list(true, 0.0));
clock[0] = 5.0;
eq(limiter.allow("slack", "b"), list(true, 0.0));`),
        pair("hidden channels isolated", "hidden", "limiter.allow(\"github\", \"a\")", "list(true, 0.0)", String.raw`
Solution limiter = new Solution(1, 10.0, () -> 0.0);
limiter.allow("slack", "a");`),
        test("hidden retry after from oldest event", "hidden", String.raw`
double[] clock = {2.0};
Solution limiter = new Solution(1, 10.0, () -> clock[0]);
eq(limiter.allow("slack", "a"), list(true, 0.0));
clock[0] = 7.0;
eq(limiter.allow("slack", "b"), list(false, 5.0));`),
        pair("public duplicate reports full retry delay", "sample", "limiter.allow(\"slack\", \"deploy-1\")", "list(false, 10.0)", String.raw`
Solution limiter = new Solution(2, 10.0, () -> 0.0);
limiter.allow("slack", "deploy-1");`),
        pair("hidden dedupe expires at the window boundary", "hidden", "limiter.allow(\"linear\", \"issue-1\")", "list(true, 0.0)", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(2, 3.0, () -> clock[0]);
limiter.allow("linear", "issue-1");
clock[0] = 3.0;`),
        test("hidden invalid limit rejected", "hidden", String.raw`
throwsException(IllegalArgumentException.class, () -> new Solution(0, 10.0, () -> 0.0));`),
        test("hidden invalid window rejected", "hidden", String.raw`
throwsException(IllegalArgumentException.class, () -> new Solution(1, 0.0, () -> 0.0));`),
        pair("hidden duplicate retry decreases with elapsed time", "hidden", "limiter.allow(\"slack\", \"deploy-1\")", "list(false, 6.0)", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(2, 10.0, () -> clock[0]);
limiter.allow("slack", "deploy-1");
clock[0] = 4.0;`),
        pair("hidden blocked keys do not consume capacity", "hidden", "limiter.allow(\"slack\", \"blocked\")", "list(true, 0.0)", String.raw`
double[] clock = {0.0};
Solution limiter = new Solution(1, 10.0, () -> clock[0]);
limiter.allow("slack", "accepted");
clock[0] = 1.0;
limiter.allow("slack", "blocked");
clock[0] = 10.0;`),
    ], String.raw`
import java.util.*;
import java.util.function.*;

class Solution {
    private static class Event {
        final double timestamp;
        final String key;

        Event(double timestamp, String key) {
            this.timestamp = timestamp;
            this.key = key;
        }
    }

    private final int limit;
    private final double windowSeconds;
    private final DoubleSupplier now;
    private final Map<String, List<Event>> events = new LinkedHashMap<>();

    Solution(int limit, double windowSeconds, DoubleSupplier now) {
        if (limit <= 0 || windowSeconds <= 0) throw new IllegalArgumentException("invalid limit");
        this.limit = limit;
        this.windowSeconds = windowSeconds;
        this.now = now;
    }

    List<Object> allow(String channel, String dedupeKey) {
        double current = now.getAsDouble();
        List<Event> active = new ArrayList<>();
        for (Event event : events.getOrDefault(channel, List.of())) {
            if (current - event.timestamp < windowSeconds) active.add(event);
        }
        events.put(channel, active);
        for (Event event : active) {
            if (event.key.equals(dedupeKey)) return Arrays.asList(false, Math.max(0.0, windowSeconds - (current - event.timestamp)));
        }
        if (active.size() >= limit) {
            double oldest = active.stream().mapToDouble(event -> event.timestamp).min().orElse(current);
            return Arrays.asList(false, Math.max(0.0, windowSeconds - (current - oldest)));
        }
        active.add(new Event(current, dedupeKey));
        return Arrays.asList(true, 0.0);
    }
}`, "Evict expired channel events before dedupe and capacity checks."),

    "multi-tenant-job-scheduler": bundle(String.raw`
import java.util.*;

class Solution {
    Solution(int maxConsecutivePerOrg) {
    }

    void enqueue(String org, String jobId, int priority) {
    }

    boolean cancel(String jobId) {
        return false;
    }

    List<String> dispatch(int count) {
        return new ArrayList<>();
    }
}`, [
        test("public enforces fairness cap", "sample", String.raw`
Solution scheduler = new Solution(2);
scheduler.enqueue("a", "a1", 1);
scheduler.enqueue("a", "a2", 1);
scheduler.enqueue("a", "a3", 1);
scheduler.enqueue("b", "b1", 5);
eq(scheduler.dispatch(4), list("a1", "a2", "b1", "a3"));`),
        test("public priority and fifo", "sample", String.raw`
Solution scheduler = new Solution(10);
scheduler.enqueue("org", "slow", 5);
scheduler.enqueue("org", "fast1", 1);
scheduler.enqueue("org", "fast2", 1);
eq(scheduler.dispatch(3), list("fast1", "fast2", "slow"));`),
        test("hidden cancellation", "hidden", String.raw`
Solution scheduler = new Solution(2);
scheduler.enqueue("a", "j1", 1);
scheduler.enqueue("a", "j2", 1);
check(scheduler.cancel("j1"));
check(!scheduler.cancel("missing"));
eq(scheduler.dispatch(2), list("j2"));`),
        pair("hidden no alternate org available", "hidden", "scheduler.dispatch(3)", "list(\"a0\", \"a1\", \"a2\")", String.raw`
Solution scheduler = new Solution(1);
scheduler.enqueue("a", "a0", 1);
scheduler.enqueue("a", "a1", 1);
scheduler.enqueue("a", "a2", 1);`),
        test("hidden duplicate job rejected", "hidden", String.raw`
Solution scheduler = new Solution(2);
scheduler.enqueue("a", "j", 1);
throwsException(IllegalArgumentException.class, () -> scheduler.enqueue("a", "j", 2));`),
        pair("public empty queue dispatches nothing", "sample", "scheduler.dispatch(3)", "list()", String.raw`
Solution scheduler = new Solution(2);`),
        pair("hidden dispatch preserves state across calls", "hidden", "scheduler.dispatch(2)", "list(\"b1\")", String.raw`
Solution scheduler = new Solution(2);
scheduler.enqueue("a", "a1", 1);
scheduler.enqueue("b", "b1", 1);
scheduler.dispatch(1);`),
        pair("hidden canceled ID can be reused after reaping", "hidden", "scheduler.dispatch(1)", "list(\"j\")", String.raw`
Solution scheduler = new Solution(2);
scheduler.enqueue("a", "j", 1);
scheduler.cancel("j");
scheduler.dispatch(1);
scheduler.enqueue("a", "j", 1);`),
        test("hidden invalid fairness rejected", "hidden", String.raw`
throwsException(IllegalArgumentException.class, () -> new Solution(0));`),
        test("hidden fairness streak across dispatches", "hidden", String.raw`
Solution scheduler = new Solution(2);
scheduler.enqueue("a", "a1", 1);
scheduler.enqueue("a", "a2", 1);
scheduler.enqueue("a", "a3", 1);
scheduler.enqueue("a", "a4", 1);
scheduler.enqueue("b", "b1", 1);
eq(scheduler.dispatch(2), list("a1", "a2"));
eq(scheduler.dispatch(2), list("b1", "a3"));`),
        test("hidden canceled alternate and zero count preserve live fairness", "hidden", String.raw`
Solution scheduler = new Solution(1);
scheduler.enqueue("a", "a1", -1);
scheduler.dispatch(1);
scheduler.enqueue("a", "a2", 1);
scheduler.enqueue("b", "b1", 0);
scheduler.enqueue("c", "c1", 9);
scheduler.cancel("b1");
eq(scheduler.dispatch(0), list());
check(scheduler.cancel("b1"));
check(scheduler.cancel("b1"));
eq(scheduler.dispatch(2), list("c1", "a2"));
check(!scheduler.cancel("b1"));`),
        test("hidden canceled identifier stays reserved until reaped", "hidden", String.raw`
Solution scheduler = new Solution(2);
scheduler.enqueue("team", "job-1", 1);
check(scheduler.cancel("job-1"));
throwsException(IllegalArgumentException.class, () -> scheduler.enqueue("team", "job-1", 2));
eq(scheduler.dispatch(1), list());
scheduler.enqueue("team", "job-1", 2);
eq(scheduler.dispatch(1), list("job-1"));
check(!scheduler.cancel("job-1"));`),
        test("hidden heap preemption and lazy cancellation scale cleanly", "hidden", String.raw`
Solution s = new Solution(1);
s.enqueue("a", "a_low", 5);
s.enqueue("a", "a_high1", 1);
s.enqueue("a", "a_high2", 2);
s.enqueue("b", "b_low", 10);
eq(s.dispatch(4), list("a_high1", "b_low", "a_high2", "a_low"));
Solution big = new Solution(2);
for (int t = 0; t < 25; t++) {
    for (int j = 0; j < 80; j++) {
        big.enqueue("org-" + t, "job-" + t + "-" + j, (t + j) % 7);
    }
}
for (int t = 0; t < 25; t += 3) {
    check(big.cancel("job-" + t + "-0"));
}
List<String> out = big.dispatch(400);
eq(out.size(), 400);
check(!out.contains("job-0-0"));
big.enqueue("org-0", "job-0-0", -5);
eq(big.dispatch(1), list("job-0-0"));`),
    ], String.raw`
import java.util.*;

class Solution {
    private record OrgJob(int priority, int seq, String id) {}
    private record TopHead(int priority, int seq, String org) {}

    private static final Comparator<OrgJob> ORG_ORDER =
        Comparator.comparingInt(OrgJob::priority).thenComparingInt(OrgJob::seq);
    private static final Comparator<TopHead> TOP_ORDER =
        Comparator.comparingInt(TopHead::priority).thenComparingInt(TopHead::seq);

    private final int maxConsecutive;
    private final Map<String, PriorityQueue<OrgJob>> orgHeaps = new HashMap<>();
    private final PriorityQueue<TopHead> topHeap = new PriorityQueue<>(TOP_ORDER);
    private final Set<Integer> inTopHeap = new HashSet<>();
    private final Map<String, Integer> activeSeqById = new HashMap<>();
    private final Set<String> canceledIds = new HashSet<>();
    private final Set<Integer> deadSeqs = new HashSet<>();
    private int sequence = 0;
    private String lastOrg = null;
    private int streak = 0;

    Solution(int maxConsecutivePerOrg) {
        if (maxConsecutivePerOrg <= 0) throw new IllegalArgumentException("invalid fairness");
        this.maxConsecutive = maxConsecutivePerOrg;
    }

    private OrgJob refreshOrg(String org) {
        PriorityQueue<OrgJob> heap = orgHeaps.get(org);
        while (heap != null && !heap.isEmpty() && deadSeqs.contains(heap.peek().seq())) {
            deadSeqs.remove(heap.poll().seq());
        }
        if (heap == null || heap.isEmpty()) {
            orgHeaps.remove(org);
            return null;
        }
        OrgJob head = heap.peek();
        if (inTopHeap.add(head.seq())) {
            topHeap.offer(new TopHead(head.priority(), head.seq(), org));
        }
        return head;
    }

    private TopHead popValidOrg(String skipOrg) {
        while (!topHeap.isEmpty()) {
            TopHead entry = topHeap.poll();
            if (entry.org().equals(skipOrg)) {
                inTopHeap.remove(entry.seq());
                continue;
            }
            OrgJob head = refreshOrg(entry.org());
            inTopHeap.remove(entry.seq());
            if (head != null && head.priority() == entry.priority() && head.seq() == entry.seq()) {
                return entry;
            }
        }
        return null;
    }

    void enqueue(String org, String jobId, int priority) {
        if (activeSeqById.containsKey(jobId)) throw new IllegalArgumentException("duplicate job");
        int seq = sequence++;
        activeSeqById.put(jobId, seq);
        orgHeaps.computeIfAbsent(org, ignored -> new PriorityQueue<>(ORG_ORDER))
            .offer(new OrgJob(priority, seq, jobId));
        refreshOrg(org);
    }

    boolean cancel(String jobId) {
        if (!activeSeqById.containsKey(jobId)) return false;
        canceledIds.add(jobId);
        return true;
    }

    List<String> dispatch(int count) {
        List<String> result = new ArrayList<>();
        if (count <= 0) return result;
        if (!canceledIds.isEmpty()) {
            for (String jobId : canceledIds) {
                Integer seq = activeSeqById.remove(jobId);
                if (seq != null) deadSeqs.add(seq);
            }
            canceledIds.clear();
        }
        for (int i = 0; i < count; i++) {
            TopHead first = popValidOrg(null);
            if (first == null) break;
            String chosenOrg = first.org();
            if (lastOrg != null && chosenOrg.equals(lastOrg) && streak >= maxConsecutive) {
                TopHead second = popValidOrg(first.org());
                if (second != null) {
                    inTopHeap.add(first.seq());
                    topHeap.offer(first);
                    chosenOrg = second.org();
                }
            }
            OrgJob job = orgHeaps.get(chosenOrg).poll();
            activeSeqById.remove(job.id());
            refreshOrg(chosenOrg);
            streak = chosenOrg.equals(lastOrg) ? streak + 1 : 1;
            lastOrg = chosenOrg;
            result.add(job.id());
        }
        return result;
    }
}`, "Maintain one PriorityQueue per tenant plus a top-level PriorityQueue of live tenant heads, reaping soft cancellations lazily."),

    "agent-event-timeline": bundle(String.raw`
import java.util.*;

class Solution {
    int append(String runId, String kind, double timestamp, String message) {
        return 0;
    }

    List<Map<String, Object>> listEvents(String runId, int afterSeq, int limit) {
        return new ArrayList<>();
    }
}`, [
        test("public appends and lists one run", "sample", String.raw`
Solution timeline = new Solution();
eq(timeline.append("r1", "log", 1.0, "started"), 1);
eq(timeline.append("r2", "log", 2.0, "other"), 2);
eq(timeline.listEvents("r1", 0, 100), list(map("seq", 1, "kind", "log", "timestamp", 1.0, "message", "started")));`),
        test("public redacts secrets", "sample", String.raw`
Solution timeline = new Solution();
timeline.append("r1", "stderr", 1.0, "token sk-live_123 failed");
eq(timeline.listEvents("r1", 0, 100).get(0).get("message"), "token [REDACTED] failed");`),
        test("hidden after cursor", "hidden", String.raw`
Solution timeline = new Solution();
timeline.append("r1", "log", 1.0, "a");
timeline.append("r1", "log", 2.0, "b");
eq(timeline.listEvents("r1", 1, 100).get(0).get("message"), "b");`),
        test("hidden limit", "hidden", String.raw`
Solution timeline = new Solution();
for (int i = 0; i < 5; i++) timeline.append("r1", "log", (double) i, "" + i);
eq(timeline.listEvents("r1", 0, 2).size(), 2);
eq(timeline.listEvents("r1", 0, 2).get(0).get("seq"), 1);
eq(timeline.listEvents("r1", 0, 2).get(1).get("seq"), 2);`),
        test("hidden global sequence", "hidden", String.raw`
Solution timeline = new Solution();
eq(timeline.append("a", "log", 1.0, "a"), 1);
eq(timeline.append("b", "log", 1.0, "b"), 2);
eq(timeline.append("a", "log", 2.0, "c"), 3);`),
        pair("public lists no events for unknown run", "sample", "timeline.listEvents(\"missing\", 0, 100)", "list()", String.raw`
Solution timeline = new Solution();`),
        pair("hidden nonpositive limit returns empty", "hidden", "timeline.listEvents(\"r\", 0, 0)", "list()", String.raw`
Solution timeline = new Solution();
timeline.append("r", "log", 1.0, "present");`),
        pair("hidden redacts multiple secrets", "hidden", "timeline.listEvents(\"r\", 0, 100).get(0).get(\"message\")", "\"a [REDACTED] b [REDACTED]\"", String.raw`
Solution timeline = new Solution();
timeline.append("r", "log", 1.0, "a sk-one b sk-two_2");`),
    ], String.raw`
import java.util.*;

class Solution {
    private static class Event {
        final String runId;
        final int seq;
        final String kind;
        final double timestamp;
        final String message;

        Event(String runId, int seq, String kind, double timestamp, String message) {
            this.runId = runId;
            this.seq = seq;
            this.kind = kind;
            this.timestamp = timestamp;
            this.message = message;
        }
    }

    private final List<Event> events = new ArrayList<>();
    private int nextSeq = 1;

    int append(String runId, String kind, double timestamp, String message) {
        int seq = nextSeq++;
        events.add(new Event(runId, seq, kind, timestamp, redact(message)));
        return seq;
    }

    List<Map<String, Object>> listEvents(String runId, int afterSeq, int limit) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (limit <= 0) return result;
        for (Event event : events) {
            if (event.runId.equals(runId) && event.seq > afterSeq) {
                result.add(mapOf("seq", event.seq, "kind", event.kind, "timestamp", event.timestamp, "message", event.message));
                if (result.size() >= limit) break;
            }
        }
        return result;
    }

    private String redact(String value) {
        return value.replaceAll("sk-[A-Za-z0-9_-]+", "[REDACTED]");
    }

    private Map<String, Object> mapOf(Object... items) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < items.length; i += 2) result.put((String) items[i], items[i + 1]);
        return result;
    }
}`, "Store global sequence numbers and filter by run ID at read time."),

    "command-log-classifier": bundle(String.raw`
import java.util.*;

class Solution {
    Map<String, Object> classify(List<Map<String, Object>> events) {
        return new LinkedHashMap<>();
    }
}`, [
        test("public failed command summary", "sample", String.raw`
Solution solution = new Solution();
Map<String, Object> summary = solution.classify(list(map("cmd", "pytest", "exit_code", 1, "stdout", "", "stderr", "failed")));
eq(summary.get("status"), "failed");
eq(summary.get("failed"), 1);
eq(summary.get("first_failure_cmd"), "pytest");`),
        test("public passed command summary", "sample", String.raw`
Solution solution = new Solution();
eq(solution.classify(list(map("cmd", "lint", "exit_code", 0, "stdout", "ok", "stderr", ""))).get("status"), "passed");`),
        test("hidden redacts stdout and stderr", "hidden", String.raw`
Solution solution = new Solution();
Map<String, Object> summary = solution.classify(list(map("cmd", "print", "exit_code", 0, "stdout", "sk-live", "stderr", "err sk-test_2")));
eq(summary.get("redacted_logs"), list("stdout: [REDACTED]", "stderr: err [REDACTED]"));`),
        test("hidden empty input", "hidden", String.raw`
Solution solution = new Solution();
Map<String, Object> summary = solution.classify(list());
eq(summary.get("status"), "passed");
eq(summary.get("total"), 0);
eq(summary.get("failed"), 0);
eq(summary.get("first_failure_cmd"), null);
eq(summary.get("redacted_logs"), list());`),
        test("hidden multiple failures keeps first", "hidden", String.raw`
Solution solution = new Solution();
Map<String, Object> summary = solution.classify(list(map("cmd", "a", "exit_code", 2), map("cmd", "b", "exit_code", 1)));
eq(summary.get("failed"), 2);
eq(summary.get("first_failure_cmd"), "a");`),
        pair("public stderr does not override successful exit", "sample", "new Solution().classify(events)", "map(\"status\", \"passed\", \"total\", 1, \"failed\", 0, \"first_failure_cmd\", null, \"redacted_logs\", list(\"stderr: warning\"))", String.raw`
List<Map<String, Object>> events = list(map("cmd", "build", "exit_code", 0, "stderr", "warning"));`),
        test("hidden preserves Python line order", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.classify(list(map("cmd", "run", "exit_code", 0, "stdout", "first\r\n\r\nthird", "stderr", "one\r\ntwo"))).get("redacted_logs"), list("stdout: first", "stdout: ", "stdout: third", "stderr: one", "stderr: two"));`),
        pair("hidden leaves input events untouched", "hidden", "events", "before", String.raw`
List<Map<String, Object>> events = list(map("cmd", "print", "exit_code", 0, "stdout", "sk-live", "stderr", "err sk-test_2"));
List<Map<String, Object>> before = new ArrayList<>();
for (Map<String, Object> event : events) before.add(new LinkedHashMap<>(event));
new Solution().classify(events);`),
        pair("hidden missing output fields are empty", "hidden", "new Solution().classify(events).get(\"redacted_logs\")", "list()", String.raw`
List<Map<String, Object>> events = list(map("cmd", "run", "exit_code", 0));`),
    ], String.raw`
import java.util.*;

class Solution {
    Map<String, Object> classify(List<Map<String, Object>> events) {
        int failed = 0;
        Object firstFailure = null;
        List<String> logs = new ArrayList<>();
        for (Map<String, Object> event : events) {
            int exitCode = ((Number) event.getOrDefault("exit_code", 0)).intValue();
            if (exitCode != 0) {
                failed++;
                if (firstFailure == null) firstFailure = event.get("cmd");
            }
            for (String stream : List.of("stdout", "stderr")) {
                Object val = event.get(stream);
                if (val == null) continue;
                String text = String.valueOf(val);
                if (text.isEmpty()) continue;
                for (String line : splitLines(text)) logs.add(stream + ": " + redact(line));
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", failed == 0 ? "passed" : "failed");
        result.put("total", events.size());
        result.put("failed", failed);
        result.put("first_failure_cmd", firstFailure);
        result.put("redacted_logs", logs);
        return result;
    }

    private String redact(String value) {
        return value.replaceAll("sk-[A-Za-z0-9_-]+", "[REDACTED]");
    }

    private List<String> splitLines(String text) {
        List<String> lines = new ArrayList<>();
        int start = 0;
        for (int index = 0; index < text.length();) {
            int separatorLength = 0;
            char current = text.charAt(index);
            if (current == '\r') {
                separatorLength = index + 1 < text.length() && text.charAt(index + 1) == '\n' ? 2 : 1;
            } else if (current == '\n' || current == '\u000B' || current == '\f' || (current >= '\u001C' && current <= '\u001E') || current == '\u0085' || current == '\u2028' || current == '\u2029') {
                separatorLength = 1;
            }
            if (separatorLength == 0) {
                index++;
                continue;
            }
            lines.add(text.substring(start, index));
            index += separatorLength;
            start = index;
        }
        if (start < text.length()) lines.add(text.substring(start));
        return lines;
    }
}`, "Trust exit code for pass/fail and redact logs before returning them."),

    "pr-readiness-gate": bundle(String.raw`
import java.util.*;

class Solution {
    List<String> blockers(List<Map<String, Object>> checks, List<Map<String, Object>> reviews, List<String> artifacts, List<String> requiredChecks) {
        return new ArrayList<>();
    }
}`, [
        test("public ready pull request", "sample", String.raw`
Solution solution = new Solution();
eq(solution.blockers(list(map("name", "test", "status", "passed")), list(map("user", "u", "state", "approved")), list("diff", "tests"), list("test")), list());`),
        test("public missing and failing checks", "sample", String.raw`
Solution solution = new Solution();
eq(solution.blockers(list(map("name", "lint", "status", "failed")), list(), list(), list("lint", "test")), list("approval_required", "failing_check:lint", "missing_artifact:diff", "missing_artifact:tests", "missing_check:test"));`),
        test("hidden changes requested blocks", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.blockers(list(map("name", "test", "status", "passed")), list(map("state", "approved"), map("state", "changes_requested")), list("diff", "tests"), list("test")), list("changes_requested"));`),
        test("hidden duplicate check uses latest", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.blockers(list(map("name", "test", "status", "failed"), map("name", "test", "status", "passed")), list(map("state", "approved")), list("diff", "tests"), list("test")), list());`),
        test("hidden present check with null status fails", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.blockers(list(map("name", "test", "status", null)), list(map("state", "approved")), list("diff", "tests"), list("test")), list("failing_check:test"));`),
        test("hidden ignored nonrequired failing check", "hidden", String.raw`
Solution solution = new Solution();
eq(solution.blockers(list(map("name", "optional", "status", "failed"), map("name", "test", "status", "passed")), list(map("state", "approved")), list("diff", "tests"), list("test")), list());`),
        pair("public requires an approval", "sample", "new Solution().blockers(checks, list(), list(\"diff\", \"tests\"), list(\"test\"))", "list(\"approval_required\")", String.raw`
List<Map<String, Object>> checks = list(map("name", "test", "status", "passed"));`),
        pair("hidden reports one missing artifact", "hidden", "new Solution().blockers(checks, reviews, list(\"diff\"), list(\"test\"))", "list(\"missing_artifact:tests\")", String.raw`
List<Map<String, Object>> checks = list(map("name", "test", "status", "passed"));
List<Map<String, Object>> reviews = list(map("state", "approved"));`),
        pair("hidden sorts blockers lexicographically", "hidden", "new Solution().blockers(list(), list(), list(), list(\"z\", \"a\"))", "list(\"approval_required\", \"missing_artifact:diff\", \"missing_artifact:tests\", \"missing_check:a\", \"missing_check:z\")"),
        pair("hidden latest failing check supersedes earlier success", "hidden", "new Solution().blockers(checks, reviews, list(\"diff\", \"tests\"), list(\"test\"))", "list(\"failing_check:test\")", String.raw`
List<Map<String, Object>> checks = list(map("name", "test", "status", "passed"), map("name", "test", "status", "failed"));
List<Map<String, Object>> reviews = list(map("state", "approved"));`),
    ], String.raw`
import java.util.*;

class Solution {
    List<String> blockers(List<Map<String, Object>> checks, List<Map<String, Object>> reviews, List<String> artifacts, List<String> requiredChecks) {
        List<String> blockers = new ArrayList<>();
        Map<String, Object> byCheck = new LinkedHashMap<>();
        for (Map<String, Object> check : checks) byCheck.put(String.valueOf(check.get("name")), check.get("status"));
        for (String name : requiredChecks) {
            if (!byCheck.containsKey(name)) blockers.add("missing_check:" + name);
            else if (!"passed".equals(byCheck.get(name))) blockers.add("failing_check:" + name);
        }
        List<Object> states = new ArrayList<>();
        for (Map<String, Object> review : reviews) states.add(review.get("state"));
        if (!states.contains("approved")) blockers.add("approval_required");
        if (states.contains("changes_requested")) blockers.add("changes_requested");
        Set<String> artifactSet = new HashSet<>(artifacts);
        for (String artifact : List.of("diff", "tests")) {
            if (!artifactSet.contains(artifact)) blockers.add("missing_artifact:" + artifact);
        }
        Collections.sort(blockers);
        return blockers;
    }
}`, "Collect deterministic blockers across required checks, reviews, and required build artifacts."),
}
