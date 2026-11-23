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
export const height = 650
export const alt =
    'A single autoregressive next-token loop expresses three distinct NLP tasks: classifying a technical snippet as Attention, extracting the exact parameter name rope_theta from source text, and synthesizing why GQA saves memory, with each output verified by its own check.'

function StepArrow({ color }: { color: string }) {
    return (
        <svg width={22} height={24} viewBox="0 0 22 24">
            <line x1={2} y1={12} x2={15} y2={12} stroke={color} strokeWidth={2.4} />
            <polygon points="14,6 21,12 14,18" fill={color} />
        </svg>
    )
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const blueFill = getToneFill('blue', c)
    const purpleFill = getToneFill('purple', c)
    const greenFill = getToneFill('green', c)

    const tasks = [
        {
            title: '1. Classification',
            tone: 'blue' as const,
            accent: blue,
            fill: blueFill,
            input: 'Snippet: scales QK^T by 1/sqrt(d_k)  -> Topic:',
            output: 'Attention',
            check: 'Check exact membership in {Attention, Training, Serving}.',
        },
        {
            title: '2. Span extraction',
            tone: 'purple' as const,
            accent: purple,
            fill: purpleFill,
            input: 'Text: rotary_pos.py defines rope_theta = 10000 -> Key:',
            output: 'rope_theta',
            check: 'Match extracted identifier verbatim against source span.',
        },
        {
            title: '3. Grounded explanation',
            tone: 'green' as const,
            accent: green,
            fill: greenFill,
            input: 'Question: why does GQA reduce KV cache size? ->',
            output: 'Shares K/V heads',
            check: 'Verify claim support against cited architecture text.',
        },
    ]

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={10} width={740}>
                <Panel
                    title="Shared next-token continuation loop"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="warm"
                >
                    <Row gap={8} wrap={false} align="center" justify="space-between">
                        <div
                            style={{
                                width: 222,
                                padding: '8px 8px',
                                borderRadius: 8,
                                border: `1.5px solid ${blue}`,
                                backgroundColor: blueFill,
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="Prompt (task + context)"
                                fontSize={23}
                                fontWeight={650}
                                color={blue}
                                align="center"
                                width={206}
                                math={false}
                            />
                        </div>
                        <StepArrow color={warm} />
                        <div
                            style={{
                                width: 214,
                                padding: '8px 8px',
                                borderRadius: 8,
                                border: `1.5px solid ${purple}`,
                                backgroundColor: purpleFill,
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="Score P(next | prefix)"
                                fontSize={23}
                                fontWeight={650}
                                color={purple}
                                align="center"
                                width={198}
                                math={false}
                            />
                        </div>
                        <StepArrow color={warm} />
                        <div
                            style={{
                                width: 196,
                                padding: '8px 8px',
                                borderRadius: 8,
                                border: `1.5px solid ${green}`,
                                backgroundColor: greenFill,
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="Append & repeat"
                                fontSize={23}
                                fontWeight={650}
                                color={green}
                                align="center"
                                width={180}
                                math={false}
                            />
                        </div>
                    </Row>
                </Panel>

                {tasks.map((t) => (
                    <Panel
                        key={t.title}
                        title={t.title}
                        titleFontSize={23}
                        c={c}
                        width={740}
                        padding={10}
                        gap={5}
                        tone={t.tone}
                    >
                        <Column gap={5}>
                            <Row gap={10} wrap={false} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text={t.input}
                                    fontSize={23}
                                    color={c.textSecondary}
                                    width={520}
                                    math={false}
                                />
                                <div
                                    style={{
                                        width: 186,
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        border: `1.5px solid ${t.accent}`,
                                        backgroundColor: t.fill,
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <TextLabel
                                        c={c}
                                        text={t.output}
                                        fontSize={23}
                                        fontWeight={700}
                                        color={t.accent}
                                        align="center"
                                        width={170}
                                        math={false}
                                    />
                                </div>
                            </Row>
                            <TextLabel
                                c={c}
                                text={t.check}
                                fontSize={23}
                                color={c.textPrimary}
                                width={716}
                                math={false}
                            />
                        </Column>
                    </Panel>
                ))}
            </Column>
        </Canvas>
    )
}

export default create('dark')
