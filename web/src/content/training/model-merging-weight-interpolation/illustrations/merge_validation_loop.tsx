import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 635
export const alt =
    'Validation gate scorecard reporting Code at 92.4, Math at 82.1, and Chat at 87.0 against absolute floors 90, 85, and 84 and regression floors 92, 87, and 86.5. Because Math misses both checks, the 87.2 macro average fails the binding per-task release policy.'
export const numericFixture = {
    scores: { Code: 92.4, Math: 82.1, Chat: 87 },
    absoluteFloors: { Code: 90, Math: 85, Chat: 84 },
    sourceScores: { Code: 93, Math: 88, Chat: 87.5 },
    regressionFloors: { Code: 92, Math: 87, Chat: 86.5 },
    macroAverage: 87.2,
    blockingTask: 'Math',
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

function legendLine(c: ReturnType<typeof getThemeColors>, x: number, y: number, color: string) {
    return CanvasItem({
        x,
        y,
        width: 30,
        height: 18,
        children: createElement(
            'svg',
            { width: 30, height: 18, viewBox: '0 0 30 18' },
            VectorSegment({
                x1: 0,
                y1: 9,
                x2: 30,
                y2: 9,
                color,
                strokeWidth: 3,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const pass = getReadableToneColor('green', c)
    const fail = getReadableToneColor('critical', c)
    const absolute = getReadableToneColor('warm', c)
    const regression = getReadableToneColor('purple', c)
    const left = 100
    const right = 350
    const x = (v: number) => left + ((v - 80) / 15) * (right - left)
    const rows = [226, 315, 404]
    const records = [
        ['Code', 92.4, 90, 92],
        ['Math', 82.1, 85, 87],
        ['Chat', 87.0, 84, 86.5],
    ] as const
    const plot = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...[80, 85, 90, 95].map((v) =>
            VectorSegment({
                x1: x(v),
                y1: 188,
                x2: x(v),
                y2: 445,
                color: v === 80 ? c.textSecondary : c.border,
                strokeWidth: v === 80 ? 1.8 : 1,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...records.flatMap(([task, score, abs, reg], i) => {
            const y = rows[i]
            const color = task === 'Math' ? fail : pass
            return [
                VectorSegment({
                    x1: left,
                    y1: y,
                    x2: right,
                    y2: y,
                    color: c.border,
                    strokeWidth: 3,
                    showStartDot: false,
                    showEndDot: false,
                }),
                VectorSegment({
                    x1: x(abs),
                    y1: y - 18,
                    x2: x(abs),
                    y2: y + 18,
                    color: absolute,
                    strokeWidth: 3,
                    showStartDot: false,
                    showEndDot: false,
                }),
                VectorSegment({
                    x1: x(reg),
                    y1: y - 18,
                    x2: x(reg),
                    y2: y + 18,
                    color: regression,
                    strokeWidth: 3,
                    showStartDot: false,
                    showEndDot: false,
                }),
                VectorSegment({
                    x1: left,
                    y1: y,
                    x2: x(score),
                    y2: y,
                    color,
                    strokeWidth: 6,
                    showStartDot: false,
                    showEndDot: false,
                }),
                SvgPoint({
                    cx: x(score),
                    cy: y,
                    r: 8,
                    fill: color,
                    stroke: c.bgCard,
                    strokeWidth: 2,
                }),
            ]
        }),
        SvgFrame({
            c,
            x: 27,
            y: 512,
            width: 506,
            height: 105,
            rx: 12,
            fill: c.bgSubtle,
            stroke: fail,
            strokeWidth: 1.5,
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
                CanvasItem({ x: 0, y: 0, width, height, children: plot }),
                label(
                    c,
                    'A release gate follows each critical task',
                    15,
                    10,
                    530,
                    35,
                    24,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Macro average 87.2 · illustrative percentage scores',
                    15,
                    50,
                    530,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(c, 'score · abs / rel', 362, 188, 190, 26, 20, c.textSecondary, 'center'),
                ...records.flatMap(([task, score, abs, reg], i) => [
                    label(
                        c,
                        task,
                        18,
                        rows[i] - 14,
                        76,
                        28,
                        20,
                        task === 'Math' ? fail : c.textPrimary,
                    ),
                    label(
                        c,
                        `${score.toFixed(1)} · ${abs} / ${reg}`,
                        362,
                        rows[i] - 14,
                        190,
                        28,
                        20,
                        task === 'Math' ? fail : c.textPrimary,
                        'left',
                    ),
                ]),
                ...[80, 85, 90, 95].map((v) =>
                    label(c, String(v), x(v) - 24, 449, 48, 26, 20, c.textSecondary, 'center'),
                ),
                label(c, 'task score (%)', 143, 477, 170, 26, 20, c.textSecondary, 'center'),
                legendLine(c, 42, 523, absolute),
                label(c, 'absolute floor', 80, 519, 150, 27, 20, c.textPrimary),
                legendLine(c, 257, 523, regression),
                label(c, 'regression floor', 295, 519, 220, 27, 20, c.textPrimary),
                label(
                    c,
                    'Math 82.1 < absolute 85 and relative 87.',
                    39,
                    553,
                    478,
                    27,
                    20,
                    fail,
                    'center',
                ),
                label(
                    c,
                    'Macro 87.2 cannot override a task failure.',
                    39,
                    582,
                    478,
                    27,
                    20,
                    fail,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
