import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 385
export const alt =
    'A four-stage request path through an inference server: server.py starts the time-to-first-token timer, batch_scheduler.py holds requests until max_wait_ms expires, engine.py runs prefill, and metrics.py reports p99 latency. Keyword retrieval for time to first token reaches server.py and metrics.py but skips the scheduler that adds the delay.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const fillAlpha = theme === 'light' ? 0.12 : 0.16

    // Top keyword-search probe pill
    const queryX = 248
    const queryY = 18
    const queryW = 304
    const queryH = 38
    fig.rect(queryX, queryY, queryW, queryH, {
        fill: tint(blue, c.bg, fillAlpha),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 19,
    })
    fig.text(queryX + queryW / 2, queryY + queryH / 2, 'Search query: "time to first token"', {
        size: 14,
        weight: 600,
        color: blue,
        align: 'center',
    })

    // Four horizontal request-path stages
    const stages = [
        {
            x: 24,
            w: 162,
            file: 'server.py',
            role: 'Starts TTFT timer',
            stroke: blue,
            fill: tint(blue, c.bg, fillAlpha),
            textCol: c.textPrimary,
            badge: 'Search hit',
        },
        {
            x: 214,
            w: 196,
            file: 'batch_scheduler.py',
            role: 'max_wait_ms holds queue',
            stroke: warm,
            fill: tint(warm, c.bg, theme === 'light' ? 0.16 : 0.2),
            textCol: c.textPrimary,
            badge: null,
        },
        {
            x: 438,
            w: 152,
            file: 'engine.py',
            role: 'Runs prefill',
            stroke: c.border,
            fill: tint(c.textMuted, c.bg, 0.08),
            textCol: c.textPrimary,
            badge: null,
        },
        {
            x: 618,
            w: 158,
            file: 'metrics.py',
            role: 'Reports p99 TTFT',
            stroke: blue,
            fill: tint(blue, c.bg, fillAlpha),
            textCol: c.textPrimary,
            badge: 'Search hit',
        },
    ]

    const boxY = 148
    const boxH = 74

    // Curved search-hit arrows from top query pill to the two ends
    fig.path(`M${queryX} ${queryY + queryH / 2}Q105 42,105 ${boxY - 8}`, {
        color: blue,
        width: 1.75,
    })
    fig.arrow(105, boxY - 18, 105, boxY - 4, { color: blue, width: 1.75, head: 7 })
    fig.text(100, 32, 'Matches "TTFT"', {
        size: 12,
        weight: 600,
        color: blue,
        align: 'center',
    })

    fig.path(`M${queryX + queryW} ${queryY + queryH / 2}Q697 42,697 ${boxY - 8}`, {
        color: blue,
        width: 1.75,
    })
    fig.arrow(697, boxY - 18, 697, boxY - 4, { color: blue, width: 1.75, head: 7 })
    fig.text(702, 32, 'Matches "TTFT"', {
        size: 12,
        weight: 600,
        color: blue,
        align: 'center',
    })

    // Blind-spot bracket over the two middle stages
    fig.brace(220, boxY - 12, 584, boxY - 12, 'No "TTFT" term · missed by keyword search', {
        side: -1,
        depth: 10,
        color: red,
        labelColor: red,
        labelSize: 13,
        labelGap: 14,
        weight: 600,
        dash: '4 3',
    })

    stages.forEach((s, i) => {
        fig.rect(s.x, boxY, s.w, boxH, {
            fill: s.fill,
            stroke: s.stroke,
            strokeWidth: i === 1 ? 2 : 1.4,
            radius: 10,
        })
        fig.text(s.x + s.w / 2, boxY + 25, s.file, {
            size: 14,
            weight: 700,
            color: i === 1 ? warm : s.textCol,
            align: 'center',
            mono: true,
        })
        fig.text(s.x + s.w / 2, boxY + 51, s.role, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })

        if (i < stages.length - 1) {
            const next = stages[i + 1]!
            fig.arrow(s.x + s.w + 4, boxY + boxH / 2, next.x - 4, boxY + boxH / 2, {
                color: c.textMuted,
                width: 1.75,
                head: 7,
            })
        }
    })

    // Bottom elapsed-TTFT timeline strip aligned under the four files
    const trackY = 278
    const trackH = 30
    const startX = 105
    const endX = 697

    fig.line(startX, boxY + boxH + 6, startX, trackY - 4, {
        color: blue,
        width: 1.25,
        dash: '3 3',
    })
    fig.line(endX, boxY + boxH + 6, endX, trackY - 4, {
        color: blue,
        width: 1.25,
        dash: '3 3',
    })

    // Segments: ingress (small), queueing wait under batch_scheduler (dominant), prefill under engine
    const seg1W = 109
    const seg2W = 310
    const seg3W = endX - (startX + seg1W + seg2W)

    fig.rect(startX, trackY, seg1W - 2, trackH, {
        fill: tint(blue, c.bg, 0.35),
        radius: 5,
    })
    fig.rect(startX + seg1W, trackY, seg2W - 2, trackH, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.32 : 0.38),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.rect(startX + seg1W + seg2W, trackY, seg3W, trackH, {
        fill: tint(c.textMuted, c.bg, 0.25),
        radius: 5,
    })

    fig.text(startX + seg1W / 2, trackY + trackH / 2, 'Ingress', {
        size: 12,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(startX + seg1W + seg2W / 2, trackY + trackH / 2, 'Hidden queue wait (max_wait_ms)', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(startX + seg1W + seg2W + seg3W / 2, trackY + trackH / 2, 'Prefill', {
        size: 12,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    fig.brace(startX, trackY + trackH + 10, endX, trackY + trackH + 10, 'Measured TTFT (requires full dependency slice to explain)', {
        side: 1,
        depth: 9,
        color: c.textMuted,
        labelColor: c.textSecondary,
        labelSize: 13,
        labelGap: 14,
        weight: 500,
    })

    return fig.render()
}

export default create('dark')
