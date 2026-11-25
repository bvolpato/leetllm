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

type Colors = ReturnType<typeof getThemeColors>

export const width = 760
export const height = 370
export const alt =
    'Shared-scale horizontal bar chart of ViT-L/14 visual token counts against a 4,096-token context window: 224px still emits 256 patches, 448px still emits 1,024, 672px still emits 2,304, five 336px chart tiles emit 2,880, and 60 seconds of 224px video at 2 fps emits 30,720 patches (7.5x the 4,096-token limit).'

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
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('critical', c)
    const muted = c.textSecondary

    const barX = 204
    const barMaxW = 356
    const maxTokens = 32000
    const xFor = (n: number) => barX + (n / maxTokens) * barMaxW
    const limitX = xFor(4096)

    const rows = [
        { label: '224px still', sub: '16×16', tokens: 256, note: '256', tone: green },
        { label: '448px still', sub: '32×32', tokens: 1024, note: '1,024', tone: green },
        { label: '672px still', sub: '48×48', tokens: 2304, note: '2,304', tone: blue },
        { label: '5× 336px tiles', sub: '5 × 576', tokens: 2880, note: '2,880', tone: warm },
        { label: '60s video (2 fps)', sub: '120 × 256', tokens: 30720, note: '30,720 (7.5×)', tone: red },
    ]

    const rowStart = 76
    const rowStep = 50

    const geometry = [
        // Axis baseline
        VectorSegment({ x1: barX, y1: 318, x2: barX + barMaxW, y2: 318, color: muted, strokeWidth: 1.5, showStartDot: false, showEndDot: false }),
        ...[0, 4096, 16000, 32000].map((t) =>
            VectorSegment({
                key: `tk-${t}`,
                x1: xFor(t),
                y1: 313,
                x2: xFor(t),
                y2: 323,
                color: t === 4096 ? red : muted,
                strokeWidth: t === 4096 ? 2 : 1.4,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        // 4,096 context reference line
        createElement('line', {
            key: 'ctx-line',
            x1: limitX,
            y1: 58,
            x2: limitX,
            y2: 318,
            stroke: red,
            strokeWidth: 2,
            strokeDasharray: '5 4',
        }),
        // Bars
        ...rows.flatMap((row, i) => {
            const y = rowStart + i * rowStep
            const w = Math.max(8, (row.tokens / maxTokens) * barMaxW)
            return [
                SvgFrame({
                    c,
                    key: `bg-${i}`,
                    x: barX,
                    y,
                    width: barMaxW,
                    height: 28,
                    rx: 5,
                    fill: c.bgSubtle,
                    stroke: c.borderSubtle,
                    strokeWidth: 1,
                }),
                SvgFrame({
                    c,
                    key: `fg-${i}`,
                    x: barX,
                    y,
                    width: w,
                    height: 28,
                    rx: 5,
                    fill: withColorAlpha(row.tone, 0.35),
                    stroke: row.tone,
                    strokeWidth: 1.8,
                }),
            ]
        }),
    ]

    const labels = [
        lbl(c, 'Raw ViT-L/14 Patch Tokens (P = 14)', 30, 24, 380, 24, 17, c.textPrimary, 800),
        lbl(c, '4,096 context limit', limitX + 8, 52, 200, 22, 16, red, 700),

        ...rows.flatMap((row, i) => {
            const y = rowStart + i * rowStep
            return [
                lbl(c, row.label, 30, y + 2, 168, 22, 16, c.textPrimary, 700),
                lbl(c, row.note, barX + barMaxW + 14, y + 2, 158, 22, 16, row.tone, 800, 'left', true),
            ]
        }),

        // Axis ticks
        lbl(c, '0', xFor(0) - 22, 326, 28, 22, 16, muted, 600, 'center', true),
        lbl(c, '4K', xFor(4096) - 12, 326, 40, 22, 16, red, 700, 'center', true),
        lbl(c, '16K', xFor(16000) - 24, 326, 48, 22, 16, muted, 600, 'center', true),
        lbl(c, '32K', xFor(32000) - 24, 326, 48, 22, 16, muted, 600, 'center', true),
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
