import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'A 1,000-token prompt splits into 600 cached prefix tokens and 400 uncached tokens evaluated in 0.2 s. Using only the 400 uncached tokens gives 2,000 tok/s, whereas dividing all 1,000 tokens overstates throughput at 5,000 tok/s. Output generation computes separately at 80 tokens in 2 s (40 tok/s) alongside client TTFT and inter-token timestamps.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('red')

    // === Band 1: Prompt split (1,000 tokens = 600 cached + 400 uncached) ===
    fig.text(24, 22, '1. Prompt split: 1,000 total tokens', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(width - 24, 22, 'Uncached prefill time = 0.20 s', {
        size: 13,
        weight: 600,
        color: warm,
        align: 'right',
        mono: true,
    })

    const bx = 24
    const by = 40
    const bw = 712
    const bh = 38
    const cachedW = bw * 0.6
    const uncachedW = bw - cachedW - 4

    fig.rect(bx, by, cachedW, bh, {
        fill: tint(blue, c.bg, isLight ? 0.16 : 0.28),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(bx + cachedW / 2, by + bh / 2, '600 cached prefix tokens (KV reused)', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })

    fig.rect(bx + cachedW + 4, by, uncachedW, bh, {
        fill: tint(warm, c.bg, isLight ? 0.2 : 0.34),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(bx + cachedW + 4 + uncachedW / 2, by + bh / 2, '400 uncached (evaluated in 0.2 s)', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })

    fig.brace(bx, by + bh + 6, bx + cachedW, by + bh + 6, 'Zero forward compute', {
        side: 1,
        depth: 7,
        color: c.textMuted,
        labelColor: c.textSecondary,
        labelSize: 12,
        labelGap: 14,
    })
    fig.brace(
        bx + cachedW + 4,
        by + bh + 6,
        bx + bw,
        by + bh + 6,
        'Numerator for prefill tok/s',
        {
            side: 1,
            depth: 7,
            color: warm,
            labelColor: warm,
            labelSize: 12,
            labelGap: 14,
        },
    )

    // === Band 2: Prefill throughput distortion (2,000 valid vs 5,000 overcounted) ===
    const sep1 = 128
    fig.line(24, sep1, width - 24, sep1, { color: c.borderSubtle, width: 1 })
    fig.text(24, sep1 + 20, '2. Prefill throughput: valid vs overcounted', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 182
    const maxW = 310

    // Valid bar (2,000 / 5,000 = 40%)
    const r1Y = sep1 + 42
    fig.text(24, r1Y + 13, 'Valid (uncached)', { size: 13, weight: 700, color: blue })
    fig.rect(barX, r1Y, maxW * 0.4, 26, {
        fill: tint(blue, c.bg, isLight ? 0.24 : 0.38),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + maxW * 0.4 + 10, r1Y + 13, '400 / 0.2 s = 2,000 tok/s', {
        size: 13,
        weight: 700,
        color: blue,
        mono: true,
    })

    // Overcounted bar (5,000 / 5,000 = 100%)
    const r2Y = sep1 + 80
    fig.text(24, r2Y + 13, 'Overcounted (all)', { size: 13, weight: 700, color: red })
    fig.rect(barX, r2Y, maxW, 26, {
        fill: tint(red, c.bg, isLight ? 0.16 : 0.28),
        stroke: red,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + maxW + 10, r2Y + 13, '1,000 / 0.2 s = 5,000 (2.5×)', {
        size: 13,
        weight: 700,
        color: red,
        mono: true,
    })

    // === Band 3: Separate decode clock & client streaming timeline ===
    const sep2 = 258
    fig.line(24, sep2, width - 24, sep2, { color: c.borderSubtle, width: 1 })
    fig.text(24, sep2 + 20, '3. Decode clock & client token-arrival timeline', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(width - 24, sep2 + 20, 'Decode: 80 tok / 2.0 s = 40 tok/s (25 ms ITL)', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    const tlX = 48
    const tlY = sep2 + 84
    const tlW = 664
    const ttftW = 86 // 0.2s / 2.2s ~ 9% (slightly widened for legibility)

    // Baseline time axis
    fig.arrow(tlX, tlY, tlX + tlW + 14, tlY, { color: c.textMuted, width: 1.4, head: 5 })

    // TTFT span
    fig.rect(tlX, tlY - 14, ttftW, 28, {
        fill: tint(warm, c.bg, isLight ? 0.2 : 0.34),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 4,
    })
    fig.text(tlX + ttftW / 2, tlY, 'TTFT', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(tlX + ttftW / 2, tlY - 26, '0.2 s', {
        size: 11.5,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Decode token ticks (representative ticks across 2.0 s)
    const decStart = tlX + ttftW + 10
    const decEnd = tlX + tlW - 8
    const ticks = 16
    for (let i = 0; i <= ticks; i++) {
        const tx = decStart + (i / ticks) * (decEnd - decStart)
        fig.line(tx, tlY - 11, tx, tlY + 11, {
            color: i === 0 ? purple : green,
            width: i === 0 ? 2.4 : 1.8,
        })
    }

    // Highlight first token + ITL gap
    fig.text(decStart, tlY - 26, 'tok 1', {
        size: 12,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })
    fig.text(decEnd, tlY - 26, 'tok 80', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // ITL bracket between tick 3 and 4
    const t3 = decStart + (3 / ticks) * (decEnd - decStart)
    const t4 = decStart + (4 / ticks) * (decEnd - decStart)
    fig.brace(t3, tlY - 14, t4, tlY - 14, 'ITL gap', {
        side: -1,
        depth: 6,
        color: purple,
        labelColor: purple,
        labelSize: 12,
        labelGap: 14,
    })

    // Full decode span brace below
    fig.brace(decStart, tlY + 16, decEnd, tlY + 16, '80 output tokens over 2.0 s -> 40 tok/s (separate from prefill)', {
        side: 1,
        depth: 8,
        color: green,
        labelColor: green,
        labelSize: 12.5,
        labelGap: 16,
    })

    return fig.render()
}

export default create('dark')
