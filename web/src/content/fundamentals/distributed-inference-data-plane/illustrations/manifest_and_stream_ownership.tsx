import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 650
export const alt =
    'Disaggregated prefill-to-decode KV transfer architecture and backpressure queue. The router reserves destination HBM blocks on the decode pool before launching prompt prefill. Under normal capacity, prefill ranks shard 2.50 GiB of KV tensors across RDMA or NVLink into reserved decode blocks, verify layout and attempt generation, and transfer stream ownership to a single decoder. When decode HBM slots are exhausted or quarantined, backpressure signals throttle the queue and reject new requests before wasting prefill compute.'

const label = (
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'center',
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
    const red = c.critical

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
            // Control plane top band (y: 108..252)
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 260,
                height: 148,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 320,
                y: 108,
                width: 260,
                height: 148,
                rx: 12,
                fill: c.bgCard,
                stroke: warm,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 616,
                y: 108,
                width: 260,
                height: 148,
                rx: 12,
                fill: c.bgCard,
                stroke: red,
                strokeWidth: 2.5,
            }),

            // Data plane bottom band (y: 288..532)
            SvgFrame({
                c,
                x: 24,
                y: 288,
                width: 260,
                height: 244,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 320,
                y: 288,
                width: 260,
                height: 244,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 616,
                y: 288,
                width: 260,
                height: 244,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2.5,
            }),

            // RDMA queue occupancy bar inside middle box
            SvgFrame({
                c,
                x: 342,
                y: 422,
                width: 216,
                height: 26,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 342,
                y: 422,
                width: 148,
                height: 26,
                rx: 6,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),

            // Footer summary bar
            SvgFrame({
                c,
                x: 24,
                y: 556,
                width: 852,
                height: 64,
                rx: 10,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 1.5,
            }),

            // Arrows
            VectorArrow({
                x1: 284,
                y1: 182,
                x2: 318,
                y2: 182,
                color: purple,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 616,
                y1: 182,
                x2: 582,
                y2: 182,
                color: red,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 154,
                y1: 256,
                x2: 154,
                y2: 286,
                color: blue,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 284,
                y1: 410,
                x2: 318,
                y2: 410,
                color: blue,
                strokeWidth: 4,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 580,
                y1: 410,
                x2: 614,
                y2: 410,
                color: green,
                strokeWidth: 4,
                arrowSize: 4,
            }),
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

                {label(
                    c,
                    'Disaggregated KV transfer and backpressure',
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
                    'Reserve decode KV capacity before launching prefill',
                    20,
                    58,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {/* Control row */}
                {label(c, 'Router Control', 30, 120, 248, 34, 28, purple, 'center', 800)}
                {label(c, 'Attempt id #4', 30, 162, 248, 34, 28, c.textPrimary, 'center', 600)}
                {label(c, 'Launch prefill', 30, 204, 248, 34, 28, c.textSecondary, 'center', 600)}

                {label(c, 'Decode Quota', 326, 120, 248, 34, 28, warm, 'center', 800)}
                {label(c, 'Reserve 520 blk', 326, 162, 248, 34, 28, c.textPrimary, 'center', 600)}
                {label(c, 'TTL lease gate', 326, 204, 248, 34, 28, c.textSecondary, 'center', 600)}

                {label(c, 'Backpressure', 622, 120, 248, 34, 28, red, 'center', 800)}
                {label(c, 'Free < 2.6 GiB', 622, 162, 248, 34, 28, c.textPrimary, 'center', 600)}
                {label(c, 'Reject request', 622, 204, 248, 34, 28, red, 'center', 700)}

                {/* Data plane row */}
                {label(c, 'Prefill (TP2)', 30, 302, 248, 34, 28, blue, 'center', 800)}
                {label(c, '1.25 GiB / rank', 30, 354, 248, 34, 28, c.textPrimary, 'center', 650)}
                {label(c, '8,192 prompt tok', 30, 404, 248, 34, 28, c.textSecondary, 'center', 600)}
                {label(c, 'Hold until ack', 30, 468, 248, 34, 28, blue, 'center', 700)}

                {label(c, 'RDMA / NVLink', 326, 302, 248, 34, 28, blue, 'center', 800)}
                {label(c, 'TX queue: 68%', 326, 362, 248, 34, 28, warm, 'center', 650)}
                {label(c, '2.50 GiB KV', 326, 468, 248, 34, 28, c.textPrimary, 'center', 650)}

                {label(c, 'Decode (TP2)', 622, 302, 248, 34, 28, green, 'center', 800)}
                {label(c, 'Match layout', 622, 354, 248, 34, 28, c.textPrimary, 'center', 650)}
                {label(c, '1024 blks ok', 622, 404, 248, 34, 28, green, 'center', 700)}
                {label(c, '1 decode stream', 622, 468, 248, 34, 28, green, 'center', 750)}

                {/* Footer */}
                {label(
                    c,
                    'Fence stale attempts before decode reads KV.',
                    36,
                    570,
                    828,
                    36,
                    28,
                    c.textPrimary,
                    'center',
                    650,
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
