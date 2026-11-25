import {
    arrow,
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
    const turns = [
        {
            turn: 1,
            action: 'evaluate(baseline)',
            host: 'Runs 4 numerical checks',
            obs: '2/4 pass: Overflow + ZeroDiv',
            obsColor: 'orange' as const,
            hist: 'Turn 1: baseline fails on ±1000',
        },
        {
            turn: 2,
            action: 'evaluate(shift)',
            host: 'Runs 4 numerical checks',
            obs: '4/4 pass: [0.269, 0.731]',
            obsColor: 'green' as const,
            hist: 'Turn 2: shift verified (4/4) → finish',
        },
    ]
    assertEqual(turns.length, 2)

    return film(
        {
            title: 'ReAct observation-driven control loop',
            description:
                'Watch the model propose an action, the Python host execute it, and the returned observation append to history to steer the next turn.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 40,
                heading: { size: 54, align: 'center' },
                area: { top: -355, bottom: 390 },
            })
            const heading = kit.heading('ReAct Loop: Action → Host Execution → Observation')

            // 4 nodes in a crisp clockwise cycle + accumulating history strip at bottom
            const lx = -380
            const rx = 380
            const ty = -140
            const by = 135
            const nw = 500
            const nh = 148

            const phaseVal = s.value(0) // 0=choose, 1=run, 2=observe, 3=append
            const turnIdx = s.value(0) // 0 = Turn 1 (baseline), 1 = Turn 2 (shift)
            const histStage = s.value(0) // 0=init, 1=t1 appended, 2=t2 testing, 3=t2 verified

            const cycleNodes = dynamic(() => {
                const ph = Math.round(phaseVal.value)
                const ti = turnIdx.value >= 0.5 ? 1 : 0
                const hs = Math.round(histStage.value)
                const t = turns[ti]!
                const nodes: Node[] = []

                const drawNode = (
                    cx: number,
                    cy: number,
                    title: string,
                    detail: string,
                    color: 'purple' | 'blue' | 'orange' | 'green',
                    active: boolean,
                ) => {
                    nodes.push(
                        rect(nw, nh, {
                            fill: 'surface',
                            stroke: color,
                            width: active ? 4.5 : 2,
                            radius: 16,
                            opacity: active ? 1 : 0.72,
                        }).at(cx, cy),
                        text(title, { size: 34, color }).at(cx, cy - 26),
                        text(detail, { size: 28, color: active ? 'ink' : 'dim' }).at(cx, cy + 28),
                    )
                }

                drawNode(lx, ty, '1. Model chooses action', t.action, 'purple', ph === 0)
                drawNode(rx, ty, '2. Host runs Python', t.host, 'blue', ph === 1)
                drawNode(rx, by, '3. Observation returned', t.obs, t.obsColor, ph === 2)
                drawNode(lx, by, '4. Append to history', t.hist, 'green', ph === 3)

                // Connecting clockwise arrows
                nodes.push(
                    arrow([lx + nw / 2 + 12, ty], [rx - nw / 2 - 12, ty], {
                        stroke: ph === 0 || ph === 1 ? 'purple' : 'gridStrong',
                        width: ph === 0 || ph === 1 ? 4 : 2.5,
                        tip: 12,
                    }),
                    arrow([rx, ty + nh / 2 + 12], [rx, by - nh / 2 - 12], {
                        stroke: ph === 1 || ph === 2 ? 'blue' : 'gridStrong',
                        width: ph === 1 || ph === 2 ? 4 : 2.5,
                        tip: 12,
                    }),
                    arrow([rx - nw / 2 - 12, by], [lx + nw / 2 + 12, by], {
                        stroke: ph === 2 || ph === 3 ? t.obsColor : 'gridStrong',
                        width: ph === 2 || ph === 3 ? 4 : 2.5,
                        tip: 12,
                    }),
                    arrow([lx, by - nh / 2 - 12], [lx, ty + nh / 2 + 12], {
                        stroke: ph === 3 ? 'green' : 'gridStrong',
                        width: ph === 3 ? 4 : 2.5,
                        tip: 12,
                    }),
                )

                // Bottom history tape (strictly monotonic via histStage so resets never rewind text)
                const entries =
                    hs === 0
                        ? 'History: [ goal, tools ]'
                        : hs === 1
                          ? 'History: [ goal, evaluate(baseline) → 2/4 Overflow+ZeroDiv ]'
                          : hs === 2
                            ? 'History: [ goal, baseline → 2/4 fail, testing shift... ]'
                            : 'History: [ goal, baseline → 2/4 fail, shift → 4/4 VERIFIED ]'
                nodes.push(
                    text(entries, {
                        size: 28,
                        color: hs >= 3 ? 'green' : 'dim',
                    }).at(0, 315),
                )
                return nodes
            })

            s.chapter('Turn 1: test baseline')
            s.add(heading, cycleNodes)
            s.caption(
                'Turn 1: the model inspects the task and requests evaluate(baseline) from the Python workbench.',
                3.2,
            )
            s.wait(2.4)

            s.play(phaseVal.to(1), { duration: 0.45 })
            s.caption('The host executes all four numerical cases on baseline.', 2.4)
            s.wait(2.0)

            s.play(phaseVal.to(2), { duration: 0.45 })
            s.caption(
                'Only 2 of 4 checks pass: large positive inputs overflow and large negative inputs divide by zero.',
                3.6,
            )
            s.wait(2.8)

            s.play(phaseVal.to(3), histStage.to(1), { duration: 0.45 })
            s.caption(
                'That concrete traceback appends to history, steering the next model turn.',
                3.0,
            )
            s.wait(2.4)

            s.chapter('Turn 2: verify shifted fix')
            s.play(turnIdx.to(1), phaseVal.to(0), histStage.to(2), { duration: 0.5 })
            s.caption(
                'Turn 2: seeing the overflow evidence, the model tests shift (subtracting max logit).',
                3.2,
            )
            s.wait(2.2)

            s.play(phaseVal.to(1), { duration: 0.4 })
            s.wait(1.0)
            s.play(phaseVal.to(2), { duration: 0.4 })
            s.caption('All 4 of 4 numerical cases pass with exact probabilities [0.269, 0.731].', 3.2)
            s.wait(2.4)

            s.play(phaseVal.to(3), histStage.to(3), { duration: 0.45 })
            s.caption('The verified observation enters history, letting the agent finish with shift.', 3.2)
            s.wait(3.0)
        },
    )
}

export default createFilm()
