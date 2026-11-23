function firstHeaderValue(value: string | null) {
    return value?.split(",", 1)[0]?.trim() || null
}

function isLocalHost(host: string) {
    const hostname = host.startsWith("[")
        ? host.slice(1, host.indexOf("]"))
        : host.split(":", 1)[0]
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

export function getRequestOrigin(
    headers: Headers,
    requestUrl?: string,
    fallback = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
) {
    const requestOrigin = requestUrl ? new URL(requestUrl).origin : null
    const host = firstHeaderValue(headers.get("x-forwarded-host"))
        ?? firstHeaderValue(headers.get("host"))
    const forwardedProto = firstHeaderValue(headers.get("x-forwarded-proto"))
    const requestProto = requestOrigin ? new URL(requestOrigin).protocol.slice(0, -1) : null
    const proto = forwardedProto === "http" || forwardedProto === "https"
        ? forwardedProto
        : requestProto ?? (host && isLocalHost(host) ? "http" : "https")

    if (host) {
        try {
            return new URL(`${proto}://${host}`).origin
        } catch {
            // Fall back to configured site URL for malformed proxy headers.
        }
    }
    return requestOrigin ?? new URL(fallback).origin
}

export function isSameOrigin(request: Request) {
    const origin = request.headers.get("origin")
    if (!origin) return true

    try {
        return new URL(origin).origin === getRequestOrigin(request.headers, request.url)
    } catch {
        return false
    }
}

export function safeInternalPath(value: unknown, fallback = "/learn") {
    return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
        ? value
        : fallback
}
