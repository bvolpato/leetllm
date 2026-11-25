import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 736
export const height = 435
export const alt =
    'Spatial block-table mapping for paged KV read parity (block size 2). Left block tables show A table [3, 1] with valid_length = 3 and B table [2]. Arrows connect A logical block 0 to physical block #3 (valid positions p0 and p1) and A logical block 1 to physical block #1 (valid position p2 in slot 0; invalid sentinel K=(1000,1000), V=(999,999) in slot 1 excluded by valid_length). B maps to physical block #2. Bottom readout confirms q=(1, 0.5) gives identical paged and contiguous attention output (2.461842, 1.904740).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    fig.text(28, 20, 'Block-table indirection & valid-length masking (block size = 2)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // --- Left: Logical Block Tables ---
    fig.text(28, 54, 'Logical block tables', { size: 13, weight: 600, color: c.textSecondary })

    // A table [3, 1]
    const tblX = 28
    const tblW = 200
    fig.rect(tblX, 74, tblW, 134, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(tblX + 12, 92, 'Request A · valid_len = 3', {
        size: 13,
        weight: 700,
        color: purple,
    })

    const aRow0Y = 114
    const aRow1Y = 160
    fig.rect(tblX + 12, aRow0Y, tblW - 24, 34, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.16 : 0.26),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 5,
    })
    fig.text(tblX + tblW / 2, aRow0Y + 17, 'table[0] = 3 (p0, p1)', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    fig.rect(tblX + 12, aRow1Y, tblW - 24, 34, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.16 : 0.26),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 5,
    })
    fig.text(tblX + tblW / 2, aRow1Y + 17, 'table[1] = 1 (p2)', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // B table [2]
    const bTblY = 236
    fig.rect(tblX, bTblY, tblW, 88, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(tblX + 12, bTblY + 20, 'Request B (isolated)', {
        size: 13,
        weight: 700,
        color: warm,
    })
    fig.rect(tblX + 12, bTblY + 40, tblW - 24, 34, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.16 : 0.26),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 5,
    })
    fig.text(tblX + tblW / 2, bTblY + 57, 'B table[0] = 2', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // --- Right: 4 Physical KV Blocks (#0..#3) stacked cleanly ---
    const phyX = 324
    const phyW = 388
    const blkH = 60
    const blkGap = 14
    const phyTop = 66
    fig.text(phyX, 50, 'Physical KV pool (slot 0 | slot 1)', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
    })

    const blocks = [
        {
            id: '#0',
            owner: 'free',
            stroke: c.borderLight,
            ownerTone: c.textMuted,
            s0: { head: 'empty', sub: 'free', kind: 'free' },
            s1: { head: 'empty', sub: 'free', kind: 'free' },
        },
        {
            id: '#1',
            owner: 'A log 1',
            stroke: purple,
            ownerTone: purple,
            s0: { head: 'p2 · K(1,1)', sub: 'V(4,2) ✓', kind: 'valid' },
            s1: { head: 'K1000, V999', sub: 'tail masked ✗', kind: 'tail' },
        },
        {
            id: '#2',
            owner: 'B-owned',
            stroke: warm,
            ownerTone: warm,
            s0: { head: 'B · K(-1,0)', sub: 'V(-5,-5)', kind: 'other' },
            s1: { head: 'empty', sub: 'free', kind: 'free' },
        },
        {
            id: '#3',
            owner: 'A log 0',
            stroke: purple,
            ownerTone: purple,
            s0: { head: 'p0 · K(1,0)', sub: 'V(2,1) ✓', kind: 'valid' },
            s1: { head: 'p1 · K(0,1)', sub: 'V(0,3) ✓', kind: 'valid' },
        },
    ]

    blocks.forEach((b, idx) => {
        const y = phyTop + idx * (blkH + blkGap)
        fig.rect(phyX, y, phyW, blkH, {
            fill: tint(b.stroke, c.bg, theme === 'light' ? 0.05 : 0.1),
            stroke: b.stroke,
            strokeWidth: 1.5,
            radius: 7,
        })

        // Block id tag on left inside block
        fig.text(phyX + 10, y + 19, b.id, {
            size: 14,
            weight: 700,
            color: b.ownerTone,
            mono: true,
        })
        fig.text(phyX + 10, y + 40, b.owner, {
            size: 13,
            weight: 600,
            color: b.ownerTone,
        })

        // Two slots side by side
        const slots = [b.s0, b.s1]
        slots.forEach((sl, sIdx) => {
            const sx = phyX + 86 + sIdx * 151
            const sw = 145
            const sh = 46
            const sy = y + 7
            const stTone =
                sl.kind === 'valid'
                    ? blue
                    : sl.kind === 'tail'
                      ? red
                      : sl.kind === 'other'
                        ? warm
                        : c.borderLight
            fig.rect(sx, sy, sw, sh, {
                fill:
                    sl.kind === 'free'
                        ? 'none'
                        : tint(stTone, c.bg, theme === 'light' ? 0.15 : 0.25),
                stroke: stTone,
                strokeWidth: sl.kind === 'tail' ? 1.75 : 1.25,
                radius: 5,
            })
            fig.text(sx + sw / 2, sy + 14, sl.head, {
                size: 13,
                weight: 700,
                color: sl.kind === 'free' ? c.textMuted : stTone,
                align: 'center',
                mono: true,
            })
            fig.text(sx + sw / 2, sy + 33, sl.sub, {
                size: 13,
                weight: 600,
                color: sl.kind === 'tail' ? red : c.textSecondary,
                align: 'center',
                mono: true,
            })
        })
    })

    // --- Curved spatial mapping arrows (table -> physical block) ---
    const blkCenterY = (i: number) => phyTop + i * (blkH + blkGap) + blkH / 2
    const srcX = tblX + tblW - 12

    // A table[0] -> Physical #3
    const a0y = aRow0Y + 17
    const b3y = blkCenterY(3)
    fig.path(`M${srcX} ${a0y} C${srcX + 68} ${a0y}, ${phyX - 68} ${b3y}, ${phyX - 6} ${b3y}`, {
        color: purple,
        width: 2,
    })
    fig.arrow(phyX - 16, b3y, phyX - 2, b3y, { color: purple, width: 2, head: 6 })

    // A table[1] -> Physical #1
    const a1y = aRow1Y + 17
    const b1y = blkCenterY(1)
    fig.path(`M${srcX} ${a1y} C${srcX + 54} ${a1y}, ${phyX - 54} ${b1y}, ${phyX - 6} ${b1y}`, {
        color: blue,
        width: 2,
    })
    fig.arrow(phyX - 16, b1y, phyX - 2, b1y, { color: blue, width: 2, head: 6 })

    // B table[0] -> Physical #2
    const b0y = bTblY + 57
    const b2y = blkCenterY(2)
    fig.path(`M${srcX} ${b0y} C${srcX + 54} ${b0y}, ${phyX - 54} ${b2y}, ${phyX - 6} ${b2y}`, {
        color: warm,
        width: 2,
        dash: '5 3',
    })
    fig.arrow(phyX - 16, b2y, phyX - 2, b2y, { color: warm, width: 2, head: 6 })

    // --- Bottom exact parity verification bar ---
    fig.rect(28, 372, 684, 46, {
        fill: tint(green, c.bg, theme === 'light' ? 0.12 : 0.18),
        stroke: green,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(42, 395, 'q = (1, 0.5) → Paged = Contiguous = (2.461842, 1.904740)', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
    })
    fig.text(698, 395, 'Sentinel & B excluded ✓', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        align: 'right',
    })

    return fig.render()
}

export default create
