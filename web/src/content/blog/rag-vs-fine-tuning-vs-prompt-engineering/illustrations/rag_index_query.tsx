import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 360
export const alt =
    'Retrieval filtering funnel. Archived Docs v2.4 and active Docs v2.5 enter the Version Filter, which explicitly prunes archived v2.4 chunks while passing v2.5 forward. Caller ACL next prunes restricted repositories, leaving only active permitted chunks to enter the Model Context Window.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const green = f.tone('green')
    const warm = f.tone('warm')
    const blue = f.tone('blue')
    const red = f.tone('critical')

    const drawNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        detail: string,
        tone: string,
        dashed = false,
    ) => {
        f.rect(x, y, w, h, {
            fill: tint(tone, c.bg, dashed ? 0.08 : 0.13),
            stroke: dashed ? 'none' : tone,
            strokeWidth: dashed ? 0 : 1.65,
            radius: 9,
        })
        if (dashed) {
            f.path(
                `M${x + 6} ${y} H${x + w - 6} Q${x + w} ${y},${x + w} ${y + 6} V${y + h - 6} Q${x + w} ${y + h},${x + w - 6} ${y + h} H${x + 6} Q${x} ${y + h},${x} ${y + h - 6} V${y + 6} Q${x} ${y},${x + 6} ${y}`,
                { color: tone, width: 1.5, dash: '5 4' },
            )
        }
        f.text(x + w / 2, y + h * 0.36, title, {
            size: 15,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 14,
        })
        f.text(x + w / 2, y + h * 0.7, detail, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            width: w - 14,
        })
    }

    // Inputs on left
    const nV24 = { x: 16, y: 34, w: 162, h: 74 }
    const nV25 = { x: 16, y: 138, w: 162, h: 74 }

    // Funnel gates in middle
    const nVer = { x: 224, y: 86, w: 156, h: 82 }
    const nAcl = { x: 434, y: 86, w: 150, h: 82 }

    // Clean context output on right
    const nCtx = { x: 642, y: 86, w: 142, h: 82 }

    // Pruned drop boxes below each gate
    const nDropV24 = { x: 224, y: 264, w: 156, h: 70 }
    const nDropAcl = { x: 434, y: 264, w: 150, h: 70 }

    // Edges: inputs -> Version Filter
    f.path(`M${nV24.x + nV24.w} ${nV24.y + nV24.h / 2} H200 V110 H${nVer.x - 8}`, {
        color: c.textMuted,
        width: 1.6,
        dash: '4 3',
    })
    f.arrow(nVer.x - 16, 110, nVer.x - 2, 110, { color: c.textMuted, width: 1.6, head: 6 })

    f.path(`M${nV25.x + nV25.w} ${nV25.y + nV25.h / 2} H200 V144 H${nVer.x - 8}`, {
        color: green,
        width: 1.9,
    })
    f.arrow(nVer.x - 16, 144, nVer.x - 2, 144, { color: green, width: 1.9, head: 6 })

    // Version Filter -> Pruned v2.4 (explicit drop!)
    const vMidX = nVer.x + nVer.w / 2
    f.arrow(vMidX, nVer.y + nVer.h, vMidX, nDropV24.y - 2, {
        color: red,
        width: 1.75,
        dash: '4 3',
        head: 6,
    })
    f.rect(vMidX - 42, 204, 84, 24, {
        fill: tint(red, c.bg, 0.2),
        stroke: red,
        strokeWidth: 1.2,
        radius: 12,
    })
    f.text(vMidX, 216, 'PRUNED', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })

    // Version Filter -> Caller ACL (only v2.5 passes!)
    f.arrow(nVer.x + nVer.w, 127, nAcl.x - 2, 127, { color: green, width: 1.9, head: 6 })
    f.text((nVer.x + nVer.w + nAcl.x) / 2, 110, 'v2.5', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // Caller ACL -> Pruned restricted docs (explicit drop!)
    const aMidX = nAcl.x + nAcl.w / 2
    f.arrow(aMidX, nAcl.y + nAcl.h, aMidX, nDropAcl.y - 2, {
        color: red,
        width: 1.75,
        dash: '4 3',
        head: 6,
    })
    f.rect(aMidX - 42, 204, 84, 24, {
        fill: tint(red, c.bg, 0.2),
        stroke: red,
        strokeWidth: 1.2,
        radius: 12,
    })
    f.text(aMidX, 216, 'DENIED', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })

    // Caller ACL -> Context Window
    f.arrow(nAcl.x + nAcl.w, 127, nCtx.x - 2, 127, { color: green, width: 1.9, head: 6 })
    f.text((nAcl.x + nAcl.w + nCtx.x) / 2, 110, 'allow', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Nodes
    drawNode(nV24.x, nV24.y, nV24.w, nV24.h, 'Docs v2.4', 'archived fp16 note', c.textSecondary, true)
    drawNode(nV25.x, nV25.y, nV25.w, nV25.h, 'Docs v2.5', 'active fp8 default', green)
    drawNode(nVer.x, nVer.y, nVer.w, nVer.h, 'Version Filter', 'version = v2.5', warm)
    drawNode(nAcl.x, nAcl.y, nAcl.w, nAcl.h, 'Caller ACL', 'repo permissions', blue)
    drawNode(nCtx.x, nCtx.y, nCtx.w, nCtx.h, 'Context Window', 'clean evidence', green)
    drawNode(nDropV24.x, nDropV24.y, nDropV24.w, nDropV24.h, 'v2.4 dropped', 'archived excluded', red, true)
    drawNode(nDropAcl.x, nDropAcl.y, nDropAcl.w, nDropAcl.h, 'Private dropped', 'no caller access', red, true)

    return f.render()
}

export default create('dark')
