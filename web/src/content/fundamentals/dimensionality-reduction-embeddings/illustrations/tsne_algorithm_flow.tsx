import { AxisPlot, Column, Scene, TextLabel, getReadableToneColor, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Three toy pair-mass graphs compare target P with a uniform map distribution Q and a closer Q. Edge thickness encodes probability. Target P places 0.80 on A–B; the closer map raises its A–B mass to 0.70 and lowers the example KL divergence from 0.460 to 0.038.'
export const width = 640
export const height = 790

const nodes = [
    { id: 'a', x: 0.16, y: 0.22 },
    { id: 'b', x: 0.84, y: 0.22 },
    { id: 'c', x: 0.5, y: 0.78 },
] as const
const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
] as const

function probabilityGraph(c: ReturnType<typeof getThemeColors>, masses: number[]) {
    const edgeColor = getReadableToneColor('purple', c)
    return AxisPlot({
        c,
        width: 600,
        height: 122,
        padding: 24,
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        paths: pairs.map(([a, b], index) => ({
            points: [
                { x: nodes[a].x, y: nodes[a].y },
                { x: nodes[b].x, y: nodes[b].y },
            ],
            color: edgeColor,
            strokeWidth: 2 + masses[index] * 16,
            opacity: 0.92,
        })),
        points: nodes.map((node) => ({
            x: node.x,
            y: node.y,
            tone: 'cyan',
            r: 8,
            stroke: c.bgCard,
            strokeWidth: 2,
        })),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const graph = (title: string, masses: number[], values: string, divergence?: string) =>
        Column({
            gap: 2,
            align: 'center',
            children: [
                TextLabel({ c, text: title, fontSize: 23, align: 'center' }),
                probabilityGraph(c, masses),
                TextLabel({ c, text: values, fontSize: 21, align: 'center', math: true }),
                ...(divergence
                    ? [
                          TextLabel({
                              c,
                              text: `KL(P ∥ Q) = ${divergence}`,
                              fontSize: 21,
                              align: 'center',
                              math: true,
                          }),
                      ]
                    : []),
            ],
        })
    return Scene({
        c,
        title: 't-SNE lowers its loss when neighbor probabilities agree',
        subtitle:
            'Edge width and labels show symmetric pair mass · each graph sums to 1 before rounding',
        padding: 14,
        gap: 10,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 5,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Toy pair distributions · edge width shows probability',
                    fontSize: 21,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'A is left · B is right · C is above',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                graph('Target P', [0.8, 0.1, 0.1], 'A–B 0.80 · A–C 0.10 · B–C 0.10'),
                graph(
                    'Uniform map Q',
                    [1 / 3, 1 / 3, 1 / 3],
                    'A–B 0.33 · A–C 0.33 · B–C 0.33',
                    '0.460',
                ),
                graph('Closer map Q', [0.7, 0.2, 0.1], 'A–B 0.70 · A–C 0.20 · B–C 0.10', '0.038'),
                TextLabel({
                    c,
                    text: 'The full KL objective sums every pair term.',
                    fontSize: 21,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
