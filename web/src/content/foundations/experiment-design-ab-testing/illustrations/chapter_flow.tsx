import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 390
export const alt =
    'Four incoming support requests belong to three query units. Both requests for qry-021 hash to bucket 85 and stay pinned in Control (raw query); qry-001 and qry-014 hash to buckets 24 and 37 and enter Treatment (rewritten query). Both arms share the same pinned RAG index and greedy generator, then deduplicate after the 10-minute maturity window into three logged unit outcomes: 1 Control and 2 Treatment.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const isLight = theme === 'light'

    // Stage column headers
    fig.text(90, 24, '1. Incoming stream', { size: 13, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(294, 24, '2. Sticky bucket', { size: 13, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(508, 24, '3. Isolated arm + shared RAG', { size: 13, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(748, 24, '4. Unit log (10m)', { size: 13, weight: 700, color: c.textSecondary, align: 'center' })

    // Incoming requests (4 rows)
    const reqX = 20
    const reqW = 140
    const reqH = 34
    const reqs = [
        { y: 60, id: 'qry-021', tag: 'first', tone: blue },
        { y: 112, id: 'qry-021', tag: 'retry', tone: blue },
        { y: 196, id: 'qry-001', tag: 'first', tone: purple },
        { y: 256, id: 'qry-014', tag: 'first', tone: purple },
    ]
    for (const r of reqs) {
        fig.rect(reqX, r.y, reqW, reqH, {
            fill: tint(r.tone, c.bg, isLight ? 0.1 : 0.16),
            stroke: r.tone,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(reqX + 10, r.y + reqH / 2, r.id, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            mono: true,
        })
        fig.text(reqX + reqW - 10, r.y + reqH / 2, r.tag, {
            size: 12,
            color: r.tone,
            align: 'right',
        })
    }

    // Sticky hash router nodes (buckets)
    const buckX = 232
    const buckW = 124
    const buckH = 36
    const buckets = [
        { y: 86, text: 'bucket 85', sub: 'pinned (>=50)', tone: blue },
        { y: 195, text: 'bucket 24', sub: '(<50)', tone: purple },
        { y: 255, text: 'bucket 37', sub: '(<50)', tone: purple },
    ]

    // Curved merging connectors from requests to buckets
    const bezier = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        const mx = (x1 + x2) / 2
        fig.path(`M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, {
            color,
            width: 2,
        })
    }
    bezier(reqX + reqW, 77, buckX, 100, blue)
    bezier(reqX + reqW, 129, buckX, 108, blue)
    bezier(reqX + reqW, 213, buckX, 213, purple)
    bezier(reqX + reqW, 273, buckX, 273, purple)

    for (const b of buckets) {
        fig.rect(buckX, b.y, buckW, buckH, {
            fill: tint(b.tone, c.bg, isLight ? 0.14 : 0.22),
            stroke: b.tone,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(buckX + buckW / 2, b.y + 12, b.text, {
            size: 13,
            weight: 700,
            color: b.tone,
            align: 'center',
            mono: true,
        })
        fig.text(buckX + buckW / 2, b.y + 27, b.sub, {
            size: 11,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Arm boxes (Control vs Treatment) + Shared pinned RAG vertical band
    const armX = 406
    const armW = 204
    // Control lane
    fig.rect(armX, 68, armW, 72, {
        fill: tint(blue, c.bg, isLight ? 0.08 : 0.13),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(armX + 12, 88, 'Control', { size: 14, weight: 700, color: blue })
    fig.text(armX + 12, 108, 'Raw user query', { size: 13, color: c.textPrimary })
    fig.text(armX + 12, 126, 'pinned index + greedy', { size: 11, color: c.textSecondary })

    // Treatment lane
    fig.rect(armX, 186, armW, 108, {
        fill: tint(purple, c.bg, isLight ? 0.08 : 0.13),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(armX + 12, 208, 'Treatment', { size: 14, weight: 700, color: purple })
    fig.text(armX + 12, 230, 'Rewritten query', { size: 13, color: c.textPrimary })
    fig.text(armX + 12, 250, 'same index + prompt', { size: 11, color: c.textSecondary })
    fig.text(armX + 12, 268, 'same greedy decoder', { size: 11, color: c.textSecondary })

    // Connectors buckets -> arms
    fig.arrow(buckX + buckW, 104, armX - 2, 104, { color: blue, width: 2, head: 6 })
    fig.arrow(buckX + buckW, 213, armX - 2, 213, { color: purple, width: 2, head: 6 })
    fig.arrow(buckX + buckW, 273, armX - 2, 273, { color: purple, width: 2, head: 6 })

    // Deduplicated unit log (3 rows)
    const logX = 666
    const logW = 172
    const logRows = [
        { y: 86, id: 'qry-021', note: '1 row (merged)', tone: blue },
        { y: 195, id: 'qry-001', note: '1 row', tone: purple },
        { y: 255, id: 'qry-014', note: '1 row', tone: purple },
    ]

    fig.arrow(armX + armW, 104, logX - 2, 104, { color: blue, width: 2, head: 6 })
    fig.arrow(armX + armW, 213, logX - 2, 213, { color: purple, width: 2, head: 6 })
    fig.arrow(armX + armW, 273, logX - 2, 273, { color: purple, width: 2, head: 6 })

    for (const row of logRows) {
        fig.rect(logX, row.y, logW, 36, {
            fill: tint(green, c.bg, isLight ? 0.08 : 0.12),
            stroke: green,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(logX + 10, row.y + 18, row.id, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            mono: true,
        })
        fig.text(logX + logW - 10, row.y + 18, row.note, {
            size: 11,
            weight: 600,
            color: row.tone,
            align: 'right',
        })
    }

    // Bottom proportional unit bar: 1 Control (33%) vs 2 Treatment (67%)
    const barX = 20
    const barY = 334
    const barW = 818
    const barH = 22
    const ctrlW = Math.round(barW / 3)
    fig.rect(barX, barY, ctrlW - 3, barH, {
        fill: tint(blue, c.bg, isLight ? 0.22 : 0.34),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 4,
    })
    fig.rect(barX + ctrlW + 3, barY, barW - ctrlW - 3, barH, {
        fill: tint(purple, c.bg, isLight ? 0.22 : 0.34),
        stroke: purple,
        strokeWidth: 1.4,
        radius: 4,
    })
    fig.text(barX + ctrlW / 2, barY + barH / 2, 'Control: 1 unit (33%)', {
        size: 12,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(barX + ctrlW + (barW - ctrlW) / 2, barY + barH / 2, 'Treatment: 2 units (67%) · 3 logged units from 4 requests', {
        size: 12,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    return fig.render()
}

export default create
