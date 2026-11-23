import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'A request timeline shows 2 ms authorization, 18 ms retrieval, and 1 ms packing before 320 ms model startup. The first token arrives at 341 ms, 410 ms of generation ends at 751 ms, and a separate nonblocking trace write ends at 754 ms. The timeline assumes immediate streaming without transport or buffering delay.'

const illustration = defineIllustration((c) => {
    const cyan = getReadableToneColor('cyan', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)

    return (
        <Scene
            c={c}
            title="End-to-End RAG Request Latency Budget"
            subtitle="Dissecting evidence retrieval, model prefill, and streaming token generation"
            padding={20}
            gap={12}
            contentWidth={820}
        >
            <Column gap={12} align="center">
                {/* 1. Milestone Timeline Grid */}
                <Panel
                    c={c}
                    title="Sequential request timeline (0 to 754 ms)"
                    tone="cyan"
                    padding={12}
                    gap={8}
                    titleFontSize={14}
                    width={816}
                >
                    <Column gap={8}>
                        <AxisPlot
                            c={c}
                            width={790}
                            height={80}
                            xMin={0}
                            xMax={800}
                            yMin={0}
                            yMax={1}
                            padding={10}
                            showGrid
                            gridCount={8}
                            showAxes
                            vectors={[
                                { x1: 0, y1: 0.5, x2: 21, y2: 0.5, tone: 'cyan', strokeWidth: 8 },
                                { x1: 21, y1: 0.5, x2: 341, y2: 0.5, tone: 'warm', strokeWidth: 8 },
                                {
                                    x1: 341,
                                    y1: 0.5,
                                    x2: 751,
                                    y2: 0.5,
                                    tone: 'green',
                                    strokeWidth: 8,
                                },
                                {
                                    x1: 751,
                                    y1: 0.5,
                                    x2: 754,
                                    y2: 0.5,
                                    tone: 'neutral',
                                    strokeWidth: 8,
                                },
                            ]}
                            points={[
                                { x: 0, y: 0.5, tone: 'neutral', r: 4 },
                                { x: 21, y: 0.5, tone: 'cyan', r: 4 },
                                { x: 341, y: 0.5, tone: 'warm', r: 5 },
                                { x: 751, y: 0.5, tone: 'green', r: 5 },
                            ]}
                        />
                        <Row gap={12} align="center" justify="space-between">
                            <TextLabel
                                c={c}
                                text="t = 0 ms: Query Arrival"
                                fontSize={11}
                                color={c.textSecondary}
                            />
                            <TextLabel
                                c={c}
                                text="t = 21 ms: Context Ready"
                                fontSize={11}
                                color={cyan}
                            />
                            <TextLabel
                                c={c}
                                text="t = 341 ms: First Token (TTFT)"
                                fontSize={11}
                                color={warm}
                                fontWeight={700}
                            />
                            <TextLabel
                                c={c}
                                text="t = 751 ms: Stream Done"
                                fontSize={11}
                                color={green}
                                fontWeight={700}
                            />
                        </Row>
                    </Column>
                </Panel>

                {/* 2. Phase Breakdown Cards */}
                <Row gap={12} align="start" justify="space-between">
                    <Panel
                        c={c}
                        title="Phase 1: Evidence Prep (21 ms)"
                        tone="cyan"
                        padding={10}
                        gap={6}
                        titleFontSize={13}
                        width={264}
                    >
                        <Column gap={4}>
                            <Row gap={4} align="center" justify="space-between">
                                <TextLabel c={c} text="Caller ACL Check:" fontSize={11} />
                                <BadgePill
                                    c={c}
                                    text="2 ms"
                                    tone="cyan"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <Row gap={4} align="center" justify="space-between">
                                <TextLabel c={c} text="Hybrid Search (BM25+MIPS):" fontSize={11} />
                                <BadgePill
                                    c={c}
                                    text="18 ms"
                                    tone="cyan"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <Row gap={4} align="center" justify="space-between">
                                <TextLabel c={c} text="Parent Expansion & Packing:" fontSize={11} />
                                <BadgePill
                                    c={c}
                                    text="1 ms"
                                    tone="cyan"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="Dominated by vector index latency."
                                fontSize={10}
                                color={c.textSecondary}
                            />
                        </Column>
                    </Panel>

                    <Panel
                        c={c}
                        title="Phase 2: Model Startup / Prefill (320 ms)"
                        tone="warm"
                        padding={10}
                        gap={6}
                        titleFontSize={13}
                        width={264}
                    >
                        <Column gap={4}>
                            <Row gap={4} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Time To First Token (TTFT):"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="341 ms"
                                    tone="warm"
                                    filled
                                    fontSize={11}
                                    height={22}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="Prompt tokenization, KV cache allocation, and initial transformer prefill forward pass."
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>
                    </Panel>

                    <Panel
                        c={c}
                        title="Phase 3: Generation & Trace (413 ms)"
                        tone="green"
                        padding={10}
                        gap={6}
                        titleFontSize={13}
                        width={264}
                    >
                        <Column gap={4}>
                            <Row gap={4} align="center" justify="space-between">
                                <TextLabel c={c} text="Streaming Decode (410 ms):" fontSize={11} />
                                <BadgePill
                                    c={c}
                                    text="40 tok/s"
                                    tone="green"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <Row gap={4} align="center" justify="space-between">
                                <TextLabel c={c} text="Async Audit Trace Write:" fontSize={11} />
                                <BadgePill
                                    c={c}
                                    text="3 ms (nonblocking)"
                                    tone="neutral"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="Egress streaming hides decode tail."
                                fontSize={10}
                                color={c.textSecondary}
                            />
                        </Column>
                    </Panel>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
