import React from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
    withColorAlpha,
} from 'vizmatic'
import type { ThemeColors, ToneName } from 'vizmatic'

export const alt =
    'Paired score bars and rank-swap slopegraph for query "How does RoPE encode token position?". Stage 1 bi-encoder shortlist at K=3 ranks abs-pos-bias #1 (0.84), rope-rotation #2 (0.81), and rope-theta-base #3 (0.78), excluding nf4-quant #4 (0.10, cross score 0.05 unused). Stage 2 cross-encoder reranking swaps the order to rope-rotation #1 (0.96) and rope-theta-base #2 (0.91) inside top_k=2, dropping abs-pos-bias to #3 (0.21).'

export const width = 820
export const height = 470

interface Candidate {
    id: string
    biScore: number
    biRank: number
    crossScore: number | null
    crossRank: number | null
    tone: ToneName
}

const candidates: Candidate[] = [
    { id: 'abs-pos-bias', biScore: 0.84, biRank: 0, crossScore: 0.21, crossRank: 2, tone: 'warm' },
    { id: 'rope-rotation', biScore: 0.81, biRank: 1, crossScore: 0.96, crossRank: 0, tone: 'green' },
    { id: 'rope-theta-base', biScore: 0.78, biRank: 2, crossScore: 0.91, crossRank: 1, tone: 'blue' },
    { id: 'nf4-quant', biScore: 0.1, biRank: 3, crossScore: null, crossRank: null, tone: 'neutral' },
]

const illustration = defineIllustration((c: ThemeColors) => {
    const boardW = 788
    const boardH = 432

    // Generous horizontal layout so every label fits cleanly on 1 line
    const leftCardX = 4
    const leftCardW = 342
    const leftLabelX = 12
    const leftLabelW = 166
    const leftBarX = 186
    const barMaxW = 104
    const leftValX = 296

    const slopeLeftX = 354
    const slopeRightX = 434

    const rightCardX = 442
    const rightCardW = 342
    const rightBarX = 456
    const rightValX = 568
    const rightLabelX = 616
    const rightLabelW = 160

    const rowY = [92, 160, 238, 340]
    const barH = 26
    const cutoffLeftY = 286
    const cutoffRightY = 200

    const greenInk = getReadableToneColor('green', c)
    const blueInk = getReadableToneColor('blue', c)

    const toneInk = (tone: ToneName) =>
        tone === 'neutral' ? c.textMuted : getReadableToneColor(tone, c)

    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardW,
        align: 'center',
        background: 'transparent',
        children: Board({
            c,
            width: boardW,
            height: boardH,
            background: 'transparent',
            children: [
                <CanvasItem key="svg-layer" x={0} y={0} width={boardW} height={boardH}>
                    <svg width={boardW} height={boardH} viewBox={`0 0 ${boardW} ${boardH}`}>
                        {/* Opaque theme-matched stage panels */}
                        <SvgFrame
                            c={c}
                            x={leftCardX}
                            y={48}
                            width={leftCardW}
                            height={346}
                            rx={12}
                            fill={c.bgCard}
                            stroke={c.borderSubtle}
                            strokeWidth={1.25}
                        />
                        <SvgFrame
                            c={c}
                            x={rightCardX}
                            y={48}
                            width={rightCardW}
                            height={346}
                            rx={12}
                            fill={c.bgCard}
                            stroke={c.borderSubtle}
                            strokeWidth={1.25}
                        />

                        {/* Stage 1 cutoff K = 3 */}
                        <line
                            x1={leftCardX + 12}
                            y1={cutoffLeftY}
                            x2={leftCardX + leftCardW - 12}
                            y2={cutoffLeftY}
                            stroke={blueInk}
                            strokeWidth={1.75}
                            strokeDasharray="5 4"
                            opacity={0.85}
                        />

                        {/* Stage 2 cutoff top_k = 2 */}
                        <line
                            x1={rightCardX + 12}
                            y1={cutoffRightY}
                            x2={rightCardX + rightCardW - 12}
                            y2={cutoffRightY}
                            stroke={greenInk}
                            strokeWidth={1.75}
                            strokeDasharray="5 4"
                            opacity={0.85}
                        />

                        {/* Stage 1 horizontal bars (scale 0.0 to 1.0) */}
                        {candidates.map((item) => {
                            const y = rowY[item.biRank]
                            const fill =
                                item.tone === 'neutral'
                                    ? withColorAlpha(c.textMuted, 0.55)
                                    : getToneColor(item.tone, c)
                            const barW = Math.max(8, item.biScore * barMaxW)
                            return (
                                <React.Fragment key={`bi-${item.id}`}>
                                    <SvgFrame
                                        c={c}
                                        x={leftBarX}
                                        y={y}
                                        width={barMaxW}
                                        height={barH}
                                        rx={5}
                                        fill={withColorAlpha(c.borderSubtle, 0.55)}
                                        stroke="none"
                                    />
                                    <SvgFrame
                                        c={c}
                                        x={leftBarX}
                                        y={y}
                                        width={barW}
                                        height={barH}
                                        rx={5}
                                        fill={fill}
                                        stroke="none"
                                    />
                                </React.Fragment>
                            )
                        })}

                        {/* Stage 2 horizontal bars (scale 0.0 to 1.0) */}
                        {candidates
                            .filter((item) => item.crossRank !== null && item.crossScore !== null)
                            .map((item) => {
                                const y = rowY[item.crossRank as number]
                                const fill = getToneColor(item.tone, c)
                                const barW = Math.max(8, (item.crossScore as number) * barMaxW)
                                return (
                                    <React.Fragment key={`cross-${item.id}`}>
                                        <SvgFrame
                                            c={c}
                                            x={rightBarX}
                                            y={y}
                                            width={barMaxW}
                                            height={barH}
                                            rx={5}
                                            fill={withColorAlpha(c.borderSubtle, 0.55)}
                                            stroke="none"
                                        />
                                        <SvgFrame
                                            c={c}
                                            x={rightBarX}
                                            y={y}
                                            width={barW}
                                            height={barH}
                                            rx={5}
                                            fill={fill}
                                            stroke="none"
                                        />
                                    </React.Fragment>
                                )
                            })}

                        {/* Slopegraph Bezier connectors */}
                        {candidates.map((item) => {
                            const y1 = rowY[item.biRank] + barH / 2
                            if (item.crossRank === null) {
                                return (
                                    <g key={`slope-${item.id}`}>
                                        <line
                                            x1={slopeLeftX}
                                            y1={y1}
                                            x2={slopeLeftX + 40}
                                            y2={y1}
                                            stroke={c.textMuted}
                                            strokeWidth={2}
                                            strokeDasharray="4 4"
                                            opacity={0.75}
                                        />
                                        <line
                                            x1={slopeLeftX + 40}
                                            y1={y1 - 8}
                                            x2={slopeLeftX + 40}
                                            y2={y1 + 8}
                                            stroke={c.textMuted}
                                            strokeWidth={2.5}
                                            opacity={0.85}
                                        />
                                    </g>
                                )
                            }
                            const y2 = rowY[item.crossRank] + barH / 2
                            const cx1 = slopeLeftX + (slopeRightX - slopeLeftX) * 0.45
                            const cx2 = slopeLeftX + (slopeRightX - slopeLeftX) * 0.55
                            const stroke = getToneColor(item.tone, c)
                            const isDropped = item.crossRank >= 2
                            return (
                                <g key={`slope-${item.id}`}>
                                    <path
                                        d={`M ${slopeLeftX} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${slopeRightX} ${y2}`}
                                        fill="none"
                                        stroke={stroke}
                                        strokeWidth={isDropped ? 2.8 : 3.5}
                                        strokeDasharray={isDropped ? '6 4' : undefined}
                                        opacity={isDropped ? 0.85 : 0.95}
                                    />
                                    <SvgPoint
                                        cx={slopeLeftX}
                                        cy={y1}
                                        r={4.5}
                                        fill={stroke}
                                        stroke={c.bg}
                                        strokeWidth={1.5}
                                    />
                                    <SvgPoint
                                        cx={slopeRightX}
                                        cy={y2}
                                        r={4.5}
                                        fill={stroke}
                                        stroke={c.bg}
                                        strokeWidth={1.5}
                                    />
                                </g>
                            )
                        })}
                    </svg>
                </CanvasItem>,

                // Top query header
                <CanvasItem key="query-title" x={0} y={4} width={boardW} height={34}>
                    <TextLabel
                        c={c}
                        text='Query: "How does RoPE encode token position?"'
                        width={boardW}
                        fontSize={19}
                        fontWeight={800}
                        align="center"
                        color={c.textPrimary}
                    />
                </CanvasItem>,

                // Stage column headers
                <CanvasItem key="hdr-s1" x={18} y={56} width={312} height={26}>
                    <TextLabel
                        c={c}
                        text="Stage 1: Bi-Encoder (cosine)"
                        width={312}
                        fontSize={16}
                        fontWeight={800}
                        align="left"
                        color={blueInk}
                    />
                </CanvasItem>,
                <CanvasItem key="hdr-s2" x={456} y={56} width={312} height={26}>
                    <TextLabel
                        c={c}
                        text="Stage 2: Cross-Encoder"
                        width={312}
                        fontSize={16}
                        fontWeight={800}
                        align="left"
                        color={greenInk}
                    />
                </CanvasItem>,
                <CanvasItem key="hdr-swap" x={346} y={56} width={96} height={26}>
                    <TextLabel
                        c={c}
                        text="Rerank"
                        width={96}
                        fontSize={15}
                        fontWeight={750}
                        align="center"
                        color={c.textSecondary}
                    />
                </CanvasItem>,

                // Stage 1 labels + scores
                ...candidates.map((item) => {
                    const y = rowY[item.biRank]
                    const ink = toneInk(item.tone)
                    return (
                        <React.Fragment key={`s1-lbl-${item.id}`}>
                            <CanvasItem x={leftLabelX} y={y + 3} width={leftLabelW} height={24}>
                                <TextLabel
                                    c={c}
                                    text={`#${item.biRank + 1} ${item.id}`}
                                    width={leftLabelW}
                                    fontSize={13.5}
                                    fontWeight={item.tone === 'neutral' ? 600 : 750}
                                    align="right"
                                    color={item.tone === 'neutral' ? c.textMuted : c.textPrimary}
                                    mono
                                />
                            </CanvasItem>
                            <CanvasItem x={leftValX} y={y + 3} width={44} height={24}>
                                <TextLabel
                                    c={c}
                                    text={item.biScore.toFixed(2)}
                                    width={44}
                                    fontSize={15}
                                    fontWeight={800}
                                    align="left"
                                    color={ink}
                                    mono
                                />
                            </CanvasItem>
                        </React.Fragment>
                    )
                }),

                // Stage 1 K=3 cutoff tag
                <CanvasItem key="tag-k3" x={18} y={cutoffLeftY + 7} width={316} height={24}>
                    <TextLabel
                        c={c}
                        text="K = 3 shortlist cutoff (rank #4 excluded)"
                        width={316}
                        fontSize={13.5}
                        fontWeight={700}
                        align="left"
                        color={blueInk}
                    />
                </CanvasItem>,

                // Stage 2 scores + labels
                ...candidates
                    .filter((item) => item.crossRank !== null && item.crossScore !== null)
                    .map((item) => {
                        const y = rowY[item.crossRank as number]
                        const ink = toneInk(item.tone)
                        return (
                            <React.Fragment key={`s2-lbl-${item.id}`}>
                                <CanvasItem x={rightValX} y={y + 3} width={42} height={24}>
                                    <TextLabel
                                        c={c}
                                        text={(item.crossScore as number).toFixed(2)}
                                        width={42}
                                        fontSize={15}
                                        fontWeight={800}
                                        align="left"
                                        color={ink}
                                        mono
                                    />
                                </CanvasItem>
                                <CanvasItem x={rightLabelX} y={y + 3} width={rightLabelW} height={24}>
                                    <TextLabel
                                        c={c}
                                        text={`#${(item.crossRank as number) + 1} ${item.id}`}
                                        width={rightLabelW}
                                        fontSize={13.5}
                                        fontWeight={750}
                                        align="left"
                                        color={c.textPrimary}
                                        mono
                                    />
                                </CanvasItem>
                            </React.Fragment>
                        )
                    }),

                // Stage 2 top_k=2 cutoff tag
                <CanvasItem key="tag-topk" x={456} y={cutoffRightY + 6} width={316} height={24}>
                    <TextLabel
                        c={c}
                        text="top_k = 2 returned (below dropped)"
                        width={316}
                        fontSize={13.5}
                        fontWeight={700}
                        align="left"
                        color={greenInk}
                    />
                </CanvasItem>,

                // Unscored Stage 2 note for excluded nf4-quant
                <CanvasItem key="unscored-note" x={458} y={rowY[3] - 4} width={312} height={36}>
                    <BadgePill
                        c={c}
                        text="nf4-quant unscored (0.05 unused)"
                        tone="neutral"
                        width={310}
                        height={34}
                        fontSize={13.5}
                    />
                </CanvasItem>,

                // Scale ticks footer under Stage 1 and Stage 2 bars
                <CanvasItem key="scale-l0" x={leftBarX - 4} y={402} width={36} height={22}>
                    <TextLabel
                        c={c}
                        text="0.0"
                        width={36}
                        fontSize={13}
                        color={c.textMuted}
                        align="left"
                        mono
                    />
                </CanvasItem>,
                <CanvasItem key="scale-l1" x={leftBarX + barMaxW - 28} y={402} width={36} height={22}>
                    <TextLabel
                        c={c}
                        text="1.0"
                        width={36}
                        fontSize={13}
                        color={c.textMuted}
                        align="right"
                        mono
                    />
                </CanvasItem>,
                <CanvasItem key="scale-r0" x={rightBarX - 4} y={402} width={36} height={22}>
                    <TextLabel
                        c={c}
                        text="0.0"
                        width={36}
                        fontSize={13}
                        color={c.textMuted}
                        align="left"
                        mono
                    />
                </CanvasItem>,
                <CanvasItem key="scale-r1" x={rightBarX + barMaxW - 28} y={402} width={36} height={22}>
                    <TextLabel
                        c={c}
                        text="1.0"
                        width={36}
                        fontSize={13}
                        color={c.textMuted}
                        align="right"
                        mono
                    />
                </CanvasItem>,
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
