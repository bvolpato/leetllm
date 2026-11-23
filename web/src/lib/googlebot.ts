/**
 * Googlebot Verification Utilities
 *
 * Determines whether an incoming request is from a verified Googlebot by
 * checking BOTH the User-Agent AND the source IP against Google's published
 * CIDR ranges. Either check alone is insufficient:
 *
 *  - UA-only:  trivially spoofable by anyone
 *  - IP-only:  doesn't confirm Google intent (CDNs share IP space)
 *  - Both:     extremely high confidence — would require owning Google's IP space
 *
 * Google explicitly permits serving full content to verified Googlebot:
 * https://developers.google.com/search/docs/crawling-indexing/googlebot
 *
 * IP ranges are fetched at build time by scripts/fetch-googlebot-cidrs.ts
 * and stored in src/lib/googlebot-cidrs.json (committed + refreshed on each deploy).
 */

import type { NextRequest } from 'next/server'

// Loaded at module init — zero request-time latency.
// Falls back to empty prefixes so the app still runs if the file is missing.
let cidrs: { ipv4Prefix?: string; ipv6Prefix?: string }[] = []
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require('./googlebot-cidrs.json')
    cidrs = data.prefixes ?? []
} catch {
    // File hasn't been generated yet (first local dev run). No Googlebot bypass.
    console.warn('[googlebot] googlebot-cidrs.json not found — run scripts/fetch-googlebot-cidrs.ts')
}

const GOOGLEBOT_UA_RE = /(?:Google(?:bot|Other|-InspectionTool|-Extended|-Read-Aloud)(?:-[a-zA-Z]+)?[\/;])|AdsBot-Google|APIs-Google/i

export function isGooglebotUA(ua: string): boolean {
    return GOOGLEBOT_UA_RE.test(ua)
}

// ─── IPv4 CIDR matching ───────────────────────────────────────────────────────
// Pure arithmetic — no external deps.

function ipv4ToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc * 256 + parseInt(octet, 10)), 0) >>> 0
}

function ipv4InCidr(ip: string, cidr: string): boolean {
    const slashIdx = cidr.lastIndexOf('/')
    if (slashIdx === -1) return ip === cidr
    const bits = parseInt(cidr.slice(slashIdx + 1), 10)
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
    return (ipv4ToInt(ip) & mask) === (ipv4ToInt(cidr.slice(0, slashIdx)) & mask)
}

// ─── IPv6 CIDR matching ───────────────────────────────────────────────────────
// Handles full and compressed IPv6 (::).

function expandIpv6(ip: string): string {
    if (ip.includes('::')) {
        const [left, right] = ip.split('::')
        const leftGroups = left ? left.split(':') : []
        const rightGroups = right ? right.split(':') : []
        const missing = 8 - leftGroups.length - rightGroups.length
        const middle = Array(missing).fill('0')
        return [...leftGroups, ...middle, ...rightGroups].join(':')
    }
    return ip
}

function ipv6ToBytes(ip: string): Uint16Array {
    const expanded = expandIpv6(ip)
    const groups = expanded.split(':')
    return new Uint16Array(groups.map((g) => parseInt(g || '0', 16)))
}

function ipv6InCidr(ip: string, cidr: string): boolean {
    const slashIdx = cidr.lastIndexOf('/')
    if (slashIdx === -1) return ip === cidr

    const bits = parseInt(cidr.slice(slashIdx + 1), 10)
    const ipBytes = ipv6ToBytes(ip)
    const rangeBytes = ipv6ToBytes(cidr.slice(0, slashIdx))

    let remaining = bits
    for (let i = 0; i < 8; i++) {
        const groupBits = Math.min(remaining, 16)
        if (groupBits === 0) break
        const mask = ~((1 << (16 - groupBits)) - 1) & 0xffff
        if ((ipBytes[i] & mask) !== (rangeBytes[i] & mask)) return false
        remaining -= groupBits
    }
    return true
}

// ─── IP extraction ────────────────────────────────────────────────────────────

/**
 * Extract the real client IP from the request.
 * Cloud Run (and most reverse proxies) inject X-Forwarded-For.
 * We take the first (leftmost) IP — that's the original client.
 */
export function getClientIp(request: NextRequest): string {
    const cfIp = request.headers.get('cf-connecting-ip')
    if (cfIp) return cfIp.trim()

    const xff = request.headers.get('x-forwarded-for')
    if (xff) {
        const first = xff.split(',')[0].trim()
        if (first) return first
    }
    return request.headers.get('x-real-ip') ?? ''
}

// ─── Main verification ────────────────────────────────────────────────────────

/**
 * Returns true if the request is from a verified Googlebot.
 *
 * Verification requires BOTH:
 *  1. A Googlebot User-Agent string
 *  2. Source IP within Google's published crawler CIDR ranges
 *
 * This prevents UA spoofing (anyone can set the UA) while also preventing
 * IP spoofing (X-Forwarded-For tampering upstream is still rejected because
 * the IP won't be in Google's address space).
 */
export function isVerifiedGooglebot(request: NextRequest): boolean {
    const ua = request.headers.get('user-agent') ?? ''
    if (!isGooglebotUA(ua)) return false

    const ip = getClientIp(request)
    if (!ip) return false

    const isIpv6 = ip.includes(':')

    return cidrs.some((range) => {
        if (isIpv6 && range.ipv6Prefix) {
            return ipv6InCidr(ip, range.ipv6Prefix)
        }
        if (!isIpv6 && range.ipv4Prefix) {
            return ipv4InCidr(ip, range.ipv4Prefix)
        }
        return false
    })
}

// ─── Internal header name ─────────────────────────────────────────────────────
// Set by middleware, read by server components. Using x-leetllm- prefix so it's
// clearly internal and can't be confused with external headers.

export const GOOGLEBOT_VERIFIED_HEADER = 'x-leetllm-googlebot-verified'
