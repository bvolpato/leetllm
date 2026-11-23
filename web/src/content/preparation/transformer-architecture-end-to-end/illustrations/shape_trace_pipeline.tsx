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
export const height = 520
export const alt =
    'One causal attention read for query the with vector 0.2, 1.2. On the left, dot scores 0.20, 1.28, and 0.96 scale by square root of 2 to 0.14, 0.91, and 0.68, producing softmax weights 0.21, 0.44, and 0.35 while future token result is masked to zero. On the right, a 2D plot places the three value vectors at triangle corners and the weighted output 0.34, 0.65 inside the simplex.'

const keyRows = [
    { token: 'function', dot: '0.20', scaled: '0.14', weight: 0.21, v: '[1, 0]', vx: 1.0, vy: 0.0 },
    {
        token: 'returns',
        dot: '1.28',
        scaled: '0.91',
        weight: 0.44,
        v: '[0.3, 1]',
        vx: 0.3,
        vy: 1.0,
    },
    { token: 'the', dot: '0.96', scaled: '0.68', weight: 0.35, v: '[0, 0.6]', vx: 0.0, vy: 0.6 },
] as const

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('critical', c)
    const blueFill = getToneFill('blue', c)
    const warmFill = getToneFill('warm', c)

    const plotW = 280
    const plotH = 230
    const px = (v: number) => 28 + v * 224
    const py = (v: number) => 204 - v * 176
    const triPoints = keyRows.map((r) => `${px(r.vx)},${py(r.vy)}`).join(' ')

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column width={740}>
                <Row gap={12} wrap={false} align="stretch">
                    <Panel
                        title="Query 'the' q=[0.2, 1.2]"
                        titleFontSize={24}
                        c={c}
                        width={406}
                        padding={12}
                        gap={8}
                        tone="blue"
                    >
                        <Column gap={8}>
                            {keyRows.map((item) => {
                                const barW = Math.round(item.weight * 170)
                                return (
                                    <div
                                        key={item.token}
                                        style={{
                                            padding: '7px 9px',
                                            borderRadius: 8,
                                            border: `1.5px solid ${c.borderSubtle}`,
                                            backgroundColor: c.bgCardAlt,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 4,
                                        }}
                                    >
                                        <Row
                                            gap={6}
                                            wrap={false}
                                            align="center"
                                            justify="space-between"
                                        >
                                            <TextLabel
                                                c={c}
                                                text={item.token}
                                                fontSize={23}
                                                fontWeight={650}
                                                color={blue}
                                                width={110}
                                                math={false}
                                            />
                                            <TextLabel
                                                c={c}
                                                text={`dot ${item.dot} | sc ${item.scaled}`}
                                                fontSize={23}
                                                color={c.textSecondary}
                                                width={236}
                                                align="right"
                                                math={false}
                                            />
                                        </Row>
                                        <Row
                                            gap={6}
                                            wrap={false}
                                            align="center"
                                            justify="space-between"
                                        >
                                            <TextLabel
                                                c={c}
                                                text={`v=${item.v}`}
                                                fontSize={23}
                                                color={c.textSecondary}
                                                width={120}
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
                                                    width={barW}
                                                    height={12}
                                                    rx={4}
                                                    fill={blue}
                                                />
                                            </svg>
                                            <TextLabel
                                                c={c}
                                                text={item.weight.toFixed(2)}
                                                fontSize={23}
                                                fontWeight={700}
                                                color={blue}
                                                width={58}
                                                align="right"
                                                math={false}
                                            />
                                        </Row>
                                    </div>
                                )
                            })}
                            <div
                                style={{
                                    padding: '8px 9px',
                                    borderRadius: 8,
                                    border: `1.5px dashed ${red}`,
                                    backgroundColor: c.bgCardAlt,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <TextLabel
                                    c={c}
                                    text="result (future)"
                                    fontSize={23}
                                    fontWeight={650}
                                    color={red}
                                    width={178}
                                    math={false}
                                />
                                <TextLabel
                                    c={c}
                                    text="masked -> 0.00"
                                    fontSize={23}
                                    color={c.textSecondary}
                                    width={174}
                                    align="right"
                                    math={false}
                                />
                            </div>
                        </Column>
                    </Panel>

                    <Panel
                        title="Value mixture in 2D hull"
                        titleFontSize={24}
                        c={c}
                        width={322}
                        padding={12}
                        gap={8}
                        tone="warm"
                    >
                        <Column gap={8} align="center">
                            <div
                                style={{
                                    borderRadius: 8,
                                    border: `1.5px solid ${c.borderSubtle}`,
                                    backgroundColor: c.bgCardAlt,
                                    padding: 4,
                                }}
                            >
                                <svg width={plotW} height={plotH} viewBox={`0 0 ${plotW} ${plotH}`}>
                                    <line
                                        x1={28}
                                        y1={204}
                                        x2={266}
                                        y2={204}
                                        stroke={c.textMuted}
                                        strokeWidth={1.6}
                                    />
                                    <line
                                        x1={28}
                                        y1={204}
                                        x2={28}
                                        y2={16}
                                        stroke={c.textMuted}
                                        strokeWidth={1.6}
                                    />
                                    <polygon
                                        points={triPoints}
                                        fill={blueFill}
                                        stroke={blue}
                                        strokeWidth={2.2}
                                    />
                                    {keyRows.map((item) => (
                                        <g key={item.token}>
                                            <line
                                                x1={px(item.vx)}
                                                y1={py(item.vy)}
                                                x2={px(0.34)}
                                                y2={py(0.65)}
                                                stroke={warm}
                                                strokeWidth={1.4}
                                                strokeDasharray="4,4"
                                            />
                                            <circle
                                                cx={px(item.vx)}
                                                cy={py(item.vy)}
                                                r={7}
                                                fill={blue}
                                            />
                                        </g>
                                    ))}
                                    <circle
                                        cx={px(0.34)}
                                        cy={py(0.65)}
                                        r={10}
                                        fill={warm}
                                        stroke={c.bgCard}
                                        strokeWidth={2}
                                    />
                                </svg>
                            </div>
                            <div
                                style={{
                                    width: 292,
                                    padding: '8px 10px',
                                    borderRadius: 8,
                                    border: `1.5px solid ${warm}`,
                                    backgroundColor: warmFill,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                <TextLabel
                                    c={c}
                                    text="Blue corners: value rows"
                                    fontSize={23}
                                    fontWeight={650}
                                    color={blue}
                                    width={272}
                                    math={false}
                                />
                                <TextLabel
                                    c={c}
                                    text="Read = [0.34, 0.65]"
                                    fontSize={23}
                                    fontWeight={700}
                                    color={warm}
                                    width={272}
                                    math={false}
                                />
                                <TextLabel
                                    c={c}
                                    text="Stays inside triangle"
                                    fontSize={23}
                                    color={c.textSecondary}
                                    width={272}
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
