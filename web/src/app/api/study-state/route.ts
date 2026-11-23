import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateStudyAction } from "@/lib/study-state-server"
import { isPassingQuizScore } from "@/lib/mastery-quiz"

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ bookmarks: [], notes: [], quizAttempts: [], plan: null })

    const [bookmarksResult, notesResult, attemptsResult, planResult] = await Promise.all([
        supabase.from("user_bookmarks").select("article_slug,bookmarked,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("user_notes").select("article_slug,body,deleted,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("user_quiz_attempts").select("id,quiz_slug,quiz_kind,correct,total,score,passed,attempted_at").eq("user_id", user.id).order("attempted_at", { ascending: false }).limit(500),
        supabase.from("user_learning_plans").select("goal,experience_level,weekly_hours,track_slug,updated_at").eq("user_id", user.id).maybeSingle(),
    ])

    const error = bookmarksResult.error || notesResult.error || attemptsResult.error || planResult.error
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const plan = planResult.data
    return NextResponse.json({
        bookmarks: (bookmarksResult.data ?? []).map((row) => ({ slug: row.article_slug, bookmarked: row.bookmarked, updatedAt: row.updated_at })),
        notes: (notesResult.data ?? []).map((row) => ({ slug: row.article_slug, body: row.body, deleted: row.deleted, updatedAt: row.updated_at })),
        quizAttempts: (attemptsResult.data ?? []).map((row) => ({
            id: row.id,
            slug: row.quiz_slug,
            kind: row.quiz_kind,
            correct: row.correct,
            total: row.total,
            score: row.score,
            passed: isPassingQuizScore(row.score),
            attemptedAt: row.attempted_at,
        })),
        plan: plan ? {
            goal: plan.goal,
            level: plan.experience_level,
            weeklyHours: plan.weekly_hours,
            trackSlug: plan.track_slug,
            updatedAt: plan.updated_at,
        } : null,
    })
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    let action
    try {
        action = validateStudyAction(await request.json())
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 })
    }

    let result
    if (action.action === "bookmark") {
        result = await supabase.from("user_bookmarks").upsert({
            user_id: user.id,
            article_slug: action.slug,
            bookmarked: action.bookmarked,
        }, { onConflict: "user_id,article_slug" })
    } else if (action.action === "note") {
        result = await supabase.from("user_notes").upsert({
            user_id: user.id,
            article_slug: action.slug,
            body: action.body,
            deleted: !action.body,
        }, { onConflict: "user_id,article_slug" })
    } else if (action.action === "plan") {
        result = await supabase.from("user_learning_plans").upsert({
            user_id: user.id,
            goal: action.goal,
            experience_level: action.level,
            weekly_hours: action.weeklyHours,
            track_slug: action.trackSlug,
        })
    } else {
        const attempt = {
            id: action.id,
            user_id: user.id,
            quiz_slug: action.slug,
            quiz_kind: action.kind,
            correct: action.correct,
            total: action.total,
            score: action.score,
            passed: action.passed,
        }
        result = await supabase.from("user_quiz_attempts").upsert(attempt, { onConflict: "id" })
    }

    if (result.error) {
        console.error("[api/study-state] write failed", {
            action: action.action,
            code: result.error.code,
            message: result.error.message,
        })
        return NextResponse.json({ error: result.error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
}
