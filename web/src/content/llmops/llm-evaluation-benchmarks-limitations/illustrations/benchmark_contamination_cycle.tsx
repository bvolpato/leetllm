import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 410
export const alt =
    'Evaluation cases positioned around a March 31 tuning snapshot route by development usage rather than creation date alone. Feb 10 (4bit, prompt-tuned) and Apr 21 (fp8-kv, judge-tuned after the snapshot) both route permanently to the Regression suite. Only unseen post-snapshot items Apr 8 (prefill) and May 3 (template) remain in the Holdout set.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')

    const soft = (hex: string, amount = 0.13) => tint(hex, c.bg, amount)

    // Snapshot boundary vertical dashed divider
    const snapX = 248
    fig.line(snapX, 34, snapX, 384, { color: c.textMuted, width: 1.5, dash: '5 4' })
    fig.text(snapX, 20, 'Mar 31 tuning snapshot', {
        size: 13.5,
        weight: 700,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(124, 42, 'Before snapshot', {
        size: 12.5,
        weight: 600,
        color: c.textMuted,
        align: 'center',
    })
    fig.text(372, 42, 'Created after snapshot', {
        size: 12.5,
        weight: 600,
        color: c.textMuted,
        align: 'center',
    })

    const drawItem = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        detail: string,
        toneHex: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: soft(toneHex, 0.14),
            stroke: toneHex,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(x + 12, y + 21, title, {
            size: 14,
            weight: 700,
            color: toneHex,
            mono: true,
        })
        fig.text(x + 12, y + 43, detail, {
            size: 13,
            color: c.textSecondary,
        })
    }

    const drawSuite = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub1: string,
        sub2: string,
        toneHex: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: soft(toneHex, 0.16),
            stroke: toneHex,
            strokeWidth: 2,
            radius: 10,
        })
        fig.text(x + w / 2, y + 28, title, {
            size: 16,
            weight: 700,
            color: toneHex,
            align: 'center',
        })
        fig.text(x + w / 2, y + 54, sub1, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x + w / 2, y + 76, sub2, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Items (all single-line titles, zero awkward wraps)
    // 1. Pre-snapshot tuned item
    drawItem(18, 72, 206, 62, 'Feb 10 · 4bit', 'Used to tune prompt', warm)

    // 2. Post-snapshot BUT tuned -> still moves to Regression!
    drawItem(274, 146, 206, 62, 'Apr 21 · fp8-kv', 'Used to tune judge', warm)

    // 3 & 4. Post-snapshot and untouched -> Holdout set
    drawItem(274, 240, 206, 62, 'Apr 8 · prefill', 'Untouched unseen case', blue)
    drawItem(274, 322, 206, 62, 'May 3 · template', 'Untouched unseen case', blue)

    // Destination suites
    drawSuite(
        578,
        82,
        184,
        104,
        'Regression suite',
        'Known dev checks',
        'Any tuned exposure',
        warm,
    )
    drawSuite(
        578,
        258,
        184,
        104,
        'Holdout set',
        'Generalization only',
        'Post-snapshot & unseen',
        blue,
    )

    // Curved routing arrows
    // Feb 10 -> Regression
    fig.path('M226 103 C 380 103, 470 116, 566 116', { color: warm, width: 2 })
    fig.arrow(560, 116, 574, 116, { color: warm, width: 2, head: 6.5 })

    // Apr 21 fp8-kv -> Regression (curves UP despite post-snapshot date)
    fig.path('M482 177 C 526 177, 526 152, 566 152', { color: warm, width: 2.2 })
    fig.arrow(560, 152, 574, 152, { color: warm, width: 2.2, head: 6.5 })

    // Apr 8 prefill -> Holdout
    fig.path('M482 271 C 526 271, 526 292, 566 292', { color: blue, width: 2 })
    fig.arrow(560, 292, 574, 292, { color: blue, width: 2, head: 6.5 })

    // May 3 template -> Holdout
    fig.path('M482 353 C 526 353, 526 330, 566 330', { color: blue, width: 2 })
    fig.arrow(560, 330, 574, 330, { color: blue, width: 2, head: 6.5 })

    // Subtle divider between Regression and Holdout lanes on the right
    fig.line(500, 224, width - 18, 224, { color: c.borderSubtle, width: 1, dash: '4 4' })

    return fig.render()
}

export default create('dark')
