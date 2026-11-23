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
export const height = 760
export const preset = 'engineering'
export const alt =
    'The same held-out inputs pass through a source baseline and an exported, reloaded candidate with matching tokenizer, chat template, and decoding controls. Paired bars on a shared axis compare baseline and 4-bit outputs for three held-out columns: minus 2.460 versus minus 2.457 (difference minus 0.003), minus 3.100 versus minus 2.714 (difference minus 0.386), and 6.800 versus 6.571 (difference plus 0.229). Artifact identity, task quality, and serving profile are checked as three separate evidence streams.'

const columns = [
    { name: 'x₀', baseline: -2.46, candidate: -2.457143, delta: 'Δ −0.003' },
    { name: 'x₁', baseline: -3.1, candidate: -2.714286, delta: 'Δ −0.386' },
    { name: 'x₂', baseline: 6.8, candidate: 6.571429, delta: 'Δ +0.229' },
]
const BAR_LEFT = 110
const BAR_RIGHT = 548
const valueX = (v: number) => BAR_LEFT + ((v + 4) / 11) * (BAR_RIGHT - BAR_LEFT)
const rowTop = (index: number) => 410 + index * 48

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

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <line x1={24} y1={153} x2={676} y2={153} stroke={grid} strokeWidth={1.5} />
                    <line x1={24} y1={315} x2={676} y2={315} stroke={grid} strokeWidth={1.5} />
                    {arrow(214, 126, 238, purple, 'calibration-fit')}
                    {arrow(430, 126, 463, green, 'fit-export')}
                    <line x1={190} y1={184} x2={196} y2={184} stroke={purple} strokeWidth={3} />
                    <line x1={196} y1={184} x2={196} y2={235} stroke={purple} strokeWidth={3} />
                    {arrow(196, 184, 236, purple, 'heldout-baseline')}
                    {arrow(196, 235, 236, purple, 'heldout-candidate')}
                    <rect x={24} y={378} width={16} height={16} rx={3} fill={blue} />
                    <rect x={190} y={378} width={16} height={16} rx={3} fill={warm} />
                    {columns.map((column, index) => {
                        const top = rowTop(index)
                        const zero = valueX(0)
                        const bar = (value: number, y: number, color: string, key: string) => (
                            <rect
                                key={key}
                                x={Math.min(zero, valueX(value))}
                                y={y}
                                width={Math.abs(valueX(value) - zero)}
                                height={14}
                                rx={3}
                                fill={color}
                            />
                        )
                        return (
                            <g key={column.name}>
                                {bar(column.baseline, top, blue, `${column.name}-base`)}
                                {bar(column.candidate, top + 18, warm, `${column.name}-4b`)}
                            </g>
                        )
                    })}
                    <line
                        x1={valueX(0)}
                        y1={402}
                        x2={valueX(0)}
                        y2={rowTop(2) + 40}
                        stroke={c.textSecondary}
                        strokeWidth={2}
                    />
                    <line x1={24} y1={556} x2={676} y2={556} stroke={grid} strokeWidth={1.5} />
                    <line x1={128} y1={696} x2={572} y2={696} stroke={grid} strokeWidth={2.2} />
                    <circle cx={128} cy={696} r={7} fill={purple} />
                    <circle cx={350} cy={696} r={7} fill={green} />
                    <circle cx={572} cy={696} r={7} fill={warm} />
                </svg>
            </CanvasItem>

            {label(24, 12, 650, 'Fair comparisons share inputs', 36)}
            {label(
                24,
                68,
                650,
                'Calibration fits scales · held-out IDs test outputs',
                23,
                c.textSecondary,
            )}
            {label(24, 108, 190, 'calibration IDs', 23, purple)}
            {label(245, 108, 180, 'fit quantizer', 23, green, 'center')}
            {label(473, 108, 196, 'export artifact', 23, warm, 'center')}
            {label(24, 166, 165, 'held-out IDs', 23, purple)}
            {label(235, 164, 200, 'source baseline', 23, blue, 'center')}
            {label(235, 215, 200, 'export → reload', 23, warm, 'center')}
            {label(463, 164, 211, 'output trace', 23, blue, 'center')}
            {label(463, 215, 211, 'candidate trace', 23, warm, 'center')}
            {label(
                24,
                269,
                650,
                'Same tokenizer · chat template · decoding controls',
                23,
                c.textSecondary,
            )}

            {label(24, 325, 650, 'Paired outputs on three held-out columns', 24)}
            {label(48, 368, 130, 'baseline', 23, blue)}
            {label(214, 368, 130, '4-bit', 23, warm)}
            {columns.map((column, index) => (
                <React.Fragment key={`${column.name}-labels`}>
                    {label(24, rowTop(index) - 4, 70, column.name, 25, c.textSecondary)}
                    {label(560, rowTop(index) - 4, 116, column.delta, 23, green, 'right')}
                </React.Fragment>
            ))}

            {label(24, 566, 650, 'Check three evidence streams', 25)}
            {label(24, 596, 208, 'artifact identity', 23, purple, 'center')}
            {label(246, 596, 208, 'task quality', 23, green, 'center')}
            {label(468, 596, 208, 'serving profile', 23, warm, 'center')}
            {label(24, 629, 208, 'hash + reload', 23, c.textSecondary, 'center')}
            {label(246, 629, 208, 'held-out tasks', 23, c.textSecondary, 'center')}
            {label(468, 629, 208, 'TTFT + ITL', 23, c.textSecondary, 'center')}
            {label(24, 658, 208, 'tensor shape', 23, c.textSecondary, 'center')}
            {label(246, 658, 208, 'quality metrics', 23, c.textSecondary, 'center')}
            {label(468, 658, 208, 'memory', 23, c.textSecondary, 'center')}
            {label(
                24,
                712,
                650,
                'Cold load and JIT stay outside warm request timing.',
                23,
                c.textPrimary,
            )}
        </Board>
    )
}

export default create('dark')
