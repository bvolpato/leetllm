import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, at, figure, kit, label, marks, plane, tint } from './_kit'

export const width = 640
export const height = 396
export const alt =
    'Five steps run top to bottom for a document with chunks c0 and c1 in two tenants. In tenant A, both chunks start granted at revision r1. A missed revocation leaves them still granted and stale. Reconciliation updates both to no grants at r2. Replaying the old r1 updates nothing. Deletion at r3 updates both. Tenant B has the same document ID, keeps r1 and ops-team, and never changes.'

const STEP_X = 26
const STATE_X = 208
const COUNT_X = 394
const B_X = 484
const HEAD = 60
const ROW = 56
const STEPS: [string, string, 'go' | 'stop' | 'plain' | 'gone', string][] = [
    ['Start', 'granted, r1', 'go', 'initial'],
    ['Revocation missed', 'still granted, r1', 'stop', 'none'],
    ['Reconcile to r2', 'no grants, r2', 'plain', '2 chunks'],
    ['Replay old r1', 'no grants, r2', 'plain', '0 chunks'],
    ['Delete at r3', 'deleted, r3', 'gone', '2 chunks'],
]

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const rowY = (i: number) => HEAD + i * ROW
    const bottom = rowY(STEPS.length)
    const cell = (i: number) => {
        const [, text, kind] = STEPS[i]!
        const color = kind === 'go' ? k.go : kind === 'stop' ? k.stop : k.line
        return at(
            STATE_X,
            rowY(i) + 4,
            label(k, text, {
                size: S,
                weight: kind === 'stop' || kind === 'go' ? 600 : 400,
                color:
                    kind === 'go'
                        ? k.go
                        : kind === 'stop'
                          ? k.stop
                          : kind === 'gone'
                            ? k.mid
                            : k.ink,
                width: 164,
            }),
            {
                width: 178,
                height: ROW - 8,
                alignItems: 'center',
                padding: '0 7px',
                boxSizing: 'border-box',
                borderRadius: 3,
                border: `1.25px ${kind === 'gone' ? 'dashed' : 'solid'} ${color}`,
                backgroundColor:
                    kind === 'go' || kind === 'stop' ? tint(color, 0.12) : 'transparent',
            },
        )
    }
    return figure(
        k,
        plane(
            INNER,
            bottom + 2,
            <>
                {marks(
                    INNER,
                    bottom,
                    <>
                        <path
                            d={`M8 ${rowY(0) + 12} V${rowY(STEPS.length - 1) + ROW / 2}`}
                            stroke={k.mid}
                            strokeWidth={1.25}
                        />
                        {STEPS.map((step, i) => (
                            <circle
                                key={step[0]}
                                cx={8}
                                cy={rowY(i) + ROW / 2}
                                r={4.5}
                                fill={i === 1 ? k.stop : k.mid}
                            />
                        ))}
                    </>,
                )}
                {at(STATE_X, 0, label(k, 'Tenant A, c0, c1', { size: S, weight: 600, width: 180 }))}
                {at(
                    STATE_X,
                    27,
                    label(k, 'security-team', { mono: true, size: S, color: k.mid, width: 180 }),
                )}
                {at(COUNT_X, 0, label(k, 'Updates', { size: S, weight: 600, width: 84 }))}
                {at(B_X, 0, label(k, 'Tenant B', { size: S, weight: 600, width: 130 }))}
                {at(
                    B_X,
                    27,
                    label(k, 'ops-team', { mono: true, size: S, color: k.mid, width: 130 }),
                )}
                {STEPS.map(([step, , , count], i) => (
                    <React.Fragment key={step}>
                        {at(
                            STEP_X,
                            rowY(i) + 14,
                            label(k, step, {
                                size: S,
                                weight: i === 1 ? 600 : 400,
                                color: i === 1 ? k.stop : k.ink,
                                width: 176,
                            }),
                        )}
                        {cell(i)}
                        {at(
                            COUNT_X,
                            rowY(i) + 14,
                            label(k, count, {
                                size: S,
                                weight: count === '2 chunks' ? 600 : 400,
                                color: i === 1 ? k.stop : k.ink,
                                width: 84,
                            }),
                        )}
                    </React.Fragment>
                ))}
                {at(
                    B_X,
                    rowY(0) + 4,
                    <>
                        {label(k, 'Same document ID', { size: S, color: k.mid, width: 120 })}
                        {label(k, 'granted, r1, at every step', {
                            size: S,
                            weight: 600,
                            width: 120,
                            style: { marginTop: 8 },
                        })}
                    </>,
                    {
                        flexDirection: 'column',
                        width: INNER - B_X,
                        height: ROW * STEPS.length - 8,
                        padding: '10px',
                        boxSizing: 'border-box',
                        borderRadius: 3,
                        backgroundColor: tint(k.mid, 0.1),
                    },
                )}
            </>,
        ),
    )
}
export default create('dark')
