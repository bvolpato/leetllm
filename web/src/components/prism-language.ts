const SUPPORTED_PRISM_LANGUAGES = new Set([
    "bash",
    "cpp",
    "css",
    "diff",
    "django",
    "docker",
    "http",
    "ignore",
    "javascript",
    "json",
    "markdown",
    "markup",
    "protobuf",
    "promql",
    "python",
    "sql",
    "toml",
    "tsx",
    "typescript",
    "yaml",
])

const PRISM_LANGUAGE_ALIASES: Record<string, string> = {
    jsonl: "json",
    ndjson: "json",
    jsonc: "json",
    py: "python",
    ts: "typescript",
    js: "javascript",
    sh: "bash",
    shell: "bash",
    dockerfile: "docker",
    gitignore: "ignore",
    html: "markup",
}

export function resolvePrismLanguage(language: string) {
    const normalized = language.toLowerCase()
    const canonical = PRISM_LANGUAGE_ALIASES[normalized] ?? normalized
    return SUPPORTED_PRISM_LANGUAGES.has(canonical) ? canonical : null
}

export function isSupportedPrismLanguage(language: string) {
    return resolvePrismLanguage(language) !== null
}
