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
export const height = 360
export const alt =
    'Stacked bar comparison against a 4,096-token context limit on a shared 0 to 6,000 token axis. Direct MLP projection adds 2,880 visual tokens from five 336px views to 2,200 text and 300 output tokens, totaling 5,380 tokens (+1,284 overflow). A 32-query resampler compresses visual tokens to 160, totaling 2,660 tokens with 1,436 tokens of headroom.'

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
    const red = getReadableToneColor('critical', c)
    const muted = c.textSecondary

    const barX = 188
    const barW = 450
    const maxTok = 6000
    const px = (n: number) => (n / maxTok) * barW
    const limitX = barX + px(4096)

    const y1 = 104
    const y2 = 198
    const barH = 40

    const textW = px(2200)
    const visDirectW = px(2880)
    const visCompW = Math.max(14, px(160))
    const outW = px(300)

    const geometry = [
        // 4,096 context limit line (starts below header label, skips cleanly behind bars)
        createElement('line', {
            key: 'limit',
            x1: limitX,
            y1: 72,
            x2: limitX,
            y2: 266,
            stroke: red,
            strokeWidth: 2,
            strokeDasharray: '5 4',
        }),
        // Axis baseline
        VectorSegment({ x1: barX, y1: 266, x2: barX + barW, y2: 266, color: muted, strokeWidth: 1.5, showStartDot: false, showEndDot: false }),
        ...[0, 2000, 4096, 6000].map((t) =>
            VectorSegment({
                key: `tk-${t}`,
                x1: barX + px(t),
                y1: 261,
                x2: barX + px(t),
                y2: 271,
                color: t === 4096 ? red : muted,
                strokeWidth: t === 4096 ? 2 : 1.4,
                showStartDot: false,
                showEndDot: false,
            }),
        ),

        // Plan A: Direct MLP (2200 text + 2880 vis + 300 out = 5380)
        SvgFrame({ c, key: 'a-txt', x: barX, y: y1, width: textW, height: barH, rx: 4, fill: withColorAlpha(green, 0.28), stroke: green, strokeWidth: 1.6 }),
        SvgFrame({ c, key: 'a-vis', x: barX + textW, y: y1, width: visDirectW, height: barH, rx: 4, fill: withColorAlpha(red, 0.3), stroke: red, strokeWidth: 1.8 }),
        SvgFrame({ c, key: 'a-out', x: barX + textW + visDirectW, y: y1, width: outW, height: barH, rx: 4, fill: c.bgSubtle, stroke: muted, strokeWidth: 1.4 }),

        // Plan B: Compressed (2200 text + 160 vis + 300 out = 2660)
        SvgFrame({ c, key: 'b-txt', x: barX, y: y2, width: textW, height: barH, rx: 4, fill: withColorAlpha(green, 0.28), stroke: green, strokeWidth: 1.6 }),
        SvgFrame({ c, key: 'b-vis', x: barX + textW, y: y2, width: visCompW, height: barH, rx: 4, fill: withColorAlpha(blue, 0.4), stroke: blue, strokeWidth: 1.8 }),
        SvgFrame({ c, key: 'b-out', x: barX + textW + visCompW, y: y2, width: outW, height: barH, rx: 4, fill: c.bgSubtle, stroke: muted, strokeWidth: 1.4 }),

        // Legend swatches
        SvgFrame({ c, key: 'l1', x: 34, y: 312, width: 18, height: 18, rx: 4, fill: withColorAlpha(green, 0.32), stroke: green, strokeWidth: 1.5 }),
        SvgFrame({ c, key: 'l2', x: 226, y: 312, width: 18, height: 18, rx: 4, fill: withColorAlpha(red, 0.32), stroke: red, strokeWidth: 1.5 }),
        SvgFrame({ c, key: 'l3', x: 432, y: 312, width: 18, height: 18, rx: 4, fill: withColorAlpha(blue, 0.4), stroke: blue, strokeWidth: 1.5 }),
        SvgFrame({ c, key: 'l4', x: 616, y: 312, width: 18, height: 18, rx: 4, fill: c.bgSubtle, stroke: muted, strokeWidth: 1.5 }),
    ]

    const labels = [
        lbl(c, 'Early-Fusion Context Budget (5 Views + Transcript)', 30, 24, 560, 24, 17, c.textPrimary, 800),
        lbl(c, '4,096 limit', limitX - 58, 52, 116, 22, 16, red, 800, 'center', true),

        // Plan A
        lbl(c, 'Direct MLP', 30, y1 - 2, 148, 22, 16, red, 800),
        lbl(c, '5 × 576 patches', 30, y1 + 22, 148, 22, 16, muted, 600),
        lbl(c, '2,200', barX, y1 + 9, textW, 22, 16, green, 800, 'center', true),
        lbl(c, '2,880 vis', barX + textW + 10, y1 + 9, limitX - (barX + textW) - 18, 22, 16, red, 800, 'center', true),
        lbl(c, '5,380', barX + textW + visDirectW + outW + 10, y1 + 9, 96, 22, 16, red, 800, 'left', true),
        lbl(c, '+1,284 overflow', limitX + 10, y1 + 48, 170, 22, 16, red, 700),

        // Plan B
        lbl(c, 'Resampler', 30, y2 - 2, 148, 22, 16, green, 800),
        lbl(c, '5 × 32 queries', 30, y2 + 22, 148, 22, 16, muted, 600),
        lbl(c, '2,200', barX, y2 + 9, textW, 22, 16, green, 800, 'center', true),
        lbl(c, '2,660 OK', barX + textW + visCompW + outW + 10, y2 + 9, 92, 22, 16, green, 800, 'left', true),
        lbl(c, '1,436 headroom', limitX + 10, y2 + 9, 160, 22, 16, green, 700),

        // Axis ticks
        lbl(c, '0', barX - 16, 274, 32, 22, 16, muted, 600, 'center', true),
        lbl(c, '2,000', barX + px(2000) - 34, 274, 68, 22, 16, muted, 600, 'center', true),
        lbl(c, '4,096', limitX - 34, 274, 68, 22, 16, red, 700, 'center', true),
        lbl(c, '6,000', barX + barW - 34, 274, 68, 22, 16, muted, 600, 'center', true),

        // Legend
        lbl(c, 'Text (2,200)', 58, 310, 156, 22, 16, c.textPrimary, 650),
        lbl(c, 'Direct vis (2,880)', 250, 310, 174, 22, 16, c.textPrimary, 650),
        lbl(c, 'Resampled (160)', 456, 310, 152, 22, 16, c.textPrimary, 650),
        lbl(c, 'Out (300)', 640, 310, 100, 22, 16, c.textPrimary, 650),
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
