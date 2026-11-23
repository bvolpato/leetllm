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
    'Comparison across four edge configurations under a 4 GB RAM budget, 50 GB/s memory bus, and 18 tokens/s decode floor: 8B FP16 needs 16 GB and exceeds RAM at 3.1 t/s; 3.8B INT8 takes 3.8 GB weights plus KV and hits 13.2 t/s; distilled 3.8B INT4 fits in 1.9 GB and clears 18 t/s at 26.3 t/s; distilled 1.7B INT4 with a 0.3B speculative draft cuts active memory to 1.1 GB and raises effective decode speed past 38 t/s.'

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

function EdgeTradeoffChart({ c }: { c: ThemeColors }) {
    const rows = [
        {
            name: '8B FP16 (Teacher)',
            memText: '16 GB OOM',
            memW: 200,
            tpsText: '3.1 t/s',
            tpsW: 16,
            tone: c.critical,
            stroke: c.criticalLight,
        },
        {
            name: '3.8B INT8',
            memText: '3.8 GB',
            memW: 169,
            tpsText: '13.2 t/s',
            tpsW: 59,
            tone: c.warning,
            stroke: c.warningLight,
        },
        {
            name: '3.8B INT4 (GQA)',
            memText: '1.9 GB',
            memW: 84,
            tpsText: '26.3 t/s',
            tpsW: 117,
            tone: c.primary,
            stroke: c.primaryLight,
        },
        {
            name: '1.7B + 0.3B Draft',
            memText: '1.1 GB',
            memW: 49,
            tpsText: '38+ t/s',
            tpsW: 169,
            tone: c.positive,
            stroke: c.positiveLight,
        },
    ]

    return (
        <Board c={c} width={width} height={height}>
            {L(c, 24, 16, 792, 38, 'Quantization and draft size trade memory for speed', {
                size: 28,
                weight: 700,
            })}
            {L(c, 24, 56, 792, 32, 'Budget: 4 GB RAM, 50 GB/s bus, 3.5 W, >= 18 t/s', {
                color: c.textMuted,
            })}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={24}
                        y={98}
                        width={388}
                        height={440}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <SvgFrame
                        c={c}
                        x={428}
                        y={98}
                        width={388}
                        height={440}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <line
                        x1={220}
                        y1={148}
                        x2={220}
                        y2={492}
                        stroke={c.warningLight}
                        strokeWidth={2}
                        strokeDasharray="6 5"
                    />
                    <line
                        x1={526}
                        y1={148}
                        x2={526}
                        y2={492}
                        stroke={c.positiveLight}
                        strokeWidth={2}
                        strokeDasharray="6 5"
                    />
                    {rows.map((r, i) => {
                        const yBar = 194 + i * 84
                        return (
                            <g key={r.name}>
                                <rect
                                    x={42}
                                    y={yBar}
                                    width={r.memW}
                                    height={26}
                                    rx={5}
                                    fill={withColorAlpha(r.tone, 0.28)}
                                    stroke={r.stroke}
                                    strokeWidth={1.8}
                                />
                                <rect
                                    x={446}
                                    y={yBar}
                                    width={r.tpsW}
                                    height={26}
                                    rx={5}
                                    fill={withColorAlpha(r.tone, 0.28)}
                                    stroke={r.stroke}
                                    strokeWidth={1.8}
                                />
                            </g>
                        )
                    })}
                </svg>
            </CanvasItem>
            {L(c, 42, 110, 352, 32, 'Weights vs 4 GB budget', { weight: 700 })}
            {L(c, 446, 110, 352, 32, '50 GB/s decode ceiling', { weight: 700 })}
            {rows.flatMap((r, i) => {
                const yText = 158 + i * 84
                return [
                    L(c, 42, yText, 352, 30, r.name, { weight: 600 }),
                    L(c, 250, yText + 34, 146, 30, r.memText, { color: r.stroke, weight: 600 }),
                    L(c, 446, yText, 352, 30, r.name, { weight: 600 }),
                    L(c, 654, yText + 34, 146, 30, r.tpsText, { color: r.stroke, weight: 600 }),
                ]
            })}
            {L(c, 150, 498, 140, 30, '4 GB cap', {
                color: c.warningLight,
                align: 'center',
                weight: 600,
            })}
            {L(c, 456, 498, 140, 30, '18 t/s floor', {
                color: c.positiveLight,
                align: 'center',
                weight: 600,
            })}
        </Board>
    )
}

const illustration = defineIllustration((c) => <EdgeTradeoffChart c={c} />)
export const create = illustration.create
export default illustration.default
