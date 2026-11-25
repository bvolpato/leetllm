import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 455
export const alt =
    'One token hidden state of width 6,144 splits into MLA query latent 2,048 and KV latent 512. Twenty-one layers run a fresh DSA 32-head indexer while fifty-seven IndexShare layers reuse a prior shortlist of up to 2,048 causal positions. Sparse attention feeds a router picking eight of 256 experts plus one shared expert before summing back into the 6,144 residual stream.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const soft = theme === 'light' ? 0.13 : 0.18

    // Residual stream highway down the left side
    const railX = 76
    fig.line(railX, 26, railX, 424, { color: blue, width: 2.5 })
    fig.arrow(railX, 412, railX, 428, { color: blue, width: 2.5, head: 7 })
    fig.text(railX, 14, 'Residual stream', {
        size: 12.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(railX - 10, 44, '6,144', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    const mainCx = 448

    // 1. MLA Latents input block
    const latW = 350
    const latH = 54
    const latY = 22
    fig.path(`M${railX} 49H${mainCx - latW / 2 - 4}`, { color: blue, width: 1.75 })
    fig.arrow(mainCx - latW / 2 - 14, 49, mainCx - latW / 2 - 2, 49, {
        color: blue,
        width: 1.75,
        head: 6,
    })
    fig.rect(mainCx - latW / 2, latY, latW, latH, {
        fill: tint(blue, c.bg, soft),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 9,
    })
    fig.text(mainCx, latY + 19, 'MLA Latent Projections', {
        size: 14.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(mainCx, latY + 40, 'Hidden 6,144 → Q latent 2,048 · KV latent 512', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // 2. Shortlist fork: IndexShare (57L) vs Fresh DSA (21L)
    const leftBx = 286
    const rightBx = 610
    const bW = 248
    const bH = 58
    const idxY = 104

    fig.path(`M${mainCx - 70} ${latY + latH}V90H${leftBx}V${idxY - 4}`, {
        color: warm,
        width: 1.75,
    })
    fig.arrow(leftBx, idxY - 12, leftBx, idxY - 2, { color: warm, width: 1.75, head: 6 })

    fig.path(`M${mainCx + 70} ${latY + latH}V90H${rightBx}V${idxY - 4}`, {
        color: purple,
        width: 1.75,
    })
    fig.arrow(rightBx, idxY - 12, rightBx, idxY - 2, { color: purple, width: 1.75, head: 6 })

    // Left: IndexShare
    fig.rect(leftBx - bW / 2, idxY, bW, bH, {
        fill: tint(warm, c.bg, soft),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 9,
    })
    fig.text(leftBx, idxY + 20, 'IndexShare (57 layers)', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(leftBx, idxY + 42, 'Reuses earlier shortlist', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Right: Fresh DSA
    fig.rect(rightBx - bW / 2, idxY, bW, bH, {
        fill: tint(purple, c.bg, soft),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 9,
    })
    fig.text(rightBx, idxY + 20, 'Fresh DSA (21 layers)', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(rightBx, idxY + 42, '32×128 FP8 indexer selects IDs', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // 3. Sparse MLA Attention block
    const attnY = 194
    const attnW = 350
    const attnH = 56
    fig.path(`M${leftBx} ${idxY + bH}V178H${mainCx - 64}V${attnY - 4}`, {
        color: warm,
        width: 1.6,
    })
    fig.arrow(mainCx - 64, attnY - 12, mainCx - 64, attnY - 2, {
        color: warm,
        width: 1.6,
        head: 6,
    })
    fig.path(`M${rightBx} ${idxY + bH}V178H${mainCx + 64}V${attnY - 4}`, {
        color: purple,
        width: 1.6,
    })
    fig.arrow(mainCx + 64, attnY - 12, mainCx + 64, attnY - 2, {
        color: purple,
        width: 1.6,
        head: 6,
    })

    fig.rect(mainCx - attnW / 2, attnY, attnW, attnH, {
        fill: tint(blue, c.bg, soft),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 9,
    })
    fig.text(mainCx, attnY + 20, 'Sparse MLA Attention', {
        size: 14.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(mainCx, attnY + 42, 'Attends to top-2,048 causal positions → 6,144 update', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Residual junction #1 after Sparse MLA Attention
    const add1Y = 274
    fig.path(`M${mainCx} ${attnY + attnH}V${add1Y}H${railX + 14}`, { color: blue, width: 1.75 })
    fig.arrow(railX + 26, add1Y, railX + 14, add1Y, { color: blue, width: 1.75, head: 6 })
    fig.circle(railX, add1Y, 12, { fill: c.bg, stroke: blue, width: 2 })
    fig.text(railX, add1Y, '+', { size: 15, weight: 700, color: blue, align: 'center' })

    // Branch out from residual stream into MoE + Shared Expert
    const moeY = 314
    const moeH = 64
    fig.path(`M${railX} 296H${rightBx}V${moeY - 4}`, { color: green, width: 1.6 })
    fig.arrow(leftBx, 296, leftBx, moeY - 2, { color: blue, width: 1.6, head: 6 })
    fig.arrow(rightBx, moeY - 12, rightBx, moeY - 2, { color: green, width: 1.6, head: 6 })

    // Left: 1 Shared Expert
    fig.rect(leftBx - bW / 2, moeY, bW, moeH, {
        fill: tint(blue, c.bg, soft),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 9,
    })
    fig.text(leftBx, moeY + 22, '1 Shared Expert', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(leftBx, moeY + 45, 'Always active (width 2,048)', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Right: Top-8 of 256 MoE
    fig.rect(rightBx - bW / 2, moeY, bW, moeH, {
        fill: tint(green, c.bg, soft),
        stroke: green,
        strokeWidth: 1.75,
        radius: 9,
    })
    fig.text(rightBx, moeY + 22, 'Top-8 of 256 Routed MoE', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(rightBx, moeY + 45, 'Sigmoid FP32 router + dispatch', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Residual junction #2 summing Shared + Routed back into 6,144 stream
    const add2Y = 406
    fig.path(`M${rightBx} ${moeY + moeH}V${add2Y}H${railX + 14}`, { color: green, width: 1.75 })
    fig.line(leftBx, moeY + moeH, leftBx, add2Y, { color: blue, width: 1.75 })
    fig.arrow(railX + 26, add2Y, railX + 14, add2Y, { color: green, width: 1.75, head: 6 })
    fig.circle(railX, add2Y, 12, { fill: c.bg, stroke: blue, width: 2 })
    fig.text(railX, add2Y, '+', { size: 15, weight: 700, color: blue, align: 'center' })

    fig.text(mainCx, 434, 'Shared + routed outputs add back into the 6,144 residual stream', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
