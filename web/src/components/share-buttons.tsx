"use client"

import { useState, useCallback } from "react"
import { Check, Copy, Share2 } from "lucide-react"
import { copyMarkdownFromUrl, copyText } from "@/lib/copy-text"

const SITE_URL = "https://leetllm.com"
const SITE_HANDLE = "leetllm" // X handle without @

// ── Platform SVG icons (inline to avoid dependency bloat) ────────────────────

function XIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.092.053 1.593.13v3.294a10.218 10.218 0 0 0-.963-.042c-1.37 0-1.9.518-1.9 1.87v2.306h2.713l-.466 3.667H13.69v7.98z" />
        </svg>
    )
}

function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
}

function BlueskyIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 568 501" fill="currentColor" className={className} aria-hidden="true">
            <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 375.812 284.017 372.431 284 375.306C283.983 372.431 282.831 375.812 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0533 296.954 15.7778 224.501C9.94445 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z" />
        </svg>
    )
}

function EmailIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    )
}

function RedditIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
    )
}

function HackerNewsIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M0 0v24h24V0H0zm11.09 13.277V18.59h1.81v-5.313L17.066 5.4h-1.98l-3.097 6.003L8.903 5.4H6.934l4.157 7.877z" />
        </svg>
    )
}

// ── Share URL builders ───────────────────────────────────────────────────────

interface ShareConfig {
    url: string
    title: string
    description?: string
}

function buildShareLinks(config: ShareConfig) {
    const { url, title, description } = config
    const fullUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`
    const shareText = `${title}${description ? ` — ${description}` : ""}`

    return {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}&via=${SITE_HANDLE}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
        bluesky: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
        reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`,
        hackernews: `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(fullUrl)}&t=${encodeURIComponent(title)}`,
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
    }
}

// ── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = [
    {
        key: "twitter" as const,
        label: "X",
        Icon: XIcon,
        hoverClass: "hover:text-foreground hover:bg-foreground/10 hover:border-foreground/20",
    },
    {
        key: "facebook" as const,
        label: "Facebook",
        Icon: FacebookIcon,
        hoverClass: "hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/20",
    },
    {
        key: "linkedin" as const,
        label: "LinkedIn",
        Icon: LinkedInIcon,
        hoverClass: "hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/20",
    },
    {
        key: "bluesky" as const,
        label: "Bluesky",
        Icon: BlueskyIcon,
        hoverClass: "hover:text-[#0085FF] hover:bg-[#0085FF]/10 hover:border-[#0085FF]/20",
    },
    {
        key: "reddit" as const,
        label: "Reddit",
        Icon: RedditIcon,
        hoverClass: "hover:text-[#FF4500] hover:bg-[#FF4500]/10 hover:border-[#FF4500]/20",
    },
    {
        key: "hackernews" as const,
        label: "Hacker News",
        Icon: HackerNewsIcon,
        hoverClass: "hover:text-[#FF6600] hover:bg-[#FF6600]/10 hover:border-[#FF6600]/20",
    },
    {
        key: "email" as const,
        label: "Email",
        Icon: EmailIcon,
        hoverClass: "hover:text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/20",
    },
]

// ── ShareButtons component ───────────────────────────────────────────────────

interface ShareButtonsProps {
    /** The page URL path (e.g. "/learn/attention-mechanism") or full URL */
    url: string
    /** The title of the article */
    title: string
    /** Optional description/excerpt */
    description?: string
    /** Visual variant */
    variant?: "inline" | "compact"
}

function buildMarkdownUrl(url: string): string | null {
    try {
        const parsed = new URL(url, SITE_URL)
        const match = parsed.pathname.match(/^\/(?:learn|blog)\/([^/]+)$/)
        return match ? `/api/md/${match[1]}` : null
    } catch {
        return null
    }
}

export function ShareButtons({
    url,
    title,
    description,
    variant = "inline",
}: ShareButtonsProps) {
    const [copiedLink, setCopiedLink] = useState(false)
    const [copiedMarkdown, setCopiedMarkdown] = useState(false)
    const links = buildShareLinks({ url, title, description })
    const fullUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`
    const markdownUrl = buildMarkdownUrl(url)

    const handleCopy = useCallback(async () => {
        try {
            await copyText(fullUrl)
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
        } catch {
            setCopiedLink(false)
        }
    }, [fullUrl])

    const handleCopyMarkdown = useCallback(async () => {
        if (!markdownUrl) return

        try {
            await copyMarkdownFromUrl(markdownUrl)
            setCopiedMarkdown(true)
            setTimeout(() => setCopiedMarkdown(false), 2000)
        } catch {
            setCopiedMarkdown(false)
        }
    }, [markdownUrl])

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground/60 mr-1 flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    Share
                </span>
                {PLATFORMS.map(({ key, label, Icon, hoverClass }) => (
                    <a
                        key={key}
                        href={links[key]}
                        target={key === "email" ? undefined : "_blank"}
                        rel={key === "email" ? undefined : "noopener noreferrer"}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md border border-border/30 bg-card/40 text-muted-foreground/60 transition-all duration-200 ${hoverClass}`}
                        aria-label={`Share on ${label}`}
                        title={`Share on ${label}`}
                    >
                        <Icon className="h-3 w-3" />
                    </a>
                ))}
                <button
                    onClick={handleCopy}
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-md border border-border/30 bg-card/40 transition-all duration-200 ${copiedLink
                            ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                            : "text-muted-foreground/60 hover:text-primary hover:bg-primary/10 hover:border-primary/20"
                        }`}
                    aria-label="Copy link"
                    title="Copy link"
                >
                    {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
                {markdownUrl && (
                    <button
                        onClick={handleCopyMarkdown}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md border border-border/30 bg-card/40 transition-all duration-200 ${copiedMarkdown
                                ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                                : "text-muted-foreground/60 hover:text-primary hover:bg-primary/10 hover:border-primary/20"
                            }`}
                        aria-label="Copy as markdown"
                        title="Copy as markdown"
                    >
                        {copiedMarkdown ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                )}
            </div>
        )
    }

    // "inline" variant — full-width card with label
    return (
        <div className="rounded-lg border border-border/30 bg-card/40 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground/80">
                    Share this article
                </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {PLATFORMS.map(({ key, label, Icon, hoverClass }) => (
                    <a
                        key={key}
                        href={links[key]}
                        target={key === "email" ? undefined : "_blank"}
                        rel={key === "email" ? undefined : "noopener noreferrer"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/30 bg-background/30 text-muted-foreground/70 text-xs font-medium transition-all duration-200 ${hoverClass}`}
                        aria-label={`Share on ${label}`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{label}</span>
                    </a>
                ))}
                <button
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${copiedLink
                            ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                            : "border-border/30 bg-background/30 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 hover:border-primary/20"
                        }`}
                    aria-label="Copy link"
                >
                    {copiedLink ? (
                        <>
                            <Check className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Copy link</span>
                        </>
                    )}
                </button>
                {markdownUrl && (
                    <button
                        onClick={handleCopyMarkdown}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${copiedMarkdown
                                ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                                : "border-border/30 bg-background/30 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 hover:border-primary/20"
                            }`}
                        aria-label="Copy as markdown"
                    >
                        {copiedMarkdown ? (
                            <>
                                <Check className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Markdown copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Copy as markdown</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
