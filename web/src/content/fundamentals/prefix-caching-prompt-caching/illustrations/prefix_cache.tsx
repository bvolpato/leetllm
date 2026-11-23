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
export const height = 580
export const alt =
    'A proportional 6,000-position prefix contains 600 instruction, 4,200 repository-guide, 800 tool-schema, and 400 example positions. One cold request computes 6,048 tokens and stores 375 blocks of 16 positions. Two warm requests skip the 6,000 shared tokens and compute only 37 and 51 tail tokens, cutting total fresh work from 18,136 to 6,136.'

const FONT = 26

function PrefixCacheDiagram({ c }: { c: ThemeColors }) {
    const railX = 188
    const railW = 408
    const prefixW = Math.round((6000 / 6048) * railW)
    const segs = [
        { w: 40, color: c.primaryLight },
        { w: 284, color: c.infoLight },
        { w: 54, color: c.violetLight },
        { w: 28, color: c.warningLight },
    ]
    const reqs = [
        {
            y: 266,
            name: 'Q1 cold',
            cached: false,
            tailW: 14,
            tailLbl: '6,048 fresh',
        },
        { y: 326, name: 'Q2 warm', cached: true, tailW: 10, tailLbl: '37 fresh' },
        { y: 386, name: 'Q3 warm', cached: true, tailW: 14, tailLbl: '51 fresh' },
    ]

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={28} y={18} width={784} height={40}>
                <TextLabel
                    c={c}
                    text="Prefix caching skips shared prefill once hot"
                    fontSize={29}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={28} y={60} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="6,000-token prefix (375 blocks x 16) + question tail"
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
                        height={110}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    {
                        segs.reduce<{ x: number; nodes: React.ReactElement[] }>(
                            (acc, seg) => {
                                acc.nodes.push(
                                    <rect
                                        key={`${acc.x}-${seg.w}`}
                                        x={acc.x}
                                        y={168}
                                        width={seg.w - 3}
                                        height={32}
                                        rx={5}
                                        fill={withColorAlpha(seg.color, 0.34)}
                                        stroke={seg.color}
                                        strokeWidth={1.5}
                                    />,
                                )
                                return { x: acc.x + seg.w, nodes: acc.nodes }
                            },
                            { x: railX, nodes: [] },
                        ).nodes
                    }
                    <SvgFrame
                        c={c}
                        x={28}
                        y={240}
                        width={784}
                        height={210}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    {reqs.map((req) => (
                        <React.Fragment key={req.name}>
                            <rect
                                x={railX}
                                y={req.y}
                                width={prefixW}
                                height={34}
                                rx={6}
                                fill={
                                    req.cached
                                        ? withColorAlpha(c.positive, 0.16)
                                        : withColorAlpha(c.primary, 0.34)
                                }
                                stroke={req.cached ? c.positiveLight : c.primaryLight}
                                strokeWidth={1.8}
                                strokeDasharray={req.cached ? '6 4' : undefined}
                            />
                            <rect
                                x={railX + prefixW + 3}
                                y={req.y}
                                width={req.tailW}
                                height={34}
                                rx={4}
                                fill={c.warningLight}
                            />
                        </React.Fragment>
                    ))}
                </svg>
            </CanvasItem>
            <CanvasItem x={48} y={124} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="Parts: 600 inst + 4,200 guide + 800 tools + 400 ex"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={48} y={168} width={132} height={34}>
                <TextLabel c={c} text="6,000 pos" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            {reqs.map((req) => (
                <React.Fragment key={`${req.name}-txt`}>
                    <CanvasItem x={48} y={req.y} width={132} height={34}>
                        <TextLabel c={c} text={req.name} fontSize={FONT} fontWeight={700} />
                    </CanvasItem>
                    <CanvasItem x={railX + 10} y={req.y} width={prefixW - 18} height={34}>
                        <TextLabel
                            c={c}
                            text={
                                req.cached ? 'reuses 6,000 cached tokens' : 'stores 375 KV blocks'
                            }
                            fontSize={FONT}
                            color={req.cached ? c.positiveLight : c.textPrimary}
                        />
                    </CanvasItem>
                    <CanvasItem x={railX + prefixW + 24} y={req.y} width={180} height={34}>
                        <TextLabel
                            c={c}
                            text={req.tailLbl}
                            fontSize={FONT}
                            fontWeight={700}
                            color={c.warningLight}
                        />
                    </CanvasItem>
                </React.Fragment>
            ))}
            <CanvasItem x={28} y={472} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="Fresh input falls from 18,136 to 6,136 tokens (-66%)."
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.positiveLight}
                />
            </CanvasItem>
            <CanvasItem x={28} y={514} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="Editing token 0 invalidates every downstream block hash."
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
        </Board>
    )
}

const illustration = defineIllustration((c) => <PrefixCacheDiagram c={c} />)

export const create = illustration.create
export default illustration.default
