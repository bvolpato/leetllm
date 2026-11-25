import {
    arrow,
    assertEqual,
    column,
    dot,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    indicate,
    line,
    place,
    rect,
    sceneKit,
    seq,
    smoother,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const SCALE_INIT = 1024
const SCALE_HALF = 512
const FP16_MAX = 65504
const FP16_SUB_MIN = 2 ** -24
const FP16_NORM_MIN = 2 ** -14

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(Number((1.2e-8 * SCALE_INIT).toExponential(2)), 1.23e-5, 'tiny grad scaled')
    assertEqual(100 * SCALE_INIT > FP16_MAX, true, 'spike overflows FP16 at S=1024')
    assertEqual(100 * SCALE_HALF < FP16_MAX, true, 'spike fits at S=512')

    return film(
        {
            title: 'Dynamic loss scaling: lift tiny gradients, skip overflow spikes',
            description:
                'GradScaler multiplies loss by S=1024 to rescue tiny gradients from FP16 underflow, skips the entire optimizer step and halves S to 512 on an Inf spike, then doubles S back after clean steps.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 30,
                heading: { size: 46, align: 'center' },
                area: { left: -880, right: 880, top: -375, bottom: 420 },
            })

            const [, footerArea] = kit.area.rows([3.0, 0.9], 22)
            const title = kit.heading('Dynamic loss scaling: lift tiny gradients, skip overflow')

            // Log10 axis mapping from 1e-9 to 1e6
            const axLeft = -760
            const axRight = 760
            const mapX = (v: number) => axLeft + ((Math.log10(v) + 9) / 15) * (axRight - axLeft)
            const yBandTop = -235
            const yBandBot = 0
            const yAxis = 10

            // Shaded FP16 representable range (subnormal + normal unified to avoid seam crowding)
            const subX0 = mapX(FP16_SUB_MIN)
            const normX0 = mapX(FP16_NORM_MIN)
            const maxX = mapX(FP16_MAX)

            const fp16Band = rect(maxX - subX0, yBandBot - yBandTop, {
                fill: 'blue',
                stroke: null,
                opacity: 0.16,
                radius: 4,
            }).at((subX0 + maxX) / 2, (yBandTop + yBandBot) / 2)

            const ceilLine = line([maxX, yBandTop - 16], [maxX, yAxis], {
                stroke: 'red',
                width: 4,
                dash: [10, 6],
            })
            const ceilLabel = text('FP16 max 65,504', { size: 24, color: 'red' }).moveTo([
                maxX - 18,
                yBandTop - 32,
            ])
            const fp16ZoneLbl = text('FP16 representable range', {
                size: 24,
                color: 'blue',
            }).moveTo([(normX0 + maxX) / 2 - 40, yBandTop - 32])
            const underflowLbl = text('Underflows to 0', { size: 24, color: 'dim' }).moveTo([
                (axLeft + subX0) / 2,
                yBandTop - 32,
            ])

            const axisLine = line([axLeft, yAxis], [axRight, yAxis], { stroke: 'dim', width: 2.5 })
            const ticks = [-9, -6, -3, 0, 3, 6].flatMap((p) => {
                const tx = mapX(10 ** p)
                return [
                    line([tx, yAxis], [tx, yAxis + 12], { stroke: 'dim', width: 2 }),
                    text(`1e${p}`, { font: 'mono', size: 24, color: 'dim' }).moveTo([tx, yAxis + 36]),
                ]
            })

            // Animated gradient shift tracks
            const yTiny = -172
            const yQuiet = -98
            const ySpike = -24

            const scaleShiftT = s.value(0)
            const spikeBackoffT = s.value(0)
            const showSpike = s.value(0)

            const dynamicGrads = dynamic(() => {
                const nodes: Node[] = []
                const t = scaleShiftT.value
                const bt = spikeBackoffT.value
                const sp = showSpike.value

                // Tiny gradient: 1.2e-8 -> 1.23e-5 (saved as FP16 subnormal!)
                const tx0 = mapX(1.2e-8)
                const tx1 = mapX(1.2e-8 * SCALE_INIT)
                const txCur = tx0 + (tx1 - tx0) * t
                nodes.push(
                    text('Tiny', { size: 24, color: 'green' }).moveTo([axLeft - 56, yTiny]),
                    dot(10, 'green').at(tx0, yTiny).opacity(0.45),
                    dot(12, 'green').at(txCur, yTiny),
                )
                if (t > 0.05) {
                    nodes.push(
                        arrow([tx0 + 12, yTiny], [txCur - 12, yTiny], {
                            stroke: 'green',
                            width: 4,
                            tip: 14,
                        }),
                    )
                }
                nodes.push(
                    text(t < 0.5 ? '1.2e-8' : '1.23e-5 (saved)', {
                        font: 'mono',
                        size: 24,
                        color: 'green',
                    }).moveTo([t < 0.5 ? tx0 : tx1 + 140, yTiny - 28]),
                )

                // Quiet gradient: 0.02 -> 20.5
                const qx0 = mapX(0.02)
                const qx1 = mapX(0.02 * SCALE_INIT)
                const qxCur = qx0 + (qx1 - qx0) * t
                nodes.push(
                    text('Quiet', { size: 24, color: 'blue' }).moveTo([axLeft - 56, yQuiet]),
                    dot(10, 'blue').at(qx0, yQuiet).opacity(0.45),
                    dot(12, 'blue').at(qxCur, yQuiet),
                )
                if (t > 0.05) {
                    nodes.push(
                        arrow([qx0 + 12, yQuiet], [qxCur - 12, yQuiet], {
                            stroke: 'blue',
                            width: 4,
                            tip: 14,
                        }),
                    )
                }
                nodes.push(
                    text(t < 0.5 ? '0.02' : '20.5 (finite)', {
                        font: 'mono',
                        size: 24,
                        color: 'blue',
                    }).moveTo([t < 0.5 ? qx0 : qx1 + 110, yQuiet - 28]),
                )

                // Spike gradient: 100 -> 102,400 (Inf!) -> halves scale S=512 -> 51,200 (fits!)
                if (sp > 0.01) {
                    const sx0 = mapX(100)
                    const sxInf = mapX(102400)
                    const sxSafe = mapX(51200)
                    const sxCur = sxInf + (sxSafe - sxInf) * bt
                    const col = bt > 0.65 ? 'yellow' : 'red'
                    nodes.push(
                        text('Spike', { size: 24, color: col })
                            .moveTo([axLeft - 56, ySpike])
                            .opacity(sp),
                        dot(10, col).at(sx0, ySpike).opacity(sp * 0.45),
                        arrow([sx0 + 12, ySpike], [sxCur - 12, ySpike], {
                            stroke: col,
                            width: 4,
                            tip: 14,
                            opacity: sp,
                        }),
                        dot(13, col).at(sxCur, ySpike).opacity(sp),
                        text(bt < 0.5 ? '102,400 → Inf!' : 'S=512 → 51,200', {
                            font: 'mono',
                            size: 24,
                            color: col,
                        })
                            .moveTo([maxX - 185, ySpike - 30])
                            .opacity(sp),
                    )
                }

                return nodes
            })

            // Controller state badges row (y = 140)
            const yCtrl = 140
            const stepData = [
                { batch: '1 · quiet', scale: 'S = 1024', act: 'UPDATE', col: 'green' as const, x: -570 },
                { batch: '2 · spike', scale: 'S = 1024 → 512', act: 'SKIP STEP', col: 'red' as const, x: -190 },
                { batch: '3 · quiet', scale: 'S = 512 (clean 1)', act: 'UPDATE', col: 'blue' as const, x: 190 },
                { batch: '4 · quiet', scale: 'S = 512 → 1024', act: 'RECOVER', col: 'purple' as const, x: 570 },
            ]
            const stepCards = stepData.map((st) => {
                const bg = rect(340, 114, {
                    fill: 'surface',
                    stroke: st.col,
                    width: 3,
                    radius: 12,
                }).at(st.x, yCtrl)
                const l1 = text(st.batch, { size: 26, color: 'ink' }).moveTo([st.x, yCtrl - 32])
                const l2 = text(st.scale, { font: 'mono', size: 24, color: 'dim' }).moveTo([
                    st.x,
                    yCtrl + 2,
                ])
                const l3 = text(st.act, { font: 'mono', size: 24, color: st.col }).moveTo([
                    st.x,
                    yCtrl + 36,
                ])
                return { bg, l1, l2, l3, col: st.col }
            })

            // Footer
            const footerBg = rect(footerArea!.width, footerArea!.height, {
                fill: 'surface',
                stroke: 'grid',
                width: 2,
                radius: 16,
            }).at(footerArea!.cx, footerArea!.cy)

            const foot1 = place(
                column(
                    [
                        text('Step 1: Scale loss by S = 1024 before backward()', {
                            size: 30,
                            color: 'green',
                        }),
                        text('Tiny gradients (1.2e-8) shift right into FP16 subnormals instead of flushing to zero.', {
                            size: 25,
                            color: 'dim',
                        }),
                    ],
                    { gap: 10, align: 'center' },
                ),
                footerArea!,
                'center',
            )
            const foot2 = place(
                column(
                    [
                        text('Step 2: Overflow spike crosses 65,504 → Inf detected', {
                            size: 30,
                            color: 'red',
                        }),
                        text('GradScaler skips AdamW completely (weights & moments untouched) and halves S to 512.', {
                            size: 25,
                            color: 'ink',
                        }),
                    ],
                    { gap: 10, align: 'center' },
                ),
                footerArea!,
                'center',
            )
            const foot3 = place(
                column(
                    [
                        text('Step 3: Clean steps advance AdamW and restore S = 1024', {
                            size: 30,
                            color: 'purple',
                        }),
                        text('After consecutive finite steps, the controller grows S back to keep tiny gradients alive.', {
                            size: 25,
                            color: 'dim',
                        }),
                    ],
                    { gap: 10, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            // Chapter 1: Multiply by 1024 rescues tiny gradient
            s.chapter('Scale by 1024 to rescue tiny gradients')
            s.add(
                title,
                fp16Band,
                ceilLine,
                ceilLabel,
                fp16ZoneLbl,
                underflowLbl,
                axisLine,
                ...ticks,
                dynamicGrads,
                footerBg,
                foot1,
            )
            s.wait(0.8)
            s.play(scaleShiftT.to(1, { ease: smoother }), { duration: 1.6 })
            s.play(fadeIn([stepCards[0]!.bg, stepCards[0]!.l1, stepCards[0]!.l2, stepCards[0]!.l3]), {
                duration: 0.6,
            })
            s.caption(
                'Multiplying loss by 1024 shifts tiny 1.2e-8 gradients right into FP16 range so the first clean batch updates normally.',
                4.8,
            )
            s.wait(1.6)

            // Chapter 2: Spike overflows 65504 -> skip + halve S
            s.chapter('Skip optimizer step and halve S on Inf')
            s.play(
                showSpike.to(1, { ease: smoother }),
                seq(fadeOut(foot1), fadeIn(foot2)),
                { duration: 1.1 },
            )
            s.play(
                fadeIn([stepCards[1]!.bg, stepCards[1]!.l1, stepCards[1]!.l2, stepCards[1]!.l3]),
                indicate([stepCards[1]!.bg, stepCards[1]!.l3], { color: 'red', scale: 1.05 }),
                { duration: 0.9 },
            )
            s.caption(
                'A gradient spike of 100 scales past 65,504 to Inf. GradScaler skips the optimizer update and halves S to 512.',
                5.0,
            )
            s.wait(1.6)

            // Chapter 3: Backoff brings gradients safe, clean steps recover scale
            s.chapter('Recover scale after clean steps')
            s.play(spikeBackoffT.to(1, { ease: smoother }), { duration: 1.2 })
            s.play(
                seq(fadeOut(foot2), fadeIn(foot3)),
                fadeIn([stepCards[2]!.bg, stepCards[2]!.l1, stepCards[2]!.l2, stepCards[2]!.l3]),
                { duration: 0.8 },
            )
            s.play(
                fadeIn([stepCards[3]!.bg, stepCards[3]!.l1, stepCards[3]!.l2, stepCards[3]!.l3]),
                indicate([stepCards[3]!.bg, stepCards[3]!.l3], { color: 'purple', scale: 1.05 }),
                { duration: 0.9 },
            )
            s.caption(
                'At S = 512, two consecutive finite steps advance AdamW and trigger growth back to S = 1024.',
                4.8,
            )
            s.wait(3.0)
        },
    )
}

export default createFilm()
