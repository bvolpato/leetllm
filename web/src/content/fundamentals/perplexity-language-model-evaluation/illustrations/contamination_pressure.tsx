import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 370
export const alt =
    'Side-by-side comparison of evaluation partitions. Left: a contaminated split over documents d101 through d105 where d103 appears in both Train (d101, d102, d103) and Eval (d103, d201, d202), leaking training data into validation perplexity. Right: a clean rolling protocol across Runs 1 to 3 that holds decontaminated documents d201 and d202 fixed for regression tracking while rotating fresh challenge sets d301, d302, and d303.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const green = fig.tone('green')
    const isDark = theme === 'dark'

    const cellW = 46
    const cellH = 44
    const gap = 6
    const emptyFill = isDark ? '#1a202c' : '#efeae0'
    const emptyStroke = c.borderSubtle

    const drawCell = (
        x: number,
        y: number,
        state: 'empty' | 'train' | 'eval' | 'leak' | 'fresh',
        text?: string,
    ) => {
        if (state === 'empty') {
            fig.rect(x, y, cellW, cellH, {
                fill: emptyFill,
                stroke: emptyStroke,
                strokeWidth: 1,
                radius: 5,
            })
            return
        }
        const col = state === 'train' ? blue : state === 'eval' ? blue : state === 'leak' ? red : green
        const fillAmt = isDark ? 0.46 : 0.3
        fig.rect(x, y, cellW, cellH, {
            fill: tint(col, c.bg, fillAmt),
            stroke: col,
            strokeWidth: state === 'leak' ? 2.2 : 1.75,
            radius: 5,
        })
        if (text) {
            fig.text(x + cellW / 2, y + cellH / 2, text, {
                size: 13.5,
                color: isDark ? '#ffffff' : c.textPrimary,
                align: 'center',
                mono: true,
                weight: 700,
            })
        }
    }

    // ─── LEFT: Contaminated split (d101..d105) ───
    const lx = 78
    const ly = 96
    const leftCols = ['d101', 'd102', 'd103', 'd104', 'd105']

    fig.text(lx + (5 * cellW + 4 * gap) / 2, 26, 'Contaminated split', {
        size: 15.5,
        color: red,
        align: 'center',
        weight: 700,
    })
    fig.text(lx + (5 * cellW + 4 * gap) / 2, 48, 'd103 leaks into both train & eval', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Highlight halo behind leaked d103 column
    const leakColX = lx + 2 * (cellW + gap)
    fig.rect(leakColX - 4, ly - 26, cellW + 8, 2 * cellH + gap + 34, {
        fill: tint(red, c.bg, isDark ? 0.16 : 0.11),
        stroke: red,
        strokeWidth: 1.25,
        radius: 7,
    })

    leftCols.forEach((doc, j) => {
        const cx = lx + j * (cellW + gap) + cellW / 2
        fig.text(cx, ly - 13, doc, {
            size: 13.8,
            color: j === 2 ? red : c.textSecondary,
            align: 'center',
            mono: true,
            weight: j === 2 ? 700 : 600,
        })
    })

    const leftRows = [
        { name: 'Train', states: ['train', 'train', 'leak', 'empty', 'empty'] as const, labels: ['T', 'T', '!', '', ''] },
        { name: 'Eval', states: ['empty', 'empty', 'leak', 'eval', 'eval'] as const, labels: ['', '', '!', 'E', 'E'] },
    ]
    leftRows.forEach((row, i) => {
        const ry = ly + i * (cellH + gap)
        fig.text(lx - 10, ry + cellH / 2, row.name, {
            size: 13.5,
            color: c.textPrimary,
            align: 'right',
            mono: true,
            weight: 600,
        })
        row.states.forEach((st, j) => {
            drawCell(lx + j * (cellW + gap), ry, st, row.labels[j] || undefined)
        })
    })

    // Leak callout under d103
    fig.callout(
        [leakColX + cellW / 2, ly + 2 * cellH + gap + 12],
        [leakColX + cellW / 2, ly + 2 * cellH + gap + 56],
        'Overlap at d103 inflates score',
        { color: red, labelColor: red, size: 13.5, weight: 700, align: 'center', bend: 0 },
    )

    // Vertical divider
    fig.line(366, 26, 366, 336, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT: Clean rolling protocol (Fixed holdout + rotating fresh challenge) ───
    const rx = 452
    const ry0 = 96
    const rightCols = ['d201', 'd202', 'd301', 'd302', 'd303']

    fig.text(rx + (5 * cellW + 4 * gap) / 2, 26, 'Clean rolling protocol', {
        size: 15.5,
        color: green,
        align: 'center',
        weight: 700,
    })
    fig.text(rx + (5 * cellW + 4 * gap) / 2, 48, 'Fixed holdout + rotating fresh sets', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })

    rightCols.forEach((doc, j) => {
        const cx = rx + j * (cellW + gap) + cellW / 2
        fig.text(cx, ry0 - 13, doc, {
            size: 13.8,
            color: j < 2 ? blue : green,
            align: 'center',
            mono: true,
            weight: 700,
        })
    })

    for (let r = 0; r < 3; r++) {
        const ry = ry0 + r * (cellH + gap)
        fig.text(rx - 10, ry + cellH / 2, `Run ${r + 1}`, {
            size: 13.5,
            color: c.textPrimary,
            align: 'right',
            mono: true,
            weight: 600,
        })
        for (let j = 0; j < 5; j++) {
            const x = rx + j * (cellW + gap)
            if (j < 2) {
                drawCell(x, ry, 'eval', 'H')
            } else if (j === r + 2) {
                drawCell(x, ry, 'fresh', 'F')
            } else {
                drawCell(x, ry, 'empty')
            }
        }
    }

    // Braces underneath right matrix distinguishing fixed holdout vs fresh rotation
    const gridBot = ry0 + 3 * cellH + 2 * gap + 12
    fig.brace(rx, gridBot, rx + 2 * cellW + gap, gridBot, 'Fixed holdout', {
        side: 1,
        depth: 10,
        color: blue,
        labelColor: blue,
        labelSize: 13.5,
        weight: 700,
    })
    fig.brace(
        rx + 2 * (cellW + gap),
        gridBot,
        rx + 5 * cellW + 4 * gap,
        gridBot,
        'Rotating fresh',
        {
            side: 1,
            depth: 10,
            color: green,
            labelColor: green,
            labelSize: 13.5,
            weight: 700,
        },
    )

    // Compact bottom key
    const keyY = 344
    fig.text(rx + (5 * cellW + 4 * gap) / 2, keyY, 'H = fixed holdout · F = fresh challenge', {
        size: 13.8,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
