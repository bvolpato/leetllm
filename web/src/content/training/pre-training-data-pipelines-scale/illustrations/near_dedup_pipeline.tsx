import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 435
export const alt =
    'A MinHash LSH walkthrough compares 32-hash signatures (8 bands of 4 rows) for documents A and B: bands 1 and 3 match identically across all 4 rows and collide in the same LSH bucket, flagging (A, B) as a candidate pair. Exact bigram verification computes Jaccard 6/10 = 0.60 (above the 0.50 cutoff), merging A and B into one connected component that keeps A and drops B while disjoint document C stays kept.'

export const documents = [
    { id: 'A', text: 'The key policy says stale accounts need security review.' },
    { id: 'B', text: 'The key policy says stale accounts require security review.' },
    { id: 'C', text: 'Audit logs record deployment rollback events.' },
]
const bigrams = (text: string) => {
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
    return new Set(tokens.slice(0, -1).map((token, i) => token + ' ' + tokens[i + 1]))
}
export const shingleSets = documents.map((doc) => ({ id: doc.id, values: bigrams(doc.text) }))
export const shared = [...shingleSets[0]!.values].filter((value) =>
    shingleSets[1]!.values.has(value),
)
export const differences = shingleSets
    .slice(0, 2)
    .map((row, i) => [...row.values].filter((value) => !shingleSets[1 - i]!.values.has(value)))
export const unionSize = new Set([...shingleSets[0]!.values, ...shingleSets[1]!.values]).size
export const jaccard = shared.length / unionSize
export const threshold = 0.5
export const signatureHex: Record<string, string[]> = {
    A: [
        '442944f914abe43a',
        '030b62d21ca622c1',
        '03f62a6f76564f70',
        '16bd27d148c790fb',
        '109f7012a5dd0c28',
        '0b0b05eb97d540f4',
        '0dddf4b7179f16b3',
        '043df96cd35df552',
        '0870ab55fc4e86bd',
        '2de9c7ae7cfb966c',
        '32a24819ca32196c',
        '3bb939ec3bc84a6c',
        '46ce182535e00dd1',
        '351f99d7e846b9b1',
        '08f4ffeb2a8bf6dc',
        '3e1fe3771f5742c3',
        '1c09f257ca82f3db',
        '3c3a7489d4296b71',
        '179f2ea7a30df93c',
        '140c8ec82eb90862',
        '110d1aa14445f44a',
        '0620dc0a35dc4658',
        '0a5fe9d776ab6504',
        '2482e5263d92e7e6',
        '1b883da26a1fbfb5',
        '043e09e16fa8ca61',
        '117653bd308ee0ee',
        '02091938c703dea9',
        '15344ea199d41e29',
        '066882939d6d4d91',
        '2eadf8708eaf6aa7',
        '12104869ca3ee5a5',
    ],
    B: [
        '141f72d074f525fc',
        '030b62d21ca622c1',
        '03f62a6f76564f70',
        '19f877c049ec7aa7',
        '109f7012a5dd0c28',
        '0b0b05eb97d540f4',
        '0dddf4b7179f16b3',
        '043df96cd35df552',
        '1887e2c4ecbb890f',
        '2de9c7ae7cfb966c',
        '32a24819ca32196c',
        '0aed0ea465399a65',
        '46ce182535e00dd1',
        '351f99d7e846b9b1',
        '08f4ffeb2a8bf6dc',
        '3e1fe3771f5742c3',
        '1c09f257ca82f3db',
        '18466055fb2c82c0',
        '179f2ea7a30df93c',
        '140c8ec82eb90862',
        '13bbca4a467c46b1',
        '0620dc0a35dc4658',
        '0a5fe9d776ab6504',
        '2482e5263d92e7e6',
        '0d33c5eab805813d',
        '097eb351b88f7f75',
        '117653bd308ee0ee',
        '02091938c703dea9',
        '15344ea199d41e29',
        '066882939d6d4d91',
        '2eadf8708eaf6aa7',
        '12104869ca3ee5a5',
    ],
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    // 8 bands x 4 MinHash rows comparing Doc A vs Doc B
    fig.text(16, 22, '1. MinHash LSH bands (b=8, r=4)', { size: 15.5, weight: 700 })
    fig.text(16, 44, 'All 4 hashes match to trigger a collision', {
        size: 14,
        color: muted,
    })

    const bandX = 76
    const cellW = 24
    const cellH = 24
    const cellGap = 4
    const bandGap = 11
    const startY = 80

    // Column headers r0..r3
    ;[0, 1, 2, 3].forEach((r) => {
        fig.text(bandX + r * (cellW + cellGap) + cellW / 2, startY - 14, `r${r}`, {
            size: 14,
            mono: true,
            color: muted,
            align: 'center',
        })
    })
    fig.text(bandX + 4 * (cellW + cellGap) + 10, startY - 14, 'Bucket status', {
        size: 14,
        weight: 600,
        color: muted,
    })

    for (let b = 0; b < 8; b++) {
        const y = startY + b * (cellH + bandGap)
        const matches = [0, 1, 2, 3].map(
            (r) => signatureHex.A![b * 4 + r] === signatureHex.B![b * 4 + r],
        )
        const fullMatch = matches.every(Boolean)

        fig.text(bandX - 8, y + cellH / 2, `Band ${b}`, {
            size: 14,
            mono: true,
            weight: fullMatch ? 700 : 500,
            color: fullMatch ? cyan : muted,
            align: 'right',
        })

        matches.forEach((m, r) => {
            const cx = bandX + r * (cellW + cellGap)
            fig.rect(cx, y, cellW, cellH, {
                fill: m
                    ? tint(fullMatch ? cyan : green, c.bg, fullMatch ? 0.38 : 0.2)
                    : tint(c.textMuted, c.bg, 0.08),
                stroke: m ? (fullMatch ? cyan : green) : c.borderSubtle,
                strokeWidth: fullMatch ? 1.5 : 1,
                radius: 4,
            })
            fig.text(cx + cellW / 2, y + cellH / 2, m ? '=' : '≠', {
                size: 14,
                mono: true,
                weight: 700,
                color: m ? (fullMatch ? cyan : green) : muted,
                align: 'center',
            })
        })

        const statusX = bandX + 4 * (cellW + cellGap) + 10
        if (fullMatch) {
            fig.rect(statusX, y + 1, 146, cellH - 2, {
                fill: tint(cyan, c.bg, 0.16),
                stroke: cyan,
                strokeWidth: 1.3,
                radius: 5,
            })
            fig.text(statusX + 73, y + cellH / 2, 'COLLIDE (A, B)', {
                size: 14,
                mono: true,
                weight: 700,
                color: cyan,
                align: 'center',
            })
        } else {
            const count = matches.filter(Boolean).length
            fig.text(statusX + 4, y + cellH / 2, `${count}/4 · skip`, {
                size: 14,
                mono: true,
                color: muted,
            })
        }
    }

    // Bottom formula under bands
    fig.math(
        180,
        396,
        String.raw`P(\text{cand}) = 1 - (1 - s^4)^8 \approx 67.5\%\;(s=0.60)`,
        { size: 14, color: muted, align: 'center' },
    )

    // Arrow from LSH collisions to verification stage
    fig.arrow(348, 180, 382, 180, { color: cyan, width: 2.2, head: 8 })

    // Exact Jaccard verification bar (6 shared / 10 union)
    const rx = 392
    fig.text(rx, 22, '2. Exact Jaccard & purge', { size: 15.5, weight: 700 })
    fig.text(rx, 44, 'Verify (A, B) before dropping', { size: 14, color: muted })

    const barY = 82
    const barW = 310
    fig.text(rx, barY, 'Word bigrams (A vs B)', { size: 14, weight: 600 })
    fig.text(rx + barW, barY, 'cutoff 0.50', {
        size: 14,
        mono: true,
        color: muted,
        align: 'right',
    })
    fig.rect(rx, barY + 20, barW, 28, { fill: tint(c.textMuted, c.bg, 0.1), radius: 4 })
    fig.rect(rx, barY + 20, barW * 0.6, 28, {
        fill: tint(purple, c.bg, 0.34),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 4,
    })
    fig.text(rx + barW * 0.3, barY + 34, '6 shared', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rx + barW * 0.8, barY + 34, '4 differ', {
        size: 14,
        color: muted,
        align: 'center',
    })
    // 0.50 threshold hairline
    fig.line(rx + barW * 0.5, barY + 16, rx + barW * 0.5, barY + 52, {
        color: c.textPrimary,
        width: 1.8,
        dash: '3 2',
    })
    fig.text(rx, barY + 68, 'J = 6/10 = 0.60 ≥ 0.50 ✓ (dup)', {
        size: 14,
        mono: true,
        weight: 700,
        color: purple,
    })

    // Connected-component deduplication graph
    const gTop = 198
    fig.text(rx, gTop, 'Components (3 docs → 2 kept)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    // Component 1 container {A, B}
    fig.rect(rx, gTop + 22, 206, 134, {
        fill: tint(purple, c.bg, 0.06),
        stroke: tint(purple, c.bg, 0.35),
        strokeWidth: 1.2,
        radius: 9,
    })
    fig.text(rx + 103, gTop + 40, 'Component {A, B}', {
        size: 14,
        weight: 600,
        color: purple,
        align: 'center',
    })

    // Node A (KEPT)
    fig.circle(rx + 48, gTop + 98, 30, {
        fill: tint(green, c.bg, 0.24),
        stroke: green,
        width: 2,
    })
    fig.text(rx + 48, gTop + 89, 'A', { size: 15, weight: 700, color: green, align: 'center' })
    fig.text(rx + 48, gTop + 108, 'KEEP', { size: 14, weight: 700, color: green, align: 'center' })

    // Node B (DROP)
    fig.circle(rx + 158, gTop + 98, 30, {
        fill: tint(warm, c.bg, 0.2),
        stroke: warm,
        width: 2,
    })
    fig.text(rx + 158, gTop + 89, 'B', { size: 15, weight: 700, color: warm, align: 'center' })
    fig.text(rx + 158, gTop + 108, 'DROP', { size: 14, weight: 700, color: warm, align: 'center' })

    // Edge A -- B
    fig.line(rx + 80, gTop + 98, rx + 126, gTop + 98, { color: purple, width: 2.2 })
    fig.text(rx + 103, gTop + 82, '0.60', {
        size: 14,
        mono: true,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Component 2 container {C}
    const cBoxX = rx + 216
    fig.rect(cBoxX, gTop + 22, 94, 134, {
        fill: tint(green, c.bg, 0.06),
        stroke: tint(green, c.bg, 0.35),
        strokeWidth: 1.2,
        radius: 9,
    })
    fig.text(cBoxX + 47, gTop + 40, '{C}', {
        size: 14,
        weight: 600,
        color: green,
        align: 'center',
    })
    fig.circle(cBoxX + 47, gTop + 98, 30, {
        fill: tint(green, c.bg, 0.24),
        stroke: green,
        width: 2,
    })
    fig.text(cBoxX + 47, gTop + 89, 'C', { size: 15, weight: 700, color: green, align: 'center' })
    fig.text(cBoxX + 47, gTop + 108, 'KEEP', { size: 14, weight: 700, color: green, align: 'center' })

    fig.text(rx, 396, 'Keep A + C (67% unique yield).', {
        size: 14,
        weight: 600,
        color: green,
    })

    return fig.render()
}

export default create('dark')
