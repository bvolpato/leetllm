import { GraphDiagram, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 980
export const height = 370
export const alt =
    'Changing candidate source from version 1 to version 2 invalidates its check results and the dependent report. Expected probabilities remain reusable because their test-case inputs did not change.'

export function create(theme: ThemeMode) {
    const palette = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = { ...palette, textMuted: theme === 'light' ? palette.textPrimary : palette.textMuted }
    return Scene({
        c,
        padding: 20,
        gap: 12,
        contentWidth: 940,
        children: [
            GraphDiagram({
                c,
                width: 940,
                height: 310,
                layout: 'manual',
                routing: 'orthogonal',
                routingClearance: 18,
                nodeWidth: 250,
                nodeHeight: 100,
                labelFontSize: 24,
                detailFontSize: 21,
                arrowSize: 6,
                nodes: [
                    {
                        id: 'source',
                        label: 'Candidate source',
                        detail: 'v1 → v2: changed',
                        x: 0.15,
                        y: 0.2,
                        tone: 'purple',
                    },
                    {
                        id: 'expected',
                        label: 'Expected values',
                        detail: 'Same cases: keep',
                        x: 0.15,
                        y: 0.8,
                        tone: 'green',
                    },
                    {
                        id: 'checks',
                        label: 'Check results',
                        detail: 'Recompute for v2',
                        x: 0.5,
                        y: 0.5,
                        tone: 'warm',
                    },
                    {
                        id: 'report',
                        label: 'Final report',
                        detail: 'Recompute from checks',
                        x: 0.85,
                        y: 0.5,
                        tone: 'warm',
                    },
                ],
                edges: [
                    { from: 'source', to: 'checks', tone: 'warm' },
                    { from: 'expected', to: 'checks', tone: 'green' },
                    { from: 'checks', to: 'report', tone: 'warm' },
                ],
            }),
        ],
    })
}

export default create('dark')
