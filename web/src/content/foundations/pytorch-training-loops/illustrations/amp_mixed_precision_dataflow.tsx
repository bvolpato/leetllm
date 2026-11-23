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
export const height = 592
export const preset = 'engineering'
export const alt =
    'CUDA AMP keeps stored parameters in float32 while eligible matrix operations use float16 and cross-entropy uses float32. With scale 65536, a true gradient norm of 2 becomes 131072 in the gradient buffer; unscale restores 2 before clipping to 1. Finite gradients update weights and hold or double scale after 2000 steps; non-finite gradients skip the update and halve the scale.'

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

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board background="transparent" c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        <SvgFrame
                            c={c}
                            x={16}
                            y={94}
                            width={788}
                            height={120}
                            rx={12}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                        <SvgFrame
                            c={c}
                            x={30}
                            y={144}
                            width={212}
                            height={54}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={blue}
                            strokeWidth={1.8}
                        />
                        <VectorArrow
                            x1={250}
                            y1={171}
                            x2={290}
                            y2={171}
                            color={purple}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                        <SvgFrame
                            c={c}
                            x={298}
                            y={144}
                            width={224}
                            height={54}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={purple}
                            strokeWidth={1.8}
                        />
                        <VectorArrow
                            x1={530}
                            y1={171}
                            x2={570}
                            y2={171}
                            color={blue}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                        <SvgFrame
                            c={c}
                            x={578}
                            y={144}
                            width={212}
                            height={54}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={blue}
                            strokeWidth={1.8}
                        />

                        <SvgFrame
                            c={c}
                            x={16}
                            y={228}
                            width={788}
                            height={174}
                            rx={12}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                        <SvgFrame
                            c={c}
                            x={30}
                            y={282}
                            width={228}
                            height={102}
                            rx={10}
                            fill={c.bgSubtle}
                            stroke={red}
                            strokeWidth={1.8}
                        />
                        <VectorArrow
                            x1={264}
                            y1={333}
                            x2={294}
                            y2={333}
                            color={blue}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                        <SvgFrame
                            c={c}
                            x={302}
                            y={282}
                            width={220}
                            height={102}
                            rx={10}
                            fill={c.bgSubtle}
                            stroke={blue}
                            strokeWidth={1.8}
                        />
                        <VectorArrow
                            x1={528}
                            y1={333}
                            x2={558}
                            y2={333}
                            color={green}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                        <SvgFrame
                            c={c}
                            x={566}
                            y={282}
                            width={224}
                            height={102}
                            rx={10}
                            fill={c.bgSubtle}
                            stroke={green}
                            strokeWidth={1.8}
                        />

                        <SvgFrame
                            c={c}
                            x={16}
                            y={416}
                            width={386}
                            height={160}
                            rx={12}
                            fill={c.bgCard}
                            stroke={green}
                            strokeWidth={1.8}
                        />
                        <SvgFrame
                            c={c}
                            x={418}
                            y={416}
                            width={386}
                            height={160}
                            rx={12}
                            fill={c.bgCard}
                            stroke={red}
                            strokeWidth={1.8}
                        />
                    </svg>
                </CanvasItem>
                {lbl(
                    c,
                    16,
                    10,
                    788,
                    'CUDA AMP: dtype policy and GradScaler',
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
                    'Stored weights stay FP32; scaled gradients unscale before clipping.',
                    24,
                    c.textSecondary,
                )}
                {lbl(
                    c,
                    30,
                    106,
                    760,
                    'Autocast chooses operation dtypes; stored W remains FP32',
                    24,
                    c.textPrimary,
                    'left',
                    700,
                )}
                {lbl(c, 36, 155, 200, 'stored W · FP32', 24, blue, 'center', 700)}
                {lbl(c, 304, 155, 212, 'linear op · FP16', 24, purple, 'center', 700)}
                {lbl(c, 584, 155, 200, 'CE loss · FP32', 24, blue, 'center', 700)}

                {lbl(
                    c,
                    30,
                    240,
                    760,
                    'Gradient scaling flow (true norm = 2 · S = 65536 · max_norm = 1)',
                    24,
                    c.textPrimary,
                    'left',
                    700,
                )}
                {lbl(c, 36, 294, 216, 'scaled backward', 24, red, 'center', 700)}
                {lbl(c, 36, 336, 216, 'norm = 131072', 25, red, 'center', 750)}
                {lbl(c, 308, 294, 208, 'unscale_(opt)', 24, blue, 'center', 700)}
                {lbl(c, 308, 336, 208, 'norm = 2', 25, blue, 'center', 750)}
                {lbl(c, 572, 294, 212, 'clip_grad_norm_', 24, green, 'center', 700)}
                {lbl(c, 572, 336, 212, 'norm = 1', 25, green, 'center', 750)}

                {lbl(c, 32, 430, 354, 'Finite gradients · step runs', 24, green, 'left', 720)}
                {lbl(c, 32, 474, 354, 'W → W′ · S unchanged', 24, c.textPrimary)}
                {lbl(c, 32, 518, 354, '2000 finite steps → S × 2', 24, c.textSecondary)}

                {lbl(c, 434, 430, 354, 'Inf / NaN · step skipped', 24, red, 'left', 720)}
                {lbl(c, 434, 474, 354, 'W held · S → S / 2', 24, c.textPrimary)}
                {lbl(c, 434, 518, 354, 'Next zero_grad() clears .grad', 24, c.textSecondary)}
            </Board>
        </Scene>
    )
}

export default create('dark')
