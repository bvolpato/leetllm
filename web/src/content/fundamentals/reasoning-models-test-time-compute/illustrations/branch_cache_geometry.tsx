import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 430
export const alt =
    'Baseline-aligned 8x5 KV cache page grids comparing unshared parallel sampling (N=8) with prefix sharing. Left: Unshared stores 8 duplicate 4,096-token prompt blocks (32 pages) plus 8 private 1,024-token tails (8 pages), totaling 40,960 KV slots (5.0 GiB). Right: Prefix-shared stores 1 read-only prompt block (4 pages) referenced by all 8 branches plus 8 isolated private tails (8 pages), cutting cache footprint by 70% to 12,288 KV slots (1.5 GiB).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const isDark = theme === 'dark'

    const rows = 8
    const cellW = 46
    const cellH = 26
    const gapX = 5
    const gapY = 5
    const gridW = 5 * cellW + 4 * gapX // 250px
    const gridH = rows * cellH + (rows - 1) * gapY // 243px
    const gridY = 82

    const lx = 68
    const rx = 446

    // Single-line headers aligned on the same baseline
    fig.text(lx + gridW / 2, 24, 'Unshared (N = 8)', {
        size: 15.5,
        color: red,
        align: 'center',
        weight: 700,
    })
    fig.text(lx + gridW / 2, 46, '40,960 KV slots · 5.0 GiB', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
        weight: 600,
    })

    fig.text(rx + gridW / 2, 24, 'Prefix-shared (N = 8)', {
        size: 15.5,
        color: green,
        align: 'center',
        weight: 700,
    })
    fig.text(rx + gridW / 2, 46, '12,288 KV slots · 1.5 GiB (−70%)', {
        size: 13.5,
        color: green,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Column headers P1..P4, Tail on both grids
    const colLabels = ['P1', 'P2', 'P3', 'P4', 'Tail']
    for (const gx of [lx, rx]) {
        colLabels.forEach((lbl, j) => {
            fig.text(gx + j * (cellW + gapX) + cellW / 2, gridY - 12, lbl, {
                size: 13,
                color: j === 4 ? (gx === lx ? warm : blue) : c.textSecondary,
                align: 'center',
                mono: true,
                weight: 600,
            })
        })
    }

    // ─── LEFT GRID: 8x5 Unshared (32 duplicate prompt pages + 8 tails) ───
    for (let r = 0; r < rows; r++) {
        const y = gridY + r * (cellH + gapY)
        fig.text(lx - 10, y + cellH / 2, `b${r + 1}`, {
            size: 13,
            color: c.textSecondary,
            align: 'right',
            mono: true,
            weight: 600,
        })
        for (let col = 0; col < 5; col++) {
            const x = lx + col * (cellW + gapX)
            const isTail = col === 4
            const accent = isTail ? warm : red
            fig.rect(x, y, cellW, cellH, {
                fill: tint(accent, c.bg, isDark ? 0.44 : 0.28),
                stroke: accent,
                strokeWidth: 1.4,
                radius: 4,
            })
        }
    }

    // Center savings arrow between grids
    fig.arrow(lx + gridW + 18, gridY + gridH / 2, rx - 46, gridY + gridH / 2, {
        color: green,
        width: 2.2,
        head: 7,
    })
    fig.text((lx + gridW + rx - 28) / 2, gridY + gridH / 2 - 18, '−70%', {
        size: 14.5,
        color: green,
        align: 'center',
        mono: true,
        weight: 800,
    })

    // ─── RIGHT GRID: Baseline-aligned 8x5 Prefix-Shared (1 shared prompt row + 8 private tails) ───
    // Freed memory zone across rows 1..7, cols 0..3
    const freedW = 4 * cellW + 3 * gapX
    const freedY = gridY + (cellH + gapY)
    const freedH = 7 * cellH + 6 * gapY
    fig.rect(rx, freedY, freedW, freedH, {
        fill: tint(green, c.bg, isDark ? 0.08 : 0.06),
        stroke: c.borderLight,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(rx + freedW / 2, freedY + freedH / 2 - 10, '28 prompt pages freed', {
        size: 14,
        color: green,
        align: 'center',
        weight: 700,
    })
    fig.text(rx + freedW / 2, freedY + freedH / 2 + 12, 'b2..b8 point to shared P1..P4', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Upward dashed read-reference arrows inside freed zone pointing to shared row 0
    for (const col of [0, 1, 2, 3]) {
        const cx = rx + col * (cellW + gapX) + cellW / 2
        fig.arrow(cx, freedY + 46, cx, gridY + cellH + 4, {
            color: green,
            width: 1.5,
            dash: '3 3',
            head: 5,
            opacity: 0.8,
        })
    }

    for (let r = 0; r < rows; r++) {
        const y = gridY + r * (cellH + gapY)
        fig.text(rx - 10, y + cellH / 2, `b${r + 1}`, {
            size: 13,
            color: r === 0 ? green : c.textSecondary,
            align: 'right',
            mono: true,
            weight: r === 0 ? 700 : 600,
        })

        // Row 0 cols 0..3: Shared read-only prompt pages
        if (r === 0) {
            for (let col = 0; col < 4; col++) {
                const x = rx + col * (cellW + gapX)
                fig.rect(x, y, cellW, cellH, {
                    fill: tint(green, c.bg, isDark ? 0.48 : 0.3),
                    stroke: green,
                    strokeWidth: 1.7,
                    radius: 4,
                })
                fig.text(x + cellW / 2, y + cellH / 2, 'RO', {
                    size: 12.5,
                    color: isDark ? '#ffffff' : c.textPrimary,
                    align: 'center',
                    mono: true,
                    weight: 700,
                })
            }
        }

        // Col 4 across all 8 rows: Private isolated tails
        const tailX = rx + 4 * (cellW + gapX)
        fig.rect(tailX, y, cellW, cellH, {
            fill: tint(blue, c.bg, isDark ? 0.46 : 0.3),
            stroke: blue,
            strokeWidth: 1.5,
            radius: 4,
        })
    }

    // Bottom dimension braces aligned on exact same y baseline
    const braceY = gridY + gridH + 12
    fig.brace(lx, braceY, lx + freedW, braceY, '8 × 4,096 prompt', {
        side: 1,
        depth: 9,
        color: red,
        labelColor: red,
        labelSize: 13,
        weight: 600,
    })
    fig.brace(lx + 4 * (cellW + gapX), braceY, lx + gridW, braceY, '8 × 1k', {
        side: 1,
        depth: 9,
        color: warm,
        labelColor: warm,
        labelSize: 13,
        weight: 600,
    })

    fig.brace(rx, braceY, rx + freedW, braceY, '1 × 4,096 shared RO', {
        side: 1,
        depth: 9,
        color: green,
        labelColor: green,
        labelSize: 13,
        weight: 700,
    })
    fig.brace(rx + 4 * (cellW + gapX), braceY, rx + gridW, braceY, '8 × 1k', {
        side: 1,
        depth: 9,
        color: blue,
        labelColor: blue,
        labelSize: 13,
        weight: 700,
    })

    // Compact bottom summary line
    fig.text(width / 2, 404, '40 pages (8 copies + 8 tails)  →  12 pages (1 shared prompt + 8 private tails)', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create('dark')
