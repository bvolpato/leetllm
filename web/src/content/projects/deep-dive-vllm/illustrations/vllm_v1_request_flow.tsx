import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 370
export const alt =
    'Chunked prefill scheduling across three engine steps with a 6-token budget. Step 0 allocates 1 decode token from R0 and 5 prefill tokens from R1 (6/6 used). Step 1 allocates 1 decode token from R0 and the remaining 4 prefill tokens from R1 (5/6 used, 1 unused). Step 2 allocates 1 decode token each from R0 and R1 (2/6 used, 4 unused) as both requests enter steady-state decoding.'

const STEPS = [
    {
        title: 'Step 0',
        used: '6 / 6 used',
        note: 'R0 dec + R1 chunk 1',
        segments: [
            { label: 'R0 dec', tokens: 1, kind: 'r0' as const },
            { label: 'R1 prefill (5 tok)', tokens: 5, kind: 'r1pre' as const },
        ],
    },
    {
        title: 'Step 1',
        used: '5 / 6 used',
        note: 'R1 finishes prefill',
        segments: [
            { label: 'R0 dec', tokens: 1, kind: 'r0' as const },
            { label: 'R1 prefill (4 tok)', tokens: 4, kind: 'r1pre' as const },
            { label: '1 free', tokens: 1, kind: 'free' as const },
        ],
    },
    {
        title: 'Step 2',
        used: '2 / 6 used',
        note: 'Both steady decode',
        segments: [
            { label: 'R0 dec', tokens: 1, kind: 'r0' as const },
            { label: 'R1 dec', tokens: 1, kind: 'r1dec' as const },
            { label: '4 unused', tokens: 4, kind: 'free' as const },
        ],
    },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const muted = c.textSecondary

    const startX = 244
    const scaleX = 92 // 6 tokens = 552px -> ends at 796
    const rightX = startX + 6 * scaleX

    // --- Top Inline Legend ---
    const legend = [
        { x: 244, label: 'R0 Decode', color: blue, dashed: false },
        { x: 374, label: 'R1 Prefill (chunked)', color: warm, dashed: false },
        { x: 562, label: 'R1 Decode', color: green, dashed: false },
        { x: 682, label: 'Unused slots', color: muted, dashed: true },
    ]
    for (const item of legend) {
        fig.rect(item.x, 18, 16, 16, {
            fill: item.dashed ? 'none' : tint(item.color, c.bg, 0.25),
            stroke: item.color,
            strokeWidth: 1.5,
            radius: 3,
        })
        fig.text(item.x + 24, 26, item.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
        })
    }

    // --- Vertical Gridlines for 0..6 tokens ---
    const chartTop = 58
    const chartBot = 304
    for (let t = 0; t <= 6; t++) {
        const gx = startX + t * scaleX
        fig.line(gx, chartTop, gx, chartBot, {
            color: t === 6 ? green : c.borderSubtle,
            width: t === 6 ? 1.5 : 1,
            dash: t === 6 ? '5 4' : undefined,
        })
    }
    fig.text(rightX, chartTop - 10, 'Budget = 6', {
        size: 12,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    // --- 3 Step Rows ---
    const rowYs = [74, 152, 230] as const
    const barH = 48

    STEPS.forEach((st, idx) => {
        const y = rowYs[idx]!
        fig.text(24, y + 12, `${st.title}  ·  ${st.used}`, {
            size: 15,
            weight: 700,
            color: c.textPrimary,
        })
        fig.text(24, y + 36, st.note, { size: 13, color: muted })

        let curX = startX
        for (const seg of st.segments) {
            const w = seg.tokens * scaleX - 4
            const tone =
                seg.kind === 'r0'
                    ? blue
                    : seg.kind === 'r1pre'
                      ? warm
                      : seg.kind === 'r1dec'
                        ? green
                        : muted
            const isFree = seg.kind === 'free'
            fig.rect(curX + 2, y, w, barH, {
                fill: isFree ? tint(c.textMuted, c.bg, 0.04) : tint(tone, c.bg, 0.22),
                stroke: isFree ? c.border : tone,
                strokeWidth: isFree ? 1 : 1.75,
                radius: 6,
            })
            fig.text(curX + 2 + w / 2, y + barH / 2, seg.label, {
                size: 14,
                weight: isFree ? 500 : 700,
                color: isFree ? muted : tone,
                align: 'center',
                width: w - 6,
            })
            curX += seg.tokens * scaleX
        }
    })

    // --- Bottom Token Scale Axis ---
    fig.line(startX, chartBot, rightX, chartBot, { color: c.textMuted, width: 1.25 })
    for (let t = 0; t <= 6; t++) {
        const gx = startX + t * scaleX
        fig.line(gx, chartBot, gx, chartBot + 5, { color: c.textMuted, width: 1.25 })
        fig.text(gx, chartBot + 20, String(t), {
            size: 13,
            weight: 600,
            color: muted,
            align: 'center',
            mono: true,
            width: 30,
        })
    }
    fig.text(startX + 3 * scaleX, chartBot + 44, 'Tokens scheduled per engine step (max budget = 6)', {
        size: 13,
        color: muted,
        align: 'center',
        width: 440,
    })

    return fig.render()
}

export default create()
