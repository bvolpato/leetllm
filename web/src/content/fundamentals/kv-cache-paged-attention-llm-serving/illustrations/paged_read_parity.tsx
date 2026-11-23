import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 760
export const alt =
    'With block size two, A table [3, 1] reads logical positions zero and one from physical block 3 and position two from block 1. Block 1 slot 1 holds an invalid K=(1000,1000), V=(999,999) sentinel and is excluded at valid length three; B owns block 2. For q=(1,0.5), the paged read matches contiguous attention at (2.461842, 1.904740). Mapping A to B or including the sentinel changes the result.'

function label(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight: number = 600,
): React.ReactElement {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(36, fontSize + 10),
        children: TextLabel({ c, text: value, fontSize, fontWeight, color, align, width: w }),
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = getReadableToneColor('purple', c, c.bg, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg, c.bg)
    const critical = getReadableToneColor('critical', c, c.bg, c.bg)

    const mapRows = [
        {
            y: 116,
            left: 'A log #0 (0-1)',
            mid: 'table[0] = 3',
            right: 'block #3 (pos 0-1)',
            stroke: c.primary,
        },
        {
            y: 182,
            left: 'A log #1 (2-3)',
            mid: 'table[1] = 1',
            right: 'block #1 (pos 2)',
            stroke: c.primary,
        },
        {
            y: 248,
            left: 'B log #0',
            mid: 'B table[0] = 2',
            right: 'block #2 (seq B)',
            stroke: c.warning,
        },
    ]

    const cards = [
        {
            x: 20,
            y: 334,
            title: 'Physical #0 · free',
            stroke: c.border,
            titleColor: c.textMuted,
            s0: ['slot 0', 'empty', 'free'],
            s1: ['slot 1', 'empty', 'free'],
        },
        {
            x: 456,
            y: 334,
            title: 'Physical #1 · A log 1',
            stroke: c.primary,
            titleColor: purple,
            s0: ['p2 · K(1,1)', 'V(4,2)', 'valid'],
            s1: ['p3 · K1000', 'V999 · tail', 'tail'],
        },
        {
            x: 20,
            y: 472,
            title: 'Physical #2 · B-owned',
            stroke: c.warning,
            titleColor: warm,
            s0: ['B · K(-1,0)', 'V(-5,-5)', 'other'],
            s1: ['slot 1', 'empty', 'free'],
        },
        {
            x: 456,
            y: 472,
            title: 'Physical #3 · A log 0',
            stroke: c.primary,
            titleColor: purple,
            s0: ['p0 · K(1,0)', 'V(2,1)', 'valid'],
            s1: ['p1 · K(0,1)', 'V(0,3)', 'valid'],
        },
    ]

    const slotBorder = (kind: string) =>
        kind === 'tail'
            ? c.critical
            : kind === 'other'
              ? c.warning
              : kind === 'free'
                ? c.borderLight
                : c.info

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={20} y1={102} x2={880} y2={102} stroke={c.borderLight} strokeWidth={2} />
            {mapRows.map((r) => (
                <g key={r.left}>
                    {SvgFrame({
                        c,
                        x: 20,
                        y: r.y,
                        width: 256,
                        height: 50,
                        rx: 6,
                        fill: c.bgCardAlt,
                        stroke: r.stroke,
                        strokeWidth: 2,
                    })}
                    {VectorArrow({
                        x1: 282,
                        y1: r.y + 25,
                        x2: 320,
                        y2: r.y + 25,
                        color: r.stroke,
                        strokeWidth: 2.5,
                    })}
                    {SvgFrame({
                        c,
                        x: 326,
                        y: r.y,
                        width: 236,
                        height: 50,
                        rx: 6,
                        fill: c.bgCardAlt,
                        stroke: c.border,
                        strokeWidth: 2,
                    })}
                    {VectorArrow({
                        x1: 568,
                        y1: r.y + 25,
                        x2: 606,
                        y2: r.y + 25,
                        color: r.stroke,
                        strokeWidth: 2.5,
                    })}
                    {SvgFrame({
                        c,
                        x: 612,
                        y: r.y,
                        width: 268,
                        height: 50,
                        rx: 6,
                        fill: c.bgCardAlt,
                        stroke: r.stroke,
                        strokeWidth: 2,
                    })}
                </g>
            ))}
            <line x1={20} y1={318} x2={880} y2={318} stroke={c.borderLight} strokeWidth={2} />
            {cards.map((card) => (
                <g key={card.title}>
                    {SvgFrame({
                        c,
                        x: card.x,
                        y: card.y,
                        width: 424,
                        height: 126,
                        rx: 8,
                        fill: c.bgCardAlt,
                        stroke: card.stroke,
                        strokeWidth: 2,
                    })}
                    {[card.s0, card.s1].map((sl, idx) => (
                        <rect
                            key={idx}
                            x={card.x + 10 + idx * 204}
                            y={card.y + 42}
                            width={198}
                            height={74}
                            rx={4}
                            fill={sl[2] === 'free' ? 'none' : c.bg}
                            stroke={slotBorder(sl[2])}
                            strokeWidth={2}
                            strokeDasharray={
                                sl[2] === 'tail' || sl[2] === 'free' ? '6 4' : undefined
                            }
                        />
                    ))}
                </g>
            ))}
            <line x1={20} y1={614} x2={880} y2={614} stroke={c.borderLight} strokeWidth={2} />
        </svg>
    )

    const mapLabels = mapRows.flatMap((r) => [
        label(c, r.left, 20, r.y + 8, 256, 29, c.textPrimary, 'center', 700),
        label(c, r.mid, 326, r.y + 8, 236, 29, c.textPrimary, 'center', 700),
        label(c, r.right, 612, r.y + 8, 268, 29, c.textPrimary, 'center', 700),
    ])

    const cardLabels = cards.flatMap((card) => [
        label(c, card.title, card.x + 12, card.y + 4, 400, 29, card.titleColor, 'left', 700),
        ...[card.s0, card.s1].flatMap((sl, idx) => {
            const sx = card.x + 10 + idx * 204
            const tone =
                sl[2] === 'tail'
                    ? critical
                    : sl[2] === 'free'
                      ? c.textMuted
                      : sl[2] === 'other'
                        ? warm
                        : blue
            return [
                label(c, sl[0], sx, card.y + 44, 198, 29, tone, 'center', 700),
                label(c, sl[1], sx, card.y + 78, 198, 29, c.textSecondary, 'center', 600),
            ]
        }),
    ])

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(c, "Follow A's valid K/V reads", 20, 14, 860, 34, c.textPrimary, 'left', 700),
        label(
            c,
            '4-block example · block size 2 · A table [3, 1]',
            20,
            56,
            860,
            30,
            c.textSecondary,
        ),
        ...mapLabels,
        ...cardLabels,
        label(
            c,
            "Wrong map A table[1] -> block 2 reads B's value.",
            20,
            626,
            860,
            29,
            critical,
            'left',
            700,
        ),
        label(
            c,
            'Valid length 3 stops at pos 2; skip slot 1 sentinel & B.',
            20,
            666,
            860,
            29,
            c.textSecondary,
            'left',
            650,
        ),
        label(
            c,
            'q = (1, 0.5) · paged = contiguous = (2.461842, 1.904740)',
            20,
            706,
            860,
            29,
            c.textPrimary,
            'left',
            700,
        ),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

export default create('dark')
