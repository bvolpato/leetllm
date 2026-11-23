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
    'Chunked prefill scheduling across three engine steps with a 6-token budget. Step 0 allocates 1 decode token from R0 and 5 prefill tokens from R1 (6/6 used). Step 1 allocates 1 decode token from R0 and the remaining 4 prefill tokens from R1 (5/6 used, 1 unused). Step 2 allocates 1 decode token each from R0 and R1 (2/6 used, 4 unused) as both requests enter steady-state decoding.'

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
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const scaleX = 72 // pixels per token, 6 tokens = 432 px
    const startX = 260

    const steps = [
        {
            title: 'Step 0 · Used 6 / 6',
            sub: 'R0 decode + R1 prefill chunk 1',
            r0_decode: 1,
            r1_prefill: 5,
            r1_decode: 0,
            unused: 0,
            y: 110,
        },
        {
            title: 'Step 1 · Used 5 / 6',
            sub: 'R0 decode + R1 prefill chunk 2',
            r0_decode: 1,
            r1_prefill: 4,
            r1_decode: 0,
            unused: 1,
            y: 195,
        },
        {
            title: 'Step 2 · Used 2 / 6',
            sub: 'R0 decode + R1 decode (prefill done)',
            r0_decode: 1,
            r1_prefill: 0,
            r1_decode: 1,
            unused: 4,
            y: 280,
        },
    ]

    return renderBoard(c, [
        label(
            c,
            'vLLM Chunked Prefill & Decode Token Budget',
            35,
            18,
            790,
            28,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Token slot allocation across engine steps (shared maximum budget = 6 tokens / step)',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Legend
        SvgFrame({
            c,
            x: 260,
            y: 75,
            width: 14,
            height: 14,
            rx: 3,
            stroke: blue,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.4)' : 'rgba(9, 105, 218, 0.3)',
        }),
        label(c, 'R0 Decode (1 token)', 282, 72, 160, 20, 13, c.textPrimary, 500),

        SvgFrame({
            c,
            x: 450,
            y: 75,
            width: 14,
            height: 14,
            rx: 3,
            stroke: warm,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.4)' : 'rgba(154, 103, 0, 0.3)',
        }),
        label(c, 'R1 Prefill (Chunked)', 472, 72, 160, 20, 13, c.textPrimary, 500),

        SvgFrame({
            c,
            x: 640,
            y: 75,
            width: 14,
            height: 14,
            rx: 3,
            stroke: green,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.4)' : 'rgba(26, 127, 55, 0.3)',
        }),
        label(c, 'R1 Decode', 662, 72, 120, 20, 13, c.textPrimary, 500),

        // Rows
        ...steps.flatMap((st) => {
            let currentX = startX
            const elements = []

            elements.push(
                label(c, st.title, 35, st.y, 200, 22, 16, c.textPrimary, 700),
                label(c, st.sub, 35, st.y + 22, 200, 18, 13, muted),
            )

            // R0 decode block
            if (st.r0_decode > 0) {
                const w = st.r0_decode * scaleX
                elements.push(
                    SvgFrame({
                        c,
                        x: currentX,
                        y: st.y + 4,
                        width: w - 2,
                        height: 40,
                        rx: 4,
                        stroke: blue,
                        strokeWidth: 1.5,
                        fill:
                            theme === 'dark'
                                ? 'rgba(56, 139, 253, 0.3)'
                                : 'rgba(9, 105, 218, 0.25)',
                    }),
                    label(
                        c,
                        'R0 Dec',
                        currentX,
                        st.y + 14,
                        w - 2,
                        20,
                        13,
                        c.textPrimary,
                        600,
                        'center',
                    ),
                )
                currentX += w
            }

            // R1 prefill block
            if (st.r1_prefill > 0) {
                const w = st.r1_prefill * scaleX
                elements.push(
                    SvgFrame({
                        c,
                        x: currentX,
                        y: st.y + 4,
                        width: w - 2,
                        height: 40,
                        rx: 4,
                        stroke: warm,
                        strokeWidth: 1.5,
                        fill:
                            theme === 'dark'
                                ? 'rgba(210, 153, 34, 0.3)'
                                : 'rgba(154, 103, 0, 0.25)',
                    }),
                    label(
                        c,
                        `R1 Prefill (${st.r1_prefill} tok)`,
                        currentX,
                        st.y + 14,
                        w - 2,
                        20,
                        13,
                        c.textPrimary,
                        600,
                        'center',
                    ),
                )
                currentX += w
            }

            // R1 decode block
            if (st.r1_decode > 0) {
                const w = st.r1_decode * scaleX
                elements.push(
                    SvgFrame({
                        c,
                        x: currentX,
                        y: st.y + 4,
                        width: w - 2,
                        height: 40,
                        rx: 4,
                        stroke: green,
                        strokeWidth: 1.5,
                        fill:
                            theme === 'dark' ? 'rgba(63, 185, 80, 0.3)' : 'rgba(26, 127, 55, 0.25)',
                    }),
                    label(
                        c,
                        'R1 Dec',
                        currentX,
                        st.y + 14,
                        w - 2,
                        20,
                        13,
                        c.textPrimary,
                        600,
                        'center',
                    ),
                )
                currentX += w
            }

            // Unused slots block
            if (st.unused > 0) {
                const w = st.unused * scaleX
                elements.push(
                    SvgFrame({
                        c,
                        x: currentX,
                        y: st.y + 4,
                        width: w - 2,
                        height: 40,
                        rx: 4,
                        stroke: muted,
                        strokeWidth: 1,
                        fill:
                            theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    }),
                    label(
                        c,
                        `${st.unused} unused`,
                        currentX,
                        st.y + 14,
                        w - 2,
                        20,
                        13,
                        muted,
                        500,
                        'center',
                    ),
                )
                currentX += w
            }

            return elements
        }),

        // Axis scale line
        VectorSegment({
            x1: startX,
            y1: 345,
            x2: startX + 6 * scaleX,
            y2: 345,
            color: muted,
            strokeWidth: 1,
            showStartDot: false,
            showEndDot: false,
        }),
        label(c, '0', startX - 8, 352, 16, 16, 12, muted, 500, 'center', true),
        label(c, '2', startX + 2 * scaleX - 8, 352, 16, 16, 12, muted, 500, 'center', true),
        label(c, '4', startX + 4 * scaleX - 8, 352, 16, 16, 12, muted, 500, 'center', true),
        label(c, '6 tokens', startX + 6 * scaleX - 25, 352, 60, 16, 12, muted, 500, 'center', true),

        // Bottom panel: Takeaway
        SvgFrame({
            c,
            x: 35,
            y: 400,
            width: 790,
            height: 75,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.04)',
        }),
        label(c, 'Chunked Prefill Scheduling Principle', 52, 410, 750, 20, 16, green, 700),
        label(
            c,
            'Chunking prefill into fixed token budgets prevents large prompt bursts from monopolizing GPU compute. Active decode iterations interleave without experiencing latency spikes.',
            52,
            434,
            750,
            32,
            14,
            c.textPrimary,
            400,
        ),
    ])
}
