import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 435
export const alt =
    'Separate prefill and decode worker pools hand off compatible KV state, request metadata, and any needed recurrent state. A bandwidth-only estimate isolates raw K/V payload: 4K is 0.268 GB and takes at least 10.7 ms; 64K is 4.295 GB and takes at least 171.8 ms over an ideal 25 GB/s (200 Gbps) link. State serialization, network overhead, and scheduling are outside these payload-only floors.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    const raw4kGb = 268_435_456 / 1e9 // 0.268
    const raw64kGb = 4_294_967_296 / 1e9 // 4.295
    const floor4kMs = (1000 * raw4kGb) / 25 // 10.7
    const floor64kMs = (1000 * raw64kGb) / 25 // 171.8

    // === Band 1: Disaggregated Prefill -> Decode Handoff ===
    fig.text(24, 22, '1. Disaggregated worker pools hand off live request state', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const topY = 46
    const poolH = 98
    fig.rect(24, topY, 174, poolH, {
        fill: tint(purple, c.bg, isLight ? 0.14 : 0.24),
        stroke: purple,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(111, topY + 36, 'PREFILL', { size: 15, weight: 700, color: purple, align: 'center' })
    fig.text(111, topY + 62, 'worker pool', { size: 14.5, color: c.textSecondary, align: 'center' })

    fig.arrow(204, topY + poolH / 2, 246, topY + poolH / 2, { color: blue, width: 2.2, head: 6 })

    const items = [
        { name: 'KV state', tone: purple, y: topY },
        { name: 'Metadata', tone: cyan, y: topY + 35 },
        { name: 'Recurrent state', tone: warm, y: topY + 70 },
    ]
    for (const it of items) {
        fig.rect(252, it.y, 216, 28, {
            fill: tint(it.tone, c.bg, isLight ? 0.14 : 0.24),
            stroke: it.tone,
            strokeWidth: 1.4,
            radius: 5,
        })
        fig.text(360, it.y + 14, it.name, {
            size: 14.5,
            weight: 700,
            color: it.tone,
            align: 'center',
        })
    }

    fig.arrow(474, topY + poolH / 2, 516, topY + poolH / 2, { color: blue, width: 2.2, head: 6 })

    fig.rect(522, topY, 174, poolH, {
        fill: tint(blue, c.bg, isLight ? 0.14 : 0.24),
        stroke: blue,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(609, topY + 36, 'DECODE', { size: 15, weight: 700, color: blue, align: 'center' })
    fig.text(609, topY + 62, 'worker pool', { size: 14.5, color: c.textSecondary, align: 'center' })

    // === Band 2: Raw KV Payload (4K vs 64K) ===
    const sep1 = 164
    fig.line(24, sep1, width - 24, sep1, { color: c.borderSubtle, width: 1 })
    fig.text(24, sep1 + 22, '2. Raw K/V payload (16× growth from 4K to 64K)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 88
    const barW = 456

    const drawBar = (y: number, label: string, frac: number, valText: string, tone: string) => {
        fig.text(24, y + 13, label, { size: 14.5, weight: 700, color: c.textPrimary, mono: true })
        fig.rect(barX, y, barW, 26, {
            fill: tint(c.textMuted, c.bg, isLight ? 0.08 : 0.14),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 5,
        })
        fig.rect(barX, y, Math.max(12, barW * frac), 26, {
            fill: tint(tone, c.bg, isLight ? 0.24 : 0.38),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(barX + barW + 12, y + 13, valText, {
            size: 14.5,
            weight: 700,
            color: tone,
            mono: true,
        })
    }

    drawBar(sep1 + 42, '4K', raw4kGb / raw64kGb, `${raw4kGb.toFixed(3)} GB`, purple)
    drawBar(sep1 + 78, '64K', 1.0, `${raw64kGb.toFixed(3)} GB`, purple)

    // === Band 3: Payload-only transfer floor at 25 GB/s ===
    const sep2 = 290
    fig.line(24, sep2, width - 24, sep2, { color: c.borderSubtle, width: 1 })
    fig.text(24, sep2 + 22, '3. Payload-only wire floor at 25 GB/s (200 Gbps)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    drawBar(sep2 + 42, '4K', floor4kMs / 180, `>= ${floor4kMs.toFixed(1)} ms`, green)
    drawBar(sep2 + 78, '64K', floor64kMs / 180, `>= ${floor64kMs.toFixed(1)} ms`, green)

    fig.text(24, 412, 'Serialization, protocol overhead, and queueing add on top of wire time.', {
        size: 14.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
