import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 672
export const height = 672
export const alt =
    'Four positions show teacher and student vectors of four logits aligned at the same t. The shared output IDs are 0=7d, 1=3d, 2=30d, and 3=never. The target token IDs are [0, 0, 1, -100]; shifting labels left pairs logits t0 with label[1]=0 (7d), t1 with label[2]=1 (3d), and t2 with label[3]=-100 (ignored by both KL and hard loss). The final t3 logits have no next label.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

const centers = [194, 322, 450, 578]
const columnWidth = 116
const targetCells = [
    { first: '0 → 7d', second: 'TRAIN', tone: 'green' as const },
    { first: '1 → 3d', second: 'TRAIN', tone: 'green' as const },
    { first: '−100', second: 'MASK', tone: 'critical' as const },
    { first: 'none', second: 'no target', tone: 'neutral' as const },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const teacher = getReadableToneColor('cyan', c)
    const student = getReadableToneColor('warm', c)
    const arrow = c.textSecondary
    const targetTone = {
        green: getReadableToneColor('green', c),
        critical: getReadableToneColor('red', c),
        neutral: c.textSecondary,
    }
    const shapes = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...centers
            .map((center, index) => [
                SvgFrame({
                    c,
                    x: center - columnWidth / 2,
                    y: 178,
                    width: columnWidth,
                    height: 42,
                    rx: 8,
                    fill: `${teacher}18`,
                    stroke: teacher,
                    strokeWidth: 1.4,
                }),
                SvgFrame({
                    c,
                    x: center - columnWidth / 2,
                    y: 256,
                    width: columnWidth,
                    height: 42,
                    rx: 8,
                    fill: `${student}18`,
                    stroke: student,
                    strokeWidth: 1.4,
                }),
                VectorSegment({
                    x1: center,
                    y1: 220,
                    x2: center,
                    y2: 256,
                    color: c.borderLight,
                    strokeWidth: 2,
                    showStartDot: true,
                    showEndDot: true,
                    dotRadius: 3.2,
                }),
                SvgFrame({
                    c,
                    x: center - columnWidth / 2,
                    y: 441,
                    width: columnWidth,
                    height: 40,
                    rx: 7,
                    fill: c.bgCard,
                    stroke: c.border,
                    strokeWidth: 1.2,
                }),
                SvgFrame({
                    c,
                    x: center - columnWidth / 2,
                    y: 523,
                    width: columnWidth,
                    height: 69,
                    rx: 8,
                    fill: `${targetTone[targetCells[index].tone]}12`,
                    stroke: targetTone[targetCells[index].tone],
                    strokeWidth: 1.4,
                }),
            ])
            .flat(),
        ...[1, 2, 3].map((index) =>
            VectorArrow({
                x1: centers[index],
                y1: 482,
                x2: centers[index - 1],
                y2: 512,
                color: arrow,
                strokeWidth: 2.4,
                arrowSize: 8,
            }),
        ),
    )

    return Board({
        c,
        width,
        height,
        background: c.bgSubtle,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapes }),
            label(
                c,
                'Same-position logits, next-position labels',
                18,
                14,
                636,
                36,
                29,
                c.textPrimary,
                800,
            ),
            label(
                c,
                'Teacher and student compare at the same prefix t.',
                18,
                53,
                636,
                28,
                22,
                c.textSecondary,
                600,
            ),
            label(c, 'Shared output-token IDs', 18, 91, 636, 27, 24, c.textPrimary, 700),
            ...['0 · 7d', '1 · 3d', '2 · 30d', '3 · never'].flatMap((item, index) => [
                label(
                    c,
                    item,
                    18 + index * 160,
                    119,
                    152,
                    34,
                    24,
                    c.textPrimary,
                    700,
                    'center',
                    true,
                ),
            ]),
            ...centers.flatMap((center, index) => [
                label(
                    c,
                    `t${index}`,
                    center - columnWidth / 2,
                    150,
                    columnWidth,
                    24,
                    24,
                    c.textPrimary,
                    750,
                    'center',
                    true,
                ),
                label(
                    c,
                    'V = 4',
                    center - columnWidth / 2,
                    185,
                    columnWidth,
                    28,
                    24,
                    teacher,
                    750,
                    'center',
                    true,
                ),
                label(
                    c,
                    'V = 4',
                    center - columnWidth / 2,
                    263,
                    columnWidth,
                    28,
                    24,
                    student,
                    750,
                    'center',
                    true,
                ),
            ]),
            label(c, 'Teacher', 14, 185, 110, 28, 24, teacher, 750),
            label(c, 'Student', 14, 263, 110, 28, 24, student, 750),
            label(
                c,
                'Vertical pairing matches the same t.',
                18,
                312,
                636,
                27,
                22,
                c.textSecondary,
                600,
                'center',
            ),
            label(c, 'Original labels[j]', 18, 370, 636, 27, 24, c.textPrimary, 750),
            ...[0, 0, 1, '−100'].flatMap((value, index) => [
                label(
                    c,
                    String(value),
                    centers[index] - columnWidth / 2,
                    447,
                    columnWidth,
                    27,
                    24,
                    c.textPrimary,
                    750,
                    'center',
                    true,
                ),
                label(
                    c,
                    `j=${index}`,
                    centers[index] - columnWidth / 2,
                    408,
                    columnWidth,
                    21,
                    24,
                    c.textMuted,
                    600,
                    'center',
                    true,
                ),
            ]),
            label(c, 'Target', 14, 488, 110, 25, 24, c.textPrimary, 750),
            ...targetCells.flatMap((item, index) => [
                label(
                    c,
                    item.first,
                    centers[index] - columnWidth / 2 + 2,
                    529,
                    columnWidth - 4,
                    28,
                    24,
                    c.textPrimary,
                    700,
                    'center',
                    true,
                ),
                label(
                    c,
                    item.second,
                    centers[index] - columnWidth / 2 + 2,
                    562,
                    columnWidth - 4,
                    25,
                    22,
                    targetTone[item.tone],
                    750,
                    'center',
                ),
            ]),
            label(
                c,
                'y₀ has no paired logit · t₃ has no next label',
                18,
                601,
                636,
                25,
                22,
                c.textSecondary,
                600,
                'center',
            ),
            label(
                c,
                '−100 masks t₂ from both KL and hard CE.',
                18,
                635,
                636,
                25,
                22,
                c.textSecondary,
                600,
                'center',
            ),
        ],
    })
}

export default create('dark')
