import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 560
export const alt =
    'Four per-rank bars share a 0-to-90 GB scale with an 80 GB budget line. TP=1 requests 70 GB of weights and 16 GB of reserve, so 6 GB extends past the budget. TP=2 shows both ranks at 35 GB weights, 16 GB reserve, and 29 GB free each. TP=4 shows one of four identical ranks at 17.5 GB weights, 16 GB reserve, and 46.5 GB free.'

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
    const weight = c.primary
    const reserve = c.neutral
    const avail = c.positive
    const oom = c.critical

    const x0 = 216
    const span = 620
    const gx = (gb: number) => x0 + (gb / 90) * span
    const gw = (gb: number) => (gb / 90) * span
    const by = (yTop: number) => height - yTop

    const rows = [
        {
            name: 'TP=1 (1x)',
            y: 152,
            w: 70,
            r: 10,
            f: 0,
            over: 6,
            note: '86 GB (OOM +6)',
            col: oom,
        },
        { name: 'TP=2 r0', y: 230, w: 35, r: 16, f: 29, over: 0, note: '29 GB free', col: avail },
        { name: 'TP=2 r1', y: 308, w: 35, r: 16, f: 29, over: 0, note: '29 GB free', col: avail },
        {
            name: 'TP=4 (x4)',
            y: 386,
            w: 17.5,
            r: 16,
            f: 46.5,
            over: 0,
            note: '46.5 GB free',
            col: avail,
        },
    ]

    const bars = rows.flatMap((r) => {
        const items = [
            SvgFrame({
                c,
                x: x0,
                y: r.y,
                width: gw(r.w),
                height: 42,
                rx: 4,
                fill: weight,
                stroke: weight,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + gw(r.w) + 2,
                y: r.y,
                width: gw(r.r) - 2,
                height: 42,
                rx: 4,
                fill: reserve,
                stroke: reserve,
                strokeWidth: 1,
            }),
        ]
        if (r.f > 0) {
            items.push(
                SvgFrame({
                    c,
                    x: x0 + gw(r.w + r.r) + 2,
                    y: r.y,
                    width: gw(r.f) - 2,
                    height: 42,
                    rx: 4,
                    fill: avail,
                    stroke: avail,
                    strokeWidth: 1,
                }),
            )
        }
        if (r.over > 0) {
            items.push(
                SvgFrame({
                    c,
                    x: gx(80) + 2,
                    y: r.y,
                    width: gw(r.over),
                    height: 42,
                    rx: 4,
                    fill: oom,
                    stroke: oom,
                    strokeWidth: 1,
                }),
            )
        }
        return items
    })

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
        children: [
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 852,
                height: 426,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...bars,
        ],
    })

    const lines = AxisPlot({
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
                    { x: gx(80), y: by(136) },
                    { x: gx(80), y: by(452) },
                ],
                color: oom,
                strokeWidth: 3,
            },
            {
                points: [
                    { x: x0, y: by(452) },
                    { x: x0 + span, y: by(452) },
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
                    {lines}
                </CanvasItem>

                {label(
                    c,
                    'Per-rank VRAM on 80 GB GPUs (70w + 16r GB)',
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
                    'Purple = wts | Gray = 16 rsv | Green = KV free',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {rows.map((r) => (
                    <React.Fragment key={r.name}>
                        {label(
                            c,
                            r.name,
                            40,
                            r.y + 4,
                            166,
                            36,
                            28,
                            r.over > 0 ? oom : c.textPrimary,
                            'left',
                            750,
                        )}
                        {label(
                            c,
                            r.note,
                            r.over > 0 ? x0 + 16 : x0 + gw(r.w + r.r) + 10,
                            r.y + 4,
                            r.over > 0 ? 320 : 196,
                            34,
                            28,
                            c.bg,
                            'left',
                            750,
                        )}
                    </React.Fragment>
                ))}

                {label(c, '80 GB cap', gx(80) - 210, 114, 200, 34, 28, oom, 'right', 800)}
                {[0, 20, 40, 60, 80].map((t) =>
                    label(
                        c,
                        `${t} GB`,
                        gx(t) - 48,
                        468,
                        96,
                        34,
                        28,
                        t === 80 ? oom : c.textSecondary,
                        'center',
                        650,
                    ),
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
