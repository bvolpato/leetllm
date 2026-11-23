import React from 'react'
import {
    AxisPlot,
    BadgePill,
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
export const height = 540
export const preset = 'engineering'
export const alt =
    'For a pool of ten candidates with two passes, pass@k rises as the attempt budget grows. At k=1 both estimates are 0.200. At k=5, the finite-pool estimate is 0.778 and the with-replacement plug-in is 0.672, a 10.6-percentage-point gap. The curves compare estimators; the true pass@5 remains unknown.'

function exactPassAtK(n: number, c: number, k: number): number {
    if (n - c < k) return 1
    let fail = 1
    for (let i = n - c + 1; i <= n; i += 1) {
        fail *= 1 - k / i
    }
    return 1 - fail
}

const ks = Array.from({ length: 10 }, (_, i) => i + 1)
const PLOT_W = 414
const PLOT_H = 290
const PAD = 48
const px = (k: number) => PAD + ((k - 1) / 9) * (PLOT_W - PAD * 2)
const py = (v: number) => PLOT_H - PAD - v * (PLOT_H - PAD * 2)

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
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
                    text: 'Unbiased pass@k vs plug-in bias (n = 10, c = 2)',
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
                            title: '1. Pool composition (n=10)',
                            titleFontSize: 23,
                            width: 266,
                            padding: 12,
                            gap: 8,
                            shadow: false,
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    preparePrintTypography(
                                        MiniBarChart({
                                            c,
                                            height: 155,
                                            barWidth: 68,
                                            gap: 24,
                                            max: 10,
                                            minBarHeight: 0,
                                            fontSize: 23,
                                            showValues: true,
                                            data: [
                                                {
                                                    label: 'pass',
                                                    value: 2,
                                                    color: green,
                                                    valueLabel: '2',
                                                },
                                                {
                                                    label: 'fail',
                                                    value: 8,
                                                    color: c.textMuted,
                                                    valueLabel: '8',
                                                },
                                            ],
                                        }),
                                        23,
                                    ),
                                    TextLabel({
                                        c,
                                        text: 'At budget k = 5:',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Unbiased: 0.778',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: green,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Plug-in: 0.672',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: warm,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Gap: −10.6 pp',
                                        fontSize: 23,
                                        fontWeight: 650,
                                        color: warm,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: '2. Estimate by attempt budget k',
                            titleFontSize: 23,
                            width: 448,
                            padding: 12,
                            gap: 8,
                            shadow: false,
                            children: Column({
                                gap: 8,
                                children: [
                                    Row({
                                        gap: 10,
                                        children: [
                                            BadgePill({
                                                c,
                                                text: 'Finite pool',
                                                tone: 'green',
                                                fontSize: 23,
                                                height: 34,
                                                filled: true,
                                            }),
                                            BadgePill({
                                                c,
                                                text: 'Plug-in',
                                                tone: 'warm',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                        ],
                                    }),
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
                                            xMin={1}
                                            xMax={10}
                                            yMin={0}
                                            yMax={1.0}
                                            showGrid
                                            gridCount={4}
                                            frameFill={c.bgCard}
                                            frameStroke={c.borderLight}
                                            axisColor={c.borderLight}
                                            paths={[
                                                {
                                                    points: ks.map((k) => ({
                                                        x: k,
                                                        y: exactPassAtK(10, 2, k),
                                                    })),
                                                    color: green,
                                                    strokeWidth: 4,
                                                },
                                                {
                                                    points: ks.map((k) => ({
                                                        x: k,
                                                        y: 1 - 0.8 ** k,
                                                    })),
                                                    color: warm,
                                                    strokeWidth: 3.5,
                                                    dashed: true,
                                                },
                                                {
                                                    points: [
                                                        { x: 5, y: 0.672 },
                                                        { x: 5, y: 0.778 },
                                                    ],
                                                    color: warm,
                                                    strokeWidth: 2.5,
                                                },
                                            ]}
                                            points={[
                                                { x: 5, y: 0.778, fill: green, r: 6 },
                                                { x: 5, y: 0.672, fill: warm, r: 6 },
                                            ]}
                                            vectors={[]}
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
                                            text=".5"
                                            x={PAD - 8}
                                            y={py(0.5)}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="1.0"
                                            x={PAD - 8}
                                            y={py(1)}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="k=1"
                                            x={px(1)}
                                            y={PLOT_H - PAD + 22}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="start"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="5"
                                            x={px(5)}
                                            y={PLOT_H - PAD + 22}
                                            fill={green}
                                            fontSize={23}
                                            fontWeight={700}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="10"
                                            x={px(10)}
                                            y={PLOT_H - PAD + 22}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text=".778"
                                            x={px(5) - 10}
                                            y={py(0.778) - 16}
                                            fill={green}
                                            fontSize={23}
                                            fontWeight={700}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text=".672"
                                            x={px(5) + 10}
                                            y={py(0.672) + 18}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={700}
                                            textAnchor="start"
                                            dominantBaseline="middle"
                                        />
                                    </div>,
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
