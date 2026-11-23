import {
    GraphDiagram,
    Scene,
    TextLabel,
    getThemeColors,
    type GraphDiagramEdge,
    type GraphDiagramNode,
    type ThemeMode,
} from 'vizmatic'

export const width = 720
export const height = 680
export const alt =
    'Four-stage fairness control loop moving from counterfactual prompt pairs and subgroup calibration to parity gate checks before release and live slice drift re-audits afterward.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    const nodes: GraphDiagramNode[] = [
        { id: 'pairs', label: 'Counterfactual pairs', detail: 'Matched prompts', tone: 'cyan' },
        { id: 'calib', label: 'Group calibration', detail: 'Check odds match', tone: 'blue' },
        { id: 'gate', label: 'Parity gate', detail: 'CI within limit', tone: 'purple' },
        { id: 'prod', label: 'Live routing', detail: 'Monitor slice drift', tone: 'green' },
    ]

    const edges: GraphDiagramEdge[] = [
        { from: 'pairs', to: 'calib', tone: 'cyan' },
        { from: 'calib', to: 'gate', tone: 'blue' },
        { from: 'gate', to: 'prod', tone: 'green' },
        { from: 'prod', to: 'pairs', tone: 'warm', dashed: true },
    ]

    return Scene({
        c,
        padding: 20,
        gap: 10,
        contentWidth: 680,
        children: [
            TextLabel({
                c,
                text: 'Pre-release and live fairness control loop',
                fontSize: 28,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'Gate releases on subgroup gaps and monitor live drift.',
                fontSize: 23,
                color: c.textSecondary,
            }),
            GraphDiagram({
                c,
                width: 680,
                height: 550,
                direction: 'TB',
                layout: 'auto',
                nodeWidth: 270,
                nodeHeight: 86,
                labelFontSize: 24,
                detailFontSize: 22,
                arrowSize: 7,
                padding: 8,
                nodeGap: 34,
                rankGap: 36,
                nodes,
                edges,
            }),
        ],
    })
}

export default create('dark')
