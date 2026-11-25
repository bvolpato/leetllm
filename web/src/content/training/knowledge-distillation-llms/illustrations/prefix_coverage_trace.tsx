import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'A branching prefix tree starts from the shared prompt "How long is this disabled key restorable? Answer:". The teacher trajectory visits "...7" and "...7 days". Live student sampling visits the shared prefix "...7" but branches onto "...30" and "...30 days", creating 2 new teacher-scored prefixes and 4 distinct scored prefixes in total.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const muted = c.textSecondary

    // Root prompt node on left
    const rootX = 24
    const rootY = 128
    const rootW = 216
    const rootH = 92
    fig.rect(rootX, rootY, rootW, rootH, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(rootX + 14, rootY + 22, 'Shared prompt', { size: 13, weight: 600, color: muted })
    fig.text(rootX + 14, rootY + 46, '“How long is this disabled', { size: 13, weight: 600 })
    fig.text(rootX + 14, rootY + 66, 'key restorable? Answer:”', { size: 13, weight: 600 })

    // Branch 1 (upper): Teacher fixed dataset path (...7 to ...7 days)
    const midX = 304
    const leafX = 524
    const nodeW = 148
    const nodeH = 44

    const topY = 74
    const botY = 204

    // Shared node "...7" (top branch step 1)
    fig.arrow(rootX + rootW + 2, rootY + 30, midX - 4, topY + nodeH / 2, {
        color: green,
        width: 2,
        head: 7,
    })
    fig.rect(midX, topY, nodeW, nodeH, {
        fill: tint(green, c.bg, 0.18),
        stroke: green,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(midX + nodeW / 2, topY + 15, '… 7', {
        size: 16,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(midX + nodeW / 2, topY + 34, 'shared overlap', {
        size: 11,
        weight: 600,
        color: green,
        align: 'center',
    })

    // Teacher continuation "...7 days"
    fig.arrow(midX + nodeW + 2, topY + nodeH / 2, leafX - 4, topY + nodeH / 2, {
        color: cyan,
        width: 2,
        head: 7,
    })
    fig.rect(leafX, topY, nodeW, nodeH, {
        fill: tint(cyan, c.bg, 0.16),
        stroke: cyan,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(leafX + nodeW / 2, topY + 15, '… 7 days', {
        size: 16,
        mono: true,
        weight: 700,
        color: cyan,
        align: 'center',
    })
    fig.text(leafX + nodeW / 2, topY + 34, 'fixed teacher', {
        size: 11,
        weight: 600,
        color: cyan,
        align: 'center',
    })

    // Branch labels
    fig.text(midX, 38, 'Fixed teacher dataset (2 prefixes)', {
        size: 14,
        weight: 700,
        color: cyan,
    })
    fig.text(midX, 174, 'Student on-policy divergence (+2 new prefixes)', {
        size: 14,
        weight: 700,
        color: warm,
    })

    // Branch 2 (lower): Student branches to "...30" and "...30 days"
    fig.arrow(rootX + rootW + 2, rootY + 66, midX - 4, botY + nodeH / 2, {
        color: warm,
        width: 2,
        head: 7,
    })
    fig.rect(midX, botY, nodeW, nodeH, {
        fill: tint(warm, c.bg, 0.18),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(midX + nodeW / 2, botY + 15, '… 30', {
        size: 16,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(midX + nodeW / 2, botY + 34, 'new teacher query', {
        size: 11,
        weight: 600,
        color: warm,
        align: 'center',
    })

    fig.arrow(midX + nodeW + 2, botY + nodeH / 2, leafX - 4, botY + nodeH / 2, {
        color: warm,
        width: 2,
        head: 7,
    })
    fig.rect(leafX, botY, nodeW, nodeH, {
        fill: tint(warm, c.bg, 0.18),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(leafX + nodeW / 2, botY + 15, '… 30 days', {
        size: 16,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(leafX + nodeW / 2, botY + 34, 'new teacher query', {
        size: 11,
        weight: 600,
        color: warm,
        align: 'center',
    })

    // Bottom union summary bar
    const sumY = 304
    fig.line(24, sumY - 22, width - 24, sumY - 22, { color: c.borderSubtle, width: 1 })
    fig.text(24, sumY + 4, 'Union scored by teacher', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(24, sumY + 26, '2 fixed + 2 new = 4 unique', {
        size: 13,
        mono: true,
        color: muted,
    })

    const unionItems = [
        { label: '… 7', color: green },
        { label: '… 7 days', color: cyan },
        { label: '… 30', color: warm },
        { label: '… 30 days', color: warm },
    ]
    unionItems.forEach((u, i) => {
        const ux = 264 + i * 120
        fig.rect(ux, sumY - 2, 108, 38, {
            fill: tint(u.color, c.bg, 0.14),
            stroke: u.color,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(ux + 54, sumY + 17, u.label, {
            size: 14,
            mono: true,
            weight: 700,
            color: u.color,
            align: 'center',
        })
    })

    return fig.render()
}

export default create('dark')
