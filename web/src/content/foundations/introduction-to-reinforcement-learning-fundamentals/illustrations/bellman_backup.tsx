import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'
import { solve } from './_parts/gridworld'
import { bellmanFilm } from './_parts/bellman-film'

export const width = 760
export const height = 580
export const alt =
    'Four synchronous Bellman sweeps propagate the goal reward backward along the deterministic shortcut. The value at (1,3) becomes 20 on sweep 1, at (1,2) becomes 17 on sweep 2, at (1,1) becomes 14.3 on sweep 3, and at start (1,0) becomes 11.87 on sweep 4. Each predecessor computes -1 plus 0.9 times the successor value. Terminal continuation is zero.'
const label = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 25,
    color = c.textPrimary,
) => (
    <CanvasItem x={x} y={y} width={w} height={size + 12}>
        <TextLabel c={c} text={text} fontSize={size} color={color} align="center" />
    </CanvasItem>
)
const figure = defineIllustration((c) => {
    const warm = getReadableToneColor('warm', c),
        green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)
    const { sweeps } = solve(0, 4)
    return (
        <Board c={c} width={width} height={height}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {[0, 1, 2, 3].map((i) => (
                    <React.Fragment key={i}>
                        <rect
                            x={20 + i * 188}
                            y={112}
                            width={158}
                            height={145}
                            rx={16}
                            fill={c.bgCard}
                            stroke={i === 0 ? blue : green}
                            strokeWidth={2}
                        />
                        {i < 3 && (
                            <path
                                d={`M ${199 + i * 188} 188 L ${181 + i * 188} 188 M ${187 + i * 188} 182 L ${181 + i * 188} 188 L ${187 + i * 188} 194`}
                                fill="none"
                                stroke={warm}
                                strokeWidth={3}
                            />
                        )}
                    </React.Fragment>
                ))}
            </svg>
            {label(c, 20, 12, 720, 'The reward travels backward', 32)}
            {[0, 1, 2, 3].map((i) => (
                <React.Fragment key={i}>
                    {label(
                        c,
                        20 + i * 188,
                        126,
                        158,
                        i === 0 ? 'Start (1,0)' : `(1,${i})`,
                        23,
                        c.textSecondary,
                    )}
                    {label(
                        c,
                        20 + i * 188,
                        177,
                        158,
                        sweeps[4 - i]![4 + i]!.toFixed(2),
                        35,
                        i === 0 ? blue : green,
                    )}
                    {label(c, 20 + i * 188, 275, 158, `Sweep ${4 - i}`, 24, c.textSecondary)}
                </React.Fragment>
            ))}
            {label(c, 20, 354, 720, '11.87 = −1 + 0.90 × 14.30', 31, blue)}
            {label(c, 20, 412, 720, '14.30 = −1 + 0.90 × 17.00', 29)}
            {label(c, 20, 470, 720, '17.00 = −1 + 0.90 × 20.00', 29)}
            {label(
                c,
                20,
                530,
                720,
                'Goal entry: +20 · terminal continuation: 0',
                23,
                c.textSecondary,
            )}
        </Board>
    )
})
export const create = figure.create
export const createFilm = (theme: ThemeMode) => bellmanFilm(theme)
export default figure.default
