import React from 'react'
import {
    BadgePill,
    BarChart,
    Column,
    Panel,
    Row,
    Scene,
    TiledMatrix,
    getThemeColors,
    withDensity,
    type ThemeMode,
    type ToneName,
} from 'vizmatic'

const DENSITY = 2.5

export const width = 860
export const height = 740
export const alt =
    'Tensor-parallel KV head sharding for Hkv=8: TP=4 stores two unique KV heads per GPU (8 physical total), whereas TP=16 replicates KV heads twice across GPUs (16 physical total).'

function makeShardReplication(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)
    const uniqueTones: ToneName[] = ['blue', 'purple', 'cyan', 'green']

    const tp4Panel = Panel({
        c,
        title: 'TP = 4 · 1x KV Copy',
        subtitle: '2 KV / GPU · 8 physical total',
        tone: 'green',
        titleFontSize: 29,
        padding: 12,
        gap: 10,
        width: 392,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TiledMatrix({
                    c,
                    rows: 2,
                    cols: 4,
                    cellSize: 34,
                    gap: 5,
                    ariaLabel: 'TP equals 4 unique KV heads across 4 GPUs',
                    regions: uniqueTones.map((t, col) => ({
                        rowStart: 0,
                        rowEnd: 2,
                        colStart: col,
                        colEnd: col + 1,
                        tone: t,
                    })),
                }),
                BadgePill({ c, tone: 'green', text: '8 physical KV shards', fontSize: 26 }),
            ],
        }),
    })

    const tp16Panel = Panel({
        c,
        title: 'TP = 16 · 2x KV Replica',
        subtitle: '4Q + 1KV / GPU · 16 shards',
        tone: 'warm',
        titleFontSize: 29,
        padding: 12,
        gap: 10,
        width: 392,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TiledMatrix({
                    c,
                    rows: 2,
                    cols: 8,
                    cellSize: 30,
                    gap: 4,
                    ariaLabel: 'TP equals 16 replicated KV heads across 16 GPUs',
                    regions: [
                        { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 8, tone: 'blue' },
                        { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 8, tone: 'warm' },
                    ],
                }),
                BadgePill({ c, tone: 'warm', text: '16 physical KV shards', fontSize: 26 }),
            ],
        }),
    })

    return Scene({
        c,
        density: DENSITY,
        padding: 14,
        gap: 12,
        contentWidth: 800,
        children: Column({
            gap: 12,
            children: [
                Row({
                    gap: 16,
                    align: 'stretch',
                    children: [tp4Panel, tp16Panel],
                }),
                Panel({
                    c,
                    title: 'Physical KV heads resident across GPUs',
                    titleFontSize: 27,
                    padding: 12,
                    gap: 8,
                    width: 800,
                    children: BarChart({
                        c,
                        width: 772,
                        height: 235,
                        min: 0,
                        max: 24,
                        format: 'integer',
                        yAxisLabel: 'Physical KV',
                        data: [
                            { label: 'Logical Hkv', value: 8, color: 'secondary', valueLabel: '8' },
                            {
                                label: 'TP = 4 stored',
                                value: 8,
                                color: 'positive',
                                valueLabel: '8',
                            },
                            {
                                label: 'TP = 16 stored',
                                value: 16,
                                color: 'warning',
                                valueLabel: '16 (2x)',
                            },
                        ],
                    }),
                }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeShardReplication(theme)
}

export default create('dark')
