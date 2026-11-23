import { defineAnimation, hold, tween, type ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 560
export const height = 390
export type NcclCollective = 'all-reduce' | 'all-gather' | 'reduce-scatter' | 'all-to-all'
type AnimationState = { progress: number }
const ranks = [0, 1, 2, 3]
const rows = [[1, 2, 3, 4], [10, 20, 30, 40], [100, 200, 300, 400], [1000, 2000, 3000, 4000]]
const sums = [1111, 2222, 3333, 4444]
const clamp = (v: number) => Math.max(0, Math.min(1, v))

export function createNcclFrame(theme: ThemeMode, collective: NcclCollective, progress = 1) {
    const k = pk(theme), a = canvas(k, width, height), p = clamp(progress)
    const color = collective === 'all-to-all' ? k.wait : k.state
    const y = (r: number) => 96 + r * 62
    const x = (column: number, slot: number) => (column ? 312 : 44) + slot * 52
    const token = (left: number, top: number, value: string | number, tone = color, w = 50, opacity = 1) => {
        a.rect(left, top - 22, w, 44, { fill: tint(tone, 0.12 * opacity), stroke: tint(tone, 0.5 * opacity), r: 4 })
        a.text(left + w / 2, top, value, { size: 20, mono: true, align: 'center', w, color: tint(tone, opacity), weight: 650 })
    }
    a.text(44, 31, 'Before', { size: 22, weight: 700 })
    a.text(312, 31, 'After', { size: 22, weight: 700 })
    a.arrow(242, 31, 286, 31, k.mid)
    for (const r of ranks) {
        a.text(13, y(r), 'R' + r, { size: 18, mono: true })
        a.line(44, y(r) + 31, 516, y(r) + 31, k.line)
        for (const s of ranks) {
            if (collective === 'all-reduce' && s === 0) token(x(0, 0), y(r), rows[r][0], color, 206)
            if (collective === 'all-gather' && s === 0) token(x(0, 0), y(r), sums[r], color, 206)
            if (collective === 'reduce-scatter') token(x(0, s), y(r), rows[r][s])
            if (collective === 'all-to-all') token(x(0, s), y(r), r + '→' + s, [k.prefill, k.state, k.pass, k.wait][s])
        }
    }
    if (collective === 'all-to-all' || collective === 'all-gather') {
        // Group by destination so moving labels remain traceable.
        const completed = Math.min(4, Math.floor(p * 4)), phase = p * 4 - completed
        for (const target of ranks) for (const source of ranks) {
            const tone = collective === 'all-to-all' ? [k.prefill, k.state, k.pass, k.wait][target] : color
            const label = collective === 'all-to-all' ? source + '→' + target : sums[source]
            if (target < completed) token(x(1, source), y(target), label, tone)
            if (target === completed) {
                const inputX = collective === 'all-to-all' ? x(0, target) : 122
                token(inputX + (x(1, source) - inputX) * phase,
                    y(source) + (y(target) - y(source)) * phase, label, tone)
            }
        }
    } else if (collective === 'reduce-scatter') {
        const completed = Math.min(4, Math.floor(p * 4)), phase = p * 4 - completed
        for (const r of ranks) {
            if (r < completed) token(312, y(r), sums[r], color, 206)
            if (r === completed) {
                for (const source of ranks) token(x(0, r) + (280 - x(0, r)) * phase,
                    y(source) + (y(r) - y(source)) * phase, rows[source][r], color, 50, 1 - phase)
                token(312, y(r), sums[r], color, 206, phase)
            }
        }
    } else {
        const reduce = clamp(p * 2), distribute = clamp(p * 2 - 1)
        if (p < 0.5) {
            for (const r of ranks) token(108 + (254 - 108) * reduce,
                y(r) + (189 - y(r)) * reduce, rows[r][0], color, 78, 1 - reduce)
            token(264, 189, 'Σ', color, 50, reduce)
        } else if (p < 1) {
            for (const r of ranks) token(264 + (312 - 264) * distribute,
                189 + (y(r) - 189) * distribute, sums[0], color, 206, distribute)
        } else {
            // Static frame parity: render inputs on left, central reduction symbol Sigma, and results on right
            token(264, 189, 'Σ', color, 42)
            a.arrow(220, 189, 252, 189, color)
            a.arrow(276, 189, 308, 189, color)
            for (const r of ranks) token(312, y(r), sums[0], color, 206)
        }
    }
    const notes: Record<NcclCollective, [string, string]> = {
        'all-reduce': ['1 + 10 + 100 + 1000 = 1111', 'The same sum reaches every rank.'],
        'all-gather': ['[1111, 2222, 3333, 4444]', 'Rank order is preserved in every copy.'],
        'reduce-scatter': ['Σ by column → one sum per rank', 'R0 keeps 1111; R3 keeps 4444.'],
        'all-to-all': ['source → destination', 'Each output row contains every source.'],
    }
    a.text(44, 337, notes[collective][0], { size: 20, mono: collective !== 'all-to-all', weight: 650 })
    a.text(44, 369, notes[collective][1], { size: 18, color: k.mid })
    return a.render()
}

export function createNcclAnimation(theme: ThemeMode, collective: NcclCollective) {
    return defineAnimation<AnimationState>({
        initial: { progress: 0 },
        timeline: [hold(900, 'rank-local input'), tween<Partial<AnimationState>>({ progress: 1 }, { duration: 3200, easing: 'ease-in-out', label: collective }), hold(1100, 'rank-local output')],
        fps: 15,
        render: state => createNcclFrame(theme, collective, state.progress),
    })
}
