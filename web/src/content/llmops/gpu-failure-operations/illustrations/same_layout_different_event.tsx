import React from 'react'
import {
    Column,
    Matrix,
    Scene,
    StackedBar,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 724
export const height = 660
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Holding the 40.00 GiB memory layout constant at 30.10 allocated, 36.70 reserved, 6.10 inactive splits with 0.88 largest block, and 2.68 outside PyTorch yields four distinct diagnoses depending on event telemetry: native OOM with a 1.50 GiB request points to fragmentation; captured success stays no-OOM; OOM without request size stays unresolved; and cudaMallocAsync withholds native split inference.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('red', c)
    const green = getReadableToneColor('green', c)

    return Scene({
        c: base,
        padding: 16,
        gap: 10,
        contentWidth: 692,
        children: Column({
            gap: 10,
            width: 692,
            children: [
                TextLabel({
                    c,
                    text: 'Same memory ledger diverges by event and backend',
                    fontSize: 28,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 692,
                    height: 30,
                    title: '30.10 GiB alloc · 36.70 reserve · 6.10 splits (max 0.88)',
                    showLegend: true,
                    segments: [
                        { label: 'Alloc 30.1', value: 30.1, color: blue },
                        { label: 'Splits 6.1', value: 6.1, color: warm },
                        { label: 'Outside 3.18', value: 3.18, color: red },
                        { label: 'Free 0.62', value: 0.62, color: green },
                    ],
                }),
                Matrix({
                    c,
                    colorScale: 'heat',
                    colorDomain: [0, 2],
                    cellWidth: 160,
                    cellHeight: 54,
                    rowLabelWidth: 194,
                    fontSize: 22,
                    rowLabels: [
                        'OOM + 1.5 GiB',
                        'Success (stale)',
                        'OOM + null',
                        'cudaMallocAsync',
                    ],
                    colLabels: ['Status', 'Req GiB', 'Diagnosis'],
                    data: [
                        [2, 2, 2],
                        [0, 1, 0],
                        [2, 0, 1],
                        [2, 2, 1],
                    ],
                    labels: [
                        ['OOM', '1.50', 'Split OOM'],
                        ['success', 'stale', 'No failure'],
                        ['OOM', 'None / 0', 'Unresolved'],
                        ['OOM', '1.50', 'Skip async'],
                    ],
                    highlightRow: 0,
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
