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
    'Prefill processes the four prompt positions The function returns the, stores four layer-specific key and value columns and selects result. Feeding result adds position five before selecting a period. Feeding the period adds position six before selecting the stop token, which ends this loop before another feed. Blue cache columns are retained and green columns newly added. The exact raw KV payload is 1, 4 and 16 GiB at 2048, 8192 and 32768 cached positions per request under the article dimensions.'
export const cachedLengths = [4, 5, 6]
export const memoryConfig = { batch: 4, layers: 32, kvHeads: 8, headDim: 128, bytesPerValue: 2 }
export const cacheGiB = (s: number) =>
    (2 *
        memoryConfig.layers *
        memoryConfig.kvHeads *
        memoryConfig.headDim *
        s *
        memoryConfig.batch *
        memoryConfig.bytesPerValue) /
    2 ** 30

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

    const steps = [
        { title: 'Prefill (4 tokens)', cols: 4, isDecode: false, nextTok: '-> result' },
        { title: 'Decode +1 (pos 5)', cols: 5, isDecode: true, nextTok: '-> .' },
        { title: 'Decode +2 (pos 6)', cols: 6, isDecode: true, nextTok: '-> <eos>' },
    ]
    const budgets = [
        { seq: '2,048', gib: 1 },
        { seq: '8,192', gib: 4 },
        { seq: '32,768', gib: 16 },
    ]

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={10} width={740}>
                <Panel
                    title="KV cache columns: prefill and decode"
                    titleFontSize={25}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <TextLabel
                        c={c}
                        text="Blue = retained columns | Green = appended column"
                        fontSize={23}
                        color={c.textSecondary}
                        math={false}
                    />
                    {steps.map((st) => (
                        <Row key={st.title} justify="space-between" align="center">
                            <TextLabel
                                c={c}
                                width={220}
                                text={st.title}
                                fontSize={23}
                                fontWeight={600}
                                color={st.isDecode ? green : blue}
                                math={false}
                            />
                            <svg width={320} height={36} viewBox="0 0 320 36">
                                {Array.from({ length: st.cols }, (_, j) => {
                                    const fresh = st.isDecode && j === st.cols - 1
                                    const col = fresh ? green : blue
                                    return (
                                        <g key={j}>
                                            <rect
                                                x={j * 52 + 2}
                                                y={2}
                                                width={46}
                                                height={14}
                                                rx={3}
                                                fill={col}
                                                fillOpacity={0.28}
                                                stroke={col}
                                            />
                                            <rect
                                                x={j * 52 + 2}
                                                y={19}
                                                width={46}
                                                height={14}
                                                rx={3}
                                                fill={col}
                                                fillOpacity={0.28}
                                                stroke={col}
                                            />
                                        </g>
                                    )
                                })}
                            </svg>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: 140,
                                    padding: '5px 8px',
                                    borderRadius: 6,
                                    backgroundColor: getToneFill('warm', c),
                                    border: `1px solid ${warm}`,
                                }}
                            >
                                <TextLabel
                                    c={c}
                                    text={st.nextTok}
                                    fontSize={23}
                                    fontWeight={700}
                                    color={warm}
                                    align="center"
                                    math={false}
                                />
                            </div>
                        </Row>
                    ))}
                </Panel>

                <Panel
                    title="Raw KV payload (B=4, L=32, H_kv=8, d=128, fp16)"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="warm"
                >
                    <Column gap={7}>
                        {budgets.map((b) => (
                            <Row key={b.seq} gap={12} align="center">
                                <TextLabel
                                    c={c}
                                    width={130}
                                    text={`${b.seq} pos`}
                                    fontSize={23}
                                    fontWeight={600}
                                    math={false}
                                />
                                <svg width={460} height={20} viewBox="0 0 460 20">
                                    <rect
                                        x={0}
                                        y={2}
                                        width={460}
                                        height={16}
                                        rx={4}
                                        fill={c.bgSubtle}
                                    />
                                    <rect
                                        x={0}
                                        y={2}
                                        width={(b.gib / 16) * 460}
                                        height={16}
                                        rx={4}
                                        fill={b.gib === 16 ? warm : blue}
                                    />
                                </svg>
                                <TextLabel
                                    c={c}
                                    width={100}
                                    text={`${b.gib} GiB`}
                                    fontSize={23}
                                    fontWeight={700}
                                    color={b.gib === 16 ? warm : blue}
                                    align="right"
                                    math={false}
                                />
                            </Row>
                        ))}
                    </Column>
                </Panel>
            </Column>
        </Canvas>
    )
}

export default create('dark')
