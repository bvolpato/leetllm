import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 420
export const alt =
    'Left shows all 32 warp lanes with lanes 0 to 19 holding 1 and tail lanes 20 to 31 padded with 0, plus Lane 0 combining offsets 16, 8, 4, 2, and 1 along 1 -> 2 -> 3 -> 5 -> 10 -> 20. Right top shows early tail exit leaving Lane 20 undefined when Lane 4 reads it at offset 16. Right bottom shows Lane 16 at offset 16 rejecting source 32 >= 32 and keeping total 20.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    // === Left: All 32 Lanes Participate ===
    fig.text(24, 22, 'All 32 lanes run every shuffle (pad tail = 0)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(24, 42, 'Lanes 0..19 active (1) · tail lanes 20..31 padded (0)', {
        size: 12,
        color: c.textSecondary,
    })

    // 4x8 warp lane grid
    const gx = 24
    const gy = 62
    const cw = 42
    const ch = 34
    const gGap = 4
    for (let i = 0; i < 32; i++) {
        const col = i % 8
        const row = Math.floor(i / 8)
        const x = gx + col * (cw + gGap)
        const y = gy + row * (ch + gGap)
        const active = i < 20
        fig.rect(x, y, cw, ch, {
            fill: tint(active ? green : c.textMuted, c.bg, isLight ? (active ? 0.2 : 0.09) : active ? 0.32 : 0.16),
            stroke: active ? green : c.borderSubtle,
            strokeWidth: active ? 1.4 : 1,
            radius: 4,
        })
        fig.text(x + cw / 2, y + 11, `L${i}`, {
            size: 9.5,
            color: c.textMuted,
            align: 'center',
            mono: true,
        })
        fig.text(x + cw / 2, y + 24, active ? '1' : '0', {
            size: 12.5,
            weight: 700,
            color: active ? green : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Lane 0 down-shuffle trace strip
    fig.text(24, 236, 'Lane 0 down-shuffle accumulation', {
        size: 13.5,
        weight: 700,
        color: purple,
    })
    const trace = [
        { k: 'init', v: '1' },
        { k: '+16', v: '2' },
        { k: '+8', v: '3' },
        { k: '+4', v: '5' },
        { k: '+2', v: '10' },
        { k: '+1', v: '20' },
    ]
    const tw = 56
    const tGap = 5
    const ty = 254
    trace.forEach((tr, i) => {
        const x = 24 + i * (tw + tGap)
        const last = i === trace.length - 1
        fig.rect(x, ty, tw, 48, {
            fill: tint(last ? green : purple, c.bg, isLight ? (last ? 0.22 : 0.12) : last ? 0.36 : 0.22),
            stroke: last ? green : purple,
            strokeWidth: last ? 1.7 : 1.3,
            radius: 5,
        })
        fig.text(x + tw / 2, ty + 14, tr.k, {
            size: 11,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
        fig.text(x + tw / 2, ty + 34, tr.v, {
            size: 14,
            weight: 700,
            color: last ? green : c.textPrimary,
            align: 'center',
            mono: true,
        })
    })

    fig.rect(86, 330, 236, 36, {
        fill: tint(green, c.bg, isLight ? 0.18 : 0.3),
        stroke: green,
        strokeWidth: 1.6,
        radius: 18,
    })
    fig.text(204, 348, 'Exact warp sum = 20', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // Vertical divider
    fig.line(408, 20, 408, height - 20, { color: c.borderSubtle, width: 1 })

    // === Right Top: Early-Exit Hazard ===
    const rx = 432
    const rw = 304
    fig.text(rx, 22, 'Bug: early tail exit breaks partners', {
        size: 14,
        weight: 700,
        color: red,
    })
    fig.text(rx, 42, 'At offset 16, active Lane 4 reads Lane 20', {
        size: 12,
        color: c.textSecondary,
    })

    fig.rect(rx, 66, 114, 48, {
        fill: tint(blue, c.bg, isLight ? 0.16 : 0.28),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(rx + 57, 83, 'Lane 4', { size: 13, weight: 700, color: blue, align: 'center' })
    fig.text(rx + 57, 101, 'val = 1', { size: 11.5, color: c.textSecondary, align: 'center', mono: true })

    fig.rect(rx + 190, 66, 114, 48, {
        fill: tint(red, c.bg, isLight ? 0.18 : 0.3),
        stroke: red,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(rx + 247, 83, 'Lane 20', { size: 13, weight: 700, color: red, align: 'center' })
    fig.text(rx + 247, 101, 'exited!', { size: 11.5, color: red, align: 'center', mono: true })

    fig.arrow(rx + 186, 90, rx + 118, 90, { color: red, width: 2.2, head: 6 })
    fig.text(rx + 152, 76, 'shfl(16)', { size: 11, weight: 700, color: red, align: 'center', mono: true })

    fig.rect(rx, 130, rw, 36, {
        fill: tint(red, c.bg, isLight ? 0.12 : 0.22),
        stroke: red,
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text(rx + rw / 2, 148, 'Exited partner returns undefined value', {
        size: 12.5,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Horizontal divider on right
    fig.line(rx, 198, width - 24, 198, { color: c.borderSubtle, width: 1 })

    // === Right Bottom: Upper-Edge Source Guard ===
    fig.text(rx, 224, 'Hardware upper-edge source guard', {
        size: 14,
        weight: 700,
        color: warm,
    })
    fig.text(rx, 244, 'At offset 16, Lane 16 asks for lane 16 + 16 = 32', {
        size: 12,
        color: c.textSecondary,
    })

    fig.rect(rx, 270, 122, 48, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.12 : 0.2),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(rx + 61, 287, 'src = 32', { size: 13, weight: 700, color: c.textPrimary, align: 'center', mono: true })
    fig.text(rx + 61, 305, 'out of warp', { size: 11.5, color: c.textSecondary, align: 'center' })

    fig.arrow(rx + 126, 294, rx + 178, 294, { color: warm, width: 2, head: 6 })

    fig.rect(rx + 182, 270, 122, 48, {
        fill: tint(warm, c.bg, isLight ? 0.18 : 0.3),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(rx + 243, 287, 'src >= 32', { size: 13, weight: 700, color: warm, align: 'center', mono: true })
    fig.text(rx + 243, 305, 'self-copy ignored', { size: 11.5, color: warm, align: 'center' })

    fig.text(rx, 344, 'Lane 16 discards its own clamped copy;', {
        size: 12,
        color: c.textSecondary,
    })
    fig.text(rx, 364, 'Lane 0 total remains exact (20).', {
        size: 12,
        weight: 700,
        color: green,
    })

    return fig.render()
}

export default create('dark')
