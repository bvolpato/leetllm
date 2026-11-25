import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { rmSync } from "node:fs"
import {
    chmod,
    mkdir,
    mkdtemp,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

export interface CodexTokenUsage {
    promptTokenCount?: number
    cachedContentTokenCount?: number
    candidatesTokenCount?: number
    thoughtsTokenCount?: number
    totalTokenCount?: number
}

const CODEX_TIMEOUT_MS = 45_000
const MAX_CODEX_TIMEOUT_MS = 120_000
const MAX_STDOUT_BYTES = 2 * 1024 * 1024
const MAX_STDERR_BYTES = 64 * 1024
const DEFAULT_MAX_CONCURRENT_GENERATIONS = 2
const DEFAULT_REASONING_EFFORT = "high"
const CODEX_AUTH_SECRET_RESOURCE_PATTERN = /^projects\/[a-z][a-z0-9-]{4,61}[a-z0-9]\/secrets\/[a-zA-Z][a-zA-Z0-9_-]{0,254}$/
const GCP_METADATA_TOKEN_URL = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
const REASONING_EFFORTS = ["minimal", "low", "medium", "high", "xhigh"] as const
const DISABLED_FEATURES = [
    "apps",
    "browser_use",
    "browser_use_external",
    "browser_use_full_cdp_access",
    "computer_use",
    "enable_mcp_apps",
    "hooks",
    "image_generation",
    "in_app_browser",
    "memories",
    "multi_agent",
    "multi_agent_v2",
    "plugins",
    "shell_tool",
    "skill_search",
    "tool_suggest",
    "unified_exec",
    "workspace_dependencies",
] as const

export type JsonSchema = Record<string, unknown>
export type ReasoningEffort = typeof REASONING_EFFORTS[number]

export interface CodexPersonalizationModel {
    provider: "codex"
    model: string
    reasoningEffort: ReasoningEffort
    routeId: string
}

export interface CodexPersonalizationRoute {
    model: string
    reasoningEffort?: "low" | "medium" | "high" | "xhigh"
    id: string
}

export interface CodexMcpServer {
    id: string
    url: string
    httpHeaders?: Readonly<Record<string, string>>
    startupTimeoutSeconds?: number
    toolTimeoutSeconds?: number
}

export type CodexPersonalizationErrorCode =
    | "auth"
    | "invalid_model"
    | "invalid_response"
    | "not_configured"
    | "rate_limited"
    | "timeout"
    | "unavailable"

const ERROR_DETAILS: Record<CodexPersonalizationErrorCode, {
    message: string
    status: number
    retryable: boolean
}> = {
    auth: { message: "Personalization provider authentication failed", status: 503, retryable: false },
    invalid_model: { message: "Personalization model is invalid", status: 500, retryable: false },
    invalid_response: { message: "Personalization provider returned invalid JSON", status: 502, retryable: true },
    not_configured: { message: "Personalization provider is not configured", status: 503, retryable: false },
    rate_limited: { message: "Personalization provider is busy. Try again shortly.", status: 429, retryable: true },
    timeout: { message: "Personalization provider timed out", status: 504, retryable: true },
    unavailable: { message: "Personalization provider is unavailable", status: 502, retryable: true },
}

export function isCodexErrorCode(value: unknown): value is CodexPersonalizationErrorCode {
    return typeof value === "string" && Object.hasOwn(ERROR_DETAILS, value)
}

export class CodexPersonalizationError extends Error {
    readonly code: CodexPersonalizationErrorCode
    readonly status: number
    readonly retryable: boolean

    constructor(code: CodexPersonalizationErrorCode) {
        const details = ERROR_DETAILS[code]
        super(details.message)
        this.name = "CodexPersonalizationError"
        this.code = code
        this.status = details.status
        this.retryable = details.retryable
    }
}

interface CodexJsonlUsage {
    input_tokens?: number
    cached_input_tokens?: number
    output_tokens?: number
    reasoning_output_tokens?: number
}

interface CodexJsonlEvent {
    type?: string
    item?: {
        type?: string
        text?: string
    }
    usage?: CodexJsonlUsage
}

interface PreparedCodexHome {
    home: string
    sourceId: string
    authContentsId: string
}

interface CodexAuthFile {
    tokens?: {
        access_token?: string
        refresh_token?: string
        id_token?: string
    }
}

let preparedCodexHome: PreparedCodexHome | undefined
let stableWorkspaceRoot: string | undefined
let exitCleanupRegistered = false
let activeGenerations = 0
const slotWaiters: Array<() => void> = []

function maxConcurrentGenerations(): number {
    const parsed = Number(process.env.CODEX_MAX_CONCURRENT_GENERATIONS || "")
    return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 16
        ? parsed
        : DEFAULT_MAX_CONCURRENT_GENERATIONS
}

function isReasoningEffort(value: string): value is ReasoningEffort {
    return REASONING_EFFORTS.includes(value as ReasoningEffort)
}

export function parseCodexPersonalizationModel(routeId: string): CodexPersonalizationModel | null {
    const match = /^codex\/([a-zA-Z0-9][a-zA-Z0-9._-]{0,79})(?::([a-z]+))?$/.exec(routeId.trim())
    if (!match) return null
    const reasoningEffort = match[2] ?? DEFAULT_REASONING_EFFORT
    if (!isReasoningEffort(reasoningEffort)) return null
    return {
        provider: "codex",
        model: match[1],
        reasoningEffort,
        routeId: `codex/${match[1]}:${reasoningEffort}`,
    }
}

function sourceFingerprint(value: string | Buffer) {
    return createHash("sha256").update(value).digest("hex")
}

function parseAuthContents(contents: Buffer) {
    let auth: CodexAuthFile
    try {
        auth = JSON.parse(contents.toString("utf8")) as CodexAuthFile
    } catch {
        throw new CodexPersonalizationError("not_configured")
    }
    const { access_token: accessToken, refresh_token: refreshToken, id_token: idToken } = auth.tokens ?? {}
    if (!accessToken || !refreshToken || !idToken) throw new CodexPersonalizationError("not_configured")
    return auth
}

function hasFreshAccessToken(contents: Buffer) {
    const accessToken = parseAuthContents(contents).tokens!.access_token!
    try {
        const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8")) as { exp?: number }
        return Boolean(payload.exp && payload.exp * 1000 > Date.now() + 10 * 60_000)
    } catch {
        return false
    }
}

async function readConfiguredAuth(): Promise<{ contents: Buffer; sourceId: string } | null> {
    const encoded = process.env.CODEX_AUTH_JSON_B64?.trim()
    if (encoded) {
        try {
            const contents = Buffer.from(encoded, "base64")
            parseAuthContents(contents)
            return { contents, sourceId: `env:${sourceFingerprint(encoded)}` }
        } catch (error) {
            if (error instanceof CodexPersonalizationError) throw error
            throw new CodexPersonalizationError("not_configured")
        }
    }

    return null
}

async function prepareCodexHome() {
    const configured = await readConfiguredAuth()
    if (!configured) throw new CodexPersonalizationError("not_configured")
    if (preparedCodexHome?.sourceId === configured.sourceId) return preparedCodexHome.home

    const previousHome = preparedCodexHome?.home
    const home = await mkdtemp(path.join(/* turbopackIgnore: true */ tmpdir(), "leetllm-codex-"))
    await chmod(/* turbopackIgnore: true */ home, 0o700)
    await writeFile(path.join(/* turbopackIgnore: true */ home, "auth.json"), configured.contents, { mode: 0o600, flag: "wx" })
    preparedCodexHome = {
        home,
        sourceId: configured.sourceId,
        authContentsId: sourceFingerprint(configured.contents),
    }
    if (!exitCleanupRegistered) {
        exitCleanupRegistered = true
        process.once("exit", () => {
            if (preparedCodexHome) {
                rmSync(/* turbopackIgnore: true */ preparedCodexHome.home, { recursive: true, force: true })
            }
            if (stableWorkspaceRoot) {
                rmSync(/* turbopackIgnore: true */ stableWorkspaceRoot, { recursive: true, force: true })
            }
        })
    }
    if (previousHome) await rm(/* turbopackIgnore: true */ previousHome, { recursive: true, force: true })
    return home
}

function codexAuthSecretResource() {
    const resource = process.env.CODEX_AUTH_SECRET_RESOURCE?.trim() ?? ""
    return CODEX_AUTH_SECRET_RESOURCE_PATTERN.test(resource) ? resource : null
}

async function gcpMetadataAccessToken() {
    const response = await fetch(GCP_METADATA_TOKEN_URL, {
        headers: { "Metadata-Flavor": "Google" },
        signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) throw new Error("Metadata token request failed")
    const body = await response.json() as { access_token?: unknown }
    if (typeof body.access_token !== "string" || !body.access_token) {
        throw new Error("Metadata token response was invalid")
    }
    return body.access_token
}

async function secretManagerRequest(pathSuffix: string, init?: RequestInit) {
    const resource = codexAuthSecretResource()
    if (!resource) throw new Error("Codex auth secret resource is not configured")
    const accessToken = await gcpMetadataAccessToken()
    return fetch(`https://secretmanager.googleapis.com/v1/${resource}${pathSuffix}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
        signal: AbortSignal.timeout(10_000),
    })
}

async function readLatestCodexAuthSecret() {
    const response = await secretManagerRequest("/versions/latest:access")
    if (!response.ok) throw new Error("Codex auth secret access failed")
    const body = await response.json() as { payload?: { data?: unknown } }
    if (typeof body.payload?.data !== "string" || !body.payload.data) {
        throw new Error("Codex auth secret payload was invalid")
    }
    const encodedAuth = Buffer.from(body.payload.data, "base64").toString("utf8")
    const contents = Buffer.from(encodedAuth, "base64")
    parseAuthContents(contents)
    return contents
}

async function reloadPreparedAuthFromSecret() {
    if (!preparedCodexHome || !codexAuthSecretResource()) return false
    try {
        const contents = await readLatestCodexAuthSecret()
        if (!hasFreshAccessToken(contents)) return false
        const contentsId = sourceFingerprint(contents)
        if (contentsId === preparedCodexHome.authContentsId) return false
        await writeFile(path.join(preparedCodexHome.home, "auth.json"), contents, { mode: 0o600 })
        preparedCodexHome.authContentsId = contentsId
        return true
    } catch {
        console.error("Failed to reload refreshed Codex credentials")
        return false
    }
}

async function persistPreparedAuthToSecret() {
    if (!preparedCodexHome || !codexAuthSecretResource()) return
    try {
        const contents = await readFile(path.join(preparedCodexHome.home, "auth.json"))
        const contentsId = sourceFingerprint(contents)
        if (contentsId === preparedCodexHome.authContentsId || !hasFreshAccessToken(contents)) return
        const encodedAuth = contents.toString("base64")
        const response = await secretManagerRequest(":addVersion", {
            method: "POST",
            body: JSON.stringify({
                payload: { data: Buffer.from(encodedAuth).toString("base64") },
            }),
        })
        if (!response.ok) throw new Error("Codex auth secret update failed")
        preparedCodexHome.authContentsId = contentsId
    } catch {
        console.error("Failed to persist refreshed Codex credentials")
    }
}

export async function isLocalCodexConfigured() {
    try {
        return (await readConfiguredAuth()) !== null
    } catch {
        return false
    }
}

export async function disposeCodexPersonalizationRuntime() {
    if (activeGenerations !== 0) throw new Error("Cannot dispose Codex runtime during generation")
    const home = preparedCodexHome?.home
    const workspaceRoot = stableWorkspaceRoot
    preparedCodexHome = undefined
    stableWorkspaceRoot = undefined
    if (home) await rm(home, { recursive: true, force: true })
    if (workspaceRoot) await rm(workspaceRoot, { recursive: true, force: true })
}

async function prepareStableWorkspace(id: string) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(id)) {
        throw new CodexPersonalizationError("unavailable")
    }
    const root = process.env.NODE_ENV === "test"
        ? path.join(tmpdir(), `leetllm-codex-workspaces-test-${process.pid}`)
        : path.join(tmpdir(), "leetllm-codex-workspaces")
    await mkdir(/* turbopackIgnore: true */ root, { recursive: true, mode: 0o700 })
    await chmod(/* turbopackIgnore: true */ root, 0o700)
    const workspace = path.join(root, id)
    await mkdir(/* turbopackIgnore: true */ workspace, { recursive: true, mode: 0o700 })
    await chmod(/* turbopackIgnore: true */ workspace, 0o700)
    stableWorkspaceRoot = root
    return workspace
}

function acquireGenerationSlot(deadlineAt: number) {
    if (activeGenerations < maxConcurrentGenerations()) {
        activeGenerations++
        return Promise.resolve(releaseGenerationSlot)
    }

    return new Promise<() => void>((resolve, reject) => {
        const remaining = deadlineAt - Date.now()
        if (remaining <= 0) {
            reject(new CodexPersonalizationError("timeout"))
            return
        }
        let settled = false
        const waiter = () => {
            if (settled) return
            settled = true
            clearTimeout(timeout)
            activeGenerations++
            resolve(releaseGenerationSlot)
        }
        const timeout = setTimeout(() => {
            if (settled) return
            settled = true
            const index = slotWaiters.indexOf(waiter)
            if (index >= 0) slotWaiters.splice(index, 1)
            reject(new CodexPersonalizationError("timeout"))
        }, remaining)
        slotWaiters.push(waiter)
    })
}

function releaseGenerationSlot() {
    activeGenerations = Math.max(0, activeGenerations - 1)
    const next = slotWaiters.shift()
    next?.()
}

function minimalChildEnvironment(codexHome: string): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
        CODEX_HOME: codexHome,
        HOME: codexHome,
        LANG: process.env.LANG || "C.UTF-8",
        LC_ALL: process.env.LC_ALL || process.env.LANG || "C.UTF-8",
        NO_COLOR: "1",
        NODE_ENV: "production",
        PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
        TMPDIR: tmpdir(),
    }
    for (const key of ["NODE_EXTRA_CA_CERTS", "SSL_CERT_DIR", "SSL_CERT_FILE"] as const) {
        if (process.env[key]) env[key] = process.env[key]
    }
    return env
}

function codexMcpArguments(servers: readonly CodexMcpServer[]) {
    const args = ["--config", "mcp_servers={}"]
    for (const server of servers) {
        if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(server.id)) {
            throw new CodexPersonalizationError("unavailable")
        }
        let url: URL
        try {
            url = new URL(server.url)
        } catch {
            throw new CodexPersonalizationError("unavailable")
        }
        if (url.protocol !== "https:") throw new CodexPersonalizationError("unavailable")

        args.push("--config", `mcp_servers.${server.id}.url=${JSON.stringify(url.toString())}`)
        if (server.httpHeaders && Object.keys(server.httpHeaders).length > 0) {
            const headers = Object.entries(server.httpHeaders)
                .map(([name, value]) => `${JSON.stringify(name)} = ${JSON.stringify(value)}`)
                .join(", ")
            args.push("--config", `mcp_servers.${server.id}.http_headers={${headers}}`)
        }
        if (server.startupTimeoutSeconds) {
            args.push("--config", `mcp_servers.${server.id}.startup_timeout_sec=${server.startupTimeoutSeconds}`)
        }
        if (server.toolTimeoutSeconds) {
            args.push("--config", `mcp_servers.${server.id}.tool_timeout_sec=${server.toolTimeoutSeconds}`)
        }
    }
    return args
}

function codexArguments(
    model: CodexPersonalizationModel,
    schemaPath: string,
    cwd: string,
    mcpServers: readonly CodexMcpServer[],
) {
    const args = [
        "exec",
        "--ephemeral",
        "--ignore-user-config",
        "--ignore-rules",
        "--skip-git-repo-check",
        "--json",
        "--color",
        "never",
        "--cd",
        cwd,
        "--model",
        model.model,
        "--config",
        `model_reasoning_effort=${JSON.stringify(model.reasoningEffort)}`,
        "--output-schema",
        schemaPath,
    ]
    if (mcpServers.length > 0) args.push("--approve-for-me")
    else args.push("--sandbox", "read-only")
    args.push(...codexMcpArguments(mcpServers))
    for (const feature of DISABLED_FEATURES) args.push("--disable", feature)
    args.push("-")
    return args
}

function classifyCodexFailure(output: string) {
    const normalized = output.toLowerCase()
    if (/429|rate.?limit|quota|usage limit/.test(normalized)) return new CodexPersonalizationError("rate_limited")
    if (/401|403|auth|credential|log.?in|unauthorized|forbidden/.test(normalized)) {
        return new CodexPersonalizationError("auth")
    }
    if (/model.*(invalid|not found|unsupported)|invalid.*model/.test(normalized)) {
        return new CodexPersonalizationError("invalid_model")
    }
    return new CodexPersonalizationError("unavailable")
}

function appendBounded(current: string, chunk: Buffer | string, limit: number) {
    if (Buffer.byteLength(current) >= limit) return current
    const remaining = limit - Buffer.byteLength(current)
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    return current + bytes.subarray(0, remaining).toString("utf8")
}

function tokenCount(value: number | undefined) {
    return Number.isFinite(value) && value! > 0 ? Math.floor(value!) : 0
}

function parseCodexOutput<T>(stdout: string) {
    let finalMessage: string | undefined
    let finalUsage: CodexJsonlUsage | undefined
    for (const line of stdout.split("\n")) {
        if (!line.trim()) continue
        let event: CodexJsonlEvent
        try {
            event = JSON.parse(line) as CodexJsonlEvent
        } catch {
            throw new CodexPersonalizationError("invalid_response")
        }
        if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
            finalMessage = event.item.text
        }
        if (event.type === "turn.completed" && event.usage) finalUsage = event.usage
    }
    if (!finalMessage) throw new CodexPersonalizationError("invalid_response")

    let value: T
    try {
        value = JSON.parse(finalMessage) as T
    } catch {
        throw new CodexPersonalizationError("invalid_response")
    }
    const inputTokens = tokenCount(finalUsage?.input_tokens)
    const cachedInputTokens = Math.min(inputTokens, tokenCount(finalUsage?.cached_input_tokens))
    const outputTokens = tokenCount(finalUsage?.output_tokens)
    const reasoningTokens = Math.min(outputTokens, tokenCount(finalUsage?.reasoning_output_tokens))
    const usage: CodexTokenUsage | undefined = finalUsage ? {
        promptTokenCount: inputTokens,
        cachedContentTokenCount: cachedInputTokens,
        candidatesTokenCount: outputTokens - reasoningTokens,
        thoughtsTokenCount: reasoningTokens,
        totalTokenCount: inputTokens + outputTokens,
    } : undefined
    return { value, usage }
}

async function runCodex({
    model,
    prompt,
    schema,
    deadlineAt,
    timeoutMs,
    mcpServers,
    stableWorkspaceId,
}: {
    model: CodexPersonalizationModel
    prompt: string
    schema: JsonSchema
    deadlineAt: number
    timeoutMs: number
    mcpServers: readonly CodexMcpServer[]
    stableWorkspaceId?: string
}) {
    const codexHome = await prepareCodexHome()
    const requestDirectory = await mkdtemp(path.join(/* turbopackIgnore: true */ tmpdir(), "leetllm-codex-request-"))
    await chmod(/* turbopackIgnore: true */ requestDirectory, 0o700)
    const schemaPath = path.join(/* turbopackIgnore: true */ requestDirectory, "output-schema.json")
    await writeFile(/* turbopackIgnore: true */ schemaPath, JSON.stringify(schema), { mode: 0o600, flag: "wx" })
    const remaining = Math.min(timeoutMs, deadlineAt - Date.now())
    if (remaining <= 0) {
        await rm(/* turbopackIgnore: true */ requestDirectory, { recursive: true, force: true })
        throw new CodexPersonalizationError("timeout")
    }
    try {
        const workspace = stableWorkspaceId
            ? await prepareStableWorkspace(stableWorkspaceId)
            : requestDirectory
        return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
            const child = spawn("codex", codexArguments(model, schemaPath, workspace, mcpServers), {
                cwd: workspace,
                env: minimalChildEnvironment(codexHome),
                stdio: ["pipe", "pipe", "pipe"],
            })
            let stdout = ""
            let stderr = ""
            let stdoutExceeded = false
            let timedOut = false
            let settled = false
            const timeout = setTimeout(() => {
                timedOut = true
                child.kill("SIGKILL")
            }, remaining)

            child.stdout.on("data", (chunk: Buffer) => {
                if (Buffer.byteLength(stdout) + chunk.byteLength > MAX_STDOUT_BYTES) {
                    stdoutExceeded = true
                    child.kill("SIGKILL")
                    return
                }
                stdout += chunk.toString("utf8")
            })
            child.stderr.on("data", (chunk: Buffer) => {
                stderr = appendBounded(stderr, chunk, MAX_STDERR_BYTES)
            })
            child.once("error", (error: NodeJS.ErrnoException) => {
                if (settled) return
                settled = true
                clearTimeout(timeout)
                reject(new CodexPersonalizationError(error.code === "ENOENT" ? "not_configured" : "unavailable"))
            })
            child.once("close", (code) => {
                if (settled) return
                settled = true
                clearTimeout(timeout)
                if (timedOut) reject(new CodexPersonalizationError("timeout"))
                else if (stdoutExceeded) reject(new CodexPersonalizationError("invalid_response"))
                else if (code !== 0) reject(classifyCodexFailure(`${stderr}\n${stdout}`))
                else resolve({ stdout, stderr })
            })
            child.stdin.on("error", () => undefined)
            child.stdin.end(prompt)
        })
    } finally {
        await persistPreparedAuthToSecret()
        await rm(/* turbopackIgnore: true */ requestDirectory, { recursive: true, force: true })
    }
}

export interface GenerateCodexParams {
    route?: CodexPersonalizationRoute
    model?: string | CodexPersonalizationModel
    systemInstruction: string
    prompt: string
    schema: JsonSchema
    maxOutputTokens?: number
    deadlineAt?: number
    timeoutMs?: number
    mcpServers?: readonly CodexMcpServer[]
    stableWorkspaceId?: string
    onUsage?: (usage: CodexTokenUsage | undefined) => void
}

export function resolveCodexRequestModel(
    route?: CodexPersonalizationRoute,
    modelId?: string | CodexPersonalizationModel,
): CodexPersonalizationModel {
    const routeModel = route && parseCodexPersonalizationModel(
        `codex/${route.model}:${route.reasoningEffort ?? DEFAULT_REASONING_EFFORT}`,
    )
    const model = routeModel ?? (typeof modelId === "string" ? parseCodexPersonalizationModel(modelId) : modelId)
    if (!model) throw new CodexPersonalizationError("invalid_model")
    return model
}

export function boundCodexTimeoutMs(timeoutMs?: number): number {
    return Number.isFinite(timeoutMs)
        ? Math.min(MAX_CODEX_TIMEOUT_MS, Math.max(1_000, Math.floor(timeoutMs!)))
        : CODEX_TIMEOUT_MS
}

export async function generateLocalCodexStructuredJson<T>({
    route,
    model: modelId,
    systemInstruction,
    prompt,
    schema,
    maxOutputTokens,
    deadlineAt,
    timeoutMs = CODEX_TIMEOUT_MS,
    mcpServers = [],
    stableWorkspaceId,
    onUsage,
}: GenerateCodexParams): Promise<{
    value: T
    usage: CodexTokenUsage | undefined
    providerModelId: string
}> {
    const model = resolveCodexRequestModel(route, modelId)
    const boundedTimeoutMs = boundCodexTimeoutMs(timeoutMs)
    const effectiveDeadlineAt = deadlineAt ?? Date.now() + boundedTimeoutMs
    const release = await acquireGenerationSlot(effectiveDeadlineAt)
    try {
        const outputLimit = Number.isFinite(maxOutputTokens) && maxOutputTokens! > 0
            ? `\n\nReturn at most ${Math.floor(maxOutputTokens!)} output tokens.`
            : ""
        const combinedPrompt = `${systemInstruction.trim()}${outputLimit}\n\nUSER INPUT\n${prompt}`
        const request = {
            model,
            prompt: combinedPrompt,
            schema,
            deadlineAt: effectiveDeadlineAt,
            timeoutMs: boundedTimeoutMs,
            mcpServers,
            stableWorkspaceId,
        }
        let result: { stdout: string; stderr: string }
        try {
            result = await runCodex(request)
        } catch (error) {
            const shouldRetry = error instanceof CodexPersonalizationError
                && error.code === "auth"
                && await reloadPreparedAuthFromSecret()
            if (!shouldRetry) throw error
            result = await runCodex(request)
        }
        const parsed = parseCodexOutput<T>(result.stdout)
        onUsage?.(parsed.usage)
        return { ...parsed, providerModelId: route?.id ?? model.routeId }
    } finally {
        release()
    }
}
