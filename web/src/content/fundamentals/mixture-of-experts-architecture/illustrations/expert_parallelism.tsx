import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 415
export const alt =
    'Expert parallelism across two GPUs: GPU 0 holds experts E0 and E1, while GPU 1 holds E2 and E3. Two assignments stay local (t0 to E0 on GPU 0, t2 to E2 on GPU 1) with 0 KiB network traffic. Three remote assignments (t1 and t4 from GPU 0 to GPU 1, and t3 from GPU 1 to GPU 0) cross the interconnect, each transferring 8 KiB on dispatch and 8 KiB on combine for 48 KiB total.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    const fill = (col: string, strong = false) =>
        tint(col, c.bg, isLight ? (strong ? 0.2 : 0.08) : strong ? 0.34 : 0.16)

    // Left region: GPU 0 (E0, E1)
    const g0X = 24
    const gY = 18
    const gW = 280
    const gH = 266
    fig.rect(g0X, gY, gW, gH, {
        fill: fill(blue, false),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 12,
    })
    fig.text(g0X + 16, gY + 22, 'GPU 0 · owns E0, E1', {
        size: 14.5,
        weight: 700,
        color: blue,
    })

    // Right region: GPU 1 (E2, E3)
    const g1X = width - 24 - gW
    fig.rect(g1X, gY, gW, gH, {
        fill: fill(purple, false),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 12,
    })
    fig.text(g1X + 16, gY + 22, 'GPU 1 · owns E2, E3', {
        size: 14.5,
        weight: 700,
        color: purple,
    })

    // Interconnect center label
    const midX = width / 2
    fig.line(midX, gY + 42, midX, gY + gH - 12, {
        color: c.borderSubtle,
        width: 1.2,
        dash: '4 4',
    })
    fig.text(midX, gY + 22, 'All-to-All link', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Token source boxes (top inside each GPU)
    const boxW = 240
    const boxH = 54
    const srcY = gY + 46
    const expY = gY + 194

    // GPU 0 source tokens
    fig.rect(g0X + 20, srcY, boxW, boxH, {
        fill: fill(blue, true),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(g0X + 140, srcY + 19, 'Local batch tokens', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(g0X + 140, srcY + 39, 't0,  t1,  t4', {
        size: 14.5,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    // GPU 0 experts
    fig.rect(g0X + 20, expY, boxW, boxH, {
        fill: fill(blue, true),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(g0X + 140, expY + 19, 'Resident experts', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(g0X + 140, expY + 39, 'E0 (t0)  ·  E1 (t3)', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    // GPU 1 source tokens
    fig.rect(g1X + 20, srcY, boxW, boxH, {
        fill: fill(purple, true),
        stroke: purple,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(g1X + 140, srcY + 19, 'Local batch tokens', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(g1X + 140, srcY + 39, 't2,  t3', {
        size: 14.5,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })

    // GPU 1 experts
    fig.rect(g1X + 20, expY, boxW, boxH, {
        fill: fill(purple, true),
        stroke: purple,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(g1X + 140, expY + 19, 'Resident experts', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(g1X + 140, expY + 39, 'E2 (t2, t1)  ·  E3 (t4)', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })

    // Local green vertical arrows (0 KiB)
    const l0X = g0X + 78
    fig.arrow(l0X, srcY + boxH + 4, l0X, expY - 4, { color: green, width: 2.2, head: 7 })
    fig.text(l0X - 8, (srcY + boxH + expY) / 2 - 8, 't0 → E0', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.text(l0X - 8, (srcY + boxH + expY) / 2 + 10, '0 KiB', {
        size: 12,
        color: green,
        align: 'right',
        mono: true,
    })

    const l1X = g1X + gW - 78
    fig.arrow(l1X, srcY + boxH + 4, l1X, expY - 4, { color: green, width: 2.2, head: 7 })
    fig.text(l1X + 8, (srcY + boxH + expY) / 2 - 8, 't2 → E2', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'left',
        mono: true,
    })
    fig.text(l1X + 8, (srcY + boxH + expY) / 2 + 10, '0 KiB', {
        size: 12,
        color: green,
        align: 'left',
        mono: true,
    })

    // Cross-GPU remote dashed arrows (clear separated trajectories, zero border-title clash)
    // t1, t4: GPU 0 -> GPU 1 (upper lane)
    const upperLaneY = srcY + boxH + 26
    fig.path(
        `M${g0X + 206} ${srcY + boxH + 4} L${g0X + 206} ${upperLaneY} L${g1X + 74} ${upperLaneY} L${g1X + 74} ${expY - 6}`,
        { color: warm, width: 2.2, dash: '6 4' },
    )
    fig.arrow(g1X + 74, expY - 14, g1X + 74, expY - 3, { color: warm, width: 2.2, head: 7 })
    fig.rect(midX - 78, upperLaneY - 13, 156, 24, {
        fill: isLight ? '#faf9f5' : '#0d0e14',
        stroke: warm,
        strokeWidth: 1.2,
        radius: 12,
    })
    fig.text(midX, upperLaneY - 1, 't1, t4 → G1 (32 KiB)', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // t3: GPU 1 -> GPU 0 (lower lane)
    const lowerLaneY = expY - 26
    fig.path(
        `M${g1X + 106} ${srcY + boxH + 4} L${g1X + 106} ${lowerLaneY} L${g0X + 178} ${lowerLaneY} L${g0X + 178} ${expY - 6}`,
        { color: warm, width: 2.2, dash: '6 4' },
    )
    fig.arrow(g0X + 178, expY - 14, g0X + 178, expY - 3, { color: warm, width: 2.2, head: 7 })
    fig.rect(midX - 66, lowerLaneY - 13, 132, 24, {
        fill: isLight ? '#faf9f5' : '#0d0e14',
        stroke: warm,
        strokeWidth: 1.2,
        radius: 12,
    })
    fig.text(midX, lowerLaneY - 1, 't3 → G0 (16 KiB)', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Bottom traffic breakdown bar (replaces colliding DataTable)
    const sepY = 304
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })
    fig.text(24, sepY + 22, 'Round-trip interconnect payload (8 KiB dispatch + 8 KiB combine per remote token)', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
    })

    const barY = sepY + 42
    const barH = 34
    const segW = 192
    const segGap = 10
    const segs = [
        { label: 't1 → E2 (16 KiB)', x: 24 },
        { label: 't4 → E3 (16 KiB)', x: 24 + segW + segGap },
        { label: 't3 → E1 (16 KiB)', x: 24 + 2 * (segW + segGap) },
    ]
    for (const s of segs) {
        fig.rect(s.x, barY, segW, barH, {
            fill: fill(warm, true),
            stroke: warm,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(s.x + segW / 2, barY + barH / 2, s.label, {
            size: 13,
            weight: 700,
            color: warm,
            align: 'center',
            mono: true,
        })
    }
    fig.text(width - 24, barY + barH / 2, '= 48 KiB', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'right',
        mono: true,
    })
    fig.text(24, barY + barH + 18, 'Local tokens (t0, t2) stay on their home GPU: 0 KiB network transfer', {
        size: 12.5,
        color: green,
        weight: 600,
    })

    return fig.render()
}

export default create('dark')
