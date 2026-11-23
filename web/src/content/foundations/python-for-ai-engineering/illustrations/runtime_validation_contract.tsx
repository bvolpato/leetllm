import {
    Column,
    FlowArrow,
    Matrix,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const alt =
    'Four variable-length token sequences streamed from JSONL (lengths 4, 2, 5, and 3) are right-padded with pad_id 0 into a uniform 4 by 5 token ID matrix alongside a binary 4 by 5 attention mask marking real tokens with 1 and padding positions with 0.'

export const width = 660
export const height = 570
export const preset = 'engineering'

const TOKEN_IDS = [
    [12, 84, 39, 2, 0],
    [51, 90, 0, 0, 0],
    [8, 63, 77, 19, 3],
    [44, 61, 17, 0, 0],
]

const ATTENTION_MASK = [
    [1, 1, 1, 1, 0],
    [1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0],
]

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)

    const seqLines = [
        { id: 's0', tokens: '[12, 84, 39, 2]', len: 'len=4' },
        { id: 's1', tokens: '[51, 90]', len: 'len=2' },
        { id: 's2', tokens: '[8, 63, 77, 19, 3]', len: 'len=5' },
        { id: 's3', tokens: '[44, 61, 17]', len: 'len=3' },
    ]

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: 628,
        align: 'center',
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Ragged JSONL Stream to Padded Batch [4 × 5]',
                    fontSize: 25,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Panel({
                    c,
                    title: 'Yielded token_ids (variable length per line)',
                    tone: 'blue',
                    width: 620,
                    padding: '10px 14px',
                    gap: 6,
                    titleFontSize: 20,
                    children: Column({
                        gap: 4,
                        children: seqLines.map((item) =>
                            Row({
                                width: '100%',
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: `${item.id}: ${item.tokens}`,
                                        fontSize: 20,
                                        mono: true,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: item.len,
                                        fontSize: 20,
                                        mono: true,
                                        fontWeight: 650,
                                        color: blue,
                                    }),
                                ],
                            }),
                        ),
                    }),
                }),
                preparePrintTypography(
                    FlowArrow({
                        c,
                        direction: 'down',
                        length: 34,
                        label: 'pad_batch(pad_id=0, max_len=5)',
                        tone: 'blue',
                    }),
                    20,
                ),
                Row({
                    gap: 16,
                    align: 'start',
                    justify: 'center',
                    children: [
                        Column({
                            gap: 6,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Token IDs [4 × 5]',
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: blue,
                                }),
                                Matrix({
                                    c,
                                    data: TOKEN_IDS,
                                    rowLabels: ['s0', 's1', 's2', 's3'],
                                    colLabels: ['t0', 't1', 't2', 't3', 't4'],
                                    cellWidth: 48,
                                    cellHeight: 36,
                                    rowLabelWidth: 36,
                                    fontSize: 21,
                                    format: 'integer',
                                    colorize: true,
                                    colorScale: 'strength',
                                    colorDomain: [0, 95],
                                    ariaLabel: 'Padded 4 by 5 token ID matrix',
                                }),
                            ],
                        }),
                        Column({
                            gap: 6,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Attention Mask [4 × 5]',
                                    fontSize: 21,
                                    fontWeight: 700,
                                    color: green,
                                }),
                                Matrix({
                                    c,
                                    data: ATTENTION_MASK,
                                    rowLabels: ['s0', 's1', 's2', 's3'],
                                    colLabels: ['t0', 't1', 't2', 't3', 't4'],
                                    cellWidth: 48,
                                    cellHeight: 36,
                                    rowLabelWidth: 36,
                                    fontSize: 21,
                                    format: 'integer',
                                    colorize: true,
                                    colorScale: 'strength',
                                    colorDomain: [0, 1],
                                    ariaLabel: 'Binary 4 by 5 attention mask matrix',
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
