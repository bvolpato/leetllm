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
export const height = 600
export const autoSize = false
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'A pairwise judge evaluates compact and stepwise replies in reversed slot orders. When run one picks slot B and run two picks slot A, both select stepwise so stepwise wins. When both runs pick slot B, the selected candidate flips from stepwise to compact, so the pair moves to human review.'

const box = (ex: Record<string, unknown>, ...ch: React.ReactNode[]) =>
    React.createElement('div', { style: { display: 'flex', ...ex } }, ...ch)
const txt = (c: string, t: string, fw = 400) =>
    box({ fontSize: 24, fontWeight: fw, fontFamily: 'Inter', color: c }, t)

function SwapCase(
    raw: ThemeColors,
    innerW: number,
    title: string,
    accent: string,
    runs: [string, string][],
    outTitle: string,
    outSub: string,
    outTone: string,
) {
    const runBox = ([a, b]: [string, string]) =>
        box(
            {
                flexDirection: 'column',
                gap: 2,
                width: 356,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1.5px solid ${accent}`,
                backgroundColor: raw.bg,
            },
            txt(raw.textPrimary, a, 700),
            txt(accent, b, 600),
        )
    const outBox = box(
        {
            flexDirection: 'column',
            gap: 2,
            width: 318,
            padding: '10px 14px',
            borderRadius: 8,
            border: `2px solid ${outTone}`,
            backgroundColor: raw.bg,
        },
        txt(outTone, outTitle, 700),
        txt(raw.textSecondary, outSub),
    )
    const mergeSvg = (
        <svg width={64} height={104} viewBox="0 0 64 104">
            <path
                d={`M 2 22 C 30 22, 24 52, 48 52 M 2 82 C 30 82, 24 52, 48 52`}
                fill="none"
                stroke={accent}
                strokeWidth={2.5}
            />
            <path d="M 46 45 L 59 52 L 46 59 Z" fill={accent} />
        </svg>
    )
    return box(
        {
            flexDirection: 'column',
            gap: 8,
            width: innerW,
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${raw.borderSubtle}`,
            backgroundColor: raw.bgCard,
        },
        txt(accent, title, 700),
        box(
            { alignItems: 'center', justifyContent: 'space-between' },
            box({ flexDirection: 'column', gap: 8 }, runBox(runs[0]), runBox(runs[1])),
            mergeSvg,
            outBox,
        ),
    )
}

export function create(theme: ThemeMode = 'dark') {
    const raw = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const [blue, green, warm, red] = ['blue', 'green', 'warm', 'red'].map((t) =>
        getReadableToneColor(t as 'blue', raw),
    )
    const innerW = width - 28
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
                SwapCase(
                    raw,
                    innerW,
                    'Order-consistent winner -> Accept stepwise',
                    blue,
                    [
                        ['Run 1: (compact, stepwise)', 'Vote B -> stepwise'],
                        ['Run 2: (stepwise, compact)', 'Vote A -> stepwise'],
                    ],
                    'Winner: stepwise',
                    'Order-consistent pick',
                    green,
                ),
                SwapCase(
                    raw,
                    innerW,
                    'Slot-dependent flip -> Escalate to review',
                    warm,
                    [
                        ['Run 1: (compact, stepwise)', 'Vote B -> stepwise'],
                        ['Run 2: (stepwise, compact)', 'Vote B -> compact'],
                    ],
                    'Route to review',
                    'Slot preference detected',
                    red,
                ),
                TextLabel({
                    c: raw,
                    text: 'Reversing slot order turns hidden position bias into an explicit flip signal.',
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
