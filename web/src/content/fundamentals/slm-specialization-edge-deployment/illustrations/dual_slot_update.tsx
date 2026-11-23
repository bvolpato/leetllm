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
export const height = 540
export const alt =
    'Dual-slot OTA model staging keeps verified Slot A untouched while Candidate B downloads to inactive Slot B. Before activation, B passes signed manifest checks (Ed25519 signature, SHA-256 digests, monotonic version, expiry, device match) and single-model smoke verification within the memory budget. Activating B points fresh sessions at B and clears incompatible KV state; any error falls back to Slot A.'

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

function DualSlotChart({ c }: { c: ThemeColors }) {
    return (
        <Board c={c} width={width} height={height}>
            {L(c, 24, 16, 792, 38, 'Dual-slot staging keeps an intact fallback model', {
                size: 28,
                weight: 700,
            })}
            {L(c, 24, 56, 792, 32, 'Stage and verify Slot B before flipping active pointer', {
                color: c.textMuted,
            })}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={24}
                        y={108}
                        width={368}
                        height={164}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.positiveLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={24}
                        y={108}
                        width={368}
                        height={164}
                        rx={12}
                        fill={withColorAlpha(c.positive, 0.12)}
                        stroke={c.positiveLight}
                        strokeWidth={1.8}
                    />
                    <SvgFrame
                        c={c}
                        x={448}
                        y={108}
                        width={368}
                        height={164}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.infoLight}
                        strokeWidth={1.6}
                    />

                    <SvgFrame
                        c={c}
                        x={24}
                        y={328}
                        width={368}
                        height={184}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.primaryLight}
                        strokeWidth={1.6}
                    />
                    <SvgFrame
                        c={c}
                        x={448}
                        y={328}
                        width={368}
                        height={184}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.primaryLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={448}
                        y={328}
                        width={368}
                        height={184}
                        rx={12}
                        fill={withColorAlpha(c.primary, 0.14)}
                        stroke={c.primaryLight}
                        strokeWidth={1.8}
                    />

                    <VectorArrow
                        x1={632}
                        y1={272}
                        x2={632}
                        y2={326}
                        color={c.infoLight}
                        strokeWidth={2.2}
                    />
                    <VectorArrow
                        x1={446}
                        y1={420}
                        x2={394}
                        y2={420}
                        color={c.primaryLight}
                        strokeWidth={2.2}
                    />
                    <VectorArrow
                        x1={208}
                        y1={326}
                        x2={208}
                        y2={274}
                        color={c.warningLight}
                        strokeWidth={2.2}
                    />
                </svg>
            </CanvasItem>

            {L(c, 42, 122, 332, 32, 'Slot A: Active fallback', {
                color: c.positiveLight,
                weight: 700,
            })}
            {L(c, 42, 160, 332, 30, 'Weights + tokenizer', { color: c.textMuted })}
            {L(c, 42, 194, 332, 30, 'Untouched in staging', { color: c.textMuted })}
            {L(c, 42, 228, 332, 30, 'Fallback on B error', { weight: 600 })}

            {L(c, 466, 122, 332, 32, '1. Stage into Slot B', { color: c.infoLight, weight: 700 })}
            {L(c, 466, 160, 332, 30, 'Ed25519 manifest check', { color: c.textMuted })}
            {L(c, 466, 194, 332, 30, 'SHA-256 & byte lengths', { color: c.textMuted })}
            {L(c, 466, 228, 332, 30, 'Version > A, non-expired', { weight: 600 })}

            {L(c, 466, 344, 332, 32, '2. Single-model verify', {
                color: c.primaryLight,
                weight: 700,
            })}
            {L(c, 466, 382, 332, 30, 'Load within RAM cap', { color: c.textMuted })}
            {L(c, 466, 416, 332, 30, 'Tokenizer & templates', { color: c.textMuted })}
            {L(c, 466, 450, 332, 30, 'Smoke + health checks', { weight: 600 })}

            {L(c, 42, 344, 332, 32, '3. Atomic pointer flip', {
                color: c.primaryLight,
                weight: 700,
            })}
            {L(c, 42, 382, 332, 30, 'Point active slot to B', { color: c.textMuted })}
            {L(c, 42, 416, 332, 30, 'Clear stale KV cache', { color: c.textMuted })}
            {L(c, 42, 450, 332, 30, 'Rollback to A on fail', {
                color: c.warningLight,
                weight: 600,
            })}
        </Board>
    )
}

const illustration = defineIllustration((c) => <DualSlotChart c={c} />)
export const create = illustration.create
export default illustration.default
