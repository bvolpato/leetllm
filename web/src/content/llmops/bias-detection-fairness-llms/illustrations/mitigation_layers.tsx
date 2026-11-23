import {
    LineChart,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 560
export const alt =
    'Calibration reliability curves showing uncalibrated LLM score outputs over-predicting Group B positive outcomes relative to Group A, while subgroup Platt scaling aligns both groups with the ideal diagonal.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.4)

    return Scene({
        c,
        padding: 10,
        gap: 6,
        contentWidth: 720,
        children: [
            TextLabel({
                c,
                text: 'Subgroup calibration before setting decision thresholds',
                fontSize: 27,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'Shared thresholds fail when scores mean unequal odds.',
                fontSize: 24,
                color: c.textSecondary,
            }),
            LineChart({
                c,
                width: 720,
                height: 410,
                labels: ['0.20', '0.40', '0.60', '0.80', '0.90'],
                min: 0.1,
                max: 0.95,
                format: 'decimal',
                yAxisLabel: 'Observed rate',
                showGrid: true,
                showPoints: true,
                directLabels: true,
                series: [
                    {
                        name: 'Ideal',
                        points: [0.2, 0.4, 0.6, 0.8, 0.9],
                        color: getReadableToneColor('neutral', c),
                    },
                    {
                        name: 'Group A',
                        points: [0.22, 0.43, 0.64, 0.81, 0.84],
                        color: getReadableToneColor('cyan', c),
                    },
                    {
                        name: 'Group B',
                        points: [0.14, 0.28, 0.46, 0.67, 0.73],
                        color: getReadableToneColor('critical', c),
                    },
                ],
            }),
        ],
    })
}

export default create('dark')
