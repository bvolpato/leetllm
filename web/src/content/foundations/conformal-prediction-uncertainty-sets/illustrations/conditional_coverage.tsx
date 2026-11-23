import { BarChart, Column, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 720
export const height = 780
export const preset = 'engineering'
export const alt =
    'An evaluation slice has 750 short requests at 96% coverage, or 720 covered and 30 missed, and 250 long requests at 54%, or 135 covered and 115 missed. The observed 75/25 mix gives 85.5% aggregate coverage, above an 80% target despite weak long-request coverage. Keeping both group rates fixed but changing the mix to 50/50 gives 75% overall coverage.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.2)
    return Scene({
        c,
        padding: 12,
        gap: 8,
        contentWidth: 696,
        children: Column({
            gap: 8,
            children: [
                BarChart({
                    c,
                    width: 696,
                    height: 155,
                    title: 'Subgroup Coverage (%) vs 80% Target',
                    subtitle: '750 short prompts pass; 250 long prompts miss heavily',
                    max: 112,
                    showGrid: true,
                    showValues: true,
                    data: [
                        {
                            label: 'Short (720/750)',
                            value: 96,
                            valueLabel: '96.0%',
                            color: 'positive',
                        },
                        {
                            label: 'Long (135/250)',
                            value: 54,
                            valueLabel: '54.0%',
                            color: 'critical',
                        },
                        { label: 'Target Level', value: 80, valueLabel: '80.0%', color: 'warning' },
                    ],
                }),
                BarChart({
                    c,
                    width: 696,
                    height: 155,
                    title: 'Marginal Average Shifts With Mix (%)',
                    subtitle: 'Fixed subgroup rates fall from 85.5% to 75.0%',
                    max: 112,
                    showGrid: true,
                    showValues: true,
                    data: [
                        {
                            label: '75% Short / 25% Long',
                            value: 85.5,
                            valueLabel: '85.5%',
                            color: 'positive',
                        },
                        {
                            label: '50% Short / 50% Long',
                            value: 75.0,
                            valueLabel: '75.0%',
                            color: 'critical',
                        },
                    ],
                }),
                Row({
                    gap: 10,
                    align: 'stretch',
                    children: [
                        MetricCard({
                            c,
                            width: 343,
                            tone: 'green',
                            padding: 10,
                            valueFontSize: 34,
                            label: '75/25 Mix (passes)',
                            value: '85.5%',
                            detail: '0.75 x 96% + 0.25 x 54%',
                        }),
                        MetricCard({
                            c,
                            width: 343,
                            tone: 'critical',
                            padding: 10,
                            valueFontSize: 34,
                            label: '50/50 Mix (misses)',
                            value: '75.0%',
                            detail: '0.50 x 96% + 0.50 x 54%',
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.create('dark')
