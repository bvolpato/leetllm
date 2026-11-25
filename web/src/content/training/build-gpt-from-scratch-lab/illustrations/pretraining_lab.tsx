import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 390
export const alt =
    'A tensor-shape forward-pass diagram for the GPT lab model: token batch X of shape [12, 48] sums token embeddings W_e[X] (vocab 17,485, width 96) with learned positions W_pos to form h0 [12, 48, 96], passes through two Pre-LN Transformer blocks (LN1 + 4-head causal attention with residual, then LN2 + 96->384->96 GELU MLP with residual), then final LayerNorm and tied LM head W_e transpose produce logits [12, 48, 17485] scored by shifted cross-entropy loss.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const muted = c.textSecondary

    const midY = 178

    // 1. Input Tokens X
    const x0 = 20
    fig.rect(x0, midY - 38, 108, 76, {
        fill: tint(cyan, c.bg, 0.14),
        stroke: cyan,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(x0 + 54, midY - 14, 'Tokens X', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
    })
    fig.text(x0 + 54, midY + 8, '[12, 48]', {
        size: 14,
        mono: true,
        weight: 700,
        align: 'center',
    })
    fig.text(x0 + 54, midY + 26, 'B=12 · T=48', {
        size: 11,
        color: muted,
        align: 'center',
    })

    // 2. Embed + Pos
    const xEmb = 156
    fig.arrow(x0 + 110, midY, xEmb - 3, midY, { color: cyan, width: 1.8, head: 7 })
    fig.rect(xEmb, midY - 44, 118, 88, {
        fill: tint(cyan, c.bg, 0.14),
        stroke: cyan,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(xEmb + 59, midY - 22, 'Wₑ + Wₚₒₛ', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
    })
    fig.text(xEmb + 59, midY + 2, 'V = 17,485', {
        size: 12,
        mono: true,
        color: muted,
        align: 'center',
    })
    fig.text(xEmb + 59, midY + 24, 'h₀ [12,48,96]', {
        size: 12,
        mono: true,
        weight: 700,
        align: 'center',
    })

    // 3. Pre-LN Transformer Block (×2) with explicit residual skip highway
    const bx = 304
    const bw = 224
    const by = 52
    const bh = 248
    fig.arrow(xEmb + 120, midY, bx - 3, midY, { color: warm, width: 1.8, head: 7 })

    fig.rect(bx, by, bw, bh, {
        fill: tint(warm, c.bg, 0.06),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 10,
    })
    fig.text(bx + 12, by + 20, 'Pre-LN Block  ×2', {
        size: 14,
        weight: 700,
        color: warm,
    })

    // Sublayer 1: LN1 -> 4-head Causal Attn + residual skip arc above
    const aX = bx + 18
    const aY = by + 64
    const aW = 188
    const aH = 54
    fig.rect(aX, aY, aW, aH, {
        fill: tint(warm, c.bg, 0.16),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(aX + aW / 2, aY + 18, 'LN₁ → Causal Attn', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(aX + aW / 2, aY + 38, '4 heads · d_head = 24', {
        size: 12,
        mono: true,
        color: muted,
        align: 'center',
    })

    // Residual +1 circle
    const p1Y = aY + aH + 22
    fig.line(bx + bw / 2, aY + aH, bx + bw / 2, p1Y - 12, { color: warm, width: 1.5 })
    fig.circle(bx + bw / 2, p1Y, 11, { fill: c.bg, stroke: warm, width: 1.6 })
    fig.text(bx + bw / 2, p1Y, '+', { size: 15, weight: 700, color: warm, align: 'center' })
    // Residual bypass path around Attn
    fig.path(`M${bx + 8} ${aY + 26} L${bx + 8} ${p1Y} L${bx + bw / 2 - 12} ${p1Y}`, {
        color: warm,
        width: 1.4,
        dash: '4 3',
    })
    fig.text(bx + 42, p1Y - 12, '+ residual', { size: 11, color: warm })

    // Sublayer 2: LN2 -> GELU MLP (96 -> 384 -> 96) + residual
    const mY = p1Y + 20
    const mH = 54
    fig.line(bx + bw / 2, p1Y + 11, bx + bw / 2, mY, { color: warm, width: 1.5 })
    fig.rect(aX, mY, aW, mH, {
        fill: tint(warm, c.bg, 0.16),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(aX + aW / 2, mY + 18, 'LN₂ → GELU MLP', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(aX + aW / 2, mY + 38, '96 → 384 → 96', {
        size: 12,
        mono: true,
        color: muted,
        align: 'center',
    })

    const p2Y = mY + mH + 18
    fig.line(bx + bw / 2, mY + mH, bx + bw / 2, p2Y - 10, { color: warm, width: 1.5 })
    fig.circle(bx + bw / 2, p2Y, 10, { fill: c.bg, stroke: warm, width: 1.6 })
    fig.text(bx + bw / 2, p2Y, '+', { size: 14, weight: 700, color: warm, align: 'center' })
    fig.path(`M${bx + 8} ${mY + 26} L${bx + 8} ${p2Y} L${bx + bw / 2 - 11} ${p2Y}`, {
        color: warm,
        width: 1.4,
        dash: '4 3',
    })

    // 4. Final LN + Tied LM Head
    const hx = 562
    fig.arrow(bx + bw + 2, midY, hx - 3, midY, { color: purple, width: 1.8, head: 7 })
    fig.rect(hx, midY - 56, 200, 112, {
        fill: tint(purple, c.bg, 0.14),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(hx + 100, midY - 34, 'LN_f + Tied LM Head', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.math(hx + 100, midY - 6, String.raw`\text{logits} = \mathrm{LN}_f(h_2)\,W_e^\top`, {
        size: 13,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(hx + 100, midY + 22, '[12, 48, 17485]', {
        size: 13,
        mono: true,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(hx + 100, midY + 42, 'L_CE baseline = 9.77', {
        size: 11,
        mono: true,
        color: green,
        align: 'center',
    })

    // Weight-tying dashed arc connecting W_e and Tied LM Head at bottom
    const tieY = 336
    fig.path(
        `M${xEmb + 59} ${midY + 46} L${xEmb + 59} ${tieY} L${hx + 100} ${tieY} L${hx + 100} ${midY + 60}`,
        { color: green, width: 1.6, dash: '5 4' },
    )
    fig.arrow(hx + 100, midY + 66, hx + 100, midY + 58, { color: green, width: 1.6, head: 6 })
    fig.arrow(xEmb + 59, midY + 52, xEmb + 59, midY + 46, { color: green, width: 1.6, head: 6 })
    fig.rect(354, tieY - 12, 168, 24, { fill: c.bg, radius: 4 })
    fig.text(438, tieY, 'tied weights Wₑ  (1.68M)', {
        size: 13,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Tensor shape annotation cleanly above block
    fig.text(bx + bw / 2, by - 14, 'hidden shape [12, 48, 96] preserved across both blocks', {
        size: 12,
        mono: true,
        color: muted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
