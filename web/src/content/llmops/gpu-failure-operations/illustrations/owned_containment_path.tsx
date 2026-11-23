import React from 'react'
import {
    Column,
    GraphDiagram,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 700
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A scoped containment graph starts by removing the failing replica from serving traffic and collecting bounded telemetry. From there, recovery branches strictly by broken layer: safe retries or worker process restarts belong to the workload owner, GPU quarantine and reset belong to the platform owner, and node cordon or drain require cluster approval before burn-in verification.'

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
                    text: 'Containment acts at the smallest broken scope',
                    fontSize: 30,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Stop traffic and capture logs before touching shared nodes',
                    fontSize: 22,
                    color: base.textSecondary,
                }),
                GraphDiagram({
                    c: base,
                    width: 668,
                    height: 520,
                    nodeWidth: 204,
                    nodeHeight: 98,
                    labelFontSize: 23,
                    detailFontSize: 21,
                    padding: 8,
                    arrowSize: 6,
                    nodes: [
                        {
                            id: 'isolate',
                            label: 'Stop traffic',
                            detail: 'Save telemetry',
                            x: 0.5,
                            y: 0.03,
                            tone: 'red',
                        },
                        {
                            id: 'worker',
                            label: 'Worker scope',
                            detail: 'Retry or restart',
                            x: 0.02,
                            y: 0.5,
                            tone: 'blue',
                        },
                        {
                            id: 'gpu',
                            label: 'GPU scope',
                            detail: 'Quarantine GPU',
                            x: 0.5,
                            y: 0.5,
                            tone: 'warm',
                        },
                        {
                            id: 'node',
                            label: 'Node scope',
                            detail: 'Cordon vs drain',
                            x: 0.98,
                            y: 0.5,
                            tone: 'purple',
                        },
                        {
                            id: 'verify',
                            label: 'Canary soak',
                            detail: 'Restore traffic',
                            x: 0.5,
                            y: 0.97,
                            tone: 'green',
                        },
                    ],
                    edges: [
                        { from: 'isolate', to: 'worker', tone: 'blue' },
                        { from: 'isolate', to: 'gpu', tone: 'warm' },
                        { from: 'isolate', to: 'node', tone: 'purple', style: 'dashed' },
                        { from: 'worker', to: 'verify', tone: 'green' },
                        { from: 'gpu', to: 'verify', tone: 'green' },
                        { from: 'node', to: 'verify', tone: 'green' },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
