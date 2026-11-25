import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 430
export const alt =
    'A three-token categorical example aligns draft q, target p, and their shared overlap on a common 0-to-0.6 scale. Blue shows shared mass min(q, p), red shows draft excess on noon (0.2), and gold shows target deficit on dawn (0.2). Adding the 0.2 normalized residual r = [0, 1, 0] to the shared overlap reconstructs target probabilities p = [0.4, 0.5, 0.1] exactly.'

export const q = [0.6, 0.3, 0.1]
export const p = [0.4, 0.5, 0.1]
export const residual = p.map((value, i) => Math.max(0, value - q[i]!))
const tokens = ['noon', 'dawn', 'dusk']

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    // Match <figcaption> semantics exactly: blue = shared, red = excess, gold = deficit
    const shared = fig.tone('blue')
    const excess = fig.tone('red')
    const deficit = fig.tone('warm')

    const sharedFill = tint(shared, c.bg, isLight ? 0.2 : 0.34)
    const excessFill = tint(excess, c.bg, isLight ? 0.22 : 0.36)
    const deficitFill = tint(deficit, c.bg, isLight ? 0.22 : 0.36)

    // Compact legend swatches at top
    const legY = 20
    const legItems = [
        { x: 136, label: 'shared min(q, p)', color: shared, fill: sharedFill },
        { x: 334, label: 'excess [q − p]₊', color: excess, fill: excessFill },
        { x: 526, label: 'deficit [p − q]₊', color: deficit, fill: deficitFill },
    ]
    for (const item of legItems) {
        fig.rect(item.x, legY - 7, 14, 14, {
            fill: item.fill,
            stroke: item.color,
            strokeWidth: 1.5,
            radius: 3,
        })
        fig.text(item.x + 21, legY, item.label, {
            size: 14.5,
            weight: 600,
            color: item.color,
        })
    }

    const x0 = 186
    const plotW = 420
    const scale = plotW / 0.6
    const topGridY = 68
    const botGridY = 304
    const rowYs = [82, 162, 242]
    const barH = 24

    // Scale header ticks and vertical gridlines
    for (const tick of [0, 0.2, 0.4, 0.6]) {
        const x = x0 + tick * scale
        fig.line(x, topGridY, x, botGridY, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.25 : 1,
        })
        fig.text(x, topGridY - 15, tick.toFixed(1), {
            size: 14.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    tokens.forEach((tok, i) => {
        const y = rowYs[i]!
        const qi = q[i]!
        const pi = p[i]!
        const ov = Math.min(qi, pi)
        const ex = Math.max(0, qi - pi)
        const df = Math.max(0, pi - qi)
        const tokColor = i === 0 ? excess : i === 1 ? deficit : shared

        // Token name
        fig.text(24, y + 26, tok, {
            size: 17.5,
            weight: 700,
            color: tokColor,
        })

        // q / p numeric column
        fig.text(168, y + barH / 2, `q ${qi.toFixed(1)}`, {
            size: 14.5,
            weight: 600,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
        fig.text(168, y + barH + 6 + barH / 2, `p ${pi.toFixed(1)}`, {
            size: 14.5,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })

        // q bar = shared + excess
        fig.rect(x0, y, ov * scale, barH, {
            fill: sharedFill,
            stroke: shared,
            strokeWidth: 1.5,
            radius: 4,
        })
        if (ex > 0) {
            fig.rect(x0 + ov * scale + 2, y, ex * scale - 2, barH, {
                fill: excessFill,
                stroke: excess,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(x0 + qi * scale + 12, y + barH / 2, `−${ex.toFixed(1)} reject`, {
                size: 14.5,
                weight: 700,
                color: excess,
                mono: true,
            })
        }

        // p bar = shared + deficit
        const yP = y + barH + 6
        fig.rect(x0, yP, ov * scale, barH, {
            fill: sharedFill,
            stroke: shared,
            strokeWidth: 1.5,
            radius: 4,
        })
        if (df > 0) {
            fig.rect(x0 + ov * scale + 2, yP, df * scale - 2, barH, {
                fill: deficitFill,
                stroke: deficit,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(x0 + pi * scale + 12, yP + barH / 2, `+${df.toFixed(1)} residual`, {
                size: 14.5,
                weight: 700,
                color: deficit,
                mono: true,
            })
        }
    })

    // Hairline separator & exact reconstruction summary (frameless, real TeX)
    const sepY = 324
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })

    fig.text(24, sepY + 24, 'Shared = 0.80', {
        size: 15,
        weight: 700,
        color: shared,
        mono: true,
    })
    fig.text(210, sepY + 24, 'Reject Z = 0.20', {
        size: 15,
        weight: 700,
        color: excess,
        mono: true,
    })
    fig.arrow(388, sepY + 24, 434, sepY + 24, { color: deficit, width: 1.8, head: 6 })
    fig.text(448, sepY + 24, 'r = [0, 1, 0] (all dawn)', {
        size: 15,
        weight: 700,
        color: deficit,
        mono: true,
    })

    fig.math(
        24,
        sepY + 58,
        '\\min(q,p) + Z\\,r = [0.40, 0.30, 0.10] + 0.20\\,[0, 1, 0] = [0.40, 0.50, 0.10] = p',
        { size: 16, color: c.textPrimary },
    )
    fig.text(
        24,
        sepY + 88,
        'Naive resample on rejection shifts target to [0.48, 0.40, 0.12]',
        { size: 14.5, color: c.textSecondary },
    )

    return fig.render()
}

export default create('dark')
