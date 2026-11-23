import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, arrow, box, figure, kit, label, row, space } from './_kit'

export const width = 680
export const height = 460
export const alt =
    'The v2.4-canary proposal at 10 percent of traffic needs release approval and a security review. The figure then splits into two columns. On the left, when both approvals are present, the executor rechecks that they still cover this exact proposal, and then traffic moves. On the right, a missing or denied approval holds the change, and a challenge to that hold goes to an independent reviewer, who sees the original record and why it was decided, and upholds or corrects it.'

const COL = 322
const GAP = 20

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const down = (color: string, text: string) =>
        row(
            <>
                {arrow(color, 34, 'down')}
                {text ? label(k, text, { color, style: { marginLeft: 8 } }) : null}
            </>,
            { width: COL, paddingLeft: 20, boxSizing: 'border-box', height: 42 },
        )
    return figure(
        k,
        <>
            {box(
                k,
                row(
                    <>
                        {label(k, 'Proposal', { weight: 600 })}
                        {label(k, 'v2.4-canary at 10% of traffic', {
                            color: k.mid,
                            style: { marginLeft: 12 },
                        })}
                    </>,
                    { justifyContent: 'center' },
                ),
                { color: k.data, width: INNER },
            )}
            {row(
                <>
                    {space(INNER / 2 - 8, 34)}
                    {arrow(k.mid, 34, 'down')}
                </>,
                { height: 42 },
            )}
            {box(
                k,
                label(k, 'Release approval + security review', { weight: 600, align: 'center' }),
                { color: k.ask, width: INNER },
            )}
            {row(
                <>
                    {down(k.go, 'both present')}
                    {space(GAP)}
                    {down(k.stop, 'missing or denied')}
                </>,
            )}
            {row(
                <>
                    {box(
                        k,
                        <>
                            {label(k, 'Executor rechecks', { weight: 600 })}
                            {label(k, 'still this exact proposal?', { color: k.mid })}
                        </>,
                        { color: k.go, width: COL },
                    )}
                    {space(GAP)}
                    {box(
                        k,
                        <>
                            {label(k, 'Hold', { weight: 600, color: k.stop })}
                            {label(k, 'nothing moves', { color: k.mid })}
                        </>,
                        { color: k.stop, fill: true, width: COL },
                    )}
                </>,
            )}
            {row(
                <>
                    {down(k.go, '')}
                    {space(GAP)}
                    {down(k.mid, 'challenge')}
                </>,
            )}
            {row(
                <>
                    {box(k, label(k, 'Traffic moves', { weight: 600 }), {
                        color: k.go,
                        fill: true,
                        width: COL,
                    })}
                    {space(GAP)}
                    {box(
                        k,
                        <>
                            {label(k, 'Independent reviewer', { weight: 600 })}
                            {label(k, 'sees the original record and why it was decided', {
                                color: k.mid,
                            })}
                            {label(k, 'upholds or corrects', { weight: 600 })}
                        </>,
                        { width: COL },
                    )}
                </>,
                { alignItems: 'flex-start' },
            )}
        </>,
        0,
    )
}

export default create('dark')
