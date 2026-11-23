import React from 'react'
import { Column, GraphDiagram, Heatmap, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 780
export const preset = 'engineering'
export const alt =
    'Scoped semantic cache flow diagram from request authentication through L1 exact hash, L2 filtered vector lookup, and L3 fresh inference, paired with a cosine similarity heatmap highlighting why antonym intents like Upgrade and Downgrade cluster closely.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 575,
                height: 315,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 210,
                nodeHeight: 50,
                nodeGap: 36,
                rankGap: 58,
                nodes: [
                    { id: 'auth', label: '1. Auth & Scope Check', tone: 'blue' },
                    { id: 'l1', label: '2. L1 Exact + L2 ANN', tone: 'purple' },
                    { id: 'hit', label: 'Stored Hit · $0 Gen', tone: 'green' },
                    { id: 'gen', label: 'L3 Prefix + LLM Gen', tone: 'warm' },
                ],
                edges: [
                    { from: 'auth', to: 'l1', label: 'eligible', tone: 'blue' },
                    { from: 'auth', to: 'gen', label: 'live/write', tone: 'warm' },
                    { from: 'l1', to: 'hit', label: 'cos >= tau', tone: 'green' },
                    { from: 'l1', to: 'gen', label: 'miss', tone: 'warm' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const simMatrix = preparePrintTypography(
        prepareArticleFigure(
            Heatmap({
                c,
                title: 'TF-IDF N-Gram Cosine Matrix (Antonyms Exceed Paraphrases)',
                xLabels: ['Retain', 'Audit', 'Restor', 'Upgrd', 'Downgr'],
                yLabels: ['Retain', 'Audit', 'Restor', 'Upgrd', 'Downgr'],
                data: [
                    [1.0, 0.72, 0.28, 0.04, 0.04],
                    [0.72, 1.0, 0.21, 0.04, 0.04],
                    [0.28, 0.21, 1.0, 0.03, 0.03],
                    [0.04, 0.04, 0.03, 1.0, 0.79],
                    [0.04, 0.04, 0.03, 0.79, 1.0],
                ],
                cellWidth: 82,
                cellHeight: 40,
                rowLabelWidth: 96,
                colorScale: 'strength',
                fontSize: 19,
                highlightCell: { row: 3, col: 4 },
            }),
            false,
            false,
        ),
        19,
    )

    return (
        <Scene
            c={c}
            title="Scoped Cache Tiers and Similarity Traps"
            subtitle="Eligibility and intent gates run before cosine scoring because surface similarity merges antonyms"
            padding={16}
            gap={14}
        >
            {flow}
            <Column style={{ paddingLeft: 10 }}>{simMatrix}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
