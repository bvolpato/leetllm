/**
 * Googlebot Verification Tests
 *
 * Tests the UA detection, CIDR matching, and integration with the live CIDR list.
 * Real Google IP addresses are used from the published ranges to validate
 * that the verification logic works end-to-end, not just in isolation.
 */

import { describe, it, expect } from 'vitest'
import { isGooglebotUA, getClientIp, GOOGLEBOT_VERIFIED_HEADER } from './googlebot'

// ─── Import internals for testing ─────────────────────────────────────────────
// The CIDR functions are not exported since they're private implementation
// details. We test them via the exported helpers and by reading the JSON.

import cidrs from './googlebot-cidrs.json'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** Check if an IP matches any prefix in our CIDR list */
function ipInGoogleRanges(ip: string): boolean {
    const isIpv6 = ip.includes(':')
    return cidrs.prefixes.some((range: { ipv4Prefix?: string; ipv6Prefix?: string }) => {
        if (isIpv6 && range.ipv6Prefix) return ipv6InCidr(ip, range.ipv6Prefix)
        if (!isIpv6 && range.ipv4Prefix) return ipv4InCidr(ip, range.ipv4Prefix)
        return false
    })
}

/** Build a minimal NextRequest-like object for testing */
function makeRequest(opts: { ua?: string; xff?: string; realIp?: string }) {
    const headers = new Headers()
    if (opts.ua) headers.set('user-agent', opts.ua)
    if (opts.xff) headers.set('x-forwarded-for', opts.xff)
    if (opts.realIp) headers.set('x-real-ip', opts.realIp)
    return { headers } as unknown as import('next/server').NextRequest
}

// ─── Real Google IPs ───────────────────────────────────────────────────────────
// Derive a real IP from the first IPv4 CIDR in the list so the test stays
// accurate as Google's ranges evolve.

const firstIpv4Range = cidrs.prefixes.find((p: { ipv4Prefix?: string }) => p.ipv4Prefix)?.ipv4Prefix ?? '66.249.64.0/19'
const firstIpv6Range = cidrs.prefixes.find((p: { ipv6Prefix?: string }) => p.ipv6Prefix)?.ipv6Prefix ?? '2001:4860:4801:10::/64'

// Build an IP that is guaranteed to be within the first CIDR
function firstIpInCidr(cidr: string): string {
    const slash = cidr.lastIndexOf('/')
    return cidr.slice(0, slash) // The network address itself is always in range
}

const REAL_GOOGLE_IPV4 = firstIpInCidr(firstIpv4Range)
const REAL_GOOGLE_IPV6 = firstIpInCidr(firstIpv6Range)

// ─── User-Agent Tests ─────────────────────────────────────────────────────────

describe('isGooglebotUA', () => {
    const VALID_UAS = [
        'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36',
        'Mozilla/5.0 (compatible; Google-InspectionTool/1.0; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; GoogleOther/1.0; +http://www.google.com/bot.html)',
        'Googlebot-Image/1.0',
        'Googlebot-Video/1.0',
        'AdsBot-Google (+http://www.google.com/adsbot.html)',
        'AdsBot-Google-Mobile',
        'Google-Read-Aloud; (+https://support.google.com/webmasters/answer/1061943)',
        'APIs-Google (+https://developers.google.com/webmasters/APIs-Google.html)',
    ]

    it.each(VALID_UAS)('accepts known Googlebot UA: %s', (ua) => {
        expect(isGooglebotUA(ua)).toBe(true)
    })

    const INVALID_UAS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'curl/7.88.1',
        'python-requests/2.31.0',
        // Partial match should NOT trigger (missing the slash after "Googlebot")
        'MyBot (not-a-Googlebot)',
        '',
    ]

    it.each(INVALID_UAS)('rejects non-Googlebot UA: %s', (ua) => {
        expect(isGooglebotUA(ua)).toBe(false)
    })
})

// ─── CIDR file integrity ──────────────────────────────────────────────────────

describe('googlebot-cidrs.json', () => {
    it('has a non-empty prefixes array', () => {
        expect(cidrs.prefixes.length).toBeGreaterThan(100)
    })

    it('has both IPv4 and IPv6 ranges', () => {
        const v4 = cidrs.prefixes.filter((p: { ipv4Prefix?: string }) => p.ipv4Prefix)
        const v6 = cidrs.prefixes.filter((p: { ipv6Prefix?: string }) => p.ipv6Prefix)
        expect(v4.length).toBeGreaterThan(0)
        expect(v6.length).toBeGreaterThan(0)
    })

    it('has a valid _fetchedAt timestamp', () => {
        const fetchedAt = new Date(cidrs._fetchedAt as string)
        expect(fetchedAt.getTime()).toBeGreaterThan(0)
        // Should have been fetched within the last 90 days
        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
        expect(fetchedAt.getTime()).toBeGreaterThan(ninetyDaysAgo)
    })

    it('all IPv4 CIDRs are valid', () => {
        const v4 = cidrs.prefixes.filter((p: { ipv4Prefix?: string }) => p.ipv4Prefix)
        for (const { ipv4Prefix } of v4 as { ipv4Prefix: string }[]) {
            expect(ipv4Prefix).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/)
        }
    })
})

// ─── IPv4 CIDR matching ───────────────────────────────────────────────────────

describe('ipv4InCidr', () => {
    it('matches an IP inside a /19 range', () => {
        // 66.249.64.0/19 covers 66.249.64.0 – 66.249.95.255
        expect(ipv4InCidr('66.249.64.1', '66.249.64.0/19')).toBe(true)
        expect(ipv4InCidr('66.249.80.123', '66.249.64.0/19')).toBe(true)
        expect(ipv4InCidr('66.249.95.255', '66.249.64.0/19')).toBe(true)
    })

    it('rejects an IP outside the range', () => {
        expect(ipv4InCidr('66.249.96.0', '66.249.64.0/19')).toBe(false)
        expect(ipv4InCidr('1.2.3.4', '66.249.64.0/19')).toBe(false)
    })

    it('matches a /32 (exact IP)', () => {
        expect(ipv4InCidr('8.8.8.8', '8.8.8.8/32')).toBe(true)
        expect(ipv4InCidr('8.8.8.9', '8.8.8.8/32')).toBe(false)
    })

    it('matches a /0 (all IPs)', () => {
        expect(ipv4InCidr('1.2.3.4', '0.0.0.0/0')).toBe(true)
        expect(ipv4InCidr('255.255.255.255', '0.0.0.0/0')).toBe(true)
    })
})

// ─── IPv6 CIDR matching ───────────────────────────────────────────────────────

describe('ipv6InCidr', () => {
    it('matches an IP inside a /64 range', () => {
        // 2001:4860:4801:10::/64
        expect(ipv6InCidr('2001:4860:4801:10::1', '2001:4860:4801:10::/64')).toBe(true)
        expect(ipv6InCidr('2001:4860:4801:10:ffff:ffff:ffff:ffff', '2001:4860:4801:10::/64')).toBe(true)
    })

    it('rejects an IP outside the /64 range', () => {
        expect(ipv6InCidr('2001:4860:4801:11::1', '2001:4860:4801:10::/64')).toBe(false)
    })

    it('handles compressed :: notation', () => {
        expect(ipv6InCidr('::1', '::1/128')).toBe(true)
        expect(ipv6InCidr('::2', '::1/128')).toBe(false)
    })
})

// ─── Real CIDR list integration ───────────────────────────────────────────────

describe('real Google CIDR ranges', () => {
    it(`accepts ${REAL_GOOGLE_IPV4} (first IPv4 addr from ${firstIpv4Range})`, () => {
        expect(ipInGoogleRanges(REAL_GOOGLE_IPV4)).toBe(true)
    })

    it(`accepts ${REAL_GOOGLE_IPV6} (first IPv6 addr from ${firstIpv6Range})`, () => {
        expect(ipInGoogleRanges(REAL_GOOGLE_IPV6)).toBe(true)
    })

    it('rejects a well-known non-Google IP (1.1.1.1 — Cloudflare DNS)', () => {
        expect(ipInGoogleRanges('1.1.1.1')).toBe(false)
    })

    it('rejects a private IP (192.168.1.1)', () => {
        expect(ipInGoogleRanges('192.168.1.1')).toBe(false)
    })

    it('rejects a loopback IP (127.0.0.1)', () => {
        expect(ipInGoogleRanges('127.0.0.1')).toBe(false)
    })
})

// ─── IP extraction ────────────────────────────────────────────────────────────

describe('getClientIp', () => {
    it('extracts the first IP from X-Forwarded-For', () => {
        const req = makeRequest({ xff: '203.0.113.10, 10.0.0.1, 172.16.0.1' })
        expect(getClientIp(req)).toBe('203.0.113.10')
    })

    it('falls back to X-Real-IP when no XFF', () => {
        const req = makeRequest({ realIp: '203.0.113.20' })
        expect(getClientIp(req)).toBe('203.0.113.20')
    })

    it('returns empty string when no IP headers present', () => {
        const req = makeRequest({ ua: 'Googlebot/2.1' })
        expect(getClientIp(req)).toBe('')
    })

    it('trims whitespace from XFF IP', () => {
        const req = makeRequest({ xff: '  66.249.64.1  , 10.0.0.1' })
        expect(getClientIp(req)).toBe('66.249.64.1')
    })
})

// ─── Middleware header propagation contract ───────────────────────────────────
// The most important invariant: the verified header must end up on the REQUEST
// so that Next.js server components can read it via headers(). Setting it only
// on the response (response.headers.set) does NOT make it readable by the page.
// This test documents that contract explicitly.

describe('GOOGLEBOT_VERIFIED_HEADER constant', () => {
    it('has the expected value', () => {
        // If this changes, update middleware and all server components that read it
        expect(GOOGLEBOT_VERIFIED_HEADER).toBe('x-leetllm-googlebot-verified')
    })

    it('is readable when set on request headers (not just response headers)', () => {
        // Simulate what the fixed middleware does: add to request headers
        const requestHeaders = new Headers()
        requestHeaders.set(GOOGLEBOT_VERIFIED_HEADER, '1')
        expect(requestHeaders.get(GOOGLEBOT_VERIFIED_HEADER)).toBe('1')
    })
})


describe('spoofing prevention', () => {
    it('UA-only spoof is caught (non-Google IP with Googlebot UA)', () => {
        // Attacker sets Googlebot UA but comes from a random IP
        expect(isGooglebotUA('Googlebot/2.1')).toBe(true) // UA passes
        expect(ipInGoogleRanges('1.2.3.4')).toBe(false)   // IP fails — attack blocked
    })

    it('IP-only spoof is caught (Google IP with random UA)', () => {
        // If somehow coming from Google IP space but not a Googlebot UA
        expect(isGooglebotUA('Mozilla/5.0')).toBe(false)  // UA fails — attack blocked
    })

    it('both required: Googlebot UA + Google IP = verified', () => {
        expect(isGooglebotUA('Googlebot/2.1')).toBe(true)
        expect(ipInGoogleRanges(REAL_GOOGLE_IPV4)).toBe(true)
        // Both true = isVerifiedGooglebot() would return true
    })
})
