import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 435
export const alt =
    'A token prefix through position t minus one runs through the model forward pass to emit logits for position t. During rollout, inference samples token x_t and appends it to context. During training, the learner scores the recorded target x_t with its loss mask and advantage, then runs backward and optimizer updates to produce updated weights.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const soft = theme === 'light' ? 0.13 : 0.18

    const cx = 390

    // 1. Shared Prefix box
    const preW = 286
    const preH = 62
    fig.rect(cx - preW / 2, 20, preW, preH, {
        fill: tint(blue, c.bg, soft),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 10,
    })
    fig.text(cx - 28, 41, 'Context prefix', {
        size: 14.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.math(cx + 68, 41, 'x_{1..t-1}', { size: 15, color: blue, align: 'center' })
    fig.text(cx, 64, 'Positions strictly before step t', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Arrow Prefix -> Forward Pass
    fig.arrow(cx, 85, cx, 118, { color: blue, width: 1.8, head: 7 })

    // 2. Model Forward Pass box
    const fwdW = 304
    const fwdH = 64
    const fwdY = 122
    fig.rect(cx - fwdW / 2, fwdY, fwdW, fwdH, {
        fill: tint(c.textPrimary, c.bg, 0.06),
        stroke: c.border,
        strokeWidth: 1.6,
        radius: 10,
    })
    fig.text(cx, fwdY + 23, 'Model forward pass', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(cx, fwdY + 47, 'Next-token logits + top-8 expert route', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Fork into Left (Orange: Learner update) and Right (Green: Rollout sample)
    const leftX = 186
    const rightX = 594
    const splitY = 212
    const laneY = 238

    // Left branch (Learner)
    fig.path(`M${cx - 60} ${fwdY + fwdH}V${splitY}H${leftX}V${laneY - 4}`, {
        color: warm,
        width: 2,
    })
    fig.arrow(leftX, laneY - 14, leftX, laneY - 2, { color: warm, width: 2, head: 7 })
    fig.text(leftX - 6, splitY - 11, 'Learner update path', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Right branch (Rollout)
    fig.path(`M${cx + 60} ${fwdY + fwdH}V${splitY}H${rightX}V${laneY - 4}`, {
        color: green,
        width: 2,
    })
    fig.arrow(rightX, laneY - 14, rightX, laneY - 2, { color: green, width: 2, head: 7 })
    fig.text(rightX + 6, splitY - 11, 'Rollout sampling path', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Left Lane Step 1: Score recorded target x_t
    const boxW = 280
    const boxH = 68
    fig.rect(leftX - boxW / 2, laneY, boxW, boxH, {
        fill: tint(warm, c.bg, soft),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 10,
    })
    fig.text(leftX - 24, laneY + 23, 'Score recorded target', {
        size: 14.5,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.math(leftX + 78, laneY + 23, 'x_t', { size: 15, color: warm, align: 'center' })
    fig.math(leftX, laneY + 49, '\\text{loss mask } m_t \\cdot \\text{adv } A', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Left Lane Step 2: Backward + Adam update
    const updY = 342
    fig.arrow(leftX, laneY + boxH + 3, leftX, updY - 4, { color: purple, width: 1.8, head: 7 })
    fig.rect(leftX - boxW / 2, updY, boxW, 68, {
        fill: tint(purple, c.bg, soft),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 10,
    })
    fig.text(leftX, updY + 23, 'Backward + Adam step', {
        size: 14.5,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.math(leftX, updY + 49, '\\theta \\leftarrow \\theta - \\eta\\,\\nabla_\\theta \\mathcal{L}', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Right Lane Step: Rollout sample x_t + loop back to prefix
    fig.rect(rightX - boxW / 2, laneY, boxW, boxH, {
        fill: tint(green, c.bg, soft),
        stroke: green,
        strokeWidth: 1.75,
        radius: 10,
    })
    fig.text(rightX - 20, laneY + 23, 'Sample next token', {
        size: 14.5,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.math(rightX + 68, laneY + 23, 'x_t', { size: 15, color: green, align: 'center' })
    fig.text(rightX, laneY + 49, 'Append token ID to context', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Clean right-side autoregressive loop back to Prefix box
    const loopX = 754
    fig.path(
        `M${rightX + boxW / 2} ${laneY + boxH / 2}H${loopX}V51H${cx + preW / 2 + 12}`,
        { color: green, width: 2 },
    )
    fig.arrow(cx + preW / 2 + 20, 51, cx + preW / 2 + 4, 51, {
        color: green,
        width: 2,
        head: 7,
    })
    fig.text(loopX - 10, 118, 'Next step:', {
        size: 12,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.math(loopX - 10, 140, 'x_{1..t}', {
        size: 13.5,
        color: green,
        align: 'right',
    })

    // Quiet causal invariant note in open bottom-right space
    fig.rect(rightX - boxW / 2, updY, boxW, 68, {
        fill: tint(c.textMuted, c.bg, 0.06),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 10,
    })
    fig.text(rightX, updY + 23, 'Causal alignment invariant', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.math(rightX, updY + 49, 'h_{t-1} \\text{ predicts } x_t \\;(\\text{never } h_t)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
