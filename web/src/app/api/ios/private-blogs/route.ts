import { NextResponse } from "next/server"
import { getIOSMasterclassEmail, getIOSPrivateBlogs } from "@/lib/ios-private-blogs"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const headers = {
    "Cache-Control": "private, no-store, max-age=0, no-transform",
    Vary: "Cookie, Authorization",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers })
    }
    const allowedEmail = getIOSMasterclassEmail()
    if (!allowedEmail || !user.email_confirmed_at || user.email?.trim().toLowerCase() !== allowedEmail) {
        return NextResponse.json({ blogs: [], images: {} }, { headers })
    }
    try {
        return NextResponse.json(getIOSPrivateBlogs(allowedEmail), { headers })
    } catch {
        return NextResponse.json({ error: "Private articles are temporarily unavailable" }, { status: 503, headers })
    }
}
