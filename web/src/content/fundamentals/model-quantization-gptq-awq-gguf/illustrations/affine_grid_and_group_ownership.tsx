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
export const height = 780
export const preset = 'engineering'
export const alt =
    'An affine grid over real values from minus 1 to 2 uses scale 0.2 and zero code 5; the signed representation uses zero code minus 3. Values minus 2, minus 1, 0, 0.73, 2, and 3 map to restored values minus 1, minus 1, 0, 0.8, 2, and 2. Sixteen unsigned codes remain available. At the bottom, two weight groups retain separate scales through their partial sums.'

const samples = [
    { value: -2, code: 0, restored: -1 },
    { value: -1, code: 0, restored: -1 },
    { value: 0, code: 5, restored: 0 },
    { value: 0.73, code: 9, restored: 0.8 },
    { value: 2, code: 15, restored: 2 },
    { value: 3, code: 15, restored: 2 },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
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
    const valueX = (value: number) => 72 + ((value + 2) / 5) * 556
    const codeX = (code: number) => 54 + code * 37

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <rect
                        x={valueX(-1)}
                        y={247}
                        width={valueX(2) - valueX(-1)}
                        height={143}
                        fill={blue}
                        opacity={0.11}
                    />
                    <line
                        x1={valueX(-2)}
                        y1={270}
                        x2={valueX(3)}
                        y2={270}
                        stroke={grid}
                        strokeWidth={3}
                    />
                    <line
                        x1={valueX(-2)}
                        y1={362}
                        x2={valueX(3)}
                        y2={362}
                        stroke={grid}
                        strokeWidth={3}
                    />
                    {[-2, -1, 0, 1, 2, 3].map((tick) => (
                        <g key={`real-tick-${tick}`}>
                            <line
                                x1={valueX(tick)}
                                y1={262}
                                x2={valueX(tick)}
                                y2={278}
                                stroke={grid}
                                strokeWidth={2}
                            />
                            <line
                                x1={valueX(tick)}
                                y1={354}
                                x2={valueX(tick)}
                                y2={370}
                                stroke={grid}
                                strokeWidth={2}
                            />
                        </g>
                    ))}
                    {samples.map((sample, index) => (
                        <g key={`mapping-${index}`}>
                            <line
                                x1={valueX(sample.value)}
                                y1={276}
                                x2={valueX(sample.restored)}
                                y2={356}
                                stroke={warm}
                                strokeWidth={2.6}
                                opacity={0.82}
                            />
                            <circle
                                cx={valueX(sample.value)}
                                cy={270}
                                r={7}
                                fill={blue}
                                stroke={c.bg}
                                strokeWidth={2}
                            />
                            <rect
                                x={valueX(sample.restored) - 6}
                                y={356}
                                width={12}
                                height={12}
                                rx={2}
                                fill={warm}
                                stroke={c.bg}
                                strokeWidth={2}
                            />
                        </g>
                    ))}
                    {Array.from({ length: 16 }, (_, code) => (
                        <g key={`unsigned-code-${code}`}>
                            <rect
                                x={codeX(code) - 16}
                                y={160}
                                width={32}
                                height={36}
                                rx={4}
                                fill={code === 5 ? warm : c.bgCard}
                                stroke={code === 5 ? warm : grid}
                                strokeWidth={code === 5 ? 2.5 : 1.4}
                            />
                        </g>
                    ))}
                    <line x1={37} y1={201} x2={642} y2={201} stroke={grid} strokeWidth={1.5} />
                    <line x1={32} y1={514} x2={669} y2={514} stroke={grid} strokeWidth={1.5} />
                    <rect
                        x={50}
                        y={629}
                        width={204}
                        height={38}
                        rx={18}
                        fill={blue}
                        opacity={0.2}
                        stroke={blue}
                        strokeWidth={2}
                    />
                    <rect
                        x={267}
                        y={629}
                        width={204}
                        height={38}
                        rx={18}
                        fill={green}
                        opacity={0.2}
                        stroke={green}
                        strokeWidth={2}
                    />
                    <path
                        d="M258 648 H267 M475 648 H501"
                        stroke={warm}
                        strokeWidth={3}
                        fill="none"
                    />
                    <path
                        d="M495 640 L505 648 L495 656"
                        stroke={warm}
                        strokeWidth={3}
                        fill="none"
                    />
                    <path
                        d="M45 617 V610 H257 V617 M263 617 V610 H475 V617"
                        fill="none"
                        stroke={grid}
                        strokeWidth={2}
                    />
                </svg>
            </CanvasItem>

            {label(24, 12, 650, 'Zero gets a place on the grid', 36)}
            {label(24, 68, 650, 'Interval [−1, 2] · scale S = 0.2', 24, c.textSecondary)}
            {label(24, 105, 650, 'Unsigned states 0–15 · Z = 5', 25, c.textPrimary)}
            {Array.from({ length: 16 }, (_, code) =>
                label(
                    codeX(code) - 17.5,
                    166,
                    35,
                    `${code}`,
                    23,
                    code === 5 ? c.bg : c.textPrimary,
                    'center',
                ),
            )}
            {label(24, 196, 290, 'Signed zero → Z = −3', 23, c.textSecondary)}
            {label(322, 196, 353, 'Signed −8…7 · 16 states', 23, c.textSecondary, 'right')}

            {label(24, 226, 110, 'input w', 23, blue)}
            {label(24, 322, 130, 'restore ŷ', 23, warm)}
            {[-2, -1, 0, 1, 2, 3].map((tick) =>
                label(valueX(tick) - 26, 376, 52, `${tick}`, 23, c.textSecondary, 'center'),
            )}
            {label(24, 403, 650, 'w → code q → reconstructed value', 23, c.textSecondary)}
            {samples.map((sample, index) => {
                const x = 24 + (index % 3) * 220
                const y = 439 + Math.floor(index / 3) * 34
                const input = Number.isInteger(sample.value) ? `${sample.value}` : '0.73'
                const output = Number.isInteger(sample.restored) ? `${sample.restored}` : '0.8'
                return label(x, y, 210, `${input} → ${sample.code} → ${output}`, 23, c.textPrimary)
            })}

            {label(24, 520, 650, 'Along one contraction, every group carries its scale', 25)}
            {label(42, 571, 220, 'S₀ Σⱼ(qⱼ−Z₀)xⱼ', 23, blue, 'center')}
            {label(265, 571, 220, 'S₁ Σⱼ(qⱼ−Z₁)xⱼ', 23, green, 'center')}
            {label(44, 633, 214, 'sum₀ · scale S₀', 23, blue, 'center')}
            {label(264, 633, 214, 'sum₁ · scale S₁', 23, green, 'center')}
            {label(507, 631, 165, 'accumulate', 23, warm, 'center')}
            {label(
                24,
                692,
                650,
                'Runtime arithmetic depends on the selected kernel.',
                23,
                c.textSecondary,
            )}
        </Board>
    )
}

export default create('dark')
