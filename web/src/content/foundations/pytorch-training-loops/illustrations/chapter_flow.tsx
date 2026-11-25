import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 430
export const alt =
    'Two sequence rows enter a zero-initialized two-class linear model. Raw logits are zero and mean cross-entropy is 0.6931. Backward fills a separate gradient buffer while weights remain zero. SGD with learning rate 0.2 updates the weights to minus 0.1 in class 0 and plus 0.1 in class 1, producing correct class scores.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const green = fig.tone('green')
    const fillAmt = theme === 'dark' ? 0.16 : 0.1

    const drawMatrix2x2 = (
        x: number,
        y: number,
        cw: number,
        ch: number,
        color: string,
        title: string,
        vals: readonly [string, string, string, string],
        footer: string,
        footerColor = c.textSecondary,
    ) => {
        const totalW = cw * 2 + 6
        fig.text(x + totalW / 2, y - 16, title, {
            size: 14,
            weight: 700,
            color,
            align: 'center',
        })
        vals.forEach((v, idx) => {
            const col = idx % 2
            const row = Math.floor(idx / 2)
            const cx = x + col * (cw + 6)
            const cy = y + row * (ch + 6)
            fig.rect(cx, cy, cw, ch, {
                fill: tint(color, c.bg, fillAmt),
                stroke: color,
                strokeWidth: 1.4,
                radius: 6,
            })
            fig.text(cx + cw / 2, cy + ch / 2, v, {
                size: 14.5,
                weight: 700,
                color: c.textPrimary,
                mono: true,
                align: 'center',
            })
        })
        fig.text(x + totalW / 2, y + ch * 2 + 24, footer, {
            size: 12.5,
            weight: 600,
            color: footerColor,
            align: 'center',
        })
    }

    // ─── TOP ROW: FORWARD + BACKWARD (W0 STAYS ZERO) ───
    fig.text(22, 18, 'Forward + backward()  ·  fills .grad while W₀ remains zero', {
        size: 14,
        weight: 700,
        color: c.textSecondary,
    })

    const topY = 68
    const cw1 = 84
    const ch = 38

    drawMatrix2x2(
        26,
        topY,
        cw1,
        ch,
        blue,
        'Inputs X (2×2)',
        ['+1', '+1', '−1', '−1'],
        'targets y = [1, 0]',
        blue,
    )

    fig.arrow(208, topY + 41, 286, topY + 41, { color: purple, width: 2.3, head: 7 })
    fig.math(247, topY + 24, String.raw`\times W_0^{\top}`, {
        size: 14,
        color: purple,
        align: 'center',
    })

    drawMatrix2x2(
        294,
        topY,
        cw1,
        ch,
        purple,
        'Logits Z₀ = XW₀ᵀ',
        ['0', '0', '0', '0'],
        'CE loss = 0.6931',
        critical,
    )

    fig.arrow(476, topY + 41, 560, topY + 41, { color: critical, width: 2.3, head: 7 })
    fig.text(518, topY + 24, 'backward()', {
        size: 12.5,
        weight: 700,
        color: critical,
        mono: true,
        align: 'center',
    })

    drawMatrix2x2(
        568,
        topY,
        cw1,
        ch,
        critical,
        'Gradient W₀.grad',
        ['+0.5', '+0.5', '−0.5', '−0.5'],
        'W₀ still all zeros',
        purple,
    )

    // Curved step() transition from W0.grad down to W1 (routed cleanly right of the heading)
    fig.line(22, 206, width - 22, 206, { color: c.borderSubtle, width: 1, dash: '4 4' })
    fig.path(`M655 186 C655 232, 412 222, 344 268`, { color: green, width: 2.2 })
    fig.arrow(352, 262, 340, 272, { color: green, width: 2.2, head: 7 })

    // ─── BOTTOM ROW: OPTIMIZER STEP() + UPDATED PREDICTIONS ───
    fig.text(22, 228, 'optimizer.step()  ·  applies W₁ = W₀ − 0.2 · W₀.grad', {
        size: 14,
        weight: 700,
        color: green,
    })

    const botY = 278
    const cw2 = 104

    drawMatrix2x2(
        118,
        botY,
        cw2,
        ch,
        green,
        'Updated weights W₁',
        ['−0.1', '−0.1', '+0.1', '+0.1'],
        'row 0: class 0  ·  row 1: class 1',
        c.textSecondary,
    )

    fig.arrow(342, botY + 41, 444, botY + 41, { color: green, width: 2.4, head: 7 })
    fig.math(393, botY + 24, String.raw`X W_1^{\top}`, {
        size: 15,
        color: green,
        align: 'center',
    })

    drawMatrix2x2(
        454,
        botY,
        cw2,
        ch,
        green,
        'Updated logits Z₁ = XW₁ᵀ',
        ['−0.2', '+0.2', '+0.2', '−0.2'],
        '[+1,+1] → class 1   ·   [−1,−1] → class 0',
        green,
    )

    return fig.render()
}

export default create('dark')
