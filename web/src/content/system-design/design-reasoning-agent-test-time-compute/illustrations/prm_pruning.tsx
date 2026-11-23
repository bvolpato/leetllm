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
    'Stepwise Process Supervision (PRM) compared to Terminal Outcome Scoring (ORM). Terminal evaluation generates all four steps (Parse, Pin parser, Removed API, Recommend) before scoring 0.15 and failing. Stepwise PRM checks score steps 1 and 2 (0.92 and 0.74), detects the removed API failure at step 3, and terminates immediately, avoiding the generation cost of step 4.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Stepwise Process Supervision (PRM) vs. Terminal Outcome Scoring', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        62,
        'Early branch pruning prevents cascading hallucination and saves downstream generation compute',
        { size: 16, color: k.mid },
    )

    // Left Container: Terminal Outcome Scoring
    a.rect(40, 85, 370, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(60, 115, 'Terminal Scoring (ORM)', { size: 18, weight: 650, color: k.fail })
    a.text(60, 137, 'Generates full trajectory before scoring', { size: 14, color: k.mid })

    const steps = [
        { name: '1. Parse Manifest', status: 'Generated', color: k.prefill },
        { name: '2. Pin Parser v2', status: 'Generated', color: k.prefill },
        { name: '3. Removed API Call', status: 'Fatal Error', color: k.fail },
        { name: '4. Recommend Fix', status: 'Wasted Generation', color: k.fail },
    ]

    const yStart = 165
    const stepH = 46
    const gap = 16

    steps.forEach((s, i) => {
        const y = yStart + i * (stepH + gap)
        a.rect(60, y, 330, stepH, { fill: tint(s.color, 0.15), stroke: s.color, r: 6 })
        a.text(80, y + 24, s.name, { size: 15, weight: 650, color: k.ink })
        a.text(370, y + 24, s.status, { size: 13, weight: 600, align: 'right', color: s.color })
        if (i < 3) {
            a.arrow(225, y + stepH, 225, y + stepH + gap, k.line)
        }
    })

    // Terminal score callout
    a.rect(60, 420, 330, 38, { fill: tint(k.fail, 0.2), stroke: k.fail, r: 6 })
    a.text(225, 439, 'Terminal Score: 0.15 (REJECT ALL 4 STEPS)', {
        size: 14,
        weight: 700,
        align: 'center',
        color: k.fail,
    })

    // Right Container: Stepwise PRM Verification
    a.rect(430, 85, 390, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(450, 115, 'Stepwise Verification (PRM)', { size: 18, weight: 650, color: k.pass })
    a.text(450, 137, 'Verifies invariants and scores every partial step', {
        size: 14,
        color: k.mid,
    })

    // PRM Steps
    // Step 1: Pass
    a.rect(450, 165, 350, stepH, { fill: tint(k.pass, 0.15), stroke: k.pass, r: 6 })
    a.text(470, 189, '1. Parse Manifest', { size: 15, weight: 650, color: k.ink })
    a.text(780, 189, 'Score: 0.92 (PASS)', { size: 13, weight: 700, align: 'right', color: k.pass })
    a.arrow(625, 211, 625, 227, k.pass)

    // Step 2: Pass
    a.rect(450, 227, 350, stepH, { fill: tint(k.pass, 0.15), stroke: k.pass, r: 6 })
    a.text(470, 251, '2. Pin Parser v2', { size: 15, weight: 650, color: k.ink })
    a.text(780, 251, 'Score: 0.74 (PASS)', { size: 13, weight: 700, align: 'right', color: k.pass })
    a.arrow(625, 273, 625, 289, k.pass)

    // Step 3: Fail & Prune
    a.rect(450, 289, 350, stepH, { fill: tint(k.fail, 0.2), stroke: k.fail, width: 2, r: 6 })
    a.text(470, 313, '3. Removed API Call', { size: 15, weight: 700, color: k.fail })
    a.text(780, 313, 'Check: FAILS (PRUNE)', {
        size: 13,
        weight: 700,
        align: 'right',
        color: k.fail,
    })

    // Step 4: Avoided
    a.rect(450, 351, 350, stepH, { fill: tint(k.line, 0.1), stroke: k.line, dash: '4,4', r: 6 })
    a.text(470, 375, '4. Recommend Fix', { size: 15, weight: 500, color: k.mid })
    a.text(780, 375, 'NEVER GENERATED', { size: 13, weight: 700, align: 'right', color: k.mid })

    // Savings summary badge
    a.rect(450, 412, 350, 46, { fill: tint(k.pass, 0.15), stroke: k.pass, r: 6 })
    a.text(625, 429, 'Compute Saved: 25% Token Generation', {
        size: 15,
        weight: 700,
        align: 'center',
        color: k.pass,
    })
    a.text(625, 447, 'Immediate backtracking frees budget for viable branches', {
        size: 13,
        align: 'center',
        color: k.mid,
    })

    return a.render()
}

export default create('dark')
