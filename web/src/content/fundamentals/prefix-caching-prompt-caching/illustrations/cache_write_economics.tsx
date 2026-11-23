import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    defineIllustration,
    withColorAlpha,
    type ThemeColors,
} from 'vizmatic'

export const width = 840
export const height = 580
export const alt =
    'Across four 6,000-token requests with 1.25x writes and 0.10x reads, repeated partial writes raise input cost from 24,000 to 26,467.2 units (+10.3%). Full-prefix hits recover the 1.25x five-minute write premium in one read and the 2.00x one-hour premium in two reads.'

const FONT = 26

function EconomicsChart({ c }: { c: ThemeColors }) {
    const scaleMax = 28000
    const barLeft = 220
    const barMaxW = 370
    const uncachedW = Math.round((24000 / scaleMax) * barMaxW)
    const cachedW = Math.round((26467.2 / scaleMax) * barMaxW)

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={28} y={18} width={784} height={40}>
                <TextLabel
                    c={c}
                    text="Write premiums need enough full-prefix hits"
                    fontSize={29}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={28} y={60} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="4 x 6,000 tokens (write 1.25x, read 0.10x)"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={112}
                        width={784}
                        height={196}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={barLeft}
                        y={168}
                        width={uncachedW}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.neutralLight, 0.7)}
                        stroke={c.borderLight}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={barLeft}
                        y={218}
                        width={cachedW}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.critical, 0.28)}
                        stroke={c.criticalLight}
                        strokeWidth={2}
                    />
                    <VectorSegment
                        x1={barLeft + uncachedW}
                        y1={160}
                        x2={barLeft + uncachedW}
                        y2={260}
                        color={c.borderLight}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={328}
                        width={380}
                        height={224}
                        rx={12}
                        fill={withColorAlpha(c.positive, 0.1)}
                        stroke={c.positiveLight}
                        strokeWidth={1.8}
                    />
                    <SvgFrame
                        c={c}
                        x={432}
                        y={328}
                        width={380}
                        height={224}
                        rx={12}
                        fill={withColorAlpha(c.primary, 0.1)}
                        stroke={c.primaryLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={50}
                        y={426}
                        width={220}
                        height={24}
                        rx={5}
                        fill={withColorAlpha(c.positive, 0.35)}
                        stroke={c.positiveLight}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={454}
                        y={426}
                        width={320}
                        height={24}
                        rx={5}
                        fill={withColorAlpha(c.primary, 0.35)}
                        stroke={c.primaryLight}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>
            <CanvasItem x={48} y={124} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="Partial-hit ledger: misses rewrite R2..R4 suffixes"
                    fontSize={FONT}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={48} y={168} width={164} height={34}>
                <TextLabel c={c} text="Uncached" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={barLeft + uncachedW + 12} y={168} width={150} height={34}>
                <TextLabel c={c} text="24,000" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={48} y={218} width={164} height={34}>
                <TextLabel c={c} text="Partial cache" fontSize={FONT} color={c.criticalLight} />
            </CanvasItem>
            <CanvasItem x={barLeft + cachedW + 12} y={218} width={210} height={34}>
                <TextLabel
                    c={c}
                    text="26,467 (+10%)"
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.criticalLight}
                />
            </CanvasItem>
            <CanvasItem x={48} y={264} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="3 reads coincide with 10.3% higher input spend."
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={50} y={342} width={336} height={34}>
                <TextLabel c={c} text="5-min TTL (1.25x write)" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={50} y={382} width={336} height={34}>
                <TextLabel
                    c={c}
                    text="1.25 + 0.10 = 1.35x < 2.00x"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={50} y={464} width={336} height={34}>
                <TextLabel
                    c={c}
                    text="Breaks even at 1 full read"
                    fontSize={FONT}
                    color={c.positiveLight}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={50} y={504} width={336} height={34}>
                <TextLabel
                    c={c}
                    text="1 read after write: -33%"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={454} y={342} width={336} height={34}>
                <TextLabel c={c} text="1-hr TTL (2.00x write)" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={454} y={382} width={336} height={34}>
                <TextLabel
                    c={c}
                    text="2.00 + 2x0.10 = 2.20x < 3x"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={454} y={464} width={336} height={34}>
                <TextLabel
                    c={c}
                    text="Breaks even at 2 full reads"
                    fontSize={FONT}
                    color={c.primaryLight}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={454} y={504} width={336} height={34}>
                <TextLabel
                    c={c}
                    text="2 reads after write: -27%"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
        </Board>
    )
}

const illustration = defineIllustration((c) => <EconomicsChart c={c} />)

export const create = illustration.create
export default illustration.default
