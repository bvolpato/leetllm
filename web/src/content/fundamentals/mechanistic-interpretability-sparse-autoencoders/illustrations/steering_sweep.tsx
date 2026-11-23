import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    DataTable,
    LineChart,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const width = 580
export const height = 770
export const alt =
    'Two-panel activation sweep diagram for x′ = [0.2, 0.1] + α[0, 1] at α = −1, 0, +1, +2. Top: equal-unit 2D vector space showing the sweep path alongside candidate [0, 1], overlapping [0.6, 0.8], and orthogonal [1, 0] directions. Bottom: line chart and projection table showing dot products: candidate −0.9, 0.1, 1.1, 2.1; overlap −0.6, 0.2, 1.0, 1.8; orthogonal 0.2 across all steps.'

function tick(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    color = c.textSecondary,
    align: 'left' | 'center' | 'right' = 'center',
    mono = true,
): React.ReactElement {
    return CanvasItem({
        x,
        y,
        width: w,
        height: 22,
        children: TextLabel({
            c,
            text,
            width: w,
            color,
            fontSize: 18,
            fontWeight: 650,
            align,
            mono,
        }),
    })
}

function spacePanel(c: ThemeColors): React.ReactElement {
    const candidate = getReadableToneColor('green', c)
    const overlap = getReadableToneColor('warm', c)
    const orthogonal = getReadableToneColor('blue', c)
    const sweep = getReadableToneColor('purple', c)
    const plot = { x: 152, y: 6, width: 224, height: 224, pad: 22, min: -1, max: 2.4 }
    const span = plot.width - 2 * plot.pad
    const px = (x: number) => plot.x + plot.pad + ((x - plot.min) / (plot.max - plot.min)) * span
    const py = (y: number) => plot.y + plot.pad + ((plot.max - y) / (plot.max - plot.min)) * span
    const alphas = [
        { text: 'α = +2', y: 2.1, dy: -10 },
        { text: 'α = +1', y: 1.1, dy: -10 },
        { text: 'α = 0', y: 0.1, dy: 20 },
        { text: 'α = −1', y: -0.9, dy: -10 },
    ]
    const vectors = [
        { x1: 0, y1: 0, x2: 0, y2: 1, color: candidate, strokeWidth: 4, arrow: true, arrowSize: 8 },
        {
            x1: 0,
            y1: 0,
            x2: 0.6,
            y2: 0.8,
            color: overlap,
            strokeWidth: 4,
            arrow: true,
            arrowSize: 8,
        },
        {
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 0,
            color: orthogonal,
            strokeWidth: 4,
            arrow: true,
            arrowSize: 8,
        },
    ]
    return Panel({
        c,
        title: 'Activation space: x′ = [0.2, 0.1] + α[0, 1]',
        titleFontSize: 20,
        width: 548,
        padding: 12,
        gap: 6,
        children: [
            Board({
                c,
                width: 520,
                height: 244,
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
                            padding: plot.pad,
                            xMin: plot.min,
                            xMax: plot.max,
                            yMin: plot.min,
                            yMax: plot.max,
                            showFrame: false,
                            showAxes: true,
                            showGrid: true,
                            gridCount: 3,
                            vectors,
                            paths: [
                                {
                                    points: [
                                        { x: 0.2, y: -0.9 },
                                        { x: 0.2, y: 2.1 },
                                    ],
                                    color: sweep,
                                    strokeWidth: 4,
                                },
                            ],
                            points: [-0.9, 0.1, 1.1, 2.1].map((y) => ({
                                x: 0.2,
                                y,
                                fill: sweep,
                                r: 5,
                            })),
                        }),
                    }),
                    ...[-1, 0, 1, 2].map((v) => tick(c, String(v), px(v) - 18, 214, 36)),
                    ...[-1, 0, 1, 2].map((v) =>
                        tick(c, String(v), 108, py(v) - 10, 36, c.textSecondary, 'right'),
                    ),
                    tick(c, 'x₁', 374, py(0) - 10, 30),
                    tick(c, 'x₂', px(0) - 18, 0, 36),
                    ...alphas.map((a) =>
                        tick(c, a.text, px(0.2) + 10, py(a.y) + a.dy, 84, sweep, 'left', false),
                    ),
                ],
            }),
            Row({
                gap: 14,
                justify: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'cand [0, 1]',
                        fontSize: 18,
                        color: candidate,
                        mono: true,
                    }),
                    TextLabel({
                        c,
                        text: 'overlap [0.6, 0.8]',
                        fontSize: 18,
                        color: overlap,
                        mono: true,
                    }),
                    TextLabel({
                        c,
                        text: 'orth [1, 0]',
                        fontSize: 18,
                        color: orthogonal,
                        mono: true,
                    }),
                ],
            }),
        ],
    })
}

function readoutPanel(c: ThemeColors): React.ReactElement {
    const candidate = getReadableToneColor('green', c)
    const overlap = getReadableToneColor('warm', c)
    const orthogonal = getReadableToneColor('blue', c)
    return Panel({
        c,
        title: 'Dot-product projections across α',
        titleFontSize: 20,
        width: 548,
        padding: 12,
        gap: 6,
        children: [
            LineChart({
                c: withDensity(c, 1.75),
                width: 516,
                height: 158,
                labels: ['−1', '0', '+1', '+2'],
                min: -1,
                max: 2.3,
                showGrid: true,
                showPoints: true,
                directLabels: true,
                series: [
                    { name: 'cand', points: [-0.9, 0.1, 1.1, 2.1], color: candidate },
                    { name: 'overlap', points: [-0.6, 0.2, 1.0, 1.8], color: overlap },
                    { name: 'orth', points: [0.2, 0.2, 0.2, 0.2], color: orthogonal },
                ],
            }),
            DataTable({
                c,
                headerRows: 1,
                headerCols: 1,
                firstColWidth: 196,
                cellWidth: 74,
                cellHeight: 26,
                gap: 4,
                fontSize: 18,
                rows: [
                    ['Direction', 'α=−1', '0', '+1', '+2'],
                    ['cand [0, 1]', '−0.9', '0.1', '1.1', '2.1'],
                    ['overlap [0.6, 0.8]', '−0.6', '0.2', '1.0', '1.8'],
                    ['orth [1, 0]', '0.2', '0.2', '0.2', '0.2'],
                ],
            }),
        ],
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({
        c,
        padding: 10,
        gap: 10,
        contentWidth: 556,
        children: Column({ gap: 10, align: 'center', children: [spacePanel(c), readoutPanel(c)] }),
    })
}

export default create('dark')
