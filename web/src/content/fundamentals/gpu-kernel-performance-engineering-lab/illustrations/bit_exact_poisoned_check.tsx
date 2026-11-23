import {
    BadgePill,
    Column,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 920
export const height = 720
export const alt =
    'Three 3x3 matrices show input A, expected transpose B, and actual B when the store for A[1,2]=5 is skipped, leaving poisoned NaN (0xffffffff) at B[2,1] while signed zeros +0 (0x00000000) and -0 (0x80000000) differ bitwise. A four-stage row shows fresh-poison preflight, five warmups, event-timed iterations, and separate validation.'

function matrixBlock(
    c: ReturnType<typeof getThemeColors>,
    label: string,
    values: string[][],
    hi: [number, number],
    hiTone: ToneName,
) {
    const rows = values.map((row, r) =>
        row.map((val, col) => ({
            label: val,
            tone: (r === hi[0] && col === hi[1]
                ? hiTone
                : (r + col) % 2 === 0
                  ? 'blue'
                  : 'cyan') as ToneName,
        })),
    )
    return Column({
        gap: 6,
        align: 'center',
        children: [
            TextLabel({ c, text: label, fontSize: 29, fontWeight: 700, color: c.textPrimary }),
            Grid({ c, rows, cellWidth: 62, cellHeight: 42, gap: 4, radius: 6, fontSize: 28 }),
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.75)
    const src = [
        ['0', '1', '2'],
        ['3', '4', '5'],
        ['6', '7', '8'],
    ]
    const exp = [
        ['0', '3', '6'],
        ['1', '4', '7'],
        ['2', '5', '8'],
    ]
    const act = [
        ['0', '3', '6'],
        ['1', '4', '7'],
        ['2', 'NaN', '8'],
    ]

    const stages: Array<[string, string, ToneName]> = [
        ['Preflight', '0xff check', 'blue'],
        ['Warmup', '5 launches', 'cyan'],
        ['Timed', 'iters batch', 'purple'],
        ['Validate', 'new 0xff', 'green'],
    ]

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: 888,
        children: Column({
            gap: 12,
            children: [
                Panel({
                    c,
                    title: 'Poisoned Buffer Catches Missing Store at B[2,1]',
                    tone: 'blue',
                    width: 888,
                    padding: 14,
                    gap: 12,
                    titleFontSize: 31,
                    children: [
                        Row({
                            gap: 12,
                            align: 'center',
                            justify: 'center',
                            children: [
                                matrixBlock(c, 'Input A', src, [1, 2], 'warm'),
                                FlowArrow({ c, direction: 'right', length: 38, tone: 'warm' }),
                                matrixBlock(c, 'Expected B', exp, [2, 1], 'green'),
                                FlowArrow({ c, direction: 'right', length: 38, tone: 'critical' }),
                                matrixBlock(c, 'Actual B', act, [2, 1], 'critical'),
                            ],
                        }),
                        Row({
                            gap: 10,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '0x40a00000 (5)',
                                    tone: 'green',
                                    fontSize: 28,
                                    height: 42,
                                    padding: '4px 12px',
                                }),
                                TextLabel({
                                    c,
                                    text: '≠',
                                    fontSize: 32,
                                    fontWeight: 800,
                                    color: c.textPrimary,
                                }),
                                BadgePill({
                                    c,
                                    text: '0xffffffff (NaN)',
                                    tone: 'critical',
                                    fontSize: 28,
                                    height: 42,
                                    padding: '4px 12px',
                                }),
                                BadgePill({
                                    c,
                                    text: 'mismatches = 1',
                                    tone: 'warm',
                                    fontSize: 28,
                                    height: 42,
                                    padding: '4px 12px',
                                }),
                            ],
                        }),
                        Row({
                            gap: 10,
                            align: 'center',
                            justify: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Signed zero:',
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: c.textSecondary,
                                }),
                                BadgePill({
                                    c,
                                    text: '+0 (0x00000000)',
                                    tone: 'cyan',
                                    fontSize: 28,
                                    height: 40,
                                    padding: '2px 12px',
                                }),
                                TextLabel({
                                    c,
                                    text: '≠',
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: c.textPrimary,
                                }),
                                BadgePill({
                                    c,
                                    text: '-0 (0x80000000)',
                                    tone: 'purple',
                                    fontSize: 28,
                                    height: 40,
                                    padding: '2px 12px',
                                }),
                            ],
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Poison Checks Bracket Timed Batch',
                    tone: 'green',
                    width: 888,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 31,
                    children: Row({
                        gap: 8,
                        align: 'stretch',
                        justify: 'center',
                        children: stages.flatMap(([title, sub, tone], idx) => {
                            const box = Panel({
                                c,
                                title,
                                tone,
                                width: 192,
                                padding: 10,
                                gap: 6,
                                titleFontSize: 28,
                                children: [
                                    TextLabel({
                                        c,
                                        text: sub,
                                        fontSize: 28,
                                        fontWeight: 600,
                                        color: getReadableToneColor(tone, c),
                                    }),
                                ],
                            })
                            return idx < stages.length - 1
                                ? [box, FlowArrow({ c, direction: 'right', length: 20, tone })]
                                : [box]
                        }),
                    }),
                }),
            ],
        }),
    })
}

export default create()
