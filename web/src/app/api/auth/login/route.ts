import { NextRequest, NextResponse } from "next/server"
import { getRequestOrigin, isSameOrigin, safeInternalPath } from "@/lib/request-origin"
import { createClient } from "@/lib/supabase/server"

const MAX_LOGIN_BODY_BYTES = 16 * 1024

function redirectToLogin(origin: string, error: string, next: string | null) {
    const target = new URL("/login", origin)
    target.searchParams.set("error", error)
    if (next !== null) target.searchParams.set("next", safeInternalPath(next))
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
    if (Number.isFinite(contentLength) && contentLength > MAX_LOGIN_BODY_BYTES) {
        return NextResponse.json({ error: "Login request is too large" }, { status: 413 })
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: "Invalid login form data" }, { status: 400 })
    }

    const origin = getRequestOrigin(request.headers, request.url)
    const email = formData.get("email")
    const password = formData.get("password")
    const nextValue = formData.get("next")
    const nextUrl = safeInternalPath(nextValue)
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
        return redirectToLogin(origin, "Enter a valid email and password", typeof nextValue === "string" ? nextValue : null)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
    })

    if (error) {
        return redirectToLogin(origin, error.message, typeof nextValue === "string" ? nextValue : null)
    }

    return NextResponse.redirect(new URL(nextUrl, origin), 303)
}
