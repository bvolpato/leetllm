import type { ThemeMode, ToneName } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 435
export const alt =
    'Four token pieces rain (ID 2), ·falls (ID 5), ·soft (ID 1), and ly (ID 6) index directly into an 8-by-3 embedding matrix W_E. Curved arrows trace each token ID to its corresponding highlighted row in W_E (leaving rows 0, 3, 4, and 7 unused) and gather those four rows in sequence order into the 4-by-3 model input tensor E[ids].'

const TOKENS: Array<{ piece: string; id: number; tone: ToneName; vals: [string, string, string] }> = [
    { piece: 'rain', id: 2, tone: 'blue', vals: ['0.8', '−0.1', '0.3'] },
    { piece: '·falls', id: 5, tone: 'cyan', vals: ['−0.4', '0.7', '0.2'] },
    { piece: '·soft', id: 1, tone: 'purple', vals: ['0.2', '0.5', '−0.6'] },
    { piece: 'ly', id: 6, tone: 'warm', vals: ['0.1', '−0.3', '0.9'] },
]

const byRowId = new Map(TOKENS.map((t) => [t.id, t]))

function bezier(x1: number, y1: number, x2: number, y2: number): string {
    const mx = (x1 + x2) / 2
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}C${mx.toFixed(1)} ${y1.toFixed(1)},${mx.toFixed(1)} ${y2.toFixed(1)},${x2.toFixed(1)} ${y2.toFixed(1)}`
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isDark = theme === 'dark'

    // Column headers
    fig.text(84, 22, '1. Token IDs [2, 5, 1, 6]', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(352, 22, '2. Embedding table W_E  (8 × 3)', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(624, 22, '3. Input tensor E[ids]  (4 × 3)', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    // ─── CENTER: 8x3 W_E embedding matrix ───
    const weX = 260
    const weY = 58
    const weCellW = 54
    const weRowH = 34
    const weGap = 5
    const weW = 3 * weCellW + 2 * weGap
    const weTotalH = 8 * weRowH + 7 * weGap

    const weRowCenterY = (rowIdx: number) => weY + rowIdx * (weRowH + weGap) + weRowH / 2

    // ─── LEFT: 4 token pieces -> IDs ───
    const tokX = 16
    const tokW = 136
    const tokH = 42
    const tokY = (pos: number) => 86 + pos * 74

    // ─── RIGHT: Gathered (4, 3) output tensor ───
    const outX = 516
    const outCellW = 54
    const outRowH = 42
    const outGap = 32
    const outW = 3 * outCellW + 2 * weGap
    const outY = (pos: number) => 86 + pos * (outRowH + outGap)

    // Draw connectors BEHIND nodes/matrices for crisp visual layering
    TOKENS.forEach((t, pos) => {
        const col = fig.tone(t.tone)
        const ly = tokY(pos) + tokH / 2
        const wy = weRowCenterY(t.id)
        const ry = outY(pos) + outRowH / 2

        // Token ID -> W_E row
        fig.path(bezier(tokX + tokW + 2, ly, weX - 30, wy), {
            color: col,
            width: 2.1,
            opacity: 0.9,
        })
        fig.circle(weX - 30, wy, 3.2, { fill: col })

        // W_E row -> E[ids] row
        fig.path(bezier(weX + weW + 4, wy, outX - 8, ry), {
            color: col,
            width: 2.1,
            opacity: 0.9,
        })
        // Small arrowhead tip entering E[ids]
        fig.path(
            `M${outX - 2} ${ry}L${outX - 9} ${ry - 4}L${outX - 9} ${ry + 4}Z`,
            { fill: col },
        )
    })

    // Draw Left token pills
    TOKENS.forEach((t, pos) => {
        const col = fig.tone(t.tone)
        const y = tokY(pos)
        fig.rect(tokX, y, tokW, tokH, {
            fill: tint(col, c.bg, isDark ? 0.28 : 0.18),
            stroke: col,
            strokeWidth: 1.6,
            radius: 6,
        })
        fig.text(tokX + 10, y + tokH / 2, t.piece, {
            size: 14,
            color: c.textPrimary,
            mono: true,
            weight: 700,
        })
        fig.text(tokX + tokW - 10, y + tokH / 2, `→ ${t.id}`, {
            size: 14,
            color: col,
            align: 'right',
            mono: true,
            weight: 800,
        })
    })

    // Draw Center 8x3 W_E matrix rows
    for (let r = 0; r < 8; r++) {
        const y = weY + r * (weRowH + weGap)
        const match = byRowId.get(r)
        const col = match ? fig.tone(match.tone) : c.textMuted

        // Row index label
        fig.text(weX - 10, y + weRowH / 2, `${r}`, {
            size: 13.5,
            color: match ? col : c.textMuted,
            align: 'right',
            mono: true,
            weight: match ? 800 : 400,
        })

        for (let j = 0; j < 3; j++) {
            const x = weX + j * (weCellW + weGap)
            fig.rect(x, y, weCellW, weRowH, {
                fill: match
                    ? tint(col, c.bg, isDark ? 0.34 : 0.22)
                    : isDark
                      ? '#151a24'
                      : '#f2eee5',
                stroke: match ? col : c.borderSubtle,
                strokeWidth: match ? 1.6 : 0.9,
                radius: 4,
            })
            fig.text(x + weCellW / 2, y + weRowH / 2, match ? match.vals[j]! : '·', {
                size: 13.5,
                color: match ? c.textPrimary : c.textMuted,
                align: 'center',
                mono: true,
                weight: match ? 700 : 400,
            })
        }
    }

    // Shape brace under W_E
    fig.brace(weX, weY + weTotalH + 10, weX + weW, weY + weTotalH + 10, 'V = 8 rows × d = 3', {
        side: 1,
        depth: 9,
        color: c.textMuted,
        labelColor: c.textSecondary,
        labelSize: 13,
    })

    // Draw Right (4, 3) gathered input tensor
    TOKENS.forEach((t, pos) => {
        const col = fig.tone(t.tone)
        const y = outY(pos)
        fig.text(outX + outW + 8, y + outRowH / 2, `pos ${pos}`, {
            size: 12.5,
            color: col,
            mono: true,
            weight: 700,
        })
        for (let j = 0; j < 3; j++) {
            const x = outX + j * (outCellW + weGap)
            fig.rect(x, y, outCellW, outRowH, {
                fill: tint(col, c.bg, isDark ? 0.34 : 0.22),
                stroke: col,
                strokeWidth: 1.6,
                radius: 4,
            })
            fig.text(x + outCellW / 2, y + outRowH / 2, t.vals[j]!, {
                size: 13.5,
                color: c.textPrimary,
                align: 'center',
                mono: true,
                weight: 700,
            })
        }
    })

    // Shape brace under E[ids]
    const outBot = outY(3) + outRowH + 10
    fig.brace(outX, outBot, outX + outW, outBot, 'shape (4, 3)', {
        side: 1,
        depth: 9,
        color: c.textMuted,
        labelColor: c.textSecondary,
        labelSize: 13,
    })

    return fig.render()
}

export default create('dark')
