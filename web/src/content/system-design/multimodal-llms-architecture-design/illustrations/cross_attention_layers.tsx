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
export const height = 420
export const alt =
    'Flamingo-style gated cross-attention circuit. On the left, a Vision Encoder and Perceiver Resampler compress N visual patches into a static side memory of M latent keys K_v and values V_v off the text prefix. On the right, text states h_text pass through a gated cross-attention block computing h + tanh(alpha) * Attn(Q, K_v, V_v) with alpha initialized at 0, then continue into frozen Self-Attention and FFN layers.'

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

    const geometry = [
        // Left Panel: Visual Side Memory (soft translucent semantic zone)
        SvgFrame({ c, key: 'left', x: 14, y: 14, width: 250, height: 392, rx: 10, fill: withColorAlpha(blue, 0.04), stroke: withColorAlpha(blue, 0.42), strokeWidth: 1.25 }),
        SvgFrame({ c, key: 'vit', x: 28, y: 66, width: 222, height: 74, rx: 8, fill: withColorAlpha(blue, 0.1), stroke: blue, strokeWidth: 1.5 }),
        VectorArrow({ x1: 139, y1: 142, x2: 139, y2: 174, color: blue, strokeWidth: 2, arrowSize: 6 }),
        SvgFrame({ c, key: 'perc', x: 28, y: 178, width: 222, height: 92, rx: 8, fill: withColorAlpha(blue, 0.16), stroke: blue, strokeWidth: 1.8 }),
        SvgFrame({ c, key: 'store', x: 28, y: 294, width: 222, height: 92, rx: 8, fill: withColorAlpha(c.borderSubtle, 0.2), stroke: c.borderSubtle, strokeWidth: 1.1 }),

        // Right Panel: Decoder Trunk (soft translucent semantic zone)
        SvgFrame({ c, key: 'right', x: 358, y: 14, width: 388, height: 392, rx: 10, fill: withColorAlpha(green, 0.04), stroke: withColorAlpha(green, 0.42), strokeWidth: 1.25 }),

        // Input h_text
        SvgFrame({ c, key: 'hin', x: 374, y: 64, width: 356, height: 48, rx: 7, fill: withColorAlpha(green, 0.12), stroke: green, strokeWidth: 1.5 }),
        VectorArrow({ x1: 552, y1: 114, x2: 552, y2: 142, color: green, strokeWidth: 2, arrowSize: 6 }),

        // Gated Cross-Attention block
        SvgFrame({ c, key: 'xattn', x: 374, y: 146, width: 356, height: 116, rx: 8, fill: withColorAlpha(warm, 0.14), stroke: warm, strokeWidth: 2 }),
        VectorArrow({ x1: 552, y1: 264, x2: 552, y2: 290, color: green, strokeWidth: 2, arrowSize: 6 }),

        // Frozen Self-Attn + FFN
        SvgFrame({ c, key: 'sattn', x: 374, y: 294, width: 356, height: 44, rx: 7, fill: c.bgSubtle, stroke: c.borderSubtle, strokeWidth: 1.3 }),
        VectorArrow({ x1: 552, y1: 340, x2: 552, y2: 356, color: green, strokeWidth: 2, arrowSize: 6 }),

        // Output h_next
        SvgFrame({ c, key: 'hout', x: 374, y: 360, width: 356, height: 34, rx: 7, fill: withColorAlpha(green, 0.16), stroke: green, strokeWidth: 1.5 }),

        // Cross-modal K_v, V_v bridge arrow
        VectorArrow({ x1: 254, y1: 218, x2: 370, y2: 218, color: blue, strokeWidth: 2.4, arrowSize: 6 }),
    ]

    const labels = [
        // Left panel labels
        lbl(c, 'Side Visual Memory', 26, 28, 226, 24, 17, blue, 800, 'center'),
        lbl(c, 'Vision Encoder (ViT)', 40, 78, 200, 22, 16, blue, 800),
        lbl(c, 'N spatial patches', 40, 108, 200, 22, 16, muted, 600),

        lbl(c, 'Perceiver Resampler', 40, 188, 200, 22, 16, blue, 800),
        lbl(c, 'M fixed latents (64)', 40, 216, 200, 22, 16, c.textPrimary, 650),
        lbl(c, 'Emits K_v, V_v', 40, 242, 200, 22, 16, blue, 700, 'left', true),

        lbl(c, 'Off Text Prefix', 40, 308, 200, 22, 16, c.textPrimary, 800),
        lbl(c, 'Zero prefix KV bloat', 40, 336, 200, 22, 16, muted, 600),
        lbl(c, 'Reused across turns', 40, 360, 200, 22, 16, muted, 600),

        // Bridge arrow label (single line cleanly above arrow!)
        lbl(c, 'K_v, V_v', 264, 188, 94, 22, 16, blue, 800, 'center', true),

        // Right panel labels
        lbl(c, 'Frozen LLM Trunk + Gated Fusion', 374, 28, 356, 24, 17, green, 800, 'center'),
        lbl(c, 'Text state h_text (Queries Q)', 384, 77, 336, 22, 16, green, 700, 'center'),

        lbl(c, 'Gated Cross-Attention (trainable)', 384, 156, 336, 22, 16, warm, 800, 'center'),
        lbl(c, 'h + tanh(α) · Attn(Q, K_v, V_v)', 384, 190, 336, 24, 16, c.textPrimary, 800, 'center', true),
        lbl(c, 'Init α = 0 → tanh(0) = 0 (no shift)', 384, 226, 336, 22, 16, warm, 700, 'center'),

        lbl(c, 'Frozen Self-Attention + FFN', 384, 305, 336, 22, 16, c.textPrimary, 700, 'center'),
        lbl(c, 'Next layer state h_next', 384, 366, 336, 22, 16, green, 800, 'center'),
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
