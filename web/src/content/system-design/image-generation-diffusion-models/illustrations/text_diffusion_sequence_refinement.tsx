import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 860
export const height = 500
export const alt =
    'Comparison between Autoregressive sequence generation and Discrete Diffusion token refinement. Autoregressive decoding commits tokens strictly left-to-right with causal masking and no revision. Discrete diffusion refines a masked sequence in parallel rounds, filling confident positions first and revising tokens bidirectionally.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Autoregressive Decoding vs. Diffusion Sequence Refinement', {
        size: 22,
        weight: 700,
    })
    a.text(40, 58, 'Causal prefix growth compared to bidirectional iterative canvas denoising', {
        size: 15,
        color: k.mid,
    })

    // Panel 1: Autoregressive (Left)
    a.rect(40, 85, 380, 375, { fill: tint(k.prefill, 0.04), stroke: tint(k.prefill, 0.3), r: 8 })
    a.cell(56, 102, 140, 24, 'AUTOREGRESSIVE', {
        fill: tint(k.prefill, 0.15),
        stroke: tint(k.prefill, 0.4),
        color: k.prefill,
        weight: 700,
    })
    a.text(210, 114, 'Causal Left-to-Right', { size: 15, weight: 700 })

    const arRows = [
        { step: 'Step 1', tokens: ['write', '·', '·', '·'] },
        { step: 'Step 2', tokens: ['write', 'unit', '·', '·'] },
        { step: 'Step 3', tokens: ['write', 'unit', 'tests', '·'] },
        { step: 'Step 4', tokens: ['write', 'unit', 'tests', 'first'] },
    ]

    arRows.forEach((r, idx) => {
        const y = 145 + idx * 52
        a.text(56, y + 16, r.step, { size: 15, mono: true, color: k.mid })
        r.tokens.forEach((tok, pos) => {
            const tx = 130 + pos * 68
            const isFilled = tok !== '·'
            const isNew = isFilled && (idx === 0 || arRows[idx - 1].tokens[pos] === '·')
            const bg = isNew
                ? tint(k.pass, 0.15)
                : isFilled
                  ? tint(k.prefill, 0.08)
                  : tint(k.c.bg, 0.05)
            const stroke = isNew ? k.pass : isFilled ? tint(k.prefill, 0.3) : k.line
            const color = isNew ? k.pass : isFilled ? k.ink : k.faint
            a.cell(tx, y, 62, 34, tok, {
                fill: bg,
                stroke,
                color,
                mono: true,
                weight: isFilled ? 600 : 400,
            })
        })
        if (idx < arRows.length - 1) {
            a.arrow(80, y + 36, 80, y + 50, k.prefill, { width: 1.25 })
        }
    })

    a.rect(56, 365, 348, 80, { fill: tint(k.c.bg, 0.08), stroke: k.line, r: 6 })
    a.text(68, 386, 'Strict causal mask (triangular)', { size: 15, weight: 600, color: k.prefill })
    a.text(68, 408, 'Irreversible token commitments: past cannot change', {
        size: 15,
        color: k.ink,
    })
    a.text(68, 428, 'L sequential forward passes required', { size: 15, mono: true, color: k.mid })

    // Panel 2: Discrete Diffusion / Canvas (Right)
    a.rect(440, 85, 380, 375, { fill: tint(k.decode, 0.04), stroke: tint(k.decode, 0.3), r: 8 })
    a.cell(456, 102, 150, 24, 'DISCRETE DIFFUSION', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(620, 114, 'Bidirectional Canvas', { size: 15, weight: 700 })

    const diffRows = [
        { round: 'Round 0', tokens: ['<mask>', '<mask>', '<mask>', '<mask>'] },
        { round: 'Round 1', tokens: ['write', '<mask>', '<mask>', 'later'] },
        { round: 'Round 2', tokens: ['write', 'unit', '<mask>', 'first'] },
        { round: 'Round 3', tokens: ['write', 'unit', 'tests', 'first'] },
    ]

    diffRows.forEach((r, idx) => {
        const y = 145 + idx * 52
        a.text(456, y + 16, r.round, { size: 15, mono: true, color: k.mid })
        r.tokens.forEach((tok, pos) => {
            const tx = 530 + pos * 68
            const isMask = tok === '<mask>'
            const isRevised = idx === 2 && pos === 3 // 'later' revised to 'first'
            const isNew = !isMask && (idx === 0 || diffRows[idx - 1].tokens[pos] === '<mask>')
            const bg = isRevised
                ? tint(k.wait, 0.2)
                : isNew
                  ? tint(k.pass, 0.15)
                  : isMask
                    ? tint(k.c.bg, 0.05)
                    : tint(k.decode, 0.08)
            const stroke = isRevised
                ? k.wait
                : isNew
                  ? k.pass
                  : isMask
                    ? k.line
                    : tint(k.decode, 0.3)
            const color = isRevised ? k.wait : isNew ? k.pass : isMask ? k.faint : k.ink
            const display = isMask ? '[M]' : tok
            a.cell(tx, y, 62, 34, display, {
                fill: bg,
                stroke,
                color,
                mono: true,
                weight: !isMask ? 600 : 400,
            })
        })
        if (idx < diffRows.length - 1) {
            a.arrow(480, y + 36, 480, y + 50, k.decode, { width: 1.25 })
        }
    })

    a.rect(456, 365, 348, 80, { fill: tint(k.c.bg, 0.08), stroke: k.line, r: 6 })
    a.text(468, 386, 'Full bidirectional attention across sequence', {
        size: 15,
        weight: 600,
        color: k.decode,
    })
    a.text(468, 408, 'Arbitrary unmasking order + non-monotonic revision', {
        size: 15,
        color: k.ink,
    })
    a.text(468, 428, 'Parallel token generation in constant K rounds', {
        size: 15,
        mono: true,
        color: k.mid,
    })

    return a.render()
}

export default create('dark')
