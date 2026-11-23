import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 1280
export const height = 900
export const alt =
    'Sixteen query-head tiles are grouped four at a time onto four trained KV heads. Across 24 layers, each layer stores separate K and V values for 4096 positions, head width 64, and two bytes per value. The head-by-layer grids contain 384 MiB at 16 KV heads and 96 MiB at four KV heads, a fourfold cache reduction for this architecture. The grid cells represent one head in one layer for one K or V stream.'

const layers = 24
const queryHeads = 16
const dimensions = 64
const positions = 4096
const bytesPerValue = 2
const mib = (kvHeads: number) =>
    (2 * layers * kvHeads * dimensions * positions * bytesPerValue) / 2 ** 20

const label = (
    c: ReturnType<typeof getThemeColors>,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    fontSize = 42,
    fontWeight = 600,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={fontSize}
            fontWeight={fontWeight}
            color={color}
            align={align}
            math={false}
        />
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const structural = getReadableToneColor('neutral', c, c.bg)
    const headTones = ['blue', 'cyan', 'purple', 'green'] as const
    const headColors = headTones.map((tone) => getReadableToneColor(tone, c, c.bg))
    const keyFill = getToneFill('blue', c)
    const valueFill = getToneFill('warm', c)
    const queryX = 200
    const queryY = 196
    const queryW = 35
    const queryGap = 5
    const kvX = [872, 948, 1024, 1100]
    const kvY = 196
    const gridX = [132, 754]
    const gridY = 562
    const cellW = 13
    const cellH = 5
    const gapX = 3
    const gapY = 1
    const fullCacheMiB = mib(16)
    const groupedCacheMiB = mib(4)

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox="0 0 1280 900">
                    <defs>
                        <marker
                            id="gqa-arrow"
                            markerWidth="16"
                            markerHeight="16"
                            refX="13"
                            refY="8"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path d="M1 1 L14 8 L1 15 Z" fill={structural} />
                        </marker>
                    </defs>
                    {Array.from({ length: queryHeads }, (_, i) => {
                        const x = queryX + i * (queryW + queryGap)
                        const color = headColors[Math.floor(i / 4)]
                        return (
                            <rect
                                key={'q-' + i}
                                x={x}
                                y={queryY}
                                width={queryW}
                                height="54"
                                rx="8"
                                fill={getToneFill(headTones[Math.floor(i / 4)], c)}
                                stroke={color}
                                strokeWidth="3"
                            />
                        )
                    })}
                    {Array.from({ length: 4 }, (_, group) => {
                        const start = queryX + group * 4 * (queryW + queryGap) + queryW / 2
                        const end = start + 3 * (queryW + queryGap)
                        const mid = (start + end) / 2
                        const target = kvX[group] + 30
                        return (
                            <g key={'map-' + group}>
                                <path
                                    d={
                                        'M' +
                                        mid +
                                        ' 262 C' +
                                        mid +
                                        ' 296 ' +
                                        target +
                                        ' 296 ' +
                                        target +
                                        ' 253'
                                    }
                                    fill="none"
                                    stroke={headColors[group]}
                                    strokeWidth="4"
                                    markerEnd="url(#gqa-arrow)"
                                    opacity="0.88"
                                />
                                <path
                                    d={'M' + start + ' 254 V270 H' + end + ' V254'}
                                    fill="none"
                                    stroke={headColors[group]}
                                    strokeWidth="3"
                                />
                            </g>
                        )
                    })}
                    {Array.from({ length: 4 }, (_, group) => (
                        <rect
                            key={'kv-' + group}
                            x={kvX[group]}
                            y={kvY}
                            width="60"
                            height="54"
                            rx="10"
                            fill={getToneFill(headTones[group], c)}
                            stroke={headColors[group]}
                            strokeWidth="4"
                        />
                    ))}
                    <path d="M72 488 H1208" stroke={c.borderSubtle} strokeWidth="2" />
                    {([16, 4] as const).map((heads, modeIndex) => {
                        const x0 = gridX[modeIndex]
                        const rows = 2 * heads
                        return Array.from({ length: rows * layers }, (_, i) => {
                            const row = Math.floor(i / layers)
                            const col = i % layers
                            const x = x0 + col * (cellW + gapX)
                            const y = gridY + row * (cellH + gapY)
                            const isValue = row >= heads
                            return (
                                <rect
                                    key={'cache-' + heads + '-' + i}
                                    x={x}
                                    y={y}
                                    width={cellW}
                                    height={cellH}
                                    rx="1"
                                    fill={isValue ? valueFill : keyFill}
                                    stroke={
                                        isValue
                                            ? getReadableToneColor('warm', c, c.bg)
                                            : getReadableToneColor('blue', c, c.bg)
                                    }
                                    strokeWidth="0.7"
                                />
                            )
                        })
                    })}
                    <path
                        d="M132 553 H516 M132 658 H516 M132 754 H516"
                        stroke={structural}
                        strokeWidth="2"
                    />
                    <path
                        d="M754 553 H1138 M754 586 H1138 M754 610 H1138"
                        stroke={structural}
                        strokeWidth="2"
                    />
                    <path
                        d="M132 778 H516 M754 778 H1138"
                        stroke={c.borderSubtle}
                        strokeWidth="2"
                    />
                    <path
                        d="M580 516 H650"
                        stroke={structural}
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M638 504 L660 516 L638 528 Z"
                        fill={getReadableToneColor('green', c, c.bg)}
                    />
                </svg>
            </CanvasItem>
            {label(c, 40, 16, 1200, 58, 'Grouped-query attention shrinks K/V state', 50, 780)}
            {label(c, 160, 106, 410, 50, '16 query heads', 46, 760)}
            {label(
                c,
                840,
                106,
                390,
                50,
                '4 trained KV',
                46,
                760,
                getReadableToneColor('green', c, c.bg),
            )}
            {label(c, 330, 304, 620, 52, '4 queries → 1 trained KV head', 42, 650, c.textMuted)}
            {label(
                c,
                50,
                370,
                1180,
                52,
                '24 layers · separate K/V · 4096 positions',
                42,
                650,
                c.textMuted,
            )}
            {label(c, 50, 426, 1180, 52, 'Head width 64 · 2 bytes / value', 42, 650, c.textMuted)}
            {label(
                c,
                95,
                496,
                480,
                48,
                '16 KV heads · 384 MiB',
                44,
                780,
                getReadableToneColor('blue', c, c.bg),
            )}
            {label(
                c,
                695,
                496,
                480,
                48,
                '4 KV heads · 96 MiB',
                44,
                780,
                getReadableToneColor('green', c, c.bg),
            )}
            {label(c, 84, 778, 490, 52, 'Blue = K · warm = V', 42, 600, c.textMuted)}
            {label(c, 700, 778, 490, 52, 'Columns: layers 1–24', 42, 600, c.textMuted)}
        </Board>
    )
}

export default create('dark')
