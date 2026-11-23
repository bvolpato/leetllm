import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 494
export const alt =
    'Thirty waiting requests and 20 running streams make a 50-request snapshot. At five active slots per replica, demand points to ten replicas: four ready with all 20 slots of current capacity full and six pending. Polls raise desired replicas from 4 to 10, keep 10 when 4 are ready, then raise to 12 for 56 requests. Unplaced GPU pods pass through node provisioning, image and weight loading, warmup, and readiness before joining traffic; existing streams continue.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    // Demand, one mark per request.
    s.text(8, 12, 'One mark per request', { color: k.faint })
    for (let i = 0; i < 50; i++) {
        s.dot(14 + (i % 10) * 16, 36 + Math.floor(i / 10) * 16, 6, i < 20 ? k.decode : k.wait)
    }
    s.dot(14, 130, 5, k.decode)
    s.text(24, 130, '20 running', { color: k.decode, weight: 600 })
    s.dot(14, 150, 5, k.wait)
    s.text(24, 150, '30 waiting', { color: k.wait, weight: 600 })

    s.arrow(172, 66, 206, 66, k.mid)
    s.text(189, 50, '÷ 5', { align: 'center', color: k.mid, w: 34 })

    // Replicas.
    s.text(214, 12, '50 requests point to 10 replicas', { weight: 700 })
    for (let i = 0; i < 10; i++) {
        const x = 214 + (i % 5) * 58
        const y = 28 + Math.floor(i / 5) * 44
        const ready = i < 4
        s.cell(
            x,
            y,
            52,
            38,
            `R${i + 1}`,
            ready
                ? {
                      fill: tint(k.pass, 0.18),
                      stroke: k.pass,
                      weight: 700,
                      color: k.pass,
                      mono: true,
                  }
                : { dash: '4 3', stroke: k.faint, color: k.faint, mono: true },
        )
    }
    s.text(214, 130, '4 ready, 20 slots: 20 running, 0 open', { color: k.mid })
    s.text(214, 150, '6 not ready yet', { color: k.mid })

    s.line(8, 170, 502, 170, k.line)

    // Desired against ready, by controller poll.
    const PL = 30
    const PW = 216
    const PT = 202
    const PB = 330
    const py = (v: number) => PB - (v / 12) * (PB - PT)
    const px = [PL + 24, PL + 108, PL + 192]
    s.text(8, 186, 'Replicas', { color: k.faint })
    for (const v of [0, 4, 8, 12]) {
        s.line(PL, py(v), PL + PW, py(v), k.line, { width: 0.75 })
        s.text(PL - 6, py(v), v, { align: 'right', w: 22, color: k.mid })
    }
    ;['poll 0', 'poll 1', 'poll 2'].forEach((name, i) =>
        s.text(px[i], PB + 14, name, { align: 'center', w: 60, color: k.mid }),
    )
    s.path(`M${px[0]} ${py(4)} V${py(10)} H${px[2]} V${py(12)} H${PL + PW} V${py(4)} Z`, 'none', {
        fill: tint(k.wait, 0.14),
        width: 0,
    })
    s.path(`M${PL} ${py(4)} H${px[0]} V${py(10)} H${px[2]} V${py(12)} H${PL + PW}`, k.state, {
        width: 2.5,
    })
    s.path(`M${PL} ${py(4)} H${PL + PW}`, k.pass, { width: 2.5 })
    s.text(px[1], py(10) - 11, 'desired', { align: 'center', w: 60, color: k.state, weight: 700 })
    s.text(px[1], py(4) + 13, 'ready', { align: 'center', w: 60, color: k.pass, weight: 700 })
    s.text(px[1] + 10, py(7), 'a plan, not capacity', {
        align: 'center',
        color: k.wait,
        weight: 700,
    })

    const T = 262
    s.text(T, 208, 'Poll 0: 50 requests', { weight: 600 })
    s.text(T, 228, 'desired goes from 4 to 10', { color: k.mid })
    s.text(T, 256, 'Poll 1: same demand', { weight: 600 })
    s.text(T, 276, 'desired stays 10, ready still 4', { color: k.mid })
    s.text(T, 304, 'Poll 2: 56 requests', { weight: 600 })
    s.text(T, 324, 'desired goes to 12', { color: k.mid })

    s.line(8, 360, 502, 360, k.line)

    // The supply path a pending replica has to walk.
    s.text(8, 380, 'What a pending pod still has to do', { color: k.faint })
    s.text(8, 400, 'Existing streams continue meanwhile.', { color: k.faint })
    const steps: Array<[string, string?]> = [
        ['Provision', 'node'],
        ['Pull', 'image'],
        ['Load', 'weights'],
        ['Warm', 'up'],
        ['Ready'],
        ['Traffic'],
    ]
    const W = 70
    const G = 14.8
    steps.forEach(([a, b], i) => {
        const x = 8 + i * (W + G)
        const done = i >= 4
        s.rect(x, 418, W, 52, {
            fill: tint(done ? k.pass : k.state, 0.12),
            stroke: done ? k.pass : k.state,
        })
        if (b) {
            s.text(x + W / 2, 434, a, { align: 'center', w: W, weight: 600 })
            s.text(x + W / 2, 454, b, { align: 'center', w: W, weight: 600 })
        } else s.text(x + W / 2, 444, a, { align: 'center', w: W, weight: 700, color: k.pass })
        if (i < steps.length - 1) s.arrow(x + W + 1, 444, x + W + G - 1, 444, k.mid)
    })
    return s.render()
}
