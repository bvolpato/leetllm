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
    'Claude Pro base-fee comparison at unchanged prices: monthly payments rise by 20 dollars per month; the prepaid annual cost is 200 dollars. They tie after ten monthly payments and differ by 40 dollars after twelve.'

export function create(mode: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(mode), 'compact')
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const monthlySpend = months.map((_, i) => (i + 1) * 20)
    const annualSpend = months.map(() => 200)

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
                title: 'Annual fees break even at month 10',
                subtitle: 'Claude Pro · unchanged base prices · USD before tax',
                labels: months,
                series: [
                    { name: '$20/month', points: monthlySpend, color: 'cyan' },
                    { name: '$200 annual', points: annualSpend, color: 'purple' },
                ],
                min: 0,
                max: 260,
                format: (v) => `$${Math.round(v)}`,
                showGrid: true,
                showPoints: true,
                directLabels: true,
                yAxisLabel: 'Cumulative spend (USD)',
                ariaLabel: alt,
            }),
            Row({
                gap: 16,
                children: [
                    BadgePill({
                        c,
                        text: '6 months: save $80 monthly',
                        tone: 'cyan',
                        width: 344,
                        height: 38,
                        fontSize: 16,
                    }),
                    BadgePill({
                        c,
                        text: '12 months: save $40 annually',
                        tone: 'purple',
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
