import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 395
export const alt =
    'Four 20 ms packets with one lost frame at 60 ms: WebRTC conceals the 60 ms gap and plays the 80 ms packet on schedule, while TCP WebSocket stalls later bytes behind retransmission.'

const SLOTS = ['20 ms', '40 ms', '60 ms (LOST)', '80 ms', '100 ms'] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const critical = fig.tone('critical')
    const warm = fig.tone('warm')
    const muted = c.textSecondary

    const startX = 200
    const slotW = 114
    const slotGap = 10

    // Top time cadence headers
    fig.text(24, 24, '20 ms Packet Cadence', { size: 14, weight: 700, color: c.textPrimary })
    SLOTS.forEach((s, i) => {
        const cx = startX + i * (slotW + slotGap) + slotW / 2
        const isLost = i === 2
        fig.text(cx, 24, s, {
            size: 13,
            weight: isLost ? 700 : 600,
            color: isLost ? critical : muted,
            align: 'center',
            mono: true,
            width: slotW,
        })
        fig.line(cx, 38, cx, 356, {
            color: isLost ? tint(critical, c.bg, 0.35) : c.borderSubtle,
            width: 1,
            dash: '3 4',
        })
    })

    // --- Lane 1: WebRTC (UDP / RTP + PLC) ---
    const y1 = 68
    fig.text(24, y1 + 16, 'WebRTC (UDP / RTP)', { size: 15, weight: 700, color: blue })
    fig.text(24, y1 + 40, 'Prioritizes deadline', { size: 13, color: muted })
    fig.text(24, y1 + 66, '80 ms plays on time', { size: 13, weight: 700, color: green })

    const udpFrames = [
        { top: 'Frame 1', bot: 'Play', kind: 'ok' as const },
        { top: 'Frame 2', bot: 'Play', kind: 'ok' as const },
        { top: 'Lost -> PLC', bot: 'Conceal 20 ms', kind: 'plc' as const },
        { top: 'Frame 4', bot: 'Play on time', kind: 'ok' as const },
        { top: 'Frame 5', bot: 'Play on time', kind: 'ok' as const },
    ]
    udpFrames.forEach((f, i) => {
        const fx = startX + i * (slotW + slotGap)
        const isPlc = f.kind === 'plc'
        fig.rect(fx, y1, slotW, 66, {
            fill: isPlc ? tint(critical, c.bg, 0.12) : tint(green, c.bg, 0.18),
            stroke: isPlc ? critical : green,
            strokeWidth: isPlc ? 1.75 : 1.5,
            radius: 7,
        })
        fig.text(fx + slotW / 2, y1 + 22, f.top, {
            size: 13,
            weight: 700,
            color: isPlc ? critical : green,
            align: 'center',
            width: slotW - 8,
        })
        fig.text(fx + slotW / 2, y1 + 46, f.bot, {
            size: 12,
            weight: 600,
            color: isPlc ? green : c.textSecondary,
            align: 'center',
            width: slotW - 8,
        })
    })

    // Subtle bridge note under WebRTC
    fig.brace(
        startX + 2 * (slotW + slotGap),
        y1 + 72,
        startX + 3 * (slotW + slotGap) + slotW,
        y1 + 72,
        'PLC bridges 60 ms gap; never blocks 80 ms frame',
        {
            side: 1,
            depth: 8,
            color: green,
            labelColor: green,
            labelSize: 12,
            weight: 600,
            labelGap: 14,
        },
    )

    // Divider
    fig.line(24, 198, 816, 198, { color: c.borderSubtle, width: 1 })

    // --- Lane 2: WebSocket (TCP In-Order Stream) ---
    const y2 = 226
    fig.text(24, y2 + 16, 'WebSocket (TCP)', { size: 15, weight: 700, color: warm })
    fig.text(24, y2 + 40, 'In-order byte stream', { size: 13, color: muted })
    fig.text(24, y2 + 66, 'HoL stalls later audio', { size: 13, weight: 700, color: critical })

    // Seg A, Seg B delivered
    ;[
        { top: 'Seg A', bot: 'Delivered' },
        { top: 'Seg B', bot: 'Delivered' },
    ].forEach((s, i) => {
        const fx = startX + i * (slotW + slotGap)
        fig.rect(fx, y2, slotW, 66, {
            fill: tint(green, c.bg, 0.16),
            stroke: green,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(fx + slotW / 2, y2 + 22, s.top, {
            size: 13,
            weight: 700,
            color: green,
            align: 'center',
            width: slotW - 8,
        })
        fig.text(fx + slotW / 2, y2 + 46, s.bot, {
            size: 12,
            color: muted,
            align: 'center',
            width: slotW - 8,
        })
    })

    // Seg C lost
    const cX = startX + 2 * (slotW + slotGap)
    fig.rect(cX, y2, slotW, 66, {
        fill: tint(critical, c.bg, 0.2),
        stroke: critical,
        strokeWidth: 2,
        radius: 7,
    })
    fig.text(cX + slotW / 2, y2 + 22, 'Seg C Lost', {
        size: 13,
        weight: 700,
        color: critical,
        align: 'center',
        width: slotW - 8,
    })
    fig.text(cX + slotW / 2, y2 + 46, 'Retransmit...', {
        size: 12,
        weight: 600,
        color: critical,
        align: 'center',
        width: slotW - 8,
    })

    // Seg D & E blocked in kernel buffer across slots 80ms + 100ms
    const dX = startX + 3 * (slotW + slotGap)
    const stallW = slotW * 2 + slotGap
    fig.rect(dX, y2, stallW, 66, {
        fill: tint(warm, c.bg, 0.14),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(dX + stallW / 2, y2 + 22, 'Seg D, E Blocked (Head-of-Line)', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        width: stallW - 12,
    })
    fig.text(dX + stallW / 2, y2 + 46, 'Held until Seg C recovers (audio stall)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: stallW - 8,
    })

    // HoL brace below TCP
    fig.brace(
        cX,
        y2 + 72,
        dX + stallW,
        y2 + 72,
        'Speaker stalls for full RTT + retransmission, then bursts',
        {
            side: 1,
            depth: 8,
            color: critical,
            labelColor: critical,
            labelSize: 12,
            weight: 600,
            labelGap: 14,
        },
    )

    return fig.render()
}

export default create()
