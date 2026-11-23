import React from 'react'
import {
    Column,
    Flow,
    GraphDiagram,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 780
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A GPU health state machine and recovery architecture routes faults by blast radius. Healthy GPUs tolerate single-bit ECC alerts while monitoring temperature. Contained Xid 94 errors drain active requests and restart the affected worker process. Uncontained Xid 95, uncorrectable ECC, or NVLink faults cordon the GPU, save checkpoints before evicting pods, reset the GPU, and pass DCGM Level 3 burn-in before returning to service.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)

    return Scene({
        c: base,
        padding: 14,
        gap: 8,
        contentWidth: 672,
        children: Column({
            gap: 8,
            width: 672,
            children: [
                TextLabel({
                    c,
                    text: 'GPU health states drive drain and checkpoint recovery',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Separate Xid 94 process faults from Xid 95, ECC, and NVLink resets',
                    fontSize: 21,
                    color: base.textSecondary,
                }),
                GraphDiagram({
                    c: base,
                    width: 672,
                    height: 330,
                    nodeWidth: 270,
                    nodeHeight: 90,
                    labelFontSize: 23,
                    detailFontSize: 21,
                    padding: 8,
                    arrowSize: 6,
                    nodes: [
                        {
                            id: 'healthy',
                            label: 'Healthy serving',
                            detail: 'Monitors Xid, ECC, link',
                            x: 0.02,
                            y: 0.04,
                            tone: 'green',
                        },
                        {
                            id: 'xid94',
                            label: 'Xid 94 contained',
                            detail: 'Drain inflight, restart pod',
                            x: 0.98,
                            y: 0.04,
                            tone: 'warm',
                        },
                        {
                            id: 'xid95',
                            label: 'Xid 95 / ECC / NVLink',
                            detail: 'Cordon GPU, save checkpoint',
                            x: 0.02,
                            y: 0.96,
                            tone: 'red',
                        },
                        {
                            id: 'reset',
                            label: 'GPU reset + DCGM',
                            detail: 'L2/L3 fabric & HBM check',
                            x: 0.98,
                            y: 0.96,
                            tone: 'blue',
                        },
                    ],
                    edges: [
                        { from: 'healthy', to: 'xid94', tone: 'warm' },
                        { from: 'xid94', to: 'healthy', tone: 'green', style: 'dashed' },
                        { from: 'healthy', to: 'xid95', tone: 'red', emphasis: true },
                        { from: 'xid95', to: 'reset', tone: 'red' },
                        { from: 'reset', to: 'healthy', tone: 'green' },
                    ],
                    ariaLabel: alt,
                }),
                Flow({
                    c,
                    direction: 'horizontal',
                    gap: 4,
                    connectorLength: 8,
                    stages: [
                        { title: 'Cordon', subtitle: 'Hold GPU', tone: 'warm', width: 152 },
                        { title: 'Save ckpt', subtitle: 'Flush KV', tone: 'blue', width: 152 },
                        { title: 'Reset GPU', subtitle: 'DCGM L3', tone: 'purple', width: 152 },
                        { title: 'Burn-in', subtitle: 'Canary OK', tone: 'green', width: 152 },
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
