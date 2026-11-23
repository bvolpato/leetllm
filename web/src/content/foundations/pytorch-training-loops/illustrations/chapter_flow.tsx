import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 820
export const height = 556
export const preset = 'engineering'
export const alt =
    'Two sequence rows enter a zero-initialized two-class linear model. Raw logits are zero and mean cross-entropy is 0.6931. Backward fills a separate gradient buffer while weights remain zero. SGD with learning rate 0.2 updates the weights to minus 0.1 in class 0 and plus 0.1 in class 1, producing correct class scores.'

const lbl = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 24,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 550,
) => (
    <CanvasItem x={x} y={y} width={w} height={size + 10}>
        <TextLabel
            c={c}
            text={text}
            width={w}
            fontSize={size}
            color={color}
            align={align}
            fontWeight={fontWeight}
        />
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const red = getReadableToneColor('critical', c)
    const green = getReadableToneColor('green', c)

    const topMatrices = [
        { x: 28, y: 150, cw: 96, values: ['+1', '+1', '−1', '−1'], color: blue },
        { x: 312, y: 150, cw: 96, values: ['0', '0', '0', '0'], color: purple },
        { x: 592, y: 150, cw: 96, values: ['+0.5', '+0.5', '−0.5', '−0.5'], color: red },
    ]
    const botMatrices = [
        { x: 36, y: 376, cw: 152, values: ['−0.1', '−0.1', '+0.1', '+0.1'], color: green },
        { x: 460, y: 376, cw: 154, values: ['−0.2', '+0.2', '+0.2', '−0.2'], color: green },
    ]
    const matrices = [...topMatrices, ...botMatrices]

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board background="transparent" c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        <SvgFrame
                            c={c}
                            x={16}
                            y={94}
                            width={224}
                            height={206}
                            rx={12}
                            fill={c.bgCard}
                            stroke={blue}
                            strokeWidth={1.5}
                        />
                        <SvgFrame
                            c={c}
                            x={296}
                            y={94}
                            width={228}
                            height={206}
                            rx={12}
                            fill={c.bgCard}
                            stroke={purple}
                            strokeWidth={1.5}
                        />
                        <SvgFrame
                            c={c}
                            x={580}
                            y={94}
                            width={224}
                            height={206}
                            rx={12}
                            fill={c.bgCard}
                            stroke={red}
                            strokeWidth={1.5}
                        />
                        <SvgFrame
                            c={c}
                            x={16}
                            y={320}
                            width={360}
                            height={220}
                            rx={12}
                            fill={c.bgCard}
                            stroke={green}
                            strokeWidth={1.5}
                        />
                        <SvgFrame
                            c={c}
                            x={440}
                            y={320}
                            width={364}
                            height={220}
                            rx={12}
                            fill={c.bgCard}
                            stroke={green}
                            strokeWidth={1.5}
                        />
                        <VectorArrow
                            x1={244}
                            y1={198}
                            x2={290}
                            y2={198}
                            color={blue}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                        <VectorArrow
                            x1={528}
                            y1={198}
                            x2={574}
                            y2={198}
                            color={red}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                        <VectorArrow
                            x1={380}
                            y1={430}
                            x2={434}
                            y2={430}
                            color={green}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                        {matrices.map((m, mi) =>
                            m.values.map((_, i) => (
                                <SvgFrame
                                    key={`${mi}-${i}`}
                                    c={c}
                                    x={m.x + (i % 2) * (m.cw + 8)}
                                    y={m.y + Math.floor(i / 2) * 50}
                                    width={m.cw}
                                    height={44}
                                    rx={8}
                                    fill={c.bgSubtle}
                                    stroke={m.color}
                                    strokeWidth={1.5}
                                />
                            )),
                        )}
                    </svg>
                </CanvasItem>
                {lbl(
                    c,
                    16,
                    10,
                    788,
                    'One SGD update, two sequences',
                    29,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {lbl(
                    c,
                    16,
                    48,
                    788,
                    'backward() fills .grad; step() updates W from 0 to W₁.',
                    24,
                    c.textSecondary,
                )}
                {lbl(c, 26, 108, 204, 'Inputs X (2, 2)', 24, blue, 'center', 700)}
                {lbl(c, 306, 108, 208, 'Logits Z₀ = XW₀ᵀ', 24, purple, 'center', 700)}
                {lbl(c, 590, 108, 204, 'Gradient W₀.grad', 24, red, 'center', 700)}
                {lbl(c, 238, 158, 58, 'W₀', 24, purple, 'center', 700)}
                {lbl(c, 522, 158, 58, 'CE', 24, red, 'center', 700)}
                {lbl(c, 26, 258, 204, 'targets y = [1, 0]', 24, blue, 'center')}
                {lbl(c, 306, 258, 208, 'CE = 0.6931', 24, red, 'center')}
                {lbl(c, 590, 258, 204, 'W₀ stays zero', 24, purple, 'center')}
                {lbl(c, 28, 334, 336, 'step(): W₁ = W₀ − 0.2 dW', 24, green, 'center', 700)}
                {lbl(c, 452, 334, 340, 'Updated logits Z₁ = XW₁ᵀ', 24, green, 'center', 700)}
                {lbl(c, 376, 390, 64, 'XW₁ᵀ', 24, green, 'center', 700)}
                {lbl(c, 28, 492, 336, 'Rows: class 0, class 1', 24, c.textSecondary, 'center')}
                {lbl(c, 452, 492, 340, '[+1,+1] → 1 · [−1,−1] → 0', 24, green, 'center')}
                {matrices.flatMap((m, mi) =>
                    m.values.map((v, i) =>
                        lbl(
                            c,
                            m.x + (i % 2) * (m.cw + 8),
                            m.y + Math.floor(i / 2) * 50 + 6,
                            m.cw,
                            v,
                            24,
                            m.color,
                            'center',
                            650,
                        ),
                    ),
                )}
            </Board>
        </Scene>
    )
}

export default create('dark')
