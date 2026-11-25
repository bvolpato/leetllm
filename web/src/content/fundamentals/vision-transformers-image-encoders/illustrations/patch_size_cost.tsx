import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 385
export const alt =
    'Patch grids and quadratic self-attention cost for a 224 by 224 street scene across patch sizes. Coarse 32 by 32 patches create 7x7 = 49 tokens and trap a 28-pixel speed sign inside 1 cell (2.4k attention pairs). Fine 14 by 14 patches create 16x16 = 256 tokens and resolve the sign across 4 tiles, increasing pairwise attention evaluations 27x to 65.5k.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const red = fig.tone('red')
    const purple = fig.tone('purple')

    const baseFill = isLight ? '#eeeae0' : '#1b202c'
    const baseStroke = isLight ? '#c8c2b4' : '#3a4256'
    const signFill = tint(red, c.bg, isLight ? 0.3 : 0.48)

    const drawGrid = (
        x: number,
        y: number,
        size: number,
        n: number,
        redCheck: (r: number, col: number) => boolean,
    ) => {
        const gap = 3
        const cell = (size - gap * (n - 1)) / n
        for (let r = 0; r < n; r++) {
            for (let col = 0; col < n; col++) {
                const isSign = redCheck(r, col)
                fig.rect(x + col * (cell + gap), y + r * (cell + gap), cell, cell, {
                    fill: isSign ? signFill : baseFill,
                    stroke: isSign ? red : baseStroke,
                    strokeWidth: isSign ? 1.8 : 1,
                    radius: 3,
                })
            }
        }
    }

    // Col 1: Coarse P = 32 (7x7 = 49 tokens)
    const gSize = 176
    const gY = 74
    const c1X = 24
    fig.text(c1X + gSize / 2, 22, 'Coarse: P = 32', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(c1X + gSize / 2, 44, '7×7 = 49 tokens', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    drawGrid(c1X, gY, gSize, 7, (r, col) => r === 2 && col === 4)
    fig.text(c1X + gSize / 2, gY + gSize + 20, 'Sign trapped in 1 cell', {
        size: 12.5,
        color: red,
        weight: 600,
        align: 'center',
    })
    fig.rect(c1X + 26, gY + gSize + 36, gSize - 52, 28, {
        fill: tint(warm, c.bg, isLight ? 0.12 : 0.2),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 14,
    })
    fig.text(c1X + gSize / 2, gY + gSize + 50, '2.4k pairs', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Col 2: Fine P = 14 (16x16 = 256 tokens, shown as crisp 8x8 quadrant schematic)
    const c2X = 236
    fig.text(c2X + gSize / 2, 22, 'Fine: P = 14', {
        size: 15,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(c2X + gSize / 2, 44, '16×16 = 256 tokens', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    drawGrid(c2X, gY, gSize, 8, (r, col) => r >= 2 && r <= 3 && col >= 4 && col <= 5)
    fig.text(c2X + gSize / 2, gY + gSize + 20, 'Sign resolved across 4 tiles', {
        size: 12.5,
        color: red,
        weight: 600,
        align: 'center',
    })
    fig.rect(c2X + 22, gY + gSize + 36, gSize - 44, 28, {
        fill: tint(blue, c.bg, isLight ? 0.12 : 0.2),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 14,
    })
    fig.text(c2X + gSize / 2, gY + gSize + 50, '65.5k pairs', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    // Divider
    fig.line(442, 24, 442, height - 24, { color: c.borderSubtle, width: 1 })

    // Col 3: Quadratic Attention Pairs Bar Chart
    const chartX = 496
    const chartW = 240
    fig.text(chartX + chartW / 2, 22, 'Attention pairs (N²)', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(chartX + chartW / 2, 44, '224×224 input resolution', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const plot = fig.plot({ x: chartX, y: gY, width: chartW, height: 224 }, { x: [0, 3], y: [0, 75] })
    plot.axes({
        xTicks: [],
        yTicks: [0, 20, 40, 60],
        yFormat: (v) => (v === 0 ? '0' : `${v}k`),
        grid: true,
        labelSize: 12,
    })

    const bars = [
        { label: 'P = 32', val: 2.4, text: '2.4k', color: warm },
        { label: 'P = 16', val: 38.4, text: '38.4k', color: blue },
        { label: 'P = 14', val: 65.5, text: '65.5k', color: purple },
    ] as const

    const bw = 46
    bars.forEach((b, i) => {
        const cx = plot.px(i + 0.5)
        const topY = plot.py(b.val)
        fig.rect(cx - bw / 2, topY, bw, Math.max(4, plot.bottom - topY), {
            fill: tint(b.color, c.bg, isLight ? 0.24 : 0.38),
            stroke: b.color,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(cx, topY - 11, b.text, {
            size: 13,
            weight: 700,
            color: b.color,
            align: 'center',
            mono: true,
        })
        fig.text(cx, plot.bottom + 16, b.label, {
            size: 12.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    })

    // Curved jump callout from P=32 bar to P=14 bar
    fig.callout([plot.px(2.15), plot.py(64)], [plot.px(1.55), plot.py(68)], '27× jump', {
        color: purple,
        size: 13,
        weight: 700,
        bend: -0.25,
        align: 'right',
    })

    return fig.render()
}

export default create('dark')
