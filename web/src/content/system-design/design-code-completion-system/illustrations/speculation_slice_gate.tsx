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
    'Dual-axis qualification gate evaluating speculative decoding suitability across completion slices. The qualification boundary requires at least 2.0 mean accepted draft tokens and at least 10 ms p95 latency reduction. Python imports pass with 3.8 accepted tokens and 42 ms improvement, while SQL queries fail with 1.1 tokens and a 7 ms latency regression.'

export const numericAnchors = {
    xDomain: [0, 5],
    yDomain: [-10, 50],
    thresholdTokens: 2.0,
    thresholdLatencyMs: 10,
    pythonSlice: { tokens: 3.8, latencyGainMs: 42, p95Baseline: 178, p95Speculative: 136 },
    sqlSlice: { tokens: 1.1, latencyGainMs: -7, p95Baseline: 169, p95Speculative: 176 },
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const greenTone = getReadableToneColor('green', c, c.bg)
    const redTone = getReadableToneColor('critical', c, c.bg)
    const blueTone = getReadableToneColor('blue', c, c.bg)

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

    // Coordinate mapping
    // Plot area: X in [110, 520], Y in [100, 420]
    // X: 0 -> 110, 5 -> 510 (slope: 400 / 5 = 80 px/token)
    // Y: -10 -> 400, +50 -> 100 (slope: -300 / 60 = -5 px/ms)
    const px = (tokens: number) => 110 + tokens * 80
    const py = (gainMs: number) => 400 - (gainMs + 10) * 5

    const xTicks = [0, 1, 2, 3, 4, 5]
    const yTicks = [-10, 0, 10, 20, 30, 40, 50]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Plot Background */}
                    <rect
                        x={110}
                        y={100}
                        width={400}
                        height={300}
                        fill={theme === 'dark' ? '#11141a' : '#f8fafc'}
                        stroke={stroke}
                        strokeWidth={1}
                        rx={6}
                    />

                    {/* Shaded Qualification Zone: X >= 2.0 (x >= 270) and Y >= 10 ms (y <= 300) */}
                    <rect
                        x={px(2.0)}
                        y={100}
                        width={510 - px(2.0)}
                        height={py(10) - 100}
                        fill={theme === 'dark' ? '#0f2b1d' : '#ecfdf5'}
                        opacity={0.7}
                    />

                    {/* Threshold Boundary Lines */}
                    {/* X threshold: tokens = 2.0 */}
                    <line
                        x1={px(2.0)}
                        y1={100}
                        x2={px(2.0)}
                        y2={400}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                    />

                    {/* Y threshold: latency gain = 10 ms */}
                    <line
                        x1={110}
                        y1={py(10)}
                        x2={510}
                        y2={py(10)}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                    />

                    {/* Zero line */}
                    <line
                        x1={110}
                        y1={py(0)}
                        x2={510}
                        y2={py(0)}
                        stroke={c.textMuted}
                        strokeWidth={1}
                        strokeDasharray="2 2"
                    />

                    {/* Grid lines */}
                    {xTicks.map((val) => (
                        <line
                            key={`grid-x-${val}`}
                            x1={px(val)}
                            y1={396}
                            x2={px(val)}
                            y2={404}
                            stroke={c.textMuted}
                            strokeWidth={1}
                        />
                    ))}
                    {yTicks.map((val) => (
                        <line
                            key={`grid-y-${val}`}
                            x1={106}
                            y1={py(val)}
                            x2={114}
                            y2={py(val)}
                            stroke={c.textMuted}
                            strokeWidth={1}
                        />
                    ))}

                    {/* Data Points */}
                    {/* Python Point (3.8, 42) */}
                    <circle cx={px(3.8)} cy={py(42)} r={7} fill={greenTone} />
                    <circle
                        cx={px(3.8)}
                        cy={py(42)}
                        r={11}
                        fill="none"
                        stroke={greenTone}
                        strokeWidth={2}
                        opacity={0.6}
                    />

                    {/* SQL Point (1.1, -7) */}
                    <circle cx={px(1.1)} cy={py(-7)} r={7} fill={redTone} />
                    <circle
                        cx={px(1.1)}
                        cy={py(-7)}
                        r={11}
                        fill="none"
                        stroke={redTone}
                        strokeWidth={2}
                        opacity={0.6}
                    />

                    {/* Right Side Cards */}
                    {/* Card 1: Rule 1 */}
                    <rect
                        x={550}
                        y={116}
                        width={270}
                        height={68}
                        rx={8}
                        fill={theme === 'dark' ? '#161a22' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Card 2: Rule 2 */}
                    <rect
                        x={550}
                        y={196}
                        width={270}
                        height={68}
                        rx={8}
                        fill={theme === 'dark' ? '#161a22' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Decision Box Python */}
                    <rect
                        x={550}
                        y={302}
                        width={270}
                        height={56}
                        rx={8}
                        fill={theme === 'dark' ? '#0e291b' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />

                    {/* Decision Box SQL */}
                    <rect
                        x={550}
                        y={368}
                        width={270}
                        height={56}
                        rx={8}
                        fill={theme === 'dark' ? '#2e1414' : '#fef2f2'}
                        stroke={redTone}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                22,
                780,
                'Speculative Decoding Slice Qualification Gate',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                50,
                780,
                'Selective enablement: only slices meeting token acceptance and net latency reduction activate speculation',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Plot Axis Labels */}
            {label(
                110,
                450,
                400,
                'Mean Accepted Draft Tokens per Verification Step',
                12,
                c.textSecondary,
                'center',
                600,
            )}
            {label(10, 76, 260, 'Net Latency Gain (ms)', 12, c.textSecondary, 'left', 600)}

            {/* X-axis tick labels */}
            {xTicks.map((val) => (
                <React.Fragment key={`xtick-${val}`}>
                    {label(px(val) - 20, 426, 40, `${val}`, 11, c.textMuted, 'center', 400)}
                </React.Fragment>
            ))}

            {/* Y-axis tick labels */}
            {yTicks.map((val) => (
                <React.Fragment key={`ytick-${val}`}>
                    {label(
                        60,
                        py(val) - 8,
                        40,
                        `${val > 0 ? '+' : ''}${val}`,
                        11,
                        val === 10 ? greenTone : c.textMuted,
                        'right',
                        400,
                    )}
                </React.Fragment>
            ))}

            {/* Plot Point Labels */}
            {/* Python Point */}
            {label(
                px(3.8) - 130,
                py(42) - 24,
                260,
                'Python Imports (3.8 tokens, +42 ms)',
                12,
                greenTone,
                'center',
                700,
            )}
            {label(
                px(3.8) - 130,
                py(42) + 12,
                260,
                'p95: 178ms → 136ms',
                11,
                c.textSecondary,
                'center',
                500,
            )}

            {/* SQL Point */}
            {label(
                px(1.1) + 14,
                py(-7) - 16,
                220,
                'SQL Queries (1.1 tokens, −7 ms)',
                12,
                redTone,
                'left',
                700,
            )}
            {label(
                px(1.1) + 14,
                py(-7) + 2,
                220,
                'p95: 169ms → 176ms (Regression)',
                11,
                c.textSecondary,
                'left',
                500,
            )}

            {/* Right Side Policy & Decision Cards */}
            {label(550, 96, 270, 'ROLLOUT CRITERIA', 12, c.textMuted, 'left', 700)}

            {/* Rule 1 Card */}
            {label(566, 126, 240, 'Rule 1: Draft Acceptance', 12, c.textPrimary, 'left', 600)}
            {label(
                566,
                146,
                240,
                'Mean accepted tokens >= 2.0 to amortize draft model forward passes.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Rule 2 Card */}
            {label(566, 206, 240, 'Rule 2: p95 Latency Reduction', 12, c.textPrimary, 'left', 600)}
            {label(
                566,
                226,
                240,
                'p95 completion latency gain >= +10 ms on target user slice.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Decision Outcomes */}
            {label(550, 282, 270, 'EVALUATION DECISIONS', 12, c.textMuted, 'left', 700)}

            {/* Qualified region badge */}
            {label(
                px(2.0) + 12,
                108,
                220,
                'QUALIFIED REGION (Speculative Enabled)',
                11,
                greenTone,
                'left',
                700,
            )}

            {/* Python decision */}
            {label(566, 312, 140, 'Python Imports', 13, greenTone, 'left', 700)}
            {label(700, 312, 100, 'ENABLED', 12, greenTone, 'right', 700)}
            {label(
                566,
                332,
                240,
                'Exceeds both gates; 23.6% latency cut.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* SQL decision */}
            {label(566, 378, 140, 'SQL Queries', 13, redTone, 'left', 700)}
            {label(700, 378, 100, 'DISABLED', 12, redTone, 'right', 700)}
            {label(
                566,
                398,
                240,
                'Draft acceptance too low; adds overhead.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
