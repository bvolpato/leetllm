import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'A backward computation graph runs from squared loss L=1 through error e=1 and prediction ŷ=6, then splits into prompt and queue paths before returning to shared weight w=2. The prompt contribution is 2×1×2=4, the queue contribution is 2×1×1=2, and the shared weight gradient adds them to 6.'

export const width = 780
export const height = 360

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const critical = fig.tone('critical')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')

    const fillAmt = theme === 'dark' ? 0.16 : 0.1

    const node = (
        cx: number,
        cy: number,
        w: number,
        h: number,
        color: string,
        title: string,
        tex: string,
        titleIsTex = false,
    ) => {
        fig.rect(cx - w / 2, cy - h / 2, w, h, {
            fill: tint(color, c.bg, fillAmt),
            stroke: color,
            strokeWidth: 1.75,
            radius: 10,
        })
        if (titleIsTex) {
            fig.math(cx, cy - 15, title, { size: 15, color: c.textPrimary, align: 'center' })
        } else {
            fig.text(cx, cy - 15, title, {
                size: 14,
                weight: 700,
                color: c.textPrimary,
                align: 'center',
            })
        }
        fig.math(cx, cy + 16, tex, { size: 13.5, color: c.textSecondary, align: 'center' })
    }

    fig.text(width / 2, 22, 'Reverse-mode gradient splits across both branches and sums at shared weight w', {
        size: 14,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    // Non-overlapping horizontal layout (width 780):
    // Shared w: [12..148] (cx=80, w=136)
    // gap 40 -> Prompt/Queue: [188..330] (cx=259, w=142)
    // gap 38 -> Prediction: [368..478] (cx=423, w=110)
    // gap 30 -> Error: [508..608] (cx=558, w=100)
    // gap 30 -> Loss: [638..768] (cx=703, w=130)
    const midY = 194
    const topY = 112
    const botY = 276

    // Arrows (right-to-left)
    fig.arrow(636, midY, 610, midY, { color: warm, width: 2.3, head: 7 })
    fig.arrow(506, midY, 480, midY, { color: purple, width: 2.3, head: 7 })

    // Prediction splits into Prompt & Queue
    fig.path(`M368 ${midY - 14} C350 ${midY - 14}, 350 ${topY}, 336 ${topY}`, {
        color: blue,
        width: 2.3,
    })
    fig.arrow(342, topY, 331, topY, { color: blue, width: 2.3, head: 7 })

    fig.path(`M368 ${midY + 14} C350 ${midY + 14}, 350 ${botY}, 336 ${botY}`, {
        color: cyan,
        width: 2.3,
    })
    fig.arrow(342, botY, 331, botY, { color: cyan, width: 2.3, head: 7 })

    // Prompt & Queue reconverge into Shared weight w
    fig.path(`M188 ${topY} C166 ${topY}, 170 ${midY - 18}, 154 ${midY - 18}`, {
        color: blue,
        width: 2.3,
    })
    fig.arrow(160, midY - 18, 149, midY - 18, { color: blue, width: 2.3, head: 7 })

    fig.path(`M188 ${botY} C166 ${botY}, 170 ${midY + 18}, 154 ${midY + 18}`, {
        color: cyan,
        width: 2.3,
    })
    fig.arrow(160, midY + 18, 149, midY + 18, { color: cyan, width: 2.3, head: 7 })

    // Branch sum cues
    fig.text(168, topY - 14, '+4', { size: 13, weight: 700, color: blue, align: 'center' })
    fig.text(168, botY + 16, '+2', { size: 13, weight: 700, color: cyan, align: 'center' })

    // Nodes
    node(703, midY, 130, 78, critical, 'Loss', String.raw`L=1,\;\tfrac{\partial L}{\partial L}=1`)
    node(558, midY, 100, 78, warm, 'Error · e=1', String.raw`2e = 2`)
    node(423, midY, 110, 78, purple, 'Prediction', String.raw`\hat{y}=6,\;\tfrac{\partial L}{\partial \hat{y}}=2`)
    node(
        259,
        topY,
        142,
        74,
        blue,
        String.raw`\text{Prompt } x_p = 2`,
        String.raw`2 \times 1 \times x_p = 4`,
        true,
    )
    node(
        259,
        botY,
        142,
        74,
        cyan,
        String.raw`\text{Queue } x_q = 1`,
        String.raw`2 \times 1 \times x_q = 2`,
        true,
    )

    // Shared weight w (sum node)
    fig.rect(12, midY - 48, 136, 96, {
        fill: tint(green, c.bg, theme === 'dark' ? 0.2 : 0.13),
        stroke: green,
        strokeWidth: 2.25,
        radius: 11,
    })
    fig.text(80, midY - 26, 'Shared weight', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.math(80, midY - 2, String.raw`w = 2`, { size: 15, color: c.textPrimary, align: 'center' })
    fig.math(80, midY + 26, String.raw`\tfrac{\partial L}{\partial w} = 4 + 2 = 6`, {
        size: 14,
        color: green,
        align: 'center',
    })

    return fig.render()
}

export default create()
