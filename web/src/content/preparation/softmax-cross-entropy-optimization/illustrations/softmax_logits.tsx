import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 392
export const alt =
    'A three-stage horizontal pipeline turns logits bug 3.0, docs 1.0, and security 0.0 into probabilities. Subtracting the peak 3.0 shifts bars to 0.0, minus 2.0, and minus 3.0; exponentiation produces weights 1.000, 0.135, and 0.050 summing to 1.185; dividing by 1.185 yields 84.4% bug, 11.4% docs, and 4.2% security.'

const classes = [
    { label: 'bug', z: 3.0, shifted: 0.0, exp: 1.0, prob: 0.844, tone: 'critical' as const },
    { label: 'docs', z: 1.0, shifted: -2.0, exp: Math.exp(-2), prob: 0.114, tone: 'green' as const },
    { label: 'security', z: 0.0, shifted: -3.0, exp: Math.exp(-3), prob: 0.042, tone: 'cyan' as const },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const colors = classes.map((cl) => fig.tone(cl.tone))

    // Stage headers
    fig.text(112, 26, '1. Raw logits z', { size: 20, weight: 750, color: c.textPrimary })
    fig.text(112, 54, 'Unbounded scores', { size: 17, color: c.textSecondary })

    fig.text(370, 26, '2. Max-shifted z − m', { size: 20, weight: 750, color: purple })
    fig.text(370, 54, 'Subtract m = 3.0 (all ≤ 0)', { size: 17, color: c.textSecondary })

    fig.text(628, 26, '3. exp & Softmax p', { size: 20, weight: 750, color: green })
    fig.text(628, 54, 'exp(z − m) / 1.185', { size: 17, color: c.textSecondary })

    const rowYs = [118, 178, 238]

    // ── Stage 1: Raw logits z (baseline x=112, scale 0..3 -> 0..136px) ───────
    const s1Left = 112
    const s1Scale = 136 / 3.0
    fig.line(s1Left, 86, s1Left, 266, { color: c.textMuted, width: 1.4 })
    fig.line(s1Left + 3 * s1Scale, 86, s1Left + 3 * s1Scale, 266, {
        color: purple,
        width: 1.25,
        dash: '4 4',
        opacity: 0.75,
    })
    fig.text(s1Left, 282, '0', { size: 16, mono: true, color: c.textSecondary, align: 'center' })
    fig.text(s1Left + 3 * s1Scale, 282, 'm=3.0', {
        size: 16,
        mono: true,
        color: purple,
        align: 'center',
        weight: 650,
    })

    classes.forEach((cl, i) => {
        const y = rowYs[i]!
        const col = colors[i]!
        const w = Math.max(4, cl.z * s1Scale)
        fig.text(s1Left - 14, y, cl.label, {
            size: 19,
            weight: 700,
            color: col,
            align: 'right',
            width: 96,
        })
        fig.rect(s1Left, y - 12, w, 24, { fill: col, radius: 4 })
        fig.text(s1Left + w + 8, y, cl.z.toFixed(1), {
            size: 18,
            mono: true,
            weight: 700,
            color: c.textPrimary,
        })
    })

    // Arrow Stage 1 -> Stage 2
    fig.arrow(300, 178, 352, 178, { color: purple, width: 2.5, head: 7 })
    fig.text(326, 152, '− 3.0', {
        size: 17,
        mono: true,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // ── Stage 2: Max-shifted z - m (0 axis on right at x=546, extends left) ─
    const s2Zero = 546
    const s2Scale = 152 / 3.0
    fig.line(s2Zero, 86, s2Zero, 266, { color: c.textMuted, width: 1.4 })
    fig.line(s2Zero - 3 * s2Scale, 86, s2Zero - 3 * s2Scale, 266, {
        color: c.borderSubtle,
        width: 1,
        dash: '4 4',
        opacity: 0.45,
    })
    fig.text(s2Zero - 3 * s2Scale, 282, '−3', {
        size: 16,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(s2Zero, 282, '0', {
        size: 16,
        mono: true,
        color: c.textSecondary,
        align: 'center',
        weight: 650,
    })

    classes.forEach((cl, i) => {
        const y = rowYs[i]!
        const col = colors[i]!
        const w = Math.max(5, Math.abs(cl.shifted) * s2Scale)
        if (cl.shifted === 0) {
            // Peak sits right at 0
            fig.circle(s2Zero, y, 7, { fill: col, stroke: c.bg, width: 2 })
            fig.text(s2Zero - 14, y, '0.0', {
                size: 18,
                mono: true,
                weight: 700,
                color: col,
                align: 'right',
            })
        } else {
            fig.rect(s2Zero - w, y - 12, w, 24, {
                fill: tint(col, c.bg, isLight ? 0.72 : 0.78),
                stroke: col,
                strokeWidth: 1.4,
                radius: 4,
            })
            fig.text(s2Zero - w - 8, y, cl.shifted.toFixed(1).replace('-', '−'), {
                size: 18,
                mono: true,
                weight: 700,
                color: col,
                align: 'right',
            })
        }
    })

    // Arrow Stage 2 -> Stage 3
    fig.arrow(556, 178, 610, 178, { color: green, width: 2.5, head: 7 })
    fig.text(583, 152, 'exp', {
        size: 17,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    // ── Stage 3: exp weights & Softmax p ────────────────────────────────────
    const s3Left = 628
    const s3MaxW = 114
    fig.line(s3Left, 86, s3Left, 266, { color: c.textMuted, width: 1.4 })
    fig.text(s3Left, 282, '0', { size: 16, mono: true, color: c.textSecondary, align: 'center' })
    fig.text(s3Left + s3MaxW, 282, '1.0', {
        size: 16,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    classes.forEach((cl, i) => {
        const y = rowYs[i]!
        const col = colors[i]!
        const expW = Math.max(6, cl.exp * s3MaxW)
        const probW = Math.max(5, cl.prob * s3MaxW)
        // Subtle outer exp weight outline, solid inner probability share
        fig.rect(s3Left, y - 12, expW, 24, {
            fill: tint(col, c.bg, isLight ? 0.16 : 0.24),
            stroke: col,
            strokeWidth: 1.2,
            radius: 4,
        })
        fig.rect(s3Left, y - 12, probW, 24, {
            fill: col,
            radius: 4,
        })
        fig.text(s3Left + expW + 8, y - 9, `${(cl.prob * 100).toFixed(1)}%`, {
            size: 18,
            mono: true,
            weight: 750,
            color: col,
        })
        fig.text(s3Left + expW + 8, y + 12, `e=${cl.exp.toFixed(3)}`, {
            size: 15,
            mono: true,
            color: c.textSecondary,
        })
    })

    // ── Bottom stacked 100% probability strip ───────────────────────────────
    fig.line(20, 308, width - 20, 308, { color: c.borderSubtle, width: 1.1 })
    const stripX = 112
    const stripW = 708
    const stripY = 326
    const w0 = stripW * 0.844
    const w1 = stripW * 0.114
    const w2 = stripW - w0 - w1
    fig.rect(stripX, stripY, w0 - 2, 22, { fill: colors[0], radius: 4 })
    fig.rect(stripX + w0, stripY, w1 - 2, 22, { fill: colors[1], radius: 4 })
    fig.rect(stripX + w0 + w1, stripY, w2, 22, { fill: colors[2], radius: 4 })

    fig.text(stripX - 14, stripY + 11, 'Share', {
        size: 17,
        weight: 650,
        color: c.textSecondary,
        align: 'right',
    })
    // Clean evenly spaced swatches + labels below strip (zero overlap)
    const legItems = [
        { x: stripX, col: colors[0]!, txt: 'bug 84.4%' },
        { x: stripX + 260, col: colors[1]!, txt: 'docs 11.4%' },
        { x: stripX + 520, col: colors[2]!, txt: 'security 4.2%' },
    ] as const
    for (const item of legItems) {
        fig.rect(item.x, stripY + 32, 13, 13, { fill: item.col, radius: 3 })
        fig.text(item.x + 20, stripY + 39, item.txt, {
            size: 17,
            weight: 700,
            color: item.col,
        })
    }

    return fig.render()
}

export default create('dark')
