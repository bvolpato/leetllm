import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    DataTable,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 680
export const height = 760
export const preset = 'engineering'
export const alt =
    'Equal-unit 2D plots show IVF centroids C0=(0,0) and C1=(10,0), their Voronoi boundary x=5, query q=(4.9,0), and vectors v0=(0.2,0.1), v1=(0.4,-0.1), v2=(4.6,0), v3=(5.4,0), and v4=(9.8,0.2). The x=5 boundary separates the assigned lists, so query q=(4.9,0) and nearby vector v3=(5.4,0) fall into different lists. Distances from q are 0.30 to v2, 0.50 to v3, and 4.50 to v1. Probing List 0 alone returns v2 and v1 for 1/2 exact top-two neighbors; probing both lists returns v2 and v3 for 2/2.'

const mainPlot = { x: 44, y: 126, width: 396, height: 165 }
const detailPlot = { x: 468, y: 126, width: 180, height: 180 }
const mainDomain = { xMin: -1, xMax: 11, yMin: -2.5, yMax: 2.5 }
const detailDomain = { xMin: 4, xMax: 6, yMin: -1, yMax: 1 }

const mainX = (x: number) =>
    mainPlot.x + ((x - mainDomain.xMin) / (mainDomain.xMax - mainDomain.xMin)) * mainPlot.width
const mainY = (y: number) =>
    mainPlot.y + ((mainDomain.yMax - y) / (mainDomain.yMax - mainDomain.yMin)) * mainPlot.height
const detailX = (x: number) =>
    detailPlot.x +
    ((x - detailDomain.xMin) / (detailDomain.xMax - detailDomain.xMin)) * detailPlot.width
const detailY = (y: number) =>
    detailPlot.y +
    ((detailDomain.yMax - y) / (detailDomain.yMax - detailDomain.yMin)) * detailPlot.height

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    labelWidth: number,
    fontSize = 22,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 650,
) {
    return (
        <CanvasItem x={x} y={y} width={labelWidth} height={Math.ceil(fontSize * 1.45)}>
            <TextLabel
                c={c}
                text={text}
                width="100%"
                fontSize={fontSize}
                fontWeight={weight}
                color={color}
                align={align}
            />
        </CanvasItem>
    )
}

const illustration = defineIllustration((colors) => {
    const c = { ...colors, shadow: 'transparent' }
    const list0 = getReadableToneColor('blue', c)
    const list1 = getReadableToneColor('warm', c)
    const exact = getReadableToneColor('green', c)
    const query = getReadableToneColor('cyan', c)
    const boundary = getReadableToneColor('critical', c)

    const dataPoints = [
        { x: 0.2, y: 0.1, tone: 'blue' as const, r: 6 },
        { x: 0.4, y: -0.1, tone: 'blue' as const, r: 6 },
        { x: 4.6, y: 0, tone: 'green' as const, r: 8, stroke: c.bg, strokeWidth: 2 },
        { x: 5.4, y: 0, tone: 'green' as const, r: 8, stroke: c.bg, strokeWidth: 2 },
        { x: 9.8, y: 0.2, tone: 'warm' as const, r: 6 },
    ]
    const centroids = [
        { x: 0, y: 0, tone: 'purple' as const, r: 10, stroke: c.bg, strokeWidth: 2 },
        { x: 10, y: 0, tone: 'warm' as const, r: 10, stroke: c.bg, strokeWidth: 2 },
    ]

    return (
        <Scene
            c={c}
            padding={0}
            gap={0}
            contentWidth={width}
            title="Nearby points can fall in different lists"
        >
            <Board c={c} width={width} height={height}>
                {label(
                    c,
                    'Nearby points can fall in different lists',
                    22,
                    12,
                    636,
                    26,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'The x = 5 centroid boundary separates the two lists.',
                    22,
                    54,
                    636,
                    22,
                    c.textSecondary,
                    'left',
                    650,
                )}
                {label(
                    c,
                    'All vectors · equal x/y units',
                    mainPlot.x,
                    96,
                    mainPlot.width,
                    22,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'Boundary detail',
                    detailPlot.x,
                    96,
                    detailPlot.width,
                    22,
                    c.textPrimary,
                    'center',
                    750,
                )}

                <CanvasItem
                    x={mainPlot.x}
                    y={mainPlot.y}
                    width={mainPlot.width}
                    height={mainPlot.height}
                >
                    <AxisPlot
                        c={c}
                        width={mainPlot.width}
                        height={mainPlot.height}
                        xMin={mainDomain.xMin}
                        xMax={mainDomain.xMax}
                        yMin={mainDomain.yMin}
                        yMax={mainDomain.yMax}
                        padding={0}
                        showFrame={false}
                        showAxes={false}
                        showGrid
                        gridCount={4}
                        paths={[
                            {
                                points: [
                                    { x: -1, y: 0 },
                                    { x: 11, y: 0 },
                                ],
                                tone: 'neutral',
                                strokeWidth: 2,
                                opacity: 0.8,
                            },
                            {
                                points: [
                                    { x: 0, y: -2.5 },
                                    { x: 0, y: 2.5 },
                                ],
                                tone: 'neutral',
                                strokeWidth: 1,
                                opacity: 0.65,
                            },
                            {
                                points: [
                                    { x: 5, y: -2.5 },
                                    { x: 5, y: 2.5 },
                                ],
                                color: boundary,
                                strokeWidth: 3,
                                dashed: true,
                            },
                        ]}
                        points={[
                            ...centroids,
                            ...dataPoints,
                            { x: 4.9, y: 0, fill: query, r: 7, stroke: c.bg, strokeWidth: 2 },
                        ]}
                    />
                </CanvasItem>

                {[-2, 0, 2].map((value) =>
                    label(
                        c,
                        String(value),
                        4,
                        mainY(value) - 12,
                        34,
                        22,
                        c.textSecondary,
                        'right',
                        600,
                    ),
                )}
                {[0, 5, 10].map((value) =>
                    label(
                        c,
                        String(value),
                        mainX(value) - 21,
                        mainPlot.y + mainPlot.height + 3,
                        42,
                        22,
                        c.textSecondary,
                        'center',
                        600,
                    ),
                )}
                {label(c, 'C₀', mainX(0) - 29, mainY(0) + 31, 58, 22, list0, 'center', 800)}
                {label(c, 'C₁', mainX(10) - 29, mainY(0) + 31, 58, 22, list1, 'center', 800)}
                {label(c, 'v₀ / v₁', mainX(0.3) - 48, mainY(0) - 42, 96, 22, list0, 'center', 750)}
                {label(c, 'v₄', mainX(9.8) - 24, mainY(1.1) - 12, 48, 22, list1, 'center', 750)}

                <CanvasItem
                    x={detailPlot.x}
                    y={detailPlot.y}
                    width={detailPlot.width}
                    height={detailPlot.height}
                >
                    <AxisPlot
                        c={c}
                        width={detailPlot.width}
                        height={detailPlot.height}
                        xMin={detailDomain.xMin}
                        xMax={detailDomain.xMax}
                        yMin={detailDomain.yMin}
                        yMax={detailDomain.yMax}
                        padding={0}
                        showFrame
                        showAxes={false}
                        showGrid
                        gridCount={2}
                        paths={[
                            {
                                points: [
                                    { x: 4, y: 0 },
                                    { x: 6, y: 0 },
                                ],
                                tone: 'neutral',
                                strokeWidth: 2,
                                opacity: 0.8,
                            },
                            {
                                points: [
                                    { x: 5, y: -1 },
                                    { x: 5, y: 1 },
                                ],
                                color: boundary,
                                strokeWidth: 3,
                                dashed: true,
                            },
                            {
                                points: [
                                    { x: 4.6, y: 0.22 },
                                    { x: 4.9, y: 0.22 },
                                ],
                                tone: 'green',
                                strokeWidth: 2,
                            },
                            {
                                points: [
                                    { x: 4.9, y: -0.22 },
                                    { x: 5.4, y: -0.22 },
                                ],
                                tone: 'warm',
                                strokeWidth: 2,
                            },
                        ]}
                        points={[
                            { x: 4.6, y: 0, tone: 'green', r: 8, stroke: c.bg, strokeWidth: 2 },
                            { x: 5.4, y: 0, tone: 'green', r: 8, stroke: c.bg, strokeWidth: 2 },
                            { x: 4.9, y: 0, fill: query, r: 7, stroke: c.bg, strokeWidth: 2 },
                        ]}
                    />
                </CanvasItem>
                {label(c, 'v₂=4.6', detailPlot.x + 4, detailY(0) + 20, 78, 22, exact, 'right', 750)}
                {label(c, 'v₃=5.4', detailX(5) + 10, detailPlot.y + 40, 80, 22, exact, 'left', 750)}
                {label(c, 'q=4.9', detailPlot.x + 4, detailPlot.y + 5, 78, 22, query, 'right', 750)}
                {label(
                    c,
                    'x = 5',
                    detailX(5) - 40,
                    detailPlot.y + detailPlot.height + 3,
                    80,
                    22,
                    boundary,
                    'center',
                    700,
                )}
                {label(
                    c,
                    'Distances from q · q–v₂ 0.30 · q–v₃ 0.50 · q–v₁ 4.50',
                    22,
                    342,
                    636,
                    22,
                    c.textSecondary,
                    'center',
                    700,
                )}
                {label(c, 'Nearest-centroid lists', 22, 380, 636, 24, c.textPrimary, 'left', 800)}

                <CanvasItem x={22} y={416} width={636} height={272}>
                    <DataTable
                        c={c}
                        rows={[
                            ['', 'nprobe = 1', 'nprobe = 2'],
                            ['Lists', 'List 0', 'List 0 + List 1'],
                            ['Scored', 'v₀–v₂', 'v₀–v₄'],
                            ['Top 2', 'v₂ · v₁', 'v₂ · v₃'],
                            ['Recall@2', '1 / 2 = 50%', '2 / 2 = 100%'],
                        ]}
                        firstColWidth={160}
                        cellWidth={232}
                        cellHeight={50}
                        gap={4}
                        fontSize={22}
                        headerRows={1}
                        headerCols={1}
                    />
                </CanvasItem>
                {label(
                    c,
                    'Exact top two: v₂ and v₃ · Euclidean 2D',
                    22,
                    714,
                    636,
                    22,
                    c.textSecondary,
                    'center',
                    650,
                )}
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
