import { AxisPlot, Column, DataTable, Grid, Row, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Equal-scale unit circle for a RoPE query at 0 degrees. The positive RoPE guide sits at 6 degrees (cosine 0.995). A hard negative begins at negative 6 degrees (cosine 0.995) before training and separates to 120 degrees (cosine negative 0.500) at the target.'

export const width = 640
export const height = 740

function pointAt(degrees: number) {
    const rad = (degrees * Math.PI) / 180
    return { x: Math.cos(rad), y: Math.sin(rad) }
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const query = pointAt(0)
    const positive = pointAt(6)
    const crowdedNeg = pointAt(-6)
    const separatedNeg = pointAt(120)
    const circle = Array.from({ length: 73 }, (_, i) => pointAt(i * 5))
    const axisX = [
        {
            points: [
                { x: -1.15, y: 0 },
                { x: 1.15, y: 0 },
            ],
            tone: 'neutral' as const,
            strokeWidth: 1.5,
            opacity: 0.55,
        },
    ]
    const axisY = [
        {
            points: [
                { x: 0, y: -1.15 },
                { x: 0, y: 1.15 },
            ],
            tone: 'neutral' as const,
            strokeWidth: 1.5,
            opacity: 0.55,
        },
    ]

    return Scene({
        c,
        title: 'Contrastive updates separate crowded negatives on the unit circle',
        subtitle: 'Equal x1 and y1 unit scales compare angle before and after separation',
        padding: 16,
        gap: 10,
        contentWidth: 608,
        align: 'center',
        children: Column({
            width: 608,
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Unit-circle geometry (equal x_1 and y_1 scales)',
                    width: 600,
                    fontSize: 21,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                    math: true,
                }),
                Row({
                    gap: 18,
                    align: 'center',
                    justify: 'center',
                    children: [
                        AxisPlot({
                            c,
                            width: 340,
                            height: 340,
                            padding: 20,
                            xMin: -1.2,
                            xMax: 1.2,
                            yMin: -1.2,
                            yMax: 1.2,
                            showFrame: false,
                            showGrid: false,
                            paths: [
                                ...axisX,
                                ...axisY,
                                {
                                    points: circle,
                                    tone: 'neutral',
                                    strokeWidth: 2,
                                    dashed: true,
                                    opacity: 0.7,
                                },
                                {
                                    points: [{ x: 0, y: 0 }, crowdedNeg],
                                    tone: 'warm',
                                    strokeWidth: 4,
                                    dashed: true,
                                },
                            ],
                            vectors: [
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: query.x,
                                    y2: query.y,
                                    tone: 'purple',
                                    strokeWidth: 4,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: positive.x,
                                    y2: positive.y,
                                    tone: 'green',
                                    strokeWidth: 4,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: separatedNeg.x,
                                    y2: separatedNeg.y,
                                    tone: 'warm',
                                    strokeWidth: 4,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                            ],
                            points: [
                                { x: 0, y: 0, fill: c.textPrimary, r: 5 },
                                {
                                    x: crowdedNeg.x,
                                    y: crowdedNeg.y,
                                    tone: 'warm',
                                    r: 6,
                                    stroke: c.bg,
                                    strokeWidth: 2,
                                },
                            ],
                        }),
                        Grid({
                            c,
                            rows: [
                                [{ label: 'q · query · 0°', tone: 'purple' }],
                                [{ label: 'p⁺ · positive · 6°', tone: 'green' }],
                                [{ label: 'n before · −6°', tone: 'warm' }],
                                [{ label: 'n target · 120°', tone: 'warm' }],
                            ],
                            cellWidth: 230,
                            cellHeight: 50,
                            gap: 10,
                            fontSize: 20,
                            math: true,
                        }),
                    ],
                }),
                DataTable({
                    c,
                    rows: [
                        ['state', 'q · p⁺ (angle 6°)', 'q · n (negative angle)'],
                        ['before update', '0.995', '0.995 (−6°)'],
                        ['target geometry', '0.995', '−0.500 (120°)'],
                    ],
                    firstColWidth: 185,
                    cellWidth: 195,
                    cellHeight: 46,
                    gap: 6,
                    fontSize: 20,
                    headerRows: 1,
                    headerCols: 1,
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'The positive stays aligned while the hard negative rotates away from the query.',
                    width: 600,
                    fontSize: 20,
                    fontWeight: 700,
                    align: 'center',
                    color: c.textPrimary,
                }),
            ],
        }),
    })
}

export default create()
