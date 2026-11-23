import React from 'react'
import {
    Column,
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
    'Two task-difference distributions share a 0-to-100-percent scale. With independent prompts and 50-percent pass rates, B minus A is minus one on 25 percent of tasks, zero on 50 percent, and plus one on 25 percent. Under the paired example, those probabilities are 5, 90, and 5 percent. At 40 rows, the variance of the mean difference falls from 0.0125 to 0.0025; nominal normal margins shrink from 21.9 to 9.8 percentage points.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

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
                    text: 'Pairing shrinks variance when task difficulty is shared',
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
                            title: 'Unpaired prompts (ρ = 0)',
                            titleFontSize: 23,
                            width: 357,
                            padding: 12,
                            gap: 10,
                            shadow: false,
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    preparePrintTypography(
                                        MiniBarChart({
                                            c,
                                            height: 210,
                                            barWidth: 74,
                                            gap: 20,
                                            max: 100,
                                            minBarHeight: 0,
                                            fontSize: 23,
                                            showValues: true,
                                            data: [
                                                {
                                                    label: '−1',
                                                    value: 25,
                                                    color: warm,
                                                    valueLabel: '25%',
                                                },
                                                {
                                                    label: '0',
                                                    value: 50,
                                                    color: blue,
                                                    valueLabel: '50%',
                                                },
                                                {
                                                    label: '+1',
                                                    value: 25,
                                                    color: warm,
                                                    valueLabel: '25%',
                                                },
                                            ],
                                        }),
                                        23,
                                    ),
                                    TextLabel({
                                        c,
                                        text: 'N=40 Var = 0.0125',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: warm,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Nominal ±1.96·SE: ±21.9 pp',
                                        fontSize: 23,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Paired tasks (ρ = 0.80)',
                            titleFontSize: 23,
                            width: 357,
                            padding: 12,
                            gap: 10,
                            shadow: false,
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    preparePrintTypography(
                                        MiniBarChart({
                                            c,
                                            height: 210,
                                            barWidth: 74,
                                            gap: 20,
                                            max: 100,
                                            minBarHeight: 0,
                                            fontSize: 23,
                                            showValues: true,
                                            data: [
                                                {
                                                    label: '−1',
                                                    value: 5,
                                                    color: warm,
                                                    valueLabel: '5%',
                                                },
                                                {
                                                    label: '0',
                                                    value: 90,
                                                    color: green,
                                                    valueLabel: '90%',
                                                },
                                                {
                                                    label: '+1',
                                                    value: 5,
                                                    color: green,
                                                    valueLabel: '5%',
                                                },
                                            ],
                                        }),
                                        23,
                                    ),
                                    TextLabel({
                                        c,
                                        text: 'N=40 Var = 0.0025 (5× less)',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: green,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Nominal ±1.96·SE: ±9.8 pp',
                                        fontSize: 23,
                                        color: c.textSecondary,
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
