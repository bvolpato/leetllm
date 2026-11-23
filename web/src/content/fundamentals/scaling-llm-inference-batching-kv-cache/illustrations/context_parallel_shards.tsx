import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneColor,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 865
export const alt =
    'A hypothetical one-million-token request with Llama 3 70B dimensions has 305.2 GiB of raw KV, or 76.3 GiB on each of four equal sequence shards; each device also needs unquantified weights and buffers. During one prefill Ring Attention approach, K/V blocks rotate between sequence shards. During decode, shard-local partial attention states combine into one result; the figure does not imply every decode circulates all KV. The lower axis diagrams distinguish context parallelism across tokens, tensor parallelism within a layer, and pipeline parallelism across layer depth. Sharding does not extend supported context.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 750,
) {
    const content = createElement(
        'div',
        {
            style: {
                display: 'flex',
                width,
                height,
                alignItems: 'center',
                justifyContent:
                    align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
            },
        },
        TextLabel({ c, text, width, fontSize, fontWeight, color, align }),
    )
    return CanvasItem({ x, y, width, height, children: content })
}

function rectangle(
    c: Colors,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    stroke: string,
    strokeWidth = 2,
) {
    return CanvasItem({
        x,
        y,
        width,
        height,
        children: createElement('div', {
            style: {
                boxSizing: 'border-box',
                width,
                height,
                backgroundColor: fill === 'none' ? 'transparent' : fill,
                border: `${strokeWidth}px solid ${stroke === 'none' ? 'transparent' : stroke}`,
            },
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const gpuTones = [
        getToneColor('blue', c),
        getToneColor('purple', c),
        getToneColor('green', c),
        getToneColor('warm', c),
    ]
    const gpuLabelTones = gpuTones.map((tone, index) =>
        index === 3 ? getReadableToneColor('warm', c) : tone,
    )
    const arrowY = height - 366
    const arrowLayer = AxisPlot({
        c,
        width,
        height,
        xMin: 0,
        xMax: width,
        yMin: 0,
        yMax: height,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        gridCount: 0,
        vectors: [
            {
                x1: 420,
                y1: arrowY,
                x2: 470,
                y2: arrowY,
                color: gpuTones[0],
                strokeWidth: 5,
                arrow: true,
                arrowSize: 8,
            },
            {
                x1: 640,
                y1: arrowY,
                x2: 690,
                y2: arrowY,
                color: gpuTones[1],
                strokeWidth: 5,
                arrow: true,
                arrowSize: 8,
            },
            {
                x1: 860,
                y1: arrowY,
                x2: 910,
                y2: arrowY,
                color: gpuTones[2],
                strokeWidth: 5,
                arrow: true,
                arrowSize: 8,
            },
        ],
    })
    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: arrowLayer }),
        label(c, 'Context parallelism splits one long sequence', 36, 16, 1128, 52, 46),
        label(
            c,
            '1M-token extrapolation · beyond trained context',
            36,
            70,
            1128,
            40,
            38,
            c.textSecondary,
        ),
        label(
            c,
            '305.2 GiB KV ÷ 4 shards = 76.3 GiB/device',
            36,
            110,
            1128,
            40,
            38,
            c.textSecondary,
        ),
        ...gpuTones.flatMap((tone, index) => {
            const x = 40 + index * 282
            return [
                rectangle(c, x, 158, 270, 76, c.bgCard, tone, 4),
                label(c, `GPU ${index}`, x, 160, 270, 38, 44, gpuLabelTones[index], 'center', 850),
                label(c, '250K tokens', x, 198, 270, 34, 38, c.textPrimary, 'center', 750),
            ]
        }),
        label(
            c,
            'KV only · device weights and buffers are extra',
            36,
            240,
            1128,
            36,
            38,
            c.textSecondary,
        ),
        label(
            c,
            'Prefill · one Ring Attention K/V rotation',
            36,
            282,
            1128,
            46,
            44,
            gpuLabelTones[0],
        ),
        ...gpuTones.flatMap((tone, index) => {
            const x = 250 + index * 220
            return [
                rectangle(c, x, 342, 170, 56, c.bgCard, tone, 4),
                label(c, 'K/V', x, 344, 170, 52, 40, gpuLabelTones[index], 'center', 800),
            ]
        }),
        label(
            c,
            'K/V rotates across shards during prefill.',
            36,
            402,
            1128,
            38,
            38,
            c.textSecondary,
        ),
        label(
            c,
            'Decode · merge shard-local partial attention',
            36,
            444,
            1128,
            46,
            44,
            gpuLabelTones[1],
        ),
        ...['s₀', 's₁', 's₂', 's₃'].flatMap((state, index) => {
            const x = 46 + index * 166
            return [
                rectangle(c, x, 500, 116, 58, c.bgCard, gpuTones[index], 4),
                label(c, state, x, 502, 116, 54, 48, gpuLabelTones[index], 'center', 850),
                ...(index < 3
                    ? [label(c, '+', x + 120, 502, 42, 54, 44, c.textSecondary, 'center', 800)]
                    : []),
            ]
        }),
        label(c, '→', 720, 502, 52, 54, 48, c.textSecondary, 'center', 800),
        rectangle(c, 784, 500, 330, 58, c.bgCard, gpuTones[1], 4),
        label(c, 'merged', 784, 502, 330, 54, 42, gpuLabelTones[1], 'center', 850),
        label(c, 'Decode need not circulate all KV.', 36, 562, 1128, 38, 38, c.textSecondary),
        label(c, 'Parallelism: three split axes', 36, 602, 1128, 44, 44),
        label(c, 'CP · tokens', 40, 650, 340, 40, 40, gpuLabelTones[0], 'center'),
        label(c, 'TP · one layer', 430, 650, 340, 40, 40, gpuLabelTones[1], 'center'),
        label(c, 'PP · layers', 820, 650, 340, 40, 40, gpuLabelTones[2], 'center'),
        ...Array.from({ length: 3 }, (_, row) =>
            gpuTones.flatMap((tone, column) =>
                rectangle(c, 72 + column * 68, 698 + row * 18, 60, 14, tone, c.bgCard, 2),
            ),
        ),
        ...gpuTones.map((tone, index) =>
            rectangle(c, 482 + index * 68, 706, 60, 38, tone, c.bgCard, 2),
        ),
        ...gpuTones.map((tone, index) =>
            rectangle(c, 852, 694 + index * 14, 256, 10, tone, c.bgCard, 1),
        ),
        label(c, 'CP does not extend trained context.', 36, 758, 1128, 40, 40, c.textSecondary),
    ]

    return Board({ c, width, height, children })
}

export default create('dark')
