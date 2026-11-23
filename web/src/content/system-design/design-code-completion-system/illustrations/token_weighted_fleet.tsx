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
    'Comparison of three completion workloads sharing an identical 50 percent cache hit rate and 2,048-token overall mean. Because cache misses require full prefill while hits skip 75 percent, workload demand ranges from 716,800 tokens per second (36 GPUs) when hits are long to 1,331,200 tokens per second (67 GPUs) when misses are long, proving that token volume, not request count, dictates fleet capacity.'

export const numericAnchors = {
    typingEditors: 5000,
    rawReqsPerSec: 2000,
    canceledReqsPerSec: 1200,
    survivingReqsPerSec: 800,
    hitRate: 0.5,
    gpuCapacityTokensPerSec: 20000,
    scenarios: [
        { name: 'Long Hits (Hit 3,072 · Miss 1,024)', tokensPerSec: 716800, gpus: 36 },
        { name: 'Balanced (Hit 2,048 · Miss 2,048)', tokensPerSec: 1024000, gpus: 52 },
        { name: 'Short Hits (Hit 1,024 · Miss 3,072)', tokensPerSec: 1331200, gpus: 67 },
    ],
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const greenTone = getReadableToneColor('green', c, c.bg)
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const orangeTone = getReadableToneColor('warm', c, c.bg)
    const redTone = getReadableToneColor('critical', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 13,
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

    // Bar scaling: max tokens is 1,400,000; available bar width is 380px
    const maxTokens = 1400000
    const barW = (tok: number) => Math.round((tok / maxTokens) * 380)

    const rows = [
        {
            title: 'Cohort A: Long Hits (Hit 3,072 / Miss 1,024)',
            hitTok: 307200,
            missTok: 409600,
            totalTok: 716800,
            gpus: 36,
            badge: '36 GPUs',
            tone: greenTone,
        },
        {
            title: 'Cohort B: Balanced (Hit 2,048 / Miss 2,048)',
            hitTok: 204800,
            missTok: 819200,
            totalTok: 1024000,
            gpus: 52,
            badge: '52 GPUs',
            tone: blueTone,
        },
        {
            title: 'Cohort C: Short Hits (Hit 1,024 / Miss 3,072)',
            hitTok: 102400,
            missTok: 1228800,
            totalTok: 1331200,
            gpus: 67,
            badge: '67 GPUs (+86%)',
            tone: redTone,
        },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Top 3 Cards */}
                    <rect
                        x={40}
                        y={80}
                        width={248}
                        height={72}
                        rx={8}
                        fill={theme === 'dark' ? '#14171f' : '#f8fafc'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={304}
                        y={80}
                        width={248}
                        height={72}
                        rx={8}
                        fill={theme === 'dark' ? '#14171f' : '#f8fafc'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={568}
                        y={80}
                        width={252}
                        height={72}
                        rx={8}
                        fill={theme === 'dark' ? '#14171f' : '#f8fafc'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Connecting arrows between top cards */}
                    <path d="M 288 116 L 302 116" stroke={c.textMuted} strokeWidth={1.5} />
                    <path d="M 552 116 L 566 116" stroke={c.textMuted} strokeWidth={1.5} />

                    {/* Middle Rows Background & Bars */}
                    {rows.map((r, i) => {
                        const y = 196 + i * 68
                        const barStartX = 350
                        const hitW = barW(r.hitTok)
                        const missW = barW(r.missTok)

                        return (
                            <g key={`bar-row-${i}`}>
                                {/* Row background container */}
                                <rect
                                    x={40}
                                    y={y}
                                    width={780}
                                    height={58}
                                    rx={8}
                                    fill={theme === 'dark' ? '#12151c' : '#ffffff'}
                                    stroke={stroke}
                                    strokeWidth={1}
                                />

                                {/* Total bar track */}
                                <rect
                                    x={barStartX}
                                    y={y + 18}
                                    width={380}
                                    height={22}
                                    rx={4}
                                    fill={theme === 'dark' ? '#1a1f2c' : '#f1f5f9'}
                                />

                                {/* Hit bar segment */}
                                <rect
                                    x={barStartX}
                                    y={y + 18}
                                    width={hitW}
                                    height={22}
                                    rx={4}
                                    fill={greenTone}
                                    opacity={0.85}
                                />

                                {/* Miss bar segment */}
                                <rect
                                    x={barStartX + hitW}
                                    y={y + 18}
                                    width={missW}
                                    height={22}
                                    rx={4}
                                    fill={redTone}
                                    opacity={0.85}
                                />
                            </g>
                        )
                    })}

                    {/* Legend circles */}
                    <circle cx={340} cy={410} r={5} fill={greenTone} />
                    <circle cx={530} cy={410} r={5} fill={redTone} />

                    {/* Footer Insight Box */}
                    <rect
                        x={40}
                        y={432}
                        width={780}
                        height={50}
                        rx={8}
                        fill={theme === 'dark' ? '#111e2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Token-Weighted Fleet Sizing vs Request Counts',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                '50% cache hit rate and 2,048 avg tokens yield an 86% fleet variance depending on hit vs miss length',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Top Stage Pipeline Cards */}
            {/* Box 1 */}
            {label(48, 88, 230, 'CLIENT INGRESS', 11, c.textMuted, 'left', 700)}
            {label(48, 108, 230, '5,000 Typing Editors', 14, c.textPrimary, 'left', 700)}
            {label(
                48,
                128,
                230,
                '0.4 keystroke req/s → 2,000 req/s',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Box 2 */}
            {label(312, 88, 230, 'CLIENT DEBOUNCE FILTER', 11, orangeTone, 'left', 700)}
            {label(312, 108, 230, '1,200 Cancelled (60%)', 14, orangeTone, 'left', 700)}
            {label(
                312,
                128,
                230,
                'Fast typing drops stale requests early',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Box 3 */}
            {label(576, 88, 230, 'GPU INGRESS QUEUE', 11, greenTone, 'left', 700)}
            {label(576, 108, 230, '800 Surviving Req/s', 14, greenTone, 'left', 700)}
            {label(
                576,
                128,
                230,
                '400 Hits (skip 75%) + 400 Misses',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Middle Section Header */}
            {label(
                40,
                172,
                780,
                'WORKLOAD COMPARISON · IDENTICAL 50% CACHE HIT RATE, VARYING WORK',
                12,
                c.textMuted,
                'left',
                700,
            )}

            {/* Rows */}
            {rows.map((r, i) => {
                const y = 200 + i * 68
                return (
                    <React.Fragment key={`row-labels-${i}`}>
                        {label(40, y + 4, 300, r.title, 12, c.textPrimary, 'left', 600)}
                        {label(
                            40,
                            y + 24,
                            300,
                            `${r.totalTok.toLocaleString()} prefill tokens/s`,
                            11,
                            c.textSecondary,
                            'left',
                            400,
                        )}
                        {label(740, y + 12, 80, r.badge, 13, r.tone, 'right', 700)}
                    </React.Fragment>
                )
            })}

            {/* Legend */}
            {label(350, 404, 160, 'KV-Cache Hit Prefill (25%)', 11, greenTone, 'left', 500)}
            {label(540, 404, 160, 'Full Cache Miss Prefill (100%)', 11, redTone, 'left', 500)}

            {/* Architecture Takeaway Box */}
            {label(52, 442, 756, 'Key Architectural Insight', 12, blueTone, 'left', 700)}
            {label(
                52,
                460,
                756,
                'Autoscaling on request rate alone fails: fleet capacity must scale with token volume (prefill + decode), not HTTP requests.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
