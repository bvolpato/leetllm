import React from 'react'
import {
    Column,
    DataTable,
    Grid,
    Matrix,
    Panel,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 740
export const alt =
    'Five assignments for three tokens pack by expert ID into token order [1, 2, 0, 0, 2]: E0 (scale 2) runs t1 and t2; E1 (scale -1) runs t0; E2 (scale 0.5) runs t0 and t2. Applying each gate weight once and scatter-adding by token ID restores rows [-0.625, -1.25], [6.0, 8.0], and [5.5, 6.6], whereas unweighted t0 sums to [-0.5, -1.0].'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Step 1: group by expert -> packed order [1, 2, 0, 0, 2]',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    gap: 8,
                    children: [
                        Grid({
                            c: cd,
                            rows: [
                                [
                                    { label: 'E0: t1\nw=1.00', tone: 'blue' },
                                    { label: 'E0: t2\nw=0.40', tone: 'blue' },
                                    { label: 'E1: t0\nw=0.75', tone: 'warm' },
                                    { label: 'E2: t0\nw=0.25', tone: 'green' },
                                    { label: 'E2: t2\nw=0.60', tone: 'green' },
                                ],
                            ],
                            cellWidth: 102,
                            cellHeight: 56,
                            gap: 6,
                            fontSize: 18,
                        }),
                        DataTable({
                            c: cd,
                            headerRows: 1,
                            headerCols: 1,
                            firstColWidth: 88,
                            cellWidth: 146,
                            cellHeight: 30,
                            gap: 4,
                            fontSize: 18,
                            rows: [
                                ['Expert', 'Scale', 'Packed Tokens', 'Gate Weights'],
                                ['E0', '× 2.0', 't1, t2', '1.00, 0.40'],
                                ['E1', '× −1.0', 't0', '0.75'],
                                ['E2', '× 0.5', 't0, t2', '0.25, 0.60'],
                            ],
                        }),
                    ],
                }),
                Panel({
                    c: cd,
                    title: 'Step 2: weight once and scatter-add by token ID',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    gap: 8,
                    children: [
                        Matrix({
                            c: cd,
                            rowLabels: ['t0 [1, 2]', 't1 [3, 4]', 't2 [5, 6]', 't0 unweighted'],
                            colLabels: ['dim 0', 'dim 1'],
                            data: [
                                [-0.625, -1.25],
                                [6.0, 8.0],
                                [5.5, 6.6],
                                [-0.5, -1.0],
                            ],
                            cellWidth: 124,
                            cellHeight: 36,
                            rowLabelWidth: 164,
                            format: 'decimal',
                            colorize: true,
                            highlightRow: 3,
                            fontSize: 18,
                        }),
                        TextLabel({
                            c,
                            text: 't0 weighted: 0.75(−1·[1,2]) + 0.25(0.5·[1,2]) = [−0.625, −1.25].',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
