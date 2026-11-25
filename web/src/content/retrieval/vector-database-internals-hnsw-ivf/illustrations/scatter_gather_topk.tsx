import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 416
export const alt =
    'Four-shard scatter-gather timeline on one shared 0 to 95 ms axis. Shard 1 returns 5 local candidates at 44 ms, Shard 2 at 58 ms, Shard 3 at 86 ms, and Shard 4 at 51 ms. The coordinator waits for the slowest shard at 86 ms before running a 3 ms merge that reduces 20 local candidates to the global top 5 at 89 ms.'

const SHARDS = [
    { name: 'Shard 1', ms: 44, slow: false },
    { name: 'Shard 2', ms: 58, slow: false },
    { name: 'Shard 3', ms: 86, slow: true },
    { name: 'Shard 4', ms: 51, slow: false },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const green = fig.tone('green')

    const axisX = 128
    const axisW = 556
    const tMax = 95
    const tx = (ms: number) => axisX + (ms / tMax) * axisW

    const plotTop = 52
    const plotBot = 296

    // Vertical gridlines at round 30 ms ticks
    for (const ms of [0, 30, 60, 90]) {
        const gx = tx(ms)
        fig.line(gx, plotTop, gx, plotBot, {
            color: ms === 0 ? c.textMuted : c.borderSubtle,
            width: ms === 0 ? 1.25 : 1,
            dash: ms === 0 ? undefined : '3 4',
        })
        fig.text(gx, plotBot + 16, `${ms} ms`, {
            size: 13,
            mono: true,
            color: c.textSecondary,
            align: ms === 0 ? 'left' : 'center',
        })
    }
    fig.line(axisX, plotBot, axisX + axisW, plotBot, { color: c.textMuted, width: 1.25 })

    // Barrier line at slowest shard (86 ms)
    const barrierX = tx(86)
    fig.line(barrierX, 34, barrierX, plotBot, {
        color: red,
        width: 2,
        dash: '5 4',
    })
    fig.text(barrierX, 18, '86 ms · slowest shard barrier', {
        size: 14,
        weight: 700,
        color: red,
        align: 'right',
    })

    // 4 Shard fan-out bars
    SHARDS.forEach((s, i) => {
        const ry = 76 + i * 44
        const barH = 22
        const color = s.slow ? red : blue
        const ex = tx(s.ms)

        fig.text(axisX - 14, ry, s.name, {
            size: 14,
            weight: s.slow ? 700 : 600,
            color: s.slow ? red : c.textPrimary,
            align: 'right',
        })

        fig.rect(axisX, ry - barH / 2, ex - axisX, barH, {
            fill: withColorAlpha(color, s.slow ? 0.25 : 0.2),
            stroke: color,
            strokeWidth: s.slow ? 2 : 1.5,
            radius: 5,
        })
        fig.circle(ex, ry, 5, { fill: color, stroke: c.bg, width: 1.5 })

        fig.text(ex + 10, ry, `${s.ms} ms`, {
            size: 13,
            mono: true,
            weight: 700,
            color,
        })
        if (!s.slow) {
            fig.text(axisX + 10, ry, 'top-5 local', {
                size: 12,
                color: c.textSecondary,
            })
        } else {
            fig.text(axisX + 10, ry, 'top-5 local · tail straggler', {
                size: 12,
                weight: 600,
                color: red,
            })
        }
    })

    // Subtle separator before coordinator merge row
    fig.line(20, 238, axisX + axisW, 238, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // Coordinator Merge row (86..89 ms = 3 ms)
    const mergeY = 266
    const m1 = tx(86)
    const m2 = tx(89)
    fig.text(axisX - 14, mergeY, 'Merge', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.rect(m1, mergeY - 11, Math.max(18, m2 - m1), 22, {
        fill: withColorAlpha(green, 0.28),
        stroke: green,
        strokeWidth: 1.8,
        radius: 4,
    })
    fig.text(m1 - 12, mergeY, '3 ms merge (20 local candidates to global top-5, ends 89 ms)', {
        size: 13,
        weight: 600,
        color: green,
        align: 'right',
    })

    // Bottom crisp equation & fan-out summary
    fig.line(20, 336, width - 20, 336, { color: c.borderSubtle, width: 1 })
    fig.math(
        width / 2,
        366,
        'T_{\\text{query}} = \\max(44, 58, 86, 51) + 3 = 89\\,\\text{ms}',
        { size: 16, color: c.textPrimary, align: 'center' },
    )
    fig.text(width / 2, 396, '4 shards × 5 local candidates = 20 IDs ranked on comparable scores', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
