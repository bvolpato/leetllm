import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isVerifiedGooglebot, GOOGLEBOT_VERIFIED_HEADER } from '@/lib/googlebot'
import contentAliases from '@/generated/content-aliases.json'

type ContentAliasesManifest = {
    learn?: Record<string, string>
    blog?: Record<string, string>
}

const aliases = contentAliases as ContentAliasesManifest
const LEGACY_AUTH_POST_PATHS = new Set(["/login", "/signup"])

function redirectContentAlias(request: NextRequest): NextResponse | null {
    const pathname = request.nextUrl.pathname
    const learnMatch = pathname.match(/^\/learn\/([^/]+?)(\.md)?$/)
    const apiMdMatch = pathname.match(/^\/api\/md\/([^/]+?)(\.md)?$/)
    const match = learnMatch ?? apiMdMatch

    if (!match) {
        return null
    }

    const canonicalSlug = aliases.learn?.[match[1]]
    if (!canonicalSlug) {
        return null
    }

    const targetUrl = request.nextUrl.clone()
    const extension = match[2] ?? ''
    targetUrl.pathname = learnMatch
        ? `/learn/${canonicalSlug}${extension}`
        : `/api/md/${canonicalSlug}${extension}`
    return NextResponse.redirect(targetUrl, 308)
}

function redirectBlogAlias(request: NextRequest): NextResponse | null {
    const match = request.nextUrl.pathname.match(/^\/(blog|api\/md)\/([^/]+?)(\.md)?$/)
    if (!match) return null

    const canonicalSlug = aliases.blog?.[match[2]]
    if (!canonicalSlug) return null

    const targetUrl = request.nextUrl.clone()
    targetUrl.pathname = `/${match[1]}/${canonicalSlug}${match[3] ?? ''}`
    return NextResponse.redirect(targetUrl, 308)
}

export async function proxy(request: NextRequest) {
    // ── 1. Canonical non-www redirect ─────────────────────────────────────────
    // Construct URL from scratch — Cloud Run's internal port (8080) can leak
    // into redirect URLs if we use nextUrl.clone().
    const host = request.headers.get('host') || ''
    if (host.startsWith('www.')) {
        const canonicalHost = host.replace('www.', '')
        const canonicalUrl = `https://${canonicalHost}${request.nextUrl.pathname}${request.nextUrl.search}`
        return NextResponse.redirect(canonicalUrl, 301)
    }

    // Login and signup forms submit to guarded Route Handlers. Reject stale
    // Server Action posts before Next.js attempts to parse malformed FormData.
    if (request.method === "POST" && LEGACY_AUTH_POST_PATHS.has(request.nextUrl.pathname)) {
        return NextResponse.json({ error: "Submit this form from the current page" }, { status: 400 })
    }

    // ── 2. Content alias redirects ────────────────────────────────────────────
    const aliasRedirect = redirectContentAlias(request) ?? redirectBlogAlias(request)
    if (aliasRedirect) {
        return aliasRedirect
    }

    // ── 3. Verified Googlebot tagging ─────────────────────────────────────────
    // Check User-Agent + source IP against Google's published CIDR ranges.
    // If both match, tag the request with an internal header so server
    // components can identify verified crawler traffic when needed.
    //
    // IMPORTANT: To make a header readable by server components via headers(),
    // it must be added to the *request* headers via NextResponse.next({ request })
    // — NOT via response.headers.set() which only affects the response to the client.
    if (isVerifiedGooglebot(request)) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set(GOOGLEBOT_VERIFIED_HEADER, '1')

        const response = NextResponse.next({
            request: { headers: requestHeaders },
        })
        // Also set on response for debugging / transparency (optional)
        response.headers.set(GOOGLEBOT_VERIFIED_HEADER, '1')
        return response
    }

    // Learn HTML and RSC are prebuilt public content. Account state and session
    // refresh resolve in AuthProvider, so navigation need not wait for Auth.
    if (
        (request.method === "GET" || request.method === "HEAD") &&
        /^\/learn(?:\/[^/]+)?\/?$/.test(request.nextUrl.pathname)
    ) {
        return NextResponse.next()
    }

    // ── 4. Auth session handling ───────────────────────────────────────────────
    // Check if the user has Supabase auth cookies.
    // Supabase splits large JWTs into chunks: -auth-token.0, -auth-token.1, etc.
    const hasAuthCookies = request.cookies.getAll().some(
        (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
    )

    if (hasAuthCookies) {
        // Logged-in user: refresh session so auth works on every route.
        const response = await updateSession(request)
        // Authenticated pages must never be CDN-cached (wrong login/progress state).
        response.headers.set('Cache-Control', 'private, no-store, must-revalidate')
        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets (svg, png, jpg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
