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
    'Per-image neural network prediction budgets across diffusion sampling strategies. Traditional DDPM requires 1000 evaluations. Standard DDIM with 2-branch classifier-free guidance requires 100 evaluations (50 steps x 2). Accelerated DPM-Solver uses 50 evaluations. Distilled flow matching and turbo models reduce compute to 4 to 8 evaluations for sub-second serving.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Diffusion Sampling Schedules: Compute Budget & Latency', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        58,
        'Total denoiser network evaluations per image across numerical solvers and distillation',
        { size: 15, color: k.mid },
    )

    // Four schedules
    const schedules = [
        {
            title: 'DDPM Ancestral Sampling',
            badge: 'CLASSICAL',
            steps: '1,000 steps × 1 branch',
            evals: 1000,
            barW: 520,
            latency: '~25.0 s / img',
            fidelity: 'High diversity, excessive compute',
            tone: k.fail,
            y: 95,
        },
        {
            title: 'Standard DDIM / Euler + CFG',
            badge: 'WORKHORSE',
            steps: '50 steps × 2 branches (cond + uncond)',
            evals: 100,
            barW: 340,
            latency: '~1.8 s / img',
            fidelity: 'Balanced fidelity & text adherence',
            tone: k.wait,
            y: 190,
        },
        {
            title: 'High-Order DPM-Solver++ (CFG)',
            badge: 'OPTIMIZED',
            steps: '25 steps × 2 branches',
            evals: 50,
            barW: 220,
            latency: '~0.9 s / img',
            fidelity: 'High fidelity with adaptive step size',
            tone: k.decode,
            y: 285,
        },
        {
            title: 'Distilled Flow / Rectified (SDXL-Turbo, LCM)',
            badge: 'REAL-TIME',
            steps: '4–8 steps × 1 branch (CFG distilled)',
            evals: 6,
            barW: 90,
            latency: '~0.15 s / img',
            fidelity: 'Sub-second real-time interactive canvas',
            tone: k.pass,
            y: 380,
        },
    ]

    schedules.forEach((s) => {
        // Container
        a.rect(40, s.y, 780, 80, { fill: tint(s.tone, 0.04), stroke: tint(s.tone, 0.25), r: 8 })

        // Title and badge
        a.cell(56, s.y + 14, 95, 22, s.badge, {
            fill: tint(s.tone, 0.15),
            stroke: tint(s.tone, 0.4),
            color: s.tone,
            weight: 700,
        })
        a.text(160, s.y + 25, s.title, { size: 16, weight: 700 })
        a.text(500, s.y + 25, s.steps, { size: 15, mono: true, color: k.mid })
        a.text(730, s.y + 25, s.latency, { size: 15, mono: true, weight: 700, color: s.tone })

        // Progress bar background
        const barStartX = 56
        const barY = s.y + 45
        a.rect(barStartX, barY, 520, 22, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 4 })
        // Progress fill
        a.rect(barStartX, barY, s.barW, 22, { fill: s.tone, r: 4 })

        // Evaluation count text
        a.text(barStartX + s.barW + 12, barY + 11, `${s.evals} evals`, {
            size: 15,
            mono: true,
            weight: 700,
            color: k.ink,
        })
        // Note
        a.text(600, barY + 11, s.fidelity, { size: 15, color: k.mid })
    })

    // Footer note
    a.text(
        40,
        480,
        'Evaluations scale directly with batch size and GPU FLOPs; distillation trades structural flexibility for deterministic 1-step paths.',
        { size: 15, color: k.faint },
    )

    return a.render()
}

export default create('dark')
