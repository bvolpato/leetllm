import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 395
export const alt =
    'Two-stage retrieval funnel from coarse 1-bit Hamming filtering to exact FP32 cosine rescoring. Stage 1 compares query q = [0.8, -0.4, 0.6, -0.2] (sign bits 1010) against three candidates: linear-attn-draft (1010) and flash-attention-v2 (1010) tie in the Hamming 0 bucket (shortlist K=2), while adamw-decay (1100, Hamming 2, exact cos -0.435) is pruned. Stage 2 rescores the Hamming 0 shortlist in FP32, cleanly separating flash-attention-v2 (1.000) from linear-attn-draft (0.410).'

function bitStrip(
    fig: Figure,
    x: number,
    y: number,
    bits: readonly number[],
    diffs: readonly boolean[],
    accent: string,
    isDark: boolean,
) {
    const bw = 22
    const bh = 24
    const gap = 3
    bits.forEach((b, i) => {
        const bx = x + i * (bw + gap)
        const isDiff = diffs[i]
        const col = isDiff ? fig.tone('critical') : accent
        fig.rect(bx, y - bh / 2, bw, bh, {
            fill: isDiff
                ? tint(col, fig.c.bg, isDark ? 0.36 : 0.24)
                : b === 1
                  ? tint(col, fig.c.bg, isDark ? 0.28 : 0.18)
                  : tint(fig.c.textMuted, fig.c.bg, 0.1),
            stroke: isDiff ? col : b === 1 ? col : fig.c.borderSubtle,
            strokeWidth: isDiff ? 1.6 : 1.1,
            radius: 4,
        })
        fig.text(bx + bw / 2, y, String(b), {
            size: 13.5,
            color: isDiff ? col : fig.c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })
    })
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const isDark = theme === 'dark'

    // ─── TOP QUERY STRIP ───
    fig.text(20, 24, 'Query q = [0.8, −0.4, 0.6, −0.2]', {
        size: 14,
        color: cyan,
        mono: true,
        weight: 700,
    })
    fig.text(398, 24, 'sign bits:', { size: 13.5, color: c.textSecondary, align: 'right' })
    bitStrip(fig, 408, 24, [1, 0, 1, 0], [false, false, false, false], cyan, isDark)
    fig.line(20, 48, width - 20, 48, { color: c.borderSubtle, width: 1 })

    // ─── STAGE 1: Coarse 1-bit Hamming buckets ───
    fig.text(20, 70, '1. Coarse 1-bit Hamming filter', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    // Hamming = 0 shortlist bucket (K = 2)
    const bucketX = 20
    const bucketY = 92
    const bucketW = 344
    const bucketH = 148
    fig.rect(bucketX, bucketY, bucketW, bucketH, {
        fill: tint(cyan, c.bg, isDark ? 0.11 : 0.08),
        stroke: cyan,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(bucketX + 12, bucketY + 18, 'Hamming = 0 tie bucket  (shortlist K = 2)', {
        size: 14,
        color: cyan,
        weight: 700,
    })

    // Candidate 1 inside Ham=0 bucket: linear-attn-draft
    const c1Y = bucketY + 58
    fig.rect(bucketX + 10, c1Y - 22, bucketW - 20, 44, {
        fill: tint(warm, c.bg, isDark ? 0.2 : 0.13),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(bucketX + 20, c1Y, 'linear-attn-draft', {
        size: 14,
        color: c.textPrimary,
        mono: true,
        weight: 700,
    })
    bitStrip(fig, bucketX + 188, c1Y, [1, 0, 1, 0], [false, false, false, false], warm, isDark)
    fig.text(bucketX + bucketW - 18, c1Y, 'H=0', {
        size: 14,
        color: warm,
        align: 'right',
        mono: true,
        weight: 700,
    })

    // Candidate 2 inside Ham=0 bucket: flash-attention-v2
    const c2Y = bucketY + 114
    fig.rect(bucketX + 10, c2Y - 22, bucketW - 20, 44, {
        fill: tint(green, c.bg, isDark ? 0.22 : 0.14),
        stroke: green,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(bucketX + 20, c2Y, 'flash-attention-v2', {
        size: 14,
        color: c.textPrimary,
        mono: true,
        weight: 700,
    })
    bitStrip(fig, bucketX + 188, c2Y, [1, 0, 1, 0], [false, false, false, false], green, isDark)
    fig.text(bucketX + bucketW - 18, c2Y, 'H=0', {
        size: 14,
        color: green,
        align: 'right',
        mono: true,
        weight: 700,
    })

    // Pruned bucket: Hamming = 2 (adamw-decay)
    const pY = 278
    fig.rect(bucketX, pY - 26, bucketW, 56, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: c.borderSubtle,
        strokeWidth: 1.2,
        radius: 8,
    })
    fig.text(bucketX + 14, pY - 8, 'adamw-decay', {
        size: 13.5,
        color: c.textSecondary,
        mono: true,
        weight: 600,
    })
    fig.text(bucketX + 14, pY + 12, 'pruned (cos −0.435)', {
        size: 13.5,
        color: c.textMuted,
        mono: true,
    })
    bitStrip(fig, bucketX + 204, pY, [1, 1, 0, 0], [false, true, true, false], c.textMuted, isDark)
    fig.text(bucketX + bucketW - 14, pY, 'H=2', {
        size: 13.5,
        color: red,
        align: 'right',
        mono: true,
        weight: 700,
    })

    // ─── FUNNEL CONNECTOR (Stage 1 -> Stage 2) ───
    const fx1 = bucketX + bucketW + 4
    const fx2 = 434
    const res1Y = 148 // flash-attention-v2 (winner moves to top!)
    const res2Y = 236 // linear-attn-draft (drops below)

    // Smooth curved crossing connectors showing rank recovery
    const mx = (fx1 + fx2) / 2
    fig.path(
        `M${fx1} ${c2Y}C${mx} ${c2Y},${mx} ${res1Y},${fx2 - 6} ${res1Y}`,
        { color: green, width: 2.4 },
    )
    fig.path(`M${fx2} ${res1Y}L${fx2 - 8} ${res1Y - 4}L${fx2 - 8} ${res1Y + 4}Z`, { fill: green })

    fig.path(
        `M${fx1} ${c1Y}C${mx} ${c1Y},${mx} ${res2Y},${fx2 - 6} ${res2Y}`,
        { color: warm, width: 2.0, dash: '5 3' },
    )
    fig.path(`M${fx2} ${res2Y}L${fx2 - 8} ${res2Y - 4}L${fx2 - 8} ${res2Y + 4}Z`, { fill: warm })

    fig.text((fx1 + fx2) / 2, 102, 'FP32', {
        size: 13.5,
        color: cyan,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // ─── STAGE 2: Exact FP32 cosine rescoring bars ───
    const rx = 446
    const rw = 270
    fig.text(rx, 70, '2. Exact FP32 cosine rescore', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    const barPlot = fig.plot({ x: rx, y: 102, width: rw, height: 184 }, { x: [0, 1.15], y: [0, 2] })
    for (const tick of [0, 0.5, 1.0]) {
        const tx = barPlot.px(tick)
        fig.line(tx, barPlot.area.y, tx, barPlot.bottom, { color: c.borderSubtle, width: 1 })
        fig.text(tx, barPlot.bottom + 15, tick.toFixed(1), {
            size: 14,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(rx, barPlot.area.y, rx, barPlot.bottom, { color: c.textMuted, width: 1 })
    fig.line(rx, barPlot.bottom, rx + rw, barPlot.bottom, { color: c.textMuted, width: 1 })
    fig.text(rx + rw / 2, barPlot.bottom + 38, 'Exact cos(q, d)', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
    })

    // Winner bar: flash-attention-v2 (1.000)
    const w1 = barPlot.px(1.0) - rx
    fig.text(rx + 2, res1Y - 24, 'flash-attention-v2', {
        size: 14,
        color: green,
        mono: true,
        weight: 700,
    })
    fig.text(rx + rw, res1Y - 24, '#1 recovered ✓', {
        size: 14,
        color: green,
        align: 'right',
        weight: 700,
    })
    fig.rect(rx, res1Y - 12, w1, 24, {
        fill: tint(green, c.bg, isDark ? 0.42 : 0.28),
        stroke: green,
        strokeWidth: 1.75,
        radius: 4,
    })
    fig.text(rx + w1 - 8, res1Y, '1.000', {
        size: 14,
        color: isDark ? '#ffffff' : c.textPrimary,
        align: 'right',
        mono: true,
        weight: 800,
    })

    // Runner-up bar: linear-attn-draft (0.410)
    const w2 = barPlot.px(0.41) - rx
    fig.text(rx + 2, res2Y - 24, 'linear-attn-draft', {
        size: 14,
        color: warm,
        mono: true,
        weight: 700,
    })
    fig.rect(rx, res2Y - 12, w2, 24, {
        fill: tint(warm, c.bg, isDark ? 0.36 : 0.24),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 4,
    })
    fig.text(rx + w2 + 8, res2Y, '0.410 (tie trap)', {
        size: 14,
        color: warm,
        mono: true,
        weight: 700,
    })

    // Concise bottom takeaway comparison
    fig.text(20, 362, 'Binary top-1 alone: risks picking 0.410 on a tie', {
        size: 13.5,
        color: red,
        weight: 600,
    })
    fig.text(width - 20, 362, 'K = 2 + FP32 rescore: recovers 1.000', {
        size: 13.5,
        color: green,
        align: 'right',
        weight: 700,
    })

    return fig.render()
}

export default create('dark')
