import React from 'react'
import {
    BadgePill,
    BarChart,
    Column,
    FlowArrow,
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
    'Three attention head sharing topologies across eight query heads: MHA uses eight key-value heads, GQA uses two groups of four query heads, and MQA uses one shared key-value head.'

function makeVariantsIllustration(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)

    const mhaTones: ToneName[] = [
        'blue',
        'purple',
        'cyan',
        'green',
        'warm',
        'red',
        'neutral',
        'blue',
    ]
    const gqaTones: ToneName[] = ['blue', 'blue', 'blue', 'blue', 'warm', 'warm', 'warm', 'warm']
    const mqaTones: ToneName[] = Array.from({ length: 8 }, () => 'purple')

    const makeCard = (
        title: string,
        subtitle: string,
        tone: ToneName,
        qTones: ToneName[],
        kvCols: number,
        kvTones: ToneName[],
        ratioText: string,
    ) =>
        Panel({
            c,
            title,
            subtitle,
            tone,
            titleFontSize: 27,
            padding: 12,
            gap: 8,
            width: 256,
            children: Column({
                gap: 8,
                align: 'center',
                children: [
                    TiledMatrix({
                        c,
                        rows: 1,
                        cols: 8,
                        cellSize: 22,
                        gap: 3,
                        ariaLabel: `${title} query heads`,
                        regions: qTones.map((t, col) => ({
                            rowStart: 0,
                            rowEnd: 1,
                            colStart: col,
                            colEnd: col + 1,
                            tone: t,
                        })),
                    }),
                    FlowArrow({ c, direction: 'down', length: 18, tone }),
                    TiledMatrix({
                        c,
                        rows: 2,
                        cols: kvCols,
                        cellSize: 22,
                        gap: 3,
                        ariaLabel: `${title} K and V cache heads`,
                        regions: kvTones.map((t, col) => ({
                            rowStart: 0,
                            rowEnd: 2,
                            colStart: col,
                            colEnd: col + 1,
                            tone: t,
                        })),
                    }),
                    BadgePill({ c, tone, text: `KV: ${ratioText}`, fontSize: 26 }),
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
                    children: [
                        makeCard(
                            'MHA · 8Q:8KV',
                            '8 groups · 1 Q each',
                            'blue',
                            mhaTones,
                            8,
                            mhaTones,
                            '1.00x',
                        ),
                        makeCard(
                            'GQA · 8Q:2KV',
                            '2 groups · 4 Q each',
                            'warm',
                            gqaTones,
                            2,
                            ['blue', 'warm'],
                            '0.25x',
                        ),
                        makeCard(
                            'MQA · 8Q:1KV',
                            '1 group · 8 Q total',
                            'purple',
                            mqaTones,
                            1,
                            ['purple'],
                            '0.125x',
                        ),
                    ],
                }),
                Panel({
                    c,
                    title: 'Key-value heads stored per layer',
                    titleFontSize: 27,
                    padding: 12,
                    gap: 8,
                    width: 800,
                    children: BarChart({
                        c,
                        width: 772,
                        height: 230,
                        min: 0,
                        max: 10,
                        format: 'integer',
                        yAxisLabel: 'KV heads',
                        data: [
                            {
                                label: 'MHA (Hkv=8)',
                                value: 8,
                                color: 'secondary',
                                valueLabel: '8 KV',
                            },
                            {
                                label: 'GQA-2 (Hkv=2)',
                                value: 2,
                                color: 'warning',
                                valueLabel: '2 KV',
                            },
                            { label: 'MQA (Hkv=1)', value: 1, color: 'violet', valueLabel: '1 KV' },
                        ],
                    }),
                }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeVariantsIllustration(theme)
}

export default create('dark')
