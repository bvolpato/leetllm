import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    INNER,
    area,
    arrow,
    box,
    col,
    dot,
    figure,
    hbar,
    hline,
    kit,
    label,
    pin,
    row,
    space,
    tint,
    vline,
} from './_kit'

export const width = 680
export const height = 560
export const alt =
    "A dollar axis from zero to 1,000 with the review threshold at 500, and one column under each side. The 35 dollar case falls below the threshold and follows the left column: confirm six exact fields, write with one key, and record one pending request. Alex's 900 dollar case falls above it and follows the right column: build a verified packet, deliver it to a queue and keep the acknowledgement, and wait for a specialist to decide. A line across the bottom says nothing is paid until a billing worker applies the credit."

const COL = 322
const GAP = 20
const x = (usd: number) => (usd / 1000) * INNER

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const chain = (color: string, name: string, steps: [string, string][]) =>
        col(
            <>
                {label(k, name, {
                    weight: 700,
                    color,
                    style: { marginBottom: 6, whiteSpace: 'nowrap' },
                })}
                {steps.map(([a, b], i) => (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {box(
                            k,
                            <>
                                {label(k, a, { weight: 600 })}
                                {label(k, b, { color: k.mid })}
                            </>,
                            { color, width: COL, style: { height: i === 0 ? 100 : 76 } },
                        )}
                        {i < steps.length - 1 ? (
                            <div
                                style={{
                                    display: 'flex',
                                    height: 26,
                                    alignItems: 'center',
                                    paddingLeft: 20,
                                }}
                            >
                                {arrow(color, 22, 'down')}
                            </div>
                        ) : null}
                    </div>
                ))}
            </>,
            { width: COL },
        )
    return figure(
        k,
        <>
            {area(
                INNER,
                84,
                <>
                    {hbar(x(500), 26, x(500), 28, tint(k.ask, 0.14))}
                    {hline(0, 54, INNER, k.faint)}
                    {vline(x(500), 18, 36, k.ask, true)}
                    {pin(
                        x(500) + 6,
                        0,
                        label(k, 'Review from $500', {
                            weight: 600,
                            color: k.ask,
                            style: { whiteSpace: 'nowrap' },
                        }),
                    )}
                    {dot(x(35), 40, 16, k.go)}
                    {dot(x(900), 40, 16, k.ask)}
                    {pin(x(35) - 14, 2, label(k, '$35', { mono: true, weight: 700, color: k.go }))}
                    {pin(
                        x(900) - 72,
                        0,
                        label(k, "Alex's $900", {
                            mono: true,
                            weight: 700,
                            color: k.ask,
                            style: { whiteSpace: 'nowrap' },
                        }),
                    )}
                    {[0, 500, 1000].map((v) =>
                        pin(
                            v === 0 ? 0 : v === 1000 ? INNER - 74 : x(v) - 26,
                            57,
                            label(k, `$${v.toLocaleString('en-US')}`, { mono: true, color: k.mid }),
                        ),
                    )}
                </>,
            )}
            {row(
                <>
                    {chain(k.go, 'Below $500: customer confirms', [
                        ['Confirm six fields', 'customer, invoice, item, type, amount, policy'],
                        ['Write with one key', 'T3:credit:A10234'],
                        ['One pending request', 'status: pending'],
                    ])}
                    {space(GAP)}
                    {chain(k.ask, 'From $500: a person decides', [
                        ['Build the packet', 'verified facts and the reason'],
                        ['Deliver to a queue', 'keep the acknowledgement'],
                        ['A specialist decides', 'approval tied to this action'],
                    ])}
                </>,
                { alignItems: 'flex-start' },
            )}
            {label(k, 'Nothing is paid until a billing worker applies the credit', {
                weight: 600,
                style: { borderTop: `1px solid ${k.line}`, paddingTop: 9 },
            })}
        </>,
        12,
    )
}

export default create('dark')
