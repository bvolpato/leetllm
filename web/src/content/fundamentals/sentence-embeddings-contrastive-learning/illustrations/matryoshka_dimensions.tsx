import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 415
export const alt =
    'Matryoshka representation learning showing nested prefix slices [0..32] subset of [0..128] subset of [0..768] inside one 768-dimensional embedding, taking 4.17%, 16.67%, and 100% of full float storage. Below, a calibrated joint multi-width InfoNCE loss plot shows prefix losses 0.0088 at d=2, 0.0147 at d=4, and 0.0225 at d=6 averaged to mean loss 0.0153.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    // --- Top: Nested Matryoshka Vector Slices [0..32] ⊂ [0..128] ⊂ [0..768] ---
    fig.text(32, 20, 'Nested prefix slices inside one 768-d embedding', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const vecX = 36
    const vecW = 688
    const wOf = (d: number) => (d / 768) * vecW

    // Draw nested Russian-doll style prefix bars (stacked and aligned at x=0)
    const slices = [
        {
            y: 54,
            h: 34,
            dim: 768,
            label: '[0 .. 768] · full embedding',
            pct: '100% storage',
            color: purple,
        },
        {
            y: 100,
            h: 34,
            dim: 128,
            label: '[0 .. 128]',
            pct: '16.67% storage (6× smaller)',
            color: warm,
        },
        {
            y: 146,
            h: 34,
            dim: 32,
            label: '[0..32]',
            pct: '4.17% storage (24× smaller)',
            color: blue,
        },
    ]

    // Shared ghosted full-vector footprint behind shorter prefixes
    const x32 = vecX + wOf(32)
    const x128 = vecX + wOf(128)
    for (const sl of slices) {
        const w = Math.max(28, wOf(sl.dim))
        fig.rect(vecX, sl.y, vecW, sl.h, {
            fill: tint(c.textMuted, c.bg, 0.05),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 5,
        })
        fig.rect(vecX, sl.y, w, sl.h, {
            fill: tint(sl.color, c.bg, theme === 'light' ? 0.28 : 0.38),
            stroke: sl.color,
            strokeWidth: 1.75,
            radius: 5,
        })
        if (sl.dim === 768) {
            fig.text(x128 + 14, sl.y + sl.h / 2, sl.label, {
                size: 13,
                weight: 700,
                color: c.textPrimary,
                mono: true,
            })
            fig.text(vecX + vecW - 12, sl.y + sl.h / 2, sl.pct, {
                size: 13,
                weight: 700,
                color: purple,
                align: 'right',
                mono: true,
            })
        } else if (sl.dim === 128) {
            fig.text(x32 + 10, sl.y + sl.h / 2, sl.label, {
                size: 12,
                weight: 700,
                color: c.textPrimary,
                mono: true,
            })
            fig.text(vecX + w + 14, sl.y + sl.h / 2, sl.pct, {
                size: 13,
                weight: 700,
                color: warm,
                mono: true,
            })
        } else {
            fig.text(vecX + w + 12, sl.y + sl.h / 2, `${sl.label}  ·  ${sl.pct}`, {
                size: 13,
                weight: 700,
                color: blue,
                mono: true,
            })
        }
    }

    // Vertical nesting guide lines at d=32 and d=128
    fig.line(x32, 54, x32, 184, { color: blue, width: 1.25, dash: '3 3', opacity: 0.75 })
    fig.line(x128, 54, x128, 138, { color: warm, width: 1.25, dash: '3 3', opacity: 0.75 })

    // Hairline divider
    fig.line(32, 206, 728, 206, { color: c.borderSubtle, width: 1 })

    // --- Bottom: Joint Multi-Width Prefix InfoNCE Loss (d = 2, 4, 6 -> mean 0.0153) ---
    fig.text(32, 230, 'Joint multi-width InfoNCE loss (nested widths d = 2, 4, 6)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const barLeft = 186
    const barRight = 568
    const maxL = 0.026
    const lx = (v: number) => barLeft + (v / maxL) * (barRight - barLeft)
    const bTop = 256
    const bBot = 368

    for (const tick of [0, 0.01, 0.02]) {
        const tx = lx(tick)
        fig.line(tx, bTop, tx, bBot, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.5 : 1,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(tx, bBot + 16, tick === 0 ? '0' : tick.toFixed(2), {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Mean loss vertical dashed line at 0.0153
    const meanX = lx(0.0153)
    fig.line(meanX, bTop - 4, meanX, bBot + 4, { color: green, width: 2, dash: '5 4' })
    fig.text(meanX + 8, bTop + 4, 'mean = 0.0153', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
    })

    const losses = [
        { label: 'd = 2 (coarse)', val: 0.0088, color: blue },
        { label: 'd = 4 (mid-rank)', val: 0.0147, color: warm },
        { label: 'd = 6 (full)', val: 0.0225, color: purple },
    ]
    losses.forEach((item, idx) => {
        const cy = 278 + idx * 36
        const w = lx(item.val) - barLeft
        fig.text(barLeft - 12, cy, item.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })
        fig.rect(barLeft, cy - 11, w, 22, {
            fill: tint(item.color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: item.color,
            strokeWidth: 1.4,
            radius: 4,
        })
        if (idx === 1) {
            fig.text(barLeft + w - 8, cy, item.val.toFixed(4), {
                size: 13,
                weight: 700,
                color: theme === 'light' ? '#ffffff' : '#0b0c10',
                align: 'right',
                mono: true,
            })
        } else {
            fig.text(barLeft + w + 8, cy, item.val.toFixed(4), {
                size: 13,
                weight: 700,
                color: item.color,
                mono: true,
            })
        }
    })

    // Right-side clean TeX joint-loss formula
    fig.math(658, 306, '\\mathcal{L} = \\frac{1}{3}\\sum_{m \\in \\{2,4,6\\}} \\mathcal{L}_m', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(658, 344, '= 0.0153', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create
