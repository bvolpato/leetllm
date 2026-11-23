import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 860
export const height = 500
export const alt =
    'Token budget reservation and concurrency cap in test-time compute. In a 4,000-token pool, candidate A and B each reserve 1,500 tokens, leaving 1,000 free. Candidate C requests 1,500 and must wait. Candidate A completes after spending 900 tokens and releases 600 tokens. Candidate C is admitted with 1,500 tokens, leaving 100 tokens free.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Token Budget Reservation and Dynamic Concurrency Settlement', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        62,
        'Hard generation ceiling: 4,000 tokens · Pessimistic reservation prevents out-of-budget OOM spills',
        { size: 16, color: k.mid },
    )

    const totalCap = 4000
    const barWidth = 490
    const scale = barWidth / totalCap
    const startX = 60

    // Phase 1: Initial Allocation
    a.rect(40, 85, 780, 160, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(60, 112, 'Phase 1: Concurrent Reservation (A: 1,500, B: 1,500)', {
        size: 17,
        weight: 650,
        color: k.state,
    })

    // Bar 1
    const y1 = 132
    a.rect(startX, y1, 1500 * scale, 42, { fill: tint(k.state, 0.35), stroke: k.state, r: 4 })
    a.text(startX + 750 * scale, y1 + 21, 'Candidate A (1,500 reserved)', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.ink,
    })

    a.rect(startX + 1500 * scale, y1, 1500 * scale, 42, {
        fill: tint(k.prefill, 0.35),
        stroke: k.prefill,
        r: 4,
    })
    a.text(startX + 2250 * scale, y1 + 21, 'Candidate B (1,500 reserved)', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.ink,
    })

    a.rect(startX + 3000 * scale, y1, 1000 * scale, 42, {
        fill: tint(k.line, 0.15),
        stroke: k.line,
        dash: '4,4',
        r: 4,
    })
    a.text(startX + 3500 * scale, y1 + 21, '1,000 Free', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.mid,
    })

    a.text(startX, y1 + 58, 'Total Reserved: 3,000 / 4,000 tokens (75% allocated)', {
        size: 14,
        color: k.mid,
    })

    // Admission outcome 1
    a.rect(575, 105, 230, 125, { fill: tint(k.fail, 0.12), stroke: k.fail, r: 6 })
    a.text(590, 130, 'Candidate C Admission', { size: 16, weight: 700, color: k.fail })
    a.text(590, 155, 'Needs: 1,500 tokens', { size: 14, mono: true, color: k.ink })
    a.text(590, 178, 'Headroom: 1,000 tokens', { size: 14, mono: true, color: k.mid })
    a.text(590, 205, 'Status: ADMISSION BLOCKED', { size: 14, weight: 700, color: k.fail })

    // Transition Arrow between phases
    a.arrow(260, 245, 260, 280, k.pass, { width: 2 })
    a.text(
        280,
        265,
        'Candidate A completes after 900 tokens → Releases 600 tokens back to headroom (1,600 free)',
        { size: 14, weight: 650, color: k.pass },
    )

    // Phase 2: Settlement & Resumption
    a.rect(40, 285, 780, 175, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(60, 312, 'Phase 2: Early Settlement & Candidate C Admission', {
        size: 17,
        weight: 650,
        color: k.pass,
    })

    // Bar 2
    const y2 = 332
    a.rect(startX, y2, 900 * scale, 42, { fill: tint(k.pass, 0.45), stroke: k.pass, r: 4 })
    a.text(startX + 450 * scale, y2 + 21, 'A: 900 Spent', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.ink,
    })

    a.rect(startX + 900 * scale, y2, 1500 * scale, 42, {
        fill: tint(k.prefill, 0.35),
        stroke: k.prefill,
        r: 4,
    })
    a.text(startX + 1650 * scale, y2 + 21, 'B: 1,500 Reserved', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.ink,
    })

    a.rect(startX + 2400 * scale, y2, 1500 * scale, 42, {
        fill: tint(k.state, 0.35),
        stroke: k.state,
        r: 4,
    })
    a.text(startX + 3150 * scale, y2 + 21, 'C: 1,500 Admitted', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.ink,
    })

    a.rect(startX + 3900 * scale, y2, 100 * scale, 42, {
        fill: tint(k.line, 0.2),
        stroke: k.line,
        r: 4,
    })
    a.text(startX + 3950 * scale, y2 - 10, '100 Free', {
        size: 12,
        weight: 600,
        align: 'center',
        color: k.mid,
    })

    a.text(
        startX,
        y2 + 58,
        'Allocation: 900 spent + 3,000 reserved = 3,900 / 4,000 tokens (97.5% committed)',
        { size: 14, color: k.mid },
    )

    // Admission outcome 2
    a.rect(575, 305, 230, 140, { fill: tint(k.pass, 0.12), stroke: k.pass, r: 6 })
    a.text(590, 330, 'Candidate C Admitted', { size: 16, weight: 700, color: k.pass })
    a.text(590, 355, 'Headroom before: 1,600', { size: 14, mono: true, color: k.ink })
    a.text(590, 378, 'Reserved: 1,500 tokens', { size: 14, mono: true, color: k.mid })
    a.text(590, 400, 'Remaining free: 100', { size: 14, mono: true, color: k.mid })
    a.text(590, 425, 'Status: IN-PROGRESS', { size: 14, weight: 700, color: k.pass })

    return a.render()
}

export default create('dark')
