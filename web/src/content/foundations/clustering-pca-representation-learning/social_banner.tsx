import {
    AxisPlot,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    renderToPngWithOutput,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Clustering and PCA. Two plots of six two-dimensional corpus embeddings. Left shows k-means clusters C0, C1, and C2 with centroids and inertia 1.74. Right shows PC1 retaining 85.2% of variance.'

const points: ReadonlyArray<readonly [number, number]> = [
    [1.0, 1.0],
    [1.2, 1.8],
    [4.0, 4.2],
    [5.0, 3.8],
    [8.0, 1.0],
    [9.0, 1.8],
]
const centers: ReadonlyArray<readonly [number, number]> = [
    [1.1, 1.4],
    [4.5, 4.0],
    [8.5, 1.4],
]
const mean = [4.7, 2.27]
const pc = [0.99987, -0.01604]
const projected = points.map(([x, y]) => {
    const score = (x - mean[0]) * pc[0] + (y - mean[1]) * pc[1]
    return [mean[0] + score * pc[0], mean[1] + score * pc[1]] as const
})
const variance = (11.1825 / (11.1825 + 1.9442)) * 100

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.35,
    )
    const tones = ['blue', 'purple', 'green'] as const

    return Scene({
        c,
        contentWidth: width - 72,
        padding: 36,
        children: Column({
            gap: 16,
            align: 'stretch',
            children: [
                Row({
                    justify: 'space-between',
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Clustering & PCA',
                            fontSize: 42,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'k-means partitions; PCA compresses.',
                            fontSize: 26,
                            fontWeight: 600,
                            color: c.primaryLight,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Six corpus embeddings compared under Euclidean clustering and 1D orthogonal projection.',
                    fontSize: 22,
                    color: c.textSecondary,
                }),
                Row({
                    gap: 24,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'k-means (inertia 1.74)',
                            width: 552,
                            padding: 14,
                            children: AxisPlot({
                                c,
                                width: 520,
                                height: 270,
                                xMin: 0,
                                xMax: 10,
                                yMin: 0,
                                yMax: 5,
                                padding: 18,
                                showFrame: false,
                                showAxes: false,
                                showGrid: true,
                                gridCount: 4,
                                vectors: points.map(([x, y], i) => {
                                    const center = centers[Math.floor(i / 2)]
                                    return {
                                        x1: x,
                                        y1: y,
                                        x2: center[0],
                                        y2: center[1],
                                        tone: tones[Math.floor(i / 2)],
                                        strokeWidth: 3,
                                    }
                                }),
                                points: [
                                    ...points.map(([x, y], i) => ({
                                        x,
                                        y,
                                        tone: tones[Math.floor(i / 2)],
                                        r: 8,
                                    })),
                                    ...centers.map(([x, y], i) => ({
                                        x,
                                        y,
                                        tone: tones[i],
                                        r: 10,
                                        stroke: c.textPrimary,
                                        strokeWidth: 2.5,
                                    })),
                                ],
                                ariaLabel: 'k-means clusters C0, C1, and C2 with centroids',
                            }),
                        }),
                        Panel({
                            c,
                            title: `PCA (${variance.toFixed(1)}% variance on PC1)`,
                            width: 552,
                            padding: 14,
                            children: AxisPlot({
                                c,
                                width: 520,
                                height: 270,
                                xMin: 0,
                                xMax: 10,
                                yMin: 0,
                                yMax: 5,
                                padding: 18,
                                showFrame: false,
                                showAxes: false,
                                showGrid: true,
                                gridCount: 4,
                                paths: [
                                    {
                                        points: [
                                            {
                                                x: 0.4,
                                                y: mean[1] + ((0.4 - mean[0]) * pc[1]) / pc[0],
                                            },
                                            {
                                                x: 9.6,
                                                y: mean[1] + ((9.6 - mean[0]) * pc[1]) / pc[0],
                                            },
                                        ],
                                        color: c.primaryLight,
                                        strokeWidth: 3.5,
                                    },
                                ],
                                vectors: points.map(([x, y], i) => ({
                                    x1: x,
                                    y1: y,
                                    x2: projected[i][0],
                                    y2: projected[i][1],
                                    color: c.warning,
                                    strokeWidth: 2.5,
                                })),
                                points: [
                                    ...points.map(([x, y]) => ({
                                        x,
                                        y,
                                        tone: 'blue' as const,
                                        r: 8,
                                    })),
                                    ...projected.map(([x, y]) => ({
                                        x,
                                        y,
                                        tone: 'green' as const,
                                        r: 6,
                                    })),
                                    {
                                        x: mean[0],
                                        y: mean[1],
                                        fill: c.warning,
                                        r: 9,
                                        stroke: c.textPrimary,
                                        strokeWidth: 2,
                                    },
                                ],
                                ariaLabel: 'Orthogonal projection onto PC1',
                            }),
                        }),
                    ],
                }),
                Row({
                    justify: 'space-between',
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Geometry guides representation audits alongside downstream evaluation.',
                            fontSize: 21,
                            color: c.textSecondary,
                        }),
                        TextLabel({
                            c,
                            text: 'LeetLLM',
                            fontSize: 24,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
