import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 370
export const alt =
    'Horizontal prediction-time cutoff timeline at 09:00 UTC on July 1. Three features readable before 09:00 (prompt_tokens at 08:55, prior_flags_90d at 08:59, and ambiguity_score at 08:59:12) enter the inference vector. Three post-decision fields (fallback_triggered_at at 10:22, human_edit_sec at 11:05, and delayed label review on July 15) arrive after 09:00 and are blocked from model inputs.'

interface EventItem {
    x: number
    time: string
    name: string
    side: 'above' | 'below'
    tier: number
    allowed: boolean
}

const EVENTS: readonly EventItem[] = [
    { x: 92, time: '08:55', name: 'prompt_tokens', side: 'above', tier: 0, allowed: true },
    { x: 218, time: '08:59', name: 'prior_flags_90d', side: 'below', tier: 0, allowed: true },
    { x: 325, time: '08:59:12', name: 'ambiguity_score', side: 'above', tier: 1, allowed: true },
    {
        x: 535,
        time: '10:22',
        name: 'fallback_triggered_at',
        side: 'above',
        tier: 0,
        allowed: false,
    },
    { x: 638, time: '11:05', name: 'human_edit_sec', side: 'below', tier: 0, allowed: false },
    { x: 778, time: 'Jul 15', name: 'delayed label review', side: 'above', tier: 0, allowed: false },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')
    const isLight = theme === 'light'

    const cutoffX = 432
    const axisY = 192
    const leftX = 36
    const rightX = 824

    // Subtle shaded zones before and after prediction cutoff
    fig.rect(leftX, 58, cutoffX - leftX, 256, {
        fill: tint(green, c.bg, isLight ? 0.08 : 0.11),
        radius: 8,
    })
    fig.rect(cutoffX, 58, rightX - cutoffX, 256, {
        fill: tint(red, c.bg, isLight ? 0.07 : 0.1),
        radius: 8,
    })

    // Zone headers
    fig.text(leftX + 14, 34, 'Readable <= 09:00 UTC  ·  Allowed inputs', {
        size: 14,
        weight: 600,
        color: green,
    })
    fig.text(rightX - 14, 34, 'Logged > 09:00 UTC  ·  Blocked (post-decision)', {
        size: 14,
        weight: 600,
        color: red,
        align: 'right',
    })

    // Horizontal timeline axis with a scale break before Jul 15
    const breakX = 706
    fig.line(leftX + 12, axisY, breakX - 12, axisY, { color: c.textMuted, width: 2 })
    fig.line(breakX + 12, axisY, rightX - 14, axisY, { color: c.textMuted, width: 2 })
    // Scale break slashes //
    fig.line(breakX - 8, axisY + 9, breakX - 2, axisY - 9, { color: c.textMuted, width: 1.5 })
    fig.line(breakX + 2, axisY + 9, breakX + 8, axisY - 9, { color: c.textMuted, width: 1.5 })
    fig.text(breakX, axisY + 24, '14 days', {
        size: 11,
        color: c.textMuted,
        align: 'center',
        mono: true,
    })

    // Vertical decision cutoff barrier at 09:00 UTC
    fig.line(cutoffX, 52, cutoffX, 322, { color: blue, width: 2.5, dash: '6 4' })
    fig.circle(cutoffX, axisY, 8, { fill: blue, stroke: c.bg, width: 2.5 })
    fig.text(cutoffX, 338, '09:00:00 UTC', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })
    fig.text(cutoffX, 356, 'Prediction cutoff (score p >= 0.50)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Flow arrow from allowed features into cutoff, and blocked cap on right
    fig.arrow(364, axisY, cutoffX - 12, axisY, { color: green, width: 2.5, head: 7 })
    fig.line(cutoffX + 14, axisY - 9, cutoffX + 14, axisY + 9, { color: red, width: 2.5 })
    fig.line(cutoffX + 14, axisY, cutoffX + 42, axisY, {
        color: red,
        width: 1.8,
        dash: '3 4',
    })

    // Render event stems, markers, and staggered crisp labels
    for (const ev of EVENTS) {
        const tone = ev.allowed ? green : red
        const stemLen = ev.tier === 1 ? 82 : 44
        const yEnd = ev.side === 'above' ? axisY - stemLen : axisY + stemLen

        fig.line(ev.x, axisY, ev.x, yEnd, { color: tone, width: 1.75 })
        fig.circle(ev.x, axisY, 5.5, { fill: tone, stroke: c.bg, width: 1.75 })

        const nameY = ev.side === 'above' ? yEnd - 24 : yEnd + 14
        const timeY = ev.side === 'above' ? yEnd - 8 : yEnd + 30
        const align: 'left' | 'center' | 'right' =
            ev.x < 130 ? 'left' : ev.x > 740 ? 'right' : 'center'
        const tx = align === 'left' ? ev.x - 10 : align === 'right' ? ev.x + 10 : ev.x

        fig.text(tx, nameY, ev.name, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align,
            mono: ev.name !== 'delayed label review',
        })
        fig.text(tx, timeY, ev.time, {
            size: 12,
            weight: 500,
            color: tone,
            align,
            mono: true,
        })
    }

    // Bottom status summary tags (terse, no prose)
    fig.text(leftX + 14, 296, 'Enter inference vector x', {
        size: 12,
        weight: 600,
        color: green,
    })
    fig.text(rightX - 14, 296, 'Label or downstream outcome only', {
        size: 12,
        weight: 600,
        color: red,
        align: 'right',
    })

    return fig.render()
}

export default create
