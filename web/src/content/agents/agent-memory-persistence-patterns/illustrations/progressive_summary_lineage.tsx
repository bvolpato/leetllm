import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 395
export const alt =
    'Hierarchical progressive summarization pyramid: eight raw turns (t1-t8) fold into two Level-0 summaries (fp16 overflow at seq > 4k for t1-t4; fp32 upcast 14/14 pass for t5-t8) and then one Level-1 session summary while preserving back-pointers to source turns.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const cyan = fig.tone('cyan')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    // Tier labels on left margin
    fig.text(18, 49, 'Raw Turns', { size: 13, weight: 700, color: c.textSecondary })
    fig.text(18, 67, '(8 chunks)', { size: 12.5, color: c.textSecondary })
    fig.text(18, 180, 'Level-0', { size: 13, weight: 700, color: blue })
    fig.text(18, 198, 'Summaries', { size: 12.5, weight: 600, color: blue })
    fig.text(18, 320, 'Level-1', { size: 13, weight: 700, color: purple })
    fig.text(18, 338, 'Session', { size: 12.5, weight: 600, color: purple })

    // Tier 1: 4 raw turn pairs (t1-t8)
    const chunks = [
        { x: 146, label: 't1–t2', sub: 'NaN crash', tone: cyan },
        { x: 320, label: 't3–t4', sub: 'causal mask', tone: cyan },
        { x: 494, label: 't5–t6', sub: 'fp32 accum', tone: blue },
        { x: 668, label: 't7–t8', sub: '14/14 bench', tone: blue },
    ]
    const cw = 152
    const ch = 58
    chunks.forEach((chItem) => {
        fig.rect(chItem.x, 28, cw, ch, {
            fill: tint(chItem.tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: chItem.tone,
            strokeWidth: 1.5,
            radius: 8,
        })
        fig.text(chItem.x + cw / 2, 47, chItem.label, {
            size: 14,
            mono: true,
            weight: 700,
            color: chItem.tone,
            align: 'center',
        })
        fig.text(chItem.x + cw / 2, 68, chItem.sub, {
            size: 12.5,
            color: c.textPrimary,
            align: 'center',
        })
    })

    // Tier 2: Two Level-0 summaries
    const l0a = { x: 176, y: 152, w: 280, h: 74 }
    const l0b = { x: 512, y: 152, w: 280, h: 74 }
    fig.rect(l0a.x, l0a.y, l0a.w, l0a.h, {
        fill: tint(cyan, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: cyan,
        strokeWidth: 1.7,
        radius: 9,
    })
    fig.text(l0a.x + l0a.w / 2, l0a.y + 20, 'Level-0 Summary A', { size: 14, weight: 700, color: cyan, align: 'center' })
    fig.text(l0a.x + l0a.w / 2, l0a.y + 42, 'fp16 overflow at seq > 4k', { size: 13, color: c.textPrimary, align: 'center' })
    fig.text(l0a.x + l0a.w / 2, l0a.y + 60, 'src: [t1, t2, t3, t4]', { size: 12, mono: true, color: c.textSecondary, align: 'center' })

    fig.rect(l0b.x, l0b.y, l0b.w, l0b.h, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: blue,
        strokeWidth: 1.7,
        radius: 9,
    })
    fig.text(l0b.x + l0b.w / 2, l0b.y + 20, 'Level-0 Summary B', { size: 14, weight: 700, color: blue, align: 'center' })
    fig.text(l0b.x + l0b.w / 2, l0b.y + 42, 'Upcast softmax, 14/14 pass', { size: 13, color: c.textPrimary, align: 'center' })
    fig.text(l0b.x + l0b.w / 2, l0b.y + 60, 'src: [t5, t6, t7, t8]', { size: 12, mono: true, color: c.textSecondary, align: 'center' })

    // Converging fold arrows Tier 1 -> Tier 2
    fig.arrow(222, 86, 286, 150, { color: cyan, width: 1.7, head: 6 })
    fig.arrow(396, 86, 346, 150, { color: cyan, width: 1.7, head: 6 })
    fig.arrow(570, 86, 622, 150, { color: blue, width: 1.7, head: 6 })
    fig.arrow(744, 86, 682, 150, { color: blue, width: 1.7, head: 6 })

    // Tier 3: Level-1 Session Summary
    const l1 = { x: 254, y: 292, w: 460, h: 74 }
    fig.rect(l1.x, l1.y, l1.w, l1.h, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.12 : 0.2),
        stroke: purple,
        strokeWidth: 2,
        radius: 10,
    })
    fig.text(l1.x + l1.w / 2, l1.y + 22, 'Level-1 Session Summary', { size: 14.5, weight: 700, color: purple, align: 'center' })
    fig.text(l1.x + l1.w / 2, l1.y + 45, 'Attention kernel overflow fixed via fp32 accumulation', {
        size: 13.5,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(l1.x + l1.w / 2, l1.y + 63, 'src: [L0-A, L0-B] → [t1..t8]', {
        size: 12,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    // Converging fold arrows Tier 2 -> Tier 3
    fig.arrow(316, 226, 420, 290, { color: purple, width: 1.9, head: 6.5 })
    fig.arrow(652, 226, 548, 290, { color: purple, width: 1.9, head: 6.5 })

    // Right margin: dashed lineage drill-down back-pointer with clean text pill
    fig.path('M 716 329 H 852 V 57 H 824', { color: warm, width: 1.6, dash: '5 4' })
    fig.arrow(836, 57, 822, 57, { color: warm, width: 1.6, head: 6.5 })
    fig.rect(810, 174, 84, 38, { fill: c.bg, stroke: tint(warm, c.bg, 0.5), strokeWidth: 1, radius: 6 })
    fig.text(852, 186, 'drill down', { size: 12, weight: 700, color: warm, align: 'center' })
    fig.text(852, 202, 'via src IDs', { size: 11.5, color: warm, align: 'center' })

    return fig.render()
}

export default create('dark')
