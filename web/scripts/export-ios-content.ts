import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "fs"
import { basename, dirname, extname, join, relative, resolve } from "path"
import { getBlogPosts } from "../src/lib/blog"
import { extractMasteryQuiz } from "../src/lib/mastery-quiz"
import { getPracticeProblems, toPracticeListItem } from "../src/lib/practice"
import { getQuestions } from "../src/lib/questions"
import { GLOSSARY_ENTRIES_BY_IMPORTANCE } from "../src/generated/glossary"
import { buildLearningPlan, learningPlanConfiguration } from "../src/lib/learning-plan"
import { getLearningPlanTracks } from "../src/lib/learning-plan-server"
import { buildSectionCheckQuestions } from "../src/lib/section-check"
import { getTracks } from "../src/lib/tracks"
import { getTheoryQuizzes } from "../src/lib/theory-quizzes"
import { glossaryPlainText } from "./ios-glossary-text"
import { createPublicContentBundleFilter } from "./ios-content-visibility"

type ReferenceRecord = {
    key: string
    title: string
    authors: string
    year: number
    url: string
    type: string
    venue?: string
    note?: string
}

type ImageRef = {
    path: string
    theme?: "dark" | "light"
    alt?: string
}

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, "..")
const contentRoot = join(webRoot, "src", "content")
const outputDataDir = join(repoRoot, "mobile", "ios", "LeetLLM", "LeetLLM", "Resources", "data")
const imageOutputDir = join(outputDataDir, "images")
const assetOutputDir = join(outputDataDir, "assets")
const katexOutputDir = join(outputDataDir, "katex")
const publicBlogSlugs = new Set(getBlogPosts().map((post) => post.slug))

function ensureDir(path: string) {
    mkdirSync(path, { recursive: true })
}

function writeJson(path: string, value: unknown) {
    ensureDir(dirname(path))
    writeFileSync(path, `${JSON.stringify(value)}\n`)
}

function walkFiles(root: string, predicate: (path: string) => boolean): string[] {
    if (!existsSync(root)) return []
    const result: string[] = []

    function visit(dir: string) {
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
    return result.sort()
}

function copyPreservingRoot(sourceRoot: string, sourcePath: string, targetRoot: string) {
    const rel = relative(sourceRoot, sourcePath)
    const targetPath = join(targetRoot, rel)
    ensureDir(dirname(targetPath))
    cpSync(sourcePath, targetPath)
}

const belongsToPublicBundle = createPublicContentBundleFilter(contentRoot, publicBlogSlugs)

function copyContentImages() {
    const pngs = walkFiles(
        contentRoot,
        (path) => {
            if (extname(path).toLowerCase() !== ".png" || !belongsToPublicBundle(path)) {
                return false
            }
            const [section] = relative(contentRoot, path).split("/")
            return section === "blog" || basename(path) !== "social_banner.png"
        },
    )
    const expectedPaths = new Set(pngs.map((path) => relative(contentRoot, path)))

    for (const existing of walkFiles(imageOutputDir, (path) => extname(path).toLowerCase() === ".png")) {
        if (!expectedPaths.has(relative(imageOutputDir, existing))) {
            rmSync(existing)
        }
    }

    const exportedBlogImages = join(imageOutputDir, "blog")
    if (existsSync(exportedBlogImages)) {
        for (const entry of readdirSync(exportedBlogImages, { withFileTypes: true })) {
            if (entry.isDirectory() && !publicBlogSlugs.has(entry.name)) {
                rmSync(join(exportedBlogImages, entry.name), { recursive: true, force: true })
            }
        }
    }

    for (const png of pngs) {
        const targetPath = join(imageOutputDir, relative(contentRoot, png))
        if (existsSync(targetPath)) {
            const source = statSync(png)
            const target = statSync(targetPath)
            if (source.size === target.size && target.mtimeMs >= source.mtimeMs) {
                continue
            }
        }
        copyPreservingRoot(contentRoot, png, imageOutputDir)
    }
    return pngs.length
}

function copyContentAssets() {
    rmSync(assetOutputDir, { recursive: true, force: true })
    const assets = walkFiles(
        contentRoot,
        (path) => path.split("/").includes("assets")
            && !path.split("/").includes("__pycache__")
            && !/\.py[co]$/i.test(path)
            && belongsToPublicBundle(path),
    )
    for (const asset of assets) {
        const rel = relative(contentRoot, asset)
        const targetPath = join(assetOutputDir, rel)
        ensureDir(dirname(targetPath))
        if (extname(asset).toLowerCase() === ".txt") {
            const normalized = readFileSync(asset, "utf8")
                .replace(/[ \t]+$/gm, "")
                .replace(/\n*$/, "\n")
            writeFileSync(targetPath, normalized)
        } else {
            cpSync(asset, targetPath)
        }
    }
    return assets.length
}

function copyKatexAssets() {
    const katexDist = join(webRoot, "node_modules", "katex", "dist")
    const sourceFiles = [
        [join(katexDist, "katex.min.css"), join(katexOutputDir, "katex.min.css")],
        [join(katexDist, "katex.min.js"), join(katexOutputDir, "katex.min.js")],
        [join(katexDist, "contrib", "auto-render.min.js"), join(katexOutputDir, "auto-render.min.js")],
    ]

    for (const [source, target] of sourceFiles) {
        ensureDir(dirname(target))
        cpSync(source, target)
    }

    const fontsDir = join(katexOutputDir, "fonts")
    rmSync(fontsDir, { recursive: true, force: true })
    ensureDir(fontsDir)
    for (const font of walkFiles(join(katexDist, "fonts"), (path) => path.endsWith(".woff2"))) {
        cpSync(font, join(fontsDir, relative(join(katexDist, "fonts"), font)))
    }
}

function latestIOSSourceTimestamp(): string {
    const files = walkFiles(contentRoot, () => true)
    files.push(
        ...walkFiles(join(webRoot, "src", "lib"), (path) => [".ts", ".tsx", ".json"].includes(extname(path).toLowerCase())),
        join(webRoot, "src", "data", "theory-quizzes.json"),
        join(webRoot, "scripts", "generate-glossary.ts"),
        join(webRoot, "scripts", "glossary-sections.ts"),
        join(webRoot, "scripts", "ios-glossary-text.ts"),
        join(webRoot, "scripts", "ios-content-visibility.ts"),
        join(webRoot, "scripts", "export-ios-content.ts"),
    )
    const latest = files.reduce((max, path) => Math.max(max, statSync(path).mtimeMs), 0)
    return new Date(latest).toISOString()
}

function stripQuery(value: string): string {
    return value.split("?")[0]
}

function contentImageUrlToBundlePath(url: string | undefined): string | undefined {
    if (!url) return undefined
    if (url.startsWith("images/")) return stripQuery(url)
    if (!url.startsWith("/cdn/content-image/")) return url
    const rel = decodeURIComponent(stripQuery(url).replace(/^\/cdn\/content-image\//, ""))
    return `images/${rel}`
}

function rewriteBundleLinks(markdown: string): string {
    return markdown
        .replace(/\/cdn\/content-image\/([^"')\s]+)/g, (_match, rel: string) => {
            const clean = decodeURIComponent(String(rel).split("?")[0])
            return `images/${clean}`
        })
        .replace(/\/api\/content-asset\/([^"')\s]+)/g, (_match, rel: string) => {
            const clean = decodeURIComponent(String(rel).split("?")[0])
            return `assets/${clean}`
        })
}

function bundledPathExists(path: string | undefined): boolean {
    if (!path) return false
    return existsSync(join(outputDataDir, path))
}

function themePath(path: string | undefined, theme: "dark" | "light"): string | undefined {
    if (!path) return undefined
    if (path.endsWith(`_${theme}.png`)) return bundledPathExists(path) ? path : undefined
    const opposite = theme === "dark" ? "light" : "dark"
    if (path.endsWith(`_${opposite}.png`)) {
        const candidate = path.replace(`_${opposite}.png`, `_${theme}.png`)
        return bundledPathExists(candidate) ? candidate : undefined
    }
    const candidate = path.replace(/\.png$/, `_${theme}.png`)
    return bundledPathExists(candidate) ? candidate : undefined
}

function imageBundle(path: string | undefined) {
    const image = contentImageUrlToBundlePath(path)
    if (!image) return {}

    return {
        coverImage: image,
        coverImageDark: themePath(image, "dark"),
        coverImageLight: themePath(image, "light"),
    }
}

function extractImageRefs(markdown: string): ImageRef[] {
    const refs = new Map<string, ImageRef>()

    for (const match of markdown.matchAll(/<img\b([^>]*?)\bsrc="([^"]+)"([^>]*)>/g)) {
        const attributes = `${match[1]} ${match[3]}`
        const src = stripQuery(match[2])
        if (!src.startsWith("images/")) continue

        const alt = attributes.match(/\balt="([^"]*)"/)?.[1]
        const darkSrc = attributes.match(/\bdata-dark-src="([^"]+)"/)?.[1]
        const lightSrc = attributes.match(/\bdata-light-src="([^"]+)"/)?.[1]
        if (darkSrc || lightSrc) {
            for (const [themedSrc, theme] of [[darkSrc, "dark"], [lightSrc, "light"]] as const) {
                if (!themedSrc) continue
                const path = stripQuery(themedSrc)
                if (path.startsWith("images/")) refs.set(path, { path, theme, alt })
            }
            continue
        }
        const className = attributes.match(/\bclass="([^"]*)"/)?.[1] ?? ""
        const theme = className.includes("dark:block")
            ? "dark"
            : className.includes("dark:hidden")
                ? "light"
                : undefined
        refs.set(src, { path: src, theme, alt })
    }

    for (const match of markdown.matchAll(/!\[([^\]]*)]\((images\/[^)]+)\)/g)) {
        const src = stripQuery(match[2])
        refs.set(src, { path: src, alt: match[1] })
    }

    return [...refs.values()].sort((left, right) => left.path.localeCompare(right.path))
}

function referencesArray(references: Record<string, Omit<ReferenceRecord, "key">>): ReferenceRecord[] {
    return Object.entries(references).map(([key, reference]) => ({
        key,
        ...reference,
    }))
}

function buildLessons() {
    const lessons = getQuestions()

    const lessonIndex = lessons.map((lesson, index) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        section: lesson.section,
        category: lesson.category,
        difficulty: lesson.difficulty,
        timeEstimate: lesson.timeEstimate,
        order: lesson.order ?? index + 1,
        shortDescription: lesson.shortDescription,
        keyConceptsTested: lesson.keyConceptsTested,
        prerequisites: lesson.prerequisites ?? [],
        relatedQuestions: lesson.relatedQuestions ?? [],
        previousSlug: lessons[index - 1]?.slug,
        nextSlug: lessons[index + 1]?.slug,
        lastModified: lesson.lastModified,
        ...imageBundle(lesson.coverImage),
    }))

    writeJson(join(outputDataDir, "lessons", "index.json"), lessonIndex)

    for (let position = 0; position < lessons.length; position += 1) {
        const lesson = lessons[position]
        const extracted = extractMasteryQuiz(lesson.content)
        const content = rewriteBundleLinks(extracted.content)
        writeJson(join(outputDataDir, "lessons", `${lesson.slug}.json`), {
            ...lessonIndex[position],
            content,
            rubricPoints: lesson.rubricPoints,
            followUpQuestions: lesson.followUpQuestions,
            commonPitfalls: lesson.commonPitfalls,
            references: referencesArray(lesson.references),
            masteryQuiz: extracted.questions,
            images: extractImageRefs(content),
        })
    }

    return lessons.length
}

function buildBlogs() {
    const posts = getBlogPosts()
    const blogIndex = posts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        tags: post.tags,
        timeEstimate: post.timeEstimate,
        featured: post.featured ?? false,
        ...imageBundle(post.coverImage),
        socialImage: contentImageUrlToBundlePath(post.socialImage),
    }))

    writeJson(join(outputDataDir, "blogs", "index.json"), blogIndex)

    for (let position = 0; position < posts.length; position += 1) {
        const post = posts[position]
        const content = rewriteBundleLinks(post.content)
        writeJson(join(outputDataDir, "blogs", `${post.slug}.json`), {
            ...blogIndex[position],
            content,
            references: referencesArray(post.references),
            images: extractImageRefs(content),
        })
    }

    return posts.length
}

function buildTracks() {
    const planTracks = new Map(getLearningPlanTracks().map(track => [track.slug, track]))
    const tracks = getTracks().map((track) => ({
        ...track,
        ...planTracks.get(track.slug)!,
    }))
    writeJson(join(outputDataDir, "tracks.json"), tracks)
    return tracks
}

function buildLearningPlanConfiguration(tracks: ReturnType<typeof buildTracks>) {
    const lessonsBySlug = new Map(getQuestions().map((lesson) => [lesson.slug, lesson]))
    const catalog = {
        practiceProblems: getPracticeProblems().map(toPracticeListItem).map((problem) => ({
            slug: problem.slug,
            title: problem.title,
            summary: problem.summary,
            difficulty: problem.difficulty,
            timeEstimateMinutes: problem.timeEstimateMinutes,
        })),
        theoryQuizzes: getTheoryQuizzes().map((quiz) => ({
            slug: quiz.slug,
            title: quiz.title,
            description: quiz.description,
            level: quiz.level,
            estimatedMinutes: quiz.estimatedMinutes,
        })),
    }
    const plans = learningPlanConfiguration.goals.flatMap((goal) =>
        learningPlanConfiguration.levels.flatMap((level) =>
            learningPlanConfiguration.weeklyHours.map((weeklyHours) => {
                const plan = buildLearningPlan(tracks, {
                    goal: goal.value,
                    level: level.value,
                    weeklyHours: weeklyHours.value,
                }, catalog)
                return {
                    trackSlug: plan.track.slug,
                    level: level.value,
                    weeklyHours: weeklyHours.value,
                    lessonSlugs: plan.track.lessons.map((lesson) => lesson.slug),
                    weeks: plan.weeks.map((week) => ({
                        number: week.number,
                        title: week.title,
                        focus: week.focus,
                        lessonSlugs: week.lessons.map((lesson) => lesson.slug),
                        lessonMinutes: week.lessonMinutes,
                        activityMinutes: week.activityMinutes,
                        totalMinutes: week.totalMinutes,
                        activities: week.activities.map((activity) => ({
                            id: activity.id,
                            kind: activity.kind,
                            title: activity.title,
                            description: activity.description,
                            minutes: activity.minutes,
                            href: activity.href,
                            lessonSlug: activity.lessonSlug,
                            lessonSlugs: activity.lessonSlugs,
                            practiceSlug: activity.practiceSlug,
                            quizSlug: activity.quizSlug,
                            questions: activity.kind === "section"
                                ? buildSectionCheckQuestions((activity.lessonSlugs ?? []).map((slug) => {
                                    const lesson = lessonsBySlug.get(slug)
                                    if (!lesson) throw new Error(`Missing section-check lesson for iOS export: ${slug}`)
                                    const questions = extractMasteryQuiz(lesson.content).questions
                                    if (!questions) throw new Error(`Missing section-check questions for iOS export: ${slug}`)
                                    return { slug, title: lesson.title, questions }
                                }))
                                : undefined,
                            required: activity.kind === "coding" ? false : activity.required,
                        })),
                    })),
                    totalLessonMinutes: plan.totalLessonMinutes,
                    totalActivityMinutes: plan.totalActivityMinutes,
                    practiceMinutesPerWeek: plan.practiceMinutesPerWeek,
                    foundationBridgeLessonCount: plan.foundationBridgeLessonCount,
                }
            })
        )
    )
    writeJson(join(outputDataDir, "learning-plan.json"), { ...learningPlanConfiguration, plans })
}

function rewriteGlossaryField(value: string | undefined): string | undefined {
    if (!value) return value
    return rewriteBundleLinks(value)
}

function rewriteGlossaryEntry<T extends Record<string, unknown>>(entry: T): T {
    const rewritten = { ...entry } as Record<string, unknown>

    if (typeof rewritten.definition === "string") {
        rewritten.summary = glossaryPlainText(rewritten.definition)
    }

    for (const key of [
        "definition",
        "example",
        "relevance",
        "intuition",
        "formula",
        "decisionRule",
        "pitfall",
        "seeAlso",
    ] as const) {
        if (typeof rewritten[key] === "string") {
            rewritten[key] = rewriteGlossaryField(rewritten[key] as string)
        }
    }

    if (Array.isArray(rewritten.details)) {
        rewritten.details = (rewritten.details as { title: string; content: string }[]).map((detail) => ({
            ...detail,
            content: rewriteBundleLinks(detail.content),
        }))
    }

    if (Array.isArray(rewritten.usage)) {
        rewritten.usage = (rewritten.usage as { title: string; url: string; excerpt: string }[]).map((item) => ({
            ...item,
            excerpt: glossaryPlainText(rewriteBundleLinks(item.excerpt), 200),
        }))
    }

    // Collect image refs across all rewritten markdown fields for offline validation/debug.
    const textBlob = [
        rewritten.definition,
        rewritten.example,
        rewritten.relevance,
        rewritten.intuition,
        rewritten.formula,
        rewritten.decisionRule,
        rewritten.pitfall,
        rewritten.seeAlso,
        ...((rewritten.details as { content: string }[] | undefined)?.map((d) => d.content) ?? []),
    ]
        .filter((value): value is string => typeof value === "string")
        .join("\n")

    const images = extractImageRefs(textBlob)
    if (images.length > 0) {
        rewritten.images = images
    }

    return rewritten as T
}

function buildGlossary() {
    const glossary = GLOSSARY_ENTRIES_BY_IMPORTANCE.map((entry) => rewriteGlossaryEntry(entry as Record<string, unknown>))

    writeJson(join(outputDataDir, "glossary", "index.json"), glossary)
    return glossary.length
}

function buildPracticeMetadata() {
    const practice = getPracticeProblems().map((problem) => ({
        ...toPracticeListItem(problem),
        codingAvailableOnIOS: false,
    }))
    writeJson(join(outputDataDir, "practice", "index.json"), practice)
    return practice.length
}

function buildTheoryQuizzes() {
    const quizzes = getTheoryQuizzes()
    writeJson(join(outputDataDir, "theory-quizzes.json"), quizzes)
    return quizzes.length
}

function writeReadme() {
    writeFileSync(
        join(outputDataDir, "README.md"),
        [
            "# Bundled LeetLLM Data",
            "",
            "Generated by `pnpm --dir web ios:export`.",
            "",
            "This folder is copied into the iOS app bundle. Lessons, blogs, tracks, learning-plan configuration, glossary entries, quizzes, practice metadata, assets, and PNG images are available offline after install.",
            "",
        ].join("\n")
    )
}

ensureDir(outputDataDir)
for (const section of ["lessons", "blogs", "glossary", "practice"]) {
    rmSync(join(outputDataDir, section), { recursive: true, force: true })
}

copyContentImages()
copyContentAssets()
copyKatexAssets()
const lessonCount = buildLessons()
const blogCount = buildBlogs()
const tracks = buildTracks()
const trackCount = tracks.length
buildLearningPlanConfiguration(tracks)
const glossaryCount = buildGlossary()
const theoryQuizCount = buildTheoryQuizzes()
const practiceCount = buildPracticeMetadata()
writeReadme()

const imageFiles = walkFiles(imageOutputDir, (path) => extname(path).toLowerCase() === ".png")
const assetFiles = walkFiles(assetOutputDir, () => true)
const darkImages = imageFiles.filter((path) => path.endsWith("_dark.png")).length
const lightImages = imageFiles.filter((path) => path.endsWith("_light.png")).length
const bytes = imageFiles.reduce((sum, path) => sum + statSync(path).size, 0)

writeJson(join(outputDataDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    sourceModifiedAt: latestIOSSourceTimestamp(),
    lessonCount,
    blogCount,
    trackCount,
    glossaryCount,
    theoryQuizCount,
    practiceCount,
    copiedImageCount: imageFiles.length,
    copiedAssetCount: assetFiles.length,
    darkImages,
    lightImages,
    imageBytes: bytes,
})

console.log(`iOS export complete: ${lessonCount} lessons, ${blogCount} blogs, ${trackCount} tracks, ${glossaryCount} glossary entries`)
console.log(`Images copied: ${imageFiles.length} PNGs (${darkImages} dark, ${lightImages} light)`)
