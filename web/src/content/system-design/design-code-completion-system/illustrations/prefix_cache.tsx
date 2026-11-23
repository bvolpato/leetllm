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
    'A 1,280-token prompt strip contains exactly 1,200 matching prefix tokens and 80 delta tokens. Two model-service timelines share a 0 to 96 ms scale. A miss uses 72 ms prefill and 24 decode, totaling 96. A permitted hit uses 11 prefill and the same-width 24 decode, totaling 35. Prompt identity and scope govern reuse. Order strips show an early PSM prefix edit invalidating later suffix KV, while a supported suffix-first SPM keeps earlier suffix KV. Queue, network and paint are excluded.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const hitTone = getReadableToneColor('green', c, c.bg)
    const missTone = getReadableToneColor('blue', c, c.bg)
    const decodeTone = getReadableToneColor('purple', c, c.bg)
    const alertTone = getReadableToneColor('critical', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
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

    // Left chart scale: 0 to 100 ms -> 360 px
    const scale = (ms: number) => 58 + (ms * 360) / 100

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left: Latency Breakdown Bar Chart */}
                    <rect
                        x={24}
                        y={60}
                        width={430}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Miss bar (72ms prefill + 24ms decode = 96ms) */}
                    <rect
                        x={scale(0)}
                        y={145}
                        width={scale(72) - scale(0)}
                        height={36}
                        rx={4}
                        fill={missTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(72)}
                        y={145}
                        width={scale(96) - scale(72)}
                        height={36}
                        rx={4}
                        fill={decodeTone}
                        opacity={0.85}
                    />

                    {/* Hit bar (11ms prefill + 24ms decode = 35ms) */}
                    <rect
                        x={scale(0)}
                        y={240}
                        width={scale(11) - scale(0)}
                        height={36}
                        rx={4}
                        fill={hitTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(11)}
                        y={240}
                        width={scale(35) - scale(11)}
                        height={36}
                        rx={4}
                        fill={decodeTone}
                        opacity={0.85}
                    />

                    {/* Time Axis */}
                    <line
                        x1={scale(0)}
                        y1={305}
                        x2={scale(100)}
                        y2={305}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {[0, 25, 50, 75, 100].map((t) => (
                        <g key={t}>
                            <line
                                x1={scale(t)}
                                y1={305}
                                x2={scale(t)}
                                y2={312}
                                stroke={stroke}
                                strokeWidth={1.5}
                            />
                        </g>
                    ))}

                    {/* Token ratio badge */}
                    <rect
                        x={36}
                        y={350}
                        width={406}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Right: PSM vs SPM Token Order */}
                    <rect
                        x={474}
                        y={60}
                        width={362}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* PSM Container */}
                    <rect
                        x={486}
                        y={110}
                        width={338}
                        height={155}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={alertTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={498}
                        y={150}
                        width={150}
                        height={45}
                        rx={4}
                        fill={c.bgCard}
                        stroke={alertTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={662}
                        y={150}
                        width={150}
                        height={45}
                        rx={4}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* SPM Container */}
                    <rect
                        x={486}
                        y={285}
                        width={338}
                        height={175}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={hitTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={498}
                        y={325}
                        width={150}
                        height={45}
                        rx={4}
                        fill={c.bgCard}
                        stroke={hitTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={662}
                        y={325}
                        width={150}
                        height={45}
                        rx={4}
                        fill={c.bgCard}
                        stroke={alertTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'KV Prefix Cache Acceleration & Token Ordering Dynamics',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(
                36,
                75,
                406,
                '1. Inference Latency (1,280 Tokens Prompt)',
                16,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Miss Labels */}
            {label(
                48,
                120,
                250,
                'Full Cache MISS (All 1,280 tokens prefilled)',
                13,
                missTone,
                'left',
                650,
            )}
            {label(340, 120, 90, '96 ms total', 13, missTone, 'right', 650)}
            {label(scale(36) - 30, 155, 60, '72ms', 11, c.textPrimary, 'center', 600)}
            {label(scale(84) - 20, 155, 40, '24ms', 11, c.textPrimary, 'center', 600)}

            {/* Hit Labels */}
            {label(
                48,
                215,
                250,
                'Prefix HIT (1,200 tokens cached · 80 delta)',
                13,
                hitTone,
                'left',
                650,
            )}
            {label(340, 215, 90, '35 ms total', 13, hitTone, 'right', 650)}
            {label(scale(5) - 10, 250, 30, '11ms', 10, c.textPrimary, 'center', 600)}
            {label(scale(23) - 20, 250, 40, '24ms', 11, c.textPrimary, 'center', 600)}

            {/* Axis ticks */}
            {[0, 25, 50, 75, 100].map((t) => (
                <React.Fragment key={t}>
                    {label(scale(t) - 20, 316, 40, `${t}ms`, 11, c.textMuted, 'center')}
                </React.Fragment>
            ))}

            {/* Token Badge */}
            {label(48, 365, 382, 'Prefix Cache Efficiency:', 13, hitTone, 'left', 650)}
            {label(
                48,
                390,
                382,
                '• 1,200 tokens (93.8%) reused without GPU prefill',
                12,
                c.textMuted,
            )}
            {label(
                48,
                412,
                382,
                '• 61 ms latency reduction (2.7× faster response)',
                12,
                hitTone,
                'left',
                600,
            )}
            {label(
                48,
                434,
                382,
                '• Prefill scales linearly with sequence length; reuse eliminates it',
                11,
                c.textMuted,
            )}

            {/* Right Header */}
            {label(486, 75, 338, '2. KV Invalidation: PSM vs SPM', 16, c.textPrimary, 'left', 700)}

            {/* PSM Order */}
            {label(
                498,
                122,
                314,
                'PSM Order: <PRE> Prefix <SUF> Suffix <MID>',
                12,
                alertTone,
                'left',
                650,
            )}
            {label(508, 162, 130, 'Prefix edited', 12, alertTone, 'center', 600)}
            {label(672, 162, 130, 'Suffix KV invalid', 11, c.textMuted, 'center')}
            {label(
                498,
                208,
                314,
                'Typing at cursor changes early token positions, which invalidates all subsequent suffix KV blocks in causal attention.',
                11,
                alertTone,
            )}

            {/* SPM Order */}
            {label(
                498,
                298,
                314,
                'SPM Order: <SUF> Suffix <PRE> Prefix <MID>',
                12,
                hitTone,
                'left',
                700,
            )}
            {label(508, 338, 130, 'Suffix KV KEPT', 12, hitTone, 'center', 700)}
            {label(672, 338, 130, 'Prefix edited', 11, c.textMuted, 'center')}
            {label(
                498,
                385,
                314,
                'Suffix placed first remains static during typing.',
                11,
                c.textMuted,
            )}
            {label(
                498,
                405,
                314,
                'Only recent prefix tokens require re-computation, maximizing cache hit rate on consecutive keystrokes.',
                11,
                hitTone,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
