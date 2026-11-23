import React from 'react'
import {
    Column,
    Matrix,
    Panel,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 660
export const alt =
    'Expert-choice buckets E1=[t0,t1], E2=[t0,t2], E3=[t2,t3] hold two tokens each, giving token assignments 2, 1, 2, 1, and 0 so t4 stays uncovered. In a one-slot bucket, earlier score 0.60 wins the prefix, while an extended sequence adds future token score 0.90 and displaces it.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
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
                    title: 'Balanced 2-slot buckets leave token t4 uncovered',
                    titleFontSize: 20,
                    width: 572,
                    padding: 14,
                    gap: 8,
                    children: [
                        Matrix({
                            c: cd,
                            rowLabels: ['E1 (2 slots)', 'E2 (2 slots)', 'E3 (2 slots)'],
                            colLabels: ['t0 (2x)', 't1 (1x)', 't2 (2x)', 't3 (1x)', 't4 (0x)'],
                            data: [
                                [1, 1, 0, 0, 0],
                                [1, 0, 1, 0, 0],
                                [0, 0, 1, 1, 0],
                            ],
                            labels: [
                                ['1', '1', '·', '·', '·'],
                                ['1', '·', '1', '·', '·'],
                                ['·', '·', '1', '1', '·'],
                            ],
                            cellWidth: 68,
                            cellHeight: 38,
                            rowLabelWidth: 128,
                            colorize: true,
                            colorScale: 'strength',
                            highlightCol: 4,
                            fontSize: 18,
                        }),
                        TextLabel({
                            c,
                            text: 'Token hits: t0 = 2, t1 = 1, t2 = 2, t3 = 1, t4 = 0 (dropped expert path).',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c: cd,
                    title: '1-slot bucket depends on future tokens',
                    titleFontSize: 20,
                    width: 572,
                    padding: 14,
                    gap: 8,
                    children: [
                        Row({
                            gap: 14,
                            align: 'start',
                            children: [
                                Panel({
                                    c: cd,
                                    title: 'Prefix only',
                                    titleFontSize: 19,
                                    width: 262,
                                    padding: 12,
                                    children: ProgressList({
                                        c: cd,
                                        labelWidth: 94,
                                        valueWidth: 102,
                                        barHeight: 16,
                                        fontSize: 18,
                                        rows: [
                                            {
                                                label: 'earlier',
                                                value: 0.6,
                                                valueLabel: '0.60 WIN',
                                                tone: 'green',
                                            },
                                        ],
                                    }),
                                }),
                                Panel({
                                    c: cd,
                                    title: 'Prefix + future',
                                    titleFontSize: 19,
                                    width: 268,
                                    padding: 12,
                                    children: ProgressList({
                                        c: cd,
                                        labelWidth: 94,
                                        valueWidth: 108,
                                        barHeight: 16,
                                        fontSize: 18,
                                        rows: [
                                            {
                                                label: 'future',
                                                value: 0.9,
                                                valueLabel: '0.90 WIN',
                                                tone: 'blue',
                                            },
                                            {
                                                label: 'earlier',
                                                value: 0.6,
                                                valueLabel: '0.60 out',
                                                muted: true,
                                            },
                                        ],
                                    }),
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Earlier score 0.60 stays unchanged, yet future score 0.90 evicts it.',
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
