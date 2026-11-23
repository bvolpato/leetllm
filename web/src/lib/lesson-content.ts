import { extractMasteryQuiz } from "./mastery-quiz"

export interface NextCallout {
    title: string
    href: string
    description: string
}

export function extractNextCallout(content: string): {
    content: string
    callout: NextCallout | null
} {
    const pattern = /^>[ \t]*\*\*Next:\*\*([^\n]*?)\[([^\]\n]+)\]\((\/learn\/[^)\s]+)\)([^\n]*)$/gmi
    let match: RegExpExecArray | null
    let lastMatch: RegExpExecArray | null = null

    while ((match = pattern.exec(content)) !== null) {
        lastMatch = match
    }

    if (!lastMatch) {
        return { content, callout: null }
    }

    const [fullMatch, prefix, title, href, suffix] = lastMatch
    const introduction = prefix.trim()
    const description = introduction && !/^Continue to$/i.test(introduction)
        ? `${introduction} ${title}${suffix}`.trim()
        : suffix.replace(/^[ \t]*\.[ \t]*/, "").trim()
    let before = content.slice(0, lastMatch.index).trimEnd()
    const after = content.slice(lastMatch.index + fullMatch.length).trimStart()
    const previousParagraphStart = before.lastIndexOf("\n\n")
    const previousParagraph = before
        .slice(previousParagraphStart >= 0 ? previousParagraphStart + 2 : 0)
        .trim()

    if (/^(?:.+\.\s+)?Next, continue to \[[^\]]+\]\(\/learn\/[^)]+\)\. .+$/i.test(previousParagraph)) {
        before = previousParagraphStart >= 0
            ? before.slice(0, previousParagraphStart).trimEnd()
            : ""
    }

    return {
        content: [before, after].filter(Boolean).join("\n\n"),
        callout: { title, href, description },
    }
}

export function extractLessonBody(content: string) {
    const withoutNext = extractNextCallout(content)
    const withoutQuiz = extractMasteryQuiz(withoutNext.content)

    return {
        content: withoutQuiz.content,
        masteryQuestions: withoutQuiz.questions,
        nextCallout: withoutNext.callout,
    }
}
