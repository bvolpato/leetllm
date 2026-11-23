import { GraphDiagram, Scene, TextLabel, getThemeColors, type ThemeMode } from 'vizmatic'
export { createFilm } from './_parts/parallel-checks-film'

export const width = 980
export const height = 475
export const alt =
    'Plan for 40 milliseconds, run independent small, positive, and negative input checks in 90, 160, and 70 milliseconds, then report for 30 milliseconds. The critical path is 230 milliseconds; sequential execution takes 390.'

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
                height: 350,
                layout: 'manual',
                routing: 'orthogonal',
                routingClearance: 16,
                nodeWidth: 222,
                nodeHeight: 80,
                labelFontSize: 25,
                detailFontSize: 21,
                arrowSize: 8,
                nodes: [
                    { id: 'plan', label: 'Plan', detail: '40 ms', x: 0.14, y: 0.5, tone: 'purple' },
                    {
                        id: 'small',
                        label: 'Small scores',
                        detail: '90 ms',
                        x: 0.5,
                        y: 0.15,
                        tone: 'blue',
                    },
                    {
                        id: 'positive',
                        label: 'Large positive',
                        detail: '160 ms',
                        x: 0.5,
                        y: 0.5,
                        tone: 'warm',
                    },
                    {
                        id: 'negative',
                        label: 'Large negative',
                        detail: '70 ms',
                        x: 0.5,
                        y: 0.85,
                        tone: 'blue',
                    },
                    {
                        id: 'report',
                        label: 'Report',
                        detail: '30 ms',
                        x: 0.86,
                        y: 0.5,
                        tone: 'green',
                    },
                ],
                edges: [
                    { from: 'plan', to: 'small', tone: 'blue' },
                    { from: 'plan', to: 'negative', tone: 'blue' },
                    { from: 'small', to: 'report', tone: 'blue' },
                    { from: 'negative', to: 'report', tone: 'blue' },
                    { from: 'plan', to: 'positive', tone: 'warm', emphasis: true },
                    { from: 'positive', to: 'report', tone: 'warm', emphasis: true },
                ],
            }),
            TextLabel({
                c,
                text: 'Parallel: 40 + 160 + 30 = 230 ms · Sequential: 390 ms',
                fontSize: 24,
                align: 'center',
            }),
        ],
    })
}

export default create('dark')
