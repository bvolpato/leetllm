import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 400
export const alt =
    'Architecture of an LLM-powered search engine flowing left to right: offline ingestion hashes policy@2 [0-80] and exception@1 [0-101] with SHA-256 digests into BM25 lexical and dense HNSW indexes scoped to workspace-a, followed by RRF fusion, reranking, grounded synthesis, and an online verification gate checking RBAC, current revision, and exact spans before streaming verified citations. A current-revision registry feeds invalidation updates directly into both retrieval and the verification gate.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    const stageFill = (color: string, amt = 0.1) => tint(color, c.bg, amt)

    // Column headers (frameless, subtle accent)
    fig.text(105, 24, '1. Ingestion', { size: 13, color: blue, align: 'center', weight: 700 })
    fig.text(305, 24, '2. Hybrid Retrieval', { size: 13, color: purple, align: 'center', weight: 700 })
    fig.text(500, 24, '3. Synthesis + Gate', { size: 13, color: warm, align: 'center', weight: 700 })
    fig.text(725, 24, '4. Verified Stream', { size: 13, color: green, align: 'center', weight: 700 })

    // Stage 1: Two versioned source chunks with digests
    const docs = [
        { y: 58, id: 'policy@2 [0-80]', detail: '30d base · 91e45d8e' },
        { y: 150, id: 'exception@1 [0-101]', detail: '60d cond · 0b7226d8' },
    ]
    for (const d of docs) {
        fig.rect(22, d.y, 168, 66, {
            fill: stageFill(blue, 0.11),
            stroke: blue,
            strokeWidth: 1.25,
            radius: 8,
        })
        fig.text(34, d.y + 22, d.id, { size: 13, color: c.textPrimary, weight: 700, mono: true })
        fig.text(34, d.y + 45, d.detail, { size: 12, color: c.textSecondary, mono: true })
    }

    // Stage 2: Tenant-scoped Dual Index + RRF/Rerank
    fig.rect(220, 46, 172, 184, {
        fill: stageFill(purple, 0.06),
        stroke: c.border,
        strokeWidth: 1,
        radius: 10,
    })
    fig.text(306, 63, 'scope: workspace-a', {
        size: 12,
        color: purple,
        align: 'center',
        weight: 600,
        mono: true,
    })
    fig.rect(234, 78, 144, 40, {
        fill: stageFill(purple, 0.14),
        stroke: purple,
        strokeWidth: 1.2,
        radius: 6,
    })
    fig.text(306, 98, 'BM25 Lexical', { size: 13, color: c.textPrimary, align: 'center', weight: 600 })

    fig.rect(234, 128, 144, 40, {
        fill: stageFill(purple, 0.14),
        stroke: purple,
        strokeWidth: 1.2,
        radius: 6,
    })
    fig.text(306, 148, 'Dense HNSW', { size: 13, color: c.textPrimary, align: 'center', weight: 600 })

    fig.rect(234, 178, 144, 38, {
        fill: stageFill(blue, 0.12),
        stroke: blue,
        strokeWidth: 1.1,
        radius: 6,
    })
    fig.text(306, 197, 'RRF + Rerank', { size: 13, color: blue, align: 'center', weight: 600 })

    // Arrows Stage 1 -> Stage 2
    fig.arrow(190, 91, 220, 98, { color: c.textMuted, width: 1.5, head: 6 })
    fig.arrow(190, 183, 220, 148, { color: c.textMuted, width: 1.5, head: 6 })

    // Stage 3: Synthesis + Authority & Span Gate
    fig.rect(424, 58, 152, 66, {
        fill: stageFill(warm, 0.1),
        stroke: warm,
        strokeWidth: 1.25,
        radius: 8,
    })
    fig.text(500, 81, 'Grounded LLM', { size: 13, color: c.textPrimary, align: 'center', weight: 700 })
    fig.text(500, 103, 'Pack + draft claims', { size: 12, color: c.textSecondary, align: 'center' })

    fig.rect(424, 150, 152, 76, {
        fill: stageFill(red, 0.1),
        stroke: red,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(500, 172, 'Verification Gate', { size: 13, color: red, align: 'center', weight: 700 })
    fig.text(500, 193, 'Live RBAC + rev', { size: 12, color: c.textPrimary, align: 'center' })
    fig.text(500, 211, 'SHA-256 + span', { size: 12, color: c.textSecondary, align: 'center', mono: true })

    fig.arrow(392, 138, 424, 96, { color: c.textMuted, width: 1.5, head: 6 })
    fig.arrow(500, 124, 500, 150, { color: warm, width: 1.6, head: 6 })

    // Stage 4: Verified Stream output
    fig.rect(612, 58, 226, 168, {
        fill: stageFill(green, 0.08),
        stroke: green,
        strokeWidth: 1.5,
        radius: 10,
    })
    fig.text(725, 81, 'Published Citations', { size: 13, color: green, align: 'center', weight: 700 })

    fig.rect(626, 102, 198, 50, {
        fill: stageFill(green, 0.14),
        stroke: green,
        strokeWidth: 1,
        radius: 6,
    })
    fig.text(638, 119, 'policy@2 [0-80]', { size: 13, color: c.textPrimary, weight: 700, mono: true })
    fig.text(638, 138, '30-day rule · 91e45d8e', { size: 12, color: c.textSecondary })

    fig.rect(626, 162, 198, 50, {
        fill: stageFill(green, 0.14),
        stroke: green,
        strokeWidth: 1,
        radius: 6,
    })
    fig.text(638, 179, 'exception@1 [0-101]', { size: 13, color: c.textPrimary, weight: 700, mono: true })
    fig.text(638, 198, '60d + security approval', { size: 12, color: c.textSecondary })

    fig.arrow(576, 188, 612, 164, { color: green, width: 1.75, head: 6 })

    // Bottom Control Plane: Current-Revision Registry with invalidation feedback
    fig.rect(220, 294, 410, 68, {
        fill: stageFill(warm, 0.12),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(425, 317, 'Current-Revision & Access Registry', {
        size: 14,
        color: warm,
        align: 'center',
        weight: 700,
    })
    fig.text(425, 341, 'Rev bump or ACL revoke invalidates stale hits & active streams', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Invalidation feedback arrows up to Retrieval, Gate, and Stream
    fig.arrow(306, 294, 306, 232, { color: warm, width: 1.5, dash: '5 4', head: 6 })
    fig.text(294, 263, 'filter stale', { size: 12, color: warm, align: 'right', weight: 600 })

    fig.arrow(500, 294, 500, 228, { color: red, width: 1.6, dash: '5 4', head: 6 })
    fig.text(512, 263, 'recheck before emit', { size: 12, color: red, align: 'left', weight: 600 })

    // Smooth return arrow to active stream invalidation
    fig.path('M630 328 L725 328 L725 232', { color: warm, width: 1.4, dash: '5 4' })
    fig.arrow(725, 244, 725, 228, { color: warm, width: 1.4, head: 6 })
    fig.text(736, 276, 'halt stale stream', { size: 12, color: warm, align: 'left', weight: 600 })

    return fig.render()
}

export default create()
