import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 470
export const alt =
    'One sampled response produces reward 1.35 and a sampled reference charge of 0.32, giving return 1.03. The critic value 0.80 is subtracted to produce advantage 0.23. With policy ratio 1.20, the clipped surrogate is 0.276. Reward and reference are frozen roles; critic and actor are trainable roles. This example does not imply four simultaneously resident model copies.'

interface Step {
    name: string[]
    role: string
    from: number
    to: number
    text: string
    tone: ToneName
    total?: boolean
}
const steps: Step[] = [
    { name: ['Reward'], role: 'frozen', from: 0, to: 1.35, text: '1.35', tone: 'green' },
    { name: ['Reference'], role: 'frozen', from: 1.35, to: 1.03, text: '-0.32', tone: 'critical' },
    { name: ['Return'], role: '', from: 0, to: 1.03, text: '1.03', tone: 'blue', total: true },
    { name: ['Critic'], role: 'trains', from: 1.03, to: 0.23, text: '-0.80', tone: 'critical' },
    { name: ['Advantage'], role: '', from: 0, to: 0.23, text: '0.23', tone: 'blue', total: true },
    {
        name: ['Surrogate'],
        role: 'ratio 1.20',
        from: 0,
        to: 0.276,
        text: '0.276',
        tone: 'purple',
        total: true,
    },
]

export const layoutHeight = (L: Layout) => (L.print ? 244 : 470)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const axisW = L.print ? 40 : 52
    const colW = (L.W - axisW - 8) / steps.length
    const colX = (i: number) => axisW + i * colW
    const top = L.print ? 26 : 34
    const plotH = L.print ? 150 : 290
    const base = top + plotH
    const map = (value: number) => base - (value / 1.5) * plotH
    const barW = colW * 0.62

    ;[0, 0.5, 1, 1.5].forEach((tick) => {
        k.line(axisW - 4, map(tick), L.W - 6, map(tick), {
            opacity: tick === 0 ? 1 : 0.3,
            stroke: tick === 0 ? c.textMuted : c.border,
        })
        k.t(2, map(tick) - L.S * 0.7, axisW - 8, tick.toFixed(1), {
            size: L.S,
            align: 'right',
            color: c.textSecondary,
        })
    })
    steps.forEach((step, i) => {
        const x = colX(i) + (colW - barW) / 2
        const upper = Math.max(step.from, step.to)
        const lower = Math.min(step.from, step.to)
        k.rect(x, map(upper), barW, map(lower) - map(upper), {
            fill: k.tint(step.tone, step.total ? 0.6 : 0.42),
            stroke: k.ink(step.tone),
            rx: 0,
        })
        k.t(colX(i), map(upper) - L.S * 1.45, colW, step.text, {
            size: L.S,
            align: 'center',
            weight: 600,
        })
        const next = steps[i + 1]
        if (next)
            k.arrow(
                x + barW,
                map(step.to),
                colX(i + 1) + (colW - barW) / 2,
                map(next.to === 0.276 ? 0.276 : step.to),
                {
                    dash: next.to === 0.276 ? undefined : '3 3',
                    stroke: c.textMuted,
                    size: L.print ? 4.5 : 5.5,
                },
            )
        k.t(colX(i) - 2, base + 6, colW + 4, step.name[0], { size: L.S, align: 'center' })
        if (step.role)
            k.t(colX(i) - 2, base + 6 + L.S * 1.3, colW + 4, step.role, {
                size: L.S,
                align: 'center',
                color: step.role === 'trains' ? k.ink('green') : c.textSecondary,
            })
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
