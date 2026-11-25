import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 435
export const alt =
    'Three attention head sharing topologies across eight query heads alongside a calibrated KV head count chart. Top diagrams show MHA (8 Q heads to 8 KV heads, 1.00x storage), GQA (8 Q heads grouped 4+4 into 2 KV heads, 0.25x storage), and MQA (all 8 Q heads sharing 1 KV head, 0.125x storage). Bottom horizontal bar chart plots stored KV heads per layer on a 0, 2, 4, 6, 8 axis: MHA 8, GQA-2 2, MQA 1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    const mhaPalette = [blue, purple, cyan, green, warm, red, blue, purple]
    const gqaPalette = [blue, blue, blue, blue, warm, warm, warm, warm]
    const mqaPalette = Array.from({ length: 8 }, () => purple)

    // --- Top: 3 vivid head-sharing topologies with explicit fan-in lines ---
    const colW = 216
    const colGap = 28
    const startX = 28

    const drawTopology = (
        colIdx: number,
        title: string,
        sub: string,
        ratio: string,
        tone: string,
        qColors: string[],
        kvColors: string[],
        groupMap: number[],
    ) => {
        const cx = startX + colIdx * (colW + colGap)
        const midX = cx + colW / 2

        fig.text(midX, 20, title, { size: 15, weight: 700, color: tone, align: 'center' })
        fig.text(midX, 40, sub, { size: 12, color: c.textSecondary, align: 'center' })

        // 8 Query heads row
        const qSize = 20
        const qGap = 5
        const qRowW = 8 * qSize + 7 * qGap
        const qX0 = midX - qRowW / 2
        const qY = 66
        const qCenters: number[] = []

        fig.text(qX0 - 6, qY + qSize / 2, 'Q', {
            size: 12,
            weight: 700,
            color: c.textMuted,
            align: 'right',
            mono: true,
        })

        for (let i = 0; i < 8; i++) {
            const x = qX0 + i * (qSize + qGap)
            const qc = qColors[i]!
            fig.rect(x, qY, qSize, qSize, {
                fill: tint(qc, c.bg, theme === 'light' ? 0.68 : 0.8),
                stroke: qc,
                strokeWidth: 1.25,
                radius: 4,
            })
            qCenters.push(x + qSize / 2)
        }

        // KV heads row (K stacked over V)
        const kvCount = kvColors.length
        const kvW = kvCount === 8 ? 20 : kvCount === 2 ? 36 : 44
        const kvH = 18
        const kvGap = kvCount === 8 ? 5 : 44
        const kvRowW = kvCount * kvW + (kvCount - 1) * kvGap
        const kvX0 = midX - kvRowW / 2
        const kvY = 138
        const kvCenters: number[] = []

        for (let j = 0; j < kvCount; j++) {
            const x = kvX0 + j * (kvW + kvGap)
            kvCenters.push(x + kvW / 2)
        }

        // Fan-in connector lines (Q -> assigned KV head)
        for (let i = 0; i < 8; i++) {
            const qx = qCenters[i]!
            const kvc = kvCenters[groupMap[i]!]!
            const qc = qColors[i]!
            fig.line(qx, qY + qSize + 2, kvc, kvY - 4, {
                color: qc,
                width: 1.5,
                opacity: theme === 'light' ? 0.72 : 0.82,
            })
        }

        fig.text(kvX0 - 8, kvY + kvH / 2, 'K', {
            size: 12,
            weight: 700,
            color: c.textMuted,
            align: 'right',
            mono: true,
        })
        fig.text(kvX0 - 8, kvY + kvH + 4 + kvH / 2, 'V', {
            size: 12,
            weight: 700,
            color: c.textMuted,
            align: 'right',
            mono: true,
        })

        for (let j = 0; j < kvCount; j++) {
            const x = kvX0 + j * (kvW + kvGap)
            const kc = kvColors[j]!
            fig.rect(x, kvY, kvW, kvH, {
                fill: tint(kc, c.bg, theme === 'light' ? 0.72 : 0.84),
                stroke: kc,
                strokeWidth: 1.4,
                radius: 4,
            })
            fig.rect(x, kvY + kvH + 4, kvW, kvH, {
                fill: tint(kc, c.bg, theme === 'light' ? 0.45 : 0.56),
                stroke: kc,
                strokeWidth: 1.4,
                radius: 4,
            })
        }

        fig.text(midX, 200, `KV cache: ${ratio}`, {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
    }

    drawTopology(0, 'MHA · 8Q : 8KV', '8 groups · 1 Q each', '1.00×', blue, mhaPalette, mhaPalette, [
        0, 1, 2, 3, 4, 5, 6, 7,
    ])
    drawTopology(
        1,
        'GQA · 8Q : 2KV',
        '2 groups · 4 Q each',
        '0.25× (4× less)',
        warm,
        gqaPalette,
        [blue, warm],
        [0, 0, 0, 0, 1, 1, 1, 1],
    )
    drawTopology(
        2,
        'MQA · 8Q : 1KV',
        '1 group · 8 Q total',
        '0.125× (8× less)',
        purple,
        mqaPalette,
        [purple],
        [0, 0, 0, 0, 0, 0, 0, 0],
    )

    // Hairline divider
    fig.line(28, 224, 732, 224, { color: c.borderSubtle, width: 1 })

    // --- Bottom: Calibrated horizontal bar chart with 0, 2, 4, 6, 8 ticks ---
    fig.text(28, 248, 'Key-value heads stored per layer', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const barLeft = 174
    const barRight = 668
    const maxHeads = 8
    const xOf = (h: number) => barLeft + (h / maxHeads) * (barRight - barLeft)
    const axisTop = 272
    const axisBot = 384

    for (const tick of [0, 2, 4, 6, 8]) {
        const tx = xOf(tick)
        fig.line(tx, axisTop, tx, axisBot, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.5 : 1,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(tx, axisBot + 16, String(tick), {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(barRight + 34, axisBot + 16, 'KV heads', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    const rows = [
        { label: 'MHA (H_kv = 8)', val: 8, text: '8 KV', color: blue },
        { label: 'GQA-2 (H_kv = 2)', val: 2, text: '2 KV', color: warm },
        { label: 'MQA (H_kv = 1)', val: 1, text: '1 KV', color: purple },
    ]
    rows.forEach((r, idx) => {
        const cy = 294 + idx * 36
        const w = Math.max(16, xOf(r.val) - barLeft)
        fig.text(barLeft - 12, cy, r.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })
        fig.rect(barLeft, cy - 11, w, 22, {
            fill: tint(r.color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: r.color,
            strokeWidth: 1.4,
            radius: 4,
        })
        fig.text(barLeft + w + 10, cy, r.text, {
            size: 13,
            weight: 700,
            color: r.color,
            mono: true,
        })
    })

    return fig.render()
}

export default create
