import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 475
export const alt =
    'GLM-5.3 sequential stack from token embedding through three dense Transformer layers, seventy-five MoE Transformer layers, and final norm and vocabulary head, plus layer 78 MTP module. A zoomed MoE layer shows normalization, sparse MLA attention, residual addition, top-eight plus one shared expert FFN, and residual addition.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const soft = theme === 'light' ? 0.13 : 0.18

    // Top proportion bar (3 dense + 75 MoE + 1 MTP = 79 blocks)
    const barX = 24
    const barY = 22
    const barW = 752
    const barH = 22
    const wDense = Math.round((3 / 79) * barW)
    const wMtp = Math.round((1 / 79) * barW)
    const wMoe = barW - wDense - wMtp - 4

    fig.rect(barX, barY, wDense, barH, { fill: blue, radius: 4 })
    fig.rect(barX + wDense + 2, barY, wMoe, barH, { fill: purple, radius: 4 })
    fig.rect(barX + wDense + wMoe + 4, barY, wMtp, barH, { fill: warm, radius: 4 })
    fig.text(barX + wDense + 2 + wMoe / 2, barY + barH / 2, '75 MoE layers (95% of depth)', {
        size: 12.5,
        weight: 700,
        color: theme === 'light' ? '#ffffff' : '#0b0c10',
        align: 'center',
    })

    // Compact legend line under proportion bar
    const legendItems = [
        { x: 24, color: blue, text: 'Dense L0..L2 (3)' },
        { x: 214, color: purple, text: 'MoE L3..L77 (75)' },
        { x: 408, color: warm, text: 'MTP L78 (1)' },
    ]
    for (const li of legendItems) {
        fig.rect(li.x, 54, 11, 11, { fill: li.color, radius: 2.5 })
        fig.text(li.x + 18, 60, li.text, { size: 12.5, color: c.textSecondary })
    }

    // Column titles
    fig.text(162, 92, 'Sequential trunk (PP = 1)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(596, 92, 'Inside 1 MoE layer (residual stream)', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Left trunk stack
    const trunkX = 32
    const trunkW = 260
    const trunkBlocks = [
        { y: 116, h: 62, title: 'Token Embedding', sub: '154,880 → 6,144', color: blue, bold: false },
        { y: 204, h: 62, title: 'L0..L2 Dense FFN', sub: '3 layers · width 12,288', color: blue, bold: false },
        { y: 292, h: 72, title: 'L3..L77 Sparse MoE', sub: '75 layers · top-8 + 1 shared', color: purple, bold: true },
        { y: 390, h: 62, title: 'RMSNorm + LM Head', sub: '+ L78 MTP module', color: warm, bold: false },
    ]

    // Zoom trapezoid connecting L3..L77 MoE block to right expanded region
    const zLeftTop = 292
    const zLeftBot = 364
    const zRightX = 398
    const zRightTop = 112
    const zRightBot = 456
    fig.path(
        `M${trunkX + trunkW} ${zLeftTop}L${zRightX} ${zRightTop}V${zRightBot}L${trunkX + trunkW} ${zLeftBot}Z`,
        {
            fill: purple,
            fillOpacity: theme === 'light' ? 0.06 : 0.1,
            color: purple,
            width: 1,
            dash: '4 4',
            opacity: 0.45,
        },
    )

    trunkBlocks.forEach((b, i) => {
        fig.rect(trunkX, b.y, trunkW, b.h, {
            fill: tint(b.color, c.bg, b.bold ? (theme === 'light' ? 0.18 : 0.24) : soft),
            stroke: b.color,
            strokeWidth: b.bold ? 2.2 : 1.4,
            radius: 9,
        })
        fig.text(trunkX + trunkW / 2, b.y + 23, b.title, {
            size: 14,
            weight: 700,
            color: b.bold ? purple : c.textPrimary,
            align: 'center',
        })
        fig.text(trunkX + trunkW / 2, b.y + 46, b.sub, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
        if (i < trunkBlocks.length - 1) {
            const next = trunkBlocks[i + 1]!
            fig.arrow(trunkX + trunkW / 2, b.y + b.h + 2, trunkX + trunkW / 2, next.y - 3, {
                color: c.textMuted,
                width: 1.6,
                head: 6,
            })
        }
    })

    // Right expanded MoE layer with explicit residual highway
    fig.rect(zRightX, zRightTop, 378, zRightBot - zRightTop, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.04 : 0.07),
        stroke: tint(purple, c.bg, 0.35),
        strokeWidth: 1.25,
        radius: 12,
    })

    const railX = 438
    const modX = 482
    const modW = 274

    // Residual highway spine from top to bottom
    fig.line(railX, 126, railX, 442, { color: blue, width: 2.2 })
    fig.arrow(railX, 428, railX, 444, { color: blue, width: 2.2, head: 7 })
    fig.text(railX - 10, 134, 'x', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'right',
        mono: true,
    })

    // Sub-block 1: RMSNorm + Sparse MLA
    const mlaY = 148
    const mlaH = 74
    fig.path(`M${railX} 136H${modX + modW / 2}V${mlaY - 4}`, { color: blue, width: 1.5 })
    fig.arrow(modX + modW / 2, mlaY - 14, modX + modW / 2, mlaY - 2, {
        color: blue,
        width: 1.5,
        head: 6,
    })
    fig.rect(modX, mlaY, modW, mlaH, {
        fill: tint(blue, c.bg, soft),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 9,
    })
    fig.text(modX + modW / 2, mlaY + 25, 'RMSNorm + Sparse MLA', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(modX + modW / 2, mlaY + 50, 'Q 2,048 · KV 512 · top-2,048', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Residual add 1 (+)
    const add1Y = 256
    fig.path(`M${modX + modW / 2} ${mlaY + mlaH}V${add1Y}H${railX + 16}`, {
        color: blue,
        width: 1.6,
    })
    fig.arrow(railX + 26, add1Y, railX + 15, add1Y, { color: blue, width: 1.6, head: 6 })
    fig.circle(railX, add1Y, 12, { fill: c.bg, stroke: blue, width: 2 })
    fig.text(railX, add1Y, '+', { size: 15, weight: 700, color: blue, align: 'center' })
    fig.text(railX + 130, add1Y - 12, 'Residual add', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Sub-block 2: RMSNorm + MoE Router
    const moeY = 294
    const moeH = 76
    fig.path(`M${railX} 278H${modX + modW / 2}V${moeY - 4}`, { color: green, width: 1.5 })
    fig.arrow(modX + modW / 2, moeY - 14, modX + modW / 2, moeY - 2, {
        color: green,
        width: 1.5,
        head: 6,
    })
    fig.rect(modX, moeY, modW, moeH, {
        fill: tint(green, c.bg, soft),
        stroke: green,
        strokeWidth: 1.5,
        radius: 9,
    })
    fig.text(modX + modW / 2, moeY + 25, 'RMSNorm + MoE Router', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(modX + modW / 2, moeY + 51, '8 of 256 routed + 1 shared (2,048)', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Residual add 2 (+)
    const add2Y = 406
    fig.path(`M${modX + modW / 2} ${moeY + moeH}V${add2Y}H${railX + 16}`, {
        color: green,
        width: 1.6,
    })
    fig.arrow(railX + 26, add2Y, railX + 15, add2Y, { color: green, width: 1.6, head: 6 })
    fig.circle(railX, add2Y, 12, { fill: c.bg, stroke: blue, width: 2 })
    fig.text(railX, add2Y, '+', { size: 15, weight: 700, color: blue, align: 'center' })
    fig.text(modX + modW / 2, add2Y + 24, 'Output hidden state (width 6,144)', {
        size: 12.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
