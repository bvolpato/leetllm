export const MIN_MASTERY_QUIZ_QUESTIONS = 3
export const MAX_MASTERY_QUIZ_QUESTIONS = 10
export const QUIZ_PASS_PERCENT = 75
export const MASTERY_PASS_PERCENT = QUIZ_PASS_PERCENT

export interface MasteryQuizQuestion {
    question: string
    options: string[]
    answer: string
    explanation: string
}

export interface ExtractedMasteryQuiz {
    content: string
    questions: MasteryQuizQuestion[] | null
}

const MASTERY_QUIZ_FENCE = /^```mastery-quiz\s*\n([\s\S]*?)\n```[ \t]*$/gm

function assertNonEmptyString(value: unknown, field: string, questionIndex: number): asserts value is string {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Mastery quiz question ${questionIndex + 1} needs a non-empty ${field}`)
    }
}

export function validateMasteryQuizQuestions(value: unknown): MasteryQuizQuestion[] {
    if (!Array.isArray(value)) {
        throw new Error("Mastery quiz block must contain a JSON array")
    }
    if (value.length < MIN_MASTERY_QUIZ_QUESTIONS) {
        throw new Error(`Mastery quiz needs at least ${MIN_MASTERY_QUIZ_QUESTIONS} questions`)
    }
    if (value.length > MAX_MASTERY_QUIZ_QUESTIONS) {
        throw new Error(`Mastery quiz allows at most ${MAX_MASTERY_QUIZ_QUESTIONS} questions`)
    }

    return value.map((rawQuestion, questionIndex) => {
        if (!rawQuestion || typeof rawQuestion !== "object" || Array.isArray(rawQuestion)) {
            throw new Error(`Mastery quiz question ${questionIndex + 1} must be an object`)
        }

        const question = rawQuestion as Record<string, unknown>
        assertNonEmptyString(question.question, "question", questionIndex)
        assertNonEmptyString(question.answer, "answer", questionIndex)
        assertNonEmptyString(question.explanation, "explanation", questionIndex)

        if (!Array.isArray(question.options) || question.options.length !== 4) {
            throw new Error(`Mastery quiz question ${questionIndex + 1} needs exactly 4 options`)
        }

        const options = question.options.map((option, optionIndex) => {
            assertNonEmptyString(option, `option ${optionIndex + 1}`, questionIndex)
            return option.trim()
        })
        if (new Set(options).size !== options.length) {
            throw new Error(`Mastery quiz question ${questionIndex + 1} has duplicate options`)
        }

        const answer = question.answer.trim()
        if (!options.includes(answer)) {
            throw new Error(`Mastery quiz question ${questionIndex + 1} answer must exactly match one option`)
        }

        return {
            question: question.question.trim(),
            options,
            answer,
            explanation: question.explanation.trim(),
        }
    })
}

export function extractMasteryQuiz(markdown: string): ExtractedMasteryQuiz {
    const matches = [...markdown.matchAll(MASTERY_QUIZ_FENCE)]
    if (matches.length === 0) {
        return { content: markdown, questions: null }
    }
    if (matches.length > 1) {
        throw new Error("Article content must contain exactly one mastery-quiz block")
    }

    const match = matches[0]
    const json = match[1]
    const matchIndex = match.index ?? 0
    let parsed: unknown

    try {
        parsed = JSON.parse(json)
    } catch (error) {
        throw new Error(`Mastery quiz block contains invalid JSON: ${error}`)
    }

    const before = markdown.slice(0, matchIndex).trimEnd()
    const after = markdown.slice(matchIndex + match[0].length).trimStart()

    return {
        content: [before, after].filter(Boolean).join("\n\n"),
        questions: validateMasteryQuizQuestions(parsed),
    }
}

export function masteryScorePercent(correct: number, total: number): number {
    if (total <= 0) return 0
    return Math.round((correct / total) * 100)
}

export function isPassingQuizScore(score: number): boolean {
    return score >= QUIZ_PASS_PERCENT
}

export function isPassingMasteryScore(correct: number, total: number): boolean {
    if (total <= 0) return false
    return isPassingQuizScore(masteryScorePercent(correct, total))
}
