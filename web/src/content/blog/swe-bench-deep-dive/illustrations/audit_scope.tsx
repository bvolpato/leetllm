import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 390
export const alt =
    'Audit scope comparison for SWE-bench Verified and Pro. Verified has 500 public tasks with 138 selected hard tasks audited, inside which 82 tasks (59.4%) are shaded as flawed. Pro has 731 public tasks with 286 initially flagged, followed by overlapping broken-task counts of 200 (agent-assisted) and 249 (human review) bracketed as overlapping.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const warm = f.tone('warm')
    const red = f.tone('critical')

    const barLeft = 224
    const barW = 394
    const barH = 22

    // Section 1: Verified (500 public tasks)
    f.text(18, 24, 'SWE-bench Verified · 500 public tasks', {
        size: 16.5,
        weight: 700,
        color: blue,
    })

    const pxVer = (v: number) => barLeft + (barW * v) / 500

    // Full set 500
    const yV1 = 62
    f.text(barLeft - 14, yV1, 'Full public set', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
    })
    f.rect(barLeft, yV1 - barH / 2, barW, barH, {
        fill: tint(c.textMuted, c.bg, 0.34),
        stroke: c.border,
        strokeWidth: 1,
        radius: 4,
    })
    f.text(barLeft + barW + 12, yV1, '500', {
        size: 14.5,
        weight: 700,
        color: c.textSecondary,
        mono: true,
    })

    // Selected hard subset 138 with 82 (59.4%) flawed slice shaded inside
    const yV2 = 104
    const w138 = pxVer(138) - barLeft
    const w82 = pxVer(82) - barLeft
    f.text(barLeft - 14, yV2, 'Selected hard subset', {
        size: 14,
        weight: 600,
        color: c.textPrimary,
        align: 'right',
    })
    f.rect(barLeft, yV2 - barH / 2, barW, barH, {
        fill: tint(c.textMuted, c.bg, 0.08),
        radius: 4,
    })
    // Full 138 warm bar
    f.rect(barLeft, yV2 - barH / 2, w138, barH, {
        fill: tint(warm, c.bg, 0.5),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 4,
    })
    // Nested 82 (59.4%) flawed slice in critical red
    f.rect(barLeft, yV2 - barH / 2, w82, barH, {
        fill: tint(red, c.bg, 0.8),
        stroke: red,
        strokeWidth: 1.4,
        radius: 4,
    })
    f.text(barLeft + w138 + 10, yV2, '138', {
        size: 14.5,
        weight: 700,
        color: warm,
        mono: true,
    })
    // Callout pointing to the shaded 82 / 138 flawed slice
    f.callout(
        [barLeft + w82 * 0.55, yV2 + barH / 2 + 2],
        [barLeft + w138 + 62, yV2 + 30],
        '82 flawed (59.4% of 138)',
        {
            color: red,
            labelColor: red,
            size: 13.5,
            weight: 700,
            bend: -0.18,
            head: 5,
            align: 'left',
        },
    )

    // Hairline divider between Verified and Pro
    f.line(18, 162, width - 18, 162, { color: c.borderSubtle, width: 1.25 })

    // Section 2: Pro (731 public tasks)
    f.text(18, 188, 'SWE-bench Pro · 731 public tasks', {
        size: 16.5,
        weight: 700,
        color: purple,
    })

    const pxPro = (v: number) => barLeft + (barW * v) / 731

    const proRows = [
        { label: 'Full public set', value: 731, color: c.textMuted, y: 226, muted: true },
        { label: 'Initially flagged', value: 286, color: warm, y: 268, muted: false },
        { label: 'Agent-assisted: broken', value: 200, color: purple, y: 310, muted: false },
        { label: 'Human review: broken', value: 249, color: blue, y: 352, muted: false },
    ] as const

    proRows.forEach((row) => {
        const w = pxPro(row.value) - barLeft
        f.text(barLeft - 14, row.y, row.label, {
            size: 14,
            weight: row.muted ? 400 : 600,
            color: row.muted ? c.textSecondary : c.textPrimary,
            align: 'right',
        })
        f.rect(barLeft, row.y - barH / 2, barW, barH, {
            fill: tint(c.textMuted, c.bg, 0.08),
            radius: 4,
        })
        f.rect(barLeft, row.y - barH / 2, w, barH, {
            fill: tint(row.color, c.bg, row.muted ? 0.34 : 0.75),
            stroke: row.muted ? c.border : row.color,
            strokeWidth: row.muted ? 1 : 1.3,
            radius: 4,
        })
        f.text(barLeft + w + 10, row.y, String(row.value), {
            size: 14.5,
            weight: 700,
            color: row.muted ? c.textSecondary : row.color,
            mono: true,
        })
    })

    // Right-side bracket on Pro's overlapping 200 / 249 review counts
    const braceX = barLeft + pxPro(249) - barLeft + 54
    f.brace(braceX, 298, braceX, 364, 'overlap · do not add', {
        side: -1,
        depth: 10,
        labelGap: 12,
        color: purple,
        labelColor: c.textSecondary,
        labelSize: 13.5,
        weight: 600,
    })

    return f.render()
}

export default create('dark')
