import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/paged-attention-film'

export const width = 760
export const height = 390
export const alt =
    'Two snapshots of the same ten physical KV blocks. With maximum reservations, A and B each hold five blocks while using three, so C cannot obtain its two blocks. With dynamic allocation, A uses three, B three, and C two, leaving blocks 8 and 9 free.'

type Slot = readonly [owner: string, kind: 'live' | 'idle' | 'free']

const topPool: readonly Slot[] = [
    ['A', 'live'],
    ['A', 'live'],
    ['A', 'live'],
    ['A', 'idle'],
    ['A', 'idle'],
    ['B', 'live'],
    ['B', 'live'],
    ['B', 'live'],
    ['B', 'idle'],
    ['B', 'idle'],
]

const botPool: readonly Slot[] = [
    ['A', 'live'],
    ['B', 'live'],
    ['A', 'live'],
    ['B', 'live'],
    ['A', 'live'],
    ['B', 'live'],
    ['C', 'live'],
    ['C', 'live'],
    ['', 'free'],
    ['', 'free'],
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    const ownerColor = (owner: string) =>
        owner === 'A' ? purple : owner === 'B' ? blue : owner === 'C' ? cyan : green

    const cellW = 62
    const gap = 9
    const startX = 28

    const drawPoolRow = (
        slots: readonly Slot[],
        title: string,
        status: string,
        statusColor: string,
        yBase: number,
    ) => {
        fig.text(startX, yBase, title, {
            size: 15,
            weight: 700,
            color: c.textPrimary,
        })
        fig.text(width - 28, yBase, status, {
            size: 13,
            weight: 700,
            color: statusColor,
            align: 'right',
        })

        const boxY = yBase + 38
        const boxH = 62
        slots.forEach(([owner, kind], i) => {
            const x = startX + i * (cellW + gap)
            const tone = ownerColor(owner)

            fig.text(x + cellW / 2, boxY - 14, `#${i}`, {
                size: 12,
                color: c.textMuted,
                align: 'center',
                mono: true,
            })

            if (kind === 'live') {
                fig.rect(x, boxY, cellW, boxH, {
                    fill: tint(tone, c.bg, theme === 'light' ? 0.22 : 0.34),
                    stroke: tone,
                    strokeWidth: 2,
                    radius: 7,
                })
                fig.text(x + cellW / 2, boxY + boxH / 2, owner, {
                    size: 17,
                    weight: 700,
                    color: tone,
                    align: 'center',
                })
            } else if (kind === 'idle') {
                fig.rect(x, boxY, cellW, boxH, {
                    fill: tint(tone, c.bg, theme === 'light' ? 0.06 : 0.1),
                    stroke: tone,
                    strokeWidth: 1.4,
                    radius: 7,
                    opacity: 0.75,
                })
                fig.text(x + cellW / 2, boxY + 21, owner, {
                    size: 14,
                    weight: 600,
                    color: tone,
                    align: 'center',
                })
                fig.text(x + cellW / 2, boxY + 42, 'idle', {
                    size: 12,
                    color: c.textSecondary,
                    align: 'center',
                })
            } else {
                fig.rect(x, boxY, cellW, boxH, {
                    fill: tint(green, c.bg, theme === 'light' ? 0.08 : 0.12),
                    stroke: green,
                    strokeWidth: 1.5,
                    radius: 7,
                })
                fig.text(x + cellW / 2, boxY + boxH / 2, 'free', {
                    size: 13,
                    weight: 600,
                    color: green,
                    align: 'center',
                })
            }
        })
    }

    // Top row: Upfront maximum reservations
    drawPoolRow(
        topPool,
        'Upfront max reservations (5 blocks each for A & B)',
        '0 free → C blocked (needs 2)',
        red,
        24,
    )

    // Clean horizontal divider (NO stray vertical green arrow!)
    fig.line(28, 194, width - 28, 194, { color: c.borderSubtle, width: 1 })

    // Bottom row: Dynamic paged allocation
    drawPoolRow(
        botPool,
        'Dynamic paged allocation (assign blocks on growth)',
        'A: 3 · B: 3 · C: 2 · #8–#9 free',
        green,
        222,
    )

    fig.text(
        width / 2,
        362,
        'Same 10 physical KV blocks, same live token state · removing idle reservations admits C',
        {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create
