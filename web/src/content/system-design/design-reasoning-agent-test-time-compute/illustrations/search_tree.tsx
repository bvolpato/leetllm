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
    'Tree of Thoughts dependency search tree. From the root canary flag, pinning nightly scores 0.12 and fails the runtime floor. Parser v2 scores 0.74 and branches into an API shim (0.70, valid) and a removed-API call pruned at 0.18. Parser v1 scores 0.81 and branches into a sanitizer patch scoring 0.96 (selected winner) and a deferred fix rejected by security constraints at 0.39.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Tree of Thoughts Exploration for Dependency Resolution', {
        size: 22,
        weight: 700,
    })
    a.text(40, 62, 'Two-level tree expansion with invariant checking and proxy score pruning', {
        size: 16,
        color: k.mid,
    })

    // Level 0: Root Node (x=40, y=210)
    a.rect(40, 200, 150, 80, { fill: tint(k.prefill, 0.2), stroke: k.prefill, width: 2, r: 6 })
    a.text(115, 230, 'Canary Flag', { size: 16, weight: 700, align: 'center', color: k.ink })
    a.text(115, 254, 'Parser-v2 active', { size: 13, align: 'center', color: k.mid })

    // Level 1 Nodes (x=250)
    // Edges from Root to Level 1
    a.path('M190 240 H220 V135 H250', k.state)
    a.arrow(240, 135, 250, 135, k.state)

    a.path('M190 240 H250', k.fail)
    a.arrow(240, 240, 250, 240, k.fail)

    a.path('M190 240 H220 V345 H250', k.pass)
    a.arrow(240, 345, 250, 345, k.pass)

    // Level 1: Node 1 (Parser v2)
    a.rect(250, 95, 175, 80, { fill: tint(k.state, 0.15), stroke: k.state, r: 6 })
    a.text(337, 122, 'Parser v2 Branch', { size: 15, weight: 700, align: 'center', color: k.state })
    a.text(337, 144, 'Score: 0.74 (Viable)', {
        size: 13,
        weight: 600,
        align: 'center',
        color: k.ink,
    })
    a.text(337, 162, 'Expand to Depth 2', { size: 12, align: 'center', color: k.mid })

    // Level 1: Node 2 (Nightly - Pruned)
    a.rect(250, 205, 175, 70, { fill: tint(k.fail, 0.12), stroke: k.fail, dash: '4,4', r: 6 })
    a.text(337, 230, 'Nightly Build', { size: 15, weight: 700, align: 'center', color: k.fail })
    a.text(337, 252, 'Score: 0.12 (PRUNED)', {
        size: 13,
        weight: 700,
        align: 'center',
        color: k.fail,
    })
    a.text(337, 266, 'Fails runtime floor', { size: 11, align: 'center', color: k.fail })

    // Level 1: Node 3 (Parser v1)
    a.rect(250, 305, 175, 80, { fill: tint(k.pass, 0.15), stroke: k.pass, r: 6 })
    a.text(337, 332, 'Parser v1 Branch', { size: 15, weight: 700, align: 'center', color: k.pass })
    a.text(337, 354, 'Score: 0.81 (Viable)', {
        size: 13,
        weight: 600,
        align: 'center',
        color: k.ink,
    })
    a.text(337, 372, 'Expand to Depth 2', { size: 12, align: 'center', color: k.mid })

    // Edges from Level 1 to Level 2
    // From Parser v2 to 2 children
    a.path('M425 135 H465 V95 H500', k.pass)
    a.arrow(490, 95, 500, 95, k.pass)

    a.path('M425 135 H465 V175 H500', k.fail)
    a.arrow(490, 175, 500, 175, k.fail)

    // From Parser v1 to 2 children
    a.path('M425 345 H465 V305 H500', k.pass)
    a.arrow(490, 305, 500, 305, k.pass)

    a.path('M425 345 H465 V385 H500', k.fail)
    a.arrow(490, 385, 500, 385, k.fail)

    // Level 2 Nodes (x=500)
    // Child 1A: API Shim
    a.rect(500, 65, 320, 60, { fill: tint(k.pass, 0.12), stroke: k.pass, r: 6 })
    a.text(515, 90, 'API Shim', { size: 15, weight: 700, color: k.ink })
    a.text(515, 110, 'Score: 0.70 · Valid Candidate', { size: 13, color: k.pass })

    // Child 1B: Removed API (Pruned)
    a.rect(500, 145, 320, 60, { fill: tint(k.fail, 0.12), stroke: k.fail, dash: '4,4', r: 6 })
    a.text(515, 170, 'Removed API Call', { size: 15, weight: 700, color: k.fail })
    a.text(515, 190, 'Score: 0.18 · PRUNED: Invariant Failure', {
        size: 13,
        weight: 600,
        color: k.fail,
    })

    // Child 3A: Sanitizer Patch (SELECTED WINNER)
    a.rect(500, 275, 320, 65, { fill: tint(k.pass, 0.25), stroke: k.pass, width: 2, r: 6 })
    a.text(515, 300, 'Sanitizer Patch (SELECTED WINNER)', { size: 15, weight: 700, color: k.pass })
    a.text(515, 322, 'Score: 0.96 · Tests Pass & Security Verified', {
        size: 13,
        weight: 600,
        color: k.ink,
    })

    // Child 3B: Defer Fix (Pruned)
    a.rect(500, 355, 320, 60, { fill: tint(k.fail, 0.12), stroke: k.fail, dash: '4,4', r: 6 })
    a.text(515, 380, 'Defer Fix', { size: 15, weight: 700, color: k.fail })
    a.text(515, 400, 'Score: 0.39 · REJECTED: Security Floor', {
        size: 13,
        weight: 600,
        color: k.fail,
    })

    // Bottom Summary Banner
    a.rect(40, 440, 780, 38, { fill: tint(k.pass, 0.1), stroke: k.line, r: 6 })
    a.text(
        430,
        460,
        'Result: Depth-2 Tree Search surfaces optimal Sanitizer Patch (0.96) while pruning 3 flawed paths',
        { size: 14, weight: 600, align: 'center', color: k.pass },
    )

    return a.render()
}

export default create('dark')
