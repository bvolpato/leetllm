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
    'A compact decoder processes the prompt function returns the. Three token IDs map to a 3 by 4 matrix of positioned vectors, pass through repeated causal decoder blocks while keeping shape 3 by 4, and multiply by a vocabulary head to yield 3 by 6 logits. The last row converts to next-token probabilities: result 35.3 percent, value 27.3, None 17.6, the 10.4, returns 6.9, and function 2.5.'

const probs = [
    { token: 'result', pct: 35.3, hot: true },
    { token: 'value', pct: 27.3, hot: false },
    { token: 'None', pct: 17.6, hot: false },
    { token: 'the', pct: 10.4, hot: false },
    { token: 'returns', pct: 6.9, hot: false },
    { token: 'function', pct: 2.5, hot: false },
] as const

function MatrixGrid({
    rows,
    cols,
    cell,
    stroke,
    hotStroke,
    hotFill,
}: {
    rows: number
    cols: number
    cell: number
    stroke: string
    hotStroke?: string
    hotFill?: string
}) {
    const step = cell + 3
    const w = cols * step
    const h = rows * step
    const rects: React.ReactNode[] = []
    for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
            const isHot = Boolean(hotStroke && r === rows - 1)
            rects.push(
                <rect
                    key={`${r}-${col}`}
                    x={col * step + 1}
                    y={r * step + 1}
                    width={cell}
                    height={cell}
                    rx={3}
                    fill={isHot ? (hotFill ?? 'none') : 'none'}
                    stroke={isHot ? hotStroke : stroke}
                    strokeWidth={1.6}
                />,
            )
        }
    }
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            {rects}
        </svg>
    )
}

function StepArrow({ color }: { color: string }) {
    return (
        <svg width={20} height={24} viewBox="0 0 20 24">
            <line x1={1} y1={12} x2={13} y2={12} stroke={color} strokeWidth={2.4} />
            <polygon points="12,6 19,12 12,18" fill={color} />
        </svg>
    )
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const warmFill = getToneFill('warm', c)
    const blueFill = getToneFill('blue', c)

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={10} width={740}>
                <Panel
                    title="1. Forward shape trace: 'function returns the'"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <Row gap={6} wrap={false} align="center" justify="space-between">
                        <div
                            style={{
                                width: 146,
                                padding: '8px 6px',
                                borderRadius: 8,
                                border: `1.5px solid ${blue}`,
                                backgroundColor: blueFill,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="Embed + Pos"
                                fontSize={23}
                                fontWeight={650}
                                color={blue}
                                align="center"
                                width={132}
                                math={false}
                            />
                            <MatrixGrid rows={3} cols={4} cell={16} stroke={blue} />
                            <TextLabel
                                c={c}
                                text="[3, 4]"
                                fontSize={23}
                                color={c.textSecondary}
                                align="center"
                                width={132}
                                math={false}
                            />
                        </div>
                        <StepArrow color={blue} />
                        <div
                            style={{
                                width: 178,
                                padding: '10px 6px',
                                borderRadius: 8,
                                border: `1.5px solid ${purple}`,
                                backgroundColor: c.bgCardAlt,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="Decoder Blocks"
                                fontSize={23}
                                fontWeight={650}
                                color={purple}
                                align="center"
                                width={164}
                                math={false}
                            />
                            <TextLabel
                                c={c}
                                text="Causal Attn + FFN"
                                fontSize={23}
                                color={c.textSecondary}
                                align="center"
                                width={164}
                                math={false}
                            />
                            <TextLabel
                                c={c}
                                text="keeps [3, 4]"
                                fontSize={23}
                                fontWeight={650}
                                color={purple}
                                align="center"
                                width={164}
                                math={false}
                            />
                        </div>
                        <StepArrow color={warm} />
                        <div
                            style={{
                                width: 170,
                                padding: '8px 6px',
                                borderRadius: 8,
                                border: `1.5px solid ${warm}`,
                                backgroundColor: c.bgCardAlt,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="Norm + Head"
                                fontSize={23}
                                fontWeight={650}
                                color={warm}
                                align="center"
                                width={156}
                                math={false}
                            />
                            <MatrixGrid
                                rows={3}
                                cols={6}
                                cell={14}
                                stroke={blue}
                                hotStroke={warm}
                                hotFill={warmFill}
                            />
                            <TextLabel
                                c={c}
                                text="[3, 6] row 2"
                                fontSize={23}
                                fontWeight={650}
                                color={warm}
                                align="center"
                                width={156}
                                math={false}
                            />
                        </div>
                        <StepArrow color={warm} />
                        <div
                            style={{
                                width: 132,
                                padding: '10px 6px',
                                borderRadius: 8,
                                border: `1.5px solid ${warm}`,
                                backgroundColor: warmFill,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <TextLabel
                                c={c}
                                text="Greedy Top"
                                fontSize={23}
                                fontWeight={650}
                                color={warm}
                                align="center"
                                width={118}
                                math={false}
                            />
                            <TextLabel
                                c={c}
                                text="result"
                                fontSize={24}
                                fontWeight={700}
                                color={c.textPrimary}
                                align="center"
                                width={118}
                                math={false}
                            />
                            <TextLabel
                                c={c}
                                text="logit 1.382"
                                fontSize={23}
                                color={warm}
                                align="center"
                                width={118}
                                math={false}
                            />
                        </div>
                    </Row>
                </Panel>

                <Panel
                    title="2. Last-row next-token probabilities (6-word head)"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={6}
                    tone="warm"
                >
                    <Column gap={5}>
                        {probs.map((item) => {
                            const barW = Math.round((item.pct / 40) * 430)
                            const barColor = item.hot ? warm : blue
                            return (
                                <Row key={item.token} gap={10} wrap={false} align="center">
                                    <TextLabel
                                        c={c}
                                        text={item.token}
                                        fontSize={23}
                                        fontWeight={item.hot ? 700 : 500}
                                        color={item.hot ? warm : c.textPrimary}
                                        width={126}
                                        align="right"
                                        math={false}
                                    />
                                    <svg width={440} height={22} viewBox="0 0 440 22">
                                        <rect
                                            x={0}
                                            y={4}
                                            width={440}
                                            height={14}
                                            rx={5}
                                            fill={c.bgSubtle}
                                            stroke={c.borderSubtle}
                                            strokeWidth={1}
                                        />
                                        <rect
                                            x={0}
                                            y={4}
                                            width={barW}
                                            height={14}
                                            rx={5}
                                            fill={barColor}
                                        />
                                    </svg>
                                    <TextLabel
                                        c={c}
                                        text={`${item.pct.toFixed(1)}%`}
                                        fontSize={23}
                                        fontWeight={item.hot ? 700 : 500}
                                        color={item.hot ? warm : c.textSecondary}
                                        width={106}
                                        align="right"
                                        math={false}
                                    />
                                </Row>
                            )
                        })}
                    </Column>
                </Panel>
            </Column>
        </Canvas>
    )
}

export default create('dark')
