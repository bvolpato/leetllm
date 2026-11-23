import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { S, figure, kit, label, mark, row, tint } from './_kit'

export const width = 640
export const height = 310
export const alt =
    'A matrix scores complete, partial, and unsafe answers against the release freeze scope, approval, and the rollback plan. The complete answer supports all three, for faithfulness 3 of 3 and completeness 3 of 3. The partial answer supports two and omits rollback, for 2 of 2 and 2 of 3. The unsafe answer supports scope, omits approval, and reverses rollback, for 1 of 2 and 1 of 3.'

const NAME = 92
const CELL = 86
const SCORE = 133
type Status = 'yes' | 'omitted' | 'reversed'
const ROWS: [string, Status[], [number, number], [number, number]][] = [
    ['Complete', ['yes', 'yes', 'yes'], [3, 3], [3, 3]],
    ['Partial', ['yes', 'yes', 'omitted'], [2, 2], [2, 3]],
    ['Unsafe', ['yes', 'omitted', 'reversed'], [1, 2], [1, 3]],
]

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const status = (s: Status, key: number) => (
        <div
            key={key}
            style={{
                display: 'flex',
                width: CELL - 4,
                height: 46,
                marginRight: 4,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                backgroundColor:
                    s === 'yes'
                        ? tint(k.go, 0.13)
                        : s === 'reversed'
                          ? tint(k.stop, 0.14)
                          : 'transparent',
                border: s === 'omitted' ? `1.25px dashed ${k.line}` : '0px solid transparent',
            }}
        >
            {s === 'yes'
                ? mark('yes', k.go, 18)
                : label(k, s, {
                      size: S,
                      color: s === 'reversed' ? k.stop : k.mid,
                      weight: s === 'reversed' ? 600 : 400,
                  })}
        </div>
    )
    const score = ([got, total]: [number, number], color: string) => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: SCORE,
                gap: 3,
                paddingLeft: 8,
                boxSizing: 'border-box',
            }}
        >
            {label(k, `${got} of ${total}`, { weight: 600, color: got === total ? k.ink : color })}
            <div
                style={{
                    display: 'flex',
                    width: 100,
                    height: 5,
                    backgroundColor: tint(k.mid, 0.18),
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        width: (100 * got) / total,
                        height: 5,
                        backgroundColor: got === total ? k.go : color,
                    }}
                />
            </div>
        </div>
    )
    const scoreHead = (name: string, sub: string) => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: SCORE,
                paddingLeft: 8,
                boxSizing: 'border-box',
            }}
        >
            {label(k, name, { size: S, weight: 600, width: SCORE - 8 })}
            {label(k, sub, { size: S, color: k.mid, width: SCORE - 8 })}
        </div>
    )
    return figure(
        k,
        <>
            {row(
                <>
                    <div style={{ display: 'flex', width: NAME }} />
                    {['Scope', 'Approval', 'Rollback'].map((name) => (
                        <React.Fragment key={name}>
                            {label(k, name, { size: S, weight: 600, width: CELL, align: 'center' })}
                        </React.Fragment>
                    ))}
                    {scoreHead('Faithfulness', 'claims made')}
                    {scoreHead('Completeness', 'points owed')}
                </>,
                { alignItems: 'flex-end' },
            )}
            <svg width={640 - 24} height={4} viewBox="0 0 616 4" style={{ margin: '2px 0' }}>
                <line x1={0} y1={2} x2={616} y2={2} stroke={k.line} strokeWidth={1.5} />
            </svg>
            {ROWS.map(([name, cells, faithful, complete]) => (
                <React.Fragment key={name}>
                    {row(
                        <>
                            {label(k, name, { size: S, weight: 600, width: NAME })}
                            {cells.map((cell, i) => status(cell, i))}
                            {score(faithful, k.stop)}
                            {score(complete, k.ask)}
                        </>,
                    )}
                </React.Fragment>
            ))}
            {row(
                <>
                    {mark('yes', k.go, 16)}
                    {label(k, 'supported by the rule', {
                        size: S,
                        color: k.mid,
                        style: { marginLeft: 6 },
                    })}
                </>,
                { marginTop: 4 },
            )}
        </>,
        6,
    )
}
export default create('dark')
