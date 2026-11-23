import { createClassificationQueryFigure } from '../classification_query_figure'
import type { ThemeMode } from 'vizmatic'

export const width = 720
export const height = 790
export const preset = 'engineering'
export const alt =
    'For four equal probabilities of 0.25, a softmax threshold p>=0.60 keeps no class. Cumulative APS scores reach 0.75 after class 2 and cross q=0.90 at class 3, so direct APS keeps classes 0-2 and the conservative crossing rule keeps all four.'

export function create(theme: ThemeMode = 'dark') {
    return createClassificationQueryFigure(
        {
            title: 'Flat Scores, Wider Prediction Sets',
            subtitle:
                'Uniform [0.25, 0.25, 0.25, 0.25]: softmax returns empty; APS crosses q = 0.90 at c3',
            probabilities: [0.25, 0.25, 0.25, 0.25],
            cumulativeSums: [0.25, 0.5, 0.75, 1.0],
            crossingClass: 3,
            softmaxSet: [],
            directSet: [0, 1, 2],
            conservativeSet: [0, 1, 2, 3],
            closing:
                'Identical calibration targets yield |C| = 0, 3, or 4 depending on score choice.',
        },
        theme,
    )
}

export default create('dark')
