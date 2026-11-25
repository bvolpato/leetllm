import {
    arrow,
    assertEqual,
    column,
    draw,
    fadeIn,
    fadeOut,
    film,
    indicate,
    lagged,
    line,
    place,
    rect,
    sceneKit,
    seq,
    tex,
    text,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const TOKENS = ['<sys>', 'sql', '<user>', 'drop', '<asst>', 'deny', 'write', '<end>'] as const
const LABELS = ['-100', '-100', '-100', '-100', '-100', 'deny', 'write', '<end>'] as const
const PROBS: Record<number, number> = { 5: 0.8, 6: 0.7, 7: 0.9 }

export function createFilm(theme: ThemeMode = 'dark') {
    const scoredNlls = [PROBS[5]!, PROBS[6]!, PROBS[7]!].map((p) => -Math.log(p))
    const meanLoss = scoredNlls.reduce((a, b) => a + b, 0) / scoredNlls.length
    assertEqual(Number(meanLoss.toFixed(3)), 0.228, 'mean NLL over 3 scored assistant tokens')

    return film(
        {
            title: 'SFT loss masking: read all context, score only the reply',
            description:
                'Every token enters causal self-attention, while -100 masks prompt positions out of cross-entropy so gradients update only on shifted assistant targets.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 30,
                heading: { size: 48, align: 'center' },
                area: { left: -880, right: 880, top: -375, bottom: 420 },
            })

            const [, footerArea] = kit.area.rows([3.0, 0.92], 24)
            const title = kit.heading('SFT loss masking: read context, score only the reply')

            const startX = -682
            const colW = 192
            const tileW = 172
            const tileH = 74
            const colX = (i: number) => startX + i * colW

            const yBracket = -265
            const yPos = -215
            const yInput = -140
            const yLogit = -20
            const yLabel = 108

            // Row names on left
            const rowPos = text('Pos', { size: 26, color: 'dim' }).moveTo([-842, yPos])
            const rowInp = text('Input', { size: 28, color: 'ink' }).moveTo([-842, yInput])
            const rowLog = text('Logits', { size: 28, color: 'ink' }).moveTo([-842, yLogit])
            const rowLab = text('Label', { size: 28, color: 'ink' }).moveTo([-842, yLabel])

            // Top brackets: Context (0..4) vs Scored (5..7)
            const ctxLine = line([colX(0) - tileW / 2, yBracket + 24], [colX(4) + tileW / 2, yBracket + 24], {
                stroke: 'blue',
                width: 4,
            })
            const ctxTitle = text('Context: read in attention, NOT scored', {
                size: 28,
                color: 'blue',
            }).moveTo([(colX(0) + colX(4)) / 2, yBracket - 6])

            const scLine = line([colX(5) - tileW / 2, yBracket + 24], [colX(7) + tileW / 2, yBracket + 24], {
                stroke: 'green',
                width: 4,
            })
            const scTitle = text('Assistant reply: scored', {
                size: 28,
                color: 'green',
            }).moveTo([(colX(5) + colX(7)) / 2, yBracket - 6])

            // Build per-column elements
            const posNodes = TOKENS.map((_, i) =>
                text(String(i), { font: 'mono', size: 24, color: 'dim' }).moveTo([colX(i), yPos]),
            )

            const inputCards = TOKENS.map((tok, i) => {
                const col = i >= 5 ? 'green' : i === 4 ? 'yellow' : 'blue'
                const box = rect(tileW, tileH, {
                    fill: 'surface',
                    stroke: col,
                    width: 3,
                    radius: 10,
                }).at(colX(i), yInput)
                const lbl = text(tok, { font: 'mono', size: 28, color: col }).moveTo([
                    colX(i),
                    yInput,
                ])
                return { box, lbl }
            })

            const logitDots = TOKENS.slice(0, 7).map((_, i) => {
                const scored = i >= 4
                const stem = line([colX(i), yInput + tileH / 2 + 4], [colX(i), yLogit - 18], {
                    stroke: scored ? 'purple' : 'dim',
                    width: scored ? 3 : 2,
                    opacity: scored ? 0.9 : 0.45,
                })
                const node = rect(scored ? 28 : 16, scored ? 28 : 16, {
                    fill: scored ? 'purple' : 'dim',
                    stroke: null,
                    radius: scored ? 14 : 8,
                    opacity: scored ? 1 : 0.55,
                }).at(colX(i), yLogit)
                return { stem, node, scored }
            })

            const labelCards = LABELS.map((lab, i) => {
                const scored = i >= 5
                const box = rect(tileW, tileH, {
                    fill: scored ? 'green' : 'surface',
                    stroke: scored ? 'green' : 'grid',
                    width: scored ? 3.5 : 2,
                    radius: 10,
                    opacity: scored ? 0.2 : 0.75,
                }).at(colX(i), yLabel)
                const edge = rect(tileW, tileH, {
                    fill: null,
                    stroke: scored ? 'green' : 'grid',
                    width: scored ? 3.5 : 2,
                    radius: 10,
                }).at(colX(i), yLabel)
                const txt = text(lab, {
                    font: 'mono',
                    size: 28,
                    color: scored ? 'green' : 'dim',
                }).moveTo([colX(i), yLabel])
                return { box, edge, txt, scored }
            })

            // Diagonal shift arrows from logit i (4, 5, 6) to label i+1 (5, 6, 7)
            const shiftArrows = [4, 5, 6].map((i) =>
                arrow([colX(i) + 12, yLogit + 16], [colX(i + 1) - 10, yLabel - tileH / 2 - 4], {
                    stroke: 'purple',
                    width: 4,
                    tip: 16,
                }),
            )

            // Probability badges under scored labels
            const probLabels = [5, 6, 7].map((i) =>
                text(`p = ${PROBS[i]!.toFixed(1)}`, {
                    font: 'mono',
                    size: 26,
                    color: 'green',
                }).moveTo([colX(i), yLabel + tileH / 2 + 28]),
            )

            // Footer panel
            const footerBg = rect(footerArea!.width, footerArea!.height, {
                fill: 'surface',
                stroke: 'grid',
                width: 2,
                radius: 16,
            }).at(footerArea!.cx, footerArea!.cy)

            const foot1 = place(
                column(
                    [
                        text('Step 1: The full conversation enters causal attention', {
                            size: 30,
                            color: 'blue',
                        }),
                        text('System, user, and assistant header tokens stay visible to every later token.', {
                            size: 26,
                            color: 'dim',
                        }),
                    ],
                    { gap: 12, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            const foot2 = place(
                column(
                    [
                        text('Step 2: Set prompt labels to -100 (ignore_index)', {
                            size: 30,
                            color: 'yellow',
                        }),
                        text('Positions 0–4 contribute zero loss; weights only train to generate the reply.', {
                            size: 26,
                            color: 'ink',
                        }),
                    ],
                    { gap: 12, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            const foot3 = place(
                column(
                    [
                        tex(
                            '\\mathcal{L}_{\\text{SFT}} = \\frac{1}{3}\\big(-\\log 0.8 - \\log 0.7 - \\log 0.9\\big) = 0.228',
                            { size: 34, color: 'green' },
                        ),
                        text('Logits at positions 4, 5, 6 predict labels 5, 6, 7 (one-step shift).', {
                            size: 25,
                            color: 'dim',
                        }),
                    ],
                    { gap: 10, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            // Chapter 1: Input tokens stream in
            s.chapter('Full sequence enters causal attention')
            s.add(title, rowPos, rowInp, footerBg, foot1)
            s.play(
                lagged(
                    inputCards.map((c, i) => fadeIn([posNodes[i]!, c.box, c.lbl])),
                    { lag: 0.1 },
                ),
                { duration: 1.5 },
            )
            s.play(fadeIn([ctxLine, ctxTitle, scLine, scTitle]), { duration: 0.7 })
            s.caption(
                'All eight tokens enter the forward pass so the model conditions on the full system and user prompt.',
                4.2,
            )
            s.wait(1.4)

            // Chapter 2: Context masked with -100
            s.chapter('Mask prompt positions with -100')
            s.add(rowLab)
            s.play(
                seq(fadeOut(foot1), fadeIn(foot2)),
                lagged(
                    labelCards.slice(0, 5).map((lc) => fadeIn([lc.box, lc.edge, lc.txt])),
                    { lag: 0.12 },
                ),
                { duration: 1.4 },
            )
            s.caption(
                'Labels for context positions 0 through 4 are set to -100 so PyTorch cross-entropy skips them cleanly.',
                4.5,
            )
            s.wait(1.6)

            // Chapter 3: Shifted logits score assistant targets
            s.chapter('Score shifted assistant targets')
            s.add(rowLog)
            s.play(
                fadeIn(logitDots.flatMap((d) => [d.stem, d.node])),
                fadeIn(labelCards.slice(5).flatMap((lc) => [lc.box, lc.edge, lc.txt])),
                { duration: 0.9 },
            )
            s.play(
                lagged(
                    shiftArrows.map((a, idx) =>
                        seq(
                            draw(a, { duration: 0.45 }),
                            fadeIn(probLabels[idx]!, { duration: 0.3 }),
                            indicate([labelCards[idx + 5]!.edge, labelCards[idx + 5]!.txt], {
                                color: 'green',
                                scale: 1.08,
                                duration: 0.35,
                            }),
                        ),
                    ),
                    { lag: 0.35 },
                ),
            )
            s.play(seq(fadeOut(foot2), fadeIn(foot3)), { duration: 0.8 })
            s.caption(
                'Logits at positions 4, 5, and 6 predict deny, write, and end, averaging 0.228 nats across the three scored tokens.',
                5.2,
            )
            s.wait(3.2)
        },
    )
}

export default createFilm()
