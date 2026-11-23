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
    'The measured validation cross-entropy trace falls across updates 1, 41, 81, 161, 241, and 321, from 9.535 to 5.550 nats per token; a separate dashed line marks the analytic uniform reference ln(17,485) = 9.769. At update 81, validation loss is 6.050 and next-token accuracy is 17.1%; at update 321 they are 5.550 and 18.3%. The two text excerpts come from one sample at each checkpoint under the same prompt and decoding settings: “And the I the” and “And it .” early, then “I is the king :” and “The lord ?”. The loss estimate averages eight validation batches and 4,608 positions that may overlap, from one CPU run. The later prose still contains grammar errors and repetition.'

const points = [
    { update: 1, loss: 9.535 },
    { update: 41, loss: 6.416 },
    { update: 81, loss: 6.05 },
    { update: 161, loss: 5.747 },
    { update: 241, loss: 5.721 },
    { update: 321, loss: 5.55 },
]

function leftLossTraceBoard(c: ThemeColors) {
    const w = 410
    const h = 420
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)

    const plotX = 54
    const plotY = 40
    const plotW = 330
    const plotH = 300

    // X: 1 to 321
    const sx = (u: number) => plotX + ((u - 1) / 320) * plotW
    // Y: 5.0 to 10.0
    const sy = (l: number) => plotY + ((10.0 - l) / 5.0) * plotH

    const uniformY = sy(9.769)

    const pathPoints = points.map((p) => ({ x: sx(p.update), y: sy(p.loss) }))

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
                    {/* Uniform reference dashed line */}
                    <line
                        x1={plotX}
                        y1={uniformY}
                        x2={plotX + plotW}
                        y2={uniformY}
                        stroke={warm}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                    />

                    {/* Y-axis ticks */}
                    {[10.0, 8.0, 6.0].map((v) => (
                        <VectorSegment
                            key={v}
                            x1={plotX}
                            y1={sy(v)}
                            x2={plotX + plotW}
                            y2={sy(v)}
                            color={c.borderLight}
                            strokeWidth={1}
                            showStartDot={false}
                            showEndDot={false}
                        />
                    ))}

                    {/* Loss path */}
                    <path
                        d={`M ${pathPoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                        fill="none"
                        stroke={cyan}
                        strokeWidth={2.5}
                    />

                    {/* Points */}
                    {points.map((p) => (
                        <circle
                            key={p.update}
                            cx={sx(p.update)}
                            cy={sy(p.loss)}
                            r={5}
                            fill={cyan}
                        />
                    ))}
                </svg>
            </CanvasItem>

            {/* Labels */}
            {label(10, uniformY - 11, 40, '9.77', 12, warm, 'right')}
            {label(10, sy(8.0) - 11, 40, '8.0', 12, c.textSecondary, 'right')}
            {label(10, sy(6.0) - 11, 40, '6.0', 12, c.textSecondary, 'right')}

            {label(plotX - 15, plotY + plotH + 8, 30, '1', 12, c.textSecondary)}
            {label(sx(81) - 15, plotY + plotH + 8, 30, '81', 12, c.textSecondary)}
            {label(sx(161) - 15, plotY + plotH + 8, 30, '161', 12, c.textSecondary)}
            {label(sx(241) - 15, plotY + plotH + 8, 30, '241', 12, c.textSecondary)}
            {label(sx(321) - 25, plotY + plotH + 8, 50, '321', 12, c.textSecondary)}

            {label(plotX, 10, plotW, 'Uniform reference: ln(17,485) = 9.769', 13, warm, 'left')}
            {label(plotX, 386, plotW, 'Training Step / Update', 13, c.textSecondary, 'center')}
        </Board>
    )
}

function rightSampleCards(c: ThemeColors) {
    return Column({
        gap: 12,
        align: 'stretch',
        children: [
            Panel({
                c,
                width: 374,
                padding: 10,
                gap: 6,
                tone: 'warm',
                title: 'Early Stage (Update 81)',
                titleFontSize: 16,
                children: Column({
                    gap: 6,
                    align: 'stretch',
                    children: [
                        Row({
                            gap: 8,
                            justify: 'space-between',
                            children: [
                                BadgePill({
                                    c,
                                    text: 'Loss: 6.050 nats',
                                    tone: 'warm',
                                    fontSize: 13,
                                    height: 23,
                                }),
                                BadgePill({
                                    c,
                                    text: 'Accuracy: 17.1%',
                                    tone: 'neutral',
                                    fontSize: 13,
                                    height: 23,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Prompt: "And "',
                            width: 350,
                            fontSize: 13,
                            color: c.textSecondary,
                        }),
                        Panel({
                            c,
                            width: 354,
                            padding: 6,
                            gap: 2,
                            tone: 'neutral',
                            title: 'Sample Output',
                            titleFontSize: 13,
                            children: TextLabel({
                                c,
                                text: '"And the I the and the to ..."',
                                width: 338,
                                fontSize: 13,
                                color: c.textPrimary,
                                mono: true,
                            }),
                        }),
                        TextLabel({
                            c,
                            text: 'Frequent unigram words emerge; syntax and discourse remain degenerate.',
                            width: 350,
                            fontSize: 12,
                            color: c.textSecondary,
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                width: 374,
                padding: 10,
                gap: 6,
                tone: 'green',
                title: 'Converged Stage (Update 321)',
                titleFontSize: 16,
                children: Column({
                    gap: 6,
                    align: 'stretch',
                    children: [
                        Row({
                            gap: 8,
                            justify: 'space-between',
                            children: [
                                BadgePill({
                                    c,
                                    text: 'Loss: 5.550 nats',
                                    tone: 'green',
                                    fontSize: 13,
                                    height: 23,
                                }),
                                BadgePill({
                                    c,
                                    text: 'Accuracy: 18.3%',
                                    tone: 'neutral',
                                    fontSize: 13,
                                    height: 23,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Prompt: "And "',
                            width: 350,
                            fontSize: 13,
                            color: c.textSecondary,
                        }),
                        Panel({
                            c,
                            width: 354,
                            padding: 6,
                            gap: 2,
                            tone: 'neutral',
                            title: 'Sample Output',
                            titleFontSize: 13,
                            children: TextLabel({
                                c,
                                text: '"And it is the king : the lord ? ..."',
                                width: 338,
                                fontSize: 13,
                                color: c.textPrimary,
                                mono: true,
                            }),
                        }),
                        TextLabel({
                            c,
                            text: 'Archaic English dialogue rhythm and punctuation patterns emerge.',
                            width: 350,
                            fontSize: 12,
                            color: c.textSecondary,
                        }),
                    ],
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
        title: 'Validation Loss Decay and Sample Generation Quality',
        subtitle:
            'Validation cross-entropy falls steadily below uniform reference as coherent syntax forms.',
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
                    title: 'Validation Cross-Entropy',
                    titleFontSize: 17,
                    children: leftLossTraceBoard(c),
                }),
                Column({
                    width: 374,
                    gap: 8,
                    align: 'stretch',
                    children: [rightSampleCards(c)],
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
