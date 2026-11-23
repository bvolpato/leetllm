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
} from 'vizmatic'

const DENSITY = 2.5

export const width = 860
export const height = 740
export const alt =
    'Bar chart comparing 70B 128K FP16 KV cache across MHA (343.6 GB), GQA-8 (42.95 GB), and MQA (5.37 GB) alongside an H100 80 GB marker and a 32x4K versus 1x128K shape comparison.'

function makeKvHeadsComparison(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)

    const leftChart = Panel({
        c,
        title: '70B · 128K FP16 KV (GB)',
        subtitle: '80 layers · dh = 128 · Hq = 64',
        tone: 'red',
        titleFontSize: 29,
        padding: 12,
        gap: 10,
        width: 472,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                BarChart({
                    c,
                    width: 446,
                    height: 310,
                    min: 0,
                    max: 360,
                    format: (v) => `${Math.round(v)}`,
                    yAxisLabel: 'GB',
                    data: [
                        { label: 'MHA (64)', value: 343.6, color: 'critical', valueLabel: '343.6' },
                        { label: 'GQA (8)', value: 42.95, color: 'secondary', valueLabel: '42.95' },
                        { label: 'MQA (1)', value: 5.37, color: 'positive', valueLabel: '5.37' },
                    ],
                }),
                BadgePill({ c, tone: 'warm', text: '1x H100 HBM limit: 80 GB', fontSize: 26 }),
            ],
        }),
    })

    const rightLayout = Panel({
        c,
        title: 'Equal Element Count',
        subtitle: '40M floats / layer (80 MB)',
        tone: 'blue',
        titleFontSize: 29,
        padding: 12,
        gap: 12,
        width: 312,
        children: Column({
            gap: 14,
            align: 'center',
            children: [
                Row({
                    gap: 12,
                    align: 'end',
                    children: [
                        Column({
                            gap: 8,
                            align: 'center',
                            children: [
                                TiledMatrix({
                                    c,
                                    rows: 4,
                                    cols: 4,
                                    cellSize: 22,
                                    gap: 3,
                                    ariaLabel: '32 heads at 4K context grid',
                                    regions: [
                                        {
                                            rowStart: 0,
                                            rowEnd: 4,
                                            colStart: 0,
                                            colEnd: 4,
                                            tone: 'blue',
                                        },
                                    ],
                                }),
                                BadgePill({ c, tone: 'blue', text: '32x4K', fontSize: 26 }),
                            ],
                        }),
                        Column({
                            gap: 8,
                            align: 'center',
                            children: [
                                TiledMatrix({
                                    c,
                                    rows: 16,
                                    cols: 1,
                                    cellSize: 12,
                                    gap: 2,
                                    ariaLabel: '1 head at 128K context stripe',
                                    regions: [
                                        {
                                            rowStart: 0,
                                            rowEnd: 16,
                                            colStart: 0,
                                            colEnd: 1,
                                            tone: 'green',
                                        },
                                    ],
                                }),
                                BadgePill({ c, tone: 'green', text: '1x128K', fontSize: 26 }),
                            ],
                        }),
                    ],
                }),
                BadgePill({ c, tone: 'neutral', text: '40M floats / layer', fontSize: 26 }),
            ],
        }),
    })

    return Scene({
        c,
        density: DENSITY,
        padding: 14,
        gap: 14,
        contentWidth: 800,
        children: Row({
            gap: 16,
            align: 'stretch',
            children: [leftChart, rightLayout],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeKvHeadsComparison(theme)
}

export default create('dark')
