import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 520
export const alt =
    'An evaluation order audit keeps response A and response B in fixed columns as presentation order alternates. The A-first row assigns A 0.80 and B 0.20. When B appears first, B receives 0.70 and that score maps to A 0.30. Averaging by identity gives P(A) 0.55 and P(B) 0.45.'

type Colors = ReturnType<typeof getThemeColors>

function text(
    c: Colors,
    value: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    weight = 650,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text: value,
            width: w,
            fontSize,
            color,
            fontWeight: weight,
            align,
        }),
    })
}

function probabilityCell(
    c: Colors,
    x: number,
    y: number,
    value: number,
    color: string,
    emphasized = false,
) {
    return text(
        c,
        value.toFixed(2),
        x + 166,
        y + 29,
        58,
        40,
        emphasized ? 31 : 27,
        color,
        800,
        'right',
    )
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const rowX = 20
    const rowWidth = 720
    const columns = [
        { x: 220, title: 'Response A', color: blue },
        { x: 478, title: 'Response B', color: warm },
    ] as const
    const rows = [
        { y: 160, label: 'A → B', a: 0.8, b: 0.2, emphasis: false },
        { y: 258, label: 'B first → A', a: 0.3, b: 0.7, emphasis: false },
        { y: 356, label: 'Mean by ID', a: 0.55, b: 0.45, emphasis: true },
    ]
    const geometry = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...rows.map((row, index) =>
            SvgFrame({
                c,
                x: rowX,
                y: row.y,
                width: rowWidth,
                height: 78,
                rx: 12,
                fill: index === 2 ? getToneFill('green', c) : c.bgCard,
                stroke: index === 2 ? green : c.borderSubtle,
                strokeWidth: index === 2 ? 2.2 : 1.5,
            }),
        ),
        ...columns.flatMap((column) => [
            SvgFrame({
                c,
                x: column.x + 16,
                y: 130,
                width: 142,
                height: 3,
                rx: 1.5,
                fill: column.color,
                stroke: column.color,
                strokeWidth: 0,
            }),
        ]),
        ...rows.flatMap((row) =>
            columns.flatMap((column, index) => {
                const value = index === 0 ? row.a : row.b
                const color = index === 0 ? blue : warm
                const trackX = column.x + 16
                const trackWidth = 142
                return [
                    SvgFrame({
                        c,
                        x: trackX,
                        y: row.y + 45,
                        width: trackWidth,
                        height: 14,
                        rx: 7,
                        fill: c.borderSubtle,
                        stroke: c.borderSubtle,
                        strokeWidth: 0,
                    }),
                    SvgFrame({
                        c,
                        x: trackX,
                        y: row.y + 45,
                        width: trackWidth * value,
                        height: 14,
                        rx: 7,
                        fill: color,
                        stroke: color,
                        strokeWidth: 0,
                    }),
                ]
            }),
        ),
    )
    return Board({
        background: 'transparent',
        c,
        width,
        height,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: geometry }),
            text(c, 'Match each score to its response', 28, 20, 704, 42, 34, c.textPrimary, 800),
            text(
                c,
                'Prompt order flips; response identity stays A or B.',
                28,
                66,
                704,
                34,
                25,
                c.textSecondary,
                550,
            ),
            ...columns.map((column) =>
                text(c, column.title, column.x, 100, 224, 34, 27, column.color, 800, 'center'),
            ),
            ...rows.flatMap((row) => [
                text(
                    c,
                    row.label,
                    30,
                    row.y + 23,
                    176,
                    36,
                    27,
                    row.emphasis ? green : c.textPrimary,
                    750,
                ),
                probabilityCell(c, columns[0].x, row.y, row.a, blue, row.emphasis),
                probabilityCell(c, columns[1].x, row.y, row.b, warm, row.emphasis),
            ]),
            text(
                c,
                'Bars share a 0–1 probability scale.',
                28,
                462,
                704,
                30,
                25,
                c.textSecondary,
                550,
            ),
        ],
    })
}

export default create('dark')
