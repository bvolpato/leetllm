export type ContentAudience = "website" | "book"
export type ContentEdition = "reader" | "reference"

interface Range {
    start: number
    end: number
}

interface AudienceFrame {
    kind: "audience" | "edition"
    target: ContentAudience | ContentEdition
    line: number
}

type Container = { kind: "quote" } | { kind: "list"; indent: number }

const markerPrefix = /<!--\s*leetllm\s*:?\s*(?:audience|edition)/gi
const marker = /^<!--\s*leetllm:\s*(audience|edition):([a-z]+):(start|end)\s*-->$/

function requireAudience(audience: ContentAudience): void {
    if (audience !== "website" && audience !== "book") {
        throw new Error(`Unknown content audience: ${audience}`)
    }
}

/** Article visibility is independent of the text selected within an article. */
export function isVisibleToAudience(metadata: Record<string, unknown>, audience: ContentAudience): boolean {
    requireAudience(audience)
    const visibility = metadata.visibility
    if (visibility !== undefined) {
        if (visibility === null || typeof visibility !== "object" || Array.isArray(visibility)) {
            throw new Error("Invalid content visibility: visibility must be an object")
        }
        for (const [key, value] of Object.entries(visibility)) {
            if (key !== "website" && key !== "book") {
                throw new Error(`Invalid content visibility: unknown audience ${JSON.stringify(key)}`)
            }
            if (typeof value !== "boolean") {
                throw new Error(`Invalid content visibility: visibility.${key} must be a boolean`)
            }
        }
    }

    if (metadata.hidden === true) return false
    if ((visibility as Partial<Record<ContentAudience, boolean>> | undefined)?.[audience] === false) return false
    if (audience === "book") {
        if (metadata.book === false || metadata.in_book === false || metadata.exclude_from_book === true) return false
        if (Array.isArray(metadata.tags) && metadata.tags.some(tag => tag === "no-book" || tag === "skip-book")) return false
    }
    return true
}

function codeRanges(content: string): Range[] {
    const blocks: Range[] = []
    let offset = 0
    let fence: { character: string; length: number } | undefined
    let containers: Container[] = []
    let paragraph = false
    for (const line of content.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g) ?? []) {
        if (!line) continue
        let body = ""
        for (const character of line.replace(/[\r\n]+$/, "")) {
            body += character === "\t" ? " ".repeat(4 - body.length % 4) : character
        }

        let matched = 0
        for (const container of containers) {
            if (container.kind === "quote") {
                const prefix = body.match(/^ {0,3}> ?/)
                if (!prefix) break
                body = body.slice(prefix[0].length)
            } else if (!body.trim()) {
                body = ""
            } else {
                if (!body.startsWith(" ".repeat(container.indent))) break
                body = body.slice(container.indent)
            }
            matched++
        }
        if (matched !== containers.length) {
            containers = containers.slice(0, matched)
            fence = undefined
            paragraph = false
        }

        // Within a fence, only consume its existing containers. A list marker
        // in the literal code must never become a closing fence delimiter.
        if (fence) {
            const closing = body.match(/^ {0,3}(`{3,}|~{3,}) *$/)
            blocks.push({ start: offset, end: offset + line.length })
            if (closing && closing[1][0] === fence.character && closing[1].length >= fence.length) {
                fence = undefined
            }
        } else {
            while (body) {
                if (/^ {0,3}(?:(?:\* *){3,}|(?:- *){3,}|(?:_ *){3,})$/.test(body)) break
                const quote = body.match(/^ {0,3}> ?/)
                if (quote) {
                    containers.push({ kind: "quote" })
                    body = body.slice(quote[0].length)
                    paragraph = false
                    continue
                }
                const item = body.match(/^( {0,3})([-+*]|\d{1,9}[.)])(?:( +)|$)/)
                if (!item || (paragraph && /^\d/.test(item[2]) && parseInt(item[2], 10) !== 1)) break
                const spaces = item[3]?.length ?? 0
                const indent = item[1].length + item[2].length + (spaces === 0 || spaces > 4 ? 1 : spaces)
                containers.push({ kind: "list", indent })
                body = body.slice(indent)
                paragraph = false
            }
            const opening = body.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
            if (opening && (opening[1][0] !== "`" || !opening[2].includes("`"))) {
                blocks.push({ start: offset, end: offset + line.length })
                fence = { character: opening[1][0], length: opening[1].length }
                paragraph = false
            } else if (/^ {4}/.test(body) && !paragraph) {
                blocks.push({ start: offset, end: offset + line.length })
            } else {
                paragraph = Boolean(body.trim())
                    && !/^ {0,3}#{1,6}(?:[ \t]|$)/.test(body)
                    && !/^ {0,3}<!--.*-->\s*$/.test(body)
                    && !/^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/.test(body)
            }
        }
        offset += line.length
    }

    const ranges: Range[] = []
    const addInlineRanges = (start: number, end: number) => {
        const text = content.slice(start, end)
        const ticks = [...text.matchAll(/`+/g)]
        for (let index = 0; index < ticks.length; index++) {
            const opening = ticks[index]
            const openingOffset = opening.index!
            const preceding = text.slice(0, openingOffset).match(/\\+$/)?.[0].length ?? 0
            if (preceding % 2 === 1) continue
            for (let close = index + 1; close < ticks.length; close++) {
                const closing = ticks[close]
                if (/\r?\n[ \t]*\r?\n/.test(text.slice(openingOffset, closing.index))) break
                if (closing[0].length === opening[0].length) {
                    ranges.push({ start: start + openingOffset, end: start + closing.index! + closing[0].length })
                    index = close
                    break
                }
            }
        }
    }

    let cursor = 0
    for (const block of blocks) {
        addInlineRanges(cursor, block.start)
        ranges.push(block)
        cursor = block.end
    }
    addInlineRanges(cursor, content.length)
    return ranges
}

export function defaultEditionForAudience(audience: ContentAudience): ContentEdition {
    return audience === "website" ? "reader" : "reference"
}

export function hasEditionMarkers(content: string): boolean {
    if (!/<!--\s*leetllm\s*:?\s*edition/i.test(content)) return false
    const ranges = codeRanges(content)
    let rangeIndex = 0
    for (const match of content.matchAll(/<!--\s*leetllm:\s*edition:(?:reader|reference):start\s*-->/g)) {
        const start = match.index!
        while (rangeIndex < ranges.length && ranges[rangeIndex].end <= start) rangeIndex++
        if (rangeIndex < ranges.length && ranges[rangeIndex].start <= start) continue
        return true
    }
    return false
}

/** Select annotated passages without rewriting any unannotated Markdown. */
export function filterContentForAudience(
    content: string,
    audience: ContentAudience,
    source = "<content>",
    edition: ContentEdition = defaultEditionForAudience(audience),
): string {
    requireAudience(audience)
    if (edition !== "reader" && edition !== "reference") throw new Error(`Unknown content edition: ${edition}`)
    if (!new RegExp(markerPrefix).test(content)) return content
    const ranges = codeRanges(content)
    const stack: AudienceFrame[] = []
    const result: string[] = []
    let cursor = 0
    let rangeIndex = 0
    const visible = () => stack.every(frame => frame.target === (frame.kind === "audience" ? audience : edition))
    function fail(line: number, message: string): never {
        throw new Error(`${source}:${line}: ${message}`)
    }

    // Use a fresh expression because callers can filter the same source concurrently.
    for (const match of content.matchAll(new RegExp(markerPrefix))) {
        const start = match.index!
        if (start < cursor) continue
        while (rangeIndex < ranges.length && ranges[rangeIndex].end <= start) rangeIndex++
        if (rangeIndex < ranges.length && ranges[rangeIndex].start <= start) continue

        const line = content.slice(0, start).split(/\r\n|\r|\n/).length
        const end = content.indexOf("-->", start + 4)
        if (end < 0) fail(line, "Unterminated audience marker")
        const parsed = content.slice(start, end + 3).match(marker)
        if (!parsed || (parsed[1] === "audience" ? !["book", "website"].includes(parsed[2]) : !["reader", "reference"].includes(parsed[2]))) {
            fail(line, parsed?.[1] === "edition"
                ? "Invalid edition marker; expected edition:reader:start/end or edition:reference:start/end"
                : "Invalid audience marker; expected audience:book:start/end or audience:website:start/end")
        }
        if (visible()) result.push(content.slice(cursor, start))

        const kind = parsed[1] as AudienceFrame["kind"]
        const target = parsed[2] as AudienceFrame["target"]
        if (parsed[3] === "start") {
            stack.push({ kind, target, line })
        } else {
            const opening = stack.at(-1)
            if (!opening) fail(line, `Unexpected ${kind}:${target}:end without a start marker`)
            if (opening.kind !== kind || opening.target !== target) {
                fail(line, `Mismatched ${kind}:${target}:end; ${opening.kind}:${opening.target}:start opened on line ${opening.line}`)
            }
            stack.pop()
        }
        cursor = end + 3
    }

    const opening = stack.at(-1)
    if (opening) fail(opening.line, `Unclosed ${opening.kind}:${opening.target}:start marker`)
    if (visible()) result.push(content.slice(cursor))
    return result.join("")
}
