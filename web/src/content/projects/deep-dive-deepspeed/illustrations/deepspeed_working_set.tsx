import { createElement, type ReactElement } from 'react'
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

export const width = 860
export const height = 500
export const opaqueBackground = true
export const alt =
    'ZeRO-3 live parameter memory working set on one rank across four layers of eight parameters each on four ranks. Between layers, the rank holds eight resident shard elements. When gathering one layer, eight full-view elements are allocated alongside the resident shards (total sixteen). When prefetching the subsequent layer, an additional eight full-view elements are allocated (total twenty-four).'

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

function renderBoard(c: Colors, items: (ReactElement | ReactElement[])[]) {
    const flat = items.flat() as ReactElement[]
    const svg = flat.filter((el) => el?.type !== 'div')
    const html = flat.filter((el) => el?.type === 'div')
    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    { width, height, viewBox: `0 0 ${width} ${height}` },
                    ...svg,
                ),
            }),
            ...html,
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const muted = c.textSecondary

    const scaleX = 20 // 20 px per element, 24 elements = 480 px
    const startX = 220
    const states = [
        {
            title: '1. Between Layers',
            sub: 'Persistent shards only',
            total: 8,
            shards: 8,
            gathered: 0,
            prefetch: 0,
            y: 95,
        },
        {
            title: '2. One Layer Gathered',
            sub: 'Active layer compute',
            total: 16,
            shards: 8,
            gathered: 8,
            prefetch: 0,
            y: 190,
        },
        {
            title: '3. Gathered + Prefetch',
            sub: 'Overlapped next layer',
            total: 24,
            shards: 8,
            gathered: 8,
            prefetch: 8,
            y: 285,
        },
    ]

    return renderBoard(c, [
        label(c, 'ZeRO-3 Live Parameter Working Set', 35, 18, 790, 28, 22, c.textPrimary, 700),
        label(
            c,
            'Coexistence of resident shards and gathered full-layer buffers (4 ranks, 4 layers × 8 parameters)',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        ...states.flatMap((st) => [
            // State title & subtitle
            label(c, st.title, 35, st.y, 175, 22, 16, c.textPrimary, 700),
            label(c, st.sub, 35, st.y + 22, 175, 18, 13, muted),

            // Shards block
            SvgFrame({
                c,
                x: startX,
                y: st.y + 2,
                width: st.shards * scaleX,
                height: 38,
                rx: 4,
                stroke: purple,
                strokeWidth: 1.5,
                fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.25)' : 'rgba(130, 80, 223, 0.2)',
            }),
            label(
                c,
                '8 Shard',
                startX,
                st.y + 12,
                st.shards * scaleX,
                20,
                13,
                c.textPrimary,
                600,
                'center',
            ),

            // Gathered block (if present)
            ...(st.gathered > 0
                ? [
                      SvgFrame({
                          c,
                          x: startX + st.shards * scaleX + 4,
                          y: st.y + 2,
                          width: st.gathered * scaleX,
                          height: 38,
                          rx: 4,
                          stroke: blue,
                          strokeWidth: 1.5,
                          fill:
                              theme === 'dark'
                                  ? 'rgba(56, 139, 253, 0.25)'
                                  : 'rgba(9, 105, 218, 0.2)',
                      }),
                      label(
                          c,
                          '8 Gathered',
                          startX + st.shards * scaleX + 4,
                          st.y + 12,
                          st.gathered * scaleX,
                          20,
                          13,
                          c.textPrimary,
                          600,
                          'center',
                      ),
                  ]
                : []),

            // Prefetched block (if present)
            ...(st.prefetch > 0
                ? [
                      SvgFrame({
                          c,
                          x: startX + (st.shards + st.gathered) * scaleX + 8,
                          y: st.y + 2,
                          width: st.prefetch * scaleX,
                          height: 38,
                          rx: 4,
                          stroke: cyan,
                          strokeWidth: 1.5,
                          fill:
                              theme === 'dark'
                                  ? 'rgba(57, 197, 207, 0.25)'
                                  : 'rgba(27, 143, 153, 0.2)',
                      }),
                      label(
                          c,
                          '8 Prefetch',
                          startX + (st.shards + st.gathered) * scaleX + 8,
                          st.y + 12,
                          st.prefetch * scaleX,
                          20,
                          13,
                          c.textPrimary,
                          600,
                          'center',
                      ),
                  ]
                : []),

            // Total indicator
            label(
                c,
                `${st.total} elements`,
                startX + 490,
                st.y + 10,
                110,
                22,
                15,
                c.textPrimary,
                700,
                'left',
                true,
            ),
        ]),

        // Axis scale line
        VectorSegment({
            x1: startX,
            y1: 350,
            x2: startX + 24 * scaleX + 8,
            y2: 350,
            color: muted,
            strokeWidth: 1,
            showStartDot: false,
            showEndDot: false,
        }),
        label(c, '0', startX - 10, 356, 20, 16, 12, muted, 500, 'center', true),
        label(c, '8', startX + 8 * scaleX - 10, 356, 20, 16, 12, muted, 500, 'center', true),
        label(c, '16', startX + 16 * scaleX - 10, 356, 20, 16, 12, muted, 500, 'center', true),
        label(
            c,
            '24 elements',
            startX + 24 * scaleX - 30,
            356,
            80,
            16,
            12,
            muted,
            500,
            'center',
            true,
        ),

        // Bottom takeaway card
        SvgFrame({
            c,
            x: 35,
            y: 395,
            width: 790,
            height: 75,
            rx: 8,
            stroke: muted,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        }),
        label(c, 'Storage Non-Aliasing Principle', 52, 406, 750, 20, 16, c.textPrimary, 700),
        label(
            c,
            'Full-layer gathers allocate separate buffers rather than aliasing local shards, so shards and gathered copies coexist in VRAM.',
            52,
            430,
            750,
            36,
            14,
            muted,
            400,
        ),
    ])
}
