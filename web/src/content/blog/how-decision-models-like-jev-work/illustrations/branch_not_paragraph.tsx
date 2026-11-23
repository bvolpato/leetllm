import { GraphDiagram, Row, Scene, TextLabel, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 560
export const height = 620
export const alt =
    'Two paths process the same registry 401 log. The text path generates several output tokens, then parses registry_auth. The decision path scores the candidate test, registry, and review routes, then returns registry_auth directly. Both paths still process the input.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    return Scene({
        c,
        padding: 20,
        gap: 16,
        contentWidth: 520,
        children: [
            Row({
                width: 520,
                gap: 40,
                children: [
                    TextLabel({
                        c,
                        text: 'Text output',
                        width: 240,
                        fontSize: 24,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }),
                    TextLabel({
                        c,
                        text: 'Typed decision',
                        width: 240,
                        fontSize: 24,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }),
                ],
            }),
            GraphDiagram({
                c,
                width: 520,
                height: 470,
                nodeWidth: 224,
                nodeHeight: 94,
                labelFontSize: 24,
                detailFontSize: 20,
                padding: 6,
                nodes: [
                    {
                        id: 'text-log',
                        label: 'Read log',
                        detail: 'registry 401',
                        x: 0.02,
                        y: 0.02,
                        tone: 'blue',
                    },
                    {
                        id: 'text-output',
                        label: 'Generate prose',
                        detail: 'several tokens',
                        x: 0.02,
                        y: 0.5,
                        tone: 'purple',
                    },
                    {
                        id: 'text-route',
                        label: 'Parse route',
                        detail: 'registry_auth',
                        x: 0.02,
                        y: 0.98,
                        tone: 'green',
                    },
                    {
                        id: 'decision-log',
                        label: 'Read log',
                        detail: 'registry 401',
                        x: 0.98,
                        y: 0.02,
                        tone: 'blue',
                    },
                    {
                        id: 'decision-score',
                        label: 'Score routes',
                        detail: 'test / registry / review',
                        x: 0.98,
                        y: 0.5,
                        tone: 'purple',
                    },
                    {
                        id: 'decision-route',
                        label: 'Return choice',
                        detail: 'registry_auth',
                        x: 0.98,
                        y: 0.98,
                        tone: 'green',
                    },
                ],
                edges: [
                    { from: 'text-log', to: 'text-output' },
                    { from: 'text-output', to: 'text-route' },
                    { from: 'decision-log', to: 'decision-score' },
                    { from: 'decision-score', to: 'decision-route' },
                ],
            }),
        ],
    })
}

export default create('dark')
