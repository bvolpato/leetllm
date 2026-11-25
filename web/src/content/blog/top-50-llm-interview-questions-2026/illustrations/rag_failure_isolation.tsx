import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 375
export const alt =
    'Worked RAG trace: required policy P-17 is eligible and retrieved at rank 2, but is absent from selected context, which contains only irrelevant P-04. The first evidence loss is context selection.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const green = fig.tone('green')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')
    const soft = theme === 'light' ? 0.14 : 0.19

    // Three horizontal stages tracking evidence ID P-17
    const colW = 224
    const col1X = 24
    const col2X = 288
    const col3X = 552

    // Stage headers
    fig.text(col1X + colW / 2, 24, '1. Eligible corpus', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(col1X + colW / 2, 45, 'Current + caller-permitted', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.text(col2X + colW / 2, 24, '2. Top-2 retrieval', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(col2X + colW / 2, 45, 'Ranked by similarity score', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.text(col3X + colW / 2, 24, '3. Selected context', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(col3X + colW / 2, 45, 'Selector keeps rank 1 only', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Stage 1: 4 eligible document chips (2x2 grid) with P-17 highlighted
    const chips = [
        { id: 'P-04', x: col1X + 12, y: 84, hit: false },
        { id: 'P-11', x: col1X + 118, y: 84, hit: false },
        { id: 'P-17', x: col1X + 12, y: 152, hit: true },
        { id: 'P-23', x: col1X + 118, y: 152, hit: false },
    ]
    for (const ch of chips) {
        fig.rect(ch.x, ch.y, 94, 52, {
            fill: ch.hit ? tint(green, c.bg, soft) : tint(c.textMuted, c.bg, 0.08),
            stroke: ch.hit ? green : c.border,
            strokeWidth: ch.hit ? 2 : 1.2,
            radius: 8,
        })
        fig.text(ch.x + 47, ch.y + 20, ch.id, {
            size: 14.5,
            weight: 700,
            color: ch.hit ? green : c.textSecondary,
            align: 'center',
            mono: true,
        })
        fig.text(ch.x + 47, ch.y + 39, ch.hit ? 'Required' : 'Other', {
            size: 11.5,
            color: ch.hit ? green : c.textMuted,
            align: 'center',
        })
    }

    // Status pill beneath Stage 1
    fig.rect(col1X + 36, 232, 152, 28, {
        fill: tint(green, c.bg, soft),
        stroke: green,
        strokeWidth: 1,
        radius: 14,
    })
    fig.text(col1X + colW / 2, 246, 'P-17 present', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Arrow Stage 1 -> Stage 2
    fig.arrow(col1X + colW + 4, 144, col2X - 6, 144, {
        color: green,
        width: 2,
        head: 7,
    })

    // Stage 2: Ranked retrieval slots
    // Rank 1: P-04
    fig.rect(col2X + 10, 84, colW - 20, 62, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: c.border,
        strokeWidth: 1.3,
        radius: 9,
    })
    fig.text(col2X + 24, 105, '#1  P-04', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(col2X + colW - 22, 105, 'Irrelevant', {
        size: 12,
        color: c.textMuted,
        align: 'right',
    })
    fig.rect(col2X + 24, 124, 140, 10, { fill: tint(c.textMuted, c.bg, 0.16), radius: 5 })
    fig.rect(col2X + 24, 124, 118, 10, { fill: c.textMuted, radius: 5 })

    // Rank 2: P-17 (highlighted)
    fig.rect(col2X + 10, 160, colW - 20, 62, {
        fill: tint(green, c.bg, soft),
        stroke: green,
        strokeWidth: 2,
        radius: 9,
    })
    fig.text(col2X + 24, 181, '#2  P-17', {
        size: 14.5,
        weight: 700,
        color: green,
        mono: true,
    })
    fig.text(col2X + colW - 22, 181, 'Required', {
        size: 12,
        weight: 600,
        color: green,
        align: 'right',
    })
    fig.rect(col2X + 24, 200, 140, 10, { fill: tint(green, c.bg, 0.2), radius: 5 })
    fig.rect(col2X + 24, 200, 104, 10, { fill: green, radius: 5 })

    fig.rect(col2X + 36, 232, 152, 28, {
        fill: tint(green, c.bg, soft),
        stroke: green,
        strokeWidth: 1,
        radius: 14,
    })
    fig.text(col2X + colW / 2, 246, 'P-17 present', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Arrows Stage 2 -> Stage 3: P-04 passes into context, P-17 hits red cutoff
    fig.arrow(col2X + colW - 6, 115, col3X + 8, 115, {
        color: blue,
        width: 2,
        head: 7,
    })
    fig.arrow(col2X + colW - 6, 191, col3X + 8, 206, {
        color: red,
        width: 2,
        dash: '4 3',
        head: 7,
    })

    // Stage 3: Prompt window keeps #1 P-04; red cutoff line drops #2 P-17
    fig.rect(col3X + 10, 84, colW - 20, 62, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.1 : 0.14),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 9,
    })
    fig.text(col3X + colW / 2, 105, 'P-04 -> Generator', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })
    fig.text(col3X + colW / 2, 127, 'Only passage in prompt', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Red top-1 cutoff rule
    fig.line(col3X + 4, 162, col3X + colW - 4, 162, {
        color: red,
        width: 1.75,
        dash: '5 4',
    })
    fig.text(col3X + colW / 2, 174, 'Top-1 cutoff', {
        size: 11.5,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Dropped P-17 slot below cutoff
    fig.rect(col3X + 10, 188, colW - 20, 56, {
        fill: tint(red, c.bg, soft),
        stroke: red,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(col3X + colW / 2, 207, '×  P-17 dropped', {
        size: 14.5,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.text(col3X + colW / 2, 228, 'Never reaches generator', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Bottom diagnostic summary bar pointing to Stage 3
    fig.callout(
        [col3X + colW / 2, 248],
        [490, 326],
        'First evidence loss occurs at context selection',
        {
            color: red,
            labelColor: red,
            size: 14,
            weight: 700,
            bend: 0.18,
            align: 'right',
        },
    )

    return fig.render()
}

export default create('dark')
