import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 380
export const alt =
    'DeepEP communication topology paths: Direct mode routes tokens directly from Rank 0 (Node A) to Rank 3 (Node B) across cross-node RDMA. Hybrid mode routes from Rank 0 to Rank 2 on Node B over an RDMA rail, then forwards to Rank 3 across high-bandwidth intranode NVLink.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const muted = c.textSecondary

    const drawNode = (
        x: number,
        y: number,
        title: string,
        tone: string,
        topRank: { label: string; role?: string; tone: string; active: boolean },
        botRank: { label: string; role?: string; tone: string; active: boolean },
    ) => {
        const nw = 148
        const nh = 204
        fig.rect(x, y, nw, nh, {
            fill: tint(tone, c.bg, 0.07),
            stroke: tint(tone, c.bg, 0.45),
            strokeWidth: 1.25,
            radius: 10,
        })
        fig.text(x + nw / 2, y + 22, title, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            width: nw - 16,
        })

        const ranks = [
            { r: topRank, ry: y + 46 },
            { r: botRank, ry: y + 132 },
        ]
        for (const { r, ry } of ranks) {
            fig.rect(x + 12, ry, nw - 24, 56, {
                fill: r.active ? tint(r.tone, c.bg, 0.16) : tint(c.textMuted, c.bg, 0.05),
                stroke: r.active ? r.tone : c.borderSubtle,
                strokeWidth: r.active ? 1.75 : 1,
                radius: 7,
            })
            fig.text(x + nw / 2, ry + (r.role ? 19 : 28), r.label, {
                size: 14,
                weight: r.active ? 700 : 500,
                color: r.active ? r.tone : muted,
                align: 'center',
                width: nw - 28,
            })
            if (r.role) {
                fig.text(x + nw / 2, ry + 39, r.role, {
                    size: 12,
                    weight: 600,
                    color: c.textSecondary,
                    align: 'center',
                    width: nw - 28,
                })
            }
        }
    }

    // --- Left Half: Direct Mode ---
    fig.text(24, 24, 'Direct Mode (1-Hop RDMA)', {
        size: 16,
        weight: 700,
        color: cyan,
    })
    fig.text(24, 46, 'Point-to-point cross-node transfer', { size: 13, color: muted })

    const lNodeA = 24
    const lNodeB = 252
    const nodeY = 78

    drawNode(
        lNodeA,
        nodeY,
        'Node A',
        blue,
        { label: 'Rank 0', role: 'Source', tone: cyan, active: true },
        { label: 'Rank 1', tone: muted, active: false },
    )
    drawNode(
        lNodeB,
        nodeY,
        'Node B',
        green,
        { label: 'Rank 2', tone: muted, active: false },
        { label: 'Rank 3', role: 'Target', tone: green, active: true },
    )

    // Direct diagonal RDMA arrow: Rank 0 right edge -> Rank 3 left edge
    fig.arrow(lNodeA + 136, nodeY + 74, lNodeB + 10, nodeY + 160, {
        color: cyan,
        width: 2.5,
        head: 7,
        dash: '6 4',
    })
    fig.text(212, nodeY + 92, 'RDMA', {
        size: 13,
        weight: 700,
        color: cyan,
        align: 'center',
    })
    fig.text(212, nodeY + 184, 'cross-rail', {
        size: 12,
        weight: 500,
        color: muted,
        align: 'center',
    })

    // Compact comparison metrics under Direct
    fig.text(24, 314, '1 hop  ·  direct GPU-to-GPU RDMA', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(24, 338, 'Full cross-rail mesh increases QP count', {
        size: 13,
        color: muted,
    })

    // Subtle vertical divider
    fig.line(420, 18, 420, 360, { color: c.borderSubtle, width: 1 })

    // --- Right Half: Hybrid Mode ---
    const rx = 440
    fig.text(rx, 24, 'Hybrid Mode (Rail RDMA + NVLink)', {
        size: 16,
        weight: 700,
        color: warm,
    })
    fig.text(rx, 46, 'Aligned RDMA rail, then intranode forward', { size: 13, color: muted })

    const rNodeA = 440
    const rNodeB = 668

    drawNode(
        rNodeA,
        nodeY,
        'Node A',
        blue,
        { label: 'Rank 0', role: 'Source', tone: cyan, active: true },
        { label: 'Rank 1', tone: muted, active: false },
    )
    drawNode(
        rNodeB,
        nodeY,
        'Node B',
        green,
        { label: 'Rank 2', role: 'Rail peer', tone: warm, active: true },
        { label: 'Rank 3', role: 'Target', tone: green, active: true },
    )

    // Hop 1: Horizontal RDMA rail Rank 0 -> Rank 2
    fig.arrow(rNodeA + 136, nodeY + 74, rNodeB + 10, nodeY + 74, {
        color: warm,
        width: 2.5,
        head: 7,
        dash: '6 4',
    })
    fig.text(628, nodeY + 54, '1. RDMA rail', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        width: 96,
    })

    // Hop 2: Intranode NVLink Rank 2 -> Rank 3
    fig.arrow(rNodeB + 74, nodeY + 102, rNodeB + 74, nodeY + 130, {
        color: green,
        width: 2.5,
        head: 6,
    })
    fig.text(rNodeB + 86, nodeY + 116, '2. NVLink', {
        size: 12,
        weight: 700,
        color: green,
        align: 'left',
    })

    // Compact comparison metrics under Hybrid
    fig.text(rx, 314, '2 hops  ·  rail-aligned RDMA + fast NVLink', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rx, 338, 'Curbs cross-rail congestion and QP count', {
        size: 13,
        color: muted,
    })

    return fig.render()
}

export default create()
