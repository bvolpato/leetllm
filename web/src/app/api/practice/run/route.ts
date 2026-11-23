import { NextRequest, NextResponse } from "next/server"
import { getClientIp } from "@/lib/googlebot"
import { getPracticeProblem, getPracticeProblemLanguage, type PracticeTestCase } from "@/lib/practice"
import { PRACTICE_LANGUAGES, type PracticeLanguage } from "@/lib/practice-languages"
import { type PracticeRunMode } from "@/lib/practice-runner"
import {
    executePracticeCode,
    PracticeRunnerUnavailableError,
} from "@/lib/practice-runner-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_CODE_BYTES = 64 * 1024
const MAX_CUSTOM_TESTS = 3
const MAX_CUSTOM_TEST_CODE_BYTES = 16 * 1024
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 20
const MAX_TRACKED_IPS = 2048
const MAX_CONCURRENT_RUNS = 6

const NO_STORE_HEADERS = {
    "Cache-Control": "private, no-store, max-age=0",
}

const ipRequestTimestamps = new Map<string, number[]>()
let activeRuns = 0

function checkRateLimit(ip: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
    const cutoff = now - RATE_LIMIT_WINDOW_MS
    const recent = (ipRequestTimestamps.get(ip) ?? []).filter((ts) => ts > cutoff)
    if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        const oldest = recent[0]
        const retryAfterSec = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000))
        ipRequestTimestamps.set(ip, recent)
        return { allowed: false, retryAfterSec }
    }

    recent.push(now)
    ipRequestTimestamps.delete(ip)
    ipRequestTimestamps.set(ip, recent)
    while (ipRequestTimestamps.size > MAX_TRACKED_IPS) {
        const oldestKey = ipRequestTimestamps.keys().next().value as string | undefined
        if (!oldestKey) break
        ipRequestTimestamps.delete(oldestKey)
    }
    return { allowed: true, retryAfterSec: 0 }
}

function isRunMode(value: unknown): value is PracticeRunMode {
    return value === "run" || value === "submit"
}

function isPracticeLanguage(value: unknown): value is PracticeLanguage {
    return typeof value === "string" && value in PRACTICE_LANGUAGES
}

function readCustomTests(value: unknown): PracticeTestCase[] | null {
    if (typeof value === "undefined") return null
    if (!Array.isArray(value) || value.length > MAX_CUSTOM_TESTS) return null

    const tests: PracticeTestCase[] = []
    for (const [index, raw] of value.entries()) {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
        const record = raw as Record<string, unknown>
        const code = record.code
        const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : `Custom test ${index + 1}`
        if (typeof code !== "string" || !code.trim()) return null
        if (Buffer.byteLength(code, "utf-8") > MAX_CUSTOM_TEST_CODE_BYTES) return null
        tests.push({
            name: name.slice(0, 100),
            visibility: "custom",
            code,
            description: typeof record.description === "string" ? record.description.slice(0, 500) : undefined,
            input: typeof record.input === "string" ? record.input.slice(0, 1000) : undefined,
            expected: typeof record.expected === "string" ? record.expected.slice(0, 1000) : undefined,
            feedback: typeof record.feedback === "string" ? record.feedback.slice(0, 500) : undefined,
        })
    }
    return tests
}

export async function POST(request: NextRequest) {
    const clientIp = getClientIp(request) || "unknown"
    const rateLimit = checkRateLimit(clientIp)
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Too many practice runs. Please wait before trying again." },
            {
                status: 429,
                headers: {
                    ...NO_STORE_HEADERS,
                    "Retry-After": String(rateLimit.retryAfterSec),
                },
            },
        )
    }

    if (activeRuns >= MAX_CONCURRENT_RUNS) {
        return NextResponse.json(
            { error: "Practice runner is busy. Please retry in a moment." },
            {
                status: 503,
                headers: {
                    ...NO_STORE_HEADERS,
                    "Retry-After": "2",
                },
            },
        )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: NO_STORE_HEADERS })
    }

    const { slug, code, mode, language: rawLanguage, customTests: rawCustomTests } = body as Record<string, unknown>
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json({ error: "Invalid problem slug" }, { status: 400, headers: NO_STORE_HEADERS })
    }
    if (typeof code !== "string" || code.length === 0) {
        return NextResponse.json({ error: "Missing code" }, { status: 400, headers: NO_STORE_HEADERS })
    }
    if (Buffer.byteLength(code, "utf-8") > MAX_CODE_BYTES) {
        return NextResponse.json({ error: "Code is too large" }, { status: 413, headers: NO_STORE_HEADERS })
    }
    if (!isRunMode(mode)) {
        return NextResponse.json({ error: 'Mode must be "run" or "submit"' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    if (rawLanguage !== undefined && !isPracticeLanguage(rawLanguage)) {
        return NextResponse.json(
            { error: `Language must be one of ${Object.keys(PRACTICE_LANGUAGES).join(", ")}` },
            { status: 400, headers: NO_STORE_HEADERS },
        )
    }
    const customTests = readCustomTests(rawCustomTests)
    if (typeof rawCustomTests !== "undefined" && customTests === null) {
        return NextResponse.json(
            { error: `Custom tests must include 1-${MAX_CUSTOM_TESTS} non-empty code snippets` },
            { status: 400, headers: NO_STORE_HEADERS },
        )
    }
    if (customTests?.length && mode !== "run") {
        return NextResponse.json(
            { error: "Custom tests can only run in run mode" },
            { status: 400, headers: NO_STORE_HEADERS },
        )
    }

    const problem = getPracticeProblem(slug)
    if (!problem) {
        return NextResponse.json({ error: "Problem not found" }, { status: 404, headers: NO_STORE_HEADERS })
    }
    const language = rawLanguage ?? problem.language
    if (!getPracticeProblemLanguage(problem, language)) {
        return NextResponse.json({ error: "Unsupported language" }, { status: 400, headers: NO_STORE_HEADERS })
    }

    activeRuns += 1
    try {
        const { result, isolation } = await executePracticeCode({
            problem,
            code,
            mode,
            language,
            customTests: customTests ?? undefined,
        })
        return NextResponse.json(
            {
                ...result,
                language,
                sandbox: {
                    isolation,
                    timeoutMs: problem.timeLimitMs,
                    memoryLimitMb: problem.memoryLimitMb,
                },
            },
            { headers: NO_STORE_HEADERS },
        )
    } catch (error) {
        if (error instanceof PracticeRunnerUnavailableError) {
            return NextResponse.json(
                { error: error.message },
                { status: 503, headers: { ...NO_STORE_HEADERS, "Retry-After": "2" } },
            )
        }
        return NextResponse.json(
            { error: "Practice execution failed" },
            { status: 500, headers: NO_STORE_HEADERS },
        )
    } finally {
        activeRuns -= 1
    }
}
