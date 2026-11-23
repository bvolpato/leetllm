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
    'Content moderation cascade throughput and capacity funnel across four tiers. Starting with 10,000 requests per second at ingress: Tier 1 fast cache and rules resolves 8,000 req/s (80%) at microsecond latency and negligible cost; Tier 2 distilled ML classifiers resolves 1,500 req/s (15%); Tier 3 multimodal LLM judges resolves 400 req/s (4%); Tier 4 human review handles the remaining 100 req/s (1%) complex edge cases.'

export const numericAnchors = {
    ingressRps: 10000,
    tier1ExitRps: 8000,
    tier2ExitRps: 1500,
    tier3ExitRps: 400,
    tier4ExitRps: 100,
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

    const stages = [
        {
            name: 'Tier 1: Rules & Exact Cache',
            incoming: '10,000 req/s',
            resolved: '8,000 req/s (80%)',
            latency: '< 5 ms',
            cost: '$0.001 / 1k',
            color: greenTone,
            fillFraction: 0.8,
        },
        {
            name: 'Tier 2: Distilled ML Classifiers',
            incoming: '2,000 req/s',
            resolved: '1,500 req/s (15%)',
            latency: '25 ms',
            cost: '$0.02 / 1k',
            color: blueTone,
            fillFraction: 0.75,
        },
        {
            name: 'Tier 3: Multimodal LLM Judges',
            incoming: '500 req/s',
            resolved: '400 req/s (4%)',
            latency: '500 ms',
            cost: '$2.50 / 1k',
            color: purpleTone,
            fillFraction: 0.8,
        },
        {
            name: 'Tier 4: Human Review Queue',
            incoming: '100 req/s',
            resolved: '100 req/s (1%)',
            latency: 'Minutes / Hours',
            cost: '$50.00 / 1k',
            color: warmTone,
            fillFraction: 1.0,
        },
    ]

    const barStartX = 250
    const maxBarWidth = 360

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Bars */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Stages Background Container */}
                    <rect
                        x={35}
                        y={72}
                        width={790}
                        height={262}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {stages.map((st, idx) => {
                        const y = 84 + idx * 64
                        const incomingWidth =
                            idx === 0
                                ? maxBarWidth
                                : idx === 1
                                  ? maxBarWidth * 0.45
                                  : idx === 2
                                    ? maxBarWidth * 0.22
                                    : maxBarWidth * 0.1
                        const resolvedWidth = incomingWidth * st.fillFraction
                        const onwardWidth = incomingWidth - resolvedWidth

                        return (
                            <g key={idx}>
                                {/* Background lane track */}
                                <rect
                                    x={barStartX}
                                    y={y + 8}
                                    width={maxBarWidth}
                                    height={24}
                                    rx={4}
                                    fill={theme === 'dark' ? '#1a2232' : '#e2e8f0'}
                                />
                                {/* Resolved portion (Color filled) */}
                                <rect
                                    x={barStartX}
                                    y={y + 8}
                                    width={resolvedWidth}
                                    height={24}
                                    rx={idx === 3 ? 4 : 2}
                                    fill={st.color}
                                />
                                {/* Onward portion (Warm/Alert tint) */}
                                {onwardWidth > 0 && (
                                    <rect
                                        x={barStartX + resolvedWidth}
                                        y={y + 8}
                                        width={onwardWidth}
                                        height={24}
                                        rx={2}
                                        fill={warmTone}
                                        opacity={0.85}
                                    />
                                )}
                            </g>
                        )
                    })}

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={35}
                        y={344}
                        width={790}
                        height={124}
                        rx={8}
                        fill={theme === 'dark' ? '#102216' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                35,
                20,
                790,
                'Cascade Capacity & Throughput Filtering Funnel',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                35,
                48,
                790,
                'Filtering volume by 100x across tiers to protect expensive LLM and human review capacity',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Stages Funnel List */}
            {stages.map((st, idx) => {
                const y = 84 + idx * 64
                return (
                    <React.Fragment key={idx}>
                        {label(40, y + 2, 200, st.name, 11, c.textPrimary, 'left', 700)}
                        {label(
                            40,
                            y + 18,
                            200,
                            `In: ${st.incoming} · ${st.latency}`,
                            10,
                            c.textSecondary,
                            'left',
                            400,
                        )}
                        {label(40, y + 32, 200, `Cost: ${st.cost}`, 10, st.color, 'left', 600)}

                        {/* Bar Metrics Text */}
                        {label(
                            625,
                            y + 12,
                            190,
                            `Exit: ${st.resolved}`,
                            11,
                            c.textPrimary,
                            'left',
                            600,
                        )}
                    </React.Fragment>
                )
            })}

            {/* Bottom Invariant Panel */}
            {label(
                52,
                356,
                756,
                'Cascade Sizing & Capacity Planning Principles',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                380,
                756,
                '1. Funnel Compounding: A 1% decrease in Tier 1 cache hit rate doubles traffic to Tier 2, while a 2% drop in Tier 2 classifier precision can overwhelm Tier 3 LLM capacity by 4x. · 2. Backpressure Isolation: When the human review queue backlogs, the system sheds non-critical review candidates rather than halting real-time chat ingress. · 3. Proportional Scaling: Tier 1 scales with CPU/RAM cluster size; Tier 2 with lightweight GPU inference; Tier 3 with continuous-batching LLM clusters.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
