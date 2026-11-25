import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 400
export const alt =
    'Asynchronous revision lag timeline across three states. At T1, the registry and search index both hold policy@2 and exception@1 so publication succeeds. At T2, the registry advances policy to revision 3 while the search index still serves policy@2, creating a lag gap. During this gap, the publication gate rejects stale policy@2 (leaving the policy slot empty while exception@1 stays filled) and withholds the answer until policy@3 lands at T3.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')

    const fill = (color: string, amt = 0.13) => tint(color, c.bg, amt)

    // Horizontal timeline geometry
    const xStart = 176
    const xT2 = 382
    const xT3 = 636
    const xEnd = 808

    // Highlighted Lag Gap column (T2 -> T3)
    fig.rect(xT2, 36, xT3 - xT2, 198, {
        fill: fill(red, 0.08),
        stroke: red,
        strokeWidth: 1,
        radius: 6,
    })
    fig.text((xT2 + xT3) / 2, 22, 'Ingestion Lag Window (rev 2 ≠ 3)', {
        size: 13,
        color: red,
        align: 'center',
        weight: 700,
    })
    fig.text((xStart + xT2) / 2, 22, 'T1: Synced', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
    })
    fig.text((xT3 + xEnd) / 2, 22, 'T3: Reindexed', {
        size: 13,
        color: blue,
        align: 'center',
        weight: 700,
    })

    // Vertical phase lines
    fig.line(xT2, 36, xT2, 240, { color: warm, width: 1.5, dash: '4 4' })
    fig.line(xT3, 36, xT3, 240, { color: blue, width: 1.5, dash: '4 4' })

    // Lane 1: Authority Registry (policy)
    const yL1 = 56
    fig.text(162, yL1 + 18, 'Registry (policy)', {
        size: 13,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
    })
    fig.rect(xStart, yL1, xT2 - xStart - 4, 36, {
        fill: fill(green, 0.16),
        stroke: green,
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text((xStart + xT2 - 4) / 2, yL1 + 18, 'current_rev = 2', {
        size: 12.5,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
    })

    fig.rect(xT2 + 4, yL1, xEnd - xT2 - 4, 36, {
        fill: fill(blue, 0.16),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text((xT2 + 4 + xEnd) / 2, yL1 + 18, 'current_rev = 3  (bumped at T2)', {
        size: 12.5,
        color: blue,
        align: 'center',
        weight: 700,
        mono: true,
    })

    // Lane 2: Search Index (policy)
    const yL2 = 114
    fig.text(162, yL2 + 18, 'Index (policy)', {
        size: 13,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
    })
    fig.rect(xStart, yL2, xT2 - xStart - 4, 36, {
        fill: fill(green, 0.16),
        stroke: green,
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text((xStart + xT2 - 4) / 2, yL2 + 18, 'policy@2 (fresh)', {
        size: 12.5,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
    })

    fig.rect(xT2 + 4, yL2, xT3 - xT2 - 8, 36, {
        fill: fill(red, 0.2),
        stroke: red,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text((xT2 + xT3) / 2, yL2 + 18, 'policy@2 (STALE)', {
        size: 12.5,
        color: red,
        align: 'center',
        weight: 700,
        mono: true,
    })

    fig.rect(xT3 + 4, yL2, xEnd - xT3 - 4, 36, {
        fill: fill(blue, 0.16),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text((xT3 + 4 + xEnd) / 2, yL2 + 18, 'policy@3 (fresh)', {
        size: 12.5,
        color: blue,
        align: 'center',
        weight: 700,
        mono: true,
    })

    // Lane 3: Exception (unchanged)
    const yL3 = 172
    fig.text(162, yL3 + 18, 'Index (exception)', {
        size: 13,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
    })
    fig.rect(xStart, yL3, xEnd - xStart, 36, {
        fill: fill(green, 0.12),
        stroke: green,
        strokeWidth: 1.2,
        radius: 6,
    })
    fig.text((xStart + xEnd) / 2, yL3 + 18, 'exception@1  (matches registry rev 1 throughout)', {
        size: 12.5,
        color: green,
        align: 'center',
        weight: 600,
        mono: true,
    })

    // Arrow down from Lag Window into Publication Gate snapshot at T2
    fig.arrow((xT2 + xT3) / 2, 234, (xT2 + xT3) / 2, 272, { color: red, width: 1.75, head: 6 })

    // Bottom: Evidence Slot Snapshot during T2 Lag Window
    fig.text(32, 274, 'Publication Gate at T2:', { size: 13.5, color: c.textPrimary, weight: 700 })

    // Slot 1: Policy (EMPTY / REJECTED)
    fig.rect(32, 294, 246, 76, {
        fill: fill(red, 0.1),
        stroke: red,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(46, 316, 'Slot 1: policy -> EMPTY', { size: 13, color: red, weight: 700, mono: true })
    fig.text(46, 340, 'policy@2 excluded (2 < 3)', { size: 12.5, color: c.textSecondary })

    // Slot 2: Exception (FILLED)
    fig.rect(298, 294, 246, 76, {
        fill: fill(green, 0.1),
        stroke: green,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(312, 316, 'Slot 2: exception@1', { size: 13, color: green, weight: 700, mono: true })
    fig.text(312, 340, 'Current & authorized', { size: 12.5, color: c.textSecondary })

    // Gate decision
    fig.arrow(544, 332, 578, 332, { color: red, width: 1.75, head: 6 })
    fig.rect(582, 294, 226, 76, {
        fill: fill(red, 0.16),
        stroke: red,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(695, 320, 'WITHHOLD ANSWER', {
        size: 13.5,
        color: red,
        align: 'center',
        weight: 700,
    })
    fig.text(695, 344, 'Required slot missing', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create()
