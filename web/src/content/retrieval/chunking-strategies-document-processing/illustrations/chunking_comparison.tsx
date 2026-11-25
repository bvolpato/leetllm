import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 680
export const height = 456
export const alt =
    'Three interval maps show size-7 windows over the same 17 runbook words. Overlap 0, 2, and 4 store 17, 21, and 33 words in 3, 3, and 5 chunks. A strip under each map darkens where words repeat across windows. The rollback rule spans words 1 to 10, so no seven-word window holds the whole rule at any overlap.'

interface OverlapGroup {
    readonly overlap: number
    readonly chunks: number
    readonly words: number
    readonly rows: readonly (readonly (readonly [number, number])[])[]
}

const GROUPS: readonly OverlapGroup[] = [
    {
        overlap: 0,
        chunks: 3,
        words: 17,
        rows: [
            [
                [1, 7],
                [8, 14],
                [15, 17],
            ],
        ],
    },
    {
        overlap: 2,
        chunks: 3,
        words: 21,
        rows: [
            [
                [1, 7],
                [11, 17],
            ],
            [[6, 12]],
        ],
    },
    {
        overlap: 4,
        chunks: 5,
        words: 33,
        rows: [
            [
                [1, 7],
                [10, 16],
            ],
            [
                [4, 10],
                [13, 17],
            ],
            [[7, 13]],
        ],
    },
]

const TOTAL_WORDS = 17
const RULE_END = 10

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')

    const leftX = 20
    const innerW = width - 40
    const wordW = innerW / TOTAL_WORDS
    const xOf = (word: number) => leftX + (word - 1) * wordW
    const ruleRightX = leftX + RULE_END * wordW

    // Top span header cleanly ABOVE the span arrow (zero collision!)
    fig.text(leftX + 2, 16, 'Rollback rule: words 1–10 (> size-7 window)', {
        size: 15,
        weight: 700,
        color: green,
    })
    fig.text(ruleRightX + 10, 16, 'Next note: 11–17', {
        size: 14,
        weight: 600,
        color: c.textSecondary,
    })

    // Span indicator line + end tick & arrow sitting cleanly at y = 38
    fig.line(leftX, 34, leftX, 42, { color: green, width: 1.75 })
    fig.arrow(leftX + 1, 38, ruleRightX - 2, 38, { color: green, width: 1.75, head: 7 })
    fig.line(leftX, 48, leftX + innerW, 48, { color: c.border, width: 1 })

    const barH = 26
    const barGap = 4
    const stripH = 10

    // Precompute total height to draw the vertical rule band behind all tracks
    let cursorY = 66
    const groupTops: number[] = []
    for (const g of GROUPS) {
        groupTops.push(cursorY)
        const bodyH = g.rows.length * (barH + barGap) - barGap
        cursorY += 26 + bodyH + 5 + stripH + 22
    }
    const bandBottom = cursorY - 14

    // Soft green shaded column for the 10-word rule
    fig.rect(leftX, 48, RULE_END * wordW, bandBottom - 48, {
        fill: withColorAlpha(green, 0.08),
    })
    fig.line(ruleRightX, 34, ruleRightX, bandBottom, {
        color: green,
        width: 1.75,
        dash: '5 4',
    })

    GROUPS.forEach((group, gIdx) => {
        const top = groupTops[gIdx]!
        fig.text(
            leftX + 4,
            top + 8,
            `Overlap ${group.overlap}  ·  ${group.chunks} chunks, ${group.words} indexed words`,
            {
                size: 15,
                weight: 700,
                color: c.textPrimary,
            },
        )

        const bodyY = top + 26
        const windows = group.rows.flat()

        group.rows.forEach((row, rIdx) => {
            const ry = bodyY + rIdx * (barH + barGap)
            for (const [first, last] of row) {
                const bx = xOf(first) + 1.5
                const bw = (last - first + 1) * wordW - 3
                fig.rect(bx, ry, bw, barH, {
                    fill: withColorAlpha(blue, 0.16),
                    stroke: blue,
                    strokeWidth: 1.4,
                    radius: 4,
                })
                // Keep labels clear of the dashed vertical boundary at word 10
                const labelX =
                    first === 8 && last === 14
                        ? ruleRightX + 12
                        : first === 7 && last === 13
                          ? ruleRightX - 10
                          : bx + bw / 2
                const labelAlign =
                    first === 8 && last === 14
                        ? 'left'
                        : first === 7 && last === 13
                          ? 'right'
                          : 'center'
                fig.text(labelX, ry + barH / 2, `${first}–${last}`, {
                    size: 14,
                    weight: 600,
                    mono: true,
                    color: c.textPrimary,
                    align: labelAlign,
                })
            }
        })

        // Per-word duplication intensity strip
        const stripY = bodyY + group.rows.length * (barH + barGap) + 2
        for (let w = 1; w <= TOTAL_WORDS; w++) {
            const copies = windows.filter(([a, b]) => a <= w && w <= b).length
            const alpha = [0, 0.22, 0.55, 0.92][Math.min(3, copies)]!
            fig.rect(xOf(w) + 1, stripY, wordW - 2, stripH, {
                fill: blue,
                opacity: alpha,
                radius: 2,
            })
        }
    })

    // Compact legend for duplication strip at bottom
    const legY = bandBottom + 20
    fig.text(leftX + 2, legY, 'Token copies indexed:', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
    })
    const swX = leftX + 166
    const swatches = [
        { label: '1×', alpha: 0.22 },
        { label: '2×', alpha: 0.55 },
        { label: '3×', alpha: 0.92 },
    ]
    swatches.forEach((sw, idx) => {
        const sx = swX + idx * 64
        fig.rect(sx, legY - 5, 18, 10, { fill: blue, opacity: sw.alpha, radius: 2 })
        fig.text(sx + 24, legY, sw.label, {
            size: 13,
            mono: true,
            weight: 600,
            color: c.textSecondary,
        })
    })
    fig.text(leftX + innerW, legY, 'Window size N = 7 words', {
        size: 13,
        mono: true,
        color: c.textMuted,
        align: 'right',
    })

    return fig.render()
}

export default create('dark')
