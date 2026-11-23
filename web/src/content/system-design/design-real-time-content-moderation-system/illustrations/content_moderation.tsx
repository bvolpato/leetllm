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
    'Real-time content moderation multi-stage cascade architecture. Ingress items from live chat, community posts, and user profiles pass through three tiered processing stages: Stage 1 exact hash and heuristic rules (5ms latency, resolves 85% of traffic), Stage 2 lightweight distilled ML classifiers (25ms latency, resolves 12% of traffic), and Stage 3 multimodal LLM policy judges and human review (500ms to minutes, handles 3% complex edge cases). An enforcement gateway commits versioned moderation decisions.'

export const numericAnchors = {
    stages: 3,
    stage1LatencyMs: 5,
    stage2LatencyMs: 25,
    stage3LatencyMs: 500,
    stage1ResolutionPercent: 85,
    stage2ResolutionPercent: 12,
    stage3ResolutionPercent: 3,
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

    const columns = [
        {
            title: 'Ingress Surfaces',
            badge: 'P95 SLA',
            color: blueTone,
            bgDark: '#121824',
            bgLight: '#eff6ff',
            items: [
                { name: 'Live Chat', detail: '< 50 ms budget (sync block)' },
                { name: 'Community Post', detail: '< 400 ms budget (pre-publish)' },
                { name: 'Profile / Media', detail: 'Async pipeline (async takedown)' },
            ],
        },
        {
            title: '1. Fast Rules & Cache',
            badge: '< 5 ms (85% Exit)',
            color: greenTone,
            bgDark: '#102216',
            bgLight: '#f0fdf4',
            items: [
                { name: 'Exact & SimHash', detail: 'Redis / RocksDB hash lookup' },
                { name: 'Perceptual Hash', detail: 'PDQ / PhotoDNA image match' },
                { name: 'Regex Blocklists', detail: 'Zero-tolerance safety terms' },
            ],
        },
        {
            title: '2. Distilled ML Models',
            badge: '15-40 ms (12% Exit)',
            color: purpleTone,
            bgDark: '#181224',
            bgLight: '#faf5ff',
            items: [
                { name: 'Fast Text CNN/BERT', detail: 'Hate, harassment, toxicity' },
                { name: 'ViT / ResNet Vision', detail: 'NSFW, gore, graphic violence' },
                { name: 'Calibrated Cutoffs', detail: 'High-confidence allow / block' },
            ],
        },
        {
            title: '3. LLM & Human Review',
            badge: '200ms-Hours (3%)',
            color: warmTone,
            bgDark: '#221a10',
            bgLight: '#fffbeb',
            items: [
                { name: 'Multimodal LLM', detail: 'Context, nuance, sarcasm' },
                { name: 'Policy Reasoning', detail: 'CoT justification & reason tags' },
                { name: 'Human Review Queue', detail: 'Priority ranked escalation pool' },
            ],
        },
    ]

    const colWidth = 186
    const colGap = 12
    const startX = 35
    const cardTop = 82
    const cardHeight = 246

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Connectors and Frames */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <marker
                            id="mod-flow-arr"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1 L 8 5 L 0 9 z" fill={c.textMuted} />
                        </marker>
                    </defs>

                    {/* 4 Pipeline Column Boxes */}
                    {columns.map((col, idx) => {
                        const x = startX + idx * (colWidth + colGap)
                        return (
                            <g key={idx}>
                                <rect
                                    x={x}
                                    y={cardTop}
                                    width={colWidth}
                                    height={cardHeight}
                                    rx={8}
                                    fill={theme === 'dark' ? col.bgDark : col.bgLight}
                                    stroke={stroke}
                                    strokeWidth={1}
                                />
                                <rect
                                    x={x}
                                    y={cardTop}
                                    width={colWidth}
                                    height={5}
                                    rx={2}
                                    fill={col.color}
                                />
                                {/* Internal item divider lines */}
                                <line
                                    x1={x + 12}
                                    y1={cardTop + 112}
                                    x2={x + colWidth - 12}
                                    y2={cardTop + 112}
                                    stroke={stroke}
                                    strokeWidth={1}
                                    strokeDasharray="2 2"
                                />
                                <line
                                    x1={x + 12}
                                    y1={cardTop + 168}
                                    x2={x + colWidth - 12}
                                    y2={cardTop + 168}
                                    stroke={stroke}
                                    strokeWidth={1}
                                    strokeDasharray="2 2"
                                />
                            </g>
                        )
                    })}

                    {/* Horizontal Connector Arrows between Columns */}
                    <line
                        x1={221}
                        y1={cardTop + 120}
                        x2={233}
                        y2={cardTop + 120}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#mod-flow-arr)"
                    />
                    <line
                        x1={419}
                        y1={cardTop + 120}
                        x2={431}
                        y2={cardTop + 120}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#mod-flow-arr)"
                    />
                    <line
                        x1={617}
                        y1={cardTop + 120}
                        x2={629}
                        y2={cardTop + 120}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#mod-flow-arr)"
                    />

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={35}
                        y={344}
                        width={790}
                        height={124}
                        rx={8}
                        fill={theme === 'dark' ? '#111e2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                35,
                20,
                790,
                'Real-Time Content Moderation: Multi-Stage Cascade Architecture',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                35,
                48,
                790,
                'Layered triage funnel routing user-generated text, image, and video across latency budgets and cost tiers',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* 4 Pipeline Columns */}
            {columns.map((col, idx) => {
                const x = startX + idx * (colWidth + colGap)
                return (
                    <React.Fragment key={idx}>
                        {label(
                            x + 12,
                            cardTop + 14,
                            colWidth - 24,
                            col.title,
                            13,
                            c.textPrimary,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 34,
                            colWidth - 24,
                            col.badge.toUpperCase(),
                            10,
                            col.color,
                            'left',
                            700,
                        )}

                        {col.items.map((item, itemIdx) => {
                            const itemY = cardTop + 62 + itemIdx * 56
                            return (
                                <React.Fragment key={itemIdx}>
                                    {label(
                                        x + 12,
                                        itemY,
                                        colWidth - 24,
                                        item.name,
                                        11,
                                        c.textPrimary,
                                        'left',
                                        600,
                                    )}
                                    {label(
                                        x + 12,
                                        itemY + 16,
                                        colWidth - 24,
                                        item.detail,
                                        10,
                                        c.textSecondary,
                                        'left',
                                        400,
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </React.Fragment>
                )
            })}

            {/* Bottom Guardrail Panel */}
            {label(
                52,
                356,
                756,
                'Cascade Execution Invariants & Fail-Safe Routing',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                380,
                756,
                '1. Early Exit Efficiency: Over 95% of traffic is resolved by fast rules and distilled models, reserving costly LLM inference for ambiguous edge cases. · 2. Latency Budget Timeouts: Synchronous surfaces (live chat) fail-open with post-delivery retroactive moderation if Stage 2/3 exceed 60ms deadline. · 3. Auditable Decision Schema: Every action logs the triggering classifier version, calibrated score vector, policy revision ID, and latency metrics.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
