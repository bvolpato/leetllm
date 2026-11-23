import React from 'react'
import {
    Column,
    Flow,
    Scene,
    ScatterPlot,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 720
export const height = 710
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Disaggregated prefill-decode serving pipeline and workload SLO evaluation: requests route to a prefill pool that ships KV blocks and layout metadata to a decode pool. In a dual-SLO scatter plot (TTFT target <= 1500 ms, TPOT target <= 60 ms), short incident chat (820 ms TTFT, 44 ms TPOT) satisfies both targets in a mixed pool, whereas decode pressure (800 ms, 90 ms) and policy-document surges (2450 ms, 93 ms) justify testing separate pools.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('red', c)

    return Scene({
        c: base,
        padding: 16,
        gap: 10,
        contentWidth: 688,
        children: Column({
            gap: 10,
            width: 688,
            children: [
                TextLabel({
                    c,
                    text: 'Split prefill and decode only when mixed pools miss TTFT or TPOT',
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
                        { title: 'Router', subtitle: 'Prefix-aware', tone: 'blue', width: 154 },
                        { title: 'Prefill', subtitle: 'Compute pool', tone: 'purple', width: 154 },
                        { title: 'KV Xfer', subtitle: 'Shape + dtype', tone: 'warm', width: 154 },
                        { title: 'Decode', subtitle: 'BW stream', tone: 'green', width: 154 },
                    ],
                }),
                ScatterPlot({
                    c,
                    width: 688,
                    height: 320,
                    xMin: 0,
                    xMax: 2800,
                    yMin: 0,
                    yMax: 120,
                    xAxisLabel: 'p95 TTFT (ms), SLO <= 1500 ms',
                    yAxisLabel: 'p95 TPOT (ms)',
                    title: 'SLO pass/fail across 3 traces (TPOT SLO <= 60 ms)',
                    points: [
                        { x: 820, y: 44, label: 'Chat 8% (PASS)', color: green, size: 12 },
                        { x: 800, y: 90, label: 'Decode (MISS)', color: warm, size: 12 },
                        { x: 2450, y: 93, label: 'Doc 61% (MISS)', color: red, size: 12 },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
