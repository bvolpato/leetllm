import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 400
export const alt =
    'Top funnel shows 5,000 typing editors sending 2,000 raw req/s, 60% canceled pre-GPU leaving 800 surviving req/s (400 hits skipping 75% prefill + 400 full misses) with 2,048-token overall mean. Below, calibrated stacked bars compare uncached prefill demand at 20,000 tok/s per GPU: Long Hits need 716.8k tok/s (36 GPUs), Uniform 2,048 needs 1,024k tok/s (52 GPUs), and Long Misses need 1,331.2k tok/s (67 GPUs, +86%).'

export const numericAnchors = {
    typingEditors: 5000,
    rawReqsPerSec: 2000,
    canceledReqsPerSec: 1200,
    survivingReqsPerSec: 800,
    hitRate: 0.5,
    gpuCapacityTokensPerSec: 20000,
    scenarios: [
        { name: 'Long Hits (Hit 3,072 · Miss 1,024)', tokensPerSec: 716800, gpus: 36 },
        { name: 'Balanced (Hit 2,048 · Miss 2,048)', tokensPerSec: 1024000, gpus: 52 },
        { name: 'Short Hits (Hit 1,024 · Miss 3,072)', tokensPerSec: 1331200, gpus: 67 },
    ],
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    // Top compact ingress funnel (3 clean tinted pills + arrows, zero heavy card stacks)
    const stages = [
        { x: 24, w: 236, label: '5,000 typing editors', sub: '0.4 req/s -> 2,000 raw req/s', tone: blue },
        { x: 300, w: 234, label: 'Debounce & cancel', sub: '-1,200 canceled (60%)', tone: warm },
        { x: 574, w: 262, label: '800 surviving req/s', sub: '400 hits (75% skip) + 400 misses', tone: green },
    ]
    stages.forEach((s, i) => {
        fig.rect(s.x, 20, s.w, 54, {
            fill: tint(s.tone, c.bg, 0.1),
            stroke: s.tone,
            strokeWidth: 1.3,
            radius: 8,
        })
        fig.text(s.x + 14, 38, s.label, { size: 14, weight: 700, color: s.tone })
        fig.text(s.x + 14, 58, s.sub, { size: 12, color: c.textSecondary, mono: true })
        if (i < stages.length - 1) {
            const next = stages[i + 1]!
            fig.arrow(s.x + s.w + 4, 47, next.x - 4, 47, { color: c.textMuted, width: 1.6, head: 6 })
        }
    })

    // Main horizontal stacked bar plot (0..1.4M uncached prefill tokens/s)
    fig.text(24, 102, 'Same 800 req/s, 50% hit rate & 2,048 mean tokens', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(836, 102, '20,000 tok/s per GPU', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    const plot = fig.plot({ x: 244, y: 124, width: 454, height: 186 }, { x: [0, 1400], y: [0, 3] })

    // Vertical grid & x-axis ticks (in k tok/s)
    for (const k of [0, 400, 800, 1200, 1400]) {
        const tx = plot.px(k)
        fig.line(tx, 124, tx, 310, { color: c.borderSubtle, width: 1 })
        fig.line(tx, 310, tx, 315, { color: c.textMuted, width: 1 })
        const label = k === 0 ? '0' : k >= 1000 ? `${(k / 1000).toFixed(k % 1000 === 0 ? 0 : 1)}M` : `${k}k`
        fig.text(tx, 329, label, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(plot.px(0), 310, plot.px(1400), 310, { color: c.textMuted, width: 1 })
    fig.text(plot.px(700), 350, 'Uncached prefill demand (tokens / s)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    const rows = [
        {
            title: 'Long hits',
            sub: 'Hit 3,072 · Miss 1,024',
            hitK: 307.2,
            missK: 409.6,
            totLabel: '716.8k',
            gpus: '36 GPUs',
            tone: green,
        },
        {
            title: 'Uniform 2,048',
            sub: 'Hit 2,048 · Miss 2,048',
            hitK: 204.8,
            missK: 819.2,
            totLabel: '1,024k',
            gpus: '52 GPUs',
            tone: blue,
        },
        {
            title: 'Long misses',
            sub: 'Hit 1,024 · Miss 3,072',
            hitK: 102.4,
            missK: 1228.8,
            totLabel: '1,331.2k',
            gpus: '67 GPUs (+86%)',
            tone: red,
        },
    ]

    rows.forEach((r, i) => {
        const y = 138 + i * 58
        const h = 34
        fig.text(234, y + 10, r.title, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
            align: 'right',
        })
        fig.text(234, y + 28, r.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })

        const hitW = plot.px(r.hitK) - plot.px(0)
        const missW = plot.px(r.hitK + r.missK) - plot.px(r.hitK)

        fig.rect(plot.px(0), y, hitW - 1, h, { fill: green, opacity: 0.88, radius: 4 })
        if (hitW >= 54) {
            fig.text(plot.px(0) + hitW / 2, y + h / 2, `${Math.round(r.hitK)}k`, {
                size: 12,
                weight: 700,
                color: c.bg,
                align: 'center',
                mono: true,
            })
        }
        fig.rect(plot.px(r.hitK), y, missW, h, { fill: red, opacity: 0.86, radius: 4 })
        fig.text(plot.px(r.hitK) + missW / 2, y + h / 2, `${Math.round(r.missK)}k`, {
            size: 12,
            weight: 700,
            color: c.bg,
            align: 'center',
            mono: true,
        })

        // Right-side GPU count + total tok/s
        fig.text(712, y + 10, r.gpus, {
            size: 14,
            weight: 700,
            color: r.tone,
            mono: true,
        })
        fig.text(712, y + 28, `${r.totLabel} tok/s`, {
            size: 12,
            color: c.textSecondary,
            mono: true,
        })
    })

    // Legend & formula at bottom
    fig.rect(24, 372, 12, 12, { fill: green, radius: 3 })
    fig.text(42, 378, 'Hit uncached tail (25%)', { size: 12, color: c.textSecondary })
    fig.rect(214, 372, 12, 12, { fill: red, radius: 3 })
    fig.text(232, 378, 'Miss full prefill (100%)', { size: 12, color: c.textSecondary })
    fig.math(836, 378, '\\text{Demand} = \\sum_i \\lambda_i L_i (1 - s_i)', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    return fig.render()
}

export default create('dark')
