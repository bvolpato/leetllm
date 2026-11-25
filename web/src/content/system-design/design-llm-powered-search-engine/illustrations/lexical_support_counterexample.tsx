import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 390
export const alt =
    'Token-level comparison showing why lexical containment fails claim verification. The claim "Security approval is required" contains 4 terms. Left: the negated source "Security approval is not required" matches all 4 claim tokens (4/4 lexical pass, false positive) while the highlighted token "not" flips meaning to NLI contradiction. Right: the valid paraphrase "Authorization from the security team is mandatory" matches only 2 of 4 tokens (lexical fail, false negative) yet achieves NLI entailment.'

interface Chip {
    text: string
    kind: 'match' | 'flip' | 'other'
    w: number
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    const fill = (color: string, amt = 0.14) => tint(color, c.bg, amt)

    // Top: Claim token chips
    fig.text(420, 24, 'Claim to Verify (4 terms)', {
        size: 13.5,
        color: blue,
        align: 'center',
        weight: 700,
    })
    const claimTokens = [
        { t: 'Security', w: 86 },
        { t: 'approval', w: 88 },
        { t: 'is', w: 42 },
        { t: 'required', w: 86 },
    ]
    const totalClaimW = claimTokens.reduce((s, x) => s + x.w, 0) + (claimTokens.length - 1) * 10
    let cx = 420 - totalClaimW / 2
    for (const tok of claimTokens) {
        fig.rect(cx, 44, tok.w, 34, {
            fill: fill(blue, 0.18),
            stroke: blue,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(cx + tok.w / 2, 61, tok.t, {
            size: 13.5,
            color: c.textPrimary,
            align: 'center',
            weight: 700,
        })
        cx += tok.w + 10
    }

    // Branch arrows from Claim to Left and Right counterexamples
    fig.arrow(340, 82, 220, 120, { color: red, width: 1.5, head: 6 })
    fig.arrow(500, 82, 620, 120, { color: warm, width: 1.5, head: 6 })

    // Center divider
    fig.line(420, 118, 420, 368, { color: c.borderSubtle, width: 1 })

    const drawChips = (startX: number, y: number, chips: Chip[]) => {
        let x = startX
        for (const ch of chips) {
            const stroke = ch.kind === 'match' ? blue : ch.kind === 'flip' ? red : c.border
            const bg =
                ch.kind === 'match'
                    ? fill(blue, 0.16)
                    : ch.kind === 'flip'
                      ? fill(red, 0.24)
                      : tint(c.textMuted, c.bg, 0.08)
            fig.rect(x, y, ch.w, 32, {
                fill: bg,
                stroke,
                strokeWidth: ch.kind === 'flip' ? 2 : 1.2,
                radius: 6,
            })
            fig.text(x + ch.w / 2, y + 16, ch.text, {
                size: 13,
                color: ch.kind === 'flip' ? red : ch.kind === 'match' ? c.textPrimary : c.textSecondary,
                align: 'center',
                weight: ch.kind === 'other' ? 500 : 700,
            })
            x += ch.w + 7
        }
    }

    // ==================== LEFT: NEGATION (FALSE POSITIVE) ====================
    fig.text(210, 134, 'Negated Source (False Positive)', {
        size: 14,
        color: red,
        align: 'center',
        weight: 700,
    })

    const negChips: Chip[] = [
        { text: 'Security', kind: 'match', w: 78 },
        { text: 'approval', kind: 'match', w: 80 },
        { text: 'is', kind: 'match', w: 36 },
        { text: 'not', kind: 'flip', w: 48 },
        { text: 'required', kind: 'match', w: 78 },
    ]
    const negW = negChips.reduce((s, x) => s + x.w, 0) + (negChips.length - 1) * 7
    const negStartX = 210 - negW / 2
    drawChips(negStartX, 158, negChips)

    // Callout pointing to "not"
    const notCenterX = negStartX + 78 + 7 + 80 + 7 + 36 + 7 + 24
    fig.callout([notCenterX, 192], [notCenterX + 18, 224], 'polarity flip', {
        color: red,
        labelColor: red,
        size: 12.5,
        weight: 700,
        bend: -0.15,
    })

    // Verdict comparison rows (Left)
    fig.rect(36, 250, 348, 44, {
        fill: fill(red, 0.12),
        stroke: red,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(50, 272, 'Lexical subset (4/4)', { size: 13, color: c.textPrimary, weight: 600 })
    fig.text(370, 272, 'PASS (wrong)', {
        size: 13,
        color: red,
        align: 'right',
        weight: 700,
    })

    fig.rect(36, 306, 348, 44, {
        fill: fill(green, 0.08),
        stroke: c.border,
        strokeWidth: 1.1,
        radius: 7,
    })
    fig.text(50, 328, 'Semantic NLI check', { size: 13, color: c.textPrimary, weight: 600 })
    fig.text(370, 328, 'CONTRADICTION', {
        size: 13,
        color: red,
        align: 'right',
        weight: 700,
    })

    // ==================== RIGHT: PARAPHRASE (FALSE NEGATIVE) ====================
    fig.text(630, 134, 'Paraphrased Source (False Negative)', {
        size: 14,
        color: warm,
        align: 'center',
        weight: 700,
    })

    const paraRow1: Chip[] = [
        { text: 'Authorization', kind: 'other', w: 112 },
        { text: 'from', kind: 'other', w: 54 },
        { text: 'the', kind: 'other', w: 46 },
        { text: 'security', kind: 'match', w: 78 },
    ]
    const p1W = paraRow1.reduce((s, x) => s + x.w, 0) + (paraRow1.length - 1) * 7
    drawChips(630 - p1W / 2, 158, paraRow1)

    const paraRow2: Chip[] = [
        { text: 'team', kind: 'other', w: 58 },
        { text: 'is', kind: 'match', w: 36 },
        { text: 'mandatory', kind: 'other', w: 96 },
    ]
    const p2W = paraRow2.reduce((s, x) => s + x.w, 0) + (paraRow2.length - 1) * 7
    drawChips(630 - p2W / 2, 198, paraRow2)

    // Verdict comparison rows (Right)
    fig.rect(456, 250, 348, 44, {
        fill: fill(warm, 0.12),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(470, 272, 'Lexical subset (2/4)', { size: 13, color: c.textPrimary, weight: 600 })
    fig.text(790, 272, 'FAIL (wrong)', {
        size: 13,
        color: warm,
        align: 'right',
        weight: 700,
    })

    fig.rect(456, 306, 348, 44, {
        fill: fill(green, 0.14),
        stroke: green,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(470, 328, 'Semantic NLI check', { size: 13, color: c.textPrimary, weight: 600 })
    fig.text(790, 328, 'ENTAILMENT', {
        size: 13,
        color: green,
        align: 'right',
        weight: 700,
    })

    return fig.render()
}

export default create()
