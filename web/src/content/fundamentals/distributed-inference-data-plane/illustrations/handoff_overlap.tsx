import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 580
export const alt =
    'Three timelines share a 0 to 500 ms axis for 2.50 GiB KV transfer. Serial execution runs prefill 0 to 310 ms, transfer 310 to 417.4 ms, and commit plus first token to 445.4 ms. Starting transfer at 240 ms overlaps the tail of prefill and reaches the first token at 375.4 ms, saving 70 ms. Adding a 25 ms initial queue raises TTFT to 400.4 ms while the active-span union remains 375.4 ms.'

const label = (
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 700,
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={size}
            fontWeight={weight}
            color={color}
            align={align}
        />
    </CanvasItem>
)

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = c.info
    const purple = c.primary
    const green = c.positive
    const warm = c.warning

    const x0 = 206
    const span = 510
    const px = (ms: number) => x0 + (ms / 500) * span
    const bw = (ms0: number, ms1: number) => ((ms1 - ms0) / 500) * span
    const transferMs = 107.374
    const by = (yTop: number) => height - yTop

    const rowData = [
        {
            title: '1. Serial (445.4 ms)',
            y: 112,
            q: 0,
            pre0: 0,
            pre1: 310,
            kv0: 310,
            tok1: 445.4,
            tone: c.textPrimary,
        },
        {
            title: '2. Overlap (375.4 ms)',
            y: 244,
            q: 0,
            pre0: 0,
            pre1: 310,
            kv0: 240,
            tok1: 375.4,
            tone: green,
        },
        {
            title: '3. +25 ms Q (400.4)',
            y: 376,
            q: 25,
            pre0: 25,
            pre1: 335,
            kv0: 265,
            tok1: 400.4,
            tone: warm,
        },
    ]

    const bars = rowData.flatMap((r) => [
        SvgFrame({
            c,
            x: 24,
            y: r.y,
            width: 852,
            height: 116,
            rx: 10,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.5,
        }),
        ...(r.q > 0
            ? [
                  SvgFrame({
                      c,
                      x: px(0),
                      y: r.y + 18,
                      width: bw(0, r.q),
                      height: 28,
                      rx: 4,
                      fill: warm,
                      stroke: warm,
                      strokeWidth: 1,
                  }),
              ]
            : []),
        SvgFrame({
            c,
            x: px(r.pre0),
            y: r.y + 18,
            width: bw(r.pre0, r.pre1),
            height: 28,
            rx: 4,
            fill: blue,
            stroke: blue,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: px(r.kv0),
            y: r.y + 52,
            width: bw(r.kv0, r.kv0 + transferMs),
            height: 28,
            rx: 4,
            fill: purple,
            stroke: purple,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: px(r.tok1 - 28),
            y: r.y + 82,
            width: bw(0, 28),
            height: 22,
            rx: 4,
            fill: green,
            stroke: green,
            strokeWidth: 1,
        }),
    ])

    const geometry = AxisPlot({
        c,
        width,
        height,
        xMin: 0,
        xMax: width,
        yMin: 0,
        yMax: height,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        children: bars,
    })

    const axisOverlay = AxisPlot({
        c,
        width,
        height,
        xMin: 0,
        xMax: width,
        yMin: 0,
        yMax: height,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        paths: [
            {
                points: [
                    { x: x0, y: by(512) },
                    { x: x0 + span, y: by(512) },
                ],
                color: c.borderLight,
                strokeWidth: 2,
            },
        ],
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: (
            <Board c={c} width={width} height={height} background="transparent">
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {geometry}
                </CanvasItem>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {axisOverlay}
                </CanvasItem>

                {label(
                    c,
                    'Prefill-to-decode handoff critical path',
                    20,
                    14,
                    860,
                    42,
                    31,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(
                    c,
                    'Prefill 310 ms | KV TX 107.4 ms | Token 28 ms',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {rowData.map((r) => (
                    <React.Fragment key={r.title}>
                        {label(c, r.title, 34, r.y + 38, 166, 40, 28, r.tone, 'left', 750)}
                    </React.Fragment>
                ))}

                {[0, 100, 200, 300, 400, 500].map((t) =>
                    label(
                        c,
                        String(t),
                        px(t) - 36,
                        520,
                        72,
                        34,
                        28,
                        c.textSecondary,
                        'center',
                        650,
                    ),
                )}
                {label(c, 'Saves 70 ms', px(375.4) + 12, 316, 250, 34, 28, green, 'left', 750)}
                {label(c, 'Span: 375.4', px(400.4) + 12, 448, 220, 34, 28, warm, 'left', 750)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
