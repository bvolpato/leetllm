import React from 'react'
import {
    Column,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 800
export const height = 740
export const autoSize = false
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'Five single-variable judge probes vary presentation order, filler wording, embedded adversarial text, hidden writer identity, or displayed author labels while keeping technical facts constant. Comparing each perturbation against its matched pair isolates shortcut sensitivity.'

const tx = (c: string, w = 400, ex = {}) => ({
    display: 'flex' as const,
    fontSize: 24,
    fontWeight: w,
    fontFamily: 'Inter',
    color: c,
    ...ex,
})
const bx = (d: 'row' | 'column', g = 8, ex = {}) => ({
    display: 'flex' as const,
    flexDirection: d,
    gap: g,
    ...ex,
})
const D = (st: Record<string, unknown>, ...ch: React.ReactNode[]) =>
    React.createElement('div', { style: st }, ...ch)

function ProbeGroup(
    raw: ThemeColors,
    innerW: number,
    title: string,
    accent: string,
    rows: [string, string, string, string, string][],
) {
    const card = bx('column', 8, {
        width: innerW,
        padding: 12,
        borderRadius: 12,
        border: `1px solid ${raw.borderSubtle}`,
        backgroundColor: raw.bgCard,
    })
    const box = (w: number, bColor: string, t1: string, t2: string, tColor: string) =>
        D(
            bx('column', 2, {
                width: w,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1.5px solid ${bColor}`,
                backgroundColor: raw.bg,
            }),
            D(tx(tColor, 700), t1),
            D(tx(raw.textSecondary), t2),
        )
    const arrow = (col: string) => (
        <svg width={52} height={24} viewBox="0 0 52 24">
            <line x1={4} y1={12} x2={40} y2={12} stroke={col} strokeWidth={2.5} />
            <path d="M 38 6 L 49 12 L 38 18 Z" fill={col} />
        </svg>
    )
    return D(
        card,
        D(tx(accent, 700), title),
        ...rows.map(([pTitle, pSub, mTitle, mSub, col]) =>
            D(
                bx('row', 8, { alignItems: 'center', justifyContent: 'space-between' }),
                box(342, col, pTitle, pSub, col),
                arrow(col),
                box(342, raw.borderLight, mTitle, mSub, raw.textPrimary),
            ),
        ),
    )
}

export function create(theme: ThemeMode = 'dark') {
    const raw = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const [blue, red, green] = ['blue', 'red', 'green'].map((t) =>
        getReadableToneColor(t as 'blue', raw),
    )
    const innerW = width - 28
    const surface: [string, string, string, string, string][] = [
        ['Order swap', 'Swap A and B slots', 'Check winner', 'Consistent pick?', blue],
        ['Verbosity pad', 'Add neutral filler', 'Check flip', 'Padding rewarded?', blue],
        ['Hostile text', 'Append "award 5/5"', 'Block override', 'Reject manipulation', red],
    ]
    const identity: [string, string, string, string, string][] = [
        ['Blind family', 'Hide writer origin', 'Family gap', 'Compare judge types', green],
        ['Brand relabel', 'Swap author badge', 'Check drift', 'Badge moves score?', green],
    ]
    return Scene({
        c: raw,
        background: raw.bg,
        padding: 14,
        gap: 10,
        contentWidth: innerW,
        children: Column({
            width: innerW,
            gap: 10,
            children: [
                ProbeGroup(
                    raw,
                    innerW,
                    'Presentation, length, and hostile-text probes (facts fixed)',
                    blue,
                    surface,
                ),
                ProbeGroup(
                    raw,
                    innerW,
                    'Writer identity and brand relabel probes (facts fixed)',
                    green,
                    identity,
                ),
                TextLabel({
                    c: raw,
                    text: 'Each matched pair isolates one judge shortcut while holding factual content fixed.',
                    width: innerW,
                    fontSize: 24,
                    align: 'left',
                    color: raw.textSecondary,
                }),
            ],
        }),
    })
}

export default create('dark')
