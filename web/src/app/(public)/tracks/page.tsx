import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Route, Timer, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTrackLessons, getTracks } from "@/lib/tracks"

export const metadata: Metadata = {
    title: "Learning Tracks",
    description: "Focused LeetLLM lesson paths for AI foundations, production ML, research, RAG, agents, inference, training, and AI lab interview prep.",
    alternates: {
        canonical: "/tracks",
    },
    openGraph: {
        title: "Learning Tracks | LeetLLM",
        description: "Focused LeetLLM lesson paths for AI foundations, production ML, research, RAG, agents, inference, training, and AI lab interview prep.",
        url: "https://leetllm.com/tracks",
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
        title: "Learning Tracks | LeetLLM",
        description: "Focused LeetLLM lesson paths for AI foundations, production ML, research, RAG, agents, inference, training, and AI lab interview prep.",
        images: ["https://leetllm.com/default-og-image.png"],
    },
}

export const revalidate = false

export default function TracksPage() {
    const tracks = getTracks()

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "LeetLLM Learning Tracks",
        url: "https://leetllm.com/tracks",
        hasPart: tracks.map((track, index) => ({
            "@type": "Course",
            position: index + 1,
            name: track.title,
            description: track.description,
            url: `https://leetllm.com/tracks/${track.slug}`,
        })),
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <header className="mb-8 border-b border-border/35 pb-7 sm:mb-10">
                <div className="max-w-3xl">
                    <p className="text-sm font-medium text-primary/80">Tracks</p>
                    <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
                        Learn by outcome
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground/85 sm:text-lg">
                        What would you like to build or understand next? Pick a track and follow a smaller set of lessons toward that goal.
                    </p>
                </div>
            </header>

            <section className="grid gap-5 md:grid-cols-2" aria-label="Learning tracks">
                {tracks.map((track) => {
                    const lessons = getTrackLessons(track)

                    return (
                        <Card key={track.slug} className="border-border/50 bg-card/60">
                            <CardHeader>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{track.level}</Badge>
                                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Timer className="h-3.5 w-3.5" />
                                        {track.timeEstimate}
                                    </span>
                                </div>
                                <CardTitle className="text-2xl">{track.title}</CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                    {track.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-5">
                                <div className="grid gap-2 text-sm text-muted-foreground">
                                    <p className="flex gap-2">
                                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <span>{track.audience}</span>
                                    </p>
                                    <p className="flex gap-2">
                                        <Route className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <span>{track.outcome}</span>
                                    </p>
                                </div>

                                <div className="grid gap-2 border-t border-border/35 pt-4">
                                    {lessons.slice(0, 4).map((lesson) => (
                                        <Link
                                            key={lesson.slug}
                                            href={`/learn/${lesson.slug}`}
                                            className="group flex items-start gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/70"
                                        >
                                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                {lesson.index}
                                            </span>
                                            <span className="leading-snug text-foreground/85 group-hover:text-foreground">
                                                {lesson.title}
                                            </span>
                                        </Link>
                                    ))}
                                </div>

                                <Button asChild className="w-fit">
                                    <Link href={`/tracks/${track.slug}`}>
                                        View track
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </section>
        </div>
    )
}
