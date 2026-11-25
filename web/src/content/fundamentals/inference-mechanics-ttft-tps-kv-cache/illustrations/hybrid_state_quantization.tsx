import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 430
export const alt =
    'At 128 positions in an 8 GiB per-sequence-state pool, 144 MiB of recurrent state plus 8 MiB of FP16 KV totals 152 MiB. Halving only KV changes the total to 148 MiB and capacity from 53 to 55 sequences, 1.04 times. A separate KV-only 18 GB pool at 5,120 tokens per user gives 53 FP16 users and 107 8-bit users.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')

    const barX = 112
    const barW = 412

    // === Band 1: Per-sequence state at 128 tokens ===
    fig.text(24, 22, '1. Hybrid per-sequence state (128 tokens · 144 MiB fixed recurrent)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const recW = (144 / 152) * barW
    const kv16W = (8 / 152) * barW
    const kv8W = (4 / 152) * barW

    const y1 = 44
    fig.text(24, y1 + 14, 'FP16 KV', { size: 14.5, weight: 700, color: c.textPrimary })
    fig.rect(barX, y1, recW, 28, {
        fill: tint(purple, c.bg, isLight ? 0.22 : 0.36),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + recW / 2, y1 + 14, '144 MiB recurrent (unquantized)', {
        size: 14.5,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.rect(barX + recW + 2, y1, kv16W - 2, 28, {
        fill: tint(blue, c.bg, isLight ? 0.28 : 0.45),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 4,
    })
    fig.text(barX + barW + 12, y1 + 14, '152 MiB (+8 KV)', {
        size: 14.5,
        weight: 700,
        color: blue,
        mono: true,
    })

    const y2 = 82
    fig.text(24, y2 + 14, '8-bit KV', { size: 14.5, weight: 700, color: c.textPrimary })
    fig.rect(barX, y2, barW, 28, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.08 : 0.14),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 5,
    })
    fig.rect(barX, y2, recW, 28, {
        fill: tint(purple, c.bg, isLight ? 0.22 : 0.36),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + recW / 2, y2 + 14, '144 MiB recurrent (unchanged)', {
        size: 14.5,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.rect(barX + recW + 2, y2, kv8W, 28, {
        fill: tint(cyan, c.bg, isLight ? 0.3 : 0.48),
        stroke: cyan,
        strokeWidth: 1.5,
        radius: 3,
    })
    fig.text(barX + barW + 12, y2 + 14, '148 MiB (+4 KV)', {
        size: 14.5,
        weight: 700,
        color: cyan,
        mono: true,
    })

    // === Band 2: 8 GiB hybrid pool capacity ===
    const sep1 = 132
    fig.line(24, sep1, width - 24, sep1, { color: c.borderSubtle, width: 1 })
    fig.text(24, sep1 + 22, '2. Fixed 8 GiB hybrid pool capacity', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(width - 24, sep1 + 22, '53 -> 55 seqs (1.04×)', {
        size: 14.5,
        weight: 700,
        color: warm,
        align: 'right',
        mono: true,
    })

    const drawCapBar = (y: number, label: string, val: number, max: number, text: string, tone: string) => {
        fig.text(24, y + 13, label, { size: 14.5, weight: 600, color: c.textPrimary })
        fig.rect(barX, y, barW, 26, {
            fill: tint(c.textMuted, c.bg, isLight ? 0.08 : 0.14),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 5,
        })
        fig.rect(barX, y, (barW * val) / max, 26, {
            fill: tint(tone, c.bg, isLight ? 0.24 : 0.38),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(barX + barW + 12, y + 13, text, {
            size: 14.5,
            weight: 700,
            color: tone,
            mono: true,
        })
    }

    drawCapBar(sep1 + 42, 'FP16 KV', 53, 56, '53 seqs', blue)
    drawCapBar(sep1 + 78, '8-bit KV', 55, 56, '55 seqs', cyan)

    // === Band 3: 18 GB KV-only pool ===
    const sep2 = 266
    fig.line(24, sep2, width - 24, sep2, { color: c.borderSubtle, width: 1 })
    fig.text(24, sep2 + 22, '3. 18 GB KV-only pool (5,120 tok/user, no recurrent state)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    drawCapBar(sep2 + 44, 'FP16 KV', 53, 107, '53 users', blue)
    drawCapBar(sep2 + 80, '8-bit KV', 107, 107, '107 users (2.02×)', cyan)

    fig.text(24, 404, 'Halving KV doubles capacity only when KV dominates per-sequence state.', {
        size: 14.5,
        weight: 600,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
