import { GraphDiagram, Scene, getThemeColors, type ThemeMode } from 'vizmatic'
export { createFilm } from './_parts/react-loop-film'

export const width = 920
export const height = 420
export const alt =
    'The model chooses evaluate(baseline), the Python runtime runs four checks, and the actual result returns to the next model call: two pass, one overflows, and one divides by zero.'

export function create(theme: ThemeMode) {
    const palette = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = { ...palette, textMuted: theme === 'light' ? palette.textPrimary : palette.textMuted }
    return Scene({
        c,
        padding: 20,
        gap: 12,
        contentWidth: 880,
        children: [
            GraphDiagram({
                c,
                width: 880,
                height: 365,
                layout: 'manual',
                routing: 'straight',
                routingClearance: 18,
                nodeWidth: 330,
                nodeHeight: 100,
                labelFontSize: 25,
                detailFontSize: 21,
                arrowSize: 6,
                nodes: [
                    {
                        id: 'choose',
                        label: 'Model chooses an action',
                        detail: 'evaluate(baseline)',
                        x: 0.23,
                        y: 0.2,
                        tone: 'purple',
                    },
                    {
                        id: 'run',
                        label: 'Host runs Python',
                        detail: 'Four numerical checks',
                        x: 0.77,
                        y: 0.2,
                        tone: 'blue',
                    },
                    {
                        id: 'observe',
                        label: '2 / 4 checks pass',
                        detail: 'Overflow + division by zero',
                        x: 0.77,
                        y: 0.8,
                        tone: 'warm',
                    },
                    {
                        id: 'history',
                        label: 'Append the result',
                        detail: 'Next choice sees this evidence',
                        x: 0.23,
                        y: 0.8,
                        tone: 'green',
                    },
                ],
                edges: [
                    { from: 'choose', to: 'run', tone: 'purple' },
                    { from: 'run', to: 'observe', tone: 'blue' },
                    { from: 'observe', to: 'history', tone: 'warm', emphasis: true },
                    { from: 'history', to: 'choose', tone: 'green' },
                ],
            }),
        ],
    })
}

export default create('dark')
