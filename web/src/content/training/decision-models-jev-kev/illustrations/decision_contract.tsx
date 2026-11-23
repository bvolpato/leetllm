import { createElement } from 'react'
import {
    SvgFrame,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'
import { figure, label } from './decision_canvas'

export const width = 860
export const height = 520
export const preset = 'engineering'
export const alt =
    'Diagnostic evidence traces a CUDA out-of-memory error during the backward pass. The caller-specified decision question presents three bounded choices: A for gradient overflow, B for memory allocation exhaustion, and C for insufficient telemetry. The decision scorer evaluates option logits and outputs a routing proposal. Host routing policy verifies permissions and evidence boundaries before dispatching cluster remediation, while the reviewed ground-truth target remains in an isolated evaluation record.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)

    const geometry = []
    const labels = []

    const arrow = (id: string, x1: number, y1: number, x2: number, y2: number, color: string) =>
        createElement(
            'g',
            { id },
            VectorArrow({ x1, y1, x2, y2, color, strokeWidth: 2.2, arrowSize: 7 }),
        )

    const box = (id: string, x: number, y: number, w: number, h: number, tone: string) =>
        createElement(
            'g',
            { id },
            SvgFrame({
                c,
                x,
                y,
                width: w,
                height: h,
                rx: 8,
                fill: c.bgSubtle,
                stroke: tone,
                strokeWidth: 1.5,
            }),
        )

    // Three horizontal columns
    const colW = 250
    const col1X = 24
    const col2X = 305
    const col3X = 586
    const topY = 70
    const cardH = 410

    // Card 1: Diagnostic State (Evidence)
    geometry.push(box('evidence-box', col1X, topY, colW, cardH, blue))
    labels.push(
        label(c, 'title-col1', '1. Input Evidence State', col1X + 16, topY + 16, colW - 32, {
            size: 15,
            weight: 700,
            color: blue,
        }),
        label(c, 'sub-col1', 'Collected diagnostic telemetry', col1X + 16, topY + 38, colW - 32, {
            size: 13,
            color: c.textSecondary,
        }),
        label(c, 'log-title', 'Diagnostic Log Trace:', col1X + 16, topY + 80, colW - 32, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
        }),
        label(
            c,
            'log-body',
            'CUDA out-of-memory during backward pass: allocated 79.2 GiB on device 0 (capacity 80.0 GiB)',
            col1X + 16,
            topY + 105,
            colW - 32,
            { size: 12, mono: true, color: c.textSecondary, lines: 4 },
        ),
        label(c, 'boundary-notice', 'Boundary Rule:', col1X + 16, topY + 230, colW - 32, {
            size: 13,
            weight: 600,
            color: warm,
        }),
        label(
            c,
            'boundary-desc',
            'State is treated strictly as evidence. Prompt injection or instructions embedded in logs cannot alter allowed choices.',
            col1X + 16,
            topY + 252,
            colW - 32,
            { size: 12, color: c.textSecondary, lines: 4 },
        ),
    )

    // Arrow Col1 -> Col2
    geometry.push(arrow('arr1-2', col1X + colW + 4, topY + 180, col2X - 4, topY + 180, blue))

    // Card 2: Decision Problem & Option Scorer
    geometry.push(box('scorer-box', col2X, topY, colW, cardH, purple))
    labels.push(
        label(c, 'title-col2', '2. Bounded Decision Task', col2X + 16, topY + 16, colW - 32, {
            size: 15,
            weight: 700,
            color: purple,
        }),
        label(
            c,
            'sub-col2',
            'Caller-defined question & choices',
            col2X + 16,
            topY + 38,
            colW - 32,
            {
                size: 13,
                color: c.textSecondary,
            },
        ),
        label(c, 'q-text', 'Q: Root cause of cluster failure?', col2X + 16, topY + 75, colW - 32, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
        }),
    )

    // Option rows
    const optY = (idx: number) => topY + 115 + idx * 75
    const opts = [
        { key: 'A', name: 'Gradient overflow', p: 'p = 0.665', tone: c.textSecondary, fill: false },
        {
            key: 'B',
            name: 'Memory allocation OOM',
            p: 'p = 0.245 [Target]',
            tone: green,
            fill: true,
        },
        {
            key: 'C',
            name: 'Insufficient telemetry',
            p: 'p = 0.090',
            tone: c.textSecondary,
            fill: false,
        },
    ]

    opts.forEach((opt, i) => {
        const oy = optY(i)
        geometry.push(
            createElement(
                'g',
                { id: `opt-frame-${opt.key}` },
                SvgFrame({
                    c,
                    x: col2X + 12,
                    y: oy,
                    width: colW - 24,
                    height: 62,
                    rx: 6,
                    fill: opt.fill ? c.bg : c.bgSubtle,
                    stroke: opt.tone,
                    strokeWidth: opt.fill ? 2 : 1,
                }),
            ),
        )
        labels.push(
            label(c, `opt-lbl-${opt.key}`, `Choice ${opt.key}:`, col2X + 22, oy + 10, 80, {
                size: 13,
                weight: 700,
                color: opt.tone,
            }),
            label(c, `opt-txt-${opt.key}`, opt.name, col2X + 90, oy + 10, colW - 105, {
                size: 12,
                weight: 600,
                color: c.textPrimary,
            }),
            label(c, `opt-prob-${opt.key}`, opt.p, col2X + 90, oy + 32, colW - 105, {
                size: 12,
                color: opt.tone,
            }),
        )
    })

    labels.push(
        label(c, 'score-mode', 'Direct Logit Softmax Readout', col2X + 16, topY + 360, colW - 32, {
            size: 12,
            align: 'center',
            color: c.textSecondary,
        }),
    )

    // Arrow Col2 -> Col3
    geometry.push(arrow('arr2-3', col2X + colW + 4, topY + 180, col3X - 4, topY + 180, purple))

    // Card 3: Host Routing Policy & Label Record
    geometry.push(box('routing-box', col3X, topY, colW, cardH, green))
    labels.push(
        label(c, 'title-col3', '3. Host Routing & Verification', col3X + 16, topY + 16, colW - 32, {
            size: 15,
            weight: 700,
            color: green,
        }),
        label(
            c,
            'sub-col3',
            'Execution gates & evaluation record',
            col3X + 16,
            topY + 38,
            colW - 32,
            {
                size: 13,
                color: c.textSecondary,
            },
        ),
        label(c, 'gate-title', 'Host Policy Checks:', col3X + 16, topY + 80, colW - 32, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
        }),
        label(
            c,
            'gate-body',
            '1. Scored option is in legal schema\n2. Confidence exceeds threshold tau\n3. Caller authorized for remediation',
            col3X + 16,
            topY + 105,
            colW - 32,
            { size: 12, color: c.textSecondary, lines: 4 },
        ),
        label(c, 'route-action', 'Dispatched Action:', col3X + 16, topY + 195, colW - 32, {
            size: 13,
            weight: 600,
            color: green,
        }),
        label(
            c,
            'route-body',
            'Queue memory profiling & batch scale reduction; if confidence low, route to engineer review.',
            col3X + 16,
            topY + 220,
            colW - 32,
            { size: 12, color: c.textSecondary, lines: 3 },
        ),
        label(
            c,
            'truth-title',
            'Ground Truth Evaluation Record:',
            col3X + 16,
            topY + 295,
            colW - 32,
            {
                size: 13,
                weight: 600,
                color: warm,
            },
        ),
        label(
            c,
            'truth-body',
            'Verified Target: Option B\nStored disjointly for training / validation loss computation.',
            col3X + 16,
            topY + 320,
            colW - 32,
            { size: 12, color: c.textSecondary, lines: 3 },
        ),
    )

    // Top Header Banner
    labels.push(
        label(
            c,
            'header-main',
            'Typed Decision Model Architecture: State, Scorer, and Routing Policy',
            24,
            20,
            812,
            {
                size: 18,
                weight: 700,
                color: c.textPrimary,
            },
        ),
    )

    return figure(c, width, height, geometry, labels)
}

export default create('dark')
