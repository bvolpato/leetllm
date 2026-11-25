import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 445
export const alt =
    'Nested 64-GPU Megatron-LM rank lattice with default order tp-cp-ep-dp-pp (DP4 x CP2 x PP2 x TP4). Four DP replicas each contain two CP lanes; each lane stacks PP0 and PP1 as rows of four TP ranks labeled with global rank IDs. Rank 3 is highlighted at (dp, cp, pp, tp) = (0, 0, 0, 3).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    const globalRank = (dp: number, cp: number, pp: number, tp: number) =>
        tp + 4 * cp + 8 * dp + 32 * pp

    // Top compact formula
    fig.math(
        420,
        24,
        '\\text{rank} = \\mathrm{tp} + 4\\,\\mathrm{cp} + 8\\,\\mathrm{dp} + 32\\,\\mathrm{pp} \\qquad (\\text{DP4} \\times \\text{CP2} \\times \\text{PP2} \\times \\text{TP4})',
        { size: 15, color: c.textPrimary, align: 'center' },
    )

    const leftX = 20
    const colW = 190
    const colGap = 13
    const topY = 52
    const colH = 330

    for (let dp = 0; dp < 4; dp++) {
        const gx = leftX + dp * (colW + colGap)

        // Subtle DP replica column container
        fig.rect(gx, topY, colW, colH, {
            fill: tint(green, c.bg, 0.05),
            stroke: tint(green, c.bg, 0.4),
            strokeWidth: 1.25,
            radius: 8,
        })
        fig.rect(gx, topY, colW, 4, { fill: green, radius: 2 })
        fig.text(gx + colW / 2, topY + 20, `DP${dp}`, {
            size: 14,
            weight: 700,
            color: green,
            align: 'center',
            width: colW - 16,
        })

        for (let cp = 0; cp < 2; cp++) {
            const cpY = topY + 38 + cp * 144
            const cpH = 134
            fig.rect(gx + 8, cpY, colW - 16, cpH, {
                fill: tint(cyan, c.bg, 0.06),
                stroke: tint(cyan, c.bg, 0.35),
                strokeWidth: 1,
                radius: 6,
            })
            fig.text(gx + 16, cpY + 15, `CP${cp}`, {
                size: 13,
                weight: 700,
                color: cyan,
            })

            for (let pp = 0; pp < 2; pp++) {
                const ppY = cpY + 32 + pp * 48
                fig.text(gx + 14, ppY + 18, `PP${pp}`, {
                    size: 12,
                    weight: 600,
                    color: warm,
                    mono: true,
                })

                for (let tp = 0; tp < 4; tp++) {
                    const rank = globalRank(dp, cp, pp, tp)
                    const isTarget = rank === 3
                    const bx = gx + 48 + tp * 32
                    const by = ppY + 2
                    fig.rect(bx, by, 28, 34, {
                        fill: isTarget ? tint(purple, c.bg, 0.28) : tint(blue, c.bg, 0.1),
                        stroke: isTarget ? purple : tint(blue, c.bg, 0.55),
                        strokeWidth: isTarget ? 2.25 : 1,
                        radius: 4,
                    })
                    fig.text(bx + 14, by + 17, String(rank), {
                        size: 13,
                        weight: isTarget ? 700 : 600,
                        color: isTarget ? purple : c.textPrimary,
                        align: 'center',
                        mono: true,
                        width: 28,
                    })
                }
            }
        }
    }

    // Bottom frameless stride legend + highlighted rank note
    const legY = 408
    fig.text(20, legY, 'TP4: +1 (NVLink)', { size: 13, weight: 600, color: blue })
    fig.text(168, legY, 'CP2: +4', { size: 13, weight: 600, color: cyan })
    fig.text(252, legY, 'DP4: +8', { size: 13, weight: 600, color: green })
    fig.text(336, legY, 'PP2: +32', { size: 13, weight: 600, color: warm })
    fig.text(820, legY, 'Rank 3 = (dp=0, cp=0, pp=0, tp=3)', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'right',
        mono: true,
    })
    fig.text(420, 430, 'Order: tp-cp-ep-dp-pp (innermost TP consecutive within node)', {
        size: 12,
        color: muted,
        align: 'center',
        width: 520,
    })

    return fig.render()
}

export default create()
