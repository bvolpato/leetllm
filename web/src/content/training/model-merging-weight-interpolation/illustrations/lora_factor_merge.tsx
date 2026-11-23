import { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 520
export const alt =
    'At unit scales s₁ = s₂ = 1, two rank-one adapters have A1 = [1,0], B1 = [1,0]ᵀ and A2 = [0,1], B2 = [0,1]ᵀ. Averaging their effective deltas with equal weights gives the diagonal matrix with 0.5 on each diagonal. Averaging A and B separately then multiplying gives four 0.25 entries because of cross terms. Concatenating the original factors represents the exact sum at rank two.'

export const numericFixture = {
    A1: [[1, 0]],
    B1: [[1], [0]],
    A2: [[0, 1]],
    B2: [[0], [1]],
    delta1: [
        [1, 0],
        [0, 0],
    ],
    delta2: [
        [0, 0],
        [0, 1],
    ],
    weightedDeltaMean: [
        [0.5, 0],
        [0, 0.5],
    ],
    factorAverageProduct: [
        [0.25, 0.25],
        [0.25, 0.25],
    ],
    concatRank: 2,
}

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

function matrix(
    c: ReturnType<typeof getThemeColors>,
    values: string[][],
    x: number,
    y: number,
    cellW: number,
    cellH: number,
    color: string,
) {
    const shapes: ReactNode[] = []
    const labels: ReactNode[] = []
    values.forEach((row, r) =>
        row.forEach((value, col) => {
            const cx = x + col * cellW
            const cy = y + r * cellH
            shapes.push(
                SvgFrame({
                    c,
                    x: cx,
                    y: cy,
                    width: cellW,
                    height: cellH,
                    rx: 4,
                    fill: c.bgCard,
                    stroke: color,
                    strokeWidth: 1.5,
                    key: `cell-${x}-${y}-${r}-${col}`,
                }),
            )
            labels.push(label(c, value, cx, cy + 2, cellW, cellH - 2, 16, c.textPrimary, 'center'))
        }),
    )
    return { shapes, labels, width: values[0].length * cellW, height: values.length * cellH }
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const left = getReadableToneColor('cyan', c)
    const right = getReadableToneColor('purple', c)
    const exact = getReadableToneColor('green', c)
    const wrong = getReadableToneColor('critical', c)

    // Left column: individual adapters & delta average
    const b1 = matrix(c, [['1'], ['0']], 40, 130, 32, 28, left)
    const a1 = matrix(c, [['1', '0']], 115, 144, 32, 28, left)
    const d1 = matrix(
        c,
        [
            ['1', '0'],
            ['0', '0'],
        ],
        250,
        130,
        32,
        28,
        left,
    )

    const b2 = matrix(c, [['0'], ['1']], 40, 230, 32, 28, right)
    const a2 = matrix(c, [['0', '1']], 115, 244, 32, 28, right)
    const d2 = matrix(
        c,
        [
            ['0', '0'],
            ['0', '1'],
        ],
        250,
        230,
        32,
        28,
        right,
    )

    const exactMean = matrix(
        c,
        [
            ['0.5', '0'],
            ['0', '0.5'],
        ],
        160,
        350,
        38,
        32,
        exact,
    )

    // Right column: naive factor average vs concatenation
    const meanB = matrix(c, [['0.5'], ['0.5']], 470, 130, 36, 28, wrong)
    const meanA = matrix(c, [['0.5', '0.5']], 545, 144, 36, 28, wrong)
    const factorMean = matrix(
        c,
        [
            ['0.25', '0.25'],
            ['0.25', '0.25'],
        ],
        700,
        130,
        42,
        28,
        wrong,
    )

    const bConcat = matrix(
        c,
        [
            ['0.5', '0'],
            ['0', '0.5'],
        ],
        470,
        310,
        36,
        28,
        exact,
    )
    const aConcat = matrix(
        c,
        [
            ['1', '0'],
            ['0', '1'],
        ],
        585,
        310,
        36,
        28,
        exact,
    )
    const concatResult = matrix(
        c,
        [
            ['0.5', '0'],
            ['0', '0.5'],
        ],
        720,
        310,
        36,
        28,
        exact,
    )

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Panel backgrounds
        SvgFrame({
            c,
            x: 20,
            y: 70,
            width: 390,
            height: 380,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        SvgFrame({
            c,
            x: 430,
            y: 70,
            width: 410,
            height: 380,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),
        ...b1.shapes,
        ...a1.shapes,
        ...d1.shapes,
        ...b2.shapes,
        ...a2.shapes,
        ...d2.shapes,
        ...exactMean.shapes,
        ...meanB.shapes,
        ...meanA.shapes,
        ...factorMean.shapes,
        ...bConcat.shapes,
        ...aConcat.shapes,
        ...concatResult.shapes,
        // Arrows left
        VectorArrow({
            x1: 190,
            y1: 158,
            x2: 235,
            y2: 158,
            color: left,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        VectorArrow({
            x1: 190,
            y1: 258,
            x2: 235,
            y2: 258,
            color: right,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        // Arrows right
        VectorArrow({
            x1: 635,
            y1: 158,
            x2: 685,
            y2: 158,
            color: wrong,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        VectorArrow({
            x1: 670,
            y1: 338,
            x2: 705,
            y2: 338,
            color: exact,
            strokeWidth: 2,
            arrowSize: 6,
        }),
    )

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({ x: 0, y: 0, width, height, children: shapeSvg }),
                label(
                    c,
                    'Average the updates, not the factors',
                    20,
                    12,
                    width - 40,
                    30,
                    22,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Unit scales s₁ = s₂ = 1 · each ΔW = BA',
                    20,
                    42,
                    width - 40,
                    24,
                    15,
                    c.textSecondary,
                    'center',
                ),

                // Left panel labels
                label(
                    c,
                    'Individual Adapters & Target Delta Mean',
                    35,
                    82,
                    360,
                    24,
                    16,
                    c.textPrimary,
                ),
                label(c, 'B₁', 32, 108, 48, 20, 15, left, 'center'),
                label(c, 'A₁', 123, 122, 48, 20, 15, left, 'center'),
                label(c, 'Δ₁ = B₁A₁', 230, 108, 70, 20, 15, left, 'center'),
                label(c, '×', 82, 146, 24, 24, 18, left, 'center'),

                label(c, 'B₂', 32, 208, 48, 20, 15, right, 'center'),
                label(c, 'A₂', 123, 222, 48, 20, 15, right, 'center'),
                label(c, 'Δ₂ = B₂A₂', 230, 208, 70, 20, 15, right, 'center'),
                label(c, '×', 82, 246, 24, 24, 18, right, 'center'),

                label(c, 'Target: 0.5 Δ₁ + 0.5 Δ₂ (Rank 2)', 35, 315, 360, 22, 15, exact, 'center'),
                label(
                    c,
                    'Diagonal preserved exactly, rank 2',
                    35,
                    420,
                    360,
                    20,
                    13,
                    exact,
                    'center',
                ),

                // Right panel labels
                label(
                    c,
                    'Factor Operations: Naive vs Concatenation',
                    445,
                    82,
                    380,
                    24,
                    16,
                    c.textPrimary,
                ),
                label(c, 'Naive factor average adds cross terms', 445, 108, 380, 20, 14, wrong),
                label(c, 'B̄', 464, 108, 48, 20, 15, wrong, 'center'),
                label(c, 'Ā', 555, 122, 48, 20, 15, wrong, 'center'),
                label(c, '×', 516, 146, 24, 24, 18, wrong, 'center'),
                label(c, 'B̄Ā (rank 1, error)', 670, 108, 120, 20, 14, wrong, 'center'),
                label(
                    c,
                    'Spurious cross terms: 0.25 off-diagonal entries',
                    445,
                    200,
                    380,
                    20,
                    13,
                    wrong,
                    'center',
                ),

                label(
                    c,
                    'Concatenate factors: exact sum at rank r₁ + r₂',
                    445,
                    250,
                    380,
                    22,
                    15,
                    exact,
                ),
                label(c, '[0.5 B₁, 0.5 B₂]', 440, 286, 96, 20, 13, exact, 'center'),
                label(c, '[A₁; A₂]', 565, 286, 76, 20, 13, exact, 'center'),
                label(c, '×', 553, 322, 24, 24, 18, exact, 'center'),
                label(c, 'Exact (rank 2)', 695, 286, 86, 20, 13, exact, 'center'),
                label(
                    c,
                    'Absorbs scaling into B, preserves exact sum',
                    445,
                    420,
                    380,
                    20,
                    13,
                    exact,
                    'center',
                ),

                ...b1.labels,
                ...a1.labels,
                ...d1.labels,
                ...b2.labels,
                ...a2.labels,
                ...d2.labels,
                ...exactMean.labels,
                ...meanB.labels,
                ...meanA.labels,
                ...factorMean.labels,
                ...bConcat.labels,
                ...aConcat.labels,
                ...concatResult.labels,

                label(
                    c,
                    'Low-rank parameter composition geometry · Concatenating factors represents the sum exactly',
                    20,
                    470,
                    width - 40,
                    24,
                    15,
                    c.textSecondary,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
