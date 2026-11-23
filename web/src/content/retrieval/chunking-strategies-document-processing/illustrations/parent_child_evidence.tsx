import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, arrow, box, col, figure, kit, label, mark, phrase, row, tint } from './_kit'

export const width = 640
export const height = 436
export const alt =
    'A query about a failed rollback on deploy pay-742 matches the short indexed child 15 minutes with deploy ID. After checks that the link is current, the caller may read the parent, and the section fits the budget, its pointer returns the complete rollback section from page 7 of incident-runbook-v3.pdf.'

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const hit = tint(k.data, 0.2)
    const check = (text: string) =>
        row(
            <>
                {mark('yes', k.go, 16)}
                {label(k, text, { size: S, color: k.mid, style: { marginLeft: 7 } })}
            </>,
        )
    return figure(
        k,
        <>
            {label(k, 'A rollback failed on deploy pay-742.', { color: k.data, weight: 600 })}
            <div style={{ display: 'flex', marginLeft: 118 }}>{arrow(k.data, 24, 'down')}</div>
            {row(
                <>
                    {box(k, label(k, '15 minutes with deploy ID', { weight: 600, size: S }), {
                        color: k.data,
                        fill: true,
                        width: 286,
                        height: 62,
                    })}
                    {box(
                        k,
                        label(k, 'Rollback failure: page on-call within', {
                            size: S,
                            color: k.mid,
                            width: 280,
                        }),
                        { width: 306, height: 62, style: { marginLeft: 24 } },
                    )}
                </>,
            )}
            {label(k, 'Short children in the index', {
                size: S,
                color: k.mid,
                style: { marginTop: 3 },
            })}
            {row(
                <>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: 118,
                            marginLeft: 66,
                        }}
                    >
                        {arrow(k.data, 74, 'down')}
                    </div>
                    {col(
                        <>
                            {check('the link matches the current version')}
                            {check('this caller may read the parent')}
                            {check('the whole section fits the budget')}
                        </>,
                        { gap: 3 },
                    )}
                </>,
                { margin: '6px 0' },
            )}
            {box(
                k,
                <>
                    {label(k, 'Rollback failure: page on-call within', { width: INNER - 24 })}
                    {phrase(k, [{ text: '15 minutes with deploy ID.', fill: hit, weight: 600 }])}
                    {label(k, 'incident-runbook-v3.pdf, page 7', {
                        mono: true,
                        color: k.mid,
                        style: { marginTop: 3 },
                    })}
                </>,
                { color: k.data, width: INNER },
            )}
            {label(k, 'The whole section, which the model reads and cites', {
                size: S,
                color: k.mid,
                style: { marginTop: 3 },
            })}
        </>,
        3,
    )
}
export default create('dark')
