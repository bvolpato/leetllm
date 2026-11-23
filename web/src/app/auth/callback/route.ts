import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getRequestOrigin, safeInternalPath } from '@/lib/request-origin'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/learn'
    const completedSignup = searchParams.get('signup') === '1'

    const origin = getRequestOrigin(request.headers, request.url)

    if (code) {
        // Parse incoming cookies from the request header
        const cookieHeader = request.headers.get('cookie') ?? ''
        const cookies: { name: string; value: string }[] = cookieHeader
            .split(';')
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
                const [name, ...rest] = c.split('=')
                return { name: name.trim(), value: rest.join('=').trim() }
            })

        // Build the redirect response first so we can attach cookies to it
        const redirectUrl = new URL(safeInternalPath(next), origin)
        if (completedSignup) redirectUrl.searchParams.set('signup', 'complete')
        const response = NextResponse.redirect(redirectUrl)

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
                            // 1. Set cookie on the redirect response
                            response.cookies.set(name, value, options)

                            // 2. Update the in-memory array so subsequent
                            //    getAll() calls return fresh values.
                            //    This is critical: the Supabase client calls
                            //    getAll() AFTER setAll() in its
                            //    onAuthStateChange handler. Without this,
                            //    it reads stale cookies and overwrites the
                            //    session with empty values.
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

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return response
        }

        console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth`)
}
