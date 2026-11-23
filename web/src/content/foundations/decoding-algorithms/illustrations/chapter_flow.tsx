import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    FlowArrow,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    getToneColor,
    type ThemeMode,
} from 'vizmatic'

export const width = 640
export const height = 580
export const alt =
    'Next-token probability distribution for the prompt “Modern language models rely primarily on self-”. The candidate tokens are attention at 0.568, supervision at 0.345, consistency at 0.077, and regression at 0.010. Greedy decoding selects attention, top-p at 0.90 retains attention and supervision with cumulative mass 0.913, and a uniform draw at u=0.75 samples supervision.'

const candidates = [
    { token: 'attention', p: 0.568, tone: 'green' as const },
    { token: 'supervision', p: 0.345, tone: 'warm' as const },
    { token: 'consistency', p: 0.077, tone: 'blue' as const },
    { token: 'regression', p: 0.01, tone: 'critical' as const },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const candidateColor = (tone: (typeof candidates)[number]['tone']) => getToneColor(tone, c)
    const markerX = 600 * 0.75

    return Scene({
        c,
        padding: 16,
        gap: 10,
        align: 'center',
        contentWidth: 600,
        children: Column({
            width: '100%',
            gap: 8,
            align: 'stretch',
            children: [
                TextLabel({
                    c,
                    text: 'Decoding chooses tokens from scored logits',
                    width: '100%',
                    fontSize: 27,
                    fontWeight: 800,
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Context provides ground truth; decoding executes a selection policy.',
                    width: '100%',
                    fontSize: 20,
                    color: c.textSecondary,
                }),
                Row({
                    width: '100%',
                    gap: 8,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'self-attention',
                            fontSize: 21,
                            fontWeight: 700,
                            color: getReadableToneColor('green', c),
                        }),
                        FlowArrow({ c, tone: 'neutral', direction: 'right', length: 24 }),
                        TextLabel({
                            c,
                            text: 'transformer blocks',
                            fontSize: 21,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        FlowArrow({ c, tone: 'neutral', direction: 'right', length: 24 }),
                        TextLabel({
                            c,
                            text: 'autoregressive output',
                            fontSize: 21,
                            fontWeight: 700,
                            color: getReadableToneColor('warm', c),
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Prompt: “Modern language models rely primarily on self-”',
                    width: '100%',
                    fontSize: 22,
                    fontWeight: 750,
                    color: c.textPrimary,
                }),
                Column({
                    width: '100%',
                    gap: 5,
                    align: 'stretch',
                    children: candidates.map(({ token, p, tone }) =>
                        Row({
                            width: '100%',
                            gap: 7,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: token,
                                    width: 120,
                                    fontSize: 21,
                                    fontWeight: 700,
                                    color: getReadableToneColor(tone, c),
                                }),
                                TextLabel({
                                    c,
                                    text: p.toFixed(3),
                                    width: 70,
                                    fontSize: 20,
                                    mono: true,
                                    color: c.textSecondary,
                                }),
                                StackedBar({
                                    c,
                                    width: 390,
                                    height: 22,
                                    showLegend: false,
                                    segments: [
                                        {
                                            label: token,
                                            value: p,
                                            color: candidateColor(tone),
                                            valueLabel: '',
                                        },
                                        {
                                            label: 'remaining mass',
                                            value: 1 - p,
                                            color: c.borderSubtle,
                                            valueLabel: '',
                                        },
                                    ],
                                }),
                            ],
                        }),
                    ),
                }),
                Board({
                    c,
                    width: 600,
                    height: 64,
                    children: [
                        CanvasItem({
                            x: 0,
                            y: 30,
                            width: 600,
                            height: 26,
                            children: StackedBar({
                                c,
                                width: 600,
                                height: 26,
                                showLegend: false,
                                segments: candidates.map(({ token, p, tone }) => ({
                                    label: token,
                                    value: p,
                                    color: candidateColor(tone),
                                    valueLabel: '',
                                })),
                            }),
                        }),
                        CanvasItem({
                            x: 0,
                            y: 0,
                            width: 600,
                            height: 64,
                            children: AxisPlot({
                                c,
                                width: 600,
                                height: 64,
                                xMin: 0,
                                xMax: 600,
                                yMin: 0,
                                yMax: 70,
                                padding: 0,
                                showFrame: false,
                                showAxes: false,
                                showGrid: false,
                                children: VectorArrow({
                                    x1: markerX,
                                    y1: 12,
                                    x2: markerX,
                                    y2: 34,
                                    color: getReadableToneColor('warm', c),
                                    strokeWidth: 3,
                                    arrowSize: 8,
                                }),
                            }),
                        }),
                        CanvasItem({
                            x: 0,
                            y: 0,
                            width: 350,
                            height: 24,
                            children: TextLabel({
                                c,
                                text: 'Uniform random draw: u = 0.75',
                                width: 350,
                                fontSize: 20,
                                fontWeight: 750,
                                color: getReadableToneColor('warm', c),
                                align: 'left',
                            }),
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Greedy selects attention. Top-p at 0.90 retains attention and supervision (0.913 mass).',
                    width: '100%',
                    fontSize: 20,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
            ],
        }),
    })
}

export default create()
