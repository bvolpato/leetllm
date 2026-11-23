import React from 'react'
import {
    Column,
    DataTable,
    MiniBarChart,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 760
export const height = 520
export const preset = 'engineering'
export const alt =
    'Six coding-helper tasks are paired across Model A and Model B. Five rows tie. On permission fallback, A fails and B passes, so the row difference is plus one for B. A difference chart counts five ties, one B-only win, and zero A-only wins.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        padding: 16,
        contentWidth: 728,
        gap: 10,
        children: Column({
            gap: 10,
            width: 728,
            children: [
                TextLabel({
                    c,
                    text: 'Paired coding tasks: five ties and one B-only win',
                    fontSize: 25,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: '1. Paired task results',
                            titleFontSize: 23,
                            width: 414,
                            padding: 12,
                            gap: 8,
                            shadow: false,
                            children: preparePrintTypography(
                                DataTable({
                                    c,
                                    width: 388,
                                    firstColWidth: 168,
                                    cellWidth: 70,
                                    cellHeight: 38,
                                    gap: 4,
                                    headerRows: 1,
                                    fontSize: 23,
                                    align: ['left', 'center', 'center', 'right'],
                                    rows: [
                                        ['Task', 'A', 'B', 'B−A'],
                                        ['Timestamp', '1', '1', '0'],
                                        ['Perm check', '0', '1', '+1'],
                                        ['Retry cap', '1', '1', '0'],
                                        ['Dedupe', '0', '0', '0'],
                                        ['Quota round', '1', '1', '0'],
                                        ['Cache skip', '0', '0', '0'],
                                    ],
                                }),
                                23,
                            ),
                        }),
                        Panel({
                            c,
                            title: '2. Row diffs B − A',
                            titleFontSize: 23,
                            width: 300,
                            padding: 12,
                            gap: 10,
                            shadow: false,
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    preparePrintTypography(
                                        MiniBarChart({
                                            c,
                                            height: 210,
                                            barWidth: 64,
                                            gap: 16,
                                            max: 6,
                                            minBarHeight: 0,
                                            fontSize: 23,
                                            showValues: true,
                                            data: [
                                                {
                                                    label: 'A +1',
                                                    value: 0,
                                                    color: c.textMuted,
                                                    valueLabel: '0',
                                                },
                                                {
                                                    label: 'Tie',
                                                    value: 5,
                                                    color: blue,
                                                    valueLabel: '5',
                                                },
                                                {
                                                    label: 'B +1',
                                                    value: 1,
                                                    color: green,
                                                    valueLabel: '1',
                                                },
                                            ],
                                        }),
                                        23,
                                    ),
                                    TextLabel({
                                        c,
                                        text: 'Solve rates: A 3/6, B 4/6',
                                        fontSize: 23,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Only 1 disagreement (B)',
                                        fontSize: 23,
                                        fontWeight: 650,
                                        color: green,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
