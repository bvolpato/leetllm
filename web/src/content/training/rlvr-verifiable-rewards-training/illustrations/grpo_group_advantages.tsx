import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    SvgFrame,
    TextLabel,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 860
export const height = 540
export const alt =
    'For one 14-by-12 prompt, the eight answers 168, 148, 156, 168, 170, 168, 144, 168 produce rewards 1, 0, 0, 1, 0, 1, 0, 1. Their mean is 0.5 and population standard deviation is 0.5, so the normalized advantages are +1, −1, −1, +1, −1, +1, −1, +1. An all-pass or all-fail group has zero spread and guarded zero advantages; other loss terms may still contribute.'

const completions = [
    { id: 1, answer: 168, reward: 1, adv: 1.0 },
    { id: 2, answer: 148, reward: 0, adv: -1.0 },
    { id: 3, answer: 156, reward: 0, adv: -1.0 },
    { id: 4, answer: 168, reward: 1, adv: 1.0 },
    { id: 5, answer: 170, reward: 0, adv: -1.0 },
    { id: 6, answer: 168, reward: 1, adv: 1.0 },
    { id: 7, answer: 144, reward: 0, adv: -1.0 },
    { id: 8, answer: 168, reward: 1, adv: 1.0 },
]

function leftAdvantageChart(c: ThemeColors) {
    const w = 410
    const h = 420
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)

    // Center x is at 205 (adv = 0)
    // adv = -1 is at 105, adv = +1 is at 305
    const centerX = 205
    const scale = 100 // 1 unit = 100px

    const label = (
        x: number,
        y: number,
        width: number,
        text: string,
        fontSize = 13,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'center',
    ) => (
        <CanvasItem x={x} y={y} width={width} height={22}>
            <TextLabel
                c={c}
                text={text}
                width={width}
                fontSize={fontSize}
                color={color}
                mono
                align={align}
            />
        </CanvasItem>
    )

    return (
        <Board c={c} width={w} height={h}>
            <CanvasItem x={0} y={0} width={w} height={h}>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    {/* Vertical grid lines */}
                    <line
                        x1={centerX - scale}
                        y1={30}
                        x2={centerX - scale}
                        y2={370}
                        stroke={c.borderLight}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                    />
                    <VectorSegment
                        x1={centerX}
                        y1={30}
                        x2={centerX}
                        y2={370}
                        color={c.borderLight}
                        strokeWidth={2}
                        showStartDot={false}
                        showEndDot={false}
                    />
                    <line
                        x1={centerX + scale}
                        y1={30}
                        x2={centerX + scale}
                        y2={370}
                        stroke={c.borderLight}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                    />

                    {/* Bars for each completion */}
                    {completions.map((item, idx) => {
                        const y = 46 + idx * 40
                        const isPos = item.adv > 0
                        const barWidth = scale
                        const x = isPos ? centerX : centerX - scale
                        return (
                            <React.Fragment key={item.id}>
                                <SvgFrame
                                    c={c}
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={24}
                                    rx={3}
                                    fill={isPos ? green : red}
                                    stroke="none"
                                />
                            </React.Fragment>
                        )
                    })}
                </svg>
            </CanvasItem>

            {/* Header labels */}
            {label(centerX - scale - 30, 8, 60, '−1.0', 13, c.textSecondary)}
            {label(centerX - 30, 8, 60, '0.0', 13, c.textPrimary)}
            {label(centerX + scale - 30, 8, 60, '+1.0', 13, c.textSecondary)}

            {/* Row labels */}
            {completions.map((item, idx) => {
                const y = 48 + idx * 40
                const isPos = item.adv > 0
                return (
                    <React.Fragment key={item.id}>
                        {label(10, y, 90, `y_${item.id}=${item.answer}`, 13, c.textPrimary, 'left')}
                        {label(
                            isPos ? centerX + scale + 10 : centerX - scale - 80,
                            y,
                            70,
                            isPos ? 'Â=+1.0' : 'Â=−1.0',
                            13,
                            isPos ? green : red,
                            isPos ? 'left' : 'right',
                        )}
                    </React.Fragment>
                )
            })}

            {label(
                20,
                386,
                370,
                'Normalized group advantage Â_i = (R_i − μ) / σ',
                13,
                c.textSecondary,
            )}
        </Board>
    )
}

function rightStatsPanel(c: ThemeColors) {
    return Column({
        gap: 10,
        align: 'stretch',
        children: [
            Panel({
                c,
                width: 374,
                padding: 10,
                gap: 6,
                tone: 'neutral',
                title: 'Group Statistics (G = 8)',
                titleFontSize: 16,
                children: Column({
                    gap: 6,
                    align: 'center',
                    children: [
                        Row({
                            gap: 12,
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: 'Mean μ = 0.50',
                                    tone: 'cyan',
                                    fontSize: 14,
                                    height: 25,
                                }),
                                BadgePill({
                                    c,
                                    text: 'Std Dev σ = 0.50',
                                    tone: 'purple',
                                    fontSize: 14,
                                    height: 25,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Prompt: "What is 14 × 12?" → Ground truth: 168',
                            width: 350,
                            fontSize: 13,
                            color: c.textSecondary,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: '4 correct (R=1), 4 incorrect (R=0). Half the group receives positive policy pushes; half receives negative.',
                            width: 350,
                            fontSize: 13,
                            color: c.textPrimary,
                            align: 'center',
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                width: 374,
                padding: 10,
                gap: 6,
                tone: 'warm',
                title: 'Zero-Variance Guard (σ = 0)',
                titleFontSize: 16,
                children: Column({
                    gap: 4,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'All-pass (all R=1) or all-fail (all R=0) yields σ = 0.',
                            width: 350,
                            fontSize: 13,
                            color: c.textPrimary,
                            align: 'center',
                        }),
                        BadgePill({
                            c,
                            text: 'Guarded: Â_i = 0.0 for all i',
                            tone: 'warm',
                            fontSize: 13,
                            height: 25,
                        }),
                        TextLabel({
                            c,
                            text: 'When all completions tie, GRPO produces zero advantage gradients, avoiding division by zero and preventing arbitrary updates.',
                            width: 350,
                            fontSize: 12,
                            color: c.textSecondary,
                            align: 'center',
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                width: 374,
                padding: 10,
                gap: 4,
                tone: 'green',
                title: 'No Value Model Needed',
                titleFontSize: 15,
                children: TextLabel({
                    c,
                    text: 'GRPO replaces the critic neural network with the group baseline μ, saving ~50% GPU memory during training.',
                    width: 350,
                    fontSize: 13,
                    color: c.textSecondary,
                    align: 'center',
                }),
            }),
        ],
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 824,
        title: 'GRPO Normalizes Advantages Across Group Rollouts',
        subtitle:
            'Group relative policy optimization scores each completion against its group mean and variance.',
        children: Row({
            width: 824,
            gap: 16,
            align: 'center',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    width: 430,
                    padding: 8,
                    gap: 4,
                    tone: 'neutral',
                    title: 'Group Advantages (Â_i)',
                    titleFontSize: 17,
                    children: leftAdvantageChart(c),
                }),
                Column({
                    width: 374,
                    gap: 8,
                    align: 'stretch',
                    children: [rightStatsPanel(c)],
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
