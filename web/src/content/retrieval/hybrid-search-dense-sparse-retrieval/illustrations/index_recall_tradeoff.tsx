import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, at, figure, kit, label, marks, plane } from './_kit'

export const width = 640
export const height = 424
export const alt =
    'A chart of recall at 10 against vectors scored per query on a logarithmic axis. The HNSW curve rises from 0.653 at 323 scored to 0.981 at 2,923. The IVF curve rises from 0.246 at 561 scored to 0.978 at 3,039, staying below HNSW until the two nearly meet. Exact search sits alone at recall 1.0 and 20,000 scored.'

// The real output of ivf-and-hnsw.py in this chapter. Change them only by rerunning that listing.
const IVF = [
    [1, 561, 0.246],
    [2, 619, 0.424],
    [4, 724, 0.671],
    [8, 873, 0.88],
    [16, 1149, 0.935],
    [32, 1772, 0.958],
    [64, 3039, 0.978],
] as const
const HNSW = [
    [10, 323, 0.653],
    [20, 449, 0.823],
    [40, 618, 0.914],
    [80, 878, 0.942],
    [160, 1444, 0.96],
    [320, 2923, 0.981],
] as const
const EXACT = [20000, 1] as const

const LEFT = 58
const TOP = 40
const PLOT_W = INNER - LEFT - 14
const PLOT_H = 290
const X_MIN = Math.log10(250)
const X_MAX = Math.log10(26000)
const Y_MIN = 0.2
const Y_MAX = 1.0
const px = (scored: number) => LEFT + ((Math.log10(scored) - X_MIN) / (X_MAX - X_MIN)) * PLOT_W
const py = (recall: number) => TOP + ((Y_MAX - recall) / (Y_MAX - Y_MIN)) * PLOT_H
const line = (points: readonly (readonly [number, number, number])[]) =>
    points.map(([, x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)} ${py(y).toFixed(1)}`).join(' ')

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const lab = (text: string, x: number, y: number, color: string, w: number, weight = 400) =>
        at(x, y, label(k, text, { size: S, color, width: w, weight }))
    return figure(
        k,
        plane(
            INNER,
            TOP + PLOT_H + 62,
            <>
                {marks(
                    INNER,
                    TOP + PLOT_H + 62,
                    <>
                        {[0.2, 0.4, 0.6, 0.8, 1].map((tick) => (
                            <path
                                key={tick}
                                d={`M${LEFT} ${py(tick)} H${LEFT + PLOT_W}`}
                                stroke={k.line}
                                strokeWidth={1}
                            />
                        ))}
                        <path
                            d={`M${LEFT} ${TOP} V${TOP + PLOT_H} H${LEFT + PLOT_W}`}
                            stroke={k.mid}
                            strokeWidth={1.25}
                            fill="none"
                        />
                        {[300, 1000, 3000, 10000, 20000].map((tick) => (
                            <path
                                key={tick}
                                d={`M${px(tick)} ${TOP + PLOT_H} v5`}
                                stroke={k.mid}
                                strokeWidth={1.25}
                            />
                        ))}
                        <path d={line(IVF)} stroke={k.data} strokeWidth={2.25} fill="none" />
                        <path d={line(HNSW)} stroke={k.model} strokeWidth={2.25} fill="none" />
                        {IVF.map(([knob, x, y]) => (
                            <circle key={knob} cx={px(x)} cy={py(y)} r={4.5} fill={k.data} />
                        ))}
                        {HNSW.map(([knob, x, y]) => (
                            <circle key={knob} cx={px(x)} cy={py(y)} r={4.5} fill={k.model} />
                        ))}
                        <circle cx={px(EXACT[0])} cy={py(EXACT[1])} r={6} fill={k.go} />
                    </>,
                )}
                {[0.2, 0.4, 0.6, 0.8, 1].map((tick) =>
                    at(
                        0,
                        py(tick) - 12,
                        label(k, tick.toFixed(1), {
                            size: S,
                            color: k.mid,
                            width: 50,
                            align: 'right',
                        }),
                    ),
                )}
                {[300, 1000, 3000, 10000].map((tick) =>
                    at(
                        px(tick) - 40,
                        TOP + PLOT_H + 8,
                        label(k, tick.toLocaleString('en-US'), {
                            size: S,
                            color: k.mid,
                            width: 80,
                            align: 'center',
                        }),
                    ),
                )}
                {at(
                    px(20000) - 40,
                    TOP + PLOT_H + 8,
                    label(k, '20,000', { size: S, color: k.mid, width: 80, align: 'center' }),
                )}
                {at(
                    LEFT,
                    TOP + PLOT_H + 34,
                    label(k, 'Vectors scored per query, log scale', {
                        size: S,
                        color: k.mid,
                        width: 360,
                    }),
                )}
                {at(0, 0, label(k, 'Recall at 10', { size: S, color: k.mid, width: 140 }))}
                {lab('HNSW', px(323) - 22, py(0.653) + 10, k.model, 60, 600)}
                {lab('ef = 10', px(323) - 22, py(0.653) + 34, k.model, 70)}
                {lab('ef = 40', px(618) - 74, py(0.914) - 28, k.model, 70)}
                {lab('ef = 320', px(2923) - 40, py(0.981) - 28, k.model, 80)}
                {lab('IVF', px(724) + 14, py(0.5), k.data, 40, 600)}
                {lab('probes = 1', px(561) + 14, py(0.246) - 10, k.data, 110)}
                {lab('probes = 8', px(873) + 14, py(0.88) + 2, k.data, 110)}
                {lab('probes = 64', px(3039) + 12, py(0.978) + 6, k.data, 110)}
                {lab('exact search', px(EXACT[0]) - 92, py(1) - 32, k.go, 120, 600)}
            </>,
        ),
        0,
    )
}
export default create('dark')
