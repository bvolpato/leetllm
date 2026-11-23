import {
    Arrow,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'In "She saw the bank by the river", the forward pass reads She, saw, the, bank while the backward pass reads river, the, by, bank. At bank, a task-specific softmax mix weights character-CNN state h0 and bidirectional LSTM states h1 and h2, then scales by gamma.'

export const width = 660
export const height = 560

const illustration = defineIllustration((c) => {
    const word = (text: string, tone: 'purple' | 'cyan' | 'green', w: number) =>
        TextLabel({
            c,
            text,
            width: w,
            align: 'center',
            color: getReadableToneColor(tone, c),
            fontSize: 25,
            fontWeight: 700,
        })

    return Scene({
        c,
        background: 'transparent',
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
                    text: 'Forward and backward LSTMs converge at "bank"',
                    fontSize: 27,
                    fontWeight: 750,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Forward context: left prefix -> target',
                    fontSize: 22,
                    color: getReadableToneColor('purple', c),
                    align: 'center',
                }),
                Row({
                    gap: 8,
                    justify: 'center',
                    align: 'center',
                    children: [
                        word('She', 'purple', 68),
                        Arrow({ c, direction: 'right', length: 24, color: c.primary }),
                        word('saw', 'purple', 68),
                        Arrow({ c, direction: 'right', length: 24, color: c.primary }),
                        word('the', 'purple', 68),
                        Arrow({ c, direction: 'right', length: 24, color: c.primary }),
                        word('bank', 'green', 86),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Backward context: right suffix -> target',
                    fontSize: 22,
                    color: getReadableToneColor('cyan', c),
                    align: 'center',
                }),
                Row({
                    gap: 8,
                    justify: 'center',
                    align: 'center',
                    children: [
                        word('river', 'cyan', 76),
                        Arrow({ c, direction: 'right', length: 24, color: c.secondary }),
                        word('the', 'cyan', 68),
                        Arrow({ c, direction: 'right', length: 24, color: c.secondary }),
                        word('by', 'cyan', 60),
                        Arrow({ c, direction: 'right', length: 24, color: c.secondary }),
                        word('bank', 'green', 86),
                    ],
                }),
                Row({
                    gap: 10,
                    justify: 'center',
                    align: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'h0 · char CNN',
                            titleFontSize: 21,
                            tone: 'warm',
                            width: 196,
                            padding: 8,
                            children: TextLabel({
                                c,
                                text: 'spelling features',
                                fontSize: 20,
                                align: 'center',
                            }),
                        }),
                        Panel({
                            c,
                            title: 'h1 · BiLSTM 1',
                            titleFontSize: 21,
                            tone: 'purple',
                            width: 196,
                            padding: 8,
                            children: TextLabel({
                                c,
                                text: 'local syntax',
                                fontSize: 20,
                                align: 'center',
                            }),
                        }),
                        Panel({
                            c,
                            title: 'h2 · BiLSTM 2',
                            titleFontSize: 21,
                            tone: 'cyan',
                            width: 196,
                            padding: 8,
                            children: TextLabel({
                                c,
                                text: 'phrase sense',
                                fontSize: 20,
                                align: 'center',
                            }),
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'ELMo_k = γ Σ_{j=0}^{2} s_j h_{k,j}   (s₀ + s₁ + s₂ = 1)',
                    fontSize: 25,
                    fontWeight: 750,
                    align: 'center',
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'Task-specific softmax weights mix all three layers at every position.',
                    fontSize: 21,
                    color: c.textSecondary,
                    align: 'center',
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
