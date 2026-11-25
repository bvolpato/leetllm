import {
    arrow,
    assertEqual,
    dynamic,
    fadeIn,
    film,
    place,
    rect,
    sceneArea,
    smoother,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const SKY = '#58a6e8'
const CLOUD = '#c4e0f8'
const SIGN_RED = '#dc3838'
const SIGN_TXT = '#f5f5f5'
const LEAF = '#40985c'
const ROAD = '#3a424e'
const STRIPE = '#e8c448'

const RGB_GRID: readonly (readonly string[])[] = [
    [SKY, CLOUD, SIGN_RED, SIGN_TXT],
    [SKY, SKY, SIGN_TXT, SIGN_RED],
    [LEAF, LEAF, ROAD, STRIPE],
    [ROAD, ROAD, ROAD, ROAD],
]

const Z0: readonly (readonly number[])[] = [
    [0.5, -0.2, 0.4],
    [0.6, 0.8, -0.4],
    [0.3, 0.5, 0.8],
    [0.7, -0.4, 0.2],
]

const PATCH_META = [
    { name: 'P1', label: 'Sky', r0: 0, c0: 0, color: 'blue' },
    { name: 'P2', label: 'Sign', r0: 0, c0: 2, color: 'red' },
    { name: 'P3', label: 'Leaf', r0: 2, c0: 0, color: 'teal' },
    { name: 'P4', label: 'Road', r0: 2, c0: 2, color: 'orange' },
] as const

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(RGB_GRID.length, 4, '4x4 RGB crop rows')
    assertEqual(Z0.length, 4, '4 patch token vectors')
    assertEqual(Z0[1]![1], 0.8, 'Sign patch P2 feature d1')

    return film(
        {
            title: 'ViT Patchify, Flatten, Linear Projection & [CLS]',
            description:
                'A 4x4 RGB street scene explodes into four 2x2 patches, flattens each patch into a vector, projects linearly into token matrix Z0, and prepends the learnable [CLS] token.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const titleArea = sceneArea({ left: -860, right: 860, top: -480, bottom: -395 })
            const subArea = sceneArea({ left: -860, right: 860, top: -392, bottom: -332 })
            const heading = place(
                text('Vision Transformer Patch Embedding', { size: 52, color: 'ink' }),
                titleArea,
                'center',
            )
            const subtitle = place(
                text('Slice 4×4 RGB crop into 2×2 patches, flatten, project into Z₀, prepend [CLS]', {
                    size: 27,
                    color: 'dim',
                }),
                subArea,
                'center',
            )

            // Animation states
            const explode = s.value(0)
            const showFlat = s.value(0)
            const showZ0 = s.value(0)
            const showCls = s.value(0)

            // Stage columns
            const imgCX = -610
            const imgCY = 10
            const flatX = -100
            const z0X = 520

            const headers = [
                text('1. RGB crop (4×4)', { size: 28, color: 'blue' }).moveTo([imgCX, -270]),
                text('2. Exploded 2×2 patches', { size: 28, color: 'teal' }).moveTo([flatX, -270]),
                text('3. Token matrix Z₀ + [CLS]', { size: 28, color: 'purple' }).moveTo([
                    z0X,
                    -270,
                ]),
            ]

            const stageLayer = dynamic(() => {
                const nodes: Node[] = []
                const ex = explode.value
                const fl = showFlat.value
                const z0 = showZ0.value
                const cls = showCls.value

                // Stage 1: 4x4 RGB pixels exploding smoothly into 4 quadrants
                const cell = 72
                const quadSpread = 24 * ex
                for (let r = 0; r < 4; r++) {
                    for (let col = 0; col < 4; col++) {
                        const qr = r < 2 ? -1 : 1
                        const qc = col < 2 ? -1 : 1
                        const px = imgCX + (col - 1.5) * (cell + 2) + qc * quadSpread
                        const py = imgCY + (r - 1.5) * (cell + 2) + qr * quadSpread
                        nodes.push(
                            rect(cell, cell, {
                                fill: RGB_GRID[r]![col]!,
                                stroke: 'bg',
                                width: 2.5,
                                radius: 6,
                            }).at(px, py),
                        )
                    }
                }

                // Quadrant borders fade in once exploded
                if (ex > 0.15) {
                    const bOp = Math.min(1, (ex - 0.15) * 1.4)
                    const qSpan = 2 * cell + 6
                    PATCH_META.forEach((p) => {
                        const qr = p.r0 === 0 ? -1 : 1
                        const qc = p.c0 === 0 ? -1 : 1
                        const qx = imgCX + qc * (cell + 2 + quadSpread)
                        const qy = imgCY + qr * (cell + 2 + quadSpread)
                        nodes.push(
                            rect(qSpan + 8, qSpan + 8, {
                                fill: null,
                                stroke: p.color,
                                width: 4,
                                radius: 10,
                            })
                                .at(qx, qy)
                                .opacity(bOp),
                        )
                    })
                }

                nodes.push(
                    text('H × W × 3', { size: 26, color: 'dim' }).moveTo([imgCX, 240]),
                )

                // Stage 2: 4 flattened 4-pixel patch strips (P1..P4)
                const rowYs = [-115, -10, 95, 200] as const
                if (fl > 0.01) {
                    nodes.push(
                        arrow([imgCX + 204, imgCY], [flatX - 224, imgCY], {
                            stroke: 'teal',
                            width: 4.5,
                            tip: 15,
                        }).opacity(fl),
                    )
                    PATCH_META.forEach((p, idx) => {
                        const ry = rowYs[idx]!
                        const stripColors = [
                            RGB_GRID[p.r0]![p.c0]!,
                            RGB_GRID[p.r0]![p.c0 + 1]!,
                            RGB_GRID[p.r0 + 1]![p.c0]!,
                            RGB_GRID[p.r0 + 1]![p.c0 + 1]!,
                        ]
                        nodes.push(
                            text(p.name, { size: 26, color: p.color })
                                .moveTo([flatX - 182, ry])
                                .opacity(fl),
                        )
                        const sw = 54
                        const sg = 6
                        stripColors.forEach((hex, j) => {
                            const sx = flatX - 110 + j * (sw + sg)
                            nodes.push(
                                rect(sw, sw, {
                                    fill: hex,
                                    stroke: p.color,
                                    width: 3,
                                    radius: 6,
                                })
                                    .at(sx, ry)
                                    .opacity(fl),
                            )
                        })
                        nodes.push(
                            text(p.label, { size: 24, color: 'dim' })
                                .moveTo([flatX + 150, ry])
                                .opacity(fl),
                        )
                    })
                    nodes.push(
                        text('4 × (2×2×3) flattened', { size: 25, color: 'dim' })
                            .moveTo([flatX, 285])
                            .opacity(fl),
                    )
                }

                // Stage 3: Linear projection into Z_0 (4x3) + [CLS] row prepended on top
                if (z0 > 0.01) {
                    nodes.push(
                        arrow([flatX + 206, imgCY], [z0X - 248, imgCY], {
                            stroke: 'purple',
                            width: 4.5,
                            tip: 15,
                        }).opacity(z0),
                        text('Linear W_E', { size: 24, color: 'purple' })
                            .moveTo([(flatX + 206 + z0X - 248) / 2, imgCY - 32])
                            .opacity(z0),
                    )

                    const colXs = [z0X - 108, z0X + 12, z0X + 132] as const
                    const colLabels = ['d0', 'd1', 'd2'] as const
                    colLabels.forEach((cl, j) => {
                        nodes.push(
                            text(cl, { size: 24, color: 'dim' })
                                .moveTo([colXs[j]!, -244])
                                .opacity(z0),
                        )
                    })

                    // Optional [CLS] row sliding horizontally into slot above P1 (at y = -182)
                    if (cls > 0.01) {
                        const clsY = -182
                        const clsShift = (1 - cls) * 84
                        nodes.push(
                            text('[CLS]', { size: 25, color: 'purple' })
                                .moveTo([z0X - 210 + clsShift, clsY])
                                .opacity(cls),
                            rect(354, 52, {
                                fill: 'surface',
                                stroke: 'purple',
                                width: 3.5,
                                radius: 10,
                            })
                                .at(z0X + 12 + clsShift, clsY)
                                .opacity(cls)
                                .glow(6),
                            text('learnable class token', { size: 24, color: 'purple' })
                                .moveTo([z0X + 12 + clsShift, clsY])
                                .opacity(cls),
                        )
                    }

                    // 4 projected rows P1..P4
                    Z0.forEach((rowVals, i) => {
                        const p = PATCH_META[i]!
                        const ry = rowYs[i]! + 20 * cls
                        const isSign = i === 1
                        nodes.push(
                            text(p.name, { size: 25, color: isSign ? 'red' : 'dim' })
                                .moveTo([z0X - 210, ry])
                                .opacity(z0),
                        )
                        rowVals.forEach((val, j) => {
                            const cx = colXs[j]!
                            nodes.push(
                                rect(110, 62, {
                                    fill: 'surface',
                                    stroke: isSign ? 'red' : val >= 0 ? 'blue' : 'orange',
                                    width: isSign ? 3.5 : 2.2,
                                    radius: 8,
                                })
                                    .at(cx, ry)
                                    .opacity(z0),
                                text(val.toFixed(2), {
                                    size: 26,
                                    color: isSign ? 'red' : 'ink',
                                })
                                    .moveTo([cx, ry])
                                    .opacity(z0),
                            )
                        })
                    })
                }

                return nodes
            })

            const footer = text(
                'Each 2×2 patch becomes one token vector; prepending [CLS] yields a (5 × D) Transformer input',
                { size: 25, color: 'dim' },
            ).moveTo([0, 395])

            s.add(heading, subtitle, ...headers, stageLayer, footer)

            s.caption('A 4x4 RGB street scene enters the Vision Transformer patch embedder.')
            s.play(fadeIn(heading, { duration: 0.5 }), fadeIn(subtitle, { duration: 0.5 }))
            s.wait(0.6)

            s.caption('Slice the image into four non-overlapping 2x2 patches (sky, red sign, foliage, road).')
            s.play(explode.to(1, { duration: 1.4, ease: smoother }))
            s.wait(0.6)

            s.caption('Flatten each 2x2x3 patch into a 1D vector in row-major order.')
            s.play(showFlat.to(1, { duration: 1.3, ease: smoother }))
            s.wait(0.6)

            s.caption('Project all four patch vectors linearly via W_E into token matrix Z_0.')
            s.play(showZ0.to(1, { duration: 1.3, ease: smoother }))
            s.wait(0.6)

            s.caption('Prepend the learnable [CLS] token to form the final encoder sequence.')
            s.play(showCls.to(1, { duration: 1.2, ease: smoother }))
            s.wait(1.5)
        },
    )
}


export default createFilm()
