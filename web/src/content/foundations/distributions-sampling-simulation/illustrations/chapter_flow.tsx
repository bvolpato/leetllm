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
    'A Bernoulli probability mass function assigns 28% to escalation and 72% to resolution. A lognormal cumulative distribution maps uniform draws to positive response times: u = 0.50 reaches the 6.0-second median, and u = 0.95 reaches the 14.8-second p95. The final 5% of uniform draws maps to response times at or beyond 14.8 seconds.'

function erfApprox(x: number): number {
    const sign = x < 0 ? -1 : 1
    const a = Math.abs(x)
    const t = 1 / (1 + 0.3275911 * a)
    const y =
        1 -
        ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
            0.254829592) *
            t *
            Math.exp(-a * a)
    return sign * y
}

function lognormalCdf(t: number): number {
    if (t <= 0) return 0
    const z = (Math.log(t) - Math.log(6.0)) / 0.55
    return 0.5 * (1 + erfApprox(z / Math.SQRT2))
}

const PLOT_W = 408
const PLOT_H = 300
const PLOT_PAD = 46
const INNER_W = PLOT_W - PLOT_PAD * 2
const INNER_H = PLOT_H - PLOT_PAD * 2
const X_MAX = 24
const px = (x: number) => PLOT_PAD + (x / X_MAX) * INNER_W
const py = (y: number) => PLOT_PAD + (1 - y) * INNER_H

const curvePts = Array.from({ length: 49 }, (_, i) => {
    const t = (i / 48) * X_MAX
    return { x: t, y: lognormalCdf(t) }
})

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
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
                    text: 'PMF masses and inverse-CDF latency transform',
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
                            title: '1. Discrete PMF',
                            titleFontSize: 23,
                            width: 274,
                            padding: 12,
                            gap: 10,
                            shadow: false,
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Bernoulli(p = 0.72)',
                                        fontSize: 23,
                                        fontWeight: 650,
                                        color: blue,
                                    }),
                                    preparePrintTypography(
                                        MiniBarChart({
                                            c,
                                            height: 210,
                                            barWidth: 72,
                                            gap: 24,
                                            max: 100,
                                            minBarHeight: 0,
                                            fontSize: 23,
                                            showValues: true,
                                            data: [
                                                {
                                                    label: '0 fail',
                                                    value: 28,
                                                    color: warm,
                                                    valueLabel: '0.28',
                                                },
                                                {
                                                    label: '1 pass',
                                                    value: 72,
                                                    color: green,
                                                    valueLabel: '0.72',
                                                },
                                            ],
                                        }),
                                        23,
                                    ),
                                    TextLabel({
                                        c,
                                        text: 'Exact masses sum to 1.00',
                                        fontSize: 23,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: '2. Lognormal CDF F(t)',
                            titleFontSize: 23,
                            width: 440,
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
                                            padding={PLOT_PAD}
                                            xMin={0}
                                            xMax={X_MAX}
                                            yMin={0}
                                            yMax={1.0}
                                            showGrid
                                            gridCount={4}
                                            frameFill={c.bgCard}
                                            frameStroke={c.borderLight}
                                            axisColor={c.borderLight}
                                            paths={[
                                                {
                                                    points: [
                                                        { x: 0, y: 0.5 },
                                                        { x: 6.0, y: 0.5 },
                                                        { x: 6.0, y: 0 },
                                                    ],
                                                    color: green,
                                                    strokeWidth: 2.5,
                                                    dashed: true,
                                                },
                                                {
                                                    points: [
                                                        { x: 0, y: 0.95 },
                                                        { x: 14.8, y: 0.95 },
                                                        { x: 14.8, y: 0 },
                                                    ],
                                                    color: warm,
                                                    strokeWidth: 2.5,
                                                    dashed: true,
                                                },
                                                { points: curvePts, color: blue, strokeWidth: 4 },
                                            ]}
                                            points={[
                                                { x: 6.0, y: 0.5, fill: green, r: 6 },
                                                { x: 14.8, y: 0.95, fill: warm, r: 6 },
                                            ]}
                                            vectors={[]}
                                        />
                                        <SvgMathText
                                            text="0.5"
                                            x={PLOT_PAD - 8}
                                            y={py(0.5)}
                                            fill={green}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text=".95"
                                            x={PLOT_PAD - 8}
                                            y={py(0.95)}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="0"
                                            x={PLOT_PAD - 8}
                                            y={py(0)}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="6.0s"
                                            x={px(6.0) + 12}
                                            y={py(0.5) + 20}
                                            fill={green}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="start"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="14.8s"
                                            x={px(14.8)}
                                            y={py(0.95) - 18}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="6"
                                            x={px(6.0)}
                                            y={PLOT_H - PLOT_PAD + 22}
                                            fill={green}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="15"
                                            x={px(14.8)}
                                            y={PLOT_H - PLOT_PAD + 22}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="24s"
                                            x={px(24)}
                                            y={PLOT_H - PLOT_PAD + 22}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                    </div>,
                                    TextLabel({
                                        c,
                                        text: 'Top 5% of u ∈ (0,1) stretches past 14.8s',
                                        fontSize: 23,
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
