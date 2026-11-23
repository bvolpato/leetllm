import { createElement } from 'react'
import {
    AxisPlot,
    CanvasItem,
    FlowArrow,
    Grid,
    Scene,
    TextLabel,
    getThemeColors,
    getToneColor,
} from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 640
export const height = 780
export const alt =
    'Causal attention flow for Birds and sing: Birds reads only its own value, while sing mixes 42.1 percent of Birds and 57.9 percent of sing, producing context [1.42, 1.58].'

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const plotWidth = 600
    const plotHeight = 360
    const padding = 52
    const x = (value: number) => padding + (value / 2.5) * (plotWidth - 2 * padding)
    const y = (value: number) => padding + ((2.5 - value) / 2.5) * (plotHeight - 2 * padding)
    const label = (text: string, x: number, y: number, labelWidth: number) =>
        CanvasItem({
            x,
            y,
            width: labelWidth,
            height: 29.7,
            children: createElement(TextLabel, {
                c,
                text,
                fontSize: 22,
                mono: true,
                color: c.textPrimary,
                align: 'center',
                width: labelWidth,
            }),
        })

    const matrix = Grid({
        c,
        cellWidth: 80,
        cellHeight: 48,
        gap: 6,
        fontSize: 22,
        headerRows: 1,
        headerCols: 1,
        rows: [
            [{ label: 'q / k' }, { label: 'Birds' }, { label: 'sing' }],
            [
                { label: 'Birds' },
                { label: '1.000', tone: 'purple' },
                { label: '×', backgroundColor: c.bgSubtle, color: c.textMuted },
            ],
            [
                { label: 'sing' },
                { label: '0.421', tone: 'purple' },
                { label: '0.579', tone: 'purple' },
            ],
        ],
    })

    return Scene({
        c,
        title: 'Attention weights mix value vectors',
        contentWidth: 620,
        padding: 10,
        gap: 10,
        children: [
            matrix,
            TextLabel({
                c,
                text: 'sing row: 0.421 Birds + 0.579 sing',
                fontSize: 22,
                mono: true,
                fontWeight: 700,
                align: 'center',
            }),
            FlowArrow({ direction: 'down', c, tone: 'green', length: 24 }),
            createElement(
                'div',
                {
                    style: {
                        position: 'relative',
                        width: plotWidth,
                        height: plotHeight,
                        margin: '0 auto',
                    },
                },
                AxisPlot({
                    c,
                    width: plotWidth,
                    height: plotHeight,
                    padding,
                    xMin: 0,
                    xMax: 2.5,
                    yMin: 0,
                    yMax: 2.5,
                    showGrid: true,
                    gridCount: 4,
                    paths: [
                        {
                            points: [
                                { x: 2, y: 1 },
                                { x: 1.421, y: 1.579 },
                                { x: 1, y: 2 },
                            ],
                            tone: 'green',
                            strokeWidth: 6,
                        },
                    ],
                    vectors: [
                        {
                            x1: 0,
                            y1: 0,
                            x2: 2,
                            y2: 1,
                            tone: 'purple',
                            strokeWidth: 4,
                            arrow: true,
                            arrowSize: 8,
                        },
                        {
                            x1: 0,
                            y1: 0,
                            x2: 1,
                            y2: 2,
                            tone: 'blue',
                            strokeWidth: 4,
                            arrow: true,
                            arrowSize: 8,
                        },
                    ],
                    points: [
                        { x: 2, y: 1, tone: 'purple', r: 8 },
                        { x: 1, y: 2, tone: 'blue', r: 8 },
                        {
                            x: 1.421,
                            y: 1.579,
                            fill: getToneColor('green', c),
                            r: 11,
                            stroke: c.bg,
                            strokeWidth: 3,
                        },
                    ],
                }),
                label('sing value [1,2]', x(1) + 24, y(2) - 46, 215),
                label('Birds value [2,1]', x(1) + 8, y(1) + 62, 230),
                label('context [1.42,1.58]', x(1.421) + 18, y(1.579) - 24, 240),
            ),
        ],
    })
}

export default create('dark')
