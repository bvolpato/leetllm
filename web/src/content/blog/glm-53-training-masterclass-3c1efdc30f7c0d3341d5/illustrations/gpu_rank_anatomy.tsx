import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 390
export const alt =
    'A distributed rank process on the CPU launches kernels onto its assigned GPU. Inside the GPU, tensors move between HBM memory and Tensor Cores for matrix multiplication. An NCCL collective exchanges tensor shards across NVLink with peer GPU ranks.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const zoneFill = theme === 'light' ? 0.06 : 0.1
    const boxFill = theme === 'light' ? 0.13 : 0.18

    // Three hardware-tier regions (soft semantic tints, no heavy card shadows)
    const zones = [
        { x: 20, w: 204, title: 'CPU Process', sub: 'Rank 0 / 64', color: blue },
        { x: 266, w: 256, title: 'Blackwell GPU 0', sub: 'Device memory + compute', color: green },
        { x: 564, w: 216, title: 'NVLink Peers', sub: 'NCCL process groups', color: purple },
    ]
    const zoneY = 20
    const zoneH = 296

    for (const z of zones) {
        fig.rect(z.x, zoneY, z.w, zoneH, {
            fill: tint(z.color, c.bg, zoneFill),
            stroke: tint(z.color, c.bg, 0.38),
            strokeWidth: 1.25,
            radius: 12,
        })
        fig.text(z.x + z.w / 2, zoneY + 24, z.title, {
            size: 15.5,
            weight: 700,
            color: z.color,
            align: 'center',
        })
        fig.text(z.x + z.w / 2, zoneY + 45, z.sub, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Helper for internal hardware blocks
    const block = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        color: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(color, c.bg, boxFill),
            stroke: color,
            strokeWidth: 1.5,
            radius: 9,
        })
        fig.text(x + w / 2, y + 24, title, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x + w / 2, y + 48, sub, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Zone 1: CPU
    block(36, 94, 172, 70, 'PyTorch script', 'Selects local GPU 0', blue)
    fig.arrow(122, 168, 122, 212, { color: blue, width: 1.8, head: 7 })
    block(36, 216, 172, 70, 'CUDA launch', 'Async kernel stream', blue)

    // Zone 2: GPU
    block(286, 94, 216, 70, 'HBM3e Memory', 'Weights + activations', green)
    // Bidirectional HBM <-> Tensor Cores transfer arrows
    fig.arrow(372, 168, 372, 212, { color: green, width: 1.8, head: 7 })
    fig.arrow(416, 212, 416, 168, { color: green, width: 1.8, head: 7 })
    fig.text(448, 190, 'Tiles', { size: 12, weight: 600, color: green })

    fig.rect(286, 216, 216, 70, {
        fill: tint(green, c.bg, boxFill),
        stroke: green,
        strokeWidth: 1.6,
        radius: 9,
    })
    fig.text(394, 238, 'Tensor Cores', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.math(394, 264, '\\text{GEMM } C = AB', {
        size: 13.5,
        color: green,
        align: 'center',
    })

    // Zone 3: NVLink Peers
    block(582, 94, 180, 70, 'Ranks 1..7', 'TP8 all-reduce', purple)
    block(582, 216, 180, 70, 'Ranks 0..63', 'EP64 all-to-all', warm)

    // Inter-zone bridges
    // CPU launch -> GPU Tensor Cores
    fig.arrow(226, 251, 282, 251, { color: blue, width: 2, head: 7 })
    fig.text(245, 234, 'PCIe', { size: 11.5, weight: 600, color: blue, align: 'center' })

    // GPU HBM <-> NVLink Peers (branching to TP8 and EP64)
    fig.arrow(506, 129, 578, 129, { color: purple, width: 2, head: 7 })
    fig.arrow(506, 251, 578, 251, { color: warm, width: 2, head: 7 })
    fig.text(543, 112, 'NVLink', { size: 11.5, weight: 600, color: purple, align: 'center' })
    fig.text(543, 234, 'NVLink', { size: 11.5, weight: 600, color: warm, align: 'center' })

    // Bottom stall-diagnosis cues aligned directly beneath each tier
    const stalls = [
        { x: 122, text: 'Stall 1: Python / launch', color: blue },
        { x: 394, text: 'Stall 2: HBM / GEMM tile', color: green },
        { x: 672, text: 'Stall 3: Peer collective wait', color: purple },
    ]
    for (const st of stalls) {
        fig.line(st.x, zoneY + zoneH + 6, st.x, zoneY + zoneH + 22, {
            color: st.color,
            width: 1.3,
            dash: '3 3',
        })
        fig.text(st.x, zoneY + zoneH + 38, st.text, {
            size: 13,
            weight: 600,
            color: st.color,
            align: 'center',
        })
    }

    return fig.render()
}

export default create('dark')
