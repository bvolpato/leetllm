import React from 'react'
import { BarChart, Column, GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 740
export const preset = 'engineering'
export const alt =
    'Diagram showing four artifact dependencies hashed together into one immutable release digest above a bar chart of regression drivers across prompt/tool drift, corpus updates, runtime images, and weights.'

const illustration = defineIllustration((c) => {
    const graph = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 575,
                height: 300,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 165,
                nodeHeight: 48,
                nodeGap: 20,
                rankGap: 50,
                nodes: [
                    { id: 'model', label: 'Model Snapshot', tone: 'blue' },
                    { id: 'prompt', label: 'Prompt & Tools', tone: 'purple' },
                    { id: 'corpus', label: 'Corpus & Flags', tone: 'warm' },
                    { id: 'hash', label: 'Canonical JSON -> SHA-256', tone: 'green' },
                    { id: 'rel', label: 'Immutable Release ID', tone: 'green' },
                ],
                edges: [
                    { from: 'model', to: 'hash', tone: 'blue' },
                    { from: 'prompt', to: 'hash', tone: 'purple' },
                    { from: 'corpus', to: 'hash', tone: 'warm' },
                    { from: 'hash', to: 'rel', label: 'verify bytes', tone: 'green' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const chart = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 270,
                title: 'Illustrative Production Regression Sources (%)',
                min: 0,
                max: 50,
                showGrid: true,
                showValues: false,
                format: (v) => `${Math.round(v)}%`,
                data: [
                    { label: 'Prompts', value: 42, color: 'violet' },
                    { label: 'Corpus', value: 28, color: 'warning' },
                    { label: 'Runtime', value: 16, color: 'info' },
                    { label: 'Weights', value: 14, color: 'positive' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    return (
        <Scene
            c={c}
            title="Content-Addressed Release Bundles"
            subtitle="Hashing all runtime dependencies prevents untraceable partial rollbacks"
            padding={16}
            gap={14}
        >
            {graph}
            <Column style={{ paddingLeft: 14 }}>{chart}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
