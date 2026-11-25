import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    withColorAlpha,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 470
export const alt =
    'Live GPU HBM footprint of a 1B FSDP2 unit across 4 ranks over six step events. The 1 GB FP32 parameter shard stays resident throughout. Forward all-gather temporarily adds 2 GB of BF16 weights to peak at 3 GB, then post-forward reshard drops back to 1 GB. Backward all-gather again peaks at 3 GB, reduce-scatter frees BF16 weights leaving 1 GB shard plus 1 GB FP32 gradient shard (2 GB), and local AdamW plus zero_grad returns to the 1 GB rest state.'

type Colors = ReturnType<typeof getThemeColors>

function lbl(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 650,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const plotLeft = 86
    const plotRight = 740
    const baseY = 382
    const gbPx = 76 // 1 GB = 76px, 3 GB = 228px -> top at y = 154
    const yForGb = (gb: number) => baseY - gb * gbPx

    const events = [
        { name: 'Rest', phase: 'fwd', shard: 1, bf16: 0, grad: 0, freed: false, total: '1 GB', tone: green },
        { name: 'Fwd AG', phase: 'fwd', shard: 1, bf16: 2, grad: 0, freed: false, total: '3 GB', tone: blue },
        { name: 'Reshard', phase: 'fwd', shard: 1, bf16: 0, grad: 0, freed: true, total: '1 GB', tone: blue },
        { name: 'Bwd AG', phase: 'bwd', shard: 1, bf16: 2, grad: 0, freed: false, total: '3 GB', tone: purple },
        { name: 'Red-Scat', phase: 'bwd', shard: 1, bf16: 0, grad: 1, freed: false, total: '2 GB', tone: warm },
        { name: 'AdamW', phase: 'opt', shard: 1, bf16: 0, grad: 0, freed: false, total: '1 GB', tone: green },
    ]

    const colW = (plotRight - plotLeft) / events.length
    const barW = 76

    const geometry = [
        // Phase header bands
        SvgFrame({
            c,
            key: 'phase-fwd',
            x: plotLeft + 6,
            y: 66,
            width: colW * 3 - 12,
            height: 30,
            rx: 6,
            fill: withColorAlpha(blue, 0.12),
            stroke: blue,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            key: 'phase-bwd',
            x: plotLeft + colW * 3 + 6,
            y: 66,
            width: colW * 2 - 12,
            height: 30,
            rx: 6,
            fill: withColorAlpha(purple, 0.12),
            stroke: purple,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            key: 'phase-opt',
            x: plotLeft + colW * 5 + 6,
            y: 66,
            width: colW - 12,
            height: 30,
            rx: 6,
            fill: withColorAlpha(green, 0.12),
            stroke: green,
            strokeWidth: 1.2,
        }),

        // Legend swatches
        SvgFrame({ c, key: 'leg-p', x: 24, y: 20, width: 20, height: 20, rx: 4, fill: withColorAlpha(green, 0.35), stroke: green, strokeWidth: 1.6 }),
        SvgFrame({ c, key: 'leg-w', x: 266, y: 20, width: 20, height: 20, rx: 4, fill: withColorAlpha(blue, 0.3), stroke: blue, strokeWidth: 1.6 }),
        SvgFrame({ c, key: 'leg-g', x: 518, y: 20, width: 20, height: 20, rx: 4, fill: withColorAlpha(warm, 0.32), stroke: warm, strokeWidth: 1.6 }),

        // Horizontal gridlines at 0, 1, 2, 3 GB
        ...[0, 1, 2, 3].map((gb) =>
            createElement('line', {
                key: `grid-${gb}`,
                x1: plotLeft,
                y1: yForGb(gb),
                x2: plotRight,
                y2: yForGb(gb),
                stroke: gb === 0 ? muted : gb === 1 ? green : c.borderSubtle,
                strokeWidth: gb === 0 ? 1.8 : gb === 1 ? 1.5 : 1,
                strokeDasharray: gb === 0 ? undefined : '5 4',
            }),
        ),
        // Y axis
        VectorSegment({ x1: plotLeft, y1: yForGb(3) - 18, x2: plotLeft, y2: baseY, color: muted, strokeWidth: 1.8, showStartDot: false, showEndDot: false }),

        // Event stacked bars
        ...events.flatMap((ev, i) => {
            const cx = plotLeft + i * colW + colW / 2
            const bx = cx - barW / 2
            const items = [
                // Resident 1 GB FP32 shard
                SvgFrame({
                    c,
                    key: `shard-${i}`,
                    x: bx,
                    y: yForGb(1),
                    width: barW,
                    height: gbPx,
                    rx: 5,
                    fill: withColorAlpha(green, 0.28),
                    stroke: green,
                    strokeWidth: 1.8,
                }),
            ]
            if (ev.bf16 > 0) {
                const topColor = ev.phase === 'fwd' ? blue : purple
                items.push(
                    SvgFrame({
                        c,
                        key: `bf16-${i}`,
                        x: bx,
                        y: yForGb(3),
                        width: barW,
                        height: gbPx * 2 - 4,
                        rx: 5,
                        fill: withColorAlpha(topColor, 0.25),
                        stroke: topColor,
                        strokeWidth: 1.8,
                    }),
                )
            }
            if (ev.freed) {
                items.push(
                    createElement('rect', {
                        key: `freed-${i}`,
                        x: bx,
                        y: yForGb(3),
                        width: barW,
                        height: gbPx * 2 - 4,
                        rx: 5,
                        fill: 'none',
                        stroke: c.borderSubtle,
                        strokeWidth: 1.6,
                        strokeDasharray: '5 4',
                    }),
                )
            }
            if (ev.grad > 0) {
                items.push(
                    SvgFrame({
                        c,
                        key: `grad-${i}`,
                        x: bx,
                        y: yForGb(2),
                        width: barW,
                        height: gbPx - 4,
                        rx: 5,
                        fill: withColorAlpha(warm, 0.28),
                        stroke: warm,
                        strokeWidth: 1.8,
                    }),
                )
            }
            return items
        }),
    ]

    const labels = [
        // Legend labels
        lbl(c, 'FP32 shard Pᵣ (1 GB)', 52, 18, 204, 24, 16, c.textPrimary, 700),
        lbl(c, 'BF16 gather W (2 GB)', 294, 18, 212, 24, 16, c.textPrimary, 700),
        lbl(c, 'FP32 grad dWᵣ (1 GB)', 546, 18, 200, 24, 16, c.textPrimary, 700),

        // Phase headers
        lbl(c, '1 · Forward', plotLeft + 6, 70, colW * 3 - 12, 22, 16, blue, 800, 'center'),
        lbl(c, '2 · Backward', plotLeft + colW * 3 + 6, 70, colW * 2 - 12, 22, 16, purple, 800, 'center'),
        lbl(c, '3 · Step', plotLeft + colW * 5 + 6, 70, colW - 12, 22, 16, green, 800, 'center'),

        // Y-axis ticks
        ...[0, 1, 2, 3].map((gb) =>
            lbl(c, `${gb} GB`, 14, yForGb(gb) - 11, 64, 22, 16, gb === 1 ? green : muted, 700, 'right', true),
        ),

        // Per-event labels
        ...events.flatMap((ev, i) => {
            const cx = plotLeft + i * colW + colW / 2
            const peakGb = ev.shard + ev.bf16 + ev.grad
            const peakY = yForGb(peakGb) - 28
            const arr = [
                lbl(c, ev.total, cx - 44, peakY, 88, 22, 16, ev.tone, 800, 'center', true),
                lbl(c, 'Pᵣ', cx - 32, yForGb(0.5) - 11, 64, 22, 16, green, 800, 'center', true),
                lbl(c, ev.name, cx - 50, baseY + 14, 100, 24, 16, c.textPrimary, 700, 'center'),
            ]
            if (ev.bf16 > 0) {
                const topColor = ev.phase === 'fwd' ? blue : purple
                arr.push(lbl(c, 'W (2G)', cx - 36, yForGb(2) - 11, 72, 22, 16, topColor, 700, 'center', true))
            }
            if (ev.freed) {
                arr.push(lbl(c, 'freed', cx - 36, yForGb(2) - 11, 72, 22, 16, muted, 600, 'center'))
            }
            if (ev.grad > 0) {
                arr.push(lbl(c, 'dWᵣ', cx - 32, yForGb(1.5) - 11, 64, 22, 16, warm, 800, 'center', true))
            }
            return arr
        }),

        // Bottom concise axis label
        lbl(c, '1B unit across 4 ranks · reshard_after_forward = True', plotLeft, 434, plotRight - plotLeft, 22, 16, muted, 600, 'center'),
    ]

    const svg = createElement(
        'svg',
        { width, height, viewBox: `0 0 ${width} ${height}`, role: 'presentation', 'aria-hidden': true },
        ...geometry,
    )
    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [CanvasItem({ x: 0, y: 0, width, height, children: svg }), ...labels],
    })
}

export default create('dark')
