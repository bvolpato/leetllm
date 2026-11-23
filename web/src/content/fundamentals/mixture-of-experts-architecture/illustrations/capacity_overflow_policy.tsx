import React from 'react'
import {
    Column,
    DataTable,
    Panel,
    Scene,
    StackedBar,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 740
export const alt =
    'For 4096 tokens with top-2 routing across 32 experts (mean 256 per expert), a hot expert receives 400 assignments. Capacity factor 1.0 fits 256 slots and leaves 144 overflow; factor 1.2 raises capacity to 308 slots and cuts overflow to 92. Overflow options are dropping excess assignments, rerouting to spare experts, or dropless variable execution.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    const blue = getReadableToneColor('blue', c)
    const warn = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Hot expert buffer: 400 assigned vs ⌈4096×2/32 × c⌉',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    gap: 6,
                    children: [
                        StackedBar({
                            c: cd,
                            width: 544,
                            height: 68,
                            title: 'c = 1.0 -> 256 slots (144 excess)',
                            showLegend: true,
                            segments: [
                                {
                                    label: 'Fit',
                                    value: 256,
                                    color: blue,
                                    valueLabel: '256 slots',
                                },
                                {
                                    label: 'Overflow',
                                    value: 144,
                                    color: warn,
                                    valueLabel: '144 excess',
                                },
                            ],
                        }),
                        StackedBar({
                            c: cd,
                            width: 544,
                            height: 68,
                            title: 'c = 1.2 -> 308 slots (92 excess)',
                            showLegend: true,
                            segments: [
                                {
                                    label: 'Fit',
                                    value: 308,
                                    color: green,
                                    valueLabel: '308 slots',
                                },
                                {
                                    label: 'Overflow',
                                    value: 92,
                                    color: warn,
                                    valueLabel: '92 excess',
                                },
                            ],
                        }),
                    ],
                }),
                Panel({
                    c: cd,
                    title: 'Three overflow policies at fixed c = 1.0',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    gap: 6,
                    children: [
                        DataTable({
                            c: cd,
                            width: 544,
                            headerRows: 1,
                            headerCols: 1,
                            cellHeight: 32,
                            gap: 4,
                            fontSize: 18,
                            rows: [
                                ['Policy', '144 Excess Fate', 'System Effect'],
                                ['Drop', 'skip excess call', 'residual kept'],
                                ['Reroute', 'send to free slot', 'alt weights'],
                                ['Dropless', 'run all 400', 'extra FLOPs'],
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Drop skips an expert call; the residual path preserves the token.',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
