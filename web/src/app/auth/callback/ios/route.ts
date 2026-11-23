import { NextResponse } from "next/server"

const callbackParameters = ["code", "error", "error_description", "error_code"] as const

/** Forwards Supabase's PKCE result into the iOS app without forwarding other query data. */
export async function GET(request: Request) {
    const source = new URL(request.url).searchParams
    const callback = new URL("com.leetllm.ios://auth/callback")

    for (const parameter of callbackParameters) {
        const value = source.get(parameter)
        if (value !== null) callback.searchParams.set(parameter, value)
    }

    if (!["code", "error", "error_description"].some((parameter) => callback.searchParams.has(parameter))) {
        return new NextResponse("Missing OAuth callback result.", {
            status: 400,
            headers: { "Cache-Control": "no-store" },
        })
    }

    const response = NextResponse.redirect(callback, 302)
    response.headers.set("Cache-Control", "no-store")
    response.headers.set("Referrer-Policy", "no-referrer")
    return response
}
