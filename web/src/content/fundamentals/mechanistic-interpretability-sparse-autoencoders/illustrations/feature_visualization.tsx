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
    'Equal-scale vector diagram for readout s(v) = 100v₂. The input x = [1, 0.1] separates into reconstruction x-hat = [1, 0] and residual e = [0, 0.1], where the residual carries score 10. Subtracting d1 = [1, 0] from x-hat leaves [0, 0] and score 0; subtracting d1 from x leaves e = [0, 0.1] and score 10.'
export const width = 560
export const height = 540

const plot = {
    x: 52,
    y: 6,
    width: 456,
    height: 198,
    padding: 24,
    xMin: -0.1,
    xMax: 1.1,
    yMin: -0.12,
    yMax: 0.32,
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
    fontSize = 19,
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
    const input = getReadableToneColor('purple', c, c.bg, c.bg)
    const reconstruction = getReadableToneColor('green', c, c.bg, c.bg)
    const residual = getReadableToneColor('warm', c, c.bg, c.bg)
    const lost = getReadableToneColor('critical', c, c.bg, c.bg)
    const preserved = getReadableToneColor('green', c, c.bg, c.bg)

    return Scene({
        c,
        title: 'The residual carries this readout',
        subtitle: 'Toy linear readout: s(v) = 100v₂',
        padding: 16,
        gap: 10,
        align: 'center',
        contentWidth: 560,
        children: Column({
            width: 560,
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 's(v) = 100v₂',
                    width: 520,
                    fontSize: 22,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                    mono: true,
                }),
                Row({
                    width: 540,
                    gap: 8,
                    align: 'center',
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'x = [1, 0.1]',
                            width: 172,
                            fontSize: 19,
                            color: input,
                            fontWeight: 700,
                            align: 'center',
                            mono: true,
                        }),
                        TextLabel({
                            c,
                            text: 'x̂ = [1, 0]',
                            width: 164,
                            fontSize: 19,
                            color: reconstruction,
                            fontWeight: 700,
                            align: 'center',
                            mono: true,
                        }),
                        TextLabel({
                            c,
                            text: 'e = [0, 0.1]',
                            width: 172,
                            fontSize: 19,
                            color: residual,
                            fontWeight: 700,
                            align: 'center',
                            mono: true,
                        }),
                    ],
                }),
                Board({
                    c,
                    width: 560,
                    height: 240,
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
                                        x2: 1,
                                        y2: 0.1,
                                        tone: 'purple',
                                        strokeWidth: 4,
                                        arrow: true,
                                        arrowSize: 8,
                                    },
                                    {
                                        x1: 0,
                                        y1: 0,
                                        x2: 1,
                                        y2: 0,
                                        tone: 'green',
                                        strokeWidth: 4,
                                        arrow: true,
                                        arrowSize: 8,
                                    },
                                    {
                                        x1: 1,
                                        y1: 0,
                                        x2: 1,
                                        y2: 0.1,
                                        tone: 'warm',
                                        strokeWidth: 4,
                                        arrow: true,
                                        arrowSize: 8,
                                    },
                                ],
                            }),
                        }),
                        ...[0, 0.5, 1].map((value) =>
                            label(
                                c,
                                value.toFixed(value === 0 ? 0 : 1),
                                xPixel(value) - 18,
                                plot.y + plot.height - 22,
                                36,
                                c.textSecondary,
                                19,
                                'center',
                                true,
                            ),
                        ),
                        ...[-0.1, 0, 0.1, 0.2, 0.3].map((value) =>
                            label(
                                c,
                                value.toFixed(1),
                                4,
                                yPixel(value) - 11,
                                40,
                                c.textSecondary,
                                19,
                                'right',
                                true,
                            ),
                        ),
                        label(c, 'x₁', plot.x + 192, 218, 72, c.textSecondary, 20, 'center', true),
                        label(c, 'x₂', 8, 3, 38, c.textSecondary, 20, 'center', true),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Subtract z₁d₁ = [1, 0]',
                    width: 540,
                    fontSize: 20,
                    color: c.textPrimary,
                    fontWeight: 750,
                    align: 'center',
                    mono: true,
                }),
                Board({
                    c,
                    width: 560,
                    height: 102,
                    children: [
                        label(c, 'from x̂', 20, 14, 100, lost, 20),
                        label(
                            c,
                            'x̂ − z₁d₁ = [0, 0]',
                            134,
                            14,
                            290,
                            c.textPrimary,
                            20,
                            'left',
                            true,
                        ),
                        label(c, 'score 0', 434, 14, 108, lost, 20, 'right', true),
                        CanvasItem({
                            x: 16,
                            y: 49,
                            width: 528,
                            height: 1,
                            children: React.createElement('div', {
                                style: {
                                    display: 'flex',
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: c.borderSubtle,
                                },
                            }),
                        }),
                        label(c, 'from x', 20, 62, 100, preserved, 20),
                        label(
                            c,
                            'x − z₁d₁ = e = [0, 0.1]',
                            134,
                            62,
                            290,
                            c.textPrimary,
                            20,
                            'left',
                            true,
                        ),
                        label(c, 'score 10', 434, 62, 108, preserved, 20, 'right', true),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
