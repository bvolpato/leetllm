import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 380
export const alt =
    'Graph of rank-0 warmup: Rank 0 compiles sm_90 and populates key K(sm_90) in the shared cache before an MPI barrier. Post-barrier, a rank querying K(sm_90) in the shared cache hits, Rank 1 requesting sm_100 builds key K(sm_100) and misses, and a worker using an empty private cache misses even for the identical sm_90 recipe.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    fig.text(24, 22, 'Shared-cache warmup across distributed ranks', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        tone: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, isLight ? 0.14 : 0.24),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(x + w / 2, y + h / 2 - 8, title, {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
        })
        fig.text(x + w / 2, y + h / 2 + 9, sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Left pre-barrier: Rank 0 -> Shared cache
    const midY = 178
    box(24, midY - 28, 138, 56, 'Rank 0', 'compile sm_90', blue)
    fig.arrow(166, midY, 196, midY, { color: blue, width: 2, head: 6 })
    box(200, midY - 28, 152, 56, 'Shared cache', 'stores K(sm_90)', cyan)

    // Vertical MPI barrier wall
    const barX = 406
    fig.line(barX, 52, barX, 304, { color: c.textMuted, width: 2.2, dash: '6 4' })
    fig.rect(barX - 42, 46, 84, 24, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.14 : 0.24),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 12,
    })
    fig.text(barX, 58, 'Barrier', {
        size: 12,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    fig.arrow(356, midY, barX - 6, midY, { color: cyan, width: 2, head: 5 })

    // Post-barrier outcomes (3 clear rows on right)
    const outX = 486
    const outW = 250
    const ys = [92, 178, 264]

    // Outcome 1: HIT
    fig.arrow(barX + 6, midY, outX - 6, ys[0], { color: green, width: 2.2, head: 6 })
    box(outX, ys[0] - 26, outW, 52, 'Shared dir · sm_90 -> HIT', 'reuses K(sm_90) binary', green)

    // Outcome 2: Arch mismatch MISS
    fig.arrow(barX + 6, midY, outX - 6, ys[1], { color: warm, width: 2, head: 6 })
    box(outX, ys[1] - 26, outW, 52, 'Rank 1 · sm_100 -> MISS', 'different key K(sm_100)', warm)

    // Outcome 3: Private dir MISS
    fig.arrow(barX + 6, midY, outX - 6, ys[2], { color: red, width: 2, head: 6 })
    box(outX, ys[2] - 26, outW, 52, 'Private dir · sm_90 -> MISS', 'empty local dir rebuilds', red)

    // Bottom hairline summary
    fig.line(24, 324, width - 24, 324, { color: c.borderSubtle, width: 1 })
    fig.text(
        24,
        352,
        'Warmup hits require both identical target key K and the same shared cache directory.',
        {
            size: 12.5,
            weight: 600,
            color: c.textSecondary,
        },
    )

    return fig.render()
}

export default create('dark')
