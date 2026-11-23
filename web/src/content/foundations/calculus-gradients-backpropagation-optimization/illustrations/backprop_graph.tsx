import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 840
export const height = 436
export const alt =
    'A tiny network as a left-to-right chain. Forward pass: input x equals 2 goes through w1 times x plus b1 to give h equals 2, through ReLU to give z equals 2, through w2 times z plus b2 to give y hat equals 4.5, and against target 5 to give loss 0.25. Backward pass, right to left: the loss signal is 1, the derivative with respect to y hat is minus 1, with respect to z is minus 2, with respect to h is minus 2. Parameter gradients branch off: w2 gets minus 2, b2 gets minus 1, w1 gets minus 4, and b1 gets minus 2.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const marks: React.ReactNode[] = []
    const labels: React.ReactNode[] = []
    const text = (
        s: string,
        x: number,
        y: number,
        w: number,
        size = 25,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) =>
        labels.push(
            <CanvasItem key={`l${labels.length}`} x={x} y={y} width={w} height={size + 12}>
                <TextLabel
                    c={c}
                    text={s}
                    width={w}
                    fontSize={size}
                    color={color}
                    align={align}
                    fontWeight={weight}
                />
            </CanvasItem>,
        )

    const boxes = [
        { x: 100, w: 108, label: 'w₁x + b₁', rightVal: 'h = 2', grad: '−2' },
        { x: 300, w: 88, label: 'ReLU', rightVal: 'z = 2', grad: '−2' },
        { x: 480, w: 108, label: 'w₂z + b₂', rightVal: 'ŷ = 4.5', grad: '−1' },
        { x: 684, w: 116, label: '(ŷ − 5)²', rightVal: '', grad: '' },
    ]
    text('Forward pass (left to right)', 16, 12, 380, 26, blue, 'left', 650)
    text('Backward pass (right to left)', 428, 12, 380, 26, warm, 'right', 650)
    text('x = 2', 10, 96, 68, 25, blue, 'center', 650)
    marks.push(
        VectorArrow({
            key: 'a0',
            x1: 76,
            y1: 112,
            x2: 96,
            y2: 112,
            color: blue,
            strokeWidth: 2.5,
            arrowSize: 5,
        }),
    )

    boxes.forEach((b, i) => {
        marks.push(
            SvgFrame({
                key: `bx${i}`,
                c,
                x: b.x,
                y: 78,
                width: b.w,
                height: 68,
                fill: c.bg,
                stroke: blue,
                strokeWidth: 2,
            }),
        )
        text(b.label, b.x + 2, 95, b.w - 4, 25, blue, 'center', 650)
        if (i < 3) {
            const nx = boxes[i + 1]!.x
            const rx = b.x + b.w
            const mid = (rx + nx) / 2
            marks.push(
                VectorArrow({
                    key: `af${i}`,
                    x1: rx + 6,
                    y1: 112,
                    x2: nx - 6,
                    y2: 112,
                    color: blue,
                    strokeWidth: 2.5,
                    arrowSize: 5,
                }),
            )
            text(b.rightVal, mid - 49, 68, 98, 25, blue, 'center')
            marks.push(
                VectorArrow({
                    key: `ab${i}`,
                    x1: nx - 8,
                    y1: 196,
                    x2: rx + 8,
                    y2: 196,
                    color: warm,
                    strokeWidth: 2.5,
                    arrowSize: 5,
                }),
            )
            text(b.grad, mid - 44, 208, 88, 25, warm, 'center', 650)
        }
    })

    text('L = 0.25', 682, 152, 120, 25, blue, 'center')
    text('∂L/∂L = 1', 670, 200, 144, 25, warm, 'center', 650)
    marks.push(
        VectorSegment({
            key: 'd1',
            x1: 154,
            y1: 148,
            x2: 154,
            y2: 248,
            color: warm,
            strokeWidth: 2,
            showStartDot: false,
            showEndDot: false,
        }),
    )
    marks.push(
        VectorSegment({
            key: 'd2',
            x1: 534,
            y1: 148,
            x2: 534,
            y2: 248,
            color: warm,
            strokeWidth: 2,
            showStartDot: false,
            showEndDot: false,
        }),
    )

    text('w₁ = 1.5  →  ∂L/∂w₁ = −4', 24, 258, 360, 25, warm)
    text('b₁ = −1  →  ∂L/∂b₁ = −2', 24, 298, 360, 25, warm)
    text('w₂ = 2  →  ∂L/∂w₂ = −2', 420, 258, 360, 25, warm)
    text('b₂ = 0.5  →  ∂L/∂b₂ = −1', 420, 298, 360, 25, warm)
    text(
        'Multiply local slopes right to left; sum paths when shared.',
        16,
        360,
        792,
        25,
        c.textSecondary,
        'center',
    )

    return Scene({
        c,
        padding: 8,
        gap: 0,
        contentWidth: 824,
        background: c.bgSubtle,
        children: Board({
            c,
            width: 824,
            height: 420,
            background: c.bgSubtle,
            children: [
                <CanvasItem key="svg" x={0} y={0} width={824} height={420}>
                    <svg width={824} height={420} viewBox="0 0 824 420">
                        {marks}
                    </svg>
                </CanvasItem>,
                ...labels,
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
