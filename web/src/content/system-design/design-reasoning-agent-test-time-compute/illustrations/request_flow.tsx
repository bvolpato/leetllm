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
    'Canary release reasoning request flow. A canary request encodes one shared prefix, then branches into a hold candidate, a rollback candidate, and a promote candidate pruned early for policy violation. Surviving candidates pass through the verifier (exact invariant checks before proxy scoring), producing a verified advisory to hold rollout at 10%.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Canary Evaluation Reasoning Flow and Branch Pruning', { size: 22, weight: 700 })
    a.text(
        40,
        62,
        'Shared prompt prefix reuse, safety policy branch pruning, and two-stage invariant verification',
        { size: 16, color: k.mid },
    )

    // Col 1: Request & Shared Prefix
    a.rect(40, 90, 180, 375, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(55, 118, '1. Prefix State', { size: 16, weight: 700, color: k.prefill })

    a.rect(55, 150, 150, 80, { fill: tint(k.prefill, 0.15), stroke: k.prefill, r: 6 })
    a.text(130, 180, 'Canary Request', { size: 15, weight: 700, align: 'center', color: k.ink })
    a.text(130, 202, 'Revision 7 metrics', { size: 13, align: 'center', color: k.mid })

    a.arrow(130, 230, 130, 270, k.line)

    a.rect(55, 270, 150, 100, { fill: tint(k.decode, 0.15), stroke: k.decode, r: 6 })
    a.text(130, 300, 'Shared Prefix KV', {
        size: 15,
        weight: 700,
        align: 'center',
        color: k.decode,
    })
    a.text(130, 322, 'Policy v3 Rules', { size: 13, align: 'center', color: k.ink })
    a.text(130, 342, 'Cached in VRAM', { size: 12, mono: true, align: 'center', color: k.mid })

    // Split arrows to branches
    a.path('M205 320 H235 V175 H255', k.pass)
    a.arrow(245, 175, 255, 175, k.pass)

    a.path('M205 320 H255', k.state)
    a.arrow(245, 320, 255, 320, k.state)

    a.path('M205 320 H235 V420 H255', k.fail)
    a.arrow(245, 420, 255, 420, k.fail)

    // Col 2: Reasoning Suffixes & Pruning
    a.rect(255, 90, 225, 375, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(270, 118, '2. Parallel Suffixes', { size: 16, weight: 700, color: k.state })

    // Branch A: Hold
    a.rect(270, 140, 195, 75, { fill: tint(k.pass, 0.15), stroke: k.pass, r: 6 })
    a.text(285, 165, 'Suffix A: Hold at 10%', { size: 14, weight: 700, color: k.pass })
    a.text(285, 188, 'Latency p95 = 240 ms', { size: 12, mono: true, color: k.ink })
    a.text(285, 204, 'Status: Viable', { size: 12, color: k.pass })
    a.arrow(465, 177, 500, 240, k.pass)

    // Branch B: Rollback
    a.rect(270, 280, 195, 75, { fill: tint(k.state, 0.15), stroke: k.state, r: 6 })
    a.text(285, 305, 'Suffix B: Rollback', { size: 14, weight: 700, color: k.state })
    a.text(285, 328, 'Safe fallback path', { size: 12, color: k.ink })
    a.text(285, 344, 'Status: Viable', { size: 12, color: k.state })
    a.arrow(465, 317, 500, 290, k.state)

    // Branch C: Promote (Pruned!)
    a.rect(270, 385, 195, 65, { fill: tint(k.fail, 0.15), stroke: k.fail, dash: '4,4', r: 6 })
    a.text(285, 410, 'Suffix C: Promote 50%', { size: 14, weight: 700, color: k.fail })
    a.text(285, 432, 'PRUNED: SLA Violation', { size: 12, weight: 700, color: k.fail })

    // Col 3: Verifier
    a.rect(500, 90, 190, 375, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(515, 118, '3. Two-Stage Verifier', { size: 16, weight: 700, color: k.decode })

    a.rect(515, 155, 160, 90, { fill: tint(k.fail, 0.12), stroke: k.fail, r: 6 })
    a.text(595, 180, '1. Exact Invariants', {
        size: 14,
        weight: 700,
        align: 'center',
        color: k.fail,
    })
    a.text(595, 202, 'Rev 7 match: OK', { size: 12, align: 'center', color: k.ink })
    a.text(595, 222, 'Age <= 30s: OK', { size: 12, align: 'center', color: k.ink })

    a.arrow(595, 245, 595, 280, k.line)

    a.rect(515, 280, 160, 90, { fill: tint(k.pass, 0.12), stroke: k.pass, r: 6 })
    a.text(595, 305, '2. Proxy Scoring', { size: 14, weight: 700, align: 'center', color: k.pass })
    a.text(595, 328, 'A Score: 0.90', { size: 12, mono: true, align: 'center', color: k.pass })
    a.text(595, 348, 'B Score: 0.70', { size: 12, mono: true, align: 'center', color: k.mid })

    a.arrow(675, 325, 710, 275, k.pass)

    // Col 4: Advisory Output
    a.rect(710, 90, 110, 375, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(720, 118, '4. Advisory', { size: 15, weight: 700, color: k.pass })

    a.rect(720, 220, 90, 110, { fill: tint(k.pass, 0.2), stroke: k.pass, r: 6 })
    a.text(765, 250, 'Canary', { size: 14, weight: 700, align: 'center', color: k.pass })
    a.text(765, 275, 'HOLD', { size: 18, weight: 800, align: 'center', color: k.pass })
    a.text(765, 300, 'at 10%', { size: 14, weight: 650, align: 'center', color: k.ink })

    return a.render()
}

export default create('dark')
