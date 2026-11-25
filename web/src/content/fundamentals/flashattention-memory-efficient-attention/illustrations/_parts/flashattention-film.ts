import {
    assertEqual,
    boxOf,
    chip,
    column,
    connector,
    decimal,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    namedBox,
    place,
    rect,
    row,
    sceneArea,
    sceneKit,
    segmentedBar,
    seq,
    tex,
    text,
    zone,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

// Exact online softmax worked numbers matching tiling_strategy.tsx
const SCORES_A = [1, 2] as const
const VALUES_A = [10, 20] as const
const SCORES_B = [3] as const
const VALUES_B = [40] as const

const M_A = Math.max(...SCORES_A) // 2
const L_A = SCORES_A.reduce((sum, s) => sum + Math.exp(s - M_A), 0) // 1 + exp(-1) = 1.3679
const N_A = SCORES_A.reduce((sum, s, i) => sum + Math.exp(s - M_A) * VALUES_A[i]!, 0) // 23.6788
const O_A = N_A / L_A // 17.3106

const M_NEW = Math.max(M_A, ...SCORES_B) // 3
const ALPHA = Math.exp(M_A - M_NEW) // exp(-1) = 0.3679
const L_SCALED = ALPHA * L_A // 0.5032
const N_SCALED = ALPHA * N_A // 8.7110

const L_B = SCORES_B.reduce((sum, s) => sum + Math.exp(s - M_NEW), 0) // 1.000
const N_B = SCORES_B.reduce((sum, s, i) => sum + Math.exp(s - M_NEW) * VALUES_B[i]!, 0) // 40.000

const L_NEW = L_SCALED + L_B // 1.5032
const N_NEW = N_SCALED + N_B // 48.7110
const O_ONLINE = N_NEW / L_NEW // 32.404513

const ALL_SCORES = [...SCORES_A, ...SCORES_B]
const ALL_VALUES = [...VALUES_A, ...VALUES_B]
const DENSE_EXPS = ALL_SCORES.map((s) => Math.exp(s - M_NEW))
const DENSE_SUM = DENSE_EXPS.reduce((a, b) => a + b, 0)
const O_DENSE =
    DENSE_EXPS.reduce((sum, e, i) => sum + e * ALL_VALUES[i]!, 0) / DENSE_SUM

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(Number(ALPHA.toFixed(3)), 0.368, 'online softmax rescale factor alpha')
    assertEqual(Number(L_A.toFixed(3)), 1.368, 'Tile A normalizer l_A')
    assertEqual(Number(L_NEW.toFixed(3)), 1.503, 'combined normalizer l_new')
    assertEqual(Number(O_ONLINE.toFixed(6)), Number(O_DENSE.toFixed(6)), 'online equals dense output')

    return film(
        {
            title: 'FlashAttention tiling and online softmax',
            description:
                'Contrast O(N^2) HBM round-trips in standard attention with SRAM-tiled FlashAttention and exact online softmax rescaling.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 32,
                heading: { size: 48, align: 'center', y: -474 },
                area: { left: -880, right: 880, top: -375, bottom: 425 },
            })
            const [memArea, rightArea] = kit.area.columns([1.05, 1], 68)
            const [sramArea, , hbmArea] = memArea!.rows([1.25, 0.55, 1.5], 12)
            const [rightTop, rightBottom] = rightArea!.rows([1.45, 1], 36)

            const title = kit.heading('FlashAttention: keep scores in SRAM')
            s.add(title)

            // ── Left Top: Fast On-Chip SRAM ──
            const sramQ = namedBox('Q_i tile', {
                width: 170,
                height: 82,
                color: 'blue',
                sub: 'resident',
            })
            const sramKV = namedBox('K_j, V_j', {
                width: 170,
                height: 82,
                color: 'orange',
                sub: 'streaming',
            })
            const sramS = namedBox('S_ij local', {
                width: 185,
                height: 82,
                color: 'teal',
                sub: 'in SRAM',
            })
            const sramSlots = row([sramQ, sramKV, sramS], { gap: 22 })
            place(sramSlots, sramArea!, 'center')
            const sramZone = zone(sramSlots, {
                title: 'On-Chip SRAM  (tiny, 19 TB/s)',
                color: 'teal',
                padding: 34,
            })

            // ── Left Bottom: Slow GPU HBM ──
            const hbmQ = namedBox('Q', { width: 118, height: 76, color: 'blue' })
            const hbmK = namedBox('K', { width: 118, height: 76, color: 'orange' })
            const hbmV = namedBox('V', { width: 118, height: 76, color: 'purple' })
            const hbmO = namedBox('O', { width: 118, height: 76, color: 'green' })
            const hbmInputs = row([hbmQ, hbmK, hbmV, hbmO], { gap: 20 })

            const hbmS = namedBox('S = QK^T', {
                width: 265,
                height: 76,
                color: 'red',
                sub: 'N x N in HBM',
            })
            const hbmP = namedBox('P = softmax(S)', {
                width: 265,
                height: 76,
                color: 'red',
                sub: 'N x N in HBM',
            })
            const hbmQuadratic = row([hbmS, hbmP], { gap: 24 })
            const hbmContent = column([hbmInputs, hbmQuadratic], { gap: 22 })
            place(hbmContent, hbmArea!, 'center')

            const hbmZone = zone(hbmContent, {
                title: 'GPU HBM (2 TB/s)',
                color: 'dim',
                padding: 34,
            })

            const noQuadraticTag = namedBox('Zero N x N matrices in HBM', {
                width: 554,
                height: 76,
                color: 'green',
                sub: 'Only Q, K, V tiles read and final O_i written',
            }).moveTo(boxOf(hbmQuadratic).point('center'))

            // Connector across the HBM <-> SRAM memory bus
            const busLink = connector(
                [boxOf(hbmZone).cx + 180, boxOf(hbmZone).top],
                [boxOf(sramZone).cx + 180, boxOf(sramZone).bottom],
                {
                    route: 'straight',
                    color: 'dim',
                    width: 4,
                    tip: true,
                },
            )
            const busNote = text('HBM <-> SRAM bus', { size: 26, color: 'dim' }).moveTo([
                boxOf(hbmZone).left + 135,
                (boxOf(hbmZone).top + boxOf(sramZone).bottom) / 2,
            ])

            // ── Right Top (Chapter 1): Standard attention bottleneck panel ──
            const stdPanel = column(
                [
                    text('Standard attention hits the HBM wall', {
                        size: 32,
                        color: 'red',
                    }),
                    text('1. Compute S = QK^T and write N x N to HBM', {
                        size: 26,
                        color: 'ink',
                    }),
                    text('2. Read S, apply softmax, write N x N P to HBM', {
                        size: 26,
                        color: 'ink',
                    }),
                    text('3. Read P and V from HBM to multiply O = P V', {
                        size: 26,
                        color: 'ink',
                    }),
                ],
                { gap: 20 },
            )
            place(stdPanel, rightTop!, 'center')

            // ── Right Bottom: Shared-scale HBM I/O segmented bar ──
            const hbmTraffic = segmentedBar(
                [{ name: 'Q,K', value: 2, color: 'blue' }],
                {
                    width: 760,
                    height: 62,
                    capacity: 8,
                    max: 14,
                    title: 'HBM I/O',
                    free: 'budget',
                    over: 'over',
                    size: 24,
                },
            )
            place(hbmTraffic, rightBottom!, 'center')

            // ── Right Top (Chapters 2-3): Live Online Softmax SRAM State ──
            const mVal = s.value(M_A)
            const lVal = s.value(L_A)
            const nVal = s.value(N_A)
            const oVal = s.value(O_A)
            const showState = s.value(0)
            const showRescale = s.value(0)
            const rescaleT = s.value(0)
            const addTileB = s.value(0)

            const stateBox = rect(rightTop!.width - 12, rightTop!.height - 6, {
                fill: 'surface',
                stroke: 'teal',
                width: 2,
                radius: 14,
            }).at(rightTop!.cx, rightTop!.cy)

            const stateHeader = text('SRAM Online Softmax State', {
                size: 30,
                color: 'teal',
            }).moveTo([rightTop!.cx, rightTop!.top + 38])

            const mReadout = decimal(() => mVal.value, {
                digits: 2,
                prefix: 'm = ',
                size: 30,
                color: 'purple',
            })
            const lReadout = decimal(() => lVal.value, {
                digits: 3,
                prefix: 'l = ',
                size: 30,
                color: 'green',
            })
            const oReadout = decimal(() => oVal.value, {
                digits: 3,
                prefix: 'O = ',
                size: 30,
                color: 'yellow',
            })
            const readoutRow = row([mReadout, lReadout, oReadout], { gap: 40 })
            place(
                readoutRow,
                sceneArea({
                    left: rightTop!.left,
                    right: rightTop!.right,
                    top: rightTop!.top + 70,
                    bottom: rightTop!.top + 124,
                }),
                'center',
            )

            const alphaEq = tex(
                '\\alpha = e^{m_{\\text{old}} - m_{\\text{new}}} = e^{2 - 3} = 0.368',
                { size: 34, color: 'purple' },
            ).moveTo([rightTop!.cx, rightTop!.top + 162])

            // Dynamic bar rails showing l and N visibly shrinking by alpha = 0.368 then adding Tile B
            const BAR_LEFT = rightTop!.left + 162
            const BAR_MAX_W = 445
            const L_RAIL_Y = rightTop!.top + 236
            const N_RAIL_Y = rightTop!.top + 318
            const BAR_H = 34

            const dynamicRails = dynamic(() => {
                if (showState.value < 0.05) return []
                const op = showState.value
                const scaleFactor = 1 + (ALPHA - 1) * rescaleT.value
                const addB = addTileB.value

                const lPrevW = (L_A * scaleFactor / L_NEW) * BAR_MAX_W
                const lBW = (L_B * addB / L_NEW) * BAR_MAX_W

                const nPrevW = (N_A * scaleFactor / N_NEW) * BAR_MAX_W
                const nBW = (N_B * addB / N_NEW) * BAR_MAX_W

                const lCur = L_A * scaleFactor + L_B * addB
                const nCur = N_A * scaleFactor + N_B * addB

                const nodes = [
                    // l rail
                    text('denom l', { font: 'mono', size: 26, color: 'green' })
                        .moveTo([rightTop!.left + 84, L_RAIL_Y])
                        .opacity(op),
                    rect(Math.max(4, lPrevW), BAR_H, {
                        fill: 'green',
                        stroke: null,
                        radius: 6,
                    })
                        .at(BAR_LEFT + Math.max(4, lPrevW) / 2, L_RAIL_Y)
                        .opacity(0.85 * op),
                    text(lCur.toFixed(3), { font: 'mono', size: 26, color: 'ink' })
                        .moveTo([BAR_LEFT + BAR_MAX_W + 68, L_RAIL_Y])
                        .opacity(op),

                    // N rail
                    text('num N', { font: 'mono', size: 26, color: 'blue' })
                        .moveTo([rightTop!.left + 84, N_RAIL_Y])
                        .opacity(op),
                    rect(Math.max(4, nPrevW), BAR_H, {
                        fill: 'blue',
                        stroke: null,
                        radius: 6,
                    })
                        .at(BAR_LEFT + Math.max(4, nPrevW) / 2, N_RAIL_Y)
                        .opacity(0.85 * op),
                    text(nCur.toFixed(2), { font: 'mono', size: 26, color: 'ink' })
                        .moveTo([BAR_LEFT + BAR_MAX_W + 68, N_RAIL_Y])
                        .opacity(op),
                ]

                if (lBW > 2) {
                    nodes.push(
                        rect(lBW, BAR_H, { fill: 'orange', stroke: null, radius: 6 })
                            .at(BAR_LEFT + lPrevW + lBW / 2, L_RAIL_Y)
                            .opacity(0.9 * op),
                    )
                }
                if (nBW > 2) {
                    nodes.push(
                        rect(nBW, BAR_H, { fill: 'orange', stroke: null, radius: 6 })
                            .at(BAR_LEFT + nPrevW + nBW / 2, N_RAIL_Y)
                            .opacity(0.9 * op),
                    )
                }

                if (showRescale.value > 0.05) {
                    nodes.push(
                        text('Dense softmax ref: 32.405 (exact match)', {
                            size: 26,
                            color: 'green',
                        })
                            .moveTo([rightTop!.cx, rightTop!.bottom - 34])
                            .opacity(showRescale.value),
                    )
                }
                return nodes
            })

            const flashHbmTraffic = segmentedBar(
                [{ name: 'Q_i', value: 1, color: 'blue' }],
                {
                    width: 760,
                    height: 62,
                    capacity: 8,
                    max: 14,
                    title: 'Flash HBM I/O',
                    free: 'saved',
                    size: 24,
                },
            )
            place(flashHbmTraffic, rightBottom!, 'center')

            // ── Chapter 1: Standard Attention Bottleneck ──
            s.chapter('Standard attention: O(N^2) HBM traffic')
            s.add(sramZone, hbmZone, busLink, busNote, stdPanel, hbmTraffic)
            s.play(
                fadeIn([sramZone, hbmZone, busLink, busNote, stdPanel]),
                hbmTraffic.enter(),
                { duration: 1.2 },
            )
            s.caption(
                'Standard attention computes the full N by N score matrix S and writes it across the slow HBM bus.',
                4.2,
            )
            s.play(
                busLink.send(chip('S (N x N)', { color: 'red', anchor: 'center' }), {
                    reverse: true,
                    duration: 1.0,
                }),
                hbmTraffic.insert({ name: 'S write', value: 4, color: 'red' }),
                { duration: 1.2 },
            )
            s.play(
                busLink.send(chip('P (N x N)', { color: 'red', anchor: 'center' }), {
                    reverse: true,
                    duration: 1.0,
                }),
                hbmTraffic.insert({ name: 'P rw', value: 5, color: 'red' }),
                { duration: 1.2 },
            )
            s.play(
                hbmTraffic.insert({ name: 'V,O', value: 2, color: 'purple' }),
                { duration: 0.8 },
            )
            s.caption(
                'Materializing S and P in HBM swamps memory bandwidth with O(N^2) traffic while tensor cores wait idle.',
                4.2,
            )
            s.wait(3.0)

            // ── Chapter 2: FlashAttention Streams Tiles in SRAM ──
            s.chapter('FlashAttention: stream tiles in SRAM')
            s.play(
                seq(fadeOut(hbmQuadratic), fadeIn(noQuadraticTag)),
                seq(fadeOut(stdPanel), fadeIn([stateBox, stateHeader, readoutRow])),
                seq(fadeOut(hbmTraffic), fadeIn(flashHbmTraffic)),
                { duration: 1.2 },
            )
            s.add(dynamicRails)

            // Stream Tile A into SRAM
            s.play(
                busLink.send(chip('Tile A (K,V)', { color: 'blue', anchor: 'center' }), {
                    duration: 1.1,
                }),
                flashHbmTraffic.insert({ name: 'K_A,V_A', value: 1, color: 'orange' }),
                showState.to(1),
                { duration: 1.3 },
            )
            s.caption(
                'FlashAttention keeps Q_i in SRAM and streams Tile A (s = [1, 2], v = [10, 20]): m = 2.00, l = 1.368, O = 17.311.',
                4.8,
            )
            s.wait(3.6)

            // Stream Tile B into SRAM
            s.play(
                busLink.send(chip('Tile B (K,V)', { color: 'orange', anchor: 'center' }), {
                    duration: 1.1,
                }),
                flashHbmTraffic.insert({ name: 'K_B,V_B', value: 1, color: 'orange' }),
                { duration: 1.3 },
            )

            // ── Chapter 3: Online Softmax Rescaling ──
            s.chapter('Online softmax rescales in place')
            s.play(fadeIn(alphaEq), mVal.to(M_NEW), { duration: 1.0 })
            s.caption(
                'Tile B raises the running max from 2 to 3. Multiply the old denominator and numerator by alpha = exp(-1) = 0.368.',
                4.6,
            )
            s.play(
                rescaleT.to(1),
                lVal.to(L_SCALED),
                nVal.to(N_SCALED),
                { duration: 1.8 },
            )
            s.wait(1.6)

            // Add Tile B contribution and write ONLY O_i back to HBM
            s.play(
                addTileB.to(1),
                lVal.to(L_NEW),
                nVal.to(N_NEW),
                oVal.to(O_ONLINE),
                showRescale.to(1),
                { duration: 1.6 },
            )
            s.play(
                busLink.send(chip('O_i = 32.405', { color: 'green', anchor: 'center' }), {
                    reverse: true,
                    duration: 1.0,
                }),
                flashHbmTraffic.insert({ name: 'O_i', value: 1, color: 'green' }),
                { duration: 1.2 },
            )
            s.caption(
                'Adding Tile B gives O = 48.711 / 1.503 = 32.405, matching dense softmax exactly while writing zero N by N matrices to HBM.',
                5.2,
            )
            s.wait(4.2)
        },
    )
}
