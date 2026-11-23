import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
    CodexPersonalizationError,
    disposeCodexPersonalizationRuntime,
    generateCodexStructuredJson,
    isCodexPersonalizationConfigured,
    parseCodexPersonalizationModel,
} from "./codex-personalization"

let testDirectory: string

function isolatedTestAuth(expiresInSeconds = 3_600) {
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })).toString("base64url")
    return {
        tokens: {
            access_token: `header.${payload}.signature`,
            refresh_token: "isolated-refresh",
            id_token: "isolated-id",
        },
    }
}

async function createExecutable(source: string) {
    const executable = path.join(testDirectory, "codex")
    await writeFile(executable, `#!/usr/bin/env node\n${source}`, { mode: 0o700 })
    await chmod(executable, 0o700)
    return executable
}

beforeEach(async () => {
    testDirectory = await mkdtemp(path.join(tmpdir(), "leetllm-codex-test-"))
    vi.stubEnv("NODE_ENV", "test")
    vi.stubEnv("CODEX_AUTH_JSON_B64", Buffer.from(JSON.stringify(isolatedTestAuth())).toString("base64"))
})

afterEach(async () => {
    await disposeCodexPersonalizationRuntime()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    await rm(testDirectory, { recursive: true, force: true })
})

describe("parseCodexPersonalizationModel", () => {
    test("parses provider model and explicit reasoning effort", () => {
        expect(parseCodexPersonalizationModel("codex/gpt-6-luna:high")).toEqual({
            provider: "codex",
            model: "gpt-6-luna",
            reasoningEffort: "high",
            routeId: "codex/gpt-6-luna:high",
        })
    })

    test.each([
        "google/gemini-3.5-flash-lite",
        "codex/gpt-6-luna:ultra",
        "codex/../../auth.json:high",
        "codex/:high",
    ])("rejects unsupported route %s", (route) => {
        expect(parseCodexPersonalizationModel(route)).toBeNull()
    })
})

test("runs isolated structured generation and maps token usage", async () => {
    await createExecutable(`
import fs from "node:fs";
let prompt = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => { prompt += chunk });
process.stdin.on("end", () => {
  const schemaIndex = process.argv.indexOf("--output-schema");
  const authPath = process.env.CODEX_HOME + "/auth.json";
  const observation = {
    args: process.argv.slice(2),
    authMode: fs.statSync(authPath).mode & 0o777,
    cwd: process.cwd(),
    cwdMode: fs.statSync(process.cwd()).mode & 0o777,
    envKeys: Object.keys(process.env).sort(),
    homeMatches: process.env.HOME === process.env.CODEX_HOME,
    prompt,
    schema: JSON.parse(fs.readFileSync(process.argv[schemaIndex + 1], "utf8")),
  };
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ observation }) } }));
  console.log(JSON.stringify({ type: "turn.completed", usage: { input_tokens: 120, cached_input_tokens: 80, output_tokens: 30, reasoning_output_tokens: 12 } }));
});
`)
    vi.stubEnv("PATH", `${testDirectory}:${process.env.PATH}`)
    vi.stubEnv("CODEX_HOME", "/home/user/.codex")
    vi.stubEnv("GEMINI_API_KEY", "must-not-reach-child")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "must-not-reach-child")

    const schema = {
        type: "object",
        additionalProperties: false,
        properties: { answer: { type: "string" } },
        required: ["answer"],
    }
    const result = await generateCodexStructuredJson<{
        observation: {
            args: string[]
            authMode: number
            cwd: string
            cwdMode: number
            envKeys: string[]
            homeMatches: boolean
            prompt: string
            schema: Record<string, unknown>
        }
    }>({
        model: "codex/gpt-6-luna:high",
        systemInstruction: "Return teaching JSON.",
        prompt: "Explain pass@k.",
        schema,
        maxOutputTokens: 500,
    })

    expect(result.providerModelId).toBe("codex/gpt-6-luna:high")
    expect(result.usage).toEqual({
        promptTokenCount: 120,
        cachedContentTokenCount: 80,
        candidatesTokenCount: 18,
        thoughtsTokenCount: 12,
        totalTokenCount: 150,
    })
    const observation = result.value.observation
    expect(observation.authMode).toBe(0o600)
    expect(observation.cwdMode).toBe(0o700)
    expect(observation.homeMatches).toBe(true)
    expect(observation.envKeys).not.toContain("GEMINI_API_KEY")
    expect(observation.envKeys).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(observation.args).not.toContain("Explain pass@k.")
    expect(observation.args).toEqual(expect.arrayContaining([
        "--ephemeral",
        "--ignore-user-config",
        "--ignore-rules",
        "--skip-git-repo-check",
        "--output-schema",
        "--sandbox",
        "read-only",
    ]))
    expect(observation.args.at(-1)).toBe("-")
    expect(observation.args).toContain("mcp_servers={}")
    expect(observation.prompt).toContain("Return teaching JSON.")
    expect(observation.prompt).toContain("Explain pass@k.")
    expect(observation.schema).toEqual(schema)
    await expect(readFile(observation.cwd)).rejects.toMatchObject({ code: "ENOENT" })
})

test("configures only requested remote MCP servers", async () => {
    await createExecutable(`
process.stdin.resume();
process.stdin.on("end", () => {
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ args: process.argv.slice(2) }) } }));
});
`)
    vi.stubEnv("PATH", `${testDirectory}:${process.env.PATH}`)

    const result = await generateCodexStructuredJson<{ args: string[] }>({
        model: "codex/gpt-6-luna:high",
        systemInstruction: "Return JSON.",
        prompt: "Input",
        schema: { type: "object" },
        mcpServers: [{
            id: "crawlerpy",
            url: "https://crawlerpy.brunovolpato.com/mcp",
            httpHeaders: {
                "X-Crawlerpy-Client": "leetllm",
                "User-Agent": "leetllm/1.0 (leety; codex-mcp-client)",
            },
            startupTimeoutSeconds: 15,
            toolTimeoutSeconds: 45,
        }],
    })

    expect(result.value.args).toEqual(expect.arrayContaining([
        "--approve-for-me",
        "mcp_servers={}",
        "mcp_servers.crawlerpy.url=\"https://crawlerpy.brunovolpato.com/mcp\"",
        'mcp_servers.crawlerpy.http_headers={"X-Crawlerpy-Client" = "leetllm", "User-Agent" = "leetllm/1.0 (leety; codex-mcp-client)"}',
        "mcp_servers.crawlerpy.startup_timeout_sec=15",
        "mcp_servers.crawlerpy.tool_timeout_sec=45",
    ]))
    expect(result.value.args).not.toContain("read-only")
    expect(result.value.args.join(" ")).not.toContain("openaiDeveloperDocs")
    expect(result.value.args.join(" ")).not.toContain("datadog")
})

test("reuses a deterministic empty workspace for cache-stable requests", async () => {
    await createExecutable(`
process.stdin.resume();
process.stdin.on("end", () => {
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ cwd: process.cwd() }) } }));
});
`)
    vi.stubEnv("PATH", `${testDirectory}:${process.env.PATH}`)
    const generate = () => generateCodexStructuredJson<{ cwd: string }>({
        model: "codex/gpt-6-luna:high",
        systemInstruction: "Stable system prompt.",
        prompt: "Stable page prefix. Variable question.",
        schema: { type: "object" },
        stableWorkspaceId: "leety",
    })

    const first = await generate()
    const second = await generate()

    expect(first.value.cwd).toBe(second.value.cwd)
    expect(first.value.cwd).toMatch(/leetllm-codex-workspaces-test-\d+\/leety$/)
})

test("does not fall back to ambient Codex home", async () => {
    vi.stubEnv("CODEX_AUTH_JSON_B64", "")
    vi.stubEnv("CODEX_HOME", path.join(testDirectory, "ambient-codex-home"))

    expect(await isCodexPersonalizationConfigured()).toBe(false)
    await expect(generateCodexStructuredJson({
        model: "codex/gpt-6-luna:high",
        systemInstruction: "Return JSON.",
        prompt: "Input",
        schema: { type: "object" },
    })).rejects.toMatchObject({ code: "not_configured", status: 503 })
})

test("lets Codex CLI refresh an expired isolated access token", async () => {
    await createExecutable(`
process.stdin.resume();
process.stdin.on("end", () => {
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ refreshed: true }) } }));
});
`)
    vi.stubEnv("PATH", `${testDirectory}:${process.env.PATH}`)
    vi.stubEnv("CODEX_AUTH_JSON_B64", Buffer.from(JSON.stringify(isolatedTestAuth(-3_600))).toString("base64"))

    const result = await generateCodexStructuredJson<{ refreshed: boolean }>({
        model: "codex/gpt-6-luna:high",
        systemInstruction: "Return JSON.",
        prompt: "Input",
        schema: { type: "object" },
    })

    expect(result.value.refreshed).toBe(true)
})

test("persists Codex CLI token rotation to configured Secret Manager secret", async () => {
    await createExecutable(`
import fs from "node:fs";
process.stdin.resume();
process.stdin.on("end", () => {
  const authPath = process.env.CODEX_HOME + "/auth.json";
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200 })).toString("base64url");
  fs.writeFileSync(authPath, JSON.stringify({ tokens: { access_token: "header." + payload + ".signature", refresh_token: "rotated-refresh", id_token: "rotated-id" } }), { mode: 0o600 });
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ persisted: true }) } }));
});
`)
    vi.stubEnv("PATH", `${testDirectory}:${process.env.PATH}`)
    vi.stubEnv("CODEX_AUTH_SECRET_RESOURCE", "projects/test-project/secrets/test-secret")
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "metadata-token" }), { status: 200 }))
        .mockResolvedValueOnce(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await generateCodexStructuredJson<{ persisted: boolean }>({
        model: "codex/gpt-6-luna:high",
        systemInstruction: "Return JSON.",
        prompt: "Input",
        schema: { type: "object" },
    })

    expect(result.value.persisted).toBe(true)
    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", expect.objectContaining({
        headers: { "Metadata-Flavor": "Google" },
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "https://secretmanager.googleapis.com/v1/projects/test-project/secrets/test-secret:addVersion",
        expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({ Authorization: "Bearer metadata-token" }),
        }),
    )
    const request = fetchMock.mock.calls[1][1] as RequestInit
    expect(JSON.parse(String(request.body))).toMatchObject({ payload: { data: expect.any(String) } })
})

test("reloads latest rotated credentials and retries one authentication failure", async () => {
    await createExecutable(`
import fs from "node:fs";
process.stdin.resume();
process.stdin.on("end", () => {
  const auth = JSON.parse(fs.readFileSync(process.env.CODEX_HOME + "/auth.json", "utf8"));
  if (auth.tokens.refresh_token === "isolated-refresh") {
    process.stderr.write("401 authentication failed");
    process.exit(1);
    return;
  }
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ retried: true }) } }));
});
`)
    vi.stubEnv("PATH", `${testDirectory}:${process.env.PATH}`)
    vi.stubEnv("CODEX_AUTH_SECRET_RESOURCE", "projects/test-project/secrets/test-secret")
    const freshAuth = isolatedTestAuth(7_200)
    freshAuth.tokens.refresh_token = "latest-refresh"
    const encodedAuth = Buffer.from(JSON.stringify(freshAuth)).toString("base64")
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "metadata-token" }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
            payload: { data: Buffer.from(encodedAuth).toString("base64") },
        }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await generateCodexStructuredJson<{ retried: boolean }>({
        model: "codex/gpt-6-luna:high",
        systemInstruction: "Return JSON.",
        prompt: "Input",
        schema: { type: "object" },
    })

    expect(result.value.retried).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenLastCalledWith(
        "https://secretmanager.googleapis.com/v1/projects/test-project/secrets/test-secret/versions/latest:access",
        expect.objectContaining({
            headers: expect.objectContaining({ Authorization: "Bearer metadata-token" }),
        }),
    )
})

test("classifies provider failure without exposing stderr", async () => {
    await createExecutable(`
process.stdin.resume();
process.stdin.on("end", () => {
  process.stderr.write("401 token=do-not-leak authentication failed\\n");
  process.exit(1);
});
`)
    vi.stubEnv("PATH", `${testDirectory}:${process.env.PATH}`)

    let failure: unknown
    try {
        await generateCodexStructuredJson({
            model: "codex/gpt-6-luna:high",
            systemInstruction: "Return JSON.",
            prompt: "Input",
            schema: { type: "object" },
        })
    } catch (error) {
        failure = error
    }

    expect(failure).toBeInstanceOf(CodexPersonalizationError)
    expect(failure).toMatchObject({ code: "auth", status: 503, retryable: false })
    expect(String(failure)).not.toContain("do-not-leak")
})

test("classifies usage limit in stdout as rate_limited", async () => {
    await createExecutable(`
process.stdin.resume();
process.stdin.on("end", () => {
  console.log(JSON.stringify({ type: "error", message: "You've hit your usage limit. Try again later." }));
  process.exit(1);
});
`)
    vi.stubEnv("PATH", `${testDirectory}:${process.env.PATH}`)

    let failure: unknown
    try {
        await generateCodexStructuredJson({
            model: "codex/gpt-6-luna:high",
            systemInstruction: "Return JSON.",
            prompt: "Input",
            schema: { type: "object" },
        })
    } catch (error) {
        failure = error
    }

    expect(failure).toBeInstanceOf(CodexPersonalizationError)
    expect(failure).toMatchObject({ code: "rate_limited", status: 429, retryable: true })
})
