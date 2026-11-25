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
export { createFilm } from './_parts/paged-attention-film'

export const width = 900
export const height = 640
export const alt =
    'Two snapshots of the same ten physical KV blocks. With maximum reservations, A and B each hold five blocks while using three, so C cannot obtain its two blocks. With dynamic allocation, A uses three, B three, and C two, leaving blocks 8 and 9 free.'

type Slot = [owner: string, kind: 'live' | 'idle' | 'free']

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
    const colors: Record<string, string> = {
        A: c.primary,
        B: c.info,
        C: c.secondary,
        '': c.positive,
    }
    const textTones: Record<string, string> = {
        A: getReadableToneColor('purple', c, c.bg, c.bg),
        B: getReadableToneColor('blue', c, c.bg, c.bg),
        C: getReadableToneColor('cyan', c, c.bg, c.bg),
        '': getReadableToneColor('green', c, c.bg, c.bg),
    }
    const failText = getReadableToneColor('critical', c, c.bg, c.bg)
    const passText = getReadableToneColor('green', c, c.bg, c.bg)

    const topPool: Slot[] = [
        ['A', 'live'],
        ['A', 'live'],
        ['A', 'live'],
        ['A', 'idle'],
        ['A', 'idle'],
        ['B', 'live'],
        ['B', 'live'],
        ['B', 'live'],
        ['B', 'idle'],
        ['B', 'idle'],
    ]
    const botPool: Slot[] = [
        ['A', 'live'],
        ['B', 'live'],
        ['A', 'live'],
        ['B', 'live'],
        ['A', 'live'],
        ['B', 'live'],
        ['C', 'live'],
        ['C', 'live'],
        ['', 'free'],
        ['', 'free'],
    ]
    const cellW = 78
    const step = 86

    const renderSlots = (slots: Slot[], y0: number) =>
        slots.map(([owner, kind], i) => {
            const x = 20 + i * step
            if (kind === 'live') {
                return SvgFrame({
                    key: i,
                    c,
                    x,
                    y: y0,
                    width: cellW,
                    height: 84,
                    rx: 6,
                    fill: c.bgCardAlt,
                    stroke: colors[owner],
                    strokeWidth: 3,
                })
            }
            return (
                <rect
                    key={i}
                    x={x}
                    y={y0}
                    width={cellW}
                    height={84}
                    rx={6}
                    fill="none"
                    stroke={colors[owner]}
                    strokeWidth={2}
                    strokeDasharray="6 5"
                />
            )
        })

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={20} y1={104} x2={880} y2={104} stroke={c.borderLight} strokeWidth={2} />
            {renderSlots(topPool, 194)}
            {VectorArrow({ x1: 840, y1: 294, x2: 840, y2: 356, color: c.positive, strokeWidth: 3 })}
            <line x1={20} y1={368} x2={880} y2={368} stroke={c.borderLight} strokeWidth={2} />
            {renderSlots(botPool, 456)}
        </svg>
    )

    const slotLabels = (slots: Slot[], y0: number) =>
        slots.flatMap(([owner, kind], i) => {
            const x = 20 + i * step
            const head = label(c, `#${i}`, x, y0 - 38, cellW, 29, c.textMuted, 'center', 600)
            if (kind === 'live') {
                return [
                    head,
                    label(c, owner, x, y0 + 22, cellW, 31, textTones[owner], 'center', 700),
                ]
            }
            if (kind === 'idle') {
                return [
                    head,
                    label(c, owner, x, y0 + 8, cellW, 29, textTones[owner], 'center', 700),
                    label(c, 'idle', x, y0 + 42, cellW, 29, c.textSecondary, 'center', 500),
                ]
            }
            return [head, label(c, 'free', x, y0 + 22, cellW, 29, textTones[''], 'center', 650)]
        })

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Paged allocation recovers idle reservations',
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
            'Same 10 physical blocks, same live state, two policies',
            20,
            56,
            860,
            30,
            c.textSecondary,
        ),
        label(
            c,
            'Reserve maximum (5 each) for A and B',
            20,
            118,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        ...slotLabels(topPool, 194),
        label(
            c,
            'C needs 2 blocks; 0 free so C cannot start',
            20,
            296,
            860,
            30,
            failText,
            'left',
            700,
        ),
        label(c, 'Allocate blocks as sequences grow', 20, 384, 860, 31, c.textPrimary, 'left', 700),
        ...slotLabels(botPool, 456),
        label(
            c,
            'A: 3, B: 3, C: 2 used. Blocks #8 and #9 remain free.',
            20,
            568,
            860,
            30,
            passText,
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
