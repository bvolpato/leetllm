"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTheme } from "next-themes"
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type TokenStatus = "empty" | "draft" | "accepted" | "rejected"

interface StepDef {
    label: string
    duration: number
}

const STEPS: StepDef[] = [
    { label: "Waiting for draft model…", duration: 2000 },
    { label: "Draft model proposes 5 tokens at ~5× speed", duration: 2000 },
    { label: "Verifier checks all 5 in one forward pass", duration: 2500 },
    { label: "4/5 accepted — \"on\" replaced with \"upon\"", duration: 3500 },
]

const DRAFT_TOKENS = ["The", "cat", "sat", "on", "the"]
const VERIFIED_TOKENS = ["The", "cat", "sat", "upon", "the"]

// ─── Theme Colors (CSS-var driven for next-themes compat) ─────────────────────

function useColors() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => { queueMicrotask(() => setMounted(true)) }, [])
    const isDark = !mounted || resolvedTheme !== "light"

    return isDark
        ? {
            bg: "hsl(var(--card))",
            bgCard: "#1a1b26",
            textPrimary: "#f1f5f9",
            textSecondary: "#94a3b8",
            textMuted: "#64748b",
            border: "#334155",
            borderSubtle: "#1e293b",
            positive: "#059669",
            positiveLight: "#34d399",
            warning: "#d97706",
            warningLight: "#fbbf24",
            critical: "#dc2626",
            criticalLight: "#f87171",
            primary: "#7c3aed",
            info: "#06b6d4",
        }
        : {
            bg: "hsl(var(--card))",
            bgCard: "#f8fafc",
            textPrimary: "#0f172a",
            textSecondary: "#475569",
            textMuted: "#94a3b8",
            border: "#e2e8f0",
            borderSubtle: "#e2e8f0",
            positive: "#059669",
            positiveLight: "#10b981",
            warning: "#d97706",
            warningLight: "#f59e0b",
            critical: "#dc2626",
            criticalLight: "#ef4444",
            primary: "#7c3aed",
            info: "#0891b2",
        }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TokenSlot({
    label,
    status,
    colors,
    delay = 0,
}: {
    label: string
    status: TokenStatus
    colors: ReturnType<typeof useColors>
    delay?: number
}) {
    const styleMap = {
        empty: {
            bg: "transparent",
            border: colors.borderSubtle,
            color: colors.textMuted,
            icon: "",
        },
        draft: {
            bg: colors.warning + "20",
            border: colors.warning,
            color: colors.warning,
            icon: "?",
        },
        accepted: {
            bg: colors.positive + "20",
            border: colors.positive,
            color: colors.positive,
            icon: "✓",
        },
        rejected: {
            bg: colors.critical + "20",
            border: colors.critical,
            color: colors.critical,
            icon: "✗",
        },
    }

    const s = styleMap[status]
    const displayLabel = status === "empty" ? "___" : label

    return (
        <div
            className="flex flex-col items-center gap-0.5 transition-all duration-500 ease-out"
            style={{
                transitionDelay: `${delay}ms`,
                opacity: status === "empty" ? 0.5 : 1,
                transform: status === "empty" ? "scale(0.95)" : "scale(1)",
            }}
        >
            <div
                className="flex items-center justify-center rounded-lg font-mono text-xs sm:text-sm font-bold transition-all duration-400 ease-out"
                style={{
                    padding: "6px 8px",
                    minWidth: 44,
                    minHeight: 30,
                    backgroundColor: s.bg,
                    border: `2px solid ${s.border}`,
                    color: s.color,
                    transitionDelay: `${delay}ms`,
                }}
            >
                {displayLabel}
            </div>
            <div
                className="h-3.5 text-[10px] font-bold transition-all duration-300"
                style={{ color: s.color, transitionDelay: `${delay + 100}ms` }}
            >
                {s.icon}
            </div>
        </div>
    )
}

function ModelBadge({
    label,
    gradient,
}: {
    label: string
    gradient: string
}) {
    return (
        <div
            className="flex items-center justify-center rounded-lg px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white whitespace-nowrap flex-shrink-0"
            style={{ backgroundImage: gradient }}
        >
            {label}
        </div>
    )
}

function TokenRow({
    modelLabel,
    gradient,
    tokens,
    statuses,
    colors,
    visible,
    highlight,
    stagger = false,
}: {
    modelLabel: string
    gradient: string
    tokens: string[]
    statuses: TokenStatus[]
    colors: ReturnType<typeof useColors>
    visible: boolean
    highlight?: string
    stagger?: boolean
}) {
    return (
        <div
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-500 ease-out"
            style={{
                backgroundColor: colors.bgCard,
                border: highlight
                    ? `2px solid ${highlight}`
                    : `1px solid ${colors.borderSubtle}`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                maxHeight: visible ? 80 : 0,
                marginTop: visible ? 0 : -8,
                overflow: "hidden",
            }}
        >
            <ModelBadge label={modelLabel} gradient={gradient} />
            <span className="text-xs sm:text-sm" style={{ color: colors.textMuted }}>→</span>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {tokens.map((tok, i) => (
                    <TokenSlot
                        key={i}
                        label={tok}
                        status={statuses[i]}
                        colors={colors}
                        delay={stagger ? i * 80 : 0}
                    />
                ))}
            </div>
        </div>
    )
}

function StatBox({
    icon,
    label,
    value,
    color,
    colors,
    visible,
    delay = 0,
}: {
    icon: string
    label: string
    value: string
    color: string
    colors: ReturnType<typeof useColors>
    visible: boolean
    delay?: number
}) {
    return (
        <div
            className="flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-500 ease-out"
            style={{
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.borderSubtle}`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.95)",
                transitionDelay: `${delay}ms`,
                flex: "1 1 0",
                minWidth: 0,
            }}
        >
            <span className="text-base sm:text-lg">{icon}</span>
            <span className="text-[9px] sm:text-[10px] truncate w-full text-center" style={{ color: colors.textMuted }}>
                {label}
            </span>
            <span className="text-[10px] sm:text-xs font-bold truncate w-full text-center" style={{ color }}>
                {value}
            </span>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SpeculativeDecodingAnimation() {
    const colors = useColors()
    const [step, setStep] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    // Auto-play
    useEffect(() => {
        if (!isPlaying) return
        clearTimer()
        timerRef.current = setTimeout(() => {
            setStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : 0))
        }, STEPS[step].duration)
        return clearTimer
    }, [step, isPlaying, clearTimer])

    const goTo = useCallback(
        (i: number) => {
            clearTimer()
            setIsPlaying(false)
            setStep(i)
        },
        [clearTimer]
    )

    const goNext = useCallback(() => {
        goTo(step < STEPS.length - 1 ? step + 1 : 0)
    }, [step, goTo])

    const goPrev = useCallback(() => {
        goTo(step > 0 ? step - 1 : STEPS.length - 1)
    }, [step, goTo])

    const togglePlay = useCallback(() => setIsPlaying((p) => !p), [])

    const restart = useCallback(() => {
        clearTimer()
        setStep(0)
        setIsPlaying(true)
    }, [clearTimer])

    // ─── Derive per-step state ────────────────────────────────────────────

    const draftStatuses: TokenStatus[] =
        step === 0
            ? Array(5).fill("empty")
            : Array(5).fill("draft")

    const verifyStatuses: TokenStatus[] = [
        "accepted", "accepted", "accepted", "rejected", "accepted",
    ]

    const showDraftRow = step <= 2
    const showVerifyArrow = step >= 2
    const showVerifyRow = step >= 2
    const showStats = step === 3

    return (
        <div className="w-full mx-auto" style={{ maxWidth: 800 }}>
            <div
                className="rounded-xl overflow-hidden border border-border/40"
                style={{ backgroundColor: colors.bg }}
            >
                {/* ─── Fixed stage ─────────────────────────────────────── */}
                <div className="flex flex-col items-center px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 gap-3 sm:gap-4">
                    {/* Title — always fixed */}
                    <div className="flex flex-col items-center gap-1 mb-1 sm:mb-2">
                        <h3 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
                            Speculative Decoding
                        </h3>
                        <span className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>
                            Draft → Verify → Accept
                        </span>
                    </div>

                    {/* Step label — animates text only */}
                    <div
                        className="text-[11px] sm:text-xs font-semibold text-center px-3 py-1 rounded-md transition-all duration-300"
                        style={{
                            color: step === 3 ? colors.positive : colors.textMuted,
                            backgroundColor:
                                step === 3 ? colors.positive + "15" : "transparent",
                        }}
                    >
                        {STEPS[step].label}
                    </div>

                    {/* ─── Dynamic content area ───────────────────────── */}
                    <div className="w-full flex flex-col items-center gap-2 sm:gap-3">
                        {/* Draft row */}
                        <TokenRow
                            modelLabel="Draft (1B)"
                            gradient="linear-gradient(135deg, #2563eb, #60a5fa)"
                            tokens={DRAFT_TOKENS}
                            statuses={draftStatuses}
                            colors={colors}
                            visible={showDraftRow}
                            highlight={
                                step === 1 ? colors.warning + "40" : undefined
                            }
                            stagger={step === 1}
                        />

                        {/* Verify arrow */}
                        <div
                            className="text-xs font-semibold transition-all duration-500 ease-out"
                            style={{
                                color: colors.textMuted,
                                opacity: showVerifyArrow ? 1 : 0,
                                transform: showVerifyArrow
                                    ? "translateY(0)"
                                    : "translateY(-8px)",
                                maxHeight: showVerifyArrow ? 24 : 0,
                            }}
                        >
                            ▼ batch verify all 5 at once
                        </div>

                        {/* Verify row */}
                        <TokenRow
                            modelLabel="Verify (70B)"
                            gradient="linear-gradient(135deg, #7c3aed, #a855f7)"
                            tokens={VERIFIED_TOKENS}
                            statuses={
                                step >= 2 ? verifyStatuses : Array(5).fill("empty")
                            }
                            colors={colors}
                            visible={showVerifyRow}
                            highlight={step >= 2 ? colors.positive : undefined}
                            stagger={step === 2}
                        />

                        {/* Stats row */}
                        <div
                            className="flex gap-2 sm:gap-3 w-full transition-all duration-500 ease-out"
                            style={{
                                opacity: showStats ? 1 : 0,
                                transform: showStats
                                    ? "translateY(0)"
                                    : "translateY(12px)",
                                maxHeight: showStats ? 100 : 0,
                                marginTop: showStats ? 4 : 0,
                                overflow: "hidden",
                            }}
                        >
                            <StatBox
                                icon=">>"
                                label="Speed"
                                value="2–3× faster"
                                color={colors.positive}
                                colors={colors}
                                visible={showStats}
                                delay={0}
                            />
                            <StatBox
                                icon="="
                                label="Quality"
                                value="Identical"
                                color={colors.primary}
                                colors={colors}
                                visible={showStats}
                                delay={100}
                            />
                            <StatBox
                                icon="▸"
                                label="Key Insight"
                                value="Batched verify"
                                color={colors.info}
                                colors={colors}
                                visible={showStats}
                                delay={200}
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Controls bar ────────────────────────────────────── */}
                <div className="flex items-center justify-between px-3 py-2 bg-card/80 backdrop-blur-sm border-t border-border/30">
                    {/* Left: playback */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goPrev}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Previous step"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={goNext}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Next step"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={restart}
                            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground ml-1"
                            aria-label="Restart"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Center: dots + label */}
                    <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                        <div className="flex items-center gap-1.5">
                            {STEPS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => goTo(i)}
                                    className={`rounded-full transition-all duration-200 ${i === step
                                        ? "w-6 h-2 bg-primary"
                                        : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                        }`}
                                    aria-label={`Step ${i + 1}: ${s.label}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-muted-foreground/70 truncate hidden sm:block">
                            {STEPS[step].label}
                        </span>
                    </div>

                    {/* Right: counter */}
                    <span className="text-xs text-muted-foreground/50 tabular-nums flex-shrink-0">
                        {step + 1}/{STEPS.length}
                    </span>
                </div>
            </div>
        </div>
    )
}
