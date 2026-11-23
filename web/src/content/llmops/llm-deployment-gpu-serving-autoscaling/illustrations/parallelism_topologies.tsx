import React from 'react'
import {
    BarChart,
    Column,
    GraphDiagram,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 580
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Tensor parallelism versus pipeline parallelism across 4 GPUs on an 80-layer model over 32 decode steps: tensor parallelism splits every layer inside an NVLink node with 2 all-reduce syncs per layer (5,120 sync events), while pipeline parallelism splits layers into sequential stage handoffs across nodes (96 boundary transfers) at the cost of pipeline bubbles.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)

    return Scene({
        c: base,
        padding: 16,
        gap: 10,
        contentWidth: 668,
        children: Column({
            gap: 10,
            width: 668,
            children: [
                TextLabel({
                    c,
                    text: 'TP syncs inside every layer; PP hands off across stage groups',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                GraphDiagram({
                    c: base,
                    width: 668,
                    height: 245,
                    nodeWidth: 274,
                    nodeHeight: 84,
                    labelFontSize: 23,
                    detailFontSize: 21,
                    padding: 8,
                    arrowSize: 6,
                    nodes: [
                        {
                            id: 'tp',
                            label: 'Tensor Parallel TP=4',
                            detail: '2 syncs/layer (NVLink)',
                            x: 0.02,
                            y: 0.1,
                            tone: 'blue',
                        },
                        {
                            id: 'tpout',
                            label: 'Low latency intra-node',
                            detail: 'Needs high-BW fabric',
                            x: 0.98,
                            y: 0.1,
                            tone: 'blue',
                        },
                        {
                            id: 'pp',
                            label: 'Pipeline Parallel PP=4',
                            detail: '20L/stage, 3 handoffs',
                            x: 0.02,
                            y: 0.9,
                            tone: 'green',
                        },
                        {
                            id: 'ppout',
                            label: 'Cross-node friendly',
                            detail: 'Pipeline bubble risk',
                            x: 0.98,
                            y: 0.9,
                            tone: 'green',
                        },
                    ],
                    edges: [
                        { from: 'tp', to: 'tpout', tone: 'blue' },
                        { from: 'pp', to: 'ppout', tone: 'green', style: 'dashed' },
                    ],
                    ariaLabel: alt,
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 185,
                    format: 'integer',
                    yAxisLabel: 'Syncs (32 steps)',
                    max: 5600,
                    data: [
                        { label: 'TP (80L x 2 x 32 steps)', value: 5120, color: blue },
                        { label: 'PP (3 x 32 steps)', value: 96, color: green },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
