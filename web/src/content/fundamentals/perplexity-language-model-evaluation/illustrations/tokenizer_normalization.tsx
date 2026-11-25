import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 430
export const alt =
    'At the top, the same 14 UTF-8 bytes of "Rain falls now" align across two tokenizers: four subword spans (Rain, ·falls, ·n, ow; total NLL 8.4 nats) versus fourteen single-byte character spans (total NLL 9.0 nats). At lower left, raw token perplexity bars favor the character model (1.90 vs 8.17) because loss divides by 14 instead of 4. At lower right, bits per byte bars on the shared 14-byte denominator flip the winner back to the lower-loss subword model (0.866 vs 0.927).'

const bytes = [...'Rain·falls·now']
const pieces = ['Rain', '·falls', '·n', 'ow']

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const isDark = theme === 'dark'

    // ─── TOP: Aligned 14-byte spans for Subword (4 tokens) vs Character (14 tokens) ───
    const startX = 166
    const step = 38
    const byteY = 34
    const subY = 64
    const charY = 122
    const rowH = 38

    fig.text(startX - 14, byteY, '14 UTF-8 bytes', {
        size: 13.5,
        color: c.textSecondary,
        align: 'right',
        weight: 600,
    })
    bytes.forEach((ch, i) => {
        fig.text(startX + i * step + step / 2, byteY, ch, {
            size: 15,
            color: ch === '·' ? c.textMuted : c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })
    })

    // Subword row (4 labeled spans)
    fig.text(startX - 14, subY + rowH / 2 - 8, 'Subword (4 tok)', {
        size: 14,
        color: blue,
        align: 'right',
        weight: 700,
    })
    fig.text(startX - 14, subY + rowH / 2 + 11, 'NLL = 8.4 nats', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    let offset = 0
    for (const p of pieces) {
        const x = startX + offset * step + 2
        const w = p.length * step - 4
        fig.rect(x, subY, w, rowH, {
            fill: tint(blue, c.bg, isDark ? 0.34 : 0.22),
            stroke: blue,
            strokeWidth: 1.6,
            radius: 5,
        })
        fig.text(x + w / 2, subY + rowH / 2, p, {
            size: 14.5,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })
        offset += p.length
    }

    // Character row (14 labeled 1-byte spans)
    fig.text(startX - 14, charY + rowH / 2 - 8, 'Character (14 tok)', {
        size: 14,
        color: warm,
        align: 'right',
        weight: 700,
    })
    fig.text(startX - 14, charY + rowH / 2 + 11, 'NLL = 9.0 nats', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    bytes.forEach((ch, i) => {
        const x = startX + i * step + 2
        const w = step - 4
        fig.rect(x, charY, w, rowH, {
            fill: tint(warm, c.bg, isDark ? 0.32 : 0.2),
            stroke: warm,
            strokeWidth: 1.4,
            radius: 4,
        })
        fig.text(x + w / 2, charY + rowH / 2, ch, {
            size: 13.5,
            color: ch === '·' ? c.textSecondary : c.textPrimary,
            align: 'center',
            mono: true,
            weight: 600,
        })
    })

    // Subtle divider
    fig.line(24, 184, width - 24, 184, { color: c.borderSubtle, width: 1 })

    // ─── BOTTOM-LEFT: Raw Token Perplexity (different denominators: ÷4 vs ÷14) ───
    const lx = 74
    const lw = 264
    const by = 248
    const bh = 132

    fig.text(lx + lw / 2, 206, 'Raw token PPL  (exp(NLL / T))', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(lx + lw / 2, 226, 'Different denominators (T = 4 vs 14)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    const pplPlot = fig.plot({ x: lx, y: by, width: lw, height: bh }, { x: [0, 2], y: [0, 9.6] })
    for (const tick of [0, 3, 6, 9]) {
        const py = pplPlot.py(tick)
        fig.line(lx, py, lx + lw, py, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
        })
        fig.text(lx - 8, py, String(tick), {
            size: 13,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(lx, by, lx, pplPlot.bottom, { color: c.borderLight, width: 1 })

    const pplBars = [
        { cx: lx + 72, name: 'Subword', val: 8.17, col: blue, tag: '÷ 4 tok' },
        { cx: lx + 192, name: 'Character', val: 1.9, col: warm, tag: '÷ 14 tok (looks lower)' },
    ]
    for (const b of pplBars) {
        const y0 = pplPlot.py(0)
        const y1 = pplPlot.py(b.val)
        fig.rect(b.cx - 32, y1, 64, y0 - y1, {
            fill: tint(b.col, c.bg, isDark ? 0.38 : 0.25),
            stroke: b.col,
            strokeWidth: 1.7,
            radius: 4,
        })
        fig.text(b.cx, y1 - 13, b.val.toFixed(2), {
            size: 14.5,
            color: b.col,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(b.cx, pplPlot.bottom + 17, b.name, {
            size: 13.5,
            color: b.col,
            align: 'center',
            weight: 700,
        })
        fig.text(b.cx, pplPlot.bottom + 35, b.tag, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Center arrow indicating metric normalization flip
    fig.arrow(352, 314, 396, 314, { color: c.textPrimary, width: 1.8, head: 6 })
    fig.text(374, 294, 'flips', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    // ─── BOTTOM-RIGHT: Bits per Byte (BPB, shared 14-byte denominator) ───
    const rx = 446
    const rw = 264

    fig.text(rx + rw / 2, 206, 'Bits per byte  (NLL / (14 · ln 2))', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(rx + rw / 2, 226, 'Shared 14-byte denominator', {
        size: 13,
        color: blue,
        align: 'center',
        weight: 600,
    })

    const bpbPlot = fig.plot({ x: rx, y: by, width: rw, height: bh }, { x: [0, 2], y: [0, 1.12] })
    for (const tick of [0, 0.5, 1.0]) {
        const py = bpbPlot.py(tick)
        fig.line(rx, py, rx + rw, py, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
        })
        fig.text(rx - 8, py, tick.toFixed(1), {
            size: 13,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(rx, by, rx, bpbPlot.bottom, { color: c.borderLight, width: 1 })

    const bpbBars = [
        { cx: rx + 72, name: 'Subword', val: 0.866, col: blue, tag: 'lower loss ✓' },
        { cx: rx + 192, name: 'Character', val: 0.927, col: warm, tag: '+0.061 bpb' },
    ]
    for (const b of bpbBars) {
        const y0 = bpbPlot.py(0)
        const y1 = bpbPlot.py(b.val)
        fig.rect(b.cx - 32, y1, 64, y0 - y1, {
            fill: tint(b.col, c.bg, isDark ? 0.38 : 0.25),
            stroke: b.col,
            strokeWidth: 1.7,
            radius: 4,
        })
        fig.text(b.cx, y1 - 13, b.val.toFixed(3), {
            size: 14.5,
            color: b.col,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(b.cx, bpbPlot.bottom + 17, b.name, {
            size: 13.5,
            color: b.col,
            align: 'center',
            weight: 700,
        })
        fig.text(b.cx, bpbPlot.bottom + 35, b.tag, {
            size: 12.5,
            color: b.col === blue ? blue : c.textSecondary,
            align: 'center',
            weight: b.col === blue ? 700 : 400,
        })
    }

    return fig.render()
}

export default create('dark')
