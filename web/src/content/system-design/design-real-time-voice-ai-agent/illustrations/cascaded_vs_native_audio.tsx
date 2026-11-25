import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 395
export const alt =
    'Cascaded pipeline places transcript inspection and tool checks inline between STT, LLM, and TTS; native audio emits speech directly with transcript, tool authorization, and tracing handled on side channels. Both require turn detection, interruption, and a confirmed playout cursor.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')
    const muted = c.textSecondary

    const box = (x: number, y: number, w: number, h: number, title: string, sub: string, tone: string) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, 0.13),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 8,
        })
        fig.text(x + w / 2, y + h * 0.36, title, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 8,
        })
        fig.text(x + w / 2, y + h * 0.72, sub, {
            size: 12,
            color: muted,
            align: 'center',
            width: w - 8,
        })
    }

    // --- Row 1: Cascaded Pipeline ---
    fig.text(24, 22, 'Cascaded Pipeline · Inline Text Checkpoints', {
        size: 15,
        weight: 700,
        color: blue,
    })
    fig.text(816, 22, 'Modular swap  ·  ~380-550 ms', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'right',
    })

    const r1Y = 46
    const r1H = 68
    box(24, r1Y, 96, r1H, 'Audio In', '20 ms', warm)
    fig.arrow(120, r1Y + 34, 146, r1Y + 34, { color: c.textMuted, width: 2, head: 5 })
    box(150, r1Y, 96, r1H, 'STT', 'speech->text', purple)
    fig.arrow(246, r1Y + 34, 272, r1Y + 34, { color: blue, width: 2, head: 5 })

    // Explicit inline checkpoint pill
    fig.rect(276, r1Y - 4, 152, r1H + 8, {
        fill: tint(blue, c.bg, 0.18),
        stroke: blue,
        strokeWidth: 2,
        radius: 8,
    })
    fig.text(352, r1Y + 20, 'Inline Gate', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        width: 140,
    })
    fig.text(352, r1Y + 46, 'Transcript + Tool Auth', {
        size: 12,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
        width: 144,
    })

    fig.arrow(428, r1Y + 34, 454, r1Y + 34, { color: blue, width: 2, head: 5 })
    box(458, r1Y, 102, r1H, 'LLM', 'text clause', blue)
    fig.arrow(560, r1Y + 34, 586, r1Y + 34, { color: c.textMuted, width: 2, head: 5 })
    box(590, r1Y, 100, r1H, 'TTS', 'text->audio', green)
    fig.arrow(690, r1Y + 34, 716, r1Y + 34, { color: c.textMuted, width: 2, head: 5 })
    box(720, r1Y, 96, r1H, 'Audio Out', 'playout', cyan)

    // Divider
    fig.line(24, 144, 816, 144, { color: c.borderSubtle, width: 1 })

    // --- Row 2: Native Speech-to-Speech Model ---
    fig.text(24, 170, 'Native Audio Model · Parallel Side Channels', {
        size: 15,
        weight: 700,
        color: green,
    })
    fig.text(816, 170, 'Prosody preserved  ·  ~200-350 ms', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'right',
    })

    const r2Y = 194
    const r2H = 66
    box(24, r2Y, 118, r2H, 'Audio In', 'direct frames', warm)
    fig.arrow(142, r2Y + 33, 224, r2Y + 33, { color: green, width: 2.25, head: 6 })
    box(228, r2Y, 384, r2H, 'Native Speech-to-Speech Model', 'Direct audio generation (fewer handoffs)', green)
    fig.arrow(612, r2Y + 33, 694, r2Y + 33, { color: green, width: 2.25, head: 6 })
    box(698, r2Y, 118, r2H, 'Audio Out', 'direct playout', cyan)

    // Parallel side-channel branch underneath
    fig.arrow(420, r2Y + r2H, 420, 290, { color: purple, width: 2, head: 6, dash: '5 4' })
    fig.rect(180, 294, 480, 42, {
        fill: tint(purple, c.bg, 0.12),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(420, 315, 'Side Channels: Async Transcript  ·  Tool Authorization  ·  Tracing', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
        width: 460,
    })

    // --- Bottom Shared Requirements Strip ---
    fig.line(24, 354, 816, 354, { color: c.borderSubtle, width: 1 })
    fig.text(24, 376, 'Required in both:', { size: 13, weight: 700, color: warm })
    fig.text(168, 376, 'Turn detection + Local VAD mute (<100 ms)  ·  Barge-in cancel  ·  Confirmed playout cursor', {
        size: 13,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create()
