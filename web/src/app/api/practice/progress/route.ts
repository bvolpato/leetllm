import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPracticeProblem } from "@/lib/practice"
import { getTheoryQuiz } from "@/lib/theory-quizzes"

const PRACTICE_PREFIX = "practice:"
const THEORY_QUIZ_PREFIX = "practice-quiz:"

type ProgressKind = "coding" | "quiz"

function getProgressKind(request: NextRequest, bodyKind?: unknown): ProgressKind {
    const rawKind = typeof bodyKind === "string"
        ? bodyKind
        : request.nextUrl.searchParams.get("kind")
    return rawKind === "quiz" ? "quiz" : "coding"
}

function prefixForKind(kind: ProgressKind) {
    return kind === "quiz" ? THEORY_QUIZ_PREFIX : PRACTICE_PREFIX
}

function toStoredSlug(slug: string, kind: ProgressKind) {
    return `${prefixForKind(kind)}${slug}`
}

function fromStoredSlug(slug: string, kind: ProgressKind) {
    const prefix = prefixForKind(kind)
    return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug
}

function isValidProgressSlug(slug: string, kind: ProgressKind) {
    return kind === "quiz" ? Boolean(getTheoryQuiz(slug)) : Boolean(getPracticeProblem(slug))
}

export async function GET(request: NextRequest) {
    const kind = getProgressKind(request)
    const prefix = prefixForKind(kind)
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ slugs: [] })
    }

    const { data, error } = await supabase
        .from("user_read_progress")
        .select("article_slug,read_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .like("article_slug", `${prefix}%`)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        slugs: data.map((row: { article_slug: string }) => fromStoredSlug(row.article_slug, kind)),
        completed: data.map((row: { article_slug: string; read_at: string }) => ({
            slug: fromStoredSlug(row.article_slug, kind),
            completedAt: row.read_at,
        })),
    })
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const kind = getProgressKind(request, body.kind)
    const { slug } = body
    if (typeof slug !== "string" || !isValidProgressSlug(slug, kind)) {
        return NextResponse.json({ error: "Invalid progress slug" }, { status: 400 })
    }

    const { error } = await supabase.from("user_read_progress").upsert(
        { user_id: user.id, article_slug: toStoredSlug(slug, kind), completed: true, read_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: "user_id,article_slug" }
    )

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const kind = getProgressKind(request, body.kind)
    const { slug } = body
    if (typeof slug !== "string" || !isValidProgressSlug(slug, kind)) {
        return NextResponse.json({ error: "Invalid progress slug" }, { status: 400 })
    }

    const { error } = await supabase.from("user_read_progress").upsert(
        { user_id: user.id, article_slug: toStoredSlug(slug, kind), completed: false, updated_at: new Date().toISOString() },
        { onConflict: "user_id,article_slug" }
    )

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
