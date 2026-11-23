import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 648
export const height = 404
export const alt =
    'Three open matrices show X times W equals Y. X has three request rows and two feature columns, prompt and queue. W maps the two features to time in seconds and a priority score. Blue highlights request B, [2, 1], and the time column of W, [2, 1]. Their dot product, 2 times 2 plus 1 times 1, fills the green output cell with 5 seconds. The shapes are 3 by 2, 2 by 2, and 3 by 2.'

const requests = [
    [1, 0],
    [2, 1],
    [3, 1],
]
const weights = [
    [2, 0.2],
    [1, 1.5],
]
const outputs = requests.map((row) =>
    weights[0].map((_, col) => row.reduce((sum, value, i) => sum + value * weights[i][col], 0)),
)

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const shared = getReadableToneColor('purple', c)
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        size = 22,
        color = c.textPrimary,
        weight = 500,
        mono = false,
    ) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: size * 1.45,
            children: TextLabel({
                c,
                text,
                fontSize: size,
                fontWeight: weight,
                color,
                mono,
                align: 'center',
            }),
        })
    const matrix = (
        x: number,
        y: number,
        values: number[][],
        selection: 'row' | 'column' | 'cell',
    ) => {
        const h = values.length * 42
        const selected = (row: number, col: number) =>
            selection === 'row'
                ? row === 1
                : selection === 'column'
                  ? col === 0
                  : row === 1 && col === 0
        return CanvasItem({
            x,
            y,
            width: 150,
            height: h,
            children: createElement(
                'div',
                {
                    style: { display: 'flex', position: 'relative', width: 150, height: h },
                },
                createElement(
                    'svg',
                    {
                        width: 150,
                        height: h,
                        viewBox: `0 0 150 ${h}`,
                        style: { position: 'absolute', left: 0, top: 0 },
                    },
                    createElement('path', {
                        d: `M 10 1 H 2 V ${h - 1} H 10 M 140 1 H 148 V ${h - 1} H 140`,
                        fill: 'none',
                        stroke: c.textMuted,
                        strokeWidth: 1.4,
                    }),
                ),
                createElement(
                    'div',
                    {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            marginLeft: 10,
                            width: 128,
                        },
                    },
                    ...values.map((row, ri) =>
                        createElement(
                            'div',
                            { key: ri, style: { display: 'flex', height: 42, gap: 18 } },
                            ...row.map((value, ci) =>
                                createElement(
                                    'div',
                                    {
                                        key: ci,
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 55,
                                            height: 40,
                                            fontFamily: c.fontSans,
                                            fontSize: 25,
                                            fontWeight: selected(ri, ci) ? 650 : 400,
                                            color: selected(ri, ci)
                                                ? selection === 'cell'
                                                    ? green
                                                    : blue
                                                : c.textPrimary,
                                            backgroundColor: selected(ri, ci)
                                                ? withColorAlpha(
                                                      selection === 'cell' ? green : blue,
                                                      0.13,
                                                  )
                                                : 'transparent',
                                            borderRadius: 4,
                                        },
                                    },
                                    value.toFixed(1),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        })
    }
    const shape = (x: number, rows: string, cols: string, rowColor: string, colColor: string) =>
        CanvasItem({
            x,
            y: 232,
            width: 150,
            height: 34,
            children: createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        width: 150,
                        justifyContent: 'center',
                        gap: 10,
                        fontSize: 23,
                        fontFamily: c.fontSans,
                    },
                },
                createElement('span', { style: { color: rowColor } }, rows),
                createElement('span', { style: { color: c.textMuted } }, '×'),
                createElement('span', { style: { color: colColor } }, cols),
            ),
        })

    return Scene({
        c,
        padding: 24,
        gap: 0,
        contentWidth: 600,
        children: Board({
            c,
            width: 600,
            height: 356,
            children: [
                label(18, 20, 170, 'X · requests', 23, c.textPrimary, 650),
                label(224, 20, 170, 'W · weights', 23, c.textPrimary, 650),
                label(430, 20, 170, 'Y · outputs', 23, c.textPrimary, 650),
                label(34, 64, 63, 'prompt', 19, c.textSecondary),
                label(107, 64, 63, 'queue', 19, c.textSecondary),
                label(245, 64, 55, 'time', 19, c.textSecondary),
                label(318, 64, 55, 'score', 19, c.textSecondary),
                label(451, 64, 55, 'time', 19, c.textSecondary),
                label(524, 64, 55, 'score', 19, c.textSecondary),
                label(2, 99, 24, 'A', 23, c.textMuted),
                label(2, 141, 24, 'B', 23, blue, 650),
                label(2, 183, 24, 'C', 23, c.textMuted),
                matrix(28, 96, requests, 'row'),
                matrix(234, 117, weights, 'column'),
                matrix(440, 96, outputs, 'cell'),
                label(185, 137, 38, '×', 30, c.textMuted),
                label(392, 137, 38, '=', 30, c.textMuted),
                shape(28, '3', '2', c.textPrimary, shared),
                shape(234, '2', '2', shared, c.textPrimary),
                shape(440, '3', '2', c.textPrimary, c.textPrimary),
                CanvasItem({
                    x: 28,
                    y: 281,
                    width: 544,
                    height: 1,
                    children: createElement('div', {
                        style: { width: 544, height: 1, backgroundColor: c.borderSubtle },
                    }),
                }),
                label(28, 299, 168, 'Request B · time', 20, c.textSecondary),
                label(206, 294, 366, '2 × 2 + 1 × 1 = 5 s', 26, green, 600),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
