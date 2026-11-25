import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 435
export const alt =
    'Configured 120-GPU fleet split into two node pools. Sixteen four-GPU learner nodes hold 64 GPUs as one Megatron model replica, while fourteen four-GPU rollout nodes supply 56 GPUs across seven eight-GPU vLLM engines. Updated BF16 learner weights cast to FP8 and broadcast to the rollout pool.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const teal = fig.tone('cyan')

    // Left Pool: Learner 64 GPUs (8x8 grid = 16 nodes x 4 GPUs)
    const cell = 24
    const gap = 4
    const leftX = 36
    const gridY = 82
    const leftW = 8 * cell + 7 * gap // 220

    fig.text(leftX + leftW / 2, 24, 'Learner pool · 64 GPUs', {
        size: 16,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(leftX + leftW / 2, 46, '16 nodes × 4 GPUs · 1 Megatron replica', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
            // Extra tiny gap between left 4 GPUs and right 4 GPUs to hint 4-GPU node pairs
            const nodeOffset = col >= 4 ? 5 : 0
            const x = leftX + col * (cell + gap) + nodeOffset
            const y = gridY + r * (cell + gap)
            fig.rect(x, y, cell, cell, {
                fill: tint(blue, c.bg, theme === 'light' ? 0.36 : 0.48),
                stroke: blue,
                strokeWidth: 1.15,
                radius: 4,
            })
        }
    }

    fig.text(leftX + leftW / 2 + 2, gridY + 244, 'Megatron BF16 + Adam', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(leftX + leftW / 2 + 2, gridY + 266, 'TP8 × CP8 / EP64 · DP1', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // Center Weight Refresh Bridge directly linking the two pools
    const bridgeX1 = leftX + leftW + 14
    const bridgeX2 = 472
    const midX = (bridgeX1 + bridgeX2) / 2
    const midY = gridY + 110

    fig.rect(midX - 66, midY - 44, 132, 88, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.1 : 0.15),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 10,
    })
    fig.text(midX, midY - 22, 'Weight refresh', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(midX, midY + 1, 'BF16 → FP8', {
        size: 12.5,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.text(midX, midY + 23, 'NCCL broadcast', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    fig.arrow(bridgeX1, midY, midX - 70, midY, { color: purple, width: 2, head: 7 })
    fig.arrow(midX + 70, midY, bridgeX2, midY, { color: green, width: 2, head: 7 })

    // Right Pool: Rollout 56 GPUs grouped explicitly into 7 independent 8-GPU vLLM engines
    const rightX = 482
    const rCell = 23
    const rGap = 3
    const rowStep = 33
    const engineW = 8 * rCell + 7 * rGap // 205

    fig.text(rightX + engineW / 2, 24, 'Rollout pool · 56 GPUs', {
        size: 16,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(rightX + engineW / 2, 46, '14 nodes × 4 GPUs · 7 vLLM engines', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    for (let e = 0; e < 7; e++) {
        const ey = gridY - 2 + e * rowStep
        const colTone = e % 2 === 0 ? green : teal
        // Crisp engine strip frame so each 8-GPU replica reads as a distinct engine
        fig.rect(rightX - 5, ey - 3, engineW + 10, rCell + 6, {
            fill: tint(colTone, c.bg, theme === 'light' ? 0.08 : 0.12),
            stroke: tint(colTone, c.bg, 0.35),
            strokeWidth: 1,
            radius: 6,
        })
        for (let g = 0; g < 8; g++) {
            const gx = rightX + g * (rCell + rGap)
            fig.rect(gx, ey, rCell, rCell, {
                fill: tint(colTone, c.bg, theme === 'light' ? 0.4 : 0.5),
                stroke: colTone,
                strokeWidth: 1,
                radius: 3.5,
            })
        }
        fig.text(rightX + engineW + 14, ey + rCell / 2, `Engine ${e + 1}`, {
            size: 12,
            weight: 600,
            color: c.textSecondary,
            mono: true,
        })
    }

    fig.text(rightX + engineW / 2, gridY + 244, '7 independent vLLM replicas', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rightX + engineW / 2, gridY + 266, '8 GPUs / engine · FP8 weights + KV', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // Bottom fleet total summary
    fig.brace(36, 376, 756, 376, 'Total fleet: 30 nodes × 4 GB200 GPUs = 120 GPUs (separate training & serving pools)', {
        side: 1,
        depth: 9,
        color: c.textMuted,
        labelColor: c.textSecondary,
        labelSize: 13,
        labelGap: 14,
        weight: 500,
    })

    return fig.render()
}

export default create('dark')
