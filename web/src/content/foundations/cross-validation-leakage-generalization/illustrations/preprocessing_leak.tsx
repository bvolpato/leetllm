import React from 'react'
import {
    BarChart,
    DataTable,
    MetricCard,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 600
export const height = 760
export const alt =
    'Eight literal T, L, and y rows feed two feature selectors. Scanning all eight rows changes the class-mean gaps to T 0.50 and L 0.75, selecting L. Scanning only the four training rows gives T 1.00 and L 0.50, selecting T. Both nearest-mean classifiers fit on the four training rows and score 4 of 4 (leaky) versus 2 of 4 (honest) on the four validation rows.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Eight rows: train (tr1-tr4) vs val (va1-va4)"
                tone="blue"
                width={576}
                padding={10}
                gap={8}
            >
                <Row gap={10}>
                    <DataTable
                        c={c}
                        width={271}
                        headerRows={1}
                        headerCols={1}
                        align={['left', 'center', 'center', 'center']}
                        rows={[
                            ['Train', 'T', 'L', 'y'],
                            ['tr1', '1', '1', '1'],
                            ['tr2', '1', '0', '1'],
                            ['tr3', '0', '0', '0'],
                            ['tr4', '0', '0', '0'],
                        ]}
                    />
                    <DataTable
                        c={c}
                        width={271}
                        headerRows={1}
                        headerCols={1}
                        align={['left', 'center', 'center', 'center']}
                        rows={[
                            ['Val', 'T', 'L', 'y'],
                            ['va1', '1', '1', '1'],
                            ['va2', '1', '0', '0'],
                            ['va3', '0', '1', '1'],
                            ['va4', '0', '0', '0'],
                        ]}
                    />
                </Row>
            </Panel>
            <Panel
                c={c}
                title="2. Class-mean separation |mu_1 - mu_0|"
                tone="purple"
                width={576}
                padding={10}
                gap={8}
            >
                <BarChart
                    c={c}
                    width={552}
                    height={135}
                    min={0}
                    format={(v) => v.toFixed(1)}
                    showValues
                    data={[
                        { label: 'All T', value: 0.5, color: 'secondary', valueLabel: '0.50' },
                        { label: 'All L', value: 0.75, color: 'critical', valueLabel: '0.75' },
                        { label: 'Train T', value: 1.0, color: 'positive', valueLabel: '1.00' },
                        { label: 'Train L', value: 0.5, color: 'secondary', valueLabel: '0.50' },
                    ]}
                />
                <Row gap={10}>
                    <MetricCard
                        c={c}
                        width={271}
                        label="Leaky (all 8 rows, L)"
                        value="4 / 4"
                        detail="val labels leaked"
                        tone="critical"
                    />
                    <MetricCard
                        c={c}
                        width={271}
                        label="Honest (train only, T)"
                        value="2 / 4"
                        detail="no val leakage"
                        tone="green"
                    />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
