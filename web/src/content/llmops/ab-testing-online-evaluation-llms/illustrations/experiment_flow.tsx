import React from 'react'
import { Column, Flow, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 680
export const alt =
    'Pipeline flows contrasting faulty per-turn re-randomization that mixes prompt context with sticky conversation assignment keeping Prompt B pinned across turns 1 to 3.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.25 })

    return (
        <Scene
            c={c}
            padding={8}
            gap={12}
            contentWidth={740}
            background="transparent"
            density={2.25}
        >
            <Column gap={12} align="center">
                <Panel
                    c={c}
                    title="Faulty Per-Turn Shuffle (Mixed Context)"
                    subtitle="Turn 2 sees B's reply; Turn 3 inherits mixed A+B history"
                    tone="red"
                    padding={8}
                >
                    <Flow
                        c={c}
                        direction="horizontal"
                        gap={8}
                        connectorLength={18}
                        stages={[
                            {
                                title: 'T1: Arm B',
                                subtitle: 'Ctx C0',
                                tone: 'red',
                                width: 190,
                                padding: 6,
                            },
                            {
                                title: 'T2: Arm A',
                                subtitle: 'Sees R1(B)',
                                tone: 'red',
                                width: 190,
                                padding: 6,
                            },
                            {
                                title: 'T3: Arm B',
                                subtitle: 'Mixed A+B',
                                tone: 'red',
                                width: 190,
                                padding: 6,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Sticky Conversation Unit (Valid Attribution)"
                    subtitle="Conversation ID stays pinned to Prompt B on every turn"
                    tone="green"
                    padding={8}
                >
                    <Flow
                        c={c}
                        direction="horizontal"
                        gap={8}
                        connectorLength={18}
                        stages={[
                            {
                                title: 'T1: Arm B',
                                subtitle: 'Ctx C0',
                                tone: 'green',
                                width: 190,
                                padding: 6,
                            },
                            {
                                title: 'T2: Arm B',
                                subtitle: 'C0 + R1',
                                tone: 'green',
                                width: 190,
                                padding: 6,
                            },
                            {
                                title: 'T3: Arm B',
                                subtitle: 'Pure B ctx',
                                tone: 'green',
                                width: 190,
                                padding: 6,
                            },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
