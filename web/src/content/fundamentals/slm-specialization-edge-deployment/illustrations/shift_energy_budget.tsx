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
export const height = 540
export const alt =
    'Across an 8-hour duty cycle generating 30,000 tokens plus 600 s prefill at 4 W and 1.2 W idle, Candidate A decodes for 1,666.7 s at 3.5 W (18 t/s) and uses 11.13 Wh total (1.62 Wh decode, 54 mWh per 1k tokens). Candidate B decodes for 3,000 s at 6 W (10 t/s) and uses 14.07 Wh total (5.00 Wh decode), leaving minimal headroom under a 15 Wh nominal battery.'

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

function ShiftEnergyChart({ c }: { c: ThemeColors }) {
    const barLeft = 48
    const scaleMaxWh = 16
    const maxW = 680
    const px = (wh: number) => Math.round((wh / scaleMaxWh) * maxW)
    const capX = barLeft + px(15)

    const cands = [
        {
            title: 'Candidate A: 3.5 W @ 18 t/s (1,667 s decode)',
            summary: '11.13 Wh total (54 mWh / 1k tok)',
            decodeWh: 1.62,
            prefillWh: 0.67,
            idleWh: 8.84,
            tone: c.positive,
            stroke: c.positiveLight,
        },
        {
            title: 'Candidate B: 6.0 W @ 10 t/s (3,000 s decode)',
            summary: '14.07 Wh total (167 mWh / 1k tok)',
            decodeWh: 5.0,
            prefillWh: 0.67,
            idleWh: 8.4,
            tone: c.warning,
            stroke: c.warningLight,
        },
    ]

    return (
        <Board c={c} width={width} height={height}>
            {L(c, 24, 16, 792, 38, 'Faster decode cuts shift energy even at higher watts', {
                size: 28,
                weight: 700,
            })}
            {L(c, 24, 56, 792, 32, '8h cycle: 30k tokens + 600 s @ 4 W prefill + 1.2 W idle', {
                color: c.textMuted,
            })}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={24}
                        y={102}
                        width={792}
                        height={378}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <line
                        x1={capX}
                        y1={134}
                        x2={capX}
                        y2={446}
                        stroke={c.criticalLight}
                        strokeWidth={2.5}
                        strokeDasharray="6 5"
                    />
                    {cands.map((cd, i) => {
                        const yBar = 202 + i * 158
                        const wPre = px(cd.prefillWh)
                        const wDec = px(cd.decodeWh)
                        const wIdle = px(cd.idleWh)
                        return (
                            <g key={cd.title}>
                                <rect
                                    x={barLeft}
                                    y={yBar}
                                    width={wPre}
                                    height={38}
                                    rx={4}
                                    fill={withColorAlpha(c.violet, 0.35)}
                                    stroke={c.violetLight}
                                    strokeWidth={1.5}
                                />
                                <rect
                                    x={barLeft + wPre + 2}
                                    y={yBar}
                                    width={wDec}
                                    height={38}
                                    rx={4}
                                    fill={withColorAlpha(cd.tone, 0.38)}
                                    stroke={cd.stroke}
                                    strokeWidth={1.8}
                                />
                                <rect
                                    x={barLeft + wPre + wDec + 4}
                                    y={yBar}
                                    width={wIdle}
                                    height={38}
                                    rx={4}
                                    fill={withColorAlpha(c.info, 0.24)}
                                    stroke={c.infoLight}
                                    strokeWidth={1.5}
                                />
                            </g>
                        )
                    })}
                </svg>
            </CanvasItem>
            {cands.flatMap((cd, i) => {
                const yTop = 126 + i * 158
                return [
                    L(c, 48, yTop, 740, 30, cd.title, { weight: 700 }),
                    L(c, 48, yTop + 34, 620, 30, cd.summary, { color: cd.stroke, weight: 600 }),
                    L(
                        c,
                        48,
                        yTop + 124,
                        740,
                        30,
                        `Prefill 0.67 Wh   |   Decode ${cd.decodeWh.toFixed(2)} Wh   |   Idle ${cd.idleWh.toFixed(2)} Wh`,
                        {
                            color: c.textMuted,
                        },
                    ),
                ]
            })}
            {L(c, capX - 110, 488, 220, 32, '15 Wh battery', {
                color: c.criticalLight,
                align: 'center',
                weight: 700,
            })}
            {L(c, 48, 488, 120, 32, '0 Wh', { color: c.textMuted })}
        </Board>
    )
}

const illustration = defineIllustration((c) => <ShiftEnergyChart c={c} />)
export const create = illustration.create
export default illustration.default
