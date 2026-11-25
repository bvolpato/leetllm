import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 880
export const height = 450
export const alt =
    'Taint propagation severing exfiltration (Secret Read and tainted Web Chunk combine at Taint Join and are denied by the Host Monitor), paired with a 5x4 defense guarantee matrix comparing Static Delimiters, Spotlighting, Input Classifier, Taint + Policy, and Dual-LLM Split across Breakout, Encoded, Exfil, and Adaptive attacks.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const purple = fig.tone('purple')
    const red = fig.tone('red')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const blue = fig.tone('blue')

    // Top: Clean horizontal taint-propagation chain
    fig.text(440, 20, 'Taint Propagation Severs Exfiltration', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const steps = [
        { x: 40, title: 'Secret Read', sub: 'private data', tone: purple },
        { x: 256, title: 'Web Chunk', sub: 'tainted input', tone: red },
        { x: 472, title: 'Taint Join', sub: 'combined state', tone: warm },
        { x: 688, title: 'Host Monitor', sub: 'DENY egress', tone: green },
    ]
    const sw = 156
    const sh = 54
    const sy = 42
    steps.forEach((st, i) => {
        fig.rect(st.x, sy, sw, sh, {
            fill: tint(st.tone, c.bg, theme === 'light' ? 0.11 : 0.17),
            stroke: st.tone,
            strokeWidth: i === 3 ? 2 : 1.5,
            radius: 8,
        })
        fig.text(st.x + sw / 2, sy + 19, st.title, {
            size: 14,
            weight: 700,
            color: st.tone,
            align: 'center',
        })
        fig.text(st.x + sw / 2, sy + 39, st.sub, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
        if (i < steps.length - 1) {
            fig.arrow(st.x + sw + 4, sy + sh / 2, steps[i + 1]!.x - 4, sy + sh / 2, {
                color: st.tone,
                width: 1.9,
                head: 6.5,
            })
        }
    })

    // Subtle divider
    fig.line(40, 120, 840, 120, { color: c.borderSubtle, width: 1.1, dash: '4 4' })

    // Bottom: Frameless 5x4 Defense Matrix with clear semantic encoding (0=Fail/Open, 1=Partial, 2=Enforced)
    fig.text(440, 144, 'Defense Strength Across Prompt-Injection Failure Modes', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const rows = [
        { name: 'Static Delimiters', cells: [['Fail', 0], ['Fail', 0], ['Fail', 0], ['Fail', 0]] as const },
        { name: 'Spotlighting', cells: [['Strong', 1], ['Partial', 1], ['Open', 0], ['Partial', 1]] as const },
        { name: 'Input Classifier', cells: [['Partial', 1], ['Fail', 0], ['Open', 0], ['Fail', 0]] as const },
        { name: 'Taint + Rules', cells: [['Host', 2], ['Blocked', 2], ['Blocked', 2], ['Blocked', 2]] as const },
        { name: 'Dual-LLM Split', cells: [['Isolated', 2], ['Isolated', 2], ['Blocked', 2], ['Blocked', 2]] as const },
    ]
    const cols = ['Breakout', 'Encoded', 'Exfiltration', 'Adaptive']

    const gridX = 236
    const gridY = 186
    const cellW = 144
    const cellH = 42
    const gap = 8

    cols.forEach((col, j) => {
        fig.text(gridX + j * (cellW + gap) + cellW / 2, gridY - 14, col, {
            size: 13.5,
            weight: 700,
            color: c.textSecondary,
            align: 'center',
        })
    })

    rows.forEach((row, i) => {
        const ry = gridY + i * (cellH + gap)
        fig.text(gridX - 16, ry + cellH / 2, row.name, {
            size: 13.5,
            weight: i >= 3 ? 700 : 600,
            color: i >= 3 ? green : c.textPrimary,
            align: 'right',
        })
        row.cells.forEach(([label, level], j) => {
            const rx = gridX + j * (cellW + gap)
            const tone = level === 2 ? green : level === 1 ? blue : c.textMuted
            const fill =
                level === 2
                    ? tint(green, c.bg, theme === 'light' ? 0.2 : 0.28)
                    : level === 1
                      ? tint(blue, c.bg, theme === 'light' ? 0.14 : 0.2)
                      : tint(c.borderSubtle, c.bg, theme === 'light' ? 0.34 : 0.26)
            fig.rect(rx, ry, cellW, cellH, {
                fill,
                stroke: level === 0 ? c.borderSubtle : tone,
                strokeWidth: level === 2 ? 1.6 : 1.1,
                radius: 6,
            })
            fig.text(rx + cellW / 2, ry + cellH / 2, label, {
                size: 13.5,
                weight: level === 2 ? 700 : 600,
                color: level === 0 ? c.textSecondary : tone,
                align: 'center',
            })
        })
    })

    return fig.render()
}

export default create('dark')
