import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 430
export const preset = 'engineering'
export const alt =
    'On one 0 to 60 GB scale, a 27-billion-weight payload falls from 54 GB at BF16 to 27 GB at INT8, 13.5 GB of INT4 codes plus 0.421875 GB of group scales, and 10.125 GB of INT3 codes plus the same scales. The 24 GB line leaves other allocations to budget. One 128-weight INT4 group stores 64 code bytes and a 2-byte FP16 scale, totaling 4.125 bits per weight.'

const parameters = 27_000_000_000
const scaleGroups = Math.ceil(parameters / 128)
const scaleGb = (scaleGroups * 2) / 1e9 // 0.421875 GB

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    // --- Header & Swatch Legend ---
    fig.text(32, 22, '27B weight payload by precision (decimal GB)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // Crisp swatch legend (right-aligned, well separated)
    const legY = 48
    fig.rect(32, legY - 6, 12, 12, { fill: blue, radius: 3 })
    fig.text(50, legY, 'Code payload', { size: 13, color: c.textSecondary })

    fig.rect(164, legY - 6, 12, 12, { fill: warm, radius: 3 })
    fig.text(182, legY, 'FP16 group scales (g=128)', { size: 13, color: c.textSecondary })

    fig.line(388, legY, 408, legY, { color: warm, width: 2, dash: '4 3' })
    fig.text(416, legY, '24 GB GPU envelope', { size: 13, weight: 600, color: warm })

    // --- Top Chart: 0..60 GB Horizontal Stacked Bars ---
    const x0 = 96
    const x1 = 626
    const axisTop = 74
    const axisBot = 246
    const xOf = (gb: number) => x0 + (gb / 60) * (x1 - x0)

    // Gridlines & ticks
    for (const tick of [0, 12, 24, 36, 48, 60]) {
        const tx = xOf(tick)
        const isCap = tick === 24
        fig.line(tx, axisTop, tx, axisBot, {
            color: isCap ? warm : c.borderSubtle,
            width: isCap ? 2 : 1,
            dash: isCap ? '6 4' : undefined,
            opacity: isCap ? 0.95 : 0.75,
        })
        fig.text(tx, axisBot + 16, String(tick), {
            size: 12,
            weight: isCap ? 700 : 400,
            color: isCap ? warm : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(x1 + 26, axisBot + 16, 'GB', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })
    fig.text(xOf(24) + 6, axisTop + 8, '24 GB', {
        size: 12,
        weight: 700,
        color: warm,
        mono: true,
    })

    const rows = [
        { name: 'BF16', code: 54, meta: 0, total: 54, color: blue, val: '54.00 GB' },
        { name: 'INT8', code: 27, meta: 0, total: 27, color: purple, val: '27.00 GB' },
        {
            name: 'INT4',
            code: 13.5,
            meta: scaleGb,
            total: 13.5 + scaleGb,
            color: blue,
            val: '13.92 GB (+0.42 scale)',
        },
        {
            name: 'INT3',
            code: 10.125,
            meta: scaleGb,
            total: 10.125 + scaleGb,
            color: green,
            val: '10.55 GB (+0.42 scale)',
        },
    ]

    rows.forEach((row, idx) => {
        const cy = 104 + idx * 40
        const barH = 22
        const codeW = xOf(row.code) - x0
        const totalX = xOf(row.total)

        fig.text(x0 - 12, cy, row.name, {
            size: 14,
            weight: 700,
            color: row.color,
            align: 'right',
            mono: true,
        })
        fig.rect(x0, cy - barH / 2, codeW, barH, {
            fill: tint(row.color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: row.color,
            strokeWidth: 1.25,
            radius: 4,
        })
        if (row.meta > 0) {
            const metaW = Math.max(5, totalX - (x0 + codeW))
            fig.rect(x0 + codeW, cy - barH / 2, metaW, barH, {
                fill: warm,
                radius: 2,
            })
        }
        const labelX = row.meta > 0 ? Math.max(totalX + 10, xOf(24) + 12) : totalX + 10
        if (row.meta > 0) {
            fig.line(totalX + 2, cy, labelX - 4, cy, {
                color: c.textMuted,
                width: 1,
                dash: '2 2',
            })
        }
        fig.text(labelX, cy, row.val, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            mono: true,
        })
    })

    // Hairline separator
    fig.line(32, 282, 708, 282, { color: c.borderSubtle, width: 1 })

    // --- Bottom: Zoom into one 128-weight INT4 group ---
    fig.text(32, 304, 'Zoom · one INT4 group of 128 weights', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(708, 304, '66 B / 128 w = 4.125 bpw (+3.125%)', {
        size: 13,
        weight: 600,
        color: warm,
        align: 'right',
        mono: true,
    })

    const stripY = 332
    const stripH = 34
    const blockW = 62
    const blockGap = 6
    const stripX = 42
    for (let i = 0; i < 8; i++) {
        const bx = stripX + i * (blockW + blockGap)
        fig.rect(bx, stripY, blockW, stripH, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.2 : 0.3),
            stroke: blue,
            strokeWidth: 1.4,
            radius: 5,
        })
        fig.text(bx + blockW / 2, stripY + stripH / 2, '8 B', {
            size: 12,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    }

    const scaleX = stripX + 8 * (blockW + blockGap) + 10
    const scaleW = 104
    fig.rect(scaleX, stripY, scaleW, stripH, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.24 : 0.36),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 5,
    })
    fig.text(scaleX + scaleW / 2, stripY + stripH / 2, 'FP16 · 2 B', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Dimension braces below
    const codeEnd = stripX + 8 * blockW + 7 * blockGap
    fig.brace(stripX, stripY + stripH + 6, codeEnd, stripY + stripH + 6, '8 × 8 B = 64 code bytes (128 × 4-bit)', {
        side: 1,
        depth: 8,
        color: blue,
        labelColor: blue,
        labelSize: 13,
        labelGap: 14,
        weight: 600,
    })
    fig.brace(scaleX, stripY + stripH + 6, scaleX + scaleW, stripY + stripH + 6, '1 scale', {
        side: 1,
        depth: 8,
        color: warm,
        labelColor: warm,
        labelSize: 13,
        labelGap: 14,
        weight: 600,
    })

    return fig.render()
}

export default create
