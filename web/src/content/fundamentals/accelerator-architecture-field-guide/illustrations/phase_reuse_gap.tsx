import {
    Column,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
} from 'vizmatic'

export const width = 620
export const height = 800
export const alt =
    'Two schematic matrix-product lanes use the same 86 MiB BF16 weight matrix W. Both mark the fourth of four output-channel partitions in W and Y; that W tile is reused across four aggregated row bands containing eight decode rows or 32,768 prefill rows. The shapes give 8.0 versus 2,736.0 ideal FLOP per byte under the one-read traffic model; row bands are aggregates, and the figure reports no hardware utilization.'

const illustration = defineIllustration((c) => {
    const matrix = (
        name: string,
        dimensions: string,
        rows: number,
        cols: number,
        width: number,
        regions: {
            rowStart: number
            rowEnd: number
            colStart: number
            colEnd: number
            tone: 'blue' | 'purple' | 'green'
        }[],
        ariaLabel: string,
    ) =>
        Column({
            width,
            gap: 4,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: name,
                    fontSize: 22,
                    fontWeight: 750,
                    align: 'center',
                    color: c.textPrimary,
                }),
                TiledMatrix({
                    c,
                    rows,
                    cols,
                    cellSize: 23,
                    gap: 4,
                    tone: 'neutral',
                    regions,
                    ariaLabel,
                }),
                TextLabel({
                    c,
                    text: dimensions,
                    fontSize: 22,
                    mono: true,
                    align: 'center',
                    color: c.textSecondary,
                    width,
                }),
            ],
        })

    const weightMatrix = () =>
        Column({
            width: 220,
            gap: 4,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'W · N tile 4 of 4',
                    fontSize: 22,
                    fontWeight: 750,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Grid({
                    c,
                    cellWidth: 50,
                    cellHeight: 23,
                    gap: 4,
                    radius: 4,
                    rows: Array.from({ length: 3 }, (_, row) =>
                        Array.from({ length: 4 }, (_, col) =>
                            col === 3
                                ? { tone: 'purple' as const }
                                : { backgroundColor: c.bgHover, borderColor: c.borderSubtle },
                        ),
                    ),
                }),
                TextLabel({
                    c,
                    text: '4096 × 11008',
                    fontSize: 22,
                    mono: true,
                    align: 'center',
                    color: c.textSecondary,
                    width: 220,
                }),
            ],
        })

    const lane = (
        phase: string,
        rowsPerBand: string,
        rowCount: string,
        metric: string,
        selectedTone: 'blue' | 'green',
    ) =>
        Column({
            width: 588,
            gap: 6,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: `${phase} · M = ${rowCount}`,
                    fontSize: 24,
                    fontWeight: 750,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Row({
                    gap: 5,
                    align: 'center',
                    justify: 'center',
                    children: [
                        matrix(
                            'X',
                            'M × 4096',
                            4,
                            3,
                            128,
                            [
                                {
                                    rowStart: 0,
                                    rowEnd: 4,
                                    colStart: 0,
                                    colEnd: 3,
                                    tone: selectedTone,
                                },
                            ],
                            `${phase} input matrix X, four aggregated row bands by three schematic K slices`,
                        ),
                        TextLabel({
                            c,
                            text: '×',
                            fontSize: 25,
                            fontWeight: 700,
                            align: 'center',
                            color: c.textSecondary,
                            width: 24,
                        }),
                        weightMatrix(),
                        FlowArrow({ c, direction: 'right', tone: 'purple', length: 22 }),
                        matrix(
                            'Y · N tile 4 of 4',
                            'M × 11008',
                            4,
                            4,
                            128,
                            [{ rowStart: 0, rowEnd: 4, colStart: 3, colEnd: 4, tone: 'purple' }],
                            `${phase} output matrix Y, four aggregated row bands by four schematic N slices, matching the highlighted W output tile`,
                        ),
                    ],
                }),
                TextLabel({
                    c,
                    text: `4 × ${rowsPerBand} = ${rowCount} rows · same W tile reused`,
                    fontSize: 22,
                    align: 'center',
                    color: c.textSecondary,
                    width: 588,
                }),
                TextLabel({
                    c,
                    text: `I = ${metric} FLOP/byte`,
                    fontSize: 22,
                    fontWeight: 750,
                    mono: true,
                    align: 'center',
                    color: c.textPrimary,
                }),
            ],
        })

    return Scene({
        c,
        padding: 16,
        gap: 9,
        align: 'center',
        contentWidth: 588,
        title: 'Same 86 MiB BF16 W feeds more rows',
        children: Column({
            width: 588,
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Y[M × N] = X[M × K] × W[K × N]',
                    fontSize: 22,
                    mono: true,
                    align: 'center',
                    color: c.textSecondary,
                    width: 588,
                }),
                lane('Decode', '2', '8', '8.0', 'blue'),
                lane('Prefill', '8,192', '32,768', '2,736.0', 'green'),
                TextLabel({
                    c,
                    text: 'I = 2MKN / 2(MK + KN + MN)',
                    fontSize: 22,
                    mono: true,
                    align: 'center',
                    color: c.textMuted,
                    width: 588,
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
