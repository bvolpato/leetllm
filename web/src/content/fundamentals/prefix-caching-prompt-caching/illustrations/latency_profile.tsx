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
    'On a 2,100 ms server scale, prefix caching cuts prefill from 1,220 ms to 170 ms while decode stays 880 ms. Under heavy queueing on a hot worker, queue wait grows from 20 ms to 1,200 ms, pushing warm client TTFT from 1,240 ms to 1,370 ms (+130 ms later).'

const FONT = 26

function LatencyProfileChart({ c }: { c: ThemeColors }) {
    const x0 = 140
    const maxW = 540
    const sMax = 2100
    const tMax = 1400
    const scColdPre = Math.round((1220 / sMax) * maxW)
    const scDec = Math.round((880 / sMax) * maxW)
    const scWarmPre = Math.round((170 / sMax) * maxW)

    const tcColdQ = Math.max(8, Math.round((20 / tMax) * maxW))
    const tcColdPre = Math.round((1220 / tMax) * maxW)
    const tcWarmQ = Math.round((1200 / tMax) * maxW)
    const tcWarmPre = Math.round((170 / tMax) * maxW)
    const coldTtftX = x0 + tcColdQ + 3 + tcColdPre

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={28} y={18} width={784} height={40}>
                <TextLabel
                    c={c}
                    text="Prefix hits trim prefill; hot queues flip TTFT"
                    fontSize={29}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={28} y={60} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="Server time (0-2,100 ms) vs queued TTFT (0-1,400 ms)"
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
                        height={180}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={x0}
                        y={168}
                        width={scColdPre}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.primary, 0.35)}
                        stroke={c.primaryLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={x0 + scColdPre + 4}
                        y={168}
                        width={scDec}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.info, 0.35)}
                        stroke={c.infoLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={x0}
                        y={224}
                        width={scWarmPre}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.primary, 0.35)}
                        stroke={c.primaryLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={x0 + scWarmPre + 4}
                        y={224}
                        width={scDec}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.info, 0.35)}
                        stroke={c.infoLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={x0 + scWarmPre + scDec + 8}
                        y={224}
                        width={scColdPre - scWarmPre - 4}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.positive, 0.12)}
                        stroke={c.positiveLight}
                        strokeWidth={1.8}
                        strokeDasharray="6 4"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={312}
                        width={784}
                        height={236}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <rect x={x0} y={372} width={tcColdQ} height={34} rx={4} fill={c.warningLight} />
                    <rect
                        x={x0 + tcColdQ + 3}
                        y={372}
                        width={tcColdPre}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.primary, 0.35)}
                        stroke={c.primaryLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={x0}
                        y={430}
                        width={tcWarmQ}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.warning, 0.35)}
                        stroke={c.warningLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={x0 + tcWarmQ + 4}
                        y={430}
                        width={tcWarmPre}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.primary, 0.35)}
                        stroke={c.primaryLight}
                        strokeWidth={1.8}
                    />
                    <VectorSegment
                        x1={coldTtftX}
                        y1={410}
                        x2={coldTtftX}
                        y2={472}
                        color={c.criticalLight}
                        strokeWidth={2.5}
                    />
                </svg>
            </CanvasItem>
            <CanvasItem x={48} y={124} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="Server phase time (decode held at 880 ms)"
                    fontSize={FONT}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={48} y={168} width={84} height={34}>
                <TextLabel c={c} text="Cold" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={x0 + 12} y={168} width={scColdPre - 16} height={34}>
                <TextLabel c={c} text="prefill 1,220 ms" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={x0 + scColdPre + 14} y={168} width={scDec - 12} height={34}>
                <TextLabel c={c} text="dec 880" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={48} y={224} width={84} height={34}>
                <TextLabel c={c} text="Warm" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={x0 + scWarmPre + 14} y={224} width={scDec - 12} height={34}>
                <TextLabel c={c} text="170 + 880 ms" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={x0 + scWarmPre + scDec + 20} y={224} width={250} height={34}>
                <TextLabel
                    c={c}
                    text="saves 1,050 ms"
                    fontSize={FONT}
                    color={c.positiveLight}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={48} y={324} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="Client TTFT including queue wait (0-1,400 ms)"
                    fontSize={FONT}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={48} y={372} width={84} height={34}>
                <TextLabel c={c} text="Cold" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={x0 + 22} y={372} width={tcColdPre - 20} height={34}>
                <TextLabel c={c} text="20 queue + 1,220 prefill" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={coldTtftX + 14} y={372} width={150} height={34}>
                <TextLabel c={c} text="1,240 ms" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={48} y={430} width={84} height={34}>
                <TextLabel c={c} text="Warm" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={x0 + 12} y={430} width={tcWarmQ - 16} height={34}>
                <TextLabel c={c} text="1,200 ms queue wait" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={x0 + tcWarmQ + tcWarmPre + 14} y={430} width={150} height={34}>
                <TextLabel
                    c={c}
                    text="1,370 ms"
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.criticalLight}
                />
            </CanvasItem>
            <CanvasItem x={48} y={490} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="Overloaded warm worker reaches first token 130 ms later."
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.criticalLight}
                />
            </CanvasItem>
        </Board>
    )
}

const illustration = defineIllustration((c) => <LatencyProfileChart c={c} />)

export const create = illustration.create
export default illustration.default
