import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'
export { createFilm } from './_parts/sft-masking-film'

export const width = 672
export const height = 412
export const alt =
    'Eight token positions from conversation conv_102 in a row. Positions 0 to 4 are context tokens with label minus 100. Positions 5 to 7 are deny, write, and end, with those same tokens as labels. Arrows run from the logits at positions 4, 5, and 6 to the labels one position to their right. Only those three predictions enter the loss, and ignored prompt tokens stay in causal context.'

const tokens = ['<sys>', 'sql', '<user>', 'drop', '<asst>', 'deny', 'write', '<end>']
const labels = ['-100', '-100', '-100', '-100', '-100', 'deny', 'write', '<end>']
const probabilities: Record<number, string> = { 5: '0.8', 6: '0.7', 7: '0.9' }

export const layoutHeight = (L: Layout) => (L.print ? 270 : 412)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const nameW = L.print ? 74 : 92
    const colW = (L.W - nameW - 10) / tokens.length
    const colX = (i: number) => nameW + i * colW
    const tile = L.print ? 32 : 50
    const pad = 2
    const rows = L.print
        ? { bracket: 3, position: 28, input: 52, logits: 100, label: 164, prob: 204, total: 238 }
        : { bracket: 3, position: 42, input: 76, logits: 146, label: 248, prob: 306, total: 362 }
    const toneOf = (i: number): ToneName => (i >= 5 ? 'green' : i === 4 ? 'warm' : 'blue')

    k.t(colX(0), rows.bracket, colW * 5, 'Context: read, not scored', {
        tone: 'blue',
        weight: 600,
        size: L.S,
        align: 'center',
    })
    k.t(colX(5), rows.bracket, colW * 3, 'Scored', {
        tone: 'green',
        weight: 600,
        size: L.S,
        align: 'center',
    })
    k.line(colX(0) + pad, rows.position - 4, colX(5) - pad, rows.position - 4, {
        stroke: k.ink('blue'),
        strokeWidth: 2,
    })
    k.line(colX(5) + pad, rows.position - 4, colX(8) - pad, rows.position - 4, {
        stroke: k.ink('green'),
        strokeWidth: 2,
    })

    k.mid(4, rows.position, nameW, L.S * 1.4, 'Position', { size: L.S, color: c.textSecondary })
    k.mid(4, rows.input, nameW, tile, 'Input', { size: L.S, weight: 600 })
    k.mid(4, rows.logits, nameW, tile * 0.7, 'Logits', { size: L.S, weight: 600 })
    k.mid(4, rows.label, nameW, tile, 'Label', { size: L.S, weight: 600 })

    tokens.forEach((token, i) => {
        const x = colX(i)
        const tone = toneOf(i)
        k.t(x, rows.position, colW, String(i), {
            align: 'center',
            size: L.S,
            color: c.textSecondary,
        })
        k.rect(x + pad, rows.input, colW - pad * 2, tile, {
            fill: k.tint(tone),
            stroke: k.ink(tone),
        })
        k.mid(x, rows.input, colW, tile, token, { align: 'center', size: L.S })

        const scored = i >= 4 && i <= 6
        const dotY = rows.logits + tile * 0.35
        if (i < 7)
            k.line(x + colW / 2, rows.input + tile + 1, x + colW / 2, dotY - 6, { opacity: 0.6 })
        if (i < 7)
            k.dot(x + colW / 2, dotY, scored ? (L.print ? 6 : 8) : 3, {
                fill: scored ? k.ink('purple') : c.textMuted,
            })

        const target = i >= 5
        k.rect(
            x + pad,
            rows.label,
            colW - pad * 2,
            tile,
            target
                ? { fill: k.tint('green', 0.3), stroke: k.ink('green'), strokeWidth: 1.75 }
                : { stroke: c.border },
        )
        k.mid(x, rows.label, colW, tile, labels[i], {
            align: 'center',
            size: L.S,
            color: target ? c.textPrimary : c.textMuted,
            weight: target ? 600 : 400,
        })
    })
    // Each arrow crosses one column: the shift that defines next-token training.
    ;[4, 5, 6].forEach((i) => {
        const x1 = colX(i) + colW / 2
        const y1 = rows.logits + tile * 0.35
        k.arrow(x1 + 5, y1 + 7, colX(i + 1) + colW / 2, rows.label - 2, {
            stroke: k.ink('purple'),
            strokeWidth: 2,
        })
    })
    if (L.print) {
        k.mid(4, rows.prob, nameW + 30, L.S * 1.4, 'p(label)', {
            size: L.S,
            color: c.textSecondary,
        })
        ;[5, 6, 7].forEach((i) =>
            k.t(colX(i), rows.prob, colW, probabilities[i], {
                align: 'center',
                size: L.S,
                tone: 'green',
            }),
        )
        k.t(colX(3), rows.total, colX(8) - colX(3), 'mean of -log p over 3 scored tokens = 0.228', {
            align: 'right',
            size: L.S,
            weight: 600,
        })
    } else {
        k.t(4, rows.prob, L.W - 8, 'Each scored label is predicted one position earlier.', {
            size: L.S,
            color: c.textSecondary,
        })
        k.t(
            4,
            rows.prob + 30,
            L.W - 8,
            'Labels of -100 leave the loss. Their tokens stay in context.',
            { size: L.S, color: c.textSecondary },
        )
    }
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
