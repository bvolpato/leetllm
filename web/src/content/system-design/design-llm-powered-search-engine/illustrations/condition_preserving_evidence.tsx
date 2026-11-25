import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 380
export const alt =
    'Calibrated character-offset span comparison on exception@1 (101 characters). The base clause occupies characters 0 to 72 and the qualifying clause "only with security approval." occupies characters 73 to 100. Case A quotes the verbatim prefix [0, 72), passing SHA-256 digest matching but dropping the qualifier and failing publication (HOLD). Case B preserves the complete span [0, 101), passing both digest and clause checks (PUBLISH).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    const fill = (color: string, amt = 0.14) => tint(color, c.bg, amt)

    // Calibrated 0..101 character ruler along x = [140..660]
    const x0 = 140
    const spanW = 520
    const cx = (ch: number) => x0 + (ch / 101) * spanW
    const splitX = cx(72)

    // Canonical source text strip at top (2 crisp lines inside each span box, zero overflow)
    fig.text(24, 38, 'exception@1', { size: 13.5, color: blue, weight: 700, mono: true })
    fig.text(24, 58, '101 chars', { size: 12, color: c.textSecondary, mono: true })

    // Prefix highlight box [0, 72)
    fig.rect(x0, 20, splitX - x0 - 2, 54, {
        fill: fill(blue, 0.13),
        stroke: blue,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(x0 + 12, 37, '"Service-account SDK migrations may start', {
        size: 12.5,
        color: c.textPrimary,
        weight: 600,
    })
    fig.text(x0 + 12, 57, 'within 60 days after the notice', {
        size: 12.5,
        color: c.textPrimary,
        weight: 600,
    })

    // Qualifier highlight box [72, 101)
    fig.rect(splitX + 2, 20, cx(101) - splitX - 2, 54, {
        fill: fill(warm, 0.2),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text((splitX + cx(101)) / 2, 37, 'only with', {
        size: 12.5,
        color: warm,
        align: 'center',
        weight: 700,
    })
    fig.text((splitX + cx(101)) / 2, 57, 'security approval."', {
        size: 12.5,
        color: warm,
        align: 'center',
        weight: 700,
    })

    // Curly brace highlighting the qualifier clause
    fig.brace(splitX + 2, 80, cx(101), 80, 'Qualifier [73, 100)', {
        side: 1,
        depth: 8,
        color: warm,
        labelColor: warm,
        labelSize: 12,
        labelGap: 12,
        weight: 700,
    })

    // Vertical clause-boundary guide running down both tracks
    fig.line(splitX, 74, splitX, 314, { color: warm, width: 1.5, dash: '5 4' })

    // Track A: Truncated span [0, 72) -> HOLD
    const yA = 148
    fig.text(24, yA + 10, 'Truncated [0, 72)', { size: 13.5, color: red, weight: 700 })
    fig.text(24, yA + 30, 'Verbatim prefix', { size: 12, color: c.textSecondary })

    fig.rect(x0, yA + 4, splitX - x0, 32, {
        fill: fill(blue, 0.22),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text((x0 + splitX) / 2, yA + 20, 'Quoted: 0-72', {
        size: 12.5,
        color: blue,
        align: 'center',
        weight: 700,
        mono: true,
    })

    // Missing qualifier region (dashed red outline + cross-hatch)
    fig.rect(splitX + 2, yA + 4, cx(101) - splitX - 2, 32, {
        fill: fill(red, 0.1),
        stroke: red,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text((splitX + cx(101)) / 2, yA + 20, 'DROPPED', {
        size: 12.5,
        color: red,
        align: 'center',
        weight: 700,
    })

    // Verdict column for Track A
    fig.text(680, yA + 4, 'Digest: PASS', { size: 12.5, color: green, weight: 600, mono: true })
    fig.text(680, yA + 22, 'Clause: MISSING', { size: 12.5, color: red, weight: 700, mono: true })
    fig.rect(680, yA + 34, 134, 24, {
        fill: fill(red, 0.18),
        stroke: red,
        strokeWidth: 1.3,
        radius: 5,
    })
    fig.text(747, yA + 46, 'HOLD (Blocked)', {
        size: 12.5,
        color: red,
        align: 'center',
        weight: 700,
    })

    // Track B: Complete span [0, 101) -> PUBLISH
    const yB = 242
    fig.text(24, yB + 10, 'Full span [0, 101)', { size: 13.5, color: green, weight: 700 })
    fig.text(24, yB + 30, 'Condition intact', { size: 12, color: c.textSecondary })

    fig.rect(x0, yB + 4, splitX - x0, 32, {
        fill: fill(blue, 0.22),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text((x0 + splitX) / 2, yB + 20, 'Base rule: 0-72', {
        size: 12.5,
        color: blue,
        align: 'center',
        weight: 700,
        mono: true,
    })

    fig.rect(splitX + 2, yB + 4, cx(101) - splitX - 2, 32, {
        fill: fill(green, 0.22),
        stroke: green,
        strokeWidth: 1.4,
        radius: 4,
    })
    fig.text((splitX + cx(101)) / 2, yB + 20, 'INTACT: 73-100', {
        size: 12,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
    })

    // Verdict column for Track B
    fig.text(680, yB + 4, 'Digest: PASS', { size: 12.5, color: green, weight: 600, mono: true })
    fig.text(680, yB + 22, 'Clause: INTACT', { size: 12.5, color: green, weight: 700, mono: true })
    fig.rect(680, yB + 34, 134, 24, {
        fill: fill(green, 0.18),
        stroke: green,
        strokeWidth: 1.3,
        radius: 5,
    })
    fig.text(747, yB + 46, 'PUBLISH', {
        size: 12.5,
        color: green,
        align: 'center',
        weight: 700,
    })

    // Bottom calibrated character axis
    const axisY = 326
    fig.line(x0, axisY, cx(101), axisY, { color: c.textMuted, width: 1.2 })
    for (const tick of [0, 20, 40, 60, 72, 101]) {
        const tx = cx(tick)
        const isSplit = tick === 72
        fig.line(tx, axisY, tx, axisY + 5, {
            color: isSplit ? warm : c.textMuted,
            width: isSplit ? 1.6 : 1,
        })
        fig.text(tx, axisY + 18, String(tick), {
            size: 12,
            color: isSplit ? warm : c.textSecondary,
            align: 'center',
            weight: isSplit ? 700 : 500,
            mono: true,
        })
    }
    fig.text(x0 + spanW / 2, axisY + 38, 'Character offset in exception@1', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create()
