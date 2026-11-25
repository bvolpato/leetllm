import {
    arrow,
    assertEqual,
    dynamic,
    fadeIn,
    film,
    line,
    place,
    rect,
    sceneArea,
    smoother,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const NUM_GPUS = 4
const GPU_XS = [-645, -215, 215, 645] as const
const GPU_Y = -45
const KV_COLORS = ['teal', 'blue', 'purple', 'orange'] as const

// At ring step s (0..3), KV shard k is located on GPU (k + s) % 4
function gpuIndexForKv(kvId: number, step: number): number {
    return (kvId + step) % NUM_GPUS
}

export function createFilm(theme: ThemeMode = 'dark') {
    // Verify every GPU sees every KV shard exactly once over 4 ring steps
    for (let g = 0; g < NUM_GPUS; g++) {
        const seen = new Set<number>()
        for (let step = 0; step < NUM_GPUS; step++) {
            for (let k = 0; k < NUM_GPUS; k++) {
                if (gpuIndexForKv(k, step) === g) seen.add(k)
            }
        }
        assertEqual(seen.size, NUM_GPUS, `GPU ${g} visits all 4 KV shards`)
    }

    return film(
        {
            title: 'Ring Attention Prefill: Circulating KV Shards',
            description:
                'Four GPUs pin query shards Q0..Q3 locally while KV0..KV3 rotate clockwise around the ring over 4 steps, overlapping communication with online-softmax attention updates.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const titleArea = sceneArea({ left: -860, right: 860, top: -480, bottom: -395 })
            const subArea = sceneArea({ left: -860, right: 860, top: -392, bottom: -332 })
            const heading = place(
                text('Ring Attention Prefill (4 GPUs)', { size: 52, color: 'ink' }),
                titleArea,
                'center',
            )
            const subtitle = place(
                text('Queries stay pinned; KV0..KV3 circulate clockwise via online softmax', {
                    size: 28,
                    color: 'dim',
                }),
                subArea,
                'center',
            )

            // Continuous ring rotation progress: 0 -> 1 -> 2 -> 3
            const ringStep = s.value(0)
            const progressFill = s.value(0.25)

            const boxW = 310
            const boxH = 260
            const kvSlotOffsetY = 26
            const wrapY = 210

            // Static GPU frames + pinned Q_i badges + clockwise ring pipes
            const staticNodes: Node[] = []
            for (let g = 0; g < NUM_GPUS; g++) {
                const gx = GPU_XS[g]!
                staticNodes.push(
                    rect(boxW, boxH, {
                        fill: 'surface',
                        stroke: 'blue',
                        width: 3.5,
                        radius: 16,
                    }).at(gx, GPU_Y),
                    text(`GPU ${g}`, { size: 32, color: 'blue' }).moveTo([gx - 72, GPU_Y - 88]),
                    rect(126, 48, {
                        fill: 'surface',
                        stroke: 'blue',
                        width: 2.5,
                        radius: 8,
                    }).at(gx + 64, GPU_Y - 88),
                    text(`Q${g} pinned`, { size: 24, color: 'ink' }).moveTo([gx + 64, GPU_Y - 88]),
                )
            }

            // Clockwise arrows 0->1, 1->2, 2->3
            for (let g = 0; g < NUM_GPUS - 1; g++) {
                const x1 = GPU_XS[g]! + boxW / 2 + 10
                const x2 = GPU_XS[g + 1]! - boxW / 2 - 10
                staticNodes.push(
                    arrow([x1, GPU_Y + kvSlotOffsetY], [x2, GPU_Y + kvSlotOffsetY], {
                        stroke: 'orange',
                        width: 4.5,
                        tip: 15,
                    }),
                )
            }
            // Return track GPU 3 -> GPU 0 underneath
            staticNodes.push(
                line([GPU_XS[3]!, GPU_Y + boxH / 2 + 8], [GPU_XS[3]!, wrapY], {
                    stroke: 'orange',
                    width: 4,
                    dash: [10, 8],
                }),
                line([GPU_XS[3]!, wrapY], [GPU_XS[0]!, wrapY], {
                    stroke: 'orange',
                    width: 4,
                    dash: [10, 8],
                }),
                arrow([GPU_XS[0]!, wrapY], [GPU_XS[0]!, GPU_Y + boxH / 2 + 12], {
                    stroke: 'orange',
                    width: 4,
                    tip: 15,
                }),
                text('Ring return link (GPU 3 → GPU 0)', { size: 24, color: 'orange' }).moveTo([
                    0,
                    wrapY + 62,
                ]),
            )

            // Helper interpolating a KV token's position cleanly along the ring between floor(t) and ceil(t)
            const kvPosition = (kvId: number, t: number): [number, number] => {
                const step = Math.floor(t)
                const frac = t - step
                const fromG = gpuIndexForKv(kvId, step)
                const toG = gpuIndexForKv(kvId, step + 1)
                const slotY = GPU_Y + kvSlotOffsetY

                if (frac <= 0.001) return [GPU_XS[fromG]!, slotY]
                if (fromG < 3) {
                    const x = GPU_XS[fromG]! + (GPU_XS[toG]! - GPU_XS[fromG]!) * frac
                    return [x, slotY]
                }
                // Wrap around from GPU 3 down to wrapY, across to GPU 0, up into GPU 0
                if (frac < 0.2) {
                    const u = frac / 0.2
                    return [GPU_XS[3]!, slotY + (wrapY - slotY) * u]
                }
                if (frac < 0.8) {
                    const u = (frac - 0.2) / 0.6
                    return [GPU_XS[3]! + (GPU_XS[0]! - GPU_XS[3]!) * u, wrapY]
                }
                const u = (frac - 0.8) / 0.2
                return [GPU_XS[0]!, wrapY + (slotY - wrapY) * u]
            }

            const dynamicLayer = dynamic(() => {
                const nodes: Node[] = []
                const t = ringStep.value
                const fill = progressFill.value
                const stepNum = Math.min(4, Math.floor(t + 0.5) + 1)

                // Step pill banner
                nodes.push(
                    rect(440, 54, {
                        fill: 'surface',
                        stroke: 'teal',
                        width: 2.5,
                        radius: 27,
                    }).at(0, -248),
                    text(`Ring step ${stepNum} / 4 · online softmax`, {
                        size: 26,
                        color: 'teal',
                    }).moveTo([0, -248]),
                )

                // Per-GPU online softmax accumulator progress bar
                for (let g = 0; g < NUM_GPUS; g++) {
                    const gx = GPU_XS[g]!
                    const barW = 246
                    const barY = GPU_Y + 96
                    nodes.push(
                        rect(barW, 18, {
                            fill: 'bg',
                            stroke: 'dim',
                            width: 1.5,
                            radius: 9,
                        }).at(gx, barY),
                        rect(Math.max(12, barW * fill), 18, {
                            fill: 'teal',
                            stroke: null,
                            radius: 9,
                        }).at(gx - barW / 2 + Math.max(12, barW * fill) / 2, barY),
                    )
                }

                // 4 moving KV shards with distinct colors
                for (let k = 0; k < NUM_GPUS; k++) {
                    const [x, y] = kvPosition(k, t)
                    const col = KV_COLORS[k]!
                    nodes.push(
                        rect(180, 64, {
                            fill: 'surface',
                            stroke: col,
                            width: 4,
                            radius: 12,
                        })
                            .at(x, y)
                            .glow(6),
                        text(`KV${k}`, { size: 30, color: col }).moveTo([x, y]),
                    )
                }

                return nodes
            })

            const footer = text(
                'Each GPU merges 1 local + 3 ring KV blocks while hiding ring transfer behind local attention',
                { size: 25, color: 'dim' },
            ).moveTo([0, 365])

            s.add(heading, subtitle, ...staticNodes, dynamicLayer, footer)

            s.caption('Step 1 of 4: each GPU attends its pinned query shard Q_i to its local KV_i shard.')
            s.play(fadeIn(heading, { duration: 0.5 }), fadeIn(subtitle, { duration: 0.5 }))
            s.wait(1.0)

            s.caption('Step 2 of 4: KV shards rotate one hop clockwise while online softmax merges partial outputs.')
            s.play(
                ringStep.to(1, { duration: 1.5, ease: smoother }),
                progressFill.to(0.5, { duration: 1.5, ease: smoother }),
            )
            s.wait(0.8)

            s.caption('Step 3 of 4: another clockwise hop brings every GPU its third KV slice.')
            s.play(
                ringStep.to(2, { duration: 1.5, ease: smoother }),
                progressFill.to(0.75, { duration: 1.5, ease: smoother }),
            )
            s.wait(0.8)

            s.caption('Step 4 of 4: all 4 GPUs finish exact full-sequence attention with zero full-KV replication.')
            s.play(
                ringStep.to(3, { duration: 1.5, ease: smoother }),
                progressFill.to(1.0, { duration: 1.5, ease: smoother }),
            )
            s.wait(1.5)
        },
    )
}


export default createFilm()
