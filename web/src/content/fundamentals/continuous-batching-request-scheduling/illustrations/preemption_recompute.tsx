import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'The client-visible output IDs 201 and 202 remain accepted through preemption. Before the pause, KV contains prompt positions 101, 102, and 103 plus generated position 201; sampled token 202 has no KV position yet. The pause releases those four cached positions. Resume replays 101, 102, 103, and 201 without sampling or emitting them again, then uses 202 as the next decode input.'

const cachedTokens = [101, 102, 103, 201]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    const colX = [28, 276, 524]
    const cellW = 48
    const cellGap = 6
    const kvY = 72
    const cellH = 40

    const stages = [
        { head: '1. Before pause', sub: '4 tokens held in KV', nextNote: 'no KV yet', tone: blue },
        { head: '2. Paused', sub: 'all 4 KV slots freed', nextNote: 'queued', tone: warm },
        {
            head: '3. Resumed',
            sub: 'silent replay (no emit)',
            nextNote: 'next decode input',
            tone: green,
        },
    ]

    // Stage column titles & KV slots
    stages.forEach((st, idx) => {
        const sx = colX[idx]!
        fig.text(sx, 26, st.head, { size: 15, weight: 700, color: c.textPrimary })
        fig.text(sx, 48, st.sub, { size: 12, weight: 600, color: st.tone })

        cachedTokens.forEach((tok, tIdx) => {
            const tx = sx + tIdx * (cellW + cellGap)
            const isPrompt = tok < 200
            const baseTone = isPrompt ? blue : purple

            if (idx === 0) {
                fig.rect(tx, kvY, cellW, cellH, {
                    fill: tint(baseTone, c.bg, theme === 'light' ? 0.22 : 0.34),
                    stroke: baseTone,
                    strokeWidth: 1.6,
                    radius: 6,
                })
                fig.text(tx + cellW / 2, kvY + cellH / 2, String(tok), {
                    size: 13,
                    weight: 700,
                    color: c.textPrimary,
                    align: 'center',
                    mono: true,
                })
            } else if (idx === 1) {
                // Evicted empty slots (dashed)
                fig.rect(tx, kvY, cellW, cellH, {
                    fill: tint(c.textMuted, c.bg, 0.06),
                    stroke: c.borderLight,
                    strokeWidth: 1.4,
                    radius: 6,
                })
                fig.line(tx + 8, kvY + cellH - 8, tx + cellW - 8, kvY + 8, {
                    color: c.textMuted,
                    width: 1,
                    opacity: 0.45,
                })
            } else {
                // Silent replay (warm dashed/tinted)
                fig.rect(tx, kvY, cellW, cellH, {
                    fill: tint(warm, c.bg, theme === 'light' ? 0.16 : 0.24),
                    stroke: warm,
                    strokeWidth: 1.6,
                    radius: 6,
                })
                fig.text(tx + cellW / 2, kvY + cellH / 2, String(tok), {
                    size: 13,
                    weight: 700,
                    color: warm,
                    align: 'center',
                    mono: true,
                })
            }
        })

        // Next decode input token 202
        const nextY = 178
        fig.rect(sx, nextY, 56, 36, {
            fill: tint(purple, c.bg, theme === 'light' ? 0.18 : 0.28),
            stroke: purple,
            strokeWidth: 1.6,
            radius: 6,
        })
        fig.text(sx + 28, nextY + 18, '202', {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        fig.text(sx + 68, nextY + 18, st.nextNote, {
            size: 13,
            weight: idx === 2 ? 700 : 500,
            color: idx === 2 ? green : c.textSecondary,
        })
    })

    // Stage transition arrows
    fig.arrow(colX[0]! + 214, kvY + cellH / 2, colX[1]! - 8, kvY + cellH / 2, {
        color: warm,
        width: 2,
        head: 6.5,
    })
    fig.text((colX[0]! + 214 + colX[1]!) / 2 - 4, kvY + cellH / 2 - 14, 'evict', {
        size: 11,
        weight: 600,
        color: warm,
        align: 'center',
    })

    fig.arrow(colX[1]! + 214, kvY + cellH / 2, colX[2]! - 8, kvY + cellH / 2, {
        color: green,
        width: 2,
        head: 6.5,
    })
    fig.text((colX[1]! + 214 + colX[2]!) / 2 - 4, kvY + cellH / 2 - 14, 'replay', {
        size: 11,
        weight: 600,
        color: green,
        align: 'center',
    })

    // Row label for pending decode token
    fig.text(28, 152, 'Pending decode input (sampled, not yet in KV)', {
        size: 13,
        weight: 600,
        color: purple,
    })

    // Hairline divider
    fig.line(28, 244, 732, 244, { color: c.borderSubtle, width: 1 })

    // --- Bottom: Continuous Client-Visible Emitted Stream (NO "Ledger"!) ---
    fig.text(28, 270, 'Client-visible emitted tokens (unchanged across pause & replay)', {
        size: 15,
        weight: 600,
        color: green,
    })

    const streamY = 296
    const streamH = 54
    fig.rect(28, streamY, 704, streamH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: green,
        strokeWidth: 1.5,
        radius: 8,
    })

    fig.text(46, streamY + streamH / 2, 'Emitted stream:', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })

    ;[201, 202].forEach((id, i) => {
        const bx = 178 + i * 74
        fig.rect(bx, streamY + 10, 62, 34, {
            fill: tint(green, c.bg, theme === 'light' ? 0.78 : 0.86),
            stroke: green,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(bx + 31, streamY + 27, String(id), {
            size: 14,
            weight: 700,
            color: theme === 'light' ? '#ffffff' : '#0b0c10',
            align: 'center',
            mono: true,
        })
    })

    fig.arrow(320, streamY + streamH / 2, 362, streamY + streamH / 2, {
        color: green,
        width: 1.75,
        head: 6,
    })
    fig.rect(368, streamY + 10, 82, 34, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: green,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(409, streamY + 27, '203 ...', {
        size: 13,
        weight: 600,
        color: green,
        align: 'center',
        mono: true,
    })

    fig.text(472, streamY + streamH / 2, '201 & 202 never re-sampled', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
    })

    // Compact legend for prompt vs generated tokens
    fig.rect(28, 368, 12, 12, { fill: tint(blue, c.bg, 0.45), stroke: blue, strokeWidth: 1.2, radius: 2 })
    fig.text(46, 374, 'Prompt tokens (101–103)', { size: 12, color: c.textSecondary })
    fig.rect(226, 368, 12, 12, { fill: tint(purple, c.bg, 0.45), stroke: purple, strokeWidth: 1.2, radius: 2 })
    fig.text(244, 374, 'Generated tokens (201, 202)', { size: 12, color: c.textSecondary })

    return fig.render()
}

export default create
