import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getReadableColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 740
export const alt =
    'A Qwen3.6-27B-style GQA cache has 16 attention layers, four KV heads, separate key and value vectors of 256 values at each of 4,096 positions, and two bytes per value: 268,435,456 bytes, or 0.268 GB and 0.25 GiB. Common-scale bars show FP16 and 8-bit growth at 2K, 4K, 6K, and 8K. At 4K, four shared KV heads use 0.268 GB; a hypothetical layout with one KV head per query head (24) uses 1.611 GB, six times as much.'

const barStart = 120
const gbScale = 430 / 1.611

function label(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 500,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(36, fontSize + 8),
        children: TextLabel({ c, text: value, fontSize, fontWeight, color, align, width: w }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const state = getReadableColor('primary', c)
    const eightBit = c.info
    const factors = [
        { val: '2', name: 'K/V', x: 20, w: 96 },
        { val: '16', name: 'layers', x: 152, w: 108 },
        { val: '4', name: 'KV heads', x: 296, w: 132 },
        { val: '256', name: 'head dim', x: 464, w: 132 },
        { val: '4,096', name: 'tokens', x: 632, w: 136 },
        { val: '2', name: 'B', x: 804, w: 76 },
    ]
    const growthRows = [
        { len: '2K', two: 0.134, one: 0.067 },
        { len: '4K', two: 0.268, one: 0.134 },
        { len: '6K', two: 0.403, one: 0.201 },
        { len: '8K', two: 0.537, one: 0.268 },
    ]

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {factors.map((f) =>
                SvgFrame({
                    key: f.name,
                    c,
                    x: f.x,
                    y: 18,
                    width: f.w,
                    height: 50,
                    rx: 8,
                    fill: c.bgCardAlt,
                    stroke: c.primary,
                    strokeWidth: 2,
                }),
            )}
            <line x1={20} y1={162} x2={880} y2={162} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: 20,
                y: 212,
                width: 22,
                height: 22,
                rx: 4,
                fill: c.primary,
                stroke: c.primary,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: 360,
                y: 212,
                width: 22,
                height: 22,
                rx: 4,
                fill: eightBit,
                stroke: eightBit,
                strokeWidth: 1,
            })}
            {growthRows.flatMap((row, i) => {
                const y = 260 + i * 62
                return [
                    SvgFrame({
                        key: `t-${i}`,
                        c,
                        x: barStart,
                        y,
                        width: row.two * gbScale,
                        height: 22,
                        rx: 3,
                        fill: c.primary,
                        stroke: c.primary,
                        strokeWidth: 1,
                    }),
                    SvgFrame({
                        key: `o-${i}`,
                        c,
                        x: barStart,
                        y: y + 26,
                        width: row.one * gbScale,
                        height: 22,
                        rx: 3,
                        fill: eightBit,
                        stroke: eightBit,
                        strokeWidth: 1,
                    }),
                ]
            })}
            <line x1={20} y1={520} x2={880} y2={520} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: 20,
                y: 580,
                width: 0.268 * gbScale,
                height: 32,
                rx: 4,
                fill: c.primary,
                stroke: c.primary,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: 20,
                y: 662,
                width: 1.611 * gbScale,
                height: 32,
                rx: 4,
                fill: c.warning,
                stroke: c.warning,
                strokeWidth: 1,
            })}
        </svg>
    )

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        ...factors.flatMap((f, idx) => [
            label(c, f.val, f.x, 26, f.w, 30, c.textPrimary, 'center', 700),
            label(c, f.name, f.x - 10, 74, f.w + 20, 28, c.textSecondary, 'center', 500),
            ...(idx < factors.length - 1
                ? [label(c, '×', f.x + f.w, 26, 36, 30, c.textSecondary, 'center', 600)]
                : []),
        ]),
        label(c, '= 268,435,456 bytes = 0.268 GB (0.25 GiB)', 20, 116, 860, 31, state, 'left', 700),
        label(
            c,
            'Linear growth with sequence length (shared scale)',
            20,
            172,
            860,
            30,
            c.textSecondary,
            'left',
            600,
        ),
        label(c, '2-byte FP16 / BF16', 50, 208, 290, 29, c.textPrimary, 'left', 600),
        label(c, '1-byte 8-bit', 390, 208, 260, 29, c.textPrimary, 'left', 600),
        ...growthRows.flatMap((row, i) => {
            const y = 260 + i * 62
            return [
                label(c, row.len, 20, y + 8, 80, 31, c.textPrimary, 'left', 700),
                label(
                    c,
                    `${row.two.toFixed(3)} GB`,
                    barStart + row.two * gbScale + 14,
                    y - 5,
                    220,
                    28,
                    c.textPrimary,
                    'left',
                    600,
                ),
                label(
                    c,
                    `${row.one.toFixed(3)} GB`,
                    barStart + row.one * gbScale + 14,
                    y + 21,
                    220,
                    28,
                    c.textSecondary,
                    'left',
                    500,
                ),
            ]
        }),
        label(
            c,
            'At 4K tokens on the same byte scale',
            20,
            534,
            860,
            30,
            c.textPrimary,
            'left',
            700,
        ),
        label(
            c,
            'GQA (4 KV heads): 0.268 GB',
            20 + 0.268 * gbScale + 16,
            580,
            560,
            30,
            state,
            'left',
            700,
        ),
        label(
            c,
            'Unshared 24 query heads need 6× memory',
            20,
            622,
            680,
            28,
            c.textSecondary,
            'left',
            500,
        ),
        label(
            c,
            'MHA (24 KV): 1.611 GB (6×)',
            20 + 1.611 * gbScale + 16,
            662,
            410,
            30,
            getReadableColor('warning', c),
            'left',
            700,
        ),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

export default create('dark')
