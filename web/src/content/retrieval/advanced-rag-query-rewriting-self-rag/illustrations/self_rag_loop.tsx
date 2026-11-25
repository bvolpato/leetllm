import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 456
export const alt =
    'A retrieved approval clause states that temporary tokens-per-minute increases require approval. With critique weights 0.2 relevance, 0.6 support, and 0.2 utility, stacked weighted bars on a shared 0 to 1 scale show Candidate A (following the approval clause) totaling 0.922 (0.184 + 0.576 + 0.162) versus Candidate B (claiming unlimited launch traffic) totaling 0.534 (0.190 + 0.168 + 0.176). Below, component deltas show Candidate A gains +0.408 on support while trailing by only 0.020 on relevance and utility combined, yielding a +0.388 net lead.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    // ── Top: Retrieved Approval Clause Strip (no heavy box, soft accent rule) ─
    fig.rect(20, 14, 4, 42, { fill: blue, radius: 2 })
    fig.text(34, 24, 'Retrieved Approval Clause', { size: 13, weight: 700, color: blue })
    fig.text(34, 45, '"Temporary tokens-per-minute increases require approval."', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(width - 20, 24, 'Weights: (0.2, 0.6, 0.2)', {
        size: 13,
        mono: true,
        weight: 700,
        color: c.textSecondary,
        align: 'right',
    })

    // Compact legend
    const legY = 78
    const legItems = [
        { x: 20, color: blue, label: 'Relevance (w = 0.2)' },
        { x: 196, color: green, label: 'Support (w = 0.6)' },
        { x: 356, color: purple, label: 'Utility (w = 0.2)' },
    ] as const
    for (const item of legItems) {
        fig.rect(item.x, legY - 5, 12, 12, { fill: item.color, radius: 3 })
        fig.text(item.x + 18, legY + 1, item.label, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
        })
    }

    // ── Middle: Shared 0..1 Stacked Weighted Critique Bars ───────────────────
    const barX = 166
    const barW = 472
    const valX = barX + barW + 14

    // Subtle vertical scale gridlines (0, 0.25, 0.50, 0.75, 1.0)
    const scaleTop = 104
    const scaleBot = 276
    for (const tick of [0, 0.25, 0.5, 0.75, 1.0]) {
        const gx = barX + tick * barW
        fig.line(gx, scaleTop, gx, scaleBot, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.25 : 1,
            dash: tick === 0 ? undefined : '3 4',
        })
        fig.text(gx, scaleBot + 14, tick.toFixed(2).replace(/\.00$/, '.0'), {
            size: 12,
            mono: true,
            color: c.textMuted,
            align: tick === 0 ? 'left' : tick === 1 ? 'right' : 'center',
        })
    }

    const candidates = [
        {
            y: 118,
            name: 'Candidate A',
            quote: 'Requires approval',
            vals: [0.184, 0.576, 0.162] as const,
            total: 0.922,
            accent: green,
            winner: true,
        },
        {
            y: 204,
            name: 'Candidate B',
            quote: 'Claims unlimited',
            vals: [0.19, 0.168, 0.176] as const,
            total: 0.534,
            accent: warm,
            winner: false,
        },
    ] as const

    const segColors = [blue, green, purple] as const

    for (const cand of candidates) {
        const barH = 34
        fig.text(20, cand.y + 8, cand.name, { size: 15, weight: 700, color: cand.accent })
        fig.text(20, cand.y + 28, cand.quote, { size: 13, color: c.textSecondary })

        // Track background
        fig.rect(barX, cand.y, barW, barH, {
            fill: tint(c.border, c.bg, 0.25),
            radius: 5,
        })

        // Stacked segments
        let off = 0
        cand.vals.forEach((v, idx) => {
            const w = v * barW
            fig.rect(barX + off, cand.y, Math.max(2, w - 1), barH, {
                fill: segColors[idx],
                opacity: idx === 1 ? 0.92 : 0.78,
                radius: idx === 0 || idx === 2 ? 4 : 1,
            })
            if (w >= 54) {
                fig.text(barX + off + w / 2, cand.y + barH / 2, v.toFixed(3), {
                    size: 12,
                    mono: true,
                    weight: 700,
                    color: c.bg,
                    align: 'center',
                })
            }
            off += w
        })

        // Total score readout
        fig.text(valX, cand.y + 11, cand.total.toFixed(3), {
            size: 17,
            mono: true,
            weight: 800,
            color: cand.accent,
        })
        fig.text(valX, cand.y + 30, cand.winner ? 'selected' : 'rejected', {
            size: 12,
            weight: 700,
            color: cand.accent,
        })

        // Exact additive breakdown right beneath the bar
        fig.text(
            barX,
            cand.y + 46,
            `${cand.vals[0].toFixed(3)} + ${cand.vals[1].toFixed(3)} + ${cand.vals[2].toFixed(3)} = ${cand.total.toFixed(3)}`,
            {
                size: 12,
                mono: true,
                color: c.textSecondary,
            },
        )
    }

    // ── Bottom: Component Margin Breakdown (A − B) ───────────────────────────
    fig.line(20, 312, width - 20, 312, { color: c.borderSubtle, width: 1 })
    fig.text(20, 332, 'Score Margin (Candidate A − Candidate B)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const zeroX = 246
    const scalePx = 430 // 0.408 -> ~175px right
    const deltas = [
        { label: 'Support (0.6)', delta: +0.408, color: green, y: 364 },
        { label: 'Relevance (0.2)', delta: -0.006, color: blue, y: 394 },
        { label: 'Utility (0.2)', delta: -0.014, color: purple, y: 424 },
    ] as const

    fig.line(zeroX, 350, zeroX, 438, { color: c.textMuted, width: 1.25 })

    for (const d of deltas) {
        fig.text(zeroX - 18, d.y, d.label, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
            align: 'right',
        })
        const w = Math.max(5, Math.abs(d.delta) * scalePx)
        const bx = d.delta >= 0 ? zeroX : zeroX - w
        fig.rect(bx, d.y - 8, w, 16, {
            fill: d.color,
            opacity: d.delta >= 0 ? 0.9 : 0.75,
            radius: 3,
        })
        fig.text(
            d.delta >= 0 ? zeroX + w + 8 : zeroX + 8,
            d.y,
            `${d.delta >= 0 ? '+' : ''}${d.delta.toFixed(3)}`,
            {
                size: 13,
                mono: true,
                weight: 700,
                color: d.delta >= 0 ? green : warm,
            },
        )
    }

    // Net lead callout on right
    const boxX = 508
    fig.rect(boxX, 354, 232, 78, {
        fill: withColorAlpha(green, 0.1),
        stroke: withColorAlpha(green, 0.55),
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(boxX + 116, 378, 'Net Lead: +0.388', {
        size: 16,
        mono: true,
        weight: 800,
        color: green,
        align: 'center',
    })
    fig.text(boxX + 116, 404, '+0.408 support − 0.020 other', {
        size: 12,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
