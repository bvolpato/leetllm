import React from 'react'
import { defineAnimation, hold, parallel, tween, type ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'
export const alt =
    'CUDA streams on a common zero to five millisecond axis. Backward compute runs from 0 to 4.3 ms. Its gradient bucket is ready at 0.9 ms, allowing reduce-scatter from 0.9 to 3.9 ms to overlap independent compute. The shard reader starts only at 3.9 ms and finishes at 4.6 ms.'
export const width = 560
export const height = 400
type State = { backward: number; communication: number; optimizer: number }
function frame(theme: ThemeMode, state: Readonly<State>) {
    const k = pk(theme),
        a = canvas(k, width, height),
        x = (ms: number) => 42 + ms * 94
    for (let ms = 0; ms <= 5; ms++) {
        a.line(x(ms), 63, x(ms), 352, k.line, { dash: '3 5' })
        a.text(x(ms), 32, ms + ' ms', { size: 18, mono: true, align: 'center' })
    }
    const rows = [
        {
            y: 102,
            label: 'Backward compute',
            start: 0,
            duration: 4.3,
            p: state.backward,
            tone: k.prefill,
        },
        {
            y: 213,
            label: 'Reduce-scatter',
            start: 0.9,
            duration: 3,
            p: state.communication,
            tone: k.state,
        },
        {
            y: 324,
            label: 'Shard reader',
            start: 3.9,
            duration: 0.7,
            p: state.optimizer,
            tone: k.pass,
        },
    ]
    for (const r of rows) {
        a.text(28, r.y - 28, r.label, { size: 21, weight: 650 })
        a.rect(x(r.start), r.y, r.duration * 94, 26, {
            fill: tint(r.tone, 0.1),
            stroke: tint(r.tone, 0.3),
            r: 3,
        })
        if (r.p > 0)
            a.rect(x(r.start), r.y, r.duration * 94 * r.p, 26, { fill: tint(r.tone, 0.6), r: 3 })
    }
    a.arrow(x(0.9), 128, x(0.9), 202, k.prefill)
    a.text(x(0.9) + 12, 159, 'bucket ready', { size: 18, color: k.prefill })
    a.arrow(x(3.9), 239, x(3.9), 313, k.state)
    a.text(x(3.9) - 12, 270, 'shard ready', { size: 18, color: k.state, align: 'right' })
    a.text(28, 382, 'Independent compute overlaps communication.', { size: 20, color: k.mid })
    return a.render()
}
export function createAnimation(theme: ThemeMode) {
    return defineAnimation<State>({
        initial: { backward: 0, communication: 0, optimizer: 0 },
        timeline: [
            hold(800),
            parallel<State>({
                backward: [tween(1, { duration: 4300, easing: 'linear' })],
                communication: [hold(900), tween(1, { duration: 3000, easing: 'linear' })],
                optimizer: [hold(3900), tween(1, { duration: 700, easing: 'linear' })],
            }),
            hold(1300),
        ],
        fps: 10,
        render: (state) => frame(theme, state),
    })
}
export function create(theme: ThemeMode = 'dark') {
    return frame(theme, { backward: 1, communication: 1, optimizer: 1 })
}
export default create('dark')
