import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 430
export const alt =
    'In the 32-stream schedule, an exclusive 8,192-token prompt prefill occupies 200 ms before an active stream gets its normal 35 ms decode gap, so that stream waits 235 ms between tokens. A separate logical turn rail splits a 6,144-token prompt into three 2,048-token chunks and alternates P1, D1, P2, D2, P3, D3.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const purple = fig.tone('purple')

    // === Band 1: Exclusive prefill stalls active decode ===
    fig.text(24, 22, '1. Exclusive 8,192-token prefill stalls active streams', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 24
    const barW = 672
    const barY = 48
    const barH = 44
    const preW = (barW * 200) / 235
    const decW = barW - preW - 4

    fig.rect(barX, barY, preW, barH, {
        fill: tint(warm, c.bg, isLight ? 0.22 : 0.36),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(barX + preW / 2, barY + barH / 2, 'Exclusive prompt prefill · 200 ms', {
        size: 14.5,
        weight: 700,
        color: warm,
        align: 'center',
    })

    fig.rect(barX + preW + 4, barY, decW, barH, {
        fill: tint(blue, c.bg, isLight ? 0.22 : 0.36),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(barX + preW + 4 + decW / 2, barY + barH / 2, '35 ms', {
        size: 14.5,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    fig.brace(barX, barY + barH + 8, barX + barW, barY + barH + 8, 'Active-stream ITL jumps to 200 + 35 = 235 ms', {
        side: 1,
        depth: 8,
        color: warm,
        labelColor: warm,
        labelSize: 14.5,
        labelGap: 16,
    })

    // === Band 2: New request TTFT path (distinct from active ITL) ===
    const sep1 = 154
    fig.line(24, sep1, width - 24, sep1, { color: c.borderSubtle, width: 1 })
    fig.text(24, sep1 + 24, '2. New request first-token path (TTFT)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const ty = sep1 + 48
    fig.rect(24, ty, 120, 38, {
        fill: tint(cyan, c.bg, isLight ? 0.18 : 0.3),
        stroke: cyan,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(84, ty + 19, 'Arrival', { size: 14.5, weight: 700, color: cyan, align: 'center' })
    fig.arrow(148, ty + 19, 194, ty + 19, { color: cyan, width: 2, head: 6 })

    fig.rect(198, ty, 498, 38, {
        fill: tint(cyan, c.bg, isLight ? 0.1 : 0.18),
        stroke: cyan,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(447, ty + 19, 'Queue + prefill + first token (measured separately from ITL)', {
        size: 14.5,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    // === Band 3: Chunked prefill interleaving ===
    const sep2 = 266
    fig.line(24, sep2, width - 24, sep2, { color: c.borderSubtle, width: 1 })
    fig.text(24, sep2 + 24, '3. Chunked prefill: 6,144 tokens / 2,048 = 3 interleaved turns', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const turns = [
        { k: 'P1', sub: '2,048', tone: purple, w: 112 },
        { k: 'D1', sub: 'decode', tone: blue, w: 96 },
        { k: 'P2', sub: '2,048', tone: purple, w: 112 },
        { k: 'D2', sub: 'decode', tone: blue, w: 96 },
        { k: 'P3', sub: '2,048', tone: purple, w: 112 },
        { k: 'D3', sub: 'decode', tone: blue, w: 96 },
    ]
    let cx = 24
    const cy = sep2 + 52
    for (const t of turns) {
        fig.rect(cx, cy, t.w, 54, {
            fill: tint(t.tone, c.bg, isLight ? 0.16 : 0.28),
            stroke: t.tone,
            strokeWidth: 1.6,
            radius: 6,
        })
        fig.text(cx + t.w / 2, cy + 18, t.k, {
            size: 15,
            weight: 700,
            color: t.tone,
            align: 'center',
        })
        fig.text(cx + t.w / 2, cy + 38, t.sub, {
            size: 14,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
        cx += t.w + 9.5
    }

    fig.text(24, 404, 'Logical turn order: decode runs between chunks so ITL stays bounded.', {
        size: 14.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
