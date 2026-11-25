import { describe, expect, test, vi } from "vitest"
import {
    experienceLevelOptions,
    learnerGoalOptions,
    MIN_PLAN_LESSONS_PER_WEEK,
    weeklyHourOptions,
    buildLearningPlan,
    goalMilestones,
} from "./learning-plan"
import { getSectionCheck, getLearningPlanTracks, getLearningPlanCatalog } from "./learning-plan-server"
import { SECTION_CHECK_QUESTION_COUNT } from "./section-check"
import * as questionLoader from "./questions"
import { getTracks } from "./tracks"

describe("weekly checks across every learning plan", () => {
    test("omits an excluded milestone prerequisite and its milestone without changing the remaining IDs", () => {
        const slug = "calculus-gradients-backpropagation-optimization"
        const snapshot = questionLoader.getQuestions().map(question => question.slug === slug
            ? { ...question, visibility: { website: false } }
            : question)
        const tracks = getLearningPlanTracks(snapshot)
        const plan = buildLearningPlan(tracks, { goal: "foundations", level: "new", weeklyHours: 4 }, getLearningPlanCatalog())
        const milestones = plan.weeks.flatMap(week => week.activities).filter(activity => activity.kind === "milestone")
        expect(milestones.map(activity => activity.id)).toEqual([
            "milestone:ai-engineer-foundations:2", "milestone:ai-engineer-foundations:3", "milestone:ai-engineer-foundations:4",
        ])
        expect(milestones.map(activity => activity.title)).not.toContain(goalMilestones.foundations[0].title)
        expect(JSON.stringify(plan)).not.toContain(slug)

        const unexplained = getLearningPlanTracks().map(track => ({ ...track, lessons: track.lessons.filter(lesson => lesson.slug !== slug) }))
        expect(() => buildLearningPlan(unexplained, { goal: "foundations", level: "new", weeklyHours: 4 }, getLearningPlanCatalog()))
            .toThrow(/Missing milestone prerequisite/)
    })

    test("returns finite empty plans when all configured lessons are intentionally unavailable", () => {
        const snapshot = questionLoader.getQuestions().map(question => ({ ...question, visibility: { website: false } }))
        const tracks = getLearningPlanTracks(snapshot)
        expect(getTracks(snapshot).every(track => track.lessonSlugs.length === 0 && track.timeEstimate === "0 lessons")).toBe(true)
        for (const goal of learnerGoalOptions) {
            const plan = buildLearningPlan(tracks, { goal: goal.value, level: "new", weeklyHours: 4 }, getLearningPlanCatalog())
            expect(plan.weeks).toEqual([])
            expect(plan.totalLessonMinutes).toBe(0)
            expect(plan.totalActivityMinutes).toBe(0)
            expect(plan.practiceMinutesPerWeek).toBe(0)
        }
        const unexplained = getLearningPlanTracks().map(track => ({ ...track, lessons: [] }))
        expect(() => buildLearningPlan(unexplained, { goal: "foundations", level: "new", weeklyHours: 4 }, getLearningPlanCatalog()))
            .toThrow(/Missing milestone prerequisite/)
    })

    test("shares one fresh visible lesson snapshot per development check", () => {
        const snapshot = questionLoader.getQuestions()
        const answers = { goal: "foundations", level: "new", weeklyHours: 4 } as const
        const getQuestions = vi.spyOn(questionLoader, "getQuestions").mockReturnValue(snapshot)
        const getQuestionBySlug = vi.spyOn(questionLoader, "getQuestionBySlug")
        vi.stubEnv("NODE_ENV", "development")

        try {
            const first = getSectionCheck(answers, 1)!
            expect(first.questions).toHaveLength(SECTION_CHECK_QUESTION_COUNT)
            expect(getQuestions).toHaveBeenCalledTimes(1)
            expect(getQuestionBySlug).not.toHaveBeenCalled()

            const lessonSlug = first.week.lessons[0].slug
            getQuestions.mockReturnValue(snapshot.map((question) => question.slug === lessonSlug
                ? { ...question, title: `${question.title} (fresh edit)` }
                : question))
            const second = getSectionCheck(answers, 1)!
            expect(second.week.lessons[0].title).toBe(`${first.week.lessons[0].title} (fresh edit)`)
            expect(getQuestions).toHaveBeenCalledTimes(2)
            expect(getQuestionBySlug).not.toHaveBeenCalled()
        } finally {
            vi.unstubAllEnvs()
            vi.restoreAllMocks()
        }
    })

    test("serve ten unique questions and cover every lesson", () => {
        let planCount = 0
        let checkCount = 0

        for (const goal of learnerGoalOptions) {
            for (const level of experienceLevelOptions) {
                for (const weeklyHours of weeklyHourOptions) {
                    planCount += 1
                    let weekNumber = 1

                    while (true) {
                        const check = getSectionCheck({
                            goal: goal.value,
                            level: level.value,
                            weeklyHours: weeklyHours.value,
                        }, weekNumber)
                        if (!check) break

                        checkCount += 1
                        expect(check.week.lessons.length).toBeGreaterThanOrEqual(MIN_PLAN_LESSONS_PER_WEEK)
                        expect(check.questions, `${goal.value}/${level.value}/${weeklyHours.value}h/week-${weekNumber}`).toHaveLength(
                            SECTION_CHECK_QUESTION_COUNT,
                        )
                        expect(new Set(check.questions.map((question) => question.question.trim().toLowerCase())).size).toBe(
                            SECTION_CHECK_QUESTION_COUNT,
                        )
                        expect(new Set(check.questions.map((question) => question.lessonSlug))).toEqual(
                            new Set(check.week.lessons.map((lesson) => lesson.slug)),
                        )

                        weekNumber += 1
                    }
                }
            }
        }

        expect(planCount).toBe(72)
        expect(checkCount).toBeGreaterThan(450)
    }, 20000)
})
