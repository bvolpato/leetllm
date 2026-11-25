import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 415
export const alt =
    'Write guardrail pipeline starting from model proposal release_id=reranker-v17. Three authorization checks run in order: role and project (stops missing role or wrong project), release checks passed, and approval binding op-search-v17-a. Below, Request 1 applies one effect and loses its reply; Request 2 retries the same idempotency key and returns the saved result with effects still equal to 1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    fig.text(16, 20, '1. Host Authorization Checks (reranker-v17)', { size: 15.5, weight: 700, color: purple })

    const stages = [
        { x: 16, w: 162, title: '1. Role/Proj', sub: 'project=search', reject: 'no role / ads' },
        { x: 204, w: 162, title: '2. Checks', sub: 'passed = true', reject: 'check failed' },
        { x: 392, w: 176, title: '3. Approval', sub: 'op-search-v17-a', reject: 'wrong ver.' },
    ]

    const topY = 44
    const boxH = 64
    stages.forEach((st, i) => {
        const tone = i === 2 ? green : purple
        fig.rect(st.x, topY, st.w, boxH, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(st.x + st.w / 2, topY + 21, st.title, { size: 15.5, weight: 700, color: tone, align: 'center' })
        fig.text(st.x + st.w / 2, topY + 46, st.sub, { size: 15, mono: true, color: c.textPrimary, align: 'center' })

        const nextX = i < 2 ? stages[i + 1]!.x : 598
        fig.arrow(st.x + st.w + 2, topY + boxH / 2, nextX - 4, topY + boxH / 2, { color: green, width: 1.8, head: 6 })

        const cx = st.x + st.w / 2
        fig.arrow(cx, topY + boxH + 2, cx, topY + boxH + 30, { color: red, width: 1.5, head: 5.5 })
        fig.rect(cx - 72, topY + boxH + 32, 144, 30, {
            fill: tint(red, c.bg, theme === 'light' ? 0.09 : 0.15),
            stroke: tint(red, c.bg, 0.55),
            strokeWidth: 1.2,
            radius: 6,
        })
        fig.text(cx, topY + boxH + 47, `Stop: ${st.reject}`, { size: 15, weight: 600, color: red, align: 'center' })
    })

    fig.rect(600, topY, 146, boxH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: green,
        strokeWidth: 2,
        radius: 8,
    })
    fig.text(673, topY + 21, 'Write OK', { size: 15.5, weight: 700, color: green, align: 'center' })
    fig.text(673, topY + 46, 'v17-a', { size: 15, mono: true, color: c.textPrimary, align: 'center' })

    fig.line(16, 202, 744, 202, { color: c.borderSubtle, width: 1.2, dash: '4 4' })

    fig.text(16, 228, '2. Idempotent Retry at Target Service', { size: 15.5, weight: 700, color: blue })

    const pill = (x: number, y: number, w: number, h: number, text: string, tone: string, mono = false) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(x + w / 2, y + h / 2, text, { size: 15, weight: 700, mono, color: tone, align: 'center' })
    }

    const r1Y = 256
    pill(16, r1Y, 214, 46, 'Req 1 · op-v17-a', blue, true)
    fig.arrow(232, r1Y + 23, 274, r1Y + 23, { color: green, width: 1.8, head: 6 })
    pill(276, r1Y, 210, 46, 'Apply · effects=1', green, true)
    fig.arrow(488, r1Y + 23, 528, r1Y + 23, { color: warm, width: 1.8, dash: '4 3', head: 6 })
    pill(530, r1Y, 216, 46, 'Reply lost', warm)

    const r2Y = 322
    pill(16, r2Y, 214, 46, 'Req 2 · same key', blue, true)
    fig.arrow(232, r2Y + 23, 274, r2Y + 23, { color: green, width: 1.8, head: 6 })
    pill(276, r2Y, 260, 46, 'Return saved result', green)
    fig.arrow(538, r2Y + 23, 578, r2Y + 23, { color: green, width: 1.8, head: 6 })
    pill(580, r2Y, 166, 46, 'effects = 1', green, true)

    fig.text(380, 394, 'New approval mints a fresh operation ID for a distinct write.', {
        size: 15,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
