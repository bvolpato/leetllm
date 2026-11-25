import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 445
export const alt =
    'A four-turn GPU out-of-memory troubleshooting trace shows Turn 1-2 with chunked prefill disabled and max_batch_tokens at 32768, Turn 3 running patch_config to complete enabling chunked prefill, and Turn 4 where a candidate repeats that advice. Judging Turn 4 alone misses completion and falsely approves, whereas passing full T1-T4 tool state flags the repeat and points to max_batch_tokens.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    const soft = (hex: string, amount = 0.13) => tint(hex, c.bg, amount)

    const drawNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        line1: string,
        line2: string | null,
        toneHex: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: soft(toneHex, 0.12),
            stroke: toneHex,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(x + 14, y + (line2 ? 20 : 22), title, {
            size: 14.5,
            weight: 700,
            color: toneHex,
        })
        fig.text(x + 14, y + (line2 ? 43 : 46), line1, {
            size: 13.5,
            color: c.textPrimary,
            mono: line1.includes('='),
        })
        if (line2) {
            fig.text(x + 14, y + 63, line2, {
                size: 13,
                color: c.textSecondary,
                mono: line2.includes('=') || line2.includes('COMPLETED'),
            })
        }
    }

    // Stage 1: Session state timeline
    fig.text(18, 20, 'Recorded session state before the candidate answers', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const topY = 46
    const topH = 82
    drawNode(18, topY, 224, topH, 'T1-T2 · 40k OOM', 'chunked_prefill = false', 'max_batch_tokens = 32768', blue)
    drawNode(278, topY, 224, topH, 'T3 · patch_config', 'chunked_prefill = true', 'status: 200 COMPLETED', green)
    drawNode(538, topY, 224, topH, 'T4 · Candidate reply', '"Enable chunked prefill"', 'Repeats completed fix', warm)

    fig.arrow(244, topY + topH / 2, 274, topY + topH / 2, { color: blue, width: 2, head: 6.5 })
    fig.arrow(504, topY + topH / 2, 534, topY + topH / 2, { color: green, width: 2, head: 6.5 })

    // Horizontal hairline separator
    fig.line(18, 162, width - 18, 162, { color: c.borderLight, width: 1, dash: '5 4' })

    // Stage 2: Judge verdict comparison
    fig.text(18, 188, 'Judge verdict depends on trusted prior tool state', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    // Row 1: Only T4 (blind to tool state)
    const r1Y = 222
    const rowH = 78
    drawNode(
        18,
        r1Y,
        304,
        rowH,
        'Input: Only T4 prompt + reply',
        'Prior tool calls hidden from judge',
        null,
        red,
    )
    fig.arrow(328, r1Y + rowH / 2, 434, r1Y + rowH / 2, { color: red, width: 2.2, head: 7 })
    fig.text(381, r1Y + rowH / 2 - 14, 'Missing state', {
        size: 13,
        weight: 600,
        color: red,
        align: 'center',
    })
    drawNode(
        440,
        r1Y,
        322,
        rowH,
        'False approval (unassessable)',
        'Advice looks helpful in isolation',
        null,
        red,
    )

    // Row 2: Full T1-T4 tool history
    const r2Y = 330
    drawNode(
        18,
        r2Y,
        304,
        rowH,
        'Input: Full T1-T4 tool history',
        'T3 patch recorded as COMPLETED',
        null,
        green,
    )
    fig.arrow(328, r2Y + rowH / 2, 434, r2Y + rowH / 2, { color: green, width: 2.2, head: 7 })
    fig.text(381, r2Y + rowH / 2 - 14, 'Verified log', {
        size: 13,
        weight: 600,
        color: green,
        align: 'center',
    })
    drawNode(
        440,
        r2Y,
        322,
        rowH,
        'Repeat flagged',
        'Ask to check max_batch_tokens',
        null,
        green,
    )

    return fig.render()
}

export default create('dark')
