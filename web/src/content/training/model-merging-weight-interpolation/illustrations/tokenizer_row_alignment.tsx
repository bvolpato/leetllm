import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    renderMathSvg,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 690
export const alt =
    'Two tokenizer vocabularies can assign different strings to integer ID 417: one maps it to return and another to a newly added code token named fim_prefix. A union output vocabulary aligns embedding and language-model-head rows by token string. The rows for missing tokens require the configured fallback and evaluation; the diagram specifies no output-ID order.'
export const numericFixture = {
    conflictingId: 417,
    tokenizerAString: 'return',
    tokenizerBString: '<fim_prefix>',
    baseVocabulary: ['<bos>', 'def', 'return'],
    codeVocabulary: ['<bos>', 'def', 'return', '<fim_prefix>'],
    alignedTensorFamilies: ['W_emb', 'W_head'],
}

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

function mathLabel(
    c: ReturnType<typeof getThemeColors>,
    tex: string,
    x: number,
    y: number,
    size: number,
    color: string,
) {
    const math = renderMathSvg(tex, { fontSize: size, color })
    return CanvasItem({
        x,
        y,
        width: math.width,
        height: math.height,
        children: createElement('img', {
            src: 'data:image/svg+xml;utf8,' + encodeURIComponent(math.svg),
            width: math.width,
            height: math.height,
            alt: tex,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const a = getReadableToneColor('cyan', c)
    const b = getReadableToneColor('purple', c)
    const union = getReadableToneColor('green', c)
    const matrix = getReadableToneColor('blue', c)
    const art = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        SvgFrame({
            c,
            x: 18,
            y: 112,
            width: 254,
            height: 118,
            rx: 12,
            fill: c.bgSubtle,
            stroke: a,
            strokeWidth: 1.7,
        }),
        SvgFrame({
            c,
            x: 288,
            y: 112,
            width: 254,
            height: 118,
            rx: 12,
            fill: c.bgSubtle,
            stroke: b,
            strokeWidth: 1.7,
        }),
        ...[300, 385].map((y) =>
            SvgFrame({
                c,
                x: 18,
                y,
                width: 524,
                height: 64,
                rx: 9,
                fill: c.bgSubtle,
                stroke: c.border,
                strokeWidth: 1.4,
            }),
        ),
        VectorArrow({
            x1: 112,
            y1: 179,
            x2: 136,
            y2: 179,
            color: a,
            strokeWidth: 2.4,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: 382,
            y1: 179,
            x2: 405,
            y2: 179,
            color: b,
            strokeWidth: 2.4,
            arrowSize: 4,
        }),
        ...[0, 1].flatMap((i) => [
            VectorArrow({
                x1: 178,
                y1: 336 + i * 85,
                x2: 238,
                y2: 336 + i * 85,
                color: union,
                strokeWidth: 2.4,
                arrowSize: 8,
            }),
            VectorArrow({
                x1: 366,
                y1: 336 + i * 85,
                x2: 390,
                y2: 336 + i * 85,
                color: matrix,
                strokeWidth: 2.4,
                arrowSize: 4,
            }),
        ]),
    )
    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({ x: 0, y: 0, width, height, children: art }),
                label(
                    c,
                    'Align vocabulary rows by token string',
                    16,
                    10,
                    528,
                    35,
                    24,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Each tokenizer assigns its own string to ID 417.',
                    18,
                    49,
                    524,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(c, 'Tokenizer A', 30, 126, 220, 26, 20, a, 'center'),
                label(c, 'ID 417', 30, 164, 82, 30, 21, c.textPrimary, 'center'),
                label(c, 'return', 140, 164, 112, 30, 21, a, 'center'),
                label(c, 'Tokenizer B', 300, 126, 230, 26, 20, b, 'center'),
                label(c, 'ID 417', 300, 164, 82, 30, 21, c.textPrimary, 'center'),
                label(c, '<fim_prefix>', 408, 164, 128, 30, 20, b, 'center'),
                label(
                    c,
                    'Output tokens shown · row order is unspecified',
                    22,
                    250,
                    516,
                    30,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(c, 'return', 32, 319, 134, 28, 21, union, 'center'),
                mathLabel(c, 'W_{\\mathrm{emb}}', 244, 317, 21, matrix),
                mathLabel(c, 'W_{\\mathrm{head}}', 394, 317, 21, matrix),
                label(c, '<fim_prefix>', 24, 392, 150, 27, 20, union, 'center'),
                label(c, 'code only', 24, 417, 150, 23, 20, c.textSecondary, 'center'),
                mathLabel(c, 'W_{\\mathrm{emb}}', 244, 402, 21, matrix),
                mathLabel(c, 'W_{\\mathrm{head}}', 394, 402, 21, matrix),
                label(
                    c,
                    'Align rows by token string before combining tensors.',
                    24,
                    482,
                    512,
                    29,
                    20,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Missing rows use the configured fallback; test the merged model.',
                    24,
                    526,
                    512,
                    52,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(
                    c,
                    'Union adds token strings; it does not reconcile segmentation or normalization.',
                    22,
                    600,
                    516,
                    52,
                    20,
                    c.textSecondary,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
