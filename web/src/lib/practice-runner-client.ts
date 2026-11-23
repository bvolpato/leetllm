import type { PracticeProblem, PracticeTestCase } from "./practice"
import { getPracticeProblemLanguage } from "./practice"
import type { PracticeLanguage } from "./practice-languages"
import {
    runPracticeCode,
    type PracticeExecutionSpec,
    type PracticeRunMode,
    type PracticeRunResult,
} from "./practice-runner"
import { isBwrapAvailable } from "./practice-sandbox-exec"

export class PracticeRunnerUnavailableError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "PracticeRunnerUnavailableError"
    }
}

interface CachedToken {
    audience: string
    token: string
    expiresAtMs: number
}

let cachedIdToken: CachedToken | null = null

function parseJwtExpiryMs(jwt: string): number {
    try {
        const parts = jwt.split(".")
        if (parts.length !== 3) return Date.now() + 5 * 60_000
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { exp?: number }
        if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
            return payload.exp * 1000
        }
    } catch {
        // Fallback to conservative 5-minute TTL if token cannot be decoded.
    }
    return Date.now() + 5 * 60_000
}

async function fetchCloudRunIdToken(audience: string): Promise<string> {
    if (process.env.PRACTICE_RUNNER_AUTH_TOKEN) {
        return process.env.PRACTICE_RUNNER_AUTH_TOKEN
    }

    const now = Date.now()
    if (cachedIdToken && cachedIdToken.audience === audience && cachedIdToken.expiresAtMs - 60_000 > now) {
        return cachedIdToken.token
    }

    const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}`
    let response: Response
    try {
        response = await fetch(metadataUrl, {
            headers: { "Metadata-Flavor": "Google" },
            signal: AbortSignal.timeout(5000),
        })
    } catch {
        throw new PracticeRunnerUnavailableError("Could not acquire Cloud Run identity token for sandbox")
    }

    if (!response.ok) {
        throw new PracticeRunnerUnavailableError(`Identity token request failed (${response.status})`)
    }
    const token = (await response.text()).trim()
    if (!token) {
        throw new PracticeRunnerUnavailableError("Received empty identity token for sandbox")
    }

    cachedIdToken = {
        audience,
        token,
        expiresAtMs: parseJwtExpiryMs(token),
    }
    return token
}

function resolveRemoteRunnerUrl(): URL | null {
    const raw = process.env.PRACTICE_RUNNER_URL?.trim()
    if (!raw) return null
    const parsed = new URL(raw)
    if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
        throw new PracticeRunnerUnavailableError("PRACTICE_RUNNER_URL must use https")
    }
    return parsed
}

export function resetRemoteTokenCacheForTests() {
    cachedIdToken = null
}

export async function executePracticeCode({
    problem,
    code,
    mode,
    language,
    customTests,
}: {
    problem: PracticeProblem
    code: string
    mode: PracticeRunMode
    language: PracticeLanguage
    customTests?: PracticeTestCase[]
}): Promise<{ result: PracticeRunResult; isolation: string }> {
    const remoteUrl = resolveRemoteRunnerUrl()
    const requireRemote = process.env.PRACTICE_RUNNER_REQUIRE_REMOTE === "true"

    if (!remoteUrl) {
        if (requireRemote) {
            throw new PracticeRunnerUnavailableError("Isolated practice sandbox is not configured")
        }
        const result = await runPracticeCode({ problem, code, mode, language, customTests })
        const bwrapNote = isBwrapAvailable() ? " with bubblewrap namespaces" : ""
        const isolation = language === "java"
            ? `local allowlisted Java subprocess${bwrapNote}`
            : `local hardened Python subprocess (audit hook + AST)${bwrapNote}`
        return { result, isolation }
    }

    const bundle = getPracticeProblemLanguage(problem, language)
    if (!bundle) {
        throw new PracticeRunnerUnavailableError(`Unsupported language: ${language}`)
    }

    const spec: PracticeExecutionSpec = {
        slug: problem.slug,
        language,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        testCases: bundle.testCases,
    }

    const endpoint = new URL("/run", remoteUrl.origin)
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    }
    if (remoteUrl.protocol === "https:" || process.env.PRACTICE_RUNNER_AUTH_TOKEN) {
        const token = await fetchCloudRunIdToken(remoteUrl.origin)
        headers.Authorization = `Bearer ${token}`
    }

    const requestTimeoutMs = Math.max(problem.timeLimitMs, 1000) + 15_000
    let response: Response
    try {
        response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify({ spec, code, mode, customTests }),
            signal: AbortSignal.timeout(requestTimeoutMs),
        })
    } catch {
        throw new PracticeRunnerUnavailableError("Isolated practice sandbox timed out or was unreachable")
    }

    if (response.status === 503 || response.status === 429) {
        throw new PracticeRunnerUnavailableError("Practice sandbox is busy, please retry in a moment")
    }
    if (!response.ok) {
        throw new PracticeRunnerUnavailableError(`Practice sandbox returned HTTP ${response.status}`)
    }

    const payload = (await response.json()) as { result: PracticeRunResult; isolation?: string }
    if (!payload || typeof payload !== "object" || !payload.result) {
        throw new PracticeRunnerUnavailableError("Practice sandbox returned an invalid payload")
    }
    return {
        result: payload.result,
        isolation: payload.isolation || "isolated zero-secret Cloud Run sandbox service",
    }
}
