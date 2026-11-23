import {
    Column,
    DataTable,
    FlowArrow,
    ProgressList,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'A 0-to-1 cosine scale ranks a matching RoPE rotation positive at 0.91, an absolute-position hard negative at 0.42, and an NF4 quantization easy negative at 0.11. Positive gaps are 0.49 and 0.80. At fixed temperature tau, the higher-scoring negative carries larger softmax probability P_j and stronger score gradient P_j divided by tau.'

export const width = 640
export const height = 660

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)

    return Scene({
        c,
        title: 'Harder negatives carry stronger gradient pressure',
        subtitle: 'Cosine similarity and score gaps for one transformer query at fixed temperature',
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
                    text: 'Query: "How does RoPE encode token position?"',
                    width: 600,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Column({
                    width: 580,
                    align: 'stretch',
                    children: [
                        ProgressList({
                            c,
                            labelWidth: 190,
                            valueWidth: 75,
                            barHeight: 28,
                            fontSize: 20,
                            gap: 12,
                            rows: [
                                {
                                    label: 'RoPE guide (pos)',
                                    value: 0.91,
                                    valueLabel: '0.91',
                                    tone: 'green',
                                },
                                {
                                    label: 'Abs pos (hard)',
                                    value: 0.42,
                                    valueLabel: '0.42',
                                    tone: 'warm',
                                },
                                {
                                    label: 'NF4 pack (easy)',
                                    value: 0.11,
                                    valueLabel: '0.11',
                                    tone: 'blue',
                                },
                            ],
                        }),
                    ],
                }),
                FlowArrow({ c, direction: 'down', tone: 'purple', length: 22 }),
                DataTable({
                    c,
                    rows: [
                        ['candidate pair', 'cosine gap', 'gradient P_j / τ'],
                        ['Abs pos (hard)', '0.91 − 0.42 = 0.49', 'larger share'],
                        ['NF4 pack (easy)', '0.91 − 0.11 = 0.80', 'near zero'],
                    ],
                    firstColWidth: 195,
                    cellWidth: 205,
                    cellHeight: 46,
                    gap: 6,
                    fontSize: 19,
                    headerRows: 1,
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'At fixed τ, higher negative similarity concentrates softmax mass and gradient.',
                    width: 600,
                    fontSize: 20,
                    fontWeight: 750,
                    align: 'center',
                    color: purple,
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'Cosine similarity on [0, 1]; parameter updates also depend on encoder Jacobians.',
                    width: 600,
                    fontSize: 19,
                    fontWeight: 600,
                    align: 'center',
                    color: c.textSecondary,
                }),
            ],
        }),
    })
}

export default create()
