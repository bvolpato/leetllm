import React from 'react'
import { defineAnimation, hold, tween, type ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'
export const alt =
    'Ring all-reduce follows chunk x2 from R3 to R0 to R1 to R2. The partial sum changes 3000 to 3003 to 3033 to 3333. All-gather then circulates the completed 3333 shard from R2 to R3 to R0 to R1.'
export const width = 560
export const height = 420
type State = { reduce: number; gather: number }
const xs = [64, 208, 352, 496]
function frame(theme: ThemeMode, state: Readonly<State>) {
    const k = pk(theme),
        a = canvas(k, width, height)
    const track = (
        top: number,
        title: string,
        ranks: number[],
        values: string[],
        progress: number,
        tone: string,
        reducing: boolean,
    ) => {
        a.text(28, top, title, { size: 22, weight: 700 })
        for (let i = 0; i < 4; i++) {
            a.text(xs[i], top + 45, 'R' + ranks[i], { size: 20, mono: true, align: 'center' })
            a.dot(xs[i], top + 91, 31, tint(tone, 0.12), { stroke: tint(tone, 0.45) })
            if (reducing || i <= progress * 3)
                a.text(xs[i], top + 91, values[i], {
                    size: 20,
                    mono: true,
                    align: 'center',
                    weight: 650,
                    color: tone,
                })
            if (i < 3) a.arrow(xs[i] + 36, top + 91, xs[i + 1] - 36, top + 91, k.mid)
        }
        if (progress > 0 && progress < 1) {
            const position = progress * 3,
                step = Math.floor(position),
                x = xs[step] + (xs[Math.min(3, step + 1)] - xs[step]) * (position - step)
            a.dot(x, top + 91, 33, k.c.bgCard, { stroke: tone, width: 2 })
            a.text(x, top + 91, values[step], {
                size: 20,
                mono: true,
                align: 'center',
                color: tone,
                weight: 700,
            })
        }
    }
    track(
        28,
        '1. Reduce-scatter · chunk x₂',
        [3, 0, 1, 2],
        ['3000', '3003', '3033', '3333'],
        state.reduce,
        k.state,
        true,
    )
    const added = [3, 30, 300]
    added.forEach((value, i) =>
        a.text((xs[i] + xs[i + 1]) / 2, 177, '+' + value, {
            size: 18,
            mono: true,
            align: 'center',
            color: k.mid,
        }),
    )
    track(
        234,
        '2. All-gather · copy x₂ = 3333',
        [2, 3, 0, 1],
        ['3333', '3333', '3333', '3333'],
        state.gather,
        k.pass,
        false,
    )
    a.text(28, 399, '2 × (4 − 1) = 6 neighbor hops', { size: 20, color: k.mid })
    return a.render()
}
export function createAnimation(theme: ThemeMode) {
    return defineAnimation<State>({
        initial: { reduce: 0, gather: 0 },
        timeline: [
            hold(1000, 'rank-local shard'),
            tween<Partial<State>>(
                { reduce: 1 },
                { duration: 2700, easing: 'ease-in-out', label: 'reduce-scatter' },
            ),
            hold(900),
            tween<Partial<State>>(
                { gather: 1 },
                { duration: 2700, easing: 'ease-in-out', label: 'all-gather' },
            ),
            hold(1200),
        ],
        fps: 10,
        render: (state) => frame(theme, state),
    })
}
export function create(theme: ThemeMode = 'dark') {
    return frame(theme, { reduce: 1, gather: 1 })
}
export default create('dark')
