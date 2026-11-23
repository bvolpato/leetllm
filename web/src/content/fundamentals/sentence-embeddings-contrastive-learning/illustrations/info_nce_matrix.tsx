import {
    Column,
    DataTable,
    FlowArrow,
    Grid,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'A two-pair cosine matrix has q1-to-p1 0.90, q1-to-p2 0.20, q2-to-p1 0.15, and q2-to-p2 0.85; diagonal cells are positive pairs. For q1 at temperature 0.05, scores 0.90 and 0.20 scale to logits 18.0 and 4.0, shift to 0.0 and negative 14.0, give exponential masses 1.0 and 8.3e-7, and yield softmax probabilities 0.99999917 and 0.00000083 with loss 8.3e-7. Swapping the scores raises loss to 14 nats.'

export const width = 640
export const height = 740

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('red', c)

    return Scene({
        c,
        title: 'InfoNCE turns each similarity row into cross-entropy',
        subtitle: 'Diagonal passages are targets; off-diagonal columns compete in softmax',
        padding: 16,
        gap: 10,
        contentWidth: 608,
        align: 'center',
        children: Column({
            width: 608,
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Cosine similarity matrix · diagonal cells are positives',
                    width: 600,
                    fontSize: 21,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Grid({
                    c,
                    rows: [
                        ['q_i / p_j', 'p_1', 'p_2'],
                        ['q_1', { label: '0.90', tone: 'green' }, '0.20'],
                        ['q_2', '0.15', { label: '0.85', tone: 'green' }],
                    ],
                    cellWidth: 120,
                    cellHeight: 46,
                    gap: 6,
                    fontSize: 21,
                    math: true,
                    headerRows: 1,
                    headerCols: 1,
                }),
                FlowArrow({ c, direction: 'down', tone: 'purple', length: 18 }),
                TextLabel({
                    c,
                    text: 'Row q_1 scaled by τ = 0.05',
                    width: 600,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: purple,
                    math: true,
                }),
                DataTable({
                    c,
                    rows: [
                        ['stage', 'positive p_1', 'negative p_2'],
                        ['similarity s', '0.90', '0.20'],
                        ['logit s / τ', '18.0', '4.0'],
                        ['shift by max', '0.0', '−14.0'],
                        ['exp mass', '1.0', '8.3 × 10^{-7}'],
                        ['softmax prob', '0.99999917', '0.00000083'],
                    ],
                    firstColWidth: 175,
                    cellWidth: 185,
                    cellHeight: 42,
                    gap: 5,
                    fontSize: 20,
                    headerRows: 1,
                    headerCols: 1,
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'L_1 = −log(0.99999917) ≈ 8.3 × 10^{-7} nats',
                    width: 600,
                    fontSize: 22,
                    fontWeight: 850,
                    align: 'center',
                    color: green,
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'Swapping p_1 and p_2 gives L_1 ≈ 14.0 nats.',
                    width: 600,
                    fontSize: 20,
                    fontWeight: 700,
                    align: 'center',
                    color: red,
                    math: true,
                }),
            ],
        }),
    })
}

export default create()
