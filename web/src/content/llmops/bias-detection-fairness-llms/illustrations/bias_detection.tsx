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
    'Line chart comparing rubric scores across six identical matched prompt pairs phrased in standard technical prose versus conversational dialect. Despite identical qualifications, conversational phrasing scores systematically lower and frequently crosses below the 0.70 auto-serve threshold.'

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
                text: 'Matched-pair scores expose dialect sensitivity',
                fontSize: 28,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'Identical inputs cross the 0.70 cutoff when dialect shifts.',
                fontSize: 23,
                color: c.textSecondary,
            }),
            LineChart({
                c,
                width: 720,
                height: 410,
                labels: ['Pair 1', 'Pair 2', 'Pair 3', 'Pair 4', 'Pair 5', 'Pair 6'],
                min: 0.55,
                max: 0.85,
                format: 'decimal',
                yAxisLabel: 'Model rubric score',
                showGrid: true,
                showPoints: true,
                directLabels: true,
                series: [
                    {
                        name: '0.70 cutoff',
                        points: [0.7, 0.7, 0.7, 0.7, 0.7, 0.7],
                        color: getReadableToneColor('warm', c),
                    },
                    {
                        name: 'Standard',
                        points: [0.8, 0.78, 0.75, 0.79, 0.73, 0.82],
                        color: getReadableToneColor('cyan', c),
                    },
                    {
                        name: 'Dialect',
                        points: [0.72, 0.67, 0.64, 0.69, 0.62, 0.76],
                        color: getReadableToneColor('purple', c),
                    },
                ],
            }),
        ],
    })
}

export default create('dark')
