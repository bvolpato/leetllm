import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/ring-attention-film'

export const width = 760
export const height = 430
export const alt =
    'Four-way Ring Attention prefill: GPUs 0 through 3 pin local query shards Q0..Q3 while distinct KV shards KV0..KV3 rotate clockwise around the ring over 4 steps (GPU 0 -> 1 -> 2 -> 3 -> 0), merging via online softmax. Below, a 1M-token full-attention KV payload (305.2 GiB) sharded four ways still requires 76.3 GiB per GPU before weights, exceeding the 74.5 GiB (80 decimal GB) limit by 1.8 GiB.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    const fill = (col: string, strong = true) =>
        tint(col, c.bg, isLight ? (strong ? 0.22 : 0.1) : strong ? 0.36 : 0.18)

    // =========================================================================
    // Top section: 4-GPU Ring with distinct rotating KV0..KV3 shards
    // =========================================================================
    fig.text(24, 20, 'Clockwise KV ring (4 steps: 1 local + 3 ring visits via online softmax)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const gW = 148
    const gH = 122
    const gGap = 40
    const startX = 24
    const gY = 50
    const kvColors = [green, blue, purple, warm] as const

    for (let i = 0; i < 4; i++) {
        const x = startX + i * (gW + gGap)
        const kvCol = kvColors[i]!
        // GPU shell
        fig.rect(x, gY, gW, gH, {
            fill: fill(blue, false),
            stroke: blue,
            strokeWidth: 1.5,
            radius: 10,
        })
        fig.text(x + gW / 2, gY + 20, `GPU ${i}`, {
            size: 14,
            weight: 700,
            color: blue,
            align: 'center',
        })
        fig.text(x + gW / 2, gY + 42, `Q${i} pinned`, {
            size: 12.5,
            weight: 600,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })

        // Distinct KV_i shard pill inside each GPU
        fig.rect(x + 18, gY + 62, gW - 36, 36, {
            fill: fill(kvCol, true),
            stroke: kvCol,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(x + gW / 2, gY + 80, `KV${i} → G${(i + 1) % 4}`, {
            size: 13,
            weight: 700,
            color: kvCol,
            align: 'center',
            mono: true,
        })
        fig.text(x + gW / 2, gY + 111, 'online softmax', {
            size: 11,
            color: c.textMuted,
            align: 'center',
        })

        // Clockwise arrow to next GPU
        if (i < 3) {
            fig.arrow(x + gW + 4, gY + 80, x + gW + gGap - 4, gY + 80, {
                color: warm,
                width: 2.2,
                head: 7,
            })
        }
    }

    // Return wrap-around pipe GPU 3 -> GPU 0 underneath
    const wrapY = gY + gH + 26
    const g0Center = startX + gW / 2
    const g3Center = startX + 3 * (gW + gGap) + gW / 2
    fig.path(
        `M${g3Center} ${gY + gH + 4} L${g3Center} ${wrapY} L${g0Center} ${wrapY} L${g0Center} ${gY + gH + 6}`,
        { color: warm, width: 2, dash: '6 4' },
    )
    fig.arrow(g0Center, gY + gH + 14, g0Center, gY + gH + 4, {
        color: warm,
        width: 2,
        head: 7,
    })
    fig.rect(width / 2 - 148, wrapY - 12, 296, 24, {
        fill: isLight ? '#faf9f5' : '#0d0e14',
        stroke: warm,
        strokeWidth: 1.2,
        radius: 12,
    })
    fig.text(width / 2, wrapY, 'Step t → t+1: KV3 wraps from GPU 3 to GPU 0', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // =========================================================================
    // Bottom section: 1M-token 4-way KV shard VRAM limit check
    // =========================================================================
    const sepY = 236
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })

    fig.text(24, sepY + 22, '1M-token 4-way KV shard (305.2 GiB ÷ 4 = 76.3 GiB / GPU)', {
        size: 14,
        weight: 700,
        color: red,
    })

    const barX = 128
    const barW = 468
    const maxGiB = 85
    const px = (gib: number) => barX + (gib / maxGiB) * barW
    const capX = px(74.5)

    // Scale gridlines
    const gTop = sepY + 58
    const gBot = sepY + 132
    for (const v of [0, 25, 50, 74.5]) {
        const x = px(v)
        const isCap = v === 74.5
        fig.line(x, gTop, x, gBot, {
            color: isCap ? red : c.borderSubtle,
            width: isCap ? 1.8 : 1,
            dash: isCap ? '5 4' : undefined,
        })
        fig.text(x, gTop - 12, isCap ? '74.5 GiB (80 GB cap)' : `${v}`, {
            size: 12,
            weight: isCap ? 700 : 500,
            color: isCap ? red : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    const by = sepY + 74
    const bh = 40
    fig.text(barX - 12, by + bh / 2, 'KV / GPU', {
        size: 13.5,
        weight: 700,
        color: purple,
        align: 'right',
        mono: true,
    })

    fig.rect(barX, by, capX - barX, bh, {
        fill: fill(purple, true),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text((barX + capX) / 2, by + bh / 2, '74.5 GiB fills entire HBM', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
    })

    fig.rect(capX + 2, by, Math.max(12, px(76.3) - capX - 2), bh, {
        fill: fill(red, true),
        stroke: red,
        strokeWidth: 1.6,
        radius: 4,
    })
    fig.text(Math.max(capX + 22, px(76.3) + 12), by + bh / 2, '76.3 GiB (+1.8 OOM)', {
        size: 13,
        weight: 700,
        color: red,
        mono: true,
    })

    fig.text(barX, gBot + 18, 'KV cache alone exceeds 80 decimal GB before model weights or activations', {
        size: 12.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
