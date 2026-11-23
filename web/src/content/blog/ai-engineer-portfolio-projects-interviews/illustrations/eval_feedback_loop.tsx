import React from 'react'
import {
    Column,
    GraphDiagram,
    Matrix,
    Panel,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 790
export const alt =
    'Four-case evaluation gate comparison and feedback flow: Baseline scores 50 percent (passes rollback and injection; misses missing evidence and conflict) while Candidate scores 75 percent (passes rollback, missing evidence, and conflict; fails prompt injection). Neither clears all four required cases, so the HOLD verdict routes the candidate back to fix the failed trace before a 4/4 run reaches REVIEW.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.0)

    return (
        <Scene c={c} padding={10} gap={10}>
            <Column gap={10} align="stretch">
                <Panel
                    c={c}
                    title="4-Case Gate Matrix (50% vs 75% HOLD)"
                    width={640}
                    padding={8}
                    tone="blue"
                >
                    <Matrix
                        c={c}
                        data={[
                            [1, 1],
                            [0, 1],
                            [0, 1],
                            [1, 0],
                        ]}
                        rowLabels={['q-rollback', 'q-missing', 'q-conflict', 'q-injection']}
                        colLabels={['Base 50%', 'Cand 75%']}
                        labels={[
                            ['PASS', 'PASS'],
                            ['FAIL', 'PASS'],
                            ['FAIL', 'PASS'],
                            ['PASS', 'FAIL'],
                        ]}
                        rowLabelWidth={165}
                        cellWidth={155}
                        cellHeight={42}
                        fontSize={22}
                        colorize
                        colorScale="strength"
                        colorDomain={[0, 1]}
                        highlightCell={{ row: 3, col: 1 }}
                    />
                </Panel>
                <Panel c={c} title="Pinned Feedback Loop" width={640} padding={8} tone="purple">
                    <GraphDiagram
                        c={c}
                        width={616}
                        height={250}
                        layout="auto"
                        direction="LR"
                        padding={8}
                        nodeWidth={144}
                        nodeHeight={62}
                        nodeGap={16}
                        rankGap={24}
                        labelFontSize={22}
                        detailFontSize={20}
                        arrowSize={5}
                        nodes={[
                            {
                                id: 'suite',
                                label: 'Suite (4)',
                                detail: 'Cand 3/4',
                                tone: 'blue',
                            },
                            {
                                id: 'gate',
                                label: 'Gate',
                                detail: 'All 4 pass',
                                tone: 'warm',
                            },
                            {
                                id: 'review',
                                label: 'REVIEW',
                                detail: '4/4 pass',
                                tone: 'green',
                            },
                            {
                                id: 'hold',
                                label: 'HOLD',
                                detail: 'Fix trace',
                                tone: 'critical',
                            },
                        ]}
                        edges={[
                            {
                                from: 'suite',
                                to: 'gate',
                                label: 'grade',
                                tone: 'blue',
                            },
                            {
                                from: 'gate',
                                to: 'review',
                                label: '4/4',
                                tone: 'green',
                            },
                            {
                                from: 'gate',
                                to: 'hold',
                                label: 'fail',
                                tone: 'critical',
                            },
                            {
                                from: 'hold',
                                to: 'suite',
                                dashed: true,
                                label: 'rerun',
                                tone: 'warm',
                            },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
