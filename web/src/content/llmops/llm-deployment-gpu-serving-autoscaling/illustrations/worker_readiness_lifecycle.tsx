import React from 'react'
import {
    Column,
    Flow,
    Matrix,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 580
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Inference worker readiness and drain lifecycle: a pod progresses from loading weights and warmup to ready serving, returns HTTP 409 for duplicate IDs and HTTP 429 when capacity is full without failing liveness, and returns HTTP 503 during drain while active streams finish.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)

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
                    text: 'Separate startup, full capacity, drain, and fault states',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                Flow({
                    c,
                    direction: 'horizontal',
                    gap: 4,
                    connectorLength: 8,
                    stages: [
                        { title: 'Load', subtitle: 'Weights 503', tone: 'blue', width: 150 },
                        { title: 'Warmup', subtitle: 'Compile 503', tone: 'purple', width: 150 },
                        { title: 'Ready', subtitle: 'Accept 200', tone: 'green', width: 150 },
                        { title: 'Drain', subtitle: '503, finish', tone: 'warm', width: 150 },
                    ],
                }),
                Matrix({
                    c,
                    colorScale: 'heat',
                    colorDomain: [0, 2],
                    cellWidth: 162,
                    cellHeight: 54,
                    rowLabelWidth: 170,
                    fontSize: 22,
                    rowLabels: ['Slot open', 'Duplicate ID', 'At batch limit', 'Draining / fault'],
                    colLabels: ['HTTP', 'Active work', 'Liveness'],
                    data: [
                        [0, 0, 0],
                        [1, 0, 0],
                        [1, 0, 0],
                        [2, 0, 2],
                    ],
                    labels: [
                        ['200 OK', 'Starts stream', 'Healthy'],
                        ['409 Conflict', 'Keep owner', 'Healthy'],
                        ['429 Shed', 'Keep active', 'Healthy'],
                        ['503 Hold', 'Drain a, b', 'Hold / exit'],
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
