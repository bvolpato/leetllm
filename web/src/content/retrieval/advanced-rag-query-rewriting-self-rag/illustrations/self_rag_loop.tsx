import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 600
export const height = 790
export const alt =
    'A retrieved policy says temporary tokens-per-minute increases require approval. Candidate A, which follows that clause, receives weighted relevance, support, and utility contributions of 0.184, 0.576, and 0.162, totaling 0.922. Candidate B claims all launch traffic is unlimited and totals 0.534 from contributions 0.190, 0.168, and 0.176. A leads in support by 0.408; B leads in relevance and utility by 0.020; A leads overall by 0.388.'
export const caption =
    'The bars show reflection-token probabilities with weights 0.2, 0.6, and 0.2 and equal generation likelihood assumed. The weighted critique reward scores candidate support against retrieved evidence.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align }),
    })
}

function frame(
    c: Colors,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke = c.border,
    rx = 10,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: React.createElement(
            'svg',
            {
                width: w,
                height: h,
                viewBox: `0 0 ${w} ${h}`,
                role: 'presentation',
                'aria-hidden': true,
            },
            SvgFrame({ c, x: 0, y: 0, width: w, height: h, rx, fill, stroke, strokeWidth: 1.2 }),
        ),
    })
}

function candidateRow(
    c: Colors,
    y: number,
    input: {
        letter: 'A' | 'B'
        sentence: string
        evidence: string
        values: readonly [number, number, number]
        total: number
    },
    fills: readonly [string, string, string],
    accent: string,
) {
    const x = 22
    const barX = 38
    const barY = y + 68
    const barWidth = 410
    const barHeight = 22
    const children: React.ReactNode[] = [
        frame(c, x, y, 556, 154, c.bgCard, input.letter === 'A' ? accent : c.border, 12),
        label(c, input.letter, 38, y + 10, 25, 24, 20, accent, 850, 'center'),
        label(c, input.sentence, 74, y + 9, 476, 26, 20, c.textPrimary, 750),
        label(c, input.evidence, 74, y + 35, 476, 27, 20, accent, 650),
        frame(c, barX, barY, barWidth, barHeight, c.bgCardAlt, c.borderSubtle, 5),
        label(c, input.total.toFixed(3), 458, y + 59, 100, 29, 23, accent, 850, 'right'),
        label(c, '0', barX, y + 94, 24, 25, 20, c.textMuted, 600),
        label(c, '1.0', barX + barWidth - 42, y + 94, 42, 25, 20, c.textMuted, 600, 'right'),
        label(
            c,
            `${input.values[0].toFixed(3)} + ${input.values[1].toFixed(3)} + ${input.values[2].toFixed(3)} = ${input.total.toFixed(3)}`,
            barX,
            y + 123,
            510,
            25,
            20,
            c.textSecondary,
            650,
        ),
    ]
    let offset = 0
    for (const [index, value] of input.values.entries()) {
        const segmentWidth = barWidth * value
        children.push(
            frame(c, barX + offset, barY, segmentWidth, barHeight, fills[index], 'none', 0),
        )
        offset += segmentWidth
    }
    return children
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bgCard)
    const green = getReadableToneColor('green', c, c.bgCard)
    const purple = getReadableToneColor('purple', c, c.bgCard)
    const warm = getReadableToneColor('warm', c, c.bgCard)
    const fills = [
        getReadableToneColor('blue', c, c.bgCardAlt),
        getReadableToneColor('green', c, c.bgCardAlt),
        getReadableToneColor('purple', c, c.bgCardAlt),
    ] as const
    const children: React.ReactNode[] = [
        label(c, 'One policy clause changes the winner', 24, 14, 552, 34, 25, c.textPrimary, 800),
        label(
            c,
            'Weights: relevance 0.2 · support 0.6 · utility 0.2',
            24,
            51,
            552,
            28,
            20,
            c.textSecondary,
            600,
        ),
        frame(c, 22, 84, 556, 84, c.bgCard, c.borderSubtle, 12),
        label(c, 'RETRIEVED POLICY', 38, 91, 520, 25, 20, blue, 800),
        label(
            c,
            '“Temporary tokens-per-minute increases require approval.”',
            38,
            117,
            520,
            43,
            20,
            c.textPrimary,
            700,
        ),

        frame(c, 36, 180, 12, 12, fills[0], fills[0], 3),
        label(c, 'Relevance', 54, 174, 101, 27, 20, blue, 700),
        frame(c, 168, 180, 12, 12, fills[1], fills[1], 3),
        label(c, 'Support', 186, 174, 86, 27, 20, green, 700),
        frame(c, 289, 180, 12, 12, fills[2], fills[2], 3),
        label(c, 'Utility', 307, 174, 80, 27, 20, purple, 700),

        ...candidateRow(
            c,
            208,
            {
                letter: 'A',
                sentence: 'Temporary TPM increase requires approval.',
                evidence: 'Follows the retrieved approval clause',
                values: [0.184, 0.576, 0.162],
                total: 0.922,
            },
            fills,
            green,
        ),
        ...candidateRow(
            c,
            372,
            {
                letter: 'B',
                sentence: 'All launch traffic is unlimited.',
                evidence: 'The retrieved clause gives no such access',
                values: [0.19, 0.168, 0.176],
                total: 0.534,
            },
            fills,
            warm,
        ),

        frame(c, 22, 534, 556, 231, c.bgCardAlt, c.borderSubtle, 12),
        label(c, 'Support carries most of A’s lead', 38, 546, 520, 26, 21, c.textPrimary, 750),
        label(c, 'Support scores · shared 0–1 scale', 38, 576, 520, 25, 20, c.textMuted, 600),
        label(c, 'A', 38, 615, 38, 25, 20, green, 800),
        frame(c, 78, 615, 346, 23, c.bgCard, c.borderSubtle, 5),
        frame(c, 78, 615, 346 * 0.576, 23, fills[1], 'none', 0),
        label(c, '0.576', 432, 613, 72, 27, 20, green, 800),
        label(c, 'B', 38, 651, 38, 25, 20, warm, 800),
        frame(c, 78, 651, 346, 23, c.bgCard, c.borderSubtle, 5),
        frame(c, 78, 651, 346 * 0.168, 23, fills[1], 'none', 0),
        label(c, '0.168', 432, 649, 72, 27, 20, warm, 800),
        label(c, 'Support advantage for A: +0.408', 38, 686, 520, 26, 20, green, 750),
        label(c, 'Net lead: 0.408 − 0.020 = +0.388', 38, 718, 520, 26, 20, c.textPrimary, 750),
    ]
    return Board({ c, width, height, children })
}

export default create('dark')
