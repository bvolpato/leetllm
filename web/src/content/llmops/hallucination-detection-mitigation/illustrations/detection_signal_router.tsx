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
    'Line chart of unsupported claim risk versus answer coverage across abstention thresholds. A calibrated NLI verifier holds risk at five percent at seventy percent coverage, outperforming token probability and consistency alone.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.4)

    return Scene({
        c,
        padding: 20,
        gap: 10,
        contentWidth: 720,
        children: [
            TextLabel({
                c,
                text: 'Risk-coverage curves across verification signals',
                fontSize: 28,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'Tightening the cutoff trades answer coverage for lower error risk.',
                fontSize: 23,
                color: c.textSecondary,
            }),
            LineChart({
                c,
                width: 720,
                height: 410,
                labels: ['40% cov', '55% cov', '70% cov', '85% cov', '92% cov'],
                min: 0,
                max: 0.28,
                format: 'percent',
                yAxisLabel: 'Unsupported risk',
                showGrid: true,
                showPoints: true,
                directLabels: true,
                series: [
                    {
                        name: 'Token prob',
                        points: [0.11, 0.14, 0.19, 0.23, 0.26],
                        color: getReadableToneColor('neutral', c),
                    },
                    {
                        name: 'SelfCheck',
                        points: [0.06, 0.08, 0.12, 0.17, 0.21],
                        color: getReadableToneColor('warm', c),
                    },
                    {
                        name: 'Calibrated NLI',
                        points: [0.02, 0.03, 0.05, 0.1, 0.15],
                        color: getReadableToneColor('cyan', c),
                        area: true,
                    },
                ],
            }),
        ],
    })
}

export default create('dark')
