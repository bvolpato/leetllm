import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Do not use getSession() — it reads from storage which
    // can be tampered with. Always use getUser() for server-side auth checks.
    // This also refreshes the session if expired.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protect /dashboard routes (e.g. /dashboard/practice) — redirect to login if not authenticated
    if (
        !user &&
        request.nextUrl.pathname.startsWith('/dashboard')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If authenticated user visits login/signup, redirect to /learn
    if (
        user &&
        (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/learn'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
