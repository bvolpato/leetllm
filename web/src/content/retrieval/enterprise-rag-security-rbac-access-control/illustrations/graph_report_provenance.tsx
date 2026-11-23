import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, arrow, at, curve, figure, kit, label, marks, plane, row, tint } from './_kit'

export const width = 640
export const height = 503
export const alt =
    'An ops report draws on the checklist and the ops FAQ. A mixed report also draws on the security-only key source. An ops-only reader may use the ops report and is blocked from the mixed one. A reader in both groups may use both. If the key grant is removed, the same reader keeps the ops report and loses the mixed one. Only allowed reports reach map and reduce.'

const SOURCE_W = 262
const REPORT_X = 360
const REPORT_W = INNER - REPORT_X
const SOURCES = [
    ['1. checklist v1', 'tenant-wide', 0],
    ['2. ops FAQ v3', 'ops-team', 72],
    ['3. key v7', 'security-team', 144],
] as const
const SOURCE_H = 64
const REPORTS = [
    ['Ops report', '1 + 2', 22],
    ['Mixed report', '1 + 2 + 3', 118],
] as const
const REPORT_H = 68
const PRINCIPAL = 324
const VERDICT = 146
const RULES: [string, string, boolean, boolean][] = [
    ['ops only', '', true, false],
    ['ops + security', '', true, true],
    ['same reader,', 'key grant removed', true, false],
]

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const pill = (allow: boolean) => (
        <div
            style={{
                display: 'flex',
                width: VERDICT - 12,
                height: 34,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                fontSize: S,
                fontWeight: 600,
                color: allow ? k.go : k.stop,
                border: `1.25px solid ${allow ? k.go : k.stop}`,
                backgroundColor: tint(allow ? k.go : k.stop, 0.12),
            }}
        >
            {allow ? 'allow' : 'block'}
        </div>
    )
    const midS = SOURCES.map((source) => source[2] + SOURCE_H / 2)
    const midR = REPORTS.map((report) => report[2] + REPORT_H / 2)
    const top = 208
    return figure(
        k,
        <>
            {plane(
                INNER,
                top,
                <>
                    {marks(
                        INNER,
                        top,
                        <>
                            {curve(k.mid, SOURCE_W, midS[0]!, REPORT_X, midR[0]! - 10)}
                            {curve(k.mid, SOURCE_W, midS[1]!, REPORT_X, midR[0]! + 10)}
                            {curve(k.mid, SOURCE_W, midS[0]!, REPORT_X, midR[1]! - 14)}
                            {curve(k.mid, SOURCE_W, midS[1]!, REPORT_X, midR[1]!)}
                            {curve(k.stop, SOURCE_W, midS[2]!, REPORT_X, midR[1]! + 14)}
                        </>,
                    )}
                    {SOURCES.map(([name, grant, y]) =>
                        at(
                            0,
                            y,
                            <>
                                {label(k, name, { size: S, weight: 600, width: SOURCE_W - 24 })}
                                {label(k, grant, {
                                    mono: true,
                                    size: S,
                                    color: grant === 'security-team' ? k.stop : k.mid,
                                    width: SOURCE_W - 24,
                                })}
                            </>,
                            {
                                flexDirection: 'column',
                                justifyContent: 'center',
                                width: SOURCE_W,
                                height: SOURCE_H,
                                padding: '0 11px',
                                boxSizing: 'border-box',
                                borderRadius: 3,
                                border: `1.25px solid ${grant === 'security-team' ? k.stop : k.line}`,
                            },
                        ),
                    )}
                    {REPORTS.map(([name, ids, y]) =>
                        at(
                            REPORT_X,
                            y,
                            <>
                                {label(k, name, { size: S, weight: 600, width: REPORT_W - 24 })}
                                {label(k, `sources ${ids}`, {
                                    size: S,
                                    color: k.mid,
                                    width: REPORT_W - 24,
                                })}
                            </>,
                            {
                                flexDirection: 'column',
                                justifyContent: 'center',
                                width: REPORT_W,
                                height: REPORT_H,
                                padding: '0 11px',
                                boxSizing: 'border-box',
                                borderRadius: 3,
                                border: `1.25px solid ${k.ink}`,
                            },
                        ),
                    )}
                </>,
            )}
            {row(
                <>
                    {label(k, 'Reader, with current grants', {
                        size: S,
                        color: k.mid,
                        weight: 600,
                        width: PRINCIPAL,
                    })}
                    {label(k, 'Ops', { size: S, weight: 600, width: VERDICT, align: 'center' })}
                    {label(k, 'Mixed', { size: S, weight: 600, width: VERDICT, align: 'center' })}
                </>,
                { marginTop: 4 },
            )}
            {RULES.map(([name, sub, ops, mixed]) => (
                <React.Fragment key={name}>
                    {row(
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: PRINCIPAL,
                                }}
                            >
                                {label(k, name, { size: S, width: PRINCIPAL - 8 })}
                                {sub
                                    ? label(k, sub, {
                                          size: S,
                                          color: k.stop,
                                          weight: 600,
                                          width: PRINCIPAL - 8,
                                      })
                                    : null}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    width: VERDICT,
                                    justifyContent: 'center',
                                }}
                            >
                                {pill(ops)}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    width: VERDICT,
                                    justifyContent: 'center',
                                }}
                            >
                                {pill(mixed)}
                            </div>
                        </>,
                        { padding: '6px 0', borderTop: `1px solid ${k.line}` },
                    )}
                </React.Fragment>
            ))}
            {row(
                <>
                    {label(k, 'Only allowed reports go on', { size: S, weight: 600, width: 262 })}
                    <div style={{ display: 'flex', margin: '0 10px' }}>{arrow(k.go, 30)}</div>
                    {label(k, 'Map', { size: S, weight: 600 })}
                    <div style={{ display: 'flex', margin: '0 10px' }}>{arrow(k.go, 30)}</div>
                    {label(k, 'Reduce', { size: S, weight: 600 })}
                </>,
                { paddingTop: 9, borderTop: `1px solid ${k.line}` },
            )}
        </>,
        3,
    )
}
export default create('dark')
