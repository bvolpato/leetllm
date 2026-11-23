import {
    BarChart,
    Column,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 920
export const height = 740
export const alt =
    'Comparison of shared-memory strides 32, 33, and 34 for scalar 32-bit reads on column 0. A bank map and padded tile diagram show stride 32 collapsing onto Bank 0, stride 33 visiting all 32 banks once, and stride 34 hitting 16 even banks twice. A bar chart plots 32, 1, and 2 predicted conflict-free service groups alongside 4,096, 4,224, and 4,352 bytes per tile.'

const cell = (label: string, tone: ToneName) => ({ label, tone })

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.75)

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: 888,
        children: Row({
            gap: 14,
            align: 'stretch',
            children: [
                Panel({
                    c,
                    title: 'Column c=0 Bank Map',
                    subtitle: 'bank = (stride * lane) mod 32',
                    width: 468,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 32,
                    children: [
                        Grid({
                            c,
                            headerRows: 1,
                            headerCols: 1,
                            cellWidth: 96,
                            cellHeight: 40,
                            gap: 4,
                            fontSize: 28,
                            rows: [
                                ['Lane', 's=32', 's=33', 's=34'],
                                [
                                    'L0',
                                    cell('B0', 'critical'),
                                    cell('B0', 'green'),
                                    cell('B0', 'warm'),
                                ],
                                [
                                    'L1',
                                    cell('B0', 'critical'),
                                    cell('B1', 'green'),
                                    cell('B2', 'warm'),
                                ],
                                [
                                    'L16',
                                    cell('B0', 'critical'),
                                    cell('B16', 'green'),
                                    cell('B0', 'warm'),
                                ],
                                [
                                    'L17',
                                    cell('B0', 'critical'),
                                    cell('B17', 'green'),
                                    cell('B2', 'warm'),
                                ],
                                [
                                    'Bytes',
                                    cell('4,096', 'critical'),
                                    cell('4,224', 'green'),
                                    cell('4,352', 'warm'),
                                ],
                            ],
                        }),
                        Row({
                            gap: 12,
                            align: 'center',
                            justify: 'center',
                            children: [
                                Column({
                                    gap: 4,
                                    align: 'center',
                                    children: [
                                        TextLabel({
                                            c,
                                            text: '32 cols (B0)',
                                            fontSize: 28,
                                            fontWeight: 700,
                                            color: getReadableToneColor('critical', c),
                                        }),
                                        TiledMatrix({
                                            c,
                                            rows: 4,
                                            cols: 4,
                                            cellSize: 24,
                                            gap: 3,
                                            regions: [
                                                {
                                                    rowStart: 0,
                                                    rowEnd: 4,
                                                    colStart: 0,
                                                    colEnd: 1,
                                                    tone: 'critical',
                                                },
                                            ],
                                        }),
                                    ],
                                }),
                                Column({
                                    gap: 2,
                                    align: 'center',
                                    children: [
                                        TextLabel({
                                            c,
                                            text: '+1 col',
                                            fontSize: 28,
                                            fontWeight: 700,
                                            color: getReadableToneColor('green', c),
                                        }),
                                        FlowArrow({
                                            c,
                                            direction: 'right',
                                            length: 50,
                                            tone: 'green',
                                        }),
                                    ],
                                }),
                                Column({
                                    gap: 4,
                                    align: 'center',
                                    children: [
                                        TextLabel({
                                            c,
                                            text: '33 (+1 pad)',
                                            fontSize: 28,
                                            fontWeight: 700,
                                            color: getReadableToneColor('green', c),
                                        }),
                                        TiledMatrix({
                                            c,
                                            rows: 4,
                                            cols: 5,
                                            cellSize: 24,
                                            gap: 3,
                                            regions: [
                                                {
                                                    rowStart: 0,
                                                    rowEnd: 1,
                                                    colStart: 0,
                                                    colEnd: 1,
                                                    tone: 'green',
                                                },
                                                {
                                                    rowStart: 1,
                                                    rowEnd: 2,
                                                    colStart: 1,
                                                    colEnd: 2,
                                                    tone: 'green',
                                                },
                                                {
                                                    rowStart: 2,
                                                    rowEnd: 3,
                                                    colStart: 2,
                                                    colEnd: 3,
                                                    tone: 'green',
                                                },
                                                {
                                                    rowStart: 3,
                                                    rowEnd: 4,
                                                    colStart: 3,
                                                    colEnd: 4,
                                                    tone: 'green',
                                                },
                                                {
                                                    rowStart: 0,
                                                    rowEnd: 4,
                                                    colStart: 4,
                                                    colEnd: 5,
                                                    tone: 'neutral',
                                                },
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Service Groups (Model)',
                    subtitle: '32x32 data & traffic fixed',
                    width: 406,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 32,
                    children: [
                        BarChart({
                            c,
                            width: 374,
                            height: 255,
                            max: 32,
                            showGrid: true,
                            showValues: false,
                            data: [
                                { label: 's=32', value: 32, color: c.critical },
                                { label: 's=33', value: 1, color: c.positive },
                                { label: 's=34', value: 2, color: c.warning },
                            ],
                        }),
                        Column({
                            gap: 8,
                            align: 'start',
                            children: [
                                TextLabel({
                                    c,
                                    text: 's=32: 32 groups (B0)',
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: getReadableToneColor('critical', c),
                                    align: 'left',
                                    mono: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 's=33: 1 group (all 32)',
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: getReadableToneColor('green', c),
                                    align: 'left',
                                    mono: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 's=34: 2 groups (even)',
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: getReadableToneColor('warm', c),
                                    align: 'left',
                                    mono: true,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create()
