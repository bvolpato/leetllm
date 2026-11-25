import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 410
export const alt =
    'Calibrated 0 to 1,000 ms latency Gantt chart comparing parallel raw-branch retrieval against serial rewrite-dependent retrieval. Top: planning (40 ms) overlaps raw retrieval (260 ms), followed by rerank (90 ms), pack (20 ms), and model TTFT (430 ms) to hit draft TTFT at 800 ms, then claim completion (100 ms) and verification (80 ms) for first checked claim at 980 ms. Bottom: waiting for rewrite (40 ms) before retrieval shifts draft TTFT to 840 ms (+40 ms).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const teal = fig.tone('cyan')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    const fill = (color: string, amt = 0.2) => tint(color, c.bg, amt)

    const plot = fig.plot(
        { x: 136, y: 66, width: 696, height: 274 },
        { x: [0, 1000], y: [0, 5] },
    )

    plot.axes({
        xTicks: [0, 200, 400, 600, 800, 1000],
        xFormat: (v) => `${v} ms`,
        xLabel: 'Elapsed time from request arrival (ms)',
        grid: true,
        labelSize: 12.5,
    })

    const bar = (
        yCenter: number,
        start: number,
        end: number,
        color: string,
        label?: string,
        h = 30,
    ) => {
        const x1 = plot.px(start)
        const x2 = plot.px(end)
        const y = plot.py(yCenter) - h / 2
        fig.rect(x1, y, Math.max(4, x2 - x1), h, {
            fill: fill(color, 0.24),
            stroke: color,
            strokeWidth: 1.35,
            radius: 4,
        })
        if (label) {
            fig.text((x1 + x2) / 2, plot.py(yCenter), label, {
                size: 12,
                color: c.textPrimary,
                align: 'center',
                weight: 700,
            })
        }
    }

    // Section A header: Parallel raw-branch path
    fig.text(136, 40, 'Parallel raw-branch path (planning overlaps raw retrieval)', {
        size: 13.5,
        color: green,
        weight: 700,
    })

    // Row 1 (y = 4.35): Query Planning (0-40ms) overlapping Retrieval
    fig.text(124, plot.py(4.35), 'Planning', {
        size: 12.5,
        color: c.textSecondary,
        align: 'right',
        weight: 600,
    })
    bar(4.35, 0, 40, blue, undefined, 22)
    fig.text(plot.px(40) + 8, plot.py(4.35), '40 ms (overlapped)', {
        size: 12,
        color: blue,
        weight: 600,
    })

    // Row 2 (y = 3.35): Raw critical path
    fig.text(124, plot.py(3.35), 'Raw path', {
        size: 13,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
    })
    bar(3.35, 0, 260, teal, 'Retrieval 260', 32)
    bar(3.35, 260, 350, blue, 'Rerank', 32)
    bar(3.35, 350, 370, warm, undefined, 32)
    bar(3.35, 370, 800, purple, 'Model prefill & TTFT (430 ms)', 32)
    bar(3.35, 800, 900, warm, 'Claim', 32)
    bar(3.35, 900, 980, green, 'Check', 32)

    // Callout for narrow Pack 20ms bar + Rerank 90ms
    fig.callout([plot.px(360), plot.py(3.35) - 18], [plot.px(395), plot.py(4.35)], 'Pack 20 ms', {
        color: warm,
        labelColor: warm,
        size: 12,
        weight: 600,
        bend: -0.15,
    })

    // Subtle divider between Parallel and Serial paths
    fig.line(plot.area.x, plot.py(2.25), plot.right, plot.py(2.25), {
        color: c.borderSubtle,
        width: 1,
    })

    // Section B header: Serial rewrite-dependent path
    fig.text(136, plot.py(1.92), 'Serial rewrite-dependent path (retrieval waits for 40 ms rewrite)', {
        size: 13.5,
        color: warm,
        weight: 700,
    })

    // Row 3 (y = 1.05): Serial path
    fig.text(124, plot.py(1.05), 'Rewrite path', {
        size: 13,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
    })
    bar(1.05, 0, 40, blue, undefined, 32)
    bar(1.05, 40, 300, teal, 'Retrieval 260', 32)
    bar(1.05, 300, 390, blue, 'Rerank', 32)
    bar(1.05, 390, 410, warm, undefined, 32)
    bar(1.05, 410, 840, purple, 'Model prefill & TTFT (430 ms)', 32)

    // Vertical milestone lines
    plot.vline(800, 'Draft TTFT: 800 ms', {
        color: purple,
        width: 1.5,
        dash: '4 4',
        labelPosition: 'top',
        labelOffset: 8,
        labelSize: 12.5,
        align: 'right',
        weight: 700,
    })
    plot.vline(840, 'Draft TTFT: 840 ms (+40 ms)', {
        color: warm,
        width: 1.5,
        dash: '4 4',
        labelPosition: 'bottom',
        labelOffset: 16,
        labelSize: 12.5,
        align: 'right',
        weight: 700,
    })
    plot.vline(980, 'Checked: 980 ms', {
        color: green,
        width: 1.6,
        dash: '4 4',
        labelPosition: 'top',
        labelOffset: 8,
        labelSize: 12.5,
        align: 'right',
        weight: 700,
    })

    // Bracket showing exact 40 ms shift between 800 ms and 840 ms
    fig.brace(plot.px(800), plot.py(2.5), plot.px(840), plot.py(2.5), undefined, {
        side: 1,
        depth: 6,
        color: warm,
    })
    fig.text(plot.px(840) + 8, plot.py(2.5) + 12, '+40 ms shift', {
        size: 12,
        color: warm,
        weight: 700,
    })

    return fig.render()
}

export default create()
