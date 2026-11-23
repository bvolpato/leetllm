import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Only allow POST — prevents Next.js <Link> prefetching from triggering signout
export async function POST(request: NextRequest) {
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host")
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https"
    const origin = forwardedHost
        ? `${forwardedProto}://${forwardedHost}`
        : process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    const response = NextResponse.redirect(new URL("/", origin), 303)

    // Parse cookies from the incoming request
    const cookieHeader = request.headers.get('cookie') ?? ''
    const cookies: { name: string; value: string }[] = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
            const [name, ...rest] = c.split('=')
            return { name: name.trim(), value: rest.join('=').trim() }
        })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookies
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                        const idx = cookies.findIndex((c) => c.name === name)
                        if (idx >= 0) {
                            cookies[idx] = { name, value }
                        } else {
                            cookies.push({ name, value })
                        }
                    })
                },
            },
        }
    )

    await supabase.auth.signOut()

    return response
}

// Return 405 Method Not Allowed for GET requests
export async function GET() {
    return NextResponse.json(
        { error: "Use POST to sign out" },
        { status: 405 }
    )
}
