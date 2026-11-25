import type { ThemeMode } from 'vizmatic'
import { layoutCellGrid } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 425
export const alt =
    'A five-token packed block holds Doc 0 (tokens 11, 12, 99 at positions 0..2) and Doc 1 (tokens 21, 99 at positions 3..4). On the left, the 5x5 block-diagonal causal mask allows within-document attention only and masks cross-document cells. On the right, aligned next-token targets [12, 99, -100, 99, -100] mask both the Doc 0 boundary at position 2 and end-of-block position 4 so exactly 3 targets enter the loss.'

export const ignore = -100
export const tokens = [
    { position: 0, documentId: 0, tokenId: 11 },
    { position: 1, documentId: 0, tokenId: 12 },
    { position: 2, documentId: 0, tokenId: 99 },
    { position: 3, documentId: 1, tokenId: 21 },
    { position: 4, documentId: 1, tokenId: 99 },
]
export const visibility = tokens.map((query) =>
    tokens.map((key) =>
        Number(key.position <= query.position && key.documentId === query.documentId),
    ),
)
export const alreadyShiftedTargets = tokens.map((token, index) =>
    index + 1 < tokens.length && token.documentId === tokens[index + 1]!.documentId
        ? tokens[index + 1]!.tokenId
        : ignore,
)
export const unshiftedLabels = tokens.map((token, index) =>
    index > 0 && token.documentId !== tokens[index - 1]!.documentId ? ignore : token.tokenId,
)
export const targetsAfterInternalShift = unshiftedLabels.slice(1)
export const lossPositions = alreadyShiftedTargets.flatMap((target, position) =>
    target === ignore ? [] : [position],
)
export const maskGrid = layoutCellGrid({ x: 80, y: 92, width: 220, height: 220, rows: 5, columns: 5 })
export const rows = {
    attentionInput: layoutCellGrid({ x: 80, y: 56, width: 220, height: 28, rows: 1, columns: 5 }),
    externalInput: layoutCellGrid({ x: 396, y: 110, width: 350, height: 38, rows: 1, columns: 5 }),
    externalTarget: layoutCellGrid({ x: 396, y: 198, width: 350, height: 38, rows: 1, columns: 5 }),
    modelLabels: layoutCellGrid({ x: 396, y: 288, width: 350, height: 38, rows: 1, columns: 5 }),
    modelTarget: layoutCellGrid({ x: 396, y: 340, width: 350, height: 38, rows: 1, columns: 5 }),
}
export const externalTransfers = lossPositions.map((to) => ({
    from: to + 1,
    to,
    tokenId: alreadyShiftedTargets[to],
}))
export const internalTransfers = targetsAfterInternalShift.map((tokenId, to) => ({
    from: to + 1,
    to,
    tokenId,
}))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const muted = c.textSecondary

    const docColor = (id: number) => (id === 0 ? purple : cyan)

    // 5x5 Block-Diagonal Attention Mask
    fig.text(18, 22, '1. Block-diagonal causal mask', { size: 16, weight: 700 })
    fig.text(18, 44, 'Doc 0 (0-2) & Doc 1 (3-4) isolated', {
        size: 14,
        color: muted,
    })

    const gX = 68
    const gY = 98
    const cell = 42
    const gap = 4

    // Column & row headers
    tokens.forEach((t, i) => {
        const cx = gX + i * (cell + gap) + cell / 2
        const cy = gY + i * (cell + gap) + cell / 2
        fig.text(cx, gY - 16, `k${i}`, {
            size: 14,
            mono: true,
            weight: 600,
            color: docColor(t.documentId),
            align: 'center',
        })
        fig.text(gX - 12, cy, `q${i}`, {
            size: 14,
            mono: true,
            weight: 600,
            color: docColor(t.documentId),
            align: 'right',
        })
    })

    visibility.forEach((row, r) => {
        row.forEach((v, k) => {
            const x = gX + k * (cell + gap)
            const y = gY + r * (cell + gap)
            const col = docColor(tokens[r]!.documentId)
            if (v === 1) {
                fig.rect(x, y, cell, cell, {
                    fill: tint(col, c.bg, 0.34),
                    stroke: col,
                    strokeWidth: 1.4,
                    radius: 5,
                })
                fig.text(x + cell / 2, y + cell / 2, '1', {
                    size: 14.5,
                    mono: true,
                    weight: 700,
                    color: c.textPrimary,
                    align: 'center',
                })
            } else {
                fig.rect(x, y, cell, cell, {
                    fill: tint(c.textMuted, c.bg, 0.06),
                    stroke: c.borderSubtle,
                    strokeWidth: 0.9,
                    radius: 5,
                })
                fig.line(x + 11, y + cell - 11, x + cell - 11, y + 11, {
                    color: c.textMuted,
                    width: 1,
                    opacity: 0.38,
                })
            }
        })
    })

    // Gold document divider line between pos 2 and pos 3
    const divOff = 3 * (cell + gap) - gap / 2
    fig.line(gX + divOff, gY - 6, gX + divOff, gY + 5 * cell + 4 * gap + 4, {
        color: warm,
        width: 2,
        dash: '4 3',
    })
    fig.line(gX - 6, gY + divOff, gX + 5 * cell + 4 * gap + 4, gY + divOff, {
        color: warm,
        width: 2,
        dash: '4 3',
    })

    // Legend below matrix
    fig.rect(42, 356, 13, 13, { fill: tint(purple, c.bg, 0.34), stroke: purple, strokeWidth: 1.2, radius: 3 })
    fig.text(62, 363, 'Doc 0', { size: 14, weight: 700, color: purple })
    fig.rect(128, 356, 13, 13, { fill: tint(cyan, c.bg, 0.34), stroke: cyan, strokeWidth: 1.2, radius: 3 })
    fig.text(148, 363, 'Doc 1', { size: 14, weight: 700, color: cyan })
    fig.line(212, 363, 228, 363, { color: warm, width: 2, dash: '4 3' })
    fig.text(236, 363, 'boundary', { size: 14, color: warm })

    // Divider between left and right
    fig.line(332, 20, 332, 404, { color: c.borderSubtle, width: 1 })

    // Aligned Token Stream & Shifted Loss Targets
    const rx = 352
    fig.text(rx, 22, '2. Shift once & mask boundaries', { size: 16, weight: 700 })
    fig.text(rx, 44, 'EOS (pos 2) and tail (pos 4) get −100', {
        size: 14,
        color: muted,
    })

    const boxW = 68
    const boxGap = 8
    const colX = (i: number) => rx + i * (boxW + boxGap)

    // Row 1: Input tokens x
    const yIn = 98
    fig.text(rx, 78, 'Input tokens x', { size: 14, weight: 600, color: muted })
    tokens.forEach((t, i) => {
        const x = colX(i)
        const col = docColor(t.documentId)
        fig.rect(x, yIn, boxW, 48, {
            fill: tint(col, c.bg, 0.18),
            stroke: col,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(x + boxW / 2, yIn + 16, `id ${t.tokenId}`, {
            size: 14,
            mono: true,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x + boxW / 2, yIn + 36, i === 2 || i === 4 ? 'EOS' : `pos ${i}`, {
            size: 14,
            mono: true,
            color: col,
            align: 'center',
        })
    })

    // Row 2: Pre-shifted targets (arrows pass cleanly with label positioned below row)
    const yShift = 180
    alreadyShiftedTargets.forEach((val, i) => {
        const x = colX(i)
        const isMask = val === ignore
        const col = isMask ? warm : green
        fig.arrow(x + boxW / 2, yIn + 50, x + boxW / 2, yShift - 3, {
            color: isMask ? c.textMuted : col,
            width: 1.6,
            head: 6,
            dash: isMask ? '3 3' : undefined,
        })
        fig.rect(x, yShift, boxW, 48, {
            fill: tint(col, c.bg, isMask ? 0.14 : 0.18),
            stroke: col,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(x + boxW / 2, yShift + 16, isMask ? '−100' : `id ${val}`, {
            size: 14,
            mono: true,
            weight: 700,
            color: isMask ? warm : c.textPrimary,
            align: 'center',
        })
        fig.text(x + boxW / 2, yShift + 36, isMask ? 'mask' : 'score', {
            size: 14,
            weight: 600,
            color: col,
            align: 'center',
        })
    })
    fig.text(rx, yShift + 64, 'Pre-shifted targets (aligned at pos t)', {
        size: 14,
        weight: 600,
        color: muted,
    })

    // Row 3: Unshifted labels (when model shifts internally)
    const yUn = 304
    fig.text(rx, 284, 'Or unshifted labels (internal shift)', {
        size: 14,
        weight: 600,
        color: muted,
    })
    unshiftedLabels.forEach((val, i) => {
        const x = colX(i)
        const isMask = val === ignore
        const col = isMask ? warm : docColor(tokens[i]!.documentId)
        fig.rect(x, yUn, boxW, 42, {
            fill: tint(col, c.bg, 0.12),
            stroke: col,
            strokeWidth: 1.3,
            radius: 6,
        })
        fig.text(x + boxW / 2, yUn + 21, isMask ? '−100' : String(val), {
            size: 14,
            mono: true,
            weight: 700,
            color: isMask ? warm : c.textPrimary,
            align: 'center',
        })
    })

    fig.text(rx, 376, '3 active targets (pos 0, 1, 3) · 0 cross-doc loss.', {
        size: 14,
        weight: 600,
        color: green,
    })

    return fig.render()
}

export default create('dark')
