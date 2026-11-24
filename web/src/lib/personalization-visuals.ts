import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { jsonrepair } from "jsonrepair"
import { filterContentForAudience } from "./content-audience"
import { getQuestionRoute } from "./content-route-index"

export type PersonalizationVisualKind = "mermaid" | "vizmatic"

export interface PersonalizationVisualSource {
    id: string
    kind: PersonalizationVisualKind
    name: string
    source: string
    alt: string
    caption?: string
    canonicalMarkup: string
}

export interface PersonalizedVisualOutput {
    id: string
    kind: PersonalizationVisualKind
    source: string
}

const CONTENT_DIR = join(process.cwd(), "src", "content")
const MAX_VISUALS = 16
const MAX_VISUAL_SOURCE_CHARS = 40_000
const MAX_TOTAL_VISUAL_SOURCE_CHARS = 400_000
const VISUAL_TOKEN_PATTERN = /\[\[LEETLLM_VISUAL_[MV]\d{4}\]\]/g
const MERMAID_START_PATTERN = /^(?:flowchart|graph|sequenceDiagram|block-beta)\b/
const MERMAID_META_PREFIX = "%% leetllm-meta:"
const MERMAID_UNSAFE_PATTERN = /```|%%\s*\{|(?:https?:|javascript:|data:|blob:|file:|\/\/)|<\/?[A-Za-z][^>]*>|url\s*\(/i

function stripFrontmatter(source: string) {
    return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
}

function lessonDirectory(slug: string) {
    if (!/^[a-z0-9-]+$/.test(slug)) return null
    const route = getQuestionRoute(slug)
    if (route) {
        const indexedDir = join(/* turbopackIgnore: true */ CONTENT_DIR, /* turbopackIgnore: true */ route.directory)
        if (existsSync(/* turbopackIgnore: true */ join(indexedDir, "content.md"))) return indexedDir
    }
    if (!existsSync(/* turbopackIgnore: true */ CONTENT_DIR)) return null
    for (const section of readdirSync(/* turbopackIgnore: true */ CONTENT_DIR, { withFileTypes: true })) {
        if (!section.isDirectory()) continue
        const candidate = join(/* turbopackIgnore: true */ CONTENT_DIR, /* turbopackIgnore: true */ section.name, /* turbopackIgnore: true */ slug)
        if (existsSync(/* turbopackIgnore: true */ join(candidate, "content.md"))) return candidate
    }
    return null
}

function decodeHtml(value: string) {
    return value
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
}

function textFromAttribute(markup: string, name: string) {
    const match = markup.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i"))
    return match ? decodeHtml(match[1] ?? match[2] ?? "") : ""
}

function captionFromFigure(markup: string) {
    const caption = markup.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]
    return caption?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function figureFallbackSources(markup: string) {
    const sources = [...markup.matchAll(/\bsrc=(?:"([^"]+)"|'([^']+)')/gi)]
        .map((match) => decodeHtml(match[1] ?? match[2] ?? ""))
        .filter((source) => source.startsWith("/cdn/content-image/"))
    const dark = sources.find((source) => /_dark\.[A-Za-z0-9]+(?:\?|$)/.test(source)) ?? sources[0]
    const light = sources.find((source) => /_light\.[A-Za-z0-9]+(?:\?|$)/.test(source)) ?? sources[0]
    return {
        ...(dark ? { fallbackDarkSrc: dark } : {}),
        ...(light ? { fallbackLightSrc: light } : {}),
    }
}

function extractTsxAlt(source: string) {
    const match = source.match(/\bexport\s+const\s+alt\s*=\s*(['"`])([\s\S]*?)\1\s*;?/m)
    return match?.[2].replace(/\s+/g, " ").trim() ?? ""
}

function figureBlocks(markdown: string) {
    return [...markdown.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi)].map((match) => match[0])
}

function illustrationName(pathName: string) {
    return pathName.replace(/_(?:dark|light)$/, "")
}

interface RawVisual {
    kind: PersonalizationVisualKind
    name: string
    source: string
    index: number
    diagramIndex?: number
    rawMarkup?: string
}

function rawVisuals(rawBody: string, articleDir: string, sourceBody: string) {
    const visuals: RawVisual[] = []
    const sourceDiagrams = Array.from(sourceBody.matchAll(/```mermaid[^\n]*\n([\s\S]*?)\r?\n```/g), match => match[0])

    for (const match of rawBody.matchAll(/```mermaid[^\n]*\n([\s\S]*?)\r?\n```/g)) {
        const diagramIndex = sourceDiagrams.indexOf(match[0])
        if (diagramIndex < 0) throw new Error(`${articleDir}/content.md: retained Mermaid diagram does not match its full source`)
        visuals.push({
            kind: "mermaid",
            name: `content_diagram_${diagramIndex}`,
            source: match[1].trim(),
            index: match.index ?? 0,
            diagramIndex,
            rawMarkup: match[0],
        })
    }

    for (const match of rawBody.matchAll(/```(?:tsx|typescript)([^\n]*(?:render\s*=\s*["']?illustration["']?|leetllm:illustration)[^\n]*)\n([\s\S]*?)\r?\n```/g)) {
        const name = match[1].match(/\bname=(?:"([^"]+)"|'([^']+)'|([^\s]+))/)?.slice(1).find(Boolean)
        if (!name) continue
        visuals.push({
            kind: "vizmatic",
            name: name.replace(/\.tsx$/, ""),
            source: match[2].trim(),
            index: match.index ?? 0,
            rawMarkup: match[0],
        })
    }

    const seenIllustrations = new Set(visuals.filter((visual) => visual.kind === "vizmatic").map((visual) => visual.name))
    for (const match of rawBody.matchAll(/illustrations\/(?:_generated\/)?([A-Za-z0-9_-]+)\.png/g)) {
        const name = illustrationName(match[1])
        if (seenIllustrations.has(name)) continue
        const sourcePath = join(articleDir, "illustrations", `${name}.tsx`)
        if (!existsSync(/* turbopackIgnore: true */ sourcePath)) continue
        seenIllustrations.add(name)
        const surroundingFigure = rawBody.slice(0, match.index).lastIndexOf("<figure")
        const figureEnd = rawBody.indexOf("</figure>", match.index)
        const rawMarkup = surroundingFigure >= 0 && figureEnd >= 0
            ? rawBody.slice(surroundingFigure, figureEnd + "</figure>".length)
            : undefined
        visuals.push({
            kind: "vizmatic",
            name,
            source: readFileSync(/* turbopackIgnore: true */ sourcePath, "utf8"),
            index: match.index ?? 0,
            rawMarkup,
        })
    }

    return visuals.sort((left, right) => left.index - right.index)
}

function canonicalFigureFor(raw: RawVisual, figures: string[]) {
    if (raw.kind === "mermaid") {
        return figures.find((figure) => figure.includes(`content_diagram_${raw.diagramIndex}_`))
    }
    return figures.find((figure) => (
        figure.includes(`/${raw.name}_dark.`)
        || figure.includes(`/${raw.name}_light.`)
        || figure.includes(`/${raw.name}_scene`)
    ))
}

export function extractPersonalizationVisuals(slug: string, resolvedMarkdown: string): PersonalizationVisualSource[] {
    const articleDir = lessonDirectory(slug)
    if (!articleDir) return []
    const contentPath = join(articleDir, "content.md")
    const sourceBody = stripFrontmatter(readFileSync(/* turbopackIgnore: true */ contentPath, "utf8"))
    const rawBody = filterContentForAudience(sourceBody, "website", contentPath)
    const figures = figureBlocks(resolvedMarkdown)
    const result: PersonalizationVisualSource[] = []
    let totalSourceChars = 0

    for (const raw of rawVisuals(rawBody, articleDir, sourceBody)) {
        if (result.length >= MAX_VISUALS) break
        if (!raw.source || raw.source.length > MAX_VISUAL_SOURCE_CHARS) continue
        if (totalSourceChars + raw.source.length > MAX_TOTAL_VISUAL_SOURCE_CHARS) break
        const canonicalMarkup = canonicalFigureFor(raw, figures)
        if (!canonicalMarkup) continue
        const prefix = raw.kind === "mermaid" ? "M" : "V"
        const id = `${prefix}${String(result.length + 1).padStart(4, "0")}`
        const alt = textFromAttribute(canonicalMarkup, "alt")
            || (raw.kind === "vizmatic" ? extractTsxAlt(raw.source) : "")
            || `${raw.name.replace(/[_-]+/g, " ")} diagram`
        const caption = captionFromFigure(raw.rawMarkup ?? "")
        result.push({ id, kind: raw.kind, name: raw.name, source: raw.source, alt, caption, canonicalMarkup })
        totalSourceChars += raw.source.length
    }

    return result
}

export function insertVisualPlaceholders(source: string, visuals: PersonalizationVisualSource[]) {
    let markdown = source
    const inserted: PersonalizationVisualSource[] = []
    for (const visual of visuals) {
        if (!markdown.includes(visual.canonicalMarkup)) continue
        const token = `[[LEETLLM_VISUAL_${visual.id}]]`
        markdown = markdown.replace(visual.canonicalMarkup, token)
        inserted.push(visual)
    }
    return { markdown, visuals: inserted }
}

function validateMermaidSource(source: string) {
    const trimmed = source.trim()
    if (!trimmed || trimmed.length > 20_000 || trimmed.split("\n").length > 250) {
        throw new Error("Mermaid visual exceeds size limits.")
    }
    if (!MERMAID_START_PATTERN.test(trimmed)) {
        throw new Error("Mermaid visual uses an unsupported diagram type.")
    }
    if (MERMAID_UNSAFE_PATTERN.test(trimmed)) {
        throw new Error("Mermaid visual contains unsafe directives, links, or HTML.")
    }
    if (/^\s*(?:click|href|style|classDef|linkStyle|class)\b/im.test(trimmed) || /^\s*(?:image|icon)\s*:/im.test(trimmed)) {
        throw new Error("Mermaid visual contains unsafe directives, links, or HTML.")
    }
    const identifierCount = new Set([...trimmed.matchAll(/\b([A-Za-z][A-Za-z0-9_]*)\s*(?=\[|\(|\{|-->|---|==>)/g)]
        .map((match) => match[1])).size
    const edgeCount = (trimmed.match(/-->|---|==>|-.->|===>|~~~/g) ?? []).length
    if (identifierCount > 100 || edgeCount > 160) {
        throw new Error("Mermaid visual is too complex.")
    }
    return trimmed
}

function flowNodeShapePattern() {
    const stringLiteral = String.raw`(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')`
    const shape = String.raw`(?:\[\[(?:${stringLiteral}|[^\]])*\]\]|\[\((?:${stringLiteral}|[^\]])*\)\]|\[(?:${stringLiteral}|[^\]])*\]|\(\((?:${stringLiteral}|[^)])*\)\)|\((?:${stringLiteral}|[^)])*\)|\{\{(?:${stringLiteral}|[^}])*\}\}|\{(?:${stringLiteral}|[^}])*\})`
    return new RegExp(
        String.raw`([A-Za-z][A-Za-z0-9_-]*)\s*(${shape})`,
        "g",
    )
}

function normalizeFlowLine(line: string) {
    return line
        .replace(flowNodeShapePattern(), "$1")
        .replace(/:::[A-Za-z][A-Za-z0-9_-]*/g, "")
        .replace(/-->\s*\|[^|\n]*\|/g, "-->")
        .replace(/--\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^-\n]*?)\s*-->/g, "-->")
        .replace(/-\.\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|.*?)\s*\.->/g, "-->")
        .replace(/-\.->/g, "-->")
        .replace(/={2,3}>/g, "-->")
}

function topologyLinesWithoutAccessibilityMetadata(source: string) {
    const lines: string[] = []
    let inDescription = false

    for (const rawLine of source.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (inDescription) {
            if (line === "}") inDescription = false
            continue
        }
        if (/^accTitle\s*:/.test(line) || /^accDescr\s*:/.test(line)) continue
        if (/^accDescr\s*\{\s*$/.test(line)) {
            inDescription = true
            continue
        }
        if (/^accDescr\s*\{/.test(line)) {
            throw new Error("Malformed Mermaid accessibility description.")
        }
        lines.push(rawLine)
    }

    if (inDescription) throw new Error("Malformed Mermaid accessibility description.")
    return lines
}

function flowSignature(source: string) {
    const lines = topologyLinesWithoutAccessibilityMetadata(source)
    const header = lines[0]?.trim().match(/^(?:flowchart|graph)\s+(LR|RL|TB|TD|BT)$/)
    if (!header) throw new Error("Mermaid flowchart header is invalid.")
    const nodes = new Set<string>()
    const edges: string[] = []

    for (const rawLine of lines.slice(1)) {
        const line = rawLine.trim()
        if (!line || line.startsWith("%%") || /^(?:direction\s+(?:LR|RL|TB|TD|BT)|end)$/.test(line)) continue
        const subgraph = line.match(/^subgraph\s+([A-Za-z][A-Za-z0-9_-]*)(?:\s*.*)?$/)
        if (subgraph) continue
        if (/^(?:classDef|class|style|linkStyle)\b/.test(line)) continue

        const normalized = normalizeFlowLine(line)
        const undirectedLink = normalized.includes("~~~") ? "~~~" : normalized.includes("---") ? "---" : null
        if (undirectedLink) {
            const endpoints = normalized.split(undirectedLink === "~~~" ? /\s*~~~\s*/ : /\s*---\s*/)
            if (endpoints.some((endpoint) => !/^[A-Za-z][A-Za-z0-9_-]*$/.test(endpoint))) {
                throw new Error("Mermaid flowchart contains a malformed edge.")
            }
            for (const endpoint of endpoints) nodes.add(endpoint)
            for (let index = 0; index < endpoints.length - 1; index++) {
                edges.push(`${endpoints[index]}${undirectedLink === "~~~" ? "~" : "-"}${endpoints[index + 1]}`)
            }
            continue
        }
        const parts = normalized.split(/\s*-->\s*/)
        if (parts.length > 1) {
            const endpoints = parts.map((part) => {
                const identifiers = part.match(/[A-Za-z][A-Za-z0-9_-]*/g) ?? []
                return identifiers[0]
            })
            if (endpoints.some((endpoint) => !endpoint)) {
                throw new Error("Mermaid flowchart contains a malformed edge.")
            }
            for (const endpoint of endpoints) nodes.add(endpoint!)
            for (let index = 0; index < endpoints.length - 1; index++) {
                edges.push(`${endpoints[index]}>${endpoints[index + 1]}`)
            }
            continue
        }

        const declaration = normalized.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*$/)
        if (declaration) {
            nodes.add(declaration[1])
            continue
        }
        throw new Error("Mermaid flowchart contains unsupported or malformed syntax.")
    }
    if (nodes.size === 0) throw new Error("Mermaid flowchart has no topology.")
    return JSON.stringify({ nodes: [...nodes].sort(), edges })
}

function flowNodeNumericAssociations(source: string) {
    const associations = new Map<string, string[]>()
    for (const line of topologyLinesWithoutAccessibilityMetadata(source).slice(1)) {
        for (const match of line.matchAll(flowNodeShapePattern())) {
            const tokens = numberTokens(match[2]).map(numericFactKey)
            if (tokens.length === 0) continue
            const existing = associations.get(match[1]) ?? []
            existing.push(...tokens)
            associations.set(match[1], existing)
        }
    }
    return JSON.stringify([...associations.entries()].sort(([left], [right]) => left.localeCompare(right)))
}

function sequenceSignature(source: string) {
    // Trusted canonical labels may contain line breaks. Personalized labels
    // must use their plain-text equivalent because model-authored HTML is banned.
    const lines = topologyLinesWithoutAccessibilityMetadata(source.replace(/<br\s*\/?\s*>/gi, " / "))
    if (lines[0].trim() !== "sequenceDiagram") throw new Error("Mermaid sequence header is invalid.")
    const participants: string[] = []
    const messages: string[] = []
    const controls: string[] = []
    const notes: string[] = []

    for (const rawLine of lines.slice(1)) {
        const line = rawLine.trim()
        if (!line || line.startsWith("%%") || line === "autonumber") continue
        const participant = line.match(/^(?:participant|actor)\s+([A-Za-z][A-Za-z0-9_-]*)(?:\s+as\s+.+)?$/)
        if (participant) {
            participants.push(participant[1])
            continue
        }
        const message = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*(?:-{1,2}|={1,2})(?:>>?|x|\))\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/)
        if (message) {
            messages.push(`${message[1]}>${message[2]}:${message[3].replace(/\s+/g, " ").trim()}`)
            continue
        }
        const note = line.match(/^Note\s+(over|left of|right of)\s+([A-Za-z][A-Za-z0-9_-]*(?:\s*,\s*[A-Za-z][A-Za-z0-9_-]*)?)\s*:\s*(.*)$/)
        if (note) {
            notes.push(`${note[1]}:${note[2].replace(/\s+/g, "")}:${note[3].replace(/\s+/g, " ").trim()}`)
            continue
        }
        const control = line.match(/^(alt|else|opt|loop|par|and|critical|break|rect|end)(?:\s+(.*))?$/)
        if (control) {
            controls.push(`${control[1]}:${(control[2] ?? "").replace(/\s+/g, " ").trim()}`)
            continue
        }
        throw new Error("Mermaid sequence contains unsupported or malformed syntax.")
    }
    if (participants.length === 0 || messages.length === 0) throw new Error("Mermaid sequence has no message topology.")
    return JSON.stringify({ participants, messages, controls, notes })
}

function blockSignature(source: string) {
    const lines = topologyLinesWithoutAccessibilityMetadata(source)
    if (lines[0]?.trim() !== "block-beta") throw new Error("Mermaid block header is invalid.")
    const columns = lines[1]?.trim().match(/^columns\s+(\d+)$/)
    if (!columns || Number(columns[1]) < 1 || Number(columns[1]) > 100) {
        throw new Error("Mermaid block column count is invalid.")
    }
    const columnCount = Number(columns[1])
    const rows: string[][] = []
    const edges: string[] = []
    const ids = new Set<string>()
    const cellShape = flowNodeShapePattern()

    for (const rawLine of lines.slice(2)) {
        const line = rawLine.trim()
        if (!line || line.startsWith("%%") || /^(?:classDef|class|style|linkStyle)\b/.test(line)) continue

        const edgeParts = line.split(/\s*-->\s*/)
        if (edgeParts.length > 1) {
            const endpoints = edgeParts.map((part) => part.trim())
            if (endpoints.some((id) => !/^[A-Za-z][A-Za-z0-9_-]*$/.test(id) || id === "space" || !ids.has(id))) {
                throw new Error("Mermaid block contains a malformed edge.")
            }
            for (let index = 0; index < endpoints.length - 1; index++) {
                edges.push(`${endpoints[index]}>${endpoints[index + 1]}`)
            }
            continue
        }
        const cells: string[] = []
        let cursor = 0
        while (cursor < line.length) {
            while (/\s/.test(line[cursor] ?? "")) cursor++
            if (cursor >= line.length) break

            const remainder = line.slice(cursor)
            const space = remainder.match(/^space(?::(\d+))?(?=\s|$)/)
            if (space) {
                const span = Number(space[1] ?? 1)
                if (span < 1 || span > columnCount) throw new Error("Mermaid block cell span is invalid.")
                cells.push(`space:${span}`)
                cursor += space[0].length
                continue
            }

            cellShape.lastIndex = cursor
            const node = cellShape.exec(line)
            if (!node || node.index !== cursor) throw new Error("Mermaid block contains unsupported or malformed syntax.")
            cursor = cellShape.lastIndex
            const suffix = line.slice(cursor).match(/^\s*:\s*(\d+)/)
            const span = Number(suffix?.[1] ?? 1)
            if (span < 1 || span > columnCount) throw new Error("Mermaid block cell span is invalid.")
            if (suffix) cursor += suffix[0].length
            if (ids.has(node[1])) throw new Error("Mermaid block repeats a node identifier.")
            ids.add(node[1])
            cells.push(`${node[1]}:${span}`)
        }

        const occupied = cells.reduce((total, cell) => total + Number(cell.match(/:(\d+)$/)?.[1] ?? 1), 0)
        if (occupied !== columnCount) throw new Error("Mermaid block row does not match its column count.")
        rows.push(cells)
    }

    if (rows.length === 0 || ids.size === 0) throw new Error("Mermaid block has no topology.")
    return JSON.stringify({ columns: columnCount, rows, nodes: [...ids].sort(), edges })
}

function mermaidTopologySignature(source: string) {
    if (source.startsWith("sequenceDiagram")) return sequenceSignature(source)
    if (source.startsWith("block-beta")) return blockSignature(source)
    return flowSignature(source)
}

export function validatePersonalizedMermaidSource(canonical: string, personalized: string) {
    const source = validateMermaidSource(personalized)
    if (mermaidTopologySignature(canonical) !== mermaidTopologySignature(source)) {
        throw new Error("Mermaid visual changed canonical nodes, edges, or direction.")
    }
    const canonicalSemanticSource = canonical.split(/\r?\n/)
        .filter((line) => !/^\s*(?:classDef|class|style|linkStyle)\b/.test(line))
        .join("\n")
    const canonicalNumbers = numberTokens(canonicalSemanticSource).sort()
    const personalizedNumbers = numberTokens(source).sort()
    if (JSON.stringify(canonicalNumbers) !== JSON.stringify(personalizedNumbers)) {
        throw new Error("Mermaid visual changed canonical numeric facts.")
    }
    if (
        !canonical.startsWith("sequenceDiagram")
        && flowNodeNumericAssociations(canonical) !== flowNodeNumericAssociations(source)
    ) {
        throw new Error("Mermaid visual changed canonical numeric fact associations.")
    }
    return source
}

function numberTokens(value: string) {
    const normalized = value.replace(/[−–]/g, "-")
    return [...normalized.matchAll(/\d+(?:\.\d+)?%?/g)].map((match) => {
        const index = match.index ?? 0
        const sign = normalized[index - 1]
        const beforeSign = normalized[index - 2]
        const precedingWords = normalized.slice(Math.max(0, index - 12), index)
        const wordSign = /\bminus\s*$/i.test(precedingWords) ? "-" : ""
        const isExplicitSign = sign === "-"
            && (index === 1 || beforeSign === undefined || /[\s([{:=>]/.test(beforeSign))
        return `${wordSign || (isExplicitSign ? sign : "")}${match[0]}`
    })
}

function numericFactKey(token: string) {
    const percent = token.endsWith("%")
    const number = Number(percent ? token.slice(0, -1) : token)
    return Number.isFinite(number) ? `${Object.is(number, -0) ? 0 : number}${percent ? "%" : ""}` : token
}

const SEMANTIC_ARRAY_KEYS = new Set([
    "data", "points", "rows", "segments", "series", "values", "stages", "tiles", "events", "layers",
    "nodes", "edges", "regions", "items", "lines", "xLabels", "yLabels", "rowLabels", "colLabels",
    "labels", "annotations", "activePath",
])
const LAYOUT_NUMBER_KEY_PATTERN = /\b(?:width|minWidth|height|minHeight|padding|gap|radius|fontSize|titleFontSize|detailFontSize|valueFontSize|labelFontSize|accentWidth|accentHeight|strokeWidth|arrowSize|thickness|cellWidth|firstColWidth|cellHeight|cellSize|rowLabelWidth|barWidth|barHeight|minBarHeight|markerSize|connectorLength|length|nodeSize|nodeWidth|nodeHeight|levelGap|siblingGap|columns|headerRows|headerCols|size)\s*[:=]\s*(?:\{\s*)?-?\d+(?:\.\d+)?(?:\s*\})?/g
const POSITION_NUMBER_KEY_PATTERN = /\b(?:x|y)\s*[:=]\s*(?:\{\s*)?-?\d+(?:\.\d+)?(?:\s*\})?/g
const DISPLAY_VALUE_LABEL_PATTERN = /\b(?:valueLabel|lowLabel|midLabel|highLabel)\s*:\s*(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g
const DISPLAY_VALUE_LABEL_KEYS = new Set(["valueLabel", "lowLabel", "midLabel", "highLabel"])

function semanticStringNumericFacts(source: string, arraySpans: Array<{ start: number; end: number }>) {
    const pattern = /\b(?:title|subtitle|eyebrow|label|detail|text|formula|result|footer|legend|xAxisLabel|yAxisLabel|axisLabel|sublabel|value|time)\s*[:=]\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g
    return [...source.matchAll(pattern)]
        .filter((match) => !arraySpans.some((span) => (match.index ?? 0) >= span.start && (match.index ?? 0) < span.end))
        .flatMap((match) => numberTokens(match[2]))
}

function semanticArrayNumericFacts(source: string, includeLabeledUnderlying: boolean) {
    const result: string[] = []
    const spans: Array<{ start: number; end: number }> = []
    const sources: Array<{ key: string; source: string }> = []
    const startPattern = /\b([A-Za-z][A-Za-z0-9_]*)\s*[:=]\s*(?:\{\s*)?\[/g
    for (const match of source.matchAll(startPattern)) {
        if (!SEMANTIC_ARRAY_KEYS.has(match[1])) continue
        const start = (match.index ?? 0) + match[0].lastIndexOf("[")
        let depth = 0
        let quote = ""
        let escaped = false
        for (let index = start; index < source.length; index++) {
            const character = source[index]
            if (quote) {
                if (escaped) escaped = false
                else if (character === "\\") escaped = true
                else if (character === quote) quote = ""
                continue
            }
            if (character === "\"" || character === "'" || character === "`") {
                quote = character
                continue
            }
            if (character === "[") depth++
            else if (character === "]") {
                depth--
                if (depth === 0) {
                    const rawArraySource = source.slice(start, index + 1)
                    let arraySource = rawArraySource
                        .replace(LAYOUT_NUMBER_KEY_PATTERN, "")
                        .replace(/#[0-9A-Fa-f]{3,8}\b/g, "")
                        .replace(/\brgba?\([^)]*\)/g, "")
                    if (match[1] === "nodes") {
                        arraySource = arraySource.replace(POSITION_NUMBER_KEY_PATTERN, "")
                    }
                    if (!includeLabeledUnderlying) {
                        arraySource = arraySource.replace(DISPLAY_VALUE_LABEL_PATTERN, "")
                    }
                    result.push(...numberTokens(arraySource))
                    spans.push({ start, end: index + 1 })
                    sources.push({ key: match[1], source: rawArraySource })
                    break
                }
            }
        }
    }
    return { facts: result, spans, sources }
}

function balancedObjectSources(source: string) {
    const objects: string[] = []
    const starts: number[] = []
    let quote = ""
    let escaped = false
    for (let index = 0; index < source.length; index++) {
        const character = source[index]
        if (quote) {
            if (escaped) escaped = false
            else if (character === "\\") escaped = true
            else if (character === quote) quote = ""
            continue
        }
        if (character === "\"" || character === "'" || character === "`") {
            quote = character
            continue
        }
        if (character === "{") starts.push(index)
        else if (character === "}" && starts.length > 0) {
            const start = starts.pop()!
            objects.push(source.slice(start, index + 1))
        }
    }
    return objects
}

function normalizedAssociationIdentity(value: string) {
    return value.replace(/\\(["'`\\])/g, "$1").replace(/\s+/g, " ").trim().toLowerCase()
}

function labeledNumericAssociationsFromSource(source: string) {
    const associations = new Map<string, string[]>()
    const identityPattern = /\b(?:label|name|id|title)\s*:\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/
    const identityRemovalPattern = /\b(?:label|name|id|title)\s*:\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g
    for (const array of semanticArrayNumericFacts(source, false).sources) {
        for (const objectSource of balancedObjectSources(array.source)) {
            const identity = objectSource.match(identityPattern)
            if (!identity) continue
            let semanticSource = objectSource
                .replace(identityRemovalPattern, "")
                .replace(LAYOUT_NUMBER_KEY_PATTERN, "")
                .replace(/#[0-9A-Fa-f]{3,8}\b/g, "")
                .replace(/\brgba?\([^)]*\)/g, "")
            if (array.key === "nodes") semanticSource = semanticSource.replace(POSITION_NUMBER_KEY_PATTERN, "")
            semanticSource = semanticSource.replace(DISPLAY_VALUE_LABEL_PATTERN, "")
            const tokens = numberTokens(semanticSource).map(numericFactKey)
            if (tokens.length === 0) continue
            const key = normalizedAssociationIdentity(identity[2])
            const existing = associations.get(key) ?? []
            existing.push(...tokens)
            associations.set(key, existing)
        }
    }
    return associations
}

function displayValueAssociationsFromSource(source: string) {
    const associations = new Map<string, string[]>()
    const identityPattern = /\b(?:label|name|id|title)\s*:\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/
    const displayPattern = /\b(valueLabel|lowLabel|midLabel|highLabel)\s*:\s*(["'`])((?:\\.|(?!\2)[\s\S])*?)\2/g
    for (const array of semanticArrayNumericFacts(source, true).sources) {
        for (const objectSource of balancedObjectSources(array.source)) {
            const identity = objectSource.match(identityPattern)
            if (!identity) continue
            for (const display of objectSource.matchAll(displayPattern)) {
                const tokens = numberTokens(display[3]).map(numericFactKey)
                if (tokens.length === 0) continue
                const key = `${normalizedAssociationIdentity(identity[2])}:${display[1]}`
                associations.set(key, [...(associations.get(key) ?? []), ...tokens])
            }
        }
    }
    return associations
}

function canonicalVizmaticSemanticNumericFacts(
    source: string,
    alt: string,
    caption?: string,
    includeLabeledUnderlying = false,
) {
    const arrays = semanticArrayNumericFacts(source, includeLabeledUnderlying)
    const explicitValues = [...source.matchAll(/\b(?:value|low|mid|high|min|max|xMin|xMax|yMin|yMax)\s*[:=]\s*(?:\{\s*)?(-?\d+(?:\.\d+)?%?)(?:\s*\})?/g)]
        .filter((match) => !arrays.spans.some((span) => (match.index ?? 0) >= span.start && (match.index ?? 0) < span.end))
        .flatMap((match) => numberTokens(match[1]))
    const sourceFacts = [
        ...semanticStringNumericFacts(source, arrays.spans),
        ...arrays.facts,
        ...explicitValues,
    ]
    const metadataFacts = numberTokens([alt, caption].filter(Boolean).join(" "))
    return sourceFacts.length > 0 ? sourceFacts : metadataFacts
}

export function canonicalVisualNumericFacts(
    visual: Pick<PersonalizationVisualSource, "kind" | "source" | "alt" | "caption">,
) {
    return visual.kind === "mermaid"
        ? numberTokens(visual.source)
        : canonicalVizmaticSemanticNumericFacts(visual.source, visual.alt, visual.caption)
}

function assertNumericFactsPreserved(canonical: string[], personalized: string[], id: string) {
    const available = new Map<string, number>()
    for (const token of personalized.map(numericFactKey)) available.set(token, (available.get(token) ?? 0) + 1)
    for (const token of canonical) {
        const key = numericFactKey(token)
        const count = available.get(key) ?? 0
        if (count === 0) throw new Error(`Visual ${id} removed canonical numeric fact ${token}.`)
        available.set(key, count - 1)
    }
}

const VIZMATIC_LAYOUT_KEYS = new Set([
    "width", "minWidth", "height", "minHeight", "contentWidth", "eventWidth", "sideWidth", "keyWidth",
    "tileWidth", "padding", "gap", "radius", "fontSize", "titleFontSize", "detailFontSize", "valueFontSize",
    "labelFontSize", "accentWidth", "accentHeight", "strokeWidth", "arrowSize", "thickness", "cellWidth",
    "firstColWidth", "cellHeight", "cellSize", "rowLabelWidth", "barWidth", "barHeight", "minBarHeight",
    "markerSize", "connectorLength", "length", "nodeSize", "nodeWidth", "nodeHeight", "levelGap", "siblingGap",
    "columns", "headerRows", "headerCols", "size", "x", "y",
])

interface VizmaticSemanticContext {
    componentType?: string
    collectionKey?: string
}

function isSemanticVizmaticCoordinate(key: string, context: VizmaticSemanticContext) {
    return (key === "x" || key === "y")
        && context.collectionKey === "points"
        && ["ScatterPlot", "QuadrantChart", "AxisPlot"].includes(context.componentType ?? "")
}

function semanticVizmaticNumberTokens(
    value: unknown,
    key?: string,
    context: VizmaticSemanticContext = {},
): string[] {
    if (key && DISPLAY_VALUE_LABEL_KEYS.has(key)) return []
    if (key && VIZMATIC_LAYOUT_KEYS.has(key) && !isSemanticVizmaticCoordinate(key, context)) return []
    if (typeof value === "string") return numberTokens(value)
    if (typeof value === "number") return [String(value)]
    if (Array.isArray(value)) {
        const nextContext = key ? { ...context, collectionKey: key } : context
        return value.flatMap((item) => semanticVizmaticNumberTokens(item, undefined, nextContext))
    }
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>
        const componentType = typeof record.type === "string" ? record.type : context.componentType
        return Object.entries(record).flatMap(([childKey, child]) => {
            const nextContext = childKey === "props"
                ? { componentType, collectionKey: undefined }
                : { ...context, componentType }
            return semanticVizmaticNumberTokens(child, childKey, nextContext)
        })
    }
    return []
}

function labeledNumericAssociationsFromScene(value: unknown) {
    const associations = new Map<string, string[]>()

    function visit(item: unknown, context: VizmaticSemanticContext = {}) {
        if (Array.isArray(item)) {
            for (const child of item) visit(child, context)
            return
        }
        if (!item || typeof item !== "object") return
        const record = item as Record<string, unknown>
        const componentType = typeof record.type === "string" ? record.type : context.componentType
        if (context.collectionKey && SEMANTIC_ARRAY_KEYS.has(context.collectionKey)) {
            const identity = ["label", "name", "id", "title"]
                .map((key) => record[key])
                .find((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0)
            if (identity) {
                const tokens = Object.entries(record).flatMap(([key, child]) => {
                    if (["label", "name", "id", "title"].includes(key)) return []
                    return semanticVizmaticNumberTokens(child, key, { ...context, componentType })
                }).map(numericFactKey)
                if (tokens.length > 0) {
                    const key = normalizedAssociationIdentity(identity)
                    const existing = associations.get(key) ?? []
                    existing.push(...tokens)
                    associations.set(key, existing)
                }
            }
        }
        for (const [key, child] of Object.entries(record)) {
            const nextContext = key === "props"
                ? { componentType, collectionKey: undefined }
                : {
                    componentType,
                    collectionKey: Array.isArray(child) && SEMANTIC_ARRAY_KEYS.has(key)
                        ? key
                        : context.collectionKey,
                }
            visit(child, nextContext)
        }
    }

    visit(value)
    return associations
}

function displayValueAssociationsFromScene(value: unknown) {
    const associations = new Map<string, string[]>()

    function visit(item: unknown, collectionKey?: string) {
        if (Array.isArray(item)) {
            for (const child of item) visit(child, collectionKey)
            return
        }
        if (!item || typeof item !== "object") return
        const record = item as Record<string, unknown>
        if (collectionKey && SEMANTIC_ARRAY_KEYS.has(collectionKey)) {
            const identity = ["label", "name", "id", "title"]
                .map((key) => record[key])
                .find((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0)
            if (identity) {
                for (const key of DISPLAY_VALUE_LABEL_KEYS) {
                    if (typeof record[key] !== "string") continue
                    const tokens = numberTokens(record[key]).map(numericFactKey)
                    if (tokens.length === 0) continue
                    const associationKey = `${normalizedAssociationIdentity(identity)}:${key}`
                    associations.set(associationKey, [...(associations.get(associationKey) ?? []), ...tokens])
                }
            }
        }
        for (const [key, child] of Object.entries(record)) {
            visit(child, Array.isArray(child) && SEMANTIC_ARRAY_KEYS.has(key) ? key : collectionKey)
        }
    }

    visit(value)
    return associations
}

function numericAssociationSignature(associations: Map<string, string[]>) {
    return JSON.stringify([...associations.entries()]
        .map(([key, tokens]) => [key, [...tokens].sort()] as const)
        .sort(([left], [right]) => left.localeCompare(right)))
}

function assertLabeledVizmaticFactsPreserved(visual: PersonalizationVisualSource, output: unknown) {
    const canonical = labeledNumericAssociationsFromSource(visual.source)
    if (canonical.size === 0) return
    const personalized = labeledNumericAssociationsFromScene(output)
    if (numericAssociationSignature(canonical) !== numericAssociationSignature(personalized)) {
        throw new Error(`Visual ${visual.id} changed canonical labeled numeric fact associations.`)
    }
}

function assertVizmaticDisplayValuesPreserved(visual: PersonalizationVisualSource, output: unknown) {
    const canonical = displayValueAssociationsFromSource(visual.source)
    const personalized = displayValueAssociationsFromScene(output)
    if (numericAssociationSignature(canonical) !== numericAssociationSignature(personalized)) {
        throw new Error(`Visual ${visual.id} changed canonical numeric display labels.`)
    }
}

function assertNoInventedVizmaticNumbers(visual: PersonalizationVisualSource, output: unknown) {
    const allowed = new Set(canonicalVizmaticSemanticNumericFacts(
        visual.source,
        visual.alt,
        visual.caption,
        true,
    ).map(numericFactKey))
    for (const token of new Set(semanticVizmaticNumberTokens(output))) {
        if (!allowed.has(numericFactKey(token))) throw new Error(`Visual ${visual.id} invented numeric fact ${token}.`)
    }
}

function mermaidMetadata(visual: PersonalizationVisualSource) {
    const metadata = {
        alt: visual.alt,
        ...(visual.caption ? { caption: visual.caption } : {}),
        ...figureFallbackSources(visual.canonicalMarkup),
    }
    return Buffer.from(JSON.stringify(metadata), "utf8").toString("base64url")
}

export function parseVizmaticSceneSource(source: string) {
    const trimmed = source.trim()
    if (!trimmed || trimmed.length > 16_000) throw new Error("Vizmatic scene exceeds size limits.")
    let parsed: unknown
    try {
        parsed = JSON.parse(trimmed)
    } catch {
        try {
            parsed = JSON.parse(jsonrepair(trimmed)) as unknown
        } catch {
            throw new Error("Vizmatic visual returned invalid JSON.")
        }
    }
    return parsed
}

export function applyPersonalizedVisuals(
    markdown: string,
    canonical: PersonalizationVisualSource[],
    outputs: PersonalizedVisualOutput[],
    validateVizmatic: (value: unknown) => boolean,
) {
    if (outputs.length !== canonical.length) {
        throw new Error(`Expected ${canonical.length} visual rewrites, received ${outputs.length}.`)
    }
    let result = markdown
    for (let index = 0; index < canonical.length; index++) {
        const visual = canonical[index]
        const output = outputs[index]
        if (!output || output.id !== visual.id || output.kind !== visual.kind || typeof output.source !== "string") {
            throw new Error(`Visual rewrite ${visual.id} was missing or out of order.`)
        }
        const token = `[[LEETLLM_VISUAL_${visual.id}]]`
        let fence: string
        if (visual.kind === "mermaid") {
            const source = validatePersonalizedMermaidSource(visual.source, output.source)
            if (source.replace(/\s+/g, " ") === visual.source.trim().replace(/\s+/g, " ")) {
                throw new Error(`Visual ${visual.id} must adapt at least one label, grouping, or layout choice.`)
            }
            fence = `\`\`\`mermaid\n${MERMAID_META_PREFIX} ${mermaidMetadata(visual)}\n${source}\n\`\`\``
        } else {
            const parsed = parseVizmaticSceneSource(output.source)
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                throw new Error(`Visual ${visual.id} returned an invalid Vizmatic scene.`)
            }
            const parsedRecord = parsed as Record<string, unknown>
            if (!Object.keys(parsedRecord).every((key) => key === "width" || key === "height" || key === "root")) {
                throw new Error(`Visual ${visual.id} returned forbidden Vizmatic metadata.`)
            }
            const modelScene = { width: parsedRecord.width, height: parsedRecord.height, root: parsedRecord.root }
            if (!validateVizmatic(modelScene)) throw new Error(`Visual ${visual.id} returned an invalid Vizmatic scene.`)
            assertNumericFactsPreserved(
                canonicalVisualNumericFacts(visual),
                semanticVizmaticNumberTokens(modelScene),
                visual.id,
            )
            assertNoInventedVizmaticNumbers(visual, modelScene)
            assertLabeledVizmaticFactsPreserved(visual, modelScene)
            assertVizmaticDisplayValuesPreserved(visual, modelScene)
            const scene = {
                ...modelScene,
                alt: visual.alt,
                ...(visual.caption ? { caption: visual.caption } : {}),
                ...figureFallbackSources(visual.canonicalMarkup),
            }
            if (!validateVizmatic(scene)) throw new Error(`Visual ${visual.id} metadata produced an invalid Vizmatic scene.`)
            fence = `\`\`\`vizmatic\n${JSON.stringify(scene)}\n\`\`\``
        }
        if (!result.includes(token)) throw new Error(`Visual placeholder ${visual.id} is missing.`)
        result = result.replace(token, fence)
    }
    if (VISUAL_TOKEN_PATTERN.test(result)) {
        VISUAL_TOKEN_PATTERN.lastIndex = 0
        throw new Error("Visual placeholder restoration failed.")
    }
    VISUAL_TOKEN_PATTERN.lastIndex = 0
    return result
}
