import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 472
export const alt =
    'Top diagram unrolls one shared recurrent cell horizontally across three review tokens: h_0 [0, 0] steps through slow to [0.664, 0.100], yet to [0.494, 0.641], and engaging to final state [0.390, 0.655], feeding the output head. Tapering backward arrows directly underneath show scalar sensitivity decaying from 0.333 at step 3 to 0.112 at step 2 and 0.031 at step 1. Bottom bars show softmax probabilities 38.9% positive, 32.0% neutral, 29.1% negative alongside backward sensitivity bars.'

const STEPS = [
    { t: 't=1', tok: '"slow"', state: '[.664, .100]', tone: 'blue' as const, sens: '0.333' },
    { t: 't=2', tok: '"yet"', state: '[.494, .641]', tone: 'cyan' as const, sens: '0.112' },
    { t: 't=3', tok: '"engaging"', state: '[.390, .655]', tone: 'green' as const, sens: '0.031' },
] as const

const PROBS = [
    { label: 'Positive', val: 0.389, txt: '38.9%', tone: 'green' as const },
    { label: 'Neutral', val: 0.32, txt: '32.0%', tone: 'blue' as const },
    { label: 'Negative', val: 0.291, txt: '29.1%', tone: 'neutral' as const },
] as const

const SENS = [
    { label: 'Step 3', val: 0.333, txt: '0.333', tone: 'blue' as const },
    { label: 'Step 2', val: 0.112, txt: '0.112', tone: 'warm' as const },
    { label: 'Step 1', val: 0.031, txt: '0.031', tone: 'critical' as const },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    // ── Header ──────────────────────────────────────────────────────────────
    fig.text(20, 22, 'Shared RNN cell unrolled across 3 tokens', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })
    fig.text(468, 22, 'Shared Wₓ (2×3) and Wₕ (2×2)', {
        size: 17,
        mono: true,
        color: c.textSecondary,
        weight: 600,
    })

    // ── Continuous Horizontal Forward Chain (y = 148) ───────────────────────
    const yCell = 148
    const cellW = 136
    const cellH = 66

    // Initial h_0 pill
    fig.rect(18, yCell - 26, 84, 52, {
        fill: c.bgSubtle,
        stroke: c.border,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(60, yCell - 9, 'h₀', { size: 18, weight: 700, color: c.textPrimary, align: 'center' })
    fig.text(60, yCell + 12, '[0, 0]', {
        size: 16,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    const cellCenters = [212, 398, 584] as const

    STEPS.forEach((st, idx) => {
        const cx = cellCenters[idx]!
        const col = fig.tone(st.tone)
        const fill = tint(col, c.bg, isLight ? 0.12 : 0.2)

        // Input token x_t above cell + vertical W_x arrow
        fig.text(cx, 64, st.tok, {
            size: 18,
            weight: 700,
            color: col,
            align: 'center',
        })
        fig.arrow(cx, 78, cx, yCell - cellH / 2 - 4, { color: col, width: 2, head: 6 })
        fig.text(cx + 24, 94, 'Wₓ', {
            size: 16,
            mono: true,
            color: c.textSecondary,
            weight: 600,
        })

        // Horizontal W_h arrow from previous node
        const prevRight = idx === 0 ? 102 : cellCenters[idx - 1]! + cellW / 2
        const curLeft = cx - cellW / 2
        fig.arrow(prevRight + 4, yCell, curLeft - 4, yCell, {
            color: c.textSecondary,
            width: 2.2,
            head: 6.5,
        })
        fig.text((prevRight + curLeft) / 2, yCell - 18, 'Wₕ', {
            size: 16,
            mono: true,
            color: c.textSecondary,
            align: 'center',
            weight: 600,
        })

        // Cell box
        fig.rect(curLeft, yCell - cellH / 2, cellW, cellH, {
            fill,
            stroke: col,
            strokeWidth: 1.8,
            radius: 9,
        })
        fig.text(cx, yCell - 12, `${st.t} · h${idx + 1}`, {
            size: 18,
            weight: 750,
            color: col,
            align: 'center',
        })
        fig.text(cx, yCell + 14, st.state, {
            size: 16,
            mono: true,
            color: c.textPrimary,
            align: 'center',
            weight: 600,
        })
    })

    // Arrow t=3 -> Head
    fig.arrow(584 + cellW / 2 + 4, yCell, 704, yCell, { color: green, width: 2.4, head: 7 })
    fig.rect(708, yCell - 30, 114, 60, {
        fill: tint(green, c.bg, isLight ? 0.16 : 0.24),
        stroke: green,
        strokeWidth: 1.9,
        radius: 9,
    })
    fig.text(765, yCell - 10, 'Head', { size: 17, weight: 750, color: green, align: 'center' })
    fig.text(765, yCell + 14, 'Pos 38.9%', {
        size: 16,
        mono: true,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    // ── Aligned Backward Gradient Decay Arrows Directly Underneath ──────────
    const yBack = 236
    fig.text(20, yBack, 'Backward', { size: 17, weight: 700, color: red })
    fig.text(20, yBack + 22, '|∂h₃/∂xₖ|', { size: 16, mono: true, color: c.textSecondary })

    // Tapering right-to-left arrows aligned directly under t=3 -> t=2 -> t=1
    // From Head into t=3 (thickest)
    fig.arrow(716, yBack, 616, yBack, { color: blue, width: 5.5, head: 8 })
    // t=3 -> t=2 (medium)
    fig.arrow(552, yBack, 430, yBack, { color: amberMark, width: 3.2, head: 7 })
    // t=2 -> t=1 (thin, decayed)
    fig.arrow(366, yBack, 244, yBack, { color: red, width: 1.7, head: 6 })

    // Aligned decay dots + numeric badges directly under each cell center
    const decayNodes = [
        { cx: cellCenters[2], val: '0.333', pct: '100%', color: blue, textCol: blue, r: 7 },
        { cx: cellCenters[1], val: '0.112', pct: '33.6%', color: amberMark, textCol: amberText, r: 5.5 },
        { cx: cellCenters[0], val: '0.031', pct: '9.4%', color: red, textCol: red, r: 4.5 },
    ] as const

    for (const dn of decayNodes) {
        fig.line(dn.cx, yCell + cellH / 2 + 4, dn.cx, yBack - 12, {
            color: dn.color,
            width: 1.2,
            dash: '3 3',
            opacity: 0.7,
        })
        fig.circle(dn.cx, yBack, dn.r, { fill: dn.color })
        fig.text(dn.cx, yBack + 24, `${dn.val} (${dn.pct})`, {
            size: 17,
            mono: true,
            weight: 700,
            color: dn.textCol,
            align: 'center',
        })
    }

    // Divider before bottom quantitative bars
    fig.line(20, 286, width - 20, 286, { color: c.borderSubtle, width: 1.2 })

    // ── Bottom Left: Head Output Probabilities ──────────────────────────────
    fig.text(20, 306, 'Head output from h₃', { size: 19, weight: 750, color: green })
    fig.text(20, 330, 'logits [0.076, 0.368, 0.170]', {
        size: 15,
        mono: true,
        color: c.textSecondary,
    })

    const barMaxW = 184
    PROBS.forEach((p, i) => {
        const cy = 366 + i * 38
        const col = p.tone === 'neutral' ? c.textMuted : fig.tone(p.tone)
        const w = Math.max(8, (p.val / 0.45) * barMaxW)
        fig.text(114, cy, p.label, { size: 18, weight: 650, color: c.textPrimary, align: 'right' })
        fig.rect(126, cy - 10, barMaxW, 20, { fill: c.bgSubtle, radius: 4 })
        fig.rect(126, cy - 10, w, 20, { fill: col, radius: 4 })
        fig.text(126 + barMaxW + 10, cy, p.txt, {
            size: 18,
            mono: true,
            weight: 700,
            color: col,
        })
    })

    // Vertical divider
    fig.line(422, 298, 422, height - 16, { color: c.borderSubtle, width: 1.2 })

    // ── Bottom Right: Backward Sensitivity Bars ─────────────────────────────
    fig.text(444, 306, 'Backward sensitivity |∂h₃/∂xₖ|', {
        size: 19,
        weight: 750,
        color: amberText,
    })
    fig.text(444, 330, 'Step 1 retains 9.4% of Step 3', {
        size: 15,
        mono: true,
        color: c.textSecondary,
    })

    SENS.forEach((s, i) => {
        const cy = 366 + i * 38
        const col = s.tone === 'warm' ? amberMark : fig.tone(s.tone)
        const ink = s.tone === 'warm' ? amberText : fig.tone(s.tone)
        const w = Math.max(8, (s.val / 0.36) * barMaxW)
        fig.text(530, cy, s.label, { size: 18, weight: 650, color: c.textPrimary, align: 'right' })
        fig.rect(542, cy - 10, barMaxW, 20, { fill: c.bgSubtle, radius: 4 })
        fig.rect(542, cy - 10, w, 20, { fill: col, radius: 4 })
        fig.text(542 + barMaxW + 10, cy, s.txt, {
            size: 18,
            mono: true,
            weight: 700,
            color: ink,
        })
    })

    return fig.render()
}

export default create('dark')
