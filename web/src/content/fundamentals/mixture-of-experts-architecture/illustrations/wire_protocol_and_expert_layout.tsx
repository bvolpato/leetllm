import React from 'react'
import {
    BarChart,
    Column,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 680
export const alt =
    'Top: token t0 selects E2 and E3 on remote GPU 1; separate per-assignment transfers move four 8 KiB messages (32 KiB), whereas per-destination coalescing moves one 8 KiB input and one 8 KiB weighted sum (16 KiB) with identical FLOPs. Bottom: tensor parallelism splits one expert across four GPUs while expert parallelism assigns whole experts to owning GPU groups.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Same remote routes (t0 -> E2, E3 on GPU 1), half the bytes',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    gap: 8,
                    children: [
                        BarChart({
                            c: cd,
                            width: 540,
                            height: 176,
                            min: 0,
                            max: 38,
                            format: 'integer',
                            yAxisLabel: 'KiB',
                            showGrid: true,
                            showValues: true,
                            data: [
                                {
                                    label: 'Per assignment (4×8)',
                                    value: 32,
                                    color: warm,
                                    valueLabel: '32 KiB',
                                },
                                {
                                    label: 'Per destination (2×8)',
                                    value: 16,
                                    color: green,
                                    valueLabel: '16 KiB',
                                },
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Coalesced dispatch + remote weighted sum keeps expert FLOPs identical.',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c: cd,
                    title: 'Tensor sharding (TP) vs expert ownership (EP)',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    gap: 8,
                    children: [
                        Row({
                            gap: 14,
                            align: 'start',
                            children: [
                                Panel({
                                    c: cd,
                                    title: 'TP: shard 1 expert W',
                                    titleFontSize: 19,
                                    width: 266,
                                    padding: 10,
                                    children: Grid({
                                        c: cd,
                                        rows: [
                                            [
                                                { label: 'W0', tone: 'blue' },
                                                { label: 'W1', tone: 'blue' },
                                                { label: 'W2', tone: 'blue' },
                                                { label: 'W3', tone: 'blue' },
                                            ],
                                        ],
                                        cellWidth: 54,
                                        cellHeight: 42,
                                        gap: 6,
                                        fontSize: 18,
                                    }),
                                }),
                                Panel({
                                    c: cd,
                                    title: 'EP: whole experts / GPU',
                                    titleFontSize: 19,
                                    width: 266,
                                    padding: 10,
                                    children: Grid({
                                        c: cd,
                                        rows: [
                                            [
                                                { label: 'G0: E0', tone: 'purple' },
                                                { label: 'G0: E1', tone: 'purple' },
                                            ],
                                            [
                                                { label: 'G1: E2', tone: 'green' },
                                                { label: 'G1: E3', tone: 'green' },
                                            ],
                                        ],
                                        cellWidth: 112,
                                        cellHeight: 38,
                                        gap: 6,
                                        fontSize: 18,
                                    }),
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Payload bytes alone do not measure network or kernel latency.',
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
