import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 415
export const alt =
    'Interleaved layer compositions for hybrid SSM-Transformer models. Jamba repeats an 8-layer block with 1 attention layer and 7 Mamba layers (12.5% KV layers). Nemotron-H-8B interleaves 4 attention layers across 52 total layers alongside 24 Mamba-2 and 24 FFN layers (7.7% KV layers), shrinking KV cache by 8x to 13x relative to an all-attention stack.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const attn = fig.tone('blue')
    const ssm = fig.tone('green')
    const ffn = fig.tone('purple')

    const attnFill = tint(attn, c.bg, isLight ? 0.22 : 0.36)
    const ssmFill = tint(ssm, c.bg, isLight ? 0.2 : 0.32)
    const ffnFill = tint(ffn, c.bg, isLight ? 0.14 : 0.24)

    const left = 24
    const fullW = width - 48

    // Top role legend (single horizontal strip)
    const legY = 20
    const roles = [
        { x: left, label: 'Attention · KV O(L)', color: attn, fill: attnFill },
        { x: 248, label: 'Mamba / SSM · fixed O(1)', color: ssm, fill: ssmFill },
        { x: 528, label: 'FFN / MoE · stateless', color: ffn, fill: ffnFill },
    ]
    for (const r of roles) {
        fig.rect(r.x, legY - 7, 14, 14, {
            fill: r.fill,
            stroke: r.color,
            strokeWidth: 1.4,
            radius: 3,
        })
        fig.text(r.x + 22, legY, r.label, { size: 14, weight: 600, color: r.color })
    }

    // Section 1: Jamba 8-layer repeating block (7 Mamba + 1 Attention)
    const s1Y = 60
    fig.text(left, s1Y, 'Jamba · 8-layer repeating block', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(left + fullW, s1Y, '1 Attn + 7 Mamba  (12.5% KV layers)', {
        size: 13.5,
        weight: 600,
        color: attn,
        mono: true,
        align: 'right',
    })

    const jambaSeq: ('M' | 'A')[] = ['M', 'M', 'M', 'A', 'M', 'M', 'M', 'M']
    const jGap = 8
    const jCellW = (fullW - jGap * 7) / 8
    const jY = s1Y + 20
    const jH = 52
    jambaSeq.forEach((kind, i) => {
        const x = left + i * (jCellW + jGap)
        const isAttn = kind === 'A'
        fig.rect(x, jY, jCellW, jH, {
            fill: isAttn ? attnFill : ssmFill,
            stroke: isAttn ? attn : ssm,
            strokeWidth: isAttn ? 1.8 : 1.3,
            radius: 7,
        })
        fig.text(x + jCellW / 2, jY + 19, isAttn ? 'Attn' : 'Mamba', {
            size: 13.5,
            weight: 700,
            color: isAttn ? attn : ssm,
            align: 'center',
        })
        fig.text(x + jCellW / 2, jY + 38, `L${i + 1}`, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    // Section 2: Nemotron-H-8B (52 layers: 4 Attn + 24 Mamba-2 + 24 FFN)
    const s2Y = 166
    fig.text(left, s2Y, 'Nemotron-H-8B · 52-layer stack', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(left + fullW, s2Y, '4 Attn + 24 Mamba-2 + 24 FFN (7.7% KV)', {
        size: 14,
        weight: 600,
        color: attn,
        mono: true,
        align: 'right',
    })

    // Exact 52-layer interleaved pattern (4 attention layers spaced across the 52 layers)
    const attnIdx = new Set([6, 19, 32, 45])
    const nemoSeq: ('A' | 'M' | 'F')[] = []
    let toggle = 0
    for (let i = 0; i < 52; i++) {
        if (attnIdx.has(i)) {
            nemoSeq.push('A')
        } else {
            nemoSeq.push(toggle % 2 === 0 ? 'M' : 'F')
            toggle++
        }
    }

    const nGap = 2.5
    const nCellW = (fullW - nGap * 51) / 52
    const nY = s2Y + 38
    const nH = 44
    nemoSeq.forEach((kind, i) => {
        const x = left + i * (nCellW + nGap)
        const fill = kind === 'A' ? attnFill : kind === 'M' ? ssmFill : ffnFill
        const stroke = kind === 'A' ? attn : kind === 'M' ? ssm : ffn
        fig.rect(x, nY, nCellW, nH, {
            fill,
            stroke,
            strokeWidth: kind === 'A' ? 1.8 : 1,
            radius: 2.5,
        })
        if (kind === 'A') {
            fig.text(x + nCellW / 2, nY - 12, 'A', {
                size: 13.5,
                weight: 700,
                color: attn,
                align: 'center',
                mono: true,
            })
        }
    })
    fig.text(left, nY + nH + 16, 'Layer 1', { size: 13.5, color: c.textMuted, mono: true })
    fig.text(left + fullW, nY + nH + 16, 'Layer 52', {
        size: 13.5,
        color: c.textMuted,
        mono: true,
        align: 'right',
    })

    // Section 3: Proportional KV-holding layer fraction comparison
    const sepY = 286
    fig.line(left, sepY, left + fullW, sepY, { color: c.borderSubtle, width: 1 })
    fig.text(left, sepY + 22, 'Share of layers allocating growing KV cache', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const rows = [
        { name: 'Pure Transformer', frac: 1.0, badge: '100% (1× baseline)', color: c.textMuted, fill: isLight ? '#e8e4da' : '#252a36' },
        { name: 'Jamba (1 / 8)', frac: 1 / 8, badge: '12.5% (8× less KV)', color: attn, fill: attnFill },
        { name: 'Nemotron-H (4/52)', frac: 4 / 52, badge: '7.7% (13× less KV)', color: ssm, fill: ssmFill },
    ]
    const labelW = 166
    const trackX = left + labelW
    const trackW = 352
    rows.forEach((r, idx) => {
        const y = sepY + 44 + idx * 30
        fig.text(trackX - 12, y + 9, r.name, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
        })
        fig.rect(trackX, y, trackW, 18, {
            fill: isLight ? '#f2efe7' : '#161a24',
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 4,
        })
        fig.rect(trackX, y, Math.max(8, trackW * r.frac), 18, {
            fill: r.fill,
            stroke: r.color,
            strokeWidth: 1.4,
            radius: 4,
        })
        fig.text(trackX + trackW + 12, y + 9, r.badge, {
            size: 14,
            weight: 700,
            color: idx === 0 ? c.textSecondary : r.color,
            mono: true,
        })
    })

    return fig.render()
}

export default create('dark')
