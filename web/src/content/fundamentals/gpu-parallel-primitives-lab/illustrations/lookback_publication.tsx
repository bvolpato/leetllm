import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Top band shows Tile 3 starting with local aggregate 2, walking left to read Tile 2 aggregate A=3 (running 5), Tile 1 aggregate A=4 (running 9), and Tile 0 prefix P=7 (inclusive prefix 16, exclusive offset 14). Bottom band shows write-before-release on the writer side matching acquire-before-read on the consumer side; plain flag polling lacks ordering and progress guarantees.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    // === Top Band: Tile 3 Decoupled Look-Back Walk ===
    fig.text(24, 22, '1. Tile 3 decoupled look-back walk (scan left until inclusive P)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(24, 42, 'State flags: X = not ready · A = tile aggregate ready · P = inclusive prefix ready', {
        size: 12,
        color: c.textSecondary,
    })

    const tiles = [
        { id: 'Tile 0', state: 'P: 7', walk: '9 + 7 = 16 (stop)', tone: green },
        { id: 'Tile 1', state: 'A: 4', walk: '5 + 4 = 9', tone: blue },
        { id: 'Tile 2', state: 'A: 3', walk: '2 + 3 = 5', tone: blue },
        { id: 'Tile 3', state: 'X: loc 2', walk: 'start local = 2', tone: warm },
    ]
    const tw = 158
    const tGap = 26
    const tY = 104
    const tH = 64

    tiles.forEach((t, i) => {
        const x = 24 + i * (tw + tGap)
        fig.rect(x, tY, tw, tH, {
            fill: tint(t.tone, c.bg, isLight ? 0.14 : 0.24),
            stroke: t.tone,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(x + tw / 2, tY + 18, t.id, {
            size: 12.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x + tw / 2, tY + 42, t.state, {
            size: 14,
            weight: 700,
            color: t.tone,
            align: 'center',
            mono: true,
        })
        fig.text(x + tw / 2, tY + tH + 18, t.walk, {
            size: 11.5,
            weight: i === 0 ? 700 : 600,
            color: i === 0 ? green : c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    // Curved leftward look-back hops above the tiles (T3 -> T2 -> T1 -> T0)
    const hopCenters = tiles.map((_, i) => 24 + i * (tw + tGap) + tw / 2)
    const hops = [
        { from: 3, to: 2, label: '+A(3)', col: blue },
        { from: 2, to: 1, label: '+A(4)', col: blue },
        { from: 1, to: 0, label: '+P(7)', col: green },
    ]
    for (const h of hops) {
        const x1 = hopCenters[h.from]
        const x2 = hopCenters[h.to]
        fig.callout([x2 + 6, tY - 6], [x1 - 6, tY - 6], '', {
            bend: 0.26,
            color: h.col,
            width: 2,
        })
        fig.text((x1 + x2) / 2, tY - 40, h.label, {
            size: 12,
            weight: 700,
            color: h.col,
            align: 'center',
            mono: true,
        })
    }

    // Output result strip for Tile 3
    fig.rect(128, 200, 236, 30, {
        fill: tint(warm, c.bg, isLight ? 0.16 : 0.28),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 15,
    })
    fig.text(246, 215, 'Tile 3 exclusive offset = 14', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    fig.rect(396, 200, 236, 30, {
        fill: tint(green, c.bg, isLight ? 0.16 : 0.28),
        stroke: green,
        strokeWidth: 1.4,
        radius: 15,
    })
    fig.text(514, 215, 'Tile 3 inclusive prefix = 16', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // === Bottom Band: Acquire/Release Memory Ordering ===
    const sepY = 248
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })
    fig.text(24, sepY + 22, '2. Release / acquire memory ordering (required for cross-block visibility)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const stages = [
        { title: '1. Store', sub: 'write A / P value', tone: blue },
        { title: '2. Release', sub: 'publish flag A/P', tone: purple },
        { title: '3. Acquire', sub: 'spin while flag X', tone: warm },
        { title: '4. Read', sub: 'payload visible', tone: green },
    ]
    const sy = sepY + 46
    stages.forEach((s, i) => {
        const x = 24 + i * (tw + tGap)
        fig.rect(x, sy, tw, 52, {
            fill: tint(s.tone, c.bg, isLight ? 0.14 : 0.24),
            stroke: s.tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(x + tw / 2, sy + 18, s.title, {
            size: 13,
            weight: 700,
            color: s.tone,
            align: 'center',
        })
        fig.text(x + tw / 2, sy + 36, s.sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
        if (i < stages.length - 1) {
            fig.arrow(x + tw + 3, sy + 26, x + tw + tGap - 3, sy + 26, {
                color: s.tone,
                width: 2,
                head: 6,
            })
        }
    })

    fig.text(
        width / 2,
        374,
        'Plain non-atomic flag polling lacks both ordering and forward-progress guarantees.',
        {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create('dark')
