import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'A two-stage evaluation flow routes candidate responses through deterministic host checks for access and JSON schema before semantic scoring. Failed checks stop immediately, while responses passing host checks reach the rubric judge, which logs resolved wins or ties and sends unclear cases to human review.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    const soft = (hex: string, amount = 0.12) => tint(hex, c.bg, amount)
    const neutralBg = tint(c.textMuted, c.bg, 0.08)

    // Subtle semantic stage backdrops (hairline border, ultra-light tint)
    fig.path(
        'M206 16 H392 Q402 16 402 26 V364 Q402 374 392 374 H206 Q196 374 196 364 V26 Q196 16 206 16 Z',
        { fill: soft(green, 0.05), color: c.borderSubtle, width: 1, dash: '4 4' },
    )
    fig.path(
        'M434 16 H734 Q744 16 744 26 V364 Q744 374 734 374 H434 Q424 374 424 364 V26 Q424 16 434 16 Z',
        { fill: soft(blue, 0.05), color: c.borderSubtle, width: 1, dash: '4 4' },
    )

    fig.text(299, 36, 'Stage 1 · Deterministic', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(584, 36, 'Stage 2 · Semantic rubric', {
        size: 13.5,
        weight: 700,
        color: blue,
        align: 'center',
    })

    const drawNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        toneHex: string | null,
    ) => {
        fig.rect(x, y, w, h, {
            fill: toneHex ? soft(toneHex, 0.14) : neutralBg,
            stroke: toneHex ?? c.borderLight,
            strokeWidth: toneHex ? 1.7 : 1.3,
            radius: 8,
        })
        fig.text(x + w / 2, y + h / 2 - 11, title, {
            size: 15,
            weight: 700,
            color: toneHex ?? c.textPrimary,
            align: 'center',
        })
        fig.text(x + w / 2, y + h / 2 + 12, sub, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Input node
    drawNode(14, 134, 152, 74, 'Candidate reply', 'Untrusted text', null)

    // Stage 1: Host checks + Block branch
    drawNode(214, 134, 170, 74, 'Host checks', 'Access & JSON schema', green)
    drawNode(214, 276, 170, 74, 'Block failed rule', 'Stop immediately', red)

    // Stage 2: Rubric judge + Win/tie + Human review
    drawNode(442, 134, 146, 74, 'Rubric judge', 'Clarity & order', blue)
    drawNode(616, 70, 118, 72, 'Win or tie', 'Log verdict', blue)
    drawNode(616, 204, 118, 72, 'Human review', 'Flagged pair', warm)

    // Arrows
    fig.arrow(168, 171, 210, 171, { color: c.textSecondary, width: 2, head: 6.5 })

    // Host checks -> Block (fail)
    fig.arrow(299, 210, 299, 272, { color: red, width: 2, head: 6.5 })
    fig.text(310, 241, 'Fail', { size: 13.5, weight: 700, color: red })

    // Host checks -> Rubric judge (pass)
    fig.arrow(386, 171, 438, 171, { color: green, width: 2.2, head: 6.5 })
    fig.text(412, 153, 'Pass', { size: 13.5, weight: 700, color: green, align: 'center' })

    // Rubric judge -> Win or tie
    fig.path('M588 156 C 602 156, 600 106, 610 106', { color: blue, width: 2 })
    fig.arrow(604, 106, 614, 106, { color: blue, width: 2, head: 6 })

    // Rubric judge -> Human review
    fig.path('M588 186 C 602 186, 600 240, 610 240', { color: warm, width: 2 })
    fig.arrow(604, 240, 614, 240, { color: warm, width: 2, head: 6 })

    return fig.render()
}

export default create('dark')
