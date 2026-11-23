export function normalizePracticeGuideText(value: string): string {
    return value
        .replace(/\r\n?/g, "\n")
        .trim()
        .replace(/(```[^\n]*\n)(?:[ \t]*\n)+/g, "$1")
        .replace(/\n(?:[ \t]*\n)+```/g, "\n```")
        .replace(/\n(?:[ \t]*\n){2,}/g, "\n\n")
        .replace(/((?:(?:from [^\n]+ import [^\n]+|import [^\n;]+|import [^\n]+;)\n)+)\n+(?=(?:def |class |@))/g, "$1")
}
