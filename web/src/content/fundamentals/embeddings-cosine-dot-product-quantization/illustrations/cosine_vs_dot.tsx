import {
    AxisPlot,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Top panels plot equal-length vectors A = (3, 4) and B = (4, 3) with norm 5, dot product 24, cosine 0.96, and Euclidean distance 1.414. Bottom AxisPlot scales A by k from 1 to 10: normalized dot product rises linearly to 10x while normalized cosine stays flat at 1.0.'
export const width = 640
export const height = 760

const ks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const tickXs = [1, 2, 4, 6, 8, 10]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)
    const gridH = [0, 2, 4, 6, 8, 10].map((y) => ({
        points: [
            { x: 1, y },
            { x: 10, y },
        ],
        tone: 'neutral' as const,
        strokeWidth: y === 0 ? 2 : 1,
        opacity: y === 0 ? 0.65 : 0.28,
    }))
    const gridV = tickXs.map((x) => ({
        points: [
            { x, y: 0 },
            { x, y: 10.4 },
        ],
        tone: 'neutral' as const,
        strokeWidth: x === 1 ? 2 : 1,
        opacity: x === 1 ? 0.65 : 0.28,
    }))

    return Scene({
        c,
        title: 'Norm scaling drives dot product without changing angle',
        subtitle: 'Equal-norm vectors A = (3, 4) and B = (4, 3), then A scaled by k',
        padding: 14,
        gap: 8,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                Row({
                    gap: 16,
                    align: 'center',
                    justify: 'center',
                    children: [
                        AxisPlot({
                            c,
                            width: 248,
                            height: 236,
                            padding: 20,
                            xMin: 0,
                            xMax: 5.2,
                            yMin: 0,
                            yMax: 5.2,
                            showFrame: false,
                            showGrid: true,
                            gridCount: 5,
                            paths: [
                                {
                                    points: [
                                        { x: 3, y: 4 },
                                        { x: 4, y: 3 },
                                    ],
                                    tone: 'neutral',
                                    strokeWidth: 3,
                                    dashed: true,
                                    opacity: 0.75,
                                },
                            ],
                            vectors: [
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 3,
                                    y2: 4,
                                    color: green,
                                    strokeWidth: 5,
                                    arrow: true,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 4,
                                    y2: 3,
                                    color: blue,
                                    strokeWidth: 5,
                                    arrow: true,
                                },
                            ],
                            points: [
                                {
                                    x: 3,
                                    y: 4,
                                    tone: 'green',
                                    r: 6,
                                    stroke: c.bgCard,
                                    strokeWidth: 2,
                                },
                                {
                                    x: 4,
                                    y: 3,
                                    tone: 'blue',
                                    r: 6,
                                    stroke: c.bgCard,
                                    strokeWidth: 2,
                                },
                            ],
                        }),
                        Column({
                            gap: 8,
                            align: 'start',
                            width: 318,
                            children: [
                                TextLabel({
                                    c,
                                    text: 'A = (3, 4)',
                                    fontSize: 21,
                                    color: green,
                                    math: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 'B = (4, 3)',
                                    fontSize: 21,
                                    color: blue,
                                    math: true,
                                }),
                                TextLabel({ c, text: '‖A‖₂ = ‖B‖₂ = 5', fontSize: 20, math: true }),
                                TextLabel({
                                    c,
                                    text: 'A · B = 24',
                                    fontSize: 20,
                                    color: blue,
                                    math: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 'cos(A, B) = 24 / 25 = 0.96',
                                    fontSize: 20,
                                    color: green,
                                    math: true,
                                }),
                                TextLabel({
                                    c,
                                    text: '‖A − B‖₂ = √2 ≈ 1.414',
                                    fontSize: 20,
                                    math: true,
                                }),
                            ],
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Scale A → kA: normalized score (score at k / score at k = 1)',
                    fontSize: 19,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 560,
                    height: 224,
                    padding: 20,
                    xMin: 1,
                    xMax: 10,
                    yMin: 0,
                    yMax: 10.6,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: [
                        ...gridH,
                        ...gridV,
                        { points: ks.map((k) => ({ x: k, y: k })), color: blue, strokeWidth: 4 },
                        { points: ks.map((k) => ({ x: k, y: 1 })), color: green, strokeWidth: 4 },
                    ],
                    points: [
                        ...tickXs.map((k) => ({
                            x: k,
                            y: k,
                            tone: 'blue' as const,
                            r: 6,
                            stroke: c.bgCard,
                            strokeWidth: 2,
                        })),
                        ...tickXs.map((k) => ({
                            x: k,
                            y: 1,
                            tone: 'green' as const,
                            r: 6,
                            stroke: c.bgCard,
                            strokeWidth: 2,
                        })),
                    ],
                }),
                Row({
                    gap: 32,
                    align: 'center',
                    justify: 'center',
                    children: tickXs.map((k) =>
                        TextLabel({ c, text: `k=${k}`, width: 64, fontSize: 19, align: 'center' }),
                    ),
                }),
                TextLabel({
                    c,
                    text: 'Blue: (kA · B) / 24 climbs from 1× to 10×  ·  Green: cos stays 1.0×',
                    fontSize: 19,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
