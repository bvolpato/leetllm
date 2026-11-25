import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Side by side, a 6x6 causal attention mask for the six GPT-2 BPE tokens (Good, sir, comma, newline, Spe, ak) highlights query row q2 at the comma reading keys 0..2 while blocking future keys 3..5 with minus infinity. On the right, the aligned token and shifted-target strip shows logits z2 at comma scored against the next token y2 = x3 (newline, ID 198).'

const pieces = ['Good', "' sir'", ',', '\\n', 'Spe', 'ak']
const ids = ['10248', '15967', '11', '198', '5248', '461']

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const muted = c.textSecondary

    // Left panel: 6x6 causal attention mask using heatGrid with causal hatching
    fig.text(24, 24, '1. Causal mask governs visibility', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(24, 42, 'q₂ (comma) reads keys 0..2; keys 3..5 masked', {
        size: 12,
        color: muted,
    })

    const gridData = Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 6 }, (_, k) => (k <= r ? (r === 2 ? 0.92 : 0.42) : 0)),
    )
    const gridArea = { x: 66, y: 84, width: 256, height: 256 }
    fig.heatGrid(gridData, gridArea, {
        causal: true,
        rowLabels: ['q₀', 'q₁', 'q₂', 'q₃', 'q₄', 'q₅'],
        colLabels: ['k₀', 'k₁', 'k₂', 'k₃', 'k₄', 'k₅'],
        highlightRow: 2,
        highlightColor: warm,
        showValues: false,
        gap: 4,
        radius: 5,
        labelSize: 13,
    })

    // Legend under grid
    fig.rect(66, 356, 14, 14, { fill: tint(warm, c.bg, 0.55), stroke: warm, strokeWidth: 1.5, radius: 3 })
    fig.text(86, 363, 'q₂ visible (0..2)', { size: 12, weight: 600, color: warm })
    fig.rect(206, 356, 14, 14, { fill: tint(c.textMuted, c.bg, 0.1), stroke: c.borderSubtle, strokeWidth: 1, radius: 3 })
    fig.line(209, 367, 217, 359, { color: c.textMuted, width: 1.1 })
    fig.text(226, 363, 'masked (−∞)', { size: 12, color: muted })

    // Divider
    fig.line(352, 22, 352, 376, { color: c.borderSubtle, width: 1 })

    // Right panel: Token stream + shifted supervision on z2 -> y2 = x3
    const rx = 376
    fig.text(rx, 24, '2. One-step shift governs supervision', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rx, 44, 'Logits z₂ at comma are scored against next token y₂ = x₃', {
        size: 12,
        color: muted,
    })

    // Horizontal strip of 6 tokens
    const tileW = 56
    const tileGap = 5
    const tokY = 98
    const tokH = 54
    fig.text(rx, 80, 'Input tokens xₜ (GPT-2 BPE)', { size: 13, weight: 600, color: muted })

    pieces.forEach((p, i) => {
        const tx = rx + i * (tileW + tileGap)
        const isQ = i === 2
        const isTarget = i === 3
        const future = i > 3
        const stroke = isQ ? warm : isTarget ? green : future ? c.borderSubtle : cyan
        const fill = isQ
            ? tint(warm, c.bg, 0.2)
            : isTarget
              ? tint(green, c.bg, 0.2)
              : future
                ? tint(c.textMuted, c.bg, 0.06)
                : tint(cyan, c.bg, 0.1)

        fig.rect(tx, tokY, tileW, tokH, {
            fill,
            stroke,
            strokeWidth: isQ || isTarget ? 1.9 : 1.1,
            radius: 6,
        })
        fig.text(tx + tileW / 2, tokY + 17, p, {
            size: 14,
            mono: true,
            weight: 700,
            color: isQ ? warm : isTarget ? green : c.textPrimary,
            align: 'center',
        })
        fig.text(tx + tileW / 2, tokY + 39, ids[i]!, {
            size: 11,
            mono: true,
            color: muted,
            align: 'center',
        })
        fig.text(tx + tileW / 2, tokY + tokH + 14, `x${['₀', '₁', '₂', '₃', '₄', '₅'][i]}`, {
            size: 12,
            mono: true,
            weight: isQ || isTarget ? 700 : 500,
            color: isQ ? warm : isTarget ? green : muted,
            align: 'center',
        })
    })

    // Step-by-step scoring flow below token strip
    const x2Center = rx + 2 * (tileW + tileGap) + tileW / 2
    const x3Center = rx + 3 * (tileW + tileGap) + tileW / 2

    // Logits z2 card directly under x2
    const zY = 204
    fig.arrow(x2Center, tokY + tokH + 24, x2Center, zY - 4, { color: warm, width: 1.8, head: 7 })
    fig.rect(rx + 66, zY, 134, 48, {
        fill: tint(cyan, c.bg, 0.14),
        stroke: cyan,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(rx + 133, zY + 16, 'Logits z₂', {
        size: 14,
        mono: true,
        weight: 700,
        color: cyan,
        align: 'center',
    })
    fig.text(rx + 133, zY + 35, 'from prefix x₀..x₂', {
        size: 11,
        color: muted,
        align: 'center',
    })

    // Target y2 = x3 card to the right
    const yBoxX = rx + 236
    fig.rect(yBoxX, zY, 126, 48, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(yBoxX + 63, zY + 16, 'Target y₂ = x₃', {
        size: 13,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(yBoxX + 63, zY + 35, 'newline (198)', {
        size: 11,
        mono: true,
        color: green,
        align: 'center',
    })

    // Arrow from x3 down into Target y2 = x3
    fig.path(`M${x3Center} ${tokY + tokH + 24} L${x3Center} ${zY - 14} L${yBoxX + 63} ${zY - 14}`, {
        color: green,
        width: 1.6,
    })
    fig.arrow(yBoxX + 63, zY - 14, yBoxX + 63, zY - 3, { color: green, width: 1.6, head: 6 })

    // Horizontal scoring arrow z2 -> y2
    fig.arrow(rx + 202, zY + 24, yBoxX - 4, zY + 24, { color: c.textPrimary, width: 1.8, head: 7 })

    // Cross-entropy formula box at bottom right
    const eqY = 294
    fig.rect(rx, eqY, 362, 62, {
        fill: tint(green, c.bg, 0.08),
        stroke: tint(green, c.bg, 0.35),
        strokeWidth: 1.2,
        radius: 8,
    })
    fig.math(rx + 181, eqY + 22, String.raw`\ell_2 = -\log \operatorname{softmax}(z_2)_{x_3}`, {
        size: 15,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rx + 181, eqY + 47, 'Mask blocks future keys; target shift supplies next token', {
        size: 12,
        color: muted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
