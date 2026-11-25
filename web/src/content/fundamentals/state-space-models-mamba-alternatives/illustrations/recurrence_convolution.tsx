import React from 'react'
import { BarChart, Column, Matrix, Panel, Scene, defineIllustration } from 'vizmatic'

export const width = 720
export const height = 740

export const alt =
    'Unrolled lower-triangular causal convolution matrix K for A-bar = 0.9 and B-bar = 0.2 multiplied by x = [3, 1, 4, 2] producing outputs [0.600, 0.740, 1.466, 1.719] identical to the recurrence.'

const x = [3, 1, 4, 2]
const kMatrix = [0, 1, 2, 3].map((row) =>
    [0, 1, 2, 3].map((col) => (col <= row ? 0.2 * 0.9 ** (row - col) : 0)),
)
const yOut = kMatrix.map((row) => row.reduce((sum, w, col) => sum + w * x[col], 0))

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.0} padding={10} gap={10} background="transparent">
        <Column gap={10} align="stretch">
            <Panel
                c={c}
                title="Causal kernel matrix K"
                subtitle="Entry (t, s) = 0.2 * 0.9^(t-s); upper triangle zeroed"
                padding={10}
                gap={6}
            >
                <Matrix
                    c={c}
                    data={kMatrix}
                    labels={kMatrix.map((row, r) =>
                        row.map((val, col) =>
                            col > r
                                ? '0'
                                : val.toFixed(col === r ? 2 : col === 0 && r === 3 ? 4 : 3),
                        ),
                    )}
                    rowLabels={['t=1', 't=2', 't=3', 't=4']}
                    colLabels={['x1=3', 'x2=1', 'x3=4', 'x4=2']}
                    rowLabelWidth={82}
                    cellWidth={130}
                    cellHeight={42}
                    fontSize={23}
                    colorize={true}
                    colorScale="strength"
                    colorDomain={[0, 0.22]}
                />
            </Panel>

            <Panel c={c} title="Parallel matrix product y = K x" padding={10} gap={4}>
                <BarChart
                    c={c}
                    width={680}
                    height={255}
                    min={0}
                    max={1.8}
                    format="decimal"
                    data={yOut.map((v, idx) => ({
                        label: `y${idx + 1}`,
                        value: v,
                        valueLabel: v.toFixed(3),
                        color: c.positive,
                    }))}
                />
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
