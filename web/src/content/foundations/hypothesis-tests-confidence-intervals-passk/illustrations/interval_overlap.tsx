import React from 'react'
import {
    AxisPlot,
    Column,
    Panel,
    Row,
    Scene,
    SvgMathText,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 760
export const height = 540
export const preset = 'engineering'
export const alt =
    'Forty paired task differences produce an observed lift of plus 7.5 percentage points. The exact task-bootstrap distribution has a central 95 percent percentile interval from minus 10 to plus 25 points, crossing zero. Its histogram shows possible resampled lifts under the observed row frequencies.'

function bootstrapDist(): Array<{ x: number; y: number }> {
    const pNeg = 5 / 40
    const pZero = 27 / 40
    const pPos = 8 / 40
    let probs = new Float64Array(81)
    probs[40] = 1
    for (let step = 0; step < 40; step += 1) {
        const next = new Float64Array(81)
        for (let idx = 1; idx < 80; idx += 1) {
            const p = probs[idx]
            if (p === 0) continue
            next[idx - 1] += p * pNeg
            next[idx] += p * pZero
            next[idx + 1] += p * pPos
        }
        probs = next
    }
    const pts: Array<{ x: number; y: number }> = []
    for (let s = -12; s <= 16; s += 1) {
        pts.push({ x: (s / 40) * 100, y: probs[40 + s] })
    }
    return pts
}

const distPts = bootstrapDist()
const CI_W = 288
const CI_H = 190
const CI_PAD = 36
const cx = (x: number) => CI_PAD + ((x - -20) / 55) * (CI_W - CI_PAD * 2)
const cy = (y: number) => CI_H - CI_PAD - ((y + 1) / 2) * (CI_H - CI_PAD * 2)

const PLOT_W = 372
const PLOT_H = 290
const PAD = 46
const px = (x: number) => PAD + ((x - -30) / 70) * (PLOT_W - PAD * 2)
const py = (y: number) => PLOT_H - PAD - (y / 0.14) * (PLOT_H - PAD * 2)

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
                    text: '40-task paired bootstrap: +7.5 pp interval spans zero',
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
                            title: '1. 95% lift interval (pp)',
                            titleFontSize: 23,
                            width: 314,
                            padding: 12,
                            gap: 10,
                            shadow: false,
                            children: Column({
                                gap: 10,
                                children: [
                                    <div
                                        style={{
                                            display: 'flex',
                                            position: 'relative',
                                            width: CI_W,
                                            height: CI_H,
                                        }}
                                    >
                                        <AxisPlot
                                            c={c}
                                            width={CI_W}
                                            height={CI_H}
                                            padding={CI_PAD}
                                            xMin={-20}
                                            xMax={35}
                                            yMin={-1}
                                            yMax={1}
                                            showGrid={false}
                                            frameFill={c.bgCard}
                                            frameStroke={c.borderLight}
                                            axisColor={c.borderLight}
                                            paths={[
                                                {
                                                    points: [
                                                        { x: 0, y: -0.75 },
                                                        { x: 0, y: 0.75 },
                                                    ],
                                                    color: warm,
                                                    strokeWidth: 2.5,
                                                    dashed: true,
                                                },
                                                {
                                                    points: [
                                                        { x: -10, y: 0 },
                                                        { x: 25, y: 0 },
                                                    ],
                                                    color: blue,
                                                    strokeWidth: 8,
                                                },
                                            ]}
                                            points={[
                                                { x: -10, y: 0, fill: blue, r: 5 },
                                                {
                                                    x: 7.5,
                                                    y: 0,
                                                    fill: c.bgCard,
                                                    stroke: blue,
                                                    strokeWidth: 4,
                                                    r: 8,
                                                },
                                                { x: 25, y: 0, fill: blue, r: 5 },
                                            ]}
                                            vectors={[]}
                                        />
                                        <SvgMathText
                                            text="−10"
                                            x={cx(-10)}
                                            y={cy(0) + 30}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="0"
                                            x={cx(0)}
                                            y={cy(0) - 34}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={700}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="+7.5"
                                            x={cx(7.5)}
                                            y={cy(0) + 30}
                                            fill={blue}
                                            fontSize={23}
                                            fontWeight={700}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="+25"
                                            x={cx(25)}
                                            y={cy(0) + 30}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                    </div>,
                                    TextLabel({
                                        c,
                                        text: 'Mean lift: +7.5 pp',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: blue,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '95% CI: [−10, +25] pp',
                                        fontSize: 23,
                                        fontWeight: 650,
                                        color: warm,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Zero inside → inconclusive',
                                        fontSize: 23,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: '2. Exact resample distribution',
                            titleFontSize: 23,
                            width: 400,
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
                                            xMin={-30}
                                            xMax={40}
                                            yMin={0}
                                            yMax={0.14}
                                            showGrid
                                            gridCount={4}
                                            frameFill={c.bgCard}
                                            frameStroke={c.borderLight}
                                            axisColor={c.borderLight}
                                            paths={[
                                                { points: distPts, color: blue, strokeWidth: 3.5 },
                                                {
                                                    points: [
                                                        { x: 0, y: 0 },
                                                        { x: 0, y: 0.125 },
                                                    ],
                                                    color: warm,
                                                    strokeWidth: 2.5,
                                                    dashed: true,
                                                },
                                            ]}
                                            points={distPts.map((pt) => ({
                                                x: pt.x,
                                                y: pt.y,
                                                fill:
                                                    pt.x < -10 || pt.x > 25
                                                        ? warm
                                                        : pt.x <= 0
                                                          ? green
                                                          : blue,
                                                r: 4,
                                            }))}
                                            vectors={[
                                                {
                                                    x1: -10,
                                                    y1: 0,
                                                    x2: -10,
                                                    y2: 0.08,
                                                    color: warm,
                                                    strokeWidth: 2,
                                                },
                                                {
                                                    x1: 25,
                                                    y1: 0,
                                                    x2: 25,
                                                    y2: 0.08,
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
                                            text=".12"
                                            x={PAD - 8}
                                            y={py(0.12)}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={600}
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="−10"
                                            x={px(-10)}
                                            y={PLOT_H - PAD + 22}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="0"
                                            x={px(0)}
                                            y={PLOT_H - PAD + 22}
                                            fill={c.textSecondary}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="+7.5"
                                            x={px(7.5)}
                                            y={py(0.125)}
                                            fill={blue}
                                            fontSize={23}
                                            fontWeight={700}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                        <SvgMathText
                                            text="+25"
                                            x={px(25)}
                                            y={PLOT_H - PAD + 22}
                                            fill={warm}
                                            fontSize={23}
                                            fontWeight={650}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        />
                                    </div>,
                                    TextLabel({
                                        c,
                                        text: '24% of resamples fall ≤ 0 pp',
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
