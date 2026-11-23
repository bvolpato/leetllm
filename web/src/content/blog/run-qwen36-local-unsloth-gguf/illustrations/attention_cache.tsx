import React from 'react'
import {
    BadgePill,
    LineChart,
    Row,
    Scene,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 540
export const alt =
    'Conventional FP16 cache for one sequence. At 32K, 64K, 96K, and 128K token slots, Qwen3.6-27B uses 2, 4, 6, and 8 GiB; 35B-A3B uses 0.625, 1.25, 1.875, and 2.5 GiB. K means 1024. Weights, recurrent state, checkpoints, and buffers are excluded.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 'compact')

    return Scene({
        c,
        padding: 28,
        gap: 16,
        contentWidth: 704,
        children: [
            LineChart({
                c,
                width: 704,
                height: 350,
                title: 'Attention cache grows linearly with token slots',
                subtitle: 'One sequence · FP16 K/V · conventional attention layers only',
                labels: ['0', '32K', '64K', '96K', '128K'],
                series: [
                    { name: '27B', points: [0, 2, 4, 6, 8], color: 'purple' },
                    { name: '35B-A3B', points: [0, 0.625, 1.25, 1.875, 2.5], color: 'cyan' },
                ],
                min: 0,
                max: 8,
                format: (v) => `${v} GiB`,
                showGrid: true,
                showPoints: true,
                directLabels: true,
                yAxisLabel: 'Attention K/V (GiB)',
                ariaLabel: alt,
            }),
            Row({
                gap: 16,
                children: [
                    BadgePill({
                        c,
                        text: '27B: 16 layers × 4 KV heads',
                        tone: 'purple',
                        width: 344,
                        height: 38,
                        fontSize: 16,
                    }),
                    BadgePill({
                        c,
                        text: '35B-A3B: 10 layers × 2 KV heads',
                        tone: 'cyan',
                        width: 344,
                        height: 38,
                        fontSize: 16,
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
