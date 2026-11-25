import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 456
export const alt =
    'Side-by-side comparison of early and late chunking on an eight-word sentence split into spans of three, three, and two tokens. On the left (early), self-attention is restricted to block-diagonal chunk spans so pooled states h4 to h6 see only words 4 to 6. On the right (late), full bidirectional attention runs across all 8 tokens before pooling h4 to h6 into a contextual chunk vector.'

const GROUPS = [0, 0, 0, 1, 1, 1, 2, 2] as const
const GROUP_BOUNDS = [0, 3, 6, 8] as const
const GROUP_LABELS = ['1–3', '4–6', '7–8'] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const purple = fig.tone('purple')
    const spanColors = [blue, cyan, purple] as const

    // ── Top: 8-Word Sentence Spans (3 / 3 / 2) ───────────────────────────────
    const topSpans = [
        { x: 20, w: 232, text: '1–3: The engineer checks', color: blue },
        { x: 264, w: 244, text: '4–6: each runbook before', color: cyan },
        { x: 520, w: 220, text: '7–8: every deployment.', color: purple },
    ] as const
    for (const s of topSpans) {
        fig.rect(s.x, 14, s.w, 30, {
            fill: withColorAlpha(s.color, 0.12),
            stroke: s.color,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(s.x + s.w / 2, 29, s.text, {
            size: 14,
            weight: 700,
            color: s.color,
            align: 'center',
        })
    }

    fig.line(380, 62, 380, 440, { color: c.borderSubtle, width: 1, dash: '4 4' })

    const cell = 20
    const gap = 3
    const gridSize = 8 * cell + 7 * gap // 181px

    const drawSide = (originX: number, panelX: number, late: boolean) => {
        const accent = late ? purple : blue
        const title = late ? 'Late · Encode, then pool' : 'Early · Split, then encode'
        const sub = late ? 'Full-sequence self-attention' : 'Block-diagonal attention only'

        fig.text(panelX, 72, title, { size: 16, weight: 700, color: accent })
        fig.text(panelX, 94, sub, { size: 13, color: c.textSecondary })

        const originY = 152

        // Column & Row headers (13px crisp labels)
        fig.text(originX + gridSize / 2, originY - 36, 'Input tokens', {
            size: 13,
            weight: 600,
            color: c.textMuted,
            align: 'center',
        })
        fig.text(originX - 12, originY - 18, 'Out', {
            size: 13,
            weight: 600,
            color: c.textMuted,
            align: 'right',
        })

        GROUP_LABELS.forEach((lbl, idx) => {
            const start = GROUP_BOUNDS[idx]!
            const end = GROUP_BOUNDS[idx + 1]!
            const spanPx = (end - start) * (cell + gap) - gap
            const cx = originX + start * (cell + gap) + spanPx / 2
            const cy = originY + start * (cell + gap) + spanPx / 2
            fig.text(cx, originY - 16, lbl, {
                size: 13,
                mono: true,
                weight: 700,
                color: spanColors[idx],
                align: 'center',
            })
            fig.text(originX - 12, cy, lbl, {
                size: 13,
                mono: true,
                weight: 700,
                color: spanColors[idx],
                align: 'right',
            })
        })

        // 8x8 Attention cells
        for (let r = 0; r < 8; r++) {
            for (let col = 0; col < 8; col++) {
                const sameSpan = GROUPS[r] === GROUPS[col]
                const active = late || sameSpan
                const selectedRow = r >= 3 && r < 6
                const color = active ? spanColors[GROUPS[r]!]! : c.textMuted
                fig.rect(originX + col * (cell + gap), originY + r * (cell + gap), cell, cell, {
                    fill: color,
                    opacity: active ? (selectedRow ? 0.88 : 0.48) : 0.1,
                    stroke: active ? color : c.borderSubtle,
                    strokeWidth: 0.75,
                    radius: 3,
                })
            }
        }

        // Chunk boundary hairlines inside matrix
        for (const pos of [3, 6]) {
            const off = pos * (cell + gap) - gap / 2
            fig.line(originX + off, originY - 3, originX + off, originY + gridSize + 3, {
                color: c.textMuted,
                width: 1.25,
                dash: '3 3',
                opacity: 0.75,
            })
            fig.line(originX - 3, originY + off, originX + gridSize + 3, originY + off, {
                color: c.textMuted,
                width: 1.25,
                dash: '3 3',
                opacity: 0.75,
            })
        }

        // Highlighted pooling band (rows 4-6)
        const bandY = originY + 3 * (cell + gap) - 3
        const bandH = 3 * cell + 2 * gap + 6
        fig.rect(originX - 4, bandY, gridSize + 8, bandH, {
            stroke: cyan,
            strokeWidth: 2,
            radius: 5,
        })

        // Downward arrow from pooled rows into pooling bar
        const poolTitleY = 362
        fig.text(panelX, poolTitleY, 'Mean-pool span 4–6:', {
            size: 13,
            weight: 600,
            color: c.textSecondary,
        })

        const boxY = 384
        const boxH = 34
        const stateColor = late ? purple : cyan
        const states = ['h₄', 'h₅', 'h₆'] as const
        states.forEach((st, i) => {
            const sx = panelX + i * 54
            fig.rect(sx, boxY, 46, boxH, {
                fill: withColorAlpha(stateColor, 0.15),
                stroke: stateColor,
                strokeWidth: 1.5,
                radius: 6,
            })
            fig.text(sx + 23, boxY + boxH / 2, st, {
                size: 15,
                mono: true,
                weight: 700,
                color: stateColor,
                align: 'center',
            })
        })

        const arrStart = panelX + 166
        const arrEnd = arrStart + 36
        fig.arrow(arrStart, boxY + boxH / 2, arrEnd, boxY + boxH / 2, {
            color: stateColor,
            width: 2,
            head: 7,
        })

        const outX = arrEnd + 8
        const outW = 132
        fig.rect(outX, boxY, outW, boxH, {
            fill: withColorAlpha(stateColor, 0.24),
            stroke: stateColor,
            strokeWidth: 1.8,
            radius: 6,
        })
        fig.text(outX + outW / 2, boxY + boxH / 2, late ? 'contextual vec' : 'local-only vec', {
            size: 14,
            weight: 700,
            color: stateColor,
            align: 'center',
        })
    }

    drawSide(126, 20, false)
    drawSide(512, 404, true)

    return fig.render()
}

export default create('dark')
