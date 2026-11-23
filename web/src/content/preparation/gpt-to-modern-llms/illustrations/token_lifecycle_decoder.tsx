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
export const height = 600
export const alt =
    'Prefill processes five prompt tokens Why, is, RoPE, relative, and question mark, caching keys and values at positions 1 to 5. Selecting Because with logit 0.38 leaves 6 text tokens and 5 cached positions. The next decode step passes Because at position 6, lets Q6 attend to K1 through K6, and extends the cache to six positions.'

function CacheStrip({
    count,
    c,
    blue,
    green,
    blueFill,
    greenFill,
}: {
    count: number
    c: ThemeColors
    blue: string
    green: string
    blueFill: string
    greenFill: string
}) {
    const items = Array.from({ length: count }, (_, i) => i + 1)
    return (
        <Row gap={5} wrap={false} align="center">
            <TextLabel
                c={c}
                text="KV:"
                fontSize={23}
                fontWeight={700}
                color={c.textSecondary}
                width={44}
                math={false}
            />
            {items.map((idx) => {
                const isNew = idx === 6
                return (
                    <div
                        key={idx}
                        style={{
                            width: 42,
                            height: 32,
                            borderRadius: 6,
                            border: `1.5px solid ${isNew ? green : blue}`,
                            backgroundColor: isNew ? greenFill : blueFill,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <TextLabel
                            c={c}
                            text={String(idx)}
                            fontSize={23}
                            fontWeight={700}
                            color={isNew ? green : blue}
                            align="center"
                            width={34}
                            math={false}
                        />
                    </div>
                )
            })}
        </Row>
    )
}

function FlowStep({ color, label, c }: { color: string; label: string; c: ThemeColors }) {
    return (
        <Row gap={10} wrap={false} align="center" justify="center">
            <svg width={28} height={24} viewBox="0 0 28 24">
                <line x1={14} y1={1} x2={14} y2={16} stroke={color} strokeWidth={2.5} />
                <polygon points="8,14 20,14 14,23" fill={color} />
            </svg>
            <TextLabel
                c={c}
                text={label}
                fontSize={23}
                fontWeight={600}
                color={color}
                width={560}
                math={false}
            />
        </Row>
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
    const warmFill = getToneFill('warm', c)

    const prompt = ['1 Why', '2 is', '3 RoPE', '4 relative', '5 ?']
    const logits = [
        { word: 'Because 0.38', hot: true, w: 192 },
        { word: 'Since 0.18', hot: false, w: 166 },
        { word: 'It 0.09', hot: false, w: 146 },
        { word: 'The 0.05', hot: false, w: 158 },
    ]

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={6} width={740}>
                <Panel
                    title="1. Prefill: run 5 prompt tokens in parallel and fill KV cache"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={10}
                    gap={6}
                    tone="blue"
                >
                    <Column gap={8}>
                        <Row gap={8} wrap={false} align="center">
                            {prompt.map((tok, i) => (
                                <div
                                    key={tok}
                                    style={{
                                        width: 132,
                                        padding: '5px 4px',
                                        borderRadius: 6,
                                        border: `1.5px solid ${i === 4 ? purple : blue}`,
                                        backgroundColor: i === 4 ? purpleFill : blueFill,
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <TextLabel
                                        c={c}
                                        text={tok}
                                        fontSize={23}
                                        fontWeight={650}
                                        color={i === 4 ? purple : blue}
                                        align="center"
                                        width={120}
                                        math={false}
                                    />
                                </div>
                            ))}
                        </Row>
                        <Row gap={12} wrap={false} align="center" justify="space-between">
                            <CacheStrip
                                count={5}
                                c={c}
                                blue={blue}
                                green={green}
                                blueFill={blueFill}
                                greenFill={greenFill}
                            />
                            <TextLabel
                                c={c}
                                text="h5 = [0.6, -0.2, 0.4, 0.1]"
                                fontSize={23}
                                color={c.textSecondary}
                                width={360}
                                align="right"
                                math={false}
                            />
                        </Row>
                    </Column>
                </Panel>
                <FlowStep
                    color={purple}
                    label="Project h5 through LM head to sample token 6"
                    c={c}
                />
                <Panel
                    title="2. Sample token 6: sequence advances ahead of cache"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={10}
                    gap={6}
                    tone="purple"
                >
                    <Column gap={8}>
                        <Row gap={6} wrap={false} align="center" justify="space-between">
                            {logits.map((item) => (
                                <div
                                    key={item.word}
                                    style={{
                                        width: item.w,
                                        padding: '6px 6px',
                                        borderRadius: 6,
                                        border: `1.5px solid ${item.hot ? green : c.borderSubtle}`,
                                        backgroundColor: item.hot ? greenFill : c.bgCardAlt,
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <TextLabel
                                        c={c}
                                        text={item.word}
                                        fontSize={23}
                                        fontWeight={item.hot ? 700 : 500}
                                        color={item.hot ? green : c.textSecondary}
                                        align="center"
                                        width={item.w - 14}
                                        math={false}
                                    />
                                </div>
                            ))}
                        </Row>
                        <Row gap={12} wrap={false} align="center" justify="space-between">
                            <div
                                style={{
                                    width: 348,
                                    padding: '5px 10px',
                                    borderRadius: 6,
                                    border: `1.5px solid ${blue}`,
                                    backgroundColor: blueFill,
                                }}
                            >
                                <TextLabel
                                    c={c}
                                    text="Text sequence: 6 tokens"
                                    fontSize={23}
                                    fontWeight={650}
                                    color={blue}
                                    align="center"
                                    width={328}
                                    math={false}
                                />
                            </div>
                            <div
                                style={{
                                    width: 348,
                                    padding: '5px 10px',
                                    borderRadius: 6,
                                    border: `1.5px solid ${warm}`,
                                    backgroundColor: warmFill,
                                }}
                            >
                                <TextLabel
                                    c={c}
                                    text="KV cache: still 5 entries"
                                    fontSize={23}
                                    fontWeight={650}
                                    color={warm}
                                    align="center"
                                    width={328}
                                    math={false}
                                />
                            </div>
                        </Row>
                    </Column>
                </Panel>
                <FlowStep
                    color={green}
                    label="Pass Because at pos 6 to sync text and KV cache"
                    c={c}
                />
                <Panel
                    title="3. Decode step: score Because at pos 6 and append K6, V6"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={10}
                    gap={6}
                    tone="green"
                >
                    <Row gap={12} wrap={false} align="center" justify="space-between">
                        <CacheStrip
                            count={6}
                            c={c}
                            blue={blue}
                            green={green}
                            blueFill={blueFill}
                            greenFill={greenFill}
                        />
                        <TextLabel
                            c={c}
                            text="Q6 attends K1..K6 (reuse 1..5)"
                            fontSize={23}
                            fontWeight={650}
                            color={green}
                            width={356}
                            align="right"
                            math={false}
                        />
                    </Row>
                </Panel>
            </Column>
        </Canvas>
    )
}

export default create('dark')
