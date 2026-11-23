import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/comments/vote — Toggle upvote on a comment
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { commentId } = await request.json()
    if (!commentId) {
        return NextResponse.json({ error: "Missing commentId" }, { status: 400 })
    }

    // Check if user already voted
    const { data: existing } = await supabase
        .from("comment_votes")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .maybeSingle()

    if (existing) {
        // Remove vote
        const { error } = await supabase
            .from("comment_votes")
            .delete()
            .eq("id", existing.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ voted: false })
    } else {
        // Add vote
        const { error } = await supabase.from("comment_votes").insert({
            comment_id: commentId,
            user_id: user.id,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ voted: true })
    }
}
