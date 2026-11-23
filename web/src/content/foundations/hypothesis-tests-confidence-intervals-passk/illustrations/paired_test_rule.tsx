import React from 'react'
import {
    AxisPlot,
    Column,
    MiniBarChart,
    Panel,
    Row,
    Scene,
    SvgMathText,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 760
export const height = 520
export const preset = 'engineering'
export const alt =
    'Under the fair-coin null, one disagreement gives equal probability to zero or one B win, so one observed win has a right-tail probability of 0.50. With sixteen disagreements, a binomial distribution peaks at eight wins; the highlighted tail from thirteen to sixteen wins sums to 0.0106.'

function binomHalf(n: number, k: number): number {
    let coeff = 1
    for (let i = 1; i <= k; i += 1) {
        coeff = (coeff * (n - i + 1)) / i
    }
    return coeff / 2 ** n
}

const binom16Pts = Array.from({ length: 17 }, (_, k) => ({
    x: k,
    y: binomHalf(16, k),
}))

const PLOT_W = 418
const PLOT_H = 290
const PAD = 48
const px = (w: number) => PAD + (w / 16) * (PLOT_W - PAD * 2)
const py = (p: number) => PLOT_H - PAD - (p / 0.22) * (PLOT_H - PAD * 2)

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)

    return Scene({
        c,
        padding: 16,
        contentWidth: 728,
        gap: 10,
        children: Column({
            gap: 10,
            width: 728,
            children: [
                TextLabel({
                    c,
                    text: 'Fair-sign null: 1 disagreement vs 16 disagreements',
                    fontSize: 25,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: '1. d = 1 disagreement',
                            titleFontSize: 23,
                            width: 266,
                            padding: 12,
                            gap: 10,
                            shadow: false,
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    preparePrintTypography(
                                        MiniBarChart({
                                            c,
                                            height: 205,
                                            barWidth: 70,
                                            gap: 24,
                                            max: 0.65,
                                            minBarHeight: 0,
                                            fontSize: 23,
                                            showValues: true,
                                            data: [
                                                {
                                                    label: '0 win',
                                                    value: 0.5,
                                                    color: c.textMuted,
                                                    valueLabel: '0.50',
                                                },
                                                {
                                                    label: '1 win',
                                                    value: 0.5,
                                                    color: warm,
                                                    valueLabel: '0.50',
                                                },
                                            ],
                                        }),
                                        23,
                                    ),
                                    TextLabel({
                                        c,
                                        text: 'P(B ≥ 1) = 0.500',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: warm,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '1 win cannot look rare',
                                        fontSize: 23,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: '2. d = 16 disagreements',
                            titleFontSize: 23,
                            width: 448,
                            padding: 12,
                            gap: 8,
                            shadow: false,
                            children: Column({
                                gap: 8,
                                children: [
                                    <div
                                        style={{
                                            display: 'flex',
                                            position: 'relative',
                                            width: PLOT_W,
                                            height: PLOT_H,
                                        }}
                                    >
                                        <AxisPlot
                                            c={c}
                                            width={PLOT_W}
                                            height={PLOT_H}
                                            padding={PAD}
                                            xMin={0}
                                            xMax={16}
                                            yMin={0}
                                            yMax={0.22}
                                            showGrid
                                            gridCount={4}
                                            frameFill={c.bgCard}
                                            frameStroke={c.borderLight}
                                            axisColor={c.borderLight}
                                            paths={[
                                                {
                                                    points: binom16Pts,
                                                    color: blue,
                                                    strokeWidth: 3.5,
                                                },
                                                {
                                                    points: binom16Pts.slice(13),
                                                    color: warm,
                                                    strokeWidth: 4.5,
                                                },
                                            ]}
                                            points={binom16Pts.map((pt) => ({
                                                x: pt.x,
                                                y: pt.y,
                                                fill: pt.x >= 13 ? warm : blue,
                                                r: pt.x >= 13 ? 6 : 4,
                                            }))}
                                            vectors={[
                                                {
                                                    x1: 13,
                                                    y1: 0,
                                                    x2: 13,
                                                    y2: 0.14,
                                                    color: warm,
                                                    strokeWidth: 2,
                                                },
                                            ]}
                                        />
                                        <SvgMathText
                                            text="0"
                                            x={PAD - 8}
                                            y={py(0)}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text=".20"
                                            x={PAD - 8}
                                            y={py(0.2)}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="0"
                                            x={px(0)}
                                            y={PLOT_H - PAD + 22}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="8"
                                            x={px(8)}
                                            y={PLOT_H - PAD + 22}
                                            fill={blue}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="13+"
                                            x={px(13)}
                                            y={PLOT_H - PAD + 22}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={700}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="16"
                                            x={px(16)}
                                            y={PLOT_H - PAD + 22}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text=".0106"
                                            x={px(13) + 8}
                                            y={py(0.11)}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={700}
                                            textAnchor="start"
                                            dominantBaseline="middle"
                                        />
                                    </div>,
                                    TextLabel({
                                        c,
                                        text: 'Exact right tail (13..16): p = 0.0106',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: warm,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
