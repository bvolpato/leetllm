import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/progress — Get all read article slugs for current user
export async function GET() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ slugs: [], completed: [], progress: [] })
    }

    const { data, error } = await supabase
        .from("user_read_progress")
        .select("article_slug,read_at,completed,updated_at")
        .eq("user_id", user.id)
        .not("article_slug", "like", "practice:%")
        .not("article_slug", "like", "practice-quiz:%")

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const completedRows = data.filter((row: { completed: boolean }) => row.completed)
    return NextResponse.json({
        slugs: completedRows.map((row: { article_slug: string }) => row.article_slug),
        completed: completedRows.map((row: { article_slug: string; updated_at: string }) => ({
            slug: row.article_slug,
            completedAt: row.updated_at,
        })),
        progress: data.map((row: { article_slug: string; completed: boolean; updated_at: string }) => ({
            slug: row.article_slug,
            completed: row.completed,
            updatedAt: row.updated_at,
        })),
    })
}

// PUT /api/progress — Record first article open without changing existing completion state
export async function PUT(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { slug } = await request.json()
    if (!slug || typeof slug !== "string") {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }
    if (slug.startsWith("practice:") || slug.startsWith("practice-quiz:")) {
        return NextResponse.json({ error: "Practice progress must use /api/practice/progress" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { error } = await supabase.from("user_read_progress").upsert(
        {
            user_id: user.id,
            article_slug: slug,
            completed: false,
            read_at: now,
            updated_at: now,
        },
        { onConflict: "user_id,article_slug", ignoreDuplicates: true }
    )

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}

// POST /api/progress — Mark an article as read
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { slug } = await request.json()
    if (!slug || typeof slug !== "string") {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }
    if (slug.startsWith("practice:") || slug.startsWith("practice-quiz:")) {
        return NextResponse.json({ error: "Practice progress must use /api/practice/progress" }, { status: 400 })
    }

    const { error } = await supabase.from("user_read_progress").upsert(
        { user_id: user.id, article_slug: slug, completed: true, read_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: "user_id,article_slug" }
    )

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}

// DELETE /api/progress — Un-mark an article as read
export async function DELETE(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { slug } = await request.json()
    if (!slug || typeof slug !== "string") {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }
    if (slug.startsWith("practice:") || slug.startsWith("practice-quiz:")) {
        return NextResponse.json({ error: "Practice progress must use /api/practice/progress" }, { status: 400 })
    }

    const { error } = await supabase.from("user_read_progress").upsert(
        { user_id: user.id, article_slug: slug, completed: false, updated_at: new Date().toISOString() },
        { onConflict: "user_id,article_slug" }
    )

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
