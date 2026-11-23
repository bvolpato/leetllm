import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Training log loss falls from 0.5060 at round 10 to 0.2684 at round 160. April validation loss reaches its minimum, 0.5643, at round 50, then rises to 0.5922. A highlighted point and vertical guide mark the selected round while training loss continues to fall.'
export const width = 520
export const height = 560

const rounds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]
const train = [
    0.506015, 0.441034, 0.400157, 0.370823, 0.349091, 0.333712, 0.321238, 0.313464, 0.305637,
    0.299459, 0.292436, 0.285535, 0.280757, 0.275128, 0.271356, 0.268388,
]
const valid = [
    0.614901, 0.586452, 0.575662, 0.569961, 0.564338, 0.56631, 0.570368, 0.573531, 0.574417,
    0.576855, 0.583644, 0.583676, 0.585091, 0.589272, 0.591108, 0.592219,
]

function plot(c: ThemeColors) {
    const plotWidth = 484
    const plotHeight = 344
    const padding = 42
    const xMin = 10
    const xMax = 160
    const yMin = 0.24
    const yMax = 0.66
    const innerWidth = plotWidth - padding * 2
    const innerHeight = plotHeight - padding * 2
    const x = (round: number) => padding + ((round - xMin) / (xMax - xMin)) * innerWidth
    const y = (loss: number) => padding + ((yMax - loss) / (yMax - yMin)) * innerHeight
    const text = (
        value: string,
        xPos: number,
        yPos: number,
        boxWidth: number,
        color = c.textSecondary,
        align: 'left' | 'center' | 'right' = 'center',
    ) =>
        CanvasItem({
            x: xPos,
            y: yPos,
            width: boxWidth,
            height: 27,
            children: TextLabel({
                c,
                text: value,
                width: boxWidth,
                fontSize: 19,
                color,
                align,
                mono: true,
            }),
        })

    return Board({
        c,
        width: plotWidth,
        height: 386,
        children: [
            AxisPlot({
                c,
                width: plotWidth,
                height: plotHeight,
                padding,
                xMin,
                xMax,
                yMin,
                yMax,
                showAxes: false,
                showGrid: false,
                frameFill: c.bgSubtle,
                frameStroke: c.borderSubtle,
                paths: [
                    ...[0.3, 0.4, 0.5, 0.6].map((loss) => ({
                        points: [
                            { x: xMin, y: loss },
                            { x: xMax, y: loss },
                        ],
                        color: c.borderSubtle,
                        strokeWidth: 1,
                    })),
                    ...[50, 100, 150].map((round) => ({
                        points: [
                            { x: round, y: yMin },
                            { x: round, y: yMax },
                        ],
                        color: c.borderSubtle,
                        strokeWidth: 1,
                    })),
                    {
                        points: [
                            { x: xMin, y: yMin },
                            { x: xMax, y: yMin },
                        ],
                        color: c.borderLight,
                        strokeWidth: 1.6,
                    },
                    {
                        points: [
                            { x: xMin, y: yMin },
                            { x: xMin, y: yMax },
                        ],
                        color: c.borderLight,
                        strokeWidth: 1.6,
                    },
                    {
                        points: [
                            { x: 50, y: yMin },
                            { x: 50, y: yMax },
                        ],
                        color: c.warning,
                        strokeWidth: 3,
                        dashed: true,
                    },
                    {
                        points: rounds.map((round, index) => ({ x: round, y: train[index] })),
                        color: c.info,
                        strokeWidth: 4,
                    },
                    {
                        points: rounds.map((round, index) => ({ x: round, y: valid[index] })),
                        color: c.primary,
                        strokeWidth: 4,
                    },
                ],
                points: [
                    ...rounds.map((round, index) => ({
                        x: round,
                        y: train[index],
                        tone: 'cyan' as const,
                        r: 4,
                        stroke: c.bgCard,
                        strokeWidth: 1.5,
                    })),
                    ...rounds.map((round, index) => ({
                        x: round,
                        y: valid[index],
                        tone: round === 50 ? ('warm' as const) : ('purple' as const),
                        r: round === 50 ? 9 : 4,
                        stroke: c.bgCard,
                        strokeWidth: round === 50 ? 3 : 1.5,
                    })),
                ],
            }),
            ...[0.3, 0.4, 0.5, 0.6].map((loss) =>
                text(loss.toFixed(1), 0, y(loss) - 13, 34, c.textSecondary, 'right'),
            ),
            ...[10, 50, 100, 160].map((round) =>
                text(
                    String(round),
                    x(round) - 24,
                    321,
                    48,
                    round === 50 ? c.warningDark : c.textSecondary,
                ),
            ),
            text('0.5643', x(50) + 8, y(0.564338) - 32, 80, c.warningDark, 'left'),
            <CanvasItem key="loss-title" x={padding} y={6} width={100} height={24}>
                <TextLabel
                    c={c}
                    text="log loss"
                    width={100}
                    fontSize={17}
                    color={c.textSecondary}
                />
            </CanvasItem>,
            <CanvasItem
                key="round-title"
                x={padding + innerWidth / 2 - 65}
                y={354}
                width={130}
                height={26}
            >
                <TextLabel
                    c={c}
                    text="boosting round"
                    width={130}
                    fontSize={17}
                    color={c.textSecondary}
                    align="center"
                />
            </CanvasItem>,
        ],
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 16,
        gap: 8,
        align: 'center',
        contentWidth: 488,
        title: 'April Selects Round 50',
        subtitle: 'Training loss keeps falling after validation loss turns upward.',
        children: Column({
            width: 488,
            gap: 6,
            align: 'center',
            children: [
                plot(c),
                Row({
                    gap: 8,
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'Jan–Mar training',
                            tone: 'cyan',
                            fontSize: 17,
                            height: 28,
                        }),
                        BadgePill({
                            c,
                            text: 'April validation',
                            tone: 'purple',
                            fontSize: 17,
                            height: 28,
                        }),
                        BadgePill({
                            c,
                            text: 'selected round',
                            tone: 'warm',
                            fontSize: 17,
                            height: 28,
                        }),
                    ],
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
