import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    withColorAlpha,
    type ThemeMode,
} from 'vizmatic'

type Colors = ReturnType<typeof getThemeColors>

export const width = 760
export const height = 510

export const alt =
    'A 128-GPU 4D parallelism mesh (DP=8, TP=4, PP=2, CP=2). One 16-GPU sequence replica spans two 8-GPU nodes as pipeline stages PP 0 and PP 1, passing activations forward and gradients backward across InfiniBand. Inside each node, 4 TP columns communicate over NVLink and 2 CP rows split sequence tokens via Ring Attention. Repeating this 16-GPU replica 8 times for DP yields 128 GPUs and 32 global sequences (1 microbatch x 4 accumulation x 8 DP).'

function lbl(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 650,
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

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const node0X = 16
    const node1X = 444
    const nodeY = 48
    const nodeW = 300
    const nodeH = 228

    const gpuGrid = (baseX: number, offset: number, color: string) =>
        Array.from({ length: 8 }, (_, i) => {
            const col = i % 4
            const row = Math.floor(i / 4)
            return SvgFrame({
                c,
                key: `gpu-${offset + i}`,
                x: baseX + 58 + col * 58,
                y: nodeY + 80 + row * 56,
                width: 50,
                height: 44,
                rx: 6,
                fill: withColorAlpha(color, 0.14),
                stroke: color,
                strokeWidth: 1.6,
            })
        })

    const gpuLabels = (baseX: number, offset: number, color: string) =>
        Array.from({ length: 8 }, (_, i) => {
            const col = i % 4
            const row = Math.floor(i / 4)
            return lbl(
                c,
                `g${offset + i}`,
                baseX + 58 + col * 58,
                nodeY + 91 + row * 56,
                50,
                22,
                16,
                color,
                700,
                'center',
                true,
            )
        })

    // 8 DP replica blocks along the bottom
    const dpBlocks = Array.from({ length: 8 }, (_, i) =>
        SvgFrame({
            c,
            key: `dp-${i}`,
            x: 34 + i * 88,
            y: 344,
            width: 78,
            height: 52,
            rx: 7,
            fill: i === 0 ? withColorAlpha(cyan, 0.2) : c.bgSubtle,
            stroke: i === 0 ? cyan : c.borderSubtle,
            strokeWidth: i === 0 ? 2 : 1.3,
        }),
    )

    const shapeSvg = createElement(
        'svg',
        { width, height, viewBox: `0 0 ${width} ${height}`, role: 'presentation', 'aria-hidden': true },
        // Node 0
        SvgFrame({
            c,
            key: 'node0',
            x: node0X,
            y: nodeY,
            width: nodeW,
            height: nodeH,
            rx: 10,
            fill: c.bgCard,
            stroke: blue,
            strokeWidth: 1.7,
        }),
        // Node 1
        SvgFrame({
            c,
            key: 'node1',
            x: node1X,
            y: nodeY,
            width: nodeW,
            height: nodeH,
            rx: 10,
            fill: c.bgCard,
            stroke: purple,
            strokeWidth: 1.7,
        }),
        ...gpuGrid(node0X, 0, blue),
        ...gpuGrid(node1X, 8, purple),

        // PP boundary arrows (center gap x=316..444)
        VectorArrow({ x1: 326, y1: 146, x2: 434, y2: 146, color: cyan, strokeWidth: 2.4, arrowSize: 6 }),
        VectorArrow({ x1: 434, y1: 204, x2: 326, y2: 204, color: warm, strokeWidth: 2.4, arrowSize: 6 }),

        // Bottom DP panel
        SvgFrame({
            c,
            key: 'dp-panel',
            x: 16,
            y: 300,
            width: 728,
            height: 196,
            rx: 10,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
        }),
        ...dpBlocks,
    )

    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapeSvg }),

            // Top title
            lbl(c, '1 · Single 16-GPU Replica (PP=2, TP=4, CP=2)', 16, 14, 728, 24, 17, c.textPrimary, 800),

            // Node headers
            lbl(c, 'Node 0 · PP 0 (L0–39)', node0X + 10, nodeY + 12, nodeW - 20, 24, 17, blue, 800, 'center'),
            lbl(c, 'Node 1 · PP 1 (L40–79)', node1X + 10, nodeY + 12, nodeW - 20, 24, 17, purple, 800, 'center'),

            // TP column header
            lbl(c, 'TP = 4 (NVLink)', node0X + 58, nodeY + 46, 224, 22, 16, muted, 700, 'center'),
            lbl(c, 'TP = 4 (NVLink)', node1X + 58, nodeY + 46, 224, 22, 16, muted, 700, 'center'),

            // CP row labels
            lbl(c, 'CP0', node0X + 10, nodeY + 91, 44, 22, 16, cyan, 700, 'center', true),
            lbl(c, 'CP1', node0X + 10, nodeY + 147, 44, 22, 16, cyan, 700, 'center', true),
            lbl(c, 'CP0', node1X + 10, nodeY + 91, 44, 22, 16, cyan, 700, 'center', true),
            lbl(c, 'CP1', node1X + 10, nodeY + 147, 44, 22, 16, cyan, 700, 'center', true),

            ...gpuLabels(node0X, 0, blue),
            ...gpuLabels(node1X, 8, purple),

            // Node footers
            lbl(c, 'Ring Attn across CP rows', node0X + 10, nodeY + 194, nodeW - 20, 22, 16, muted, 600, 'center'),
            lbl(c, 'Ring Attn across CP rows', node1X + 10, nodeY + 194, nodeW - 20, 22, 16, muted, 600, 'center'),

            // PP arrow labels
            lbl(c, 'Act →', 322, 114, 116, 22, 16, cyan, 800, 'center'),
            lbl(c, '← Grad', 322, 214, 116, 22, 16, warm, 800, 'center'),
            lbl(c, 'PP (IB)', 322, 164, 116, 22, 16, muted, 700, 'center'),

            // Bottom DP panel labels
            lbl(c, '2 · Replicate × 8 Data-Parallel (DP) Groups = 128 GPUs', 34, 312, 690, 24, 17, c.textPrimary, 800),
            ...Array.from({ length: 8 }, (_, i) =>
                lbl(
                    c,
                    `DP ${i}`,
                    34 + i * 88,
                    359,
                    78,
                    22,
                    16,
                    i === 0 ? cyan : c.textPrimary,
                    700,
                    'center',
                    true,
                ),
            ),

            // Equations
            lbl(
                c,
                'World = DP(8) × TP(4) × PP(2) × CP(2) = 128 GPUs',
                34,
                416,
                690,
                24,
                16,
                cyan,
                700,
                'center',
                true,
            ),
            lbl(
                c,
                'Global batch = B_micro(1) × m(4) × DP(8) = 32 seqs',
                34,
                452,
                690,
                24,
                16,
                green,
                700,
                'center',
                true,
            ),
        ],
    })
}

export default create('dark')
