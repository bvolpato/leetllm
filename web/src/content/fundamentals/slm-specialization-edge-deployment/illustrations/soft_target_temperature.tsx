import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    defineIllustration,
    withColorAlpha,
    type ThemeColors,
} from 'vizmatic'

export const width = 840
export const height = 560
export const alt =
    'Aligned probability bars on a 0 to 1 scale compare one-hot target [1, 0, 0] with teacher logits [4, 2, 1] at temperatures 1 and 3. At T=1, token probabilities are 0.844, 0.114, and 0.042 with B/C odds exp(1) = 2.72. At T=3, probabilities flatten to 0.532, 0.273, and 0.196 with B/C odds exp(1/3) = 1.40 while keeping A > B > C.'

const L = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    opts: {
        size?: number
        weight?: number
        color?: string
        align?: 'left' | 'center' | 'right'
    } = {},
) => (
    <CanvasItem key={`${x}-${y}-${text}`} x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={opts.size ?? 26}
            fontWeight={opts.weight ?? 500}
            color={opts.color ?? c.textPrimary}
            align={opts.align ?? 'left'}
            math={false}
        />
    </CanvasItem>
)

function SoftTargetChart({ c }: { c: ThemeColors }) {
    const groups = [
        {
            title: 'One-hot target',
            note: 'Drops B/C ratio',
            bars: [
                { tok: 'A', p: 1.0, tone: c.primary, stroke: c.primaryLight },
                { tok: 'B', p: 0.0, tone: c.neutralLight, stroke: c.borderLight },
                { tok: 'C', p: 0.0, tone: c.neutralLight, stroke: c.borderLight },
            ],
        },
        {
            title: 'Teacher T = 1',
            note: 'Odds B/C = 2.72',
            bars: [
                { tok: 'A', p: 0.844, tone: c.primary, stroke: c.primaryLight },
                { tok: 'B', p: 0.114, tone: c.info, stroke: c.infoLight },
                { tok: 'C', p: 0.042, tone: c.violet, stroke: c.violetLight },
            ],
        },
        {
            title: 'Teacher T = 3',
            note: 'Odds B/C = 1.40',
            bars: [
                { tok: 'A', p: 0.532, tone: c.primary, stroke: c.primaryLight },
                { tok: 'B', p: 0.273, tone: c.positive, stroke: c.positiveLight },
                { tok: 'C', p: 0.196, tone: c.violet, stroke: c.violetLight },
            ],
        },
    ]

    const barLeft = 340
    const barMaxW = 356

    return (
        <Board c={c} width={width} height={height}>
            {L(c, 24, 16, 792, 38, 'Temperature spreads mass to runner-up tokens', {
                size: 29,
                weight: 700,
            })}
            {L(c, 24, 56, 792, 32, 'Logits [4, 2, 1]: rank A > B > C stays intact as T rises', {
                color: c.textMuted,
            })}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {groups.map((g, gi) => {
                        const gy = 102 + gi * 148
                        return (
                            <g key={g.title}>
                                <SvgFrame
                                    c={c}
                                    x={24}
                                    y={gy}
                                    width={792}
                                    height={134}
                                    rx={12}
                                    fill={c.bgCard}
                                    stroke={c.border}
                                    strokeWidth={1.5}
                                />
                                {g.bars.map((b, bi) => {
                                    const by = gy + 18 + bi * 36
                                    const w = Math.max(Math.round(b.p * barMaxW), 4)
                                    return (
                                        <rect
                                            key={b.tok}
                                            x={barLeft}
                                            y={by}
                                            width={w}
                                            height={26}
                                            rx={5}
                                            fill={withColorAlpha(b.tone, b.p > 0 ? 0.34 : 0.15)}
                                            stroke={b.stroke}
                                            strokeWidth={1.8}
                                        />
                                    )
                                })}
                            </g>
                        )
                    })}
                </svg>
            </CanvasItem>
            {groups.flatMap((g, gi) => {
                const gy = 102 + gi * 148
                return [
                    L(c, 44, gy + 28, 240, 32, g.title, { weight: 700 }),
                    L(c, 44, gy + 66, 250, 32, g.note, { color: c.textMuted }),
                    ...g.bars.flatMap((b, bi) => {
                        const by = gy + 14 + bi * 36
                        const xVal = barLeft + Math.max(Math.round(b.p * barMaxW), 4) + 12
                        return [
                            L(c, 300, by, 32, 30, b.tok, { weight: 700 }),
                            L(c, xVal, by, 96, 30, b.p.toFixed(3), {
                                color: b.stroke,
                                weight: 600,
                            }),
                        ]
                    }),
                ]
            })}
        </Board>
    )
}

const illustration = defineIllustration((c) => <SoftTargetChart c={c} />)
export const create = illustration.create
export default illustration.default
