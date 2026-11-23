import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, at, curve, figure, kit, label, mark, marks, plane, row, tint } from './_kit'

export const width = 640
export const height = 449
export const alt =
    'Three answer claims each have a solid line to the policy rule in the prompt, which supports them, and a dashed line to a rollback runbook that was never selected, which they cite. The checks run in order: the selected context includes the policy rule and passes, faithfulness passes at 3 of 3, citation support fails at 0 of 3 as the first failure, and completeness stays unscored.'

const CLAIMS = ['Freeze rule applies', 'Commander must approve', 'Rollback plan must be linked']
const LEFT = 232
const RIGHT = 400
const Y = [0, 62, 124]
const CLAIM_H = 54

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const doc = (
        y: number,
        name: string,
        sub: string,
        color: string,
        dashed: boolean,
        fill: boolean,
    ) =>
        at(
            RIGHT,
            y,
            <>
                {label(k, name, { weight: 600, size: S, width: INNER - RIGHT - 24 })}
                {label(k, sub, { size: S, color, width: INNER - RIGHT - 24 })}
            </>,
            {
                flexDirection: 'column',
                justifyContent: 'center',
                width: INNER - RIGHT,
                height: 66,
                padding: '0 11px',
                boxSizing: 'border-box',
                borderRadius: 3,
                border: `1.25px ${dashed ? 'dashed' : 'solid'} ${color}`,
                backgroundColor: fill ? tint(color, 0.1) : 'transparent',
            },
        )
    const gate = (name: string, value: string, kind: 'pass' | 'fail' | 'none', note = '') => {
        const color = kind === 'pass' ? k.go : kind === 'fail' ? k.stop : k.mid
        return row(
            <>
                <div style={{ display: 'flex', width: 26, justifyContent: 'center' }}>
                    {kind === 'none' ? (
                        <div
                            style={{
                                display: 'flex',
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                border: `1.25px solid ${k.mid}`,
                                boxSizing: 'border-box',
                            }}
                        />
                    ) : (
                        mark(kind === 'pass' ? 'yes' : 'no', color, 16)
                    )}
                </div>
                {label(k, name, {
                    size: S,
                    weight: kind === 'fail' ? 600 : 400,
                    color: kind === 'none' ? k.mid : k.ink,
                    width: 192,
                })}
                {label(k, value, {
                    size: S,
                    weight: 600,
                    color,
                    width: 112,
                    mono: value.includes('-'),
                })}
                {label(k, note, {
                    size: S,
                    color,
                    weight: kind === 'fail' ? 600 : 400,
                    width: 262,
                })}
            </>,
            {
                padding: '8px 4px',
                backgroundColor: kind === 'fail' ? tint(k.stop, 0.09) : 'transparent',
                borderTop: `1px solid ${k.line}`,
            },
        )
    }
    return figure(
        k,
        <>
            {plane(
                INNER,
                220,
                <>
                    {marks(
                        INNER,
                        220,
                        <>
                            {Y.map((y, i) => (
                                <React.Fragment key={`s${i}`}>
                                    {curve(k.go, LEFT, y + CLAIM_H / 2 - 8, RIGHT, 22 + i * 12)}
                                </React.Fragment>
                            ))}
                            {Y.map((y, i) => (
                                <React.Fragment key={`c${i}`}>
                                    {curve(
                                        k.stop,
                                        LEFT,
                                        y + CLAIM_H / 2 + 8,
                                        RIGHT,
                                        112 + i * 12,
                                        '5 5',
                                    )}
                                </React.Fragment>
                            ))}
                        </>,
                    )}
                    {CLAIMS.map((claim, i) =>
                        at(0, Y[i]!, label(k, claim, { size: S, weight: 600, width: LEFT - 24 }), {
                            width: LEFT,
                            height: CLAIM_H,
                            alignItems: 'center',
                            padding: '0 11px',
                            boxSizing: 'border-box',
                            borderRadius: 3,
                            border: `1.25px solid ${k.line}`,
                        }),
                    )}
                    {doc(4, 'Freeze policy rule', 'in the prompt', k.go, false, true)}
                    {doc(94, 'Rollback runbook', 'never selected', k.stop, true, false)}
                    {at(
                        0,
                        190,
                        row(
                            <>
                                <svg width={28} height={8} viewBox="0 0 28 8">
                                    <path d="M0 4 H28" stroke={k.go} strokeWidth={1.5} />
                                </svg>
                                {label(k, 'supported by', {
                                    size: S,
                                    color: k.go,
                                    style: { margin: '0 18px 0 6px' },
                                })}
                                <svg width={28} height={8} viewBox="0 0 28 8">
                                    <path
                                        d="M0 4 H28"
                                        stroke={k.stop}
                                        strokeWidth={1.5}
                                        strokeDasharray="5 5"
                                    />
                                </svg>
                                {label(k, 'cited as', {
                                    size: S,
                                    color: k.stop,
                                    style: { marginLeft: 6 },
                                })}
                            </>,
                        ),
                    )}
                </>,
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {gate('Context has the rule', 'policy-v2', 'pass')}
                {gate('Faithfulness', '3 of 3', 'pass')}
                {gate('Citation support', '0 of 3', 'fail', 'first failure: start here')}
                {gate('Completeness', 'unscored', 'none')}
            </div>
        </>,
        10,
    )
}
export default create('dark')
