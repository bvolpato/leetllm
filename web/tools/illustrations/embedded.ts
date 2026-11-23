export interface EmbeddedIllustrationBlock {
    name: string
    alt?: string
    caption?: string
    source: string
}

const embeddedFencePattern = /```(tsx|typescript)([^\n]*)\r?\n([\s\S]*?)\r?\n```/g
const attributePattern = /([A-Za-z_][\w:-]*)=(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\s]+))/g
const altExportPattern = /\bexport\s+const\s+alt\s*=\s*(['"`])([\s\S]*?)\1\s*;?\s*/m

function decodeAttribute(value: string) {
    try {
        return JSON.parse(`"${value}"`) as string
    } catch {
        return value
    }
}

function parseAttributes(info: string): Record<string, string> {
    const attrs: Record<string, string> = {}
    for (const match of info.matchAll(attributePattern)) {
        attrs[match[1]] = decodeAttribute(match[2] ?? match[3] ?? match[4] ?? '')
    }
    return attrs
}

function isEmbeddedIllustration(info: string, attrs: Record<string, string>) {
    return attrs.render === 'illustration' || /\bleetllm:illustration\b/.test(info)
}

function normalizeIllustrationName(name: string, contentPath: string) {
    const normalized = name.endsWith('.tsx') ? name.slice(0, -4) : name
    if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
        throw new Error(`${contentPath}: invalid embedded illustration name "${name}"`)
    }
    return normalized
}

function extractAltExport(source: string): string | undefined {
    const match = source.match(altExportPattern)
    if (!match) return undefined
    return match[2].replace(/\s+/g, ' ').trim()
}

function stripAltExport(source: string): string {
    return source.replace(altExportPattern, '').trim()
}

export function parseEmbeddedIllustrationBlocks(
    markdown: string,
    contentPath: string,
): EmbeddedIllustrationBlock[] {
    const blocks: EmbeddedIllustrationBlock[] = []
    const names = new Set<string>()

    for (const match of markdown.matchAll(embeddedFencePattern)) {
        const info = match[2] ?? ''
        const attrs = parseAttributes(info)
        if (!isEmbeddedIllustration(info, attrs)) continue

        if (!attrs.name) {
            throw new Error(`${contentPath}: embedded illustration fence needs name="..."`)
        }

        const name = normalizeIllustrationName(attrs.name, contentPath)
        if (names.has(name)) {
            throw new Error(`${contentPath}: duplicate embedded illustration name "${name}"`)
        }
        names.add(name)

        const rawSource = match[3] ?? ''

        blocks.push({
            name,
            alt: attrs.alt ?? extractAltExport(rawSource),
            caption: attrs.caption,
            source: stripAltExport(rawSource),
        })
    }

    return blocks
}
