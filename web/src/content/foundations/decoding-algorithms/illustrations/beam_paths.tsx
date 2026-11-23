import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
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

export const width = 740
export const height = 680
export const alt =
    'From prefix “The model uses”, first-step probabilities keep attention at 0.40 and recurrent at 0.35 in a width-2 beam, pruning linear at 0.25. The kept prefixes expand into their next-token distributions. Ranking joint path probabilities returns recurrent cells at 0.245 and attention mechanism at 0.080; attention layers at 0.076 falls below the beam cutoff.'

const branches = [
    {
        prefix: 'attention',
        firstProbability: 0.4,
        tone: 'cyan' as const,
        children: [
            { token: 'mechanism', conditional: 0.2, joint: 0.08 },
            { token: 'layers', conditional: 0.19, joint: 0.076 },
            { token: 'weights', conditional: 0.18, joint: 0.072 },
        ],
    },
    {
        prefix: 'recurrent',
        firstProbability: 0.35,
        tone: 'green' as const,
        children: [
            { token: 'cells', conditional: 0.7, joint: 0.245 },
            { token: 'layers', conditional: 0.2, joint: 0.07 },
            { token: 'units', conditional: 0.1, joint: 0.035 },
        ],
    },
]

const finalRanks = [
    { rank: '1', path: 'recurrent cells', joint: 0.245, tone: 'green' as const },
    {
        rank: '2',
        path: 'attention mechanism',
        joint: 0.08,
        tone: 'cyan' as const,
    },
    {
        rank: '3',
        path: 'attention layers · cut',
        joint: 0.076,
        tone: 'neutral' as const,
    },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const readable = (tone: 'cyan' | 'green' | 'critical' | 'neutral') =>
        getReadableToneColor(tone, c)

    const treeArrows = AxisPlot({
        c,
        width: 700,
        height: 120,
        xMin: 0,
        xMax: 700,
        yMin: 0,
        yMax: 120,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        children: [
            VectorArrow({
                x1: 350,
                y1: 40,
                x2: 120,
                y2: 80,
                color: getToneColor('cyan', c),
                strokeWidth: 3,
                arrowSize: 8,
            }),
            VectorArrow({
                x1: 350,
                y1: 40,
                x2: 350,
                y2: 80,
                color: getToneColor('green', c),
                strokeWidth: 3,
                arrowSize: 8,
            }),
            VectorArrow({
                x1: 350,
                y1: 40,
                x2: 580,
                y2: 80,
                color: getToneColor('critical', c),
                strokeWidth: 3,
                arrowSize: 8,
            }),
        ],
    })

    const firstStepTree = Board({
        c,
        width: 700,
        height: 140,
        children: [
            CanvasItem({ x: 0, y: 0, width: 700, height: 120, children: treeArrows }),
            CanvasItem({
                x: 230,
                y: 0,
                width: 240,
                height: 48,
                children: [
                    CanvasItem({
                        x: 0,
                        y: 0,
                        width: 240,
                        height: 20,
                        children: TextLabel({
                            c,
                            text: 'Prefix',
                            width: 240,
                            fontSize: 18,
                            align: 'center',
                            color: c.textSecondary,
                        }),
                    }),
                    CanvasItem({
                        x: 0,
                        y: 20,
                        width: 240,
                        height: 26,
                        children: TextLabel({
                            c,
                            text: '“The model uses”',
                            width: 240,
                            fontSize: 22,
                            fontWeight: 800,
                            align: 'center',
                            color: c.textPrimary,
                        }),
                    }),
                ],
            }),
            ...[
                {
                    x: 30,
                    token: 'attention',
                    detail: 'rank 1 · p₁=0.40',
                    tone: 'cyan' as const,
                },
                {
                    x: 260,
                    token: 'recurrent',
                    detail: 'rank 2 · p₁=0.35',
                    tone: 'green' as const,
                },
                {
                    x: 490,
                    token: 'linear',
                    detail: 'p₁=0.25 · pruned',
                    tone: 'critical' as const,
                },
            ].map(({ x, token, detail, tone }) =>
                CanvasItem({
                    x,
                    y: 84,
                    width: 180,
                    height: 52,
                    children: [
                        CanvasItem({
                            x: 0,
                            y: 0,
                            width: 180,
                            height: 24,
                            children: TextLabel({
                                c,
                                text: token,
                                width: 180,
                                fontSize: 21,
                                fontWeight: 800,
                                align: 'center',
                                color: readable(tone),
                            }),
                        }),
                        CanvasItem({
                            x: 0,
                            y: 24,
                            width: 180,
                            height: 20,
                            children: TextLabel({
                                c,
                                text: detail,
                                width: 180,
                                fontSize: 18,
                                align: 'center',
                                color: c.textSecondary,
                            }),
                        }),
                    ],
                }),
            ),
        ],
    })

    const expansionColumns = branches.map((branch) =>
        Column({
            width: 340,
            gap: 4,
            align: 'stretch',
            children: [
                TextLabel({
                    c,
                    text: `Expand “${branch.prefix}” · p₁=${branch.firstProbability.toFixed(2)}`,
                    width: 340,
                    fontSize: 20,
                    fontWeight: 800,
                    color: readable(branch.tone),
                }),
                ...branch.children.map(({ token, conditional, joint }) =>
                    Row({
                        width: 340,
                        gap: 6,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: token,
                                width: 110,
                                fontSize: 19,
                                fontWeight: 700,
                                color: c.textPrimary,
                            }),
                            TextLabel({
                                c,
                                text: `p₂=${conditional.toFixed(2)}`,
                                width: 75,
                                fontSize: 18,
                                mono: true,
                                color: c.textSecondary,
                            }),
                            StackedBar({
                                c,
                                width: 80,
                                height: 14,
                                showLegend: false,
                                segments: [
                                    {
                                        label: 'joint',
                                        value: joint / 0.25,
                                        color: getToneColor(branch.tone, c),
                                        valueLabel: '',
                                    },
                                    {
                                        label: 'rem',
                                        value: 1 - joint / 0.25,
                                        color: c.borderSubtle,
                                        valueLabel: '',
                                    },
                                ],
                            }),
                            TextLabel({
                                c,
                                text: `P=${joint.toFixed(3)}`,
                                width: 65,
                                fontSize: 18,
                                mono: true,
                                fontWeight: 700,
                                color: c.textPrimary,
                            }),
                        ],
                    }),
                ),
            ],
        }),
    )

    return Scene({
        c,
        padding: 16,
        gap: 8,
        align: 'center',
        contentWidth: 700,
        children: Column({
            width: '100%',
            gap: 7,
            align: 'stretch',
            children: [
                TextLabel({
                    c,
                    text: 'Beam search evaluates joint path probabilities',
                    width: '100%',
                    fontSize: 26,
                    fontWeight: 800,
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Beam width B = 2 · Two-step prefix tree exploration',
                    width: '100%',
                    fontSize: 19,
                    color: c.textSecondary,
                }),
                firstStepTree,
                Row({
                    width: '100%',
                    gap: 20,
                    align: 'start',
                    children: expansionColumns,
                }),
                TextLabel({
                    c,
                    text: 'Global rank after expansion · beam width B = 2',
                    width: '100%',
                    fontSize: 21,
                    fontWeight: 800,
                    color: c.textPrimary,
                }),
                ...finalRanks.map(({ rank, path, joint, tone }) =>
                    Row({
                        width: '100%',
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: `#${rank}`,
                                width: 35,
                                fontSize: 20,
                                fontWeight: 800,
                                color: readable(tone),
                            }),
                            TextLabel({
                                c,
                                text: path,
                                width: 220,
                                fontSize: 19,
                                fontWeight: 700,
                                color: c.textPrimary,
                            }),
                            StackedBar({
                                c,
                                width: 320,
                                height: 18,
                                showLegend: false,
                                segments: [
                                    {
                                        label: `joint ${joint.toFixed(3)}`,
                                        value: joint / 0.25,
                                        color: getToneColor(tone, c),
                                        valueLabel: '',
                                    },
                                    {
                                        label: 'remaining',
                                        value: 1 - joint / 0.25,
                                        color: c.borderSubtle,
                                        valueLabel: '',
                                    },
                                ],
                            }),
                            TextLabel({
                                c,
                                text: `P=${joint.toFixed(3)}`,
                                width: 85,
                                fontSize: 19,
                                mono: true,
                                color: c.textSecondary,
                            }),
                        ],
                    }),
                ),
                TextLabel({
                    c,
                    text: 'Greedy: attention mechanism = 0.080. Beam (B=2): recurrent cells = 0.245 (3.06× higher).',
                    width: '100%',
                    fontSize: 19,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
            ],
        }),
    })
}

export default create()
