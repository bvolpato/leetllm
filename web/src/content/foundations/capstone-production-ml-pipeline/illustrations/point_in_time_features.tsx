import React from 'react'
import { AxisPlot, BarChart, Column, Panel, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 780
export const autoSize = false
export const alt =
    'Top: telemetry event timing relative to predict_at cutoff separating valid scans from delayed ETL and post-dispatch leakage. Bottom: ROC-AUC drops from a leaky 1.000 to an honest 0.823 with HistGradientBoosting versus 0.719 for LogisticRegression.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    return (
        <Scene c={c} padding={12} gap={12} contentWidth={616}>
            <Column gap={12} width={616}>
                <Panel
                    title="Cutoff at predict_at = 0h"
                    c={c}
                    tone="blue"
                    width={616}
                    padding={10}
                    footer="Green: valid | Amber: late ETL | Red: post-cutoff leak"
                >
                    <AxisPlot
                        c={c}
                        width={590}
                        height={190}
                        xMin={-4}
                        xMax={5}
                        yMin={0}
                        yMax={4}
                        showAxes
                        showGrid={false}
                        ariaLabel="Valid scans finish ETL before predict_at=0 whereas post-dispatch scans fall beyond 0h"
                        points={[
                            { x: -2.4, y: 3.0, tone: 'green', r: 7 },
                            { x: -1.7, y: 3.0, tone: 'green', r: 7 },
                            { x: -0.9, y: 2.0, tone: 'warm', r: 7 },
                            { x: 1.0, y: 2.0, tone: 'warm', r: 7 },
                            { x: 3.2, y: 1.0, tone: 'critical', r: 7 },
                        ]}
                        vectors={[
                            {
                                x1: -2.4,
                                y1: 3.0,
                                x2: -1.7,
                                y2: 3.0,
                                tone: 'green',
                                arrow: true,
                                arrowSize: 6,
                            },
                            {
                                x1: -0.9,
                                y1: 2.0,
                                x2: 1.0,
                                y2: 2.0,
                                tone: 'warm',
                                arrow: true,
                                arrowSize: 6,
                            },
                        ]}
                        paths={[
                            {
                                points: [
                                    { x: 0, y: 0 },
                                    { x: 0, y: 4 },
                                ],
                                tone: 'blue',
                                dashed: true,
                                strokeWidth: 2,
                            },
                        ]}
                    />
                </Panel>
                <BarChart
                    c={c}
                    width={616}
                    height={190}
                    title="Validation ROC-AUC: Leaky vs Point-in-Time"
                    min={0}
                    max={1.12}
                    format="decimal"
                    showValues
                    showGrid={false}
                    ariaLabel="ROC-AUC compares 1.000 leaky join against 0.719 PIT LogisticRegression and 0.823 PIT HistGradientBoosting"
                    data={[
                        { label: 'Leaky Join', value: 1.0, color: 'critical' },
                        { label: 'PIT LR', value: 0.719, color: 'warning' },
                        { label: 'PIT HGB', value: 0.823, color: 'positive' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
