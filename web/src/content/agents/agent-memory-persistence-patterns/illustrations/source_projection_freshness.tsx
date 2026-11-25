import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 370
export const alt =
    'Two-track timeline comparing authoritative Source Store versus Async Search Index across t=101 (v1 matches v1 before TTL 200: returns command), t=102 (source updated to v2 while index lags at v1: stale read blocked until reindex), and t=200 (exclusive expiry limit reached: returns empty).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')
    const blue = fig.tone('blue')

    // Track labels
    fig.text(24, 96, 'Source Store', { size: 14, weight: 700, color: blue })
    fig.text(24, 114, '(authoritative)', { size: 12, color: c.textSecondary })

    fig.text(24, 190, 'Async Index', { size: 14, weight: 700, color: c.textPrimary })
    fig.text(24, 208, '(projection)', { size: 12, color: c.textSecondary })

    fig.text(24, 286, 'Read Result', { size: 14, weight: 700, color: c.textPrimary })

    const xStart = 160
    const xEnd = 860

    // Timeline axis at top
    fig.arrow(xStart, 42, xEnd + 8, 42, { color: c.textMuted, width: 1.4, head: 6 })
    const checkpoints = [
        { x: 240, label: 't = 101', sub: 'in sync', tone: green },
        { x: 486, label: 't = 102', sub: 'index lags', tone: warm },
        { x: 752, label: 't = 200', sub: 'TTL expiry', tone: red },
    ]
    for (const cp of checkpoints) {
        fig.line(cp.x, 42, cp.x, 250, {
            color: cp.tone,
            width: cp.label === 't = 200' ? 2 : 1.3,
            dash: '4 4',
            opacity: 0.75,
        })
        fig.circle(cp.x, 42, 5, { fill: cp.tone })
        fig.text(cp.x, 22, `${cp.label} · ${cp.sub}`, {
            size: 13.5,
            mono: true,
            weight: 700,
            color: cp.tone,
            align: 'center',
        })
    }

    // Track 1: Source Store bars (v1 until t=102, v2 until t=200, expired >=200)
    const barH = 44
    const ySrc = 82
    fig.rect(xStart, ySrc, 260, barH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: green,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(xStart + 130, ySrc + 22, 't3: v1 (exp 200)', { size: 13.5, mono: true, weight: 700, color: green, align: 'center' })

    fig.rect(424, ySrc, 326, barH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(587, ySrc + 22, 't3: v2 updated (exp 200)', { size: 13.5, mono: true, weight: 700, color: blue, align: 'center' })

    fig.rect(754, ySrc, 106, barH, {
        fill: tint(red, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: red,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(807, ySrc + 22, 'expired', { size: 13.5, mono: true, weight: 700, color: red, align: 'center' })

    // Track 2: Async Index bars (v1 lags past t=102 until sync -> v2 -> expired)
    const yIdx = 176
    fig.rect(xStart, yIdx, 260, barH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: green,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(xStart + 130, yIdx + 22, 'index: v1 (matches)', { size: 13.5, mono: true, weight: 700, color: green, align: 'center' })

    fig.rect(424, yIdx, 148, barH, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.18 : 0.26),
        stroke: warm,
        strokeWidth: 1.8,
        radius: 6,
    })
    fig.text(498, yIdx + 22, 'v1 (STALE lag)', { size: 13, mono: true, weight: 700, color: warm, align: 'center' })

    fig.rect(576, yIdx, 174, barH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.12 : 0.18),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(663, yIdx + 22, 'synced: v2', { size: 13, mono: true, weight: 700, color: blue, align: 'center' })

    fig.rect(754, yIdx, 106, barH, {
        fill: tint(red, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: red,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(807, yIdx + 22, 't >= 200', { size: 13, mono: true, weight: 700, color: red, align: 'center' })

    // Read Outcome badges aligned under the 3 checkpoints
    const outcomes = [
        { cx: 266, w: 204, title: 'ALLOW · v1 = v1', sub: 'pytest -q tests/attn.py', tone: green },
        { cx: 498, w: 212, title: 'BLOCK · v1 != v2', sub: 'wait for async sync', tone: warm },
        { cx: 752, w: 212, title: 'EMPTY · t >= 200', sub: 'exclusive TTL limit', tone: red },
    ]
    for (const o of outcomes) {
        fig.rect(o.cx - o.w / 2, 260, o.w, 60, {
            fill: tint(o.tone, c.bg, theme === 'light' ? 0.13 : 0.2),
            stroke: o.tone,
            strokeWidth: 1.7,
            radius: 8,
        })
        fig.text(o.cx, 280, o.title, { size: 13.5, mono: true, weight: 700, color: o.tone, align: 'center' })
        fig.text(o.cx, 303, o.sub, { size: 12.5, mono: o.tone === green, color: c.textPrimary, align: 'center' })
    }

    fig.text(510, 348, 'Read path verifies version equality and t < exp before returning any indexed projection.', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
