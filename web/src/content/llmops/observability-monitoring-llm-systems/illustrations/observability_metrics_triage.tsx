import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
    type Canvas,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 278
export const alt =
    'Four requests have the same annotated claim-generation failure label. Traces trace-02 and trace-03 are withheld by deploy-answerer-v1; traces trace-05 and trace-06 pass through the serving gate to operators under deploy-answerer-v1.1-regression. The version association guides investigation; compare artifacts and reproduce to test cause.'

const X = [8, 180, 352]
const W = 150
const H = 62

function stage(s: Canvas, col: number, y: number, title: string, detail: string, color: string) {
    s.rect(X[col], y, W, H, { fill: tint(color, 0.12), stroke: color })
    s.text(X[col] + 8, y + 20, title, { weight: 700, color, w: W - 10 })
    s.text(X[col] + 8, y + 42, detail, { w: W - 10 })
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const path = (y0: number, version: string, ids: string, ok: boolean) => {
        s.text(8, y0, version, { mono: true, weight: 700 })
        s.text(502, y0, ids, { mono: true, align: 'right', color: k.mid })
        const y = y0 + 14
        const edge = ok ? k.pass : k.fail
        stage(s, 0, y, 'Claim generation', '2 unsupported', k.wait)
        s.arrow(X[0] + W + 2, y + H / 2, X[1] - 2, y + H / 2, edge, { width: 1.5 })
        stage(s, 1, y, 'Serving gate', ok ? 'held, abstain' : 'leaked, serve', ok ? k.pass : k.fail)
        s.arrow(X[1] + W + 2, y + H / 2, X[2] - 2, y + H / 2, edge, {
            width: 1.5,
            dash: ok ? '4 3' : undefined,
        })
        stage(s, 2, y, 'Operator', ok ? 'no unsafe claim' : '2 unsafe claims', ok ? k.pass : k.fail)
    }
    path(12, 'deploy-answerer-v1', 'trace-02 · trace-03', true)
    path(116, 'deploy-answerer-v1.1-regression', 'trace-05 · trace-06', false)
    s.line(8, 208, 502, 208, k.line)
    s.text(8, 230, 'Observed difference: containment outcome.', { weight: 700 })
    s.text(8, 254, 'Compare the artifacts, then reproduce the case.', { color: k.mid })
    return s.render()
}
