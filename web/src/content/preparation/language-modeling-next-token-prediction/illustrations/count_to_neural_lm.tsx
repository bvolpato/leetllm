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
export const height = 560
export const alt =
    'Six corpus records contribute three value, two result and one error after returns. The neural lab reads function and returns, looks up two learned six-dimensional embedding rows, concatenates twelve features and applies the shared twelve-by-eight map. Three selected logits after 200 updates are value 7.904, result 0.678 and error 0.036; softmax normalizes all eight logits.'
export const records = [
    ['function', 'value'],
    ['function', 'value'],
    ['method', 'result'],
    ['handler', 'value'],
    ['test', 'result'],
    ['test', 'error'],
]
export const contextEmbeddings = [
    [-1.278, 0.448, -1.201, -0.263, 0.007, -0.437],
    [0.052, -0.086, 0.646, -1.725, -0.311, 0.058],
]
export const vocabularyLogits = [
    { label: 'error', value: 0.03631166563996148 },
    { label: 'function', value: -1.3008928481847795 },
    { label: 'handler', value: -1.6362340267469784 },
    { label: 'method', value: -1.6061906603272291 },
    { label: 'result', value: 0.6780103227073978 },
    { label: 'returns', value: -1.5627833156599846 },
    { label: 'test', value: -0.9021095287783932 },
    { label: 'value', value: 7.904140496851712 },
]
const peak = Math.max(...vocabularyLogits.map((r) => r.value))
const normalizer = vocabularyLogits.reduce((s, r) => s + Math.exp(r.value - peak), 0)
export const valueProbability =
    Math.exp(vocabularyLogits.find((r) => r.label === 'value')!.value - peak) / normalizer

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const colorOf = (w: string) => (w === 'value' ? green : w === 'result' ? blue : warm)

    const bigramBars = [
        { word: 'value', count: 3, pct: '50%', col: green },
        { word: 'result', count: 2, pct: '33%', col: blue },
        { word: 'error', count: 1, pct: '17%', col: warm },
    ]
    const neuralTop = [
        { word: 'value', logit: '7.904', prob: '99.84%', frac: 1.0, col: green },
        { word: 'result', logit: '0.678', prob: '0.07%', frac: 0.086, col: blue },
        { word: 'error', logit: '0.036', prob: '0.04%', frac: 0.02, col: warm },
    ]

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Row gap={12} align="stretch" width={740}>
                <Panel
                    title="Bigram counts after returns"
                    titleFontSize={24}
                    c={c}
                    width={358}
                    padding={12}
                    gap={8}
                    tone="warm"
                >
                    <Column gap={5}>
                        {records.map(([subj, tgt], i) => (
                            <Row key={`${subj}-${i}`} justify="space-between" align="center">
                                <TextLabel
                                    c={c}
                                    text={`${subj} returns`}
                                    fontSize={23}
                                    color={c.textSecondary}
                                    math={false}
                                />
                                <TextLabel
                                    c={c}
                                    text={`-> ${tgt}`}
                                    fontSize={23}
                                    fontWeight={700}
                                    color={colorOf(tgt)}
                                    math={false}
                                />
                            </Row>
                        ))}
                    </Column>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 10,
                            gap: 6,
                            borderRadius: 8,
                            backgroundColor: c.bgSubtle,
                            border: `1px solid ${c.borderSubtle}`,
                        }}
                    >
                        <TextLabel
                            c={c}
                            text="Ignores prior word (n=6)"
                            fontSize={23}
                            fontWeight={700}
                            color={warm}
                            math={false}
                        />
                        {bigramBars.map((b) => (
                            <Column key={b.word} gap={3}>
                                <Row justify="space-between">
                                    <TextLabel
                                        c={c}
                                        text={b.word}
                                        fontSize={23}
                                        fontWeight={600}
                                        math={false}
                                    />
                                    <TextLabel
                                        c={c}
                                        text={`${b.count}/6 (${b.pct})`}
                                        fontSize={23}
                                        color={b.col}
                                        fontWeight={700}
                                        math={false}
                                    />
                                </Row>
                                <svg width={310} height={14} viewBox="0 0 310 14">
                                    <rect
                                        x={0}
                                        y={0}
                                        width={310}
                                        height={14}
                                        rx={4}
                                        fill={c.bgCard}
                                    />
                                    <rect
                                        x={0}
                                        y={0}
                                        width={(b.count / 6) * 310}
                                        height={14}
                                        rx={4}
                                        fill={b.col}
                                    />
                                </svg>
                            </Column>
                        ))}
                    </div>
                </Panel>

                <Panel
                    title="Neural 2-token context model"
                    titleFontSize={24}
                    c={c}
                    width={370}
                    padding={12}
                    gap={8}
                    tone="purple"
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 9,
                            gap: 6,
                            borderRadius: 8,
                            backgroundColor: getToneFill('purple', c),
                            border: `1px solid ${c.borderSubtle}`,
                        }}
                    >
                        <TextLabel
                            c={c}
                            text="Concat 2 embeddings [12]"
                            fontSize={23}
                            fontWeight={600}
                            math={false}
                        />
                        {contextEmbeddings.map((vec, rowIdx) => (
                            <Row key={rowIdx} gap={6} align="center">
                                <TextLabel
                                    c={c}
                                    width={90}
                                    text={rowIdx === 0 ? 'function' : 'returns'}
                                    fontSize={23}
                                    color={c.textSecondary}
                                    math={false}
                                />
                                <svg width={220} height={24} viewBox="0 0 220 24">
                                    {vec.map((v, j) => (
                                        <rect
                                            key={j}
                                            x={j * 36}
                                            y={2}
                                            width={31}
                                            height={20}
                                            rx={3}
                                            fill={v >= 0 ? blue : warm}
                                            fillOpacity={
                                                0.28 + 0.62 * Math.min(1, Math.abs(v) / 1.75)
                                            }
                                            stroke={v >= 0 ? blue : warm}
                                            strokeWidth={1}
                                        />
                                    ))}
                                </svg>
                            </Row>
                        ))}
                    </div>
                    <TextLabel
                        c={c}
                        text="Linear W(12x8)+b -> softmax"
                        fontSize={23}
                        color={c.textSecondary}
                        math={false}
                    />
                    <Column gap={7}>
                        {neuralTop.map((row) => (
                            <Column key={row.word} gap={3}>
                                <Row justify="space-between">
                                    <TextLabel
                                        c={c}
                                        text={row.word}
                                        fontSize={23}
                                        fontWeight={600}
                                        math={false}
                                    />
                                    <TextLabel
                                        c={c}
                                        text={`z=${row.logit} (${row.prob})`}
                                        fontSize={23}
                                        fontWeight={700}
                                        color={row.col}
                                        math={false}
                                    />
                                </Row>
                                <svg width={342} height={14} viewBox="0 0 342 14">
                                    <rect
                                        x={0}
                                        y={0}
                                        width={342}
                                        height={14}
                                        rx={4}
                                        fill={c.bgSubtle}
                                    />
                                    <rect
                                        x={0}
                                        y={0}
                                        width={row.frac * 342}
                                        height={14}
                                        rx={4}
                                        fill={row.col}
                                    />
                                </svg>
                            </Column>
                        ))}
                    </Column>
                </Panel>
            </Row>
        </Canvas>
    )
}

export default create('dark')
