import type { PlanAnswers } from "./learning-plan"
import { isPassingQuizScore } from "./mastery-quiz"

export const BOOKMARKS_STORAGE_KEY = "leetllm_bookmarked_lessons"
export const NOTES_STORAGE_KEY = "leetllm_lesson_notes"
export const QUIZ_HISTORY_STORAGE_KEY = "leetllm_quiz_attempt_history"
export const READ_ARTICLES_STORAGE_KEY = "leetllm_read_articles"
export const READ_PROGRESS_STORAGE_KEY = "leetllm_read_progress_v2"
export const STUDY_STATE_EVENT = "leetllm:study-state-changed"

const QUIZ_HISTORY_MIGRATION_KEY = "leetllm_quiz_history_migrated_v1"
const MASTERY_SCORE_KEY = "leetllm_mastery_quiz_scores"
const THEORY_SCORE_KEY = "leetllm_theory_quiz_scores"
const LEGACY_PROGRESS_TIMESTAMP = new Date(0).toISOString()
const QUIZ_HISTORY_LIMIT = 500

export type QuizKind = "mastery" | "theory" | "section"
type SyncedQuizKind = Exclude<QuizKind, "section">

export type StudyBookmark = {
    slug: string
    bookmarked: boolean
    updatedAt: string
}

export type StudyNote = {
    slug: string
    body: string
    updatedAt: string
    deleted: boolean
}

export type QuizAttempt = {
    id: string
    slug: string
    kind: QuizKind
    correct: number
    total: number
    score: number
    passed: boolean
    attemptedAt: string
}

export type ReadProgressItem = {
    slug: string
    completed: boolean
    updatedAt: string
}

export type SyncedLearningPlan = PlanAnswers & {
    trackSlug: string
    updatedAt: string
}

export type StudyState = {
    bookmarks: StudyBookmark[]
    notes: StudyNote[]
    quizAttempts: QuizAttempt[]
    plan: SyncedLearningPlan | null
}

export type StudyStateAction =
    | { action: "bookmark"; slug: string; bookmarked: boolean }
    | { action: "note"; slug: string; body: string }
    | { action: "plan"; answers: PlanAnswers }
    | { action: "quiz_attempt"; id: string; kind: SyncedQuizKind; slug: string; correct: number; total: number }

function readJson<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback
    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) as T : fallback
    } catch {
        return fallback
    }
}

function writeJson(key: string, value: unknown) {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event(STUDY_STATE_EVENT))
}

export function readLocalBookmarks(): StudyBookmark[] {
    return readJson<Array<StudyBookmark & { createdAt?: string }>>(BOOKMARKS_STORAGE_KEY, [])
        .filter((bookmark) => typeof bookmark?.slug === "string")
        .map((bookmark) => ({
            slug: bookmark.slug,
            bookmarked: bookmark.bookmarked ?? true,
            updatedAt: bookmark.updatedAt ?? bookmark.createdAt ?? new Date(0).toISOString(),
        }))
}

export function writeLocalBookmarks(bookmarks: StudyBookmark[]) {
    writeJson(BOOKMARKS_STORAGE_KEY, bookmarks)
}

export function readLocalNotes(): StudyNote[] {
    return readJson<StudyNote[]>(NOTES_STORAGE_KEY, []).filter(
        (note) => typeof note?.slug === "string" && typeof note?.body === "string" && typeof note?.updatedAt === "string"
    )
        .map((note) => ({ ...note, deleted: note.deleted ?? false }))
}

export function writeLocalNotes(notes: StudyNote[]) {
    writeJson(NOTES_STORAGE_KEY, notes)
}

export function readLocalReadProgress(): ReadProgressItem[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(READ_PROGRESS_STORAGE_KEY)
    if (stored !== null) {
        return readJson<ReadProgressItem[]>(READ_PROGRESS_STORAGE_KEY, []).filter(
            (item) =>
                typeof item?.slug === "string" &&
                typeof item?.completed === "boolean" &&
                typeof item?.updatedAt === "string"
        )
    }

    return readJson<unknown[]>(READ_ARTICLES_STORAGE_KEY, [])
        .filter((slug): slug is string => typeof slug === "string")
        .map((slug) => ({ slug, completed: true, updatedAt: LEGACY_PROGRESS_TIMESTAMP }))
}

export function writeLocalReadProgress(progress: ReadProgressItem[]) {
    writeJson(READ_PROGRESS_STORAGE_KEY, progress)
    localStorage.setItem(
        READ_ARTICLES_STORAGE_KEY,
        JSON.stringify(progress.filter((item) => item.completed).map((item) => item.slug))
    )
}

export function mergeReadProgress(remote: ReadProgressItem[], local: ReadProgressItem[]) {
    const bySlug = new Map<string, ReadProgressItem>()
    for (const item of [...local, ...remote]) {
        const current = bySlug.get(item.slug)
        if (!current || item.updatedAt > current.updatedAt) bySlug.set(item.slug, item)
    }
    return [...bySlug.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function shouldSyncReadProgress(local: ReadProgressItem, remote?: ReadProgressItem) {
    if (local.updatedAt === LEGACY_PROGRESS_TIMESTAMP) return false
    return !remote || local.updatedAt > remote.updatedAt
}

export function readLocalQuizHistory(): QuizAttempt[] {
    return readJson<QuizAttempt[]>(QUIZ_HISTORY_STORAGE_KEY, []).filter(
        (attempt) =>
            typeof attempt?.slug === "string" &&
            (attempt?.kind === "mastery" || attempt?.kind === "theory" || attempt?.kind === "section") &&
            Number.isFinite(attempt?.score) &&
            typeof attempt?.attemptedAt === "string"
    ).map((attempt) => ({ ...attempt, passed: isPassingQuizScore(attempt.score) }))
}

export function writeLocalQuizHistory(history: QuizAttempt[]) {
    writeJson(QUIZ_HISTORY_STORAGE_KEY, history.slice(0, QUIZ_HISTORY_LIMIT))
}

function createAttemptId() {
    return crypto.randomUUID()
}

export function recordLocalQuizAttempt(attempt: Omit<QuizAttempt, "id" | "score" | "passed" | "attemptedAt">): QuizAttempt {
    const score = attempt.total > 0 ? Math.round((attempt.correct / attempt.total) * 100) : 0
    const history = readLocalQuizHistory()
    const storedAttempt = {
        id: createAttemptId(),
        ...attempt,
        score,
        passed: attempt.total > 0 && isPassingQuizScore(score),
        attemptedAt: new Date().toISOString(),
    }
    history.unshift(storedAttempt)
    writeLocalQuizHistory(history)
    return storedAttempt
}

export function removeLocalQuizAttempt(id: string) {
    writeLocalQuizHistory(readLocalQuizHistory().filter((attempt) => attempt.id !== id))
}

type LegacyQuizResult = {
    correct?: unknown
    total?: unknown
}

export function migrateLegacyQuizResults() {
    if (typeof window === "undefined" || localStorage.getItem(QUIZ_HISTORY_MIGRATION_KEY)) return

    const migratedAt = new Date().toISOString()
    const history = readLocalQuizHistory()
    const existing = new Set(history.map((attempt) => `${attempt.kind}:${attempt.slug}`))
    const migrated: QuizAttempt[] = []

    for (const [kind, key] of [["mastery", MASTERY_SCORE_KEY], ["theory", THEORY_SCORE_KEY]] as const) {
        const results = readJson<Record<string, LegacyQuizResult>>(key, {})
        for (const [slug, result] of Object.entries(results)) {
            if (
                existing.has(`${kind}:${slug}`) ||
                !Number.isInteger(result.correct) ||
                !Number.isInteger(result.total) ||
                typeof result.correct !== "number" ||
                typeof result.total !== "number" ||
                result.correct < 0 ||
                result.total <= 0 ||
                result.correct > result.total
            ) continue

            const score = Math.round((result.correct / result.total) * 100)
            migrated.push({
                id: createAttemptId(),
                kind,
                slug,
                correct: result.correct,
                total: result.total,
                score,
                passed: isPassingQuizScore(score),
                attemptedAt: migratedAt,
            })
        }
    }

    if (migrated.length > 0) writeLocalQuizHistory([...migrated, ...history])
    localStorage.setItem(QUIZ_HISTORY_MIGRATION_KEY, migratedAt)
}

export function syncStudyAction(action: StudyStateAction): Promise<void> {
    return fetch("/api/study-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
    }).then((response) => {
        if (!response.ok) {
            throw new Error(`Study state sync failed: ${response.status}`)
        }
    })
}
