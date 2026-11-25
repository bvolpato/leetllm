import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 420
export const alt =
    'For 100 compatible requests with a warm full-attention 1,000-token prefix and 16-token blocks, one shared run occupies 62 full blocks and the requests keep 100 private tail blocks: 162 occupied blocks instead of 6,300. At prompt lengths 1,000, 1,008, and 1,009, the aligned hit rule reuses 992, 992, and 1,008 tokens and recomputes 8, 16, and 1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const blue = fig.tone('blue')

    // --- Top: Honest proportional block count comparison (6,300 vs 162) ---
    fig.text(28, 22, '100 requests sharing a 1,000-token prefix (16-token blocks)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const barX = 166
    const barMaxW = 556
    const shareW = Math.max(18, Math.round((barMaxW * 162) / 6300))

    // Row 1: Without reuse
    const r1Y = 74
    fig.text(barX - 12, r1Y, 'Without reuse', {
        size: 14,
        weight: 600,
        color: c.textPrimary,
        align: 'right',
    })
    fig.rect(barX, r1Y - 14, barMaxW, 28, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.78 : 0.85),
        stroke: warm,
        strokeWidth: 1.25,
        radius: 5,
    })
    fig.text(barX + barMaxW - 10, r1Y, '63 × 100 = 6,300 blocks', {
        size: 13,
        weight: 700,
        color: theme === 'light' ? '#ffffff' : '#0b0c10',
        align: 'right',
        mono: true,
    })

    // Row 2: With prefix reuse
    const r2Y = 128
    fig.text(barX - 12, r2Y, 'With prefix reuse', {
        size: 14,
        weight: 600,
        color: green,
        align: 'right',
    })
    // Full-scale background track so proportion is visually unmistakable
    fig.rect(barX, r2Y - 14, barMaxW, 28, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 5,
    })
    fig.rect(barX, r2Y - 14, shareW, 28, {
        fill: tint(green, c.bg, theme === 'light' ? 0.8 : 0.88),
        stroke: green,
        strokeWidth: 1.5,
        radius: 4,
    })
    fig.text(barX + shareW + 12, r2Y, '162 blocks (62 shared + 100 private tails · −97.4%)', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
    })

    // Hairline divider (NO stray green vertical line!)
    fig.line(28, 174, 732, 174, { color: c.borderSubtle, width: 1 })

    // --- Bottom: Aligned 16-slot tail block recomputation rule ---
    fig.text(28, 200, 'Aligned hit rule · last 16-slot block', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // Mini legend right-aligned
    fig.rect(476, 194, 12, 12, { fill: warm, radius: 2 })
    fig.text(494, 200, 'Recomputed suffix', { size: 12, color: c.textSecondary })
    fig.rect(632, 194, 12, 12, { fill: tint(blue, c.bg, 0.16), stroke: c.borderLight, strokeWidth: 1, radius: 2 })
    fig.text(650, 200, 'Unused slot', { size: 12, color: c.textSecondary })

    const hitRows = [
        { prompt: '1,000 tok', reused: '992 (62 blk)', recomp: 8, note: 'recomp 8' },
        { prompt: '1,008 tok', reused: '992 (62 blk)', recomp: 16, note: 'recomp 16 (exact)' },
        { prompt: '1,009 tok', reused: '1,008 (63 blk)', recomp: 1, note: 'recomp 1' },
    ]

    const gridX = 304
    const slotW = 14
    const slotGap = 3

    hitRows.forEach((row, idx) => {
        const y = 248 + idx * 50
        fig.text(28, y, row.prompt, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
            mono: true,
        })
        fig.text(132, y, `reuse ${row.reused}`, {
            size: 13,
            color: green,
            mono: true,
        })

        // 16 individual token slots in the private tail block
        for (let s = 0; s < 16; s++) {
            const sx = gridX + s * (slotW + slotGap)
            const active = s < row.recomp
            fig.rect(sx, y - 13, slotW, 26, {
                fill: active
                    ? tint(warm, c.bg, theme === 'light' ? 0.78 : 0.86)
                    : tint(blue, c.bg, theme === 'light' ? 0.08 : 0.14),
                stroke: active ? warm : c.borderSubtle,
                strokeWidth: 1,
                radius: 3,
            })
        }

        fig.text(gridX + 16 * (slotW + slotGap) + 12, y, row.note, {
            size: 13,
            weight: 700,
            color: warm,
            mono: true,
        })
    })

    fig.text(
        380,
        396,
        'At least 1 suffix token is always recomputed to produce next-token logits',
        {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create
