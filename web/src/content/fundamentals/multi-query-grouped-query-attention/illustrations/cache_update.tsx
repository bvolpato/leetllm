import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 405
export const alt =
    'GQA incremental decode step writes only two KV heads at slot t=1 and keeps temporary eight-head expansion strictly ephemeral during compute. Top pipeline shows Project (8Q, 2KV), RoPE (Q, K at t=1), Append (slot t=1), and Attend (keys 0..1). Bottom left shows the persistent 2-head KV cache across 4 slots (t=0,1 filled; t=2,3 free). Bottom right shows the transient broadcast view expanding the 2 stored KV heads across 8 query heads without duplicating cache memory.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // --- Top: Crisp single-row 4-stage incremental decode pipeline ---
    fig.text(28, 20, 'Incremental GQA decode step (cursor t = 1)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const steps = [
        { head: '1. Project', sub: '8 Q, 2 KV heads', color: blue },
        { head: '2. RoPE', sub: 'rotate Q, K at t=1', color: purple },
        { head: '3. Append KV', sub: 'write 2 heads @ t=1', color: green },
        { head: '4. Attend', sub: 'read keys t = 0..1', color: warm },
    ]
    const sW = 156
    const sGap = 26
    const sY = 44
    const sH = 48
    steps.forEach((s, i) => {
        const sx = 28 + i * (sW + sGap)
        fig.rect(sx, sY, sW, sH, {
            fill: tint(s.color, c.bg, theme === 'light' ? 0.14 : 0.24),
            stroke: s.color,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(sx + sW / 2, sY + 15, s.head, {
            size: 13,
            weight: 700,
            color: s.color,
            align: 'center',
        })
        fig.text(sx + sW / 2, sY + 34, s.sub, {
            size: 12,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        if (i < steps.length - 1) {
            fig.arrow(sx + sW + 2, sY + sH / 2, sx + sW + sGap - 2, sY + sH / 2, {
                color: c.textMuted,
                width: 1.6,
                head: 5.5,
            })
        }
    })

    fig.line(28, 116, 732, 116, { color: c.borderSubtle, width: 1 })

    // --- Lower left: Persistent 2-head KV Cache (2 rows x 4 time slots) ---
    fig.text(28, 142, 'Persistent KV cache (2 heads stored)', {
        size: 15,
        weight: 600,
        color: green,
    })
    fig.text(28, 164, 'Slots t=0, t=1 written · t=2, t=3 free', {
        size: 12,
        color: c.textSecondary,
    })

    const cX = 82
    const cY = 204
    const cW = 58
    const cH = 44
    const cGap = 8

    for (let t = 0; t < 4; t++) {
        fig.text(cX + t * (cW + cGap) + cW / 2, cY - 14, `t=${t}`, {
            size: 12,
            weight: t === 1 ? 700 : 500,
            color: t === 1 ? green : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    const kvRowMeta = [
        { name: 'KV 0', color: blue },
        { name: 'KV 1', color: warm },
    ]
    kvRowMeta.forEach((rm, r) => {
        const y = cY + r * (cH + cGap)
        fig.text(cX - 10, y + cH / 2, rm.name, {
            size: 13,
            weight: 700,
            color: rm.color,
            align: 'right',
            mono: true,
        })
        for (let t = 0; t < 4; t++) {
            const x = cX + t * (cW + cGap)
            const filled = t <= 1
            const isNew = t === 1
            fig.rect(x, y, cW, cH, {
                fill: filled
                    ? tint(rm.color, c.bg, theme === 'light' ? (isNew ? 0.72 : 0.45) : isNew ? 0.82 : 0.56)
                    : tint(c.textMuted, c.bg, 0.06),
                stroke: isNew ? green : filled ? rm.color : c.borderSubtle,
                strokeWidth: isNew ? 2.25 : 1.25,
                radius: 6,
            })
            fig.text(x + cW / 2, y + cH / 2, isNew ? 'new' : filled ? 'kept' : 'free', {
                size: 12,
                weight: filled ? 700 : 400,
                color: isNew
                    ? theme === 'light'
                        ? '#ffffff'
                        : '#0b0c10'
                    : filled
                      ? c.textPrimary
                      : c.textMuted,
                align: 'center',
                mono: true,
            })
        }
    })

    fig.text(210, 330, 'Retained in HBM: 2 KV heads only', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Broadcast arrow from persistent cache -> ephemeral compute view
    fig.arrow(356, 252, 412, 252, { color: warm, width: 2, head: 6.5 })
    fig.text(384, 234, 'broadcast', {
        size: 11,
        weight: 600,
        color: warm,
        align: 'center',
    })

    // --- Lower right: Transient 8-head Compute Broadcast (8 rows x 2 active slots) ---
    fig.text(432, 142, 'Transient broadcast (compute only)', {
        size: 15,
        weight: 600,
        color: warm,
    })
    fig.text(432, 164, 'Each KV head repeats 4× for 8 Q heads', {
        size: 12,
        color: c.textSecondary,
    })

    const eX = 508
    const eY = 190
    const eW = 62
    const eH = 15
    const eGap = 4

    fig.text(eX + eW / 2, eY - 12, 't=0', {
        size: 11,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    fig.text(eX + eW + 8 + eW / 2, eY - 12, 't=1', {
        size: 11,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    for (let q = 0; q < 8; q++) {
        const y = eY + q * (eH + eGap)
        const groupColor = q < 4 ? blue : warm
        fig.text(eX - 10, y + eH / 2, `Q${q}`, {
            size: 11,
            weight: 600,
            color: groupColor,
            align: 'right',
            mono: true,
        })
        for (let t = 0; t < 2; t++) {
            const x = eX + t * (eW + 8)
            fig.rect(x, y, eW, eH, {
                fill: tint(groupColor, c.bg, theme === 'light' ? 0.62 : 0.72),
                stroke: groupColor,
                strokeWidth: 1,
                radius: 3,
            })
        }
    }

    // Group braces on right edge of ephemeral grid
    const brX = eX + 2 * eW + 16
    fig.brace(brX, eY, brX, eY + 4 * eH + 3 * eGap, 'KV 0 ×4', {
        side: -1,
        depth: 7,
        color: blue,
        labelColor: blue,
        labelSize: 12,
        labelGap: 10,
        weight: 700,
    })
    fig.brace(brX, eY + 4 * (eH + eGap), brX, eY + 8 * eH + 7 * eGap, 'KV 1 ×4', {
        side: -1,
        depth: 7,
        color: warm,
        labelColor: warm,
        labelSize: 12,
        labelGap: 10,
        weight: 700,
    })

    fig.text(584, 366, 'Zero extra HBM allocation (ephemeral view)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create
