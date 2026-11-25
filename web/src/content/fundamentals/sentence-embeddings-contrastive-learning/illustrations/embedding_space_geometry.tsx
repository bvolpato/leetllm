import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'Equal-scale unit circle showing contrastive separation for a RoPE query at 0 degrees. The positive RoPE guide stays near the query at 6 degrees (cosine 0.995). A hard negative starts crowded at -6 degrees (cosine 0.995) and rotates along a sweeping arc to 120 degrees (cosine -0.500). Companion cosine bars on the right contrast before and after separation.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    // --- Left: Equal-aspect Unit Circle with crisp sweep arc (-6° -> 120°) ---
    fig.text(28, 20, 'Unit-circle geometry (equal x₁, y₁ scale)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const cx = 204
    const cy = 212
    const R = 122
    const pt = (deg: number, r = R): [number, number] => {
        const rad = (deg * Math.PI) / 180
        return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
    }

    // Subtle axes & unit circle
    fig.line(cx - R - 20, cy, cx + R + 24, cy, { color: c.borderSubtle, width: 1.25 })
    fig.line(cx, cy - R - 20, cx, cy + R + 20, { color: c.borderSubtle, width: 1.25 })
    fig.circle(cx, cy, R, { stroke: c.borderLight, width: 1.5, fill: 'none' })
    fig.circle(cx, cy, 4, { fill: c.textPrimary })

    // Shaded angular separation wedge from 0° to 120°
    const [p120x, p120y] = pt(120, R)
    const [p0x, p0y] = pt(0, R)
    fig.path(`M${cx} ${cy} L${p0x.toFixed(1)} ${p0y.toFixed(1)} A${R} ${R} 0 0 0 ${p120x.toFixed(1)} ${p120y.toFixed(1)} Z`, {
        fill: warm,
        fillOpacity: theme === 'light' ? 0.08 : 0.11,
        color: 'none',
    })

    // Dashed initial crowded negative (-6°)
    const [n0x, n0y] = pt(-6)
    fig.line(cx, cy, n0x, n0y, { color: red, width: 2, dash: '5 4' })
    fig.circle(n0x, n0y, 5, { fill: c.bg, stroke: red, width: 2.25 })

    // Vectors: query (0°), positive (+6°), target negative (120°)
    const [qx, qy] = pt(0)
    const [px, py] = pt(6)
    const [n1x, n1y] = pt(120)

    fig.arrow(cx, cy, qx, qy, { color: purple, width: 2.5, head: 7 })
    fig.arrow(cx, cy, px, py, { color: green, width: 2.5, head: 7 })
    fig.arrow(cx, cy, n1x, n1y, { color: warm, width: 2.75, head: 7.5 })

    // Sweeping outer rotation arc from -6° counter-clockwise to 120° (radius R + 18)
    const arcR = R + 18
    const [aStartX, aStartY] = pt(-6, arcR)
    const [aEndX, aEndY] = pt(116, arcR)
    const [aTipX, aTipY] = pt(120, arcR)
    fig.path(
        `M${aStartX.toFixed(1)} ${aStartY.toFixed(1)} A${arcR} ${arcR} 0 0 0 ${aEndX.toFixed(1)} ${aEndY.toFixed(1)}`,
        { color: warm, width: 2, dash: '5 3' },
    )
    fig.arrow(aEndX, aEndY, aTipX, aTipY, { color: warm, width: 2, head: 6.5 })

    // Direct vector labels with clean leader separation (zero bunching!)
    fig.text(cx + R + 24, cy - 38, 'p⁺ · +6° (pos)', {
        size: 13,
        weight: 700,
        color: green,
    })
    fig.line(px + 2, py - 2, cx + R + 20, cy - 34, { color: green, width: 1, opacity: 0.7 })

    fig.text(cx + R + 24, cy + 2, 'q · 0°', {
        size: 13,
        weight: 700,
        color: purple,
    })

    fig.text(cx + R + 16, cy + 38, 'n before · −6°', {
        size: 13,
        weight: 700,
        color: red,
    })
    fig.line(n0x + 3, n0y + 4, cx + R + 13, cy + 34, { color: red, width: 1, opacity: 0.7 })

    fig.text(n1x - 10, n1y - 16, 'n target · 120°', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'right',
    })
    fig.text(cx + 58, cy - R - 24, 'push −6° → 120°', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Vertical divider
    fig.line(446, 22, 446, 366, { color: c.borderSubtle, width: 1 })

    // --- Right: Aligned Cosine Similarity Before vs Target ---
    fig.text(472, 20, 'Cosine alignment with query q', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const barLeft = 492
    const barRight = 724
    const bx = (v: number) => barLeft + ((v + 1) / 2) * (barRight - barLeft)
    const zeroX = bx(0)
    const bTop = 66
    const bBot = 304

    for (const tick of [-1, -0.5, 0, 0.5, 1]) {
        const tx = bx(tick)
        const isZero = tick === 0
        fig.line(tx, bTop, tx, bBot, {
            color: isZero ? c.textSecondary : c.borderSubtle,
            width: isZero ? 1.75 : 1,
            dash: isZero ? undefined : '3 3',
        })
        fig.text(tx, bBot + 16, tick < 0 ? `−${Math.abs(tick).toFixed(1)}` : tick.toFixed(1), {
            size: 12,
            color: isZero ? c.textPrimary : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text((barLeft + barRight) / 2, bBot + 36, 'cos θ = q · d', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    const drawSignedBar = (
        y: number,
        title: string,
        val: number,
        valText: string,
        color: string,
    ) => {
        fig.text(barLeft, y - 22, title, { size: 13, weight: 700, color })
        const xStart = Math.min(zeroX, bx(val))
        const w = Math.abs(bx(val) - zeroX)
        fig.rect(xStart, y - 10, w, 22, {
            fill: tint(color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: color,
            strokeWidth: 1.4,
            radius: 4,
        })
        const txtX = val >= 0 ? xStart + w - 6 : xStart + 6
        fig.text(txtX, y + 1, valText, {
            size: 12,
            weight: 700,
            color: theme === 'light' ? '#ffffff' : '#0b0c10',
            align: val >= 0 ? 'right' : 'left',
            mono: true,
        })
    }

    drawSignedBar(108, 'Positive q · p⁺ (6° · held close)', 0.995, '+0.995', green)
    drawSignedBar(188, 'Hard neg before (−6° · crowded)', 0.995, '+0.995', red)
    drawSignedBar(268, 'Hard neg target (120° · separated)', -0.5, '−0.500', warm)

    return fig.render()
}

export default create
