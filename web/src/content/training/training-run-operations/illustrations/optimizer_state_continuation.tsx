import {
    BadgePill,
    Board,
    CanvasItem,
    Panel,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getToneColor,
} from 'vizmatic'
import { createElement } from 'react'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 640
export const height = 860
export const opaqueBackground = true
export const alt =
    'In this scalar Adam update example, the saved update-7 state has weight 0.086726, first moment -0.341636, second moment 0.027877, and consumed-target cursor 7. Restoring all of it reaches weight 0.125436 at update 12. Resetting the moments while keeping the saved weight, step, and cursor reaches 0.126672 on the same five targets. The plotted weight trajectories use the same labeled 0.08–0.13 axis; this example demonstrates a changed trajectory, not a guaranteed large loss jump.'

const fullWeights = [0.0867256, 0.0963336, 0.10656, 0.1099486, 0.1179324, 0.1254357]
const resetMoments = [0.0867256, 0.1013066, 0.118748, 0.1134309, 0.1199507, 0.1266722]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const tone = (name: ToneName) => getToneColor(name, c)
    const x0 = 88
    const x1 = 572
    const yTop = 510
    const yBottom = 704
    const xAt = (index: number) => x0 + (index / 5) * (x1 - x0)
    const yAt = (value: number) => yBottom - ((value - 0.08) / 0.05) * (yBottom - yTop)
    const polyline = (values: number[], color: string) =>
        createElement('polyline', {
            points: values.map((value, index) => `${xAt(index)},${yAt(value)}`).join(' '),
            fill: 'none',
            stroke: color,
            strokeWidth: 6,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        })

    const plot = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'img',
            'aria-label':
                'Two scalar weight trajectories from update 7 through 12 on a shared zoomed axis from 0.08 to 0.13.',
        },
        ...[0.08, 0.1, 0.12, 0.13].map((tick) =>
            createElement('line', {
                key: `grid-${tick}`,
                x1: x0,
                y1: yAt(tick),
                x2: x1,
                y2: yAt(tick),
                stroke: c.borderSubtle,
                strokeWidth: 2,
            }),
        ),
        createElement('line', {
            x1: x0,
            y1: yTop,
            x2: x0,
            y2: yBottom,
            stroke: c.border,
            strokeWidth: 3,
        }),
        createElement('line', {
            x1: x0,
            y1: yBottom,
            x2: x1,
            y2: yBottom,
            stroke: c.border,
            strokeWidth: 3,
        }),
        polyline(fullWeights, tone('green')),
        polyline(resetMoments, tone('warm')),
        ...fullWeights.map((value, index) =>
            createElement('circle', {
                key: `full-${index}`,
                cx: xAt(index),
                cy: yAt(value),
                r: 7,
                fill: tone('green'),
                stroke: c.bg,
                strokeWidth: 2,
            }),
        ),
        ...resetMoments.map((value, index) =>
            createElement('circle', {
                key: `reset-${index}`,
                cx: xAt(index),
                cy: yAt(value),
                r: 7,
                fill: tone('warm'),
                stroke: c.bg,
                strokeWidth: 2,
            }),
        ),
    )

    const tickLabels = [0.08, 0.1, 0.12, 0.13].map((tick) =>
        CanvasItem({
            x: 18,
            y: yAt(tick) - 15,
            width: 58,
            height: 30,
            children: TextLabel({
                c,
                text: tick.toFixed(2),
                fontSize: 23,
                color: c.textSecondary,
                align: 'right',
                width: 58,
            }),
        }),
    )
    const stepLabels = Array.from({ length: 6 }, (_, index) =>
        CanvasItem({
            x: xAt(index) - 22,
            y: 708,
            width: 44,
            height: 30,
            children: TextLabel({
                c,
                text: String(index + 7),
                fontSize: 23,
                color: c.textPrimary,
                align: 'center',
                width: 44,
            }),
        }),
    )

    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            CanvasItem({
                x: 20,
                y: 18,
                width: 600,
                height: 44,
                children: TextLabel({
                    c,
                    text: 'Adam remembers the path',
                    fontSize: 31,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                    width: 600,
                }),
            }),
            CanvasItem({
                x: 22,
                y: 62,
                width: 596,
                height: 34,
                children: TextLabel({
                    c,
                    text: 'Toy scalar Adam · continue from update 7 to 12',
                    fontSize: 23,
                    color: c.textSecondary,
                    align: 'center',
                    width: 596,
                }),
            }),

            CanvasItem({
                x: 24,
                y: 106,
                width: 592,
                height: 126,
                children: Panel({
                    c,
                    title: 'Saved boundary · update 7',
                    titleFontSize: 25,
                    tone: 'blue',
                    width: 592,
                    height: 126,
                    padding: 12,
                    gap: 7,
                    children: [
                        TextLabel({
                            c,
                            text: 'w = 0.086726     m = −0.341636     v = 0.027877',
                            fontSize: 23,
                            color: c.textPrimary,
                            align: 'center',
                            width: 560,
                        }),
                        TextLabel({
                            c,
                            text: 'Optimizer step 7 · next target cursor 7',
                            fontSize: 22,
                            color: c.textSecondary,
                            align: 'center',
                            width: 560,
                        }),
                    ],
                }),
            }),

            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    { width, height, viewBox: `0 0 ${width} ${height}` },
                    VectorArrow({
                        x1: 192,
                        y1: 239,
                        x2: 192,
                        y2: 266,
                        color: tone('green'),
                        strokeWidth: 4,
                        arrowSize: 8,
                    }),
                    VectorArrow({
                        x1: 448,
                        y1: 239,
                        x2: 448,
                        y2: 266,
                        color: tone('warm'),
                        strokeWidth: 4,
                        arrowSize: 8,
                    }),
                ),
            }),

            CanvasItem({
                x: 24,
                y: 270,
                width: 286,
                height: 150,
                children: Panel({
                    c,
                    title: 'Restore m and v',
                    titleFontSize: 25,
                    tone: 'green',
                    width: 286,
                    height: 150,
                    padding: 12,
                    gap: 7,
                    children: [
                        TextLabel({
                            c,
                            text: 'w₁₂ = 0.125436',
                            fontSize: 25,
                            fontWeight: 700,
                            color: c.textPrimary,
                            align: 'center',
                            width: 258,
                        }),
                        TextLabel({
                            c,
                            text: 'step 12 · cursor 12',
                            fontSize: 22,
                            color: c.textSecondary,
                            align: 'center',
                            width: 258,
                        }),
                    ],
                }),
            }),
            CanvasItem({
                x: 330,
                y: 270,
                width: 286,
                height: 150,
                children: Panel({
                    c,
                    title: 'Reset m, v to zero',
                    titleFontSize: 24,
                    tone: 'warm',
                    width: 286,
                    height: 150,
                    padding: 12,
                    gap: 7,
                    children: [
                        TextLabel({
                            c,
                            text: 'w₁₂ = 0.126672',
                            fontSize: 25,
                            fontWeight: 700,
                            color: c.textPrimary,
                            align: 'center',
                            width: 258,
                        }),
                        TextLabel({
                            c,
                            text: 'same step 12 · cursor 12',
                            fontSize: 22,
                            color: c.textSecondary,
                            align: 'center',
                            width: 258,
                        }),
                    ],
                }),
            }),

            CanvasItem({
                x: 20,
                y: 438,
                width: 600,
                height: 32,
                children: TextLabel({
                    c,
                    text: 'Weight w · shared zoomed axis 0.08–0.13',
                    fontSize: 23,
                    color: c.textPrimary,
                    align: 'center',
                    width: 600,
                }),
            }),
            CanvasItem({ x: 0, y: 0, width, height, children: plot }),
            ...tickLabels,
            ...stepLabels,
            CanvasItem({
                x: 68,
                y: 748,
                width: 244,
                height: 36,
                children: BadgePill({
                    c,
                    text: 'Moments restored',
                    tone: 'green',
                    width: 244,
                    height: 36,
                    fontSize: 23,
                }),
            }),
            CanvasItem({
                x: 328,
                y: 748,
                width: 244,
                height: 36,
                children: BadgePill({
                    c,
                    text: 'Moments reset',
                    tone: 'warm',
                    width: 244,
                    height: 36,
                    fontSize: 23,
                }),
            }),
            CanvasItem({
                x: 28,
                y: 798,
                width: 584,
                height: 46,
                children: TextLabel({
                    c,
                    text: 'Same cursor · Δw₁₂ = +0.001236 in this toy.',
                    fontSize: 23,
                    color: c.textPrimary,
                    align: 'center',
                    width: 584,
                }),
            }),
        ],
    })
}

export default create('dark')
