import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Three VLM bridge designs connecting visual features to a language decoder for a 224 by 224 image. LLaVA projects all 256 patch tokens linearly into the LLM prefix. Qwen2.5-VL groups adjacent 2 by 2 patches via an MLP merger, shrinking 256 tokens fourfold to 64 prefix tokens. Flamingo uses a Perceiver Resampler where learned queries cross-attend to visual keys and values into 64 KV latents outside the prefix. On the right, a bar chart compares 448px prefix slots: 1,024 (1x1) vs 256 (2x2 merger, 4x KV drop).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    const fill = (col: string, strong = false) =>
        tint(col, c.bg, isLight ? (strong ? 0.24 : 0.12) : strong ? 0.42 : 0.22)

    const left = 22
    const rowW = 426

    // =========================================================================
    // Row 1: LLaVA (Token-wise MLP)
    // =========================================================================
    const r1Y = 20
    fig.text(left, r1Y, '1. LLaVA · token-wise MLP', {
        size: 14.5,
        weight: 700,
        color: blue,
    })

    // Vivid 4x4 grid (representing 16x16 = 256 unmerged tokens)
    const gX = left + 8
    const g1Y = r1Y + 20
    const cs = 17
    const cg = 3
    for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 4; col++) {
            fig.rect(gX + col * (cs + cg), g1Y + r * (cs + cg), cs, cs, {
                fill: fill(blue, true),
                stroke: blue,
                strokeWidth: 1.3,
                radius: 3,
            })
        }
    }
    fig.arrow(gX + 86, g1Y + 38, gX + 150, g1Y + 38, { color: blue, width: 1.8, head: 6 })
    fig.text(gX + 118, g1Y + 24, 'MLP', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    fig.rect(gX + 158, g1Y + 18, 224, 40, {
        fill: fill(blue, false),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(gX + 270, g1Y + 38, '256 slots → LLM prefix', {
        size: 13.5,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    fig.line(left, 130, left + rowW, 130, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // Row 2: Qwen2.5-VL (2x2 MLP merger with explicit quadrant brackets)
    // =========================================================================
    const r2Y = 148
    fig.text(left, r2Y, '2. Qwen2.5-VL · 2×2 spatial MLP merger', {
        size: 14.5,
        weight: 700,
        color: green,
    })

    const g2Y = r2Y + 20
    for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 4; col++) {
            const qTone = (Math.floor(r / 2) + Math.floor(col / 2)) % 2 === 0 ? green : cyan
            fig.rect(gX + col * (cs + cg), g2Y + r * (cs + cg), cs, cs, {
                fill: fill(qTone, true),
                stroke: qTone,
                strokeWidth: 1.2,
                radius: 3,
            })
        }
    }
    // Bold 2x2 quadrant grouping outlines
    const qSpan = 2 * cs + cg
    for (let qr = 0; qr < 2; qr++) {
        for (let qc = 0; qc < 2; qc++) {
            const qTone = (qr + qc) % 2 === 0 ? green : cyan
            fig.rect(
                gX + qc * (qSpan + cg) - 1.5,
                g2Y + qr * (qSpan + cg) - 1.5,
                qSpan + 3,
                qSpan + 3,
                {
                    stroke: qTone,
                    strokeWidth: 2,
                    radius: 4,
                },
            )
        }
    }

    fig.arrow(gX + 86, g2Y + 38, gX + 122, g2Y + 38, { color: green, width: 1.8, head: 6 })
    // Merged 2x2 mini output tokens
    const mX = gX + 128
    const mY = g2Y + 18
    const ms = 18
    for (let r = 0; r < 2; r++) {
        for (let col = 0; col < 2; col++) {
            const qTone = (r + col) % 2 === 0 ? green : cyan
            fig.rect(mX + col * (ms + 4), mY + r * (ms + 4), ms, ms, {
                fill: fill(qTone, true),
                stroke: qTone,
                strokeWidth: 1.5,
                radius: 4,
            })
        }
    }
    fig.arrow(mX + 46, g2Y + 38, mX + 74, g2Y + 38, { color: green, width: 1.8, head: 6 })
    fig.rect(mX + 80, g2Y + 18, 174, 40, {
        fill: fill(green, false),
        stroke: green,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(mX + 167, g2Y + 38, '64 slots → prefix', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    fig.line(left, 258, left + rowW, 258, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // Row 3: Flamingo (Perceiver Resampler cross-attention)
    // =========================================================================
    const r3Y = 276
    fig.text(left, r3Y, '3. Flamingo · Perceiver cross-attention', {
        size: 14.5,
        weight: 700,
        color: warm,
    })

    const g3Y = r3Y + 20
    // NFNet feature grid (4x4 warm-muted tiles = K, V)
    for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 4; col++) {
            fig.rect(gX + col * (cs + cg), g3Y + r * (cs + cg), cs, cs, {
                fill: fill(warm, false),
                stroke: warm,
                strokeWidth: 1.1,
                radius: 3,
            })
        }
    }
    fig.text(gX + 38, g3Y + 86, 'K, V features', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // Cross-attention fan-in into 4 learned latent queries
    const qX = gX + 148
    const qYs = [g3Y + 11, g3Y + 29, g3Y + 47, g3Y + 65]
    qYs.forEach((qy) => {
        fig.line(gX + 82, g3Y + 38, qX - 10, qy, {
            color: warm,
            width: 1.2,
            opacity: 0.75,
        })
        fig.circle(qX, qy, 7, {
            fill: fill(warm, true),
            stroke: warm,
            width: 1.5,
        })
    })
    fig.text(qX, g3Y + 86, 'Q latents', {
        size: 11.5,
        color: warm,
        weight: 600,
        align: 'center',
        mono: true,
    })

    fig.arrow(qX + 14, g3Y + 38, qX + 46, g3Y + 38, { color: warm, width: 1.8, head: 6 })
    fig.rect(qX + 52, g3Y + 18, 182, 40, {
        fill: fill(warm, false),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(qX + 143, g3Y + 32, '64 KV latents', {
        size: 13.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(qX + 143, g3Y + 49, '(outside text prefix)', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Vertical divider
    fig.line(472, 22, 472, height - 22, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // Right column: Prefix slots at 448px (P = 14 -> 32x32 patches)
    // =========================================================================
    const rx = 528
    const rw = 204
    fig.text(rx + rw / 2, 22, 'Prefix slots at 448px', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(rx + rw / 2, 44, 'P = 14 (32×32 = 1,024 patches)', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const plot = fig.plot({ x: rx, y: 74, width: rw, height: 228 }, { x: [0, 2], y: [0, 1200] })
    plot.axes({
        xTicks: [],
        yTicks: [0, 250, 500, 750, 1000],
        yFormat: (v) => (v === 1000 ? '1k' : String(v)),
        grid: true,
        labelSize: 12,
    })

    const bars = [
        { label: '1×1 linear', val: 1024, text: '1,024', color: blue },
        { label: '2×2 merger', val: 256, text: '256', color: green },
    ] as const

    const bw = 54
    bars.forEach((b, i) => {
        const cx = plot.px(i + 0.5)
        const topY = plot.py(b.val)
        fig.rect(cx - bw / 2, topY, bw, plot.bottom - topY, {
            fill: fill(b.color, true),
            stroke: b.color,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(cx, topY - 12, b.text, {
            size: 13.5,
            weight: 700,
            color: b.color,
            align: 'center',
            mono: true,
        })
        fig.text(cx, plot.bottom + 16, b.label, {
            size: 12.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    })

    fig.text(plot.px(1.5), plot.py(690), '4× fewer KV slots', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.arrow(plot.px(1.5), plot.py(620), plot.px(1.5), plot.py(375), {
        color: green,
        width: 1.8,
        head: 6,
    })

    return fig.render()
}

export default create('dark')
