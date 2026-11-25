import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    withColorAlpha,
    type ThemeMode,
} from 'vizmatic'

type Colors = ReturnType<typeof getThemeColors>

export const width = 760
export const height = 410
export const alt =
    'Dynamic AnyRes tiling schematic: a high-resolution 1344x896 chart divides into a 3x2 tile grid highlighting Tile 3 (upper-right metric badge) and Tile 4 (bottom axis timestamps). It emits one downsampled 336x336 global thumbnail plus two native-resolution local crops with normalized [y0, x0, y1, x1] coordinates, concatenated into an ordered decoder prefix of 1,728 visual tokens plus text prompt.'

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
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const gridX = 28
    const gridY = 82
    const cellW = 64
    const cellH = 56

    const tileRects = []
    const tileLabels = []
    for (let r = 0; r < 2; r++) {
        for (let col = 0; col < 3; col++) {
            const idx = r * 3 + col + 1
            const x = gridX + col * (cellW + 6)
            const y = gridY + r * (cellH + 6)
            const isBadge = idx === 3
            const isAxis = idx === 4
            const stroke = isAxis ? green : isBadge ? warm : c.borderSubtle
            const fill = isAxis
                ? withColorAlpha(green, 0.24)
                : isBadge
                  ? withColorAlpha(warm, 0.24)
                  : c.bgSubtle
            tileRects.push(
                SvgFrame({ c, key: `tile-${idx}`, x, y, width: cellW, height: cellH, rx: 6, fill, stroke, strokeWidth: isAxis || isBadge ? 2 : 1.2 }),
            )
            tileLabels.push(
                lbl(c, `T${idx}`, x, y + 17, cellW, 22, 16, isAxis ? green : isBadge ? warm : muted, 700, 'center', true),
            )
        }
    }

    const geometry = [
        // Column 1: High-res Grid (frameless transparent column with subtle top rule)
        SvgFrame({ c, key: 'c1', x: 14, y: 14, width: 232, height: 382, rx: 10, fill: withColorAlpha(c.borderSubtle, 0.14), stroke: withColorAlpha(c.borderSubtle, 0.7), strokeWidth: 1 }),
        ...tileRects,
        SvgFrame({ c, key: 't4-tag', x: 28, y: 222, width: 204, height: 70, rx: 8, fill: withColorAlpha(green, 0.1), stroke: green, strokeWidth: 1.4 }),
        SvgFrame({ c, key: 't3-tag', x: 28, y: 306, width: 204, height: 70, rx: 8, fill: withColorAlpha(warm, 0.1), stroke: warm, strokeWidth: 1.4 }),

        // Column 2: Multi-Scale Views
        SvgFrame({ c, key: 'c2', x: 276, y: 14, width: 212, height: 382, rx: 10, fill: withColorAlpha(c.borderSubtle, 0.14), stroke: withColorAlpha(c.borderSubtle, 0.7), strokeWidth: 1 }),
        SvgFrame({ c, key: 'v-glob', x: 288, y: 74, width: 188, height: 118, rx: 8, fill: withColorAlpha(blue, 0.12), stroke: blue, strokeWidth: 1.6 }),
        SvgFrame({ c, key: 'v-loc', x: 288, y: 218, width: 188, height: 158, rx: 8, fill: withColorAlpha(green, 0.1), stroke: green, strokeWidth: 1.6 }),

        // Column 3: Ordered Prefix
        SvgFrame({ c, key: 'c3', x: 518, y: 14, width: 228, height: 382, rx: 10, fill: withColorAlpha(c.borderSubtle, 0.14), stroke: withColorAlpha(c.borderSubtle, 0.7), strokeWidth: 1 }),
        SvgFrame({ c, key: 'p0', x: 530, y: 74, width: 204, height: 58, rx: 7, fill: withColorAlpha(blue, 0.14), stroke: blue, strokeWidth: 1.5 }),
        SvgFrame({ c, key: 'p1', x: 530, y: 144, width: 204, height: 58, rx: 7, fill: withColorAlpha(green, 0.14), stroke: green, strokeWidth: 1.5 }),
        SvgFrame({ c, key: 'p2', x: 530, y: 214, width: 204, height: 58, rx: 7, fill: withColorAlpha(warm, 0.14), stroke: warm, strokeWidth: 1.5 }),
        SvgFrame({ c, key: 'p3', x: 530, y: 284, width: 204, height: 54, rx: 7, fill: c.bgSubtle, stroke: c.borderSubtle, strokeWidth: 1.3 }),

        // Arrows
        VectorArrow({ x1: 248, y1: 132, x2: 284, y2: 132, color: blue, strokeWidth: 2, arrowSize: 6 }),
        VectorArrow({ x1: 248, y1: 292, x2: 284, y2: 292, color: green, strokeWidth: 2, arrowSize: 6 }),
        VectorArrow({ x1: 478, y1: 104, x2: 526, y2: 104, color: blue, strokeWidth: 2, arrowSize: 6 }),
        VectorArrow({ x1: 478, y1: 256, x2: 526, y2: 208, color: green, strokeWidth: 2, arrowSize: 6 }),
    ]

    const labels = [
        // Column headers
        lbl(c, '1 · 1344×896 Grid', 26, 28, 208, 24, 17, c.textPrimary, 800, 'center'),
        lbl(c, '2 · AnyRes Views', 288, 28, 188, 24, 17, c.textPrimary, 800, 'center'),
        lbl(c, '3 · Token Prefix', 530, 28, 204, 24, 17, c.textPrimary, 800, 'center'),

        ...tileLabels,

        // Selected crop legends
        lbl(c, 'T4 · Bottom axis', 40, 232, 180, 22, 16, green, 800),
        lbl(c, 'Fine timestamps', 40, 260, 180, 22, 16, muted, 600),
        lbl(c, 'T3 · Metric badge', 40, 316, 180, 22, 16, warm, 800),
        lbl(c, 'Upper-right OCR', 40, 344, 180, 22, 16, muted, 600),

        // Column 2 cards
        lbl(c, 'Slot 0: Global', 300, 86, 164, 22, 16, blue, 800),
        lbl(c, 'Resized 336×336', 300, 118, 164, 22, 16, c.textPrimary, 650),
        lbl(c, 'Layout context', 300, 150, 164, 22, 16, muted, 600),

        lbl(c, 'Local Crops', 300, 230, 164, 22, 16, green, 800),
        lbl(c, 'Native 336×336', 300, 262, 164, 22, 16, c.textPrimary, 650),
        lbl(c, 'Box coordinates:', 300, 298, 164, 22, 16, muted, 600),
        lbl(c, '[y0, x0, y1, x1]', 300, 328, 164, 22, 16, green, 700, 'left', true),

        // Column 3 prefix items
        lbl(c, '<global>', 542, 82, 180, 22, 16, blue, 800, 'left', true),
        lbl(c, '576 tokens', 542, 106, 180, 22, 16, muted, 650),

        lbl(c, '<crop_T4>', 542, 152, 180, 22, 16, green, 800, 'left', true),
        lbl(c, '576 tokens (axis)', 542, 176, 180, 22, 16, muted, 650),

        lbl(c, '<crop_T3>', 542, 222, 180, 22, 16, warm, 800, 'left', true),
        lbl(c, '576 tokens (badge)', 542, 246, 180, 22, 16, muted, 650),

        lbl(c, '<user_prompt>', 542, 300, 180, 22, 16, c.textPrimary, 700, 'left', true),

        lbl(c, '1,728 vis + text', 530, 356, 204, 22, 16, green, 800, 'center', true),
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
