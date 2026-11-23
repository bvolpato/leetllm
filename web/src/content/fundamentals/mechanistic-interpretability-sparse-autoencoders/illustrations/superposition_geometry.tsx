import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const alt =
    'Equal-scale coordinate diagram for the article’s constructed mixture. A credential direction c=[1,0] contributes 1.5c=[1.5,0]. The urgency direction u=[0.8,0.6] starts at that endpoint and finishes at x=[2.3,0.6]. A dashed origin-to-result vector shows both feature contributions sharing coordinate 1, whose value is 1.5 + 0.8 = 2.3.'
export const width = 560
export const height = 620

const plot = {
    x: 52,
    y: 8,
    width: 456,
    height: 302,
    padding: 32,
    xMin: -0.2,
    xMax: 2.6,
    yMin: -0.2,
    yMax: 1.5,
}
const innerWidth = plot.width - 2 * plot.padding
const innerHeight = plot.height - 2 * plot.padding
const xPixel = (value: number) =>
    plot.x + plot.padding + ((value - plot.xMin) / (plot.xMax - plot.xMin)) * innerWidth
const yPixel = (value: number) =>
    plot.y + plot.padding + ((plot.yMax - value) / (plot.yMax - plot.yMin)) * innerHeight

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    width: number,
    color = c.textPrimary,
    fontSize = 20,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
): React.ReactElement {
    return CanvasItem({
        x,
        y,
        width,
        height: Math.ceil(fontSize * 1.4),
        children: TextLabel({ c, text, width, color, fontSize, fontWeight: 650, align, mono }),
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const credential = getReadableToneColor('green', c, c.bg, c.bg)
    const urgency = getReadableToneColor('warm', c, c.bg, c.bg)
    const mixture = getReadableToneColor('purple', c, c.bg, c.bg)

    return Scene({
        c,
        title: 'Two features share one coordinate',
        subtitle: 'A constructed mixture: x = 1.5c + u',
        padding: 16,
        gap: 10,
        align: 'center',
        contentWidth: 560,
        children: Column({
            width: 560,
            gap: 8,
            align: 'center',
            children: [
                Row({
                    width: 520,
                    gap: 18,
                    align: 'center',
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'c = [1, 0]',
                            width: 200,
                            fontSize: 21,
                            color: credential,
                            fontWeight: 750,
                            align: 'center',
                            mono: true,
                        }),
                        TextLabel({
                            c,
                            text: 'u = [0.8, 0.6]',
                            width: 250,
                            fontSize: 21,
                            color: urgency,
                            fontWeight: 750,
                            align: 'center',
                            mono: true,
                        }),
                    ],
                }),
                Board({
                    c,
                    width: 560,
                    height: 355,
                    children: [
                        CanvasItem({
                            x: plot.x,
                            y: plot.y,
                            width: plot.width,
                            height: plot.height,
                            children: AxisPlot({
                                c,
                                width: plot.width,
                                height: plot.height,
                                padding: plot.padding,
                                xMin: plot.xMin,
                                xMax: plot.xMax,
                                yMin: plot.yMin,
                                yMax: plot.yMax,
                                showFrame: false,
                                showAxes: true,
                                showGrid: true,
                                gridCount: 4,
                                vectors: [
                                    {
                                        x1: 0,
                                        y1: 0,
                                        x2: 1.5,
                                        y2: 0,
                                        tone: 'green',
                                        strokeWidth: 5,
                                        arrow: true,
                                        arrowSize: 8,
                                    },
                                    {
                                        x1: 1.5,
                                        y1: 0,
                                        x2: 2.3,
                                        y2: 0.6,
                                        tone: 'warm',
                                        strokeWidth: 5,
                                        arrow: true,
                                        arrowSize: 8,
                                    },
                                ],
                                paths: [
                                    {
                                        points: [
                                            { x: 0, y: 0 },
                                            { x: 2.3, y: 0.6 },
                                        ],
                                        tone: 'purple',
                                        strokeWidth: 3,
                                        dashed: true,
                                        opacity: 0.9,
                                    },
                                ],
                            }),
                        }),
                        ...[0, 1, 2].map((value) =>
                            label(
                                c,
                                String(value),
                                xPixel(value) - 18,
                                plot.y + plot.height - 28,
                                36,
                                c.textSecondary,
                                19,
                                'center',
                                true,
                            ),
                        ),
                        ...[0, 0.5, 1.0].map((value) =>
                            label(
                                c,
                                value.toFixed(1),
                                4,
                                yPixel(value) - 12,
                                40,
                                c.textSecondary,
                                19,
                                'right',
                                true,
                            ),
                        ),
                        label(c, 'c₁', plot.x + 195, 329, 64, c.textSecondary, 20, 'center', true),
                        label(c, 'c₂', 8, 6, 38, c.textSecondary, 20, 'center', true),
                        label(
                            c,
                            '1.5c',
                            xPixel(1.5) - 80,
                            yPixel(0) - 36,
                            76,
                            credential,
                            20,
                            'center',
                            true,
                        ),
                        label(
                            c,
                            '+u',
                            xPixel(1.5) + 22,
                            yPixel(0.35) - 18,
                            52,
                            urgency,
                            20,
                            'center',
                            true,
                        ),
                        label(
                            c,
                            'x = [2.3, 0.6]',
                            xPixel(2.3) - 132,
                            yPixel(0.6) - 48,
                            146,
                            mixture,
                            18,
                            'right',
                            true,
                        ),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Coordinate 1:  1.5 × 1 + 1 × 0.8 = 2.3',
                    width: 540,
                    fontSize: 22,
                    color: c.textPrimary,
                    fontWeight: 750,
                    align: 'center',
                    mono: true,
                }),
                TextLabel({
                    c,
                    text: 'The two directions contribute to the same raw-axis reading.',
                    width: 540,
                    fontSize: 19,
                    color: c.textSecondary,
                    fontWeight: 550,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
