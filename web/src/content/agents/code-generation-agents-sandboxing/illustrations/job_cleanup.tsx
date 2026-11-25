import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 385
export const alt =
    'Two-track timeline showing Slot A reuse after worker-7 exits, disk and env scrub, and worker-8 starts. When a delayed Gen-7 cleanup timer fires while worker-8 owns Slot A, targeting mutable Slot A kills live worker-8, whereas targeting immutable job_id=worker-7 becomes a safe no-op.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    // Track 1: Slot A Timeline
    fig.text(18, 68, 'Slot A', { size: 14, weight: 700, color: c.textPrimary })
    fig.text(18, 86, 'Lifecycle', { size: 13, color: c.textSecondary })
    fig.arrow(120, 34, 868, 34, { color: c.textMuted, width: 1.3, head: 6 })
    fig.text(868, 18, 'time →', { size: 12.5, color: c.textSecondary, align: 'right' })

    const bar = (x: number, y: number, w: number, h: number, title: string, sub: string, tone: string) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.13 : 0.2),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(x + w / 2, y + 18, title, { size: 13.5, weight: 700, color: tone, align: 'center' })
        fig.text(x + w / 2, y + 38, sub, { size: 12, mono: true, color: c.textPrimary, align: 'center' })
    }

    bar(124, 52, 200, 52, '1. worker-7 Exits', 'confirmed kill', blue)
    fig.arrow(326, 78, 356, 78, { color: blue, width: 1.7, head: 6 })
    bar(360, 52, 188, 52, '2. Reset Slot A', 'scrub disk & env', green)
    fig.arrow(550, 78, 580, 78, { color: green, width: 1.7, head: 6 })
    bar(584, 52, 284, 52, '3. worker-8 Owns Slot A', 'live execution running', warm)

    // Track 2: Delayed Gen-7 Timer firing during worker-8 execution
    const fireX = 720
    fig.text(24, 152, 'Gen-7\nReaper', { size: 14, weight: 700, color: red })
    fig.line(224, 104, 224, 162, { color: red, width: 1.5, dash: '4 4' })
    fig.arrow(224, 162, fireX - 8, 162, { color: red, width: 1.8, dash: '5 4', head: 6.5 })
    fig.text(470, 146, 'delayed Gen-7 cleanup timer arrives late', {
        size: 13,
        weight: 600,
        color: red,
        align: 'center',
    })
    fig.circle(fireX, 162, 6, { fill: red })
    fig.line(fireX, 104, fireX, 198, { color: red, width: 1.8, dash: '3 3' })
    fig.text(fireX + 12, 162, 'fires while worker-8 runs!', { size: 13, weight: 700, color: red })

    // Fork into Mutable vs Immutable targeting outcomes
    fig.line(24, 208, 876, 208, { color: c.borderSubtle, width: 1.1, dash: '4 4' })

    // Left outcome: Mutable Slot A (DANGEROUS)
    fig.rect(36, 232, 396, 126, {
        fill: tint(red, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: red,
        strokeWidth: 1.8,
        radius: 10,
    })
    fig.text(234, 258, 'Reap by Mutable Name: slot="A"', {
        size: 14.5,
        mono: true,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.text(234, 286, 'Slot A now points to live worker-8', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
    })
    fig.rect(96, 308, 276, 34, {
        fill: tint(red, c.bg, theme === 'light' ? 0.18 : 0.28),
        stroke: red,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(234, 325, 'HAZARD: Kills worker-8 early', {
        size: 13.5,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Right outcome: Immutable job_id (SAFE)
    fig.rect(468, 232, 396, 126, {
        fill: tint(green, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: green,
        strokeWidth: 1.8,
        radius: 10,
    })
    fig.text(666, 258, 'Reap by Immutable ID: job_id="worker-7"', {
        size: 14.5,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(666, 286, 'job_id=worker-7 already exited & gone', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
    })
    fig.rect(528, 308, 276, 34, {
        fill: tint(green, c.bg, theme === 'light' ? 0.18 : 0.28),
        stroke: green,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(666, 325, 'SAFE: No-op · worker-8 untouched', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
