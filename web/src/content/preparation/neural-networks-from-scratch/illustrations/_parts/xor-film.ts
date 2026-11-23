import {
    axes,
    assertEqual,
    beside,
    boxOf,
    column,
    dot,
    draw,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    line,
    place,
    sceneKit,
    seq,
    tex,
    text,
    to,
    type Node,
    type Vec,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const samples = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
] as const
const hidden = (x: number, y: number): Vec => [Math.max(0, x - y), Math.max(0, y - x)]

export function createFilm(theme: ThemeMode = 'dark') {
    return film(
        {
            title: 'How hidden neurons untangle XOR',
            description:
                'Follow the same four points as two ReLU features change their coordinates.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            samples.forEach(([x, y]) =>
                assertEqual(hidden(x, y)[0] + hidden(x, y)[1], Math.abs(x - y)),
            )
            const kit = sceneKit({
                size: 60,
                heading: { size: 66, align: 'center' },
                area: { top: -365, bottom: 370 },
            })
            const [chartArea, explanationArea] = kit.area.columns([1.45, 1], 72)
            const graph = place(
                axes({
                    x: [-0.22, 1.22],
                    y: [-0.22, 1.22],
                    width: 680,
                    height: 680,
                    xStep: 1,
                    yStep: 1,
                    labels: false,
                    grid: false,
                    tips: false,
                }),
                chartArea,
                'center',
            )
            const title = kit.heading('Four points. One useful transformation.')
            const inputName = text('From inputs to features', { size: 52 })
            const hiddenName = text('Hidden features', { size: 52, color: 'green' })
            const eq1 = tex('h_1 = \\max(0,x_1-x_2)', { size: 50 })
            const eq2 = tex('h_2 = \\max(0,x_2-x_1)', { size: 50 })
            const explanation = column([inputName, eq1, eq2], { gap: 48 })
            place(explanation, explanationArea, 'center')
            hiddenName.moveTo(boxOf(inputName).point('center'))
            const progress = s.value(0)
            const interpolate = (x: number, y: number): Vec => {
                const [u, v] = hidden(x, y)
                return graph.world(x + progress.value * (u - x), y + progress.value * (v - y))
            }
            const mesh = dynamic(() => {
                const nodes: Node[] = []
                for (let axis = 0; axis < 2; axis++) {
                    for (let stripe = 0; stripe <= 6; stripe++) {
                        for (let part = 0; part < 20; part++) {
                            const fixed = stripe / 6,
                                start = part / 20,
                                end = (part + 1) / 20
                            const a =
                                axis === 0 ? interpolate(fixed, start) : interpolate(start, fixed)
                            const b = axis === 0 ? interpolate(fixed, end) : interpolate(end, fixed)
                            nodes.push(line(a, b, { stroke: 'blue', width: 1.1 }).opacity(0.18))
                        }
                    }
                }
                return nodes
            })
            const markers = samples.map(([x, y]) =>
                dot(18, x === y ? 'blue' : 'orange')
                    .at(graph.world(x, y))
                    .glow(9),
            )
            const xTick = beside(
                tex('1', { size: 48, color: 'dim', display: false }),
                markers[2],
                'under',
                28,
            )
            const yTick = beside(
                tex('1', { size: 48, color: 'dim', display: false }),
                markers[1],
                'left',
                28,
            )
            const zeroTag = text('class 0', { size: 50, color: 'blue' })
            const oneTag = text('class 1', { size: 50, color: 'orange' })
            const legend = column([zeroTag, oneTag], { gap: 24 })
            beside(legend, explanation, 'under', 48)
            s.chapter('The four inputs')
            s.add(title, graph, mesh, xTick, yTick, inputName, zeroTag, oneTag)
            s.play(...markers.map((mark) => fadeIn(mark)), { duration: 1 })
            s.caption(
                'The two orange corners cannot be separated from both blue corners by one straight line.',
                5,
            )
            s.wait(4)
            s.chapter('Two ReLU measurements')
            s.play(fadeIn(eq1), fadeIn(eq2), { duration: 1.2 })
            s.caption(
                'Each hidden neuron measures how much one input exceeds the other. ReLU clips a negative difference to zero.',
                6,
            )
            s.wait(3)
            s.chapter('Follow the same points')
            s.play(
                progress.to(1),
                ...markers.map((mark, i) =>
                    to(mark, (node) =>
                        node.at(graph.world(...hidden(samples[i][0], samples[i][1]))),
                    ),
                ),
                { duration: 5 },
            )
            s.play(seq(fadeOut(inputName), fadeIn(hiddenName)), { duration: 0.6 })
            s.caption(
                'The two blue points meet at the origin. The orange points occupy the positive axes.',
                3.8,
            )
            s.wait(2)
            s.chapter('One separating line')
            s.play(fadeOut([zeroTag, oneTag]), { duration: 0.4 })
            const boundary = line(graph.world(-0.12, 0.62), graph.world(0.62, -0.12), {
                stroke: 'green',
                width: 6,
                dash: [14, 10],
            })
            const equation = tex('h_1+h_2=0.5', { size: 60, color: 'green' })
            place(equation, explanationArea, 'bottom')
            s.play(draw(boundary), fadeIn(equation), { duration: 1.4 })
            s.caption(
                'In hidden space, h1 + h2 = 0.5 separates the colors. The output neuron can now finish the classification.',
                5,
            )
            s.wait(5)
        },
    )
}
