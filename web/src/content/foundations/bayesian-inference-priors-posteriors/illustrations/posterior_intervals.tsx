import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Column,
    IntervalPlot,
    Panel,
    Row,
    Scene,
    StackedBar,
    SvgMathText,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 760
export const height = 560
export const preset = 'engineering'
export const alt =
    'Under a Beta(2,2) prior, 8 passes in 10 tasks give Beta(10,4) with 90% equal-tailed interval [0.505, 0.887] and 57.9% density above p = 0.70. Observing 80 passes in 100 tasks sharpens Beta(82,22) to interval [0.720, 0.851] and puts 98.1% above p = 0.70, clearing a 95% threshold.'

function logFactorial(n: number): number {
    let sum = 0
    for (let i = 2; i <= n; i += 1) sum += Math.log(i)
    return sum
}

function betaPdf(p: number, a: number, b: number): number {
    if (p <= 0 || p >= 1) return 0
    const norm = logFactorial(a + b - 1) - logFactorial(a - 1) - logFactorial(b - 1)
    return Math.exp(norm + (a - 1) * Math.log(p) + (b - 1) * Math.log(1 - p))
}

const grid = Array.from({ length: 61 }, (_, i) => i / 60)

const illustration = defineIllustration((c) => {
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)

    const plotW = 338
    const plotH = 310
    const pad = 50
    const innerW = plotW - pad * 2
    const innerH = plotH - pad * 2
    const xFor = (p: number) => pad + p * innerW
    const yFor = (d: number) => plotH - pad - (d / 11) * innerH

    const intervals = preparePrintTypography(
        IntervalPlot({
            c,
            width: 332,
            height: 170,
            min: 0.0,
            max: 1.0,
            format: (v) => (v === 0 || v === 0.5 || v === 1 ? v.toFixed(1) : ''),
            data: [
                {
                    label: '8/10',
                    low: 0.505,
                    mid: 0.714,
                    high: 0.887,
                    color: warm,
                    lowLabel: '',
                    midLabel: '',
                    highLabel: '',
                },
                {
                    label: '80/100',
                    low: 0.72,
                    mid: 0.788,
                    high: 0.851,
                    color: green,
                    lowLabel: '',
                    midLabel: '',
                    highLabel: '',
                },
                {
                    label: 'bar',
                    low: 0.7,
                    mid: 0.7,
                    high: 0.7,
                    color: red,
                    lowLabel: '',
                    midLabel: '',
                    highLabel: '',
                },
            ],
        }),
        23,
    )

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
                    text: '80% pass fraction: 100 tasks sharpen the posterior past 0.70',
                    fontSize: 24,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Density under Beta(2, 2)',
                            titleFontSize: 23,
                            width: 364,
                            padding: 12,
                            gap: 8,
                            shadow: false,
                            children: Column({
                                gap: 8,
                                children: [
                                    Row({
                                        gap: 8,
                                        children: [
                                            BadgePill({
                                                c,
                                                text: 'Beta(10,4)',
                                                tone: 'warm',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            BadgePill({
                                                c,
                                                text: 'Beta(82,22)',
                                                tone: 'green',
                                                fontSize: 23,
                                                height: 34,
                                                filled: true,
                                            }),
                                        ],
                                    }),
                                    <div
                                        style={{
                                            display: 'flex',
                                            position: 'relative',
                                            width: plotW,
                                            height: plotH,
                                        }}
                                    >
                                        <AxisPlot
                                            c={c}
                                            width={plotW}
                                            height={plotH}
                                            padding={pad}
                                            xMin={0}
                                            xMax={1}
                                            yMin={0}
                                            yMax={11}
                                            showGrid
                                            gridCount={3}
                                            frameFill={c.bgCard}
                                            frameStroke={c.borderLight}
                                            axisColor={c.borderLight}
                                            paths={[
                                                {
                                                    points: grid.map((p) => ({
                                                        x: p,
                                                        y: betaPdf(p, 10, 4),
                                                    })),
                                                    color: warm,
                                                    strokeWidth: 4.5,
                                                },
                                                {
                                                    points: grid.map((p) => ({
                                                        x: p,
                                                        y: betaPdf(p, 82, 22),
                                                    })),
                                                    color: green,
                                                    strokeWidth: 4.5,
                                                },
                                            ]}
                                            vectors={[
                                                {
                                                    x1: 0.7,
                                                    y1: 0,
                                                    x2: 0.7,
                                                    y2: 10.5,
                                                    color: red,
                                                    strokeWidth: 2.5,
                                                },
                                            ]}
                                        />
                                        {[0, 5, 10].map((val) => (
                                            <SvgMathText
                                                key={'y-' + val}
                                                text={String(val)}
                                                x={pad - 8}
                                                y={yFor(val)}
                                                fill={c.textSecondary}
                                                fontSize={23}
                                                fontWeight={600}
                                                textAnchor="end"
                                                dominantBaseline="middle"
                                            />
                                        ))}
                                        {[0, 0.5, 0.7, 1.0].map((val) => (
                                            <SvgMathText
                                                key={'x-' + val}
                                                text={val.toFixed(1)}
                                                x={xFor(val)}
                                                y={plotH - pad + 24}
                                                fill={val === 0.7 ? red : c.textSecondary}
                                                fontSize={23}
                                                fontWeight={val === 0.7 ? 700 : 600}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            />
                                        ))}
                                    </div>,
                                    TextLabel({
                                        c,
                                        text: 'Vertical red line: p = 0.70 bar.',
                                        fontSize: 23,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                        Column({
                            width: 350,
                            gap: 10,
                            children: [
                                Panel({
                                    c,
                                    title: '90% equal-tailed interval',
                                    titleFontSize: 23,
                                    width: 350,
                                    padding: 12,
                                    gap: 4,
                                    shadow: false,
                                    children: Column({
                                        gap: 4,
                                        children: [
                                            intervals,
                                            TextLabel({
                                                c,
                                                text: '[.505, .887] vs [.720, .851]',
                                                fontSize: 23,
                                                color: c.textSecondary,
                                            }),
                                        ],
                                    }),
                                }),
                                Panel({
                                    c,
                                    title: 'Share P(p > 0.70 | data)',
                                    titleFontSize: 23,
                                    width: 350,
                                    padding: 12,
                                    gap: 8,
                                    shadow: false,
                                    children: Column({
                                        gap: 8,
                                        children: [
                                            preparePrintTypography(
                                                StackedBar({
                                                    c,
                                                    width: 324,
                                                    height: 36,
                                                    showLegend: false,
                                                    segments: [
                                                        {
                                                            label: 'above',
                                                            value: 57.9,
                                                            color: warm,
                                                            valueLabel: '8/10: 57.9%',
                                                        },
                                                        {
                                                            label: 'below',
                                                            value: 42.1,
                                                            color: c.textMuted,
                                                            valueLabel: '',
                                                        },
                                                    ],
                                                }),
                                                23,
                                            ),
                                            preparePrintTypography(
                                                StackedBar({
                                                    c,
                                                    width: 324,
                                                    height: 36,
                                                    showLegend: false,
                                                    segments: [
                                                        {
                                                            label: 'above',
                                                            value: 98.1,
                                                            color: green,
                                                            valueLabel: '80/100: 98.1%',
                                                        },
                                                        {
                                                            label: 'below',
                                                            value: 1.9,
                                                            color: c.textMuted,
                                                            valueLabel: '',
                                                        },
                                                    ],
                                                }),
                                                23,
                                            ),
                                            TextLabel({
                                                c,
                                                text: 'Cutoff: 95% (80/100 clears)',
                                                fontSize: 23,
                                                color: c.textSecondary,
                                            }),
                                        ],
                                    }),
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
