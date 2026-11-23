import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    INNER,
    area,
    arrow,
    box,
    col,
    figure,
    kit,
    label,
    mark,
    pin,
    row,
    space,
    split,
} from './_kit'

export const width = 680
export const height = 480
export const alt =
    'A first draft says I have credited 900 dollars back to your account, and the reply checks flag a prohibited promise and a missing citation. The system allows one revision with the same sources. A second draft says only that credits of this size go to a specialist, and every check runs again. If the checks pass, the reply is sent after a status sentence that a template renders from case state: a specialist needs to review your 900 dollar credit request. If they fail, or the shared deadline or budget runs out, the system abstains or hands off.'

const FIRST = 274
const BRIDGE = 96
const SECOND = 294
const OUT = 322
const STEM = FIRST + BRIDGE + SECOND / 2
const SPLIT = 62

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const draft = (
        name: string,
        quote: string,
        color: string,
        boxWidth: number,
        extra?: React.ReactNode,
    ) =>
        box(
            k,
            <>
                {label(k, name, { weight: 700, color: k.model })}
                {label(k, quote, { weight: 600 })}
                {extra}
            </>,
            { color, width: boxWidth },
        )
    const flag = (code: string) =>
        row(
            <>
                {mark('no', k.stop, 14)}
                {label(k, code, { mono: true, color: k.stop, style: { marginLeft: 4 } })}
            </>,
        )
    return figure(
        k,
        <>
            {row(
                <>
                    {draft(
                        'First draft',
                        '"I\'ve credited $900 back to your account!"',
                        k.stop,
                        FIRST,
                        col(
                            <>
                                {flag('prohibited_promise')}
                                {flag('missing_citation')}
                            </>,
                            { marginTop: 5, gap: 1 },
                        ),
                    )}
                    {col(
                        <>
                            {label(k, 'one revision', { color: k.mid, align: 'center' })}
                            {arrow(k.model, 68)}
                            {label(k, 'same sources', { color: k.mid, align: 'center' })}
                        </>,
                        { width: BRIDGE, alignItems: 'center' },
                    )}
                    {draft(
                        'Second draft',
                        '"Credits of this size go to a specialist."',
                        k.go,
                        SECOND,
                    )}
                </>,
            )}
            {area(
                INNER,
                SPLIT,
                <>
                    {pin(0, 4, label(k, 'every check runs again', { color: k.mid }), {
                        width: STEM - 10,
                        align: 'right',
                    })}
                    {pin(
                        0,
                        0,
                        split(INNER, SPLIT, STEM, [
                            [OUT / 2, k.ask],
                            [STEM, k.go],
                        ]),
                    )}
                </>,
            )}
            {row(
                <>
                    {box(
                        k,
                        <>
                            {label(k, 'Fail or out of budget', { color: k.ask, weight: 700 })}
                            {label(k, 'Abstain or hand off', { weight: 600 })}
                        </>,
                        { color: k.ask, fill: true, width: OUT },
                    )}
                    {space(20)}
                    {box(
                        k,
                        <>
                            {label(k, 'Pass', { color: k.go, weight: 700 })}
                            {label(k, "Send it after the template's status sentence", {
                                weight: 600,
                            })}
                            {label(
                                k,
                                '"A specialist needs to review your $900.00 credit request."',
                                { color: k.data, weight: 600 },
                            )}
                        </>,
                        { color: k.go, fill: true, width: OUT },
                    )}
                </>,
                { alignItems: 'stretch' },
            )}
        </>,
        0,
    )
}

export default create('dark')
