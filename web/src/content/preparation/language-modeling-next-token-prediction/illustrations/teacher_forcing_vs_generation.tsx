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
    'Four observed input tokens bos, function, returns and value align with shifted labels function, returns, value and eos. A four-by-four additive causal mask has key positions j across columns and query positions i down rows: zero on and below the diagonal and minus infinity above. The four target probabilities and losses align below the same columns. Generation instead selects function, returns, value and eos sequentially, passing each selected token into the next context.'
export const inputTokens = ['<bos>', 'function', 'returns', 'value']
export const targetTokens = ['function', 'returns', 'value', '<eos>']
export const logits = [
    [0, 3, 0.5, -1, -2],
    [-1, 0.1, 2.5, 0, -2],
    [-1, 0, 0.2, 2, -1.5],
    [-2, 0, -1, -0.5, 2.4],
]
export const trueProbabilities = logits.map((row, i) => {
    const m = Math.max(...row)
    const e = row.map((v) => Math.exp(v - m))
    return e[i + 1] / e.reduce((s, v) => s + v, 0)
})
export const losses = trueProbabilities.map((p) => -Math.log(p))

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)

    const genSteps = [
        '1: <bos> -> function',
        '2: ... function -> returns',
        '3: ... returns -> value',
        '4: ... value -> <eos>',
    ]
    const shortLabels = ['<bos>', 'func', 'ret', 'val']
    const shortTargets = ['func', 'ret', 'val', '<eos>']

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Row gap={12} align="stretch" width={740}>
                <Panel
                    title="Teacher forcing (1 parallel pass)"
                    titleFontSize={24}
                    c={c}
                    width={388}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <Row gap={6}>
                        {shortLabels.map((tok, i) => (
                            <Column key={tok} width={86} gap={4} align="center">
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        width: 86,
                                        padding: 5,
                                        borderRadius: 6,
                                        backgroundColor: c.bgSubtle,
                                        border: `1.5px solid ${blue}`,
                                    }}
                                >
                                    <TextLabel
                                        c={c}
                                        text={tok}
                                        fontSize={23}
                                        fontWeight={600}
                                        align="center"
                                        math={false}
                                    />
                                </div>
                                <TextLabel
                                    c={c}
                                    text="v"
                                    fontSize={23}
                                    color={blue}
                                    align="center"
                                    math={false}
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        width: 86,
                                        padding: 5,
                                        borderRadius: 6,
                                        backgroundColor: getToneFill('green', c),
                                        border: `1.5px solid ${green}`,
                                    }}
                                >
                                    <TextLabel
                                        c={c}
                                        text={shortTargets[i]}
                                        fontSize={23}
                                        fontWeight={700}
                                        color={green}
                                        align="center"
                                        math={false}
                                    />
                                </div>
                            </Column>
                        ))}
                    </Row>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 9,
                            gap: 6,
                            borderRadius: 8,
                            backgroundColor: c.bgSubtle,
                            border: `1px solid ${c.borderSubtle}`,
                        }}
                    >
                        <TextLabel
                            c={c}
                            text="Causal mask M[i,j]: 0 on diag/-inf"
                            fontSize={23}
                            fontWeight={600}
                            math={false}
                        />
                        <svg width={340} height={116} viewBox="0 0 340 116">
                            {[0, 1, 2, 3].map((row) =>
                                [0, 1, 2, 3].map((col) => {
                                    const allowed = col <= row
                                    return (
                                        <rect
                                            key={`${row}-${col}`}
                                            x={col * 85 + 2}
                                            y={row * 28 + 2}
                                            width={80}
                                            height={24}
                                            rx={4}
                                            fill={allowed ? blue : c.bgCard}
                                            fillOpacity={allowed ? 0.28 : 0.92}
                                            stroke={allowed ? blue : c.borderSubtle}
                                        />
                                    )
                                }),
                            )}
                        </svg>
                    </div>

                    <Row justify="space-between" align="center">
                        <TextLabel
                            c={c}
                            text="p: .84 .77 .72 .82"
                            fontSize={23}
                            color={c.textSecondary}
                            math={false}
                        />
                        <TextLabel
                            c={c}
                            text="loss 0.209"
                            fontSize={23}
                            fontWeight={700}
                            color={purple}
                            math={false}
                        />
                    </Row>
                </Panel>

                <Panel
                    title="Generation (4 serial steps)"
                    titleFontSize={24}
                    c={c}
                    width={340}
                    padding={12}
                    gap={10}
                    tone="warm"
                >
                    <Column gap={8}>
                        {genSteps.map((line) => (
                            <div
                                key={line}
                                style={{
                                    display: 'flex',
                                    padding: 9,
                                    borderRadius: 8,
                                    backgroundColor: c.bgSubtle,
                                    border: `1px solid ${c.borderSubtle}`,
                                }}
                            >
                                <TextLabel
                                    c={c}
                                    text={line}
                                    fontSize={23}
                                    fontWeight={600}
                                    math={false}
                                />
                            </div>
                        ))}
                    </Column>
                    <div
                        style={{
                            display: 'flex',
                            padding: 9,
                            borderRadius: 8,
                            backgroundColor: getToneFill('warm', c),
                            border: `1px solid ${warm}`,
                        }}
                    >
                        <TextLabel
                            c={c}
                            text="Each sampled token feeds step t+1."
                            fontSize={23}
                            color={warm}
                            fontWeight={600}
                            math={false}
                        />
                    </div>
                </Panel>
            </Row>
        </Canvas>
    )
}

export default create('dark')
