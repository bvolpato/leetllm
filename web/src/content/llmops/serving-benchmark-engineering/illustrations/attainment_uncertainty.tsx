import React from 'react'
import {
    IntervalPlot,
    Scene,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 680
export const height = 620
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Zoomed 85% to 100% plot of one-sided 95% Wilson lower confidence bounds for three benchmark outcomes. Only 200 of 200 passes the 95% lower-bound gate at 98.7%. Both 190 of 200 (95% observed, 91.8% lower bound) and 20 of 20 (100% observed, 88.1% lower bound) fall below 95%.'

const z = 1.6448536269514715
function wilsonLower(good: number, n: number): number {
    const p = good / n
    return (
        (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) /
        (1 + (z * z) / n)
    )
}

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.05)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('red', c)

    const p200 = wilsonLower(200, 200)
    const p190 = wilsonLower(190, 200)
    const p20 = wilsonLower(20, 20)

    return Scene({
        c,
        density: 2.05,
        padding: 10,
        contentWidth: 640,
        children: IntervalPlot({
            c,
            title: 'Small samples miss a 95% lower-bound gate',
            subtitle: 'One-sided 95% Wilson bounds zoomed to [85%, 100%] (gate >= 95%)',
            width: 640,
            height: 315,
            min: 0.85,
            max: 1.0,
            format: 'percent',
            data: [
                {
                    label: '200 / 200',
                    low: p200,
                    mid: 1.0,
                    high: 1.0,
                    color: green,
                    lowLabel: `${(p200 * 100).toFixed(1)}%`,
                    midLabel: '100%',
                    highLabel: ' ',
                },
                {
                    label: '190 / 200',
                    low: p190,
                    mid: 0.95,
                    high: 1.0,
                    color: warm,
                    lowLabel: `${(p190 * 100).toFixed(1)}%`,
                    midLabel: '95%',
                    highLabel: ' ',
                },
                {
                    label: '20 / 20',
                    low: p20,
                    mid: 1.0,
                    high: 1.0,
                    color: red,
                    lowLabel: `${(p20 * 100).toFixed(1)}%`,
                    midLabel: '100%',
                    highLabel: ' ',
                },
            ],
            ariaLabel: alt,
        }),
    })
}

export default create('dark')
