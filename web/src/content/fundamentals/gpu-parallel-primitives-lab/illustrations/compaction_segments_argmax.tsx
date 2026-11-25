import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'Top band shows stream compaction keeping positive elements of [3, -1, 4, 1, 5, -9, 2, 6] at exclusive scan offsets [0, 1, 1, 2, 3, 4, 4, 5] into compacted output [3, 4, 1, 5, 2, 6]. Bottom left shows segmented reduction over half-open ranges [0, 4) = 7, [4, 4) = 0, and [4, 8) = 4. Bottom right shows argmax returning (6, 7) and tie-breaking [6, -1, 6] to (6, 0).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // === Top Band: Stream Compaction ===
    fig.text(24, 20, '1. Stream compaction: predicate -> exclusive scan -> scatter', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const vals = [3, -1, 4, 1, 5, -9, 2, 6]
    const keeps = vals.map((v) => (v > 0 ? 1 : 0))
    const offs = [0, 1, 1, 2, 3, 4, 4, 5]
    const kept = vals.filter((v) => v > 0) // [3, 4, 1, 5, 2, 6]

    const startX = 112
    const cw = 72
    const gap = 6
    const yIn = 42
    const yKeep = 78
    const yOff = 110
    const yOut = 166

    fig.text(24, yIn + 15, 'Input x', { size: 12.5, weight: 700, color: c.textPrimary })
    fig.text(24, yKeep + 13, 'keep (x>0)', { size: 12, weight: 600, color: green })
    fig.text(24, yOff + 13, 'exc. scan', { size: 12, weight: 600, color: purple })
    fig.text(24, yOut + 15, 'Compact', { size: 12.5, weight: 700, color: green })

    vals.forEach((v, i) => {
        const x = startX + i * (cw + gap)
        const k = keeps[i] === 1
        // Input cell
        fig.rect(x, yIn, cw, 30, {
            fill: tint(k ? blue : c.textMuted, c.bg, isLight ? (k ? 0.14 : 0.08) : k ? 0.24 : 0.14),
            stroke: k ? blue : c.borderSubtle,
            strokeWidth: k ? 1.4 : 1,
            radius: 5,
        })
        fig.text(x + cw / 2, yIn + 15, `${v}`, {
            size: 13,
            weight: k ? 700 : 500,
            color: k ? c.textPrimary : c.textMuted,
            align: 'center',
            mono: true,
        })

        // Keep flag cell
        fig.rect(x, yKeep, cw, 26, {
            fill: tint(k ? green : c.textMuted, c.bg, isLight ? (k ? 0.18 : 0.07) : k ? 0.3 : 0.12),
            stroke: k ? green : c.borderSubtle,
            strokeWidth: k ? 1.3 : 1,
            radius: 4,
        })
        fig.text(x + cw / 2, yKeep + 13, `${keeps[i]}`, {
            size: 12.5,
            weight: k ? 700 : 500,
            color: k ? green : c.textMuted,
            align: 'center',
            mono: true,
        })

        // Exclusive scan offset cell
        fig.rect(x, yOff, cw, 26, {
            fill: tint(k ? purple : c.textMuted, c.bg, isLight ? (k ? 0.14 : 0.06) : k ? 0.24 : 0.1),
            stroke: k ? purple : c.borderSubtle,
            strokeWidth: 1,
            radius: 4,
        })
        fig.text(x + cw / 2, yOff + 13, `${offs[i]}`, {
            size: 12.5,
            weight: k ? 700 : 500,
            color: k ? purple : c.textMuted,
            align: 'center',
            mono: true,
        })

        // Scatter arrow into compacted destination
        if (k) {
            const destX = startX + offs[i] * (cw + gap) + cw / 2
            fig.arrow(x + cw / 2, yOff + 28, destX, yOut - 3, {
                color: green,
                width: 1.5,
                head: 5,
            })
        }
    })

    // Compacted output strip (6 elements)
    kept.forEach((v, i) => {
        const x = startX + i * (cw + gap)
        fig.rect(x, yOut, cw, 30, {
            fill: tint(green, c.bg, isLight ? 0.22 : 0.36),
            stroke: green,
            strokeWidth: 1.6,
            radius: 5,
        })
        fig.text(x + cw / 2, yOut + 15, `${v}`, {
            size: 13.5,
            weight: 700,
            color: green,
            align: 'center',
            mono: true,
        })
    })
    fig.text(startX + 6 * (cw + gap) + 10, yOut + 15, 'len = 6', {
        size: 12.5,
        weight: 700,
        color: green,
        mono: true,
    })

    // Horizontal divider
    fig.line(24, 218, width - 24, 218, { color: c.borderSubtle, width: 1 })
    // Vertical divider for bottom two bands
    fig.line(412, 232, 412, height - 18, { color: c.borderSubtle, width: 1 })

    // === Bottom Left: Segmented Reduction ===
    fig.text(24, 240, '2. Segmented reduction  (offsets [0, 4, 4, 8])', {
        size: 14,
        weight: 700,
        color: blue,
    })

    const segX = 24
    const segW = 42
    const segGap = 4
    const segY = 266
    vals.forEach((v, i) => {
        const x = segX + i * (segW + segGap)
        const isFirst = i < 4
        const col = isFirst ? blue : purple
        fig.rect(x, segY, segW, 30, {
            fill: tint(col, c.bg, isLight ? 0.16 : 0.28),
            stroke: col,
            strokeWidth: 1.3,
            radius: 4,
        })
        fig.text(x + segW / 2, segY + 15, `${v}`, {
            size: 12.5,
            weight: 700,
            color: col,
            align: 'center',
            mono: true,
        })
    })

    // Braces for [0,4) and [4,8) + empty [4,4) callout at boundary
    const seg1End = segX + 4 * segW + 3 * segGap
    const seg2Start = segX + 4 * (segW + segGap)
    const seg2End = segX + 8 * segW + 7 * segGap

    fig.brace(segX, segY + 36, seg1End, segY + 36, '[0, 4) -> sum 7', {
        side: 1,
        depth: 7,
        color: blue,
        labelColor: blue,
        labelSize: 12,
        labelGap: 14,
    })
    fig.brace(seg2Start, segY + 36, seg2End, segY + 36, '[4, 8) -> sum 4', {
        side: 1,
        depth: 7,
        color: purple,
        labelColor: purple,
        labelSize: 12,
        labelGap: 14,
    })

    // Empty segment callout at index 4
    const mid4 = (seg1End + seg2Start) / 2
    fig.line(mid4, segY - 6, mid4, segY + 34, { color: warm, width: 2, dash: '3 2' })
    fig.text(24, 382, 'Empty range [4, 4) returns identity 0 without reading memory.', {
        size: 12,
        weight: 600,
        color: warm,
    })

    // === Bottom Right: Argmax (value, index) ===
    const ax = 434
    fig.text(ax, 240, '3. Argmax  (value, index) monoid', {
        size: 14,
        weight: 700,
        color: green,
    })

    // Row 1: unique max
    fig.rect(ax, 266, 186, 34, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.1 : 0.18),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 5,
    })
    fig.text(ax + 93, 283, '[3,-1,4,1,5,-9,2,6]', {
        size: 11.5,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.arrow(ax + 190, 283, ax + 214, 283, { color: green, width: 1.8, head: 5 })
    fig.rect(ax + 218, 266, 86, 34, {
        fill: tint(green, c.bg, isLight ? 0.2 : 0.34),
        stroke: green,
        strokeWidth: 1.6,
        radius: 5,
    })
    fig.text(ax + 261, 283, '(6, idx 7)', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // Row 2: tie break
    fig.rect(ax, 316, 186, 34, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.1 : 0.18),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 5,
    })
    fig.text(ax + 93, 333, '[6, -1, 6] (tie 0 & 2)', {
        size: 11.5,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.arrow(ax + 190, 333, ax + 214, 333, { color: warm, width: 1.8, head: 5 })
    fig.rect(ax + 218, 316, 86, 34, {
        fill: tint(warm, c.bg, isLight ? 0.2 : 0.34),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 5,
    })
    fig.text(ax + 261, 333, '(6, idx 0)', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    fig.text(ax, 382, 'Smaller index breaks value ties deterministically.', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
