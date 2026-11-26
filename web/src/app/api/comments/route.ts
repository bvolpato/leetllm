import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const COMMENTS_QUERY_TIMEOUT_MS = 8_000

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function isTransientQueryFailure(result: { status: number; error: { code?: string } | null }) {
    return Boolean(result.error) && (result.status === 0 || result.status >= 500 || !result.error?.code)
}

async function loadComments(supabase: SupabaseClient, slug: string) {
    const query = () => supabase
        .from("article_comments")
        .select(`
            id,
            article_slug,
            user_id,
            parent_id,
            body,
            is_anonymous,
            created_at,
            updated_at
        `)
        .eq("article_slug", slug)
        .order("created_at", { ascending: true })
        .abortSignal(AbortSignal.timeout(COMMENTS_QUERY_TIMEOUT_MS))

    let result = await query()
    if (isTransientQueryFailure(result)) result = await query()
    return result
}

export interface CommentWithAuthor {
    id: string
    article_slug: string
    user_id: string
    parent_id: string | null
    body: string
    is_anonymous: boolean
    created_at: string
    updated_at: string
    author_display_name: string | null
    vote_count: number
    user_has_voted: boolean
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
    return request.cookies.getAll().some(
        (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
    )
}

// GET /api/comments?slug=xxx — Get all comments for an article
export async function GET(request: NextRequest) {
    const slug = request.nextUrl.searchParams.get("slug")
    if (!slug) {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

    const hasAuthCookie = hasSupabaseAuthCookie(request)
    const cacheHeaders = hasAuthCookie
        ? { "Cache-Control": "private, no-store" }
        : { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120" }

    const supabase = await createClient()
    const [user, commentsResult] = hasAuthCookie
        ? await Promise.all([
            supabase.auth.getUser().then(({ data }) => data.user),
            loadComments(supabase, slug),
        ])
        : [null, await loadComments(supabase, slug)]

    const { data: comments, error } = commentsResult

    if (error) {
        const transient = isTransientQueryFailure(commentsResult)
        console.error("[COMMENTS_QUERY_FAILED]", JSON.stringify({
            status: commentsResult.status,
            code: error.code || "network",
            transient,
        }))
        return NextResponse.json(
            { error: transient ? "Comments are temporarily unavailable" : "Could not load comments" },
            transient ? { status: 503, headers: { "Retry-After": "2" } } : { status: 500 },
        )
    }

    if (!comments || comments.length === 0) {
        return NextResponse.json({ comments: [] }, { headers: cacheHeaders })
    }

    // Get all unique user IDs for author lookup
    const userIds = [...new Set(comments.map((c) => c.user_id))]
    const commentIds = comments.map((c) => c.id)
    const [profilesResult, voteCountsResult, myVotesResult] = await Promise.all([
        supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds)
            .abortSignal(AbortSignal.timeout(COMMENTS_QUERY_TIMEOUT_MS)),
        supabase
            .from("comment_votes")
            .select("comment_id")
            .in("comment_id", commentIds)
            .abortSignal(AbortSignal.timeout(COMMENTS_QUERY_TIMEOUT_MS)),
        user
            ? supabase
                .from("comment_votes")
                .select("comment_id")
                .eq("user_id", user.id)
                .in("comment_id", commentIds)
                .abortSignal(AbortSignal.timeout(COMMENTS_QUERY_TIMEOUT_MS))
            : Promise.resolve({ data: [] }),
    ])

    const profileMap = new Map(
        (profilesResult.data || []).map((p: { id: string; display_name: string | null }) => [p.id, p])
    )

    // Count votes per comment
    const voteMap = new Map<string, number>()
    for (const vote of voteCountsResult.data || []) {
        voteMap.set(vote.comment_id, (voteMap.get(vote.comment_id) || 0) + 1)
    }

    // Get user's own votes for highlighting
    const userVotes = new Set((myVotesResult.data || []).map((v: { comment_id: string }) => v.comment_id))

    // Build enriched comments
    const enriched: CommentWithAuthor[] = comments.map((c) => {
        const profile = profileMap.get(c.user_id)
        return {
            ...c,
            author_display_name: c.is_anonymous ? null : (profile?.display_name || null),
            vote_count: voteMap.get(c.id) || 0,
            user_has_voted: userVotes.has(c.id),
        }
    })

    return NextResponse.json({ comments: enriched }, { headers: cacheHeaders })
}

// POST /api/comments — Create a new comment
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { slug, body, parentId, isAnonymous } = await request.json()

    if (!slug || !body || typeof body !== "string" || body.trim().length === 0) {
        return NextResponse.json({ error: "Missing slug or body" }, { status: 400 })
    }

    if (body.length > 5000) {
        return NextResponse.json({ error: "Comment too long (max 5000 chars)" }, { status: 400 })
    }

    const { data, error } = await supabase
        .from("article_comments")
        .insert({
            article_slug: slug,
            user_id: user.id,
            parent_id: parentId || null,
            body: body.trim(),
            is_anonymous: isAnonymous ?? false,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment: data })
}
