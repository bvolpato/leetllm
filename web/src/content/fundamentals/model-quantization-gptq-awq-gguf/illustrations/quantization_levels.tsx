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
export const height = 825
export const preset = 'engineering'
export const alt =
    'On one 0 to 60 GB scale, a 27-billion-weight payload falls from 54 GB at BF16 to 27 GB at INT8, 13.5 GB of INT4 codes plus 0.421875 GB of group scales, and 10.125 GB of INT3 codes plus the same scales. The 24 GB line leaves other allocations to budget. One 128-weight INT4 group stores 64 code bytes and a 2-byte FP16 scale, totaling 4.125 bits per weight.'

const parameters = 27_000_000_000
const scaleGroups = Math.ceil(parameters / 128)
const scaleBytes = scaleGroups * 2
const scaleGb = scaleBytes / 1e9

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const capacityText = theme === 'light' ? '#8a4b00' : c.warning
    const green = getReadableToneColor('green', c, c.bg)
    const grid = theme === 'light' ? '#94a3b8' : '#52627a'
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        size = 25,
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

    const x0 = 130
    const x1 = 640
    const xFor = (gb: number) => x0 + (gb / 60) * (x1 - x0)
    const rows = [
        { name: 'BF16', code: 54, metadata: 0, total: 54, color: blue, value: '54.000 GB' },
        { name: 'INT8', code: 27, metadata: 0, total: 27, color: purple, value: '27.000 GB' },
        {
            name: 'INT4',
            code: 13.5,
            metadata: scaleGb,
            total: 13.5 + scaleGb,
            color: warm,
            value: '13.922 GB',
        },
        {
            name: 'INT3',
            code: 10.125,
            metadata: scaleGb,
            total: 10.125 + scaleGb,
            color: green,
            value: '10.547 GB',
        },
    ]
    const valueLabels = rows.map((row, index) => {
        const y = 218 + index * 45
        const x = Math.max(xFor(row.total) + 8, 350)
        return index < 2
            ? { x: xFor(row.total) + 13, y, width: 96, plate: true }
            : { x, y, width: 100, plate: false }
    })

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {[0, 12, 24, 36, 48, 60].map((value) => (
                        <g key={`tick-${value}`}>
                            <line
                                x1={xFor(value)}
                                y1={178}
                                x2={xFor(value)}
                                y2={392}
                                stroke={value === 24 ? c.warning : grid}
                                strokeWidth={value === 24 ? 3 : 1.5}
                                strokeDasharray={value === 24 ? '8 7' : undefined}
                                opacity={value === 24 ? 0.95 : 0.58}
                            />
                            <line
                                x1={xFor(value)}
                                y1={171}
                                x2={xFor(value)}
                                y2={181}
                                stroke={grid}
                                strokeWidth={2}
                            />
                        </g>
                    ))}
                    <line x1={x0} y1={180} x2={x1} y2={180} stroke={grid} strokeWidth={2} />
                    {rows.map((row, index) => {
                        const y = 224 + index * 45
                        const codeX = xFor(row.code)
                        const totalX = xFor(row.total)
                        return (
                            <g key={row.name}>
                                <rect
                                    x={x0}
                                    y={y}
                                    width={codeX - x0}
                                    height={24}
                                    rx={12}
                                    fill={row.color}
                                    opacity={0.9}
                                />
                                {row.metadata > 0 && (
                                    <rect
                                        x={codeX}
                                        y={y}
                                        width={totalX - codeX}
                                        height={24}
                                        rx={3}
                                        fill={warm}
                                    />
                                )}
                                <circle
                                    cx={totalX}
                                    cy={y + 12}
                                    r={5}
                                    fill={c.bg}
                                    stroke={row.color}
                                    strokeWidth={3}
                                />
                            </g>
                        )
                    })}
                    {valueLabels.map(
                        (item, index) =>
                            item.plate && (
                                <rect
                                    key={`value-label-plate-${index}`}
                                    x={item.x - 4}
                                    y={item.y - 1}
                                    width={item.width + 4}
                                    height={38}
                                    rx={5}
                                    fill={c.bg}
                                />
                            ),
                    )}
                    <line x1={23} y1={573} x2={677} y2={573} stroke={grid} strokeWidth={1.5} />
                    {Array.from({ length: 8 }, (_, i) => (
                        <g key={`block-${i}`}>
                            <rect
                                x={36 + i * 61}
                                y={655}
                                width={53}
                                height={33}
                                rx={5}
                                fill={blue}
                                opacity={0.86}
                            />
                            <line
                                x1={90 + i * 61}
                                y1={655}
                                x2={90 + i * 61}
                                y2={688}
                                stroke={c.bg}
                                strokeWidth={2}
                                opacity={0.7}
                            />
                        </g>
                    ))}
                    <rect x={544} y={655} width={36} height={33} rx={4} fill={warm} />
                    <rect
                        x={582}
                        y={655}
                        width={36}
                        height={33}
                        rx={4}
                        fill={warm}
                        opacity={0.65}
                    />
                </svg>
            </CanvasItem>

            {label(24, 12, 650, 'The payload has a real scale', 36)}
            {label(
                24,
                68,
                650,
                '27 billion weights · decimal GB · rounded totals',
                24,
                c.textSecondary,
            )}
            {label(24, 111, 175, 'Code payload', 23, blue)}
            {label(200, 111, 225, 'FP16 group scales', 23, warm)}
            {label(472, 111, 200, '24 GB capacity', 23, capacityText)}
            {label(xFor(24) - 50, 139, 100, '24 GB', 23, capacityText, 'center')}
            {label(25, 218, 92, 'BF16', 24, blue, 'right')}
            {label(25, 263, 92, 'INT8', 24, purple, 'right')}
            {label(25, 308, 92, 'INT4', 24, warm, 'right')}
            {label(25, 353, 92, 'INT3', 24, green, 'right')}
            {rows.map((row, index) =>
                label(
                    valueLabels[index].x,
                    valueLabels[index].y,
                    valueLabels[index].width,
                    row.value.replace(' GB', ''),
                    23,
                    c.textPrimary,
                ),
            )}
            {[0, 12, 24, 36, 48, 60].map((value) =>
                label(xFor(value) - 26, 396, 52, `${value}`, 23, c.textSecondary, 'center'),
            )}
            {label(24, 396, 66, 'GB', 23, c.textSecondary)}
            {label(25, 430, 650, 'INT4 13.5 + 0.421875 = 13.921875 GB', 23, c.textPrimary)}
            {label(25, 465, 650, 'INT3 10.125 + 0.421875 = 10.546875 GB', 23, c.textPrimary)}
            {label(
                25,
                500,
                650,
                '24 GB must also hold tensors, zeros and padding.',
                23,
                c.textSecondary,
            )}
            {label(
                25,
                534,
                650,
                'KV cache and workspace also draw from that budget.',
                23,
                c.textSecondary,
            )}

            {label(24, 578, 650, 'Zoom: one INT4 group of 128 weights', 27)}
            {label(36, 618, 500, '8 code blocks × 8 bytes', 24, c.textSecondary, 'center')}
            {label(36, 691, 480, '64 code bytes', 23, blue, 'center')}
            {label(531, 618, 136, 'FP16 scale', 23, warm, 'center')}
            {label(530, 688, 98, '2 bytes', 23, warm, 'center')}
            {label(26, 717, 650, '66 B × 8 bits/B ÷ 128 weights', 25, c.textPrimary)}
            {label(26, 749, 650, '= 4.125 bits/weight', 25, c.textPrimary)}
            {label(
                26,
                785,
                650,
                'Scale overhead: 3.125% over the 4-bit codes',
                23,
                c.textSecondary,
            )}
        </Board>
    )
}

export default create('dark')
