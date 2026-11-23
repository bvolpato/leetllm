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
    'A fixed 10 GiB KV cache pool partitioned across 4K-context requests fits 1 MHA request, 8 GQA-8 requests, or 64 MQA requests.'

function makeServingCeiling(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)
    const palette: ToneName[] = ['blue', 'green', 'warm', 'purple', 'cyan', 'red', 'blue', 'green']

    const gqaRegions = Array.from({ length: 8 }, (_, row) => ({
        rowStart: row,
        rowEnd: row + 1,
        colStart: 0,
        colEnd: 8,
        tone: palette[row],
    }))

    const mqaRegions = Array.from({ length: 64 }, (_, i) => ({
        rowStart: Math.floor(i / 8),
        rowEnd: Math.floor(i / 8) + 1,
        colStart: i % 8,
        colEnd: (i % 8) + 1,
        tone: palette[(Math.floor(i / 8) + (i % 8)) % palette.length],
    }))

    const poolCard = (
        title: string,
        perReq: string,
        tone: ToneName,
        regions: typeof gqaRegions,
        capText: string,
    ) =>
        Panel({
            c,
            title,
            subtitle: perReq,
            tone,
            titleFontSize: 28,
            padding: 12,
            gap: 8,
            width: 256,
            children: Column({
                gap: 8,
                align: 'center',
                children: [
                    TiledMatrix({
                        c,
                        rows: 8,
                        cols: 8,
                        cellSize: 18,
                        gap: 2,
                        ariaLabel: `${title} partition of 10 GiB KV pool`,
                        regions,
                    }),
                    BadgePill({ c, tone, text: capText, fontSize: 26 }),
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
                        poolCard(
                            'MHA (64 KV)',
                            '10 GiB / req',
                            'red',
                            [{ rowStart: 0, rowEnd: 8, colStart: 0, colEnd: 8, tone: 'red' }],
                            '10 GiB: 1 req',
                        ),
                        poolCard(
                            'GQA-8 (8 KV)',
                            '1.25 GiB / req',
                            'blue',
                            gqaRegions,
                            '10 GiB: 8 reqs',
                        ),
                        poolCard(
                            'MQA (1 KV)',
                            '0.16 GiB / req',
                            'green',
                            mqaRegions,
                            '10 GiB: 64 reqs',
                        ),
                    ],
                }),
                Panel({
                    c,
                    title: 'Concurrent 4K requests in 10 GiB KV pool',
                    titleFontSize: 27,
                    padding: 12,
                    gap: 8,
                    width: 800,
                    children: BarChart({
                        c,
                        width: 772,
                        height: 235,
                        min: 0,
                        max: 78,
                        format: 'integer',
                        yAxisLabel: 'Requests',
                        data: [
                            { label: 'MHA', value: 1, color: 'critical', valueLabel: '1' },
                            { label: 'GQA-8', value: 8, color: 'secondary', valueLabel: '8' },
                            { label: 'MQA', value: 64, color: 'positive', valueLabel: '64' },
                        ],
                    }),
                }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeServingCeiling(theme)
}

export default create('dark')
