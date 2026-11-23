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
import type { ThemeMode } from 'vizmatic'

export const width = 760
export const height = 670
export const alt =
    'A 20-document context window tests evidence slots 1, 5, 10, 15, and 20 with 20 questions each. Accuracy forms a U-shaped curve: 15 of 20 at slot 1, 10 of 20 at slot 5, 7 of 20 in the middle at slot 10, 10 of 20 at slot 15, and 14 of 20 at slot 20.'

const tested = [
    { slot: 1, correct: 15, pct: '75%' },
    { slot: 5, correct: 10, pct: '50%' },
    { slot: 10, correct: 7, pct: '35%' },
    { slot: 15, correct: 10, pct: '50%' },
    { slot: 20, correct: 14, pct: '70%' },
] as const

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)
    const purpleFill = getToneFill('purple', c)
    const warmFill = getToneFill('warm', c)

    const testedSlots = new Set([1, 5, 10, 15, 20])
    const plotW = 430
    const plotH = 220
    const px = (slot: number) => 22 + ((slot - 1) / 19) * 386
    const py = (correct: number) => 196 - (correct / 20) * 168
    const polyline = tested.map((d) => `${px(d.slot)},${py(d.correct)}`).join(' ')

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={10} width={740}>
                <Panel
                    title="1. Context layout across 20 retrieved documents (evidence slot moved)"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <Column gap={6}>
                        <Row gap={4} wrap={false} align="center" justify="space-between">
                            {Array.from({ length: 20 }, (_, i) => {
                                const slot = i + 1
                                const isMid = slot === 10
                                const isMark = testedSlots.has(slot)
                                const border = isMid ? warm : isMark ? purple : c.borderSubtle
                                const bg = isMid ? warmFill : isMark ? purpleFill : c.bgSubtle
                                const txtColor = isMid ? warm : isMark ? purple : c.textMuted
                                return (
                                    <div
                                        key={slot}
                                        style={{
                                            width: 32,
                                            height: 34,
                                            borderRadius: 5,
                                            border: `1.5px solid ${border}`,
                                            backgroundColor: bg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <TextLabel
                                            c={c}
                                            text={isMark ? String(slot) : ''}
                                            fontSize={23}
                                            fontWeight={700}
                                            color={txtColor}
                                            align="center"
                                            width={28}
                                            math={false}
                                        />
                                    </div>
                                )
                            })}
                        </Row>
                        <TextLabel
                            c={c}
                            text="Tested evidence slots: 1 (start), 5, 10 (middle dip), 15, and 20 (end)."
                            fontSize={23}
                            color={c.textSecondary}
                            width={716}
                            math={false}
                        />
                    </Column>
                </Panel>

                <Panel
                    title="2. U-shaped retrieval accuracy (20 queries per slot)"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="purple"
                >
                    <Row gap={12} wrap={false} align="center" justify="space-between">
                        <div
                            style={{
                                borderRadius: 8,
                                border: `1.5px solid ${c.borderSubtle}`,
                                backgroundColor: c.bgCardAlt,
                                padding: 6,
                            }}
                        >
                            <svg width={410} height={plotH} viewBox={`0 0 ${plotW} ${plotH}`}>
                                <line
                                    x1={22}
                                    y1={196}
                                    x2={410}
                                    y2={196}
                                    stroke={c.textMuted}
                                    strokeWidth={1.6}
                                />
                                <line
                                    x1={22}
                                    y1={112}
                                    x2={410}
                                    y2={112}
                                    stroke={c.borderSubtle}
                                    strokeWidth={1.2}
                                    strokeDasharray="4,4"
                                />
                                <line
                                    x1={22}
                                    y1={28}
                                    x2={410}
                                    y2={28}
                                    stroke={c.borderSubtle}
                                    strokeWidth={1.2}
                                    strokeDasharray="4,4"
                                />
                                <polyline
                                    points={polyline}
                                    fill="none"
                                    stroke={purple}
                                    strokeWidth={3.5}
                                />
                                {tested.map((d) => (
                                    <circle
                                        key={d.slot}
                                        cx={px(d.slot)}
                                        cy={py(d.correct)}
                                        r={d.slot === 10 ? 9 : 7}
                                        fill={d.slot === 10 ? warm : purple}
                                        stroke={c.bgCard}
                                        strokeWidth={2}
                                    />
                                ))}
                            </svg>
                        </div>

                        <Column gap={5} width={276}>
                            {tested.map((d) => {
                                const isMid = d.slot === 10
                                return (
                                    <div
                                        key={d.slot}
                                        style={{
                                            padding: '5px 8px',
                                            borderRadius: 6,
                                            border: `1.5px solid ${isMid ? warm : c.borderSubtle}`,
                                            backgroundColor: isMid ? warmFill : c.bgCardAlt,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <TextLabel
                                            c={c}
                                            text={`Slot ${d.slot}`}
                                            fontSize={23}
                                            fontWeight={650}
                                            color={isMid ? warm : blue}
                                            width={104}
                                            math={false}
                                        />
                                        <TextLabel
                                            c={c}
                                            text={`${d.correct}/20 (${d.pct})`}
                                            fontSize={23}
                                            fontWeight={700}
                                            color={isMid ? warm : c.textPrimary}
                                            width={148}
                                            align="right"
                                            math={false}
                                        />
                                    </div>
                                )
                            })}
                        </Column>
                    </Row>
                </Panel>
            </Column>
        </Canvas>
    )
}

export default create('dark')
