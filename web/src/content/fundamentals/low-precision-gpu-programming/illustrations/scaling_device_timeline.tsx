import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 445
export const alt =
    'Two schematic device timelines comparing current and delayed FP8 scaling. Current scaling performs two tensor passes: Read X, compute amax_t and S_t, Read X again, cast and write Q, then GEMM. Delayed scaling reads X in one pass, splitting into an upper branch (compute amax_t, record a_t into future history H_{t+1}) and a lower branch (cast with historical S_t = max(H_t)/448 from the 3-step history ring [a_{t-3}, a_{t-2}, a_{t-1}], write Q, then GEMM) with zero crossing paths.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        label: string,
        tone: string,
        sub?: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.14 : 0.24),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 7,
        })
        if (sub) {
            fig.text(x + w / 2, y + h / 2 - 9, label, {
                size: 13,
                weight: 700,
                color: c.textPrimary,
                align: 'center',
            })
            fig.text(x + w / 2, y + h / 2 + 10, sub, {
                size: 12,
                color: tone,
                align: 'center',
                mono: true,
            })
        } else {
            fig.text(x + w / 2, y + h / 2, label, {
                size: 13,
                weight: 600,
                color: c.textPrimary,
                align: 'center',
            })
        }
    }

    // --- Track 1: Current Scaling (2 tensor passes) ---
    fig.text(28, 22, 'Current scaling · 2 passes over X', {
        size: 15,
        weight: 600,
        color: blue,
    })

    const t1Y = 46
    const t1H = 48
    const t1Steps = [
        { x: 28, w: 112, label: 'Read X', sub: 'pass 1', tone: blue },
        { x: 168, w: 120, label: 'amax → S_t', sub: 'reduce', tone: warm },
        { x: 316, w: 118, label: 'Read X', sub: 'pass 2', tone: red },
        { x: 462, w: 124, label: 'Cast & write Q', sub: 'FP8 out', tone: green },
        { x: 614, w: 108, label: 'GEMM', sub: 'consume Q', tone: purple },
    ]
    t1Steps.forEach((s, i) => {
        box(s.x, t1Y, s.w, t1H, s.label, s.tone, s.sub)
        if (i < t1Steps.length - 1) {
            const next = t1Steps[i + 1]!
            fig.arrow(s.x + s.w + 2, t1Y + t1H / 2, next.x - 2, t1Y + t1H / 2, {
                color: c.textMuted,
                width: 1.6,
                head: 6,
            })
        }
    })

    // Hairline divider
    fig.line(28, 120, 732, 120, { color: c.borderSubtle, width: 1 })

    // --- Track 2: Delayed Scaling (1 pass + history ring, ZERO crossings) ---
    fig.text(28, 144, 'Delayed scaling · 1 pass over X using history ring', {
        size: 15,
        weight: 600,
        color: green,
    })
    fig.math(396, 144, 'H_t', { size: 15, color: blue })

    // Shared Read X node on left
    const rxX = 28
    const rxY = 210
    const rxW = 114
    const rxH = 66
    box(rxX, rxY, rxW, rxH, 'Read X', blue, '1 pass only')

    // Upper branch: amax_t -> record a_t (for next step's history)
    const upY = 176
    const bH = 46
    box(196, upY, 174, bH, 'Compute amax', warm, 'current a_t')
    box(426, upY, 160, bH, 'Record a_t', warm, 'for step t+1')

    // Lower branch: cast with S_t -> write Q -> GEMM
    const dnY = 258
    box(196, dnY, 174, bH, 'Cast with S_t', green, 'fused in pass')
    box(426, dnY, 120, bH, 'Write Q', purple, 'FP8 out')
    box(588, dnY, 114, bH, 'GEMM', purple, 'consume Q')

    // Clean forks from Read X (no overlap)
    fig.path(`M${rxX + rxW} ${rxY + 20} H168 V${upY + bH / 2} H192`, {
        color: warm,
        width: 1.75,
    })
    fig.arrow(182, upY + bH / 2, 195, upY + bH / 2, { color: warm, width: 1.75, head: 6 })

    fig.path(`M${rxX + rxW} ${rxY + 46} H168 V${dnY + bH / 2} H192`, {
        color: green,
        width: 1.75,
    })
    fig.arrow(182, dnY + bH / 2, 195, dnY + bH / 2, { color: green, width: 1.75, head: 6 })

    // Horizontal arrows on upper & lower lanes
    fig.arrow(372, upY + bH / 2, 424, upY + bH / 2, { color: warm, width: 1.75, head: 6 })
    fig.arrow(372, dnY + bH / 2, 424, dnY + bH / 2, { color: green, width: 1.75, head: 6 })
    fig.arrow(548, dnY + bH / 2, 586, dnY + bH / 2, { color: purple, width: 1.75, head: 6 })

    // Bottom row: History Ring H_t -> S_t = max(H_t)/448 (directly below Cast with S_t!)
    const ringY = 346
    const ringH = 54
    fig.rect(28, ringY, 214, ringH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(36, ringY - 12, 'History ring H_t', {
        size: 12,
        weight: 600,
        color: blue,
    })
    const slots = ['a_{t-3}', 'a_{t-2}', 'a_{t-1}']
    slots.forEach((tex, i) => {
        const sx = 38 + i * 66
        fig.rect(sx, ringY + 11, 58, 32, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.16 : 0.26),
            stroke: tint(blue, c.bg, 0.55),
            strokeWidth: 1.25,
            radius: 5,
        })
        fig.math(sx + 29, ringY + 27, tex, { size: 13, color: c.textPrimary, align: 'center' })
    })

    // S_t box directly aligned below Cast with S_t (x = 280..480)
    const stX = 280
    const stW = 198
    fig.rect(stX, ringY, stW, ringH, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.14 : 0.24),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.math(stX + stW / 2, ringY + ringH / 2, 'S_t = \\max(H_t) / 448', {
        size: 14,
        color: purple,
        align: 'center',
    })

    // Arrow H_t -> S_t
    fig.arrow(244, ringY + ringH / 2, stX - 2, ringY + ringH / 2, {
        color: blue,
        width: 1.75,
        head: 6,
    })

    // Straight vertical arrow S_t -> Cast with S_t (ZERO crossing!)
    const feedX = 326
    fig.arrow(feedX, ringY - 2, feedX, dnY + bH + 2, {
        color: purple,
        width: 2,
        head: 6.5,
    })
    fig.text(feedX + 10, (ringY + dnY + bH) / 2, 'feeds current cast', {
        size: 12,
        color: purple,
        weight: 600,
    })

    // Clean perimeter feedback route from Record a_t around right edge & bottom into H_t (ZERO crossing!)
    const rightRail = 728
    const botRail = 424
    const ringFeedX = 135
    fig.path(
        `M588 ${upY + bH / 2} H${rightRail} V${botRail} H${ringFeedX} V${ringY + ringH + 4}`,
        {
            color: warm,
            width: 1.75,
            dash: '6 4',
        },
    )
    fig.arrow(ringFeedX, ringY + ringH + 12, ringFeedX, ringY + ringH + 2, {
        color: warm,
        width: 1.75,
        head: 6,
    })
    fig.text(600, botRail - 13, 'append a_t → H_{t+1} (next step)', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
    })

    return fig.render()
}

export default create
