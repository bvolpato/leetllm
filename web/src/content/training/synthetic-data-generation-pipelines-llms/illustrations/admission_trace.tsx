import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 520
export const opaqueBackground = true
export const alt =
    'A six-row gate trace shows each candidate stopping at its first failure. Schema fails at Schema. Overlap passes Schema and fails Overlap. Verifier passes Schema and Overlap, then fails the JSON verifier. Duplicate passes the first three and fails cosine diversity. Unstable passes four gates and fails the judge. Keep passes all five. Later gates after a failure are unrun. Only unstable and keep reach the judge; keep alone enters the shard.'

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
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

function frame(
    c: Colors,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    fill: string,
    rx = 8,
    strokeWidth = 1.5,
) {
    return SvgFrame({ c, x, y, width: w, height: h, rx, fill, stroke: color, strokeWidth })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const critical = getReadableToneColor('red', c)
    const muted = c.textSecondary

    const tiers = [
        { name: '1. Schema', x: 190, color: blue },
        { name: '2. Overlap', x: 295, color: purple },
        { name: '3. Verifier', x: 400, color: cyan },
        { name: '4. Diversity', x: 505, color: warm },
        { name: '5. Judge', x: 610, color: green },
    ]

    const rows = [
        {
            id: 'schema',
            states: ['F', '–', '–', '–', '–'],
            outcome: 'REJECT (Format)',
            color: critical,
        },
        {
            id: 'overlap',
            states: ['P', 'F', '–', '–', '–'],
            outcome: 'REJECT (Benchmark)',
            color: critical,
        },
        {
            id: 'verifier',
            states: ['P', 'P', 'F', '–', '–'],
            outcome: 'REJECT (Syntax)',
            color: critical,
        },
        {
            id: 'duplicate',
            states: ['P', 'P', 'P', 'F', '–'],
            outcome: 'REJECT (Cosine)',
            color: critical,
        },
        {
            id: 'unstable',
            states: ['P', 'P', 'P', 'P', 'F'],
            outcome: 'REJECT (Position)',
            color: critical,
        },
        {
            id: 'keep',
            states: ['P', 'P', 'P', 'P', 'P'],
            outcome: 'ACCEPTED TO SHARD',
            color: green,
        },
    ]

    const geometry = [
        // Top Tier Pipeline Banner
        frame(c, 24, 72, 812, 44, c.borderSubtle, c.bgCard, 8, 1),
        ...tiers.map((t) => frame(c, t.x - 4, 78, 86, 32, t.color, `${t.color}15`, 6, 1.2)),

        // Main Matrix Container
        frame(c, 24, 126, 812, 320, c.borderSubtle, c.bgCard, 8, 1),

        // Row background stripes
        ...rows.map((r, i) => {
            const y = 136 + i * 50
            const isAccepted = r.id === 'keep'
            return frame(
                c,
                34,
                y,
                792,
                42,
                isAccepted ? green : c.borderSubtle,
                isAccepted ? `${green}15` : i % 2 === 0 ? c.bgSubtle : 'transparent',
                6,
                isAccepted ? 1.5 : 1,
            )
        }),

        // State indicator frames
        ...rows.flatMap((r, i) => {
            const y = 142 + i * 50
            return r.states.map((st, j) => {
                const x = tiers[j].x + 18
                const stColor = st === 'P' ? green : st === 'F' ? critical : muted
                return SvgFrame({
                    c,
                    x,
                    y,
                    width: 32,
                    height: 30,
                    rx: 5,
                    fill: st === 'P' ? `${green}20` : st === 'F' ? `${critical}25` : 'transparent',
                    stroke: stColor,
                    strokeWidth: st === '–' ? 0.8 : 1.2,
                })
            })
        }),

        // Bottom Summary Banner
        frame(c, 24, 456, 812, 44, green, `${green}10`, 8, 1.2),
    ]

    const arrows = [
        // Connecting arrows between tiers
        VectorArrow({
            x1: 275,
            y1: 94,
            x2: 288,
            y2: 94,
            color: muted,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: 380,
            y1: 94,
            x2: 393,
            y2: 94,
            color: muted,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: 485,
            y1: 94,
            x2: 498,
            y2: 94,
            color: muted,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: 590,
            y1: 94,
            x2: 603,
            y2: 94,
            color: muted,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),
    ]

    const labels = [
        // Main Title & Subtitle
        label(
            c,
            'Sequential Multi-Tier Candidate Gating Trace',
            24,
            14,
            812,
            28,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Six candidate examples across five sequential gating tiers · fail-fast shift-left execution',
            24,
            44,
            812,
            20,
            13,
            muted,
            500,
        ),

        // Tier Banner Labels
        label(c, 'CANDIDATE', 44, 86, 120, 18, 11, muted, 700),
        ...tiers.map((t) => label(c, t.name, t.x - 4, 86, 86, 18, 11, t.color, 700, 'center')),
        label(c, 'FINAL OUTCOME', 705, 86, 120, 18, 11, muted, 700, 'center'),

        // Candidate Rows
        ...rows.flatMap((r, i) => {
            const y = 148 + i * 50
            return [
                label(
                    c,
                    r.id,
                    44,
                    y,
                    120,
                    20,
                    13,
                    r.id === 'keep' ? green : c.textPrimary,
                    700,
                    'left',
                    true,
                ),
                ...r.states.map((st, j) => {
                    const x = tiers[j].x + 18
                    const stColor = st === 'P' ? green : st === 'F' ? critical : muted
                    return label(c, st, x, y - 1, 32, 20, 13, stColor, 700, 'center', true)
                }),
                label(c, r.outcome, 700, y, 120, 20, 11, r.color, 700, 'center'),
            ]
        }),

        // Bottom Summary Banner
        label(
            c,
            'Shift-Left Economics: Inexpensive deterministic checks eliminate 66.7% of candidates before invoking expensive LLM judges.',
            36,
            468,
            788,
            20,
            12,
            green,
            600,
            'center',
        ),
    ]

    const svg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...geometry,
        ...arrows,
    )
    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [CanvasItem({ x: 0, y: 0, width, height, children: svg }), ...labels],
    })
}

export default create('dark')
