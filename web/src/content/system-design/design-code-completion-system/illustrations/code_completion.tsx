import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 430
export const alt =
    'Editor snapshot S with document, version, caret, ACL, and epoch routes three triggers into parallel completion lanes: Polic to local lexical index (<5 ms), graph. to local LSP (<20 ms), and is_allowed = to remote FIM (<200 ms p95 when permitted). All lanes rejoin an editor freshness gate that drops stale replies, paints fresh ghost text, and enforces version-checked Tab insertion. Beside it, an off-clock coding agent runs a Plan, Edit, Test, Review loop at second-to-minute scale.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // Left section header
    fig.text(24, 22, 'Inline Engine (<200 ms keystroke clock)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Snapshot S bar
    fig.rect(24, 44, 540, 40, {
        fill: tint(blue, c.bg, 0.09),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 8,
    })
    fig.text(40, 64, 'Snapshot S', { size: 14, weight: 700, color: blue })
    fig.text(136, 64, 'doc · version · caret · policy · epoch', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })

    const lanes = [
        {
            y: 106,
            trigger: 'Polic|',
            kind: 'Lexical prefix',
            target: 'Local Lexical Index',
            detail: 'PolicyGraph · <5 ms',
            tone: blue,
        },
        {
            y: 168,
            trigger: 'graph.|',
            kind: 'Member trigger',
            target: 'Local LSP (AST)',
            detail: 'Type members · <20 ms',
            tone: purple,
        },
        {
            y: 230,
            trigger: 'is_allowed = |',
            kind: 'Open span',
            target: 'Remote FIM LLM',
            detail: 'If permitted · <200 ms',
            tone: green,
        },
    ]

    // Left vertical spine from Snapshot S
    fig.line(42, 84, 42, 254, { color: c.border, width: 1.5 })

    // Right collector spine into Freshness Gate
    fig.line(558, 130, 558, 326, { color: c.border, width: 1.5 })

    for (const lane of lanes) {
        const cy = lane.y + 24
        fig.arrow(42, cy, 62, cy, { color: lane.tone, width: 1.5, head: 6 })

        // Trigger pill
        fig.rect(64, lane.y, 172, 48, {
            fill: tint(lane.tone, c.bg, 0.08),
            stroke: lane.tone,
            strokeWidth: 1.25,
            radius: 7,
        })
        fig.text(76, lane.y + 16, lane.trigger, {
            size: 14,
            weight: 700,
            color: lane.tone,
            mono: true,
        })
        fig.text(76, lane.y + 35, lane.kind, { size: 12, color: c.textSecondary })

        fig.arrow(236, cy, 274, cy, { color: lane.tone, width: 1.5, head: 6 })

        // Engine pill
        fig.rect(276, lane.y, 256, 48, {
            fill: tint(lane.tone, c.bg, 0.13),
            stroke: lane.tone,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(290, lane.y + 16, lane.target, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
        })
        fig.text(290, lane.y + 35, lane.detail, { size: 12, color: lane.tone, weight: 600 })

        // Connect to collector spine
        fig.line(532, cy, 558, cy, { color: lane.tone, width: 1.5 })
    }

    // Collector enters Freshness Gate at y=326
    fig.arrow(558, 326, 534, 326, { color: purple, width: 1.75, head: 6 })

    // Freshness Gate
    fig.rect(314, 302, 218, 48, {
        fill: tint(purple, c.bg, 0.14),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(423, 318, 'Freshness Gate', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(423, 337, 'epoch & snapshot match?', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Stale branch -> left (red)
    fig.arrow(314, 326, 232, 326, { color: red, width: 1.6, head: 6, dash: '4 3' })
    fig.text(273, 314, 'Stale', { size: 12, weight: 600, color: red, align: 'center' })
    fig.rect(64, 304, 166, 44, {
        fill: tint(red, c.bg, 0.11),
        stroke: red,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(147, 326, 'Drop before paint', {
        size: 13,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Fresh branch -> down into Paint -> Tab (green)
    fig.arrow(423, 350, 423, 372, { color: green, width: 1.6, head: 6 })
    fig.text(452, 360, 'Fresh', { size: 12, weight: 600, color: green })

    fig.rect(64, 374, 210, 40, {
        fill: tint(green, c.bg, 0.12),
        stroke: green,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(169, 394, 'Tab: version-checked insert', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    fig.rect(314, 374, 218, 40, {
        fill: tint(green, c.bg, 0.09),
        stroke: green,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(423, 394, 'Paint ghost text', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.arrow(314, 394, 276, 394, { color: green, width: 1.6, head: 6 })

    // Divider separating off-clock Coding Agent
    fig.line(596, 16, 596, 414, { color: c.borderSubtle, width: 1.25, dash: '5 4' })

    // Right section: Off-clock Coding Agent Loop
    fig.text(624, 22, 'Coding Agent (off-clock)', {
        size: 15,
        weight: 700,
        color: warm,
    })
    fig.text(624, 44, 'Seconds to minutes · multi-file', {
        size: 13,
        color: c.textSecondary,
    })

    const steps = [
        { name: '1. Plan', sub: 'Decompose repo task' },
        { name: '2. Edit', sub: 'Apply multi-file patch' },
        { name: '3. Test', sub: 'Run suite in sandbox' },
        { name: '4. Review', sub: 'Diff & PR approval' },
    ]
    steps.forEach((step, i) => {
        const sy = 76 + i * 82
        fig.rect(644, sy, 192, 54, {
            fill: tint(warm, c.bg, 0.08),
            stroke: c.border,
            strokeWidth: 1.25,
            radius: 8,
        })
        fig.text(660, sy + 19, step.name, { size: 14, weight: 700, color: c.textPrimary })
        fig.text(660, sy + 39, step.sub, { size: 12, color: c.textSecondary })
        if (i < steps.length - 1) {
            fig.arrow(740, sy + 54, 740, sy + 80, { color: warm, width: 1.5, head: 6 })
        }
    })

    // Return loop on left margin of agent column
    fig.path('M644 349 L622 349 L622 103 L640 103', {
        color: warm,
        width: 1.4,
        dash: '4 3',
    })
    fig.arrow(628, 103, 642, 103, { color: warm, width: 1.4, head: 5 })

    return fig.render()
}

export default create('dark')
