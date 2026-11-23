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
export const height = 540
export const alt =
    'Lifecycle transitions for one 2,600 MiB destination buffer during lease expiry. Attempt 4 begins remote RDMA writes, then the destination lease expires and fences commit while in-flight network writes can still touch the buffer. A continuous quarantine holds the 2,600 MiB allocation until transport abort acknowledgement and GPU reader quiescence confirm all accesses stopped before reclaiming memory.'

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
    const warm = c.warning
    const red = c.critical
    const green = c.positive

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
            // Left sequence (5 steps)
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 486,
                height: 64,
                rx: 10,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 24,
                y: 192,
                width: 486,
                height: 64,
                rx: 10,
                fill: c.bgCard,
                stroke: red,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 24,
                y: 276,
                width: 486,
                height: 64,
                rx: 10,
                fill: c.bgCard,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 24,
                y: 360,
                width: 486,
                height: 64,
                rx: 10,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 24,
                y: 444,
                width: 486,
                height: 64,
                rx: 10,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2.5,
            }),

            VectorArrow({
                x1: 267,
                y1: 172,
                x2: 267,
                y2: 190,
                color: blue,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 267,
                y1: 256,
                x2: 267,
                y2: 274,
                color: red,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 267,
                y1: 340,
                x2: 267,
                y2: 358,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 267,
                y1: 424,
                x2: 267,
                y2: 442,
                color: green,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Right rail: Buffer B4 Charge
            SvgFrame({
                c,
                x: 544,
                y: 108,
                width: 332,
                height: 316,
                rx: 12,
                fill: c.bgCard,
                stroke: warm,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 576,
                y: 192,
                width: 268,
                height: 148,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 544,
                y: 444,
                width: 332,
                height: 64,
                rx: 12,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2.5,
            }),

            VectorArrow({
                x1: 510,
                y1: 308,
                x2: 542,
                y2: 308,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 710,
                y1: 424,
                x2: 710,
                y2: 442,
                color: green,
                strokeWidth: 3.5,
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
                    'Lease expiry revokes commit, not physical writes',
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
                    'Hold byte charge until RDMA abort and GPU readers quiesce',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(
                    c,
                    '1. RDMA writes start (attempt 4)',
                    42,
                    122,
                    450,
                    36,
                    28,
                    blue,
                    'left',
                    750,
                )}
                {label(c, '2. TTL expires -> fence', 42, 206, 450, 36, 28, red, 'left', 750)}
                {label(
                    c,
                    '3. In-flight RDMA writes still land',
                    42,
                    290,
                    450,
                    36,
                    28,
                    warm,
                    'left',
                    750,
                )}
                {label(
                    c,
                    '4. Abort ack + GPU readers idle',
                    42,
                    374,
                    450,
                    36,
                    28,
                    green,
                    'left',
                    750,
                )}
                {label(c, '5. Reclaim 2,600 MiB safely', 42, 458, 450, 36, 28, green, 'left', 800)}

                {label(c, 'B4: 2,600 MiB', 564, 128, 292, 36, 28, warm, 'center', 800)}
                {label(c, 'QUARANTINED', 590, 224, 240, 36, 28, warm, 'center', 800)}
                {label(c, 'Reuse blocked', 590, 272, 240, 36, 28, c.textPrimary, 'center', 650)}
                {label(
                    c,
                    'Charged steps 1..4',
                    564,
                    366,
                    292,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {label(c, '2,600 MiB free', 564, 458, 292, 36, 28, green, 'center', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
