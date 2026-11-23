const LATEX_SYMBOLS: Record<string, string> = {
    alpha: "α",
    beta: "β",
    Delta: "Δ",
    delta: "δ",
    eta: "η",
    gamma: "γ",
    in: "∈",
    infty: "∞",
    lambda: "λ",
    le: "≤",
    leq: "≤",
    mu: "μ",
    nabla: "∇",
    partial: "∂",
    rho: "ρ",
    sigma: "σ",
    tau: "τ",
    theta: "θ",
    Theta: "Θ",
    times: "×",
}

function latexToPlainText(value: string): string {
    return value
        .replace(/\\(?:mathrm|mathbf|mathbb|mathcal|operatorname|text)\{([^{}]*)\}/g, "$1")
        .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
        .replace(/\\sqrt\{([^{}]*)\}/g, "√$1")
        .replace(/\\([A-Za-z]+)/g, (_match, name: string) => LATEX_SYMBOLS[name] ?? name)
        .replace(/\^\{([^{}]*)\}/g, "^$1")
        .replace(/_\{([^{}]*)\}/g, "_$1")
        .replace(/[{}]/g, "")
        .replace(/~/g, " ")
}

function truncateAtWord(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value
    const candidate = value.slice(0, maxLength + 1)
    const lastSpace = candidate.lastIndexOf(" ")
    return `${candidate.slice(0, lastSpace > maxLength * 0.7 ? lastSpace : maxLength).trimEnd()}…`
}

export function glossaryPlainText(markdown: string, maxLength = 240): string {
    const withoutCodeBlocks = markdown.replace(/```[^]*/g, " ")
    const firstParagraph = withoutCodeBlocks.split(/\n\s*\n/, 1)[0] ?? withoutCodeBlocks
    const plain = firstParagraph
        .replace(/<!--[^]*?-->/g, " ")
        .replace(/(^|\s)#{1,6}\s+/g, "$1")
        .replace(/(^|\s)[*-]\s+/g, "$1")
        .replace(/<span\s+[^>]*data-glossary="[^"]+"[^>]*>([^]*?)<\/span>/g, "$1")
        .replace(/!\[([^\]]*)]\([^)]+\)/g, "$1")
        .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
        .replace(/\$\$([^]*?)\$\$/g, (_match, latex: string) => latexToPlainText(latex))
        .replace(/(?<!\\)\$(?!\$)([^\n$]+?)(?<!\\)\$/g, (_match, latex: string) => latexToPlainText(latex))
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
        .replace(/(?<!_)_([^_]+)_(?!_)/g, "$1")
        .replace(/~~([^~]+)~~/g, "$1")
        .replace(/[*`]/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\\([\\`*_[\]{}()#+.!$-])/g, "$1")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()

    return truncateAtWord(plain, maxLength)
}
