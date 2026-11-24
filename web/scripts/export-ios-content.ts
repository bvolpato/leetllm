import { constants, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "fs"
import { copyFile, mkdir, rm, stat } from "fs/promises"
import { basename, dirname, extname, join, relative, resolve } from "path"
import { getBlogPosts, type BlogPost } from "../src/lib/blog"
import { extractMasteryQuiz, type ExtractedMasteryQuiz } from "../src/lib/mastery-quiz"
import { getPracticeProblems, toPracticeListItem, type PracticeProblem } from "../src/lib/practice"
import { getQuestions, type Question } from "../src/lib/questions"
import { GLOSSARY_ENTRIES_BY_IMPORTANCE } from "../src/generated/glossary"
import { buildLearningPlan, learningPlanConfiguration } from "../src/lib/learning-plan"
import { getLearningPlanTracks } from "../src/lib/learning-plan-server"
import { buildSectionCheckQuestions } from "../src/lib/section-check"
import { getTracks } from "../src/lib/tracks"
import { getTheoryQuizzes, type TheoryQuiz } from "../src/lib/theory-quizzes"
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

type ScannedFile = {
    path: string
    rel: string
    size: number
    mtimeMs: number
}

type CopyImagesStats = {
    copiedImageCount: number
    darkImages: number
    lightImages: number
    imageBytes: number
}

const COPY_CONCURRENCY = 16

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, "..")
const contentRoot = join(webRoot, "src", "content")
const outputDataDir = join(repoRoot, "mobile", "ios", "LeetLLM", "LeetLLM", "Resources", "data")
const imageOutputDir = join(outputDataDir, "images")
const assetOutputDir = join(outputDataDir, "assets")
const katexOutputDir = join(outputDataDir, "katex")

const ensuredSyncDirs = new Set<string>()

function ensureDir(path: string) {
    if (ensuredSyncDirs.has(path)) return
    mkdirSync(path, { recursive: true })
    ensuredSyncDirs.add(path)
}

async function ensureDirAsync(path: string, createdDirs: Set<string>) {
    if (createdDirs.has(path)) return
    await mkdir(path, { recursive: true })
    createdDirs.add(path)
}

function writeTextIfChanged(path: string, content: string): boolean {
    ensureDir(dirname(path))
    if (existsSync(path)) {
        const existing = readFileSync(path, "utf8")
        if (existing === content) return false
    }
    writeFileSync(path, content)
    return true
}

function writeJsonIfChanged(path: string, value: unknown): boolean {
    return writeTextIfChanged(path, `${JSON.stringify(value)}\n`)
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

function pruneEmptyDirs(root: string, keepRoot = true) {
    if (!existsSync(root)) return
    for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            pruneEmptyDirs(join(root, entry.name), false)
        }
    }
    if (!keepRoot && readdirSync(root).length === 0) {
        rmSync(root, { recursive: true, force: true })
    }
}

async function runWithConcurrency<T>(
    items: readonly T[],
    concurrency: number,
    worker: (item: T) => Promise<void>,
) {
    let cursor = 0
    const workerCount = Math.min(concurrency, items.length)
    await Promise.all(
        Array.from({ length: workerCount }, async () => {
            while (cursor < items.length) {
                const index = cursor
                cursor += 1
                await worker(items[index])
            }
        }),
    )
}

async function copyFileCloneOrFallback(sourcePath: string, targetPath: string) {
    try {
        await copyFile(sourcePath, targetPath, constants.COPYFILE_FICLONE)
    } catch (error) {
        const code = (error as NodeJS.ErrnoException)?.code
        if (code === "ENOTSUP" || code === "ENOSYS" || code === "EXDEV" || code === "EPERM" || code === "EINVAL" || code === "EOPNOTSUPP") {
            await copyFile(sourcePath, targetPath)
            return
        }
        throw error
    }
}

async function copyFileIfChanged(
    sourcePath: string,
    targetPath: string,
    sourceSize: number,
    sourceMtimeMs: number,
    createdDirs: Set<string>,
) {
    try {
        const target = await stat(targetPath)
        if (target.size === sourceSize && target.mtimeMs >= sourceMtimeMs) {
            return
        }
    } catch {
        // Destination does not exist yet.
    }
    await ensureDirAsync(dirname(targetPath), createdDirs)
    await copyFileCloneOrFallback(sourcePath, targetPath)
}

function scanContentTree(belongsToPublicBundle: (path: string) => boolean) {
    const availableImages = new Map<string, ScannedFile>()
    const contentAssets: ScannedFile[] = []
    let maxContentMtimeMs = 0

    function visit(dir: string) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name)
            if (entry.isDirectory()) {
                visit(path)
                continue
            }
            const fileStat = statSync(path)
            if (fileStat.mtimeMs > maxContentMtimeMs) {
                maxContentMtimeMs = fileStat.mtimeMs
            }

            const rel = relative(contentRoot, path)
            const ext = extname(path).toLowerCase()
            const segments = path.split("/")

            if (ext === ".png") {
                const [section] = rel.split("/")
                if ((section === "blog" || basename(path) !== "social_banner.png") && belongsToPublicBundle(path)) {
                    availableImages.set(`images/${rel}`, {
                        path,
                        rel,
                        size: fileStat.size,
                        mtimeMs: fileStat.mtimeMs,
                    })
                }
            }

            if (
                segments.includes("assets")
                && !segments.includes("__pycache__")
                && !/\.py[co]$/i.test(path)
                && belongsToPublicBundle(path)
            ) {
                contentAssets.push({
                    path,
                    rel,
                    size: fileStat.size,
                    mtimeMs: fileStat.mtimeMs,
                })
            }
        }
    }

    if (existsSync(contentRoot)) {
        visit(contentRoot)
    }

    contentAssets.sort((left, right) => left.rel.localeCompare(right.rel))

    return { availableImages, contentAssets, maxContentMtimeMs }
}

async function copyReferencedImages(
    availableImages: Map<string, ScannedFile>,
    referencedImages: Set<string>,
    publicBlogSlugs: ReadonlySet<string>,
): Promise<CopyImagesStats> {
    const selected: ScannedFile[] = []
    const expectedRelPaths = new Set<string>()
    let darkImages = 0
    let lightImages = 0
    let imageBytes = 0

    for (const bundlePath of referencedImages) {
        const scanned = availableImages.get(bundlePath)
        if (!scanned) continue
        selected.push(scanned)
        expectedRelPaths.add(scanned.rel)
        if (scanned.rel.endsWith("_dark.png")) darkImages += 1
        if (scanned.rel.endsWith("_light.png")) lightImages += 1
        imageBytes += scanned.size
    }

    const exportedBlogImages = join(imageOutputDir, "blog")
    if (existsSync(exportedBlogImages)) {
        for (const entry of readdirSync(exportedBlogImages, { withFileTypes: true })) {
            if (entry.isDirectory() && !publicBlogSlugs.has(entry.name)) {
                rmSync(join(exportedBlogImages, entry.name), { recursive: true, force: true })
            }
        }
    }

    const staleImages = walkFiles(
        imageOutputDir,
        (path) => extname(path).toLowerCase() === ".png" && !expectedRelPaths.has(relative(imageOutputDir, path)),
    )
    await runWithConcurrency(staleImages, COPY_CONCURRENCY, async (stalePath) => {
        await rm(stalePath, { force: true })
    })

    const createdDirs = new Set<string>()
    await runWithConcurrency(selected, COPY_CONCURRENCY, async (image) => {
        const targetPath = join(imageOutputDir, image.rel)
        await copyFileIfChanged(image.path, targetPath, image.size, image.mtimeMs, createdDirs)
    })

    if (staleImages.length > 0) {
        pruneEmptyDirs(imageOutputDir, true)
    }

    return {
        copiedImageCount: selected.length,
        darkImages,
        lightImages,
        imageBytes,
    }
}

async function copyContentAssets(assets: ScannedFile[]): Promise<number> {
    const expectedRelPaths = new Set(assets.map((asset) => asset.rel))
    const staleAssets = walkFiles(
        assetOutputDir,
        (path) => !expectedRelPaths.has(relative(assetOutputDir, path)),
    )
    await runWithConcurrency(staleAssets, COPY_CONCURRENCY, async (stalePath) => {
        await rm(stalePath, { force: true })
    })

    const createdDirs = new Set<string>()
    await runWithConcurrency(assets, COPY_CONCURRENCY, async (asset) => {
        const targetPath = join(assetOutputDir, asset.rel)
        if (extname(asset.path).toLowerCase() === ".txt") {
            const normalized = readFileSync(asset.path, "utf8")
                .replace(/[ \t]+$/gm, "")
                .replace(/\n*$/, "\n")
            writeTextIfChanged(targetPath, normalized)
        } else {
            await copyFileIfChanged(asset.path, targetPath, asset.size, asset.mtimeMs, createdDirs)
        }
    })

    if (staleAssets.length > 0) {
        pruneEmptyDirs(assetOutputDir, true)
    }

    return assets.length
}

async function copyKatexAssets() {
    const katexDist = join(webRoot, "node_modules", "katex", "dist")
    const sourceFiles: [string, string][] = [
        [join(katexDist, "katex.min.css"), join(katexOutputDir, "katex.min.css")],
        [join(katexDist, "katex.min.js"), join(katexOutputDir, "katex.min.js")],
        [join(katexDist, "contrib", "auto-render.min.js"), join(katexOutputDir, "auto-render.min.js")],
    ]

    const fontsSourceDir = join(katexDist, "fonts")
    const fontsDir = join(katexOutputDir, "fonts")
    const fontFiles = walkFiles(fontsSourceDir, (path) => path.endsWith(".woff2"))
    const expectedFonts = new Set(fontFiles.map((font) => relative(fontsSourceDir, font)))

    for (const existingFont of walkFiles(fontsDir, () => true)) {
        if (!expectedFonts.has(relative(fontsDir, existingFont))) {
            rmSync(existingFont, { force: true })
        }
    }

    for (const font of fontFiles) {
        sourceFiles.push([font, join(fontsDir, relative(fontsSourceDir, font))])
    }

    const createdDirs = new Set<string>()
    await runWithConcurrency(sourceFiles, COPY_CONCURRENCY, async ([source, target]) => {
        const sourceStat = await stat(source)
        await copyFileIfChanged(source, target, sourceStat.size, sourceStat.mtimeMs, createdDirs)
    })
}

function latestIOSSourceTimestamp(maxContentMtimeMs: number): string {
    const extraFiles = [
        ...walkFiles(join(webRoot, "src", "lib"), (path) => [".ts", ".tsx", ".json"].includes(extname(path).toLowerCase())),
        join(webRoot, "src", "data", "theory-quizzes.json"),
        join(webRoot, "scripts", "generate-glossary.ts"),
        join(webRoot, "scripts", "glossary-sections.ts"),
        join(webRoot, "scripts", "ios-glossary-text.ts"),
        join(webRoot, "scripts", "ios-content-visibility.ts"),
        join(webRoot, "scripts", "export-ios-content.ts"),
    ]
    const latest = extraFiles.reduce((max, path) => Math.max(max, statSync(path).mtimeMs), maxContentMtimeMs)
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

function themePath(
    path: string | undefined,
    theme: "dark" | "light",
    availableImages: Map<string, ScannedFile>,
): string | undefined {
    if (!path) return undefined
    if (path.endsWith(`_${theme}.png`)) return availableImages.has(path) ? path : undefined
    const opposite = theme === "dark" ? "light" : "dark"
    if (path.endsWith(`_${opposite}.png`)) {
        const candidate = path.replace(`_${opposite}.png`, `_${theme}.png`)
        return availableImages.has(candidate) ? candidate : undefined
    }
    const candidate = path.replace(/\.png$/, `_${theme}.png`)
    return availableImages.has(candidate) ? candidate : undefined
}

function imageBundle(
    path: string | undefined,
    availableImages: Map<string, ScannedFile>,
    referencedImages: Set<string>,
) {
    const image = contentImageUrlToBundlePath(path)
    if (!image) return {}

    const coverImageDark = themePath(image, "dark", availableImages)
    const coverImageLight = themePath(image, "light", availableImages)
    if (image.startsWith("images/")) referencedImages.add(image)
    if (coverImageDark?.startsWith("images/")) referencedImages.add(coverImageDark)
    if (coverImageLight?.startsWith("images/")) referencedImages.add(coverImageLight)

    return {
        coverImage: image,
        coverImageDark,
        coverImageLight,
    }
}

function extractImageRefs(markdown: string, referencedImages?: Set<string>): ImageRef[] {
    const refs = new Map<string, ImageRef>()

    for (const match of markdown.matchAll(/<img\b([^>]*?)\bsrc="([^"]+)"([^>]*)>/g)) {
        const attributes = `${match[1]} ${match[3]}`
        const src = stripQuery(match[2])
        if (!src.startsWith("images/")) continue

        const alt = attributes.match(/\balt="([^"]*)"/)?.[1]
        const darkSrc = attributes.match(/\bdata-dark-src="([^"]+)"/)?.[1]
        const lightSrc = attributes.match(/\bdata-light-src="([^"]+)"/)?.[1]
        if (darkSrc || lightSrc) {
            if (!darkSrc || !lightSrc) {
                referencedImages?.add(src)
            }
            for (const [themedSrc, theme] of [[darkSrc, "dark"], [lightSrc, "light"]] as const) {
                if (!themedSrc) continue
                const path = stripQuery(themedSrc)
                if (path.startsWith("images/")) {
                    refs.set(path, { path, theme, alt })
                    referencedImages?.add(path)
                }
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
        referencedImages?.add(src)
    }

    for (const match of markdown.matchAll(/!\[([^\]]*)]\((images\/[^)]+)\)/g)) {
        const src = stripQuery(match[2])
        refs.set(src, { path: src, alt: match[1] })
        referencedImages?.add(src)
    }

    return [...refs.values()].sort((left, right) => left.path.localeCompare(right.path))
}

function referencesArray(references: Record<string, Omit<ReferenceRecord, "key">>): ReferenceRecord[] {
    return Object.entries(references).map(([key, reference]) => ({
        key,
        ...reference,
    }))
}

function pruneStaleJsonFiles(dir: string, expectedFileNames: Set<string>) {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile()) {
            rmSync(join(dir, entry.name), { recursive: true, force: true })
            continue
        }
        if (!expectedFileNames.has(entry.name)) {
            rmSync(join(dir, entry.name), { force: true })
        }
    }
}

function buildLessons(
    lessons: Question[],
    masteryQuizBySlug: Map<string, ExtractedMasteryQuiz>,
    availableImages: Map<string, ScannedFile>,
    referencedImages: Set<string>,
) {
    const lessonsDir = join(outputDataDir, "lessons")
    const expectedFiles = new Set<string>(["index.json"])

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
        ...imageBundle(lesson.coverImage, availableImages, referencedImages),
    }))

    writeJsonIfChanged(join(lessonsDir, "index.json"), lessonIndex)

    for (let position = 0; position < lessons.length; position += 1) {
        const lesson = lessons[position]
        const extracted = extractMasteryQuiz(lesson.content)
        masteryQuizBySlug.set(lesson.slug, extracted)
        const content = rewriteBundleLinks(extracted.content)
        const fileName = `${lesson.slug}.json`
        expectedFiles.add(fileName)
        writeJsonIfChanged(join(lessonsDir, fileName), {
            ...lessonIndex[position],
            content,
            rubricPoints: lesson.rubricPoints,
            followUpQuestions: lesson.followUpQuestions,
            commonPitfalls: lesson.commonPitfalls,
            references: referencesArray(lesson.references),
            masteryQuiz: extracted.questions,
            images: extractImageRefs(content, referencedImages),
        })
    }

    pruneStaleJsonFiles(lessonsDir, expectedFiles)
    return lessons.length
}

function buildBlogs(
    posts: BlogPost[],
    availableImages: Map<string, ScannedFile>,
    referencedImages: Set<string>,
) {
    const blogsDir = join(outputDataDir, "blogs")
    const expectedFiles = new Set<string>(["index.json"])

    const blogIndex = posts.map((post) => {
        const socialImage = contentImageUrlToBundlePath(post.socialImage)
        if (socialImage?.startsWith("images/")) {
            referencedImages.add(socialImage)
        }
        return {
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
            ...imageBundle(post.coverImage, availableImages, referencedImages),
            socialImage,
        }
    })

    writeJsonIfChanged(join(blogsDir, "index.json"), blogIndex)

    for (let position = 0; position < posts.length; position += 1) {
        const post = posts[position]
        const content = rewriteBundleLinks(post.content)
        const fileName = `${post.slug}.json`
        expectedFiles.add(fileName)
        writeJsonIfChanged(join(blogsDir, fileName), {
            ...blogIndex[position],
            content,
            references: referencesArray(post.references),
            images: extractImageRefs(content, referencedImages),
        })
    }

    pruneStaleJsonFiles(blogsDir, expectedFiles)
    return posts.length
}

function buildTracks(questions: Question[]) {
    const planTracks = new Map(getLearningPlanTracks(questions).map((track) => [track.slug, track]))
    const tracks = getTracks(questions).map((track) => ({
        ...track,
        ...planTracks.get(track.slug)!,
    }))
    writeJsonIfChanged(join(outputDataDir, "tracks.json"), tracks)
    return tracks
}

function buildLearningPlanConfiguration(
    tracks: ReturnType<typeof buildTracks>,
    questions: Question[],
    masteryQuizBySlug: Map<string, ExtractedMasteryQuiz>,
    practiceProblems: PracticeProblem[],
    theoryQuizzes: TheoryQuiz[],
) {
    const lessonsBySlug = new Map(questions.map((lesson) => [lesson.slug, lesson]))
    const catalog = {
        practiceProblems: practiceProblems.map(toPracticeListItem).map((problem) => ({
            slug: problem.slug,
            title: problem.title,
            summary: problem.summary,
            difficulty: problem.difficulty,
            timeEstimateMinutes: problem.timeEstimateMinutes,
        })),
        theoryQuizzes: theoryQuizzes.map((quiz) => ({
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
                                    const questions = masteryQuizBySlug.get(slug)?.questions ?? extractMasteryQuiz(lesson.content).questions
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
            }),
        ),
    )
    writeJsonIfChanged(join(outputDataDir, "learning-plan.json"), { ...learningPlanConfiguration, plans })
}

function rewriteGlossaryField(value: string | undefined): string | undefined {
    if (!value) return value
    return rewriteBundleLinks(value)
}

function rewriteGlossaryEntry<T extends Record<string, unknown>>(
    entry: T,
    referencedImages: Set<string>,
): T {
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

    const images = extractImageRefs(textBlob, referencedImages)
    if (images.length > 0) {
        rewritten.images = images
    }

    return rewritten as T
}

function buildGlossary(referencedImages: Set<string>) {
    const glossaryDir = join(outputDataDir, "glossary")
    const glossary = GLOSSARY_ENTRIES_BY_IMPORTANCE.map((entry) =>
        rewriteGlossaryEntry(entry as Record<string, unknown>, referencedImages),
    )

    writeJsonIfChanged(join(glossaryDir, "index.json"), glossary)
    pruneStaleJsonFiles(glossaryDir, new Set(["index.json"]))
    return glossary.length
}

function buildPracticeMetadata(practiceProblems: PracticeProblem[]) {
    const practiceDir = join(outputDataDir, "practice")
    const practice = practiceProblems.map((problem) => ({
        ...toPracticeListItem(problem),
        codingAvailableOnIOS: false,
    }))
    writeJsonIfChanged(join(practiceDir, "index.json"), practice)
    pruneStaleJsonFiles(practiceDir, new Set(["index.json"]))
    return practice.length
}

function buildTheoryQuizzes(quizzes: TheoryQuiz[]) {
    writeJsonIfChanged(join(outputDataDir, "theory-quizzes.json"), quizzes)
    return quizzes.length
}

function writeReadme() {
    writeTextIfChanged(
        join(outputDataDir, "README.md"),
        [
            "# Bundled LeetLLM Data",
            "",
            "Generated by `pnpm --dir web ios:export`.",
            "",
            "This folder is copied into the iOS app bundle. Lessons, blogs, tracks, learning-plan configuration, glossary entries, quizzes, practice metadata, assets, and PNG images are available offline after install.",
            "",
        ].join("\n"),
    )
}

async function main() {
    ensureDir(outputDataDir)

    const posts = getBlogPosts()
    const publicBlogSlugs = new Set(posts.map((post) => post.slug))
    const belongsToPublicBundle = createPublicContentBundleFilter(contentRoot, publicBlogSlugs)
    const { availableImages, contentAssets, maxContentMtimeMs } = scanContentTree(belongsToPublicBundle)

    const questions = getQuestions()
    const practiceProblems = getPracticeProblems()
    const theoryQuizzes = getTheoryQuizzes()
    const masteryQuizBySlug = new Map<string, ExtractedMasteryQuiz>()
    const referencedImages = new Set<string>()

    const lessonCount = buildLessons(questions, masteryQuizBySlug, availableImages, referencedImages)
    const blogCount = buildBlogs(posts, availableImages, referencedImages)
    const tracks = buildTracks(questions)
    const trackCount = tracks.length
    buildLearningPlanConfiguration(tracks, questions, masteryQuizBySlug, practiceProblems, theoryQuizzes)
    const glossaryCount = buildGlossary(referencedImages)
    const theoryQuizCount = buildTheoryQuizzes(theoryQuizzes)
    const practiceCount = buildPracticeMetadata(practiceProblems)
    writeReadme()

    const [imageStats, copiedAssetCount] = await Promise.all([
        copyReferencedImages(availableImages, referencedImages, publicBlogSlugs),
        copyContentAssets(contentAssets),
        copyKatexAssets(),
    ])

    writeJsonIfChanged(join(outputDataDir, "manifest.json"), {
        generatedAt: new Date().toISOString(),
        sourceModifiedAt: latestIOSSourceTimestamp(maxContentMtimeMs),
        lessonCount,
        blogCount,
        trackCount,
        glossaryCount,
        theoryQuizCount,
        practiceCount,
        copiedImageCount: imageStats.copiedImageCount,
        copiedAssetCount,
        darkImages: imageStats.darkImages,
        lightImages: imageStats.lightImages,
        imageBytes: imageStats.imageBytes,
    })

    console.log(`iOS export complete: ${lessonCount} lessons, ${blogCount} blogs, ${trackCount} tracks, ${glossaryCount} glossary entries`)
    console.log(`Images copied: ${imageStats.copiedImageCount} PNGs (${imageStats.darkImages} dark, ${imageStats.lightImages} light)`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
