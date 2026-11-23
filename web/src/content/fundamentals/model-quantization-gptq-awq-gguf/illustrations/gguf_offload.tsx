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
    'For the version-pinned 40-block llama.cpp example, requesting 24 GPU layers selects transformer blocks 17 through 39, the output layer, and leaves input assignment on CPU. A separate hypothetical 6,000 MB GPU budget reserves 2,000 MB, then fits trailing blocks 1, 2, and 3 at 2,000, 1,500, and 500 MB; block 0 at 1,000 MB stays on CPU. The diagram traces host mapping through page read and device copy.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
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
    const arrow = (x1: number, y: number, x2: number, color: string, key: string) => (
        <g key={key}>
            <line x1={x1} y1={y} x2={x2 - 11} y2={y} stroke={color} strokeWidth={3.5} />
            <path d={`M${x2 - 17} ${y - 8} L${x2} ${y} L${x2 - 17} ${y + 8} Z`} fill={color} />
        </g>
    )
    const blockX = (index: number) => 26 + index * 14.1
    const blockCenter = (index: number) => blockX(index) + 6.5

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {Array.from({ length: 40 }, (_, index) => (
                        <rect
                            key={`layer-${index}`}
                            x={blockX(index)}
                            y={168}
                            width={13}
                            height={39}
                            rx={2}
                            fill={index >= 17 ? green : grid}
                            opacity={index >= 17 ? 0.86 : 0.48}
                            stroke={c.bg}
                            strokeWidth={0.7}
                        />
                    ))}
                    <line x1={266} y1={158} x2={266} y2={214} stroke={warm} strokeWidth={3} />
                    <path d="M259 164 L266 153 L273 164 Z" fill={warm} />
                    <rect
                        x={596}
                        y={166}
                        width={83}
                        height={43}
                        rx={7}
                        fill={warm}
                        opacity={0.2}
                        stroke={warm}
                        strokeWidth={2.2}
                    />
                    <path
                        d="M25 250 V260 H254 V250 M273 250 V260 H592 V250"
                        fill="none"
                        stroke={grid}
                        strokeWidth={1.8}
                    />

                    <line x1={60} y1={429} x2={600} y2={429} stroke={grid} strokeWidth={2.5} />
                    <rect
                        x={60}
                        y={391}
                        width={180}
                        height={38}
                        rx={8}
                        fill={green}
                        opacity={0.72}
                    />
                    <rect x={240} y={391} width={135} height={38} fill={blue} opacity={0.76} />
                    <rect x={375} y={391} width={45} height={38} fill={warm} opacity={0.82} />
                    <rect
                        x={420}
                        y={391}
                        width={180}
                        height={38}
                        rx={8}
                        fill={grid}
                        opacity={0.34}
                    />
                    <line
                        x1={420}
                        y1={377}
                        x2={420}
                        y2={443}
                        stroke={c.textPrimary}
                        strokeWidth={2}
                        strokeDasharray="6 5"
                    />

                    <line x1={33} y1={582} x2={667} y2={582} stroke={grid} strokeWidth={2.2} />
                    {arrow(225, 582, 247, purple, 'mmap-to-read')}
                    {arrow(445, 582, 467, warm, 'read-to-copy')}
                    <circle cx={42} cy={582} r={7} fill={blue} />
                    <circle cx={262} cy={582} r={7} fill={purple} />
                    <circle cx={482} cy={582} r={7} fill={warm} />
                    <line x1={24} y1={621} x2={676} y2={621} stroke={grid} strokeWidth={1.5} />
                </svg>
            </CanvasItem>

            {label(24, 12, 650, 'The GPU takes a tail of layers', 36)}
            {label(24, 68, 650, 'Version-pinned 40-block llama.cpp example', 23, c.textSecondary)}
            {label(24, 105, 650, '−ngl 24 = blocks 17–39 + output layer', 25)}
            {label(594, 171, 88, 'output', 23, c.textPrimary, 'center')}
            {[0, 17, 39].map((index) =>
                label(
                    blockCenter(index) - 24,
                    218,
                    48,
                    `${index}`,
                    23,
                    index >= 17 ? green : c.textSecondary,
                    'center',
                ),
            )}
            {label(24, 264, 318, 'CPU · input + blocks 0–16', 23, c.textSecondary)}
            {label(360, 264, 316, 'GPU · blocks 17–39', 23, green)}

            {label(24, 300, 650, 'Trailing layer fit inside 6,000 MB budget', 26)}
            {label(
                24,
                340,
                650,
                '6,000 − 2,000 reserve = 4,000 MB for weights',
                23,
                c.textSecondary,
            )}
            {label(24, 435, 158, 'B1 · 2,000', 23, green)}
            {label(184, 435, 158, 'B2 · 1,500', 23, blue)}
            {label(344, 435, 156, 'B3 · 500', 23, warm)}
            {label(504, 435, 172, 'R · 2,000', 23, c.textSecondary)}
            {label(24, 474, 650, 'B0 · 1,000 stays on CPU.', 23, blue)}

            {label(24, 515, 650, 'Host-to-device data path', 25)}
            {label(24, 545, 200, 'mmap range', 23, blue, 'center')}
            {label(241, 545, 210, 'page fault / read', 23, purple, 'center')}
            {label(468, 545, 206, 'device copy', 23, warm, 'center')}
            {label(
                24,
                632,
                650,
                'Reserve 2,000 MB before counting trailing blocks.',
                23,
                c.textSecondary,
            )}
            {label(
                24,
                672,
                650,
                'Backend residency and speed require measurement.',
                23,
                c.textSecondary,
            )}
        </Board>
    )
}

export default create('dark')
