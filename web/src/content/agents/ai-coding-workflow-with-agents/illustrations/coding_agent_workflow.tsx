import { GraphDiagram, Scene, TextLabel, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 640
export const height = 740
export const alt =
    'Directed workflow diagram of a coding agent engineering loop. An issue and traceback enter an AST repo-map ranker, which extracts a compact symbol slice. The agent writes a fail-first test, applies a scoped patch inside an isolated worktree, and runs tests in a sandbox. Exit zero yields a verified diff for human review, while assertion tracebacks return to patch repair within a finite retry budget.'

export function create(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({
        c,
        title: 'Finite-budget coding-agent loop',
        padding: 12,
        gap: 8,
        contentWidth: 616,
        children: [
            TextLabel({
                c,
                text: 'Isolate edits in a worktree; halt on retry budget.',
                fontSize: 19,
                color: c.textMuted,
                align: 'center',
            }),
            GraphDiagram({
                c,
                width: 616,
                height: 596,
                layout: 'manual',
                routing: 'orthogonal',
                routingClearance: 12,
                nodeWidth: 242,
                nodeHeight: 108,
                labelFontSize: 21,
                detailFontSize: 19,
                arrowSize: 6,
                ariaLabel:
                    'Coding agent localization, fail-first reproduction, worktree patch, and sandboxed verification loop',
                nodes: [
                    {
                        id: 'issue',
                        label: '1. Issue + trace',
                        detail: 'Parse bug symptom',
                        x: 0.24,
                        y: 0.14,
                        tone: 'blue',
                        icon: 'file',
                    },
                    {
                        id: 'repomap',
                        label: '2. AST repo map',
                        detail: 'Rank symbol slice',
                        x: 0.76,
                        y: 0.14,
                        tone: 'purple',
                        icon: 'layers',
                    },
                    {
                        id: 'repro',
                        label: '3. Fail-first test',
                        detail: 'Confirm red baseline',
                        x: 0.76,
                        y: 0.49,
                        tone: 'warm',
                        icon: 'warning',
                    },
                    {
                        id: 'patch',
                        label: '4. Worktree patch',
                        detail: 'Scoped diff (t <= 3)',
                        x: 0.24,
                        y: 0.49,
                        tone: 'purple',
                        icon: 'code',
                    },
                    {
                        id: 'sandbox',
                        label: '5. Sandbox pytest',
                        detail: 'Fail -> traceback retry',
                        x: 0.24,
                        y: 0.85,
                        tone: 'cyan',
                        icon: 'terminal',
                    },
                    {
                        id: 'review',
                        label: '6. Clean diff',
                        detail: 'Exit 0 -> review',
                        x: 0.76,
                        y: 0.85,
                        tone: 'green',
                        icon: 'check',
                    },
                ],
                edges: [
                    { from: 'issue', to: 'repomap', tone: 'blue' },
                    { from: 'repomap', to: 'repro', tone: 'purple' },
                    { from: 'repro', to: 'patch', tone: 'warm' },
                    { from: 'patch', to: 'sandbox', tone: 'purple' },
                    { from: 'sandbox', to: 'review', tone: 'green' },
                    { from: 'sandbox', to: 'patch', tone: 'red', style: 'dashed' },
                ],
            }),
        ],
    })
}

export default create('dark')
