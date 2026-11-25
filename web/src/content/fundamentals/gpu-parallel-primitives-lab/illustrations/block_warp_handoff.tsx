import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 410
export const alt =
    'Left traces warp 0 holding [1..8] in lanes 0 to 7 and zeros in lanes 8 to 31: offsets 16, 8, 4, 2, and 1 bring lane 0 from 1 through 1, 1, 6, and 16 to 36. Right shows eight warp leaders publishing [1..8] into shared warp_sums before __syncthreads(), then warp 0 padding lanes 8 to 31 with zero and summing to 36.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    // === Left: Stage 1 Warp 0 Shuffle ===
    fig.text(24, 22, 'Stage 1: Warp 0 down-shuffle', {
        size: 15,
        weight: 700,
        color: purple,
    })
    fig.text(24, 42, 'L0..L7 load [1..8]; tail lanes L8..L31 pad 0', {
        size: 12,
        color: c.textSecondary,
    })

    const cols = [24, 96, 174, 250]
    fig.text(cols[0], 72, 'Step', { size: 12, weight: 700, color: c.textSecondary })
    fig.text(cols[1], 72, 'Offset', { size: 12, weight: 700, color: c.textSecondary })
    fig.text(cols[2], 72, 'Read', { size: 12, weight: 700, color: c.textSecondary })
    fig.text(cols[3], 72, 'Lane 0', { size: 12, weight: 700, color: purple })
    fig.line(24, 84, 344, 84, { color: c.border, width: 1.2 })

    const steps = [
        { s: 'init', off: 'none', rd: 'x0 = 1', v: '1', done: false },
        { s: '1', off: '+16', rd: 'L16 = 0', v: '1', done: false },
        { s: '2', off: '+8', rd: 'L8 = 0', v: '1', done: false },
        { s: '3', off: '+4', rd: 'L4 = 5', v: '6', done: false },
        { s: '4', off: '+2', rd: 'L2 = 10', v: '16', done: false },
        { s: '5', off: '+1', rd: 'L1 = 20', v: '36', done: true },
    ]
    steps.forEach((st, i) => {
        const cy = 108 + i * 36
        if (st.done) {
            fig.rect(20, cy - 15, 330, 30, {
                fill: tint(green, c.bg, isLight ? 0.16 : 0.28),
                stroke: green,
                strokeWidth: 1.4,
                radius: 5,
            })
        } else if (i > 0) {
            fig.line(24, cy - 18, 344, cy - 18, { color: c.borderSubtle, width: 1 })
        }
        fig.text(cols[0], cy, st.s, { size: 12.5, color: c.textSecondary, mono: true })
        fig.text(cols[1], cy, st.off, {
            size: 12.5,
            weight: 600,
            color: st.done ? green : purple,
            mono: true,
        })
        fig.text(cols[2], cy, st.rd, { size: 12.5, color: c.textPrimary, mono: true })
        fig.text(cols[3], cy, st.v, {
            size: 13.5,
            weight: 700,
            color: st.done ? green : c.textPrimary,
            mono: true,
        })
    })

    // Handoff arrow down to shared write pill
    fig.arrow(184, 314, 184, 342, { color: purple, width: 2, head: 6 })
    fig.rect(36, 346, 296, 40, {
        fill: tint(purple, c.bg, isLight ? 0.14 : 0.24),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(184, 366, 'Lane 0 stores warp_sums[warp_id]', {
        size: 12.5,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })

    // Vertical divider
    fig.line(374, 20, 374, height - 20, { color: c.borderSubtle, width: 1 })

    // === Right: Stage 2 Shared-Memory Handoff ===
    const rx = 400
    const rw = 336
    fig.text(rx, 22, 'Stage 2: Cross-warp shared handoff', {
        size: 15,
        weight: 700,
        color: blue,
    })
    fig.text(rx, 42, '8 warp leaders write partials into shared warp_sums[0..7]', {
        size: 12,
        color: c.textSecondary,
    })

    // 2x4 shared memory cells
    const sw = 76
    const sh = 38
    const sGap = 10
    for (let i = 0; i < 8; i++) {
        const col = i % 4
        const row = Math.floor(i / 4)
        const cx = rx + col * (sw + sGap)
        const cy = 66 + row * (sh + 8)
        fig.rect(cx, cy, sw, sh, {
            fill: tint(blue, c.bg, isLight ? 0.16 : 0.28),
            stroke: blue,
            strokeWidth: 1.4,
            radius: 5,
        })
        fig.text(cx + sw / 2, cy + sh / 2, `w${i}: ${i + 1}`, {
            size: 13,
            weight: 700,
            color: blue,
            align: 'center',
            mono: true,
        })
    }

    // Barrier wall
    fig.arrow(rx + rw / 2, 158, rx + rw / 2, 182, { color: warm, width: 2, head: 6 })
    fig.rect(rx, 186, rw, 34, {
        fill: tint(warm, c.bg, isLight ? 0.18 : 0.3),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(rx + rw / 2, 203, '__syncthreads() · all 8 totals visible', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Warp 0 second pass
    fig.arrow(rx + rw / 2, 224, rx + rw / 2, 250, { color: purple, width: 2, head: 6 })
    fig.rect(rx, 254, rw, 54, {
        fill: tint(purple, c.bg, isLight ? 0.12 : 0.22),
        stroke: purple,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(rx + rw / 2, 272, 'Warp 0 loads warp_sums[0..7]', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(rx + rw / 2, 292, 'L0..L7 read [1..8] · L8..L31 pad 0 -> shuffle', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // Final output
    fig.arrow(rx + rw / 2, 312, rx + rw / 2, 342, { color: green, width: 2.2, head: 6 })
    fig.rect(rx + 46, 346, rw - 92, 40, {
        fill: tint(green, c.bg, isLight ? 0.2 : 0.34),
        stroke: green,
        strokeWidth: 1.8,
        radius: 7,
    })
    fig.text(rx + rw / 2, 366, 'Final block total = 36', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create('dark')
