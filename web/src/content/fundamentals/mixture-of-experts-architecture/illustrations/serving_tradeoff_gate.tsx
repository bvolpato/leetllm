import React from 'react'
import {
    BarChart,
    Column,
    DataTable,
    Panel,
    Row,
    Scene,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 680
export const alt =
    'Dense baseline achieves quality 0.82, p95 latency 48 ms, and throughput 820 tokens/s; MoE candidate reaches quality 0.83, p95 latency 55 ms (+7 ms), and throughput 1100 tokens/s (+34.1%). Against requirements of quality at least 0.82 and throughput at least 1000 tokens/s, MoE passes under a 60 ms p95 cap and fails if latency is tightened to 50 ms.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

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
                    title: 'Serving tradeoff: +34.1% throughput, +7 ms p95 latency',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    children: Row({
                        gap: 12,
                        align: 'start',
                        children: [
                            BarChart({
                                c: cd,
                                width: 266,
                                height: 210,
                                title: 'Tokens / s',
                                min: 0,
                                max: 1300,
                                format: 'integer',
                                showGrid: true,
                                showValues: true,
                                data: [
                                    { label: 'Dense', value: 820, color: warm, valueLabel: '820' },
                                    { label: 'MoE', value: 1100, color: green, valueLabel: '1100' },
                                ],
                            }),
                            BarChart({
                                c: cd,
                                width: 266,
                                height: 210,
                                title: 'p95 latency (ms)',
                                min: 0,
                                max: 70,
                                format: 'integer',
                                showGrid: true,
                                showValues: true,
                                data: [
                                    { label: 'Dense', value: 48, color: blue, valueLabel: '48 ms' },
                                    { label: 'MoE', value: 55, color: warm, valueLabel: '55 ms' },
                                ],
                            }),
                        ],
                    }),
                }),
                Panel({
                    c: cd,
                    title: 'Requirement check across two latency caps',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    children: DataTable({
                        c: cd,
                        width: 544,
                        headerRows: 1,
                        headerCols: 1,
                        cellHeight: 32,
                        gap: 4,
                        fontSize: 18,
                        rows: [
                            ['Criterion', 'Dense', 'MoE (60 ms)', 'MoE (50 ms)'],
                            ['Quality >= 0.82', '0.82 pass', '0.83 pass', '0.83 pass'],
                            ['p95 <= cap', '48 ms pass', '55 ms pass', '55 ms FAIL'],
                            ['Tok/s >= 1000', '820 FAIL', '1100 pass', '1100 pass'],
                        ],
                    }),
                }),
            ],
        }),
    })
}

export default create('dark')
