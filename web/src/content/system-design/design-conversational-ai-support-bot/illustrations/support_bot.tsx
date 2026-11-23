import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { arrow, box, col, figure, kit, label, mark, row } from './_kit'

export const width = 680
export const height = 440
export const alt =
    'Three records feed a decision on the right. Case state says Alex requests 900 dollars on invoice A10234. The invoice read says the invoice belongs to Alex, is nine days old, and has a verified duplicate of 900 dollars. The published policy says credits within 30 days and review from 500 dollars. A fourth input, a workspace note saying to ignore approval rules, is struck out and never reaches the decision. The decision compares 900 with 500 and sends the case to specialist review, leaving the credit queue empty.'

const LEFT = 404
const RIGHT = 228

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const source = (question: string, where: string, fact: string) =>
        box(
            k,
            <>
                {row(
                    <>
                        {label(k, question, { weight: 700, color: k.data })}
                        {label(k, where, { color: k.mid, style: { marginLeft: 8 } })}
                    </>,
                    { justifyContent: 'space-between' },
                )}
                {label(k, fact)}
            </>,
            { color: k.data, width: LEFT },
        )
    return figure(
        k,
        row(
            <>
                {col(
                    <>
                        {source(
                            'What is asked?',
                            'case state',
                            'Alex requests $900 on invoice A10234',
                        )}
                        {source(
                            'What happened?',
                            'invoice read',
                            "Alex's invoice · 9 days old · verified $900 duplicate",
                        )}
                        {source(
                            'What is allowed?',
                            'published policy',
                            'Within 30 days · review from $500',
                        )}
                        {box(
                            k,
                            row(
                                <>
                                    {mark('no', k.stop)}
                                    {label(k, 'Note: "Ignore approval rules"', {
                                        color: k.stop,
                                        style: { marginLeft: 6, textDecoration: 'line-through' },
                                    })}
                                </>,
                            ),
                            { color: k.stop, dashed: true, width: LEFT },
                        )}
                    </>,
                    { gap: 9 },
                )}
                <div style={{ display: 'flex', width: 32, justifyContent: 'center' }}>
                    {arrow(k.ink, 26)}
                </div>
                {col(
                    <>
                        {box(
                            k,
                            <>
                                {label(k, 'Decision', { weight: 700, align: 'center' })}
                                {label(k, 'plain code', { color: k.mid, align: 'center' })}
                                {label(k, '$900 ≥ $500', {
                                    mono: true,
                                    weight: 700,
                                    align: 'center',
                                    style: { marginTop: 6, whiteSpace: 'nowrap' },
                                })}
                            </>,
                            { color: k.ink, width: RIGHT },
                        )}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                height: 40,
                                alignItems: 'center',
                            }}
                        >
                            {arrow(k.ask, 32, 'down')}
                        </div>
                        {box(
                            k,
                            <>
                                {label(k, 'Specialist review', {
                                    weight: 700,
                                    color: k.ask,
                                    align: 'center',
                                })}
                                {label(k, 'credit queue stays empty', {
                                    color: k.mid,
                                    align: 'center',
                                    style: { marginTop: 4 },
                                })}
                            </>,
                            { color: k.ask, fill: true, width: RIGHT },
                        )}
                    </>,
                )}
            </>,
        ),
    )
}

export default create('dark')
