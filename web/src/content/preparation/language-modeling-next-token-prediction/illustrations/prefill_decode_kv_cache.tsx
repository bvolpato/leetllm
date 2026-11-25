import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 500
export const alt =
    'Prefill processes the four prompt positions The function returns the, caches four key and value columns and selects result. Decode step 1 appends position five (result) and attends over all five cached columns before selecting a period. Decode step 2 appends position six (period) and attends over all six columns before selecting eos. Below, raw KV cache payload grows linearly: 1, 4, and 16 GiB at 2,048, 8,192, and 32,768 cached positions.'

export const cachedLengths = [4, 5, 6]
export const memoryConfig = { batch: 4, layers: 32, kvHeads: 8, headDim: 128, bytesPerValue: 2 }
export const cacheGiB = (s: number) =>
    (2 *
        memoryConfig.layers *
        memoryConfig.kvHeads *
        memoryConfig.headDim *
        s *
        memoryConfig.batch *
        memoryConfig.bytesPerValue) /
    2 ** 30

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const amberBar = isLight ? '#d97706' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    // ── Section 1: Growing K/V Columns & Attention Read Arcs ────────────────
    fig.text(20, 22, '1. KV cache columns: prefill vs decode', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })
    // Inline key
    fig.rect(442, 13, 16, 16, {
        fill: tint(blue, c.bg, isLight ? 0.25 : 0.35),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 3,
    })
    fig.text(464, 22, 'Cached K/V', { size: 16, color: blue, weight: 650 })
    fig.rect(584, 13, 16, 16, {
        fill: tint(green, c.bg, isLight ? 0.25 : 0.35),
        stroke: green,
        strokeWidth: 1.5,
        radius: 3,
    })
    fig.text(606, 22, 'Appended K/V', { size: 16, color: green, weight: 650 })

    // Column headers for positions 1..6
    const colLeft = 224
    const colW = 56
    const colGap = 10
    const colStep = colW + colGap
    const colTokens = ['The', 'func', 'ret', 'the', 'result', '.']

    colTokens.forEach((tok, j) => {
        fig.text(colLeft + j * colStep + colW / 2, 58, tok, {
            size: 16,
            mono: true,
            color: j >= 4 ? green : c.textSecondary,
            align: 'center',
            weight: j >= 4 ? 700 : 600,
        })
    })

    const rows = [
        { title: 'Prefill (4 tok)', cols: 4, isDecode: false, nextTok: '→ result', y: 100 },
        { title: 'Decode +1 (pos 5)', cols: 5, isDecode: true, nextTok: '→ .', y: 170 },
        { title: 'Decode +2 (pos 6)', cols: 6, isDecode: true, nextTok: '→ <eos>', y: 240 },
    ] as const

    for (const row of rows) {
        fig.text(20, row.y, row.title, {
            size: 18,
            weight: 700,
            color: row.isDecode ? green : blue,
        })

        // Subtle attention-read arcs from new decode token across all cached K/V columns
        if (row.isDecode) {
            const qx = colLeft + (row.cols - 1) * colStep + colW / 2
            const topY = row.y - 20
            for (let j = 0; j < row.cols - 1; j++) {
                const kx = colLeft + j * colStep + colW / 2
                const arch = Math.min(20, 7 + (row.cols - 1 - j) * 2.8)
                fig.path(
                    `M${qx} ${topY} Q${(qx + kx) / 2} ${topY - arch}, ${kx} ${topY}`,
                    { color: green, width: 1.35, opacity: 0.6 },
                )
            }
        }

        for (let j = 0; j < row.cols; j++) {
            const x = colLeft + j * colStep
            const fresh = row.isDecode && j === row.cols - 1
            const col = fresh ? green : blue
            const fill = tint(col, c.bg, isLight ? 0.2 : 0.3)

            // K box (top) & V box (bottom)
            fig.rect(x, row.y - 19, colW, 17, { fill, stroke: col, strokeWidth: 1.4, radius: 3 })
            fig.rect(x, row.y + 2, colW, 17, { fill, stroke: col, strokeWidth: 1.4, radius: 3 })
            fig.text(x + colW / 2, row.y - 10, `K${j + 1}`, {
                size: 13,
                mono: true,
                weight: 700,
                color: col,
                align: 'center',
                width: colW,
            })
            fig.text(x + colW / 2, row.y + 11, `V${j + 1}`, {
                size: 13,
                mono: true,
                weight: 700,
                color: col,
                align: 'center',
                width: colW,
            })
        }

        // Emitted token pill on right
        const outX = 648
        fig.rect(outX, row.y - 18, 128, 36, {
            fill: tint(amberBar, c.bg, isLight ? 0.14 : 0.22),
            stroke: amberBar,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(outX + 64, row.y, row.nextTok, {
            size: 17,
            mono: true,
            weight: 750,
            color: amberText,
            align: 'center',
        })
    }

    // Horizontal divider
    fig.line(20, 282, width - 20, 282, { color: c.borderSubtle, width: 1.25 })

    // ── Section 2: Raw KV Payload Bars (1, 4, 16 GiB) ───────────────────────
    fig.text(20, 306, '2. Raw KV payload (linear in sequence length)', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })
    fig.text(20, 332, 'B = 4 · L = 32 · H_kv = 8 · d = 128 · fp16', {
        size: 16,
        mono: true,
        color: c.textSecondary,
        weight: 600,
    })

    const barLeft = 166
    const barMaxW = 500
    const maxGiB = 16
    const yBars = [372, 414, 456] as const

    // Subtle vertical gridlines at 0, 4, 8, 12, 16 GiB
    for (const tick of [0, 4, 8, 12, 16]) {
        const gx = barLeft + (tick / maxGiB) * barMaxW
        fig.line(gx, 352, gx, 474, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.4 : 1,
        })
        fig.text(gx, 488, `${tick} GiB`, {
            size: 15,
            mono: true,
            color: c.textSecondary,
            align: 'center',
        })
    }

    const budgets = [
        { seq: '2,048 pos', gib: 1, fill: blue, ink: blue },
        { seq: '8,192 pos', gib: 4, fill: purple, ink: purple },
        { seq: '32,768 pos', gib: 16, fill: amberBar, ink: amberText },
    ] as const

    budgets.forEach((b, i) => {
        const cy = yBars[i]!
        const w = Math.max(14, (b.gib / maxGiB) * barMaxW)
        fig.text(barLeft - 14, cy, b.seq, {
            size: 18,
            mono: true,
            weight: 650,
            color: c.textPrimary,
            align: 'right',
        })
        fig.rect(barLeft, cy - 11, w, 22, { fill: b.fill, radius: 4 })
        fig.text(barLeft + w + 12, cy, `${b.gib} GiB`, {
            size: 18,
            mono: true,
            weight: 750,
            color: b.ink,
        })
    })

    return fig.render()
}

export default create('dark')
