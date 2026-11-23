"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"
import { ThumbsUp, MessageCircle, ChevronDown, ChevronUp, Send, LogIn, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Comment {
    id: string
    article_slug: string
    user_id: string
    parent_id: string | null
    body: string
    is_anonymous: boolean
    created_at: string
    updated_at: string
    author_display_name: string | null
    vote_count: number
    user_has_voted: boolean
}

type SortMode = "popular" | "newest" | "oldest"

function getInitials(name: string | null): string {
    if (!name) return "?"
    return name.charAt(0).toUpperCase()
}

function getAvatarColor(name: string | null): string {
    if (!name) return "bg-muted-foreground/20"
    const colors = [
        "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500",
        "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
        "bg-pink-500", "bg-orange-500",
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
}

function timeAgo(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diffMs = now - then
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    return `${Math.floor(months / 12)}y ago`
}

function CommentAvatar({ name }: { name: string | null }) {
    const color = getAvatarColor(name)
    return (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
            {getInitials(name)}
        </div>
    )
}

function CommentItem({
    comment,
    replies,
    depth,
    isLoggedIn,
    onVote,
    onReply,
}: {
    comment: Comment
    replies: Comment[]
    depth: number
    isLoggedIn: boolean
    onVote: (commentId: string) => void
    onReply: (parentId: string, body: string) => Promise<void>
}) {
    const [showReplies, setShowReplies] = useState(depth < 2)
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [replyText, setReplyText] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const displayName = comment.is_anonymous ? "Anonymous" : (comment.author_display_name || "User")

    async function handleSubmitReply() {
        if (!replyText.trim()) return
        setSubmitting(true)
        try {
            await onReply(comment.id, replyText.trim())
            setReplyText("")
            setShowReplyForm(false)
            setShowReplies(true)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={`${depth > 0 ? "ml-6 sm:ml-10 border-l-2 border-border/20 pl-4" : ""}`}>
            <div className="group py-3">
                {/* Author line */}
                <div className="flex items-center gap-2.5 mb-2">
                    <CommentAvatar name={comment.is_anonymous ? null : comment.author_display_name} />
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm font-semibold text-foreground/90 truncate">{displayName}</span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground/50">{timeAgo(comment.created_at)}</span>
                    </div>
                </div>

                {/* Body */}
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words pl-[42px]">
                    {comment.body}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-2 pl-[42px]">
                    <button
                        onClick={() => isLoggedIn ? onVote(comment.id) : undefined}
                        disabled={!isLoggedIn}
                        className={`inline-flex items-center gap-1.5 text-xs transition-all duration-200 ${comment.user_has_voted
                                ? "text-primary font-medium"
                                : "text-muted-foreground/50 hover:text-muted-foreground/80"
                            } ${!isLoggedIn ? "cursor-default" : "cursor-pointer"}`}
                        title={isLoggedIn ? (comment.user_has_voted ? "Remove upvote" : "Upvote") : "Log in to upvote"}
                    >
                        <ThumbsUp className={`h-3.5 w-3.5 ${comment.user_has_voted ? "fill-primary" : ""}`} />
                        {comment.vote_count > 0 && <span>{comment.vote_count}</span>}
                    </button>

                    {isLoggedIn && (
                        <button
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Reply
                        </button>
                    )}
                </div>

                {/* Reply form */}
                {showReplyForm && (
                    <div className="mt-3 pl-[42px]">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 resize-none"
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <Button
                                size="sm"
                                onClick={handleSubmitReply}
                                disabled={submitting || !replyText.trim()}
                                className="gap-1.5 text-xs"
                            >
                                <Send className="h-3 w-3" />
                                {submitting ? "Posting..." : "Reply"}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setShowReplyForm(false); setReplyText("") }}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Replies */}
            {replies.length > 0 && (
                <div>
                    {!showReplies && (
                        <button
                            onClick={() => setShowReplies(true)}
                            className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors ml-[42px] mb-2"
                        >
                            <ChevronDown className="h-3 w-3" />
                            {replies.length} {replies.length === 1 ? "reply" : "replies"}
                        </button>
                    )}
                    {showReplies && (
                        <>
                            <button
                                onClick={() => setShowReplies(false)}
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors ml-[42px] mb-1"
                            >
                                <ChevronUp className="h-3 w-3" />
                                Hide replies
                            </button>
                            {replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    replies={[]} // Only support 2 levels for now
                                    depth={depth + 1}
                                    isLoggedIn={isLoggedIn}
                                    onVote={onVote}
                                    onReply={onReply}
                                />
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export function ArticleComments({
    slug,
    isLoggedIn,
}: {
    slug: string
    isLoggedIn?: boolean
}) {
    const [comments, setComments] = useState<Comment[]>([])
    const [activated, setActivated] = useState(false)
    const [loading, setLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [loadError, setLoadError] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [sortMode, setSortMode] = useState<SortMode>("popular")
    const [searchQuery, setSearchQuery] = useState("")
    const sectionRef = useRef<HTMLElement>(null)
    const initialLoadStarted = useRef(false)
    const { isLoggedIn: clientIsLoggedIn, authLoaded } = useIsLoggedIn()
    const resolvedIsLoggedIn = authLoaded ? clientIsLoggedIn : (isLoggedIn ?? false)

    const fetchComments = useCallback(async () => {
        setLoading(true)
        setLoadError(false)
        try {
            const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
            if (!res.ok) throw new Error(`Comments request failed with ${res.status}`)
            const data = await res.json()
            setComments(data.comments || [])
            setHasLoaded(true)
        } catch (err) {
            console.error("Failed to load comments:", err)
            setLoadError(true)
        } finally {
            setLoading(false)
        }
    }, [slug])

    useEffect(() => {
        const section = sectionRef.current
        if (!section || activated || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setActivated(true)
                observer.disconnect()
            }
        }, { rootMargin: "600px 0px" })

        observer.observe(section)
        return () => observer.disconnect()
    }, [activated])

    useEffect(() => {
        if (!activated || initialLoadStarted.current) return
        initialLoadStarted.current = true
        void fetchComments()
    }, [activated, fetchComments])

    async function handleSubmit() {
        if (!newComment.trim()) return
        setSubmitting(true)
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, body: newComment.trim() }),
            })
            if (res.ok) {
                setNewComment("")
                fetchComments()
            }
        } finally {
            setSubmitting(false)
        }
    }

    async function handleReply(parentId: string, body: string) {
        const res = await fetch("/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, body, parentId }),
        })
        if (res.ok) {
            fetchComments()
        }
    }

    async function handleVote(commentId: string) {
        // Optimistic update
        setComments((prev) =>
            prev.map((c) => {
                if (c.id !== commentId) return c
                return {
                    ...c,
                    user_has_voted: !c.user_has_voted,
                    vote_count: c.user_has_voted ? c.vote_count - 1 : c.vote_count + 1,
                }
            })
        )

        try {
            await fetch("/api/comments/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId }),
            })
        } catch {
            fetchComments() // Revert on failure
        }
    }

    // Filter & sort
    const topLevel = comments.filter((c) => !c.parent_id)
    const repliesMap = new Map<string, Comment[]>()
    comments
        .filter((c) => c.parent_id)
        .forEach((c) => {
            const arr = repliesMap.get(c.parent_id!) || []
            arr.push(c)
            repliesMap.set(c.parent_id!, arr)
        })

    let filtered = topLevel
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(
            (c) =>
                c.body.toLowerCase().includes(q) ||
                (c.author_display_name || "").toLowerCase().includes(q)
        )
    }

    const sorted = [...filtered].sort((a, b) => {
        if (sortMode === "popular") return b.vote_count - a.vote_count
        if (sortMode === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const totalComments = comments.length

    return (
        <section ref={sectionRef} className="space-y-6 pt-8 border-t border-border/30" aria-labelledby="discussion-heading">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 id="discussion-heading" className="text-xl font-semibold [color:var(--reading-heading)]">
                        Discussion
                    </h2>
                    <p className="mt-1 text-sm [color:var(--reading-subtle)]">
                        Questions and insights from fellow learners.
                    </p>
                </div>
                {!activated && (
                    <Button variant="outline" size="sm" onClick={() => setActivated(true)}>
                        Load discussion
                    </Button>
                )}
            </div>

            {!activated ? (
                <div className="rounded-xl border border-border/40 bg-card/30 px-4 py-6 text-center text-sm text-muted-foreground/60">
                    Discussion loads when you reach this section.
                </div>
            ) : (
                <>
            {/* Header */}
            <div className="space-y-4">
                {/* Login banner or compose box */}
                {!authLoaded ? (
                    <div className="h-32 rounded-xl border border-border/40 bg-card/30 animate-pulse" />
                ) : resolvedIsLoggedIn ? (
                    <div className="space-y-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share your thoughts, ask a question, or help fellow learners..."
                            rows={3}
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 resize-none transition-all"
                        />
                        <div className="flex items-center justify-end">
                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={submitting || !newComment.trim()}
                                className="gap-1.5"
                            >
                                <Send className="h-3.5 w-3.5" />
                                {submitting ? "Posting..." : "Post Comment"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-6 rounded-xl border border-border/40 bg-card/40">
                        <Link href="/login">
                            <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                                <LogIn className="h-4 w-4" />
                                Log In to Join the Discussion
                            </Button>
                        </Link>
                        <p className="text-xs text-muted-foreground/50">
                            Your account is free and you can post anonymously if you choose.
                        </p>
                    </div>
                )}

                {/* Search + Sort */}
                {totalComments > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${totalComments} comment${totalComments !== 1 ? "s" : ""}...`}
                                className="w-full rounded-lg border border-border/40 bg-background/30 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20"
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground/50 hidden sm:inline">Sort By</span>
                            <select
                                value={sortMode}
                                onChange={(e) => setSortMode(e.target.value as SortMode)}
                                className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 cursor-pointer"
                            >
                                <option value="popular">Popular</option>
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Comments List */}
            {loading && !hasLoaded ? (
                <div className="flex flex-col gap-4 py-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted/30" />
                                <div className="h-3 w-24 rounded bg-muted/30" />
                            </div>
                            <div className="ml-10 h-4 rounded bg-muted/20 w-3/4" />
                        </div>
                    ))}
                </div>
            ) : loadError && !hasLoaded ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground/60">
                    <p className="text-sm">Discussion could not load.</p>
                    <Button variant="outline" size="sm" onClick={() => void fetchComments()}>
                        Retry
                    </Button>
                </div>
            ) : sorted.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground/50">
                    <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                        {searchQuery ? "No comments match your search." : "No comments yet. Be the first to share your thoughts!"}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border/20">
                    {sorted.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            replies={repliesMap.get(comment.id) || []}
                            depth={0}
                            isLoggedIn={resolvedIsLoggedIn}
                            onVote={handleVote}
                            onReply={handleReply}
                        />
                    ))}
                </div>
            )}
                </>
            )}
        </section>
    )
}
