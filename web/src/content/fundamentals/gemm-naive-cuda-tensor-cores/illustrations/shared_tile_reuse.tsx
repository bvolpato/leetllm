import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    '16x16 shared-memory tile reuse and two-barrier K-panel loop. Top schematic shows As (16x16, 1,024 B) times Bs (16x16, 1,024 B) producing C (16x16), where one As row value serves 16 outputs and one Bs column value serves 16 outputs, delivering 8,192 FLOPs from 2,048 operand bytes (4.0 FLOP/B). Bottom timeline shows the four-step K-panel loop (Stage with OOB zero-fill, RAW barrier, 16 FMAs, WAR barrier) with the edge-thread rule aligned beneath.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // --- Top: Bold schematic As x Bs -> C ---
    fig.text(32, 22, 'Cooperative 16×16 shared-memory tile reuse', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const matSize = 116
    const matY = 64
    const ax = 42
    const bx = 210
    const cx = 382

    const drawTile = (
        x: number,
        y: number,
        title: string,
        sub: string,
        tone: string,
        highlightRow: boolean,
        highlightCol: boolean,
        pivot?: { r: number; c: number; color: string },
    ) => {
        fig.text(x + matSize / 2, y - 14, title, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
        fig.rect(x, y, matSize, matSize, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.08 : 0.14),
            stroke: tint(tone, c.bg, 0.55),
            strokeWidth: 1.5,
            radius: 6,
        })
        // Clean 4x4 internal guides (each strip = 4 entries)
        for (let g = 1; g < 4; g++) {
            const d = (g * matSize) / 4
            fig.line(x + d, y, x + d, y + matSize, {
                color: c.borderSubtle,
                width: 0.75,
                opacity: 0.65,
            })
            fig.line(x, y + d, x + matSize, y + d, {
                color: c.borderSubtle,
                width: 0.75,
                opacity: 0.65,
            })
        }
        const stripW = 14
        const rPos = y + 48
        const cPos = x + 48
        if (highlightRow) {
            fig.rect(x + 1, rPos, matSize - 2, stripW, {
                fill: tint(warm, c.bg, theme === 'light' ? 0.32 : 0.42),
                stroke: warm,
                strokeWidth: 1,
            })
        }
        if (highlightCol) {
            fig.rect(cPos, y + 1, stripW, matSize - 2, {
                fill: tint(blue, c.bg, theme === 'light' ? 0.32 : 0.42),
                stroke: blue,
                strokeWidth: 1,
            })
        }
        if (pivot) {
            const px = x + pivot.c
            const py = y + pivot.r
            fig.rect(px, py, stripW, stripW, {
                fill: pivot.color,
                stroke: c.bg,
                strokeWidth: 1.5,
                radius: 2,
            })
        }
        fig.text(x + matSize / 2, y + matSize + 18, sub, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    drawTile(ax, matY, 'As (16×16)', '256 floats · 1,024 B', warm, true, false, {
        r: 48,
        c: 26,
        color: red,
    })
    fig.text(ax + matSize + 26, matY + matSize / 2, '×', {
        size: 22,
        weight: 700,
        color: c.textMuted,
        align: 'center',
    })
    drawTile(bx, matY, 'Bs (16×16)', '256 floats · 1,024 B', blue, false, true, {
        r: 26,
        c: 48,
        color: red,
    })
    fig.arrow(bx + matSize + 12, matY + matSize / 2, cx - 12, matY + matSize / 2, {
        color: green,
        width: 2,
        head: 7,
    })
    drawTile(cx, matY, 'C (16×16)', '256 outputs', green, true, true, {
        r: 48,
        c: 48,
        color: green,
    })

    // Right-side quantitative intensity readout (frameless, crisp)
    const rx = 534
    fig.text(rx, 80, 'Each As / Bs entry reused 16×', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rx, 108, 'Operands:', { size: 12, color: c.textSecondary })
    fig.text(rx + 84, 108, '2,048 B', {
        size: 13,
        weight: 600,
        color: blue,
        mono: true,
    })
    fig.text(rx, 134, 'Compute:', { size: 12, color: c.textSecondary })
    fig.text(rx + 84, 134, '8,192 FLOPs', {
        size: 13,
        weight: 600,
        color: green,
        mono: true,
    })
    fig.rect(rx - 6, 154, 210, 36, {
        fill: tint(green, c.bg, theme === 'light' ? 0.16 : 0.26),
        stroke: green,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(rx + 99, 172, 'Intensity = 4.0 FLOP/B', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // Hairline divider
    fig.line(32, 224, 728, 224, { color: c.borderSubtle, width: 1 })

    // --- Bottom: Two-Barrier K-Panel Loop timeline + aligned Edge-Thread rule ---
    fig.text(32, 240, 'Two-barrier K-panel loop', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const barY = 282
    const barH = 44

    // Stage 1: Load & zero-fill
    fig.rect(36, barY, 198, barH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.18 : 0.28),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(135, barY + 15, '1. Stage As & Bs', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(135, barY + 32, 'zero-fill OOB entries', {
        size: 12,
        color: blue,
        align: 'center',
    })

    // Barrier 1: RAW
    fig.rect(252, barY - 6, 86, barH + 12, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.24 : 0.34),
        stroke: warm,
        strokeWidth: 2,
        radius: 6,
    })
    fig.text(295, barY + 13, 'RAW', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(295, barY + 31, 'sync()', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Stage 2: Compute 16 FMAs
    fig.rect(356, barY, 210, barH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.18 : 0.28),
        stroke: green,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(461, barY + 15, '2. Multiply-Accumulate', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(461, barY + 32, '16 FMAs / thread', {
        size: 12,
        color: green,
        align: 'center',
        mono: true,
    })

    // Barrier 2: WAR
    fig.rect(584, barY - 6, 86, barH + 12, {
        fill: tint(red, c.bg, theme === 'light' ? 0.22 : 0.32),
        stroke: red,
        strokeWidth: 2,
        radius: 6,
    })
    fig.text(627, barY + 13, 'WAR', {
        size: 13,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.text(627, barY + 31, 'sync()', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Connecting arrows
    fig.arrow(235, barY + 22, 250, barY + 22, { color: c.textMuted, width: 1.5, head: 5.5 })
    fig.arrow(339, barY + 22, 354, barY + 22, { color: c.textMuted, width: 1.5, head: 5.5 })
    fig.arrow(567, barY + 22, 582, barY + 22, { color: c.textMuted, width: 1.5, head: 5.5 })

    // Next-k loop return indicator (cleanly tucked between title and boxes)
    const loopY = 260
    fig.path(`M670 ${barY + 22} H718 V${loopY} H135 V${barY - 4}`, {
        color: c.textMuted,
        width: 1.25,
        dash: '4 3',
    })
    fig.arrow(135, barY - 10, 135, barY - 1, { color: c.textMuted, width: 1.25, head: 5 })
    fig.text(718, loopY - 14, 'next k-tile', {
        size: 12,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    // Edge-thread rule strip cleanly aligned underneath
    const edgeY = 374
    fig.rect(36, edgeY - 22, 688, 44, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: tint(warm, c.bg, 0.45),
        strokeWidth: 1,
        radius: 6,
    })
    fig.text(50, edgeY, 'Edge thread (row ≥ M, col < N):', {
        size: 13,
        weight: 600,
        color: warm,
    })
    fig.text(286, edgeY, 'Zero As', { size: 13, weight: 600, color: warm })
    fig.arrow(342, edgeY, 362, edgeY, { color: c.textMuted, width: 1.3, head: 5 })
    fig.text(370, edgeY, 'Load Bs', { size: 13, weight: 600, color: blue })
    fig.arrow(428, edgeY, 448, edgeY, { color: c.textMuted, width: 1.3, head: 5 })
    fig.text(456, edgeY, 'Hit RAW & WAR', { size: 13, weight: 600, color: green })
    fig.arrow(566, edgeY, 586, edgeY, { color: c.textMuted, width: 1.3, head: 5 })
    fig.text(594, edgeY, 'Skip C store', { size: 13, weight: 600, color: red })

    return fig.render()
}

export default create
