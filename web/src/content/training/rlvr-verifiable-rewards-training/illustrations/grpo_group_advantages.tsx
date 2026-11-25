import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'
export { createFilm } from './_parts/grpo-film'

export const width = 760
export const height = 450
export const alt =
    'For one 14-by-12 prompt, the eight answers 168, 148, 156, 168, 170, 168, 144, 168 produce rewards 1, 0, 0, 1, 0, 1, 0, 1. Their mean is 0.5 and population standard deviation is 0.5, so the normalized advantages are +1, −1, −1, +1, −1, +1, −1, +1. An all-pass or all-fail group has zero spread and guarded zero advantages.'

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

function lbl(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 650,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return (
        <CanvasItem x={x} y={y} width={w} height={h}>
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={fontSize}
                color={color}
                fontWeight={fontWeight}
                align={align}
                mono={mono}
            />
        </CanvasItem>
    )
}

const illustration = defineIllustration((c: ThemeColors) => {
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    // Left diverging bar chart panel: x = 14..498 (w = 484)
    // Rollout label: x = 28..134 (w = 106)
    // Negative readout: x = 144..216 (w = 72)
    // Negative bar: x = 224..314 (len = 90)
    // Center zero axis: x = 314
    // Positive bar: x = 314..404 (len = 90)
    // Positive readout: x = 412..484 (w = 72)
    const centerX = 314
    const barScale = 90
    const rowStart = 84
    const rowStep = 38

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left chart card */}
                    <SvgFrame
                        c={c}
                        x={14}
                        y={14}
                        width={484}
                        height={422}
                        rx={10}
                        fill={c.bgCard}
                        stroke={c.borderSubtle}
                        strokeWidth={1.2}
                    />

                    {/* Vertical grid lines */}
                    <line
                        x1={centerX - barScale}
                        y1={76}
                        x2={centerX - barScale}
                        y2={390}
                        stroke={c.borderSubtle}
                        strokeWidth={1.2}
                        strokeDasharray="4 3"
                    />
                    <VectorSegment
                        x1={centerX}
                        y1={76}
                        x2={centerX}
                        y2={390}
                        color={c.textSecondary}
                        strokeWidth={2}
                        showStartDot={false}
                        showEndDot={false}
                    />
                    <line
                        x1={centerX + barScale}
                        y1={76}
                        x2={centerX + barScale}
                        y2={390}
                        stroke={c.borderSubtle}
                        strokeWidth={1.2}
                        strokeDasharray="4 3"
                    />

                    {/* Diverging advantage bars */}
                    {completions.map((item, idx) => {
                        const y = rowStart + idx * rowStep
                        const isPos = item.adv > 0
                        return (
                            <SvgFrame
                                key={item.id}
                                c={c}
                                x={isPos ? centerX : centerX - barScale}
                                y={y}
                                width={barScale}
                                height={24}
                                rx={4}
                                fill={withColorAlpha(isPos ? green : red, 0.32)}
                                stroke={isPos ? green : red}
                                strokeWidth={1.8}
                            />
                        )
                    })}

                    {/* Right Panel 1: Group Stats */}
                    <SvgFrame
                        c={c}
                        x={514}
                        y={14}
                        width={232}
                        height={216}
                        rx={10}
                        fill={c.bgCard}
                        stroke={cyan}
                        strokeWidth={1.5}
                    />
                    {/* Right Panel 2: Zero-Variance Guard */}
                    <SvgFrame
                        c={c}
                        x={514}
                        y={246}
                        width={232}
                        height={190}
                        rx={10}
                        fill={withColorAlpha(warm, 0.08)}
                        stroke={warm}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>

            {/* Chart header & axis ticks */}
            {lbl(c, 'Group Advantages (G = 8)', 28, 26, 260, 24, 17, c.textPrimary, 800)}
            {lbl(c, '−1.0', centerX - barScale - 32, 52, 64, 22, 16, red, 700, 'center', true)}
            {lbl(c, '0.0', centerX - 28, 52, 56, 22, 16, c.textPrimary, 700, 'center', true)}
            {lbl(c, '+1.0', centerX + barScale - 32, 52, 64, 22, 16, green, 700, 'center', true)}

            {/* Row labels and readouts, zero horizontal overlap */}
            {completions.map((item, idx) => {
                const y = rowStart + idx * rowStep + 1
                const isPos = item.adv > 0
                return (
                    <React.Fragment key={item.id}>
                        {lbl(c, `y${item.id} = ${item.answer}`, 28, y, 106, 22, 16, c.textPrimary, 700, 'left', true)}
                        {lbl(
                            c,
                            isPos ? '+1.0' : '−1.0',
                            isPos ? centerX + barScale + 10 : 144,
                            y,
                            70,
                            22,
                            16,
                            isPos ? green : red,
                            800,
                            isPos ? 'left' : 'right',
                            true,
                        )}
                    </React.Fragment>
                )
            })}

            {/* Formula footer */}
            {lbl(c, 'Â_i = (R_i − μ) / σ', 28, 402, 456, 24, 16, muted, 700, 'center', true)}

            {/* Right Card 1: Group Stats */}
            {lbl(c, 'Group Baseline', 530, 28, 200, 24, 17, cyan, 800)}
            {lbl(c, 'Prompt: 14 × 12', 530, 62, 200, 22, 16, c.textPrimary, 700, 'left', true)}
            {lbl(c, 'Target: 168', 530, 92, 200, 22, 16, green, 700, 'left', true)}
            {lbl(c, '4 pass · 4 fail', 530, 126, 200, 22, 16, muted, 650)}
            {lbl(c, 'Mean μ = 0.50', 530, 160, 200, 22, 16, cyan, 800, 'left', true)}
            {lbl(c, 'Std  σ = 0.50', 530, 190, 200, 22, 16, cyan, 800, 'left', true)}

            {/* Right Card 2: Zero-Variance Guard */}
            {lbl(c, 'Zero-Variance Guard', 530, 260, 204, 24, 17, warm, 800)}
            {lbl(c, 'All R=1 or all R=0', 530, 296, 204, 22, 16, c.textPrimary, 700)}
            {lbl(c, 'σ = 0 → Â_i = 0.0', 530, 328, 204, 22, 16, warm, 800, 'left', true)}
            {lbl(c, 'No value critic', 530, 368, 204, 22, 16, green, 700)}
            {lbl(c, 'Saves ~50% VRAM', 530, 396, 204, 22, 16, muted, 650)}
        </Board>
    )
})

export const create = illustration.create
export default illustration.default
