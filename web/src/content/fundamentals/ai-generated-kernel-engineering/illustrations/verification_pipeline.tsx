import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 640
export const alt =
    'Six verification stages arranged in two rows filter generated CUDA and Triton kernels before benchmarking: (1) Reference Spec checks PyTorch shape, dtype, and eager semantics; (2) Compile & PTXAS checks nvcc or Triton compilation, register counts, and local-memory spills; (3) Compute Sanitizer runs memcheck and racecheck to catch out-of-bounds reads and shared-memory races; (4) Equivalence Harness tests randomized prime widths, strided slices, and FP16 accumulation precision with assert_close; (5) Clean Event Timing warms up JIT caches, flushes L2, and times CUDA events; (6) Roofline Check verifies hardware HBM traffic against arithmetic intensity bounds.'

type ThemeColors = ReturnType<typeof getThemeColors>

const label = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size = 28,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 700,
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={size}
            fontWeight={weight}
            color={color}
            align={align}
        />
    </CanvasItem>
)

const STAGES = [
    {
        num: '1',
        name: 'Reference',
        detail: 'Shapes & math',
        fail: 'Schema bug',
        x: 20,
        y: 120,
        tone: 'blue' as const,
    },
    {
        num: '2',
        name: 'Compile PTX',
        detail: 'Regs & spills',
        fail: 'Build or spill',
        x: 320,
        y: 120,
        tone: 'purple' as const,
    },
    {
        num: '3',
        name: 'Sanitizer',
        detail: 'mem/racecheck',
        fail: 'OOB or race',
        x: 620,
        y: 120,
        tone: 'warm' as const,
    },
    {
        num: '4',
        name: 'Equivalence',
        detail: 'Prime/strided',
        fail: 'Value drift',
        x: 620,
        y: 374,
        tone: 'critical' as const,
    },
    {
        num: '5',
        name: 'GPU Events',
        detail: 'Warmup + L2',
        fail: 'Noisy jitter',
        x: 320,
        y: 374,
        tone: 'cyan' as const,
    },
    {
        num: '6',
        name: 'Roofline',
        detail: 'HBM vs ridge',
        fail: 'Slow kernel',
        x: 20,
        y: 374,
        tone: 'green' as const,
    },
]

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const red = getReadableToneColor('critical', c)
    const neutral = getReadableToneColor('neutral', c)
    const toneColor = (t: (typeof STAGES)[number]['tone']) => getReadableToneColor(t, c)
    const boxW = 260
    const boxH = 166

    const geometry = AxisPlot({
        c,
        width,
        height,
        xMin: 0,
        xMax: width,
        yMin: 0,
        yMax: height,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        children: [
            ...STAGES.map((st) =>
                SvgFrame({
                    c,
                    x: st.x,
                    y: st.y,
                    width: boxW,
                    height: boxH,
                    rx: 12,
                    fill: c.bgCard,
                    stroke: toneColor(st.tone),
                    strokeWidth: 3,
                }),
            ),
            VectorArrow({
                x1: 280,
                y1: 203,
                x2: 320,
                y2: 203,
                color: neutral,
                strokeWidth: 5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 580,
                y1: 203,
                x2: 620,
                y2: 203,
                color: neutral,
                strokeWidth: 5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 750,
                y1: 286,
                x2: 750,
                y2: 374,
                color: neutral,
                strokeWidth: 5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 620,
                y1: 457,
                x2: 580,
                y2: 457,
                color: neutral,
                strokeWidth: 5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 320,
                y1: 457,
                x2: 280,
                y2: 457,
                color: neutral,
                strokeWidth: 5,
                arrowSize: 4,
            }),
        ],
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: (
            <Board c={c} width={width} height={height} background="transparent">
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {geometry}
                </CanvasItem>
                {label(
                    c,
                    'Six verification checks filter kernels before timing',
                    20,
                    14,
                    860,
                    42,
                    32,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(
                    c,
                    'Fast build and sanitizer gates reject hazards first',
                    20,
                    62,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {STAGES.map((st) => (
                    <React.Fragment key={st.num}>
                        {label(
                            c,
                            `${st.num}. ${st.name}`,
                            st.x + 10,
                            st.y + 16,
                            boxW - 20,
                            40,
                            29,
                            toneColor(st.tone),
                            'center',
                            800,
                        )}
                        {label(
                            c,
                            st.detail,
                            st.x + 10,
                            st.y + 66,
                            boxW - 20,
                            38,
                            28,
                            c.textPrimary,
                            'center',
                            650,
                        )}
                        {label(
                            c,
                            st.fail,
                            st.x + 10,
                            st.y + 114,
                            boxW - 20,
                            38,
                            28,
                            red,
                            'center',
                            750,
                        )}
                    </React.Fragment>
                ))}
                {label(
                    c,
                    'Pipeline stops on first failing stage.',
                    20,
                    570,
                    860,
                    40,
                    28,
                    neutral,
                    'center',
                    650,
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}
export default create('dark')
