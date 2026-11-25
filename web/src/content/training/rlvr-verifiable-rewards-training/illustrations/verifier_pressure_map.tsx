import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 415
export const alt =
    'A response string containing two contradictory answer boxes (\\boxed{168} ... actually \\boxed{148}, gold = 168) is scanned by two parser rules. First-match extraction stops at the first box (168) and erroneously awards r = 1 while ignoring the contradiction. Single-box validation scans the entire response, counts 2 boxes, rejects the ambiguity, and returns r = 0. Below, a clean single-box output \\boxed{168} parses as Fraction(168) = gold and earns r = 1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const cyan = fig.tone('cyan')
    const muted = c.textSecondary

    fig.text(20, 22, 'Ambiguous completion span  (gold = 168)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const spanX = 20
    const spanY = 44
    const spanW = 496
    const spanH = 46
    fig.rect(spanX, spanY, spanW, spanH, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: c.border,
        strokeWidth: 1.3,
        radius: 7,
    })

    const box1X = spanX + 14
    const box1W = 140
    const box2X = spanX + 340
    const box2W = 140

    fig.rect(box1X, spanY + 7, box1W, 32, {
        fill: tint(green, c.bg, 0.22),
        stroke: green,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(box1X + box1W / 2, spanY + 23, '\\boxed{168}', {
        size: 15,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(spanX + 246, spanY + 23, '… actually …', {
        size: 14,
        mono: true,
        color: muted,
        align: 'center',
    })
    fig.rect(box2X, spanY + 7, box2W, 32, {
        fill: tint(red, c.bg, 0.22),
        stroke: red,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(box2X + box2W / 2, spanY + 23, '\\boxed{148}', {
        size: 15,
        mono: true,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Track 1: First-match parser
    const t1Y = 128
    fig.text(20, t1Y, '1. First-match parser', { size: 15, weight: 700, color: warm })
    fig.text(20, t1Y + 22, 'Stops at first match; ignores 148', { size: 14, color: muted })

    const scanY1 = t1Y + 46
    fig.line(spanX, scanY1, box1X + box1W, scanY1, { color: warm, width: 4 })
    fig.circle(box1X + box1W, scanY1, 5.5, { fill: warm })
    fig.line(box1X + box1W + 8, scanY1, spanX + spanW, scanY1, {
        color: c.border,
        width: 2,
        dash: '4 4',
    })
    fig.text(box2X + box2W / 2, scanY1 - 15, 'unread!', {
        size: 14,
        weight: 700,
        color: red,
        align: 'center',
    })

    fig.rect(542, t1Y + 4, 158, 52, {
        fill: tint(warm, c.bg, 0.16),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(621, t1Y + 20, 'r = 1 (hacked)', {
        size: 14,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(621, t1Y + 42, 'takes 168 only', { size: 14, color: muted, align: 'center' })

    // Track 2: Single-box validator
    const t2Y = 216
    fig.text(20, t2Y, '2. Single-box validator', { size: 15, weight: 700, color: green })
    fig.text(20, t2Y + 22, 'Scans full span → 2 boxes → rejects', { size: 14, color: muted })

    const scanY2 = t2Y + 46
    fig.line(spanX, scanY2, spanX + spanW, scanY2, { color: green, width: 4 })
    fig.circle(box1X + box1W / 2, scanY2, 5.5, { fill: green })
    fig.circle(box2X + box2W / 2, scanY2, 5.5, { fill: red })
    fig.text(box1X + box1W / 2, scanY2 + 18, 'match #1', {
        size: 14,
        mono: true,
        color: green,
        align: 'center',
    })
    fig.text(box2X + box2W / 2, scanY2 + 18, 'match #2 (conflict)', {
        size: 14,
        mono: true,
        color: red,
        align: 'center',
    })

    fig.rect(542, t2Y + 4, 158, 52, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(621, t2Y + 20, 'r = 0 (reject)', {
        size: 14,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(621, t2Y + 42, 'count = 2 ≠ 1', {
        size: 14,
        mono: true,
        color: muted,
        align: 'center',
    })

    // Divider & Clean single-box pass pipeline
    fig.line(20, 314, width - 20, 314, { color: c.borderSubtle, width: 1 })
    fig.text(20, 338, 'Clean single-box pass', { size: 15, weight: 700, color: cyan })

    const steps = [
        { x: 20, w: 136, text: '\\boxed{168}', col: cyan },
        { x: 184, w: 138, text: 'count == 1 ✓', col: cyan },
        { x: 350, w: 186, text: 'Fraction(168)=168', col: cyan },
        { x: 564, w: 136, text: 'r = 1 (valid)', col: green },
    ]
    steps.forEach((st, i) => {
        fig.rect(st.x, 358, st.w, 38, {
            fill: tint(st.col, c.bg, 0.14),
            stroke: st.col,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(st.x + st.w / 2, 377, st.text, {
            size: 14,
            mono: true,
            weight: 700,
            color: st.col,
            align: 'center',
        })
        if (i < steps.length - 1) {
            const next = steps[i + 1]!
            fig.arrow(st.x + st.w + 2, 377, next.x - 3, 377, {
                color: muted,
                width: 1.5,
                head: 6,
            })
        }
    })

    return fig.render()
}

export default create('dark')
