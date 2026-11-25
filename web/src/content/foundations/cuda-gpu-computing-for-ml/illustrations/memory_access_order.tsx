import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 475
export const alt =
    'Eight adjacent 4-byte words fit in one aligned 32-byte global-memory segment; column reads at stride 32 words scatter across eight separate segments. In shared memory, column-zero addresses 0, 32, through 224 all map to bank zero and serialize as an eight-way conflict. Padding the tile stride from 32 to 33 maps those lanes to banks zero through seven.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const critical = fig.tone('critical')
    const fillAmt = theme === 'dark' ? 0.16 : 0.1

    // ─── BAND 1: GLOBAL COALESCED (1 ALIGNED 32-B SEGMENT) ───
    fig.text(24, 18, 'Global memory · adjacent words coalesce into 1 aligned 32-B segment', {
        size: 14.5,
        weight: 700,
        color: green,
    })

    const g1W = 91
    for (let lane = 0; lane < 8; lane++) {
        const x = 24 + lane * g1W
        fig.rect(x, 38, g1W, 50, {
            fill: tint(green, c.bg, fillAmt),
            stroke: green,
            strokeWidth: 1.2,
            radius: lane === 0 || lane === 7 ? 6 : 0,
        })
        fig.text(x + g1W / 2, 53, `L${lane}`, {
            size: 12,
            weight: 700,
            color: c.textSecondary,
            mono: true,
            align: 'center',
        })
        fig.text(x + g1W / 2, 73, `w${lane}`, {
            size: 13.5,
            weight: 700,
            color: green,
            mono: true,
            align: 'center',
        })
    }
    fig.brace(24, 92, 24 + 8 * g1W, 92, '1 transaction (32 bytes)', {
        side: 1,
        depth: 7,
        color: green,
        labelColor: green,
        labelSize: 12,
        weight: 600,
        labelGap: 13,
    })

    // ─── BAND 2: GLOBAL STRIDED (8 SEPARATE 32-B SEGMENTS) ───
    fig.text(24, 144, 'Global memory · column stride 32 scatters across 8 separate 32-B segments', {
        size: 14.5,
        weight: 700,
        color: warm,
    })

    const g2W = 84
    const g2Gap = 8
    for (let lane = 0; lane < 8; lane++) {
        const x = 24 + lane * (g2W + g2Gap)
        fig.rect(x, 164, g2W, 50, {
            fill: tint(warm, c.bg, fillAmt),
            stroke: warm,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(x + g2W / 2, 179, `L${lane}`, {
            size: 12,
            weight: 700,
            color: c.textSecondary,
            mono: true,
            align: 'center',
        })
        fig.text(x + g2W / 2, 199, `w${lane * 32}`, {
            size: 13.5,
            weight: 700,
            color: warm,
            mono: true,
            align: 'center',
        })
    }
    fig.text(390, 232, '8 separate memory transactions (8× bandwidth waste)', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
    })

    fig.line(24, 256, width - 24, 256, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // ─── BAND 3: SHARED MEMORY BANK CONFLICT VS PAD STRIDE 33 ───
    // Left column: stride 32 -> 8-way conflict on Bank 0
    fig.text(24, 280, 'Shared memory · stride 32 → Bank 0', {
        size: 14.5,
        weight: 700,
        color: critical,
    })
    fig.text(24, 302, 'All 8 lanes collide on B0 (8-way serialized)', {
        size: 12.5,
        color: c.textSecondary,
    })

    const cellW = 80
    const cellGap = 8
    for (let lane = 0; lane < 8; lane++) {
        const r = Math.floor(lane / 4)
        const col = lane % 4
        const x = 24 + col * (cellW + cellGap)
        const y = 326 + r * 64
        fig.rect(x, y, cellW, 54, {
            fill: tint(critical, c.bg, fillAmt),
            stroke: critical,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(x + cellW / 2, y + 18, `w${lane * 32}`, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            mono: true,
            align: 'center',
        })
        fig.text(x + cellW / 2, y + 38, '→ B0', {
            size: 13,
            weight: 700,
            color: critical,
            mono: true,
            align: 'center',
        })
    }

    // Center vertical divider
    fig.line(390, 274, 390, 456, { color: c.borderSubtle, width: 1 })

    // Right column: pad stride 33 -> Banks B0..B7 parallel
    const rx = 414
    fig.text(rx, 280, 'Shared memory · padded stride 33', {
        size: 14.5,
        weight: 700,
        color: green,
    })
    fig.text(rx, 302, 'Lanes hit B0–B7 in parallel (conflict-free)', {
        size: 12.5,
        color: c.textSecondary,
    })

    for (let lane = 0; lane < 8; lane++) {
        const r = Math.floor(lane / 4)
        const col = lane % 4
        const x = rx + col * (cellW + cellGap)
        const y = 326 + r * 64
        fig.rect(x, y, cellW, 54, {
            fill: tint(green, c.bg, fillAmt),
            stroke: green,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(x + cellW / 2, y + 18, `w${lane * 33}`, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            mono: true,
            align: 'center',
        })
        fig.text(x + cellW / 2, y + 38, `→ B${lane}`, {
            size: 13,
            weight: 700,
            color: green,
            mono: true,
            align: 'center',
        })
    }

    return fig.render()
}

export default create()
