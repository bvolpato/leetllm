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
    VectorArrow,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Four binary rows occupy four ordered histogram bins, one row per bin. With probability 0.5, labels 1, 1, 0, 0 give gradient sums minus 0.5, minus 0.5, plus 0.5, plus 0.5 and Hessian sums 0.25 each. A cut after bin two separates negative from positive gradients. Its left totals are G minus 1 and H 0.5; right totals are G plus 1 and H 0.5. With lambda 1 and gamma 0, regularized gain is 0.171 after bins one or three and two-thirds after bin two.'
export const width = 860
export const height = 540

const bins = [
    { x: 50, label: 1, gradient: -0.5 },
    { x: 140, label: 1, gradient: -0.5 },
    { x: 230, label: 0, gradient: 0.5 },
    { x: 320, label: 0, gradient: 0.5 },
]
const gains = [
    { cut: 1, gain: 6 / 35, label: '0.171' },
    { cut: 2, gain: 2 / 3, label: '0.667' },
    { cut: 3, gain: 6 / 35, label: '0.171' },
]

function leftHistogramBoard(c: ThemeColors) {
    const w = 400
    const h = 420
    const label = (
        x: number,
        y: number,
        width: number,
        text: string,
        fontSize = 17,
        color = c.textPrimary,
        height = 26,
    ) => (
        <CanvasItem x={x} y={y} width={width} height={height}>
            <TextLabel
                c={c}
                text={text}
                width={width}
                fontSize={fontSize}
                color={color}
                align="center"
                mono
                math={false}
            />
        </CanvasItem>
    )

    return (
        <Board c={c} width={w} height={h}>
            <CanvasItem x={0} y={0} width={w} height={h}>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    {/* Bin boxes and gradient/hessian blocks */}
                    {bins.map((bin, index) => (
                        <React.Fragment key={bin.x}>
                            <SvgFrame
                                c={c}
                                x={bin.x - 36}
                                y={36}
                                width={72}
                                height={34}
                                rx={4}
                                fill={c.bgSubtle}
                                stroke={c.borderLight}
                                strokeWidth={1}
                            />
                            {/* Gradient bar */}
                            <SvgFrame
                                c={c}
                                x={bin.x - 22}
                                y={bin.gradient > 0 ? 116 : 160}
                                width={44}
                                height={44}
                                rx={2}
                                fill={index < 2 ? c.info : c.positive}
                                stroke="none"
                            />
                            {/* Hessian bar */}
                            <SvgFrame
                                c={c}
                                x={bin.x - 22}
                                y={242}
                                width={44}
                                height={22}
                                rx={2}
                                fill={c.textSecondary}
                                stroke="none"
                            />
                        </React.Fragment>
                    ))}
                    {/* Zero lines */}
                    <VectorSegment
                        x1={10}
                        y1={160}
                        x2={360}
                        y2={160}
                        color={c.borderLight}
                        strokeWidth={1.5}
                        showStartDot={false}
                        showEndDot={false}
                    />
                    <VectorSegment
                        x1={10}
                        y1={264}
                        x2={360}
                        y2={264}
                        color={c.borderLight}
                        strokeWidth={1.5}
                        showStartDot={false}
                        showEndDot={false}
                    />
                    {/* Optimal split dashed cut */}
                    <line
                        x1={185}
                        y1={10}
                        x2={185}
                        y2={290}
                        stroke={c.warning}
                        strokeWidth={2.5}
                        strokeDasharray="6 5"
                    />
                    {/* Aggregation brackets */}
                    <path
                        d="M 20 295 L 20 302 L 175 302 L 175 295"
                        stroke={c.info}
                        strokeWidth={2}
                        fill="none"
                    />
                    <path
                        d="M 195 295 L 195 302 L 350 302 L 350 295"
                        stroke={c.positive}
                        strokeWidth={2}
                        fill="none"
                    />
                    <VectorArrow
                        x1={97}
                        y1={304}
                        x2={97}
                        y2={336}
                        color={c.info}
                        strokeWidth={2}
                        arrowSize={6}
                    />
                    <VectorArrow
                        x1={272}
                        y1={304}
                        x2={272}
                        y2={336}
                        color={c.positive}
                        strokeWidth={2}
                        arrowSize={6}
                    />
                    {/* Leaf aggregation panels */}
                    <SvgFrame
                        c={c}
                        x={14}
                        y={344}
                        width={166}
                        height={40}
                        rx={4}
                        fill={c.bgSubtle}
                        stroke={c.info}
                        strokeWidth={1.5}
                    />
                    <SvgFrame
                        c={c}
                        x={190}
                        y={344}
                        width={166}
                        height={40}
                        rx={4}
                        fill={c.bgSubtle}
                        stroke={c.positive}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>
            {/* Headers & Text labels */}
            {label(140, 6, 90, 'Cut 2', 17, c.warningDark)}
            {bins.map((bin, index) => (
                <React.Fragment key={bin.x}>
                    {label(bin.x - 36, 40, 72, `Bin ${index + 1}`, 16, c.textPrimary)}
                    {label(bin.x - 30, 76, 60, `y=${bin.label}`, 15, c.textSecondary)}
                    {label(
                        bin.x - 22,
                        bin.gradient > 0 ? 126 : 172,
                        44,
                        bin.gradient > 0 ? '+0.5' : '−0.5',
                        15,
                        c.bgCard,
                    )}
                    {label(bin.x - 22, 243, 44, '0.25', 14, c.bgCard)}
                </React.Fragment>
            ))}
            {label(362, 148, 36, 'g', 17, c.textSecondary)}
            {label(362, 246, 36, 'h', 17, c.textSecondary)}
            {/* Summary badges */}
            {label(20, 352, 154, 'G=−1.0 · H=0.5', 16, c.info)}
            {label(196, 352, 154, 'G=+1.0 · H=0.5', 16, c.positive)}
            {label(20, 392, 154, 'Left Leaf', 15, c.textSecondary)}
            {label(196, 392, 154, 'Right Leaf', 15, c.textSecondary)}
        </Board>
    )
}

function rightGainBoard(c: ThemeColors) {
    const w = 380
    const h = 420
    const label = (
        x: number,
        y: number,
        width: number,
        text: string,
        fontSize = 17,
        color = c.textPrimary,
        height = 26,
    ) => (
        <CanvasItem x={x} y={y} width={width} height={height}>
            <TextLabel
                c={c}
                text={text}
                width={width}
                fontSize={fontSize}
                color={color}
                align="center"
                mono
                math={false}
            />
        </CanvasItem>
    )

    const positions = [70, 190, 310]

    return (
        <Board c={c} width={w} height={h}>
            <CanvasItem x={0} y={0} width={w} height={h}>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    {/* Baseline */}
                    <VectorSegment
                        x1={20}
                        y1={290}
                        x2={360}
                        y2={290}
                        color={c.borderLight}
                        strokeWidth={1.5}
                        showStartDot={false}
                        showEndDot={false}
                    />
                    {/* Gain bars */}
                    {gains.map((item, idx) => {
                        const barHeight = item.gain * 250
                        const x = positions[idx]
                        return (
                            <React.Fragment key={item.cut}>
                                <SvgFrame
                                    c={c}
                                    x={x - 28}
                                    y={290 - barHeight}
                                    width={56}
                                    height={barHeight}
                                    rx={3}
                                    fill={item.cut === 2 ? c.warning : c.textSecondary}
                                    stroke="none"
                                />
                            </React.Fragment>
                        )
                    })}
                </svg>
            </CanvasItem>
            {label(20, 12, 340, 'Regularized Gain by Cut Point', 18, c.textPrimary)}
            {label(
                20,
                38,
                340,
                'Gain = ½ [GL²/(HL+λ) + GR²/(HR+λ) − G²/(H+λ)]',
                14,
                c.textSecondary,
            )}
            {gains.map((item, idx) => {
                const x = positions[idx]
                const barHeight = item.gain * 250
                return (
                    <React.Fragment key={item.cut}>
                        {label(
                            x - 30,
                            260 - barHeight,
                            60,
                            item.label,
                            16,
                            item.cut === 2 ? c.warningDark : c.textPrimary,
                        )}
                        {label(x - 30, 300, 60, `Cut ${item.cut}`, 16, c.textPrimary)}
                        {label(
                            x - 45,
                            326,
                            90,
                            item.cut === 2 ? 'Optimal Split' : 'Sub-optimal',
                            14,
                            item.cut === 2 ? c.warningDark : c.textSecondary,
                        )}
                    </React.Fragment>
                )
            })}
            <CanvasItem x={20} y={364} width={340} height={46}>
                <TextLabel
                    c={c}
                    text="Evaluating G and H totals takes O(B) operations instead of O(N log N) continuous sorting."
                    width={340}
                    fontSize={15}
                    color={c.textSecondary}
                    align="center"
                />
            </CanvasItem>
        </Board>
    )
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 824,
        title: 'Histogram Bins Accumulate Gradients for Constant-Time Cuts',
        subtitle:
            'Prefix sums over histogram bins evaluate candidate split gains in O(B) bin operations.',
        children: Row({
            width: 824,
            gap: 16,
            align: 'center',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    width: 414,
                    padding: 8,
                    gap: 4,
                    tone: 'neutral',
                    title: 'Bin Accumulation (G & H)',
                    titleFontSize: 18,
                    children: leftHistogramBoard(c),
                }),
                Panel({
                    c,
                    width: 394,
                    padding: 8,
                    gap: 4,
                    tone: 'warm',
                    title: 'Split Gain Evaluation',
                    titleFontSize: 18,
                    children: rightGainBoard(c),
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
