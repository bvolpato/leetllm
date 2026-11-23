import { Heatmap, Scene, TextLabel, getThemeColors, withDensity, type ThemeMode } from 'vizmatic'

export const width = 720
export const height = 500
export const alt =
    'Heatmap of false-negative error rates across career stage and prompt register. Overall averages hide a 24 percent miss rate on early-career non-native prompt phrasing.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        padding: 10,
        gap: 6,
        contentWidth: 680,
        children: [
            TextLabel({
                c,
                text: 'Intersectional false-negative rates across slices',
                fontSize: 27,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'Marginal cohort averages mask localized error spikes.',
                fontSize: 22,
                color: c.textSecondary,
            }),
            Heatmap({
                c,
                yLabels: ['Early career', 'Mid career', 'Senior'],
                xLabels: ['Standard', 'Colloquial', 'Non-native'],
                cellWidth: 138,
                cellHeight: 82,
                rowLabelWidth: 185,
                colorScale: 'heat',
                fontSize: 22,
                highlightCell: { row: 0, col: 2 },
                colorDomain: [0.04, 0.26],
                data: [
                    [0.08, 0.14, 0.24],
                    [0.07, 0.1, 0.16],
                    [0.05, 0.08, 0.12],
                ],
                labels: [
                    ['8%', '14%', '24%'],
                    ['7%', '10%', '16%'],
                    ['5%', '8%', '12%'],
                ],
            }),
        ],
    })
}

export default create('dark')
