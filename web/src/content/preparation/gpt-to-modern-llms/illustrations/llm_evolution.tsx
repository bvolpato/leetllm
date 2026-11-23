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
export const height = 660
export const alt =
    'Three LLM design axes from 2018 to 2024: prompting and alignment moving from GPT-1 through GPT-3 to InstructGPT, compute-optimal allocation comparing Gopher 280B on 300B tokens with Chinchilla 70B on 1.4T tokens at matched compute, and Mixtral sparse routing executing 2 of 8 experts for 13B active out of 47B total parameters.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const blueFill = getToneFill('blue', c)
    const greenFill = getToneFill('green', c)

    const tracks = [
        {
            axis: 'Interface',
            color: blue,
            items: '2018 GPT-1 -> 2019 GPT-2 -> 2020 GPT-3 -> 2022 InstructGPT',
        },
        {
            axis: 'Budget',
            color: purple,
            items: '2020 Kaplan -> 2021 Gopher (280B) -> 2022 Chinchilla (70B)',
        },
        {
            axis: 'Sparsity',
            color: green,
            items: '2017 Sparse MoE -> 2023-24 Mixtral / DeepSeek routing',
        },
    ]

    const experts = [1, 2, 3, 4, 5, 6, 7, 8]

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={10} width={740}>
                <Panel
                    title="1. Three orthogonal LLM design axes (2017-2024)"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <Column gap={7}>
                        {tracks.map((tr) => (
                            <Row key={tr.axis} gap={10} wrap={false} align="center">
                                <div
                                    style={{
                                        width: 118,
                                        padding: '4px 6px',
                                        borderRadius: 6,
                                        border: `1.5px solid ${tr.color}`,
                                        backgroundColor: c.bgCardAlt,
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <TextLabel
                                        c={c}
                                        text={tr.axis}
                                        fontSize={23}
                                        fontWeight={700}
                                        color={tr.color}
                                        align="center"
                                        width={104}
                                        math={false}
                                    />
                                </div>
                                <TextLabel
                                    c={c}
                                    text={tr.items}
                                    fontSize={23}
                                    color={c.textPrimary}
                                    width={586}
                                    math={false}
                                />
                            </Row>
                        ))}
                    </Column>
                </Panel>

                <Row gap={10} wrap={false} align="stretch">
                    <Panel
                        title="2. Compute allocation (~same FLOPs)"
                        titleFontSize={24}
                        c={c}
                        width={384}
                        padding={12}
                        gap={8}
                        tone="warm"
                    >
                        <Column gap={8}>
                            <Column gap={4}>
                                <TextLabel
                                    c={c}
                                    text="Parameters (bar max 280B)"
                                    fontSize={23}
                                    fontWeight={650}
                                    color={blue}
                                    width={356}
                                    math={false}
                                />
                                <Row gap={8} wrap={false} align="center">
                                    <TextLabel
                                        c={c}
                                        text="Gopher"
                                        fontSize={23}
                                        color={c.textSecondary}
                                        width={104}
                                        math={false}
                                    />
                                    <svg width={166} height={18} viewBox="0 0 166 18">
                                        <rect
                                            x={0}
                                            y={3}
                                            width={166}
                                            height={12}
                                            rx={4}
                                            fill={c.bgSubtle}
                                        />
                                        <rect
                                            x={0}
                                            y={3}
                                            width={166}
                                            height={12}
                                            rx={4}
                                            fill={blue}
                                        />
                                    </svg>
                                    <TextLabel
                                        c={c}
                                        text="280B"
                                        fontSize={23}
                                        fontWeight={700}
                                        color={blue}
                                        width={68}
                                        align="right"
                                        math={false}
                                    />
                                </Row>
                                <Row gap={8} wrap={false} align="center">
                                    <TextLabel
                                        c={c}
                                        text="Chinchilla"
                                        fontSize={23}
                                        color={c.textSecondary}
                                        width={104}
                                        math={false}
                                    />
                                    <svg width={166} height={18} viewBox="0 0 166 18">
                                        <rect
                                            x={0}
                                            y={3}
                                            width={166}
                                            height={12}
                                            rx={4}
                                            fill={c.bgSubtle}
                                        />
                                        <rect
                                            x={0}
                                            y={3}
                                            width={42}
                                            height={12}
                                            rx={4}
                                            fill={purple}
                                        />
                                    </svg>
                                    <TextLabel
                                        c={c}
                                        text="70B"
                                        fontSize={23}
                                        fontWeight={700}
                                        color={purple}
                                        width={68}
                                        align="right"
                                        math={false}
                                    />
                                </Row>
                            </Column>
                            <Column gap={4}>
                                <TextLabel
                                    c={c}
                                    text="Tokens (bar max 1.4T)"
                                    fontSize={23}
                                    fontWeight={650}
                                    color={warm}
                                    width={356}
                                    math={false}
                                />
                                <Row gap={8} wrap={false} align="center">
                                    <TextLabel
                                        c={c}
                                        text="Gopher"
                                        fontSize={23}
                                        color={c.textSecondary}
                                        width={104}
                                        math={false}
                                    />
                                    <svg width={166} height={18} viewBox="0 0 166 18">
                                        <rect
                                            x={0}
                                            y={3}
                                            width={166}
                                            height={12}
                                            rx={4}
                                            fill={c.bgSubtle}
                                        />
                                        <rect
                                            x={0}
                                            y={3}
                                            width={36}
                                            height={12}
                                            rx={4}
                                            fill={blue}
                                        />
                                    </svg>
                                    <TextLabel
                                        c={c}
                                        text="300B"
                                        fontSize={23}
                                        fontWeight={700}
                                        color={blue}
                                        width={68}
                                        align="right"
                                        math={false}
                                    />
                                </Row>
                                <Row gap={8} wrap={false} align="center">
                                    <TextLabel
                                        c={c}
                                        text="Chinchilla"
                                        fontSize={23}
                                        color={c.textSecondary}
                                        width={104}
                                        math={false}
                                    />
                                    <svg width={166} height={18} viewBox="0 0 166 18">
                                        <rect
                                            x={0}
                                            y={3}
                                            width={166}
                                            height={12}
                                            rx={4}
                                            fill={c.bgSubtle}
                                        />
                                        <rect
                                            x={0}
                                            y={3}
                                            width={166}
                                            height={12}
                                            rx={4}
                                            fill={purple}
                                        />
                                    </svg>
                                    <TextLabel
                                        c={c}
                                        text="1.4T"
                                        fontSize={23}
                                        fontWeight={700}
                                        color={purple}
                                        width={68}
                                        align="right"
                                        math={false}
                                    />
                                </Row>
                            </Column>
                        </Column>
                    </Panel>

                    <Panel
                        title="3. Mixtral 8x7B routing (2 / 8)"
                        titleFontSize={24}
                        c={c}
                        width={346}
                        padding={12}
                        gap={8}
                        tone="green"
                    >
                        <Column gap={8}>
                            <Row gap={6} wrap align="center" justify="space-between">
                                {experts.map((id) => {
                                    const active = id === 3 || id === 7
                                    return (
                                        <div
                                            key={id}
                                            style={{
                                                width: 72,
                                                padding: '6px 0',
                                                borderRadius: 6,
                                                border: `1.5px solid ${active ? green : c.borderSubtle}`,
                                                backgroundColor: active ? greenFill : c.bgCardAlt,
                                                display: 'flex',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <TextLabel
                                                c={c}
                                                text={`E${id}`}
                                                fontSize={23}
                                                fontWeight={active ? 700 : 500}
                                                color={active ? green : c.textMuted}
                                                align="center"
                                                width={64}
                                                math={false}
                                            />
                                        </div>
                                    )
                                })}
                            </Row>
                            <div
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 8,
                                    border: `1.5px solid ${blue}`,
                                    backgroundColor: blueFill,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                <TextLabel
                                    c={c}
                                    text="47B total resident weights"
                                    fontSize={23}
                                    fontWeight={650}
                                    color={blue}
                                    width={298}
                                    math={false}
                                />
                                <TextLabel
                                    c={c}
                                    text="~13B active per token"
                                    fontSize={23}
                                    fontWeight={700}
                                    color={green}
                                    width={298}
                                    math={false}
                                />
                                <TextLabel
                                    c={c}
                                    text="VRAM stores all 8 experts."
                                    fontSize={23}
                                    color={c.textSecondary}
                                    width={298}
                                    math={false}
                                />
                            </div>
                        </Column>
                    </Panel>
                </Row>
            </Column>
        </Canvas>
    )
}

export default create('dark')
