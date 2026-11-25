import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 370
export const alt =
    'Tool-call trace and 6-slot budget accounting: call_0 reads /etc/passwd and is DENIED with invalid_request, consuming slot 1 of 6 without caching; call_1 searches billing-v1.example and is ALLOWED with backends.toml:2, consuming slot 2 of 6 and adding 1 cached dedupe key.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const green = f.tone('green')
    const warm = f.tone('warm')
    const red = f.tone('critical')

    // Section 1: Paired call_id trace (borderless, no nested panels)
    f.text(18, 22, 'Paired call_id trace', { size: 16, weight: 700, color: c.textPrimary })

    const drawCallRow = (
        y: number,
        reqTitle: string,
        reqDetail: string,
        reqTone: string,
        verdict: 'DENIED' | 'ALLOWED',
        verdictTone: string,
        resTitle: string,
        resDetail: string,
        cacheTag: string,
    ) => {
        const reqX = 18
        const reqW = 248
        const h = 66
        const resX = 434
        const resW = 232

        // Request box
        f.rect(reqX, y, reqW, h, {
            fill: tint(reqTone, c.bg, 0.12),
            stroke: reqTone,
            strokeWidth: 1.5,
            radius: 9,
        })
        f.text(reqX + 14, y + 23, reqTitle, {
            size: 14.5,
            weight: 700,
            color: reqTone,
            mono: true,
        })
        f.text(reqX + 14, y + 46, reqDetail, {
            size: 13.5,
            color: c.textSecondary,
            mono: true,
        })

        // Arrow + verdict pill
        const midX = (reqX + reqW + resX) / 2
        f.arrow(reqX + reqW, y + h / 2, resX - 2, y + h / 2, {
            color: verdictTone,
            width: 1.8,
            head: 6,
        })
        f.rect(midX - 46, y + h / 2 - 13, 92, 26, {
            fill: tint(verdictTone, c.bg, 0.22),
            stroke: verdictTone,
            strokeWidth: 1.4,
            radius: 13,
        })
        f.text(midX, y + h / 2, verdict, {
            size: 12.5,
            weight: 700,
            color: verdictTone,
            align: 'center',
            mono: true,
        })

        // Observation box
        f.rect(resX, y, resW, h, {
            fill: tint(verdictTone, c.bg, 0.12),
            stroke: verdictTone,
            strokeWidth: 1.5,
            radius: 9,
        })
        f.text(resX + 14, y + 23, resTitle, {
            size: 14.5,
            weight: 700,
            color: verdictTone,
            mono: true,
        })
        f.text(resX + 14, y + 46, resDetail, {
            size: 13.5,
            color: c.textSecondary,
            mono: true,
        })

        // Right-edge side effect tag
        f.text(resX + resW + 14, y + h / 2, cacheTag, {
            size: 13.5,
            weight: 600,
            color: verdict === 'ALLOWED' ? green : c.textMuted,
        })
    }

    drawCallRow(
        44,
        'call_0 · read_snapshot',
        '/etc/passwd',
        warm,
        'DENIED',
        red,
        'call_0 output',
        'invalid_request',
        'no cache',
    )
    drawCallRow(
        130,
        'call_1 · search',
        'billing-v1.example',
        blue,
        'ALLOWED',
        green,
        'call_1 output',
        'backends.toml:2',
        '+1 cache',
    )

    // Hairline divider
    f.line(18, 220, width - 18, 220, { color: c.borderSubtle, width: 1.25 })

    // Section 2: Discrete 6-slot step blocks for budget + dedupe cache accounting
    f.text(18, 244, 'Runtime accounting after two calls', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
    })

    // Budget row: 6 discrete slot blocks
    const slotX0 = 190
    const slotW = 72
    const slotGap = 8
    const budgetY = 272
    f.text(18, budgetY + 15, 'Request budget', {
        size: 14.5,
        weight: 600,
        color: c.textSecondary,
    })

    const budgetSlots = [
        { label: 'call_0', tone: red, used: true },
        { label: 'call_1', tone: green, used: true },
        { label: '3', tone: c.textMuted, used: false },
        { label: '4', tone: c.textMuted, used: false },
        { label: '5', tone: c.textMuted, used: false },
        { label: '6', tone: c.textMuted, used: false },
    ] as const

    budgetSlots.forEach((slot, i) => {
        const sx = slotX0 + i * (slotW + slotGap)
        f.rect(sx, budgetY, slotW, 30, {
            fill: slot.used ? tint(slot.tone, c.bg, 0.24) : tint(c.textMuted, c.bg, 0.06),
            stroke: slot.used ? slot.tone : c.border,
            strokeWidth: slot.used ? 1.6 : 1,
            radius: 5,
        })
        f.text(sx + slotW / 2, budgetY + 15, slot.label, {
            size: 13,
            weight: slot.used ? 700 : 400,
            color: slot.used ? slot.tone : c.textMuted,
            align: 'center',
            mono: true,
        })
    })
    f.text(slotX0 + 6 * (slotW + slotGap) + 8, budgetY + 15, '2 / 6 reqs', {
        size: 15,
        weight: 700,
        color: warm,
        mono: true,
    })

    // Cache row: call_0 not cached (dashed empty), call_1 cached (solid green)
    const cacheY = 320
    f.text(18, cacheY + 15, 'Dedupe cache', {
        size: 14.5,
        weight: 600,
        color: c.textSecondary,
    })
    // call_0 skipped
    f.rect(slotX0, cacheY, slotW, 30, {
        fill: 'none',
        radius: 5,
    })
    f.path(
        `M${slotX0 + 4} ${cacheY} H${slotX0 + slotW - 4} Q${slotX0 + slotW} ${cacheY},${slotX0 + slotW} ${cacheY + 4} V${cacheY + 26} Q${slotX0 + slotW} ${cacheY + 30},${slotX0 + slotW - 4} ${cacheY + 30} H${slotX0 + 4} Q${slotX0} ${cacheY + 30},${slotX0} ${cacheY + 26} V${cacheY + 4} Q${slotX0} ${cacheY},${slotX0 + 4} ${cacheY}`,
        { color: c.border, width: 1.25, dash: '4 3' },
    )
    f.text(slotX0 + slotW / 2, cacheY + 15, 'skip', {
        size: 12.5,
        color: c.textMuted,
        align: 'center',
        mono: true,
    })

    // call_1 cached
    const c1x = slotX0 + slotW + slotGap
    f.rect(c1x, cacheY, slotW, 30, {
        fill: tint(green, c.bg, 0.24),
        stroke: green,
        strokeWidth: 1.6,
        radius: 5,
    })
    f.text(c1x + slotW / 2, cacheY + 15, 'call_1', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    f.text(slotX0 + 6 * (slotW + slotGap) + 8, cacheY + 15, '1 cached', {
        size: 15,
        weight: 700,
        color: green,
        mono: true,
    })

    return f.render()
}

export default create('dark')
