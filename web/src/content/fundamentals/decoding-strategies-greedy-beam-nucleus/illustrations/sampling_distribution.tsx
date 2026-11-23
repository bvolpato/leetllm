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
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 680
export const height = 560
export const alt =
    'Line chart comparing a twelve-token next-word distribution after The autumn light is across temperatures 0.3, 1.0, and 1.5. Original probabilities are bright 45 percent, fading 30, soft 15, pale 2, and eight 1-percent tail tokens totaling 8 percent. Rescaling all twelve tokens before summing the tail shifts bright from 77.8 percent at T=0.3 to 33.3 percent at T=1.5 while the grouped tail rises from under 0.01 percent to 21.1 percent, with Shannon entropy increasing from 0.86 to 2.09 to 2.75 bits.'

const base = [0.45, 0.3, 0.15, 0.02, ...Array<number>(8).fill(0.01)]
const categories = ['bright', 'fading', 'soft', 'pale', '8-tok tail']

function scaledGrouped(t: number) {
    const peak = Math.log(base[0]!)
    const weights = base.map((p) => Math.exp((Math.log(p) - peak) / t))
    const total = weights.reduce((a, b) => a + b, 0)
    const probs = weights.map((w) => w / total)
    const tail = probs.slice(4).reduce((a, b) => a + b, 0)
    return [probs[0]!, probs[1]!, probs[2]!, probs[3]!, tail].map((p) => p * 100)
}

const t03 = scaledGrouped(0.3)
const t10 = scaledGrouped(1.0)
const t15 = scaledGrouped(1.5)

function toPoints(values: number[]) {
    return values.map((y, idx) => ({ x: idx + 1, y }))
}

const yTicks = [
    { y: 80, label: '80%' },
    { y: 40, label: '40%' },
    { y: 0, label: '0%' },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const boardW = 656
    const boardH = 316
    const plotX = 72
    const plotY = 14
    const plotW = 540
    const plotH = 260
    const pad = 18
    const xMin = 0.7
    const xMax = 5.3
    const yMin = 0
    const yMax = 85
    const innerW = plotW - pad * 2
    const innerH = plotH - pad * 2
    const sx = (x: number) => plotX + pad + ((x - xMin) / (xMax - xMin)) * innerW
    const sy = (y: number) => plotY + pad + innerH - ((y - yMin) / (yMax - yMin)) * innerH

    const gridH = yTicks.map(({ y }) => ({
        points: [
            { x: xMin, y },
            { x: xMax, y },
        ],
        tone: 'neutral' as const,
        strokeWidth: y === 0 ? 2 : 1,
        opacity: y === 0 ? 0.65 : 0.32,
    }))
    const gridV = categories.map((_, idx) => ({
        points: [
            { x: idx + 1, y: yMin },
            { x: idx + 1, y: yMax },
        ],
        tone: 'neutral' as const,
        strokeWidth: 1,
        opacity: 0.3,
    }))

    return Scene({
        c,
        title: 'Temperature rescales all logits before grouping the tail',
        contentWidth: 656,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Temperature rescales all logits before grouping the tail',
                        fontSize: 21,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: '12-token distribution after "The autumn light is"',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
            Board({
                c,
                width: boardW,
                height: boardH,
                children: [
                    ...yTicks.map(({ y, label }) =>
                        CanvasItem({
                            x: 0,
                            y: sy(y) - 12,
                            width: plotX - 6,
                            height: 24,
                            children: TextLabel({
                                c,
                                text: label,
                                width: plotX - 6,
                                fontSize: 19,
                                mono: true,
                                align: 'right',
                                color: c.textMuted,
                            }),
                        }),
                    ),
                    CanvasItem({
                        x: plotX,
                        y: plotY,
                        width: plotW,
                        height: plotH,
                        children: AxisPlot({
                            c,
                            width: plotW,
                            height: plotH,
                            padding: pad,
                            xMin,
                            xMax,
                            yMin,
                            yMax,
                            showGrid: false,
                            showAxes: false,
                            paths: [
                                ...gridH,
                                ...gridV,
                                { points: toPoints(t03), tone: 'blue', strokeWidth: 4 },
                                { points: toPoints(t10), tone: 'purple', strokeWidth: 4 },
                                { points: toPoints(t15), tone: 'warm', strokeWidth: 4 },
                            ],
                            points: [
                                ...toPoints(t03).map((pt) => ({
                                    ...pt,
                                    tone: 'blue' as const,
                                    r: 6,
                                })),
                                ...toPoints(t10).map((pt) => ({
                                    ...pt,
                                    tone: 'purple' as const,
                                    r: 6,
                                })),
                                ...toPoints(t15).map((pt) => ({
                                    ...pt,
                                    tone: 'warm' as const,
                                    r: 6,
                                })),
                            ],
                            ariaLabel:
                                'Probability distribution curves for temperatures 0.3, 1.0, and 1.5 showing bright dropping from 77.8% to 33.3% while the 8-token tail climbs from 0.0% to 21.1%',
                        }),
                    }),
                    ...categories.map((name, idx) => {
                        const itemW = idx === 4 ? 120 : 88
                        return CanvasItem({
                            x: sx(idx + 1) - itemW / 2,
                            y: plotY + plotH - pad / 2 + 6,
                            width: itemW,
                            height: 26,
                            children: TextLabel({
                                c,
                                text: name,
                                width: itemW,
                                fontSize: 20,
                                mono: true,
                                align: 'center',
                                color: c.textMuted,
                            }),
                        })
                    }),
                ],
            }),
            Column({
                gap: 4,
                align: 'center',
                children: [
                    Row({
                        gap: 14,
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'T=0.3 (0.86b)',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('blue', c),
                            }),
                            TextLabel({
                                c,
                                text: 'T=1.0 (2.09b)',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('purple', c),
                            }),
                            TextLabel({
                                c,
                                text: 'T=1.5 (2.75b)',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('warm', c),
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Scale all 12 events first: 8-token tail climbs 8.0% -> 21.1% at T=1.5',
                        fontSize: 19,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
