import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const width = 632
export const height = 802
export const alt =
    'Six activation functions use equal pixel scales for input z and output f(z), each ranging from minus 3 to 3. The linear function is a true 45-degree reference; sigmoid and tanh saturate, ReLU clips negatives to zero, and GELU and SiLU retain smooth negative dips. At z=-1, ReLU is 0, GELU is -0.159, and SiLU is -0.269.'

const boardWidth = 600
const boardHeight = 770
const plot = { x: 54, y: 92, width: 520, height: 520, padding: 20 }
const labelScale = width / boardWidth

function label(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 21,
    color = c.textPrimary,
    mono = false,
    weight = 550,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size + 8,
        children: TextLabel({
            c,
            text,
            fontSize: size * labelScale,
            color,
            mono,
            fontWeight: weight,
            align: 'center',
        }),
    })
}

function erf(x: number): number {
    const sign = x < 0 ? -1 : 1
    const a = Math.abs(x)
    const t = 1 / (1 + 0.3275911 * a)
    const y =
        1 -
        ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
            0.254829592) *
            t *
            Math.exp(-a * a)
    return sign * y
}

function sigmoid(z: number): number {
    if (z >= 0) return 1 / (1 + Math.exp(-z))
    const ez = Math.exp(z)
    return ez / (1 + ez)
}

const functions = [
    { name: 'Linear', color: 'neutral' as const, f: (z: number) => z },
    { name: 'Sigmoid', color: 'warm' as const, f: sigmoid },
    { name: 'Tanh', color: 'critical' as const, f: Math.tanh },
    { name: 'ReLU', color: 'green' as const, f: (z: number) => Math.max(0, z) },
    { name: 'GELU', color: 'blue' as const, f: (z: number) => z * 0.5 * (1 + erf(z / Math.SQRT2)) },
    { name: 'SiLU', color: 'purple' as const, f: (z: number) => z * sigmoid(z) },
]
const samples = Array.from({ length: 121 }, (_, index) => -3 + index * 0.05)

const illustration = defineIllustration((c) => {
    const colors = Object.fromEntries(
        functions.map((item) => [item.name, getReadableToneColor(item.color, c)]),
    ) as Record<string, string>
    const valuesAtMinusOne = functions.map((item) => ({
        x: -1,
        y: item.f(-1),
        fill: colors[item.name],
        r: 5.5,
        stroke: c.bgSubtle,
        strokeWidth: 1.5,
    }))
    const plotSvg = AxisPlot({
        c,
        width: plot.width,
        height: plot.height,
        xMin: -3,
        xMax: 3,
        yMin: -3,
        yMax: 3,
        padding: plot.padding,
        showGrid: true,
        gridCount: 5,
        paths: [
            {
                points: [
                    { x: -1, y: -3 },
                    { x: -1, y: 3 },
                ],
                color: c.textMuted,
                strokeWidth: 1.6,
                dashed: true,
            },
            ...functions.map((item) => ({
                points: samples.map((z) => ({ x: z, y: item.f(z) })),
                color: colors[item.name],
                strokeWidth: item.name === 'Linear' ? 3 : 4,
            })),
        ],
        points: valuesAtMinusOne,
    })

    const legend = functions
        .map((item, index) => {
            const row = index < 3 ? 0 : 1
            const col = index % 3
            const x = 20 + col * 190
            const y = 652 + row * 36
            return [
                CanvasItem({
                    x,
                    y: y + 12,
                    width: 30,
                    height: 8,
                    children: createElement(
                        'svg',
                        { width: 30, height: 8, viewBox: '0 0 30 8', 'aria-hidden': true },
                        VectorSegment({
                            x1: 0,
                            y1: 4,
                            x2: 26,
                            y2: 4,
                            color: colors[item.name],
                            strokeWidth: 4,
                            showEndDot: false,
                        }),
                    ),
                }),
                label(c, x + 31, y, 146, item.name, 22, colors[item.name], false, 700),
            ]
        })
        .flat()

    const guides = createElement(
        'svg',
        {
            width: boardWidth,
            height: boardHeight,
            viewBox: `0 0 ${boardWidth} ${boardHeight}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Tick marks correspond to the shared -3..3 frame, not per-function scales.
        VectorSegment({
            x1: plot.x + plot.padding,
            y1: plot.y + plot.height - plot.padding + 2,
            x2: plot.x + plot.padding,
            y2: plot.y + plot.height - plot.padding + 8,
            color: c.textMuted,
            strokeWidth: 1.5,
            showEndDot: false,
        }),
        VectorSegment({
            x1: plot.x + plot.width / 2,
            y1: plot.y + plot.height - plot.padding + 2,
            x2: plot.x + plot.width / 2,
            y2: plot.y + plot.height - plot.padding + 8,
            color: c.textMuted,
            strokeWidth: 1.5,
            showEndDot: false,
        }),
        VectorSegment({
            x1: plot.x + plot.width - plot.padding,
            y1: plot.y + plot.height - plot.padding + 2,
            x2: plot.x + plot.width - plot.padding,
            y2: plot.y + plot.height - plot.padding + 8,
            color: c.textMuted,
            strokeWidth: 1.5,
            showEndDot: false,
        }),
    )

    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardWidth,
        background: 'transparent',
        children: Board({
            c,
            width: boardWidth,
            height: boardHeight,
            background: 'transparent',
            children: [
                label(
                    c,
                    18,
                    8,
                    564,
                    'Six activations share one output scale.',
                    26,
                    c.textPrimary,
                    false,
                    800,
                ),
                label(
                    c,
                    18,
                    43,
                    564,
                    'Input z and output f(z) both range from −3 to 3.',
                    20,
                    c.textSecondary,
                ),
                CanvasItem({
                    x: plot.x,
                    y: plot.y,
                    width: plot.width,
                    height: plot.height,
                    children: plotSvg,
                }),
                CanvasItem({
                    x: 0,
                    y: 0,
                    width: boardWidth,
                    height: boardHeight,
                    children: guides,
                }),
                label(c, 8, 104, 42, '3', 20, c.textMuted, true),
                label(c, 8, 344, 42, '0', 20, c.textMuted, true),
                label(c, 8, 584, 42, '−3', 20, c.textMuted, true),
                label(c, 48, 619, 52, '−3', 20, c.textMuted, true),
                label(c, 288, 619, 52, '0', 20, c.textMuted, true),
                label(c, 528, 619, 52, '3', 20, c.textMuted, true),
                ...legend,
                label(
                    c,
                    14,
                    728,
                    572,
                    'At z=−1: ReLU=0 · GELU=−.159 · SiLU=−.269',
                    22,
                    getReadableToneColor('purple', c),
                    true,
                    700,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
