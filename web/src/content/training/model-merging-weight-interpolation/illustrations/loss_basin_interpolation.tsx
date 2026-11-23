import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 680
export const alt =
    'Five sampled coefficients compare two synthetic loss paths. Both have endpoint losses 0.18 and 0.19. The ridge path reaches 0.61 at alpha 0.50, above the 0.30 gate, with a sampled endpoint-chord barrier of 0.425. The low path reaches 0.09 at the midpoint. Lines between samples are guides, not additional evaluations.'
export const numericFixture = {
    alphas: [0, 0.25, 0.5, 0.75, 1],
    ridge: [0.18, 0.2, 0.61, 0.23, 0.19],
    low: [0.18, 0.12, 0.09, 0.12, 0.19],
    maxLoss: 0.3,
    sampledChordBarrier: 0.425,
    acceptedAlphas: [0, 0.25, 0.75, 1],
}

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 600,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const ridge = getReadableToneColor('critical', c)
    const low = getReadableToneColor('cyan', c)
    const gate = getReadableToneColor('warm', c)
    const chord = getReadableToneColor('neutral', c)
    const plot = { xStart: 74, xEnd: 530, yStart: 170, yEnd: 446 }
    const x = (a: number) => plot.xStart + a * (plot.xEnd - plot.xStart)
    const y = (loss: number) => plot.yEnd - (loss / 0.7) * (plot.yEnd - plot.yStart)
    const series = (values: number[], color: string, prefix: string) =>
        values.slice(0, -1).map((v, i) =>
            VectorSegment({
                key: prefix + '-segment-' + i,
                x1: x(numericFixture.alphas[i]),
                y1: y(v),
                x2: x(numericFixture.alphas[i + 1]),
                y2: y(values[i + 1]),
                color,
                strokeWidth: 4,
                showStartDot: false,
                showEndDot: false,
            }),
        )
    const marks = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...[0, 0.2, 0.4, 0.6].map((v) =>
            VectorSegment({
                x1: plot.xStart,
                y1: y(v),
                x2: plot.xEnd,
                y2: y(v),
                color: v === 0 ? c.textSecondary : c.border,
                strokeWidth: v === 0 ? 1.8 : 1,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...numericFixture.alphas.map((a) =>
            VectorSegment({
                x1: x(a),
                y1: plot.yStart,
                x2: x(a),
                y2: a === 0.5 ? y(0.09) + 5 : plot.yEnd,
                color: c.border,
                strokeWidth: 1,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        VectorSegment({
            x1: plot.xStart,
            y1: y(0.18),
            x2: plot.xEnd,
            y2: y(0.19),
            color: chord,
            strokeWidth: 2,
            showStartDot: false,
            showEndDot: false,
        }),
        VectorSegment({
            x1: plot.xStart,
            y1: y(0.3),
            x2: plot.xEnd,
            y2: y(0.3),
            color: gate,
            strokeWidth: 2.5,
            showStartDot: false,
            showEndDot: false,
        }),
        ...series(numericFixture.ridge, ridge, 'ridge'),
        ...series(numericFixture.low, low, 'low'),
        ...numericFixture.alphas.map((a, i) =>
            SvgPoint({
                cx: x(a),
                cy: y(numericFixture.ridge[i]),
                r: 5.5,
                fill: ridge,
                stroke: c.bgCard,
                strokeWidth: 2,
            }),
        ),
        ...numericFixture.alphas.map((a, i) =>
            SvgPoint({
                cx: x(a),
                cy: y(numericFixture.low[i]),
                r: 5,
                fill: low,
                stroke: c.bgCard,
                strokeWidth: 2,
            }),
        ),
    )
    const legendLine = (color: string, yPos: number) =>
        CanvasItem({
            x: 34,
            y: yPos,
            width: 42,
            height: 18,
            children: createElement(
                'svg',
                { width: 42, height: 18, viewBox: '0 0 42 18' },
                VectorSegment({
                    x1: 0,
                    y1: 9,
                    x2: 42,
                    y2: 9,
                    color,
                    strokeWidth: 3,
                    showStartDot: false,
                    showEndDot: false,
                }),
            ),
        })
    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({ x: 0, y: 0, width, height, children: marks }),
                label(
                    c,
                    'Check the path between good checkpoints',
                    20,
                    12,
                    520,
                    34,
                    24,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Same endpoints · five hand-entered evaluations',
                    20,
                    51,
                    520,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(c, 'loss', 22, 156, 48, 26, 20, c.textSecondary, 'right'),
                ...[0, 0.2, 0.4, 0.6].map((v) =>
                    label(c, v.toFixed(1), 28, y(v) - 12, 38, 26, 20, c.textSecondary, 'right'),
                ),
                ...numericFixture.alphas.map((a) =>
                    label(c, a.toFixed(2), x(a) - 27, 451, 54, 26, 20, c.textSecondary, 'center'),
                ),
                label(
                    c,
                    'interpolation coefficient α',
                    172,
                    480,
                    260,
                    26,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(c, '0.61 > 0.30', 296, y(0.61) - 30, 118, 25, 20, ridge, 'center'),
                label(c, '0.09', x(0.5) - 40, y(0.09) + 10, 80, 25, 20, low, 'center'),
                legendLine(ridge, 535),
                label(c, 'ridge path', 84, 528, 128, 28, 20, c.textPrimary),
                legendLine(low, 570),
                label(c, 'low path', 84, 563, 108, 28, 20, c.textPrimary),
                legendLine(gate, 605),
                label(c, 'loss gate 0.30', 84, 598, 158, 28, 20, c.textPrimary),
                label(c, 'Sampled barrier 0.425', 252, 528, 288, 28, 20, chord, 'right'),
                label(
                    c,
                    'Connectors guide the eye; only dots were evaluated.',
                    20,
                    640,
                    520,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
