import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 360
export const alt =
    'One shared incident state fans out to three independent decision queries with inline confidence bars: owner route returns registry_auth (0.88), customer impact returns not_reported (0.91), and triage urgency returns needs_review (0.64). All three feed into application routing code.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const green = f.tone('green')
    const purple = f.tone('purple')
    const warm = f.tone('warm')

    // Left: Shared incident state
    const leftX = 16
    const leftY = 122
    const leftW = 166
    const leftH = 116
    f.rect(leftX, leftY, leftW, leftH, {
        fill: tint(blue, c.bg, 0.14),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 10,
    })
    f.text(leftX + leftW / 2, leftY + 34, 'Shared state', {
        size: 16.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    f.text(leftX + leftW / 2, leftY + 60, '401 registry log', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
    })
    f.text(leftX + leftW / 2, leftY + 86, 'reused prefix', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Middle: 3 independent decision queries with embedded probability bars
    const queries = [
        { title: 'Owner route', answer: 'registry_auth', score: 0.88, tone: green, y: 26 },
        { title: 'Customer impact', answer: 'not_reported', score: 0.91, tone: purple, y: 136 },
        { title: 'Triage urgency', answer: 'needs_review', score: 0.64, tone: warm, y: 246 },
    ] as const

    const qX = 248
    const qW = 286
    const qH = 88

    // Right: App router
    const rightX = 600
    const rightY = 112
    const rightW = 164
    const rightH = 136
    f.rect(rightX, rightY, rightW, rightH, {
        fill: tint(c.textSecondary, c.bg, 0.1),
        stroke: c.borderLight,
        strokeWidth: 1.75,
        radius: 10,
    })
    f.text(rightX + rightW / 2, rightY + 34, 'App router', {
        size: 16.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    f.text(rightX + rightW / 2, rightY + 62, 'threshold + policy', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })
    // Two compact outcome badges inside router
    f.rect(rightX + 14, rightY + 86, 62, 26, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.2,
        radius: 13,
    })
    f.text(rightX + 45, rightY + 99, 'Auto', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })
    f.rect(rightX + 86, rightY + 86, 64, 26, {
        fill: tint(warm, c.bg, 0.16),
        stroke: warm,
        strokeWidth: 1.2,
        radius: 13,
    })
    f.text(rightX + 118, rightY + 99, 'Review', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Draw fanout/fanin edges and query cards
    queries.forEach((q, idx) => {
        const qMidY = q.y + qH / 2
        const leftAnchorY = leftY + 26 + idx * 32
        const rightAnchorY = rightY + 32 + idx * 36

        // Curved fan-out path
        const c1x = leftX + leftW + 30
        const c2x = qX - 30
        f.path(
            `M${leftX + leftW} ${leftAnchorY} C${c1x} ${leftAnchorY},${c2x} ${qMidY},${qX - 8} ${qMidY}`,
            { color: q.tone, width: 1.7 },
        )
        f.arrow(qX - 14, qMidY, qX - 2, qMidY, { color: q.tone, width: 1.7, head: 6 })

        // Curved fan-in path
        const c3x = qX + qW + 28
        const c4x = rightX - 28
        f.path(
            `M${qX + qW} ${qMidY} C${c3x} ${qMidY},${c4x} ${rightAnchorY},${rightX - 8} ${rightAnchorY}`,
            { color: q.tone, width: 1.7 },
        )
        f.arrow(rightX - 14, rightAnchorY, rightX - 2, rightAnchorY, {
            color: q.tone,
            width: 1.7,
            head: 6,
        })

        // Query card surface
        f.rect(qX, q.y, qW, qH, {
            fill: tint(q.tone, c.bg, 0.1),
            stroke: q.tone,
            strokeWidth: 1.5,
            radius: 9,
        })
        f.text(qX + 14, q.y + 22, q.title, {
            size: 14,
            weight: 600,
            color: c.textSecondary,
        })
        f.text(qX + qW - 14, q.y + 22, q.score.toFixed(2), {
            size: 15,
            weight: 700,
            color: q.tone,
            align: 'right',
            mono: true,
        })
        f.text(qX + 14, q.y + 46, q.answer, {
            size: 15.5,
            weight: 700,
            color: q.tone,
            mono: true,
        })

        // Mini inline probability bar
        const barX = qX + 14
        const barY = q.y + 66
        const barW = qW - 28
        const barH = 10
        f.rect(barX, barY, barW, barH, {
            fill: tint(c.textMuted, c.bg, 0.18),
            radius: 5,
        })
        f.rect(barX, barY, barW * q.score, barH, {
            fill: q.tone,
            radius: 5,
        })
    })

    return f.render()
}

export default create('dark')
