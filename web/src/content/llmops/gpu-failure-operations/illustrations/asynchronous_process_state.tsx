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
export const height = 660
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A directed workflow distinguishes the CUDA last-error register from process integrity. An asynchronously queued kernel raises cudaErrorIllegalAddress observed at a later synchronization. Calling cudaGetLastError clears the error register so a second call returns cudaSuccess, and an HTTP probe may still pass, yet the process remains poisoned and must capture logs, terminate, relaunch, and pass recovery checks.'

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
                    text: 'Async kernel faults outlive last-error clears',
                    fontSize: 30,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'cudaErrorIllegalAddress poisons the CUDA context past probes',
                    fontSize: 22,
                    color: base.textSecondary,
                }),
                GraphDiagram({
                    c: base,
                    width: 668,
                    height: 490,
                    nodeWidth: 270,
                    nodeHeight: 96,
                    labelFontSize: 24,
                    detailFontSize: 21,
                    padding: 8,
                    arrowSize: 6,
                    nodes: [
                        {
                            id: 'enqueue',
                            label: 'Async enqueue',
                            detail: 'Host continues',
                            x: 0.02,
                            y: 0.04,
                            tone: 'blue',
                        },
                        {
                            id: 'fault',
                            label: 'Illegal address',
                            detail: 'Surfaces at sync',
                            x: 0.98,
                            y: 0.04,
                            tone: 'red',
                        },
                        {
                            id: 'clear',
                            label: 'cudaGetLastError()',
                            detail: '2nd read: cudaSuccess',
                            x: 0.02,
                            y: 0.5,
                            tone: 'warm',
                        },
                        {
                            id: 'http',
                            label: 'HTTP health check',
                            detail: '200 OK still passes',
                            x: 0.98,
                            y: 0.5,
                            tone: 'neutral',
                        },
                        {
                            id: 'kill',
                            label: 'Capture, kill, relaunch',
                            detail: 'Mandatory process recovery',
                            x: 0.5,
                            y: 0.96,
                            tone: 'green',
                        },
                    ],
                    edges: [
                        { from: 'enqueue', to: 'fault', tone: 'blue', emphasis: true },
                        { from: 'fault', to: 'clear', tone: 'warm' },
                        { from: 'fault', to: 'http', tone: 'neutral', style: 'dashed' },
                        { from: 'clear', to: 'kill', tone: 'red', emphasis: true },
                        { from: 'http', to: 'kill', tone: 'red', style: 'dashed' },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
