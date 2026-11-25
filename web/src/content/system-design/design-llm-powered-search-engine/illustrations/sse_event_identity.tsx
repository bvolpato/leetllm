import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 880
export const height = 400
export const alt =
    'Side-by-side Server-Sent Events wire trace comparing omitted vs explicit event IDs. Left: Frame 1 sends id: 12 (progress) and sets browser lastEventId = "12" (emitted). Frame 2 omits id for checked_claim, so the browser inherits lastEventId = "12" and client deduplication drops the verified claim. Right: Frame 2 sends explicit id: 13, updating lastEventId = "13" so both frames deliver cleanly and reconnects resume with Last-Event-ID: 13.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')

    const fill = (color: string, amt = 0.12) => tint(color, c.bg, amt)

    // Center hairline divider
    fig.line(440, 18, 440, 382, { color: c.borderSubtle, width: 1 })

    const drawSide = (offsetX: number, explicit: boolean) => {
        const accent = explicit ? green : red
        const title = explicit
            ? 'Explicit Monotonic IDs (Reliable)'
            : 'Omitted ID Field (Silent Drop)'
        fig.text(offsetX + 202, 24, title, {
            size: 14,
            color: accent,
            align: 'center',
            weight: 700,
        })

        // Column sub-labels
        fig.text(offsetX + 114, 52, 'SSE Wire Frame', {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            weight: 600,
        })
        fig.text(offsetX + 322, 52, 'Browser Callback', {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            weight: 600,
        })

        // Frame 1 (identical on both sides; generous 212px width for mono payload)
        fig.rect(offsetX + 8, 70, 212, 72, {
            fill: fill(blue, 0.1),
            stroke: blue,
            strokeWidth: 1.25,
            radius: 7,
        })
        fig.text(offsetX + 20, 92, 'id: 12', {
            size: 13,
            color: blue,
            weight: 700,
            mono: true,
        })
        fig.text(offsetX + 20, 118, 'data: {"type":"progress"}', {
            size: 11.5,
            color: c.textPrimary,
            mono: true,
        })

        fig.arrow(offsetX + 220, 106, offsetX + 244, 106, {
            color: c.textMuted,
            width: 1.5,
            head: 6,
        })

        fig.rect(offsetX + 248, 70, 152, 72, {
            fill: fill(green, 0.1),
            stroke: green,
            strokeWidth: 1.25,
            radius: 7,
        })
        fig.text(offsetX + 324, 93, 'lastEventId = "12"', {
            size: 11.5,
            color: c.textPrimary,
            align: 'center',
            weight: 600,
            mono: true,
        })
        fig.text(offsetX + 324, 120, 'EMIT (new ID)', {
            size: 12.5,
            color: green,
            align: 'center',
            weight: 700,
        })

        // Inheritance arrow on left side only
        if (!explicit) {
            fig.arrow(offsetX + 324, 142, offsetX + 324, 198, {
                color: red,
                width: 1.6,
                dash: '4 3',
                head: 6,
            })
            fig.text(offsetX + 314, 170, 'inherits "12"', {
                size: 12,
                color: red,
                align: 'right',
                weight: 700,
            })
        } else {
            fig.arrow(offsetX + 114, 142, offsetX + 114, 198, {
                color: green,
                width: 1.5,
                head: 6,
            })
            fig.text(offsetX + 126, 170, '+1 monotonic', {
                size: 12,
                color: green,
                weight: 600,
            })
        }

        // Frame 2
        const f2Stroke = explicit ? green : warm
        fig.rect(offsetX + 8, 202, 212, 74, {
            fill: fill(f2Stroke, 0.12),
            stroke: f2Stroke,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(offsetX + 20, 224, explicit ? 'id: 13' : '(no id: line)', {
            size: 13,
            color: f2Stroke,
            weight: 700,
            mono: true,
        })
        fig.text(offsetX + 20, 250, 'data: {"type":"checked_claim"}', {
            size: 10.5,
            color: c.textPrimary,
            mono: true,
        })

        fig.arrow(offsetX + 220, 239, offsetX + 244, 239, {
            color: accent,
            width: 1.6,
            head: 6,
        })

        // Browser callback for Frame 2
        fig.rect(offsetX + 248, 202, 152, 74, {
            fill: fill(accent, 0.15),
            stroke: accent,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(
            offsetX + 324,
            224,
            explicit ? 'lastEventId = "13"' : 'lastEventId = "12"',
            {
                size: 11.5,
                color: explicit ? green : red,
                align: 'center',
                weight: 700,
                mono: true,
            },
        )
        fig.text(offsetX + 324, 252, explicit ? 'EMIT (distinct)' : 'DROPPED (seen)', {
            size: 12.5,
            color: accent,
            align: 'center',
            weight: 700,
        })

        // Outcome strip at bottom
        fig.rect(offsetX + 8, 308, 392, 54, {
            fill: fill(accent, 0.1),
            stroke: accent,
            strokeWidth: 1.25,
            radius: 7,
        })
        fig.text(
            offsetX + 204,
            327,
            explicit ? 'Verified claim delivered to UI' : 'Verified claim silently lost',
            {
                size: 13.5,
                color: accent,
                align: 'center',
                weight: 700,
            },
        )
        fig.text(
            offsetX + 204,
            348,
            explicit
                ? 'Reconnect cursor: Last-Event-ID: 13'
                : 'Dedup sees "12" twice, discards frame 2',
            {
                size: 12,
                color: c.textSecondary,
                align: 'center',
                mono: explicit,
            },
        )
    }

    drawSide(16, false)
    drawSide(456, true)

    return fig.render()
}

export default create()
