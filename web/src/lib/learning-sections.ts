export interface ContentFollowUpQuestion {
    question: string
    answer: string
}

export interface ContentLearningSections {
    rubricPoints: string[]
    followUpQuestions: ContentFollowUpQuestion[]
    commonPitfalls: string[]
}

const MASTERY_START = "<!-- leetllm: mastery:start -->"
const MASTERY_END = "<!-- leetllm: mastery:end -->"
const RUBRIC_TITLES = [
    "before you continue",
    "evaluation rubric",
    "final design checklist",
    "practice goals",
    "skill levels to aim for",
    "skills to defend in review",
    "tie the ideas together",
    "what strong answers show",
    "what you should be able to defend",
    "what a good answer can defend",
]
const FOLLOW_UP_TITLES = [
    "follow-up questions",
    "practice checkpoints",
    "review questions",
    "practice questions with answer sketches",
    "common design scenarios",
]
const COMMON_PITFALL_PREFIXES = ["common pitfalls", "common design failures"]
const FOLLOW_UP_PREFIXES = ["self-check", "production questions to answer"]

function isRubricTitle(title: string): boolean {
    return RUBRIC_TITLES.includes(title)
        || /^what\b.*\bdefend\b/.test(title)
        || title === "mastery checklist"
        || title === "what to check before moving on"
        || title === "what you should know before moving on"
}

function isCommonPitfallTitle(title: string): boolean {
    if (COMMON_PITFALL_PREFIXES.some((prefix) => title.startsWith(prefix))) return true

    return (
        /^common\b.*\b(mistakes?|misconceptions?|pitfalls?|failures?|failure modes?|gotchas?)\b/.test(title)
        || /^common ways\b.*\blie\b/.test(title)
        || /^(?:mistakes?|pitfalls?)\b/.test(title)
        || /\bfailure modes?\b/.test(title)
        || /\bfailure patterns?\b/.test(title)
        || /^debugging common failures\b/.test(title)
        || /^when\b.*\b(?:backfires?|breaks?(?: down)?|fails?|misleads?)\b/.test(title)
        || /mistakes? that break/.test(title)
        || /mistakes? you'll actually make/.test(title)
        || /hidden production mistakes/.test(title)
        || /\bpitfalls\b/.test(title)
    )
}

function masteryRegion(markdown: string): string {
    const start = markdown.indexOf(MASTERY_START)
    if (start === -1) return ""

    const contentStart = start + MASTERY_START.length
    const end = markdown.indexOf(MASTERY_END, contentStart)
    return (end === -1 ? markdown.slice(contentStart) : markdown.slice(contentStart, end)).trim()
}

function normalizeTitle(title: string): string {
    return title.trim().toLowerCase()
}

function listItems(markdown: string): string[] {
    return markdown
        .split("\n")
        .map((line) => line.match(/^\s*(?:[-*]|\d+\.)\s+(.+?)\s*$/)?.[1] ?? "")
        .filter(Boolean)
        .map((item) => item.replace(/^\*\*([^*]+):\*\*\s*/, "$1: "))
}

type MarkdownTable = {
    headers: string[]
    rows: string[][]
}

function markdownTables(markdown: string): MarkdownTable[] {
    const lines = markdown.split("\n").map((line) => line.trim())
    const tables: MarkdownTable[] = []

    for (let index = 0; index < lines.length; index += 1) {
        const header = lines[index]
        const separator = lines[index + 1] ?? ""
        if (!header.startsWith("|") || !header.endsWith("|")) continue
        if (!separator.startsWith("|") || !separator.endsWith("|")) continue
        if (!/\|[\s:-]+\|/.test(separator)) continue

        const headers = header
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim())
            .filter(Boolean)
        const rows: string[][] = []

        for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
            const row = lines[rowIndex]
            if (!row.startsWith("|") || !row.endsWith("|")) break

            const cells = row
                .split("|")
                .slice(1, -1)
                .map((cell) => cell.trim())

            if (cells.some((cell) => cell.length > 0)) {
                rows.push(cells)
            }
        }

        tables.push({ headers, rows })
        index += rows.length + 1
    }

    return tables
}

function headingSections(markdown: string, predicate: (title: string) => boolean): string[] {
    const headingRegex = /^(#{2,4})\s+(.+?)\s*$/gm
    const matches = [...markdown.matchAll(headingRegex)]
    const sections: string[] = []

    for (let i = 0; i < matches.length; i += 1) {
        const match = matches[i]
        const rawTitle = match[2]
        if (!rawTitle || !predicate(normalizeTitle(rawTitle))) continue

        const start = (match.index ?? 0) + match[0].length
        const level = match[1]?.length ?? 2
        let end = markdown.length

        for (let nextIndex = i + 1; nextIndex < matches.length; nextIndex += 1) {
            const next = matches[nextIndex]
            const nextLevel = next[1]?.length ?? 2
            if (nextLevel <= level) {
                end = next.index ?? markdown.length
                break
            }
        }

        sections.push(markdown.slice(start, end).trim())
    }

    return sections
}

function rubricTableItems(markdown: string): string[] {
    return markdownTables(markdown)
        .flatMap((table) =>
            table.rows.flatMap((cells) => {
                const compactCells = cells.filter(Boolean)
                if (compactCells.length < 2) return []
                return [`${compactCells[0]}: ${compactCells[compactCells.length - 1]}`]
            })
        )
}

function rubricItems(markdown: string): string[] {
    const table = rubricTableItems(markdown)
    if (table.length > 0) return table
    return listItems(markdown)
}

function checkpointQuestions(markdown: string): ContentFollowUpQuestion[] {
    const questions: ContentFollowUpQuestion[] = []
    const checkpointRegex = /```checkpoint\s*\n([\s\S]*?)\n---+\n([\s\S]*?)\n```/g
    let match: RegExpExecArray | null

    while ((match = checkpointRegex.exec(markdown)) !== null) {
        const question = match[1]?.trim()
        const answer = match[2]?.trim()
        if (question && answer) questions.push({ question, answer })
    }

    return questions
}

function masteryQuizPitfalls(markdown: string): string[] {
    const match = markdown.match(/```mastery-quiz\s*\n([\s\S]*?)\n```/)
    if (!match?.[1]) return []

    try {
        const questions = JSON.parse(match[1]) as Array<{
            options?: string[]
            answer?: string
        }>
        const question = questions.find((item) =>
            item.options?.some((option) => option !== item.answer),
        )
        const misconception = question?.options?.find((option) => option !== question.answer)
        if (!misconception || !question?.answer) return []

        return [`Mistake: ${misconception} Correction: ${question.answer}`]
    } catch {
        return []
    }
}

function masteryQuizQuestions(markdown: string): ContentFollowUpQuestion[] {
    const match = markdown.match(/```mastery-quiz\s*\n([\s\S]*?)\n```/)
    if (!match?.[1]) return []

    try {
        const questions = JSON.parse(match[1]) as Array<{
            question?: string
            answer?: string
            explanation?: string
        }>
        return questions
            .filter((item): item is { question: string; answer: string; explanation?: string } =>
                Boolean(item.question && item.answer)
            )
            .map((item) => ({
                question: item.question,
                answer: item.explanation || item.answer,
            }))
    } catch {
        return []
    }
}

function detailsQuestions(markdown: string): ContentFollowUpQuestion[] {
    const questions: ContentFollowUpQuestion[] = []
    const detailsRegex = /<details>\s*<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/g
    let match: RegExpExecArray | null

    while ((match = detailsRegex.exec(markdown)) !== null) {
        const question = match[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        const answer = match[2]?.replace(/<[^>]+>/g, " ").replace(/\s+\n/g, "\n").trim()
        if (question && answer) questions.push({ question, answer })
    }

    return questions
}

function headingQuestions(markdown: string): ContentFollowUpQuestion[] {
    const headingRegex = /^(#{3,4})\s+(.+?)\s*$/gm
    const matches = [...markdown.matchAll(headingRegex)]
    const questions: ContentFollowUpQuestion[] = []

    for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index]
        const question = match[2]?.trim()
        if (!question) continue

        const start = (match.index ?? 0) + match[0].length
        const level = match[1]?.length ?? 3
        let end = markdown.length

        for (let nextIndex = index + 1; nextIndex < matches.length; nextIndex += 1) {
            const next = matches[nextIndex]
            const nextLevel = next[1]?.length ?? 3
            if (nextLevel <= level) {
                end = next.index ?? markdown.length
                break
            }
        }

        const answer = markdown.slice(start, end).trim()
        if (answer) questions.push({ question, answer })
    }

    return questions
}

function uniqueQuestions(questions: ContentFollowUpQuestion[]): ContentFollowUpQuestion[] {
    const seen = new Set<string>()
    const unique: ContentFollowUpQuestion[] = []

    for (const question of questions) {
        const key = `${question.question}\n${question.answer}`
        if (seen.has(key)) continue
        seen.add(key)
        unique.push(question)
    }

    return unique
}

function symptomPitfalls(markdown: string): string[] {
    const items: string[] = []
    const symptomRegex = /\*\*Symptom:\*\*\s*(.+?)\n\*\*Cause:\*\*\s*(.+?)\n\*\*Fix:\*\*\s*(.+?)(?:\n|$)/g
    let match: RegExpExecArray | null

    while ((match = symptomRegex.exec(markdown)) !== null) {
        const symptom = match[1]?.trim()
        const cause = match[2]?.trim()
        const fix = match[3]?.trim()
        if (symptom && cause && fix) {
            items.push(`Symptom: ${symptom} Cause: ${cause} Fix: ${fix}`)
        }
    }

    return items
}

function inlineCommonMistakes(markdown: string): string[] {
    const match = markdown.match(/Common mistakes[^:\n]*:\s*([\s\S]*?)(?:\n\n|$)/i)
    if (!match?.[1]) return []

    return match[1]
        .trim()
        .replace(/\.$/, "")
        .split(/,\s+(?=[a-z`])/i)
        .map((item) => item.replace(/^and\s+/i, "").trim())
        .filter(Boolean)
}

function tablePitfalls(markdown: string): string[] {
    return markdownTables(markdown)
        .flatMap((table) =>
            table.rows.flatMap((cells) => {
                const paired = table.headers
                    .map((header, index) => [header.trim(), cells[index]?.trim() ?? ""] as const)
                    .filter(([, value]) => value)
                if (paired.length === 0) return []
                return [paired.map(([header, value]) => `${header}: ${value}`).join(" ")]
            })
        )
}

function headingPitfalls(markdown: string): string[] {
    const headingRegex = /^(#{3,4})\s+(.+?)\s*$/gm
    const matches = [...markdown.matchAll(headingRegex)]
    return matches
        .map((match) => match[2]?.trim() ?? "")
        .filter(Boolean)
}

function commonPitfallItems(markdown: string): string[] {
    const list = listItems(markdown)
    if (list.length > 0) return list

    const table = tablePitfalls(markdown)
    if (table.length > 0) return table

    const symptoms = symptomPitfalls(markdown)
    if (symptoms.length > 0) return symptoms

    const headings = headingPitfalls(markdown)
    if (headings.length > 0) return headings

    return inlineCommonMistakes(markdown)
}

export function parseLearningSections(markdown: string): ContentLearningSections {
    const region = masteryRegion(markdown) || markdown
    const rubricSections = headingSections(region, isRubricTitle)
    const followUpSections = headingSections(
        region,
        (title) => FOLLOW_UP_TITLES.includes(title) || FOLLOW_UP_PREFIXES.some((prefix) => title.startsWith(prefix)),
    )
    const commonPitfallSections = headingSections(
        region,
        isCommonPitfallTitle,
    )

    let rubricPoints = rubricSections.flatMap((section) => rubricItems(section))
    let followUpQuestions = uniqueQuestions(
        followUpSections.flatMap((section) => [
            ...checkpointQuestions(section),
            ...detailsQuestions(section),
            ...headingQuestions(section),
        ]),
    )
    const commonPitfalls = commonPitfallSections.flatMap((section) => commonPitfallItems(section))

    if (followUpQuestions.length === 0) {
        const fallbackCheckpoints = checkpointQuestions(markdown)
        if (fallbackCheckpoints.length > 0) {
            followUpQuestions = fallbackCheckpoints.slice(-Math.min(fallbackCheckpoints.length, 5))
        } else {
            const fallbackMastery = masteryQuizQuestions(markdown)
            if (fallbackMastery.length > 0) {
                followUpQuestions = fallbackMastery.slice(-Math.min(fallbackMastery.length, 5))
            }
        }
    }

    if (rubricPoints.length === 0 && followUpQuestions.length > 0) {
        rubricPoints = followUpQuestions.map(({ question }) => question)
    }

    if (commonPitfalls.length === 0) {
        for (const section of rubricSections) {
            const inlinePitfalls = inlineCommonMistakes(section)
            if (inlinePitfalls.length > 0) {
                commonPitfalls.push(...inlinePitfalls)
                break
            }
        }
    }

    if (commonPitfalls.length === 0) {
        commonPitfalls.push(...masteryQuizPitfalls(markdown))
    }

    return {
        rubricPoints,
        followUpQuestions,
        commonPitfalls,
    }
}
