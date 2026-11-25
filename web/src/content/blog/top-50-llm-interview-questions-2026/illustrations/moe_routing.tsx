import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 430
export const alt =
    'Mixture-of-experts routing graph where a router selects two active experts while other experts remain stored in the serving system, then combines the selected outputs.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const soft = theme === 'light' ? 0.13 : 0.18

    // 1. Input Token node
    const tokX = 24
    const tokY = 178
    const tokW = 94
    const tokH = 66
    fig.rect(tokX, tokY, tokW, tokH, {
        fill: tint(blue, c.bg, soft),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 10,
    })
    fig.text(tokX + tokW / 2, tokY + 23, 'Token', {
        size: 15,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.math(tokX + tokW / 2, tokY + 46, 'x', { size: 15, color: c.textPrimary, align: 'center' })

    // 2. Router box with embedded top-2 score bars
    const rtrX = 152
    const rtrY = 132
    const rtrW = 160
    const rtrH = 158
    fig.arrow(tokX + tokW + 4, tokY + tokH / 2, rtrX - 4, tokY + tokH / 2, {
        color: blue,
        width: 1.75,
        head: 7,
    })

    fig.rect(rtrX, rtrY, rtrW, rtrH, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.08 : 0.12),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 10,
    })
    fig.text(rtrX + rtrW / 2, rtrY + 22, 'Router · top-2', {
        size: 14.5,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Mini horizontal router score bars inside Router box
    const scores = [
        { name: 'E1', val: 0.67, active: true },
        { name: 'E2', val: 0.33, active: true },
        { name: 'E3', val: 0.08, active: false },
        { name: 'E4', val: 0.04, active: false },
    ]
    scores.forEach((sc, i) => {
        const sy = rtrY + 48 + i * 25
        fig.text(rtrX + 16, sy + 7, sc.name, {
            size: 12,
            weight: sc.active ? 700 : 500,
            color: sc.active ? green : c.textMuted,
            mono: true,
        })
        fig.rect(rtrX + 42, sy, 68, 13, {
            fill: tint(c.textMuted, c.bg, 0.14),
            radius: 3,
        })
        fig.rect(rtrX + 42, sy, Math.max(5, 68 * sc.val), 13, {
            fill: sc.active ? green : c.textMuted,
            opacity: sc.active ? 1 : 0.45,
            radius: 3,
        })
        fig.text(rtrX + 148, sy + 7, sc.active ? sc.val.toFixed(2) : 'off', {
            size: 11.5,
            weight: sc.active ? 700 : 500,
            color: sc.active ? green : c.textMuted,
            align: 'right',
            mono: true,
        })
    })

    // 3. Resident Expert Bank (all 4 stored in memory; top 2 active, bottom 2 idle)
    const bankX = 374
    const bankY = 30
    const bankW = 210
    const bankH = 368
    fig.rect(bankX, bankY, bankW, bankH, {
        fill: tint(c.textMuted, c.bg, 0.05),
        stroke: c.border,
        strokeWidth: 1.25,
        radius: 12,
    })
    fig.text(bankX + bankW / 2, bankY + 20, 'Resident memory (all 4 stored)', {
        size: 12.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    const experts = [
        { id: 'Expert 1', status: 'Active · w = 0.67', active: true, weight: '0.67' },
        { id: 'Expert 2', status: 'Active · w = 0.33', active: true, weight: '0.33' },
        { id: 'Expert 3', status: 'Stored · inactive', active: false, weight: '' },
        { id: 'Expert 4', status: 'Stored · inactive', active: false, weight: '' },
    ]

    const expX = bankX + 18
    const expW = bankW - 36
    const expH = 66
    const expGap = 15

    experts.forEach((ex, i) => {
        const ey = bankY + 42 + i * (expH + expGap)
        const midY = ey + expH / 2

        if (ex.active) {
            fig.rect(expX, ey, expW, expH, {
                fill: tint(green, c.bg, soft),
                stroke: green,
                strokeWidth: 1.8,
                radius: 9,
            })
            fig.text(expX + expW / 2, ey + 23, ex.id, {
                size: 14.5,
                weight: 700,
                color: green,
                align: 'center',
            })
            fig.text(expX + expW / 2, ey + 46, ex.status, {
                size: 12.5,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })

            // Solid active routing arrow from Router -> Expert
            const srcY = rtrY + 55 + i * 25
            fig.arrow(rtrX + rtrW + 4, srcY, expX - 4, midY, {
                color: green,
                width: 2.2,
                head: 7,
            })
        } else {
            fig.rect(expX, ey, expW, expH, {
                fill: tint(c.textMuted, c.bg, 0.06),
                stroke: c.border,
                strokeWidth: 1.25,
                radius: 9,
            })
            fig.path(
                `M${expX + 5} ${ey + 5}H${expX + expW - 5}V${ey + expH - 5}H${expX + 5}Z`,
                { color: c.textMuted, width: 1, dash: '4 4', opacity: 0.5 },
            )
            fig.text(expX + expW / 2, ey + 23, ex.id, {
                size: 14.5,
                weight: 600,
                color: c.textMuted,
                align: 'center',
            })
            fig.text(expX + expW / 2, ey + 46, ex.status, {
                size: 12,
                color: c.textMuted,
                align: 'center',
            })

            // Faint dashed unselected wire
            const srcY = rtrY + 55 + i * 25
            fig.line(rtrX + rtrW + 4, srcY, expX - 8, midY, {
                color: c.textMuted,
                width: 1,
                dash: '3 4',
                opacity: 0.45,
            })
        }
    })

    // 4. Weighted Output Sum node
    const outX = 632
    const outY = 104
    const outW = 148
    const outH = 104
    const e1MidY = bankY + 42 + expH / 2
    const e2MidY = bankY + 42 + (expH + expGap) + expH / 2

    fig.arrow(expX + expW + 4, e1MidY, outX - 4, outY + 34, {
        color: green,
        width: 2.2,
        head: 7,
    })
    fig.arrow(expX + expW + 4, e2MidY, outX - 4, outY + 70, {
        color: green,
        width: 2.2,
        head: 7,
    })

    fig.rect(outX, outY, outW, outH, {
        fill: tint(green, c.bg, soft),
        stroke: green,
        strokeWidth: 1.8,
        radius: 10,
    })
    fig.text(outX + outW / 2, outY + 24, 'Weighted sum', {
        size: 14.5,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.math(outX + outW / 2, outY + 56, '0.67\\,E_1(x)', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
    })
    fig.math(outX + outW / 2, outY + 82, '+\\,0.33\\,E_2(x)', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
    })

    // Bottom contrast badge under right side
    fig.text(outX + outW / 2, 266, 'Active compute:', {
        size: 12.5,
        weight: 600,
        color: green,
        align: 'center',
    })
    fig.text(outX + outW / 2, 286, '2 of 4 experts run', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(outX + outW / 2, 322, 'Memory footprint:', {
        size: 12.5,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(outX + outW / 2, 342, 'All 4 stay resident', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
