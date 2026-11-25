import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import {
    CodexPersonalizationError,
    disposeCodexPersonalizationRuntime,
    generateLocalCodexStructuredJson,
    isLocalCodexConfigured,
    type CodexMcpServer,
    type JsonSchema,
} from "../../web/src/lib/codex-runner-core.ts"

const PORT = Number(process.env.PORT || "8080")
const MAX_BODY_BYTES = 1024 * 1024

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

const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`)

    if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, {
            ok: true,
            service: "leetllm-codex",
            configured: await isLocalCodexConfigured(),
        })
        return
    }

    if (req.method !== "POST" || url.pathname !== "/generate") {
        sendJson(res, 404, { error: "Not found" })
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

    const {
        model,
        systemInstruction,
        prompt,
        schema,
        maxOutputTokens,
        timeoutMs,
        mcpServers,
        stableWorkspaceId,
    } = body as Record<string, unknown>

    if (
        typeof model !== "string"
        || typeof systemInstruction !== "string"
        || typeof prompt !== "string"
        || !schema
        || typeof schema !== "object"
        || Array.isArray(schema)
    ) {
        sendJson(res, 400, { error: "Missing required Codex generation fields" })
        return
    }

    try {
        const result = await generateLocalCodexStructuredJson({
            model,
            systemInstruction,
            prompt,
            schema: schema as JsonSchema,
            maxOutputTokens: typeof maxOutputTokens === "number" ? maxOutputTokens : undefined,
            timeoutMs: typeof timeoutMs === "number" ? timeoutMs : undefined,
            mcpServers: Array.isArray(mcpServers) ? (mcpServers as CodexMcpServer[]) : [],
            stableWorkspaceId: typeof stableWorkspaceId === "string" ? stableWorkspaceId : undefined,
        })
        sendJson(res, 200, result)
    } catch (error) {
        if (error instanceof CodexPersonalizationError) {
            sendJson(res, error.status, {
                errorCode: error.code,
                error: error.message,
            })
            return
        }
        console.error("Unexpected Codex runner error:", error)
        sendJson(res, 502, {
            errorCode: "unavailable",
            error: "Personalization provider is unavailable",
        })
    }
})

server.listen(PORT, "0.0.0.0", () => {
    console.log(`leetllm-codex listening on :${PORT}`)
})

for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
        server.close(async () => {
            try {
                await disposeCodexPersonalizationRuntime()
            } catch {
                // Ignore active cleanup errors on forced shutdown
            }
            process.exit(0)
        })
    })
}
