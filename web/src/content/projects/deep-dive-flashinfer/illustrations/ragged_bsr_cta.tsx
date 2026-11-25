import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 430
export const alt =
    'Mapping between ragged logical token sequences and paged Block Compressed Sparse Row (BSR) physical layout for three requests. Logical tokens 0-3, 4-7, and 8 of request 2 map to non-contiguous physical pages 3, 14, and 6. Page 6 allocates only slot zero, and logical token 5 resides in physical page 14 slot 1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    // Column headers
    fig.text(24, 24, 'R2 Logical Tokens (9 tokens)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(24, 44, 'page_size = 4, last_page_len = 1', { size: 13, color: muted, mono: true })

    fig.text(398, 24, 'BSR page_ids', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
        width: 120,
    })
    fig.text(398, 44, '[3, 14, 6]', {
        size: 13,
        color: muted,
        align: 'center',
        mono: true,
        width: 120,
    })

    fig.text(520, 24, 'Physical KV Pool (by page ID)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(520, 44, 'Non-contiguous slots, zero copy', { size: 13, color: muted })

    const rowY = [82, 182, 282] as const
    const slotW = 54
    const slotH = 44
    const slotGap = 6

    const drawSlots = (
        x: number,
        y: number,
        heading: string,
        tone: string,
        slots: readonly (string | null)[],
        highlightIdx = -1,
    ) => {
        fig.text(x, y - 10, heading, { size: 13, weight: 600, color: tone })
        slots.forEach((val, idx) => {
            const sx = x + idx * (slotW + slotGap)
            const sy = y + 4
            const isHl = idx === highlightIdx
            const isEmpty = val === null
            fig.rect(sx, sy, slotW, slotH, {
                fill: isHl
                    ? tint(purple, c.bg, 0.28)
                    : isEmpty
                      ? 'none'
                      : tint(tone, c.bg, 0.14),
                stroke: isHl ? purple : isEmpty ? c.borderSubtle : tone,
                strokeWidth: isHl ? 2.25 : isEmpty ? 1 : 1.25,
                radius: 6,
            })
            if (isEmpty) {
                fig.line(sx + 8, sy + slotH - 8, sx + slotW - 8, sy + 8, {
                    color: c.borderSubtle,
                    width: 1,
                })
                fig.text(sx + slotW / 2, sy + slotH / 2, `s${idx}`, {
                    size: 12,
                    color: c.textMuted,
                    align: 'center',
                    mono: true,
                    width: slotW,
                })
            } else {
                fig.text(sx + slotW / 2, sy + 16, val, {
                    size: 14,
                    weight: 700,
                    color: isHl ? purple : c.textPrimary,
                    align: 'center',
                    mono: true,
                    width: slotW,
                })
                fig.text(sx + slotW / 2, sy + 34, `s${idx}`, {
                    size: 11,
                    color: isHl ? purple : muted,
                    align: 'center',
                    mono: true,
                    width: slotW,
                })
            }
        })
    }

    // Left: Logical chunks in logical order (0, 1, 2)
    drawSlots(24, rowY[0], 'Chunk 0  (tokens 0..3)', blue, ['t0', 't1', 't2', 't3'])
    drawSlots(24, rowY[1], 'Chunk 1  (tokens 4..7)', cyan, ['t4', 't5', 't6', 't7'], 1)
    drawSlots(24, rowY[2], 'Chunk 2  (tail, 1 active)', warm, ['t8', null, null, null])

    // Center: BSR page_ids array
    const bsrX = 356
    const bsrW = 84
    const bsrEntries = [
        { idx: 0, page: '3', tone: blue },
        { idx: 1, page: '14', tone: cyan },
        { idx: 2, page: '6', tone: warm },
    ] as const

    bsrEntries.forEach((e, i) => {
        const y = rowY[i]! + 4
        fig.rect(bsrX, y, bsrW, slotH, {
            fill: tint(e.tone, c.bg, 0.14),
            stroke: e.tone,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(bsrX + bsrW / 2, y + 15, `p[${e.idx}]`, {
            size: 12,
            color: muted,
            align: 'center',
            mono: true,
            width: bsrW,
        })
        fig.text(bsrX + bsrW / 2, y + 32, `-> ${e.page}`, {
            size: 14,
            weight: 700,
            color: e.tone,
            align: 'center',
            mono: true,
            width: bsrW,
        })
        // Arrow logical chunk -> BSR entry
        fig.arrow(264, y + slotH / 2, bsrX - 3, y + slotH / 2, {
            color: e.tone,
            width: 1.75,
            head: 6,
        })
    })

    // Right: Physical pages in physical page-number order (Page 3, Page 6, Page 14)
    const physX = 520
    drawSlots(physX, rowY[0], 'Page 3   (slots 0..3 full)', blue, ['t0', 't1', 't2', 't3'])
    drawSlots(physX, rowY[1], 'Page 6   (slot 0 active, 1..3 free)', warm, ['t8', null, null, null])
    drawSlots(physX, rowY[2], 'Page 14  (slots 0..3 full)', cyan, ['t4', 't5', 't6', 't7'], 1)

    // Smooth Bezier connectors showing non-contiguous physical placement:
    // p[0] (row 0) -> Page 3 (row 0)
    fig.arrow(bsrX + bsrW, rowY[0] + 26, physX - 6, rowY[0] + 26, {
        color: blue,
        width: 2,
        head: 6,
    })

    // p[1] (row 1) -> Page 14 (row 2)
    const x1 = bsrX + bsrW
    const x2 = physX - 8
    const y1Cyan = rowY[1] + 26
    const y2Cyan = rowY[2] + 26
    fig.path(
        `M${x1} ${y1Cyan}C${x1 + 36} ${y1Cyan},${x2 - 36} ${y2Cyan},${x2} ${y2Cyan}`,
        { color: cyan, width: 2.25 },
    )
    fig.arrow(x2 - 8, y2Cyan, physX - 4, y2Cyan, { color: cyan, width: 2.25, head: 6 })

    // p[2] (row 2) -> Page 6 (row 1)
    const y1Warm = rowY[2] + 26
    const y2Warm = rowY[1] + 26
    fig.path(
        `M${x1} ${y1Warm}C${x1 + 36} ${y1Warm},${x2 - 36} ${y2Warm},${x2} ${y2Warm}`,
        { color: warm, width: 2, dash: '5 4' },
    )
    fig.arrow(x2 - 8, y2Warm, physX - 4, y2Warm, { color: warm, width: 2, head: 6 })

    // Bottom indexing formula + token 5 callout (frameless)
    fig.line(24, 360, 816, 360, { color: c.borderSubtle, width: 1 })
    fig.math(
        24,
        394,
        '\\mathrm{addr}(j) = \\bigl(\\mathrm{page\\_ids}[\\lfloor j/4 \\rfloor],\\; j \\bmod 4\\bigr)',
        { size: 15, color: c.textPrimary },
    )
    fig.math(
        816,
        394,
        'j = 5 \\;\\Rightarrow\\; (\\text{page } 14,\\; \\text{slot } 1)',
        { size: 15, color: purple, align: 'right' },
    )

    return fig.render()
}

export default create()
