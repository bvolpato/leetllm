import type { ReactElement } from 'react'
import {
    AxisPlot,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'
import data from './map_data.json'

export const alt =
    'Two equal-scale maps compare nearest-neighbor choices for six embedding passages. The PCA map preserves six of six directed choices. Three detail plots center the exact PCA coordinates for the attention, tokenization, and optimization pairs at one shared magnification, so all six observations remain visible without moving them. A distorted map moves tok-a beside attn-b, leaving three choices correct.'
export const width = 640
export const height = 760

const tones = ['purple', 'purple', 'cyan', 'cyan', 'green', 'green'] as const
const neighbors = [
    [0, 1],
    [2, 3],
    [4, 5],
] as const

function plot(c: ThemeColors, distorted: boolean): ReactElement {
    const rows = distorted ? data.distorted : data.pca
    const xMin = distorted ? -0.3 : -0.9
    const xMax = distorted ? 2.4 : 1.05
    const yMin = distorted ? -0.3 : -0.9
    const yMax = distorted ? 2.4 : 1.05
    const rowColor = (index: number) => getReadableToneColor(tones[index], c)
    const pairPaths = neighbors.map(([a, b], i) => ({
        points: [rows[a], rows[b]].map(([x, y]) => ({ x, y })),
        color: distorted && i === 1 ? c.textMuted : rowColor(a),
        strokeWidth: 4,
        dashed: distorted && i === 1,
        opacity: distorted && i === 1 ? 0.65 : 0.9,
    }))
    return AxisPlot({
        c,
        width: 270,
        height: 270,
        padding: 24,
        xMin,
        xMax,
        yMin,
        yMax,
        showFrame: false,
        showGrid: false,
        paths: pairPaths,
        vectors: distorted
            ? [
                  {
                      x1: rows[2][0],
                      y1: rows[2][1],
                      x2: rows[1][0],
                      y2: rows[1][1],
                      color: c.critical,
                      strokeWidth: 5,
                      arrow: true,
                      arrowSize: 8,
                  },
              ]
            : [],
        points: rows.map(([x, y], index) => ({
            x,
            y,
            tone: tones[index],
            r: distorted && index === 1 ? 12 : 11,
            stroke: distorted && index === 1 ? c.critical : c.bgCard,
            strokeWidth: distorted && index === 1 ? 4 : 3,
        })),
    })
}

function exactPairDetails(c: ThemeColors): ReactElement {
    return Row({
        gap: 8,
        align: 'center',
        justify: 'center',
        children: neighbors.map(([a, b]) => {
            const [ax, ay] = data.pca[a]
            const [bx, by] = data.pca[b]
            const midpointX = (ax + bx) / 2
            const midpointY = (ay + by) / 2
            const rowColor = getReadableToneColor(tones[a], c)
            return Column({
                gap: 2,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: `${data.names[a]} ↔ ${data.names[b]}`,
                        fontSize: 21,
                        color: rowColor,
                        align: 'center',
                    }),
                    AxisPlot({
                        c,
                        width: 160,
                        height: 110,
                        padding: 15,
                        xMin: midpointX - 0.026,
                        xMax: midpointX + 0.026,
                        yMin: midpointY - 0.016,
                        yMax: midpointY + 0.016,
                        showFrame: false,
                        showAxes: false,
                        showGrid: false,
                        paths: [
                            {
                                points: [
                                    { x: ax, y: ay },
                                    { x: bx, y: by },
                                ],
                                color: rowColor,
                                strokeWidth: 2.5,
                            },
                        ],
                        points: [a, b].map((index) => ({
                            x: data.pca[index][0],
                            y: data.pca[index][1],
                            tone: tones[index],
                            r: 5,
                            stroke: c.bgCard,
                            strokeWidth: 1.5,
                        })),
                    }),
                ],
            })
        }),
    })
}

function mapPanel(c: ThemeColors, distorted: boolean): ReactElement {
    const accent = getReadableToneColor(distorted ? 'red' : 'green', c)
    return Column({
        gap: 2,
        align: 'center',
        children: [
            TextLabel({
                c,
                text: distorted ? 'Hand-distorted map' : 'Computed PCA map',
                fontSize: 22,
                color: accent,
                align: 'center',
            }),
            TextLabel({
                c,
                text: distorted ? '3/6 neighbors match' : '6/6 neighbors match',
                fontSize: 21,
                color: accent,
                align: 'center',
            }),
            plot(c, distorted),
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({
        c,
        title: 'A clean map can still give the wrong nearest neighbor',
        subtitle:
            'Same six passages · lines join each pair in the original space · the red arrow marks a false map neighbor',
        padding: 14,
        gap: 10,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 7,
            align: 'center',
            children: [
                Row({
                    gap: 12,
                    align: 'center',
                    justify: 'center',
                    children: [mapPanel(c, false), mapPanel(c, true)],
                }),
                TextLabel({
                    c,
                    text: 'Exact PCA pair views · same scale, centered on each pair',
                    fontSize: 21,
                    align: 'center',
                }),
                exactPairDetails(c),
                TextLabel({
                    c,
                    text: 'Red arrow marks tok-a’s false map neighbor: attn-b.',
                    fontSize: 21,
                    color: getReadableToneColor('red', c),
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
