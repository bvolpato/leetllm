import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Why vision transformers require 2D position embeddings. Left: shuffling four street-scene patches (A, B, C, D) leaves the unordered token bag identical without position tags. Middle: resizing a 3x3 grid to 3x4 splits 1D flat indices 3, 4, 5 across two rows, whereas 2D bicubic interpolation keeps row 1 aligned. Right: 2D-RoPE rotates row dimensions by y*theta and column dimensions by x*theta so attention depends on relative offsets (dy, dx).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const red = fig.tone('red')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    const fill = (col: string, strong = false) =>
        tint(col, c.bg, isLight ? (strong ? 0.24 : 0.14) : strong ? 0.4 : 0.24)
    const emptyFill = isLight ? '#eeeae0' : '#1b202c'
    const emptyStroke = isLight ? '#c8c2b4' : '#3a4256'

    // =========================================================================
    // Column 1: Why order matters (0 .. 226)
    // =========================================================================
    const c1Mid = 112
    fig.text(c1Mid, 22, '1. Why order matters', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(c1Mid, 43, 'Same 4 patches, two scenes', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const draw2x2 = (
        x: number,
        y: number,
        cells: readonly { tag: string; color: string }[],
        caption: string,
    ) => {
        const s = 34
        const gap = 4
        cells.forEach((cell, i) => {
            const r = Math.floor(i / 2)
            const col = i % 2
            const cx = x + col * (s + gap)
            const cy = y + r * (s + gap)
            fig.rect(cx, cy, s, s, {
                fill: fill(cell.color, true),
                stroke: cell.color,
                strokeWidth: 1.5,
                radius: 5,
            })
            fig.text(cx + s / 2, cy + s / 2, cell.tag, {
                size: 13.5,
                weight: 700,
                color: cell.color,
                align: 'center',
                mono: true,
            })
        })
        fig.text(x + s + gap / 2, y + 2 * s + gap + 16, caption, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
    }

    draw2x2(
        18,
        118,
        [
            { tag: 'A', color: blue },
            { tag: 'B', color: red },
            { tag: 'C', color: green },
            { tag: 'D', color: warm },
        ],
        'Original',
    )
    fig.arrow(98, 154, 124, 154, { color: warm, width: 1.8, head: 6 })
    draw2x2(
        132,
        118,
        [
            { tag: 'D', color: warm },
            { tag: 'B', color: red },
            { tag: 'A', color: blue },
            { tag: 'C', color: green },
        ],
        'Shuffled',
    )

    fig.rect(24, 246, 176, 30, {
        fill: fill(warm, false),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 15,
    })
    fig.text(c1Mid, 261, 'Identical patch bag', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(c1Mid, 306, 'Self-attention is', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(c1Mid, 324, 'permutation-equivariant', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.line(226, 22, 226, height - 22, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // Column 2: 1D flat wrap vs 2D resize (226 .. 528)
    // =========================================================================
    const c2Mid = 378
    fig.text(c2Mid, 22, '2. Resizing 3×3 → 3×4', {
        size: 14.5,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(c2Mid, 43, 'Row 1 tokens [3, 4, 5] under 1D vs 2D', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Source 3x3 grid on left of Col 2
    const srcX = 244
    const srcY = 140
    const s3 = 26
    const g3 = 3
    for (let r = 0; r < 3; r++) {
        for (let col = 0; col < 3; col++) {
            const idx = r * 3 + col
            const isRow1 = r === 1
            const cx = srcX + col * (s3 + g3)
            const cy = srcY + r * (s3 + g3)
            fig.rect(cx, cy, s3, s3, {
                fill: isRow1 ? fill(blue, true) : emptyFill,
                stroke: isRow1 ? blue : emptyStroke,
                strokeWidth: isRow1 ? 1.6 : 1,
                radius: 4,
            })
            fig.text(cx + s3 / 2, cy + s3 / 2, String(idx), {
                size: 12,
                weight: isRow1 ? 700 : 500,
                color: isRow1 ? blue : c.textMuted,
                align: 'center',
                mono: true,
            })
        }
    }
    fig.text(srcX + (3 * s3 + 2 * g3) / 2, srcY + 3 * s3 + 20, '3×3 source', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // Branch arrows to 1D fail (top right) and 2D ok (bottom right)
    const dstX = 392
    const s4 = 25
    const g4 = 3
    fig.arrow(334, 168, 384, 128, { color: red, width: 1.6, head: 6 })
    fig.arrow(334, 196, 384, 248, { color: green, width: 1.6, head: 6 })

    // Top target: 1D flat indices 3,4,5 wrap across row 0 col 3 and row 1 cols 0-1!
    const topY = 82
    fig.text(dstX + 54, topY - 12, '1D index wraps row!', {
        size: 12.5,
        weight: 700,
        color: red,
        align: 'center',
    })
    for (let r = 0; r < 3; r++) {
        for (let col = 0; col < 4; col++) {
            const idx = r * 4 + col
            const isSplit = idx >= 3 && idx <= 5
            const cx = dstX + col * (s4 + g4)
            const cy = topY + r * (s4 + g4)
            fig.rect(cx, cy, s4, s4, {
                fill: isSplit ? fill(red, true) : emptyFill,
                stroke: isSplit ? red : emptyStroke,
                strokeWidth: isSplit ? 1.6 : 1,
                radius: 4,
            })
            fig.text(cx + s4 / 2, cy + s4 / 2, String(idx), {
                size: 11.5,
                weight: isSplit ? 700 : 500,
                color: isSplit ? red : c.textMuted,
                align: 'center',
                mono: true,
            })
        }
    }

    // Bottom target: 2D bicubic resize keeps Row 1 intact
    const botY = 224
    fig.text(dstX + 54, botY - 12, '2D bicubic keeps row', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })
    for (let r = 0; r < 3; r++) {
        for (let col = 0; col < 4; col++) {
            const isRow1 = r === 1
            const cx = dstX + col * (s4 + g4)
            const cy = botY + r * (s4 + g4)
            fig.rect(cx, cy, s4, s4, {
                fill: isRow1 ? fill(green, true) : emptyFill,
                stroke: isRow1 ? green : emptyStroke,
                strokeWidth: isRow1 ? 1.6 : 1,
                radius: 4,
            })
            fig.text(cx + s4 / 2, cy + s4 / 2, isRow1 ? 'r1' : '·', {
                size: 11.5,
                weight: isRow1 ? 700 : 500,
                color: isRow1 ? green : c.textMuted,
                align: 'center',
                mono: true,
            })
        }
    }

    fig.text(c2Mid, 338, 'Token 3 jumps to row 0 under 1D', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.line(528, 22, 528, height - 22, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // Column 3: 2D-RoPE pairs (528 .. 760)
    // =========================================================================
    const c3Mid = 644
    fig.text(c3Mid, 22, '3. 2D-RoPE pairs', {
        size: 14.5,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(c3Mid, 43, 'Split head into (y, x) subspaces', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // 2x6 head dimension grid: left 3 cols = y*theta (blue), right 3 cols = x*theta (green)
    const rX = 550
    const rY = 104
    const rc = 28
    const rg = 4
    for (let r = 0; r < 2; r++) {
        for (let col = 0; col < 6; col++) {
            const isY = col < 3
            const color = isY ? blue : green
            const cx = rX + col * (rc + rg)
            const cy = rY + r * (rc + rg)
            fig.rect(cx, cy, rc, rc, {
                fill: fill(color, true),
                stroke: color,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(cx + rc / 2, cy + rc / 2, isY ? `y${col}` : `x${col - 3}`, {
                size: 11.5,
                weight: 700,
                color,
                align: 'center',
                mono: true,
            })
        }
    }

    // Curly braces below left 3 cols and right 3 cols
    fig.brace(rX, rY + 2 * rc + rg + 6, rX + 3 * rc + 2 * rg, rY + 2 * rc + rg + 6, 'y\\cdot\\theta', {
        side: 1,
        depth: 8,
        color: blue,
        labelColor: blue,
        tex: true,
        labelSize: 14,
        labelGap: 14,
    })
    fig.brace(
        rX + 3 * (rc + rg),
        rY + 2 * rc + rg + 6,
        rX + 6 * rc + 5 * rg,
        rY + 2 * rc + rg + 6,
        'x\\cdot\\theta',
        {
            side: 1,
            depth: 8,
            color: green,
            labelColor: green,
            tex: true,
            labelSize: 14,
            labelGap: 14,
        },
    )

    fig.text(c3Mid, 240, 'Dot product depends on', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })
    fig.math(c3Mid, 270, '(\\Delta y,\\; \\Delta x)', {
        size: 16.5,
        color: green,
        align: 'center',
    })

    fig.rect(562, 304, 164, 30, {
        fill: fill(green, false),
        stroke: green,
        strokeWidth: 1.3,
        radius: 15,
    })
    fig.text(c3Mid, 319, 'Any aspect ratio', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
