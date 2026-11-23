import { getQuestions } from "@/lib/questions"
import { getBlogPosts } from "@/lib/blog"
import { getPracticeProblems } from "@/lib/practice"
import { getTracks } from "@/lib/tracks"
import type { MetadataRoute } from "next"

const BASE_URL = "https://leetllm.com"

function latestBlogLastModified(): Date | undefined {
    const blogDates = getBlogPosts()
        .map((post) => post.updatedAt || post.publishedAt)
        .filter(Boolean)
        .map((dateString) => new Date(dateString))

    if (blogDates.length === 0) return undefined
    return new Date(Math.max(...blogDates.map((date) => date.getTime())))
}

export default function sitemap(): MetadataRoute.Sitemap {
    const questions = getQuestions()
    const lessonDates = questions
        .map((question) => question.lastModified)
        .filter((dateString): dateString is string => Boolean(dateString))
        .map((dateString) => new Date(dateString))
    const latestLessonUpdate = lessonDates.length > 0
        ? new Date(Math.max(...lessonDates.map((date) => date.getTime())))
        : undefined
    const latestBlogUpdate = latestBlogLastModified()

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: latestLessonUpdate,
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/learn`,
            lastModified: latestLessonUpdate,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/start`,
            lastModified: latestLessonUpdate,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/glossary`,
            lastModified: latestLessonUpdate,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/blog`,
            lastModified: latestBlogUpdate,
            changeFrequency: "weekly",
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/tracks`,
            lastModified: latestLessonUpdate,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/practice`,
            lastModified: latestLessonUpdate,
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/privacy`,
            changeFrequency: "yearly",
            priority: 0.2,
        },
        {
            url: `${BASE_URL}/terms`,
            changeFrequency: "yearly",
            priority: 0.2,
        },
    ]

    // Include all articles because the curriculum is currently open.
    const articlePages: MetadataRoute.Sitemap = questions.map((q) => {
        return {
            url: `${BASE_URL}/learn/${q.slug}`,
            lastModified: q.lastModified ? new Date(q.lastModified) : undefined,
            changeFrequency: "monthly" as const,
            priority: 0.8,
        }
    })

    // Blog posts — use actual metadata publishedAt/updatedAt dates
    const blogPosts = getBlogPosts()
    const blogPages: MetadataRoute.Sitemap = blogPosts.map((p) => {
        const dateString = p.updatedAt || p.publishedAt
        const lastModified = dateString ? new Date(dateString) : new Date()

        return {
            url: `${BASE_URL}/blog/${p.slug}`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        }
    })

    const practicePages: MetadataRoute.Sitemap = getPracticeProblems().map((problem) => ({
        url: `${BASE_URL}/practice/${problem.slug}`,
        lastModified: latestLessonUpdate,
        changeFrequency: "monthly" as const,
        priority: 0.6,
    }))

    const trackPages: MetadataRoute.Sitemap = getTracks().map((track) => ({
        url: `${BASE_URL}/tracks/${track.slug}`,
        lastModified: latestLessonUpdate,
        changeFrequency: "monthly" as const,
        priority: 0.7,
    }))

    return [...staticPages, ...articlePages, ...blogPages, ...practicePages, ...trackPages]
}
