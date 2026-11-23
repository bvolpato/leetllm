import {
    BarChart,
    Column,
    getThemeColors,
    Scene,
    TextLabel,
    TiledMatrix,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 720
export const height = 740
export const alt =
    'Under decode context parallelism across 4 ranks with physical block size 16, one logical block covers 64 positions (4 × 16). A 1,025-token history allocates 17 logical blocks (1,088 positions), whereas rounding by physical block size 16 yields 65 blocks (1,040 positions).'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.15)

    return Scene({
        c,
        density: 2.15,
        contentWidth: 690,
        padding: 12,
        gap: 12,
        children: [
            Column({
                gap: 14,
                align: 'center',
                children: [
                    TiledMatrix({
                        c,
                        title: 'One 64-token logical block (4 DCP ranks × 16 physical tokens)',
                        subtitle:
                            'Each rank row holds 16 physical slots of the logical cache block',
                        rows: 4,
                        cols: 16,
                        cellSize: 30,
                        gap: 5,
                        regions: [
                            { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 16, tone: 'purple' },
                            { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 16, tone: 'blue' },
                            { rowStart: 2, rowEnd: 3, colStart: 0, colEnd: 16, tone: 'green' },
                            { rowStart: 3, rowEnd: 4, colStart: 0, colEnd: 16, tone: 'warm' },
                        ],
                    }),
                    BarChart({
                        c,
                        title: '1,025-token history: allocated capacity positions',
                        width: 670,
                        height: 220,
                        min: 960,
                        max: 1110,
                        format: (v) => `${Math.round(v)}`,
                        showValues: true,
                        data: [
                            {
                                label: 'True history',
                                value: 1025,
                                color: c.neutral,
                                valueLabel: '1,025',
                            },
                            {
                                label: '65×16 physical (err)',
                                value: 1040,
                                color: c.critical,
                                valueLabel: '1,040',
                            },
                            {
                                label: '17×64 logical (DCP)',
                                value: 1088,
                                color: c.positive,
                                valueLabel: '1,088',
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Round block allocation by logical block size = physical_size × dcp_world_size',
                        fontSize: 22,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
