import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 450
export const alt =
    'Asynchronous tile-stage ownership lifecycle, double-buffered Slot 0 and Slot 1 overlap Gantt timeline, and GPU async hardware progression. Top ribbon shows the six phases: 01 Acquire, 02 Issue copy, 03 Wait read, 04 MMA compute, 05 Wait done, and 06 Release. Center Gantt timeline shows Slot 0 computing tile t while Slot 1 asynchronously copies tile t+1, then swapping roles across the Phase 05 guard barrier (preventing early-release races). Bottom strip tracks Pre-Ampere register staging, Ampere cp.async, Hopper TMA plus WGMMA, and Blackwell tcgen05 plus TMEM.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')

    // --- Top: 6-phase ownership cycle ribbon ---
    fig.text(28, 20, 'Six-phase stage ownership cycle', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const phases = [
        { num: '01', name: 'Acquire', color: c.textSecondary },
        { num: '02', name: 'Copy G→S', color: blue },
        { num: '03', name: 'Wait rd', color: warm },
        { num: '04', name: 'MMA', color: green },
        { num: '05', name: 'Wait dn', color: warm },
        { num: '06', name: 'Release', color: red },
    ]
    const boxW = 98
    const boxGap = 22
    const pStartX = 32
    const pY = 44
    phases.forEach((p, i) => {
        const x = pStartX + i * (boxW + boxGap)
        fig.rect(x, pY, boxW, 38, {
            fill: tint(p.color, c.bg, theme === 'light' ? 0.14 : 0.22),
            stroke: p.color,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(x + boxW / 2, pY + 12, p.num, {
            size: 11,
            weight: 700,
            color: p.color,
            align: 'center',
            mono: true,
        })
        fig.text(x + boxW / 2, pY + 27, p.name, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
        if (i < phases.length - 1) {
            fig.arrow(x + boxW + 2, pY + 19, x + boxW + boxGap - 2, pY + 19, {
                color: c.textMuted,
                width: 1.5,
                head: 5.5,
            })
        }
    })

    // Return loop arc 06 -> 01 underneath
    const firstCx = pStartX + boxW / 2
    const lastCx = pStartX + 5 * (boxW + boxGap) + boxW / 2
    fig.path(`M${lastCx} ${pY + 38} V${pY + 52} H${firstCx} V${pY + 42}`, {
        color: c.textMuted,
        width: 1.25,
        dash: '4 3',
    })
    fig.arrow(firstCx, pY + 48, firstCx, pY + 39, { color: c.textMuted, width: 1.25, head: 5 })

    // --- Middle: Double-Buffered S0 / S1 Overlap Gantt Timeline ---
    fig.text(28, 122, 'Double-buffer overlap (Slot S0 & Slot S1)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const trackX = 96
    const trackW = 632
    const s0Y = 166
    const s1Y = 236
    const barH = 38

    // Interval columns (A, Guard, B, Guard, C)
    const intAX = trackX
    const intAW = 196
    const guard1X = intAX + intAW + 18
    const intBX = guard1X + 20
    const intBW = 196
    const guard2X = intBX + intBW + 18
    const intCX = guard2X + 20
    const intCW = trackX + trackW - intCX

    // Subtle overlap column backgrounds
    for (const [ix, iw, label] of [
        [intAX, intAW, 'Interval A (overlap)'],
        [intBX, intBW, 'Interval B (overlap)'],
        [intCX, intCW, 'Interval C'],
    ] as const) {
        fig.rect(ix, s0Y - 12, iw, s1Y - s0Y + barH + 24, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.04 : 0.08),
            radius: 6,
        })
        fig.text(ix + iw / 2, s0Y - 22, label, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            weight: 600,
        })
    }

    // Track labels
    fig.text(trackX - 14, s0Y + barH / 2, 'Slot S0', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
        mono: true,
    })
    fig.text(trackX - 14, s1Y + barH / 2, 'Slot S1', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
        mono: true,
    })

    const drawBlock = (x: number, y: number, w: number, label: string, sub: string, tone: string) => {
        fig.rect(x, y, w, barH, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.2 : 0.3),
            stroke: tone,
            strokeWidth: 1.75,
            radius: 6,
        })
        fig.text(x + w / 2, y + 13, label, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x + w / 2, y + 29, sub, {
            size: 11,
            color: tone,
            align: 'center',
            mono: true,
        })
    }

    // Slot S0: MMA tile t -> Guard -> Copy tile t+2 -> Guard -> MMA tile t+2
    drawBlock(intAX + 6, s0Y, intAW - 12, '04 MMA · tile t', 'read S0', green)
    drawBlock(intBX + 6, s0Y, intBW - 12, '02 Copy · tile t+2', 'G → S0', blue)
    drawBlock(intCX + 6, s0Y, intCW - 12, '04 MMA · t+2', 'read S0', green)

    // Slot S1: Copy tile t+1 -> Guard -> MMA tile t+1 -> Guard -> Copy tile t+3
    drawBlock(intAX + 6, s1Y, intAW - 12, '02 Copy · tile t+1', 'G → S1', blue)
    drawBlock(intBX + 6, s1Y, intBW - 12, '04 MMA · tile t+1', 'read S1', green)
    drawBlock(intCX + 6, s1Y, intCW - 12, '02 Copy · t+3', 'G → S1', blue)

    // Guard vertical dashed lines
    for (const gx of [guard1X, guard2X]) {
        fig.line(gx, s0Y - 12, gx, s1Y + barH + 16, {
            color: warm,
            width: 1.75,
            dash: '5 4',
        })
        fig.circle(gx, s0Y + barH / 2, 4, { fill: warm })
        fig.circle(gx, s1Y + barH / 2, 4, { fill: green })
    }

    // Callout highlighting the Wait-5 race guard
    fig.callout(
        [guard1X, s1Y + barH + 14],
        [guard1X + 42, 316],
        'Phase 05 Wait done · releasing S0 earlier races with MMA',
        {
            color: red,
            size: 13,
            weight: 600,
            align: 'left',
            bend: 0.15,
        },
    )

    // Hairline divider
    fig.line(28, 344, 732, 344, { color: c.borderSubtle, width: 1 })

    // --- Bottom: Hardware Async Progression ---
    fig.text(28, 366, 'Hardware async tiers', {
        size: 14,
        weight: 600,
        color: c.textSecondary,
    })

    const tiers = [
        { name: 'Pre-Ampere', path: 'G→R→S', guard: 'sync()', color: c.textSecondary },
        { name: 'Ampere', path: 'cp.async', guard: 'wait_grp', color: blue },
        { name: 'Hopper', path: 'TMA/WGMMA', guard: 'parity', color: green },
        { name: 'Blackwell', path: 'TMA/TMEM', guard: 'tcgen05', color: purple },
    ]
    const tW = 160
    const tGap = 20
    const tStartX = 28
    const tY = 386
    tiers.forEach((t, i) => {
        const x = tStartX + i * (tW + tGap)
        fig.rect(x, tY, tW, 50, {
            fill: tint(t.color, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: tint(t.color, c.bg, 0.45),
            strokeWidth: 1.25,
            radius: 6,
        })
        fig.text(x + 10, tY + 15, t.name, { size: 13, weight: 700, color: t.color })
        fig.text(x + 10, tY + 34, `${t.path} · ${t.guard}`, {
            size: 11,
            color: c.textSecondary,
            mono: true,
        })
        if (i < tiers.length - 1) {
            fig.arrow(x + tW + 2, tY + 25, x + tW + tGap - 2, tY + 25, {
                color: c.textMuted,
                width: 1.4,
                head: 5,
            })
        }
    })

    return fig.render()
}

export default create
