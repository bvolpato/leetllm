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
    'Continuous batch step cost conservation across a 4-GPU node over a 0.2-second forward step. Total compute equals 0.8 GPU-seconds or 0.2 node-seconds. Tenant allocation divides total compute according to batch token occupancy: Tenant A at 25 percent and Tenant B at 75 percent, summing exactly to 100 percent of step cost before rounding.'

export const numericAnchors = {
    stepSeconds: 0.2,
    gpus: 4,
    gpuSeconds: 0.8,
    nodeSeconds: 0.2,
    tenantAFraction: 0.25,
    tenantBFraction: 0.75,
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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Execution Panel */}
                    <rect
                        x={40}
                        y={72}
                        width={380}
                        height={235}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* 4 GPU lane tracks */}
                    {[0, 1, 2, 3].map((gpuIdx) => {
                        const y = 106 + gpuIdx * 34
                        return (
                            <rect
                                key={gpuIdx}
                                x={112}
                                y={y}
                                width={295}
                                height={26}
                                rx={4}
                                fill={theme === 'dark' ? '#1a2638' : '#e0f2fe'}
                                stroke={blueTone}
                                strokeWidth={1}
                            />
                        )
                    })}

                    {/* Right Attribution Panel */}
                    <rect
                        x={440}
                        y={72}
                        width={380}
                        height={235}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Tenant A & B mini-cards */}
                    <rect
                        x={448}
                        y={126}
                        width={178}
                        height={76}
                        rx={6}
                        fill={theme === 'dark' ? '#121c2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={634}
                        y={126}
                        width={178}
                        height={76}
                        rx={6}
                        fill={theme === 'dark' ? '#221532' : '#f5f3ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Conserved Proportion Bar */}
                    <rect x={448} y={270} width={91} height={24} rx={3} fill={blueTone} />
                    <rect x={541} y={270} width={271} height={24} rx={3} fill={purpleTone} />

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={40}
                        y={320}
                        width={780}
                        height={148}
                        rx={8}
                        fill={theme === 'dark' ? '#1c1712' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Continuous Batch Step: Compute Conservation & Cost Attribution',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Physical GPU execution time conserved across heterogeneous tenant token shares within each forward pass',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Box: 4 GPUs Parallel Execution (Width: 380) */}
            {label(
                52,
                84,
                350,
                'PARALLEL STEP EXECUTION (0.20 SECONDS)',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* GPU 0..3 Bars */}
            {[0, 1, 2, 3].map((gpuIdx) => {
                const y = 110 + gpuIdx * 34
                return (
                    <React.Fragment key={gpuIdx}>
                        {label(52, y + 4, 60, `GPU ${gpuIdx}`, 11, c.textSecondary, 'left', 600)}
                        {label(
                            120,
                            y + 4,
                            280,
                            '0.20s forward execution · tensor-parallel shard',
                            11,
                            c.textPrimary,
                            'left',
                            400,
                        )}
                    </React.Fragment>
                )
            })}

            {/* GPU Summary Metrics */}
            {label(52, 256, 350, 'Step Aggregation:', 11, c.textMuted, 'left', 600)}
            {label(
                52,
                274,
                350,
                '4 GPUs × 0.20 s = 0.80 GPU-seconds (0.20 Node-seconds)',
                12,
                blueTone,
                'left',
                600,
            )}

            {/* Right Box: Cost Attribution & Tenant Split (Width: 380) */}
            {label(
                452,
                84,
                350,
                'TENANT TOKEN ATTRIBUTION & LEDGER SPLIT',
                11,
                purpleTone,
                'left',
                700,
            )}
            {label(
                452,
                108,
                350,
                'Step Batch Size: 64 active sequence tokens',
                12,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Tenant A Allocation Card */}
            {label(452, 134, 170, 'Tenant A (16 tokens / 25%)', 12, blueTone, 'left', 700)}
            {label(452, 154, 170, 'Compute: 0.20 GPU-s', 11, c.textPrimary, 'left', 500)}
            {label(452, 172, 170, 'Cost: $0.000111', 13, blueTone, 'left', 700)}

            {/* Tenant B Allocation Card */}
            {label(638, 134, 170, 'Tenant B (48 tokens / 75%)', 12, purpleTone, 'left', 700)}
            {label(638, 154, 170, 'Compute: 0.60 GPU-s', 11, c.textPrimary, 'left', 500)}
            {label(638, 172, 170, 'Cost: $0.000333', 13, purpleTone, 'left', 700)}

            {/* Combined Allocation Bar Labels */}
            {label(
                452,
                218,
                350,
                'Conserved Total Cost: $0.000444 (Exact Rational Balance)',
                12,
                greenTone,
                'left',
                600,
            )}
            {label(
                452,
                240,
                350,
                '0.80 GPU-s × ($2.00 / 3600s) = 0.20 Node-s × ($8.00 / 3600s)',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Alert: Unit Mismatch Trap & Invariants */}
            {label(
                52,
                332,
                756,
                'Multi-Tenant Accounting Guardrails & Unit Mismatch Pitfall',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                52,
                356,
                756,
                '1. Match GPU-hour vs node-hour units. · 2. Bill active forward-step time, excluding queue wait. · 3. Round only at invoice display.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
