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
export const height = 640
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A fan-out fault analyzer evaluates primary failure scope and process safety independently. When Xid 31 and illegal_address occur together, Xid 31 selects hardware catalog investigation while illegal_address forces must_relaunch true so the poisoned process terminates rather than hiding behind the hardware label. Missing NVML telemetry reports unknown outside memory rather than zero.'

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
                    text: 'Hardware cause and process safety stay independent',
                    fontSize: 28,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Xid 31 selects device triage while illegal_address enforces relaunch',
                    fontSize: 22,
                    color: base.textSecondary,
                }),
                GraphDiagram({
                    c: base,
                    width: 668,
                    height: 460,
                    nodeWidth: 270,
                    nodeHeight: 96,
                    labelFontSize: 23,
                    detailFontSize: 21,
                    padding: 8,
                    arrowSize: 6,
                    nodes: [
                        {
                            id: 'event',
                            label: 'Snapshot r-7818',
                            detail: 'Xid 31 + illegal_address',
                            x: 0.5,
                            y: 0.04,
                            tone: 'purple',
                        },
                        {
                            id: 'cause',
                            label: 'Hypothesis: xid-event',
                            detail: 'Catalog device check',
                            x: 0.02,
                            y: 0.52,
                            tone: 'blue',
                        },
                        {
                            id: 'relaunch',
                            label: 'must_relaunch: True',
                            detail: 'Kill & relaunch worker',
                            x: 0.98,
                            y: 0.52,
                            tone: 'red',
                        },
                        {
                            id: 'nvml',
                            label: 'Missing NVML (r-7819)',
                            detail: 'Outside = N/A, not 0',
                            x: 0.5,
                            y: 0.96,
                            tone: 'warm',
                        },
                    ],
                    edges: [
                        { from: 'event', to: 'cause', tone: 'blue' },
                        { from: 'event', to: 'relaunch', tone: 'red', emphasis: true },
                        { from: 'cause', to: 'nvml', tone: 'warm', style: 'dashed' },
                        { from: 'relaunch', to: 'nvml', tone: 'warm', style: 'dashed' },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
