import {
    arrow,
    assertEqual,
    axes,
    boxOf,
    circle,
    column,
    decimal,
    dot,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    place,
    polyline,
    rect,
    ripple,
    row,
    sceneKit,
    seq,
    tex,
    text,
    type Node,
    type Vec,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

interface SamplePoint {
    x0: number
    y0: number
    epsX: number
    epsY: number
    ring: 'inner' | 'outer'
}

const T_MAX = 1000
const R_INNER = 0.78
const R_OUTER = 1.82
const N_INNER = 16
const N_OUTER = 24
const HIGHLIGHT_INDEX = N_INNER + 4 // Clean outer-ring particle in upper-right quadrant

// Deterministic Mulberry32 PRNG + Box-Muller Gaussian samples so dark & light frames match exactly.
function mulberry32(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function buildDataset(): SamplePoint[] {
    const rand = mulberry32(20261125)
    const nextGaussian = (): number => {
        const u1 = Math.max(1e-6, rand())
        const u2 = rand()
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        return Math.max(-2.65, Math.min(2.65, z))
    }

    const points: SamplePoint[] = []
    for (let i = 0; i < N_INNER; i++) {
        const theta = (2 * Math.PI * i) / N_INNER + 0.1
        points.push({
            x0: R_INNER * Math.cos(theta),
            y0: R_INNER * Math.sin(theta),
            epsX: nextGaussian(),
            epsY: nextGaussian(),
            ring: 'inner',
        })
    }
    for (let i = 0; i < N_OUTER; i++) {
        const theta = (2 * Math.PI * i) / N_OUTER + 0.18
        let epsX = nextGaussian()
        let epsY = nextGaussian()
        // Give the highlighted sample a clear, vivid excursion into the upper-right prior.
        if (N_INNER + i === HIGHLIGHT_INDEX) {
            epsX = 2.05
            epsY = 1.85
        }
        points.push({
            x0: R_OUTER * Math.cos(theta),
            y0: R_OUTER * Math.sin(theta),
            epsX,
            epsY,
            ring: 'outer',
        })
    }
    return points
}

// Smooth variance-preserving cosine schedule matching the static figure endpoints:
// t = 0 -> alphaBar = 1.000, t = 500 -> 0.5005, t = 1000 -> 0.001.
function alphaBar(t: number): number {
    const u = Math.max(0, Math.min(1, t / T_MAX))
    const c = Math.cos(0.5 * Math.PI * u)
    return 0.001 + 0.999 * c * c
}

function signalCoeff(t: number): number {
    return Math.sqrt(alphaBar(t))
}

function noiseCoeff(t: number): number {
    return Math.sqrt(1 - alphaBar(t))
}

// Exact Bayes-optimal posterior mean E[x_0 | x_t] and denoising vector -eps*(x_t, t)
// for the 40-point empirical Gaussian mixture at timestep t.
function exactDenoise(
    x: number,
    y: number,
    t: number,
    data: readonly SamplePoint[],
): { x0Hat: number; y0Hat: number; negEpsX: number; negEpsY: number } {
    const sig = signalCoeff(t)
    const noi = Math.max(1e-4, noiseCoeff(t))
    const invTwoVar = 1 / (2 * noi * noi)

    let maxLogW = -Infinity
    const logW = new Array<number>(data.length)
    for (let i = 0; i < data.length; i++) {
        const dx = x - sig * data[i]!.x0
        const dy = y - sig * data[i]!.y0
        const lw = -(dx * dx + dy * dy) * invTwoVar
        logW[i] = lw
        if (lw > maxLogW) maxLogW = lw
    }

    let sumW = 0
    let x0Hat = 0
    let y0Hat = 0
    for (let i = 0; i < data.length; i++) {
        const w = Math.exp(logW[i]! - maxLogW)
        sumW += w
        x0Hat += w * data[i]!.x0
        y0Hat += w * data[i]!.y0
    }
    x0Hat /= sumW
    y0Hat /= sumW

    const epsX = (x - sig * x0Hat) / noi
    const epsY = (y - sig * y0Hat) / noi
    return { x0Hat, y0Hat, negEpsX: -epsX, negEpsY: -epsY }
}

// Precompute exact DDIM reverse trajectories from x_T back to x_0 across 80 discrete steps.
function computeReverseTrajectories(data: readonly SamplePoint[], steps = 80): [number, number][][] {
    const sigT = signalCoeff(T_MAX)
    const noiT = noiseCoeff(T_MAX)
    const trajectories: [number, number][][] = data.map((p) => [
        [sigT * p.x0 + noiT * p.epsX, sigT * p.y0 + noiT * p.epsY],
    ])

    for (let sIdx = 0; sIdx < steps; sIdx++) {
        const tCurr = T_MAX * (1 - sIdx / steps)
        const tNext = T_MAX * (1 - (sIdx + 1) / steps)
        const sigNext = signalCoeff(tNext)
        const noiNext = noiseCoeff(tNext)

        for (let i = 0; i < data.length; i++) {
            const [cx, cy] = trajectories[i]![sIdx]!
            const { x0Hat, y0Hat, negEpsX, negEpsY } = exactDenoise(cx, cy, tCurr, data)
            const epsX = -negEpsX
            const epsY = -negEpsY
            const nx = sigNext * x0Hat + noiNext * epsX
            const ny = sigNext * y0Hat + noiNext * epsY
            trajectories[i]!.push([nx, ny])
        }
    }
    return trajectories
}

function sampleTrajectory(traj: readonly [number, number][], u: number): [number, number] {
    const clamped = Math.max(0, Math.min(1, u))
    const idxFloat = clamped * (traj.length - 1)
    const lo = Math.floor(idxFloat)
    const hi = Math.min(traj.length - 1, lo + 1)
    const frac = idxFloat - lo
    const a = traj[lo]!
    const b = traj[hi]!
    return [a[0] + frac * (b[0] - a[0]), a[1] + frac * (b[1] - a[1])]
}

export function createFilm(theme: ThemeMode = 'dark') {
    const data = buildDataset()
    const reverseTrajs = computeReverseTrajectories(data, 80)

    // Verify variance preservation invariant at t = 0, 500, and 1000.
    for (const checkT of [0, 500, 1000]) {
        const sVal = signalCoeff(checkT)
        const nVal = noiseCoeff(checkT)
        assertEqual(Number((sVal * sVal + nVal * nVal).toFixed(6)), 1, `variance invariant at t=${checkT}`)
    }
    assertEqual(Number(signalCoeff(1000).toFixed(3)), 0.032, 'terminal signal coefficient')
    assertEqual(Number(noiseCoeff(1000).toFixed(3)), 0.999, 'terminal noise coefficient')

    return film(
        {
            title: 'Forward noising and reverse denoising in diffusion',
            description:
                'Watch a two-ring data manifold dissolve into isotropic Gaussian noise, reveal its learned score field, and flow back onto the clean manifold.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 48,
                heading: { size: 56, align: 'center' },
                area: { top: -375, bottom: 430 },
            })
            const [plotArea, panelArea] = kit.area.columns([1.42, 1], 56)
            const heading = kit.heading('Diffusion: Forward Noising & Reverse Score Flow')

            // Square coordinate system for the 2D data & noise space.
            const graph = place(
                axes({
                    x: [-3.2, 3.2],
                    y: [-3.2, 3.2],
                    width: 750,
                    height: 750,
                    xStep: 1,
                    yStep: 1,
                    grid: true,
                    labels: false,
                    tips: false,
                }),
                plotArea!,
                'center',
            )

            // Faint reference rings showing the clean data manifold support.
            const origin = graph.world(0, 0)
            const unitPx = graph.world(1, 0)[0] - origin[0]
            const refInner = circle(R_INNER * unitPx, {
                stroke: 'teal',
                width: 2,
                dash: [8, 8],
                opacity: 0.28,
            }).at(origin)
            const refOuter = circle(R_OUTER * unitPx, {
                stroke: 'blue',
                width: 2,
                dash: [8, 8],
                opacity: 0.28,
            }).at(origin)

            // Timeline values driving the entire continuous physics.
            const tVal = s.value(0) // 0 -> 1000 during forward, 1000 -> 0 during reverse
            const modeVal = s.value(0) // 0 = forward formula, 1 = reverse DDIM trajectory
            const revProgress = s.value(0) // 0 at x_T -> 1 at x_0
            const scoreAlpha = s.value(0) // 0 = hidden, 1 = full score field overlay
            const highlightAlpha = s.value(0) // 0 = normal cloud, 1 = highlighted sample + trail

            // Score vector field grid (7 x 7) computed dynamically from the exact denoiser.
            const gridCoords = [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4]
            const scoreField = dynamic(() => {
                const alpha = scoreAlpha.value
                if (alpha < 0.02) return []
                // Evaluate the score field at a readable mid-noise slice when stationary at x_T,
                // or track the live timestep as reverse denoising sharpens onto the two rings.
                const evalT = modeVal.value < 0.5 ? 360 : Math.max(85, tVal.value)
                const nodes: Node[] = []
                for (const gx of gridCoords) {
                    for (const gy of gridCoords) {
                        const { negEpsX, negEpsY } = exactDenoise(gx, gy, evalT, data)
                        const mag = Math.hypot(negEpsX, negEpsY)
                        if (mag < 0.14) continue
                        const len = Math.min(0.46, 0.16 + 0.14 * mag)
                        const ux = negEpsX / mag
                        const uy = negEpsY / mag
                        const from = graph.world(gx - 0.35 * len * ux, gy - 0.35 * len * uy)
                        const toPt = graph.world(gx + 0.65 * len * ux, gy + 0.65 * len * uy)
                        nodes.push(
                            arrow(from, toPt, {
                                stroke: 'orange',
                                width: 2.6,
                                tip: 9,
                                opacity: alpha * 0.82,
                            }),
                        )
                    }
                }
                return nodes
            })

            // Particle cloud + highlighted sample reverse trajectory.
            const particles = dynamic(() => {
                const t = tVal.value
                const isReverse = modeVal.value >= 0.5
                const sig = signalCoeff(t)
                const noi = noiseCoeff(t)
                const u = revProgress.value
                const hi = highlightAlpha.value
                const nodes: Node[] = []

                // Draw reverse trajectory curve for the highlighted particle behind the dots.
                if (isReverse && hi > 0.02 && u > 0.01) {
                    const traj = reverseTrajs[HIGHLIGHT_INDEX]!
                    const maxIdx = Math.max(1, Math.floor(u * (traj.length - 1)))
                    const pts: Vec[] = []
                    for (let k = 0; k <= maxIdx; k++) {
                        pts.push(graph.world(traj[k]![0], traj[k]![1]))
                    }
                    const tip = sampleTrajectory(traj, u)
                    pts.push(graph.world(tip[0], tip[1]))
                    nodes.push(
                        polyline(pts, {
                            stroke: 'gold',
                            width: 4.5,
                            opacity: hi * 0.92,
                        }),
                    )
                }

                let highlightScreenPt: Vec | null = null
                for (let i = 0; i < data.length; i++) {
                    const p = data[i]!
                    let x: number
                    let y: number
                    if (!isReverse) {
                        x = sig * p.x0 + noi * p.epsX
                        y = sig * p.y0 + noi * p.epsY
                    } else {
                        ;[x, y] = sampleTrajectory(reverseTrajs[i]!, u)
                    }

                    const screenPt = graph.world(x, y)
                    if (i === HIGHLIGHT_INDEX && hi > 0.05) {
                        highlightScreenPt = screenPt
                        continue
                    }
                    const baseColor = p.ring === 'inner' ? 'teal' : 'blue'
                    const dimOpacity = hi > 0.05 ? 0.62 : 0.92
                    nodes.push(dot(8.5, baseColor).at(screenPt).opacity(dimOpacity))
                }
                // Paint the highlighted gold sample last so it always sits cleanly above all other particles.
                if (highlightScreenPt) {
                    nodes.push(
                        circle(18, { stroke: 'gold', width: 3.4, fill: null })
                            .at(highlightScreenPt)
                            .opacity(hi),
                        dot(11, 'gold').at(highlightScreenPt).glow(10),
                    )
                }
                return nodes
            })

            // Right-hand telemetry panel card.
            const panelCard = rect(panelArea!.width, panelArea!.height, {
                fill: 'surface',
                stroke: 'gridStrong',
                width: 2,
                radius: 18,
            })
                .at(panelArea!.cx, panelArea!.cy)
                .set('fillOpacity', theme === 'light' ? 0.65 : 0.45)

            const innerPanel = panelArea!.inset(32)
            const [phaseBox, eqBox, timeBox, coeffBox, invBox] = innerPanel.rows(
                [0.9, 1.05, 0.9, 1.85, 0.75],
                14,
            )

            const makePhase = (label: string, sub: string, color: 'teal' | 'orange' | 'blue') =>
                place(
                    column(
                        [
                            text(label, { size: 36, color }),
                            text(sub, { size: 26, color: 'dim' }),
                        ],
                        { gap: 10, align: 'center' },
                    ),
                    phaseBox!,
                    'center',
                )

            const phaseForward = makePhase('1. Forward Noising', 'Clean manifold to prior', 'teal')
            const phaseScore = makePhase('2. Learned Score Field', 'Points toward high density', 'orange')
            const phaseReverse = makePhase('3. Reverse Denoising', 'Particles flow back to x0', 'blue')

            const eqForward = place(
                tex('x_t = \\sqrt{\\bar{\\alpha}_t}\\,x_0 + \\sqrt{1-\\bar{\\alpha}_t}\\,\\epsilon', {
                    size: 38,
                    color: 'ink',
                }),
                eqBox!,
                'center',
            )
            const eqScore = place(
                tex('-\\epsilon_\\theta(x_t, t) \\propto \\nabla_{x_t}\\log p_t(x_t)', {
                    size: 38,
                    color: 'orange',
                }),
                eqBox!,
                'center',
            )
            const eqReverse = place(
                tex('p_\\theta(x_{t-1} \\mid x_t)\\;\\text{follows}\\;-\\epsilon_\\theta', {
                    size: 38,
                    color: 'blue',
                }),
                eqBox!,
                'center',
            )

            // Live timestep counter t (single decimal node avoids width-change overlap).
            const tRow = place(
                decimal(() => Math.round(tVal.value), {
                    digits: 0,
                    prefix: 't = ',
                    suffix: ' / 1000',
                    size: 42,
                    color: 'ink',
                }),
                timeBox!,
                'center',
            )

            // Live signal & noise readouts + synchronized horizontal bars.
            const sigLabel = tex('\\sqrt{\\bar{\\alpha}_t}', { size: 36, color: 'teal', display: false })
            const sigText = text('signal', { size: 26, color: 'dim' })
            const sigNum = decimal(() => signalCoeff(tVal.value), {
                digits: 3,
                size: 38,
                color: 'teal',
            })
            const sigRow = row([sigLabel, sigText, sigNum], { gap: 24 })

            const noiLabel = tex('\\sqrt{1-\\bar{\\alpha}_t}', {
                size: 36,
                color: 'orange',
                display: false,
            })
            const noiText = text('noise', { size: 26, color: 'dim' })
            const noiNum = decimal(() => noiseCoeff(tVal.value), {
                digits: 3,
                size: 38,
                color: 'orange',
            })
            const noiRow = row([noiLabel, noiText, noiNum], { gap: 24 })

            const [sigSlot, noiSlot] = coeffBox!.rows([1, 1], 16)
            place(sigRow, sigSlot!, 'top')
            place(noiRow, noiSlot!, 'top')

            const barW = innerPanel.width - 28
            const sigBarY = boxOf(sigRow).bottom + 24
            const noiBarY = boxOf(noiRow).bottom + 24

            const sigTrack = rect(barW, 18, {
                fill: 'gridStrong',
                stroke: 'gridStrong',
                width: 1.5,
                radius: 9,
                opacity: 0.4,
            }).at(innerPanel.cx, sigBarY)
            const noiTrack = rect(barW, 18, {
                fill: 'gridStrong',
                stroke: 'gridStrong',
                width: 1.5,
                radius: 9,
                opacity: 0.4,
            }).at(innerPanel.cx, noiBarY)

            const coeffBars = dynamic(() => {
                const sv = signalCoeff(tVal.value)
                const nv = noiseCoeff(tVal.value)
                const out: Node[] = []
                if (sv > 0.01) {
                    const w = Math.max(18, barW * sv)
                    out.push(
                        rect(w, 18, { fill: 'teal', stroke: null, radius: 9 }).at(
                            innerPanel.cx - barW / 2 + w / 2,
                            sigBarY,
                        ),
                    )
                }
                if (nv > 0.01) {
                    const w = Math.max(18, barW * nv)
                    out.push(
                        rect(w, 18, { fill: 'orange', stroke: null, radius: 9 }).at(
                            innerPanel.cx - barW / 2 + w / 2,
                            noiBarY,
                        ),
                    )
                }
                return out
            })

            const invariantEq = place(
                tex('\\bar{\\alpha}_t + (1-\\bar{\\alpha}_t) = 1.00', {
                    size: 32,
                    color: 'dim',
                }),
                invBox!,
                'center',
            )

            // ─── Chapter 1: Forward Noising q(x_t | x_0) ──────────────────────────
            s.chapter('Forward Noising')
            s.add(
                heading,
                graph,
                refInner,
                refOuter,
                scoreField,
                particles,
                panelCard,
                phaseForward,
                eqForward,
                tRow,
                sigRow,
                noiRow,
                sigTrack,
                noiTrack,
                coeffBars,
                invariantEq,
            )
            s.caption(
                'Start at t = 0 with 40 clean samples resting on a two-ring data manifold.',
                3.0,
            )
            s.wait(2.2)

            s.caption(
                'Forward diffusion gradually shrinks the signal and adds Gaussian noise until the manifold dissolves into an isotropic cloud.',
                5.4,
            )
            s.play(tVal.to(T_MAX), { duration: 5.5 })
            s.wait(1.2)

            // ─── Chapter 2: Learned Score Field ───────────────────────────────────
            s.chapter('Learned Score Field')
            s.caption(
                'A trained denoiser estimates the score field, pointing every noisy location back toward high-density regions of the rings.',
                4.8,
            )
            s.play(
                seq(fadeOut(phaseForward), fadeIn(phaseScore)),
                seq(fadeOut(eqForward), fadeIn(eqScore)),
                scoreAlpha.to(1),
                { duration: 1.6 },
            )
            s.wait(2.6)

            // ─── Chapter 3: Reverse Denoising p_theta(x_{t-1} | x_t) ──────────────
            s.chapter('Reverse Denoising')
            const startHi = reverseTrajs[HIGHLIGHT_INDEX]![0]!
            const endHi = reverseTrajs[HIGHLIGHT_INDEX]![reverseTrajs[HIGHLIGHT_INDEX]!.length - 1]!
            const startHiScreen = graph.world(startHi[0], startHi[1])
            const endHiScreen = graph.world(endHi[0], endHi[1])

            s.play(
                seq(fadeOut(phaseScore), fadeIn(phaseReverse)),
                seq(fadeOut(eqScore), fadeIn(eqReverse)),
                modeVal.to(1),
                highlightAlpha.to(1),
                scoreAlpha.to(0.45),
                { duration: 0.9 },
            )
            s.play(ripple(startHiScreen, { color: 'gold', radius: 48 }), { duration: 0.6 })

            s.caption(
                'Following the learned denoising vectors reverses time, guiding pure noise particles smoothly back onto the two-ring manifold.',
                5.8,
            )
            s.play(
                revProgress.to(1),
                tVal.to(0),
                { duration: 5.8 },
            )
            s.play(
                scoreAlpha.to(0),
                ripple(endHiScreen, { color: 'gold', radius: 52 }),
                { duration: 0.9 },
            )
            s.wait(3.2)
        },
    )
}
