import { Column, GraphDiagram, Scene, TextLabel, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 740
export const height = 740
export const alt =
    'Evaluation cases grouped by development usage around a March 31 tuning snapshot. Cases authored before or after the snapshot that entered judge or prompt tuning move to the regression suite, including an April 21 case. Only unseen cases created after the snapshot remain holdout candidates.'

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.25),
        shadow: 'transparent',
    }
}

const illustration = defineIllustration((base) => {
    const c = prepTheme(base)
    const innerW = width - 40
    return Scene({
        c,
        padding: 6,
        gap: 6,
        contentWidth: innerW,
        children: Column({
            width: innerW,
            gap: 8,
            children: [
                TextLabel({
                    c,
                    text: 'Used in tuning -> Regression suite',
                    width: innerW,
                    fontSize: 24,
                    fontWeight: 700,
                    color: c.warningLight,
                }),
                GraphDiagram({
                    c,
                    width: innerW,
                    height: 250,
                    padding: 4,
                    direction: 'LR',
                    arrowSize: 6,
                    routing: 'dagre',
                    nodeWidth: 280,
                    nodeGap: 8,
                    rankGap: 28,
                    nodes: [
                        {
                            id: 'c_feb',
                            label: 'Feb 10 · 4bit',
                            detail: 'Tuned prompt',
                            tone: 'warm',
                        },
                        {
                            id: 'c_apr21',
                            label: 'Apr 21 · fp8-kv',
                            detail: 'Tuned judge',
                            tone: 'warm',
                        },
                        { id: 'reg', label: 'Regression', detail: 'Known checks', tone: 'warm' },
                    ],
                    edges: [
                        { from: 'c_feb', to: 'reg', tone: 'warm' },
                        { from: 'c_apr21', to: 'reg', tone: 'warm' },
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Unused after Mar 31 -> Holdout suite',
                    width: innerW,
                    fontSize: 24,
                    fontWeight: 700,
                    color: c.primaryLight,
                }),
                GraphDiagram({
                    c,
                    width: innerW,
                    height: 250,
                    padding: 4,
                    direction: 'LR',
                    arrowSize: 6,
                    routing: 'dagre',
                    nodeWidth: 280,
                    nodeGap: 8,
                    rankGap: 28,
                    nodes: [
                        {
                            id: 'c_apr8',
                            label: 'Apr 8 · prefill',
                            detail: 'Unused case',
                            tone: 'blue',
                        },
                        {
                            id: 'c_may3',
                            label: 'May 3 · template',
                            detail: 'Unused case',
                            tone: 'blue',
                        },
                        {
                            id: 'holdout',
                            label: 'Holdout set',
                            detail: 'Generalization',
                            tone: 'blue',
                        },
                    ],
                    edges: [
                        { from: 'c_apr8', to: 'holdout', tone: 'blue' },
                        { from: 'c_may3', to: 'holdout', tone: 'blue' },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
