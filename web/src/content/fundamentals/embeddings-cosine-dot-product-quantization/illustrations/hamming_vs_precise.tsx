import { Column, FlowArrow, Grid, ProgressList, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Grid compares query q = [0.8, -0.4, 0.6, -0.2] (sign bits [1, 0, 1, 0]) against three candidates: linear-attention-draft and flash-attention-v2 tie at Hamming distance 0 even though exact cosines differ (0.410 vs 1.000), while adamw-decay has Hamming distance 2 and cosine -0.435. Below a FlowArrow, ProgressList and summary Grid show top-2 binary shortlisting plus exact rescoring recovering flash-attention-v2.'
export const width = 640
export const height = 760

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        title: 'Coarse binary Hamming search needs exact rescoring',
        subtitle: 'Query q = [0.8, −0.4, 0.6, −0.2] · sign bits [1, 0, 1, 0]',
        padding: 14,
        gap: 8,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                Grid({
                    c,
                    cellWidth: 196,
                    cellHeight: 48,
                    gap: 6,
                    fontSize: 19,
                    rows: [
                        [
                            { label: 'Passage', tone: 'neutral' },
                            { label: 'Bits · Ham(q)', tone: 'neutral' },
                            { label: 'Exact cos(q, d)', tone: 'neutral' },
                        ],
                        [
                            { label: 'linear-attn', tone: 'warm' },
                            { label: '1010 · Ham 0', tone: 'warm' },
                            { label: '0.410 (tie)', tone: 'warm' },
                        ],
                        [
                            { label: 'flash-attn-v2', tone: 'green' },
                            { label: '1010 · Ham 0', tone: 'green' },
                            { label: '1.000 (best)', tone: 'green' },
                        ],
                        [
                            { label: 'adamw-decay', tone: 'neutral' },
                            { label: '1100 · Ham 2', tone: 'neutral' },
                            { label: '−0.435 (skip)', tone: 'neutral' },
                        ],
                    ],
                }),
                FlowArrow({ c, direction: 'down', length: 24, tone: 'cyan' }),
                TextLabel({
                    c,
                    text: 'Exact cosine separates candidates tied at Hamming distance 0',
                    fontSize: 19,
                    align: 'center',
                }),
                Column({
                    gap: 6,
                    align: 'stretch',
                    width: 590,
                    children: [
                        ProgressList({
                            c,
                            labelWidth: 270,
                            valueWidth: 74,
                            barHeight: 16,
                            fontSize: 19,
                            gap: 8,
                            rows: [
                                {
                                    label: 'flash-attn-v2 (Ham = 0)',
                                    value: 1.0,
                                    valueLabel: '1.000',
                                    tone: 'green',
                                },
                                {
                                    label: 'linear-attn (Ham = 0)',
                                    value: 0.41,
                                    valueLabel: '0.410',
                                    tone: 'warm',
                                },
                            ],
                        }),
                    ],
                }),
                Grid({
                    c,
                    cellWidth: 292,
                    cellHeight: 48,
                    gap: 8,
                    fontSize: 19,
                    rows: [
                        [
                            { label: 'Binary top-1 alone', tone: 'red' },
                            { label: 'Picks 0.410 on tie', tone: 'red' },
                        ],
                        [
                            { label: 'Top-2 + float rescore', tone: 'green' },
                            { label: 'Picks 1.000 (flash-attn)', tone: 'green' },
                        ],
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
