import React from 'react'
import {
    BarChart,
    Column,
    Heatmap,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Side-by-side InfoNCE batch matrix and temperature-scaled softmax probabilities. Left: a 4-by-4 cosine similarity heatmap with bright positive pairs along the diagonal (q1-p1 0.90, q2-p2 0.85, q3-p3 0.88, q4-p4 0.82) and cooler off-diagonal in-batch negatives (row q1: 0.90, 0.20, 0.12, 0.08). Right: paired softmax probability bar charts for row q1 showing that low temperature tau=0.05 concentrates probability on p1 (1.00, 0.00, 0.00, 0.00), while high temperature tau=0.50 flattens mass across negatives (0.61, 0.15, 0.13, 0.12).'

export const width = 780
export const height = 470

const simMatrix = [
    [0.9, 0.2, 0.12, 0.08],
    [0.15, 0.85, 0.18, 0.11],
    [0.1, 0.14, 0.88, 0.19],
    [0.09, 0.12, 0.16, 0.82],
]

function softmax(scores: number[], tau: number) {
    const scaled = scores.map((s) => s / tau)
    const maxVal = Math.max(...scaled)
    const exps = scaled.map((v) => Math.exp(v - maxVal))
    const sum = exps.reduce((a, b) => a + b, 0)
    return exps.map((e) => e / sum)
}

const rowQ1 = simMatrix[0]
const probLowTau = softmax(rowQ1, 0.05)
const probHighTau = softmax(rowQ1, 0.5)
const passageLabels = ['p₁', 'p₂', 'p₃', 'p₄']

const illustration = defineIllustration((c: ThemeColors) => {
    const greenInk = getReadableToneColor('green', c)
    const blueInk = getReadableToneColor('blue', c)
    const purpleInk = getReadableToneColor('purple', c)

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: 748,
        align: 'center',
        background: 'transparent',
        children: Row({
            width: 748,
            gap: 14,
            align: 'stretch',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    title: 'Batch cosine matrix S = Q Pᵀ',
                    subtitle: 'Diagonal entries are positive pairs',
                    tone: 'green',
                    width: 376,
                    padding: 12,
                    gap: 10,
                    align: 'center',
                    titleFontSize: 16,
                    children: [
                        Heatmap({
                            c,
                            data: simMatrix,
                            xLabels: ['p₁', 'p₂', 'p₃', 'p₄'],
                            yLabels: ['q₁', 'q₂', 'q₃', 'q₄'],
                            cellSize: 66,
                            rowLabelWidth: 42,
                            fontSize: 16,
                            colorScale: 'heat',
                            colorDomain: [0, 1],
                            highlightRow: 0,
                            highlightColor: greenInk,
                        }),
                        TextLabel({
                            c,
                            text: 'Row q₁: [0.90, 0.20, 0.12, 0.08]',
                            width: 344,
                            fontSize: 14,
                            fontWeight: 750,
                            align: 'center',
                            color: greenInk,
                            mono: true,
                        }),
                    ],
                }),
                Column({
                    width: 358,
                    gap: 10,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Row q₁ softmax at τ = 0.05 (sharp)',
                            tone: 'purple',
                            width: 358,
                            padding: 10,
                            gap: 4,
                            titleFontSize: 15,
                            children: BarChart({
                                c,
                                width: 334,
                                height: 154,
                                min: 0,
                                max: 1.0,
                                showGrid: true,
                                showValues: true,
                                format: (v) => v.toFixed(2),
                                data: probLowTau.map((prob, idx) => ({
                                    label: passageLabels[idx],
                                    value: prob,
                                    color: idx === 0 ? 'positive' : 'secondary',
                                })),
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Row q₁ softmax at τ = 0.50 (flat)',
                            tone: 'blue',
                            width: 358,
                            padding: 10,
                            gap: 4,
                            titleFontSize: 15,
                            children: BarChart({
                                c,
                                width: 334,
                                height: 154,
                                min: 0,
                                max: 1.0,
                                showGrid: true,
                                showValues: true,
                                format: (v) => v.toFixed(2),
                                data: probHighTau.map((prob, idx) => ({
                                    label: passageLabels[idx],
                                    value: prob,
                                    color: idx === 0 ? 'positive' : 'secondary',
                                })),
                            }),
                        }),
                        Row({
                            width: 358,
                            gap: 10,
                            justify: 'space-between',
                            style: {
                                backgroundColor: c.bgCard,
                                border: `1px solid ${c.borderSubtle}`,
                                borderRadius: 10,
                                padding: '6px 10px',
                            },
                            children: [
                                TextLabel({
                                    c,
                                    text: 'τ=0.05: L₁ ≈ 1.1e-6',
                                    width: 164,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: purpleInk,
                                    align: 'center',
                                    mono: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 'τ=0.50: L₁ = 0.50',
                                    width: 164,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: blueInk,
                                    align: 'center',
                                    mono: true,
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
