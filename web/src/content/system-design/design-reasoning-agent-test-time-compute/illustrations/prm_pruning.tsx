import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 415
export const alt =
    'Outcome reward model runs all four steps before scoring 0.15, while process reward scoring halts at step 3 when the removed-API call fails.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const critical = fig.tone('critical')
    const muted = c.textSecondary

    const leftX = 24
    const rightX = 446
    const colW = 370
    const startY = 74
    const stepH = 50
    const gap = 18

    // --- Left Column: Outcome Scoring (ORM) ---
    fig.text(leftX, 22, 'Outcome Scoring (ORM)', { size: 16, weight: 700, color: critical })
    fig.text(leftX, 44, 'Runs all 4 steps before scoring', { size: 13, color: muted })

    const ormSteps = [
        { title: '1. Parse manifest', status: 'Generated', tone: blue },
        { title: '2. Pin parser-v2', status: 'Generated', tone: blue },
        { title: '3. Removed API call', status: 'Error (unchecked)', tone: critical },
        { title: '4. Recommend fix', status: 'Wasted tokens', tone: critical },
    ] as const

    ormSteps.forEach((st, i) => {
        const y = startY + i * (stepH + gap)
        fig.rect(leftX, y, colW, stepH, {
            fill: tint(st.tone, c.bg, 0.12),
            stroke: st.tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(leftX + 14, y + stepH / 2, st.title, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
        })
        fig.text(leftX + colW - 14, y + stepH / 2, st.status, {
            size: 13,
            weight: 700,
            color: st.tone,
            align: 'right',
        })
        if (i < ormSteps.length - 1) {
            fig.arrow(leftX + colW / 2, y + stepH, leftX + colW / 2, y + stepH + gap - 2, {
                color: c.textMuted,
                width: 1.75,
                head: 5,
            })
        }
    })

    // ORM terminal verdict
    const endY = startY + 4 * (stepH + gap) + 4
    fig.rect(leftX, endY, colW, 44, {
        fill: tint(critical, c.bg, 0.18),
        stroke: critical,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(leftX + colW / 2, endY + 22, 'Terminal score: 0.15  ->  Reject all 4 steps', {
        size: 13,
        weight: 700,
        color: critical,
        align: 'center',
        width: colW - 16,
    })

    // Vertical divider
    fig.line(420, 18, 420, 398, { color: c.borderSubtle, width: 1 })

    // --- Right Column: Process Scoring (PRM + Exact Checks) ---
    fig.text(rightX, 22, 'Process Scoring (PRM + Exact Checks)', {
        size: 16,
        weight: 700,
        color: green,
    })
    fig.text(rightX, 44, 'Checks every step and halts on failure', { size: 13, color: muted })

    // Step 1: Pass
    const y0 = startY
    fig.rect(rightX, y0, colW, stepH, {
        fill: tint(green, c.bg, 0.13),
        stroke: green,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(rightX + 14, y0 + stepH / 2, '1. Parse manifest', {
        size: 14,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rightX + colW - 14, y0 + stepH / 2, '0.92 · PASS', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.arrow(rightX + colW / 2, y0 + stepH, rightX + colW / 2, y0 + stepH + gap - 2, {
        color: green,
        width: 1.75,
        head: 5,
    })

    // Step 2: Pass
    const y1 = startY + (stepH + gap)
    fig.rect(rightX, y1, colW, stepH, {
        fill: tint(green, c.bg, 0.13),
        stroke: green,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(rightX + 14, y1 + stepH / 2, '2. Pin parser-v2', {
        size: 14,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rightX + colW - 14, y1 + stepH / 2, '0.74 · PASS', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.arrow(rightX + colW / 2, y1 + stepH, rightX + colW / 2, y1 + stepH + gap - 2, {
        color: green,
        width: 1.75,
        head: 5,
    })

    // Step 3: Fail & Halt
    const y2 = startY + 2 * (stepH + gap)
    fig.rect(rightX, y2, colW, stepH, {
        fill: tint(critical, c.bg, 0.2),
        stroke: critical,
        strokeWidth: 2,
        radius: 7,
    })
    fig.text(rightX + 14, y2 + stepH / 2, '3. Removed API call', {
        size: 14,
        weight: 700,
        color: critical,
    })
    fig.text(rightX + colW - 14, y2 + stepH / 2, 'FAIL -> HALT', {
        size: 13,
        weight: 700,
        color: critical,
        align: 'right',
        mono: true,
    })

    // Step 4: Skipped (never generated)
    const y3 = startY + 3 * (stepH + gap)
    fig.rect(rightX, y3, colW, stepH, {
        fill: 'none',
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 7,
    })
    fig.line(rightX + 14, y3 + stepH / 2, rightX + 148, y3 + stepH / 2, {
        color: c.textMuted,
        width: 1.25,
        opacity: 0.65,
    })
    fig.text(rightX + 14, y3 + stepH / 2, '4. Recommend fix', {
        size: 14,
        color: c.textMuted,
    })
    fig.text(rightX + colW - 14, y3 + stepH / 2, 'SKIPPED (0 tokens)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    // PRM savings verdict
    fig.rect(rightX, endY, colW, 44, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(rightX + colW / 2, endY + 22, 'Halted at step 3  ->  25% budget preserved', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        width: colW - 16,
    })

    return fig.render()
}

export default create()
