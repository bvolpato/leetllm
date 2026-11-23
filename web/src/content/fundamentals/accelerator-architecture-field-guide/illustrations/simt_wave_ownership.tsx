import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getToneColor,
    defineIllustration,
} from 'vizmatic'

export const width = 900
export const height = 675
export const alt =
    'A conceptual AMD CDNA wave has 64 positions arranged as eight groups of eight lanes. A faulty helper consumes lanes 1–32 and omits lanes 33–64; a CUDA warp has 32 lanes, so both 32-lane subgroup sums must be combined. The CPU reference check gives faulty sums 528, 528, and 593 for 63, 64, and 65 inputs, while all 64 lanes give 2016, 2080, and 2145. Input 65 starts another wave but does not restore the omitted half of the first.'

const illustration = defineIllustration((c) => {
    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        h: number,
        fontSize: number,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 600,
        mono = false,
    ) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: h,
            children: TextLabel({
                c,
                text,
                width: '100%',
                fontSize,
                color,
                align,
                fontWeight,
                mono,
            }),
        })

    const consumed = getToneColor('cyan', c)
    const omitted = getToneColor('warm', c)
    const cellSize = 34
    const cellStep = 40
    const gridX = 38
    const gridY = 128
    const laneCells = Array.from({ length: 64 }, (_, index) => {
        const row = Math.floor(index / 8)
        const col = index % 8
        const color = index < 32 ? consumed : omitted
        return SvgFrame({
            key: 'lane-' + index,
            c,
            x: gridX + col * cellStep,
            y: gridY + row * cellStep,
            width: cellSize,
            height: cellSize,
            rx: 2,
            fill: color,
            stroke: color,
            strokeWidth: 0,
        })
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: (
                        <svg
                            width={width}
                            height={height}
                            viewBox={'0 0 ' + width + ' ' + height}
                            role="presentation"
                            aria-hidden="true"
                        >
                            {laneCells}
                            {SvgFrame({
                                c,
                                x: 388,
                                y: 174,
                                width: 22,
                                height: 22,
                                rx: 2,
                                fill: consumed,
                                stroke: consumed,
                                strokeWidth: 0,
                            })}
                            {SvgFrame({
                                c,
                                x: 388,
                                y: 220,
                                width: 22,
                                height: 22,
                                rx: 2,
                                fill: omitted,
                                stroke: omitted,
                                strokeWidth: 0,
                            })}
                            <line
                                x1={gridX - 2}
                                y1={gridY + 4 * cellStep - 3}
                                x2={gridX + 8 * cellStep - 4}
                                y2={gridY + 4 * cellStep - 3}
                                stroke={c.bgCard}
                                strokeWidth="5"
                            />
                            <line
                                x1="22"
                                y1="490"
                                x2="878"
                                y2="490"
                                stroke={c.border}
                                strokeWidth="1.5"
                            />
                            <line
                                x1="22"
                                y1="572"
                                x2="878"
                                y2="572"
                                stroke={c.borderLight}
                                strokeWidth="1"
                            />
                            <line
                                x1="22"
                                y1="618"
                                x2="878"
                                y2="618"
                                stroke={c.borderLight}
                                strokeWidth="1"
                            />
                            <line
                                x1="22"
                                y1="664"
                                x2="878"
                                y2="664"
                                stroke={c.borderLight}
                                strokeWidth="1"
                            />
                        </svg>
                    ),
                }),
                label(
                    'Lane ownership determines the reduction',
                    22,
                    12,
                    856,
                    40,
                    36,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label(
                    'CDNA wave · 64 physical lanes',
                    386,
                    124,
                    492,
                    36,
                    32,
                    c.textPrimary,
                    'left',
                    700,
                ),
                label('1–32 consumed', 424, 168, 454, 36, 32, c.textPrimary, 'left', 700),
                label('33–64 skipped', 424, 214, 454, 36, 32, c.textPrimary, 'left', 700),
                label(
                    'Each grid row groups eight lanes.',
                    386,
                    258,
                    492,
                    36,
                    30,
                    c.textPrimary,
                    'left',
                    600,
                ),
                label('65 starts a new wave.', 386, 302, 492, 36, 30, c.textPrimary, 'left', 650),
                label('First wave still skips', 386, 340, 492, 36, 30, c.textPrimary, 'left', 600),
                label('lanes 33–64.', 386, 374, 492, 36, 30, c.textPrimary, 'left', 600),
                label('CUDA warp · 32 lanes', 386, 412, 492, 36, 30, c.textPrimary, 'left', 650),
                label(
                    'Combine both 32-lane sums.',
                    386,
                    448,
                    492,
                    36,
                    30,
                    c.textPrimary,
                    'left',
                    600,
                ),
                label(
                    'CPU reference · sum of inputs 1…N',
                    24,
                    498,
                    852,
                    34,
                    32,
                    c.textPrimary,
                    'left',
                    700,
                ),
                label('N', 30, 537, 280, 32, 30, c.textPrimary, 'left', 700),
                label('63', 348, 537, 140, 32, 30, c.textPrimary, 'center', 700, true),
                label('64', 526, 537, 140, 32, 30, c.textPrimary, 'center', 700, true),
                label('65', 704, 537, 140, 32, 30, c.textPrimary, 'center', 700, true),
                label('Faulty · first 32', 30, 579, 280, 32, 30, c.textPrimary, 'left', 650),
                label('528', 348, 579, 140, 32, 30, c.textPrimary, 'center', 700, true),
                label('528', 526, 579, 140, 32, 30, c.textPrimary, 'center', 700, true),
                label('593', 704, 579, 140, 32, 30, c.textPrimary, 'center', 700, true),
                label('All 64 lanes', 30, 625, 280, 32, 30, c.textPrimary, 'left', 650),
                label('2016', 348, 625, 140, 32, 30, c.textPrimary, 'center', 700, true),
                label('2080', 526, 625, 140, 32, 30, c.textPrimary, 'center', 700, true),
                label('2145', 704, 625, 140, 32, 30, c.textPrimary, 'center', 700, true),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
