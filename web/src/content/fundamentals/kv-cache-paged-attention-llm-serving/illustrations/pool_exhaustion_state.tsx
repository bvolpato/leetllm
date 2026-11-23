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
export const height = 680
export const alt =
    'A two-block, four-slot manager starts with A owning block 1 at length four and B owning empty block 0 at length zero. A fifth append raises MemoryError because the free list is empty and leaves both tables, lengths, and blocks unchanged. Freeing B twice returns block 0 once; retry writes slot (0, 0), giving A table [1, 0] and length five.'

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
    const failText = getReadableToneColor('critical', c, c.bg, c.bg)
    const passText = getReadableToneColor('green', c, c.bg, c.bg)
    const slotW = 66
    const b1X = 276
    const b0X = 592

    const renderSlots = (x0: number, y: number, vals: string[], tone: string) =>
        vals.map((v, i) => {
            const x = x0 + i * 70
            if (v === '' || v === 'tail') {
                return (
                    <rect
                        key={i}
                        x={x}
                        y={y}
                        width={slotW}
                        height={54}
                        rx={4}
                        fill="none"
                        stroke={c.border}
                        strokeWidth={2}
                        strokeDasharray="5 4"
                    />
                )
            }
            return SvgFrame({
                key: i,
                c,
                x,
                y,
                width: slotW,
                height: 54,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: tone,
                strokeWidth: 2,
            })
        })

    const rows = [
        {
            y: 120,
            title: '1. Before append 5',
            color: c.textPrimary,
            detail: 'A[1] len=4 · B[0] len=0 · free=[]',
            b0Name: 'Block 0 (B)',
            b0: ['', '', '', ''],
        },
        {
            y: 280,
            title: '2. Append 5 fails',
            color: failText,
            detail: 'MemoryError · tables and slots unchanged',
            b0Name: 'Block 0 (B)',
            b0: ['', '', '', ''],
        },
        {
            y: 440,
            title: '3. Free B x2, retry',
            color: passText,
            detail: 'A[1, 0] len=5 · B released · free=[]',
            b0Name: 'Block 0 (now A)',
            b0: ['p4', 'tail', 'tail', 'tail'],
        },
    ]

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={20} y1={102} x2={880} y2={102} stroke={c.borderLight} strokeWidth={2} />
            {rows.map((r, idx) => (
                <g key={r.title}>
                    {renderSlots(b1X, r.y + 38, ['p0', 'p1', 'p2', 'p3'], c.primary)}
                    {renderSlots(b0X, r.y + 38, r.b0, idx === 2 ? c.primary : c.info)}
                    {idx < 2 &&
                        VectorArrow({
                            x1: 248,
                            y1: r.y + 24,
                            x2: 248,
                            y2: r.y + 92,
                            color: idx === 0 ? c.critical : c.positive,
                            strokeWidth: 3,
                        })}
                    <line
                        x1={20}
                        y1={r.y + 148}
                        x2={880}
                        y2={r.y + 148}
                        stroke={c.borderLight}
                        strokeWidth={1.5}
                    />
                </g>
            ))}
        </svg>
    )

    const rowItems = rows.flatMap((r) => {
        const b1Labels = ['p0', 'p1', 'p2', 'p3'].map((v, i) =>
            label(c, v, b1X + i * 70, r.y + 46, slotW, 29, c.textPrimary, 'center', 650),
        )
        const b0Labels = r.b0
            .map((v, i) =>
                v
                    ? label(
                          c,
                          v,
                          b0X + i * 70,
                          r.y + 46,
                          slotW,
                          29,
                          v === 'tail' ? c.textMuted : c.textPrimary,
                          'center',
                          v === 'tail' ? 500 : 700,
                      )
                    : null,
            )
            .filter((x): x is React.ReactElement => x !== null)
        return [
            label(c, r.title, 20, r.y + 10, 212, 31, r.color, 'left', 700),
            label(c, 'Block 1 (A)', b1X, r.y, 280, 29, c.textPrimary, 'left', 700),
            label(c, r.b0Name, b0X, r.y, 280, 29, c.textPrimary, 'left', 700),
            ...b1Labels,
            ...b0Labels,
            label(c, r.detail, 20, r.y + 104, 860, 29, c.textSecondary, 'left', 600),
        ]
    })

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Full pool rejects appends cleanly without corruption',
            20,
            14,
            860,
            34,
            c.textPrimary,
            'left',
            700,
        ),
        label(
            c,
            '2 blocks × 4 slots each · free(B) twice returns block 0 once',
            20,
            56,
            860,
            30,
            c.textSecondary,
        ),
        ...rowItems,
        label(
            c,
            'The second free(B) returns nothing; retry writes slot (0, 0).',
            20,
            610,
            860,
            30,
            c.textSecondary,
            'left',
            650,
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
