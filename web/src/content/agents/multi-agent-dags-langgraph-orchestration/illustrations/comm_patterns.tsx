import React from 'react'
import {
    BadgePill,
    GraphDiagram,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 920
export const height = 470
export const alt =
    'Three multi-agent network topologies compared side by side. Left: Deterministic DAG fans out from Intake to parallel Diff, Test, and Scan nodes before joining at Merge. Center: Hub-and-Spoke Supervisor retains turn control and calls Diff, Test, and Scan specialists bidirectionally as tools. Right: Peer Handoff Swarm transfers turn ownership across Triage, Code, and DB Specialist nodes before finishing, with the host rebuilding tool permissions at each handoff.'

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="Multi-Agent Coordination Topologies"
        padding={16}
        gap={12}
        contentWidth={888}
    >
        <Row gap={12} align="stretch">
            <Panel
                c={c}
                title="1. Deterministic DAG"
                subtitle="Fixed fan-out / fan-in"
                tone="blue"
                width={288}
                padding={10}
                gap={8}
                titleFontSize={15}
            >
                <GraphDiagram
                    c={c}
                    layout="manual"
                    width={264}
                    height={272}
                    nodeWidth={66}
                    nodeHeight={34}
                    labelFontSize={12}
                    arrowSize={5}
                    padding={8}
                    nodes={[
                        { id: 'intake', label: 'Intake', x: 0.5, y: 0.12, tone: 'blue', width: 78 },
                        { id: 'diff', label: 'Diff', x: 0.14, y: 0.5, tone: 'cyan' },
                        { id: 'test', label: 'Test', x: 0.5, y: 0.5, tone: 'cyan' },
                        { id: 'scan', label: 'Scan', x: 0.86, y: 0.5, tone: 'cyan' },
                        { id: 'merge', label: 'Merge', x: 0.5, y: 0.88, tone: 'green', width: 78 },
                    ]}
                    edges={[
                        { from: 'intake', to: 'diff', tone: 'blue' },
                        { from: 'intake', to: 'test', tone: 'blue' },
                        { from: 'intake', to: 'scan', tone: 'blue' },
                        { from: 'diff', to: 'merge', tone: 'green' },
                        { from: 'test', to: 'merge', tone: 'green' },
                        { from: 'scan', to: 'merge', tone: 'green' },
                    ]}
                />
                <Row justify="center">
                    <BadgePill c={c} text="Control: Graph edges" tone="blue" fontSize={11} />
                </Row>
            </Panel>

            <Panel
                c={c}
                title="2. Hub-and-Spoke Supervisor"
                subtitle="Manager invokes tools"
                tone="purple"
                width={288}
                padding={10}
                gap={8}
                titleFontSize={15}
            >
                <GraphDiagram
                    c={c}
                    layout="manual"
                    width={264}
                    height={272}
                    nodeWidth={74}
                    nodeHeight={34}
                    labelFontSize={12}
                    arrowSize={5}
                    padding={8}
                    nodes={[
                        { id: 'sup', label: 'Supervisor', x: 0.5, y: 0.2, tone: 'purple', width: 96 },
                        { id: 't1', label: 'Diff', x: 0.16, y: 0.78, tone: 'blue' },
                        { id: 't2', label: 'Test', x: 0.5, y: 0.86, tone: 'blue' },
                        { id: 't3', label: 'Scan', x: 0.84, y: 0.78, tone: 'blue' },
                    ]}
                    edges={[
                        { from: 'sup', to: 't1', tone: 'purple', arrow: 'both' },
                        { from: 'sup', to: 't2', tone: 'purple', arrow: 'both' },
                        { from: 'sup', to: 't3', tone: 'purple', arrow: 'both' },
                    ]}
                />
                <Row justify="center">
                    <BadgePill c={c} text="Control: Central LLM loop" tone="purple" fontSize={11} />
                </Row>
            </Panel>

            <Panel
                c={c}
                title="3. Peer Handoff Swarm"
                subtitle="Transfers turn + ACL scope"
                tone="cyan"
                width={288}
                padding={10}
                gap={8}
                titleFontSize={15}
            >
                <GraphDiagram
                    c={c}
                    layout="manual"
                    width={264}
                    height={272}
                    nodeWidth={76}
                    nodeHeight={34}
                    labelFontSize={12}
                    arrowSize={5}
                    padding={8}
                    nodes={[
                        { id: 'triage', label: 'Triage', x: 0.5, y: 0.13, tone: 'cyan' },
                        { id: 'code', label: 'Code', x: 0.2, y: 0.54, tone: 'blue' },
                        { id: 'db', label: 'DB Spec', x: 0.8, y: 0.54, tone: 'warm' },
                        { id: 'done', label: 'Done', x: 0.5, y: 0.89, tone: 'green' },
                    ]}
                    edges={[
                        { from: 'triage', to: 'code', tone: 'cyan' },
                        { from: 'code', to: 'db', tone: 'warm', label: 'handoff' },
                        { from: 'triage', to: 'db', dashed: true, muted: true },
                        { from: 'db', to: 'done', tone: 'green' },
                        { from: 'code', to: 'done', dashed: true, muted: true },
                    ]}
                />
                <Row justify="center">
                    <BadgePill c={c} text="Control: Active peer" tone="cyan" fontSize={11} />
                </Row>
            </Panel>
        </Row>

        <Row gap={18} justify="center" align="center" width={888}>
            <Row gap={6} align="center">
                <BadgePill c={c} text="MCP" tone="blue" fontSize={11} />
                <TextLabel
                    c={c}
                    text="Host to tool servers"
                    fontSize={12}
                    color={getReadableToneColor('blue', c)}
                />
            </Row>
            <Row gap={6} align="center">
                <BadgePill c={c} text="A2A" tone="green" fontSize={11} />
                <TextLabel
                    c={c}
                    text="Cross-runtime remote agent tasks"
                    fontSize={12}
                    color={getReadableToneColor('green', c)}
                />
            </Row>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
