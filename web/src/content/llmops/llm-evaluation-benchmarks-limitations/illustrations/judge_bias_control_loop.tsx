import { Column, GraphDiagram, Scene, TextLabel, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 720
export const height = 800
export const alt =
    'Two order-swapped judge checks. When equivalent answers trigger slot-A tie bias, concise wins first and verbose wins second, sending the flipped identity to human review. When one answer omits a rule, concise wins in slot A and then slot B, yielding a stable winner that still needs rubric accuracy validation.'

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.2),
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
            gap: 10,
            children: [
                TextLabel({
                    c,
                    text: 'Equal facts + tie bias -> send to human review',
                    width: innerW,
                    fontSize: 23,
                    fontWeight: 700,
                    color: c.warningLight,
                }),
                GraphDiagram({
                    c,
                    width: innerW,
                    height: 270,
                    padding: 4,
                    direction: 'LR',
                    arrowSize: 6,
                    routing: 'dagre',
                    nodeWidth: 270,
                    nodeGap: 8,
                    rankGap: 28,
                    nodes: [
                        {
                            id: 'eq1',
                            label: '(Concise, Verbose)',
                            detail: 'Vote A -> Concise',
                            tone: 'warm',
                        },
                        {
                            id: 'eq2',
                            label: '(Verbose, Concise)',
                            detail: 'Vote A -> Verbose',
                            tone: 'warm',
                        },
                        {
                            id: 'eq_out',
                            label: 'Flipped winner',
                            detail: 'Route to review',
                            tone: 'warm',
                        },
                    ],
                    edges: [
                        { from: 'eq1', to: 'eq_out', tone: 'warm' },
                        { from: 'eq2', to: 'eq_out', tone: 'warm' },
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Omission present -> stable winner (verify accuracy)',
                    width: innerW,
                    fontSize: 23,
                    fontWeight: 700,
                    color: c.primaryLight,
                }),
                GraphDiagram({
                    c,
                    width: innerW,
                    height: 270,
                    padding: 4,
                    direction: 'LR',
                    arrowSize: 6,
                    routing: 'dagre',
                    nodeWidth: 270,
                    nodeGap: 10,
                    rankGap: 30,
                    nodes: [
                        {
                            id: 'm1',
                            label: '(Concise, Omission)',
                            detail: 'Vote A -> Concise',
                            tone: 'blue',
                        },
                        {
                            id: 'm2',
                            label: '(Omission, Concise)',
                            detail: 'Vote B -> Concise',
                            tone: 'blue',
                        },
                        {
                            id: 'm_out',
                            label: 'Stable: Concise',
                            detail: 'Check human labels',
                            tone: 'blue',
                        },
                    ],
                    edges: [
                        { from: 'm1', to: 'm_out', tone: 'blue' },
                        { from: 'm2', to: 'm_out', tone: 'blue' },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
