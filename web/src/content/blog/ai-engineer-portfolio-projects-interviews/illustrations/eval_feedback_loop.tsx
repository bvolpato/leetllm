import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 360
export const alt =
    'Borderless four-case evaluation matrix comparing Baseline (2/4, 50%) and Candidate (3/4, 75%). Candidate fixes q-missing and q-conflict but regresses on q-injection (PASS to FAIL). That failure triggers a HOLD gate routing into Repair and Rerun before a 4/4 run can reach REVIEW.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const green = f.tone('green')
    const warm = f.tone('warm')
    const red = f.tone('critical')

    // Left section: Borderless case-diff matrix (x: 16..396)
    const colBaseX = 166
    const colCandX = 286
    const cellW = 104
    const cellH = 42
    const rowStart = 84
    const rowStep = 56

    f.text(18, 28, 'Case', { size: 14, weight: 700, color: c.textSecondary })
    f.text(colBaseX + cellW / 2, 24, 'Baseline', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    f.text(colBaseX + cellW / 2, 46, '2/4 · 50%', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    f.text(colCandX + cellW / 2, 24, 'Candidate', {
        size: 15,
        weight: 700,
        color: blue,
        align: 'center',
    })
    f.text(colCandX + cellW / 2, 46, '3/4 · 75%', {
        size: 13,
        weight: 600,
        color: blue,
        align: 'center',
        mono: true,
    })

    f.line(18, 64, 396, 64, { color: c.border, width: 1.25 })

    const rows = [
        { name: 'q-rollback', base: true, cand: true, regression: false },
        { name: 'q-missing', base: false, cand: true, regression: false },
        { name: 'q-conflict', base: false, cand: true, regression: false },
        { name: 'q-injection', base: true, cand: false, regression: true },
    ] as const

    rows.forEach((row, i) => {
        const cy = rowStart + i * rowStep + cellH / 2
        const top = rowStart + i * rowStep

        if (row.regression) {
            f.rect(12, top - 6, 390, cellH + 12, {
                fill: tint(red, c.bg, 0.1),
                stroke: red,
                strokeWidth: 1.4,
                radius: 8,
            })
        } else if (i > 0) {
            f.line(18, top - 7, 396, top - 7, { color: c.borderSubtle, width: 1 })
        }

        f.text(22, cy, row.name, {
            size: 15,
            weight: row.regression ? 700 : 500,
            color: row.regression ? red : c.textPrimary,
            mono: true,
        })

        // Baseline cell
        const baseColor = row.base ? green : c.textMuted
        f.rect(colBaseX, top, cellW, cellH, {
            fill: tint(baseColor, c.bg, row.base ? 0.14 : 0.08),
            stroke: row.base ? tint(green, c.bg, 0.45) : c.borderSubtle,
            strokeWidth: 1,
            radius: 6,
        })
        f.text(colBaseX + cellW / 2, cy, row.base ? 'PASS' : 'FAIL', {
            size: 14,
            weight: 700,
            color: baseColor,
            align: 'center',
            mono: true,
        })

        // Candidate cell
        const candColor = row.cand ? green : red
        f.rect(colCandX, top, cellW, cellH, {
            fill: tint(candColor, c.bg, row.regression ? 0.24 : 0.16),
            stroke: candColor,
            strokeWidth: row.regression ? 2 : 1.25,
            radius: 6,
        })
        f.text(colCandX + cellW / 2, cy, row.cand ? 'PASS' : 'FAIL', {
            size: 14,
            weight: 700,
            color: candColor,
            align: 'center',
            mono: true,
        })
    })

    // Regression callout under q-injection row
    f.text(204, 326, 'Regression: PASS to FAIL blocks release', {
        size: 13.5,
        weight: 600,
        color: red,
        align: 'center',
    })

    // Right section: Horizontal gate & HOLD -> Repair -> Rerun loop (x: 438..784)
    const gateX = 446
    const gateY = 122
    const gateW = 114
    const gateH = 66

    // Connector from matrix into gate
    f.arrow(402, 273, gateX - 6, gateY + gateH - 12, {
        color: red,
        width: 1.75,
        head: 6,
    })

    // Gate box
    f.rect(gateX, gateY, gateW, gateH, {
        fill: tint(warm, c.bg, 0.15),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 8,
    })
    f.text(gateX + gateW / 2, gateY + 23, 'Release Gate', {
        size: 14.5,
        weight: 700,
        color: warm,
        align: 'center',
    })
    f.text(gateX + gateW / 2, gateY + 45, 'All 4 must pass', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Upper exit: 4/4 -> REVIEW
    const revX = 644
    const revY = 54
    const revW = 138
    const revH = 58
    f.path(
        `M${gateX + gateW} ${gateY + 18} L${gateX + gateW + 26} ${gateY + 18} L${gateX + gateW + 26} ${revY + revH / 2} L${revX - 8} ${revY + revH / 2}`,
        { color: green, width: 1.6 },
    )
    f.arrow(revX - 24, revY + revH / 2, revX - 2, revY + revH / 2, {
        color: green,
        width: 1.6,
        head: 6,
    })
    f.text(gateX + gateW + 26, revY + 14, '4/4 pass', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    f.rect(revX, revY, revW, revH, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.75,
        radius: 8,
    })
    f.text(revX + revW / 2, revY + 21, 'REVIEW', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    f.text(revX + revW / 2, revY + 41, 'eligible to ship', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Active fail path: Gate -> HOLD -> Repair -> Rerun
    const holdY = 236
    const holdH = 56
    const holdX = 446
    const holdW = 92
    const repX = 568
    const repW = 100
    const rerX = 696
    const rerW = 86

    // Vertical drop from Gate to HOLD
    f.arrow(gateX + gateW / 2, gateY + gateH, gateX + gateW / 2, holdY - 2, {
        color: red,
        width: 1.8,
        head: 6,
    })
    f.text(gateX + gateW / 2 + 10, (gateY + gateH + holdY) / 2, '3/4 fail', {
        size: 13,
        weight: 700,
        color: red,
    })

    // HOLD node
    f.rect(holdX, holdY, holdW, holdH, {
        fill: tint(red, c.bg, 0.22),
        stroke: red,
        strokeWidth: 2,
        radius: 8,
    })
    f.text(holdX + holdW / 2, holdY + 20, 'HOLD', {
        size: 15,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    f.text(holdX + holdW / 2, holdY + 40, 'block deploy', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Arrow HOLD -> Repair
    f.arrow(holdX + holdW, holdY + holdH / 2, repX - 2, holdY + holdH / 2, {
        color: warm,
        width: 1.7,
        head: 6,
    })

    // Repair node
    f.rect(repX, holdY, repW, holdH, {
        fill: tint(warm, c.bg, 0.14),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 8,
    })
    f.text(repX + repW / 2, holdY + 20, 'Repair', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'center',
    })
    f.text(repX + repW / 2, holdY + 40, 'fix trace', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Arrow Repair -> Rerun
    f.arrow(repX + repW, holdY + holdH / 2, rerX - 2, holdY + holdH / 2, {
        color: blue,
        width: 1.7,
        head: 6,
    })

    // Rerun node
    f.rect(rerX, holdY, rerW, holdH, {
        fill: tint(blue, c.bg, 0.16),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 8,
    })
    f.text(rerX + rerW / 2, holdY + 20, 'Rerun', {
        size: 15,
        weight: 700,
        color: blue,
        align: 'center',
    })
    f.text(rerX + rerW / 2, holdY + 40, '4 cases', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Dashed loop back from Rerun -> Gate
    f.path(
        `M${rerX + rerW / 2} ${holdY} L${rerX + rerW / 2} ${gateY + gateH - 14} L${gateX + gateW + 8} ${gateY + gateH - 14}`,
        { color: blue, width: 1.5, dash: '5 4' },
    )
    f.arrow(gateX + gateW + 24, gateY + gateH - 14, gateX + gateW + 2, gateY + gateH - 14, {
        color: blue,
        width: 1.5,
        head: 6,
    })
    f.text(650, gateY + gateH - 28, 're-evaluate', {
        size: 12.5,
        weight: 600,
        color: blue,
        align: 'center',
    })

    return f.render()
}

export default create('dark')
