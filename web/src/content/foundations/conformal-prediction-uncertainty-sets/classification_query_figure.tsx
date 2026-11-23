import {
    BadgePill,
    BarChart,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const classificationFigureWidth = 720
export const classificationFigureHeight = 790

export type ClassificationQuery = {
    title: string
    subtitle: string
    probabilities: readonly number[]
    cumulativeSums: readonly number[]
    crossingClass: number
    softmaxSet: readonly number[]
    directSet: readonly number[]
    conservativeSet: readonly number[]
    closing: string
}

const classes = [0, 1, 2, 3]

export function createClassificationQueryFigure(
    query: ClassificationQuery,
    theme: ThemeMode = 'dark',
) {
    const preset = 'engineering'
    const baseC = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const c = withDensity(baseC, 2.2)

    const setRow = (
        method: string,
        rule: string,
        selected: readonly number[],
        tone: 'blue' | 'purple' | 'warm',
    ) =>
        Row({
            gap: 8,
            align: 'center',
            children: [
                Column({
                    width: 244,
                    gap: 1,
                    children: [
                        TextLabel({
                            c,
                            text: method,
                            fontSize: 22,
                            fontWeight: 700,
                            color: c.textPrimary,
                            width: 244,
                        }),
                        TextLabel({
                            c,
                            text: rule,
                            fontSize: 22,
                            color: c.textSecondary,
                            width: 244,
                        }),
                    ],
                }),
                Row({
                    gap: 6,
                    width: 314,
                    align: 'center',
                    children: classes.map((id) =>
                        BadgePill({
                            c,
                            text: `c${id}`,
                            width: 72,
                            height: 36,
                            fontSize: 22,
                            tone: selected.includes(id) ? tone : 'neutral',
                            filled: selected.includes(id),
                        }),
                    ),
                }),
                BadgePill({
                    c,
                    text: `|C|=${selected.length}`,
                    width: 100,
                    height: 36,
                    fontSize: 22,
                    tone: selected.length === 0 ? 'critical' : tone,
                    filled: true,
                }),
            ],
        })

    return Scene({
        c,
        padding: 10,
        gap: 6,
        contentWidth: 700,
        children: Column({
            gap: 6,
            children: [
                TextLabel({
                    c,
                    text: query.title,
                    fontSize: 26,
                    fontWeight: 750,
                    color: c.textPrimary,
                    width: 700,
                }),
                BarChart({
                    c,
                    width: 700,
                    height: 150,
                    title: 'Softmax Probabilities (keep p >= 0.60)',
                    max: 1.15,
                    showGrid: true,
                    showValues: true,
                    data: classes.map((id) => ({
                        label: `c${id}`,
                        value: query.probabilities[id],
                        valueLabel: String(query.probabilities[id]),
                        color: query.softmaxSet.includes(id) ? 'primary' : 'neutral',
                    })),
                }),
                BarChart({
                    c,
                    width: 700,
                    height: 150,
                    title: 'APS Cumulative Sum (q = 0.90; orange crosses)',
                    max: 1.15,
                    showGrid: true,
                    showValues: true,
                    data: classes.map((id) => ({
                        label: `c${id}`,
                        value: query.cumulativeSums[id],
                        valueLabel: String(query.cumulativeSums[id]),
                        color:
                            id === query.crossingClass
                                ? 'warning'
                                : query.directSet.includes(id)
                                  ? 'positive'
                                  : 'neutral',
                    })),
                }),
                Panel({
                    c,
                    width: 700,
                    title: 'Resulting Prediction Sets',
                    tone: 'blue',
                    padding: 8,
                    gap: 6,
                    children: [
                        setRow('Softmax', '1 - p <= 0.40', query.softmaxSet, 'blue'),
                        setRow('APS direct', 'sum <= 0.90', query.directSet, 'purple'),
                        setRow('Conservative', 'first > 0.90', query.conservativeSet, 'warm'),
                    ],
                }),
            ],
        }),
    })
}
