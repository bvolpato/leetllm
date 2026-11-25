import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Six synthetic candidates step sequentially through five filters: Schema, Overlap, Verifier, Diversity, and Judge. Each failing candidate stops immediately without running later stages, eliminating 4 of 6 candidates via cheap deterministic checks before invoking the LLM judge; only the keep candidate clears all five checks.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const muted = c.textSecondary

    const stages = [
        { name: '1. Schema', sub: '6 in', col: blue, x: 170 },
        { name: '2. Overlap', sub: '5 in', col: purple, x: 266 },
        { name: '3. Verifier', sub: '4 in', col: cyan, x: 362 },
        { name: '4. Diversity', sub: '3 in', col: warm, x: 458 },
        { name: '5. Judge', sub: '2 in', col: green, x: 554 },
    ]

    const candidates = [
        { id: 'schema', failAt: 0, outcome: 'drop · format' },
        { id: 'overlap', failAt: 1, outcome: 'drop · benchmark' },
        { id: 'verifier', failAt: 2, outcome: 'drop · syntax' },
        { id: 'duplicate', failAt: 3, outcome: 'drop · cosine' },
        { id: 'unstable', failAt: 4, outcome: 'drop · order flip' },
        { id: 'keep', failAt: -1, outcome: 'kept (1 / 6)' },
    ]

    // Cost tier brackets at top
    fig.brace(134, 24, 492, 24, 'Cheap deterministic filters (cut 67% before LLM)', {
        color: cyan,
        labelColor: cyan,
        side: -1,
        depth: 7,
        labelSize: 12,
        labelGap: 11,
    })
    fig.text(554, 14, 'LLM judge', { size: 12, weight: 700, color: green, align: 'center' })

    // Stage headers
    const hdrY = 58
    stages.forEach((st, idx) => {
        fig.text(st.x, hdrY, st.name, { size: 13, weight: 700, color: st.col, align: 'center' })
        fig.text(st.x, hdrY + 17, st.sub, { size: 11, mono: true, color: muted, align: 'center' })
        if (idx < stages.length - 1) {
            fig.arrow(st.x + 36, hdrY + 4, stages[idx + 1]!.x - 36, hdrY + 4, {
                color: c.border,
                width: 1.2,
                head: 5,
            })
        }
    })
    fig.text(634, hdrY, 'Outcome', { size: 13, weight: 700, color: muted })

    // Candidate rows
    const startY = 108
    const stepY = 44
    candidates.forEach((cand, r) => {
        const cy = startY + r * stepY
        const isKeep = cand.failAt === -1

        if (isKeep) {
            fig.rect(14, cy - 17, width - 28, 34, {
                fill: tint(green, c.bg, 0.1),
                stroke: tint(green, c.bg, 0.4),
                strokeWidth: 1.2,
                radius: 7,
            })
        } else {
            fig.line(24, cy + 22, width - 24, cy + 22, { color: c.borderSubtle, width: 0.8 })
        }

        fig.text(26, cy, cand.id, {
            size: 13,
            mono: true,
            weight: 700,
            color: isKeep ? green : c.textPrimary,
        })

        // Horizontal progress track connecting passed nodes up to failure (or all 5)
        const stopIdx = isKeep ? 4 : cand.failAt
        if (stopIdx > 0) {
            fig.line(stages[0]!.x, cy, stages[stopIdx]!.x, cy, {
                color: isKeep ? green : c.border,
                width: 2.2,
            })
        }

        stages.forEach((st, j) => {
            const passed = isKeep || j < cand.failAt
            const failed = j === cand.failAt
            if (passed) {
                fig.circle(st.x, cy, 11, {
                    fill: tint(green, c.bg, 0.24),
                    stroke: green,
                    width: 1.6,
                })
                fig.text(st.x, cy, '✓', { size: 12, weight: 700, color: green, align: 'center' })
            } else if (failed) {
                fig.circle(st.x, cy, 11, {
                    fill: tint(red, c.bg, 0.24),
                    stroke: red,
                    width: 1.8,
                })
                fig.text(st.x, cy, '✕', { size: 12, weight: 700, color: red, align: 'center' })
            } else {
                fig.circle(st.x, cy, 3.5, { fill: c.borderSubtle })
            }
        })

        fig.text(634, cy, cand.outcome, {
            size: 12,
            mono: true,
            weight: 700,
            color: isKeep ? green : red,
        })
    })

    // Footer summary
    fig.text(
        width / 2,
        374,
        'Fail-fast ordering stops 4 of 6 candidates early so only 2 reach the LLM judge.',
        { size: 13, color: muted, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
