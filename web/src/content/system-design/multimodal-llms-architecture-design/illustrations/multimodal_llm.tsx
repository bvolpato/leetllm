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
    'Multimodal LLM architecture schematic: Vision (ViT patches), Audio (100 Hz spectrogram), and Text (BPE tokens) pass through encoders and enter an autoregressive language decoder via either Pathway A (MLP/Q-Former prefix projection into shared self-attention) or Pathway B (Perceiver latent memory read by gated cross-attention), producing grounded text, boxes, and timestamps.'

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
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const geometry = [
        // Stage 1: Encoders (x=14..216, w=202)
        SvgFrame({ c, key: 's1', x: 14, y: 14, width: 202, height: 382, rx: 10, fill: c.bgCard, stroke: c.borderSubtle, strokeWidth: 1.2 }),
        SvgFrame({ c, key: 'enc-v', x: 26, y: 66, width: 178, height: 84, rx: 8, fill: withColorAlpha(blue, 0.12), stroke: blue, strokeWidth: 1.6 }),
        SvgFrame({ c, key: 'enc-a', x: 26, y: 174, width: 178, height: 84, rx: 8, fill: withColorAlpha(purple, 0.12), stroke: purple, strokeWidth: 1.6 }),
        SvgFrame({ c, key: 'enc-t', x: 26, y: 282, width: 178, height: 84, rx: 8, fill: withColorAlpha(green, 0.12), stroke: green, strokeWidth: 1.6 }),

        // Stage 2: Connectors (x=254..486, w=232)
        SvgFrame({ c, key: 's2', x: 254, y: 14, width: 232, height: 382, rx: 10, fill: c.bgCard, stroke: c.borderSubtle, strokeWidth: 1.2 }),
        SvgFrame({ c, key: 'conn-a', x: 266, y: 66, width: 208, height: 132, rx: 8, fill: withColorAlpha(blue, 0.1), stroke: blue, strokeWidth: 1.6 }),
        SvgFrame({ c, key: 'conn-b', x: 266, y: 226, width: 208, height: 132, rx: 8, fill: withColorAlpha(warm, 0.1), stroke: warm, strokeWidth: 1.6 }),

        // Stage 3: Decoder & Output (x=524..746, w=222)
        SvgFrame({ c, key: 's3', x: 524, y: 14, width: 222, height: 382, rx: 10, fill: c.bgCard, stroke: c.borderSubtle, strokeWidth: 1.2 }),
        SvgFrame({ c, key: 'dec', x: 536, y: 66, width: 198, height: 162, rx: 8, fill: withColorAlpha(green, 0.12), stroke: green, strokeWidth: 1.7 }),
        SvgFrame({ c, key: 'out', x: 536, y: 270, width: 198, height: 106, rx: 8, fill: c.bgSubtle, stroke: green, strokeWidth: 1.4 }),

        // Arrows Stage 1 -> Stage 2
        VectorArrow({ x1: 206, y1: 108, x2: 262, y2: 108, color: blue, strokeWidth: 2, arrowSize: 6 }),
        VectorArrow({ x1: 206, y1: 216, x2: 262, y2: 166, color: purple, strokeWidth: 2, arrowSize: 6 }),
        VectorArrow({ x1: 206, y1: 216, x2: 262, y2: 274, color: purple, strokeWidth: 1.8, arrowSize: 6 }),

        // Text bypass path along bottom to Decoder (never crosses Side Memory wire)
        createElement('path', {
            key: 'text-wire',
            d: 'M 206 324 L 236 324 L 236 376 L 512 376 L 512 204 L 530 204',
            fill: 'none',
            stroke: green,
            strokeWidth: 2,
            strokeDasharray: '5 3',
        }),
        VectorArrow({ x1: 522, y1: 204, x2: 534, y2: 204, color: green, strokeWidth: 2, arrowSize: 6 }),

        // Arrows Stage 2 -> Stage 3 (orthogonal elbow for Side Memory avoids crossing text wire)
        VectorArrow({ x1: 476, y1: 132, x2: 534, y2: 132, color: blue, strokeWidth: 2, arrowSize: 6 }),
        createElement('path', {
            key: 'side-wire',
            d: 'M 476 292 L 498 292 L 498 162 L 530 162',
            fill: 'none',
            stroke: warm,
            strokeWidth: 2,
        }),
        VectorArrow({ x1: 522, y1: 162, x2: 534, y2: 162, color: warm, strokeWidth: 2, arrowSize: 6 }),

        // Arrow Decoder -> Output
        VectorArrow({ x1: 635, y1: 230, x2: 635, y2: 266, color: green, strokeWidth: 2.2, arrowSize: 6 }),
    ]

    const labels = [
        // Stage headers
        lbl(c, '1 · Encoders', 26, 26, 178, 24, 17, c.textPrimary, 800, 'center'),
        lbl(c, '2 · Connectors', 266, 26, 208, 24, 17, c.textPrimary, 800, 'center'),
        lbl(c, '3 · LLM Decoder', 536, 26, 198, 24, 17, c.textPrimary, 800, 'center'),

        // Stage 1 cards
        lbl(c, 'Vision (ViT)', 38, 78, 154, 22, 16, blue, 800),
        lbl(c, '14×14 patches', 38, 110, 154, 22, 16, muted, 600),

        lbl(c, 'Audio (100 Hz)', 38, 186, 154, 22, 16, purple, 800),
        lbl(c, 'Mel frames', 38, 218, 154, 22, 16, muted, 600),

        lbl(c, 'Text Prompt', 38, 294, 154, 22, 16, green, 800),
        lbl(c, 'BPE tokens', 38, 326, 154, 22, 16, muted, 600),

        // Stage 2 cards
        lbl(c, 'A · Prefix Projection', 278, 78, 184, 22, 16, blue, 800),
        lbl(c, 'MLP / 2×2 / Q-Former', 278, 110, 184, 22, 16, c.textPrimary, 650),
        lbl(c, 'Interleaved prefix', 278, 140, 184, 22, 16, muted, 600),
        lbl(c, 'Shares KV cache', 278, 166, 184, 22, 16, muted, 600),

        lbl(c, 'B · Side Memory', 278, 238, 184, 22, 16, warm, 800),
        lbl(c, 'Perceiver Resampler', 278, 270, 184, 22, 16, c.textPrimary, 650),
        lbl(c, 'External K_v, V_v', 278, 300, 184, 22, 16, muted, 600),
        lbl(c, 'Off text prefix', 278, 326, 184, 22, 16, muted, 600),

        // Stage 3 cards
        lbl(c, 'Autoregressive LM', 548, 80, 174, 22, 16, green, 800),
        lbl(c, 'Self-Attention', 548, 114, 174, 22, 16, c.textPrimary, 650),
        lbl(c, '+ Cross-Attention', 548, 144, 174, 22, 16, warm, 700),
        lbl(c, 'Paged KV Cache', 548, 184, 174, 22, 16, muted, 600),

        lbl(c, 'Grounded Output', 548, 282, 174, 22, 16, green, 800),
        lbl(c, 'Answer + citations', 548, 314, 174, 22, 16, c.textPrimary, 600),
        lbl(c, 'Boxes & timestamps', 548, 342, 174, 22, 16, muted, 600),
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
