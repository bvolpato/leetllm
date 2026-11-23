import { Buffer } from 'node:buffer'
import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    renderMathSvg,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 700
export const alt =
    'Two PPO clipped-surrogate curves share a labeled probability-ratio axis from 0.5 to 1.5 and a signed objective axis. With epsilon 0.2, positive advantage flattens above 1.2 and negative advantage flattens below 0.8. The clipped objective removes added surrogate gain while the policy ratio can still cross either threshold.'

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    boxWidth: number,
    boxHeight: number,
    fontSize = 20,
    color = c.textSecondary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 650,
) {
    return CanvasItem({
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        children: TextLabel({ c, text, width: '100%', fontSize, color, align, fontWeight }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const positive = getReadableToneColor('green', c)
    const negative = getReadableToneColor('critical', c)
    const threshold = c.textMuted
    const epsilon = 0.2
    const ratios = Array.from({ length: 61 }, (_, index) => 0.5 + index / 60)
    const clipped = (ratio: number, advantage: number) =>
        Math.min(ratio * advantage, Math.min(Math.max(ratio, 1 - epsilon), 1 + epsilon) * advantage)
    const chart = { x: 48, y: 120, width: 500, height: 350, padding: 42 }
    const innerWidth = chart.width - chart.padding * 2
    const innerHeight = chart.height - chart.padding * 2
    const xPosition = (ratio: number) => chart.x + chart.padding + (ratio - 0.5) * innerWidth
    const yPosition = (value: number) => chart.y + chart.padding + ((1.5 - value) / 3) * innerHeight
    const equation = renderMathSvg(
        String.raw`\mathcal{L}^{\mathrm{CLIP}}_t=\min(\rho_t\hat{A}_t,\operatorname{clip}(\rho_t,1-\epsilon,1+\epsilon)\hat{A}_t)`,
        { fontSize: 22, color: c.textPrimary },
    )
    const equationImage = createElement('img', {
        src: `data:image/svg+xml;base64,${Buffer.from(equation.svg).toString('base64')}`,
        width: equation.width,
        height: equation.height,
        alt: 'Clipped PPO surrogate objective equation',
        style: { display: 'block' },
    })
    const equationItem = CanvasItem({
        x: (width - equation.width) / 2,
        y: 44,
        width: equation.width,
        height: equation.height,
        children: equationImage,
    })
    const paths = [
        {
            points: [
                { x: 0.8, y: -1.5 },
                { x: 0.8, y: 1.5 },
            ],
            color: threshold,
            strokeWidth: 1.5,
            dashed: true,
        },
        {
            points: [
                { x: 1.2, y: -1.5 },
                { x: 1.2, y: 1.5 },
            ],
            color: threshold,
            strokeWidth: 1.5,
            dashed: true,
        },
        {
            points: [
                { x: 0.5, y: 0 },
                { x: 1.5, y: 0 },
            ],
            color: c.border,
            strokeWidth: 1.5,
        },
        {
            points: ratios.map((ratio) => ({ x: ratio, y: ratio })),
            color: positive,
            strokeWidth: 2,
            dashed: true,
        },
        {
            points: ratios.map((ratio) => ({ x: ratio, y: -ratio })),
            color: negative,
            strokeWidth: 2,
            dashed: true,
        },
        {
            points: ratios.map((ratio) => ({ x: ratio, y: clipped(ratio, 1) })),
            color: positive,
            strokeWidth: 5,
        },
        {
            points: ratios.map((ratio) => ({ x: ratio, y: clipped(ratio, -1) })),
            color: negative,
            strokeWidth: 5,
        },
    ]
    const xTicks = [0.5, 0.8, 1.0, 1.2, 1.5].map((value) =>
        label(
            c,
            value.toFixed(1),
            xPosition(value) - 23,
            472,
            46,
            28,
            20,
            c.textPrimary,
            'center',
            700,
        ),
    )
    const yTicks = [1.5, 1.0, 0, -1.0, -1.5].map((value) => {
        const tick =
            value > 0
                ? `+${value.toFixed(value % 1 ? 1 : 0)}`
                : value < 0
                  ? `−${Math.abs(value).toFixed(value % 1 ? 1 : 0)}`
                  : '0'
        return label(c, tick, 4, yPosition(value) - 14, 40, 28, 20, c.textPrimary, 'right', 700)
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                label(
                    c,
                    'PPO clipping limits added surrogate gain',
                    14,
                    4,
                    532,
                    34,
                    25,
                    c.textPrimary,
                    'center',
                    800,
                ),
                equationItem,
                label(
                    c,
                    'Surrogate value · ε = 0.2',
                    chart.x,
                    86,
                    chart.width,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                    700,
                ),
                CanvasItem({
                    x: chart.x,
                    y: chart.y,
                    width: chart.width,
                    height: chart.height,
                    children: AxisPlot({
                        c,
                        width: chart.width,
                        height: chart.height,
                        xMin: 0.5,
                        xMax: 1.5,
                        yMin: -1.5,
                        yMax: 1.5,
                        padding: chart.padding,
                        showFrame: true,
                        showAxes: true,
                        showGrid: true,
                        gridCount: 4,
                        frameFill: c.bgSubtle,
                        frameStroke: c.border,
                        paths,
                    }),
                }),
                ...yTicks,
                ...xTicks,
                label(
                    c,
                    'Policy / rollout ratio · ρₜ',
                    chart.x,
                    502,
                    chart.width,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                    700,
                ),
                CanvasItem({
                    x: 112,
                    y: 538,
                    width: 34,
                    height: 22,
                    children: AxisPlot({
                        c,
                        width: 34,
                        height: 22,
                        xMin: 0,
                        xMax: 1,
                        yMin: 0,
                        yMax: 1,
                        padding: 0,
                        showFrame: false,
                        showAxes: false,
                        showGrid: false,
                        paths: [
                            {
                                points: [
                                    { x: 0.05, y: 0.5 },
                                    { x: 0.95, y: 0.5 },
                                ],
                                color: c.textSecondary,
                                strokeWidth: 2.5,
                            },
                        ],
                    }),
                }),
                label(c, 'Clipped', 154, 532, 100, 34, 19, c.textSecondary, 'left', 700),
                // Neutral gray line samples distinguish objective type; curve color remains tied to advantage sign.
                CanvasItem({
                    x: 302,
                    y: 538,
                    width: 34,
                    height: 22,
                    children: AxisPlot({
                        c,
                        width: 34,
                        height: 22,
                        xMin: 0,
                        xMax: 1,
                        yMin: 0,
                        yMax: 1,
                        padding: 0,
                        showFrame: false,
                        showAxes: false,
                        showGrid: false,
                        paths: [
                            {
                                points: [
                                    { x: 0.05, y: 0.5 },
                                    { x: 0.95, y: 0.5 },
                                ],
                                color: c.textSecondary,
                                strokeWidth: 2.5,
                                dashed: true,
                            },
                        ],
                    }),
                }),
                label(c, 'Unclipped', 344, 532, 130, 34, 19, c.textSecondary, 'left', 700),
                label(
                    c,
                    'A > 0 · flat above ρ = 1.2',
                    18,
                    570,
                    250,
                    30,
                    20,
                    positive,
                    'center',
                    750,
                ),
                label(
                    c,
                    'A < 0 · flat below ρ = 0.8',
                    292,
                    570,
                    250,
                    30,
                    20,
                    negative,
                    'center',
                    750,
                ),
                label(
                    c,
                    'Flat segments remove added surrogate gain.',
                    20,
                    610,
                    520,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(
                    c,
                    'The probability ratio can still cross either threshold.',
                    20,
                    642,
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
