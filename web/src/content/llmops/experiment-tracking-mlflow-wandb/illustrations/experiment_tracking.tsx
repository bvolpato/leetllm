import React from 'react'
import {
    Column,
    LineChart,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 815
export const autoSize = false
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'Two stacked panels summarize four tracked MLflow runs evaluated on frozen split b54d7ceab650 (n = 120). Top: validation log-loss across training steps 1 to 25 converges from 0.270 to 0.187 for alpha 0.001 and from 0.274 to 0.204 for alpha 0.005, whereas heavy regularization alpha 0.5 stalls at 0.513. Bottom: a Pareto plot of unsafe route rate versus false abstain rate shows alpha 0.5 at (17.5%, 3.3%) dominated behind three frontier operating thresholds: loose tau 0.30 at (8.3%, 2.5%), balanced tau 0.50 at (1.7%, 5.8%), and strict tau 0.82 at (0.8%, 10.8%).'

type Style = Record<string, unknown>
const el = (s: Style, ...c: React.ReactNode[]) =>
    React.createElement('div', { style: { display: 'flex', ...s } }, ...c)
const tx = (color: string, t: string | number, ex: Style = {}) =>
    el({ fontSize: 23, fontWeight: 400, fontFamily: 'Inter', color, ...ex }, t)
const dot = (x: number, y: number, r: number) =>
    `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`

function Pareto(raw: ThemeColors, w: number, tones: string[]) {
    const [blue, green, warm, red] = tones
    const [pw, ph] = [300, 152]
    const sx = (x: number) => 12 + (x / 20) * (pw - 24)
    const sy = (y: number) => ph - 12 - (y / 16) * (ph - 24)
    const pts = [
        [0.83, 10.83, 'strict (τ=0.82)', '0.8% unsafe · 10.8% abs', blue],
        [1.67, 5.83, 'balanced (τ=0.50)', '1.7% unsafe · 5.8% abs', green],
        [8.33, 2.5, 'loose (τ=0.30)', '8.3% unsafe · 2.5% abs', warm],
        [17.5, 3.33, 'α=0.5 underfit', '17.5% unsafe · 3.3% abs', red],
    ] as const
    const grid = [4, 8, 12, 16].map((v) => `M ${sx(0)} ${sy(v)} H ${sx(20)}`)
    grid.push(...[5, 10, 15, 20].map((v) => `M ${sx(v)} ${sy(16)} V ${sy(0)}`))
    const frontier = pts.slice(0, 3).map(([x, y], i) => `${i ? 'L' : 'M'} ${sx(x)} ${sy(y)}`)
    const ticks = (vals: number[], s: Style) =>
        el(s, ...vals.map((v) => tx(raw.textMuted, v, { fontFamily: 'JetBrains Mono' })))
    const svg = (
        <svg width={pw} height={ph}>
            <path d={grid.join(' ')} fill="none" stroke={raw.borderSubtle} />
            <path d={frontier.join(' ')} fill="none" stroke={green} strokeWidth={3} />
            <path d={dot(sx(0), sy(0), 7)} fill="none" stroke={green} strokeDasharray="3 3" />
            {pts.map(([x, y, t, , c]) => (
                <path
                    key={t}
                    d={dot(sx(x), sy(y), 8)}
                    fill={c}
                    stroke={raw.bgCard}
                    strokeWidth={2}
                />
            ))}
        </svg>
    )
    const key = ([, , t, s, c]: (typeof pts)[number]) =>
        el(
            { gap: 8, alignItems: 'flex-start' },
            el({ width: 14, height: 14, borderRadius: 7, backgroundColor: c, marginTop: 6 }),
            el(
                { flexDirection: 'column' },
                tx(c, t, { fontWeight: 700, fontFamily: 'JetBrains Mono' }),
                tx(raw.textPrimary, s),
            ),
        )
    const yAx = { flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }
    const plot = el(
        { flexDirection: 'column', gap: 4 },
        el({ gap: 8 }, ticks([16, 12, 8, 4, 0], { ...yAx, width: 38, height: ph }), svg),
        ticks([0, 5, 10, 15, 20], { width: pw, marginLeft: 46, justifyContent: 'space-between' }),
        tx(raw.textSecondary, 'Unsafe route rate (%)', {
            width: pw,
            marginLeft: 46,
            justifyContent: 'center',
        }),
    )
    const card = { width: w, padding: 12, borderRadius: 12, backgroundColor: raw.bgCard }
    return el(
        { ...card, flexDirection: 'column', gap: 6, border: `1px solid ${raw.borderSubtle}` },
        tx(raw.textPrimary, 'Safety vs. abstention Pareto frontier (%), n = 120', {
            fontWeight: 700,
        }),
        tx(raw.textSecondary, 'False abstain (%)', { fontWeight: 600 }),
        el(
            { gap: 14, alignItems: 'flex-start' },
            plot,
            el({ flexDirection: 'column', gap: 6 }, ...pts.map(key)),
        ),
    )
}

export function create(theme: ThemeMode = 'dark') {
    const raw = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const innerW = width - 28
    const tones = ['blue', 'green', 'warm', 'red'].map((t) =>
        getReadableToneColor(t as 'blue', raw),
    )
    const [blue, green, , red] = tones
    const series = [
        { name: 'α=0.5 underfit', points: [0.514, 0.513, 0.513, 0.513, 0.513, 0.513], color: red },
        { name: 'α=0.005', points: [0.274, 0.211, 0.205, 0.204, 0.204, 0.204], color: green },
        { name: 'α=0.001', points: [0.27, 0.201, 0.191, 0.188, 0.187, 0.187], color: blue },
    ]
    const c = withDensity({ ...raw, shadow: 'transparent' }, 2.3)
    const footnote =
        'loose (τ=0.30) and strict (τ=0.82) share checkpoint SHA 76f7f16a274a; only τ changed.'
    return Scene({
        c: raw,
        background: raw.bg,
        padding: 14,
        gap: 8,
        contentWidth: innerW,
        children: Column({
            width: innerW,
            gap: 8,
            children: [
                LineChart({
                    c,
                    width: innerW,
                    height: 155,
                    title: 'Validation log-loss (holdout b54d7ceab650)',
                    labels: ['1', '5', '10', '15', '20', '25'],
                    min: 0.1,
                    max: 0.58,
                    showGrid: true,
                    showPoints: true,
                    directLabels: false,
                    series,
                }),
                Pareto(raw, innerW, tones),
                TextLabel({
                    c: raw,
                    text: footnote,
                    width: innerW,
                    fontSize: 23,
                    align: 'left',
                    color: raw.textSecondary,
                }),
            ],
        }),
    })
}

export default create('dark')
