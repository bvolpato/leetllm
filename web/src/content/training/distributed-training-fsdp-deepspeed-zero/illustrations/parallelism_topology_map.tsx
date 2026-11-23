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

type Colors = ReturnType<typeof getThemeColors>

export const width = 900
export const height = 540

export const alt =
    'One authored sequence replica uses two nodes as PP stages. Each node has eight GPUs arranged as CP rows 0 and 1 by TP columns 0 through 3: 16 ranks per replica. The PP boundary sends activations forward and gradients backward. Repeat this replica eight times for DP=8, giving DP×TP×PP×CP=8×4×2×2=128 ranks. With one sequence per micro-batch and four accumulated micro-batches, the global sequence batch is 1×4×8=32; CP splits sequence tokens rather than adding examples.'

function label(
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

function gpuCard(c: Colors, x: number, y: number, id: number, color: string) {
    return [
        SvgFrame({
            c,
            x,
            y,
            width: 44,
            height: 38,
            rx: 4,
            fill: c.bgCardAlt,
            stroke: color,
            strokeWidth: 1.5,
            key: `gpu-box-${id}`,
        }),
    ]
}

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const node0X = 40
    const node1X = 295
    const nodeY = 120
    const nodeW = 225
    const nodeH = 175

    // Build 8 GPUs for Node 0 (Stage 0)
    const node0Gpus = [
        ...[0, 1, 2, 3].map((col) => gpuCard(c, node0X + 20 + col * 48, nodeY + 50, col, blue)),
        ...[0, 1, 2, 3].map((col) =>
            gpuCard(c, node0X + 20 + col * 48, nodeY + 105, col + 4, blue),
        ),
    ].flat()

    // Build 8 GPUs for Node 1 (Stage 1)
    const node1Gpus = [
        ...[0, 1, 2, 3].map((col) =>
            gpuCard(c, node1X + 20 + col * 48, nodeY + 50, col + 8, purple),
        ),
        ...[0, 1, 2, 3].map((col) =>
            gpuCard(c, node1X + 20 + col * 48, nodeY + 105, col + 12, purple),
        ),
    ].flat()

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Left Panel (16-GPU Sequence Replica)
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 520,
            height: 430,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        // Right Panel (Topology Hierarchy & Batches)
        SvgFrame({
            c,
            x: 560,
            y: 50,
            width: 320,
            height: 430,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),

        // Node 0 Box
        SvgFrame({
            c,
            x: node0X,
            y: nodeY,
            width: nodeW,
            height: nodeH,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: blue,
            strokeWidth: 1.5,
            key: 'node-0',
        }),
        // Node 1 Box
        SvgFrame({
            c,
            x: node1X,
            y: nodeY,
            width: nodeW,
            height: nodeH,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: purple,
            strokeWidth: 1.5,
            key: 'node-1',
        }),

        ...node0Gpus,
        ...node1Gpus,

        // Pipeline Interconnect Arrows between Node 0 and Node 1
        VectorArrow({
            x1: node0X + nodeW + 4,
            y1: nodeY + 70,
            x2: node1X - 4,
            y2: nodeY + 70,
            color: cyan,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        VectorArrow({
            x1: node1X - 4,
            y1: nodeY + 120,
            x2: node0X + nodeW + 4,
            y2: nodeY + 120,
            color: warm,
            strokeWidth: 2,
            arrowSize: 6,
        }),

        // Callout card in left panel
        SvgFrame({
            c,
            x: 35,
            y: 315,
            width: 490,
            height: 145,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-details',
        }),

        // 4D Topology Card in right panel
        SvgFrame({
            c,
            x: 580,
            y: 110,
            width: 280,
            height: 95,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: cyan,
            strokeWidth: 1.5,
            key: 'card-formula',
        }),

        // Network Bandwidth Hierarchy Card
        SvgFrame({
            c,
            x: 580,
            y: 220,
            width: 280,
            height: 240,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-network',
        }),
    )

    // GPU id labels
    const gpuLabels = [
        ...Array.from({ length: 8 }, (_, i) => {
            const col = i % 4
            const row = Math.floor(i / 4)
            return label(
                c,
                `g${i}`,
                node0X + 20 + col * 48,
                nodeY + 60 + row * 55,
                44,
                18,
                11,
                blue,
                650,
                'center',
            )
        }),
        ...Array.from({ length: 8 }, (_, i) => {
            const col = i % 4
            const row = Math.floor(i / 4)
            return label(
                c,
                `g${i + 8}`,
                node1X + 20 + col * 48,
                nodeY + 60 + row * 55,
                44,
                18,
                11,
                purple,
                650,
                'center',
            )
        }),
    ]

    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapeSvg }),
            label(
                c,
                '4D Parallelism Topology: 128 GPUs Across Cluster Hierarchy',
                20,
                12,
                width - 40,
                30,
                22,
                c.textPrimary,
                700,
                'center',
            ),

            // Left Panel
            label(
                c,
                '1. Single Model Replica: 16 GPUs (PP=2, TP=4, CP=2)',
                35,
                62,
                490,
                24,
                16,
                c.textPrimary,
            ),
            label(
                c,
                'Two nodes form pipeline stages; TP and CP divide layers and tokens internally',
                35,
                86,
                490,
                20,
                12,
                muted,
            ),

            label(
                c,
                'Node 0 (PP Stage 0 · Layers 0–39)',
                node0X,
                nodeY + 12,
                nodeW,
                20,
                13,
                blue,
                650,
                'center',
            ),
            label(
                c,
                'Node 1 (PP Stage 1 · Layers 40–79)',
                node1X,
                nodeY + 12,
                nodeW,
                20,
                13,
                purple,
                650,
                'center',
            ),

            label(c, 'Act →', node0X + nodeW + 2, nodeY + 52, 26, 16, 9, cyan, 650, 'center'),
            label(c, '← Grad', node0X + nodeW + 2, nodeY + 102, 26, 16, 9, warm, 650, 'center'),

            ...gpuLabels,

            label(c, 'Replica Parallelism Breakdown:', 50, 325, 460, 20, 13, c.textPrimary),
            label(
                c,
                '• TP = 4: Partitions attention heads & FFN projections across columns (NVLink)',
                50,
                350,
                460,
                18,
                11,
                blue,
            ),
            label(
                c,
                '• CP = 2: Splits sequence context across rows using ring-attention communication',
                50,
                372,
                460,
                18,
                11,
                cyan,
            ),
            label(
                c,
                '• PP = 2: Streams microbatches across nodes, transferring activations & gradients',
                50,
                394,
                460,
                18,
                11,
                purple,
            ),
            label(
                c,
                'Each sequence replica processes 1 sequence; CP increases context length, not batch size.',
                50,
                422,
                460,
                20,
                11,
                muted,
            ),

            // Right Panel
            label(c, '2. 4D Scaling Dimensions', 575, 62, 290, 24, 16, c.textPrimary),
            label(c, 'Cluster size and communication tiers', 575, 86, 290, 20, 12, muted),

            label(c, 'Total GPU Ranks Formula', 595, 118, 250, 20, 13, c.textPrimary),
            label(
                c,
                'DP × TP × PP × CP = 8 × 4 × 2 × 2 = 128',
                595,
                142,
                250,
                22,
                12,
                cyan,
                650,
                'center',
            ),
            label(
                c,
                '8 replicas × 16 GPUs/replica = 128 GPUs',
                595,
                170,
                250,
                18,
                11,
                muted,
                650,
                'center',
            ),

            label(c, 'Interconnect Bandwidth Hierarchy', 595, 230, 250, 20, 13, c.textPrimary),
            label(c, '1. TP (Intra-Node NVLink): ~900 GB/s', 595, 256, 250, 18, 11, blue),
            label(c, '   Fastest tier; all-reduce on every layer', 595, 274, 250, 16, 10, muted),
            label(c, '2. CP (Intra-Node / High-Speed): ~400 GB/s', 595, 298, 250, 18, 11, cyan),
            label(c, '   Ring attention for 32k+ context sequences', 595, 316, 250, 16, 10, muted),
            label(c, '3. PP (Inter-Node InfiniBand): ~400 Gb/s', 595, 340, 250, 18, 11, purple),
            label(c, '   Point-to-point boundary tensor transfers', 595, 358, 250, 16, 10, muted),
            label(c, '4. DP (Cluster InfiniBand / RoCE): ~400 Gb/s', 595, 382, 250, 18, 11, warm),
            label(c, '   Gradient reduce-scatter across 8 replicas', 595, 400, 250, 16, 10, muted),
            label(
                c,
                'Global batch: 1 seq × 4 accum × 8 DP = 32 seqs',
                595,
                428,
                250,
                18,
                11,
                c.textPrimary,
            ),

            label(
                c,
                '4D parallelism topology · Matching communication frequency to physical interconnect bandwidth',
                20,
                490,
                width - 40,
                24,
                14,
                muted,
                650,
                'center',
            ),
        ],
    })
}

export default create('dark')
