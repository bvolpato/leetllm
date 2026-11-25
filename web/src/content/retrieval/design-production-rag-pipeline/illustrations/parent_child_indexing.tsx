import React from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 920
export const height = 470
export const alt =
    'A scaled 0 to 512 token document span compares four 128-token child chunks against their full 512-token parent section batch-api-sec4-v2. Query similarity matches Child 2 (tokens 128 to 256, 20,000 req/file ceiling, cos=0.89), while the dependent 100 MB payload cap sits in Child 3 (tokens 256 to 384). Following parent_id after rechecking revision and ACL expands the hit to the complete 512-token parent section packed as source E1.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)

    const trackX = 40
    const trackW = 840 // 512 tokens => 210px per 128-token child
    const childW = 210
    const gap = 8

    const childY = 128
    const childH = 74
    const parentY = 290
    const parentH = 92

    // Child 2 spans index 1 -> x = 40 + 210 = 250 .. 460
    const c2Left = trackX + childW + gap / 2
    const c2Right = trackX + 2 * childW - gap / 2

    const ticks = [0, 128, 256, 384, 512]

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Outer subtle frame */}
                        <rect
                            x={16}
                            y={14}
                            width={888}
                            height={442}
                            rx={14}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />

                        {/* Token scale ruler at top */}
                        <line
                            x1={trackX}
                            y1={76}
                            x2={trackX + trackW}
                            y2={76}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                        {ticks.map((tok, i) => {
                            const tx = trackX + i * childW
                            return (
                                <g key={`ruler-${tok}`}>
                                    <line
                                        x1={tx}
                                        y1={68}
                                        x2={tx}
                                        y2={84}
                                        stroke={c.borderLight}
                                        strokeWidth={2}
                                    />
                                    <line
                                        x1={tx}
                                        y1={86}
                                        x2={tx}
                                        y2={208}
                                        stroke={c.border}
                                        strokeWidth={1}
                                        strokeDasharray="3 4"
                                    />
                                </g>
                            )
                        })}

                        {/* Query arrow hitting Child 2 */}
                        <path
                            d={`M 355 86 L 355 120`}
                            fill="none"
                            stroke={cyan}
                            strokeWidth={3}
                        />
                        <polygon points="355,127 349,117 361,117" fill={cyan} />

                        {/* 4 Child chunks (128 tokens each) */}
                        {[
                            {
                                idx: 0,
                                fill: c.bgSubtle,
                                stroke: c.borderLight,
                                dash: undefined,
                            },
                            {
                                idx: 1,
                                fill: withColorAlpha(cyan, 0.22),
                                stroke: cyan,
                                dash: undefined,
                            },
                            {
                                idx: 2,
                                fill: withColorAlpha(warm, 0.14),
                                stroke: warm,
                                dash: '6 4',
                            },
                            {
                                idx: 3,
                                fill: c.bgSubtle,
                                stroke: c.borderLight,
                                dash: undefined,
                            },
                        ].map((ch) => (
                            <rect
                                key={`child-${ch.idx}`}
                                x={trackX + ch.idx * childW + gap / 2}
                                y={childY}
                                width={childW - gap}
                                height={childH}
                                rx={9}
                                fill={ch.fill}
                                stroke={ch.stroke}
                                strokeWidth={ch.idx === 1 ? 2.5 : 1.75}
                                strokeDasharray={ch.dash}
                            />
                        ))}

                        {/* Expansion trapezoid from Child 2 (128 tok) -> Full Parent (512 tok) */}
                        <polygon
                            points={`${c2Left},${childY + childH + 4} ${c2Right},${childY + childH + 4} ${trackX + trackW},${parentY - 4} ${trackX},${parentY - 4}`}
                            fill={withColorAlpha(green, 0.12)}
                        />
                        <line
                            x1={c2Left}
                            y1={childY + childH + 4}
                            x2={trackX}
                            y2={parentY - 4}
                            stroke={green}
                            strokeWidth={2}
                            strokeDasharray="5 4"
                        />
                        <line
                            x1={c2Right}
                            y1={childY + childH + 4}
                            x2={trackX + trackW}
                            y2={parentY - 4}
                            stroke={green}
                            strokeWidth={2}
                            strokeDasharray="5 4"
                        />
                        {/* Center downward expansion arrow */}
                        <line
                            x1={355}
                            y1={childY + childH + 6}
                            x2={355}
                            y2={parentY - 12}
                            stroke={green}
                            strokeWidth={2.5}
                        />
                        <polygon points={`355,${parentY - 4} 349,${parentY - 14} 361,${parentY - 14}`} fill={green} />

                        {/* Full 512-token Parent Context Span */}
                        <rect
                            x={trackX}
                            y={parentY}
                            width={trackW}
                            height={parentH}
                            rx={10}
                            fill={withColorAlpha(green, 0.12)}
                            stroke={green}
                            strokeWidth={2.5}
                        />
                        {/* Highlighted inner spans inside parent (C2 matched + C3 restored qualifier) */}
                        <rect
                            x={trackX + childW + 4}
                            y={parentY + 34}
                            width={childW - 8}
                            height={48}
                            rx={6}
                            fill={withColorAlpha(cyan, 0.22)}
                            stroke={cyan}
                            strokeWidth={1.5}
                        />
                        <rect
                            x={trackX + 2 * childW + 4}
                            y={parentY + 34}
                            width={childW - 8}
                            height={48}
                            rx={6}
                            fill={withColorAlpha(warm, 0.22)}
                            stroke={warm}
                            strokeWidth={1.5}
                        />
                        {/* Faint context bands for C1 and C4 inside parent */}
                        <rect
                            x={trackX + 8}
                            y={parentY + 34}
                            width={childW - 12}
                            height={48}
                            rx={6}
                            fill={withColorAlpha(c.border, 0.28)}
                        />
                        <rect
                            x={trackX + 3 * childW + 4}
                            y={parentY + 34}
                            width={childW - 12}
                            height={48}
                            rx={6}
                            fill={withColorAlpha(c.border, 0.28)}
                        />
                    </svg>
                </CanvasItem>

                {/* Header */}
                <CanvasItem x={40} y={24} width={540} height={24}>
                    <TextLabel
                        c={c}
                        text="Retrieve Small (128 tok), Expand to Full Parent (512 tok)"
                        fontSize={18}
                        fontWeight={800}
                        color={c.textPrimary}
                    />
                </CanvasItem>
                <CanvasItem x={610} y={26} width={270} height={22}>
                    <TextLabel
                        c={c}
                        text="Scale: 0 to 512 tokens"
                        fontSize={13}
                        fontWeight={700}
                        mono
                        color={blue}
                        align="right"
                    />
                </CanvasItem>

                {/* Token ruler labels */}
                {ticks.map((tok, i) => {
                    const tx = trackX + i * childW
                    return (
                        <CanvasItem key={`tok-${tok}`} x={tx - 24} y={48} width={48} height={18}>
                            <TextLabel
                                c={c}
                                text={`${tok}`}
                                fontSize={12}
                                mono
                                color={c.textMuted}
                                align="center"
                            />
                        </CanvasItem>
                    )
                })}

                {/* Query match tag */}
                <CanvasItem x={372} y={88} width={260} height={22}>
                    <TextLabel
                        c={c}
                        text="Query vector HIT · cos = 0.89"
                        fontSize={13}
                        fontWeight={800}
                        color={cyan}
                    />
                </CanvasItem>
                <CanvasItem x={40} y={102} width={220} height={20}>
                    <TextLabel
                        c={c}
                        text="Child Index (4 × 128 tok)"
                        fontSize={13}
                        fontWeight={700}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Child labels */}
                <CanvasItem x={48} y={140} width={194} height={20}>
                    <TextLabel c={c} text="C1 · 128 tok" fontSize={13} fontWeight={700} mono color={c.textMuted} align="center" />
                </CanvasItem>
                <CanvasItem x={48} y={162} width={194} height={20}>
                    <TextLabel c={c} text="Overview & auth" fontSize={13} color={c.textSecondary} align="center" />
                </CanvasItem>

                <CanvasItem x={258} y={138} width={194} height={20}>
                    <TextLabel c={c} text="C2 · 128 tok (MATCH)" fontSize={13} fontWeight={800} mono color={cyan} align="center" />
                </CanvasItem>
                <CanvasItem x={258} y={160} width={194} height={22}>
                    <TextLabel c={c} text="20,000 req/file limit" fontSize={14} fontWeight={700} color={c.textPrimary} align="center" />
                </CanvasItem>

                <CanvasItem x={468} y={138} width={194} height={20}>
                    <TextLabel c={c} text="C3 · 128 tok (SPLIT)" fontSize={13} fontWeight={800} mono color={warm} align="center" />
                </CanvasItem>
                <CanvasItem x={468} y={160} width={194} height={22}>
                    <TextLabel c={c} text="Under 100 MB cap" fontSize={14} fontWeight={700} color={warm} align="center" />
                </CanvasItem>

                <CanvasItem x={678} y={140} width={194} height={20}>
                    <TextLabel c={c} text="C4 · 128 tok" fontSize={13} fontWeight={700} mono color={c.textMuted} align="center" />
                </CanvasItem>
                <CanvasItem x={678} y={162} width={194} height={20}>
                    <TextLabel c={c} text="Error codes & retry" fontSize={13} color={c.textSecondary} align="center" />
                </CanvasItem>

                {/* Expansion callout */}
                <CanvasItem x={372} y={254} width={460} height={24}>
                    <TextLabel
                        c={c}
                        text="parent_id + rev & ACL check -> expand to 512 tok"
                        fontSize={14}
                        fontWeight={700}
                        color={green}
                    />
                </CanvasItem>

                {/* Parent track labels */}
                <CanvasItem x={52} y={297} width={816} height={22}>
                    <TextLabel
                        c={c}
                        text="Parent Section [E1] · batch-api-sec4-v2 · 512 tokens sent to LLM"
                        fontSize={15}
                        fontWeight={800}
                        color={green}
                    />
                </CanvasItem>
                <CanvasItem x={52} y={338} width={192} height={22}>
                    <TextLabel c={c} text="Intro context" fontSize={13} color={c.textSecondary} align="center" />
                </CanvasItem>
                <CanvasItem x={256} y={338} width={198} height={22}>
                    <TextLabel c={c} text="20,000 req/file" fontSize={14} fontWeight={800} color={cyan} align="center" />
                </CanvasItem>
                <CanvasItem x={466} y={338} width={198} height={22}>
                    <TextLabel c={c} text="+ < 100 MB cap restored" fontSize={14} fontWeight={800} color={warm} align="center" />
                </CanvasItem>
                <CanvasItem x={676} y={338} width={192} height={22}>
                    <TextLabel c={c} text="Exceptions & retry" fontSize={13} color={c.textSecondary} align="center" />
                </CanvasItem>

                {/* Bottom provenance badges */}
                <CanvasItem x={40} y={402} width={116} height={32}>
                    <BadgePill c={c} text="Source E1" tone="green" filled fontSize={13} width={116} height={30} />
                </CanvasItem>
                <CanvasItem x={168} y={402} width={224} height={32}>
                    <BadgePill c={c} text="rev: batch-api/2026-05-01" tone="blue" fontSize={13} width={224} height={30} />
                </CanvasItem>
                <CanvasItem x={404} y={402} width={236} height={32}>
                    <BadgePill c={c} text="Batch API v2 > Sec 4.1" tone="neutral" fontSize={13} width={236} height={30} />
                </CanvasItem>
                <CanvasItem x={652} y={402} width={228} height={32}>
                    <BadgePill c={c} text="ACL: ml-platform / eng" tone="purple" fontSize={13} width={228} height={30} />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
