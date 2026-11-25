import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Brain, Terminal, Zap, ArrowRight, Route, BookOpen, Shield } from "lucide-react"
import { TrackedCta } from "@/components/tracked-cta"
import {
  HOME_LESSON_COUNT,
  HOME_PRACTICE_PROBLEM_COUNT,
  HOME_THEORY_QUIZ_COUNT,
  HOME_UPDATED_LABEL,
} from "@/lib/home-stats"
import type { Metadata } from "next"

// Content ships with the image.
export const revalidate = false

const homeDescription = `${HOME_LESSON_COUNT} free lessons, ${HOME_THEORY_QUIZ_COUNT} global quizzes, and ${HOME_PRACTICE_PROBLEM_COUNT} coding drills covering Transformers, RAG pipelines, inference optimization, and agentic systems.`

export const metadata: Metadata = {
  title: {
    absolute: "LeetLLM | Master AI & LLMs From First Principles",
  },
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LeetLLM | Master AI & LLMs From First Principles",
    description: homeDescription,
    url: "https://leetllm.com",
    type: "website",
    images: [
      {
        url: "https://leetllm.com/default-og-image.png",
        width: 1200,
        height: 630,
        alt: "LeetLLM Open Graph Image",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LeetLLM | Master AI & LLMs From First Principles",
    description: homeDescription,
    images: ["https://leetllm.com/default-og-image.png"],
  }
}

const features = [
  {
    icon: Brain,
    title: "Guided Lessons",
    description: "Start with a question, work through a small example, and follow the reasoning into Transformers, retrieval, and agents.",
  },
  {
    icon: Terminal,
    title: "System Design",
    description: "Work through the decisions behind a useful AI product: what it needs to remember, retrieve, run, and measure.",
  },
  {
    icon: Zap,
    title: "Practice Loops",
    description: `Put an idea to work, see what you missed, and try again with ${HOME_THEORY_QUIZ_COUNT} global quizzes and ${HOME_PRACTICE_PROBLEM_COUNT} coding drills.`,
  },
  {
    icon: BookOpen,
    title: "Source Trail",
    description: "Follow an idea back to its source. Read the papers behind attention, efficient inference, and model alignment alongside the explanations.",
  },
  {
    icon: Route,
    title: "Focused Tracks",
    description: "Choose what you want to build or understand, then follow a smaller set of lessons that helps you get there.",
  },
  {
    icon: Shield,
    title: "Engineering Review",
    description: "Learn to question a result, inspect its assumptions, and check the papers and documentation before using it in your own system.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient bg-grid relative">
        <div className="relative z-10 container mx-auto flex max-w-5xl flex-col items-center gap-6 text-center px-4 pt-20 pb-24 md:pt-32 md:pb-36">
          <Badge variant="secondary" className="max-w-full shrink whitespace-normal rounded-full border border-border/70 bg-card/80 px-4 py-1.5 text-center text-xs font-medium leading-5 text-muted-foreground">
            {HOME_LESSON_COUNT} Lessons · {HOME_THEORY_QUIZ_COUNT} Quizzes · {HOME_PRACTICE_PROBLEM_COUNT} Coding Drills · {HOME_UPDATED_LABEL}
          </Badge>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Master{" "}
            <span className="gradient-text">AI &amp; LLMs</span>
            <br />
            From First Principles
          </h1>

          <p className="max-w-2xl leading-relaxed text-muted-foreground text-lg sm:text-xl">
            Understand how models work by following the reasoning and running the code yourself.
            Build knowledge you can bring to your own projects and <strong className="text-foreground/85 font-semibold">AI/ML interviews</strong>, one lesson at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 mt-2">
            <TrackedCta location="hero" label="Build My Plan">
              <Button asChild size="lg" className="px-8 text-base">
                <Link href="/start">
                  Build My Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </TrackedCta>
            <TrackedCta location="hero" label="Browse Tracks">
              <Button asChild variant="outline" size="lg" className="px-8 text-base border-border/70">
                <Link href="/tracks">
                  Browse Tracks
                </Link>
              </Button>
            </TrackedCta>
          </div>
          <TrackedCta location="hero" label="Browse all lessons">
            <Link href="/learn" className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Browse all lessons
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </TrackedCta>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center space-y-4 text-center mb-14">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-wider">
              Features
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold">
              Choose the path that matches{" "}
              <span className="gradient-text">your goal</span>
            </h2>
            <p className="max-w-2xl text-muted-foreground text-lg">
              Start with the foundations, or pick a track around something you want to build.
              Each gives you a place to begin and a next step to work toward.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="glow-card bg-card/60 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Open Access Section */}
      <section id="open-access" className="py-20 md:py-28 border-t border-border/50">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center space-y-4 text-center mb-14">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-wider">
              Open Access
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold">
              All lessons are{" "}
              <span className="gradient-text">free</span>
            </h2>
            <p className="max-w-2xl text-muted-foreground text-lg">
              LeetLLM is a nonprofit educational project. The full curriculum is open source.
              Lessons and coding practice will always be free. Read and practice without an account.
              Sign in to sync your progress, notes, and bookmarks across devices.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
            <Card className="flex flex-col glow-card bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl">Read Everything</CardTitle>
                <CardDescription>Every lesson is open. Progress, notes, and bookmarks can stay on this device.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 flex-1">
                <ul className="grid gap-3 text-sm text-muted-foreground mt-2">
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> Full access to every lesson</li>
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> {HOME_LESSON_COUNT} expert deep-dive lessons</li>
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> {HOME_THEORY_QUIZ_COUNT} global theory quizzes</li>
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> {HOME_PRACTICE_PROBLEM_COUNT} coding drills</li>
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> Research Paper References</li>
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> Architecture diagrams &amp; code examples</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="flex flex-col open-access-highlight bg-card border-primary/35 shadow-sm relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-2xl">Create Account</CardTitle>
                  <Badge variant="secondary" className="text-[11px] font-medium text-muted-foreground">
                    Optional
                  </Badge>
                </div>
                <CardDescription>Sync your study history across devices, personalize lessons, and join discussions.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 flex-1">
                <ul className="grid gap-3 text-sm text-muted-foreground mt-2">
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> Save read/unread status</li>
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> Resume across devices</li>
                  <li className="flex items-center"><Check className="mr-2.5 h-4 w-4 text-primary flex-shrink-0" /> Comment while signed in</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <TrackedCta location="open_access_section" label="Browse Curriculum">
              <Button asChild size="lg" className="px-8">
                <Link href="/learn">
                  Browse Curriculum
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </TrackedCta>
            <TrackedCta location="open_access_section" label="Create Free Account">
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link href="/signup">
                  Create Free Account
                </Link>
              </Button>
            </TrackedCta>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 hero-gradient bg-grid border-t border-border/50">
        <div className="relative z-10 container mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ready to build real AI systems?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Tell us what you want to learn, where you are starting, and how much time you have.
            We will turn that into a four-to-twenty-week plan you can work through at your own pace.
          </p>
          <TrackedCta location="bottom_cta" label="Build My Plan">
            <Button asChild size="lg" className="px-10 text-base">
              <Link href="/start">
                Build My Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </TrackedCta>
        </div>
      </section>
    </div>
  )
}
