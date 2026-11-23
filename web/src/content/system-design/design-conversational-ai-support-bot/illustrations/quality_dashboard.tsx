import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { col, figure, kit, label, mark, row, tint } from './_kit'

export const width = 680
export const height = 520
export const alt =
    'Top: twelve tiles, one per named scenario, grouped by outcome: six handoffs, three abstentions, one policy reply, one confirmation, and one queued request, with 12 of 12 correct. Bottom: the stored effects. The expected row is T3 for 35 dollars on invoice A10234. An extra row, a hidden 10 dollar credit on invoice A10236, is flagged as unexpected even though all twelve scenarios above report the right outcome.'

const GROUPS: [string, string[]][] = [
    ['Handoff', ['T1', 'T8', 'T4', 'T6', 'T7', 'T11']],
    ['Abstain', ['T5', 'T9', 'T10']],
    ['Policy reply', ['T0']],
    ['Confirm', ['T2']],
    ['Queued', ['T3']],
]
const KEY = 208
const INVOICE = 96
const USD = 60

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const cell = (
        text: string,
        w: number,
        o: { mono?: boolean; color?: string; weight?: number } = {},
    ) => label(k, text, { width: w, mono: o.mono, color: o.color, weight: o.weight })
    const stored = (
        key: string,
        invoice: string,
        amount: string,
        flag: React.ReactNode,
        color?: string,
    ) =>
        row(
            <>
                {cell(key, KEY, { mono: true, color })}
                {cell(invoice, INVOICE, { mono: true, color })}
                {cell(amount, USD, { mono: true, color })}
                {flag}
            </>,
            { padding: '6px 8px', backgroundColor: color ? tint(color, 0.14) : 'transparent' },
        )
    return figure(
        k,
        <>
            {row(
                <>
                    {label(k, 'What the scenarios report', { weight: 700 })}
                    {row(
                        <>
                            {mark('yes', k.go)}
                            {label(k, '12 of 12 correct', {
                                weight: 700,
                                color: k.go,
                                style: { marginLeft: 5 },
                            })}
                        </>,
                    )}
                </>,
                { justifyContent: 'space-between' },
            )}
            {GROUPS.map(([name, cases]) =>
                row(
                    <>
                        {label(k, name, { color: k.mid, width: 130 })}
                        <div style={{ display: 'flex', gap: 4 }}>
                            {cases.map((c) => (
                                <div
                                    style={{
                                        display: 'flex',
                                        width: 52,
                                        height: 32,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: tint(k.go, 0.16),
                                        border: `1.5px solid ${k.go}`,
                                        boxSizing: 'border-box',
                                        fontFamily: k.mono,
                                        fontSize: 20,
                                        color: k.go,
                                    }}
                                >
                                    {c}
                                </div>
                            ))}
                        </div>
                    </>,
                ),
            )}
            <svg width={width - 40} height={12} style={{ display: 'block', margin: '4px 0' }}>
                <line x1={0} y1={6} x2={width - 40} y2={6} stroke={k.line} strokeWidth={1.5} />
            </svg>
            {col(
                <>
                    {label(k, 'What the backend stored', { weight: 700 })}
                    {row(
                        <>
                            {cell('key', KEY, { color: k.mid })}
                            {cell('invoice', INVOICE, { color: k.mid })}
                            {cell('USD', USD, { color: k.mid })}
                        </>,
                        { padding: '0 8px 3px', borderBottom: `1px solid ${k.line}` },
                    )}
                    {stored(
                        'T3:credit:A10234',
                        'A10234',
                        '35',
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {mark('yes', k.go, 16)}
                            {cell('expected', 120, { color: k.go })}
                        </div>,
                    )}
                    {stored(
                        'hidden-credit',
                        'A10236',
                        '10',
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {mark('no', k.stop, 16)}
                            {cell('unexpected', 120, { color: k.stop, weight: 700 })}
                        </div>,
                        k.stop,
                    )}
                    {label(k, 'Only comparing stored rows catches it', {
                        weight: 600,
                        color: k.stop,
                        style: { marginTop: 6 },
                    })}
                </>,
                { gap: 4, borderTop: `1px solid ${k.line}`, paddingTop: 10, marginTop: 6 },
            )}
        </>,
        6,
    )
}

export default create('dark')
