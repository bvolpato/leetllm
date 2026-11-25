import {
    assertEqual,
    dynamic,
    film,
    rect,
    sceneKit,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

export function createFilm(theme: ThemeMode = 'dark') {
    const arSeq = ['write', 'unit', 'tests', 'first']
    const diffRounds: readonly (readonly string[])[] = [
        ['[M]', '[M]', '[M]', '[M]'],
        ['write', '[M]', '[M]', 'later'],
        ['write', 'unit', '[M]', 'first'],
        ['write', 'unit', 'tests', 'first'],
    ]
    assertEqual(arSeq.length, 4)
    assertEqual(diffRounds.length, 4)

    return film(
        {
            title: 'Autoregressive decoding vs. discrete text diffusion',
            description:
                'Watch left-to-right causal generation emit one token per pass while discrete text diffusion unmasks tokens in parallel and revises earlier choices bidirectionally.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 40,
                heading: { size: 52, align: 'center' },
                area: { top: -350, bottom: 390 },
            })
            const heading = kit.heading('Autoregressive Decoding vs. Discrete Text Diffusion')
            const [leftCol, rightCol] = kit.area.columns([1, 1], 68)

            const arStep = s.value(0) // 0..4
            const diffRound = s.value(0) // 0..3

            const leftTitle = text('Autoregressive (Causal L → R)', {
                size: 36,
                color: 'blue',
            }).at(leftCol!.cx, leftCol!.top + 28)
            const leftSub = text('1 token per pass · cannot revise past', {
                size: 24,
                color: 'dim',
            }).at(leftCol!.cx, leftCol!.top + 74)

            const rightTitle = text('Discrete Diffusion (Bidirectional)', {
                size: 36,
                color: 'purple',
            }).at(rightCol!.cx, rightCol!.top + 28)
            const rightSub = text('parallel unmasking · bidirectional revision', {
                size: 24,
                color: 'dim',
            }).at(rightCol!.cx, rightCol!.top + 74)

            const slotW = 152
            const slotH = 96
            const gap = 18
            const totalW = 4 * slotW + 3 * gap
            const tileY = leftCol!.cy - 10

            const arBoard = dynamic(() => {
                const k = Math.floor(arStep.value + 0.01)
                const nodes: Node[] = []
                const x0 = leftCol!.cx - totalW / 2
                for (let i = 0; i < 4; i++) {
                    const cx = x0 + i * (slotW + gap) + slotW / 2
                    const filled = i < k
                    const isLatest = i === k - 1
                    const tok = filled ? arSeq[i]! : '·'
                    nodes.push(
                        rect(slotW, slotH, {
                            fill: 'surface',
                            stroke: isLatest ? 'green' : filled ? 'blue' : 'gridStrong',
                            width: isLatest ? 3.5 : 2,
                            radius: 14,
                        }).at(cx, tileY),
                        text(tok, {
                            size: 34,
                            color: isLatest ? 'green' : filled ? 'ink' : 'dim',
                        }).at(cx, tileY),
                    )
                }
                nodes.push(
                    text(`Forward pass: ${k} / 4`, { size: 30, color: 'blue' }).at(
                        leftCol!.cx,
                        tileY + 126,
                    ),
                )
                return nodes
            })

            const diffBoard = dynamic(() => {
                const r = Math.min(3, Math.floor(diffRound.value + 0.01))
                const prev = r > 0 ? diffRounds[r - 1]! : diffRounds[0]!
                const curr = diffRounds[r]!
                const nodes: Node[] = []
                const x0 = rightCol!.cx - totalW / 2
                for (let i = 0; i < 4; i++) {
                    const cx = x0 + i * (slotW + gap) + slotW / 2
                    const tok = curr[i]!
                    const isMask = tok === '[M]'
                    const isRevised = r === 2 && i === 3
                    const isNew = !isMask && r > 0 && prev[i] === '[M]'
                    const stroke = isRevised
                        ? 'orange'
                        : isNew
                          ? 'green'
                          : isMask
                            ? 'gridStrong'
                            : 'purple'
                    const color = isRevised ? 'orange' : isNew ? 'green' : isMask ? 'dim' : 'ink'
                    nodes.push(
                        rect(slotW, slotH, {
                            fill: 'surface',
                            stroke,
                            width: isRevised || isNew ? 3.5 : 2,
                            radius: 14,
                        }).at(cx, tileY),
                        text(tok, { size: 34, color }).at(cx, tileY),
                    )
                }
                const status =
                    r === 2
                        ? 'Round 2 / 3 · revised "later" → "first"!'
                        : `Refinement round: ${r} / 3`
                nodes.push(
                    text(status, {
                        size: 30,
                        color: r === 2 ? 'orange' : 'purple',
                    }).at(rightCol!.cx, tileY + 126),
                )
                return nodes
            })

            // ─── Chapter 1: Initial State ────────────────────────────────
            s.chapter('Initialize sequence')
            s.add(heading, leftTitle, leftSub, rightTitle, rightSub, arBoard, diffBoard)
            s.caption(
                'Autoregressive starts with an empty prefix; discrete diffusion begins with a full masked canvas.',
                3.0,
            )
            s.wait(2.2)

            // ─── Chapter 2: Step 1 / Round 1 ─────────────────────────────
            s.chapter('Parallel unmasking vs sequential step')
            s.caption(
                'Pass 1: AR emits only "write". Diffusion unmasks "write" and "later" simultaneously across the canvas.',
                3.8,
            )
            s.play(arStep.to(1), diffRound.to(1), { duration: 0.7 })
            s.wait(2.6)

            // ─── Chapter 3: Step 2 / Round 2 (Bidirectional Revision!) ───
            s.chapter('Bidirectional revision')
            s.caption(
                'Pass 2: Diffusion fills "unit" and revises slot 4 from "later" to "first" once surrounding context clarifies.',
                4.2,
            )
            s.play(arStep.to(2), diffRound.to(2), { duration: 0.85 })
            s.wait(3.1)

            // ─── Chapter 4: Finish in 3 Rounds vs 4 Steps ────────────────
            s.chapter('Converge in fewer rounds')
            s.caption(
                'Round 3 completes the diffusion canvas while autoregressive still needs a fourth sequential pass.',
                4.2,
            )
            s.play(arStep.to(3), diffRound.to(3), { duration: 0.7 })
            s.wait(1.6)
            s.play(arStep.to(4), { duration: 0.6 })
            s.wait(2.4)
        },
    )
}

export default createFilm()
