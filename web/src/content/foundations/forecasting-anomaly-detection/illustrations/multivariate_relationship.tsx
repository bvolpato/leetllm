import React from 'react'
import {
    MetricCard,
    Panel,
    Row,
    ScatterPlot,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 600
export const height = 760
export const alt =
    'Standardized metric pair plot showing healthy observations along x2 = x1 plus Point A at (1, -1) inside both marginal [-1, 1] bands yet off the diagonal with reconstruction error 2.0, and Point B at (5, 5) outside both marginal ranges yet directly on the x2 = x1 diagonal with reconstruction error 0.0.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Marginal [-1, 1] checks vs diagonal x2 = x1"
                tone="blue"
                width={576}
                padding={10}
                gap={6}
            >
                <ScatterPlot
                    c={c}
                    width={552}
                    height={275}
                    xMin={-2}
                    xMax={6}
                    yMin={-2}
                    yMax={6}
                    xAxisLabel="Metric x1"
                    yAxisLabel="Metric x2"
                    formatX={(v) => String(Math.round(v))}
                    formatY={(v) => String(Math.round(v))}
                    showGrid
                    points={[
                        { x: -1, y: -1, color: 'primary', size: 6 },
                        { x: 0, y: 0, label: 'proj (0,0)', color: 'primary', size: 6 },
                        { x: 1, y: 1, color: 'primary', size: 6 },
                        { x: 2, y: 2, color: 'primary', size: 6 },
                        { x: 3, y: 3, color: 'primary', size: 6 },
                        { x: 5, y: 5, label: 'B (5, 5)', color: 'positive', size: 9 },
                        { x: 1, y: -1, label: 'A (1, -1)', color: 'critical', size: 9 },
                    ]}
                />
            </Panel>
            <Row gap={10}>
                <MetricCard
                    c={c}
                    width={283}
                    label="Point A (1, -1)"
                    value="Err = 2.0"
                    detail="In [-1, 1], off x2 = x1"
                    tone="critical"
                />
                <MetricCard
                    c={c}
                    width={283}
                    label="Point B (5, 5)"
                    value="Err = 0.0"
                    detail="Out [-1, 1], on x2 = x1"
                    tone="green"
                />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
