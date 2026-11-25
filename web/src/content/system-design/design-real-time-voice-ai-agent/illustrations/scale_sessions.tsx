import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 385
export const alt =
    'Voice packets hash to one sticky media worker holding DTLS and media state, fanning out audio and text work to independently scaled STT, LLM, and TTS pools.'

const STATE_ITEMS = [
    'DTLS / SRTP termination',
    'Jitter buffer + PLC',
    'Playout ACK cursor',
    'Barge-in cancel bus',
] as const

const POOLS = [
    {
        y: 36,
        title: 'STT Pool',
        badge: 'scale on audio',
        sub: 'Audio frames -> live text',
        tone: 'cyan' as const,
    },
    {
        y: 144,
        title: 'LLM Pool',
        badge: 'scale on tokens',
        sub: 'Continuous batching / KV',
        tone: 'blue' as const,
    },
    {
        y: 252,
        title: 'TTS Pool',
        badge: 'scale on clauses',
        sub: 'Streaming speech chunks',
        tone: 'green' as const,
    },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    // --- Tier 1: Caller Sessions ---
    const cX = 24
    const cW = 154
    fig.text(cX + cW / 2, 22, 'Caller Packets', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
        width: cW,
    })
    fig.rect(cX, 92, cW, 194, {
        fill: tint(warm, c.bg, 0.08),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 10,
    })
    ;['Call #104', 'Call #219', 'Call #387'].forEach((call, i) => {
        const sy = 110 + i * 44
        fig.rect(cX + 14, sy, cW - 28, 32, {
            fill: tint(warm, c.bg, 0.18),
            stroke: tint(warm, c.bg, 0.55),
            strokeWidth: 1,
            radius: 6,
        })
        fig.text(cX + cW / 2, sy + 16, call, {
            size: 13,
            weight: 700,
            color: warm,
            align: 'center',
            mono: true,
            width: cW - 32,
        })
    })
    fig.text(cX + cW / 2, 260, '5-tuple hash', {
        size: 12,
        weight: 600,
        color: muted,
        align: 'center',
        mono: true,
        width: cW - 16,
    })

    // Arrow Tier 1 -> Tier 2
    fig.arrow(cX + cW, 189, 232, 189, { color: warm, width: 2.25, head: 6 })
    fig.text(206, 168, 'sticky', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
        width: 56,
    })

    // --- Tier 2: Sticky Media Worker ---
    const mX = 236
    const mW = 228
    fig.text(mX + mW / 2, 22, 'Sticky Stateful Tier', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        width: mW,
    })
    fig.rect(mX, 62, mW, 254, {
        fill: tint(purple, c.bg, 0.08),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 10,
    })
    fig.text(mX + mW / 2, 86, 'media-worker-04', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
        width: mW - 16,
    })
    fig.text(mX + mW / 2, 108, 'Owns session state in RAM', {
        size: 12,
        color: muted,
        align: 'center',
        width: mW - 16,
    })

    STATE_ITEMS.forEach((item, i) => {
        const sy = 128 + i * 44
        fig.rect(mX + 14, sy, mW - 28, 34, {
            fill: tint(purple, c.bg, 0.15),
            stroke: tint(purple, c.bg, 0.45),
            strokeWidth: 1,
            radius: 6,
        })
        fig.text(mX + mW / 2, sy + 17, item, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            width: mW - 36,
        })
    })

    // --- Tier 3: Independently Autoscaled Inference Pools ---
    const pX = 540
    const pW = 276
    fig.text(pX + pW / 2, 20, 'Stateless Inference Pools', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        width: pW,
    })

    const fanStarts = [132, 189, 246] as const
    const edgeLabels = [
        { text: 'audio', xOff: -4, yAbs: 64 },
        { text: 'turns', xOff: 0, yAbs: 173 },
        { text: 'clauses', xOff: -4, yAbs: 312 },
    ] as const

    POOLS.forEach((p, i) => {
        const tone = fig.tone(p.tone)
        const midY = p.y + 42

        // Smooth Bezier fan-out connector from Sticky Media Worker to Pool
        const x1 = mX + mW
        const x2 = pX - 8
        const y1 = fanStarts[i]!
        const mx = (x1 + x2) / 2
        fig.path(`M${x1} ${y1}C${mx} ${y1},${mx} ${midY},${x2} ${midY}`, {
            color: tone,
            width: 2,
        })
        fig.arrow(x2 - 8, midY, pX - 3, midY, { color: tone, width: 2, head: 6 })
        fig.text(mx + edgeLabels[i]!.xOff, edgeLabels[i]!.yAbs, edgeLabels[i]!.text, {
            size: 12,
            weight: 600,
            color: tone,
            align: 'center',
            width: 66,
        })

        // Pool block
        fig.rect(pX, p.y, pW, 84, {
            fill: tint(tone, c.bg, 0.11),
            stroke: tone,
            strokeWidth: 1.75,
            radius: 9,
        })
        fig.text(pX + 16, p.y + 26, p.title, { size: 15, weight: 700, color: tone })
        fig.rect(pX + pW - 134, p.y + 12, 120, 24, {
            fill: tint(tone, c.bg, 0.22),
            stroke: tint(tone, c.bg, 0.55),
            strokeWidth: 1,
            radius: 12,
        })
        fig.text(pX + pW - 74, p.y + 24, p.badge, {
            size: 11,
            weight: 700,
            color: tone,
            align: 'center',
            width: 114,
        })
        fig.text(pX + 16, p.y + 58, p.sub, { size: 13, color: c.textSecondary })
    })

    // Bottom frameless note
    fig.line(24, 350, 816, 350, { color: c.borderSubtle, width: 1 })
    fig.text(420, 370, 'Pin stateful DTLS + jitter-buffer sessions per media worker  ·  Autoscale GPU/CPU pools independently', {
        size: 12,
        weight: 600,
        color: muted,
        align: 'center',
        width: 780,
    })

    return fig.render()
}

export default create()
