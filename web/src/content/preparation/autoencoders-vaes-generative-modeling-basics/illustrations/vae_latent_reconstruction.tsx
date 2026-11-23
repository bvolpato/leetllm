import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 704
export const height = 592
export const alt =
    'Both lanes use the posterior with mu = [0.400, -0.200] and sigma approximately [0.705, 1.051]. Normal.sample passes a draw to the decoder while its reconstruction gradient ends at z. Normal.rsample uses fixed epsilon = [0.500, -1.000] to produce rounded z approximately [0.752, -1.251], with a path back to mu and sigma. Analytic KL gradients reach the encoder in both lanes.'

const boardWidth = 672
const boardHeight = 560
const labelScale = width / boardWidth

function label(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 24,
    color = c.textPrimary,
    mono = false,
    weight = 600,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * 1.5,
        children: TextLabel({
            c,
            text,
            fontSize: size * labelScale,
            color,
            mono,
            fontWeight: weight,
            align,
        }),
    })
}

const illustration = defineIllustration((c) => {
    const purple = getReadableToneColor('purple', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('critical', c)

    const boxes = createElement(
        'svg',
        {
            width: boardWidth,
            height: boardHeight,
            viewBox: `0 0 ${boardWidth} ${boardHeight}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...[
            { x: 8, y: 160, w: 145, h: 56, color: purple },
            { x: 176, y: 160, w: 145, h: 56, color: red },
            { x: 344, y: 160, w: 145, h: 56, color: blue },
            { x: 512, y: 160, w: 145, h: 56, color: warm },
            { x: 8, y: 365, w: 145, h: 56, color: purple },
            { x: 176, y: 365, w: 145, h: 56, color: green },
            { x: 344, y: 365, w: 145, h: 56, color: blue },
            { x: 512, y: 365, w: 145, h: 56, color: warm },
            { x: 8, y: 235, w: 145, h: 36, color: purple },
            { x: 8, y: 440, w: 145, h: 36, color: purple },
        ].map((box) =>
            SvgFrame({
                c,
                x: box.x,
                y: box.y,
                width: box.w,
                height: box.h,
                rx: 10,
                fill: c.bgCard,
                stroke: box.color,
                strokeWidth: 2,
            }),
        ),
        ...[
            [153, 188, 172, 188, c.textMuted],
            [321, 188, 340, 188, c.textMuted],
            [489, 188, 508, 188, c.textMuted],
            [153, 393, 172, 393, c.textMuted],
            [321, 393, 340, 393, c.textMuted],
            [489, 393, 508, 393, c.textMuted],
        ].map(([x1, y1, x2, y2, color], index) =>
            VectorArrow({
                key: `forward-${index}`,
                x1: Number(x1),
                y1: Number(y1),
                x2: Number(x2),
                y2: Number(y2),
                color: String(color),
                strokeWidth: 3,
                arrowSize: 7,
            }),
        ),
        VectorArrow({
            x1: 80,
            y1: 235,
            x2: 80,
            y2: 221,
            color: purple,
            strokeWidth: 3,
            arrowSize: 7,
        }),
        VectorArrow({
            x1: 80,
            y1: 440,
            x2: 80,
            y2: 426,
            color: purple,
            strokeWidth: 3,
            arrowSize: 7,
        }),
        VectorArrow({
            x1: 586,
            y1: 279,
            x2: 165,
            y2: 279,
            color: red,
            strokeWidth: 3,
            arrowSize: 7,
        }),
        VectorArrow({
            x1: 586,
            y1: 488,
            x2: 33,
            y2: 488,
            color: green,
            strokeWidth: 4,
            arrowSize: 8,
        }),
        createElement('line', {
            key: 'sample-stop',
            x1: 165,
            y1: 267,
            x2: 165,
            y2: 292,
            stroke: red,
            strokeWidth: 4,
        }),
    )

    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardWidth,
        children: Board({
            c,
            width: boardWidth,
            height: boardHeight,
            children: [
                CanvasItem({ x: 0, y: 0, width: boardWidth, height: boardHeight, children: boxes }),
                label(
                    c,
                    12,
                    8,
                    648,
                    'Sampling controls the gradient path',
                    28,
                    c.textPrimary,
                    false,
                    800,
                ),
                label(
                    c,
                    8,
                    48,
                    656,
                    'μ=[0.400,−0.200]  σ≈[0.705,1.051]',
                    24,
                    purple,
                    true,
                    650,
                    'center',
                ),
                label(
                    c,
                    12,
                    80,
                    648,
                    'ε=[0.500,−1.000]  →  z≈[0.752,−1.251]',
                    24,
                    green,
                    true,
                    650,
                    'center',
                ),
                label(
                    c,
                    8,
                    119,
                    648,
                    'sample() · the reconstruction path stops at the draw',
                    24,
                    c.textPrimary,
                    false,
                    700,
                    'center',
                ),
                label(c, 11, 174, 139, 'μ, σ', 24, purple, true, 750, 'center'),
                label(c, 179, 174, 139, 'sample()', 24, red, false, 750, 'center'),
                label(c, 347, 174, 139, 'Decoder', 24, blue, false, 750, 'center'),
                label(c, 515, 174, 139, 'Recon loss', 24, warm, false, 750, 'center'),
                label(
                    c,
                    175,
                    286,
                    480,
                    'Pathwise route ends before μ, σ.',
                    24,
                    red,
                    false,
                    700,
                    'center',
                ),
                label(c, 8, 239, 145, 'KL loss', 24, purple, false, 700, 'center'),
                label(
                    c,
                    164,
                    239,
                    488,
                    'Analytic KL gradient → μ, σ',
                    24,
                    purple,
                    false,
                    650,
                    'left',
                ),
                label(c, 8, 444, 145, 'KL loss', 24, purple, false, 700, 'center'),
                label(
                    c,
                    164,
                    444,
                    488,
                    'Analytic KL gradient → μ, σ',
                    24,
                    purple,
                    false,
                    650,
                    'left',
                ),
                label(
                    c,
                    8,
                    324,
                    648,
                    'rsample() · fixed ε keeps the path to μ, σ',
                    24,
                    c.textPrimary,
                    false,
                    700,
                    'center',
                ),
                label(c, 11, 379, 139, 'μ, σ', 24, purple, true, 750, 'center'),
                label(c, 179, 379, 139, 'μ + σ ⊙ ε', 24, green, true, 750, 'center'),
                label(c, 347, 379, 139, 'Decoder', 24, blue, false, 750, 'center'),
                label(c, 515, 379, 139, 'Recon loss', 24, warm, false, 750, 'center'),
                label(
                    c,
                    12,
                    500,
                    648,
                    '∂zᵢ/∂μᵢ = 1     ∂zᵢ/∂σᵢ = εᵢ',
                    26,
                    green,
                    true,
                    700,
                    'center',
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
