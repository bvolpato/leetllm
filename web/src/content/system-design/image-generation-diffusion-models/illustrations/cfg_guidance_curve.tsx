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
    'Classifier-free guidance extrapolation in score space. The guided prediction extrapolates linearly from the unconditional prediction toward the prompt-conditioned prediction scaled by guidance factor w. Standard scales between 4 and 7.5 sharpen semantic adherence, while excessive guidance above 12 causes saturation and clipping artifacts.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Classifier-Free Guidance (CFG) Dynamics & Extrapolation', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        58,
        'eps_guided = eps_uncond + w * (eps_cond - eps_uncond) across guidance scale regimes',
        { size: 15, mono: true, color: k.mid },
    )

    // Left Panel: Vector Extrapolation Diagram
    a.rect(40, 95, 450, 365, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 110, 110, 24, 'VECTOR SPACE', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(176, 122, 'Score Space Extrapolation', { size: 15, weight: 700 })

    // Origin and Vectors
    const ox = 90
    const oy = 380

    // Axis lines
    a.line(ox, oy, ox + 370, oy, k.line, { width: 1.5 })
    a.line(ox, oy, ox, oy - 230, k.line, { width: 1.5 })
    a.text(ox + 355, oy + 20, 'Dim 1', { size: 15, color: k.mid })
    a.text(ox - 35, oy - 215, 'Dim 2', { size: 15, color: k.mid })

    // Points:
    // eps_uncond at (ox + 60, oy - 50)
    const ux = ox + 60
    const uy = oy - 50

    // eps_cond at (ox + 120, oy - 90) -> delta = (+60, -40)
    const cx = ox + 120
    const cy = oy - 90

    // Vector to eps_uncond
    a.arrow(ox, oy, ux, uy, k.state, { width: 2 })
    a.dot(ux, uy, 5, k.state)
    a.text(ux - 15, uy - 18, 'eps_uncond (w = 0)', {
        size: 15,
        mono: true,
        weight: 700,
        color: k.state,
    })

    // Vector from uncond to cond
    a.arrow(ux, uy, cx, cy, k.prefill, { width: 2 })
    a.dot(cx, cy, 5, k.prefill)
    a.text(cx + 10, cy - 15, 'eps_cond (w = 1)', {
        size: 15,
        mono: true,
        weight: 700,
        color: k.prefill,
    })

    // Extrapolated line (w=4 to w=7.5)
    // delta = (60, -40)
    // w = 4 -> ux + 3 * 60 = 240, uy - 3 * 40 = oy - 170
    const w4x = ux + 3 * 50
    const w4y = uy - 3 * 35
    a.arrow(cx, cy, w4x, w4y, k.pass, { width: 2.5 })
    a.dot(w4x, w4y, 6, k.pass)
    a.text(w4x + 10, w4y - 12, 'w = 4.0 - 7.5 (Optimal Sweet Spot)', {
        size: 15,
        weight: 700,
        color: k.pass,
    })

    // w = 12 (oversaturated)
    const w12x = ux + 5.5 * 50
    const w12y = uy - 5.5 * 35
    a.arrow(w4x, w4y, w12x, w12y, k.fail, { width: 2, dash: '3,3' })
    a.dot(w12x, w12y, 5, k.fail)
    a.text(w12x - 40, w12y - 15, 'w >= 12 (Oversaturated / Burnt)', {
        size: 15,
        weight: 700,
        color: k.fail,
    })

    // Right Panel: Regimes & Artifacts
    a.rect(510, 95, 310, 365, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(526, 110, 110, 24, 'CFG REGIMES', {
        fill: tint(k.wait, 0.15),
        stroke: tint(k.wait, 0.4),
        color: k.wait,
        weight: 700,
    })
    a.text(646, 122, 'Quality Trade-offs', { size: 15, weight: 700 })

    const regimes = [
        {
            range: 'w = 1.0 (No Extrapolation)',
            desc: 'Standard conditional score. Diverse outputs but often ignores complex prompt constraints.',
            tone: k.mid,
            y: 150,
        },
        {
            range: 'w = 4.0 - 7.5 (Recommended)',
            desc: 'Optimal prompt fidelity and visual punch. Balances semantic compliance and realistic dynamic range.',
            tone: k.pass,
            y: 225,
        },
        {
            range: 'w = 8.0 - 10.0 (High Contrast)',
            desc: 'Very sharp edges and vivid colors, but fine textures begin to show unnatural rigidity.',
            tone: k.wait,
            y: 300,
        },
        {
            range: 'w >= 12.0 (Pathological)',
            desc: 'Latents clip at numerical boundaries. Results in severe oversaturation, chromatic halos, and color burns.',
            tone: k.fail,
            y: 375,
        },
    ]

    regimes.forEach((r) => {
        a.rect(526, r.y, 278, 65, { fill: tint(r.tone, 0.06), stroke: tint(r.tone, 0.25), r: 6 })
        a.text(538, r.y + 20, r.range, { size: 15, weight: 700, color: r.tone })
        a.text(538, r.y + 44, r.desc, { size: 15, color: k.mid, w: 260 })
    })

    return a.render()
}

export default create('dark')
