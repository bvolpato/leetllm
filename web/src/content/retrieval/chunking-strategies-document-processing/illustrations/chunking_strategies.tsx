import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 474
export const alt =
    'A 12-word specification rule from inference-api-spec-v2.md section 4.2 reads: Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames. On the left, fixed 8-word windows with 2-word overlap cut directly between 90 and seconds, leaving Chunk 1 without the unit or heartbeat exception and Chunk 2 without the SSE trigger. On the right, heading-aware section chunking keeps the trigger, numeric threshold, exception, and section 4.2 locator together in one chunk.'

const TOKENS = [
    { text: 'Streaming', w: 72 },
    { text: 'timeout:', w: 62 },
    { text: 'close', w: 44 },
    { text: 'idle', w: 34 },
    { text: 'SSE', w: 36 },
    { text: 'connections', w: 86 },
    { text: 'after', w: 42 },
    { text: '90', w: 30 },
    { text: 'seconds', w: 64 },
    { text: 'without', w: 58 },
    { text: 'heartbeat', w: 72 },
    { text: 'frames.', w: 58 },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const cyan = fig.tone('cyan')

    // ── Top: Source Token Stream (inference-api-spec-v2.md · sec 4.2) ────────
    fig.text(20, 20, 'Source Specification · inference-api-spec-v2.md', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(width - 20, 20, 'section 4.2 · 12 words', {
        size: 13,
        mono: true,
        weight: 600,
        color: cyan,
        align: 'right',
    })

    const stripY = 48
    const tokenH = 34
    const gap = 4
    let tx = 20
    let cutX = 0

    TOKENS.forEach((tok, idx) => {
        const isNum = tok.text === '90'
        const isUnit = tok.text === 'seconds'
        const fill = isNum
            ? withColorAlpha(warm, 0.22)
            : isUnit
              ? withColorAlpha(red, 0.16)
              : withColorAlpha(c.bgSubtle, theme === 'light' ? 0.75 : 0.55)
        const stroke = isNum ? warm : isUnit ? red : c.borderSubtle

        fig.rect(tx, stripY, tok.w, tokenH, {
            fill,
            stroke,
            strokeWidth: isNum || isUnit ? 1.6 : 1,
            radius: 5,
        })
        fig.text(tx + tok.w / 2, stripY + tokenH / 2, tok.text, {
            size: 13,
            weight: isNum || isUnit ? 700 : 500,
            mono: isNum,
            color: isNum ? warm : isUnit ? red : c.textPrimary,
            align: 'center',
        })
        if (idx === 7) {
            cutX = tx + tok.w + gap / 2
        }
        tx += tok.w + gap
    })

    // Crisp boundary cut marker right between "90" and "seconds" (zero overlap with digits!)
    fig.line(cutX, stripY - 10, cutX, stripY + tokenH + 14, {
        color: red,
        width: 2.2,
        dash: '4 3',
    })
    fig.text(cutX, stripY + tokenH + 26, 'fixed-window cut (word 8 | 9)', {
        size: 14,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Divider below source stream
    fig.line(20, 128, width - 20, 128, { color: c.borderSubtle, width: 1 })

    // ── Left: Fixed-Size Windows (size 8, overlap 2) ─────────────────────────
    const lx = 20
    const colW = 336

    fig.text(lx, 152, 'Fixed Window (size = 8, overlap = 2)', {
        size: 15,
        weight: 700,
        color: red,
    })

    // Window 1
    const w1Y = 176
    fig.rect(lx, w1Y, colW, 74, {
        fill: withColorAlpha(blue, 0.1),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(lx + 12, w1Y + 18, 'Chunk 1 · words 1–8', {
        size: 13,
        mono: true,
        weight: 700,
        color: blue,
    })
    fig.text(lx + colW - 12, w1Y + 18, 'top hit', {
        size: 13.5,
        weight: 700,
        color: blue,
        align: 'right',
    })
    fig.text(lx + 12, w1Y + 42, 'Streaming timeout: close idle SSE', {
        size: 13,
        color: c.textPrimary,
    })
    fig.text(lx + 12, w1Y + 60, 'connections after 90', {
        size: 13,
        weight: 700,
        color: warm,
    })

    // Window 2 (overlapping "after 90")
    const w2Y = 264
    fig.rect(lx, w2Y, colW, 74, {
        fill: withColorAlpha(warm, 0.08),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(lx + 12, w2Y + 18, 'Chunk 2 · words 7–14', {
        size: 13,
        mono: true,
        weight: 700,
        color: warm,
    })
    fig.text(lx + colW - 12, w2Y + 18, '2-word overlap', {
        size: 13.5,
        color: warm,
        align: 'right',
    })
    fig.text(lx + 12, w2Y + 42, 'after 90 seconds without heartbeat', {
        size: 13,
        color: c.textPrimary,
    })
    fig.text(lx + 12, w2Y + 60, 'frames. Batch retention: ...', {
        size: 13,
        color: c.textSecondary,
    })

    // Failure summary strip
    const failY = 358
    fig.rect(lx, failY, colW, 88, {
        fill: withColorAlpha(red, 0.08),
        stroke: withColorAlpha(red, 0.5),
        strokeWidth: 1.3,
        radius: 8,
    })
    fig.text(lx + 12, failY + 20, 'Severed Clause', {
        size: 14,
        weight: 700,
        color: red,
    })
    fig.text(lx + 12, failY + 44, 'Chunk 1: trigger + "90", no unit or exception', {
        size: 13,
        color: c.textSecondary,
    })
    fig.text(lx + 12, failY + 66, 'Chunk 2: "90 s" + heartbeat, no SSE trigger', {
        size: 13,
        color: c.textSecondary,
    })

    // Center hairline divider
    fig.line(370, 144, 370, 452, { color: c.borderSubtle, width: 1 })

    // ── Right: Heading-Aware Section Chunk ───────────────────────────────────
    const rx = 386
    fig.text(rx, 152, 'Heading-Aware Section', {
        size: 15,
        weight: 700,
        color: green,
    })

    const secY = 176
    fig.rect(rx, secY, colW, 162, {
        fill: withColorAlpha(green, 0.1),
        stroke: green,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(rx + 14, secY + 20, '§ 4.2 · Streaming Timeout', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.text(rx + colW - 14, secY + 20, 'sec=4.2', {
        size: 13,
        mono: true,
        weight: 700,
        color: cyan,
        align: 'right',
    })
    fig.line(rx + 12, secY + 36, rx + colW - 12, secY + 36, {
        color: withColorAlpha(green, 0.35),
        width: 1,
    })

    fig.text(rx + 14, secY + 62, 'Streaming timeout: close idle SSE', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rx + 14, secY + 88, 'connections after 90 seconds', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rx + 14, secY + 114, 'without heartbeat frames.', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rx + 14, secY + 142, 'source: inference-api-spec-v2.md', {
        size: 13.5,
        mono: true,
        color: cyan,
    })

    // Intact checklist strip
    const okY = 358
    fig.rect(rx, okY, colW, 88, {
        fill: withColorAlpha(green, 0.08),
        stroke: withColorAlpha(green, 0.5),
        strokeWidth: 1.3,
        radius: 8,
    })
    fig.text(rx + 12, okY + 20, 'Complete Answerable Unit', {
        size: 14,
        weight: 700,
        color: green,
    })

    const badges = [
        { label: 'Trigger: idle SSE', y: okY + 44 },
        { label: 'Threshold: 90 seconds', y: okY + 66 },
    ] as const
    for (const b of badges) {
        fig.circle(rx + 18, b.y, 4, { fill: green })
        fig.text(rx + 28, b.y, b.label, { size: 13, color: c.textPrimary })
    }
    fig.circle(rx + 194, okY + 44, 4, { fill: green })
    fig.text(rx + 204, okY + 44, 'Exception: heartbeat', { size: 13, color: c.textPrimary })
    fig.circle(rx + 194, okY + 66, 4, { fill: cyan })
    fig.text(rx + 204, okY + 66, 'Locator: sec 4.2', { size: 13, color: cyan })

    return fig.render()
}

export default create('dark')
