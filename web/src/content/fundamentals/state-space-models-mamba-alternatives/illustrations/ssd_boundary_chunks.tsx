import React from 'react'
import { Column, GraphDiagram, Panel, Row, Scene, TiledMatrix, defineIllustration } from 'vizmatic'

export const width = 780
export const height = 740

export const alt =
    'Structured state space duality chunk grid and execution dataflow: 16,384 tokens fill 64 chunks of 256 while 16,385 tokens create a 65th trailing chunk; each chunk computes fast local matmul outputs in parallel and combines them with scanned incoming prefix states.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.3} padding={10} gap={8} background="transparent">
        <Column gap={8} align="stretch">
            <Row gap={10} align="stretch">
                <Panel
                    c={c}
                    title="16,384 tok: 64 chunks"
                    subtitle="Exact B=256 tiling"
                    width={375}
                    padding={8}
                    gap={6}
                >
                    <TiledMatrix
                        c={c}
                        rows={4}
                        cols={16}
                        cellSize={14}
                        gap={4}
                        tone="green"
                        ariaLabel="64 full chunks of 256 tokens"
                        regions={[
                            {
                                rowStart: 0,
                                rowEnd: 4,
                                colStart: 0,
                                colEnd: 16,
                                tone: 'green',
                            },
                        ]}
                    />
                </Panel>

                <Panel
                    c={c}
                    title="16,385 tok: +1 spills"
                    subtitle="65th chunk: 1 tok + 255 pad"
                    width={375}
                    padding={8}
                    gap={6}
                >
                    <TiledMatrix
                        c={c}
                        rows={5}
                        cols={16}
                        cellSize={13}
                        gap={4}
                        tone="neutral"
                        ariaLabel="64 full chunks plus 1 partial trailing chunk"
                        regions={[
                            { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 16, tone: 'blue' },
                            { rowStart: 4, rowEnd: 5, colStart: 0, colEnd: 1, tone: 'warm' },
                        ]}
                    />
                </Panel>
            </Row>

            <Panel
                c={c}
                title="SSD intra-chunk matmul + inter-chunk scan"
                subtitle="Parallel local diagonal combines with scanned chunk states"
                padding={8}
                gap={4}
            >
                <GraphDiagram
                    c={c}
                    density={1}
                    direction="LR"
                    routing="dagre"
                    width={720}
                    height={210}
                    padding={8}
                    nodeGap={16}
                    rankGap={30}
                    labelFontSize={23}
                    detailFontSize={23}
                    arrowSize={6}
                    nodes={[
                        {
                            id: 'chunks',
                            label: 'Chunks C',
                            detail: 'B=256 slices',
                            tone: 'blue',
                        },
                        {
                            id: 'local',
                            label: 'Local matmul',
                            detail: 'Y_diag chunk',
                            tone: 'green',
                        },
                        {
                            id: 'ends',
                            label: 'End states',
                            detail: 'Scan h0..hk',
                            tone: 'warm',
                        },
                        {
                            id: 'combine',
                            label: 'Final Y',
                            detail: 'Y_diag + C*h',
                            tone: 'purple',
                        },
                    ]}
                    edges={[
                        { from: 'chunks', to: 'local', tone: 'green' },
                        { from: 'chunks', to: 'ends', tone: 'warm' },
                        { from: 'local', to: 'combine', tone: 'green' },
                        { from: 'ends', to: 'combine', tone: 'warm' },
                    ]}
                />
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
