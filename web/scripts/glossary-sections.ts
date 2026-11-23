export type GlossarySectionParseResult = {
    definition: string
    sections: Map<string, string>
}

type Fence = {
    marker: "`" | "~"
    length: number
}

export function parseGlossarySections(markdown: string): GlossarySectionParseResult {
    const body = markdown.replace(/\r\n?/g, "\n")
    const headingMatches: { index: number; length: number; title: string }[] = []
    const lines = body.split("\n")
    let offset = 0
    let fence: Fence | undefined

    for (const line of lines) {
        const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
        if (fenceMatch) {
            const marker = fenceMatch[1][0] as Fence["marker"]
            if (!fence) {
                fence = { marker, length: fenceMatch[1].length }
            } else if (
                marker === fence.marker &&
                fenceMatch[1].length >= fence.length &&
                !fenceMatch[2].trim()
            ) {
                fence = undefined
            }
        } else if (!fence) {
            const headingMatch = line.match(/^##\s+(.+)$/)
            if (headingMatch) {
                headingMatches.push({
                    index: offset,
                    length: line.length,
                    title: headingMatch[1].trim(),
                })
            }
        }

        offset += line.length + 1
    }

    const firstHeadingIndex = headingMatches[0]?.index ?? -1
    const definition = (firstHeadingIndex === -1 ? body : body.slice(0, firstHeadingIndex)).trim()
    const sections = new Map<string, string>()

    for (let index = 0; index < headingMatches.length; index += 1) {
        const heading = headingMatches[index]
        const start = heading.index + heading.length
        const end = headingMatches[index + 1]?.index ?? body.length
        sections.set(heading.title, body.slice(start, end).trim())
    }

    return { definition, sections }
}
