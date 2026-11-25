import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 415
export const alt =
    'PyTorch FSDP2 parameter lifecycle on four ranks with reshard_after_forward=True. Rank 0 stores a 1-row parameter shard (P/4) at rest, performs an All-Gather to construct the full 4-row parameter (P) during forward execution, and immediately reshards back to P/4 to minimize peak memory.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const muted = c.textSecondary

    const xs = [24, 314, 604] as const
    const cellW = 21
    const cellH = 26
    const cellGap = 2
    const gridW = 8 * cellW + 7 * cellGap // 182px
    const gridTop = 94

    const drawGrid = (
        x: number,
        mode: 'sharded' | 'gathered' | 'resharded',
    ) => {
        for (let row = 0; row < 4; row++) {
            const ry = gridTop + row * (cellH + 6)
            const isLocal = row === 0
            const isPresent = mode === 'gathered' || isLocal
            const tone = isLocal ? purple : green

            for (let col = 0; col < 8; col++) {
                const cx = x + col * (cellW + cellGap)
                if (isPresent) {
                    fig.rect(cx, ry, cellW, cellH, {
                        fill: tint(tone, c.bg, isLocal ? 0.24 : 0.16),
                        stroke: tone,
                        strokeWidth: 1.25,
                        radius: 4,
                    })
                    fig.text(cx + cellW / 2, ry + cellH / 2, String(row * 8 + col), {
                        size: 11,
                        weight: 600,
                        color: tone,
                        align: 'center',
                        mono: true,
                        width: cellW,
                    })
                } else {
                    fig.rect(cx, ry, cellW, cellH, {
                        fill: 'none',
                        stroke: c.borderSubtle,
                        strokeWidth: 1,
                        radius: 4,
                        opacity: 0.65,
                    })
                }
            }

            // Right-edge compact rank ownership tag
            const tagX = x + gridW + 6
            fig.text(tagX, ry + cellH / 2, `R${row}`, {
                size: 11,
                weight: isPresent ? 700 : 400,
                color: isPresent ? tone : c.textMuted,
                mono: true,
            })
        }

        if (mode !== 'gathered') {
            const overlayY = gridTop + (cellH + 6) + 34
            fig.text(
                x + gridW / 2,
                overlayY,
                mode === 'sharded' ? 'Rows 1..3 on Ranks 1..3' : 'Rows 1..3 freed',
                {
                    size: 12,
                    weight: 600,
                    color: mode === 'sharded' ? muted : warm,
                    align: 'center',
                    width: gridW,
                },
            )
        }
    }

    // --- Stage 1: At Rest ---
    fig.text(xs[0], 22, '1. At Rest (Sharded)', { size: 15, weight: 700, color: purple })
    fig.text(xs[0], 44, 'Rank 0 holds Shard(0) only', { size: 13, color: muted })
    fig.math(xs[0], 70, '\\text{Weight VRAM} = P / 4', { size: 14, color: purple })
    drawGrid(xs[0], 'sharded')
    fig.text(xs[0], 242, '8 local params (0 duplication)', {
        size: 13,
        weight: 600,
        color: purple,
    })

    // Arrow 1 -> 2 (in clear gap between x=230 and x=308)
    const gap1Start = xs[0] + gridW + 28
    const gap1End = xs[1] - 8
    fig.arrow(gap1Start, 154, gap1End, 154, { color: cyan, width: 2.25, head: 6 })
    fig.text((gap1Start + gap1End) / 2, 134, 'All-Gather', {
        size: 12,
        weight: 700,
        color: cyan,
        align: 'center',
        width: 72,
    })

    // --- Stage 2: Forward Compute ---
    fig.text(xs[1], 22, '2. Forward Compute', { size: 15, weight: 700, color: green })
    fig.text(xs[1], 44, 'Full 4-row weight assembled', { size: 13, color: muted })
    fig.math(xs[1], 70, '\\text{Weight VRAM} = P', { size: 14, color: green })
    drawGrid(xs[1], 'gathered')
    fig.text(xs[1], 242, '32 params for local GEMM', {
        size: 13,
        weight: 600,
        color: green,
    })

    // Arrow 2 -> 3 (in clear gap between x=520 and x=598)
    const gap2Start = xs[1] + gridW + 28
    const gap2End = xs[2] - 8
    fig.arrow(gap2Start, 154, gap2End, 154, { color: warm, width: 2.25, head: 6 })
    fig.text((gap2Start + gap2End) / 2, 134, 'Reshard', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
        width: 72,
    })

    // --- Stage 3: After Forward ---
    fig.text(xs[2], 22, '3. After Forward', { size: 15, weight: 700, color: warm })
    fig.text(xs[2], 44, 'reshard_after_forward=True', { size: 13, color: muted, mono: true })
    fig.math(xs[2], 70, '\\text{Weight VRAM} = P / 4', { size: 14, color: purple })
    drawGrid(xs[2], 'resharded')
    fig.text(xs[2], 242, 'Re-gathers once more in backward', {
        size: 13,
        weight: 600,
        color: warm,
    })

    // --- Bottom: Parameter Memory Step Profile on Rank 0 ---
    fig.line(24, 272, 816, 272, { color: c.borderSubtle, width: 1 })
    fig.text(24, 294, 'Rank 0 Parameter Footprint Across Step', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
    })

    const baseY = 382
    const lowY = 362 // P/4
    const highY = 314 // P
    const pLeft = 92
    const pRight = 804

    // Baseline and P reference lines
    fig.line(pLeft, baseY, pRight, baseY, { color: c.borderSubtle, width: 1 })
    fig.line(pLeft, highY, pRight, highY, { color: c.borderSubtle, width: 1, dash: '4 4' })
    fig.text(pLeft - 10, lowY, 'P/4', {
        size: 12,
        weight: 600,
        color: purple,
        align: 'right',
        mono: true,
    })
    fig.text(pLeft - 10, highY, 'P', {
        size: 12,
        weight: 600,
        color: green,
        align: 'right',
        mono: true,
    })

    // Step waveform: Rest -> Forward peak -> Resharded -> Backward peak -> Rest
    const pts: readonly (readonly [number, number])[] = [
        [pLeft, lowY],
        [240, lowY],
        [240, highY],
        [420, highY],
        [420, lowY],
        [560, lowY],
        [560, highY],
        [700, highY],
        [700, lowY],
        [pRight, lowY],
    ]
    const areaD =
        pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join('') +
        `L${pRight} ${baseY}L${pLeft} ${baseY}Z`
    fig.path(areaD, { fill: green, fillOpacity: 0.12, color: 'none' })
    fig.polyline(pts, { color: green, width: 2.25 })

    // Phase labels along timeline
    fig.text(166, 398, 'Rest', { size: 12, color: muted, align: 'center', width: 90 })
    fig.text(330, 398, 'Forward (All-Gather)', {
        size: 12,
        weight: 600,
        color: green,
        align: 'center',
        width: 150,
    })
    fig.text(490, 398, 'Resharded', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
        width: 100,
    })
    fig.text(630, 398, 'Backward (All-Gather)', {
        size: 12,
        weight: 600,
        color: cyan,
        align: 'center',
        width: 150,
    })
    fig.text(752, 398, 'Rest', { size: 12, color: muted, align: 'center', width: 80 })

    return fig.render()
}

export default create()
