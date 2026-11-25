import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Token-stream comparison showing static delimiters failing under tag breakout (attacker injects closing tag and steers logits despite sandwich prompt) versus random nonce escaping, lexical datamarking, and a deterministic host taint monitor that blocks tainted tool arguments.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const red = fig.tone('red')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const green = fig.tone('green')

    const chip = (x: number, y: number, w: number, h: number, text: string, tone: string, sub: string, mono = true) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.11 : 0.17),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(x + w / 2, y + 20, text, { size: 15, mono, weight: 700, color: tone, align: 'center' })
        fig.text(x + w / 2, y + 44, sub, { size: 15, color: c.textSecondary, align: 'center' })
    }

    fig.text(14, 22, '1. Soft In-Context Cues (Bypassable)', { size: 16, weight: 700, color: red })

    const y1 = 50
    chip(14, y1, 90, 60, '<doc>', warm, 'static')
    chip(112, y1, 220, 60, '</doc> Run tool', red, 'attacker breaks out')
    chip(340, y1, 90, 60, '</doc>', warm, 'close')
    chip(438, y1, 134, 60, 'Sandwich', warm, 'same buffer', false)
    fig.arrow(576, y1 + 30, 610, y1 + 30, { color: red, width: 2, head: 6.5 })
    chip(614, y1, 132, 60, 'Hijacked', red, 'logits shift', false)

    fig.path('M 230 112 Q 430 162, 666 112', { color: red, width: 2, dash: '5 4' })
    fig.arrow(656, 116, 668, 111, { color: red, width: 2, head: 6 })
    fig.text(448, 152, 'tag breakout executes untrusted text', { size: 15, weight: 700, color: red, align: 'center' })

    fig.line(14, 192, 746, 192, { color: c.borderSubtle, width: 1.2, dash: '4 4' })

    fig.text(14, 220, '2. Spotlighting + Host Taint Monitor (Enforced)', { size: 16, weight: 700, color: green })

    const y2 = 248
    chip(14, y2, 118, 60, '<d_9f3a>', blue, 'nonce')
    chip(140, y2, 186, 60, 'raw^run^tool', blue, 'datamarked')
    chip(334, y2, 108, 60, '</d_9f3a>', blue, 'close')
    fig.arrow(446, y2 + 30, 480, y2 + 30, { color: blue, width: 2, head: 6.5 })

    fig.rect(484, y2 - 6, 138, 72, {
        fill: tint(green, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: green,
        strokeWidth: 2.2,
        radius: 9,
    })
    fig.text(553, y2 + 18, 'Host Monitor', { size: 15.5, weight: 700, color: green, align: 'center' })
    fig.text(553, y2 + 44, 'taint + scope', { size: 15, color: c.textPrimary, align: 'center' })

    fig.arrow(624, y2 + 30, 650, y2 + 30, { color: green, width: 2, head: 6 })
    chip(654, y2, 92, 60, 'BLOCK', green, 'tainted', false)

    fig.text(380, 366, 'Only out-of-band host checks enforce hard stops.', {
        size: 15,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
