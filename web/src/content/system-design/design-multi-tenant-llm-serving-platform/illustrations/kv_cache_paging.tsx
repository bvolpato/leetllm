import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 430
export const alt =
    'PagedAttention virtual-to-physical KV block mapping for two tenants sharing 16-token (5 MiB) physical blocks. Tenant A (47 tokens) maps logical blocks L0, L1, L2 to non-contiguous physical pages P0, P2, P4. Tenant B (31 tokens) maps L0, L1 to P1, P3. Each physical page shows its 16 token slots, with 78 of 80 allocated slots filled (97.5 percent efficiency) and only 2 unused slots in the two final blocks.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const soft = (hex: string, la = 0.1, da = 0.16) => tint(hex, c.bg, theme === 'light' ? la : da)
    const rim = (hex: string) => tint(hex, c.bg, theme === 'light' ? 0.45 : 0.55)

    // Column headers
    fig.text(24, 24, '1. LOGICAL SEQUENCES', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 200,
    })
    fig.text(248, 24, '2. BLOCK TABLES', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 150,
    })
    fig.text(460, 24, '3. PHYSICAL VRAM POOL (16 TOK / 5 MiB)', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 340,
    })

    // Physical pages on right (5 rows: P0..P4)
    const phys = [
        { id: 'P0', owner: 'A', used: 16, color: blue, y: 54 },
        { id: 'P1', owner: 'B', used: 16, color: purple, y: 118 },
        { id: 'P2', owner: 'A', used: 16, color: blue, y: 182 },
        { id: 'P3', owner: 'B', used: 15, color: purple, y: 246 },
        { id: 'P4', owner: 'A', used: 15, color: blue, y: 310 },
    ]
    const slotW = 10.5
    const slotGap = 2
    const gridX = 534
    for (const p of phys) {
        fig.rect(460, p.y, 336, 48, {
            fill: soft(p.color, 0.06, 0.1),
            stroke: rim(p.color),
            strokeWidth: 1.25,
            radius: 7,
        })
        fig.text(472, p.y + 16, p.id, {
            size: 14,
            color: p.color,
            weight: 700,
            mono: true,
            width: 36,
        })
        fig.text(472, p.y + 34, `Tenant ${p.owner}`, {
            size: 11,
            color: c.textSecondary,
            width: 54,
        })
        // 16 individual token slot cells
        for (let s = 0; s < 16; s++) {
            const sx = gridX + s * (slotW + slotGap)
            const filled = s < p.used
            fig.rect(sx, p.y + 13, slotW, 22, {
                fill: filled ? p.color : c.bg,
                stroke: filled ? 'none' : rim(p.color),
                strokeWidth: filled ? 0 : 1,
                opacity: filled ? 0.85 : 1,
                radius: 2.5,
            })
        }
        fig.text(786, p.y + 24, `${p.used}/16`, {
            size: 12,
            color: p.used === 16 ? green : p.color,
            align: 'right',
            weight: 700,
            mono: true,
            width: 46,
        })
    }

    // Tenant A logical sequence & block table (top-left)
    fig.text(24, 62, 'Tenant A · 47 tokens', { size: 14, color: blue, weight: 700, width: 185 })
    const blocksA = [
        { lbl: 'L0', range: 'tok 1..16', targetIdx: 0 },
        { lbl: 'L1', range: 'tok 17..32', targetIdx: 2 },
        { lbl: 'L2', range: 'tok 33..47 (15)', targetIdx: 4 },
    ]
    blocksA.forEach((b, i) => {
        const y = 80 + i * 38
        fig.rect(24, y, 184, 30, {
            fill: soft(blue, 0.1, 0.16),
            stroke: rim(blue),
            strokeWidth: 1.2,
            radius: 5,
        })
        fig.text(34, y + 15, `${b.lbl}: ${b.range}`, {
            size: 12,
            color: c.textPrimary,
            mono: true,
            weight: 600,
            width: 168,
        })
        fig.arrow(208, y + 15, 246, y + 15, { color: blue, width: 1.4, head: 5 })

        // Block table entry
        fig.rect(248, y, 134, 30, {
            fill: c.bg,
            stroke: rim(blue),
            strokeWidth: 1.2,
            radius: 5,
        })
        const target = phys[b.targetIdx]!
        fig.text(315, y + 15, `${b.lbl} -> ${target.id}`, {
            size: 13,
            color: blue,
            align: 'center',
            mono: true,
            weight: 700,
            width: 120,
        })

        // Smooth cubic connector to physical page
        const ty = target.y + 24
        fig.path(`M382 ${y + 15}C422 ${y + 15},420 ${ty},456 ${ty}`, {
            color: blue,
            width: 1.6,
            opacity: 0.85,
        })
        fig.circle(458, ty, 3.5, { fill: blue })
    })

    // Tenant B logical sequence & block table (bottom-left)
    fig.text(24, 224, 'Tenant B · 31 tokens', { size: 14, color: purple, weight: 700, width: 185 })
    const blocksB = [
        { lbl: 'L0', range: 'tok 1..16', targetIdx: 1 },
        { lbl: 'L1', range: 'tok 17..31 (15)', targetIdx: 3 },
    ]
    blocksB.forEach((b, i) => {
        const y = 242 + i * 38
        fig.rect(24, y, 184, 30, {
            fill: soft(purple, 0.1, 0.16),
            stroke: rim(purple),
            strokeWidth: 1.2,
            radius: 5,
        })
        fig.text(34, y + 15, `${b.lbl}: ${b.range}`, {
            size: 12,
            color: c.textPrimary,
            mono: true,
            weight: 600,
            width: 168,
        })
        fig.arrow(208, y + 15, 246, y + 15, { color: purple, width: 1.4, head: 5 })

        fig.rect(248, y, 134, 30, {
            fill: c.bg,
            stroke: rim(purple),
            strokeWidth: 1.2,
            radius: 5,
        })
        const target = phys[b.targetIdx]!
        fig.text(315, y + 15, `${b.lbl} -> ${target.id}`, {
            size: 13,
            color: purple,
            align: 'center',
            mono: true,
            weight: 700,
            width: 120,
        })

        const ty = target.y + 24
        fig.path(`M382 ${y + 15}C426 ${y + 15},418 ${ty},456 ${ty}`, {
            color: purple,
            width: 1.6,
            opacity: 0.85,
        })
        fig.circle(458, ty, 3.5, { fill: purple })
    })

    // Bottom frameless metric summary line
    fig.line(24, 378, 796, 378, { color: c.borderSubtle, width: 1 })
    fig.text(24, 400, '78 / 80 slots occupied (97.5%)', {
        size: 13,
        color: green,
        weight: 700,
        width: 240,
    })
    fig.text(300, 400, '2 unused slots (final blocks only)', {
        size: 13,
        color: c.textSecondary,
        width: 250,
    })
    fig.text(796, 400, '0.3125 MiB/tok · 5 MiB/block', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
        mono: true,
        width: 240,
    })

    return fig.render()
}
