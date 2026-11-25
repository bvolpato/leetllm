import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 420
export const alt =
    'Eight rows (tr1 to tr4 train, va1 to va4 validation) with binary features T, L, and target y feed two feature selectors. Leaky selection scans all eight rows, finding class-mean separation 0.50 for T and 0.75 for L, picking L and scoring 4/4 on validation. Honest selection scans only the four training rows, finding separation 1.00 for T and 0.50 for L, picking T and revealing the true 2/4 validation score.'

const ROWS: readonly { id: string; split: 'train' | 'val'; t: number; l: number; y: number }[] = [
    { id: 'tr1', split: 'train', t: 1, l: 1, y: 1 },
    { id: 'tr2', split: 'train', t: 1, l: 0, y: 1 },
    { id: 'tr3', split: 'train', t: 0, l: 0, y: 0 },
    { id: 'tr4', split: 'train', t: 0, l: 0, y: 0 },
    { id: 'va1', split: 'val', t: 1, l: 1, y: 1 },
    { id: 'va2', split: 'val', t: 1, l: 0, y: 0 },
    { id: 'va3', split: 'val', t: 0, l: 1, y: 1 },
    { id: 'va4', split: 'val', t: 0, l: 0, y: 0 },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // Left section: visual 8-row binary feature matrix
    const matX = 90
    const matY = 66
    const cellW = 46
    const cellH = 32
    const gapX = 6
    const gapY = 5
    const splitGap = 16

    fig.text(matX + (3 * cellW + 2 * gapX) / 2, 24, '8 binary rows', {
        size: 15,
        weight: 600,
        align: 'center',
    })

    const colNames = ['T', 'L', 'y']
    colNames.forEach((col, j) => {
        fig.text(matX + j * (cellW + gapX) + cellW / 2, 49, col, {
            size: 13,
            weight: 700,
            color: j === 2 ? warm : c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    const rowY = (i: number) => matY + i * (cellH + gapY) + (i >= 4 ? splitGap : 0)

    ROWS.forEach((row, i) => {
        const y = rowY(i)
        fig.text(matX - 12, y + cellH / 2, row.id, {
            size: 13,
            color: row.split === 'train' ? green : red,
            weight: 600,
            align: 'right',
            mono: true,
        })
        const vals = [row.t, row.l, row.y]
        vals.forEach((v, j) => {
            const x = matX + j * (cellW + gapX)
            const activeTone = j === 2 ? warm : row.split === 'train' ? blue : red
            const fill =
                v === 1
                    ? tint(activeTone, c.bg, isLight ? 0.24 : 0.34)
                    : tint(c.textMuted, c.bg, isLight ? 0.06 : 0.1)
            fig.rect(x, y, cellW, cellH, {
                fill,
                stroke: v === 1 ? activeTone : c.borderSubtle,
                strokeWidth: v === 1 ? 1.4 : 0.8,
                radius: 5,
            })
            fig.text(x + cellW / 2, y + cellH / 2, String(v), {
                size: 13,
                weight: v === 1 ? 700 : 400,
                color: v === 1 ? c.textPrimary : c.textMuted,
                align: 'center',
                mono: true,
            })
        })
    })

    // Train / Val wall line
    const wallY = matY + 4 * (cellH + gapY) + splitGap / 2 - gapY / 2
    fig.line(10, wallY, matX + 3 * cellW + 2 * gapX + 10, wallY, {
        color: c.textMuted,
        width: 1.5,
        dash: '5 4',
    })
    fig.text(10, matY + 70, 'Train', {
        size: 12,
        weight: 700,
        color: green,
    })
    fig.text(10, wallY + 76, 'Val', {
        size: 12,
        weight: 700,
        color: red,
    })

    // Brackets from matrix to the two selector tracks
    const matRight = matX + 3 * cellW + 2 * gapX + 14
    const topEnd = matY + 4 * (cellH + gapY) - gapY
    const botEnd = rowY(7) + cellH

    // Green bracket for Train-only (Honest) -> goes to bottom track
    // Red bracket for All 8 rows (Leaky) -> goes to top track
    fig.line(matRight + 8, matY + 4, matRight + 16, matY + 4, { color: red, width: 1.8 })
    fig.line(matRight + 16, matY + 4, matRight + 16, botEnd - 4, { color: red, width: 1.8 })
    fig.line(matRight + 8, botEnd - 4, matRight + 16, botEnd - 4, { color: red, width: 1.8 })
    fig.arrow(matRight + 16, 118, 326, 118, { color: red, width: 2, head: 7 })
    fig.text(298, 98, 'all 8', { size: 12, weight: 600, color: red, align: 'center' })

    fig.line(matRight + 2, matY + 8, matRight + 8, matY + 8, { color: green, width: 1.8 })
    fig.line(matRight + 8, matY + 8, matRight + 8, topEnd - 8, { color: green, width: 1.8 })
    fig.line(matRight + 2, topEnd - 8, matRight + 8, topEnd - 8, { color: green, width: 1.8 })
    fig.path(`M${matRight + 8} ${172} L288 172 L288 298 L319 298`, {
        color: green,
        width: 2,
    })
    fig.arrow(310, 298, 326, 298, { color: green, width: 2, head: 7 })
    fig.text(288, 316, 'train 4', { size: 12, weight: 600, color: green, align: 'left' })

    // Right side: Two aligned horizontal bar comparisons (Leaky top, Honest bottom)
    const barX = 406
    const barW = 240
    const drawSelectorTrack = (
        yTop: number,
        title: string,
        tone: string,
        tVal: number,
        lVal: number,
        winner: 'T' | 'L',
        valScore: string,
        valNote: string,
    ) => {
        fig.rect(334, yTop - 16, 502, 152, {
            fill: tint(tone, c.bg, isLight ? 0.06 : 0.09),
            stroke: tint(tone, c.borderSubtle, 0.35),
            strokeWidth: 1,
            radius: 8,
        })
        fig.text(350, yTop + 4, title, {
            size: 14,
            weight: 700,
            color: tone,
        })
        fig.math(644, yTop + 4, '|\\mu_1 - \\mu_0|', {
            size: 13,
            color: c.textSecondary,
            align: 'right',
        })

        // Shared 0..1 baseline axis ticks
        for (const tick of [0, 0.5, 1.0]) {
            const tx = barX + tick * barW
            fig.line(tx, yTop + 26, tx, yTop + 104, {
                color: c.borderSubtle,
                width: 1,
                dash: tick === 0 ? undefined : '3 3',
            })
            fig.text(tx, yTop + 118, tick.toFixed(1), {
                size: 11,
                color: c.textMuted,
                align: 'center',
                mono: true,
            })
        }

        const bars: readonly { label: string; val: number; isWin: boolean; y: number }[] = [
            { label: 'Feat T', val: tVal, isWin: winner === 'T', y: yTop + 34 },
            { label: 'Feat L', val: lVal, isWin: winner === 'L', y: yTop + 72 },
        ]
        for (const b of bars) {
            const bw = b.val * barW
            const fill = b.isWin ? tone : tint(c.textMuted, c.bg, isLight ? 0.32 : 0.36)
            fig.text(barX - 10, b.y + 12, b.label, {
                size: 13,
                weight: b.isWin ? 700 : 500,
                color: b.isWin ? c.textPrimary : c.textSecondary,
                align: 'right',
                mono: true,
            })
            fig.rect(barX, b.y, bw, 24, { fill, radius: 4 })
            fig.text(barX + bw + 8, b.y + 12, b.val.toFixed(2), {
                size: 13,
                weight: b.isWin ? 700 : 500,
                color: b.isWin ? tone : c.textSecondary,
                mono: true,
            })
        }

        // Right outcome readout
        const outX = 760
        fig.line(696, yTop + 26, 696, yTop + 114, { color: c.borderSubtle, width: 1 })
        fig.text(outX, yTop + 36, `Picks ${winner}`, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
            align: 'center',
        })
        fig.text(outX, yTop + 68, valScore, {
            size: 24,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
        fig.text(outX, yTop + 98, valNote, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
    }

    drawSelectorTrack(
        60,
        'Leaky selector (scans all 8 rows)',
        red,
        0.5,
        0.75,
        'L',
        '4 / 4',
        'val acc = 1.00 (leaked)',
    )

    drawSelectorTrack(
        242,
        'Honest selector (train fold only)',
        green,
        1.0,
        0.5,
        'T',
        '2 / 4',
        'val acc = 0.50 (true)',
    )

    return fig.render()
}

export default create
