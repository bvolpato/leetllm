import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 820
export const height = 572
export const preset = 'engineering'
export const alt =
    'All 60 measured training and validation losses on a logarithmic axis for the CPU classification run. Two training updates change weight storage; validation reads frozen end-of-epoch weights. Epoch 60 is selected at validation loss 0.011815 and four state tensors are copied into an independent checkpoint snapshot.'

const training = [
    0.621121, 0.51247, 0.468788, 0.348909, 0.288985, 0.233713, 0.184051, 0.151509, 0.122953,
    0.10219, 0.086099, 0.073623, 0.06426, 0.056386, 0.049634, 0.044081, 0.039506, 0.035788,
    0.032656, 0.030066, 0.027993, 0.025556, 0.02375, 0.022152, 0.021114, 0.019471, 0.018323,
    0.017302, 0.016381, 0.015529, 0.014782, 0.014113, 0.013402, 0.012805, 0.012315, 0.011802,
    0.011271, 0.010876, 0.01041, 0.010029, 0.009677, 0.009336, 0.009042, 0.008765, 0.008453,
    0.008189, 0.007991, 0.00774, 0.0075, 0.007281, 0.007103, 0.006913, 0.00671, 0.006535, 0.00637,
    0.006232, 0.006082, 0.005916, 0.005788, 0.005651,
]
const validation = [
    0.535825, 0.4614, 0.391793, 0.33158, 0.278236, 0.232923, 0.196653, 0.166804, 0.143165, 0.124146,
    0.108762, 0.096212, 0.08588, 0.07726, 0.070064, 0.064033, 0.058892, 0.054457, 0.050586,
    0.047178, 0.044145, 0.041478, 0.039092, 0.036946, 0.034979, 0.033227, 0.031632, 0.030174,
    0.028835, 0.027607, 0.02647, 0.025416, 0.024443, 0.023539, 0.022692, 0.0219, 0.021163, 0.020468,
    0.019819, 0.019208, 0.018631, 0.018093, 0.017583, 0.017098, 0.01664, 0.016206, 0.01579,
    0.015395, 0.015019, 0.014661, 0.014318, 0.01399, 0.013678, 0.013378, 0.013091, 0.012814,
    0.012549, 0.012295, 0.01205, 0.011815,
]

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
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const lossY = (value: number) => 232 + (-Math.log10(value) / 3) * 200

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board background="transparent" c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        <SvgFrame
                            c={c}
                            x={16}
                            y={92}
                            width={788}
                            height={72}
                            rx={12}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                        {[144, 238, 332].map((bx, i) => (
                            <React.Fragment key={bx}>
                                <SvgFrame
                                    c={c}
                                    x={bx}
                                    y={104}
                                    width={60}
                                    height={48}
                                    rx={8}
                                    fill={c.bgSubtle}
                                    stroke={purple}
                                    strokeWidth={1.8}
                                />
                                {i < 2 && (
                                    <VectorArrow
                                        x1={bx + 64}
                                        y1={128}
                                        x2={bx + 88}
                                        y2={128}
                                        color={purple}
                                        strokeWidth={2.5}
                                        arrowSize={5}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                        <VectorArrow
                            x1={398}
                            y1={128}
                            x2={440}
                            y2={128}
                            color={green}
                            strokeWidth={2.5}
                            arrowSize={5}
                        />
                        <SvgFrame
                            c={c}
                            x={16}
                            y={178}
                            width={788}
                            height={306}
                            rx={12}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                        {[1, 0.1, 0.01, 0.001].map((v) => (
                            <VectorSegment
                                key={v}
                                x1={108}
                                y1={lossY(v)}
                                x2={780}
                                y2={lossY(v)}
                                color={c.borderLight}
                                strokeWidth={1.2}
                                showStartDot={false}
                                showEndDot={false}
                            />
                        ))}
                        <VectorSegment
                            x1={108}
                            y1={232}
                            x2={108}
                            y2={432}
                            color={c.borderLight}
                            strokeWidth={2}
                            showStartDot={false}
                            showEndDot={false}
                        />
                        <VectorSegment
                            x1={556}
                            y1={202}
                            x2={582}
                            y2={202}
                            color={purple}
                            strokeWidth={4}
                            showStartDot={false}
                            showEndDot={false}
                        />
                        <VectorSegment
                            x1={686}
                            y1={202}
                            x2={712}
                            y2={202}
                            color={green}
                            strokeWidth={4}
                            showStartDot={false}
                            showEndDot={false}
                        />
                        <SvgFrame
                            c={c}
                            x={16}
                            y={496}
                            width={788}
                            height={64}
                            rx={12}
                            fill={c.bgCard}
                            stroke={green}
                            strokeWidth={1.5}
                        />
                        <VectorArrow
                            x1={336}
                            y1={528}
                            x2={376}
                            y2={528}
                            color={green}
                            strokeWidth={2.5}
                            arrowSize={5}
                        />
                    </svg>
                </CanvasItem>
                {lbl(
                    c,
                    16,
                    10,
                    788,
                    'Train updates W; validation reads W',
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
                    '8 train rows (2 steps/epoch) · 4 val rows (frozen W)',
                    24,
                    c.textSecondary,
                )}
                {lbl(c, 30, 112, 110, 'train():', 24, purple, 'left', 700)}
                {['W', 'W′', 'W″'].map((t, i) =>
                    lbl(c, 144 + i * 94, 112, 60, t, 25, purple, 'center', 700),
                )}
                {lbl(c, 450, 112, 340, 'eval() + no_grad() → val loss', 24, green, 'left', 700)}
                {lbl(
                    c,
                    30,
                    190,
                    480,
                    'Cross-entropy (60 epochs, log)',
                    24,
                    c.textPrimary,
                    'left',
                    700,
                )}
                {lbl(c, 590, 190, 80, 'train', 24, purple, 'left', 700)}
                {lbl(c, 720, 190, 70, 'val', 24, green, 'left', 700)}
                {[1, 0.1, 0.01, 0.001].map((v) =>
                    lbl(c, 22, lossY(v) - 16, 78, String(v), 24, c.textSecondary, 'right'),
                )}
                <CanvasItem x={100} y={224} width={688} height={216}>
                    <AxisPlot
                        c={c}
                        width={688}
                        height={216}
                        padding={8}
                        xMin={1}
                        xMax={60}
                        yMin={-3}
                        yMax={0}
                        showFrame={false}
                        showAxes={false}
                        paths={[training, validation].map((rows, i) => ({
                            points: rows.map((v, j) => ({ x: j + 1, y: Math.log10(v) })),
                            color: i === 0 ? purple : green,
                            strokeWidth: 3.5,
                        }))}
                        points={[
                            {
                                x: 60,
                                y: Math.log10(validation[59]),
                                fill: green,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                                r: 6,
                            },
                        ]}
                    />
                </CanvasItem>
                {[1, 20, 40, 60].map((ep) =>
                    lbl(
                        c,
                        108 + ((ep - 1) / 59) * 672 - 28,
                        442,
                        56,
                        String(ep),
                        24,
                        c.textSecondary,
                        'center',
                    ),
                )}
                {lbl(c, 370, 444, 100, 'epoch', 24, c.textSecondary, 'center')}
                {lbl(c, 30, 512, 300, 'Epoch 60 · val 0.011815', 24, green, 'left', 700)}
                {lbl(
                    c,
                    386,
                    512,
                    404,
                    'deepcopy(state_dict()) · 4 tensors',
                    24,
                    green,
                    'left',
                    700,
                )}
            </Board>
        </Scene>
    )
}

export default create('dark')
