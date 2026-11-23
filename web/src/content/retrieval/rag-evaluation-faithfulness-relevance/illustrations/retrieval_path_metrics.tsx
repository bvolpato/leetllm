import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'default'
export const width = 560
export const height = 660
export const alt =
    'The recorded trace finds the freeze approval rule among three candidates, reranks it into a one-chunk context, and scores candidate recall, context recall, and selected-set precision at one. In a labeled counterfactual, keeping two distractors alongside the rule preserves recall at one while lowering set precision to one third.'

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

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const green = getReadableToneColor('green', c)
    const cyan = getReadableToneColor('cyan', c)
    const blue = getReadableToneColor('blue', c)
    const amber = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const card = (
        x: number,
        y: number,
        w: number,
        h: number,
        stroke: string,
        fill = c.bgCard,
        rx = 9,
    ) => SvgFrame({ c, x, y, width: w, height: h, rx, fill, stroke, strokeWidth: 1.6 })

    const geometry = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        SvgFrame({
            c,
            x: 16,
            y: 84,
            width: 528,
            height: 247,
            rx: 12,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 16,
            y: 342,
            width: 528,
            height: 74,
            rx: 12,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 16,
            y: 429,
            width: 528,
            height: 210,
            rx: 12,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        ...[
            [24, 128, 250, 52, cyan],
            [24, 193, 250, 52, c.border],
            [24, 258, 250, 52, c.border],
            [328, 173, 208, 88, green],
            [28, 475, 154, 60, green],
            [202, 475, 154, 60, c.border],
            [376, 475, 154, 60, c.border],
            [28, 352, 158, 56, c.border],
            [201, 352, 158, 56, c.border],
            [374, 352, 158, 56, c.border],
            [28, 548, 242, 73, blue],
            [290, 548, 242, 73, amber],
        ].map(([x, y, w, h, stroke]) =>
            card(x as number, y as number, w as number, h as number, stroke as string),
        ),
        // The sole retained rule travels from its candidate row into the prompt context.
        VectorArrow({
            x1: 273,
            y1: 164,
            x2: 333,
            y2: 211,
            color: cyan,
            strokeWidth: 3,
            arrowSize: 7,
        }),
    )

    return Board({
        c,
        width,
        height,
        background: c.bgSubtle,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: geometry }),

            label(c, 'CANDIDATES · 3', 26, 96, 250, 25, 19, blue, 750),
            label(c, 'SELECTED · 1', 328, 96, 205, 25, 19, green, 750),

            label(c, 'Freeze rule', 37, 141, 224, 27, 21, cyan, 750),
            label(c, 'Rollback runbook', 37, 206, 224, 27, 19, muted, 650),
            label(c, 'Frontend deploy note', 37, 271, 224, 27, 19, muted, 650),

            label(c, 'Freeze rule', 342, 187, 180, 27, 20, green, 800, 'center'),
            label(c, 'v2026-06-01', 342, 217, 180, 27, 19, c.textSecondary, 600, 'center', true),
            label(c, '2 not selected', 319, 276, 217, 25, 19, muted, 600, 'center'),

            label(c, 'Cand. recall', 34, 357, 146, 22, 19, muted, 650, 'center'),
            label(c, '1 / 1', 34, 382, 146, 23, 21, green, 800, 'center'),
            label(c, 'Context recall', 207, 357, 146, 22, 19, muted, 650, 'center'),
            label(c, '1 / 1', 207, 382, 146, 23, 21, green, 800, 'center'),
            label(c, 'Set precision', 380, 357, 146, 22, 19, muted, 650, 'center'),
            label(c, '1 / 1', 380, 382, 146, 23, 21, green, 800, 'center'),

            label(
                c,
                'COUNTERFACTUAL: two allowed distractors remain',
                28,
                439,
                505,
                25,
                19,
                amber,
                750,
            ),
            label(c, 'Freeze rule', 36, 492, 138, 27, 20, green, 750, 'center'),
            label(c, 'Runbook', 210, 492, 138, 27, 19, muted, 650, 'center'),
            label(c, 'Deploy note', 384, 492, 138, 27, 19, muted, 650, 'center'),

            label(c, 'Recall  =  1 / 1', 40, 556, 218, 28, 21, blue, 800, 'center'),
            label(c, 'found / required', 38, 585, 222, 26, 19, c.textSecondary, 550, 'center'),
            label(c, 'Precision  =  1 / 3', 302, 556, 218, 28, 21, amber, 800, 'center'),
            label(
                c,
                'useful / selected IDs',
                300,
                585,
                222,
                26,
                19,
                c.textSecondary,
                550,
                'center',
            ),
        ],
    })
}

export default create('dark')
