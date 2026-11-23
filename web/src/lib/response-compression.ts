import "server-only"

import { NextResponse } from "next/server"

const MINIMUM_GZIP_BYTES = 1_024

function quality(value: string): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0
}

export function acceptsGzip(value: string | null): boolean {
    if (!value) return false

    let gzipQuality: number | undefined
    let wildcardQuality: number | undefined

    for (const entry of value.split(",")) {
        const [rawEncoding, ...parameters] = entry.trim().split(";")
        const encoding = rawEncoding.trim().toLowerCase()
        let entryQuality = 1

        for (const parameter of parameters) {
            const [name, rawValue] = parameter.trim().split("=", 2)
            if (name.toLowerCase() === "q") entryQuality = quality(rawValue ?? "")
        }

        if (encoding === "gzip") {
            gzipQuality = Math.max(gzipQuality ?? 0, entryQuality)
        } else if (encoding === "*") {
            wildcardQuality = Math.max(wildcardQuality ?? 0, entryQuality)
        }
    }

    return (gzipQuality ?? wildcardQuality ?? 0) > 0
}

function isCompressible(contentType: string | null): boolean {
    if (!contentType) return false
    const mimeType = contentType.split(";", 1)[0].trim().toLowerCase()
    return mimeType.startsWith("text/") || [
        "application/javascript",
        "application/json",
        "application/ld+json",
        "application/xml",
        "image/svg+xml",
    ].includes(mimeType)
}

function appendVary(headers: Headers, value: string): void {
    const existing = headers.get("Vary")
    const values = new Map<string, string>()
    for (const entry of existing?.split(",") ?? []) {
        const trimmed = entry.trim()
        if (trimmed) values.set(trimmed.toLowerCase(), trimmed)
    }
    values.set(value.toLowerCase(), value)
    headers.set("Vary", [...values.values()].join(", "))
}

/**
 * Returns an uncompressed Route Handler response with `Vary: Accept-Encoding`
 * for compressible payloads.
 *
 * Next.js 16.4.5+ strips `Content-Encoding`, `Content-Length`, and
 * `Transfer-Encoding` from App Router Route Handler responses in
 * `sendResponse`, and Next.js 16.4.6+ delegates gzip/deflate negotiation to
 * the server compression middleware (`compress: true`). Pre-compressing inside
 * a Route Handler would either strip the `Content-Encoding` header or cause
 * double compression.
 */
export function compressedResponse(
    _request: Request,
    body: string | Uint8Array,
    init: ResponseInit,
): NextResponse {
    const headers = new Headers(init.headers)
    const bodyBytes = typeof body === "string"
        ? Buffer.from(body)
        : Buffer.from(body.buffer, body.byteOffset, body.byteLength)
    const responseBody = typeof body === "string" ? body : new Uint8Array(body).buffer
    const cacheControl = headers.get("Cache-Control")?.toLowerCase() ?? ""
    const contentEncoding = headers.get("Content-Encoding")?.toLowerCase()
    const canTransform = !cacheControl.split(",").some(value => value.trim() === "no-transform")
    const canCompress = (
        canTransform
        && !contentEncoding
        && bodyBytes.byteLength >= MINIMUM_GZIP_BYTES
        && isCompressible(headers.get("Content-Type"))
    )

    if (!canCompress) return new NextResponse(responseBody, { ...init, headers })

    appendVary(headers, "Accept-Encoding")
    headers.delete("Content-Encoding")
    headers.set("Content-Length", bodyBytes.byteLength.toString())
    return new NextResponse(responseBody, { ...init, headers })
}
