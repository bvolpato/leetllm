import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/pagedattention-film'

export const width = 800
export const height = 435
export const alt =
    'Two 18-block memory pools. Fixed six-block reservations for A, B and C leave nine used and nine trapped. On-demand allocation holds A3, B4, C2, D3 and E2, with four blocks free.'

interface SlotSpec {
    label: string
    kind: 'A' | 'B' | 'C' | 'D' | 'E' | 'trapped' | 'free'
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const colors = {
        A: fig.tone('blue'),
        B: fig.tone('purple'),
        C: fig.tone('cyan'),
        D: fig.tone('green'),
        E: fig.tone('warm'),
        trapped: fig.tone('critical'),
        free: c.textMuted,
    }

    // Left 3x6 grid: Fixed 6-block contiguous reservation per request (A=3, B=4, C=2; 9 trapped)
    const fixedSlots: SlotSpec[] = [
        { label: 'A1', kind: 'A' },
        { label: 'A2', kind: 'A' },
        { label: 'A3', kind: 'A' },
        { label: '×', kind: 'trapped' },
        { label: '×', kind: 'trapped' },
        { label: '×', kind: 'trapped' },
        { label: 'B1', kind: 'B' },
        { label: 'B2', kind: 'B' },
        { label: 'B3', kind: 'B' },
        { label: 'B4', kind: 'B' },
        { label: '×', kind: 'trapped' },
        { label: '×', kind: 'trapped' },
        { label: 'C1', kind: 'C' },
        { label: 'C2', kind: 'C' },
        { label: '×', kind: 'trapped' },
        { label: '×', kind: 'trapped' },
        { label: '×', kind: 'trapped' },
        { label: '×', kind: 'trapped' },
    ]

    // Right 3x6 grid: On-demand paged allocation (A3, B4, C2, D3, E2 = 14 live, 4 free)
    const pagedSlots: SlotSpec[] = [
        { label: 'A1', kind: 'A' },
        { label: 'A2', kind: 'A' },
        { label: 'A3', kind: 'A' },
        { label: 'B1', kind: 'B' },
        { label: 'B2', kind: 'B' },
        { label: 'B3', kind: 'B' },
        { label: 'B4', kind: 'B' },
        { label: 'C1', kind: 'C' },
        { label: 'C2', kind: 'C' },
        { label: 'D1', kind: 'D' },
        { label: 'D2', kind: 'D' },
        { label: 'D3', kind: 'D' },
        { label: 'E1', kind: 'E' },
        { label: 'E2', kind: 'E' },
        { label: '', kind: 'free' },
        { label: '', kind: 'free' },
        { label: '', kind: 'free' },
        { label: '', kind: 'free' },
    ]

    const cell = 52
    const gap = 6
    const gridW = 6 * cell + 5 * gap // 342
    const gridH = 3 * cell + 2 * gap // 168
    const leftX = 32
    const rightX = 426
    const gridY = 82

    const drawPool = (
        x0: number,
        title: string,
        sub: string,
        subColor: string,
        slots: SlotSpec[],
        badgeText: string,
        badgeColor: string,
    ) => {
        fig.text(x0 + gridW / 2, 24, title, {
            size: 16,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x0 + gridW / 2, 47, sub, {
            size: 13.5,
            weight: 600,
            color: subColor,
            align: 'center',
        })

        slots.forEach((slot, idx) => {
            const r = Math.floor(idx / 6)
            const col = idx % 6
            const x = x0 + col * (cell + gap)
            const y = gridY + r * (cell + gap)
            const colHex = colors[slot.kind]

            if (slot.kind === 'trapped') {
                fig.rect(x, y, cell, cell, {
                    fill: tint(colHex, c.bg, theme === 'light' ? 0.09 : 0.14),
                    stroke: tint(colHex, c.bg, 0.45),
                    strokeWidth: 1.25,
                    radius: 7,
                })
                // Subtle diagonal hatch showing stranded reserved capacity
                fig.line(x + 9, y + cell - 9, x + cell - 9, y + 9, {
                    color: colHex,
                    width: 1.25,
                    opacity: 0.42,
                })
                fig.text(x + cell / 2, y + cell / 2, 'trapped', {
                    size: 10.5,
                    weight: 600,
                    color: colHex,
                    align: 'center',
                })
            } else if (slot.kind === 'free') {
                fig.rect(x, y, cell, cell, {
                    fill: tint(c.textMuted, c.bg, 0.06),
                    stroke: c.border,
                    strokeWidth: 1.2,
                    radius: 7,
                })
                fig.path(
                    `M${x + 4} ${y + 4}H${x + cell - 4}V${y + cell - 4}H${x + 4}Z`,
                    { color: c.textMuted, width: 1, dash: '4 3', opacity: 0.55 },
                )
                fig.text(x + cell / 2, y + cell / 2, 'free', {
                    size: 11.5,
                    color: c.textMuted,
                    align: 'center',
                })
            } else {
                fig.rect(x, y, cell, cell, {
                    fill: tint(colHex, c.bg, theme === 'light' ? 0.22 : 0.3),
                    stroke: colHex,
                    strokeWidth: 1.75,
                    radius: 7,
                })
                fig.text(x + cell / 2, y + cell / 2, slot.label, {
                    size: 14,
                    weight: 700,
                    color: colHex,
                    align: 'center',
                    mono: true,
                })
            }
        })

        // Status summary pill directly below each 18-block grid
        const pillY = gridY + gridH + 20
        fig.rect(x0 + 18, pillY, gridW - 36, 36, {
            fill: tint(badgeColor, c.bg, theme === 'light' ? 0.1 : 0.15),
            stroke: badgeColor,
            strokeWidth: 1.25,
            radius: 18,
        })
        fig.text(x0 + gridW / 2, pillY + 18, badgeText, {
            size: 13.5,
            weight: 700,
            color: badgeColor,
            align: 'center',
        })
    }

    drawPool(
        leftX,
        'Fixed: 6 blocks per request',
        '9 live · 9 trapped (50% wasted)',
        colors.trapped,
        fixedSlots,
        'Requests D & E wait in queue',
        colors.trapped,
    )

    drawPool(
        rightX,
        'On demand: paged blocks',
        '14 live · 4 free (78% utilized)',
        colors.D,
        pagedSlots,
        'All 5 requests (A–E) run concurrently',
        colors.D,
    )

    // Subtle vertical divider between strategies
    fig.line(400, 26, 400, 314, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // Compact legend along bottom
    const legendY = 368
    const items: { label: string; color: string; dashed?: boolean }[] = [
        { label: 'Req A (3)', color: colors.A },
        { label: 'Req B (4)', color: colors.B },
        { label: 'Req C (2)', color: colors.C },
        { label: 'Req D (3)', color: colors.D },
        { label: 'Req E (2)', color: colors.E },
        { label: 'Trapped', color: colors.trapped },
        { label: 'Free', color: c.textMuted, dashed: true },
    ]
    let lx = 36
    for (const item of items) {
        fig.rect(lx, legendY, 14, 14, {
            fill: item.dashed ? 'none' : tint(item.color, c.bg, 0.35),
            stroke: item.color,
            strokeWidth: 1.5,
            radius: 3.5,
        })
        fig.text(lx + 20, legendY + 7, item.label, {
            size: 12.5,
            weight: 600,
            color: c.textSecondary,
        })
        lx += item.label.length * 7.2 + 40
    }

    // Subtle note on bottom row right-aligned or centered
    fig.text(400, 408, 'Same 18-block KV pool: non-contiguous paging eliminates internal reservation fragmentation', {
        size: 12.5,
        color: c.textMuted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
