import { afterEach, describe, expect, test, vi } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { getQuestions } from "./questions"
import { getTrackBySlug, getTrackLessons, getTracks, learningTracks } from "./tracks"
import * as routeIndex from "./content-route-index"

const fixtureDirs: string[] = []

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    for (const directory of fixtureDirs.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("learning tracks", () => {
    test("omits intentionally invisible canonical lessons from public tracks while retaining contiguous numbering", () => {
        vi.stubEnv("NODE_ENV", "production")
        const slug = "numpy-and-tensor-shapes"
        const snapshot = getQuestions().filter(question => question.slug !== slug)
        const original = routeIndex.getQuestionRoute
        vi.spyOn(routeIndex, "getQuestionRoute").mockImplementation(candidate => {
            const route = original(candidate)
            return candidate === slug && route ? { ...route, hidden: true } : route
        })

        const track = getTracks(snapshot).find(track => track.slug === "ai-engineer-foundations")!
        const lessons = getTrackLessons(track, snapshot)
        expect(track.lessonSlugs).not.toContain(slug)
        expect(track.timeEstimate).toBe(`${lessons.length} lessons`)
        expect(lessons.map(lesson => lesson.index)).toEqual(lessons.map((_, index) => index + 1))
    })

    test("CLI exports honor source visibility when NODE_ENV is unset and the indexed route is stale", () => {
        const slug = "numpy-and-tensor-shapes"
        const snapshot = getQuestions().filter(question => question.slug !== slug)
        const directory = mkdtempSync(join(tmpdir(), "leetllm-track-cli-"))
        fixtureDirs.push(directory)
        writeFileSync(join(directory, "content.md"), `---\n${JSON.stringify({ slug, visibility: { website: false } })}\n---\n\nBook-only chapter.`)
        const original = routeIndex.getQuestionRoute
        vi.spyOn(routeIndex, "getQuestionRoute").mockImplementation(candidate => {
            const route = original(candidate)
            return candidate === slug && route
                ? { ...route, hidden: false, directory: relative(join(process.cwd(), "src", "content"), directory) }
                : route
        })
        vi.stubEnv("NODE_ENV", undefined)

        const tracks = getTracks(snapshot)
        expect(tracks.every(track => !track.lessonSlugs.includes(slug))).toBe(true)
        expect(() => getTrackLessons({ ...learningTracks[0], lessonSlugs: ["a-mistyped-lesson"] }, snapshot)).toThrow(/a-mistyped-lesson/)
    })

    test("honors explicit snapshot visibility and preserves validation for missing or mistyped lessons", () => {
        const track = learningTracks[0]
        const slug = track.lessonSlugs[0]
        const snapshot = getQuestions().map(question => question.slug === slug
            ? { ...question, visibility: { website: false } }
            : question)
        expect(getTrackLessons(track, snapshot).map(lesson => lesson.slug)).not.toContain(slug)
        expect(() => getTrackLessons(track, getQuestions().filter(question => question.slug !== slug))).toThrow(/references missing lesson slugs/)
        expect(() => getTrackLessons({ ...track, lessonSlugs: ["a-mistyped-lesson"] }, snapshot)).toThrow(/a-mistyped-lesson/)
    })

    test("tracks resolve to published learn lessons", () => {
        const questions = getQuestions()
        const questionSlugs = new Set(questions.map((question) => question.slug))

        for (const track of getTracks()) {
            expect(track.lessonSlugs.length, track.slug).toBeGreaterThanOrEqual(10)
            expect(new Set(track.lessonSlugs).size, track.slug).toBe(track.lessonSlugs.length)
            expect(track.timeEstimate).toBe(`${track.lessonSlugs.length} lessons`)

            for (const slug of track.lessonSlugs) {
                expect(questionSlugs.has(slug), `${track.slug}: ${slug}`).toBe(true)
            }
        }
    })

    test("track lesson order stays stable and numbered", () => {
        const track = getTrackBySlug("inference-and-serving")
        expect(track).toBeDefined()

        const lessons = getTrackLessons(track!)
        expect(lessons[0].slug).toBe("llm-cost-engineering-token-economics")
        expect(lessons.at(-1)?.slug).toBe("serving-benchmark-engineering")
        expect(lessons.map((lesson) => lesson.index)).toEqual(
            Array.from({ length: lessons.length }, (_, index) => index + 1)
        )
    })

    test("keeps prerequisites before dependent lessons within each track", () => {
        const questions = new Map(getQuestions().map((question) => [question.slug, question]))

        for (const track of getTracks()) {
            const positions = new Map(track.lessonSlugs.map((slug, index) => [slug, index]))
            for (const slug of track.lessonSlugs) {
                for (const prerequisite of questions.get(slug)?.prerequisites ?? []) {
                    if (!positions.has(prerequisite)) continue
                    expect(
                        positions.get(prerequisite),
                        `${track.slug}: ${prerequisite} must precede ${slug}`,
                    ).toBeLessThan(positions.get(slug)!)
                }
            }
        }
    })

    test("production ML track covers splits, features, training, and monitored deployment", () => {
        const track = getTrackBySlug("production-ml-systems")
        expect(track).toBeDefined()
        expect(track?.lessonSlugs).toEqual(expect.arrayContaining([
            "cross-validation-leakage-generalization",
            "experiment-design-ab-testing",
            "feature-engineering-production-ml",
            "pytorch-training-loops",
            "llm-deployment-gpu-serving-autoscaling",
        ]))
        expect(track?.lessonSlugs[0]).toBe("numpy-and-tensor-shapes")
        expect(track?.lessonSlugs.at(-1)).toBe("llm-deployment-gpu-serving-autoscaling")
    })

    test("research scientist track covers method, implementation, training, evaluation, and reasoning", () => {
        const track = getTrackBySlug("ai-research-scientist")
        expect(track).toBeDefined()
        expect(track?.lessonSlugs).toEqual(expect.arrayContaining([
            "hypothesis-tests-confidence-intervals-passk",
            "experiment-design-ab-testing",
            "build-gpt-from-scratch-lab",
            "scaling-laws-compute-optimal-training",
            "introduction-to-reinforcement-learning-fundamentals",
            "rlhf-dpo-aligning-language-models",
            "rlvr-verifiable-rewards-training",
            "llm-as-judge-automated-evaluation",
            "synthetic-data-generation-pipelines-llms",
            "cuda-gpu-computing-for-ml",
            "mixed-precision-training-loss-scaling",
            "distributed-training-fsdp-deepspeed-zero",
            "llm-evaluation-benchmarks-limitations",
            "mechanistic-interpretability-sparse-autoencoders",
            "reasoning-models-test-time-compute",
        ]))
        expect(track?.lessonSlugs[0]).toBe("linear-algebra-machine-learning-deeper")
        expect(track?.lessonSlugs).toEqual(expect.arrayContaining([
            "cross-validation-leakage-generalization",
            "supervised-fine-tuning-pipeline",
            "reward-modeling-from-preference-data",
        ]))
        expect(track?.lessonSlugs.at(-1)).toBe("reasoning-models-test-time-compute")
    })
})
