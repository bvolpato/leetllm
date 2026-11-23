import { createElement } from 'react'
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

export const width = 560
export const height = 730
export const alt =
    'A fixed DARE example starts with task delta [0.2, −0.4, 0.1, 0.6], uses drop probability 0.5 and mask [0,0,1,1], then rescales kept entries by two to get [0,0,0.2,1.2]. Across all sixteen equally likely masks, each coordinate expectation returns to its original delta.'
export const numericFixture = {
    delta: [0.2, -0.4, 0.1, 0.6],
    dropProbability: 0.5,
    keepProbability: 0.5,
    mask: [0, 0, 1, 1],
    rescale: 2,
    realized: [0, 0, 0.2, 1.2],
    maskCount: 16,
    expected: [0.2, -0.4, 0.1, 0.6],
    originalSquaredNorm: 0.57,
    expectedSquaredNorm: 1.14,
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

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const base = getReadableToneColor('cyan', c)
    const kept = getReadableToneColor('green', c)
    const dropped = getReadableToneColor('critical', c)
    const cellX = [38, 166, 294, 422]
    const cellW = 100
    const row = (y: number, values: string[], tone: string[], prefix: string) => ({
        shapes: values.map((_, i) =>
            SvgFrame({
                c,
                x: cellX[i],
                y,
                width: cellW,
                height: 52,
                rx: 8,
                fill: c.bgSubtle,
                stroke: tone[i],
                strokeWidth: 2,
                key: `${prefix}-${i}`,
            }),
        ),
        labels: values.map((value, i) =>
            label(c, value, cellX[i], y + 10, cellW, 32, 22, tone[i], 'center'),
        ),
    })
    const deltaRow = row(
        166,
        ['+0.20', '−0.40', '+0.10', '+0.60'],
        [base, base, base, base],
        'delta',
    )
    const maskRow = row(
        300,
        ['drop', 'drop', 'keep', 'keep'],
        [dropped, dropped, kept, kept],
        'mask',
    )
    const scaledRow = row(
        434,
        ['0.00', '0.00', '+0.20', '+1.20'],
        [dropped, dropped, kept, kept],
        'scaled',
    )
    const art = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...deltaRow.shapes,
        ...maskRow.shapes,
        ...scaledRow.shapes,
        ...cellX.map((x, i) =>
            VectorArrow({
                x1: x + cellW / 2,
                y1: 224,
                x2: x + cellW / 2,
                y2: 286,
                color: numericFixture.mask[i] ? kept : dropped,
                strokeWidth: 2.5,
                arrowSize: 8,
            }),
        ),
        ...cellX.map((x) =>
            VectorArrow({
                x1: x + cellW / 2,
                y1: 358,
                x2: x + cellW / 2,
                y2: 420,
                color: c.textSecondary,
                strokeWidth: 2.5,
                arrowSize: 8,
            }),
        ),
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
                CanvasItem({ x: 0, y: 0, width, height, children: art }),
                ...deltaRow.labels,
                ...maskRow.labels,
                ...scaledRow.labels,
                label(
                    c,
                    'DARE drops and rescales task deltas',
                    15,
                    10,
                    530,
                    36,
                    24,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'p_drop = 0.5 · kept entries scale by 2',
                    15,
                    49,
                    530,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(c, 'source task delta τ', 28, 128, 504, 27, 20, c.textPrimary, 'center'),
                label(
                    c,
                    'Apply mask, then rescale: τ ⊙ m / 0.5',
                    28,
                    492,
                    504,
                    27,
                    20,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Mask [0, 0, 1, 1] · one of 16 equally likely',
                    28,
                    525,
                    504,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(
                    c,
                    'For each coordinate: 50% → 0, 50% → 2τᵢ',
                    26,
                    561,
                    508,
                    29,
                    20,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Expected delta = [+0.20, −0.40, +0.10, +0.60]',
                    20,
                    596,
                    520,
                    30,
                    20,
                    kept,
                    'center',
                ),
                label(
                    c,
                    'Squared norm: 0.57 → expected 1.14',
                    20,
                    631,
                    520,
                    27,
                    20,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Unbiased delta mean · higher variance · evaluate quality',
                    20,
                    665,
                    520,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
