import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 475

export const qwen2Modules = [
    { name: 'q_proj', input: 16, output: 16, queryValue: true, attention: true, allLinear: true },
    { name: 'k_proj', input: 16, output: 8, queryValue: false, attention: true, allLinear: true },
    { name: 'v_proj', input: 16, output: 8, queryValue: true, attention: true, allLinear: true },
    { name: 'o_proj', input: 16, output: 16, queryValue: false, attention: true, allLinear: true },
    { name: 'gate_proj', input: 16, output: 32, queryValue: false, attention: false, allLinear: true },
    { name: 'up_proj', input: 16, output: 32, queryValue: false, attention: false, allLinear: true },
    { name: 'down_proj', input: 32, output: 16, queryValue: false, attention: false, allLinear: true },
    { name: 'lm_head', input: 16, output: 32, queryValue: false, attention: false, allLinear: false },
] as const

const rank = 2
export const targetTotals = {
    queryValue: qwen2Modules
        .filter((m) => m.queryValue)
        .reduce((s, m) => s + rank * (m.input + m.output), 0),
    attention: qwen2Modules
        .filter((m) => m.attention)
        .reduce((s, m) => s + rank * (m.input + m.output), 0),
    allLinear: qwen2Modules
        .filter((m) => m.allLinear)
        .reduce((s, m) => s + rank * (m.input + m.output), 0),
}

export const alt =
    'A Qwen2 block diagram (hidden 16, MLP 32, 2 Q heads, 1 KV head, rank 2) maps LoRA adapter attachments across GQA attention projections (q_proj 64, k_proj 48, v_proj 48, o_proj 64) and SwiGLU MLP projections (gate_proj, up_proj, down_proj at 96 each), leaving lm_head excluded. Proportional bars compare total adapter parameters: 112 for Q/V, 224 for all-attention, and 512 for all-linear.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const muted = c.textSecondary

    // Top formula & legend
    fig.math(20, 24, String.raw`\text{Per linear: } r(d_{\text{in}} + d_{\text{out}}),\; r=2`, {
        size: 15,
        color: c.textPrimary,
    })
    const legendItems = [
        { label: 'Q/V (112)', color: purple, x: 344 },
        { label: 'Attn (224)', color: cyan, x: 458 },
        { label: 'All-Linear (512)', color: green, x: 568 },
    ]
    legendItems.forEach((lg) => {
        fig.circle(lg.x, 24, 5, { fill: lg.color })
        fig.text(lg.x + 10, 24, lg.label, { size: 14, weight: 700, color: lg.color })
    })

    // Left: Qwen2 block architecture
    const leftX = 20
    const groupW = 412

    fig.rect(leftX, 56, groupW, 184, {
        fill: tint(cyan, c.bg, 0.06),
        stroke: tint(cyan, c.bg, 0.3),
        strokeWidth: 1.2,
        radius: 8,
    })
    fig.text(leftX + 12, 76, 'GQA Attention · 2 Q, 1 KV head', {
        size: 14,
        weight: 700,
        color: cyan,
    })

    fig.rect(leftX, 254, groupW, 142, {
        fill: tint(green, c.bg, 0.06),
        stroke: tint(green, c.bg, 0.3),
        strokeWidth: 1.2,
        radius: 8,
    })
    fig.text(leftX + 12, 274, 'SwiGLU MLP · 16 ↔ 32', {
        size: 14,
        weight: 700,
        color: green,
    })

    fig.rect(leftX, 410, groupW, 46, {
        fill: tint(c.textMuted, c.bg, 0.06),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 7,
    })

    const rowPositions = [110, 146, 182, 218, 308, 344, 380, 433]
    const barX = 210
    const maxParams = 96
    const barWMax = 100

    qwen2Modules.forEach((m, idx) => {
        const cy = rowPositions[idx]!
        const isHead = m.name === 'lm_head'
        const params = rank * (m.input + m.output)

        fig.text(leftX + 12, cy, m.name, {
            size: 14,
            mono: true,
            weight: isHead ? 500 : 700,
            color: isHead ? muted : c.textPrimary,
        })
        fig.text(leftX + 114, cy, `${m.input}→${m.output}`, {
            size: 14,
            mono: true,
            color: muted,
        })

        if (isHead) {
            fig.text(barX, cy, 'excluded (all-linear)', {
                size: 14,
                color: muted,
            })
            return
        }

        const bw = (params / maxParams) * barWMax
        const barTone = idx < 4 ? cyan : green
        fig.rect(barX, cy - 9, bw, 18, {
            fill: tint(barTone, c.bg, 0.28),
            stroke: barTone,
            strokeWidth: 1.2,
            radius: 3,
        })
        fig.text(barX + bw + 8, cy, String(params), {
            size: 14,
            mono: true,
            weight: 700,
            color: barTone,
        })

        const dotXs = [362, 386, 410]
        const flags = [m.queryValue, m.attention, m.allLinear]
        const tones = [purple, cyan, green]
        flags.forEach((on, cIdx) => {
            const dx = dotXs[cIdx]!
            const col = tones[cIdx]!
            if (on) {
                fig.circle(dx, cy, 5.5, { fill: col })
            } else {
                fig.circle(dx, cy, 4, { fill: 'none', stroke: c.border, width: 1.2 })
            }
        })
    })

    // Right: Total adapter params comparison chart
    const rX = 456
    fig.text(rX, 72, 'Total adapter params', { size: 16, weight: 700, color: c.textPrimary })
    fig.text(rX, 96, 'Shared scale (0–512)', { size: 14, color: muted })

    const totals = [
        { name: 'Q / V only', sub: '2 projections', val: targetTotals.queryValue, color: purple, y: 140 },
        { name: 'All attention', sub: '4 projections', val: targetTotals.attention, color: cyan, y: 230 },
        { name: 'All linear', sub: '7 projections', val: targetTotals.allLinear, color: green, y: 320 },
    ]

    const maxBarW = 196
    totals.forEach((t) => {
        fig.text(rX, t.y, t.name, { size: 15, weight: 700, color: t.color })
        fig.text(rX + maxBarW + 48, t.y, t.sub, { size: 13, color: muted, align: 'right' })

        const barY = t.y + 24
        const bw = (t.val / 512) * maxBarW
        fig.rect(rX, barY, maxBarW, 26, {
            fill: tint(c.textMuted, c.bg, 0.08),
            radius: 4,
        })
        fig.rect(rX, barY, bw, 26, {
            fill: tint(t.color, c.bg, 0.34),
            stroke: t.color,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(rX + maxBarW + 10, barY + 13, String(t.val), {
            size: 15,
            mono: true,
            weight: 700,
            color: t.color,
        })
    })

    const axY = 394
    fig.line(rX, axY, rX + maxBarW, axY, { color: c.textMuted, width: 1 })
    ;[0, 256, 512].forEach((v) => {
        const vx = rX + (v / 512) * maxBarW
        fig.line(vx, axY, vx, axY + 5, { color: c.textMuted, width: 1 })
        fig.text(vx, axY + 19, String(v), {
            size: 13,
            mono: true,
            color: muted,
            align: 'center',
        })
    })

    fig.text(rX, 444, 'MLP adds 288 / 512 (56%).', { size: 14, weight: 600, color: muted })

    return fig.render()
}

export default create('dark')
