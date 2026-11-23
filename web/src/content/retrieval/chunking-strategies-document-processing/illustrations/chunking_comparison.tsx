import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, S, at, figure, hArrow, kit, label, marks, plane, tint } from './_kit'

export const width = 640
export const height = 431
export const alt =
    'Three interval maps show size-7 windows over the same 17 runbook words. Overlap 0, 2, and 4 store 17, 21, and 33 words in 3, 3, and 5 chunks. A strip under each map darkens where words repeat across windows. The rollback rule spans words 1 to 10, so no seven-word window holds the whole rule at any overlap.'

const WORD = INNER / 17
const RULE_END = 10
const BAR = 28
const HEAD = 28
const GROUPS = [
    {
        overlap: 0,
        chunks: 3,
        words: 17,
        rows: [
            [
                [1, 7],
                [8, 14],
                [15, 17],
            ],
        ],
    },
    {
        overlap: 2,
        chunks: 3,
        words: 21,
        rows: [
            [
                [1, 7],
                [11, 17],
            ],
            [[6, 12]],
        ],
    },
    {
        overlap: 4,
        chunks: 5,
        words: 33,
        rows: [
            [
                [1, 7],
                [10, 16],
            ],
            [
                [4, 10],
                [13, 17],
            ],
            [[7, 13]],
        ],
    },
]
const x = (word: number) => (word - 1) * WORD

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    let y = 32
    const parts: React.ReactNode[] = []
    GROUPS.forEach((group) => {
        const top = y
        parts.push(
            at(
                4,
                top,
                label(k, `Overlap ${group.overlap}: ${group.chunks} chunks, ${group.words} words`, {
                    weight: 600,
                    size: S,
                    width: 340,
                }),
            ),
        )
        const body = top + HEAD
        const windows = group.rows.flat()
        group.rows.forEach((bars, r) =>
            bars.forEach(([first, last]) => {
                const leftAligned = first === 7 || first === 8
                parts.push(
                    at(
                        x(first!) + 1,
                        body + r * (BAR + 3),
                        label(k, `${first}–${last}`, {
                            size: S,
                            width: 54,
                            align: leftAligned ? 'left' : 'center',
                        }),
                        {
                            width: (last! - first! + 1) * WORD - 2,
                            height: BAR,
                            alignItems: 'center',
                            justifyContent: leftAligned ? 'flex-start' : 'center',
                            paddingLeft: leftAligned ? 10 : 0,
                            boxSizing: 'border-box',
                            border: `1.25px solid ${k.data}`,
                            backgroundColor: tint(k.data, 0.14),
                            borderRadius: 2,
                        },
                    ),
                )
            }),
        )
        const strip = body + group.rows.length * (BAR + 3) + 1
        for (let word = 1; word <= 17; word++) {
            const copies = windows.filter(([first, last]) => first! <= word && word <= last!).length
            parts.push(
                at(x(word) + 0.5, strip, null, {
                    width: WORD - 1,
                    height: 10,
                    backgroundColor: k.data,
                    opacity: [0, 0.2, 0.5, 0.9][copies],
                }),
            )
        }
        y = strip + 10 + 14
    })
    const bottom = y - 10
    return figure(
        k,
        plane(
            INNER,
            bottom,
            <>
                {at(0, 24, null, {
                    width: RULE_END * WORD,
                    height: bottom - 24,
                    backgroundColor: tint(k.go, 0.1),
                    borderRight: `1.5px dashed ${k.go}`,
                    boxSizing: 'border-box',
                })}
                {marks(
                    INNER,
                    bottom,
                    <>
                        <line x1={0} y1={24} x2={INNER} y2={24} stroke={k.line} strokeWidth={1} />
                        <line
                            x1={RULE_END * WORD}
                            y1={18}
                            x2={RULE_END * WORD}
                            y2={bottom}
                            stroke={k.go}
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                        />
                        {hArrow(k.go, 2, RULE_END * WORD - 4, 12)}
                    </>,
                )}
                {at(
                    4,
                    0,
                    label(k, 'The rollback rule: words 1 to 10', {
                        size: S,
                        weight: 600,
                        color: k.go,
                        width: 340,
                    }),
                )}
                {at(
                    x(11) + 8,
                    0,
                    label(k, 'Next note: 11 to 17', { size: S, color: k.mid, width: 240 }),
                )}
                {parts}
            </>,
        ),
    )
}
export default create('dark')
