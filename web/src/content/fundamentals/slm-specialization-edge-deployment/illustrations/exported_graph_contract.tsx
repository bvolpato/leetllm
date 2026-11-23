import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    defineIllustration,
    withColorAlpha,
    type ThemeColors,
} from 'vizmatic'

export const width = 840
export const height = 520
export const alt =
    'NumericRouter clamps 3-feature rows to [-1, 1] and projects with weights [[-1,-1,-1],[1,1,1]], mapping [-0.5,-0.2,0.1] to logits [0.6,-0.6] (class 0) and [0.8,0.7,0.6] to [-2.1,2.1] (class 1). After save and reload of router.pt2, exported dynamic batch bounds accept feature width 3 across batches 1 through 8, reject width 4 and batch 9, whereas eager execution accepts batch 9.'

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
            fontSize={opts.size ?? 25}
            fontWeight={opts.weight ?? 500}
            color={opts.color ?? c.textPrimary}
            align={opts.align ?? 'left'}
            math={false}
        />
    </CanvasItem>
)

function ExportGraphChart({ c }: { c: ThemeColors }) {
    const checks = [
        {
            shape: 'b=1,2,5,8 (w=3)',
            outcome: 'PASS',
            note: 'Matches eager logits',
            tone: c.positive,
            stroke: c.positiveLight,
        },
        {
            shape: 'b=2, width=4',
            outcome: 'REJECT',
            note: 'Static width=3 fails',
            tone: c.critical,
            stroke: c.criticalLight,
        },
        {
            shape: 'b=9, width=3',
            outcome: 'REJECT',
            note: 'Max b=8; eager runs',
            tone: c.warning,
            stroke: c.warningLight,
        },
    ]

    return (
        <Board c={c} width={width} height={height}>
            {L(c, 24, 16, 792, 38, 'Saved .pt2 graph preserves declared shape bounds', {
                size: 28,
                weight: 700,
            })}
            {L(
                c,
                24,
                56,
                792,
                32,
                'NumericRouter exported to router.pt2 with dynamic batch in [1, 8]',
                {
                    color: c.textMuted,
                },
            )}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={24}
                        y={102}
                        width={384}
                        height={394}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <SvgFrame
                        c={c}
                        x={428}
                        y={102}
                        width={388}
                        height={394}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />

                    <SvgFrame
                        c={c}
                        x={44}
                        y={156}
                        width={344}
                        height={82}
                        rx={8}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1}
                    />
                    <rect
                        x={44}
                        y={156}
                        width={344}
                        height={82}
                        rx={8}
                        fill={withColorAlpha(c.info, 0.14)}
                        stroke={c.infoLight}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={44}
                        y={266}
                        width={344}
                        height={86}
                        rx={8}
                        fill={withColorAlpha(c.primary, 0.14)}
                        stroke={c.primaryLight}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={44}
                        y={380}
                        width={344}
                        height={96}
                        rx={8}
                        fill={withColorAlpha(c.positive, 0.14)}
                        stroke={c.positiveLight}
                        strokeWidth={1.5}
                    />
                    <VectorArrow
                        x1={216}
                        y1={238}
                        x2={216}
                        y2={264}
                        color={c.borderLight}
                        strokeWidth={2}
                    />
                    <VectorArrow
                        x1={216}
                        y1={352}
                        x2={216}
                        y2={378}
                        color={c.borderLight}
                        strokeWidth={2}
                    />

                    {checks.map((ch, i) => (
                        <g key={ch.shape}>
                            <rect
                                x={448}
                                y={156 + i * 110}
                                width={348}
                                height={92}
                                rx={8}
                                fill={withColorAlpha(ch.tone, 0.14)}
                                stroke={ch.stroke}
                                strokeWidth={1.5}
                            />
                        </g>
                    ))}
                </svg>
            </CanvasItem>
            {L(c, 44, 114, 344, 32, 'CPU forward pass', { weight: 700 })}
            {L(c, 60, 166, 312, 28, '1. Clamp input to [-1, 1]', { weight: 600 })}
            {L(c, 60, 198, 312, 28, 'x0=[-0.5,-0.2,0.1]', { color: c.textMuted })}

            {L(c, 60, 276, 312, 28, '2. Linear(3, 2) layer', { weight: 600 })}
            {L(c, 60, 308, 312, 28, 'w=[-1,-1,-1], [1,1,1]', { color: c.textMuted })}

            {L(c, 60, 390, 312, 28, '3. Logits -> argmax [0, 1]', { weight: 600 })}
            {L(c, 60, 422, 312, 28, '[0.6,-0.6] & [-2.1,2.1]', {
                color: c.positiveLight,
                weight: 600,
            })}

            {L(c, 448, 114, 348, 32, 'Reloaded router.pt2', { weight: 700 })}
            {checks.flatMap((ch, i) => {
                const y = 168 + i * 110
                return [
                    L(c, 464, y, 224, 30, ch.shape, { weight: 600 }),
                    L(c, 690, y, 90, 30, ch.outcome, {
                        color: ch.stroke,
                        align: 'right',
                        weight: 700,
                    }),
                    L(c, 464, y + 36, 316, 30, ch.note, { color: c.textMuted }),
                ]
            })}
        </Board>
    )
}

const illustration = defineIllustration((c) => <ExportGraphChart c={c} />)
export const create = illustration.create
export default illustration.default
