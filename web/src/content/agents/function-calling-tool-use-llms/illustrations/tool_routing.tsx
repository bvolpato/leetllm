import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'Dynamic tool routing funnel for caller role triage asking why reranker-v16 failed. Step 1 RBAC pre-filter drops promote_model and restart_cluster (ops-admin) before scoring. Step 2 ranks allowed tools by cosine similarity: get_release_status (0.999) and search_release_policy (0.892). Step 3 exposes top-2 to the model while the dispatcher rechecks permissions at call time.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const red = fig.tone('red')
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')

    fig.text(114, 20, '1. Role Pre-Filter', { size: 15.5, weight: 700, color: red, align: 'center' })
    fig.text(114, 42, 'role: triage', { size: 15, mono: true, color: c.textSecondary, align: 'center' })

    const tools = [
        { name: 'get_release_status', role: 'allowed', allowed: true },
        { name: 'search_policy', role: 'allowed', allowed: true },
        { name: 'promote_model', role: 'ops-admin ✕', allowed: false },
        { name: 'restart_cluster', role: 'ops-admin ✕', allowed: false },
    ]
    tools.forEach((t, i) => {
        const y = 68 + i * 70
        const tone = t.allowed ? green : red
        fig.rect(14, y, 200, 56, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.08 : 0.13),
            stroke: tint(tone, c.bg, t.allowed ? 0.65 : 0.45),
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(24, y + 18, t.name, { size: 15, mono: true, weight: 700, color: t.allowed ? c.textPrimary : red })
        fig.text(24, y + 40, t.role, { size: 15, color: tone })
    })

    fig.arrow(216, 96, 256, 134, { color: green, width: 1.8, head: 6 })
    fig.arrow(216, 166, 256, 214, { color: blue, width: 1.8, head: 6 })

    // Stage 2: Cosine Similarity
    fig.text(398, 20, '2. Similarity (top-2)', { size: 15.5, weight: 700, color: blue, align: 'center' })
    const barX = 264
    const barMaxW = 248
    const areaTop = 76
    const areaBot = 280
    for (const tk of [0, 0.5, 1.0]) {
        const x = barX + tk * barMaxW
        fig.line(x, areaTop, x, areaBot, { color: c.borderSubtle, width: 1, dash: tk === 0 ? undefined : '3 4' })
        fig.text(x, areaBot + 18, tk.toFixed(1), { size: 15, mono: true, color: c.textSecondary, align: 'center' })
    }
    fig.line(barX, areaBot, barX + barMaxW, areaBot, { color: c.textMuted, width: 1.2 })
    fig.text(barX + barMaxW / 2, areaBot + 44, 'Cosine similarity', { size: 15, color: c.textSecondary, align: 'center' })

    const ranked = [
        { name: 'get_release_status', score: 0.999, y: 108, color: green },
        { name: 'search_policy', score: 0.892, y: 196, color: blue },
    ]
    for (const r of ranked) {
        fig.text(barX, r.y - 6, r.name, { size: 15, mono: true, weight: 700, color: c.textPrimary })
        fig.rect(barX, r.y + 10, barMaxW, 30, { fill: tint(r.color, c.bg, theme === 'light' ? 0.07 : 0.1), radius: 5 })
        fig.rect(barX, r.y + 10, r.score * barMaxW, 30, { fill: r.color, radius: 5 })
        fig.text(barX + r.score * barMaxW - 8, r.y + 25, r.score.toFixed(3), {
            size: 15,
            mono: true,
            weight: 700,
            color: theme === 'light' ? '#ffffff' : c.bg,
            align: 'right',
        })
    }

    fig.arrow(526, 174, 566, 174, { color: green, width: 1.9, head: 6.5 })

    // Stage 3: Runtime Check
    fig.text(658, 20, '3. Runtime Check', { size: 15.5, weight: 700, color: warm, align: 'center' })
    fig.rect(570, 88, 176, 76, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.09 : 0.15),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(658, 114, 'Top-2 Exposed', { size: 15.5, weight: 700, color: blue, align: 'center' })
    fig.text(658, 142, '2 schemas sent', { size: 15, color: c.textSecondary, align: 'center' })

    fig.arrow(658, 164, 658, 204, { color: warm, width: 1.8, head: 6 })

    fig.rect(570, 206, 176, 84, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(658, 232, 'Recheck Role', { size: 15.5, weight: 700, color: warm, align: 'center' })
    fig.text(658, 260, 'on every call', { size: 15, color: c.textPrimary, align: 'center' })

    return fig.render()
}

export default create('dark')
