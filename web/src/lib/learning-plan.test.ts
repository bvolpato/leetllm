import { describe, expect, test } from "vitest"
import {
    buildLearningPlan,
    experienceLevelOptions,
    getCompletedPlanActivityIds,
    goalMilestones,
    learnerGoalOptions,
    MAX_PLAN_LESSONS_PER_WEEK,
    MAX_TWO_HOUR_PLAN_WEEK_MINUTES,
    MIN_PLAN_LESSONS_PER_WEEK,
    weeklyHourOptions,
    type PlanTrack,
} from "./learning-plan"
import { getPracticeProblems, toPracticeListItem } from "./practice"
import { getTheoryQuizListItems } from "./theory-quizzes"
import { getTrackLessons, getTracks } from "./tracks"

const tracks: PlanTrack[] = getTracks().map((track) => ({
    slug: track.slug,
    title: track.title,
    description: track.description,
    outcome: track.outcome,
    lessons: getTrackLessons(track),
}))
const catalog = {
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

function build(answers: Parameters<typeof buildLearningPlan>[1]) {
    return buildLearningPlan(tracks, answers, catalog)
}

describe("buildLearningPlan", () => {
    test("creates a complete level-appropriate plan for every answer combination", () => {
        const bounds = {
            new: { min: 8, max: 20 },
            working: { min: 6, max: 16 },
            advanced: { min: 4, max: 18 },
        } as const

        for (const goal of learnerGoalOptions) {
            for (const level of experienceLevelOptions) {
                for (const weeklyHours of weeklyHourOptions) {
                    const plan = build({
                        goal: goal.value,
                        level: level.value,
                        weeklyHours: weeklyHours.value,
                    })
                    const plannedSlugs = plan.weeks.flatMap((week) => week.lessons.map((lesson) => lesson.slug))
                    const trackSlugs = plan.track.lessons.map((lesson) => lesson.slug)

                    expect(plan.weeks.length).toBeGreaterThanOrEqual(bounds[level.value].min)
                    expect(plan.weeks.length).toBeLessThanOrEqual(bounds[level.value].max)
                    for (const slug of trackSlugs) expect(plannedSlugs).toContain(slug)
                    if (level.value !== "new" || goal.value === "foundations") {
                        expect(plannedSlugs).toEqual(trackSlugs)
                    }
                    expect(new Set(plannedSlugs).size).toBe(plannedSlugs.length)
                    expect(plan.weeks.every((week) => week.lessons.length >= MIN_PLAN_LESSONS_PER_WEEK)).toBe(true)
                    expect(plan.weeks.every((week) => week.lessons.length <= MAX_PLAN_LESSONS_PER_WEEK)).toBe(true)
                    expect(plan.weeks.flatMap((week) => week.activities).filter((activity) => activity.kind === "section")).toHaveLength(plan.weeks.length)
                    expect(plan.weeks.flatMap((week) => week.activities).map((activity) => activity.kind)).not.toContain("mastery")
                    const maximumWeeklyMinutes = weeklyHours.value === 2
                        ? MAX_TWO_HOUR_PLAN_WEEK_MINUTES
                        : weeklyHours.value * 60
                    expect(plan.weeks.every((week) => week.totalMinutes <= maximumWeeklyMinutes)).toBe(true)
                    for (const week of plan.weeks) {
                        expect(week.lessonMinutes).toBe(
                            week.activities
                                .filter((activity) => activity.kind === "lesson")
                                .reduce((total, activity) => total + activity.minutes, 0),
                        )
                        expect(week.totalMinutes).toBe(
                            week.activities.reduce((total, activity) => total + activity.minutes, 0),
                        )
                    }
                    expect(plan.totalLessonMinutes).toBe(
                        plan.weeks.reduce((total, week) => total + week.lessonMinutes, 0),
                    )
                }
            }
        }
    })

    test("gives new learners at least as much time as experienced learners", () => {
        const beginnerPlan = build({ goal: "agents", level: "new", weeklyHours: 2 })
        const advancedPlan = build({ goal: "agents", level: "advanced", weeklyHours: 2 })

        expect(beginnerPlan.weeks.length).toBeGreaterThanOrEqual(advancedPlan.weeks.length)
    })

    test("builds an AI Research Scientist plan", () => {
        const plan = build({ goal: "research", level: "advanced", weeklyHours: 6 })

        expect(plan.track.slug).toBe("ai-research-scientist")
        expect(plan.track.lessons).toHaveLength(45)
        expect(plan.weeks.flatMap((week) => week.lessons)).toHaveLength(45)
        expect(plan.track.lessons.at(-1)?.slug).toBe("capstone-reproducible-research-study")
        expect(plan.weeks.flatMap((week) => week.activities)
            .filter((activity) => activity.kind === "coding")
            .map((activity) => activity.practiceSlug)).toEqual(expect.arrayContaining([
            "experiment-traffic-splitter",
            "repository-hash-tree",
            "tool-call-schema-validator",
            "agent-event-timeline",
            "canary-metric-judge",
        ]))
    })

    test("builds a Production ML Systems plan", () => {
        const plan = build({ goal: "ml", level: "working", weeklyHours: 6 })

        expect(plan.track.slug).toBe("production-ml-systems")
        expect(plan.track.lessons).toHaveLength(25)
        expect(plan.track.lessons.at(-1)?.slug).toBe("capstone-production-ml-pipeline")
    })

    test("adds a deduplicated foundations bridge for beginners", () => {
        const plan = build({ goal: "rag", level: "new", weeklyHours: 4 })
        const slugs = plan.track.lessons.map((lesson) => lesson.slug)

        expect(slugs[0]).toBe("git-shell-linux-reproducible-ai")
        expect(slugs).toContain("file-ingestion-pdfs-html-ocr-markdown")
        expect(slugs).toContain("enterprise-rag-security-rbac-access-control")
        expect(new Set(slugs).size).toBe(slugs.length)
        expect(slugs.length).toBeGreaterThanOrEqual(30)
        expect(plan.weeks.length).toBeGreaterThanOrEqual(8)
        expect(plan.foundationBridgeLessonCount).toBeGreaterThan(0)
        expect(plan.foundationBridgeLessonCount + tracks.find((track) => track.slug === "rag-and-search-systems")!.lessons.length).toBe(slugs.length)
    })

    test("orders each week's readings before one combined section check", () => {
        const plan = build({ goal: "agents", level: "working", weeklyHours: 4 })

        for (const week of plan.weeks) {
            const lessonActivities = week.activities.slice(0, week.lessons.length)
            expect(lessonActivities.map((activity) => activity.kind)).toEqual(
                Array.from({ length: week.lessons.length }, () => "lesson"),
            )
            expect(lessonActivities.map((activity) => activity.lessonSlug)).toEqual(
                week.lessons.map((lesson) => lesson.slug),
            )
            expect(week.activities[week.lessons.length]).toEqual(expect.objectContaining({
                kind: "section",
                lessonSlugs: week.lessons.map((lesson) => lesson.slug),
                required: true,
            }))
        }
    })

    test("uses extra weekly time for more level-appropriate coding practice", () => {
        const twoHourPlan = build({ goal: "agents", level: "working", weeklyHours: 2 })
        const fourHourPlan = build({ goal: "agents", level: "working", weeklyHours: 4 })
        const sixHourPlan = build({ goal: "agents", level: "working", weeklyHours: 6 })
        const codingCount = (plan: ReturnType<typeof build>) => plan.weeks.flatMap((week) => week.activities).filter((activity) => activity.kind === "coding").length

        expect(codingCount(fourHourPlan)).toBeGreaterThan(codingCount(twoHourPlan))
        expect(codingCount(sixHourPlan)).toBeGreaterThan(codingCount(fourHourPlan))
        expect(sixHourPlan.weeks.flatMap((week) => week.activities).filter((activity) => activity.kind === "coding").every((activity) => activity.required)).toBe(true)
        expect(sixHourPlan.weeks.flatMap((week) => week.activities).filter((activity) => activity.kind === "coding").every((activity) => (
            catalog.practiceProblems.find((problem) => problem.slug === activity.practiceSlug)?.difficulty !== "Hard"
        ))).toBe(true)
        expect(sixHourPlan.weeks.flatMap((week) => week.activities).filter((activity) => activity.kind === "coding").map((activity) => activity.practiceSlug)).toEqual(
            expect.arrayContaining(["bounded-worker-queue"]),
        )
    })

    test("schedules four profile-specific milestones with proof and prerequisite lessons", () => {
        const profileSignatures = new Set<string>()

        for (const goal of learnerGoalOptions) {
            const definitions = goalMilestones[goal.value]
            profileSignatures.add(definitions.map((definition) => definition.title).join("|"))

            for (const level of experienceLevelOptions) {
                for (const weeklyHours of weeklyHourOptions) {
                    const plan = build({
                        goal: goal.value,
                        level: level.value,
                        weeklyHours: weeklyHours.value,
                    })
                    const milestoneWeeks = plan.weeks.filter((week) => (
                        week.activities.some((activity) => activity.kind === "milestone")
                    ))
                    const milestones = milestoneWeeks.flatMap((week) => (
                        week.activities
                            .filter((activity) => activity.kind === "milestone")
                            .map((activity) => ({ activity, weekNumber: week.number }))
                    ))

                    expect(milestones).toHaveLength(4)
                    expect(milestoneWeeks).toHaveLength(4)

                    for (const [index, definition] of definitions.entries()) {
                        const milestone = milestones.find(({ activity }) => (
                            activity.id === `milestone:${plan.track.slug}:${index + 1}`
                        ))
                        const prerequisiteWeek = plan.weeks.find((week) => (
                            week.lessons.some((lesson) => lesson.slug === definition.unlockAfterLessonSlug)
                        ))

                        expect(milestone?.activity.title).toBe(definition.title)
                        expect(milestone?.activity.description).toBe(
                            `${definition.deliverable} Done when ${definition.completionCriteria}.`,
                        )
                        expect(milestone?.activity.minutes).toBe(definition.estimatedMinutes)
                        expect(milestone?.activity.minutes).toBeGreaterThanOrEqual(45)
                        expect(milestone?.activity.description).not.toMatch(/evidence:|thin slice|failure you refuse to hide/i)
                        expect(prerequisiteWeek).toBeDefined()
                        expect(milestone?.weekNumber).toBeGreaterThanOrEqual(prerequisiteWeek!.number)
                    }
                }
            }
        }

        expect(profileSignatures.size).toBe(8)
    })

    test("keeps broad diagnostics optional", () => {
        const plan = build({ goal: "rag", level: "advanced", weeklyHours: 6 })

        expect(plan.weeks.flatMap((week) => week.activities).filter((activity) => activity.kind === "exam")).toEqual([
            expect.objectContaining({ required: false, quizSlug: "advanced-training-inference-architecture" }),
        ])
    })

    test("moves an optional diagnostic before a full final week with newly unlocked practice", () => {
        const track = tracks.find((candidate) => candidate.slug === "training-and-alignment")!
        const slugs = [
            "llm-lifecycle-training-to-deployment",
            "pytorch-training-loops",
            "pre-training-data-pipelines-scale",
            "build-gpt-from-scratch-lab",
            "supervised-fine-tuning-pipeline",
            "experiment-tracking-mlflow-wandb",
            "rlhf-dpo-aligning-language-models",
            "constitutional-ai-automated-red-teaming",
            "model-versioning-continuous-deployment",
            "capstone-fine-tuned-classifier",
        ]
        const lessons = slugs.map((slug, index) => ({
            ...track.lessons.find((lesson) => lesson.slug === slug)!,
            index: index + 1,
            timeEstimate: index === slugs.length - 1 ? 45 : 32,
        }))
        const plan = buildLearningPlan([{ ...track, lessons }], {
            goal: "training", level: "working", weeklyHours: 4,
        }, {
            practiceProblems: [{
                ...catalog.practiceProblems.find((problem) => problem.slug === "canary-metric-judge")!,
                timeEstimateMinutes: 35,
            }],
            theoryQuizzes: [{
                ...catalog.theoryQuizzes.find((quiz) => quiz.slug === "intermediate-llm-product-systems")!,
                estimatedMinutes: 12,
            }],
        })

        // The final readings, check, milestone, and practice use 229 minutes.
        // Adding the diagnostic there would exceed the 240-minute budget by one.
        expect(plan.weeks).toHaveLength(5)
        expect(plan.weeks.flatMap((week) => week.lessons.map((lesson) => lesson.slug))).toEqual(slugs)
        expect(plan.weeks.every((week) => week.totalMinutes <= 240)).toBe(true)
        expect(plan.weeks.at(-1)?.totalMinutes).toBe(229)
        expect(plan.weeks.at(-1)?.activities).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: "coding", practiceSlug: "canary-metric-judge" }),
            expect.objectContaining({ kind: "milestone", title: goalMilestones.training[3].title }),
        ]))
        const diagnosticWeeks = plan.weeks.filter((week) => week.activities.some((activity) => activity.kind === "exam"))
        expect(diagnosticWeeks).toHaveLength(1)
        expect(diagnosticWeeks[0].number).toBeLessThan(plan.weeks.length)
        expect(diagnosticWeeks[0].activities).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: "exam", required: false, quizSlug: "intermediate-llm-product-systems" }),
        ]))
    })

    test("keeps self-assessed milestones optional and out of automatic completion", () => {
        const plan = build({ goal: "rag", level: "working", weeklyHours: 4 })
        const completed = getCompletedPlanActivityIds(plan, {
            readLessonSlugs: new Set(plan.track.lessons.map((lesson) => lesson.slug)),
            passedSectionSlugs: new Set(plan.weeks.flatMap((week) => week.activities).flatMap((activity) => (
                activity.kind === "section" && activity.quizSlug ? [activity.quizSlug] : []
            ))),
            completedPracticeSlugs: new Set(plan.weeks.flatMap((week) => week.activities).flatMap((activity) => activity.practiceSlug ?? [])),
            passedTheorySlugs: new Set(),
        })

        const milestones = plan.weeks.flatMap((week) => week.activities).filter((activity) => activity.kind === "milestone")
        expect(milestones.every((activity) => !activity.required)).toBe(true)
        expect(milestones.every((activity) => !completed.has(activity.id))).toBe(true)
        expect(plan.weeks.flatMap((week) => week.activities).filter((activity) => activity.required).every((activity) => completed.has(activity.id))).toBe(true)
    })
})
