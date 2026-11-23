import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
import { chars, train } from './next_char_run'

export const width = 816
export const height = 608
export const alt =
    'A heat map of the next-character probabilities learned by the small model at its best checkpoint. Rows are the current character and columns the next character. A few cells stand out: after q, 81 percent of the probability goes to u. After t, 70 percent goes to h. After a period, 81 percent goes to a space. Characters that appear only in the validation text keep flat, nearly uniform rows, because training never gave the model anything to learn from them.'

const display = (ch: string) => (ch === ' ' ? '␣' : ch)

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const { best } = train()
    const size = 23
    const left = 52
    const top = 110

    fig.text(16, 22, `Best checkpoint · step ${best.step}`, { size: 28, weight: 700 })
    fig.text(16, 62, 'Next character', { size: 24, color: c.textSecondary })
    fig.arrow(204, 62, 246, 62, { color: c.textSecondary, width: 2, head: 8 })

    chars.forEach((ch, k) =>
        fig.text(left + k * size + size / 2, top - 16, display(ch), {
            size: 24,
            align: 'center',
            mono: true,
            color: c.textSecondary,
            width: size,
        }),
    )
    chars.forEach((ch, r) => {
        fig.text(left - 10, top + r * size + size / 2, display(ch), {
            size: 24,
            align: 'right',
            mono: true,
            color: c.textSecondary,
            width: 30,
        })
        chars.forEach((_, k) => {
            const p = best.table[r]![k]!
            fig.rect(left + k * size, top + r * size, size, size, {
                fill: tint(blue, c.bg, Math.pow(p, 0.6)),
                stroke: c.bg,
                strokeWidth: 0.75,
            })
        })
    })
    const row = (ch: string) => best.table[chars.indexOf(ch)]!
    const prob = (a: string, b: string) => row(a)[chars.indexOf(b)]!
    const box = (a: string, b: string) => {
        const r = chars.indexOf(a)
        const k = chars.indexOf(b)
        fig.rect(left + k * size, top + r * size, size, size, { stroke: warm, strokeWidth: 2.2 })
    }
    box('q', 'u')
    box('t', 'h')
    box('.', ' ')

    const px = left + chars.length * size + 24
    fig.text(px, 126, 'Rows: current char', { size: 24, color: c.textSecondary })
    fig.text(px, 160, theme === 'dark' ? 'Brighter blue: higher P' : 'Darker blue: higher P', {
        size: 24,
        color: c.textSecondary,
    })

    const facts: [string, string][] = [
        ['q → u', prob('q', 'u').toFixed(2)],
        ['t → h', prob('t', 'h').toFixed(2)],
        ['. → ␣', prob('.', ' ').toFixed(2)],
    ]
    facts.forEach(([pair, value], i) => {
        const y = 224 + i * 74
        fig.text(px, y, pair, { size: 24, color: warm, weight: 700 })
        fig.text(px + 120, y, value, { size: 26, weight: 700 })
    })

    const unseen = [
        ...new Set('the driver held the lock. the worker left the pool. the user read the docs. '),
    ].filter(
        (ch) =>
            !'the queue held the request. the request left the queue. the reply reached the user. the user read the reply. '.includes(
                ch,
            ),
    )
    fig.text(px, 466, 'Unseen (uniform):', { size: 24, color: c.textSecondary })
    fig.text(px, 504, unseen.join(' '), { size: 24, color: c.textPrimary, mono: true })
    fig.text(px, 558, '␣ denotes a space', { size: 24, color: c.textSecondary })
    return fig.render()
}
