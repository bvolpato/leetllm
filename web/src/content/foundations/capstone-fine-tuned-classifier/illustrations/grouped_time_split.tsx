import React from 'react'
import {
    BarChart,
    Column,
    Panel,
    Row,
    Scene,
    TiledMatrix,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 640
export const height = 720
export const autoSize = false
export const alt =
    'Comparison between naive random row splitting with leaking organizations and grouped chronological splitting with disjoint tenants across Months 1-4.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.05)
    return (
        <Scene c={c} padding={12} gap={12} contentWidth={616}>
            <Row gap={12} align="stretch" width={616}>
                <Panel title="Random Split (Leaky)" c={c} tone="critical" width={302} padding={12}>
                    <TiledMatrix
                        c={c}
                        rows={3}
                        cols={8}
                        cellSize={20}
                        gap={4}
                        ariaLabel="Mixed tenant assignments across folds in naive random splitting"
                        regions={[
                            { rowStart: 0, rowEnd: 3, colStart: 0, colEnd: 3, tone: 'blue' },
                            {
                                rowStart: 0,
                                rowEnd: 3,
                                colStart: 3,
                                colEnd: 5,
                                tone: 'purple',
                            },
                            { rowStart: 0, rowEnd: 3, colStart: 5, colEnd: 6, tone: 'blue' },
                            { rowStart: 0, rowEnd: 3, colStart: 6, colEnd: 8, tone: 'green' },
                        ]}
                    />
                </Panel>
                <Panel title="Grouped Time Split" c={c} tone="green" width={302} padding={12}>
                    <TiledMatrix
                        c={c}
                        rows={3}
                        cols={8}
                        cellSize={20}
                        gap={4}
                        ariaLabel="Disjoint workspaces separated into train months 1-2, val month 3, and test month 4"
                        regions={[
                            { rowStart: 0, rowEnd: 3, colStart: 0, colEnd: 4, tone: 'blue' },
                            {
                                rowStart: 0,
                                rowEnd: 3,
                                colStart: 4,
                                colEnd: 6,
                                tone: 'purple',
                            },
                            { rowStart: 0, rowEnd: 3, colStart: 6, colEnd: 8, tone: 'green' },
                        ]}
                    />
                </Panel>
            </Row>
            <Column width={616}>
                <BarChart
                    c={c}
                    width={616}
                    height={220}
                    title="TF-IDF Accuracy Drops Once Tenant Leak Closes"
                    min={0}
                    max={1.08}
                    format="percent"
                    showValues
                    showGrid={false}
                    ariaLabel={alt}
                    data={[
                        { label: 'Random (Leaky)', value: 0.824, color: 'critical' },
                        { label: 'Grouped M3', value: 0.75, color: 'primary' },
                        { label: 'Grouped M4', value: 0.688, color: 'positive' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
