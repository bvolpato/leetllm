import {
    arrow,
    boxOf,
    dot,
    fadeIn,
    fadeOut,
    film,
    rect,
    sceneKit,
    seq,
    tex,
    text,
    to,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

export function createFilm(theme: ThemeMode = 'dark') {
    return film(
        {
            title: 'Forward values fuel backward gradients',
            description:
                'Watch a two-feature prediction move forward to loss L=1, then trace local derivatives backward via the chain rule.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 52,
                heading: { size: 60, align: 'center' },
                area: { top: -350, bottom: 350 },
            })

            const title = kit.heading('Forward pass saves values; backward multiplies slopes')

            // 5-node DAG centered cleanly across the 1920x1080 stage
            const pos = {
                prompt: [-580, -135] as [number, number],
                queue: [-580, 135] as [number, number],
                pred: [-175, 0] as [number, number],
                err: [215, 0] as [number, number],
                loss: [590, 0] as [number, number],
            }

            const makeBox = (
                center: [number, number],
                w: number,
                h: number,
                color: 'blue' | 'cyan' | 'purple' | 'orange' | 'red',
            ) =>
                rect(w, h, {
                    stroke: color,
                    width: 4,
                    radius: 18,
                }).at(center)

            const bPrompt = makeBox(pos.prompt, 330, 148, 'blue')
            const bQueue = makeBox(pos.queue, 330, 148, 'cyan')
            const bPred = makeBox(pos.pred, 240, 152, 'purple')
            const bErr = makeBox(pos.err, 240, 152, 'orange')
            const bLoss = makeBox(pos.loss, 240, 152, 'red')

            // Node labels (forward values)
            const tPrompt = text('Prompt · 4', { size: 42, color: 'blue' }).at([
                pos.prompt[0],
                pos.prompt[1] - 26,
            ])
            const mPrompt = tex(String.raw`w_p x_p = 2 \times 2`, { size: 34, color: 'dim' }).at([
                pos.prompt[0],
                pos.prompt[1] + 28,
            ])

            const tQueue = text('Queue · 2', { size: 42, color: 'cyan' }).at([
                pos.queue[0],
                pos.queue[1] - 26,
            ])
            const mQueue = tex(String.raw`w_q x_q = 2 \times 1`, { size: 34, color: 'dim' }).at([
                pos.queue[0],
                pos.queue[1] + 28,
            ])

            const tPred = tex(String.raw`\hat{y} = 6`, { size: 44, color: 'purple' }).at([
                pos.pred[0],
                pos.pred[1] - 24,
            ])
            const mPred = tex(String.raw`4 + 2`, { size: 34, color: 'dim' }).at([
                pos.pred[0],
                pos.pred[1] + 28,
            ])

            const tErr = tex(String.raw`e = 1`, { size: 44, color: 'orange' }).at([
                pos.err[0],
                pos.err[1] - 24,
            ])
            const mErr = tex(String.raw`6 - 5`, { size: 34, color: 'dim' }).at([
                pos.err[0],
                pos.err[1] + 28,
            ])

            const tLoss = tex(String.raw`L = 1`, { size: 44, color: 'red' }).at([
                pos.loss[0],
                pos.loss[1] - 24,
            ])
            const mLoss = tex(String.raw`e^2`, { size: 34, color: 'dim' }).at([
                pos.loss[0],
                pos.loss[1] + 28,
            ])

            // Forward arrows
            const fw1 = arrow(
                [boxOf(bPrompt).right + 6, pos.prompt[1]],
                [boxOf(bPred).left - 10, pos.pred[1] - 28],
                { stroke: 'blue', width: 5 },
            )
            const fw2 = arrow(
                [boxOf(bQueue).right + 6, pos.queue[1]],
                [boxOf(bPred).left - 10, pos.pred[1] + 28],
                { stroke: 'cyan', width: 5 },
            )
            const fw3 = arrow(
                [boxOf(bPred).right + 6, 0],
                [boxOf(bErr).left - 10, 0],
                { stroke: 'purple', width: 5 },
            )
            const fw4 = arrow(
                [boxOf(bErr).right + 6, 0],
                [boxOf(bLoss).left - 10, 0],
                { stroke: 'orange', width: 5 },
            )

            // Phase badge
            const phaseForward = text('FORWARD PASS →', { size: 38, color: 'blue' }).at([0, -255])
            const phaseBackward = text('← BACKWARD PASS (chain rule)', {
                size: 38,
                color: 'red',
            }).at([0, -255])

            // Backward gradient badges positioned right beneath/above each node
            const gLoss = tex(String.raw`\frac{\partial L}{\partial L} = 1`, {
                size: 40,
                color: 'red',
            }).at([pos.loss[0], 145])
            const gErr = tex(String.raw`\frac{\partial L}{\partial e} = 1 \times 2e = 2`, {
                size: 38,
                color: 'orange',
            }).at([pos.err[0], 145])
            const gPred = tex(String.raw`\frac{\partial L}{\partial \hat{y}} = 2 \times 1 = 2`, {
                size: 38,
                color: 'purple',
            }).at([pos.pred[0], 145])
            const gPrompt = tex(String.raw`\frac{\partial L}{\partial w_p} = 2 \times x_p = 4`, {
                size: 36,
                color: 'blue',
            }).at([pos.prompt[0], pos.prompt[1] - 156])
            const gQueue = tex(String.raw`\frac{\partial L}{\partial w_q} = 2 \times x_q = 2`, {
                size: 36,
                color: 'cyan',
            }).at([pos.queue[0], pos.queue[1] + 156])

            // Backward arrows underneath
            const bw1 = arrow(
                [boxOf(bLoss).left - 8, 56],
                [boxOf(bErr).right + 8, 56],
                { stroke: 'red', width: 5, dash: [12, 8] },
            )
            const bw2 = arrow(
                [boxOf(bErr).left - 8, 56],
                [boxOf(bPred).right + 8, 56],
                { stroke: 'orange', width: 5, dash: [12, 8] },
            )
            const bw3 = arrow(
                [boxOf(bPred).left - 8, -48],
                [boxOf(bPrompt).right + 8, pos.prompt[1] + 24],
                { stroke: 'blue', width: 5, dash: [12, 8] },
            )
            const bw4 = arrow(
                [boxOf(bPred).left - 8, 48],
                [boxOf(bQueue).right + 8, pos.queue[1] - 24],
                { stroke: 'cyan', width: 5, dash: [12, 8] },
            )

            // Traveling signal dot (stops right outside node borders to keep text spotless)
            const pulse = dot(15, 'blue').at([boxOf(bPrompt).right + 12, pos.prompt[1]]).glow(10)

            s.chapter('Forward pass')
            s.add(title, bPrompt, bQueue, bPred, bErr, bLoss)
            s.play(
                fadeIn(phaseForward),
                fadeIn(tPrompt),
                fadeIn(mPrompt),
                fadeIn(tQueue),
                fadeIn(mQueue),
                { duration: 0.9 },
            )
            s.add(pulse)
            s.play(
                fadeIn(fw1),
                fadeIn(fw2),
                to(pulse, (n) => n.at([boxOf(bPred).left - 18, 0])),
                fadeIn(tPred),
                fadeIn(mPred),
                { duration: 1.1 },
            )
            s.play(
                fadeIn(fw3),
                to(pulse, (n) => n.at([boxOf(bErr).left - 18, 0])),
                fadeIn(tErr),
                fadeIn(mErr),
                { duration: 0.9 },
            )
            s.play(
                fadeIn(fw4),
                to(pulse, (n) => n.at([boxOf(bLoss).left - 18, 0])),
                fadeIn(tLoss),
                fadeIn(mLoss),
                { duration: 0.9 },
            )
            s.caption(
                'Forward evaluation computes prediction 6, error 1, and squared loss 1, caching e=1 and inputs x_p=2, x_q=1.',
                4.2,
            )
            s.wait(1.8)

            s.chapter('Backward pass (chain rule)')
            s.play(
                seq(fadeOut(phaseForward), fadeIn(phaseBackward)),
                fadeOut(pulse),
                fadeIn(gLoss),
                { duration: 0.9 },
            )
            const gradPulse = dot(15, 'red').at([boxOf(bLoss).left - 14, 56]).glow(10)
            s.add(gradPulse)
            s.play(
                fadeIn(bw1),
                to(gradPulse, (n) => n.at([pos.err[0], 56])),
                fadeIn(gErr),
                { duration: 1.0 },
            )
            s.play(
                fadeIn(bw2),
                to(gradPulse, (n) => n.at([pos.pred[0], 56])),
                fadeIn(gPred),
                { duration: 1.0 },
            )
            s.play(
                fadeIn(bw3),
                fadeIn(bw4),
                fadeOut(gradPulse),
                fadeIn(gPrompt),
                fadeIn(gQueue),
                { duration: 1.2 },
            )
            s.caption(
                'Reverse mode starts at dL/dL = 1, multiplies by 2e = 2 and 1, then branches by x_p = 2 and x_q = 1 to get gradients 4 and 2.',
                5.0,
            )
            s.wait(3.2)
        },
    )
}

export default createFilm()
