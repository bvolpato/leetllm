import {
    arrow,
    axes,
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
    polyline,
    sceneKit,
    tex,
    text,
    type Node,
    type Vec,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const INV_SQRT2 = 1 / Math.sqrt(2)
const CIRCLE_SAMPLES = 96

function transformG(x: number, y: number, t: number): [number, number] {
    // Interpolate linearly from I to G = [[2, 1], [1, 2]]
    const gx = 2 * x + y
    const gy = x + 2 * y
    return [x + t * (gx - x), y + t * (gy - y)]
}

export function createFilm(theme: ThemeMode = 'dark') {
    return film(
        {
            title: 'Eigenvectors stay on their span under G = AᵀA',
            description:
                'Watch the unit circle stretch into an ellipse under the Gram matrix while eigenvectors only scale.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 56,
                heading: { size: 62, align: 'center' },
                area: { top: -355, bottom: 365 },
            })
            const [chartArea, panelArea] = kit.area.columns([1.35, 1], 68)

            const graph = place(
                axes({
                    x: [-3.4, 3.4],
                    y: [-3.4, 3.4],
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

            const title = kit.heading('Eigenvectors stretch without rotating')
            const progress = s.value(0)

            // Reference dashed unit circle (fixed)
            const unitPts: Vec[] = Array.from({ length: CIRCLE_SAMPLES + 1 }, (_, i) => {
                const a = (i / CIRCLE_SAMPLES) * Math.PI * 2
                return graph.world(Math.cos(a), Math.sin(a))
            })
            const unitCircle = polyline(unitPts, {
                stroke: 'dim',
                width: 3,
                dash: [10, 8],
            }).opacity(0.6)

            // Eigen-span dashed guide lines
            const plusSpan = line(graph.world(-2.8, -2.8), graph.world(2.8, 2.8), {
                stroke: 'purple',
                width: 2.5,
                dash: [12, 10],
            }).opacity(0.35)
            const minusSpan = line(graph.world(-2.4, 2.4), graph.world(2.4, -2.4), {
                stroke: 'cyan',
                width: 2.5,
                dash: [12, 10],
            }).opacity(0.35)

            // Dynamic transformed ellipse + animated vectors
            const morphing = dynamic(() => {
                const t = progress.value
                const nodes: Node[] = []

                const ellPts: Vec[] = Array.from({ length: CIRCLE_SAMPLES + 1 }, (_, i) => {
                    const a = (i / CIRCLE_SAMPLES) * Math.PI * 2
                    const [tx, ty] = transformG(Math.cos(a), Math.sin(a), t)
                    return graph.world(tx, ty)
                })
                nodes.push(
                    polyline(ellPts, { stroke: 'purple', width: 5.5 }).glow(t > 0.05 ? 6 : 0),
                )

                // Non-eigenvector [1, 0] -> [2, 1] rotates off the x-axis
                const [nx, ny] = transformG(1, 0, t)
                nodes.push(
                    arrow(graph.world(0, 0), graph.world(nx, ny), {
                        stroke: 'orange',
                        width: 4.5,
                    }).opacity(0.85),
                )
                nodes.push(dot(10, 'orange').at(graph.world(nx, ny)))

                // Eigenvector v+ stretches 1x -> 3x along y = x
                const [px, py] = transformG(INV_SQRT2, INV_SQRT2, t)
                nodes.push(
                    arrow(graph.world(0, 0), graph.world(px, py), {
                        stroke: 'purple',
                        width: 7,
                    }).glow(8),
                )

                // Eigenvector v- stays fixed at 1x along y = -x
                const [mx, my] = transformG(INV_SQRT2, -INV_SQRT2, t)
                nodes.push(
                    arrow(graph.world(0, 0), graph.world(mx, my), {
                        stroke: 'cyan',
                        width: 6,
                    }),
                )

                return nodes
            })

            const matrixEq = tex(String.raw`G = A^{\top}A = \begin{bmatrix}2 & 1 \\ 1 & 2\end{bmatrix}`, {
                size: 52,
            })
            const plusEq = tex(String.raw`G\mathbf{v}_+ = 3\mathbf{v}_+`, {
                size: 54,
                color: 'purple',
            })
            const minusEq = tex(String.raw`G\mathbf{v}_- = 1\mathbf{v}_-`, {
                size: 54,
                color: 'cyan',
            })
            const nonEigenTag = text('e₁ = [1, 0] rotates to [2, 1]', {
                size: 38,
                color: 'orange',
            })
            const sigmaEq = tex(
                String.raw`\sigma_1 = \sqrt{3},\quad \sigma_2 = 1`,
                { size: 48, color: 'green' },
            )

            const infoCol = column([matrixEq, plusEq, minusEq, nonEigenTag, sigmaEq], { gap: 40 })
            place(infoCol, panelArea, 'center')

            const stretchBadge = text('3× stretch', { size: 38, color: 'purple' })
            stretchBadge.moveTo(graph.world(-2.25, 0.85))
            const unitBadge = text('1× fixed', { size: 38, color: 'cyan' })
            unitBadge.moveTo(graph.world(2.25, -0.85))

            const vPlusLabel = tex(String.raw`\mathbf{v}_+`, {
                size: 44,
                color: 'purple',
                display: false,
            }).at(graph.world(0.58, 1.72))

            s.chapter('Unit circle & eigen-directions')
            s.add(title, graph, unitCircle, plusSpan, minusSpan, morphing)
            s.play(fadeIn(matrixEq), fadeIn(vPlusLabel), { duration: 1.0 })
            s.caption(
                'Start with every unit-length input vector on the dashed circle. Two special directions lie at 45 degrees.',
                4.2,
            )
            s.wait(2.5)

            s.chapter('Apply Gram matrix G = AᵀA')
            s.play(fadeOut(vPlusLabel), { duration: 0.35 })
            s.play(progress.to(1), { duration: 3.8 })
            s.caption(
                'G stretches the circle into an ellipse. While [1, 0] swings off its axis to [2, 1], both eigenvectors stay on their lines.',
                5.0,
            )
            s.wait(1.5)

            s.chapter('Read eigenvalues & singular values')
            s.play(
                fadeIn(plusEq),
                fadeIn(minusEq),
                fadeIn(nonEigenTag),
                fadeIn(stretchBadge),
                fadeIn(unitBadge),
                { duration: 1.2 },
            )
            s.wait(1.5)
            const box = boxOf(sigmaEq)
            const underline = line(
                [box.left, box.bottom + 20],
                [box.right, box.bottom + 20],
                { stroke: 'green', width: 4 },
            )
            s.play(fadeIn(sigmaEq), draw(underline), { duration: 1.1 })
            s.caption(
                'The shared direction stretches 3x and the contrast direction stays at 1x, giving singular values sqrt(3) and 1.',
                4.8,
            )
            s.wait(3.5)
        },
    )
}

export default createFilm()
