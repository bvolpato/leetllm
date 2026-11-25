import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 435
export const alt =
    'Step-level compute conservation and unit-consistency comparison for a 4-GPU node running a 0.2-second forward pass. Top left: four parallel GPU lanes each execute for 0.2 s, totaling 0.8 GPU-seconds or 0.2 node-seconds, split 25 percent to Tenant A and 75 percent to Tenant B. Top right: conserved allocation divides the $0.000444 step cost into $0.000111 for Tenant A and $0.000333 for Tenant B. Bottom: aligned cost bars show GPU-second and node-second bases matching at $0.000444, while multiplying GPU-seconds by the node-hour rate creates a 4x overcharge ($0.001778).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const onBlue = getReadableTextColor(blue, c, c.bg)
    const onPurple = getReadableTextColor(purple, c, c.bg)
    const onGreen = getReadableTextColor(green, c, c.bg)
    const onRed = getReadableTextColor(red, c, c.bg)
    const soft = (hex: string, la = 0.1, da = 0.16) => tint(hex, c.bg, theme === 'light' ? la : da)

    // Panel 1 (4 parallel GPU lanes for 0.2 s step, split 25% A / 75% B)
    fig.text(24, 24, '1. 4-GPU FORWARD STEP (0.20 s)', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 280,
    })
    const laneX = 88
    const laneW = 240
    const aW = Math.round(laneW * 0.25)
    const bW = laneW - aW - 2
    for (let g = 0; g < 4; g++) {
        const y = 52 + g * 34
        fig.text(78, y + 12, `GPU ${g}`, {
            size: 13,
            color: c.textPrimary,
            align: 'right',
            weight: 600,
            mono: true,
            width: 56,
        })
        fig.rect(laneX, y, aW, 24, { fill: blue, radius: 4 })
        fig.rect(laneX + aW + 2, y, bW, 24, { fill: purple, radius: 4 })
        if (g === 0) {
            fig.text(laneX + aW / 2, y + 12, 'A 25%', {
                size: 11,
                color: onBlue,
                align: 'center',
                weight: 700,
                width: aW - 2,
            })
            fig.text(laneX + aW + 2 + bW / 2, y + 12, 'Tenant B · 75% of batch', {
                size: 12,
                color: onPurple,
                align: 'center',
                weight: 700,
                width: bW - 8,
            })
        }
    }
    // Curly brace summarizing 4 x 0.2s = 0.8 GPU-s
    fig.brace(laneX + laneW + 8, 52, laneX + laneW + 8, 178, undefined, {
        depth: 10,
        side: -1,
        color: c.textMuted,
    })
    fig.text(354, 104, '0.8 GPU-s', {
        size: 14,
        color: c.textPrimary,
        weight: 700,
        mono: true,
        width: 90,
    })
    fig.text(354, 126, '0.2 node-s', {
        size: 13,
        color: c.textSecondary,
        mono: true,
        width: 90,
    })

    // Panel 2 (Conserved Tenant Split $0.000444 = $0.000111 + $0.000333)
    fig.line(454, 24, 454, 194, { color: c.borderSubtle, width: 1 })
    fig.text(476, 24, '2. CONSERVED COST SPLIT (100%)', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 300,
    })

    const splitX = 476
    const splitW = 320
    const splitA = Math.round(splitW * 0.25)
    const splitB = splitW - splitA - 3
    fig.rect(splitX, 54, splitA, 38, { fill: blue, radius: 6 })
    fig.text(splitX + splitA / 2, 73, 'A · 25%', {
        size: 13,
        color: onBlue,
        align: 'center',
        weight: 700,
        width: splitA - 4,
    })
    fig.rect(splitX + splitA + 3, 54, splitB, 38, { fill: purple, radius: 6 })
    fig.text(splitX + splitA + 3 + splitB / 2, 73, 'Tenant B · 75%', {
        size: 13,
        color: onPurple,
        align: 'center',
        weight: 700,
        width: splitB - 8,
    })

    // Clean breakdown values below bar
    fig.text(splitX, 114, 'Tenant A: 0.20 GPU-s', {
        size: 13,
        color: blue,
        weight: 600,
        width: 155,
    })
    fig.text(splitX, 134, '$0.000111', {
        size: 14,
        color: blue,
        weight: 700,
        mono: true,
        width: 140,
    })
    fig.text(splitX + 168, 114, 'Tenant B: 0.60 GPU-s', {
        size: 13,
        color: purple,
        weight: 600,
        width: 155,
    })
    fig.text(splitX + 168, 134, '$0.000333', {
        size: 14,
        color: purple,
        weight: 700,
        mono: true,
        width: 140,
    })
    fig.line(splitX, 156, splitX + splitW, 156, { color: c.borderSubtle, width: 1 })
    fig.text(splitX, 174, 'Sum = $0.000444 (100% conserved)', {
        size: 13,
        color: green,
        weight: 700,
        mono: true,
        width: 320,
    })

    // Horizontal divider before unit-consistency bar chart
    fig.line(24, 212, 796, 212, { color: c.borderSubtle, width: 1, dash: '5 4' })

    // Bottom: Aligned cost basis comparison (0..$0.0020 scale)
    fig.text(24, 234, '3. UNIT CONSISTENCY VS. 4x OVERCHARGE BUG', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 360,
    })

    const costPlot = fig.plot({ x: 244, y: 256, width: 520, height: 126 }, { x: [0, 0.002], y: [0, 3] })
    for (const tick of [0, 0.0005, 0.001, 0.0015, 0.002]) {
        const x = costPlot.px(tick)
        fig.line(x, 256, x, 382, { color: c.borderSubtle, width: 1, opacity: 0.7 })
        fig.line(x, 382, x, 388, { color: c.textMuted, width: 1.2 })
        fig.text(x, 404, tick === 0 ? '$0' : `$${tick.toFixed(4)}`, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
            width: 68,
        })
    }
    fig.line(costPlot.px(0), 382, costPlot.px(0.002), 382, { color: c.textMuted, width: 1.3 })

    const rows = [
        {
            y: 262,
            title: 'GPU-s x $2/GPU-hr',
            val: 0.000444444,
            tag: '$0.000444 (1x)',
            color: green,
            ink: onGreen,
        },
        {
            y: 302,
            title: 'Node-s x $8/node-hr',
            val: 0.000444444,
            tag: '$0.000444 (1x)',
            color: green,
            ink: onGreen,
        },
        {
            y: 342,
            title: 'GPU-s x $8/node-hr (Bug)',
            val: 0.001777778,
            tag: '$0.001778 (4x overcharge!)',
            color: red,
            ink: onRed,
        },
    ]

    for (const r of rows) {
        fig.text(232, r.y + 15, r.title, {
            size: 13,
            color: r.color === red ? red : c.textPrimary,
            align: 'right',
            weight: r.color === red ? 700 : 600,
            width: 210,
        })
        const bw = costPlot.px(r.val) - costPlot.px(0)
        fig.rect(costPlot.px(0), r.y, bw, 30, { fill: r.color, radius: 5 })
        if (bw > 180) {
            fig.text(costPlot.px(0) + bw - 10, r.y + 15, r.tag, {
                size: 13,
                color: r.ink,
                align: 'right',
                weight: 700,
                mono: true,
                width: bw - 16,
            })
        } else {
            fig.text(costPlot.px(0) + bw + 10, r.y + 15, r.tag, {
                size: 13,
                color: r.color,
                weight: 700,
                mono: true,
                width: 150,
            })
        }
    }

    // Highlight subtle vertical reference at true step cost ($0.000444)
    fig.line(costPlot.px(0.000444444), 254, costPlot.px(0.000444444), 382, {
        color: green,
        width: 1.25,
        dash: '4 3',
        opacity: 0.85,
    })

    // Unused variable guard removed cleanly via soft highlight pill on right
    fig.rect(584, 266, 180, 56, {
        fill: soft(green, 0.09, 0.14),
        stroke: tint(green, c.bg, 0.45),
        strokeWidth: 1.1,
        radius: 6,
    })
    fig.text(674, 285, 'Exact match', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
        width: 164,
    })
    fig.text(674, 305, '0.8 x $2 = 0.2 x $8', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
        width: 164,
    })

    return fig.render()
}
