import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getToneColor,
} from 'vizmatic'

export const width = 860
export const height = 520
export const alt =
    'An illustrative, equal-scale two-dimensional cosine plot shows reference directions modular arithmetic [1, 0] and API pagination [0, 1]. Each cosine 0.82 cone has a 34.9 degree half-angle; cyan rays and short arcs mark their edges. Candidate A modular arithmetic [0.99, 0.02] scores 0.9998 against the arithmetic reference and is rejected. B pagination [0.45, 0.40] lies between the two cones, has maximum similarity 0.7474 to the old pool, and is admitted. C pagination [0.46, 0.41] then scores 0.999999 against newly admitted B and is rejected. The plotted coordinates provide a clean geometric visualization.'

const plotDim = 390
const cosineCutoff = 0.82
const coneHalfAngle = Math.acos(cosineCutoff)
const cutoffFromArithmetic = { x: Math.cos(coneHalfAngle), y: Math.sin(coneHalfAngle) }
const cutoffFromPagination = { x: Math.sin(coneHalfAngle), y: Math.cos(coneHalfAngle) }

const plotScale = (plotDim - 64) / 1.16
const plotOrigin = 32 + 0.08 * plotScale
const arcRadius = 32
const boundaryAngle = coneHalfAngle
const docsBoundaryAngle = Math.PI / 2 - coneHalfAngle
const arithmeticArcEnd = {
    x: plotOrigin + arcRadius * Math.cos(boundaryAngle),
    y: plotDim - plotOrigin - arcRadius * Math.sin(boundaryAngle),
}
const paginationArcStart = {
    x: plotOrigin + arcRadius * Math.cos(docsBoundaryAngle),
    y: plotDim - plotOrigin - arcRadius * Math.sin(docsBoundaryAngle),
}
const paginationArcEnd = { x: plotOrigin, y: plotDim - plotOrigin - arcRadius }

function candidateRow(
    c: Parameters<typeof BadgePill>[0]['c'],
    id: 'A' | 'B' | 'C',
    label: string,
    vector: string,
    comparison: string,
    action: 'REJECT' | 'KEEP',
) {
    const tone = action === 'KEEP' ? 'green' : 'critical'
    return (
        <Row gap={8} align="center">
            <BadgePill c={c} text={id} tone={tone} filled fontSize={13} width={28} height={26} />
            <Column gap={2} width={115}>
                <TextLabel c={c} text={label} fontSize={13} fontWeight={700} />
                <TextLabel c={c} text={vector} fontSize={11} color={c.textSecondary} mono />
            </Column>
            <TextLabel c={c} text={comparison} fontSize={12} width={150} color={c.textSecondary} />
            <BadgePill
                c={c}
                text={action}
                tone={tone}
                filled
                fontSize={12}
                width={68}
                height={26}
                padding="0 2px"
            />
        </Row>
    )
}

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="The pool changes the next decision"
        subtitle="Greedy cosine filtering in 2-D embedding space · threshold = 0.82"
        padding={20}
        gap={12}
        contentWidth={820}
    >
        <Row gap={16} align="center">
            <Column gap={6} align="center">
                <AxisPlot
                    c={c}
                    width={plotDim}
                    height={plotDim}
                    xMin={-0.08}
                    xMax={1.08}
                    yMin={-0.08}
                    yMax={1.08}
                    padding={32}
                    showGrid
                    gridCount={3}
                    vectors={[
                        {
                            x1: 0,
                            y1: 0,
                            x2: 1,
                            y2: 0,
                            tone: 'blue',
                            strokeWidth: 3,
                            arrow: true,
                            arrowSize: 6,
                        },
                        {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1,
                            tone: 'purple',
                            strokeWidth: 3,
                            arrow: true,
                            arrowSize: 6,
                        },
                    ]}
                    paths={[
                        {
                            points: [{ x: 0, y: 0 }, cutoffFromArithmetic],
                            tone: 'cyan',
                            strokeWidth: 2,
                            opacity: 0.9,
                        },
                        {
                            points: [{ x: 0, y: 0 }, cutoffFromPagination],
                            tone: 'cyan',
                            strokeWidth: 2,
                            opacity: 0.9,
                        },
                        {
                            points: [
                                { x: 0, y: 0 },
                                { x: 0.99, y: 0.02 },
                            ],
                            tone: 'critical',
                            strokeWidth: 2,
                            opacity: 0.5,
                        },
                        {
                            points: [
                                { x: 0, y: 0 },
                                { x: 0.46, y: 0.41 },
                            ],
                            tone: 'critical',
                            strokeWidth: 2,
                            opacity: 0.5,
                        },
                        {
                            points: [
                                { x: 0, y: 0 },
                                { x: 0.45, y: 0.4 },
                            ],
                            tone: 'green',
                            strokeWidth: 2,
                            opacity: 0.9,
                        },
                    ]}
                    points={[
                        {
                            x: 0.99,
                            y: 0.02,
                            tone: 'critical',
                            r: 6,
                            stroke: c.bgCard,
                            strokeWidth: 1.5,
                        },
                        {
                            x: 0.46,
                            y: 0.41,
                            fill: 'transparent',
                            stroke: c.criticalLight,
                            strokeWidth: 2,
                            r: 8,
                        },
                        { x: 0.45, y: 0.4, tone: 'green', r: 6, stroke: c.bgCard, strokeWidth: 1 },
                    ]}
                >
                    <path
                        d={`M ${plotOrigin + arcRadius} ${plotDim - plotOrigin} A ${arcRadius} ${arcRadius} 0 0 0 ${arithmeticArcEnd.x} ${arithmeticArcEnd.y}`}
                        fill="none"
                        stroke={getToneColor('cyan', c)}
                        strokeWidth={3}
                    />
                    <path
                        d={`M ${paginationArcStart.x} ${paginationArcStart.y} A ${arcRadius} ${arcRadius} 0 0 0 ${paginationArcEnd.x} ${paginationArcEnd.y}`}
                        fill="none"
                        stroke={getToneColor('cyan', c)}
                        strokeWidth={3}
                    />
                </AxisPlot>
                <TextLabel
                    c={c}
                    text="Cosine cutoff angle: arccos(0.82) = 34.9°"
                    fontSize={12}
                    color={c.textSecondary}
                    align="center"
                />
            </Column>

            <Column gap={12} width={410}>
                <Row gap={12} align="center">
                    <BadgePill
                        c={c}
                        text="Arithmetic [1, 0]"
                        tone="blue"
                        filled={false}
                        fontSize={13}
                        height={28}
                    />
                    <BadgePill
                        c={c}
                        text="Pagination [0, 1]"
                        tone="purple"
                        filled={false}
                        fontSize={13}
                        height={28}
                    />
                </Row>

                <Panel
                    c={c}
                    title="Candidates arrive in order"
                    tone="cyan"
                    padding={12}
                    gap={8}
                    titleFontSize={14}
                >
                    <Column gap={8}>
                        {candidateRow(
                            c,
                            'A',
                            'Modular inverse',
                            '[0.99, 0.02]',
                            'cos 0.9998 > 0.82',
                            'REJECT',
                        )}
                        {candidateRow(
                            c,
                            'B',
                            'API pagination',
                            '[0.45, 0.40]',
                            'pool max 0.7474 < 0.82',
                            'KEEP',
                        )}
                        {candidateRow(
                            c,
                            'C',
                            'Pagination dup',
                            '[0.46, 0.41]',
                            'to B 0.999999 > 0.82',
                            'REJECT',
                        )}
                    </Column>
                </Panel>

                <Panel
                    c={c}
                    title="Sequential pool update"
                    tone="neutral"
                    padding={10}
                    gap={4}
                    titleFontSize={13}
                >
                    <TextLabel
                        c={c}
                        text="1. Candidate A matches Arithmetic seed and is rejected."
                        fontSize={12}
                        color={c.textSecondary}
                    />
                    <TextLabel
                        c={c}
                        text="2. Candidate B clears all seeds and enters the pool."
                        fontSize={12}
                        color={c.textSecondary}
                    />
                    <TextLabel
                        c={c}
                        text="3. Candidate C is evaluated against [Seed 1, Seed 2, B] and is rejected by B."
                        fontSize={12}
                        color={c.textSecondary}
                    />
                </Panel>
            </Column>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
