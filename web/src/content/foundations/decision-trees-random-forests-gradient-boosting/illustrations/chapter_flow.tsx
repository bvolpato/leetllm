import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'
import data from '../assets/figure_data.json'

export const width = 680
export const height = 640
export const alt =
    'Seventy training flowers plotted by petal width and length. Blue circles are versicolor; purple squares are virginica. A width cutoff of 1.75 cm separates 34 versicolor plus four virginica on the left from one versicolor plus 31 virginica on the right. Leaf virginica probabilities are 0.105 and 0.969.'
const x = (v: number) => 72 + ((v - 0.9) / 1.8) * 540
const y = (v: number) => 450 - ((v - 3) / 4.2) * 300
const label = (
    c: ThemeColors,
    text: string,
    left: number,
    top: number,
    w: number,
    size = 25,
    color = c.textPrimary,
) =>
    CanvasItem({
        x: left,
        y: top,
        width: w,
        height: size * 1.4,
        children: (
            <TextLabel c={c} text={text} width={w} fontSize={size} color={color} align="center" />
        ),
    })

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const blue = getReadableToneColor('blue', c),
        purple = getReadableToneColor('purple', c)
    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        <rect
                            x={72}
                            y={150}
                            width={x(data.cut) - 72}
                            height={300}
                            fill={c.bgSubtle}
                        />
                        <rect
                            x={x(data.cut)}
                            y={150}
                            width={612 - x(data.cut)}
                            height={300}
                            fill={c.bgCard}
                        />
                        {[3, 4, 5, 6, 7].map((v) => (
                            <line
                                key={v}
                                x1={72}
                                x2={612}
                                y1={y(v)}
                                y2={y(v)}
                                stroke={c.borderSubtle}
                            />
                        ))}
                        <line
                            x1={x(data.cut)}
                            x2={x(data.cut)}
                            y1={150}
                            y2={450}
                            stroke={c.textPrimary}
                            strokeWidth={2}
                            strokeDasharray="7 6"
                        />
                        {data.flowers.map((f, i) =>
                            f.species === 0 ? (
                                <circle
                                    key={i}
                                    cx={x(f.width)}
                                    cy={y(f.length)}
                                    r={5.5}
                                    fill={blue}
                                    stroke={c.bg}
                                    strokeWidth={1.3}
                                />
                            ) : (
                                <rect
                                    key={i}
                                    x={x(f.width) - 5.5}
                                    y={y(f.length) - 5.5}
                                    width={11}
                                    height={11}
                                    fill={purple}
                                    stroke={c.bg}
                                    strokeWidth={1.3}
                                />
                            ),
                        )}
                        {VectorArrow({
                            x1: 72,
                            y1: 450,
                            x2: 628,
                            y2: 450,
                            color: c.textSecondary,
                            strokeWidth: 2,
                            arrowSize: 5,
                        })}
                        {VectorArrow({
                            x1: 72,
                            y1: 450,
                            x2: 72,
                            y2: 138,
                            color: c.textSecondary,
                            strokeWidth: 2,
                            arrowSize: 5,
                        })}
                        <circle cx={125} cy={78} r={7} fill={blue} />
                        <rect x={374} y={71} width={14} height={14} fill={purple} />
                    </svg>
                ),
            }),
            label(c, 'One learned question: width ≤ 1.75 cm', 10, 12, 660, 29),
            label(c, 'versicolor', 140, 59, 185, 26, blue),
            label(c, 'virginica', 394, 59, 175, 26, purple),
            label(c, 'Length (cm)', 13, 108, 185, 23, c.textSecondary),
            ...[3, 4, 5, 6, 7].map((v) =>
                label(c, String(v), 20, y(v) - 15, 38, 23, c.textSecondary),
            ),
            ...[1, 1.5, 2, 2.5].map((v) =>
                label(c, String(v), x(v) - 30, 460, 60, 23, c.textSecondary),
            ),
            label(c, 'Petal width (cm)', 150, 498, 380, 25, c.textSecondary),
            label(c, '34 versicolor · 4 virginica', 20, 549, 320, 23),
            label(c, '1 versicolor · 31 virginica', 340, 549, 320, 23),
            label(c, 'P(virginica) = 0.105', 20, 587, 320, 25, blue),
            label(c, 'P(virginica) = 0.969', 340, 587, 320, 25, purple),
        ],
    })
}
export default create()
