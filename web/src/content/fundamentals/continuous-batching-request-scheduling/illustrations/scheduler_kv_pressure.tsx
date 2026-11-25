import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Four-step two-slot KV pool timeline showing preemption under memory pressure. Step 1: urgent U (priority 1) and background B (priority 0) each hold 1 block at 16 tokens (2 of 2 blocks full). Step 2: at token 17 both need a second block, projecting 4 blocks against the 2-block budget. Step 3: scheduler preempts B, frees its block, and gives both blocks to U so U completes. Step 4: B resumes on freed slots and finishes, ending at 0 of 2 blocks used after 1 preemption.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    fig.text(28, 20, '2-block KV pool under contention · Urgent U (p1) vs Background B (p0)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(732, 20, 'Pool cap: 2 blocks', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'right',
    })

    const colW = 152
    const colGap = 32
    const startX = 42
    const poolTop = 108
    const slotH = 54
    const slotGap = 10
    const poolBot = poolTop + 2 * slotH + slotGap

    // Horizontal budget ceiling line cleanly above slots (label sits in header row, zero overlap!)
    fig.line(startX - 10, poolTop - 10, startX + 4 * colW + 3 * colGap + 10, poolTop - 10, {
        color: warm,
        width: 1.5,
        dash: '5 4',
    })

    const steps = [
        { num: 'Step 1 · 16 tok', sub: '2 / 2 blocks used', tone: c.textPrimary },
        { num: 'Step 2 · 17 tok', sub: 'Need 4 > 2 cap!', tone: red },
        { num: 'Step 3 · Preempt B', sub: 'U runs with 2/2', tone: blue },
        { num: 'Step 4 · Finish', sub: 'B resumes → 0/2', tone: green },
    ]

    const drawSlot = (
        x: number,
        y: number,
        label: string,
        tone: string,
        dashed = false,
        empty = false,
    ) => {
        fig.rect(x, y, colW, slotH, {
            fill: empty
                ? tint(c.textMuted, c.bg, 0.05)
                : tint(tone, c.bg, theme === 'light' ? (dashed ? 0.1 : 0.24) : dashed ? 0.16 : 0.36),
            stroke: empty ? c.borderLight : tone,
            strokeWidth: dashed ? 1.5 : 1.75,
            radius: 7,
        })
        fig.text(x + colW / 2, y + slotH / 2, label, {
            size: 13,
            weight: empty ? 500 : 700,
            color: empty ? c.textMuted : dashed ? tone : c.textPrimary,
            align: 'center',
        })
    }

    steps.forEach((st, idx) => {
        const sx = startX + idx * (colW + colGap)
        fig.text(sx + colW / 2, 54, st.num, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(sx + colW / 2, 74, st.sub, {
            size: 12,
            weight: 600,
            color: st.tone,
            align: 'center',
        })

        // Arrows between steps
        if (idx < 3) {
            fig.arrow(
                sx + colW + 4,
                (poolTop + poolBot) / 2,
                sx + colW + colGap - 4,
                (poolTop + poolBot) / 2,
                { color: c.textMuted, width: 1.75, head: 6 },
            )
        }
    })

    // Step 1: Slot 0 = U (p1), Slot 1 = B (p0)
    const x0 = startX
    drawSlot(x0, poolTop, 'U · page 1 (p1)', blue)
    drawSlot(x0, poolTop + slotH + slotGap, 'B · page 1 (p0)', green)

    // Step 2: Slot 0 = U, Slot 1 = B, PLUS overflow demand below pool line!
    const x1 = startX + (colW + colGap)
    drawSlot(x1, poolTop, 'U · page 1', blue)
    drawSlot(x1, poolTop + slotH + slotGap, 'B · page 1', green)
    // Overflow demand box below pool boundary
    const ovY = poolBot + 22
    fig.rect(x1, ovY, colW, 68, {
        fill: tint(red, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: red,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(x1 + colW / 2, ovY + 20, 'Overflow (+2)', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.text(x1 + colW / 2, ovY + 44, 'U +1  &  B +1', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Step 3: U owns both slots, B paused in wait queue below
    const x2 = startX + 2 * (colW + colGap)
    drawSlot(x2, poolTop, 'U · page 1', blue)
    drawSlot(x2, poolTop + slotH + slotGap, 'U · page 2', blue)
    fig.rect(x2, ovY, colW, 68, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(x2 + colW / 2, ovY + 20, 'B paused (evicted)', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(x2 + colW / 2, ovY + 44, '0 blocks held', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Step 4: U done -> B resumes & finishes -> 0/2 free
    const x3 = startX + 3 * (colW + colGap)
    drawSlot(x3, poolTop, 'Free (slot 0)', c.textMuted, true, true)
    drawSlot(x3, poolTop + slotH + slotGap, 'Free (slot 1)', c.textMuted, true, true)
    fig.rect(x3, ovY, colW, 68, {
        fill: tint(green, c.bg, theme === 'light' ? 0.12 : 0.18),
        stroke: green,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(x3 + colW / 2, ovY + 20, 'U & B complete', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(x3 + colW / 2, ovY + 44, '1 preemption total', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Left slot labels
    fig.text(startX - 10, poolTop + slotH / 2, 'S0', {
        size: 12,
        weight: 600,
        color: c.textMuted,
        align: 'right',
        mono: true,
    })
    fig.text(startX - 10, poolTop + slotH + slotGap + slotH / 2, 'S1', {
        size: 12,
        weight: 600,
        color: c.textMuted,
        align: 'right',
        mono: true,
    })

    fig.text(380, 366, 'Lower-priority victim releases its block so urgent finishes without deadlock', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create
