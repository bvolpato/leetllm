import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 420
export const alt =
    'Left traces Blelloch exclusive scan on [3, -1, 4, 1]: up-sweep reduces to 7, clearing the root to 0 seeds down-sweep outputs [0, 3, 2, 6], while Hillis-Steele computes [3, 2, 3, 5] then [3, 2, 6, 7]. Right charts addition counts: at N = 32 Hillis-Steele uses 129 vs 62 for Blelloch (2.08x), and at N = 512 it uses 4,097 vs 1,022 (4.01x).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('red')

    // === Left: Blelloch exclusive scan stage trace ===
    fig.text(24, 22, 'Blelloch exclusive scan on [3, -1, 4, 1]', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(24, 42, 'Up-sweep builds total 7; zero root seeds down-sweep', {
        size: 12,
        color: c.textSecondary,
    })

    const rows = [
        { stage: 'Input', vals: ['3', '-1', '4', '1'], hi: [] as number[], tone: c.textSecondary },
        { stage: 'Up 1', vals: ['3', '2', '4', '5'], hi: [1, 3], tone: purple },
        { stage: 'Up 2', vals: ['3', '2', '4', '7'], hi: [3], tone: blue },
        { stage: 'Zero', vals: ['3', '2', '4', '0'], hi: [3], tone: warm },
        { stage: 'Dn 2', vals: ['3', '0', '4', '2'], hi: [1, 3], tone: purple },
        { stage: 'Dn 1', vals: ['0', '3', '2', '6'], hi: [0, 1, 2, 3], tone: green },
    ]

    const gx = 92
    const cellW = 60
    const cellH = 34
    const gapX = 8
    const gapY = 8

    rows.forEach((r, ri) => {
        const y = 66 + ri * (cellH + gapY)
        fig.text(24, y + cellH / 2, r.stage, {
            size: 12.5,
            weight: 700,
            color: ri === 5 ? green : ri === 3 ? warm : ri === 2 ? blue : c.textSecondary,
            mono: true,
        })
        r.vals.forEach((v, ci) => {
            const x = gx + ci * (cellW + gapX)
            const active = r.hi.includes(ci)
            fig.rect(x, y, cellW, cellH, {
                fill: active
                    ? tint(r.tone, c.bg, isLight ? 0.2 : 0.34)
                    : tint(c.textMuted, c.bg, isLight ? 0.08 : 0.14),
                stroke: active ? r.tone : c.borderSubtle,
                strokeWidth: active ? 1.6 : 1,
                radius: 5,
            })
            fig.text(x + cellW / 2, y + cellH / 2, v, {
                size: 13.5,
                weight: active ? 700 : 500,
                color: active ? r.tone : c.textPrimary,
                align: 'center',
                mono: true,
            })
        })
    })

    // Hillis-Steele inclusive comparison below trace
    fig.line(24, 330, 368, 330, { color: c.borderSubtle, width: 1 })
    fig.text(24, 350, 'Hillis-Steele (inclusive stages):', {
        size: 12.5,
        weight: 700,
        color: blue,
    })
    fig.text(24, 372, 'step 1: [3, 2, 3, 5]   ->   step 2: [3, 2, 6, 7]', {
        size: 12.5,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(24, 396, 'Bars compare addition counts (O(N log N) vs O(N)).', {
        size: 11.5,
        color: c.textSecondary,
    })

    // Vertical divider
    fig.line(388, 20, 388, height - 20, { color: c.borderSubtle, width: 1 })

    // === Right: Addition count comparison bars (N = 32 & N = 512) ===
    const rx = 412
    const barX = rx
    const barW = 248

    // Block 1: N = 32
    fig.text(rx, 22, 'Work efficiency: addition counts', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rx, 54, 'N = 32 elements  (2.08× fewer adds)', {
        size: 13,
        weight: 700,
        color: blue,
    })

    const drawPair = (
        yTop: number,
        hsVal: number,
        blVal: number,
        hsTone: string,
        hsLabel: string,
        blLabel: string,
    ) => {
        // Hillis-Steele bar (100% of pair scale)
        fig.text(rx, yTop, 'Hillis-Steele', { size: 12, weight: 600, color: hsTone })
        fig.rect(barX, yTop + 12, barW, 24, {
            fill: tint(hsTone, c.bg, isLight ? 0.22 : 0.36),
            stroke: hsTone,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(barX + barW + 10, yTop + 24, hsLabel, {
            size: 13,
            weight: 700,
            color: hsTone,
            mono: true,
        })

        // Blelloch bar (proportional)
        const bw = barW * (blVal / hsVal)
        const y2 = yTop + 50
        fig.text(rx, y2, 'Blelloch (work-efficient)', { size: 12, weight: 600, color: green })
        fig.rect(barX, y2 + 12, bw, 24, {
            fill: tint(green, c.bg, isLight ? 0.24 : 0.38),
            stroke: green,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(barX + bw + 10, y2 + 24, blLabel, {
            size: 13,
            weight: 700,
            color: green,
            mono: true,
        })
    }

    drawPair(82, 129, 62, warm, '129', '62')

    fig.line(rx, 206, width - 24, 206, { color: c.borderSubtle, width: 1 })

    fig.text(rx, 232, 'N = 512 elements  (4.01× fewer adds)', {
        size: 13,
        weight: 700,
        color: red,
    })
    drawPair(260, 4097, 1022, red, '4,097', '1,022')

    fig.text(rx, 386, 'Gap widens logarithmically as N grows:', {
        size: 12,
        color: c.textSecondary,
    })
    fig.math(rx + 236, 386, '\\approx \\tfrac{1}{2}\\log_2 N', {
        size: 13.5,
        color: c.textPrimary,
    })

    return fig.render()
}

export default create('dark')
