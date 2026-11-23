import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
    type Canvas,
} from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 432
export const alt =
    'For W = [0.3, 2], the selected AWQ channel transform uses D = diag(8, 1), so W times D is [2.4, 2] and the first activation row divides by 8. Each calibration column keeps the same product sum [5, 0.4, minus 1, minus 4.4] before rounding. Factors 1, 2, and 4 reconstruct the first weight as 2/7; factor 8 reconstructs it as 0.3 and moves the neighbor to 2.0571429. Calibration MSE falls to 0.003265 and held-out MSE is 0.000816 across the four-factor sweep.'

const X = 92
const WIDE = 404
const at = (v: number) => X + (v / 0.6) * WIDE

function ruler(
    s: Canvas,
    y: number,
    name: string,
    stepName: string,
    step: number,
    snapped: number,
    color: string,
) {
    const k = s.k
    s.text(8, y - 9, name, { weight: 700 })
    s.text(8, y + 10, stepName, { color: k.mid })
    s.line(X, y, X + WIDE, y, k.mid)
    for (let i = 0; i * step <= 0.6 + 1e-9; i++)
        s.line(at(i * step), y - 7, at(i * step), y + 7, k.mid)
    s.line(at(0.3), y - 18, at(0.3), y - 5, k.prefill)
    s.dot(at(0.3), y - 21, 4, k.prefill)
    s.rect(at(snapped) - 4.5, y - 4.5, 9, 9, { fill: color, r: 1 })
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    s.text(8, 12, 'W = [0.3, 2]: the first weight on its effective grid', { color: k.faint })
    ruler(s, 60, 'Factor 1', 'step 2/7', 2 / 7, 2 / 7, k.wait)
    s.text(at(2 / 7) - 8, 84, 'snaps to 2/7', { align: 'right', color: k.wait, weight: 600 })
    ruler(s, 124, 'Factor 8', 'step 3/70', 3 / 70, 0.3, k.pass)
    s.text(at(0.3), 148, 'lands exactly on 0.3', { align: 'center', color: k.pass, weight: 600 })
    s.dot(X + 4, 176, 4, k.prefill)
    s.text(X + 14, 176, 'true weight 0.3')
    s.rect(X + 138.5, 171.5, 9, 9, { fill: k.mid, r: 1 })
    s.text(X + 154, 176, 'rebuilt value')

    s.line(8, 196, 502, 196, k.line)
    const C = [8, 68, 136, 220, 310]
    ;['Factor', 'Step', 'First', 'Second', 'Calibration MSE'].forEach((name, i) =>
        s.text(C[i], 216, name, { color: k.faint }),
    )
    const MSE = 112 / 0.016735
    const rows: Array<[string, string, string, string, number]> = [
        ['× 1', '2/7', '2/7', '2.0000', 0.016735],
        ['× 2', '1/7', '2/7', '2.0000', 0.016735],
        ['× 4', '1/14', '2/7', '2.0000', 0.016735],
        ['× 8', '3/70', '0.3000', '2.0571', 0.003265],
    ]
    rows.forEach(([factor, step, first, second, mse], r) => {
        const y = 242 + r * 26
        const best = r === 3
        const color = best ? k.pass : k.ink
        const weight = best ? 700 : 500
        s.text(C[0], y, factor, { color, weight })
        s.text(C[1], y, step, { color, weight })
        s.text(C[2], y, first, { mono: true, color, weight })
        s.text(C[3], y, second, { mono: true, color, weight })
        s.rect(C[4], y - 7, mse * MSE, 14, { fill: best ? k.pass : tint(k.wait, 0.7) })
        s.text(C[4] + mse * MSE + 6, y, mse.toFixed(4), { color, weight })
    })

    s.line(8, 348, 502, 348, k.line)
    s.text(8, 368, 'At factor 8, W · D = [2.4, 2], and row 1 of X divides by 8.')
    s.text(8, 392, 'Dot products stay [5, 0.4, −1, −4.4] before rounding.', { color: k.mid })
    s.text(8, 416, 'Held-out MSE at factor 8: 0.000816.', { color: k.mid })
    return s.render()
}
