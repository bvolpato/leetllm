import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 412
export const alt =
    'A critical-path Gantt timeline on a 0 to 800 ms scale breaks down one streaming RAG request: 2 ms caller authorization, 18 ms hybrid retrieval, and 1 ms context packing (21 ms evidence prep) followed by 320 ms model startup and prefill reach caller-visible TTFT at 341 ms. Streaming decode runs 410 ms to finish at 751 ms, while a nonblocking 3 ms trace write completes off the critical path at 754 ms.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')

    const axisX = 166
    const axisW = 566
    const tMax = 800
    const tx = (ms: number) => axisX + (ms / tMax) * axisW

    const ganttTop = 58
    const ganttBot = 296

    // Vertical gridlines at round 200 ms ticks
    for (const ms of [0, 200, 400, 600, 800]) {
        const gx = tx(ms)
        fig.line(gx, ganttTop, gx, ganttBot, {
            color: ms === 0 ? c.textMuted : c.borderSubtle,
            width: ms === 0 ? 1.25 : 1,
            dash: ms === 0 ? undefined : '3 4',
        })
        fig.text(gx, ganttBot + 16, `${ms} ms`, {
            size: 14,
            mono: true,
            color: c.textSecondary,
            align: ms === 0 ? 'left' : ms === 800 ? 'right' : 'center',
        })
    }

    // Bottom horizontal axis line
    fig.line(axisX, ganttBot, axisX + axisW, ganttBot, { color: c.textMuted, width: 1.25 })

    // Milestone vertical reference lines: TTFT (341 ms) & Stream Done (751 ms)
    const ttftX = tx(341)
    fig.line(ttftX, 34, ttftX, ganttBot, { color: warm, width: 1.8, dash: '5 4' })
    fig.text(ttftX, 18, 'TTFT = 341 ms (first SSE token)', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
    })

    const doneX = tx(751)
    fig.line(doneX, 34, doneX, ganttBot, { color: green, width: 1.8, dash: '5 4' })
    fig.text(doneX - 6, 40, 'Stream done = 751 ms', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })

    // ── Gantt Rows ───────────────────────────────────────────────────────────
    const barH = 34

    // Row 1: Evidence Prep (0..21 ms)
    const y1 = 76
    fig.text(axisX - 14, y1 + 9, 'Evidence Prep', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'right',
    })
    fig.text(axisX - 14, y1 + 27, 'ACL + search + pack', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
    })
    const prepW = Math.max(15, tx(21) - tx(0))
    fig.rect(tx(0), y1, prepW, barH, {
        fill: withColorAlpha(cyan, 0.28),
        stroke: cyan,
        strokeWidth: 1.8,
        radius: 5,
    })
    fig.text(tx(21) + 10, y1 + barH / 2, '21 ms (2 + 18 + 1 ms)', {
        size: 14,
        weight: 600,
        color: cyan,
    })

    // Row 2: Model Startup / Prefill (21..341 ms = 320 ms)
    const y2 = 132
    fig.text(axisX - 14, y2 + 9, 'Model Prefill', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'right',
    })
    fig.text(axisX - 14, y2 + 27, 'KV alloc + forward', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
    })
    const prefillX = tx(21)
    const prefillW = tx(341) - prefillX
    fig.rect(prefillX, y2, prefillW, barH, {
        fill: withColorAlpha(warm, 0.24),
        stroke: warm,
        strokeWidth: 1.8,
        radius: 5,
    })
    fig.text(prefillX + prefillW / 2, y2 + barH / 2, '320 ms (94% of TTFT)', {
        size: 14,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Row 3: Streaming Decode (341..751 ms = 410 ms)
    const y3 = 188
    fig.text(axisX - 14, y3 + 9, 'Streaming Decode', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(axisX - 14, y3 + 27, 'SSE token stream', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
    })
    const decX = tx(341)
    const decW = tx(751) - decX
    fig.rect(decX, y3, decW, barH, {
        fill: withColorAlpha(green, 0.22),
        stroke: green,
        strokeWidth: 1.8,
        radius: 5,
    })
    fig.text(decX + decW / 2, y3 + barH / 2, '410 ms (~40 tok/s)', {
        size: 14,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Subtle divider separating off-critical-path async work
    fig.line(20, 236, axisX + axisW, 236, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // Row 4: Async Trace Write (751..754 ms = 3 ms, nonblocking)
    const y4 = 250
    fig.text(axisX - 14, y4 + 9, 'Async Trace', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'right',
    })
    fig.text(axisX - 14, y4 + 27, 'Off critical path', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
    })
    const trX = tx(751)
    fig.rect(trX, y4 + 3, 8, 28, {
        fill: withColorAlpha(purple, 0.3),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 3,
    })
    fig.text(trX - 10, y4 + 17, '3 ms nonblocking write (ends 754 ms)', {
        size: 14,
        weight: 600,
        color: purple,
        align: 'right',
    })

    // ── Bottom: Magnified Evidence-Prep Breakdown Strip (2 + 18 + 1 ms) ──────
    const subY = 342
    fig.text(20, subY + 12, 'Prep Zoom (21 ms):', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const stripX = 166
    const stripW = 292
    const authW = Math.round((2 / 21) * stripW)
    const retW = Math.round((18 / 21) * stripW)
    const packW = stripW - authW - retW

    fig.rect(stripX, subY, authW, 26, {
        fill: withColorAlpha(purple, 0.28),
        stroke: purple,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.rect(stripX + authW + 2, subY, retW - 4, 26, {
        fill: withColorAlpha(cyan, 0.24),
        stroke: cyan,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.rect(stripX + authW + retW, subY, Math.max(14, packW), 26, {
        fill: withColorAlpha(green, 0.28),
        stroke: green,
        strokeWidth: 1.3,
        radius: 4,
    })

    fig.text(stripX + authW + retW / 2, subY + 13, '18 ms hybrid search', {
        size: 14,
        mono: true,
        weight: 700,
        color: cyan,
        align: 'center',
    })

    fig.text(stripX, subY + 40, '2 ms ACL', { size: 14, mono: true, weight: 600, color: purple })
    fig.text(stripX + stripW + 6, subY + 40, '1 ms pack', {
        size: 14,
        mono: true,
        weight: 600,
        color: green,
        align: 'right',
    })

    // Right compact summary readout
    const sumX = 476
    const sumW = 264
    fig.rect(sumX, subY - 4, sumW, 56, {
        fill: tint(c.border, c.bg, 0.25),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 7,
    })
    fig.text(sumX + sumW / 2, subY + 14, 'TTFT = 2+18+1+320 = 341 ms', {
        size: 14,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(sumX + sumW / 2, subY + 37, 'Total = 341 + 410 = 751 ms', {
        size: 14,
        mono: true,
        weight: 600,
        color: green,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
