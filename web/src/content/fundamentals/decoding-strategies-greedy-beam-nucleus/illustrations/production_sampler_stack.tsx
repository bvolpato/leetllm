import { AxisPlot, Column, Row, Scene, TextLabel, getThemeColors, getToneColor } from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 560
export const alt =
    'Two side-by-side charts showing repetition penalty and top-p truncation order on four tokens: bright, clear, warm, and pale. Left chart shows seen token bright dropping from logit 2.4 to 2.0 under penalty 1.2, placing clear at 2.1 as the new greedy winner. Right chart plots sorted softmax probabilities 0.404, 0.365, 0.164, 0.067 and their cumulative CDF reaching 0.933 at rank 3 warm to cross top-p 0.90, eliminating pale.'

const rawLogits = [
    { x: 1, y: 2.4 },
    { x: 2, y: 2.1 },
    { x: 3, y: 1.2 },
    { x: 4, y: 0.3 },
]

const penLogits = [
    { x: 1, y: 2.0 },
    { x: 2, y: 2.1 },
    { x: 3, y: 1.2 },
    { x: 4, y: 0.3 },
]

const sortedProbs = [0.404, 0.365, 0.164, 0.067]
const cdfPoints = [
    { x: 1, y: 0.404 },
    { x: 2, y: 0.769 },
    { x: 3, y: 0.933 },
    { x: 4, y: 1.0 },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        title: 'Sampler pipeline: penalty shifts logits, then top-p truncates CDF',
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
                        text: 'Sampler pipeline: penalty shifts logits, then top-p truncates CDF',
                        fontSize: 21,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Seen "bright" falls 2.4 -> 2.0 (theta=1.2), flipping argmax to "clear"',
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
                                text: '1. Logits (0..2.8)',
                                fontSize: 20,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            AxisPlot({
                                c,
                                width: 300,
                                height: 250,
                                padding: 16,
                                xMin: 0.5,
                                xMax: 4.5,
                                yMin: 0,
                                yMax: 2.8,
                                showGrid: true,
                                gridCount: 5,
                                paths: [
                                    {
                                        points: [
                                            { x: 0.5, y: 2.1 },
                                            { x: 4.5, y: 2.1 },
                                        ],
                                        tone: 'green',
                                        strokeWidth: 2,
                                        dashed: true,
                                    },
                                ],
                                vectors: [
                                    {
                                        x1: 1,
                                        y1: 2.4,
                                        x2: 1,
                                        y2: 2.0,
                                        tone: 'warm',
                                        strokeWidth: 3,
                                        arrow: true,
                                        arrowSize: 7,
                                    },
                                ],
                                points: [
                                    ...rawLogits.map((pt) => ({
                                        ...pt,
                                        tone: 'warm' as const,
                                        r: 6,
                                    })),
                                    ...penLogits.map((pt, idx) => ({
                                        ...pt,
                                        tone: (idx === 1 ? 'green' : 'blue') as 'green' | 'blue',
                                        r: 7,
                                    })),
                                ],
                                ariaLabel:
                                    'Repetition penalty dropping seen token bright from 2.4 to 2.0 below clear at 2.1',
                            }),
                            TextLabel({
                                c,
                                text: 'bright  clear  warm  pale',
                                fontSize: 20,
                                mono: true,
                                color: c.textMuted,
                            }),
                        ],
                    }),
                    Column({
                        gap: 6,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: '2. Softmax Prob & CDF (0..1)',
                                fontSize: 20,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            AxisPlot({
                                c,
                                width: 300,
                                height: 250,
                                padding: 16,
                                xMin: 0.5,
                                xMax: 4.5,
                                yMin: 0,
                                yMax: 1.08,
                                showGrid: true,
                                gridCount: 5,
                                paths: [
                                    ...sortedProbs.map((p, i) => ({
                                        points: [
                                            { x: i + 1, y: 0 },
                                            { x: i + 1, y: p },
                                        ],
                                        tone: (i < 3 ? 'blue' : 'neutral') as 'blue' | 'neutral',
                                        strokeWidth: 20,
                                    })),
                                    { points: cdfPoints, tone: 'purple', strokeWidth: 3 },
                                    {
                                        points: [
                                            { x: 0.5, y: 0.9 },
                                            { x: 4.5, y: 0.9 },
                                        ],
                                        tone: 'warm',
                                        strokeWidth: 2,
                                        dashed: true,
                                    },
                                ],
                                points: [
                                    { x: 1, y: 0.404, tone: 'purple', r: 5 },
                                    { x: 2, y: 0.769, tone: 'purple', r: 5 },
                                    { x: 3, y: 0.933, tone: 'green', r: 8 },
                                    { x: 4, y: 1.0, tone: 'neutral', r: 5 },
                                ],
                                ariaLabel:
                                    'Sorted softmax probabilities and cumulative distribution crossing top-p 0.90 at rank 3 warm',
                            }),
                            TextLabel({
                                c,
                                text: 'clear  bright  warm  pale',
                                fontSize: 20,
                                mono: true,
                                color: c.textMuted,
                            }),
                        ],
                    }),
                ],
            }),
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Kept CDF = 0.933: clear (0.404), bright (0.365), warm (0.164)',
                        fontSize: 20,
                        fontWeight: 600,
                        color: getToneColor('blue', c),
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Cut after p=0.90: pale (0.067) | Seed 0 draw lands on "warm"',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
