import React from 'react'
import { Column, GraphDiagram, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const alt =
    'Three aligned handoff paths compare operating modes. Autocomplete turns local context into a suggestion for human acceptance. A live agent receives a brief, works, then returns intermediate edits for steering. A delegated agent receives a scoped task brief, runs it, and hands back a diff and test log for later review.'
export const width = 680
export const height = 790
export function create(theme: ThemeMode = 'dark') {
    const c = {
        ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        shadow: 'transparent',
    }
    const lanes = [
        {
            title: 'Autocomplete · human accepts each edit',
            tone: 'blue' as const,
            nodes: [
                { id: 'context', label: 'Context', detail: 'file + cursor' },
                { id: 'suggest', label: 'Suggest', detail: 'line or edit' },
                { id: 'accept', label: 'Accept', detail: 'human continues' },
            ],
        },
        {
            title: 'Live agent · human steers each turn',
            tone: 'green' as const,
            nodes: [
                { id: 'brief', label: 'Brief', detail: 'workspace + expiry' },
                { id: 'work', label: 'Work', detail: 'route + auth tests' },
                { id: 'steer', label: 'Steer', detail: 'inspect edits' },
            ],
        },
        {
            title: 'Delegated agent · human reviews handoff',
            tone: 'purple' as const,
            nodes: [
                { id: 'task-brief', label: 'Task brief', detail: 'scope + checks' },
                { id: 'run', label: 'Run task', detail: 'local or remote' },
                { id: 'handoff', label: 'Handoff', detail: 'diff + test log' },
            ],
        },
    ]
    return (
        <Scene c={c} background="transparent" padding={28} gap={32} contentWidth={624}>
            <Column gap={44}>
                {lanes.map((lane) => (
                    <Column key={lane.title} gap={16}>
                        <TextLabel c={c} text={lane.title} fontSize={27} fontWeight={600} />
                        <GraphDiagram
                            c={c}
                            width={624}
                            height={150}
                            nodeWidth={178}
                            nodeHeight={118}
                            labelFontSize={27}
                            detailFontSize={22}
                            nodes={lane.nodes.map((node, i) => ({
                                ...node,
                                tone: lane.tone,
                                x: [0.08, 0.5, 0.92][i],
                                y: 0.5,
                            }))}
                            edges={lane.nodes.slice(1).map((node, i) => ({
                                from: lane.nodes[i]!.id,
                                to: node.id,
                                tone: lane.tone,
                            }))}
                        />
                    </Column>
                ))}
            </Column>
        </Scene>
    )
}
export default create('dark')
