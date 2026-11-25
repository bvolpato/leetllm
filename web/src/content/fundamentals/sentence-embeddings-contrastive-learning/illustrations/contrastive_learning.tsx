import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 375
export const alt =
    'Aligned cosine similarity and InfoNCE negative gradient-share bars for query "How does RoPE encode token position?". Left bars plot cosine scores on [0, 1]: RoPE guide positive 0.91, absolute-position hard negative 0.42 (gap 0.49), and NF4 easy negative 0.11 (gap 0.80). Right aligned bars show each negative\'s share of softmax gradient pressure at temperature tau = 0.10: the hard negative absorbs 95.7% (22x stronger) while the easy negative draws 4.3%.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')

    // Query header
    fig.text(28, 22, 'Query: "How does RoPE encode token position?"', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // Exact softmax negative share at tau = 0.10:
    // exp(4.2) / (exp(4.2) + exp(1.1)) = 1 / (1 + exp(-3.1)) = 0.95689 -> 95.7% vs 4.3%
    const rows = [
        {
            name: 'RoPE guide',
            role: 'positive',
            cos: 0.91,
            gap: 'anchor',
            gradShare: null as number | null,
            gradText: 'pull +',
            color: green,
        },
        {
            name: 'Abs pos bias',
            role: 'hard neg',
            cos: 0.42,
            gap: 'Δ = 0.49',
            gradShare: 95.7,
            gradText: '95.7%',
            color: warm,
        },
        {
            name: 'NF4 quant',
            role: 'easy neg',
            cos: 0.11,
            gap: 'Δ = 0.80',
            gradShare: 4.3,
            gradText: '4.3%',
            color: blue,
        },
    ]

    // --- Left axis: Cosine similarity [0, 1] ---
    const lX0 = 154
    const lX1 = 414
    const lx = (v: number) => lX0 + v * (lX1 - lX0)
    const axisTop = 82
    const axisBot = 294

    fig.text(lX0, 58, 'Cosine similarity s(q, d)', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
    })

    for (const t of [0, 0.25, 0.5, 0.75, 1.0]) {
        const tx = lx(t)
        fig.line(tx, axisTop, tx, axisBot, {
            color: t === 0 ? c.textMuted : c.borderSubtle,
            width: t === 0 ? 1.5 : 1,
            dash: t === 0 ? undefined : '3 3',
        })
        fig.text(tx, axisBot + 16, t.toFixed(2), {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Reference dashed line down from positive score 0.91 to show cosine gaps visually!
    const posX = lx(0.91)
    fig.line(posX, 114, posX, axisBot, { color: green, width: 1.25, dash: '4 3', opacity: 0.75 })

    // --- Right axis: Negative gradient share (%) at tau = 0.10 ---
    const rX0 = 492
    const rX1 = 690
    const rx = (pct: number) => rX0 + (pct / 100) * (rX1 - rX0)

    fig.text(rX0, 58, 'Negative grad share (P_j / τ)', {
        size: 13,
        weight: 700,
        color: purple,
    })

    for (const pct of [0, 50, 100]) {
        const tx = rx(pct)
        fig.line(tx, axisTop, tx, axisBot, {
            color: pct === 0 ? c.textMuted : c.borderSubtle,
            width: pct === 0 ? 1.5 : 1,
            dash: pct === 0 ? undefined : '3 3',
        })
        fig.text(tx, axisBot + 16, `${pct}%`, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    rows.forEach((row, idx) => {
        const cy = 118 + idx * 72
        const barH = 26

        // Left row label
        fig.text(lX0 - 12, cy - 8, row.name, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'right',
        })
        fig.text(lX0 - 12, cy + 10, row.role, {
            size: 12,
            weight: 600,
            color: row.color,
            align: 'right',
        })

        // Left cosine bar
        const w = lx(row.cos) - lX0
        fig.rect(lX0, cy - barH / 2, w, barH, {
            fill: tint(row.color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: row.color,
            strokeWidth: 1.4,
            radius: 4,
        })
        fig.text(lX0 + w + 8, cy, row.cos.toFixed(2), {
            size: 13,
            weight: 700,
            color: row.color,
            mono: true,
        })

        // Gap span indicator from negative bar end to positive 0.91 line
        if (idx > 0) {
            const gapStart = lX0 + w + 42
            if (posX - gapStart > 28) {
                fig.line(gapStart, cy, posX - 4, cy, {
                    color: c.textMuted,
                    width: 1.25,
                    dash: '3 3',
                })
                fig.text((gapStart + posX) / 2, cy - 12, row.gap, {
                    size: 11,
                    color: c.textSecondary,
                    align: 'center',
                    mono: true,
                })
            }
        }

        // Right gradient-share bar
        if (row.gradShare !== null) {
            const gw = Math.max(8, rx(row.gradShare) - rX0)
            fig.rect(rX0, cy - barH / 2, gw, barH, {
                fill: tint(row.color, c.bg, theme === 'light' ? 0.78 : 0.86),
                stroke: row.color,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(rX0 + gw + 8, cy, row.gradText, {
                size: 13,
                weight: 700,
                color: row.color,
                mono: true,
            })
        } else {
            fig.text(rX0 + 8, cy, 'target (pull toward q)', {
                size: 12,
                weight: 600,
                color: green,
            })
        }
    })

    // Bottom math summary
    fig.text(
        380,
        348,
        'At τ = 0.10, hard negative (0.42) receives 22× more push-away gradient than easy negative (0.11)',
        {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create
