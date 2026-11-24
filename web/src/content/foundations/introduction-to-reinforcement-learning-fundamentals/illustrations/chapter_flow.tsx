import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const width = 760
export const height = 610
export const alt =
    'Two routes on a 3 by 4 cliff grid. A gold four-move shortcut runs from start (1,0) across row 1 then down to goal (2,3). A blue six-move route climbs to row 0 before crossing and descending. The three other bottom cells are cliffs with reward -50. Goal entry pays +20; other moves cost 1.'
const label = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    color = c.textPrimary,
    size = 24,
) => (
    <CanvasItem x={x} y={y} width={w} height={size + 12}>
        <TextLabel c={c} text={text} color={color} fontSize={size} align="center" />
    </CanvasItem>
)
const figure = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
        gold = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c),
        red = getReadableToneColor('red', c)
    const x = (col: number) => 80 + col * 190,
        y = (row: number) => 130 + row * 140
    return (
        <Board c={c} width={width} height={height}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {Array.from({ length: 12 }, (_, s) => (
                    <rect
                        key={s}
                        x={x(s % 4) - 66}
                        y={y(Math.floor(s / 4)) - 55}
                        width={132}
                        height={110}
                        rx={14}
                        fill={c.bgCard}
                        stroke={s === 11 ? green : s >= 8 ? red : c.borderSubtle}
                        strokeWidth={s >= 8 ? 3 : 1.5}
                    />
                ))}
                <polyline
                    points={`${x(0)},${y(1) - 15} ${x(0)},${y(0)} ${x(3) + 20},${y(0)} ${x(3) + 20},${y(2)}`}
                    fill="none"
                    stroke={blue}
                    strokeWidth={7}
                    strokeLinejoin="round"
                    opacity={0.8}
                />
                <polyline
                    points={`${x(0)},${y(1) + 15} ${x(3) + 44},${y(1) + 15} ${x(3) + 44},${y(2)} ${x(3) + 20},${y(2)}`}
                    fill="none"
                    stroke={gold}
                    strokeWidth={7}
                    strokeLinejoin="round"
                    opacity={0.9}
                />
                <circle cx={x(0)} cy={y(1)} r={16} fill={blue} stroke={c.bgCard} strokeWidth={4} />
                <circle
                    cx={x(3) + 20}
                    cy={y(2)}
                    r={17}
                    fill={green}
                    stroke={c.bgCard}
                    strokeWidth={4}
                />
            </svg>
            {label(c, 10, 6, 740, 'One destination. Two routes.', c.textPrimary, 31)}
            {[0, 1, 2].flatMap((r) =>
                [0, 1, 2, 3].map((col) =>
                    label(c, x(col) - 64, y(r) - 47, 72, `(${r},${col})`, c.textSecondary, 16),
                ),
            )}
            {label(c, x(0) - 60, y(1) + 24, 120, 'START', blue, 22)}
            {[0, 1, 2].map((col) => label(c, x(col) - 65, y(2) - 4, 130, 'Cliff −50', red, 23))}
            {label(c, x(3) - 65, y(2) + 24, 130, 'Goal +20', green, 22)}
            {label(c, 18, 490, 350, 'Shortcut · 4 moves', gold, 27)}
            {label(c, 390, 490, 350, 'Ridge · 6 moves', blue, 27)}
            {label(c, 20, 548, 720, 'Each ordinary move: −1', c.textSecondary, 26)}
        </Board>
    )
})
export const create = figure.create
export default figure.default
