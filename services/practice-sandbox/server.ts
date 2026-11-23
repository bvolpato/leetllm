import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { PRACTICE_LANGUAGES, type PracticeLanguage } from "../../web/src/lib/practice-languages"
import type { PracticeTestCase } from "../../web/src/lib/practice"
import {
    runPracticeSpec,
    type PracticeExecutionSpec,
    type PracticeRunMode,
} from "../../web/src/lib/practice-runner"
import { isBwrapAvailable } from "../../web/src/lib/practice-sandbox-exec"

const PORT = Number(process.env.PORT || "8080")
const MAX_BODY_BYTES = 256 * 1024
const MAX_CODE_BYTES = 64 * 1024
const MAX_CUSTOM_TESTS = 3
const MAX_CONCURRENT_RUNS = Math.max(1, Number(process.env.SANDBOX_MAX_CONCURRENT || "4"))

let activeRuns = 0

function sendJson(res: ServerResponse, status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
    const serialized = JSON.stringify(body)
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": Buffer.byteLength(serialized).toString(),
        ...extraHeaders,
    })
    res.end(serialized)
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        let totalBytes = 0
        req.on("data", (chunk: Buffer) => {
            totalBytes += chunk.length
            if (totalBytes > MAX_BODY_BYTES) {
                reject(Object.assign(new Error("Payload too large"), { statusCode: 413 }))
                req.destroy()
                return
            }
            chunks.push(chunk)
        })
        req.on("end", () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
            } catch {
                reject(Object.assign(new Error("Invalid JSON body"), { statusCode: 400 }))
            }
        })
        req.on("error", (err) => reject(err))
    })
}

function isRunMode(value: unknown): value is PracticeRunMode {
    return value === "run" || value === "submit"
}

function isPracticeLanguage(value: unknown): value is PracticeLanguage {
    return typeof value === "string" && value in PRACTICE_LANGUAGES
}

function isValidSpec(value: unknown): value is PracticeExecutionSpec {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false
    const spec = value as Record<string, unknown>
    return typeof spec.slug === "string"
        && /^[a-z0-9-]{1,120}$/.test(spec.slug)
        && isPracticeLanguage(spec.language)
        && typeof spec.timeLimitMs === "number"
        && Number.isFinite(spec.timeLimitMs)
        && spec.timeLimitMs >= 500
        && spec.timeLimitMs <= 15_000
        && typeof spec.memoryLimitMb === "number"
        && Number.isFinite(spec.memoryLimitMb)
        && spec.memoryLimitMb >= 64
        && spec.memoryLimitMb <= 512
        && Array.isArray(spec.testCases)
        && spec.testCases.length > 0
        && spec.testCases.length <= 50
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`)

    if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, {
            ok: true,
            service: "leetllm-sandbox",
            bwrap: isBwrapAvailable(),
            activeRuns,
            maxConcurrentRuns: MAX_CONCURRENT_RUNS,
        })
        return
    }

    if (req.method !== "POST" || url.pathname !== "/run") {
        sendJson(res, 404, { error: "Not found" })
        return
    }

    if (activeRuns >= MAX_CONCURRENT_RUNS) {
        sendJson(res, 503, { error: "Sandbox busy" }, { "Retry-After": "1" })
        return
    }

    let body: unknown
    try {
        body = await readJsonBody(req)
    } catch (error) {
        const status = typeof (error as { statusCode?: unknown })?.statusCode === "number"
            ? (error as { statusCode: number }).statusCode
            : 400
        sendJson(res, status, { error: error instanceof Error ? error.message : "Bad request" })
        return
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        sendJson(res, 400, { error: "Invalid request payload" })
        return
    }

    const { spec, code, mode, customTests } = body as Record<string, unknown>
    if (!isValidSpec(spec)) {
        sendJson(res, 400, { error: "Invalid execution specification" })
        return
    }
    if (typeof code !== "string" || code.length === 0 || Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
        sendJson(res, 400, { error: "Invalid code payload" })
        return
    }
    if (!isRunMode(mode)) {
        sendJson(res, 400, { error: "Invalid run mode" })
        return
    }
    if (customTests !== undefined && (!Array.isArray(customTests) || customTests.length > MAX_CUSTOM_TESTS)) {
        sendJson(res, 400, { error: "Invalid custom tests" })
        return
    }

    activeRuns += 1
    try {
        const result = await runPracticeSpec({
            spec,
            code,
            mode,
            customTests: customTests as PracticeTestCase[] | undefined,
        })
        const bwrapNote = isBwrapAvailable() ? " + bubblewrap namespaces" : ""
        const isolation = spec.language === "java"
            ? `isolated zero-secret Cloud Run sandbox + allowlisted Java verifier${bwrapNote}`
            : `isolated zero-secret Cloud Run sandbox + Python audit hook & AST${bwrapNote}`
        sendJson(res, 200, { result, isolation })
    } catch {
        sendJson(res, 500, { error: "Sandbox execution failed" })
    } finally {
        activeRuns -= 1
    }
})

server.listen(PORT, "0.0.0.0", () => {
    console.log(`leetllm-sandbox listening on :${PORT} (bwrap=${isBwrapAvailable()})`)
})
