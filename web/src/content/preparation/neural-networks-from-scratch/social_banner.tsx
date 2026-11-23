import { createElement } from 'react'
import {
    Scene,
    SvgPoint,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    renderToPngWithOutput,
    type ThemeMode,
} from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Neural Networks from Scratch. Four alternating XOR corners become three hidden-feature locations: both blue points meet at the origin, while the two orange points sit on separate positive axes. A green straight line separates the colors in hidden space.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme),
        blue = getReadableToneColor('blue', c),
        orange = getReadableToneColor('warm', c),
        green = getReadableToneColor('green', c)
    const P = (side: number, x: number, y: number) => ({
        x: 120 + side * 580 + x * 260,
        y: 330 - y * 260,
    })
    const segment = (side: number, a: number[], b: number[], color: string) => {
        const p = P(side, a[0], a[1]),
            q = P(side, b[0], b[1])
        return VectorSegment({
            x1: p.x,
            y1: p.y,
            x2: q.x,
            y2: q.y,
            color,
            strokeWidth: 3,
            showEndDot: false,
        })
    }
    return Scene({
        c,
        padding: 32,
        contentWidth: 1136,
        gap: 12,
        background: c.bg,
        children: [
            TextLabel({ c, text: 'Neural Networks from Scratch', fontSize: 54, fontWeight: 750 }),
            TextLabel({
                c,
                text: 'See how hidden layers change what a model can learn.',
                fontSize: 29,
                color: c.textSecondary,
            }),
            createElement(
                'svg',
                { width: 1120, height: 370, viewBox: '0 0 1120 370' },
                ...[0, 1].flatMap((side) => [
                    segment(side, [-0.1, 0], [1.1, 0], c.textMuted),
                    segment(side, [0, -0.1], [0, 1.1], c.textMuted),
                ]),
                segment(1, [-0.1, 0.6], [0.6, -0.1], green),
                ...[0, 1].flatMap((side) =>
                    [
                        [0, 0, blue],
                        [0, 1, orange],
                        [1, 0, orange],
                        ...(side === 0 ? [[1, 1, blue]] : []),
                    ].map(([x, y, fill]) => {
                        const p = P(side, Number(x), Number(y))
                        return SvgPoint({
                            cx: p.x,
                            cy: p.y,
                            r: 17,
                            fill: String(fill),
                            stroke: c.bg,
                            strokeWidth: 3,
                        })
                    }),
                ),
                VectorArrow({
                    x1: 460,
                    y1: 200,
                    x2: 610,
                    y2: 200,
                    color: c.textSecondary,
                    strokeWidth: 4,
                    arrowSize: 8,
                }),
            ),
            createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 28,
                        color: c.textSecondary,
                    },
                },
                createElement('span', null, 'Four inputs · Two ReLU features · One prediction'),
                createElement('span', null, 'LeetLLM'),
            ),
        ],
    })
}

export function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
}
export default create('dark')
