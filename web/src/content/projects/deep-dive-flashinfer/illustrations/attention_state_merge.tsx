import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 440
export const alt =
    'Split-KV attention state merge across two thread blocks (CTAs) for one query row and head. Worker A processes key chunk 1 with base-2 LSE 2 and output [1, 0] (mass 4). Worker B processes key chunk 2 with base-2 LSE 1 and output [0, 1] (mass 2). Cascaded merging calculates relative weights 4/6 and 2/6, producing merged output [2/3, 1/3] and updated base-2 LSE log2(6) approximately 2.585 without materializing full attention logits.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const muted = c.textSecondary

    const workerW = 376
    const workerH = 132
    const leftX = 28
    const rightX = 436
    const topY = 18

    // --- Worker CTA A ---
    fig.rect(leftX, topY, workerW, workerH, {
        fill: tint(blue, c.bg, 0.09),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.rect(leftX, topY, 4, workerH, { fill: blue, radius: 2 })
    fig.text(leftX + 18, topY + 24, 'Worker CTA A', { size: 15, weight: 700, color: blue })
    fig.text(leftX + workerW - 14, topY + 24, 'Key chunk 1', {
        size: 13,
        color: muted,
        align: 'right',
    })
    fig.math(leftX + 18, topY + 62, 'o_A = [1,\\, 0],\\qquad b_A = 2', {
        size: 15,
        color: c.textPrimary,
    })
    fig.math(leftX + 18, topY + 102, '\\text{mass}_A = 2^{b_A} = 2^2 = 4', {
        size: 15,
        color: blue,
    })

    // --- Worker CTA B ---
    fig.rect(rightX, topY, workerW, workerH, {
        fill: tint(cyan, c.bg, 0.09),
        stroke: cyan,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.rect(rightX, topY, 4, workerH, { fill: cyan, radius: 2 })
    fig.text(rightX + 18, topY + 24, 'Worker CTA B', { size: 15, weight: 700, color: cyan })
    fig.text(rightX + workerW - 14, topY + 24, 'Key chunk 2', {
        size: 13,
        color: muted,
        align: 'right',
    })
    fig.math(rightX + 18, topY + 62, 'o_B = [0,\\, 1],\\qquad b_B = 1', {
        size: 15,
        color: c.textPrimary,
    })
    fig.math(rightX + 18, topY + 102, '\\text{mass}_B = 2^{b_B} = 2^1 = 2', {
        size: 15,
        color: cyan,
    })

    // --- Proportional Normalization Mass Bar ---
    const barX = 140
    const barY = 208
    const barW = 560
    const barH = 40
    const wA = (barW * 4) / 6
    const wB = barW - wA

    // Converging arrows from CTAs to their respective mass segments (clear of center label)
    fig.arrow(leftX + 120, topY + workerH, barX + 68, barY - 4, {
        color: blue,
        width: 2,
        head: 6,
    })
    fig.arrow(rightX + workerW - 120, topY + workerH, barX + barW - 68, barY - 4, {
        color: cyan,
        width: 2,
        head: 6,
    })
    fig.text(420, 178, 'Max-shifted weights (m = max(2, 1) = 2)', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'center',
        width: 310,
    })

    // Segment A (4/6)
    fig.rect(barX, barY, wA - 2, barH, {
        fill: tint(blue, c.bg, 0.24),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(barX + (wA - 2) / 2, barY + barH / 2, 'mass 4   ->   w_A = 4/6 = 2/3', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
        width: wA - 12,
    })

    // Segment B (2/6)
    fig.rect(barX + wA + 2, barY, wB - 2, barH, {
        fill: tint(cyan, c.bg, 0.24),
        stroke: cyan,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(barX + wA + 2 + (wB - 2) / 2, barY + barH / 2, 'mass 2 -> 1/3', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
        mono: true,
        width: wB - 10,
    })

    // Arrow down to Merged State
    const mergeY = 286
    fig.arrow(420, barY + barH + 4, 420, mergeY - 4, {
        color: purple,
        width: 2,
        head: 6,
    })
    fig.text(436, 263, 'Total mass = 4 + 2 = 6', {
        size: 13,
        weight: 600,
        color: purple,
    })

    // --- Merged State Region ---
    fig.rect(86, mergeY, 668, 134, {
        fill: tint(purple, c.bg, 0.09),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(108, mergeY + 24, 'Merged State (o, b)', {
        size: 15,
        weight: 700,
        color: purple,
    })
    fig.text(734, mergeY + 24, 'Associative across arbitrary splits', {
        size: 13,
        color: muted,
        align: 'right',
    })

    fig.math(
        108,
        mergeY + 66,
        'o = \\frac{4}{6}\\,o_A + \\frac{2}{6}\\,o_B = \\left[\\frac{2}{3},\\; \\frac{1}{3}\\right] \\approx [0.667,\\; 0.333]',
        { size: 15, color: green },
    )
    fig.math(
        108,
        mergeY + 108,
        'b = 2 + \\log_2\\!\\bigl(2^{2-2} + 2^{1-2}\\bigr) = \\log_2(6) \\approx 2.585',
        { size: 15, color: purple },
    )

    return fig.render()
}

export default create()
