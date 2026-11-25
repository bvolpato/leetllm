import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 425
export const alt =
    'For 4,096 tokens with top-2 routing across 32 experts (mean 256 per expert), a hot expert receives 400 assignments. Capacity factor c = 1.0 fits 256 slots and leaves 144 overflow tokens; c = 1.2 raises capacity to 308 slots and cuts overflow to 92. Three overflow paths at c = 1.0 handle the 144 excess tokens: drop (skip expert, keep residual), reroute to a spare expert, or dropless variable-size execution running all 400.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')
    const purple = fig.tone('purple')

    const fill = (col: string, strong = false) =>
        tint(col, c.bg, isLight ? (strong ? 0.22 : 0.11) : strong ? 0.36 : 0.2)

    const barX = 112
    const barW = 580
    const px = (toks: number) => barX + (toks / 400) * barW

    // Top section: hot expert buffer capacity bars (0 .. 400 assigned tokens)
    fig.text(24, 20, 'Hot expert receives 400 assignments (mean = 4,096 × 2 / 32 = 256)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    // Scale ticks along top of bars
    const axisTop = 58
    const axisBot = 176
    for (const tick of [0, 100, 200, 256, 308, 400]) {
        const x = px(tick)
        const isCap = tick === 256 || tick === 308
        fig.line(x, axisTop, x, axisBot, {
            color: tick === 256 ? blue : tick === 308 ? green : c.borderSubtle,
            width: isCap ? 1.4 : 1,
            dash: isCap ? '4 4' : undefined,
        })
        fig.text(x, axisTop - 13, String(tick), {
            size: 12,
            weight: isCap ? 700 : 500,
            color: tick === 256 ? blue : tick === 308 ? green : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Row 1: c = 1.0 (256 fit, 144 overflow)
    const y1 = 72
    const bh = 36
    fig.text(barX - 12, y1 + bh / 2, 'c = 1.0', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'right',
        mono: true,
    })
    fig.rect(barX, y1, px(256) - barX, bh, {
        fill: fill(blue, true),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text((barX + px(256)) / 2, y1 + bh / 2, '256 fit slots', {
        size: 13.5,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    const ov1X = px(256) + 3
    const ov1W = px(400) - ov1X
    fig.rect(ov1X, y1, ov1W, bh, {
        fill: fill(warm, true),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(ov1X + ov1W / 2, y1 + bh / 2, '144 overflow', {
        size: 13.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Row 2: c = 1.2 (308 fit, 92 overflow)
    const y2 = 128
    fig.text(barX - 12, y2 + bh / 2, 'c = 1.2', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.rect(barX, y2, px(308) - barX, bh, {
        fill: fill(green, true),
        stroke: green,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text((barX + px(308)) / 2, y2 + bh / 2, '308 fit slots (+20%)', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    const ov2X = px(308) + 3
    const ov2W = px(400) - ov2X
    fig.rect(ov2X, y2, ov2W, bh, {
        fill: fill(warm, true),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(ov2X + ov2W / 2, y2 + bh / 2, '92 overflow', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Divider
    const sepY = 198
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })

    // Bottom section: Visual 3-way routing of the 144 overflow tokens (c = 1.0)
    fig.text(24, sepY + 22, 'Three ways to handle the 144 overflow tokens (c = 1.0)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const srcX = 24
    const srcY = sepY + 86
    const srcW = 140
    const srcH = 68
    fig.rect(srcX, srcY, srcW, srcH, {
        fill: fill(warm, true),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 9,
    })
    fig.text(srcX + srcW / 2, srcY + 24, '144 excess', {
        size: 14.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(srcX + srcW / 2, srcY + 46, 'overflow tokens', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const branches = [
        {
            y: sepY + 44,
            name: '1. Drop',
            action: 'Skip expert call',
            outcome: 'Residual stream preserves x',
            color: red,
        },
        {
            y: sepY + 100,
            name: '2. Reroute',
            action: 'Send to spare expert',
            outcome: 'Uses alternate weights',
            color: purple,
        },
        {
            y: sepY + 156,
            name: '3. Dropless',
            action: 'Block-sparse GEMM',
            outcome: 'Runs all 400 (0 drops, +FLOPs)',
            color: green,
        },
    ] as const

    const dstX = 224
    const dstW = 512
    const dstH = 44
    const srcRight = srcX + srcW
    const srcMidY = srcY + srcH / 2

    branches.forEach((b) => {
        const targetY = b.y + dstH / 2
        const midX = (srcRight + dstX) / 2
        fig.path(
            `M${srcRight} ${srcMidY} C${midX} ${srcMidY},${midX} ${targetY},${dstX - 8} ${targetY}`,
            { color: b.color, width: 1.8 },
        )
        fig.arrow(dstX - 12, targetY, dstX - 2, targetY, {
            color: b.color,
            width: 1.8,
            head: 6,
        })

        fig.rect(dstX, b.y, dstW, dstH, {
            fill: fill(b.color, false),
            stroke: b.color,
            strokeWidth: 1.4,
            radius: 8,
        })
        fig.text(dstX + 14, targetY, b.name, {
            size: 14,
            weight: 700,
            color: b.color,
        })
        fig.text(dstX + 126, targetY, b.action, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
        })
        fig.text(dstX + dstW - 14, targetY, b.outcome, {
            size: 13,
            color: c.textSecondary,
            align: 'right',
        })
    })

    return fig.render()
}

export default create('dark')
