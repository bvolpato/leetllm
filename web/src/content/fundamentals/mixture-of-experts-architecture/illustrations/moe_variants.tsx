import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 385
export const alt =
    'Exact per-layer expert pools comparing Mixtral 8x7B and DeepSeek-V2. Mixtral 8x7B stores 8 coarse routed experts and activates 2 per token (~46.7B total, ~12.9B active, 27.6% active). DeepSeek-V2 stores 160 fine-grained routed experts (6 active) plus 2 always-on shared experts (236B total, 21B active, 8.9% active).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')

    // High-contrast dark & light tile palettes
    const activeFill = tint(blue, c.bg, isLight ? 0.28 : 0.55)
    const sharedFill = tint(purple, c.bg, isLight ? 0.28 : 0.55)
    const idleFill = isLight ? '#ece8de' : '#1b202d'
    const idleStroke = isLight ? '#c5bfb0' : '#3a4256'

    // =========================================================================
    // Left: Mixtral 8x7B (2 of 8 routed)
    // =========================================================================
    const lMid = 152
    fig.text(lMid, 22, 'Mixtral 8×7B', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(lMid, 46, '2 of 8 routed · 46.7B / 12.9B', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
    })

    const mX = 48
    const mY = 98
    const mCell = 46
    const mGap = 8
    for (let r = 0; r < 2; r++) {
        for (let col = 0; col < 4; col++) {
            const idx = r * 4 + col
            const isActive = idx < 2
            const x = mX + col * (mCell + mGap)
            const y = mY + r * (mCell + mGap)
            fig.rect(x, y, mCell, mCell, {
                fill: isActive ? activeFill : idleFill,
                stroke: isActive ? blue : idleStroke,
                strokeWidth: isActive ? 2 : 1.1,
                radius: 7,
            })
            fig.text(x + mCell / 2, y + mCell / 2, `E${idx}`, {
                size: 13.5,
                weight: isActive ? 700 : 500,
                color: isActive ? (isLight ? blue : '#ffffff') : c.textMuted,
                align: 'center',
                mono: true,
            })
        }
    }

    fig.text(lMid, 226, 'Coarse SwiGLU experts', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Divider
    fig.line(304, 22, 304, 274, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // Right: DeepSeek-V2 (6 of 160 fine routed + 2 shared always-on)
    // =========================================================================
    const rMid = 532
    fig.text(rMid, 22, 'DeepSeek-V2', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rMid, 46, '6 of 160 routed + 2 shared · 236B / 21B', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
    })

    const dX = 336
    const dY = 74
    const dCell = 15
    const dGap = 3.5
    // Highlight 6 spread active experts so the sparsity pattern reads immediately
    const activeIds = new Set([2, 11, 45, 73, 108, 142])
    for (let r = 0; r < 10; r++) {
        for (let col = 0; col < 16; col++) {
            const idx = r * 16 + col
            const isActive = activeIds.has(idx)
            fig.rect(dX + col * (dCell + dGap), dY + r * (dCell + dGap), dCell, dCell, {
                fill: isActive ? activeFill : idleFill,
                stroke: isActive ? blue : idleStroke,
                strokeWidth: isActive ? 1.8 : 0.9,
                radius: 3,
            })
        }
    }
    const dW = 16 * dCell + 15 * dGap
    fig.text(dX + dW / 2, dY + 10 * (dCell + dGap) + 14, '160 fine routed (6 active)', {
        size: 14,
        weight: 600,
        color: blue,
        align: 'center',
    })

    // 2 always-on shared experts beside the 160-grid
    const sX = dX + dW + 26
    const sY = dY + 34
    const sW = 54
    const sH = 48
    for (let i = 0; i < 2; i++) {
        const y = sY + i * (sH + 14)
        fig.rect(sX, y, sW, sH, {
            fill: sharedFill,
            stroke: purple,
            strokeWidth: 2,
            radius: 7,
        })
        fig.text(sX + sW / 2, y + sH / 2, `S${i}`, {
            size: 14.5,
            weight: 700,
            color: isLight ? purple : '#ffffff',
            align: 'center',
            mono: true,
        })
    }
    fig.text(sX + sW / 2, dY + 10 * (dCell + dGap) + 14, '2 shared', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Bottom active-parameter fraction comparison bars
    const sepY = 294
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })
    fig.text(24, sepY + 18, 'Active parameter share per token', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 164
    const barW = 360
    const rows = [
        { name: 'Mixtral 8×7B', frac: 12.9 / 46.7, text: '27.6% (12.9B/46.7B)', col: blue },
        { name: 'DeepSeek-V2', frac: 21 / 236, text: '8.9%  (21B/236B)', col: purple },
    ]
    rows.forEach((r, idx) => {
        const y = sepY + 36 + idx * 28
        fig.text(barX - 12, y + 9, r.name, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
        })
        fig.rect(barX, y, barW, 18, {
            fill: idleFill,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 4,
        })
        fig.rect(barX, y, barW * r.frac, 18, {
            fill: tint(r.col, c.bg, isLight ? 0.28 : 0.5),
            stroke: r.col,
            strokeWidth: 1.4,
            radius: 4,
        })
        fig.text(barX + barW + 12, y + 9, r.text, {
            size: 14,
            weight: 700,
            color: r.col,
            mono: true,
        })
    })

    return fig.render()
}

export default create('dark')
