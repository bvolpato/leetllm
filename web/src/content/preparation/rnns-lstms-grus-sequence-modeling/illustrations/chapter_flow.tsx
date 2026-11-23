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

export const width = 740
export const height = 540
export const alt =
    'Left column outlines four steps in the sequence modeling guide: shared-weight recurrence, skipping padding slots, additive LSTM and coupled GRU gates, and direct attention paths. Right chart plots exponential backward decay over 12 steps: an LSTM gate of 0.98 keeps 0.785, a 0.60 factor drops to 0.002, and a 0.28 factor vanishes near zero.'

const STEPS: Array<{ title: string; eq: string; tone: ToneName }> = [
    { title: '1. Unrolled recurrence', eq: 'h_t = tanh(W_x x_t + W_h h_{t-1})', tone: 'blue' },
    { title: '2. Valid-length mask', eq: 'Skip <PAD> updates cleanly', tone: 'warm' },
    { title: '3. Gated cell tracks', eq: 'Additive c_t and unified z_t', tone: 'cyan' },
    { title: '4. Direct attention', eq: 'Length-1 path across tokens', tone: 'purple' },
]

const SERIES = [
    { name: '0.98^k', tone: 'green' as ToneName, pts: [1.0, 0.98, 0.922, 0.851, 0.785] },
    { name: '0.60^k', tone: 'warm' as ToneName, pts: [1.0, 0.6, 0.13, 0.017, 0.002] },
    { name: '0.28^k', tone: 'red' as ToneName, pts: [1.0, 0.28, 0.006, 0.0, 0.0] },
]
const XS = [26, 82, 138, 194, 250]
const TICKS = ['k=0', '1', '4', '8', '12']

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const py = (v: number) => 14 + (1 - v) * 196
    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Row gap={12} align="stretch" width={720}>
                <Panel
                    title="Four architectural shifts"
                    titleFontSize={25}
                    c={c}
                    width={352}
                    padding={10}
                    gap={8}
                    tone="blue"
                >
                    <Column gap={8}>
                        {STEPS.map((s) => (
                            <div
                                key={s.title}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    padding: '7px 10px',
                                    borderRadius: 8,
                                    border: `1.5px solid ${getReadableToneColor(s.tone, c)}`,
                                    backgroundColor: getToneFill(s.tone, c),
                                }}
                            >
                                <TextLabel c={c} fontSize={23} fontWeight={700} text={s.title} />
                                <TextLabel
                                    c={c}
                                    fontSize={22}
                                    mono
                                    color={c.textSecondary}
                                    text={s.eq}
                                />
                            </div>
                        ))}
                    </Column>
                </Panel>
                <Panel
                    title="Path factor gamma^k"
                    titleFontSize={25}
                    c={c}
                    width={356}
                    padding={10}
                    gap={6}
                    tone="cyan"
                >
                    <TextLabel
                        c={c}
                        fontSize={22}
                        color={c.textSecondary}
                        text="Product over k backward steps"
                    />
                    <Row gap={12} wrap>
                        {SERIES.map((s) => (
                            <Row key={s.name} gap={6} align="center">
                                <div
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: getReadableToneColor(s.tone, c),
                                    }}
                                />
                                <TextLabel c={c} fontSize={22} fontWeight={600} text={s.name} />
                            </Row>
                        ))}
                    </Row>
                    <Row gap={4} align="center">
                        <Column justify="space-between" height={216}>
                            {['1.0', '0.5', '0.0'].map((t) => (
                                <TextLabel
                                    key={t}
                                    c={c}
                                    fontSize={22}
                                    mono
                                    color={c.textMuted}
                                    text={t}
                                />
                            ))}
                        </Column>
                        <svg width={276} height={224} viewBox="0 0 276 224">
                            {[0, 0.5, 1].map((v) => (
                                <line
                                    key={v}
                                    x1={12}
                                    x2={264}
                                    y1={py(v)}
                                    y2={py(v)}
                                    stroke={c.borderSubtle}
                                    strokeWidth={1.5}
                                />
                            ))}
                            {SERIES.map((s) => {
                                const col = getReadableToneColor(s.tone, c)
                                const d = s.pts
                                    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${XS[i]} ${py(v)}`)
                                    .join(' ')
                                return (
                                    <g key={s.name}>
                                        <path
                                            d={d}
                                            fill="none"
                                            stroke={col}
                                            strokeWidth={3.5}
                                            strokeLinejoin="round"
                                        />
                                        {s.pts.map((v, i) => (
                                            <circle
                                                key={i}
                                                cx={XS[i]}
                                                cy={py(v)}
                                                r={4.5}
                                                fill={col}
                                            />
                                        ))}
                                    </g>
                                )
                            })}
                        </svg>
                    </Row>
                    <Row style={{ paddingLeft: 44 }}>
                        {TICKS.map((k) => (
                            <div
                                key={k}
                                style={{ display: 'flex', justifyContent: 'center', width: 56 }}
                            >
                                <TextLabel c={c} fontSize={22} mono color={c.textMuted} text={k} />
                            </div>
                        ))}
                    </Row>
                    <TextLabel
                        c={c}
                        fontSize={22}
                        mono
                        color={c.textSecondary}
                        text="Tanh dh3/dh0 = 0.0195"
                    />
                </Panel>
            </Row>
        </Canvas>
    )
}
