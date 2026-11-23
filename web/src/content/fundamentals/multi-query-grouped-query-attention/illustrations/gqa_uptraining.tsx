import React from 'react'
import {
    BarChart,
    Column,
    Flow,
    GraphDiagram,
    Panel,
    Row,
    Scene,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

const DENSITY = 2.5

export const width = 860
export const height = 780
export const alt =
    'GQA uptraining pipeline: train MHA, mean-pool key and value heads per group, uptrain queries for 5% of pretraining budget, and evaluate GQA quality, alongside an opposing-key mean-pool output shift chart.'

function makeGqaUptraining(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)

    const pipeline = Flow({
        c,
        direction: 'horizontal',
        gap: 6,
        connectorLength: 14,
        stages: [
            { title: '1. MHA', lines: ['64 KV'], tone: 'blue', width: 174, padding: 8 },
            { title: '2. Pool', lines: ['8x8 group'], tone: 'warm', width: 174, padding: 8 },
            { title: '3. Tune', lines: ['5% steps'], tone: 'purple', width: 174, padding: 8 },
            { title: '4. GQA', lines: ['Parity'], tone: 'green', width: 174, padding: 8 },
        ],
    })

    const poolGraph = Panel({
        c,
        title: 'Mean-Pool Step',
        subtitle: 'Group vector average',
        tone: 'blue',
        titleFontSize: 29,
        padding: 12,
        gap: 8,
        width: 396,
        children: GraphDiagram({
            c,
            width: 372,
            height: 270,
            direction: 'TB',
            nodeWidth: 132,
            labelFontSize: 26,
            detailFontSize: 25,
            arrowSize: 6,
            nodeGap: 16,
            rankGap: 36,
            padding: 8,
            nodes: [
                { id: 'k0', label: 'H0 K', detail: '[1, 3]', tone: 'blue' },
                { id: 'k1', label: 'H1 K', detail: '[3, 5]', tone: 'cyan' },
                { id: 'km', label: 'Mean KV', detail: '[2, 4]', tone: 'green' },
            ],
            edges: [
                { from: 'k0', to: 'km', tone: 'blue' },
                { from: 'k1', to: 'km', tone: 'cyan' },
            ],
        }),
    })

    const shiftChart = Panel({
        c,
        title: 'Opposing-Key Output',
        subtitle: 'Coord 0 before uptraining',
        tone: 'warm',
        titleFontSize: 29,
        padding: 12,
        gap: 8,
        width: 388,
        children: BarChart({
            c,
            width: 364,
            height: 270,
            min: 0,
            max: 9,
            format: 'decimal',
            yAxisLabel: 'Out[0]',
            data: [
                { label: 'Exact MHA', value: 8.81, color: 'secondary', valueLabel: '8.81' },
                { label: 'Mean-pooled', value: 5.0, color: 'warning', valueLabel: '5.00' },
            ],
        }),
    })

    return Scene({
        c,
        density: DENSITY,
        padding: 14,
        gap: 12,
        contentWidth: 800,
        children: Column({
            gap: 12,
            children: [
                pipeline,
                Row({ gap: 16, align: 'stretch', children: [poolGraph, shiftChart] }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeGqaUptraining(theme)
}

export default create('dark')
