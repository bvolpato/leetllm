import {
    BadgePill,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TreeDiagram,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 580
export const height = 700
export const alt =
    'Tree-of-Thoughts search over Game of 24 starting at {4, 5, 6, 7}. Branch A reaches [24, 5, 7] with heuristic score 0.95 yet hits a dead end. Branch B reaches [12, 4, 6] with score 0.40: width-1 beam drops it, whereas width-2 retains it through 6 - 4 = 2 and 12 * 2 = 24. Branch C leaves [2, 4, 6] at score 0.35.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.72)
    return Scene({
        c,
        padding: 8,
        gap: 10,
        contentWidth: 564,
        children: [
            TreeDiagram({
                c,
                width: 564,
                height: 550,
                nodeWidth: 176,
                nodeHeight: 92,
                levelGap: 44,
                siblingGap: 10,
                padding: 6,
                root: {
                    label: '{4, 5, 6, 7}',
                    detail: 'Target: 24',
                    tone: 'neutral',
                    children: [
                        {
                            label: 'A: 6*4 = 24',
                            detail: '[24,5,7] (.95)',
                            tone: 'critical',
                        },
                        {
                            label: 'B: 5+7 = 12',
                            detail: '[12,4,6] (.40)',
                            tone: 'green',
                            children: [
                                {
                                    label: '6-4 = 2',
                                    detail: '[12, 2]',
                                    tone: 'blue',
                                    children: [
                                        {
                                            label: '12*2 = 24',
                                            detail: 'Solved',
                                            tone: 'green',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            label: 'C: 7-5 = 2',
                            detail: '[2,4,6] (.35)',
                            tone: 'warm',
                        },
                    ],
                },
            }),
            Panel({
                c,
                title: 'Beam width outcome',
                width: 564,
                padding: 10,
                children: Row({
                    gap: 8,
                    justify: 'center',
                    align: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'Beam w=1: keeps A (fails)',
                            tone: 'critical',
                            fontSize: 18,
                        }),
                        FlowArrow({ c, direction: 'right', length: 12, tone: 'green' }),
                        BadgePill({
                            c,
                            text: 'w=2: keeps B (24)',
                            tone: 'green',
                            fontSize: 18,
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
