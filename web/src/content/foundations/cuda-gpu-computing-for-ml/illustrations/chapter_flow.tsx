import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 400
export const alt =
    'Eight token positions are divided between two four-thread blocks. The formula global id equals block id times four plus thread id maps block 1, thread 2 to T6. Each block occupies its own 32-lane warp: lanes 0 through 3 are active and lanes 4 through 31 are idle, so four of 32 lanes do useful work in this teaching kernel.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const fillAmt = theme === 'dark' ? 0.16 : 0.1

    // ─── LEFT HALF: GLOBAL INDEX MAPPING ───
    fig.text(20, 22, 'Global index mapping (2 blocks × 4 threads)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const blocks = [
        { name: 'Block 0 (blockIdx = 0)', y: 66, tokens: ['T0', 'T1', 'T2', 'T3'], base: 0, color: green },
        { name: 'Block 1 (blockIdx = 1)', y: 170, tokens: ['T4', 'T5', 'T6', 'T7'], base: 4, color: blue },
    ]

    for (const b of blocks) {
        fig.text(20, b.y, b.name, { size: 13.5, weight: 700, color: b.color })
        b.tokens.forEach((tok, t) => {
            const tx = 20 + t * 84
            const id = b.base + t
            const hot = id === 6
            const col = hot ? warm : b.color
            fig.rect(tx, b.y + 18, 76, 52, {
                fill: tint(col, c.bg, hot ? (theme === 'dark' ? 0.24 : 0.16) : fillAmt),
                stroke: col,
                strokeWidth: hot ? 2 : 1.4,
                radius: 8,
            })
            fig.text(tx + 38, b.y + 33, `t${t}`, {
                size: 14.5,
                color: c.textSecondary,
                mono: true,
                align: 'center',
            })
            fig.text(tx + 38, b.y + 54, tok, {
                size: 15,
                weight: 700,
                color: col,
                mono: true,
                align: 'center',
            })
        })
    }

    // Highlighted index formula
    fig.rect(20, 274, 328, 86, {
        fill: tint(warm, c.bg, theme === 'dark' ? 0.12 : 0.08),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 9,
    })
    fig.math(184, 300, String.raw`i = \text{blockIdx} \times 4 + \text{threadIdx}`, {
        size: 15,
        color: c.textPrimary,
        align: 'center',
    })
    fig.math(184, 336, String.raw`1 \times 4 + 2 = 6 \;\longrightarrow\; \text{T6}`, {
        size: 16,
        color: warm,
        align: 'center',
    })

    // Subtle vertical divider
    fig.line(374, 22, 374, 376, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT HALF: ACTUAL 32-LANE SUBDIVIDED WARP ALLOCATION ───
    const rx = 400
    const laneW = 10
    const laneGap = 1.5
    const stripW = 32 * laneW + 31 * laneGap // 366.5

    fig.text(rx, 22, '32-lane warp allocation (one warp per block)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const drawWarp = (y: number, label: string, color: string) => {
        fig.text(rx, y, label, { size: 13.5, weight: 700, color })
        for (let lane = 0; lane < 32; lane++) {
            const lx = rx + lane * (laneW + laneGap)
            const active = lane < 4
            fig.rect(lx, y + 20, laneW, 40, {
                fill: active ? color : tint(c.textMuted, c.bg, theme === 'dark' ? 0.14 : 0.1),
                stroke: active ? color : c.borderSubtle,
                strokeWidth: active ? 1 : 0.6,
                radius: 2.5,
            })
        }
        // Clean lane index ticks: 0, 3, and 31 (well spaced at print 8.5pt+)
        fig.text(rx + 2, y + 73, '0', { size: 14.5, color, mono: true })
        fig.text(rx + 3 * (laneW + laneGap) + 5, y + 73, '3', {
            size: 14.5,
            color,
            mono: true,
            align: 'center',
        })
        fig.text(rx + stripW, y + 73, '31', {
            size: 14.5,
            color: c.textMuted,
            mono: true,
            align: 'right',
        })
    }

    drawWarp(66, 'Warp 0 (Block 0) · lanes 0–3 active, 4–31 idle', green)
    drawWarp(176, 'Warp 1 (Block 1) · lanes 0–3 active, 4–31 idle', blue)

    // Curly braces below Warp 1 highlighting active 4 vs idle 28
    const activeEnd = rx + 4 * laneW + 3 * laneGap
    const idleStart = rx + 4 * (laneW + laneGap)
    fig.brace(rx, 264, activeEnd, 264, '4 active', {
        side: 1,
        depth: 7,
        color: blue,
        labelColor: blue,
        labelSize: 14.5,
        weight: 700,
        labelGap: 15,
    })
    fig.brace(idleStart, 264, rx + stripW, 264, '28 idle lanes (same block)', {
        side: 1,
        depth: 7,
        color: c.textMuted,
        labelColor: c.textSecondary,
        labelSize: 14.5,
        labelGap: 15,
    })

    // Summary readout
    fig.rect(rx, 314, 4, 48, { fill: blue, radius: 2 })
    fig.text(rx + 16, 326, '4 / 32 lanes active per warp (12.5%)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rx + 16, 350, 'Use multiples of 32 threads per block', {
        size: 14.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create()
