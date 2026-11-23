import { createClassificationQueryFigure } from '../classification_query_figure'
import type { ThemeMode } from 'vizmatic'

export const width = 720
export const height = 790
export const preset = 'engineering'
export const alt =
    'For probabilities [0.98, 0.01, 0.005, 0.005], a softmax threshold p>=0.60 keeps class 0. The APS cumulative scores start at 0.98, above q=0.90, so direct APS returns an empty set. The conservative crossing rule includes class 0.'

export function create(theme: ThemeMode = 'dark') {
    return createClassificationQueryFigure(
        {
            title: 'Confident Scores, Empty Direct APS',
            subtitle:
                'Probabilities [0.98, 0.01, 0.005, 0.005]: first cumulative sum 0.98 > q = 0.90',
            probabilities: [0.98, 0.01, 0.005, 0.005],
            cumulativeSums: [0.98, 0.99, 0.995, 1.0],
            crossingClass: 0,
            softmaxSet: [0],
            directSet: [],
            conservativeSet: [0],
            closing: 'Conservative crossing retains class 0 so the prediction set stays nonempty.',
        },
        theme,
    )
}

export default create('dark')
