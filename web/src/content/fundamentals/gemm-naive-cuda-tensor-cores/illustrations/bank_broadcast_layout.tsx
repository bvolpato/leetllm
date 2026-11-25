import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'Shared-memory bank layout across a 32-lane warp at k=3. Top strip shows 16x16 block conflict-free broadcasts (As[ty][3] broadcasts banks 3 and 19; Bs[3][tx] spans banks 16..31 twice in 1 wave). Left bank grids compare rows r0..r3 and columns k0..k3 across Stride-32 tile[32][32] (all rows hit bank 3, 32-way conflict), Pad [32][33] (banks 3, 4, 5, 6), and Full XOR k^r (banks 3, 2, 1, 0; physical row 1 order 1, 0, 3, 2). Right horizontal bar chart shows bank service waves dropping from 32 (Stride-32) and 4 (Grouped XOR) to 1 (Pad 33 and Full XOR).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // --- Top strip: 16x16 conflict-free broadcast summary ---
    fig.rect(28, 16, 704, 52, {
        fill: tint(green, c.bg, theme === 'light' ? 0.1 : 0.14),
        stroke: tint(green, c.bg, 0.45),
        strokeWidth: 1,
        radius: 8,
    })
    fig.text(44, 42, '16×16 Block (k = 3):', { size: 14, weight: 600, color: green })
    fig.text(200, 42, 'As[ty][3] → b3, b19 (broadcast)', {
        size: 13,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(468, 42, 'Bs[3][tx] → b16..31 × 2', {
        size: 13,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(716, 42, '1 wave', {
        size: 14,
        weight: 600,
        color: green,
        align: 'right',
        mono: true,
    })

    // --- Left: Three 4x4 bank-index grids highlighting column k = 3 ---
    fig.text(28, 96, 'Column k = 3 bank map (rows r0..r3)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const drawBankGrid = (
        gx: number,
        gy: number,
        title: string,
        sub: string,
        tone: string,
        banks: number[][],
    ) => {
        const cellW = 28
        const cellH = 28
        const gap = 4
        const gridW = 4 * cellW + 3 * gap

        fig.text(gx + gridW / 2, gy - 24, title, {
            size: 13,
            weight: 600,
            color: tone,
            align: 'center',
        })

        // Column headers k0..k3
        for (let k = 0; k < 4; k++) {
            const cx = gx + k * (cellW + gap) + cellW / 2
            fig.text(cx, gy - 6, `k${k}`, {
                size: 12,
                color: k === 3 ? tone : c.textMuted,
                weight: k === 3 ? 600 : 400,
                align: 'center',
                mono: true,
            })
        }

        // Cells
        for (let r = 0; r < 4; r++) {
            for (let k = 0; k < 4; k++) {
                const x = gx + k * (cellW + gap)
                const y = gy + 6 + r * (cellH + gap)
                const isTarget = k === 3
                fig.rect(x, y, cellW, cellH, {
                    fill: isTarget
                        ? tint(tone, c.bg, theme === 'light' ? 0.22 : 0.35)
                        : tint(blue, c.bg, theme === 'light' ? 0.08 : 0.14),
                    stroke: isTarget ? tone : c.borderSubtle,
                    strokeWidth: isTarget ? 1.75 : 0.75,
                    radius: 4,
                })
                fig.text(x + cellW / 2, y + cellH / 2, String(banks[r]![k]!), {
                    size: 13,
                    weight: isTarget ? 700 : 500,
                    color: isTarget ? c.textPrimary : c.textSecondary,
                    align: 'center',
                    mono: true,
                })
            }
        }

        const bottomY = gy + 6 + 4 * (cellH + gap) + 12
        fig.text(gx + gridW / 2, bottomY, sub, {
            size: 12,
            color: tone,
            weight: 600,
            align: 'center',
            mono: true,
        })
    }

    const rowBaseY = 152
    // Row labels r0..r3 once on far left
    for (let r = 0; r < 4; r++) {
        fig.text(44, rowBaseY + 6 + r * 32 + 14, `r${r}`, {
            size: 12,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }

    const stride32 = [
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
    ]
    const pad33 = [
        [0, 1, 2, 3],
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6],
    ]
    const fullXor = [
        [0, 1, 2, 3],
        [1, 0, 3, 2],
        [2, 3, 0, 1],
        [3, 2, 1, 0],
    ]

    drawBankGrid(56, rowBaseY, 'Stride-32', '3,3,3,3 (32x)', red, stride32)
    drawBankGrid(202, rowBaseY, 'Pad [32][33]', '3,4,5,6 (1x)', green, pad33)
    drawBankGrid(348, rowBaseY, 'XOR (k ^ r)', '3,2,1,0 (1x)', green, fullXor)

    // Footnote below grids showing physical row-1 permutation
    fig.text(264, 344, 'Row 1 physical order under XOR: 1, 0, 3, 2  ·  32 unique banks across warp', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Subtle vertical separator
    fig.line(494, 92, 494, 404, { color: c.borderSubtle, width: 1 })

    // --- Right: Clean horizontal bar chart of bank service waves ---
    fig.text(514, 96, 'Service waves / col read', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const barLeft = 588
    const barMaxW = 114
    const maxVal = 32
    const rows = [
        { label: 'Stride-32', sub: '[32][32]', value: 32, color: red },
        { label: 'Grp XOR', sub: 'k^(r//4)', value: 4, color: warm },
        { label: 'Pad 33', sub: '[32][33]', value: 1, color: green },
        { label: 'Full XOR', sub: 'k ^ r', value: 1, color: green },
    ]

    // Baseline axis & ticks
    const axisTop = 132
    const axisBot = 368
    fig.line(barLeft, axisTop, barLeft, axisBot, { color: c.textMuted, width: 1 })
    for (const tick of [0, 8, 16, 32]) {
        const tx = barLeft + (tick / maxVal) * barMaxW
        if (tick > 0) {
            fig.line(tx, axisTop, tx, axisBot, {
                color: c.borderSubtle,
                width: 1,
                dash: '3 3',
            })
        }
        fig.text(tx, axisBot + 16, String(tick), {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(barLeft + barMaxW / 2, axisBot + 36, 'Waves (lower is faster)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    rows.forEach((row, idx) => {
        const cy = 162 + idx * 58
        const w = Math.max(8, (row.value / maxVal) * barMaxW)
        fig.text(barLeft - 8, cy - 8, row.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
        })
        fig.text(barLeft - 8, cy + 10, row.sub, {
            size: 12,
            color: c.textMuted,
            align: 'right',
            mono: true,
        })
        fig.rect(barLeft, cy - 13, w, 26, {
            fill: tint(row.color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: row.color,
            strokeWidth: 1.25,
            radius: 4,
        })
        fig.text(barLeft + w + 8, cy, String(row.value), {
            size: 14,
            weight: 700,
            color: row.color,
            mono: true,
        })
    })

    return fig.render()
}

export default create
