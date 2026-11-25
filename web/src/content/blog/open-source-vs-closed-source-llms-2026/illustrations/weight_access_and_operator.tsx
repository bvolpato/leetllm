import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 380
export const alt =
    'Two-zone architecture separating Internal Private from Off-site External data paths. Downloadable weights can run under a company operator on the internal data path or under an external operator on the off-site path. A closed-weight API runs only under an external operator. Both external routes send the assembled prompt, history, retrieved evidence, and tool outputs off-site.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const purple = f.tone('purple')
    const blue = f.tone('blue')
    const green = f.tone('green')
    const warm = f.tone('warm')

    const drawNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        detail: string,
        tone: string,
    ) => {
        f.rect(x, y, w, h, {
            fill: tint(tone, c.bg, 0.13),
            stroke: tone,
            strokeWidth: 1.65,
            radius: 10,
        })
        f.text(x + w / 2, y + h * 0.36, title, {
            size: 15,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 16,
        })
        f.text(x + w / 2, y + h * 0.7, detail, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            width: w - 16,
        })
    }

    // Left column header: Weight access
    f.text(18, 32, 'Weight access', { size: 14, weight: 700, color: c.textSecondary })

    // Left nodes (ordered so edges never cross!)
    const nOpen = { x: 18, y: 80, w: 204, h: 82 }
    const nClosed = { x: 18, y: 248, w: 204, h: 82 }

    // Right Zone 1: Internal Private Data Path (top)
    const zInt = { x: 286, y: 24, w: 498, h: 150 }
    f.rect(zInt.x, zInt.y, zInt.w, zInt.h, {
        fill: tint(green, c.bg, 0.06),
        stroke: green,
        strokeWidth: 1.4,
        radius: 12,
    })
    f.text(zInt.x + 16, zInt.y + 22, 'Internal private boundary · stays on company infra', {
        size: 13.5,
        weight: 700,
        color: green,
    })
    const nComp = { x: 306, y: 66, w: 202, h: 82 }
    const nIntPath = { x: 562, y: 66, w: 204, h: 82 }

    // Right Zone 2: Off-site External Data Path (bottom)
    const zExt = { x: 286, y: 196, w: 498, h: 162 }
    f.rect(zExt.x, zExt.y, zExt.w, zExt.h, {
        fill: tint(warm, c.bg, 0.06),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 12,
    })
    f.text(zExt.x + 16, zExt.y + 22, 'Off-site external boundary · provider receives request', {
        size: 13.5,
        weight: 700,
        color: warm,
    })
    const nExtOp = { x: 306, y: 244, w: 202, h: 86 }
    const nExtPath = { x: 562, y: 244, w: 204, h: 86 }

    // Zero-crossing edges:
    // 1. Downloadable weights -> Company operator (straight green)
    f.arrow(nOpen.x + nOpen.w, 108, nComp.x - 2, 108, { color: green, width: 1.8, head: 6 })
    f.text(254, 92, 'self-host', { size: 12.5, weight: 600, color: green, align: 'center' })

    // 2. Downloadable weights -> External operator (clean non-crossing bend downward)
    f.path(`M${nOpen.x + nOpen.w} 142 H254 V268 H${nExtOp.x - 8}`, {
        color: warm,
        width: 1.8,
    })
    f.arrow(nExtOp.x - 16, 268, nExtOp.x - 2, 268, { color: warm, width: 1.8, head: 6 })
    f.rect(226, 198, 56, 22, {
        fill: tint(warm, c.bg, 0.18),
        stroke: warm,
        strokeWidth: 1.15,
        radius: 11,
    })
    f.text(254, 209, 'hosted', { size: 12, weight: 700, color: warm, align: 'center' })

    // 3. Closed-weight API -> External operator (straight blue)
    f.arrow(nClosed.x + nClosed.w, 304, nExtOp.x - 2, 304, { color: blue, width: 1.8, head: 6 })
    f.text(254, 320, 'API only', { size: 12.5, weight: 600, color: blue, align: 'center' })

    // Internal operator -> Internal path
    f.arrow(nComp.x + nComp.w, 107, nIntPath.x - 2, 107, { color: green, width: 1.8, head: 6 })

    // External operator -> External path
    f.arrow(nExtOp.x + nExtOp.w, 287, nExtPath.x - 2, 287, { color: warm, width: 1.8, head: 6 })

    // Draw nodes on top
    drawNode(nOpen.x, nOpen.y, nOpen.w, nOpen.h, 'Downloadable weights', 'license defines rights', purple)
    drawNode(nClosed.x, nClosed.y, nClosed.w, nClosed.h, 'Closed-weight API', 'no weight download', blue)
    drawNode(nComp.x, nComp.y, nComp.w, nComp.h, 'Company operator', 'internal inference', green)
    drawNode(nIntPath.x, nIntPath.y, nIntPath.w, nIntPath.h, 'Internal data path', 'private logs & tools', green)
    drawNode(nExtOp.x, nExtOp.y, nExtOp.w, nExtOp.h, 'External operator', 'hosted inference', warm)
    drawNode(nExtPath.x, nExtPath.y, nExtPath.w, nExtPath.h, 'Off-site data & terms', 'prompt, logs & tools', warm)

    return f.render()
}

export default create('dark')
