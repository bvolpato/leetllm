import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgPoint,
    TextLabel,
    getReadableToneColor,
    getToneColor,
    defineIllustration,
} from 'vizmatic'

export const width = 1000
export const height = 790
export const alt =
    'Two overlapping filters each pass 19 of 20 requests: TTFT below 450 ms and TPOT below 45 ms. The 18 markers in the overlap pass both. Request r0 has TTFT 500 ms and TPOT 20 ms; r1 has TTFT 100 ms and TPOT 60 ms. Nearest-rank p95 is the nineteenth value, so each marginal p95 passes at 100 ms and 20 ms. Joint success is 18/20, or 90%; with 100 output tokens each over 10 seconds, joint-goodput is 180 useful tokens per second. A 95% joint-compliance target fails.'

const illustration = defineIllustration((c) => {
    const cyan = getToneColor('cyan', c)
    const purple = getToneColor('purple', c)
    const warm = getToneColor('warm', c)
    const greenText = getReadableToneColor('green', c)
    const cyanLine = getReadableToneColor('cyan', c)
    const purpleLine = getReadableToneColor('purple', c)

    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        h: number,
        fontSize: number,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 650,
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

    const dots = Array.from({ length: 18 }, (_, index) => {
        const col = index % 6
        const row = Math.floor(index / 6)
        return SvgPoint({
            cx: 322 + col * 19,
            cy: 370 + row * 24,
            r: 6.5,
            fill: greenText,
            stroke: c.bg,
            strokeWidth: 1.5,
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
                            <ellipse
                                cx="270"
                                cy="430"
                                rx="170"
                                ry="170"
                                fill={cyan}
                                fillOpacity="0.18"
                                stroke={cyanLine}
                                strokeWidth="3"
                            />
                            <ellipse
                                cx="470"
                                cy="430"
                                rx="170"
                                ry="170"
                                fill={purple}
                                fillOpacity="0.18"
                                stroke={purpleLine}
                                strokeWidth="3"
                            />
                            {dots}
                            {SvgPoint({
                                cx: 140,
                                cy: 430,
                                r: 12,
                                fill: warm,
                                stroke: c.textPrimary,
                                strokeWidth: 2,
                            })}
                            {SvgPoint({
                                cx: 600,
                                cy: 430,
                                r: 12,
                                fill: warm,
                                stroke: c.textPrimary,
                                strokeWidth: 2,
                            })}
                        </svg>
                    ),
                }),
                label(
                    'Marginal p95 passes; joint compliance fails',
                    20,
                    14,
                    960,
                    46,
                    38,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label(
                    'Nearest-rank p95 is the 19th value in this 20-request set',
                    20,
                    63,
                    960,
                    36,
                    34,
                    c.textPrimary,
                    'center',
                    650,
                ),
                label(
                    'TTFT p95 · 100 ms < 450 ms',
                    34,
                    115,
                    450,
                    36,
                    32,
                    c.textPrimary,
                    'center',
                    700,
                ),
                label(
                    'TPOT p95 · 20 ms < 45 ms',
                    516,
                    115,
                    450,
                    36,
                    32,
                    c.textPrimary,
                    'center',
                    700,
                ),
                label(
                    '19/20 requests pass TTFT',
                    34,
                    153,
                    450,
                    34,
                    34,
                    c.textPrimary,
                    'center',
                    650,
                ),
                label(
                    '19/20 requests pass TPOT',
                    516,
                    153,
                    450,
                    34,
                    34,
                    c.textPrimary,
                    'center',
                    650,
                ),
                label('TTFT < 450 ms', 40, 214, 330, 34, 34, c.textPrimary, 'center', 700),
                label('TPOT < 45 ms', 390, 214, 250, 34, 34, c.textPrimary, 'center', 700),
                label('r0', 680, 294, 300, 34, 34, c.textPrimary, 'left', 750, true),
                label('TTFT fail 500ms', 680, 332, 300, 34, 32, c.textPrimary, 'left', 650),
                label('TPOT pass 20ms', 680, 370, 300, 34, 32, c.textPrimary, 'left', 650),
                label('r1', 680, 451, 300, 34, 34, c.textPrimary, 'left', 750, true),
                label('TTFT pass 100ms', 680, 489, 300, 34, 32, c.textPrimary, 'left', 650),
                label('TPOT fail 60ms', 680, 527, 300, 34, 32, c.textPrimary, 'left', 650),
                label(
                    '18 markers pass both filters',
                    20,
                    624,
                    960,
                    40,
                    34,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label(
                    'Joint success = 18/20 = 90% < 95% requirement',
                    20,
                    672,
                    960,
                    38,
                    33,
                    c.textPrimary,
                    'center',
                    700,
                ),
                label(
                    'Joint goodput: 18 × 100 tokens ÷ 10 s = 180 tokens/s',
                    20,
                    728,
                    960,
                    40,
                    33,
                    c.textPrimary,
                    'center',
                    700,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
