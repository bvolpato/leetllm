import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 435
export const alt =
    'Concentric multi-tenant runtime security strata paired with a packing-density vs blast-radius trade-off scale. From innermost to outermost: Tier 1 Shared Process (logical queues and KV block tables), Tier 2 Separate Containers (OS address spaces and cgroups), Tier 3 NVIDIA MIG GPU Instances (hardware-sliced VRAM and SMs), and Tier 4 Dedicated VMs or Node Pools (hypervisor and physical host). Moving outward shrinks the tenant blast radius while reducing GPU packing density.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const soft = (hex: string, la = 0.08, da = 0.13) => tint(hex, c.bg, theme === 'light' ? la : da)
    const rim = (hex: string) => tint(hex, c.bg, theme === 'light' ? 0.52 : 0.62)

    // Left: Concentric Security Boundary Strata (x = 24..512, y = 24..410)
    fig.text(24, 24, 'CONCENTRIC ISOLATION PERIMETERS', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 300,
    })

    const strata = [
        {
            x: 24,
            y: 44,
            w: 492,
            h: 366,
            r: 14,
            color: green,
            title: '4. Dedicated VM / Node',
            adds: 'Hypervisor & physical GPU',
            shared: 'Shares: control plane & network only',
        },
        {
            x: 40,
            y: 96,
            w: 460,
            h: 296,
            r: 12,
            color: warm,
            title: '3. NVIDIA MIG Instances',
            adds: 'Hardware VRAM & SM slices',
            shared: 'Shares: host OS, driver, PCIe',
        },
        {
            x: 56,
            y: 148,
            w: 428,
            h: 226,
            r: 10,
            color: purple,
            title: '2. Containers / Processes',
            adds: 'OS address space & cgroups',
            shared: 'Shares: host kernel & GPU driver',
        },
        {
            x: 72,
            y: 200,
            w: 396,
            h: 156,
            r: 8,
            color: blue,
            title: '1. Shared Process',
            adds: 'Logical queues & KV tables',
            shared: 'Shares: process memory & kernels',
        },
    ]

    for (const s of strata) {
        fig.rect(s.x, s.y, s.w, s.h, {
            fill: soft(s.color, 0.08, 0.13),
            stroke: rim(s.color),
            strokeWidth: 1.6,
            radius: s.r,
        })
        fig.text(s.x + 14, s.y + 20, s.title, {
            size: 13,
            color: s.color,
            weight: 700,
            width: 195,
        })
        fig.text(s.x + s.w - 14, s.y + 20, s.adds, {
            size: 12,
            color: c.textSecondary,
            align: 'right',
            width: 200,
        })
    }

    // Innermost tenant execution lanes inside Tier 1
    fig.rect(96, 240, 162, 66, {
        fill: c.bg,
        stroke: rim(blue),
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text(177, 262, 'Tenant A', {
        size: 14,
        color: blue,
        align: 'center',
        weight: 700,
        width: 140,
    })
    fig.text(177, 286, 'KV table · LoRA · salt', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 150,
    })

    fig.rect(276, 240, 162, 66, {
        fill: c.bg,
        stroke: rim(purple),
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text(357, 262, 'Tenant B', {
        size: 14,
        color: purple,
        align: 'center',
        weight: 700,
        width: 140,
    })
    fig.text(357, 286, 'KV table · LoRA · salt', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 150,
    })

    fig.line(267, 244, 267, 302, { color: c.textMuted, width: 1.2, dash: '3 3' })
    fig.text(267, 330, 'Logical isolation inside shared engine', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 310,
    })

    // Right: Quantitative Trade-off Spectrum (Density vs Blast Radius)
    fig.line(534, 24, 534, 410, { color: c.borderSubtle, width: 1 })
    fig.text(554, 24, 'DENSITY VS. BLAST RADIUS', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 240,
    })

    const metrics = [
        {
            label: '4. Dedicated VM / Node',
            shared: 'Shares: network & control plane',
            density: 0.25,
            isolation: 1.0,
            color: green,
            y: 54,
        },
        {
            label: '3. MIG GPU Instance',
            shared: 'Shares: host OS & PCIe',
            density: 0.55,
            isolation: 0.78,
            color: warm,
            y: 142,
        },
        {
            label: '2. Container / Process',
            shared: 'Shares: kernel & GPU driver',
            density: 0.8,
            isolation: 0.5,
            color: purple,
            y: 230,
        },
        {
            label: '1. Shared Process',
            shared: 'Shares: process memory & GPU',
            density: 1.0,
            isolation: 0.22,
            color: blue,
            y: 318,
        },
    ]

    const barX = 638
    const barMax = 158
    for (const m of metrics) {
        fig.text(554, m.y + 8, m.label, {
            size: 13,
            color: m.color,
            weight: 700,
            width: 242,
        })
        fig.text(554, m.y + 27, m.shared, {
            size: 11,
            color: c.textSecondary,
            width: 242,
        })

        // Packing density bar
        fig.text(630, m.y + 49, 'Density', {
            size: 12,
            color: c.textSecondary,
            align: 'right',
            width: 76,
        })
        fig.rect(barX, m.y + 43, barMax, 11, {
            fill: soft(c.textMuted, 0.1, 0.14),
            radius: 4,
        })
        fig.rect(barX, m.y + 43, Math.round(m.density * barMax), 11, {
            fill: m.color,
            radius: 4,
        })

        // Boundary strength bar
        fig.text(630, m.y + 67, 'Isolation', {
            size: 12,
            color: c.textSecondary,
            align: 'right',
            width: 76,
        })
        fig.rect(barX, m.y + 61, barMax, 11, {
            fill: soft(c.textMuted, 0.1, 0.14),
            radius: 4,
        })
        fig.rect(barX, m.y + 61, Math.round(m.isolation * barMax), 11, {
            fill: m.color,
            opacity: 0.55,
            radius: 4,
        })
    }

    return fig.render()
}
