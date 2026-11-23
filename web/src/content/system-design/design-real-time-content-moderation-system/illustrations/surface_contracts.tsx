import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const preset = 'engineering'
export const opaqueBackground = true

export const alt =
    'Content moderation surface contracts comparison across four interaction tiers: live chat, comments and replies, multimodal posts, and user profiles. Each surface defines specific latency budgets, synchronous versus asynchronous enforcement timing, pipeline stage coverage, and deterministic timeout fallback policies.'

export const numericAnchors = {
    surfaces: 4,
    chatBudgetMs: 50,
    commentBudgetMs: 400,
    postBudgetMs: 2000,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 12,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem
            x={x}
            y={y}
            width={w}
            height={Math.min(
                height - y,
                Math.ceil(
                    fontSize *
                        1.4 *
                        Math.max(1, Math.ceil((text.length * fontSize * 0.55) / Math.max(w, 1))),
                ),
            )}
        >
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={weight}
            />
        </CanvasItem>
    )

    const surfaces = [
        {
            title: '1. Live Stream Chat',
            badge: '< 50 ms P99',
            color: blueTone,
            bgDark: '#121824',
            bgLight: '#eff6ff',
            timing: 'Synchronous Inline',
            stages: 'Exact hash, regex, fast CNN',
            action: 'Drop, redact, or pass message',
            fallback: 'Fail-open + async retroactive audit',
        },
        {
            title: '2. Comments & Replies',
            badge: '< 400 ms P95',
            color: purpleTone,
            bgDark: '#181224',
            bgLight: '#faf5ff',
            timing: 'Near-Real-Time Gateway',
            stages: 'Full text classifier + embeddings',
            action: 'Publish, shadow-hide, or queue',
            fallback: 'Optimistic publish + fast rollback',
        },
        {
            title: '3. Multimodal Posts',
            badge: '< 2.0 s P95',
            color: warmTone,
            bgDark: '#221a10',
            bgLight: '#fffbeb',
            timing: 'Staged Pre-Distribution',
            stages: 'OCR, ViT, audio, Llama Guard',
            action: 'Public feed, quarantine, label',
            fallback: 'Hold in pending queue until resolved',
        },
        {
            title: '4. Profiles & Badges',
            badge: 'Async Batch',
            color: greenTone,
            bgDark: '#102216',
            bgLight: '#f0fdf4',
            timing: 'Background Ingestion',
            stages: 'Facial hash, brand spoof, human',
            action: 'Approve, suspend, request KYC',
            fallback: 'Pending badge review state',
        },
    ]

    const colWidth = 186
    const colGap = 12
    const startX = 35
    const cardTop = 85
    const cardHeight = 246

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Frames */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {surfaces.map((s, idx) => {
                        const x = startX + idx * (colWidth + colGap)
                        return (
                            <g key={idx}>
                                <rect
                                    x={x}
                                    y={cardTop}
                                    width={colWidth}
                                    height={cardHeight}
                                    rx={8}
                                    fill={theme === 'dark' ? s.bgDark : s.bgLight}
                                    stroke={stroke}
                                    strokeWidth={1}
                                />
                                <rect
                                    x={x}
                                    y={cardTop}
                                    width={colWidth}
                                    height={5}
                                    rx={2}
                                    fill={s.color}
                                />
                            </g>
                        )
                    })}

                    {/* Bottom Invariant Box */}
                    <rect
                        x={35}
                        y={344}
                        width={790}
                        height={124}
                        rx={8}
                        fill={theme === 'dark' ? '#1c1712' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                35,
                20,
                790,
                'Moderation Surface Contracts & Latency Budgets',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                35,
                48,
                790,
                'Tailoring pipeline stages, enforcement deadlines, and degradation behavior to surface constraints',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* 4 Surface Cards */}
            {surfaces.map((s, idx) => {
                const x = startX + idx * (colWidth + colGap)
                return (
                    <React.Fragment key={idx}>
                        {label(
                            x + 12,
                            cardTop + 14,
                            colWidth - 24,
                            s.title,
                            13,
                            c.textPrimary,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 34,
                            colWidth - 24,
                            s.badge.toUpperCase(),
                            10,
                            s.color,
                            'left',
                            700,
                        )}

                        {/* Timing Model */}
                        {label(
                            x + 12,
                            cardTop + 62,
                            colWidth - 24,
                            'ENFORCEMENT TIMING',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 78,
                            colWidth - 24,
                            s.timing,
                            11,
                            s.color,
                            'left',
                            600,
                        )}

                        {/* Pipeline Stages */}
                        {label(
                            x + 12,
                            cardTop + 108,
                            colWidth - 24,
                            'ACTIVE STAGES',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        <CanvasItem x={x + 12} y={cardTop + 124} width={colWidth - 24} height={34}>
                            <div
                                style={{
                                    fontSize: '10px',
                                    color: c.textSecondary,
                                    lineHeight: '1.25',
                                }}
                            >
                                {s.stages}
                            </div>
                        </CanvasItem>

                        {/* Permitted Actions */}
                        {label(
                            x + 12,
                            cardTop + 160,
                            colWidth - 24,
                            'ENFORCEMENT ACTION',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 176,
                            colWidth - 24,
                            s.action,
                            10,
                            c.textPrimary,
                            'left',
                            500,
                        )}

                        {/* Timeout Fallback */}
                        {label(
                            x + 12,
                            cardTop + 204,
                            colWidth - 24,
                            'TIMEOUT FALLBACK',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        <CanvasItem x={x + 12} y={cardTop + 220} width={colWidth - 24} height={24}>
                            <div
                                style={{ fontSize: '10px', color: c.textMuted, lineHeight: '1.2' }}
                            >
                                {s.fallback}
                            </div>
                        </CanvasItem>
                    </React.Fragment>
                )
            })}

            {/* Bottom Invariant Banner */}
            {label(
                52,
                356,
                756,
                'Surface Contract Invariants & Failure Domains',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                52,
                380,
                756,
                '1. Isolate worker pools per surface. · 2. Enforce per-stage deadlines independently. · 3. Fail closed on severe safety matches.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
