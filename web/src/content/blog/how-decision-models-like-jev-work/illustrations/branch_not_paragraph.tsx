import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 385
export const alt =
    'Token-work comparison after a shared registry 401 log prefill. The text-output path decodes a multi-token autoregressive JSON or prose stream before a parser extracts registry_auth. The typed decision path performs a single-pass three-route probability readout over test_regression, registry_auth, and needs_review and returns registry_auth directly.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const green = f.tone('green')
    const warm = f.tone('warm')

    // Shared left input: prefill block
    const inX = 16
    const inY = 122
    const inW = 164
    const inH = 142
    f.rect(inX, inY, inW, inH, {
        fill: tint(blue, c.bg, 0.13),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 10,
    })
    f.text(inX + inW / 2, inY + 26, 'Shared prefill', {
        size: 16,
        weight: 700,
        color: blue,
        align: 'center',
    })
    f.text(inX + inW / 2, inY + 49, 'CI log: registry 401', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })
    // Decorative prompt-token bars representing shared input cost
    const barWidths = [126, 108, 132, 86]
    barWidths.forEach((bw, i) => {
        f.rect(inX + 16, inY + 72 + i * 14, bw, 8, {
            fill: tint(blue, c.bg, 0.35),
            radius: 3,
        })
    })

    // Branch connectors from shared prefill to both tracks
    const splitX = 204
    const trackX = 232
    f.path(`M${inX + inW} ${inY + 46} H${splitX} V102 H${trackX - 8}`, {
        color: purple,
        width: 1.75,
    })
    f.arrow(trackX - 18, 102, trackX - 2, 102, { color: purple, width: 1.75, head: 6 })

    f.path(`M${inX + inW} ${inY + 96} H${splitX} V284 H${trackX - 8}`, {
        color: green,
        width: 1.75,
    })
    f.arrow(trackX - 18, 284, trackX - 2, 284, { color: green, width: 1.75, head: 6 })

    // TOP TRACK: Autoregressive text/JSON decode + parser
    const topY = 22
    const topH = 158
    f.rect(trackX, topY, 552, topH, {
        fill: tint(purple, c.bg, 0.06),
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 10,
    })
    f.text(trackX + 16, topY + 24, 'Text output · multi-token decode + parser', {
        size: 15.5,
        weight: 700,
        color: purple,
    })

    // Sequence of autoregressive token chips
    const tokens = ['{"', 'route', '":', '"reg', '_auth', '",', '...}']
    const tokX0 = trackX + 16
    const tokY = topY + 54
    const tokH = 34
    let cx = tokX0
    tokens.forEach((tok, i) => {
        const tw = Math.max(28, Math.round(tok.length * 7.6 + 8))
        f.rect(cx, tokY, tw, tokH, {
            fill: tint(purple, c.bg, 0.18 + (i % 2) * 0.06),
            stroke: purple,
            strokeWidth: 1.25,
            radius: 5,
        })
        f.text(cx + tw / 2, tokY + tokH / 2, tok, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        cx += tw + 4
    })
    const tokEnd = cx - 4

    // Brace under autoregressive tokens
    f.brace(tokX0, tokY + tokH + 8, tokEnd, tokY + tokH + 8, 'N sequential decode steps', {
        side: 1,
        depth: 8,
        labelGap: 14,
        color: warm,
        labelColor: warm,
        labelSize: 13.5,
        weight: 600,
    })

    // Parser node + extracted output
    const parseX = 550
    f.arrow(tokEnd + 4, tokY + tokH / 2, parseX - 2, tokY + tokH / 2, {
        color: purple,
        width: 1.6,
        head: 6,
    })
    f.rect(parseX, tokY - 4, 66, 42, {
        fill: tint(warm, c.bg, 0.14),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 7,
    })
    f.text(parseX + 33, tokY + 17, 'Parse', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
    })

    const outTopX = 640
    f.arrow(parseX + 66, tokY + tokH / 2, outTopX - 2, tokY + tokH / 2, {
        color: green,
        width: 1.6,
        head: 6,
    })
    f.rect(outTopX, tokY - 4, 126, 42, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    f.text(outTopX + 63, tokY + 17, 'registry_auth', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // BOTTOM TRACK: Single-pass 3-route probability readout
    const botY = 204
    const botH = 160
    f.rect(trackX, botY, 552, botH, {
        fill: tint(green, c.bg, 0.06),
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 10,
    })
    f.text(trackX + 16, botY + 24, 'Typed decision · single-pass route readout', {
        size: 15.5,
        weight: 700,
        color: green,
    })

    // 3 candidate route bars inside readout area
    const routes = [
        { label: 'test_regression', prob: 0.11, winner: false },
        { label: 'registry_auth', prob: 0.82, winner: true },
        { label: 'needs_review', prob: 0.07, winner: false },
    ] as const
    const barStart = trackX + 148
    const barMaxW = 166
    routes.forEach((r, i) => {
        const ry = botY + 60 + i * 34
        const tone = r.winner ? green : c.textMuted
        f.text(barStart - 10, ry, r.label, {
            size: 13.5,
            weight: r.winner ? 700 : 500,
            color: r.winner ? green : c.textSecondary,
            align: 'right',
            mono: true,
        })
        f.rect(barStart, ry - 9, barMaxW, 18, {
            fill: tint(c.textMuted, c.bg, 0.12),
            radius: 4,
        })
        f.rect(barStart, ry - 9, barMaxW * r.prob, 18, {
            fill: r.winner ? green : tint(c.textMuted, c.bg, 0.45),
            radius: 4,
        })
        f.text(barStart + barMaxW + 10, ry, r.prob.toFixed(2), {
            size: 13.5,
            weight: r.winner ? 700 : 500,
            color: tone,
            mono: true,
        })
    })

    // Direct arrow to typed choice output
    const directOutX = 640
    f.arrow(barStart + barMaxW + 52, botY + 94, directOutX - 4, botY + 94, {
        color: green,
        width: 1.8,
        head: 6,
    })
    f.rect(directOutX, botY + 64, 126, 60, {
        fill: tint(green, c.bg, 0.2),
        stroke: green,
        strokeWidth: 1.8,
        radius: 8,
    })
    f.text(directOutX + 63, botY + 84, 'registry_auth', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    f.text(directOutX + 63, botY + 106, '1 pass · typed', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return f.render()
}

export default create('dark')
