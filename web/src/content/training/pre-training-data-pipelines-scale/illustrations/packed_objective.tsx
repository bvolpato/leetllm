import React, { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    layoutCellGrid,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 860
export const height = 540
export const alt =
    'An authored five-token block chooses independent-document attention. Positions 0 through 4 hold token IDs 11, 12, 99, 21 and 99, with document IDs 0, 0, 0, 1 and 1. A five-by-five matrix allows only causal edges within the same document; query position 3 cannot read key position 2. When the data pipeline shifts targets once, the aligned targets are 12, 99, ignore, 99 and ignore. When the model shifts labels once, supply unshifted labels 11, 12, 99, ignore and 99, producing four targets 12, 99, ignore and 99. Only three targets contribute loss; the final input has no next token in this block.'

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
    index + 1 < tokens.length && token.documentId === tokens[index + 1].documentId
        ? tokens[index + 1].tokenId
        : ignore,
)
export const unshiftedLabels = tokens.map((token, index) =>
    index > 0 && token.documentId !== tokens[index - 1].documentId ? ignore : token.tokenId,
)
export const targetsAfterInternalShift = unshiftedLabels.slice(1)
export const lossPositions = alreadyShiftedTargets.flatMap((target, position) =>
    target === ignore ? [] : [position],
)

export const maskGrid = layoutCellGrid({
    x: 100,
    y: 140,
    width: 250,
    height: 250,
    rows: 5,
    columns: 5,
})

export const rows = {
    attentionInput: layoutCellGrid({ x: 100, y: 95, width: 250, height: 32, rows: 1, columns: 5 }),
    externalInput: layoutCellGrid({ x: 490, y: 140, width: 310, height: 36, rows: 1, columns: 5 }),
    externalTarget: layoutCellGrid({ x: 490, y: 220, width: 310, height: 36, rows: 1, columns: 5 }),
    modelLabels: layoutCellGrid({ x: 490, y: 310, width: 310, height: 36, rows: 1, columns: 5 }),
    modelTarget: layoutCellGrid({ x: 490, y: 370, width: 310, height: 36, rows: 1, columns: 5 }),
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

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
            mono,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const docColor = (id: number) => (id === 0 ? purple : cyan)

    // Attention matrix cells
    const cellElements: ReactNode[] = []
    const cellSize = 42
    const startX = 110
    const startY = 150

    visibility.forEach((row, r) => {
        row.forEach((val, col) => {
            const isVisible = val === 1
            const color = isVisible ? docColor(tokens[r].documentId) : c.bgCardAlt
            cellElements.push(
                SvgFrame({
                    c,
                    x: startX + col * (cellSize + 4),
                    y: startY + r * (cellSize + 4),
                    width: cellSize,
                    height: cellSize,
                    rx: 4,
                    fill: isVisible ? color : c.bgCardAlt,
                    stroke: isVisible ? color : c.borderSubtle,
                    strokeWidth: 1,
                    key: `cell-${r}-${col}`,
                }),
            )
        })
    })

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Left Panel (Attention Mask)
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 390,
            height: 430,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        // Right Panel (Target Alignment)
        SvgFrame({
            c,
            x: 430,
            y: 50,
            width: 410,
            height: 430,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),
        ...cellElements,
        // Block 0 outline in matrix
        SvgFrame({
            c,
            x: startX - 2,
            y: startY - 2,
            width: 3 * (cellSize + 4),
            height: 3 * (cellSize + 4),
            rx: 6,
            fill: 'transparent',
            stroke: purple,
            strokeWidth: 2,
            key: 'box-doc-0',
        }),
        // Block 1 outline in matrix
        SvgFrame({
            c,
            x: startX + 3 * (cellSize + 4) - 2,
            y: startY + 3 * (cellSize + 4) - 2,
            width: 2 * (cellSize + 4),
            height: 2 * (cellSize + 4),
            rx: 6,
            fill: 'transparent',
            stroke: cyan,
            strokeWidth: 2,
            key: 'box-doc-1',
        }),
        // Sequence tokens representation in right panel
        ...tokens
            .map((tok, i) => {
                const x = 460 + i * 70
                const isLoss = alreadyShiftedTargets[i] !== ignore
                return [
                    // Input token box
                    SvgFrame({
                        c,
                        x,
                        y: 120,
                        width: 58,
                        height: 36,
                        rx: 4,
                        fill: docColor(tok.documentId),
                        stroke: c.borderSubtle,
                        strokeWidth: 1,
                        key: `tok-in-${i}`,
                    }),
                    // Arrow down
                    VectorArrow({
                        x1: x + 29,
                        y1: 162,
                        x2: x + 29,
                        y2: 195,
                        color: isLoss ? c.textPrimary : muted,
                        strokeWidth: 2,
                        arrowSize: 5,
                        key: `arr-${i}`,
                    }),
                    // Shifted target box
                    SvgFrame({
                        c,
                        x,
                        y: 200,
                        width: 58,
                        height: 36,
                        rx: 4,
                        fill: isLoss ? c.bgCardAlt : c.bgCardAlt,
                        stroke: isLoss ? docColor(tok.documentId) : warm,
                        strokeWidth: 1.5,
                        key: `tok-target-${i}`,
                    }),
                ]
            })
            .flat(),
        // Summary Card in right panel
        SvgFrame({
            c,
            x: 450,
            y: 270,
            width: 370,
            height: 185,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: cyan,
            strokeWidth: 1.5,
            key: 'card-boundary-rules',
        }),
    )

    const cellLabels: ReactNode[] = []
    visibility.forEach((row, r) => {
        row.forEach((val, col) => {
            const isVisible = val === 1
            cellLabels.push(
                label(
                    c,
                    isVisible ? '1' : '0',
                    startX + col * (cellSize + 4),
                    startY + r * (cellSize + 4) + 10,
                    cellSize,
                    20,
                    14,
                    isVisible ? c.textPrimary : muted,
                    'center',
                ),
            )
        })
    })

    const tokenInputLabels = tokens.map((tok, i) =>
        label(c, `id:${tok.tokenId}`, 460 + i * 70, 130, 58, 20, 12, c.textPrimary, 'center'),
    )

    const tokenTargetLabels = tokens.map((tok, i) => {
        const val = alreadyShiftedTargets[i]
        return label(
            c,
            val === ignore ? '−100' : `id:${val}`,
            460 + i * 70,
            210,
            58,
            20,
            12,
            val === ignore ? warm : c.textPrimary,
            'center',
        )
    })

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                {shapeSvg}
            </CanvasItem>
            {label(
                c,
                'Packed Sequences: Block-Diagonal Attention & Shifted Loss Masking',
                20,
                12,
                width - 40,
                30,
                22,
                c.textPrimary,
                'center',
            )}

            {/* Left Panel */}
            {label(c, '1. Document-Isolated Attention Mask', 35, 62, 360, 24, 16, c.textPrimary)}
            {label(
                c,
                '5×5 causal matrix: Doc 0 (tokens 0–2) · Doc 1 (tokens 3–4)',
                35,
                86,
                360,
                20,
                12,
                muted,
            )}

            {label(c, 'Keys →', startX, 120, 100, 20, 12, muted)}
            {label(c, 'Q\n↓', 65, startY + 50, 24, 40, 12, muted, 'center')}
            {cellLabels}
            {label(
                c,
                'Off-diagonal blocks (0): Queries cannot attend across document boundaries',
                35,
                410,
                360,
                20,
                11,
                muted,
            )}
            {label(
                c,
                'Purple: Doc 0 (3×3 causal) · Cyan: Doc 1 (2×2 causal)',
                35,
                435,
                360,
                20,
                11,
                c.textPrimary,
            )}

            {/* Right Panel */}
            {label(
                c,
                '2. Target Alignment & Boundary Masking',
                450,
                62,
                370,
                24,
                16,
                c.textPrimary,
            )}
            {label(
                c,
                'Input tokens aligned with next-token prediction targets',
                450,
                86,
                370,
                20,
                12,
                muted,
            )}

            {label(c, 'Input Token Stream (x)', 450, 102, 200, 18, 11, muted)}
            {tokenInputLabels}

            {label(c, 'Shifted Loss Targets (y)', 450, 182, 200, 18, 11, muted)}
            {tokenTargetLabels}

            {/* Callout Card */}
            {label(c, 'Document Boundary & End-of-Block Rules', 465, 280, 340, 20, 14, cyan)}
            {label(
                c,
                '• Pos 0 & 1: Predict next token within Doc 0 (targets 12, 99) [Active]',
                465,
                304,
                340,
                18,
                11,
                purple,
            )}
            {label(
                c,
                '• Pos 2 (EOS): Masked with −100 to prevent predicting Doc 1 start [Ignored]',
                465,
                326,
                340,
                18,
                11,
                warm,
            )}
            {label(
                c,
                '• Pos 3: Predicts next token within Doc 1 (target 99) [Active]',
                465,
                348,
                340,
                18,
                11,
                cyan,
            )}
            {label(
                c,
                '• Pos 4 (End of block): Masked with −100 (no next token) [Ignored]',
                465,
                370,
                340,
                18,
                11,
                warm,
            )}
            {label(
                c,
                'Net loss: Exactly 3 targets scored. Cross-document leakage is eliminated.',
                465,
                400,
                340,
                20,
                11,
                c.textPrimary,
            )}

            {label(
                c,
                'Packed sequence masking · Prevents artificial cross-document statistical associations',
                20,
                490,
                width - 40,
                24,
                14,
                muted,
                'center',
            )}
        </Board>
    )
}

export default create('dark')
