import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 435
export const alt =
    'Deficit round-robin scheduling across three rounds comparing Tenant A (quantum 4, chunk cost 3) and Tenant B (quantum 2, chunk cost 1). Left: per-round credit and served chunk bars show Tenant A serving 3, 3, and 6 work units while carrying over +1 and +2 credits, and Tenant B serving 2 work units per round. Right: cumulative totals show a 2:1 work-unit share (12 vs 6) alongside a 2:3 completed-chunk ratio (4 vs 6).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const onBlue = getReadableTextColor(blue, c, c.bg)
    const onPurple = getReadableTextColor(purple, c, c.bg)
    const soft = (hex: string, a = 0.16) => tint(hex, c.bg, a)

    // Left panel: Per-round DRR credit & chunk bars (0..6 work-unit axis)
    fig.text(24, 24, 'PER-ROUND CREDITS & SERVED CHUNKS', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 300,
    })
    fig.text(24, 46, 'Tenant A: +4/round, cost 3', {
        size: 13,
        color: blue,
        weight: 600,
        width: 200,
    })
    fig.text(244, 46, 'Tenant B: +2/round, cost 1', {
        size: 13,
        color: purple,
        weight: 600,
        width: 200,
    })

    const leftPlot = fig.plot({ x: 108, y: 74, width: 384, height: 276 }, { x: [0, 6], y: [0, 3] })
    for (let u = 0; u <= 6; u++) {
        const x = leftPlot.px(u)
        fig.line(x, 74, x, 350, { color: c.borderSubtle, width: 1, opacity: 0.7 })
        fig.line(x, 350, x, 356, { color: c.textMuted, width: 1.2 })
        fig.text(x, 372, `${u}`, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
            width: 30,
        })
    }
    fig.line(leftPlot.px(0), 350, leftPlot.px(6), 350, { color: c.textMuted, width: 1.3 })
    fig.text(leftPlot.px(3), 398, 'Work units per round (credit = served + carry)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        width: 350,
    })

    const roundData = [
        { name: 'Round 1', y: 84, aChunks: [3], aCarry: 1, aCred: '4', bChunks: [1, 1] },
        { name: 'Round 2', y: 176, aChunks: [3], aCarry: 2, aCred: '1+4=5', bChunks: [1, 1] },
        { name: 'Round 3', y: 268, aChunks: [3, 3], aCarry: 0, aCred: '2+4=6', bChunks: [1, 1] },
    ]

    const barH = 26
    roundData.forEach((r, idx) => {
        fig.text(24, r.y + 30, r.name, {
            size: 14,
            color: c.textPrimary,
            weight: 700,
            width: 78,
        })
        fig.text(98, r.y + 13, 'A', {
            size: 13,
            color: blue,
            align: 'right',
            weight: 700,
            width: 20,
        })
        fig.text(98, r.y + 47, 'B', {
            size: 13,
            color: purple,
            align: 'right',
            weight: 700,
            width: 20,
        })

        // Tenant A served chunks
        let cursor = 0
        for (const cost of r.aChunks) {
            const x0 = leftPlot.px(cursor)
            const w = leftPlot.px(cursor + cost) - x0 - 3
            fig.rect(x0, r.y, w, barH, { fill: blue, radius: 5 })
            fig.text(x0 + w / 2, r.y + barH / 2, `${cost}u chunk`, {
                size: 12,
                color: onBlue,
                align: 'center',
                weight: 700,
                width: w - 6,
            })
            cursor += cost
        }
        // Tenant A carryover credit
        if (r.aCarry > 0) {
            const x0 = leftPlot.px(cursor)
            const w = leftPlot.px(cursor + r.aCarry) - x0
            fig.rect(x0, r.y, w, barH, {
                fill: soft(warm, theme === 'light' ? 0.16 : 0.24),
                stroke: warm,
                strokeWidth: 1.4,
                radius: 5,
            })
            fig.text(x0 + w / 2, r.y + barH / 2, `+${r.aCarry}`, {
                size: 12,
                color: warm,
                align: 'center',
                weight: 700,
                mono: true,
                width: w - 4,
            })
            // Carryover path routed cleanly along open channel below Tenant B
            if (idx < roundData.length - 1) {
                const nextY = roundData[idx + 1]!.y
                const rightX = x0 + w
                const chanY = r.y + 73
                const targetX = leftPlot.px(0) + 12
                fig.path(
                    `M${rightX + 2} ${r.y + 13}Q${rightX + 18} ${r.y + 13},${rightX + 18} ${chanY - 8}L${rightX + 18} ${chanY}L${targetX} ${chanY}L${targetX} ${nextY - 3}`,
                    {
                        color: warm,
                        width: 1.35,
                        dash: '4 3',
                        opacity: 0.9,
                    },
                )
            }
        }

        // Tenant B served chunks
        let bCur = 0
        for (const cost of r.bChunks) {
            const x0 = leftPlot.px(bCur)
            const w = leftPlot.px(bCur + cost) - x0 - 3
            fig.rect(x0, r.y + 34, w, barH, { fill: purple, radius: 5 })
            fig.text(x0 + w / 2, r.y + 34 + barH / 2, '1u', {
                size: 12,
                color: onPurple,
                align: 'center',
                weight: 700,
                width: w - 4,
            })
            bCur += cost
        }
        fig.text(leftPlot.px(2) + 10, r.y + 47, '2u · carry 0', {
            size: 12,
            color: c.textSecondary,
            width: 96,
        })
    })

    // Divider between left rounds and right cumulative comparison
    fig.line(524, 24, 524, 405, { color: c.borderSubtle, width: 1 })

    // Right panel: Cumulative totals (Work units 2:1 vs Chunks 2:3)
    fig.text(548, 24, '3-ROUND CUMULATIVE TOTALS', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 248,
    })

    // Chart 1: Work units (0..12)
    fig.text(548, 66, 'Work units served', {
        size: 14,
        color: c.textPrimary,
        weight: 700,
        width: 150,
    })
    fig.text(796, 66, '2 : 1 share', {
        size: 13,
        color: green,
        align: 'right',
        weight: 700,
        width: 90,
    })
    const workBarX = 576
    const workMaxW = 196
    const drawSummaryBar = (y: number, tag: string, val: number, max: number, color: string) => {
        const w = (val / max) * workMaxW
        const ink = getReadableTextColor(color, c, c.bg)
        fig.text(566, y + 15, tag, {
            size: 13,
            color,
            align: 'right',
            weight: 700,
            width: 24,
        })
        fig.rect(workBarX, y, w, 30, { fill: color, radius: 5 })
        fig.text(workBarX + w / 2, y + 15, `${val}`, {
            size: 13,
            color: ink,
            align: 'center',
            weight: 700,
            mono: true,
            width: Math.max(28, w - 6),
        })
    }
    drawSummaryBar(90, 'A', 12, 12, blue)
    drawSummaryBar(130, 'B', 6, 12, purple)

    // Chart 2: Completed chunks (0..6)
    fig.line(548, 190, 796, 190, { color: c.borderSubtle, width: 1, dash: '4 3' })
    fig.text(548, 218, 'Chunks completed', {
        size: 14,
        color: c.textPrimary,
        weight: 700,
        width: 150,
    })
    fig.text(796, 218, '2 : 3 ratio', {
        size: 13,
        color: warm,
        align: 'right',
        weight: 700,
        width: 90,
    })
    drawSummaryBar(242, 'A', 4, 6, blue)
    drawSummaryBar(282, 'B', 6, 6, purple)

    // Compact legend for carryover
    fig.rect(548, 344, 248, 56, {
        fill: soft(warm, theme === 'light' ? 0.08 : 0.14),
        stroke: tint(warm, c.bg, 0.45),
        strokeWidth: 1.1,
        radius: 6,
    })
    fig.text(562, 362, 'Carryover (+1, +2) bridges', {
        size: 13,
        color: warm,
        weight: 700,
        width: 224,
    })
    fig.text(562, 383, 'large chunks without starvation', {
        size: 12,
        color: c.textSecondary,
        width: 224,
    })

    return fig.render()
}
