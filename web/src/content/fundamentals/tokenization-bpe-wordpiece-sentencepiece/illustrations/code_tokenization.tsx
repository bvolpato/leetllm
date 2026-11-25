import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 375
export const alt =
    'Aligned character spans for "rainbow" (r a i n b o w) under fixed vocabulary {rainb, rain, ##bow}. On the top greedy WordPiece track, longest-match commits to rainb (indices 0..4), leaves unmatched tail ow (no ##ow in vocabulary), and collapses the whole word to [UNK]. On the bottom valid-split track, rain (0..3) plus ##bow (4..6) covers all seven characters cleanly, but WordPiece never backtracks to find it.'

const letters = [...'rainbow']

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const isDark = theme === 'dark'

    // Compact vocabulary strip at top
    const vocabItems = ['rainb', 'rain', '##bow']
    fig.text(176, 26, 'Fixed vocabulary:', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
        weight: 600,
    })
    vocabItems.forEach((v, idx) => {
        const vx = 192 + idx * 96
        fig.rect(vx, 11, 82, 30, {
            fill: tint(purple, c.bg, isDark ? 0.22 : 0.14),
            stroke: purple,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(vx + 41, 26, v, {
            size: 14,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })
    })

    // Character ruler: r a i n b o w
    const startX = 166
    const cellW = 54
    const gap = 4
    const stride = cellW + gap
    const charY = 74
    const charH = 44

    // Subtle vertical character-boundary alignment guides across both tracks
    for (let i = 0; i <= letters.length; i++) {
        const gx = startX + i * stride - gap / 2
        fig.line(gx, charY + charH + 4, gx, 336, {
            color: c.borderSubtle,
            width: 1,
            dash: '3 4',
            opacity: 0.6,
        })
    }

    fig.text(startX - 16, charY + charH / 2, 'Input word', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
        weight: 600,
    })

    letters.forEach((ch, i) => {
        const x = startX + i * stride
        fig.rect(x, charY, cellW, charH, {
            fill: tint(c.textPrimary, c.bg, isDark ? 0.08 : 0.05),
            stroke: c.borderLight,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(x + cellW / 2, charY + charH / 2, ch, {
            size: 18,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })
    })

    // ─── TRACK 1: Greedy WordPiece (actual output -> [UNK]) ───
    const gY = 152
    const spanH = 44
    fig.text(startX - 16, gY + spanH / 2 - 9, 'Greedy match', {
        size: 14,
        color: red,
        align: 'right',
        weight: 700,
    })
    fig.text(startX - 16, gY + spanH / 2 + 10, '(no backtrack)', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    // Span 0..4 = "rainb"
    const rainbW = 5 * cellW + 4 * gap
    fig.rect(startX, gY, rainbW, spanH, {
        fill: tint(warm, c.bg, isDark ? 0.34 : 0.22),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(startX + rainbW / 2, gY + spanH / 2, 'rainb  (longest prefix ✓)', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Span 5..6 = "ow" -> missing ##ow
    const owX = startX + 5 * stride
    const owW = 2 * cellW + gap
    fig.rect(owX, gY, owW, spanH, {
        fill: tint(red, c.bg, isDark ? 0.28 : 0.18),
        stroke: red,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(owX + owW / 2, gY + spanH / 2, 'no ##ow ✗', {
        size: 13.5,
        color: red,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Arrow to [UNK]
    const outX = 616
    fig.arrow(owX + owW + 8, gY + spanH / 2, outX - 6, gY + spanH / 2, {
        color: red,
        width: 2,
        head: 6,
    })
    fig.rect(outX, gY, 84, spanH, {
        fill: tint(red, c.bg, isDark ? 0.42 : 0.26),
        stroke: red,
        strokeWidth: 2,
        radius: 6,
    })
    fig.text(outX + 42, gY + spanH / 2, '[UNK]', {
        size: 15,
        color: isDark ? '#ffffff' : red,
        align: 'center',
        mono: true,
        weight: 800,
    })

    // Brace showing failure collapse
    fig.brace(startX, gY + spanH + 8, owX + owW, gY + spanH + 8, 'Commits to rainb → whole word fails', {
        side: 1,
        depth: 9,
        color: red,
        labelColor: red,
        labelSize: 13,
        weight: 600,
    })

    // ─── TRACK 2: Valid split in vocab (never explored) ───
    const vY = 266
    fig.text(startX - 16, vY + spanH / 2 - 9, 'Valid split', {
        size: 14,
        color: green,
        align: 'right',
        weight: 700,
    })
    fig.text(startX - 16, vY + spanH / 2 + 10, '(never tried)', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    // Span 0..3 = "rain"
    const rainW = 4 * cellW + 3 * gap
    fig.rect(startX, vY, rainW, spanH, {
        fill: tint(green, c.bg, isDark ? 0.34 : 0.22),
        stroke: green,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(startX + rainW / 2, vY + spanH / 2, 'rain ✓', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Span 4..6 = "##bow"
    const bowX = startX + 4 * stride
    const bowW = 3 * cellW + 2 * gap
    fig.rect(bowX, vY, bowW, spanH, {
        fill: tint(green, c.bg, isDark ? 0.34 : 0.22),
        stroke: green,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(bowX + bowW / 2, vY + spanH / 2, '##bow ✓', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Arrow to valid 2-piece output
    fig.arrow(bowX + bowW + 8, vY + spanH / 2, outX - 6, vY + spanH / 2, {
        color: green,
        width: 2,
        head: 6,
        dash: '4 3',
    })
    fig.rect(outX, vY, 84, spanH, {
        fill: tint(green, c.bg, isDark ? 0.26 : 0.16),
        stroke: green,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(outX + 42, vY + spanH / 2, '2 tokens', {
        size: 13.5,
        color: green,
        align: 'center',
        mono: true,
        weight: 700,
    })

    fig.brace(startX, vY + spanH + 8, bowX + bowW, vY + spanH + 8, 'Exact cover in vocabulary, unreachable greedily', {
        side: 1,
        depth: 9,
        color: green,
        labelColor: green,
        labelSize: 13,
        weight: 600,
    })

    return fig.render()
}

export default create('dark')
