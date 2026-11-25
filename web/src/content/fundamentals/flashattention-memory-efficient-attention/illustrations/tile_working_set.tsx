import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 510
export const alt =
    'Three-tier GPU memory hierarchy showing host CPU DRAM, H100 SXM HBM (80 GB, 3.35 TB/s), and SM-local shared memory (228 KiB/SM, 227 KiB max per block, shared with L1) beside a separate 256 KiB/SM register file. Below, a proportional 144 KiB working-set bar partitions Q (16 KiB), K (16 KiB), V (16 KiB), output O (32 KiB), and FP32 score tile S (64 KiB).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'
    const fillAmt = isLight ? 0.09 : 0.17

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    const left = 24
    const fullW = width - 48

    // Tier 1: Host CPU DRAM
    const t1Y = 16
    const t1H = 58
    fig.rect(left, t1Y, fullW, t1H, {
        fill: tint(purple, c.bg, fillAmt),
        stroke: purple,
        strokeWidth: 1.25,
        radius: 10,
    })
    fig.text(left + 16, t1Y + 21, 'HOST · CPU DRAM', {
        size: 14,
        weight: 700,
        color: purple,
        mono: true,
    })
    fig.text(left + 16, t1Y + 42, 'Host inputs and offloaded model state', {
        size: 13.5,
        color: c.textSecondary,
    })

    // Arrows Host <-> HBM
    const a1Top = t1Y + t1H + 4
    const a1Bot = a1Top + 34
    fig.arrow(210, a1Top, 210, a1Bot, { color: purple, width: 1.8, head: 6 })
    fig.arrow(236, a1Bot, 236, a1Top, { color: purple, width: 1.8, head: 6 })
    fig.text(254, (a1Top + a1Bot) / 2, 'Separate host-to-GPU system link', {
        size: 13.5,
        color: purple,
        weight: 500,
    })

    // Tier 2: HBM
    const t2Y = a1Bot + 4
    const t2H = 68
    fig.rect(left, t2Y, fullW, t2H, {
        fill: tint(blue, c.bg, fillAmt),
        stroke: blue,
        strokeWidth: 1.25,
        radius: 10,
    })
    fig.text(left + 16, t2Y + 23, 'HBM · H100 SXM', {
        size: 14,
        weight: 700,
        color: blue,
        mono: true,
    })
    fig.text(left + fullW - 16, t2Y + 23, '80 GB · 3.35 TB/s', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        mono: true,
        align: 'right',
    })
    fig.text(left + 16, t2Y + 47, 'Holds Q, K, V, O, weights, and activations', {
        size: 13.5,
        color: c.textSecondary,
    })

    // Arrows HBM <-> SM
    const a2Top = t2Y + t2H + 4
    const a2Bot = a2Top + 34
    fig.arrow(210, a2Top, 210, a2Bot, { color: blue, width: 1.8, head: 6 })
    fig.arrow(236, a2Bot, 236, a2Top, { color: green, width: 1.8, head: 6 })
    fig.text(254, (a2Top + a2Bot) / 2, 'Q, K, V tiles in · O and row stats out', {
        size: 13.5,
        color: c.textPrimary,
        weight: 500,
    })

    // Tier 3: Shared Memory + Registers
    const t3Y = a2Bot + 4
    const t3H = 92
    const gap = 16
    const halfW = (fullW - gap) / 2

    fig.rect(left, t3Y, halfW, t3H, {
        fill: tint(cyan, c.bg, fillAmt),
        stroke: cyan,
        strokeWidth: 1.25,
        radius: 10,
    })
    fig.text(left + 16, t3Y + 23, 'SHARED MEMORY (SRAM)', {
        size: 14,
        weight: 700,
        color: cyan,
        mono: true,
    })
    fig.text(left + 16, t3Y + 48, '228 KiB / SM (227 max)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(left + 16, t3Y + 72, 'Shares capacity with L1 cache', {
        size: 13.5,
        color: c.textSecondary,
    })

    const regX = left + halfW + gap
    fig.rect(regX, t3Y, halfW, t3H, {
        fill: tint(warm, c.bg, fillAmt),
        stroke: warm,
        strokeWidth: 1.25,
        radius: 10,
    })
    fig.text(regX + 16, t3Y + 23, 'REGISTERS', {
        size: 14,
        weight: 700,
        color: warm,
        mono: true,
    })
    fig.text(regX + 16, t3Y + 48, '256 KiB / SM', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(regX + 16, t3Y + 72, 'Separate per-SM pool', {
        size: 13.5,
        color: c.textSecondary,
    })

    // Hairline divider before proportional working-set breakdown
    const sepY = t3Y + t3H + 22
    fig.line(left, sepY, left + fullW, sepY, { color: c.borderSubtle, width: 1 })

    const wsHeaderY = sepY + 24
    fig.text(left, wsHeaderY, 'On-chip tile working set', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(left + fullW, wsHeaderY, '48 + 32 + 64 = 144 KiB total', {
        size: 14,
        weight: 600,
        color: c.textSecondary,
        mono: true,
        align: 'right',
    })

    // Proportional working-set bar with crisp gaps so labels never touch
    const barY = wsHeaderY + 22
    const barH = 48
    const segGap = 6
    const segSpecs = [
        { label: 'Q', sub: '16 KiB', kb: 16, color: blue },
        { label: 'K', sub: '16 KiB', kb: 16, color: blue },
        { label: 'V', sub: '16 KiB', kb: 16, color: blue },
        { label: 'O', sub: '32 KiB', kb: 32, color: green },
        { label: 'S (FP32)', sub: '64 KiB', kb: 64, color: warm },
    ] as const

    const usableW = fullW - segGap * (segSpecs.length - 1)
    let curX = left
    const qkvStart = curX
    let qkvEnd = curX

    for (let i = 0; i < segSpecs.length; i++) {
        const s = segSpecs[i]!
        const w = (s.kb / 144) * usableW
        fig.rect(curX, barY, w, barH, {
            fill: tint(s.color, c.bg, isLight ? 0.14 : 0.24),
            stroke: s.color,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(curX + w / 2, barY + 17, s.label, {
            size: 14,
            weight: 700,
            color: s.color,
            align: 'center',
            mono: true,
        })
        fig.text(curX + w / 2, barY + 35, s.sub, {
            size: 12.5,
            weight: 600,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
        if (i === 2) qkvEnd = curX + w
        curX += w + segGap
    }

    // Curly dimension braces below the bar
    fig.brace(qkvStart, barY + barH + 8, qkvEnd, barY + barH + 8, 'QKV tiles: 48 KiB', {
        side: 1,
        depth: 10,
        color: blue,
        labelColor: blue,
        labelSize: 13.5,
        labelGap: 14,
    })
    fig.brace(
        qkvEnd + segGap,
        barY + barH + 8,
        left + fullW,
        barY + barH + 8,
        'Accumulators + score tile: 96 KiB',
        {
            side: 1,
            depth: 10,
            color: c.textMuted,
            labelColor: c.textSecondary,
            labelSize: 13.5,
            labelGap: 14,
        },
    )

    return fig.render()
}

export default create('dark')
