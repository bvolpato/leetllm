import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, at, col, figure, kit, label, mark, marks, plane, row, tint } from './_kit'

export const width = 640
export const height = 510
export const alt =
    'Five records meet a permission and validity check. The key rule, session rule, and audit note pass; the old key rule and admin recovery do not. A matrix then crosses two queries with two lanes. For KROT-14, BM25 finds the key rule, and cosine depends on the encoder, with no toy axis for a code. For refresh expired machine credential, BM25 has no candidates because no word is shared, and cosine points almost along the key rule axis, scoring 0.9987 against 0.0510 for the session rule.'

const CELL = 302
const GAP = 12

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const record = (text: string, ok: boolean) =>
        row(
            <>
                {mark(ok ? 'yes' : 'no', ok ? k.go : k.stop, 16)}
                {label(k, text, { size: S, color: ok ? k.ink : k.mid, style: { marginLeft: 4 } })}
            </>,
            { marginRight: 14 },
        )
    const cell = (color: string, children: React.ReactNode, minHeight = 124) => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: CELL,
                minHeight,
                gap: 3,
                padding: '9px 11px',
                boxSizing: 'border-box',
                borderRadius: 3,
                backgroundColor: tint(color, 0.09),
                borderLeft: `2px solid ${color}`,
            }}
        >
            {children}
        </div>
    )
    const head = (ok: 'yes' | 'no' | null, text: string, color: string) =>
        row(
            <>
                {ok ? mark(ok, color, 16) : null}
                {label(k, text, { weight: 600, size: S, style: ok ? { marginLeft: 6 } : {} })}
            </>,
        )
    const body = (text: string) => label(k, text, { size: S, color: k.mid, width: CELL - 26 })
    const O = { x: 8, y: 66 }
    const unit = 170
    const q = { x: O.x + 0.98 * unit, y: O.y - 0.05 * unit }
    return figure(
        k,
        <>
            {col(
                <>
                    {label(k, 'Both lanes search only what passes the check', {
                        size: S,
                        weight: 600,
                        width: INNER,
                    })}
                    <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 3 }}>
                        {record('key rule', true)}
                        {record('session rule', true)}
                        {record('audit note', true)}
                        {record('old key rule', false)}
                        {record('admin recovery', false)}
                    </div>
                </>,
                { gap: 5, paddingBottom: 9, borderBottom: `1px solid ${k.line}` },
            )}
            {row(
                <>
                    {label(k, 'BM25 matches tokens', {
                        color: k.data,
                        weight: 600,
                        width: CELL + GAP,
                    })}
                    {label(k, 'Cosine matches direction', {
                        color: k.model,
                        weight: 600,
                        width: CELL,
                    })}
                </>,
            )}
            {label(k, 'KROT-14', { mono: true, weight: 600 })}
            {row(
                <>
                    {cell(
                        k.go,
                        <>
                            {head('yes', 'finds the key rule', k.go)}
                            {body(
                                'The token krot-14 is in one passage, so it outweighs common words.',
                            )}
                        </>,
                    )}
                    <div style={{ display: 'flex', width: GAP }} />
                    {cell(
                        k.ask,
                        <>
                            {head(null, 'depends on the encoder', k.ask)}
                            {body(
                                'Our toy axes have no place for a code, which may carry little meaning. We run a real model below.',
                            )}
                        </>,
                    )}
                </>,
                { alignItems: 'stretch' },
            )}
            {label(k, 'refresh expired machine credential', { weight: 600, size: S, width: INNER })}
            {row(
                <>
                    {cell(
                        k.stop,
                        <>
                            {head('no', 'no candidates at all', k.stop)}
                            {body('Not one of these words appears in the policy.')}
                        </>,
                    )}
                    <div style={{ display: 'flex', width: GAP }} />
                    {cell(
                        k.go,
                        plane(
                            CELL - 26,
                            102,
                            <>
                                {marks(
                                    CELL - 26,
                                    102,
                                    <>
                                        <path
                                            d={`M${O.x} ${O.y} H${O.x + unit + 16}`}
                                            stroke={k.mid}
                                            strokeWidth={1.25}
                                        />
                                        <path
                                            d={`M${O.x} ${O.y} V${O.y - 58}`}
                                            stroke={k.mid}
                                            strokeWidth={1.25}
                                        />
                                        <path
                                            d={`M${O.x} ${O.y} L${q.x} ${q.y}`}
                                            stroke={k.model}
                                            strokeWidth={2}
                                        />
                                        <circle cx={q.x} cy={q.y} r={4} fill={k.model} />
                                    </>,
                                )}
                                {at(
                                    O.x + 6,
                                    0,
                                    label(k, 'session rule 0.0510', {
                                        size: S,
                                        color: k.mid,
                                        width: 200,
                                    }),
                                )}
                                {at(
                                    O.x + 6,
                                    O.y + 6,
                                    label(k, 'key rule 0.9987', {
                                        size: S,
                                        color: k.go,
                                        weight: 600,
                                        width: 200,
                                    }),
                                )}
                                {at(
                                    q.x + 8,
                                    q.y - 13,
                                    label(k, 'query', {
                                        size: S,
                                        color: k.model,
                                        weight: 600,
                                        width: 60,
                                    }),
                                )}
                            </>,
                        ),
                    )}
                </>,
                { alignItems: 'stretch' },
            )}
        </>,
        7,
    )
}
export default create('dark')
