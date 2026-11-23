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
export const height = 560
export const alt =
    'Top panel shows the weighted distillation loss breakdown totaling 0.2109: hard cross-entropy contributes 0.0904 (0.4522 x 0.20), temperature-scaled KL contributes 0.1184 (0.1480 x 0.80), and hidden-state MSE contributes 0.0020 (0.0100 x 0.20). Bottom panel plots export quality versus p95 latency against a feasible zone (quality >= 0.92 and latency <= 120 ms): Baseline sits at (132 ms, 0.940), INT8 lands inside at (104 ms, 0.938), and INT4 misses quality at (71 ms, 0.887).'

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

function DistillationExportChart({ c }: { c: ThemeColors }) {
    const plotX = 148
    const plotY = 304
    const plotW = 636
    const plotH = 180
    const xOf = (ms: number) => plotX + ((ms - 60) / (150 - 60)) * plotW
    const yOf = (q: number) => plotY + ((0.96 - q) / (0.96 - 0.86)) * plotH

    const pts = [
        {
            label: 'INT4 (71ms, 0.887)',
            ms: 71,
            q: 0.887,
            lx: xOf(71) + 14,
            ly: yOf(0.887) - 16,
            color: c.criticalLight,
        },
        {
            label: 'INT8 (104ms, 0.938)',
            ms: 104,
            q: 0.938,
            lx: xOf(104) - 120,
            ly: yOf(0.938) - 42,
            color: c.positiveLight,
        },
        {
            label: 'Base (132ms, 0.94)',
            ms: 132,
            q: 0.94,
            lx: 560,
            ly: yOf(0.92) + 16,
            color: c.warningLight,
        },
    ]

    return (
        <Board c={c} width={width} height={height}>
            {L(c, 24, 16, 792, 38, 'Distillation loss weights and quantized export gates', {
                size: 28,
                weight: 700,
            })}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={24}
                        y={68}
                        width={792}
                        height={158}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={44}
                        y={122}
                        width={322}
                        height={36}
                        rx={4}
                        fill={withColorAlpha(c.primary, 0.35)}
                        stroke={c.primaryLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={370}
                        y={122}
                        width={416}
                        height={36}
                        rx={4}
                        fill={withColorAlpha(c.info, 0.35)}
                        stroke={c.infoLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={790}
                        y={122}
                        width={8}
                        height={36}
                        rx={2}
                        fill={withColorAlpha(c.violet, 0.5)}
                        stroke={c.violetLight}
                        strokeWidth={1.5}
                    />

                    <SvgFrame
                        c={c}
                        x={24}
                        y={242}
                        width={792}
                        height={298}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={plotX}
                        y={plotY}
                        width={xOf(120) - plotX}
                        height={yOf(0.92) - plotY}
                        fill={withColorAlpha(c.positive, 0.14)}
                    />
                    <line
                        x1={plotX}
                        y1={yOf(0.92)}
                        x2={plotX + plotW}
                        y2={yOf(0.92)}
                        stroke={c.positiveLight}
                        strokeWidth={2}
                        strokeDasharray="6 5"
                    />
                    <line
                        x1={xOf(120)}
                        y1={plotY}
                        x2={xOf(120)}
                        y2={plotY + plotH}
                        stroke={c.positiveLight}
                        strokeWidth={2}
                        strokeDasharray="6 5"
                    />
                    <VectorSegment
                        x1={plotX}
                        y1={plotY + plotH}
                        x2={plotX + plotW}
                        y2={plotY + plotH}
                        color={c.borderLight}
                        strokeWidth={1.8}
                    />
                    <VectorSegment
                        x1={plotX}
                        y1={plotY}
                        x2={plotX}
                        y2={plotY + plotH}
                        color={c.borderLight}
                        strokeWidth={1.8}
                    />
                    {pts.map((p) => (
                        <circle
                            key={p.label}
                            cx={xOf(p.ms)}
                            cy={yOf(p.q)}
                            r={8}
                            fill={p.color}
                            stroke={c.bg}
                            strokeWidth={2}
                        />
                    ))}
                </svg>
            </CanvasItem>
            {L(c, 44, 80, 752, 32, 'Weighted distillation objective: total = 0.2109', {
                weight: 700,
            })}
            {L(c, 44, 174, 250, 32, 'Hard 0.2x: 0.0904', { color: c.primaryLight, weight: 600 })}
            {L(c, 304, 174, 250, 32, 'Soft 0.8x: 0.1184', { color: c.infoLight, weight: 600 })}
            {L(c, 554, 174, 248, 32, 'MSE 0.2x: 0.0020', { color: c.violetLight, weight: 600 })}

            {L(c, 44, 256, 380, 32, 'Export gate: quality vs p95', { weight: 700 })}
            {L(c, 424, 256, 372, 32, 'Feasible: q>=0.92, <=120 ms', {
                color: c.positiveLight,
                align: 'right',
                weight: 600,
            })}
            {L(c, 36, yOf(0.92) - 16, 104, 30, '0.92 q', { color: c.textMuted, align: 'right' })}
            {L(c, 36, plotY + plotH - 22, 104, 30, '0.86', { color: c.textMuted, align: 'right' })}
            {L(c, xOf(120) - 56, 492, 112, 30, '120 ms', {
                color: c.positiveLight,
                align: 'center',
                weight: 600,
            })}
            {L(c, plotX - 30, 492, 90, 30, '60 ms', { color: c.textMuted })}
            {pts.map((p) => L(c, p.lx, p.ly, 245, 30, p.label, { color: p.color, weight: 600 }))}
        </Board>
    )
}

const illustration = defineIllustration((c) => <DistillationExportChart c={c} />)
export const create = illustration.create
export default illustration.default
