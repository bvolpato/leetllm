import { NextRequest, NextResponse } from "next/server"
import { getRequestOrigin, isSameOrigin, safeInternalPath } from "@/lib/request-origin"
import { createClient } from "@/lib/supabase/server"

const MAX_SIGNUP_BODY_BYTES = 16 * 1024

function redirectWithParams(origin: string, pathname: string, params: Record<string, string>) {
    const target = new URL(pathname, origin)
    for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value)
    return NextResponse.redirect(target, 303)
}

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 })
    }

    const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
    if (!contentType.startsWith("application/x-www-form-urlencoded") && !contentType.startsWith("multipart/form-data")) {
        return NextResponse.json({ error: "Unsupported form content type" }, { status: 415 })
    }

    const contentLength = Number(request.headers.get("content-length"))
    if (Number.isFinite(contentLength) && contentLength > MAX_SIGNUP_BODY_BYTES) {
        return NextResponse.json({ error: "Signup request is too large" }, { status: 413 })
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: "Invalid signup form data" }, { status: 400 })
    }

    const origin = getRequestOrigin(request.headers, request.url)
    const email = formData.get("email")
    const password = formData.get("password")
    const nextValue = formData.get("next")
    const nextUrl = safeInternalPath(nextValue)
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || password.length < 6) {
        return redirectWithParams(origin, "/signup", { error: "Enter a valid email and a password with at least 6 characters" })
    }

    const callbackParams = new URLSearchParams({ signup: "1" })
    if (nextValue !== null) callbackParams.set("next", nextUrl)

    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback?${callbackParams}`,
        },
    })

    if (error) return redirectWithParams(origin, "/signup", { error: error.message })

    const params: Record<string, string> = { message: "Check your email to confirm your account" }
    if (nextValue !== null) params.next = nextUrl
    return redirectWithParams(origin, "/login", params)
}
