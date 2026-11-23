import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 470
export const alt =
    'Two requests take different routes. A question about public documentation retrieves the public runbook and receives an explanation. A request for confidential data reaches an application authorization check; because access permission is absent, the path stops before retrieval and returns an access-portal instruction.'

export const layoutHeight = (L: Layout) => (L.print ? 222 : 470)

function words(
    k: Kit,
    L: Layout,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string[],
    color?: string,
) {
    const lineH = L.S * 1.3
    const top = y + (h - text.length * lineH) / 2
    text.forEach((line, i) => {
        if (color) k.t(x, top + i * lineH, w, line, { size: L.S, align: 'center', color })
        else k.t(x, top + i * lineH, w, line, { size: L.S, align: 'center' })
    })
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const left = 6
    const gap = L.print ? 26 : 22
    const colW = (L.W - left * 2 - gap * 3) / 4
    const colX = (i: number) => left + i * (colW + gap)
    const head = L.print ? 28 : 38
    const rowH = L.print ? 80 : 150
    const boxH = L.print ? 64 : 124
    const y = (row: number) => head + row * (rowH + (L.print ? 8 : 16))
    const green = k.ink('green')
    const red = k.ink('critical')

    ;['Request', 'App check', 'Retrieval', 'Reply'].forEach((name, i) =>
        k.t(colX(i), 3, colW, name, { size: L.S, align: 'center', color: c.textSecondary }),
    )

    // Row 1: public question, public runbook, direct answer.
    k.rect(colX(0), y(0), colW, boxH, { fill: k.tint('blue', 0.2), stroke: k.ink('blue') })
    words(k, L, colX(0), y(0), colW, boxH, ['Public freeze', 'question'])
    k.rect(colX(1), y(0), colW, boxH, { stroke: c.border })
    words(k, L, colX(1), y(0), colW, boxH, ['No record', 'permission', 'needed'], c.textSecondary)
    k.rect(colX(2), y(0), colW, boxH, { fill: k.tint('green', 0.22), stroke: green })
    words(k, L, colX(2), y(0), colW, boxH, ['Public', 'runbook'])
    k.rect(colX(3), y(0), colW, boxH, {
        fill: k.tint('green', 0.34),
        stroke: green,
        strokeWidth: 1.75,
    })
    words(k, L, colX(3), y(0), colW, boxH, ['Explains', 'the rule'])
    ;[0, 1, 2].forEach((i) =>
        k.arrow(colX(i) + colW + 2, y(0) + boxH / 2, colX(i + 1) - 2, y(0) + boxH / 2, {
            stroke: green,
            strokeWidth: 2,
        }),
    )

    // Row 2: private request, stopped at the application check.
    k.rect(colX(0), y(1), colW, boxH, { fill: k.tint('blue', 0.2), stroke: k.ink('blue') })
    words(k, L, colX(0), y(1), colW, boxH, ['Private record', 'request'])
    k.rect(colX(1), y(1), colW, boxH, {
        fill: k.tint('critical', 0.22),
        stroke: red,
        strokeWidth: 2,
    })
    words(k, L, colX(1), y(1), colW, boxH, ['Trusted ID:', 'access denied'])
    k.rect(colX(2), y(1), colW, boxH, { stroke: c.textMuted, dash: '4 4' })
    words(k, L, colX(2), y(1), colW, boxH, ['Private record', 'never fetched'], c.textMuted)
    k.rect(colX(3), y(1), colW, boxH, {
        fill: k.tint('warm', 0.24),
        stroke: k.ink('warm'),
        strokeWidth: 1.75,
    })
    words(k, L, colX(3), y(1), colW, boxH, ['Access-portal', 'instruction'])
    k.arrow(colX(0) + colW + 2, y(1) + boxH / 2, colX(1) - 2, y(1) + boxH / 2, {
        stroke: red,
        strokeWidth: 2,
    })

    // The denial routes around retrieval, so the record cannot reach the reply.
    const under = y(1) + boxH + (L.print ? 10 : 14)
    const startX = colX(1) + colW / 2
    const endX = colX(3) + colW / 2
    k.path(
        `M${startX} ${y(1) + boxH + 1}L${startX} ${under}L${endX} ${under}L${endX} ${y(1) + boxH + 8}`,
        { stroke: k.ink('warm'), strokeWidth: 2 },
    )
    k.arrow(endX, y(1) + boxH + 10, endX, y(1) + boxH + 1, {
        stroke: k.ink('warm'),
        strokeWidth: 2,
    })
    k.t(startX + 8, under + 2, endX - startX - 16, 'denial skips retrieval', {
        size: L.S,
        align: 'center',
        color: k.ink('warm'),
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
