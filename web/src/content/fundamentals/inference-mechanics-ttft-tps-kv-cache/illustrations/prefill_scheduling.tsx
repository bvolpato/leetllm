import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableColor,
    getReadableTextColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const alt =
    'In the 32-stream schedule, an exclusive 8,192-token prompt prefill occupies 200 ms before an active stream gets its normal 35 ms decode gap, so that stream waits 235 ms between tokens. A separate logical turn rail splits a 6,144-token prompt into three 2,048-token chunks and alternates P1, D1, P2, D2, P3, D3.'

export const width = 900
export const height = 680

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
    const warm = getReadableColor('warning', c)
    const cyan = getReadableColor('info', c)
    const barW = 860
    const prefillW = (barW * 200) / 235
    const decodeW = barW - prefillW
    const turns = [
        { name: 'P1', sub: '2,048', fill: c.primary, x: 20, w: 148 },
        { name: 'D1', sub: 'decode', fill: c.secondary, x: 176, w: 120 },
        { name: 'P2', sub: '2,048', fill: c.primary, x: 304, w: 148 },
        { name: 'D2', sub: 'decode', fill: c.secondary, x: 460, w: 120 },
        { name: 'P3', sub: '2,048', fill: c.primary, x: 588, w: 148 },
        { name: 'D3', sub: 'decode', fill: c.secondary, x: 744, w: 136 },
    ]

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {SvgFrame({
                c,
                x: 20,
                y: 158,
                width: prefillW,
                height: 64,
                rx: 6,
                fill: c.warning,
                stroke: c.warning,
                strokeWidth: 2,
            })}
            {SvgFrame({
                c,
                x: 20 + prefillW,
                y: 158,
                width: decodeW,
                height: 64,
                rx: 6,
                fill: c.secondary,
                stroke: c.secondary,
                strokeWidth: 2,
            })}
            <line x1={20} y1={314} x2={880} y2={314} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: 20,
                y: 372,
                width: 150,
                height: 50,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.info,
                strokeWidth: 3,
            })}
            {VectorArrow({ x1: 180, y1: 397, x2: 242, y2: 397, color: c.info, strokeWidth: 3 })}
            <line x1={20} y1={482} x2={880} y2={482} stroke={c.borderLight} strokeWidth={2} />
            {turns.map((t) =>
                SvgFrame({
                    key: t.name,
                    c,
                    x: t.x,
                    y: 544,
                    width: t.w,
                    height: 74,
                    rx: 6,
                    fill: c.bgCardAlt,
                    stroke: t.fill,
                    strokeWidth: 3,
                }),
            )}
        </svg>
    )

    const onWarn = getReadableTextColor(c.warning, c, c.bg)
    const onSec = getReadableTextColor(c.secondary, c, c.bg)
    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Exclusive prefill stretches active-stream gaps',
            20,
            14,
            860,
            34,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, '32-stream schedule across two prefill paths.', 20, 56, 860, 30, c.textSecondary),
        label(
            c,
            'Active stream during 8,192-token prompt prefill',
            20,
            114,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, 'exclusive prompt prefill · 200 ms', 20, 174, prefillW, 31, onWarn, 'center', 700),
        label(c, '35 ms', 20 + prefillW, 174, decodeW, 30, onSec, 'center', 700),
        label(c, 'last output token', 20, 232, 300, 29, c.textSecondary),
        label(c, 'next decode turn', 580, 232, 300, 29, c.textSecondary, 'right'),
        label(
            c,
            '200 ms prefill + 35 ms decode = 235 ms token gap',
            20,
            268,
            860,
            31,
            warm,
            'left',
            700,
        ),
        label(
            c,
            'New request first-token path (TTFT)',
            20,
            328,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, 'arrival', 20, 381, 150, 30, cyan, 'center', 700),
        label(c, 'queue + prefill + first token', 256, 381, 620, 31, c.textPrimary, 'left', 700),
        label(c, 'Measured separately from active-stream ITL.', 20, 434, 860, 29, c.textSecondary),
        label(
            c,
            'Chunked prefill: 6,144 tokens ÷ 2,048 = 3 chunks',
            20,
            496,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        ...turns.flatMap((t) => [
            label(
                c,
                t.name,
                t.x,
                550,
                t.w,
                30,
                t.fill === c.primary
                    ? getReadableColor('primary', c)
                    : getReadableColor('secondary', c),
                'center',
                700,
            ),
            label(c, t.sub, t.x, 582, t.w, 28, c.textSecondary, 'center', 600),
        ]),
        label(
            c,
            'Logical turn sequence only, not a millisecond scale.',
            20,
            632,
            860,
            30,
            c.textPrimary,
            'left',
            650,
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
