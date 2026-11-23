import { createElement } from 'react'
import {
    SvgFrame,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    layoutCellGrid,
    withColorAlpha,
} from 'vizmatic'
import { figure, label } from './precision_canvas'

export const width = 560
export const height = 731
export const alt =
    'Two eight-bit words show E4M3 sign/exponent/fraction counts one/four/three and E5M2 counts one/five/two. Their finite maxima are 448 and 57344; infinity is absent from E4M3 and present in E5M2. Two MXFP8 schema rows each contain exactly 32 FP8 value cells and one associated E8M0 power-of-two scale. Scale metadata is distinct from the element encoding; the implementation specifies internal arithmetic.'

export const fp8Formats = [
    { id: 'e4m3', name: 'E4M3', bits: [1, 4, 3], maximum: 448, infinity: false },
    { id: 'e5m2', name: 'E5M2', bits: [1, 5, 2], maximum: 57344, infinity: true },
] as const
export const mxBlocks = [0, 1].map((index) => ({
    id: 'block-' + index,
    index,
    layout: layoutCellGrid({
        x: 20,
        y: 470 + index * 110,
        width: 352,
        height: 40,
        rows: 2,
        columns: 16,
    }),
}))

const illustration = defineIllustration((colors) => {
    const c = { ...colors, shadow: 'transparent' }
    const sign = getReadableToneColor('warm', c)
    const exponent = getReadableToneColor('cyan', c)
    const fraction = getReadableToneColor('purple', c)
    const scale = getReadableToneColor('blue', c)
    const fields = fp8Formats.flatMap((format, index) => {
        const starts = [0, format.bits[0], format.bits[0] + format.bits[1]]
        return format.bits.map((count, group) => ({
            id: format.id + '-field-' + group,
            format,
            x: 20 + starts[group] * 60,
            y: 137 + index * 154,
            width: count * 60,
            count,
            symbol: ['s', 'e', 'f'][group],
            color: [sign, exponent, fraction][group],
        }))
    })
    return figure(
        c,
        width,
        height,
        [
            ...fields.map((field) =>
                createElement(
                    'g',
                    { key: field.id, id: field.id },
                    SvgFrame({
                        c,
                        x: field.x,
                        y: field.y,
                        width: field.width,
                        height: 46,
                        fill: withColorAlpha(field.color, 0.13),
                        stroke: field.color,
                        strokeWidth: 1.5,
                        rx: 0,
                    }),
                ),
            ),
            ...fp8Formats.flatMap((format, index) =>
                Array.from({ length: 7 }, (_, bit) =>
                    createElement('line', {
                        key: format.id + '-bit-' + bit,
                        x1: 20 + (bit + 1) * 60,
                        x2: 20 + (bit + 1) * 60,
                        y1: 137 + index * 154,
                        y2: 183 + index * 154,
                        stroke: c.borderSubtle,
                        strokeWidth: 0.75,
                    }),
                ),
            ),
            ...fields.map((field) =>
                createElement(
                    'g',
                    { key: field.id + '-label-plate', id: field.id + '-label-plate' },
                    SvgFrame({
                        c,
                        x: field.x + field.width / 2 - 26,
                        y: field.y + 3,
                        width: 52,
                        height: 40,
                        fill: c.bg,
                        stroke: 'transparent',
                        rx: 3,
                    }),
                ),
            ),
            ...mxBlocks.flatMap((block) => [
                ...block.layout.cells.flatMap((row, r) =>
                    row.map((cell, col) =>
                        createElement(
                            'g',
                            {
                                key: block.id + '-' + r + '-' + col,
                                id: block.id + '-value-' + r + '-' + col,
                            },
                            SvgFrame({
                                c,
                                ...cell,
                                fill: withColorAlpha(block.index === 0 ? scale : exponent, 0.22),
                                stroke: withColorAlpha(block.index === 0 ? scale : exponent, 0.75),
                                strokeWidth: 1.5,
                                rx: 0,
                            }),
                        ),
                    ),
                ),
                createElement(
                    'g',
                    { key: block.id + '-scale', id: block.id + '-scale' },
                    SvgFrame({
                        c,
                        x: 420,
                        y: block.layout.bounds.y,
                        width: 120,
                        height: 40,
                        fill: withColorAlpha(scale, 0.13),
                        stroke: scale,
                        strokeWidth: 1.5,
                        rx: 4,
                    }),
                ),
                createElement(
                    'g',
                    {
                        key: block.id + '-scale-connection',
                        id: block.id + '-scale-connection',
                    },
                    VectorArrow({
                        x1: 413,
                        y1: block.layout.bounds.y + 20,
                        x2: 379,
                        y2: block.layout.bounds.y + 20,
                        color: scale,
                        strokeWidth: 2.5,
                        arrowSize: 5,
                    }),
                ),
            ]),
        ],
        [
            label(c, 'title', 'Element bits and a shared scale', 20, 0, 520, {
                size: 27,
                weight: 800,
            }),
            label(c, 'field-legend', 's: sign · e: exponent · f: fraction', 20, 45, 520, {
                color: c.textSecondary,
            }),
            ...fp8Formats.flatMap((format, index) => [
                label(c, format.id + '-name', format.name, 20, 95 + index * 154, 200, {
                    size: 25,
                    weight: 800,
                }),
                label(
                    c,
                    format.id + '-maximum',
                    'max ' + format.maximum,
                    300,
                    95 + index * 154,
                    240,
                    { size: 23, mono: true, align: 'right' },
                ),
                label(
                    c,
                    format.id + '-infinity',
                    format.infinity ? 'Infinity encoded' : 'Infinity absent',
                    20,
                    195 + index * 154,
                    520,
                    { color: c.textSecondary },
                ),
            ]),
            ...fields.map((field) =>
                label(
                    c,
                    field.id + '-label',
                    String(field.count) + field.symbol,
                    field.x,
                    field.y + 7,
                    field.width,
                    {
                        size: 25,
                        mono: true,
                        align: 'center',
                        color: field.color,
                        weight: 800,
                    },
                ),
            ),
            label(c, 'mx-title', 'MXFP8 · 32 values per scale', 20, 405, 520, {
                size: 25,
                weight: 800,
            }),
            ...mxBlocks.flatMap((block) => [
                label(
                    c,
                    block.id + '-label',
                    'Block ' + block.index + ' · 32 FP8 values',
                    20,
                    block.layout.bounds.y - 35,
                    352,
                    { color: c.textSecondary },
                ),
                label(c, block.id + '-scale-label', 'E8M0', 420, block.layout.bounds.y + 4, 120, {
                    size: 23,
                    mono: true,
                    align: 'center',
                    color: scale,
                    weight: 800,
                }),
            ]),
            label(c, 'scale-rule', 'Power-of-two scales · zero and Inf absent', 20, 642, 520, {
                color: c.textSecondary,
            }),
            label(c, 'arithmetic-scope', 'Internal arithmetic is kernel-defined.', 20, 681, 520, {
                color: c.textSecondary,
            }),
        ],
    )
})
export const create = illustration.create
export default illustration.default
