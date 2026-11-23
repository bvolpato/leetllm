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
    'Reasoning agent architecture with test-time compute. A gateway checks authentication and reserves token budget. A difficulty router selects an adaptive search budget: single fast path, Best-of-3, or capped tree search. Candidates execute with prefix KV cache reuse and converge at a two-stage verifier (exact deterministic checks before learned proxy scores). The release gate returns an eligible solution or safely abstains.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Reasoning Agent Test-Time Compute Architecture', { size: 22, weight: 700 })
    a.text(
        40,
        62,
        'Dynamic search budget allocation, shared prefix execution, and deterministic-first verification',
        { size: 16, color: k.mid },
    )

    // 4 Stages Layout
    // Stage 1: Ingestion & Gateway (x=40, w=170)
    a.rect(40, 90, 175, 375, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(55, 118, '1. Gateway & Budget', { size: 16, weight: 700, color: k.prefill })

    a.rect(55, 145, 145, 70, { fill: tint(k.prefill, 0.15), stroke: k.prefill, r: 6 })
    a.text(127, 170, 'Client Request', { size: 15, weight: 650, align: 'center', color: k.ink })
    a.text(127, 192, 'Token Quotas', { size: 13, align: 'center', color: k.mid })

    a.arrow(127, 215, 127, 245, k.line)

    a.rect(55, 245, 145, 80, { fill: tint(k.state, 0.15), stroke: k.state, r: 6 })
    a.text(127, 270, 'Budget Reserve', { size: 15, weight: 650, align: 'center', color: k.ink })
    a.text(127, 292, 'Cap: 4,000 tokens', { size: 13, mono: true, align: 'center', color: k.state })
    a.text(127, 310, 'Concurrency Lock', { size: 12, align: 'center', color: k.mid })

    a.arrow(200, 285, 235, 285, k.prefill)

    // Stage 2: Adaptive Difficulty Router (x=235, w=245)
    a.rect(235, 90, 245, 375, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(250, 118, '2. Difficulty Router', { size: 16, weight: 700, color: k.state })

    // 3 Lanes
    const lanes = [
        { name: 'Fast Lane', desc: '1 path · Greedy (1x)', color: k.pass, y: 150 },
        { name: 'Medium Lane', desc: 'Best-of-3 Sampling (3x)', color: k.state, y: 245 },
        { name: 'Deep Search', desc: 'Capped Tree / MCTS (8x)', color: k.wait, y: 340 },
    ]

    lanes.forEach((l) => {
        a.rect(250, l.y, 215, 75, { fill: tint(l.color, 0.15), stroke: l.color, r: 6 })
        a.text(265, l.y + 25, l.name, { size: 15, weight: 700, color: l.color })
        a.text(265, l.y + 48, l.desc, { size: 13, color: k.mid })
        a.arrow(465, l.y + 37, 495, 275, l.color)
    })

    // Stage 3: Execution & Dual Verification (x=495, w=200)
    a.rect(495, 90, 200, 375, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(510, 118, '3. Dual Verifier', { size: 16, weight: 700, color: k.decode })

    // Radix Prefix Engine
    a.rect(510, 145, 170, 60, { fill: tint(k.decode, 0.15), stroke: k.decode, r: 6 })
    a.text(595, 170, 'Radix Prefix KV', { size: 14, weight: 700, align: 'center', color: k.decode })
    a.text(595, 190, 'Shared Stem Reuse', { size: 12, align: 'center', color: k.mid })

    a.arrow(595, 205, 595, 235, k.line)

    // Verification Step A: Exact checks
    a.rect(510, 235, 170, 85, { fill: tint(k.fail, 0.12), stroke: k.fail, r: 6 })
    a.text(595, 258, '1. Exact Invariants', {
        size: 14,
        weight: 700,
        align: 'center',
        color: k.fail,
    })
    a.text(595, 278, 'Unit Tests / Syntax', { size: 12, align: 'center', color: k.ink })
    a.text(595, 298, 'Zero False-Accept', { size: 12, weight: 600, align: 'center', color: k.fail })

    a.arrow(595, 320, 595, 345, k.line)

    // Verification Step B: Learned PRM / ORM
    a.rect(510, 345, 170, 75, { fill: tint(k.pass, 0.12), stroke: k.pass, r: 6 })
    a.text(595, 368, '2. Learned PRM / ORM', {
        size: 14,
        weight: 700,
        align: 'center',
        color: k.pass,
    })
    a.text(595, 388, 'Proxy Quality Score', { size: 12, align: 'center', color: k.ink })
    a.text(595, 406, 'Stepwise Pruning', { size: 12, align: 'center', color: k.mid })

    a.arrow(680, 382, 715, 275, k.pass)

    // Stage 4: Release Gate (x=715, w=105)
    a.rect(715, 90, 105, 375, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(725, 118, '4. Release', { size: 15, weight: 700, color: k.pass })

    a.rect(725, 185, 85, 80, { fill: tint(k.pass, 0.2), stroke: k.pass, r: 6 })
    a.text(767, 215, 'Release', { size: 15, weight: 700, align: 'center', color: k.pass })
    a.text(767, 238, 'Verified', { size: 13, align: 'center', color: k.ink })

    a.rect(725, 305, 85, 80, { fill: tint(k.fail, 0.15), stroke: k.fail, r: 6 })
    a.text(767, 335, 'Abstain', { size: 15, weight: 700, align: 'center', color: k.fail })
    a.text(767, 358, 'Fallback', { size: 13, align: 'center', color: k.mid })

    return a.render()
}

export default create('dark')
