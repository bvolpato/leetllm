import React from 'react'
import {
    BadgePill,
    BarChart,
    Column,
    Flow,
    Panel,
    Row,
    Scene,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

const DENSITY = 2.0

export const width = 640
export const height = 720
export const alt =
    'Comparison of per-token KV cache elements across GQA-8 (2,048), GQA-4 (1,024), MLA (576), and MQA (256), alongside naive expansion versus matrix-absorbed MLA decode paths reaching 398.0423.'

function makeMlaVsGqa(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)

    const absorptionPanel = Panel({
        c,
        title: 'MLA Matrix Absorption (Score = 398.0423)',
        tone: 'blue',
        titleFontSize: 24,
        padding: 10,
        gap: 6,
        width: 600,
        children: Column({
            gap: 6,
            align: 'center',
            children: [
                Flow({
                    c,
                    direction: 'horizontal',
                    gap: 8,
                    connectorLength: 16,
                    stages: [
                        { title: 'Latent c [512]', tone: 'green', width: 164, padding: 6 },
                        { title: 'W_uk · c (expand)', tone: 'warm', width: 170, padding: 6 },
                        { title: 'q · K = 398.04', tone: 'blue', width: 164, padding: 6 },
                    ],
                }),
                Flow({
                    c,
                    direction: 'horizontal',
                    gap: 8,
                    connectorLength: 16,
                    stages: [
                        { title: 'Query q [128]', tone: 'blue', width: 164, padding: 6 },
                        { title: 'W_uk^T q (absorb)', tone: 'purple', width: 170, padding: 6 },
                        { title: 'q_abs · c = 398.04', tone: 'green', width: 164, padding: 6 },
                    ],
                }),
                BadgePill({
                    c,
                    tone: 'green',
                    text: 'Cached per token: 512 latent + 64 RoPE = 576 floats',
                    fontSize: 20,
                }),
            ],
        }),
    })

    const barChart = Panel({
        c,
        title: 'Per-token KV floats stored in cache',
        titleFontSize: 23,
        padding: 10,
        gap: 6,
        width: 600,
        children: BarChart({
            c,
            width: 572,
            height: 160,
            min: 0,
            max: 2700,
            format: 'integer',
            yAxisLabel: 'Floats',
            data: [
                { label: 'GQA-8', value: 2048, color: 'critical', valueLabel: '2,048' },
                { label: 'GQA-4', value: 1024, color: 'secondary', valueLabel: '1,024' },
                { label: 'MLA', value: 576, color: 'positive', valueLabel: '576' },
                { label: 'MQA', value: 256, color: 'violet', valueLabel: '256' },
            ],
        }),
    })

    return Scene({
        c,
        density: DENSITY,
        padding: 10,
        gap: 8,
        contentWidth: 600,
        children: Column({ gap: 8, children: [absorptionPanel, barChart] }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeMlaVsGqa(theme)
}

export default create('dark')
