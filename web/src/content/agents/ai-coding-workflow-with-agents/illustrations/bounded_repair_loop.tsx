import { GraphDiagram, Scene, getThemeColors, withDensity, type ThemeMode } from 'vizmatic'

export const width = 720
export const height = 790
export const alt =
    'State machine for finite-budget generate-test-repair execution. A fail-first baseline enters patch generation with budget slot t <= 3. Edits run under sandboxed pytest. Exit 0 emits a verified diff, timeouts or missing dependencies route to environment failure with zero slots spent, and test tracebacks extract error frames for retry while t < 3 or escalation at t = 3.'

export function create(theme: ThemeMode) {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        2.15,
    )
    return Scene({
        c,
        padding: 10,
        gap: 6,
        contentWidth: 700,
        children: GraphDiagram({
            c,
            width: 700,
            height: 750,
            direction: 'TB',
            routing: 'dagre',
            padding: 6,
            nodeWidth: 196,
            nodeHeight: 48,
            nodeGap: 20,
            rankGap: 44,
            edgeGap: 18,
            labelFontSize: 21,
            detailFontSize: 20,
            arrowSize: 6,
            ariaLabel:
                'Generate, test, parse traceback, and repair state machine with separate environment failure path',
            nodes: [
                {
                    id: 'base',
                    label: 'Baseline',
                    detail: 't = 0/3',
                    tone: 'warm',
                    icon: 'play',
                },
                {
                    id: 'gen',
                    label: 'Gen patch',
                    detail: 'slot t<=3',
                    tone: 'purple',
                    icon: 'code',
                },
                {
                    id: 'run',
                    label: 'Pytest',
                    detail: 'timed run',
                    tone: 'cyan',
                    icon: 'terminal',
                },
                {
                    id: 'trace',
                    label: 'Trace',
                    detail: 'retry t<3',
                    tone: 'blue',
                    icon: 'file',
                },
                {
                    id: 'pass',
                    label: 'Exit 0',
                    detail: 'diff ready',
                    tone: 'green',
                    icon: 'check',
                },
                {
                    id: 'env',
                    label: 'Timeout',
                    detail: '0 spent',
                    tone: 'red',
                    icon: 'warning',
                },
            ],
            edges: [
                { from: 'base', to: 'gen', label: 'start', tone: 'warm' },
                { from: 'gen', to: 'run', label: 'apply', tone: 'purple' },
                { from: 'run', to: 'trace', label: 'fail', tone: 'blue' },
                {
                    from: 'trace',
                    to: 'gen',
                    label: 't < 3',
                    tone: 'purple',
                    style: 'dashed',
                },
                { from: 'run', to: 'pass', label: 'pass', tone: 'green' },
                {
                    from: 'run',
                    to: 'env',
                    label: 'timeout',
                    tone: 'red',
                    style: 'dashed',
                },
            ],
        }),
    })
}

export default create('dark')
