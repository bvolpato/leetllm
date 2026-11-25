import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 408
export const alt =
    'Three aligned stages of a production sampler pipeline on four candidate tokens: bright, clear, warm, and pale. Stage 1 shows raw logits [2.4, 2.1, 1.2, 0.3] with bright leading. Stage 2 applies repetition penalty theta = 1.2 to seen token bright, dropping it from 2.4 to 2.0 below clear (2.1) and flipping greedy argmax to clear. Stage 3 sorts softmax probabilities [0.404, 0.365, 0.164, 0.067] and plots cumulative mass crossing top-p = 0.90 at rank 3 warm (CDF 0.933), cutting pale (0.067).'

const tokensStage12 = ['bright', 'clear', 'warm', 'pale']
const rawLogits = [2.4, 2.1, 1.2, 0.3]
const penLogits = [2.0, 2.1, 1.2, 0.3]

const sortedTokens = ['clear', 'bright', 'warm', 'pale']
const sortedProbs = [0.404, 0.365, 0.164, 0.067]
const cdf = [0.404, 0.769, 0.933, 1.0]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const muted = c.textMuted

    const plotY = 66
    const plotH = 266
    const stageW = 194
    const xs = [48, 280, 520]

    // ─── STAGE 1: Raw logits ───
    const s1 = fig.plot({ x: xs[0]!, y: plotY, width: stageW, height: plotH }, { x: [0, 4], y: [0, 2.8] })
    fig.text(xs[0]! + stageW / 2, 20, '1. Raw logits', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(xs[0]! + stageW / 2, 40, 'bright leads (seen)', {
        size: 13,
        color: warm,
        align: 'center',
        weight: 600,
    })

    for (const tick of [0, 1, 2]) {
        const py = s1.py(tick)
        fig.line(s1.area.x, py, s1.right, py, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
        })
        fig.text(s1.area.x - 8, py, tick.toFixed(1), {
            size: 13,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(s1.area.x, s1.area.y, s1.area.x, s1.bottom, { color: c.borderLight, width: 1 })

    const slot1 = stageW / 4
    const barW = 30
    rawLogits.forEach((v, idx) => {
        const cx = s1.area.x + (idx + 0.5) * slot1
        const y0 = s1.py(0)
        const y1 = s1.py(v)
        const col = idx === 0 ? warm : idx === 1 ? blue : idx === 2 ? blue : muted
        fig.rect(cx - barW / 2, y1, barW, y0 - y1, {
            fill: tint(col, c.bg, theme === 'dark' ? 0.36 : 0.24),
            stroke: col,
            strokeWidth: 1.5,
            radius: 3,
        })
        fig.text(cx, y1 - 12, v.toFixed(1), {
            size: 13,
            color: col,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(cx, s1.bottom + 18, tokensStage12[idx]!, {
            size: 13,
            color: idx === 0 ? warm : c.textPrimary,
            align: 'center',
            mono: true,
            weight: idx === 0 ? 700 : 500,
        })
    })

    // Arrow 1 -> 2
    fig.arrow(xs[0]! + stageW + 6, plotY + 115, xs[1]! - 8, plotY + 115, {
        color: warm,
        width: 1.8,
        head: 6,
    })
    fig.text((xs[0]! + stageW + xs[1]!) / 2, plotY + 95, '÷1.2', {
        size: 13,
        color: warm,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // ─── STAGE 2: Penalized logits (theta = 1.2) ───
    const s2 = fig.plot({ x: xs[1]!, y: plotY, width: stageW, height: plotH }, { x: [0, 4], y: [0, 2.8] })
    fig.text(xs[1]! + stageW / 2, 20, '2. Penalty (θ = 1.2)', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(xs[1]! + stageW / 2, 40, 'clear flips to argmax', {
        size: 13,
        color: green,
        align: 'center',
        weight: 600,
    })

    for (const tick of [0, 1, 2]) {
        const py = s2.py(tick)
        fig.line(s2.area.x, py, s2.right, py, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
        })
    }
    fig.line(s2.area.x, s2.area.y, s2.area.x, s2.bottom, { color: c.borderLight, width: 1 })

    // Reference threshold at clear = 2.1
    fig.line(s2.area.x, s2.py(2.1), s2.right, s2.py(2.1), {
        color: green,
        width: 1.3,
        dash: '4 4',
    })

    penLogits.forEach((v, idx) => {
        const cx = s2.area.x + (idx + 0.5) * slot1
        const y0 = s2.py(0)
        const y1 = s2.py(v)
        const col = idx === 1 ? green : idx === 0 ? warm : idx === 2 ? blue : muted

        // Show ghost pre-penalty cap on bright (2.4 -> 2.0)
        if (idx === 0) {
            const yOld = s2.py(2.4)
            fig.rect(cx - barW / 2, yOld, barW, y1 - yOld, {
                fill: tint(warm, c.bg, 0.12),
                stroke: warm,
                strokeWidth: 1.2,
                radius: 3,
                opacity: 0.7,
            })
            fig.arrow(cx, yOld + 3, cx, y1 - 2, { color: warm, width: 1.8, head: 5 })
            fig.text(cx, yOld - 11, '2.4↓', {
                size: 12.5,
                color: warm,
                align: 'center',
                mono: true,
                weight: 600,
            })
        }

        fig.rect(cx - barW / 2, y1, barW, y0 - y1, {
            fill: tint(col, c.bg, theme === 'dark' ? 0.38 : 0.25),
            stroke: col,
            strokeWidth: 1.6,
            radius: 3,
        })

        fig.text(cx, idx === 0 ? y1 + 16 : y1 - 12, v.toFixed(1), {
            size: 13,
            color: idx === 0 ? c.textPrimary : col,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(cx, s2.bottom + 18, tokensStage12[idx]!, {
            size: 13,
            color: idx === 1 ? green : c.textPrimary,
            align: 'center',
            mono: true,
            weight: idx === 1 ? 700 : 500,
        })
    })

    // Arrow 2 -> 3
    fig.arrow(xs[1]! + stageW + 6, plotY + 115, xs[2]! - 34, plotY + 115, {
        color: purple,
        width: 1.8,
        head: 6,
    })
    fig.text((xs[1]! + stageW + xs[2]! - 28) / 2, plotY + 95, 'sort', {
        size: 12.5,
        color: purple,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // ─── STAGE 3: Sorted softmax probs + CDF + top-p = 0.90 cut ───
    const s3W = 204
    const s3 = fig.plot({ x: xs[2]!, y: plotY, width: s3W, height: plotH }, { x: [0, 4], y: [0, 1.12] })
    fig.text(xs[2]! + s3W / 2, 20, '3. Softmax & top-p = 0.90', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(xs[2]! + s3W / 2, 40, 'keeps 3 (0.933) · cuts pale', {
        size: 13,
        color: purple,
        align: 'center',
        weight: 600,
    })

    for (const tick of [0, 0.5, 1.0]) {
        const py = s3.py(tick)
        fig.line(s3.area.x, py, s3.right, py, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
        })
        fig.text(s3.area.x - 6, py, tick.toFixed(1), {
            size: 13,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(s3.area.x, s3.area.y, s3.area.x, s3.bottom, { color: c.borderLight, width: 1 })

    // Top-p = 0.90 horizontal dashed threshold
    const yTopP = s3.py(0.9)
    fig.line(s3.area.x, yTopP, s3.right, yTopP, {
        color: warm,
        width: 1.6,
        dash: '5 4',
    })
    fig.text(s3.area.x + 4, yTopP - 11, 'p = 0.90', {
        size: 12.5,
        color: warm,
        mono: true,
        weight: 700,
    })

    // Vertical nucleus cutoff divider between warm (rank 3) and pale (rank 4)
    const slot3 = s3W / 4
    const cutX = s3.area.x + 3 * slot3
    fig.line(cutX, s3.area.y + 8, cutX, s3.bottom, {
        color: fig.tone('critical'),
        width: 1.4,
        dash: '3 3',
        opacity: 0.85,
    })

    // Softmax bars
    sortedProbs.forEach((p, idx) => {
        const cx = s3.area.x + (idx + 0.5) * slot3
        const y0 = s3.py(0)
        const y1 = s3.py(p)
        const kept = idx < 3
        const col = idx === 0 ? green : kept ? blue : muted
        fig.rect(cx - 15, y1, 30, y0 - y1, {
            fill: tint(col, c.bg, kept ? (theme === 'dark' ? 0.36 : 0.25) : 0.14),
            stroke: col,
            strokeWidth: kept ? 1.5 : 1,
            radius: 3,
        })
        fig.text(cx, idx === 0 ? y1 + 17 : y1 - 11, p.toFixed(3).slice(1), {
            size: 12.5,
            color: idx === 0 ? (theme === 'dark' ? '#ffffff' : c.textPrimary) : kept ? col : muted,
            align: 'center',
            mono: true,
            weight: kept ? 700 : 500,
        })
        fig.text(cx, s3.bottom + 18, sortedTokens[idx]!, {
            size: 13,
            color: kept ? c.textPrimary : muted,
            align: 'center',
            mono: true,
            weight: kept ? 600 : 400,
        })
    })

    // CDF curve overlaid cleanly
    const cdfPts = cdf.map((v, idx) => [idx + 0.5, v] as const)
    s3.curve(cdfPts, { color: purple, width: 2.3 })
    cdf.forEach((v, idx) => {
        const cx = s3.px(idx + 0.5)
        const cy = s3.py(v)
        const isCrossing = idx === 2
        fig.circle(cx, cy, isCrossing ? 5.5 : 4.2, {
            fill: isCrossing ? green : idx === 3 ? muted : purple,
            stroke: c.bg,
            width: 1.8,
        })
        if (isCrossing) {
            fig.text(cx - 8, cy - 16, '0.933', {
                size: 12.5,
                color: green,
                align: 'center',
                mono: true,
                weight: 700,
            })
        }
    })

    // Concise bottom status note under Stage 3
    fig.text(s3.area.x + 1.5 * slot3, s3.bottom + 42, 'kept nucleus', {
        size: 12.5,
        color: green,
        align: 'center',
        weight: 700,
    })
    fig.text(s3.area.x + 3.5 * slot3, s3.bottom + 42, 'cut', {
        size: 12.5,
        color: fig.tone('critical'),
        align: 'center',
        weight: 700,
    })

    return fig.render()
}

export default create('dark')
