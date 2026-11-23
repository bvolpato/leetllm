import type { ThemeMode } from 'vizmatic'
import { mapNumberLine } from 'vizmatic'
import { makeKit, type Layout } from './_kit'

export const width = 700
export const height = 560
export const alt =
    'At weight one, one target-zero token contributes gradient plus two, while three target-two tokens each contribute minus two. Their batch sums are plus two and minus six. Averaging the two batch means gives zero; dividing the combined sum by all four valid tokens gives minus one. Both final gradients use the same signed axis. In AMP, one scale is held through the window and one optimizer step follows accumulation.'

export const accumulationFixture = {
    weight: 1,
    targets: [[0], [2, 2, 2]],
    batchSums: [2, -6],
    totalTokens: 4,
    wrongGradient: 0,
    correctGradient: -1,
}

export const projectAccumulatedGradient = (gradient: number) =>
    mapNumberLine(gradient, -2, 2, width, 120)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const ax0 = projectAccumulatedGradient(-2)
    const ax1 = projectAccumulatedGradient(2)
    const xZero = projectAccumulatedGradient(0)
    const xCorrect = projectAccumulatedGradient(-1)

    k.t(14, 4, L.W - 28, 'Four tokens, one denominator', {
        size: 26,
        weight: 700,
    })
    k.tex(14, 38, String.raw`\ell=(w-y)^2,\quad w=1,\quad g=2(w-y)`, {
        size: 21,
        color: c.textSecondary,
    })

    k.t(14, 82, 220, 'Batch A · 1 token', {
        size: L.S,
        weight: 700,
        tone: 'blue',
    })
    k.t(252, 82, 434, 'Batch B · 3 tokens', {
        size: L.S,
        weight: 700,
        tone: 'purple',
    })

    const tokens = [
        { x: 14, target: 'y=0', grad: '+2', tone: 'blue' as const },
        { x: 252, target: 'y=2', grad: '−2', tone: 'purple' as const },
        { x: 398, target: 'y=2', grad: '−2', tone: 'purple' as const },
        { x: 544, target: 'y=2', grad: '−2', tone: 'purple' as const },
    ]
    tokens.forEach((tok) => {
        k.rect(tok.x, 114, 134, 48, {
            fill: k.tint(tok.tone, 0.14),
            stroke: k.ink(tok.tone),
            strokeWidth: 1.75,
        })
        k.mid(tok.x, 114, 68, 48, tok.target, {
            size: L.S,
            mono: true,
            align: 'center',
            tone: tok.tone,
        })
        k.mid(tok.x + 64, 114, 64, 48, tok.grad, {
            size: L.S,
            mono: true,
            align: 'center',
            weight: 700,
            tone: tok.tone,
        })
    })

    k.arrow(81, 162, 81, 180, { stroke: k.ink('blue'), strokeWidth: 2, size: 5 })
    k.line(319, 162, 611, 162, { stroke: k.ink('purple'), strokeWidth: 1.75 })
    ;[319, 465, 611].forEach((x) =>
        k.line(x, 154, x, 162, { stroke: k.ink('purple'), strokeWidth: 1.75 }),
    )
    k.arrow(465, 162, 465, 180, {
        stroke: k.ink('purple'),
        strokeWidth: 2,
        size: 5,
    })

    k.rect(14, 184, 210, 42, {
        fill: k.tint('blue', 0.12),
        stroke: k.ink('blue'),
        strokeWidth: 1.75,
    })
    k.mid(14, 184, 210, 42, 'Σg = +2', {
        size: L.S,
        mono: true,
        weight: 700,
        align: 'center',
        tone: 'blue',
    })
    k.rect(252, 184, 434, 42, {
        fill: k.tint('purple', 0.12),
        stroke: k.ink('purple'),
        strokeWidth: 1.75,
    })
    k.mid(252, 184, 434, 42, 'Σg = −6', {
        size: L.S,
        mono: true,
        weight: 700,
        align: 'center',
        tone: 'purple',
    })

    k.rect(14, 244, L.W - 28, 120, {
        fill: k.tint('critical', 0.06),
        stroke: k.ink('critical'),
        rx: 4,
    })
    k.t(28, 254, 420, 'Average two batch means (wrong)', {
        size: L.S,
        weight: 700,
        tone: 'critical',
    })
    k.tex(440, 250, String.raw`\tfrac{1}{2}\left(\tfrac{+2}{1}+\tfrac{-6}{3}\right)=0`, {
        size: 20,
        color: c.textPrimary,
    })
    k.line(ax0, 326, ax1, 326, { stroke: c.textMuted, strokeWidth: 2 })
    k.line(xZero, 314, xZero, 338, { stroke: c.textMuted, strokeWidth: 2 })
    k.dot(xZero, 326, 7, {
        fill: k.ink('critical'),
        stroke: c.bg,
        strokeWidth: 2,
    })
    k.t(xZero - 24, 290, 48, '0', {
        size: 22,
        mono: true,
        align: 'center',
        weight: 700,
        tone: 'critical',
    })

    k.rect(14, 378, L.W - 28, 134, {
        fill: k.tint('green', 0.06),
        stroke: k.ink('green'),
        rx: 4,
    })
    k.t(28, 388, 430, 'Divide all 4 valid tokens (right)', {
        size: L.S,
        weight: 700,
        tone: 'green',
    })
    k.tex(460, 384, String.raw`\tfrac{+2-6}{4}=-1`, {
        size: 20,
        color: c.textPrimary,
    })
    k.rect(xCorrect, 444, xZero - xCorrect, 22, {
        fill: k.tint('green', 0.2),
        rx: 0,
    })
    k.line(ax0, 455, ax1, 455, { stroke: c.textMuted, strokeWidth: 2 })
    k.line(xZero, 443, xZero, 467, { stroke: c.textMuted, strokeWidth: 2 })
    k.arrow(xZero, 455, xCorrect, 455, {
        stroke: k.ink('green'),
        strokeWidth: 3,
        size: 6,
    })
    k.t(xCorrect - 28, 418, 56, '−1', {
        size: 22,
        mono: true,
        align: 'center',
        weight: 700,
        tone: 'green',
    })
    ;[-2, 0, 2].forEach((v) => {
        const x = projectAccumulatedGradient(v)
        k.t(x - 24, 474, 48, v > 0 ? `+${v}` : String(v).replace('-', '−'), {
            size: L.S,
            mono: true,
            align: 'center',
            color: c.textMuted,
        })
    })

    k.t(14, 524, L.W - 28, 'AMP window: hold one scale across batches, then take one step.', {
        size: L.S,
        color: c.textSecondary,
    })
    return k.frame(height)
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, { W: width, T: 24, S: 21, print: false })
}

export default create('dark')
