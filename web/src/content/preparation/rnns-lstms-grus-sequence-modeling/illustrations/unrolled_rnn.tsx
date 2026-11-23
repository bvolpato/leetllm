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
export const height = 610
export const alt =
    'Top diagram traces one shared recurrent cell across three review tokens: slow produces state [0.664, 0.100], yet updates it to [0.494, 0.641], and engaging reaches final state [0.390, 0.655]. Bottom left bars show final softmax probabilities: 29.1% negative, 38.9% positive, and 32.0% neutral. Bottom right bars show backward scalar sensitivity falling from 0.333 at step 3 to 0.112 at step 2 and 0.031 at step 1.'

const CHAIN: Array<{ step: string; state: string; tone: ToneName }> = [
    { step: 'Init h_0', state: '[0.000, 0.000]', tone: 'neutral' },
    { step: 't=1 "slow"', state: '[0.664, 0.100]', tone: 'blue' },
    { step: 't=2 "yet"', state: '[0.494, 0.641]', tone: 'cyan' },
    { step: 't=3 "engaging"', state: '[0.390, 0.655]', tone: 'green' },
]

const PROBS: Array<{ label: string; value: number; note: string; tone: ToneName }> = [
    { label: 'Positive', value: 0.389, note: '38.9%', tone: 'green' },
    { label: 'Neutral', value: 0.32, note: '32.0%', tone: 'blue' },
    { label: 'Negative', value: 0.291, note: '29.1%', tone: 'neutral' },
]

const SENS: Array<{ label: string; value: number; note: string; tone: ToneName }> = [
    { label: 'Step 3', value: 0.333, note: '0.333', tone: 'blue' },
    { label: 'Step 2', value: 0.112, note: '0.112', tone: 'warm' },
    { label: 'Step 1', value: 0.031, note: '0.031', tone: 'red' },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const renderCard = (item: (typeof CHAIN)[number]) => (
        <div
            key={item.step}
            style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: 332,
                padding: '7px 10px',
                borderRadius: 8,
                border: `1.5px solid ${getReadableToneColor(item.tone, c)}`,
                backgroundColor: getToneFill(item.tone, c),
            }}
        >
            <TextLabel c={c} fontSize={23} fontWeight={700} text={item.step} />
            <TextLabel c={c} fontSize={23} mono color={c.textSecondary} text={item.state} />
        </div>
    )

    const renderBars = (rows: typeof PROBS, maxVal: number) => (
        <Column gap={12}>
            {rows.map((r) => {
                const col = getReadableToneColor(r.tone, c)
                const barW = Math.max(8, Math.round((r.value / maxVal) * 140))
                return (
                    <Row key={r.label} gap={8} align="center" justify="space-between">
                        <div style={{ display: 'flex', width: 96 }}>
                            <TextLabel c={c} fontSize={23} fontWeight={600} text={r.label} />
                        </div>
                        <svg width={146} height={24} viewBox="0 0 146 24">
                            <rect
                                x={0}
                                y={3}
                                width={140}
                                height={18}
                                rx={4}
                                fill={c.bgSubtle}
                                stroke={c.borderSubtle}
                            />
                            <rect x={0} y={3} width={barW} height={18} rx={4} fill={col} />
                        </svg>
                        <div style={{ display: 'flex', width: 74, justifyContent: 'flex-end' }}>
                            <TextLabel
                                c={c}
                                fontSize={23}
                                mono
                                fontWeight={700}
                                color={col}
                                text={r.note}
                            />
                        </div>
                    </Row>
                )
            })}
        </Column>
    )

    const arrowSvg = (
        <svg width={24} height={24} viewBox="0 0 24 24">
            <line x1={2} y1={12} x2={16} y2={12} stroke={c.textMuted} strokeWidth={2.5} />
            <polygon points="14,7 22,12 14,17" fill={c.textMuted} />
        </svg>
    )

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={12} width={740}>
                <Panel
                    title="One shared cell unrolled across tokens"
                    titleFontSize={25}
                    c={c}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <TextLabel
                        c={c}
                        fontSize={23}
                        color={c.textSecondary}
                        text="Shared W_x (2x3) and W_h (2x2) step the state forward"
                    />
                    <Row gap={12} align="center">
                        {renderCard(CHAIN[0])}
                        {arrowSvg}
                        {renderCard(CHAIN[1])}
                    </Row>
                    <Row gap={12} align="center">
                        {renderCard(CHAIN[2])}
                        {arrowSvg}
                        {renderCard(CHAIN[3])}
                    </Row>
                </Panel>
                <Row gap={12} align="stretch">
                    <Panel
                        title="Head output from h_3"
                        titleFontSize={25}
                        c={c}
                        width={364}
                        padding={12}
                        gap={10}
                        tone="green"
                    >
                        <TextLabel
                            c={c}
                            fontSize={23}
                            color={c.textSecondary}
                            text="Logits [0.076, 0.368, 0.170]"
                        />
                        {renderBars(PROBS, 0.45)}
                        <TextLabel
                            c={c}
                            fontSize={23}
                            mono
                            color={c.textMuted}
                            text="Top class: Positive"
                        />
                    </Panel>
                    <Panel
                        title="Backward factor |dh_3/dx_k|"
                        titleFontSize={25}
                        c={c}
                        width={364}
                        padding={12}
                        gap={10}
                        tone="warm"
                    >
                        <TextLabel
                            c={c}
                            fontSize={23}
                            color={c.textSecondary}
                            text="Scalar tanh chain over 3 steps"
                        />
                        {renderBars(SENS, 0.36)}
                        <TextLabel
                            c={c}
                            fontSize={23}
                            mono
                            color={c.textMuted}
                            text="Step 1: 9.4% of Step 3"
                        />
                    </Panel>
                </Row>
            </Column>
        </Canvas>
    )
}
