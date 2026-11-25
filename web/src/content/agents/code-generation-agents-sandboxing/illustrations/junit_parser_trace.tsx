import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 415
export const alt =
    'JUnit XML direct-child parser trace across seven testcases: failure child emits router::declined, error child emits router::offline, combined failure and error emits router::both once; skipped tag, duplicate declined, nested details/failure, and skip-before-error cases are filtered out.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    // Left: XML AST Root Node -> Direct-Child Filter
    fig.rect(20, 146, 174, 114, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: blue,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(107, 174, '<testsuite>', { size: 15, mono: true, weight: 700, color: blue, align: 'center' })
    fig.text(107, 200, 'Direct-child scan', { size: 13, weight: 600, color: c.textPrimary, align: 'center' })
    fig.text(107, 222, 'replaces @status', { size: 12, mono: true, color: red, align: 'center' })
    fig.text(107, 242, '7 testcases', { size: 12, color: c.textSecondary, align: 'center' })

    // Column Headers
    fig.text(398, 20, 'XML Testcase Child Tags', { size: 13.5, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(742, 20, 'Unique Emitted List vs. Filtered', { size: 13.5, weight: 700, color: c.textSecondary, align: 'center' })

    const cases = [
        { xml: '<failure/> direct child', out: 'EMIT: router::declined', emit: true },
        { xml: '<error/> direct child', out: 'EMIT: router::offline', emit: true },
        { xml: '<failure/> + <error/>', out: 'EMIT: router::both (1×)', emit: true },
        { xml: '<skipped/> direct child', out: 'OMIT: skipped probe', emit: false },
        { xml: 'duplicate declined', out: 'OMIT: seen-set dedup', emit: false },
        { xml: '<details><failure/></details>', out: 'OMIT: nested non-direct', emit: false },
        { xml: 'api::skip + <error/>', out: 'OMIT: skip beats error', emit: false },
    ]

    cases.forEach((item, idx) => {
        const y = 42 + idx * 51
        const cy = y + 20
        const tone = item.emit ? green : warm

        // Smooth curved branch from <testsuite>
        fig.path(`M 196 203 C 228 203, 228 ${cy}, 256 ${cy}`, {
            color: tone,
            width: item.emit ? 1.8 : 1.25,
            dash: item.emit ? undefined : '4 3',
            opacity: item.emit ? 0.95 : 0.7,
        })

        // XML case tile
        fig.rect(258, y, 286, 40, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.07 : 0.12),
            stroke: tint(tone, c.bg, item.emit ? 0.6 : 0.4),
            strokeWidth: 1.3,
            radius: 6,
        })
        fig.text(272, cy, item.xml, { size: 13, mono: true, weight: 600, color: c.textPrimary })

        fig.arrow(546, cy, 594, cy, { color: tone, width: 1.6, head: 6 })

        // Output slot / omission reason
        fig.rect(598, y, 282, 40, {
            fill: tint(tone, c.bg, theme === 'light' ? (item.emit ? 0.15 : 0.08) : item.emit ? 0.24 : 0.12),
            stroke: tone,
            strokeWidth: item.emit ? 1.7 : 1.2,
            radius: 6,
        })
        fig.text(739, cy, item.out, {
            size: 13,
            mono: item.emit,
            weight: 700,
            color: tone,
            align: 'center',
        })
    })

    return fig.render()
}

export default create('dark')
