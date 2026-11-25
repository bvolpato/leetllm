import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 330
export const alt =
    'Horizontal fail-fast SWE-bench grading cascade. Stage 1 applies the candidate and test patches; errors drop to score 0 (Apply error). Stage 2 runs FAIL_TO_PASS fix tests; any failure drops to score 0 (Unfixed). Stage 3 runs PASS_TO_PASS regression tests; any failure drops to score 0 (Regression). Clearing all three gates reaches Score 1, Resolved.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const warm = f.tone('warm')
    const green = f.tone('green')
    const red = f.tone('critical')

    const drawStage = (
        x: number,
        y: number,
        w: number,
        h: number,
        step: string,
        title: string,
        detail: string,
        tone: string,
        emphasis = false,
    ) => {
        f.rect(x, y, w, h, {
            fill: tint(tone, c.bg, emphasis ? 0.18 : 0.12),
            stroke: tone,
            strokeWidth: emphasis ? 2.1 : 1.65,
            radius: 10,
        })
        if (emphasis) {
            f.rect(x, y, 5, h, { fill: tone, radius: 2 })
        }
        f.text(x + w / 2 + (emphasis ? 2 : 0), y + 20, step, {
            size: 12,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
        f.text(x + w / 2 + (emphasis ? 2 : 0), y + 44, title, {
            size: 15.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            width: w - 14,
        })
        f.text(x + w / 2 + (emphasis ? 2 : 0), y + 68, detail, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            width: w - 14,
        })
    }

    const drawFailExit = (x: number, y: number, w: number, title: string, detail: string) => {
        const h = 72
        f.rect(x, y, w, h, {
            fill: tint(red, c.bg, 0.12),
            stroke: red,
            strokeWidth: 1.5,
            radius: 9,
        })
        f.rect(x, y, 4, h, { fill: red, radius: 2 })
        f.text(x + w / 2 + 2, y + 25, title, {
            size: 14.5,
            weight: 700,
            color: red,
            align: 'center',
            mono: true,
        })
        f.text(x + w / 2 + 2, y + 50, detail, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        })
    }

    const topY = 34
    const stageH = 90
    const failY = 228

    const g1 = { x: 16, w: 152 }
    const g2 = { x: 224, w: 152 }
    const g3 = { x: 432, w: 152 }
    const g4 = { x: 640, w: 144 }

    // Top happy-path connectors
    const midY = topY + stageH / 2
    f.arrow(g1.x + g1.w, midY, g2.x - 2, midY, { color: green, width: 1.9, head: 6 })
    f.text((g1.x + g1.w + g2.x) / 2, midY - 16, 'ok', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    f.arrow(g2.x + g2.w, midY, g3.x - 2, midY, { color: green, width: 1.9, head: 6 })
    f.text((g2.x + g2.w + g3.x) / 2, midY - 16, 'all pass', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    f.arrow(g3.x + g3.w, midY, g4.x - 2, midY, { color: green, width: 1.9, head: 6 })
    f.text((g3.x + g3.w + g4.x) / 2, midY - 16, 'all pass', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Drop-down failure arrows + pills
    const failEdges = [
        { cx: g1.x + g1.w / 2, label: 'error' },
        { cx: g2.x + g2.w / 2, label: 'any fail' },
        { cx: g3.x + g3.w / 2, label: 'any fail' },
    ] as const
    failEdges.forEach((edge) => {
        f.arrow(edge.cx, topY + stageH, edge.cx, failY - 2, {
            color: red,
            width: 1.75,
            head: 6,
        })
        const pw = 76
        const py = (topY + stageH + failY) / 2
        f.rect(edge.cx - pw / 2, py - 12, pw, 24, {
            fill: tint(red, c.bg, 0.2),
            stroke: red,
            strokeWidth: 1.2,
            radius: 12,
        })
        f.text(edge.cx, py, edge.label, {
            size: 12.5,
            weight: 700,
            color: red,
            align: 'center',
        })
    })

    // Draw top stages
    drawStage(g1.x, topY, g1.w, stageH, 'GATE 1', 'Apply patches', 'fix + test diff', blue)
    drawStage(g2.x, topY, g2.w, stageH, 'GATE 2', 'F2P tests', 'all fix tests pass', warm)
    drawStage(g3.x, topY, g3.w, stageH, 'GATE 3', 'P2P tests', 'no regressions', warm)
    drawStage(g4.x, topY, g4.w, stageH, 'SCORE = 1', 'Resolved', 'both gates pass', green, true)

    // Draw drop-down failure terminals
    drawFailExit(g1.x, failY, g1.w, '0 · Apply error', 'diff or setup')
    drawFailExit(g2.x, failY, g2.w, '0 · Unfixed', 'fix test fails')
    drawFailExit(g3.x, failY, g3.w, '0 · Regression', 'existing test breaks')

    return f.render()
}

export default create('dark')
