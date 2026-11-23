import React from 'react'
import {
    BarChart,
    Column,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 740
export const autoSize = false
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'Two stacked charts compare blocked-request rates and 95 percent Wilson confidence intervals across user paths against a 25 percent disparity policy ceiling. The top bar chart shows web console at 0.0 percent (0/20), combined average at 14.3 percent (4/28, below the 25 percent limit), and screen reader at 50.0 percent (4/8), twice the limit. The bottom interval plot shows 95 percent Wilson intervals spanning 0.0 to 16.1 percent for web console, 5.7 to 31.5 percent combined, and 21.5 to 78.5 percent for screen reader (Fisher exact p = 0.0034).'

const tx = (color: string, weight = 400, mono = false, extra = {}) => ({
    display: 'flex' as const,
    fontSize: 23,
    fontWeight: weight,
    fontFamily: mono ? 'JetBrains Mono' : 'Inter',
    color,
    ...extra,
})
const row = (gap = 10, extra = {}) => ({
    display: 'flex' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap,
    ...extra,
})
const D = (style: Record<string, unknown>, ...ch: React.ReactNode[]) =>
    React.createElement('div', { style }, ...ch)
const ln = (
    k: string | number,
    p: [number, number, number, number],
    s: string,
    w: number,
    d?: string,
) => (
    <line
        key={k}
        x1={p[0]}
        y1={p[1]}
        x2={p[2]}
        y2={p[3]}
        stroke={s}
        strokeWidth={w}
        strokeDasharray={d}
        strokeLinecap={w >= 5 ? 'round' : undefined}
    />
)

function WilsonCard(raw: ThemeColors, innerW: number, blue: string, warm: string, red: string) {
    const pw = 285
    const sx = (p: number) => 10 + (p / 100) * (pw - 20)
    const rows = [
        ['Web (n=20)', 0, 0, 16.1, '[0.0, 16.1]%', blue],
        ['Combined (n=28)', 5.7, 14.3, 31.5, '[5.7, 31.5]%', warm],
        ['Screen (n=8)', 21.5, 50, 78.5, '[21.5, 78.5]%', red],
    ] as const
    const card = {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        gap: 10,
        width: innerW,
        padding: 14,
        borderRadius: 12,
        border: `1px solid ${raw.borderSubtle}`,
        backgroundColor: raw.bgCard,
    }
    const header = D(
        row(8, { justifyContent: 'space-between' }),
        D(tx(raw.textPrimary, 700), '95% Wilson confidence intervals (%)'),
        D(tx(warm, 700), '25% limit'),
    )
    const body = rows.map(([lbl, lo, mid, hi, span, col]) =>
        D(
            row(10),
            D(tx(raw.textPrimary, 600, false, { width: 205 }), lbl),
            <svg width={pw} height={34} viewBox={`0 0 ${pw} 34`}>
                {ln('bg', [sx(0), 17, sx(100), 17], raw.borderSubtle, 2)}
                {[0, 25, 50, 75, 100].map((t) =>
                    ln(t, [sx(t), 10, sx(t), 24], raw.borderLight, 1.5),
                )}
                {ln('lim', [sx(25), 2, sx(25), 32], warm, 2.5, '4 3')}
                {ln('ci', [sx(lo), 17, sx(hi), 17], col, 6)}
                {ln('lo', [sx(lo), 8, sx(lo), 26], col, 2.5)}
                {ln('hi', [sx(hi), 8, sx(hi), 26], col, 2.5)}
                <circle cx={sx(mid)} cy={17} r={7} fill={col} stroke={raw.bgCard} strokeWidth={2} />
            </svg>,
            D(tx(raw.textPrimary, 600, true, { width: 190, justifyContent: 'flex-end' }), span),
        ),
    )
    const ticks = ['0%', '25%', '50%', '75%', '100%'].map((t) => D({ display: 'flex' }, t))
    const scale = D(
        row(10),
        D(tx(raw.textMuted, 400, false, { width: 205 }), 'Block rate scale'),
        D(tx(raw.textMuted, 400, true, { width: pw, justifyContent: 'space-between' }), ...ticks),
        D(tx(raw.textMuted, 400, true, { width: 190, justifyContent: 'flex-end' }), 'p = 0.0034'),
    )
    return D(card, header, ...body, scale)
}

export function create(theme: ThemeMode = 'dark') {
    const raw = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...raw, shadow: 'transparent' }, 2.3)
    const innerW = width - 32
    const [blue, warm, red] = ['blue', 'warm', 'red'].map((t) =>
        getReadableToneColor(t as 'blue', raw),
    )
    return Scene({
        c: raw,
        background: raw.bg,
        padding: 16,
        gap: 10,
        contentWidth: innerW,
        children: Column({
            width: innerW,
            gap: 10,
            children: [
                BarChart({
                    c,
                    width: innerW,
                    height: 195,
                    title: 'Block rate vs. 25% disparity limit',
                    format: (v: number) => `${Math.round(v)}%`,
                    min: 0,
                    max: 60,
                    showGrid: true,
                    showValues: true,
                    data: [
                        { label: 'Web (0/20)', value: 0, color: blue, valueLabel: '0.0%' },
                        { label: 'Combined (4/28)', value: 14.3, color: warm, valueLabel: '14.3%' },
                        { label: 'Screen (4/8)', value: 50, color: red, valueLabel: '50.0%' },
                    ],
                }),
                WilsonCard(raw, innerW, blue, warm, red),
                TextLabel({
                    c: raw,
                    text: 'Disaggregating by client path exposes the 50.0% screen-reader block rate before rollout.',
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
