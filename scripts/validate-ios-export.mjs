#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, join, relative } from "node:path"

const repoRoot = process.cwd().endsWith("/web") ? join(process.cwd(), "..") : process.cwd()
const dataDir = join(repoRoot, "mobile", "ios", "LeetLLM", "LeetLLM", "Resources", "data")
const appDir = join(repoRoot, "mobile", "ios", "LeetLLM", "LeetLLM")
const projectPath = join(repoRoot, "mobile", "ios", "LeetLLM", "LeetLLM.xcodeproj", "project.pbxproj")
const webRoot = join(repoRoot, "web")

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"))
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message)
    }
}

function walk(root, predicate) {
    const result = []
    if (!existsSync(root)) return result

    function visit(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name)
            if (entry.isDirectory()) {
                visit(path)
            } else if (predicate(path)) {
                result.push(path)
            }
        }
    }

    visit(root)
    return result
}

function hasBalancedCodeFences(markdown) {
    let fence
    for (const line of markdown.split(/\r?\n/)) {
        const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
        if (!match) continue

        const marker = match[1][0]
        if (!fence) {
            fence = { marker, length: match[1].length }
        } else if (marker === fence.marker && match[1].length >= fence.length && !match[2].trim()) {
            fence = undefined
        }
    }
    return fence === undefined
}

function validateContentBundle(kind, dirName) {
    const index = readJson(join(dataDir, dirName, "index.json"))
    assert(Array.isArray(index) && index.length > 0, `${kind} index is empty`)

    for (const item of index) {
        assert(item.slug, `${kind} item missing slug`)
        const detailPath = join(dataDir, dirName, `${item.slug}.json`)
        assert(existsSync(detailPath), `${kind} detail missing: ${detailPath}`)
        const detail = readJson(detailPath)
        assert(typeof detail.content === "string" && detail.content.length > 100, `${kind} ${item.slug} content too short`)
        assert(Array.isArray(detail.images), `${kind} ${item.slug} images must be array`)

        for (const image of detail.images) {
            assert(typeof image.path === "string", `${kind} ${item.slug} image path missing`)
            assert(existsSync(join(dataDir, image.path)), `${kind} ${item.slug} missing image ${image.path}`)
        }

        for (const key of ["coverImage", "coverImageDark", "coverImageLight", "socialImage"]) {
            if (detail[key]) {
                assert(existsSync(join(dataDir, detail[key])), `${kind} ${item.slug} missing ${key}: ${detail[key]}`)
            }
        }
    }

    return index.length
}

assert(existsSync(dataDir), `Missing iOS data dir: ${dataDir}`)
assert(existsSync(projectPath), `Missing Xcode project: ${projectPath}`)
assert(existsSync(join(appDir, "LeetLLMApp.swift")), "Missing iOS app entrypoint")

const manifest = readJson(join(dataDir, "manifest.json"))
const sourceFiles = [
    ...walk(join(webRoot, "src", "content"), () => true),
    ...walk(join(webRoot, "src", "lib"), (path) => [".ts", ".tsx", ".json"].some((ext) => path.endsWith(ext))),
    join(webRoot, "src", "data", "theory-quizzes.json"),
    join(webRoot, "scripts", "generate-glossary.ts"),
    join(webRoot, "scripts", "glossary-sections.ts"),
    join(webRoot, "scripts", "ios-glossary-text.ts"),
    join(webRoot, "scripts", "ios-content-visibility.ts"),
    join(webRoot, "scripts", "export-ios-content.ts"),
]
const latestSourceModifiedAt = Math.max(...sourceFiles.map((path) => statSync(path).mtimeMs))
assert(typeof manifest.sourceModifiedAt === "string", "Manifest is missing sourceModifiedAt; regenerate the iOS bundle")
assert(
    new Date(manifest.sourceModifiedAt).getTime() + 1 >= latestSourceModifiedAt,
    "iOS bundle is stale; run pnpm --dir web ios:export",
)
const lessonCount = validateContentBundle("lesson", "lessons")
const blogCount = validateContentBundle("blog", "blogs")
const lessonIndex = readJson(join(dataDir, "lessons", "index.json"))
const blogIndex = readJson(join(dataDir, "blogs", "index.json"))
const tracks = readJson(join(dataDir, "tracks.json"))
const learningPlan = readJson(join(dataDir, "learning-plan.json"))
const quizzes = readJson(join(dataDir, "theory-quizzes.json"))
const glossary = readJson(join(dataDir, "glossary", "index.json"))
const practice = readJson(join(dataDir, "practice", "index.json"))

assert(lessonCount === manifest.lessonCount, "Lesson count differs from manifest")
assert(new Set(lessonIndex.map((lesson) => lesson.slug)).size === lessonIndex.length, "Lesson slugs must be unique")
assert(blogCount === manifest.blogCount, "Blog count differs from manifest")
assert(
    blogIndex.every((blog) => !blog.accessEmail),
    "Private or account-restricted blog content must never be embedded in a distributable iOS app",
)
for (const slug of [
    "glm-52-training-masterclass-3c1efdc30f7c0d3341d5",
    "glm-53-training-masterclass-3c1efdc30f7c0d3341d5",
]) {
    assert(
        !blogIndex.some((blog) => blog.slug === slug),
        `The private masterclass must not be embedded in the public iOS bundle: ${slug}`,
    )
    assert(
        !existsSync(join(dataDir, "images", "blog", slug)),
        `Private-blog illustrations must not be embedded in the public iOS bundle: ${slug}`,
    )
}
assert(
    existsSync(join(dataDir, "katex", "fonts", "KaTeX_Main-Regular.woff2")),
    "Offline KaTeX font files are missing from the iOS bundle",
)
assert(Array.isArray(tracks) && tracks.length === manifest.trackCount, "Track count differs from manifest")
assert(new Set(tracks.map((track) => track.slug)).size === tracks.length, "Track slugs must be unique")
for (const track of tracks) {
    assert(track.lessonSlugs.length > 0, `${track.slug} must contain lessons`)
    assert(track.lessons.length === track.lessonSlugs.length, `${track.slug} embedded lesson count differs from lessonSlugs`)
    assert(track.lessons.every((lesson, index) => lesson.slug === track.lessonSlugs[index]), `${track.slug} embedded lessons are out of order`)
    assert(track.timeEstimate === `${track.lessonSlugs.length} lessons`, `${track.slug} time estimate is stale`)
    assert(track.lessonSlugs.every((slug) => lessonIndex.some((lesson) => lesson.slug === slug)), `${track.slug} references a missing lesson`)
}
assert(learningPlan.schemaVersion === 3, "Learning plan schema version must be 3")
assert(typeof learningPlan.foundationTrackSlug === "string", "Learning plan foundation track missing")
assert(tracks.some((track) => track.slug === learningPlan.foundationTrackSlug), "Learning plan foundation track is not exported")
assert(Array.isArray(learningPlan.goals) && learningPlan.goals.length === tracks.length, "Learning plan goals must cover every track")
assert(new Set(learningPlan.goals.map((goal) => goal.trackSlug)).size === tracks.length, "Learning plan goals must map to unique tracks")
assert(learningPlan.goals.every((goal) => tracks.some((track) => track.slug === goal.trackSlug)), "Learning plan goal references missing track")
assert(learningPlan.goals.some((goal) => goal.value === "research"), "AI Research Scientist goal missing")
assert(Array.isArray(learningPlan.levels) && learningPlan.levels.length > 0, "Learning plan levels missing")
assert(Array.isArray(learningPlan.weeklyHours) && learningPlan.weeklyHours.length > 0, "Learning plan weekly hours missing")
const expectedPlanCount = learningPlan.goals.length * learningPlan.levels.length * learningPlan.weeklyHours.length
assert(Array.isArray(learningPlan.plans) && learningPlan.plans.length === expectedPlanCount, "Learning plan template matrix is incomplete")
const planKeys = learningPlan.plans.map((plan) => `${plan.trackSlug}:${plan.level}:${plan.weeklyHours}`)
assert(new Set(planKeys).size === expectedPlanCount, "Learning plan templates must have unique track, level, and weekly-hour keys")
const exportedLessonSlugs = new Set(tracks.flatMap((track) => track.lessonSlugs))
const exportedPracticeSlugs = new Set(practice.map((problem) => problem.slug))
const exportedQuizSlugs = new Set(quizzes.map((quiz) => quiz.slug))
for (const plan of learningPlan.plans) {
    assert(tracks.some((track) => track.slug === plan.trackSlug), `Learning plan references missing track: ${plan.trackSlug}`)
    assert(plan.lessonSlugs.length > 0, `Learning plan has no lessons: ${plan.trackSlug}`)
    assert(new Set(plan.lessonSlugs).size === plan.lessonSlugs.length, `Learning plan has duplicate lessons: ${plan.trackSlug}`)
    assert(plan.lessonSlugs.every((slug) => exportedLessonSlugs.has(slug)), `Learning plan references lesson outside exported tracks: ${plan.trackSlug}`)
    assert(plan.weeks.flatMap((week) => week.lessonSlugs).join("|") === plan.lessonSlugs.join("|"), `Learning plan weeks do not preserve lesson order: ${plan.trackSlug}`)
    const activities = plan.weeks.flatMap((week) => week.activities)
    assert(activities.length > plan.lessonSlugs.length, `Learning plan has no mixed activities: ${plan.trackSlug}`)
    assert(new Set(activities.map((activity) => activity.id)).size === activities.length, `Learning plan has duplicate activity ids: ${plan.trackSlug}`)
    assert(activities.every((activity) => typeof activity.required === "boolean"), `Learning plan activity requirement missing: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "lesson").length === plan.lessonSlugs.length, `Learning plan lesson activities differ from lessons: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "section").length === plan.weeks.length, `Learning plan needs one section check per week: ${plan.trackSlug}`)
    assert(!activities.some((activity) => activity.kind === "mastery"), `Learning plan must not schedule lesson mastery separately: ${plan.trackSlug}`)
    const codingActivities = activities.filter((activity) => activity.kind === "coding")
    assert(codingActivities.length > 0, `Learning plan has no coding practice: ${plan.trackSlug}`)
    assert(codingActivities.every((activity) => activity.required === false), `Learning plan coding activities must be optional on iOS: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "milestone").length === 4, `Learning plan needs four milestones: ${plan.trackSlug}`)
    const milestones = activities.filter((activity) => activity.kind === "milestone")
    assert(milestones.every((activity) => activity.required === false), `Learning plan milestones must be optional: ${plan.trackSlug}`)
    assert(new Set(milestones.map((activity) => activity.title)).size === 4, `Learning plan milestones need distinct titles: ${plan.trackSlug}`)
    assert(milestones.every((activity) => !/^Milestone\b/.test(activity.title)), `Learning plan milestone title repeats its activity label: ${plan.trackSlug}`)
    assert(milestones.every((activity) => !/evidence:|thin slice|failure you refuse to hide/i.test(activity.description)), `Learning plan contains generic milestone copy: ${plan.trackSlug}`)
    assert(milestones.every((activity) => activity.description.includes("Done when ")), `Learning plan milestone needs completion criteria: ${plan.trackSlug}`)
    assert(milestones.every((activity) => activity.minutes >= 45), `Learning plan milestone estimate is too short: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "exam").length === 1, `Learning plan needs final exam or diagnostic: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "lesson").every((activity) => exportedLessonSlugs.has(activity.lessonSlug)), `Learning plan activity references missing lesson: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "section").every((activity) => activity.lessonSlugs.length > 0 && activity.lessonSlugs.every((slug) => exportedLessonSlugs.has(slug))), `Learning plan section check references missing lesson: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "section").every((activity) => activity.questions.length === 10), `Learning plan section check must contain exactly 10 questions: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "coding").every((activity) => exportedPracticeSlugs.has(activity.practiceSlug)), `Learning plan activity references missing practice: ${plan.trackSlug}`)
    assert(activities.filter((activity) => activity.kind === "exam").every((activity) => exportedQuizSlugs.has(activity.quizSlug)), `Learning plan activity references missing quiz: ${plan.trackSlug}`)
    for (const week of plan.weeks) {
        assert(week.lessonSlugs.length >= 2, `Learning plan week needs at least two lessons: ${plan.trackSlug} week ${week.number}`)
        assert(week.lessonSlugs.length <= 10, `Learning plan week has more lessons than its section check can cover: ${plan.trackSlug} week ${week.number}`)
        const sectionChecks = week.activities.filter((activity) => activity.kind === "section")
        assert(week.activities.filter((activity) => activity.kind === "milestone").length <= 1, `Learning plan week has stacked milestones: ${plan.trackSlug} week ${week.number}`)
        assert(sectionChecks.length === 1, `Learning plan week needs one section check: ${plan.trackSlug} week ${week.number}`)
        assert(sectionChecks[0].lessonSlugs.join("|") === week.lessonSlugs.join("|"), `Learning plan section check lessons differ: ${plan.trackSlug} week ${week.number}`)
        assert(new Set(sectionChecks[0].questions.map((question) => question.lessonSlug)).size === week.lessonSlugs.length, `Learning plan section check must sample every lesson: ${plan.trackSlug} week ${week.number}`)
        assert(week.activities.slice(0, week.lessonSlugs.length).every((activity) => activity.kind === "lesson"), `Learning plan readings must precede section check: ${plan.trackSlug} week ${week.number}`)
        assert(week.activities[week.lessonSlugs.length].kind === "section", `Learning plan section check must follow readings: ${plan.trackSlug} week ${week.number}`)
        const activityMinutes = week.activities.filter((activity) => activity.kind !== "lesson").reduce((total, activity) => total + activity.minutes, 0)
        assert(activityMinutes === week.activityMinutes, `Learning plan activity minutes differ: ${plan.trackSlug} week ${week.number}`)
        assert(week.lessonMinutes + week.activityMinutes === week.totalMinutes, `Learning plan total minutes differ: ${plan.trackSlug} week ${week.number}`)
        const maximumWeeklyMinutes = plan.weeklyHours === 2 ? 240 : plan.weeklyHours * 60
        assert(week.totalMinutes <= maximumWeeklyMinutes, `Learning plan exceeds weekly budget: ${plan.trackSlug} week ${week.number}`)
    }
}
assert(Array.isArray(quizzes) && quizzes.length === 4, "Theory quiz export must contain four levels")
assert(Array.isArray(glossary) && glossary.length >= 300, "Glossary export too small")
const glossaryIds = new Set(glossary.map((entry) => entry.id))
const rawGlossaryPreviewSyntax = /\*|`|\[[^\]]+]\([^)]+\)|^#{1,6}\s/
for (const entry of glossary) {
    assert(typeof entry.summary === "string" && entry.summary.length > 0, `Glossary summary missing: ${entry.id}`)
    assert(!rawGlossaryPreviewSyntax.test(entry.summary), `Glossary summary contains raw Markdown: ${entry.id}`)
    assert(
        (entry.related ?? []).every((related) => glossaryIds.has(related.id) && related.title),
        `Glossary related term is invalid: ${entry.id}`,
    )
    assert(
        (entry.usage ?? []).every((item) => !rawGlossaryPreviewSyntax.test(item.excerpt)),
        `Glossary usage excerpt contains raw Markdown: ${entry.id}`,
    )
    const usageIDs = (entry.usage ?? []).map((item) => `${item.url}\u001f${item.excerpt}`)
    assert(new Set(usageIDs).size === usageIDs.length, `Glossary usage IDs are not unique: ${entry.id}`)
    const markdownSections = [
        entry.definition,
        entry.example,
        entry.relevance,
        entry.intuition,
        entry.formula,
        entry.decisionRule,
        entry.pitfall,
        ...(entry.details ?? []).map((detail) => detail.content),
    ].filter(Boolean)
    assert(markdownSections.every(hasBalancedCodeFences), `Glossary section has an unclosed code fence: ${entry.id}`)
}
assert(glossary.filter((entry) => (entry.related?.length ?? 0) > 0).length > 300, "Glossary related terms are missing")
assert(Array.isArray(practice) && practice.every((item) => item.codingAvailableOnIOS === false), "Practice metadata must mark coding unavailable on iOS")

const assetFiles = walk(join(dataDir, "assets"), () => true)
assert(
    assetFiles.every((path) => !path.split("/").includes("__pycache__") && !/\.py[co]$/i.test(path)),
    "Python bytecode and __pycache__ directories must not enter the iOS bundle",
)
assert(assetFiles.length === manifest.copiedAssetCount, "Asset count differs from manifest")

const imageFiles = walk(join(dataDir, "images"), (path) => path.endsWith(".png"))
assert(
    imageFiles.every((path) =>
        basename(path) !== "social_banner.png" || relative(join(dataDir, "images"), path).startsWith("blog/"),
    ),
    "Web-only lesson social banners must not inflate the offline iOS bundle",
)
const darkImages = imageFiles.filter((path) => path.endsWith("_dark.png")).length
const lightImages = imageFiles.filter((path) => path.endsWith("_light.png")).length
const imageBytes = imageFiles.reduce((sum, path) => sum + statSync(path).size, 0)

assert(imageFiles.length === manifest.copiedImageCount, "Image count differs from manifest")
assert(darkImages === manifest.darkImages, "Dark image count differs from manifest")
assert(lightImages === manifest.lightImages, "Light image count differs from manifest")
assert(darkImages > 700 && lightImages > 700, "Expected both dark and light illustration exports")
assert(imageBytes === manifest.imageBytes, "Image byte count differs from manifest")

console.log(`OK iOS export: ${lessonCount} lessons, ${blogCount} blogs, ${tracks.length} tracks, ${glossary.length} glossary entries, ${imageFiles.length} images`)
