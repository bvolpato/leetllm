const TOKEN_PATTERN = /\[\[LEETLLM_PRESERVE_\d{5}\]\]/g
export const MAX_PERSONALIZED_MARKDOWN_CHARS = 300_000

export interface ProtectedMarkdown {
    markdown: string
    expectedTokens: string[]
    blocks: Map<string, string>
    blockTokens: Set<string>
    proseWordCount: number
}

export class PersonalizedMarkdownValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "PersonalizedMarkdownValidationError"
    }
}

function countWords(value: string) {
    return value.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu)?.length ?? 0
}

function protectMatches(
    markdown: string,
    pattern: RegExp,
    blocks: Map<string, string>,
    blockTokens: Set<string>,
    block: boolean,
) {
    return markdown.replace(pattern, (match) => {
        const token = `[[LEETLLM_PRESERVE_${String(blocks.size).padStart(5, "0")}]]`
        blocks.set(token, match)
        if (block) blockTokens.add(token)
        return token
    })
}

/**
 * Removes structures the model must never rewrite. Canonical HTML is trusted;
 * model-authored HTML is rejected before these blocks are restored.
 */
export function protectPersonalizationMarkdown(source: string): ProtectedMarkdown {
    const blocks = new Map<string, string>()
    const blockTokens = new Set<string>()
    let markdown = source

    // Order matters: protect containers before their nested tags.
    const patterns: Array<{ pattern: RegExp; block: boolean }> = [
        { pattern: /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1\s*$/gm, block: true },
        { pattern: /<figure\b[^>]*>[\s\S]*?<\/figure>/gi, block: true },
        { pattern: /<details\b[^>]*>[\s\S]*?<\/details>/gi, block: true },
        { pattern: /<div\b[^>]*>[\s\S]*?<\/div>/gi, block: true },
        { pattern: /<sup\b[^>]*>[\s\S]*?<\/sup>/gi, block: false },
        { pattern: /<span\b[^>]*>[\s\S]*?<\/span>/gi, block: false },
        { pattern: /<p\b[^>]*>[\s\S]*?<\/p>/gi, block: true },
        { pattern: /<code\b[^>]*>[\s\S]*?<\/code>/gi, block: false },
        { pattern: /<(s|i|kbd|sub|em|strong)\b[^>]*>[\s\S]*?<\/\1>/gi, block: false },
        { pattern: /<!--[\s\S]*?-->/g, block: false },
        { pattern: /^\|[^\n]*\|\s*\n\|\s*:?-{3,}[^\n]*\|(?:\s*\n\|[^\n]*\|)*/gm, block: true },
        { pattern: /\$\$[\s\S]*?\$\$/g, block: true },
        { pattern: /\\\[[\s\S]*?\\\]/g, block: true },
        { pattern: /\\\([\s\S]*?\\\)/g, block: false },
        { pattern: /(?<!\\)\$(?!\s)(?:\\.|[^$\n])+?(?<!\s)(?<!\\)\$/g, block: false },
        { pattern: /!\[[^\]]*\]\([^)\n]+\)/g, block: false },
        { pattern: /\[[^\]\n]+\]\([^)\n]+\)/g, block: false },
        { pattern: /!?\[[^\]\n]*\]\[[^\]\n]+\]/g, block: false },
        { pattern: /^\[[^\]\n]+\]:\s*\S+.*$/gm, block: true },
        { pattern: /^#{1,6}\s+.+$/gm, block: true },
        { pattern: /<\/?[A-Za-z][^>\n]*>/g, block: false },
        { pattern: /\b(?:https?:\/\/|www\.)[^\s<>()]+/gi, block: false },
        { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, block: false },
    ]

    for (const item of patterns) {
        markdown = protectMatches(markdown, item.pattern, blocks, blockTokens, item.block)
    }

    return {
        markdown,
        expectedTokens: markdown.match(TOKEN_PATTERN) ?? [],
        blocks,
        blockTokens,
        proseWordCount: countWords(markdown.replace(TOKEN_PATTERN, " ")),
    }
}

function validateTokenIntegrity(output: string, protectedSource: ProtectedMarkdown) {
    const actualTokens = output.match(TOKEN_PATTERN) ?? []
    if (actualTokens.length !== protectedSource.expectedTokens.length) {
        throw new PersonalizedMarkdownValidationError("Protected block count changed")
    }

    for (let index = 0; index < actualTokens.length; index++) {
        if (actualTokens[index] !== protectedSource.expectedTokens[index]) {
            throw new PersonalizedMarkdownValidationError("Protected block order changed")
        }
    }

    for (const token of protectedSource.blockTokens) {
        const offset = output.indexOf(token)
        const before = offset <= 0 ? "\n" : output[offset - 1]
        const afterOffset = offset + token.length
        const after = afterOffset >= output.length ? "\n" : output[afterOffset]
        if (before !== "\n" || after !== "\n") {
            throw new PersonalizedMarkdownValidationError("Protected block must stay on its own line")
        }
    }

    const unknownToken = output.match(/\[\[LEETLLM_PRESERVE_[^\]]+\]\]/g)
        ?.find((token) => !protectedSource.blocks.has(token))
    if (unknownToken) {
        throw new PersonalizedMarkdownValidationError("Unknown protected block added")
    }
}

export function validateAndRestorePersonalizedMarkdown(
    output: string,
    protectedSource: ProtectedMarkdown,
) {
    const trimmed = output.trim()
    if (!trimmed) {
        throw new PersonalizedMarkdownValidationError("Model returned empty Markdown")
    }
    if (trimmed.length > MAX_PERSONALIZED_MARKDOWN_CHARS) {
        throw new PersonalizedMarkdownValidationError("Personalized Markdown is too large")
    }

    validateTokenIntegrity(trimmed, protectedSource)

    const modelAuthored = trimmed.replace(TOKEN_PATTERN, " ")
    if (/<\/?[A-Za-z!][^>]*>/.test(modelAuthored)) {
        throw new PersonalizedMarkdownValidationError("Model-authored HTML is not allowed")
    }
    if (/\b(?:javascript|vbscript):|\bdata:[^\s,]*,/i.test(modelAuthored)) {
        throw new PersonalizedMarkdownValidationError("Unsafe URL protocol added")
    }
    if (/!?\[[^\]]*\]\([^)\n]+\)/.test(modelAuthored)) {
        throw new PersonalizedMarkdownValidationError("Model-authored links or images are not allowed")
    }
    if (/!?\[[^\]\n]*\]\[[^\]\n]+\]|^\[[^\]\n]+\]:\s*\S+/m.test(modelAuthored)) {
        throw new PersonalizedMarkdownValidationError("Model-authored reference links are not allowed")
    }
    if (/\b(?:https?:\/\/|www\.)\S+|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(modelAuthored)) {
        throw new PersonalizedMarkdownValidationError("Model-authored autolinks are not allowed")
    }

    const outputWords = countWords(modelAuthored)
    if (protectedSource.proseWordCount >= 100) {
        const ratio = outputWords / protectedSource.proseWordCount
        if (ratio < 0.65 || ratio > 1.25) {
            throw new PersonalizedMarkdownValidationError("Personalized prose changed length too much")
        }
    }

    let restored = trimmed
    for (const [token, block] of [...protectedSource.blocks].reverse()) {
        restored = restored.replace(token, () => block)
    }

    if (TOKEN_PATTERN.test(restored)) {
        TOKEN_PATTERN.lastIndex = 0
        throw new PersonalizedMarkdownValidationError("Protected block restoration failed")
    }
    TOKEN_PATTERN.lastIndex = 0

    return restored
}
