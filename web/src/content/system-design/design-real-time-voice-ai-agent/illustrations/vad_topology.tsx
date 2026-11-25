import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 380
export const alt =
    'Audio splits into local VAD for instant playback muting and server endpointing for committed turn transcripts, recording both signals separately by device class.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const critical = fig.tone('critical')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')
    const muted = c.textSecondary

    // --- Left: Audio Capture Source ---
    fig.rect(24, 110, 140, 146, {
        fill: tint(warm, c.bg, 0.12),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 10,
    })
    fig.text(94, 144, 'Microphone', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'center',
        width: 128,
    })
    fig.text(94, 174, 'AEC + framing', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        width: 128,
    })
    fig.text(94, 200, '20 ms Opus', {
        size: 13,
        color: muted,
        align: 'center',
        mono: true,
        width: 128,
    })
    fig.text(94, 228, 'Splits to 2 paths', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
        width: 128,
    })

    // Forked connectors to Client Track (top) and Server Track (bottom)
    fig.path('M164 156L194 156L194 102L224 102', { color: critical, width: 2 })
    fig.arrow(212, 102, 232, 102, { color: critical, width: 2, head: 6 })

    fig.path('M164 210L194 210L194 256L224 256', { color: green, width: 2 })
    fig.arrow(212, 256, 232, 256, { color: green, width: 2, head: 6 })

    const drawNode = (x: number, y: number, w: number, title: string, sub: string, tone: string) => {
        fig.rect(x, y, w, 72, {
            fill: tint(tone, c.bg, 0.13),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 8,
        })
        fig.text(x + w / 2, y + 25, title, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 10,
        })
        fig.text(x + w / 2, y + 49, sub, {
            size: 12,
            color: muted,
            align: 'center',
            width: w - 10,
        })
    }

    // --- Upper Track: Client Local VAD ---
    const trackX = 224
    const trackW = 592
    fig.rect(trackX, 24, trackW, 134, {
        fill: tint(critical, c.bg, 0.04),
        stroke: tint(critical, c.bg, 0.4),
        strokeWidth: 1.25,
        radius: 10,
    })
    fig.text(trackX + 16, 44, 'Client Track · Instant Playback Mute', {
        size: 14,
        weight: 700,
        color: critical,
    })
    fig.text(trackX + trackW - 14, 44, 'Target < 100 ms', {
        size: 13,
        weight: 700,
        color: critical,
        align: 'right',
        mono: true,
    })

    const n1 = 240
    const n2 = 434
    const n3 = 628
    const nW = 168

    drawNode(n1, 66, nW, 'Local VAD', 'on-device detector', blue)
    fig.arrow(n1 + nW, 102, n2 - 3, 102, { color: critical, width: 2, head: 5 })
    drawNode(n2, 66, nW, 'Instant Mute', 'halt speaker now', critical)
    fig.arrow(n2 + nW, 102, n3 - 3, 102, { color: critical, width: 2, head: 5 })
    drawNode(n3, 66, nW, 'Server Cancel', 'abort queued TTS', critical)

    // --- Lower Track: Server Endpointing ---
    fig.rect(trackX, 178, trackW, 134, {
        fill: tint(green, c.bg, 0.04),
        stroke: tint(green, c.bg, 0.4),
        strokeWidth: 1.25,
        radius: 10,
    })
    fig.text(trackX + 16, 198, 'Server Track · Committed Turn Boundary', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.text(trackX + trackW - 14, 198, 'Target 400-800 ms', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    drawNode(n1, 220, nW, 'Streaming STT', 'continuous decode', purple)
    fig.arrow(n1 + nW, 256, n2 - 3, 256, { color: green, width: 2, head: 5 })
    drawNode(n2, 220, nW, 'Endpointing', 'semantic turn end', green)
    fig.arrow(n2 + nW, 256, n3 - 3, 256, { color: green, width: 2, head: 5 })
    drawNode(n3, 220, nW, 'Commit Turn', 'dispatch LLM reply', cyan)

    // --- Bottom Telemetry Separation Line ---
    fig.line(24, 334, 816, 334, { color: c.borderSubtle, width: 1 })
    fig.text(24, 358, 'Telemetry per device class:', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(238, 358, 'local_vad_onset (mute errors)', {
        size: 13,
        weight: 600,
        color: critical,
        mono: true,
    })
    fig.text(534, 358, 'server_turn_end (premature cutoffs)', {
        size: 13,
        weight: 600,
        color: green,
        mono: true,
    })

    return fig.render()
}

export default create()
