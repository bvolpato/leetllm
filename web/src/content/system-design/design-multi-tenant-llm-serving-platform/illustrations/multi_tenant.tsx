import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 430
export const alt =
    'Multi-tenant LLM serving platform architecture separating the control plane (policy grants, adapter registry, worker membership) from the data plane. Incoming requests from Tenant A and Tenant B pass through an authenticating gateway that enforces workspace grants and reserves quotas before dispatching signed envelopes to GPU workers. Workers enforce a second access check and share one frozen 72B BF16 base model (144 GB vs 14.4 TB for 100 dedicated copies, saving 99 percent VRAM) while isolating per-tenant KV pages, dynamic LoRA adapters, and metering.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const soft = (hex: string, lightA = 0.09, darkA = 0.14) =>
        tint(hex, c.bg, theme === 'light' ? lightA : darkA)
    const rim = (hex: string) => tint(hex, c.bg, theme === 'light' ? 0.45 : 0.52)

    // Top band: Control Plane
    fig.rect(24, 20, 772, 68, {
        fill: soft(warm, 0.07, 0.11),
        stroke: rim(warm),
        strokeWidth: 1.25,
        radius: 8,
    })
    fig.text(40, 38, 'CONTROL PLANE', { size: 12, color: warm, weight: 700, width: 160 })
    const ctrlItems = [
        { x: 185, w: 175, label: 'Policy & Grants' },
        { x: 382, w: 185, label: 'Adapter Registry' },
        { x: 589, w: 190, label: 'Worker Membership' },
    ]
    for (const item of ctrlItems) {
        fig.rect(item.x, 34, item.w, 38, {
            fill: c.bg,
            stroke: rim(warm),
            strokeWidth: 1,
            radius: 6,
        })
        fig.text(item.x + item.w / 2, 53, item.label, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
            weight: 600,
            width: item.w - 12,
        })
    }

    // Dashed control-plane sync arrows downward
    fig.arrow(265, 88, 265, 130, { color: warm, width: 1.4, dash: '4 3', head: 6 })
    fig.arrow(595, 88, 595, 130, { color: warm, width: 1.4, dash: '4 3', head: 6 })
    fig.text(275, 108, 'Grants & limits', { size: 12, color: c.textSecondary, width: 120 })
    fig.text(605, 108, 'Approved revisions', { size: 12, color: c.textSecondary, width: 140 })

    // Data plane section label
    fig.text(24, 114, 'DATA PLANE', { size: 12, color: c.textSecondary, weight: 700, width: 120 })

    // Left: Tenant callers
    const callers = [
        { y: 174, label: 'Tenant A', sub: '12k tok review', color: blue },
        { y: 294, label: 'Tenant B', sub: '40 tok summary', color: purple },
    ]
    for (const caller of callers) {
        fig.rect(24, caller.y, 118, 66, {
            fill: soft(caller.color),
            stroke: rim(caller.color),
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(83, caller.y + 23, caller.label, {
            size: 14,
            color: caller.color,
            align: 'center',
            weight: 700,
            width: 110,
        })
        fig.text(83, caller.y + 45, caller.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            width: 110,
        })
        fig.arrow(142, caller.y + 33, 180, caller.y + 33, {
            color: caller.color,
            width: 1.8,
            head: 6,
        })
    }

    // Middle: Gateway perimeter
    fig.rect(182, 132, 168, 268, {
        fill: soft(green, 0.06, 0.1),
        stroke: rim(green),
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(266, 152, 'API GATEWAY', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
        width: 150,
    })
    const gwSteps = [
        { y: 176, title: '1. Auth & Grants', sub: 'Verify workspace' },
        { y: 242, title: '2. Quota & Pages', sub: 'Atomic reserve' },
        { y: 308, title: '3. Signed Context', sub: 'Pinned revisions' },
    ]
    for (const s of gwSteps) {
        fig.rect(194, s.y, 144, 52, {
            fill: c.bg,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 6,
        })
        fig.text(266, s.y + 18, s.title, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
            weight: 600,
            width: 136,
        })
        fig.text(266, s.y + 37, s.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            width: 136,
        })
    }

    // Signed envelope arrow from Gateway to Worker
    fig.arrow(350, 266, 404, 266, { color: green, width: 2, head: 6 })
    fig.text(377, 244, 'Signed', {
        size: 12,
        color: green,
        align: 'center',
        weight: 600,
        width: 58,
    })
    fig.text(377, 286, 'envelope', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 60,
    })

    // Right: GPU Worker Pool
    fig.rect(406, 132, 390, 268, {
        fill: soft(blue, 0.04, 0.07),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(422, 152, 'GPU WORKER (CONTINUOUS BATCHING)', {
        size: 12,
        color: c.textPrimary,
        weight: 700,
        width: 245,
    })
    fig.rect(666, 140, 118, 24, {
        fill: soft(green, 0.14, 0.2),
        stroke: rim(green),
        strokeWidth: 1,
        radius: 12,
    })
    fig.text(725, 152, 'Worker Auth', {
        size: 12,
        color: green,
        align: 'center',
        weight: 600,
        width: 108,
    })

    // Shared frozen base weights slab
    fig.rect(420, 174, 362, 54, {
        fill: blue,
        radius: 6,
    })
    const onBlue = getReadableTextColor(blue, c, c.bg)
    fig.text(601, 192, 'Shared Frozen Base Weights (72B BF16 · 144 GB)', {
        size: 13,
        color: onBlue,
        align: 'center',
        weight: 700,
        width: 350,
    })
    fig.text(601, 212, '1 shared copy vs 100 dedicated (14.4 TB) · 99% VRAM saved', {
        size: 12,
        color: onBlue,
        align: 'center',
        weight: 500,
        width: 350,
    })

    // Isolated per-tenant state lanes beneath shared base
    const lanes = [
        {
            x: 420,
            title: 'Tenant A Isolated State',
            color: blue,
            rows: ['KV Pages: P0, P2, P4', 'LoRA: docs-v2 (r=1)', 'Quota & Usage Meter'],
        },
        {
            x: 608,
            title: 'Tenant B Isolated State',
            color: purple,
            rows: ['KV Pages: P1, P3', 'LoRA: inc-v1 (r=1)', 'Quota & Usage Meter'],
        },
    ]
    for (const lane of lanes) {
        fig.arrow(lane.x + 87, 228, lane.x + 87, 250, { color: lane.color, width: 1.5, head: 5 })
        fig.rect(lane.x, 252, 174, 134, {
            fill: soft(lane.color, 0.08, 0.14),
            stroke: rim(lane.color),
            strokeWidth: 1.25,
            radius: 6,
        })
        fig.text(lane.x + 87, 270, lane.title, {
            size: 13,
            color: lane.color,
            align: 'center',
            weight: 700,
            width: 164,
        })
        lane.rows.forEach((row, idx) => {
            const ry = 290 + idx * 30
            fig.rect(lane.x + 10, ry, 154, 24, {
                fill: c.bg,
                stroke: c.borderSubtle,
                strokeWidth: 0.9,
                radius: 4,
            })
            fig.text(lane.x + 87, ry + 12, row, {
                size: 12,
                color: c.textPrimary,
                align: 'center',
                mono: idx < 2,
                width: 148,
            })
        })
    }

    // Isolation barrier dashed line between A and B
    fig.line(601, 254, 601, 386, { color: c.textMuted, width: 1.25, dash: '3 3' })

    return fig.render()
}
