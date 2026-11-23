import React from 'react'
import { Column, GraphDiagram, Panel, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 740
export const alt =
    'Sequential SWE-bench grading pipeline. Applying the candidate patch and test patch either fails with score 0 or advances to the FAIL_TO_PASS gate. Any failed fix test scores 0 (issue unfixed); passing all advances to the PASS_TO_PASS gate. Any failed regression test scores 0; maintaining all reaches score 1, Resolved.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.0)

    return (
        <Scene c={c} padding={10} gap={10}>
            <Column gap={10} align="stretch">
                <Panel
                    c={c}
                    title="SWE-bench Harness Grading Pipeline"
                    width={640}
                    padding={8}
                    tone="blue"
                >
                    <GraphDiagram
                        c={c}
                        width={616}
                        height={640}
                        layout="manual"
                        routing="straight"
                        padding={8}
                        nodeWidth={232}
                        nodeHeight={74}
                        labelFontSize={21}
                        detailFontSize={20}
                        arrowSize={5}
                        nodes={[
                            {
                                id: 'apply',
                                label: 'Apply patches',
                                detail: 'fix + test diff',
                                x: 0.19,
                                y: 0.1,
                                tone: 'blue',
                            },
                            {
                                id: 'fail_apply',
                                label: '0 · Apply error',
                                detail: 'diff or setup',
                                x: 0.81,
                                y: 0.1,
                                tone: 'critical',
                            },
                            {
                                id: 'f2p',
                                label: 'F2P gate',
                                detail: 'fix tests',
                                x: 0.19,
                                y: 0.37,
                                tone: 'warm',
                            },
                            {
                                id: 'fail_f2p',
                                label: '0 · Unfixed',
                                detail: 'fix test fails',
                                x: 0.81,
                                y: 0.37,
                                tone: 'critical',
                            },
                            {
                                id: 'p2p',
                                label: 'P2P gate',
                                detail: 'regression tests',
                                x: 0.19,
                                y: 0.64,
                                tone: 'warm',
                            },
                            {
                                id: 'fail_p2p',
                                label: '0 · Regression',
                                detail: 'test breaks',
                                x: 0.81,
                                y: 0.64,
                                tone: 'critical',
                            },
                            {
                                id: 'resolved',
                                label: '1 · Resolved',
                                detail: 'both gates pass',
                                x: 0.19,
                                y: 0.91,
                                tone: 'green',
                            },
                        ]}
                        edges={[
                            {
                                from: 'apply',
                                to: 'fail_apply',
                                fromSide: 'right',
                                toSide: 'left',
                                label: 'error',
                                tone: 'critical',
                            },
                            {
                                from: 'apply',
                                to: 'f2p',
                                fromSide: 'bottom',
                                toSide: 'top',
                                label: 'ok',
                                tone: 'green',
                            },
                            {
                                from: 'f2p',
                                to: 'fail_f2p',
                                fromSide: 'right',
                                toSide: 'left',
                                label: 'any fail',
                                tone: 'critical',
                            },
                            {
                                from: 'f2p',
                                to: 'p2p',
                                fromSide: 'bottom',
                                toSide: 'top',
                                label: 'all pass',
                                tone: 'green',
                            },
                            {
                                from: 'p2p',
                                to: 'fail_p2p',
                                fromSide: 'right',
                                toSide: 'left',
                                label: 'any fail',
                                tone: 'critical',
                            },
                            {
                                from: 'p2p',
                                to: 'resolved',
                                fromSide: 'bottom',
                                toSide: 'top',
                                label: 'pass',
                                tone: 'green',
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
