import {
    AxisPlot,
    Column,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'AxisPlot compares Recall@4 across 4, 8, 16, 32, and 64 dimensions on 64d clustered embeddings: an MRL-ordered prefix rises from 0.33 to 0.70 at 8d and 0.95 at 16d, while slicing an unordered embedding starts at 0.07 and reaches only 0.56 at 16d. Below, a FlowArrow connects a fast 64d prefix index shortlisting 200 candidates to full 1024d exact rescoring for the top 10 results.'
export const width = 640
export const height = 760

const dims = [0, 1, 2, 3, 4]
const ordered = [0.33, 0.7, 0.95, 0.99, 0.98]
const naive = [0.07, 0.2, 0.56, 0.83, 0.98]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('red', c)
    const gridH = [0, 0.25, 0.5, 0.75, 1].map((y) => ({
        points: [
            { x: 0, y },
            { x: 4, y },
        ],
        tone: 'neutral' as const,
        strokeWidth: y === 0 ? 2 : 1,
        opacity: y === 0 ? 0.65 : 0.3,
    }))
    const gridV = dims.map((x) => ({
        points: [
            { x, y: 0 },
            { x, y: 1.04 },
        ],
        tone: 'neutral' as const,
        strokeWidth: 1,
        opacity: 0.3,
    }))
    const box = (text: string, tone: 'blue' | 'green') =>
        Grid({
            c,
            cellWidth: 245,
            cellHeight: 50,
            gap: 0,
            fontSize: 19,
            rows: [[{ label: text, tone, borderColor: getReadableToneColor(tone, c) }]],
        })

    return Scene({
        c,
        title: 'Matryoshka training concentrates signal in early prefixes',
        subtitle: 'Nested losses lift short-prefix recall for two-stage cascade search',
        padding: 14,
        gap: 8,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: '64d clustered Recall@4 (0 to 1) vs prefix length',
                    fontSize: 21,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 580,
                    height: 250,
                    padding: 24,
                    xMin: 0,
                    xMax: 4,
                    yMin: 0,
                    yMax: 1.06,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: [
                        ...gridH,
                        ...gridV,
                        {
                            points: dims.map((x, i) => ({ x, y: ordered[i] })),
                            color: green,
                            strokeWidth: 4,
                        },
                        {
                            points: dims.map((x, i) => ({ x, y: naive[i] })),
                            color: red,
                            strokeWidth: 4,
                        },
                    ],
                    points: [
                        ...ordered.map((y, x) => ({
                            x,
                            y,
                            tone: 'green' as const,
                            r: 7,
                            stroke: c.bgCard,
                            strokeWidth: 2,
                        })),
                        ...naive.map((y, x) => ({
                            x,
                            y,
                            tone: 'red' as const,
                            r: 7,
                            stroke: c.bgCard,
                            strokeWidth: 2,
                        })),
                    ],
                }),
                Row({
                    gap: 18,
                    align: 'center',
                    justify: 'center',
                    children: ['4d', '8d', '16d', '32d', '64d'].map((t) =>
                        TextLabel({ c, text: t, width: 92, fontSize: 19, align: 'center' }),
                    ),
                }),
                Row({
                    gap: 16,
                    align: 'center',
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Ordered prefix: 0.95 at 16d',
                            fontSize: 19,
                            color: green,
                        }),
                        TextLabel({
                            c,
                            text: 'Naive slice: 0.56 at 16d',
                            fontSize: 19,
                            color: red,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Nested training loss: ∑ₘ cₘ L(W⁽ᵐ⁾ e[:m], y)',
                    fontSize: 20,
                    align: 'center',
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'Two-stage cascade retrieval',
                    fontSize: 22,
                    align: 'center',
                }),
                Row({
                    gap: 12,
                    align: 'center',
                    justify: 'center',
                    children: [
                        box('64d index → 200 hits', 'blue'),
                        FlowArrow({ c, direction: 'right', length: 40, tone: 'purple' }),
                        box('1024d exact → top 10', 'green'),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Stage 2 cannot recover relevant items missed by Stage 1.',
                    fontSize: 19,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
