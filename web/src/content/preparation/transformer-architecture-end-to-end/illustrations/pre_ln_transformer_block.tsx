import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 490
export const alt =
    'Pre-LN and Post-LN blocks compared left to right across the same 3 by 4 stream. In Pre-LN, a direct identity skip path runs unbroken from input X through two residual additions to output Y while each branch detours through Norm and Attention or Norm and FFN back into the addition nodes. In Post-LN, LayerNorm sits directly on the main spine after each residual addition.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const amberText = isLight ? '#9a5204' : '#f2b84b'
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const blueFill = tint(blue, c.bg, isLight ? 0.12 : 0.18)
    const greenFill = tint(green, c.bg, isLight ? 0.12 : 0.18)
    const amberFill = tint(amberMark, c.bg, isLight ? 0.14 : 0.18)
    const normFill = tint(c.textSecondary, c.bg, isLight ? 0.08 : 0.14)

    const pill = (
        cx: number,
        cy: number,
        w: number,
        h: number,
        label: string,
        stroke: string,
        fill: string,
        textColor: string,
        size = 18,
    ) => {
        fig.rect(cx - w / 2, cy - h / 2, w, h, {
            fill,
            stroke,
            strokeWidth: 1.75,
            radius: 8,
        })
        fig.text(cx, cy, label, {
            size,
            color: textColor,
            align: 'center',
            weight: 650,
            width: w - 6,
        })
    }

    const plusNode = (cx: number, cy: number, color: string) => {
        fig.circle(cx, cy, 16, {
            fill: c.bg,
            stroke: color,
            width: 2.2,
        })
        fig.text(cx, cy - 1, '+', {
            size: 23,
            color,
            align: 'center',
            weight: 700,
            width: 26,
        })
    }

    const curvedUpArrow = (
        xStart: number,
        yStart: number,
        xEnd: number,
        yEnd: number,
        color: string,
    ) => {
        // Quarter-turn cubic curve from horizontal branch tip into bottom of + node
        const tipY = yEnd + 16
        const shaftEndY = tipY + 6
        fig.path(
            `M${xStart} ${yStart} C${xEnd} ${yStart}, ${xEnd} ${yStart - 10}, ${xEnd} ${shaftEndY}`,
            { color, width: 2.1 },
        )
        fig.path(`M${xEnd} ${tipY} L${xEnd - 4.5} ${tipY + 7.5} L${xEnd + 4.5} ${tipY + 7.5} Z`, {
            fill: color,
        })
    }

    const forkDownPath = (
        xFork: number,
        ySpine: number,
        xBoxLeft: number,
        yBranch: number,
        color: string,
    ) => {
        fig.circle(xFork, ySpine, 4, { fill: color })
        const shaftEndX = xBoxLeft - 6
        fig.path(
            `M${xFork} ${ySpine} C${xFork} ${yBranch - 8}, ${xFork} ${yBranch}, ${shaftEndX} ${yBranch}`,
            { color, width: 2.1 },
        )
        fig.path(
            `M${xBoxLeft} ${yBranch} L${xBoxLeft - 7.5} ${yBranch - 4.5} L${xBoxLeft - 7.5} ${yBranch + 4.5} Z`,
            { fill: color },
        )
    }

    // ── Track 1: Pre-LN (Unbroken identity skip spine) ──────────────────────
    const y1Spine = 104
    const y1Branch = 188

    fig.text(22, 26, '1. Pre-LN', { size: 22, weight: 750, color: blue })
    fig.text(138, 26, 'Unbroken identity skip highway (keeps [3, 4])', {
        size: 18,
        color: c.textSecondary,
        weight: 500,
    })

    // Main identity spine arrows
    fig.arrow(102, y1Spine, 354, y1Spine, { color: blue, width: 3.2, head: 7.5 })
    fig.arrow(386, y1Spine, 624, y1Spine, { color: blue, width: 3.2, head: 7.5 })
    fig.arrow(656, y1Spine, 694, y1Spine, { color: blue, width: 3.2, head: 7.5 })

    fig.text(244, y1Spine - 22, 'identity skip', {
        size: 17,
        color: blue,
        align: 'center',
        weight: 600,
    })
    fig.text(412, y1Spine - 22, 'x₁', {
        size: 18,
        color: c.textSecondary,
        align: 'center',
        weight: 650,
    })
    fig.text(534, y1Spine - 22, 'identity skip', {
        size: 17,
        color: blue,
        align: 'center',
        weight: 600,
    })

    // Sublayer 1 detour: Norm -> Causal Attn
    forkDownPath(132, y1Spine, 158, y1Branch, amberMark)
    pill(194, y1Branch, 72, 40, 'Norm', c.textSecondary, normFill, c.textPrimary, 17)
    fig.arrow(230, y1Branch, 250, y1Branch, { color: amberMark, width: 2.1, head: 6 })
    pill(302, y1Branch, 104, 40, 'Attn', amberMark, amberFill, amberText, 18)
    curvedUpArrow(354, y1Branch, 370, y1Spine, amberMark)

    // Sublayer 2 detour: Norm -> FFN
    forkDownPath(436, y1Spine, 462, y1Branch, green)
    pill(498, y1Branch, 72, 40, 'Norm', c.textSecondary, normFill, c.textPrimary, 17)
    fig.arrow(534, y1Branch, 554, y1Branch, { color: green, width: 2.1, head: 6 })
    pill(592, y1Branch, 76, 40, 'FFN', green, greenFill, green, 18)
    curvedUpArrow(630, y1Branch, 640, y1Spine, green)

    // Endpoints & additions on Pre-LN spine
    pill(62, y1Spine, 82, 42, 'X [3,4]', blue, blueFill, blue, 18)
    plusNode(370, y1Spine, blue)
    plusNode(640, y1Spine, blue)
    pill(736, y1Spine, 82, 42, 'Y [3,4]', blue, blueFill, blue, 18)

    // Subtle divider between tracks
    fig.line(22, 244, width - 22, 244, { color: c.borderSubtle, width: 1.25 })

    // ── Track 2: Post-LN (Norm directly ON the residual spine) ─────────────
    const y2Spine = 346
    const y2Branch = 430

    fig.text(22, 272, '2. Post-LN', { size: 22, weight: 750, color: amberText })
    fig.text(146, 272, 'LayerNorm rescales main spine after each addition', {
        size: 18,
        color: c.textSecondary,
        weight: 500,
    })

    // Spine segments (interrupted by Norm boxes)
    fig.arrow(102, y2Spine, 266, y2Spine, { color: c.textMuted, width: 2.4, head: 7 })
    fig.arrow(298, y2Spine, 322, y2Spine, { color: amberMark, width: 2.6, head: 6.5 })
    fig.arrow(396, y2Spine, 540, y2Spine, { color: c.textMuted, width: 2.4, head: 7 })
    fig.arrow(572, y2Spine, 596, y2Spine, { color: amberMark, width: 2.6, head: 6.5 })
    fig.arrow(670, y2Spine, 694, y2Spine, { color: amberMark, width: 2.6, head: 6.5 })

    fig.text(422, y2Spine - 22, 'x₁', {
        size: 18,
        color: c.textSecondary,
        align: 'center',
        weight: 650,
    })
    fig.text(359, y2Spine - 33, 'on spine', {
        size: 17,
        color: amberText,
        align: 'center',
        weight: 600,
    })
    fig.text(633, y2Spine - 33, 'on spine', {
        size: 17,
        color: amberText,
        align: 'center',
        weight: 600,
    })

    // Sublayer 1 detour: Causal Attn
    forkDownPath(132, y2Spine, 158, y2Branch, amberMark)
    pill(212, y2Branch, 108, 40, 'Attn', amberMark, amberFill, amberText, 18)
    curvedUpArrow(266, y2Branch, 282, y2Spine, amberMark)

    // Sublayer 2 detour: FFN
    forkDownPath(442, y2Spine, 468, y2Branch, green)
    pill(506, y2Branch, 76, 40, 'FFN', green, greenFill, green, 18)
    curvedUpArrow(544, y2Branch, 556, y2Spine, green)

    // Endpoints, additions & inline Norm boxes on Post-LN spine
    pill(62, y2Spine, 82, 42, 'X [3,4]', blue, blueFill, blue, 18)
    plusNode(282, y2Spine, amberMark)
    pill(359, y2Spine, 74, 42, 'Norm', amberMark, amberFill, amberText, 18)
    plusNode(556, y2Spine, amberMark)
    pill(633, y2Spine, 74, 42, 'Norm', amberMark, amberFill, amberText, 18)
    pill(736, y2Spine, 82, 42, 'Y [3,4]', blue, blueFill, blue, 18)

    return fig.render()
}

export default create('dark')
