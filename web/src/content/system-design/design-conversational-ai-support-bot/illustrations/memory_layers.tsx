import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    INNER,
    area,
    col,
    dot,
    figure,
    hbar,
    hline,
    kit,
    label,
    mark,
    pin,
    row,
    tint,
    vline,
} from './_kit'

export const width = 680
export const height = 330
export const alt =
    "A dollar axis from zero to 1,000 with the review threshold marked at 500. A lossy summary's value of 90 dollars lands below the threshold, and it is not used to decide because a summary may only shape a draft. The validated case state's value of 900 dollars lands above the threshold, and it is the value the decision reads, sending the case to a specialist."

const NOTE = 244
const BAND = 66
const x = (usd: number) => (usd / 1000) * INNER

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const line = (
        name: string,
        source: string,
        usd: number,
        color: string,
        note: React.ReactNode,
    ) =>
        col(
            <>
                {row(
                    <>
                        {label(k, name, { weight: 700, color })}
                        {label(k, source, { color: k.mid, style: { marginLeft: 10 } })}
                    </>,
                )}
                {area(
                    INNER,
                    BAND,
                    <>
                        {hbar(x(500), 0, x(500), BAND, tint(k.ask, 0.1))}
                        {vline(x(500), 0, BAND, k.ask, true)}
                        {dot(x(usd), BAND / 2, 18, color)}
                        {pin(usd < 500 ? x(usd) + 16 : x(usd) - 16 - NOTE, 8, note, {
                            width: NOTE,
                            align: usd < 500 ? 'left' : 'right',
                        })}
                    </>,
                )}
            </>,
            { gap: 3 },
        )
    return figure(
        k,
        <>
            {area(
                INNER,
                26,
                pin(
                    x(500) + 6,
                    0,
                    label(k, 'Specialist review from $500', {
                        weight: 600,
                        color: k.ask,
                        style: { whiteSpace: 'nowrap' },
                    }),
                ),
            )}
            {line(
                'Summary: $90',
                'lossy, model-written',
                90,
                k.model,
                col(
                    <>
                        {row(
                            <>
                                {mark('no', k.stop, 15)}
                                {label(k, 'not used to decide', {
                                    weight: 600,
                                    color: k.stop,
                                    style: { marginLeft: 4 },
                                })}
                            </>,
                        )}
                        {label(k, 'may only shape a draft', { color: k.mid })}
                    </>,
                ),
            )}
            {line(
                'Case state: $900',
                'validated',
                900,
                k.data,
                col(
                    <>
                        {label(k, 'the decision reads it', { weight: 600, align: 'right' })}
                        {label(k, 'goes to a specialist', {
                            color: k.ask,
                            weight: 600,
                            align: 'right',
                        })}
                    </>,
                    { alignItems: 'flex-end' },
                ),
            )}
            {area(
                INNER,
                30,
                <>
                    {hline(0, 0, INNER, k.faint)}
                    {[0, 250, 500, 750, 1000].map((v) =>
                        pin(
                            v === 0 ? 0 : v === 1000 ? INNER - 74 : x(v) - 26,
                            4,
                            label(k, `$${v.toLocaleString('en-US')}`, { mono: true, color: k.mid }),
                        ),
                    )}
                </>,
            )}
        </>,
        6,
    )
}

export default create('dark')
