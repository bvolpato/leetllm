import { AxisPlot, Column, Row, Scene, TextLabel, getThemeColors, getToneColor } from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 560
export const alt =
    'Side-by-side probability bar and cumulative distribution plots comparing peaked (72, 20, 5, 2, 1 percent) and flat (40, 20, 15, 11.5, 3.5, plus ten 1-percent tokens) distributions. Fixed top-k 3 keeps three tokens in both. Top-p 0.90 adapts from two to five tokens via cumulative mass, while min-p 0.10 adapts from two to four tokens by scaling the cutoff from 7.2 percent to 4.0 percent.'

const peaked = [72, 20, 5, 2, 1]
const flatShown = [40, 20, 15, 11.5, 3.5, 1, 1, 1]

function cdfCurve(values: number[]) {
    let acc = 0
    return values.map((v, i) => {
        acc += v
        return { x: i + 1, y: acc }
    })
}

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        title: 'Adaptive cutoffs track confidence; top-k keeps a fixed count',
        contentWidth: 636,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Adaptive cutoffs track confidence; top-k keeps a fixed count',
                        fontSize: 21,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Purple: CDF to p=.90 (green dot) | Orange dash: min-p 0.10',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
            Row({
                gap: 16,
                align: 'start',
                justify: 'center',
                children: [
                    Column({
                        gap: 6,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Peaked: 72, 20, 5, 2, 1%',
                                fontSize: 20,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            AxisPlot({
                                c,
                                width: 300,
                                height: 240,
                                padding: 16,
                                xMin: 0.4,
                                xMax: 5.6,
                                yMin: 0,
                                yMax: 105,
                                showGrid: true,
                                gridCount: 5,
                                paths: [
                                    ...peaked.map((v, i) => ({
                                        points: [
                                            { x: i + 1, y: 0 },
                                            { x: i + 1, y: v },
                                        ],
                                        tone: (i < 2 ? 'blue' : 'neutral') as 'blue' | 'neutral',
                                        strokeWidth: 20,
                                    })),
                                    { points: cdfCurve(peaked), tone: 'purple', strokeWidth: 3 },
                                    {
                                        points: [
                                            { x: 0.5, y: 90 },
                                            { x: 5.5, y: 90 },
                                        ],
                                        tone: 'green',
                                        strokeWidth: 2,
                                        dashed: true,
                                    },
                                    {
                                        points: [
                                            { x: 0.5, y: 7.2 },
                                            { x: 5.5, y: 7.2 },
                                        ],
                                        tone: 'warm',
                                        strokeWidth: 2,
                                        dashed: true,
                                    },
                                ],
                                points: [{ x: 2, y: 92, tone: 'green', r: 7 }],
                                ariaLabel:
                                    'Peaked distribution retaining 2 tokens under both top-p 0.90 and min-p 0.10',
                            }),
                            TextLabel({
                                c,
                                text: 'Ranks 1..5 | min-p 7.2%',
                                fontSize: 20,
                                mono: true,
                                color: c.textMuted,
                            }),
                            TextLabel({
                                c,
                                text: 'k=3: 3  |  p=.90: 2  |  min-p: 2',
                                fontSize: 20,
                                fontWeight: 600,
                                color: getToneColor('blue', c),
                            }),
                        ],
                    }),
                    Column({
                        gap: 6,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Flat: 40, 20, 15, 11.5, 3.5, 1%x10',
                                fontSize: 20,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            AxisPlot({
                                c,
                                width: 300,
                                height: 240,
                                padding: 16,
                                xMin: 0.4,
                                xMax: 8.6,
                                yMin: 0,
                                yMax: 105,
                                showGrid: true,
                                gridCount: 5,
                                paths: [
                                    ...flatShown.map((v, i) => ({
                                        points: [
                                            { x: i + 1, y: 0 },
                                            { x: i + 1, y: v },
                                        ],
                                        tone: (i < 5 ? 'blue' : 'neutral') as 'blue' | 'neutral',
                                        strokeWidth: 16,
                                    })),
                                    {
                                        points: cdfCurve(flatShown),
                                        tone: 'purple',
                                        strokeWidth: 3,
                                    },
                                    {
                                        points: [
                                            { x: 0.5, y: 90 },
                                            { x: 8.5, y: 90 },
                                        ],
                                        tone: 'green',
                                        strokeWidth: 2,
                                        dashed: true,
                                    },
                                    {
                                        points: [
                                            { x: 0.5, y: 4.0 },
                                            { x: 8.5, y: 4.0 },
                                        ],
                                        tone: 'warm',
                                        strokeWidth: 2,
                                        dashed: true,
                                    },
                                ],
                                points: [{ x: 5, y: 90, tone: 'green', r: 7 }],
                                ariaLabel:
                                    'Flat distribution expanding top-p 0.90 to 5 tokens and min-p 0.10 to 4 tokens',
                            }),
                            TextLabel({
                                c,
                                text: 'Ranks 1..8+ | min-p 4.0%',
                                fontSize: 20,
                                mono: true,
                                color: c.textMuted,
                            }),
                            TextLabel({
                                c,
                                text: 'k=3: 3  |  p=.90: 5  |  min-p: 4',
                                fontSize: 20,
                                fontWeight: 600,
                                color: getToneColor('blue', c),
                            }),
                        ],
                    }),
                ],
            }),
            TextLabel({
                c,
                text: 'Flat rank 5 (3.5%) hits p=0.90 exactly; min-p cuts at rank 4 (4.0%)',
                fontSize: 20,
                color: c.textMuted,
                align: 'center',
            }),
        ],
    })
}

export default create('dark')
