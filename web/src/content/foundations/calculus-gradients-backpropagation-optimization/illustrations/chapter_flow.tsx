import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/backprop-film'

export const alt =
    'Two aligned computation graphs trace one latency example. The forward pass carries feature and weight values through prediction 6, error 1, and squared loss 1. The backward pass starts with loss sensitivity 1, multiplies by 2e and by the subtraction derivative 1, then branches to separate gradients 4 for the prompt weight and 2 for the queue weight.'

export const width = 780
export const height = 470

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const critical = fig.tone('critical')
    const fillAmt = theme === 'dark' ? 0.16 : 0.1

    const node = (
        cx: number,
        cy: number,
        w: number,
        h: number,
        color: string,
        topText: string,
        botTex: string,
        topIsTex = false,
    ) => {
        fig.rect(cx - w / 2, cy - h / 2, w, h, {
            fill: tint(color, c.bg, fillAmt),
            stroke: color,
            strokeWidth: 1.75,
            radius: 10,
        })
        if (topIsTex) {
            fig.math(cx, cy - 14, topText, { size: 17, color: c.textPrimary, align: 'center' })
        } else {
            fig.text(cx, cy - 14, topText, {
                size: 15,
                weight: 700,
                color: c.textPrimary,
                align: 'center',
            })
        }
        fig.math(cx, cy + 16, botTex, { size: 14, color: c.textSecondary, align: 'center' })
    }

    // Shared x column centers
    const col1 = 104
    const col2 = 340
    const col3 = 526
    const col4 = 696

    // ─── TOP BAND: FORWARD PASS ───
    fig.text(22, 22, 'FORWARD · values move left to right toward the loss', {
        size: 14,
        weight: 700,
        color: blue,
    })

    const fTop = 90
    const fBot = 178
    const fMid = 134

    // Forward connectors
    fig.path(`M194 ${fTop} C230 ${fTop}, 232 ${fMid - 12}, 270 ${fMid - 12}`, {
        color: blue,
        width: 2.25,
    })
    fig.arrow(264, fMid - 12, 276, fMid - 12, { color: blue, width: 2.25, head: 7 })
    fig.path(`M194 ${fBot} C230 ${fBot}, 232 ${fMid + 12}, 270 ${fMid + 12}`, {
        color: cyan,
        width: 2.25,
    })
    fig.arrow(264, fMid + 12, 276, fMid + 12, { color: cyan, width: 2.25, head: 7 })
    fig.arrow(404, fMid, 462, fMid, { color: purple, width: 2.25, head: 7 })
    fig.arrow(590, fMid, 636, fMid, { color: warm, width: 2.25, head: 7 })

    node(col1, fTop, 178, 68, blue, 'Prompt · 4', String.raw`w_p x_p = 2 \times 2`)
    node(col1, fBot, 178, 68, cyan, 'Queue · 2', String.raw`w_q x_q = 2 \times 1`)
    node(col2, fMid, 126, 74, purple, String.raw`\hat{y} = 6`, String.raw`4 + 2`, true)
    node(col3, fMid, 126, 74, warm, String.raw`e = 1`, String.raw`6 - 5`, true)
    node(col4, fMid, 118, 74, critical, String.raw`L = 1`, String.raw`e^2`, true)

    // Subtle separator
    fig.line(22, 238, width - 22, 238, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // ─── BOTTOM BAND: BACKWARD PASS ───
    fig.text(22, 264, 'BACKWARD · local derivatives carry the gradient right to left', {
        size: 14,
        weight: 700,
        color: critical,
    })

    const bTop = 330
    const bBot = 420
    const bMid = 375

    // Backward connectors (right to left)
    fig.arrow(634, bMid, 592, bMid, { color: warm, width: 2.25, head: 7 })
    fig.arrow(460, bMid, 406, bMid, { color: purple, width: 2.25, head: 7 })
    fig.path(`M274 ${bMid - 12} C234 ${bMid - 12}, 232 ${bTop}, 200 ${bTop}`, {
        color: blue,
        width: 2.25,
    })
    fig.arrow(208, bTop, 195, bTop, { color: blue, width: 2.25, head: 7 })
    fig.path(`M274 ${bMid + 12} C234 ${bMid + 12}, 232 ${bBot}, 200 ${bBot}`, {
        color: cyan,
        width: 2.25,
    })
    fig.arrow(208, bBot, 195, bBot, { color: cyan, width: 2.25, head: 7 })

    // Edge local-derivative cues
    fig.math(613, bMid - 18, String.raw`\times 2e`, { size: 13, color: warm, align: 'center' })
    fig.math(433, bMid - 18, String.raw`\times 1`, { size: 13, color: purple, align: 'center' })

    node(col1, bTop, 178, 72, blue, String.raw`\tfrac{\partial L}{\partial w_p} = 4`, String.raw`2 \times x_p`, true)
    node(col1, bBot, 178, 72, cyan, String.raw`\tfrac{\partial L}{\partial w_q} = 2`, String.raw`2 \times x_q`, true)
    node(col2, bMid, 128, 76, purple, String.raw`\tfrac{\partial L}{\partial \hat{y}} = 2`, String.raw`2 \times 1`, true)
    node(col3, bMid, 128, 76, warm, String.raw`\tfrac{\partial L}{\partial e} = 2`, String.raw`1 \times 2e`, true)
    node(col4, bMid, 120, 76, critical, String.raw`\tfrac{\partial L}{\partial L} = 1`, String.raw`\text{loss seed}`, true)

    return fig.render()
}

export default create()
