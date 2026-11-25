import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 425
export const alt =
    'Atomic quota admission race and idempotent replay rules against a 1,000-unit tenant budget. Top: two concurrent contenders each request 700 units; an atomic lock admits Contender 1 (700 held, 300 remaining) and rejects Contender 2 because 300 available is less than 700. Bottom: replaying key (A, r1) with the matching fingerprint returns the existing 700-unit hold with zero extra charge, while reusing the key with an altered fingerprint raises a conflict and leaves the balance unchanged.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const soft = (hex: string, la = 0.09, da = 0.15) => tint(hex, c.bg, theme === 'light' ? la : da)
    const rim = (hex: string) => tint(hex, c.bg, theme === 'light' ? 0.45 : 0.55)
    const onWarm = getReadableTextColor(warm, c, c.bg)

    // Section 1: Concurrent Race
    fig.text(24, 24, '1. CONCURRENT ADMISSION RACE (LIMIT = 1,000)', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 380,
    })

    // Left contenders
    const contenders = [
        { y: 50, title: 'Contender 1', sub: 'Req: 700 units', color: blue },
        { y: 126, title: 'Contender 2', sub: 'Req: 700 units', color: warm },
    ]
    for (const item of contenders) {
        fig.rect(24, item.y, 148, 58, {
            fill: soft(item.color),
            stroke: rim(item.color),
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(98, item.y + 20, item.title, {
            size: 14,
            color: item.color,
            align: 'center',
            weight: 700,
            width: 136,
        })
        fig.text(98, item.y + 40, item.sub, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            width: 136,
        })
    }

    // Converging arrows into Atomic Lock
    fig.arrow(172, 79, 248, 108, { color: blue, width: 1.8, head: 6 })
    fig.arrow(172, 155, 248, 128, { color: warm, width: 1.8, head: 6 })

    // Center Atomic Lock with visual 700 / 300 quota bar
    fig.rect(250, 56, 232, 124, {
        fill: soft(blue, 0.06, 0.1),
        stroke: c.border,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(366, 76, 'Atomic Lock / Serializable Tx', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
        width: 218,
    })
    fig.text(366, 96, 'Check & commit 1,000-unit pool', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 218,
    })
    // Proportional bar inside gate (200px total: 140px held + 60px free)
    fig.rect(266, 114, 140, 26, { fill: warm, radius: 4 })
    fig.text(336, 127, '700 held', {
        size: 12,
        color: onWarm,
        align: 'center',
        weight: 700,
        mono: true,
        width: 130,
    })
    fig.rect(408, 114, 58, 26, {
        fill: soft(green, 0.16, 0.22),
        stroke: green,
        strokeWidth: 1.2,
        radius: 4,
    })
    fig.text(437, 127, '300', {
        size: 12,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
        width: 50,
    })
    fig.text(366, 158, '2nd request needs 700 > 300 free', {
        size: 12,
        color: red,
        align: 'center',
        weight: 600,
        width: 218,
    })

    // Outcomes on right
    fig.arrow(482, 92, 548, 79, { color: green, width: 1.8, head: 6 })
    fig.arrow(482, 144, 548, 155, { color: red, width: 1.8, head: 6 })

    fig.rect(550, 50, 246, 58, {
        fill: soft(green),
        stroke: green,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(673, 69, 'Granted · Hold Committed', {
        size: 14,
        color: green,
        align: 'center',
        weight: 700,
        width: 232,
    })
    fig.text(673, 90, '700 held · 300 available', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: 232,
    })

    fig.rect(550, 126, 246, 58, {
        fill: soft(red),
        stroke: red,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(673, 145, 'Rejected · Quota Exceeded', {
        size: 14,
        color: red,
        align: 'center',
        weight: 700,
        width: 232,
    })
    fig.text(673, 166, '0 deducted · balance = 300', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: 232,
    })

    // Subtle horizontal separator
    fig.line(24, 214, 796, 214, { color: c.borderSubtle, width: 1, dash: '5 4' })

    // Section 2: Idempotent Key Replay
    fig.text(24, 238, '2. IDEMPOTENCY KEY REPLAY ON (TENANT = A, ID = r1)', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 440,
    })

    // Stored key record on left
    fig.rect(24, 272, 224, 114, {
        fill: soft(blue),
        stroke: rim(blue),
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(136, 294, 'Stored Reservation', {
        size: 14,
        color: blue,
        align: 'center',
        weight: 700,
        width: 206,
    })
    fig.text(136, 320, 'key: ("A", "r1")', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: 206,
    })
    fig.text(136, 342, 'spec: fp_v1 (700 held)', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: 206,
    })
    fig.text(136, 366, 'Bound to prompt + revisions', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 206,
    })

    // Branch arrows to Same vs Altered fingerprint
    fig.arrow(248, 304, 344, 292, { color: green, width: 1.8, head: 6 })
    fig.arrow(248, 354, 344, 366, { color: red, width: 1.8, head: 6 })
    fig.text(296, 278, 'Same fp_v1', {
        size: 12,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
        width: 90,
    })
    fig.text(296, 382, 'New fp_v2', {
        size: 12,
        color: red,
        align: 'center',
        weight: 700,
        mono: true,
        width: 90,
    })

    // Replay outcome 1: Idempotent hit
    fig.rect(346, 262, 450, 58, {
        fill: soft(green),
        stroke: green,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(364, 281, 'Idempotent Replay: Return Existing Hold', {
        size: 14,
        color: green,
        weight: 700,
        width: 416,
    })
    fig.text(364, 302, 'Zero double-deduction · 700 held · 300 available', {
        size: 13,
        color: c.textPrimary,
        mono: true,
        width: 416,
    })

    // Replay outcome 2: Conflict
    fig.rect(346, 336, 450, 58, {
        fill: soft(red),
        stroke: red,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(364, 355, 'Idempotency Conflict: Reject Modified Payload', {
        size: 14,
        color: red,
        weight: 700,
        width: 416,
    })
    fig.text(364, 376, 'Original hold & balance untouched · no new dispatch', {
        size: 13,
        color: c.textPrimary,
        mono: true,
        width: 416,
    })

    return fig.render()
}
