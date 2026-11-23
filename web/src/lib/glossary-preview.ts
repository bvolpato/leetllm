export function getGlossaryPreviewMarkdown(content: string): string {
    return content
        .trim()
        .split(/\n{2,}/)
        .find((block) => block.trim().length > 0)
        ?.trim() ?? content.trim()
}

export function glossaryPreviewStartsWithTitle(content: string, title: string): boolean {
    const preview = getGlossaryPreviewMarkdown(content)
    const undecoratedStart = preview
        .trimStart()
        .replace(/^#{1,6}\s+/, "")
        .replace(/^(?:\*\*|__|\*|_|~~|`+)/, "")
    const normalizedTitle = title.trim().toLowerCase()
    const normalizedStart = undecoratedStart.toLowerCase()

    if (!normalizedStart.startsWith(normalizedTitle)) return false

    const nextCharacter = undecoratedStart.charAt(title.trim().length)
    return nextCharacter === "" || !/[\p{L}\p{N}]/u.test(nextCharacter)
}
