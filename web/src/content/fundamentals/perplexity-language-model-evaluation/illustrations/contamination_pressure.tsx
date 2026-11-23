import { Column, Row, Scene, TextLabel, TiledMatrix, getThemeColors, getToneColor } from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 560
export const alt =
    'Left: document d103 appears in both the training split (d101, d102, d103) and the validation split (d103, d201, d202), contaminating held-out perplexity. Right: a clean evaluation protocol keeps fixed holdout documents d201 and d202 disjoint across runs while rotating fresh challenge subsets d301, d302, and d303.'

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        title: 'Keep held-out splits disjoint and rotate fresh eval sets',
        contentWidth: 636,
        padding: 12,
        gap: 14,
        children: [
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Keep held-out splits disjoint and rotate fresh eval sets',
                        fontSize: 21,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Columns show corpus documents d101..d303 across train and eval splits',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
            Row({
                gap: 28,
                align: 'start',
                justify: 'center',
                children: [
                    Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Contaminated split',
                                fontSize: 21,
                                fontWeight: 700,
                                color: getToneColor('warm', c),
                            }),
                            Row({
                                gap: 10,
                                align: 'center',
                                children: [
                                    Column({
                                        gap: 26,
                                        align: 'end',
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'Train',
                                                fontSize: 20,
                                                mono: true,
                                                color: c.textMuted,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'Eval',
                                                fontSize: 20,
                                                mono: true,
                                                color: c.textMuted,
                                            }),
                                        ],
                                    }),
                                    TiledMatrix({
                                        c,
                                        rows: 2,
                                        cols: 5,
                                        cellSize: 34,
                                        gap: 4,
                                        muted: true,
                                        tone: 'neutral',
                                        regions: [
                                            {
                                                rowStart: 0,
                                                rowEnd: 1,
                                                colStart: 0,
                                                colEnd: 2,
                                                tone: 'blue',
                                            },
                                            {
                                                rowStart: 0,
                                                rowEnd: 2,
                                                colStart: 2,
                                                colEnd: 3,
                                                tone: 'warm',
                                            },
                                            {
                                                rowStart: 1,
                                                rowEnd: 2,
                                                colStart: 3,
                                                colEnd: 5,
                                                tone: 'blue',
                                            },
                                        ],
                                        ariaLabel:
                                            'Contaminated training and validation partition overlapping on column 3 (doc-103)',
                                    }),
                                ],
                            }),
                            TextLabel({
                                c,
                                text: 'Overlap at d103 (column 3)',
                                fontSize: 20,
                                fontWeight: 700,
                                color: getToneColor('warm', c),
                            }),
                        ],
                    }),
                    Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Clean rolling protocol',
                                fontSize: 21,
                                fontWeight: 700,
                                color: getToneColor('green', c),
                            }),
                            Row({
                                gap: 10,
                                align: 'center',
                                children: [
                                    Column({
                                        gap: 14,
                                        align: 'end',
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'Run 1',
                                                fontSize: 20,
                                                mono: true,
                                                color: c.textMuted,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'Run 2',
                                                fontSize: 20,
                                                mono: true,
                                                color: c.textMuted,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'Run 3',
                                                fontSize: 20,
                                                mono: true,
                                                color: c.textMuted,
                                            }),
                                        ],
                                    }),
                                    TiledMatrix({
                                        c,
                                        rows: 3,
                                        cols: 5,
                                        cellSize: 34,
                                        gap: 4,
                                        muted: true,
                                        tone: 'neutral',
                                        regions: [
                                            {
                                                rowStart: 0,
                                                rowEnd: 3,
                                                colStart: 0,
                                                colEnd: 2,
                                                tone: 'blue',
                                            },
                                            {
                                                rowStart: 0,
                                                rowEnd: 1,
                                                colStart: 2,
                                                colEnd: 3,
                                                tone: 'green',
                                            },
                                            {
                                                rowStart: 1,
                                                rowEnd: 2,
                                                colStart: 3,
                                                colEnd: 4,
                                                tone: 'green',
                                            },
                                            {
                                                rowStart: 2,
                                                rowEnd: 3,
                                                colStart: 4,
                                                colEnd: 5,
                                                tone: 'green',
                                            },
                                        ],
                                        ariaLabel:
                                            'Clean rolling evaluation holding d201-d202 fixed in blue and rotating fresh holdout sets in green across Runs 1, 2, and 3',
                                    }),
                                ],
                            }),
                            TextLabel({
                                c,
                                text: 'Fixed holdout + fresh rotation',
                                fontSize: 20,
                                fontWeight: 700,
                                color: getToneColor('green', c),
                            }),
                        ],
                    }),
                ],
            }),
            TextLabel({
                c,
                text: 'Deleting a leaked ID from a manifest leaves trained weights exposed',
                fontSize: 20,
                color: c.textMuted,
                align: 'center',
            }),
        ],
    })
}

export default create('dark')
