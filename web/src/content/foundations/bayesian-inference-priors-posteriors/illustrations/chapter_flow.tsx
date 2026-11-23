import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Column,
    FlowArrow,
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
    'Ten observed task outcomes, eight passes and two failures, add directly to a Beta(2,2) prior to produce a Beta(10,4) posterior. On a shared density plot over p from 0 to 1, the broad Beta(2,2) prior peaks at 0.50, the area-rescaled likelihood peaks at 0.800, and the Beta(10,4) posterior peaks at mode 0.750 with mean 10/14 = 0.714.'

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

const grid = Array.from({ length: 51 }, (_, i) => i / 50)

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)

    const plotW = 428
    const plotH = 310
    const pad = 54
    const innerW = plotW - pad * 2
    const innerH = plotH - pad * 2
    const xFor = (p: number) => pad + p * innerW
    const yFor = (d: number) => plotH - pad - (d / 3.6) * innerH

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
                    text: 'Bayes update: prior weights + counts → Beta(10, 4)',
                    fontSize: 25,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    children: [
                        Column({
                            width: 250,
                            gap: 10,
                            children: [
                                Panel({
                                    c,
                                    title: 'Exponent sum',
                                    titleFontSize: 23,
                                    width: 250,
                                    padding: 12,
                                    gap: 6,
                                    shadow: false,
                                    children: Column({
                                        gap: 6,
                                        align: 'center',
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'Beta(2, 2) prior',
                                                fontSize: 23,
                                                color: blue,
                                                fontWeight: 650,
                                            }),
                                            preparePrintTypography(
                                                StackedBar({
                                                    c,
                                                    width: 224,
                                                    height: 40,
                                                    showLegend: false,
                                                    segments: [
                                                        {
                                                            label: 'α',
                                                            value: 2,
                                                            color: blue,
                                                            valueLabel: 'α=2',
                                                        },
                                                        {
                                                            label: 'β',
                                                            value: 2,
                                                            color: c.textMuted,
                                                            valueLabel: 'β=2',
                                                        },
                                                    ],
                                                }),
                                                23,
                                            ),
                                            TextLabel({
                                                c,
                                                text: '+ 8 pass, 2 fail',
                                                fontSize: 23,
                                                fontWeight: 650,
                                                color: warm,
                                            }),
                                            FlowArrow({
                                                c,
                                                direction: 'down',
                                                length: 16,
                                                color: purple,
                                            }),
                                            preparePrintTypography(
                                                StackedBar({
                                                    c,
                                                    width: 224,
                                                    height: 40,
                                                    showLegend: false,
                                                    segments: [
                                                        {
                                                            label: 'α',
                                                            value: 10,
                                                            color: purple,
                                                            valueLabel: 'α=10',
                                                        },
                                                        {
                                                            label: 'β',
                                                            value: 4,
                                                            color: c.textMuted,
                                                            valueLabel: 'β=4',
                                                        },
                                                    ],
                                                }),
                                                23,
                                            ),
                                        ],
                                    }),
                                }),
                                Panel({
                                    c,
                                    title: 'Summaries',
                                    titleFontSize: 23,
                                    width: 250,
                                    padding: 12,
                                    gap: 6,
                                    shadow: false,
                                    children: Column({
                                        gap: 4,
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'Mean: 0.714',
                                                fontSize: 23,
                                                fontWeight: 700,
                                                color: green,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'Mode: 0.750',
                                                fontSize: 23,
                                                fontWeight: 700,
                                                color: purple,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'MLE: 0.800',
                                                fontSize: 23,
                                                fontWeight: 700,
                                                color: warm,
                                            }),
                                        ],
                                    }),
                                }),
                            ],
                        }),
                        Panel({
                            c,
                            title: 'Density over pass rate p',
                            titleFontSize: 23,
                            width: 464,
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
                                                text: 'Prior',
                                                tone: 'blue',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            BadgePill({
                                                c,
                                                text: 'Likelihood',
                                                tone: 'warm',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            BadgePill({
                                                c,
                                                text: 'Posterior',
                                                tone: 'purple',
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
                                            yMax={3.6}
                                            showGrid
                                            gridCount={3}
                                            frameFill={c.bgCard}
                                            frameStroke={c.borderLight}
                                            axisColor={c.borderLight}
                                            paths={[
                                                {
                                                    points: grid.map((p) => ({
                                                        x: p,
                                                        y: betaPdf(p, 2, 2),
                                                    })),
                                                    color: blue,
                                                    strokeWidth: 4,
                                                },
                                                {
                                                    points: grid.map((p) => ({
                                                        x: p,
                                                        y: betaPdf(p, 9, 3),
                                                    })),
                                                    color: warm,
                                                    strokeWidth: 4,
                                                },
                                                {
                                                    points: grid.map((p) => ({
                                                        x: p,
                                                        y: betaPdf(p, 10, 4),
                                                    })),
                                                    color: purple,
                                                    strokeWidth: 5,
                                                },
                                            ]}
                                            vectors={[
                                                {
                                                    x1: 10 / 14,
                                                    y1: 0,
                                                    x2: 10 / 14,
                                                    y2: betaPdf(10 / 14, 10, 4),
                                                    color: green,
                                                    strokeWidth: 2.5,
                                                },
                                            ]}
                                        />
                                        {[0, 1.2, 2.4, 3.6].map((val) => (
                                            <SvgMathText
                                                key={'y-' + val}
                                                text={val.toFixed(1)}
                                                x={pad - 8}
                                                y={yFor(val)}
                                                fill={c.textSecondary}
                                                fontSize={23}
                                                fontWeight={600}
                                                textAnchor="end"
                                                dominantBaseline="middle"
                                            />
                                        ))}
                                        {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
                                            <SvgMathText
                                                key={'x-' + val}
                                                text={val.toFixed(1)}
                                                x={xFor(val)}
                                                y={plotH - pad + 24}
                                                fill={c.textSecondary}
                                                fontSize={23}
                                                fontWeight={600}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            />
                                        ))}
                                    </div>,
                                    TextLabel({
                                        c,
                                        text: 'Likelihood is scaled to area 1 to compare shape.',
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
    })
})

export const create = illustration.create
export default illustration.default
