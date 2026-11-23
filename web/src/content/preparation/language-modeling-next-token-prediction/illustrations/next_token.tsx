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
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const width = 760
export const height = 560
export const alt =
    'The prompt The function returns the gives result 60 percent, value 25, index 10 and other tokens together 5. After result is selected and appended, the new distribution gives the period 80 percent and the token and 20 percent. Nested probability strips show result-period carries 48 percent of the initial prompt-conditioned mass, result-and 12 percent, and other first tokens 40 percent.'
export const firstProbabilities = [0.6, 0.25, 0.1, 0.05]
export const secondProbabilities = [0.8, 0.2]

function PromptChips({
    c,
    tokens,
    highlightLast,
    accent,
}: {
    c: ThemeColors
    tokens: string[]
    highlightLast: boolean
    accent: string
}) {
    return (
        <Row gap={8} wrap={false} align="center">
            {tokens.map((tok, i) => {
                const isNew = highlightLast && i === tokens.length - 1
                return (
                    <div
                        key={`${tok}-${i}`}
                        style={{
                            display: 'flex',
                            padding: '5px 12px',
                            borderRadius: 6,
                            backgroundColor: isNew ? getToneFill('green', c) : c.bgSubtle,
                            border: `1.5px solid ${isNew ? accent : c.borderSubtle}`,
                        }}
                    >
                        <TextLabel
                            c={c}
                            text={tok}
                            fontSize={23}
                            fontWeight={isNew ? 700 : 500}
                            color={isNew ? accent : c.textPrimary}
                            math={false}
                        />
                    </div>
                )
            })}
        </Row>
    )
}

function ProbStrip({
    c,
    segments,
    barWidth,
}: {
    c: ThemeColors
    segments: Array<{ label: string; prob: number; color: string }>
    barWidth: number
}) {
    let x = 0
    return (
        <Column gap={6}>
            <svg width={barWidth} height={32} viewBox={`0 0 ${barWidth} 32`}>
                {segments.map((seg) => {
                    const w = Math.max(2, seg.prob * barWidth - 2)
                    const el = (
                        <rect
                            key={seg.label}
                            x={x}
                            y={2}
                            width={w}
                            height={28}
                            rx={4}
                            fill={seg.color}
                            fillOpacity={0.85}
                        />
                    )
                    x += seg.prob * barWidth
                    return el
                })}
            </svg>
            <Row gap={12} wrap>
                {segments.map((seg) => (
                    <Row key={seg.label} gap={5} align="center">
                        <div
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 3,
                                backgroundColor: seg.color,
                            }}
                        />
                        <TextLabel
                            c={c}
                            text={`${seg.label} ${Math.round(seg.prob * 100)}%`}
                            fontSize={23}
                            fontWeight={600}
                            color={c.textSecondary}
                            math={false}
                        />
                    </Row>
                ))}
            </Row>
        </Column>
    )
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={10} width={740}>
                <Panel
                    title="Step 1: score next token from prompt"
                    titleFontSize={25}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <Row justify="space-between" align="center">
                        <PromptChips
                            c={c}
                            tokens={['The', 'function', 'returns', 'the']}
                            highlightLast={false}
                            accent={green}
                        />
                        <TextLabel
                            c={c}
                            text="-> result"
                            fontSize={23}
                            fontWeight={700}
                            color={green}
                            math={false}
                        />
                    </Row>
                    <ProbStrip
                        c={c}
                        barWidth={712}
                        segments={[
                            { label: 'result', prob: 0.6, color: green },
                            { label: 'value', prob: 0.25, color: blue },
                            { label: 'index', prob: 0.1, color: purple },
                            { label: 'other', prob: 0.05, color: c.textMuted },
                        ]}
                    />
                </Panel>

                <Panel
                    title="Step 2: append result and score continuation"
                    titleFontSize={25}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="green"
                >
                    <PromptChips
                        c={c}
                        tokens={['The', 'function', 'returns', 'the', 'result']}
                        highlightLast={true}
                        accent={green}
                    />
                    <Row gap={12} align="stretch">
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: 350,
                                padding: 10,
                                gap: 6,
                                borderRadius: 8,
                                backgroundColor: c.bgSubtle,
                                border: `1px solid ${c.borderSubtle}`,
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="Next distribution"
                                fontSize={23}
                                fontWeight={700}
                                color={blue}
                                math={false}
                            />
                            <ProbStrip
                                c={c}
                                barWidth={326}
                                segments={[
                                    { label: 'period', prob: 0.8, color: blue },
                                    { label: 'and', prob: 0.2, color: warm },
                                ]}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: 350,
                                padding: 10,
                                gap: 6,
                                borderRadius: 8,
                                backgroundColor: c.bgSubtle,
                                border: `1px solid ${c.borderSubtle}`,
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="2-token joint path mass"
                                fontSize={23}
                                fontWeight={700}
                                color={purple}
                                math={false}
                            />
                            <ProbStrip
                                c={c}
                                barWidth={326}
                                segments={[
                                    { label: 'res .', prob: 0.48, color: blue },
                                    { label: 'res and', prob: 0.12, color: warm },
                                    { label: 'other', prob: 0.4, color: c.textMuted },
                                ]}
                            />
                        </div>
                    </Row>
                </Panel>
            </Column>
        </Canvas>
    )
}

export default create('dark')
