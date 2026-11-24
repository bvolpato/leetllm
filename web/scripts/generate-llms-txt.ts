import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { getBlogPosts } from "../src/lib/blog"
import { getPracticeProblems } from "../src/lib/practice"
import { getQuestions, type Question } from "../src/lib/questions"
import { getTrackLessons, getTracks } from "../src/lib/tracks"

const BASE_URL = "https://leetllm.com"
const outputPath = join(process.cwd(), "public", "llms.txt")

function normalizeText(value: string): string {
    return value
        .replace(/<span\s+[^>]*data-glossary="[^"]+"[^>]*>([\s\S]*?)<\/span>/g, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/\[\^.+?]/g, "")
        .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[–—]/g, "-")
        .replace(/…/g, "...")
        .replace(/\s+/g, " ")
        .trim()
}

function trimNote(value: string, limit = 190): string {
    const text = normalizeText(value)
    if (text.length <= limit) return text
    return `${text.slice(0, limit).replace(/\s+\S*$/, "").trim()}...`
}

function link(label: string, url: string, note: string): string {
    return `- [${normalizeText(label)}](${url}): ${trimNote(note)}`
}

function lessonUrl(slug: string): string {
    return `${BASE_URL}/learn/${slug}`
}

function blogUrl(slug: string): string {
    return `${BASE_URL}/blog/${slug}`
}

function trackUrl(slug: string): string {
    return `${BASE_URL}/tracks/${slug}`
}

function practiceUrl(slug: string): string {
    return `${BASE_URL}/practice/${slug}`
}

function groupLessonsBySection(lessons: Question[]): Map<string, Question[]> {
    const grouped = new Map<string, Question[]>()

    for (const lesson of lessons) {
        const current = grouped.get(lesson.section) ?? []
        current.push(lesson)
        grouped.set(lesson.section, current)
    }

    return grouped
}

function renderLlmsTxt(): string {
    const lessons = getQuestions()
    const blogs = getBlogPosts()
    const tracks = getTracks()
    const practiceProblems = getPracticeProblems()

    const lines: string[] = [
        "# LeetLLM",
        "",
        `> LeetLLM is an open AI engineering curriculum with ${lessons.length} lessons, ${tracks.length} learning tracks, ${practiceProblems.length} practice problems, and ${blogs.length} public blog posts covering ML foundations, LLM systems, RAG, agents, training, inference, evaluation, AI lab interview prep, and open-source project deep dives.`,
        "",
        "Use this file to route agents and retrieval systems to the most relevant LeetLLM pages. Lesson pages are public and include explanations, code, diagrams, illustrations, references, practice prompts, pitfalls, and follow-up questions. Blog pages cover timely AI engineering topics and include published or updated dates in their metadata.",
        "",
        "Canonical URLs below point to public web pages. This file is for inference-time navigation and context selection; it does not replace robots.txt, sitemap.xml, or the site license.",
        "",
        "## Primary Pages",
        "",
        link("Home", BASE_URL, "Site overview and current entry point."),
        link("Build a Plan", `${BASE_URL}/start`, "Three-question planner that turns a goal, experience level, and weekly time into a focused four-to-twenty-week curriculum path."),
        link("Learn", `${BASE_URL}/learn`, `${lessons.length} ordered lessons across foundations, applied LLM engineering, training, agents, retrieval, inference, system design, interviewing, and open-source project deep dives.`),
        link("Tracks", `${BASE_URL}/tracks`, `${tracks.length} curated subsets of lessons for different learner goals.`),
        link("Practice", `${BASE_URL}/practice`, `${practiceProblems.length} coding practice problems plus global theory quizzes in the practice UI.`),
        link("Blog", `${BASE_URL}/blog`, `${blogs.length} public posts on AI engineering, models, tools, infrastructure, interviews, and learning paths.`),
        link("Blog RSS", `${BASE_URL}/blog/rss.xml`, "RSS feed for public blog posts."),
        link("Sitemap", `${BASE_URL}/sitemap.xml`, "Full XML sitemap for crawlers."),
        "",
        "## Learning Tracks",
        "",
    ]

    for (const track of tracks) {
        const lessonCount = getTrackLessons(track, lessons).length
        lines.push(link(track.title, trackUrl(track.slug), `${track.level}; ${lessonCount} lessons; ${track.audience} Outcome: ${track.outcome}`))
    }

    for (const [section, sectionLessons] of groupLessonsBySection(lessons)) {
        lines.push("", `## Curriculum: ${section}`, "")
        for (const lesson of sectionLessons) {
            lines.push(link(
                lesson.title,
                lessonUrl(lesson.slug),
                `${lesson.difficulty}; ${lesson.timeEstimate} min; ${lesson.category}; ${lesson.shortDescription}`,
            ))
        }
    }

    lines.push("", "## Blog Posts", "")
    for (const post of blogs) {
        const updated = post.updatedAt && post.updatedAt !== post.publishedAt
            ? `updated ${post.updatedAt}`
            : `published ${post.publishedAt}`
        lines.push(link(post.title, blogUrl(post.slug), `${updated}; tags: ${post.tags.join(", ")}; ${post.excerpt}`))
    }

    lines.push("", "## Practice Problems", "")
    for (const problem of practiceProblems) {
        lines.push(link(
            problem.title,
            practiceUrl(problem.slug),
            `${problem.difficulty}; ${problem.timeEstimateMinutes} min; ${problem.category}; languages: ${Object.keys(problem.languages).join(", ")}; ${problem.summary}`,
        ))
    }

    lines.push(
        "",
        "## Optional",
        "",
        link("Privacy Policy", `${BASE_URL}/privacy`, "Privacy policy for user accounts, progress, analytics, and site data."),
        link("Terms", `${BASE_URL}/terms`, "Terms for using LeetLLM."),
    )

    return `${lines.join("\n")}\n`
}

mkdirSync(dirname(outputPath), { recursive: true })
const content = renderLlmsTxt()
if (existsSync(outputPath) && readFileSync(outputPath, "utf8") === content) {
    console.log(`Unchanged ${outputPath}`)
} else {
    writeFileSync(outputPath, content)
    console.log(`Wrote ${outputPath}`)
}
