import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 736
export const height = 435
export const alt =
    'Context-window pruning diagram comparing a crowded 12,436-token raw debugging window against a curated 3,346-token next call on a shared token scale. Top raw bar shows test_log_17 (20% depth, kv_cache.py:84) and diff_summary (60% depth, attention.py:112) separated by 40% old pytest noise and 25% unused/BPE noise. Four curation moves (Select, Write+Reload, Compress, Isolate) prune 9,090 net tokens so the bottom curated 3,346-token call places both clues directly adjacent beside 186 tokens of reloaded notes.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')

    const x0 = 24
    const totalW = 688
    const rawTotal = 12436
    const wOf = (tok: number) => (tok / rawTotal) * totalW

    // --- Top bar: Raw 12,436-token window ---
    fig.text(x0, 20, 'Raw context window · 12,436 tokens (clues separated by noise)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const rawY = 48
    const rawH = 44
    const segs = [
        { label: 'PR + test_log_17', pct: '20%', w: totalW * 0.2, color: blue, keep: true },
        { label: 'Old pytest dump (8,200 tok)', pct: '40%', w: totalW * 0.4, color: red, keep: false },
        { label: 'diff_summary', pct: '15%', w: totalW * 0.15, color: warm, keep: true },
        { label: 'Unused + BPE', pct: '25%', w: totalW * 0.25, color: c.textMuted, keep: false },
    ]

    let curX = x0
    const segCenters: number[] = []
    segs.forEach((s) => {
        fig.rect(curX, rawY, s.w - 2, rawH, {
            fill: tint(s.color, c.bg, theme === 'light' ? (s.keep ? 0.28 : 0.16) : s.keep ? 0.38 : 0.22),
            stroke: s.color,
            strokeWidth: s.keep ? 1.75 : 1.25,
            radius: 5,
        })
        fig.text(curX + (s.w - 2) / 2, rawY + 14, s.label, {
            size: 14,
            weight: 700,
            color: s.keep ? c.textPrimary : s.color,
            align: 'center',
        })
        fig.text(curX + (s.w - 2) / 2, rawY + 32, s.pct, {
            size: 14,
            color: s.color,
            align: 'center',
            mono: true,
        })
        segCenters.push(curX + (s.w - 2) / 2)
        curX += s.w
    })

    // Depth markers highlighting buried clues (keep strictly inside [x0, x0+totalW] so autocrop stays tight!)
    fig.text(x0, rawY + rawH + 16, 'kv_cache.py:84 (20% depth)', {
        size: 14,
        weight: 600,
        color: blue,
        align: 'left',
        mono: true,
    })
    fig.text(segCenters[2]!, rawY + rawH + 16, 'attention.py:112 (60% depth)', {
        size: 14,
        weight: 600,
        color: warm,
        align: 'center',
        mono: true,
    })

    // --- Middle: Four compact context curation moves aligned 1-to-1 (zero crossing!) ---
    const moveY = 166
    const moveH = 62
    const moveW = 160
    const moveGap = 16
    const moves = [
        { num: '1. Select', sub: 'Keep trace + spec', tone: blue },
        { num: '3. Compress', sub: 'Drop 8,200 pytest', tone: red },
        { num: '2. Write + Reload', sub: 'Reload 186-tok notes', tone: green },
        { num: '4. Isolate', sub: 'Offload BPE trace', tone: purple },
    ]
    moves.forEach((m, i) => {
        const mx = x0 + i * (moveW + moveGap)
        fig.rect(mx, moveY, moveW, moveH, {
            fill: tint(m.tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: m.tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(mx + moveW / 2, moveY + 20, m.num, {
            size: 14,
            weight: 700,
            color: m.tone,
            align: 'center',
        })
        fig.text(mx + moveW / 2, moveY + 42, m.sub, {
            size: 14,
            color: c.textSecondary,
            align: 'center',
        })
    })

    // Planar 1-to-1 flow connectors from top segments to curation moves (zero crossings!)
    fig.arrow(segCenters[0]!, rawY + rawH + 28, x0 + moveW / 2, moveY - 4, {
        color: blue,
        width: 1.6,
        head: 5.5,
    })
    fig.arrow(segCenters[1]!, rawY + rawH + 8, x0 + (moveW + moveGap) + moveW / 2, moveY - 4, {
        color: red,
        width: 1.5,
        dash: '4 3',
        head: 5.5,
    })
    fig.arrow(segCenters[2]!, rawY + rawH + 28, x0 + 2 * (moveW + moveGap) + moveW / 2, moveY - 4, {
        color: warm,
        width: 1.6,
        head: 5.5,
    })
    fig.arrow(segCenters[3]!, rawY + rawH + 8, x0 + 3 * (moveW + moveGap) + moveW / 2, moveY - 4, {
        color: purple,
        width: 1.5,
        dash: '4 3',
        head: 5.5,
    })

    // --- Bottom bar: Curated 3,346-token next call on EXACT same 12,436-token scale ---
    const curY = 294
    const curH = 48
    fig.text(x0, curY - 22, 'Curated next call · 3,346 tokens (−73.1%) · clues now adjacent', {
        size: 15,
        weight: 600,
        color: green,
    })

    // Kept active 3,160 split into adjacent clues + reloaded 186 notes
    const activeW = wOf(3160)
    const clue1W = activeW * 0.56
    const clue2W = activeW - clue1W
    const noteW = Math.max(24, wOf(186))
    const keptTotalW = clue1W + clue2W + noteW
    const prunedW = totalW - keptTotalW

    // Clue 1 (test_log_17)
    fig.rect(x0, curY, clue1W, curH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.3 : 0.42),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 5,
    })
    fig.text(x0 + clue1W / 2, curY + curH / 2, 'kv:84', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Clue 2 (diff_summary) directly adjacent!
    fig.rect(x0 + clue1W + 2, curY, clue2W - 2, curH, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.3 : 0.42),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 5,
    })
    fig.text(x0 + clue1W + clue2W / 2, curY + curH / 2, 'att:112', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Reloaded notes (+186)
    fig.rect(x0 + clue1W + clue2W + 2, curY, noteW - 2, curH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.35 : 0.48),
        stroke: green,
        strokeWidth: 1.75,
        radius: 5,
    })

    // Ghosted pruned region (9,090 tokens freed!)
    fig.rect(x0 + keptTotalW + 6, curY, prunedW - 6, curH, {
        fill: tint(c.textMuted, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 5,
    })
    fig.text(x0 + keptTotalW + prunedW / 2, curY + curH / 2, '9,090 tokens pruned (−73.1% smaller context)', {
        size: 14,
        weight: 600,
        color: c.textMuted,
        align: 'center',
    })

    // Arrows feeding curated call from Select & Write+Reload (cleanly clear of section heading)
    fig.arrow(x0 + moveW / 2, moveY + moveH + 2, x0 + activeW / 2, curY - 36, {
        color: blue,
        width: 1.6,
        head: 5.5,
    })
    fig.arrow(
        x0 + 2 * (moveW + moveGap) + moveW / 2,
        moveY + moveH + 2,
        x0 + clue1W + clue2W + noteW / 2,
        curY - 36,
        {
            color: green,
            width: 1.6,
            head: 5.5,
        },
    )

    // Clean dimension braces below bottom bar
    fig.brace(x0, curY + curH + 6, x0 + keptTotalW, curY + curH + 6, '3,160 active + 186 notes = 3,346 tok', {
        side: 1,
        depth: 8,
        color: green,
        labelColor: green,
        labelSize: 14,
        labelGap: 14,
        weight: 600,
    })

    return fig.render()
}

export default create
