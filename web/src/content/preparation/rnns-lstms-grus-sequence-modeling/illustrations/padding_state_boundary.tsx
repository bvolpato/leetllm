import React from 'react'
import {
    Canvas,
    Column,
    Panel,
    Row,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 760
export const height = 600
export const alt =
    'Top strip shows a three-slot padded sequence with real tokens at t=1 and t=2 (state [0.494, 0.641]) followed by <PAD> at t=3. Bottom left 2D vector plot shows masked execution keeping [0.494, 0.641], a zero pad row pulling state toward origin to [0.302, 0.367], and noise [9, -9, 9] driving state to [1.000, -0.889]. Bottom right bars compare Euclidean state drift: 0.000 masked, 0.335 zero row, and 1.612 noise row.'

const MODES: Array<{
    label: string
    vec: string
    drift: number
    x: number
    y: number
    tone: ToneName
}> = [
    { label: 'Masked', vec: '[0.494, 0.641]', drift: 0.0, x: 0.494, y: 0.641, tone: 'green' },
    { label: 'Zero pad', vec: '[0.302, 0.367]', drift: 0.335, x: 0.302, y: 0.367, tone: 'warm' },
    { label: '[9,-9,9]', vec: '[1.000,-0.889]', drift: 1.612, x: 1.0, y: -0.889, tone: 'red' },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const mapX = (x: number) => 22 + (x / 1.1) * 260
    const mapY = (y: number) => 12 + ((0.8 - y) / 1.8) * 144

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={12} width={740}>
                <Panel
                    title="Right-padded batch row (valid length = 2)"
                    titleFontSize={25}
                    c={c}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <Row gap={10}>
                        {[
                            { txt: 't=1: "slow" (keep)', tone: 'blue' as ToneName },
                            { txt: 't=2: "yet" (keep)', tone: 'green' as ToneName },
                            { txt: 't=3: <PAD> (skip)', tone: 'warm' as ToneName },
                        ].map((slot) => (
                            <div
                                key={slot.txt}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: 230,
                                    padding: '7px 8px',
                                    borderRadius: 8,
                                    border: `1.5px solid ${getReadableToneColor(slot.tone, c)}`,
                                    backgroundColor: getToneFill(slot.tone, c),
                                }}
                            >
                                <TextLabel c={c} fontSize={23} fontWeight={700} text={slot.txt} />
                            </div>
                        ))}
                    </Row>
                    <TextLabel
                        c={c}
                        fontSize={23}
                        mono
                        color={c.textSecondary}
                        text="State after real tokens: h_2 = [0.494, 0.641]"
                    />
                </Panel>
                <Row gap={12} align="stretch">
                    <Panel
                        title="State vectors after t = 3"
                        titleFontSize={25}
                        c={c}
                        width={364}
                        padding={12}
                        gap={8}
                        tone="green"
                    >
                        <svg width={316} height={164} viewBox="0 0 316 164">
                            <line
                                x1={22}
                                y1={mapY(0)}
                                x2={302}
                                y2={mapY(0)}
                                stroke={c.borderSubtle}
                                strokeWidth={1.5}
                            />
                            <line
                                x1={mapX(0)}
                                y1={8}
                                x2={mapX(0)}
                                y2={156}
                                stroke={c.borderSubtle}
                                strokeWidth={1.5}
                            />
                            {MODES.map((m) => {
                                const col = getReadableToneColor(m.tone, c)
                                return (
                                    <g key={m.label}>
                                        <line
                                            x1={mapX(0)}
                                            y1={mapY(0)}
                                            x2={mapX(m.x)}
                                            y2={mapY(m.y)}
                                            stroke={col}
                                            strokeWidth={3}
                                        />
                                        <circle cx={mapX(m.x)} cy={mapY(m.y)} r={5} fill={col} />
                                    </g>
                                )
                            })}
                        </svg>
                        <Column gap={4}>
                            {MODES.map((m) => {
                                const col = getReadableToneColor(m.tone, c)
                                return (
                                    <Row key={m.label} justify="space-between" width={334}>
                                        <TextLabel
                                            c={c}
                                            fontSize={23}
                                            fontWeight={700}
                                            color={col}
                                            text={m.label}
                                        />
                                        <TextLabel
                                            c={c}
                                            fontSize={23}
                                            mono
                                            color={c.textSecondary}
                                            text={m.vec}
                                        />
                                    </Row>
                                )
                            })}
                        </Column>
                    </Panel>
                    <Panel
                        title="State drift ||h_3 - h_2||_2"
                        titleFontSize={25}
                        c={c}
                        width={364}
                        padding={12}
                        gap={14}
                        tone="red"
                    >
                        <TextLabel
                            c={c}
                            fontSize={23}
                            color={c.textSecondary}
                            text="Shift relative to masked state"
                        />
                        <Column gap={16}>
                            {MODES.map((m) => {
                                const col = getReadableToneColor(m.tone, c)
                                const barW = m.drift === 0 ? 5 : Math.round((m.drift / 1.7) * 134)
                                return (
                                    <Row
                                        key={m.label}
                                        gap={6}
                                        align="center"
                                        justify="space-between"
                                    >
                                        <div style={{ display: 'flex', width: 108 }}>
                                            <TextLabel
                                                c={c}
                                                fontSize={23}
                                                fontWeight={600}
                                                text={m.label}
                                            />
                                        </div>
                                        <svg width={140} height={24} viewBox="0 0 140 24">
                                            <rect
                                                x={0}
                                                y={3}
                                                width={134}
                                                height={18}
                                                rx={4}
                                                fill={c.bgSubtle}
                                                stroke={c.borderSubtle}
                                            />
                                            <rect
                                                x={0}
                                                y={3}
                                                width={barW}
                                                height={18}
                                                rx={4}
                                                fill={col}
                                            />
                                        </svg>
                                        <div
                                            style={{
                                                display: 'flex',
                                                width: 72,
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <TextLabel
                                                c={c}
                                                fontSize={23}
                                                mono
                                                fontWeight={700}
                                                color={col}
                                                text={m.drift.toFixed(3)}
                                            />
                                        </div>
                                    </Row>
                                )
                            })}
                        </Column>
                        <TextLabel
                            c={c}
                            fontSize={23}
                            mono
                            color={c.textMuted}
                            text="Zero pad shrinks vector norm"
                        />
                    </Panel>
                </Row>
            </Column>
        </Canvas>
    )
}
