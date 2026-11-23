import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, ArrowRight, BookOpen, Clock, Route } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getTrackBySlug, getTrackLessons, getTracks } from "@/lib/tracks"
import { difficultyConfig } from "@/lib/questions"

type PageProps = {
    params: Promise<{ slug: string }>
}

export function generateStaticParams() {
    return getTracks().map((track) => ({ slug: track.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const track = getTrackBySlug(slug)

    if (!track) {
        return {
            title: "Track Not Found",
            robots: { index: false, follow: false },
        }
    }

    return {
        title: track.title,
        description: track.description,
        alternates: {
            canonical: `/tracks/${track.slug}`,
        },
        openGraph: {
            title: `${track.title} | LeetLLM`,
            description: track.description,
            url: `https://leetllm.com/tracks/${track.slug}`,
            type: "website",
            images: [
                {
                    url: "https://leetllm.com/default-og-image.png",
                    width: 1200,
                    height: 630,
                    alt: "LeetLLM Open Graph Image",
                    type: "image/png",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${track.title} | LeetLLM`,
            description: track.description,
            images: ["https://leetllm.com/default-og-image.png"],
        },
    }
}

export default async function TrackPage({ params }: PageProps) {
    const { slug } = await params
    const track = getTrackBySlug(slug)

    if (!track) notFound()

    const lessons = getTrackLessons(track)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Course",
        name: track.title,
        description: track.description,
        url: `https://leetllm.com/tracks/${track.slug}`,
        hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: track.timeEstimate,
        },
        hasPart: lessons.map((lesson) => ({
            "@type": "LearningResource",
            position: lesson.index,
            name: lesson.title,
            url: `https://leetllm.com/learn/${lesson.slug}`,
        })),
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="mb-6">
                <Button asChild variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground">
                    <Link href="/tracks">
                        <ArrowLeft className="h-4 w-4" />
                        Tracks
                    </Link>
                </Button>
            </div>

            <header className="border-b border-border/35 pb-7">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{track.level}</Badge>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {track.timeEstimate}
                    </span>
                </div>
                <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{track.title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground/85 sm:text-lg">
                    {track.description}
                </p>
                <div className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                    <p className="flex gap-2">
                        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{track.audience}</span>
                    </p>
                    <p className="flex gap-2">
                        <Route className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{track.outcome}</span>
                    </p>
                </div>
            </header>

            <section className="mt-8" aria-label={`${track.title} lessons`}>
                <ol className="grid gap-3">
                    {lessons.map((lesson) => {
                        const diff = difficultyConfig[lesson.difficulty]

                        return (
                            <li key={lesson.slug}>
                                <Link
                                    href={`/learn/${lesson.slug}`}
                                    className="group grid gap-3 rounded-lg border border-border/45 bg-card/45 p-4 transition-colors hover:border-primary/40 hover:bg-card/70 sm:grid-cols-[auto_1fr_auto] sm:items-start"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                        {lesson.index}
                                    </span>
                                    <span className="grid gap-1">
                                        <span className="font-semibold text-foreground group-hover:text-primary">
                                            {lesson.title}
                                        </span>
                                        <span className="text-sm leading-relaxed text-muted-foreground">
                                            {lesson.shortDescription}
                                        </span>
                                        <span className="text-xs text-muted-foreground/80">
                                            {lesson.section}
                                        </span>
                                    </span>
                                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
                                        <span className={`rounded-full border px-2 py-1 ${diff.bg} ${diff.border} ${diff.color}`}>
                                            {lesson.difficulty}
                                        </span>
                                        <span>{lesson.timeEstimate} min</span>
                                        <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ol>
            </section>
        </div>
    )
}
