import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 420
export const alt =
    'Side-by-side narrowing retrieval funnels at K = 2 over the four-document ranking [roadmap@1, policy@1, policy@2, exception@1]. Left: post-filtering truncates to Top-2 first, capturing forbidden roadmap@1 and obsolete policy@1, then drops both at eligibility check leaving 0 usable passages. Right: pre-filtering enforces workspace-a access and current revision before Top-2, preserving both policy@2 and exception@1.'

interface DocItem {
    id: string
    tag: string
    ok: boolean
}

const DOCS: DocItem[] = [
    { id: '#1 roadmap@1', tag: 'workspace-b', ok: false },
    { id: '#2 policy@1', tag: 'obsolete rev', ok: false },
    { id: '#3 policy@2', tag: 'current', ok: true },
    { id: '#4 exception@1', tag: 'current', ok: true },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    const fill = (color: string, amt = 0.12) => tint(color, c.bg, amt)

    // Center divider hairline
    fig.line(420, 20, 420, 398, { color: c.borderSubtle, width: 1 })

    // ==================== LEFT FUNNEL: POST-FILTER ====================
    fig.text(210, 24, 'Post-filter: Top-2 then Eligibility', {
        size: 14,
        color: red,
        align: 'center',
        weight: 700,
    })

    // 4-doc ranked stack (extra 14px gap between #2 and #3 for clean K=2 cutoff line)
    const rowY = (i: number) => 46 + i * 31 + (i >= 2 ? 16 : 0)

    DOCS.forEach((d, i) => {
        const y = rowY(i)
        const truncated = i >= 2
        fig.rect(36, y, 294, 26, {
            fill: truncated ? tint(c.textMuted, c.bg, 0.06) : fill(red, 0.1),
            stroke: truncated ? c.borderSubtle : red,
            strokeWidth: truncated ? 1 : 1.2,
            radius: 5,
            opacity: truncated ? 0.65 : 1,
        })
        fig.text(48, y + 13, d.id, {
            size: 12.5,
            color: truncated ? c.textMuted : c.textPrimary,
            weight: 600,
            mono: true,
        })
        fig.text(318, y + 13, d.tag, {
            size: 12,
            color: truncated ? c.textMuted : red,
            align: 'right',
            weight: 600,
        })
    })
    // Dashed K=2 cutoff line cleanly centered in the open gap with label in right gutter
    const cutY = 113
    fig.line(28, cutY, 336, cutY, { color: warm, width: 1.6, dash: '5 4' })
    fig.text(342, cutY, 'K = 2 cut', { size: 12, color: warm, align: 'left', weight: 700 })

    // Visual narrowing trapezoid funnel (Top-2 -> Eligibility gate)
    fig.path('M72 194 L340 194 L286 258 L126 258 Z', {
        fill: fill(red, 0.12),
        color: red,
        width: 1.3,
    })
    fig.text(206, 216, '1. Top-2: roadmap@1, policy@1', {
        size: 12.5,
        color: c.textPrimary,
        align: 'center',
        weight: 600,
    })
    fig.text(206, 239, '2. Eligibility drops both', {
        size: 12.5,
        color: red,
        align: 'center',
        weight: 700,
    })

    fig.arrow(206, 258, 206, 296, { color: red, width: 1.75, head: 6 })

    // Empty output slots
    fig.rect(56, 302, 142, 46, {
        fill: tint(c.textMuted, c.bg, 0.05),
        stroke: red,
        strokeWidth: 1.2,
        radius: 6,
    })
    fig.text(127, 325, '[ empty slot ]', {
        size: 12.5,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.rect(214, 302, 142, 46, {
        fill: tint(c.textMuted, c.bg, 0.05),
        stroke: red,
        strokeWidth: 1.2,
        radius: 6,
    })
    fig.text(285, 325, '[ empty slot ]', {
        size: 12.5,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.text(206, 374, '0 / 2 usable passages', {
        size: 14,
        color: red,
        align: 'center',
        weight: 700,
    })

    // ==================== RIGHT FUNNEL: PRE-FILTER ====================
    fig.text(630, 24, 'Pre-filter: Eligibility then Top-2', {
        size: 14,
        color: green,
        align: 'center',
        weight: 700,
    })

    // 4-doc ranked stack (top 2 filtered out BEFORE Top-K; bottom 2 pass)
    DOCS.forEach((d, i) => {
        const y = rowY(i)
        const dropped = !d.ok
        fig.rect(468, y, 324, 26, {
            fill: dropped ? tint(c.textMuted, c.bg, 0.06) : fill(green, 0.14),
            stroke: dropped ? c.borderSubtle : green,
            strokeWidth: dropped ? 1 : 1.3,
            radius: 5,
            opacity: dropped ? 0.6 : 1,
        })
        fig.text(480, y + 13, d.id, {
            size: 12.5,
            color: dropped ? c.textMuted : c.textPrimary,
            weight: 600,
            mono: true,
        })
        fig.text(780, y + 13, dropped ? `dropped (${d.tag})` : 'eligible', {
            size: 12,
            color: dropped ? red : green,
            align: 'right',
            weight: 600,
        })
        if (dropped) {
            fig.line(478, y + 13, 588, y + 13, { color: red, width: 1.2, opacity: 0.75 })
        }
    })

    // Visual narrowing trapezoid funnel (Filter pushdown -> Top-2)
    fig.path('M496 194 L764 194 L710 258 L550 258 Z', {
        fill: fill(green, 0.13),
        color: green,
        width: 1.3,
    })
    fig.text(630, 216, '1. Index pushdown (workspace-a)', {
        size: 12.5,
        color: c.textPrimary,
        align: 'center',
        weight: 600,
    })
    fig.text(630, 239, '2. Top-2 on eligible set', {
        size: 12.5,
        color: green,
        align: 'center',
        weight: 700,
    })

    fig.arrow(630, 258, 630, 296, { color: green, width: 1.75, head: 6 })

    // Filled output slots
    fig.rect(480, 302, 142, 46, {
        fill: fill(green, 0.18),
        stroke: green,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(551, 325, 'policy@2', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.rect(638, 302, 142, 46, {
        fill: fill(green, 0.18),
        stroke: green,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(709, 325, 'exception@1', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.text(630, 374, '2 / 2 usable passages', {
        size: 14,
        color: green,
        align: 'center',
        weight: 700,
    })

    return fig.render()
}

export default create()
