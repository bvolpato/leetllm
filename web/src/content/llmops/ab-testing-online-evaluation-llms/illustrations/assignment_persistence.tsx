import React from 'react'
import { BarChart, Column, Flow, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 740
export const alt =
    'Sticky assignment flow from SHA-256 conversation hashing into an insert-if-absent store, paired with a bar chart showing bucket 0.1679 stays pinned to A after a 10% to 50% ramp.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.25 })

    return (
        <Scene
            c={c}
            padding={8}
            gap={10}
            contentWidth={740}
            background="transparent"
            density={2.25}
        >
            <Column gap={10} align="center">
                <Panel
                    c={c}
                    title="Sticky Assignment & Insert-If-Absent Store"
                    subtitle="First-seen arm locks before later traffic ramps"
                    tone="blue"
                    padding={8}
                >
                    <Flow
                        c={c}
                        direction="horizontal"
                        gap={6}
                        connectorLength={14}
                        stages={[
                            {
                                title: 'Hash Key',
                                subtitle: 'u = 0.1679',
                                tone: 'purple',
                                width: 205,
                                padding: 8,
                            },
                            {
                                title: '10% Enroll',
                                subtitle: 'Store sets A',
                                tone: 'blue',
                                width: 205,
                                padding: 8,
                            },
                            {
                                title: '50% Ramp',
                                subtitle: 'Reads A (pin)',
                                tone: 'green',
                                width: 205,
                                padding: 8,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Hash Bucket Position vs Ramp Cutoffs"
                    subtitle="Unpinned hashing would flip bucket 16.8% past cutoff"
                    tone="warm"
                    padding={8}
                >
                    <BarChart
                        c={c}
                        ariaLabel="Bucket position 16.8% versus 10% initial and 50% ramped cutoffs"
                        width={650}
                        height={175}
                        min={0}
                        max={60}
                        showGrid
                        showValues
                        format={(v) => `${v.toFixed(0)}%`}
                        data={[
                            {
                                label: 'Initial 10% Cutoff',
                                value: 10.0,
                                valueLabel: '10.0%',
                                color: c.neutralLight,
                            },
                            {
                                label: 'thread-7 Bucket',
                                value: 16.8,
                                valueLabel: '16.8%',
                                color: c.primary,
                            },
                            {
                                label: '50% Ramp Cutoff',
                                value: 50.0,
                                valueLabel: '50.0%',
                                color: c.warning,
                            },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
