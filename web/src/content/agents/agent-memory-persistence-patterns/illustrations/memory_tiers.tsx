import React from 'react'
import {
    BadgePill,
    BarChart,
    Row,
    ScatterPlot,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
} from 'vizmatic'

export const width = 880
export const height = 450
export const alt =
    'Memory hierarchy comparing four agent storage tiers across capacity, access latency, and durability. Procedural rules sit at small KB scale with near-instant 1 ms pinned access. Working context holds prompt tokens (~256 KB) at ~5 ms latency but is volatile per call. Episodic logs hold tens of MB of session traces at ~22 ms. Semantic vector stores hold GB-scale durable facts at ~50 ms and require ACL and TTL filtering before recall.'

const CAPACITY_TICKS: Record<number, string> = {
    0: '1 KB',
    3: '1 MB',
    6: '1 GB',
    9: '1 TB',
}

const illustration = defineIllustration((c) => {
    const cProc = getToneColor('purple', c)
    const cWork = getToneColor('blue', c)
    const cEpis = getToneColor('cyan', c)
    const cSem = getToneColor('green', c)

    return (
        <Scene
            c={c}
            title="Agent Memory Hierarchy: Capacity, Latency, and Durability"
            padding={18}
            gap={14}
            contentWidth={844}
        >
            <Row gap={16} align="stretch">
                <ScatterPlot
                    c={c}
                    width={508}
                    height={340}
                    title="Capacity vs. Access Latency"
                    subtitle="Log capacity scale vs. typical read latency (ms)"
                    xAxisLabel="Storage capacity (log scale)"
                    yAxisLabel="Read latency (ms)"
                    xMin={0}
                    xMax={9}
                    yMin={0}
                    yMax={60}
                    formatX={(v) => CAPACITY_TICKS[Math.round(v)] ?? ''}
                    formatY={(v) => `${Math.round(v)}ms`}
                    showGrid
                    points={[
                        {
                            x: 0.9,
                            y: 2,
                            label: 'Procedural (KB)',
                            color: cProc,
                            size: 8,
                        },
                        {
                            x: 2.8,
                            y: 9,
                            label: 'Working (tokens)',
                            color: cWork,
                            size: 8,
                        },
                        {
                            x: 5.0,
                            y: 23,
                            label: 'Episodic (MB)',
                            color: cEpis,
                            size: 8,
                        },
                        {
                            x: 7.4,
                            y: 50,
                            label: 'Semantic (GB)',
                            color: cSem,
                            size: 8,
                        },
                    ]}
                />

                <BarChart
                    c={c}
                    width={320}
                    height={340}
                    title="Durability Horizon"
                    subtitle="Persistence tier across sessions"
                    yAxisLabel="Retention scale"
                    min={0}
                    max={4.5}
                    format={(v) => {
                        if (v <= 0.1) return '1 call'
                        if (v < 2) return '1 day'
                        if (v < 3.5) return '1 mo'
                        return '1+ yr'
                    }}
                    showGrid
                    showValues
                    data={[
                        {
                            label: 'Working',
                            value: 0.18,
                            valueLabel: 'Volatile',
                            color: cWork,
                        },
                        {
                            label: 'Episodic',
                            value: 1.5,
                            valueLabel: 'Session',
                            color: cEpis,
                        },
                        {
                            label: 'Semantic',
                            value: 3.9,
                            valueLabel: 'Durable',
                            color: cSem,
                        },
                        {
                            label: 'Procedural',
                            value: 4.2,
                            valueLabel: 'Pinned',
                            color: cProc,
                        },
                    ]}
                />
            </Row>

            <Row gap={12} justify="space-between" align="center" width={844}>
                <Row gap={8} align="center">
                    <BadgePill c={c} text="Working + KV Cache" tone="blue" fontSize={12} />
                    <TextLabel
                        c={c}
                        text="Prefix tensor reuse only; volatile"
                        fontSize={12}
                        color={c.textSecondary}
                    />
                </Row>
                <Row gap={8} align="center">
                    <BadgePill c={c} text="External Recall" tone="green" fontSize={12} />
                    <TextLabel
                        c={c}
                        text="Filtered by ACL, version, and TTL"
                        fontSize={12}
                        color={getReadableToneColor('green', c)}
                    />
                </Row>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
