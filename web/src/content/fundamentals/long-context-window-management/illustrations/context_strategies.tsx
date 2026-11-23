import {
    Column,
    Flow,
    getThemeColors,
    Matrix,
    Panel,
    Row,
    Scene,
    TextLabel,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 780
export const height = 815
export const alt =
    'A ten-position sequence places target fact F1 at index 1 and question Q9 at index 9. Full causal attention exposes all 55 lower-triangular query-key pairs and connects Q9 directly to F1. A width-4 sliding window exposes 34 pairs and blocks that direct link in a single layer. Retrieval instead selects chunks F1, 4, and 7 ahead of Q9.'

const n = 10
const axisLabels = ['0', 'F1', '', '', '4', '', '', '7', '', 'Q9']
const blankCells = Array.from({ length: n }, () => Array<string>(n).fill(''))
const fullMask = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, k) => (k <= r ? 1 : 0)),
)
const winMask = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, k) => (k <= r && r - k < 4 ? 1 : 0)),
)

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 750,
        padding: 6,
        gap: 6,
        children: [
            Column({
                gap: 6,
                align: 'center',
                children: [
                    Row({
                        gap: 12,
                        justify: 'center',
                        children: [
                            Panel({
                                c,
                                title: 'Full causal (55 pairs)',
                                tone: 'purple',
                                width: 356,
                                padding: 6,
                                gap: 4,
                                children: [
                                    Matrix({
                                        c,
                                        data: fullMask,
                                        labels: blankCells,
                                        rowLabels: axisLabels,
                                        colLabels: axisLabels,
                                        cellSize: 18,
                                        rowLabelWidth: 38,
                                        fontSize: 23,
                                        colorScale: 'strength',
                                        highlightCell: { row: 9, col: 1 },
                                        highlightColor: c.positive,
                                    }),
                                ],
                            }),
                            Panel({
                                c,
                                title: 'Window W=4 (34 pairs)',
                                tone: 'warm',
                                width: 356,
                                padding: 6,
                                gap: 4,
                                children: [
                                    Matrix({
                                        c,
                                        data: winMask,
                                        labels: blankCells,
                                        rowLabels: axisLabels,
                                        colLabels: axisLabels,
                                        cellSize: 18,
                                        rowLabelWidth: 38,
                                        fontSize: 23,
                                        colorScale: 'strength',
                                        highlightCell: { row: 9, col: 1 },
                                        highlightColor: c.critical,
                                    }),
                                ],
                            }),
                        ],
                    }),
                    Flow({
                        c,
                        direction: 'horizontal',
                        gap: 4,
                        connectorLength: 14,
                        stages: [
                            {
                                title: 'Archive (0..9)',
                                subtitle: '10 spans',
                                tone: 'neutral',
                                width: 190,
                            },
                            {
                                title: 'Top-k filter',
                                subtitle: 'picks F1, 4, 7',
                                tone: 'blue',
                                width: 195,
                            },
                            {
                                title: 'Packed prompt',
                                subtitle: '[F1, 4, 7, Q9]',
                                tone: 'green',
                                width: 195,
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Full pays O(L²); window cuts range; retrieval gates recall',
                        fontSize: 24,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
