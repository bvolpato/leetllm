import {
    buildLearningPlan,
    experienceLevelOptions,
    learnerGoalOptions,
    goalMilestones,
    weeklyHourOptions,
    type LearningPlan,
    type LearningPlanCatalog,
    type PlanAnswers,
    type PlanTrack,
} from "./learning-plan"
import { extractMasteryQuiz, type MasteryQuizQuestion } from "./mastery-quiz"
import { getPracticeProblems, toPracticeListItem } from "./practice"
import { getQuestionBySlug, getQuestions, type Question } from "./questions"
import { buildSectionCheckQuestions } from "./section-check"
import { getTheoryQuizListItems } from "./theory-quizzes"
import { resolveTrackLessons, learningTracks } from "./tracks"

const MAX_CACHED_LEARNING_PLANS =
    learnerGoalOptions.length * experienceLevelOptions.length * weeklyHourOptions.length
const learningPlanCache = new Map<string, LearningPlan>()
const masteryQuizCache = new Map<string, MasteryQuizQuestion[]>()
let learningPlanInputsCache: {
    tracks: PlanTrack[]
    catalog: LearningPlanCatalog
} | null = null

export function getLearningPlanTracks(questions: Question[] = getQuestions()): PlanTrack[] {
    return learningTracks.map((track) => {
        const { lessons, excludedLessonSlugs } = resolveTrackLessons(track, questions)
        const excluded = new Set(excludedLessonSlugs)
        const goal = learnerGoalOptions.find(option => option.trackSlug === track.slug)
        const omittedMilestoneIndices = goal
            ? goalMilestones[goal.value].flatMap((milestone, index) => excluded.has(milestone.unlockAfterLessonSlug) ? [index] : [])
            : []
        return {
            slug: track.slug,
            title: track.title,
            description: track.description,
            outcome: track.outcome,
            lessons,
            ...(omittedMilestoneIndices.length ? { omittedMilestoneIndices } : {}),
        }
    })
}

export function getLearningPlanCatalog(): LearningPlanCatalog {
    return {
        practiceProblems: getPracticeProblems().map(toPracticeListItem).map((problem) => ({
            slug: problem.slug,
            title: problem.title,
            summary: problem.summary,
            difficulty: problem.difficulty,
            timeEstimateMinutes: problem.timeEstimateMinutes,
        })),
        theoryQuizzes: getTheoryQuizListItems().map((quiz) => ({
            slug: quiz.slug,
            title: quiz.title,
            description: quiz.description,
            level: quiz.level,
            estimatedMinutes: quiz.estimatedMinutes,
        })),
    }
}

function getLearningPlan(answers: PlanAnswers, questions?: Question[]): LearningPlan {
    if (process.env.NODE_ENV === "development") {
        return buildLearningPlan(getLearningPlanTracks(questions), answers, getLearningPlanCatalog())
    }

    const cacheKey = `${answers.goal}:${answers.level}:${answers.weeklyHours}`
    const cachedPlan = learningPlanCache.get(cacheKey)
    if (cachedPlan) return cachedPlan

    const inputs = learningPlanInputsCache ??= {
        tracks: getLearningPlanTracks(),
        catalog: getLearningPlanCatalog(),
    }
    const plan = buildLearningPlan(inputs.tracks, { ...answers }, inputs.catalog)
    if (learningPlanCache.size >= MAX_CACHED_LEARNING_PLANS) {
        const oldestCacheKey = learningPlanCache.keys().next().value
        if (oldestCacheKey !== undefined) learningPlanCache.delete(oldestCacheKey)
    }
    learningPlanCache.set(cacheKey, plan)
    return plan
}

export function getSectionCheck(answers: PlanAnswers, weekNumber: number) {
    // Reuse one fresh development snapshot for both the plan and its lesson quizzes.
    const questions = process.env.NODE_ENV === "development" ? getQuestions() : undefined
    const plan = getLearningPlan(answers, questions)
    const week = plan.weeks.find((candidate) => candidate.number === weekNumber)
    if (!week) return null

    const lessons = week.lessons.map((lesson) => {
        const question = questions
            ? questions.find((candidate) => candidate.slug === lesson.slug || candidate.aliases?.includes(lesson.slug))
            : getQuestionBySlug(lesson.slug)
        if (!question) throw new Error(`Missing section-check lesson: ${lesson.slug}`)
        const shouldCacheMastery = process.env.NODE_ENV !== "development"
        const mastery = (shouldCacheMastery ? masteryQuizCache.get(lesson.slug) : undefined)
            ?? extractMasteryQuiz(question.content).questions
        if (!mastery) throw new Error(`Missing section-check questions: ${lesson.slug}`)
        if (shouldCacheMastery) masteryQuizCache.set(lesson.slug, mastery)
        return { slug: lesson.slug, title: lesson.title, questions: mastery }
    })
    const activity = week.activities.find((candidate) => candidate.kind === "section")
    if (!activity?.quizSlug) throw new Error(`Missing section-check activity: week ${weekNumber}`)

    return {
        plan,
        week,
        slug: activity.quizSlug,
        questions: buildSectionCheckQuestions(lessons),
    }
}
