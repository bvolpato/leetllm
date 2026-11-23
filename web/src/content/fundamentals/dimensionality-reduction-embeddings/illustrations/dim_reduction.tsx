import {
    AxisPlot,
    Column,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Two paired charts connect storage savings with retrieval recall. Top: ProgressList compares raw payload RAM for 10 million vectors dropping from 61.4 GB at 1536d float32 to 10.2 GB at 256d float32, 2.56 GB at 256d int8, and 0.16 GB with PQ-16. Bottom: AxisPlot plots Recall@4 across 4, 8, 16, 32, and 64 dimensions on 64d clustered embeddings: PCA reaches 0.98 and MRL-ordered prefix reaches 0.95 by 16d while Gaussian random projection reaches 0.59.'
export const width = 640
export const height = 760

const dims = [0, 1, 2, 3, 4]
const pcaRecall = [0.47, 0.82, 0.98, 0.98, 0.99]
const mrlRecall = [0.33, 0.7, 0.95, 0.99, 0.98]
const rpRecall = [0.14, 0.34, 0.59, 0.83, 0.91]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const cyan = getReadableToneColor('cyan', c)
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
    const seriesPoints = (ys: number[], tone: 'purple' | 'green' | 'cyan') =>
        ys.map((y, x) => ({ x, y, tone, r: 7, stroke: c.bgCard, strokeWidth: 2 }))

    return Scene({
        c,
        title: 'Vector compression trades memory for neighborhood fidelity',
        subtitle: 'Compare 10M-vector raw RAM against Recall@4 across target dimensions',
        padding: 14,
        gap: 8,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'stretch',
            children: [
                TextLabel({
                    c,
                    text: '1 · Raw RAM for 10M vectors (index graphs add overhead)',
                    fontSize: 21,
                    align: 'center',
                }),
                ProgressList({
                    c,
                    labelWidth: 165,
                    valueWidth: 96,
                    barHeight: 14,
                    fontSize: 20,
                    gap: 6,
                    rows: [
                        { label: '1536d f32', value: 1, valueLabel: '61.4 GB', tone: 'purple' },
                        {
                            label: '256d f32',
                            value: 10.2 / 61.4,
                            valueLabel: '10.2 GB',
                            tone: 'blue',
                        },
                        {
                            label: '256d int8',
                            value: 2.56 / 61.4,
                            valueLabel: '2.56 GB',
                            tone: 'green',
                        },
                        {
                            label: 'PQ-16 byte',
                            value: 0.16 / 61.4,
                            valueLabel: '0.16 GB',
                            tone: 'warm',
                        },
                    ],
                }),
                TextLabel({
                    c,
                    text: '2 · Clustered 64d Recall@4 (0 to 1) vs target dimension k',
                    fontSize: 21,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 580,
                    height: 220,
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
                            points: dims.map((x, i) => ({ x, y: pcaRecall[i] })),
                            color: purple,
                            strokeWidth: 4,
                        },
                        {
                            points: dims.map((x, i) => ({ x, y: mrlRecall[i] })),
                            color: green,
                            strokeWidth: 4,
                        },
                        {
                            points: dims.map((x, i) => ({ x, y: rpRecall[i] })),
                            color: cyan,
                            strokeWidth: 4,
                        },
                    ],
                    points: [
                        ...seriesPoints(pcaRecall, 'purple'),
                        ...seriesPoints(mrlRecall, 'green'),
                        ...seriesPoints(rpRecall, 'cyan'),
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
                    gap: 14,
                    align: 'center',
                    justify: 'center',
                    children: [
                        TextLabel({ c, text: 'PCA (0.98 at 16d)', fontSize: 19, color: purple }),
                        TextLabel({ c, text: 'MRL (0.95 at 16d)', fontSize: 19, color: green }),
                        TextLabel({ c, text: 'RandProj (0.59 at 16d)', fontSize: 19, color: cyan }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
