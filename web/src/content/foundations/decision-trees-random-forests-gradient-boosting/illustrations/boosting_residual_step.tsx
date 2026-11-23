import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
import data from '../assets/figure_data.json'

export const width = 680
export const height = 600
export const alt =
    'Growth targets 10, 20, and 60 mm are plotted against 1, 2, and 5 sunlight hours. All predictions begin at 30 mm. A stump averages residuals into corrections minus 15, minus 15, and plus 30. Learning rate 0.1 moves the predictions to 28.5, 28.5, and 33 mm. Dashed stems show the remaining errors.'
const x = (value: number) => 105 + ((value - 1) / 4) * 460
const y = (value: number) => 450 - (value / 70) * 300
export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const blue = getReadableToneColor('blue', c),
        green = getReadableToneColor('green', c),
        warm = getReadableToneColor('warm', c)
    const label = (
        text: string,
        left: number,
        top: number,
        w: number,
        size = 25,
        color = c.textPrimary,
    ) => (
        <CanvasItem x={left} y={top} width={w} height={size * 1.5}>
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={size}
                color={color}
                align="center"
            />
        </CanvasItem>
    )
    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                >
                    {[0, 10, 20, 30, 40, 50, 60, 70].map((v) => (
                        <line
                            key={v}
                            x1={74}
                            x2={615}
                            y1={y(v)}
                            y2={y(v)}
                            stroke={c.borderSubtle}
                        />
                    ))}
                    <line
                        x1={74}
                        x2={615}
                        y1={y(30)}
                        y2={y(30)}
                        stroke={blue}
                        strokeWidth={2}
                        strokeDasharray="7 6"
                    />
                    {VectorArrow({
                        x1: 74,
                        y1: 450,
                        x2: 630,
                        y2: 450,
                        color: c.textSecondary,
                        strokeWidth: 2,
                        arrowSize: 5,
                    })}
                    {VectorArrow({
                        x1: 74,
                        y1: 450,
                        x2: 74,
                        y2: 138,
                        color: c.textSecondary,
                        strokeWidth: 2,
                        arrowSize: 5,
                    })}
                    {data.sunlight.map((hours, i) => (
                        <React.Fragment key={i}>
                            <line
                                x1={x(hours)}
                                x2={x(hours)}
                                y1={y(data.rounds[1][i])}
                                y2={y(data.growth[i])}
                                stroke={warm}
                                strokeWidth={2}
                                strokeDasharray="5 6"
                            />
                            <circle
                                cx={x(hours)}
                                cy={y(data.growth[i])}
                                r={9}
                                fill={warm}
                            />
                            <circle
                                cx={x(hours)}
                                cy={y(30)}
                                r={6}
                                fill={c.bg}
                                stroke={blue}
                                strokeWidth={2}
                            />
                            <rect
                                x={x(hours) - 7}
                                y={y(data.rounds[1][i]) - 7}
                                width={14}
                                height={14}
                                fill={green}
                            />
                        </React.Fragment>
                    ))}
                </svg>
            </CanvasItem>
            {label('Apply one tenth of the fitted correction', 10, 12, 660, 29)}
            {label('○ initial 30', 25, 66, 190, 24, blue)}
            {label('● target', 245, 66, 170, 24, warm)}
            {label('■ updated', 445, 66, 190, 24, green)}
            {label('Growth (mm)', 10, 108, 190, 23, c.textSecondary)}
            {[0, 20, 40, 60].map((v) =>
                label(String(v), 15, y(v) - 16, 42, 23, c.textSecondary),
            )}
            {data.sunlight.map((hours, i) => (
                <React.Fragment key={i}>
                    {label(
                        String(hours),
                        x(hours) - 30,
                        460,
                        60,
                        24,
                        c.textSecondary,
                    )}
                    {label(
                        data.rounds[1][i].toFixed(1),
                        x(hours) - 48,
                        y(data.rounds[1][i]) - 42,
                        96,
                        25,
                        green,
                    )}
                </React.Fragment>
            ))}
            {label(
                'Sunlight (hours per day)',
                140,
                498,
                400,
                25,
                c.textSecondary,
            )}
            {label('30 + 0.1 × (−15) = 28.5', 20, 552, 350, 25)}
            {label('30 + 0.1 × 30 = 33', 380, 552, 280, 25)}
        </Board>
    )
}
export default create()

export { boostingFilm as createFilm } from './_parts/boosting-film'
