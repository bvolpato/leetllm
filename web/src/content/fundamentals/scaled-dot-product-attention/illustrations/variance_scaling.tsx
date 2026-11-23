import { createElement } from 'react'
import { AxisPlot, CanvasItem, Scene, TextLabel, getThemeColors, getToneColor } from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 640
export const height = 760
export const alt =
    'Under independent, mean-zero, unit-variance query and key components, raw dot-product standard deviation grows as square root of d_k while the scaled standard deviation stays at 1. These are analytic population curves; learned vectors need not satisfy the assumptions.'

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const plotWidth = 600
    const plotHeight = 360
    const padding = 52
    const x = (value: number) => padding + (value / 4096) * (plotWidth - 2 * padding)
    const y = (value: number) => padding + ((66 - value) / 66) * (plotHeight - 2 * padding)
    const pointLabel = (text: string, x: number, y: number, labelWidth: number, fontSize = 18) =>
        CanvasItem({
            x,
            y,
            width: labelWidth,
            height: fontSize * 1.35,
            children: createElement(TextLabel, {
                c,
                text,
                fontSize,
                mono: true,
                color: c.textPrimary,
                align: 'center',
                width: labelWidth,
            }),
        })
    const rawCurve = Array.from({ length: 65 }, (_, index) => {
        const d = 1 + index * (4095 / 64)
        return { x: d, y: Math.sqrt(d) }
    })

    return Scene({
        c,
        title: 'Scaling controls raw score spread',
        contentWidth: 620,
        padding: 10,
        gap: 8,
        children: [
            TextLabel({
                c,
                text: 'Assume independent qᵢ,kᵢ components with mean 0 and variance 1.',
                fontSize: 19,
                color: c.textMuted,
                align: 'center',
            }),
            TextLabel({
                c,
                text: 'Analytic population curves; learned vectors may differ.',
                fontSize: 19,
                color: c.textMuted,
                align: 'center',
            }),
            createElement(
                'div',
                {
                    style: {
                        position: 'relative',
                        width: plotWidth,
                        height: plotHeight,
                        margin: '0 auto',
                    },
                },
                AxisPlot({
                    c,
                    width: plotWidth,
                    height: plotHeight,
                    padding,
                    xMin: 0,
                    xMax: 4096,
                    yMin: 0,
                    yMax: 66,
                    showGrid: true,
                    gridCount: 4,
                    paths: [
                        { points: rawCurve, tone: 'purple', strokeWidth: 5 },
                        {
                            points: [
                                { x: 1, y: 1 },
                                { x: 4096, y: 1 },
                            ],
                            tone: 'green',
                            strokeWidth: 4,
                            dashed: true,
                        },
                    ],
                    points: [16, 64, 512, 4096].map((d) => ({
                        x: d,
                        y: Math.sqrt(d),
                        tone: 'purple',
                        r: 6,
                    })),
                }),
                pointLabel('Raw SD = √dₖ', 90, 76, 210, 22),
                pointLabel('Scaled SD = 1', 350, y(1) - 44, 190, 22),
                pointLabel('0', x(0) - 14, plotHeight - padding + 2, 32, 19),
                pointLabel('512', x(512) - 30, plotHeight - padding + 2, 60, 19),
                pointLabel('2048', x(2048) - 34, plotHeight - padding + 2, 68, 19),
                pointLabel('4096', x(4096) - 36, plotHeight - padding + 2, 72, 19),
                pointLabel('64', 4, y(64) - 12, 40, 19),
                pointLabel('32', 4, y(32) - 12, 40, 19),
            ),
            TextLabel({
                c,
                text: 'Head width dₖ',
                fontSize: 19,
                color: c.textMuted,
                align: 'center',
            }),
            TextLabel({
                c,
                text: 'Var(q · k) = dₖ  →  Var((q · k) / √dₖ) = 1',
                fontSize: 22,
                mono: true,
                fontWeight: 700,
                color: getToneColor('green', c),
                align: 'center',
            }),
        ],
    })
}

export default create('dark')
