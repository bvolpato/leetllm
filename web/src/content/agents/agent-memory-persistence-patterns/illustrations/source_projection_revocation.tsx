import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 375
export const alt =
    'Three revocation guards intercepting stale memory projections: (1) Source Tombstone at v3 overrides stale v2 index and denies delayed sync; (2) Live ACL check blocks recall and writes when repository dev grant is removed even if index matches v4; (3) Tool-call permission re-verification guards already assembled in-flight prompts holding v2 text.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const red = fig.tone('red')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')

    // Column headers
    fig.text(148, 22, 'Revocation Trigger', { size: 14, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(440, 22, 'Stale State Still Present', { size: 14, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(748, 22, 'Enforcement Guard', { size: 14, weight: 700, color: c.textSecondary, align: 'center' })

    const rows = [
        {
            num: '1. Tombstone (t = 103)',
            trigger: 'Source v3: deleted',
            stale: 'Index still holds v2',
            guard: 'DENY Recall + Delayed Sync',
            detail: 'tombstone beats older index',
            tone: red,
        },
        {
            num: '2. Grant Removed',
            trigger: 'ACL: dev revoked',
            stale: 'Index matches v4',
            guard: 'DENY via Live ACL Lookup',
            detail: 'blocks recall and writes',
            tone: red,
        },
        {
            num: '3. In-Flight Prompt',
            trigger: 'Prompt already sent',
            stale: 'Model context holds v2 text',
            guard: 'RECHECK at Tool Call',
            detail: 'host verifies every action',
            tone: warm,
        },
    ]

    rows.forEach((r, idx) => {
        const y = 50 + idx * 106
        const cy = y + 38

        // Trigger box
        fig.rect(20, y, 256, 76, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.08 : 0.13),
            stroke: tint(blue, c.bg, 0.55),
            strokeWidth: 1.4,
            radius: 8,
        })
        fig.text(34, y + 23, r.num, { size: 13.5, weight: 700, color: r.tone })
        fig.text(34, y + 49, r.trigger, { size: 13, mono: true, color: c.textPrimary })

        fig.arrow(278, cy, 316, cy, { color: c.textMuted, width: 1.7, head: 6 })

        // Stale copy
        fig.rect(320, y + 6, 240, 64, {
            fill: tint(c.borderSubtle, c.bg, theme === 'light' ? 0.28 : 0.24),
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
            radius: 8,
        })
        fig.text(440, cy, r.stale, { size: 13, color: c.textSecondary, align: 'center' })

        // Red/warm shield arrow into guard
        fig.arrow(562, cy, 610, cy, { color: r.tone, width: 2, head: 7 })

        // Guard box
        fig.rect(614, y, 266, 76, {
            fill: tint(r.tone, c.bg, theme === 'light' ? 0.14 : 0.22),
            stroke: r.tone,
            strokeWidth: 1.8,
            radius: 8,
        })
        fig.text(747, y + 25, r.guard, { size: 14, weight: 700, color: r.tone, align: 'center' })
        fig.text(747, y + 51, r.detail, { size: 12.5, color: c.textPrimary, align: 'center' })
    })

    return fig.render()
}

export default create('dark')
