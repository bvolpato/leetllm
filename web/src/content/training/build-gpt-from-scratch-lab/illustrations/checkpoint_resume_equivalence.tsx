import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 380
export const alt =
    'A step-321 checkpoint saves four pieces of state: 4.2M model weights theta, AdamW moments (m_t, v_t, step=321), train/val RNG generator states, and vocab/corpus metadata. Both Path A (uninterrupted) and Path B (resumed from disk) draw the identical 12x48 batch at step 322, compute identical cross-entropy loss 5.5492 nats, and land on bitwise-identical weights (max delta = 0.0).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const muted = c.textSecondary

    // Top: Step 321 Checkpoint Bundle (4 crisp non-overlapping blocks)
    fig.text(24, 22, 'Step 321 checkpoint bundle', {
        size: 15,
        weight: 700,
        color: purple,
    })
    fig.text(width - 24, 22, 'All four states required for exact continuation', {
        size: 13,
        color: muted,
        align: 'right',
    })

    const stateBlocks = [
        { title: 'Weights θ', sub: '4.2M params', color: cyan },
        { title: 'AdamW state', sub: 'mₜ, vₜ, step = 321', color: warm },
        { title: 'RNG state', sub: 'train / val seeds', color: purple },
        { title: 'Metadata', sub: 'vocab 17,485 · split', color: muted },
    ]
    const bW = 168
    const bGap = 13
    const bY = 42
    const bH = 54
    stateBlocks.forEach((b, i) => {
        const bx = 24 + i * (bW + bGap)
        fig.rect(bx, bY, bW, bH, {
            fill: tint(b.color, c.bg, 0.14),
            stroke: b.color,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(bx + bW / 2, bY + 19, b.title, {
            size: 14,
            weight: 700,
            color: b.color === muted ? c.textPrimary : b.color,
            align: 'center',
        })
        fig.text(bx + bW / 2, bY + 39, b.sub, {
            size: 12,
            mono: true,
            color: muted,
            align: 'center',
        })
    })

    // Fork arrows from checkpoint into Path A (left) and Path B (right)
    const forkY = 104
    const laneY = 136
    const laneW = 342
    const laneH = 148
    const leftX = 24
    const rightX = 394

    fig.line(width / 2, bY + bH + 2, width / 2, forkY + 8, { color: purple, width: 1.8 })
    fig.line(leftX + laneW / 2, forkY + 8, rightX + laneW / 2, forkY + 8, {
        color: purple,
        width: 1.8,
    })
    fig.arrow(leftX + laneW / 2, forkY + 8, leftX + laneW / 2, laneY - 3, {
        color: cyan,
        width: 1.8,
        head: 7,
    })
    fig.arrow(rightX + laneW / 2, forkY + 8, rightX + laneW / 2, laneY - 3, {
        color: green,
        width: 1.8,
        head: 7,
    })

    const paths = [
        { x: leftX, title: 'Path A · Uninterrupted in memory', color: cyan },
        { x: rightX, title: 'Path B · Restored from checkpoint', color: green },
    ]
    paths.forEach((p) => {
        fig.rect(p.x, laneY, laneW, laneH, {
            fill: tint(p.color, c.bg, 0.06),
            stroke: tint(p.color, c.bg, 0.45),
            strokeWidth: 1.4,
            radius: 8,
        })
        fig.text(p.x + 14, laneY + 22, p.title, {
            size: 14,
            weight: 700,
            color: p.color,
        })
        const rows = [
            ['Next batch', '12 × 48 from RNG@321'],
            ['Forward loss', 'L_CE = 5.5492 nats'],
            ['Optimizer', 'AdamW step 322 applied'],
        ]
        rows.forEach(([k, v], rIdx) => {
            const ry = laneY + 56 + rIdx * 34
            fig.text(p.x + 14, ry, k!, { size: 13, color: muted })
            fig.text(p.x + laneW - 14, ry, v!, {
                size: 13,
                mono: true,
                weight: 600,
                color: rIdx === 1 ? p.color : c.textPrimary,
                align: 'right',
            })
        })
    })

    // Converging arrows to parity check bar
    const botY = 316
    fig.arrow(leftX + laneW / 2, laneY + laneH + 2, leftX + laneW / 2, botY - 4, {
        color: cyan,
        width: 1.6,
        head: 6,
    })
    fig.arrow(rightX + laneW / 2, laneY + laneH + 2, rightX + laneW / 2, botY - 4, {
        color: green,
        width: 1.6,
        head: 6,
    })

    fig.rect(24, botY, width - 48, 48, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(44, botY + 24, 'Bitwise parity verified', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.text(248, botY + 24, 'max |logit_A − logit_B| = 0.0', {
        size: 13,
        mono: true,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(514, botY + 24, 'max |θ_A − θ_B| = 0.0', {
        size: 13,
        mono: true,
        weight: 600,
        color: c.textPrimary,
    })

    return fig.render()
}

export default create('dark')
