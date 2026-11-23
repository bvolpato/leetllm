import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 860
export const height = 500
export const alt =
    'Three search representations scored against three source chunks on a zero-to-nine word-overlap scale. The raw question recalls one required policy chunk, the useful HyDE proxy recalls both required chunks, and the drifting proxy recalls one. Each card shows chunk scores and top-two retrieval ranks.'
export const caption =
    'HyDE embeds a synthetic passage in corpus document space, comparing Recall@2 against raw and rewritten query retrieval.'

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

function scoreBar(c: Colors, x: number, y: number, score: number, color: string) {
    const barWidth = 96
    const height = 18
    const fillWidth = Math.max(0, (barWidth * score) / 9)
    const marks: React.ReactNode[] = [
        SvgFrame({
            c,
            x: 0,
            y: 2,
            width: barWidth,
            height: 14,
            rx: 3,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
    ]
    if (score > 0) {
        marks.push(
            SvgFrame({
                c,
                x: 0,
                y: 2,
                width: fillWidth,
                height: 14,
                rx: 3,
                fill: color,
                stroke: 'none',
            }),
        )
    }
    marks.push(
        VectorSegment({
            x1: barWidth / 2,
            y1: 1,
            x2: barWidth / 2,
            y2: height - 1,
            color: c.border,
            strokeWidth: 1,
            showStartDot: false,
            showEndDot: false,
        }),
    )
    return CanvasItem({
        x,
        y,
        width: barWidth,
        height,
        children: React.createElement(
            'svg',
            {
                width: barWidth,
                height,
                viewBox: `0 0 ${barWidth} ${height}`,
                role: 'presentation',
                'aria-hidden': true,
            },
            ...marks,
        ),
    })
}

const routes = [
    {
        name: 'Raw question',
        recall: '0.5',
        cue: 'Quota: 2 shared words · Others: 1 each',
        rows: [
            { name: 'Quota', score: 2, rank: '1st', tone: 'green' as const },
            { name: 'Overview', score: 1, rank: '2nd', tone: 'warm' as const },
            { name: 'Batch', score: 1, rank: '-', tone: 'green' as const },
        ],
    },
    {
        name: 'Useful HyDE proxy',
        recall: '1.0',
        cue: 'Quota: quota/request · Batch: backoff',
        rows: [
            { name: 'Quota', score: 6, rank: '1st', tone: 'green' as const },
            { name: 'Overview', score: 2, rank: '-', tone: 'warm' as const },
            { name: 'Batch', score: 4, rank: '2nd', tone: 'green' as const },
        ],
    },
    {
        name: 'Drifting proxy',
        recall: '0.5',
        cue: 'Overview matches API and vectors',
        rows: [
            { name: 'Quota', score: 0, rank: '-', tone: 'green' as const },
            { name: 'Overview', score: 9, rank: '1st', tone: 'warm' as const },
            { name: 'Batch', score: 1, rank: '2nd', tone: 'green' as const },
        ],
    },
] as const

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const required = getReadableToneColor('green', c, c.bgCardAlt)
    const overview = getReadableToneColor('warm', c, c.bgCardAlt)
    const blue = getReadableToneColor('blue', c, c.bgCard)
    const children: React.ReactNode[] = [
        label(
            c,
            'A useful proxy changes retrieval neighbors',
            24,
            16,
            812,
            32,
            22,
            c.textPrimary,
            800,
        ),
        label(
            c,
            'Draft passage → passage encoder → source chunks',
            24,
            50,
            812,
            24,
            18,
            c.textSecondary,
            550,
        ),
        frame(c, 24, 82, 812, 38, c.bgCard, c.borderSubtle, 8),
        label(
            c,
            'Question → hypothetical draft → dense passage embedding → nearest neighbor retrieval',
            32,
            90,
            796,
            22,
            18,
            blue,
            700,
            'center',
        ),
    ]

    const cardW = 260
    const cardH = 300
    const startX = 24
    const startY = 132
    const gap = 16

    routes.forEach((route, index) => {
        const x = startX + index * (cardW + gap)
        children.push(frame(c, x, startY, cardW, cardH, c.bgCard, c.border, 10))
        children.push(label(c, route.name, x + 14, startY + 12, 140, 24, 18, blue, 800))
        children.push(
            label(
                c,
                `R@2: ${route.recall}`,
                x + 160,
                startY + 12,
                86,
                24,
                18,
                route.recall === '1.0' ? required : overview,
                800,
                'right',
            ),
        )
        children.push(
            label(c, route.cue, x + 14, startY + 40, cardW - 28, 20, 14, c.textSecondary, 500),
        )

        children.push(label(c, 'Chunk', x + 14, startY + 74, 60, 20, 15, c.textMuted, 700))
        children.push(
            label(c, 'Overlap (0–9)', x + 80, startY + 74, 110, 20, 15, c.textMuted, 700, 'center'),
        )
        children.push(label(c, 'Rank', x + 195, startY + 74, 50, 20, 15, c.textMuted, 700, 'right'))

        route.rows.forEach((row, rIdx) => {
            const rowY = startY + 104 + rIdx * 54
            const tone = row.tone === 'green' ? required : overview
            children.push(
                label(
                    c,
                    row.name,
                    x + 14,
                    rowY,
                    60,
                    22,
                    16,
                    c.textPrimary,
                    row.rank === '-' ? 500 : 700,
                ),
            )
            children.push(scoreBar(c, x + 80, rowY, row.score, tone))
            children.push(
                label(
                    c,
                    row.rank,
                    x + 195,
                    rowY,
                    50,
                    22,
                    16,
                    row.rank === '-' ? c.textMuted : tone,
                    800,
                    'right',
                ),
            )
            children.push(
                label(
                    c,
                    `${row.score}/9 words`,
                    x + 80,
                    rowY + 22,
                    96,
                    18,
                    13,
                    tone,
                    600,
                    'center',
                ),
            )
        })
    })

    children.push(
        label(
            c,
            'Document-space retrieval comparison · Ties preserve original corpus ordering',
            24,
            452,
            812,
            24,
            18,
            c.textMuted,
            600,
            'center',
        ),
    )

    return Board({ c, width, height, children })
}

export default create('dark')
