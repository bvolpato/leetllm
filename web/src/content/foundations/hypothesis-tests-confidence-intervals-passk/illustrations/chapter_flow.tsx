import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 380
export const alt =
    'Six coding tasks paired across Model A and Model B displayed as a visual pass/fail grid beside a row-difference bar chart. Five tasks tie (three both pass, two both fail), while Task 2 (Perm fallback) is the single discordant row where A fails and B passes (+1). The bar chart counts 0 A-only wins, 5 ties, and 1 B-only win.'

const TASKS = [
    { id: '1', name: 'Timestamp range', a: 1, b: 1 },
    { id: '2', name: 'Perm fallback', a: 0, b: 1 },
    { id: '3', name: 'Retry budget cap', a: 1, b: 1 },
    { id: '4', name: 'Event dedupe', a: 0, b: 0 },
    { id: '5', name: 'Quota rounding', a: 1, b: 1 },
    { id: '6', name: 'Cache invalidation', a: 0, b: 0 },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // Left: Visual Paired Model A vs B Pass/Fail Grid
    fig.text(24, 24, 'Paired pass / fail grid (6 identical tasks)', {
        size: 15,
        weight: 700,
    })

    const colAX = 224
    const colBX = 308
    const colDX = 398
    const topY = 66
    const rowH = 38
    const rowGap = 8

    // Column headers
    fig.text(28, 52, 'Task', { size: 12, weight: 700, color: c.textSecondary })
    fig.text(colAX + 28, 52, 'Model A', { size: 12, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(colBX + 28, 52, 'Model B', { size: 12, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(colDX + 26, 52, 'B − A', { size: 12, weight: 700, color: c.textSecondary, align: 'center', mono: true })

    TASKS.forEach((task, idx) => {
        const y = topY + idx * (rowH + rowGap)
        const cy = y + rowH / 2
        const diff = task.b - task.a
        const isDiscordant = diff !== 0

        // Highlight the discordant +1 row cleanly across the full grid width
        if (isDiscordant) {
            fig.rect(18, y - 3, 444, rowH + 6, {
                fill: tint(green, c.bg, isLight ? 0.11 : 0.16),
                stroke: green,
                strokeWidth: 1.5,
                radius: 7,
            })
        }

        fig.text(28, cy, `${task.id}. ${task.name}`, {
            size: 13,
            weight: isDiscordant ? 700 : 500,
            color: isDiscordant ? c.textPrimary : c.textSecondary,
        })

        // Model A tile
        const drawTile = (x: number, pass: number, accent: string) => {
            const fill =
                pass === 1
                    ? tint(accent, c.bg, isLight ? 0.24 : 0.34)
                    : tint(c.textMuted, c.bg, isLight ? 0.06 : 0.1)
            fig.rect(x, y + 4, 56, rowH - 8, {
                fill,
                stroke: pass === 1 ? accent : c.borderSubtle,
                strokeWidth: pass === 1 ? 1.5 : 1,
                radius: 5,
            })
            fig.text(x + 28, cy, pass === 1 ? 'PASS' : 'fail', {
                size: 11,
                weight: pass === 1 ? 700 : 400,
                color: pass === 1 ? c.textPrimary : c.textMuted,
                align: 'center',
                mono: true,
            })
        }

        drawTile(colAX, task.a, blue)
        drawTile(colBX, task.b, isDiscordant ? green : blue)

        // Signed difference pill
        const diffTone = isDiscordant ? green : c.textMuted
        fig.rect(colDX, y + 4, 52, rowH - 8, {
            fill: isDiscordant ? tint(green, c.bg, isLight ? 0.24 : 0.35) : 'none',
            stroke: isDiscordant ? green : c.borderSubtle,
            strokeWidth: isDiscordant ? 1.5 : 0.8,
            radius: 5,
        })
        fig.text(colDX + 26, cy, diff === 1 ? '+1' : '0', {
            size: 13,
            weight: isDiscordant ? 700 : 500,
            color: diffTone,
            align: 'center',
            mono: true,
        })
    })

    // Footer solve rate summary under the grid
    fig.text(colAX + 28, 356, '3/6 (50%)', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    fig.text(colBX + 28, 356, '4/6 (67%)', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    fig.text(colDX + 26, 356, '+16.7 pp', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // Divider
    fig.line(492, 30, 492, 360, { color: c.borderSubtle, width: 1 })

    // Right: Row-difference distribution bar chart
    fig.text(526, 24, 'Paired differences (B − A)', {
        size: 15,
        weight: 700,
    })

    const plot = fig.plot(
        { x: 556, y: 66, width: 256, height: 220 },
        { x: [0.3, 3.7], y: [0, 6] },
    )
    plot.axes({
        yTicks: [0, 2, 4, 6],
        yLabel: 'Tasks',
        grid: true,
        labelSize: 12,
    })

    const bars = [
        { x: 1, label: 'A only\n(−1)', val: 0, tone: warm },
        { x: 2, label: 'Tie\n(0)', val: 5, tone: blue },
        { x: 3, label: 'B only\n(+1)', val: 1, tone: green },
    ]
    const bw = 54
    for (const b of bars) {
        const cx = plot.px(b.x)
        const yTop = plot.py(b.val)
        const yBot = plot.py(0)
        if (b.val > 0) {
            fig.rect(cx - bw / 2, yTop, bw, yBot - yTop, {
                fill: tint(b.tone, c.bg, isLight ? 0.24 : 0.36),
                stroke: b.tone,
                strokeWidth: 1.6,
                radius: 4,
            })
        } else {
            fig.line(cx - bw / 2, yBot - 1, cx + bw / 2, yBot - 1, {
                color: c.textMuted,
                width: 2,
            })
        }
        fig.text(cx, yTop - 13, String(b.val), {
            size: 14,
            weight: 700,
            color: b.val === 0 ? c.textMuted : b.tone,
            align: 'center',
            mono: true,
        })
        const [l1, l2] = b.label.split('\n')
        fig.text(cx, plot.bottom + 15, l1!, {
            size: 12,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(cx, plot.bottom + 31, l2!, {
            size: 11,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Clean compact tag directly above the B-only (+1) bar, clear of the Tie bar
    const bBarX = plot.px(3)
    const bBarTop = plot.py(1)
    fig.arrow(bBarX, plot.py(2.5), bBarX, bBarTop - 24, {
        color: green,
        width: 1.8,
        head: 6,
    })
    fig.text(bBarX, plot.py(2.95), 'Task 2', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Compact bottom takeaway under chart
    fig.text(684, 356, '1 discordant pair -> sign-test p = 0.500', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create
