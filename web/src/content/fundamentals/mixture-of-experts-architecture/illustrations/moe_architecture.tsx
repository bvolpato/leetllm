import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/moe-architecture-film'

export const width = 760
export const height = 395
export const alt =
    'Token x = [1, 0, 0, 0] enters a four-expert top-2 router with softmax probabilities 0.522 (E1), 0.259 (E3), 0.170 (E2), and 0.050 (E4). E1 and E3 are selected with renormalized weights 0.668 and 0.332 while E2 and E4 stay idle in memory. E1 outputs [2, 0, 0, 0] and E3 outputs [0, 3, 0, 0], blending to y = [1.336, 0.995, 0, 0].'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const muted = c.textMuted

    const fill = (col: string, strong = true) =>
        tint(col, c.bg, isLight ? (strong ? 0.2 : 0.1) : strong ? 0.34 : 0.18)
    const idleFill = isLight ? '#f0ede5' : '#161a24'

    // =========================================================================
    // Left half: Router softmax bars + Top-2 renormalization
    // =========================================================================
    const left = 22
    fig.text(left, 20, '1. Router softmax & Top-2 gate', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(left, 44, 'Renormalize top-2: pᵢ / (0.522 + 0.259)', {
        size: 13.5,
        color: c.textSecondary,
    })

    const barX = 96
    const barW = 128
    const rows = [
        { name: 'E1', logit: '−0.65', p: 0.522, note: '0.522 → 0.668', active: true, col: blue },
        { name: 'E3', logit: '−1.35', p: 0.259, note: '0.259 → 0.332', active: true, col: green },
        { name: 'E2', logit: '−1.77', p: 0.17, note: '0.170 (idle)', active: false, col: muted },
        { name: 'E4', logit: '−3.00', p: 0.05, note: '0.050 (idle)', active: false, col: muted },
    ] as const

    rows.forEach((r, idx) => {
        const y = 78 + idx * 54
        fig.text(left, y + 6, r.name, {
            size: 14,
            weight: 700,
            color: r.active ? r.col : c.textMuted,
            mono: true,
        })
        fig.text(left, y + 26, `z=${r.logit}`, {
            size: 13,
            color: c.textMuted,
            mono: true,
        })

        // Bar track
        fig.rect(barX, y + 4, barW, 24, {
            fill: idleFill,
            stroke: c.borderSubtle,
            strokeWidth: 0.9,
            radius: 4,
        })
        fig.rect(barX, y + 4, Math.max(8, (r.p / 0.6) * barW), 24, {
            fill: r.active ? fill(r.col, true) : (isLight ? '#dfd9cc' : '#252a36'),
            stroke: r.col,
            strokeWidth: r.active ? 1.5 : 1,
            radius: 4,
        })
        fig.text(barX + barW + 10, y + 16, r.note, {
            size: 13.5,
            weight: r.active ? 700 : 500,
            color: r.active ? r.col : c.textMuted,
            mono: true,
        })
    })

    // Compact summary under left bars
    fig.rect(left, 314, 344, 58, {
        fill: fill(warm, false),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 8,
    })
    fig.math(left + 172, 334, 'y = 0.668\\,E_1(x) + 0.332\\,E_3(x)', {
        size: 14,
        color: warm,
        align: 'center',
    })
    fig.text(left + 172, 358, '= [1.336, 0.995, 0, 0]', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Vertical divider
    fig.line(386, 20, 386, height - 20, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // Right half: Sparse execution graph (x -> active E1, E3 -> blend y)
    // =========================================================================
    const rLeft = 408
    fig.text(rLeft, 20, '2. Sparse dispatch & blend', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rLeft, 44, 'E2 & E4 stay resident, skip compute', {
        size: 13.5,
        color: c.textSecondary,
    })

    // Token x node
    const xBoxX = 408
    const xBoxY = 172
    const xBoxW = 86
    const xBoxH = 56
    fig.rect(xBoxX, xBoxY, xBoxW, xBoxH, {
        fill: fill(purple, true),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(xBoxX + xBoxW / 2, xBoxY + 18, 'x', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })
    fig.text(xBoxX + xBoxW / 2, xBoxY + 39, '[1,0,0,0]', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // 4 Expert boxes in center column
    const eX = 532
    const eW = 114
    const eSpecs = [
        { y: 74, h: 58, name: 'E1 (run)', detail: '[2,0,0,0]', wLabel: '0.668', active: true, col: blue },
        { y: 146, h: 42, name: 'E2 (idle)', detail: 'skipped', wLabel: '', active: false, col: muted },
        { y: 202, h: 58, name: 'E3 (run)', detail: '[0,3,0,0]', wLabel: '0.332', active: true, col: green },
        { y: 274, h: 42, name: 'E4 (idle)', detail: 'skipped', wLabel: '', active: false, col: muted },
    ] as const

    // Output y node on far right
    const yX = 674
    const yY = 166
    const yW = 72
    const yH = 68
    fig.rect(yX, yY, yW, yH, {
        fill: fill(warm, true),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(yX + yW / 2, yY + 22, 'Sum y', {
        size: 13.5,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(yX + yW / 2, yY + 46, 'k = 2', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    const srcRight = xBoxX + xBoxW
    const srcMidY = xBoxY + xBoxH / 2
    const dstMidY = yY + yH / 2

    eSpecs.forEach((e) => {
        const midY = e.y + e.h / 2
        fig.rect(eX, e.y, eW, e.h, {
            fill: e.active ? fill(e.col, true) : idleFill,
            stroke: e.col,
            strokeWidth: e.active ? 1.6 : 1,
            radius: 8,
            opacity: e.active ? 1 : 0.65,
        })
        fig.text(eX + eW / 2, e.active ? e.y + 18 : midY, e.name, {
            size: e.active ? 14 : 13.5,
            weight: e.active ? 700 : 500,
            color: e.active ? e.col : c.textMuted,
            align: 'center',
        })
        if (e.active) {
            fig.text(eX + eW / 2, e.y + 40, e.detail, {
                size: 13.5,
                color: c.textPrimary,
                align: 'center',
                mono: true,
            })

            // Dispatch curve x -> Expert
            const mx1 = (srcRight + eX) / 2
            fig.path(`M${srcRight} ${srcMidY} C${mx1} ${srcMidY},${mx1} ${midY},${eX - 6} ${midY}`, {
                color: e.col,
                width: 1.8,
            })
            fig.arrow(eX - 10, midY, eX - 2, midY, { color: e.col, width: 1.8, head: 6 })

            // Combine curve Expert -> y
            const exRight = eX + eW
            const mx2 = (exRight + yX) / 2
            fig.path(`M${exRight} ${midY} C${mx2} ${midY},${mx2} ${dstMidY},${yX - 6} ${dstMidY}`, {
                color: e.col,
                width: 1.8,
            })
            fig.arrow(yX - 10, dstMidY, yX - 2, dstMidY, { color: e.col, width: 1.8, head: 6 })

            // Edge weight tag placed cleanly above/below expert box
            fig.text(exRight + 10, e.name.startsWith('E1') ? midY - 22 : midY + 24, `×${e.wLabel}`, {
                size: 13,
                weight: 700,
                color: e.col,
                mono: true,
            })
        }
    })

    // Compact contributions readout under right graph
    fig.text(406, 350, 'E1: [1.336,0,0,0]', { size: 13.5, weight: 600, color: blue, mono: true })
    fig.text(586, 350, 'E3: [0,0.995,0,0]', { size: 13.5, weight: 600, color: green, mono: true })

    return fig.render()
}

export default create('dark')
