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
export const height = 650
export const alt =
    'Verification pipeline splitting a generated draft into atomic claims, scoring each claim against retrieved documents with an NLI verifier, and routing to serve verified claims or retry and abstain.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    const nodes: GraphDiagramNode[] = [
        { id: 'docs', label: 'Retrieved docs', detail: 'Context chunks', tone: 'cyan' },
        { id: 'draft', label: 'Draft answer', detail: 'Raw completion', tone: 'neutral' },
        { id: 'split', label: 'Claim splitter', detail: 'Atomic units', tone: 'blue' },
        { id: 'verify', label: 'NLI verifier', detail: 'Calibrated score', tone: 'purple' },
        { id: 'serve', label: 'Serve verified', detail: 'Pruned output', tone: 'green' },
        { id: 'abstain', label: 'Retry or abstain', detail: 'Risk exceeds cap', tone: 'critical' },
    ]

    const edges: GraphDiagramEdge[] = [
        { from: 'draft', to: 'split', tone: 'blue' },
        { from: 'docs', to: 'verify', tone: 'cyan' },
        { from: 'split', to: 'verify', tone: 'purple' },
        { from: 'verify', to: 'serve', tone: 'green' },
        { from: 'verify', to: 'abstain', tone: 'critical' },
    ]

    return Scene({
        c,
        padding: 20,
        gap: 10,
        contentWidth: 680,
        children: [
            TextLabel({
                c,
                text: 'Claim-level verification pipeline',
                fontSize: 28,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'Verify atomic statements before exposing any answer.',
                fontSize: 24,
                color: c.textSecondary,
            }),
            GraphDiagram({
                c,
                width: 680,
                height: 525,
                direction: 'TB',
                layout: 'auto',
                nodeWidth: 256,
                nodeHeight: 92,
                labelFontSize: 25,
                detailFontSize: 23,
                arrowSize: 7,
                padding: 8,
                nodeGap: 34,
                rankGap: 40,
                nodes,
                edges,
            }),
        ],
    })
}

export default create('dark')
