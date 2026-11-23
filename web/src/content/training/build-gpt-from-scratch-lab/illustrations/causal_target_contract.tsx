import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 720
export const height = 895
export const alt =
    'The six actual GPT-2 BPE tokens for Good sir, newline, Speak are shown in sequence across two rows. A full-width causal mask highlights query q2 at the comma: it reads keys 0 through 2, while future keys 3 through 5 are blocked. Below, logits z2 are scored against the separate shifted target y2 = x3, the newline token with GPT-2 ID 198.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = getReadableToneColor('cyan', c)
    const amber = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary
    const cellWidth = 72
    const cellHeight = 33
    const cellGap = 5
    const matrixX = 166
    const matrixY = 426
    const shapes = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        SvgFrame({
            c,
            x: 16,
            y: 96,
            width: 688,
            height: 218,
            rx: 12,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 16,
            y: 326,
            width: 688,
            height: 405,
            rx: 12,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 16,
            y: 744,
            width: 688,
            height: 136,
            rx: 12,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        ...Array.from({ length: 6 }, (_, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const x = 40 + col * 226
            const y = 136 + row * 85
            const selected = i === 2
            const future = i > 2
            return SvgFrame({
                key: `token-${i}`,
                c,
                x,
                y,
                width: 210,
                height: 79,
                rx: 8,
                fill: selected ? `${amber}18` : future ? c.bgSubtle : `${cyan}12`,
                stroke: selected ? amber : future ? c.borderSubtle : cyan,
                strokeWidth: selected ? 2.4 : 1.3,
            })
        }),
        ...Array.from({ length: 6 }, (_, row) =>
            Array.from({ length: 6 }, (_, col) => {
                const visible = col <= row
                const selected = row === 2
                const x = matrixX + col * (cellWidth + cellGap)
                const y = matrixY + row * (cellHeight + cellGap)
                return SvgFrame({
                    key: `mask-${row}-${col}`,
                    c,
                    x,
                    y,
                    width: cellWidth,
                    height: cellHeight,
                    rx: 4,
                    fill: selected
                        ? visible
                            ? `${amber}42`
                            : c.bgSubtle
                        : visible
                          ? `${cyan}22`
                          : c.bgSubtle,
                    stroke: selected && visible ? amber : visible ? c.border : c.borderSubtle,
                    strokeWidth: selected && visible ? 2.2 : 1,
                    opacity: visible ? 1 : 0.72,
                })
            }),
        ).flat(),
        SvgFrame({
            c,
            x: 28,
            y: 790,
            width: 664,
            height: 74,
            rx: 9,
            fill: c.bgSubtle,
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: 40,
            y: 792,
            width: 183,
            height: 70,
            rx: 8,
            fill: `${amber}16`,
            stroke: amber,
            strokeWidth: 1.6,
        }),
        SvgFrame({
            c,
            x: 268,
            y: 792,
            width: 183,
            height: 70,
            rx: 8,
            fill: `${cyan}14`,
            stroke: cyan,
            strokeWidth: 1.6,
        }),
        SvgFrame({
            c,
            x: 496,
            y: 792,
            width: 183,
            height: 70,
            rx: 8,
            fill: `${green}16`,
            stroke: green,
            strokeWidth: 1.6,
        }),
        VectorArrow({
            x1: 225,
            y1: 827,
            x2: 260,
            y2: 827,
            color: muted,
            strokeWidth: 2.6,
            arrowSize: 8,
        }),
        VectorArrow({
            x1: 453,
            y1: 827,
            x2: 488,
            y2: 827,
            color: muted,
            strokeWidth: 2.6,
            arrowSize: 8,
        }),
    )
    const itemLabels = [
        CanvasItem({ x: 0, y: 0, width, height, children: shapes }),
        label(c, 'Mask and shifted target', 20, 14, 680, 40, 38, c.textPrimary, 800),
        label(
            c,
            'q₂ reads its prefix. Loss scores the successor.',
            22,
            57,
            676,
            29,
            27,
            muted,
            550,
        ),
        label(c, 'INPUT TOKENS · GPT-2 BPE', 30, 101, 660, 35, 26, cyan, 800),
        ...[
            ['Good', 'x₀ · 10248'],
            ["' sir'", 'x₁ · 15967'],
            [',', 'x₂ · 11'],
            ['\\n', 'x₃ · 198'],
            ['Spe', 'x₄ · 5248'],
            ['ak', 'x₅ · 461'],
        ].flatMap(([piece, id], i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const x = 40 + col * 226
            const y = 136 + row * 85
            return [
                label(
                    c,
                    piece,
                    x + 10,
                    y + 1,
                    190,
                    39,
                    30,
                    i === 2 ? amber : c.textPrimary,
                    i === 2 ? 800 : 700,
                    'center',
                    true,
                ),
                label(c, id, x + 8, y + 43, 194, 32, 24, muted, 650, 'center', true),
            ]
        }),
        label(c, 'CAUSAL MASK · q rows, k columns', 28, 338, 660, 40, 30, c.textPrimary, 800),
        ...Array.from({ length: 6 }, (_, col) =>
            label(
                c,
                `${col}`,
                matrixX + col * (cellWidth + cellGap),
                387,
                cellWidth,
                35,
                26,
                muted,
                650,
                'center',
                true,
            ),
        ),
        ...Array.from({ length: 6 }, (_, row) =>
            label(
                c,
                `q${['₀', '₁', '₂', '₃', '₄', '₅'][row]}`,
                84,
                matrixY + row * (cellHeight + cellGap),
                70,
                37,
                28,
                row === 2 ? amber : muted,
                row === 2 ? 800 : 600,
                'center',
                true,
            ),
        ),
        label(c, 'q₂ = comma · visible keys 0–2', 42, 660, 636, 34, 25, amber, 800),
        label(c, 'Keys 3–5 masked · −∞ gives weight 0', 42, 696, 636, 32, 24, muted, 600),
        label(c, 'Next-token loss: score z₂ against y₂ = x₃', 34, 750, 650, 36, 27, green, 800),
        label(c, 'x₂ = comma', 46, 811, 168, 36, 27, amber, 750, 'center', true),
        label(c, 'z₂', 275, 811, 170, 36, 27, cyan, 750, 'center', true),
        label(c, 'y₂ = x₃', 503, 797, 170, 32, 24, green, 750, 'center', true),
        label(c, 'newline', 503, 831, 170, 31, 24, green, 700, 'center', true),
    ]
    return Board({ c, width, height, background: 'transparent', children: itemLabels })
}

export default create('dark')
