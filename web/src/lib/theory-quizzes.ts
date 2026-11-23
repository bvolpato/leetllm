import quizData from "@/data/theory-quizzes.json"

export type TheoryQuizLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert"

export interface TheoryQuizQuestion {
    section: string
    question: string
    options: string[]
    answer: string
    explanation: string
}

export interface TheoryQuiz {
    slug: string
    title: string
    level: TheoryQuizLevel
    description: string
    estimatedMinutes: number
    sections: string[]
    questions: TheoryQuizQuestion[]
}

export interface TheoryQuizListItem {
    slug: string
    title: string
    level: TheoryQuizLevel
    description: string
    estimatedMinutes: number
    sections: string[]
    questionCount: number
}

const levels: TheoryQuizLevel[] = ["Beginner", "Intermediate", "Advanced", "Expert"]

function assertString(value: unknown, field: string): asserts value is string {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Theory quiz needs non-empty ${field}`)
    }
}

function assertStringArray(value: unknown, field: string): asserts value is string[] {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim())) {
        throw new Error(`Theory quiz needs non-empty string[] ${field}`)
    }
}

function validateQuestion(raw: unknown, quizSlug: string, index: number): TheoryQuizQuestion {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        throw new Error(`${quizSlug}: question ${index + 1} must be an object`)
    }

    const question = raw as Record<string, unknown>
    assertString(question.section, `${quizSlug}.questions[${index}].section`)
    assertString(question.question, `${quizSlug}.questions[${index}].question`)
    assertString(question.answer, `${quizSlug}.questions[${index}].answer`)
    assertString(question.explanation, `${quizSlug}.questions[${index}].explanation`)

    if (!Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error(`${quizSlug}: question ${index + 1} needs exactly 4 options`)
    }

    const options = question.options.map((option, optionIndex) => {
        assertString(option, `${quizSlug}.questions[${index}].options[${optionIndex}]`)
        return option.trim()
    })

    if (new Set(options).size !== options.length) {
        throw new Error(`${quizSlug}: question ${index + 1} has duplicate options`)
    }

    const answer = question.answer.trim()
    if (!options.includes(answer)) {
        throw new Error(`${quizSlug}: question ${index + 1} answer must match one option`)
    }

    return {
        section: question.section.trim(),
        question: question.question.trim(),
        options,
        answer,
        explanation: question.explanation.trim(),
    }
}

function validateQuiz(raw: unknown): TheoryQuiz {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        throw new Error("Theory quiz must be an object")
    }

    const quiz = raw as Record<string, unknown>
    assertString(quiz.slug, "slug")
    const slug = quiz.slug.trim()
    assertString(quiz.title, `${slug}.title`)
    assertString(quiz.description, `${slug}.description`)
    assertStringArray(quiz.sections, `${slug}.sections`)

    if (!levels.includes(quiz.level as TheoryQuizLevel)) {
        throw new Error(`${slug}: level must be one of ${levels.join(", ")}`)
    }
    if (typeof quiz.estimatedMinutes !== "number" || !Number.isFinite(quiz.estimatedMinutes) || quiz.estimatedMinutes <= 0) {
        throw new Error(`${slug}: estimatedMinutes must be a positive number`)
    }
    if (!Array.isArray(quiz.questions) || quiz.questions.length < 8) {
        throw new Error(`${slug}: questions must contain at least 8 items`)
    }

    const questions = quiz.questions.map((question, index) => validateQuestion(question, slug, index))
    const promptSet = new Set(questions.map((question) => question.question))
    if (promptSet.size !== questions.length) {
        throw new Error(`${slug}: duplicate question prompt`)
    }

    return {
        slug,
        title: quiz.title.trim(),
        level: quiz.level as TheoryQuizLevel,
        description: quiz.description.trim(),
        estimatedMinutes: quiz.estimatedMinutes,
        sections: quiz.sections.map((section) => section.trim()),
        questions,
    }
}

const theoryQuizzes = (quizData as unknown[]).map(validateQuiz)
const quizBySlug = new Map(theoryQuizzes.map((quiz) => [quiz.slug, quiz]))

export function getTheoryQuizzes(): TheoryQuiz[] {
    return theoryQuizzes
}

export function getTheoryQuiz(slug: string): TheoryQuiz | null {
    if (!/^[a-z0-9-]+$/.test(slug)) return null
    return quizBySlug.get(slug) ?? null
}

export function getTheoryQuizListItems(): TheoryQuizListItem[] {
    return theoryQuizzes.map((quiz) => ({
        slug: quiz.slug,
        title: quiz.title,
        level: quiz.level,
        description: quiz.description,
        estimatedMinutes: quiz.estimatedMinutes,
        sections: quiz.sections,
        questionCount: quiz.questions.length,
    }))
}

export function getTheoryQuizLevels(): TheoryQuizLevel[] {
    return levels
}
