import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 720
export const height = 660
export const alt =
    'GPT-2 provides 50,257 token IDs, and the bundled Shakespeare corpus uses 17,485 of them. Six pieces from “Good sir, newline, Speak” show their actual GPT-2 IDs and sorted dense local IDs. The compact tied input/output matrix has 1,678,560 weights instead of 4,824,672. Logits range over the 17,485 active local IDs; the saved inverse map returns sampled IDs to GPT-2 IDs for decoding. The corpus-wide map includes 335 validation-only IDs.'

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

const mappings = [
    { piece: 'Good', gpt2: 10248, local: 6578 },
    { piece: "' sir'", gpt2: 15967, local: 9056 },
    { piece: ',', gpt2: 11, local: 2 },
    { piece: "'\\n'", gpt2: 198, local: 67 },
    { piece: 'Spe', gpt2: 5248, local: 3849 },
    { piece: 'ak', gpt2: 461, local: 267 },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const purple = getReadableToneColor('purple', c)
    const muted = c.textSecondary
    const fullWidth = 652
    const activeWidth = Math.round((fullWidth * 17485) / 50257)
    const fullWeightsWidth = 652
    const activeWeightsWidth = Math.round((fullWeightsWidth * 17485) / 50257)

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
            x: 20,
            y: 96,
            width: 680,
            height: 122,
            rx: 12,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 34,
            y: 145,
            width: fullWidth,
            height: 23,
            rx: 6,
            fill: c.bgSubtle,
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: 34,
            y: 145,
            width: activeWidth,
            height: 23,
            rx: 6,
            fill: `${cyan}55`,
            stroke: cyan,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 20,
            y: 468,
            width: 680,
            height: 180,
            rx: 12,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 34,
            y: 548,
            width: fullWeightsWidth,
            height: 11,
            rx: 5,
            fill: `${purple}65`,
            stroke: purple,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: 34,
            y: 598,
            width: activeWeightsWidth,
            height: 11,
            rx: 5,
            fill: `${cyan}65`,
            stroke: cyan,
            strokeWidth: 1,
        }),
        ...mappings.map((_, index) => {
            const row = Math.floor(index / 3)
            const col = index % 3
            return SvgFrame({
                key: `mapping-${index}`,
                c,
                x: 24 + col * 228,
                y: 298 + row * 82,
                width: 216,
                height: 78,
                rx: 9,
                fill: row === 0 ? `${blue}12` : `${cyan}12`,
                stroke: row === 0 ? blue : cyan,
                strokeWidth: 1.3,
            })
        }),
    )

    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapes }),
            label(
                c,
                'A reversible map for active token IDs',
                20,
                12,
                680,
                40,
                38,
                c.textPrimary,
                800,
            ),
            label(
                c,
                'Sorted rows; inverse map decodes sampled IDs.',
                22,
                57,
                676,
                28,
                27,
                muted,
                550,
            ),
            label(c, 'GPT-2 vocabulary · 50,257 IDs', 34, 107, 652, 30, 28, c.textPrimary, 800),
            label(c, '17,485 active · 34.8%', 34, 177, 310, 25, 24, cyan, 750),
            label(c, '32,772 absent in corpus', 364, 177, 320, 25, 24, muted, 650, 'right'),
            label(
                c,
                'Same six BPE pieces · GPT-2 ID → local ID',
                24,
                231,
                672,
                30,
                28,
                c.textPrimary,
                800,
            ),
            ...mappings.flatMap((item, index) => {
                const row = Math.floor(index / 3)
                const col = index % 3
                const x = 24 + col * 228
                const y = 298 + row * 82
                return [
                    label(
                        c,
                        item.piece,
                        x + 8,
                        y + 6,
                        200,
                        31,
                        29,
                        c.textPrimary,
                        750,
                        'center',
                        true,
                    ),
                    label(
                        c,
                        `${item.gpt2} → ${item.local}`,
                        x + 8,
                        y + 46,
                        200,
                        23,
                        24,
                        muted,
                        700,
                        'center',
                        true,
                    ),
                ]
            }),
            label(c, 'Tied embedding/output table · width 96', 34, 480, 652, 30, 28, purple, 800),
            label(
                c,
                '50,257 × 96 = 4,824,672 weights',
                34,
                514,
                652,
                24,
                24,
                c.textPrimary,
                650,
                'left',
                true,
            ),
            label(
                c,
                '17,485 × 96 = 1,678,560 weights',
                34,
                564,
                652,
                24,
                24,
                c.textPrimary,
                650,
                'left',
                true,
            ),
            label(c, '65.2% fewer rows · logits over 17,485 IDs', 34, 616, 652, 24, 24, cyan, 750),
        ],
    })
}

export default create('dark')
