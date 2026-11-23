import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, at, figure, hArrow, kit, label, mark, marks, plane, row, tint } from './_kit'

export const width = 640
export const height = 390
export const alt =
    'Four permitted candidates keep their identities in hybrid order. Hand-written pair scores on one axis give troubleshooting minus 1, password reset 0, the AUTH-14 rule plus 7, and audit export plus 2. Only AUTH-14 clears the plus 5 threshold, so it moves from rank three to the first context slot, and the second slot stays empty. An admin-only record and a superseded version were removed before scoring.'

const AXIS_LEFT = 184
const AXIS_W = 280
const SLOT_LEFT = 490
const X = (score: number) => AXIS_LEFT + ((score + 2) / 10) * AXIS_W
const ROW_Y = (i: number) => 56 + i * 46
const CANDIDATES = [
    { rank: 1, name: 'Troubleshooting', score: -1 },
    { rank: 2, name: 'Password reset', score: 0 },
    { rank: 3, name: 'AUTH-14 rule', score: 7 },
    { rank: 4, name: 'Audit export', score: 2 },
]
const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0')

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const chartBottom = ROW_Y(4) - 8
    return figure(
        k,
        plane(
            INNER,
            chartBottom + 96,
            <>
                {at(
                    0,
                    0,
                    label(k, 'Hybrid order', { size: S, weight: 600, color: k.mid, width: 170 }),
                )}
                {at(
                    AXIS_LEFT,
                    0,
                    label(k, 'Pair score, by hand', {
                        size: S,
                        weight: 600,
                        color: k.mid,
                        width: 200,
                    }),
                )}
                {at(
                    SLOT_LEFT,
                    0,
                    label(k, 'Context, 2 at most', {
                        size: S,
                        weight: 600,
                        color: k.mid,
                        width: INNER - SLOT_LEFT,
                        style: { lineHeight: 1.15 },
                    }),
                )}
                {[-2, 0, 2, 4, 6, 8].map((tick) => (
                    <React.Fragment key={tick}>
                        {at(X(tick), 48, null, {
                            width: 1,
                            height: chartBottom - 48,
                            backgroundColor: tick === 0 ? k.mid : k.line,
                        })}
                        {at(
                            X(tick) - 20,
                            chartBottom + 2,
                            label(k, signed(tick), {
                                size: S,
                                color: k.mid,
                                width: 40,
                                align: 'center',
                            }),
                        )}
                    </React.Fragment>
                ))}
                {at(X(5), 32, null, {
                    width: 0,
                    height: chartBottom - 32,
                    borderLeft: `1.5px dashed ${k.go}`,
                })}
                {at(
                    X(5) - 112,
                    26,
                    label(k, '+5 to enter', {
                        size: S,
                        weight: 600,
                        color: k.go,
                        width: 106,
                        align: 'right',
                    }),
                )}
                {marks(INNER, chartBottom, hArrow(k.go, X(7) + 40, SLOT_LEFT, ROW_Y(2) + 14))}
                {CANDIDATES.map((candidate, i) => {
                    const y = ROW_Y(i)
                    const wins = candidate.score >= 5
                    const left = Math.min(X(0), X(candidate.score))
                    const w = Math.abs(X(candidate.score) - X(0))
                    return (
                        <React.Fragment key={candidate.name}>
                            {at(
                                0,
                                y + 2,
                                row(
                                    <>
                                        {label(k, String(candidate.rank), {
                                            size: S,
                                            color: k.mid,
                                            width: 20,
                                        })}
                                        {label(k, candidate.name, {
                                            size: S,
                                            weight: wins ? 600 : 400,
                                            color: wins ? k.go : k.ink,
                                            width: 160,
                                        })}
                                    </>,
                                ),
                            )}
                            {candidate.score !== 0
                                ? at(left, y, null, {
                                      width: w,
                                      height: 28,
                                      backgroundColor: wins ? k.go : tint(k.mid, 0.4),
                                  })
                                : null}
                            {at(
                                (candidate.score < 0 ? X(0) : X(candidate.score)) + 7,
                                y + 2,
                                label(k, signed(candidate.score), {
                                    size: S,
                                    weight: 600,
                                    width: 30,
                                }),
                            )}
                        </React.Fragment>
                    )
                })}
                {at(
                    SLOT_LEFT,
                    ROW_Y(2) - 8,
                    label(k, 'AUTH-14', { size: S, weight: 600, width: 90 }),
                    {
                        width: INNER - SLOT_LEFT,
                        height: 44,
                        alignItems: 'center',
                        padding: '0 10px',
                        boxSizing: 'border-box',
                        borderRadius: 3,
                        border: `1.25px solid ${k.go}`,
                        backgroundColor: tint(k.go, 0.14),
                    },
                )}
                {at(
                    SLOT_LEFT,
                    ROW_Y(3) - 2,
                    label(k, 'empty', { size: S, color: k.mid, width: 104 }),
                    {
                        width: INNER - SLOT_LEFT,
                        height: 40,
                        alignItems: 'center',
                        padding: '0 10px',
                        boxSizing: 'border-box',
                        borderRadius: 3,
                        border: `1.25px dashed ${k.line}`,
                    },
                )}
                {at(
                    0,
                    chartBottom + 36,
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: INNER,
                            paddingTop: 8,
                            gap: 2,
                            borderTop: `1px solid ${k.line}`,
                        }}
                    >
                        {label(k, 'Removed before scoring', {
                            size: S,
                            weight: 600,
                            color: k.mid,
                            width: INNER,
                        })}
                        {row(
                            <>
                                {mark('no', k.stop, 15)}
                                {label(k, 'admin-only record', {
                                    size: S,
                                    style: { margin: '0 18px 0 5px' },
                                })}
                                {mark('no', k.stop, 15)}
                                {label(k, 'superseded v1', { size: S, style: { marginLeft: 5 } })}
                            </>,
                        )}
                    </div>,
                )}
            </>,
        ),
    )
}
export default create('dark')
