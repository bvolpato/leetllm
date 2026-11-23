import { Matrix, Scene, TextLabel, getThemeColors, withDensity, type ThemeMode } from 'vizmatic'

export const width = 720
export const height = 520
export const alt =
    'Matrix of fairness metrics across two cohorts with 40 percent and 20 percent positive base rates. Matching true positive rates forces false positive rates, selection rates, and precision to diverge.'

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
                text: 'Base-rate differences force fairness trade-offs',
                fontSize: 27,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'Equalizing true positive rate separates selection, FPR, and precision.',
                fontSize: 22,
                color: c.textSecondary,
            }),
            Matrix({
                c,
                rowLabels: [
                    'Selection rate',
                    'True positive rate',
                    'False positive rate',
                    'Positive predictive',
                ],
                colLabels: ['Cohort A (40%)', 'Cohort B (20%)'],
                format: 'percent',
                colorize: true,
                colorScale: 'strength',
                cellWidth: 165,
                cellHeight: 74,
                rowLabelWidth: 250,
                fontSize: 22,
                highlightRow: 1,
                data: [
                    [0.43, 0.23],
                    [0.8, 0.8],
                    [0.18, 0.09],
                    [0.74, 0.69],
                ],
            }),
        ],
    })
}

export default create('dark')
