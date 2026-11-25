import {
    arrow,
    assertEqual,
    column,
    decimal,
    dynamic,
    film,
    place,
    rect,
    sceneKit,
    tex,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

// Deterministic 8x8 latent table pattern + Gaussian static so every render is crisp & reproducible
function buildLatentGrid(): { clean: number[][]; noise: number[][] } {
    const clean: number[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => {
            if ((r === 2 || r === 3) && c >= 1 && c <= 6) return 1.0
            if (r >= 4 && r <= 6 && (c === 1 || c === 6)) return 0.85
            return -0.75
        }),
    )
    let seed = 20260707
    const rand = () => {
        seed = (seed + 0x6d2b79f5) >>> 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const noise: number[][] = Array.from({ length: 8 }, () =>
        Array.from({ length: 8 }, () => {
            const u1 = Math.max(1e-6, rand())
            const u2 = rand()
            return Math.max(-1.6, Math.min(1.6, Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)))
        }),
    )
    return { clean, noise }
}

export function createFilm(theme: ThemeMode = 'dark') {
    const { clean, noise } = buildLatentGrid()
    const totalSteps = 25
    assertEqual(totalSteps, 25)

    return film(
        {
            title: 'Latent diffusion reverse inference loop',
            description:
                'Watch a 64x64x4 latent tensor denoise iteratively under CFG before a single VAE decoder pass expands it to RGB pixels.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 40,
                heading: { size: 54, align: 'center' },
                area: { top: -360, bottom: 400 },
            })
            const heading = kit.heading('Latent Diffusion: Iterative Denoise + 1× VAE Decode')

            // Three horizontal zones: Left = Live Latent Canvas, Center = Denoiser + CFG Loop, Right = VAE Output
            const [leftZone, midZone, rightZone] = kit.area.columns([1.0, 1.35, 0.95], 44)

            const stepVal = s.value(totalSteps) // 25 -> 0
            const pulseVal = s.value(0) // 0..1 highlight on CFG loop
            const decodeVal = s.value(0) // 0..1 VAE decode reveal

            // Left: Live 8x8 latent tensor sharpening as stepVal goes 25 -> 0
            const latentHeader = text('Latent zₜ (64×64×4)', { size: 32, color: 'blue' })
            const stepCounter = decimal(() => Math.round(stepVal.value), {
                digits: 0,
                prefix: 'step t = ',
                suffix: ' / 25',
                size: 32,
                color: 'orange',
            })
            place(column([latentHeader, stepCounter], { gap: 10, align: 'center' }), leftZone!, 'top')

            const gridCenter: [number, number] = [leftZone!.cx, leftZone!.cy + 30]
            const cellSize = 42
            const gridSide = cellSize * 8

            const latentGrid = dynamic(() => {
                const progress = 1 - Math.max(0, Math.min(1, stepVal.value / totalSteps))
                const sig = Math.sqrt(progress)
                const noi = Math.sqrt(Math.max(0, 1 - progress))
                const nodes: Node[] = []
                const x0 = gridCenter[0] - gridSide / 2
                const y0 = gridCenter[1] - gridSide / 2
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const val = sig * clean[r]![c]! + noi * noise[r]![c]!
                        const norm = Math.max(0, Math.min(1, (val + 1.4) / 2.8))
                        const color = norm > 0.64 ? 'gold' : norm > 0.36 ? 'teal' : 'gridStrong'
                        const opacity = 0.25 + 0.72 * norm
                        nodes.push(
                            rect(cellSize - 4, cellSize - 4, {
                                fill: color,
                                stroke: null,
                                radius: 5,
                                opacity,
                            }).at(x0 + c * cellSize + cellSize / 2, y0 + r * cellSize + cellSize / 2),
                        )
                    }
                }
                nodes.push(
                    rect(gridSide + 10, gridSide + 10, {
                        fill: null,
                        stroke: progress > 0.95 ? 'green' : 'blue',
                        width: 3,
                        radius: 10,
                    }).at(gridCenter),
                )
                return nodes
            })

            // Center: Denoiser + CFG + Solver cards
            const loopCard = rect(midZone!.width, 520, {
                fill: 'surface',
                stroke: 'blue',
                width: 2.5,
                dash: [10, 8],
                radius: 18,
            })
                .at(midZone!.cx, midZone!.cy + 16)
                .set('fillOpacity', theme === 'light' ? 0.55 : 0.35)

            const loopTitle = text('Reverse Loop (25×)', { size: 30, color: 'blue' }).at(
                midZone!.cx,
                midZone!.cy - 208,
            )

            const condBox = rect(250, 96, {
                fill: 'surface',
                stroke: 'blue',
                width: 2.5,
                radius: 12,
            }).at(midZone!.cx - 140, midZone!.cy - 102)
            const condEq = tex('\\epsilon_\\theta(z_t, c)', { size: 34, color: 'blue' }).at(
                midZone!.cx - 140,
                midZone!.cy - 102,
            )

            const nullBox = rect(250, 96, {
                fill: 'surface',
                stroke: 'purple',
                width: 2.5,
                radius: 12,
            }).at(midZone!.cx + 140, midZone!.cy - 102)
            const nullEq = tex('\\epsilon_\\theta(z_t, \\emptyset)', { size: 34, color: 'purple' }).at(
                midZone!.cx + 140,
                midZone!.cy - 102,
            )

            const cfgBox = rect(530, 126, {
                fill: 'surface',
                stroke: 'green',
                width: 2.8,
                radius: 14,
            }).at(midZone!.cx, midZone!.cy + 58)
            const cfgEq = tex(
                '\\tilde{\\epsilon} = \\epsilon_\\emptyset + w\\,(\\epsilon_c - \\epsilon_\\emptyset)',
                { size: 34, color: 'green' },
            ).at(midZone!.cx, midZone!.cy + 36)
            const stepEq = text('DDIM / DPM-Solver updates zₜ₋₁', {
                size: 24,
                color: 'dim',
            }).at(midZone!.cx, midZone!.cy + 92)

            const promptTag = text('prompt c: "oak table, morning light"', {
                size: 24,
                color: 'dim',
            }).at(midZone!.cx, midZone!.cy + 206)

            const cfgPulse = dynamic(() => {
                const p = pulseVal.value
                if (p < 0.02) return []
                return [
                    rect(538, 134, {
                        fill: null,
                        stroke: 'gold',
                        width: 4,
                        radius: 16,
                        opacity: p * 0.85,
                    }).at(midZone!.cx, midZone!.cy + 58),
                ]
            })

            const arrLeftToMid = arrow(
                [leftZone!.right - 4, leftZone!.cy + 30],
                [midZone!.left - 4, midZone!.cy + 30],
                { stroke: 'blue', width: 3.5, tip: 12 },
            )
            const arrMidToRight = arrow(
                [midZone!.right + 4, midZone!.cy + 30],
                [rightZone!.left + 4, rightZone!.cy + 30],
                { stroke: 'green', width: 3.5, tip: 12 },
            )

            // Right: Single-pass VAE Decoder + RGB output
            const vaeBox = rect(rightZone!.width - 20, 118, {
                fill: 'surface',
                stroke: 'purple',
                width: 2.5,
                radius: 14,
            }).at(rightZone!.cx, rightZone!.cy - 102)
            const vaeTitle = text('VAE Decoder', { size: 32, color: 'purple' }).at(
                rightZone!.cx,
                rightZone!.cy - 120,
            )
            const vaeSub = text('8× upsampling (1×)', { size: 25, color: 'dim' }).at(
                rightZone!.cx,
                rightZone!.cy - 82,
            )

            const outBox = rect(rightZone!.width - 20, 224, {
                fill: 'surface',
                stroke: 'green',
                width: 3,
                radius: 14,
            }).at(rightZone!.cx, rightZone!.cy + 116)

            const rgbPreview = dynamic(() => {
                const a = decodeVal.value
                if (a < 0.02) {
                    return [
                        text('waiting for z₀...', { size: 24, color: 'dim' }).at(
                            rightZone!.cx,
                            rightZone!.cy + 116,
                        ),
                    ]
                }
                const nodes: Node[] = []
                const pw = 20
                const gx = rightZone!.cx - 80
                const gy = rightZone!.cy + 26
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const v = clean[r]![c]!
                        const color = v > 0.7 ? 'gold' : v > 0.2 ? 'teal' : 'gridStrong'
                        nodes.push(
                            rect(pw - 1, pw - 1, {
                                fill: color,
                                stroke: null,
                                radius: 2,
                                opacity: a * (v > 0 ? 0.95 : 0.35),
                            }).at(gx + c * pw + pw / 2, gy + r * pw + pw / 2),
                        )
                    }
                }
                nodes.push(
                    text('512 × 512 × 3 RGB', { size: 26, color: 'green' })
                        .at(rightZone!.cx, rightZone!.cy + 204)
                        .opacity(a),
                )
                return nodes
            })

            const arrVaeDown = arrow(
                [rightZone!.cx, rightZone!.cy - 40],
                [rightZone!.cx, rightZone!.cy + 2],
                { stroke: 'green', width: 3, tip: 10 },
            )

            // ─── Chapter 1: Seeded Latent Noise ──────────────────────────
            s.chapter('Seeded latent noise')
            s.add(
                heading,
                latentHeader,
                stepCounter,
                latentGrid,
                loopCard,
                loopTitle,
                condBox,
                condEq,
                nullBox,
                nullEq,
                cfgBox,
                cfgEq,
                stepEq,
                promptTag,
                cfgPulse,
                arrLeftToMid,
                arrMidToRight,
                vaeBox,
                vaeTitle,
                vaeSub,
                arrVaeDown,
                outBox,
                rgbPreview,
            )
            s.caption('Start from a 64x64x4 Gaussian noise latent z_T: 48x smaller than 512x512 RGB.', 3.2)
            s.wait(2.4)

            // ─── Chapter 2: Iterative CFG Reverse Steps ──────────────────
            s.chapter('Iterative CFG denoising')
            s.caption(
                'Each solver step runs conditional and null branches, extrapolates with CFG weight w, and removes a slice of noise.',
                5.4,
            )
            s.play(pulseVal.to(1), { duration: 0.45 })
            s.play(stepVal.to(12), { duration: 2.6 })
            s.play(stepVal.to(0), { duration: 2.6 })
            s.play(pulseVal.to(0), { duration: 0.35 })
            s.wait(1.0)

            // ─── Chapter 3: Single-Pass VAE Decode ───────────────────────
            s.chapter('Single-pass VAE decode')
            s.caption(
                'Once z_0 is clean at t = 0, the VAE decoder runs a single 8x upsampling pass to render full RGB pixels.',
                4.2,
            )
            s.play(decodeVal.to(1), { duration: 1.4 })
            s.wait(2.8)
        },
    )
}

export default createFilm()
