import React from 'react'
import type { ThemeMode } from 'vizmatic'
export { createFilm } from './_parts/diffusion-film'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Four 12x12 heatmaps of an oak table silhouette corrupted at alpha-bar 1.000, 0.900, 0.500, and 0.001 showing structure fading into Gaussian static while paired signal and noise bars hold total variance constant.'

function buildTableAndNoise(): { clean: number[][]; eps: number[][] } {
    const clean: number[][] = Array.from({ length: 12 }, (_, r) =>
        Array.from({ length: 12 }, (_, c) => {
            if ((r === 4 || r === 5) && c >= 1 && c <= 10) return 0.95
            if (r >= 6 && r <= 10 && (c === 2 || c === 9)) return 0.8
            if (r >= 1 && r <= 3 && c >= 4 && c <= 7) return 0.35
            return -0.75
        }),
    )
    let seed = 20260401
    const rand = () => {
        seed = (seed + 0x6d2b79f5) >>> 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const eps: number[][] = Array.from({ length: 12 }, () =>
        Array.from({ length: 12 }, () => {
            const u1 = Math.max(1e-6, rand())
            const u2 = rand()
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
            return Math.max(-1.8, Math.min(1.8, z))
        }),
    )
    return { clean, eps }
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('red')
    const { clean, eps } = buildTableAndNoise()

    fig.math(
        width / 2,
        22,
        'x_t = \\sqrt{\\bar{\\alpha}_t}\\,x_0 + \\sqrt{1 - \\bar{\\alpha}_t}\\,\\epsilon, \\qquad \\epsilon \\sim \\mathcal{N}(0, \\mathbf{I})',
        { size: 16, color: c.textPrimary, align: 'center' },
    )

    const stages = [
        { t: 't = 0', ab: 1.0, snr: '∞', label: 'Clean x₀', tone: green },
        { t: 't = 250', ab: 0.9, snr: '9.0', label: 'High SNR', tone: blue },
        { t: 't = 500', ab: 0.5, snr: '1.0', label: 'Equal var.', tone: warm },
        { t: 't = 1000', ab: 0.001, snr: '0.001', label: 'Static x_T', tone: red },
    ]

    const gridSize = 144
    const startX = 24
    const stepX = 188
    const gridY = 92

    stages.forEach((st, idx) => {
        const gx = startX + idx * stepX
        const cx = gx + gridSize / 2
        const sig = Math.sqrt(st.ab)
        const noi = Math.sqrt(1 - st.ab)

        fig.rect(cx - 48, 50, 96, 28, {
            fill: tint(st.tone, c.bg, theme === 'light' ? 0.14 : 0.2),
            stroke: tint(st.tone, c.bg, 0.45),
            strokeWidth: 1,
            radius: 6,
        })
        fig.text(cx, 64, st.t, { size: 15.5, weight: 700, mono: true, color: st.tone, align: 'center' })

        const cell = gridSize / 12
        const loColor = theme === 'light' ? '#ebe6d9' : '#131822'
        const hiColor = theme === 'light' ? '#0f4c5c' : '#65c4f0'
        const midColor = theme === 'light' ? '#b07d24' : '#e6b85c'

        for (let r = 0; r < 12; r++) {
            for (let col = 0; col < 12; col++) {
                const v = sig * clean[r]![col]! + noi * eps[r]![col]!
                const norm = Math.max(0, Math.min(1, (v + 1.4) / 2.8))
                const fill =
                    norm < 0.55
                        ? tint(hiColor, loColor, norm / 0.55)
                        : tint(midColor, hiColor, (norm - 0.55) / 0.45)
                fig.rect(gx + col * cell, gridY + r * cell, cell - 0.7, cell - 0.7, { fill, radius: 1.2 })
            }
        }
        fig.rect(gx, gridY, gridSize, gridSize, { stroke: tint(st.tone, c.bg, 0.5), strokeWidth: 1.25, radius: 4 })

        if (idx < stages.length - 1) {
            fig.arrow(gx + gridSize + 8, gridY + gridSize / 2, gx + stepX - 8, gridY + gridSize / 2, {
                color: c.textMuted,
                width: 1.75,
                head: 6,
            })
        }

        const baseY = gridY + gridSize + 20
        fig.text(cx, baseY, `ᾱ = ${st.ab.toFixed(st.ab === 0.001 ? 3 : 1)}`, {
            size: 15.5,
            mono: true,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })

        // Paired compact bars
        const barX = gx + 36
        const barW = gridSize - 82
        const ySig = baseY + 26
        fig.text(gx, ySig, 'sig', { size: 15, mono: true, color: green })
        fig.rect(barX, ySig - 5, barW, 10, { fill: tint(c.borderSubtle, c.bg, 0.45), radius: 3 })
        fig.rect(barX, ySig - 5, Math.max(2, sig * barW), 10, { fill: green, radius: 3 })
        fig.text(gx + gridSize, ySig, sig.toFixed(2), { size: 15, mono: true, color: green, align: 'right' })

        const yNoi = baseY + 52
        fig.text(gx, yNoi, 'noi', { size: 15, mono: true, color: red })
        fig.rect(barX, yNoi - 5, barW, 10, { fill: tint(c.borderSubtle, c.bg, 0.45), radius: 3 })
        fig.rect(barX, yNoi - 5, Math.max(2, noi * barW), 10, { fill: red, radius: 3 })
        fig.text(gx + gridSize, yNoi, noi.toFixed(2), { size: 15, mono: true, color: red, align: 'right' })

        fig.text(cx, baseY + 80, st.label, { size: 15.5, color: st.tone, weight: 700, align: 'center' })
    })

    fig.math(width / 2, 376, '(\\sqrt{\\bar{\\alpha}_t})^2 + (\\sqrt{1 - \\bar{\\alpha}_t})^2 = 1', {
        size: 15.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
