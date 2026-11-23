import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs"
import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"
import { loadContentBundle } from "../src/lib/content-bundle"
import { isVisibleToAudience } from "../src/lib/content-audience"

const rootDir = process.cwd()
const contentDir = join(rootDir, "src", "content")
const outputPath = join(rootDir, "src", "generated", "content-route-index.json")
const aliasesOutputPath = join(rootDir, "src", "generated", "content-aliases.json")
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const questionFolders = [
    "foundations",
    "preparation",
    "fundamentals",
    "agents",
    "retrieval",
    "llmops",
    "training",
    "system-design",
    "interviewing",
    "projects",
]

type QuestionRoute = {
    directory: string
    canonicalSlug: string
    hidden: boolean
}

type BlogRoute = {
    directory: string
    canonicalSlug: string
    aliases: string[]
    draft: boolean
    private: boolean
    hidden?: boolean
    redirectTo?: string
}

type PendingQuestionRoute = QuestionRoute & {
    aliases: string[]
    source: string
}

type BlogAliasClaim = {
    alias: string
    target: string
    source: string
}

function requireSlug(value: unknown, source: string, field = "slug"): string {
    if (typeof value !== "string" || !slugPattern.test(value)) {
        throw new Error(`${source}: ${field} must contain a lowercase kebab-case slug`)
    }
    return value
}

function readAliases(value: unknown, source: string): string[] {
    if (value === undefined || value === null) return []
    if (!Array.isArray(value)) throw new Error(`${source}: aliases must be a string array`)
    return value.map((alias) => requireSlug(alias, source, "alias"))
}

function articleDirectories(parentDir: string): string[] {
    if (!existsSync(parentDir)) return []
    return readdirSync(parentDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
}

function sortedRecord<T>(entries: Iterable<[string, T]>): Record<string, T> {
    return Object.fromEntries([...entries].sort(([left], [right]) => left.localeCompare(right)))
}

export function buildContentRouteManifests(sourceContentDir: string) {
    const pendingQuestions: PendingQuestionRoute[] = []
    for (const folder of questionFolders) {
        const sectionDir = join(sourceContentDir, folder)
        for (const directoryName of articleDirectories(sectionDir)) {
            const bundle = loadContentBundle(join(sectionDir, directoryName))
            if (!bundle) continue
            const source = bundle.metadataPath ?? bundle.contentPath
            const canonicalSlug = requireSlug(bundle.metadata.slug, source)
            const aliases = readAliases(bundle.metadata.aliases, source)
            pendingQuestions.push({
                directory: `${folder}/${directoryName}`,
                canonicalSlug,
                aliases,
                hidden: !isVisibleToAudience(bundle.metadata, "website"),
                source,
            })
        }
    }

    const questions = new Map<string, QuestionRoute>()
    const questionSources = new Map<string, string>()
    for (const question of pendingQuestions) {
        const existingSource = questionSources.get(question.canonicalSlug)
        if (existingSource) {
            throw new Error(`${question.source}: slug ${question.canonicalSlug} is already owned by ${existingSource}`)
        }
        questionSources.set(question.canonicalSlug, question.source)
        questions.set(question.canonicalSlug, {
            directory: question.directory,
            canonicalSlug: question.canonicalSlug,
            hidden: question.hidden,
        })
    }
    for (const question of pendingQuestions) {
        for (const alias of question.aliases) {
            if (questions.has(alias)) {
                throw new Error(`${question.source}: alias ${alias} conflicts with ${questionSources.get(alias) ?? "another alias"}`)
            }
            questions.set(alias, {
                directory: question.directory,
                canonicalSlug: question.canonicalSlug,
                hidden: question.hidden,
            })
            questionSources.set(alias, question.source)
        }
    }

    const blogs = new Map<string, BlogRoute>()
    const blogSources = new Map<string, string>()
    const blogAliasClaims: BlogAliasClaim[] = []
    const routableBlogSlugs = new Set<string>()
    const blogDir = join(sourceContentDir, "blog")
    for (const directoryName of articleDirectories(blogDir)) {
        const bundle = loadContentBundle(join(blogDir, directoryName))
        if (!bundle) continue
        const source = bundle.metadataPath ?? bundle.contentPath
        const canonicalSlug = requireSlug(bundle.metadata.slug, source)
        if (blogs.has(canonicalSlug)) {
            throw new Error(`${source}: duplicate blog slug ${canonicalSlug}`)
        }
        const aliases = readAliases(bundle.metadata.aliases, source)
        const draft = bundle.metadata.draft === true
        const privatePost = bundle.metadata.private === true
        const hidden = !isVisibleToAudience(bundle.metadata, "website")
        const redirectTo = bundle.metadata.redirectTo
        if (redirectTo !== undefined && (typeof redirectTo !== "string" || !/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(redirectTo))) {
            throw new Error(`${source}: redirectTo must be /blog/<slug>`)
        }
        const redirectTarget = redirectTo?.slice("/blog/".length)
        if (redirectTarget === canonicalSlug) {
            throw new Error(`${source}: redirectTo points to itself`)
        }
        if (aliases.length > 0 && (draft || redirectTo !== undefined)) {
            throw new Error(`${source}: aliases must belong to a non-draft canonical post`)
        }
        for (const alias of aliases) {
            if (alias === canonicalSlug) {
                throw new Error(`${source}: alias duplicates canonical slug ${canonicalSlug}`)
            }
            if (!hidden) blogAliasClaims.push({ alias, target: canonicalSlug, source })
        }
        if (redirectTarget && !hidden) {
            blogAliasClaims.push({ alias: canonicalSlug, target: redirectTarget, source })
        }
        if (!draft && !redirectTo && !hidden) {
            routableBlogSlugs.add(canonicalSlug)
        }
        blogSources.set(canonicalSlug, source)
        blogs.set(canonicalSlug, {
            directory: `blog/${directoryName}`,
            canonicalSlug,
            aliases,
            draft,
            private: privatePost,
            ...(hidden ? { hidden: true } : {}),
            ...(redirectTo ? { redirectTo } : {}),
        })
    }

    const blogAliases = new Map<string, string>()
    for (const claim of blogAliasClaims) {
        const canonicalSource = blogSources.get(claim.alias)
        if (canonicalSource && canonicalSource !== claim.source) {
            throw new Error(`${claim.source}: blog alias ${claim.alias} conflicts with canonical slug owned by ${canonicalSource}`)
        }
        if (blogAliases.has(claim.alias)) {
            throw new Error(`${claim.source}: blog alias ${claim.alias} is declared more than once`)
        }
        blogAliases.set(claim.alias, claim.target)
    }
    const missingTargets = [...new Set(blogAliases.values())]
        .filter((target) => !routableBlogSlugs.has(target))
        .sort()
    if (missingTargets.length > 0) {
        throw new Error(`Blog aliases and redirects must target website-visible non-draft canonical posts: ${missingTargets.join(", ")}`)
    }

    const glossaryDir = join(sourceContentDir, "glossary")
    const glossary = existsSync(glossaryDir)
        ? readdirSync(glossaryDir, { withFileTypes: true })
            .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
            .map((entry) => requireSlug(entry.name.slice(0, -3), entry.name))
            .sort()
        : []

    return {
        routes: {
            questions: sortedRecord(questions),
            blogs: sortedRecord(blogs),
            glossary,
        },
        aliases: {
            learn: sortedRecord(
                pendingQuestions.filter((question) => !question.hidden).flatMap((question) =>
                    question.aliases.map((alias): [string, string] => [alias, question.canonicalSlug]),
                ),
            ),
            blog: sortedRecord(blogAliases),
        },
    }
}

export function buildContentRouteIndex(sourceContentDir: string) {
    return buildContentRouteManifests(sourceContentDir).routes
}

export function writeContentRouteManifests(
    sourceContentDir: string,
    routesPath: string,
    aliasesPath: string,
) {
    const manifests = buildContentRouteManifests(sourceContentDir)
    mkdirSync(dirname(routesPath), { recursive: true })
    mkdirSync(dirname(aliasesPath), { recursive: true })
    writeFileSync(routesPath, JSON.stringify(manifests.routes, null, 2) + "\n")
    writeFileSync(aliasesPath, JSON.stringify(manifests.aliases, null, 2) + "\n")
    return manifests
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const { routes, aliases } = writeContentRouteManifests(contentDir, outputPath, aliasesOutputPath)
    console.log(
        `Wrote ${outputPath} with ${Object.keys(routes.questions).length} question routes, `
        + `${Object.keys(routes.blogs).length} blog routes, and ${routes.glossary.length} glossary routes`,
    )
    console.log(
        `Wrote ${aliasesOutputPath} with ${Object.keys(aliases.learn).length} learn aliases and `
        + `${Object.keys(aliases.blog).length} blog aliases/redirects`,
    )
}
