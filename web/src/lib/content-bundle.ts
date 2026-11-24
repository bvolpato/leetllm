import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { filterContentForAudience, type ContentAudience, type ContentEdition } from "./content-audience"

export type ContentBundleMetadata = Record<string, unknown>

export interface ContentBundle {
    metadata: ContentBundleMetadata
    body: string
    sourceBody: string
    contentPath: string
    metadataPath?: string
}

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const embeddedIllustrationPattern =
    /```(?:tsx|typescript)([^\n]*(?:render\s*=\s*["']?illustration["']?|leetllm:illustration)[^\n]*)\r?\n([\s\S]*?)\r?\n```/g
const attributePattern = /([A-Za-z_][\w:-]*)=(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\s]+))/g
const altExportPattern = /\bexport\s+const\s+alt\s*=\s*(['"`])([\s\S]*?)\1\s*;?/m

function decodeAttribute(value: string): string {
    try {
        return JSON.parse(`"${value}"`) as string
    } catch {
        return value
    }
}

function parseAttributes(info: string): Record<string, string> {
    const attrs: Record<string, string> = {}
    for (const match of info.matchAll(attributePattern)) {
        attrs[match[1]] = decodeAttribute(match[2] ?? match[3] ?? match[4] ?? "")
    }
    return attrs
}

function escapeHtmlAttribute(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

function extractAltExport(source: string): string | undefined {
    const match = source.match(altExportPattern)
    if (!match) return undefined
    return match[2].replace(/\s+/g, " ").trim()
}

function parseJsonFrontmatter(contentPath: string, source: string): {
    metadata: ContentBundleMetadata | null
    body: string
} {
    const match = source.match(frontmatterPattern)
    if (!match) {
        return { metadata: null, body: source.trim() }
    }

    try {
        return {
            metadata: JSON.parse(match[1]) as ContentBundleMetadata,
            body: source.slice(match[0].length).trim(),
        }
    } catch (error) {
        throw new Error(`${contentPath}: invalid JSON frontmatter: ${error}`)
    }
}

export function materializeEmbeddedIllustrationSources(markdown: string): string {
    return markdown.replace(embeddedIllustrationPattern, (match, info: string, source: string) => {
        const attrs = parseAttributes(info)
        if (!attrs.name) {
            throw new Error(`Embedded illustration fence needs name="...": ${match.slice(0, 80)}`)
        }

        const name = attrs.name.endsWith(".tsx") ? attrs.name.slice(0, -4) : attrs.name
        const alt = escapeHtmlAttribute(attrs.alt ?? extractAltExport(source) ?? "")
        const caption = attrs.caption ? `\n<figcaption>${attrs.caption}</figcaption>` : ""

        return `<figure>\n<img src="illustrations/_generated/${name}_dark.png" alt="${alt}" />${caption}\n</figure>`
    }).trim()
}

export function loadContentBundle(articleDir: string, audience?: ContentAudience, edition: ContentEdition = "reference"): ContentBundle | null {
    const contentPath = join(articleDir, "content.md")
    const metadataPath = join(articleDir, "metadata.json")

    if (!existsSync(/* turbopackIgnore: true */ contentPath)) {
        return null
    }

    const source = readFileSync(/* turbopackIgnore: true */ contentPath, "utf-8")
    const parsed = parseJsonFrontmatter(contentPath, source)
    const body = audience
        ? filterContentForAudience(parsed.body, audience, contentPath, edition)
        : parsed.body

    if (parsed.metadata) {
        return {
            metadata: parsed.metadata,
            body: materializeEmbeddedIllustrationSources(body),
            sourceBody: parsed.body,
            contentPath,
        }
    }

    if (!existsSync(/* turbopackIgnore: true */ metadataPath)) {
        return null
    }

    return {
        metadata: JSON.parse(readFileSync(/* turbopackIgnore: true */ metadataPath, "utf-8")) as ContentBundleMetadata,
        body: materializeEmbeddedIllustrationSources(body),
        sourceBody: parsed.body,
        contentPath,
        metadataPath,
    }
}
