import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 800
export const preset = 'engineering'
export const alt =
    'For four weights [0.3, minus 1.2, 2, 0.7], three quantization grids reconstruct 8-bit [0.2992, minus 1.1969, 2, 0.6929], 4-bit [0.2857, minus 1.1429, 2, 0.5714], and 2-bit [0, minus 2, 2, 0]. The first held-out output contraction uses activation column [2, 1, minus 1, 0.2]. Across all three columns, baseline-minus-reconstruction errors yield MSE values 0.000204, 0.067010, and 1.007200. Ideal code payloads are 4, 2, and 1 bytes; scale bytes are excluded.'

const weight = [0.3, -1.2, 2, 0.7]
const quantizedCodes = [
    [19, -76, 127, 44],
    [1, -4, 7, 2],
    [0, -1, 1, 0],
]
const quantizationSteps = [2 / 127, 2 / 7, 2]
const reconstructed = quantizedCodes.map((codes, rowIndex) =>
    codes.map((code) => code * quantizationSteps[rowIndex]),
)
const levels = [
    { bits: '8-bit', values: '[0.2992, −1.1969, 2, 0.6929]', color: 'blue' as const },
    { bits: '4-bit', values: '[0.2857, −1.1429, 2, 0.5714]', color: 'warm' as const },
    { bits: '2-bit', values: '[0, −2, 2, 0]', color: 'green' as const },
]
const outputErrors = [
    {
        bits: '8-bit',
        error: ['−0.000157', '−0.021260', '0.012598'],
        mse: '0.000204',
        colorIndex: 0,
    },
    {
        bits: '4-bit',
        error: ['−0.002857', '−0.385714', '0.228571'],
        mse: '0.067010',
        colorIndex: 1,
    },
    { bits: '2-bit', error: ['1.54', '−0.10', '0.80'], mse: '1.007200', colorIndex: 2 },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const colors = levels.map((level) => getReadableToneColor(level.color, c, c.bg))
    const originalColor = getReadableToneColor('purple', c, c.bg)
    const grid = theme === 'light' ? '#94a3b8' : '#52627a'
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        size = 24,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
    ) => {
        const displaySize = Math.max(size, 25)
        return (
            <CanvasItem
                key={`${x}-${y}-${text}`}
                x={x}
                y={y}
                width={w}
                height={Math.ceil(displaySize * 1.42)}
            >
                <TextLabel
                    c={c}
                    text={text}
                    fontSize={displaySize}
                    color={color}
                    width="100%"
                    align={align}
                />
            </CanvasItem>
        )
    }
    const plotX = (value: number) => 104 + ((value + 2) / 4) * 556
    const rowY = [152, 200, 248]

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {rowY.map((y, rowIndex) => (
                        <g key={`quant-grid-${rowIndex}`}>
                            <line
                                x1={plotX(-2)}
                                y1={y}
                                x2={plotX(2)}
                                y2={y}
                                stroke={grid}
                                strokeWidth={2}
                            />
                            {[-2, -1, 0, 1, 2].map((tick) => (
                                <line
                                    key={`tick-${rowIndex}-${tick}`}
                                    x1={plotX(tick)}
                                    y1={y - 6}
                                    x2={plotX(tick)}
                                    y2={y + 6}
                                    stroke={grid}
                                    strokeWidth={1.5}
                                    opacity={0.65}
                                />
                            ))}
                            {weight.map((value, index) => {
                                const xOriginal = plotX(value)
                                const xRebuilt = plotX(reconstructed[rowIndex][index])
                                return (
                                    <g key={`weight-${rowIndex}-${index}`}>
                                        <line
                                            x1={xOriginal}
                                            y1={y - 4}
                                            x2={xRebuilt}
                                            y2={y + 4}
                                            stroke={colors[rowIndex]}
                                            strokeWidth={3}
                                            opacity={0.82}
                                        />
                                        <circle
                                            cx={xOriginal}
                                            cy={y - 6}
                                            r={6.5}
                                            fill={originalColor}
                                            stroke={c.bg}
                                            strokeWidth={1.5}
                                        />
                                        <rect
                                            x={xRebuilt - 6.5}
                                            y={y + 1}
                                            width={13}
                                            height={13}
                                            rx={2}
                                            fill={colors[rowIndex]}
                                            stroke={c.bg}
                                            strokeWidth={1.5}
                                        />
                                    </g>
                                )
                            })}
                        </g>
                    ))}
                    <line x1={24} y1={434} x2={676} y2={434} stroke={grid} strokeWidth={1.5} />
                </svg>
            </CanvasItem>

            {label(24, 12, 650, 'Every grid leaves a different footprint', 36)}
            {label(
                24,
                68,
                650,
                'W = [0.3, −1.2, 2, 0.7] · ideal code bytes 4 / 2 / 1',
                23,
                c.textSecondary,
            )}
            {label(24, 107, 260, '○ original weight', 23, originalColor)}
            {label(282, 107, 300, '□ reconstructed weight', 23, colors[1])}
            {levels.map((level, index) =>
                label(24, rowY[index] - 15, 74, level.bits, 23, colors[index]),
            )}
            {label(80, 260, 48, '−2', 23, c.textSecondary, 'center')}
            {label(358, 260, 48, '0', 23, c.textSecondary, 'center')}
            {label(636, 260, 48, '2', 23, c.textSecondary, 'center')}
            {levels.map((level, index) =>
                label(
                    24,
                    293 + index * 33,
                    650,
                    `Ŵ ${level.bits}: ${level.values}`,
                    23,
                    colors[index],
                ),
            )}
            {label(24, 396, 650, '2-bit symmetric grid: codes −1, 0, 1 · step 2', 23, colors[2])}

            {label(24, 442, 650, 'One output contraction · first held-out column', 25)}
            {label(24, 478, 310, 'x₀ = [2, 1, −1, 0.2]', 23, c.textSecondary)}
            {label(359, 478, 317, 'baseline y₀ = −2.46', 23, c.textSecondary)}
            {label(24, 512, 650, '4-bit: 0.2857×2 − 1.1429×1 − 2×1', 23, colors[1])}
            {label(24, 545, 650, '+ 0.5714×0.2 ≈ −2.4571', 23, colors[1])}
            {label(24, 578, 650, 'Residual y₀ − ŷ₀ = −0.00285714', 23, c.textPrimary)}

            {label(24, 611, 650, 'd = W·X − Ŵ·X · MSE = mean(d²)', 23)}
            {label(24, 650, 68, 'bits', 23, c.textSecondary)}
            {label(94, 650, 140, 'd₀', 23, c.textSecondary, 'center')}
            {label(224, 650, 140, 'd₁', 23, c.textSecondary, 'center')}
            {label(362, 650, 140, 'd₂', 23, c.textSecondary, 'center')}
            {label(528, 650, 148, 'MSE', 23, c.textSecondary, 'center')}
            {outputErrors.flatMap((item, index) => {
                const y = 679 + index * 33
                const color = colors[item.colorIndex]
                return [
                    label(24, y, 68, item.bits, 23, color),
                    label(94, y, 140, item.error[0], 23, c.textPrimary, 'center'),
                    label(224, y, 140, item.error[1], 23, c.textPrimary, 'center'),
                    label(362, y, 140, item.error[2], 23, c.textPrimary, 'center'),
                    label(528, y, 148, item.mse, 23, color, 'center'),
                ]
            })}
        </Board>
    )
}

export default create('dark')
