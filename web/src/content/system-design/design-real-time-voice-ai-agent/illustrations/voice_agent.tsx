import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 385
export const alt =
    'Hot path running microphone, media edge, turn detection and STT, LLM and tools, then TTS and playout. Side lanes handle local VAD mute under 100 ms p95 and client-confirmed playout tracking for conversation history.'

const STAGES = [
    { title: 'Microphone', sub: 'AEC + 20 ms', tone: 'warm' as const },
    { title: 'Media Edge', sub: 'WebRTC / RTP', tone: 'cyan' as const },
    { title: 'Turn + STT', sub: 'Live words', tone: 'purple' as const },
    { title: 'LLM + Tools', sub: 'First clause', tone: 'blue' as const },
    { title: 'TTS + Playout', sub: 'Audio stream', tone: 'green' as const },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const critical = fig.tone('critical')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const muted = c.textSecondary

    // --- Top Lane: Streaming Audio Hot Path ---
    fig.text(24, 22, 'Streaming Audio Hot Path', { size: 15, weight: 700, color: blue })
    fig.text(816, 22, 'Zero extra hops on media packets', {
        size: 13,
        color: muted,
        align: 'right',
    })

    const boxW = 136
    const boxH = 74
    const gap = 28
    const hotY = 48

    STAGES.forEach((st, i) => {
        const sx = 24 + i * (boxW + gap)
        const tone = fig.tone(st.tone)
        fig.rect(sx, hotY, boxW, boxH, {
            fill: tint(tone, c.bg, 0.13),
            stroke: tone,
            strokeWidth: 1.75,
            radius: 8,
        })
        fig.text(sx + boxW / 2, hotY + 26, st.title, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            width: boxW - 10,
        })
        fig.text(sx + boxW / 2, hotY + 52, st.sub, {
            size: 12,
            color: muted,
            align: 'center',
            width: boxW - 10,
        })
        if (i < STAGES.length - 1) {
            fig.arrow(sx + boxW, hotY + boxH / 2, sx + boxW + gap - 3, hotY + boxH / 2, {
                color: c.textMuted,
                width: 2,
                head: 5,
            })
        }
    })

    // Parallel control tap arrows dropping from Microphone and TTS+Playout
    const laneY = 176
    const laneH = 190

    fig.arrow(92, hotY + boxH, 92, laneY - 4, {
        color: critical,
        width: 2,
        head: 6,
        dash: '5 4',
    })
    fig.text(104, 148, 'parallel local tap', { size: 12, weight: 600, color: critical })

    fig.arrow(748, hotY + boxH, 748, laneY - 4, {
        color: purple,
        width: 2,
        head: 6,
        dash: '5 4',
    })
    fig.text(736, 148, 'client playout ACK', {
        size: 12,
        weight: 600,
        color: purple,
        align: 'right',
    })

    // --- Bottom-Left Parallel Control Lane: Barge-in Cancellation ---
    const leftX = 24
    const laneW = 382
    fig.rect(leftX, laneY, laneW, laneH, {
        fill: tint(critical, c.bg, 0.05),
        stroke: tint(critical, c.bg, 0.45),
        strokeWidth: 1.25,
        radius: 10,
    })
    fig.rect(leftX, laneY, 4, laneH, { fill: critical, radius: 2 })
    fig.text(leftX + 16, laneY + 24, 'Barge-in Control Lane', {
        size: 15,
        weight: 700,
        color: critical,
    })
    fig.text(leftX + laneW - 14, laneY + 24, 'p95 < 100 ms', {
        size: 13,
        weight: 700,
        color: critical,
        align: 'right',
        mono: true,
    })

    // 2 blocks inside barge-in lane
    const bY = laneY + 56
    fig.rect(leftX + 18, bY, 152, 74, {
        fill: tint(warm, c.bg, 0.14),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(leftX + 94, bY + 26, 'Local VAD', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
        width: 140,
    })
    fig.text(leftX + 94, bY + 50, 'Speech onset', {
        size: 12,
        color: muted,
        align: 'center',
        width: 140,
    })

    fig.arrow(leftX + 170, bY + 37, leftX + 206, bY + 37, {
        color: critical,
        width: 2,
        head: 6,
    })

    fig.rect(leftX + 210, bY, 154, 74, {
        fill: tint(critical, c.bg, 0.14),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(leftX + 287, bY + 26, 'Mute + Cancel', {
        size: 14,
        weight: 700,
        color: critical,
        align: 'center',
        width: 144,
    })
    fig.text(leftX + 287, bY + 50, 'Stop queued TTS', {
        size: 12,
        color: muted,
        align: 'center',
        width: 144,
    })

    fig.text(leftX + 18, laneY + 158, 'Immediate local mute avoids network RTT', {
        size: 13,
        color: muted,
    })

    // --- Bottom-Right Parallel Control Lane: Confirmed Playout Ledger ---
    const rightX = 434
    fig.rect(rightX, laneY, laneW, laneH, {
        fill: tint(purple, c.bg, 0.05),
        stroke: tint(purple, c.bg, 0.45),
        strokeWidth: 1.25,
        radius: 10,
    })
    fig.rect(rightX, laneY, 4, laneH, { fill: purple, radius: 2 })
    fig.text(rightX + 16, laneY + 24, 'Confirmed Playout Ledger', {
        size: 15,
        weight: 700,
        color: purple,
    })
    fig.text(rightX + laneW - 14, laneY + 24, 'client cursor', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'right',
    })

    const ledgerNodes = [
        { x: rightX + 18, w: 104, title: 'Playout ACK', sub: 'cursor ms' },
        { x: rightX + 142, w: 106, title: 'Heard Span', sub: 'commit log' },
        { x: rightX + 268, w: 98, title: 'Next Turn', sub: 'safe LLM' },
    ] as const
    ledgerNodes.forEach((n, i) => {
        fig.rect(n.x, bY, n.w, 74, {
            fill: tint(i === 2 ? green : purple, c.bg, 0.14),
            stroke: i === 2 ? green : purple,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(n.x + n.w / 2, bY + 26, n.title, {
            size: 13,
            weight: 700,
            color: i === 2 ? green : purple,
            align: 'center',
            width: n.w - 6,
        })
        fig.text(n.x + n.w / 2, bY + 50, n.sub, {
            size: 12,
            color: muted,
            align: 'center',
            width: n.w - 6,
        })
        if (i < ledgerNodes.length - 1) {
            fig.arrow(n.x + n.w, bY + 37, n.x + n.w + 17, bY + 37, {
                color: purple,
                width: 1.75,
                head: 5,
            })
        }
    })

    fig.text(rightX + 18, laneY + 158, 'Only heard spans enter conversation history', {
        size: 13,
        color: muted,
    })

    return fig.render()
}

export default create()
