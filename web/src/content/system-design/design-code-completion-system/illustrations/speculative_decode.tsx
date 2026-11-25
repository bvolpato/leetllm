import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 390
export const alt =
    'Speculative decoding pipeline showing five draft tokens (graph, dot, allows, open paren, user) proposed sequentially by a small draft model, verified in one parallel target forward pass that accepts the first four, rejects user, and resamples request from the residual distribution, yielding five target-exact tokens in two compute passes.'

export const numericAnchors = {
    draftTokens: ['graph', '.', 'allows', '(', 'user'],
    verifiedTokens: ['graph', '.', 'allows', '(', 'request'],
    acceptedCount: 4,
    rejectedIndex: 4,
    correction: 'request',
    emittedTotal: 5,
    draftCost: 1,
    verifyCost: 1,
    speedup: 2.5,
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')

    const draftTokens = numericAnchors.draftTokens
    const emittedTokens = numericAnchors.verifiedTokens

    const startX = 148
    const boxW = 114
    const gap = 22
    const stepX = boxW + gap

    // Row 1: Draft q(x)
    const yDraft = 42
    fig.text(24, yDraft + 15, '1. Draft q(x)', { size: 14, weight: 700, color: blue })
    fig.text(24, yDraft + 35, 'Sequential K = 5', { size: 12, color: c.textSecondary })

    draftTokens.forEach((tok, i) => {
        const bx = startX + i * stepX
        const isRej = i === 4
        const tone = isRej ? red : blue
        fig.rect(bx, yDraft, boxW, 50, {
            fill: tint(tone, c.bg, 0.12),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 8,
        })
        fig.text(bx + boxW / 2, yDraft + 14, `k = ${i + 1}`, {
            size: 11,
            color: c.textMuted,
            align: 'center',
            mono: true,
        })
        fig.text(bx + boxW / 2, yDraft + 34, tok, {
            size: 16,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
        // Sequential draft arrow between draft tokens
        if (i < 4) {
            fig.arrow(bx + boxW + 2, yDraft + 25, bx + stepX - 2, yDraft + 25, {
                color: c.border,
                width: 1.4,
                head: 5,
            })
        }
        // Parallel downward verify arrow
        fig.arrow(bx + boxW / 2, yDraft + 50, bx + boxW / 2, 146, {
            color: tone,
            width: 1.5,
            head: 6,
        })
    })

    // Horizontal parallel-pass bar behind Row 2
    const yVerify = 148
    fig.rect(startX - 10, yVerify - 12, stepX * 4 + boxW + 20, 74, {
        fill: tint(green, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1.2,
        radius: 10,
    })

    fig.text(24, yVerify + 15, '2. Target p(x)', { size: 14, weight: 700, color: green })
    fig.text(24, yVerify + 35, '1 parallel pass', { size: 12, color: c.textSecondary })

    draftTokens.forEach((_, i) => {
        const bx = startX + i * stepX
        const isRej = i === 4
        const tone = isRej ? red : green
        fig.rect(bx, yVerify, boxW, 50, {
            fill: tint(tone, c.bg, 0.15),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(bx + boxW / 2, yVerify + 17, isRej ? 'REJECT' : 'ACCEPT', {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
        })
        fig.text(bx + boxW / 2, yVerify + 36, isRej ? 'resample p′' : 'p(x) / q(x)', {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: !isRej,
        })

        // Arrow down to emitted row
        fig.arrow(bx + boxW / 2, yVerify + 50, bx + boxW / 2, 248, {
            color: isRej ? purple : green,
            width: 1.5,
            head: 6,
        })
    })

    // Row 3: Emitted tokens (exact from p)
    const yEmit = 250
    fig.text(24, yEmit + 15, '3. Emitted', { size: 14, weight: 700, color: purple })
    fig.text(24, yEmit + 35, 'Exact from p(x)', { size: 12, color: c.textSecondary })

    emittedTokens.forEach((tok, i) => {
        const bx = startX + i * stepX
        const isCorr = i === 4
        const tone = isCorr ? purple : green
        fig.rect(bx, yEmit, boxW, 52, {
            fill: tint(tone, c.bg, 0.15),
            stroke: tone,
            strokeWidth: isCorr ? 1.8 : 1.5,
            radius: 8,
        })
        fig.text(bx + boxW / 2, yEmit + 20, tok, {
            size: 16,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
        fig.text(bx + boxW / 2, yEmit + 39, isCorr ? 'resampled' : 'accepted', {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
    })

    // Bottom hairline summary metrics (frameless, crisp)
    fig.line(24, 326, 816, 326, { color: c.borderSubtle, width: 1.2 })
    fig.text(160, 346, 'Passes', { size: 12, color: c.textMuted, align: 'center' })
    fig.text(160, 366, '1 draft + 1 verify = 2', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    fig.text(430, 346, 'Tokens committed', { size: 12, color: c.textMuted, align: 'center' })
    fig.text(430, 366, '4 accepted + 1 resampled = 5', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    fig.text(700, 346, 'Effective yield', { size: 12, color: c.textMuted, align: 'center' })
    fig.text(700, 366, '2.5x tokens / pass', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create('dark')
