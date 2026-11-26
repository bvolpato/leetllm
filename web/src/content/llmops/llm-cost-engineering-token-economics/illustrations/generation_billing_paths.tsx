import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 415
export const alt =
    'Left: request billing flow branches between stored semantic cache hits ($0 token cost) and model calls billed across four token lines (fresh input, cached read, cache write, and output) plus embedding/infra overhead. Right: token tariffs per million tokens on a clean 0 to 12 dollar scale show Read $0.2, Input $2, Write $2.5, Batch output $6, and Output $12.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    const soft = (hex: string, amount = 0.14) => tint(hex, c.bg, amount)

    // Left panel: Compact, legible billing flow
    fig.text(18, 20, 'Generation billing paths', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const drawNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        toneHex: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: soft(toneHex, 0.14),
            stroke: toneHex,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(x + w / 2, y + h / 2 - 10, title, {
            size: 14.5,
            weight: 700,
            color: toneHex,
            align: 'center',
        })
        fig.text(x + w / 2, y + h / 2 + 11, sub, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Top node
    drawNode(72, 56, 232, 64, 'Request & cache check', 'Semantic lookup first', blue)

    // Hit branch (left)
    drawNode(14, 178, 158, 66, 'Stored hit', '$0 token cost', green)

    // Miss branch (right)
    drawNode(194, 178, 174, 66, 'Model call', '4 billed token lines', purple)

    // Token lines detail box below Model call
    drawNode(144, 308, 224, 66, 'Fresh + Read + Write + Out', 'Plus embed & infra overhead', warm)

    // Clean arrows with large legible edge labels
    // Req -> Hit
    fig.path('M140 120 V 148 H 93 V 172', { color: green, width: 2 })
    fig.arrow(93, 162, 93, 175, { color: green, width: 2, head: 6.5 })
    fig.text(80, 148, 'hit', { size: 13.5, weight: 700, color: green, align: 'right' })

    // Req -> Miss
    fig.path('M236 120 V 148 H 281 V 172', { color: purple, width: 2 })
    fig.arrow(281, 162, 281, 175, { color: purple, width: 2, head: 6.5 })
    fig.text(294, 148, 'miss', { size: 13.5, weight: 700, color: purple })

    // Miss -> Token lines
    fig.arrow(281, 246, 281, 304, { color: warm, width: 2, head: 6.5 })
    fig.text(292, 275, 'billed lines', { size: 13, weight: 600, color: warm })

    // Right panel: Token tariff bar chart on clean 0, 4, 8, 12 scale
    fig.text(444, 20, 'Token tariff ($ per 1M tokens)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 444, y: 58, width: 318, height: 304 },
        { x: [0, 5], y: [0, 13.6] },
    )
    plot.axes({
        yTicks: [0, 4, 8, 12],
        yFormat: (v) => `$${v}`,
        yLabel: '$ / 1M tokens',
        grid: true,
        labelSize: 13.5,
    })

    const tariffs = [
        { cx: 0.5, label: 'Read', value: 0.2, text: '$0.2', color: green },
        { cx: 1.5, label: 'Input', value: 2.0, text: '$2', color: blue },
        { cx: 2.5, label: 'Write', value: 2.5, text: '$2.5', color: purple },
        { cx: 3.5, label: 'Batch out', value: 6.0, text: '$6', color: warm },
        { cx: 4.5, label: 'Output', value: 12.0, text: '$12', color: red },
    ]
    const barW = 42
    for (const t of tariffs) {
        const x = plot.px(t.cx) - barW / 2
        const yTop = plot.py(t.value)
        const h = Math.max(4, plot.bottom - yTop)
        fig.rect(x, plot.bottom - h, barW, h, {
            fill: tint(t.color, c.bg, 0.3),
            stroke: t.color,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(plot.px(t.cx), plot.bottom - h - 13, t.text, {
            size: 13.5,
            weight: 700,
            color: t.color,
            align: 'center',
            mono: true,
        })
        fig.text(plot.px(t.cx), plot.bottom + 18, t.label, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    }

    return fig.render()
}

export default create('dark')
