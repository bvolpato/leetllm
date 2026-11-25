import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'U-shaped multi-scale U-Net denoiser architecture: the encoder downsamples noisy latents from 64x64 (320 channels) through 32x32 (640 channels) to a 16x16 (1280 channels) global self-attention bottleneck, while horizontal skip connections pass matching spatial scales to the upsampling decoder. Timestep FiLM/AdaGN and text cross-attention condition every level.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    // Top conditioning inputs
    fig.rect(86, 14, 274, 48, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: tint(warm, c.bg, 0.55),
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(223, 38, 'Timestep t → FiLM / AdaGN', { size: 15.5, weight: 700, color: warm, align: 'center' })

    fig.rect(400, 14, 274, 48, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: tint(purple, c.bg, 0.55),
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(537, 38, 'Text c → Cross-Attn K, V', { size: 15.5, weight: 700, color: purple, align: 'center' })

    fig.arrow(223, 62, 223, 88, { color: warm, width: 1.4, dash: '3 3', head: 5.5 })
    fig.arrow(537, 62, 537, 88, { color: purple, width: 1.4, dash: '3 3', head: 5.5 })

    fig.math(118, 92, 'z_t \\to \\textbf{Encoder}', { size: 15.5, color: blue, align: 'center' })
    fig.math(642, 92, '\\textbf{Decoder} \\to \\hat{\\epsilon}', { size: 15.5, color: green, align: 'center' })

    const levels = [
        { y: 112, h: 62, encX: 16, decX: 556, w: 188, res: '64×64 · 320d', enc: 'Down 1', dec: 'Up 1', skip: 'Skip 64×64' },
        { y: 202, h: 62, encX: 54, decX: 534, w: 172, res: '32×32 · 640d', enc: 'Down 2', dec: 'Up 2', skip: 'Skip 32×32' },
        { y: 292, h: 58, encX: 92, decX: 512, w: 156, res: '16×16 · 1280d', enc: 'Down 3', dec: 'Up 3', skip: '' },
    ]

    levels.forEach((lv, i) => {
        fig.rect(lv.encX, lv.y, lv.w, lv.h, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.09 + i * 0.03 : 0.14 + i * 0.04),
            stroke: blue,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(lv.encX + lv.w / 2, lv.y + 20, lv.enc, { size: 15.5, weight: 700, color: blue, align: 'center' })
        fig.text(lv.encX + lv.w / 2, lv.y + 44, lv.res, { size: 15, mono: true, color: c.textPrimary, align: 'center' })

        fig.rect(lv.decX, lv.y, lv.w, lv.h, {
            fill: tint(green, c.bg, theme === 'light' ? 0.09 + i * 0.03 : 0.14 + i * 0.04),
            stroke: green,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(lv.decX + lv.w / 2, lv.y + 20, lv.dec, { size: 15.5, weight: 700, color: green, align: 'center' })
        fig.text(lv.decX + lv.w / 2, lv.y + 44, lv.res, { size: 15, mono: true, color: c.textPrimary, align: 'center' })

        if (lv.skip) {
            const skipY = lv.y + lv.h / 2
            const x1 = lv.encX + lv.w + 4
            const x2 = lv.decX - 4
            fig.arrow(x1, skipY, x2, skipY, { color: purple, width: 1.8, dash: '5 4', head: 7 })
            fig.rect((x1 + x2) / 2 - 64, skipY - 14, 128, 28, {
                fill: c.bg,
                stroke: tint(purple, c.bg, 0.5),
                strokeWidth: 1,
                radius: 12,
            })
            fig.text((x1 + x2) / 2, skipY, lv.skip, { size: 15, weight: 700, color: purple, align: 'center' })
        }

        if (i < 2) {
            const next = levels[i + 1]!
            fig.arrow(lv.encX + lv.w / 2, lv.y + lv.h + 2, next.encX + next.w / 2, next.y - 2, {
                color: blue,
                width: 1.8,
                head: 6,
            })
            fig.arrow(next.decX + next.w / 2, next.y - 2, lv.decX + lv.w / 2, lv.y + lv.h + 2, {
                color: green,
                width: 1.8,
                head: 6,
            })
        }
    })

    // Bottom Bottleneck
    const bnX = 256
    const bnY = 356
    const bnW = 248
    const bnH = 62
    fig.rect(bnX, bnY, bnW, bnH, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.13 : 0.2),
        stroke: warm,
        strokeWidth: 2,
        radius: 10,
    })
    fig.text(bnX + bnW / 2, bnY + 21, 'Bottleneck (16×16)', { size: 15.5, weight: 700, color: warm, align: 'center' })
    fig.text(bnX + bnW / 2, bnY + 45, 'Global Self + Cross-Attn', { size: 15, color: c.textPrimary, align: 'center' })

    fig.arrow(170, 350, bnX - 2, bnY + 31, { color: blue, width: 1.8, head: 6 })
    fig.arrow(bnX + bnW + 2, bnY + 31, 590, 350, { color: warm, width: 1.8, head: 6 })

    return fig.render()
}

export default create('dark')
