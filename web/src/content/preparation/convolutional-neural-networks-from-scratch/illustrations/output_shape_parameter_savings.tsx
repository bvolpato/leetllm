import {
    Arrow,
    Card,
    Column,
    Grid,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getToneColor,
} from 'vizmatic'
import type { ThemeColors, ToneName } from 'vizmatic'

export const alt =
    'A tied 16-filter bank is reused across a 222 by 222 field of local output positions, for 448 total parameters. Giving every position its own bank uses 22,079,232 parameters for the same output shape. A dense layer over a flattened 224 by 224 RGB crop uses 38,535,424 parameters and produces 256 scores.'

export const width = 640
export const height = 620

const inputValues = 3 * 224 * 224
const filterCount = 16
const parametersPerFilter = 3 * 3 * 3 + 1
const sharedParameters = filterCount * parametersPerFilter
const localSites = 222 * 222
const separateLocalParameters = localSites * sharedParameters
const denseParameters = (inputValues + 1) * 256

if (
    sharedParameters !== 448 ||
    separateLocalParameters !== 22_079_232 ||
    denseParameters !== 38_535_424
) {
    throw new Error('CNN parameter calculation mismatch against worked example.')
}

type Cell = { label: string; tone: ToneName }

function text(
    c: ThemeColors,
    value: string,
    size: number,
    color = c.textPrimary,
    weight = 600,
    mono = false,
) {
    return TextLabel({
        c,
        text: value,
        fontSize: size,
        color,
        fontWeight: weight,
        mono,
        align: 'center',
    })
}

function grid(c: ThemeColors, rows: Cell[][], size: number, fontSize: number) {
    const readableRows = rows.map((row) => row.map((cell) => ({ ...cell, color: c.textPrimary })))
    return Grid({
        c,
        rows: readableRows,
        cellWidth: size,
        cellHeight: size,
        gap: 4,
        fontSize,
        radius: 7,
    })
}

const separateSites: Cell[][] = [
    [
        { label: 'K₁', tone: 'purple' },
        { label: 'K₂', tone: 'blue' },
        { label: 'K₃', tone: 'purple' },
    ],
    [
        { label: 'K₄', tone: 'blue' },
        { label: 'K₅', tone: 'purple' },
        { label: 'K₆', tone: 'blue' },
    ],
    [
        { label: 'K₇', tone: 'purple' },
        { label: 'K₈', tone: 'blue' },
        { label: 'K₉', tone: 'purple' },
    ],
]

const outputSites: Cell[][] = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => ({ label: 'y', tone: 'green' as ToneName })),
)

const illustration = defineIllustration((c) =>
    Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 616,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                text(c, 'One filter bank, reused at every position', 27, c.textPrimary, 800),
                text(c, '224 × 224 RGB input · 16 filters · biases included', 21, c.textSecondary),
                Row({
                    gap: 12,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Card({
                            c,
                            tone: 'cyan',
                            width: 302,
                            padding: 10,
                            gap: 8,
                            shadow: false,
                            title: text(c, 'Shared local conv', 22, c.secondary, 750),
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    Row({
                                        gap: 10,
                                        align: 'center',
                                        children: [
                                            grid(c, [[{ label: 'K', tone: 'cyan' }]], 54, 22),
                                            Arrow({
                                                c,
                                                direction: 'right',
                                                length: 18,
                                                color: c.secondary,
                                            }),
                                            grid(c, outputSites, 34, 21),
                                        ],
                                    }),
                                    text(
                                        c,
                                        `16×28 = ${sharedParameters.toLocaleString('en-US')}`,
                                        22,
                                        c.textPrimary,
                                        750,
                                        true,
                                    ),
                                    text(c, '1 bank · output 16×222×222', 20, c.textSecondary),
                                ],
                            }),
                        }),
                        Card({
                            c,
                            tone: 'purple',
                            width: 302,
                            padding: 10,
                            gap: 8,
                            shadow: false,
                            title: text(
                                c,
                                'Separate local weights',
                                22,
                                getToneColor('purple', c),
                                750,
                            ),
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    Row({
                                        gap: 10,
                                        align: 'center',
                                        children: [
                                            grid(c, separateSites, 34, 20),
                                            Arrow({
                                                c,
                                                direction: 'right',
                                                length: 18,
                                                color: getToneColor('purple', c),
                                            }),
                                            grid(c, outputSites, 34, 21),
                                        ],
                                    }),
                                    text(
                                        c,
                                        `222²×448 = ${separateLocalParameters.toLocaleString('en-US')}`,
                                        21,
                                        c.textPrimary,
                                        750,
                                        true,
                                    ),
                                    text(c, '1 bank/site · 16×222×222 out', 20, c.textSecondary),
                                ],
                            }),
                        }),
                    ],
                }),
                Card({
                    c,
                    tone: 'warm',
                    width: 616,
                    padding: 10,
                    gap: 6,
                    shadow: false,
                    title: text(
                        c,
                        'Dense layer over flattened 224 × 224 × 3 input',
                        22,
                        getToneColor('warm', c),
                        750,
                    ),
                    children: Column({
                        gap: 6,
                        align: 'center',
                        children: [
                            Row({
                                gap: 12,
                                align: 'center',
                                justify: 'center',
                                children: [
                                    text(
                                        c,
                                        `${inputValues.toLocaleString('en-US')} values`,
                                        21,
                                        c.textSecondary,
                                        600,
                                        true,
                                    ),
                                    Arrow({
                                        c,
                                        direction: 'right',
                                        length: 22,
                                        color: getToneColor('warm', c),
                                    }),
                                    text(c, '256 global scores', 21, c.textPrimary, 750),
                                ],
                            }),
                            text(
                                c,
                                `(${inputValues.toLocaleString('en-US')} + 1) × 256 = ${denseParameters.toLocaleString('en-US')} params`,
                                21,
                                c.textPrimary,
                                750,
                                true,
                            ),
                        ],
                    }),
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
