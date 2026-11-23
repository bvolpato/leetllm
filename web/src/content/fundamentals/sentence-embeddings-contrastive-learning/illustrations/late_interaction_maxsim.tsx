import {
    Column,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'ColBERT MaxSim similarities compare query positions rope and angle with stored document positions shift, rope, and angle. Matrix rows are 0.12, 0.93, 0.08 and 0.19, 0.07, 0.91 across six dot products. Row maxima 0.93 and 0.91 sum to 1.84.'

export const width = 640
export const height = 620

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        title: 'MaxSim picks each query token’s strongest document match',
        subtitle: 'Each query token matches independently across all stored passage tokens',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        align: 'center',
        children: Column({
            width: 608,
            gap: 14,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Stored document token vectors · late interaction matrix',
                    width: 600,
                    fontSize: 21,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Grid({
                    c,
                    rows: [
                        ['q_i / d_j', 'shift', 'rope', 'angle', 'row max'],
                        [
                            'rope',
                            '0.12',
                            { label: '0.93', tone: 'green' },
                            '0.08',
                            { label: '0.93', tone: 'green' },
                        ],
                        [
                            'angle',
                            '0.19',
                            '0.07',
                            { label: '0.91', tone: 'green' },
                            { label: '0.91', tone: 'green' },
                        ],
                    ],
                    cellWidth: 112,
                    cellHeight: 60,
                    gap: 6,
                    fontSize: 21,
                    headerRows: 1,
                    headerCols: 1,
                    math: true,
                }),
                FlowArrow({ c, direction: 'down', tone: 'green', length: 22 }),
                Row({
                    gap: 16,
                    align: 'center',
                    justify: 'center',
                    children: [
                        Grid({
                            c,
                            rows: [[{ label: '2 × 3 = 6 dot products', tone: 'blue' }]],
                            cellWidth: 320,
                            cellHeight: 54,
                            gap: 6,
                            fontSize: 20,
                            math: true,
                        }),
                        Grid({
                            c,
                            rows: [[{ label: 'MaxSim = 1.84', tone: 'green' }]],
                            cellWidth: 200,
                            cellHeight: 54,
                            gap: 6,
                            fontSize: 22,
                            math: true,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'MaxSim = 0.93 + 0.91 = 1.84',
                    width: 600,
                    fontSize: 25,
                    fontWeight: 850,
                    align: 'center',
                    color: green,
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'Query tokens never need to align sequentially; every row takes its best match.',
                    width: 600,
                    fontSize: 19,
                    fontWeight: 650,
                    align: 'center',
                    color: c.textSecondary,
                }),
            ],
        }),
    })
}

export default create()
