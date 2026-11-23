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
export const height = 630
export const alt =
    'An 8,192 MiB decode KV pool holds three 2,600 MiB reservations leaving 392 MiB free, so a fourth reservation fails even while slot 3 is retired and draining. Below, two 512-block rank strips compare notifications with unique identity tracking: block 0 on rank 0 arrives twice while block 1 is missing, yielding 1,024 notifications for only 1,023 unique blocks.'

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
    const warm = c.warning
    const red = c.critical
    const green = c.positive

    const x0 = 42
    const poolW = 816
    const wSlot = (2600 / 8192) * poolW

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
            // Top pool bar (y: 106..292)
            SvgFrame({
                c,
                x: 24,
                y: 106,
                width: 852,
                height: 186,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: x0,
                y: 158,
                width: poolW,
                height: 52,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: x0,
                y: 158,
                width: wSlot - 4,
                height: 52,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + wSlot,
                y: 158,
                width: wSlot - 4,
                height: 52,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + 2 * wSlot,
                y: 158,
                width: wSlot - 4,
                height: 52,
                rx: 6,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),

            // Bottom rank block coverage (y: 314..606)
            SvgFrame({
                c,
                x: 24,
                y: 314,
                width: 852,
                height: 292,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 168,
                y: 368,
                width: 690,
                height: 28,
                rx: 5,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            // Missing block 1 notch
            SvgFrame({
                c,
                x: 184,
                y: 368,
                width: 10,
                height: 28,
                rx: 2,
                fill: red,
                stroke: red,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 168,
                y: 408,
                width: 690,
                height: 28,
                rx: 5,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),

            // Magnified blocks 0, 1, 2..511
            SvgFrame({
                c,
                x: 168,
                y: 470,
                width: 170,
                height: 54,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 360,
                y: 470,
                width: 170,
                height: 54,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: red,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 552,
                y: 470,
                width: 306,
                height: 54,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 189,
                y1: 398,
                x2: 248,
                y2: 468,
                color: warm,
                strokeWidth: 3,
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
                    'KV pool reservations and unique block coverage',
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
                    'Draining slots hold bytes; duplicates hide gaps',
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
                    'Decode pool: 8,192 MiB (3 x 2,600 MiB = 7,800 MiB)',
                    42,
                    118,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'Slot 1 (2600)',
                    x0 + 8,
                    168,
                    wSlot - 16,
                    34,
                    28,
                    c.textPrimary,
                    'center',
                    750,
                )}
                {label(
                    c,
                    'Slot 2 (2600)',
                    x0 + wSlot + 8,
                    168,
                    wSlot - 16,
                    34,
                    28,
                    c.textPrimary,
                    'center',
                    750,
                )}
                {label(
                    c,
                    'Retired',
                    x0 + 2 * wSlot + 8,
                    168,
                    wSlot - 16,
                    34,
                    28,
                    c.textPrimary,
                    'center',
                    750,
                )}
                {label(
                    c,
                    'Free: 392 MiB -> 4th request (2,600 MiB) rejected',
                    42,
                    232,
                    816,
                    36,
                    28,
                    red,
                    'left',
                    750,
                )}

                {label(
                    c,
                    'Count unique (rank, block) arrivals before commit',
                    42,
                    326,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, 'Rank 0', 42, 364, 114, 34, 28, blue, 'left', 750)}
                {label(c, 'Rank 1', 42, 404, 114, 34, 28, purple, 'left', 750)}

                {label(c, 'Blk 0: 2x', 172, 480, 162, 34, 28, blue, 'center', 750)}
                {label(c, 'Blk 1: miss', 364, 480, 162, 34, 28, red, 'center', 750)}
                {label(c, 'Blks 2..511: 1x', 556, 480, 298, 34, 28, green, 'center', 750)}
                {label(
                    c,
                    '1,024 msgs != 1,023 unique blocks (commit blocked)',
                    42,
                    542,
                    816,
                    40,
                    28,
                    red,
                    'left',
                    750,
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
