import {
    AxisPlot,
    Column,
    FlowArrow,
    Grid,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Grid lists query [1, 0, 0, 1] and three 4d vectors: flash-attention [1, 0, 0, 1] with 2d cos 1.00 and 4d cos 1.00, sparse-attention [1, 0, 1, 0] with 2d cos 1.00 and 4d cos 0.50, and rope-encoding [0, 1, 0, 1] with 2d cos 0.00 and 4d cos 0.50. An AxisPlot shows the first two dimensions collapsing flash-attention and sparse-attention onto (1, 0), and a ProgressList compares full 4d cosine separation.'
export const width = 640
export const height = 760

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)

    return Scene({
        c,
        title: 'Short Matryoshka prefixes tie before tail axes break them',
        subtitle: 'Query q = [1, 0, 0, 1] scored on 2d prefix [d₀, d₁] vs full 4d vector',
        padding: 14,
        gap: 8,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                Grid({
                    c,
                    cellWidth: 144,
                    cellHeight: 46,
                    gap: 6,
                    fontSize: 19,
                    rows: [
                        [
                            { label: 'Vector', tone: 'neutral' },
                            { label: 'Head [d₀,d₁]', tone: 'neutral' },
                            { label: 'Tail [d₂,d₃]', tone: 'neutral' },
                            { label: '2d / 4d cos', tone: 'neutral' },
                        ],
                        [
                            { label: 'query q', tone: 'cyan' },
                            { label: '[1, 0]', tone: 'cyan' },
                            { label: '[0, 1]', tone: 'cyan' },
                            { label: 'target', tone: 'cyan' },
                        ],
                        [
                            { label: 'flash-attn', tone: 'green' },
                            { label: '[1, 0]', tone: 'green' },
                            { label: '[0, 1]', tone: 'green' },
                            { label: '1.00 / 1.00', tone: 'green' },
                        ],
                        [
                            { label: 'sparse-attn', tone: 'warm' },
                            { label: '[1, 0]', tone: 'warm' },
                            { label: '[1, 0]', tone: 'warm' },
                            { label: '1.00 / 0.50', tone: 'warm' },
                        ],
                        [
                            { label: 'rope-enc', tone: 'blue' },
                            { label: '[0, 1]', tone: 'blue' },
                            { label: '[0, 1]', tone: 'blue' },
                            { label: '0.00 / 0.50', tone: 'blue' },
                        ],
                    ],
                }),
                FlowArrow({ c, direction: 'down', length: 24, tone: 'blue' }),
                Row({
                    gap: 16,
                    align: 'center',
                    justify: 'center',
                    children: [
                        Column({
                            gap: 4,
                            align: 'center',
                            width: 244,
                            children: [
                                TextLabel({
                                    c,
                                    text: '2d prefix space (d₀, d₁)',
                                    fontSize: 19,
                                    align: 'center',
                                }),
                                AxisPlot({
                                    c,
                                    width: 210,
                                    height: 196,
                                    padding: 22,
                                    xMin: -0.2,
                                    xMax: 1.35,
                                    yMin: -0.2,
                                    yMax: 1.35,
                                    showFrame: false,
                                    showGrid: true,
                                    gridCount: 3,
                                    vectors: [
                                        {
                                            x1: 0,
                                            y1: 0,
                                            x2: 1,
                                            y2: 0,
                                            color: warm,
                                            strokeWidth: 6,
                                            arrow: true,
                                        },
                                        {
                                            x1: 0,
                                            y1: 0,
                                            x2: 1,
                                            y2: 0,
                                            color: green,
                                            strokeWidth: 3,
                                            arrow: true,
                                        },
                                        {
                                            x1: 0,
                                            y1: 0,
                                            x2: 0,
                                            y2: 1,
                                            color: blue,
                                            strokeWidth: 4,
                                            arrow: true,
                                        },
                                    ],
                                    points: [
                                        {
                                            x: 1,
                                            y: 0,
                                            tone: 'green',
                                            r: 7,
                                            stroke: c.bgCard,
                                            strokeWidth: 2,
                                        },
                                        {
                                            x: 0,
                                            y: 1,
                                            tone: 'blue',
                                            r: 7,
                                            stroke: c.bgCard,
                                            strokeWidth: 2,
                                        },
                                    ],
                                }),
                                TextLabel({
                                    c,
                                    text: '(1, 0) ties flash & sparse',
                                    fontSize: 19,
                                    align: 'center',
                                }),
                            ],
                        }),
                        Column({
                            gap: 8,
                            align: 'stretch',
                            width: 344,
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Cosine separation: 2d tie vs 4d',
                                    fontSize: 19,
                                    align: 'center',
                                }),
                                ProgressList({
                                    c,
                                    labelWidth: 176,
                                    valueWidth: 58,
                                    barHeight: 14,
                                    fontSize: 19,
                                    gap: 8,
                                    rows: [
                                        {
                                            label: 'flash-attn (2d)',
                                            value: 1.0,
                                            valueLabel: '1.00',
                                            tone: 'green',
                                        },
                                        {
                                            label: 'sparse-attn (2d)',
                                            value: 1.0,
                                            valueLabel: '1.00',
                                            tone: 'warm',
                                        },
                                        {
                                            label: 'flash-attn (4d)',
                                            value: 1.0,
                                            valueLabel: '1.00',
                                            tone: 'green',
                                        },
                                        {
                                            label: 'sparse-attn (4d)',
                                            value: 0.5,
                                            valueLabel: '0.50',
                                            tone: 'blue',
                                        },
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Short prefixes shrink memory, so shortlist K > 1 and rescore in 4d.',
                    fontSize: 19,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
